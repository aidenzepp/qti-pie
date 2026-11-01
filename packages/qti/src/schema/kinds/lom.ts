/**
 * The LOM vocabulary: the IEEE learning-object-metadata kinds a QTI manifest carries, in the LOM
 * namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow } from "#qti/schema/kinds/generic.ts";

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

/**
 * The LOM admission rows: none yet.
 */
export const admission: readonly AdmissionRow[] = [];
