/**
 * The wildcard classification of the tree walk (spec W06): which kind an element is inside wildcard
 * content, and which attribute of an element is typed, foreign or a stray. Every case reads a
 * tree from an inline literal with `readXml`, runs `treeRows` and reads the kind the walk gave each
 * element from the node index; no database, no tarball. The case names carry the probe each one
 * pins (3.3's `lax/NN`).
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows, treeRows, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { TreeInput } from "#pantry/import/tree.ts";
import { classifyAttribute, isForeignAttribute, scopeOf } from "#pantry/import/wildcard.ts";
import type { AttributeClass } from "#pantry/import/wildcard.ts";
import type { NodeKindHandle, RootKindHandle } from "#pantry/schema/node.ts";
import { admission } from "#pantry/schema/seed/admission.ts";

const namespaces = {
  asi: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  cp: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1",
  cpx: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
  lom: "http://ltsc.ieee.org/xsd/LOM",
  mathml: "http://www.w3.org/1998/Math/MathML",
  qmd: "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0",
  ud: "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0",
  xi: "http://www.w3.org/2001/XInclude",
  xlink: "http://www.w3.org/1999/xlink",
  xsi: "http://www.w3.org/2001/XMLSchema-instance",
} as const;

const { asi, cp, cpx, lom, mathml, qmd, ud, xi, xlink, xsi } = namespaces;

const treeId = "11111111-1111-4111-8111-111111111111";

const inputOf = (root: RootKindHandle, charset: string): TreeInput => ({
  charset,
  id: treeId,
  kind: root === "manifest" ? "manifest" : "document",
  root,
  version: "3.0.0",
});

/**
 * What the walk made of each element of a tree, in document order.
 */
interface Walked {
  readonly element: Element;
  readonly kind: NodeKindHandle;
}

const walkedOf = (xml: string, root: RootKindHandle) =>
  Effect.gen(function* walkTree() {
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const built = yield* treeRows(doc, inputOf(root, doc.charset), Rows.empty());

    return [...built.nodes].map(([element, node]): Walked => ({ element, kind: node.kind }));
  });

const refusalOf = (xml: string, root: RootKindHandle) =>
  Effect.gen(function* refuseTree() {
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const exit = yield* Effect.exit(treeRows(doc, inputOf(root, doc.charset), Rows.empty()));
    const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
    const refusal = Option.getOrThrow(failure);
    assert.instanceOf(refusal, UnmodeledVocabulary);

    return refusal;
  });

const named = (walked: readonly Walked[], qname: string): Walked => {
  const found = walked.find((entry) => entry.element.qname === qname);
  assert.isDefined(found, `the tree holds ${qname}`);

  return found;
};

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

const mustDescend = (element: Element, qname: string): Element => {
  const found = descend(element, qname);
  assert.isDefined(found, `the tree holds ${qname}`);

  return found;
};

const declarations = `xmlns="${asi}" xmlns:ma="urn:test:ma" xmlns:m="${mathml}" xmlns:xi="${xi}" xmlns:xsi="${xsi}" xmlns:q="${asi}"`;

const operand = '<qti-base-value base-type="integer">1</qti-base-value>';

/**
 * An item whose response processing holds a `qti-custom-operator` that carries `attributes` and
 * `inner`.
 */
const operatorItem = (inner: string, attributes = ""): string =>
  `<qti-assessment-item ${declarations} identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-processing><qti-set-outcome-value identifier="S"><qti-custom-operator ${attributes}>${inner}</qti-custom-operator></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`;

const bodyItem = (inner: string): string =>
  `<qti-assessment-item ${declarations} identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body>${inner}</qti-item-body></qti-assessment-item>`;

/**
 * A manifest whose one resource file holds `fileMetadata` and whose manifest metadata holds
 * `lomContent` inside a LOM.
 */
const manifest = (fileMetadata: string, lomContent: string): string =>
  `<manifest xmlns="${cp}" xmlns:imsmd="${lom}" xmlns:cpx="${cpx}" xmlns:qmd="${qmd}" xmlns:ma="urn:test:ma" identifier="M"><metadata><imsmd:lom>${lomContent}</imsmd:lom></metadata><organizations/><resources><resource identifier="r" type="imsqti_item_xmlv3p0" href="a.xml"><file href="a.xml"><metadata>${fileMetadata}</metadata></file></resource></resources></manifest>`;

/**
 * The class of attribute `local` (as written, `prefix:local` or bare) of the first element named
 * `qname`, judged as the walk judges it.
 */
const classOf = (
  walked: readonly Walked[],
  qname: string,
  written: string,
  root: RootKindHandle,
) => {
  const { element, kind } = named(walked, qname);
  const attribute = element.attributes.find((found) => found.qname === written);
  assert.isDefined(attribute, `${qname} carries ${written}`);

  return classifyAttribute(scopeOf(root, "3.0.0"), attribute, kind, new Set());
};

describe("import/tree.ts wildcard element classification", () => {
  it.effect("lax/01: an element in another namespace under the operator is foreign", () =>
    Effect.gen(function* lax01() {
      const walked = yield* walkedOf(operatorItem(`${operand}<ma:foo/>`), "item");

      assert.strictEqual(named(walked, "ma:foo").kind, "foreign");
      assert.strictEqual(named(walked, "qti-base-value").kind, "qti-base-value");
    }),
  );

  it.effect("lax/04: a typed global under a foreign element is its kind", () =>
    Effect.gen(function* lax04() {
      const walked = yield* walkedOf(operatorItem(`${operand}<ma:foo><p>x</p></ma:foo>`), "item");

      assert.strictEqual(named(walked, "p").kind, "p");
    }),
  );

  it.effect(
    "lax/06: a QTI element with no global declaration under a foreign element is foreign",
    () =>
      Effect.gen(function* lax06() {
        const walked = yield* walkedOf(
          operatorItem(`${operand}<ma:foo><qti-prompt/></ma:foo>`),
          "item",
        );
        const prompt = named(walked, "qti-prompt");

        assert.strictEqual(prompt.kind, "foreign");
        assert.strictEqual(prompt.element.namespace, asi);
      }),
  );

  it.effect("lax/11: a nested root and its content are foreign", () =>
    Effect.gen(function* lax11() {
      const walked = yield* walkedOf(
        operatorItem(
          `${operand}<ma:foo><qti-assessment-item identifier="j"><qti-item-body/></qti-assessment-item></ma:foo>`,
        ),
        "item",
      );
      const nested = walked.filter(
        (entry) =>
          entry.element.local === "qti-assessment-item" && entry.element.attributes.length === 1,
      );

      assert.strictEqual(nested.length, 1);
      assert.strictEqual(nested[0]?.kind, "foreign");
      assert.strictEqual(named(walked, "ma:foo").kind, "foreign");
      assert.strictEqual(walked.filter((entry) => entry.kind === "foreign").length, 3);
      assert.strictEqual(
        walked.find((entry) => entry.element.local === "qti-item-body")?.kind,
        "foreign",
      );
    }),
  );

  it.effect(
    "lax/13: MathML with a kind is walked as that kind, and the database refuses its place",
    () =>
      Effect.gen(function* lax13() {
        const walked = yield* walkedOf(
          operatorItem(`${operand}<ma:foo><m:mi>x</m:mi></ma:foo>`),
          "item",
        );

        assert.strictEqual(named(walked, "ma:foo").kind, "foreign");
        assert.strictEqual(named(walked, "m:mi").kind, "m:mi");

        for (const version of ["3.0.0", "3.0.1"]) {
          const children = admission
            .filter((row) => row.parent === "foreign" && row.version === version)
            .map((row) => row.child);

          assert.include(children, "m:math");
          assert.notInclude(children, "m:mi");
        }
      }),
  );

  it.effect("a MathML name that no global declares is foreign", () =>
    Effect.gen(function* undeclaredMathml() {
      const walked = yield* walkedOf(operatorItem(`${operand}<ma:foo><m:foo/></ma:foo>`), "item");

      assert.strictEqual(named(walked, "m:foo").kind, "foreign");
    }),
  );

  it.effect("RA-3: template under a foreign element is template", () =>
    Effect.gen(function* template() {
      const walked = yield* walkedOf(
        operatorItem(`${operand}<ma:foo><template/></ma:foo>`),
        "item",
      );

      assert.strictEqual(named(walked, "template").kind, "template");
    }),
  );

  it.effect("lax/20: xi:include under the host and under a foreign element is xi:include", () =>
    Effect.gen(function* lax20() {
      const walked = yield* walkedOf(
        operatorItem(`${operand}<xi:include href="a"/><ma:foo><xi:include href="b"/></ma:foo>`),
        "item",
      );
      const includes = walked.filter((entry) => entry.element.qname === "xi:include");

      assert.deepStrictEqual(
        includes.map((entry) => entry.kind),
        ["xi:include", "xi:include"],
      );
    }),
  );

  it.effect(
    "p under lom:general in a manifest is foreign: the manifest set does not declare it",
    () =>
      Effect.gen(function* paragraphUnderLom() {
        const walked = yield* walkedOf(
          manifest("", `<imsmd:general><p xmlns="${asi}"/></imsmd:general>`),
          "manifest",
        );

        assert.strictEqual(named(walked, "imsmd:general").kind, "lom:general");
        assert.strictEqual(named(walked, "p").kind, "foreign");
      }),
  );

  it.effect("ud:usageData under the operator in an item is foreign: the item set lacks it", () =>
    Effect.gen(function* usageDataUnderOperator() {
      const walked = yield* walkedOf(
        operatorItem(`${operand}<ud:usageData xmlns:ud="${ud}"/>`),
        "item",
      );

      assert.strictEqual(named(walked, "ud:usageData").kind, "foreign");
    }),
  );

  it.effect("lax/24: a nested processing root under a foreign element is foreign", () =>
    Effect.gen(function* lax24() {
      const walked = yield* walkedOf(
        operatorItem(`${operand}<ma:foo><qti-response-processing/></ma:foo>`),
        "item",
      );
      const nested = walked.filter((entry) => entry.element.local === "qti-response-processing");

      assert.deepStrictEqual(
        nested.map((entry) => entry.kind),
        ["qti-response-processing", "foreign"],
      );
    }),
  );

  it.effect("a manifest extension under a LOM host and under cp:metadata.file is foreign", () =>
    Effect.gen(function* manifestExtension() {
      const walked = yield* walkedOf(
        manifest("<cpx:variant/>", "<cpx:variant/><qmd:qtiMetadata/>"),
        "manifest",
      );
      const variants = walked.filter((entry) => entry.element.qname === "cpx:variant");

      assert.deepStrictEqual(
        variants.map((entry) => entry.kind),
        ["foreign", "foreign"],
      );
      // Reading 32: under `lom:lom` the qmd metadata keeps its own kind.
      assert.strictEqual(named(walked, "qmd:qtiMetadata").kind, "qmd:qtiMetadata");
    }),
  );

  it.effect("a strict host refuses an element that is no opaque global", () =>
    Effect.gen(function* strictHost() {
      const refusal = yield* refusalOf(manifest("<ma:ext/>", ""), "manifest");

      assert.strictEqual(refusal.kind, "element");
      assert.strictEqual(refusal.name, "ma:ext");
      assert.deepStrictEqual(refusal.parent, Option.some("metadata"));
    }),
  );

  it.effect("outside wildcard content every vocabulary keeps the kind kindOf gives it", () =>
    Effect.gen(function* outside() {
      const item = yield* walkedOf(bodyItem("<p>x</p>"), "item");
      const manifested = yield* walkedOf(manifest("<imsmd:lom/>", ""), "manifest");

      assert.deepStrictEqual(
        item.map((entry) => entry.kind),
        ["qti-assessment-item", "qti-item-body", "p"],
      );
      assert.strictEqual(named(manifested, "manifest").kind, "cp:manifest");
      assert.strictEqual(named(manifested, "resource").kind, "cp:resource");
      assert.isTrue(manifested.some((entry) => entry.kind === "lom:lom"));
    }),
  );
});

describe("import/tree.ts wildcard attribute classification", () => {
  it.effect("xml:foo on a foreign element and on the operator is not a stray", () =>
    Effect.gen(function* xmlFoo() {
      const walked = yield* walkedOf(
        operatorItem(`${operand}<ma:foo xml:foo="1"/>`, 'xml:foo="1"'),
        "item",
      );

      assert.strictEqual(classOf(walked, "ma:foo", "xml:foo", "item"), "foreign");
      assert.strictEqual(classOf(walked, "qti-custom-operator", "xml:foo", "item"), "foreign");
    }),
  );

  it.effect("xml:lang on the operator is typed, a declared global (C-4)", () =>
    Effect.gen(function* xmlLang() {
      const walked = yield* walkedOf(operatorItem(operand, 'xml:lang="en"'), "item");

      assert.strictEqual(classOf(walked, "qti-custom-operator", "xml:lang", "item"), "typed");
    }),
  );

  it.effect("an unqualified name the operator's registry lacks is refused", () =>
    Effect.gen(function* unqualified() {
      const refusal = yield* refusalOf(operatorItem(operand, 'foo="1"'), "item");

      assert.strictEqual(refusal.kind, "attribute");
      assert.strictEqual(refusal.name, "foo");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-custom-operator"));
    }),
  );

  it.effect("an unqualified name is foreign on a foreign element", () =>
    Effect.gen(function* foreignUnqualified() {
      const walked = yield* walkedOf(operatorItem(`${operand}<ma:foo foo="1"/>`), "item");

      assert.strictEqual(classOf(walked, "ma:foo", "foo", "item"), "foreign");
    }),
  );

  it.effect(
    "Rework 3: xsi:foo is foreign on a foreign element and on the operator, refused on p",
    () =>
      Effect.gen(function* xsiFoo() {
        const walked = yield* walkedOf(
          operatorItem(`${operand}<ma:foo xsi:foo="1"/>`, 'xsi:foo="1"'),
          "item",
        );

        assert.strictEqual(classOf(walked, "ma:foo", "xsi:foo", "item"), "foreign");
        assert.strictEqual(classOf(walked, "qti-custom-operator", "xsi:foo", "item"), "foreign");

        const refusal = yield* refusalOf(bodyItem('<p xsi:foo="1"/>'), "item");

        assert.strictEqual(refusal.kind, "attribute");
        assert.strictEqual(refusal.name, "xsi:foo");
        assert.deepStrictEqual(refusal.parent, Option.some("p"));
      }),
  );

  it.effect("the four declared xsi names are never typed or foreign", () =>
    Effect.gen(function* declaredXsi() {
      const written = `xsi:type="x" xsi:nil="true" xsi:schemaLocation="a b" xsi:noNamespaceSchemaLocation="c"`;
      const doc = yield* readXml(
        new TextEncoder().encode(operatorItem(`${operand}<ma:foo ${written}/>`, written)),
      );
      const scope = scopeOf("item", "3.0.0");
      const hosts: readonly (readonly [Element, NodeKindHandle])[] = [
        [mustDescend(doc.root, "ma:foo"), "foreign"],
        [mustDescend(doc.root, "qti-custom-operator"), "qti-custom-operator"],
      ];

      for (const [element, kind] of hosts) {
        const declared = element.attributes.filter((found) => found.namespace === xsi);

        assert.strictEqual(declared.length, 4);
        for (const attribute of declared) {
          const judged: AttributeClass = classifyAttribute(scope, attribute, kind, new Set());

          assert.strictEqual(judged, "declared", `${element.qname} ${attribute.qname}`);
          assert.isFalse(isForeignAttribute(scope, attribute, kind, new Set()));
        }
      }
    }),
  );

  it.effect(
    "xsi:type and xsi:noNamespaceSchemaLocation are accepted on a foreign element, xsi:nil is judged",
    () =>
      Effect.gen(function* declaredJudged() {
        for (const name of ["xsi:type", "xsi:noNamespaceSchemaLocation"]) {
          yield* walkedOf(operatorItem(`${operand}<ma:foo ${name}="x"/>`), "item");
        }

        const doc = yield* readXml(
          new TextEncoder().encode(operatorItem(`${operand}<ma:foo xsi:nil="x"/>`)),
        );
        const exit = yield* Effect.exit(treeRows(doc, inputOf("item", doc.charset), Rows.empty()));
        const refusal = Option.getOrThrow(
          Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none(),
        );

        assert.instanceOf(refusal, ImportRefused);
        assert.strictEqual(refusal.rule, "attribute-lexical");
      }),
  );

  it.effect("in an externalLom tree xml:space and xml:id on a foreign element are foreign", () =>
    Effect.gen(function* externalLom() {
      const external = yield* walkedOf(
        `<imsmd:lom xmlns:imsmd="${lom}" xmlns:ma="urn:test:ma"><ma:ext xml:space="preserve" xml:id="x"/></imsmd:lom>`,
        "externalLom",
      );

      assert.strictEqual(classOf(external, "ma:ext", "xml:space", "externalLom"), "foreign");
      assert.strictEqual(classOf(external, "ma:ext", "xml:id", "externalLom"), "foreign");

      // Control: the manifest set declares the same names, so a foreign element there types them.
      const inManifest = yield* walkedOf(
        manifest("", '<ma:ext xml:space="preserve" xml:id="x"/>'),
        "manifest",
      );

      assert.strictEqual(classOf(inManifest, "ma:ext", "xml:space", "manifest"), "typed");
      assert.strictEqual(classOf(inManifest, "ma:ext", "xml:id", "manifest"), "typed");
    }),
  );

  it.effect("xml:space on p is still refused", () =>
    Effect.gen(function* spaceOnParagraph() {
      const refusal = yield* refusalOf(bodyItem('<p xml:space="preserve"/>'), "item");

      assert.strictEqual(refusal.kind, "attribute");
      assert.strictEqual(refusal.name, "xml:space");
      assert.deepStrictEqual(refusal.parent, Option.some("p"));
    }),
  );
});

/**
 * An `xi:include` that carries `attributes` and `inner`, declaring the two prefixes it uses.
 */
const include = (attributes: string, inner = "") =>
  `<xi:include xmlns:xi="${xi}" xmlns:xlink="${xlink}" ${attributes}>${inner}</xi:include>`;

describe("import/tree.ts global attributes on every attribute wildcard host (decision 257)", () => {
  it.effect("xlink:href on xi:include in a manifest is typed on a foreign element", () =>
    Effect.gen(function* hrefOnInclude() {
      const walked = yield* walkedOf(manifest("", include('xlink:href="a"')), "manifest");

      assert.strictEqual(named(walked, "xi:include").kind, "foreign");
      assert.strictEqual(classOf(walked, "xi:include", "xlink:href", "manifest"), "typed");
    }),
  );

  it.effect("xlink:href on xi:fallback under a foreign xi:include is typed, not refused", () =>
    Effect.gen(function* hrefOnFallback() {
      const walked = yield* walkedOf(
        manifest("", include('xlink:href="a"', `<xi:fallback xlink:href="b"/>`)),
        "manifest",
      );

      assert.strictEqual(named(walked, "xi:fallback").kind, "foreign");
      assert.strictEqual(classOf(walked, "xi:fallback", "xlink:href", "manifest"), "typed");
    }),
  );

  it.effect("a name the host's policy refuses is not typed: q:foo on the operator", () =>
    Effect.gen(function* excludedNamespace() {
      const walked = yield* walkedOf(operatorItem(operand, 'q:foo="1"'), "item");

      // The walk keeps it a foreign attribute, as before; the importer's wildcard guard
      // refuses it against the operator's attributeExclusion row (wildcard-namespace, decision 270).
      assert.strictEqual(classOf(walked, "qti-custom-operator", "q:foo", "item"), "foreign");
    }),
  );
});
