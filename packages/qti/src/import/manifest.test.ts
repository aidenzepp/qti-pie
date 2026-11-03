import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { inject } from "vitest";
import { manifestGuards, ManifestGuardRefusal } from "#qti/import/guards/manifest.ts";
import { manifestRows, NotQti3 } from "#qti/import/manifest.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { Rows } from "#qti/import/tree.ts";
import { ResourceLomLanguageSet } from "#qti/schema/lang.ts";
import type { Entry } from "#qti/package/read.ts";
import { listPackage, PackageReadError, readEntry } from "#qti/package/read.ts";
import {
  Lom,
  LomFormat,
  LomLanguage,
  LomObjectIdentifier,
  LomObjectTitle,
  LomString,
  LomTitle,
  QmdCustomTypeIdentifier,
  QmdFeedbackType,
  QmdInteractionType,
  QmdSolutionAvailable,
  QmdPortableCustomInteractionContext,
  QmdTimeDependent,
  QtiMetadata,
} from "#qti/schema/metadata.ts";
import { Document } from "#qti/schema/document.ts";
import { AttributeLexical, Edge, Node, TextNode, TreeRoot } from "#qti/schema/node.ts";
import {
  File,
  FileContent,
  Manifest,
  ManifestMetadata,
  ManifestSchemaVersion,
  Organizations,
  Package,
  PackageEntry,
  Resource,
  ResourceHref,
} from "#qti/schema/package.ts";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { materialize, materializePackage } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * A leaf row reduced to the fields every qmd leaf shares, its value read as text.
 */
const plain = (leaf: {
  readonly id: string;
  readonly qtiMetadata: string;
  readonly value: string;
}): { readonly id: string; readonly qtiMetadata: string; readonly value: string } => leaf;

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

/**
 * The rows of `relation` with each one replaced by `change`'s answer for it.
 */
const mapRows = <R extends AnyRelation>(
  rows: Rows,
  relation: R,
  change: (row: Fact<R>) => Fact<R>,
): Rows => new Map(rows).set(relation, Rows.of(rows, relation).map(change));

/**
 * `row` with `patch` laid over it, for the tests that forge a value the row's type forbids.
 */
const patched = <T extends object>(row: T, patch: Partial<Record<keyof T, string>>): T => ({
  ...row,
  ...patch,
});

/**
 * Import the package at `dir` with an optional text edit to its manifest, and run the manifest
 * guards over its rows and listing after `alter` has changed them.
 */
const guarded = (
  dir: string,
  edit?: readonly [search: string, replacement: string],
  alter: (rows: Rows, entries: readonly Entry[]) => readonly [Rows, readonly Entry[]] = (
    rows,
    entries,
  ) => [rows, entries],
) =>
  Effect.gen(function* guardedImport() {
    const built = yield* importManifest(dir, edit);
    const entries = yield* listPackage(dir);
    const claimed = Rows.add(
      built.rows,
      Document,
      built.documents.map((document) => ({
        id: crypto.randomUUID(),
        package: built.packageId,
        path: document.path,
        resource: document.resource,
        resourceType: document.type,
        root: "item" as const,
        version: built.version,
      })),
    );
    const [changed, listing] = alter(claimed, entries);

    return yield* manifestGuards(changed, listing);
  });

/**
 * The refusal of the guards over the same inputs as {@link guarded}.
 */
const refusalOf = (...args: Parameters<typeof guarded>) =>
  Effect.gen(function* refusedImport() {
    const failure = yield* Effect.flip(guarded(...args));
    assert.instanceOf(failure, ManifestGuardRefusal);

    return failure;
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

  suite.effect("simple yields a ManifestSchemaVersion row that copies its package's version", () =>
    Effect.gen(function* versionRow() {
      const { packageId, rows } = yield* importManifest(inject("fixtures").simple);
      const metadata = only(Rows.of(rows, ManifestMetadata));
      const row = only(Rows.of(rows, ManifestSchemaVersion));

      assert.strictEqual(row.metadata, metadata.id);
      assert.strictEqual(row.package, packageId);
      assert.strictEqual(row.version, "3.0.0");
      assert.notProperty(row, "value");
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

  suite.effect("metaData yields its meta-metadata language and no resource language set row", () =>
    Effect.gen(function* metaDataLanguage() {
      const { rows } = yield* importManifest(inject("fixtures").metaData);

      const language = only(Rows.of(rows, LomLanguage).filter((row) => row.owner === "resource"));
      assert.strictEqual(language.parentKind, "lom:metaMetadata");
      assert.strictEqual(language.value, "en");
      assert.deepStrictEqual(Rows.of(rows, ResourceLomLanguageSet), []);
    }),
  );

  suite.effect("simple writes each LomLanguage the parentKind of its Edge", () =>
    Effect.gen(function* simpleLanguageParents() {
      const { rows } = yield* importManifest(inject("fixtures").simple);
      const languages = Rows.of(rows, LomLanguage);

      for (const language of languages) {
        assert.strictEqual(
          language.parentKind,
          only(Rows.of(rows, Edge).filter((edge) => edge.child === language.id)).parentKind,
        );
      }

      assert.deepStrictEqual(
        new Set(languages.map((language) => language.parentKind)),
        new Set(["lom:general", "lom:metaMetadata"]),
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

      assert.strictEqual(record.resource, only(Rows.of(rows, Resource)).identifier);
      for (const [leaves, value] of [
        [Rows.of(rows, QmdTimeDependent).map(plain), "false"],
        [Rows.of(rows, QmdInteractionType).map(plain), "choiceInteraction"],
        [Rows.of(rows, QmdFeedbackType).map(plain), "none"],
        [Rows.of(rows, QmdSolutionAvailable).map(plain), "true"],
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

  suite.effect("simple and padded-text pass all six manifest guards", () =>
    Effect.gen(function* controls() {
      yield* guarded(inject("fixtures").simple);
      yield* guarded(yield* materialize("padded-text"));
    }),
  );

  suite.effect(
    "a LomTitle whose collapsed copy disagrees with its text is refused as text-copy",
    () =>
      Effect.gen(function* collapsedCopy() {
        const failure = yield* refusalOf(inject("fixtures").simple, undefined, (rows, entries) => [
          mapRows(rows, LomTitle, (row) => ({ ...row, collapsed: "Another title" })),
          entries,
        ]);

        assert.strictEqual(failure.rule, "text-copy");
      }),
  );

  suite.effect("an unprocessed collapse leaf is refused as text-copy", () =>
    Effect.gen(function* unprocessedLeaf() {
      const failure = yield* refusalOf(inject("fixtures").simple, undefined, (rows, entries) => [
        mapRows(rows, QmdTimeDependent, (row) => patched(row, { value: " false " })),
        entries,
      ]);

      assert.strictEqual(failure.rule, "text-copy");
    }),
  );

  suite.effect("a replace leaf that keeps its tab is refused as text-copy", () =>
    Effect.gen(function* tabbedLeaf() {
      const container = "00000000-0000-4000-8000-0000000000c1";
      const leaf = "00000000-0000-4000-8000-0000000000c2";
      const text = "00000000-0000-4000-8000-0000000000c3";
      const withLeaf = (value: string) => (rows: Rows, entries: readonly Entry[]) => {
        const [qmd] = Rows.of(rows, QtiMetadata);
        const [root] = Rows.of(rows, TreeRoot);
        if (qmd === undefined || root === undefined) {
          return assert.fail("simple holds a QtiMetadata and a TreeRoot");
        }

        const node = (id: string, kind: Fact<typeof Node>["kind"]): Fact<typeof Node> => ({
          // No qmd kind enters an Ancestry flag, so every node here stays at `root`.
          ancestry: "root",
          id,
          kind,
          prefix: "",
          rootKind: "manifest",
          tree: root.tree,
          version: "3.0.0",
        });
        const edge = (
          parent: string,
          parentKind: Fact<typeof Edge>["parentKind"],
          child: string,
          childKind: Fact<typeof Edge>["childKind"],
        ): Fact<typeof Edge> => ({
          child,
          childAncestry: "root",
          childKind,
          parent,
          parentAncestry: "root",
          parentKind,
          position: 0n,
          tree: root.tree,
          version: "3.0.0",
        });
        let built = Rows.add(rows, Node, [
          node(container, "qmd:portableCustomInteractionContext"),
          node(leaf, "qmd:customTypeIdentifier"),
          node(text, "text"),
        ]);
        built = Rows.add(built, Edge, [
          edge(container, "qmd:portableCustomInteractionContext", leaf, "qmd:customTypeIdentifier"),
          edge(leaf, "qmd:customTypeIdentifier", text, "text"),
        ]);
        built = Rows.add(built, TextNode, [{ id: text, value: "a\tb" }]);
        built = Rows.add(built, QmdPortableCustomInteractionContext, [
          { id: container, qtiMetadata: qmd.id },
        ]);
        built = Rows.add(built, QmdCustomTypeIdentifier, [{ context: container, id: leaf, value }]);

        return [built, entries] as const;
      };

      yield* guarded(inject("fixtures").simple, undefined, withLeaf("a b"));

      const failure = yield* refusalOf(inject("fixtures").simple, undefined, withLeaf("a\tb"));
      assert.strictEqual(failure.rule, "text-copy");
    }),
  );

  suite.effect("a second cp:schemaversion outside 3.0.0 and 3.0.1 is refused as typed-copy", () =>
    Effect.gen(function* secondVersion() {
      const failure = yield* refusalOf(inject("fixtures").simple, [
        "<schemaversion>3.0.0</schemaversion>",
        "<schemaversion>3.0.0</schemaversion><schemaversion>3.0.2</schemaversion>",
      ]);

      assert.strictEqual(failure.rule, "typed-copy");
      assert.include(failure.detail, "3.0.2");
    }),
  );

  suite.effect(
    "an AttributeLexical row that disagrees with its typed column is refused as typed-copy",
    () =>
      Effect.gen(function* lexicalCopy() {
        const failure = yield* refusalOf(inject("fixtures").simple, undefined, (rows, entries) => [
          Rows.add(rows, AttributeLexical, [
            {
              attribute: "identifier",
              kind: "cp:manifest",
              node: only(Rows.of(rows, Package)).id,
              value: " another-identifier ",
            },
          ]),
          entries,
        ]);

        assert.strictEqual(failure.rule, "typed-copy");
      }),
  );

  suite.effect("a padded href keeps its lexical row and passes", () =>
    guarded(inject("fixtures").simple, ['href="choice.xml"', 'href=" choice.xml"']),
  );

  suite.effect("a resource whose file precedes its metadata is refused as ordering", () =>
    Effect.gen(function* resourceOrder() {
      const failure = yield* refusalOf(inject("fixtures").simple, undefined, (rows, entries) => {
        const resource = only(Rows.of(rows, Resource)).id;
        const children = Rows.of(rows, Edge).filter((edge) => edge.parent === resource);
        const metadata = children.find((edge) => edge.childKind === "cp:metadata.resource");
        const file = children.find((edge) => edge.childKind === "cp:file");

        return [
          mapRows(rows, Edge, (edge) => {
            if (edge.child === metadata?.child) {
              return { ...edge, position: file?.position ?? edge.position };
            }

            return edge.child === file?.child
              ? { ...edge, position: metadata?.position ?? edge.position }
              : edge;
          }),
          entries,
        ];
      });

      assert.strictEqual(failure.rule, "ordering");
    }),
  );

  suite.effect("a qtiMetadata whose children leave XSD order is refused as ordering", () =>
    Effect.gen(function* qmdOrder() {
      const failure = yield* refusalOf(inject("fixtures").simple, undefined, (rows, entries) => {
        const children = Rows.of(rows, Edge).filter(
          (edge) => edge.parentKind === "qmd:qtiMetadata",
        );
        const first = children.find((edge) => edge.childKind === "qmd:timeDependent");
        const second = children.find((edge) => edge.childKind === "qmd:interactionType");

        return [
          mapRows(rows, Edge, (edge) => {
            if (edge.child === first?.child) {
              return { ...edge, position: second?.position ?? edge.position };
            }

            return edge.child === second?.child
              ? { ...edge, position: first?.position ?? edge.position }
              : edge;
          }),
          entries,
        ];
      });

      assert.strictEqual(failure.rule, "ordering");
    }),
  );

  suite.effect("a listed file no File names is refused as file-listed", () =>
    Effect.gen(function* unnamedFile() {
      const failure = yield* refusalOf(inject("fixtures").simple, undefined, (rows, entries) => [
        rows,
        [...entries, { kind: "file", path: "extra.png" }],
      ]);

      assert.strictEqual(failure.rule, "file-listed");
      assert.include(failure.detail, "extra.png");
    }),
  );

  suite.effect("a resource href with no matching file is refused as href-listed", () =>
    Effect.gen(function* unmatchedHref() {
      const failure = yield* refusalOf(inject("fixtures").simple, [
        'href="choice.xml"',
        'href="other.xml"',
      ]);

      assert.strictEqual(failure.rule, "href-listed");
      assert.include(failure.detail, "other.xml");
    }),
  );

  suite.effect(
    "a resource identifier equal to the manifest identifier is refused as manifest-id-space",
    () =>
      Effect.gen(function* sharedIdentifier() {
        const failure = yield* refusalOf(inject("fixtures").simple, [
          'identifier="choice"',
          'identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"',
        ]);

        assert.strictEqual(failure.rule, "manifest-id-space");
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

  suite.effect("a cp:schema outside the seven QTI names is refused value-lexical", () =>
    Effect.gen(function* strayName() {
      const failure = yield* Effect.flip(
        importManifest(inject("fixtures").simple, [
          "<schema>QTI Package</schema>",
          "<schema>QTI Thing</schema>",
        ]),
      );

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "value-lexical");
    }),
  );

  suite.effect("a qmd:scoringMode outside its three values is refused value-lexical", () =>
    Effect.gen(function* strayMode() {
      const failure = yield* Effect.flip(
        importManifest(inject("fixtures").simple, [
          "<imsqti:feedbackType>none</imsqti:feedbackType>",
          "<imsqti:feedbackType>none</imsqti:feedbackType><imsqti:scoringMode>robot</imsqti:scoringMode>",
        ]),
      );

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "value-lexical");
    }),
  );

  suite.effect("a qmd:timeDependent outside xs:boolean is refused attribute-lexical", () =>
    Effect.gen(function* strayBoolean() {
      const failure = yield* Effect.flip(
        importManifest(inject("fixtures").simple, [
          "<imsqti:timeDependent>false</imsqti:timeDependent>",
          "<imsqti:timeDependent>perhaps</imsqti:timeDependent>",
        ]),
      );

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "attribute-lexical");
    }),
  );

  suite.effect("a padded qmd:timeDependent collapses to its handle", () =>
    Effect.gen(function* paddedBoolean() {
      const { rows } = yield* importManifest(inject("fixtures").simple, [
        "<imsqti:timeDependent>false</imsqti:timeDependent>",
        "<imsqti:timeDependent> true </imsqti:timeDependent>",
      ]);

      assert.deepStrictEqual(
        Rows.of(rows, QmdTimeDependent).map((row) => row.value),
        ["true"],
      );
    }),
  );
});
