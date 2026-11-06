/**
 * Every `ValueDomain`'s pattern against the XSD's own validator, on the raw lexical forms the
 * attribute CHECK reads (slice A2, the lexical half).
 *
 * Oracle: a second implementation. libxml2's XML Schema validator (`xmllintValidate`) judges each
 * probe value as the value of an attribute, or the text of a simple-content element, of a kind
 * the pinned XSDs declare, against the type the XSD gives it; the grammar judges the same value by
 * its domain's regex, `lexical ~ pattern`, with no whitespace step before it: the operator's ruling
 * of 2026-11-05 makes the one attribute CHECK `lexical ~ ValuePattern.at(AttributeGrammar.at(...))`
 * on the stored form, so a domain whose XSD type collapses or replaces whitespace must accept the
 * forms XML Schema normalizes (spec-alignment §9.6). Every probe goes through `&#9;`, `&#10;` and
 * `&#13;` for tab, line feed and carriage return, so the validator sees the raw form, not the
 * parser's attribute-value normalization of it.
 *
 * The probes (named variants, doctrine rule 6), per (version, domain, XSD type) group, on one
 * representative (kind, attribute) of the group: each value of the domain's enumeration and of the
 * XSD type's (from the XSD inventory); samples of the domain's regex, drawn from a seeded stream;
 * boundary forms of the type's datatype family; and of the first valid values, outer spaces, a
 * leading tab, a trailing line feed, a flipped case and a repeat; an empty value; an over-long
 * value. A group is a (version, domain, XSD type) because a domain shared by attributes of two XSD
 * types must match both. Every disagreement is recorded below ({@link recorded}) with its reason,
 * or the test fails; a record no disagreement matches fails too.
 *
 * Gated on the XSD cache. Each run writes a folder of its own, `work/xsd-lexical-*`
 * (`#pantry/test/scratch-directory.ts`), removed when the run ends: the batches, `probes.tsv`
 * (every probe) and `differences.tsv` (every disagreement, with the record that classifies it). A
 * fixed folder let two runs at once remove each other's batches under xmllint.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { matching } from "@grizzle/testing/pattern";
import { floorSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { Console, Effect, FileSystem, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import type { ValueDomain } from "#pantry/grammar/attributes.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import type { ValueFacet } from "#pantry/grammar/domains.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { loadXsd, nameKey, xsdContents } from "#pantry/test/gen/grammar.ts";
import type { XsdName } from "#pantry/test/gen/grammar.ts";
import { scratchDirectory } from "#pantry/test/scratch-directory.ts";
import { driverImports, driverNamespace, writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import type { ProbeDeclaration, XsdOracle } from "#pantry/test/xsd-catalog.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { attributeDeclarations, textTypes } from "#pantry/vocab/inventory/attributes.ts";
import { globalKinds } from "#pantry/vocab/inventory/vocabularies.ts";
import type { Domain, ValueType } from "#pantry/vocab/inventory/types.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";
import type { XsdMessage } from "#pantry/xml/oracle.ts";

/**
 * The timeout, in milliseconds, for the one test: one `xmllint` run per version over every probe,
 * after reading both versions' XSDs with the shared reader. To be set from a measurement; 300 s
 * until then. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const testTimeoutMs = 300_000;

/**
 * Whether the XSD cache holds every pin.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The services the test reads and spawns with.
 */
const TestLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  OracleLayer.pipe(Layer.provide(NodeServices.layer)),
);

/**
 * The namespace an attribute handle's prefix stands for, for the handles a probe writes with a
 * prefix.
 */
const attributePrefixes: ReadonlyMap<string, string> = new Map([
  ["xml", "http://www.w3.org/XML/1998/namespace"],
  ["xsi", "http://www.w3.org/2001/XMLSchema-instance"],
  ["xlink", "http://www.w3.org/1999/xlink"],
]);

/**
 * How a probe element is written so its value is judged against a kind's declaration:
 *
 * - `global`: the kind's own element, which a schema declares globally;
 * - `typed`: a driver's probe element of the kind's named type;
 * - `framed`: the kind's element, declared locally with an anonymous type, inside an element of a
 *   parent kind it may stand under, written as a `global` or `typed` target.
 */
type Target =
  | { readonly _tag: "global"; readonly name: XsdName }
  | { readonly _tag: "typed"; readonly probe: string; readonly type: XsdName }
  | {
      readonly _tag: "framed";
      readonly child: XsdName;
      readonly parent: Exclude<Target, { readonly _tag: "framed" }>;
    };

/**
 * What a probe judges: a kind's attribute, by its handle, or the text of a simple-content kind.
 */
type Subject = { readonly _tag: "attribute"; readonly name: string } | { readonly _tag: "text" };

/**
 * One probe: the group it stands for, the value and the variant that drew it.
 */
interface Probe {
  readonly domain: ValueDomain;
  readonly group: string;
  readonly kind: string;
  readonly subject: Subject;
  readonly target: Target;
  readonly value: string;
  readonly variant: string;
  readonly version: SchemaVersion;
  /**
   * The XSD type's whitespace class, which the `folded` diagnostic applies.
   */
  readonly whiteSpace: string;
}

/**
 * What `xmllint` said of a probe's value: valid, invalid, `undeclared` when the probed type
 * declares no attribute of that name, or `unjudged` when a framed element was not expected where
 * its frame put it, so no declaration judged its value.
 */
type XsdOutcome = "invalid" | "undeclared" | "unjudged" | "valid";

/**
 * One disagreement: the probe, both verdicts, and whether the grammar accepts the value once its
 * whitespace class is applied (so the pattern does not fold the class in, spec-alignment §9.6).
 */
interface Disagreement {
  readonly folded: boolean;
  readonly grammar: boolean;
  readonly messages: string;
  readonly probe: Probe;
  readonly xsd: XsdOutcome;
}

/**
 * Why a disagreement is not an open defect, or which defect it is:
 *
 * - `reading`: a spec reading departs from the XSD on purpose;
 * - `gap`: a representation gap the operator has not ruled (spec-alignment §5), which no pattern over
 *   the value alone can state;
 * - `pending`: a question of the specification's own text that a named seat is settling;
 * - `xmllint`: libxml2 departs from XML Schema, shown by the {@link proofs} case `proof` names, which
 *   the second test runs, so a libxml2 that stops departing fails it;
 * - `defect`: a defect of the grammar, reported to its owner.
 */
type Reason =
  | { readonly _tag: "defect"; readonly owner: string; readonly why: string }
  | { readonly _tag: "gap"; readonly gap: string; readonly why: string }
  | { readonly _tag: "pending"; readonly who: string; readonly why: string }
  | { readonly _tag: "reading"; readonly reading: number; readonly why: string }
  | { readonly _tag: "xmllint"; readonly proof: string; readonly why: string };

/**
 * One recorded disagreement: what it matches, each field a pattern over the disagreement's own,
 * and why.
 */
interface Recorded {
  readonly domain?: RegExp;
  readonly folded?: boolean;
  readonly kind?: RegExp;
  readonly reason: Reason;
  readonly subject?: RegExp;
  readonly value?: RegExp;
  readonly variant?: RegExp;
  readonly versions?: readonly SchemaVersion[];
  readonly xsd: XsdOutcome;
}

/**
 * Every disagreement between the domains and the XSD's validator, classified.
 */
const recorded: readonly Recorded[] = [
  {
    kind: /^m:/u,
    reason: {
      _tag: "reading",
      reading: 2,
      why: "MathML 3's xref names an id of its document (an xs:IDREF, §5.4.2), where QTI's bundled MathML XSD types it xs:anySimpleType, so text that is no IDREF is refused",
    },
    subject: /^xref$/u,
    xsd: "valid",
  },
  {
    kind: /^qti-match-table-entry$/u,
    reason: {
      _tag: "reading",
      reading: 8,
      why: "the XSD types target-value as the base-type names; the reading makes it a value of the outcome's base type, so the domain admits any normalized string here",
    },
    subject: /^target-value$/u,
    xsd: "invalid",
  },
  {
    domain: /\(reading [^)]*\b7\b/u,
    reason: {
      _tag: "reading",
      reading: 7,
      why: "a typed QTI value in an attribute is exact, so outer whitespace makes it invalid where xs:double would collapse it",
    },
    variant: /^(?:outer-spaces|leading-tab|trailing-line-feed|trailing-carriage-return)$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b16\b/u,
    reason: { _tag: "reading", reading: 16, why: "normal-maximum is greater than zero" },
    value: /^[+-]?0(?:\.0*)?$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b18\b/u,
    reason: {
      _tag: "reading",
      reading: 18,
      why: "an order interaction's min-choices is at least 1",
    },
    value: /^[+-]?0+$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b85\b/u,
    reason: {
      _tag: "reading",
      reading: 85,
      why: "an xi:include's parse is xml: every included fragment is treated as parsed XML (information model §2.12)",
    },
    value: /^text$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b39\b/u,
    reason: {
      _tag: "reading",
      reading: 39,
      why: 'SSML 1.1 says speak\'s version "must have the value "1.1"", where the XSD types it xs:NMTOKEN, so every other NMTOKEN is refused',
    },
    value: /^(?![\t\n\r ]*1\.1[\t\n\r ]*$)/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b42\b/u,
    reason: {
      _tag: "reading",
      reading: 42,
      why: "SSML 1.1 makes each of voice's languages an Extended Language Range (RFC 4647, 2.2), where the XSD types the list xs:NMTOKENS, so an NMTOKEN that is no such range is refused",
    },
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b46\b/u,
    reason: { _tag: "reading", reading: 46, why: "a count is a signed 64-bit integer" },
    value: /^9{20,}$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b120\b/u,
    reason: {
      _tag: "reading",
      reading: 120,
      why: "the information model says \"'n' must be a positive integer\" (§5.72, Index), where the XSD's xs:int member admits 0 and negatives",
    },
    value: /^[\t\n\r ]*(?:[+-]?0+|-[0-9]+)[\t\n\r ]*$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b123\b/u,
    reason: {
      _tag: "reading",
      reading: 123,
      why: 'the information model says of bdo "The auto value must not be specified" (§5.11), which the XSD lists and defaults to',
    },
    value: /^auto$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b12[45]\b/u,
    reason: {
      _tag: "reading",
      reading: 124,
      why: 'a media URL "must contain a valid non-empty URL potentially surrounded by spaces" (information model §5.9.1, §5.135.1, §5.163.2, §5.166.1, §5.166.9; reading 125 for track), where the XSD\'s URLDType is any xs:normalizedString',
    },
    value: /^[\t\n\r ]*$/u,
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b129\b/u,
    reason: {
      _tag: "reading",
      reading: 129,
      why: "xml:lang, lang and srclang are BCP 47 language tags (XML 1.0 §2.12; information model §4.1.4, §5.15.3, §5.163.3), where the XSD types lang and srclang xs:normalizedString and xml:lang RFC 3066's xs:language or empty; the values set aside are those RFC 5646's ABNF refuses, which attributes.test.ts checks against its own recogniser",
    },
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b9\b/u,
    kind: /^h1$/u,
    reason: {
      _tag: "reading",
      reading: 9,
      why: "the Schematron's RULE ARIA ROLE 1b says \"The 'h1' tag may have an ARIA role value of 'heading' or 'tab' or 'presentation' only\" (ASI binding §5.3.1, whose section 5 is normative), where the XSD lists 74 ARIA roles for h1's role",
    },
    subject: /^role$/u,
    value: /^(?!(?:heading|tab|presentation)$)/u,
    xsd: "valid",
  },
  {
    kind: /^m:cn$/u,
    reason: {
      _tag: "reading",
      reading: 2,
      why: 'MathML 3 says a cn\'s base "is a base 10 positive integer" (§4.2.1.3), the positive-integer notation of §2.1.5.1, where the XSD leaves the attribute untyped',
    },
    subject: /^base$/u,
    xsd: "valid",
  },
  {
    reason: {
      _tag: "gap",
      gap: "RG2 (reading 47)",
      why: "a QName is valid only when its prefix is bound in scope and, for xsi:type, when it names a type; in-scope bindings are no closed fold, so no pattern over the value states it",
    },
    subject: /^(?:xsi:type|role)$/u,
    value: /^(?:[\p{L}_][\p{L}\p{N}._-]*:)?[\p{L}_][\p{L}\p{N}._-]*$/u,
    xsd: "invalid",
  },
  {
    reason: {
      _tag: "xmllint",
      proof: "digits",
      why: "libxml2 refuses an xs:integer or xs:decimal of more than 24 digits; XML Schema bounds neither, and reading 45 keeps integers unbounded",
    },
    variant: /^over-long-digits$/u,
    xsd: "invalid",
  },
  {
    reason: {
      _tag: "xmllint",
      proof: "whitespace",
      why: "libxml2 does not collapse the whitespace of xs:int and xs:unsignedLong values (xs:integer, xs:decimal and xs:nonNegativeInteger it does), though whiteSpace is collapse, fixed, for every built-in numeric type (Part 2, 3.3.13 to 3.3.23)",
    },
    variant: /^(?:outer-spaces|leading-tab|trailing-line-feed|trailing-carriage-return)$/u,
    xsd: "invalid",
  },
  {
    reason: {
      _tag: "xmllint",
      proof: "exponent",
      why: "libxml2 accepts 1e and 1E as xs:double, whose lexical space needs digits after the exponent mark (Part 2, 3.2.5.1)",
    },
    value: /^1[eE]$/u,
    xsd: "valid",
  },
  {
    reason: {
      _tag: "xmllint",
      proof: "nan",
      why: "libxml2 accepts NaN under minInclusive 0; NaN is incomparable, so no bound holds of it (Part 2, 3.2.5)",
    },
    value: /^NaN$/u,
    xsd: "valid",
  },
  {
    reason: {
      _tag: "xmllint",
      proof: "emptyLists",
      why: "libxml2 accepts an empty xs:IDREFS and xs:NMTOKENS, whose minLength is 1 (Part 2, 3.3.10 and 3.3.5)",
    },
    variant: /^empty$/u,
    xsd: "valid",
  },
  {
    domain: /base64/u,
    reason: {
      _tag: "xmllint",
      proof: "base64",
      why: 'libxml2 accepts xs:base64Binary text that holds characters outside the base64 alphabet (", &, <, é), which Part 2, 3.2.16 refuses',
    },
    xsd: "valid",
  },
  {
    domain: /anyURI/u,
    reason: {
      _tag: "reading",
      reading: 71,
      why: "xs:anyURI is XML Schema 1.0's, RFC 2396 as RFC 2732 amends it after XLink's escaping; libxml2 judges by RFC 3986 with departures of its own and accepts %zz, a second #, and, once escaped, a space or tab before a second #, which RFC 2396's URI-reference refuses",
    },
    xsd: "valid",
  },
  {
    domain: /\(reading [^)]*\b2\b/u,
    reason: {
      _tag: "reading",
      reading: 2,
      why: 'MathML 3 §2.1.5.1 writes positive-integer as "a string of decimal-digits", integer as "an optional "-" ... followed by a string of decimal digits" and number as "an optional prefix of "-" ... followed by an unsigned number", with no +, which xs:positiveInteger, xs:integer and xs:decimal admit; unsigned-integer\'s + and -0, which reading 73 would admit, libxml2 2.9.13 refuses too, so it records no difference',
    },
    value: /^[\t\n\r ]*\+/u,
    xsd: "valid",
  },
];

/**
 * The roots each version's XSD set is read from with the shared reader: the driver's ASI,
 * content-packaging and usage data imports, which reach every pinned vocabulary.
 */
const rootsOf = (version: SchemaVersion): readonly SourcePath[] => [
  driverImports[version][0][1],
  driverImports[version][1][1],
  "usagedata/imsqti_usagedatav3p0_v1p0.xsd",
];

/**
 * Apply a whitespace class, as XML Schema's `whiteSpace` facet does (Part 2, 4.3.6).
 *
 * @param lexical - The raw form.
 * @param whiteSpace - The class.
 * @returns The normalized form.
 */
const normalized = (lexical: string, whiteSpace: string): string => {
  if (whiteSpace === "preserve") {
    return lexical;
  }

  const replaced = lexical.replaceAll(/[\t\n\r]/gu, " ");

  return whiteSpace === "replace" ? replaced : replaced.trim().replaceAll(/ +/gu, " ");
};

/**
 * Escape a value for an attribute between double quotes, or for element text, so the validator
 * reads it raw: markup characters as entity references, and tab, line feed and carriage return as
 * character references, which the parser's normalizations leave alone.
 *
 * @param value - The value.
 * @returns The escaped text.
 */
const escaped = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#9;")
    .replaceAll("\n", "&#10;")
    .replaceAll("\r", "&#13;");

/**
 * The enumeration values a resolved XSD domain lists, through its list items and union members.
 *
 * @param domain - The domain.
 * @returns The values, each once.
 */
const enumerationsOf = (domain: Domain): readonly string[] => {
  const own = domain.facets
    .filter(({ facet }) => facet === "enumeration")
    .map(({ value }) => value);

  switch (domain._tag) {
    case "atomic": {
      return own;
    }
    case "list": {
      return [...own, ...enumerationsOf(domain.item)];
    }
    case "union": {
      return [...own, ...domain.members.flatMap(enumerationsOf)];
    }
    default: {
      return domain satisfies never;
    }
  }
};

/**
 * Boundary forms of each datatype family, keyed by the family's primitive or built-in local name:
 * the forms where lexical spaces differ in practice (signs, leading zeros, exponents, the special
 * doubles, case, separators).
 */
const families = {
  anyURI: [
    "http://example.com/a?b#c",
    "a/b.xml",
    "#f",
    "a b",
    "%zz",
    "%20",
    "é.xml",
    "http://[::1]/",
    "a#b#c",
  ],
  boolean: ["true", "false", "1", "0", "TRUE", "yes"],
  date: [
    "2024-01-01",
    "2024-13-01",
    "2024-02-30",
    "-0001-01-01",
    "2024-01-01Z",
    "2024-01-01+14:00",
    "24-01-01",
  ],
  dateTime: [
    "2024-01-01T00:00:00",
    "2024-01-01T24:00:00",
    "2024-01-01T00:00:00Z",
    "2024-01-01 00:00:00",
  ],
  decimal: [
    "0",
    "-0",
    "+0",
    "1",
    "-1",
    "+1",
    "007",
    "1.5",
    ".5",
    "5.",
    "1.0",
    "1e2",
    "0x1",
    "1,5",
    "2147483648",
  ],
  double: [
    "0",
    "0.0",
    "-0.0",
    ".5",
    "5.",
    "1.5",
    "+1.5",
    "1e3",
    "1E-3",
    "1e",
    "INF",
    "-INF",
    "+INF",
    "NaN",
    "nan",
    "1,5",
  ],
  duration: ["P1D", "PT1H", "P1Y2M3DT4H5M6.7S", "-P1D", "P", "PT", "1D"],
  float: ["0", "1.5", "INF", "-INF", "NaN", "1e39"],
  integer: [
    "0",
    "-0",
    "+0",
    "1",
    "-1",
    "+1",
    "007",
    "2147483647",
    "2147483648",
    "-2147483649",
    "99999999999999999999",
    "1.0",
    "1e2",
    "1 2",
  ],
  language: ["en", "en-US", "x-klingon", "i-default", "en_US", "123", "abcdefghi", "a-b-c-d-e-f-g"],
  name: ["a", "a.b", "_a", "a-b", "a1", "1a", "-a", ".a", "a:b", "a b", "é"],
  string: ["a", "a b", "a  b", "é", "ä€𝄞", "a\tb", "a\nb", "<", '"', "&"],
} satisfies Readonly<Record<string, readonly string[]>>;

/**
 * {@link families}, looked up by a family name read off a domain.
 */
const familyTable: ReadonlyMap<string, readonly string[]> = new Map(Object.entries(families));

/**
 * The built-ins and primitives a resolved XSD domain reads, through its list items and union
 * members: an atomic domain's first built-in and its primitive.
 *
 * @param domain - The domain.
 * @returns The names.
 */
const builtinsOf = (domain: Domain): readonly string[] => {
  switch (domain._tag) {
    case "atomic": {
      return [domain.builtin, domain.primitive];
    }
    case "list": {
      return builtinsOf(domain.item);
    }
    case "union": {
      return domain.members.flatMap(builtinsOf);
    }
    default: {
      return domain satisfies never;
    }
  }
};

/**
 * The family a built-in or primitive's boundary forms are drawn from.
 *
 * @param local - The built-in's or primitive's local name.
 * @returns The family's key in {@link families}.
 */
const familyOf = (local: string): string => {
  if (/integer|Integer|^int$|long|short|byte/u.test(local)) {
    return "integer";
  }

  if (/^(?:NCName|ID|IDREF|IDREFS|NMTOKEN|NMTOKENS|Name|QName|ENTITY)$/u.test(local)) {
    return "name";
  }

  return familyTable.has(local) ? local : "string";
};

/**
 * The families a domain's samples are drawn from: its primitive's, and the XSD type's built-ins'
 * and primitives'.
 *
 * @param domain - The grammar's domain.
 * @param xsd - The XSD type's resolved domain, when the inventory holds it.
 * @returns The family names.
 */
const familiesOf = (domain: ValueDomain, xsd: Option.Option<Domain>): readonly string[] => [
  ...new Set(
    [domain.primitive, ...Option.match(xsd, { onNone: () => [], onSome: builtinsOf })].map(
      familyOf,
    ),
  ),
];

/**
 * The longest pattern the pattern generator is asked to draw from: a compiled pattern spelling the
 * XML name classes runs to thousands of characters, and drawing from it builds every class it
 * names, so such a domain is probed by its families and enumerations alone.
 */
const drawablePattern = 400;

/**
 * Whether a pattern repeats without a bound outside its classes and escapes (`*`, `+` or `{n,}`),
 * which the pattern generator refuses: every repetition it draws states its bound (`matching`,
 * `@grizzle/testing/pattern`). It refuses only after building every class the pattern names, and
 * XML's `Char` class, astral plane included, is over a million characters, so a refusal took
 * seconds per domain (xs:anySimpleType, xs:normalizedString, URLDType and alphabet.datatype). Such
 * a domain is probed by its families and enumerations alone, as a refused draw left it.
 *
 * @param pattern - A domain's compiled pattern.
 * @returns Whether it repeats without a bound.
 */
const repeatsUnbounded = (pattern: string): boolean =>
  /[*+]|\{\d+,\}/u.test(pattern.replaceAll(/\\.|\[(?:\\.|[^\\\]])*\]/gsu, ""));

/**
 * Read a numeric literal as a number: `INF`, `+INF` and `-INF` as the infinities, anything else as
 * JavaScript's `Number` reads it after trimming, so `NaN` and every non-number read `NaN`.
 *
 * @param text - The literal.
 * @returns The number.
 */
const numberOf = (text: string): number => {
  const trimmed = text.trim();
  if (trimmed === "INF" || trimmed === "+INF") {
    return Number.POSITIVE_INFINITY;
  }

  return trimmed === "-INF" ? Number.NEGATIVE_INFINITY : Number(trimmed);
};

/**
 * Whether a value holds a domain's residual facets, the bounds on a float, double or non-integer
 * decimal the pattern does not state: compared as numbers, `INF`, `-INF` and `NaN` as JavaScript
 * reads them, so `NaN` holds no bound.
 *
 * @param facets - The residual facets.
 * @param raw - The value as written.
 * @returns Whether every facet holds.
 */
const facetsHold = (facets: readonly ValueFacet[], raw: string): boolean => {
  const value = numberOf(raw);

  return facets.every(({ facet, value: bound }) => {
    const limit = numberOf(bound);
    switch (facet) {
      case "maxExclusive": {
        return value < limit;
      }
      case "maxInclusive": {
        return value <= limit;
      }
      case "minExclusive": {
        return value > limit;
      }
      case "minInclusive": {
        return value >= limit;
      }
      default: {
        return facet satisfies never;
      }
    }
  });
};

/**
 * The compiled regex of each domain's pattern, by handle: a pattern that spells the XML name
 * classes runs to thousands of characters, so each is compiled once.
 */
const compiled = new Map<string, RegExp>();

/**
 * Compile a domain's pattern once.
 *
 * @param domain - The domain.
 * @returns Its regex, with the flags a JavaScript host reads it with.
 */
const regexOf = (domain: ValueDomain): RegExp => {
  const held = compiled.get(domain.handle);
  if (held !== undefined) {
    return held;
  }

  const regex = new RegExp(domain.pattern, patternFlags);
  compiled.set(domain.handle, regex);

  return regex;
};

/**
 * Whether the grammar accepts a raw value under a domain: its pattern, then its residual facets.
 *
 * @param domain - The domain.
 * @param raw - The value as written.
 * @returns Whether it is accepted.
 */
const accepts = (domain: ValueDomain, raw: string): boolean =>
  regexOf(domain).test(raw) && facetsHold(domain.facets, raw);

/**
 * The whitespace class a resolved XSD domain states, `preserve` for a union, which states none.
 *
 * @param xsd - The domain, when the inventory holds it.
 * @returns The class.
 */
const whiteSpaceOf = (xsd: Option.Option<Domain>): string =>
  Option.match(xsd, {
    onNone: () => "preserve",
    onSome: (domain) =>
      domain.facets.find(({ facet }) => facet === "whiteSpace")?.value ?? "preserve",
  });

/**
 * Flip a value's case: lower-case when it has no lower-case letter, upper-case otherwise.
 *
 * @param value - The value.
 * @returns The flipped value.
 */
const flipped = (value: string): string =>
  value === value.toUpperCase() ? value.toLowerCase() : value.toUpperCase();

/**
 * The samples drawn from each domain's pattern, by handle: drawing from a pattern with a large
 * class takes seconds, and many groups share one domain.
 */
const drawnSamples = new Map<string, readonly string[]>();

/**
 * Draw six samples of a domain's pattern from a stream seeded by its handle, once per domain;
 * none for a pattern the generator refuses or one longer than {@link drawablePattern}.
 *
 * @param domain - The domain.
 * @returns The samples.
 */
const drawnOf = (domain: ValueDomain): readonly string[] => {
  const held = drawnSamples.get(domain.handle);
  if (held !== undefined) {
    return held;
  }

  const drawn =
    domain.pattern.length > drawablePattern || repeatsUnbounded(domain.pattern)
      ? []
      : Result.getOrElse(
          Result.try(() =>
            sample(matching(regexOf(domain)), floorSeed(`lexical ${domain.handle}`), 6),
          ),
          () => [],
        );
  drawnSamples.set(domain.handle, drawn);

  return drawn;
};

/**
 * Draw the values a group is probed with, each with the variant that drew it.
 *
 * @param domain - The grammar's domain.
 * @param xsd - The XSD type's resolved domain, when the inventory holds it.
 * @returns The values, each once, first variant kept.
 */
const valuesOf = (
  domain: ValueDomain,
  xsd: Option.Option<Domain>,
): readonly (readonly [variant: string, value: string])[] => {
  const theirs = Option.match(xsd, { onNone: () => [], onSome: enumerationsOf }).map(
    (value) => ["xsd-enumeration", value] as const,
  );
  const drawn = drawnOf(domain).map((value) => ["pattern-sample", value] as const);
  const family = familiesOf(domain, xsd).flatMap((name) =>
    (familyTable.get(name) ?? []).map((value) => [`family-${name}`, value] as const),
  );
  const bases = [...theirs, ...drawn, ...family]
    .map(([, value]) => value)
    .filter((value) => value !== "" && accepts(domain, value))
    .slice(0, 3);
  const varied = bases.flatMap((value) => [
    ["outer-spaces", ` ${value} `] as const,
    ["leading-tab", `\t${value}`] as const,
    ["trailing-line-feed", `${value}\n`] as const,
    ["trailing-carriage-return", `${value}\r`] as const,
    ["case-flipped", flipped(value)] as const,
    ["repeated", `${value} ${value}`] as const,
    ["inner-tab", `${value}\t${value}`] as const,
  ]);
  const seen = new Set<string>();

  return [
    ...theirs,
    ...drawn,
    ...family,
    ...varied,
    ["empty", ""] as const,
    ["over-long", "a".repeat(1100)] as const,
    ["over-long-digits", "9".repeat(400)] as const,
  ].filter(([, value]) => {
    const fresh = !seen.has(value);
    seen.add(value);

    return fresh;
  });
};

/**
 * Write an attribute of a probe: its name, with the namespace declaration a prefixed name needs
 * (`xml:` needs none), and its escaped value.
 *
 * @param name - The attribute's handle.
 * @param value - Its escaped value.
 * @returns The text, with its leading space.
 */
const attributeText = (name: string, value: string): string => {
  const colon = name.indexOf(":");
  if (colon === -1) {
    return ` ${name}="${value}"`;
  }

  const prefix = name.slice(0, colon);
  const declared =
    prefix === "xml" ? "" : ` xmlns:${prefix}="${attributePrefixes.get(prefix) ?? ""}"`;

  return `${declared} ${name}="${value}"`;
};

/**
 * Write an element with its namespace bound on itself.
 *
 * @param name - Its name.
 * @param rest - Its attributes' text.
 * @param body - Its content.
 * @returns The element.
 */
const elementText = (name: XsdName, rest: string, body: string): string =>
  name.namespace === ""
    ? `<${name.local}${rest}>${body}</${name.local}>`
    : `<e:${name.local} xmlns:e="${name.namespace}"${rest}>${body}</e:${name.local}>`;

/**
 * Write a target that needs no frame: the kind's global element, or the driver's probe element.
 *
 * @param target - The target.
 * @param rest - Its attributes' text.
 * @param body - Its content.
 * @returns The element.
 */
const plainElement = (
  target: Exclude<Target, { readonly _tag: "framed" }>,
  rest: string,
  body: string,
): string =>
  target._tag === "global"
    ? elementText(target.name, rest, body)
    : elementText({ local: target.probe, namespace: driverNamespace }, rest, body);

/**
 * The XML of one probe on one line: the target element carrying the value, framed when it must
 * be, every namespace declared on the element that uses it.
 *
 * @param probe - The probe.
 * @returns The line.
 */
const probeLine = (probe: Probe): string => {
  const value = escaped(probe.value);
  const attribute = probe.subject._tag === "text" ? "" : attributeText(probe.subject.name, value);
  const content = probe.subject._tag === "text" ? value : "";

  switch (probe.target._tag) {
    case "framed": {
      return plainElement(
        probe.target.parent,
        "",
        elementText(probe.target.child, attribute, content),
      );
    }
    case "global":
    case "typed": {
      return plainElement(probe.target, attribute, content);
    }
    default: {
      return probe.target satisfies never;
    }
  }
};

/**
 * The element a probe's verdict is read on, as `xmllint` names it, `{namespace}local`.
 *
 * @param target - The probe's target.
 * @returns The name.
 */
const judgedElement = (target: Target): string => {
  switch (target._tag) {
    case "framed": {
      return nameKey(target.child);
    }
    case "global": {
      return target.name.namespace === "" ? target.name.local : nameKey(target.name);
    }
    case "typed": {
      return nameKey({ local: target.probe, namespace: driverNamespace });
    }
    default: {
      return target satisfies never;
    }
  }
};

/**
 * `xmllint`'s outcome for one probe, and the messages that decided it.
 */
interface Outcome {
  readonly outcome: XsdOutcome;
  readonly said: string;
}

/**
 * Read `xmllint`'s outcome for one probe from the messages on its line.
 *
 * @param probe - The probe.
 * @param messages - The messages on its line.
 * @returns Its outcome, and the messages that decided it.
 */
const outcomeOf = (probe: Probe, messages: readonly XsdMessage[]): Outcome => {
  const element = judgedElement(probe.target);
  const attribute =
    probe.subject._tag === "attribute"
      ? Option.some(
          ((name: string) => {
            const colon = name.indexOf(":");

            return colon === -1
              ? name
              : `{${attributePrefixes.get(name.slice(0, colon)) ?? ""}}${name.slice(colon + 1)}`;
          })(probe.subject.name),
        )
      : Option.none<string>();
  const own = messages.filter(
    (message) =>
      Option.contains(message.element, element) &&
      (Option.isNone(attribute)
        ? Option.isNone(message.attribute) && /is not a valid value|^\[facet '/u.test(message.text)
        : Option.isSome(message.attribute) && Option.contains(attribute, message.attribute.value)),
  );
  const said = own.map(({ text }) => text).join(" | ");

  if (
    messages.some(
      (message) =>
        Option.contains(message.element, element) &&
        message.text.startsWith("This element is not expected."),
    )
  ) {
    return { outcome: "unjudged", said: "not expected in its frame" };
  }

  if (own.some(({ text }) => /^The attribute '[^']+' is not allowed\./u.test(text))) {
    return { outcome: "undeclared", said };
  }

  return { outcome: own.length === 0 ? "valid" : "invalid", said };
};

/**
 * Find the record a disagreement matches.
 *
 * @param disagreement - The disagreement.
 * @returns The first record that matches it, or `undefined`.
 */
const recordOf = (disagreement: Disagreement): Recorded | undefined => {
  const { folded, probe, xsd } = disagreement;
  const subject = probe.subject._tag === "text" ? "#text" : probe.subject.name;

  return recorded.find(
    (record) =>
      record.xsd === xsd &&
      (record.folded === undefined || record.folded === folded) &&
      (record.domain === undefined || record.domain.test(probe.domain.handle)) &&
      (record.kind === undefined || record.kind.test(probe.kind)) &&
      (record.subject === undefined || record.subject.test(subject)) &&
      (record.variant === undefined || record.variant.test(probe.variant)) &&
      (record.value === undefined || record.value.test(probe.value)) &&
      (record.versions === undefined || record.versions.includes(probe.version)),
  );
};

/**
 * Write a reason as one line.
 *
 * @param reason - The reason.
 * @returns Its tag, its reading or owner, and why.
 */
const reasonText = (reason: Reason): string => {
  switch (reason._tag) {
    case "defect": {
      return `defect (${reason.owner}): ${reason.why}`;
    }
    case "gap": {
      return `gap ${reason.gap}: ${reason.why}`;
    }
    case "pending": {
      return `pending (${reason.who}): ${reason.why}`;
    }
    case "reading": {
      return `reading ${String(reason.reading)}: ${reason.why}`;
    }
    case "xmllint": {
      return `xmllint (${reason.proof}): ${reason.why}`;
    }
    default: {
      return reason satisfies never;
    }
  }
};

/**
 * Write rows as TSV, each field's tabs and line breaks written as `\t`, `\n` and `\r`.
 *
 * @param header - The column names.
 * @param rows - The rows.
 * @returns The text.
 */
const tsv = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
  [header, ...rows]
    .map(
      (row) =>
        `${row
          .map((field) =>
            field
              .replaceAll("\t", String.raw`\t`)
              .replaceAll("\n", String.raw`\n`)
              .replaceAll("\r", String.raw`\r`),
          )
          .join("\t")}\n`,
    )
    .join("");

/**
 * Find how each kind of one version is written as a probe element.
 *
 * @param grammar - The composed grammar.
 * @param version - The version.
 * @returns Each kind's targets, and the probe elements the driver must declare.
 */
const targetsOf = Effect.fn("lexical.targetsOf")(function* targetsOf(
  grammar: ComposedGrammar,
  version: SchemaVersion,
) {
  const resolve = (namespace: string, local: string, parent: string): Option.Option<string> =>
    grammar.kinds.nodeKind.has(parent)
      ? grammar.kinds.resolve(namespace, local, parent)
      : Option.none();
  const names = new Map<string, XsdName>(
    grammar.kinds.elementName.rows.map((row) => [
      row.kind,
      { local: row.local, namespace: row.namespace },
    ]),
  );
  const globals = new Map<string, XsdName>();
  const contents = new Map<string, { readonly type: string; readonly name: XsdName }[]>();
  // A global declaration's kind is the one `globalKinds` lists under its name in the version, not
  // one read off where a wildcard admits it: spec reading 2 lets a wildcard admit MathML's root
  // alone, and every MathML global still declares its kind's attributes and text.
  const globalKindOf = new Map<string, string>(
    globalKinds
      .filter(({ versions }) => versions.includes(version))
      .flatMap(({ kind }) =>
        Option.toArray(grammar.kinds.elementName.lookup({ kind })).map(
          ({ local, namespace }) => [`{${namespace}}${local}`, kind] as const,
        ),
      ),
  );

  for (const root of rootsOf(version)) {
    const { set } = yield* loadXsd(root);
    for (const key of set.elements.keys()) {
      const name = {
        local: key.slice(key.indexOf("}") + 1),
        namespace: key.slice(1, key.indexOf("}")),
      };
      for (const kind of Option.toArray(Option.fromNullishOr(globalKindOf.get(key)))) {
        globals.set(kind, name);
      }
    }

    for (const [kind, held] of xsdContents(set, resolve).contents) {
      for (const found of Option.toArray(Option.fromNullishOr(names.get(kind)))) {
        contents.set(kind, [
          ...(contents.get(kind) ?? []),
          ...held.map(({ type }) => ({
            name: { local: found.local, namespace: found.namespace },
            type,
          })),
        ]);
      }
    }
  }

  const probes = new Map<string, ProbeDeclaration>();
  const plain = new Map<string, Exclude<Target, { readonly _tag: "framed" }>[]>();
  for (const [kind, held] of contents) {
    const global = globals.get(kind);
    const named = [...new Set(held.map(({ type }) => type).filter((type) => type !== "anonymous"))];
    const typed = (global === undefined || named.length > 1 ? named : []).map((type) => {
      const local = type.slice(type.indexOf("}") + 1);
      const namespace = type.slice(1, type.indexOf("}"));
      const probe = `probe-${String(probes.size)}-${local.replaceAll(/[^\w.-]/gu, "_")}`;
      const existing = [...probes.values()].find(
        (declared) => declared.type === local && declared.namespace === namespace,
      );
      if (existing === undefined) {
        probes.set(probe, { local: probe, namespace, type: local });
      }

      return {
        _tag: "typed" as const,
        probe: existing?.local ?? probe,
        type: { local, namespace },
      };
    });
    plain.set(kind, [
      ...(global === undefined ? [] : [{ _tag: "global" as const, name: global }]),
      ...typed,
    ]);
  }

  const targets = new Map<string, readonly Target[]>(plain);
  for (const [kind, held] of contents) {
    if ((plain.get(kind) ?? []).length === 0 && held.some(({ type }) => type === "anonymous")) {
      const parent = grammar.admission.rows.find(
        (row) =>
          row.version === version && row.child === kind && (plain.get(row.parent) ?? []).length > 0,
      );
      const frame = parent === undefined ? undefined : plain.get(parent.parent)?.[0];
      const child = held[0]?.name;
      if (frame !== undefined && child !== undefined) {
        targets.set(kind, [{ _tag: "framed", child, parent: frame }]);
      }
    }
  }

  return { probes: [...probes.values()], targets };
});

/**
 * One attribute or text row of the grammar in one version, with the XSD type the inventory
 * gives it.
 */
interface ProbedRow {
  readonly domain: string;
  readonly kind: string;
  readonly subject: Subject;
  readonly xsd: Option.Option<Domain>;
  readonly xsdType: Option.Option<ValueType>;
}

/**
 * The representative of one (version, domain, XSD type) group.
 */
interface Group {
  readonly domain: ValueDomain;
  readonly kind: string;
  readonly subject: Subject;
  readonly xsd: Option.Option<Domain>;
}

/**
 * Write a subject as the reports name it.
 *
 * @param subject - The subject.
 * @returns The attribute's handle, or `#text`.
 */
const subjectName = (subject: Subject): string =>
  subject._tag === "text" ? "#text" : subject.name;

/**
 * The inventory's attribute declarations, by `version kind name`.
 */
const declaredAttributes = new Map(
  attributeDeclarations.flatMap((row) =>
    row.versions.map((version) => [`${version} ${row.kind} ${row.name}`, row] as const),
  ),
);

/**
 * The inventory's text types, by `version kind`.
 */
const declaredTexts = new Map(
  textTypes.flatMap((row) =>
    row.versions.map((version) => [`${version} ${row.kind}`, row] as const),
  ),
);

/**
 * List the grammar's attribute and text rows of one version, each with the XSD type the inventory
 * gives it.
 *
 * @param grammar - The composed grammar.
 * @param version - The version.
 * @returns The rows.
 */
const rowsOf = (grammar: ComposedGrammar, version: SchemaVersion): readonly ProbedRow[] => {
  const attribute = (kind: string, name: string) =>
    Option.fromNullishOr(declaredAttributes.get(`${version} ${kind} ${name}`));
  const text = (kind: string) => Option.fromNullishOr(declaredTexts.get(`${version} ${kind}`));

  return [
    ...grammar.attributes.admission.rows
      .filter((row) => row.version === version)
      .map((row): ProbedRow => {
        const declared = attribute(row.kind, row.name);

        return {
          domain: row.domain,
          kind: row.kind,
          subject: { _tag: "attribute", name: row.name },
          xsd: declared.pipe(Option.map(({ domain }) => domain)),
          xsdType: declared.pipe(Option.map(({ type }) => type)),
        };
      }),
    ...grammar.attributes.text.rows
      .filter((row) => row.version === version)
      .map((row): ProbedRow => {
        const declared = text(row.kind);

        return {
          domain: row.domain,
          kind: row.kind,
          subject: { _tag: "text" },
          xsd: declared.pipe(Option.map(({ domain }) => domain)),
          xsdType: declared.pipe(Option.map(({ type }) => type)),
        };
      }),
  ];
};

/**
 * Draw every probe of both versions: one representative per (version, domain, XSD type) group,
 * each value of {@link valuesOf} on each of its kind's targets.
 *
 * @param grammar - The composed grammar.
 * @returns The probes, the rows no probe could stand for, and each version's probe elements.
 */
const probesOf = Effect.fn("lexical.probesOf")(function* probesOf(grammar: ComposedGrammar) {
  const domains = new Map(grammar.attributes.domains.map((domain) => [domain.handle, domain]));
  const probes: Probe[] = [];
  const unprobed: string[] = [];
  const declarations: Partial<Record<SchemaVersion, readonly ProbeDeclaration[]>> = {};

  for (const version of schemaVersions) {
    const { probes: declared, targets } = yield* targetsOf(grammar, version);
    const groups = new Map<string, Group>();
    declarations[version] = declared;

    for (const row of rowsOf(grammar, version)) {
      const domain = domains.get(row.domain);
      const where = `${version} ${row.kind} ${subjectName(row.subject)}`;
      const identity = Option.match(row.xsdType, {
        onNone: () => `layer ${subjectName(row.subject)}`,
        onSome: (type) => JSON.stringify(type),
      });
      const group = `${version} ${row.domain} ${identity}`;
      if (
        row.subject._tag === "attribute" &&
        openClasses.some((open) => open === subjectName(row.subject))
      ) {
        unprobed.push(`${where}: an open class, not a name`);
      } else if (domain === undefined) {
        unprobed.push(`${where}: domain ${row.domain} not in the roster`);
      } else if ((targets.get(row.kind) ?? []).length === 0) {
        unprobed.push(`${where}: no probe element for the kind`);
      } else if (!groups.has(group)) {
        groups.set(group, { domain, kind: row.kind, subject: row.subject, xsd: row.xsd });
      }
    }

    for (const [group, { domain, kind, subject, xsd }] of groups) {
      for (const target of targets.get(kind) ?? []) {
        for (const [variant, value] of valuesOf(domain, xsd)) {
          probes.push({
            domain,
            group,
            kind,
            subject,
            target,
            value,
            variant,
            version,
            whiteSpace: whiteSpaceOf(xsd),
          });
        }
      }
    }
  }

  return { declarations, probes, unprobed };
});

/**
 * Judge one version's probes: write them as one batch, validate it, and compare each probe's
 * outcome with the grammar's verdict.
 *
 * @param outputRoot - The run's folder, which the batches are written to.
 * @param oracle - The oracle's inputs.
 * @param version - The version.
 * @param probes - Its probes.
 * @returns One report line per probe, and the disagreements.
 */
const judgeBatch = Effect.fn("lexical.judgeBatch")(function* judgeBatch(
  outputRoot: string,
  oracle: XsdOracle,
  version: SchemaVersion,
  probes: readonly Probe[],
) {
  const fs = yield* FileSystem.FileSystem;
  const batchOf = (name: string, held: readonly Probe[]) =>
    Effect.as(
      fs.writeFileString(
        `${outputRoot}/${name}`,
        [`<d:batch xmlns:d="${driverNamespace}">`, ...held.map(probeLine), "</d:batch>", ""].join(
          "\n",
        ),
      ),
      `${outputRoot}/${name}`,
    );
  // An `xs:ID` value is unique in its document, so a probe of an ID domain stands alone in a
  // document of its own: in a shared batch a repeated value would be refused as a duplicate.
  const isId = (probe: Probe): boolean => Option.contains(probe.domain.identity, "ID");
  const shared = probes.filter((probe) => !isId(probe));
  const alone = probes.filter(isId);
  const files = [
    yield* batchOf(`batch-${version}.xml`, shared),
    ...(yield* Effect.all(
      alone.map((probe, at) => batchOf(`id-${version}-${String(at)}.xml`, [probe])),
    )),
  ];
  const placed = new Map<Probe, readonly [file: number, line: number]>([
    ...shared.map((probe, at) => [probe, [0, at + 2]] as const),
    ...alone.map((probe, at) => [probe, [at + 1, 2]] as const),
  ]);
  const verdicts = yield* xmllintValidate({
    catalog: oracle.catalog,
    paths: files,
    schema: oracle.drivers[version],
  });
  const byFile = verdicts.map((verdict) =>
    Map.groupBy(verdict._tag === "Valid" ? [] : verdict.messages, ({ line }) => line),
  );
  const broken = verdicts
    .flatMap((verdict) => (verdict._tag === "Valid" ? [] : verdict.messages))
    .filter(
      ({ line, source, text }) =>
        line === 1 ||
        (source === "parser" && /^\S+ error :/u.test(text) && !text.startsWith("validity error")),
    );
  if (broken.length > 0) {
    yield* Effect.die(
      new Error(
        `a batch of ${version} is not a batch of probes: ${JSON.stringify(broken.slice(0, 3))}`,
      ),
    );
  }

  const lines: (readonly string[])[] = [];
  const disagreements: Disagreement[] = [];
  for (const probe of probes) {
    const [file, line] = placed.get(probe) ?? [0, 0];
    const { outcome, said } = outcomeOf(probe, byFile[file]?.get(line) ?? []);
    const grammarAccepts = accepts(probe.domain, probe.value);

    lines.push([
      version,
      probe.kind,
      subjectName(probe.subject),
      probe.domain.handle,
      probe.variant,
      probe.value,
      outcome,
      grammarAccepts ? "accepts" : "refuses",
    ]);

    if (
      outcome === "undeclared" ||
      (outcome !== "unjudged" && (outcome === "valid") !== grammarAccepts)
    ) {
      disagreements.push({
        folded: accepts(probe.domain, normalized(probe.value, probe.whiteSpace)),
        grammar: grammarAccepts,
        messages: said,
        probe,
        xsd: outcome,
      });
    }
  }

  return { disagreements, lines };
});

/**
 * Write a disagreement as a line of `differences.tsv`.
 *
 * @param disagreement - The disagreement.
 * @param match - The record it matched, if any.
 * @returns The fields.
 */
const differenceLine = (
  disagreement: Disagreement,
  match: Recorded | undefined,
): readonly string[] => {
  const { folded, grammar: grammarAccepts, messages, probe, xsd } = disagreement;

  return [
    probe.version,
    probe.kind,
    subjectName(probe.subject),
    probe.domain.handle,
    probe.domain.primitive,
    probe.whiteSpace,
    probe.variant,
    probe.value.length > 80
      ? `${probe.value.slice(0, 20)}…(${String(probe.value.length)})`
      : probe.value,
    xsd,
    grammarAccepts ? "accepts" : "refuses",
    folded ? "accepts after its class" : "",
    match === undefined ? "UNRECORDED" : reasonText(match.reason),
    messages.slice(0, 300),
  ];
};

/**
 * The minimal schemas and instances that show each libxml2 departure a record names: every element
 * `e` of the instance is one probe, and `refused` lists the probes libxml2 refuses, each a value
 * XML Schema 1.0 Part 2 admits, or `accepted` the ones it accepts that Part 2 refuses.
 */
const proofs = {
  base64: {
    accepted: ['"', "&amp;", "é"],
    type: "xs:base64Binary",
  },
  digits: {
    refused: ["9".repeat(25), "9".repeat(400)],
    type: "xs:integer",
  },
  emptyLists: {
    accepted: [""],
    type: "xs:NMTOKENS",
  },
  exponent: {
    accepted: ["1e", "1E"],
    type: "xs:double",
  },
  nan: {
    accepted: ["NaN"],
    type: "nonNegativeDouble",
  },
  whitespace: {
    refused: [" 0 ", "&#9;0"],
    type: "xs:int",
  },
} as const;

/**
 * Write a proof's schema: a root `r` of `e` elements whose text is of the proof's type.
 *
 * @param type - The type, a built-in or `nonNegativeDouble` (xs:double, minInclusive 0).
 * @returns The schema's text.
 */
const proofSchema = (type: string): string =>
  [
    '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">',
    '  <xs:simpleType name="nonNegativeDouble"><xs:restriction base="xs:double"><xs:minInclusive value="0"/></xs:restriction></xs:simpleType>',
    `  <xs:element name="r"><xs:complexType><xs:sequence><xs:element name="e" type="${type}" maxOccurs="unbounded"/></xs:sequence></xs:complexType></xs:element>`,
    "</xs:schema>",
    "",
  ].join("\n");

describe.skipIf(!cached)("lexical.oracle.test.ts, the domains against xmllint", () => {
  layer(TestLayer, { excludeTestServices: true })("raw lexical forms", (it) => {
    it.effect(
      "every domain's pattern agrees with the XSD's validator on every probe, but as recorded",
      () =>
        Effect.gen(function* compareDomains() {
          const fs = yield* FileSystem.FileSystem;
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const outputRoot = yield* scratchDirectory("xsd-lexical-");

          const { declarations, probes, unprobed } = yield* probesOf(grammar);
          const oracle = yield* writeXsdOracle(`${outputRoot}/oracle`, declarations);
          // Each version's batch is its own xmllint process, so the two run at once.
          const judged = yield* Effect.all(
            schemaVersions.map((version) =>
              judgeBatch(
                outputRoot,
                oracle,
                version,
                probes.filter((probe) => probe.version === version),
              ),
            ),
            { concurrency: "unbounded" },
          );
          const disagreements = judged.flatMap((held) => held.disagreements);
          const matches = disagreements.map(recordOf);
          const used = new Set(matches);
          const stale = recorded.filter((record) => !used.has(record));
          const unrecorded = disagreements.filter((_, at) => matches[at] === undefined);

          yield* fs.writeFileString(
            `${outputRoot}/probes.tsv`,
            tsv(
              ["version", "kind", "subject", "domain", "variant", "value", "xmllint", "grammar"],
              judged.flatMap((held) => held.lines),
            ),
          );
          yield* fs.writeFileString(
            `${outputRoot}/differences.tsv`,
            tsv(
              [
                "version",
                "kind",
                "subject",
                "domain",
                "primitive",
                "whiteSpace",
                "variant",
                "value",
                "xmllint",
                "grammar",
                "folded",
                "record",
                "messages",
              ],
              disagreements.map((disagreement, at) => differenceLine(disagreement, matches[at])),
            ),
          );
          yield* fs.writeFileString(`${outputRoot}/unprobed.txt`, `${unprobed.join("\n")}\n`);
          yield* Console.log(
            [
              `lexical: ${String(probes.length)} probes over ${String(new Set(probes.map(({ group }) => group)).size)} (version, domain, XSD type) groups, ${String(new Set(probes.map(({ domain }) => domain.handle)).size)} domains; ${String(unprobed.length)} rows unprobed`,
              `  unjudged (a framed element not expected in its frame) ${String(judged.flatMap((held) => held.lines).filter((line) => line[6] === "unjudged").length)}`,
              `  disagreements ${String(disagreements.length)}, unrecorded ${String(unrecorded.length)}, stale records ${String(stale.length)}`,
            ].join("\n"),
          );

          assert.deepStrictEqual(
            unrecorded
              .map(
                ({ probe, xsd, grammar: grammarAccepts }) =>
                  `${probe.version} ${probe.kind}@${subjectName(probe.subject)} ${probe.domain.handle} ${probe.variant} ${JSON.stringify(probe.value.slice(0, 40))}: xmllint ${xsd}, grammar ${grammarAccepts ? "accepts" : "refuses"}`,
              )
              .slice(0, 200),
            [],
            "every disagreement is recorded",
          );
          assert.deepStrictEqual(
            stale.map(({ reason, xsd }) => `${xsd}: ${reasonText(reason)}`),
            [],
            "every record still matches a disagreement",
          );
        }).pipe(Effect.scoped),
      { timeout: testTimeoutMs },
    );
  });
});

describe.skipIf(!cached)("lexical.oracle.test.ts, libxml2's recorded departures", () => {
  layer(TestLayer, { excludeTestServices: true })("the proofs the records name", (it) => {
    it.effect("libxml2 still departs from XML Schema as each xmllint record says", () =>
      Effect.gen(function* proveDepartures() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("xsd-lexical-proofs-");
        const oracle = yield* writeXsdOracle(`${directory}/oracle`);
        const departed: string[] = [];

        for (const [name, proof] of Object.entries(proofs)) {
          const values: readonly string[] = "refused" in proof ? proof.refused : proof.accepted;

          yield* fs.writeFileString(`${directory}/${name}.xsd`, proofSchema(proof.type));
          yield* fs.writeFileString(
            `${directory}/${name}.xml`,
            ["<r>", ...values.map((value) => `<e>${value}</e>`), "</r>", ""].join("\n"),
          );

          const [verdict] = yield* xmllintValidate({
            catalog: oracle.catalog,
            paths: [`${directory}/${name}.xml`],
            schema: `${directory}/${name}.xsd`,
          });
          const refusedLines = new Set(
            verdict === undefined || verdict._tag === "Valid"
              ? []
              : verdict.messages.map(({ line }) => line),
          );
          for (const [at, value] of values.entries()) {
            const refused = refusedLines.has(at + 2);
            if (refused !== "refused" in proof) {
              departed.push(
                `${name}: ${value.slice(0, 30)} is ${refused ? "refused" : "accepted"}`,
              );
            }
          }
        }

        assert.deepStrictEqual(departed, [], "every recorded libxml2 departure still holds");
      }).pipe(Effect.scoped),
    );
  });
});
