import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { renderTree } from "#qti/export/render.ts";
import { itemRows } from "#qti/import/item.ts";
import { processingRows } from "#qti/import/processing.ts";
import { rptemplateRows } from "#qti/import/rptemplate.ts";
import { Rows, treeRows } from "#qti/import/tree.ts";
import type { Language } from "#qti/processing/ast.ts";
import { emptyEnvironment, environmentOf, withDeclarations } from "#qti/processing/env.ts";
import type { DeclarationEntry, Environment, Mode } from "#qti/processing/env.ts";
import { templateDocuments } from "#qti/processing/fixtures.ts";
import type { RootKindHandle } from "#qti/schema/node.ts";
import { canonicalize } from "#qti/xml/canonical.ts";
import { xmllintC14n } from "#qti/xml/oracle.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Attribute, Element, XmlDocument } from "#qti/xml/tree.ts";
import { writeXml } from "#qti/xml/write.ts";

/**
 * What every test here runs on: the file system the scratch files need and the process spawner
 * `xmllint` needs.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory the scratch files go under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The committed processing fixtures, relative to `packages/qti`, where the tests run.
 */
const fixtures = "src/processing/fixtures";

const asiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * Every element of a subtree, the root included, in document order.
 */
const elementsOf = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child) => (child.kind === "element" ? elementsOf(child) : [])),
];

/**
 * The elements from `root` down to `target`, both included, none when `target` is not under it.
 */
const pathTo = (root: Element, target: Element): readonly Element[] => {
  if (root === target) {
    return [root];
  }

  const below = root.children.flatMap((child) =>
    child.kind === "element" ? [pathTo(child, target)] : [],
  );
  const found = below.find((candidate) => candidate.length > 0);

  return found === undefined ? [] : [root, ...found];
};

/**
 * `element` as the root of a document of its own: the namespace declarations in scope above it are
 * written on it, as Canonical XML writes a subtree's apex.
 */
const detached = (doc: XmlDocument, element: Element): XmlDocument => {
  const inherited = new Map<string, Attribute>();
  for (const ancestor of pathTo(doc.root, element)) {
    for (const attribute of ancestor.attributes) {
      if (attribute.namespace === xmlnsNamespace) {
        inherited.set(attribute.qname, attribute);
      }
    }
  }

  const apex = element;
  const own = new Set(apex.attributes.map((attribute) => attribute.qname));

  return {
    ...doc,
    declaration: doc.declaration,
    doctype: doc.doctype,
    epilog: [],
    prolog: [],
    root: {
      ...apex,
      attributes: [
        ...[...inherited.values()].filter((attribute) => !own.has(attribute.qname)),
        ...apex.attributes,
      ],
    },
  };
};

const outcomeOf = (identifier: string, baseType: "boolean" | "float" | "integer") => {
  const entry: DeclarationEntry = {
    areaMapping: false,
    identifier,
    interpolationTable: false,
    kind: "outcome",
    mapping: false,
    matchTable: false,
    mathVariable: false,
    paramVariable: false,
    type: { baseType, cardinality: "single" },
  };

  return entry;
};

/**
 * What a tree is judged and written under: its processing language, mode, root kind and, where the
 * source holds no declarations, the environment.
 */
interface Setting {
  readonly env?: Environment;
  readonly language: Language;
  readonly mode: Mode;
  readonly rootKind: RootKindHandle;
}

const itemSetting: Setting = { language: "response", mode: "item", rootKind: "item" };

const outcomeSetting: Setting = {
  env: withDeclarations(emptyEnvironment("test"), [
    outcomeOf("TOTAL", "float"),
    outcomeOf("MAXTOTAL", "float"),
    outcomeOf("COUNT", "integer"),
    outcomeOf("PASSED", "boolean"),
  ]),
  language: "outcome",
  mode: "test",
  rootKind: "test",
};

/**
 * The text of canonical bytes.
 */
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

/**
 * The processing subtree of a decoded document read, written as rows through `treeRows` and
 * `processingRows`, rendered back by `renderTree`, and the three canonical forms to compare: the
 * rendering's, the read subtree's and the oracle's over the subtree written to a file.
 */
const roundTrip = (doc: XmlDocument, local: string, setting: Setting) =>
  Effect.gen(function* roundTripOfSubtree() {
    const fs = yield* FileSystem.FileSystem;
    const element =
      elementsOf(doc.root).find((candidate) => candidate.local === local) ??
      assert.fail(`the document has no ${local}`);
    const subtree = detached(doc, element);
    const tree = crypto.randomUUID();
    const built = yield* treeRows(
      subtree,
      {
        charset: subtree.charset,
        id: tree,
        kind: "document",
        root: setting.rootKind,
        version: "3.0.0",
      },
      Rows.empty(),
    );
    const rows = yield* processingRows(
      {
        document: tree,
        env: setting.env ?? environmentOf(doc, setting.mode),
        language: setting.language,
        mode: setting.mode,
        nodes: built.nodes,
        root: subtree.root,
        rootKind: setting.rootKind,
        tree,
        version: "3.0.0",
      },
      built.rows,
    );
    const rendered = renderTree(rows, tree);

    yield* fs.makeDirectory(workDirectory, { recursive: true });

    const scratch = yield* fs.makeTempDirectoryScoped({
      directory: workDirectory,
      prefix: "export-processing-test-",
    });
    const file = `${scratch}/subtree.xml`;
    yield* fs.writeFileString(file, yield* Effect.orDie(writeXml(subtree)));

    return {
      oracle: decode(yield* xmllintC14n(file)),
      read: decode(canonicalize(subtree)),
      rendered: decode(canonicalize(rendered)),
    };
  }).pipe(Effect.scoped);

const readFixture = (directory: string, name: string) =>
  Effect.gen(function* readFixtureFile() {
    const fs = yield* FileSystem.FileSystem;

    return yield* readXml(yield* fs.readFile(path.join(fixtures, directory, `${name}.xml`)));
  });

layer(TestLayer, { excludeTestServices: true })("export/processing.ts", (suite) => {
  suite.effect("renders the qti-response-processing of response.xml as it was read", () =>
    Effect.gen(function* responseSubtree() {
      const doc = yield* readFixture("valid", "response");
      const forms = yield* roundTrip(doc, "qti-response-processing", itemSetting);

      assert.strictEqual(forms.rendered, forms.read);
      assert.strictEqual(forms.rendered, forms.oracle);
    }),
  );

  suite.effect("renders the lexical forms of padded-processing.xml as they were written", () =>
    Effect.gen(function* paddedSubtree() {
      const doc = yield* readFixture("guards", "padded-processing");
      const forms = yield* roundTrip(doc, "qti-response-processing", itemSetting);

      assert.strictEqual(forms.rendered, forms.read);
      assert.strictEqual(forms.rendered, forms.oracle);
      for (const lexical of [
        'identifier=" R "',
        'tolerance="0.5  1"',
        'case-sensitive=" true"',
        'figures=" 3"',
        'pattern=" a"',
      ]) {
        assert.include(forms.rendered, lexical);
      }
    }),
  );

  suite.effect("renders the qti-outcome-processing of outcome.xml as it was read", () =>
    Effect.gen(function* outcomeSubtree() {
      const doc = yield* readFixture("valid", "outcome");
      const forms = yield* roundTrip(doc, "qti-outcome-processing", outcomeSetting);

      assert.strictEqual(forms.rendered, forms.read);
      assert.strictEqual(forms.rendered, forms.oracle);
    }),
  );

  suite.effect("renders a defaulted attribute only where the source wrote it", () =>
    Effect.gen(function* defaulted() {
      const text = `<qti-response-processing xmlns="${asiNamespace}"><qti-set-outcome-value identifier="O"><qti-and><qti-equal tolerance-mode="exact"><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">1</qti-base-value></qti-equal><qti-equal><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">1</qti-base-value></qti-equal><qti-string-match case-sensitive="true" substring="false"><qti-base-value base-type="string">a</qti-base-value><qti-base-value base-type="string">a</qti-base-value></qti-string-match><qti-string-match case-sensitive="true"><qti-base-value base-type="string">a</qti-base-value><qti-base-value base-type="string">a</qti-base-value></qti-string-match></qti-and></qti-set-outcome-value></qti-response-processing>`;
      const doc = yield* readXml(new TextEncoder().encode(text));
      const forms = yield* roundTrip(doc, "qti-response-processing", {
        env: withDeclarations(emptyEnvironment("item"), [outcomeOf("O", "boolean")]),
        language: "response",
        mode: "item",
        rootKind: "item",
      });

      assert.strictEqual(forms.rendered, forms.read);
      assert.strictEqual(forms.rendered.split("tolerance-mode=").length - 1, 1);
      assert.strictEqual(forms.rendered.split("substring=").length - 1, 1);
    }),
  );

  suite.effect("renders the qti-response-processing of response-mapped.xml as it was read", () =>
    Effect.gen(function* mappedSubtree() {
      const doc = yield* readFixture("valid", "response-mapped");
      const forms = yield* roundTrip(doc, "qti-response-processing", itemSetting);

      assert.strictEqual(forms.rendered, forms.read);
      assert.strictEqual(forms.rendered, forms.oracle);
      assert.include(forms.rendered, "<qti-map-response");
    }),
  );

  suite.effect("renders the qti-template-processing of template.xml as it was read", () =>
    Effect.gen(function* templateSubtree() {
      const doc = yield* readFixture("valid", "template");
      const forms = yield* roundTrip(doc, "qti-template-processing", {
        language: "template",
        mode: "template",
        rootKind: "item",
      });

      assert.strictEqual(forms.rendered, forms.read);
      assert.strictEqual(forms.rendered, forms.oracle);
    }),
  );

  suite.effect("renders each of the five template documents as it was read", () =>
    Effect.gen(function* templateDocumentsRoundTrip() {
      const fs = yield* FileSystem.FileSystem;
      const documents = yield* templateDocuments();
      assert.strictEqual(documents.length, 5);

      for (const document of documents) {
        const doc = yield* readXml(yield* fs.readFile(document.path));
        const built = yield* rptemplateRows(
          {
            doc,
            packageId: crypto.randomUUID(),
            path: document.path,
            resource: path.basename(document.path, ".xml"),
            resourceType: "imsqti_rptemplate_xmlv3p0",
            version: "3.0.0",
          },
          Rows.empty(),
        );
        const rendered = decode(canonicalize(renderTree(built.rows, built.documentId)));

        assert.strictEqual(rendered, decode(canonicalize(doc)), document.path);
      }
    }),
  );

  suite.effect("renders response.xml as a whole item, its xi:include with href and parse", () =>
    Effect.gen(function* wholeItem() {
      const doc = yield* readFixture("valid", "response");
      const built = yield* itemRows(
        {
          doc,
          packageId: crypto.randomUUID(),
          path: "response.xml",
          resource: "response",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const rendered = decode(canonicalize(renderTree(built.rows, built.documentId)));

      assert.strictEqual(rendered, decode(canonicalize(doc)));
      assert.include(rendered, '<xi:include href="shared-rules.xml" parse="xml">');
      assert.include(rendered, "<xi:fallback>fallback</xi:fallback>");
    }),
  );
});
