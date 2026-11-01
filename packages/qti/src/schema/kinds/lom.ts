/**
 * The LOM vocabulary: the IEEE learning-object-metadata kinds a QTI manifest carries, in the LOM
 * namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

const namespace = "http://ltsc.ieee.org/xsd/LOM";

/**
 * The LOM kinds, in append-only order; each handle is `lom:` and the element's local name, and the
 * one dotted handle names the `CharacterString` child of a container that shares its name.
 */
export const kinds = [
  "lom:lom",
  "lom:general",
  "lom:identifier",
  "lom:catalog",
  "lom:entry",
  "lom:title",
  "lom:string",
  "lom:language",
  "lom:description",
  "lom:keyword",
  "lom:coverage",
  "lom:structure",
  "lom:aggregationLevel",
  "lom:source",
  "lom:value",
  "lom:lifeCycle",
  "lom:version",
  "lom:status",
  "lom:contribute",
  "lom:role",
  "lom:entity",
  "lom:date",
  "lom:dateTime",
  "lom:metaMetadata",
  "lom:metadataschema",
  "lom:technical",
  "lom:format",
  "lom:size",
  "lom:location",
  "lom:requirement",
  "lom:orComposite",
  "lom:type",
  "lom:name",
  "lom:minimumVersion",
  "lom:maximumVersion",
  "lom:installationRemarks",
  "lom:otherPlatformRequirements",
  "lom:duration",
  "lom:duration.string",
  "lom:rights",
  "lom:cost",
  "lom:copyrightAndOtherRestrictions",
] as const;

/**
 * The attribute names these kinds introduce, in first-appearance order over the roster.
 */
export const attributes = ["language"] as const;

const row = (
  local: string,
  own: readonly string[] = [],
  parent: Option.Option<string> = Option.none(),
): RegistryRow => ({ attributes: own, local, namespace, parent });

/**
 * The registry row of each LOM kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "lom:aggregationLevel": row("aggregationLevel"),
  "lom:catalog": row("catalog"),
  "lom:contribute": row("contribute"),
  "lom:copyrightAndOtherRestrictions": row("copyrightAndOtherRestrictions"),
  "lom:cost": row("cost"),
  "lom:coverage": row("coverage"),
  "lom:date": row("date"),
  "lom:dateTime": row("dateTime"),
  "lom:description": row("description"),
  "lom:duration": row("duration"),
  "lom:duration.string": row("duration", [], Option.some("lom:duration")),
  "lom:entity": row("entity"),
  "lom:entry": row("entry"),
  "lom:format": row("format"),
  "lom:general": row("general"),
  "lom:identifier": row("identifier"),
  "lom:installationRemarks": row("installationRemarks"),
  "lom:keyword": row("keyword"),
  "lom:language": row("language"),
  "lom:lifeCycle": row("lifeCycle"),
  "lom:location": row("location"),
  "lom:lom": row("lom"),
  "lom:maximumVersion": row("maximumVersion"),
  "lom:metaMetadata": row("metaMetadata"),
  "lom:metadataschema": row("metadataschema"),
  "lom:minimumVersion": row("minimumVersion"),
  "lom:name": row("name"),
  "lom:orComposite": row("orComposite"),
  "lom:otherPlatformRequirements": row("otherPlatformRequirements"),
  "lom:requirement": row("requirement"),
  "lom:rights": row("rights"),
  "lom:role": row("role"),
  "lom:size": row("size"),
  "lom:source": row("source"),
  "lom:status": row("status"),
  "lom:string": row("string", ["language"]),
  "lom:structure": row("structure"),
  "lom:technical": row("technical"),
  "lom:title": row("title"),
  "lom:type": row("type"),
  "lom:value": row("value"),
  "lom:version": row("version"),
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

/**
 * The leaves: a `CharacterString` (or vocabulary string) element holds character data and no
 * element.
 */
const leaves = [
  "lom:catalog",
  "lom:entry",
  "lom:language",
  "lom:source",
  "lom:value",
  "lom:entity",
  "lom:dateTime",
  "lom:metadataschema",
  "lom:format",
  "lom:size",
  "lom:location",
  "lom:minimumVersion",
  "lom:maximumVersion",
  "lom:duration.string",
  "lom:string",
] as const satisfies readonly (typeof kinds)[number][];

/**
 * The containers and the element children each admits: the loose binding types each as an
 * unordered, unbounded `xs:choice` of these children.
 */
const containers = {
  "lom:aggregationLevel": ["lom:source", "lom:value"],
  "lom:contribute": ["lom:role", "lom:entity", "lom:date"],
  "lom:copyrightAndOtherRestrictions": ["lom:source", "lom:value"],
  "lom:cost": ["lom:source", "lom:value"],
  "lom:coverage": ["lom:string"],
  "lom:date": ["lom:dateTime", "lom:description"],
  "lom:description": ["lom:string"],
  "lom:duration": ["lom:duration.string", "lom:description"],
  "lom:general": [
    "lom:identifier",
    "lom:title",
    "lom:language",
    "lom:description",
    "lom:keyword",
    "lom:coverage",
    "lom:structure",
    "lom:aggregationLevel",
  ],
  "lom:identifier": ["lom:catalog", "lom:entry"],
  "lom:installationRemarks": ["lom:string"],
  "lom:keyword": ["lom:string"],
  "lom:lifeCycle": ["lom:version", "lom:status", "lom:contribute"],
  "lom:lom": ["lom:general", "lom:lifeCycle", "lom:metaMetadata", "lom:technical", "lom:rights"],
  "lom:metaMetadata": ["lom:identifier", "lom:contribute", "lom:metadataschema", "lom:language"],
  "lom:name": ["lom:source", "lom:value"],
  "lom:orComposite": ["lom:type", "lom:name", "lom:minimumVersion", "lom:maximumVersion"],
  "lom:otherPlatformRequirements": ["lom:string"],
  "lom:requirement": ["lom:orComposite"],
  "lom:rights": ["lom:cost", "lom:copyrightAndOtherRestrictions", "lom:description"],
  "lom:role": ["lom:source", "lom:value"],
  "lom:status": ["lom:source", "lom:value"],
  "lom:structure": ["lom:source", "lom:value"],
  "lom:technical": [
    "lom:format",
    "lom:size",
    "lom:location",
    "lom:requirement",
    "lom:installationRemarks",
    "lom:otherPlatformRequirements",
    "lom:duration",
  ],
  "lom:title": ["lom:string"],
  "lom:type": ["lom:source", "lom:value"],
  "lom:version": ["lom:string"],
} as const satisfies Readonly<Record<string, readonly (typeof kinds)[number][]>>;

const elementOnlyExtras = ["ws", "comment", "pi"] as const;

const simpleContentChildren = ["text", "ws", "entityRef", "comment", "pi"] as const;

const hostRows = (parent: string, children: readonly string[]): readonly AdmissionRow[] =>
  versions.flatMap((version) => children.map((child) => ({ child, parent, version })));

/**
 * The LOM admission rows, the same for both versions: each container admits its element children
 * plus `ws`, `comment` and `pi`; each leaf admits character data, `entityRef`, `comment` and `pi`
 * and no element.
 */
export const admission: readonly AdmissionRow[] = [
  ...Object.entries(containers).flatMap(([parent, children]) =>
    hostRows(parent, [...children, ...elementOnlyExtras]),
  ),
  ...leaves.flatMap((parent) => hostRows(parent, simpleContentChildren)),
];
