import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { inject } from "vitest";
import { manifestRows, NotQti3 } from "#qti/import/manifest.ts";
import { Rows } from "#qti/import/tree.ts";
import { listPackage, PackageReadError, readEntry } from "#qti/package/read.ts";
import {
  Lom,
  LomFormat,
  LomObjectIdentifier,
  LomObjectTitle,
  LomString,
  LomTitle,
  QmdFeedbackType,
  QmdInteractionType,
  QmdSolutionAvailable,
  QmdTimeDependent,
  QtiMetadata,
} from "#qti/schema/metadata.ts";
import { AttributeLexical, Edge, TreeRoot } from "#qti/schema/node.ts";
import {
  File,
  FileContent,
  Manifest,
  Organizations,
  Package,
  PackageEntry,
  Resource,
  ResourceHref,
} from "#qti/schema/package.ts";
import { materialize, materializePackage } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * The one row of a list that holds exactly one.
 */
const only = <T>(items: readonly T[]): T => {
  assert.strictEqual(items.length, 1);

  const [item] = items;
  if (item === undefined) {
    return assert.fail("the list holds one row");
  }

  return item;
};

/**
 * Read the manifest of the package at `dir`, after replacing the first occurrence of `search` with
 * `replacement` when an edit is given, and build its manifest rows.
 */
const importManifest = (dir: string, edit?: readonly [search: string, replacement: string]) =>
  Effect.gen(function* importManifestOf() {
    const fs = yield* FileSystem.FileSystem;
    const entries = yield* listPackage(dir);
    const bytes = yield* fs.readFile(path.join(dir, "imsmanifest.xml"));
    let text = new TextDecoder().decode(bytes);
    if (edit !== undefined) {
      assert.isTrue(text.includes(edit[0]), `imsmanifest.xml holds ${edit[0]}`);
      text = text.replace(edit[0], edit[1]);
    }

    const doc = yield* readXml(new TextEncoder().encode(text));

    return yield* manifestRows(dir, entries, doc, Rows.empty());
  });

layer(NodeServices.layer, { excludeTestServices: true })("import/manifest.ts", (suite) => {
  suite.effect("simple yields one Package and its manifest children", () =>
    Effect.gen(function* simplePackage() {
      const { packageId, rows, version } = yield* importManifest(inject("fixtures").simple);

      assert.strictEqual(version, "3.0.0");
      assert.deepStrictEqual(Rows.of(rows, Package), [
        {
          id: packageId,
          identifier: "MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390",
          schemaversion: "3.0.0",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, Manifest), [{ id: packageId }]);
      assert.strictEqual(only(Rows.of(rows, TreeRoot)).node, packageId);

      const [organizations] = Rows.of(rows, Organizations);
      assert.strictEqual(Rows.of(rows, Organizations).length, 1);
      assert.strictEqual(organizations?.manifest, packageId);
      assert.deepStrictEqual(
        Rows.of(rows, Edge).filter((edge) => edge.parent === organizations?.id),
        [],
      );
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), []);
    }),
  );

  suite.effect("simple yields its resource, href, files and documents", () =>
    Effect.gen(function* simpleResource() {
      const { documents, packageId, rows } = yield* importManifest(inject("fixtures").simple);
      const resources = Rows.of(rows, Resource);

      assert.strictEqual(resources.length, 1);
      assert.deepStrictEqual(
        resources.map(({ identifier, package: owner, type, version }) => ({
          identifier,
          owner,
          type,
          version,
        })),
        [
          {
            identifier: "choice",
            owner: packageId,
            type: "imsqti_item_xmlv3p0",
            version: "3.0.0",
          },
        ],
      );

      const resource = only(resources);
      assert.deepStrictEqual(Rows.of(rows, ResourceHref), [
        { href: "choice.xml", package: packageId, resource: resource.id },
      ]);
      assert.deepStrictEqual(
        Rows.of(rows, File).map(({ href, position, resource: owner }) => ({
          href,
          owner,
          position,
        })),
        [
          { href: "choice.xml", owner: resource.id, position: 3n },
          { href: "images/sign.png", owner: resource.id, position: 5n },
        ],
      );
      for (const file of Rows.of(rows, File)) {
        assert.strictEqual(
          file.position,
          only(Rows.of(rows, Edge).filter((edge) => edge.child === file.id)).position,
        );
      }
      assert.deepStrictEqual(documents, [
        {
          path: "choice.xml",
          resource: "choice",
          resourceId: resource.id,
          type: "imsqti_item_xmlv3p0",
        },
      ]);
    }),
  );

  suite.effect("an entry that is not a regular file is refused as entry-path", () =>
    Effect.gen(function* directoryEntry() {
      const dir = inject("fixtures").simple;
      const fs = yield* FileSystem.FileSystem;
      const entries = yield* listPackage(dir);
      const bytes = yield* fs.readFile(path.join(dir, "imsmanifest.xml"));
      const doc = yield* readXml(bytes);
      const error = yield* manifestRows(
        dir,
        [...entries, { kind: "file", path: "images" }],
        doc,
        Rows.empty(),
      ).pipe(Effect.flip);

      assert.instanceOf(error, PackageReadError);
      assert.strictEqual(error.rule, "entry-path");
      assert.strictEqual(error.path, "images");
    }),
  );

  suite.effect("simple yields three PackageEntry rows and the bytes of images/sign.png", () =>
    Effect.gen(function* simpleEntries() {
      const { packageId, rows } = yield* importManifest(inject("fixtures").simple);

      assert.deepStrictEqual(Rows.of(rows, PackageEntry), [
        { kind: "file", package: packageId, path: "choice.xml" },
        { kind: "file", package: packageId, path: "images/sign.png" },
        { kind: "manifest", package: packageId, path: "imsmanifest.xml" },
      ]);

      const content = only(Rows.of(rows, FileContent));
      assert.strictEqual(content.path, "images/sign.png");
      assert.strictEqual(content.mimeType, "image/png");
      assert.strictEqual(content.byteLength, 4029n);
      assert.isTrue(
        createHash("sha256")
          .update(Buffer.from(content.content, "base64"))
          .digest("hex")
          .startsWith("3ca00b7cf97dea89"),
      );

      const original = yield* readEntry(inject("fixtures").simple, "images/sign.png");
      assert.strictEqual(content.content, Buffer.from(original).toString("base64"));
    }),
  );

  suite.effect("a padded resource href is collapsed and keeps its lexical form once", () =>
    Effect.gen(function* paddedHref() {
      const { rows } = yield* importManifest(inject("fixtures").simple, [
        'href="choice.xml"',
        'href=" choice.xml"',
      ]);
      const lexical = Rows.of(rows, AttributeLexical);

      assert.deepStrictEqual(
        Rows.of(rows, ResourceHref).map((row) => row.href),
        ["choice.xml"],
      );
      assert.strictEqual(lexical.length, 1);
      assert.deepStrictEqual(
        lexical.map(({ attribute, kind, value }) => ({ attribute, kind, value })),
        [{ attribute: "href", kind: "cp:resource", value: " choice.xml" }],
      );
    }),
  );

  suite.effect("simple yields a Lom per owner with the object identifier and title", () =>
    Effect.gen(function* simpleLom() {
      const { rows } = yield* importManifest(inject("fixtures").simple);

      assert.deepStrictEqual(
        Rows.of(rows, Lom)
          .map((lom) => lom.owner)
          .toSorted(),
        ["manifest", "resource"],
      );

      const identifier = only(Rows.of(rows, LomObjectIdentifier));
      assert.strictEqual(identifier.collapsed, "choice");
      assert.strictEqual(identifier.resource, "choice");
      assert.strictEqual(identifier.type, "imsqti_item_xmlv3p0");

      const title = only(Rows.of(rows, LomObjectTitle));
      assert.strictEqual(title.collapsed, "Unattended Luggage");
      assert.strictEqual(title.lom, identifier.lom);

      const titled = only(Rows.of(rows, LomTitle).filter((row) => row.lom === title.lom));
      assert.strictEqual(titled.position, title.position);
      assert.strictEqual(
        titled.position,
        only(Rows.of(rows, Edge).filter((edge) => edge.child === titled.id)).position,
      );
    }),
  );

  suite.effect("simple yields two LomFormat rows under each technical", () =>
    Effect.gen(function* simpleFormats() {
      const { rows } = yield* importManifest(inject("fixtures").simple);
      const formats = Rows.of(rows, LomFormat);

      assert.strictEqual(formats.length, 4);
      for (const technical of new Set(formats.map((format) => format.technical))) {
        assert.deepStrictEqual(
          formats.filter((format) => format.technical === technical).map((format) => format.value),
          ["text/x-imsqti-item-xml", "image/png"],
        );
      }
    }),
  );

  suite.effect("a LOM string keeps its line feed and indentation and collapses beside it", () =>
    Effect.gen(function* simpleString() {
      const { rows } = yield* importManifest(inject("fixtures").simple);
      const description = only(
        Rows.of(rows, LomString).filter(
          (row) =>
            row.collapsed === "This is an example Contentpackage containing a single QTI v3.0 item",
        ),
      );

      assert.match(description.value, /containing a\n +single QTI v3\.0 item$/u);
    }),
  );

  suite.effect("simple yields its QtiMetadata record and leaves", () =>
    Effect.gen(function* simpleQmd() {
      const { rows } = yield* importManifest(inject("fixtures").simple);
      const record = only(Rows.of(rows, QtiMetadata));

      assert.strictEqual(record.resource, only(Rows.of(rows, Resource)).id);
      for (const [leaves, value] of [
        [Rows.of(rows, QmdTimeDependent), "false"],
        [Rows.of(rows, QmdInteractionType), "choiceInteraction"],
        [Rows.of(rows, QmdFeedbackType), "none"],
        [Rows.of(rows, QmdSolutionAvailable), "true"],
      ] as const) {
        const leaf = only(leaves);
        assert.strictEqual(leaf.qtiMetadata, record.id);
        assert.strictEqual(leaf.value, value);
      }
    }),
  );

  suite.effect("a padded boolean leaf collapses and has no attribute lexical row", () =>
    Effect.gen(function* paddedText() {
      const { rows } = yield* importManifest(yield* materialize("padded-text"));

      assert.strictEqual(only(Rows.of(rows, QmdTimeDependent)).value, "false");
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), []);
    }),
  );

  for (const name of ["CAT_Test01_Adaptive_EchoAdapt", "sample_pci"] as const) {
    suite.effect(`${name} is refused as not QTI 3`, () =>
      Effect.gen(function* refused() {
        const failure = yield* Effect.flip(importManifest(yield* materializePackage(name)));

        assert.instanceOf(failure, NotQti3);
        assert.match(failure.detail, /imscp_v1p1|schemaversion/u);
      }),
    );
  }
});
