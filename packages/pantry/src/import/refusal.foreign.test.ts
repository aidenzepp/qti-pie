import { assert, describe, it } from "@effect/vitest";
import { WildcardGuardRefusal } from "#pantry/import/guards/wildcard.ts";
import { ImportRefused, isMappedLaw, ruleOfError, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw, Rule } from "#pantry/import/refusal.ts";

interface Side {
  readonly fields: readonly string[];
  readonly relation: string;
  readonly selection?: readonly { readonly field: string; readonly value: string }[];
}

const side = (
  relation: string,
  fields: readonly string[],
  selection: Side["selection"] = [],
): Side => ({ fields, relation, selection });

const capacity = (target: string, from: Side): ImportLaw => ({
  from,
  kind: "capacity",
  target: side(target, ["document", "node"]),
});

const check = (relation: string, name: string): ImportLaw => ({ kind: "check", name, relation });

const contained = (from: string, to: string): ImportLaw => ({
  from: side(from, ["document", "node"]),
  kind: "contained",
  to: side(to, ["document", "node"]),
});

const expectRule = (law: ImportLaw, rule: Rule): void => {
  assert.strictEqual(ruleOfLaw(law), rule);
  assert.isTrue(isMappedLaw(law));
};

describe("the wildcard rules of a law", () => {
  it("maps a wildcard guard's refusal to an ImportRefused of its rule", () => {
    for (const rule of ["wildcard-namespace", "wildcard-declared"] as const) {
      const refused = ruleOfError(new WildcardGuardRefusal({ detail: "d", rule }));

      assert.instanceOf(refused, ImportRefused);
      assert.strictEqual(refused.rule, rule);
    }
  });

  it("maps none of the four retired capacities", () => {
    for (const [target, from] of [
      ["WildcardExclusion", "ForeignElement"],
      ["AttributeExclusion", "ForeignAttribute"],
      ["GlobalElement", "ForeignElement"],
      ["GlobalAttribute", "ForeignAttribute"],
    ] as const) {
      assert.isFalse(isMappedLaw(capacity(target, side(from, ["document", "node"]))));
    }
  });

  it("names the ForeignAttribute containment in AttributeWildcard wildcard-attribute", () => {
    expectRule(contained("ForeignAttribute", "AttributeWildcard"), "wildcard-attribute");
  });

  it("names the two foreign attribute checks wildcard-attribute", () => {
    expectRule(check("ForeignAttribute", "ForeignUnqualifiedUnprefixed"), "wildcard-attribute");
    expectRule(check("ForeignAttribute", "ForeignAttributePrefix"), "wildcard-attribute");
  });
});
