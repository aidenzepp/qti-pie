/**
 * The overlay rows of tests and sections (plan §1.7 O7, §C's `rowsOf`), each relation's rows a
 * keyed set.
 *
 * Two builders, as `#pantry/qti/tests.ts` has two layers:
 *
 * - {@link rowsOf} reads one document's XDM tree into its document-level rows: the document, its
 *   tokens and flags, names, sections and their parts, selections and orderings, sites, branch
 *   rules and the item each item ref names, each href resolved as its `ReferencePath` is
 *   (`#pantry/import/overlays/package.ts`).
 * - {@link assembledRowsOf} reads every document's rows of one package into the assemblies: one
 *   instance tree per document that heads one, every assembled document no include splices in place
 *   (`splicingParents` and `IncludeRoot`, spec reading 117), and, under a test, its instances'
 *   names, their projection and the branch rules' resolutions.
 *
 * The rows restate what the documents say and nothing else, and the database proves every one of
 * them (`testLaws`), so a row a builder gets wrong is refused, never accepted. Where a document
 * breaks a law, the builder still writes what the document says, so the law that refuses it is the
 * one its rows name: an inclusion cycle is cut where it closes, leaving the site that closes it
 * without the child it requires, so no instance repeats a document on its chain and the cycle's
 * law alone refuses it ("Inclusion cycle"), and a branch target with
 * no lawful candidate resolves to the first name that spells it, or to none.
 */
import { Option } from "effect";
import { Bits } from "@bjornpagen/grizzle";
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import type { Kind } from "#pantry/grammar/compose.ts";
import { booleanOf } from "#pantry/grammar/domains.ts";
import { Flag, grammar } from "#pantry/grammar/install.ts";
import { isSiteKind } from "#pantry/import/context.ts";
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import type { DocumentContext, ListedTarget } from "#pantry/import/context.ts";
import {
  directoryOf,
  entryPathOf,
  hrefResolverOf,
  referencePiecesOf,
} from "#pantry/import/overlays/package.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import {
  assembledRoots,
  branchRuleKind,
  exits,
  flagCarriers,
  includeKind,
  itemRefKind,
  mappingKind,
  namedKinds,
  partKind,
  sectionKind,
  sectionParts,
  splicingParents,
  stimulusRefKind,
  testKind,
} from "#pantry/qti/tests.ts";
import type {
  AssembledName,
  BranchResolution,
  BranchRule,
  BranchShuffle,
  BranchTarget,
  FlagName,
  Inclusion,
  Instance,
  InstanceName,
  Named,
  Section,
  SectionMember,
  SectionOrdering,
  SectionSelection,
  Site,
  SitePath,
  SiteTarget,
  StimulusRef,
  TestDocument,
  TestFlag,
  TestToken,
  VariableMapping,
} from "#pantry/qti/tests.ts";

/**
 * What one document's rows are written under: its nodes' ids, its package's id, its entry's path,
 * and the document nodes of its package by their paths, which a site's href names.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface TestIds {
  /**
   * Whether the document is in an assembly, as the importer's contexts read it; where none is
   * given, a test, a section, or a document that holds a site or that a site names.
   */
  readonly assembled?: boolean;
  /**
   * The document's context (spec reading 117), its own where none is given.
   */
  readonly context?: DocumentContext;
  readonly documentAt: (path: string) => Option.Option<NodeId>;
  /**
   * The document's type, the resource's that lists it, which each site copies from its include's
   * node.
   */
  readonly documentType: Addition<typeof Site>["documentType"];
  /**
   * Whether the package holds an entry at a path; where none is given, exactly where it holds a
   * document.
   */
  readonly entryAt?: (path: string) => boolean;
  readonly idOf: (index: number) => NodeId;
  readonly package: Uuid;
  readonly path: string;
  /**
   * The document a site's href names, with its root's kind and context; where none is given, the
   * document at the path, with the document node's own kind as its root.
   */
  readonly targetAt?: (path: string) => Option.Option<ListedTarget>;
  /**
   * Whether a site names the document, so it is an instance where it is placed; none read as no.
   */
  readonly targeted?: boolean;
}

/**
 * One document's overlay rows, one keyed set per relation: each map from the text of a row's key
 * to the row as its writer writes it. A row keyed by its node is keyed by its node's id; one keyed
 * by its node and a name by the two as a JSON array.
 */
export interface TestRows {
  readonly BranchRule: ReadonlyMap<string, Addition<typeof BranchRule>>;
  readonly Inclusion: ReadonlyMap<string, Addition<typeof Inclusion>>;
  readonly Named: ReadonlyMap<string, Addition<typeof Named>>;
  readonly Section: ReadonlyMap<string, Addition<typeof Section>>;
  readonly SectionMember: ReadonlyMap<string, Addition<typeof SectionMember>>;
  readonly SectionOrdering: ReadonlyMap<string, Addition<typeof SectionOrdering>>;
  readonly SectionSelection: ReadonlyMap<string, Addition<typeof SectionSelection>>;
  readonly Site: ReadonlyMap<string, Addition<typeof Site>>;
  readonly SitePath: ReadonlyMap<string, Addition<typeof SitePath>>;
  readonly SiteTarget: ReadonlyMap<string, Addition<typeof SiteTarget>>;
  readonly StimulusRef: ReadonlyMap<string, Addition<typeof StimulusRef>>;
  readonly TestDocument: ReadonlyMap<string, Addition<typeof TestDocument>>;
  readonly TestFlag: ReadonlyMap<string, Addition<typeof TestFlag>>;
  readonly TestToken: ReadonlyMap<string, Addition<typeof TestToken>>;
  readonly VariableMapping: ReadonlyMap<string, Addition<typeof VariableMapping>>;
}

/**
 * A row's key text, its key's values in key order as a JSON array.
 *
 * @param values - The key's values.
 * @returns The text.
 */
export const keyOf = (values: readonly string[]): string => JSON.stringify(values);

/**
 * XML whitespace, possibly none, as `TestToken`'s `lead` and `trail` hold it.
 */
type Space = Addition<typeof TestToken>["lead"];

/**
 * Decide whether a text is XML whitespace alone, so a piece of a lexical form may stand as a
 * token's `lead` or `trail`.
 *
 * @param text - The text.
 * @returns Whether it is a run of tabs, line feeds, carriage returns and spaces, possibly empty.
 */
const isSpace = (text: string): text is Space => /^[\t\n\r ]*$/u.test(text);

/**
 * A lexical form split around its collapsed value.
 */
export interface Pieces {
  readonly lead: Space;
  readonly trail: Space;
  readonly value: string;
}

/**
 * Split a lexical form into the whitespace before it, its value and the whitespace after it, as
 * `TestToken`'s `E1_derived` proves: XML Schema's `collapse` strips the ends (Part 2, §4.3.6).
 *
 * @param lexical - The lexical form, as written.
 * @returns Its pieces; a form of whitespace alone is all lead, its value empty.
 */
export const piecesOf = (lexical: string): Pieces => {
  const lead = /^[\t\n\r ]*/u.exec(lexical)?.[0] ?? "";
  const rest = lexical.slice(lead.length);
  const trail = /[\t\n\r ]*$/u.exec(rest)?.[0] ?? "";
  const value = rest.slice(0, rest.length - trail.length);

  return isSpace(lead) && isSpace(trail)
    ? { lead, trail, value }
    : { lead: "", trail: "", value: lexical };
};

/**
 * Whether a kind is one of a list's.
 *
 * @param kinds - The list.
 * @param kind - The kind.
 * @returns Whether the list holds it.
 */
const among = (kinds: readonly string[], kind: string): boolean => kinds.includes(kind);

/**
 * Decide whether a site splices the document it names in place (`Inclusion.splices`, spec reading
 * 117): it is an include under one of `splicingParents` that may stand for that document's root
 * (`IncludeRoot`, reading 114). A section ref places its target whole, and so does an include under
 * a section; an include that may not stand for its target's root places no fragment there.
 *
 * @param site - The site: its kind, its parent's kind and its version.
 * @param root - The root kind of the document its href names.
 * @returns Whether it splices it.
 */
const splicesAt = (
  site: Pick<Addition<typeof Site>, "kind" | "parentKind" | "version">,
  root: string,
): boolean =>
  site.kind === includeKind &&
  among(splicingParents, site.parentKind) &&
  Option.isSome(
    grammar.include.includeRoot.lookup({
      kind: root,
      parent: site.parentKind,
      version: site.version,
    }),
  );

/**
 * One document as the builders read it: its flat rows and the indexes over them.
 */
interface View {
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  readonly byId: ReadonlyMap<NodeId, NodeRow<Composed>>;
  readonly childrenOf: ReadonlyMap<NodeId, readonly NodeRow<Composed>[]>;
  readonly directory: string;
  readonly document: NodeId;
  /**
   * Each node's fold under the document's context: its ancestry and nearest interaction among
   * them.
   */
  readonly folds: ReadonlyMap<NodeId, Folded>;
  readonly ids: TestIds;
  readonly rows: FlatRows<Composed>;
}

/**
 * Read a document into its {@link View}.
 *
 * @param doc - The document's tree.
 * @param ids - The ids its rows are written under.
 * @returns The view.
 */
const viewOf = (doc: XdmDocument<Composed>, ids: TestIds): View => {
  const rows = flatten(doc, ids.idOf);
  const attributes = new Map<NodeId, Map<string, string>>();
  for (const { lexical, name, node } of rows.attributes) {
    const named = attributes.get(node) ?? new Map<string, string>();
    named.set(name, lexical);
    attributes.set(node, named);
  }

  const folds = foldOf(rows.nodes, ids.context ?? ownContext(rows.document.node));

  return {
    attributes,
    byId: new Map(rows.nodes.map((node) => [node.id, node] as const)),
    childrenOf: Map.groupBy(
      rows.nodes.filter((node) => node.parent !== node.id),
      ({ parent }) => parent,
    ),
    directory: directoryOf(ids.path).directory,
    document: rows.document.node,
    folds,
    ids,
    rows,
  };
};

/**
 * Read an attribute of a node.
 *
 * @param view - The document.
 * @param node - The node.
 * @param name - The attribute's name.
 * @returns Its lexical form, or none.
 */
const valueOf = (view: View, node: NodeRow<Composed>, name: string): string | undefined =>
  view.attributes.get(node.id)?.get(name);

/**
 * Read a node's kind by its id.
 *
 * @param view - The document.
 * @param id - The node's id.
 * @returns Its kind; the document node's for an id the document does not hold.
 */
const kindOf = (view: View, id: NodeId): Kind => view.byId.get(id)?.kind ?? "document";

/**
 * A node's {@link nodeRef}-shaped tuple, as every overlay of it copies it.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Its tuple.
 */
const tupleOf = (view: View, node: NodeRow<Composed>) => ({
  document: view.document,
  kind: node.kind,
  nearest: view.folds.get(node.id)?.nearest ?? view.document,
  node: node.id,
  parent: node.parent,
  start: node.start,
  version: node.version,
});

/**
 * The name of an attribute {@link TestToken} holds.
 */
type TokenName = "identifier" | "source-identifier" | "target" | "target-identifier";

/**
 * The names {@link TestToken} holds, in key order.
 */
const tokenNames = [
  "identifier",
  "source-identifier",
  "target",
  "target-identifier",
] as const satisfies readonly TokenName[];

/**
 * The kinds that carry a token of each name, as `testLaws` copies it.
 */
const tokenCarriers: Readonly<Record<TokenName, readonly string[]>> = {
  identifier: [...namedKinds, stimulusRefKind],
  "source-identifier": [mappingKind],
  target: [branchRuleKind],
  "target-identifier": [mappingKind],
};

/**
 * Write a document's tokens: each identifier and target, split around its collapsed value.
 *
 * @param view - The document.
 * @returns The rows, by `[node, name]`.
 */
const tokensOf = (view: View): ReadonlyMap<string, Addition<typeof TestToken>> =>
  new Map(
    view.rows.nodes.flatMap((node) =>
      tokenNames.flatMap((name) => {
        const lexical = valueOf(view, node, name);

        return lexical !== undefined && among(tokenCarriers[name], node.kind)
          ? [
              [
                keyOf([node.id, name]),
                { ...piecesOf(lexical), lexical, name, node: node.id },
              ] as const,
            ]
          : [];
      }),
    ),
  );

/**
 * Write a document's flags: each `xs:boolean` the laws read, on the kind that carries it.
 *
 * @param view - The document.
 * @returns The rows, by `[node, name]`.
 */
const flagsOf = (view: View): ReadonlyMap<string, Addition<typeof TestFlag>> =>
  new Map(
    view.rows.nodes.flatMap((node) =>
      flagCarriers.flatMap(([name, carriers]) => {
        const lexical = valueOf(view, node, name);

        return lexical !== undefined && among(carriers, node.kind)
          ? [
              [
                keyOf([node.id, name]),
                {
                  kind: node.kind,
                  lexical,
                  name,
                  node: node.id,
                  parentKind: kindOf(view, node.parent),
                  value: Option.contains(booleanOf(lexical), true),
                },
              ] as const,
            ]
          : [];
      }),
    ),
  );

/**
 * A section's scope, as its descendants and its sites read it.
 */
interface Scope {
  readonly looseChain: boolean;
  readonly mixes: boolean;
  readonly part: NodeId;
  readonly replacing: boolean;
}

/**
 * The scope a node sits in, its parent's: a section's, a test part's, or none.
 */
interface Above {
  readonly parentLooseChain: boolean;
  readonly parentMixes: boolean;
  readonly part: NodeId;
  readonly replaced: boolean;
}

/**
 * Read the scope a node sits in, from its parent: a section's own, a test part's (the part, no
 * replacement and no drawn order), or the document's (no part, and a loose chain that reaches the
 * section that places the document).
 *
 * @param view - The document.
 * @param scopes - The sections' scopes so far, in document order.
 * @param node - The node.
 * @returns Its scope.
 */
const aboveOf = (
  view: View,
  scopes: ReadonlyMap<NodeId, Scope>,
  node: NodeRow<Composed>,
): Above => {
  const parentKind = kindOf(view, node.parent);
  const above = scopes.get(node.parent);
  if (parentKind === sectionKind && above !== undefined) {
    return {
      parentLooseChain: above.looseChain,
      parentMixes: above.mixes,
      part: above.part,
      replaced: above.replacing,
    };
  }

  return parentKind === partKind
    ? { parentLooseChain: false, parentMixes: false, part: node.parent, replaced: false }
    : { parentLooseChain: true, parentMixes: false, part: view.document, replaced: false };
};

/**
 * Read a node's flag of a name, absent where the node is absent or writes none.
 */
type FlagOf = (node: NodeRow<Composed> | undefined, name: FlagName) => boolean | undefined;

/**
 * Read a node's collapsed token of a name, absent where it writes none.
 */
type TokenOf = (node: NodeRow<Composed>, name: TokenName) => string | undefined;

/**
 * A document's sections and their scopes.
 */
interface Sections {
  readonly rows: ReadonlyMap<string, Addition<typeof Section>>;
  readonly scopes: ReadonlyMap<NodeId, Scope>;
}

/**
 * Write a document's sections, each with its flags and its scope, in document order so each
 * section's parent's scope precedes it.
 *
 * @param view - The document.
 * @param flag - Each node's flags.
 * @returns The rows, by node, and each section's scope.
 */
const sectionsOf = (view: View, flag: FlagOf): Sections => {
  const rows = new Map<string, Addition<typeof Section>>();
  const scopes = new Map<NodeId, Scope>();
  const childOf = (node: NodeRow<Composed>, kind: string) =>
    (view.childrenOf.get(node.id) ?? []).find((child) => child.kind === kind);

  for (const node of view.rows.nodes.filter(({ kind }) => kind === sectionKind)) {
    const above = aboveOf(view, scopes, node);
    const visible = flag(node, "visible") ?? false;
    const keepTogether = flag(node, "keep-together") ?? true;
    const shuffle = flag(childOf(node, "qti-ordering"), "shuffle") ?? false;
    const withReplacement = flag(childOf(node, "qti-selection"), "with-replacement") ?? false;
    const loose = !visible && !keepTogether;
    const scope: Scope = {
      looseChain: loose && above.parentLooseChain,
      mixes: shuffle || (loose && above.parentMixes),
      part: above.part,
      replacing: above.replaced || withReplacement,
    };
    scopes.set(node.id, scope);
    rows.set(node.id, {
      ...tupleOf(view, node),
      keepTogether,
      looseChain: scope.looseChain,
      mixes: scope.mixes,
      parentKind: kindOf(view, node.parent),
      parentLooseChain: above.parentLooseChain,
      parentMixes: above.parentMixes,
      part: scope.part,
      replaced: above.replaced,
      replacing: scope.replacing,
      shuffle,
      visible,
      withReplacement,
    });
  }

  return { rows, scopes };
};

/**
 * Write a document's names: each test part, section, section ref and item ref, with its collapsed
 * identifier and its scope in the document.
 *
 * @param view - The document.
 * @param token - Each node's tokens.
 * @param scopes - The sections' scopes.
 * @returns The rows, by node.
 */
const namedOf = (
  view: View,
  token: TokenOf,
  scopes: ReadonlyMap<NodeId, Scope>,
): ReadonlyMap<string, Addition<typeof Named>> =>
  new Map(
    view.rows.nodes
      .filter(({ kind }) => among(namedKinds, kind))
      .map((node) => {
        const own = scopes.get(node.id);
        const above = aboveOf(view, scopes, node);
        const isPart = node.kind === partKind;

        return [
          node.id,
          {
            ...tupleOf(view, node),
            end: node.end,
            identifier: token(node, "identifier") ?? "",
            looseChain: own?.looseChain ?? false,
            mixes: own?.mixes ?? false,
            parentKind: kindOf(view, node.parent),
            part: isPart ? node.id : (own?.part ?? above.part),
            replaced: !isPart && above.replaced,
          },
        ] as const;
      }),
  );

/**
 * Write a document's section parts (C15): each child of a section of a kind `SectionPart` names,
 * with whether its `required` is true.
 *
 * @param view - The document.
 * @param flag - Each node's flags.
 * @returns The rows, by node.
 */
const membersOf = (view: View, flag: FlagOf): ReadonlyMap<string, Addition<typeof SectionMember>> =>
  new Map(
    view.rows.nodes
      .filter((node) => kindOf(view, node.parent) === sectionKind && among(sectionParts, node.kind))
      .map((node) => {
        const { parent, ...tuple } = tupleOf(view, node);

        return [
          node.id,
          { ...tuple, required: flag(node, "required") ?? false, section: parent },
        ] as const;
      }),
  );

/**
 * Write a document's selections, each with its `select` split around its integer and its
 * section's count of parts. A selection whose `select` is absent or holds no integer has no row:
 * AL3 or AL1 refuses it, and `SectionSelection`'s mirror names it too.
 *
 * @param view - The document.
 * @param flag - Each node's flags.
 * @returns The rows, by node.
 */
const selectionsOf = (
  view: View,
  flag: FlagOf,
): ReadonlyMap<string, Addition<typeof SectionSelection>> =>
  new Map(
    view.rows.nodes
      .filter(({ kind }) => kind === "qti-selection")
      .flatMap((node) => {
        const lexical = valueOf(view, node, "select");
        const pieces = piecesOf(lexical ?? "");
        const parts = (view.childrenOf.get(node.parent) ?? []).filter((child) =>
          among(sectionParts, child.kind),
        );

        return lexical !== undefined && /^[+-]?[0-9]+$/u.test(pieces.value)
          ? [
              [
                node.id,
                {
                  ...tupleOf(view, node),
                  members: BigInt(parts.length),
                  required: BigInt(parts.filter((part) => flag(part, "required") ?? false).length),
                  selectForm: pieces.value,
                  selectLead: pieces.lead,
                  selectLexical: lexical,
                  selectTrail: pieces.trail,
                  withReplacement: flag(node, "with-replacement") ?? false,
                },
              ] as const,
            ]
          : [];
      }),
  );

/**
 * Write a document's orderings, each with its `shuffle`.
 *
 * @param view - The document.
 * @param flag - Each node's flags.
 * @returns The rows, by node.
 */
const orderingsOf = (
  view: View,
  flag: FlagOf,
): ReadonlyMap<string, Addition<typeof SectionOrdering>> =>
  new Map(
    view.rows.nodes
      .filter(({ kind }) => kind === "qti-ordering")
      .map(
        (node) =>
          [node.id, { ...tupleOf(view, node), shuffle: flag(node, "shuffle") ?? false }] as const,
      ),
  );

/**
 * Whether a node is a site: a section ref, or an include under a parent whose model holds an
 * explicit include particle (spec reading 114).
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Whether it is.
 */
const isSite = (view: View, node: NodeRow<Composed>): boolean =>
  isSiteKind(node.kind, kindOf(view, node.parent));

/**
 * An item ref's or a site's href, resolved as its `ReferencePath` is: its node and kind, its
 * package, the entry path it names, whether it names one (`resolved`), and whether it resolves
 * outside the package (`external`), as its `Reference`'s scope says. A target this representation
 * does not resolve keeps its directory and target as written, which no `ReferencePath` holds, so
 * "Href form" refuses an item ref's; a site's has no {@link SitePath}, and an external one marks
 * its {@link Site} `external`.
 */
export interface ResolvedHref {
  readonly external: boolean;
  readonly kind: string;
  readonly node: NodeId;
  readonly package: Uuid;
  readonly path: string;
  readonly resolved: boolean;
}

/**
 * Resolve a document's hrefs: each item ref's and site's that writes one, against the document's
 * directory, as `referenceRowsOf` resolves a `ReferencePath`. An item ref or a site with no href
 * has none: AL3 refuses an item ref or a section ref without one, and an include without one names
 * no document, which its site's existence law refuses ("Include target", spec reading 115).
 *
 * @param view - The document.
 * @returns The hrefs, by node.
 */
const hrefsOf = (view: View): ReadonlyMap<string, ResolvedHref> => {
  const resolve = hrefResolverOf(view.rows, view.ids.path);

  return new Map(
    view.rows.nodes.flatMap((node) => {
      const lexical = valueOf(view, node, "href");
      if (lexical === undefined || !(node.kind === itemRefKind || isSite(view, node))) {
        return [];
      }

      const { target } = referencePiecesOf(lexical);
      const resolution = resolve(node.id, lexical);
      const path = entryPathOf(resolution);

      return [
        [
          node.id,
          {
            external: resolution.scope === "external",
            kind: node.kind,
            node: node.id,
            package: view.ids.package,
            path: path ?? `${view.directory}${target}`,
            resolved: path !== undefined,
          },
        ] as const,
      ];
    }),
  );
};

/**
 * Resolve the hrefs of a test's or a section's item refs, which `ItemRefTarget` copies: each item
 * ref's path, as its `ReferencePath` resolves it; none for any other document.
 *
 * @param doc - The document's tree.
 * @param ids - The ids its rows are written under.
 * @returns The item refs' hrefs, in document order.
 */
export const itemRefPathsOf = (doc: XdmDocument<Composed>, ids: TestIds): readonly ResolvedHref[] =>
  among(assembledRoots, doc.root.kind)
    ? [...hrefsOf(viewOf(doc, ids)).values()].filter(({ kind }) => kind === itemRefKind)
    : [];

/**
 * Read whether the package holds an entry at a path a site's href names: the importer's entries,
 * and with no `entryAt`, its documents.
 *
 * @param view - The site's document.
 * @param path - The path.
 * @returns Whether an entry is there.
 */
const entryOf = (view: View, path: string): boolean =>
  view.ids.entryAt === undefined
    ? Option.isSome(view.ids.documentAt(path))
    : view.ids.entryAt(path);

/**
 * Read the document a site's href names: the listed document there, with its root's kind and its
 * context, and with no `targetAt`, the document at the path with the document node's own kind as
 * its root. None where the path names no listed document: the site then has no
 * {@link SiteTarget}, and "Include target" refuses it (spec reading 115).
 *
 * @param view - The site's document.
 * @param path - The path its href names.
 * @returns The target, if any.
 */
const targetOf = (view: View, path: string): Option.Option<ListedTarget> =>
  view.ids.targetAt === undefined
    ? Option.map(view.ids.documentAt(path), (node): ListedTarget => ({
        context: ownContext(node),
        node,
        rootKind: "document",
      }))
    : view.ids.targetAt(path);

/**
 * Write a document's sites, each with the scope it is placed in, whether or not it writes an href,
 * and `external` where its href resolves outside the package.
 *
 * @param view - The document.
 * @param hrefs - The document's hrefs.
 * @param scopes - The sections' scopes.
 * @returns The rows, by node.
 */
const sitesOf = (
  view: View,
  hrefs: ReadonlyMap<string, ResolvedHref>,
  scopes: ReadonlyMap<NodeId, Scope>,
): ReadonlyMap<string, Addition<typeof Site>> =>
  new Map(
    view.rows.nodes.flatMap((node) => {
      if (!isSite(view, node)) {
        return [];
      }

      const parentKind = kindOf(view, node.parent);
      const above = aboveOf(view, scopes, node);

      return [
        [
          node.id,
          {
            ...tupleOf(view, node),
            ancestry: Bits.of(Flag, [...(view.folds.get(node.id)?.ancestry ?? [])]),
            children: BigInt(view.childrenOf.get(node.id)?.length ?? 0),
            documentType: view.ids.documentType,
            external: hrefs.get(node.id)?.external ?? false,
            governs: node.governs,
            nearestKind: view.folds.get(node.id)?.nearestKind ?? "document",
            parentKind,
            parentLooseChain: parentKind === sectionKind && above.parentLooseChain,
            parentMixes: above.parentMixes,
            part: above.part,
            replaced: above.replaced,
          },
        ] as const,
      ];
    }),
  );

/**
 * Write each site's {@link SitePath}: its href's package and path, and whether the package holds
 * an entry there, a row only where the site writes an href that resolves to a path of the package.
 * An href that resolves outside the package has none: its site is marked `external`, stored as
 * written and never fetched (spec reading 115).
 *
 * @param view - The document.
 * @param sites - The document's sites.
 * @param hrefs - The document's hrefs.
 * @returns The rows, by node.
 */
const sitePathsOf = (
  view: View,
  sites: ReadonlyMap<string, Addition<typeof Site>>,
  hrefs: ReadonlyMap<string, ResolvedHref>,
): ReadonlyMap<string, Addition<typeof SitePath>> =>
  new Map(
    [...sites.values()].flatMap((site) =>
      Option.match(
        Option.filter(Option.fromNullishOr(hrefs.get(site.node)), ({ resolved }) => resolved),
        {
          onNone: () => [],
          onSome: (href) => [
            [
              site.node,
              {
                entry: entryOf(view, href.path),
                kind: site.kind,
                node: site.node,
                package: href.package,
                path: href.path,
              },
            ] as const,
          ],
        },
      ),
    ),
  );

/**
 * Write each site's {@link SiteTarget}: the document its href's path names, with that document's
 * root kind and context, and the site's fields the target's laws read. A site that writes no href,
 * or whose path names no listed document, has none.
 *
 * @param view - The document.
 * @param sites - The document's sites.
 * @param paths - The sites' paths.
 * @returns The rows, by node.
 */
const siteTargetsOf = (
  view: View,
  sites: ReadonlyMap<string, Addition<typeof Site>>,
  paths: ReadonlyMap<string, Addition<typeof SitePath>>,
): ReadonlyMap<string, Addition<typeof SiteTarget>> =>
  new Map(
    [...sites.values()].flatMap((site) =>
      Option.match(
        Option.flatMap(Option.fromNullishOr(paths.get(site.node)), (href) =>
          Option.map(targetOf(view, href.path), (target) => ({ href, target })),
        ),
        {
          onNone: () => [],
          onSome: ({ href, target }) => [
            [
              site.node,
              {
                ancestry: site.ancestry,
                document: site.document,
                kind: site.kind,
                nearest: site.nearest,
                nearestKind: site.nearestKind,
                node: site.node,
                package: href.package,
                parentKind: site.parentKind,
                path: href.path,
                splices: splicesAt(site, target.rootKind),
                target: target.node,
                targetNearest: target.context.nearest,
                targetNearestKind: target.context.nearestKind,
                targetRoot: target.rootKind,
                version: site.version,
              },
            ] as const,
          ],
        },
      ),
    ),
  );

/**
 * Write each include's {@link Inclusion}: its site's version, parent kind and target root, and the
 * include parent its parent's kind is. An include whose href names no document has no target, so
 * no root and no row.
 *
 * @param targets - The document's sites' targets.
 * @returns The rows, by node.
 */
const inclusionsOf = (
  targets: ReadonlyMap<string, Addition<typeof SiteTarget>>,
): ReadonlyMap<string, Addition<typeof Inclusion>> =>
  new Map(
    [...targets.values()].flatMap((site) =>
      site.kind === includeKind
        ? [
            [
              site.node,
              {
                includeParent: site.parentKind,
                node: site.node,
                parentKind: site.parentKind,
                root: site.targetRoot,
                splices: site.splices,
                version: site.version,
              },
            ] as const,
          ]
        : [],
    ),
  );

/**
 * Write a document's branch rules that name a target: each whose collapsed target is no exit.
 *
 * @param view - The document.
 * @param token - Each node's tokens.
 * @returns The rows, by node.
 */
const rulesOf = (view: View, token: TokenOf): ReadonlyMap<string, Addition<typeof BranchRule>> =>
  new Map(
    view.rows.nodes.flatMap((node) => {
      const target = node.kind === branchRuleKind ? token(node, "target") : undefined;

      return target !== undefined && !among(exits, target)
        ? [
            [
              node.id,
              { ...tupleOf(view, node), parentKind: kindOf(view, node.parent), target },
            ] as const,
          ]
        : [];
    }),
  );

/**
 * Write a document's variable mappings, each with its collapsed source and target. A mapping with
 * no source or target has no row: AL3 refuses it.
 *
 * @param view - The document.
 * @param token - Each node's tokens.
 * @returns The rows, by node.
 */
const mappingsOf = (
  view: View,
  token: TokenOf,
): ReadonlyMap<string, Addition<typeof VariableMapping>> =>
  new Map(
    view.rows.nodes.flatMap((node) => {
      const source = node.kind === mappingKind ? token(node, "source-identifier") : undefined;
      const target = node.kind === mappingKind ? token(node, "target-identifier") : undefined;

      return source !== undefined && target !== undefined
        ? [[node.id, { ...tupleOf(view, node), source, target }] as const]
        : [];
    }),
  );

/**
 * Write a document's stimulus refs, each with its collapsed identifier, whatever the document's
 * root: a stimulus ref sits in an item.
 *
 * @param view - The document.
 * @param token - Each node's tokens.
 * @returns The rows, by node.
 */
const stimulusRefsOf = (
  view: View,
  token: TokenOf,
): ReadonlyMap<string, Addition<typeof StimulusRef>> =>
  new Map(
    view.rows.nodes
      .filter(({ kind }) => kind === stimulusRefKind)
      .map(
        (node) =>
          [
            node.id,
            { ...tupleOf(view, node), identifier: token(node, "identifier") ?? "" },
          ] as const,
      ),
  );

/**
 * Keep a relation's rows where the document is a test's or a section's, and none otherwise.
 *
 * @param assembled - Whether the document's root is a test or a section.
 * @param rows - The rows.
 * @returns The rows kept.
 */
const keptIf = <A>(assembled: boolean, rows: ReadonlyMap<string, A>): ReadonlyMap<string, A> =>
  assembled ? rows : new Map();

/**
 * Build the overlay rows of one document: its tokens and flags whatever its root, since every
 * include's `href` is copied, an item's among them; and every other overlay's where its root is a
 * test or a section, none otherwise.
 *
 * An absent required attribute leaves out the row whose copy proves it (an item ref's or a site's
 * `href`, a selection's `select`), or leaves its field at its null value (an identifier's empty
 * value, a section's `visible` false), and AL3 refuses the element either way.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: TestIds): TestRows => {
  const view = viewOf(doc, ids);
  const tokens = tokensOf(view);
  const flags = flagsOf(view);
  const token: TokenOf = (node, name) => tokens.get(keyOf([node.id, name]))?.value;
  const flag: FlagOf = (node, name) =>
    node === undefined ? undefined : flags.get(keyOf([node.id, name]))?.value;
  const root = doc.root.kind;
  const sections = sectionsOf(view, flag);
  const hrefs = hrefsOf(view);
  const sites = sitesOf(view, hrefs, sections.scopes);
  const paths = sitePathsOf(view, sites, hrefs);
  const targets = siteTargetsOf(view, sites, paths);
  const assembled =
    ids.assembled ?? (among(assembledRoots, root) || sites.size > 0 || ids.targeted === true);

  return {
    BranchRule: keptIf(assembled, rulesOf(view, token)),
    Inclusion: inclusionsOf(targets),
    Named: keptIf(assembled, namedOf(view, token, sections.scopes)),
    Section: keptIf(assembled, sections.rows),
    SectionMember: keptIf(assembled, membersOf(view, flag)),
    SectionOrdering: keptIf(assembled, orderingsOf(view, flag)),
    SectionSelection: keptIf(assembled, selectionsOf(view, flag)),
    Site: sites,
    SitePath: paths,
    SiteTarget: targets,
    StimulusRef: stimulusRefsOf(view, token),
    TestDocument: keptIf(
      assembled,
      new Map([
        [
          view.document,
          {
            node: view.document,
            package: ids.package,
            path: ids.path,
            rootKind: root,
          },
        ],
      ]),
    ),
    TestFlag: flags,
    TestToken: tokens,
    VariableMapping: keptIf(assembled, mappingsOf(view, token)),
  };
};

/**
 * A member instance as its tree writes it: every field its caller writes but its group and root
 * field, with its own children nested.
 */
export type InstanceMember = Omit<Addition<typeof Instance>, "assembly" | "parent"> & {
  readonly children: readonly InstanceMember[];
};

/**
 * An assembly's root instance as its tree writes it: its root field, and its children nested.
 */
export type InstanceRoot = Omit<Addition<typeof Instance>, "parent"> & {
  readonly children: readonly InstanceMember[];
};

/**
 * A package's assemblies, one keyed set per relation: each root instance by its id, with its tree
 * nested, and each counted member by its key.
 */
export interface AssembledRows {
  readonly AssembledName: ReadonlyMap<string, Addition<typeof AssembledName>>;
  readonly BranchResolution: ReadonlyMap<string, Addition<typeof BranchResolution>>;
  readonly BranchShuffle: ReadonlyMap<string, Addition<typeof BranchShuffle>>;
  readonly BranchTarget: ReadonlyMap<string, Addition<typeof BranchTarget>>;
  readonly Instance: ReadonlyMap<string, InstanceRoot>;
  readonly InstanceName: ReadonlyMap<string, Addition<typeof InstanceName>>;
}

/**
 * One instance as the builder walks an assembly: its document, its scope, its parent, the site it
 * is placed at, and its interval in the tree's pre-order, which the tree draws the same way.
 */
interface Walked {
  readonly document: NodeId;
  end: number;
  readonly id: NodeId;
  readonly mixes: boolean;
  readonly parent: Walked | undefined;
  readonly part: NodeId;
  readonly replaced: boolean;
  readonly siteStart: bigint;
  readonly start: number;
}

/**
 * The walk of one assembly: its root's kind, every document's rows, the ids it draws, and the
 * instances it has placed, in pre-order.
 */
interface Walk {
  readonly assemblyKind: Kind;
  readonly byDocument: ReadonlyMap<string, TestRows>;
  readonly newId: () => NodeId;
  readonly walked: Walked[];
}

/**
 * Place a document and one child per site of it, each the document the site names. A site that
 * names no document of the package places nothing, and its own laws refuse it; nor does a site that
 * names a document on the chain, the document itself included, which would close an inclusion
 * cycle: its instance holds fewer children than its document has sites, which "Inclusion cycle"
 * refuses, and no instance repeats a document, whose placements would break the assembly's keys.
 *
 * @param walk - The assembly's walk.
 * @param chain - The documents of the instance's ancestors.
 * @param parent - The instance's parent, none for the root.
 * @param fields - The instance's written fields but its children.
 * @returns The instance as its tree writes it.
 */
const place = (
  walk: Walk,
  chain: readonly NodeId[],
  parent: Walked | undefined,
  fields: Omit<InstanceMember, "children">,
): InstanceMember => {
  const self: Walked = {
    document: fields.document,
    end: 0,
    id: fields.id,
    mixes: fields.mixes,
    parent,
    part: fields.part,
    replaced: fields.replaced,
    siteStart: fields.siteStart,
    start: walk.walked.length,
  };
  walk.walked.push(self);

  const rows = walk.byDocument.get(self.document);
  const sites = [...(rows?.Site.values() ?? [])].toSorted((a, b) => (a.start < b.start ? -1 : 1));
  const closing = new Set([...chain, self.document]);
  const children = sites.flatMap((site) => {
    const target = rows?.SiteTarget.get(site.node)?.target;

    return target !== undefined && walk.byDocument.has(target) && !closing.has(target)
      ? [
          place(walk, [...chain, self.document], self, {
            assemblyKind: walk.assemblyKind,
            document: target,
            id: walk.newId(),
            mixes: site.parentMixes || (site.parentLooseChain && self.mixes),
            part: site.part === self.document ? self.part : site.part,
            replaced: site.replaced || self.replaced,
            rootKind:
              walk.byDocument.get(target)?.TestDocument.get(target)?.rootKind ?? sectionKind,
            site: site.node,
            siteLooseChain: site.parentLooseChain,
            siteMixes: site.parentMixes,
            sitePart: site.part,
            siteReplaced: site.replaced,
            siteStart: site.start,
          }),
        ]
      : [];
  });
  self.end = walk.walked.length;

  return { ...fields, children };
};

/**
 * A test's names: each instance's, and their projection.
 */
interface Names {
  readonly assembled: ReadonlyMap<string, Addition<typeof AssembledName>>;
  readonly names: ReadonlyMap<string, Addition<typeof InstanceName>>;
}

/**
 * Write the names of a test's instances, each a name of its document with its scope in the
 * assembly, and their projection, each written element once.
 *
 * @param assembly - The test's document node.
 * @param walk - The test's walk.
 * @returns The names by `[instance, node]`, and the projection by `[assembly, node]`.
 */
const namesOf = (assembly: NodeId, walk: Walk): Names => {
  const names = new Map<string, Addition<typeof InstanceName>>();
  const assembled = new Map<string, Addition<typeof AssembledName>>();

  for (const instance of walk.walked) {
    for (const name of walk.byDocument.get(instance.document)?.Named.values() ?? []) {
      names.set(keyOf([instance.id, name.node]), {
        assembly,
        end: name.end,
        identifier: name.identifier,
        instance: instance.id,
        kind: name.kind,
        mixes: name.mixes || (name.looseChain && instance.mixes),
        namedLooseChain: name.looseChain,
        namedMixes: name.mixes,
        namedPart: name.part,
        namedReplaced: name.replaced,
        node: name.node,
        part: name.part === instance.document ? instance.part : name.part,
        replaced: name.replaced || instance.replaced,
        start: name.start,
      });
      assembled.set(keyOf([assembly, name.node]), {
        assembly,
        identifier: name.identifier,
        node: name.node,
      });
    }
  }

  return { assembled, names };
};

/**
 * The nearest name holding a source point and a target in the target's document, and its child
 * that holds the target.
 */
interface Common {
  readonly branch: Addition<typeof InstanceName>;
  readonly common: Addition<typeof InstanceName>;
}

/**
 * Find the nearest name holding a source point and a target in the target's document, and its
 * child that holds the target: the target's ancestors among the document's names, walked up until
 * one holds the point.
 *
 * @param walk - The assembly's walk.
 * @param names - The assembly's names by `[instance, node]`.
 * @param instance - The target's instance.
 * @param target - The target's name there.
 * @param point - The source's start in the target's document: its owner's, or its site's.
 * @returns The common name and its branch, or none where no name holds both.
 */
const commonOf = (
  walk: Walk,
  names: ReadonlyMap<string, Addition<typeof InstanceName>>,
  instance: Walked,
  target: Addition<typeof InstanceName>,
  point: bigint,
): Option.Option<Common> => {
  const named = walk.byDocument.get(instance.document)?.Named;
  let branch = target;
  for (;;) {
    const parent = named?.get(branch.node)?.parent;
    const common = parent === undefined ? undefined : names.get(keyOf([instance.id, parent]));
    if (common === undefined) {
      return Option.none();
    }

    if (common.start <= point && point < common.end) {
      return Option.some({ branch, common });
    }

    branch = common;
  }
};

/**
 * Find the child of the target's instance that a rule's instance descends through, or the rule's
 * instance itself where the two are one.
 *
 * @param instance - The rule's instance.
 * @param targetInstance - The target's instance, one that holds the rule's.
 * @returns The child.
 */
const viaOf = (instance: Walked, targetInstance: Walked): Walked => {
  let via = instance;
  while (via.parent !== undefined && via.parent !== targetInstance) {
    via = via.parent;
  }

  return via.parent === targetInstance ? via : instance;
};

/**
 * Whether an instance holds another: the other's start lies in its pre-order interval.
 *
 * @param holder - The instance that may hold.
 * @param held - The instance that may be held.
 * @returns Whether it does.
 */
const holdsInstance = (holder: Walked, held: Walked): boolean =>
  holder.start <= held.start && held.start < holder.end;

/**
 * Whether a name's pre-order interval holds a point.
 *
 * @param name - The name.
 * @param point - The point.
 * @returns Whether it does.
 */
const holdsPoint = (name: Addition<typeof InstanceName>, point: bigint): boolean =>
  name.start <= point && point < name.end;

/**
 * One branch rule of one instance, resolved: the rule and its source, its target where its
 * identifier names an element of an instance holding the rule's, and the shuffle that orders the
 * two where one does.
 */
interface Resolved {
  readonly resolution: Addition<typeof BranchResolution>;
  readonly shuffle: Option.Option<Addition<typeof BranchShuffle>>;
  readonly target: Option.Option<Addition<typeof BranchTarget>>;
}

/**
 * Resolve one branch rule of one instance (reading 87): its target, the element its identifier
 * names in an instance holding the rule's, the first in pre-order where several do; the child of
 * the target's instance its own descends through; and the shuffle that orders the two, the nearest
 * name holding both, where its children's order is drawn and its child that holds the target does
 * not hold the source. A rule whose owner is no name of its instance resolves nothing, and its
 * instance's count of resolutions refuses it; one whose target names nothing has no target, and the
 * resolution's existence law refuses it ("Branch target").
 *
 * @param walk - The assembly's walk.
 * @param names - The assembly's names by `[instance, node]`.
 * @param instance - The rule's instance.
 * @param rule - The rule.
 * @returns The resolution, its target and its shuffle, each as its writer writes it, or none.
 */
const resolutionOf = (
  walk: Walk,
  names: ReadonlyMap<string, Addition<typeof InstanceName>>,
  instance: Walked,
  rule: Addition<typeof BranchRule>,
): Option.Option<Resolved> =>
  Option.map(Option.fromNullishOr(names.get(keyOf([instance.id, rule.parent]))), (owner) => {
    const resolution: Addition<typeof BranchResolution> = {
      instance: instance.id,
      owner: rule.parent,
      ownerEnd: owner.end,
      ownerKind: rule.parentKind,
      ownerPart: owner.part,
      ownerStart: owner.start,
      rule: rule.node,
      target: rule.target,
    };
    const placed = Option.fromNullishOr(
      walk.walked
        .filter((holder) => holdsInstance(holder, instance))
        .flatMap((holder) =>
          [...(walk.byDocument.get(holder.document)?.Named.values() ?? [])]
            .filter(({ identifier }) => identifier === rule.target)
            .flatMap(({ node }) => {
              const name = names.get(keyOf([holder.id, node]));

              return name === undefined ? [] : [{ holder, name }];
            }),
        )[0],
    );
    const target = placed.pipe(
      Option.map(({ holder, name }) => {
        const via = viaOf(instance, holder);

        return {
          assembly: name.assembly,
          instance: instance.id,
          instanceStart: BigInt(instance.start),
          ownerEnd: owner.end,
          ownerKind: rule.parentKind,
          ownerPart: owner.part,
          ownerStart: owner.start,
          rule: rule.node,
          target: rule.target,
          targetEnd: name.end,
          targetInstance: holder.id,
          targetInstanceEnd: BigInt(holder.end),
          targetInstanceStart: BigInt(holder.start),
          targetKind: name.kind,
          targetMixes: name.mixes,
          targetNode: name.node,
          targetPart: name.part,
          targetReplaced: name.replaced,
          targetStart: name.start,
          via: via.id,
          viaEnd: BigInt(via.end),
          viaParent: via.parent?.id ?? via.id,
          viaSiteStart: via.siteStart,
          viaStart: BigInt(via.start),
        } satisfies Addition<typeof BranchTarget>;
      }),
    );
    const shuffle = placed.pipe(
      Option.flatMap(({ holder, name }) => {
        const via = viaOf(instance, holder);
        const point = holder === instance ? owner.start : via.siteStart;

        return Option.flatMap(commonOf(walk, names, holder, name, point), ({ branch, common }) =>
          common.mixes && !holdsPoint(branch, point)
            ? Option.some({
                assembly: name.assembly,
                branch: branch.node,
                branchEnd: branch.end,
                branchParent: common.node,
                branchPart: branch.part,
                branchStart: branch.start,
                common: common.node,
                commonEnd: common.end,
                commonKind: common.kind,
                commonMixes: common.mixes,
                commonPart: common.part,
                commonReplaced: common.replaced,
                commonStart: common.start,
                instance: instance.id,
                ownerStart: owner.start,
                rule: rule.node,
                targetInstance: holder.id,
                targetStart: name.start,
                viaSiteStart: via.siteStart,
              } satisfies Addition<typeof BranchShuffle>)
            : Option.none(),
        );
      }),
    );

    return { resolution, shuffle, target };
  });

/**
 * Build a package's assemblies from its documents' rows: one tree per document that heads one, and,
 * under a test, each instance's names, their projection and its branch rules' resolutions. A
 * document heads an assembly unless an include that splices it names it (`SiteTarget.splices`, spec
 * reading 117): a fragment such an include splices is judged where it is included, in the
 * assemblies of the documents that place it, and never alone.
 *
 * @param documents - Every document's rows ({@link rowsOf}) of one package.
 * @param newId - A fresh uuid for each instance but a root, whose id is its document's node.
 * @returns The assemblies' rows.
 */
export const assembledRowsOf = (
  documents: readonly TestRows[],
  newId: () => NodeId,
): AssembledRows => {
  const spliced = new Set(
    documents.flatMap((rows) =>
      [...rows.SiteTarget.values()].filter(({ splices }) => splices).map(({ target }) => target),
    ),
  );
  const heads = documents
    .flatMap((rows) => [...rows.TestDocument.values()])
    .filter(({ node }) => !spliced.has(node));
  const byDocument = new Map(
    documents.flatMap((rows) =>
      [...rows.TestDocument.values()].map((row) => [row.node, rows] as const),
    ),
  );
  const roots = new Map<string, InstanceRoot>();
  const names = new Map<string, Addition<typeof InstanceName>>();
  const assembled = new Map<string, Addition<typeof AssembledName>>();
  const resolutions = new Map<string, Addition<typeof BranchResolution>>();
  const targets = new Map<string, Addition<typeof BranchTarget>>();
  const shuffles = new Map<string, Addition<typeof BranchShuffle>>();

  for (const head of heads) {
    const walk: Walk = { assemblyKind: head.rootKind, byDocument, newId, walked: [] };
    const tree = place(walk, [], undefined, {
      assemblyKind: head.rootKind,
      document: head.node,
      id: head.node,
      mixes: false,
      part: head.node,
      replaced: false,
      rootKind: head.rootKind,
      site: head.node,
      siteLooseChain: false,
      siteMixes: false,
      sitePart: head.node,
      siteReplaced: false,
      siteStart: 0n,
    });
    roots.set(head.node, { ...tree, assembly: head.node });

    if (head.rootKind === testKind) {
      const written = namesOf(head.node, walk);
      for (const [at, row] of written.names) {
        names.set(at, row);
      }
      for (const [at, row] of written.assembled) {
        assembled.set(at, row);
      }
      for (const instance of walk.walked) {
        for (const rule of byDocument.get(instance.document)?.BranchRule.values() ?? []) {
          const at = keyOf([instance.id, rule.node]);
          for (const resolved of Option.toArray(
            resolutionOf(walk, written.names, instance, rule),
          )) {
            resolutions.set(at, resolved.resolution);
            for (const target of Option.toArray(resolved.target)) {
              targets.set(at, target);
            }
            for (const shuffle of Option.toArray(resolved.shuffle)) {
              shuffles.set(at, shuffle);
            }
          }
        }
      }
    }
  }

  return {
    AssembledName: assembled,
    BranchResolution: resolutions,
    BranchShuffle: shuffles,
    BranchTarget: targets,
    Instance: roots,
    InstanceName: names,
  };
};
