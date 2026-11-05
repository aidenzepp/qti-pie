import { assert, describe, it } from "@effect/vitest";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { ReferenceGuardRefusal, referenceGuards } from "#pantry/import/guards/reference.ts";
import { Rows } from "#pantry/import/tree.ts";
import { NodeXmlBase } from "#pantry/schema/attributes.ts";
import { Document } from "#pantry/schema/document.ts";
import { ExpressionSectionIdentifier, SectionIdentifierTarget } from "#pantry/schema/expression.ts";
import { FeedbackBlock } from "#pantry/schema/feedback.ts";
import { A } from "#pantry/schema/html/text.ts";
import { Source, SourceSrcset } from "#pantry/schema/html/media.ts";
import { Node } from "#pantry/schema/node.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as reference from "#pantry/schema/reference.ts";
import { PrintedVariable, PrintedVariableIndex } from "#pantry/schema/template.ts";
import * as content from "#pantry/schema/test/content.ts";
import {
  ItemRef,
  SectionRef,
  TestDocument,
  TestIdentifier,
  TestReach,
} from "#pantry/schema/test/structure.ts";

/**
 * A uuid for hand-built rows, numbered.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as const;

const pkg = id(1);

const T1 = id(10);

const T2 = id(11);

const T3 = id(12);

const S1 = id(20);

const S2 = id(21);

const I1 = id(30);

const partT1 = id(40);

const sectionRefT1 = id(41);

const itemRefT1 = id(42);

const sectionRefT2 = id(43);

const itemRefT2 = id(44);

const sectionS1 = id(45);

const variableRef = id(50);

const builtInRef = id(51);

const durationRef = id(52);

const sectionVariable = id(53);

const sectionDuration = id(54);

const identifierNode = id(60);

const feedbackNode = id(61);

const printedNode = id(62);

const linkNode = id(63);

const sourceNode = id(64);

const s1Path = "sections/s1.xml";

const s2Path = "sections/s2.xml";

const version = "3.0.1" as const;

/**
 * A document row of `root` at `path`.
 */
const document = (
  docId: ReturnType<typeof id>,
  path: string,
  root: "item" | "section" | "test",
) => ({
  id: docId,
  package: pkg,
  path,
  resource: path.slice(0, -4),
  resourceType: `imsqti_${root}_xmlv3p0`,
  root,
  version,
});

/**
 * A node of the tree `tree`, as `kind`.
 */
const node = (
  nodeId: ReturnType<typeof id>,
  kind: Fact<typeof Node>["kind"],
  tree: ReturnType<typeof id>,
) => ({
  ancestry: "root" as const,
  id: nodeId,
  kind,
  prefix: "",
  rootKind: "item" as const,
  tree,
  version,
});

/**
 * One structure holder of `scope`.
 */
const holder = (
  holderId: ReturnType<typeof id>,
  holderKind: Fact<typeof TestIdentifier>["holderKind"],
  identifier: string,
  scope: ReturnType<typeof id>,
) => ({ holder: holderId, holderKind, identifier, scope });

/**
 * One row of `TestReach`.
 */
const reached = (
  test: ReturnType<typeof id>,
  holderId: ReturnType<typeof id>,
  holderKind: Fact<typeof TestReach>["holderKind"],
  identifier: string,
) => ({ holder: holderId, holderKind, identifier, test });

const itemRef = (
  refId: ReturnType<typeof id>,
  docId: ReturnType<typeof id>,
  identifier: string,
) => ({
  document: docId,
  fixed: "false" as const,
  href: "../items/i1.xml",
  id: refId,
  identifier,
  required: "false" as const,
});

const hub = (
  ref: ReturnType<typeof id>,
  test: ReturnType<typeof id>,
  refKind: Fact<typeof processing.PrefixedVariableSource>["refKind"],
  docId: ReturnType<typeof id>,
  prefix: string,
  source: Fact<typeof processing.PrefixedVariableSource>["source"],
) => ({
  document: docId,
  itemDocument: I1,
  itemRef: itemRefT1,
  prefix,
  ref,
  refKind,
  source,
  test,
});

/**
 * A package of three test documents (T3 holds nothing) and two section documents, the reached one
 * holding every kind of per-test row, whose every copy is consistent. T1 and T2 each hold an item
 * ref to I1 and a section ref to S1; S2 is reached by none.
 */
const base = (): Rows => {
  const pairs: readonly (readonly [AnyRelation, readonly object[]])[] = [
    [
      Document,
      [
        document(T1, "tests/t1.xml", "test"),
        document(T2, "tests/t2.xml", "test"),
        document(T3, "tests/t3.xml", "test"),
        document(S1, s1Path, "section"),
        document(S2, s2Path, "section"),
        document(I1, "items/i1.xml", "item"),
      ],
    ],
    [
      TestIdentifier,
      [
        holder(partT1, "part", "P", T1),
        holder(sectionRefT1, "sectionRef", "SR", T1),
        holder(itemRefT1, "itemRef", "IR1", T1),
        holder(sectionRefT2, "sectionRef", "SR", T2),
        holder(itemRefT2, "itemRef", "IR2", T2),
        holder(sectionS1, "section", "SEC", S1),
      ],
    ],
    [
      SectionRef,
      [
        { document: T1, href: "../sections/s1.xml", id: sectionRefT1, identifier: "SR" },
        { document: T2, href: "../sections/s1.xml", id: sectionRefT2, identifier: "SR" },
      ],
    ],
    [
      reference.SectionRefResolution,
      [
        { document: S1, package: pkg, path: s1Path, sectionRef: sectionRefT1 },
        { document: S1, package: pkg, path: s1Path, sectionRef: sectionRefT2 },
      ],
    ],
    [ItemRef, [itemRef(itemRefT1, T1, "IR1"), itemRef(itemRefT2, T2, "IR2")]],
    [
      reference.ItemRefResolution,
      [
        { itemRef: itemRefT1, package: pkg, path: "items/i1.xml", targetKind: "item" },
        { itemRef: itemRefT2, package: pkg, path: "items/i1.xml", targetKind: "item" },
      ],
    ],
    [
      TestReach,
      [
        reached(T1, partT1, "part", "P"),
        reached(T1, sectionRefT1, "sectionRef", "SR"),
        reached(T1, itemRefT1, "itemRef", "IR1"),
        reached(T1, sectionS1, "section", "SEC"),
        reached(T2, sectionRefT2, "sectionRef", "SR"),
        reached(T2, itemRefT2, "itemRef", "IR2"),
        reached(T2, sectionS1, "section", "SEC"),
      ],
    ],
    [
      TestDocument,
      [
        { document: T1, test: T1 },
        { document: S1, test: T1 },
        { document: T2, test: T2 },
        { document: S1, test: T2 },
        { document: T3, test: T3 },
      ],
    ],
    [
      Node,
      [
        node(identifierNode, "qti-test-variables", S1),
        node(feedbackNode, "qti-feedback-block", S1),
        node(printedNode, "qti-printed-variable", S1),
        node(linkNode, "a", I1),
        node(sourceNode, "source", I1),
      ],
    ],
    [A, [{ href: "x.png", id: linkNode }]],
    [NodeXmlBase, [{ attribute: "xml:base", kind: "a", node: linkNode, value: "media/" }]],
    [Source, [{ id: sourceNode, parentKind: "picture", src: "" }]],
    [
      SourceSrcset,
      [{ node: sourceNode, value: "a.png 1x, https://example.org/b.png 2x, c.png 3x" }],
    ],
    [
      reference.AttributeFileReference,
      [
        {
          attribute: "href",
          document: I1,
          kind: "a",
          node: linkNode,
          package: pkg,
          path: "items/media/x.png",
          position: 0n,
        },
        {
          attribute: "srcset",
          document: I1,
          kind: "source",
          node: sourceNode,
          package: pkg,
          path: "items/a.png",
          position: 0n,
        },
        {
          attribute: "srcset",
          document: I1,
          kind: "source",
          node: sourceNode,
          package: pkg,
          path: "items/c.png",
          position: 2n,
        },
      ],
    ],
    [
      processing.ItemVariableRef,
      [
        { document: T1, id: variableRef, prefix: "IR1", root: "test", variable: "SCORE" },
        { document: T1, id: builtInRef, prefix: "IR1", root: "test", variable: "numAttempts" },
      ],
    ],
    [processing.SectionDurationRef, [{ document: T1, id: durationRef, prefix: "P", root: "test" }]],
    [
      processing.SectionVariableRef,
      [
        {
          document: S1,
          id: sectionVariable,
          identifier: "IR1.SCORE",
          referrerKind: "qti-variable",
          root: "section",
        },
        {
          document: S1,
          id: sectionDuration,
          identifier: "SEC.duration",
          referrerKind: "qti-variable",
          root: "section",
        },
      ],
    ],
    [
      processing.PrefixedVariableSource,
      [
        hub(variableRef, T1, "itemVariable", T1, "IR1", "declared"),
        hub(builtInRef, T1, "itemVariable", T1, "IR1", "builtIn"),
        hub(sectionVariable, T1, "sectionVariable", S1, "IR1", "declared"),
      ],
    ],
    [
      processing.PrefixedDeclared,
      [
        { itemDocument: I1, ref: variableRef, test: T1, variable: "SCORE" },
        { itemDocument: I1, ref: sectionVariable, test: T1, variable: "SCORE" },
      ],
    ],
    [processing.PrefixedBuiltIn, [{ builtIn: "numAttempts", ref: builtInRef, test: T1 }]],
    [
      processing.SectionDurationTarget,
      [
        {
          document: T1,
          holder: partT1,
          holderKind: "part",
          prefix: "P",
          ref: durationRef,
          refKind: "sectionDuration",
          test: T1,
        },
        ...[T1, T2].map((test) => ({
          document: S1,
          holder: sectionS1,
          holderKind: "section" as const,
          prefix: "SEC",
          ref: sectionDuration,
          refKind: "sectionVariable" as const,
          test,
        })),
      ],
    ],
    [
      processing.SectionVariableResolution,
      [
        { document: S1, ref: sectionVariable, target: "prefixed", test: T1 },
        { document: S1, ref: sectionVariable, target: "declared", test: T2 },
        { document: S1, ref: sectionDuration, target: "duration", test: T1 },
        { document: S1, ref: sectionDuration, target: "duration", test: T2 },
      ],
    ],
    [ExpressionSectionIdentifier, [{ node: identifierNode, value: "SEC" }]],
    [
      SectionIdentifierTarget,
      [T1, T2].map((test) => ({
        document: S1,
        holderKind: "section" as const,
        identifier: "SEC",
        node: identifierNode,
        test,
      })),
    ],
    [
      FeedbackBlock,
      [
        {
          id: feedbackNode,
          identifier: "x",
          outcomeIdentifier: "FEEDBACK",
          showHide: "show",
        },
      ],
    ],
    [
      content.SectionFeedbackOutcomeRef,
      [T1, T2].map((test) => ({
        baseType: "identifier" as const,
        cardinality: "single" as const,
        document: S1,
        identifier: "FEEDBACK",
        node: feedbackNode,
        test,
      })),
    ],
    [
      PrintedVariable,
      [
        {
          base: "10",
          delimiter: ";",
          id: printedNode,
          identifier: "SCORE",
          mappingIndicator: "=",
          powerForm: "false",
        },
      ],
    ],
    [PrintedVariableIndex, [{ node: printedNode, value: "IDX" }]],
    [
      content.SectionPrintedVariableRef,
      [T1, T2].map((test) => ({
        document: S1,
        identifier: "SCORE",
        kind: "outcome" as const,
        node: printedNode,
        test,
      })),
    ],
    [
      content.SectionPrintedVariableVarRef,
      [T1, T2].map((test) => ({
        attribute: "index" as const,
        baseType: "integer" as const,
        cardinality: "single" as const,
        document: S1,
        identifier: "IDX",
        kind: "outcome" as const,
        node: printedNode,
        test,
      })),
    ],
  ];

  return new Map(pairs);
};

/**
 * `rows` with `relation`'s facts replaced by what `edit` makes of them.
 */
const edited = <R extends AnyRelation>(
  rows: Rows,
  relation: R,
  edit: (facts: readonly Fact<R>[]) => readonly object[],
): Rows => new Map(rows).set(relation, edit(Rows.of(rows, relation)));

/**
 * The consistent rows without the facts of `relation` that `drop` names.
 */
const without = <R extends AnyRelation>(relation: R, drop: (row: Fact<R>) => boolean): Rows =>
  edited(base(), relation, (facts) => facts.filter((row) => !drop(row)));

/**
 * Run the guards over `rows`, failing with their refusal.
 */
const guarded = (rows: Rows) => referenceGuards(rows);

/**
 * Assert the guards refuse `rows` under `rule`.
 */
const refused = (rows: Rows, rule: ReferenceGuardRefusal["rule"]) =>
  Effect.gen(function* refusedUnder() {
    const failure = yield* Effect.flip(guarded(rows));

    assert.instanceOf(failure, ReferenceGuardRefusal);
    assert.strictEqual(failure.rule, rule);
  });

/**
 * The rows where the section variable `a.b.SCORE` resolves, in test T1, to a hub row with
 * `prefix` and `variable`.
 */
const dotted = (prefix: string, variable: string) =>
  edited(
    edited(
      edited(base(), processing.SectionVariableRef, (facts) =>
        facts.map((row) =>
          row.id === sectionVariable ? { ...row, identifier: "a.b.SCORE" } : row,
        ),
      ),
      processing.PrefixedVariableSource,
      (facts) => facts.map((row) => (row.ref === sectionVariable ? { ...row, prefix } : row)),
    ),
    processing.PrefixedDeclared,
    (facts) => facts.map((row) => (row.ref === sectionVariable ? { ...row, variable } : row)),
  );

describe("referenceGuards", () => {
  it.effect("accepts a package whose every copy is consistent", () => guarded(base()));

  it.effect("accepts a package with no references", () => guarded(Rows.empty()));

  describe("resolution-copy", () => {
    it.effect("refuses an item ref whose path is not its href resolved", () =>
      refused(
        edited(base(), reference.ItemRefResolution, (facts) =>
          facts.map((row) => ({ ...row, path: "tests/i1.xml" })),
        ),
        "resolution-copy",
      ),
    );

    it.effect("refuses a section ref that resolves in the package and has no resolution", () =>
      refused(
        edited(base(), reference.SectionRefResolution, (facts) => facts.slice(1)),
        "resolution-copy",
      ),
    );

    it.effect("refuses a resolution of an href that names no file of the package", () =>
      refused(
        edited(base(), SectionRef, (facts) =>
          facts.map((row, index) =>
            index === 0 ? { ...row, href: "https://example.org/s1.xml" } : row,
          ),
        ),
        "resolution-copy",
      ),
    );

    it.effect("refuses a file reference whose path ignores its xml:base", () =>
      refused(
        edited(base(), reference.AttributeFileReference, (facts) =>
          facts.map((row) => (row.attribute === "href" ? { ...row, path: "items/x.png" } : row)),
        ),
        "resolution-copy",
      ),
    );

    it.effect("refuses an in-package value that has no file reference", () =>
      refused(
        edited(base(), reference.AttributeFileReference, (facts) =>
          facts.filter((row) => row.attribute !== "href"),
        ),
        "resolution-copy",
      ),
    );

    it.effect("refuses a srcset candidate that has no row, and a row for an external one", () =>
      Effect.gen(function* srcsetCandidates() {
        yield* refused(
          edited(base(), reference.AttributeFileReference, (facts) =>
            facts.filter((row) => row.position !== 2n),
          ),
          "resolution-copy",
        );
        yield* refused(
          edited(base(), reference.AttributeFileReference, (facts) => [
            ...facts,
            {
              attribute: "srcset",
              document: I1,
              kind: "source",
              node: sourceNode,
              package: pkg,
              path: "items/b.png",
              position: 1n,
            },
          ]),
          "resolution-copy",
        );
      }),
    );
  });

  describe("reach-copy", () => {
    it.effect("refuses a TestReach row that is missing, extra or of another kind", () =>
      Effect.gen(function* reachRows() {
        yield* refused(
          edited(base(), TestReach, (facts) => facts.filter((row) => row.holder !== sectionS1)),
          "reach-copy",
        );
        yield* refused(
          edited(base(), TestReach, (facts) => [
            ...facts,
            reached(T3, sectionS1, "section", "SEC"),
          ]),
          "reach-copy",
        );
        yield* refused(
          edited(base(), TestReach, (facts) =>
            facts.map((row) => (row.holder === partT1 ? { ...row, identifier: "Q" } : row)),
          ),
          "reach-copy",
        );
      }),
    );

    it.effect("refuses a TestDocument row that is missing or extra", () =>
      Effect.gen(function* documentRows() {
        yield* refused(
          edited(base(), TestDocument, (facts) =>
            facts.filter((row) => !(row.test === T2 && row.document === S1)),
          ),
          "reach-copy",
        );
        yield* refused(
          edited(base(), TestDocument, (facts) => [...facts, { document: S1, test: T3 }]),
          "reach-copy",
        );
        yield* refused(
          edited(base(), TestDocument, (facts) => [...facts, { document: S2, test: T1 }]),
          "reach-copy",
        );
      }),
    );

    it.effect("refuses a per-test row that is missing for a reaching test", () =>
      Effect.gen(function* missingRows() {
        const variants: readonly Rows[] = [
          without(processing.SectionVariableResolution, (row) => row.test === T2),
          without(processing.PrefixedVariableSource, (row) => row.ref === variableRef),
          without(processing.PrefixedVariableSource, (row) => row.ref === sectionVariable),
          without(processing.SectionDurationTarget, (row) => row.ref === durationRef),
          without(
            processing.SectionDurationTarget,
            (row) => row.ref === sectionDuration && row.test === T2,
          ),
          without(SectionIdentifierTarget, (row) => row.test === T1),
          without(content.SectionFeedbackOutcomeRef, (row) => row.test === T2),
          without(content.SectionPrintedVariableRef, (row) => row.test === T1),
          without(content.SectionPrintedVariableVarRef, (row) => row.test === T2),
        ];
        for (const rows of variants) {
          yield* refused(rows, "reach-copy");
        }
      }),
    );

    it.effect("refuses a per-test row for a test that does not reach the document", () =>
      Effect.gen(function* extraRows() {
        yield* refused(
          edited(base(), SectionIdentifierTarget, (facts) => [...facts, { ...facts[0], test: T3 }]),
          "reach-copy",
        );
        yield* refused(
          edited(base(), processing.SectionVariableResolution, (facts) => [
            ...facts,
            { ...facts[0], test: T3 },
          ]),
          "reach-copy",
        );
        yield* refused(
          edited(base(), content.SectionPrintedVariableRef, (facts) => [
            ...facts,
            { ...facts[0], test: T3 },
          ]),
          "reach-copy",
        );
      }),
    );

    it.effect("leaves the closure of a cycle of section refs to section-ref-cycle", () => {
      const cyclic = new Map(base());
      cyclic.set(SectionRef, [
        ...Rows.of(base(), SectionRef),
        { document: S1, href: "s1.xml", id: id(99), identifier: "LOOP" },
      ]);
      cyclic.set(reference.SectionRefResolution, [
        ...Rows.of(base(), reference.SectionRefResolution),
        { document: S1, package: pkg, path: s1Path, sectionRef: id(99) },
      ]);

      return guarded(cyclic);
    });
  });

  describe("prefixed-copy", () => {
    it.effect("refuses a declared source that names another variable than the arm", () =>
      refused(
        edited(base(), processing.PrefixedDeclared, (facts) =>
          facts.map((row) => (row.ref === variableRef ? { ...row, variable: "OTHER" } : row)),
        ),
        "prefixed-copy",
      ),
    );

    it.effect("refuses a built-in source whose handle is not the arm's variable", () =>
      refused(
        edited(base(), processing.PrefixedBuiltIn, (facts) =>
          facts.map((row) => ({ ...row, builtIn: "duration" })),
        ),
        "prefixed-copy",
      ),
    );

    it.effect("refuses a mapped source that names another variable than the arm", () =>
      refused(
        edited(
          edited(base(), processing.PrefixedVariableSource, (facts) =>
            facts.map((row) => (row.ref === variableRef ? { ...row, source: "mapped" } : row)),
          ),
          processing.PrefixedMapped,
          () => [{ itemRef: itemRefT1, ref: variableRef, test: T1, variable: "OTHER" }],
        ),
        "prefixed-copy",
      ),
    );
  });

  describe("section-copy", () => {
    it.effect("accepts either reading of a dotted name", () =>
      Effect.gen(function* readings() {
        yield* guarded(dotted("a", "b.SCORE"));
        yield* guarded(dotted("a.b", "SCORE"));
      }),
    );

    it.effect("refuses a hub row whose prefix and variable are no reading of the identifier", () =>
      refused(dotted("a", "SCORE"), "section-copy"),
    );

    it.effect("refuses a duration target whose prefix is no reading of the identifier", () =>
      refused(
        edited(base(), processing.SectionDurationTarget, (facts) =>
          facts.map((row) =>
            row.refKind === "sectionVariable" ? { ...row, prefix: "OTHER" } : row,
          ),
        ),
        "section-copy",
      ),
    );

    it.effect("refuses a binding twin whose identifier is not its node's spelling", () =>
      Effect.gen(function* twins() {
        yield* refused(
          edited(base(), content.SectionFeedbackOutcomeRef, (facts) =>
            facts.map((row) => ({ ...row, identifier: "OTHER" })),
          ),
          "section-copy",
        );
        yield* refused(
          edited(base(), content.SectionPrintedVariableRef, (facts) =>
            facts.map((row) => ({ ...row, identifier: "OTHER" })),
          ),
          "section-copy",
        );
        yield* refused(
          edited(base(), content.SectionPrintedVariableVarRef, (facts) =>
            facts.map((row) => ({ ...row, identifier: "OTHER" })),
          ),
          "section-copy",
        );
      }),
    );
  });
});
