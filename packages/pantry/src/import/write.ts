/**
 * The rows one package is written as, and the one ChangeSet that writes them (plan W5, Q5.15; the
 * W5 amendment's A, C5, C13, C19 and C21; rows-first.md §1 and §2).
 *
 * A package is written once, as one ChangeSet step over the author role that inserts every owner
 * with its whole family: no relation is `mutable`, so no apply needs a read flight, and nothing is
 * ever put or deleted. Every input is a keyed set, a `ReadonlyMap` from the text of a row's key to
 * the row as its writer writes it (`Addition<R>`), and only sequences nest:
 *
 * - Each document is one `Node` root ({@link rootInsertOf}), its tree nested at `children` in
 *   document order, each element's attributes at `attributes` and namespace declarations at
 *   `namespaces`, each attribute's open name, IDREF tokens and entity references under it;
 * - The package is one `Package` row, its record nested at `entries` in listing order;
 * - Every other relation is flat: the document layer's rows ({@link documentRowsOf}) and each overlay
 *   builder's (`#pantry/import/overlays/index.ts`).
 *
 * No row carries a field grizzle draws or fills, or PostgreSQL generates: each is `Addition<R>`,
 * which omits them, nested at a sequence's count field only. The host writes the fields the
 * amendment's §C gives it, each proved by a law: a node's `state` from `contentStep` (C5, N5), its
 * `ancestry` (`E1_derived`), its nearest interaction (N8), its `chars`, `first`, `last` and
 * `stringPiece` (E1); an attribute's `slot` (AL2's step) and its IDREF pieces, which concatenate
 * to its lexical form.
 *
 * Ids are drawn by the number `flatten` (`#pantry/model/xdm.ts`) gives each node and attribute, so
 * the tree and every overlay builder name each node by one id ({@link NodeIds}).
 */
import { Bits, ChangeSet } from "@bjornpagen/grizzle";
import type { Addition, Uuid } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Order } from "effect";
import { contentStep } from "#pantry/grammar/content.ts";
import {
  attributeRows,
  AttributeSlot,
  Enters,
  Flag,
  GoverningOf,
  grammar,
  interactionKinds,
  KindNamespace,
  openElementClasses,
  Position,
  TextDomain,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import { contextAt, contextsOf, ownContext } from "#pantry/import/context.ts";
import type { DocumentContext, ListedTarget } from "#pantry/import/context.ts";
import type { PackageRecord } from "#pantry/import/record.ts";
import type { OverlayRows } from "#pantry/import/overlays/index.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { endsOf } from "#pantry/model/folds.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type {
  AttributeRow,
  FlatRows,
  NodeId,
  NodeRow,
  OpenNameRow,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import type {
  Attribute,
  AttributeEntity,
  Idref,
  OpenAttributeName,
} from "#pantry/qti/attributes.ts";
import { Comment, Doctype, Document, OpenElementName, Pi } from "#pantry/qti/chardata.ts";
import type { Namespace } from "#pantry/qti/chardata.ts";
import {
  Declaration,
  OutcomeRange,
  RecordField,
  Value,
  ValueSet,
} from "#pantry/qti/declarations.ts";
import { CellHeaders, TableHeader, TableScope } from "#pantry/qti/html.ts";
import {
  AssembledId,
  AssembledLang,
  DocumentGenerals,
  DocumentId,
  DocumentLang,
  FragmentValue,
  GeneralLang,
  GeneralNamed,
  GeneralObject,
  IdBinding,
  IdentityText,
  IdrefTarget,
  LabelUse,
  LomLanguage,
  PlacedGeneralLang,
  PlacedId,
  PlacedIdref,
  PlacedXmlLang,
  ResourceLomLanguageSet,
  SsmlAttribute,
  SsmlScope,
  XmlLang,
} from "#pantry/qti/identity.ts";
import {
  AreaMapping,
  InterpolationTable,
  LookupValue,
  MapKey,
  MapKeyDirectedPair,
  MapKeyFloat,
  MapKeyInteger,
  MapKeyPair,
  MapKeyPoint,
  Mapping,
  MatchTable,
} from "#pantry/qti/mapping.ts";
import { copiedTextKinds, copiedUnder, Node, universalDomains } from "#pantry/qti/node.ts";
import { Rounding, Tolerance } from "#pantry/qti/operators.ts";
import {
  Dependency,
  File,
  FileHref,
  ManifestId,
  NamedHref,
  Package,
  Reference,
  ReferencePath,
  Resource,
  ResourceFile,
  ResourceHref,
} from "#pantry/qti/package.ts";
import { Quotation } from "#pantry/qti/quotation.ts";
import {
  AriaElement,
  AriaRange,
  AriaValue,
  Binding,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceVariableName,
  ContextRef,
  CountBound,
  FeedbackRef,
  Hotspot,
  Hottext,
  InteractionAttribute,
  ItemMode,
  PlacedBinding,
  PlacedChoice,
  PlacedHottext,
  PrintedVariableRef,
  ReferringDocument,
  SectionContextName,
  SectionContextRef,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionPrintedName,
  SectionPrintedRef,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  Slider,
  TemplateRef,
  VarRef,
} from "#pantry/qti/interactions.ts";
import {
  AssembledReference,
  DeclarationTable,
  Expression,
  ExpressionAttribute,
  ItemTiming,
  Literal,
  MappingLookup,
  MappingSource,
  NameLookup,
  Operand,
  PlacedDocument,
  PlacedReference,
  PlacedVariableRef,
  Processing,
  ProcessingTemplate,
  Reading,
  ReferenceDocument,
  SectionIdentifier,
  TemplateDefault,
  TestReference,
  VariableLookup,
  VariableRef,
} from "#pantry/qti/expressions.ts";
import {
  AssessmentObject,
  LomEntry,
  LomGeneral,
  LomObject,
  LomObjectIdentifier,
  LomObjectTitle,
  LomRecord,
  LomResource,
  LomResourceType,
  LomResourceTypeSource,
  LomString,
  LomStringLanguage,
  LomTitle,
  LomTitleString,
  ObjectLang,
  ResourceLomGeneral,
  StatisticDate,
  UsageValue,
} from "#pantry/qti/metadata.ts";
import type { Author } from "#pantry/qti/roles.ts";
import {
  AssembledName,
  BranchResolution,
  BranchRule,
  Inclusion,
  Instance,
  InstanceName,
  ItemRefDocument,
  ItemRefTarget,
  Named,
  Section,
  SectionMember,
  SectionOrdering,
  SectionSelection,
  Site,
  SiteTarget,
  StimulusRef,
  TestDocument,
  TestFlag,
  TestToken,
  VariableMapping,
} from "#pantry/qti/tests.ts";

/**
 * The ids one document's rows are written under, and where it stands in its package: every overlay
 * builder's `ids` argument (§C), each reading the part it needs.
 */
export interface NodeIds {
  /**
   * Whether the document is in an assembly (`Document.assembled`): a test or a section, or a
   * document that holds a site or that a site names (`#pantry/import/context.ts`).
   */
  readonly assembled: boolean;
  /**
   * The context the document is judged in (spec reading 117, `#pantry/import/context.ts`): its own,
   * or, for a document sites name, the union of their ancestries and the interaction they stand in.
   */
  readonly context: DocumentContext;
  /**
   * The documents of the package by their paths, which a site's href names (Q5.13's builder).
   *
   * @param path - A document's path in the package.
   * @returns The id of the document node there, none when the package holds no document at the
   *   path.
   */
  readonly documentAt: (path: string) => Option.Option<NodeId>;
  /**
   * The id of the node or attribute numbered `index` by `flatten`: the nodes in document order from
   * the document node's 0, then the attributes, so every caller that flattens the document under
   * it names each node by one id. The same index always gives the same id.
   *
   * @param index - The number `flatten` gives the node or attribute.
   * @returns Its id, a fresh uuid the first time the index is asked for.
   */
  readonly idOf: (index: number) => NodeId;
  /**
   * The package's id.
   */
  readonly package: Uuid;
  /**
   * The document's path in the package, its entry's.
   */
  readonly path: string;
  /**
   * The document a site's href names, with its root's kind and its context, as the site's row
   * copies them.
   *
   * @param path - A document's path in the package.
   * @returns The document there, none when the package lists none at the path.
   */
  readonly targetAt: (path: string) => Option.Option<ListedTarget>;
  /**
   * Whether a site of the package names the document, so it is an instance of every assembly
   * that places it (Q5.13's `Instance`, spec reading 117).
   */
  readonly targeted: boolean;
}

/**
 * A document as the importer lists it: its path, its tree as shred gives it, and the type of the
 * resource that names it, `none` for the manifest, which no resource names.
 */
export interface ListedDocument {
  readonly path: string;
  readonly resourceType: Addition<typeof Document>["resourceType"];
  readonly tree: XdmDocument<Composed>;
}

/**
 * The ids of one package: its own, and each listed document's, in the listing's order.
 */
export interface PackageIds {
  readonly documents: readonly NodeIds[];
  readonly package: Uuid;
}

/**
 * Mint the ids of one package: one fresh uuid for the package, and one for each XDM node and each
 * attribute of every document, drawn the first time its number is asked for and the same ever
 * after, as an import mints them each time it runs. So the same package imported twice is two
 * packages, every id fresh.
 *
 * A document's `documentAt` reads every listed document's document node; where two documents share
 * a path (one path named under two resource types, which the database refuses), it gives the
 * first.
 *
 * @param documents - The package's documents, in the listing's order.
 * @param mint - Draws a fresh uuid. Defaults to `crypto.randomUUID`.
 * @returns The package's id and each document's ids, in the order given.
 */
export const nodeIdsOf = (
  documents: readonly ListedDocument[],
  mint: () => NodeId = () => crypto.randomUUID(),
): PackageIds => {
  const packageId = mint();
  const idOfs = documents.map(() => {
    const drawn = new Map<number, NodeId>();

    return (index: number): NodeId => {
      const held = drawn.get(index);
      if (held !== undefined) {
        return held;
      }

      const id = mint();
      drawn.set(index, id);

      return id;
    };
  });
  const placed = new Map<string, NodeId>();
  for (const [at, { path }] of documents.entries()) {
    const idOf = idOfs[at];
    if (idOf !== undefined && !placed.has(path)) {
      placed.set(path, idOf(0));
    }
  }

  const documentAt = (path: string): Option.Option<NodeId> =>
    Option.fromNullishOr(placed.get(path));
  const { assembled, contexts, targeted } = contextsOf(
    documents.flatMap(({ path, tree }, at) => {
      const idOf = idOfs[at];

      return idOf === undefined ? [] : [{ idOf, path, tree }];
    }),
  );
  const rootKinds = new Map<string, ListedDocument["tree"]["root"]["kind"]>(
    documents.map(({ path, tree }) => [path, tree.root.kind] as const).toReversed(),
  );
  const targetAt = (path: string): Option.Option<ListedTarget> =>
    Option.flatMap(documentAt(path), (node) =>
      Option.map(Option.fromNullishOr(rootKinds.get(path)), (rootKind) => ({
        context: contextAt(contexts, node),
        node,
        rootKind,
      })),
    );

  return {
    documents: documents.flatMap(({ path }, at) => {
      const idOf = idOfs[at];

      return idOf === undefined
        ? []
        : [
            {
              assembled: assembled.has(idOf(0)),
              context: contextAt(contexts, idOf(0)),
              documentAt,
              idOf,
              package: packageId,
              path,
              targetAt,
              targeted: targeted.has(idOf(0)),
            },
          ];
    }),
    package: packageId,
  };
};

/**
 * An entity reference inside an attribute's lexical form, as its attribute's family nests it:
 * without the `node` and `attribute` the nesting supplies, nor the `at` the family draws.
 */
export type EntityInsert = Omit<Addition<typeof AttributeEntity>, "attribute" | "node">;

/**
 * One IDREF token with the whitespace written around it, as its attribute's family nests it.
 */
export type IdrefInsert = Omit<Addition<typeof Idref>, "attribute" | "node">;

/**
 * An open-class attribute's exact name, as its attribute's family nests it.
 */
export type OpenNameInsert = Omit<Addition<typeof OpenAttributeName>, "attribute" | "node">;

/**
 * An attribute as its element's family nests it: its written fields but the `node` the nesting
 * supplies, and its three families at their count fields.
 */
export type AttributeInsert = Omit<Addition<typeof Attribute>, "node"> & {
  readonly entities: readonly EntityInsert[];
  readonly idrefs: readonly IdrefInsert[];
  readonly openName: readonly OpenNameInsert[];
};

/**
 * A namespace declaration as its element's family nests it.
 */
export type NamespaceInsert = Omit<Addition<typeof Namespace>, "node">;

/**
 * The fields the host writes on every node, as a member of its parent's family nests it: every
 * written field but the tree's `parent`, which the nesting supplies, and the root field `document`,
 * which only the root names (C13).
 */
export type NodeFields = Omit<Addition<typeof Node>, "document" | "parent">;

/**
 * A node below the document node as its parent's family nests it, with its own families nested.
 */
export type NodeMember = NodeFields & {
  readonly attributes: readonly AttributeInsert[];
  readonly children: readonly NodeMember[];
  readonly namespaces: readonly NamespaceInsert[];
};

/**
 * A document's tree as the one `Node` insert writes it: the document node, which names the root
 * field `document` as its own id, with every node below it nested.
 */
export type NodeRoot = NodeMember & { readonly document: Addition<typeof Node>["document"] };

/**
 * The document layer's flat rows of one or more documents, each a keyed set by its node's id: the
 * `Document` row of each document node, each comment's, instruction's and doctype's row, and each
 * foreign element's expanded name. A text, whitespace or entity reference node keeps its
 * characters on its `Node` row (`chars`).
 */
export interface DocumentLayerRows {
  readonly Comment: ReadonlyMap<string, Addition<typeof Comment>>;
  readonly Doctype: ReadonlyMap<string, Addition<typeof Doctype>>;
  readonly Document: ReadonlyMap<string, Addition<typeof Document>>;
  readonly OpenElementName: ReadonlyMap<string, Addition<typeof OpenElementName>>;
  readonly Pi: ReadonlyMap<string, Addition<typeof Pi>>;
}

/**
 * Every input of one package's ChangeSet, each a keyed set: the `Package` row with its record
 * nested, each document's `Node` root with its tree nested, both keyed by their id, the document
 * layer's flat rows, and every overlay's.
 */
export type PackageInputs = DocumentLayerRows &
  OverlayRows & {
    readonly Node: ReadonlyMap<string, NodeRoot>;
    readonly Package: ReadonlyMap<string, PackageRecord>;
  };

/**
 * A `NodeKind` handle.
 */
type KindHandle = Addition<typeof Node>["kind"];

/**
 * A `Position` handle, a node's content-automaton state.
 */
type PositionHandle = Addition<typeof Node>["state"];

/**
 * A key of the installed closed relations' row maps: its fields' values, space separated.
 *
 * @param values - The key's values, in the relation's key order.
 * @returns The text.
 */
const keyOf = (...values: readonly string[]): string => values.join(" ");

/**
 * The installed `GoverningOf`, by `version kind governs`.
 */
const governorAt: ReadonlyMap<string, string> = new Map(
  GoverningOf.rows.map(({ governor, governs, kind, version }) => [
    keyOf(version, kind, governs),
    governor,
  ]),
);

/**
 * The installed `TextDomain`, by `version governor`.
 */
const textDomainAt: ReadonlyMap<string, string> = new Map(
  TextDomain.rows.map(({ domain, governor, version }) => [keyOf(version, governor), domain]),
);

/**
 * The attribute grammar `AttributeGrammar` and `AttributeSlotOf` install, by `version governor
 * name`.
 */
const attributeGrammarAt = new Map(
  attributeRows.map((row) => [keyOf(row.version, row.governor, row.name), row] as const),
);

/**
 * The installed `ValueIdentity`, by domain.
 */
const identityAt: ReadonlyMap<string, string> = new Map(
  ValueIdentity.rows.map(({ domain, identity }) => [domain, identity]),
);

/**
 * The installed `KindNamespace`, by kind: the namespace name an element of the kind is written in.
 */
const namespaceAt: ReadonlyMap<string, string> = new Map(
  KindNamespace.rows.map(({ kind, namespace }) => [kind, namespace]),
);

/**
 * The flags each kind enters for its descendants, the installed `Enters`.
 */
const entersAt: ReadonlyMap<string, readonly (typeof Flag.handles)[number][]> = new Map(
  [...Map.groupBy(Enters.rows, ({ kind }) => kind)].map(
    ([kind, rows]) => [kind, rows.map(({ flag }) => flag)] as const,
  ),
);

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The foreign element kinds, whose namespace their `OpenElementName` row holds.
 */
const foreignKinds: ReadonlySet<string> = new Set(openElementClasses);

/**
 * The open attribute classes, each of whose attributes has its exact name nested under it (AL4).
 */
const openNames: ReadonlySet<string> = new Set(openClasses);

/**
 * The domains whose text TextDomain never judges (`universalDomains` of `#pantry/qti/node.ts`).
 */
const universal: ReadonlySet<string> = new Set(universalDomains);

/**
 * The kinds whose text an overlay copies though no domain judges it (`copiedTextKinds`).
 */
const copied: ReadonlySet<string> = new Set(copiedTextKinds);

/**
 * The `Position` handles, by their code's number.
 */
const positionOf: ReadonlyMap<number, PositionHandle> = new Map(
  Position.handles.map((handle) => [Number(handle), handle]),
);

/**
 * Name a state's `Position` handle.
 *
 * @param state - The state, a position of the grammar's automata.
 * @returns Its handle.
 * @throws {Error} When the `Position` roster holds no such code, a defect of the grammar, whose
 *   automata name only its positions.
 */
const positionHandle = (state: number): PositionHandle => {
  const handle = positionOf.get(state);
  if (handle === undefined) {
    throw new Error(
      `The content grammar steps to state ${String(state)}, which the Position roster does not hold. Regenerate the grammar's positions.`,
    );
  }

  return handle;
};

/**
 * Read a child's position in its parent's content model, `Admission`'s cell (`ChildGrammar`).
 *
 * @param key - The version, the parent's kind and the child's.
 * @param key.child - The child's kind.
 * @param key.parent - The parent's kind.
 * @param key.version - The version.
 * @returns The position, 0 for character data and for a kind several positions name; none where
 *   the parent does not admit the kind.
 */
const admittedAt = (key: {
  readonly child: string;
  readonly parent: string;
  readonly version: Composed["version"];
}): Option.Option<number> =>
  Option.map(grammar.admission.lookup(key), ({ position }) => Number(position));

/**
 * Compute a member's content-automaton state (C5), the value N5 holds it to.
 *
 * `contentStep` gives the lawful state where there is one. Where there is none, the state is still
 * written, and a law refuses the node by name: an unadmitted kind keeps its predecessor's state,
 * which `N5_admitted` refuses; a kind whose position does not follow keeps its position, and a
 * shared kind none of whose positions follows its first, each refused by `N5_Follow`.
 *
 * @param key - The version, the parent's kind and the member's.
 * @param key.child - The member's kind.
 * @param key.parent - The parent's kind.
 * @param key.version - The version.
 * @param was - Its predecessor's state, 0 for the first member.
 * @returns The state.
 */
const stateOf = (
  key: {
    readonly child: string;
    readonly parent: string;
    readonly version: Composed["version"];
  },
  was: number,
): number =>
  Option.match(admittedAt(key), {
    onNone: () => was,
    onSome: (position) =>
      Option.getOrElse(contentStep(grammar.content, admittedAt, key, was), () =>
        position === 0
          ? (grammar.content.sharedPositions({
              kind: key.child,
              parent: key.parent,
              version: key.version,
            })[0] ?? was)
          : position,
      ),
  });

/**
 * Decide whether an element's text is one TextDomain judges: its domain under its governor is
 * none of the universal domains (`checkedText` of `#pantry/qti/node.ts`, on the host).
 *
 * @param version - The element's version.
 * @param kind - Its kind.
 * @param governs - Its governing type.
 * @returns Whether its text is checked; false where `GoverningOf` or `TextDomain` holds no row,
 *   which PostgreSQL reads as NULL and so passes.
 */
const checksText = (version: string, kind: string, governs: string): boolean => {
  const governor = governorAt.get(keyOf(version, kind, governs));
  const domain = governor === undefined ? undefined : textDomainAt.get(keyOf(version, governor));

  return domain !== undefined && !universal.has(domain);
};

/**
 * The whitespace an IDREFS value separates its tokens by, XML's `S`.
 */
const idrefSpace = /[\t\n\r ]+/gu;

/**
 * XML whitespace, possibly none, as an `Idref` piece holds it around its token.
 */
type SpaceText = IdrefInsert["before"];

/**
 * Hold a run the split cut at whitespace to the type of the whitespace around a token.
 *
 * @param text - A run of {@link idrefSpace}'s matches, or the empty text.
 * @returns The run.
 * @throws {Error} When the run holds anything but whitespace, which the split never cuts.
 */
const spaceOf = (text: string): SpaceText => {
  if (/^[\t\n\r ]*$/u.test(text)) {
    // SAFETY: the test above is the language of `Space`'s pattern, `^[\t\n\r ]*$`, which is the type `SpaceText` spells.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    return text as SpaceText;
  }

  throw new Error(
    `The IDREF split cut ${JSON.stringify(text)} as whitespace, and it holds more. Correct idrefPiecesOf.`,
  );
};

/**
 * Split an IDREF or IDREFS lexical form into its tokens, each with the whitespace written before
 * it, and the last with the whitespace after it, so the pieces concatenate to the form and every
 * token but the first follows whitespace (`E1_derived` on `Idref`).
 *
 * @param lexical - The attribute's lexical form.
 * @returns Its pieces, in order; none for a form with no token, which the attribute's laws refuse.
 */
export const idrefPiecesOf = (lexical: string): readonly IdrefInsert[] => {
  const tokens: { readonly before: string; readonly token: string }[] = [];
  let before = "";
  let last = 0;
  for (const space of lexical.matchAll(idrefSpace)) {
    const token = lexical.slice(last, space.index);
    if (token.length > 0) {
      tokens.push({ before, token });
      before = "";
    }

    before += space[0];
    last = space.index + space[0].length;
  }

  const tail = lexical.slice(last);
  if (tail.length > 0) {
    tokens.push({ before, token: tail });
    before = "";
  }

  return tokens.map(({ before: lead, token }, at) => {
    const after = at === tokens.length - 1 ? before : "";

    return {
      after: spaceOf(after),
      before: spaceOf(lead),
      piece: `${lead}${token}${after}`,
      token,
    };
  });
};

/**
 * What the walk keeps of a node it has written, for its children's copies.
 */
interface Written {
  readonly ancestry: ReadonlySet<(typeof Flag.handles)[number]>;
  readonly governs: string;
  readonly id: NodeId;
  readonly kind: string;
  readonly members: NodeMember[];
  readonly namespace: string;
  readonly nearest: NodeId;
  readonly nearestKind: KindHandle;
  /**
   * Its parent's kind, `document` for the document node, which its members read as their
   * grandparent's (`copiedUnder`).
   */
  readonly parentKind: string;
  /**
   * The state of the member written last, 0 before the first.
   */
  was: number;
}

/**
 * Index one list of rows by the node or attribute it belongs to, keeping the list's order within
 * each group.
 *
 * @param rows - The rows.
 * @param owner - Each row's owner.
 * @returns The groups.
 */
const groupedBy = <R>(rows: readonly R[], owner: (row: R) => string): ReadonlyMap<string, R[]> =>
  Map.groupBy(rows, owner);

/**
 * Write one attribute as its element's family nests it.
 *
 * @param attribute - The attribute's row.
 * @param element - Its element: its version, kind, governing type and namespace name.
 * @param element.governs - The element's governing type.
 * @param element.kind - Its kind.
 * @param element.namespace - Its namespace name.
 * @param element.version - Its version.
 * @param rows - The document's rows, indexed by attribute.
 * @param rows.entities - Each attribute's entity references, in offset order.
 * @param rows.openNames - Each open-class attribute's exact name.
 * @returns The attribute: its slot under its element's governor (empty for a name the governor
 *   does not admit, which AL1 refuses), its IDREF pieces where its domain is an `xs:IDREF` or
 *   `xs:IDREFS`, its entity references and its open name.
 */
const attributeOf = (
  attribute: AttributeRow<Composed>,
  element: {
    readonly governs: string;
    readonly kind: string;
    readonly namespace: string;
    readonly version: string;
  },
  rows: {
    readonly entities: ReadonlyMap<
      string,
      readonly FlatRows<Composed>["attributeEntities"][number][]
    >;
    readonly openNames: ReadonlyMap<string, readonly OpenNameRow[]>;
  },
): AttributeInsert => {
  const governor = governorAt.get(keyOf(element.version, element.kind, element.governs));
  const admitted =
    governor === undefined
      ? undefined
      : attributeGrammarAt.get(keyOf(element.version, governor, attribute.name));
  const identity = admitted === undefined ? undefined : identityAt.get(admitted.domain);

  return {
    entities: (rows.entities.get(attribute.id) ?? []).map(({ name, offset }) => ({ name, offset })),
    id: attribute.id,
    idrefs: identity === "IDREF" || identity === "IDREFS" ? idrefPiecesOf(attribute.lexical) : [],
    lexical: attribute.lexical,
    name: attribute.name,
    openName: openNames.has(attribute.name)
      ? (rows.openNames.get(attribute.id) ?? []).map(({ local, uri }) => ({
          elementNamespace: element.namespace,
          local,
          uri,
        }))
      : [],
    prefix: attribute.prefix,
    slot: Bits.of(AttributeSlot, admitted === undefined ? [] : [admitted.position]),
  };
};

/**
 * One member as the walk writes it: the nested row, its state, which its next sibling's `was`
 * reads, and what its own children copy from it.
 */
interface WrittenMember {
  readonly node: NodeMember;
  readonly state: number;
  readonly written: Written;
}

/**
 * Write one node below the document node, and what its children copy from it.
 *
 * @param node - Its row, as `flatten` writes it.
 * @param parent - What the walk kept of its parent.
 * @param own - Its own rows: its attributes and declarations, its characters, its namespace name
 *   and the document's version, with the attribute families' rows indexed.
 * @param own.attributes - Its attributes, in slot order.
 * @param own.chars - Its characters, empty for a node that holds none.
 * @param own.indexed - The document's open names and entity references, by attribute.
 * @param own.indexed.entities - The entity references.
 * @param own.indexed.openNames - The open names.
 * @param own.namespace - Its namespace name, empty for a node that is no element.
 * @param own.namespaces - Its namespace declarations, in slot order.
 * @param own.version - The document's version.
 * @returns The nested member, its state, and what the walk keeps of it.
 */
const memberOf = (
  node: NodeRow<Composed>,
  parent: Written,
  own: {
    readonly attributes: readonly AttributeRow<Composed>[];
    readonly chars: string;
    readonly indexed: Parameters<typeof attributeOf>[2];
    readonly namespace: string;
    readonly namespaces: readonly FlatRows<Composed>["namespaces"][number][];
    readonly version: Composed["version"];
  },
): WrittenMember => {
  const { kind, version } = node;
  const state = stateOf({ child: kind, parent: parent.kind, version }, parent.was);
  const ancestry = new Set([...parent.ancestry, ...(entersAt.get(kind) ?? [])]);
  const fromInteraction = interactions.has(parent.kind);
  // SAFETY: `parent.kind` is the kind the walk wrote on the parent's own row, a `NodeKind` handle.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  const parentKind = parent.kind as KindHandle;
  const nearest = fromInteraction ? parent.id : parent.nearest;
  const nearestKind = fromInteraction ? parentKind : parent.nearestKind;
  const inStringValue =
    checksText(version, parent.kind, parent.governs) ||
    copied.has(parent.kind) ||
    copiedUnder(parent.kind, parent.parentKind);
  const ends = endsOf(own.chars);
  const children: NodeMember[] = [];
  const member: NodeMember = {
    ancestry: Bits.of(Flag, [...ancestry]),
    attributes: own.attributes.map((attribute) =>
      attributeOf(
        attribute,
        { governs: node.governs, kind, namespace: own.namespace, version },
        own.indexed,
      ),
    ),
    chars: own.chars,
    children,
    first: ends.first,
    governs: node.governs,
    id: node.id,
    kind,
    last: ends.last,
    namespaces: own.namespaces.map(({ prefix, uri }) => ({ prefix, uri })),
    nearest,
    nearestKind,
    prefix: node.prefix,
    state: positionHandle(state),
    stringPiece: inStringValue ? own.chars : "",
    version,
  };

  return {
    node: member,
    state,
    written: {
      ancestry,
      governs: node.governs,
      id: node.id,
      kind,
      members: children,
      namespace: own.namespace,
      nearest,
      nearestKind,
      parentKind: parent.kind,
      was: 0,
    },
  };
};

/**
 * Write a document's tree as the one `Node` insert writes it (C13): the document node with every
 * node below it nested at `children` in document order, each with its attributes (their open
 * names, IDREF pieces and entity references nested) and its namespace declarations.
 *
 * No row names `parent`, only the root names `document`, and no row carries a drawn, accumulated
 * or generated field. The host's fields are the ones the laws prove:
 *
 * - `state` by `contentStep` (C5), the document node's 0;
 * - `ancestry`, its parent's with the flags its kind enters (`E1_derived`);
 * - `nearest` and `nearestKind`, its parent where the parent is an interaction, else its parent's
 *   (N8), the document node's its document's context's (spec reading 117), itself where no site
 *   names the document from inside an interaction;
 * - The document node's `ancestry`, its context's, empty where no site names the document;
 * - `chars`, a text or whitespace node's characters and an entity reference's `&name;`, empty
 *   elsewhere, `first` and `last`, the first and last code points of `chars` (`endsOf`), and
 *   `stringPiece`, its `chars` where its parent's text is checked or copied (`inStringValue` of
 *   `#pantry/qti/node.ts`), empty elsewhere;
 * - `governs` and `prefix`, an element's own, `none` and empty for any other node.
 *
 * The walk keeps its own stack, so a tree of any depth is written without recursion.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns The document node, with its tree nested.
 */
export const rootInsertOf = (
  doc: XdmDocument<Composed>,
  ids: Pick<NodeIds, "idOf"> & Partial<Pick<NodeIds, "context">>,
): NodeRoot => {
  const rows = flatten(doc, ids.idOf);
  const { version } = doc;
  const chars = new Map<string, string>([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);
  const attributes = groupedBy(rows.attributes, ({ node }) => node);
  const namespaces = groupedBy(rows.namespaces, ({ node }) => node);
  const indexed = {
    entities: groupedBy(rows.attributeEntities, ({ attribute }) => attribute),
    openNames: groupedBy(rows.openNames, ({ attribute }) => attribute),
  };
  const foreignNamespace = new Map(
    rows.openElementNames.map(({ namespace, node }) => [node, namespace] as const),
  );
  const self = rows.document.node;
  const context = ids.context ?? ownContext(self);
  const written = new Map<NodeId, Written>();
  const root: NodeRoot = {
    ancestry: Bits.of(Flag, [...context.ancestry]),
    attributes: [],
    chars: "",
    children: [],
    document: self,
    first: "",
    governs: "none",
    id: self,
    kind: "document",
    last: "",
    namespaces: [],
    nearest: context.nearest,
    nearestKind: context.nearestKind,
    prefix: "",
    state: "0",
    stringPiece: "",
    version,
  };
  written.set(self, {
    ancestry: context.ancestry,
    governs: "none",
    id: self,
    kind: "document",
    // SAFETY: `root.children` is the array this map's entry fills, built here as a fresh empty array; its readonly type is the nested write's, and only this walk appends to it.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    members: root.children as NodeMember[],
    namespace: "",
    nearest: context.nearest,
    nearestKind: context.nearestKind,
    parentKind: "document",
    was: 0,
  });

  for (const node of rows.nodes.slice(1)) {
    const parent = written.get(node.parent);
    if (parent === undefined) {
      throw new Error(
        `flatten wrote node ${node.id} before its parent ${node.parent}, and it writes nodes in document order. Correct flatten.`,
      );
    }

    const member = memberOf(node, parent, {
      attributes: attributes.get(node.id) ?? [],
      chars: chars.get(node.id) ?? "",
      indexed,
      namespace: foreignKinds.has(node.kind)
        ? (foreignNamespace.get(node.id) ?? "")
        : (namespaceAt.get(node.kind) ?? ""),
      namespaces: namespaces.get(node.id) ?? [],
      version,
    });
    parent.members.push(member.node);
    parent.was = member.state;
    written.set(node.id, member.written);
  }

  return root;
};

/**
 * Write a document's flat rows of the document layer: its `Document` row, each comment's,
 * instruction's and doctype's row, and each foreign element's `OpenElementName` row with its
 * node's tuple (C18) and its parent's kind and namespace name.
 *
 * @param document - The document as the importer lists it.
 * @param ids - The ids its rows are written under.
 * @returns Its rows, each keyed by its node's id.
 */
export const documentRowsOf = (
  document: ListedDocument,
  ids: Pick<NodeIds, "idOf" | "package"> & Partial<Pick<NodeIds, "assembled" | "context">>,
): DocumentLayerRows => {
  const rows = flatten(document.tree, ids.idOf);
  const self = rows.document.node;
  const context = ids.context ?? ownContext(self);
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const foreignNamespace = new Map(
    rows.openElementNames.map(({ namespace, node }) => [node, namespace] as const),
  );
  const nearest = new Map<NodeId, NodeId>([[self, context.nearest]]);
  for (const node of rows.nodes.slice(1)) {
    const parentKind = byId.get(node.parent)?.kind ?? "document";
    nearest.set(
      node.id,
      interactions.has(parentKind) ? node.parent : (nearest.get(node.parent) ?? node.parent),
    );
  }

  return {
    Comment: new Map(rows.comments.map(({ node, value }) => [node, { node, value }] as const)),
    Doctype: new Map(rows.doctypes.map(({ node, value }) => [node, { node, value }] as const)),
    Document: new Map([
      [
        self,
        {
          ...rows.document,
          assembled: ids.assembled ?? false,
          contextNearest: context.nearest,
          contextNearestKind: context.nearestKind,
          nodeChildren: BigInt(
            rows.nodes.filter((node) => node.parent === self && node.id !== self).length,
          ),
          nodeDocument: self,
          nodeGoverns: "none",
          nodeKind: "document",
          nodeParentKind: "document",
          nodeStart: 0n,
          package: ids.package,
          path: document.path,
          resourceType: document.resourceType,
          rootKind: document.tree.root.kind,
          version: document.tree.version,
        },
      ],
    ]),
    OpenElementName: new Map(
      rows.openElementNames.flatMap(({ local, namespace, node }) => {
        const row = byId.get(node);
        const parent = row === undefined ? undefined : byId.get(row.parent);
        if (row === undefined || parent === undefined) {
          return [];
        }

        return [
          [
            node,
            {
              document: self,
              governs: row.governs,
              kind: row.kind,
              local,
              namespace,
              nearest: nearest.get(node) ?? self,
              node,
              parent: parent.id,
              parentKind: parent.kind,
              parentNamespace: foreignKinds.has(parent.kind)
                ? (foreignNamespace.get(parent.id) ?? "")
                : (namespaceAt.get(parent.kind) ?? ""),
              start: row.start,
              version: row.version,
            },
          ] as const,
        ];
      }),
    ),
    Pi: new Map(rows.pis.map(({ data, node, target }) => [node, { data, node, target }] as const)),
  };
};

/**
 * The fields each flat relation's CHECK reads a per-row pattern by, the pattern's inputs: the
 * relations whose rows are sorted by them before the write, so that rows of one pattern are one run
 * of their statement and PostgreSQL's backend, which caches 32 compiled regexes, compiles each
 * pattern once per run (the tier-1 addendum's import order: 1.4 to 4.9 µs a grouped row against
 * about 80 µs in arbitrary order).
 *
 * A nested family's rows are written in the nesting's order, each owner's members in slot order
 * (grizzle's `write/family/nesting.ts`), so the `Attribute` statement, whose `value_domain` reads
 * a pattern per domain, and `Node`'s TextDomain keep document order: no caller can sort them.
 *
 * `Value`'s `Typed_value` reads the pattern of its base type's domain (Q5.08), `Literal_lexical`
 * its type code's and `ExpressionAttribute`'s `E1_derived` its attribute's and base type's
 * (Q5.10), and `UsageValue`'s `Usage_typed_value` its base type's (spec reading 105). A relation
 * joins this table when a check over it reads a pattern by a field.
 */
export const patternInputs = {
  ExpressionAttribute: ["attribute", "baseType"],
  Literal: ["typeCode"],
  UsageValue: ["baseType"],
  Value: ["baseType"],
} as const satisfies Partial<Readonly<Record<keyof PackageInputs, readonly string[]>>>;

/**
 * Order rows by the values of their pattern inputs, stably: rows with equal inputs form one run,
 * and keep their own order within it.
 *
 * @param rows - The rows, in the order their keyed set holds them.
 * @param fields - The fields the pattern is read by, most significant first.
 * @returns The rows, sorted.
 */
export const domainOrdered = <const F extends string, R extends Readonly<Record<F, string>>>(
  rows: Iterable<R>,
  fields: readonly F[],
): readonly R[] =>
  Arr.sort(
    [...rows],
    Order.mapInput(Order.Array(Order.String), (row: R) => fields.map((field) => row[field])),
  );

/**
 * Build one package's ChangeSet: one step over the author role, each relation inserted once, every
 * owner in the same stratum as its whole family (the W5 amendment's A, C19).
 *
 * The `Node` insert carries each document's tree, its attributes and namespace declarations, and
 * their families nested; the `Package` insert its record. Every other input is its keyed set's
 * rows, flat, those of {@link patternInputs} sorted by their pattern's inputs.
 *
 * The caller passes the role, the one its database was opened on: describing `Author` costs about
 * 2 s and 271 MB when `#pantry/qti/roles.ts` loads (measured 2026-11-06 at load average 27), and
 * a caller that only builds rows, such as the dry run, never needs it.
 *
 * @param author - The author role, `Author` of `#pantry/qti/roles.ts`.
 * @param inputs - The package's inputs.
 * @returns The ChangeSet, compiled by `db.apply` for the one call that applies it.
 */
export const changeSetOf = (author: typeof Author, inputs: PackageInputs) =>
  ChangeSet.empty(author)
    .insert(Package, [...inputs.Package.values()])
    .insert(Node, [...inputs.Node.values()])
    .insert(IdrefTarget, [...inputs.IdrefTarget.values()])
    .insert(Inclusion, [...inputs.Inclusion.values()])
    .insert(Instance, [...inputs.Instance.values()])
    .insert(Comment, [...inputs.Comment.values()])
    .insert(Doctype, [...inputs.Doctype.values()])
    .insert(Document, [...inputs.Document.values()])
    .insert(OpenElementName, [...inputs.OpenElementName.values()])
    .insert(Pi, [...inputs.Pi.values()])
    .insert(AreaMapping, [...inputs.AreaMapping.values()])
    .insert(AriaElement, [...inputs.AriaElement.values()])
    .insert(AriaRange, [...inputs.AriaRange.values()])
    .insert(AriaValue, [...inputs.AriaValue.values()])
    .insert(AssembledId, [...inputs.AssembledId.values()])
    .insert(AssembledLang, [...inputs.AssembledLang.values()])
    .insert(AssembledName, [...inputs.AssembledName.values()])
    .insert(AssessmentObject, [...inputs.AssessmentObject.values()])
    .insert(Binding, [...inputs.Binding.values()])
    .insert(BindingName, [...inputs.BindingName.values()])
    .insert(BoundVariable, [...inputs.BoundVariable.values()])
    .insert(BranchResolution, [...inputs.BranchResolution.values()])
    .insert(BranchRule, [...inputs.BranchRule.values()])
    .insert(CellHeaders, [...inputs.CellHeaders.values()])
    .insert(Choice, [...inputs.Choice.values()])
    .insert(ChoiceVariableName, [...inputs.ChoiceVariableName.values()])
    .insert(ContextRef, [...inputs.ContextRef.values()])
    .insert(CountBound, [...inputs.CountBound.values()])
    .insert(Declaration, [...inputs.Declaration.values()])
    .insert(Dependency, [...inputs.Dependency.values()])
    .insert(DocumentGenerals, [...inputs.DocumentGenerals.values()])
    .insert(DocumentId, [...inputs.DocumentId.values()])
    .insert(DocumentLang, [...inputs.DocumentLang.values()])
    .insert(Expression, [...inputs.Expression.values()])
    .insert(
      ExpressionAttribute,
      domainOrdered(inputs.ExpressionAttribute.values(), patternInputs.ExpressionAttribute),
    )
    .insert(FeedbackRef, [...inputs.FeedbackRef.values()])
    .insert(File, [...inputs.File.values()])
    .insert(FileHref, [...inputs.FileHref.values()])
    .insert(GeneralLang, [...inputs.GeneralLang.values()])
    .insert(GeneralNamed, [...inputs.GeneralNamed.values()])
    .insert(GeneralObject, [...inputs.GeneralObject.values()])
    .insert(Hotspot, [...inputs.Hotspot.values()])
    .insert(Hottext, [...inputs.Hottext.values()])
    .insert(IdBinding, [...inputs.IdBinding.values()])
    .insert(IdentityText, [...inputs.IdentityText.values()])
    .insert(InstanceName, [...inputs.InstanceName.values()])
    .insert(InteractionAttribute, [...inputs.InteractionAttribute.values()])
    .insert(InterpolationTable, [...inputs.InterpolationTable.values()])
    .insert(ItemMode, [...inputs.ItemMode.values()])
    .insert(ItemTiming, [...inputs.ItemTiming.values()])
    .insert(LabelUse, [...inputs.LabelUse.values()])
    .insert(Literal, domainOrdered(inputs.Literal.values(), patternInputs.Literal))
    .insert(LomEntry, [...inputs.LomEntry.values()])
    .insert(LomGeneral, [...inputs.LomGeneral.values()])
    .insert(LomLanguage, [...inputs.LomLanguage.values()])
    .insert(LomObject, [...inputs.LomObject.values()])
    .insert(LomObjectIdentifier, [...inputs.LomObjectIdentifier.values()])
    .insert(LomObjectTitle, [...inputs.LomObjectTitle.values()])
    .insert(LomRecord, [...inputs.LomRecord.values()])
    .insert(LomResource, [...inputs.LomResource.values()])
    .insert(LomResourceType, [...inputs.LomResourceType.values()])
    .insert(LomResourceTypeSource, [...inputs.LomResourceTypeSource.values()])
    .insert(LomString, [...inputs.LomString.values()])
    .insert(LomStringLanguage, [...inputs.LomStringLanguage.values()])
    .insert(LomTitle, [...inputs.LomTitle.values()])
    .insert(LomTitleString, [...inputs.LomTitleString.values()])
    .insert(LookupValue, [...inputs.LookupValue.values()])
    .insert(ManifestId, [...inputs.ManifestId.values()])
    .insert(MapKey, [...inputs.MapKey.values()])
    .insert(MapKeyDirectedPair, [...inputs.MapKeyDirectedPair.values()])
    .insert(MapKeyFloat, [...inputs.MapKeyFloat.values()])
    .insert(MapKeyInteger, [...inputs.MapKeyInteger.values()])
    .insert(MapKeyPair, [...inputs.MapKeyPair.values()])
    .insert(MapKeyPoint, [...inputs.MapKeyPoint.values()])
    .insert(Mapping, [...inputs.Mapping.values()])
    .insert(MatchTable, [...inputs.MatchTable.values()])
    .insert(Named, [...inputs.Named.values()])
    .insert(NamedHref, [...inputs.NamedHref.values()])
    .insert(ObjectLang, [...inputs.ObjectLang.values()])
    .insert(Operand, [...inputs.Operand.values()])
    .insert(OutcomeRange, [...inputs.OutcomeRange.values()])
    .insert(PrintedVariableRef, [...inputs.PrintedVariableRef.values()])
    .insert(Processing, [...inputs.Processing.values()])
    .insert(ProcessingTemplate, [...inputs.ProcessingTemplate.values()])
    .insert(Quotation, [...inputs.Quotation.values()])
    .insert(RecordField, [...inputs.RecordField.values()])
    .insert(Reference, [...inputs.Reference.values()])
    .insert(ReferencePath, [...inputs.ReferencePath.values()])
    .insert(ReferringDocument, [...inputs.ReferringDocument.values()])
    .insert(Resource, [...inputs.Resource.values()])
    .insert(ResourceFile, [...inputs.ResourceFile.values()])
    .insert(ResourceHref, [...inputs.ResourceHref.values()])
    .insert(ResourceLomGeneral, [...inputs.ResourceLomGeneral.values()])
    .insert(ResourceLomLanguageSet, [...inputs.ResourceLomLanguageSet.values()])
    .insert(Rounding, [...inputs.Rounding.values()])
    .insert(Section, [...inputs.Section.values()])
    .insert(SectionContextName, [...inputs.SectionContextName.values()])
    .insert(SectionContextRef, [...inputs.SectionContextRef.values()])
    .insert(SectionFeedbackName, [...inputs.SectionFeedbackName.values()])
    .insert(SectionFeedbackRef, [...inputs.SectionFeedbackRef.values()])
    .insert(SectionMember, [...inputs.SectionMember.values()])
    .insert(SectionOrdering, [...inputs.SectionOrdering.values()])
    .insert(SectionPrintedName, [...inputs.SectionPrintedName.values()])
    .insert(SectionPrintedRef, [...inputs.SectionPrintedRef.values()])
    .insert(SectionScope, [...inputs.SectionScope.values()])
    .insert(SectionSelection, [...inputs.SectionSelection.values()])
    .insert(SectionTemplateName, [...inputs.SectionTemplateName.values()])
    .insert(SectionTemplateRef, [...inputs.SectionTemplateRef.values()])
    .insert(Site, [...inputs.Site.values()])
    .insert(SiteTarget, [...inputs.SiteTarget.values()])
    .insert(Slider, [...inputs.Slider.values()])
    .insert(StatisticDate, [...inputs.StatisticDate.values()])
    .insert(StimulusRef, [...inputs.StimulusRef.values()])
    .insert(TableHeader, [...inputs.TableHeader.values()])
    .insert(TableScope, [...inputs.TableScope.values()])
    .insert(TemplateRef, [...inputs.TemplateRef.values()])
    .insert(TestDocument, [...inputs.TestDocument.values()])
    .insert(TestFlag, [...inputs.TestFlag.values()])
    .insert(TestToken, [...inputs.TestToken.values()])
    .insert(Tolerance, [...inputs.Tolerance.values()])
    .insert(UsageValue, domainOrdered(inputs.UsageValue.values(), patternInputs.UsageValue))
    .insert(Value, domainOrdered(inputs.Value.values(), patternInputs.Value))
    .insert(ValueSet, [...inputs.ValueSet.values()])
    .insert(VarRef, [...inputs.VarRef.values()])
    .insert(VariableMapping, [...inputs.VariableMapping.values()])
    .insert(VariableRef, [...inputs.VariableRef.values()])
    .insert(XmlLang, [...inputs.XmlLang.values()])
    .insert(FragmentValue, [...inputs.FragmentValue.values()])
    .insert(SsmlAttribute, [...inputs.SsmlAttribute.values()])
    .insert(SsmlScope, [...inputs.SsmlScope.values()])
    .insert(AssembledReference, [...inputs.AssembledReference.values()])
    .insert(DeclarationTable, [...inputs.DeclarationTable.values()])
    .insert(ItemRefDocument, [...inputs.ItemRefDocument.values()])
    .insert(ItemRefTarget, [...inputs.ItemRefTarget.values()])
    .insert(MappingLookup, [...inputs.MappingLookup.values()])
    .insert(MappingSource, [...inputs.MappingSource.values()])
    .insert(NameLookup, [...inputs.NameLookup.values()])
    .insert(PlacedBinding, [...inputs.PlacedBinding.values()])
    .insert(PlacedChoice, [...inputs.PlacedChoice.values()])
    .insert(PlacedDocument, [...inputs.PlacedDocument.values()])
    .insert(PlacedHottext, [...inputs.PlacedHottext.values()])
    .insert(PlacedId, [...inputs.PlacedId.values()])
    .insert(PlacedGeneralLang, [...inputs.PlacedGeneralLang.values()])
    .insert(PlacedIdref, [...inputs.PlacedIdref.values()])
    .insert(PlacedXmlLang, [...inputs.PlacedXmlLang.values()])
    .insert(PlacedReference, [...inputs.PlacedReference.values()])
    .insert(PlacedVariableRef, [...inputs.PlacedVariableRef.values()])
    .insert(Reading, [...inputs.Reading.values()])
    .insert(ReferenceDocument, [...inputs.ReferenceDocument.values()])
    .insert(SectionIdentifier, [...inputs.SectionIdentifier.values()])
    .insert(TemplateDefault, [...inputs.TemplateDefault.values()])
    .insert(TestReference, [...inputs.TestReference.values()])
    .insert(VariableLookup, [...inputs.VariableLookup.values()]);
