/**
 * The HTML vocabulary: the HTML elements QTI 3 places in the ASI namespace.
 *
 * The `admission` rows are phase-1's M0 rows (`p` and `img`) as written, plus the rows
 * `admissionOf` of `asi.ts` derives over the HTML inventory leaf; its module comment holds the
 * reading rules, the dotted-handle mapping and the decision on `details`. Every HTML host of the
 * inventory is derived but `template`, which lands at M2e with the portable custom interaction.
 */
import { Option } from "effect";

import { htmlInventory } from "#qti/schema/content/inventory/html.ts";
import { admissionOf, dedupe } from "#qti/schema/kinds/asi.ts";
import type { AdmissionRow, RegistryRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The HTML kinds, in append-only order; each handle is the element's local name.
 */
export const kinds = ["p", "img"] as const;

/**
 * The attribute names these kinds introduce, in first-appearance order over the roster.
 */
export const attributes = ["src", "alt", "longdesc", "height", "width"] as const;

/**
 * The registry row of each HTML kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  img: {
    attributes: ["src", "alt", "longdesc", "height", "width"],
    local: "img",
    namespace,
    parent: Option.none(),
  },
  p: { attributes: [], local: "p", namespace, parent: Option.none() },
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

/**
 * The children each HTML kind admits: the spec's 3.6 and 4.3. `p` is mixed content; `img` is the
 * empty type and admits only comments and instructions.
 */
const children: Readonly<Record<(typeof kinds)[number], readonly string[]>> = {
  img: ["comment", "pi"],
  p: ["img", "text", "ws", "entityRef", "comment", "pi"],
};

const m0Admission: readonly AdmissionRow[] = Object.entries(children).flatMap(([parent, kids]) =>
  versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
);

/**
 * The HTML admission rows, the same for both versions: phase-1's M0 rows, then the derived rows.
 */
export const admission: readonly AdmissionRow[] = dedupe([
  ...m0Admission,
  ...admissionOf(htmlInventory),
]);
