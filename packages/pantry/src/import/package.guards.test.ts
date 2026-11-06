import { NodeServices } from "@effect/platform-node";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Result } from "effect";
import { inject } from "vitest";
import { guards } from "#pantry/import/guards.ts";
import { ContentGuardRefusal } from "#pantry/import/guards/content.ts";
import { ReferenceGuardRefusal } from "#pantry/import/guards/reference.ts";
import { TestGuardRefusal } from "#pantry/import/guards/test.ts";
import { readRows } from "#pantry/import/package.ts";
import { ruleOfError } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import type { Rows } from "#pantry/import/tree.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import * as reference from "#pantry/schema/reference.ts";
import { BranchRule, BranchRuleTarget } from "#pantry/schema/test/rules.ts";
import { ItemRef, TestDocument, TestIdentifier, TestReach } from "#pantry/schema/test/structure.ts";
import { fixtureNames, materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";

const fixtures = inject("fixtures");

/**
 * `readRows` of the package at `dir`, as a `Result`.
 */
const readResult = (dir: string) => Effect.result(readRows(dir));

/**
 * Fail the test unless `readRows` of the package at `dir` succeeds.
 */
const readAccepted = (dir: string, label: string) =>
  Effect.gen(function* readAcceptedPackage() {
    const result = yield* readResult(dir);

    if (Result.isFailure(result)) {
      assert.fail(`${label} was refused: ${result.failure.message}`);
    }
  });

/**
 * Fail the test unless `readRows` of the package at `dir` succeeds or fails with a refusal under
 * one of `rules`; a platform error fails it.
 */
const readAcceptedOrUnder = (dir: string, label: string, rules: readonly Rule[]) =>
  Effect.gen(function* readUnderRules() {
    const result = yield* readResult(dir);

    if (Result.isSuccess(result)) {
      return;
    }

    const { failure } = result;
    if (failure._tag === "PlatformError") {
      assert.fail(`${label} failed with the platform's error: ${failure.message}`);
    }

    assert.include(rules, ruleOfError(failure).rule, `${label}: ${failure.message}`);
  });

const fixture = (name: FixtureName) => materialize(name);

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/package.ts readRows runs the content guards",
  (suite) => {
    suite.effect("refuses quoted-q under q-punctuation", () =>
      Effect.gen(function* refusesQuotedQ() {
        const result = yield* readResult(yield* fixture("quoted-q"));

        if (Result.isSuccess(result)) {
          assert.fail("quoted-q was admitted");
        }

        const { failure } = result;
        assert.instanceOf(failure, ContentGuardRefusal);
        if (failure instanceof ContentGuardRefusal) {
          assert.strictEqual(failure.rule, "q-punctuation");
          assert.strictEqual(ruleOfError(failure).rule, "q-punctuation");
        }
      }),
    );

    suite.effect("admits simple", () => readAccepted(fixtures.simple, "simple"));

    const clean: readonly FixtureName[] = [
      "doctype",
      "latin1",
      "external",
      "utf16",
      "comment-in-element",
      "windows-1252",
      "padded-attributes",
      "padded-text",
      "padded-identifier-value",
      "sharedMedia",
      "end-attempt",
      "operator-foreign-content",
      "fallback-3-0-1",
      "lom-wildcard",
      "nested-root-in-foreign",
      ...fixtureNames.filter((name) => name.startsWith("cut-")),
    ];
    for (const name of clean) {
      suite.effect(`admits ${name}`, () =>
        Effect.gen(function* admitsClean() {
          yield* readAccepted(yield* fixture(name), name);
        }),
      );
    }

    suite.effect("keeps identifier-mismatch under lom-identifier", () =>
      Effect.gen(function* identifierMismatch() {
        yield* readAcceptedOrUnder(yield* fixture("identifier-mismatch"), "identifier-mismatch", [
          "lom-identifier",
        ]);
      }),
    );

    suite.effect("keeps title-mismatch under lom-title", () =>
      Effect.gen(function* titleMismatch() {
        yield* readAcceptedOrUnder(yield* fixture("title-mismatch"), "title-mismatch", [
          "lom-title",
        ]);
      }),
    );

    suite.effect("keeps lti under resource-type", () =>
      readAcceptedOrUnder(fixtures.lti, "lti", ["resource-type"]),
    );

    suite.effect("keeps CAT_Test01_Adaptive_EchoAdapt under not-qti3", () =>
      readAcceptedOrUnder(fixtures.CAT_Test01_Adaptive_EchoAdapt, "CAT_Test01_Adaptive_EchoAdapt", [
        "not-qti3",
      ]),
    );

    suite.effect("keeps sample_pci under not-qti3", () =>
      readAcceptedOrUnder(fixtures.sample_pci, "sample_pci", ["not-qti3"]),
    );

    const broken: readonly (readonly [FixtureName, readonly Rule[]])[] = [
      ["undeclared-response", ["binding-declared"]],
      ["choice-in-prompt", ["admission", "choice-parent"]],
      ["two-values-single", ["value-single"]],
      ["bad-identifier-value", ["value-lexical"]],
      ["choice-bounds", ["choice-bounds"]],
      ["body-empty", ["body-empty"]],
      ["stimulus-body-empty", ["body-empty"]],
      ["bad-template-uri", ["uri-syntax"]],
    ];
    for (const [name, rules] of broken) {
      suite.effect(`keeps ${name} under ${rules.join(" or ")}`, () =>
        Effect.gen(function* keepsBroken() {
          yield* readAcceptedOrUnder(yield* fixture(name), name, rules);
        }),
      );
    }

    const refused: readonly (readonly [FixtureName, Rule])[] = [
      ["operator-foreign-first", "P30"],
      ["unqualified-on-operator", "unmodeled-vocabulary"],
      ["strict-file-foreign", "unmodeled-vocabulary"],
    ];
    for (const [name, rule] of refused) {
      suite.effect(`refuses ${name} under ${rule}`, () =>
        Effect.gen(function* refusesWildcard() {
          const result = yield* readResult(yield* fixture(name));

          if (Result.isSuccess(result)) {
            assert.fail(`${name} was admitted`);
          }

          const { failure } = result;
          if (failure._tag === "PlatformError") {
            assert.fail(`${name} failed with the platform's error: ${failure.message}`);
          }

          assert.strictEqual(ruleOfError(failure).rule, rule, `${name}: ${failure.message}`);
        }),
      );
    }
  },
);

/**
 * A uuid for hand-built rows, numbered.
 */
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as const;

const pkg = id(1);

const test = id(10);

const item = id(11);

const part = id(12);

const section = id(13);

const refEarly = id(14);

const refLate = id(15);

const itemRefNode = id(16);

const document = (docId: ReturnType<typeof id>, path: string, root: "item" | "test") => ({
  id: docId,
  package: pkg,
  path,
  resource: path.slice(0, -4),
  resourceType: `imsqti_${root}_xmlv3p0`,
  root,
  version: "3.0.1" as const,
});

/**
 * The identifier and title rows every document must hold.
 */
const named = (
  documents: readonly (readonly [ReturnType<typeof id>, string, "item" | "test"])[],
): readonly (readonly [AnyRelation, readonly object[]])[] => {
  const copies = documents.map(([docId, path, root]) => ({
    copy: { document: docId, package: pkg, resource: path.slice(0, -4), root },
    path,
  }));

  return [
    [DocumentIdentifier, copies.map(({ copy, path }) => ({ ...copy, value: path }))],
    [DocumentTitle, copies.map(({ copy, path }) => ({ ...copy, collapsed: path, value: path }))],
  ];
};

const node = (nodeId: ReturnType<typeof id>, kind: Fact<typeof Node>["kind"]) => ({
  ancestry: "root" as const,
  id: nodeId,
  kind,
  prefix: "",
  rootKind: "test" as const,
  tree: test,
  version: "3.0.1" as const,
});

const edge = (
  child: ReturnType<typeof id>,
  childKind: Fact<typeof Edge>["childKind"],
  parent: ReturnType<typeof id>,
  parentKind: Fact<typeof Edge>["parentKind"],
  position: number,
) => ({
  child,
  childAncestry: "root" as const,
  childKind,
  parent,
  parentAncestry: "root" as const,
  parentKind,
  position: BigInt(position),
  tree: test,
  version: "3.0.1" as const,
});

/**
 * A test document of one section holding two item refs, the later one's `qti-branch-rule`
 * targeting the earlier, which no branch may do.
 */
const backwardBranch = (): Rows => {
  const pairs: readonly (readonly [AnyRelation, readonly object[]])[] = [
    [Document, [document(test, "tests/t.xml", "test")]],
    ...named([[test, "tests/t.xml", "test"]]),
    [
      Node,
      [
        node(test, "qti-assessment-test"),
        node(part, "qti-test-part"),
        node(section, "qti-assessment-section"),
        node(refEarly, "qti-assessment-item-ref"),
        node(refLate, "qti-assessment-item-ref"),
      ],
    ],
    [
      Edge,
      [
        edge(part, "qti-test-part", test, "qti-assessment-test", 0),
        edge(section, "qti-assessment-section", part, "qti-test-part", 0),
        edge(refEarly, "qti-assessment-item-ref", section, "qti-assessment-section", 0),
        edge(refLate, "qti-assessment-item-ref", section, "qti-assessment-section", 1),
      ],
    ],
    [
      TestIdentifier,
      [
        { holder: part, holderKind: "part", identifier: "PART", scope: test },
        { holder: section, holderKind: "section", identifier: "SEC", scope: test },
        { holder: refEarly, holderKind: "itemRef", identifier: "EARLY", scope: test },
        { holder: refLate, holderKind: "itemRef", identifier: "LATE", scope: test },
      ],
    ],
    [TestDocument, [{ document: test, test }]],
    [
      TestReach,
      [
        { holder: part, holderKind: "part", identifier: "PART", test },
        { holder: section, holderKind: "section", identifier: "SEC", test },
        { holder: refEarly, holderKind: "itemRef", identifier: "EARLY", test },
        { holder: refLate, holderKind: "itemRef", identifier: "LATE", test },
      ],
    ],
    [
      BranchRule,
      [
        {
          document: test,
          id: id(20),
          owner: refLate,
          ownerKind: "itemRef",
          targetKind: "ref",
        },
      ],
    ],
    [
      BranchRuleTarget,
      [
        {
          holderKind: "itemRef",
          identifier: "EARLY",
          ownerKind: "itemRef",
          rule: id(20),
          scope: test,
        },
      ],
    ],
  ];

  return new Map(pairs);
};

/**
 * A test document with one item ref to a package item whose stored resolution names another path
 * than the one its `href` resolves to.
 */
const wrongResolution = (): Rows => {
  const pairs: readonly (readonly [AnyRelation, readonly object[]])[] = [
    [Document, [document(test, "tests/t.xml", "test"), document(item, "items/i.xml", "item")]],
    ...named([
      [test, "tests/t.xml", "test"],
      [item, "items/i.xml", "item"],
    ]),
    [
      ItemRef,
      [
        {
          document: test,
          fixed: "false",
          href: "../items/i.xml",
          id: itemRefNode,
          identifier: "IR",
          required: "false",
        },
      ],
    ],
    [
      reference.ItemRefResolution,
      [{ itemRef: itemRefNode, package: pkg, path: "tests/i.xml", targetKind: "item" }],
    ],
  ];

  return new Map(pairs);
};

describe("import/guards.ts guards runs the reference and test guards", () => {
  it.effect("refuses a rule that branches backward under branch-forward", () =>
    Effect.gen(function* refusesBackward() {
      const failure = yield* Effect.flip(guards(backwardBranch(), []));

      assert.instanceOf(failure, TestGuardRefusal);
      assert.strictEqual(ruleOfError(failure).rule, "branch-forward");
    }),
  );

  it.effect("refuses an item ref resolved to another path under resolution-copy", () =>
    Effect.gen(function* refusesResolution() {
      const failure = yield* Effect.flip(guards(wrongResolution(), []));

      assert.instanceOf(failure, ReferenceGuardRefusal);
      assert.strictEqual(ruleOfError(failure).rule, "resolution-copy");
    }),
  );
});
