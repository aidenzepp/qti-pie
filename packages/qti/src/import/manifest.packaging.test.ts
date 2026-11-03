import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { manifestGuards } from "#qti/import/guards/manifest.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { kindOf, Rows } from "#qti/import/tree.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import type { Entry } from "#qti/package/read.ts";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import * as cpx from "#qti/schema/kinds/cpx.ts";
import * as drd from "#qti/schema/kinds/drd.ts";
import { Document } from "#qti/schema/document.ts";
import {
  CsmCaseItemUri,
  CsmGuid,
  CsmLabel,
  CsmSet,
  CsmSetResourceLabel,
  CsmSetResourcePartId,
} from "#qti/schema/csm.ts";
import { ResourceLomGeneral } from "#qti/schema/lang.ts";
import {
  arms,
  FileLom,
  LomAnnotation,
  LomClassification,
  LomEducational,
  LomEntryLangString,
  LomId,
  LomIdentifier,
  LomIdentifierEntry,
  LomObjectIdentifier,
  LomRelation,
  LomSourceLangString,
  LomTaxonPath,
  LomValue,
  QtiMetadata,
  QtiMetadataInMetadata,
  QtiMetadataInResourceLom,
  ResourceLom,
  ResourceLomIdentified,
  ResourceLomTitled,
} from "#qti/schema/metadata.ts";
import { AttributeLexical, Edge, Node, NodeKind, TextNode } from "#qti/schema/node.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";
import {
  AccessForAllResource,
  DrdAccessMode,
  DrdAdaptationType,
  DrdAtInteroperable,
  DrdLanguageOfAdaptation,
  FileContent,
  FileMetadata,
  ManifestId,
  ManifestIdOfManifest,
  ManifestIdOfResource,
  ManifestIdOfVariant,
  Resource,
  Variant,
  VariantMetadata,
} from "#qti/schema/package.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * Every element of the subtree rooted at `element`, in document order, with its parent.
 */
const elementsOf = (
  element: Element,
  parent: Element | null,
): readonly { readonly element: Element; readonly parent: Element | null }[] => [
  { element, parent },
  ...element.children.flatMap((child) =>
    child.kind === "element" ? elementsOf(child, element) : [],
  ),
];

/**
 * The manifest of the package at `dir`, read.
 */
const manifestOf = (dir: string): Effect.Effect<XmlDocument, unknown> =>
  Effect.gen(function* manifestDocument() {
    return yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
  }).pipe(Effect.provide(NodeServices.layer));

/**
 * The manifest rows of the package at `dir` with the documents its resources name.
 */
const resultOf = (dir: string) =>
  Effect.gen(function* resultOfPackage() {
    const entries = yield* listPackage(dir);
    const doc = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
    const result = yield* manifestRows(dir, entries, doc, Rows.empty());

    return { doc, documents: result.documents, rows: result.rows };
  });

/**
 * The manifest rows of the package at `dir`.
 */
const rowsOf = (dir: string) =>
  Effect.gen(function* rowsOfPackage() {
    const entries = yield* listPackage(dir);
    const doc = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));

    return (yield* manifestRows(dir, entries, doc, Rows.empty())).rows;
  });

/**
 * The manifest rows of the package at `dir` with the document rows of the resources that name one,
 * as the import holds them when the guards run: an item through `itemRows`, any other document
 * type, whose reader a later slice owns, as the `Document` row its reader writes, or, for a type no
 * `RootOfType` row names (a fragment), as the bytes it is stored as.
 */
const builtOf = (dir: string) =>
  Effect.gen(function* builtPackage() {
    const entries = yield* listPackage(dir);
    const doc = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
    const built = yield* manifestRows(dir, entries, doc, Rows.empty());
    let { rows } = built;

    for (const document of built.documents) {
      if (document.type === "imsqti_item_xmlv3p0") {
        const item = yield* itemRows(
          {
            doc: yield* readXml(yield* readEntry(dir, document.path)),
            packageId: built.packageId,
            path: document.path,
            resource: document.resource,
            resourceLomHasGeneral: Rows.of(built.rows, ResourceLomGeneral).some(
              (general) => general.resource === document.resource,
            ),
            resourceType: document.type,
            version: built.version,
          },
          rows,
        );
        ({ rows } = item);
      } else {
        const root = rootOfType.find((row) => row.type === document.type)?.root;
        if (root === undefined) {
          const bytes = yield* readEntry(dir, document.path);
          rows = Rows.add(rows, FileContent, [
            {
              byteLength: BigInt(bytes.length),
              content: Buffer.from(bytes).toString("base64"),
              mimeType: "application/octet-stream",
              package: built.packageId,
              path: document.path,
            },
          ]);
        } else {
          rows = Rows.add(rows, Document, [
            {
              id: crypto.randomUUID(),
              package: built.packageId,
              path: document.path,
              resource: document.resource,
              resourceType: document.type,
              root,
              version: built.version,
            },
          ]);
        }
      }
    }

    return { entries, packageId: built.packageId, rows };
  });

/**
 * What the manifest guards answer over `rows` and `entries`: the rule of the refusal and its
 * detail, or the rule `pass` when every guard holds.
 */
const verdictOf = (rows: Rows, entries: readonly Entry[]) =>
  manifestGuards(rows, entries).pipe(
    Effect.match({
      onFailure: (refusal): { readonly detail: string; readonly rule: string } => refusal,
      onSuccess: () => ({ detail: "", rule: "pass" }),
    }),
  );

/**
 * How many rows of the arm of `kind` have `id`, which is zero for a kind with no arm.
 */
const armRowsOf = (rows: Rows, kind: string, id: string): number =>
  Object.entries(arms)
    .filter(([armKind]) => armKind === kind)
    .reduce(
      (count, [, arm]) => count + Rows.of(rows, arm).filter((row) => row.id === id).length,
      0,
    );

/**
 * The rows of `relation` with each one replaced by `change`'s answer for it.
 */
const mapRows = <R extends AnyRelation>(
  rows: Rows,
  relation: R,
  change: (row: Fact<R>) => Fact<R>,
): Rows => new Map(rows).set(relation, Rows.of(rows, relation).map(change));

/**
 * `rows` with the positions of the first and last edge of the children of `parentKind` that
 * `isLeaf` accepts exchanged, which puts the last child before the first.
 */
const reversedChildren = (rows: Rows, parentKind: string, isLeaf: (kind: string) => boolean) => {
  const leaves = Rows.of(rows, Edge)
    .filter((edge) => edge.parentKind === parentKind && isLeaf(edge.childKind))
    .toSorted((left, right) => Number(left.position - right.position));
  const first = leaves.at(0);
  const last = leaves.at(-1);
  assert.isDefined(first);
  assert.isDefined(last);
  assert.notStrictEqual(first?.child, last?.child);

  return mapRows(rows, Edge, (edge) => {
    if (edge.child === first?.child) {
      return { ...edge, position: last?.position ?? edge.position };
    }

    return edge.child === last?.child
      ? { ...edge, position: first?.position ?? edge.position }
      : edge;
  });
};

layer(NodeServices.layer, { excludeTestServices: true })("import/manifest.ts holders", (suite) => {
  suite.effect(
    "writes the manifest's and the resource's ManifestId rows beside their holders",
    () =>
      Effect.gen(function* manifestIdRows() {
        const rows = yield* rowsOf(yield* materialize("simple"));
        const manifest = Rows.of(rows, ManifestIdOfManifest);
        const resource = Rows.of(rows, ManifestIdOfResource);
        assert.deepStrictEqual(
          manifest.map((row) => row.id),
          ["MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"],
        );
        assert.deepStrictEqual(
          resource.map((row) => row.id),
          ["choice"],
        );
        assert.deepStrictEqual(
          Rows.of(rows, ManifestId)
            .map((row) => row.holder)
            .toSorted(),
          ["manifest", "resource"],
        );
      }),
  );

  suite.effect("gives every ManifestId row the package of its holder", () =>
    Effect.gen(function* samePackage() {
      const rows = yield* rowsOf(yield* materialize("simple"));
      const packages = new Set(Rows.of(rows, ManifestId).map((row) => row.package));
      assert.strictEqual(packages.size, 1);
    }),
  );

  suite.effect("writes SIMPLE's one QtiMetadata row with its host arm on the resource node", () =>
    Effect.gen(function* hostRow() {
      const rows = yield* rowsOf(yield* materialize("simple"));
      const [record, ...more] = Rows.of(rows, QtiMetadata);
      assert.strictEqual(more.length, 0);
      assert.strictEqual(record?.host, "metadata");
      assert.strictEqual(record?.resource, "choice");

      const [arm, ...rest] = Rows.of(rows, QtiMetadataInMetadata);
      assert.strictEqual(rest.length, 0);
      assert.strictEqual(arm?.id, record?.id);
      assert.strictEqual(arm?.package, record?.package);
      assert.strictEqual(arm?.resource, "choice");

      const [holder] = Rows.of(rows, Resource);
      assert.strictEqual(arm?.resourceNode, holder?.id);
    }),
  );

  suite.effect("composes every cpx and drd handle into NodeKind", () =>
    Effect.sync(() => {
      const handles: readonly string[] = NodeKind.handles;
      for (const kind of [...cpx.kinds, ...drd.kinds]) {
        assert.isTrue(handles.includes(kind), kind);
      }
    }),
  );

  suite.effect("gives every LomValue row the parentKind of its Edge row", () =>
    Effect.gen(function* valueParents() {
      const rows = yield* rowsOf(yield* materialize("simple"));
      const edges = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.parentKind]));
      const values = Rows.of(rows, LomValue);
      assert.isAbove(values.length, 0);
      for (const value of values) {
        assert.strictEqual(value.parentKind, edges.get(value.id), value.id);
      }
    }),
  );

  suite.effect("writes the LOM remainder's rows for the lomrest package", () =>
    Effect.gen(function* remainderRows() {
      const rows = yield* rowsOf(yield* materialize("lomrest"));
      assert.strictEqual(Rows.of(rows, LomEducational).length, 2);
      assert.strictEqual(Rows.of(rows, LomClassification).length, 1);
      assert.strictEqual(Rows.of(rows, LomRelation).length, 1);
      assert.strictEqual(Rows.of(rows, LomAnnotation).length, 1);
      assert.strictEqual(Rows.of(rows, LomTaxonPath).length, 2);
      assert.strictEqual(Rows.of(rows, LomSourceLangString).length, 2);
      assert.strictEqual(Rows.of(rows, LomEntryLangString).length, 2);

      const types = Rows.of(rows, LomValue).filter(
        (value) => value.parentKind === "lom:learningResourceType",
      );
      assert.deepStrictEqual(
        types.map((value) => value.collapsed),
        ["exercise"],
      );
    }),
  );

  suite.effect("keys lomrest's identifiers by their parent and their entries by identifier", () =>
    Effect.gen(function* identifierParents() {
      const rows = yield* rowsOf(yield* materialize("lomrest"));
      const edges = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge]));
      const identifiers = Rows.of(rows, LomIdentifier);
      assert.isAbove(identifiers.length, 1);

      const pairs = identifiers.map((row) => `${row.parent}/${row.position}`);
      assert.strictEqual(new Set(pairs).size, pairs.length);
      for (const row of identifiers) {
        assert.strictEqual(row.parent, edges.get(row.id)?.parent, row.id);
        assert.strictEqual(row.position, edges.get(row.id)?.position, row.id);
      }

      const underResource = identifiers.filter(
        (row) => edges.get(row.parent)?.childKind === "lom:resource",
      );
      assert.strictEqual(underResource.length, 1);

      const entries = Rows.of(rows, LomIdentifierEntry);
      assert.isAbove(entries.length, 0);
      assert.strictEqual(new Set(entries.map((row) => row.identifier)).size, entries.length);

      const ids = new Set(identifiers.map((row) => row.id));
      for (const entry of entries) {
        assert.isTrue(ids.has(entry.identifier), entry.id);
      }

      const [object, ...rest] = Rows.of(rows, LomObjectIdentifier);
      assert.strictEqual(rest.length, 0);

      const named = identifiers.find((row) => row.id === object?.identifier);
      assert.strictEqual(edges.get(named?.parent ?? "")?.childKind, "lom:general");
    }),
  );

  suite.effect("writes one LomId row per lom:id with the leaf's text", () =>
    Effect.gen(function* idRows() {
      const dir = yield* materialize("lomrest");
      const rows = yield* rowsOf(dir);
      const doc = yield* manifestOf(dir);
      const expected = elementsOf(doc.root, null)
        .filter(({ element }) => element.local === "id" && element.namespace.includes("LOM"))
        .map(({ element }) =>
          element.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
        );
      assert.isAbove(expected.length, 0);
      assert.deepStrictEqual(
        Rows.of(rows, LomId).map((row) => row.value),
        expected,
      );
    }),
  );

  suite.effect("reads lomrest's manifest without an UnmodeledVocabulary refusal", () =>
    Effect.gen(function* resolved() {
      const rows = yield* rowsOf(yield* materialize("lomrest"));
      assert.isAbove(Rows.of(rows, Edge).length, 0);
    }),
  );

  suite.effect("resolves a duration under typicalLearningTime to lom:duration.string", () =>
    Effect.gen(function* durationKinds() {
      const doc = yield* manifestOf(yield* materialize("lomrest"));
      const found = elementsOf(doc.root, null).filter(
        ({ element, parent }) =>
          element.local === "duration" && parent?.local === "typicalLearningTime",
      );
      assert.isAbove(found.length, 0);
      for (const { element } of found) {
        assert.deepStrictEqual(
          kindOf(element, Option.some("lom:typicalLearningTime")),
          Option.some("lom:duration.string"),
        );
      }
    }),
  );

  suite.effect("writes csm's two sets under the manifest and resource metadata nodes", () =>
    Effect.gen(function* csmRows() {
      const dir = yield* materialize("csm");
      const rows = yield* rowsOf(dir);
      const kinds = new Map(Rows.of(rows, Node).map((node) => [node.id, node.kind]));
      assert.deepStrictEqual(
        Rows.of(rows, CsmSet)
          .map((set) => kinds.get(set.host) ?? "")
          .toSorted((left, right) => left.localeCompare(right)),
        ["cp:metadata.manifest", "cp:metadata.resource"],
      );

      const doc = yield* manifestOf(dir);
      const guids = elementsOf(doc.root, null)
        .filter(({ element }) => element.local === "GUID")
        .map(({ element }) =>
          element.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
        );
      assert.isAbove(guids.length, 0);
      assert.deepStrictEqual(
        Rows.of(rows, CsmGuid).map((row) => row.value),
        guids,
      );
      assert.strictEqual(Rows.of(rows, CsmLabel).length, guids.length);
      assert.strictEqual(Rows.of(rows, CsmCaseItemUri).length, guids.length);
      assert.strictEqual(Rows.of(rows, CsmSetResourceLabel).length, 1);
      assert.strictEqual(Rows.of(rows, CsmSetResourcePartId).length, 1);
      assert.strictEqual(Rows.of(rows, CsmSetResourcePartId)[0]?.value, "choice");
    }),
  );

  suite.effect("writes filelom's file metadata, two file records and two sets", () =>
    Effect.gen(function* fileRows() {
      const rows = yield* rowsOf(yield* materialize("filelom"));
      const kinds = new Map(Rows.of(rows, Node).map((node) => [node.id, node.kind]));
      const [metadata, ...more] = Rows.of(rows, FileMetadata);
      assert.strictEqual(more.length, 0);
      assert.strictEqual(kinds.get(metadata?.file ?? ""), "cp:file");

      const records = Rows.of(rows, FileLom);
      assert.strictEqual(records.length, 2);
      for (const record of records) {
        assert.strictEqual(record.metadata, metadata?.id);
        assert.strictEqual(record.file, metadata?.file);
      }

      const sets = Rows.of(rows, CsmSet).filter((set) => set.host === metadata?.id);
      assert.strictEqual(sets.length, 2);
      assert.strictEqual(kinds.get(metadata?.id ?? ""), "cp:metadata.file");

      const fileLoms = new Set(records.map((record) => record.lom));
      for (const record of Rows.of(rows, ResourceLom)) {
        assert.isFalse(fileLoms.has(record.lom));
      }

      for (const row of [
        ...Rows.of(rows, ResourceLomIdentified),
        ...Rows.of(rows, ResourceLomTitled),
      ]) {
        assert.isFalse(fileLoms.has(row.lom));
      }
    }),
  );

  suite.effect("writes nestedqmd's one resource-lom QtiMetadata with its host arm", () =>
    Effect.gen(function* nestedRows() {
      const rows = yield* rowsOf(yield* materialize("nestedqmd"));
      const [record, ...more] = Rows.of(rows, QtiMetadata);
      assert.strictEqual(more.length, 0);
      assert.strictEqual(record?.host, "resourceLom");

      const [arm, ...rest] = Rows.of(rows, QtiMetadataInResourceLom);
      assert.strictEqual(rest.length, 0);
      assert.strictEqual(arm?.id, record?.id);
      assert.strictEqual(arm?.resource, record?.resource);
      assert.deepStrictEqual(
        Rows.of(rows, ResourceLom).map((lom) => lom.lom),
        [arm?.lom],
      );
      assert.strictEqual(Rows.of(rows, QtiMetadataInMetadata).length, 0);
    }),
  );

  suite.effect("writes no QtiMetadata row for a qtiMetadata with no arm to land in", () =>
    Effect.gen(function* noArmRows() {
      for (const name of ["nestedqmd-manifest-lom", "filelom-qmd"] as const) {
        const rows = yield* rowsOf(yield* materialize(name));
        const parents = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.parentKind]));
        const stranded = Rows.of(rows, Node).filter(
          (node) =>
            node.kind === "qmd:qtiMetadata" &&
            (parents.get(node.id) === "cp:metadata.file" || parents.get(node.id) === "lom:lom"),
        );
        assert.isAbove(stranded.length, 0, name);

        const records = new Set([
          ...Rows.of(rows, QtiMetadata).map((row) => row.id),
          ...Rows.of(rows, QtiMetadataInMetadata).map((row) => row.id),
          ...Rows.of(rows, QtiMetadataInResourceLom).map((row) => row.id),
        ]);
        for (const node of stranded) {
          assert.isFalse(records.has(node.id), name);
        }
      }
    }),
  );

  suite.effect("writes every qmd leaf's arm row wherever its qtiMetadata sits", () =>
    Effect.gen(function* qmdLeafArms() {
      for (const name of ["nestedqmd-manifest-lom", "filelom-qmd"] as const) {
        const rows = yield* rowsOf(yield* materialize(name));
        const leaves = Rows.of(rows, Node).filter(
          (node) => node.kind.startsWith("qmd:") && node.kind !== "qmd:qtiMetadata",
        );
        assert.isAbove(leaves.length, 0, name);
        for (const leaf of leaves) {
          assert.strictEqual(armRowsOf(rows, leaf.kind, leaf.id), 1, `${name} ${leaf.kind}`);
        }

        const parents = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.parentKind]));
        const stranded = Rows.of(rows, Node).filter(
          (node) =>
            node.kind === "qmd:qtiMetadata" &&
            (parents.get(node.id) === "cp:metadata.file" || parents.get(node.id) === "lom:lom"),
        );
        assert.isAbove(stranded.length, 0, name);
        for (const record of stranded) {
          assert.isFalse(
            Rows.of(rows, QtiMetadata).some((row) => row.id === record.id),
            name,
          );
        }
      }
    }),
  );

  suite.effect("passes the guards over a package whose only hostless node is its qmd record", () =>
    Effect.gen(function* hostlessRecordPasses() {
      const built = yield* builtOf(yield* materialize("nestedqmd-manifest-lom"));

      assert.strictEqual((yield* verdictOf(built.rows, built.entries)).rule, "pass");
    }),
  );

  suite.effect("writes each qmd node of a hosted record one arm row, none twice", () =>
    Effect.gen(function* hostedQmdArms() {
      const rows = yield* rowsOf(yield* materialize("simple"));
      const qmds = Rows.of(rows, Node).filter((node) => node.kind.startsWith("qmd:"));
      assert.isAbove(qmds.length, 1);
      for (const node of qmds) {
        assert.strictEqual(armRowsOf(rows, node.kind, node.id), 1, node.kind);
      }
    }),
  );

  suite.effect("writes variant's Variant, metadata, access-for-all resource and leaf rows", () =>
    Effect.gen(function* variantRows() {
      const rows = yield* rowsOf(yield* materialize("variant"));
      const [variant, ...more] = Rows.of(rows, Variant);
      assert.strictEqual(more.length, 0);
      assert.strictEqual(variant?.identifier, "v1");
      assert.strictEqual(variant?.identifierref, "choice_es");
      assert.strictEqual(variant?.resourceIdentifier, "choice");

      const holder = Rows.of(rows, Resource).find((row) => row.identifier === "choice");
      assert.strictEqual(variant?.resource, holder?.id);

      const [metadata, ...moreMetadata] = Rows.of(rows, VariantMetadata);
      assert.strictEqual(moreMetadata.length, 0);
      assert.strictEqual(metadata?.variant, variant?.id);

      const [description, ...moreDescriptions] = Rows.of(rows, AccessForAllResource);
      assert.strictEqual(moreDescriptions.length, 0);
      assert.strictEqual(description?.metadata, metadata?.id);

      const leaves = [
        ...Rows.of(rows, DrdAccessMode),
        ...Rows.of(rows, DrdAdaptationType),
        ...Rows.of(rows, DrdLanguageOfAdaptation),
      ];
      assert.deepStrictEqual(
        leaves.map((leaf) => leaf.value),
        ["textual", "ext:stacked_translation", "es"],
      );
      for (const leaf of leaves) {
        assert.strictEqual(leaf.owner, description?.id);
      }

      const ids = Rows.of(rows, ManifestId)
        .map((row) => `${row.id}:${row.holder}`)
        .toSorted();
      assert.deepStrictEqual(
        ids,
        [
          "MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390:manifest",
          "choice:resource",
          "choice_es:resource",
          "v1:variant",
        ].toSorted(),
      );
      assert.deepStrictEqual(
        Rows.of(rows, ManifestIdOfVariant).map((row) => row.id),
        ["v1"],
      );
    }),
  );

  suite.effect("keeps variant-padded's lexical forms beside the classed values", () =>
    Effect.gen(function* paddedRows() {
      const { doc, rows } = yield* resultOf(yield* materialize("variant-padded"));
      const [variant] = Rows.of(rows, Variant);
      assert.strictEqual(variant?.identifier, "v1");

      const lexical = Rows.of(rows, AttributeLexical).filter(
        (row) => row.node === variant?.id && row.attribute === "identifier",
      );
      assert.deepStrictEqual(
        lexical.map((row) => row.value),
        [" v1 "],
      );

      const texts = (local: string) =>
        elementsOf(doc.root, null)
          .filter(({ element }) => element.local === local)
          .map(({ element }) =>
            element.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
          );
      assert.deepStrictEqual(texts("atInteroperable"), [" true "]);
      assert.deepStrictEqual(
        Rows.of(rows, DrdAtInteroperable).map((row) => row.value),
        ["true"],
      );

      const [language] = texts("languageOfAdaptation");
      assert.isTrue(language?.includes("\t") ?? false);
      assert.deepStrictEqual(
        Rows.of(rows, DrdLanguageOfAdaptation).map((row) => row.value),
        ["es ES"],
      );
    }),
  );

  suite.effect("reads exactly the record resource's href as a document in extmeta", () =>
    Effect.gen(function* recordDocument() {
      const { documents, rows } = yield* resultOf(yield* materialize("extmeta"));
      const records = documents.filter((document) => document.type === "resourcemetadata/xml");
      assert.deepStrictEqual(
        records.map((document) => document.path),
        ["meta/choice.xml"],
      );

      const contents = new Set(Rows.of(rows, FileContent).map((row) => row.path));
      assert.isFalse(contents.has("meta/choice.xml"));
      assert.isTrue(contents.has("images/sign.png"));
      for (const document of documents) {
        assert.isFalse(contents.has(document.path), document.path);
      }
    }),
  );

  suite.effect(
    "refuses an hrefless record resource that lists several files as record-unnamed",
    () =>
      Effect.gen(function* recordUnnamed() {
        const refusal = yield* Effect.flip(resultOf(yield* materialize("extmeta-hrefless")));
        assert.strictEqual(refusal._tag, "ExternalRefusal");
        assert.isTrue(refusal._tag === "ExternalRefusal" && refusal.rule === "record-unnamed");
      }),
  );

  suite.effect("still lists the record the href names in extmeta", () =>
    Effect.gen(function* recordByHref() {
      const { documents } = yield* resultOf(yield* materialize("extmeta"));
      assert.deepStrictEqual(
        documents.filter((document) => document.resource === "choice-meta"),
        [
          {
            path: "meta/choice.xml",
            resource: "choice-meta",
            resourceId: documents.find((document) => document.resource === "choice-meta")
              ?.resourceId,
            type: "resourcemetadata/xml",
          },
        ],
      );
    }),
  );

  suite.effect("stores bytes' fragment as a packaged file, never as a document", () =>
    Effect.gen(function* fragmentBytes() {
      const { documents, rows } = yield* resultOf(yield* materialize("bytes"));
      assert.deepStrictEqual(
        documents.map((document) => document.path),
        ["choice.xml"],
      );

      const contents = new Set(Rows.of(rows, FileContent).map((row) => row.path));
      assert.isTrue(contents.has("fragments/rtest01-fragment.xml"));
      assert.isTrue(contents.has("meta/other.xml"));
      for (const document of documents) {
        assert.isFalse(contents.has(document.path), document.path);
      }
    }),
  );

  suite.effect(
    "refuses a cpx:variant before a cp:file and a DRD leaf out of sequence as ordering",
    () =>
      Effect.gen(function* orderingRefusals() {
        const misplaced = yield* builtOf(yield* materialize("variant-before-file"));
        assert.strictEqual((yield* verdictOf(misplaced.rows, misplaced.entries)).rule, "ordering");

        const { entries, rows } = yield* builtOf(yield* materialize("variant"));
        assert.strictEqual((yield* verdictOf(rows, entries)).rule, "pass");

        const reversed = reversedChildren(rows, "drd:accessForAllResource", (kind) =>
          kind.startsWith("drd:"),
        );
        const verdict = yield* verdictOf(reversed, entries);
        assert.strictEqual(verdict.rule, "ordering");
        assert.include(verdict.detail, "drd:accessForAllResource");
      }),
  );

  suite.effect("refuses a csmd:labelledGUID whose children are out of sequence as ordering", () =>
    Effect.gen(function* labelledOrder() {
      const { entries, rows } = yield* builtOf(yield* materialize("csm"));
      assert.strictEqual((yield* verdictOf(rows, entries)).rule, "pass");

      const reversed = reversedChildren(rows, "csmd:labelledGUID", (kind) =>
        kind.startsWith("csmd:"),
      );
      const verdict = yield* verdictOf(reversed, entries);
      assert.strictEqual(verdict.rule, "ordering");
      assert.include(verdict.detail, "csmd:labelledGUID");
    }),
  );

  suite.effect("refuses a LomValue and a CsmGuid that disagree with their text as text-copy", () =>
    Effect.gen(function* textCopies() {
      const simple = yield* builtOf(yield* materialize("simple"));
      const unfolded = mapRows(simple.rows, LomValue, (row) =>
        row.collapsed === undefined ? row : { ...row, collapsed: `${row.collapsed}!` },
      );
      assert.strictEqual((yield* verdictOf(unfolded, simple.entries)).rule, "text-copy");

      const { entries, rows } = yield* builtOf(yield* materialize("csm"));
      const [guid] = Rows.of(rows, CsmGuid);
      assert.isDefined(guid);

      const texts = Rows.of(rows, Edge)
        .filter((edge) => edge.parent === guid?.id)
        .map((edge) => edge.child);
      assert.isAbove(texts.length, 0);

      const tabbed = mapRows(rows, TextNode, (row) =>
        row.id === texts[0] ? { ...row, value: "a\tb" } : row,
      );
      const content = Rows.of(tabbed, TextNode)
        .filter((row) => texts.includes(row.id))
        .map((row) => row.value)
        .join("");
      assert.include(content, "\t");

      const unreplaced = mapRows(tabbed, CsmGuid, (row) => ({ ...row, value: content }));
      const verdict = yield* verdictOf(unreplaced, entries);
      assert.strictEqual(verdict.rule, "text-copy");
      assert.include(verdict.detail, "CsmGuid");
    }),
  );

  suite.effect(
    "refuses a variant lexical form that does not collapse to its column as typed-copy",
    () =>
      Effect.gen(function* variantLexical() {
        const { entries, rows } = yield* builtOf(yield* materialize("variant-padded"));
        assert.strictEqual((yield* verdictOf(rows, entries)).rule, "pass");

        const [variant] = Rows.of(rows, Variant);
        const changed = mapRows(rows, AttributeLexical, (row) =>
          row.node === variant?.id && row.attribute === "identifier"
            ? { ...row, value: " v9 " }
            : row,
        );
        const verdict = yield* verdictOf(changed, entries);
        assert.strictEqual(verdict.rule, "typed-copy");
        assert.include(verdict.detail, "identifier");
      }),
  );

  suite.effect("refuses a replace-class CSM column holding a tab as typed-copy", () =>
    Effect.gen(function* csmTab() {
      const { entries, rows } = yield* builtOf(yield* materialize("csm"));
      assert.strictEqual((yield* verdictOf(rows, entries)).rule, "pass");

      const tabbed = mapRows(rows, CsmSetResourceLabel, (row) => ({ ...row, value: "a\tb" }));
      const verdict = yield* verdictOf(tabbed, entries);
      assert.strictEqual(verdict.rule, "typed-copy");
      assert.include(verdict.detail, "CsmSetResourceLabel");
    }),
  );

  suite.effect("refuses a QTI document stored as bytes under a type that names another root", () =>
    Effect.gen(function* rootTypeReverse() {
      for (const [name, entry, root] of [
        ["bytes-webcontent-item", "choice.xml", "qti-assessment-item"],
        ["resproc-webcontent", "rp/match_correct.xml", "qti-response-processing"],
      ] as const) {
        const { entries, rows } = yield* builtOf(yield* materialize(name));
        const verdict = yield* verdictOf(rows, entries);
        assert.strictEqual(verdict.rule, "root-type-reverse", name);
        assert.include(verdict.detail, entry, name);
        assert.include(verdict.detail, root, name);
      }
    }),
  );

  suite.effect("refuses an entry that is both a document and bytes, and one that is neither", () =>
    Effect.gen(function* entryKinds() {
      const { entries, packageId, rows } = yield* builtOf(yield* materialize("simple"));
      assert.strictEqual((yield* verdictOf(rows, entries)).rule, "pass");

      const documents = Rows.of(rows, Document).map((row) => row.path);
      assert.isAbove(documents.length, 0);

      const [path] = documents;
      assert.isDefined(path);

      const both = Rows.add(rows, FileContent, [
        {
          byteLength: 0n,
          content: "",
          mimeType: "application/octet-stream",
          package: packageId,
          path: path ?? "",
        },
      ]);
      const doubled = yield* verdictOf(both, entries);
      assert.strictEqual(doubled.rule, "entry-kind");
      assert.include(doubled.detail, path ?? "");

      const neither = new Map(rows).set(Document, []);
      const dropped = yield* verdictOf(neither, entries);
      assert.strictEqual(dropped.rule, "entry-kind");
      assert.include(dropped.detail, path ?? "");
    }),
  );

  suite.effect(
    "passes the variant, csm, filelom, bytes and resproc packages through every guard",
    () =>
      Effect.gen(function* positives() {
        for (const name of [
          "variant",
          "variant-padded",
          "csm",
          "filelom",
          "bytes",
          "resproc",
        ] as const) {
          const { entries, rows } = yield* builtOf(yield* materialize(name));
          const verdict = yield* verdictOf(rows, entries);
          assert.strictEqual(verdict.rule, "pass", `${name}: ${verdict.detail}`);
        }
      }),
  );

  suite.effect("refuses a drd:atInteroperable of maybe as attribute-lexical before the write", () =>
    Effect.gen(function* strayInteroperable() {
      const dir = yield* materialize("variant-padded");
      const entries = yield* listPackage(dir);
      const text = new TextDecoder().decode(yield* readEntry(dir, "imsmanifest.xml"));
      assert.isTrue(text.includes(" true "));

      const doc = yield* readXml(new TextEncoder().encode(text.replace(" true ", "maybe")));
      const failure = yield* Effect.flip(manifestRows(dir, entries, doc, Rows.empty()));

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "attribute-lexical");
    }),
  );
});
