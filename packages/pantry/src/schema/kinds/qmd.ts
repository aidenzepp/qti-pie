/**
 * The QTI metadata vocabulary: the elements of a QTI metadata record, in the QMD namespace.
 */
import { Option } from "effect";

import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";

const namespace = "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0";

/**
 * The QMD kinds, in append-only order; each handle is the prefix and the element's local name.
 */
export const kinds = [
  "qmd:qtiMetadata",
  "qmd:itemTemplate",
  "qmd:timeDependent",
  "qmd:composite",
  "qmd:interactionType",
  "qmd:portableCustomInteractionContext",
  "qmd:customTypeIdentifier",
  "qmd:interactionKind",
  "qmd:feedbackType",
  "qmd:solutionAvailable",
  "qmd:scoringMode",
  "qmd:toolName",
  "qmd:toolVersion",
  "qmd:toolVendor",
] as const;

/**
 * The attribute names these kinds introduce: none.
 */
export const attributes = [] as const;

const element = (local: string): RegistryRow => ({
  attributes: [],
  local,
  namespace,
  parent: Option.none(),
});

/**
 * The registry row of each QMD kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "qmd:composite": element("composite"),
  "qmd:customTypeIdentifier": element("customTypeIdentifier"),
  "qmd:feedbackType": element("feedbackType"),
  "qmd:interactionKind": element("interactionKind"),
  "qmd:interactionType": element("interactionType"),
  "qmd:itemTemplate": element("itemTemplate"),
  "qmd:portableCustomInteractionContext": element("portableCustomInteractionContext"),
  "qmd:qtiMetadata": element("qtiMetadata"),
  "qmd:scoringMode": element("scoringMode"),
  "qmd:solutionAvailable": element("solutionAvailable"),
  "qmd:timeDependent": element("timeDependent"),
  "qmd:toolName": element("toolName"),
  "qmd:toolVendor": element("toolVendor"),
  "qmd:toolVersion": element("toolVersion"),
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const hostRows = (parent: string, children: readonly string[]): readonly AdmissionRow[] =>
  versions.flatMap((version) => children.map((child) => ({ child, parent, version })));

const elementOnlyExtras = ["ws", "comment", "pi"] as const;

const simpleContentChildren = ["text", "ws", "entityRef", "comment", "pi"] as const;

const leaves = [
  "qmd:itemTemplate",
  "qmd:timeDependent",
  "qmd:composite",
  "qmd:interactionType",
  "qmd:customTypeIdentifier",
  "qmd:interactionKind",
  "qmd:feedbackType",
  "qmd:solutionAvailable",
  "qmd:scoringMode",
  "qmd:toolName",
  "qmd:toolVersion",
  "qmd:toolVendor",
] as const satisfies readonly (typeof kinds)[number][];

/**
 * The QMD admission rows, the same for both versions: `lom:lom` admits `qmd:qtiMetadata` (a record
 * in a resource's own or an external `lom:lom`); `qmd:qtiMetadata` admits its eleven element
 * children, in the order the schema's sequence lists them (the order itself is judged elsewhere),
 * plus `ws`, `comment` and `pi`; the portable custom interaction context admits its two; each leaf
 * admits character data, `entityRef`, `comment` and `pi` and no element.
 */
export const admission: readonly AdmissionRow[] = [
  ...hostRows("lom:lom", ["qmd:qtiMetadata"]),
  ...hostRows("qmd:qtiMetadata", [
    "qmd:itemTemplate",
    "qmd:timeDependent",
    "qmd:composite",
    "qmd:interactionType",
    "qmd:portableCustomInteractionContext",
    "qmd:feedbackType",
    "qmd:solutionAvailable",
    "qmd:scoringMode",
    "qmd:toolName",
    "qmd:toolVersion",
    "qmd:toolVendor",
    ...elementOnlyExtras,
  ]),
  ...hostRows("qmd:portableCustomInteractionContext", [
    "qmd:customTypeIdentifier",
    "qmd:interactionKind",
    ...elementOnlyExtras,
  ]),
  ...leaves.flatMap((parent) => hostRows(parent, simpleContentChildren)),
];
