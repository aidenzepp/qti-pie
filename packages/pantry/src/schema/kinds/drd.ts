/**
 * The Access for All digital resource description vocabulary: the resource container and its 17
 * simple-content children. Data only; `node.ts` spreads it.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

// targetNamespace of imsqtiv3p0_afa3p0drd_v1p0.xsd, line 3.
const namespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0";

/**
 * The DRD kinds, in append-only order: the container, then its 17 children in the sequence order
 * of `Access_For_All_Resource.Type` (the XSD's lines 392 to 408: `accessMode` first,
 * `isPartialAdaptationOf` last).
 */
export const kinds = [
  "drd:accessForAllResource",
  "drd:accessMode",
  "drd:accessModeAdapted",
  "drd:adaptationType",
  "drd:atInteroperable",
  "drd:controlFlexibility",
  "drd:displayTransformability",
  "drd:educationalComplexityOfAdaptation",
  "drd:hasAdaptation",
  "drd:hazard",
  "drd:isAdaptationOf",
  "drd:languageOfAdaptation",
  "drd:adaptationDetail",
  "drd:adaptationMediaType",
  "drd:apiInteroperable",
  "drd:educationalLevelOfAdaptation",
  "drd:isFullAdaptationOf",
  "drd:isPartialAdaptationOf",
] as const;

/**
 * The attribute names these kinds introduce: none.
 */
export const attributes = [] as const;

const row = (local: string): RegistryRow => ({
  attributes: [],
  local,
  namespace,
  parent: Option.none(),
});

/**
 * The registry row of each DRD kind; the local name is the element's.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "drd:accessForAllResource": row("accessForAllResource"),
  "drd:accessMode": row("accessMode"),
  "drd:accessModeAdapted": row("accessModeAdapted"),
  "drd:adaptationDetail": row("adaptationDetail"),
  "drd:adaptationMediaType": row("adaptationMediaType"),
  "drd:adaptationType": row("adaptationType"),
  "drd:apiInteroperable": row("apiInteroperable"),
  "drd:atInteroperable": row("atInteroperable"),
  "drd:controlFlexibility": row("controlFlexibility"),
  "drd:displayTransformability": row("displayTransformability"),
  "drd:educationalComplexityOfAdaptation": row("educationalComplexityOfAdaptation"),
  "drd:educationalLevelOfAdaptation": row("educationalLevelOfAdaptation"),
  "drd:hasAdaptation": row("hasAdaptation"),
  "drd:hazard": row("hazard"),
  "drd:isAdaptationOf": row("isAdaptationOf"),
  "drd:isFullAdaptationOf": row("isFullAdaptationOf"),
  "drd:isPartialAdaptationOf": row("isPartialAdaptationOf"),
  "drd:languageOfAdaptation": row("languageOfAdaptation"),
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const elementOnly = ["ws", "comment", "pi"] as const;

const simpleContent = ["text", "ws", "entityRef", "comment", "pi"] as const;

const [container, ...leaves] = kinds;

/**
 * The DRD admission rows, the same for both versions: the container admits its 17 children and
 * the element-only set (the sequence order is a guard's); each child admits simple content only.
 */
export const admission: readonly AdmissionRow[] = versions.flatMap((version) => [
  ...[...leaves, ...elementOnly].map((child) => ({ child, parent: container, version })),
  ...leaves.flatMap((leaf) => simpleContent.map((child) => ({ child, parent: leaf, version }))),
]);
