/**
 * The XInclude vocabulary: the two elements of `w3/XInclude.xsd`, in the XInclude namespace.
 *
 * Owner table (the spec's 4.8): this file carries `xi:include` under the four M0 hosts
 * `qti-item-body`, `qti-prompt`, `qti-simple-choice` and `p`, so no host file is touched; its
 * placement under the processing hosts is the processing composition's, and under M1's and M4's
 * hosts is M4's.
 *
 * Both XInclude types are `mixed="true"` (`w3/XInclude.xsd` lines 15 and 40): character content is
 * modeled here, and the wildcard element children are M2f's.
 *
 * Attribute classes (the spec's 3.9): `href` and `parse` collapse whitespace; `xpointer`,
 * `encoding`, `accept` and `accept-language` preserve it. `href` is declared first by `cp`'s tuple,
 * so a name is declared once and this file's `attributes` lists the other five.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

const namespace = "http://www.w3.org/2001/XInclude";

/**
 * The XInclude kinds, in append-only order; each handle is the prefixed element name.
 */
export const kinds = ["xi:include", "xi:fallback"] as const;

/**
 * The attribute names these kinds introduce, in first-appearance order over the roster: `href` is
 * `cp`'s.
 */
export const attributes = ["parse", "xpointer", "encoding", "accept", "accept-language"] as const;

/**
 * The registry row of each XInclude kind: `xi:include` stores all six attributes, `href`
 * included.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "xi:fallback": {
    attributes: [],
    local: "fallback",
    namespace,
    parent: Option.none(),
  },
  "xi:include": {
    attributes: ["href", "parse", "xpointer", "encoding", "accept", "accept-language"],
    local: "include",
    namespace,
    parent: Option.none(),
  },
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const mixed = ["text", "ws", "entityRef", "comment", "pi"] as const;

/**
 * The children each parent admits, the same for both versions: the two XInclude kinds under each
 * other and the mixed character content under each, and `xi:include` under the four M0 hosts.
 */
const children = {
  p: ["xi:include"],
  "qti-item-body": ["xi:include"],
  "qti-prompt": ["xi:include"],
  "qti-simple-choice": ["xi:include"],
  "xi:fallback": ["xi:include", ...mixed],
  "xi:include": ["xi:fallback", ...mixed],
} as const satisfies Readonly<Record<string, readonly string[]>>;

/**
 * The XInclude admission rows: 16 per version.
 */
export const admission: readonly AdmissionRow[] = Object.entries(children).flatMap(
  ([parent, kids]) =>
    versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
);
