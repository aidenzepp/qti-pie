/**
 * The HTML vocabulary: the HTML elements QTI 3 places in the ASI namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow } from "#qti/schema/kinds/generic.ts";

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

/**
 * The HTML admission rows: none yet.
 */
export const admission: readonly AdmissionRow[] = [];
