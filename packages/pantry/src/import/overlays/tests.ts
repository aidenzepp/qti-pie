/**
 * The overlay rows of tests and sections (plan §1.7 O7, §C's `rowsOf`), each relation's rows a
 * keyed set.
 *
 * Two builders, as `#pantry/qti/tests.ts` has two layers:
 *
 * - {@link rowsOf} reads one document's view (`DocumentView` of `#pantry/import/fold.ts`) into its
 *   document-level rows: the document, its tokens and flags, names, sections and their parts,
 *   selections and orderings, sites, branch rules and the item each item ref names, each href
 *   resolved as its `ReferencePath` is (`#pantry/import/overlays/package.ts`).
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
import type { Addition } from "@bjornpagen/grizzle";
import type { Kind } from "#pantry/grammar/compose.ts";
import { booleanOf } from "#pantry/grammar/domains.ts";
import { Flag, grammar } from "#pantry/grammar/install.ts";
import { isSiteKind } from "#pantry/import/context.ts";
import { foldAt, governorOf } from "#pantry/import/fold.ts";
import type { DocumentView, Folds } from "#pantry/import/fold.ts";
import { namedBy } from "#pantry/import/names.ts";
import { piecesOf } from "#pantry/import/pieces.ts";
import type { ListedTarget } from "#pantry/import/context.ts";
import { comparedPathOf, entryPathOf, hrefResolverOf } from "#pantry/import/overlays/package.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeRow } from "#pantry/model/xdm.ts";
import type {
  AssembledName,
  BranchResolution,
  BranchRule,
  BranchShuffle,
  BranchTarget,
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
  sectionRefKind,
  selectionKind,
  splicingParents,
  stimulusRefKind,
  testKind,
} from "#pantry/vocab/terms/tests.ts";
import type { FlagName } from "#pantry/vocab/terms/tests.ts";

/**
 * Where one document stands in its package, as this builder reads it beside the document's view:
 * its package's manifest identifier, its entry's path, and the documents and entries of its package
 * by their paths, which a site's href names. It is the part of the importer's `DocumentPlace`
 * (Q5.15) this builder reads.
 */
export interface TestIds {
  /**
   * Whether the document is in an assembly, as the importer's contexts read it
   * (`#pantry/import/context.ts` `contextsOf`): a test, a section, or a document that holds a site
   * or that a site names.
   */
  readonly assembled: boolean;
  /**
   * The document's type, the resource's that lists it, which each site copies from its include's
   * node.
   */
  readonly documentType: Addition<typeof Site>["documentType"];
  /**
   * Whether the package holds an entry at a path.
   */
  readonly entryAt: (path: string) => boolean;
  readonly package: Addition<typeof Site>["package"];
  readonly path: Addition<typeof Site>["path"];
  /**
   * The document a site's href names, with its root's kind and context, none where the path names
   * no listed document.
   */
  readonly targetAt: (path: string) => Option.Option<ListedTarget>;
}

/**
 * One document's overlay rows, one keyed set per relation: each map from the text of a row's key
 * within its document to the row as its writer writes it. A row keyed by its element is keyed by
 * its element's start; one keyed by its element and a name by the two as a JSON array; the
 * document's own row by its path.
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
 * Whether a kind is one of a list's.
 *
 * @param kinds - The list.
 * @param kind - The kind.
 * @returns Whether the list holds it.
 */
const among = (kinds: readonly string[], kind: string): boolean => kinds.includes(kind);

/**
 * Decide whether a site places the document it names (`SiteTarget.places`, spec readings 85 and
 * 117): it is a section ref, or an include that may stand for that document's root (`IncludeRoot`,
 * reading 114), whatever its parent. An include that may not stand for its target's root names it
 * but places nothing, and "Include root" alone refuses it.
 *
 * @param site - The site: its kind, its parent's kind and its version.
 * @param root - The root kind of the document its href names.
 * @returns Whether it places it.
 */
const placesAt = (
  site: Pick<Addition<typeof Site>, "kind" | "parentKind" | "version">,
  root: string,
): boolean =>
  site.kind === sectionRefKind ||
  Option.isSome(
    Option.flatMap(
      grammar.include.includeSetOf.lookup({ parent: site.parentKind, version: site.version }),
      ({ set }) => grammar.include.includeMember.lookup({ kind: root, set }),
    ),
  );

/**
 * Decide whether a site splices the document it names in place (`Inclusion.splices`, spec reading
 * 117): it is an include under one of `splicingParents` that places that document, as
 * {@link placesAt} decides. A section ref places its target whole, and so does an include under a
 * section.
 *
 * @param site - The site: its kind, its parent's kind and its version.
 * @param root - The root kind of the document its href names.
 * @returns Whether it splices it.
 */
const splicesAt = (
  site: Pick<Addition<typeof Site>, "kind" | "parentKind" | "version">,
  root: string,
): boolean =>
  site.kind === includeKind && among(splicingParents, site.parentKind) && placesAt(site, root);

/**
 * One document as the builders read it: its flat rows and the indexes over them, each node by its
 * start.
 */
interface View {
  /**
   * Each node's attributes by name, a node that writes none absent.
   */
  readonly attributes: ReadonlyMap<bigint, ReadonlyMap<string, string>>;
  /**
   * Each node's kind, and its children in document order, every node held.
   */
  readonly byStart: ReadonlyMap<bigint, Held>;
  /**
   * Each node's fold under the document's context: its ancestry and nearest interaction among
   * them.
   */
  readonly folds: Folds;
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
 * Read a node of the document: total, since {@link testViewOf} holds every node, each parent before
 * its children.
 *
 * @param byStart - The document's nodes.
 * @param start - The start of a node of the document.
 * @returns The node as the view holds it.
 * @throws {Error} When the document holds no node at that start: a defect of the caller, which read
 *   a node of another document, or a parent before it was held.
 */
const heldAt = (byStart: ReadonlyMap<bigint, Held>, start: bigint): Held => {
  const held = byStart.get(start);
  if (held === undefined) {
    throw new Error(
      `No node of the document read so far starts at ${start}, and the view holds each node of its document, each parent before its children. Read each node in its own document's view, in document order.`,
    );
  }

  return held;
};

/**
 * Read a document into its {@link View}.
 *
 * @param document - The document's view.
 * @param ids - Where it stands in its package.
 * @returns The view.
 * @throws {Error} When a node comes before its parent, which `flatten`'s document order rules out:
 *   a defect of the caller, never of the document.
 */
const testViewOf = (document: DocumentView, ids: TestIds): View => {
  const { rows } = document;
  const byStart = new Map<bigint, Held>();
  for (const node of rows.nodes) {
    byStart.set(node.start, { children: [], kind: node.kind });
    if (node.parent !== node.start) {
      heldAt(byStart, node.parent).children.push(node);
    }
  }

  return {
    attributes: new Map(
      [...Map.groupBy(rows.attributes, ({ start }) => start)].map(
        ([start, held]) =>
          [start, new Map(held.map(({ lexical, name }) => [name, lexical] as const))] as const,
      ),
    ),
    byStart,
    folds: document.folds,
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
  Option.fromNullishOr(view.attributes.get(node.start)?.get(name));

/**
 * Read a node's parent's kind: the document node's own for the document node, its own parent.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Its parent's kind.
 */
const parentKindOf = (view: View, node: NodeRow<Composed>): Kind =>
  heldAt(view.byStart, node.parent).kind;

/**
 * Read a node's children, in document order.
 *
 * @param view - The document.
 * @param start - The node's start.
 * @returns Its children, none for a leaf.
 */
const childrenOf = (view: View, start: bigint): readonly NodeRow<Composed>[] =>
  heldAt(view.byStart, start).children;

/**
 * A node's {@link nodeRef}-shaped tuple, as every overlay of it copies it.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Its tuple.
 */
const tupleOf = (view: View, node: NodeRow<Composed>) => ({
  kind: node.kind,
  nearest: foldAt(view.folds, node.start).nearest,
  package: view.ids.package,
  parent: node.parent,
  path: view.ids.path,
  start: node.start,
  version: node.version,
});

/**
 * The fields that name an element of the document: its package, its document's path and its start.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Its key's fields.
 */
const placeOf = (view: View, node: NodeRow<Composed>) => ({
  package: view.ids.package,
  path: view.ids.path,
  start: node.start,
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
 * @returns The rows, by `[start, name]`.
 */
const tokensOf = (view: View): ReadonlyMap<string, Addition<typeof TestToken>> =>
  new Map(
    view.rows.nodes.flatMap((node) =>
      tokenNames.flatMap((name) =>
        among(tokenCarriers[name], node.kind)
          ? Option.toArray(valueOf(view, node, name)).map(
              (lexical) =>
                [
                  keyOf([String(node.start), name]),
                  { ...piecesOf(lexical), ...placeOf(view, node), lexical, name },
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
 * @returns The rows, by `[start, name]`.
 */
const flagsOf = (view: View): ReadonlyMap<string, Addition<typeof TestFlag>> =>
  new Map(
    view.rows.nodes.flatMap((node) =>
      flagCarriers.flatMap(([name, carriers]) =>
        among(carriers, node.kind)
          ? Option.toArray(valueOf(view, node, name)).map(
              (lexical) =>
                [
                  keyOf([String(node.start), name]),
                  {
                    ...placeOf(view, node),
                    kind: node.kind,
                    lexical,
                    name,
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
  /**
   * The start of the test part it sits in, 0 (the document node's) where none does.
   */
  readonly part: bigint;
  readonly replacing: boolean;
}

/**
 * The scope a node sits in, its parent's: a section's, a test part's, or none.
 */
interface Above {
  readonly parentLooseChain: boolean;
  readonly parentMixes: boolean;
  readonly part: bigint;
  readonly replaced: boolean;
}

/**
 * Read a section's scope: total, since {@link sectionsOf} reads every section in document order,
 * each after the sections above it.
 *
 * @param scopes - The sections' scopes so far.
 * @param section - A section's start.
 * @returns Its scope.
 * @throws {Error} When the section has no scope yet: a defect of the caller, which read a section
 *   before it, or a node of another document.
 */
const scopeAt = (scopes: ReadonlyMap<bigint, Scope>, section: bigint): Scope => {
  const scope = scopes.get(section);
  if (scope === undefined) {
    throw new Error(
      `The section at ${section} has no scope yet, and the sections' scopes are read in document order, each section's before its descendants'. Read the scope of a section of this document after the section.`,
    );
  }

  return scope;
};

/**
 * Read the scope a node sits in, from its parent: a section's own, a test part's (the part, no
 * replacement and no drawn order), or the document's (no part, 0, and a loose chain that reaches
 * the section that places the document).
 *
 * @param view - The document.
 * @param scopes - The sections' scopes so far, in document order.
 * @param node - The node.
 * @returns Its scope.
 */
const aboveOf = (
  view: View,
  scopes: ReadonlyMap<bigint, Scope>,
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
    : { parentLooseChain: true, parentMixes: false, part: 0n, replaced: false };
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
  readonly scopes: ReadonlyMap<bigint, Scope>;
}

/**
 * Write a document's sections, each with its flags and its scope, in document order so each
 * section's parent's scope precedes it.
 *
 * @param view - The document.
 * @param flag - Each node's flags.
 * @returns The rows, by start, and each section's scope.
 */
const sectionsOf = (view: View, flag: FlagOf): Sections => {
  const rows = new Map<string, Addition<typeof Section>>();
  const scopes = new Map<bigint, Scope>();
  const childOf = (node: NodeRow<Composed>, kind: string) =>
    Option.fromNullishOr(childrenOf(view, node.start).find((child) => child.kind === kind));

  for (const node of view.rows.nodes.filter(({ kind }) => kind === sectionKind)) {
    const above = aboveOf(view, scopes, node);
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
    // Invisible only where it writes `visible` false: one that writes none is neither visible nor
    // invisible (information model §4.2.6), so it is not loose, and AL3 alone refuses it.
    const loose = Option.contains(flag(node, "visible"), false) && !keepTogether;
    const scope: Scope = {
      looseChain: loose && above.parentLooseChain,
      mixes: shuffle || (loose && above.parentMixes),
      part: above.part,
      replacing: above.replaced || withReplacement,
    };
    scopes.set(node.start, scope);
    rows.set(String(node.start), {
      ...tupleOf(view, node),
      keepTogether,
      loose,
      looseChain: scope.looseChain,
      mixes: scope.mixes,
      parentKind: parentKindOf(view, node),
      parentLooseChain: above.parentLooseChain,
      parentMixes: above.parentMixes,
      part: scope.part,
      replaced: above.replaced,
      replacing: scope.replacing,
      shuffle,
      withReplacement,
    });
  }

  return { rows, scopes };
};

/**
 * Write a document's names: each test part, section, section ref and item ref whose identifier
 * names something, with its collapsed identifier and its scope in the document. One that writes
 * none names nothing, so it has no row, and AL3 refuses it alone (spec reading 147). One whose
 * collapsed identifier is no NCName ({@link namedBy}) names nothing either, so it has no row, and
 * its value domain refuses it alone (spec reading 152, decision 457 (2)).
 *
 * @param view - The document.
 * @param token - Each node's tokens.
 * @param scopes - The sections' scopes.
 * @returns The rows, by node.
 */
const namedOf = (
  view: View,
  token: TokenOf,
  scopes: ReadonlyMap<bigint, Scope>,
): ReadonlyMap<string, Addition<typeof Named>> =>
  new Map(
    view.rows.nodes
      .filter(({ kind }) => among(namedKinds, kind))
      .flatMap((node) =>
        Option.toArray(Option.flatMap(token(node, "identifier"), namedBy)).map((identifier) => {
          const above = aboveOf(view, scopes, node);
          const isPart = node.kind === partKind;
          // A section's own order and loose chain; every other kind's are false (`Named`).
          const own =
            node.kind === sectionKind
              ? scopeAt(scopes, node.start)
              : { looseChain: false, mixes: false };

          return [
            String(node.start),
            {
              ...tupleOf(view, node),
              end: node.end,
              identifier,
              looseChain: own.looseChain,
              mixes: own.mixes,
              parentKind: parentKindOf(view, node),
              part: isPart ? node.start : above.part,
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
          String(node.start),
          { ...tuple, required: flagOr(flag, node, "required"), section: parent },
        ] as const;
      }),
  );

/**
 * Write a document's selections, each with its `select` split around its collapsed value and its
 * section's count of parts. A selection that writes no `select` has no row: AL3 refuses it, and
 * `SectionSelection`'s mirror names it too. One whose `select` names no integer has its row all
 * the same, its form as written: `SelectForm`'s pattern law refuses the form as PostgreSQL casts it
 * into its column, and the attribute's value domain refuses the attribute, so the database judges
 * the form and this builder never does.
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
        Option.toArray(valueOf(view, node, "select")).map((lexical) => {
          const pieces = piecesOf(lexical);
          const parts = childrenOf(view, node.parent).filter((child) =>
            among(sectionParts, child.kind),
          );

          return [
            String(node.start),
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
          ] as const;
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
          [
            String(node.start),
            { ...tupleOf(view, node), shuffle: flagOr(flag, node, "shuffle") },
          ] as const,
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
 * An item ref's or a site's href, resolved as its `ReferencePath` is: its element (`package`,
 * `path`, `start`) and kind, `target`, the path it is compared by, in the element's own package,
 * whether that is the entry path it names (`resolved`), and whether it resolves outside the package
 * (`external`), as its `Reference`'s scope says. An href
 * this representation does not resolve is compared by its path as written, as a manifest href is
 * (`comparedPathOf`, reading 102), and no `ReferencePath` holds it, so "Href form" refuses an item
 * ref's; a site's has no {@link SitePath}, and an external one marks its {@link Site} `external`.
 */
export interface ResolvedHref {
  readonly external: boolean;
  readonly kind: string;
  readonly package: TestIds["package"];
  readonly path: TestIds["path"];
  readonly resolved: boolean;
  readonly start: bigint;
  readonly target: string;
}

/**
 * Resolve a document's hrefs: each item ref's and site's that writes one, against the base in
 * scope, as `referenceRowsOf` resolves a `ReferencePath`. An item ref or a site with no href
 * has none: AL3 refuses an item ref or a section ref without one, and an include without one names
 * no document, which its site's existence law refuses ("Include target", spec reading 115).
 *
 * @param view - The document.
 * @returns The hrefs, by start.
 */
const hrefsOf = (view: View): ReadonlyMap<string, ResolvedHref> => {
  const resolve = hrefResolverOf(view.rows, view.ids.path);

  return new Map(
    view.rows.nodes.flatMap((node) =>
      node.kind === itemRefKind || isSite(view, node)
        ? Option.toArray(valueOf(view, node, "href")).map((lexical) => {
            const resolution = resolve(node.start, lexical);

            return [
              String(node.start),
              {
                ...placeOf(view, node),
                external: resolution.scope === "external",
                kind: node.kind,
                resolved: Option.isSome(entryPathOf(resolution)),
                target: comparedPathOf(resolution, lexical),
              },
            ] as const;
          })
        : [],
    ),
  );
};

/**
 * Resolve the hrefs of a test's or a section's item refs, which `ItemRefHref` copies: each item
 * ref's path, as its `ReferencePath` resolves it; none for any other document.
 *
 * @param document - The document's view.
 * @param ids - Where it stands in its package.
 * @returns The item refs' hrefs, in document order.
 */
export const itemRefPathsOf = (document: DocumentView, ids: TestIds): readonly ResolvedHref[] =>
  among(assembledRoots, document.tree.root.kind)
    ? [...hrefsOf(testViewOf(document, ids)).values()].filter(({ kind }) => kind === itemRefKind)
    : [];

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
  scopes: ReadonlyMap<bigint, Scope>,
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
          String(node.start),
          {
            ...tupleOf(view, node),
            ancestry: Bits.of(Flag, [...foldAt(view.folds, node.start).ancestry]),
            children: BigInt(childrenOf(view, node.start).length),
            documentType: view.ids.documentType,
            external: hrefs.get(String(node.start))?.external ?? false,
            governor: governorOf(node.version, node.kind, node.governs),
            nearestKind: foldAt(view.folds, node.start).nearestKind,
            nearestPath: Option.getOrElse(
              foldAt(view.folds, node.start).nearestPath,
              () => view.ids.path,
            ),
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
 * Write each site's {@link SitePath}: its href's path, and whether the package holds an entry
 * there, a row only where the site writes an href that resolves to a path of the package.
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
        Option.filter(
          Option.fromNullishOr(hrefs.get(String(site.start))),
          ({ resolved }) => resolved,
        ),
        {
          onNone: () => [],
          onSome: (href) => [
            [
              String(site.start),
              {
                entry: view.ids.entryAt(href.target),
                kind: site.kind,
                package: site.package,
                path: site.path,
                start: site.start,
                target: href.target,
              },
            ] as const,
          ],
        },
      ),
    ),
  );

/**
 * Write each site's {@link SiteTarget}: the path of the document its href's path names, with that
 * document's root kind and context, and the site's fields the target's laws read. A site that
 * writes no href, or whose path names no listed document, has none.
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
        Option.flatMap(Option.fromNullishOr(paths.get(String(site.start))), (href) =>
          Option.map(view.ids.targetAt(href.target), (target) => ({ href, target })),
        ),
        {
          onNone: () => [],
          onSome: ({ href, target }) => [
            [
              String(site.start),
              {
                ancestry: site.ancestry,
                kind: site.kind,
                nearest: site.nearest,
                nearestKind: site.nearestKind,
                package: site.package,
                parentKind: site.parentKind,
                path: site.path,
                places: placesAt(site, target.rootKind),
                splices: splicesAt(site, target.rootKind),
                start: site.start,
                target: href.target,
                targetNearest: target.context.nearest,
                targetNearestKind: target.context.nearestKind,
                targetNearestPath: Option.getOrElse(target.context.nearestPath, () => href.target),
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
              String(site.start),
              {
                includeParent: site.parentKind,
                package: site.package,
                parentKind: site.parentKind,
                path: site.path,
                places: site.places,
                root: site.targetRoot,
                splices: site.splices,
                start: site.start,
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
                  String(node.start),
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
            ({ source, target }) =>
              [String(node.start), { ...tupleOf(view, node), source, target }] as const,
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
          (identifier) => [String(node.start), { ...tupleOf(view, node), identifier }] as const,
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
 * `href`, a selection's `select`, a name's or a stimulus ref's `identifier`, a section's
 * `visible`), and AL3 refuses the element.
 *
 * @param document - The document's view.
 * @param ids - Where it stands in its package.
 * @returns Every overlay's rows.
 */
export const rowsOf = (document: DocumentView, ids: TestIds): TestRows => {
  const view = testViewOf(document, ids);
  const tokens = tokensOf(view);
  const flags = flagsOf(view);
  const token: TokenOf = (node, name) =>
    Option.map(
      Option.fromNullishOr(tokens.get(keyOf([String(node.start), name]))),
      ({ value }) => value,
    );
  const flag: FlagOf = (node, name) =>
    Option.map(
      Option.fromNullishOr(flags.get(keyOf([String(node.start), name]))),
      ({ value }) => value,
    );
  const root = document.tree.root.kind;
  const sections = sectionsOf(view, flag);
  const hrefs = hrefsOf(view);
  const sites = sitesOf(view, hrefs, sections.scopes);
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
      new Map([[ids.path, { package: ids.package, path: ids.path, rootKind: root }]]),
    ),
    TestFlag: flags,
    TestToken: tokens,
    VariableMapping: keptIf(ids.assembled, mappingsOf(view, token)),
  };
};

/**
 * A member instance as its tree writes it: every field its caller writes but its root fields, with
 * its own children nested.
 */
export type InstanceMember = Omit<Addition<typeof Instance>, "assembly" | "package"> & {
  readonly children: readonly InstanceMember[];
};

/**
 * An assembly's root instance as its tree writes it: its root fields, and its children nested.
 */
export type InstanceRoot = Addition<typeof Instance> & {
  readonly children: readonly InstanceMember[];
};

/**
 * A package's assemblies, one keyed set per relation: each root instance by its assembly's path,
 * with its tree nested, and each counted member by its key within the package, as a JSON array.
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
 * One instance as the builder walks an assembly: its document's path and that document's rows,
 * its scope, its parent, the site it is placed at (its parent's document's, 0 for the root), and
 * its interval in the tree's pre-order, which the tree draws the same way: `start` is its key.
 */
interface Walked {
  readonly document: string;
  end: number;
  readonly mixes: boolean;
  readonly parent: Walked | undefined;
  readonly part: bigint;
  readonly replaced: boolean;
  readonly rows: TestRows;
  readonly site: bigint;
  readonly start: number;
}

/**
 * The walk of one assembly: its root's kind, every document of the package that heads or joins
 * one by its path, and the instances it has placed, in pre-order.
 */
interface Walk {
  readonly assemblyKind: Kind;
  readonly byDocument: ReadonlyMap<string, AssembledDocument>;
  readonly walked: Walked[];
}

/**
 * Read an instance's parent's start, as the instance tree draws `parent`: the root's own, 0.
 *
 * @param instance - The instance.
 * @returns Its parent's start.
 */
const parentStartOf = (instance: Walked): bigint =>
  BigInt(instance.parent === undefined ? instance.start : instance.parent.start);

/**
 * Place a document and one child per site of it that places its target (`SiteTarget.places`), each
 * the document the site names. A site that names no document of the package places nothing, and its
 * own laws refuse it; nor does an include that may not stand for its target's root, which "Include
 * root" alone refuses; nor does a site that names a document on the chain, the document itself
 * included, which would close an inclusion cycle: its instance holds fewer children than its
 * document has sites that place their target, which "Inclusion cycle" refuses, and no instance
 * repeats a document, whose placements would break the assembly's keys.
 *
 * @param walk - The assembly's walk.
 * @param chain - The paths of the documents of the instance's ancestors.
 * @param parent - The instance's parent, none for the root.
 * @param placed - The document it places.
 * @param fields - The instance's written fields but its root fields and its children.
 * @returns The instance as its tree writes it.
 */
const place = (
  walk: Walk,
  chain: readonly string[],
  parent: Walked | undefined,
  placed: AssembledDocument,
  fields: Omit<InstanceMember, "children">,
): InstanceMember => {
  const self: Walked = {
    document: fields.document,
    end: 0,
    mixes: fields.mixes,
    parent,
    part: fields.part,
    replaced: fields.replaced,
    rows: placed.rows,
    site: fields.site,
    start: walk.walked.length,
  };
  walk.walked.push(self);

  const sites = [...self.rows.Site.values()].toSorted((a, b) => (a.start < b.start ? -1 : 1));
  const closing = new Set([...chain, self.document]);
  const children = sites.flatMap((site) =>
    Option.toArray(
      Option.flatMap(
        Option.filter(
          Option.fromNullishOr(self.rows.SiteTarget.get(String(site.start))),
          ({ places }) => places,
        ),
        ({ target }) => Option.fromNullishOr(walk.byDocument.get(target)),
      ),
    )
      .filter(({ document }) => !closing.has(document.path))
      .map((target) =>
        place(walk, [...chain, self.document], self, target, {
          assemblyKind: walk.assemblyKind,
          document: target.document.path,
          mixes: site.parentMixes || (site.parentLooseChain && self.mixes),
          part: site.part === 0n ? self.part : site.part,
          replaced: site.replaced || self.replaced,
          rootKind: target.document.rootKind,
          site: site.start,
          siteDocument: self.document,
          siteLooseChain: site.parentLooseChain,
          siteMixes: site.parentMixes,
          sitePart: site.part,
          siteReplaced: site.replaced,
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
 * A test's names: each instance's, by `[instance, start]` in the walk's pre-order and each
 * document's order, and their projection.
 */
interface Names {
  readonly assembled: ReadonlyMap<string, Addition<typeof AssembledName>>;
  readonly names: ReadonlyMap<string, PlacedName>;
}

/**
 * The key text of one name of one instance: the instance's start and the name's.
 *
 * @param instance - The instance's start.
 * @param start - The name's start in the instance's document.
 * @returns The text.
 */
const nameKey = (instance: bigint | number, start: bigint): string =>
  keyOf([String(instance), String(start)]);

/**
 * Write the names of a test's instances, each a name of its document with its scope in the
 * assembly, and their projection, each written element once.
 *
 * @param test - The test's `TestDocument` row, whose path names the assembly.
 * @param walk - The test's walk.
 * @returns The names by `[instance, start]`, and the projection by `[path, start]`.
 */
const namesOf = (test: Addition<typeof TestDocument>, walk: Walk): Names => {
  const names = new Map<string, PlacedName>();
  const assembled = new Map<string, Addition<typeof AssembledName>>();
  const { package: pkg, path: assembly } = test;

  for (const instance of walk.walked) {
    for (const named of instance.rows.Named.values()) {
      names.set(nameKey(instance.start, named.start), {
        instance,
        named,
        row: {
          assembly,
          end: named.end,
          identifier: named.identifier,
          instance: BigInt(instance.start),
          kind: named.kind,
          mixes: named.mixes || (named.looseChain && instance.mixes),
          namedLooseChain: named.looseChain,
          namedMixes: named.mixes,
          namedPart: named.part,
          namedReplaced: named.replaced,
          package: pkg,
          parent: named.parent,
          part: named.part === 0n ? instance.part : named.part,
          path: instance.document,
          replaced: named.replaced || instance.replaced,
          start: named.start,
        },
      });
      assembled.set(keyOf([instance.document, String(named.start)]), {
        assembly,
        identifier: named.identifier,
        package: pkg,
        path: instance.document,
        start: named.start,
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
 * @param names - The assembly's names by `[instance, start]`.
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
    const common = names.get(nameKey(branch.instance.start, branch.named.parent));
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
 * @param test - The test's `TestDocument` row, whose path names the assembly.
 * @param names - The assembly's names by `[instance, start]`, in pre-order.
 * @param instance - The rule's instance.
 * @param rule - The rule.
 * @returns The resolution, its target and its shuffle, each as its writer writes it, or none.
 */
const resolutionOf = (
  test: Addition<typeof TestDocument>,
  names: ReadonlyMap<string, PlacedName>,
  instance: Walked,
  rule: Addition<typeof BranchRule>,
): Option.Option<Resolved> =>
  Option.map(
    Option.fromNullishOr(names.get(nameKey(instance.start, rule.parent))),
    ({ row: owner }) => {
      const at = {
        assembly: test.path,
        instance: BigInt(instance.start),
        package: test.package,
        rule: rule.start,
      };
      const ownerFields = {
        owner: rule.parent,
        ownerEnd: owner.end,
        ownerKind: rule.parentKind,
        ownerPart: owner.part,
      };
      const resolution: Addition<typeof BranchResolution> = {
        ...at,
        ...ownerFields,
        path: instance.document,
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
            ...at,
            ...ownerFields,
            target: rule.target,
            targetEnd: name.end,
            targetInstance: BigInt(holder.start),
            targetInstanceEnd: BigInt(holder.end),
            targetKind: name.kind,
            targetMixes: name.mixes,
            targetPart: name.part,
            targetReplaced: name.replaced,
            targetStart: name.start,
            via: BigInt(via.start),
            viaEnd: BigInt(via.end),
            viaParent: parentStartOf(via),
            viaSite: via.site,
          } satisfies Addition<typeof BranchTarget>;
        }),
      );
      const shuffle = placed.pipe(
        Option.flatMap((held) => {
          const holder = held.instance;
          const via = viaOf(instance, holder);
          const point = holder === instance ? owner.start : via.site;

          return Option.flatMap(commonOf(names, held, point), ({ branch, common }) =>
            common.row.mixes && !holdsPoint(branch.row, point)
              ? Option.some({
                  ...at,
                  branch: branch.row.start,
                  branchEnd: branch.row.end,
                  branchParent: common.row.start,
                  branchPart: branch.row.part,
                  common: common.row.start,
                  commonEnd: common.row.end,
                  commonKind: common.row.kind,
                  commonMixes: common.row.mixes,
                  commonPart: common.row.part,
                  commonReplaced: common.row.replaced,
                  owner: owner.start,
                  targetInstance: BigInt(holder.start),
                  targetStart: held.row.start,
                  viaSite: via.site,
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
 * assemblies of the documents that place it, and never alone. Every instance is named by its
 * assembly's path and its pre-order start, so the build is a function of the documents alone.
 *
 * @param documents - Every document's rows ({@link rowsOf}) of one package.
 * @returns The assemblies' rows.
 */
export const assembledRowsOf = (documents: readonly TestRows[]): AssembledRows => {
  const spliced = new Set(
    documents.flatMap((rows) =>
      [...rows.SiteTarget.values()].filter(({ splices }) => splices).map(({ target }) => target),
    ),
  );
  const assembledDocuments = documents.flatMap((rows) =>
    [...rows.TestDocument.values()].map((document): AssembledDocument => ({ document, rows })),
  );
  const byDocument = new Map(
    assembledDocuments.map((assembled) => [assembled.document.path, assembled] as const),
  );
  const roots = new Map<string, InstanceRoot>();
  const names = new Map<string, Addition<typeof InstanceName>>();
  const assembled = new Map<string, Addition<typeof AssembledName>>();
  const resolutions = new Map<string, Addition<typeof BranchResolution>>();
  const targets = new Map<string, Addition<typeof BranchTarget>>();
  const shuffles = new Map<string, Addition<typeof BranchShuffle>>();

  for (const head of assembledDocuments.filter(({ document }) => !spliced.has(document.path))) {
    const { package: pkg, path, rootKind } = head.document;
    const walk: Walk = { assemblyKind: rootKind, byDocument, walked: [] };
    const tree = place(walk, [], undefined, head, {
      assemblyKind: rootKind,
      document: path,
      mixes: false,
      part: 0n,
      replaced: false,
      rootKind,
      site: 0n,
      siteDocument: path,
      siteLooseChain: false,
      siteMixes: false,
      sitePart: 0n,
      siteReplaced: false,
    });
    roots.set(path, { ...tree, assembly: path, package: pkg });

    if (rootKind === testKind) {
      const written = namesOf(head.document, walk);
      for (const [at, { row }] of written.names) {
        names.set(keyOf([path, at]), row);
      }
      for (const [at, row] of written.assembled) {
        assembled.set(keyOf([path, at]), row);
      }
      for (const instance of walk.walked) {
        for (const rule of instance.rows.BranchRule.values()) {
          const at = keyOf([path, String(instance.start), String(rule.start)]);
          for (const resolved of Option.toArray(
            resolutionOf(head.document, written.names, instance, rule),
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
