/**
 * The attribute grammar's laws, each against an oracle that is not the generator:
 *
 * - **The XSD's attribute uses.** An independent reading of the pinned XSDs (`loadXsd` and
 *   `xsdContents` of `src/test/gen/grammar.ts`, written from XML Schema Part 1 apart from the
 *   vocabulary deriver) gives each kind its declared names and uses; `AttributeGrammar` must admit
 *   exactly those, with the XSD's use, beside the document layer's names.
 * - **The spec readings' text.** Each reading of `docs/spec-readings.md` that narrows a value is
 *   checked on every attribute it names, and the XSD's own reading of the same type is checked
 *   everywhere else; readings 10, 85 and 123, which add, take away and require an attribute, are
 *   restated beside the XSD reading, and reading 90 beside the document layer's `xml:` names, its
 *   covered elements from the Schematron's leaf, which its own test reads against the XSDs' raw
 *   text.
 * - **The XSD's values, for the departures of the old grammar.** Each value the XSD admits and the
 *   old grammar refused is admitted, read from the leaf's own resolution of the XSD.
 * - **Structural laws:** positions a bijection onto 0..n−1 in `AttributeName` order; `TextDomain` a
 *   row for every text type in every version; `ValueIdentity` derived from the built-in alone; the
 *   generator's refusals as named invalid inputs.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem, Option, Result } from "effect";
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
import { noType } from "#pantry/grammar/xsi.ts";
import { loadXsd, XsdOracleLayer, xsdContents } from "#pantry/test/gen/grammar.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { writeXsdOracle, xsdOracleDirectory } from "#pantry/test/xsd-catalog.ts";
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
 * The inputs of a grammar no `xsi:type` governs: no governor, and a `TypeName` roster of the null
 * type alone.
 */
const ungoverned = {
  governed: [],
  governors: [],
  typeName: Result.getOrThrow(roster("TypeName", [noType])),
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
  it("are gone: h1@role takes every ARIA role, the same domain as h2 to h6", () => {
    for (const version of schemaVersions) {
      const h1 = Option.getOrThrow(domainAt(version, "h1", "role"));
      const declared = attributeDeclarations.find(
        ({ kind, name }) => kind === "h2" && name === "role",
      );
      const roles = declared === undefined ? [] : enumerationOf(declared.domain);

      assert.isAbove(roles.length, 70);
      for (const heading of ["h2", "h3", "h4", "h5", "h6"]) {
        assert.strictEqual(
          Option.getOrThrow(domainAt(version, heading, "role")).handle,
          h1.handle,
          heading,
        );
      }

      for (const role of roles) {
        assert.isTrue(matches(h1, role), role);
      }
    }
  });

  it("are gone: every MimeTypeDType attribute reads the XSD's pattern, as xmllint judged Appendix F's probes", () => {
    const attributes = [
      ["a", "type"],
      ["object", "type"],
      ["param", "type"],
      ["source", "type"],
      ["qti-stylesheet", "type"],
      ["qti-calculator-info", "mime-type"],
      ["qti-digital-material", "mime-type"],
      ["qti-file-href.card", "mime-type"],
    ] as const;
    const valid = [
      "a/b c",
      `${"a".repeat(128)}/x`,
      `x/${"b".repeat(256)}`,
      " image/png ",
      "image/png",
      "a/b\tc",
    ];
    const invalid = ["a(b)/c", "a/b/c", "é/x", "a@b/c", "image", "/png", "a/"];
    for (const [kind, name] of attributes) {
      for (const { version } of declarersOf(name).filter((declarer) => declarer.kind === kind)) {
        const domain = Option.getOrThrow(domainAt(version, kind, name));
        for (const value of valid) {
          assert.isTrue(matches(domain, value), `${kind}@${name} ${JSON.stringify(value)}`);
        }

        for (const value of invalid) {
          assert.isFalse(matches(domain, value), `${kind}@${name} ${JSON.stringify(value)}`);
        }
      }
    }

    const upload = Option.getOrThrow(domainAt("3.0.1", "qti-upload-interaction", "type"));
    assert.isTrue(matches(upload, " image/png  text/plain "));
    assert.isFalse(matches(upload, "image/png a(b)/c"));
  });

  it("are gone: a slider's step is NonNegativeDoubleDType, 0, INF and NaN its lexical forms and zero its bound", () => {
    for (const version of schemaVersions) {
      const step = Option.getOrThrow(domainAt(version, "qti-slider-interaction", "step"));
      for (const value of ["0", "0.0", "INF", "NaN", " 2.5 ", "1e3"]) {
        assert.isTrue(matches(step, value), value);
      }

      assert.deepStrictEqual(step.facets, [{ facet: "minInclusive", value: "0.0" }]);
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

  it("are gone: coords is required on every kind the XSD requires it on, param@valuetype is required, source@role is admitted, and xml:base is admitted on the three manifest kinds", () => {
    for (const version of schemaVersions) {
      for (const kind of ["qti-area-map-entry", "qti-associable-hotspot", "qti-hotspot-choice"]) {
        assert.strictEqual(
          Option.getOrThrow(leafGrammar.admission.lookup({ kind, name: "coords", version })).use,
          "required",
          kind,
        );
      }

      assert.strictEqual(
        Option.getOrThrow(
          leafGrammar.admission.lookup({ kind: "param", name: "valuetype", version }),
        ).use,
        "required",
      );
      assert.isTrue(
        Option.isSome(leafGrammar.admission.lookup({ kind: "source", name: "role", version })),
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
 * Whether a value is a printf format string over the information model's conversion codes (§2.3.4)
 * that converts at most one argument, read left to right: a character that is not `%`, or `%%`, or
 * `%`, flags, a width, an optional precision of `.` and digits, and one of the codes, which may
 * stand once.
 *
 * @param value - The value.
 * @returns Whether it is a format.
 */
const isPrintfFormat = (value: string): boolean => {
  const points = Array.from(value, String);
  let next = 0;
  let conversions = 0;
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
      conversions += 1;
      if (code === undefined || !"EefGgrRioXx".includes(code) || conversions > 1) {
        return false;
      }

      next += 1;
    } else {
      next += 1;
    }
  }

  return true;
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
        Option.getOrThrow(domainAt(version, "qti-outcome-declaration", "normal-maximum")).facets,
        [{ facet: "minExclusive", value: "0" }],
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

  it("read 132: a printed variable's format is a printf format string of at most one conversion over the listed codes, against an independent recogniser on every string of one to four pieces", () => {
    // Information model §2.3.4: each conversion specifier is "%", flags of "#", "0", "-", " " and
    // "+", an optional width, an optional precision ("." and zero or more digits), and one of E, e,
    // f, G, g, r, R, i, o, X or x; the rest of a C format string is text and "%%". C11 §7.21.6.1:
    // "If there are insufficient arguments for the format, the behavior is undefined", and the
    // variable is one argument, so a format holds at most one specifier, and may hold none.
    // Oracle: `isPrintfFormat`, a left-to-right walk of the string that counts its conversions, not
    // the pattern.
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

    for (const version of schemaVersions) {
      const format = Option.getOrThrow(domainAt(version, "qti-printed-variable", "format"));
      const wrong = strings.filter((value) => matches(format, value) !== isPrintfFormat(value));

      assert.deepStrictEqual(wrong.slice(0, 20), [], version);
      assert.isTrue(
        matches(format, "%.2f") && matches(format, "Score: %i%%") && matches(format, "100%%"),
        version,
      );
      assert.isFalse(
        matches(format, "%d") ||
          matches(format, "%") ||
          matches(format, "%q") ||
          matches(format, "%i of %i") ||
          matches(format, "%%%e%%%G"),
        version,
      );
    }
  });
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
            // 123: a `bdo` carries `dir` (§5.11).
            const misspelled = expected.get("aria-keyshorts");
            if (misspelled !== undefined) {
              expected.set("aria-keyshortcuts", misspelled);
            }

            if (kind === "xi:include") {
              expected.delete("xpointer");
            }

            for (const required of readingUses.filter((use) => use.kind === kind)) {
              if (expected.has(required.name)) {
                expected.set(required.name, "required");
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
    300_000,
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
          coveredElements.flatMap(({ element, versions }) =>
            versions.map((version) => `${version} {${element.namespace}}${element.local}`),
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
    300_000,
  );

  it.effect(
    "admits the LOM string's xml:lang that xmllint validates, the corpus manifests' reduction",
    () =>
      Effect.gen(function* lomXmlLangIsValid() {
        const fs = yield* FileSystem.FileSystem;
        const directory = `${xsdOracleDirectory}/attribute-layer`;
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
      }).pipe(Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    300_000,
  );
});
