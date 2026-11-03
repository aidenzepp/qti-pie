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
import { attributeRows } from "#qti/import/attributes.ts";
import { collapse, replace, Rows, treeRows, typedAttribute } from "#qti/import/tree.ts";
import type { NodeIndex, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { classed, contentOf, elementChildren, qmdLeafRows } from "#qti/import/leaf.ts";
import type { ImportRefused } from "#qti/import/refusal.ts";
import { recordFile, recordTypes, soleFileTypes } from "#qti/import/record.ts";
import type { ExternalRefusal } from "#qti/import/record.ts";
import { readEntry } from "#qti/package/read.ts";
import type { Entry, PackageReadError } from "#qti/package/read.ts";
import type { ZipRefusal } from "#qti/package/zip.ts";
import * as csm from "#qti/schema/csm.ts";
import { ResourceLomGeneral, ResourceLomLanguageSet } from "#qti/schema/lang.ts";
import * as md from "#qti/schema/metadata.ts";
import { Edge } from "#qti/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle, SchemaVersionHandle } from "#qti/schema/node.ts";
import {
  AccessForAllResource,
  Dependency,
  DrdAccessMode,
  DrdAccessModeAdapted,
  DrdAdaptationDetail,
  DrdAdaptationMediaType,
  DrdAdaptationType,
  DrdApiInteroperable,
  DrdAtInteroperable,
  DrdControlFlexibility,
  DrdDisplayTransformability,
  DrdEducationalComplexityOfAdaptation,
  DrdEducationalLevelOfAdaptation,
  DrdHasAdaptation,
  DrdHazard,
  DrdIsAdaptationOf,
  DrdIsFullAdaptationOf,
  DrdIsPartialAdaptationOf,
  DrdLanguageOfAdaptation,
  File,
  FileContent,
  FileMetadata,
  Manifest,
  ManifestId,
  ManifestIdOfManifest,
  ManifestIdOfResource,
  ManifestIdOfVariant,
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
  Variant,
  VariantMetadata,
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
 * The resource types that name a QTI document: `imsqti_<kind>_xmlv3p0`, except
 * `imsqti_fragment_xmlv3p0`, whose file is stored as bytes until M4 reads fragments.
 */
const qtiDocumentType = /^imsqti_(?!fragment_).+_xmlv3p0$/u;

/**
 * The schema versions this importer reads.
 */
const isSchemaVersion = (value: string): value is SchemaVersionHandle =>
  value === "3.0.0" || value === "3.0.1";

/**
 * The 17 `drd:` leaves of a digital resource description, each with its arm and the whitespace
 * class of its content: the enumerations, tool strings and unions are kept as read, the boolean and
 * the four URIs collapse, and the two normalized strings replace.
 */
const drdLeaves = {
  "drd:accessMode": { arm: DrdAccessMode, class: "preserve" },
  "drd:accessModeAdapted": { arm: DrdAccessModeAdapted, class: "preserve" },
  "drd:adaptationDetail": { arm: DrdAdaptationDetail, class: "preserve" },
  "drd:adaptationMediaType": { arm: DrdAdaptationMediaType, class: "preserve" },
  "drd:adaptationType": { arm: DrdAdaptationType, class: "preserve" },
  "drd:apiInteroperable": { arm: DrdApiInteroperable, class: "preserve" },
  "drd:atInteroperable": { arm: DrdAtInteroperable, class: "collapse" },
  "drd:controlFlexibility": { arm: DrdControlFlexibility, class: "preserve" },
  "drd:displayTransformability": { arm: DrdDisplayTransformability, class: "preserve" },
  "drd:educationalComplexityOfAdaptation": {
    arm: DrdEducationalComplexityOfAdaptation,
    class: "preserve",
  },
  "drd:educationalLevelOfAdaptation": { arm: DrdEducationalLevelOfAdaptation, class: "replace" },
  "drd:hasAdaptation": { arm: DrdHasAdaptation, class: "collapse" },
  "drd:hazard": { arm: DrdHazard, class: "preserve" },
  "drd:isAdaptationOf": { arm: DrdIsAdaptationOf, class: "collapse" },
  "drd:isFullAdaptationOf": { arm: DrdIsFullAdaptationOf, class: "collapse" },
  "drd:isPartialAdaptationOf": { arm: DrdIsPartialAdaptationOf, class: "collapse" },
  "drd:languageOfAdaptation": { arm: DrdLanguageOfAdaptation, class: "replace" },
} as const;

/**
 * Whether `kind` is one of {@link drdLeaves}.
 */
const isDrdLeaf = (kind: string): kind is keyof typeof drdLeaves => kind in drdLeaves;

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
  readonly entries: { collapsed: string; identifier: string; position: bigint }[];
  hasGeneral: boolean;
  hasIdentifier: boolean;
  hasTitle: boolean;
  readonly languages: Set<string>;
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
  readonly owner: "external" | "file" | "manifest" | "resource";
  readonly parent: string;
  readonly parentKind: NodeKindHandle;
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
 * The one file a resource with no `href` is read from as a document: its only file, when its type
 * is a usage-data, outcome or response-processing type and it has no `href`. A record of metadata
 * is not named here, because {@link recordFile} owns that rule, several files included.
 */
const soleFileDocument = (
  resource: Element,
  type: string,
  fileHrefs: readonly string[],
): string | undefined => {
  const [only, ...rest] = fileHrefs;
  const named = type === "qtiusagedata/xml" || soleFileTypes.has(type);

  return named && rest.length === 0 && Option.isNone(attributeOf(resource, "href"))
    ? only
    : undefined;
};

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
 * An element's attribute processed under its class by {@link typedAttribute}: the typed value, with
 * the lexical form kept in the rows where processing changed it, or the empty string and no change
 * when the element has no node or no such attribute.
 */
const typedValue = (
  rows: Rows,
  nodes: NodeIndex,
  element: Element,
  name: AttributeNameHandle,
  whiteSpace: "collapse" | "preserve",
) => {
  const node = nodes.get(element);
  const lexical = attributeOf(element, name);
  if (node === undefined || Option.isNone(lexical)) {
    return { rows, value: "" };
  }

  return typedAttribute(rows, node.id, node.kind, name, lexical.value, whiteSpace);
};

/**
 * The element a walk of a `lom:lom` subtree stands under: its node id and kind, its position
 * under its own parent and its parent's kind.
 */
export interface LomAbove {
  readonly grandparentKind: NodeKindHandle | undefined;
  readonly id: string;
  readonly kind: NodeKindHandle;
  readonly position: bigint;
}

/**
 * Write the arm rows of one `lom:lom` element's subtree: one row per element the kind has an arm
 * for, each copying its record's id and owner. The `Lom` row and its owner arm are the caller's.
 *
 * @param rows - The rows so far.
 * @param index - The node of every element, and each node's `Edge` position under its parent.
 * @param root - The `lom:lom` element, or the element whose children are walked.
 * @param start - The element's own node, kind and position.
 * @param record - The record's id and owner, and the findings the walk adds to.
 * @returns The rows with the subtree's arm rows added.
 */
export const lomSubtreeRows = (
  rows: Rows,
  index: { readonly nodes: NodeIndex; readonly positions: ReadonlyMap<string, bigint> },
  root: Element,
  start: LomAbove,
  record: Pick<LomContext, "findings" | "lom" | "owner">,
): Rows => {
  const { nodes, positions } = index;
  let built = rows;
  const add = <R extends AnyRelation>(relation: R, facts: readonly Fact<R>[]): void => {
    built = Rows.add(built, relation, facts);
  };
  const typed = (
    element: Element,
    name: AttributeNameHandle,
    whiteSpace: "preserve" | "collapse",
  ): string => {
    const processed = typedValue(built, nodes, element, name, whiteSpace);
    built = processed.rows;

    return processed.value;
  };

  const lomArms: Partial<Record<NodeKindHandle, (c: LomContext) => void>> = {
    "lom:aggregationLevel": (c) => {
      add(md.LomAggregationLevel, [{ id: c.id, lom: c.lom }]);
    },
    "lom:annotation": (c) => {
      add(md.LomAnnotation, [{ id: c.id, lom: c.lom }]);
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
    "lom:classification": (c) => {
      add(md.LomClassification, [{ id: c.id, lom: c.lom }]);
    },
    "lom:context": (c) => {
      add(md.LomContext, [{ id: c.id, lom: c.lom }]);
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
    "lom:difficulty": (c) => {
      add(md.LomDifficulty, [{ id: c.id, lom: c.lom }]);
    },
    "lom:duration": (c) => {
      add(md.LomDuration, [{ id: c.id, lom: c.lom, technical: c.parent }]);
    },
    "lom:duration.string": (c) => {
      add(md.LomDurationString, [
        { collapsed: c.collapsed, duration: c.parent, id: c.id, lom: c.lom, value: c.value },
      ]);
    },
    "lom:educational": (c) => {
      add(md.LomEducational, [{ id: c.id, lom: c.lom }]);
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
        c.findings.entries.push({
          collapsed: c.collapsed,
          identifier: c.parent,
          position: c.parentPosition,
        });
      }
    },
    "lom:entry.langString": (c) => {
      add(md.LomEntryLangString, [{ id: c.id, lom: c.lom }]);
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
      c.findings.hasGeneral = true;
    },
    "lom:id": (c) => {
      add(md.LomId, [{ collapsed: c.collapsed, id: c.id, value: c.value }]);
    },
    "lom:identifier": (c) => {
      add(md.LomIdentifier, [
        { id: c.id, lom: c.lom, owner: c.owner, parent: c.parent, position: c.position },
      ]);
      c.findings.hasIdentifier = true;
    },
    "lom:installationRemarks": (c) => {
      add(md.LomInstallationRemarks, [{ id: c.id, lom: c.lom, technical: c.parent }]);
    },
    "lom:intendedEndUserRole": (c) => {
      add(md.LomIntendedEndUserRole, [{ id: c.id, lom: c.lom }]);
    },
    "lom:interactivityLevel": (c) => {
      add(md.LomInteractivityLevel, [{ id: c.id, lom: c.lom }]);
    },
    "lom:interactivityType": (c) => {
      add(md.LomInteractivityType, [{ id: c.id, lom: c.lom }]);
    },
    "lom:keyword": (c) => {
      add(md.LomKeyword, [{ id: c.id, lom: c.lom }]);
    },
    "lom:kind": (c) => {
      add(md.LomKind, [{ id: c.id, lom: c.lom }]);
    },
    "lom:language": (c) => {
      add(md.LomLanguage, [
        {
          id: c.id,
          lom: c.lom,
          owner: c.owner,
          parentKind: c.parentKind,
          position: c.position,
          value: c.value,
        },
      ]);
      if (c.parentKind === "lom:general") {
        c.findings.languages.add(c.value);
      }
    },
    "lom:learningResourceType": (c) => {
      add(md.LomLearningResourceType, [{ id: c.id, lom: c.lom }]);
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
    "lom:purpose": (c) => {
      add(md.LomPurpose, [{ id: c.id, lom: c.lom }]);
    },
    "lom:relation": (c) => {
      add(md.LomRelation, [{ id: c.id, lom: c.lom }]);
    },
    "lom:requirement": (c) => {
      add(md.LomRequirement, [{ id: c.id, lom: c.lom, position: c.position, technical: c.parent }]);
    },
    "lom:resource": (c) => {
      add(md.LomResource, [{ id: c.id, lom: c.lom }]);
    },
    "lom:rights": (c) => {
      add(md.LomRights, [{ id: c.id, lom: c.lom }]);
    },
    "lom:role": (c) => {
      add(md.LomRole, [{ contribute: c.parent, id: c.id, lom: c.lom }]);
    },
    "lom:semanticDensity": (c) => {
      add(md.LomSemanticDensity, [{ id: c.id, lom: c.lom }]);
    },
    "lom:size": (c) => {
      add(md.LomSize, [
        { collapsed: c.collapsed, id: c.id, lom: c.lom, technical: c.parent, value: c.value },
      ]);
    },
    "lom:source": (c) => {
      add(md.LomSource, [{ collapsed: c.collapsed, id: c.id, value: c.value }]);
    },
    "lom:source.langString": (c) => {
      add(md.LomSourceLangString, [{ id: c.id, lom: c.lom }]);
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
    "lom:taxon": (c) => {
      add(md.LomTaxon, [{ id: c.id, lom: c.lom }]);
    },
    "lom:taxonPath": (c) => {
      add(md.LomTaxonPath, [{ id: c.id, lom: c.lom }]);
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
    "lom:typicalAgeRange": (c) => {
      add(md.LomTypicalAgeRange, [{ id: c.id, lom: c.lom }]);
    },
    "lom:typicalLearningTime": (c) => {
      add(md.LomTypicalLearningTime, [{ id: c.id, lom: c.lom }]);
    },
    "lom:value": (c) => {
      add(md.LomValue, [
        { collapsed: c.collapsed, id: c.id, parentKind: c.parentKind, value: c.value },
      ]);
    },
    "lom:version": (c) => {
      add(md.LomVersion, [{ id: c.id, lifeCycle: c.parent, lom: c.lom }]);
    },
  };

  const lomSubtree = (
    element: Element,
    above: LomAbove,
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

  lomSubtree(root, start, record);

  return built;
};

/**
 * Write the rows of one `csmd:curriculumStandardsMetadataSet` and everything beneath it: the set
 * under its host, its metadata, sets of GUIDs and labelled GUIDs, their label, GUID and case item
 * URI leaves, and each of the five attributes under the `replace` class of the spec's 3.9.
 *
 * @param rows - The rows so far.
 * @param nodes - The node of every element.
 * @param set - The set's element.
 * @param host - The id of the node the set sits under: a `cp:metadata` node of the manifest, a
 *   resource or a file, or a `lom:lom`.
 * @returns The rows with the set's added.
 */
export const csmSetRows = (rows: Rows, nodes: NodeIndex, set: Element, host: string): Rows => {
  let built = rows;
  const add = <R extends AnyRelation>(relation: R, facts: readonly Fact<R>[]): void => {
    built = Rows.add(built, relation, facts);
  };
  const attribute = (
    element: Element,
    name: AttributeNameHandle,
    relation:
      | typeof csm.CsmMetadataProviderId
      | typeof csm.CsmSetOfGuidsRegion
      | typeof csm.CsmSetOfGuidsVersion
      | typeof csm.CsmSetResourceLabel
      | typeof csm.CsmSetResourcePartId,
  ): void => {
    const node = nodes.get(element);
    const lexical = attributeOf(element, name);
    if (node === undefined || Option.isNone(lexical)) {
      return;
    }

    const processed = typedAttribute(built, node.id, node.kind, name, lexical.value, "replace");
    built = Rows.add(processed.rows, relation, [{ node: node.id, value: processed.value }]);
  };
  const leaves = (labelled: Element, labelledGuid: string): void => {
    for (const leaf of elementChildren(labelled)) {
      const node = nodes.get(leaf);
      if (node === undefined) {
        continue;
      }

      const content = contentOf(leaf);
      if (node.kind === "csmd:label") {
        add(csm.CsmLabel, [{ id: node.id, labelledGuid, value: replace(content) }]);
      } else if (node.kind === "csmd:GUID") {
        add(csm.CsmGuid, [{ id: node.id, labelledGuid, value: replace(content) }]);
      } else if (node.kind === "csmd:caseItemURI") {
        add(csm.CsmCaseItemUri, [{ id: node.id, labelledGuid, value: collapse(content) }]);
      }
    }
  };
  const nodeOf = (element: Element, kind: NodeKindHandle): string | undefined => {
    const node = nodes.get(element);

    return node?.kind === kind ? node.id : undefined;
  };

  const setId = nodeOf(set, "csmd:curriculumStandardsMetadataSet");
  if (setId === undefined) {
    return built;
  }

  add(csm.CsmSet, [{ host, id: setId }]);
  attribute(set, "resourceLabel", csm.CsmSetResourceLabel);
  attribute(set, "resourcePartId", csm.CsmSetResourcePartId);
  for (const metadata of elementChildren(set)) {
    const metadataId = nodeOf(metadata, "csmd:curriculumStandardsMetadata");
    if (metadataId === undefined) {
      continue;
    }

    add(csm.CsmMetadata, [{ id: metadataId, set: setId }]);
    attribute(metadata, "providerId", csm.CsmMetadataProviderId);
    for (const guids of elementChildren(metadata)) {
      const guidsId = nodeOf(guids, "csmd:setOfGUIDs");
      if (guidsId === undefined) {
        continue;
      }

      add(csm.CsmSetOfGuids, [{ id: guidsId, metadata: metadataId }]);
      attribute(guids, "region", csm.CsmSetOfGuidsRegion);
      attribute(guids, "version", csm.CsmSetOfGuidsVersion);
      for (const labelled of elementChildren(guids)) {
        const labelledId = nodeOf(labelled, "csmd:labelledGUID");
        if (labelledId !== undefined) {
          add(csm.CsmLabelledGuid, [{ id: labelledId, setOfGuids: guidsId }]);
          leaves(labelled, labelledId);
        }
      }
    }
  }

  return built;
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
 * `attributeRows` runs first on the rows `treeRows` wrote, since it reads the root kind from the
 * `Tree` row and fails without it: it writes the one family attribute a manifest registry lists,
 * `lom:string`'s `xml:lang`, and refuses an unregistered manifest attribute.
 *
 * @param dir - The package directory, where the bytes of unclaimed files are read.
 * @param entries - The package's entries, as `listPackage` returns them.
 * @param doc - The manifest as the reader gave it.
 * @param rows - The rows so far.
 * @returns The rows with the manifest's added, the node index, the package id, the version and one
 *   document per resource of a QTI, record or usage type that names one (its `href`, else its one
 *   file); `NotQti3` for a manifest that is not QTI 3, `ExternalRefusal` for a record resource with
 *   no `href` that does not list exactly one file, `UnmodeledVocabulary` for an element or
 *   attribute no registry names, and `PackageReadError` for an entry that is not a regular file
 *   inside the package.
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
  | ExternalRefusal
  | ImportRefused
  | NotQti3
  | PackageReadError
  | PlatformError.PlatformError
  | UnmodeledVocabulary
  | ZipRefusal,
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
  let built = yield* attributeRows(doc.root, nodes, packageId, tree.rows);
  const positions = new Map(Rows.of(built, Edge).map((edge) => [edge.child, edge.position]));

  const add = <R extends AnyRelation>(relation: R, facts: readonly Fact<R>[]): void => {
    built = Rows.add(built, relation, facts);
  };
  const typed = (
    element: Element,
    name: AttributeNameHandle,
    whiteSpace: "preserve" | "collapse",
  ): string => {
    const processed = typedValue(built, nodes, element, name, whiteSpace);
    built = processed.rows;

    return processed.value;
  };
  const kindIs = (element: Element, kind: NodeKindHandle): string | undefined => {
    const node = nodes.get(element);

    return node?.kind === kind ? node.id : undefined;
  };

  const documents: ManifestDocument[] = [];
  const { root } = doc;

  /**
   * Write the record of one `qmd:qtiMetadata` of a resource and its host arm. Its leaves' arm rows
   * are `qmdLeafRows`', written for every record of the manifest, hosted or not.
   */
  const qmdRows = (
    qmd: Element,
    host:
      | { readonly metadata: string; readonly tag: "metadata" }
      | { readonly lom: string; readonly tag: "resourceLom" },
    resource: LomResource,
  ): void => {
    const node = nodes.get(qmd);
    if (node === undefined) {
      return;
    }

    add(md.QtiMetadata, [
      { host: host.tag, id: node.id, package: packageId, resource: resource.identifier },
    ]);
    if (host.tag === "metadata") {
      add(md.QtiMetadataInMetadata, [
        {
          id: node.id,
          metadata: host.metadata,
          package: packageId,
          resource: resource.identifier,
          resourceNode: resource.node,
        },
      ]);
    } else {
      add(md.QtiMetadataInResourceLom, [
        {
          id: node.id,
          lom: host.lom,
          package: packageId,
          resource: resource.identifier,
        },
      ]);
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
      hasGeneral: false,
      hasIdentifier: false,
      hasTitle: false,
      languages: new Set(),
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

    built = lomSubtreeRows(
      built,
      { nodes, positions },
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

    for (const child of elementChildren(lom)) {
      if (nodes.get(child)?.kind === "qmd:qtiMetadata") {
        qmdRows(child, { lom: node.id, tag: "resourceLom" }, resource);
      }
    }

    const bound = {
      lom: node.id,
      package: packageId,
      resource: resource.identifier,
      type: resource.type,
    };
    if (findings.hasGeneral) {
      add(ResourceLomGeneral, [
        { lom: node.id, package: packageId, resource: resource.identifier },
      ]);
    }

    add(
      ResourceLomLanguageSet,
      [...findings.languages].map((value) => ({
        lom: node.id,
        package: packageId,
        resource: resource.identifier,
        value,
      })),
    );
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

  const metadataChildren = (
    parent: Element,
    metadataNode: { readonly id: string; readonly kind: NodeKindHandle },
    resource: LomResource | null,
  ): void => {
    for (const child of elementChildren(parent)) {
      const kind = nodes.get(child)?.kind;
      if (kind === "lom:lom") {
        lomRows(child, metadataNode, resource);
      } else if (kind === "csmd:curriculumStandardsMetadataSet") {
        built = csmSetRows(built, nodes, child, metadataNode.id);
      } else if (kind === "qmd:qtiMetadata" && resource !== null) {
        qmdRows(child, { metadata: metadataNode.id, tag: "metadata" }, resource);
      }
    }
  };

  /**
   * Write the rows of the `cp:metadata.file` of one `cp:file`: its record, each record of LOM the
   * metadata holds with its subtree, and each curriculum standards set. A file's records are
   * outside the object identifier and title rows of a resource's, and a `qtiMetadata` beside them
   * gets no record row, only its leaves' arms, so the database refuses it at commit.
   */
  const fileMetadataRows = (file: Element, fileId: string): void => {
    for (const metadataElement of childrenNamed(file, "metadata")) {
      const metadataId = kindIs(metadataElement, "cp:metadata.file");
      if (metadataId === undefined) {
        continue;
      }

      add(FileMetadata, [{ file: fileId, id: metadataId }]);
      for (const child of elementChildren(metadataElement)) {
        const node = nodes.get(child);
        if (node?.kind === "lom:lom") {
          add(md.Lom, [{ id: node.id, owner: "file", package: packageId }]);
          add(md.FileLom, [
            { file: fileId, lom: node.id, metadata: metadataId, package: packageId },
          ]);
          built = lomSubtreeRows(
            built,
            { nodes, positions },
            child,
            {
              grandparentKind: undefined,
              id: node.id,
              kind: node.kind,
              position: positions.get(node.id) ?? 0n,
            },
            {
              findings: {
                entries: [],
                hasGeneral: false,
                hasIdentifier: false,
                hasTitle: false,
                languages: new Set(),
                titles: [],
              },
              lom: node.id,
              owner: "file",
            },
          );
        } else if (node?.kind === "csmd:curriculumStandardsMetadataSet") {
          built = csmSetRows(built, nodes, child, metadataId);
        }
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
        add(ManifestSchemaVersion, [
          { id, metadata: metadataId, package: packageId, version: value },
        ]);
      }
    }

    metadataChildren(metadataElement, { id: metadataId, kind: "cp:metadata.manifest" }, null);
  };

  /**
   * Write the rows of one `cpx:variant` of a resource: the variant and its `ManifestId`, its
   * metadata, the access-for-all resource under it and one arm row per DRD leaf.
   */
  const variantRows = (
    variant: Element,
    id: string,
    resource: { readonly identifier: string; readonly node: string },
  ): void => {
    const identifier = typed(variant, "identifier", "collapse");
    add(Variant, [
      {
        id,
        identifier,
        identifierref: typed(variant, "identifierref", "collapse"),
        package: packageId,
        resource: resource.node,
        resourceIdentifier: resource.identifier,
      },
    ]);
    add(ManifestId, [{ holder: "variant", id: identifier, package: packageId }]);
    add(ManifestIdOfVariant, [{ id: identifier, package: packageId }]);

    for (const metadata of elementChildren(variant)) {
      const metadataId = kindIs(metadata, "cpx:metadata");
      if (metadataId === undefined) {
        continue;
      }

      add(VariantMetadata, [{ id: metadataId, variant: id }]);
      for (const description of elementChildren(metadata)) {
        const descriptionId = kindIs(description, "drd:accessForAllResource");
        if (descriptionId === undefined) {
          continue;
        }

        add(AccessForAllResource, [{ id: descriptionId, metadata: metadataId }]);
        for (const leaf of elementChildren(description)) {
          const found = nodes.get(leaf);
          if (found !== undefined && isDrdLeaf(found.kind)) {
            const spec = drdLeaves[found.kind];
            const value = classed(contentOf(leaf), spec.class);
            // SAFETY: the leaf's column pattern judges the value at commit, which is the importer's refusal for it.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
            add(spec.arm, [{ id: found.id, owner: descriptionId, value }] as never);
          }
        }
      }
    }
  };

  const hrefless: {
    readonly files: readonly string[];
    readonly identifier: string;
    readonly resourceId: string;
    readonly type: string;
  }[] = [];

  const resourceRows = (resource: Element): void => {
    const node = nodes.get(resource);
    if (node === undefined) {
      return;
    }

    const identifier = typed(resource, "identifier", "collapse");
    const type = typed(resource, "type", "preserve");
    add(Resource, [{ id: node.id, identifier, package: packageId, type, version }]);
    add(ManifestId, [{ holder: "resource", id: identifier, package: packageId }]);
    add(ManifestIdOfResource, [{ id: identifier, package: packageId }]);

    if (Option.isSome(attributeOf(resource, "href"))) {
      const href = typed(resource, "href", "collapse");
      add(ResourceHref, [{ href, package: packageId, resource: node.id }]);
      if (qtiDocumentType.test(type) || recordTypes.has(type)) {
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

    const fileHrefs: string[] = [];
    for (const file of childrenNamed(resource, "file")) {
      const id = kindIs(file, "cp:file");
      const position = id === undefined ? undefined : positions.get(id);
      if (id !== undefined && position !== undefined) {
        fileMetadataRows(file, id);

        const href = typed(file, "href", "collapse");
        fileHrefs.push(href);
        add(File, [
          {
            href,
            id,
            package: packageId,
            position,
            resource: node.id,
          },
        ]);
      }
    }

    if (type === "resourcemetadata/xml" && Option.isNone(attributeOf(resource, "href"))) {
      hrefless.push({ files: fileHrefs, identifier, resourceId: node.id, type });
    }

    const sole = soleFileDocument(resource, type, fileHrefs);
    if (sole !== undefined) {
      documents.push({ path: sole, resource: identifier, resourceId: node.id, type });
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

    for (const child of elementChildren(resource)) {
      const variant = nodes.get(child);
      if (variant?.kind === "cpx:variant") {
        variantRows(child, variant.id, { identifier, node: node.id });
      }
    }
  };

  const manifestIdentifier = typed(root, "identifier", "collapse");
  add(Package, [{ id: packageId, identifier: manifestIdentifier, schemaversion: version }]);
  add(ManifestId, [{ holder: "manifest", id: manifestIdentifier, package: packageId }]);
  add(ManifestIdOfManifest, [{ id: manifestIdentifier, package: packageId }]);
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

  for (const [element, found] of nodes) {
    if (found.kind === "qmd:qtiMetadata") {
      built = qmdLeafRows(built, nodes, element, found.id);
    }
  }

  add(
    PackageEntry,
    entries.map(({ kind, path }) => ({ kind, package: packageId, path })),
  );

  for (const record of hrefless) {
    const path = yield* recordFile({ files: record.files, href: Option.none() });
    documents.push({
      path,
      resource: record.identifier,
      resourceId: record.resourceId,
      type: record.type,
    });
  }

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
