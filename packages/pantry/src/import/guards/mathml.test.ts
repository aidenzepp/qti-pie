import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import type { Uuid } from "@bjornpagen/grizzle";

import { mathmlGuards, modelFinding } from "#pantry/import/guards/mathml.ts";
import { judgedLater } from "#pantry/import/judged.ts";
import { Rows } from "#pantry/import/tree.ts";
import { mathExpression, mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { MathmlCbytes } from "#pantry/schema/mathml/attributes.ts";
import { headModel, models } from "#pantry/schema/mathml/models.ts";
import type { Model, Particle } from "#pantry/schema/mathml/models.ts";
import { operatorClass, qualifiersOf } from "#pantry/schema/mathml/operators.ts";
import { Edge, Node, TextNode, Ws } from "#pantry/schema/node.ts";

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

  it("counts the operands of an operator by its class (E C1 to C3)", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:divide", "m:ci", "m:cn"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:divide", "m:ci"]), "union-count");
    assert.strictEqual(
      modelFinding("m:apply", ["m:divide", "m:ci", "m:cn", "m:ci"]),
      "union-count",
    );
    assert.strictEqual(modelFinding("m:apply", ["m:sin", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:sin", "m:ci", "m:cn"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:sin"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:plus"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:plus", "m:ci", "m:ci", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:selector"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:selector", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:selector", "m:ci", "m:cn", "m:cn"]), undefined);
  });

  it("takes one or two operands for minus and root (E C1)", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:minus"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:minus", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:minus", "m:ci", "m:cn"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:minus", "m:ci", "m:cn", "m:cn"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:root", "m:degree", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:root", "m:ci"]), undefined);
  });

  it("reads partialdiff by its bound variables (E C4)", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:partialdiff", "m:ci"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:partialdiff", "m:list", "m:ci"]), undefined);
    assert.strictEqual(
      modelFinding("m:apply", ["m:partialdiff", "m:list", "m:ci", "m:ci"]),
      "union-count",
    );
    assert.strictEqual(
      modelFinding("m:apply", ["m:partialdiff", "m:bvar", "m:bvar", "m:ci"]),
      undefined,
    );
    assert.strictEqual(modelFinding("m:apply", ["m:partialdiff", "m:bvar", "m:ci"]), undefined);
  });

  it("holds the qualifiers a head admits, in the REC's order (E C5, C7)", () => {
    assert.strictEqual(
      modelFinding("m:apply", ["m:int", "m:bvar", "m:lowlimit", "m:uplimit", "m:ci"]),
      undefined,
    );
    assert.strictEqual(
      modelFinding("m:apply", ["m:int", "m:bvar", "m:condition", "m:lowlimit", "m:ci"]),
      "ordering",
    );
    assert.strictEqual(
      modelFinding("m:apply", ["m:int", "m:bvar", "m:uplimit", "m:lowlimit", "m:ci"]),
      "ordering",
    );
    assert.strictEqual(modelFinding("m:apply", ["m:sum", "m:ci", "m:bvar"]), "ordering");
    assert.strictEqual(modelFinding("m:apply", ["m:root", "m:ci", "m:degree"]), "ordering");
    assert.strictEqual(modelFinding("m:apply", ["m:root", "m:degree", "m:ci"]), undefined);
    assert.strictEqual(
      modelFinding("m:apply", ["m:diff", "m:bvar", "m:degree", "m:ci"]),
      undefined,
    );
    assert.strictEqual(
      modelFinding("m:apply", ["m:limit", "m:bvar", "m:lowlimit", "m:ci"]),
      undefined,
    );
    assert.strictEqual(
      modelFinding("m:apply", ["m:limit", "m:bvar", "m:lowlimit", "m:uplimit", "m:ci"]),
      "admission",
    );
  });

  it("refuses a qualifier the head does not admit (E rec 2)", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:sin", "m:logbase", "m:ci"]), "admission");
    assert.strictEqual(modelFinding("m:apply", ["m:log", "m:logbase", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:sin", "m:bvar", "m:ci"]), "admission");
    assert.strictEqual(modelFinding("m:apply", ["m:log", "m:bvar", "m:ci"]), "admission");
    assert.strictEqual(modelFinding("m:apply", ["m:moment", "m:momentabout", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:plus", "m:momentabout", "m:ci"]), "admission");
  });

  it("judges a head the tables do not class by what its row admits (decision 233, F-4)", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:ci", "m:ci", "m:cn", "m:cn"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:ci", "m:bvar", "m:logbase", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:csymbol", "m:degree", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:cn", "m:bvar", "m:ci"]), "admission");
    assert.strictEqual(modelFinding("m:apply", ["m:apply", "m:degree", "m:ci"]), "admission");
    assert.strictEqual(modelFinding("m:apply", ["m:declare", "m:bvar", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:apply", ["m:declare", "m:ci", "m:ci"]), undefined);
    for (const head of ["m:bind", "m:declare", "m:fn", "m:reln", "m:share"]) {
      assert.strictEqual(modelFinding("m:apply", [head, "m:bvar", "m:ci"]), undefined, head);
      assert.strictEqual(modelFinding("m:apply", [head, "m:degree", "m:ci"]), undefined, head);
      assert.strictEqual(modelFinding("m:apply", [head, "m:ci", "m:bvar"]), "ordering", head);
    }
    assert.strictEqual(modelFinding("m:apply", ["m:fn", "m:bvar", "m:ci"]), undefined);
  });

  it("keeps the XSD's model for a head that is no content expression", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:mi", "m:ci"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:bvar", "m:plus"]), "ordering");
    assert.strictEqual(modelFinding("m:apply", ["m:degree"]), "union-count");
  });

  it("counts a presentation operand as no operand", () => {
    assert.strictEqual(modelFinding("m:apply", ["m:plus", "m:mi"]), "union-count");
    assert.strictEqual(modelFinding("m:apply", ["m:divide", "m:ci", "m:mi"]), "union-count");
  });

  it("holds at least one bvar after the head of a bind (E C12, D3)", () => {
    assert.strictEqual(modelFinding("m:bind", ["m:forall", "m:ci"]), "union-count");
    assert.strictEqual(modelFinding("m:bind", ["m:forall", "m:bvar", "m:ci"]), undefined);
    assert.strictEqual(
      modelFinding("m:bind", ["m:forall", "m:bvar", "m:bvar", "m:condition", "m:ci"]),
      undefined,
    );
    assert.strictEqual(
      modelFinding("m:bind", ["m:forall", "m:condition", "m:bvar", "m:ci"]),
      "ordering",
    );
    assert.strictEqual(modelFinding("m:bind", ["m:forall"]), "union-count");
    assert.strictEqual(modelFinding("m:bind", ["m:forall", "m:bvar"]), undefined);
    assert.strictEqual(modelFinding("m:bind", ["m:forall", "m:degree", "m:bvar"]), "admission");
    assert.strictEqual(modelFinding("m:bind", ["m:ci", "m:ci"]), "union-count");
    assert.strictEqual(modelFinding("m:bind", ["m:ci", "m:bvar", "m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:bind", ["m:mi", "m:ci"]), "union-count");
    assert.strictEqual(modelFinding("m:bind", []), "union-count");
  });

  it("holds the lambda's bvar list as the XSD states it (E C11, D3)", () => {
    assert.strictEqual(modelFinding("m:lambda", ["m:ci"]), undefined);
    assert.strictEqual(modelFinding("m:lambda", ["m:bvar", "m:bvar", "m:ci"]), undefined);
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

describe("the head-dependent models", () => {
  it("reach every head of an operator class", () => {
    for (const head of Object.keys(operatorClass)) {
      assert.isDefined(headModel("m:apply", head, false), head);
      assert.isDefined(headModel("m:bind", head, true), head);
    }
  });

  it("find every classed head in the qualifier table", () => {
    for (const head of Object.keys(operatorClass)) {
      assert.isTrue(head in qualifiersOf, head);
    }
  });

  it("leave only the REC's unclassed heads in the table and five content heads outside it", () => {
    assert.deepStrictEqual(
      Object.keys(qualifiersOf)
        .filter((head) => !(head in operatorClass))
        .toSorted(),
      [
        "m:apply",
        "m:cbytes",
        "m:cerror",
        "m:ci",
        "m:cn",
        "m:cs",
        "m:csymbol",
        "m:otherwise",
        "m:piece",
        "m:piecewise",
      ],
    );

    const [first] = modelOf("m:apply");
    assert.deepStrictEqual(
      (first === undefined ? [] : handlesOf(first)).filter((head) => !(head in qualifiersOf)),
      ["m:bind", "m:declare", "m:fn", "m:reln", "m:share"],
    );
  });

  it("admit an uplimit only with its lowlimit", () => {
    for (const [head, admitted] of Object.entries(qualifiersOf)) {
      assert.isTrue(!admitted.includes("m:uplimit") || admitted.includes("m:lowlimit"), head);
    }
  });

  it("name no head for a kind outside the content expressions", () => {
    assert.isUndefined(headModel("m:apply", "m:mi", false));
    assert.isUndefined(headModel("m:bind", "m:bvar", true));
  });
});

describe("mathmlGuards", () => {
  it.effect("accepts rows that hold no MathML node", () =>
    Effect.gen(function* emptyRows() {
      yield* mathmlGuards(Rows.empty());
    }),
  );
});

/**
 * A test id.
 *
 * @param hex - The last twelve hex digits.
 * @returns The id.
 */
const idOf = (hex: string): Uuid => `00000000-0000-4000-8000-${hex.padStart(12, "0")}`;

const tree = idOf("1");

const cbytes = idOf("2");

/**
 * The rows of one `m:cbytes` node, its text children and the row that copies them.
 *
 * @param value - The `MathmlCbytes` value.
 * @param texts - The children in order: text, or whitespace when it is only whitespace.
 * @returns The rows.
 */
const cbytesRows = (value: string, texts: readonly string[]): Rows => {
  const children = texts.map((text, index) => ({
    id: idOf(`1${index}`),
    kind: /\S/u.test(text) ? ("text" as const) : ("ws" as const),
    text,
  }));
  const base = Rows.add(Rows.empty(), Node, [
    {
      ancestry: "root",
      id: cbytes,
      kind: "m:cbytes",
      prefix: "m",
      rootKind: "item",
      tree,
      version: "3.0.1",
    },
  ]);
  const edged = Rows.add(
    base,
    Edge,
    children.map((child, index) => ({
      child: child.id,
      childAncestry: "root",
      childKind: child.kind,
      parent: cbytes,
      parentAncestry: "root",
      parentKind: "m:cbytes",
      position: BigInt(index),
      tree,
      version: "3.0.1",
    })),
  );
  const texted = Rows.add(
    edged,
    TextNode,
    children.filter((child) => child.kind === "text").map(({ id, text }) => ({ id, value: text })),
  );
  const spaced = Rows.add(
    texted,
    Ws,
    children
      .filter((child) => child.kind === "ws")
      .map(({ id, text }) => ({ id, value: judgedLater(text) })),
  );

  return Rows.add(spaced, MathmlCbytes, [{ id: cbytes, value: judgedLater(value) }]);
};

describe("mathmlGuards on m:cbytes", () => {
  it.effect("accepts a value that is the node's text with its whitespace removed", () =>
    Effect.gen(function* copied() {
      yield* mathmlGuards(cbytesRows("AQIDAQID", ["AQID AQID"]));
      yield* mathmlGuards(cbytesRows("AQIDAQID", [" AQID", "\n\t", "AQID\r\n"]));
    }),
  );

  it.effect("refuses a value that is not a copy of the text as text-copy", () =>
    Effect.gen(function* notCopied() {
      const error = yield* Effect.flip(mathmlGuards(cbytesRows("AQID", ["AQID AQID"])));
      assert.strictEqual(error._tag, "ImportRefused");
      assert.strictEqual(error.rule, "text-copy");
    }),
  );
});
