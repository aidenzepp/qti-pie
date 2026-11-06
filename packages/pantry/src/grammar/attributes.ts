/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * The attribute grammar (review U1; fin.md §16, §17): `AttributeGrammar`, `ValueDomain`,
 * `ValueIdentity` and `TextDomain`, generated from the declarations the vocabulary leaves derive
 * from the pinned XSDs, and from nothing else but QTI's recorded spec readings.
 *
 * An element's attributes are one relation, `Attribute(node, at, name, lexical)`, and one CHECK
 * holds both admission and lexical validity:
 * `lexical ~ ValueDomain.pattern.at(AttributeGrammar.domain.at(version, kind, name))`. A name the
 * kind does not admit reads no domain, NULL, and the CHECK refuses it.
 *
 * - `AttributeGrammar` is (version, kind, name) → (domain, use, position): each attribute an element
 *   of a kind may carry in a version, the value domain it is read under, whether the kind requires
 *   it, and its position among the names the (version, kind) admits (D8), the coordinate a node's
 *   `attrs` set is over. `Required` is its side selected by `use = required`.
 * - `ValueDomain` is domain → (primitive, pattern, facets): one compiled lexical definition
 *   (`src/grammar/domains.ts`), the pattern an open-typed text payload. Each handle is one distinct
 *   definition.
 * - `ValueIdentity` is domain → identity, for the domains whose values are XML Schema's `ID`, `IDREF`
 *   or `IDREFS`, which the document's identity laws read. Most domains are none of them, so it is a
 *   relation of its own rather than a field.
 * - `TextDomain` is (version, kind) → domain: the domain of a simple-content kind's one text child.
 * - `Governor` is (version, kind, type) → governor, `GovernedAttribute` is (version, governor, name)
 *   → (domain, use, position), and `TypeText` is (version, type) → domain. An element whose
 *   `xsi:type` names a type derived from its kind's declared one is validated against that type, so
 *   its admitted and required attributes, their domains and its text's domain are the type's (XML
 *   Schema 1.0 Part 1, §3.3.4, clause 5.2.1; spec reading 84), and a foreign element a simple type
 *   governs admits the four `xsi:` names alone and holds text in the type's domain (§3.3.4, Element
 *   Locally Valid (Type), clause 3.1; spec reading 60). The (kind, type) pair is the governor, read
 *   in place of the kind wherever the element's attributes and text are, and the rules QTI's
 *   readings state stay its kind's: a reading applies by the element's name, never by its type
 *   ({@link admissionOf}, {@link textDomainOf}).
 *
 * A declaration's domain is the leaf's resolution of its XSD type (`Domain`), with a spec reading
 * applied where QTI reads the attribute otherwise ({@link specReadings}).
 */
import { Option, Result, Schema } from "effect";
import { closed, fin, idField, roster, valueField } from "#pantry/grammar/closed.ts";
import type {
  Closed,
  ClosedRelationError,
  IdField,
  Roster,
  ValueField,
} from "#pantry/grammar/closed.ts";
import {
  compile,
  domainPrimitives,
  identities,
  isEmptyDefinition,
  openCompiled,
} from "#pantry/grammar/domains.ts";
import type {
  CompiledDomain,
  DomainPrimitive,
  Identity,
  Reading,
} from "#pantry/grammar/domains.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { noType } from "#pantry/grammar/xsi.ts";
import { attributeDeclarations, openAttribute } from "#pantry/vocab/inventory/attributes.ts";
import type { Domain, Facet, ValueType } from "#pantry/vocab/inventory/types.ts";

/**
 * Whether the XSD requires an attribute.
 */
export type Use = "optional" | "required";

/**
 * The `Use` roster: whether an element of a kind must carry an attribute.
 */
export const uses = ["optional", "required"] as const satisfies readonly Use[];

/**
 * One value domain: its handle, the name of the type it was first compiled from, and its compiled
 * definition.
 */
export interface ValueDomain extends CompiledDomain {
  readonly handle: string;
}

/**
 * The domain every open name's lexical form is read under (fin.md, D2): `xs:anySimpleType`, every
 * value, whitespace preserved. No declaration governs an open name, so its value is kept as
 * written and no typed value is derived from it.
 */
export const openDomain: ValueDomain = { ...openCompiled, handle: openAttribute.type.type };

/**
 * The `BaseType` roster in code order: the code space of every base-type field, `BindingFit`'s and
 * `MappableBaseType`'s among them. Its members are the XSD's `BaseTypeDType` enumeration
 * (`attributes.test.ts` reads them from the leaf); its order is the roster's own, append-only.
 */
export const baseTypes: readonly string[] = [
  "boolean",
  "integer",
  "float",
  "string",
  "identifier",
  "uri",
  "duration",
  "point",
  "pair",
  "directedPair",
  "file",
];

/**
 * One attribute a kind declares in some schema versions: the leaf's `AttributeDeclaration`, or one
 * the composition states (the document layer's `xml:` and `xsi:` names and the open classes), each
 * with its XSD type and that type's resolved domain.
 */
export interface Declared {
  readonly domain: Domain;
  readonly kind: string;
  readonly name: string;
  readonly type: ValueType;
  readonly use: Use;
  readonly versions: readonly SchemaVersion[];
}

/**
 * The text type of one simple-content kind in some schema versions: the leaf's `TextType`.
 */
export interface DeclaredText {
  readonly domain: Domain;
  readonly kind: string;
  readonly type: ValueType;
  readonly versions: readonly SchemaVersion[];
}

/**
 * A governor: a named type an `xsi:type` may give an element of a kind in a version in place of
 * the kind's declared type, which then governs it (XML Schema 1.0 Part 1, §3.3.4, Element Locally
 * Valid (Element), clauses 4.3 and 5.2.1; spec reading 84), or a simple type that governs a foreign
 * element's text (spec reading 60). `governs` is its `TypeName` handle.
 */
export interface Governor {
  readonly governs: string;
  readonly kind: string;
  readonly version: SchemaVersion;
}

/**
 * One attribute an element of a kind carries under a governor: the governing type's own
 * declaration, or one the composition states for it, as {@link Declared} is for the kind.
 */
export interface GovernedDeclared extends Declared {
  readonly governs: string;
}

/**
 * Spell a governor's `Governor` handle: its kind and its governing type's `TypeName` handle, which
 * holds no space.
 *
 * @param governor - The governor's kind and type.
 * @param governor.governs - The governing type's handle.
 * @param governor.kind - The kind.
 * @returns The handle.
 */
export const governorHandle = ({
  governs,
  kind,
}: {
  readonly governs: string;
  readonly kind: string;
}): string => `${kind} ${governs}`;

/**
 * The text type of one named type with simple content in some schema versions: the leaf's
 * `TypeText`, keyed by the type's `TypeName` handle.
 */
export interface DeclaredTypeText {
  readonly domain: Domain;
  readonly owner: string;
  readonly type: ValueType;
  readonly versions: readonly SchemaVersion[];
}

/**
 * The largest signed 64-bit integer, the bound spec reading 46 holds a count to.
 */
const int64Max = "9223372036854775807";

/**
 * The least signed 64-bit integer.
 */
const int64Min = "-9223372036854775808";

/**
 * Replace a definition's facets of some names with others: a spec reading's narrowing.
 *
 * @param domain - The definition.
 * @param replace - The facets that take the place of every facet of their names.
 * @returns The definition with them.
 */
const withFacets = (domain: Domain, replace: readonly Facet[]): Domain => {
  const names = new Set(replace.map(({ facet }) => facet));

  return {
    ...domain,
    facets: [...domain.facets.filter(({ facet }) => !names.has(facet)), ...replace],
  };
};

/**
 * Narrow an integer definition to the signed 64-bit range, keeping a tighter bound it states, and
 * every integer member of a union likewise.
 *
 * @param domain - The definition.
 * @returns The narrowed definition.
 */
const toInt64 = (domain: Domain): Domain => {
  if (domain._tag === "union") {
    return { ...domain, members: domain.members.map(toInt64) };
  }

  if (domain._tag !== "atomic" || domain.primitive !== "decimal") {
    return domain;
  }

  const bound = (
    name: "maxInclusive" | "minInclusive",
    limit: string,
    tighter: (a: bigint, b: bigint) => boolean,
  ) => {
    const stated = domain.facets.find(({ facet }) => facet === name);

    return stated !== undefined && tighter(BigInt(stated.value), BigInt(limit))
      ? stated.value
      : limit;
  };

  return withFacets(domain, [
    { facet: "maxInclusive", value: bound("maxInclusive", int64Max, (a, b) => a < b) },
    { facet: "minInclusive", value: bound("minInclusive", int64Min, (a, b) => a > b) },
  ]);
};

/**
 * One QTI spec reading of an attribute's value (`docs/spec-readings.md`): the reading's number, the
 * kinds it reads the attribute on (none for every kind that declares it), the attribute, how its
 * whitespace is read, and the definition it reads the XSD's as.
 */
interface SpecReading {
  readonly kinds: Option.Option<readonly string[]>;
  readonly name: string;
  readonly reading: number;
  readonly read: (domain: Domain) => Domain;
  readonly whiteSpace: Reading;
}

/**
 * A reading of the attribute on the listed kinds.
 *
 * @param reading - The reading's number.
 * @param kinds - The kinds.
 * @param name - The attribute.
 * @param whiteSpace - How its whitespace is read.
 * @param read - The definition it reads the XSD's as.
 * @returns The reading.
 */
const on = (
  reading: number,
  kinds: readonly string[],
  name: string,
  whiteSpace: Reading,
  read: (domain: Domain) => Domain = (domain) => domain,
): SpecReading => ({ kinds: Option.some(kinds), name, read, reading, whiteSpace });

/**
 * `xs:string`'s definition, every value with its whitespace preserved: what spec reading 8 reads a
 * match table entry's `target-value` as before the overlay types it by the outcome's base type.
 */
const stringDomain: Domain = {
  _tag: "atomic",
  builtin: "string",
  facets: [{ facet: "whiteSpace", value: "preserve" }],
  patterns: [],
  primitive: "string",
};

/**
 * SSML 1.1's `speak/@version`, which "must have the value \"1.1\"" (SSML 1.1, §3.1.1): spec
 * reading 39 narrows the XSD's `version.datatype`, an `xs:NMTOKEN`, to that one value. The type's
 * `collapse` whitespace stays the XSD's.
 *
 * @param domain - The XSD's definition.
 * @returns It with the one enumeration value.
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#S3.1.1 | SSML 1.1, 3.1.1 speak Root Element}
 */
const ssmlVersion = (domain: Domain): Domain => ({
  ...domain,
  facets: [
    ...domain.facets.filter(({ facet }) => facet !== "enumeration"),
    { facet: "enumeration", value: "1.1" },
  ],
});

/**
 * An `xi:include`'s `parse`, which `XInclude.xsd` types `xi:parseType`, `xml` or `text`: spec
 * reading 85 narrows it to `xml`, since the information model says "all included fragments must be
 * treated as parsed xml" (§2.12, Items and Test Fragments). The type's `collapse` whitespace stays
 * the XSD's.
 *
 * @param domain - The XSD's definition.
 * @returns It with the one enumeration value.
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Main2p12 | QTI 3.0 information model, 2.12 Items and Test Fragments}
 */
const xmlParse = (domain: Domain): Domain => ({
  ...domain,
  facets: [
    ...domain.facets.filter(({ facet }) => facet !== "enumeration"),
    { facet: "enumeration", value: "xml" },
  ],
});

/**
 * An `xi:include`'s `accept` or `accept-language`, which `XInclude.xsd` types `xs:string`: spec
 * reading 118 narrows it to the characters an HTTP header holds, since XInclude says "Values
 * containing characters outside the range #x20 through #x7E must be flagged as fatal errors"
 * (XInclude 1.0 Second Edition, §3.1).
 *
 * @param domain - The XSD's definition.
 * @returns It with the pattern.
 * @see {@link https://www.w3.org/TR/xinclude/#include_element | XInclude 1.0, 3.1 xi:include Element}
 */
const httpHeaderText = (domain: Domain): Domain =>
  withFacets(domain, [{ facet: "pattern", value: "[ -~]*" }]);

/**
 * An Extended Language Range (RFC 4647, §2.2), `(1*8ALPHA / "*") *("-" (1*8alphanum / "*"))`, as
 * an XSD pattern, but for the two values SSML 1.1 §3.2.1 disallows, `und` and `zxx`, compared
 * without regard to ASCII case (RFC 4647, §2: language ranges "are to be treated as
 * case-insensitive"). A range of more than one subtag is never one of the two, whatever its first.
 */
const languageRange = (() => {
  const first = String.raw`[A-Za-z]{1,8}|\*`;
  const subtags = String.raw`(-([A-Za-z0-9]{1,8}|\*))+`;
  const single = [
    String.raw`\*`,
    String.raw`[A-Za-z]{1,2}`,
    String.raw`[A-Za-z]{4,8}`,
    String.raw`[A-TV-Ya-tv-y][A-Za-z]{2}`,
    String.raw`[Uu]([A-MO-Za-mo-z][A-Za-z]|[Nn][A-CE-Za-ce-z])`,
    String.raw`[Zz]([A-WYZa-wyz][A-Za-z]|[Xx][A-WYZa-wyz])`,
  ].join("|");

  return `((${first})${subtags}|${single})`;
})();

/**
 * SSML 1.1's `voice/@languages`, "either the empty string \"\" or a space-separated list of
 * languages", each "of the form \"language\" or \"language:accent\", where both language and
 * accent must be an Extended Language Range ... except that the values \"und\" and \"zxx\" are
 * disallowed" (SSML 1.1, §3.2.1): spec reading 42 gives each token of the XSD's `xs:NMTOKENS`
 * member that form, and keeps its empty-string member.
 *
 * A value is valid only where both the Recommendation and its schema admit it: a conforming SSML
 * document or fragment adheres to the Recommendation "including the constraints expressed in the"
 * Core Schema of Appendix D (§2.2.1 and §2.2.2), and "This appendix is normative". That schema's
 * `languages.datatype` is the same union (`ssml/synthesis-nonamespace.xsd` lines 338 to 340, as
 * in the W3C's own copy), and an NMTOKEN holds no `*`, since `*` is no XML name character. So the
 * `*` subtag an Extended Language Range allows is refused: `*`, `en-*` and `*-US` meet the range
 * pattern and fail the token's `xs:NMTOKEN` pattern, which the union keeps.
 *
 * @param domain - The XSD's `languages.datatype`, a union of `xs:NMTOKENS` and the empty string.
 * @returns The union with each list token narrowed.
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#S3.2.1 | SSML 1.1, 3.2.1 voice Element}
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#S2.2.2 | SSML 1.1, 2.2.2 Conforming Stand-Alone Speech Synthesis Markup Language Documents}
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#AppD | SSML 1.1, Appendix D, Schema for the Speech Synthesis Markup Language}
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647#section-2.2 | RFC 4647, 2.2 Extended Language Range}
 */
const ssmlLanguages = (domain: Domain): Domain =>
  domain._tag === "union"
    ? {
        ...domain,
        members: domain.members.map((member) =>
          member._tag === "list"
            ? {
                ...member,
                item: {
                  ...member.item,
                  patterns: [...member.item.patterns, [`${languageRange}(:${languageRange})?`]],
                },
              }
            : member,
        ),
      }
    : domain;

/**
 * The counts spec reading 46 holds to the signed 64-bit range, on every kind that declares them.
 */
const counts = [
  "max-choices",
  "min-choices",
  "max-associations",
  "min-associations",
  "match-max",
  "match-min",
  "max-plays",
  "min-plays",
] as const;

/**
 * MathML 3's notation for the three integer types (§2.1.5.1, "Syntax notation used in the MathML
 * specification"), as XSD patterns over the value after its whitespace is collapsed:
 *
 * - `unsigned-integer`, "a string of decimal-digits, representing a non-negative integer";
 * - `positive-integer`, "a string of decimal-digits, but not consisting solely of "0"s (U+0030),
 *   representing a positive integer";
 * - `integer`, "an optional "-" (U+002D), followed by a string of decimal digits, and representing an
 *   integer".
 *
 * Spec reading 2 follows them over the XSD's types, `m:unsigned-integer`, `m:positive-integer` and
 * `m:integer`, which are `xs:unsignedLong`, `xs:positiveInteger` and `xs:integer`
 * (`mathml3-presentation.xsd` lines 93, 133 and 96, as the RelaxNG's `mathml3-presentation.rnc`
 * lines 60, 75 and 61 are) and so admit a leading `+`, and `-0` for the first (spec reading 73). A
 * value meets both the notation and its type, so the pattern narrows the type's lexical space and
 * keeps its bounds and its `collapse`: §2.1.5.1 asks only that "leading and trailing whitespace in
 * attribute values should be avoided".
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter2.html#id.2.1.5.1 | MathML 3, 2.1.5.1 Syntax notation used in the MathML specification}
 */
const mathmlNotations: ReadonlyMap<string, string> = new Map([
  ["m:unsigned-integer", "[0-9]+"],
  ["m:positive-integer", "[0-9]*[1-9][0-9]*"],
  ["m:integer", "-?[0-9]+"],
]);

/**
 * The MathML attributes of a notation type whose own row in the Recommendation states another
 * notation, which spec reading 2 leaves to the type: `scriptlevel`, `( "+" | "-" )?
 * unsigned-integer` (MathML 3 §3.3.4.2, `mstyle`'s attributes, which `math` takes too), where a
 * sign increments or decrements the level, the language of `xs:integer` itself.
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter3.html#presm.mstyle.attrs | MathML 3, 3.3.4.2 Attributes (mstyle)}
 */
const ownNotations: ReadonlySet<string> = new Set(["scriptlevel"]);

/**
 * Spec reading 2's attribute readings: each MathML attribute of a notation type
 * ({@link mathmlNotations}), but {@link ownNotations}, on every kind that declares it, read with
 * the notation's pattern beside its type's.
 */
const mathmlNotationReadings: readonly SpecReading[] = [
  ...Map.groupBy(
    attributeDeclarations.filter(
      ({ kind, name, type }) =>
        kind.startsWith("m:") && mathmlNotations.has(type.type) && !ownNotations.has(name),
    ),
    ({ name, type }) => `${name} ${type.type}`,
  ).values(),
].flatMap((declarations) => {
  const [first] = declarations;
  const pattern = first === undefined ? undefined : mathmlNotations.get(first.type.type);

  return first === undefined || pattern === undefined
    ? []
    : [
        on(2, [...new Set(declarations.map(({ kind }) => kind))], first.name, "xsd", (domain) => ({
          ...domain,
          patterns: [...domain.patterns, [pattern]],
        })),
      ];
});

/**
 * The attribute readings of `docs/spec-readings.md`, the only places the grammar departs from the
 * XSD's declarations, each stating its reading's number:
 *
 * - 2: a MathML attribute of an integer notation type takes the notation's pattern (MathML 3
 *   §2.1.5.1): `length` digits only, `columnspan`, `rowspan` and `selection` digits not all zero,
 *   `position`, `shift` and `index` an optional `-` and digits ({@link mathmlNotationReadings}).
 * - 7: a typed QTI value in an attribute is exact, outer whitespace invalid: its listed attributes
 *   read no whitespace class.
 * - 8: a match table entry's `target-value` is a value of the outcome's base type, not a base-type
 *   name: any text, typed by the overlay.
 * - 15: a `variable-identifier-ref` names an outcome declaration, an identifier and not an `IDREF`.
 * - 16: `normal-maximum` is greater than zero.
 * - 17: an item's or a test's rubric block's `view` lists at least one view, the information model's
 *   "A list from an enumerated value set" of a characteristic of multiplicity [1] (§5.120.2 and
 *   §5.160.1), where the XSD's list admits none. An outcome declaration's `view` (§4.5.4, [0..1])
 *   keeps the XSD's list.
 * - 18: an order or graphic-order interaction's `min-choices` is at least 1.
 * - 39: an SSML `speak/@version` is `1.1`.
 * - 42: an SSML `voice/@languages` holds language ranges, `und`, `zxx` and `*` refused.
 * - 46: a count, and `figures`, is a signed 64-bit integer.
 * - 76: an `xi:include`'s `parse` is `xml` ({@link xmlParse}).
 * - 111: an `xi:include`'s `accept` and `accept-language` hold characters from #x20 to #x7E alone
 *   ({@link httpHeaderText}).
 * - 83: a position object interaction's `min-choices` is at least 1.
 *
 * Reading 14, restated, follows the XSD (a text-entry interaction's `response-identifier` and
 * `string-identifier` are `IDREF`s), so it states nothing here. The readings that add an attribute
 * to a kind or take one away are {@link readingSpellings} and {@link readingRefusals}.
 */
export const specReadings: readonly SpecReading[] = [
  on(7, ["qti-map-entry"], "map-key", "exact"),
  on(7, ["qti-map-entry", "qti-area-map-entry"], "mapped-value", "exact"),
  on(7, ["qti-mapping", "qti-area-mapping"], "lower-bound", "exact"),
  on(7, ["qti-mapping", "qti-area-mapping"], "upper-bound", "exact"),
  on(
    7,
    ["qti-mapping", "qti-area-mapping", "qti-match-table", "qti-interpolation-table"],
    "default-value",
    "exact",
  ),
  on(7, ["qti-interpolation-table-entry"], "target-value", "exact"),
  on(7, ["qti-interpolation-table-entry"], "source-value", "exact"),
  on(7, ["ud:mapping"], "defaultValue", "exact"),
  on(7, ["ud:mapping"], "lowerBound", "exact"),
  on(7, ["ud:mapping"], "upperBound", "exact"),
  on(7, ["ud:mapEntry"], "mappedValue", "exact"),
  on(8, ["qti-match-table-entry"], "target-value", "exact", () => stringDomain),
  on(15, ["qti-outcome-declaration"], "variable-identifier-ref", "xsd", (domain) =>
    domain._tag === "atomic" && domain.builtin === "IDREF"
      ? { ...domain, builtin: "NCName" }
      : domain,
  ),
  on(16, ["qti-outcome-declaration"], "normal-maximum", "xsd", (domain) => ({
    ...domain,
    facets: [
      ...domain.facets.filter(({ facet }) => facet !== "minInclusive"),
      { facet: "minExclusive", value: "0" },
    ],
  })),
  on(17, ["qti-rubric-block", "qti-rubric-block.test"], "view", "xsd", (domain) =>
    withFacets(domain, [{ facet: "minLength", value: "1" }]),
  ),
  on(
    18,
    ["qti-order-interaction", "qti-graphic-order-interaction"],
    "min-choices",
    "xsd",
    (domain) => withFacets(domain, [{ facet: "minInclusive", value: "1" }]),
  ),
  on(92, ["qti-position-object-interaction"], "min-choices", "xsd", (domain) =>
    withFacets(domain, [{ facet: "minInclusive", value: "1" }]),
  ),
  on(85, ["xi:include"], "parse", "xsd", xmlParse),
  on(118, ["xi:include"], "accept", "xsd", httpHeaderText),
  on(118, ["xi:include"], "accept-language", "xsd", httpHeaderText),
  on(39, ["ssml:speak"], "version", "xsd", ssmlVersion),
  on(42, ["ssml:voice"], "languages", "xsd", ssmlLanguages),
  ...[...counts, "figures"].map((name): SpecReading => ({
    kinds: name === "figures" ? Option.some(["qti-round-to", "qti-equal-rounded"]) : Option.none(),
    name,
    read: toInt64,
    reading: 46,
    whiteSpace: "xsd",
  })),
  ...mathmlNotationReadings,
];

/**
 * The spec readings of one kind's attribute, in the order {@link specReadings} lists them.
 *
 * @param kind - The kind.
 * @param name - The attribute.
 * @returns The readings that apply.
 */
const readingsOf = (kind: string, name: string): readonly SpecReading[] =>
  specReadings.filter(
    (reading) =>
      reading.name === name &&
      Option.match(reading.kinds, { onNone: () => true, onSome: (kinds) => kinds.includes(kind) }),
  );

/**
 * A second spelling a spec reading admits beside a declared attribute: the declared name, the
 * name admitted beside it, and the reading.
 */
export interface ReadingSpelling {
  readonly declared: string;
  readonly name: string;
  readonly reading: number;
}

/**
 * The spellings spec readings admit beside a declared attribute, on every kind that declares it,
 * with its type, use and versions: reading 10's `aria-keyshortcuts`, ARIA's spelling, beside the
 * XSD's `aria-keyshorts`, which the empty element families declare. Neither document outranks the
 * other there, so both are accepted and the one written is kept (reading 1).
 *
 * The admission is explicit, a closed name, rather than the open `no-namespace` name the empty
 * families' `##any` wildcard would read it as, since spec reading 90 takes that open class away
 * from every element the Schematron's extension rules cover, the empty families among them.
 */
export const readingSpellings: readonly ReadingSpelling[] = [
  { declared: "aria-keyshorts", name: "aria-keyshortcuts", reading: 10 },
];

/**
 * An attribute a spec reading refuses on a kind whose XSD declares it, and the reading.
 */
export interface ReadingRefusal {
  readonly kind: string;
  readonly name: string;
  readonly reading: number;
}

/**
 * The declared attributes spec readings refuse: reading 85's `xpointer` on `xi:include`, which
 * `XInclude.xsd` declares and the information model forbids ("when using an XML binding, the
 * xpointer mechanism defined by the XInclude specification MUST NOT be used", §2.12). No wildcard
 * of `xi:include` admits a name in no namespace (`##other`), so a refused `xpointer` is refused
 * outright, never read as an open name.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Main2p12 | QTI 3.0 information model, 2.12 Items and Test Fragments}
 */
export const readingRefusals: readonly ReadingRefusal[] = [
  { kind: "xi:include", name: "xpointer", reading: 85 },
];

/**
 * Apply the spec readings that change which attributes a kind admits to a vocabulary's
 * declarations: drop each one {@link readingRefusals} refuses, and add each spelling
 * {@link readingSpellings} admits beside a declaration of its declared name, as a copy of that
 * declaration under the new name, where the kind does not declare the new name itself.
 *
 * @param declarations - The declarations, each of a kind of the vocabulary.
 * @returns The declarations the attribute grammar admits, in their order, each added spelling after
 *   the declarations.
 */
export const readDeclarations = <D extends Declared>(declarations: readonly D[]): readonly D[] => {
  const kept = declarations.filter(
    ({ kind, name }) =>
      !readingRefusals.some((refused) => refused.kind === kind && refused.name === name),
  );
  const named = new Set(kept.map(({ kind, name }) => `${kind}\u0000${name}`));

  return [
    ...kept,
    ...readingSpellings.flatMap((spelling) =>
      kept
        .filter(
          ({ kind, name }) =>
            name === spelling.declared && !named.has(`${kind}\u0000${spelling.name}`),
        )
        .map((declared) => ({ ...declared, name: spelling.name })),
    ),
  ];
};

/**
 * A declaration whose domain does not compile: the declaring kind, the attribute (empty for a
 * kind's text), and why.
 */
export class UncompiledDomain extends Schema.TaggedError<UncompiledDomain>()("UncompiledDomain", {
  detail: Schema.String,
  kind: Schema.String,
  name: Schema.String,
}) {
  /**
   * The declaration, the reason, and the repair.
   */
  override get message(): string {
    const subject = this.name === "" ? `the text of ${this.kind}` : `${this.kind}@${this.name}`;

    return `The domain of ${subject} does not compile: ${this.detail} Give it a spec reading in the attribute grammar, or extend the domain compiler.`;
  }
}

/**
 * The ways a composition's declarations have no attribute grammar: a domain that does not
 * compile, or a relation that has no constant (a kind or name outside its roster, a kind that
 * declares a name twice in a version).
 */
export type AttributeGrammarError = ClosedRelationError | UncompiledDomain;

/**
 * The key of `AttributeGrammar`: version, kind, then attribute name, each over its roster.
 */
export type AttributeKey = readonly [
  IdField<"version", string>,
  IdField<"kind", string>,
  IdField<"name", string>,
];

/**
 * The key of `GovernedAttribute`: version, governor, then attribute name, each over its roster. A
 * governor stands for its (kind, governing type) pair ({@link governorHandle}), so the key's code
 * spaces multiply to about as many cells as `AttributeGrammar`'s, where (kind, type) would multiply
 * to more than one PostgreSQL bit string holds.
 */
export type GovernedKey = readonly [
  IdField<"version", string>,
  IdField<"governor", string>,
  IdField<"name", string>,
];

/**
 * The payload of `AttributeGrammar`: the attribute's value domain, whether it is required, and its
 * position among the names its (version, kind) admits.
 */
export type AttributePayload = readonly [
  IdField<"domain", string>,
  IdField<"use", Use>,
  IdField<"position", string>,
];

/**
 * The payload of `ValueDomain`: the primitive a typed value is derived in, the pattern its lexical
 * forms match as written, and its residual facets, spelled `facet=value` space-separated (empty for
 * none).
 */
export type DomainPayload = readonly [
  IdField<"primitive", DomainPrimitive>,
  ValueField<"pattern", string>,
  ValueField<"facets", string>,
];

/**
 * The closed relations of the attribute grammar.
 */
export interface AttributeGrammar {
  /**
   * `AttributeGrammar`: each attribute an element of a kind may carry in a version, with its value
   * domain, its use and its position.
   */
  readonly admission: Closed<AttributeKey, AttributePayload>;
  /**
   * The `ValueDomain` roster's domains, in code order: each at its first use, versions outermost,
   * then the declarations in order, then the texts, then the governed declarations and the type
   * texts.
   */
  readonly domains: readonly ValueDomain[];
  /**
   * The `ValueDomain` handles of the empty domains, after {@link AttributeGrammar.domains} in code
   * order: each definition whose lexical space holds no value (`isEmptyDefinition`), which no
   * pattern spells, so `ValueDomain` holds no row of it and no lexical form is in it. In the pinned
   * grammar only `xs:NOTATION`'s, whose value space is the notations a schema declares and no
   * pinned XSD declares one (XML Schema Part 2, §3.2.19).
   */
  readonly emptyDomains: readonly string[];
  /**
   * `GovernedAttribute`: each attribute an element may carry in a version under a governor, with
   * its value domain, its use and its position among the names that governor admits there. Under a
   * governor, the XSD-derived admission is the governing type's, and the rules spec readings state
   * follow the element's kind (spec reading 84); an element of no governor reads `admission`.
   */
  readonly governed: Closed<GovernedKey, AttributePayload>;
  /**
   * `Governor`: the governor of each (version, kind, type) where the type governs an element of the
   * kind in place of its declared type, or a simple type governs a foreign element's text.
   */
  readonly governor: Closed<
    readonly [IdField<"version", string>, IdField<"kind", string>, IdField<"governs", string>],
    readonly [IdField<"governor", string>]
  >;
  /**
   * `ValueIdentity`: the identity type of each domain that has one.
   */
  readonly identity: Closed<
    readonly [IdField<"domain", string>],
    readonly [IdField<"identity", Identity>]
  >;
  /**
   * The `AttributePosition` roster: a (version, kind)'s admitted names numbered from 0 in
   * `AttributeName` code order, so an element's `attrs` is a set over positions (D8), as wide as
   * the most names one (version, kind) admits.
   */
  readonly positions: Roster<string>;
  /**
   * `TextDomain`: the value domain of a simple-content kind's text in a version, the language its
   * one `Text` child is read in.
   */
  readonly text: Closed<
    readonly [IdField<"version", string>, IdField<"kind", string>],
    readonly [IdField<"domain", string>]
  >;
  /**
   * `TypeText`: the value domain of the text of each named type with simple content in a version,
   * which an element that type governs holds its text in (spec readings 60 and 84).
   */
  readonly typeText: Closed<
    readonly [IdField<"version", string>, IdField<"governs", string>],
    readonly [IdField<"domain", string>]
  >;
  /**
   * `ValueDomain`: each domain's primitive, pattern and residual facets.
   */
  readonly valueDomain: Closed<readonly [IdField<"domain", string>], DomainPayload>;
}

/**
 * The rosters the attribute grammar is keyed by, and the declarations it reads.
 */
export interface AttributeGrammarInput {
  /**
   * Every attribute the composition's kinds declare, and those the composition states.
   */
  readonly declarations: readonly Declared[];
  /**
   * Every attribute each governor admits on its kind's elements: the governing type's
   * declarations, read through the kind's spec readings, and those the composition states.
   */
  readonly governed: readonly GovernedDeclared[];
  /**
   * The governors, each (version, kind, type) once.
   */
  readonly governors: readonly Governor[];
  /**
   * The `NodeKind` roster.
   */
  readonly kinds: Roster<string>;
  /**
   * The `AttributeName` roster, its open-name classes included.
   */
  readonly names: Roster<string>;
  /**
   * The text type of every simple-content kind of the composition.
   */
  readonly texts: readonly DeclaredText[];
  /**
   * The `TypeName` roster (`#pantry/grammar/xsi.ts`).
   */
  readonly typeName: Roster<string>;
  /**
   * The text type of every named type with simple content that may govern an element.
   */
  readonly typeTexts: readonly DeclaredTypeText[];
  /**
   * The `SchemaVersion` roster.
   */
  readonly versions: Roster<SchemaVersion>;
}

/**
 * Spell a domain's residual facets as `ValueDomain`'s `facets` payload.
 *
 * @param domain - The compiled domain.
 * @returns `facet=value` for each, space-separated; empty for none.
 */
const facetsText = (domain: CompiledDomain): string =>
  domain.facets.map(({ facet, value }) => `${facet}=${value}`).join(" ");

/**
 * The definition key of each compiled domain keyed so far ({@link definitionKey}), by the compiled
 * domain's identity.
 */
const definitionKeys = new WeakMap<CompiledDomain, string>();

/**
 * Key a compiled domain by its definition: two domains are one when their primitive, pattern,
 * residual facets and identity agree.
 *
 * @param domain - The compiled domain.
 * @returns The key.
 */
const definitionKey = (domain: CompiledDomain): string => {
  const known = definitionKeys.get(domain);
  if (known !== undefined) {
    return known;
  }

  const key = [
    domain.primitive,
    domain.pattern,
    facetsText(domain),
    Option.getOrElse(domain.identity, () => ""),
  ].join("\u0000");
  definitionKeys.set(domain, key);

  return key;
};

/**
 * Each leaf domain compiled so far with no spec reading, by the domain's identity: every
 * composition reads the one leaf, and every governor of a type reads that type's domains again, so
 * compiling each leaf definition once keeps a composition's cost in its own rows.
 */
const unreadCompiled = new WeakMap<Domain, ReturnType<typeof compile>>();

/**
 * Compile a leaf domain no spec reading alters, once per domain.
 *
 * @param domain - The leaf's domain.
 * @returns Its compiled form, or why it does not compile.
 */
const compiledUnread = (domain: Domain): ReturnType<typeof compile> => {
  const known = unreadCompiled.get(domain);
  if (known !== undefined) {
    return known;
  }

  const compiled = compile(domain, "xsd");
  unreadCompiled.set(domain, compiled);

  return compiled;
};

/**
 * The `ValueDomain` roster as it grows: each definition at its first use, under the first handle no
 * other definition holds.
 */
interface DomainRoster {
  readonly byDefinition: Map<string, ValueDomain>;
  readonly empty: Map<string, string>;
  readonly handles: Set<string>;
  readonly ordered: ValueDomain[];
}

/**
 * A domain a row names: its handle, which a compiled domain's and an empty domain's alike carry.
 */
interface DomainRef {
  readonly handle: string;
}

/**
 * Take the handle a domain would take, followed by a count where another definition holds it.
 *
 * @param domains - The roster.
 * @param name - The handle it would take.
 * @returns A handle no other definition holds.
 */
const freeHandle = (domains: DomainRoster, name: string): string => {
  let handle = name;
  for (let count = 2; domains.handles.has(handle); count += 1) {
    handle = `${name} (${count})`;
  }

  return handle;
};

/**
 * Add an empty domain to the roster, or find the one of its handle: a definition whose lexical
 * space holds no value has no pattern, and every such definition of one type is the same set.
 *
 * @param domains - The roster.
 * @param name - The handle it would take.
 * @returns The roster's empty domain of that name.
 */
const internEmpty = (domains: DomainRoster, name: string): DomainRef => {
  const known = domains.empty.get(name);
  if (known !== undefined) {
    return { handle: known };
  }

  const handle = freeHandle(domains, name);
  domains.empty.set(name, handle);
  domains.handles.add(handle);

  return { handle };
};

/**
 * Add a compiled domain to the roster, or find the domain of its definition.
 *
 * A domain is named after the type it was first compiled from: a named type by its QName, an
 * anonymous one by the declaration it types, and a reading's by its type and the reading. A name
 * another definition holds is followed by a count.
 *
 * @param domains - The roster.
 * @param compiled - The compiled definition.
 * @param name - The handle it would take.
 * @returns The roster's domain of that definition.
 */
const intern = (domains: DomainRoster, compiled: CompiledDomain, name: string): ValueDomain => {
  const key = definitionKey(compiled);
  const known = domains.byDefinition.get(key);
  if (known !== undefined) {
    return known;
  }

  const handle = freeHandle(domains, name);
  const domain = { ...compiled, handle };
  domains.byDefinition.set(key, domain);
  domains.handles.add(handle);
  domains.ordered.push(domain);

  return domain;
};

/**
 * The handle a declaration's domain would take: its type's QName, or for an anonymous type the
 * declaration itself; with the spec readings that alter it.
 *
 * @param type - The declared type.
 * @param anonymous - The name of the declaration, for an anonymous type.
 * @param readings - The spec readings applied to it.
 * @returns The handle.
 */
const handleOf = (type: ValueType, anonymous: string, readings: readonly SpecReading[]): string => {
  const base = Option.isNone(type.inline) ? type.type : anonymous;

  return readings.length === 0
    ? base
    : `${base} (reading ${[...new Set(readings.map(({ reading }) => reading))].join(", ")})`;
};

/**
 * Compile one declaration's domain, its spec readings applied.
 *
 * @param domains - The roster, which a new domain joins.
 * @param declared - The declaring kind, the attribute's name, and the type with its domain.
 * @param declared.domain - The type's resolved definition.
 * @param declared.kind - The declaring kind.
 * @param declared.name - The attribute's name.
 * @param declared.type - The declared type.
 * @param anonymous - The handle an anonymous type's domain would take.
 * @returns The domain, an empty one where its lexical space holds no value, or the declaration's
 *   compile failure.
 */
const domainOf = (
  domains: DomainRoster,
  declared: {
    readonly domain: Domain;
    readonly kind: string;
    readonly name: string;
    readonly type: ValueType;
  },
  anonymous: string,
): Result.Result<DomainRef, UncompiledDomain> => {
  const readings = readingsOf(declared.kind, declared.name);
  let { domain } = declared;
  for (const reading of readings) {
    domain = reading.read(domain);
  }

  const whiteSpace: Reading = readings.some((reading) => reading.whiteSpace === "exact")
    ? "exact"
    : "xsd";

  const handle = handleOf(declared.type, anonymous, readings);

  return (readings.length === 0 ? compiledUnread(domain) : compile(domain, whiteSpace)).pipe(
    Result.map((compiled): DomainRef => intern(domains, compiled, handle)),
    Result.orElse((cause) =>
      isEmptyDefinition(cause)
        ? Result.succeed(internEmpty(domains, handle))
        : Result.fail(
            new UncompiledDomain({
              detail: cause.message,
              kind: declared.kind,
              name: declared.name,
            }),
          ),
    ),
  );
};

/**
 * One attribute an element may carry in one version, with its compiled domain.
 */
interface Admitted {
  readonly domain: DomainRef;
  readonly kind: string;
  readonly name: string;
  readonly use: Use;
  readonly version: SchemaVersion;
}

/**
 * Generate the attribute grammar of a composition.
 *
 * Each governor's attributes are numbered as a kind's are, from 0 in `AttributeName` code order,
 * so an element's `attrs` is a set over its governor's positions as it is over its kind's.
 *
 * @param input - The rosters and the declarations.
 * @returns `AttributeGrammar`, `ValueDomain`, `ValueIdentity`, `TextDomain`, `Governor`,
 *   `GovernedAttribute` and `TypeText`, with the domain and position rosters; or the first
 *   declaration whose domain does not compile, or the first relation that has no constant.
 */
export const generate = (
  input: AttributeGrammarInput,
): Result.Result<AttributeGrammar, AttributeGrammarError> =>
  Result.gen(function* generateAttributes() {
    const domains: DomainRoster = {
      byDefinition: new Map(),
      empty: new Map(),
      handles: new Set(),
      ordered: [],
    };
    const admitted: Admitted[] = [];
    const texts: {
      readonly domain: DomainRef;
      readonly kind: string;
      readonly version: SchemaVersion;
    }[] = [];
    for (const version of input.versions.handles) {
      for (const declared of input.declarations) {
        if (declared.versions.includes(version)) {
          const domain = yield* domainOf(domains, declared, `${declared.kind}@${declared.name}`);
          admitted.push({
            domain,
            kind: declared.kind,
            name: declared.name,
            use: declared.use,
            version,
          });
        }
      }

      for (const declared of input.texts) {
        if (declared.versions.includes(version)) {
          const domain = yield* domainOf(
            domains,
            { ...declared, name: "" },
            `${declared.kind} text`,
          );
          texts.push({ domain, kind: declared.kind, version });
        }
      }
    }

    // The governors' domains join the roster after every kind's, so a code the kinds' domains
    // hold keeps its place.
    const governed: (Admitted & { readonly governor: string })[] = [];
    const typeTexts: {
      readonly domain: DomainRef;
      readonly governs: string;
      readonly version: SchemaVersion;
    }[] = [];
    for (const version of input.versions.handles) {
      for (const declared of input.governed) {
        if (declared.versions.includes(version)) {
          const domain = yield* domainOf(domains, declared, `${declared.governs}@${declared.name}`);
          governed.push({
            domain,
            governor: governorHandle(declared),
            kind: declared.kind,
            name: declared.name,
            use: declared.use,
            version,
          });
        }
      }

      for (const declared of input.typeTexts) {
        if (declared.versions.includes(version)) {
          const domain = yield* domainOf(
            domains,
            { ...declared, kind: declared.owner, name: "" },
            `${declared.owner} text`,
          );
          typeTexts.push({ domain, governs: declared.owner, version });
        }
      }
    }

    const domainRoster = yield* roster("ValueDomain", [
      ...domains.ordered.map(({ handle }) => handle),
      ...domains.empty.values(),
    ]);
    const version: IdField<"version", string> = idField("version", input.versions);
    const kind = idField("kind", input.kinds);
    const domain = idField("domain", domainRoster);
    const byKind = Map.groupBy(admitted, (row) => `${row.version}\u0000${row.kind}`);
    const byGovernor = Map.groupBy(governed, (row) => `${row.version}\u0000${row.governor}`);
    const families: readonly (readonly Admitted[])[] = [...byKind.values(), ...byGovernor.values()];
    const positionOf = new Map(
      families.flatMap((rows) =>
        rows
          .map((row) => ({ code: Option.getOrElse(input.names.codeOf(row.name), () => -1), row }))
          .toSorted((left, right) => left.code - right.code)
          .map(({ row }, position) => [row, position] as const),
      ),
    );
    const positions = fin("AttributePosition", Math.max(0, ...families.map((rows) => rows.length)));
    const use = idField("use", yield* roster("Use", uses));
    const position = idField("position", positions);
    const name = idField("name", input.names);
    const governs = idField("governs", input.typeName);
    const governorRoster = yield* roster("Governor", [
      ...new Set(input.governors.map(governorHandle)),
    ]);
    const governorField = idField("governor", governorRoster);
    const admission = yield* closed({
      key: [version, kind, name],
      name: "AttributeGrammar",
      payload: [domain, use, position],
      rows: admitted.map((row) => ({
        domain: row.domain.handle,
        kind: row.kind,
        name: row.name,
        position: String(positionOf.get(row) ?? 0),
        use: row.use,
        version: row.version,
      })),
    });
    const valueDomain = yield* closed({
      key: [domain],
      name: "ValueDomain",
      payload: [
        idField("primitive", yield* roster("DomainPrimitive", domainPrimitives)),
        valueField(
          "pattern",
          domains.ordered.map(({ pattern }) => pattern),
        ),
        valueField("facets", domains.ordered.map(facetsText)),
      ],
      rows: domains.ordered.map((held) => ({
        domain: held.handle,
        facets: facetsText(held),
        pattern: held.pattern,
        primitive: held.primitive,
      })),
    });
    const identity = yield* closed({
      key: [domain],
      name: "ValueIdentity",
      payload: [idField("identity", yield* roster("Identity", identities))],
      rows: domains.ordered.flatMap((held) =>
        Option.toArray(held.identity).map((value) => ({ domain: held.handle, identity: value })),
      ),
    });
    const text = yield* closed({
      key: [version, kind],
      name: "TextDomain",
      payload: [domain],
      rows: texts.map((row) => ({
        domain: row.domain.handle,
        kind: row.kind,
        version: row.version,
      })),
    });
    const governor = yield* closed({
      key: [version, kind, governs],
      name: "Governor",
      payload: [governorField],
      rows: input.governors.map((held) => ({
        governor: governorHandle(held),
        governs: held.governs,
        kind: held.kind,
        version: held.version,
      })),
    });
    const governedRelation = yield* closed({
      key: [version, governorField, name],
      name: "GovernedAttribute",
      payload: [domain, use, position],
      rows: governed.map((row) => ({
        domain: row.domain.handle,
        governor: row.governor,
        name: row.name,
        position: String(positionOf.get(row) ?? 0),
        use: row.use,
        version: row.version,
      })),
    });
    const typeText = yield* closed({
      key: [version, governs],
      name: "TypeText",
      payload: [domain],
      rows: typeTexts.map((row) => ({
        domain: row.domain.handle,
        governs: row.governs,
        version: row.version,
      })),
    });

    return {
      admission,
      domains: domains.ordered,
      emptyDomains: [...domains.empty.values()],
      governed: governedRelation,
      governor,
      identity,
      positions,
      text,
      typeText,
      valueDomain,
    };
  });

/**
 * An element's governing type and where it stands: the key an element's attributes and text are
 * read under.
 */
export interface GoverningKey {
  /**
   * The element's governing type, `Node.governs`: a `TypeName` handle, `none` where no named type
   * governs it.
   */
  readonly governs: string;
  readonly kind: string;
  readonly version: SchemaVersion;
}

/**
 * Find the governor of an element: the (kind, type) pair its governing type makes it, where that
 * type governs it in place of its kind's declared type (spec reading 84), or is a simple type that
 * governs a foreign element's text (spec reading 60).
 *
 * @param grammar - The attribute grammar.
 * @param key - The element's version, kind and governing type.
 * @returns The `Governor` handle, or none where the element reads its kind's own rows: its
 *   declared type governs it, or no named type, or a complex type a foreign element is not checked
 *   against (spec reading 50).
 */
export const governorOf = (grammar: AttributeGrammar, key: GoverningKey): Option.Option<string> =>
  Option.map(grammar.governor.lookup(key), ({ governor }) => governor);

/**
 * Find the row of an attribute name an element admits: its governor's, where one governs it, else
 * its kind's.
 *
 * @param grammar - The attribute grammar.
 * @param key - The element's version, kind and governing type, and the attribute's name.
 * @returns The admitted name's domain, use and position, or none where the element does not admit
 *   it.
 */
export const admissionOf = (
  grammar: AttributeGrammar,
  key: GoverningKey & { readonly name: string },
): Option.Option<{ readonly domain: string; readonly position: number; readonly use: Use }> => {
  const read = ({
    domain,
    position,
    use,
  }: {
    readonly domain: string;
    readonly position: string;
    readonly use: Use;
  }) => ({ domain, position: Number(position), use });

  return Option.match(governorOf(grammar, key), {
    onNone: () => Option.map(grammar.admission.lookup(key), read),
    onSome: (governor) =>
      Option.map(grammar.governed.lookup({ governor, name: key.name, version: key.version }), read),
  });
};

/**
 * Read the attributes an element admits, by position: each admitted name with its domain and use,
 * positions ascending, under its governor where one governs it ({@link admissionOf}).
 *
 * @param grammar - The attribute grammar.
 * @param names - The `AttributeName` roster.
 * @param version - The version.
 * @param kind - The kind.
 * @param governs - The element's governing type, its kind's own rows for one that is no governor.
 * @returns The element's admitted attributes, in position order.
 */
export const admittedOf = (
  grammar: AttributeGrammar,
  names: Roster<string>,
  version: SchemaVersion,
  kind: string,
  governs: string = noType,
): readonly {
  readonly domain: string;
  readonly name: string;
  readonly position: number;
  readonly use: Use;
}[] =>
  names.handles
    .flatMap((name) =>
      Option.match(admissionOf(grammar, { governs, kind, name, version }), {
        onNone: () => [],
        onSome: (row) => [{ ...row, name }],
      }),
    )
    .toSorted((left, right) => left.position - right.position);

/**
 * Read `Required`'s row for an element: the positions of the attributes it must carry, the side of
 * its governor's or its kind's admission that `use = required` selects. An element's `attrs` must
 * contain it, `bit_count(required & ~attrs) = 0` (AL3).
 *
 * @param grammar - The attribute grammar.
 * @param names - The `AttributeName` roster.
 * @param version - The version.
 * @param kind - The kind.
 * @param governs - The element's governing type, its kind's own rows for one that is no governor.
 * @returns The required positions.
 */
export const requiredOf = (
  grammar: AttributeGrammar,
  names: Roster<string>,
  version: SchemaVersion,
  kind: string,
  governs: string = noType,
): ReadonlySet<number> =>
  new Set(
    admittedOf(grammar, names, version, kind, governs)
      .filter(({ use }) => use === "required")
      .map(({ position }) => position),
  );

/**
 * Find the domain an element's text is read in: its governing type's simple content, where a
 * governor governs it, else its kind's `TextDomain`.
 *
 * @param grammar - The attribute grammar.
 * @param key - The element's version, kind and governing type.
 * @returns The `ValueDomain` handle, or none where the element's text is in no domain: its kind or
 *   its governing type has no simple content.
 */
export const textDomainOf = (grammar: AttributeGrammar, key: GoverningKey): Option.Option<string> =>
  Option.match(governorOf(grammar, key), {
    onNone: () => Option.map(grammar.text.lookup(key), ({ domain }) => domain),
    onSome: () => Option.map(grammar.typeText.lookup(key), ({ domain }) => domain),
  });

/**
 * A count an element's attributes must meet beside `Required`: how many of a set of names it
 * carries, from `min` to `max`, a spec reading's rule the XSD's `use` cannot state.
 */
export interface AttributeCount {
  readonly kind: string;
  readonly max: number;
  readonly min: number;
  readonly names: readonly string[];
  readonly reading: number;
}

/**
 * The attributes SSML 1.1's fragment removal keeps on an element of the kind: those SSML declares
 * on it, in no namespace, with `xml:lang` and `xml:base`, which it keeps "with the exception of
 * xml:lang and xml:base" while removing "all non-synthesis namespace elements and attributes"
 * (SSML 1.1, §2.2.1). Spec reading 43 counts only these.
 *
 * @param kind - An SSML kind.
 * @returns Its surviving names, declared ones first, in the leaf's order.
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#S2.2.1 | SSML 1.1, 2.2.1 Conforming Speech Synthesis Markup Language Fragments}
 */
const survivingNames = (kind: string): readonly string[] => [
  ...new Set(
    attributeDeclarations
      .filter((row) => row.kind === kind && !row.name.includes(":"))
      .map(({ name }) => name),
  ),
  "xml:lang",
  "xml:base",
];

/**
 * The attribute counts of `docs/spec-readings.md`:
 *
 * - 41: an SSML `meta` has exactly one of `name` and `http-equiv` (SSML 1.1, §3.1.6: "Either a name
 *   or http-equiv attribute is required. It is an error to provide both").
 * - 43: an SSML `voice` or `prosody` has at least one attribute fragment removal keeps (SSML 1.1,
 *   §3.2.1 and §3.2.4: "it is an error if no attributes are specified").
 *
 * A name a kind does not admit is no position of it, so it counts nothing: `xml:base` on `prosody`
 * is admitted only where SSML's attribute wildcard reads the XML namespace.
 */
export const attributeCounts: readonly AttributeCount[] = [
  { kind: "ssml:meta", max: 1, min: 1, names: ["name", "http-equiv"], reading: 41 },
  {
    kind: "ssml:voice",
    max: Number.POSITIVE_INFINITY,
    min: 1,
    names: survivingNames("ssml:voice"),
    reading: 43,
  },
  {
    kind: "ssml:prosody",
    max: Number.POSITIVE_INFINITY,
    min: 1,
    names: survivingNames("ssml:prosody"),
    reading: 43,
  },
];
