import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Schema } from "effect";
import { Refusal, refusalRules } from "#plate/validate/refusal.ts";

/**
 * One refusal for each location kind, each paired with a rule that produces that kind.
 */
const cases = () => [
  new Refusal({
    detail: { element: "qti-choice-interation" },
    document: "items/BG007.xml",
    location: { kind: "path", path: "qti-assessment-item/qti-item-body/qti-choice-interation" },
    readerRule: Option.none(),
    rule: "unknown-element",
    suggestion: Option.some("qti-choice-interaction"),
  }),
  new Refusal({
    detail: { found: "<" },
    document: "items/BG010.xml",
    location: { column: 14, kind: "position", line: 3 },
    readerRule: Option.none(),
    rule: "not-well-formed",
    suggestion: Option.none(),
  }),
  new Refusal({
    detail: { entity: "loop" },
    document: "items/BG011.xml",
    location: { kind: "document" },
    readerRule: Option.some("entity-cycle"),
    rule: "reader-refused",
    suggestion: Option.none(),
  }),
];

describe("refusalRules", () => {
  it("lists the validator's, the verdict's and the reader's fourteen rules", () => {
    assert.deepStrictEqual(
      [...refusalRules],
      [
        "unknown-element",
        "unknown-attribute",
        "missing-attribute",
        "attribute-type",
        "padded-attribute",
        "text-not-allowed",
        "undeclared-response",
        "duplicate-identifier",
        "binding",
        "template-requirements",
        "value-type",
        "not-qti-root",
        "not-well-formed",
        "reader-refused",
      ],
    );
  });

  it("holds no rule twice", () => {
    assert.strictEqual(new Set(refusalRules).size, refusalRules.length);
  });
});

describe("Refusal", () => {
  it.effect("round-trips through its Schema with each location kind", () =>
    Effect.gen(function* roundTrip() {
      const refusals = cases();
      assert.deepStrictEqual(
        refusals.map((refusal) => refusal.location.kind),
        ["path", "position", "document"],
      );
      for (const refusal of refusals) {
        const encoded = yield* Schema.encodeEffect(Refusal)(refusal);
        const decoded = yield* Schema.decodeUnknownEffect(Refusal)(encoded);
        assert.instanceOf(decoded, Refusal);
        assert.deepStrictEqual(decoded, refusal);
      }
    }),
  );

  it.effect("fails to decode a rule outside refusalRules", () =>
    Effect.gen(function* outsideRule() {
      const [refusal] = cases();
      assert.isDefined(refusal);

      const encoded = yield* Schema.encodeEffect(Refusal)(refusal);
      const decode = Schema.decodeUnknownEffect(Refusal);
      const accepted = yield* decode(encoded);
      assert.strictEqual(accepted.rule, "unknown-element");

      const error = yield* Effect.flip(decode({ ...encoded, rule: "unknown-rule" }));
      assert.strictEqual(error._tag, "SchemaError");
    }),
  );
});
