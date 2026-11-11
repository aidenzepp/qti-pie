/**
 * The refusal an app reads (`#pantry/api/verdict.ts`): each importer refusal mapped to its
 * {@link Refusal} case, its level, rules, detail and origin kept, and its one `rule` the first of
 * its rules.
 */
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr } from "effect";
import { RefusedAbove } from "#pantry/import/above.ts";
import { ImportRefused, ruleOrder } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";
import { readerOrigin } from "#pantry/package/refusal-origin.ts";
import { refusalOf } from "#pantry/api/verdict.ts";
import type { Refusal } from "#pantry/api/verdict.ts";

describe("refusalOf", () => {
  it("maps a refusal made before the database to the qti case, its rules exactly [rule]", () => {
    const refused = new ImportRefused({
      detail: "the package holds no imsmanifest.xml",
      origin: readerOrigin,
      rules: ["manifest-root"],
    });
    const expected: Refusal = {
      detail: "the package holds no imsmanifest.xml",
      kind: "qti",
      level: "Qti",
      origin: { _tag: "Reader" },
      rule: "manifest-root",
      rules: ["manifest-root"],
    };

    assert.deepStrictEqual(refusalOf(refused), expected);
  });

  it("keeps every rule of a database refusal whose laws belong to two rules, rule the first", () => {
    // Oracle: decision 496, M3, and the brief's red case: a `some` refusal names laws of two
    // rules and the database does not say which broke, so the refusal carries both, in the
    // roster's order (`ruleOrder`), and `rule` is the first of them. The order is the roster's,
    // never the laws': the laws below name the later rule first.
    const rules: readonly Rule[] = Arr.sort(
      ["attribute-admission", "required-attribute"] as const,
      ruleOrder,
    );
    const origin = {
      _tag: "Database",
      kind: "some",
      laws: [
        { name: "AL1 admission", rule: "attribute-admission", text: "check AL1_admission" },
        { name: "AL3 required", rule: "required-attribute", text: "check AL3_required" },
      ],
      sources: ["the attribute admission table", "the required attributes table"],
      witness: "unreported",
    } as const;
    const refused = new ImportRefused({ detail: "two laws", origin, rules });
    const refusal = refusalOf(refused);

    assert.deepStrictEqual(rules, ["required-attribute", "attribute-admission"]);
    assert.strictEqual(refusal.kind, "qti");
    assert.deepStrictEqual(refusal.rules, ["required-attribute", "attribute-admission"]);
    assert.strictEqual(refusal.rule, "required-attribute");
    assert.deepStrictEqual(refusal.origin, origin);
  });

  it("names no rule when the database named only laws the law table does not hold", () => {
    // Oracle: `ImportRefused`'s own reading of an empty set, "laws no rule of the law table
    // names": the refusal has no first rule to give, so it carries `rules` empty and no `rule`.
    const refused = new ImportRefused({
      detail: "a law the table does not hold",
      origin: {
        _tag: "Database",
        kind: "every",
        laws: [{ text: "check Unstated" }],
        sources: [],
        witness: "unreported",
      },
      rules: [],
    });
    const refusal = refusalOf(refused);

    assert.deepStrictEqual(refusal.rules, []);
    assert.notProperty(refusal, "rule");
  });

  it("maps a RefusedAbove to the above case, with its level, rules, detail and origin", () => {
    const origin = {
      _tag: "Database",
      kind: "every",
      laws: [{ text: "check cdn-origin" }],
      sources: ["the Cdn level, which states these laws above Qti"],
      witness: "unreported",
    } as const;
    const refused = new RefusedAbove({
      detail: "cdn-origin: check cdn-origin",
      level: "Cdn",
      origin,
      rule: "cdn-origin",
      rules: ["cdn-origin"],
    });
    const expected: Refusal = {
      detail: "cdn-origin: check cdn-origin",
      kind: "above",
      level: "Cdn",
      origin: {
        _tag: "Database",
        kind: "every",
        laws: [{ text: "check cdn-origin" }],
        sources: ["the Cdn level, which states these laws above Qti"],
        witness: "unreported",
      },
      rule: "cdn-origin",
      rules: ["cdn-origin"],
    };

    assert.deepStrictEqual(refusalOf(refused), expected);
  });
});
