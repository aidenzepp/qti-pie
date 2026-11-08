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
import { float, integer } from "#plate/test/fixtures.ts";
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
    Option.none(),
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
 * The integer response `RESPONSE`, whose declared default is 7.
 */
const answered = declaration("qti-response-declaration", "RESPONSE", "integer", [defaultOf("7")]);

/**
 * The float outcome `SCORE`, whose declared default is 1.
 */
const scored = declaration("qti-outcome-declaration", "SCORE", "float", [defaultOf("1")]);

/**
 * The single integer context variable `CTX`, whose default is 4.
 */
const contextVariable = el(
  "qti-context-declaration",
  [attr("base-type", "integer"), attr("cardinality", "single"), attr("identifier", "CTX")],
  [defaultOf("4")],
);

/**
 * Construct a `qti-template-processing` of one rule.
 *
 * @param rule The rule.
 * @returns The element.
 */
const processingOf = (rule: SourceElement): SourceElement =>
  el("qti-template-processing", [], [rule]);

/**
 * Construct a `qti-is-null` of a `qti-variable`.
 *
 * @param identifier The variable it reads.
 * @returns The expression.
 */
const isNullVariable = (identifier: string): SourceElement =>
  el("qti-is-null", [], [el("qti-variable", [attr("identifier", identifier)])]);

/**
 * The seven shapes of template processing `check` accepts whose first attempt reads or sets a
 * name the engine does not hold while template processing runs (review `079e8c44` P1-1), each
 * beside {@link answered} and {@link scored}: a read of `QTI_CONTEXT`; a read of a context
 * variable through `qti-variable`, then through `qti-default`; a read of a template variable of
 * cardinality `record`; a set of one of base type `file`; a `qti-set-correct-response` of a `file`
 * response; and a `qti-set-default-value` of a `file` outcome. `check` marks each, so its template
 * processing does not run.
 */
const unheldTemplating: readonly Accepted[] = [
  accepted(
    "reads-qti-context",
    answered,
    scored,
    declaration("qti-template-declaration", "B", "boolean"),
    processingOf(setFrom("qti-set-template-value", "B", isNullVariable("QTI_CONTEXT"))),
  ),
  accepted(
    "reads-context-variable",
    contextVariable,
    answered,
    scored,
    declaration("qti-template-declaration", "T", "integer"),
    processingOf(
      setFrom("qti-set-template-value", "T", el("qti-variable", [attr("identifier", "CTX")])),
    ),
  ),
  accepted(
    "reads-context-default",
    contextVariable,
    answered,
    scored,
    declaration("qti-template-declaration", "T", "integer"),
    processingOf(
      setFrom("qti-set-template-value", "T", el("qti-default", [attr("identifier", "CTX")])),
    ),
  ),
  accepted(
    "reads-record-template",
    answered,
    scored,
    el("qti-template-declaration", [attr("cardinality", "record"), attr("identifier", "R")]),
    declaration("qti-template-declaration", "B", "boolean"),
    processingOf(setFrom("qti-set-template-value", "B", isNullVariable("R"))),
  ),
  accepted(
    "sets-file-template",
    answered,
    scored,
    declaration("qti-template-declaration", "F", "file"),
    processingOf(setFrom("qti-set-template-value", "F", el("qti-null"))),
  ),
  accepted(
    "sets-file-correct",
    answered,
    declaration("qti-response-declaration", "RF", "file"),
    scored,
    processingOf(setFrom("qti-set-correct-response", "RF", el("qti-null"))),
  ),
  accepted(
    "sets-file-default",
    answered,
    scored,
    declaration("qti-outcome-declaration", "OF", "file"),
    processingOf(setFrom("qti-set-default-value", "OF", el("qti-null"))),
  ),
];

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
 * @param seed The record's seed.
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
const begun = Effect.fnUntraced(function* begun(document: Accepted, seed?: string) {
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
        const { record } = yield* begun(templated, "42");
        const drawn = integer(drawnUnder("42"));
        const started = yield* Effect.fromResult(
          firstAttempt(templated.item, { instance, seed: "42" }),
        );

        // The draw is neither the declared default nor the draw under the empty seed, so the record
        // shows both.
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

  it.effect(
    "[I-5] draws a seed of 32 lowercase hex digits when none is given, another each begin, and draws the template values under it",
    () =>
      Effect.gen(function* drawsAbsentSeed() {
        const first = yield* begun(templated);
        const second = yield* begun(templated);

        assert.match(first.record.seed, /^[0-9a-f]{32}$/u);
        assert.match(second.record.seed, /^[0-9a-f]{32}$/u);
        assert.notStrictEqual(second.record.seed, first.record.seed);
        assert.deepStrictEqual(first.record.templates, {
          N: integer(drawnUnder(first.record.seed)),
        });
        assert.deepStrictEqual(second.record.templates, {
          N: integer(drawnUnder(second.record.seed)),
        });
      }),
  );

  it.effect("[I-5] uses a given empty seed as given", () =>
    Effect.gen(function* keysEmptySeed() {
      const { record } = yield* begun(templated, "");

      assert.strictEqual(record.seed, "");
      assert.deepStrictEqual(record.templates, { N: integer(drawnUnder("")) });
    }),
  );

  it.effect(
    "[I-5] gives the same record for the same instance and seed, and other values for another seed",
    () =>
      Effect.gen(function* repeatsUnderSeed() {
        const first = yield* begun(templated, "42");
        const again = yield* begun(templated, "42");
        const reseeded = yield* begun(templated, "43");

        assert.deepStrictEqual(again.stored, first.stored);
        assert.notDeepEqual(reseeded.record.templates, first.record.templates);
        assert.deepStrictEqual(reseeded.record.templates, { N: integer(drawnUnder("43")) });
      }),
  );

  it.effect("[I-5] gives an item with no template declaration three empty maps", () =>
    Effect.gen(function* startsUntemplated() {
      const { record } = yield* begun(untemplated, "42");

      assert.deepStrictEqual(record, { ...fresh(untemplated.item, instance), seed: "42" });
      assert.deepStrictEqual([record.templates, record.correct, record.defaults], [{}, {}, {}]);
    }),
  );

  it.effect(
    "[I-5] begins each item whose template processing names a variable the engine does not hold, marked, with no template value, correct response or default, and each response and outcome at its declared default",
    () =>
      Effect.gen(function* beginsMarked() {
        for (const document of unheldTemplating) {
          const label = document.item.identifier;
          const { record } = yield* begun(document, "42");

          assert.deepStrictEqual(document.item.templateProcessing, Option.none(), label);
          assert.deepStrictEqual(
            [record.templates, record.correct, record.defaults],
            [{}, {}, {}],
            label,
          );
          assert.deepStrictEqual(record.responses, { RESPONSE: integer(7n) }, label);
          assert.deepStrictEqual(record.outcomes["SCORE"], float(1), label);
          assert.deepStrictEqual(
            record,
            { ...fresh(document.item, instance), responses: { RESPONSE: integer(7n) }, seed: "42" },
            label,
          );
        }
      }),
  );

  it.effect("[I-5] stores a record restore takes back, its responses the values to render", () =>
    Effect.gen(function* restoresBegun() {
      const { record, stored } = yield* begun(templated, "42");

      assert.deepStrictEqual(Result.getOrThrow(restore(templated, stored)), {
        record,
        values: record.responses,
      });
    }),
  );
});
