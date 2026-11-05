/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the tool column the rows under test carry; the shape here is which of the two tool attributes the root wrote, not a structure. */
import path from "node:path";
import type { Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { itemRows } from "#pantry/import/item.ts";
import { stimulusRows } from "#pantry/import/stimulus.ts";
import { Rows, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { FeedbackInline } from "#pantry/schema/feedback.ts";
import { AssessmentItemLabel, ItemTool, ItemToolBoth } from "#pantry/schema/item.ts";
import { NodeClass, NodeXmlLang } from "#pantry/schema/attributes.ts";
import { ChoiceInteraction, InteractionBinding } from "#pantry/schema/interaction.ts";
import { Node } from "#pantry/schema/node.ts";
import {
  AssessmentStimulus,
  ItemStimulusRef,
  ItemStimulusRefTitle,
  StimulusBody,
} from "#pantry/schema/stimulus.ts";
import { TemplateInline } from "#pantry/schema/template.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const packageId: Uuid = "33333333-3333-4333-8333-333333333333";

/**
 * The input of one document of a fixture package.
 */
const inputOf = (fixture: FixtureName, file: string, version: "3.0.0" | "3.0.1") =>
  Effect.gen(function* inputOfFixture() {
    const directory = yield* materialize(fixture);
    const fs = yield* FileSystem.FileSystem;
    const doc = yield* readXml(yield* fs.readFile(path.join(directory, file)));

    return {
      doc,
      packageId,
      path: file,
      resource: file,
      resourceLomHasGeneral: false,
      resourceType: "imsqti_stimulus_xmlv3p0",
      version,
    };
  });

/**
 * The one row of a relation the document wrote.
 */
const only = <Row>(rows: readonly Row[]): Row => {
  assert.strictEqual(rows.length, 1);

  const [row] = rows;
  if (row === undefined) {
    throw new Error("expected one row");
  }

  return row;
};

/**
 * The kind of the node a row's `node` column names.
 */
const kindsOf = (rows: Rows, nodes: readonly string[]): readonly string[] =>
  nodes.map((id) => Rows.of(rows, Node).find((node) => node.id === id)?.kind ?? "");

const stimulusPath = "passages/unbelievableNight.xml";

layer(NodeServices.layer, { excludeTestServices: true })("import/stimulus.ts", (suite) => {
  suite.effect("stimulus-shared yields the stimulus, its body and three item refs", () =>
    Effect.gen(function* shared() {
      const { documentId, rows } = yield* stimulusRows(
        yield* inputOf("stimulus-shared", stimulusPath, "3.0.0"),
        Rows.empty(),
      );

      const document = only(Rows.of(rows, Document));
      assert.strictEqual(document.id, documentId);
      assert.strictEqual(document.root, "stimulus");
      assert.strictEqual(only(Rows.of(rows, DocumentIdentifier)).value, "Stimulus1");
      assert.strictEqual(only(Rows.of(rows, DocumentTitle)).value, "Common Stimulus");
      assert.strictEqual(Rows.of(rows, AssessmentStimulus).length, 1);
      assert.strictEqual(only(Rows.of(rows, StimulusBody)).version, "3.0.0");
      assert.strictEqual(Rows.of(rows, ItemTool).length, 0);
      assert.strictEqual(Rows.of(rows, AssessmentItemLabel).length, 0);
      assert.strictEqual(Rows.of(rows, InteractionBinding).length, 0);

      let items = Rows.empty();
      for (const file of ["exemplar06.xml", "exemplar04.xml", "exemplar05.xml"]) {
        const built = yield* itemRows(
          {
            ...(yield* inputOf("stimulus-shared", file, "3.0.0")),
            resourceType: "imsqti_item_xmlv3p0",
          },
          items,
        );
        items = built.rows;
      }

      const refs = Rows.of(items, ItemStimulusRef);
      assert.strictEqual(refs.length, 3);
      assert.isTrue(refs.every((ref) => ref.identifier === "Stimulus1"));
      assert.isTrue(refs.every((ref) => ref.href === stimulusPath));
      assert.deepStrictEqual(
        Rows.of(items, ItemStimulusRefTitle).map((row) => row.value),
        ["An Unbelievable Night"],
      );
    }),
  );

  suite.effect(
    "stimulus-301 yields the body's family rows, the root's tool and label, bare content",
    () =>
      Effect.gen(function* withThreeOhOne() {
        const { rows } = yield* stimulusRows(
          yield* inputOf("stimulus-301", stimulusPath, "3.0.1"),
          Rows.empty(),
        );

        assert.strictEqual(only(Rows.of(rows, StimulusBody)).version, "3.0.1");

        const tool = only(Rows.of(rows, ItemTool));
        assert.strictEqual(tool.root, "stimulus");
        assert.strictEqual(tool.shape, "both");

        const both = only(Rows.of(rows, ItemToolBoth));
        assert.strictEqual(both.toolName, "qti-pie");
        assert.strictEqual(both.toolVersion, "1.0");

        const label = only(Rows.of(rows, AssessmentItemLabel));
        assert.strictEqual(label.root, "stimulus");
        assert.strictEqual(label.value, "Passage");
        assert.strictEqual(label.version, "3.0.1");

        const bodyId = only(Rows.of(rows, StimulusBody)).id;
        assert.deepStrictEqual(
          Rows.of(rows, NodeClass)
            .filter((row) => row.node === bodyId)
            .map((row) => row.value),
          ["passage"],
        );
        assert.deepStrictEqual(
          kindsOf(
            rows,
            Rows.of(rows, NodeXmlLang).map((row) => row.node),
          ).toSorted(),
          ["qti-assessment-stimulus", "qti-stimulus-body"],
        );

        assert.strictEqual(Rows.of(rows, InteractionBinding).length, 0);
        assert.strictEqual(Rows.of(rows, ChoiceInteraction).length, 0);
        assert.strictEqual(Rows.of(rows, FeedbackInline).length, 1);
        assert.strictEqual(Rows.of(rows, TemplateInline).length, 1);
      }),
  );

  suite.effect("a root that is not a stimulus is refused as unmodeled vocabulary", () =>
    Effect.gen(function* notAStimulus() {
      const input = yield* inputOf("stimulus-shared", "exemplar06.xml", "3.0.0");
      const failure = yield* Effect.flip(stimulusRows(input, Rows.empty()));
      assert.instanceOf(failure, UnmodeledVocabulary);
    }),
  );
});
