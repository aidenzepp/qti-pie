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
 * document a resource names: never the manifest, which is no resource's document (reading 115:
 * "Fragments are packaged as separate resources"; reading 146: a resource whose href names the
 * manifest names no document), so a site whose href names it names no document. The contexts are
 * a fixpoint over the sites: a fragment a fragment includes inherits through the includer's own
 * context, and a chain that returns to a document on it, which the database refuses as an
 * inclusion cycle, is cut where the walk meets the bound.
 */
import { Array as Arr, Option } from "effect";
import type { Kind } from "#pantry/grammar/compose.ts";
import { includeParentKinds } from "#pantry/grammar/install.ts";
import type { Flag } from "#pantry/grammar/install.ts";
import { foldAt, foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import { entryPathOf, hrefResolverOf } from "#pantry/import/overlays/package.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { assembledRoots } from "#pantry/vocab/terms/tests.ts";

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
   * Whether the document is a resource's, so a site may name it: every listed document but the
   * manifest, which is no resource's (spec reading 146).
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
 * One listed document as {@link contextsOf} judges it: the listing as given, its context, and
 * whether it is in an assembly and whether a site names it.
 */
export interface Judged<L extends Listed> {
  /**
   * Whether the document is in an assembly: a test or a section, or a document that holds a site or
   * that a site names, each with Q5.13's `TestDocument` row (`Document.assembled`).
   */
  readonly assembled: boolean;
  readonly context: DocumentContext;
  readonly listed: L;
  /**
   * Whether a site names the document, so it is an instance under every document that places it
   * (Q5.13's `Instance`), and the root of an assembly of its own unless an include splices it in
   * place (`splicingParents`, spec reading 117).
   */
  readonly targeted: boolean;
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
 * One listed document at one step of the fixpoint: the listing as given, its reading, and its
 * present context.
 */
interface Judging<L extends Listed> {
  readonly context: DocumentContext;
  readonly listed: L;
  readonly read: Read;
}

/**
 * Read one listed document's sites: each section ref and each include the information model reads,
 * an include written as a site even with no href, as Q5.13's builder writes it, and each resolved
 * as its `ReferencePath` is (`hrefResolverOf`: against the `xml:base` in scope or the document's
 * path).
 *
 * @param document - The document.
 * @returns Its reading.
 * @throws {Error} When a node's parent is no node of the document's rows, which `flatten` rules
 *   out: it writes every node's parent, the document node as its own.
 */
const readOf = ({ idOf, path, tree }: Listed): Read => {
  const rows = flatten(tree, idOf);
  const kindOf = new Map(rows.nodes.map((node) => [node.id, node.kind] as const));
  const parentKindOf = (node: NodeRow<Composed>): Kind =>
    Option.getOrThrowWith(
      Option.fromUndefinedOr(kindOf.get(node.parent)),
      () =>
        new Error(
          `Node ${node.id}'s parent ${node.parent} is no node of its document's rows, but flatten writes every node's parent, the document node as its own. Read each document's sites in the rows flatten wrote for it.`,
        ),
    );
  const hrefs = new Map(
    rows.attributes
      .filter(({ name }) => name === "href")
      .map(({ lexical, node }) => [node, lexical] as const),
  );
  const resolve = hrefResolverOf(rows, path);
  const written = rows.nodes.filter(
    (node) =>
      isSiteKind(node.kind, parentKindOf(node)) &&
      (hrefs.has(node.id) || node.kind === "xi:include"),
  );

  return {
    assembledRoot: assembledRoots.some((root) => root === tree.root.kind),
    holdsSites: written.length > 0,
    nodes: rows.nodes,
    self: rows.document.node,
    sites: written.flatMap((node): readonly SiteOf[] =>
      Option.fromUndefinedOr(hrefs.get(node.id)).pipe(
        Option.flatMap((href) => entryPathOf(resolve(node.id, href))),
        Option.map((resolved) => ({ node: node.id, path: resolved })),
        Option.toArray,
      ),
    ),
  };
};

/**
 * One site that names a listed document: the document, and the site's fold under its including
 * document's present context.
 */
interface Reach {
  readonly folded: Folded;
  readonly target: NodeId;
}

/**
 * Judge a document under the sites that name it, in listing order: its ancestry the union of
 * theirs, and its nearest interaction the first one a site stands in, else its own document node.
 * A document no site names is judged as it stands, its own context.
 *
 * @param self - The document node's id.
 * @param reaches - The sites that name it, in listing order.
 * @returns Its context.
 */
const contextUnder = (self: NodeId, reaches: readonly Reach[]): DocumentContext => {
  const ancestry = new Set(reaches.flatMap(({ folded }) => [...folded.ancestry]));

  return Option.match(
    Arr.findFirst(reaches, ({ folded }) => folded.nearestKind !== "document"),
    {
      onNone: () => ({ ...ownContext(self), ancestry }),
      onSome: ({ folded: { nearest, nearestKind } }) => ({ ancestry, nearest, nearestKind }),
    },
  );
};

/**
 * Take one step of the fixpoint: each document's context under every site's, read through its
 * including document's present context.
 *
 * @param judging - The documents, each with its present context.
 * @param byPath - The document node at each path.
 * @returns The documents, in the same order, each with its next context.
 */
const stepOf = <L extends Listed>(
  judging: readonly Judging<L>[],
  byPath: ReadonlyMap<string, NodeId>,
): readonly Judging<L>[] => {
  const reached = Map.groupBy(
    judging.flatMap(({ context, read: { nodes, sites } }): readonly Reach[] => {
      const folds = foldOf(nodes, context);

      return sites.flatMap(({ node, path }) =>
        Option.toArray(
          Option.map(Option.fromUndefinedOr(byPath.get(path)), (target) => ({
            folded: foldAt(folds, node),
            target,
          })),
        ),
      );
    }),
    ({ target }) => target,
  );

  return judging.map(({ listed, read }) => ({
    context: contextUnder(read.self, reached.get(read.self) ?? []),
    listed,
    read,
  }));
};

/**
 * Decide whether two contexts of one document, at two steps of the fixpoint, agree.
 *
 * An ancestry only grows from one step to the next: the walk starts from none, and each step's is
 * the union of its sites' folds, each the including document's present ancestry with the flags
 * its path enters (`foldOf`). So the later ancestry is the earlier one exactly where it holds no
 * flag the earlier lacks.
 *
 * @param was - The earlier context.
 * @param next - The later context.
 * @returns Whether they agree.
 */
const settledOn = (was: DocumentContext, next: DocumentContext): boolean =>
  was.nearest === next.nearest &&
  was.nearestKind === next.nearestKind &&
  [...next.ancestry].every((flag) => was.ancestry.has(flag));

/**
 * Judge every listed document: its context, and whether it is in an assembly and a site names it.
 *
 * @param documents - The package's documents, each with the ids its rows are written under, and
 *   whether a site may name it.
 * @returns Each document as judged, in the order given.
 */
export const contextsOf = <L extends Listed>(documents: readonly L[]): readonly Judged<L>[] => {
  let judging: readonly Judging<L>[] = documents.map((listed) => {
    const read = readOf(listed);

    return { context: ownContext(read.self), listed, read };
  });
  const byPath = new Map<string, NodeId>();
  for (const { listed, read } of judging) {
    if (listed.named && !byPath.has(listed.path)) {
      byPath.set(listed.path, read.self);
    }
  }

  const targeted = new Set(
    judging.flatMap(({ read: { sites } }) =>
      sites.flatMap(({ path }) => Option.toArray(Option.fromUndefinedOr(byPath.get(path)))),
    ),
  );
  for (let round = 0; round <= documents.length; round += 1) {
    const next = stepOf(judging, byPath);
    const settled = Arr.zip(judging, next).every(([was, now]) =>
      settledOn(was.context, now.context),
    );
    judging = next;
    if (settled) {
      break;
    }
  }

  return judging.map(({ context, listed, read: { assembledRoot, holdsSites, self } }) => ({
    assembled: assembledRoot || holdsSites || targeted.has(self),
    context,
    listed,
    targeted: targeted.has(self),
  }));
};
