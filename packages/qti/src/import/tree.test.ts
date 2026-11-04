/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the declarations under test carry. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, it, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option } from "effect";
import { inject } from "vitest";
import { XmlBaseUri, NamespacePrefix, NamespaceUri, XmlEntityName } from "#qti/schema/contracts.ts";
import {
  AttributeEntityReference,
  AttributeLexical,
  AttributeSpelling,
  Comment,
  Edge,
  EntityReference,
  NamespaceDeclaration,
  Node,
  Pi,
  SchemaLocation,
  TextNode,
  Tree,
  TreeDoctype,
  TreeExportCharset,
  TreeMisc,
  TreeRoot,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
  Ws,
} from "#qti/schema/node.ts";
import { NodeXmlBase, NodeXmlLang } from "#qti/schema/attributes.ts";
import { attributeRows } from "#qti/import/attributes.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { GuardRefusal, treeGuards } from "#qti/import/guards/tree.ts";
import {
  closedOf,
  collapse,
  integerOf,
  kindOf,
  replace,
  Rows,
  spelledInteger,
  treeRows,
  typedAttribute,
  UnmodeledVocabulary,
  valueText,
} from "#qti/import/tree.ts";
import type { NodeIndex, TreeInput } from "#qti/import/tree.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element } from "#qti/xml/tree.ts";

const treeId = "11111111-1111-4111-8111-111111111111";

/**
 * The id of the node of `kind` an index holds; the tests' documents hold one of each kind they ask
 * for.
 */
const idOf = (nodes: NodeIndex, kind: string): string =>
  Option.getOrThrow(
    Option.fromNullishOr([...nodes.values()].find((found) => found.kind === kind)?.id),
  );

/**
 * The input of an item document whose charset is the one the reader decoded it under.
 */
const itemInput = (charset: string): TreeInput => ({
  charset,
  id: treeId,
  kind: "document",
  root: "item",
  version: "3.0.0",
});

/**
 * Read `choice.xml` of a materialized fixture directory, after replacing the first occurrence of
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

    return yield* readXml(new TextEncoder().encode(text.replace(edit[0], edit[1])));
  });

layer(NodeServices.layer, { excludeTestServices: true })("import/tree.ts", (suite) => {
  suite.effect("choice.xml yields one Tree row and the prolog fidelity rows", () =>
    Effect.gen(function* choiceRows() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const { rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());

      assert.deepStrictEqual(Rows.of(rows, Tree), [
        { charset: "UTF-8", id: treeId, kind: "document", root: "item", version: "3.0.0" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TreeMisc), [
        {
          kind: "comment",
          placement: "prolog",
          position: 0n,
          text: " This example adapted from the PET Handbook, copyright University of Cambridge ESOL Examinations ",
          tree: treeId,
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TreeXmlVersion), [{ tree: treeId, value: "1.0" }]);
      assert.deepStrictEqual(Rows.of(rows, TreeXmlEncoding), [{ tree: treeId, value: "UTF-8" }]);
      assert.deepStrictEqual(Rows.of(rows, TreeXmlStandalone), []);
      assert.deepStrictEqual(Rows.of(rows, TreeDoctype), []);
      assert.deepStrictEqual(Rows.of(rows, TreeExportCharset), []);
    }),
  );

  suite.effect("a standalone of yes or no is a TreeXmlStandalone handle", () =>
    Effect.gen(function* standaloneRows() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const { declaration } = doc;
      assert.isTrue(Option.isSome(declaration));

      for (const standalone of ["yes", "no"] as const) {
        const declared = declaration.pipe(
          Option.map((found) => ({ ...found, standalone: Option.some(standalone) })),
        );
        const { rows } = yield* treeRows(
          { ...doc, declaration: declared },
          itemInput(doc.charset),
          Rows.empty(),
        );

        assert.deepStrictEqual(Rows.of(rows, TreeXmlStandalone), [
          { tree: treeId, value: standalone },
        ]);
      }
    }),
  );

  suite.effect("a standalone outside yes and no is refused value-lexical before any row", () =>
    Effect.gen(function* standaloneRefused() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const declared = doc.declaration.pipe(
        Option.map((found) => ({ ...found, standalone: Option.some("maybe") })),
      );
      const failure = yield* Effect.flip(
        treeRows({ ...doc, declaration: declared }, itemInput(doc.charset), Rows.empty()),
      );

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "value-lexical");
    }),
  );

  suite.effect("the windows-1252 fixture yields a TreeExportCharset row of UTF-8", () =>
    Effect.gen(function* windows1252() {
      const doc = yield* readChoice(yield* materialize("windows-1252"));
      const { rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());

      assert.deepStrictEqual(
        Rows.of(rows, Tree).map((row) => row.charset),
        ["windows-1252"],
      );
      assert.deepStrictEqual(Rows.of(rows, TreeExportCharset), [{ label: "UTF-8", tree: treeId }]);
    }),
  );

  suite.effect("the doctype fixture yields a TreeDoctype row holding the DOCTYPE text whole", () =>
    Effect.gen(function* doctype() {
      const doc = yield* readChoice(yield* materialize("doctype"));
      const { rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
      const text = Option.getOrThrow(doc.doctype);

      assert.isTrue(text.startsWith("<!DOCTYPE qti-assessment-item"));
      assert.deepStrictEqual(Rows.of(rows, TreeDoctype), [{ text, tree: treeId }]);
    }),
  );

  suite.effect("choice.xml yields its node, edge, arm, namespace and root rows", () =>
    Effect.gen(function* choiceNodes() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const { nodes, rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
      const nodeRows = Rows.of(rows, Node);
      const byId = new Map(nodeRows.map((row) => [row.id, row]));
      const ofKind = (kind: string) => nodeRows.filter((row) => row.kind === kind);
      const elements = nodeRows.filter(
        (row) => !["text", "ws", "comment", "pi", "entityRef"].includes(row.kind),
      );

      // The spec's 3.4 count of elements in choice.xml.
      assert.strictEqual(elements.length, 17);
      assert.strictEqual(nodes.size, 17);

      // One whitespace run lies between every pair of tags of an element that holds elements: the
      // root 4 children (5 runs), the response and outcome declarations and their value holders
      // (2 each, 4 elements), the item body 3 (4), the second p 1 (2) and the interaction 4 (5).
      assert.strictEqual(ofKind("ws").length, 24);
      assert.deepStrictEqual(
        Rows.of(rows, TextNode)
          .map((row) => row.value)
          .toSorted(),
        [
          "0",
          "ChoiceA",
          "Do not let someone else look after your luggage.",
          "Look at the text in the picture.",
          "Remember your luggage when you leave.",
          "What does it say?",
          "You must stay with your luggage at all times.",
        ],
      );
      assert.strictEqual(ofKind("text").length, 7);
      assert.strictEqual(Rows.of(rows, Ws).length, 24);
      assert.strictEqual(nodeRows.length, 17 + 24 + 7);
      assert.isTrue(
        nodeRows.every(
          (row) =>
            row.tree === treeId &&
            row.version === "3.0.0" &&
            row.rootKind === "item" &&
            (elements.includes(row) || row.prefix === ""),
        ),
      );

      const edges = Rows.of(rows, Edge);
      assert.strictEqual(edges.length, nodeRows.length - 1);

      const children = Map.groupBy(edges, (edge) => edge.parent);
      for (const [parent, own] of children) {
        assert.deepStrictEqual(
          own.map((edge) => edge.position).toSorted((a, b) => Number(a - b)),
          own.map((_, position) => BigInt(position)),
          `positions under ${parent}`,
        );
        for (const edge of own) {
          assert.strictEqual(edge.parentKind, byId.get(parent)?.kind);
          assert.strictEqual(edge.childKind, byId.get(edge.child)?.kind);
          assert.strictEqual(edge.tree, treeId);
          assert.strictEqual(edge.version, "3.0.0");
        }
      }

      const root = Option.getOrThrow(Option.fromNullishOr(nodes.get(doc.root)));
      assert.deepStrictEqual(Rows.of(rows, TreeRoot), [{ node: root.id, tree: treeId }]);
      assert.strictEqual(root.id, treeId);
      assert.strictEqual(root.kind, "qti-assessment-item");
      assert.isFalse(edges.some((edge) => edge.child === root.id));
      assert.deepStrictEqual(Rows.of(rows, NamespaceDeclaration), [
        { node: root.id, position: 0n, prefix: "", uri: NamespaceUri(doc.root.namespace) },
        {
          node: root.id,
          position: 1n,
          prefix: "xsi",
          uri: NamespaceUri("http://www.w3.org/2001/XMLSchema-instance"),
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, SchemaLocation), [
        {
          node: root.id,
          prefix: NamespacePrefix("xsi"),
          value:
            "http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, Comment), []);
      assert.deepStrictEqual(Rows.of(rows, Pi), []);
      assert.deepStrictEqual(Rows.of(rows, EntityReference), []);
      assert.deepStrictEqual(Rows.of(rows, AttributeEntityReference), []);
    }),
  );

  suite.effect("imsmanifest.xml yields 58 element nodes and four namespace declarations", () =>
    Effect.gen(function* manifestNodes() {
      const fs = yield* FileSystem.FileSystem;
      const bytes = yield* fs.readFile(path.join(inject("fixtures").simple, "imsmanifest.xml"));
      const doc = yield* readXml(bytes);
      const { nodes, rows } = yield* treeRows(
        doc,
        { charset: doc.charset, id: treeId, kind: "manifest", root: "manifest", version: "3.0.0" },
        Rows.empty(),
      );
      const root = Option.getOrThrow(Option.fromNullishOr(nodes.get(doc.root)));

      assert.strictEqual(nodes.size, 58);
      assert.deepStrictEqual(Rows.of(rows, TreeRoot), [{ node: treeId, tree: treeId }]);
      assert.strictEqual(root.id, treeId);
      assert.strictEqual(
        Rows.of(rows, Node).filter(
          (row) => !["text", "ws", "comment", "pi", "entityRef"].includes(row.kind),
        ).length,
        58,
      );
      assert.strictEqual(Rows.of(rows, NamespaceDeclaration).length, 4);
      assert.isTrue(Rows.of(rows, NamespaceDeclaration).every((row) => row.node === root.id));
      assert.deepStrictEqual(
        Rows.of(rows, NamespaceDeclaration).map((row) => row.position),
        [0n, 1n, 2n, 3n],
      );
    }),
  );

  suite.effect("an entity reference in the prompt and in alt yields node and attribute rows", () =>
    Effect.gen(function* externalReferences() {
      const doc = yield* readChoice(yield* materialize("external"));
      const { nodes, rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
      const refNodes = Rows.of(rows, Node).filter((row) => row.kind === "entityRef");
      const refNode = Option.getOrThrow(Option.fromNullishOr(refNodes[0]));
      const prompt = Option.getOrThrow(
        Option.fromNullishOr(Rows.of(rows, Node).find((row) => row.kind === "qti-prompt")),
      );
      const img = Option.getOrThrow(
        Option.fromNullishOr([...nodes].find(([element]) => element.local === "img")?.[1]),
      );

      assert.strictEqual(refNodes.length, 1);
      assert.deepStrictEqual(Rows.of(rows, EntityReference), [
        { id: refNode.id, name: XmlEntityName("undeclared") },
      ]);
      assert.deepStrictEqual(
        Rows.of(rows, Edge)
          .filter((edge) => edge.child === refNode.id)
          .map((edge) => [edge.parent, edge.parentKind, edge.childKind]),
        [[prompt.id, "qti-prompt", "entityRef"]],
      );
      // `NEVER LEAVE LUGGAGE &undeclared;`: the `&` is at zero-based index 20.
      assert.deepStrictEqual(Rows.of(rows, AttributeEntityReference), [
        { attribute: "alt", name: XmlEntityName("undeclared"), node: img.id, offset: 20n },
      ]);
    }),
  );

  suite.effect("an element outside the registries is refused by name", () =>
    Effect.gen(function* unmodeledElement() {
      const doc = yield* readChoice(inject("fixtures").simple, [
        "<qti-prompt>",
        "<qti-made-up>x</qti-made-up><qti-prompt>",
      ]);
      const exit = yield* Effect.exit(treeRows(doc, itemInput(doc.charset), Rows.empty()));

      assert.isTrue(Exit.isFailure(exit));

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      const refusal = Option.getOrThrow(failure);
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.kind, "element");
      assert.strictEqual(refusal.name, "qti-made-up");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-choice-interaction"));
    }),
  );

  suite.effect("an attribute outside the registry is refused by name", () =>
    Effect.gen(function* unmodeledAttribute() {
      const doc = yield* readChoice(inject("fixtures").simple, [
        "<qti-assessment-item ",
        '<qti-assessment-item class="x" ',
      ]);
      const exit = yield* Effect.exit(treeRows(doc, itemInput(doc.charset), Rows.empty()));

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      const refusal = Option.getOrThrow(failure);
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.kind, "attribute");
      assert.strictEqual(refusal.name, "class");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-assessment-item"));
    }),
  );

  suite.effect(
    "an xml:lang the prompt's registry lists is modeled and written by attributeRows",
    () =>
      Effect.gen(function* promptLang() {
        const doc = yield* readChoice(inject("fixtures").simple, [
          "<qti-prompt>",
          '<qti-prompt xml:lang="en">',
        ]);
        const { nodes, rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
        const built = yield* attributeRows(doc.root, nodes, treeId, rows);
        const prompt = idOf(nodes, "qti-prompt");

        assert.deepStrictEqual(Rows.of(built, NodeXmlLang), [
          {
            attribute: "xml:lang",
            kind: "qti-prompt",
            node: prompt,
            rootKind: "item",
            tree: treeId,
            value: "en",
          },
        ]);
      }),
  );

  suite.effect("an xml:base a paragraph's registry lists is modeled and written", () =>
    Effect.gen(function* paragraphBase() {
      const doc = yield* readChoice(inject("fixtures").simple, ["<p>", '<p xml:base="a/">']);
      const { nodes, rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
      const built = yield* attributeRows(doc.root, nodes, treeId, rows);
      const paragraph = idOf(nodes, "p");

      assert.deepStrictEqual(Rows.of(built, NodeXmlBase), [
        { attribute: "xml:base", kind: "p", node: paragraph, value: XmlBaseUri("a/") },
      ]);
    }),
  );

  suite.effect("an xml:space no registry lists is refused by its qualified name", () =>
    Effect.gen(function* xmlSpace() {
      const doc = yield* readChoice(inject("fixtures").simple, ["<p>", '<p xml:space="preserve">']);
      const exit = yield* Effect.exit(treeRows(doc, itemInput(doc.charset), Rows.empty()));

      const refusal = Option.getOrThrow(
        Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none(),
      );
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.kind, "attribute");
      assert.strictEqual(refusal.name, "xml:space");
      assert.deepStrictEqual(refusal.parent, Option.some("p"));
    }),
  );

  suite.effect("an xml:lang on a kind whose registry lacks it is still refused", () =>
    Effect.gen(function* declarationLang() {
      const doc = yield* readChoice(inject("fixtures").simple, [
        "<qti-response-declaration ",
        '<qti-response-declaration xml:lang="en" ',
      ]);
      const exit = yield* Effect.exit(treeRows(doc, itemInput(doc.charset), Rows.empty()));

      const refusal = Option.getOrThrow(
        Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none(),
      );
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.kind, "attribute");
      assert.strictEqual(refusal.name, "xml:lang");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-response-declaration"));
    }),
  );

  suite.effect("a manifest's lom:string xml:lang is modeled under the manifest root", () =>
    Effect.gen(function* manifestLang() {
      const doc = yield* readXml(
        new TextEncoder().encode(
          '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><imsmd:lom><imsmd:general><imsmd:title><imsmd:string xml:lang="en">T</imsmd:string></imsmd:title></imsmd:general></imsmd:lom></metadata></manifest>',
        ),
      );
      const input: TreeInput = {
        charset: doc.charset,
        id: treeId,
        kind: "manifest",
        root: "manifest",
        version: "3.0.0",
      };
      const { nodes, rows } = yield* treeRows(doc, input, Rows.empty());
      const built = yield* attributeRows(doc.root, nodes, treeId, rows);
      const string = idOf(nodes, "lom:string");

      assert.deepStrictEqual(Rows.of(built, NodeXmlLang), [
        {
          attribute: "xml:lang",
          kind: "lom:string",
          node: string,
          rootKind: "manifest",
          tree: treeId,
          value: "en",
        },
      ]);
    }),
  );

  suite.effect("choice.xml's nodes carry the ancestry their ancestors enter", () =>
    Effect.gen(function* choiceAncestry() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const { nodes, rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
      const nodeRows = Rows.of(rows, Node);
      const byId = new Map(nodeRows.map((row) => [row.id, row]));
      const ancestryOf = (kind: string) => [
        ...new Set(
          nodes
            .values()
            .filter((entry) => entry.kind === kind)
            .map((entry) => entry.ancestry),
        ),
      ];

      assert.deepStrictEqual(ancestryOf("qti-item-body"), ["root"]);
      assert.deepStrictEqual(ancestryOf("qti-choice-interaction"), ["root"]);
      assert.deepStrictEqual(ancestryOf("qti-prompt"), ["int"]);
      assert.deepStrictEqual(ancestryOf("qti-simple-choice"), ["int"]);

      // The prompt's children sit inside the interaction and the prompt: `int.choice`.
      const prompt = [...nodes.values()].find((entry) => entry.kind === "qti-prompt");
      const promptChildren = Rows.of(rows, Edge).filter((edge) => edge.parent === prompt?.id);
      assert.isAbove(promptChildren.length, 0);
      for (const edge of promptChildren) {
        assert.strictEqual(byId.get(edge.child)?.ancestry, "int.choice");
      }

      for (const edge of Rows.of(rows, Edge)) {
        assert.strictEqual(edge.childAncestry, byId.get(edge.child)?.ancestry);
        assert.strictEqual(edge.parentAncestry, byId.get(edge.parent)?.ancestry);
      }

      assert.strictEqual(byId.get(treeId)?.ancestry, "root");
    }),
  );

  suite.effect("a choice interaction inside a feedback block gives its children fb.int", () =>
    Effect.gen(function* feedbackAncestry() {
      const text = new TextDecoder().decode(
        yield* (yield* FileSystem.FileSystem).readFile(
          path.join(inject("fixtures").simple, "choice.xml"),
        ),
      );
      const open = text.indexOf("<qti-choice-interaction");
      const close = text.indexOf("</qti-choice-interaction>") + "</qti-choice-interaction>".length;
      const wrapped = `${text.slice(0, open)}<qti-feedback-block outcome-identifier="FEEDBACK" show-hide="show" identifier="x">${text.slice(open, close)}</qti-feedback-block>${text.slice(close)}`;
      const doc = yield* readXml(new TextEncoder().encode(wrapped));
      const { nodes, rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
      const byId = new Map(Rows.of(rows, Node).map((row) => [row.id, row]));
      const interaction = [...nodes.values()].find(
        (entry) => entry.kind === "qti-choice-interaction",
      );

      assert.strictEqual(interaction?.ancestry, "fb");

      const children = Rows.of(rows, Edge).filter((edge) => edge.parent === interaction?.id);
      assert.isAbove(children.length, 0);
      for (const edge of children) {
        assert.strictEqual(byId.get(edge.child)?.ancestry, "fb.int");
        assert.strictEqual(edge.parentAncestry, "fb");
        assert.strictEqual(edge.childAncestry, "fb.int");
      }
    }),
  );
});

/**
 * Run `treeGuards` over `rows` and return the refusal it fails with.
 */
const refusalOf = (rows: Rows) =>
  Effect.gen(function* refusal() {
    const exit = yield* Effect.exit(treeGuards(rows));
    const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

    return Option.getOrThrow(failure);
  });

layer(NodeServices.layer, { excludeTestServices: true })("import/guards/tree.ts", (suite) => {
  const choiceTree = Effect.gen(function* choiceTree() {
    const doc = yield* readChoice(inject("fixtures").simple);

    return (yield* treeRows(doc, itemInput(doc.charset), Rows.empty())).rows;
  });

  suite.effect("choice.xml passes both guards", () =>
    Effect.gen(function* passes() {
      yield* treeGuards(yield* choiceTree);
    }),
  );

  suite.effect("a ring of edges detached from the root is refused as reachability", () =>
    Effect.gen(function* ring() {
      const rows = yield* choiceTree;
      const template = Option.getOrThrow(Option.fromNullishOr(Rows.of(rows, Node)[0]));
      const edge = Option.getOrThrow(Option.fromNullishOr(Rows.of(rows, Edge)[0]));
      const a = "33333333-3333-4333-8333-333333333333";
      const b = "44444444-4444-4444-8444-444444444444";
      const withNodes = Rows.add(rows, Node, [
        { ...template, id: a },
        { ...template, id: b },
      ]);
      const ringed = Rows.add(withNodes, Edge, [
        { ...edge, child: b, parent: a, position: 0n },
        { ...edge, child: a, parent: b, position: 0n },
      ]);
      const refusal = yield* refusalOf(ringed);

      assert.instanceOf(refusal, GuardRefusal);
      assert.strictEqual(refusal.rule, "reachability");
    }),
  );

  suite.effect("a node no edge leads to is refused as reachability", () =>
    Effect.gen(function* orphan() {
      const rows = yield* choiceTree;
      const template = Option.getOrThrow(Option.fromNullishOr(Rows.of(rows, Node)[0]));
      const refusal = yield* refusalOf(
        Rows.add(rows, Node, [{ ...template, id: "55555555-5555-4555-8555-555555555555" }]),
      );

      assert.strictEqual(refusal.rule, "reachability");
    }),
  );

  suite.effect("edge positions 0 and 2 under one parent are refused as ordering", () =>
    Effect.gen(function* gap() {
      const rows = yield* choiceTree;
      const edges = Rows.of(rows, Edge);
      const target = Option.getOrThrow(Option.fromNullishOr(edges.find((e) => e.position === 1n)));
      const gapped = new Map(rows).set(
        Edge,
        edges.map((e) => (e === target ? { ...e, position: 2n } : e)),
      );
      const refusal = yield* refusalOf(gapped);

      assert.strictEqual(refusal.rule, "ordering");
    }),
  );

  suite.effect("a repeated edge position under one parent is refused as ordering", () =>
    Effect.gen(function* repeat() {
      const rows = yield* choiceTree;
      const edges = Rows.of(rows, Edge);
      const target = Option.getOrThrow(Option.fromNullishOr(edges.find((e) => e.position === 1n)));
      const repeated = new Map(rows).set(
        Edge,
        edges.map((e) => (e === target ? { ...e, position: 0n } : e)),
      );
      const refusal = yield* refusalOf(repeated);

      assert.strictEqual(refusal.rule, "ordering");
    }),
  );
});

it("replace turns tab, line feed and carriage return into spaces", () => {
  assert.strictEqual(replace("a\tb\nc\rd\r\ne"), "a b c d  e");
});

it("collapse replaces, trims and joins runs of spaces", () => {
  assert.strictEqual(collapse(" \ta \n\r b\t "), "a b");
});

it("valueText removes outer whitespace from every base type but string", () => {
  for (const baseType of [
    "boolean",
    "identifier",
    "integer",
    "float",
    "pair",
    "point",
    "uri",
    "duration",
    "directedPair",
    "file",
  ] as const) {
    assert.strictEqual(valueText(baseType, " x "), "x", baseType);
    assert.strictEqual(valueText(baseType, "\n  x\r\n\t"), "x", baseType);
    assert.strictEqual(valueText(baseType, " A  B "), "A  B", baseType);
    assert.strictEqual(valueText(baseType, "   "), "", baseType);
  }
});

it("valueText keeps the whitespace of a string", () => {
  assert.strictEqual(valueText("string", " a "), " a ");
});

const node = "22222222-2222-4222-8222-222222222222";

it("typedAttribute on a padded collapse value returns it collapsed with one AttributeLexical row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "adaptive",
    " true ",
    "collapse",
  );

  assert.strictEqual(result.value, "true");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), [
    { attribute: "adaptive", kind: "qti-assessment-item", node, value: " true " },
  ]);
});

it("typedAttribute on an already collapsed value appends no row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "adaptive",
    "true",
    "collapse",
  );

  assert.strictEqual(result.value, "true");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), []);
});

it("typedAttribute on a replace value holding a tab returns it replaced with one row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "title",
    "Unattended\tLuggage",
    "replace",
  );

  assert.strictEqual(result.value, "Unattended Luggage");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), [
    { attribute: "title", kind: "qti-assessment-item", node, value: "Unattended\tLuggage" },
  ]);
});

it("typedAttribute on a replace value without a tab, line feed or carriage return appends no row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "title",
    "Unattended  Luggage",
    "replace",
  );

  assert.strictEqual(result.value, "Unattended  Luggage");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), []);
});

it("typedAttribute on a preserve value is returned unchanged with no row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "title",
    "a\tb",
    "preserve",
  );

  assert.strictEqual(result.value, "a\tb");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), []);
});

const spell = (processed: string, space: "integer" | "nonNegativeInteger") =>
  spelledInteger(
    Rows.empty(),
    node,
    "qti-choice-interaction",
    "max-choices",
    processed,
    space,
    "attribute-lexical",
    "qti-choice-interaction max-choices",
  );

it.effect(
  "spelledInteger on a plus-signed integer keeps the spelling in one AttributeSpelling row",
  () =>
    Effect.gen(function* plusSigned() {
      const result = yield* spell("+5", "nonNegativeInteger");

      assert.strictEqual(result.value, 5n);
      assert.deepStrictEqual(Rows.of(result.rows, AttributeSpelling), [
        { attribute: "max-choices", kind: "qti-choice-interaction", node, value: "+5" },
      ]);
    }),
);

it.effect("spelledInteger on a canonical integer appends no row", () =>
  Effect.gen(function* canonical() {
    const result = yield* spell("5", "nonNegativeInteger");

    assert.strictEqual(result.value, 5n);
    assert.deepStrictEqual(Rows.of(result.rows, AttributeSpelling), []);
  }),
);

it.effect("spelledInteger on a zero-padded integer keeps the spelling", () =>
  Effect.gen(function* padded() {
    const result = yield* spell("05", "nonNegativeInteger");

    assert.strictEqual(result.value, 5n);
    assert.deepStrictEqual(Rows.of(result.rows, AttributeSpelling), [
      { attribute: "max-choices", kind: "qti-choice-interaction", node, value: "05" },
    ]);
  }),
);

it.effect(
  "spelledInteger after typedAttribute keeps the padded text and the collapsed spelling",
  () =>
    Effect.gen(function* afterTyped() {
      const typed = typedAttribute(
        Rows.empty(),
        node,
        "qti-choice-interaction",
        "max-choices",
        " +5 ",
        "collapse",
      );
      const result = yield* spelledInteger(
        typed.rows,
        node,
        "qti-choice-interaction",
        "max-choices",
        typed.value,
        "nonNegativeInteger",
        "attribute-lexical",
        "qti-choice-interaction max-choices",
      );

      assert.strictEqual(result.value, 5n);
      assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), [
        { attribute: "max-choices", kind: "qti-choice-interaction", node, value: " +5 " },
      ]);
      assert.deepStrictEqual(Rows.of(result.rows, AttributeSpelling), [
        { attribute: "max-choices", kind: "qti-choice-interaction", node, value: "+5" },
      ]);
    }),
);

it.effect("spelledInteger on a negative number in a non-negative space is refused", () =>
  Effect.gen(function* refused() {
    const exit = yield* Effect.exit(spell("-1", "nonNegativeInteger"));

    assert.isTrue(Exit.isFailure(exit));
    assert.strictEqual(
      Exit.isFailure(exit) ? Option.getOrThrow(Exit.findErrorOption(exit))._tag : "",
      "ImportRefused",
    );
    assert.strictEqual(
      Exit.isFailure(exit) ? Option.getOrThrow(Exit.findErrorOption(exit)).rule : "",
      "attribute-lexical",
    );
  }),
);

it.effect(
  "spelledInteger admits every signed zero in a non-negative space and keeps its spelling",
  () =>
    Effect.gen(function* signedZero() {
      for (const text of ["-0", "+0", "0", "-00"]) {
        const result = yield* spell(text, "nonNegativeInteger");

        assert.strictEqual(result.value, 0n);
        assert.deepStrictEqual(
          Rows.of(result.rows, AttributeSpelling),
          text === "0"
            ? []
            : [{ attribute: "max-choices", kind: "qti-choice-interaction", node, value: text }],
        );
      }
    }),
);

it.effect("spelledInteger refuses a negative nonzero number in a non-negative space", () =>
  Effect.gen(function* negatives() {
    for (const text of ["-1", "-01", "-10"]) {
      const refusal = yield* Effect.flip(spell(text, "nonNegativeInteger"));

      assert.strictEqual(refusal.rule, "attribute-lexical");
    }
  }),
);

it.effect("spelledInteger on minus zero under integer gives zero and keeps the spelling", () =>
  Effect.gen(function* minusZero() {
    const result = yield* spell("-0", "integer");

    assert.strictEqual(result.value, 0n);
    assert.deepStrictEqual(Rows.of(result.rows, AttributeSpelling), [
      { attribute: "max-choices", kind: "qti-choice-interaction", node, value: "-0" },
    ]);
  }),
);

/**
 * An attribute-free, childless element in `namespace`.
 */
const bare = (namespace: string, local: string): Element => ({
  attributes: [],
  children: [],
  kind: "element",
  local,
  namespace,
  prefix: "",
  qname: local,
});

const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

it("kindOf resolves a dotted handle by the parent's kind", () => {
  const metadata = bare(cpNamespace, "metadata");
  const duration = bare(lomNamespace, "duration");

  assert.deepStrictEqual(
    kindOf(metadata, Option.some("cp:manifest")),
    Option.some("cp:metadata.manifest"),
  );
  assert.deepStrictEqual(
    kindOf(metadata, Option.some("cp:resource")),
    Option.some("cp:metadata.resource"),
  );
  assert.deepStrictEqual(kindOf(metadata, Option.some("cp:resources")), Option.none());
  assert.deepStrictEqual(kindOf(metadata, Option.none()), Option.none());
  assert.deepStrictEqual(kindOf(duration, Option.some("lom:general")), Option.some("lom:duration"));
  assert.deepStrictEqual(
    kindOf(duration, Option.some("lom:duration")),
    Option.some("lom:duration.string"),
  );
});

const spaces = ["integer", "nonNegativeInteger", "positiveInteger"] as const;

const refusedRule = <Value>(effect: Effect.Effect<Value, { readonly rule: string }>) =>
  Effect.map(Effect.flip(effect), (refusal) => refusal.rule);

it.effect("integerOf refuses text outside every space under the rule it was given", () =>
  Effect.gen(function* refusesOutside() {
    for (const space of spaces) {
      for (const text of ["abc", "", "1.5", " 1", "0x10"]) {
        assert.strictEqual(
          yield* refusedRule(integerOf(text, space, "attribute-lexical", "the a attribute of b")),
          "attribute-lexical",
        );
      }
    }
  }),
);

it.effect("integerOf passes the rule it is given through unchanged", () =>
  Effect.gen(function* passesRule() {
    assert.strictEqual(
      yield* refusedRule(integerOf("abc", "integer", "P7", "the a attribute of b")),
      "P7",
    );
  }),
);

it.effect("integerOf reads a nonNegativeInteger", () =>
  Effect.gen(function* readsNonNegative() {
    const refused = yield* refusedRule(
      integerOf("-1", "nonNegativeInteger", "attribute-lexical", "the a attribute of b"),
    );
    assert.strictEqual(refused, "attribute-lexical");
    assert.strictEqual(
      yield* integerOf("+5", "nonNegativeInteger", "attribute-lexical", "the a attribute of b"),
      5n,
    );
    assert.strictEqual(
      yield* integerOf("05", "nonNegativeInteger", "attribute-lexical", "the a attribute of b"),
      5n,
    );
    assert.strictEqual(
      yield* integerOf("0", "nonNegativeInteger", "attribute-lexical", "the a attribute of b"),
      0n,
    );
  }),
);

it.effect("integerOf reads a positiveInteger", () =>
  Effect.gen(function* readsPositive() {
    const refused = yield* refusedRule(
      integerOf("0", "positiveInteger", "attribute-lexical", "the a attribute of b"),
    );
    assert.strictEqual(refused, "attribute-lexical");
    assert.strictEqual(
      yield* integerOf("1", "positiveInteger", "attribute-lexical", "the a attribute of b"),
      1n,
    );
  }),
);

it.effect("integerOf reads an integer, signs included", () =>
  Effect.gen(function* readsInteger() {
    assert.strictEqual(
      yield* integerOf("-0", "integer", "attribute-lexical", "the a attribute of b"),
      0n,
    );
    assert.strictEqual(
      yield* integerOf("-3", "integer", "attribute-lexical", "the a attribute of b"),
      -3n,
    );
    assert.strictEqual(
      yield* integerOf("+3", "integer", "attribute-lexical", "the a attribute of b"),
      3n,
    );
  }),
);

it.effect("integerOf refuses a value outside the signed 64-bit range", () =>
  Effect.gen(function* refusesRange() {
    for (const space of spaces) {
      assert.strictEqual(
        yield* refusedRule(
          integerOf("9223372036854775808", space, "attribute-lexical", "the a attribute of b"),
        ),
        "attribute-lexical",
      );
    }
    assert.strictEqual(
      yield* refusedRule(
        integerOf("-9223372036854775809", "integer", "attribute-lexical", "the a attribute of b"),
      ),
      "attribute-lexical",
    );
    assert.strictEqual(
      yield* integerOf(
        "9223372036854775807",
        "integer",
        "attribute-lexical",
        "the a attribute of b",
      ),
      9_223_372_036_854_775_807n,
    );
    assert.strictEqual(
      yield* integerOf(
        "-9223372036854775808",
        "integer",
        "attribute-lexical",
        "the a attribute of b",
      ),
      -9_223_372_036_854_775_808n,
    );
  }),
);

it.effect("closedOf returns a member's handle and refuses anything else", () =>
  Effect.gen(function* closes() {
    const roster = ["exact", "case-insensitive"] as const;
    assert.strictEqual(
      yield* closedOf(roster, "case-insensitive", "attribute-lexical", "the a attribute of b"),
      "case-insensitive",
    );
    assert.strictEqual(
      yield* refusedRule(closedOf(roster, "other", "attribute-lexical", "the a attribute of b")),
      "attribute-lexical",
    );
    assert.strictEqual(
      yield* refusedRule(closedOf(roster, " exact", "P7", "the a attribute of b")),
      "P7",
    );
    assert.strictEqual(
      yield* refusedRule(closedOf(roster, "", "attribute-lexical", "the a attribute of b")),
      "attribute-lexical",
    );
  }),
);
