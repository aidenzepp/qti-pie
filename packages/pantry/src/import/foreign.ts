/**
 * The foreign rows of a tree (spec W07): the `ForeignElement` row of every `foreign` node and the
 * `ForeignAttribute` row of every attribute the wildcard classification calls foreign.
 *
 * A pure builder over the tree the walk of `treeRows` indexed, called once from `treeRows` after
 * the walk, the seam every tree builder shares, so no document builder calls it. It writes rows
 * for any tree and any host: an attribute is stored here when {@link isForeignAttribute} says so,
 * on a `foreign` node or on a kind with an `AttributeWildcard` row of whatever process (a MathML
 * node's `##other` attributes among them), and the typed names of such a node are
 * `attributes.ts`'s.
 */
import type { Fact } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { NodeIndex, TreeInput } from "#pantry/import/tree.ts";
import { isForeignAttribute, scopeOf } from "#pantry/import/wildcard.ts";
import type { ProcessContentsHandle, SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import { NamespaceUri, XmlLocalName } from "#pantry/schema/contracts.ts";
import type { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import type { RegistryRow } from "#pantry/schema/kinds/generic.ts";
import type { NodeKindHandle, RootKindHandle } from "#pantry/schema/node.ts";
import { registries } from "#pantry/schema/seed/admission.ts";
import { attributeWildcard, rootSchemaSet } from "#pantry/schema/seed/wildcard.ts";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";

/**
 * The foreign rows of one tree, by relation.
 */
export interface ForeignFacts {
  readonly attributes: readonly Fact<typeof ForeignAttribute>[];
  readonly elements: readonly Fact<typeof ForeignElement>[];
}

const setOfRoot: ReadonlyMap<RootKindHandle, SchemaSetHandle> = new Map(
  rootSchemaSet.map((row) => [row.root, row.set]),
);

/**
 * The process of each attribute wildcard host, by kind, whatever its process: `lax`, or `strict`.
 */
const hostProcess: ReadonlyMap<string, ProcessContentsHandle> = new Map(
  attributeWildcard.map((row) => [row.host, row.process]),
);

/**
 * The attribute names each kind's registry lists, from the composed registry list. The `foreign`
 * kind is in none of them, so it owns no name.
 */
const registryNames: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  registries.flatMap((registry) =>
    Object.entries<RegistryRow>(registry).map(
      ([kind, row]) => [kind, new Set(row.attributes)] as const,
    ),
  ),
);

/**
 * The attribute names the registry of `kind` lists: the `own` set the wildcard classification of
 * an element of that kind reads.
 *
 * @param kind - The element's kind.
 * @returns The names, none when the kind has no registry row.
 */
export const ownNames = (kind: NodeKindHandle): ReadonlySet<string> =>
  registryNames.get(kind) ?? new Set();

/**
 * The schema set a root kind is judged against.
 *
 * @param root - The tree's root kind.
 * @returns Its set, `None` for a root kind no `RootSchemaSet` row names.
 */
export const schemaSetOf = (root: RootKindHandle): Option.Option<SchemaSetHandle> =>
  Option.fromNullishOr(setOfRoot.get(root));

/**
 * The attributes of `element` that are foreign on a node of `kind`, in the order written.
 */
const foreignOf = (
  scope: ReturnType<typeof scopeOf>,
  element: Element,
  kind: NodeKindHandle,
): readonly Attribute[] => {
  const own = ownNames(kind);

  return element.attributes.filter((attribute) => isForeignAttribute(scope, attribute, kind, own));
};

/**
 * Build the foreign rows of a tree.
 *
 * Each `foreign` node becomes a `ForeignElement` row with its namespace, local name and prefix as
 * written, the kind of its parent, and the tree's root kind and schema set. Each attribute
 * {@link isForeignAttribute} calls foreign becomes a `ForeignAttribute` row with its expanded name,
 * its prefix as written, its value as written (free text is kept as written), the host's kind and
 * the host's `AttributeWildcard` process.
 *
 * @param root - The root element of the tree.
 * @param nodes - The node each element became, from the tree walk.
 * @param input - The tree's root kind and schema version.
 * @returns The rows, none for a root kind no schema set judges.
 */
export const foreignRows = (
  root: Element,
  nodes: NodeIndex,
  input: Pick<TreeInput, "root" | "version">,
): ForeignFacts => {
  const set = schemaSetOf(input.root);
  const elements: Fact<typeof ForeignElement>[] = [];
  const attributes: Fact<typeof ForeignAttribute>[] = [];
  if (Option.isNone(set)) {
    return { attributes, elements };
  }

  const scope = scopeOf(input.root, input.version);
  const shared = { rootKind: input.root, schemaSet: set.value };
  const visit = (element: Element, parent: Option.Option<NodeKindHandle>): void => {
    const node = nodes.get(element);
    if (node === undefined) {
      return;
    }

    if (node.kind === "foreign" && Option.isSome(parent)) {
      elements.push({
        id: node.id,
        local: XmlLocalName(element.local),
        namespace: NamespaceUri(element.namespace),
        parentKind: parent.value,
        prefix: element.prefix,
        ...shared,
      });
    }

    const process = hostProcess.get(node.kind);
    if (process !== undefined) {
      for (const attribute of foreignOf(scope, element, node.kind)) {
        attributes.push({
          kind: node.kind,
          local: XmlLocalName(attribute.local),
          namespace: NamespaceUri(attribute.namespace),
          node: node.id,
          prefix: attribute.prefix,
          process,
          value: attribute.value,
          ...shared,
        });
      }
    }

    for (const child of element.children) {
      if (child.kind === "element") {
        visit(child, Option.some(node.kind));
      }
    }
  };
  visit(root, Option.none());

  return { attributes, elements };
};
