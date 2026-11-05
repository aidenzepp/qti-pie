/**
 * The foreign rows and the typed attributes of wildcard content (spec W07), in memory: each case
 * reads a tree from an inline literal with `readXml`, runs `treeRows` and then `attributeRows`, and
 * asserts the rows by value. The literals are the edits of the wildcard fixtures
 * (`operator-foreign-content`, `fallback-3-0-1`, `lom-wildcard`) and of the corpus operator.
 * No database, no tarball.
 */
import { assert, describe, it } from "@effect/vitest";
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Exit, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { attributeRows } from "#pantry/import/attributes.ts";
import { ContentGuardRefusal, contentGuards } from "#pantry/import/guards/content.ts";
import { wildcardGuards, WildcardGuardRefusal } from "#pantry/import/guards/wildcard.ts";
import { rptemplateRows } from "#pantry/import/rptemplate.ts";
import { Rows, treeRows } from "#pantry/import/tree.ts";
import { NodeXmlLang } from "#pantry/schema/attributes.ts";
import { ManifestIdentifier } from "#pantry/schema/contracts.ts";
import { DocumentId, DocumentXmlId } from "#pantry/schema/document.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import { NodeXmlSpace } from "#pantry/schema/foreign-attributes.ts";
import { AttributeLexical } from "#pantry/schema/node.ts";
import type { RootKindHandle, SchemaVersionHandle } from "#pantry/schema/node.ts";
import { ManifestId, ManifestXmlId } from "#pantry/schema/package.ts";
import * as xlink from "#pantry/schema/xlink.ts";

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

const cpx = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2";

const lom = "http://ltsc.ieee.org/xsd/LOM";

const qmd = "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0";

const xi = "http://www.w3.org/2001/XInclude";

const xsi = "http://www.w3.org/2001/XMLSchema-instance";

const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

const mathassess = "http://mathassess.qtitools.org/xsd/mathassess";

const treeId: Uuid = "11111111-1111-4111-8111-111111111111";

/**
 * A branded text as the plain string the cases write.
 */
const plain = (value: string): string => value;

const decode = (xml: string) => readXml(new TextEncoder().encode(xml));

/**
 * A tree read, walked by `treeRows` and run through `attributeRows`: the path the item and manifest
 * builders take.
 */
const built = (xml: string, root: RootKindHandle, version: SchemaVersionHandle = "3.0.0") =>
  Effect.gen(function* builtTree() {
    const doc = yield* decode(xml);
    const tree = yield* treeRows(
      doc,
      {
        charset: doc.charset,
        id: treeId,
        kind: root === "manifest" ? "manifest" : "document",
        root,
        version,
      },
      Rows.empty(),
    );

    return {
      nodes: tree.nodes,
      rows: yield* attributeRows(doc.root, tree.nodes, treeId, tree.rows),
    };
  });

type Built = Effect.Success<ReturnType<typeof built>>;

/**
 * The first element named `qname` in document order at or under `element`.
 */
const descend = (element: Element, qname: string): Element | undefined => {
  if (element.qname === qname) {
    return element;
  }

  return element.children
    .filter((child): child is Element => child.kind === "element")
    .map((child) => descend(child, qname))
    .find((found) => found !== undefined);
};

/**
 * The node id of the first element named `qname`.
 */
const idOf = (tree: Built, qname: string): Uuid => {
  const found = [...tree.nodes].find(([element]) => element.qname === qname);
  assert.isDefined(found, `the tree holds ${qname}`);

  return found[1].id;
};

const elementOf = (tree: Built, qname: string) => {
  const id = idOf(tree, qname);
  const [row, ...more] = Rows.of(tree.rows, ForeignElement).filter((found) => found.id === id);
  assert.isDefined(row, `${qname} has a ForeignElement row`);
  assert.deepStrictEqual(more, []);

  return { ...row, local: plain(row.local), namespace: plain(row.namespace) };
};

/**
 * The `ForeignAttribute` rows of the first element named `qname`, keyed `prefix:local` (or bare),
 * each without its node and the columns every row of a tree shares.
 */
const attributesOf = (tree: Built, qname: string) => {
  const id = idOf(tree, qname);

  return Object.fromEntries(
    Rows.of(tree.rows, ForeignAttribute)
      .filter((row) => row.node === id)
      .map(({ kind, local, namespace, prefix, process, value }) => [
        prefix === "" ? local : `${prefix}:${local}`,
        { kind, local: plain(local), namespace: plain(namespace), prefix, process, value },
      ]),
  );
};

const onNode = <Row extends { readonly node: Uuid }>(rows: readonly Row[], id: Uuid) =>
  rows.filter((row) => row.node === id);

const declarations = `xmlns="${asi}" xmlns:ma="${mathassess}" xmlns:xi="${xi}" xmlns:xsi="${xsi}"`;

const operand = '<qti-base-value base-type="integer">1</qti-base-value>';

/**
 * An item whose response processing holds one `qti-custom-operator` with `attributes` and `inner`.
 */
const operatorItem = (inner: string, attributes = 'class="org.example.Op"'): string =>
  `<qti-assessment-item ${declarations} identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-processing><qti-set-outcome-value identifier="S"><qti-custom-operator ${attributes}>${inner}</qti-custom-operator></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`;

/**
 * `operator-foreign-content`'s edits: `xml:foo` on the operator, and after its operand a foreign
 * `ma:extension` carrying every kind of attribute, then an `xi:include` with a `xi:fallback`.
 */
const foreignContent = operatorItem(
  `${operand}<ma:extension ma:k="v" plain="1" xml:lang="en" xml:space="preserve" xml:id="x1" xml:foo="1" xsi:foo="1">text<ma:inner/><p>para</p><qti-prompt>lax</qti-prompt><xi:include href="inner.xml"/></ma:extension><xi:include href="part.xml"><xi:fallback><p>fallback</p><foo xmlns="">local</foo></xi:fallback></xi:include>`,
  'class="org.example.Op" xml:foo="1" xsi:foo="1"',
);

describe("import/foreign.ts operator-foreign-content", () => {
  it.effect("writes one ForeignElement row for each foreign node, by value", () =>
    Effect.gen(function* foreignElements() {
      const tree = yield* built(foreignContent, "item");
      const shared = { rootKind: "item", schemaSet: "asi" } as const;

      assert.deepStrictEqual(elementOf(tree, "ma:extension"), {
        id: idOf(tree, "ma:extension"),
        local: "extension",
        namespace: mathassess,
        parentKind: "qti-custom-operator",
        prefix: "ma",
        ...shared,
      });
      assert.deepStrictEqual(elementOf(tree, "ma:inner"), {
        id: idOf(tree, "ma:inner"),
        local: "inner",
        namespace: mathassess,
        parentKind: "foreign",
        prefix: "ma",
        ...shared,
      });
      assert.deepStrictEqual(elementOf(tree, "foo"), {
        id: idOf(tree, "foo"),
        local: "foo",
        namespace: "",
        parentKind: "xi:fallback",
        prefix: "",
        ...shared,
      });
      // A QTI element that is no global of the set is foreign under a lax host, whatever its
      // namespace: `qti-prompt` here, in the ASI namespace and under no prefix.
      assert.deepStrictEqual(elementOf(tree, "qti-prompt"), {
        id: idOf(tree, "qti-prompt"),
        local: "qti-prompt",
        namespace: asi,
        parentKind: "foreign",
        prefix: "",
        ...shared,
      });
      // Four foreign nodes: `p` and both `xi:include`s have kinds of their own.
      assert.strictEqual(Rows.of(tree.rows, ForeignElement).length, 4);
    }),
  );

  it.effect(
    "writes a ForeignAttribute row for each foreign attribute, with its host's process",
    () =>
      Effect.gen(function* foreignAttributes() {
        const tree = yield* built(foreignContent, "item");

        assert.deepStrictEqual(attributesOf(tree, "ma:extension"), {
          "ma:k": {
            kind: "foreign",
            local: "k",
            namespace: mathassess,
            prefix: "ma",
            process: "lax",
            value: "v",
          },
          plain: {
            kind: "foreign",
            local: "plain",
            namespace: "",
            prefix: "",
            process: "lax",
            value: "1",
          },
          "xml:foo": {
            kind: "foreign",
            local: "foo",
            namespace: xmlNamespace,
            prefix: "xml",
            process: "lax",
            value: "1",
          },
          "xsi:foo": {
            kind: "foreign",
            local: "foo",
            namespace: xsi,
            prefix: "xsi",
            process: "lax",
            value: "1",
          },
        });
        assert.deepStrictEqual(attributesOf(tree, "qti-custom-operator"), {
          "xml:foo": {
            kind: "qti-custom-operator",
            local: "foo",
            namespace: xmlNamespace,
            prefix: "xml",
            process: "lax",
            value: "1",
          },
          "xsi:foo": {
            kind: "qti-custom-operator",
            local: "foo",
            namespace: xsi,
            prefix: "xsi",
            process: "lax",
            value: "1",
          },
        });
        for (const row of Rows.of(tree.rows, ForeignAttribute)) {
          assert.strictEqual(row.rootKind, "item");
          assert.strictEqual(row.schemaSet, "asi");
        }
      }),
  );

  it.effect("writes the typed attributes of the foreign element through the typed relations", () =>
    Effect.gen(function* typedAttributes() {
      const tree = yield* built(foreignContent, "item");
      const id = idOf(tree, "ma:extension");
      const forms = Rows.of(tree.rows, NodeXmlLang).filter((row) => row.node === id);

      assert.strictEqual(forms.length, 1);
      assert.strictEqual(forms[0]?.value, "en");
      assert.deepStrictEqual(onNode(Rows.of(tree.rows, NodeXmlSpace), id), [
        { attribute: "xml:space", kind: "foreign", node: id, value: "preserve" },
      ]);
      assert.deepStrictEqual(onNode(Rows.of(tree.rows, DocumentXmlId), id), [
        { attribute: "xml:id", document: treeId, id: "x1", kind: "foreign", node: id },
      ]);
      assert.deepStrictEqual(Rows.of(tree.rows, DocumentId), [
        { document: treeId, holder: "xmlId", id: "x1" },
      ]);
      assert.deepStrictEqual(Rows.of(tree.rows, ManifestXmlId), []);
      assert.strictEqual(
        Rows.of(tree.rows, ForeignAttribute).filter(
          (row) => row.local === "id" || row.local === "space" || row.local === "lang",
        ).length,
        0,
      );
    }),
  );

  it.effect("writes the operator's xsi:foo as a lax ForeignAttribute in the xsi namespace", () =>
    Effect.gen(function* xsiForeign() {
      const tree = yield* built(foreignContent, "item");
      const rows = Rows.of(tree.rows, ForeignAttribute).filter(
        (row) => row.namespace === xsi && row.local === "foo",
      );

      assert.deepStrictEqual(
        rows.map(({ kind, prefix, process, value }) => ({ kind, prefix, process, value })),
        [
          { kind: "qti-custom-operator", prefix: "xsi", process: "lax", value: "1" },
          { kind: "foreign", prefix: "xsi", process: "lax", value: "1" },
        ],
      );
    }),
  );
});

describe("import/foreign.ts fallback-3-0-1", () => {
  it.effect("writes the foreign element beside the custom operator of a 3.0.1 item", () =>
    Effect.gen(function* fallback() {
      const xml = `<qti-assessment-item ${declarations} identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><xi:include href="x.xml"><xi:fallback><p>fallback</p><ma:foo/></xi:fallback></xi:include></qti-item-body><qti-response-processing><qti-response-condition><qti-response-if><qti-custom-operator class="org.example.Op">${operand}<ma:extension ma:k="v"/></qti-custom-operator><qti-set-outcome-value identifier="S">${operand}</qti-set-outcome-value></qti-response-if></qti-response-condition></qti-response-processing></qti-assessment-item>`;
      const tree = yield* built(xml, "item", "3.0.1");

      assert.deepStrictEqual(
        Rows.of(tree.rows, ForeignElement).map(({ local, parentKind, schemaSet }) => ({
          local,
          parentKind,
          schemaSet,
        })),
        [
          { local: "foo", parentKind: "xi:fallback", schemaSet: "asi" },
          { local: "extension", parentKind: "qti-custom-operator", schemaSet: "asi" },
        ],
      );
      assert.deepStrictEqual(
        Rows.of(tree.rows, ForeignAttribute).map(({ kind, local, value }) => ({
          kind,
          local,
          value,
        })),
        [{ kind: "foreign", local: "k", value: "v" }],
      );
    }),
  );
});

describe("import/foreign.ts the corpus operator", () => {
  it.effect("writes exactly its two ma: attributes and no ForeignElement", () =>
    Effect.gen(function* corpusOperator() {
      const tree = yield* built(
        operatorItem(
          operand,
          'class="org.qtitools.mathassess.CasProcess" ma:syntax="text/x-maxima" ma:returnType="float"',
        ),
        "item",
      );

      assert.deepStrictEqual(Rows.of(tree.rows, ForeignElement), []);
      assert.deepStrictEqual(attributesOf(tree, "qti-custom-operator"), {
        "ma:returnType": {
          kind: "qti-custom-operator",
          local: "returnType",
          namespace: mathassess,
          prefix: "ma",
          process: "lax",
          value: "float",
        },
        "ma:syntax": {
          kind: "qti-custom-operator",
          local: "syntax",
          namespace: mathassess,
          prefix: "ma",
          process: "lax",
          value: "text/x-maxima",
        },
      });
      assert.strictEqual(Rows.of(tree.rows, ForeignAttribute).length, 2);
    }),
  );
});

const manifestOf = (lomContent: string): string =>
  `<manifest xmlns="${cp}" xmlns:imsmd="${lom}" xmlns:cpx="${cpx}" xmlns:qmd="${qmd}" xmlns:ma="${mathassess}" xmlns:xlink="http://www.w3.org/1999/xlink" identifier="M"><metadata><imsmd:lom ma:k="v" xlink:href="https://example.org/lom">${lomContent}</imsmd:lom></metadata><organizations/><resources><resource identifier="r" type="imsqti_item_xmlv3p0" href="a.xml"><file href="a.xml"/></resource></resources></manifest>`;

const record = `<ma:ext ma:k="v" xml:id="m1" xml:space="preserve" xlink:type="simple" xlink:href="https://example.org/a" xlink:role="https://example.org/r" xlink:arcrole="https://example.org/ar" xlink:title=" t " xlink:show="new" xlink:actuate="onLoad" xlink:label="a" xlink:from="a" xlink:to="b" xlink:foo="1"/>`;

describe("import/foreign.ts lom-wildcard", () => {
  it.effect("types the ten xlink names, xml:space and xml:id of a manifest's foreign element", () =>
    Effect.gen(function* manifestForeign() {
      const tree = yield* built(manifestOf(`<imsmd:general>${record}</imsmd:general>`), "manifest");
      const id = idOf(tree, "ma:ext");
      const typed = (rows: readonly { readonly node: Uuid; readonly value: string }[]) =>
        onNode(rows, id).map((row) => row.value);

      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkType)), ["simple"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkHref)), ["https://example.org/a"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkRole)), ["https://example.org/r"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkArcrole)), [
        "https://example.org/ar",
      ]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkTitle)), [" t "]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkShow)), ["new"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkActuate)), ["onLoad"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkLabel)), ["a"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkFrom)), ["a"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, xlink.XlinkTo)), ["b"]);
      assert.deepStrictEqual(typed(Rows.of(tree.rows, NodeXmlSpace)), ["preserve"]);
      assert.deepStrictEqual(onNode(Rows.of(tree.rows, ManifestXmlId), id), [
        {
          attribute: "xml:id",
          id: ManifestIdentifier("m1"),
          kind: "foreign",
          node: id,
          package: treeId,
        },
      ]);
      assert.deepStrictEqual(Rows.of(tree.rows, ManifestId), [
        { holder: "xmlId", id: ManifestIdentifier("m1"), package: treeId },
      ]);
      assert.deepStrictEqual(Rows.of(tree.rows, DocumentXmlId), []);
      assert.deepStrictEqual(Object.keys(attributesOf(tree, "ma:ext")).toSorted(), [
        "ma:k",
        "xlink:foo",
      ]);
      // `xlink:title` preserves its padding, so no lexical row beside it.
      assert.deepStrictEqual(Rows.of(tree.rows, AttributeLexical), []);
    }),
  );

  it.effect("writes the foreign attribute and the xlink:href of imsmd:lom", () =>
    Effect.gen(function* lomAttributes() {
      const tree = yield* built(manifestOf(`<imsmd:general>${record}</imsmd:general>`), "manifest");
      const id = idOf(tree, "imsmd:lom");

      assert.deepStrictEqual(Object.keys(attributesOf(tree, "imsmd:lom")), ["ma:k"]);
      assert.deepStrictEqual(
        onNode(Rows.of(tree.rows, xlink.XlinkHref), id).map((row) => row.value),
        ["https://example.org/lom"],
      );
      assert.strictEqual(attributesOf(tree, "imsmd:lom")["ma:k"]?.process, "lax");
      assert.strictEqual(attributesOf(tree, "imsmd:lom")["ma:k"]?.kind, "lom:lom");
    }),
  );

  it.effect("writes a record's xml:id and xml:space as ForeignAttribute rows, in the lom set", () =>
    Effect.gen(function* recordForeign() {
      const xml = `<imsmd:lom xmlns:imsmd="${lom}" xmlns:ma="${mathassess}"><ma:ext xml:id="r1" xml:space="bogus"/><ma:ext xml:id="r1"/></imsmd:lom>`;
      const tree = yield* built(xml, "externalLom");
      const rows = Rows.of(tree.rows, ForeignAttribute);

      assert.deepStrictEqual(
        rows.map(({ kind, local, namespace, prefix, process, schemaSet, value }) => ({
          kind,
          local,
          namespace,
          prefix,
          process,
          schemaSet,
          value,
        })),
        [
          { local: "id", value: "r1" },
          { local: "space", value: "bogus" },
          { local: "id", value: "r1" },
        ].map((row) => ({
          kind: "foreign",
          namespace: xmlNamespace,
          prefix: "xml",
          process: "lax",
          schemaSet: "lom",
          ...row,
        })),
      );
      assert.deepStrictEqual(Rows.of(tree.rows, NodeXmlSpace), []);
      assert.deepStrictEqual(Rows.of(tree.rows, DocumentXmlId), []);
      assert.deepStrictEqual(Rows.of(tree.rows, ManifestXmlId), []);
      assert.deepStrictEqual(Rows.of(tree.rows, DocumentId), []);
      assert.strictEqual(Rows.of(tree.rows, ForeignElement).length, 2);
    }),
  );
});

describe("import/foreign.ts typed copy of xml:id", () => {
  it.effect("writes the lexical row of a padded xml:id and the content guard checks it", () =>
    Effect.gen(function* paddedId() {
      const tree = yield* built(operatorItem(`${operand}<ma:ext xml:id=" x1 "/>`), "item");
      const id = idOf(tree, "ma:ext");

      assert.deepStrictEqual(Rows.of(tree.rows, AttributeLexical), [
        { attribute: "xml:id", kind: "foreign", node: id, value: " x1 " },
      ]);
      assert.deepStrictEqual(
        onNode(Rows.of(tree.rows, DocumentXmlId), id).map((row) => row.id),
        ["x1"],
      );
      yield* contentGuards(tree.rows);

      const drifted = Rows.of(tree.rows, DocumentXmlId).map((row) => ({ ...row, id: "y1" }));
      const exit = yield* Effect.exit(
        contentGuards(
          Rows.add(
            new Map([...tree.rows].filter(([relation]) => relation !== DocumentXmlId)),
            DocumentXmlId,
            drifted,
          ),
        ),
      );
      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      const refusal = Option.getOrThrow(failure);
      assert.instanceOf(refusal, ContentGuardRefusal);
      assert.strictEqual(refusal.rule, "typed-copy");
    }),
  );
});

describe("import/foreign.ts the W6 negative", () => {
  it.effect("refuses an asi: attribute on the operator as wildcard-namespace", () =>
    Effect.gen(function* namespaceRefused() {
      const tree = yield* built(
        operatorItem(operand, `class="org.example.Op" xmlns:q="${asi}" q:foo="1"`),
        "item",
      );
      const rows = Rows.of(tree.rows, ForeignAttribute);

      assert.strictEqual(rows.length, 1);
      assert.strictEqual(rows[0]?.namespace, asi);
      assert.strictEqual(rows[0]?.local, "foo");
      assert.strictEqual(rows[0]?.kind, "qti-custom-operator");

      const exit = yield* Effect.exit(wildcardGuards(tree.rows));
      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      const refusal = Option.getOrThrow(failure);
      assert.instanceOf(refusal, WildcardGuardRefusal);
      assert.strictEqual(refusal.rule, "wildcard-namespace");
    }),
  );
});

describe("import/foreign.ts a response processing template tree", () => {
  it.effect("writes the foreign child of a template operator through treeRows", () =>
    Effect.gen(function* templateTree() {
      const xml = `<qti-response-processing xmlns="${asi}" xmlns:ma="${mathassess}"><qti-response-condition><qti-response-if><qti-custom-operator class="org.example.Op"><qti-base-value base-type="boolean">true</qti-base-value><ma:ext ma:k="v" plain="1"/></qti-custom-operator><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition></qti-response-processing>`;
      const doc = yield* decode(xml);
      const tree = yield* rptemplateRows(
        {
          doc,
          packageId: crypto.randomUUID(),
          path: "rptemplates/t.xml",
          resource: "t",
          resourceType: "imsqti_rptemplate_xmlv3p0",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const element = descend(doc.root, "ma:ext");
      assert.isDefined(element);

      const id = tree.nodes.get(element)?.id;
      assert.isDefined(id);

      assert.deepStrictEqual(
        Rows.of(tree.rows, ForeignElement).map((row) => ({
          id: row.id,
          local: row.local,
          parentKind: row.parentKind,
          prefix: row.prefix,
          rootKind: row.rootKind,
          schemaSet: row.schemaSet,
        })),
        [
          {
            id,
            local: "ext",
            parentKind: "qti-custom-operator",
            prefix: "ma",
            rootKind: "rptemplate",
            schemaSet: "asi",
          },
        ],
      );
      assert.deepStrictEqual(
        Rows.of(tree.rows, ForeignAttribute)
          .filter((row) => row.node === id)
          .map(({ local, namespace, prefix, process, rootKind, schemaSet, value }) => ({
            local,
            namespace,
            prefix,
            process,
            rootKind,
            schemaSet,
            value,
          })),
        [
          {
            local: "k",
            namespace: mathassess,
            prefix: "ma",
            process: "lax",
            rootKind: "rptemplate",
            schemaSet: "asi",
            value: "v",
          },
          {
            local: "plain",
            namespace: "",
            prefix: "",
            process: "lax",
            rootKind: "rptemplate",
            schemaSet: "asi",
            value: "1",
          },
        ],
      );
    }),
  );
});
