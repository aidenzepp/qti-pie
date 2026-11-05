import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { documentRows } from "#pantry/import/preview.ts";
import { itemRows } from "#pantry/import/item.ts";
import { packageStage } from "#pantry/import/reference.ts";
import type { StagedDocument } from "#pantry/import/reference.ts";
import { Rows } from "#pantry/import/tree.ts";
import { listPackage, readEntry } from "#pantry/package/read.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { ResourceLomGeneral } from "#pantry/schema/lang.ts";
import { Document } from "#pantry/schema/document.ts";
import { FeedbackInline, FeedbackOutcomeRef } from "#pantry/schema/feedback.ts";
import {
  PrintedVariable,
  PrintedVariableRef,
  PrintedVariableVarRef,
} from "#pantry/schema/template.ts";
import * as content from "#pantry/schema/test/content.ts";
import * as reference from "#pantry/schema/reference.ts";
import { TemplateDefault, VariableMapping } from "#pantry/schema/test/rules.ts";
import {
  ItemRef,
  SectionRef,
  TestDocument,
  TestIdentifier,
  TestReach,
} from "#pantry/schema/test/structure.ts";
import { materialize, materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const packageId: Uuid = "33333333-3333-4333-8333-333333333333";

/**
 * The rows of the package at `dir` the way `readRows` builds them, before the package stage and
 * without the guards, and the decoded documents with their node indexes that the stage reads.
 */
const built = (dir: string) =>
  Effect.gen(function* packageBuilt() {
    const entries = yield* listPackage(dir);
    const manifest = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
    const manifested = yield* manifestRows(dir, entries, manifest, Rows.empty());
    let { rows } = manifested;
    const documents: StagedDocument[] = [];
    for (const document of manifested.documents) {
      const doc = yield* readXml(yield* readEntry(dir, document.path));
      const item = yield* documentRows(
        {
          doc,
          packageId: manifested.packageId,
          path: document.path,
          resource: document.resource,
          resourceLomHasGeneral: Rows.of(manifested.rows, ResourceLomGeneral).some(
            (general) => general.resource === document.resource,
          ),
          resourceType: document.type,
          version: manifested.version,
        },
        rows,
      );
      ({ rows } = item);
      if ("nodes" in item) {
        documents.push({ doc, nodes: item.nodes });
      }
    }

    return { documents, rows };
  });

/**
 * The package at `dir` after the stage, and its rows before it.
 */
const staged = (dir: string) =>
  Effect.gen(function* packageStaged() {
    const before = yield* built(dir);
    const after = yield* packageStage(before.rows, before.documents);

    return { before: before.rows, documents: before.documents, rows: after };
  });

const stagedFixture = (name: FixtureName) => Effect.flatMap(materialize(name), staged);

/**
 * The stage over one item document written as text, at `path`, with no manifest.
 */
const stagedItem = (fragment: string, path = "items/one.xml") =>
  Effect.gen(function* itemStaged() {
    const xml = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body>${fragment}</qti-item-body></qti-assessment-item>`;
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const item = yield* itemRows(
      {
        doc,
        packageId,
        path,
        resource: "one",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version: "3.0.0",
      },
      Rows.empty(),
    );

    return yield* packageStage(item.rows, [{ doc, nodes: item.nodes }]);
  });

/**
 * The one row of `found`; the tests ask for relations that hold exactly one.
 */
const only = <Row>(found: readonly Row[]): Row => {
  assert.strictEqual(found.length, 1);

  return Option.getOrThrow(Option.fromNullishOr(found[0]));
};

/**
 * The document of `rows` at `path`.
 */
const documentAt = (rows: Rows, path: string) =>
  Option.getOrThrow(
    Option.fromNullishOr(Rows.of(rows, Document).find((found) => found.path === path)),
  );

/**
 * The item ref of `rows` with `identifier` in the document at `path`.
 */
const itemRefIn = (rows: Rows, path: string, identifier: string) => {
  const { id } = documentAt(rows, path);

  return Option.getOrThrow(
    Option.fromNullishOr(
      Rows.of(rows, ItemRef).find((ref) => ref.document === id && ref.identifier === identifier),
    ),
  );
};

/**
 * Assert that no key repeats among `found`.
 */
const keys = (found: readonly string[]): void => {
  assert.strictEqual(new Set(found).size, found.length, "a key repeats");
};

/**
 * Assert that no two rows of a stage relation share its key.
 */
const assertKeysUnique = (rows: Rows): void => {
  keys(Rows.of(rows, TestReach).map((row) => `${row.test}\n${row.holder}`));
  keys(Rows.of(rows, TestReach).map((row) => `${row.test}\n${row.identifier}`));
  keys(Rows.of(rows, TestDocument).map((row) => `${row.test}\n${row.document}`));
  keys(
    Rows.of(rows, reference.AttributeFileReference).map(
      (row) => `${row.node}\n${row.attribute}\n${row.position}`,
    ),
  );
  keys(Rows.of(rows, reference.ItemRefResolution).map((row) => row.itemRef));
};

layer(NodeServices.layer, { excludeTestServices: true })("import/reference.ts", (suite) => {
  suite.effect("BegGuide's test resolves its six item refs to their item documents", () =>
    Effect.gen(function* beginnersGuide() {
      const directory = yield* materializeSpec({
        edits: [],
        member: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip",
        name: "BegGuide_March2025",
      });
      const { rows } = yield* staged(directory);
      const refs = Rows.of(rows, ItemRef);
      const resolutions = Rows.of(rows, reference.ItemRefResolution);

      assert.strictEqual(refs.length, 6);
      assert.sameMembers(
        resolutions.map((row) => row.itemRef),
        refs.map((ref) => ref.id),
      );
      for (const ref of refs) {
        const resolution = Option.getOrThrow(
          Option.fromNullishOr(resolutions.find((row) => row.itemRef === ref.id)),
        );
        const arm = Option.getOrThrow(
          Option.fromNullishOr(
            Rows.of(rows, reference.ItemRefDocument).find((row) => row.itemRef === ref.id),
          ),
        );
        const target = documentAt(rows, resolution.path);

        assert.strictEqual(resolution.targetKind, "item");
        assert.strictEqual<string>(resolution.path, ref.href);
        assert.strictEqual(arm.document, target.id);
        assert.strictEqual(arm.path, resolution.path);
        assert.strictEqual(target.root, "item");
      }

      assert.strictEqual(Rows.of(rows, reference.ItemRefDocument).length, 6);
      assert.strictEqual(Rows.of(rows, reference.ItemRefLti).length, 0);
      assert.strictEqual(Rows.of(rows, reference.SectionRefResolution).length, 0);
      assertKeysUnique(rows);
    }),
  );

  suite.effect("BegGuide's test reaches its own part, section and item refs, and itself", () =>
    Effect.gen(function* beginnersGuideReach() {
      const directory = yield* materializeSpec({
        edits: [],
        member: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip",
        name: "BegGuide_March2025",
      });
      const { rows } = yield* staged(directory);
      const test = documentAt(rows, "BGtest.xml");
      const own = Rows.of(rows, TestIdentifier).filter((row) => row.scope === test.id);

      assert.strictEqual(own.length, 8);
      assert.sameDeepMembers(
        Rows.of(rows, TestReach).map((row) => ({
          holder: row.holder,
          holderKind: row.holderKind,
          identifier: row.identifier,
          test: row.test,
        })),
        own.map((row) => ({
          holder: row.holder,
          holderKind: row.holderKind,
          identifier: row.identifier,
          test: test.id,
        })),
      );
      assert.deepStrictEqual(Rows.of(rows, TestDocument), [{ document: test.id, test: test.id }]);
    }),
  );

  suite.effect(
    "test-section-ref's shared section document is reached once per holder in each test",
    () =>
      Effect.gen(function* sectionRefs() {
        const { rows } = yield* stagedFixture("test-section-ref");
        const shared = documentAt(rows, "sections/shared.xml");
        const lonely = documentAt(rows, "sections/lonely.xml");
        const tests = ["rtest01.xml", "test-b.xml"].map((path) => documentAt(rows, path));
        const refs = Rows.of(rows, SectionRef);

        assert.strictEqual(refs.length, 2);
        assert.sameDeepMembers(
          Rows.of(rows, reference.SectionRefResolution).map((row) => ({
            document: row.document,
            path: row.path,
            sectionRef: row.sectionRef,
          })),
          refs.map((ref) => ({
            document: shared.id,
            path: "sections/shared.xml",
            sectionRef: ref.id,
          })),
        );

        const sharedHolders = Rows.of(rows, TestIdentifier).filter(
          (row) => row.scope === shared.id,
        );
        assert.sameMembers(
          sharedHolders.map((row) => row.identifier),
          ["shared", "shared-item"],
        );
        for (const test of tests) {
          const own = Rows.of(rows, TestIdentifier).filter((row) => row.scope === test.id);
          const reached = Rows.of(rows, TestReach).filter((row) => row.test === test.id);

          assert.sameMembers(
            reached.map((row) => row.holder),
            [...own, ...sharedHolders].map((row) => row.holder),
          );
        }

        assert.sameDeepMembers(
          Rows.of(rows, TestDocument).map((row) => ({ document: row.document, test: row.test })),
          tests.flatMap((test) => [
            { document: test.id, test: test.id },
            { document: shared.id, test: test.id },
          ]),
        );
        assert.isFalse(Rows.of(rows, TestDocument).some((row) => row.document === lonely.id));
        assert.isFalse(Rows.of(rows, TestReach).some((row) => row.test === lonely.id));
        assertKeysUnique(rows);
      }),
  );

  suite.effect(
    "an item ref in a section document resolves against the section document's path",
    () =>
      Effect.gen(function* sectionItemRef() {
        const { rows } = yield* stagedFixture("test-section-ref");
        const ref = itemRefIn(rows, "sections/shared.xml", "shared-item");
        const resolution = only(
          Rows.of(rows, reference.ItemRefResolution).filter((row) => row.itemRef === ref.id),
        );

        assert.strictEqual(ref.href, "../items/shared.xml");
        assert.strictEqual(resolution.path, "items/shared.xml");
        assert.strictEqual(resolution.targetKind, "item");
      }),
  );

  suite.effect("section-ref-cycle is refused under section-ref-cycle", () =>
    Effect.gen(function* cycle() {
      const refused = yield* Effect.flip(stagedFixture("section-ref-cycle"));

      assert.strictEqual(refused._tag, "ImportRefused");
      if (refused._tag === "ImportRefused") {
        assert.strictEqual(refused.rule, "section-ref-cycle");
      }
    }),
  );

  suite.effect(
    "test-section-ref's shared rubric binds once per reaching test, with the twins and none of C's",
    () =>
      Effect.gen(function* sectionBindings() {
        const { before, rows } = yield* stagedFixture("test-section-ref");
        const shared = documentAt(rows, "sections/shared.xml");
        const tests = ["rtest01.xml", "test-b.xml"].map((path) => documentAt(rows, path));
        const printed = only(Rows.of(rows, PrintedVariable).filter((row) => row.base === "COUNT"));
        const feedback = only(Rows.of(rows, FeedbackInline));

        for (const twin of [
          content.SectionPrintedVariableRef,
          content.SectionPrintedVariableVarRef,
          content.SectionFeedbackOutcomeRef,
        ]) {
          assert.strictEqual(Rows.of(before, twin).length, 0);
        }

        assert.sameDeepMembers(
          [...Rows.of(rows, content.SectionPrintedVariableRef)],
          tests.map((test) => ({
            document: shared.id,
            identifier: "SCORE",
            kind: "outcome",
            node: printed.id,
            test: test.id,
          })),
        );
        assert.sameDeepMembers(
          [...Rows.of(rows, content.SectionPrintedVariableVarRef)],
          tests.map((test) => ({
            attribute: "base",
            baseType: "integer",
            cardinality: "single",
            document: shared.id,
            identifier: "COUNT",
            kind: "outcome",
            node: printed.id,
            test: test.id,
          })),
        );
        assert.sameDeepMembers(
          [...Rows.of(rows, content.SectionFeedbackOutcomeRef)],
          tests.map((test) => ({
            baseType: "identifier",
            cardinality: "single",
            document: shared.id,
            identifier: "FLAG",
            node: feedback.id,
            test: test.id,
          })),
        );
        assert.strictEqual(Rows.of(rows, PrintedVariableRef).length, 0);
        assert.strictEqual(Rows.of(rows, PrintedVariableVarRef).length, 0);
        assert.strictEqual(Rows.of(rows, FeedbackOutcomeRef).length, 0);
        keys(
          Rows.of(rows, content.SectionPrintedVariableVarRef).map(
            (row) => `${row.node}\n${row.attribute}\n${row.test}`,
          ),
        );
      }),
  );

  for (const [name, identifier] of [
    ["section-printed-undeclared", "COUNT"],
    ["section-feedback-undeclared", "FLAG"],
  ] as const) {
    suite.effect(`${name} is refused as binding-declared, naming the test that lacks it`, () =>
      Effect.gen(function* undeclared() {
        const refused = yield* Effect.flip(stagedFixture(name));

        assert.strictEqual(refused._tag, "ItemRefusal");
        if (refused._tag === "ItemRefusal") {
          assert.strictEqual(refused.rule, "binding-declared");
          assert.include(refused.detail, "test-b.xml");
          assert.include(refused.detail, identifier);
          assert.notInclude(refused.detail, "rtest01.xml");
        }
      }),
    );
  }

  suite.effect("test-mapping's mapping names the item document its item ref resolves to", () =>
    Effect.gen(function* mappings() {
      const { before, rows } = yield* stagedFixture("test-mapping");
      const mapping = only(Rows.of(rows, VariableMapping));
      const itemRef = itemRefIn(rows, "rtest26.xml", "item034");
      const resolved = only(
        Rows.of(rows, reference.ItemRefDocument).filter((row) => row.itemRef === itemRef.id),
      );

      assert.strictEqual(Rows.of(before, VariableMapping).length, 0);
      assert.strictEqual(mapping.itemRef, itemRef.id);
      assert.strictEqual(mapping.itemDocument, resolved.document);
      assert.strictEqual(mapping.source, "NOTA");
      assert.strictEqual(mapping.target, "SCORE");
    }),
  );

  suite.effect("test-template-default's template default names the item document", () =>
    Effect.gen(function* templateDefaults() {
      const { before, rows } = yield* stagedFixture("test-template-default");
      const arm = only(Rows.of(rows, TemplateDefault));
      const itemRef = itemRefIn(rows, "template-default-test.xml", "MICK");
      const resolved = only(
        Rows.of(rows, reference.ItemRefDocument).filter((row) => row.itemRef === itemRef.id),
      );

      assert.strictEqual(Rows.of(before, TemplateDefault).length, 0);
      assert.strictEqual(arm.itemRef, itemRef.id);
      assert.strictEqual(arm.itemDocument, resolved.document);
      assert.strictEqual(arm.templateIdentifier, "SPEED");
    }),
  );

  suite.effect("test-lti's item ref resolves to the LTI resource", () =>
    Effect.gen(function* lti() {
      const { rows } = yield* stagedFixture("test-lti");
      const ref = itemRefIn(rows, "ltitest.xml", "video");
      const resolution = only(Rows.of(rows, reference.ItemRefResolution));
      const arm = only(Rows.of(rows, reference.ItemRefLti));

      assert.strictEqual(resolution.itemRef, ref.id);
      assert.strictEqual(resolution.targetKind, "lti");
      assert.strictEqual(resolution.path, "links/streaming_video_experiment101.xml");
      assert.strictEqual(arm.itemRef, ref.id);
      assert.strictEqual(arm.resource, "experiment101");
      assert.strictEqual(arm.type, "imslti_xmlv1p1");
      assert.strictEqual(Rows.of(rows, reference.ItemRefDocument).length, 0);
    }),
  );

  suite.effect(
    "test-adaptive's four refs each have a file reference on href, and the item's image has its own",
    () =>
      Effect.gen(function* adaptive() {
        const { rows } = yield* stagedFixture("test-adaptive");
        const test = documentAt(rows, "adaptive-test.xml");
        const files = Rows.of(rows, reference.AttributeFileReference);

        assert.sameDeepMembers(
          files
            .filter((row) => row.document === test.id)
            .map((row) => [row.kind, row.attribute, row.position, row.path]),
          [
            ["qti-adaptive-engine-ref", "href", 0n, "adaptive/engine.xml"],
            ["qti-adaptive-settings-ref", "href", 0n, "adaptive/settings.xml"],
            ["qti-usagedata-ref", "href", 0n, "adaptive/usagedata.xml"],
            ["qti-metadata-ref", "href", 0n, "adaptive/metadata.xml"],
          ],
        );
        assert.deepStrictEqual(
          files.filter((row) => row.document !== test.id).map((row) => [row.kind, row.path]),
          [["img", "images/sign.png"]],
        );
        assertKeysUnique(rows);
      }),
  );
});

describe("the in-package file references of an item document", () => {
  it.effect("an http src has no row and a relative one has its path under the document", () =>
    Effect.gen(function* externalAndRelative() {
      const rows = yield* stagedItem(
        '<img src="https://example.org/a.png" alt=""/><img src="images/b.png" alt=""/>',
      );
      const file = only(Rows.of(rows, reference.AttributeFileReference));

      assert.strictEqual(file.kind, "img");
      assert.strictEqual(file.attribute, "src");
      assert.strictEqual(file.position, 0n);
      assert.strictEqual(file.path, "items/images/b.png");
      assert.strictEqual(file.document, documentAt(rows, "items/one.xml").id);
    }),
  );

  it.effect("a fragment-only and a network-path value have no row", () =>
    Effect.gen(function* nonPackage() {
      const rows = yield* stagedItem(
        '<p><a href="#here">a</a><a href="//cdn.example.org/x">b</a><a href="docs/c.html#top">c</a></p>',
      );
      const file = only(Rows.of(rows, reference.AttributeFileReference));

      assert.strictEqual(file.attribute, "href");
      assert.strictEqual(file.path, "items/docs/c.html");
    }),
  );

  it.effect("a two-candidate srcset has two positions", () =>
    Effect.gen(function* twoCandidates() {
      const rows = yield* stagedItem(
        '<picture><source srcset="a.png 1x, b.png 2x"/><img src="a.png" alt=""/></picture>',
      );
      const srcset = Rows.of(rows, reference.AttributeFileReference).filter(
        (row) => row.attribute === "srcset",
      );

      assert.deepStrictEqual(
        srcset.map((row) => [row.position, row.path]),
        [
          [0n, "items/a.png"],
          [1n, "items/b.png"],
        ],
      );
    }),
  );

  it.effect("an external srcset candidate keeps its position and has no row", () =>
    Effect.gen(function* externalCandidate() {
      const rows = yield* stagedItem(
        '<picture><source srcset="a.png 1x, https://x.example/b.png 2x, c.png 3x"/><img src="a.png" alt=""/></picture>',
      );
      const srcset = Rows.of(rows, reference.AttributeFileReference).filter(
        (row) => row.attribute === "srcset",
      );

      assert.deepStrictEqual(
        srcset.map((row) => [row.position, row.path]),
        [
          [0n, "items/a.png"],
          [2n, "items/c.png"],
        ],
      );
    }),
  );

  it.effect("a value resolves against the xml:base chain", () =>
    Effect.gen(function* base() {
      const rows = yield* stagedItem('<div xml:base="media/"><img src="a.png" alt=""/></div>');
      const file = only(Rows.of(rows, reference.AttributeFileReference));

      assert.strictEqual(file.path, "items/media/a.png");
    }),
  );

  it.effect("a document with no test, section or reference has no resolution or reach row", () =>
    Effect.gen(function* plain() {
      const rows = yield* stagedItem("<p>x</p>");

      assert.strictEqual(Rows.of(rows, reference.ItemRefResolution).length, 0);
      assert.strictEqual(Rows.of(rows, TestReach).length, 0);
      assert.strictEqual(Rows.of(rows, TestDocument).length, 0);
    }),
  );
});
