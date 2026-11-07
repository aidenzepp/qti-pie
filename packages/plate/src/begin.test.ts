import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceChild, SourceElement } from "#plate/document/source.ts";
import { firstAttempt } from "#plate/engine/attempt.ts";
import { drawBelow, drawStream, templateLabel } from "#plate/engine/random.ts";
import { fresh } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { restore } from "#plate/restore.ts";
import { integer } from "#plate/test/fixtures.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptedItem, check } from "#plate/validate/verdict.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The item instance every case begins under.
 */
const instance = "q1";

/**
 * The count of values the template processing's `qti-random-integer` draws from: 0 to 999,999.
 */
const drawnCount = 1_000_000n;

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value.
 */
const identifierValue = (value: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * Construct a single-cardinality declaration.
 *
 * @param local The declaration's name.
 * @param identifier The declared identifier.
 * @param baseType The `base-type` value.
 * @param children The declaration's children, none by default.
 * @returns The declaration.
 */
const declaration = (
  local: "qti-outcome-declaration" | "qti-response-declaration" | "qti-template-declaration",
  identifier: string,
  baseType: string,
  children: readonly SourceChild[] = [],
): SourceElement =>
  el(
    local,
    [attr("base-type", baseType), attr("cardinality", "single"), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a `qti-default-value` holding one value.
 *
 * @param written The value's text.
 * @returns The element.
 */
const defaultOf = (written: string): SourceElement =>
  el("qti-default-value", [], [el("qti-value", [], [text(written)])]);

/**
 * Construct a template rule that sets a variable to another template variable's value.
 *
 * @param local The rule's name.
 * @param identifier The variable it sets.
 * @param read The template variable whose value it sets.
 * @returns The rule.
 */
const setFrom = (
  local: "qti-set-correct-response" | "qti-set-default-value" | "qti-set-template-value",
  identifier: string,
  read: SourceElement,
): SourceElement => el(local, [attr("identifier", identifier)], [read]);

/**
 * Check a hand-built item, which `check` must accept.
 *
 * @param identifier The item's identifier.
 * @param parts The root's children.
 * @returns The accepted item.
 */
const accepted = (identifier: string, ...parts: readonly SourceElement[]): Accepted => {
  const verdict = check(
    doc(
      `items/${identifier}.xml`,
      el(
        "qti-assessment-item",
        [attr("identifier", identifier), attr("time-dependent", "false"), attr("title", "Begin")],
        parts,
      ),
    ),
    tables,
  );

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${identifier} is ${verdict.verdict}, not accepted`),
  );
};

/**
 * An item whose template processing draws the integer `N` from 0 to 999,999, then sets the integer
 * response `RESPONSE`'s correct response and default to it. `RESPONSE` declares the default 7 and
 * the identifier response `OTHER` the default `x`, which no rule sets.
 */
const templated = accepted(
  "templated",
  declaration("qti-response-declaration", "RESPONSE", "integer", [defaultOf("7")]),
  declaration("qti-response-declaration", "OTHER", "identifier", [defaultOf("x")]),
  declaration("qti-outcome-declaration", "SCORE", "float"),
  declaration("qti-template-declaration", "N", "integer"),
  el(
    "qti-template-processing",
    [],
    [
      setFrom(
        "qti-set-template-value",
        "N",
        el("qti-random-integer", [attr("max", String(drawnCount - 1n)), attr("min", "0")]),
      ),
      setFrom(
        "qti-set-correct-response",
        "RESPONSE",
        el("qti-variable", [attr("identifier", "N")]),
      ),
      setFrom("qti-set-default-value", "RESPONSE", el("qti-variable", [attr("identifier", "N")])),
    ],
  ),
);

/**
 * An item that declares no template variable: one identifier response and one float outcome.
 */
const untemplated = accepted(
  "untemplated",
  declaration("qti-response-declaration", "RESPONSE", "identifier"),
  declaration("qti-outcome-declaration", "SCORE", "float"),
);

/**
 * Give the value {@link templated}'s template processing draws for `N` under a seed: the first
 * `drawBelow` over the stream keyed by the seed under the item's template label.
 *
 * @param seed The record's seed, the host's seed written with `String`, `""` when it gave none.
 * @returns The integer.
 */
const drawnUnder = (seed: string): bigint =>
  drawBelow(drawStream(seed, templateLabel(instance, "templated")), drawnCount);

/**
 * Begin an item and decode the record, which must succeed.
 *
 * @param document The accepted item.
 * @param seed The host's seed, none by default.
 * @returns The stored record and the record it decodes to.
 */
const begun = Effect.fnUntraced(function* begun(document: Accepted, seed?: number) {
  const stored = yield* Effect.fromResult(
    begin(document, seed === undefined ? { instance } : { instance, seed }),
  );

  return { record: yield* Effect.fromResult(decodeRecord(stored)), stored };
});

describe("begin", () => {
  it.effect(
    "[I-5] stores the record of the first attempt: the seed, the template values drawn under the template label and each response at its default",
    () =>
      Effect.gen(function* storesFirstAttempt() {
        const { record } = yield* begun(templated, 42);
        const drawn = integer(drawnUnder("42"));
        const started = yield* Effect.fromResult(
          firstAttempt(templated.item, { instance, seed: "42" }),
        );

        // The draw is neither the declared default nor the unseeded draw, so the record shows both.
        assert.strictEqual(new Set([drawnUnder("42"), drawnUnder(""), 7n]).size, 3);
        assert.strictEqual(record.seed, "42");
        assert.deepStrictEqual(record.templates, { N: drawn });
        assert.deepStrictEqual(record.correct, { RESPONSE: drawn });
        assert.deepStrictEqual(record.responses, {
          OTHER: identifierValue("x"),
          RESPONSE: drawn,
        });
        assert.deepStrictEqual(record, started);
      }),
  );

  it.effect("[I-5] keys an absent seed as the empty string", () =>
    Effect.gen(function* keysAbsentSeed() {
      const { record } = yield* begun(templated);

      assert.strictEqual(record.seed, "");
      assert.deepStrictEqual(record.templates, { N: integer(drawnUnder("")) });
    }),
  );

  it.effect(
    "[I-5] gives the same record for the same instance and seed, and other values for another seed",
    () =>
      Effect.gen(function* repeatsUnderSeed() {
        const first = yield* begun(templated, 42);
        const again = yield* begun(templated, 42);
        const reseeded = yield* begun(templated, 43);

        assert.deepStrictEqual(again.stored, first.stored);
        assert.notDeepEqual(reseeded.record.templates, first.record.templates);
        assert.deepStrictEqual(reseeded.record.templates, { N: integer(drawnUnder("43")) });
      }),
  );

  it.effect("[I-5] gives an item with no template declaration three empty maps", () =>
    Effect.gen(function* startsUntemplated() {
      const { record } = yield* begun(untemplated, 42);

      assert.deepStrictEqual(record, { ...fresh(untemplated.item, instance), seed: "42" });
      assert.deepStrictEqual([record.templates, record.correct, record.defaults], [{}, {}, {}]);
    }),
  );

  it.effect("[I-5] stores a record restore takes back, its responses the values to render", () =>
    Effect.gen(function* restoresBegun() {
      const { record, stored } = yield* begun(templated, 42);

      assert.deepStrictEqual(Result.getOrThrow(restore(templated, stored)), {
        record,
        values: record.responses,
      });
    }),
  );
});
