/**
 * The ASI vocabulary: the QTI assessment-item kinds of the first round trip, in the ASI namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow } from "#qti/schema/kinds/generic.ts";

const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The ASI kinds, in append-only order; each handle is the element's local name.
 */
export const kinds = [
  "qti-assessment-item",
  "qti-response-declaration",
  "qti-outcome-declaration",
  "qti-correct-response",
  "qti-default-value",
  "qti-value",
  "qti-item-body",
  "qti-choice-interaction",
  "qti-prompt",
  "qti-simple-choice",
  "qti-response-processing",
] as const;

/**
 * The attribute names these kinds introduce, in first-appearance order over the roster.
 */
export const attributes = [
  "identifier",
  "title",
  "adaptive",
  "time-dependent",
  "cardinality",
  "base-type",
  "view",
  "interpretation",
  "long-interpretation",
  "normal-maximum",
  "normal-minimum",
  "mastery-value",
  "external-scored",
  "variable-identifier-ref",
  "field-identifier",
  "response-identifier",
  "shuffle",
  "max-choices",
  "min-choices",
  "orientation",
  "data-min-selections-message",
  "data-max-selections-message",
  "fixed",
  "template-identifier",
  "show-hide",
  "template",
  "template-location",
] as const;

const row = (local: (typeof kinds)[number], own: readonly string[]): RegistryRow => ({
  attributes: own,
  local,
  namespace,
  parent: Option.none(),
});

/**
 * The registry row of each ASI kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "qti-assessment-item": row("qti-assessment-item", [
    "identifier",
    "title",
    "adaptive",
    "time-dependent",
  ]),
  "qti-choice-interaction": row("qti-choice-interaction", [
    "response-identifier",
    "shuffle",
    "max-choices",
    "min-choices",
    "orientation",
    "data-min-selections-message",
    "data-max-selections-message",
  ]),
  "qti-correct-response": row("qti-correct-response", ["interpretation"]),
  "qti-default-value": row("qti-default-value", ["interpretation"]),
  "qti-item-body": row("qti-item-body", []),
  "qti-outcome-declaration": row("qti-outcome-declaration", [
    "identifier",
    "base-type",
    "cardinality",
    "view",
    "interpretation",
    "long-interpretation",
    "normal-maximum",
    "normal-minimum",
    "mastery-value",
    "external-scored",
    "variable-identifier-ref",
  ]),
  "qti-prompt": row("qti-prompt", []),
  "qti-response-declaration": row("qti-response-declaration", [
    "identifier",
    "base-type",
    "cardinality",
  ]),
  "qti-response-processing": row("qti-response-processing", ["template", "template-location"]),
  "qti-simple-choice": row("qti-simple-choice", [
    "identifier",
    "fixed",
    "template-identifier",
    "show-hide",
  ]),
  "qti-value": row("qti-value", ["field-identifier", "base-type"]),
};

/**
 * The ASI admission rows: none yet.
 */
export const admission: readonly AdmissionRow[] = [];
