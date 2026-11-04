/**
 * The LOM vocabulary: the IEEE learning-object-metadata kinds a QTI manifest carries, in the LOM
 * namespace.
 */
import { Option } from "effect";

import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";

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
  "lom:educational",
  "lom:interactivityType",
  "lom:learningResourceType",
  "lom:interactivityLevel",
  "lom:semanticDensity",
  "lom:intendedEndUserRole",
  "lom:context",
  "lom:typicalAgeRange",
  "lom:difficulty",
  "lom:typicalLearningTime",
  "lom:classification",
  "lom:purpose",
  "lom:taxonPath",
  "lom:source.langString",
  "lom:taxon",
  "lom:id",
  "lom:entry.langString",
  "lom:relation",
  "lom:kind",
  "lom:resource",
  "lom:annotation",
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
  "lom:annotation": row("annotation"),
  "lom:catalog": row("catalog"),
  "lom:classification": row("classification"),
  "lom:context": row("context"),
  "lom:contribute": row("contribute"),
  "lom:copyrightAndOtherRestrictions": row("copyrightAndOtherRestrictions"),
  "lom:cost": row("cost"),
  "lom:coverage": row("coverage"),
  "lom:date": row("date"),
  "lom:dateTime": row("dateTime"),
  "lom:description": row("description"),
  "lom:difficulty": row("difficulty"),
  "lom:duration": row("duration"),
  "lom:duration.string": row("duration", [], Option.some("lom:duration")),
  "lom:educational": row("educational"),
  "lom:entity": row("entity"),
  "lom:entry": row("entry"),
  "lom:entry.langString": row("entry", [], Option.some("lom:taxon")),
  "lom:format": row("format"),
  "lom:general": row("general"),
  "lom:id": row("id"),
  "lom:identifier": row("identifier"),
  "lom:installationRemarks": row("installationRemarks"),
  "lom:intendedEndUserRole": row("intendedEndUserRole"),
  "lom:interactivityLevel": row("interactivityLevel"),
  "lom:interactivityType": row("interactivityType"),
  "lom:keyword": row("keyword"),
  "lom:kind": row("kind"),
  "lom:language": row("language"),
  "lom:learningResourceType": row("learningResourceType"),
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
  "lom:purpose": row("purpose"),
  "lom:relation": row("relation"),
  "lom:requirement": row("requirement"),
  "lom:resource": row("resource"),
  "lom:rights": row("rights"),
  "lom:role": row("role"),
  "lom:semanticDensity": row("semanticDensity"),
  "lom:size": row("size"),
  "lom:source": row("source"),
  "lom:source.langString": row("source", [], Option.some("lom:taxonPath")),
  "lom:status": row("status"),
  // `xml:lang` is the one hand-written registry attribute: the loose LOM binding's `anyAttribute
  // ##other lax` lets a `lom:string` carry it, and `asi.ts` declares the name first.
  "lom:string": row("string", ["language", "xml:lang"]),
  "lom:structure": row("structure"),
  "lom:taxon": row("taxon"),
  "lom:taxonPath": row("taxonPath"),
  "lom:technical": row("technical"),
  "lom:title": row("title"),
  "lom:type": row("type"),
  "lom:typicalAgeRange": row("typicalAgeRange"),
  "lom:typicalLearningTime": row("typicalLearningTime"),
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
  "lom:id",
] as const satisfies readonly (typeof kinds)[number][];

/**
 * The containers and the element children each admits: the loose binding types each as an
 * unordered, unbounded `xs:choice` of these children.
 */
const containers = {
  "lom:aggregationLevel": ["lom:source", "lom:value"],
  "lom:annotation": ["lom:entity", "lom:date", "lom:description"],
  "lom:classification": ["lom:purpose", "lom:taxonPath", "lom:description", "lom:keyword"],
  "lom:context": ["lom:source", "lom:value"],
  "lom:contribute": ["lom:role", "lom:entity", "lom:date"],
  "lom:copyrightAndOtherRestrictions": ["lom:source", "lom:value"],
  "lom:cost": ["lom:source", "lom:value"],
  "lom:coverage": ["lom:string"],
  "lom:date": ["lom:dateTime", "lom:description"],
  "lom:description": ["lom:string"],
  "lom:difficulty": ["lom:source", "lom:value"],
  "lom:duration": ["lom:duration.string", "lom:description"],
  "lom:educational": [
    "lom:interactivityType",
    "lom:learningResourceType",
    "lom:interactivityLevel",
    "lom:semanticDensity",
    "lom:intendedEndUserRole",
    "lom:context",
    "lom:typicalAgeRange",
    "lom:difficulty",
    "lom:typicalLearningTime",
    "lom:description",
    "lom:language",
  ],
  "lom:entry.langString": ["lom:string"],
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
  "lom:intendedEndUserRole": ["lom:source", "lom:value"],
  "lom:interactivityLevel": ["lom:source", "lom:value"],
  "lom:interactivityType": ["lom:source", "lom:value"],
  "lom:keyword": ["lom:string"],
  "lom:kind": ["lom:source", "lom:value"],
  "lom:learningResourceType": ["lom:source", "lom:value"],
  "lom:lifeCycle": ["lom:version", "lom:status", "lom:contribute"],
  "lom:lom": [
    "lom:general",
    "lom:lifeCycle",
    "lom:metaMetadata",
    "lom:technical",
    "lom:rights",
    "lom:educational",
    "lom:classification",
    "lom:relation",
    "lom:annotation",
  ],
  "lom:metaMetadata": ["lom:identifier", "lom:contribute", "lom:metadataschema", "lom:language"],
  "lom:name": ["lom:source", "lom:value"],
  "lom:orComposite": ["lom:type", "lom:name", "lom:minimumVersion", "lom:maximumVersion"],
  "lom:otherPlatformRequirements": ["lom:string"],
  "lom:purpose": ["lom:source", "lom:value"],
  "lom:relation": ["lom:kind", "lom:resource"],
  "lom:requirement": ["lom:orComposite"],
  "lom:resource": ["lom:identifier", "lom:description"],
  "lom:rights": ["lom:cost", "lom:copyrightAndOtherRestrictions", "lom:description"],
  "lom:role": ["lom:source", "lom:value"],
  "lom:semanticDensity": ["lom:source", "lom:value"],
  "lom:source.langString": ["lom:string"],
  "lom:status": ["lom:source", "lom:value"],
  "lom:structure": ["lom:source", "lom:value"],
  "lom:taxon": ["lom:id", "lom:entry.langString"],
  "lom:taxonPath": ["lom:source.langString", "lom:taxon"],
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
  "lom:typicalAgeRange": ["lom:string"],
  "lom:typicalLearningTime": ["lom:duration.string", "lom:description"],
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
