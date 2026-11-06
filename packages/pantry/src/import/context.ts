/**
 * The context each listed document is judged in (spec readings 76 and 110): the ancestry and the
 * nearest interaction its document node holds, which every node below it inherits.
 *
 * A document no site names is judged as it stands: no ancestry, its own document node as its
 * nearest interaction. A document sites name (an included fragment, or a section document a section
 * ref places) is judged where it is placed: its ancestry is the union of the ancestries of the
 * sites that name it (`Document.context`, the database's fold over `Site`), and its nearest
 * interaction is the one interaction a site that names it stands in, else its own document node.
 * Where two sites disagree on the interaction, the first in listing order is written, and the
 * database refuses the other under the stated limit "Fragment context".
 *
 * A site is a section ref, or an `xi:include` under a parent whose model holds an explicit include
 * particle (spec reading 107), whose href resolves, as its `ReferencePath` does, to a listed
 * document. The contexts are a fixpoint over the sites: a fragment a fragment includes inherits
 * through the includer's own context, and a chain that returns to a document on it, which the
 * database refuses as an inclusion cycle, is cut where the walk meets the bound.
 */
import { Option } from "effect";
import type { Kind } from "#pantry/grammar/compose.ts";
import { Enters, includeParentKinds, interactionKinds } from "#pantry/grammar/install.ts";
import type { Flag } from "#pantry/grammar/install.ts";
import { directoryOf, referencePiecesOf, resolvedPathOf } from "#pantry/import/overlays/package.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, XdmDocument } from "#pantry/model/xdm.ts";
import { assembledRoots } from "#pantry/qti/tests.ts";

/**
 * An ancestry flag's handle.
 */
export type FlagHandle = (typeof Flag.handles)[number];

/**
 * A document's context: the flags its document node's ancestry holds, and its nearest interaction
 * with that interaction's kind, `document` for the document node itself.
 */
export interface DocumentContext {
  readonly ancestry: ReadonlySet<FlagHandle>;
  readonly nearest: NodeId;
  readonly nearestKind: Kind;
}

/**
 * A listed document a site may name, as the site's row copies it: its document node, its root
 * element's kind and its context.
 */
export interface ListedTarget {
  readonly context: DocumentContext;
  readonly node: NodeId;
  readonly rootKind: Kind;
}

/**
 * The context of a document no site names: no ancestry, and its own document node.
 *
 * @param self - The document node's id.
 * @returns The context.
 */
export const ownContext = (self: NodeId): DocumentContext => ({
  ancestry: new Set(),
  nearest: self,
  nearestKind: "document",
});

/**
 * The flags each kind enters for its descendants, the installed `Enters`.
 */
const entersAt: ReadonlyMap<string, readonly FlagHandle[]> = new Map(
  [...Map.groupBy(Enters.rows, ({ kind }) => kind)].map(
    ([kind, rows]) => [kind, rows.map(({ flag }) => flag)] as const,
  ),
);

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The kinds an include is a site under (spec reading 107).
 */
const includeParents: ReadonlySet<string> = new Set(includeParentKinds);

/**
 * What each node of a document inherits under a context: its ancestry and its nearest interaction
 * with that interaction's kind, by its id.
 */
export interface Inherited {
  readonly ancestry: ReadonlyMap<NodeId, ReadonlySet<FlagHandle>>;
  readonly nearest: ReadonlyMap<NodeId, NodeId>;
  readonly nearestKind: ReadonlyMap<NodeId, Kind>;
}

/**
 * Walk a document's nodes under a context: each node's ancestry is its parent's with the flags its
 * kind enters (`E1_derived`), and its nearest interaction its parent where the parent is an
 * interaction, else its parent's (N8); the document node's are its context's.
 *
 * @param nodes - The document's node rows in document order, so each parent precedes its children.
 * @param context - The document's context.
 * @returns What each node inherits.
 */
export const inheritedOf = (
  nodes: readonly { readonly id: NodeId; readonly kind: Kind; readonly parent: NodeId }[],
  context: DocumentContext,
): Inherited => {
  const kinds = new Map<NodeId, Kind>();
  const ancestry = new Map<NodeId, ReadonlySet<FlagHandle>>();
  const nearest = new Map<NodeId, NodeId>();
  const nearestKind = new Map<NodeId, Kind>();

  for (const node of nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      ancestry.set(node.id, context.ancestry);
      nearest.set(node.id, context.nearest);
      nearestKind.set(node.id, context.nearestKind);
      continue;
    }

    const parentKind = kinds.get(node.parent) ?? "document";
    ancestry.set(
      node.id,
      new Set([...(ancestry.get(node.parent) ?? []), ...(entersAt.get(node.kind) ?? [])]),
    );
    if (interactions.has(parentKind)) {
      nearest.set(node.id, node.parent);
      nearestKind.set(node.id, parentKind);
    } else {
      nearest.set(node.id, nearest.get(node.parent) ?? node.parent);
      nearestKind.set(node.id, nearestKind.get(node.parent) ?? "document");
    }
  }

  return { ancestry, nearest, nearestKind };
};

/**
 * Whether a node is a site: a section ref, or an include under a parent that holds an explicit
 * include particle.
 *
 * @param kind - The node's kind.
 * @param parentKind - Its parent's kind.
 * @returns Whether it is.
 */
export const isSiteKind = (kind: string, parentKind: string): boolean =>
  kind === "qti-assessment-section-ref" ||
  (kind === "xi:include" && includeParents.has(parentKind));

/**
 * One listed document as the contexts read it.
 */
interface Listed {
  readonly idOf: (index: number) => NodeId;
  readonly path: string;
  readonly tree: XdmDocument<Composed>;
}

/**
 * One site as the fixpoint reads it: the site node and the path its href names.
 */
interface SiteOf {
  readonly node: NodeId;
  readonly path: string;
}

/**
 * Every listed document's context, and the documents some site names, each the root of an
 * assembly of its own and an instance under every document that places it (Q5.13's `Instance`).
 */
export interface Contexts {
  /**
   * The documents in an assembly: a test or a section, or a document that holds a site or that a
   * site names, each with Q5.13's `TestDocument` row (`Document.assembled`).
   */
  readonly assembled: ReadonlySet<NodeId>;
  readonly contexts: ReadonlyMap<NodeId, DocumentContext>;
  readonly targeted: ReadonlySet<NodeId>;
}

/**
 * One listed document as the fixpoint reads it: its nodes, its document node, its sites and
 * whether it holds one or is a test's or a section's.
 */
interface Read {
  readonly assembledRoot: boolean;
  readonly holdsSites: boolean;
  readonly nodes: readonly { readonly id: NodeId; readonly kind: Kind; readonly parent: NodeId }[];
  readonly self: NodeId;
  readonly sites: readonly SiteOf[];
}

/**
 * Read one listed document's sites: each section ref and each include the information model reads,
 * an include written as a site even with no href, as Q5.13's builder writes it, and each resolved
 * against the document's directory.
 *
 * @param document - The document.
 * @returns Its reading.
 */
const readOf = ({ idOf, path, tree }: Listed): Read => {
  const rows = flatten(tree, idOf);
  const kindOf = new Map(rows.nodes.map((node) => [node.id, node.kind] as const));
  const hrefs = new Map(
    rows.attributes
      .filter(({ name }) => name === "href")
      .map(({ lexical, node }) => [node, lexical] as const),
  );
  const { directory } = directoryOf(path);
  const written = rows.nodes.filter(
    (node) =>
      isSiteKind(node.kind, kindOf.get(node.parent) ?? "") &&
      (hrefs.has(node.id) || node.kind === "xi:include"),
  );

  return {
    assembledRoot: assembledRoots.some((root) => root === tree.root.kind),
    holdsSites: written.length > 0,
    nodes: rows.nodes,
    self: rows.document.node,
    sites: written.flatMap((node): readonly SiteOf[] => {
      const resolved = resolvedPathOf(
        directory,
        referencePiecesOf(hrefs.get(node.id) ?? "").target,
      );

      return resolved === undefined ? [] : [{ node: node.id, path: resolved }];
    }),
  };
};

/**
 * Take one step of the fixpoint: each document's context under every site's, read through its
 * including document's present context.
 *
 * @param read - The documents.
 * @param byPath - The document node at each path.
 * @param contexts - The present contexts.
 * @returns The next contexts.
 */
const stepOf = (
  read: readonly Read[],
  byPath: ReadonlyMap<string, NodeId>,
  contexts: ReadonlyMap<NodeId, DocumentContext>,
): ReadonlyMap<NodeId, DocumentContext> => {
  const unions = new Map<NodeId, Set<FlagHandle>>();
  const nearests = new Map<NodeId, { readonly kind: Kind; readonly node: NodeId }>();
  for (const { nodes, self, sites } of read) {
    const inherited = inheritedOf(nodes, contexts.get(self) ?? ownContext(self));
    for (const site of sites) {
      const target = byPath.get(site.path);
      if (target !== undefined) {
        const union = unions.get(target) ?? new Set<FlagHandle>();
        for (const flag of inherited.ancestry.get(site.node) ?? []) {
          union.add(flag);
        }

        unions.set(target, union);

        const kind = inherited.nearestKind.get(site.node) ?? "document";
        const node = inherited.nearest.get(site.node);
        if (kind !== "document" && node !== undefined && !nearests.has(target)) {
          nearests.set(target, { kind, node });
        }
      }
    }
  }

  return new Map(
    read.map(({ self }) => {
      const near = nearests.get(self);

      return [
        self,
        {
          ancestry: unions.get(self) ?? new Set<FlagHandle>(),
          nearest: near?.node ?? self,
          nearestKind: near?.kind ?? "document",
        },
      ] as const;
    }),
  );
};

/**
 * Decide whether two steps of the fixpoint agree on every document's context.
 *
 * @param held - The earlier contexts.
 * @param next - The later contexts.
 * @returns Whether they agree.
 */
const settledOn = (
  held: ReadonlyMap<NodeId, DocumentContext>,
  next: ReadonlyMap<NodeId, DocumentContext>,
): boolean =>
  [...next].every(([self, context]) => {
    const was = held.get(self);

    return (
      was !== undefined &&
      was.nearest === context.nearest &&
      was.nearestKind === context.nearestKind &&
      was.ancestry.size === context.ancestry.size &&
      [...context.ancestry].every((flag) => was.ancestry.has(flag))
    );
  });

/**
 * Compute every listed document's context.
 *
 * @param documents - The package's documents, each with the ids its rows are written under.
 * @returns Each document's context, by its document node's id, and the documents sites name.
 */
export const contextsOf = (documents: readonly Listed[]): Contexts => {
  const read = documents.map(readOf);
  const byPath = new Map<string, NodeId>();
  for (const [at, { path }] of documents.entries()) {
    const self = read[at]?.self;
    if (self !== undefined && !byPath.has(path)) {
      byPath.set(path, self);
    }
  }

  const targeted = new Set(
    read.flatMap(({ sites }) =>
      sites.flatMap(({ path }) => Option.toArray(Option.fromNullishOr(byPath.get(path)))),
    ),
  );
  let contexts: ReadonlyMap<NodeId, DocumentContext> = new Map(
    read.map(({ self }) => [self, ownContext(self)] as const),
  );
  for (let round = 0; round <= read.length; round += 1) {
    const next = stepOf(read, byPath, contexts);
    const settled = settledOn(contexts, next);
    contexts = next;
    if (settled) {
      break;
    }
  }

  return {
    assembled: new Set(
      read
        .filter(
          ({ assembledRoot, holdsSites, self }) =>
            assembledRoot || holdsSites || targeted.has(self),
        )
        .map(({ self }) => self),
    ),
    contexts,
    targeted,
  };
};

/**
 * Read a context by its document node, the document's own where none is held.
 *
 * @param contexts - The contexts.
 * @param self - The document node's id.
 * @returns Its context.
 */
export const contextAt = (
  contexts: ReadonlyMap<NodeId, DocumentContext>,
  self: NodeId,
): DocumentContext =>
  Option.getOrElse(Option.fromNullishOr(contexts.get(self)), () => ownContext(self));
