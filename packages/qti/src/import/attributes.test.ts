import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attributeRows } from "#qti/import/attributes.ts";
import { kindOf, Rows, treeRows } from "#qti/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#qti/import/tree.ts";
import * as attributes from "#qti/schema/attributes.ts";
import { DocumentId, HtmlId, ItemBodyId, PrintedVariableId } from "#qti/schema/document.ts";
import { AttributeLexical, Tree } from "#qti/schema/node.ts";
import type { NodeKindHandle, RootKindHandle } from "#qti/schema/node.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element } from "#qti/xml/tree.ts";

const documentId = "11111111-1111-4111-8111-111111111111";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const manifestNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

const item = (body: string, rootAttributes = ""): string =>
  `<qti-assessment-item xmlns="${itemNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false" ${rootAttributes}><qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

const idOf = (nodes: NodeIndex, kind: string): string =>
  Option.getOrThrow(
    Option.fromNullishOr([...nodes.values()].find((found) => found.kind === kind)?.id),
  );

/**
 * An item read and walked by `treeRows`, then run through `attributeRows`: the path the item
 * composition takes for a tree the walk admits.
 */
const walked = (xml: string) =>
  Effect.gen(function* walkedItem() {
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const tree = yield* treeRows(
      doc,
      { charset: "utf-8", id: documentId, kind: "document", root: "item", version: "3.0.1" },
      Rows.empty(),
    );

    return {
      nodes: tree.nodes,
      rows: yield* attributeRows(doc.root, tree.nodes, documentId, tree.rows),
    };
  });

/**
 * The nodes of a tree indexed by kind alone, with the tree's own row, so a document the tree walk
 * refuses (it refuses `xml:lang` and `xml:base` until this builder is composed in, and it refuses a
 * name no registry holds before this builder reads it) reaches `attributeRows` directly.
 */
const indexed = (
  xml: string,
  root: RootKindHandle,
): Effect.Effect<{ nodes: NodeIndex; root: Element; rows: Rows }, unknown> =>
  Effect.gen(function* indexedTree() {
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const nodes = new Map<Element, IndexedNode>();
    const visit = (element: Element, parent: Option.Option<NodeKindHandle>): void => {
      const kind = kindOf(element, parent);
      if (Option.isNone(kind)) {
        return;
      }

      nodes.set(element, {
        ancestry: "root",
        id: nodes.size === 0 ? documentId : crypto.randomUUID(),
        kind: kind.value,
      });
      for (const child of element.children) {
        if (child.kind === "element") {
          visit(child, kind);
        }
      }
    };
    visit(doc.root, Option.none());

    return {
      nodes,
      root: doc.root,
      rows: Rows.add(Rows.empty(), Tree, [
        {
          charset: "utf-8",
          id: documentId,
          kind: root === "manifest" ? "manifest" : "document",
          root,
          version: "3.0.1",
        },
      ]),
    };
  });

/**
 * The refusal `attributeRows` answers for a tree read without the tree walk, which fails the test
 * when the builder admits the tree.
 */
const refusalOf = (xml: string, root: RootKindHandle) =>
  Effect.gen(function* refused() {
    const { nodes, root: tree, rows } = yield* indexed(xml, root);

    const found = yield* Effect.flip(attributeRows(tree, nodes, documentId, rows));
    if (found._tag !== "UnmodeledVocabulary") {
      return assert.fail(`expected an unmodeled vocabulary, got ${found._tag}`);
    }

    return found;
  });

describe("attributeRows on the family, ARIA and id attributes", () => {
  it.effect("writes the id, class, lang, ARIA and idref rows of one element and its child", () =>
    Effect.gen(function* firstInput() {
      const { nodes, rows } = yield* walked(
        item(
          '<p id="p1" class="a b" lang="en" aria-describedby="p1 x1"><span aria-hidden="true">x</span></p>',
        ),
      );
      const pId = idOf(nodes, "p");
      const spanId = idOf(nodes, "span");

      assert.deepStrictEqual(Rows.of(rows, HtmlId), [
        { attribute: "id", document: documentId, id: "p1", kind: "p", node: pId },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DocumentId), [
        { document: documentId, holder: "htmlId", id: "p1" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.NodeClass), [
        { attribute: "class", kind: "p", node: pId, value: "a b" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.NodeLang), [
        { attribute: "lang", kind: "p", node: pId, value: "en" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AriaDescribedby), [
        { attribute: "aria-describedby", kind: "p", node: pId, value: "p1 x1" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AttributeIdref), [
        {
          attribute: "aria-describedby",
          document: documentId,
          node: pId,
          position: 0n,
          target: "p1",
        },
        {
          attribute: "aria-describedby",
          document: documentId,
          node: pId,
          position: 1n,
          target: "x1",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AriaHidden), [
        { attribute: "aria-hidden", kind: "span", node: spanId, value: "true" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), []);
    }),
  );

  it.effect("keeps the form as read of a collapsed class and only that", () =>
    Effect.gen(function* collapsedClass() {
      const { nodes, rows } = yield* walked(item('<p class=" a  b " lang="en">x</p>'));
      const pId = idOf(nodes, "p");

      assert.deepStrictEqual(Rows.of(rows, attributes.NodeClass), [
        { attribute: "class", kind: "p", node: pId, value: "a b" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "class", kind: "p", node: pId, value: " a  b " },
      ]);
    }),
  );

  it.effect("writes an empty class with no lexical row and a blank one with one", () =>
    Effect.gen(function* emptyClass() {
      const empty = yield* walked(item('<p class="">x</p>'));
      const blank = yield* walked(item('<p class="  ">x</p>'));

      assert.deepStrictEqual(
        Rows.of(empty.rows, attributes.NodeClass).map((row) => row.value),
        [""],
      );
      assert.deepStrictEqual(Rows.of(empty.rows, AttributeLexical), []);
      assert.deepStrictEqual(
        Rows.of(blank.rows, attributes.NodeClass).map((row) => row.value),
        [""],
      );
      assert.deepStrictEqual(
        Rows.of(blank.rows, AttributeLexical).map((row) => [row.attribute, row.value]),
        [["class", "  "]],
      );
    }),
  );

  it.effect("replaces a label and keeps its lexical form, with the tree and root kind copied", () =>
    Effect.gen(function* label() {
      const { nodes, rows } = yield* walked(
        item('<qti-choice-interaction response-identifier="R" label="a&#9;b"/>'),
      );
      const interactionId = idOf(nodes, "qti-choice-interaction");

      assert.deepStrictEqual(Rows.of(rows, attributes.NodeLabel), [
        {
          attribute: "label",
          kind: "qti-choice-interaction",
          node: interactionId,
          rootKind: "item",
          tree: documentId,
          value: "a b",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "label", kind: "qti-choice-interaction", node: interactionId, value: "a\tb" },
      ]);
    }),
  );

  it.effect("writes the remaining families by their relations", () =>
    Effect.gen(function* families() {
      const { nodes, rows } = yield* walked(
        item(
          '<p dir="rtl" data-qti-suppress-tts="all" role="note"><br aria-keyshorts="Alt+A"/></p>',
        ),
      );
      const pId = idOf(nodes, "p");

      assert.deepStrictEqual(Rows.of(rows, attributes.NodeDir), [
        { attribute: "dir", kind: "p", node: pId, value: "rtl" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.NodeSuppressTts), [
        { attribute: "data-qti-suppress-tts", kind: "p", node: pId, value: "all" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AriaRole), [
        { attribute: "role", kind: "p", node: pId, value: "note" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AriaKeyshorts), [
        { attribute: "aria-keyshorts", kind: "br", node: idOf(nodes, "br"), value: "Alt+A" },
      ]);
    }),
  );

  it.effect("writes data-catalog-idref as a family row and as its idref token", () =>
    Effect.gen(function* catalogIdref() {
      const { nodes, rows } = yield* walked(item('<p data-catalog-idref=" c1 ">x</p>'));
      const pId = idOf(nodes, "p");

      assert.deepStrictEqual(Rows.of(rows, attributes.NodeCatalogIdref), [
        {
          attribute: "data-catalog-idref",
          document: documentId,
          kind: "p",
          node: pId,
          value: "c1",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AttributeIdref), [
        {
          attribute: "data-catalog-idref",
          document: documentId,
          node: pId,
          position: 0n,
          target: "c1",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "data-catalog-idref", kind: "p", node: pId, value: " c1 " },
      ]);
    }),
  );
});

describe("attributeRows on id holders", () => {
  it.effect("gives an interaction and a choice an HtmlId row each", () =>
    Effect.gen(function* interactionIds() {
      const { nodes, rows } = yield* walked(
        item(
          '<qti-choice-interaction id="ci1" response-identifier="R"><qti-simple-choice id="sc1" identifier="A">a</qti-simple-choice></qti-choice-interaction>',
        ),
      );

      assert.deepStrictEqual(Rows.of(rows, HtmlId), [
        {
          attribute: "id",
          document: documentId,
          id: "ci1",
          kind: "qti-choice-interaction",
          node: idOf(nodes, "qti-choice-interaction"),
        },
        {
          attribute: "id",
          document: documentId,
          id: "sc1",
          kind: "qti-simple-choice",
          node: idOf(nodes, "qti-simple-choice"),
        },
      ]);
      assert.deepStrictEqual(
        Rows.of(rows, DocumentId).map((row) => [row.holder, row.id]),
        [
          ["htmlId", "ci1"],
          ["htmlId", "sc1"],
        ],
      );
    }),
  );

  it.effect("gives the item body and a printed variable their own holders", () =>
    Effect.gen(function* ownHolders() {
      const { nodes, rows } = yield* walked(
        `<qti-assessment-item xmlns="${itemNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body id="b1"><p><qti-printed-variable id="pv1" identifier="X"/></p></qti-item-body></qti-assessment-item>`,
      );

      assert.deepStrictEqual(Rows.of(rows, ItemBodyId), [
        { document: documentId, id: "b1", node: idOf(nodes, "qti-item-body") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, PrintedVariableId), [
        { document: documentId, id: "pv1", node: idOf(nodes, "qti-printed-variable") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, HtmlId), []);
      assert.deepStrictEqual(
        Rows.of(rows, DocumentId).map((row) => [row.holder, row.id]),
        [
          ["itemBody", "b1"],
          ["printedVariable", "pv1"],
        ],
      );
    }),
  );

  it.effect("writes no id row for a declaration, whose registry holds no id", () =>
    Effect.gen(function* declarationIds() {
      const { rows } = yield* walked(
        `<qti-assessment-item xmlns="${itemNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="string"/><qti-context-declaration identifier="C" cardinality="single" base-type="string"/><qti-item-body/></qti-assessment-item>`,
      );

      assert.deepStrictEqual(Rows.of(rows, HtmlId), []);
      assert.deepStrictEqual(Rows.of(rows, DocumentId), []);

      const refused = yield* refusalOf(
        `<qti-assessment-item xmlns="${itemNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="R" id="d1" cardinality="single" base-type="string"/><qti-item-body/></qti-assessment-item>`,
        "item",
      );

      assert.strictEqual(refused.name, "id");
      assert.deepStrictEqual(refused.parent, Option.some("qti-response-declaration"));
    }),
  );
});

describe("attributeRows on headers", () => {
  it.effect("writes one idref row and one headers row per token", () =>
    Effect.gen(function* headerTokens() {
      const { nodes, rows } = yield* walked(
        item('<table><tr><td headers=" h1  h2 ">x</td></tr></table>'),
      );
      const tdId = idOf(nodes, "td");
      const token = (position: bigint, target: string) => ({
        attribute: "headers" as const,
        document: documentId,
        node: tdId,
        position,
        target,
      });

      assert.deepStrictEqual(Rows.of(rows, attributes.AttributeIdref), [
        token(0n, "h1"),
        token(1n, "h2"),
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.HeadersTarget), [
        token(0n, "h1"),
        token(1n, "h2"),
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "headers", kind: "td", node: tdId, value: " h1  h2 " },
      ]);
    }),
  );

  it.effect("writes an empty headers as a lexical row and no token", () =>
    Effect.gen(function* emptyHeaders() {
      const { nodes, rows } = yield* walked(item('<table><tr><td headers="">x</td></tr></table>'));

      assert.deepStrictEqual(Rows.of(rows, attributes.AttributeIdref), []);
      assert.deepStrictEqual(Rows.of(rows, attributes.HeadersTarget), []);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "headers", kind: "td", node: idOf(nodes, "td"), value: "" },
      ]);
    }),
  );

  it.effect("writes a blank headers as one lexical row, not two", () =>
    Effect.gen(function* blankHeaders() {
      const { nodes, rows } = yield* walked(item('<table><tr><td headers=" ">x</td></tr></table>'));

      assert.deepStrictEqual(Rows.of(rows, attributes.AttributeIdref), []);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "headers", kind: "td", node: idOf(nodes, "td"), value: " " },
      ]);
    }),
  );
});

describe("attributeRows on a tree of either root", () => {
  it.effect("writes a manifest string's xml:lang with the manifest root kind", () =>
    Effect.gen(function* manifestLang() {
      const { nodes, root, rows } = yield* indexed(
        `<manifest xmlns="${manifestNamespace}" xmlns:imsmd="${lomNamespace}" identifier="M"><metadata><imsmd:lom><imsmd:general><imsmd:title><imsmd:string xml:lang="en">T</imsmd:string></imsmd:title></imsmd:general></imsmd:lom></metadata></manifest>`,
        "manifest",
      );
      const built = yield* attributeRows(root, nodes, documentId, rows);
      const stringId = idOf(nodes, "lom:string");

      assert.deepStrictEqual(Rows.of(built, attributes.NodeXmlLang), [
        {
          attribute: "xml:lang",
          kind: "lom:string",
          node: stringId,
          rootKind: "manifest",
          tree: documentId,
          value: "en",
        },
      ]);
    }),
  );

  it.effect("writes xml:base and keeps a padded xml:lang's form", () =>
    Effect.gen(function* xmlAttributes() {
      const { nodes, root, rows } = yield* indexed(
        item('<p xml:base=" a/ " xml:lang=" fr ">x</p>'),
        "item",
      );
      const built = yield* attributeRows(root, nodes, documentId, rows);
      const pId = idOf(nodes, "p");

      assert.deepStrictEqual(Rows.of(built, attributes.NodeXmlBase), [
        { attribute: "xml:base", kind: "p", node: pId, value: "a/" },
      ]);
      assert.deepStrictEqual(
        Rows.of(built, attributes.NodeXmlLang).map((row) => [row.value, row.rootKind]),
        [["fr", "item"]],
      );
      assert.deepStrictEqual(
        Rows.of(built, AttributeLexical).map((row) => [row.attribute, row.value]),
        [
          ["xml:base", " a/ "],
          ["xml:lang", " fr "],
        ],
      );
    }),
  );

  it.effect("writes no label row for the item root and does not refuse it", () =>
    Effect.gen(function* rootLabel() {
      const { rows } = yield* walked(item("<p>x</p>", 'label="x"'));

      assert.deepStrictEqual(Rows.of(rows, attributes.NodeLabel), []);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), []);
    }),
  );
});

describe("attributeRows refusals", () => {
  it.effect("refuses a family attribute the kind's registry does not hold", () =>
    Effect.gen(function* itemBodyLang() {
      const found = yield* refusalOf(
        item("").replace("<qti-item-body>", '<qti-item-body lang="en">'),
        "item",
      );

      assert.strictEqual(found.kind, "attribute");
      assert.strictEqual(found.name, "lang");
      assert.deepStrictEqual(found.parent, Option.some("qti-item-body"));
    }),
  );

  it.effect("refuses data-ssml and a custom data attribute", () =>
    Effect.gen(function* dataAttributes() {
      const ssml = yield* refusalOf(item('<p data-ssml="x">y</p>'), "item");
      const custom = yield* refusalOf(item('<p data-foo="x">y</p>'), "item");

      assert.strictEqual(ssml.name, "data-ssml");
      assert.deepStrictEqual(ssml.parent, Option.some("p"));
      assert.strictEqual(custom.name, "data-foo");
    }),
  );

  it.effect("names the first stray attribute in document order", () =>
    Effect.gen(function* firstStray() {
      const found = yield* refusalOf(
        item('<p id="a">x</p><p data-foo="1" data-bar="2">y</p>'),
        "item",
      );

      assert.strictEqual(found.name, "data-foo");
    }),
  );
});

/**
 * The `ImportRefused` a document's walk and attribute pass answers, which fails the test when it
 * is admitted or refused otherwise.
 */
const refusedBy = (xml: string) =>
  Effect.gen(function* refusedWalk() {
    const refused = yield* Effect.flip(walked(xml));
    if (refused._tag !== "ImportRefused") {
      return assert.fail(`expected an import refusal, got ${refused._tag}`);
    }

    return refused;
  });

describe("attributeRows on the closed attribute families and ARIA", () => {
  it.effect("refuses an aria-live outside its roster as attribute-lexical", () =>
    Effect.gen(function* liveLoud() {
      const refused = yield* refusedBy(item('<p aria-live="loud">x</p>'));

      assert.strictEqual(refused.rule, "attribute-lexical");
    }),
  );

  it.effect("refuses each other closed family value outside its roster as attribute-lexical", () =>
    Effect.gen(function* closedFamilies() {
      for (const attribute of [
        'dir="up"',
        'data-qti-suppress-tts="some"',
        'role="widget"',
        'aria-hidden="yes"',
        'aria-orientation="diagonal"',
        'aria-autocomplete="always"',
        'aria-checked="maybe"',
        'aria-pressed="maybe"',
        'aria-expanded="mixed"',
        'aria-selected="mixed"',
        'aria-invalid="bad"',
        'aria-sort="up"',
        'aria-current="now"',
      ]) {
        const refused = yield* refusedBy(item(`<p ${attribute}>x</p>`));

        assert.strictEqual(refused.rule, "attribute-lexical", attribute);
      }
    }),
  );

  it.effect("writes a value of every closed roster by its handle", () =>
    Effect.gen(function* closedValues() {
      const { nodes, rows } = yield* walked(
        item('<p aria-live="polite" aria-hidden="1" aria-checked="mixed" dir="ltr">x</p>'),
      );
      const pId = idOf(nodes, "p");

      assert.deepStrictEqual(Rows.of(rows, attributes.AriaLive), [
        { attribute: "aria-live", kind: "p", node: pId, value: "polite" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AriaHidden), [
        { attribute: "aria-hidden", kind: "p", node: pId, value: "1" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.AriaChecked), [
        { attribute: "aria-checked", kind: "p", node: pId, value: "mixed" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, attributes.NodeDir), [
        { attribute: "dir", kind: "p", node: pId, value: "ltr" },
      ]);
    }),
  );
});
