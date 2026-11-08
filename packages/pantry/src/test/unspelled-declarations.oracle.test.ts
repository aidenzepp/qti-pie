/**
 * A `base-type` or a `cardinality` written as no value of its type has no type a law may read
 * (lane NIL's audit, B11; the orchestrator's ruling of 2026-11-06: one cause is refused under one
 * rule): its value domain refuses it alone. `declaration-rows.oracle.test.ts` holds that over every
 * declaration of the every-relation package; these cases reach the readers whose laws judge only
 * what a type types, so a valid package shows none of them: a mapping's keys and a lookup table's
 * values under a declaration's base type, a record field's value under its own, and a lookup
 * table's, a feedback outcome's, a value set's and an expression's cardinality. A key written twice
 * is one form whatever the base type spells, so Map key judges it beside the value domain (spec
 * reading 160); only two forms of one typed value, `1` and `01`, need the base type.
 *
 * Oracle: the XSD's types of `base-type` and `cardinality`, enumerations of `xs:string`, whose
 * whitespace is preserved (`imsqti_asiv3p0_v1p0.xsd:26164` and `:26148`; XML Schema 1.1 Part 2
 * §4.3.6), so `" string "`, `"multiple "` and `" integer"` spell none, and the laws' own sources
 * for the controls.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * An item's parts as a case writes them: its declarations, its body's content, and its response
 * processing, none for none.
 */
interface ItemParts {
  readonly body?: string;
  readonly declarations: string;
  readonly processing?: string;
}

/**
 * Write an item and its manifest, each file's text encoded as UTF-8, as `readPackage` returns
 * one.
 *
 * @param parts - The item's parts.
 * @returns The entries, sorted by path.
 */
const packageOf = ({
  body = "<p>Hi</p>",
  declarations,
  processing = "",
}: ItemParts): readonly PackageFile[] =>
  Object.entries({
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false">${declarations}<qti-item-body>${body}</qti-item-body>${processing}</qti-assessment-item>`,
  })
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));

/**
 * A response whose mapping holds two keys, under a base type as written.
 *
 * @param keys - The two keys.
 * @returns The item's parts under a base type as written.
 */
const mappedOf =
  (keys: readonly [string, string]) =>
  (baseType: string): ItemParts => ({
    declarations: `<qti-response-declaration identifier="R" cardinality="single" base-type="${baseType}"><qti-mapping default-value="0">${keys.map((key, at) => `<qti-map-entry map-key="${key}" mapped-value="${String(at + 1)}"/>`).join("")}</qti-mapping></qti-response-declaration>`,
  });

/**
 * A response whose mapping names one integer twice, as `1` and `01`: two forms, one value as an
 * integer (reading 98), which only a base type that spells `integer` makes one.
 */
const doubleValued = mappedOf(["1", "01"]);

/**
 * A response whose mapping writes the key `a` twice: one form, which repeats whatever the base type
 * spells (reading 160).
 */
const doubleWritten = mappedOf(["a", "a"]);

/**
 * An outcome whose match table's default is no integer, under a base type as written.
 *
 * @param baseType - The `base-type` as written.
 * @returns The declaration.
 */
const untypedTable = (baseType: string): ItemParts => ({
  declarations: `<qti-outcome-declaration identifier="O" cardinality="single" base-type="${baseType}"><qti-match-table default-value="x"><qti-match-table-entry source-value="1" target-value="2"/></qti-match-table></qti-outcome-declaration>`,
});

/**
 * A record outcome whose default's field is no integer, under the field's own base type as
 * written.
 *
 * @param baseType - The field's `base-type` as written.
 * @returns The item's parts.
 */
const untypedField = (baseType: string): ItemParts => ({
  declarations: `<qti-outcome-declaration identifier="O" cardinality="record"><qti-default-value><qti-value field-identifier="f" base-type="${baseType}">x</qti-value></qti-default-value></qti-outcome-declaration>`,
});

/**
 * A multiple outcome with a match table, which only a single one may hold, under a cardinality as
 * written.
 *
 * @param cardinality - The `cardinality` as written.
 * @returns The item's parts.
 */
const tabledContainer = (cardinality: string): ItemParts => ({
  declarations: `<qti-outcome-declaration identifier="O" cardinality="${cardinality}" base-type="integer"><qti-match-table default-value="0"><qti-match-table-entry source-value="1" target-value="2"/></qti-match-table></qti-outcome-declaration>`,
});

/**
 * An ordered identifier outcome a feedback inline names, which must be single or multiple, under
 * a cardinality as written.
 *
 * @param cardinality - The `cardinality` as written.
 * @returns The item's parts.
 */
const orderedFeedback = (cardinality: string): ItemParts => ({
  body: '<p><qti-feedback-inline outcome-identifier="FB" identifier="X" show-hide="show">x</qti-feedback-inline></p>',
  declarations: `<qti-outcome-declaration identifier="FB" cardinality="${cardinality}" base-type="identifier"/>`,
});

/**
 * A single response whose correct response holds two values, under a cardinality as written.
 *
 * @param cardinality - The `cardinality` as written.
 * @returns The item's parts.
 */
const twoValued = (cardinality: string): ItemParts => ({
  declarations: `<qti-response-declaration identifier="R" cardinality="${cardinality}" base-type="identifier"><qti-correct-response><qti-value>A</qti-value><qti-value>B</qti-value></qti-correct-response></qti-response-declaration>`,
});

/**
 * A multiple outcome a match compares with a single value, under a cardinality as written.
 *
 * @param cardinality - The `cardinality` as written.
 * @returns The item's parts.
 */
const mismatched = (cardinality: string): ItemParts => ({
  declarations: `<qti-outcome-declaration identifier="M" cardinality="${cardinality}" base-type="integer"/><qti-outcome-declaration identifier="S" cardinality="single" base-type="float"/>`,
  processing:
    '<qti-response-processing><qti-response-condition><qti-response-if><qti-match><qti-variable identifier="M"/><qti-base-value base-type="integer">1</qti-base-value></qti-match><qti-set-outcome-value identifier="S"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition></qti-response-processing>',
});

/**
 * Each case: its declaration, and the law its spelled control breaks, which the unspelled case
 * must not.
 */
const cases: readonly {
  readonly attribute: "base-type" | "cardinality";
  readonly law: LawName;
  readonly name: string;
  readonly of: (form: string) => ItemParts;
  readonly spelled: string;
}[] = [
  {
    attribute: "base-type",
    law: "Map key",
    name: "a mapping's integer named twice, as 1 and 01",
    of: doubleValued,
    spelled: "integer",
  },
  {
    attribute: "base-type",
    law: "Typed attribute value",
    name: "a match table's default that is no integer",
    of: untypedTable,
    spelled: "integer",
  },
  {
    attribute: "base-type",
    law: "Typed value",
    name: "a record field's value that is no integer",
    of: untypedField,
    spelled: "integer",
  },
  {
    attribute: "cardinality",
    law: "Lookup table cardinality",
    name: "a match table on a multiple outcome",
    of: tabledContainer,
    spelled: "multiple",
  },
  {
    attribute: "cardinality",
    law: "Feedback outcome type",
    name: "a feedback inline naming an ordered outcome",
    of: orderedFeedback,
    spelled: "ordered",
  },
  {
    attribute: "cardinality",
    law: "Value cardinality",
    name: "a single response's two correct values",
    of: twoValued,
    spelled: "single",
  },
  {
    attribute: "cardinality",
    law: "One base",
    name: "a match of a multiple outcome and a single value",
    of: mismatched,
    spelled: "multiple",
  },
];

/**
 * Judge an item and read the laws it breaks, each once, sorted, or the codec's refusal.
 *
 * @param parts - The item's parts.
 * @returns The laws.
 */
const lawsIn = (parts: ItemParts) =>
  Effect.map(judge(packageOf(parts), grammar, laws), (judgment): readonly string[] =>
    judgment._tag === "Judged"
      ? [...new Set(judgment.breaches.map((breach) => breach.law))].toSorted()
      : [`codec ${judgment.rule}`],
  );

/**
 * The forms of a spelled value with whitespace beside it: on both sides, after it, and before it.
 *
 * @param spelled - The value.
 * @returns The forms, none of which its preserving type spells.
 */
const paddedForms = (spelled: string): readonly string[] => [
  ` ${spelled} `,
  `${spelled} `,
  ` ${spelled}`,
];

describe("test/oracle.ts, a base-type or a cardinality that spells nothing (lane NIL's audit, B11)", () => {
  for (const { attribute, law, name, of, spelled } of cases) {
    it.effect(
      `${name}: refused by ${law} where the ${attribute} is spelled, by its value domain alone where whitespace is beside it`,
      () =>
        // Oracle: the XSD's enumeration of the attribute's type, whose whitespace is preserved, and
        // the law's source.
        // Bound: the case under its value spelled, and with whitespace on both sides, after and
        // before it.
        Effect.gen(function* unspelled() {
          assert.include(yield* lawsIn(of(spelled)), law, `${name}, spelled`);
          for (const form of paddedForms(spelled)) {
            // Typed attribute value keeps attribute-lexical too, so the case compares laws, not
            // rules.
            assert.deepStrictEqual(
              yield* lawsIn(of(form)),
              ["value domain"],
              `${name}, ${JSON.stringify(form)}`,
            );
          }
        }),
    );
  }

  it.effect(
    "a mapping's key written twice: refused by Map key whatever the base-type spells, beside its value domain where whitespace is beside it (spec reading 160)",
    () =>
      // Oracle: reading 160, two keys written alike are one form under any base type or none, and
      // reading 158's example, a mapping that repeats a key breaks Map key beside the value domain.
      // Bound: the mapping under `string`, and with whitespace on both sides, after and before it.
      Effect.gen(function* writtenTwice() {
        assert.deepStrictEqual(yield* lawsIn(doubleWritten("string")), ["Map key"], "spelled");
        for (const form of paddedForms("string")) {
          assert.deepStrictEqual(
            yield* lawsIn(doubleWritten(form)),
            ["Map key", "value domain"],
            JSON.stringify(form),
          );
        }
      }),
  );
});
