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
import { Array as Arr, Option } from "effect";
import { Bits } from "@bjornpagen/grizzle";
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import type { Kind } from "#pantry/grammar/compose.ts";
import { booleanOf } from "#pantry/grammar/domains.ts";
import { Flag, grammar } from "#pantry/grammar/install.ts";
import { isSiteKind } from "#pantry/import/context.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import type { DocumentContext, ListedTarget } from "#pantry/import/context.ts";
import { comparedPathOf, entryPathOf, hrefResolverOf } from "#pantry/import/overlays/package.ts";
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
  orderingKind,
  partKind,
  sectionKind,
  sectionParts,
  selectionKind,
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
   * Whether the document is in an assembly, as the importer's contexts read it
   * (`#pantry/import/context.ts` `contextsOf`): a test, a section, or a document that holds a site
   * or that a site names.
   */
  readonly assembled: boolean;
  /**
   * The document's context (spec reading 117).
   */
  readonly context: DocumentContext;
  readonly documentAt: (path: string) => Option.Option<NodeId>;
  /**
   * The document's type, the resource's that lists it, which each site copies from its include's
   * node.
   */
  readonly documentType: Addition<typeof Site>["documentType"];
  /**
   * Whether the package holds an entry at a path.
   */
  readonly entryAt: (path: string) => boolean;
  readonly idOf: (index: number) => NodeId;
  readonly package: Uuid;
  readonly path: string;
  /**
   * The document a site's href names, with its root's kind and context, none where the path names
   * no listed document.
   */
  readonly targetAt: (path: string) => Option.Option<ListedTarget>;
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
 * The XML whitespace characters (XML 1.0, production 3, `S`), which `collapse` strips.
 */
const spaceCharacters: ReadonlySet<string> = new Set(["\t", "\n", "\r", " "]);

/**
 * Count the XML whitespace a text starts with.
 *
 * @param text - The text.
 * @returns The length of its leading run of XML whitespace.
 */
const leadingSpace = (text: string): number => {
  let at = 0;
  while (at < text.length && spaceCharacters.has(text.charAt(at))) {
    at += 1;
  }

  return at;
};

/**
 * Count the XML whitespace a text ends with.
 *
 * @param text - The text.
 * @returns The length of its trailing run of XML whitespace.
 */
const trailingSpace = (text: string): number => {
  let at = text.length;
  while (at > 0 && spaceCharacters.has(text.charAt(at - 1))) {
    at -= 1;
  }

  return text.length - at;
};

/**
 * Split a lexical form into the whitespace before it, its value and the whitespace after it, as
 * `TestToken`'s `E1_derived` proves: XML Schema's `collapse` strips the ends (Part 2, §4.3.6).
 *
 * @param lexical - The lexical form, as written.
 * @returns Its pieces; a form of whitespace alone is all lead, its value empty.
 * @throws {Error} When a piece cut at a run of whitespace is not whitespace alone: a defect of the
 *   split, never of the document.
 */
export const piecesOf = (lexical: string): Pieces => {
  const lead = lexical.slice(0, leadingSpace(lexical));
  const rest = lexical.slice(lead.length);
  const value = rest.slice(0, rest.length - trailingSpace(rest));
  const trail = rest.slice(value.length);
  if (!isSpace(lead) || !isSpace(trail)) {
    throw new Error(
      `The split of ${JSON.stringify(lexical)} cut ${JSON.stringify(lead)} and ${JSON.stringify(trail)} at runs of XML whitespace, yet one holds another character. Cut each piece at the whitespace it counts.`,
    );
  }

  return { lead, trail, value };
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
  /**
   * Each node's attributes by name, a node that writes none absent.
   */
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  /**
   * Each node's kind, and its children in document order, every node held.
   */
  readonly byId: ReadonlyMap<NodeId, Held>;
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
 * A node as the view holds it: its kind, and its children in document order.
 */
interface Held {
  readonly children: NodeRow<Composed>[];
  readonly kind: Kind;
}

/**
 * Read a node of the document: total, since {@link viewOf} holds every node, each parent before
 * its children.
 *
 * @param byId - The document's nodes.
 * @param id - The id of a node of the document.
 * @returns The node as the view holds it.
 * @throws {Error} When the document holds no node of that id: a defect of the caller, which read a
 *   node of another document, or a parent before it was held.
 */
const heldAt = (byId: ReadonlyMap<NodeId, Held>, id: NodeId): Held => {
  const held = byId.get(id);
  if (held === undefined) {
    throw new Error(
      `Node ${id} is no node of the document read so far, and the view holds each node of its document, each parent before its children. Read each node in its own document's view, in document order.`,
    );
  }

  return held;
};

/**
 * Read a document into its {@link View}.
 *
 * @param doc - The document's tree.
 * @param ids - The ids its rows are written under.
 * @returns The view.
 * @throws {Error} When a node comes before its parent, which `flatten`'s document order rules out:
 *   a defect of the caller, never of the document.
 */
const viewOf = (doc: XdmDocument<Composed>, ids: TestIds): View => {
  const rows = flatten(doc, ids.idOf);
  const byId = new Map<NodeId, Held>();
  for (const node of rows.nodes) {
    byId.set(node.id, { children: [], kind: node.kind });
    if (node.parent !== node.id) {
      heldAt(byId, node.parent).children.push(node);
    }
  }

  return {
    attributes: new Map(
      [...Map.groupBy(rows.attributes, ({ node }) => node)].map(
        ([node, held]) =>
          [node, new Map(held.map(({ lexical, name }) => [name, lexical] as const))] as const,
      ),
    ),
    byId,
    document: rows.document.node,
    folds: foldOf(rows.nodes, ids.context),
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
 * @returns Its lexical form, none where the node writes no such attribute.
 */
const valueOf = (view: View, node: NodeRow<Composed>, name: string): Option.Option<string> =>
  Option.fromNullishOr(view.attributes.get(node.id)?.get(name));

/**
 * Read a node's parent's kind: the document node's own for the document node, its own parent.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Its parent's kind.
 */
const parentKindOf = (view: View, node: NodeRow<Composed>): Kind =>
  heldAt(view.byId, node.parent).kind;

/**
 * Read a node's children, in document order.
 *
 * @param view - The document.
 * @param id - The node's id.
 * @returns Its children, none for a leaf.
 */
const childrenOf = (view: View, id: NodeId): readonly NodeRow<Composed>[] =>
  heldAt(view.byId, id).children;

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
  nearest: foldAt(view.folds, node.id).nearest,
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
      tokenNames.flatMap((name) =>
        among(tokenCarriers[name], node.kind)
          ? Option.toArray(valueOf(view, node, name)).map(
              (lexical) =>
                [
                  keyOf([node.id, name]),
                  { ...piecesOf(lexical), lexical, name, node: node.id },
                ] as const,
            )
          : [],
      ),
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
      flagCarriers.flatMap(([name, carriers]) =>
        among(carriers, node.kind)
          ? Option.toArray(valueOf(view, node, name)).map(
              (lexical) =>
                [
                  keyOf([node.id, name]),
                  {
                    kind: node.kind,
                    lexical,
                    name,
                    node: node.id,
                    parentKind: parentKindOf(view, node),
                    value: Option.contains(booleanOf(lexical), true),
                  },
                ] as const,
            )
          : [],
      ),
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
 * Read a section's scope: total, since {@link sectionsOf} reads every section in document order,
 * each after the sections above it.
 *
 * @param scopes - The sections' scopes so far.
 * @param section - A section's id.
 * @returns Its scope.
 * @throws {Error} When the section has no scope yet: a defect of the caller, which read a section
 *   before it, or a node of another document.
 */
const scopeAt = (scopes: ReadonlyMap<NodeId, Scope>, section: NodeId): Scope => {
  const scope = scopes.get(section);
  if (scope === undefined) {
    throw new Error(
      `Section ${section} has no scope yet, and the sections' scopes are read in document order, each section's before its descendants'. Read the scope of a section of this document after the section.`,
    );
  }

  return scope;
};

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
  const parentKind = parentKindOf(view, node);
  if (parentKind === sectionKind) {
    const above = scopeAt(scopes, node.parent);

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
 * Read a node's flag of a name, none where it writes none.
 */
type FlagOf = (node: NodeRow<Composed>, name: FlagName) => Option.Option<boolean>;

/**
 * Read a node's collapsed token of a name, none where it writes none.
 */
type TokenOf = (node: NodeRow<Composed>, name: TokenName) => Option.Option<string>;

/**
 * The value the ASI XSD gives each flag this module reads where its element writes none
 * (`imsqti_asiv3p0_v1p0.xsd`): `keep-together="true"` on `AssessmentSectionDType`,
 * `required="false"` on `AssessmentItemRefDType` and `AssessmentSectionDType` (a section ref or an
 * include carries no `required`, so it is never a required part), `shuffle="false"` on
 * `OrderingDType` and `with-replacement="false"` on `SelectionDType`. `visible`, which
 * `AssessmentSectionDType` requires, has none.
 */
const flagDefaults = {
  "keep-together": true,
  required: false,
  shuffle: false,
  "with-replacement": false,
} as const satisfies Partial<Record<FlagName, boolean>>;

/**
 * Read a node's flag of a name, or its XSD default where it writes none ({@link flagDefaults}).
 *
 * @param flag - Each node's flags.
 * @param node - The node.
 * @param name - The flag's name.
 * @returns Its value.
 */
const flagOr = (flag: FlagOf, node: NodeRow<Composed>, name: keyof typeof flagDefaults): boolean =>
  Option.getOrElse(flag(node, name), () => flagDefaults[name]);

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
    Option.fromNullishOr(childrenOf(view, node.id).find((child) => child.kind === kind));

  for (const node of view.rows.nodes.filter(({ kind }) => kind === sectionKind)) {
    const above = aboveOf(view, scopes, node);
    const visible = Option.getOrElse(flag(node, "visible"), () => false);
    const keepTogether = flagOr(flag, node, "keep-together");
    // A section with no ordering keeps its children's order, and one with no selection selects
    // each child once (the XSD's OrderingDType and SelectionDType: "If no ordering rule is given,
    // assume that the elements are to be ordered in the order in which they are defined", "If no
    // selection rules are given it must be assumed that all elements are to be selected").
    const shuffle = Option.exists(childOf(node, orderingKind), (child) =>
      flagOr(flag, child, "shuffle"),
    );
    const withReplacement = Option.exists(childOf(node, selectionKind), (child) =>
      flagOr(flag, child, "with-replacement"),
    );
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
      parentKind: parentKindOf(view, node),
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
 * Write a document's names: each test part, section, section ref and item ref that writes an
 * identifier, with its collapsed identifier and its scope in the document. One that writes none
 * names nothing, so it has no row, and AL3 refuses it alone (spec reading 147).
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
      .flatMap((node) =>
        Option.toArray(token(node, "identifier")).map((identifier) => {
          const above = aboveOf(view, scopes, node);
          const isPart = node.kind === partKind;
          // A section's own order and loose chain; every other kind's are false (`Named`).
          const own =
            node.kind === sectionKind
              ? scopeAt(scopes, node.id)
              : { looseChain: false, mixes: false };

          return [
            node.id,
            {
              ...tupleOf(view, node),
              end: node.end,
              identifier,
              looseChain: own.looseChain,
              mixes: own.mixes,
              parentKind: parentKindOf(view, node),
              part: isPart ? node.id : above.part,
              replaced: !isPart && above.replaced,
            },
          ] as const;
        }),
      ),
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
      .filter((node) => parentKindOf(view, node) === sectionKind && among(sectionParts, node.kind))
      .map((node) => {
        const { parent, ...tuple } = tupleOf(view, node);

        return [
          node.id,
          { ...tuple, required: flagOr(flag, node, "required"), section: parent },
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
      .filter(({ kind }) => kind === selectionKind)
      .flatMap((node) =>
        Option.toArray(valueOf(view, node, "select")).flatMap((lexical) => {
          const pieces = piecesOf(lexical);
          const parts = childrenOf(view, node.parent).filter((child) =>
            among(sectionParts, child.kind),
          );

          return /^[+-]?[0-9]+$/u.test(pieces.value)
            ? [
                [
                  node.id,
                  {
                    ...tupleOf(view, node),
                    members: BigInt(parts.length),
                    required: BigInt(parts.filter((part) => flagOr(flag, part, "required")).length),
                    selectForm: pieces.value,
                    selectLead: pieces.lead,
                    selectLexical: lexical,
                    selectTrail: pieces.trail,
                    withReplacement: flagOr(flag, node, "with-replacement"),
                  },
                ] as const,
              ]
            : [];
        }),
      ),
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
      .filter(({ kind }) => kind === orderingKind)
      .map(
        (node) =>
          [node.id, { ...tupleOf(view, node), shuffle: flagOr(flag, node, "shuffle") }] as const,
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
  isSiteKind(node.kind, parentKindOf(view, node));

/**
 * An item ref's or a site's href, resolved as its `ReferencePath` is: its node and kind, its
 * package, the path it is compared by, and whether that is the entry path it names (`resolved`).
 * An href this representation does not resolve is compared by its path as written, as a manifest
 * href is (`comparedPathOf`, reading 102), and no `ReferencePath` holds it, so "Href form" refuses
 * an item ref's; a site's has no {@link SitePath}.
 */
export interface ResolvedHref {
  readonly kind: string;
  readonly node: NodeId;
  readonly package: Uuid;
  readonly path: string;
  readonly resolved: boolean;
}

/**
 * Resolve a document's hrefs: each item ref's and site's that writes one, against the base in
 * scope, as `referenceRowsOf` resolves a `ReferencePath`. An item ref or a site with no href
 * has none: AL3 refuses an item ref or a section ref without one, and an include without one names
 * no document, which its site's existence law refuses ("Include target", spec reading 115).
 *
 * @param view - The document.
 * @returns The hrefs, by node.
 */
const hrefsOf = (view: View): ReadonlyMap<string, ResolvedHref> => {
  const resolve = hrefResolverOf(view.rows, view.ids.path);

  return new Map(
    view.rows.nodes.flatMap((node) =>
      node.kind === itemRefKind || isSite(view, node)
        ? Option.toArray(valueOf(view, node, "href")).map((lexical) => {
            const resolution = resolve(node.id, lexical);

            return [
              node.id,
              {
                kind: node.kind,
                node: node.id,
                package: view.ids.package,
                path: comparedPathOf(resolution, lexical),
                resolved: entryPathOf(resolution) !== undefined,
              },
            ] as const;
          })
        : [],
    ),
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
 * Write a document's sites, each with the scope it is placed in, whether or not it writes an href.
 *
 * @param view - The document.
 * @param scopes - The sections' scopes.
 * @returns The rows, by node.
 */
const sitesOf = (
  view: View,
  scopes: ReadonlyMap<NodeId, Scope>,
): ReadonlyMap<string, Addition<typeof Site>> =>
  new Map(
    view.rows.nodes.flatMap((node) => {
      if (!isSite(view, node)) {
        return [];
      }

      const parentKind = parentKindOf(view, node);
      const above = aboveOf(view, scopes, node);

      return [
        [
          node.id,
          {
            ...tupleOf(view, node),
            ancestry: Bits.of(Flag, [...foldAt(view.folds, node.id).ancestry]),
            children: BigInt(childrenOf(view, node.id).length),
            documentType: view.ids.documentType,
            governs: node.governs,
            nearestKind: foldAt(view.folds, node.id).nearestKind,
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
                entry: view.ids.entryAt(href.path),
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
          Option.map(view.ids.targetAt(href.path), (target) => ({ href, target })),
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
    view.rows.nodes.flatMap((node) =>
      node.kind === branchRuleKind
        ? Option.toArray(token(node, "target"))
            .filter((target) => !among(exits, target))
            .map(
              (target) =>
                [
                  node.id,
                  { ...tupleOf(view, node), parentKind: parentKindOf(view, node), target },
                ] as const,
            )
        : [],
    ),
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
    view.rows.nodes.flatMap((node) =>
      node.kind === mappingKind
        ? Option.toArray(
            Option.all({
              source: token(node, "source-identifier"),
              target: token(node, "target-identifier"),
            }),
          ).map(
            ({ source, target }) => [node.id, { ...tupleOf(view, node), source, target }] as const,
          )
        : [],
    ),
  );

/**
 * Write a document's stimulus refs, each with its collapsed identifier, whatever the document's
 * root: a stimulus ref sits in an item. One that writes no identifier has no row, and AL3 refuses
 * it alone (spec reading 147).
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
      .flatMap((node) =>
        Option.toArray(token(node, "identifier")).map(
          (identifier) => [node.id, { ...tupleOf(view, node), identifier }] as const,
        ),
      ),
  );

/**
 * Keep a relation's rows where the document is in an assembly, and none otherwise.
 *
 * @param assembled - Whether the document is in an assembly ({@link TestIds}' `assembled`).
 * @param rows - The rows.
 * @returns The rows kept.
 */
const keptIf = <A>(assembled: boolean, rows: ReadonlyMap<string, A>): ReadonlyMap<string, A> =>
  assembled ? rows : new Map();

/**
 * Build the overlay rows of one document: its tokens, flags, sites and stimulus refs whatever its
 * root, since every include's `href` is copied, an item's among them; and every other overlay's
 * where the document is in an assembly, none otherwise.
 *
 * An absent required attribute leaves out the row whose copy proves it (an item ref's or a site's
 * `href`, a selection's `select`, a name's or a stimulus ref's `identifier`), or leaves its field
 * at its null value (a section's `visible` false), and AL3 refuses the element either way.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: TestIds): TestRows => {
  const view = viewOf(doc, ids);
  const tokens = tokensOf(view);
  const flags = flagsOf(view);
  const token: TokenOf = (node, name) =>
    Option.map(Option.fromNullishOr(tokens.get(keyOf([node.id, name]))), ({ value }) => value);
  const flag: FlagOf = (node, name) =>
    Option.map(Option.fromNullishOr(flags.get(keyOf([node.id, name]))), ({ value }) => value);
  const root = doc.root.kind;
  const sections = sectionsOf(view, flag);
  const hrefs = hrefsOf(view);
  const sites = sitesOf(view, sections.scopes);
  const paths = sitePathsOf(view, sites, hrefs);
  const targets = siteTargetsOf(view, sites, paths);

  return {
    BranchRule: keptIf(ids.assembled, rulesOf(view, token)),
    Inclusion: inclusionsOf(targets),
    Named: keptIf(ids.assembled, namedOf(view, token, sections.scopes)),
    Section: keptIf(ids.assembled, sections.rows),
    SectionMember: keptIf(ids.assembled, membersOf(view, flag)),
    SectionOrdering: keptIf(ids.assembled, orderingsOf(view, flag)),
    SectionSelection: keptIf(ids.assembled, selectionsOf(view, flag)),
    Site: sites,
    SitePath: paths,
    SiteTarget: targets,
    StimulusRef: stimulusRefsOf(view, token),
    TestDocument: keptIf(
      ids.assembled,
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
    VariableMapping: keptIf(ids.assembled, mappingsOf(view, token)),
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
 * A document that heads or joins an assembly: its `TestDocument` row and every row it writes.
 */
interface AssembledDocument {
  readonly document: Addition<typeof TestDocument>;
  readonly rows: TestRows;
}

/**
 * One instance as the builder walks an assembly: its document and that document's rows, its
 * scope, its parent and its parent's id (a root's own, as the instance tree writes a root's
 * `parent`), the site it is placed at, and its interval in the tree's pre-order, which the tree
 * draws the same way.
 */
interface Walked {
  readonly document: NodeId;
  end: number;
  readonly id: NodeId;
  readonly mixes: boolean;
  readonly parent: Walked | undefined;
  readonly parentId: NodeId;
  readonly part: NodeId;
  readonly replaced: boolean;
  readonly rows: TestRows;
  readonly siteStart: bigint;
  readonly start: number;
}

/**
 * The walk of one assembly: its root's kind, every document of the package that heads or joins
 * one, the ids it draws, and the instances it has placed, in pre-order.
 */
interface Walk {
  readonly assemblyKind: Kind;
  readonly byDocument: ReadonlyMap<string, AssembledDocument>;
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
 * @param placed - The document it places.
 * @param fields - The instance's written fields but its children.
 * @returns The instance as its tree writes it.
 */
const place = (
  walk: Walk,
  chain: readonly NodeId[],
  parent: Walked | undefined,
  placed: AssembledDocument,
  fields: Omit<InstanceMember, "children">,
): InstanceMember => {
  const self: Walked = {
    document: fields.document,
    end: 0,
    id: fields.id,
    mixes: fields.mixes,
    parent,
    parentId: parent === undefined ? fields.id : parent.id,
    part: fields.part,
    replaced: fields.replaced,
    rows: placed.rows,
    siteStart: fields.siteStart,
    start: walk.walked.length,
  };
  walk.walked.push(self);

  const sites = [...self.rows.Site.values()].toSorted((a, b) => (a.start < b.start ? -1 : 1));
  const closing = new Set([...chain, self.document]);
  const children = sites.flatMap((site) =>
    Option.toArray(
      Option.flatMap(Option.fromNullishOr(self.rows.SiteTarget.get(site.node)), ({ target }) =>
        Option.fromNullishOr(walk.byDocument.get(target)),
      ),
    )
      .filter(({ document }) => !closing.has(document.node))
      .map((target) =>
        place(walk, [...chain, self.document], self, target, {
          assemblyKind: walk.assemblyKind,
          document: target.document.node,
          id: walk.newId(),
          mixes: site.parentMixes || (site.parentLooseChain && self.mixes),
          part: site.part === self.document ? self.part : site.part,
          replaced: site.replaced || self.replaced,
          rootKind: target.document.rootKind,
          site: site.node,
          siteLooseChain: site.parentLooseChain,
          siteMixes: site.parentMixes,
          sitePart: site.part,
          siteReplaced: site.replaced,
          siteStart: site.start,
        }),
      ),
  );
  self.end = walk.walked.length;

  return { ...fields, children };
};

/**
 * One name of one instance: the instance, the document's {@link Named} row and the
 * {@link InstanceName} row the instance writes for it.
 */
interface PlacedName {
  readonly instance: Walked;
  readonly named: Addition<typeof Named>;
  readonly row: Addition<typeof InstanceName>;
}

/**
 * A test's names: each instance's, by `[instance, node]` in the walk's pre-order and each
 * document's order, and their projection.
 */
interface Names {
  readonly assembled: ReadonlyMap<string, Addition<typeof AssembledName>>;
  readonly names: ReadonlyMap<string, PlacedName>;
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
  const names = new Map<string, PlacedName>();
  const assembled = new Map<string, Addition<typeof AssembledName>>();

  for (const instance of walk.walked) {
    for (const named of instance.rows.Named.values()) {
      names.set(keyOf([instance.id, named.node]), {
        instance,
        named,
        row: {
          assembly,
          end: named.end,
          identifier: named.identifier,
          instance: instance.id,
          kind: named.kind,
          mixes: named.mixes || (named.looseChain && instance.mixes),
          namedLooseChain: named.looseChain,
          namedMixes: named.mixes,
          namedPart: named.part,
          namedReplaced: named.replaced,
          node: named.node,
          part: named.part === instance.document ? instance.part : named.part,
          replaced: named.replaced || instance.replaced,
          start: named.start,
        },
      });
      assembled.set(keyOf([assembly, named.node]), {
        assembly,
        identifier: named.identifier,
        node: named.node,
      });
    }
  }

  return { assembled, names };
};

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
 * The nearest name holding a source point and a target in the target's document, and its child
 * that holds the target.
 */
interface Common {
  readonly branch: PlacedName;
  readonly common: PlacedName;
}

/**
 * Find the nearest name holding a source point and a target in the target's document, and its
 * child that holds the target: the target's ancestors among the document's names, walked up until
 * one holds the point.
 *
 * @param names - The assembly's names by `[instance, node]`.
 * @param target - The target's name in its instance.
 * @param point - The source's start in the target's document: its owner's, or its site's.
 * @returns The common name and its branch, or none where no name holds both.
 */
const commonOf = (
  names: ReadonlyMap<string, PlacedName>,
  target: PlacedName,
  point: bigint,
): Option.Option<Common> => {
  let branch = target;
  for (;;) {
    const common = names.get(keyOf([branch.instance.id, branch.named.parent]));
    if (common === undefined) {
      return Option.none();
    }

    if (holdsPoint(common.row, point)) {
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
 * @param names - The assembly's names by `[instance, node]`, in pre-order.
 * @param instance - The rule's instance.
 * @param rule - The rule.
 * @returns The resolution, its target and its shuffle, each as its writer writes it, or none.
 */
const resolutionOf = (
  names: ReadonlyMap<string, PlacedName>,
  instance: Walked,
  rule: Addition<typeof BranchRule>,
): Option.Option<Resolved> =>
  Option.map(
    Option.fromNullishOr(names.get(keyOf([instance.id, rule.parent]))),
    ({ row: owner }) => {
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
      const placed = Arr.head(
        [...names.values()].filter(
          (name) => holdsInstance(name.instance, instance) && name.named.identifier === rule.target,
        ),
      );
      const target = placed.pipe(
        Option.map(({ instance: holder, row: name }) => {
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
            viaParent: via.parentId,
            viaSiteStart: via.siteStart,
            viaStart: BigInt(via.start),
          } satisfies Addition<typeof BranchTarget>;
        }),
      );
      const shuffle = placed.pipe(
        Option.flatMap((held) => {
          const holder = held.instance;
          const via = viaOf(instance, holder);
          const point = holder === instance ? owner.start : via.siteStart;

          return Option.flatMap(commonOf(names, held, point), ({ branch, common }) =>
            common.row.mixes && !holdsPoint(branch.row, point)
              ? Option.some({
                  assembly: held.row.assembly,
                  branch: branch.row.node,
                  branchEnd: branch.row.end,
                  branchParent: common.row.node,
                  branchPart: branch.row.part,
                  branchStart: branch.row.start,
                  common: common.row.node,
                  commonEnd: common.row.end,
                  commonKind: common.row.kind,
                  commonMixes: common.row.mixes,
                  commonPart: common.row.part,
                  commonReplaced: common.row.replaced,
                  commonStart: common.row.start,
                  instance: instance.id,
                  ownerStart: owner.start,
                  rule: rule.node,
                  targetInstance: holder.id,
                  targetStart: held.row.start,
                  viaSiteStart: via.siteStart,
                } satisfies Addition<typeof BranchShuffle>)
              : Option.none(),
          );
        }),
      );

      return { resolution, shuffle, target };
    },
  );

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
  const assembledDocuments = documents.flatMap((rows) =>
    [...rows.TestDocument.values()].map((document): AssembledDocument => ({ document, rows })),
  );
  const byDocument = new Map(
    assembledDocuments.map((assembled) => [assembled.document.node, assembled] as const),
  );
  const roots = new Map<string, InstanceRoot>();
  const names = new Map<string, Addition<typeof InstanceName>>();
  const assembled = new Map<string, Addition<typeof AssembledName>>();
  const resolutions = new Map<string, Addition<typeof BranchResolution>>();
  const targets = new Map<string, Addition<typeof BranchTarget>>();
  const shuffles = new Map<string, Addition<typeof BranchShuffle>>();

  for (const head of assembledDocuments.filter(({ document }) => !spliced.has(document.node))) {
    const { node, rootKind } = head.document;
    const walk: Walk = { assemblyKind: rootKind, byDocument, newId, walked: [] };
    const tree = place(walk, [], undefined, head, {
      assemblyKind: rootKind,
      document: node,
      id: node,
      mixes: false,
      part: node,
      replaced: false,
      rootKind,
      site: node,
      siteLooseChain: false,
      siteMixes: false,
      sitePart: node,
      siteReplaced: false,
      siteStart: 0n,
    });
    roots.set(node, { ...tree, assembly: node });

    if (rootKind === testKind) {
      const written = namesOf(node, walk);
      for (const [at, { row }] of written.names) {
        names.set(at, row);
      }
      for (const [at, row] of written.assembled) {
        assembled.set(at, row);
      }
      for (const instance of walk.walked) {
        for (const rule of instance.rows.BranchRule.values()) {
          const at = keyOf([instance.id, rule.node]);
          for (const resolved of Option.toArray(resolutionOf(written.names, instance, rule))) {
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
