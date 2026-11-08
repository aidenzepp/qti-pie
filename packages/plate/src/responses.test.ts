import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { message } from "#plate/messages.ts";
import type { ExtendedTextInteraction, Item, TextEntryInteraction } from "#plate/model/item.ts";
import type { RecordValue, Value } from "#plate/model/values.ts";
import { checkResponses } from "#plate/responses.ts";
import { open } from "#plate/validate/open.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";

/**
 * Write an item document whose template processing sets the ordered template variable `S` to a
 * number of copies of one value through a `qti-repeat`, whose paragraph prints `S`, and which holds
 * a single Choice bound to `RESPONSE` over `A` and `B`.
 *
 * @param baseType `S`'s base type.
 * @param lexical The value repeated, as written.
 * @param count How many times `qti-repeat` repeats it.
 * @param printing The printed variable's attributes besides its `identifier`, as written.
 * @returns The document's text.
 */
const repeatedItem = (baseType: string, lexical: string, count: number, printing: string): string =>
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="repeated" title="Repeated" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-template-declaration identifier="S" cardinality="ordered" base-type="${baseType}"/><qti-template-processing><qti-set-template-value identifier="S"><qti-repeat number-repeats="${String(count)}"><qti-base-value base-type="${baseType}">${lexical}</qti-base-value></qti-repeat></qti-set-template-value></qti-template-processing><qti-item-body><p>Value: <qti-printed-variable identifier="S"${printing}/></p><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A">One</qti-simple-choice><qti-simple-choice identifier="B">Two</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;

/**
 * Construct an ordered container that holds one value of a base type a number of times.
 *
 * @param member The value.
 * @param count How many times the container holds it.
 * @returns The value.
 */
const repeated = (member: Value["values"][number], count: number): Value => ({
  baseType: member.baseType,
  cardinality: "ordered",
  values: Array.from({ length: count }, () => member),
});

/**
 * The items whose printed variable's whole text passes 1,000,000 characters, each with a label and
 * the value its template processing sets: 600 integers printed under `%999999i`, and 1,000,000
 * strings of 600 characters printed in the default form.
 */
const oversizedPrinting: readonly (readonly [string, string, Value])[] = [
  [
    "600 integers under %999999i",
    repeatedItem("integer", "1", 600, ' format="%999999i"'),
    repeated({ baseType: "integer", value: 1n }, 600),
  ],
  [
    "1,000,000 strings of 600 characters",
    repeatedItem("string", "y".repeat(600), 1_000_000, ""),
    repeated({ baseType: "string", value: "y".repeat(600) }, 1_000_000),
  ],
];

describe("checkResponses on an item whose printed variable's whole text passes 1,000,000 characters", () => {
  for (const [label, document, value] of oversizedPrinting) {
    it.effect(`[I-5] returns, still judging the Choice shown, for ${label} (G-R2, pending)`, () =>
      Effect.gen(function* judgesBesideOversizedText() {
        const verdict = yield* open("items/repeated.xml", new TextEncoder().encode(document));
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`The item is ${verdict.verdict}, not accepted.`),
        );
        const configuration = yield* configure({});
        const stray: Value = {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "Z" }],
        };

        assert.deepStrictEqual(
          checkResponses(accepted, { RESPONSE: stray }, configuration, { templates: { S: value } }),
          [{ response: "RESPONSE", text: message("en", "unknownChoice") }],
        );
      }),
    );
  }
});

/**
 * A value whose members count each read of them, and a faithful value otherwise.
 */
interface CountedValue {
  /**
   * How many times the members have been read.
   */
  readonly reads: () => number;
  readonly value: Value;
}

/**
 * Wrap a value so each read of its members counts. Printing a variable reads its members, and
 * deciding which parts the page shows never reads a printed variable's, so the count shows whether
 * a path printed it.
 *
 * @param value The value.
 * @returns The wrapped value and its count.
 */
const counted = (value: Value): CountedValue => {
  let reads = 0;

  return {
    reads: () => reads,
    value: {
      baseType: value.baseType,
      cardinality: value.cardinality,
      get values() {
        reads += 1;

        return value.values;
      },
    },
  };
};

describe("checkResponses and the printed variables of the item it judges", () => {
  it.effect(
    "[I-5] formats no printed variable: it learns which interactions and choices the page shows from the walk that prints no text",
    () =>
      Effect.gen(function* judgesWithoutPrinting() {
        const document = repeatedItem("string", "y", 3, "");
        const verdict = yield* open("items/repeated.xml", new TextEncoder().encode(document));
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`The item is ${verdict.verdict}, not accepted.`),
        );
        const configuration = yield* configure({});
        const printed = counted(repeated({ baseType: "string", value: "y" }, 3));

        assert.deepStrictEqual(
          checkResponses(accepted, {}, configuration, { templates: { S: printed.value } }),
          [],
        );
        assert.strictEqual(printed.reads(), 0);
      }),
  );
});

/**
 * A Text Entry bound to the record response `ANSWER`, the string control, with
 * `pattern-mask="[0-9]+"` and `expected-length="2"`.
 */
const answerEntry: TextEntryInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  cardinality: "record",
  class: "",
  expectedLength: Option.some(2n),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/qti-text-entry-interaction",
  patternMask: Option.some("[0-9]+"),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  response: "ANSWER",
};

/**
 * An item built by hand: {@link answerEntry} alone.
 */
const answerItem: Item = {
  body: [answerEntry],
  document: "items/answer.xml",
  identifier: "answer",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  records: new Map([
    ["ANSWER", { correct: Option.none(), defaultValue: Option.none(), identifier: "ANSWER" }],
  ]),
  responses: new Map(),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Answer",
  unsupported: [],
};

/**
 * Construct the record a candidate's text gives, holding only its `stringValue`, as a host may
 * build it; the NULL record for empty text.
 *
 * @param text The text as typed.
 * @returns The record.
 */
const typed = (text: string): RecordValue => ({
  cardinality: "record",
  fields:
    text === "" ? [] : [{ identifier: "stringValue", value: { baseType: "string", value: text } }],
});

/**
 * Give the message a mismatch on a response's `pattern-mask` earns, with no author's message.
 *
 * @param response The response identifier.
 * @returns The validation message.
 */
const mismatch = (response: string) => ({ response, text: message("en", "patternMismatch") });

describe("checkResponses and a record", () => {
  it.effect(
    "[Q-20] record binding in the page: checkResponses takes a record for a record-bound Text Entry and gives no message for it",
    () =>
      Effect.gen(function* takesRecord() {
        const configuration = yield* configure({ validateResponses: true });
        const answer: RecordValue = {
          cardinality: "record",
          fields: [{ identifier: "stringValue", value: { baseType: "string", value: "12" } }],
        };

        assert.deepStrictEqual(
          checkResponses(acceptForTest(answerItem), { ANSWER: answer }, configuration),
          [],
        );
      }),
  );

  it.effect(
    "[Q-20] [Q-5] restores the record's text to its checks: under validate-responses pattern-mask [0-9]+ judges a record's stringValue as typed, accepting 12 and refusing 12.0, and expected-length gives no message",
    () =>
      Effect.gen(function* judgesTypedText() {
        const strict = yield* configure({ validateResponses: true });
        const working: ExtendedTextInteraction = {
          ...answerEntry,
          expectedLength: Option.none(),
          expectedLines: Option.none(),
          format: "plain",
          kind: "extended-text",
          maxStrings: Option.none(),
          minStrings: 0n,
          path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
          prompt: Option.none(),
          response: "WORKING",
        };
        const both = acceptForTest({
          ...answerItem,
          body: [answerEntry, working],
          records: new Map([
            ...(answerItem.records ?? []),
            [
              "WORKING",
              { correct: Option.none(), defaultValue: Option.none(), identifier: "WORKING" },
            ],
          ]),
        });

        assert.deepStrictEqual(checkResponses(both, { ANSWER: typed("12") }, strict), []);
        assert.deepStrictEqual(
          checkResponses(both, { ANSWER: typed("12345"), WORKING: typed("12345") }, strict),
          [],
        );
        assert.deepStrictEqual(
          checkResponses(both, { ANSWER: typed("12.0"), WORKING: typed("1 2") }, strict),
          [mismatch("ANSWER"), mismatch("WORKING")],
        );
        assert.deepStrictEqual(checkResponses(both, { ANSWER: typed(" 12") }, strict), [
          mismatch("ANSWER"),
        ]);
        assert.deepStrictEqual(
          checkResponses(
            both,
            { ANSWER: typed("12.0"), WORKING: typed("1 2") },
            yield* configure({}),
          ),
          [],
        );
      }),
  );

  it.effect(
    "[Q-20] restores the record's text to its checks: the NULL record and a record without a stringValue are not judged against the pattern-mask",
    () =>
      Effect.gen(function* untypedRecords() {
        const strict = yield* configure({ validateResponses: true });
        const numbered: RecordValue = {
          cardinality: "record",
          fields: [{ identifier: "floatValue", value: { baseType: "float", value: 12.5 } }],
        };

        for (const answer of [typed(""), numbered]) {
          assert.deepStrictEqual(
            checkResponses(acceptForTest(answerItem), { ANSWER: answer }, strict),
            [],
          );
        }
      }),
  );
});
