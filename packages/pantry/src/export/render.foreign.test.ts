/**
 * The export's render of foreign content (spec W10): rows the import path builds in memory from
 * inline XML literals, cut from the edits of `operator-foreign-content` and `lom-wildcard`, render
 * back to the canonical form of their source. No tarball and no database.
 */
import { readFile } from "node:fs/promises";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { renderTree } from "#pantry/export/render.ts";
import type { ItemInput } from "#pantry/import/item.ts";
import { itemRows } from "#pantry/import/item.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { Rows } from "#pantry/import/tree.ts";
import { ForeignAttribute } from "#pantry/schema/foreign.ts";
import { NamespaceDeclaration } from "#pantry/schema/node.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

const lom = "http://ltsc.ieee.org/xsd/LOM";

const mathassess = "http://mathassess.qtitools.org/xsd/mathassess";

const xinclude = "http://www.w3.org/2001/XInclude";

const xlink = "http://www.w3.org/1999/xlink";

const xsi = "http://www.w3.org/2001/XMLSchema-instance";

const textOf = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const decode = (xml: string) => readXml(new TextEncoder().encode(xml));

/**
 * An item whose response processing holds one `qti-custom-operator` with `attributes` and `inner`.
 */
const operatorItem = (inner: string, attributes: string): string =>
  `<qti-assessment-item xmlns="${asi}" xmlns:ma="${mathassess}" xmlns:xi="${xinclude}" xmlns:xsi="${xsi}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="S" cardinality="single" base-type="string"/><qti-response-processing><qti-set-outcome-value identifier="S"><qti-custom-operator ${attributes}>${inner}</qti-custom-operator></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`;

const operand = '<qti-base-value base-type="string"><![CDATA[x]]></qti-base-value>';

/**
 * `operator-foreign-content`'s edits: `xml:foo` on the operator, and after its operand a foreign
 * `ma:extension` carrying every kind of attribute, then an `xi:include` with a fallback. The
 * `xi:include` elements carry no `href`: under the operator they are wildcard content that the
 * processing parser skips, so no `XIncludeHref` row is written for them and the attribute would
 * not survive the import, whichever way it is rendered (reported as a follow-up of this slice).
 */
const foreignContent = operatorItem(
  `${operand}<ma:extension ma:k="v" plain="1" xml:lang="en" xml:space="preserve" xml:id="x1" xml:foo="1">text<ma:inner/><p>para</p><qti-prompt>lax</qti-prompt><xi:include/></ma:extension><xi:include><xi:fallback><p>fallback</p><foo xmlns="">local</foo></xi:fallback></xi:include>`,
  'class="org.qtitools.mathassess.CasProcess" ma:syntax="text/x-maxima" xml:foo="1"',
);

/**
 * The same content with `xsi:foo="1"` on the extension and on the operator (decision 227 (c)).
 */
const xsiForeign = operatorItem(
  `${operand}<ma:extension ma:k="v" xsi:foo="1"><ma:inner/></ma:extension>`,
  'class="org.example.Op" xsi:foo="1"',
);

/**
 * The extension of `lom-wildcard`: a foreign attribute, the four `xml:` attributes the schema
 * reads, the ten XLink attributes and one it does not declare, XLink bound to `xlinkPrefix`.
 */
const lomExtension = (xlinkPrefix: string): string => {
  const x = (name: string, value: string): string => `${xlinkPrefix}:${name}="${value}"`;

  return `<ma:ext ma:k="v" xml:id="m1" xml:space="preserve" ${[
    x("type", "simple"),
    x("href", "https://example.org/a"),
    x("role", "https://example.org/r"),
    x("arcrole", "https://example.org/ar"),
    x("title", " t "),
    x("show", "new"),
    x("actuate", "onLoad"),
    x("label", "a"),
    x("from", "a"),
    x("to", "b"),
    x("foo", "1"),
  ].join(" ")}/>`;
};

/**
 * A manifest whose one resource's LOM `general` holds `lom-wildcard`'s extension, and whose `lom`
 * carries a foreign and an XLink attribute, XLink bound to `xlinkPrefix` on the `lom`.
 */
const lomManifest = (xlinkPrefix: string): string =>
  `<manifest xmlns="${cp}" xmlns:imsmd="${lom}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom xmlns:ma="${mathassess}" xmlns:${xlinkPrefix}="${xlink}" ma:k="v" ${xlinkPrefix}:href="https://example.org/lom"><imsmd:general>${lomExtension(xlinkPrefix)}</imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`;

/**
 * `rows` with the prefix `xlink` written as `xl`: the declarations that bind it and the foreign
 * attributes in the XLink namespace.
 */
const reprefixed = (rows: Rows): Rows => {
  const declarations = Rows.of(rows, NamespaceDeclaration).map((row) =>
    row.prefix === "xlink" ? { ...row, prefix: "xl" } : row,
  );
  const attributes = Rows.of(rows, ForeignAttribute).map((row) =>
    row.namespace === xlink ? { ...row, prefix: "xl" } : row,
  );

  return new Map(rows).set(NamespaceDeclaration, declarations).set(ForeignAttribute, attributes);
};

/**
 * Import `xml` as an item through the importer and render it back, the source's canonical form
 * beside the rendered one.
 */
const itemRoundTrip = (xml: string) =>
  Effect.gen(function* roundTripItem() {
    const doc = yield* decode(xml);
    const input: ItemInput = {
      doc,
      packageId: crypto.randomUUID(),
      path: "foreign.xml",
      resource: "foreign",
      resourceLomHasGeneral: false,
      resourceType: "imsqti_item_xmlv3p0",
      version: "3.0.0",
    };
    const { documentId, rows } = yield* itemRows(input, Rows.empty());

    return {
      rendered: textOf(canonicalize(renderTree(rows, documentId))),
      source: textOf(canonicalize(doc)),
    };
  });

/**
 * Import `xml` as a manifest and render it back.
 *
 * The importer matches the typed `xlink:` names by their written `xlink:` spelling, so a manifest
 * that binds XLink to `xl` is imported with `xlink` and its rows are then given the prefix `xl`:
 * the typed relations store no prefix, so the only rows that differ are the declaration and the
 * prefix of the XLink-namespace foreign attributes, which is what a namespace-aware importer
 * writes for the `xl` source. `xml` is the source the rendered form is compared with.
 */
const manifestRoundTrip = (xml: string, imported = xml) =>
  Effect.gen(function* roundTripManifest() {
    const doc = yield* decode(xml);
    const built = yield* manifestRows("", [], yield* decode(imported), Rows.empty());
    const rows = imported === xml ? built.rows : reprefixed(built.rows);

    return {
      rendered: textOf(canonicalize(renderTree(rows, built.packageId))),
      source: textOf(canonicalize(doc)),
    };
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts on foreign content, no database",
  (it) => {
    it.effect("operator-foreign-content renders back to its canonical source", () =>
      Effect.gen(function* operatorContent() {
        const { rendered, source } = yield* itemRoundTrip(foreignContent);

        assert.strictEqual(rendered, source);
        assert.include(rendered, "<ma:extension");
        assert.include(rendered, 'xml:foo="1"');
        assert.include(rendered, 'ma:syntax="text/x-maxima"');
      }),
    );

    it.effect("xsi:foo on the extension and the operator is written in the xsi namespace", () =>
      Effect.gen(function* xsiFooRendered() {
        const { rendered, source } = yield* itemRoundTrip(xsiForeign);

        assert.strictEqual(rendered, source);
        assert.strictEqual(rendered.split('xsi:foo="1"').length - 1, 2);
      }),
    );

    it.effect("lom-wildcard renders back, XLink bound to xlink", () =>
      Effect.gen(function* lomXlink() {
        const { rendered, source } = yield* manifestRoundTrip(lomManifest("xlink"));

        assert.strictEqual(rendered, source);
        assert.include(rendered, 'xlink:href="https://example.org/a"');
        assert.include(rendered, 'xlink:foo="1"');
      }),
    );

    it.effect(
      "lom-wildcard with XLink bound to xl writes the xl prefix in the XLink namespace",
      () =>
        Effect.gen(function* lomXlinkPrefixed() {
          const { rendered, source } = yield* manifestRoundTrip(
            lomManifest("xl"),
            lomManifest("xlink"),
          );

          assert.strictEqual(rendered, source);
          assert.include(rendered, 'xl:href="https://example.org/a"');
          assert.notInclude(rendered, "xlink:href");
        }),
    );

    it.effect("render.ts reads no attribute outside attribute-homes.ts", () =>
      Effect.gen(function* noSecondAttributePath() {
        const source = yield* Effect.promise(() =>
          readFile(new URL("render.ts", import.meta.url), "utf-8"),
        );
        const relations =
          /\b(?:ForeignAttribute|Xlink[A-Z]\w*|NodeXml\w+|DocumentXmlId|ManifestXmlId)\b/u;

        assert.notMatch(source, relations);
      }),
    );
  },
);
