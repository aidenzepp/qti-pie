/**
 * The attribute grammar's laws, each against an oracle that is not the generator:
 *
 * - **The XSD's attribute uses.** An independent reading of the pinned XSDs (`loadXsd` and
 *   `xsdContents` of `src/test/gen/grammar.ts`, written from XML Schema Part 1 apart from the
 *   vocabulary deriver) gives each kind its declared names and uses; `AttributeGrammar` must admit
 *   exactly those, with the XSD's use, beside the document layer's names.
 * - **The spec readings' text.** Each reading of `docs/spec-readings.md` that narrows a value is
 *   checked on every attribute it names, and the XSD's own reading of the same type is checked
 *   everywhere else; readings 10, 9 and 85, and 123, which add, take away and require an attribute,
 *   are restated beside the XSD reading, and reading 90 beside the document layer's `xml:` names,
 *   its covered elements from the Schematron's leaf, which its own test reads against the XSDs' raw
 *   text. Reading 9's two ARIA role rules are read from the XSDs' raw text too, reading 135's MIME
 *   types against an RFC 2045 reader by exhaustion and by a swarm-weighted search, and reading
 *   136's `coords`, which follows the XSD, against a reader of `CoordsDType`.
 * - **The XSD's values, for the departures of the old grammar.** Each value the XSD admits and the
 *   old grammar refused is admitted, read from the leaf's own resolution of the XSD.
 * - **Structural laws:** positions a bijection onto 0..n−1 in `AttributeName` order; `TextDomain` a
 *   row for every text type in every version; `ValueIdentity` derived from the built-in alone; the
 *   generator's refusals as named invalid inputs.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element, int, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Option, Result } from "effect";
import {
  attributeCounts,
  baseTypes,
  generate,
  readDeclarations,
  readingUses,
  specReadings,
} from "#pantry/grammar/attributes.ts";
import type { AttributeGrammar, Declared, ValueDomain } from "#pantry/grammar/attributes.ts";
import { roster } from "#pantry/grammar/closed.ts";
import type { Roster } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { loadXsd, XsdOracleLayer, xsdContents } from "#pantry/test/gen/grammar.ts";
import { checkCache, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import {
  attributeDeclarations,
  attributeWildcards,
  globalAttributes,
  textTypes,
} from "#pantry/vocab/inventory/attributes.ts";
import { coveredElements } from "#pantry/vocab/inventory/extensions.ts";
import type { Domain } from "#pantry/vocab/inventory/types.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 59.6 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 300_000;

/**
 * The leaf's rosters: every kind that declares an attribute or has text, every attribute name, and
 * the two versions.
 */
const rosters = {
  kinds: Result.getOrThrow(
    roster("NodeKind", [
      ...new Set([
        ...attributeDeclarations.map(({ kind }) => kind),
        ...textTypes.map(({ kind }) => kind),
      ]),
    ]),
  ),
  names: Result.getOrThrow(
    roster("AttributeName", [...new Set(attributeDeclarations.map(({ name }) => name))]),
  ),
  versions: Result.getOrThrow(roster("SchemaVersion", schemaVersions)),
} as const;

/**
 * The inputs of a grammar no `xsi:type` governs: no governor, and an empty `TypeName` roster.
 */
const ungoverned = {
  governed: [],
  governors: [],
  typeName: Result.getOrThrow(roster("TypeName", [])),
  typeTexts: [],
} as const;

/**
 * The attribute grammar of the whole leaf, no document layer: every declaration the pinned XSDs
 * state, and every text type.
 */
const leafGrammar: AttributeGrammar = Result.getOrThrow(
  generate({ declarations: attributeDeclarations, texts: textTypes, ...rosters, ...ungoverned }),
);

/**
 * The domain of an attribute row, by its handle.
 */
const domainsByHandle = new Map(leafGrammar.domains.map((domain) => [domain.handle, domain]));

/**
 * The domain a kind's attribute is read under in a version.
 *
 * @param version - The version.
 * @param kind - The kind.
 * @param name - The attribute.
 * @returns The domain, none where the kind does not admit the name.
 */
const domainAt = (version: SchemaVersion, kind: string, name: string): Option.Option<ValueDomain> =>
  Option.flatMap(leafGrammar.admission.lookup({ kind, name, version }), ({ domain }) =>
    Option.fromNullishOr(domainsByHandle.get(domain)),
  );

/**
 * Whether a domain's pattern matches a raw lexical form, as the attribute CHECK reads it.
 *
 * @param domain - The domain.
 * @param raw - The form as written.
 * @returns Whether it matches.
 */
const matches = (domain: ValueDomain, raw: string): boolean =>
  new RegExp(domain.pattern, patternFlags).test(raw);

/**
 * Every (version, kind) that declares a name, each once.
 *
 * @param name - The attribute.
 * @returns The (version, kind) pairs.
 */
const declarersOf = (
  name: string,
): readonly { readonly kind: string; readonly version: SchemaVersion }[] =>
  attributeDeclarations
    .filter((declared) => declared.name === name)
    .flatMap(({ kind, versions }) => versions.map((version) => ({ kind, version })));

/**
 * The enumeration values a definition states.
 *
 * @param domain - The definition.
 * @returns Its values.
 */
const enumerationOf = (domain: Domain): readonly string[] =>
  domain.facets.flatMap(({ facet, value }) => (facet === "enumeration" ? [value] : []));

describe("The departures from the XSD", () => {
  it("are gone: a slider's step is NonNegativeDoubleDType, 0 and INF its lexical forms, NaN none, and zero its bound", () => {
    for (const version of schemaVersions) {
      const step = Option.getOrThrow(domainAt(version, "qti-slider-interaction", "step"));
      for (const value of ["0", "0.0", "INF", " 2.5 ", "1e3"]) {
        assert.isTrue(matches(step, value), value);
      }

      assert.isFalse(
        matches(step, "NaN"),
        "NaN meets no bound, so it is outside the bounded lexical space",
      );

      assert.deepStrictEqual(step.bound, Option.some({ facet: "minInclusive", value: 0 }));
    }
  });

  it("are gone: a cell's headers are a plain list of identifiers in the attribute grammar, with no IDREF identity, since reading 126's same-table rule is an overlay's law", () => {
    // Reading 126's rule, each token unique and the id of a th of the cell's own table, is
    // `src/qti/html.ts`'s, `HeaderToken`'s key and `tableHeaders`, over the rows
    // `src/import/overlays/html.ts` splits from the attribute's lexical form; the grammar reads no
    // reference on them.
    for (const kind of ["td", "th"]) {
      for (const version of schemaVersions) {
        const headers = Option.getOrThrow(domainAt(version, kind, "headers"));

        assert.isTrue(matches(headers, "a b  c"));
        assert.isTrue(Option.isNone(headers.identity));
      }
    }
  });

  it("are gone: param@valuetype is required, and xml:base is admitted on the three manifest kinds", () => {
    for (const version of schemaVersions) {
      assert.strictEqual(
        Option.getOrThrow(
          leafGrammar.admission.lookup({ kind: "param", name: "valuetype", version }),
        ).use,
        "required",
      );
      for (const kind of ["cp:manifest", "cp:resources", "cp:resource"]) {
        const base = Option.getOrThrow(domainAt(version, kind, "xml:base"));

        assert.isTrue(matches(base, " ../items/ "), kind);
      }
    }
  });
});

/**
 * RFC 5646's 26 grandfathered tags (§2.1, the `irregular` and `regular` productions), as the RFC
 * writes them.
 */
const grandfathered = [
  "en-GB-oed",
  "i-ami",
  "i-bnn",
  "i-default",
  "i-enochian",
  "i-hak",
  "i-klingon",
  "i-lux",
  "i-mingo",
  "i-navajo",
  "i-pwn",
  "i-tao",
  "i-tay",
  "i-tsu",
  "sgn-BE-FR",
  "sgn-BE-NL",
  "sgn-CH-DE",
  "art-lojban",
  "cel-gaulish",
  "no-bok",
  "no-nyn",
  "zh-guoyu",
  "zh-hakka",
  "zh-min",
  "zh-min-nan",
  "zh-xiang",
] as const;

/**
 * One subtag of each class RFC 5646's productions tell apart: singletons, `x` in both cases, two
 * and three letters, three digits, four letters, a digit and three alphanumerics, five to eight
 * alphanumerics, nine letters, and alphanumerics no production takes.
 */
const subtagSamples = [
  "a",
  "x",
  "X",
  "i",
  "1",
  "en",
  "EN",
  "12",
  "a1",
  "eng",
  "123",
  "419",
  "Latn",
  "1abc",
  "abc1",
  "US",
  "variant",
  "abcdefgh",
  "abcdefghi",
  "1996",
  "ab",
  "sgn",
] as const;

/**
 * Whether a value is a well-formed BCP 47 language tag, RFC 5646's `Language-Tag` (§2.1, Figure
 * 1), read subtag by subtag: a grandfathered tag in any case; or `x` and private-use subtags; or a
 * language of two to eight letters, up to three three-letter extlangs after one of two or three, a
 * script, a region, variants, extensions each a singleton other than `x` with subtags of two to
 * eight, and a private-use tail. Each production is told apart by its subtags' lengths and
 * classes, so the first that fits is the one, and no step looks back.
 *
 * @param value - The value.
 * @returns Whether it is well-formed.
 */
const isLanguageTag = (value: string): boolean => {
  if (grandfathered.some((tag) => tag.toLowerCase() === value.toLowerCase())) {
    return true;
  }

  const subtags = value.split("-");
  const at = (index: number): string => subtags[index] ?? "";
  if (!subtags.every((subtag) => /^[A-Za-z0-9]{1,8}$/u.test(subtag))) {
    return false;
  }

  if (/^[Xx]$/u.test(at(0))) {
    return subtags.length > 1;
  }

  if (!/^[A-Za-z]{2,8}$/u.test(at(0))) {
    return false;
  }

  let next = 1;
  const take = (production: RegExp): boolean => {
    const taken = next < subtags.length && production.test(at(next));
    next += taken ? 1 : 0;

    return taken;
  };
  for (let extlangs = 0; at(0).length <= 3 && extlangs < 3 && take(/^[A-Za-z]{3}$/u);) {
    extlangs += 1;
  }

  take(/^[A-Za-z]{4}$/u);
  take(/^(?:[A-Za-z]{2}|[0-9]{3})$/u);
  while (take(/^(?:[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3})$/u)) {
    // Each variant is taken.
  }

  while (take(/^[0-9A-WY-Za-wy-z]$/u)) {
    let held = 0;
    while (take(/^[A-Za-z0-9]{2,8}$/u)) {
      held += 1;
    }

    if (held === 0) {
      return false;
    }
  }

  if (take(/^[Xx]$/u)) {
    return next < subtags.length;
  }

  return next === subtags.length;
};

/**
 * The conversion specifiers a value writes, read left to right as C reads a format string (C11
 * §7.21.6.1): a character that is not `%` is text, `%%` writes a `%` and converts nothing, and
 * every other `%` begins a specifier of flags, a width and an optional precision of `.` and
 * digits, well-formed where one of the information model's codes ends it (§2.3.4). A malformed
 * specifier ends where its code would stand, and the walk reads on from there.
 *
 * @param value - The value.
 * @returns Whether each specifier is well-formed, in the order written.
 */
const printfSpecifiers = (value: string): readonly boolean[] => {
  const points = Array.from(value, String);
  const specifiers: boolean[] = [];
  let next = 0;
  const takeWhile = (characters: string): void => {
    while (next < points.length && characters.includes(points[next] ?? "")) {
      next += 1;
    }
  };
  while (next < points.length) {
    if (points[next] === "%" && points[next + 1] === "%") {
      next += 2;
    } else if (points[next] === "%") {
      next += 1;
      takeWhile("#0 +-");
      takeWhile("0123456789");
      if (points[next] === ".") {
        next += 1;
        takeWhile("0123456789");
      }

      const code = points[next];
      const wellFormed = code !== undefined && "EefGgrRiodXx".includes(code);
      specifiers.push(wellFormed);
      next += wellFormed ? 1 : 0;
    } else {
      next += 1;
    }
  }

  return specifiers;
};

/**
 * Whether a value is a printf format string over the information model's conversion codes (§2.3.4):
 * every specifier it writes is well-formed ({@link printfSpecifiers}), however many it writes,
 * none included (spec reading 161 sets aside reading 132's one).
 *
 * @param value - The value.
 * @returns Whether it is a format.
 */
const isPrintfFormat = (value: string): boolean => printfSpecifiers(value).every(Boolean);

/**
 * What a generated format is, for the search's coverage: how many specifiers it writes, none, one,
 * two or several, and whether one of them is malformed. A format of none has no specifier to
 * break, so the search must reach the six others, each count well-formed and malformed.
 */
const printfNotes = [
  "none",
  "one",
  "one malformed",
  "two",
  "two malformed",
  "several",
  "several malformed",
] as const;

/**
 * A {@link printfNotes} note.
 */
type PrintfNote = (typeof printfNotes)[number];

/**
 * Note a format for the search ({@link printfNotes}).
 *
 * @param value - The value.
 * @returns Its note.
 */
const printfNote = (value: string): PrintfNote => {
  const specifiers = printfSpecifiers(value);
  const malformed = specifiers.includes(false);
  if (specifiers.length === 0) {
    return "none";
  }

  if (specifiers.length === 1) {
    return malformed ? "one malformed" : "one";
  }

  if (specifiers.length === 2) {
    return malformed ? "two malformed" : "two";
  }

  return malformed ? "several malformed" : "several";
};

/**
 * The pieces a generated format is drawn from, each a swarm feature: text with no `%`, the escape
 * `%%`, a well-formed specifier's code, a code the information model does not list, and a `%`
 * alone. A specifier's flags, width and precision are drawn apart ({@link printfMiddle}). A piece's
 * class says how it was drawn, never what the format is: pieces run together, so `%` and `5i` read
 * as one specifier, and the note reads the format as written.
 */
const printfClasses = {
  bare: ["%"],
  code: ["E", "e", "f", "G", "g", "r", "R", "i", "o", "X", "x"],
  escape: ["%%"],
  text: ["a", "Score: ", " of ", "5", ".", "-", "é", "\u{1F600}", "\u00A0"],
  unlisted: ["d", "u", "s", "c", "q", "%", ""],
} as const;

/**
 * A {@link printfClasses} feature.
 */
type PrintfClass = keyof typeof printfClasses;

/**
 * The features in the order a swarm draws them, text first, the floor.
 */
const printfClassNames = [
  "text",
  "escape",
  "code",
  "unlisted",
  "bare",
] as const satisfies readonly PrintfClass[];

/**
 * Draw a specifier's middle: up to three flags, a width of up to two digits, and, half the time, a
 * precision of `.` and up to two digits.
 */
const printfMiddle: Gen<string> = (source) => {
  const flags = source.draw(array(element(["#", "0", " ", "+", "-"] as const), { max: 3, min: 0 }));
  const width = source.draw(array(element(["0", "1", "5", "9"] as const), { max: 2, min: 0 }));
  const precision = source.draw(element([false, true] as const))
    ? `.${source.draw(array(element(["0", "2", "7"] as const), { max: 2, min: 0 })).join("")}`
    : "";

  return `${flags.join("")}${width.join("")}${precision}`;
};

/**
 * Draw one piece of a format under a swarm: for a code or an unlisted one, a specifier of `%`, its
 * middle ({@link printfMiddle}) and the code; for any other class, the class's text.
 *
 * @param mix - The case's swarm.
 * @returns The generator.
 */
const printfPieceOf =
  (mix: Swarm<PrintfClass>): Gen<string> =>
  (source) => {
    const drawnClass = source.draw(swarmChoice(mix, printfClassNames));
    const piece = source.draw(element(printfClasses[drawnClass]));

    return drawnClass === "code" || drawnClass === "unlisted"
      ? `%${source.draw(printfMiddle)}${piece}`
      : piece;
  };

/**
 * Draw a format under one swarm: up to eight pieces run together.
 */
const printfCase: Gen<string> = (source) => {
  const mix = source.draw(swarm(printfClassNames));

  return source.draw(array(printfPieceOf(mix), { max: 8, min: 0 })).join("");
};

/**
 * RFC 2045's tspecials (§5.1), as the RFC lists them.
 */
const tspecials = '()<>@,;:\\"/[]?=';

/**
 * The rules {@link mediaTypeFault} tells apart, `valid` first.
 */
const mediaTypeFaults = [
  "valid",
  "space",
  "control",
  "delete",
  "non-ascii",
  "tspecial",
  "no-slash",
  "two-slashes",
  "empty-type",
  "empty-subtype",
] as const;

/**
 * A rule of RFC 2045's media type a value breaks, or `valid`.
 */
type MediaTypeFault = (typeof mediaTypeFaults)[number];

/**
 * The rule of RFC 2045's media type one code point breaks, wherever it stands: a space, a control
 * (`U+0000` to `U+001F`, which XML admits as text only for tab, line feed and carriage return, and
 * `U+007F`, which it admits, told apart as `delete`), a character outside US-ASCII, or a tspecial
 * but the slash; none for a token's character or the slash.
 *
 * @param point - The code point.
 * @returns The rule, if it breaks one.
 */
const pointFault = (point: string): MediaTypeFault | undefined => {
  const code = point.codePointAt(0) ?? 0;
  if (code === 0x20) {
    return "space";
  }

  if (code < 0x20) {
    return "control";
  }

  if (code === 0x7f) {
    return "delete";
  }

  if (code > 0x7f) {
    return "non-ascii";
  }

  return tspecials.includes(point) && point !== "/" ? "tspecial" : undefined;
};

/**
 * The first rule of RFC 2045's media type that a value breaks, read code point by code point, or
 * `valid`: `type "/" subtype`, each a token, "1*<any (US-ASCII) CHAR except SPACE, CTLs, or
 * tspecials>" (§5.1). The value is read as `MimeTypeDType`'s `replace` leaves it, a tab or a line
 * break a space.
 *
 * @param raw - The value as written.
 * @returns The rule it breaks first: a character's ({@link pointFault}), then the slash's.
 */
const mediaTypeFault = (raw: string): MediaTypeFault => {
  const points = Array.from(raw.replaceAll(/[\t\n\r]/gu, " "), String);
  const slash = points.indexOf("/");
  const first = points.map(pointFault).find((fault) => fault !== undefined);
  if (first !== undefined) {
    return first;
  }

  if (slash === -1) {
    return "no-slash";
  }

  if (points.includes("/", slash + 1)) {
    return "two-slashes";
  }

  if (slash === 0) {
    return "empty-type";
  }

  return slash === points.length - 1 ? "empty-subtype" : "valid";
};

/**
 * Collapse a value's whitespace as XML Schema's `collapse` does (Part 2, §4.3.6): each run of tab,
 * line feed, carriage return and space one space, and none at either end. JavaScript's `trim`
 * strips every Unicode space, `U+00A0` among them, which no XML whitespace class touches.
 *
 * @param raw - The value as written.
 * @returns It collapsed.
 */
const collapseXml = (raw: string): string =>
  raw
    .replaceAll(/[\t\n\r ]+/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * Every rule of RFC 2045's media type a value breaks, where {@link mediaTypeFault} names the first:
 * each character's ({@link pointFault}), and the slash's, none for a media type.
 *
 * @param raw - The value as written.
 * @returns The rules, none for a media type.
 */
const mediaTypeFaultsOf = (raw: string): ReadonlySet<MediaTypeFault> => {
  const points = Array.from(raw.replaceAll(/[\t\n\r]/gu, " "), String);
  const slashes = points.flatMap((point, at) => (point === "/" ? [at] : []));
  const [slash] = slashes;

  return new Set([
    ...points.flatMap((point) => Option.toArray(Option.fromNullishOr(pointFault(point)))),
    ...(slash === undefined ? ["no-slash" as const] : []),
    ...(slashes.length > 1 ? ["two-slashes" as const] : []),
    ...(slashes.length === 1 && slash === 0 ? ["empty-type" as const] : []),
    ...(slashes.length === 1 && slash === points.length - 1 ? ["empty-subtype" as const] : []),
  ]);
};

/**
 * What a generated value is, for the search's coverage: `valid`, the one rule it breaks alone, or
 * `mixed` for more than one, so the search must reach each rule broken by itself, the value nearest
 * a media type that breaks it.
 */
const mediaTypeNotes = [...mediaTypeFaults, "mixed"] as const;

/**
 * A {@link mediaTypeNotes} note.
 */
type MediaTypeNote = (typeof mediaTypeNotes)[number];

/**
 * Note a value for the search ({@link mediaTypeNotes}).
 *
 * @param raw - The value as written.
 * @returns Its note.
 */
const mediaTypeNote = (raw: string): MediaTypeNote => {
  const faults = [...mediaTypeFaultsOf(raw)];
  const [only] = faults;
  if (only === undefined) {
    return "valid";
  }

  return faults.length === 1 ? only : "mixed";
};

/**
 * What a generated list of media types is, for the search's coverage: `list-valid`, `list-empty`
 * for no item, the one rule its items break alone, or `list-mixed`. A space never breaks an item,
 * since spaces part the items.
 */
const mediaTypeListNotes = [
  "list-valid",
  "list-empty",
  "list-control",
  "list-delete",
  "list-non-ascii",
  "list-tspecial",
  "list-no-slash",
  "list-two-slashes",
  "list-empty-type",
  "list-empty-subtype",
  "list-mixed",
] as const;

/**
 * A {@link mediaTypeListNotes} note.
 */
type MediaTypeListNote = (typeof mediaTypeListNotes)[number];

/**
 * Note a list of media types for the search, as `MimeTypeListDType`'s list reads it: its
 * whitespace collapsed, then every rule its items break ({@link mediaTypeFaultsOf}).
 *
 * @param raw - The value as written.
 * @returns Its note.
 */
const mediaTypeListNote = (raw: string): MediaTypeListNote => {
  const collapsed = collapseXml(raw);
  const faults = [...new Set(collapsed.split(" ").flatMap((item) => [...mediaTypeFaultsOf(item)]))];
  const [only] = faults;
  if (collapsed === "") {
    return "list-empty";
  }

  if (only === undefined || only === "valid" || only === "space") {
    return faults.length <= 1 ? "list-valid" : "list-mixed";
  }

  return faults.length === 1 ? `list-${only}` : "list-mixed";
};

/**
 * Whether a value is a list of RFC 2045 media types: no item, or items each a media type, as
 * {@link mediaTypeFault} reads each item.
 *
 * @param raw - The value as written.
 * @returns Whether it is.
 */
const isMediaTypeList = (raw: string): boolean => {
  const collapsed = collapseXml(raw);

  return collapsed === "" || collapsed.split(" ").every((item) => mediaTypeFault(item) === "valid");
};

/**
 * The symbols the media type's small scope is drawn from: letters of both cases, a digit, token
 * punctuation (`+`, `*`, `{`, `~`), the slash, a space, a tab, tspecials (`(`, `;`, `=`, `"`, `\`),
 * `U+007F` and a letter outside US-ASCII.
 */
const mediaTypeSymbols = [
  "a",
  "Z",
  "0",
  "+",
  "*",
  "{",
  "~",
  "/",
  " ",
  "\t",
  "(",
  ";",
  "=",
  '"',
  "\\",
  "\u007F",
  "é",
] as const;

/**
 * Every string of at most four {@link mediaTypeSymbols}, 88,741 of them.
 */
const mediaTypeScope: readonly string[] = (() => {
  const strings = [""];
  let level: readonly string[] = [""];
  for (let length = 1; length <= 4; length += 1) {
    level = level.flatMap((head) => mediaTypeSymbols.map((symbol) => `${head}${symbol}`));
    strings.push(...level);
  }

  return strings;
})();

/**
 * The classes of character a generated MIME value is drawn from, each a swarm feature: token
 * characters, upper-case letters, the space, the tab, a line break, the tspecials but the slash,
 * the C0 controls a JavaScript string holds and XML does not, `U+007F`, the control XML admits,
 * and characters outside US-ASCII. The slash
 * that joins type and subtype is drawn apart, by the value's shape.
 */
const mediaTypeClasses = {
  control: ["\u001F", "\u0000", "\u0001"],
  delete: ["\u007F"],
  lineBreak: ["\n", "\r"],
  nonAscii: ["é", "\u00A0", "\u{1F600}", "ﬁ", "\u0430"],
  space: [" "],
  tab: ["\t"],
  token: [
    "a",
    "z",
    "0",
    "9",
    "-",
    "+",
    ".",
    "!",
    "#",
    "$",
    "%",
    "&",
    "'",
    "*",
    "^",
    "_",
    "`",
    "{",
    "|",
    "}",
    "~",
  ],
  tspecial: ["(", ")", "<", ">", "@", ",", ";", ":", "\\", '"', "[", "]", "?", "="],
  upper: ["A", "Z", "X"],
} as const;

/**
 * A {@link mediaTypeClasses} feature.
 */
type MediaTypeClass = keyof typeof mediaTypeClasses;

/**
 * The features in the order a swarm draws them, a token's characters first, the floor.
 */
const mediaTypeClassNames = [
  "token",
  "upper",
  "space",
  "tab",
  "lineBreak",
  "tspecial",
  "control",
  "delete",
  "nonAscii",
] as const satisfies readonly MediaTypeClass[];

/**
 * Draw one part of a MIME value, a type or subtype or a third: up to eight characters, each from a
 * class the swarm turns on, at its weight.
 *
 * @param mix - The case's swarm.
 * @returns The generator.
 */
const mediaTypePart =
  (mix: Swarm<MediaTypeClass>): Gen<string> =>
  (source) => {
    const length = source.draw(int(0, 8));
    let part = "";
    for (let at = 0; at < length; at += 1) {
      part += source.draw(
        element(mediaTypeClasses[source.draw(swarmChoice(mix, mediaTypeClassNames))]),
      );
    }

    return part;
  };

/**
 * Draw a MIME value under a swarm: one to four parts joined by slashes, two, a type and a subtype,
 * six times in eight.
 *
 * @param mix - The case's swarm.
 * @returns The generator.
 */
const mediaTypeValue =
  (mix: Swarm<MediaTypeClass>): Gen<string> =>
  (source) => {
    const partCount = source.draw(
      weighted<number>([
        [1, int(1, 1)],
        [6, int(2, 2)],
        [1, int(3, 4)],
      ]),
    );

    return Array.from({ length: partCount }, () => source.draw(mediaTypePart(mix))).join("/");
  };

/**
 * The whitespace a generated list puts between its items and around them.
 */
const listGap = element([" ", "  ", "\t", "\n", " \r\n "] as const);

/**
 * Draw a MIME value and a list of them under one swarm: the list is up to three values between
 * runs of whitespace, with whitespace before and after at times.
 */
const mediaTypeCase: Gen<{ readonly list: string; readonly value: string }> = (source) => {
  const mix = source.draw(swarm(mediaTypeClassNames));
  const value = source.draw(mediaTypeValue(mix));
  const items = source.draw(array(mediaTypeValue(mix), { max: 3, min: 0 }));
  const inner = items.map((item, at) => (at === 0 ? item : `${source.draw(listGap)}${item}`));
  const before = source.draw(element(["", " ", "\t"] as const));
  const after = source.draw(element(["", " ", "\n"] as const));

  return { list: `${before}${inner.join("")}${after}`, value };
};

/**
 * Whether a token of a `CoordsDType` is one: digits and an optional `%`.
 *
 * @param token - The token.
 * @returns Whether it is.
 */
const isCoordsToken = (token: string): boolean => {
  const points = Array.from(token, String);
  const digits = points.at(-1) === "%" ? points.slice(0, -1) : points;

  return digits.length > 0 && digits.every((point) => point >= "0" && point <= "9");
};

/**
 * Whether a value is a `CoordsDType`, read token by token: after `replace`, three, four, or an even
 * number of six or more comma-separated tokens, each one {@link isCoordsToken} accepts (the XSD's
 * pattern, and the information model's Coords, §7.9).
 *
 * @param raw - The value as written.
 * @returns Whether it is.
 */
const isCoords = (raw: string): boolean => {
  const tokens = raw.replaceAll(/[\t\n\r]/gu, " ").split(",");
  const count = tokens.length;

  return (
    (count === 3 || count === 4 || (count >= 6 && count % 2 === 0)) && tokens.every(isCoordsToken)
  );
};

/**
 * A word every domain of a numeric type accepts, and the same word with outer whitespace.
 */
const spaced = [" 1", "1 ", "\t1\n"] as const;

describe("The spec readings", () => {
  it("read 7: every typed QTI value an attribute carries is read exactly: outer whitespace refused around a number, kept in a string, where the same XSD type elsewhere collapses it", () => {
    const listed = specReadings.filter(({ reading }) => reading === 7);
    assert.isAbove(listed.length, 0);
    let numbers = 0;
    for (const reading of listed) {
      for (const kind of Option.getOrElse(reading.kinds, () => [])) {
        for (const { version } of declarersOf(reading.name).filter(
          (declarer) => declarer.kind === kind,
        )) {
          const domain = Option.getOrThrow(domainAt(version, kind, reading.name));
          const textual = domain.primitive === "string" || domain.primitive === "anySimpleType";
          numbers += textual ? 0 : 1;
          for (const value of spaced) {
            assert.strictEqual(
              matches(domain, value),
              textual,
              `${kind}@${reading.name} ${JSON.stringify(value)}`,
            );
          }
        }
      }
    }

    const collapsing = Option.getOrThrow(domainAt("3.0.1", "ud:ordinaryStatistic", "stdError"));
    assert.isAbove(numbers, 0);
    assert.isTrue(matches(collapsing, " 1"));
  });

  it("read 8: a match table entry's target-value is any value, read by the overlay as the outcome's base type", () => {
    for (const version of schemaVersions) {
      const target = Option.getOrThrow(domainAt(version, "qti-match-table-entry", "target-value"));
      for (const value of ["0.5", "true", "a b", "", "identifier"]) {
        assert.isTrue(matches(target, value), value);
      }
    }
  });

  it("read 14, restated: a text-entry interaction's response-identifier and string-identifier are IDREFs, as the XSD types them", () => {
    for (const name of ["response-identifier", "string-identifier"]) {
      for (const version of schemaVersions) {
        assert.deepStrictEqual(
          Option.getOrThrow(domainAt(version, "qti-text-entry-interaction", name)).identity,
          Option.some("IDREF"),
          name,
        );
      }
    }
  });

  it("read 15: a variable-identifier-ref is an identifier, not an IDREF", () => {
    for (const version of schemaVersions) {
      const ref = Option.getOrThrow(
        domainAt(version, "qti-outcome-declaration", "variable-identifier-ref"),
      );

      assert.isTrue(Option.isNone(ref.identity));
      assert.isTrue(matches(ref, " EXT "));
      assert.isFalse(matches(ref, "1EXT"));
    }
  });

  it("read 16: normal-maximum is greater than zero", () => {
    for (const version of schemaVersions) {
      assert.deepStrictEqual(
        Option.getOrThrow(domainAt(version, "qti-outcome-declaration", "normal-maximum")).bound,
        Option.some({ facet: "minExclusive", value: 0 }),
      );
    }
  });

  it("read 17: an item's and a test's rubric block's view lists at least one view, an outcome declaration's may list none, every declaring kind against every list of at most two views and the empty and blank values", () => {
    // Oracle: the information model's RubricBlock and TestRubricBlock `view`, "A list from an
    // enumerated value set" of multiplicity [1] (§5.120.2, §5.160.1), and OutcomeDeclaration's of
    // [0..1] (§4.5.4); a list of n views is one of the six names, n times, between whitespace.
    // Bound: every list of 0 to 2 of the six views, a blank value and a name outside the six.
    const views = ["author", "candidate", "proctor", "scorer", "testConstructor", "tutor"];
    const lists = [
      [],
      ...views.map((view) => [view]),
      ...views.flatMap((left) => views.map((right) => [left, right])),
    ];
    const atLeastOne = new Set(["qti-rubric-block", "qti-rubric-block.test"]);
    for (const { kind, version } of declarersOf("view")) {
      const domain = Option.getOrThrow(domainAt(version, kind, "view"));
      const wrong = [
        ...lists.filter(
          (list) => matches(domain, list.join(" ")) !== (list.length > 0 || !atLeastOne.has(kind)),
        ),
        ...[" \t "].filter((blank) => matches(domain, blank) === atLeastOne.has(kind)),
        ...["viewer", "author viewer"].filter((value) => matches(domain, value)),
      ];

      assert.deepStrictEqual(wrong, [], `${version} ${kind}`);
    }
  });

  it("read 18 and 92: an order, graphic-order or position object interaction's min-choices is at least 1, every other kind's at least 0", () => {
    // Reading 18: "If specified, min-choices must be 1 or greater" of the order interactions
    // (§5.97.2, §5.61.1); reading 92: the same sentence of the position object (§5.107.2).
    const floored = new Set([
      "qti-order-interaction",
      "qti-graphic-order-interaction",
      "qti-position-object-interaction",
    ]);
    for (const { kind, version } of declarersOf("min-choices")) {
      const domain = Option.getOrThrow(domainAt(version, kind, "min-choices"));

      assert.strictEqual(matches(domain, "0"), !floored.has(kind), kind);
      assert.strictEqual(matches(domain, "+0"), !floored.has(kind), kind);
      assert.isTrue(matches(domain, " 1 "), kind);
    }
  });

  it("read 42, restated: a voice's languages are ranges both SSML's prose and its normative schema admit, so * is refused", () => {
    // SSML 1.1 §3.2.1 (each token an Extended Language Range, `und` and `zxx` disallowed) beside
    // Appendix D's `xs:NMTOKENS` (§2.2.2: conformance includes "the constraints expressed in the
    // Core Schema"); `*` is a range subtag of RFC 4647 §2.2 and no XML name character.
    for (const version of schemaVersions) {
      const domain = Option.getOrThrow(domainAt(version, "ssml:voice", "languages"));

      for (const value of ["", "en", "en-US", "en-GB:en-US", "fr ja", "x-klingon"]) {
        assert.isTrue(matches(domain, value), `${version} ${value}`);
      }

      for (const value of ["*", "en-*", "*-US", "en:*", "und", "ZXX", "en und"]) {
        assert.isFalse(matches(domain, value), `${version} ${value}`);
      }
    }
  });

  it("read 85: an xi:include's parse is xml alone, its whitespace collapsed as the XSD's token", () => {
    // Information model §2.12: "all included fragments must be treated as parsed xml"; the XSD's
    // `xi:parseType` admits `xml` and `text` (`w3/XInclude.xsd` lines 31 to 36).
    for (const version of schemaVersions) {
      const domain = Option.getOrThrow(domainAt(version, "xi:include", "parse"));

      assert.isTrue(matches(domain, "xml") && matches(domain, " xml "), version);
      assert.isFalse(matches(domain, "text") || matches(domain, "XML"), version);
    }
  });

  it("read 2: every MathML kind's xref is an IDREF, so it names an id of its document", () => {
    const declarers = attributeDeclarations.filter(
      ({ kind, name }) => kind.startsWith("m:") && name === "xref",
    );
    assert.isAbove(declarers.length, 0);
    for (const { kind, versions } of declarers) {
      for (const version of versions) {
        const xref = Option.getOrThrow(domainAt(version, kind, "xref"));

        assert.deepStrictEqual(xref.identity, Option.some("IDREF"), `${kind}@xref`);
        assert.isTrue(matches(xref, "a1") && matches(xref, " a1 "), `${kind}@xref`);
        assert.isFalse(matches(xref, "a b") || matches(xref, "1a") || matches(xref, ""), kind);
      }
    }
  });

  it("read 2, decision 327: an mglyph's alt, src and index are each optional and attributeCounts counts none of them, so a bare mglyph is accepted", () => {
    assert.isFalse(attributeCounts.some(({ kind }) => kind === "m:mglyph"));
    for (const name of ["alt", "src", "index"]) {
      const declarers = declarersOf(name).filter(({ kind }) => kind === "m:mglyph");
      assert.isAbove(declarers.length, 0, name);
      for (const { kind, version } of declarers) {
        assert.strictEqual(
          Option.getOrThrow(leafGrammar.admission.lookup({ kind, name, version })).use,
          "optional",
          name,
        );
      }
    }
  });

  it("read 46: every count, and figures, holds a signed 64-bit integer exactly", () => {
    for (const name of [
      "max-choices",
      "min-choices",
      "max-associations",
      "min-associations",
      "match-max",
      "match-min",
      "max-plays",
      "min-plays",
    ]) {
      const declarers = declarersOf(name);
      assert.isAbove(declarers.length, 0, name);
      for (const { kind, version } of declarers) {
        const domain = Option.getOrThrow(domainAt(version, kind, name));

        assert.isTrue(matches(domain, "9223372036854775807"), `${kind}@${name}`);
        assert.isTrue(matches(domain, " +09223372036854775807 "), `${kind}@${name}`);
        assert.isFalse(matches(domain, "9223372036854775808"), `${kind}@${name}`);
        assert.isFalse(matches(domain, "-1"), `${kind}@${name}`);
      }
    }

    for (const kind of ["qti-round-to", "qti-equal-rounded"]) {
      for (const version of schemaVersions) {
        const figures = Option.getOrThrow(domainAt(version, kind, "figures"));

        assert.isTrue(matches(figures, "-9223372036854775808"), kind);
        assert.isFalse(matches(figures, "-9223372036854775809"), kind);
        assert.isFalse(matches(figures, "9223372036854775808"), kind);
        assert.isTrue(matches(figures, "FIGURES"), kind);
      }
    }
  });

  it("read 2: a MathML number has no explicit +, and a content cn's base is a positive integer", () => {
    // MathML 3 §2.1.5.1: number is "an optional prefix of "-" (U+002D), followed by an unsigned
    // number", and "An explicit plus sign ('+') is not allowed as part of a numerical value";
    // §4.2.1.3: base "is a base 10 positive integer". The XSD types number xs:decimal and leaves
    // base untyped.
    const numbers = declarersOf("scriptsizemultiplier");
    assert.isAbove(numbers.length, 0);
    for (const { kind, version } of numbers) {
      const domain = Option.getOrThrow(domainAt(version, kind, "scriptsizemultiplier"));

      for (const value of ["0.71", "-0.5", ".5", "5.", "2", " 0.6 "]) {
        assert.isTrue(matches(domain, value), `${kind} ${value}`);
      }

      for (const value of ["+0.5", "+.5", "+2", ".", "-", "1e2", ""]) {
        assert.isFalse(matches(domain, value), `${kind} ${value}`);
      }
    }

    for (const version of schemaVersions) {
      const base = Option.getOrThrow(domainAt(version, "m:cn", "base"));

      for (const value of ["16", "2", " 2 ", "010"]) {
        assert.isTrue(matches(base, value), value);
      }

      for (const value of ["+10", "0", "000", "-2", "1.0", "ten", ""]) {
        assert.isFalse(matches(base, value), value);
      }
    }
  });

  it("read 120: a qti-index's n is at least 1 where it is a number, any NCName otherwise", () => {
    // Information model §5.72, Index: "'n' must be a positive integer"; the XSD's xs:int member
    // admits 0 and negatives, and reading 46 keeps no larger range for it.
    for (const version of schemaVersions) {
      const n = Option.getOrThrow(domainAt(version, "qti-index", "n"));

      for (const value of ["1", "+1", "01", " 2 ", "2147483647", "N", "i", "INDEX_1"]) {
        assert.isTrue(matches(n, value), value);
      }

      for (const value of ["0", "-0", "+0", "00", "-1", "2147483648", "1.5", ""]) {
        assert.isFalse(matches(n, value), value);
      }
    }
  });

  it("read 123: a bdo's dir is required and is ltr or rtl, never auto; another kind's dir keeps auto", () => {
    // Information model §5.11, BDO: "Authors must specify the dir attribute on this tag, with the
    // value ltr ... or rtl ... The auto value must not be specified". The XSD declares dir
    // optional, defaulting to auto (`readDeclarations` reads the use; the composed grammar's use
    // is the XSD uses test's).
    const bdo = attributeDeclarations.filter(({ kind }) => kind === "bdo");
    const read = readDeclarations(bdo);

    assert.deepStrictEqual(
      read.filter(({ use }, at) => use !== bdo[at]?.use).map(({ name, use }) => `${name} ${use}`),
      ["dir required"],
    );
    assert.deepStrictEqual(readingUses, [{ kind: "bdo", name: "dir", reading: 123 }]);
    for (const version of schemaVersions) {
      const dir = Option.getOrThrow(domainAt(version, "bdo", "dir"));
      const span = Option.getOrThrow(domainAt(version, "span", "dir"));

      assert.isTrue(matches(dir, "ltr") && matches(dir, "rtl"), version);
      assert.isFalse(matches(dir, "auto") || matches(dir, "") || matches(dir, " rtl"), version);
      assert.isTrue(matches(span, "auto"), version);
    }
  });

  it("read 124 and 125: each media URL holds something other than spaces, every declaring kind against blank and spaced values", () => {
    // Information model: audio and video src, video poster, source src and track src "must
    // contain a valid non-empty URL potentially surrounded by spaces" (§5.9.1, §5.166.1,
    // §5.166.9, §5.135.1, §5.163.2); HTML: a srcset "must consist of one or more image candidate
    // strings", each a valid non-empty URL. Oracle: after replace, a character other than a space.
    const urls = [
      ["audio", "src"],
      ["source", "src"],
      ["source", "srcset"],
      ["track", "src"],
      ["video", "poster"],
      ["video", "src"],
    ] as const;
    const values = ["", " ", "\t", " \n ", "\r\n", "a", " a ", "\ta", "a b.png 2x", "%20"];
    for (const [kind, name] of urls) {
      for (const version of schemaVersions) {
        const domain = Option.getOrThrow(domainAt(version, kind, name));
        const wrong = values.filter(
          (value) => matches(domain, value) !== /[^ ]/u.test(value.replaceAll(/[\t\n\r]/gu, " ")),
        );

        assert.deepStrictEqual(wrong, [], `${version} ${kind}@${name}`);
      }
    }
  });

  it("read 129: xml:lang, lang and srclang hold BCP 47 tags, against an independent RFC 5646 recogniser on every tag of up to three subtags", () => {
    // Oracle: RFC 5646 §2.1's ABNF walked subtag by subtag (`isLanguageTag`), not the pattern.
    // Bound: every tag of one to three subtags over `subtagSamples`, the 26 grandfathered tags in
    // two cases, and the named forms of the plan; an `xml:lang` or a `lang` may also be empty
    // (XML 1.0 §2.12; information model §5.15.3), but not on an item or a stimulus (§4.1.4,
    // §4.3.4) and never a `srclang` (§5.163.3).
    const tags = [
      ...subtagSamples.flatMap((first) => [
        first,
        ...subtagSamples.flatMap((second) => [
          `${first}-${second}`,
          ...subtagSamples.map((third) => `${first}-${second}-${third}`),
        ]),
      ]),
      ...grandfathered.flatMap((tag) => [tag, tag.toUpperCase()]),
      "zh-Hant-TW",
      "de-CH-1996",
      "EN-us",
      "de-a-value",
      "en--x",
      "en-a",
      "en-US-x",
      "a-value",
      "en_US x",
      "english language",
      "1a",
      "en-",
      "-en",
      "zh-yue-HK",
      "en-Latn-US-1996-a-bc-x-ab",
      "en-abc-def-ghi",
      "en-abc-def-ghi-jkl",
      "en-US-US",
      "de-1996-1996",
      "en-a-bc-a-de",
      "x-a-b-c",
      "en-x",
    ];
    const roots = new Set(["qti-assessment-item", "qti-assessment-stimulus"]);
    const attributes = [
      ...declarersOf("xml:lang").map((at) => ({
        ...at,
        empty: !roots.has(at.kind),
        name: "xml:lang",
      })),
      ...declarersOf("lang").map((at) => ({ ...at, empty: true, name: "lang" })),
      ...declarersOf("srclang").map((at) => ({ ...at, empty: false, name: "srclang" })),
    ];
    const checked = new Map<string, readonly string[]>();

    assert.isAbove(tags.length, 10_000);
    assert.isAbove(attributes.length, 400);
    for (const { empty, kind, name, version } of attributes) {
      const domain = Option.getOrThrow(domainAt(version, kind, name));
      const wrong =
        checked.get(`${domain.handle} ${String(empty)}`) ??
        [...tags, "", "en ", " en"].filter(
          (value) =>
            matches(domain, value) !==
            (value === "" ? empty : isLanguageTag(name === "xml:lang" ? value.trim() : value)),
        );
      checked.set(`${domain.handle} ${String(empty)}`, wrong);

      assert.deepStrictEqual(wrong.slice(0, 20), [], `${version} ${kind}@${name}`);
    }
  });

  it("read 132 and 161: a printed variable's format is a printf format string over the listed codes, of any number of conversions, against an independent recogniser on every string of one to four pieces", () => {
    // Information model §2.3.4: each conversion specifier is "%", flags of "#", "0", "-", " " and
    // "+", an optional width, an optional precision ("." and zero or more digits), and one of E, e,
    // f, G, g, r, R, i, o, X or x; the rest of a C format string is text and "%%". Reading 161 sets
    // aside reading 132's one specifier: QTI bans no second conversion (PR #46, comment
    // 6701102861), so a format holds any number, none included, and is stored as written.
    // Oracle: `isPrintfFormat`, a left-to-right walk of the string that reads each specifier, not
    // the pattern. Bound: every string of one to four pieces (30,940), which reaches each count of
    // specifiers, none to several, well-formed and malformed.
    const pieces = ["%", "%%", "%i", "d", "f", ".", "5", " ", "#", "-", "x", "q", "é"];
    const strings = [
      "",
      "%.2f",
      "%.f",
      "%5.2e",
      "Score: %i%%",
      "%#x",
      "%-+ #012.3E",
      "2f%",
      "100%%",
      "%i of %i",
      "%%%e%%%G",
    ];
    let level: readonly string[] = [""];
    for (let length = 1; length <= 4; length += 1) {
      level = level.flatMap((head) => pieces.map((piece) => `${head}${piece}`));
      strings.push(...level);
    }

    assert.deepStrictEqual(
      printfNotes.filter((note) => !strings.some((value) => printfNote(value) === note)),
      [],
      "the bound reaches every count of specifiers, well-formed and malformed",
    );
    for (const version of schemaVersions) {
      const format = Option.getOrThrow(domainAt(version, "qti-printed-variable", "format"));
      const wrong = strings.filter((value) => matches(format, value) !== isPrintfFormat(value));

      assert.deepStrictEqual(wrong.slice(0, 20), [], version);
      assert.isTrue(
        matches(format, "%.2f") &&
          matches(format, "Score: %i%%") &&
          matches(format, "100%%") &&
          matches(format, "%i of %i") &&
          matches(format, "%%%e%%%G") &&
          matches(format, "%i, %.2f and %#x") &&
          matches(format, "%d") &&
          matches(format, "%d %d") &&
          matches(format, "%i of %d"),
        version,
      );
      assert.isFalse(
        matches(format, "%") || matches(format, "%q") || matches(format, "%i of %"),
        version,
      );
    }
  });

  it.effect(
    "read 161, searched: generated formats of any number of specifiers, swarm-weighted over five kinds of piece, judged as the independent recogniser judges them, each count of specifiers reached well-formed and malformed",
    (ctx) =>
      // Reading 161 (PR #46, comment 6701102861): a format with two or more conversions is
      // accepted and stored as written; reading 132's codes still judge each one. The search must
      // reach each count, none, one, two and several, with every specifier well-formed and with
      // one malformed (`printfNotes`), so a domain that refuses a second conversion, or admits a
      // malformed one beside a well-formed one, fails it.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<PrintfNote>(printfNotes, { cases: 600, sense: notesOnly }),
            draw: drawn(printfCase),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "information model §2.3.4's conversion specifier and C11 §7.21.6.1's format string read character by character (printfSpecifiers, isPrintfFormat), not the pattern",
            },
            runs: 800,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "grammar/attributes/printf-format",
          },
          (value, c) =>
            Effect.sync(() => {
              c.note(printfNote(value));
              for (const version of schemaVersions) {
                const format = Option.getOrThrow(
                  domainAt(version, "qti-printed-variable", "format"),
                );

                assert.strictEqual(
                  matches(format, value),
                  isPrintfFormat(value),
                  `${version} ${JSON.stringify(value)}`,
                );
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it("read 9: an h1's role is heading, tab or presentation, and every other kind's ARIA role keeps each role the XSD lists, every declarer against every listed role and the near misses", () => {
    // ASI binding §5.3.1, RULE ARIA ROLE 1b: "The 'h1' tag may have an ARIA role value of
    // 'heading' or 'tab' or 'presentation' only". Oracle: the XSD's enumeration, from the leaf's
    // own resolution, and the rule's three names restated here; the Schematron's text itself is
    // the cached suite's below. SSML's `role` is a list of QNames, no enumeration, and is left out.
    const allowed = new Set(["heading", "tab", "presentation"]);
    const nearMisses = [
      "Heading",
      " heading",
      "heading ",
      "heading tab",
      "",
      "tab\t",
      "none",
      "h1",
    ];
    const declarers = attributeDeclarations.filter(
      ({ domain, name }) => name === "role" && enumerationOf(domain).length > 0,
    );
    let checked = 0;
    for (const { domain, kind, versions } of declarers) {
      const roles = enumerationOf(domain);
      for (const version of versions) {
        const held = Option.getOrThrow(domainAt(version, kind, "role"));
        const wrong = [...roles, ...nearMisses].filter(
          (value) =>
            matches(held, value) !==
            (roles.includes(value) && (kind !== "h1" || allowed.has(value))),
        );

        assert.deepStrictEqual(wrong, [], `${version} ${kind}@role`);
        checked += 1;
      }
    }

    assert.isAbove(checked, 200);
    assert.isTrue(declarers.some(({ kind }) => kind === "h1"));
    assert.isTrue(
      declarers.every(({ domain }) =>
        [...allowed].every((role) => enumerationOf(domain).includes(role)),
      ),
    );
  });

  it("read 9: a source carries no role, and the only declarations the readings drop are it and reading 85's xpointer", () => {
    // ASI binding §5.3.1, RULE ARIA ROLE 1a: "The 'source' tag must not have an ARIA role
    // attribute", where the XSD declares it; information model §2.12 for `xpointer`. Oracle: the
    // leaf's declarations, every one, against those `readDeclarations` keeps.
    const kept = new Set(
      readDeclarations(attributeDeclarations).map(({ kind, name }) => `${kind} ${name}`),
    );
    const dropped = [...new Set(attributeDeclarations.map(({ kind, name }) => `${kind} ${name}`))]
      .filter((declared) => !kept.has(declared))
      .toSorted();

    assert.deepStrictEqual(dropped, ["source role", "xi:include xpointer"]);
    assert.isTrue(kept.has("h1 role") && kept.has("video role") && kept.has("source type"));
  });

  it.effect(
    "read 9: the composed grammar admits no role on a source, under its kind, any governor or any open class but data-*, in both versions",
    () =>
      // Oracle: the composed grammar's rows themselves, every governor's and every open class's,
      // against the rule; spec reading 90 leaves `source`, which the Schematron's extension rules
      // cover, the `data-*` class alone, so a `role` there is no name it admits.
      Effect.gen(function* sourceHasNoRole() {
        const { attributes } = yield* Effect.fromResult(composed());
        for (const version of schemaVersions) {
          assert.isTrue(
            Option.isNone(attributes.admission.lookup({ kind: "source", name: "role", version })),
            version,
          );
          assert.deepStrictEqual(
            openClasses.filter((open) =>
              Option.isSome(attributes.admission.lookup({ kind: "source", name: open, version })),
            ),
            ["data-*"],
            version,
          );
          assert.isTrue(
            Option.isSome(attributes.admission.lookup({ kind: "h1", name: "role", version })),
            version,
          );
        }

        assert.deepStrictEqual(
          attributes.governed.rows.filter(
            ({ governor, name }) => governor.startsWith("source ") && name === "role",
          ),
          [],
        );
      }),
    testTimeoutMs,
  );

  it(
    "read 135: every MIME type is RFC 2045's two tokens and a slash, and each item of the upload's list, against an independent reader on every string of up to four symbols and the named cases",
    () => {
      // Information model §7.25, MimeType: "The mime type (type and subtype), as defined by
      // [RFC 2045]"; §5.1.2 and §5.135.2: "its value must be a valid MIME type". RFC 2045 §5.1:
      // `type "/" subtype`, each a token, "1*<any (US-ASCII) CHAR except SPACE, CTLs, or
      // tspecials>". Oracle: `mediaTypeFault`, a code-point walk of the RFC's sentence, not the
      // pattern. Bound: every string of at most four of `mediaTypeSymbols` (88,741), each declarer,
      // both versions, then the named cases with the verdicts the reading states.
      const declarers = attributeDeclarations
        .filter(({ type }) => type.type === "MimeTypeDType")
        .map(({ kind, name }) => `${kind}@${name}`)
        .toSorted();

      assert.deepStrictEqual(declarers, [
        "a@type",
        "object@type",
        "param@type",
        "qti-calculator-info@mime-type",
        "qti-digital-material@mime-type",
        "qti-file-href.card@mime-type",
        "qti-stylesheet@type",
        "source@type",
      ]);

      const named: readonly (readonly [string, boolean])[] = [
        ["image/png", true],
        ["IMAGE/PNG", true],
        ["image/svg+xml", true],
        ["application/vnd.ms-excel", true],
        ["x-world/x-vrml", true],
        ["*/*", true],
        ["text/x-{a}~|`'!#$%&^_.", true],
        [`${"a".repeat(200)}/${"b".repeat(300)}`, true],
        [" image/png", false],
        ["image/png ", false],
        ["image /png", false],
        ["image/ png", false],
        ["a b/c", false],
        ["image/png\t", false],
        ["\nimage/png", false],
        ["image/png\r", false],
        ["image/png\u007F", false],
        ["image", false],
        ["/png", false],
        ["image/", false],
        ["/", false],
        ["", false],
        ["a/b/c", false],
        ["a//b", false],
        ["text/html;charset=utf-8", false],
        ["text/html; charset=utf-8", false],
        ["é/x", false],
        ["a(b)/c", false],
        ["a@b/c", false],
        ["[a]/b", false],
        ["a/b=c", false],
        ['a/"b"', false],
        ["\u00A0", false],
        ["image/png\u00A0", false],
        ["\uFEFFimage/png", false],
      ];
      const checked = new Map<string, readonly string[]>();
      for (const at of declarers) {
        const [kind = "", name = ""] = at.split("@");
        for (const { version } of declarersOf(name).filter((declarer) => declarer.kind === kind)) {
          const domain = Option.getOrThrow(domainAt(version, kind, name));
          const wrong =
            checked.get(domain.handle) ??
            mediaTypeScope.filter(
              (value) => matches(domain, value) !== (mediaTypeFault(value) === "valid"),
            );
          checked.set(domain.handle, wrong);

          assert.deepStrictEqual(wrong.slice(0, 20), [], `${version} ${at}`);
          for (const [value, valid] of named) {
            assert.strictEqual(
              matches(domain, value),
              valid,
              `${version} ${at} ${JSON.stringify(value)}`,
            );
            assert.strictEqual(
              mediaTypeFault(value) === "valid",
              valid,
              `the reader on ${JSON.stringify(value)}`,
            );
          }
        }
      }

      for (const version of schemaVersions) {
        const upload = Option.getOrThrow(domainAt(version, "qti-upload-interaction", "type"));
        const lists = [
          ...mediaTypeScope,
          ...named.flatMap(([first]) => named.map(([second]) => `${first} ${second}`)),
          " image/png  text/plain ",
          "image/png\ttext/plain\n",
          "\u00A0",
          " \u00A0 ",
          "image/png\u00A0text/plain",
        ];
        const wrong = lists.filter((value) => matches(upload, value) !== isMediaTypeList(value));

        assert.deepStrictEqual(wrong.slice(0, 20), [], version);
        assert.isTrue(matches(upload, " image/png  text/plain ") && matches(upload, ""), version);
        assert.isFalse(
          matches(upload, "image/png a(b)/c") || matches(upload, "image/png\u007F text/plain"),
          version,
        );
      }
    },
    testTimeoutMs,
  );

  it.effect(
    "read 135, searched: generated MIME values and lists, swarm-weighted over nine character classes, judged as the independent reader judges them, each rule of the reader reached alone",
    (ctx) =>
      // The search must reach each rule the reader tells apart broken alone, the inputs nearest a
      // valid one, of a value (`mediaTypeNotes`) and of a list (`mediaTypeListNotes`).
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required<MediaTypeNote | MediaTypeListNote>(
              [...mediaTypeNotes, ...mediaTypeListNotes],
              { cases: 600, sense: notesOnly },
            ),
            draw: drawn(mediaTypeCase),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "RFC 2045 §5.1's media type read code point by code point (mediaTypeFault, isMediaTypeList), not the pattern",
            },
            runs: 800,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "grammar/attributes/media-type",
          },
          ({ list, value }, c) =>
            Effect.sync(() => {
              const fault = mediaTypeFault(value);
              const valid = isMediaTypeList(list);
              c.note(mediaTypeNote(value));
              c.note(mediaTypeListNote(list));

              assert.strictEqual(
                mediaTypeFaultsOf(value).size === 0,
                fault === "valid",
                "the reader's two readings agree",
              );
              for (const version of schemaVersions) {
                const single = Option.getOrThrow(domainAt(version, "a", "type"));
                const upload = Option.getOrThrow(
                  domainAt(version, "qti-upload-interaction", "type"),
                );

                assert.strictEqual(
                  matches(single, value),
                  fault === "valid",
                  `${version} ${JSON.stringify(value)}`,
                );
                assert.strictEqual(
                  matches(upload, list),
                  valid,
                  `${version} ${JSON.stringify(list)}`,
                );
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "read 136: a default shape's coords is required and a CoordsDType, as every shape's is, every kind with a default shape in the composed grammar against an independent reader on every list of up to eight tokens",
    () =>
      // Information model §7.9, Coords: "(e) default: no coordinates should be given", a best
      // practice (§1.3); coords has multiplicity [1] on every class with a shape (§5.7.6,
      // §5.67.5, §5.75.2, §7.4.2), and "A value of a shape is always accompanied by coordinates"
      // (§8.29). The grammar reads the XSD's required CoordsDType, by no reading of its own.
      // Oracle: `isCoords`, the pattern's counts read token by token, and the XSD's use from the
      // leaf. Bound: every list of one to eight tokens over four samples (87,380), each kind with
      // a default shape, under its kind and every governor of it, both versions.
      Effect.gen(function* defaultAreaCoords() {
        const { attributes } = yield* Effect.fromResult(composed());
        const byHandle = new Map(attributes.domains.map((domain) => [domain.handle, domain]));
        const areaKinds = attributeDeclarations
          .filter(
            ({ domain, name }) => name === "shape" && enumerationOf(domain).includes("default"),
          )
          .map(({ kind }) => kind)
          .toSorted();

        assert.deepStrictEqual(areaKinds, [
          "qti-area-map-entry",
          "qti-associable-hotspot",
          "qti-hotspot-choice",
          "qti-inside",
        ]);

        const samples = ["15", "5%", "", " 1"] as const;
        const levels: (readonly string[])[] = [samples];
        for (let length = 2; length <= 8; length += 1) {
          levels.push(
            (levels.at(-1) ?? []).flatMap((head) => samples.map((sample) => `${head},${sample}`)),
          );
        }

        const lists = [
          ...levels.flat(),
          "0 0 1 1",
          "0,0,1,1,",
          ",0,0,1",
          "0,0,1\t",
          "\t0,0,1",
          "-1,0,1",
          "1.5,0,1",
          "0,0,1%%",
        ];

        assert.strictEqual(lists.length, 87_380 + 8);

        const rows = [
          ...attributes.admission.rows.map((row) => ({ ...row, at: row.kind })),
          ...attributes.governed.rows.map((row) => ({ ...row, at: row.governor })),
        ].filter(
          ({ at, name }) =>
            name === "coords" && areaKinds.some((kind) => at === kind || at.startsWith(`${kind} `)),
        );
        const checked = new Map<string, readonly string[]>();
        for (const { at, domain: handle, use, version } of rows) {
          const domain = byHandle.get(handle);
          const wrong =
            checked.get(handle) ??
            lists.filter(
              (value) => domain === undefined || matches(domain, value) !== isCoords(value),
            );
          checked.set(handle, wrong);

          assert.strictEqual(use, "required", `${version} ${at}`);
          assert.strictEqual(handle, "CoordsDType", `${version} ${at}`);
          assert.deepStrictEqual(wrong.slice(0, 20), [], `${version} ${at}`);
        }

        assert.isAtLeast(rows.length, areaKinds.length * schemaVersions.length);
        assert.isFalse(specReadings.some(({ name }) => name === "coords" || name === "shape"));
        for (const version of schemaVersions) {
          assert.strictEqual(
            Option.getOrThrow(
              attributes.admission.lookup({
                kind: "qti-media-interaction",
                name: "coords",
                version,
              }),
            ).use,
            "optional",
          );
        }
      }),
    testTimeoutMs,
  );
});

/**
 * The identity type a definition's built-in makes it, by XML Schema Part 1's ID/IDREF rules: an
 * atomic `ID` or `IDREF`, or a list of `IDREF`s.
 *
 * @param domain - The definition.
 * @returns Its identity type, or none.
 */
const identityOf = (domain: Domain): Option.Option<string> => {
  if (domain._tag === "atomic") {
    return domain.builtin === "ID" || domain.builtin === "IDREF"
      ? Option.some(domain.builtin)
      : Option.none();
  }

  return domain._tag === "list" && domain.item._tag === "atomic" && domain.item.builtin === "IDREF"
    ? Option.some("IDREFS")
    : Option.none();
};

/**
 * The spec readings that apply to a kind's attribute, by number: those naming the attribute on
 * every kind that declares it, or on this kind.
 *
 * @param kind - The kind.
 * @param name - The attribute.
 * @returns The readings' numbers, ascending.
 */
const readingNumbersOf = (kind: string, name: string): readonly number[] =>
  [
    ...new Set(
      specReadings
        .filter(
          (reading) =>
            reading.name === name &&
            Option.match(reading.kinds, { onNone: () => true, onSome: (on) => on.includes(kind) }),
        )
        .map(({ reading }) => reading),
    ),
  ].toSorted((left, right) => left - right);

/**
 * The readings a domain's handle names: the numbers in its ` (reading …)` part, none without one.
 *
 * @param handle - The handle.
 * @returns The numbers, ascending.
 */
const readingsNamed = (handle: string): readonly number[] =>
  Option.match(Option.fromNullishOr(/ \(reading (?<numbers>[\d, ]+)\)/u.exec(handle)?.groups), {
    onNone: () => [],
    onSome: ({ numbers = "" }) => numbers.split(", ").map(Number),
  }).toSorted((left, right) => left - right);

describe("The value domains' names", () => {
  it("name the spec readings of an attribute each was compiled for, and only those, every domain of the leaf", () => {
    // Oracle: the specification as a checker, the roster's naming rule: a domain is named after
    // the type it was first compiled from, a reading's with the reading, so its handle's readings
    // are exactly those that apply to some attribute it is the domain of, and a handle naming none
    // is some unread attribute's or text's domain.
    const readingsOfDomain = new Map<string, Set<string>>();
    const add = (domain: string, readings: readonly number[]) => {
      readingsOfDomain.set(
        domain,
        (readingsOfDomain.get(domain) ?? new Set<string>()).add(readings.join(", ")),
      );
    };
    for (const { domain, kind, name } of leafGrammar.admission.rows) {
      add(domain, readingNumbersOf(kind, name));
    }

    for (const { domain } of leafGrammar.text.rows) {
      add(domain, []);
    }

    assert.deepStrictEqual(
      leafGrammar.domains
        .filter(
          ({ handle }) =>
            !(readingsOfDomain.get(handle) ?? new Set()).has(readingsNamed(handle).join(", ")),
        )
        .map(({ handle }) => [handle, [...(readingsOfDomain.get(handle) ?? [])]]),
      [],
    );
  });
});

describe("The attribute grammar's structure", () => {
  it("numbers each (version, kind)'s admitted names 0 to n − 1 in AttributeName code order, a bijection", () => {
    const byKind = Map.groupBy(
      leafGrammar.admission.rows,
      ({ kind, version }) => `${version} ${kind}`,
    );
    for (const [key, rows] of byKind) {
      const ordered = rows.toSorted(
        (left, right) =>
          Option.getOrThrow(rosters.names.codeOf(left.name)) -
          Option.getOrThrow(rosters.names.codeOf(right.name)),
      );

      assert.deepStrictEqual(
        ordered.map(({ position }) => Number(position)),
        ordered.map((_, at) => at),
        key,
      );
    }

    assert.strictEqual(
      leafGrammar.positions.handles.length,
      Math.max(...[...byKind.values()].map((rows) => rows.length)),
    );
  });

  it("admits each declaration of the leaf, in each of its versions, with its use, and nothing else", () => {
    const stated = new Set(
      attributeDeclarations.flatMap(({ kind, name, use, versions }) =>
        versions.map((version) => `${version} ${kind} ${name} ${use}`),
      ),
    );
    const admitted = new Set(
      leafGrammar.admission.rows.map(
        ({ kind, name, use, version }) => `${version} ${kind} ${name} ${use}`,
      ),
    );

    assert.deepStrictEqual([...admitted.symmetricDifference(stated)], []);
  });

  it("gives every simple-content kind of the leaf its text's domain in each of its versions (A9)", () => {
    const stated = new Set(
      textTypes.flatMap(({ kind, versions }) => versions.map((version) => `${version} ${kind}`)),
    );
    const held = new Set(leafGrammar.text.rows.map(({ kind, version }) => `${version} ${kind}`));

    assert.deepStrictEqual([...held.symmetricDifference(stated)], []);
    for (const kind of [
      "cp:schema",
      "cp:schemaversion",
      "qmd:toolName",
      "qmd:interactionType",
      "drd:hazard",
      "lom:string",
      "ud:value",
    ]) {
      assert.isTrue(Option.isSome(leafGrammar.text.lookup({ kind, version: "3.0.1" })), kind);
    }
  });

  it("derives each domain's identity from the built-in its type restricts, and from nothing else", () => {
    for (const declared of attributeDeclarations) {
      // Readings 15 and 2 read these as other than their type: no identity, and an IDREF.
      if (
        declared.name !== "variable-identifier-ref" &&
        !(declared.kind.startsWith("m:") && declared.name === "xref")
      ) {
        for (const version of declared.versions) {
          assert.deepStrictEqual(
            Option.getOrThrow(domainAt(version, declared.kind, declared.name)).identity,
            identityOf(declared.domain),
            `${declared.kind}@${declared.name}`,
          );
        }
      }
    }

    assert.deepStrictEqual(leafGrammar.identity.rows.map(({ identity }) => identity).toSorted(), [
      "ID",
      "IDREF",
      "IDREFS",
    ]);
  });

  it("holds the BaseType roster's members as the XSD's base-type enumeration", () => {
    const declared = attributeDeclarations.find(
      ({ kind, name }) => kind === "qti-response-declaration" && name === "base-type",
    );

    assert.deepStrictEqual(
      [...baseTypes].toSorted(),
      [...(declared === undefined ? [] : enumerationOf(declared.domain))].toSorted(),
    );
  });
});

/**
 * One toy declaration over a toy kind.
 *
 * @param kind - The kind.
 * @param name - The attribute.
 * @param pattern - Its one XSD pattern.
 * @returns The declaration.
 */
const toyDeclaration = (kind: string, name: string, pattern: string): Declared => ({
  domain: {
    _tag: "atomic",
    builtin: "string",
    facets: [{ facet: "whiteSpace", value: "preserve" }],
    patterns: [[pattern]],
    primitive: "string",
  },
  kind,
  name,
  type: { inline: Option.none(), type: "Toy", whiteSpace: "preserve" },
  use: "optional",
  versions: ["3.0.1"],
});

/**
 * Generate a toy grammar over the toy rosters.
 *
 * @param declarations - The declarations.
 * @param kinds - The kind roster.
 * @returns The generator's result.
 */
const toyGenerate = (declarations: readonly Declared[], kinds: Roster<string>) =>
  generate({
    declarations,
    kinds,
    names: Result.getOrThrow(roster("AttributeName", ["a", "b"])),
    texts: [],
    versions: rosters.versions,
    ...ungoverned,
  });

describe("The attribute grammar's refusals", () => {
  const kinds = Result.getOrThrow(roster("NodeKind", ["k"]));

  it("refuse a kind that declares a name twice in a version", () => {
    const result = toyGenerate(
      [toyDeclaration("k", "a", "x"), toyDeclaration("k", "a", "y")],
      kinds,
    );

    assert.isTrue(Result.isFailure(result) && result.failure._tag === "KeyCollision");
  });

  it("refuse a kind or a name outside its roster", () => {
    for (const declared of [toyDeclaration("j", "a", "x"), toyDeclaration("k", "c", "x")]) {
      const result = toyGenerate([declared], kinds);

      assert.isTrue(
        Result.isFailure(result) && result.failure._tag === "OutsideCodeSpace",
        `${declared.kind}@${declared.name}`,
      );
    }
  });

  it("refuse a declaration whose domain does not compile, naming it", () => {
    const result = toyGenerate([toyDeclaration("k", "b", "[]")], kinds);

    assert.isTrue(Result.isFailure(result) && result.failure._tag === "UncompiledDomain");
    assert.include(Result.isFailure(result) ? result.failure.message : "", "k@b");
  });

  it("intern one domain per definition, whichever declarations share it", () => {
    const result = Result.getOrThrow(
      toyGenerate([toyDeclaration("k", "a", "x"), toyDeclaration("k", "b", "x")], kinds),
    );

    assert.strictEqual(result.domains.length, 1);
    assert.strictEqual(result.valueDomain.rows.length, 1);
  });
});

/**
 * Whether every pinned XSD is in the cache.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The pinned schema sets the XSD reading walks, each with the version its uses are read in.
 */
const schemas: readonly (readonly [SourcePath, SchemaVersion])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1"],
  ["imsqtiv3p0_imscpv1p2_v1p0.xsd", "3.0.0"],
  ["imsqtiv3p0p1_imscpv1p2_v1p0.xsd", "3.0.1"],
];

/**
 * The open classes, the `AttributeName` handles of names no declaration states, from their owner's
 * roster, so a class the roster gains is set aside here too.
 */
const openNames: ReadonlySet<string> = new Set(openClasses);

/**
 * Whether a name is one the composition states beside the XSD's declarations: an XML Schema
 * instance attribute, or an open class.
 *
 * @param name - An attribute handle.
 * @returns Whether it is the layer's.
 */
const isLayerName = (name: string): boolean => name.startsWith("xsi:") || openNames.has(name);

/**
 * The XML namespace, whose attributes the grammar names `xml:<local>`.
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

describe.skipIf(!cached)("The XSD's attribute uses", () => {
  it.effect(
    "are what the composed grammar admits on every kind the XSD reading reaches, with the XSD's use, the layer's names aside",
    () =>
      Effect.gen(function* attributeUsesAreTheXsds() {
        const { attributes, kinds } = yield* Effect.fromResult(composed());
        const differences: string[] = [];
        let compared = 0;
        for (const [root, version] of schemas) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, (namespace, local, parent) =>
            kinds.nodeKind.has(parent) ? kinds.resolve(namespace, local, parent) : Option.none(),
          );
          for (const [kind, models] of contents) {
            const expected = new Map<string, string>();
            for (const model of models) {
              for (const use of model.attributes) {
                if (use.use !== "prohibited") {
                  expected.set(
                    use.name.namespace === xmlNamespace ? `xml:${use.name.local}` : use.name.local,
                    use.use,
                  );
                }
              }
            }

            // Spec reading 10: ARIA's `aria-keyshortcuts` beside the XSD's `aria-keyshorts`, with
            // its use; spec reading 85: an `xi:include` carries no `xpointer` (§2.12); spec reading
            // 9: a `source` carries no `role` (the Schematron's RULE ARIA ROLE 1a); spec reading
            // 123: a `bdo` carries `dir` (§5.11).
            const misspelled = expected.get("aria-keyshorts");
            if (misspelled !== undefined) {
              expected.set("aria-keyshortcuts", misspelled);
            }

            if (kind === "xi:include") {
              expected.delete("xpointer");
            }

            if (kind === "source") {
              expected.delete("role");
            }

            for (const readingUse of readingUses.filter((use) => use.kind === kind)) {
              if (expected.has(readingUse.name)) {
                expected.set(readingUse.name, "required");
              }
            }

            const admitted = new Map(
              attributes.admission.rows
                .filter(
                  (row) =>
                    row.version === version &&
                    row.kind === kind &&
                    !isLayerName(row.name) &&
                    ((!row.name.startsWith("xml:") && !row.name.startsWith("xlink:")) ||
                      expected.has(row.name) ||
                      !models.some(({ anyAttribute }) => anyAttribute)),
                )
                .map(({ name, use }) => [name, use] as const),
            );
            compared += admitted.size;
            for (const [name, use] of expected) {
              if (admitted.get(name) !== use) {
                differences.push(
                  `${version} ${kind}@${name}: the XSD declares it ${use}, the grammar ${admitted.get(name) ?? "does not admit it"}`,
                );
              }
            }

            for (const name of admitted.keys()) {
              if (!expected.has(name)) {
                differences.push(
                  `${version} ${kind}@${name}: the grammar admits it, the XSD does not declare it`,
                );
              }
            }
          }
        }

        assert.isAbove(compared, 5000);
        assert.deepStrictEqual(differences, []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    testTimeoutMs,
  );
});

/**
 * The four attributes `xml.xsd` declares globally.
 */
const xmlGlobals = globalAttributes.filter(({ name }) => name.startsWith("xml:"));

/**
 * A minimal LOM document whose `string` carries `xml:lang`: valid, since LOM loose's `string` holds
 * an `xs:anyAttribute namespace="##other" processContents="lax"`, and the XML namespace is other
 * than LOM's (the reduction of five corpus manifests the grammar refused).
 */
const lomWithXmlLang =
  '<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><title><string xml:lang="en">t</string></title></general></lom>\n';

describe.skipIf(!cached)("The document layer", () => {
  it.effect(
    "admits xml.xsd's four globals under their own domains on every kind whose lax or strict attribute wildcard admits the XML namespace, and under the open domain where it skips",
    () =>
      Effect.gen(function* layerFollowsTheWildcards() {
        const { attributes, kinds } = yield* Effect.fromResult(composed());
        const byHandle = new Map(attributes.domains.map((domain) => [domain.handle, domain]));
        // Spec reading 90: on an element the Schematron's extension rules cover, an `xml:` name
        // the kind does not declare is no `data-` extension, so it is refused there.
        const covered = new Set(
          coveredElements.flatMap(({ element: covers, versions }) =>
            versions.map((version) => `${version} {${covers.namespace}}${covers.local}`),
          ),
        );
        const coveredAt = (version: SchemaVersion, kind: string): boolean =>
          Option.exists(kinds.elementName.lookup({ kind }), ({ local, namespace }) =>
            covered.has(`${version} {${namespace}}${local}`),
          );
        const missing: string[] = [];
        let checked = 0;
        let refused = 0;
        for (const wildcard of attributeWildcards.filter(
          ({ namespace }) => namespace !== "##local",
        )) {
          for (const version of wildcard.versions) {
            for (const global of xmlGlobals) {
              const row = attributes.admission.lookup({
                kind: wildcard.kind,
                name: global.name,
                version,
              });
              const declared = attributeDeclarations.some(
                ({ kind, name, versions }) =>
                  kind === wildcard.kind && name === global.name && versions.includes(version),
              );
              checked += 1;
              if (!declared && coveredAt(version, wildcard.kind)) {
                refused += 1;
                if (Option.isSome(row)) {
                  missing.push(
                    `${version} ${wildcard.kind}@${global.name} is admitted, though reading 90 refuses it`,
                  );
                }
              } else if (Option.isNone(row)) {
                missing.push(`${version} ${wildcard.kind}@${global.name}`);
              } else if (!declared) {
                const domain = byHandle.get(row.value.domain);
                const lax = wildcard.processing !== "skip";
                const accepts = (value: string) => domain !== undefined && matches(domain, value);
                if (lax && global.name === "xml:space" && accepts("neither")) {
                  missing.push(
                    `${version} ${wildcard.kind}@xml:space reads no xml.xsd type under ${wildcard.processing}`,
                  );
                }

                if (!lax && !accepts("neither")) {
                  missing.push(
                    `${version} ${wildcard.kind}@${global.name} is validated under skip`,
                  );
                }
              }
            }
          }
        }

        assert.isAbove(checked, 1000);
        assert.isAbove(refused, 0);
        assert.deepStrictEqual(missing, []);
        // Spec reading 129: XML 1.0 §2.12 makes every xml:lang a BCP 47 tag or empty, under a
        // lax wildcard (LOM's string) and a skip one (MathML's) alike.
        for (const version of schemaVersions) {
          for (const kind of ["lom:string", "m:mi"]) {
            const lang = Option.getOrThrow(
              attributes.admission.lookup({ kind, name: "xml:lang", version }),
            );
            const domain = byHandle.get(lang.domain);

            assert.isTrue(
              domain !== undefined &&
                matches(domain, "en") &&
                matches(domain, "") &&
                !matches(domain, "en_US"),
              `${version} ${kind}`,
            );
          }
        }
      }),
    testTimeoutMs,
  );

  it.effect(
    "admits the LOM string's xml:lang that xmllint validates, the corpus manifests' reduction",
    () =>
      Effect.gen(function* lomXmlLangIsValid() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("attribute-layer-");
        const oracle = yield* writeXsdOracle(directory);
        yield* fs.writeFileString(`${directory}/lom-xml-lang.xml`, lomWithXmlLang);

        const [verdict] = yield* xmllintValidate({
          catalog: oracle.catalog,
          paths: [`${directory}/lom-xml-lang.xml`],
          schema: oracle.drivers["3.0.1"],
        });
        const { attributes } = yield* Effect.fromResult(composed());

        assert.strictEqual(verdict?._tag, "Valid");
        assert.isTrue(
          Option.isSome(
            attributes.admission.lookup({ kind: "lom:string", name: "xml:lang", version: "3.0.1" }),
          ),
        );
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    testTimeoutMs,
  );
});

/**
 * The ASI XSDs whose embedded Schematron states `RULE_SET_ARIA_ROLES_1`, each with its version.
 */
const ariaRuleSources: readonly (readonly [SourcePath, SchemaVersion])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1"],
];

/**
 * The rules of `RULE_SET_ARIA_ROLES_1` in an ASI XSD's raw text, from the pattern's start tag to
 * the next `</sch:pattern>`: each rule's `//qti:<local>` context and its one assertion's test.
 *
 * @param text - The XSD's text.
 * @returns The tests, by context's local name, in the text's order.
 */
const ariaRulesIn = (text: string): ReadonlyMap<string, string> => {
  const start = text.indexOf('<sch:pattern abstract="false" id="RULE_SET_ARIA_ROLES_1">');
  const body = start === -1 ? "" : text.slice(start, text.indexOf("</sch:pattern>", start));

  return new Map(
    [
      ...body.matchAll(
        /<sch:rule abstract="false" context="\/\/qti:(?<local>[a-z0-9-]+)">\s*<sch:assert test="(?<test>[^"]*)">/gu,
      ),
    ].map((found) => [found.groups?.["local"] ?? "", found.groups?.["test"] ?? ""] as const),
  );
};

describe.skipIf(!cached)("The Schematron's ARIA role rules", () => {
  it.effect(
    "are what the composed grammar reads in each version, from the ASI XSD's own text: no role on a source, and an h1's role the values the rule's test names, of those the XSD lists",
    () =>
      // Oracle: the pinned XSDs as text, read by regular expressions and no XML reader (spec
      // reading 9): RULE ARIA ROLE 1a's test, `count(@role)=0` on `//qti:source`, and RULE ARIA
      // ROLE 1b's, `count(@role)=0 or (count(@role)=1 and (@role='…' or …))` on `//qti:h1`.
      Effect.gen(function* ariaRolesFromTheText() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* xsdDirectory;
        const { attributes } = yield* Effect.fromResult(composed());
        const byHandle = new Map(attributes.domains.map((domain) => [domain.handle, domain]));
        for (const [file, version] of ariaRuleSources) {
          const rules = ariaRulesIn(yield* fs.readFileString(`${directory}/${file}`));
          const heading = rules.get("h1") ?? "";
          const allowed = [...heading.matchAll(/@role='(?<role>[a-z]+)'/gu)].map(
            (found) => found.groups?.["role"] ?? "",
          );

          assert.deepStrictEqual([...rules.keys()], ["source", "h1"], version);
          assert.strictEqual(rules.get("source"), "count(@role)=0", version);
          assert.match(
            heading,
            /^count\(@role\)=0 or \(count\(@role\)=1 and \(@role='[a-z]+'(?: or @role='[a-z]+')*\)\)$/u,
            version,
          );
          assert.isTrue(
            Option.isNone(attributes.admission.lookup({ kind: "source", name: "role", version })),
            `${version}: RULE ARIA ROLE 1a`,
          );

          const row = Option.getOrThrow(
            attributes.admission.lookup({ kind: "h1", name: "role", version }),
          );
          const domain = byHandle.get(row.domain);
          const listed = attributeDeclarations.find(
            ({ kind, name, versions }) =>
              kind === "h1" && name === "role" && versions.includes(version),
          );
          const roles = listed === undefined ? [] : enumerationOf(listed.domain);
          const wrong = roles.filter(
            (role) => domain === undefined || matches(domain, role) !== allowed.includes(role),
          );

          assert.isAbove(roles.length, 70, version);
          assert.deepStrictEqual(allowed.toSorted(), ["heading", "presentation", "tab"], version);
          assert.deepStrictEqual(wrong, [], `${version}: RULE ARIA ROLE 1b`);
        }
      }).pipe(Effect.provide(NodeServices.layer)),
    300_000,
  );
});
