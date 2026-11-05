/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The wildcard guards: the four statements decision 270 moved out of the database, refusing what
 * they refused.
 *
 * Grizzle cannot pair a seeded roster column with an author's free-text namespace, so the facts
 * about a foreign element's or attribute's namespace that spec 4.3 and 4.4 state (rules W1 and W2,
 * W3, W6 and W7 of 4.9) are judged here, over the rows an import built before any of them is
 * written, against the arrays the seeded policy tables print. The walk (`src/import/wildcard.ts`)
 * already types a declared global, so the importer never writes a row that W3 or W7 refuses; those
 * two are a copy it cannot breach. W1, W2 and W6 are reached by authors' content (`q:foo` on
 * `qti-custom-operator`, decision 257).
 */
import { Effect, Schema } from "effect";
import { Rows } from "#pantry/import/tree.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import {
  attributeExclusion,
  globalAttribute,
  globalElement,
  wildcardExclusion,
} from "#pantry/schema/seed/wildcard.ts";
import type { GlobalRow, HostNamespaceRow } from "#pantry/schema/seed/wildcard.ts";

/**
 * A wildcard guard refused the rows.
 *
 * `rule` names the guard and `detail` the first row that broke it.
 */
export class WildcardGuardRefusal extends Schema.TaggedError<WildcardGuardRefusal>()(
  "WildcardGuardRefusal",
  {
    detail: Schema.String,
    rule: Schema.Literals(["wildcard-namespace", "wildcard-declared"]),
  },
) {}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = WildcardGuardRefusal | undefined;

const refuse = (rule: WildcardGuardRefusal["rule"], detail: string): WildcardGuardRefusal =>
  new WildcardGuardRefusal({ detail, rule });

/**
 * The key a namespace and a name make together. A namespace is a URI and a local name an NCName,
 * and neither holds a space, so the space cannot join two keys into one.
 */
const joined = (...parts: readonly string[]): string => parts.join(" ");

const hostKeys = (rows: readonly HostNamespaceRow[]): ReadonlySet<string> =>
  new Set(rows.map((row) => joined(row.host, row.namespace)));

const globalKeys = (rows: readonly GlobalRow[]): ReadonlySet<string> =>
  new Set(rows.map((row) => joined(row.set, row.namespace, row.local)));

const excludedElements = hostKeys(wildcardExclusion);

const excludedAttributes = hostKeys(attributeExclusion);

const declaredElements = globalKeys(globalElement);

const declaredAttributes = globalKeys(globalAttribute);

const named = (namespace: string, local: string): string =>
  namespace === "" ? `"${local}" with no namespace` : `"${local}" in the namespace "${namespace}"`;

/**
 * `wildcard-namespace` (W1, W2 and the MathML rows): a foreign element whose parent's wildcard
 * excludes its namespace.
 */
const elementNamespace = (rows: Rows): Finding => {
  const found = Rows.of(rows, ForeignElement).find((row) =>
    excludedElements.has(joined(row.parentKind, row.namespace)),
  );

  return found === undefined
    ? undefined
    : refuse(
        "wildcard-namespace",
        `ForeignElement ${found.id} is the element ${named(found.namespace, found.local)} under ${found.parentKind}, whose wildcard excludes that namespace; write an element from a namespace the wildcard admits.`,
      );
};

/**
 * `wildcard-declared` (W3): a foreign element that its schema set declares as a global element.
 */
const elementDeclared = (rows: Rows): Finding => {
  const found = Rows.of(rows, ForeignElement).find((row) =>
    declaredElements.has(joined(row.schemaSet, row.namespace, row.local)),
  );

  return found === undefined
    ? undefined
    : refuse(
        "wildcard-declared",
        `ForeignElement ${found.id} is the element ${named(found.namespace, found.local)}, which the ${found.schemaSet} schema set declares; write it as itself, not as foreign content.`,
      );
};

/**
 * `wildcard-namespace` (W6): a foreign attribute whose host's attribute wildcard excludes its
 * namespace.
 */
const attributeNamespace = (rows: Rows): Finding => {
  const found = Rows.of(rows, ForeignAttribute).find((row) =>
    excludedAttributes.has(joined(row.kind, row.namespace)),
  );

  return found === undefined
    ? undefined
    : refuse(
        "wildcard-namespace",
        `ForeignAttribute ${found.local} on node ${found.node} is the attribute ${named(found.namespace, found.local)} on ${found.kind}, whose wildcard excludes that namespace; write an attribute from a namespace the wildcard admits.`,
      );
};

/**
 * `wildcard-declared` (W7): a lax foreign attribute that its schema set declares as a global
 * attribute. Only `lax` is judged (decision 108); a `skip` attribute is not this check's.
 */
const attributeDeclared = (rows: Rows): Finding => {
  const found = Rows.of(rows, ForeignAttribute).find(
    (row) =>
      row.process === "lax" &&
      declaredAttributes.has(joined(row.schemaSet, row.namespace, row.local)),
  );

  return found === undefined
    ? undefined
    : refuse(
        "wildcard-declared",
        `ForeignAttribute ${found.local} on node ${found.node} is the attribute ${named(found.namespace, found.local)}, which the ${found.schemaSet} schema set declares; write it as itself, not as foreign content.`,
      );
};

/**
 * Refuse foreign rows that break one of the four wildcard facts: an element or attribute in a
 * namespace its host's wildcard excludes, and an element or lax attribute that the schema set
 * declares.
 *
 * The first refusal found, in that order, is the failure. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link WildcardGuardRefusal}
 *   otherwise.
 */
export const wildcardGuards = Effect.fn("wildcardGuards")(function* wildcardGuards(
  rows: Rows,
): Effect.fn.Return<void, WildcardGuardRefusal> {
  const found =
    elementNamespace(rows) ??
    elementDeclared(rows) ??
    attributeNamespace(rows) ??
    attributeDeclared(rows);
  if (found !== undefined) {
    yield* found;
  }
});
