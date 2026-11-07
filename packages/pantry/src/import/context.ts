/**
 * The context each listed document is judged in (spec readings 85 and 117): the ancestry and the
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
 * particle (spec reading 114), whose href resolves, as its `ReferencePath` does, to a listed
 * document a resource names: never the manifest, which no resource names (reading 115: "Fragments
 * are packaged as separate resources"), so a site whose href names it names no document. The
 * contexts are a fixpoint over the sites: a fragment a fragment includes inherits through the
 * includer's own context, and a chain that returns to a document on it, which the database refuses
 * as an inclusion cycle, is cut where the walk meets the bound.
 */
import { Option } from "effect";
import type { Kind } from "#pantry/grammar/compose.ts";
import { includeParentKinds } from "#pantry/grammar/install.ts";
import type { Flag } from "#pantry/grammar/install.ts";
import { foldOf } from "#pantry/import/fold.ts";
import { entryPathOf, hrefResolverOf } from "#pantry/import/overlays/package.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
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
 * The kinds an include is a site under (spec reading 114).
 */
const includeParents: ReadonlySet<string> = new Set(includeParentKinds);

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
  /**
   * Whether a resource names the document, so a site may name it: every listed document but the
   * manifest.
   */
  readonly named: boolean;
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
 * Every listed document's context, and the documents some site names, each an instance under every
 * document that places it (Q5.13's `Instance`), and the root of an assembly of its own unless an
 * include splices it in place (`splicingParents`, spec reading 117).
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
  readonly nodes: readonly NodeRow<Composed>[];
  readonly self: NodeId;
  readonly sites: readonly SiteOf[];
}

/**
 * Read one listed document's sites: each section ref and each include the information model reads,
 * an include written as a site even with no href, as Q5.13's builder writes it, and each resolved
 * as its `ReferencePath` is (`hrefResolverOf`: against the `xml:base` in scope or the document's
 * path).
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
  const resolve = hrefResolverOf(rows, path);
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
      const href = hrefs.get(node.id);
      const resolved = href === undefined ? undefined : entryPathOf(resolve(node.id, href));

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
    const folds = foldOf(nodes, contexts.get(self) ?? ownContext(self));
    for (const site of sites) {
      const target = byPath.get(site.path);
      const folded = folds.get(site.node);
      if (target !== undefined && folded !== undefined) {
        const union = unions.get(target) ?? new Set<FlagHandle>();
        for (const flag of folded.ancestry) {
          union.add(flag);
        }

        unions.set(target, union);

        if (folded.nearestKind !== "document" && !nearests.has(target)) {
          nearests.set(target, { kind: folded.nearestKind, node: folded.nearest });
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
 * @param documents - The package's documents, each with the ids its rows are written under, and
 *   whether a site may name it.
 * @returns Each document's context, by its document node's id, and the documents sites name.
 */
export const contextsOf = (documents: readonly Listed[]): Contexts => {
  const read = documents.map(readOf);
  const byPath = new Map<string, NodeId>();
  for (const [at, { named, path }] of documents.entries()) {
    const self = read[at]?.self;
    if (named && self !== undefined && !byPath.has(path)) {
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
