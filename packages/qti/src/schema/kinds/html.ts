/**
 * The HTML vocabulary: the HTML elements QTI 3 places in the ASI namespace.
 */
import { Option } from "effect";

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

/**
 * The HTML admission rows, the same for both versions.
 */
export const admission: readonly AdmissionRow[] = Object.entries(children).flatMap(
  ([parent, kids]) =>
    versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
);
