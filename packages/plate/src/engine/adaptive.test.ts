import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { adaptivePolicy } from "#plate/engine/adaptive.ts";
import { acceptedItem, open, score } from "#plate/index.ts";
import type { Accepted, Responses, StoredRecord } from "#plate/index.ts";
import { buildItem } from "#plate/model/item.ts";
import { completionStatus, completionValue, fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Construct a single float value.
 *
 * @param value The number.
 * @returns The value.
 */
const floatValue = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
});

/**
 * Construct a single identifier value, as `completionStatus` holds one: a value the stub only
 * carries, so `completed` is written here without the engine's start-value helper.
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
 * @param local The declaration's element name.
 * @param identifier The declared identifier.
 * @param baseType The `base-type`.
 * @param defaultValue The declared default's text, none by default.
 * @returns The declaration.
 */
const declaration = (
  local: "qti-outcome-declaration" | "qti-response-declaration",
  identifier: string,
  baseType: string,
  defaultValue?: string,
): SourceElement =>
  el(
    local,
    [attr("base-type", baseType), attr("cardinality", "single"), attr("identifier", identifier)],
    defaultValue === undefined
      ? []
      : [el("qti-default-value", [], [el("qti-value", [], [text(defaultValue)])])],
  );

/**
 * An item that declares `RESPONSE`, a float `SCORE` with default 1 and a float `TOTAL` with no
 * default, and sets `SCORE` from `TOTAL` plus one, so its outcomes hold values a reset discards.
 */
const policyItem: SourceDocument = doc(
  "items/policy.xml",
  el(
    "qti-assessment-item",
    [attr("identifier", "policy"), attr("title", "Policy")],
    [
      declaration("qti-response-declaration", "RESPONSE", "identifier"),
      declaration("qti-outcome-declaration", "SCORE", "float", "1"),
      declaration("qti-outcome-declaration", "TOTAL", "float"),
      el(
        "qti-response-processing",
        [],
        [
          el(
            "qti-set-outcome-value",
            [attr("identifier", "SCORE")],
            [
              el(
                "qti-sum",
                [],
                [
                  el("qti-variable", [attr("identifier", "TOTAL")]),
                  el("qti-base-value", [attr("base-type", "float")], [text("1")]),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  ),
);

/**
 * Construct a record of {@link policyItem} after some attempts, with the outcomes its processing
 * would have left: `SCORE` and `TOTAL` moved off their defaults and `completionStatus` at a value.
 *
 * @param record The fresh record.
 * @param numAttempts The attempts processed.
 * @param status The `completionStatus` the last attempt left.
 * @returns The record.
 */
const attempted = (record: ItemRecord, numAttempts: number, status: string): ItemRecord => ({
  ...record,
  attempt: numAttempts === 0 ? "none" : "submitted",
  numAttempts,
  outcomes: {
    SCORE: floatValue(7),
    TOTAL: floatValue(6),
    [completionStatus]: identifierValue(status),
  },
});

describe("adaptivePolicy, filled", () => {
  it("[W0-BD] is filled: implemented is true", () => {
    assert.isTrue(adaptivePolicy.implemented);
  });

  it.effect(
    "[W0-BD] closed and limit: a non-adaptive item keeps today's answers, an adaptive item closes only at completed and has no limit",
    () =>
      Effect.gen(function* closedAndLimit() {
        const item = yield* Effect.fromResult(buildItem(policyItem));
        const start = fresh(item, "q1");
        const statuses = ["not_attempted", "unknown", "completed", "incomplete"];

        for (const [numAttempts, status] of statuses.entries()) {
          const record = attempted(start, numAttempts, status);
          for (const limit of [0, 1, 2, 3]) {
            for (const adaptive of [false, true]) {
              assert.strictEqual(
                adaptivePolicy.closed(adaptive, record, limit),
                adaptive ? status === "completed" : limit > 0 && numAttempts >= limit,
                `closed(${String(adaptive)}, ${String(record.numAttempts)} attempts, ${String(limit)})`,
              );
              assert.strictEqual(
                adaptivePolicy.limit(adaptive, limit),
                adaptive ? 0 : limit,
                `limit(${String(adaptive)}, ${String(limit)})`,
              );
            }
          }
        }
      }),
  );

  it.effect(
    "[W0-BD] the stub's answers equal today's: startingOutcomes is the non-adaptive reset, completionStatus carried over after the first attempt",
    () =>
      Effect.gen(function* startingOutcomes() {
        const item = yield* Effect.fromResult(buildItem(policyItem));
        const start = fresh(item, "q1");
        const reset = { SCORE: floatValue(1), TOTAL: floatValue(0) };

        assert.deepStrictEqual(
          adaptivePolicy.startingOutcomes(item, attempted(start, 0, "not_attempted")),
          { ...reset, [completionStatus]: completionValue("unknown") },
        );
        assert.deepStrictEqual(
          adaptivePolicy.startingOutcomes(item, attempted(start, 1, "unknown")),
          { ...reset, [completionStatus]: completionValue("unknown") },
        );
        assert.deepStrictEqual(
          adaptivePolicy.startingOutcomes(item, attempted(start, 2, "completed")),
          { ...reset, [completionStatus]: identifierValue("completed") },
        );
        assert.deepStrictEqual(
          adaptivePolicy.startingOutcomes(item, {
            ...attempted(start, 1, "unknown"),
            defaults: { RESPONSE: floatValue(9), SCORE: floatValue(3) },
          }),
          {
            SCORE: floatValue(3),
            TOTAL: floatValue(0),
            [completionStatus]: completionValue("unknown"),
          },
        );
      }),
  );
});

/**
 * Read an item fixture of `fixtures/m5/items` as text.
 *
 * @param name The fixture's file name.
 * @returns The text.
 */
const itemText = (name: string): string =>
  readFileSync(new URL(`../../fixtures/m5/items/${name}`, import.meta.url), "utf-8");

/**
 * Open an item's text through the public `open`, failing the test unless it is accepted.
 *
 * @param name The document path the item is opened at.
 * @param source The item's text.
 * @returns The accepted item.
 */
const opened = Effect.fnUntraced(function* opened(name: string, source: string) {
  const verdict = yield* open(name, new TextEncoder().encode(source));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${name} is ${verdict.verdict}`),
  );
});

/**
 * The responses of an attempt that types a word into the Text Entry bound to `RESPONSE`.
 *
 * @param word The word.
 * @returns The responses.
 */
const typed = (word: string): Responses => ({
  RESPONSE: {
    baseType: "string",
    cardinality: "single",
    values: [{ baseType: "string", value: word }],
  },
});

/**
 * Score attempts of an item one after another, each over the record the last returned, failing the
 * test when `score` refuses one.
 *
 * @param document The accepted item.
 * @param words The word each attempt types, in order.
 * @returns The record after each attempt.
 */
const attempts = (document: Accepted, words: readonly string[]): readonly StoredRecord[] => {
  const records: StoredRecord[] = [];
  for (const word of words) {
    records.push(
      Result.getOrElse(score(document, typed(word), records.at(-1)), (failure) =>
        assert.fail(`score refused ${word}: ${failure.message}`),
      ),
    );
  }

  return records;
};

/**
 * Read a single outcome's one value from a stored record, as text.
 *
 * @param record The stored record.
 * @param identifier The outcome.
 * @returns The value as text, or none when the record holds no value.
 */
const outcomeText = (record: StoredRecord, identifier: string): string | undefined => {
  const value = record.outcomes[identifier]?.values[0];
  if (value === undefined) {
    return undefined;
  }

  return value.baseType === "identifier" ||
    value.baseType === "integer" ||
    value.baseType === "float"
    ? String(value.value)
    : assert.fail(`${identifier} holds a ${value.baseType}, not an identifier or a number`);
};

describe("adaptive items through open and score", () => {
  it.effect('[adaptive] an adaptive item opens without the adaptive="true" mark', () =>
    Effect.gen(function* unmarked() {
      const verdict = yield* open(
        "items/adaptive.xml",
        new TextEncoder().encode(itemText("adaptive.xml")),
      );

      assert.strictEqual(verdict.verdict, "accepted");

      const document = Option.getOrElse(acceptedItem(verdict), () =>
        assert.fail(`adaptive.xml is ${verdict.verdict}`),
      );
      assert.isTrue(document.item.adaptive);
      assert.notInclude(
        document.item.unsupported.map((feature) => feature.feature),
        'adaptive="true"',
      );
    }),
  );

  it.effect("[adaptive] outcomes accumulate across attempts: TRIES counts each attempt", () =>
    Effect.gen(function* accumulates() {
      const document = yield* opened("items/adaptive.xml", itemText("adaptive.xml"));
      const records = attempts(document, ["Venus", "Mars", "Earth"]);

      assert.deepStrictEqual(
        records.map((record) => outcomeText(record, "TRIES")),
        ["1", "2", "3"],
      );
      assert.deepStrictEqual(
        records.map((record) => record.numAttempts),
        [1, 2, 3],
      );
    }),
  );

  it.effect("[adaptive] a non-adaptive copy of the item still resets its outcomes", () =>
    Effect.gen(function* resets() {
      const document = yield* opened(
        "items/adaptive-off.xml",
        itemText("adaptive.xml").replace('adaptive="true"', 'adaptive="false"'),
      );
      const records = attempts(document, ["Venus", "Mars", "Earth"]);

      assert.isFalse(document.item.adaptive);
      assert.deepStrictEqual(
        records.map((record) => outcomeText(record, "TRIES")),
        ["1", "1", "1"],
      );
    }),
  );

  it.effect(
    "[adaptive] completionStatus is unknown at the first attempt, incomplete after a wrong one, completed after the right one",
    () =>
      Effect.gen(function* completion() {
        const never = yield* opened(
          "items/adaptive-never-complete.xml",
          itemText("adaptive-never-complete.xml"),
        );
        const planet = yield* opened("items/adaptive.xml", itemText("adaptive.xml"));
        const [untouched] = attempts(never, ["once"]);
        const tried = attempts(planet, ["Venus", "Mercury"]);

        assert.strictEqual(
          untouched === undefined ? undefined : outcomeText(untouched, completionStatus),
          "unknown",
        );
        assert.deepStrictEqual(
          tried.map((record) => outcomeText(record, completionStatus)),
          ["incomplete", "completed"],
        );
        assert.deepStrictEqual(
          tried.map((record) => outcomeText(record, "SCORE")),
          ["0", "1"],
        );
      }),
  );
});
