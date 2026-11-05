import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { mathmlGuards, modelFinding } from "#pantry/import/guards/mathml.ts";
import { Rows } from "#pantry/import/tree.ts";
import { mathExpression, mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { models } from "#pantry/schema/mathml/models.ts";
import type { Model, Particle } from "#pantry/schema/mathml/models.ts";

/**
 * Collect every handle a particle names, descending into sequences and choices.
 *
 * @param particle - The particle.
 * @returns The handles, with repeats.
 */
const handlesOf = (particle: Particle): readonly string[] => {
  if ("any" in particle) {
    return [];
  }

  if ("kinds" in particle) {
    return particle.kinds;
  }

  return ("sequence" in particle ? particle.sequence : particle.choice).flatMap(handlesOf);
};

/**
 * A run of `count` presentation tokens, every one an expression.
 *
 * @param count - How many.
 * @returns The handles.
 */
const tokens = (count: number): readonly string[] => Array.from({ length: count }, () => "m:mi");

/**
 * Find the model the table holds for a handle.
 *
 * @param handle - The kind handle.
 * @returns The model, empty when the table has none.
 */
const modelOf = (handle: string): Model =>
  new Map<string, Model>(Object.entries(models)).get(handle) ?? [];

describe("modelFinding", () => {
  it("passes a fraction with exactly two element children", () => {
    assert.strictEqual(modelFinding("m:mfrac", ["m:mi", "m:mn"]), undefined);
    assert.strictEqual(modelFinding("m:mfrac", ["m:mrow", "m:msqrt"]), undefined);
  });

  it("counts a fraction that has too many or too few children", () => {
    assert.strictEqual(modelFinding("m:mfrac", ["m:mi", "m:mn", "m:mi"]), "union-count");
    assert.strictEqual(modelFinding("m:mfrac", ["m:mi"]), "union-count");
    assert.strictEqual(modelFinding("m:mfrac", []), "union-count");
  });

  it("counts a child the model does not name", () => {
    assert.strictEqual(modelFinding("m:mfrac", ["m:mi", "m:annotation"]), "union-count");
    assert.strictEqual(modelFinding("m:mrow", ["m:mi", "qti-printed-variable"]), "union-count");
  });

  it("passes a semantics element whose annotations follow its expression", () => {
    assert.strictEqual(modelFinding("m:semantics", ["m:mi", "m:annotation"]), undefined);
    assert.strictEqual(
      modelFinding("m:semantics", ["m:mi", "m:annotation", "m:annotation-xml", "m:annotation"]),
      undefined,
    );
    assert.strictEqual(modelFinding("m:semantics", ["m:mi"]), undefined);
  });

  it("orders a semantics element whose annotation comes first", () => {
    assert.strictEqual(modelFinding("m:semantics", ["m:annotation", "m:mi"]), "ordering");
    assert.strictEqual(
      modelFinding("m:semantics", ["m:annotation", "m:annotation-xml", "m:mi"]),
      "ordering",
    );
  });

  it("counts a semantics element with no expression or two", () => {
    assert.strictEqual(modelFinding("m:semantics", []), "union-count");
    assert.strictEqual(modelFinding("m:semantics", ["m:annotation"]), "union-count");
    assert.strictEqual(modelFinding("m:semantics", ["m:mi", "m:mn"]), "union-count");
  });

  it("passes a multiscripts element of a base, pairs and one prescripts section", () => {
    assert.strictEqual(modelFinding("m:mmultiscripts", ["m:mi"]), undefined);
    assert.strictEqual(
      modelFinding("m:mmultiscripts", ["m:mi", "m:mi", "m:none", "m:mprescripts", "m:mn", "m:mn"]),
      undefined,
    );
    assert.strictEqual(
      modelFinding("m:mmultiscripts", ["m:mi", "m:mi", "m:mi", "m:mprescripts"]),
      undefined,
    );
    assert.strictEqual(modelFinding("m:mmultiscripts", ["m:mi", "m:mprescripts"]), undefined);
  });

  it("counts a multiscripts element with an odd number of scripts or two prescripts", () => {
    assert.strictEqual(modelFinding("m:mmultiscripts", ["m:mi", "m:mi"]), "union-count");
    assert.strictEqual(
      modelFinding("m:mmultiscripts", ["m:mi", "m:mi", "m:mi", "m:mprescripts", "m:mi"]),
      "union-count",
    );
    assert.strictEqual(
      modelFinding("m:mmultiscripts", ["m:mi", "m:mprescripts", "m:mprescripts"]),
      "union-count",
    );
    assert.strictEqual(
      modelFinding("m:mmultiscripts", [
        "m:mi",
        "m:mi",
        "m:mi",
        "m:mprescripts",
        "m:mi",
        "m:mi",
        "m:mprescripts",
      ]),
      "union-count",
    );
  });

  it("orders a multiscripts element whose prescripts precede a pair", () => {
    assert.strictEqual(
      modelFinding("m:mmultiscripts", ["m:mi", "m:mprescripts", "m:mi", "m:mi", "m:mi", "m:mi"]),
      undefined,
    );
    assert.strictEqual(modelFinding("m:mmultiscripts", ["m:mprescripts", "m:mi"]), "ordering");
  });

  it("needs three children for the sub-superscript kinds", () => {
    assert.strictEqual(modelFinding("m:msubsup", ["m:mi", "m:mn", "m:mi"]), undefined);
    assert.strictEqual(modelFinding("m:msubsup", ["m:mi", "m:mn"]), "union-count");
    assert.strictEqual(modelFinding("m:msubsup", tokens(4)), "union-count");
    assert.strictEqual(modelFinding("m:munderover", tokens(3)), undefined);
    assert.strictEqual(modelFinding("m:munderover", tokens(2)), "union-count");
  });

  it("needs at least three children for a long division", () => {
    assert.strictEqual(modelFinding("m:mlongdiv", tokens(3)), undefined);
    assert.strictEqual(modelFinding("m:mlongdiv", tokens(7)), undefined);
    assert.strictEqual(modelFinding("m:mlongdiv", tokens(2)), "union-count");
    assert.strictEqual(modelFinding("m:mlongdiv", []), "union-count");
  });

  it("holds exactly one element child of any kind in an annotation-xml", () => {
    assert.strictEqual(modelFinding("m:annotation-xml", ["m:mi"]), undefined);
    assert.strictEqual(modelFinding("m:annotation-xml", ["div"]), undefined);
    assert.strictEqual(modelFinding("m:annotation-xml", ["qti-printed-variable"]), undefined);
    assert.strictEqual(modelFinding("m:annotation-xml", []), "union-count");
    assert.strictEqual(modelFinding("m:annotation-xml", ["m:mi", "m:mn"]), "union-count");
  });

  it("starts a semantics.ci with a ci or a nested semantics.ci", () => {
    assert.strictEqual(modelFinding("m:semantics.ci", ["m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:semantics.ci", ["m:semantics.ci"]), undefined);
    assert.strictEqual(modelFinding("m:semantics.ci", ["m:ci", "m:annotation"]), undefined);
    assert.strictEqual(modelFinding("m:semantics.ci", ["m:mi"]), "union-count");
    assert.strictEqual(modelFinding("m:semantics.ci", ["m:annotation"]), "union-count");
    assert.strictEqual(modelFinding("m:semantics.ci", ["m:annotation", "m:ci"]), "ordering");
    assert.strictEqual(modelFinding("m:semantics.ci", ["m:ci", "m:ci"]), "union-count");
  });

  it("admits no element child under an empty kind", () => {
    assert.strictEqual(modelFinding("m:plus", []), undefined);
    assert.strictEqual(modelFinding("m:plus", ["m:ci"]), "union-count");
    assert.strictEqual(modelFinding("m:cbytes", ["m:mi"]), "union-count");
  });

  it("passes a token kind that holds a glyph or an alignment mark", () => {
    assert.strictEqual(modelFinding("m:mi", []), undefined);
    assert.strictEqual(modelFinding("m:mi", ["m:mglyph", "m:malignmark", "m:mglyph"]), undefined);
    assert.strictEqual(modelFinding("m:mi", ["m:mi"]), "union-count");
    assert.strictEqual(modelFinding("m:cn", ["m:sep", "m:mglyph", "m:mi"]), undefined);
    assert.strictEqual(modelFinding("m:ci", ["m:sep"]), "union-count");
  });

  it("matches the XSD's head, bvar, qualifier and operand order in an apply", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:plus", "m:ci", "m:cn"]), undefined);
    assert.strictEqual(
      modelFinding("m:apply", ["m:int", "m:bvar", "m:lowlimit", "m:uplimit", "m:ci"]),
      undefined,
    );
    assert.strictEqual(modelFinding("m:apply", ["m:bvar", "m:plus"]), "ordering");
    assert.strictEqual(modelFinding("m:apply", []), "union-count");
  });

  it("matches a list's bvar and qualifiers before its elements", () => {
    assert.strictEqual(modelFinding("m:list", ["m:bvar", "m:condition", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:list", ["m:ci", "m:bvar"]), "ordering");
    assert.strictEqual(modelFinding("m:lambda", ["m:bvar", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:lambda", ["m:bvar"]), "union-count");
  });

  it("holds the tables' rows and cells", () => {
    assert.strictEqual(modelFinding("m:mtable", ["m:mtr", "m:mlabeledtr"]), undefined);
    assert.strictEqual(modelFinding("m:mtable", ["m:mtd"]), "union-count");
    assert.strictEqual(modelFinding("m:mlabeledtr", []), "union-count");
    assert.strictEqual(modelFinding("m:mlabeledtr", ["m:mtd"]), undefined);
    assert.strictEqual(modelFinding("m:mtr", []), undefined);
  });

  it("holds one variable and at most one degree in a bvar, in either order (E C8, C9)", () => {
    assert.strictEqual(modelFinding("m:bvar", ["m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:bvar", ["m:semantics.ci"]), undefined);
    assert.strictEqual(modelFinding("m:bvar", ["m:ci", "m:degree"]), undefined);
    assert.strictEqual(modelFinding("m:bvar", ["m:degree", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:bvar", ["m:degree", "m:semantics.ci"]), undefined);
    assert.strictEqual(modelFinding("m:bvar", ["m:ci", "m:ci"]), "union-count");
    assert.strictEqual(modelFinding("m:bvar", []), "union-count");
    assert.strictEqual(modelFinding("m:bvar", ["m:degree"]), "union-count");
    assert.strictEqual(modelFinding("m:bvar", ["m:ci", "m:degree", "m:degree"]), "union-count");
    assert.strictEqual(modelFinding("m:bvar", ["m:cn"]), "union-count");
  });

  it("holds any number of pieces and at most one otherwise in a piecewise (E C10)", () => {
    assert.strictEqual(modelFinding("m:piecewise", []), undefined);
    assert.strictEqual(modelFinding("m:piecewise", ["m:piece", "m:otherwise"]), undefined);
    assert.strictEqual(
      modelFinding("m:piecewise", ["m:piece", "m:otherwise", "m:piece"]),
      undefined,
    );
    assert.strictEqual(modelFinding("m:piecewise", ["m:otherwise", "m:otherwise"]), "union-count");
    assert.strictEqual(
      modelFinding("m:piecewise", ["m:piece", "m:otherwise", "m:piece", "m:otherwise"]),
      "union-count",
    );
    assert.strictEqual(modelFinding("m:piece", ["m:ci", "m:cn"]), undefined);
    assert.strictEqual(modelFinding("m:piece", ["m:ci"]), "union-count");
  });

  it("refuses an mscarries as the last element child of an mstack or mlongdiv (E P10)", () => {
    assert.strictEqual(modelFinding("m:mstack", ["m:mn", "m:mscarries"]), "ordering");
    assert.strictEqual(modelFinding("m:mstack", ["m:mscarries"]), "ordering");
    assert.strictEqual(modelFinding("m:mstack", ["m:mscarries", "m:mn"]), undefined);
    assert.strictEqual(modelFinding("m:mstack", ["m:mn", "m:mscarries", "m:msline"]), undefined);
    assert.strictEqual(modelFinding("m:mstack", []), undefined);
    assert.strictEqual(
      modelFinding("m:mlongdiv", ["m:mn", "m:mn", "m:mn", "m:mscarries"]),
      "ordering",
    );
    assert.strictEqual(
      modelFinding("m:mlongdiv", ["m:mn", "m:mn", "m:mscarries", "m:mn"]),
      undefined,
    );
    assert.strictEqual(modelFinding("m:msgroup", ["m:mn", "m:mscarries"]), undefined);
  });

  it("treats a kind with no model as a programming error", () => {
    assert.throws(() => {
      modelFinding("m:nonsense", []);
    });
    assert.throws(() => {
      modelFinding("mrow", []);
    });
  });
});

describe("the table of models", () => {
  it("has a model for every handle of the leaf and no other", () => {
    assert.deepStrictEqual(Object.keys(models).toSorted(), Object.keys(mathmlInventory).toSorted());
    assert.strictEqual(Object.keys(models).length, 194);
  });

  it("names exactly the element children the leaf lists for each kind", () => {
    for (const [handle, entry] of Object.entries(mathmlInventory)) {
      const named = new Set(modelOf(handle).flatMap(handlesOf));
      const listed = new Set(entry.children.map((child) => child.name));
      assert.deepStrictEqual([...named].toSorted(), [...listed].toSorted(), handle);
    }
  });

  it("uses the leaf's expression group for the children of an expression container", () => {
    const first = models["m:mfrac"]?.[0];
    assert.isTrue(first !== undefined && "kinds" in first);
    assert.deepStrictEqual(
      first !== undefined && "kinds" in first ? first.kinds.toSorted() : [],
      mathExpression.toSorted(),
    );
    assert.strictEqual(mathExpression.length, 168);
  });
});

describe("mathmlGuards", () => {
  it.effect("accepts rows that hold no MathML node", () =>
    Effect.gen(function* emptyRows() {
      yield* mathmlGuards(Rows.empty());
    }),
  );
});
