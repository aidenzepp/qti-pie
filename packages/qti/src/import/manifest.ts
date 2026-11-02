/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The importer's reading of a package's manifest: the rows of its structure (the package, its
 * resources with their files and dependencies, the entries the package holds and the bytes of the
 * ones no QTI document claims) and the refusal of a package that is not QTI 3.
 *
 * The manifest is a tree, so {@link treeRows} writes its nodes; this module writes the arm rows on
 * top of the node index it returns, the LOM and QTI-metadata rows among them. The manifest guards
 * belong to another module.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option, Schema } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { collapse, replace, Rows, treeRows, typedAttribute } from "#qti/import/tree.ts";
import type { NodeIndex, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { readEntry } from "#qti/package/read.ts";
import type { Entry, PackageReadError } from "#qti/package/read.ts";
import type { ZipRefusal } from "#qti/package/zip.ts";
import * as md from "#qti/schema/metadata.ts";
import { Edge } from "#qti/schema/node.ts";
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
 * The element children of `element`, whatever their namespace.
 */
const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * The character content of a leaf as read: its `text`, `ws` and `entityRef` children joined, an
 * entity reference by its lexical form `&name;`; comments, processing instructions and elements
 * contribute nothing.
 */
const contentOf = (element: Element): string =>
  element.children
    .map((child) => {
      if (child.kind === "text") {
        return child.value;
      }

      return child.kind === "entityRef" ? `&${child.name};` : "";
    })
    .join("");

/**
 * A leaf's content under its class: as read, with tab, line feed and carriage return turned to
 * spaces, or collapsed.
 */
const classed = (value: string, whiteSpace: "collapse" | "preserve" | "replace"): string => {
  if (whiteSpace === "collapse") {
    return collapse(value);
  }

  return whiteSpace === "replace" ? replace(value) : value;
};

/**
 * The `qmd:` leaves of a QTI metadata record, each with its arm and the whitespace class of its
 * content: the four booleans collapse, the enumerations and tool strings are kept as read.
 */
const qmdLeaves = {
  "qmd:composite": { arm: md.QmdComposite, class: "collapse" },
  "qmd:feedbackType": { arm: md.QmdFeedbackType, class: "preserve" },
  "qmd:interactionType": { arm: md.QmdInteractionType, class: "preserve" },
  "qmd:itemTemplate": { arm: md.QmdItemTemplate, class: "collapse" },
  "qmd:scoringMode": { arm: md.QmdScoringMode, class: "preserve" },
  "qmd:solutionAvailable": { arm: md.QmdSolutionAvailable, class: "collapse" },
  "qmd:timeDependent": { arm: md.QmdTimeDependent, class: "collapse" },
  "qmd:toolName": { arm: md.QmdToolName, class: "preserve" },
  "qmd:toolVendor": { arm: md.QmdToolVendor, class: "preserve" },
  "qmd:toolVersion": { arm: md.QmdToolVersion, class: "preserve" },
} as const;

/**
 * Whether `kind` is one of {@link qmdLeaves}.
 */
const isQmdLeaf = (kind: string): kind is keyof typeof qmdLeaves => kind in qmdLeaves;

/**
 * The resource-level facts the record of an item resource is bound to.
 */
interface LomResource {
  readonly identifier: string;
  readonly node: string;
  readonly type: string;
}

/**
 * What the walk of one `lom:lom` collects for the object identifier and title rows: the entries
 * of the general category's identifiers and the strings under its titles, in document order, and
 * whether the record holds any identifier or title at all.
 */
interface LomFindings {
  readonly entries: { collapsed: string; position: bigint }[];
  hasIdentifier: boolean;
  hasTitle: boolean;
  readonly titles: { collapsed: string; position: bigint }[];
}

/**
 * The type of the resource whose record holds exactly one object identifier and one object title.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * The facts of one element of a `lom:lom` subtree a kind's arm copies.
 */
interface LomContext {
  readonly collapsed: string;
  readonly element: Element;
  readonly findings: LomFindings;
  readonly grandparentKind: NodeKindHandle | undefined;
  readonly id: string;
  readonly lom: string;
  readonly owner: "manifest" | "resource";
  readonly parent: string;
  readonly parentKind: NodeKindHandle | undefined;
  readonly parentPosition: bigint;
  readonly position: bigint;
  readonly value: string;
}

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
    .flatMap((container) => childrenNamed(container, "schemaversion"))
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
 * names. A `file`'s position is its element's `Edge` position under the resource, every child
 * counted.
 *
 * @param dir - The package directory, where the bytes of unclaimed files are read.
 * @param entries - The package's entries, as `listPackage` returns them.
 * @param doc - The manifest as the reader gave it.
 * @param rows - The rows so far.
 * @returns The rows with the manifest's added, the node index, the package id, the version and one
 *   document per resource of a QTI type that has an `href`; `NotQti3` for a manifest that is not
 *   QTI 3, `UnmodeledVocabulary` for an element or attribute no registry names, and
 *   `PackageReadError` for an entry that is not a regular file inside the package.
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
  NotQti3 | PackageReadError | UnmodeledVocabulary | PlatformError.PlatformError | ZipRefusal,
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
  const positions = new Map(Rows.of(built, Edge).map((edge) => [edge.child, edge.position]));

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

  const lomArms: Partial<Record<NodeKindHandle, (c: LomContext) => void>> = {
    "lom:aggregationLevel": (c) => {
      add(md.LomAggregationLevel, [{ id: c.id, lom: c.lom }]);
    },
    "lom:catalog": (c) => {
      add(md.LomIdentifierCatalog, [
        {
          collapsed: c.collapsed,
          id: c.id,
          identifier: c.parent,
          lom: c.lom,
          owner: c.owner,
          position: c.parentPosition,
          value: c.value,
        },
      ]);
    },
    "lom:contribute": (c) => {
      add(md.LomContribute, [{ id: c.id, lom: c.lom, parent: c.parent, position: c.position }]);
    },
    "lom:copyrightAndOtherRestrictions": (c) => {
      add(md.LomCopyrightAndOtherRestrictions, [{ id: c.id, lom: c.lom, rights: c.parent }]);
    },
    "lom:cost": (c) => {
      add(md.LomCost, [{ id: c.id, lom: c.lom, rights: c.parent }]);
    },
    "lom:coverage": (c) => {
      add(md.LomCoverage, [{ id: c.id, lom: c.lom }]);
    },
    "lom:date": (c) => {
      add(md.LomDate, [{ contribute: c.parent, id: c.id, lom: c.lom }]);
    },
    "lom:dateTime": (c) => {
      add(md.LomDateTime, [
        { collapsed: c.collapsed, date: c.parent, id: c.id, lom: c.lom, value: c.value },
      ]);
    },
    "lom:description": (c) => {
      add(md.LomDescription, [{ id: c.id, lom: c.lom }]);
    },
    "lom:duration": (c) => {
      add(md.LomDuration, [{ id: c.id, lom: c.lom, technical: c.parent }]);
    },
    "lom:duration.string": (c) => {
      add(md.LomDurationString, [
        { collapsed: c.collapsed, duration: c.parent, id: c.id, lom: c.lom, value: c.value },
      ]);
    },
    "lom:entity": (c) => {
      add(md.LomEntity, [
        {
          collapsed: c.collapsed,
          contribute: c.parent,
          id: c.id,
          lom: c.lom,
          position: c.position,
          value: c.value,
        },
      ]);
    },
    "lom:entry": (c) => {
      add(md.LomIdentifierEntry, [
        {
          collapsed: c.collapsed,
          id: c.id,
          identifier: c.parent,
          lom: c.lom,
          owner: c.owner,
          position: c.parentPosition,
          value: c.value,
        },
      ]);
      if (c.grandparentKind === "lom:general") {
        c.findings.entries.push({ collapsed: c.collapsed, position: c.parentPosition });
      }
    },
    "lom:format": (c) => {
      add(md.LomFormat, [
        {
          collapsed: c.collapsed,
          id: c.id,
          lom: c.lom,
          position: c.position,
          technical: c.parent,
          value: c.value,
        },
      ]);
    },
    "lom:general": (c) => {
      add(md.LomGeneral, [{ id: c.id, lom: c.lom }]);
    },
    "lom:identifier": (c) => {
      add(md.LomIdentifier, [{ id: c.id, lom: c.lom, owner: c.owner, position: c.position }]);
      c.findings.hasIdentifier = true;
    },
    "lom:installationRemarks": (c) => {
      add(md.LomInstallationRemarks, [{ id: c.id, lom: c.lom, technical: c.parent }]);
    },
    "lom:keyword": (c) => {
      add(md.LomKeyword, [{ id: c.id, lom: c.lom }]);
    },
    "lom:language": (c) => {
      add(md.LomLanguage, [{ id: c.id, lom: c.lom, position: c.position, value: c.value }]);
    },
    "lom:lifeCycle": (c) => {
      add(md.LomLifeCycle, [{ id: c.id, lom: c.lom }]);
    },
    "lom:location": (c) => {
      add(md.LomLocation, [
        {
          collapsed: c.collapsed,
          id: c.id,
          lom: c.lom,
          position: c.position,
          technical: c.parent,
          value: c.value,
        },
      ]);
    },
    "lom:maximumVersion": (c) => {
      add(md.LomMaximumVersion, [
        { collapsed: c.collapsed, id: c.id, lom: c.lom, orComposite: c.parent, value: c.value },
      ]);
    },
    "lom:metaMetadata": (c) => {
      add(md.LomMetaMetadata, [{ id: c.id, lom: c.lom }]);
    },
    "lom:metadataschema": (c) => {
      add(md.LomMetadataschema, [
        {
          collapsed: c.collapsed,
          id: c.id,
          lom: c.lom,
          metaMetadata: c.parent,
          position: c.position,
          value: c.value,
        },
      ]);
    },
    "lom:minimumVersion": (c) => {
      add(md.LomMinimumVersion, [
        { collapsed: c.collapsed, id: c.id, lom: c.lom, orComposite: c.parent, value: c.value },
      ]);
    },
    "lom:name": (c) => {
      add(md.LomName, [{ id: c.id, lom: c.lom, orComposite: c.parent }]);
    },
    "lom:orComposite": (c) => {
      add(md.LomOrComposite, [
        { id: c.id, lom: c.lom, position: c.position, requirement: c.parent },
      ]);
    },
    "lom:otherPlatformRequirements": (c) => {
      add(md.LomOtherPlatformRequirements, [{ id: c.id, lom: c.lom, technical: c.parent }]);
    },
    "lom:requirement": (c) => {
      add(md.LomRequirement, [{ id: c.id, lom: c.lom, position: c.position, technical: c.parent }]);
    },
    "lom:rights": (c) => {
      add(md.LomRights, [{ id: c.id, lom: c.lom }]);
    },
    "lom:role": (c) => {
      add(md.LomRole, [{ contribute: c.parent, id: c.id, lom: c.lom }]);
    },
    "lom:size": (c) => {
      add(md.LomSize, [
        { collapsed: c.collapsed, id: c.id, lom: c.lom, technical: c.parent, value: c.value },
      ]);
    },
    "lom:source": (c) => {
      add(md.LomSource, [{ collapsed: c.collapsed, id: c.id, value: c.value }]);
    },
    "lom:status": (c) => {
      add(md.LomStatus, [{ id: c.id, lifeCycle: c.parent, lom: c.lom }]);
    },
    "lom:string": (c) => {
      add(md.LomString, [{ collapsed: c.collapsed, id: c.id, value: c.value }]);
      if (c.parentKind === "lom:title") {
        add(md.LomTitle, [
          {
            collapsed: c.collapsed,
            id: c.id,
            lom: c.lom,
            owner: c.owner,
            position: c.position,
            value: c.value,
          },
        ]);
        if (c.grandparentKind === "lom:general") {
          c.findings.titles.push({ collapsed: c.collapsed, position: c.position });
        }
      }

      if (Option.isSome(attributeOf(c.element, "language"))) {
        add(md.LomStringLanguage, [
          { node: c.id, value: typed(c.element, "language", "preserve") },
        ]);
      }
    },
    "lom:structure": (c) => {
      add(md.LomStructure, [{ id: c.id, lom: c.lom }]);
    },
    "lom:technical": (c) => {
      add(md.LomTechnical, [{ id: c.id, lom: c.lom }]);
    },
    "lom:title": (c) => {
      add(md.LomGeneralTitle, [{ id: c.id, lom: c.lom, owner: c.owner }]);
      c.findings.hasTitle = true;
    },
    "lom:type": (c) => {
      add(md.LomType, [{ id: c.id, lom: c.lom, orComposite: c.parent }]);
    },
    "lom:value": (c) => {
      add(md.LomValue, [{ collapsed: c.collapsed, id: c.id, value: c.value }]);
    },
    "lom:version": (c) => {
      add(md.LomVersion, [{ id: c.id, lifeCycle: c.parent, lom: c.lom }]);
    },
  };

  const lomSubtree = (
    element: Element,
    above: {
      readonly grandparentKind: NodeKindHandle | undefined;
      readonly id: string;
      readonly kind: NodeKindHandle;
      readonly position: bigint;
    },
    shared: Pick<LomContext, "findings" | "lom" | "owner">,
  ): void => {
    for (const child of elementChildren(element)) {
      const node = nodes.get(child);
      const position = node === undefined ? undefined : positions.get(node.id);
      if (node === undefined || position === undefined) {
        continue;
      }

      const value = contentOf(child);
      lomArms[node.kind]?.({
        ...shared,
        collapsed: collapse(value),
        element: child,
        grandparentKind: above.grandparentKind,
        id: node.id,
        parent: above.id,
        parentKind: above.kind,
        parentPosition: above.position,
        position,
        value,
      });
      lomSubtree(
        child,
        { grandparentKind: above.kind, id: node.id, kind: node.kind, position },
        shared,
      );
    }
  };

  /**
   * Write the rows of one `lom:lom` under a `cp:metadata` node: its `Lom` row and owner arm, one
   * arm row per element of its subtree and, for a resource's record, the object identifier and
   * title rows.
   */
  const lomRows = (
    lom: Element,
    metadataNode: { readonly id: string; readonly kind: NodeKindHandle },
    resource: LomResource | null,
  ): void => {
    const node = nodes.get(lom);
    if (node === undefined) {
      return;
    }

    const findings: LomFindings = {
      entries: [],
      hasIdentifier: false,
      hasTitle: false,
      titles: [],
    };
    if (resource === null) {
      add(md.Lom, [{ id: node.id, owner: "manifest", package: packageId }]);
      add(md.ManifestLom, [{ lom: node.id, metadata: metadataNode.id, package: packageId }]);
    } else {
      add(md.Lom, [{ id: node.id, owner: "resource", package: packageId }]);
      add(md.ResourceLom, [
        {
          lom: node.id,
          metadata: metadataNode.id,
          package: packageId,
          resource: resource.identifier,
          type: resource.type,
        },
      ]);
    }

    lomSubtree(
      lom,
      {
        grandparentKind: undefined,
        id: node.id,
        kind: node.kind,
        position: positions.get(node.id) ?? 0n,
      },
      { findings, lom: node.id, owner: resource === null ? "manifest" : "resource" },
    );

    if (resource === null) {
      return;
    }

    const bound = {
      lom: node.id,
      package: packageId,
      resource: resource.identifier,
      type: resource.type,
    };
    if (findings.hasIdentifier) {
      add(md.ResourceLomIdentified, [bound]);
    }

    if (findings.hasTitle) {
      add(md.ResourceLomTitled, [bound]);
    }

    if (resource.type !== itemType) {
      return;
    }

    // The item's own title is not known until its document is read, so the first string stands for it.
    const entry =
      findings.entries.find((found) => found.collapsed === resource.identifier) ??
      findings.entries[0];
    if (entry !== undefined) {
      add(md.LomObjectIdentifier, [{ ...bound, ...entry }]);
    }

    const [title] = findings.titles;
    if (title !== undefined) {
      add(md.LomObjectTitle, [{ ...bound, ...title }]);
    }
  };

  /**
   * Write the rows of one `qmd:qtiMetadata` of a resource: its record and one arm row per leaf.
   */
  const qmdRows = (qmd: Element, metadataId: string, resource: LomResource): void => {
    const node = nodes.get(qmd);
    if (node === undefined) {
      return;
    }

    add(md.QtiMetadata, [{ id: node.id, metadata: metadataId, resource: resource.node }]);
    for (const leaf of elementChildren(qmd)) {
      const found = nodes.get(leaf);
      if (found === undefined) {
        continue;
      }

      const content = contentOf(leaf);
      if (found.kind === "qmd:portableCustomInteractionContext") {
        add(md.QmdPortableCustomInteractionContext, [{ id: found.id, qtiMetadata: node.id }]);
        for (const part of elementChildren(leaf)) {
          const partNode = nodes.get(part);
          const value = replace(contentOf(part));
          if (partNode?.kind === "qmd:customTypeIdentifier") {
            add(md.QmdCustomTypeIdentifier, [{ context: found.id, id: partNode.id, value }]);
          } else if (partNode?.kind === "qmd:interactionKind") {
            add(md.QmdInteractionKind, [{ context: found.id, id: partNode.id, value }]);
          }
        }
      } else if (isQmdLeaf(found.kind)) {
        const spec = qmdLeaves[found.kind];
        const value = classed(content, spec.class);
        // SAFETY: the leaf's column pattern judges the value at commit, which is the importer's refusal for it.
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
        add(spec.arm, [{ id: found.id, qtiMetadata: node.id, value }] as never);
      }
    }
  };

  const metadataChildren = (
    parent: Element,
    metadataNode: { readonly id: string; readonly kind: NodeKindHandle },
    resource: LomResource | null,
  ): void => {
    for (const child of elementChildren(parent)) {
      const kind = nodes.get(child)?.kind;
      if (kind === "lom:lom") {
        lomRows(child, metadataNode, resource);
      } else if (kind === "qmd:qtiMetadata" && resource !== null) {
        qmdRows(child, metadataNode.id, resource);
      }
    }
  };

  const metadataRows = (metadataElement: Element): void => {
    const metadataId = kindIs(metadataElement, "cp:metadata.manifest");
    if (metadataId === undefined) {
      return;
    }

    add(ManifestMetadata, [{ id: metadataId, manifest: packageId }]);
    for (const leaf of childrenNamed(metadataElement, "schema")) {
      const id = kindIs(leaf, "cp:schema");
      if (id !== undefined) {
        add(ManifestSchema, [{ id, metadata: metadataId, value: textOf(leaf) }]);
      }
    }

    for (const leaf of childrenNamed(metadataElement, "schemaversion")) {
      const id = kindIs(leaf, "cp:schemaversion");
      const value = textOf(leaf);
      if (id !== undefined && isSchemaVersion(value)) {
        add(ManifestSchemaVersion, [{ id, metadata: metadataId, value }]);
      }
    }

    metadataChildren(metadataElement, { id: metadataId, kind: "cp:metadata.manifest" }, null);
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

    for (const metadataElement of childrenNamed(resource, "metadata")) {
      const id = kindIs(metadataElement, "cp:metadata.resource");
      if (id !== undefined) {
        add(ResourceMetadata, [{ id, resource: node.id }]);
        metadataChildren(
          metadataElement,
          { id, kind: "cp:metadata.resource" },
          { identifier, node: node.id, type },
        );
      }
    }

    for (const file of childrenNamed(resource, "file")) {
      const id = kindIs(file, "cp:file");
      const position = id === undefined ? undefined : positions.get(id);
      if (id !== undefined && position !== undefined) {
        add(File, [
          {
            href: typed(file, "href", "collapse"),
            id,
            package: packageId,
            position,
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

  for (const metadataElement of childrenNamed(root, "metadata")) {
    metadataRows(metadataElement);
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
