/**
 * The wildcard classification of the tree walk (spec 4.1 and 4.5): which kind an element is inside
 * wildcard content, and whether an attribute is the registry's, typed by a declaration, foreign or
 * a stray.
 *
 * Pure functions over the seed tables of `seed/wildcard.ts` and the kinds files' rows
 * `seed/admission.ts` composes, so a host or a global a later unit appends changes the answer with
 * no edit here. `tree.ts` calls them for every element and attribute it walks; `kindOf` stays what
 * it was and its answer comes in as a parameter, since `tree.ts` owns it.
 */
import { Option } from "effect";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";
import type { ProcessContentsHandle, SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { NodeKindHandle, RootKindHandle, SchemaVersionHandle } from "#pantry/schema/node.ts";
import { attributeAdmission, explicitAdmission } from "#pantry/schema/seed/admission.ts";
import {
  attributeWildcard,
  globalAttribute,
  globalElement,
  namespaces,
  opaqueGlobals,
  rootSchemaSet,
  strictAttributeHosts,
  wildcardHost,
} from "#pantry/schema/seed/wildcard.ts";

/**
 * What a classification depends on besides the element: the root kind of the tree, which names its
 * schema set, and the schema version the tree is read under.
 */
export interface Scope {
  readonly root: RootKindHandle;
  readonly version: SchemaVersionHandle;
}

/**
 * How an attribute stands on its element.
 *
 * - `xmlns`: a namespace declaration, which no registry lists and nothing judges.
 * - `declared`: one of the four attributes XML Schema declares in the `xsi` namespace (`type`, `nil`,
 *   `schemaLocation`, `noNamespaceSchemaLocation`), never typed or foreign here.
 * - `own`: a name the element's registry lists.
 * - `typed`: a global attribute of the tree's schema set that the element's kind admits as typed.
 * - `foreign`: an attribute a wildcard admits and no declaration types.
 * - `stray`: an attribute nothing admits.
 */
export type AttributeClass = "declared" | "foreign" | "own" | "stray" | "typed" | "xmlns";

/**
 * The scope of a tree.
 *
 * @param root - The tree's root kind.
 * @param version - The tree's schema version.
 * @returns The scope its classifications run in.
 */
export const scopeOf = (root: RootKindHandle, version: SchemaVersionHandle): Scope => ({
  root,
  version,
});

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The four attributes XML Schema declares in the `xsi` namespace (Part 1, 3.2.7). They are excluded
 * by name, not through `globalAttribute`.
 */
const declaredXsi: ReadonlySet<string> = new Set([
  "type",
  "nil",
  "schemaLocation",
  "noNamespaceSchemaLocation",
]);

const clark = (namespace: string, local: string): string => `{${namespace}}${local}`;

const inSet = (set: SchemaSetHandle, name: string): string => `${set}\u0000${name}`;

/**
 * The schema set each root kind is judged against.
 */
const setOfRoot: ReadonlyMap<RootKindHandle, SchemaSetHandle> = new Map(
  rootSchemaSet.map((row) => [row.root, row.set]),
);

/**
 * The process mode of each element wildcard host: `lax` hosts and `strict` ones.
 */
const hostProcess: ReadonlyMap<string, ProcessContentsHandle> = new Map(
  wildcardHost.map((row) => [row.host, row.process]),
);

const typedGlobals: ReadonlySet<string> = new Set(
  globalElement.map((row) => inSet(row.set, clark(row.namespace, row.local))),
);

const opaque: ReadonlySet<string> = new Set(
  opaqueGlobals.map((row) => inSet(row.set, clark(row.namespace, row.local))),
);

const admitted: ReadonlySet<string> = new Set(
  explicitAdmission.map((row) => `${row.version}\u0000${row.parent}\u0000${row.child}`),
);

/**
 * The attribute wildcard hosts.
 */
const attributeHosts: ReadonlySet<string> = new Set(attributeWildcard.map((row) => row.host));

/**
 * The prefix this repository gives each namespace of `AttributeName`'s qualified names.
 */
const prefixOf: ReadonlyMap<string, string> = new Map(
  Object.entries(namespaces).map(([prefix, namespace]) => [namespace, prefix]),
);

/**
 * The kinds whose attribute wildcard is `strict`: a declared global passes, any other qualified
 * name is refused.
 */
const strictHosts: ReadonlySet<string> = new Set(strictAttributeHosts);

const globalAttributes: ReadonlySet<string> = new Set(
  globalAttribute.map((row) => inSet(row.set, clark(row.namespace, row.local))),
);

const typedAttributes: ReadonlySet<string> = new Set(
  attributeAdmission.map((row) => `${row.kind}\u0000${row.attribute}`),
);

/**
 * The kind an element is, given what `kindOf` made of it.
 *
 * Inside a wildcard context, an element child of a lax host or of a `foreign` node, in order: the
 * host's explicit particle (`kindOf` names a kind and a kinds file's `Admission(version, parent,
 * kind)` row exists, the derived wildcard rows not counted); else a typed global of the tree's
 * schema set, which is its kind whether or not the derived `Admission` row exists (the database
 * refuses an absent row as `admission`) and, when no kind exists yet, none, so the caller refuses
 * it as unmodeled; a global of another set is neither, so it falls to the third step; else
 * `foreign`, whatever its namespace, an opaque global included. Under a strict host the third step
 * admits an opaque global only; any other element is none. Outside a wildcard context the answer is
 * `kindOf`'s.
 *
 * @param scope - The tree's scope.
 * @param element - The element to classify.
 * @param parent - The kind of its parent, `None` for the root.
 * @param named - What `kindOf` made of the element under that parent.
 * @returns The element's kind, `None` when no registry models it and no wildcard takes it.
 */
export const classifyElement = (
  scope: Scope,
  element: Element,
  parent: Option.Option<NodeKindHandle>,
  named: Option.Option<NodeKindHandle>,
): Option.Option<NodeKindHandle> => {
  const process = parent.pipe(
    Option.flatMap((above) => Option.fromNullishOr(hostProcess.get(above))),
  );
  if (Option.isNone(parent) || Option.isNone(process)) {
    return named;
  }

  if (
    Option.isSome(named) &&
    admitted.has(`${scope.version}\u0000${parent.value}\u0000${named.value}`)
  ) {
    return named;
  }

  const name = clark(element.namespace, element.local);
  const set = setOfRoot.get(scope.root);
  if (set !== undefined && typedGlobals.has(inSet(set, name))) {
    return named;
  }

  if (process.value === "strict" && !(set !== undefined && opaque.has(inSet(set, name)))) {
    return Option.none();
  }

  return Option.some("foreign");
};

/**
 * How `attribute` stands on an element of `kind`.
 *
 * On a `foreign` element every attribute but a namespace declaration and the four declared `xsi`
 * names is admitted; on a kind with a lax attribute wildcard the registry's names are its own, an
 * unqualified name beside them is a stray, and a qualified one is admitted. An admitted attribute
 * is typed when it is a global attribute of the tree's schema set and `AttributeAdmission` admits
 * it on the kind, foreign when it is no global of the set, and a stray when it is a global the kind
 * does not admit, which a foreign row could not hold. A `strictAttributeHosts` kind judges a
 * qualified name the same way but never answers foreign: a name that is no declared global of the
 * set is a stray (3.3 strict/b). Any other kind admits its own names only.
 *
 * @param scope - The tree's scope.
 * @param attribute - The attribute to classify.
 * @param kind - The kind of the element that carries it.
 * @param own - The attribute names the kind's registry lists.
 * @returns The attribute's class.
 */
export const classifyAttribute = (
  scope: Scope,
  attribute: Attribute,
  kind: NodeKindHandle,
  own: ReadonlySet<string>,
): AttributeClass => {
  const { local, namespace } = attribute;
  if (namespace === xmlnsNamespace) {
    return "xmlns";
  }

  if (namespace === xsiNamespace && declaredXsi.has(local)) {
    return "declared";
  }

  if (
    (namespace === "" && own.has(local)) ||
    (namespace === "http://www.w3.org/XML/1998/namespace" && own.has(`xml:${local}`))
  ) {
    return "own";
  }

  const strict = strictHosts.has(kind);
  if (kind !== "foreign" && !attributeHosts.has(kind) && !strict) {
    return "stray";
  }

  if (namespace === "") {
    return kind === "foreign" ? "foreign" : "stray";
  }

  const set = setOfRoot.get(scope.root);
  if (set === undefined || !globalAttributes.has(inSet(set, clark(namespace, local)))) {
    return strict ? "stray" : "foreign";
  }

  return typedAttributes.has(`${kind}\u0000${prefixOf.get(namespace) ?? ""}:${local}`)
    ? "typed"
    : "stray";
};

/**
 * Whether `attribute` is a foreign attribute of an element of `kind`: the predicate that tells the
 * attributes stored as `ForeignAttribute` rows from the typed ones.
 *
 * @param scope - The tree's scope.
 * @param attribute - The attribute to judge.
 * @param kind - The kind of the element that carries it.
 * @param own - The attribute names the kind's registry lists.
 * @returns Whether the attribute is foreign.
 */
export const isForeignAttribute = (
  scope: Scope,
  attribute: Attribute,
  kind: NodeKindHandle,
  own: ReadonlySet<string>,
): boolean => classifyAttribute(scope, attribute, kind, own) === "foreign";
