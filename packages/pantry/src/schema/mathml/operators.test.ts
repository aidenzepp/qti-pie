import { assert, describe, it } from "@effect/vitest";

import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import {
  classArguments,
  operatorArguments,
  operatorClass,
  partialdiffFunctionArguments,
  qualifierGaps,
  qualifierOrder,
  qualifiersOf,
  recSyntaxTables,
  unstatedClasses,
} from "#pantry/schema/mathml/operators.ts";

/**
 * Find the qualifier kinds a head admits, failing the test when the head has no syntax table.
 *
 * @param head - The head handle.
 * @returns The qualifier kinds, in qualifier order.
 */
const qualifiers = (head: string): readonly string[] => {
  const kinds = qualifiersOf[head];

  if (kinds === undefined) {
    return assert.fail(`${head} has a syntax table`);
  }

  return kinds;
};

/**
 * List the heads that admit a qualifier kind.
 *
 * @param kind - The qualifier handle.
 * @returns The head handles, sorted.
 */
const admitting = (kind: string): readonly string[] =>
  Object.entries(qualifiersOf)
    .filter(([, kinds]) => kinds.includes(kind))
    .map(([head]) => head)
    .toSorted();

/**
 * The handles of the children an entry's model references.
 *
 * @param handle - The kind handle.
 * @returns The distinct child handles.
 */
const childrenOf = (handle: string): ReadonlySet<string> => {
  const entry = mathmlInventory[handle];

  if (entry === undefined) {
    return assert.fail(`${handle} has an entry`);
  }

  return new Set(entry.children.map((child) => child.name));
};

describe("the operator classes", () => {
  it("covers 125 handles in 34 classes, and states a count for 23 of them", () => {
    assert.strictEqual(Object.keys(operatorClass).length, 125);

    const classes = new Set(Object.values(operatorClass));

    assert.strictEqual(classes.size, 34);
    assert.strictEqual(Object.keys(classArguments).length, 23);
    assert.deepStrictEqual(
      [...classes].filter((name) => classArguments[name] === undefined).toSorted(),
      [...unstatedClasses],
    );
  });

  it("gives m:divide two arguments and m:sin one", () => {
    assert.strictEqual(operatorClass["m:divide"], "binary-arith");
    assert.deepStrictEqual(operatorArguments["m:divide"], { max: 2, min: 2 });
    assert.strictEqual(operatorClass["m:sin"], "unary-elementary");
    assert.deepStrictEqual(operatorArguments["m:sin"], { max: 1, min: 1 });
  });

  it("gives m:minus and m:root one or two arguments", () => {
    assert.deepStrictEqual(operatorArguments["m:minus"], { max: 2, min: 1 });
    assert.deepStrictEqual(operatorArguments["m:root"], { max: 2, min: 1 });
  });

  it("gives m:selector at least one argument and m:plus any number", () => {
    assert.deepStrictEqual(operatorArguments["m:selector"], { max: undefined, min: 1 });
    assert.deepStrictEqual(operatorArguments["m:plus"], { max: undefined, min: 0 });
  });

  it("gives m:partialdiff two arguments without a bvar and no class count", () => {
    assert.deepStrictEqual(partialdiffFunctionArguments, { max: 2, min: 2 });
    assert.strictEqual(operatorClass["m:partialdiff"], "partialdiff");
    assert.strictEqual(operatorArguments["m:partialdiff"], undefined);
  });

  it("states no count for the heads of an unstated class", () => {
    const stated = Object.entries(operatorClass).filter(
      ([, name]) => !unstatedClasses.includes(name),
    );

    assert.strictEqual(Object.keys(operatorArguments).length, stated.length);

    for (const [handle, name] of Object.entries(operatorClass)) {
      assert.strictEqual(
        operatorArguments[handle] === undefined,
        unstatedClasses.includes(name),
        handle,
      );
    }
  });
});

describe("the REC's qualifier tables", () => {
  it("counts 123 syntax tables in chapter 4, 108 of them in 4.4, and names 135 heads", () => {
    assert.deepStrictEqual(recSyntaxTables, { chapter: 123, section44: 108 });
    assert.strictEqual(Object.keys(qualifiersOf).length, 135);
  });

  it("orders the nine qualifier kinds as the REC does", () => {
    assert.deepStrictEqual(qualifierOrder, [
      "m:bvar",
      "m:lowlimit",
      "m:uplimit",
      "m:interval",
      "m:condition",
      "m:domainofapplication",
      "m:degree",
      "m:momentabout",
      "m:logbase",
    ]);
  });

  it("lists each head's qualifiers in qualifier order", () => {
    for (const [head, kinds] of Object.entries(qualifiersOf)) {
      assert.deepStrictEqual(
        kinds,
        qualifierOrder.filter((kind) => kinds.includes(kind)),
        head,
      );
    }
  });

  it("admits m:logbase with m:log and m:sin none", () => {
    assert.include(qualifiers("m:log"), "m:logbase");
    assert.deepStrictEqual(qualifiers("m:sin"), []);
  });

  it("admits m:momentabout and m:degree with m:moment", () => {
    assert.deepStrictEqual(qualifiers("m:moment"), ["m:degree", "m:momentabout"]);
  });

  it("admits m:bvar and the five domain qualifiers with m:int", () => {
    assert.deepStrictEqual(qualifiers("m:int"), [
      "m:bvar",
      "m:lowlimit",
      "m:uplimit",
      "m:interval",
      "m:condition",
      "m:domainofapplication",
    ]);
  });

  it("admits m:logbase and m:momentabout only with their own operators", () => {
    assert.deepStrictEqual(admitting("m:logbase"), ["m:ci", "m:csymbol", "m:log"]);
    assert.deepStrictEqual(admitting("m:momentabout"), ["m:ci", "m:csymbol", "m:moment"]);
  });

  it("admits m:degree with m:root, m:moment, m:diff and m:partialdiff", () => {
    assert.deepStrictEqual(admitting("m:degree"), [
      "m:ci",
      "m:csymbol",
      "m:diff",
      "m:moment",
      "m:partialdiff",
      "m:root",
    ]);
  });

  it("adds only what the REC's tables leave out of diff, partialdiff and limit", () => {
    assert.deepStrictEqual(Object.keys(qualifierGaps), ["m:diff", "m:limit", "m:partialdiff"]);
    assert.deepStrictEqual(qualifiers("m:limit"), ["m:bvar", "m:lowlimit", "m:condition"]);
    assert.deepStrictEqual(qualifiers("m:diff"), ["m:bvar", "m:degree"]);
    assert.deepStrictEqual(qualifiers("m:partialdiff"), ["m:bvar", "m:degree"]);
  });
});

describe("the operator tables against the MathML leaf", () => {
  it("names only handles of the leaf", () => {
    const handles = [
      ...Object.keys(operatorClass),
      ...Object.keys(operatorArguments),
      ...Object.keys(qualifiersOf),
      ...Object.values(qualifiersOf).flat(),
      ...qualifierOrder,
    ];

    for (const handle of handles) {
      assert.isDefined(mathmlInventory[handle], handle);
    }
  });

  it("lists every operator and every qualifier among the children of m:apply", () => {
    const applied = childrenOf("m:apply");

    for (const handle of [...Object.keys(operatorClass), ...qualifierOrder]) {
      assert.isTrue(applied.has(handle), handle);
    }
  });
});
