/**
 * The foreign vocabulary: the one kind that holds an element QTI 3.0 has no kind for, and the ten
 * `xlink:` names it may carry.
 *
 * Foreign content is mixed: character content, comments, processing instructions and entity
 * references sit under a foreign element, and so do other foreign elements. Every other row that
 * names `foreign`, as a child under a host that declares a wildcard and as a host of the wildcard
 * element kinds QTI does declare, is derived in `seed/wildcard.ts`, so this file lists only the
 * twelve rows of `foreign` as a parent.
 *
 * The kind's `local` is empty, which keeps it out of the candidates `kindOf` matches an element
 * against and out of every guard's element set: no element is read as `foreign` by name, it is the
 * kind an element with no kind of its own is stored as.
 *
 * `xml:space` and `xml:id` are `asi`'s names, beside `xml:lang` and `xml:base`; the ten `xlink:`
 * names are listed once, here, in `AttributeName`.
 */
import { Option } from "effect";

import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";

/**
 * The foreign kind, in append-only order.
 */
export const kinds = ["foreign"] as const;

/**
 * The attribute names this kind introduces: the ten `xlink:` attributes of `w3/xlink.xsd`.
 */
export const attributes = [
  "xlink:type",
  "xlink:href",
  "xlink:role",
  "xlink:arcrole",
  "xlink:title",
  "xlink:show",
  "xlink:actuate",
  "xlink:label",
  "xlink:from",
  "xlink:to",
] as const;

/**
 * The registry row of the foreign kind: the ten `xlink:` names and the two `xml:` names it stores.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  foreign: {
    attributes: [...attributes, "xml:space", "xml:id"],
    local: "",
    namespace: "",
    parent: Option.none(),
  },
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const children = ["text", "ws", "comment", "pi", "entityRef", "foreign"] as const;

/**
 * The children a foreign element admits, the same for both versions: the mixed character content
 * and foreign elements (12 rows).
 */
export const admission: readonly AdmissionRow[] = versions.flatMap((version) =>
  children.map((child) => ({ child, parent: "foreign", version })),
);
