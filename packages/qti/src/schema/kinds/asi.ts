/**
 * The ASI vocabulary: the QTI assessment-item kinds of the first round trip, in the ASI namespace.
 *
 * The `admission` rows are phase-1's M0 rows as written, plus the M1 rows `admissionOf` derives at
 * module load over the XSD inventory (`content/xsd-inventory.ts`): one row per (version, host,
 * child) for every ASI host the inventory holds. `html.ts` applies the same function to the HTML
 * hosts, so the two files together hold every M1 and HTML host's rows.
 *
 * Reading rules of the derivation:
 *
 * - A host's element children are its inventory entry's `children`. The inventory already expands
 *   each content-set reference (`HFLOW`, `HINL`, `HBLOCK`, `PHR`) and each QTI addition to the
 *   names the host's XSD type references, so `content/sets.ts`'s `hostAdditions` is not read here;
 *   `content.test.ts` checks that every addition it lists for a roster host is admitted.
 * - A child is kept when it maps to a handle of the inventory, which is this phase's roster.
 *   `m3:math`, `xi:include`, the SSML elements, the M2 and M4 elements (`qti-catalog`,
 *   `qti-custom-interaction`, `qti-template-processing` and so on) and the HTML `template` have no
 *   handle there and are left out until their phase appends them. `template` is also no host.
 * - An element reference whose name has several XSD types maps to the handle of the type the host's
 *   content model names. The mapping, by child element and host:
 *
 *   - `qti-content-body` under `qti-modal-feedback` is `qti-content-body.modal`, under
 *     `qti-feedback-block` `qti-content-body.feedback`, under `qti-feedback-block.template` and
 *     `qti-template-block` `qti-content-body.template`, under `qti-template-block.rubric`
 *     `qti-content-body.rubricTemplate`, and under `qti-rubric-block` `qti-content-body.rubric`;
 *   - `qti-feedback-block` under `qti-content-body.template` is `qti-feedback-block.template`;
 *   - `qti-template-block` and `qti-template-inline` under `qti-content-body.rubric` are
 *     `qti-template-block.rubric` and `qti-template-inline.rubric`;
 *   - Every other reference is the element's plain handle.
 * - The content type adds rows to every host, as phase-1's 4.3 states: an element-only host adds
 *   `ws`, `comment` and `pi`; a mixed host adds `text`, `ws`, `entityRef`, `comment` and `pi`; the
 *   empty type (no element child, not mixed) admits `comment` and `pi` only.
 * - Both versions get the same rows: the M1 and HTML types' child sets do not differ (the spec's
 *   3.5), only the occurrence bounds of `qti-modal-feedback`'s body do.
 * - Rows are deduplicated on `(version, parent, child)`, so a derived row an M0 row already states is
 *   kept once, in M0's position.
 *
 * `details` decision: the XSD's `ItemBodyDType` and `HotTextInteractionDType` (and the stimulus
 * body, outside this roster) list 25 HTML names where `HBLOCK` holds 26: `details` is absent from
 * their content models. The rows follow the XSD, so `details` is not admitted under
 * `qti-item-body` or `qti-hottext-interaction`; every other flow host admits it.
 */
import { Option } from "effect";

import { asiInventory } from "#qti/schema/content/inventory/asi.ts";
import { entryOf } from "#qti/schema/content/xsd-inventory.ts";
import type { InventoryEntry } from "#qti/schema/content/xsd-inventory.ts";
import type { AdmissionRow, RegistryRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

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

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const elementOnly = ["ws", "comment", "pi"] as const;

const mixed = ["text", "ws", "entityRef", "comment", "pi"] as const;

/**
 * The children each ASI kind admits, by content type: the spec's 3.6 and 4.3. The element-only
 * hosts add whitespace, comments and instructions; the mixed hosts add character data and entity
 * references; `qti-value` is simple content; `qti-response-processing` admits no element yet.
 */
const children: Readonly<Record<(typeof kinds)[number], readonly string[]>> = {
  "qti-assessment-item": [
    "qti-response-declaration",
    "qti-outcome-declaration",
    "qti-item-body",
    "qti-response-processing",
    ...elementOnly,
  ],
  "qti-choice-interaction": ["qti-prompt", "qti-simple-choice", ...elementOnly],
  "qti-correct-response": ["qti-value", ...elementOnly],
  "qti-default-value": ["qti-value", ...elementOnly],
  "qti-item-body": ["qti-choice-interaction", "p", ...elementOnly],
  "qti-outcome-declaration": ["qti-default-value", ...elementOnly],
  "qti-prompt": ["p", "img", ...mixed],
  "qti-response-declaration": ["qti-default-value", "qti-correct-response", ...elementOnly],
  "qti-response-processing": elementOnly,
  "qti-simple-choice": ["p", "img", ...mixed],
  "qti-value": mixed,
};

const m0Admission: readonly AdmissionRow[] = Object.entries(children).flatMap(([parent, kids]) =>
  versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
);

/**
 * The handle of a multi-type child element, keyed `element|host`: the mapping table of the module
 * comment. A pair it does not list maps to the element's plain handle.
 */
const typedChildren = new Map<string, string>([
  ["qti-content-body|qti-feedback-block", "qti-content-body.feedback"],
  ["qti-content-body|qti-feedback-block.template", "qti-content-body.template"],
  ["qti-content-body|qti-modal-feedback", "qti-content-body.modal"],
  ["qti-content-body|qti-rubric-block", "qti-content-body.rubric"],
  ["qti-content-body|qti-template-block", "qti-content-body.template"],
  ["qti-content-body|qti-template-block.rubric", "qti-content-body.rubricTemplate"],
  ["qti-feedback-block|qti-content-body.template", "qti-feedback-block.template"],
  ["qti-template-block|qti-content-body.rubric", "qti-template-block.rubric"],
  ["qti-template-inline|qti-content-body.rubric", "qti-template-inline.rubric"],
]);

/**
 * The handle a child element reference stands for under a host.
 */
const childHandle = (element: string, host: string): string =>
  typedChildren.get(`${element}|${host}`) ?? element;

/**
 * The admitted children of one inventory host: its element children that have a handle in the
 * inventory, then the content-type rows.
 */
const childrenOfHost = (entry: InventoryEntry): readonly string[] => {
  const elements = entry.children
    .map((child) => childHandle(child.name, entry.handle))
    .filter((handle) => Option.isSome(entryOf(handle)) && handle !== "template");
  if (entry.mixed) {
    return [...elements, "text", "ws", "entityRef", "comment", "pi"];
  }

  if (entry.children.length === 0) {
    return ["comment", "pi"];
  }

  return [...elements, ...elementOnly];
};

/**
 * The M1 admission rows of a vocabulary's hosts, derived from their inventory entries and the same
 * for both versions.
 *
 * @param leaf - One vocabulary's inventory leaf.
 * @returns One row per version, host and admitted child, without duplicates within the leaf.
 */
export const admissionOf = (
  leaf: Readonly<Record<string, InventoryEntry>>,
): readonly AdmissionRow[] =>
  Object.values(leaf)
    .filter((entry) => entry.handle !== "template")
    .flatMap((entry) => {
      const kids = [...new Set(childrenOfHost(entry))];

      return versions.flatMap((version) =>
        kids.map((child) => ({ child, parent: entry.handle, version })),
      );
    });

/**
 * Drop every row whose `(version, parent, child)` an earlier row already holds.
 *
 * @param rows - The rows in precedence order.
 * @returns The rows with the first of each triple.
 */
export const dedupe = (rows: readonly AdmissionRow[]): readonly AdmissionRow[] => {
  const seen = new Set<string>();

  return rows.filter((candidate) => {
    const triple = `${candidate.version}|${candidate.parent}|${candidate.child}`;
    if (seen.has(triple)) {
      return false;
    }

    seen.add(triple);

    return true;
  });
};

/**
 * The ASI admission rows, the same for both versions: phase-1's M0 rows, then the derived M1 rows.
 */
export const admission: readonly AdmissionRow[] = dedupe([
  ...m0Admission,
  ...admissionOf(asiInventory),
]);
