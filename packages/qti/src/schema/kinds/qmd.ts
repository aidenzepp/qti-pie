/**
 * The QTI metadata vocabulary: the elements of a QTI metadata record, in the QMD namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow } from "#qti/schema/kinds/generic.ts";

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

/**
 * The QMD admission rows: none yet.
 */
export const admission: readonly AdmissionRow[] = [];
