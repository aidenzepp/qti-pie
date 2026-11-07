import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { message } from "#plate/messages.ts";
import type { Value } from "#plate/model/values.ts";
import { checkResponses } from "#plate/responses.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

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
