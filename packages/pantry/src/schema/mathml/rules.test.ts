import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { inspect } from "node:util";

import { NodeClass, NodeDir } from "#pantry/schema/attributes.ts";
import { kinds, registry } from "#pantry/schema/kinds/mathml.ts";
import { MathmlBvar, MathmlMmultiscripts, MathmlPiecewise } from "#pantry/schema/mathml/arms.ts";
import { kindsListing, rules } from "#pantry/schema/mathml/rules.ts";
import * as node from "#pantry/schema/node.ts";
import { Qti } from "#pantry/schema/qti.ts";

const checks = rules.flatMap((rule) => (rule.kind === "check" ? [rule] : []));

const capacities = rules.flatMap((rule) => (rule.kind === "capacity" ? [rule] : []));

/**
 * The kind handles a check's description names, read from its quoted `m:` literals.
 */
const namedKinds = (name: string): string[] =>
  checks
    .filter((rule) => rule.name === name)
    .flatMap((rule) => {
      const described: unknown = rule;
      const text = Predicate.hasProperty(described, "desc")
        ? inspect(described.desc, { depth: null, maxArrayLength: null, maxStringLength: 1_000_000 })
        : "";

      return [...text.matchAll(/'(?<handle>m:[^']+)'/gu)].map((match) => {
        const { handle = "" } = match.groups ?? {};

        return handle;
      });
    });

/**
 * The bounds and child kind of a capacity, read from its description and its source.
 */
const readCapacity = (rule: (typeof capacities)[number]) => {
  const described: unknown = rule;
  const bounds =
    Predicate.hasProperty(described, "desc") &&
    Predicate.hasProperty(described.desc, "within") &&
    Predicate.hasProperty(described.desc.within, "low") &&
    Predicate.hasProperty(described.desc.within, "high")
      ? [described.desc.within.low, described.desc.within.high]
      : [];
  const source: unknown = rule.from.source;
  const childKind =
    Predicate.hasProperty(source, "relation") &&
    source.relation === node.Edge &&
    Predicate.hasProperty(source, "bindings") &&
    Predicate.hasProperty(source.bindings, "childKind") &&
    Object.keys(source.bindings).length === 1
      ? String(source.bindings.childKind)
      : undefined;

  return { bounds, childKind, from: [...rule.from.fields], on: [...rule.target.fields] };
};

describe("mathml/rules", () => {
  it("holds the two exclusion checks on NodeClass and NodeDir and three capacities", () => {
    assert.strictEqual(rules.length, 5);
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [
        ["NodeClassNotMathml", NodeClass],
        ["NodeDirNotMathml", NodeDir],
      ],
    );
    assert.strictEqual(capacities.length, 3);
  });

  it("refuses every MathML kind whose registry lists class", () => {
    const expected = kinds.filter((kind) => registry[kind].attributes.includes("class"));
    assert.deepStrictEqual([...kindsListing("class")], expected);
    assert.strictEqual(expected.length, 183);
    assert.deepStrictEqual(namedKinds("NodeClassNotMathml").toSorted(), expected.toSorted());
  });

  it("refuses every MathML kind whose registry lists dir", () => {
    const expected = kinds.filter((kind) => registry[kind].attributes.includes("dir"));
    assert.deepStrictEqual([...kindsListing("dir")], expected);
    assert.strictEqual(expected.length, 9);
    assert.deepStrictEqual(namedKinds("NodeDirNotMathml").toSorted(), expected.toSorted());
  });

  it("allows at most one m:mprescripts, m:degree and m:otherwise under their parents", () => {
    assert.deepStrictEqual(
      capacities.map((rule) => [rule.target.source, readCapacity(rule)]),
      [
        [
          MathmlMmultiscripts,
          { bounds: [0n, 1n], childKind: "m:mprescripts", from: ["parent"], on: ["id"] },
        ],
        [MathmlBvar, { bounds: [0n, 1n], childKind: "m:degree", from: ["parent"], on: ["id"] }],
        [
          MathmlPiecewise,
          { bounds: [0n, 1n], childKind: "m:otherwise", from: ["parent"], on: ["id"] },
        ],
      ],
    );
  });

  it("composes every statement into Qti", () => {
    for (const rule of rules) {
      assert.isTrue(Qti.statements.includes(rule));
    }
  });
});
