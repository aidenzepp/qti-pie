/**
 * The export's render of the `xsi` attributes (decision 227 (a), "accept and export byte for
 * byte"): rows the import path builds in memory from inline XML literals render back to the
 * canonical form of their source. They cover `xsi:type`, `xsi:nil` and
 * `xsi:noNamespaceSchemaLocation` on a QTI element, a foreign element and the root, under a prefix
 * other than `xsi`, one value padded; the attributes a derived `xsi:type` adds, with the types read
 * from the tables of `seed/xsi.ts` by property; and a manifest that binds XLink to `xl`. No tarball
 * and no database.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { renderTree } from "#pantry/export/render.ts";
import { itemRows } from "#pantry/import/item.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { Rows } from "#pantry/import/tree.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  declaredChild,
  typeAttributeWildcard,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const { asi, xml: xmlNamespace, xs } = typeNamespaces;

const xsi = "http://www.w3.org/2001/XMLSchema-instance";

const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

const lom = "http://ltsc.ieee.org/xsd/LOM";

const xlink = "http://www.w3.org/1999/xlink";

const set: SchemaSetHandle = "asi";

const version: SchemaVersionHandle = "3.0.1";

const inBlock = (row: { readonly set: SchemaSetHandle; readonly version: SchemaVersionHandle }) =>
  row.set === set && row.version === version;

const keyOf = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

const ref = (type: TypeKey): string =>
  "anonymous" in type ? "anonymous" : `${type.namespace === xs ? "xs" : "qti"}:${type.local}`;

const declaredOf = (local: string): TypeKey =>
  declaredChild.filter(inBlock).find((row) => row.local === local)?.type ??
  assert.fail(`the tables declare no ${local}`);

const lineage = (start: TypeKey): readonly TypeKey[] => {
  const found: TypeKey[] = [start];

  for (const current of found) {
    for (const row of typeDerivation.filter(inBlock)) {
      if (keyOf(row.type) === keyOf(current) && !found.some((t) => keyOf(t) === keyOf(row.base))) {
        found.push(row.base);
      }
    }
  }

  return found;
};

const derivedFrom = (declared: TypeKey): readonly TypeKey[] =>
  typeDerivation
    .filter(
      (row) =>
        inBlock(row) &&
        row.variety === "complex" &&
        keyOf(row.type) !== keyOf(declared) &&
        lineage(row.type).some((ancestor) => keyOf(ancestor) === keyOf(declared)),
    )
    .map((row) => row.type);

const usesOf = (type: TypeKey) =>
  attributeUse.filter((row) => inBlock(row) && keyOf(row.type) === keyOf(type));

const wildcardOf = (type: TypeKey) =>
  typeAttributeWildcard.find((row) => inBlock(row) && keyOf(row.type) === keyOf(type));

const typeOrFail = (type: TypeKey | undefined, what: string): TypeKey =>
  type ?? assert.fail(`the tables hold no ${what}`);

/**
 * A type derived from `qti-null`'s declared type with no attribute wildcard whose required uses
 * are `map-key` and `mapped-value`.
 */
const entryType = typeOrFail(
  derivedFrom(declaredOf("qti-null")).find((type) => {
    const required = usesOf(type)
      .filter((use) => use.required)
      .map((use) => use.local)
      .toSorted();

    return (
      wildcardOf(type) === undefined &&
      required.length === 2 &&
      required[0] === "map-key" &&
      required[1] === "mapped-value"
    );
  }),
  "type derived from qti-null's with the required uses map-key and mapped-value",
);

/**
 * A type derived from `qti-exit-response`'s declared type with a `##any` `lax` attribute wildcard,
 * an `xml:lang` use and an `id` use, and no required use.
 */
const wildcardType = typeOrFail(
  derivedFrom(declaredOf("qti-exit-response")).find((type) => {
    const wildcard = wildcardOf(type);
    const uses = usesOf(type);

    return (
      wildcard?.process === "lax" &&
      wildcard.namespaces === "##any" &&
      uses.every((use) => !use.required) &&
      uses.some((use) => use.namespace === xmlNamespace && use.local === "lang") &&
      uses.some((use) => use.namespace === "" && use.local === "id")
    );
  }),
  "type derived from qti-exit-response's with a ##any lax wildcard and xml:lang and id uses",
);

const textOf = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const decode = (xml: string) => readXml(new TextEncoder().encode(xml));

/**
 * An item whose root binds the prefix `i` to the `xsi` namespace and carries `rootAttributes`,
 * with `inner` as its content.
 */
const itemOf = (inner: string, rootAttributes = ""): string =>
  `<qti-assessment-item xmlns="${asi}" xmlns:qti="${asi}" xmlns:xs="${xs}" xmlns:i="${xsi}" xmlns:ma="urn:test:ma" identifier="i" title="t" adaptive="false" time-dependent="false" ${rootAttributes}>${inner}</qti-assessment-item>`;

/**
 * An item whose response processing holds `expression` in a `qti-set-outcome-value`.
 */
const expressionItem = (expression: string): string =>
  itemOf(
    `<qti-outcome-declaration identifier="S" cardinality="single" base-type="integer"/><qti-response-processing><qti-set-outcome-value identifier="S">${expression}</qti-set-outcome-value></qti-response-processing>`,
  );

/**
 * An item whose response processing holds `rule`, after an item body.
 */
const ruleItem = (rule: string): string =>
  itemOf(`<qti-item-body/><qti-response-processing>${rule}</qti-response-processing>`);

/**
 * Import `xml` as an item through the importer and render it back, the source's canonical form
 * beside the rendered one.
 */
const itemRoundTrip = (xml: string) =>
  Effect.gen(function* roundTripItem() {
    const doc = yield* decode(xml);
    const { documentId, rows } = yield* itemRows(
      {
        doc,
        packageId: crypto.randomUUID(),
        path: "xsi.xml",
        resource: "xsi",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version,
      },
      Rows.empty(),
    );

    return {
      rendered: textOf(canonicalize(renderTree(rows, documentId))),
      source: textOf(canonicalize(doc)),
    };
  });

/**
 * The three attributes on the root, on a QTI element (`qti-base-value` with its declared type) and
 * on a foreign element, all under the prefix `i`; the `xsi:nil` value is padded.
 */
const threeAttributes = expressionItem(
  `<qti-custom-operator><qti-base-value base-type="integer" i:type="${ref(declaredOf("qti-base-value"))}">1</qti-base-value><ma:ext i:type="ma:T" i:nil=" true " i:noNamespaceSchemaLocation="b.xsd"/></qti-custom-operator>`,
);

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts on the xsi attributes, no database",
  (it) => {
    it.effect("xsi:type, xsi:nil and xsi:noNamespaceSchemaLocation render under their prefix", () =>
      Effect.gen(function* threeRendered() {
        const xml = threeAttributes
          .replace("<qti-outcome-declaration", "<qti-outcome-declaration")
          .replace(
            'time-dependent="false" ',
            'time-dependent="false" i:noNamespaceSchemaLocation="a.xsd" ',
          );
        const { rendered, source } = yield* itemRoundTrip(xml);

        assert.strictEqual(rendered, source);
        assert.include(rendered, 'i:nil=" true "');
        assert.include(rendered, 'i:noNamespaceSchemaLocation="a.xsd"');
        assert.include(rendered, 'i:noNamespaceSchemaLocation="b.xsd"');
        assert.include(rendered, `i:type="ma:T"`);
      }),
    );

    it.effect("xsi:schemaLocation still renders beside them", () =>
      Effect.gen(function* locationRendered() {
        const { rendered, source } = yield* itemRoundTrip(
          threeAttributes.replace(
            'time-dependent="false" ',
            'time-dependent="false" i:schemaLocation="urn:a a.xsd" ',
          ),
        );

        assert.strictEqual(rendered, source);
        assert.include(rendered, 'i:schemaLocation="urn:a a.xsd"');
      }),
    );

    it.effect("a qti-null whose derived xsi:type has two required uses renders both", () =>
      Effect.gen(function* derivedRendered() {
        const { rendered, source } = yield* itemRoundTrip(
          expressionItem(`<qti-null i:type="${ref(entryType)}" map-key="a" mapped-value="1"/>`),
        );

        assert.strictEqual(rendered, source);
        assert.include(rendered, 'map-key="a"');
        assert.include(rendered, 'mapped-value="1"');
      }),
    );

    it.effect("a derived type's ##any lax wildcard renders xml:lang, data-foo and xsi:foo", () =>
      Effect.gen(function* wildcardRendered() {
        const { rendered, source } = yield* itemRoundTrip(
          ruleItem(
            `<qti-exit-response i:type="${ref(wildcardType)}" xml:lang="en" data-foo="1" i:foo="1"/>`,
          ),
        );

        assert.strictEqual(rendered, source);
        assert.include(rendered, 'xml:lang="en"');
        assert.include(rendered, 'data-foo="1"');
        assert.include(rendered, 'i:foo="1"');
      }),
    );

    it.effect("a manifest that binds XLink to xl renders xl:href back as written", () =>
      Effect.gen(function* xlRendered() {
        const xml = `<manifest xmlns="${cp}" xmlns:imsmd="${lom}" xmlns:xl="${xlink}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom xl:href="https://example.org/lom" xl:type="simple" xl:title=" t "><imsmd:general/></imsmd:lom></metadata></resource></resources></manifest>`;
        const built = yield* manifestRows("", [], yield* decode(xml), Rows.empty());
        const rendered = textOf(canonicalize(renderTree(built.rows, built.packageId)));

        assert.strictEqual(rendered, textOf(canonicalize(yield* decode(xml))));
        assert.include(rendered, 'xl:href="https://example.org/lom"');
        assert.include(rendered, 'xl:title=" t "');
        assert.notInclude(rendered, "xlink:");
      }),
    );
  },
);
