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
 *   instance tree per document of a test or a section, and, under a test, its instances' names,
 *   their projection and the branch rules' resolutions.
 *
 * The rows restate what the documents say and nothing else, and the database proves every one of
 * them (`testLaws`), so a row a builder gets wrong is refused, never accepted. Where a document
 * breaks a law, the builder still writes what the document says, so the law that refuses it is the
 * one its rows name: an inclusion cycle is cut where it closes, leaving the instance that would
 * repeat a document on its chain without the children its sites require, and a branch target with
 * no lawful candidate resolves to the first name that spells it, or to none.
 */
import { Option } from "effect";
import { Bits } from "@bjornpagen/grizzle";
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import type { Kind } from "#pantry/grammar/compose.ts";
import { Flag } from "#pantry/grammar/install.ts";
import { inheritedOf, isSiteKind, ownContext } from "#pantry/import/context.ts";
import type { DocumentContext, Inherited, ListedTarget } from "#pantry/import/context.ts";
import { referencePiecesOf, resolvedPathOf } from "#pantry/import/overlays/package.ts";
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
  stimulusRefKind,
  testKind,
  truePattern,
} from "#pantry/qti/tests.ts";
import type {
  AssembledName,
  BranchResolution,
  BranchRule,
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
  readonly idOf: (index: number) => NodeId;
  readonly package: Uuid;
  readonly path: string;
  /**
   * The document a site's href names, with its root's kind and context; where none is given, the
   * document at the path with an unknown root, which no `Document` row holds.
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
  readonly StimulusRef: ReadonlyMap<string, Addition<typeof StimulusRef>>;
  readonly TestDocument: ReadonlyMap<string, Addition<typeof TestDocument>>;
  readonly TestFlag: ReadonlyMap<string, Addition<typeof TestFlag>>;
  readonly TestToken: ReadonlyMap<string, Addition<typeof TestToken>>;
  readonly VariableMapping: ReadonlyMap<string, Addition<typeof VariableMapping>>;
}

/**
 * The nil uuid: a site's target where its href names no document of the package, which no
 * `TestDocument` row holds, so the site's target law refuses it.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

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
 * The value of an `xs:boolean` lexical form, as `TestFlag`'s `E1_derived` reads it.
 */
const trueForm = new RegExp(truePattern, "u");

/**
 * A document's path split at its last `/`.
 */
export interface PathSplit {
  readonly directory: string;
  readonly name: string;
}

/**
 * Split a document's path at its last `/`.
 *
 * @param path - The path.
 * @returns Its directory, through the last `/` (empty where it has none), and its name.
 */
export const directoryOf = (path: string): PathSplit => {
  const cut = path.lastIndexOf("/") + 1;

  return { directory: path.slice(0, cut), name: path.slice(cut) };
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
 * One document as the builders read it: its flat rows and the indexes over them.
 */
interface View {
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  readonly byId: ReadonlyMap<NodeId, NodeRow<Composed>>;
  readonly childrenOf: ReadonlyMap<NodeId, readonly NodeRow<Composed>[]>;
  readonly directory: string;
  readonly document: NodeId;
  readonly ids: TestIds;
  /**
   * What each node inherits under the document's context: its ancestry and nearest interaction.
   */
  readonly inherited: Inherited;
  readonly nearest: ReadonlyMap<NodeId, NodeId>;
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

  const inherited = inheritedOf(rows.nodes, ids.context ?? ownContext(rows.document.node));

  return {
    attributes,
    byId: new Map(rows.nodes.map((node) => [node.id, node] as const)),
    childrenOf: Map.groupBy(
      rows.nodes.filter((node) => node.parent !== node.id),
      ({ parent }) => parent,
    ),
    directory: directoryOf(ids.path).directory,
    document: rows.document.node,
    ids,
    inherited,
    nearest: inherited.nearest,
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
  nearest: view.nearest.get(node.id) ?? view.document,
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
                  value: trueForm.test(lexical),
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
 * package, and the entry it names. A target this representation does not resolve keeps its
 * directory and target as written, which no `ReferencePath` holds, so "Href form" refuses it.
 */
export interface ResolvedHref {
  readonly kind: string;
  readonly node: NodeId;
  readonly package: Uuid;
  readonly path: string;
}

/**
 * Resolve a document's hrefs: each item ref's and site's, against the document's directory, as
 * `referenceRowsOf` resolves a `ReferencePath`. An item ref or a section ref with no href has none:
 * AL3 refuses it; an include with none has an empty one, which no document's path is.
 *
 * @param view - The document.
 * @returns The hrefs, by node.
 */
const hrefsOf = (view: View): ReadonlyMap<string, ResolvedHref> =>
  new Map(
    view.rows.nodes.flatMap((node) => {
      const written = valueOf(view, node, "href");
      // An include's href is optional in the XSD, and one with none names no document: its site
      // is written with an empty path, so "Include target" refuses it rather than its existence.
      const lexical = written ?? (node.kind === includeKind && isSite(view, node) ? "" : undefined);
      if (lexical === undefined || !(node.kind === itemRefKind || isSite(view, node))) {
        return [];
      }

      const { target } = referencePiecesOf(lexical);

      return [
        [
          node.id,
          {
            kind: node.kind,
            node: node.id,
            package: view.ids.package,
            path: resolvedPathOf(view.directory, target) ?? `${view.directory}${target}`,
          },
        ] as const,
      ];
    }),
  );

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
 * Read the document a site's href names: the listed document there, with its root's kind and its
 * context; with no `targetAt`, the document at the path with the document node's own kind as its
 * root; and with no document there, the nil uuid, which no `Document` row holds, so the site's
 * target law refuses it.
 *
 * @param view - The site's document.
 * @param path - The path its href names.
 * @returns The target.
 */
const targetOf = (view: View, path: string): ListedTarget => {
  const listed =
    view.ids.targetAt === undefined
      ? Option.map(view.ids.documentAt(path), (node): ListedTarget => ({
          context: ownContext(node),
          node,
          rootKind: "document",
        }))
      : view.ids.targetAt(path);

  return Option.getOrElse(listed, () => ({
    context: ownContext(nilUuid),
    node: nilUuid,
    rootKind: "document",
  }));
};

/**
 * Write a document's sites, each with the document its href names and the scope it is placed in.
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
      const href = hrefs.get(node.id);
      if (href === undefined || !isSite(view, node)) {
        return [];
      }

      const parentKind = kindOf(view, node.parent);
      const above = aboveOf(view, scopes, node);
      const target = targetOf(view, href.path);

      return [
        [
          node.id,
          {
            ...tupleOf(view, node),
            ancestry: Bits.of(Flag, [...(view.inherited.ancestry.get(node.id) ?? [])]),
            children: BigInt(view.childrenOf.get(node.id)?.length ?? 0),
            governs: node.governs,
            nearestKind: view.inherited.nearestKind.get(node.id) ?? "document",
            package: view.ids.package,
            parentKind,
            parentLooseChain: parentKind === sectionKind && above.parentLooseChain,
            parentMixes: above.parentMixes,
            part: above.part,
            path: href.path,
            replaced: above.replaced,
            target: target.node,
            targetNearest: target.context.nearest,
            targetNearestKind: target.context.nearestKind,
            targetRoot: target.rootKind,
          },
        ] as const,
      ];
    }),
  );

/**
 * Write each include's {@link Inclusion}: its site's version, parent kind and target root, and the
 * include parent its parent's kind is.
 *
 * @param sites - The document's sites.
 * @returns The rows, by node.
 */
const inclusionsOf = (
  sites: ReadonlyMap<string, Addition<typeof Site>>,
): ReadonlyMap<string, Addition<typeof Inclusion>> =>
  new Map(
    [...sites.values()].flatMap((site) =>
      site.kind === includeKind
        ? [
            [
              site.node,
              {
                includeParent: site.parentKind,
                node: site.node,
                parentKind: site.parentKind,
                root: site.targetRoot,
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
  const assembled =
    ids.assembled ?? (among(assembledRoots, root) || sites.size > 0 || ids.targeted === true);

  return {
    BranchRule: keptIf(assembled, rulesOf(view, token)),
    Inclusion: inclusionsOf(sites),
    Named: keptIf(assembled, namedOf(view, token, sections.scopes)),
    Section: keptIf(assembled, sections.rows),
    SectionMember: keptIf(assembled, membersOf(view, flag)),
    SectionOrdering: keptIf(assembled, orderingsOf(view, flag)),
    SectionSelection: keptIf(assembled, selectionsOf(view, flag)),
    Site: sites,
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
 * Place a document and, unless it is already on its chain, one child per site of it, each the
 * section document the site names. A site that names no document of the package places nothing,
 * and its own laws refuse it.
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

  const sites = [...(walk.byDocument.get(self.document)?.Site.values() ?? [])].toSorted((a, b) =>
    a.start < b.start ? -1 : 1,
  );
  const children = chain.includes(self.document)
    ? []
    : sites.flatMap((site) =>
        walk.byDocument.has(site.target)
          ? [
              place(walk, [...chain, self.document], self, {
                assemblyKind: walk.assemblyKind,
                document: site.target,
                id: walk.newId(),
                mixes: site.parentMixes || (site.parentLooseChain && self.mixes),
                part: site.part === self.document ? self.part : site.part,
                replaced: site.replaced || self.replaced,
                rootKind:
                  walk.byDocument.get(site.target)?.TestDocument.get(site.target)?.rootKind ??
                  sectionKind,
                site: site.node,
                siteLooseChain: site.parentLooseChain,
                siteMixes: site.parentMixes,
                sitePart: site.part,
                siteReplaced: site.replaced,
                siteStart: site.start,
              }),
            ]
          : [],
      );
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
 * The fields a resolution copies of a name, where it names none: the rule's own node, which no
 * `InstanceName` row holds, so the resolution's containments refuse it.
 *
 * @param rule - The rule.
 * @returns The stand-in name.
 */
const unresolvedOf = (rule: Addition<typeof BranchRule>) =>
  ({
    end: 0n,
    kind: "document",
    mixes: false,
    node: rule.node,
    part: rule.document,
    replaced: false,
    start: 0n,
  }) as const;

/**
 * Find the child of the target's instance that a rule's instance descends through, or the rule's
 * instance itself where the two are one or the target's does not hold it.
 *
 * @param instance - The rule's instance.
 * @param targetInstance - The target's instance.
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
 * Resolve one branch rule of one instance: its target among the names that spell it, the one in
 * an instance holding the rule's where there is one; the child of the target's instance its own
 * descends through; and the nearest name holding the two.
 *
 * @param walk - The assembly's walk.
 * @param names - The assembly's names by `[instance, node]`.
 * @param instance - The rule's instance.
 * @param rule - The rule.
 * @returns The resolution as its writer writes it.
 */
const resolutionOf = (
  walk: Walk,
  names: ReadonlyMap<string, Addition<typeof InstanceName>>,
  instance: Walked,
  rule: Addition<typeof BranchRule>,
): Addition<typeof BranchResolution> => {
  const owner = names.get(keyOf([instance.id, rule.parent])) ?? unresolvedOf(rule);
  const candidates = walk.walked.flatMap((holder) =>
    [...(walk.byDocument.get(holder.document)?.Named.values() ?? [])]
      .filter(({ identifier }) => identifier === rule.target)
      .map(({ node }) => ({ holder, node })),
  );
  const chosen =
    candidates.find(
      ({ holder }) => holder.start <= instance.start && instance.start < holder.end,
    ) ?? candidates[0];
  const targetInstance = chosen?.holder ?? instance;
  const target =
    chosen === undefined ? undefined : names.get(keyOf([targetInstance.id, chosen.node]));
  const via = viaOf(instance, targetInstance);
  const point = targetInstance === instance ? owner.start : via.siteStart;
  const found =
    target === undefined
      ? Option.none<Common>()
      : commonOf(walk, names, targetInstance, target, point);
  const t = target ?? unresolvedOf(rule);
  const c = Option.match(found, { onNone: () => t, onSome: ({ common }) => common });
  const b = Option.match(found, { onNone: () => t, onSome: ({ branch }) => branch });

  return {
    branch: b.node,
    branchEnd: b.end,
    branchParent:
      walk.byDocument.get(targetInstance.document)?.Named.get(b.node)?.parent ?? rule.parent,
    branchPart: b.part,
    branchStart: b.start,
    common: c.node,
    commonEnd: c.end,
    commonKind: c.kind,
    commonMixes: c.mixes,
    commonPart: c.part,
    commonReplaced: c.replaced,
    commonStart: c.start,
    instance: instance.id,
    owner: rule.parent,
    ownerEnd: owner.end,
    ownerKind: rule.parentKind,
    ownerPart: owner.part,
    ownerStart: owner.start,
    rule: rule.node,
    target: rule.target,
    targetEnd: t.end,
    targetInstance: targetInstance.id,
    targetInstanceEnd: BigInt(targetInstance.end),
    targetInstanceStart: BigInt(targetInstance.start),
    targetKind: t.kind,
    targetMixes: t.mixes,
    targetNode: t.node,
    targetPart: t.part,
    targetReplaced: t.replaced,
    targetStart: t.start,
    via: via.id,
    viaEnd: BigInt(via.end),
    viaParent: via.parent?.id ?? via.id,
    viaSiteStart: via.siteStart,
    viaStart: BigInt(via.start),
  };
};

/**
 * Build a package's assemblies from its documents' rows: one tree per document of a test or a
 * section, and, under a test, each instance's names, their projection and its branch rules'
 * resolutions.
 *
 * @param documents - Every document's rows ({@link rowsOf}) of one package.
 * @param newId - A fresh uuid for each instance but a root, whose id is its document's node.
 * @returns The assemblies' rows.
 */
export const assembledRowsOf = (
  documents: readonly TestRows[],
  newId: () => NodeId,
): AssembledRows => {
  const heads = documents.flatMap((rows) => [...rows.TestDocument.values()]);
  const byDocument = new Map(
    documents.flatMap((rows) =>
      [...rows.TestDocument.values()].map((row) => [row.node, rows] as const),
    ),
  );
  const roots = new Map<string, InstanceRoot>();
  const names = new Map<string, Addition<typeof InstanceName>>();
  const assembled = new Map<string, Addition<typeof AssembledName>>();
  const resolutions = new Map<string, Addition<typeof BranchResolution>>();

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
          resolutions.set(
            keyOf([instance.id, rule.node]),
            resolutionOf(walk, written.names, instance, rule),
          );
        }
      }
    }
  }

  return {
    AssembledName: assembled,
    BranchResolution: resolutions,
    Instance: roots,
    InstanceName: names,
  };
};
