import { assert, describe, it } from "@effect/vitest";
import { isMappedLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
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
  it("names the two exclusion capacities wildcard-namespace", () => {
    expectRule(
      capacity("WildcardExclusion", side("ForeignElement", ["document", "node"])),
      "wildcard-namespace",
    );
    expectRule(
      capacity("AttributeExclusion", side("ForeignAttribute", ["document", "node"])),
      "wildcard-namespace",
    );
  });

  it("names the two declared-name capacities wildcard-declared", () => {
    expectRule(
      capacity("GlobalElement", side("ForeignElement", ["document", "node"])),
      "wildcard-declared",
    );
    expectRule(
      capacity("GlobalAttribute", side("ForeignAttribute", ["document", "node"])),
      "wildcard-declared",
    );
  });

  it("names a declared-name capacity filled from a select on process", () => {
    expectRule(
      capacity(
        "GlobalAttribute",
        side("ForeignAttribute", ["document", "node"], [{ field: "process", value: "item" }]),
      ),
      "wildcard-declared",
    );
  });

  it("names the ForeignAttribute containment in AttributeWildcard wildcard-attribute", () => {
    expectRule(contained("ForeignAttribute", "AttributeWildcard"), "wildcard-attribute");
  });

  it("names the two foreign attribute checks wildcard-attribute", () => {
    expectRule(check("ForeignAttribute", "ForeignUnqualifiedUnprefixed"), "wildcard-attribute");
    expectRule(check("ForeignAttribute", "ForeignAttributePrefix"), "wildcard-attribute");
  });
});
