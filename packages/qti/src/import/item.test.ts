/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the declaration column the rows under test carry; the shape here is the typed-or-record choice, not a structure. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { inject } from "vitest";
import { ItemRefusal, itemRows, standardTemplate } from "#qti/import/item.ts";
import { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { NodeIndex } from "#qti/import/tree.ts";
import {
  Declaration,
  DeclarationInterpretation,
  OutcomeDeclarationArm,
  ResponseDeclarationArm,
  ResponseDeclarationId,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import { Document, DocumentId, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { Img, ImgHeight, ImgLongdesc, ImgWidth, P } from "#qti/schema/html.ts";
import { AssessmentItem, DeclaredAdaptive, ItemBody, Prompt } from "#qti/schema/item.ts";
import {
  ChoiceInteraction,
  DeclaredMaxChoices,
  DeclaredMinChoices,
  DeclaredOrientation,
  DeclaredShuffle,
  InteractionBinding,
  SimpleChoice,
  TypedBinding,
} from "#qti/schema/interaction.ts";
import {
  AttributeEntityReference,
  AttributeLexical,
  Edge,
  EntityReference,
  Text,
} from "#qti/schema/node.ts";
import {
  ResponseProcessing,
  ResponseProcessingItem,
  ResponseProcessingTemplate,
  StandardTemplateReference,
} from "#qti/schema/processing.ts";
import * as value from "#qti/schema/value.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";

const packageId = "22222222-2222-4222-8222-222222222222";

/**
 * Read `choice.xml` of a materialized fixture directory, after replacing every occurrence of
 * `search` with `replacement` when an edit is given.
 */
const readChoice = (directory: string, edit?: readonly [search: string, replacement: string]) =>
  Effect.gen(function* readChoiceFile() {
    const fs = yield* FileSystem.FileSystem;
    const bytes = yield* fs.readFile(path.join(directory, "choice.xml"));
    if (edit === undefined) {
      return yield* readXml(bytes);
    }

    const text = new TextDecoder().decode(bytes);
    assert.isTrue(text.includes(edit[0]), `choice.xml holds ${edit[0]}`);

    return yield* readXml(new TextEncoder().encode(text.replaceAll(edit[0], edit[1])));
  });

/**
 * The ids of the nodes of one kind, in document order.
 */
const idsOf = (nodes: NodeIndex, kind: string) =>
  [...nodes.values()].filter((entry) => entry.kind === kind).map((entry) => entry.id);

/**
 * The id of the first node of one kind; the kinds the tests ask for are present.
 */
const onlyId = (nodes: NodeIndex, kind: string) =>
  Option.getOrThrow(Option.fromNullishOr(idsOf(nodes, kind)[0]));

/**
 * The id of the node of one kind at `index` in document order; the nodes the tests ask for are
 * present.
 */
const idAt = (nodes: NodeIndex, kind: string, index: number) =>
  Option.getOrThrow(Option.fromNullishOr(idsOf(nodes, kind)[index]));

/**
 * The item rows of a decoded `choice.xml`, for the resource the tests describe.
 */
const itemOf = (doc: Effect.Success<ReturnType<typeof readChoice>>) =>
  itemRows(
    {
      doc,
      packageId,
      path: "choice.xml",
      resource: "choice",
      resourceType: "imsqti_item_xmlv3p0",
      version: "3.0.0",
    },
    Rows.empty(),
  );

layer(NodeServices.layer, { excludeTestServices: true })("import/item.ts", (suite) => {
  suite.effect(
    "choice.xml yields the document, the item root, its body, prompt, ps and image",
    () =>
      Effect.gen(function* choiceItem() {
        const doc = yield* readChoice(inject("fixtures").simple);
        const { documentId, nodes, rows } = yield* itemOf(doc);
        const idOf = (kind: string) => onlyId(nodes, kind);
        const root = idOf("qti-assessment-item");
        const body = idOf("qti-item-body");
        const prompt = idOf("qti-prompt");
        const interaction = idOf("qti-choice-interaction");

        assert.deepStrictEqual(Rows.of(rows, Document), [
          {
            id: documentId,
            package: packageId,
            path: "choice.xml",
            resource: "choice",
            resourceType: "imsqti_item_xmlv3p0",
            root: "item",
            version: "3.0.0",
          },
        ]);

        const common = {
          document: documentId,
          package: packageId,
          resource: "choice",
          root: "item" as const,
        };
        assert.deepStrictEqual(Rows.of(rows, DocumentIdentifier), [{ ...common, value: "choice" }]);
        assert.deepStrictEqual(Rows.of(rows, DocumentTitle), [
          { ...common, collapsed: "Unattended Luggage", value: "Unattended Luggage" },
        ]);
        assert.deepStrictEqual(Rows.of(rows, AssessmentItem), [
          { adaptive: "false", id: root, timeDependent: "false" },
        ]);
        assert.deepStrictEqual(Rows.of(rows, DeclaredAdaptive), [{ node: root }]);
        assert.deepStrictEqual(Rows.of(rows, ItemBody), [{ id: body, item: root }]);
        assert.deepStrictEqual(Rows.of(rows, Prompt), [{ id: prompt, parent: interaction }]);
        assert.strictEqual(Rows.of(rows, P).length, 2);
        assert.deepStrictEqual(
          Rows.of(rows, P),
          idsOf(nodes, "p").map((id) => ({ id })),
        );

        const edges = Rows.of(rows, Edge);
        for (const row of Rows.of(rows, P)) {
          assert.isTrue(edges.some((edge) => edge.child === row.id && edge.parent === body));
        }
        assert.deepStrictEqual(Rows.of(rows, Img), [
          {
            alt: "NEVER LEAVE LUGGAGE UNATTENDED",
            id: idOf("img"),
            src: "images/sign.png",
          },
        ]);
        assert.deepStrictEqual(Rows.of(rows, ImgLongdesc), []);
        assert.deepStrictEqual(Rows.of(rows, ImgHeight), []);
        assert.deepStrictEqual(Rows.of(rows, ImgWidth), []);
        assert.deepStrictEqual(Rows.of(rows, AttributeLexical), []);
      }),
  );

  suite.effect("the doctype fixture defaults adaptive and expands the entity in the prompt", () =>
    Effect.gen(function* doctypeItem() {
      const doc = yield* readChoice(yield* materialize("doctype"));
      const { nodes, rows } = yield* itemOf(doc);
      const root = onlyId(nodes, "qti-assessment-item");
      const prompt = onlyId(nodes, "qti-prompt");
      const texts = new Map(Rows.of(rows, Text).map((row) => [row.id, row.value]));
      const promptText = Rows.of(rows, Edge)
        .filter((edge) => edge.parent === prompt)
        .toSorted((left, right) => Number(left.position - right.position))
        .map((edge) => texts.get(edge.child) ?? "")
        .join("");

      assert.deepStrictEqual(Rows.of(rows, DeclaredAdaptive), [{ node: root }]);
      assert.strictEqual(promptText, "What does it say? 1EdTech & friends");
    }),
  );

  suite.effect("the external fixture yields entity reference rows", () =>
    Effect.gen(function* externalItem() {
      const doc = yield* readChoice(yield* materialize("external"));
      const { rows } = yield* itemOf(doc);

      assert.deepStrictEqual(
        Rows.of(rows, EntityReference).map((row) => row.name),
        ["undeclared"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, AttributeEntityReference).map((row) => row.name),
        ["undeclared"],
      );
    }),
  );

  suite.effect("the padded-attributes fixture collapses, replaces and preserves by class", () =>
    Effect.gen(function* paddedItem() {
      const doc = yield* readChoice(yield* materialize("padded-attributes"));
      const { documentId, nodes, rows } = yield* itemOf(doc);
      const root = onlyId(nodes, "qti-assessment-item");
      const img = onlyId(nodes, "img");

      assert.deepStrictEqual(
        Rows.of(rows, DocumentIdentifier).map((row) => row.value),
        ["choice"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, AssessmentItem).map((row) => row.adaptive),
        ["false"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, DocumentTitle).map((row) => [row.value, row.collapsed]),
        [["Unattended Luggage", "Unattended Luggage"]],
      );
      assert.deepStrictEqual(
        Rows.of(rows, Img).map((row) => [row.src, row.alt]),
        [["images/sign.png", "NEVER\tLEAVE LUGGAGE UNATTENDED"]],
      );

      const lexical = (id: string, name: string) =>
        Rows.of(rows, AttributeLexical)
          .filter((row) => row.node === id && row.attribute === name)
          .map((row) => row.value);
      assert.deepStrictEqual(lexical(root, "identifier"), [" choice "]);
      assert.deepStrictEqual(lexical(root, "adaptive"), [" false "]);
      assert.deepStrictEqual(lexical(img, "src"), [" images/sign.png "]);
      assert.deepStrictEqual(lexical(root, "title"), ["Unattended\tLuggage"]);
      assert.deepStrictEqual(lexical(img, "alt"), []);
      assert.isString(documentId);
    }),
  );

  suite.effect("choice.xml yields its declarations, values, binding, choices and processing", () =>
    Effect.gen(function* choiceSemantics() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const { documentId, nodes, rows } = yield* itemOf(doc);
      const response = onlyId(nodes, "qti-response-declaration");
      const outcome = onlyId(nodes, "qti-outcome-declaration");
      const correct = onlyId(nodes, "qti-correct-response");
      const initial = onlyId(nodes, "qti-default-value");
      const interaction = onlyId(nodes, "qti-choice-interaction");
      const correctValue = idAt(nodes, "qti-value", 0);
      const defaultValue = idAt(nodes, "qti-value", 1);

      assert.deepStrictEqual(Rows.of(rows, Declaration), [
        {
          document: documentId,
          id: response,
          identifier: "RESPONSE",
          kind: "response",
          shape: "typed",
        },
        {
          document: documentId,
          id: outcome,
          identifier: "SCORE",
          kind: "outcome",
          shape: "typed",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ResponseDeclarationArm), [{ id: response }]);
      assert.deepStrictEqual(Rows.of(rows, OutcomeDeclarationArm), [{ id: outcome }]);
      assert.deepStrictEqual(Rows.of(rows, TypedDeclaration), [
        {
          baseType: "identifier",
          cardinality: "single",
          document: documentId,
          id: response,
          identifier: "RESPONSE",
        },
        {
          baseType: "float",
          cardinality: "single",
          document: documentId,
          id: outcome,
          identifier: "SCORE",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DocumentId), [
        { document: documentId, holder: "responseDeclaration", id: "RESPONSE" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ResponseDeclarationId), [
        { document: documentId, id: "RESPONSE", node: response },
      ]);

      assert.deepStrictEqual(Rows.of(rows, value.ValueSet), [
        { declaration: response, id: correct, role: "correct", shape: "typed" },
        { declaration: outcome, id: initial, role: "default", shape: "typed" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, value.TypedValueSet), [
        { baseType: "identifier", cardinality: "single", declaration: response, id: correct },
        { baseType: "float", cardinality: "single", declaration: outcome, id: initial },
      ]);
      assert.deepStrictEqual(Rows.of(rows, value.CorrectResponseArm), [{ id: correct }]);
      assert.deepStrictEqual(Rows.of(rows, value.DefaultValueArm), [{ id: initial }]);
      assert.deepStrictEqual(Rows.of(rows, value.DeclaredValue), [
        {
          baseType: "identifier",
          id: correctValue,
          position: 1n,
          shape: "typed",
          valueSet: correct,
        },
        { baseType: "float", id: defaultValue, position: 1n, shape: "typed", valueSet: initial },
      ]);
      assert.deepStrictEqual(Rows.of(rows, value.relations.DeclaredValueIdentifier), [
        { id: correctValue, value: "ChoiceA" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, value.relations.DeclaredValueFloat), [
        { id: defaultValue, value: "0" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, value.RecordField), []);

      assert.deepStrictEqual(Rows.of(rows, ChoiceInteraction), [
        {
          id: interaction,
          maxChoices: "1",
          maxChoicesN: 1n,
          minChoices: "0",
          minChoicesN: 0n,
          orientation: "vertical",
          responseIdentifier: "RESPONSE",
          rootKind: "item",
          shuffle: "false",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredShuffle), [{ node: interaction }]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredMaxChoices), [{ node: interaction }]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredMinChoices), []);
      assert.deepStrictEqual(Rows.of(rows, DeclaredOrientation), []);
      assert.deepStrictEqual(Rows.of(rows, InteractionBinding), [
        {
          document: documentId,
          interactionKind: "qti-choice-interaction",
          node: interaction,
          responseIdentifier: "RESPONSE",
          shape: "typed",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TypedBinding), [
        {
          baseType: "identifier",
          cardinality: "single",
          document: documentId,
          interactionKind: "qti-choice-interaction",
          maxCount: 1n,
          node: interaction,
          responseIdentifier: "RESPONSE",
        },
      ]);

      assert.deepStrictEqual(
        Rows.of(rows, SimpleChoice),
        ["ChoiceA", "ChoiceB", "ChoiceC"].map((identifier, index) => ({
          fixed: "false" as const,
          id: idAt(nodes, "qti-simple-choice", index),
          identifier,
          interaction,
          showHide: "show" as const,
        })),
      );

      const processing = onlyId(nodes, "qti-response-processing");
      const root = onlyId(nodes, "qti-assessment-item");
      assert.deepStrictEqual(Rows.of(rows, ResponseProcessing), [
        { id: processing, rootKind: "item" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ResponseProcessingItem), [
        { id: processing, item: root },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ResponseProcessingTemplate), [
        {
          node: processing,
          uri: "https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, StandardTemplateReference), [
        { node: processing, template: "match_correct" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DeclarationInterpretation), []);
    }),
  );

  suite.effect("a response-identifier naming no declaration is refused binding-declared", () =>
    Effect.gen(function* undeclaredBinding() {
      const doc = yield* readChoice(inject("fixtures").simple, [
        'response-identifier="RESPONSE"',
        'response-identifier="RESP"',
      ]);
      const error = yield* Effect.flip(itemOf(doc));

      assert.instanceOf(error, ItemRefusal);
      assert.strictEqual(error.rule, "binding-declared");
    }),
  );

  suite.effect("the padded-attributes fixture processes the declaration, choice and template", () =>
    Effect.gen(function* paddedSemantics() {
      const doc = yield* readChoice(yield* materialize("padded-attributes"));
      const { nodes, rows } = yield* itemOf(doc);
      const interaction = onlyId(nodes, "qti-choice-interaction");

      assert.deepStrictEqual(
        Rows.of(rows, ChoiceInteraction).map((row) => [
          row.responseIdentifier,
          row.maxChoices,
          row.maxChoicesN,
        ]),
        [["RESPONSE", "1", 1n]],
      );
      assert.strictEqual(Rows.of(rows, SimpleChoice)[0]?.identifier, "ChoiceA");
      assert.deepStrictEqual(
        Rows.of(rows, ResponseProcessingTemplate).map((row) => row.uri),
        ["https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, InteractionBinding).map((row) => [row.node, row.responseIdentifier]),
        [[interaction, "RESPONSE"]],
      );

      const lexical = Rows.of(rows, AttributeLexical);
      assert.deepStrictEqual(lexical.map((row) => row.attribute).toSorted(), [
        "adaptive",
        "identifier",
        "identifier",
        "max-choices",
        "response-identifier",
        "src",
        "template",
        "title",
      ]);
      assert.deepStrictEqual(
        lexical.filter((row) => row.attribute === "alt"),
        [],
      );
    }),
  );

  suite.effect("the padded-text fixture replaces the default value's whitespace characters", () =>
    Effect.gen(function* paddedText() {
      const doc = yield* readChoice(yield* materialize("padded-text"));
      const { documentId, nodes, rows } = yield* itemOf(doc);
      const note = idAt(nodes, "qti-outcome-declaration", 1);

      assert.strictEqual(Rows.of(rows, Declaration).length, 3);
      assert.deepStrictEqual(
        Rows.of(rows, Declaration)
          .filter((row) => row.identifier === "NOTE")
          .map((row) => [row.id, row.kind, row.shape, row.document]),
        [[note, "outcome", "typed", documentId]],
      );
      assert.deepStrictEqual(
        Rows.of(rows, TypedDeclaration)
          .filter((row) => row.identifier === "NOTE")
          .map((row) => [row.baseType, row.cardinality]),
        [["string", "single"]],
      );
      assert.deepStrictEqual(
        Rows.of(rows, value.relations.DeclaredValueString).map((row) => row.value),
        ["a b c"],
      );
    }),
  );

  suite.effect("standardTemplate maps the four published URI forms and refuses the rest", () =>
    Effect.sync(() => {
      const forms = [
        "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/",
        "https://www.imsglobal.org/question/qti_v3p0/rptemplates/",
      ].flatMap((prefix) => [`${prefix}map_response`, `${prefix}map_response.xml`]);
      for (const form of forms) {
        assert.deepStrictEqual(standardTemplate(form), Option.some("map_response"));
      }

      for (const refused of [
        "https://example.com/rptemplates/map_response",
        "https://www.imsglobal.org/question/qti_v3p0/rptemplates/unknown",
        "https://www.imsglobal.org/question/qti_v3p0/rptemplates/map_response.xml.xml",
        "https://www.imsglobal.org/question/qti_v3p0/rptemplates/",
        "",
      ]) {
        assert.deepStrictEqual(standardTemplate(refused), Option.none());
      }
    }),
  );

  suite.effect("the simple fixture has no attribute lexical rows", () =>
    Effect.gen(function* simpleLexical() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const { rows } = yield* itemOf(doc);

      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), []);
    }),
  );

  suite.effect("a root that is not qti-assessment-item is refused as unmodeled vocabulary", () =>
    Effect.gen(function* testRoot() {
      const doc = yield* readChoice(inject("fixtures").simple, [
        "qti-assessment-item",
        "qti-assessment-test",
      ]);
      const error = yield* Effect.flip(itemOf(doc));

      assert.instanceOf(error, UnmodeledVocabulary);
      assert.deepStrictEqual(
        { kind: error.kind, name: error.name, parent: Option.isNone(error.parent) },
        { kind: "element", name: "qti-assessment-test", parent: true },
      );
    }),
  );
});
