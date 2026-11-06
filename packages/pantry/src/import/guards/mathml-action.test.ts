import { assert, describe, it } from "@effect/vitest";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";

import { actionFinding } from "#pantry/import/guards/mathml-action.ts";
import { Rows } from "#pantry/import/tree.ts";
import { EmbedSourceUri, MathmlSelectionValue } from "#pantry/schema/contracts.ts";
import {
  MathmlEmbedSource,
  MathmlSelection,
  MathmlString,
} from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node } from "#pantry/schema/node.ts";

/**
 * A uuid for hand-built rows, numbered.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as const;

type Id = ReturnType<typeof id>;

const tree = id(1);

const version = "3.0.1" as const;

/**
 * The attributes a hand-built node carries, the ones the guard reads.
 */
interface Attributes {
  readonly alt?: string;
  readonly selection?: Parameters<typeof MathmlSelectionValue>[0];
  readonly src?: string;
}

/**
 * One node of a hand-built tree: its number, kind and children, with the attributes it carries.
 */
interface Spec {
  readonly attributes?: Attributes;
  readonly children?: readonly Spec[];
  readonly kind: Fact<typeof Node>["kind"];
}

const el = (
  kind: Spec["kind"],
  attributes: Attributes = {},
  ...children: readonly Spec[]
): Spec => ({ attributes, children, kind });

/**
 * The rows of a tree built from `root`: its nodes and edges, and the attribute rows of the families
 * `m:maction/@selection`, `m:mglyph/@src` and `m:mglyph/@alt` live in. Nodes are numbered in
 * document order, the root first, from 10.
 */
const rowsOf = (root: Spec): Rows => {
  const nodes: Fact<typeof Node>[] = [];
  const edges: Fact<typeof Edge>[] = [];
  const selection: Fact<typeof MathmlSelection>[] = [];
  const source: Fact<typeof MathmlEmbedSource>[] = [];
  const alt: Fact<typeof MathmlString>[] = [];
  let next = 10;
  const walk = (spec: Spec, parent?: { id: Id; kind: Spec["kind"] }, position = 0): void => {
    const nodeId = id(next);
    next += 1;
    nodes.push({
      ancestry: "root",
      id: nodeId,
      kind: spec.kind,
      prefix: "",
      rootKind: "item",
      tree,
      version,
    });
    if (parent !== undefined) {
      edges.push({
        child: nodeId,
        childAncestry: "root",
        childKind: spec.kind,
        parent: parent.id,
        parentAncestry: "root",
        parentKind: parent.kind,
        position: BigInt(position),
        tree,
        version,
      });
    }

    const { alt: altText, selection: chosen, src } = spec.attributes ?? {};
    if (chosen !== undefined) {
      selection.push({
        attribute: "selection",
        kind: spec.kind,
        node: nodeId,
        value: MathmlSelectionValue(chosen),
      });
    }

    if (src !== undefined) {
      source.push({ attribute: "src", kind: spec.kind, node: nodeId, value: EmbedSourceUri(src) });
    }

    if (altText !== undefined) {
      alt.push({ attribute: "alt", kind: spec.kind, node: nodeId, value: altText });
    }

    for (const [index, child] of (spec.children ?? []).entries()) {
      walk(child, { id: nodeId, kind: spec.kind }, index);
    }
  };
  walk(root);

  const pairs: readonly (readonly [AnyRelation, readonly object[]])[] = [
    [Node, nodes],
    [Edge, edges],
    [MathmlSelection, selection],
    [MathmlEmbedSource, source],
    [MathmlString, alt],
  ];

  return new Map(pairs);
};

const math = (...children: readonly Spec[]): Spec => el("m:math", {}, ...children);

describe("actionFinding, maction's selection (P13)", () => {
  it("refuses a selection past the last child as union-count", () => {
    const rows = rowsOf(math(el("m:maction", { selection: "3" }, el("m:mi"), el("m:mn"))));
    assert.strictEqual(actionFinding(rows)?.rule, "union-count");
  });

  it("passes a selection that names the last child", () => {
    const rows = rowsOf(math(el("m:maction", { selection: "2" }, el("m:mi"), el("m:mn"))));
    assert.isUndefined(actionFinding(rows));
  });

  it("passes a selection that names the first child", () => {
    const rows = rowsOf(math(el("m:maction", { selection: "1" }, el("m:mi"), el("m:mn"))));
    assert.isUndefined(actionFinding(rows));
  });

  it("passes an maction that writes no selection", () => {
    const rows = rowsOf(math(el("m:maction", {}, el("m:mi"))));
    assert.isUndefined(actionFinding(rows));
  });

  it("refuses a selection of zero or a count past what a Number holds", () => {
    const zero = rowsOf(math(el("m:maction", { selection: "0" }, el("m:mi"))));
    assert.strictEqual(actionFinding(zero)?.rule, "union-count");

    const huge = rowsOf(
      math(el("m:maction", { selection: "9007199254740993" }, el("m:mi"), el("m:mn"))),
    );
    assert.strictEqual(actionFinding(huge)?.rule, "union-count");
  });

  it("reads leading zeros as the integer they spell", () => {
    const rows = rowsOf(math(el("m:maction", { selection: "002" }, el("m:mi"), el("m:mn"))));
    assert.isUndefined(actionFinding(rows));
  });

  it("counts element children only, never text", () => {
    const rows = rowsOf(
      math(el("m:maction", { selection: "2" }, el("m:mi"), el("text"), el("ws"))),
    );
    assert.strictEqual(actionFinding(rows)?.rule, "union-count");
  });
});

describe("actionFinding, mglyph's attributes (P14)", () => {
  it("refuses an mglyph with neither src nor alt as required-attribute", () => {
    const rows = rowsOf(math(el("m:mi", {}, el("m:mglyph"))));
    assert.strictEqual(actionFinding(rows)?.rule, "required-attribute");
  });

  it("refuses an mglyph with only src", () => {
    const rows = rowsOf(math(el("m:mi", {}, el("m:mglyph", { src: "g.png" }))));
    assert.strictEqual(actionFinding(rows)?.rule, "required-attribute");
  });

  it("refuses an mglyph with only alt", () => {
    const rows = rowsOf(math(el("m:mi", {}, el("m:mglyph", { alt: "g" }))));
    assert.strictEqual(actionFinding(rows)?.rule, "required-attribute");
  });

  it("passes an mglyph with src and alt", () => {
    const rows = rowsOf(math(el("m:mi", {}, el("m:mglyph", { alt: "g", src: "g.png" }))));
    assert.isUndefined(actionFinding(rows));
  });
});

describe("actionFinding, condition's bvar (C6)", () => {
  it("refuses a condition with no bvar before it as union-count", () => {
    const rows = rowsOf(math(el("m:apply", {}, el("m:sum"), el("m:condition"), el("m:ci"))));
    assert.strictEqual(actionFinding(rows)?.rule, "union-count");
  });

  it("passes a condition that follows a bvar", () => {
    const rows = rowsOf(
      math(el("m:apply", {}, el("m:sum"), el("m:bvar"), el("m:condition"), el("m:ci"))),
    );
    assert.isUndefined(actionFinding(rows));
  });

  it("refuses a condition that comes before the bvar", () => {
    const rows = rowsOf(
      math(el("m:apply", {}, el("m:sum"), el("m:condition"), el("m:bvar"), el("m:ci"))),
    );
    assert.strictEqual(actionFinding(rows)?.rule, "union-count");
  });

  it("checks a condition in an m:bind the same way", () => {
    const bad = rowsOf(math(el("m:bind", {}, el("m:forall"), el("m:condition"), el("m:ci"))));
    assert.strictEqual(actionFinding(bad)?.rule, "union-count");

    const good = rowsOf(
      math(el("m:bind", {}, el("m:forall"), el("m:bvar"), el("m:condition"), el("m:ci"))),
    );
    assert.isUndefined(actionFinding(good));
  });
});

describe("actionFinding, document order", () => {
  it("names the first failing node", () => {
    const rows = rowsOf(
      math(el("m:mi", {}, el("m:mglyph")), el("m:maction", { selection: "5" }, el("m:mi"))),
    );
    assert.strictEqual(actionFinding(rows)?.rule, "required-attribute");
  });

  it("accepts rows that hold no node", () => {
    assert.isUndefined(actionFinding(Rows.empty()));
  });
});
