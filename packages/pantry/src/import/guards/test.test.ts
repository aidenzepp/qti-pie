import { assert, describe, it } from "@effect/vitest";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { TestGuardRefusal, testGuards } from "#pantry/import/guards/test.ts";
import type { Rows } from "#pantry/import/tree.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { Edge, Node, TreeRoot } from "#pantry/schema/node.ts";
import { ItemInstanceSpelling, ItemInstanceVariableRef } from "#pantry/schema/processing.ts";
import { Selection } from "#pantry/schema/test/control.ts";
import { BranchRule, BranchRuleTarget } from "#pantry/schema/test/rules.ts";
import { AssessmentSection, TestIdentifier } from "#pantry/schema/test/structure.ts";

/**
 * A uuid for hand-built rows, numbered.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as const;

type Id = ReturnType<typeof id>;

const pkg = id(1);

const version = "3.0.1" as const;

/**
 * The test document's tree is its root node's id, as every document's is.
 */
const T = id(10);

const P1 = id(11);

const S1 = id(12);

const I1 = id(13);

const I2 = id(14);

const I3 = id(15);

const P2 = id(16);

const S2 = id(17);

const I4 = id(18);

/**
 * The section document, whose root section is the node `D`.
 */
const D = id(30);

const refNode = id(40);

const nodeRow = (nodeId: Id, kind: Fact<typeof Node>["kind"], tree: Id) => ({
  ancestry: "root" as const,
  id: nodeId,
  kind,
  prefix: "",
  rootKind: "test" as const,
  tree,
  version,
});

const edgeRow = (
  child: Id,
  childKind: Fact<typeof Edge>["childKind"],
  parent: Id,
  parentKind: Fact<typeof Edge>["parentKind"],
  position: number,
  tree: Id,
) => ({
  child,
  childAncestry: "root" as const,
  childKind,
  parent,
  parentAncestry: "root" as const,
  parentKind,
  position: BigInt(position),
  tree,
  version,
});

const holder = (
  holderId: Id,
  holderKind: Fact<typeof TestIdentifier>["holderKind"],
  identifier: string,
  scope: Id,
) => ({ holder: holderId, holderKind, identifier, scope });

const documentRow = (docId: Id, root: "section" | "test") => ({
  id: docId,
  package: pkg,
  path: `${root}/${docId}.xml`,
  resource: docId,
  resourceType: `imsqti_${root}_xmlv3p0`,
  root,
  version,
});

/**
 * A rule `ruleId` on `owner`, in `docId`, that targets `identifier`, a holder of `holderKind`.
 */
const branch = (
  ruleId: Id,
  docId: Id,
  owner: Id,
  ownerKind: Fact<typeof BranchRule>["ownerKind"],
  identifier: string,
  holderKind: Fact<typeof BranchRuleTarget>["holderKind"],
) => ({
  rule: {
    document: docId,
    id: ruleId,
    owner,
    ownerKind,
    targetKind: "ref" as const,
  },
  target: { holderKind, identifier, ownerKind, rule: ruleId, scope: docId },
});

/**
 * The structure of one test document: the test T, its parts P1 and P2, section S1 under P1 holding
 * item refs I1, I2 and I3, and section S2 under P2 holding I4. `withReplacement` is S1's.
 */
const structure = (
  rules: readonly ReturnType<typeof branch>[],
  withReplacement: "false" | "true" | "1" = "false",
): Rows => {
  const pairs: readonly (readonly [AnyRelation, readonly object[]])[] = [
    [Document, [documentRow(T, "test")]],
    [
      Node,
      [
        nodeRow(T, "qti-assessment-test", T),
        nodeRow(P1, "qti-test-part", T),
        nodeRow(S1, "qti-assessment-section", T),
        nodeRow(I1, "qti-assessment-item-ref", T),
        nodeRow(I2, "qti-assessment-item-ref", T),
        nodeRow(I3, "qti-assessment-item-ref", T),
        nodeRow(P2, "qti-test-part", T),
        nodeRow(S2, "qti-assessment-section", T),
        nodeRow(I4, "qti-assessment-item-ref", T),
      ],
    ],
    [
      Edge,
      [
        edgeRow(P1, "qti-test-part", T, "qti-assessment-test", 0, T),
        edgeRow(P2, "qti-test-part", T, "qti-assessment-test", 1, T),
        edgeRow(S1, "qti-assessment-section", P1, "qti-test-part", 0, T),
        edgeRow(I1, "qti-assessment-item-ref", S1, "qti-assessment-section", 0, T),
        edgeRow(I2, "qti-assessment-item-ref", S1, "qti-assessment-section", 1, T),
        edgeRow(I3, "qti-assessment-item-ref", S1, "qti-assessment-section", 2, T),
        edgeRow(S2, "qti-assessment-section", P2, "qti-test-part", 0, T),
        edgeRow(I4, "qti-assessment-item-ref", S2, "qti-assessment-section", 0, T),
      ],
    ],
    [
      TestIdentifier,
      [
        holder(P1, "part", "PART1", T),
        holder(S1, "section", "SEC1", T),
        holder(I1, "itemRef", "ITEM1", T),
        holder(I2, "itemRef", "ITEM2", T),
        holder(I3, "itemRef", "ITEM3", T),
        holder(P2, "part", "PART2", T),
        holder(S2, "section", "SEC2", T),
        holder(I4, "itemRef", "ITEM4", T),
      ],
    ],
    [Selection, [{ id: id(50), section: S1, select: 1n, withReplacement }]],
    [BranchRule, rules.map((row) => row.rule)],
    [BranchRuleTarget, rules.map((row) => row.target)],
  ];

  return new Map(pairs);
};

/**
 * A section document whose root section holds `identifier` and `title`, and whose document holds
 * `documentIdentifier` and `documentTitle`.
 */
const sectionDocument = (
  identifier: string,
  title: string,
  documentIdentifier: string,
  documentTitle: string,
): Rows => {
  const copy = {
    document: D,
    package: pkg,
    resource: D,
    root: "section" as const,
  };
  const pairs: readonly (readonly [AnyRelation, readonly object[]])[] = [
    [Document, [documentRow(D, "section")]],
    [Node, [nodeRow(D, "qti-assessment-section", D)]],
    [TreeRoot, [{ node: D, tree: D }]],
    [
      AssessmentSection,
      [
        {
          document: D,
          fixed: "false",
          id: D,
          identifier,
          keepTogether: "true",
          required: "false",
          title,
          visible: "true",
        },
      ],
    ],
    [DocumentIdentifier, [{ ...copy, value: documentIdentifier }]],
    [DocumentTitle, [{ ...copy, collapsed: documentTitle, value: documentTitle }]],
  ];

  return new Map(pairs);
};

/**
 * One instance reference `refNode` to instance `instance`, spelled `spelling`.
 */
const instanceRef = (instance: bigint, spelling: string): Rows => {
  const pairs: readonly (readonly [AnyRelation, readonly object[]])[] = [
    [
      ItemInstanceVariableRef,
      [{ document: T, id: refNode, instance, prefix: "ITEM1", root: "test", variable: "SCORE" }],
    ],
    [ItemInstanceSpelling, [{ ref: refNode, value: spelling }]],
  ];

  return new Map(pairs);
};

/**
 * A section document of two item refs `A` and `B`, with a rule on `owner` that targets
 * `identifier`.
 */
const sectionTree = (identifier: string, owner: Id, ownerKind: "itemRef" | "section") => {
  const rule = branch(id(60), D, owner, ownerKind, identifier, "itemRef");

  return new Map(sectionDocument("SEC", "A section", "SEC", "A section"))
    .set(Node, [
      nodeRow(D, "qti-assessment-section", D),
      nodeRow(I1, "qti-assessment-item-ref", D),
      nodeRow(I2, "qti-assessment-item-ref", D),
    ])
    .set(Edge, [
      edgeRow(I1, "qti-assessment-item-ref", D, "qti-assessment-section", 0, D),
      edgeRow(I2, "qti-assessment-item-ref", D, "qti-assessment-section", 1, D),
    ])
    .set(TestIdentifier, [holder(I1, "itemRef", "A", D), holder(I2, "itemRef", "B", D)])
    .set(BranchRule, [rule.rule])
    .set(BranchRuleTarget, [rule.target]);
};

const refused = (rows: Rows, rule: TestGuardRefusal["rule"]) =>
  Effect.gen(function* refusedUnder() {
    const failure = yield* Effect.flip(testGuards(rows));

    assert.instanceOf(failure, TestGuardRefusal);
    assert.strictEqual(failure.rule, rule);
  });

describe("testGuards", () => {
  it.effect("accepts no rows", () => testGuards(new Map()));

  describe("branch-forward", () => {
    it.effect("accepts a target later in the part", () =>
      testGuards(structure([branch(id(60), T, I1, "itemRef", "ITEM3", "itemRef")])),
    );

    it.effect("accepts a section rule that targets a later item ref of its part", () =>
      testGuards(structure([branch(id(60), T, S1, "section", "ITEM3", "itemRef")])),
    );

    it.effect("accepts a test part rule that targets a later part", () =>
      testGuards(structure([branch(id(60), T, P1, "part", "PART2", "part")])),
    );

    it.effect("refuses a target earlier in the part", () =>
      refused(structure([branch(id(60), T, I3, "itemRef", "ITEM1", "itemRef")]), "branch-forward"),
    );

    it.effect("refuses a rule that targets its own owner", () =>
      refused(structure([branch(id(60), T, I2, "itemRef", "ITEM2", "itemRef")]), "branch-forward"),
    );

    it.effect("refuses a test part rule that targets an earlier part", () =>
      refused(structure([branch(id(60), T, P2, "part", "PART1", "part")]), "branch-forward"),
    );

    it.effect("refuses a target in another part", () =>
      refused(structure([branch(id(60), T, I1, "itemRef", "ITEM4", "itemRef")]), "branch-forward"),
    );

    it.effect("refuses an item ref under a selection with replacement", () =>
      Effect.gen(function* replacement() {
        const rule = branch(id(60), T, I1, "itemRef", "ITEM3", "itemRef");
        yield* refused(structure([rule], "true"), "branch-forward");
        yield* refused(structure([rule], "1"), "branch-forward");
        yield* testGuards(structure([rule], "false"));
      }),
    );

    it.effect("accepts a section target under a selection with replacement", () =>
      testGuards(structure([branch(id(60), T, P1, "part", "SEC2", "section")], "true")),
    );

    it.effect("ignores a rule that has no target row", () => {
      const rows = structure([branch(id(60), T, I3, "itemRef", "ITEM1", "itemRef")]);

      return testGuards(new Map(rows).set(BranchRuleTarget, []));
    });

    it.effect("decides a section document's rule within the document", () =>
      Effect.gen(function* inDocument() {
        yield* testGuards(sectionTree("B", I1, "itemRef"));
        yield* refused(sectionTree("A", I2, "itemRef"), "branch-forward");
      }),
    );
  });

  describe("section-root-copy", () => {
    it.effect("accepts a root section that holds the document's identifier and title", () =>
      testGuards(sectionDocument("SEC", "A section", "SEC", "A section")),
    );

    it.effect("accepts a test document, whose root needs no tie", () => testGuards(structure([])));

    it.effect("refuses a root section whose identifier is not the document's", () =>
      refused(sectionDocument("SEC", "A section", "OTHER", "A section"), "section-root-copy"),
    );

    it.effect("refuses a root section whose title is not the document's", () =>
      refused(sectionDocument("SEC", "A section", "SEC", "Another"), "section-root-copy"),
    );

    it.effect("refuses a section document that has no root section arm", () =>
      refused(
        new Map(sectionDocument("SEC", "A section", "SEC", "A section")).set(AssessmentSection, []),
        "section-root-copy",
      ),
    );

    it.effect("refuses a section document without its identifier row", () =>
      refused(
        new Map(sectionDocument("SEC", "A section", "SEC", "A section")).set(
          DocumentIdentifier,
          [],
        ),
        "section-root-copy",
      ),
    );
  });

  describe("typed-copy", () => {
    it.effect("accepts a spelling that parses to the instance", () =>
      Effect.gen(function* parses() {
        yield* testGuards(instanceRef(2n, "02"));
        yield* testGuards(instanceRef(2n, "+2"));
        yield* testGuards(instanceRef(-2n, "-02"));
        yield* testGuards(instanceRef(0n, "-0"));
      }),
    );

    it.effect("refuses a spelling that parses to another instance", () =>
      Effect.gen(function* differs() {
        yield* refused(instanceRef(2n, "03"), "typed-copy");
        yield* refused(instanceRef(2n, "-02"), "typed-copy");
        yield* refused(instanceRef(1n, "-0"), "typed-copy");
      }),
    );

    it.effect("refuses a spelling of no instance reference", () =>
      refused(new Map(instanceRef(2n, "02")).set(ItemInstanceVariableRef, []), "typed-copy"),
    );
  });
});
