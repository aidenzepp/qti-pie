import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as leaf from "#qti/schema/ancestry.ts";
import * as node from "#qti/schema/node.ts";
import * as asi from "#qti/schema/kinds/asi.ts";
import * as cp from "#qti/schema/kinds/cp.ts";
import * as generic from "#qti/schema/kinds/generic.ts";
import * as html from "#qti/schema/kinds/html.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
import * as qmd from "#qti/schema/kinds/qmd.ts";
import {
  ancestryHandles,
  banned,
  ancestryStepRows,
  fbFlagged,
  FLAGS,
  handleOf,
  KindEnters,
  reachable,
} from "#qti/schema/seed/ancestry.ts";

/**
 * The Admission rows of every kinds file. `seed/admission.ts` composes the same rows but ranks them
 * by `NodeKind`, which holds no M1 handle until `p2-06` lands, so this slice reads the files; the
 * composed re-derivation is `qti.test.ts`'s (V19).
 */
const admission = [
  ...generic.admission,
  ...asi.admission,
  ...html.admission,
  ...cp.admission,
  ...lom.admission,
  ...qmd.admission,
];

const kinds = [...new Set(admission.flatMap((row) => [row.parent, row.child]))];

const rows = ancestryStepRows(kinds, KindEnters);

const nextOf = (ancestry: string, kind: string): string | undefined =>
  rows.find((row) => row.ancestry === ancestry && row.kind === kind)?.next;

describe("seed/ancestry", () => {
  it("names each reachable flag set in canonical order, under 64 handles", () => {
    for (const handle of [
      "root",
      "int",
      "int.choice",
      "int.gap",
      "int.htx",
      "htx",
      "fb",
      "fb.int",
      "fb.tmpl",
      "tmpl",
      "rubric",
      "modal",
    ]) {
      assert.include(ancestryHandles, handle);
    }
    assert.isBelow(ancestryHandles.length, 64);
    assert.strictEqual(new Set(ancestryHandles).size, ancestryHandles.length);
  });

  it("re-derives the roster over the composed Admission rows", () => {
    const closure = reachable(admission, KindEnters);
    assert.isAbove(closure.length, 0);
    assert.deepStrictEqual(closure.map(handleOf), [...ancestryHandles]);
  });

  it("has no row for a banned pair", () => {
    for (const [ancestry, kind] of [
      ["int", "qti-choice-interaction"],
      ["int.choice", "qti-text-entry-interaction"],
      ["root", "qti-gap"],
      ["rubric", "qti-rubric-block"],
      ["int.htx", "qti-hottext"],
      ["htx", "qti-text-entry-interaction"],
    ] as const) {
      const flags = FLAGS.filter((flag) => ancestry.split(".").includes(flag));
      assert.isTrue(banned(flags, kind), `${ancestry} ${kind} is banned`);
      assert.include(ancestryHandles, ancestry);
      assert.isUndefined(nextOf(ancestry, kind), `${ancestry} ${kind} has a row`);
    }
  });

  it("steps by the kind's entering flags", () => {
    assert.strictEqual(nextOf("root", "qti-choice-interaction"), "int");
    assert.strictEqual(nextOf("int", "qti-prompt"), "int.choice");
    assert.strictEqual(nextOf("int.choice", "qti-hottext"), "int.choice.htx");
    assert.strictEqual(nextOf("fb", "qti-choice-interaction"), "fb.int");
    assert.strictEqual(nextOf("root", "p"), "root");
  });

  it("gives a kind a later phase appends the identity row at every ancestry", () => {
    const appended = ancestryStepRows([...kinds, "qti-synthetic"], KindEnters).filter(
      (row) => row.kind === "qti-synthetic",
    );
    assert.isAbove(appended.length, 0);
    assert.deepStrictEqual(
      appended.map((row) => [row.ancestry, row.next]),
      ancestryHandles.map((handle) => [handle, handle]),
    );
  });

  it("flags the feedback handles", () => {
    assert.include(fbFlagged, "fb");
    assert.include(fbFlagged, "fb.int");
    assert.notInclude(fbFlagged, "int");
  });

  it("holds a next that is itself an ancestry handle on every row", () => {
    assert.isAbove(rows.length, 0);
    for (const row of rows) {
      assert.include(ancestryHandles, row.next);
      assert.include(ancestryHandles, row.ancestry);
    }
  });

  it("declares the Ancestry roster over the 56 handles, and the three columns that name it", () => {
    assert.deepStrictEqual([...node.Ancestry.handles], [...ancestryHandles]);
    assert.strictEqual(node.Ancestry.handles.length, 56);
    assert.strictEqual(node.Node.fields.ancestry.roster.name, "Ancestry");
    assert.strictEqual(node.Edge.fields.parentAncestry.roster.name, "Ancestry");
    assert.strictEqual(node.Edge.fields.childAncestry.roster.name, "Ancestry");
  });

  it("keys AncestryStep by ancestry and kind, both closed over their rosters", () => {
    const step = leaf.relations.AncestryStep;
    assert.deepStrictEqual([...step.primaryKey], ["ancestry", "kind"]);
    assert.strictEqual(step.fields.next.roster.name, "Ancestry");
    assert.strictEqual(step.fields.kind.roster.name, "NodeKind");
    assert.deepStrictEqual(leaf.arms, {});
  });

  it("holds the per-node ban with source Node and the step with source Edge, both into AncestryStep", () => {
    const contained = leaf.rules.filter((rule) => rule.kind === "contained");
    const fields = (relation: typeof node.Node | typeof node.Edge) =>
      contained
        .filter((rule) => rule.left.source === relation)
        .map((rule) => [[...rule.left.fields], [...rule.right.fields]]);

    for (const rule of contained) {
      assert.strictEqual(rule.right.source, leaf.relations.AncestryStep);
    }

    assert.deepStrictEqual(fields(node.Node), [
      [
        ["ancestry", "kind"],
        ["ancestry", "kind"],
      ],
    ]);
    assert.deepStrictEqual(fields(node.Edge), [
      [
        ["parentAncestry", "parentKind", "childAncestry"],
        ["ancestry", "kind", "next"],
      ],
    ]);
    assert.strictEqual(leaf.rules.length, 2);
  });

  it("builds a probe schema over the node and ancestry relations and both rule lists", () => {
    const probe = schema("QtiAncestryProbe", { ...node.relations, ...leaf.relations }, [
      ...node.rules,
      ...leaf.rules,
    ]);
    assert.strictEqual(probe.statements.length, node.rules.length + leaf.rules.length);
    assert.include(Object.keys(probe.relations), "AncestryStep");
    assert.include(Object.keys(probe.relations), "Ancestry");
  });
});
