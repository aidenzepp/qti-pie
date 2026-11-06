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
import {
  ContextDeclarationArm,
  Declaration,
  OutcomeDeclarationArm,
  TypedDeclaration,
} from "#pantry/schema/declaration.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { FeedbackInline, FeedbackOutcomeRef } from "#pantry/schema/feedback.ts";
import { ItemTool, ItemToolBoth, ItemToolName } from "#pantry/schema/item.ts";
import { DocumentLang } from "#pantry/schema/lang.ts";
import { NodeXmlLang } from "#pantry/schema/attributes.ts";
import { AttributeLexical, AttributeSpelling, Edge } from "#pantry/schema/node.ts";
import { Stylesheet } from "#pantry/schema/rubric.ts";
import { XInclude, XIncludeHref, XIncludeParse } from "#pantry/schema/rule.ts";
import {
  PrintedVariable,
  PrintedVariableRef,
  PrintedVariableVarRef,
} from "#pantry/schema/template.ts";
import {
  TestFeedback,
  TestFeedbackContentBody,
  TestFeedbackTitle,
  TestRubricBlock,
  TestRubricBlockUse,
  TestRubricContentBody,
} from "#pantry/schema/test/content.ts";
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
  BranchRule,
  BranchRuleExit,
  BranchRuleTarget,
  PreCondition,
  TemplateDefault,
  VariableMapping,
  Weight,
} from "#pantry/schema/test/rules.ts";
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
import { materialize, materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const packageId: Uuid = "33333333-3333-4333-8333-333333333333";

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The rows of a test or section document written as text, for the resource the tests describe.
 */
const built = (text: string, type = "imsqti_test_xmlv3p0", resourceLomHasGeneral = false) =>
  Effect.gen(function* builtDocument() {
    const doc = yield* readXml(new TextEncoder().encode(text));

    return yield* testRows(
      {
        doc,
        packageId,
        path: "document.xml",
        resource: "document",
        resourceLomHasGeneral,
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

/**
 * The rows of one document of a fixture package, whose manifest says schema version 3.0.0, after
 * `edit` has rewritten its text.
 */
const fixtureBuilt = (
  fixture: FixtureName,
  file: string,
  type = "imsqti_test_xmlv3p0",
  edit: (text: string) => string = (text) => text,
) =>
  Effect.gen(function* builtFixture() {
    const directory = yield* materialize(fixture);
    const fs = yield* FileSystem.FileSystem;
    const text = new TextDecoder().decode(yield* fs.readFile(path.join(directory, file)));
    const doc = yield* readXml(new TextEncoder().encode(edit(text)));

    return yield* testRows(
      {
        doc,
        packageId,
        path: file,
        resource: file,
        resourceLomHasGeneral: false,
        resourceType: type,
        version: "3.0.0",
      },
      Rows.empty(),
    );
  });

/**
 * The id of the item reference that wrote `identifier`.
 */
const itemRefId = (rows: Rows, identifier: string): Uuid =>
  Option.getOrThrow(
    Option.fromNullishOr(Rows.of(rows, ItemRef).find((ref) => ref.identifier === identifier)),
  ).id;

/**
 * Whether the rows hold the edge that makes `parent` the parent of `child`, which is what every
 * rule's and weight's `(id, owner)` containment into `Edge.(child, parent)` reads.
 */
const isChildOf = (rows: Rows, child: Uuid, parent: Uuid): boolean =>
  Rows.of(rows, Edge).some((edge) => edge.child === child && edge.parent === parent);

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

  suite.effect("test-linear's branch rules are exits or targets, each owned by its parent", () =>
    Effect.gen(function* branchRules() {
      const { documentId, nodes, rows } = yield* fixtureBuilt("test-linear", "rtest13.xml");
      const [part] = idsOf(nodes, "qti-test-part");
      const rules = Rows.of(rows, BranchRule);

      assert.strictEqual(rules.length, idsOf(nodes, "qti-branch-rule").length);
      assert.strictEqual(rules.length, 4);
      assert.isTrue(rules.every((rule) => rule.document === documentId));
      assert.isTrue(rules.every((rule) => isChildOf(rows, rule.id, rule.owner)));
      assert.sameDeepMembers(
        rules.map((rule) => [rule.owner, rule.ownerKind, rule.targetKind]),
        [
          [part, "part", "exit"],
          [itemRefId(rows, "item347"), "itemRef", "ref"],
          [itemRefId(rows, "item347"), "itemRef", "exit"],
          [itemRefId(rows, "item653"), "itemRef", "exit"],
        ],
      );

      const exits = Rows.of(rows, BranchRuleExit);
      assert.sameMembers(
        exits.map((exit) => exit.exit),
        ["EXIT_SECTION", "EXIT_TEST", "EXIT_TESTPART"],
      );
      assert.sameMembers(
        exits.map((exit) => exit.rule),
        rules.filter((rule) => rule.targetKind === "exit").map((rule) => rule.id),
      );

      const [target] = Rows.of(rows, BranchRuleTarget);
      assert.strictEqual(Rows.of(rows, BranchRuleTarget).length, 1);
      assert.strictEqual(target?.identifier, "item656");
      assert.strictEqual(target?.holderKind, "itemRef");
      assert.strictEqual(target?.ownerKind, "itemRef");
      assert.strictEqual(target?.scope, documentId);
      assert.strictEqual(target?.rule, rules.find((rule) => rule.targetKind === "ref")?.id);
    }),
  );

  suite.effect(
    "a branch target resolves to its holder within the document, and one that does not still has its row",
    () =>
      Effect.gen(function* branchTargets() {
        const resolved = yield* fixtureBuilt("test-linear", "rtest13.xml");
        const declared = Rows.of(resolved.rows, TestIdentifier);
        for (const target of Rows.of(resolved.rows, BranchRuleTarget)) {
          assert.isTrue(
            declared.some(
              (row) =>
                row.scope === target.scope &&
                row.identifier === target.identifier &&
                row.holderKind === target.holderKind,
            ),
          );
          assert.strictEqual(target.holderKind === "part", target.ownerKind === "part");
        }

        const toItem = yield* built(
          testText(
            `<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">` +
              `<qti-branch-rule target="I1"><qti-is-null><qti-variable identifier="X"/></qti-is-null></qti-branch-rule>` +
              `<qti-assessment-section identifier="S" title="s" visible="true">${itemRef}</qti-assessment-section></qti-test-part>`,
          ),
        );
        const [toItemTarget] = Rows.of(toItem.rows, BranchRuleTarget);
        assert.strictEqual(toItemTarget?.ownerKind, "part");
        assert.strictEqual(toItemTarget?.holderKind, "itemRef");

        const misspelled = yield* built(
          sectioned(
            `<qti-assessment-item-ref identifier="I1" href="one.xml"><qti-branch-rule target="EXIT_TESTS"><qti-is-null><qti-variable identifier="X"/></qti-is-null></qti-branch-rule></qti-assessment-item-ref>`,
          ),
        );
        assert.strictEqual(Rows.of(misspelled.rows, BranchRuleExit).length, 0);
        assert.deepStrictEqual(
          Rows.of(misspelled.rows, BranchRuleTarget).map((row) => row.identifier),
          ["EXIT_TESTS"],
        );
        assert.strictEqual(only(Rows.of(misspelled.rows, BranchRule)).targetKind, "ref");

        const unknown = yield* built(
          sectioned(
            `<qti-assessment-item-ref identifier="I1" href="one.xml"><qti-branch-rule target="NOPE"><qti-is-null><qti-variable identifier="X"/></qti-is-null></qti-branch-rule></qti-assessment-item-ref>`,
          ),
        );
        assert.deepStrictEqual(
          Rows.of(unknown.rows, BranchRuleTarget).map((row) => row.identifier),
          ["NOPE"],
        );
      }),
  );

  suite.effect("a branch rule without its target is refused as required-attribute", () =>
    Effect.gen(function* noTarget() {
      const failure = yield* refused(
        sectioned(
          `<qti-assessment-item-ref identifier="I1" href="one.xml"><qti-branch-rule><qti-is-null><qti-variable identifier="X"/></qti-is-null></qti-branch-rule></qti-assessment-item-ref>`,
        ),
      );

      assert.instanceOf(failure, ItemRefusal);
      assert.strictEqual(failure.rule, "required-attribute");
    }),
  );

  suite.effect("pre-conditions of an item reference and a section have their rows", () =>
    Effect.gen(function* preConditions() {
      const { nodes, rows } = yield* fixtureBuilt("test-linear", "rtest13.xml");

      assert.strictEqual(Rows.of(rows, PreCondition).length, 3);
      assert.sameMembers(
        Rows.of(rows, PreCondition).map((row) => row.id),
        idsOf(nodes, "qti-pre-condition"),
      );
    }),
  );

  suite.effect(
    "test-mapping's weight has its row, and the mapping's and default's arms are not here",
    () =>
      Effect.gen(function* weights() {
        const { rows } = yield* fixtureBuilt("test-mapping", "rtest26.xml");
        const weight = only(Rows.of(rows, Weight));

        assert.strictEqual(weight.identifier, "WEIGHT");
        assert.strictEqual(weight.value, "2");
        assert.strictEqual(weight.itemRef, itemRefId(rows, "item160"));
        assert.isTrue(isChildOf(rows, weight.id, weight.itemRef));
        assert.strictEqual(Rows.of(rows, VariableMapping).length, 0);
        assert.strictEqual(Rows.of(rows, TemplateDefault).length, 0);
      }),
  );

  suite.effect("test-content's rubrics have their rows, each with its body once", () =>
    Effect.gen(function* rubrics() {
      const { nodes, rows } = yield* fixtureBuilt("test-content", "assessment.xml");
      const blocks = Rows.of(rows, TestRubricBlock);

      assert.sameMembers(
        blocks.map((block) => block.id),
        idsOf(nodes, "qti-rubric-block.test"),
      );
      assert.strictEqual(blocks.length, 4);
      assert.isTrue(blocks.every((block) => block.view === "candidate"));
      assert.strictEqual(Rows.of(rows, TestRubricBlockUse).length, 2);
      assert.isTrue(Rows.of(rows, TestRubricBlockUse).every((use) => use.value === "instructions"));
      assert.sameMembers(
        Rows.of(rows, TestRubricContentBody).map((body) => body.id),
        idsOf(nodes, "qti-content-body.testRubric"),
      );
      for (const block of blocks) {
        assert.strictEqual(
          Rows.of(rows, Edge).filter(
            (edge) => edge.parent === block.id && edge.childKind === "qti-content-body.testRubric",
          ).length,
          1,
        );
      }

      assert.isTrue(
        Rows.of(rows, Edge)
          .filter(
            (edge) => edge.childKind === "p" && edge.parentKind === "qti-content-body.testRubric",
          )
          .every((edge) => edge.childAncestry.includes("testfb")),
      );
    }),
  );

  suite.effect("test-content's feedback has its rows and binds into the test's declarations", () =>
    Effect.gen(function* feedback() {
      const { documentId, nodes, rows } = yield* fixtureBuilt("test-content", "assessment.xml");
      const feedbacks = Rows.of(rows, TestFeedback);

      assert.sameMembers(
        feedbacks.map((row) => row.id),
        idsOf(nodes, "qti-test-feedback"),
      );
      assert.sameDeepMembers(
        feedbacks.map((row) => [row.identifier, row.access, row.showHide, row.outcomeIdentifier]),
        [
          ["TEST_FB", "atEnd", "show", "TEST_FEEDBACK"],
          ["TEST_FB_DURING", "during", "show", "TEST_FEEDBACK"],
        ],
      );
      assert.sameMembers(
        Rows.of(rows, TestFeedbackTitle).map((row) => row.value),
        ["End of test", "Progress"],
      );
      assert.sameMembers(
        Rows.of(rows, TestFeedbackContentBody).map((row) => row.id),
        idsOf(nodes, "qti-content-body.testFeedback"),
      );

      const bound = Rows.of(rows, FeedbackOutcomeRef);
      const own = bound.filter((ref) => feedbacks.some((row) => row.id === ref.node));
      assert.strictEqual(own.length, 2);
      assert.isTrue(
        own.every(
          (ref) =>
            ref.identifier === "TEST_FEEDBACK" &&
            ref.baseType === "identifier" &&
            ref.cardinality === "multiple" &&
            ref.document === documentId,
        ),
      );
      assert.strictEqual(bound.length, 4);
      assert.strictEqual(Rows.of(rows, FeedbackInline).length, 2);
      assert.isTrue(
        bound
          .filter((ref) => ref.identifier === "s1FB")
          .every((ref) => ref.baseType === "identifier" && ref.cardinality === "single"),
      );

      const outcomes = Rows.of(rows, Declaration).filter((row) => row.kind === "outcome");
      const typed = Rows.of(rows, TypedDeclaration);
      for (const ref of bound) {
        const declaration = outcomes.find(
          (row) => row.document === ref.document && row.identifier === ref.identifier,
        );
        assert.isDefined(declaration);
        assert.isTrue(
          typed.some(
            (row) =>
              row.id === declaration?.id &&
              row.baseType === ref.baseType &&
              row.cardinality === ref.cardinality,
          ),
        );
      }

      const printed = Rows.of(rows, PrintedVariableRef);
      assert.strictEqual(Rows.of(rows, PrintedVariable).length, 3);
      assert.sameDeepMembers(
        printed.map((ref) => [ref.identifier, ref.kind, ref.document]),
        [
          ["SECTION_1_total", "outcome", documentId],
          ["TEST_total", "outcome", documentId],
          ["TEST_total", "outcome", documentId],
        ],
      );
      assert.strictEqual(Rows.of(rows, PrintedVariableVarRef).length, 0);
    }),
  );

  suite.effect(
    "test-content's test-level rows: DocumentLang, tool, stylesheet and context declaration",
    () =>
      Effect.gen(function* testLevel() {
        const { documentId, rows } = yield* fixtureBuilt("test-content", "assessment.xml");

        const [lang] = Rows.of(rows, DocumentLang);
        assert.strictEqual(Rows.of(rows, DocumentLang).length, 1);
        assert.strictEqual(lang?.value, "en");
        assert.strictEqual(lang?.document, documentId);
        assert.strictEqual(lang?.lomGeneral, "no");
        assert.strictEqual(only(Rows.of(rows, NodeXmlLang)).value, "en");

        assert.strictEqual(only(Rows.of(rows, ItemTool)).root, "test");
        assert.deepStrictEqual(
          Rows.of(rows, ItemToolBoth).map((row) => [row.toolName, row.toolVersion]),
          [["Spectatus", "0.1"]],
        );
        assert.strictEqual(Rows.of(rows, Stylesheet).length, 1);
        assert.deepStrictEqual(
          Rows.of(rows, Declaration)
            .filter((row) => row.kind === "context")
            .map((row) => row.identifier),
          ["CONTEXT"],
        );
        assert.strictEqual(Rows.of(rows, ContextDeclarationArm).length, 1);
      }),
  );

  suite.effect(
    "a test's DocumentLang has a row for each distinct language, flagged by the manifest",
    () =>
      Effect.gen(function* languages() {
        const { rows } = yield* built(
          testText(
            `<qti-rubric-block view="candidate" xml:lang="fr"><qti-content-body><p xml:lang=" en ">x</p></qti-content-body></qti-rubric-block>` +
              `<qti-rubric-block view="candidate" xml:lang="en"><qti-content-body><p>y</p></qti-content-body></qti-rubric-block>`,
          ),
          "imsqti_test_xmlv3p0",
          true,
        );

        assert.sameMembers(
          Rows.of(rows, DocumentLang).map((row) => row.value),
          ["en", "fr"],
        );
        assert.isTrue(Rows.of(rows, DocumentLang).every((row) => row.lomGeneral === "yes"));

        const none = yield* built(testText(""));
        assert.strictEqual(Rows.of(none.rows, DocumentLang).length, 0);
      }),
  );

  suite.effect(
    "a section document's rubric binds nothing and its document has no DocumentLang",
    () =>
      Effect.gen(function* sectionBinding() {
        const { documentId, nodes, rows } = yield* fixtureBuilt(
          "test-section-ref",
          "sections/shared.xml",
          "imsqti_section_xmlv3p0",
        );
        const [root] = idsOf(nodes, "qti-assessment-section");

        assert.strictEqual(Rows.of(rows, FeedbackOutcomeRef).length, 0);
        assert.strictEqual(Rows.of(rows, PrintedVariableRef).length, 0);
        assert.strictEqual(Rows.of(rows, PrintedVariableVarRef).length, 0);
        assert.strictEqual(Rows.of(rows, PrintedVariable).length, 1);
        assert.strictEqual(Rows.of(rows, FeedbackInline).length, 1);
        assert.strictEqual(Rows.of(rows, TestRubricBlock).length, 1);
        assert.strictEqual(Rows.of(rows, DocumentLang).length, 0);

        assert.strictEqual(Rows.of(rows, PreCondition).length, 3);

        const rules = Rows.of(rows, BranchRule);
        assert.deepStrictEqual(
          rules.map((rule) => [rule.owner, rule.ownerKind, rule.targetKind, rule.document]),
          [
            [root, "section", "exit", documentId],
            [root, "section", "exit", documentId],
          ],
        );
        assert.deepStrictEqual(
          Rows.of(rows, BranchRuleExit).map((row) => row.exit),
          ["EXIT_SECTION", "EXIT_SECTION"],
        );
      }),
  );

  suite.effect(
    "an undeclared outcome or printed variable of a test is refused as binding-declared",
    () =>
      Effect.gen(function* undeclared() {
        const outcome = `<qti-outcome-declaration identifier="OUT" cardinality="single" base-type="identifier"/>`;
        const feedback = yield* refused(
          testText(
            `${outcome}<qti-test-feedback identifier="F" access="atEnd" show-hide="show" outcome-identifier="MISSING"><qti-content-body><p>x</p></qti-content-body></qti-test-feedback>`,
          ),
        );
        assert.instanceOf(feedback, ItemRefusal);
        assert.strictEqual(feedback.rule, "binding-declared");

        const inline = yield* refused(
          testText(
            `${outcome}<qti-test-feedback identifier="F" access="atEnd" show-hide="show" outcome-identifier="OUT"><qti-content-body><p><qti-feedback-inline identifier="I" show-hide="show" outcome-identifier="MISSING">x</qti-feedback-inline></p></qti-content-body></qti-test-feedback>`,
          ),
        );
        assert.instanceOf(inline, ItemRefusal);
        assert.strictEqual(inline.rule, "binding-declared");

        const printed = yield* refused(
          testText(
            `<qti-rubric-block view="candidate"><qti-content-body><p><qti-printed-variable identifier="MISSING"/></p></qti-content-body></qti-rubric-block>`,
          ),
        );
        assert.instanceOf(printed, ItemRefusal);
        assert.strictEqual(printed.rule, "binding-declared");
      }),
  );

  suite.effect(
    "a test feedback naming a float outcome keeps its row for the database to refuse",
    () =>
      Effect.gen(function* floatOutcome() {
        const { rows } = yield* built(
          testText(
            `<qti-outcome-declaration identifier="OUT" cardinality="single" base-type="float"/>` +
              `<qti-test-feedback identifier="F" access="atEnd" show-hide="show" outcome-identifier="OUT"><qti-content-body><p>x</p></qti-content-body></qti-test-feedback>`,
          ),
        );
        const ref = only(Rows.of(rows, FeedbackOutcomeRef));

        assert.strictEqual(ref.baseType, "float");
        assert.strictEqual(ref.cardinality, "single");
      }),
  );

  suite.effect(
    "a rubric's use is collapsed with its lexical form kept, and a feedback's required attributes are required",
    () =>
      Effect.gen(function* attributes() {
        const { nodes, rows } = yield* built(
          testText(
            `<qti-rubric-block view=" candidate  scorer " use=" instructions "><qti-content-body><p>x</p></qti-content-body></qti-rubric-block>`,
          ),
        );
        const [block] = idsOf(nodes, "qti-rubric-block.test");

        assert.strictEqual(only(Rows.of(rows, TestRubricBlock)).view, "candidate scorer");
        assert.strictEqual(only(Rows.of(rows, TestRubricBlockUse)).value, "instructions");
        assert.sameMembers(
          Rows.of(rows, AttributeLexical)
            .filter((row) => row.node === block)
            .map((row) => [row.attribute, row.value].join("=")),
          ["view= candidate  scorer ", "use= instructions "],
        );

        const noView = yield* refused(
          testText(
            `<qti-rubric-block><qti-content-body><p>x</p></qti-content-body></qti-rubric-block>`,
          ),
        );
        assert.instanceOf(noView, ItemRefusal);
        assert.strictEqual(noView.rule, "required-attribute");

        const noShowHide = yield* refused(
          testText(
            `<qti-outcome-declaration identifier="OUT" cardinality="single" base-type="identifier"/><qti-test-feedback identifier="F" access="atEnd" outcome-identifier="OUT"><qti-content-body><p>x</p></qti-content-body></qti-test-feedback>`,
          ),
        );
        assert.instanceOf(noShowHide, ItemRefusal);
        assert.strictEqual(noShowHide.rule, "required-attribute");

        const badAccess = yield* refused(
          testText(
            `<qti-outcome-declaration identifier="OUT" cardinality="single" base-type="identifier"/><qti-test-feedback identifier="F" access="never" show-hide="show" outcome-identifier="OUT"><qti-content-body><p>x</p></qti-content-body></qti-test-feedback>`,
          ),
        );
        assert.instanceOf(badAccess, ImportRefused);
        assert.strictEqual(badAccess.rule, "attribute-lexical");
      }),
  );

  suite.effect(
    "test-include: each include of the test has its arm and attributes, and the section's its child row",
    () =>
      Effect.gen(function* includes() {
        const { nodes, rows } = yield* fixtureBuilt("test-include", "rtest01.xml");
        const includeIds = idsOf(nodes, "xi:include");
        const [section] = idsOf(nodes, "qti-assessment-section");

        assert.strictEqual(includeIds.length, 3);
        assert.sameMembers(
          Rows.of(rows, XInclude).map((row) => row.id),
          includeIds,
        );
        assert.sameMembers(
          Rows.of(rows, XIncludeHref).map((row) => row.node),
          includeIds,
        );
        assert.sameMembers(
          Rows.of(rows, XIncludeHref).map((row) => row.value),
          ["rtest01-para.xml", "rtest01-para.xml", "rtest01-ref.xml"],
        );
        assert.sameMembers(
          Rows.of(rows, XIncludeParse).map((row) => row.node),
          includeIds,
        );
        assert.isTrue(Rows.of(rows, XIncludeParse).every((row) => row.value === "xml"));

        const counted = Rows.of(rows, StructureChild).filter(
          (row) => row.childKind === "xi:include",
        );
        assert.strictEqual(counted.length, 1);
        assert.strictEqual(counted[0]?.parent, section);
        assert.include(includeIds, counted[0]?.child);
      }),
  );
});
