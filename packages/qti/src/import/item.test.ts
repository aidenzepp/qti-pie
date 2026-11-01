import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { inject } from "vitest";
import { itemRows } from "#qti/import/item.ts";
import { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { NodeIndex } from "#qti/import/tree.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { Img, ImgHeight, ImgLongdesc, ImgWidth, P } from "#qti/schema/html.ts";
import { AssessmentItem, DeclaredAdaptive, ItemBody, Prompt } from "#qti/schema/item.ts";
import {
  AttributeEntityReference,
  AttributeLexical,
  Edge,
  EntityReference,
  Text,
} from "#qti/schema/node.ts";
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
