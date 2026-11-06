import type { Fact, Uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";

import { absorbedFinding } from "#pantry/import/guards/absorbed.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import type { Flag } from "#pantry/schema/seed/ancestry.ts";
import { ancestryHandles, handleOf, KindEnters, stepOf } from "#pantry/schema/seed/ancestry.ts";

type Kind = Fact<typeof Node>["kind"];

type Ancestry = Fact<typeof Node>["ancestry"];

/**
 * One element of a test tree: its kind and its children.
 */
interface Spec {
  readonly children: readonly Spec[];
  readonly kind: Kind;
}

const el = (kind: Kind, ...children: readonly Spec[]): Spec => ({ children, kind });

const tree: Uuid = "00000000-0000-4000-8000-000000000001";

/**
 * The ancestry handle of a flag set, as the `Ancestry` roster names it.
 *
 * @param flags - The flag set.
 * @returns The handle, `root` for none.
 */
const ancestryOf = (flags: readonly Flag[]): Ancestry => {
  const handle = ancestryHandles.find((held) => held === handleOf(flags));
  assert.isDefined(handle);

  return handle;
};

/**
 * The rows of a tree as the import stores it: each node's ancestry is the one the absorbing walk
 * computes, so every node beneath an `m:math` sits at `math`.
 *
 * @param root - The tree's root element.
 * @returns The `Node` and `Edge` rows, in document order.
 */
const rowsOf = (root: Spec): Rows => {
  const nodes: Fact<typeof Node>[] = [];
  const edges: Fact<typeof Edge>[] = [];
  const add = (spec: Spec, parent: Fact<typeof Node> | undefined, at: readonly Flag[]): void => {
    const { children, kind } = spec;
    const id: Uuid = `00000000-0000-4000-8000-${String(nodes.length + 2).padStart(12, "0")}`;
    const node: Fact<typeof Node> = {
      ancestry: ancestryOf(at),
      id,
      kind,
      prefix: "",
      rootKind: "item",
      tree,
      version: "3.0.1",
    };
    nodes.push(node);
    if (parent !== undefined) {
      edges.push({
        child: node.id,
        childAncestry: node.ancestry,
        childKind: kind,
        parent: parent.id,
        parentAncestry: parent.ancestry,
        parentKind: parent.kind,
        position: BigInt(nodes.length),
        tree,
        version: "3.0.1",
      });
    }

    const inner = stepOf(at, kind, KindEnters);
    for (const child of children) {
      add(child, node, inner);
    }
  };
  add(root, undefined, []);

  return Rows.add(Rows.add(Rows.empty(), Node, nodes), Edge, edges);
};

/**
 * A formula whose `m:semantics` holds an `m:mi` and an `m:annotation-xml` of `annotation`.
 *
 * @param annotation - What the annotation holds.
 * @returns The formula.
 */
const formula = (...annotation: readonly Spec[]): Spec =>
  el("m:math", el("m:semantics", el("m:mi"), el("m:annotation-xml", ...annotation)));

const refusal = (root: Spec): ImportRefused => {
  const finding = absorbedFinding(rowsOf(root), "math");
  assert.instanceOf(finding, ImportRefused);
  assert.strictEqual(finding.rule, "ancestry-ban");

  return finding;
};

const body = (...content: readonly Spec[]): Spec => el("qti-item-body", ...content);

describe("absorbedFinding", () => {
  it("refuses an interaction in the annotation of a formula in a prompt (example A)", () => {
    const finding = refusal(
      body(
        el(
          "qti-choice-interaction",
          el("qti-prompt", formula(el("div", el("qti-text-entry-interaction")))),
        ),
      ),
    );

    assert.include(finding.detail, "qti-text-entry-interaction");
  });

  it("passes a qti-gap in the annotation of a formula in a gap-match interaction (example B)", () => {
    const rows = rowsOf(
      body(el("qti-gap-match-interaction", el("p", formula(el("div", el("p", el("qti-gap"))))))),
    );

    assert.isUndefined(absorbedFinding(rows, "math"));
  });

  it("refuses a formula in the annotation of a formula, at the inner formula", () => {
    const finding = refusal(body(el("p", formula(el("div", el("m:math", el("m:mi")))))));

    assert.include(finding.detail, "m:math");
  });

  it("refuses a qti-gap in an annotation with no gap-match interaction around it", () => {
    const finding = refusal(body(el("p", formula(el("div", el("p", el("qti-gap")))))));

    assert.include(finding.detail, "qti-gap");
  });

  it("passes a qti-gap in a gap-match interaction inside the annotation", () => {
    const rows = rowsOf(
      body(el("p", formula(el("div", el("qti-gap-match-interaction", el("p", el("qti-gap"))))))),
    );

    assert.isUndefined(absorbedFinding(rows, "math"));
  });

  it("passes a printed variable and a choice interaction in an annotation at the item body", () => {
    const rows = rowsOf(
      body(
        el("p", formula(el("div", el("qti-printed-variable")))),
        el("p", formula(el("div", el("qti-choice-interaction")))),
      ),
    );

    assert.isUndefined(absorbedFinding(rows, "math"));
  });

  it("passes a foreign element holding a prompt", () => {
    const rows = rowsOf(body(el("p", formula(el("foreign", el("foreign"))))));

    assert.isUndefined(absorbedFinding(rows, "math"));
  });

  it("names the first banned node in document order", () => {
    const finding = refusal(
      body(
        el(
          "qti-choice-interaction",
          el(
            "qti-prompt",
            formula(
              el("div", el("qti-text-entry-interaction"), el("qti-extended-text-interaction")),
            ),
          ),
        ),
      ),
    );

    assert.include(finding.detail, "qti-text-entry-interaction");
  });
});
