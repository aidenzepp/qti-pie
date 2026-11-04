/**
 * The usage-data document: its root, the statistics it holds, their target objects, the value of
 * an ordinary statistic and the mapping of a categorized one. The statistic's two kinds share one
 * relation; thin arms bind each kind to its own node kind.
 *
 * This module is a leaf: nothing composes it yet.
 */
import {
  alternatives,
  capacity,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import type { AnyRelation, FieldBase } from "@bjornpagen/grizzle";
import { XsBoolean } from "#pantry/schema/content/rosters.ts";
import { Document } from "#pantry/schema/document.ts";
import type * as ud from "#pantry/schema/kinds/ud.ts";
import { BaseType } from "#pantry/schema/declaration.ts";
import {
  GlossaryUri,
  StatisticContextUri,
  StatisticMeasure,
  StatisticName,
  UsageCaseCount,
  UsageFieldIdentifier,
  UsageMappingScore,
  UsagePartIdentifier,
  UsageValueToken,
} from "#pantry/schema/contracts.ts";
import { Edge, TreeRoot } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { valueArms } from "#pantry/schema/value.ts";

const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

const xsString = str.regex(patterns.xsString, patterns.xsStringFlags);

const usageDate = str.regex(patterns.usageDate);

/**
 * The two kinds of statistic: `ordinaryStatistic` and `categorizedStatistic`.
 */
export const StatisticKind = closed("StatisticKind", ["ordinary", "categorized"]);

/**
 * The kinds of object a target object names, in the order of the XSD's `objectType` enumeration
 * (`imsqti_usagedatav3p0_v1p0.xsd`, lines 266 to 272).
 */
export const TargetObjectType = closed("TargetObjectType", [
  "test",
  "testpart",
  "section",
  "item",
  "outcome",
  "interaction",
  "choice",
]);

/**
 * A usage-data document's root: its id is its tree's root node and `document` the document.
 */
export const UsageData = relation("UsageData", { document: uuid, id: uuid }, ["id"]);

/**
 * The `glossary` of a usage-data root, when it has one.
 */
export const UsageDataGlossary = relation("UsageDataGlossary", { node: uuid, value: GlossaryUri }, [
  "node",
]);

/**
 * A statistic at its position among the usage data's children. `name` and `context` hold the
 * collapsed values.
 */
export const Statistic = relation(
  "Statistic",
  {
    context: StatisticContextUri,
    id: uuid,
    kind: closedId(StatisticKind),
    name: StatisticName,
    position: pg.bigint,
    usageData: uuid,
  },
  ["id"],
);

/**
 * The statistic of kind `ordinary`: one row per such statistic.
 */
export const OrdinaryStatisticArm = relation("OrdinaryStatisticArm", { id: uuid }, ["id"]);

/**
 * The statistic of kind `categorized`: one row per such statistic.
 */
export const CategorizedStatisticArm = relation("CategorizedStatisticArm", { id: uuid }, ["id"]);

const optional = <Name extends string, Value extends FieldBase>(name: Name, value: Value) =>
  relation(name, { node: uuid, value }, ["node"]);

/**
 * The optional `glossary` of a statistic.
 */
export const StatisticGlossary = optional("StatisticGlossary", GlossaryUri);

/**
 * The optional `caseCount` of a statistic.
 */
export const StatisticCaseCount = optional("StatisticCaseCount", UsageCaseCount);

/**
 * The optional `stdError` of a statistic.
 */
export const StatisticStdError = optional("StatisticStdError", StatisticMeasure);

/**
 * The optional `stdDeviation` of a statistic.
 */
export const StatisticStdDeviation = optional("StatisticStdDeviation", StatisticMeasure);

/**
 * The optional `lastUpdated` date of a statistic.
 */
export const StatisticLastUpdated = optional("StatisticLastUpdated", usageDate);

/**
 * A target object at its position among its statistic's children. Its `identifier` is `xs:string`
 * kept as read.
 */
export const TargetObject = relation(
  "TargetObject",
  { id: uuid, identifier: xsString, position: pg.bigint, statistic: uuid },
  ["id"],
);

/**
 * The optional `partIdentifier` of a target object.
 */
export const TargetObjectPartIdentifier = optional(
  "TargetObjectPartIdentifier",
  UsagePartIdentifier,
);

/**
 * The optional `objectType` of a target object.
 */
export const TargetObjectObjectType = relation(
  "TargetObjectObjectType",
  { node: uuid, value: closedId(TargetObjectType) },
  ["node"],
);

/**
 * The `value` of an ordinary statistic. `value` is the content after `replace` and `collapsed` its
 * collapse.
 */
export const UsageValue = relation(
  "UsageValue",
  { collapsed: UsageValueToken, id: uuid, statistic: uuid, value: xsNormalizedString },
  ["id"],
);

/**
 * The `fieldIdentifier` of a value, when it has one.
 */
export const UsageValueFieldIdentifier = relation(
  "UsageValueFieldIdentifier",
  { id: uuid, value: UsageFieldIdentifier },
  ["id"],
);

/**
 * The `baseType` of a value, when it has one.
 */
export const UsageValueBaseType = relation(
  "UsageValueBaseType",
  { baseType: closedId(BaseType), id: uuid },
  ["id"],
);

/**
 * A value that names a base type: it copies the base type and the value, and the arm of its base
 * type judges the value against that type's lexical space.
 */
export const UsageTypedValue = relation(
  "UsageTypedValue",
  { baseType: closedId(BaseType), id: uuid, value: xsNormalizedString },
  ["id"],
);

const typedValueArms = valueArms("UsageTypedValue", "Usage");

/**
 * The `mapping` of a categorized statistic. `defaultValue` is the effective value after
 * `collapse`, `0` when the source wrote none.
 */
export const UsageMapping = relation(
  "UsageMapping",
  { defaultValue: UsageMappingScore, id: uuid, statistic: uuid },
  ["id"],
);

/**
 * Marks a mapping whose source wrote the `defaultValue` attribute.
 */
export const DeclaredDefaultValue = relation("DeclaredDefaultValue", { node: uuid }, ["node"]);

/**
 * The optional `lowerBound` of a mapping.
 */
export const UsageMappingLowerBound = optional("UsageMappingLowerBound", UsageMappingScore);

/**
 * The optional `upperBound` of a mapping.
 */
export const UsageMappingUpperBound = optional("UsageMappingUpperBound", UsageMappingScore);

/**
 * A map entry at its position among its mapping's children. `mapKey` holds the value after
 * `replace`.
 */
export const UsageMapEntry = relation(
  "UsageMapEntry",
  {
    id: uuid,
    mapKey: xsNormalizedString,
    mappedValue: UsageMappingScore,
    mapping: uuid,
    position: pg.bigint,
  },
  ["id"],
);

/**
 * The optional `caseSensitive` of a map entry.
 */
export const UsageMapEntryCaseSensitive = optional(
  "UsageMapEntryCaseSensitive",
  closedId(XsBoolean),
);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  CategorizedStatisticArm,
  DeclaredDefaultValue,
  OrdinaryStatisticArm,
  Statistic,
  StatisticCaseCount,
  StatisticGlossary,
  StatisticLastUpdated,
  StatisticStdDeviation,
  StatisticStdError,
  TargetObject,
  TargetObjectObjectType,
  TargetObjectPartIdentifier,
  UsageData,
  UsageDataGlossary,
  UsageMapEntry,
  UsageMapEntryCaseSensitive,
  UsageMapping,
  UsageMappingLowerBound,
  UsageMappingUpperBound,
  UsageTypedValue,
  UsageTypedValueBoolean: typedValueArms.boolean,
  UsageTypedValueDirectedPair: typedValueArms.directedPair,
  UsageTypedValueDuration: typedValueArms.duration,
  UsageTypedValueFile: typedValueArms.file,
  UsageTypedValueFloat: typedValueArms.float,
  UsageTypedValueIdentifier: typedValueArms.identifier,
  UsageTypedValueInteger: typedValueArms.integer,
  UsageTypedValuePair: typedValueArms.pair,
  UsageTypedValuePoint: typedValueArms.point,
  UsageTypedValueString: typedValueArms.string,
  UsageTypedValueUri: typedValueArms.uri,
  UsageValue,
  UsageValueBaseType,
  UsageValueFieldIdentifier,
};

/**
 * The statements over these relations: the root is its tree's and one per usage-data document;
 * statistics, target objects, values, mappings and map entries hang under their parents by an
 * edge; each statistic kind has its arm; a statistic has at least one target object, an ordinary
 * one exactly one value and a categorized one exactly one mapping, a mapping at least one map
 * entry; a typed value is a value of a named base type whose arm judges it; and each optional
 * value names its owner.
 */
export const rules = [
  key(UsageData, ["document"]),
  contained(on(UsageData, "id", "document"), on(TreeRoot, "node", "tree")),
  mirrors(on(select(Document, { root: "usagedata" }), "id"), on(UsageData, "document")),
  contained(on(UsageDataGlossary, "node"), on(UsageData, "id")),
  contained(on(Statistic, "id", "usageData", "position"), on(Edge, "child", "parent", "position")),
  contained(on(Statistic, "usageData"), on(UsageData, "id")),
  mirrors(on(select(Statistic, { kind: "ordinary" }), "id"), on(OrdinaryStatisticArm, "id")),
  mirrors(on(select(Statistic, { kind: "categorized" }), "id"), on(CategorizedStatisticArm, "id")),
  contained(on(StatisticGlossary, "node"), on(Statistic, "id")),
  contained(on(StatisticCaseCount, "node"), on(Statistic, "id")),
  contained(on(StatisticStdError, "node"), on(Statistic, "id")),
  contained(on(StatisticStdDeviation, "node"), on(Statistic, "id")),
  contained(on(StatisticLastUpdated, "node"), on(Statistic, "id")),
  contained(
    on(TargetObject, "id", "statistic", "position"),
    on(Edge, "child", "parent", "position"),
  ),
  contained(on(TargetObject, "statistic"), on(Statistic, "id")),
  capacity(on(Statistic, "id"), { from: on(TargetObject, "statistic"), within: within(1n, "*") }),
  contained(on(TargetObjectPartIdentifier, "node"), on(TargetObject, "id")),
  contained(on(TargetObjectObjectType, "node"), on(TargetObject, "id")),
  key(UsageValue, ["statistic"]),
  contained(on(UsageValue, "id", "statistic"), on(Edge, "child", "parent")),
  capacity(on(select(Statistic, { kind: "ordinary" }), "id"), {
    from: on(UsageValue, "statistic"),
    within: within(1n, 1n),
  }),
  contained(on(UsageValueFieldIdentifier, "id"), on(UsageValue, "id")),
  contained(on(UsageValueBaseType, "id"), on(UsageValue, "id")),
  contained(on(UsageTypedValue, "id", "baseType"), on(UsageValueBaseType, "id", "baseType")),
  contained(on(UsageTypedValue, "id", "value"), on(UsageValue, "id", "value")),
  mirrors(on(UsageValueBaseType, "id"), on(UsageTypedValue, "id")),
  alternatives(UsageTypedValue, "baseType", BaseType, typedValueArms),
  key(UsageMapping, ["statistic"]),
  contained(on(UsageMapping, "id", "statistic"), on(Edge, "child", "parent")),
  capacity(on(select(Statistic, { kind: "categorized" }), "id"), {
    from: on(UsageMapping, "statistic"),
    within: within(1n, 1n),
  }),
  contained(on(DeclaredDefaultValue, "node"), on(UsageMapping, "id")),
  contained(on(UsageMappingLowerBound, "node"), on(UsageMapping, "id")),
  contained(on(UsageMappingUpperBound, "node"), on(UsageMapping, "id")),
  contained(
    on(UsageMapEntry, "id", "mapping", "position"),
    on(Edge, "child", "parent", "position"),
  ),
  contained(on(UsageMapEntry, "mapping"), on(UsageMapping, "id")),
  capacity(on(UsageMapping, "id"), { from: on(UsageMapEntry, "mapping"), within: within(1n, "*") }),
  contained(on(UsageMapEntryCaseSensitive, "node"), on(UsageMapEntry, "id")),
] as const;

/**
 * The element arms of this module, keyed by `NodeKind` handle: every usage-data kind.
 */
export const arms = {
  "ud:categorizedStatistic": CategorizedStatisticArm,
  "ud:mapEntry": UsageMapEntry,
  "ud:mapping": UsageMapping,
  "ud:ordinaryStatistic": OrdinaryStatisticArm,
  "ud:targetObject": TargetObject,
  "ud:usageData": UsageData,
  "ud:value": UsageValue,
} as const satisfies Record<(typeof ud.kinds)[number], AnyRelation>;
