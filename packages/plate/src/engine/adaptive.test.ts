import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { adaptivePolicy } from "#plate/engine/adaptive.ts";
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

describe("adaptivePolicy, the stub", () => {
  it("[W0-BD] is a stub: implemented is false", () => {
    assert.isFalse(adaptivePolicy.implemented);
  });

  it.effect("[W0-BD] the stub's answers equal today's: closed and limit", () =>
    Effect.gen(function* closedAndLimit() {
      const item = yield* Effect.fromResult(buildItem(policyItem));
      const start = fresh(item, "q1");
      const records = [
        attempted(start, 0, "not_attempted"),
        attempted(start, 1, "unknown"),
        attempted(start, 2, "completed"),
        attempted(start, 3, "incomplete"),
      ];

      for (const record of records) {
        for (const limit of [0, 1, 2, 3]) {
          for (const adaptive of [false, true]) {
            assert.strictEqual(
              adaptivePolicy.closed(adaptive, record, limit),
              limit > 0 && record.numAttempts >= limit,
              `closed(${String(adaptive)}, ${String(record.numAttempts)} attempts, ${String(limit)})`,
            );
            assert.strictEqual(
              adaptivePolicy.limit(adaptive, limit),
              limit,
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
