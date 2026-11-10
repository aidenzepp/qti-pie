import { assert } from "@effect/vitest";
import type { WellFormednessError } from "#crust/errors.ts";
import { ReaderRefusal } from "#crust/errors.ts";

/**
 * Asserts that `error` is a `ReaderRefusal` under `rule` at `position`, which is none for a refusal
 * of the document as a whole.
 */
export const assertRefusal = (
  error: ReaderRefusal | WellFormednessError,
  rule: ReaderRefusal["rule"],
  position: ReaderRefusal["position"],
) => {
  assert.instanceOf(error, ReaderRefusal);
  assert.strictEqual(error.rule, rule);
  assert.deepStrictEqual(error.position, position);
};
