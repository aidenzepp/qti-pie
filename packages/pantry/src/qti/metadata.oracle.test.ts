/**
 * The metadata overlays' free tests: their statements build beside the layers they read, each check
 * is named by an oracle law, the pieces' patterns say what their names say, collapsed equality with
 * an identifier is trimmed equality, a statistic's typed day admits exactly `DateDType`'s values,
 * and over every learning resource type of a small box the law refuses exactly what QTI 3.0
 * Metadata §2.7.5.1 forbids (spec reading 122).
 *
 * The database tests (`metadata.db.test.ts`) judge the laws through PostgreSQL, and the builder's
 * tests (`#pantry/import/overlays/metadata.oracle.test.ts`) its rows.
 */
import { date, lexicalForm, schema } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element, map } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { attributeRows, BaseType, grammar, ValueDomainOf } from "#pantry/grammar/install.ts";
import { piecesOf } from "#pantry/import/overlays/metadata.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import { BaseTypePattern, unjudgedBaseTypes } from "#pantry/qti/expression-types.ts";
import {
  AssessmentObject,
  identifierPattern,
  LomEntry,
  LomGeneral,
  LomObject,
  LomObjectIdentifier,
  LomObjectTitle,
  LomRecord,
  LomResource,
  LomResourceType,
  LomResourceTypeSource,
  LomString,
  LomStringLanguage,
  LomTitle,
  LomTitleString,
  metadataLaws,
  ObjectIdentifier,
  ObjectLang,
  ObjectTitle,
  ResourceLomGeneral,
  StatisticDate,
  statisticKinds,
  trimmedPattern,
  UsageBaseType,
  UsageValue,
} from "#pantry/qti/metadata.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { packageLaws } from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import {
  databaseRefusals,
  documentRowsOf,
  readText,
  termXml,
  typeRefused,
} from "#pantry/test/gen/lom-resource-type.ts";
import type { TermSketch, TypeSketch } from "#pantry/test/gen/lom-resource-type.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import {
  documentBreaches,
  judge,
  lawNames,
  lawsOf,
  ruleOf,
  typedTextHolds,
} from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 7 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 300_000;

/**
 * The relations `metadata.ts` declares, by name.
 */
const metadataRelations = {
  AssessmentObject,
  LomEntry,
  LomGeneral,
  LomObject,
  LomObjectIdentifier,
  LomObjectTitle,
  LomRecord,
  LomResource,
  LomResourceType,
  LomResourceTypeSource,
  LomString,
  LomStringLanguage,
  LomTitle,
  LomTitleString,
  ObjectIdentifier,
  ObjectLang,
  ObjectTitle,
  ResourceLomGeneral,
  StatisticDate,
  UsageBaseType,
  UsageValue,
};

/**
 * Whether a character is XML whitespace `S`.
 *
 * @param character - One character.
 * @returns Whether it is a space, a tab, a line feed or a carriage return.
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const isSpace = (character: string): boolean => [" ", "\t", "\n", "\r"].includes(character);

/**
 * Collapse a text as XML Schema's `collapse` whitespace class does: each tab, line feed and
 * carriage return a space, then each run of spaces one, then the outer one removed.
 *
 * @param text - The text.
 * @returns Its collapsed value.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
const collapse = (text: string): string =>
  text
    .replaceAll(/[\t\n\r]/gu, " ")
    .replaceAll(/ +/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * Every text of at most 4 characters over a space, a tab, a line feed and two letters: the box the
 * pieces are judged in.
 */
const texts: Gen<string> = map(
  array(element([" ", "\t", "\n", "a", "b"]), { max: 4, min: 0 }),
  (c) => c.join(""),
);

/**
 * A situation the pieces' box must reach: each shape of a text's outer whitespace.
 */
type PieceSituation = "empty" | "all whitespace" | "padded" | "inner whitespace" | "bare";

/**
 * Name a text's shape, for the box's coverage.
 *
 * @param text - The text.
 * @returns Its situation.
 */
const pieceSituation = (text: string): PieceSituation => {
  const characters = text.split("");
  if (characters.length === 0) {
    return "empty";
  }

  if (characters.every(isSpace)) {
    return "all whitespace";
  }

  if (isSpace(characters[0] ?? "") || isSpace(characters.at(-1) ?? "")) {
    return "padded";
  }

  return characters.some(isSpace) ? "inner whitespace" : "bare";
};

/**
 * The identifiers the collapse box compares texts with: whitespace-free and nonempty, as an
 * `IdentifierDType`'s value is.
 */
const identifiers = ["a", "b", "ab", "ba"] as const;

/**
 * The trimmed-token pattern, as a host reads it.
 */
const trimmed = new RegExp(trimmedPattern, "u");

/**
 * The identifier pattern, as a host reads it.
 */
const identifierForm = new RegExp(identifierPattern, "u");

describe("qti/metadata.ts, declared", () => {
  it("builds a schema of Qti's relations and the metadata overlays with the layers' laws, each statement once", () => {
    const built = schema("MetadataLayer", { ...Qti.relations, ...metadataRelations }, [
      ...nodeLaws,
      ...chardataLaws,
      ...attributeLaws,
      ...packageLaws,
      ...metadataLaws,
    ]);

    for (const relation of Object.values(metadataRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(metadataLaws).size, metadataLaws.length);
    assert.strictEqual(
      built.statements.length,
      nodeLaws.length +
        chardataLaws.length +
        attributeLaws.length +
        packageLaws.length +
        metadataLaws.length,
    );
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = metadataLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.isDefined(ruleOf(law), name);
      }
    }

    assert.sameMembers([...new Set(named)], ["E1 derived", "LomObjectTitle", "Usage typed value"]);
  });
});

describe("qti/metadata.ts, the pieces", () => {
  it.effect(
    "splits every text into whitespace, a trimmed token and whitespace, which the patterns admit, and the token is the collapsed value wherever it can equal an identifier",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema Part 2's `collapse` (restated above) and
      // XML 1.0's `S`: a whitespace-free identifier equals a text's collapsed value exactly when it
      // equals the text's trimmed token, the reading `lom-identifier` compares by (reading 62).
      // Bound: every text of at most 4 characters over a space, a tab, a line feed and two
      // letters, 781, against 4 identifiers.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of at most 4 characters over a space, a tab, a line feed, a and b",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<PieceSituation>([
              "empty",
              "all whitespace",
              "padded",
              "inner whitespace",
              "bare",
            ]),
            generator: texts,
            limit: 800,
            literal: (text) => JSON.stringify(text),
            oracle: {
              kind: "specification",
              name: "XML Schema Part 2's collapse and XML 1.0's S",
            },
            suite: "qti/metadata-pieces",
          },
          (text, c) =>
            Effect.sync(() => {
              c.note(pieceSituation(text));

              const { lead, token, trail } = piecesOf(text);

              assert.strictEqual(`${lead}${token}${trail}`, text, "the pieces concatenate");
              assert.isTrue(
                `${lead}${trail}`.split("").every(isSpace),
                "the outer pieces are whitespace",
              );
              assert.isTrue(trimmed.test(token), "the token is trimmed");
              assert.isTrue(token !== "" || trail === "", "an empty token has no trail");
              assert.strictEqual(
                trimmed.test(text),
                text === token,
                "the pattern admits a text exactly when it is its own token",
              );
              assert.strictEqual(
                identifierForm.test(text),
                text !== "" && !text.split("").some(isSpace),
                "the identifier pattern admits a whitespace-free nonempty text",
              );
              for (const identifier of identifiers) {
                assert.strictEqual(
                  collapse(text) === identifier,
                  token === identifier,
                  `${JSON.stringify(text)} against ${identifier}`,
                );
              }
            }),
        ),
      ),
  );
});

/**
 * `DateDType`'s pattern as the grammar compiles it, read as a JavaScript host reads it: the domain
 * every statistic's `lastUpdated` is in, in every version.
 */
const dateDomains = [
  ...new Set(
    attributeRows
      .filter(
        ({ governor, name }) =>
          name === "lastUpdated" && statisticKinds.some((kind) => kind === governor),
      )
      .map(({ domain }) => domain),
  ),
].map(
  (domain) =>
    new RegExp(
      Option.getOrThrow(
        Option.fromNullishOr(ValueDomainOf.rows.find((row) => row.domain === domain)?.pattern),
      ),
      patternFlags,
    ),
);

/**
 * Grizzle's lexical form of `date`, which `StatisticDate.day` is typed by, as a host reads it.
 */
const dateForm = new RegExp(lexicalForm(date), "u");

/**
 * One `lastUpdated` of the calendar box: a year, a month, a day and the whitespace around them.
 */
interface DateCase {
  readonly day: string;
  readonly month: string;
  readonly pad: string;
  readonly year: string;
}

/**
 * The years of the calendar box: none, the first, a common century, a leap century, a leap year, a
 * common year and the last, plus a five-digit year `DateDType`'s pattern facet refuses.
 */
const years = ["0000", "0001", "1900", "2000", "2024", "2023", "9999", "10000"] as const;

/**
 * The two-digit numerals from `00` up to, not including, a count: the box's months and days.
 *
 * @param count - How many numerals.
 * @returns `00`, `01` and so on, `00` first.
 */
const numerals = (count: number): readonly ["00", ...string[]] => [
  "00",
  ...Array.from({ length: count - 1 }, (_, at) => String(at + 1).padStart(2, "0")),
];

/**
 * The months of the calendar box, `00` to `13`.
 */
const months = element(numerals(14));

/**
 * The days of the calendar box, `00` to `32`.
 */
const days = element(numerals(33));

/**
 * The whitespace around a `lastUpdated` in the calendar box.
 */
const pads = element(["", " ", "\t\n"]);

/**
 * Every `lastUpdated` of the calendar box.
 *
 * @param source - The choice source.
 * @returns One case.
 */
const dateCases: Gen<DateCase> = (source) => ({
  day: days(source),
  month: months(source),
  pad: pads(source),
  year: element(years)(source),
});

/**
 * A situation the calendar box must reach: a day the calendar holds, a leap day, a day it does not,
 * and a form the facet refuses.
 */
type DateSituation = "valid" | "leap day" | "not a day" | "not the form";

describe("qti/metadata.ts, the calendar", { timeout: testTimeoutMs }, () => {
  it.effect(
    "admits exactly DateDType's values: a typed day is lexicalForm(date) between whitespace",
    (ctx) =>
      // Oracle: a second implementation, the grammar's compiled `DateDType` domain (`ValueDomainOf`,
      // XML Schema Part 2's Gregorian calendar with its 0000 refused, compiled by the domain
      // deriver), against grizzle's `lexicalForm(date)`, which `StatisticDate.day` is typed by.
      // Bound: every year of 8, month 00 to 13, day 00 to 32 and padding of 3, 11,088.
      searched(
        ctx,
        exhaust(
          {
            box: "8 years, months 00 to 13, days 00 to 32, 3 paddings",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<DateSituation>([
              "valid",
              "leap day",
              "not a day",
              "not the form",
            ]),
            generator: dateCases,
            limit: 11_100,
            literal: (value) => JSON.stringify(value),
            oracle: {
              kind: "second-implementation",
              name: "the grammar's compiled DateDType domain against grizzle's lexicalForm(date)",
            },
            suite: "qti/metadata-calendar",
          },
          ({ day, month, pad, year }, c) =>
            Effect.sync(() => {
              const lexical = `${pad}${year}-${month}-${day}${pad}`;
              const pieces = piecesOf(lexical);
              const typed = dateForm.test(pieces.token);
              const domains = dateDomains.map((domain) => domain.test(lexical));
              if (year.length !== 4) {
                c.note("not the form");
              } else if (typed) {
                c.note(month === "02" && day === "29" ? "leap day" : "valid");
              } else {
                c.note("not a day");
              }

              assert.isNotEmpty(dateDomains);
              for (const admitted of domains) {
                assert.strictEqual(admitted, typed, lexical);
              }
            }),
        ),
      ),
  );
});

/**
 * The cores of the usage-value box's texts: an empty text, the boolean, integer, double and
 * identifier forms and near misses of each, two-item forms with one or two whitespace characters
 * between, and URI forms.
 */
const usageCores = [
  "",
  "true",
  "false",
  "1",
  "0",
  "+3",
  "-7",
  "0.87",
  "1e3",
  ".5",
  "INF",
  "-INF",
  "NaN",
  "A",
  "a.b",
  "_x",
  "1a",
  "a b",
  "a  b",
  "1 2",
  "1\t2",
  "1  2",
  "http://x/y",
  "a:b",
  "%zz",
  "true false",
] as const;

/**
 * The paddings the usage-value box writes on each side of a core.
 */
const usagePads = ["", " ", "\t", "\n "] as const;

/**
 * One case of the usage-value box: a base type, and a core padded on each side.
 */
interface UsageTextCase {
  readonly baseType: (typeof BaseType.handles)[number];
  readonly core: (typeof usageCores)[number];
  readonly lead: (typeof usagePads)[number];
  readonly trail: (typeof usagePads)[number];
}

/**
 * The base types a usage value's `baseType` spells: every `BaseType` handle but the null object
 * `none`, which no lexical form spells (C17).
 */
const spelledBaseTypes = BaseType.handles.filter((handle) => handle !== "none");

/**
 * The usage-value box: every base type a usage value's `baseType` spells, by every core, by every
 * padding on each side.
 */
const usageTextCases: Gen<UsageTextCase> = (source) => ({
  baseType: source.draw(
    element(Arr.isReadonlyArrayNonEmpty(spelledBaseTypes) ? spelledBaseTypes : ["string"]),
  ),
  core: source.draw(element(usageCores)),
  lead: source.draw(element(usagePads)),
  trail: source.draw(element(usagePads)),
});

/**
 * A situation the usage-value box must reach: a judged base type's text admitted and refused, and
 * an unjudged one's.
 */
type UsageTextSituation = "admitted" | "refused" | "unjudged";

/**
 * Name a usage-value case's situation, for the box's coverage.
 *
 * @param unjudged - Whether its base type is one every text is a value of.
 * @param admitted - Whether the law admits its text.
 * @returns Its situation.
 */
const usageTextSituation = (unjudged: boolean, admitted: boolean): UsageTextSituation => {
  if (unjudged) {
    return "unjudged";
  }

  return admitted ? "admitted" : "refused";
};

describe("qti/metadata.ts, the usage typed value", { timeout: testTimeoutMs }, () => {
  it.effect(
    "judges a usage value's text as the law oracle reads a typed value written as element content",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's `typedTextHolds` (reading 7's trimmed
      // element text over each base type's exact form, built from the XSD built-ins), against
      // `Usage_typed_value`'s language: `unjudgedBaseTypes`, or `BaseTypePattern`'s pattern of the
      // base type as PostgreSQL's regex reads it.
      // Bound: 11 base types by 26 cores by 4 paddings on each side, 4,576.
      searched(
        ctx,
        exhaust(
          {
            box: "11 base types, 26 cores, 4 paddings before and after",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<UsageTextSituation>(["admitted", "refused", "unjudged"]),
            generator: usageTextCases,
            limit: 4600,
            literal: (value) => JSON.stringify(value),
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's typedTextHolds against BaseTypePattern",
            },
            suite: "qti/metadata-usage-typed-value",
          },
          ({ baseType, core, lead, trail }, c) =>
            Effect.sync(() => {
              const text = `${lead}${core}${trail}`;
              const pattern = BaseTypePattern.rows.find(
                (row) => row.baseType === baseType,
              )?.pattern;
              assert.isDefined(pattern, baseType);

              const unjudged = unjudgedBaseTypes.some((handle) => handle === baseType);
              const admitted = unjudged || new RegExp(pattern ?? "", patternFlags).test(text);
              c.note(usageTextSituation(unjudged, admitted));

              assert.strictEqual(admitted, typedTextHolds(baseType, text), `${baseType} ${text}`);
            }),
        ),
      ),
  );
});

describe(
  "qti/metadata.ts, the usage typed value by the law oracle",
  { timeout: testTimeoutMs },
  () => {
    it.effect("breaks Usage typed value on no usage-data fixture the importer accepts", () =>
      // Oracle: the specification as a checker, reading 105: a `ud:value` that writes `baseType`
      // and no `fieldIdentifier` is untyped text, so `usage3-integer-float` (`0.87` under integer,
      // outside a record) is accepted, as the oracle judges it.
      // Bound: `usage3-integer-float`, `usage3` (no value writes a baseType), `usage3-typed` (24 typed values outside a
      // record) and `usage3-float-padded` (a padded float outside a record).
      Effect.gen(function* usageOracle() {
        for (const [name, breaks] of [
          ["usage3", 0],
          ["usage3-integer-float", 0],
          ["usage3-typed", 0],
          ["usage3-float-padded", 0],
        ] as const satisfies readonly (readonly [FixtureName, number])[]) {
          const judgment = yield* judge(
            yield* readPackage(yield* materialize(name)),
            grammar,
            lawsOf(grammar),
          );
          assert.strictEqual(judgment._tag, "Judged", name);

          const found =
            judgment._tag === "Judged"
              ? judgment.breaches.filter(({ law }) => law === "Usage typed value")
              : [];
          assert.lengthOf(found, breaks, name);
        }
      }).pipe(Effect.provide(NodeServices.layer)),
    );
  },
);

/**
 * The sources of the learning resource type box: none, the empty source, one of whitespace alone,
 * `LOMv1.0` bare and padded, another vocabulary, and two near misses of `LOMv1.0`.
 */
const boxSources = [
  Option.none<string>(),
  Option.some(""),
  Option.some(" "),
  Option.some("LOMv1.0"),
  Option.some(" LOMv1.0\n"),
  Option.some("MyVocab"),
  Option.some("lomv1.0"),
  Option.some("LOMv1.0x"),
] as const;

/**
 * The values of the learning resource type box: none, the two forbidden values bare, padded and
 * with their inner space doubled, the empty value, the value the binding advises, and near misses
 * of the forbidden ones: another case, a hyphen and a repetition.
 */
const boxValues = [
  Option.none<string>(),
  Option.some("exam"),
  Option.some("\texam "),
  Option.some(" self  assessment "),
  Option.some("self assessment"),
  Option.some(""),
  Option.some("exercise"),
  Option.some("Exam"),
  Option.some("self-assessment"),
  Option.some("exam exam"),
] as const;

/**
 * One case of the learning resource type box.
 */
interface ResourceTypeCase {
  readonly order: TypeSketch["order"];
  readonly source: Option.Option<string>;
  readonly value: Option.Option<string>;
}

/**
 * Every case of the box: each source, by each value, by each order of the two.
 */
const resourceTypeCases: readonly [ResourceTypeCase, ...ResourceTypeCase[]] = (() => {
  const cases = boxSources.flatMap((source) =>
    boxValues.flatMap((value) =>
      (["value first", "source first"] as const).map((order): ResourceTypeCase => ({
        order,
        source,
        value,
      })),
    ),
  );
  if (!Arr.isReadonlyArrayNonEmpty(cases)) {
    throw new Error("The learning resource type box holds no case. Give it a source and a value.");
  }

  return cases;
})();

/**
 * The law oracle's tables over the grammar, derived once.
 */
const laws = lawsOf(grammar);

/**
 * A term of the box, written once and plain.
 *
 * @param text - Its text.
 * @returns The term.
 */
const plainTerm = (text: string): TermSketch => ({ copies: 1, spelling: "plain", text });

/**
 * Write the manifest of one box case: an item resource whose LOM record holds the case's one
 * learning resource type.
 *
 * @param type - The type.
 * @returns The manifest's text.
 */
const resourceTypeManifest = (type: TypeSketch): string => {
  const terms =
    type.order === "value first"
      ? `${termXml("value", type.value)}${termXml("source", type.source)}`
      : `${termXml("source", type.source)}${termXml("value", type.value)}`;

  return `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><metadata><imsmd:lom xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><imsmd:educational><imsmd:learningResourceType>${terms}</imsmd:learningResourceType></imsmd:educational></imsmd:lom></metadata><file href="item.xml"/></resource></resources></manifest>`;
};

/**
 * A situation the learning resource type box must reach.
 */
type ResourceTypeSituation =
  | "refused, no source"
  | "refused, empty source"
  | "refused, LOMv1.0"
  | "accepted, another vocabulary"
  | "accepted, an allowed value"
  | "accepted, no value";

/**
 * Name a box case's situation, for the box's coverage.
 *
 * @param type - The case's type.
 * @param refused - Whether the specification refuses it.
 * @returns Its situation.
 */
const resourceTypeSituation = (type: TypeSketch, refused: boolean): ResourceTypeSituation => {
  const source = type.source.pipe(Option.map((term) => collapse(term.text)));
  if (refused) {
    return Option.match(source, {
      onNone: () => "refused, no source",
      onSome: (text) => (text === "" ? "refused, empty source" : "refused, LOMv1.0"),
    });
  }

  if (Option.isNone(type.value)) {
    return "accepted, no value";
  }

  return typeRefused({ ...type, source: Option.none() })
    ? "accepted, another vocabulary"
    : "accepted, an allowed value";
};

describe("qti/metadata.ts, the learning resource type", { timeout: testTimeoutMs }, () => {
  it.effect(
    "refuses exactly the types of the LOM vocabulary whose value is exam or self assessment, as the specification, the database's laws over the rows and the law oracle each read them",
    (ctx) =>
      // Oracle: three at once. The specification as a checker, QTI 3.0 Metadata §2.7.5.1 over the
      // case (`typeRefused`, written apart from the module's constants): a value collapsing to
      // `exam` or `self assessment` under the LOM vocabulary, its source `LOMv1.0`, empty or not
      // written (the binding's default, line 1288). A second implementation, the law oracle's
      // `LOM learning resource type` over the folded manifest. And the database's statements
      // restated over the builder's rows and the tree's insert (`databaseRefusals`): each term's
      // row holds the string value the database folds from its children's `chars`, and the law's
      // containment refuses exactly the types the specification refuses.
      // Bound: 8 sources by 10 values by 2 orders, 160 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "8 sources (none, empty, blank, LOMv1.0 bare and padded, MyVocab, lomv1.0, LOMv1.0x) by 10 values (none, exam, padded exam, self  assessment padded, self assessment, empty, exercise, Exam, self-assessment, exam exam) by 2 orders",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<ResourceTypeSituation>([
              "refused, no source",
              "refused, empty source",
              "refused, LOMv1.0",
              "accepted, another vocabulary",
              "accepted, an allowed value",
              "accepted, no value",
            ]),
            generator: element(resourceTypeCases),
            limit: 200,
            literal: (value: ResourceTypeCase) => JSON.stringify(value),
            oracle: {
              kind: "specification",
              name: "QTI 3.0 Metadata §2.7.5.1 over the case, against the law oracle and the database's statements over the rows",
            },
            suite: "qti/metadata-learning-resource-type",
          },
          ({ order, source, value }: ResourceTypeCase, c) =>
            Effect.gen(function* resourceType() {
              const type: TypeSketch = {
                foreign: false,
                order,
                source: source.pipe(Option.map(plainTerm)),
                value: value.pipe(Option.map(plainTerm)),
              };
              const refused = typeRefused(type);
              c.note(resourceTypeSituation(type, refused));

              const xml = resourceTypeManifest(type);
              const document = yield* Effect.orDie(readXml(new TextEncoder().encode(xml)));
              const tree = yield* Effect.orDie(shred(document, "3.0.1", shredGrammarOf(grammar)));
              const rows = documentRowsOf(tree, idOf);
              const judged = databaseRefusals(rows);
              const folded = yield* Effect.orDie(
                Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))),
              );
              const oracle = documentBreaches("imsmanifest.xml", folded, laws).filter(
                ({ law }) => law === "LOM learning resource type",
              );

              assert.deepStrictEqual(judged.derived, [], xml);
              assert.strictEqual(judged.refused.size, refused ? 1 : 0, xml);
              assert.lengthOf(oracle, refused ? 1 : 0, xml);
              assert.deepStrictEqual(
                [...rows.values.values()].map(({ text }) => text),
                Option.toArray(type.value).map((term) => readText(term)),
                xml,
              );
              assert.deepStrictEqual(
                [...rows.sources.values()].map(({ text }) => text),
                Option.toArray(type.source).map((term) => readText(term)),
                xml,
              );
            }),
        ),
      ),
  );
});
