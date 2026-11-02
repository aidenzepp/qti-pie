import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { renderRegistry, renderTree } from "#qti/export/render.ts";
import { externalRows } from "#qti/import/external.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { outcomeRows } from "#qti/import/outcome.ts";
import { Rows } from "#qti/import/tree.ts";
import { usageRows } from "#qti/import/usage.ts";
import * as cpx from "#qti/schema/kinds/cpx.ts";
import * as csmd from "#qti/schema/kinds/csmd.ts";
import * as drd from "#qti/schema/kinds/drd.ts";
import * as lom from "#qti/schema/kinds/lom.ts";
import * as ud from "#qti/schema/kinds/ud.ts";
import { Document } from "#qti/schema/document.ts";
import { Node } from "#qti/schema/node.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { canonicalize } from "#qti/xml/canonical.ts";
import { xmllintC14n } from "#qti/xml/oracle.ts";
import { readXml } from "#qti/xml/read.ts";

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

    for (const name of ["usage3", "usage3-padded"] as const) {
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
