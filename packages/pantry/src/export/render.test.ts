import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Result } from "effect";
import { renderRegistry, renderTree } from "#pantry/export/render.ts";
import { externalRows } from "#pantry/import/external.ts";
import type { ItemInput } from "#pantry/import/item.ts";
import { itemRows } from "#pantry/import/item.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { outcomeRows } from "#pantry/import/outcome.ts";
import { Rows } from "#pantry/import/tree.ts";
import { usageRows } from "#pantry/import/usage.ts";
import { listPackage, readEntry } from "#pantry/package/read.ts";
import { ownAttributes } from "#pantry/schema/attribute-homes.ts";
import * as family from "#pantry/schema/attributes.ts";
import { Document } from "#pantry/schema/document.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import { ResourceLomGeneral } from "#pantry/schema/lang.ts";
import { AttributeLexical, AttributeSpelling, Node } from "#pantry/schema/node.ts";
import { registries } from "#pantry/schema/seed/admission.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { fixtureNames, materialize, materializeCorpus } from "#pantry/test/fixtures.ts";
import { cutItemRenderTestTimeoutMs, settings } from "#pantry/test/settings.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { xmllintC14n } from "#pantry/xml/oracle.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The text of a canonical form, so a failed comparison prints the two documents and not two byte
 * arrays.
 */
const textOf = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * Import a materialized fixture package into in-memory rows, no database: the manifest, then every
 * item document it lists.
 *
 * @param name - The fixture to materialize and import.
 * @returns The package directory, the rows of every tree, the manifest tree's id and each item's
 *   path with its tree id.
 */
const importFixture = (name: FixtureName) =>
  Effect.gen(function* importedFixture() {
    const fs = yield* FileSystem.FileSystem;
    const dir = yield* materialize(name);
    const entries = yield* listPackage(dir);
    const manifest = yield* readXml(yield* fs.readFile(path.join(dir, "imsmanifest.xml")));
    const imported = yield* manifestRows(dir, entries, manifest, Rows.empty());
    let { rows } = imported;
    const items: (readonly [path: string, treeId: string])[] = [];

    for (const document of imported.documents) {
      const doc = yield* readXml(yield* fs.readFile(path.join(dir, document.path)));
      const withItem = yield* itemRows(
        {
          doc,
          packageId: imported.packageId,
          path: document.path,
          resource: document.resource,
          resourceLomHasGeneral: Rows.of(rows, ResourceLomGeneral).some(
            (general) => general.resource === document.resource,
          ),
          resourceType: document.type,
          version: imported.version,
        },
        rows,
      );

      ({ rows } = withItem);
      items.push([document.path, withItem.documentId]);
    }

    return { dir, items, packageId: imported.packageId, rows };
  });

/**
 * Render each named tree of an imported package and compare it with the oracle's canonical form of
 * the file it came from.
 *
 * @param imported - What {@link importFixture} returned.
 * @param trees - Each file's path under the package directory with its tree id.
 * @returns One line per file whose rendering is not the oracle's bytes, naming the file; empty when
 *   every file agrees.
 */
const disagreements = (
  imported: { readonly dir: string; readonly rows: Parameters<typeof renderTree>[0] },
  trees: readonly (readonly [file: string, treeId: string])[],
) =>
  Effect.gen(function* compared() {
    const found: string[] = [];

    for (const [file, treeId] of trees) {
      const expected = textOf(yield* xmllintC14n(path.join(imported.dir, file)));
      const rendered = textOf(canonicalize(renderTree(imported.rows, treeId)));

      if (rendered !== expected) {
        found.push(`${file}: rendered ${rendered.length} bytes, the oracle ${expected.length}`);
      }
    }

    return found;
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts on sharedMedia, no database",
  (it) => {
    it.effect("the manifest and both items render to the oracle's canonical bytes", () =>
      Effect.gen(function* everyKindRenders() {
        const imported = yield* importFixture("sharedMedia");
        const { items, packageId } = imported;

        assert.deepStrictEqual(items.map(([file]) => file).toSorted(), [
          "example/graphic_order.xml",
          "example/hotspot.xml",
        ]);

        const trees: readonly (readonly [string, string])[] = [
          ["imsmanifest.xml", packageId],
          ...items,
        ];

        assert.deepStrictEqual(yield* disagreements(imported, trees), []);
      }),
    );
  },
);

/**
 * The cut items' fixture names, as `fixtureNames` lists them.
 */
const cutNames = fixtureNames.filter((name) => name.startsWith("cut-"));

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts on the 19 cut items, no database",
  (it) => {
    it.effect(
      "every cut item and its minimal manifest render to the oracle's canonical bytes",
      () =>
        Effect.gen(function* everyCutItemRenders() {
          const failures: string[] = [];
          let files = 0;

          assert.strictEqual(cutNames.length, 19);

          for (const name of cutNames) {
            const outcome = yield* Effect.result(
              Effect.gen(function* oneCutItem() {
                const imported = yield* importFixture(name);

                assert.strictEqual(imported.items.length, 1, name);

                return {
                  found: yield* disagreements(imported, [
                    ["imsmanifest.xml", imported.packageId],
                    ...imported.items,
                  ]),
                  items: imported.items.length,
                };
              }),
            );

            if (Result.isFailure(outcome)) {
              failures.push(`${name}: ${JSON.stringify(outcome.failure)}`);
            } else {
              files += outcome.success.items;
              failures.push(...outcome.success.found.map((line) => `${name}: ${line}`));
            }
          }

          assert.deepStrictEqual(failures, []);
          assert.strictEqual(files, cutNames.length);
        }),
      { timeout: cutItemRenderTestTimeoutMs },
    );
  },
);

/**
 * An item that writes the attributes whose absence and presence must both survive: an empty and a
 * padded `headers`, a padded ARIA reference, an order interaction that writes `shuffle="true"`, one
 * that writes `shuffle="false"` and one that omits it, a `source` with no `src`, and a root with a
 * `label`, an `xml:lang` and a padded `title`.
 */
const synthetic = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="synthetic" title="  Padded   title " label="L  1" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"/>
  <qti-response-declaration identifier="OTHER" cardinality="ordered" base-type="identifier"/>
  <qti-response-declaration identifier="THIRD" cardinality="ordered" base-type="identifier"/>
  <qti-item-body class=" a   b " id="body">
    <table summary="s"><tbody><tr><td headers="" colspan="2">a</td><td headers=" h1   h2 " aria-labelledby=" x  y " role="gridcell">b</td></tr></tbody></table>
    <qti-order-interaction response-identifier="RESPONSE" shuffle="true"><qti-simple-choice identifier="A" fixed="true">a</qti-simple-choice><qti-simple-choice identifier="B">b</qti-simple-choice></qti-order-interaction>
    <qti-order-interaction response-identifier="OTHER"><qti-simple-choice identifier="C">c</qti-simple-choice></qti-order-interaction>
    <qti-order-interaction response-identifier="THIRD" shuffle="false"><qti-simple-choice identifier="D">d</qti-simple-choice></qti-order-interaction>
    <p><picture><source srcset="a.svg" type="image/svg"/><img src="a.png" alt=""/></picture></p>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * An item that writes `src` empty on purpose: a `video` source and an `a`, beside an `img` with an
 * empty `alt`. Each empty value is a value the source wrote, so the export keeps it.
 */
const explicitEmpty = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="empty" title="Empty" adaptive="false" time-dependent="false">
  <qti-item-body><video><source src="" type="video/mp4"/></video><p><a href="">go</a><img src="a.png" alt=""/></p></qti-item-body>
</qti-assessment-item>`;

/**
 * An item that holds one node of each feedback and template kind, three of them written with
 * `show-hide="hide"`.
 */
const sixKindsItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="six" title="Six" adaptive="false" time-dependent="false">
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/>
  <qti-item-body><qti-rubric-block use="instructions" view="candidate"><qti-content-body><qti-template-block template-identifier="T" identifier="rb" show-hide="hide"><qti-content-body><p>r</p></qti-content-body></qti-template-block><qti-template-inline template-identifier="T" identifier="ri" show-hide="hide">i</qti-template-inline></qti-content-body></qti-rubric-block><qti-feedback-block outcome-identifier="FEEDBACK" identifier="fa"><qti-content-body><p>a</p></qti-content-body></qti-feedback-block><qti-template-block template-identifier="T" identifier="tb"><qti-content-body><qti-feedback-block outcome-identifier="FEEDBACK" identifier="ft" show-hide="hide"><qti-content-body><p>t</p></qti-content-body></qti-feedback-block></qti-content-body></qti-template-block><p><qti-template-inline template-identifier="T" identifier="ti">x</qti-template-inline></p></qti-item-body>
</qti-assessment-item>`;

/**
 * An item with a choice interaction that writes `max-choices="5"`.
 */
const spelledChoiceItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="choice" title="Choice" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="5"><qti-simple-choice identifier="A">a</qti-simple-choice></qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * An item with a graphic associate interaction whose first hotspot writes `match-min="03"` and
 * whose second writes `match-max="+2"` and omits `match-min`.
 */
const hotspotItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="hotspot" title="Hotspot" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair"/>
  <qti-item-body>
    <qti-graphic-associate-interaction response-identifier="RESPONSE"><img src="a.png" alt="a"/><qti-associable-hotspot identifier="H1" shape="rect" coords="0,0,5,5" match-max="1" match-min="03"/><qti-associable-hotspot identifier="H2" shape="rect" coords="6,6,9,9" match-max="+2"/></qti-graphic-associate-interaction>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * An item whose inline choice and hottext each write `show-hide="hide"` on the first choice and
 * omit it on the second.
 */
const choiceItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="choices" title="Choices" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="R1" cardinality="single" base-type="identifier"/>
  <qti-response-declaration identifier="R2" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p><qti-inline-choice-interaction response-identifier="R1"><qti-inline-choice identifier="A" show-hide="hide">a</qti-inline-choice><qti-inline-choice identifier="B">b</qti-inline-choice></qti-inline-choice-interaction></p>
    <qti-hottext-interaction response-identifier="R2"><p><qti-hottext identifier="H1" show-hide="hide">h1</qti-hottext><qti-hottext identifier="H2">h2</qti-hottext></p></qti-hottext-interaction>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * The attributes every kind may carry whatever its registry row: the families, `id`, `headers`,
 * `role` and the ARIA attributes, which are rendered for any node, and `data-ssml`, which the
 * importer refuses.
 */
const shared: ReadonlySet<string> = new Set([
  "class",
  "data-catalog-idref",
  "data-qti-suppress-tts",
  "data-ssml",
  "dir",
  "headers",
  "id",
  "label",
  "lang",
  "xml:base",
  "xml:lang",
  ...Object.keys(family.relations)
    .filter((key) => key.startsWith("Aria"))
    .map((key) => (key === "AriaRole" ? "role" : `aria-${key.slice("Aria".length).toLowerCase()}`)),
]);

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts on written and absent attributes, no database",
  (it) => {
    it.effect("an attribute the source omitted stays omitted and one it wrote is kept", () =>
      Effect.gen(function* writtenAndAbsent() {
        const doc = yield* readXml(new TextEncoder().encode(synthetic));
        const input: ItemInput = {
          doc,
          packageId: crypto.randomUUID(),
          path: "synthetic.xml",
          resource: "synthetic",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.1",
        };
        const { documentId, rows } = yield* itemRows(input, Rows.empty());
        const rendered = textOf(canonicalize(renderTree(rows, documentId)));

        assert.strictEqual(rendered, textOf(canonicalize(doc)));
        assert.include(rendered, 'headers=""');
        assert.include(rendered, 'headers=" h1   h2 "');
        assert.strictEqual(rendered.split('shuffle="').length - 1, 2);
        assert.include(rendered, 'shuffle="false"');
        assert.notInclude(rendered, 'src=""');
        assert.notInclude(rendered, "owner");
      }),
    );

    it.effect("an explicitly empty media source src, href and alt are written back", () =>
      Effect.gen(function* explicitEmptyValues() {
        const doc = yield* readXml(new TextEncoder().encode(explicitEmpty));
        const input: ItemInput = {
          doc,
          packageId: crypto.randomUUID(),
          path: "empty.xml",
          resource: "empty",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.1",
        };
        const { documentId, rows } = yield* itemRows(input, Rows.empty());
        const rendered = textOf(canonicalize(renderTree(rows, documentId)));

        assert.strictEqual(rendered, textOf(canonicalize(doc)));
        assert.include(rendered, 'src=""');
      }),
    );

    it.effect("the six feedback and template kinds round-trip on their own arms", () =>
      Effect.gen(function* sixKindsRoundTrip() {
        const doc = yield* readXml(new TextEncoder().encode(sixKindsItem));
        const input: ItemInput = {
          doc,
          packageId: crypto.randomUUID(),
          path: "six.xml",
          resource: "six",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.1",
        };
        const { documentId, rows } = yield* itemRows(input, Rows.empty());
        const rendered = textOf(canonicalize(renderTree(rows, documentId)));

        assert.strictEqual(rendered, textOf(canonicalize(doc)));
        assert.strictEqual(rendered.split('show-hide="hide"').length - 1, 3);
      }),
    );

    it.effect(
      "a choice-like child's written show-hide is kept and an omitted one stays omitted",
      () =>
        Effect.gen(function* choiceShowHide() {
          const doc = yield* readXml(new TextEncoder().encode(choiceItem));
          const input: ItemInput = {
            doc,
            packageId: crypto.randomUUID(),
            path: "choices.xml",
            resource: "choices",
            resourceLomHasGeneral: false,
            resourceType: "imsqti_item_xmlv3p0",
            version: "3.0.1",
          };
          const { documentId, rows } = yield* itemRows(input, Rows.empty());
          const rendered = textOf(canonicalize(renderTree(rows, documentId)));

          assert.strictEqual(rendered, textOf(canonicalize(doc)));
          assert.strictEqual(rendered.split('show-hide="hide"').length - 1, 2);
          assert.notInclude(rendered, 'show-hide="show"');
        }),
    );

    it.effect("an associable hotspot's written match-min and match-max spellings are kept", () =>
      Effect.gen(function* hotspotMatchMin() {
        const doc = yield* readXml(new TextEncoder().encode(hotspotItem));
        const input: ItemInput = {
          doc,
          packageId: crypto.randomUUID(),
          path: "hotspot.xml",
          resource: "hotspot",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.1",
        };
        const { documentId, rows } = yield* itemRows(input, Rows.empty());
        const rendered = textOf(canonicalize(renderTree(rows, documentId)));

        assert.strictEqual(rendered, textOf(canonicalize(doc)));
        assert.strictEqual(rendered.split('match-min="').length - 1, 1);
        assert.include(rendered, 'match-min="03"');
        assert.include(rendered, 'match-max="+2"');
      }),
    );

    it.effect("a spelling row renders in place of the typed value, and a lexical row over it", () =>
      Effect.gen(function* spelledAttribute() {
        const doc = yield* readXml(new TextEncoder().encode(spelledChoiceItem));
        const { documentId, rows } = yield* itemRows(
          {
            doc,
            packageId: crypto.randomUUID(),
            path: "choice.xml",
            resource: "choice",
            resourceLomHasGeneral: false,
            resourceType: "imsqti_item_xmlv3p0",
            version: "3.0.1",
          },
          Rows.empty(),
        );
        const node = Rows.of(rows, Node).find((row) => row.kind === "qti-choice-interaction")?.id;
        assert.isDefined(node);

        const attribute = "max-choices";
        const kind = "qti-choice-interaction";
        const canonical = textOf(canonicalize(renderTree(rows, documentId)));
        assert.include(canonical, 'max-choices="5"');

        const spelled = Rows.add(rows, AttributeSpelling, [{ attribute, kind, node, value: "+5" }]);
        const spelledOut = textOf(canonicalize(renderTree(spelled, documentId)));
        assert.include(spelledOut, 'max-choices="+5"');
        assert.notInclude(spelledOut, 'max-choices="5"');

        const both = Rows.add(spelled, AttributeLexical, [
          { attribute, kind, node, value: " +5 " },
        ]);
        assert.include(textOf(canonicalize(renderTree(both, documentId))), 'max-choices=" +5 "');
      }),
    );

    it.effect("every attribute a registry admits has a source", () =>
      Effect.sync(() => {
        const sources = new Map(
          Object.entries(ownAttributes).map(([kind, own]) => [kind, own.map(([name]) => name)]),
        );
        const admitted = new Map(
          registries.flatMap((registry) =>
            Object.entries(registry).map(([kind, row]) => [kind, row.attributes] as const),
          ),
        );

        for (const [kind, attributes] of admitted) {
          const lacking = attributes.filter(
            (name) => !shared.has(name) && !(sources.get(kind) ?? []).includes(name),
          );

          assert.deepStrictEqual(lacking, [], `${kind}: admitted attributes with no source`);
        }

        for (const [kind, names] of sources) {
          assert.isTrue(admitted.has(kind), `${kind}: a source for a kind no registry holds`);
          for (const name of names) {
            assert.include(admitted.get(kind) ?? [], name, `${kind}: a source for ${name}`);
          }
        }
      }),
    );
  },
);

/**
 * Whether the operator asked for the corpus run: it reads every package of the examples tarball
 * and spawns `xmllint` once per item document, so it runs only on request.
 */
const requested = settings.corpusRequested;

/**
 * The part of the QTI 3 item namespace the census tests for, as in spec 3.6.
 */
const asiNamespace = "imsqtiasi_v3p0";

/**
 * The element names of the M0 and M1 rosters and of the HTML profile, as the second census script
 * of spec 3.6 lists them: an item is pure when every element it holds is one of these.
 */
const censusElements: ReadonlySet<string> = new Set(
  (
    "qti-assessment-item qti-response-declaration qti-outcome-declaration qti-correct-response " +
    "qti-default-value qti-value qti-item-body p img qti-choice-interaction qti-prompt " +
    "qti-simple-choice qti-response-processing " +
    "qti-area-map-entry qti-area-mapping qti-associable-hotspot qti-associate-interaction " +
    "qti-catalog-info qti-companion-materials-info qti-content-body qti-context-declaration " +
    "qti-drawing-interaction qti-end-attempt-interaction qti-extended-text-interaction " +
    "qti-feedback-block qti-feedback-inline qti-gap qti-gap-img qti-gap-match-interaction " +
    "qti-gap-text qti-graphic-associate-interaction qti-graphic-gap-match-interaction " +
    "qti-graphic-order-interaction qti-hotspot-choice qti-hotspot-interaction qti-hottext " +
    "qti-hottext-interaction qti-inline-choice qti-inline-choice-interaction " +
    "qti-interpolation-table qti-interpolation-table-entry qti-label qti-map-entry qti-mapping " +
    "qti-match-interaction qti-match-table qti-match-table-entry qti-media-interaction " +
    "qti-modal-feedback qti-order-interaction qti-position-object-interaction " +
    "qti-position-object-stage qti-printed-variable qti-rubric-block " +
    "qti-select-point-interaction qti-simple-associable-choice qti-simple-match-set " +
    "qti-slider-interaction qti-stylesheet qti-template-block qti-template-declaration " +
    "qti-template-inline qti-text-entry-interaction qti-upload-interaction " +
    "a abbr acronym address article aside audio b bdi bdo big blockquote br caption cite code " +
    "col colgroup dd details dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 " +
    "header hr i img kbd label li nav object ol p param picture pre q rb rp rt rtc ruby samp " +
    "section small source span strong sub summary sup table tbody td template tfoot th thead " +
    "tr track tt ul var video"
  ).split(" "),
);

/**
 * The `data-*` attributes the M1 roster types, which a pure item may carry.
 */
const typedDataAttributes: ReadonlySet<string> = new Set([
  "data-choices-container-width",
  "data-first-column-header",
  "data-max-selections-message",
  "data-min-selections-message",
  "data-patternmask-message",
  "data-prompt",
  "data-qti-suppress-tts",
]);

/**
 * Whether an element and everything below it is M0+M1-pure: in the item namespace, a name of
 * {@link censusElements} and no `data-*` attribute outside {@link typedDataAttributes}, which
 * leaves `data-catalog-idref` out.
 */
const pureBelow = (element: Element): boolean =>
  element.namespace.includes(asiNamespace) &&
  censusElements.has(element.local) &&
  element.attributes.every(
    (attribute) =>
      attribute.namespace !== "" ||
      !attribute.local.startsWith("data-") ||
      typedDataAttributes.has(attribute.local),
  ) &&
  element.children.every((child) => child.kind !== "element" || pureBelow(child));

/**
 * The `schemaversion` a package's manifest declares, `3.0.0` when it names none.
 */
const versionOf = (manifest: string): "3.0.0" | "3.0.1" =>
  /<schemaversion>\s*3\.0\.1\s*<\/schemaversion>/u.test(manifest) ? "3.0.1" : "3.0.0";

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts over the corpus, no database",
  (it) => {
    it.effect.skipIf(!requested)(
      "every M0+M1-pure item document renders to the oracle's canonical bytes",
      () =>
        Effect.gen(function* everyPureItemRenders() {
          const fs = yield* FileSystem.FileSystem;
          const started = Date.now();
          const pure: {
            readonly dir: string;
            readonly file: string;
            readonly version: "3.0.0" | "3.0.1";
          }[] = [];

          for (const { dir } of yield* materializeCorpus()) {
            const entries = yield* fs.readDirectory(dir, { recursive: true });
            const manifest = entries.includes("imsmanifest.xml")
              ? yield* fs.readFileString(path.join(dir, "imsmanifest.xml"))
              : "";

            for (const file of entries.toSorted()) {
              if (
                !file.endsWith(".xml") ||
                file.endsWith("imsmanifest.xml") ||
                file.includes("__MACOSX")
              ) {
                continue;
              }

              const doc = yield* Effect.result(readXml(yield* fs.readFile(path.join(dir, file))));

              if (
                Result.isSuccess(doc) &&
                doc.success.root.local === "qti-assessment-item" &&
                doc.success.root.namespace.includes(asiNamespace) &&
                pureBelow(doc.success.root)
              ) {
                pure.push({ dir, file, version: versionOf(manifest) });
              }
            }
          }

          const failures: string[] = [];
          const refused: string[] = [];
          const refusedFiles: string[] = [];

          for (const { dir, file, version } of pure) {
            const label = `${path.basename(dir)}/${file}`;
            const outcome = yield* Effect.result(
              Effect.gen(function* oneItem() {
                const doc = yield* readXml(yield* fs.readFile(path.join(dir, file)));
                const { documentId, rows } = yield* itemRows(
                  {
                    doc,
                    packageId: crypto.randomUUID(),
                    path: file,
                    resource: path.basename(file, ".xml"),
                    resourceLomHasGeneral: false,
                    resourceType: "imsqti_item_xmlv3p0",
                    version,
                  },
                  Rows.empty(),
                );

                return yield* disagreements({ dir, rows }, [[file, documentId]]);
              }),
            );

            if (Result.isSuccess(outcome)) {
              failures.push(...outcome.success.map((line) => `${path.basename(dir)}/${line}`));
            } else if (outcome.failure._tag === "UnmodeledVocabulary") {
              // The census's purity is element names and `data-*` attributes only, so an item that
              // writes an attribute the XSD does not give its element (`alt` on `object`) is pure
              // and is refused by the importer, which is the rule working: it has no tree to render.
              refused.push(`${label}: ${JSON.stringify(outcome.failure)}`);
              refusedFiles.push(file);
            } else {
              failures.push(`${label}: ${JSON.stringify(outcome.failure)}`);
            }
          }

          yield* Effect.logInfo(
            `corpus loop: ${pure.length} pure item documents, ${pure.length - refused.length - failures.length} render to the oracle's bytes, ${refused.length} refused as unmodeled vocabulary, ${failures.length} failing, ${Date.now() - started} ms`,
            refused,
          );

          // The census holds 131 pure item documents, and exactly the three `Graphic_Gap_Match`
          // items are refused, for the `alt` the XSD does not give `object` (the ledger's
          // phase-2 record, :860). The rendered count, `pure.length - refusedFiles.length -
          // failures.length`, follows. A later phase that admits `object/@alt`, or that grows the
          // census, re-pins these numbers on its own measurement.
          assert.strictEqual(pure.length, 131);
          assert.deepStrictEqual(refusedFiles.toSorted(), [
            "Items/Item_QTI3_Graphic_Gap_Match_01/graphic-gap-match-qti3.xml",
            "Items/Item_QTI3_Graphic_Gap_Match_02/graphic-gap-match-qti3.xml",
            "Items/Item_QTI3_Graphic_Gap_Match_03/graphic-gap-match-qti3.xml",
          ]);
          assert.deepStrictEqual(failures, []);
        }),
      { timeout: 600_000 },
    );
  },
);

/**
 * The manifest-side kinds this phase adds, computed from the kinds files: the `lom:` kinds after
 * phase 1's roster, which ends at `lom:copyrightAndOtherRestrictions`, file-level metadata, the
 * CSM, variant and DRD vocabularies.
 */
const manifestSideKinds: readonly string[] = [
  ...lom.kinds.slice(lom.kinds.indexOf("lom:copyrightAndOtherRestrictions") + 1),
  "cp:metadata.file",
  ...csmd.kinds,
  ...cpx.kinds,
  ...drd.kinds,
];

/**
 * The fixtures whose manifests carry the manifest-side kinds, padded forms included.
 */
const fixtures = [
  "lomrest",
  "csm",
  "filelom",
  "nestedqmd",
  "variant",
  "variant-padded",
] as const satisfies readonly FixtureName[];

/**
 * The manifest rows of a fixture and the oracle's canonical text of its manifest.
 */
const manifestOf = (name: FixtureName) =>
  Effect.gen(function* manifestOfFixture() {
    const dir = yield* materialize(name);
    const entries = yield* listPackage(dir);
    const doc = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
    const built = yield* manifestRows(dir, entries, doc, Rows.empty());
    const expected = new TextDecoder().decode(
      yield* xmllintC14n(path.join(dir, "imsmanifest.xml")),
    );

    return { expected, packageId: built.packageId, rows: built.rows };
  });

/**
 * The oracle's canonical text of `file` of the fixture `name`, and the file's decoded document.
 */
const oracleOf = (name: FixtureName, file: string) =>
  Effect.gen(function* oracleOfFile() {
    const dir = yield* materialize(name);
    const doc = yield* readXml(yield* readEntry(dir, file));
    const expected = new TextDecoder().decode(yield* xmllintC14n(path.join(dir, file)));

    return { doc, expected };
  });

const usagePackage = "66666666-6666-4666-8666-666666666666";

/**
 * The rows of `example.xml` of a usage-data fixture, with its oracle's canonical text and its
 * tree's id.
 */
const usageOf = (name: FixtureName) =>
  Effect.gen(function* usageOfFixture() {
    const { doc, expected } = yield* oracleOf(name, "example.xml");
    const built = yield* usageRows(
      doc,
      {
        package: usagePackage,
        path: "example.xml",
        resource: "USAGE-TOTAL-TEST-106391",
        resourceType: "qtiusagedata/xml",
        version: "3.0.0",
      },
      Rows.empty(),
    );
    const [document] = Rows.of(built.rows, Document);

    return { expected, id: document?.id ?? "", rows: built.rows };
  });

/**
 * The `variant` fixture's manifest with every one of the 17 DRD leaves under its
 * `drd:accessForAllResource`, in the schema's sequence order, read and imported. The fixtures
 * carry only three leaves, so the rest are checked against the canonical form of the document the
 * reader gave the importer.
 */
const allLeaves = () =>
  Effect.gen(function* allLeavesManifest() {
    const dir = yield* materialize("variant");
    const entries = yield* listPackage(dir);
    const text = new TextDecoder().decode(yield* readEntry(dir, "imsmanifest.xml"));
    const leaves = [
      ["accessMode", "textual"],
      ["accessModeAdapted", "visual"],
      ["adaptationType", "ext:stacked_translation"],
      ["atInteroperable", "true"],
      ["controlFlexibility", "full keyboard control"],
      ["displayTransformability", "fontSize"],
      ["educationalComplexityOfAdaptation", "lower"],
      ["hasAdaptation", "http://example.com/a"],
      ["hazard", "flashing"],
      ["isAdaptationOf", "http://example.com/b"],
      ["languageOfAdaptation", "es"],
      ["adaptationDetail", "detail"],
      ["adaptationMediaType", "text/html"],
      ["apiInteroperable", "ARIA"],
      ["educationalLevelOfAdaptation", "lower"],
      ["isFullAdaptationOf", "http://example.com/c"],
      ["isPartialAdaptationOf", "http://example.com/d"],
    ]
      .map(([local, value]) => `<drd:${local}>${value}</drd:${local}>`)
      .join("");
    const doc = yield* readXml(
      new TextEncoder().encode(
        text.replace(
          /<drd:accessForAllResource>[\s\S]*<\/drd:accessForAllResource>/u,
          `<drd:accessForAllResource>${leaves}</drd:accessForAllResource>`,
        ),
      ),
    );
    const built = yield* manifestRows(dir, entries, doc, Rows.empty());

    return { doc, packageId: built.packageId, rows: built.rows };
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "export/render.ts, manifest side",
  (it) => {
    it.effect("the render registry names every one of the 49 manifest-side kinds", () =>
      Effect.sync(() => {
        assert.lengthOf(manifestSideKinds, 49);
        assert.deepStrictEqual(
          manifestSideKinds.filter((kind) => !renderRegistry.has(kind)),
          [],
        );
      }),
    );

    for (const name of fixtures) {
      it.effect(`${name}: the manifest renders to the oracle's canonical bytes`, () =>
        Effect.gen(function* rendersLikeTheOracle() {
          const { expected, packageId, rows } = yield* manifestOf(name);

          assert.strictEqual(
            new TextDecoder().decode(canonicalize(renderTree(rows, packageId))),
            expected,
          );
        }),
      );
    }

    it.effect(
      "the fixtures and the all-leaves variant manifest hold every one of the 49 kinds",
      () =>
        Effect.gen(function* everyKind() {
          const seen = new Set<string>();
          const sets = [(yield* allLeaves()).rows];
          for (const name of fixtures) {
            sets.push((yield* manifestOf(name)).rows);
          }

          for (const rows of sets) {
            for (const node of Rows.of(rows, Node)) {
              seen.add(node.kind);
            }
          }

          assert.deepStrictEqual(
            manifestSideKinds.filter((kind) => !seen.has(kind)),
            [],
          );
        }),
    );

    it.effect("the manifest whose variant carries all 17 DRD leaves renders as it was read", () =>
      Effect.gen(function* allLeavesRender() {
        const { doc, packageId, rows } = yield* allLeaves();

        assert.strictEqual(
          new TextDecoder().decode(canonicalize(renderTree(rows, packageId))),
          new TextDecoder().decode(canonicalize(doc)),
        );
      }),
    );

    it.effect("variant-padded renders the padded identifier and the tab verbatim", () =>
      Effect.gen(function* paddedForms() {
        const { packageId, rows } = yield* manifestOf("variant-padded");
        const text = new TextDecoder().decode(canonicalize(renderTree(rows, packageId)));

        assert.include(text, 'identifier=" v1 "');
        assert.include(text, "\t");
      }),
    );

    it.effect("the render registry names every handle of the 56", () =>
      Effect.sync(() => {
        const handles = [...manifestSideKinds, ...ud.kinds];

        assert.lengthOf(handles, 56);
        assert.deepStrictEqual(
          handles.filter((handle) => !renderRegistry.has(handle)),
          [],
        );
      }),
    );

    for (const name of ["usage3", "usage3-padded", "usage3-float-padded"] as const) {
      it.effect(`${name}: example.xml renders to the oracle's canonical bytes`, () =>
        Effect.gen(function* usageRenders() {
          const { expected, id, rows } = yield* usageOf(name);

          assert.strictEqual(
            new TextDecoder().decode(canonicalize(renderTree(rows, id))),
            expected,
          );
        }),
      );
    }

    it.effect(
      "usage3-padded renders the padded name, identifier, the tab and the padded value verbatim",
      () =>
        Effect.gen(function* usagePadded() {
          const { id, rows } = yield* usageOf("usage3-padded");
          const text = new TextDecoder().decode(canonicalize(renderTree(rows, id)));

          assert.include(text, 'name=" AIS "');
          assert.include(text, 'identifier=" item1 "');
          assert.include(text, 'mapKey="a&#x9;b"');
          assert.include(text, "> 0.87 <");
        }),
    );

    it.effect("extmeta: the record renders to the oracle's canonical bytes", () =>
      Effect.gen(function* recordRenders() {
        const { doc, expected } = yield* oracleOf("extmeta", "meta/choice.xml");
        const built = yield* externalRows(
          doc,
          {
            package: usagePackage,
            path: "meta/choice.xml",
            resource: "choice-meta",
            resourceType: "resourcemetadata/xml",
            version: "3.0.0",
          },
          Rows.empty(),
        );
        const [document] = Rows.of(built.rows, Document);

        assert.strictEqual(
          new TextDecoder().decode(canonicalize(renderTree(built.rows, document?.id ?? ""))),
          expected,
        );
      }),
    );

    it.effect("outcome: testoutcome01.xml renders to the oracle's canonical bytes", () =>
      Effect.gen(function* outcomeRenders() {
        const { doc, expected } = yield* oracleOf("outcome", "testoutcome01.xml");
        const built = yield* outcomeRows(
          {
            doc,
            packageId: usagePackage,
            path: "testoutcome01.xml",
            resource: "Outcome_01",
            resourceLomHasGeneral: false,
            resourceType: "imsqti_outcomes_xmlv3p0",
            version: "3.0.0",
          },
          Rows.empty(),
        );

        assert.strictEqual(
          new TextDecoder().decode(canonicalize(renderTree(built.rows, built.documentId))),
          expected,
        );
      }),
    );
  },
);
