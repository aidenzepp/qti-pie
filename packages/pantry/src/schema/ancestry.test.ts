import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as leaf from "#pantry/schema/ancestry.ts";
import * as node from "#pantry/schema/node.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as mathml from "#pantry/schema/kinds/mathml.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import type { Flag, KindEnterTable } from "#pantry/schema/seed/ancestry.ts";
import {
  absorbing,
  ancestryHandles,
  banned,
  ancestryStepRows,
  fbFlagged,
  FLAGS,
  handleOf,
  interactionKinds,
  KindEnters,
  reachable,
  stepOf,
} from "#pantry/schema/seed/ancestry.ts";

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
  ...mathml.admission,
  ...qmd.admission,
  ...test.admission,
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
      "math",
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

  it("bans at a testfb set every interaction, template and rubric block, and admits the printed variable and inline feedback", () => {
    const flags = ["testfb"] as const;
    for (const kind of [
      ...interactionKinds,
      "qti-template-block",
      "qti-template-block.rubric",
      "qti-template-inline",
      "qti-template-inline.rubric",
      "qti-rubric-block",
      "qti-rubric-block.test",
    ]) {
      assert.isTrue(banned([...flags], kind), `testfb ${kind} is banned`);
    }

    for (const kind of ["qti-printed-variable", "qti-feedback-inline", "p"]) {
      assert.isFalse(banned([...flags], kind), `testfb ${kind} is admitted`);
    }

    for (const kind of ["qti-rubric-block.test", "qti-test-feedback"]) {
      assert.deepStrictEqual(KindEnters[kind], ["testfb"]);
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

  it("steps by the union where no absorbing flag is held or entered", () => {
    assert.deepStrictEqual(stepOf(["fb"], "qti-choice-interaction", KindEnters), ["fb", "int"]);
    assert.deepStrictEqual(stepOf(["int"], "qti-prompt", KindEnters), ["int", "choice"]);
    assert.deepStrictEqual(stepOf([], "p", KindEnters), []);
  });

  describe("an absorbing flag", () => {
    // A test-local absorbing `tmpl` over the real flags: a kind that enters it, or a set that holds
    // it, hands its children `tmpl` and nothing else.
    const enters: KindEnterTable = { ...KindEnters, "qti-absorber": ["tmpl"] };
    const absorbs: readonly Flag[] = ["tmpl"];

    it("is the only flag handed on by a kind that enters it, whatever else the kind enters", () => {
      assert.deepStrictEqual(
        stepOf(
          ["fb", "int"],
          "qti-absorber",
          { ...enters, "qti-absorber": ["tmpl", "htx"] },
          absorbs,
        ),
        ["tmpl"],
      );
      assert.deepStrictEqual(stepOf([], "qti-absorber", enters, absorbs), ["tmpl"]);
    });

    it("stays the only flag beneath it, a kind that enters another flag included", () => {
      assert.deepStrictEqual(stepOf(["tmpl"], "qti-choice-interaction", enters, absorbs), ["tmpl"]);
      assert.deepStrictEqual(stepOf(["tmpl"], "qti-prompt", enters, absorbs), ["tmpl"]);
      assert.deepStrictEqual(stepOf(["tmpl"], "p", enters, absorbs), ["tmpl"]);
    });

    it("keeps the union where no absorbing flag is held or entered", () => {
      assert.deepStrictEqual(stepOf(["fb"], "qti-choice-interaction", enters, absorbs), [
        "fb",
        "int",
      ]);
      assert.deepStrictEqual(stepOf([], "p", enters, absorbs), []);
    });

    it("lets the first absorbing flag in order win, held or entered", () => {
      const order: readonly Flag[] = ["tmpl", "modal"];
      const both: KindEnterTable = { ...enters, "qti-absorber": ["tmpl"], "qti-other": ["modal"] };
      // Both entered: the first in `order`, not in `FLAGS` order (`modal` precedes `tmpl` there).
      assert.deepStrictEqual(
        stepOf([], "qti-absorber", { ...both, "qti-absorber": ["modal", "tmpl"] }, order),
        ["tmpl"],
      );
      // One held, the other entered: the held one still wins when it is first in `order`.
      assert.deepStrictEqual(stepOf(["tmpl"], "qti-other", both, order), ["tmpl"]);
      // The first in order is entered, the later one held: the entered one wins.
      assert.deepStrictEqual(stepOf(["modal"], "qti-absorber", both, order), ["tmpl"]);
      // Reversed order flips the winner.
      assert.deepStrictEqual(stepOf(["tmpl"], "qti-other", both, ["modal", "tmpl"]), ["modal"]);
    });
  });

  describe("the math flag", () => {
    it("is entered by m:math alone, and by no qti kind", () => {
      assert.deepStrictEqual(KindEnters["m:math"], ["math"]);
      assert.isUndefined(KindEnters["m:annotation-xml"]);
      assert.deepStrictEqual(
        Object.entries(KindEnters)
          .filter(([, entered]) => entered.includes("math"))
          .map(([kind]) => kind),
        ["m:math"],
      );
    });

    it("is absorbing, so m:math hands {math} from any set", () => {
      assert.deepStrictEqual([...absorbing], ["math"]);
      assert.deepStrictEqual(stepOf([], "m:math", KindEnters), ["math"]);
      assert.deepStrictEqual(stepOf(["fb", "int"], "m:math", KindEnters), ["math"]);
      assert.deepStrictEqual(stepOf(["math"], "m:math", KindEnters), ["math"]);
    });

    it("keeps {math} beneath every kind at a math set, a flag-entering kind included", () => {
      assert.deepStrictEqual(stepOf(["math"], "qti-choice-interaction", KindEnters), ["math"]);
      assert.deepStrictEqual(stepOf(["math"], "qti-prompt", KindEnters), ["math"]);
      assert.deepStrictEqual(stepOf(["math"], "m:annotation-xml", KindEnters), ["math"]);
      assert.deepStrictEqual(stepOf(["math"], "p", KindEnters), ["math"]);
      assert.strictEqual(nextOf("math", "qti-choice-interaction"), "math");
    });

    it("leaves m:annotation-xml outside a math element entering nothing", () => {
      assert.deepStrictEqual(stepOf([], "m:annotation-xml", KindEnters), []);
      assert.strictEqual(nextOf("root", "m:annotation-xml"), "root");
    });

    it("bans m:math at a math set and no qti kind", () => {
      assert.isTrue(banned(["math"], "m:math"));
      assert.isFalse(banned([], "m:math"));
      for (const kind of ["qti-printed-variable", "qti-choice-interaction", "qti-gap"]) {
        assert.isFalse(banned(["math"], kind), `math ${kind} is admitted`);
      }
      assert.isTrue(banned([], "qti-gap"));
      assert.isUndefined(nextOf("math", "m:math"));
    });

    it("reaches a ban at m:math > m:semantics > m:annotation-xml > div > m:math", () => {
      let flags: readonly Flag[] = [];
      for (const kind of ["m:math", "m:semantics", "m:annotation-xml", "div"]) {
        assert.isFalse(banned(flags, kind), `${handleOf(flags)} ${kind} is admitted`);
        flags = stepOf(flags, kind, KindEnters);
      }
      assert.strictEqual(handleOf(flags), "math");
      assert.isTrue(banned(flags, "m:math"));
    });
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

  it("declares the Ancestry roster over the 61 handles, and the three columns that name it", () => {
    assert.deepStrictEqual([...node.Ancestry.handles], [...ancestryHandles]);
    assert.strictEqual(node.Ancestry.handles.length, 61);
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
