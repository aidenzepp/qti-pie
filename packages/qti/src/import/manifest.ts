/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The importer's reading of a package's manifest: the rows of its structure (the package, its
 * resources with their files and dependencies, the entries the package holds and the bytes of the
 * ones no QTI document claims) and the refusal of a package that is not QTI 3.
 *
 * The manifest is a tree, so {@link treeRows} writes its nodes; this module writes the arm rows on
 * top of the node index it returns. The LOM and QTI-metadata rows and the manifest guards belong
 * to other modules.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option, Schema } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { Rows, treeRows, typedAttribute } from "#qti/import/tree.ts";
import type { NodeIndex, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { readEntry } from "#qti/package/read.ts";
import type { Entry } from "#qti/package/read.ts";
import type { AttributeNameHandle, NodeKindHandle, SchemaVersionHandle } from "#qti/schema/node.ts";
import {
  Dependency,
  File,
  FileContent,
  Manifest,
  ManifestMetadata,
  ManifestSchema,
  ManifestSchemaVersion,
  Organizations,
  Package,
  PackageEntry,
  Resource,
  ResourceHref,
  ResourceMetadata,
  Resources,
} from "#qti/schema/package.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * The package is not a QTI 3 content package: its manifest root is not in the QTI 3 content
 * package namespace, or its `schemaversion` is not `3.0.0` or `3.0.1`.
 *
 * `detail` names what was found and what a QTI 3 manifest has instead.
 */
export class NotQti3 extends Schema.TaggedError<NotQti3>()("NotQti3", {
  detail: Schema.String,
}) {
  /**
   * What was refused and what to supply, in one or two sentences.
   */
  override get message(): string {
    return `This is not a QTI 3 content package: ${this.detail}. Import a package whose manifest is a QTI 3.0.0 or 3.0.1 one.`;
  }
}

const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The resource types that name a QTI document: `imsqti_<kind>_xmlv3p0`.
 */
const qtiDocumentType = /^imsqti_.+_xmlv3p0$/u;

/**
 * The schema versions this importer reads.
 */
const isSchemaVersion = (value: string): value is SchemaVersionHandle =>
  value === "3.0.0" || value === "3.0.1";

/**
 * One document a resource of a QTI type names by `href`.
 */
export interface ManifestDocument {
  readonly path: string;
  readonly resource: string;
  readonly resourceId: string;
  readonly type: string;
}

/**
 * The media type of a package file by extension; anything unnamed is `application/octet-stream`.
 */
const mimeTypeOf = (entryPath: string): `${string}/${string}` => {
  const extension = entryPath.slice(entryPath.lastIndexOf(".") + 1).toLowerCase();

  switch (extension) {
    case "png": {
      return "image/png";
    }
    case "jpg":
    case "jpeg": {
      return "image/jpeg";
    }
    case "gif": {
      return "image/gif";
    }
    case "svg": {
      return "image/svg+xml";
    }
    case "css": {
      return "text/css";
    }
    default: {
      return "application/octet-stream";
    }
  }
};

/**
 * The element children of `element` that are in the CP namespace and have local name `local`.
 */
const childrenNamed = (element: Element, local: string): readonly Element[] =>
  element.children.filter(
    (child): child is Element =>
      child.kind === "element" && child.namespace === cpNamespace && child.local === local,
  );

/**
 * The character data of an element's direct text children, joined.
 */
const textOf = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.value : "")).join("");

/**
 * The value of an attribute that has no namespace, `None` when it is absent.
 */
const attributeOf = (element: Element, local: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local)
      ?.value,
  );

/**
 * Check the manifest is a QTI 3 one before any row is written.
 *
 * @returns The schema version, or `NotQti3` naming the root namespace or the `schemaversion`.
 */
const versionOf = (doc: XmlDocument): Effect.Effect<SchemaVersionHandle, NotQti3> => {
  const { root } = doc;
  if (root.namespace !== cpNamespace || root.local !== "manifest") {
    return Effect.fail(
      new NotQti3({
        detail: `the manifest root is {${root.namespace}}${root.local}, and a QTI 3 manifest root is {${cpNamespace}}manifest`,
      }),
    );
  }

  const [text] = childrenNamed(root, "metadata")
    .flatMap((metadata) => childrenNamed(metadata, "schemaversion"))
    .map((found) => textOf(found));
  if (text === undefined || !isSchemaVersion(text)) {
    return Effect.fail(
      new NotQti3({
        detail: `the manifest schemaversion is ${text === undefined ? "missing" : JSON.stringify(text)}, and a QTI 3 manifest has 3.0.0 or 3.0.1`,
      }),
    );
  }

  return Effect.succeed(text);
};

/**
 * Write the rows of a package's manifest.
 *
 * The root must be the QTI 3 content package `manifest` and its `schemaversion` `3.0.0` or `3.0.1`,
 * and that is judged before anything else. The package id is a fresh uuid and is the manifest
 * tree's id. Every manifest attribute goes through {@link typedAttribute} with the class the spec
 * names. The `file` positions count the resource's `file` children from 0.
 *
 * @param dir - The package directory, where the bytes of unclaimed files are read.
 * @param entries - The package's entries, as `listPackage` returns them.
 * @param doc - The manifest as the reader gave it.
 * @param rows - The rows so far.
 * @returns The rows with the manifest's added, the node index, the package id, the version and one
 *   document per resource of a QTI type that has an `href`; `NotQti3` for a manifest that is not
 *   QTI 3, `UnmodeledVocabulary` for an element or attribute no registry names.
 */
export const manifestRows = Effect.fn("import.manifestRows")(function* manifestRows(
  dir: string,
  entries: readonly Entry[],
  doc: XmlDocument,
  rows: Rows,
): Effect.fn.Return<
  {
    documents: readonly ManifestDocument[];
    nodes: NodeIndex;
    packageId: string;
    rows: Rows;
    version: SchemaVersionHandle;
  },
  NotQti3 | UnmodeledVocabulary | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const version = yield* versionOf(doc);
  const packageId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: packageId, kind: "manifest", root: "manifest", version },
    rows,
  );
  const { nodes } = tree;
  let built = tree.rows;

  const add = <R extends AnyRelation>(relation: R, facts: readonly Fact<R>[]): void => {
    built = Rows.add(built, relation, facts);
  };
  const typed = (
    element: Element,
    name: AttributeNameHandle,
    whiteSpace: "preserve" | "collapse",
  ): string => {
    const node = nodes.get(element);
    const lexical = attributeOf(element, name);
    if (node === undefined || Option.isNone(lexical)) {
      return "";
    }

    const processed = typedAttribute(built, node.id, node.kind, name, lexical.value, whiteSpace);
    built = processed.rows;

    return processed.value;
  };
  const kindIs = (element: Element, kind: NodeKindHandle): string | undefined => {
    const node = nodes.get(element);

    return node?.kind === kind ? node.id : undefined;
  };

  const documents: ManifestDocument[] = [];
  const { root } = doc;

  const metadataRows = (metadata: Element): void => {
    const metadataId = kindIs(metadata, "cp:metadata.manifest");
    if (metadataId === undefined) {
      return;
    }

    add(ManifestMetadata, [{ id: metadataId, manifest: packageId }]);
    for (const leaf of childrenNamed(metadata, "schema")) {
      const id = kindIs(leaf, "cp:schema");
      if (id !== undefined) {
        add(ManifestSchema, [{ id, metadata: metadataId, value: textOf(leaf) }]);
      }
    }

    for (const leaf of childrenNamed(metadata, "schemaversion")) {
      const id = kindIs(leaf, "cp:schemaversion");
      const value = textOf(leaf);
      if (id !== undefined && isSchemaVersion(value)) {
        add(ManifestSchemaVersion, [{ id, metadata: metadataId, value }]);
      }
    }
  };

  const resourceRows = (resource: Element): void => {
    const node = nodes.get(resource);
    if (node === undefined) {
      return;
    }

    const identifier = typed(resource, "identifier", "collapse");
    const type = typed(resource, "type", "preserve");
    add(Resource, [{ id: node.id, identifier, package: packageId, type, version }]);

    if (Option.isSome(attributeOf(resource, "href"))) {
      const href = typed(resource, "href", "collapse");
      add(ResourceHref, [{ href, package: packageId, resource: node.id }]);
      if (qtiDocumentType.test(type)) {
        documents.push({ path: href, resource: identifier, resourceId: node.id, type });
      }
    }

    for (const metadata of childrenNamed(resource, "metadata")) {
      const id = kindIs(metadata, "cp:metadata.resource");
      if (id !== undefined) {
        add(ResourceMetadata, [{ id, resource: node.id }]);
      }
    }

    for (const [position, file] of childrenNamed(resource, "file").entries()) {
      const id = kindIs(file, "cp:file");
      if (id !== undefined) {
        add(File, [
          {
            href: typed(file, "href", "collapse"),
            id,
            package: packageId,
            position: BigInt(position),
            resource: node.id,
          },
        ]);
      }
    }

    for (const dependency of childrenNamed(resource, "dependency")) {
      const id = kindIs(dependency, "cp:dependency");
      if (id !== undefined) {
        add(Dependency, [
          {
            id,
            package: packageId,
            resource: identifier,
            target: typed(dependency, "identifierref", "collapse"),
          },
        ]);
      }
    }
  };

  add(Package, [
    { id: packageId, identifier: typed(root, "identifier", "collapse"), schemaversion: version },
  ]);
  add(Manifest, [{ id: packageId }]);

  for (const metadata of childrenNamed(root, "metadata")) {
    metadataRows(metadata);
  }

  for (const organizations of childrenNamed(root, "organizations")) {
    const id = kindIs(organizations, "cp:organizations");
    if (id !== undefined) {
      add(Organizations, [{ id, manifest: packageId }]);
    }
  }

  for (const resources of childrenNamed(root, "resources")) {
    const id = kindIs(resources, "cp:resources");
    if (id !== undefined) {
      add(Resources, [{ id, manifest: packageId }]);
    }

    for (const resource of childrenNamed(resources, "resource")) {
      resourceRows(resource);
    }
  }

  add(
    PackageEntry,
    entries.map(({ kind, path }) => ({ kind, package: packageId, path })),
  );

  const claimed = new Set(documents.map((document) => document.path));
  const unclaimed = entries.filter((entry) => entry.kind === "file" && !claimed.has(entry.path));
  const contents = yield* Effect.forEach(
    unclaimed,
    (entry) =>
      readEntry(dir, entry.path).pipe(
        Effect.catchTag("PackageReadError", Effect.die),
        Effect.map((bytes) => ({
          byteLength: BigInt(bytes.length),
          content: Buffer.from(bytes).toString("base64"),
          mimeType: mimeTypeOf(entry.path),
          package: packageId,
          path: entry.path,
        })),
      ),
    { concurrency: 4 },
  );

  add(FileContent, contents);

  return { documents, nodes, packageId, rows: built, version };
});
