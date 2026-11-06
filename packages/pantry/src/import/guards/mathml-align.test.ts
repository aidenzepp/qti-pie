import { assert, describe, it } from "@effect/vitest";
import type { Fact } from "@bjornpagen/grizzle";

import { alignFinding } from "#pantry/import/guards/mathml-align.ts";
import { Rows } from "#pantry/import/tree.ts";
import { MathmlDir, MathmlSelection } from "#pantry/schema/mathml/attributes.ts";
import { MathmlSelectionValue } from "#pantry/schema/contracts.ts";
import { Edge, Node } from "#pantry/schema/node.ts";

/**
 * A uuid for hand-built rows, numbered.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as const;

const tree = id(1);

/**
 * A tree under construction: one element, with the children it holds and the attributes it carries.
 */
interface Spec {
  readonly children?: readonly Spec[];
  readonly dir?: "ltr" | "rtl";
  readonly kind: Fact<typeof Node>["kind"];
  readonly selection?: "1" | "2";
}

/**
 * The rows of a tree of specs, numbered in document order from the root.
 *
 * @param root - The root element.
 * @returns The `Node`, `Edge`, `MathmlDir` and `MathmlSelection` rows.
 */
const rowsOf = (root: Spec): Rows => {
  const nodes: Fact<typeof Node>[] = [];
  const edges: Fact<typeof Edge>[] = [];
  const dirs: Fact<typeof MathmlDir>[] = [];
  const selections: Fact<typeof MathmlSelection>[] = [];
  let next = 10;
  const walk = (
    spec: Spec,
    parent?: { readonly id: ReturnType<typeof id>; readonly kind: Spec["kind"] },
  ) => {
    const own = id(next);
    next += 1;
    nodes.push({
      ancestry: "root",
      id: own,
      kind: spec.kind,
      prefix: "",
      rootKind: "item",
      tree,
      version: "3.0.1",
    });
    if (parent !== undefined) {
      edges.push({
        child: own,
        childAncestry: "root",
        childKind: spec.kind,
        parent: parent.id,
        parentAncestry: "root",
        parentKind: parent.kind,
        position: BigInt(edges.filter((edge) => edge.parent === parent.id).length),
        tree,
        version: "3.0.1",
      });
    }

    if (spec.dir !== undefined) {
      dirs.push({ attribute: "dir", kind: spec.kind, node: own, value: spec.dir });
    }

    if (spec.selection !== undefined) {
      selections.push({
        attribute: "selection",
        kind: spec.kind,
        node: own,
        value: MathmlSelectionValue(spec.selection),
      });
    }

    for (const child of spec.children ?? []) {
      walk(child, { id: own, kind: spec.kind });
    }
  };
  walk(root);

  return Rows.add(
    Rows.add(Rows.add(Rows.add(Rows.empty(), Node, nodes), Edge, edges), MathmlDir, dirs),
    MathmlSelection,
    selections,
  );
};

const group: Spec = { kind: "m:maligngroup" };

const mi: Spec = { kind: "m:mi" };

/**
 * A table cell holding `children`.
 */
const cell = (...children: readonly Spec[]): Spec => ({ children, kind: "m:mtd" });

/**
 * A row of MathML elements, `kind` defaulting to `m:mrow`.
 */
const wrap = (kind: Spec["kind"], ...children: readonly Spec[]): Spec => ({ children, kind });

describe("alignFinding placement (P11)", () => {
  it("refuses a group under an m:mfrac inside a cell (probe 31)", () => {
    const found = alignFinding(rowsOf(cell(wrap("m:mfrac", wrap("m:mrow", group, mi), mi))));
    assert.strictEqual(found?.rule, "admission");
  });

  it("passes a group first in an m:mrow inside a cell", () => {
    assert.isUndefined(alignFinding(rowsOf(cell(wrap("m:mrow", group, mi)))));
  });

  it("refuses a group under an m:mstyle that carries a dir", () => {
    const styled: Spec = { children: [group, mi], dir: "rtl", kind: "m:mstyle" };
    assert.strictEqual(alignFinding(rowsOf(cell(styled)))?.rule, "admission");
    assert.isUndefined(alignFinding(rowsOf(cell(wrap("m:mstyle", group, mi)))));
  });

  it("passes a group through m:mphantom, m:mfenced and m:semantics", () => {
    for (const kind of ["m:mphantom", "m:mfenced", "m:semantics"] as const) {
      assert.isUndefined(alignFinding(rowsOf(cell(wrap(kind, group, mi)))), kind);
    }
  });

  it("passes a group only through the selected child of an m:maction", () => {
    const children = [wrap("m:mrow", group, mi), wrap("m:mrow", mi)];
    assert.isUndefined(alignFinding(rowsOf(cell(wrap("m:maction", ...children)))));
    assert.isUndefined(alignFinding(rowsOf(cell({ children, kind: "m:maction", selection: "1" }))));
    assert.strictEqual(
      alignFinding(rowsOf(cell({ children, kind: "m:maction", selection: "2" })))?.rule,
      "admission",
    );
  });

  it("does not judge a group outside any cell", () => {
    assert.isUndefined(alignFinding(rowsOf(wrap("m:mfrac", wrap("m:mrow", group, mi), mi))));
  });

  it("judges a group against the nearest cell", () => {
    const inner = wrap("m:mtable", wrap("m:mtr", cell(group, mi)));
    assert.isUndefined(alignFinding(rowsOf(cell(mi, inner))));
  });
});

describe("alignFinding order (P12)", () => {
  it("refuses a cell with a group after an m:mi (probe 32)", () => {
    assert.strictEqual(alignFinding(rowsOf(cell(mi, group, mi)))?.rule, "ordering");
  });

  it("passes a cell whose first element is a group", () => {
    assert.isUndefined(alignFinding(rowsOf(cell(wrap("m:mrow", group, mi)))));
    assert.isUndefined(alignFinding(rowsOf(cell(group, mi))));
  });

  it("passes a cell that holds no group", () => {
    assert.isUndefined(alignFinding(rowsOf(cell(mi, mi))));
    assert.isUndefined(alignFinding(Rows.empty()));
  });

  it("refuses a cell whose first element sits in an earlier branch", () => {
    assert.strictEqual(
      alignFinding(rowsOf(cell(wrap("m:mrow", mi), wrap("m:mrow", group, mi))))?.rule,
      "ordering",
    );
  });
});
