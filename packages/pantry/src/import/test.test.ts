/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the tool column the rows under test carry; the shape here is which of the two tool attributes the root wrote, not a structure. */
import path from "node:path";
import type { Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { testRows } from "#pantry/import/test.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { ItemRefusal, Rows, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import { Declaration, OutcomeDeclarationArm } from "#pantry/schema/declaration.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { ItemTool, ItemToolBoth, ItemToolName } from "#pantry/schema/item.ts";
import { AttributeLexical, AttributeSpelling } from "#pantry/schema/node.ts";
import {
  AdaptiveEngineRef,
  AdaptiveSelection,
  AdaptiveSettingsRef,
  DeclaredAllowLateSubmission,
  DeclaredAllowReview,
  DeclaredOrderingShuffle,
  DeclaredShowFeedback,
  DeclaredWithReplacement,
  ItemSessionControl,
  ItemSessionMaxAttempts,
  MetadataRef,
  Ordering,
  Selection,
  SelectionBounded,
  TimeLimitMax,
  TimeLimitMin,
  TimeLimits,
  UsageDataRef,
} from "#pantry/schema/test/control.ts";
import {
  AssessmentSection,
  AssessmentTest,
  DeclaredItemRefFixed,
  DeclaredItemRefRequired,
  DeclaredSectionKeepTogether,
  DeclaredSectionRequired,
  ItemRef,
  ItemRefCategory,
  RequiredChild,
  SectionRef,
  StructureChild,
  TestIdentifier,
  TestPart,
  TestPartTitle,
} from "#pantry/schema/test/structure.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const packageId: Uuid = "33333333-3333-4333-8333-333333333333";

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The rows of a test or section document written as text, for the resource the tests describe.
 */
const built = (text: string, type = "imsqti_test_xmlv3p0") =>
  Effect.gen(function* builtDocument() {
    const doc = yield* readXml(new TextEncoder().encode(text));

    return yield* testRows(
      {
        doc,
        packageId,
        path: "document.xml",
        resource: "document",
        resourceLomHasGeneral: false,
        resourceType: type,
        version: "3.0.0",
      },
      Rows.empty(),
    );
  });

/**
 * A test document whose body is `body`.
 */
const testText = (body: string, attributes = 'identifier="T" title="A test"'): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="${asi}" ${attributes}>${body}</qti-assessment-test>`;

/**
 * A test document with one part and one section whose children are `children` and whose own
 * elements, before them, are `elements`.
 */
const sectioned = (children: string, elements = "", sectionAttributes = ""): string =>
  testText(
    `<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">` +
      `<qti-assessment-section identifier="S" title="Section" visible="true"${sectionAttributes}>` +
      `${elements}${children}</qti-assessment-section></qti-test-part>`,
  );

const itemRef = `<qti-assessment-item-ref identifier="I1" href="items/one.xml"/>`;

/**
 * The ids of the nodes of one kind, in document order.
 */
const idsOf = (nodes: NodeIndex, kind: string) =>
  [...nodes.values()].filter((entry) => entry.kind === kind).map((entry) => entry.id);

/**
 * The one row of `found`; the tests ask for relations that hold exactly one.
 */
const only = <Row>(found: readonly Row[]): Row => {
  assert.strictEqual(found.length, 1);

  const row = Option.getOrThrow(Option.fromNullishOr(found[0]));

  return row;
};

/**
 * The selection, its marker and its bound copy of a section whose selection selects 1 with the
 * `with-replacement` spelling `spelling`.
 */
const bounded = (spelling: string) =>
  built(sectioned(itemRef, `<qti-selection select="1" with-replacement="${spelling}"/>`)).pipe(
    Effect.map(({ rows }) => ({
      bounded: Rows.of(rows, SelectionBounded),
      marked: Rows.of(rows, DeclaredWithReplacement).length,
      selection: only(Rows.of(rows, Selection)),
    })),
  );

/**
 * The failure a document's build ends in.
 */
const refused = (text: string, type?: string) => Effect.flip(built(text, type));

layer(NodeServices.layer, { excludeTestServices: true })("import/test.ts", (suite) => {
  suite.effect("BegGuide's BGtest.xml yields the test, part, section and six item refs", () =>
    Effect.gen(function* beginnersGuide() {
      const directory = yield* materializeSpec({
        edits: [],
        member: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip",
        name: "BegGuide_March2025",
      });
      const fs = yield* FileSystem.FileSystem;
      const doc = yield* readXml(yield* fs.readFile(path.join(directory, "BGtest.xml")));
      const { documentId, nodes, rows } = yield* testRows(
        {
          doc,
          packageId,
          path: "BGtest.xml",
          resource: "BGtest",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_test_xmlv3p0",
          version: "3.0.1",
        },
        Rows.empty(),
      );

      const document = only(Rows.of(rows, Document));
      assert.strictEqual(document.id, documentId);
      assert.strictEqual(document.root, "test");
      assert.strictEqual(only(Rows.of(rows, DocumentIdentifier)).value, "BGtest");
      assert.strictEqual(only(Rows.of(rows, DocumentTitle)).value, "Beginners Guide Example Test");
      assert.strictEqual(Rows.of(rows, AssessmentTest).length, 1);
      assert.strictEqual(Rows.of(rows, ItemTool).length, 0);

      const [part] = Rows.of(rows, TestPart);
      assert.strictEqual(Rows.of(rows, TestPart).length, 1);
      assert.strictEqual(part?.identifier, "testPart-1");
      assert.strictEqual(part?.navigationMode, "nonlinear");
      assert.strictEqual(part?.submissionMode, "individual");
      assert.strictEqual(Rows.of(rows, TestPartTitle).length, 0);

      const section = only(Rows.of(rows, AssessmentSection));
      assert.strictEqual(section.identifier, "assessmentSection-1");
      assert.strictEqual(section.visible, "true");
      assert.strictEqual(section.required, "false");
      assert.strictEqual(section.fixed, "false");
      assert.strictEqual(section.keepTogether, "true");
      assert.strictEqual(Rows.of(rows, DeclaredSectionRequired).length, 0);

      const refs = Rows.of(rows, ItemRef);
      assert.deepStrictEqual(
        refs.map((ref) => [ref.identifier, ref.href]),
        [
          ["firstexample", "items/firstexample.xml"],
          ["beginnersguide007", "items/BG007.xml"],
          ["beginnersguide008", "items/BG008.xml"],
          ["beginnersguide009", "items/BG009.xml"],
          ["beginnersguide010", "items/BG010.xml"],
          ["beginnersguide011", "items/BG011.xml"],
        ],
      );

      const identifiers = Rows.of(rows, TestIdentifier);
      assert.strictEqual(identifiers.length, 8);
      assert.isTrue(identifiers.every((row) => row.scope === documentId));
      assert.sameMembers(
        identifiers.map((row) => row.holderKind),
        ["itemRef", "itemRef", "itemRef", "itemRef", "itemRef", "itemRef", "part", "section"],
      );

      const children = Rows.of(rows, StructureChild);
      assert.strictEqual(children.length, 7);
      assert.isTrue(
        children.some(
          (row) =>
            row.parent === part?.id &&
            row.child === section.id &&
            row.childKind === "qti-assessment-section",
        ),
      );
      assert.isTrue(
        refs.every((ref) =>
          children.some(
            (row) =>
              row.parent === section.id &&
              row.child === ref.id &&
              row.childKind === "qti-assessment-item-ref",
          ),
        ),
      );
      assert.strictEqual(Rows.of(rows, RequiredChild).length, 0);
      assert.strictEqual(idsOf(nodes, "qti-assessment-item-ref").length, 6);
    }),
  );

  suite.effect(
    "a nested section, a section ref and an item ref are children of their parents",
    () =>
      Effect.gen(function* nestedStructure() {
        const { nodes, rows } = yield* built(
          sectioned(
            `<qti-assessment-section identifier="S2" title="Inner" visible="false" required="1" keep-together="false">${itemRef}</qti-assessment-section>` +
              `<qti-assessment-section-ref identifier="R1" href="sections/two.xml"/>` +
              `<qti-assessment-item-ref identifier="I2" href="items/two.xml" required="1" fixed="true" category="easy  hard"/>`,
          ),
        );

        const [outer, inner] = idsOf(nodes, "qti-assessment-section");
        const ref = only(Rows.of(rows, SectionRef));
        assert.strictEqual(ref.identifier, "R1");
        assert.strictEqual(ref.href, "sections/two.xml");

        const required = Rows.of(rows, ItemRef).find((row) => row.identifier === "I2");
        assert.isDefined(required);
        assert.strictEqual(required?.required, "1");
        assert.strictEqual(required?.fixed, "true");
        assert.strictEqual(
          Rows.of(rows, ItemRef).find((row) => row.identifier === "I1")?.required,
          "false",
        );
        assert.deepStrictEqual(
          Rows.of(rows, DeclaredItemRefRequired).map((row) => row.node),
          [required?.id],
        );
        assert.deepStrictEqual(
          Rows.of(rows, DeclaredItemRefFixed).map((row) => row.node),
          [required?.id],
        );
        assert.strictEqual(only(Rows.of(rows, ItemRefCategory)).value, "easy hard");
        assert.strictEqual(only(Rows.of(rows, ItemRefCategory)).node, required?.id);
        assert.strictEqual(
          only(Rows.of(rows, AttributeLexical).filter((row) => row.attribute === "category")).value,
          "easy  hard",
        );

        const innerRow = Rows.of(rows, AssessmentSection).find((row) => row.id === inner);
        assert.strictEqual(innerRow?.required, "1");
        assert.strictEqual(innerRow?.keepTogether, "false");
        assert.strictEqual(innerRow?.visible, "false");
        assert.deepStrictEqual(
          Rows.of(rows, DeclaredSectionRequired).map((row) => row.node),
          [inner],
        );
        assert.deepStrictEqual(
          Rows.of(rows, DeclaredSectionKeepTogether).map((row) => row.node),
          [inner],
        );

        const children = Rows.of(rows, StructureChild);
        const under = (parent: string | undefined) =>
          children.filter((row) => row.parent === parent).map((row) => row.childKind);
        assert.sameMembers(under(outer), [
          "qti-assessment-item-ref",
          "qti-assessment-section",
          "qti-assessment-section-ref",
        ]);
        assert.deepStrictEqual(under(inner), ["qti-assessment-item-ref"]);

        const requiredChildren = Rows.of(rows, RequiredChild);
        assert.sameDeepMembers(
          requiredChildren.map((row) => [row.child, row.parent, row.required]),
          [
            [inner, outer, "1"],
            [required?.id, outer, "1"],
          ],
        );
        assert.strictEqual(Rows.of(rows, TestIdentifier).length, 6);
      }),
  );

  suite.effect("a part's title and a part's sections and section refs are its children", () =>
    Effect.gen(function* titledPart() {
      const { nodes, rows } = yield* built(
        testText(
          `<qti-test-part identifier="P" title="  Part\tone " navigation-mode="nonlinear" submission-mode="simultaneous">` +
            `<qti-assessment-section identifier="S" title="Section" visible="true">${itemRef}</qti-assessment-section>` +
            `<qti-assessment-section-ref identifier="R" href="s.xml"/></qti-test-part>`,
        ),
      );
      const [part] = idsOf(nodes, "qti-test-part");

      assert.strictEqual(only(Rows.of(rows, TestPartTitle)).value, "  Part one ");
      assert.sameMembers(
        Rows.of(rows, StructureChild)
          .filter((row) => row.parent === part)
          .map((row) => row.childKind),
        ["qti-assessment-section", "qti-assessment-section-ref"],
      );
    }),
  );

  suite.effect("a selection with a spelled select and no replacement is bounded", () =>
    Effect.gen(function* boundedSelection() {
      const { nodes, rows } = yield* built(
        sectioned("", `<qti-selection select="+2"/>`).replace(
          "</qti-assessment-section>",
          `${itemRef}</qti-assessment-section>`,
        ),
      );
      const [section] = idsOf(nodes, "qti-assessment-section");
      const [selectionId] = idsOf(nodes, "qti-selection");

      const selection = only(Rows.of(rows, Selection));
      assert.strictEqual(selection.id, selectionId);
      assert.strictEqual(selection.section, section);
      assert.strictEqual(selection.select, 2n);
      assert.strictEqual(selection.withReplacement, "false");
      assert.strictEqual(Rows.of(rows, DeclaredWithReplacement).length, 0);

      const spelling = only(Rows.of(rows, AttributeSpelling));
      assert.strictEqual(spelling.attribute, "select");
      assert.strictEqual(spelling.kind, "qti-selection");
      assert.strictEqual(spelling.node, selectionId);
      assert.strictEqual(spelling.value, "+2");

      assert.deepStrictEqual(
        Rows.of(rows, SelectionBounded).map((row) => [
          row.section,
          row.select,
          row.withReplacement,
        ]),
        [[section, 2n, "false"]],
      );
    }),
  );

  suite.effect("a selection bounds exactly when it is without replacement", () =>
    Effect.gen(function* replacement() {
      const zero = yield* bounded("0");
      assert.strictEqual(zero.selection.withReplacement, "0");
      assert.strictEqual(zero.marked, 1);
      assert.deepStrictEqual(
        zero.bounded.map((row) => row.withReplacement),
        ["0"],
      );

      const no = yield* bounded("false");
      assert.strictEqual(no.marked, 1);
      assert.deepStrictEqual(
        no.bounded.map((row) => row.withReplacement),
        ["false"],
      );

      for (const spelling of ["true", "1"]) {
        const replaced = yield* bounded(spelling);
        assert.strictEqual(replaced.selection.withReplacement, spelling);
        assert.strictEqual(replaced.marked, 1);
        assert.strictEqual(replaced.bounded.length, 0);
      }
    }),
  );

  suite.effect("an ordering defaults shuffle with no marker and marks one that is written", () =>
    Effect.gen(function* ordering() {
      const defaulted = yield* built(sectioned(itemRef, "<qti-ordering/>"));
      assert.strictEqual(only(Rows.of(defaulted.rows, Ordering)).shuffle, "false");
      assert.strictEqual(Rows.of(defaulted.rows, DeclaredOrderingShuffle).length, 0);

      const written = yield* built(sectioned(itemRef, `<qti-ordering shuffle="true"/>`));
      assert.strictEqual(only(Rows.of(written.rows, Ordering)).shuffle, "true");
      assert.deepStrictEqual(
        Rows.of(written.rows, DeclaredOrderingShuffle).map((row) => row.node),
        idsOf(written.nodes, "qti-ordering"),
      );
    }),
  );

  suite.effect("an item session control keeps max-attempts and defaults the booleans", () =>
    Effect.gen(function* sessionControl() {
      const { nodes, rows } = yield* built(
        sectioned(
          `<qti-assessment-item-ref identifier="I1" href="one.xml"><qti-item-session-control max-attempts=" 03 " show-feedback="1"/></qti-assessment-item-ref>`,
        ),
      );
      const [control] = idsOf(nodes, "qti-item-session-control");

      const row = only(Rows.of(rows, ItemSessionControl));
      assert.strictEqual(row.id, control);
      assert.strictEqual(row.showFeedback, "1");
      assert.strictEqual(row.allowReview, "true");
      assert.strictEqual(row.allowSkipping, "true");
      assert.strictEqual(row.allowComment, "false");
      assert.strictEqual(row.showSolution, "false");
      assert.strictEqual(row.validateResponses, "false");
      assert.deepStrictEqual(
        Rows.of(rows, ItemSessionMaxAttempts).map((limit) => [limit.node, limit.value]),
        [[control, 3n]],
      );
      assert.deepStrictEqual(
        Rows.of(rows, DeclaredShowFeedback).map((marker) => marker.node),
        [control],
      );
      assert.strictEqual(Rows.of(rows, DeclaredAllowReview).length, 0);

      const spellings = Rows.of(rows, AttributeSpelling);
      assert.strictEqual(spellings.length, 1);
      assert.strictEqual(spellings[0]?.attribute, "max-attempts");
      assert.strictEqual(spellings[0]?.value, "03");

      const bare = yield* built(
        sectioned(
          `<qti-assessment-item-ref identifier="I1" href="one.xml"><qti-item-session-control/></qti-assessment-item-ref>`,
        ),
      );
      assert.strictEqual(Rows.of(bare.rows, ItemSessionMaxAttempts).length, 0);
    }),
  );

  suite.effect(
    "time limits keep min-time and max-time as written and mark allow-late-submission",
    () =>
      Effect.gen(function* timeLimits() {
        const { nodes, rows } = yield* built(
          testText(
            `<qti-time-limits min-time="10" allow-late-submission="true"/>` +
              `<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">` +
              `<qti-assessment-section identifier="S" title="Section" visible="true"><qti-time-limits max-time="3600.0"/>${itemRef}</qti-assessment-section></qti-test-part>`,
          ),
        );
        const [first, second] = idsOf(nodes, "qti-time-limits");

        assert.deepStrictEqual(
          Rows.of(rows, TimeLimits).map((row) => [row.id, row.allowLateSubmission]),
          [
            [first, "true"],
            [second, "false"],
          ],
        );
        assert.deepStrictEqual(
          Rows.of(rows, TimeLimitMin).map((limit) => [limit.node, limit.value]),
          [[first, "10"]],
        );
        assert.deepStrictEqual(
          Rows.of(rows, TimeLimitMax).map((limit) => [limit.node, limit.value]),
          [[second, "3600.0"]],
        );
        assert.deepStrictEqual(
          Rows.of(rows, DeclaredAllowLateSubmission).map((row) => row.node),
          [first],
        );
      }),
  );

  suite.effect(
    "an adaptive selection and its references are written as thin and required rows",
    () =>
      Effect.gen(function* adaptive() {
        const { nodes, rows } = yield* built(
          sectioned(
            itemRef,
            `<qti-adaptive-selection><qti-adaptive-engine-ref identifier="E" href="engine.xml"/>` +
              `<qti-adaptive-settings-ref identifier="G" href="settings.xml"/>` +
              `<qti-usagedata-ref identifier="U" href="usage.xml"/>` +
              `<qti-metadata-ref identifier="M" href="meta.xml"/></qti-adaptive-selection>`,
          ),
        );

        assert.deepStrictEqual(
          Rows.of(rows, AdaptiveSelection).map((row) => row.id),
          idsOf(nodes, "qti-adaptive-selection"),
        );
        assert.deepStrictEqual(
          Rows.of(rows, AdaptiveEngineRef).map((row) => [row.identifier, row.href]),
          [["E", "engine.xml"]],
        );
        assert.deepStrictEqual(
          Rows.of(rows, AdaptiveSettingsRef).map((row) => [row.identifier, row.href]),
          [["G", "settings.xml"]],
        );
        assert.deepStrictEqual(
          Rows.of(rows, UsageDataRef).map((row) => [row.identifier, row.href]),
          [["U", "usage.xml"]],
        );
        assert.deepStrictEqual(
          Rows.of(rows, MetadataRef).map((row) => [row.identifier, row.href]),
          [["M", "meta.xml"]],
        );
      }),
  );

  suite.effect(
    "the test root's tool attributes are one tool row and the arm of what it wrote",
    () =>
      Effect.gen(function* tools() {
        const both = yield* built(
          testText("", 'identifier="T" title="x" tool-name="Maker" tool-version="2"'),
        );
        assert.deepStrictEqual(Rows.of(both.rows, ItemTool), [
          { root: "test", shape: "both", tree: both.documentId },
        ]);
        assert.deepStrictEqual(
          Rows.of(both.rows, ItemToolBoth).map((row) => [row.toolName, row.toolVersion, row.tree]),
          [["Maker", "2", both.documentId]],
        );

        const named = yield* built(testText("", 'identifier="T" title="x" tool-name="Maker"'));
        assert.strictEqual(only(Rows.of(named.rows, ItemTool)).shape, "nameOnly");
        assert.strictEqual(only(Rows.of(named.rows, ItemToolName)).toolName, "Maker");
      }),
  );

  suite.effect("a test's outcome declarations are written as an item's are", () =>
    Effect.gen(function* declarations() {
      const { rows } = yield* built(
        testText(
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
        ),
      );

      assert.deepStrictEqual(
        Rows.of(rows, Declaration).map((row) => [row.identifier, row.kind]),
        [["SCORE", "outcome"]],
      );
      assert.strictEqual(Rows.of(rows, OutcomeDeclarationArm).length, 1);
    }),
  );

  suite.effect("a section document's root is the section, its identifier and its title", () =>
    Effect.gen(function* sectionDocument() {
      const { documentId, nodes, rows } = yield* built(
        `<qti-assessment-section xmlns="${asi}" identifier="Shared" title="Shared items" visible="true">` +
          `<qti-selection select="1"/>${itemRef}<qti-assessment-section-ref identifier="R" href="r.xml"/></qti-assessment-section>`,
        "imsqti_section_xmlv3p0",
      );
      const [root] = idsOf(nodes, "qti-assessment-section");

      assert.strictEqual(only(Rows.of(rows, Document)).root, "section");
      assert.strictEqual(only(Rows.of(rows, DocumentIdentifier)).value, "Shared");
      assert.strictEqual(only(Rows.of(rows, DocumentIdentifier)).root, "section");
      assert.strictEqual(only(Rows.of(rows, DocumentTitle)).value, "Shared items");
      assert.strictEqual(Rows.of(rows, AssessmentTest).length, 0);
      assert.strictEqual(only(Rows.of(rows, AssessmentSection)).id, root);
      assert.sameDeepMembers(
        Rows.of(rows, TestIdentifier).map((row) => [row.holderKind, row.identifier, row.scope]),
        [
          ["itemRef", "I1", documentId],
          ["section", "Shared", documentId],
          ["sectionRef", "R", documentId],
        ],
      );
      assert.sameDeepMembers(
        Rows.of(rows, StructureChild).map((row) => [row.parent, row.childKind]),
        [
          [root, "qti-assessment-item-ref"],
          [root, "qti-assessment-section-ref"],
        ],
      );
      assert.strictEqual(only(Rows.of(rows, Selection)).section, root);
      assert.strictEqual(only(Rows.of(rows, SelectionBounded)).select, 1n);
    }),
  );

  suite.effect("a root that is no test or section is unmodeled", () =>
    Effect.gen(function* otherRoot() {
      const failure = yield* refused(
        `<qti-assessment-item xmlns="${asi}" identifier="A" title="B" time-dependent="false"/>`,
      );

      assert.instanceOf(failure, UnmodeledVocabulary);
    }),
  );

  suite.effect("a part without its required navigation-mode is refused before any row", () =>
    Effect.gen(function* missingMode() {
      const failure = yield* refused(
        testText(
          `<qti-test-part identifier="P" submission-mode="individual"><qti-assessment-section identifier="S" title="s" visible="true">${itemRef}</qti-assessment-section></qti-test-part>`,
        ),
      );

      assert.instanceOf(failure, ItemRefusal);
      assert.strictEqual(failure.rule, "required-attribute");
    }),
  );

  suite.effect(
    "a section without a visible attribute and an item ref without an href are refused",
    () =>
      Effect.gen(function* missingRequired() {
        const noVisible = yield* refused(
          testText(
            `<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="s">${itemRef}</qti-assessment-section></qti-test-part>`,
          ),
        );
        assert.instanceOf(noVisible, ItemRefusal);

        const noHref = yield* refused(sectioned(`<qti-assessment-item-ref identifier="I1"/>`));
        assert.instanceOf(noHref, ItemRefusal);
        assert.strictEqual(noHref.rule, "required-attribute");
      }),
  );

  suite.effect(
    "a navigation-mode or a boolean outside its roster is refused as attribute-lexical",
    () =>
      Effect.gen(function* outsideRoster() {
        const mode = yield* refused(
          testText(
            `<qti-test-part identifier="P" navigation-mode="sideways" submission-mode="individual"/>`,
          ),
        );
        assert.instanceOf(mode, ImportRefused);
        assert.strictEqual(mode.rule, "attribute-lexical");

        const flag = yield* refused(sectioned(itemRef, '<qti-ordering shuffle="yes"/>'));
        assert.instanceOf(flag, ImportRefused);
        assert.strictEqual(flag.rule, "attribute-lexical");
      }),
  );

  suite.effect("a select or max-attempts that is no integer is refused as attribute-lexical", () =>
    Effect.gen(function* notInteger() {
      const select = yield* refused(sectioned(itemRef, `<qti-selection select="2.5"/>`));
      assert.instanceOf(select, ImportRefused);
      assert.strictEqual(select.rule, "attribute-lexical");

      const attempts = yield* refused(
        sectioned(
          `<qti-assessment-item-ref identifier="I1" href="one.xml"><qti-item-session-control max-attempts="many"/></qti-assessment-item-ref>`,
        ),
      );
      assert.instanceOf(attempts, ImportRefused);
      assert.strictEqual(attempts.rule, "attribute-lexical");
    }),
  );
});
