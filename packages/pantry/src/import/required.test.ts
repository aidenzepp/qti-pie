import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { ruleOfError } from "#qti/import/refusal.ts";
import { requiredAttribute } from "#qti/import/required.ts";
import { ItemRefusal } from "#qti/import/tree.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const element = Effect.gen(function* oneElement() {
  const document = yield* readXml(new TextEncoder().encode(`<a href="x.html">t</a>`));

  return document.root;
});

describe("requiredAttribute", () => {
  it.effect("refuses an absent attribute under required-attribute", () =>
    Effect.gen(function* absent() {
      const root = yield* element;
      const error = yield* Effect.flip(requiredAttribute(root, "href", Option.none()));
      assert.instanceOf(error, ItemRefusal);
      assert.strictEqual(error.rule, "required-attribute");
      assert.strictEqual(ruleOfError(error).rule, "required-attribute");
    }),
  );

  it.effect("returns an explicit empty value", () =>
    Effect.gen(function* empty() {
      const root = yield* element;
      assert.strictEqual(yield* requiredAttribute(root, "href", Option.some("")), "");
    }),
  );

  it.effect("returns a present value", () =>
    Effect.gen(function* present() {
      const root = yield* element;
      assert.strictEqual(yield* requiredAttribute(root, "href", Option.some("x.html")), "x.html");
    }),
  );
});
