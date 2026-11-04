/**
 * The usage-data vocabulary: the root, the two statistic kinds and their children. Data only;
 * `node.ts` spreads it.
 */
import { Option } from "effect";

import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";

// targetNamespace of imsqti_usagedatav3p0_v1p0.xsd.
const namespace = "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0";

/**
 * The usage-data kinds, in append-only order: the XSD's declaration order.
 */
export const kinds = [
  "ud:usageData",
  "ud:ordinaryStatistic",
  "ud:categorizedStatistic",
  "ud:targetObject",
  "ud:value",
  "ud:mapping",
  "ud:mapEntry",
] as const;

/**
 * The attribute names these kinds introduce, in order of first appearance among the kinds.
 * `identifier` and `name` are `asi`'s names.
 */
export const attributes = [
  "glossary",
  "caseCount",
  "context",
  "lastUpdated",
  "stdDeviation",
  "stdError",
  "objectType",
  "partIdentifier",
  "baseType",
  "fieldIdentifier",
  "defaultValue",
  "lowerBound",
  "upperBound",
  "caseSensitive",
  "mapKey",
  "mappedValue",
] as const;

const row = (local: string, attributeNames: readonly string[]): RegistryRow => ({
  attributes: attributeNames,
  local,
  namespace,
  parent: Option.none(),
});

const statisticAttributes = [
  "caseCount",
  "context",
  "glossary",
  "lastUpdated",
  "name",
  "stdDeviation",
  "stdError",
] as const;

/**
 * The registry row of each usage-data kind; the local name is the element's.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "ud:categorizedStatistic": row("categorizedStatistic", statisticAttributes),
  "ud:mapEntry": row("mapEntry", ["caseSensitive", "mapKey", "mappedValue"]),
  "ud:mapping": row("mapping", ["defaultValue", "lowerBound", "upperBound"]),
  "ud:ordinaryStatistic": row("ordinaryStatistic", statisticAttributes),
  "ud:targetObject": row("targetObject", ["identifier", "objectType", "partIdentifier"]),
  "ud:usageData": row("usageData", ["glossary"]),
  "ud:value": row("value", ["baseType", "fieldIdentifier"]),
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const elementOnly = ["ws", "comment", "pi"] as const;

const simpleContent = ["text", "ws", "entityRef", "comment", "pi"] as const;

const children: Readonly<Record<(typeof kinds)[number], readonly string[]>> = {
  "ud:categorizedStatistic": ["ud:targetObject", "ud:mapping", ...elementOnly],
  "ud:mapEntry": ["comment", "pi"],
  "ud:mapping": ["ud:mapEntry", ...elementOnly],
  "ud:ordinaryStatistic": ["ud:targetObject", "ud:value", ...elementOnly],
  "ud:targetObject": ["comment", "pi"],
  "ud:usageData": ["ud:ordinaryStatistic", "ud:categorizedStatistic", ...elementOnly],
  "ud:value": simpleContent,
};

/**
 * The usage-data admission rows, the same for both versions. The statistics under the root are an
 * unordered choice; the children of a statistic are a sequence whose order is a guard's.
 */
export const admission: readonly AdmissionRow[] = Object.entries(children).flatMap(
  ([parent, kids]) =>
    versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
);
