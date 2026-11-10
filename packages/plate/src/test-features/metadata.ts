/**
 * Resource metadata (P-6, P-7, M-1 to M-10), read by issue m3f-04: `openPackage` gives each
 * `PackageResource` its {@link ResourceMetadata} through {@link resourceMetadataOf}, the LOM
 * `general` categories and the QTI metadata the resource's manifest entry writes, as typed
 * read-only data a host shows or filters on. Plate interprets none of it: no value chooses a
 * variant, launches a tool, changes scoring or refuses a package.
 *
 * `PackageResource.metadata` is per resource, so the manifest's own metadata (P-5), a `file`'s and
 * the curriculum standards sets are not read here. Reading never refuses a package and never
 * throws: a flag or an enumerated value outside its type reads as not written
 * ({@link QtiMetadata}).
 *
 * @module
 */
import { Option } from "effect";
import { walk } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { textOf, xsBooleanOf } from "#plate/model/attributes.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
import type { LomGeneral, ManifestResource } from "#plate/package/manifest.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

/**
 * What `openPackage` hands {@link resourceMetadataOf} for one resource (P-6, P-7, issue m3f-04):
 * its manifest entry, the LOM generals the manifest reader read of it, and the manifest's
 * document, so {@link resourceMetadataOf} reaches whatever else the entry writes.
 */
export interface MetadataContext {
  readonly lom: readonly LomGeneral[];
  readonly manifest: SourceDocument;
  readonly resource: ManifestResource;
}

/**
 * The QTI metadata one `qtiMetadata` element writes (P-7, issue m3f-04), each value as the element
 * writes it and none interpreted.
 *
 * A value the element does not write is none, or empty for the two that repeat. Element text is
 * read with its outer XML whitespace removed (reading 7), so the padded ` true ` of a flag is true
 * and a tool's name keeps only its inner spacing. An element its schema allows once and the entry
 * repeats gives its first.
 *
 * The package reader checks which elements `qtiMetadata` holds but passes their text unchecked
 * (`checkStructure`, `#plate/validate/structure.ts`, simple types in lax wildcard content), so a
 * flag outside `xs:boolean`'s lexical space, a `feedbackType` outside its three values and a
 * `scoringMode` outside its three read as not written, and an `interactionType` and a tool's string
 * are kept as written, never checked against their enumeration or length.
 */
export interface QtiMetadata {
  /**
   * Whether the entry marks its object composite (M-3).
   */
  readonly composite: Option.Option<boolean>;
  /**
   * The feedback type the entry writes (M-5).
   */
  readonly feedbackType: Option.Option<"adaptive" | "nonadaptive" | "none">;
  /**
   * The text of each `interactionType`, in document order and repeats kept (M-4).
   */
  readonly interactionTypes: readonly string[];
  /**
   * Whether the entry marks its object an item template (M-1).
   */
  readonly itemTemplate: Option.Option<boolean>;
  /**
   * The context a portable custom interaction is described by (M-4), each of its two strings none
   * when it writes none. It is meaningful beside an `interactionType` of
   * `portableCustomInteraction`, and read whatever the `interactionType`s are.
   */
  readonly portableCustomInteractionContext: Option.Option<{
    readonly customTypeIdentifier: Option.Option<string>;
    readonly interactionKind: Option.Option<string>;
  }>;
  /**
   * Each `scoringMode`, in document order (M-10).
   */
  readonly scoringModes: readonly ("externalmachine" | "human" | "responseprocessing")[];
  /**
   * Whether the entry marks a solution available (M-6).
   */
  readonly solutionAvailable: Option.Option<boolean>;
  /**
   * Whether the entry marks its object time dependent (M-2).
   */
  readonly timeDependent: Option.Option<boolean>;
  /**
   * The tool name the entry writes (M-7).
   */
  readonly toolName: Option.Option<string>;
  /**
   * The tool vendor the entry writes (M-9).
   */
  readonly toolVendor: Option.Option<string>;
  /**
   * The tool version the entry writes (M-8).
   */
  readonly toolVersion: Option.Option<string>;
}

/**
 * The metadata a resource's manifest entry writes, as a host reads it (P-6, P-7, issue m3f-04).
 */
export interface ResourceMetadata {
  /**
   * The `general` categories of the entry's LOM records, in document order (P-6), exactly as the
   * manifest reader reads them.
   */
  readonly lom: readonly LomGeneral[];
  /**
   * The entry's first `qtiMetadata` in document order, whether it sits beside the entry's `lom` or
   * inside it (P-7, reading 32); none when the entry writes none.
   */
  readonly qti: Option.Option<QtiMetadata>;
}

/**
 * LOM's namespace, which a resource's `lom` is in.
 */
const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

/**
 * The namespace of QTI metadata, which `qtiMetadata` and each of its children are in.
 */
const qtiMetadataNamespace = "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0";

/**
 * The values of `feedbackType`, which its schema enumerates.
 */
const feedbackTypes = ["adaptive", "nonadaptive", "none"] as const;

/**
 * The values of `scoringMode`, which its schema enumerates.
 */
const scoringModes = ["externalmachine", "human", "responseprocessing"] as const;

/**
 * Each manifest's `resource` elements by path, built when the first resource of that manifest asks.
 *
 * `openPackage` asks once for each resource of one manifest document, and {@link walk} builds a
 * path string for every element of the document it visits, so finding each resource by its own
 * walk costs the resources times the document's elements, a quadratic cost in a large package.
 * Indexing the resources by their paths once costs the document's elements, and the weak key
 * drops a manifest's index with the manifest.
 */
const resourceElements = new WeakMap<SourceDocument, ReadonlyMap<string, SourceElement>>();

/**
 * Take an element's children with one namespace and local name.
 *
 * @param element The element.
 * @param namespace The children's namespace.
 * @param local The children's local name.
 * @returns Those children, in document order.
 */
const childrenIn = (
  element: SourceElement,
  namespace: string,
  local: string,
): readonly SourceElement[] =>
  element.children.filter(
    (child): child is SourceElement =>
      child.kind === "element" && child.namespace === namespace && child.local === local,
  );

/**
 * Find a manifest's `resource` element by the path its {@link ManifestResource} holds as `location`,
 * the path {@link walk} gives it.
 *
 * @param manifest The manifest's document.
 * @param location The resource's `location`.
 * @returns The element, none when the manifest has no resource at that path.
 */
const resourceAt = (manifest: SourceDocument, location: string): Option.Option<SourceElement> => {
  const kept = resourceElements.get(manifest);
  const index =
    kept ??
    new Map(
      Array.from(walk(manifest), (visit) => [visit.path, visit.element] as const).filter(
        ([, element]) => element.namespace === manifestNamespace && element.local === "resource",
      ),
    );
  if (kept === undefined) {
    resourceElements.set(manifest, index);
  }

  return Option.fromUndefinedOr(index.get(location));
};

/**
 * Find the first `qtiMetadata` in document order that a resource's own `metadata` holds, as its
 * child or as a child of its `lom` (reading 32). A `file`'s `metadata` and the manifest's are not
 * the resource's.
 *
 * @param resource The `resource` element.
 * @returns The `qtiMetadata` element, none when the resource's metadata holds none.
 */
const qtiMetadataOf = (resource: SourceElement): Option.Option<SourceElement> =>
  Option.fromUndefinedOr(
    childrenIn(resource, manifestNamespace, "metadata")
      .flatMap((metadata) => metadata.children)
      .flatMap((child) => {
        if (child.kind !== "element") {
          return [];
        }

        if (child.namespace === qtiMetadataNamespace && child.local === "qtiMetadata") {
          return [child];
        }

        return child.namespace === lomNamespace && child.local === "lom"
          ? childrenIn(child, qtiMetadataNamespace, "qtiMetadata")
          : [];
      })[0],
  );

/**
 * Read the first child of a `qtiMetadata` or of its context that has one name.
 *
 * @param parent The element that holds the child.
 * @param local The child's local name.
 * @returns The child, none when the parent writes none.
 */
const firstChild = (parent: SourceElement, local: string): Option.Option<SourceElement> =>
  Option.fromUndefinedOr(childrenIn(parent, qtiMetadataNamespace, local)[0]);

/**
 * Read an element's text with its outer XML whitespace removed (reading 7).
 *
 * @param element The element.
 * @returns Its text, trimmed.
 */
const valueOf = (element: SourceElement): string => trimXmlSpace(textOf(element));

/**
 * Read the string a child writes.
 *
 * @param parent The element that holds the child.
 * @param local The child's local name.
 * @returns Its text, trimmed, none when the parent writes no such child.
 */
const textIn = (parent: SourceElement, local: string): Option.Option<string> =>
  Option.map(firstChild(parent, local), valueOf);

/**
 * Read the `xs:boolean` a child writes.
 *
 * @param parent The element that holds the child.
 * @param local The child's local name.
 * @returns The boolean, none when the parent writes no such child or its text is outside
 *   `xs:boolean`'s lexical space.
 */
const flagIn = (parent: SourceElement, local: string): Option.Option<boolean> =>
  Option.flatMap(textIn(parent, local), xsBooleanOf);

/**
 * Pick the value of an enumeration that a text spells.
 *
 * @param values The enumeration's values.
 * @param written The text, trimmed.
 * @returns The value the text spells, none when it spells none.
 */
const oneOf = <const Values extends readonly string[]>(
  values: Values,
  written: string,
): Option.Option<Values[number]> =>
  Option.fromUndefinedOr(values.find((candidate) => candidate === written));

/**
 * Read a `qtiMetadata` element.
 *
 * @param qti The `qtiMetadata` element.
 * @returns What it writes.
 */
const readQtiMetadata = (qti: SourceElement): QtiMetadata => ({
  composite: flagIn(qti, "composite"),
  feedbackType: Option.flatMap(textIn(qti, "feedbackType"), (written) =>
    oneOf(feedbackTypes, written),
  ),
  interactionTypes: childrenIn(qti, qtiMetadataNamespace, "interactionType").map(valueOf),
  itemTemplate: flagIn(qti, "itemTemplate"),
  portableCustomInteractionContext: Option.map(
    firstChild(qti, "portableCustomInteractionContext"),
    (context) => ({
      customTypeIdentifier: textIn(context, "customTypeIdentifier"),
      interactionKind: textIn(context, "interactionKind"),
    }),
  ),
  scoringModes: childrenIn(qti, qtiMetadataNamespace, "scoringMode").flatMap((mode) =>
    Option.toArray(oneOf(scoringModes, valueOf(mode))),
  ),
  solutionAvailable: flagIn(qti, "solutionAvailable"),
  timeDependent: flagIn(qti, "timeDependent"),
  toolName: textIn(qti, "toolName"),
  toolVendor: textIn(qti, "toolVendor"),
  toolVersion: textIn(qti, "toolVersion"),
});

/**
 * Read a resource's metadata (P-6, P-7, M-1 to M-10, issue m3f-04): the LOM `general` categories
 * the manifest reader gave it, and the first `qtiMetadata` its own `metadata` writes.
 *
 * Only the resource's own `metadata` is read: never a `file`'s, and never the manifest's (P-5).
 * Nothing is interpreted and nothing is refused: a value outside its type reads as not written
 * ({@link QtiMetadata}).
 *
 * @param context The resource's manifest entry, its LOM generals and the manifest.
 * @returns The resource's LOM as given, and its QTI metadata, none when it writes none.
 */
export const resourceMetadataOf = (context: MetadataContext): ResourceMetadata => ({
  lom: context.lom,
  qti: resourceAt(context.manifest, context.resource.location).pipe(
    Option.flatMap(qtiMetadataOf),
    Option.map(readQtiMetadata),
  ),
});
