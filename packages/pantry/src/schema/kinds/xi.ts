/**
 * The XInclude vocabulary: the two elements of `w3/XInclude.xsd`, in the XInclude namespace.
 *
 * Owner table (the spec's 4.8): this file carries `xi:include` under every host of the ASI XSDs
 * but the processing hosts: the four M0 hosts `qti-item-body`, `qti-prompt`, `qti-simple-choice`
 * and `p`, M1's HTML, interaction and feedback hosts, and M4's section, test rubric body, test
 * feedback body and (3.0.1 only) stimulus body, so no host file is touched; its placement under the
 * processing hosts is the processing composition's.
 *
 * Both XInclude types are `mixed="true"` (`w3/XInclude.xsd` lines 15 and 40): character content is
 * modeled here, and the wildcard element children are M2f's.
 *
 * Attribute classes (the spec's 3.9): `href` and `parse` collapse whitespace; `xpointer`,
 * `encoding`, `accept` and `accept-language` preserve it. `href` is declared first by `cp`'s tuple,
 * so a name is declared once and this file's `attributes` lists the other five.
 */
import { Option } from "effect";

import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";

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
 * The hosts of `xi:include` both versions share, from `xihosts.py` over each version's ASI XSD
 * (the spec's 3.6), a multi-typed element as its dotted handle: the elements of the types in M0,
 * M1 and M4, less the ten processing hosts, whose rows the processing composition (`asi.ts`) holds.
 * `qti-item-body`, `qti-prompt`, `qti-simple-choice` and `p` are the four M0 hosts.
 * `qti-interaction-markup` is a host in the XSD and has no handle yet.
 */
const sharedHosts = [
  "a",
  "abbr",
  "acronym",
  "address",
  "article",
  "aside",
  "b",
  "big",
  "caption",
  "cite",
  "code",
  "dd",
  "dfn",
  "div",
  "dt",
  "em",
  "figcaption",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "i",
  "kbd",
  "label",
  "li",
  "nav",
  "object",
  "p",
  "pre",
  "q",
  "qti-assessment-section",
  "qti-content-body.feedback",
  "qti-content-body.modal",
  "qti-content-body.rubric",
  "qti-content-body.rubricTemplate",
  "qti-content-body.template",
  "qti-content-body.testFeedback",
  "qti-content-body.testRubric",
  "qti-feedback-inline",
  "qti-gap-match-interaction",
  "qti-gap-text",
  "qti-hottext",
  "qti-hottext-interaction",
  "qti-inline-choice",
  "qti-item-body",
  "qti-label",
  "qti-prompt",
  "qti-simple-associable-choice",
  "qti-simple-choice",
  "qti-template-inline",
  "qti-template-inline.rubric",
  "samp",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "td",
  "th",
  "tt",
  "var",
] as const;

/**
 * The hosts of each version: the shared hosts, and in 3.0.1 `qti-stimulus-body`
 * (`StimulusBodyDType`, the one type 3.0.0 lacks).
 */
const hosts = {
  "3.0.0": sharedHosts,
  "3.0.1": [...sharedHosts, "qti-stimulus-body"],
} as const satisfies Readonly<Record<SchemaVersionHandle, readonly string[]>>;

/**
 * The children each parent admits in a version: the two XInclude kinds under each other and the
 * mixed character content under each, and `xi:include` under each host of the version.
 */
const childrenIn = (version: SchemaVersionHandle) => ({
  ...Object.fromEntries(hosts[version].map((host) => [host, ["xi:include"]] as const)),
  "xi:fallback": ["xi:include", ...mixed],
  "xi:include": ["xi:fallback", ...mixed],
});

/**
 * The XInclude admission rows: 79 in 3.0.1 and 78 in 3.0.0.
 */
export const admission: readonly AdmissionRow[] = versions.flatMap((version) =>
  Object.entries(childrenIn(version)).flatMap(([parent, kids]) =>
    kids.map((child) => ({ child, parent, version })),
  ),
);
