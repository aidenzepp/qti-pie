/**
 * The law oracle: the laws of the plan's §1.3 to §1.7, evaluated on the host over a package's
 * shredded and folded documents, for tests only (plan Q4.01).
 *
 * The database is the one law checker once the cutover lands. Until then this module states each
 * law as a host predicate over the rows `fold` writes (`#pantry/model/folds.ts`), with the closed
 * relations the composed grammar generates (`#pantry/grammar/compose.ts`), read through the model's
 * own projections of it (`#pantry/model/composed.ts`), so a package's verdict can be predicted
 * before any schema holds the laws. No import path reaches it, which `src/grammar/purity.test.ts`
 * holds, and Q7.02 deletes it.
 *
 * A package is judged as the importer will read it: its entries once, the manifest's schema
 * version, then each document through shred, the codec, which refuses `unmodeled-vocabulary`,
 * `attribute-admission` (an attribute its kind admits under no name) and `not-qti3`, and then
 * through the importer's one other check before any row exists, a closed `data-ssml` value
 * Data-SSML does not admit (`attribute-lexical`), and nothing else ({@link CodecRefusal}). The
 * documents that shred are folded. A fold that meets a child or an attribute with no cell has no
 * rows, and its refusal is the one breach of its document; every law is evaluated over the rows of
 * the documents that fold, each breach reported with the law, the rule the law keeps from the guard
 * or schema rule it replaces, and where it broke ({@link Breach}).
 *
 * The laws, in the plan's order:
 *
 * - **§1.3, the document layer:** N1 to N8 over `Node`, with the findings' laws: every fold's first
 *   slot is its identity (fin.md §4.3), the document node's `parentAncestry` is empty and its
 *   `nearestKind` its own kind, and E1, each derived field as PostgreSQL derives it. A family's
 *   content model is its Glushkov automaton (`#pantry/grammar/content.ts`): each child's `Follow`
 *   bit (N5), the last state's `Last` row and `Counted`'s bounds (N7). The default-hotspot law
 *   (ruling D3, Q5.09's) reads the last slot as stated.
 * - **§1.4:** each character-data arm both ways, the `Document` row, the namespace family, the
 *   attribute entity references, the foreign element names and `TextDomain`.
 * - **§1.5:** AL1 to AL4 (distinctness masks the open classes, fin.md §16), each value domain's
 *   compiled pattern over the form as written (its whitespace class absorbed), and the IDREF
 *   tokens' targets.
 * - **§1.6:** `root-type-reverse`, `file-listed`, `href-listed`, `entry-kind` and
 *   `manifest-id-space`; a resource's type outside its version's enumeration is the attribute's
 *   value domain's (spec reading 67).
 * - **§1.7, the overlays the grammar's relations state today:** O1 `document-key` over reading 101's
 *   bindings, an ID-typed element text's id bound to its parent, a cell's `headers` naming the
 *   `th`s of its own table (`table-headers`, reading 126: the information model states the rule
 *   over the XSD's plain identifier list, and the stricter source is the rule), and R26's
 *   `document-lang`; the HTML element laws `source-srcset`, `source-src` and `track-srclang`
 *   (readings 124 and 125); O2 `declaration-key`; O3 `binding-declared`, `binding-fit` with
 *   `record-binding-fit`, `choice-bounds`, `choice-identifier-distinct` (reading 104), and the
 *   feedback, template and printed-variable references; O4 arity (`P2`), undeclared references
 *   (`P8`), a rounding operator's `figures` (`P10`, reading 119) and an equality's `tolerance`
 *   (`P36`, reading 121); O5 `mapping-base-type`; O6 `lom-identifier`, a usage value's base type
 *   (reading 105) and `lom-learning-resource-type` (reading 122); O7 a selection's bound.
 *
 * The laws R87 found the oracle declared and never raised, and the laws the schema states that it
 * had not declared, are stated by `#pantry/test/oracle-laws.ts` (lane OL): the declarations (O2),
 * the expressions (O4), the LOM title (O6), the tests and sections (O7), `Adaptive feedback`, `Max
 * strings required`, `Dependency target` and `XML production`. The oracle calls
 * its document laws after its own over each document it judges and its package laws after its
 * own, and `src/test/complete.oracle.test.ts` holds every law the oracle declares to a package
 * drawn to break it. The overlays' other laws have no statement yet beyond the rule each replaces:
 * `lang-set-copy`, coords by shape, the gap and hottext owners beyond N8, `template-derivation`,
 * the CSM laws, and the typed values a domain derives beyond its regex (G5).
 */
import { Array as Arr, Effect, Equal, Option, Order, pipe, Record as Rec, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { rowOf } from "#pantry/grammar/ancestry.ts";
import {
  admissionOf as governedAdmission,
  admittedOf,
  attributeCounts,
  governorOf,
  languageTag,
  openDomain,
  requiredOf,
  textDomainOf,
} from "#pantry/grammar/attributes.ts";
import type { ValueDomain } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { contentEnds, contentFollows, contentModelOf } from "#pantry/grammar/content.ts";
import {
  cnDefaultType,
  cnForms,
  cnPatternOf,
  mathArities,
  mathHeadOperators,
  mathHeadQualifiers,
  mathQualifiers,
} from "#pantry/grammar/expression.ts";
import { booleanOf, compile, patternFlags } from "#pantry/grammar/domains.ts";
import type { DoubleBound } from "#pantry/grammar/domains.ts";
import { foreignKinds, isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import { textReferenceKinds } from "#pantry/grammar/references.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { Spelling } from "#pantry/grammar/references.ts";
import { expandedText } from "#pantry/grammar/names.ts";
import { expandedNameOf } from "#pantry/grammar/xsi.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type {
  FoldGrammar,
  FoldRefusal,
  FoldedAttribute,
  FoldedNode,
  FoldedRows,
  NodeDerived,
  Positions,
  Slot,
} from "#pantry/model/folds.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import type { ShredGrammar } from "#pantry/model/shred.ts";
import { flatten, handlePrefixOf } from "#pantry/model/xdm.ts";
import type {
  NodeId,
  NodeRow,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
  XdmElement,
} from "#pantry/model/xdm.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { builtinDomainOf } from "#pantry/vocab/derive/domains.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import type { Domain, WhiteSpace } from "#pantry/vocab/inventory/types.ts";
import { keyTextBytes, localNameBytes, namespaceBytes, utf8Length } from "#pantry/qti/limits.ts";
import { datumText } from "#pantry/test/predicates.ts";
import { keyCopies } from "#pantry/test/key-copies.ts";
import type { DocumentRows, KeyCopy } from "#pantry/test/key-copies.ts";
import { isUriReference } from "#pantry/test/uri-reference.ts";
import {
  addedLaws,
  lawDocumentBreaches,
  lawPackageBreaches,
  lomNamedTypes,
  objectRoots,
} from "#pantry/test/oracle-laws.ts";
import { dataSsmlBreachIn } from "#pantry/test/oracle-laws/data-ssml.ts";
import { lawTable, precedence } from "#pantry/vocab/laws.ts";
import { mathmlNamespace, namespaceNameOf, xsNamespace } from "#pantry/vocab/namespaces.ts";
import { oracleValueOf, resolveAttribute } from "#pantry/test/resolution.ts";
import {
  ancestorsOf,
  field,
  collapsed,
  contentLawOf,
  contentOf,
  integerOf,
  isOpenClass,
  pathOf,
  resolvedAt,
  slotKey,
  typedValueOf,
  valueOf,
  viewOf,
} from "#pantry/test/oracle-view.ts";
import type { LawBreach, ResolvedHref, TypedReading, View } from "#pantry/test/oracle-view.ts";
import type { OracleWhiteSpace } from "#pantry/test/resolution.ts";
import { dataName, typeAvailable } from "#pantry/vocab/open.ts";

/**
 * The rules a refusal is named by: the rule each law keeps from the guard or schema rule it
 * replaces (plan Q5.17), the codec's and the reader's, and three a law states that no rule of
 * today's importer names:
 *
 * - `child-set`: a content law of N7 (`Last`, `Counted`, `ChildBarredBy`), which ports a capacity
 *   use, a key or a mirror that today's schema refused under each relation's own name;
 * - `derived`: a field PostgreSQL derives (E1) that the host computed otherwise;
 * - `selection-bounds`: a section selects more parts than it holds (O7), a law of the test
 *   vocabulary, which today's model does not read.
 *
 * It holds the rules of a single-CDN install's policy too (`#pantry/qti/cdn.ts`), which a refusal
 * of such an install names, and which the oracle, judging a package as this package's own install
 * does, never raises.
 */
export const oracleRules = [
  "adaptive-feedback",
  "admission",
  "ancestry-ban",
  "aria-value-range",
  "attribute-admission",
  "attribute-count",
  "attribute-lexical",
  "binding-declared",
  "binding-fit",
  "binding-unique",
  "body-empty",
  "cdn-data",
  "cdn-foreign",
  "cdn-origin",
  "cdn-style",
  "branch-forward",
  "branch-target",
  "card-default",
  "card-support",
  "child-set",
  "choice-bounds",
  "choice-identifier-distinct",
  "context-variable-ref",
  "declaration-key",
  "declaration-reserved",
  "declaration-type",
  "derived",
  "document-key",
  "document-lang",
  "entry-kind",
  "feedback-ref",
  "file-exists",
  "file-listed",
  "fragment-context",
  "hotspot-default",
  "href-listed",
  "href-form",
  "href-path",
  "idref-target",
  "include-href",
  "include-root",
  "include-target",
  "inclusion-cycle",
  "item-ref-target",
  "key-text-bound",
  "label-tool",
  "lom-identifier",
  "lom-learning-resource-type",
  "lom-title",
  "lookup-cardinality",
  "manifest-id-space",
  "manifest-root",
  "map-key-unique",
  "mapping-base-type",
  "mastery-range",
  "math-arity",
  "max-strings-required",
  "namespace-name",
  "not-qti3",
  "ordering",
  "owner-copy",
  "P10",
  "P2",
  "P20",
  "P21",
  "P22",
  "P23",
  "P24",
  "P25",
  "P26",
  "P27",
  "P28",
  "P29",
  "P36",
  "P8",
  "pci-module-source",
  "prefixed-ref",
  "printed-variable-ref",
  "q-punctuation",
  "reachability",
  "reader-refusal",
  "record-binding-fit",
  "remote-section",
  "required-attribute",
  "reserved-type",
  "root-type-reverse",
  "section-identifier-target",
  "selection-bounds",
  "selection-required",
  "self-dependency",
  "slider-bounds",
  "source-src",
  "source-srcset",
  "ssml-fragment",
  "stimulus-ref-key",
  "stimulus-ref-target",
  "structure-identifier",
  "table-headers",
  "template-default-target",
  "template-ref",
  "test-name-key",
  "text-copy",
  "track-srclang",
  "typed-copy",
  "union-count",
  "unmodeled-vocabulary",
  "value-cardinality",
  "variable-kind",
  "variable-mapping-source",
  "variable-mapping-target",
  "well-formedness",
  "xsi-type",
  "zip-format",
] as const;

/**
 * A rule of {@link oracleRules}.
 */
export type OracleRule = (typeof oracleRules)[number];

/**
 * The key fields of the row a law breaks, each as text: `node`, the node's path in its document
 * (each element step `kind[at]` from the document node down, empty for a law over the package as
 * a whole), then the row's own key fields and the fields its law reads.
 */
export type Keys = Readonly<Record<string, string>>;

/**
 * One law a package's rows break: the law, the document where it broke, and the keys of the
 * failing row. Its rule is the law's ({@link ruleOf}) and its explanation is computed from the
 * keys and the grammar ({@link explain}), so a breach holds no prose of its own.
 *
 * `document` is the document's path in its package, empty for a law over the package as a whole.
 */
export type Breach = LawBreach<LawName>;

/**
 * The rules the codec and the reader refuse a package under, before any row exists: an attribute
 * shred reads under no name or open class its kind admits is `attribute-admission`, the rule of
 * AL1, and every other name shred cannot represent is `unmodeled-vocabulary`. A closed `data-ssml`
 * value Data-SSML does not admit is `attribute-lexical`, which the importer checks and the database
 * does not (spec reading R7-a).
 */
export type CodecRule = Extract<
  OracleRule,
  | "attribute-admission"
  | "attribute-lexical"
  | "href-path"
  | "manifest-root"
  | "not-qti3"
  | "reader-refusal"
  | "unmodeled-vocabulary"
  | "well-formedness"
  | "zip-format"
>;

/**
 * A package the codec or the reader refuses: no row of it is written, so no law reads it.
 */
export interface CodecRefusal {
  readonly _tag: "CodecRefusal";
  readonly detail: string;
  readonly document: string;
  readonly rule: CodecRule;
}

/**
 * A package whose documents all shred: the breaches of every law over its rows, in the order
 * the oracle evaluates them, empty when every law holds, and the documents it read, the manifest
 * first.
 */
export interface Judged {
  readonly _tag: "Judged";
  readonly breaches: readonly Breach[];
  readonly documents: readonly string[];
}

/**
 * What the oracle predicts of one package.
 */
export type Judgment = CodecRefusal | Judged;

/**
 * The verdict a judgment predicts: accepted, or refused under the rule of its codec refusal or of
 * its first breach.
 */
export type PredictedVerdict =
  | { readonly verdict: "accepted" }
  | { readonly rule: OracleRule; readonly verdict: "refused" };

/**
 * The fold before a family's first slot: the identity of each of its folds, the content
 * automaton's start, state 0, and no element (fin.md §4.3).
 */
const identity: Slot = { elements: 0n, state: 0 };

/**
 * Fold a tag's ASCII capitals to small letters: BCP 47 compares tags without regard to case, and a
 * tag's subtags are ASCII letters, digits and hyphens (RFC 5646 §2.1 and §2.1.1).
 *
 * @param tag - The tag as read.
 * @returns The tag with each of `A` to `Z` as its small letter, every other character as it is.
 */
const caseFolded = (tag: string): string =>
  tag.replaceAll(/[A-Z]/gu, (capital) => capital.toLowerCase());

/**
 * A well-formed BCP 47 language tag as a whole text, RFC 5646's `Language-Tag` as the grammar reads
 * it (`languageTag`, spec reading 129): the value of an `xml:lang` that states a language. A form
 * whose collapsed value is no tag identifies no language (RFC 5646 §2.1; spec reading 174).
 */
const languageTagForm = new RegExp(`^(?:${languageTag})$`, patternFlags);

/**
 * Split a collapsed list form into its tokens.
 *
 * @param lexical - The form as read.
 * @returns Its space-separated tokens, none for an empty form.
 */
const tokensOf = (lexical: string): readonly string[] => {
  const form = collapsed(lexical);

  return form === "" ? [] : form.split(" ");
};

/**
 * Decide whether two sets hold the same members.
 *
 * @param left - One set.
 * @param right - The other.
 * @returns Whether each holds every member of the other.
 */
const sameSet = <T>(left: ReadonlySet<T>, right: ReadonlySet<T>): boolean =>
  left.size === right.size && left.isSubsetOf(right);

/**
 * Decide whether two folds after a slot are equal: N5's and N7's copied fields.
 *
 * @param left - One fold.
 * @param right - The other.
 * @returns Whether they agree on the state and the element count.
 */
const sameSlot = (left: Slot, right: Slot): boolean =>
  left.state === right.state && left.elements === right.elements;

/**
 * Read a node's predecessor copies as a fold.
 *
 * @param node - The node.
 * @returns Its `was` and `elementsWas`.
 */
const wasOf = (node: FoldedNode<Composed>): Slot => ({
  elements: node.elementsWas,
  state: node.was,
});

/**
 * Read a node's end values as a fold.
 *
 * @param node - The node.
 * @returns Its `childState` and `elementChildren`.
 */
const endOf = (node: FoldedNode<Composed>): Slot => ({
  elements: node.elementChildren,
  state: node.childState,
});

/**
 * A child's kind under its parent's kind in one version: the key of `Admission`.
 */
interface ChildKey {
  readonly child: string;
  readonly parent: string;
  readonly version: SchemaVersion;
}

/**
 * Read a child's position in its parent's content model: the `position` of its `Admission` cell.
 *
 * @param grammar - The composed grammar.
 * @returns The position of a child by its key, 0 for a kind no position or several name, none for
 *   a child its parent does not admit.
 */
const admittedPosition =
  (grammar: ComposedGrammar) =>
  (key: ChildKey): Option.Option<number> =>
    Option.map(grammar.admission.lookup(key), ({ position }) => Number(position));

/**
 * Step a child by its installed cells, as the oracle reads C5 itself beside the host's
 * `placedStep`: its `Admission` position where `Follow` allows it from `was`; for a cell of
 * position 0, the one position its kind shares in the family's model that `Follow` allows, or `was`
 * for a kind that shares none, as character data.
 *
 * @param grammar - The composed grammar.
 * @param key - The child's `Admission` key.
 * @param was - The predecessor's state, 0 for the first child.
 * @returns The child's state; none for a child its parent does not admit, or one no position of
 *   which follows `was`.
 */
const cellStepOf = (grammar: ComposedGrammar, key: ChildKey, was: number): Option.Option<number> =>
  Option.flatMap(admittedPosition(grammar)(key), (position) => {
    const follows = (to: number): boolean =>
      contentFollows(grammar.content, {
        from: String(was),
        parent: key.parent,
        to: String(to),
        version: key.version,
      });

    if (position !== 0) {
      return Option.liftPredicate(position, follows);
    }

    const shared = grammar.content.sharedPositions({
      kind: key.child,
      parent: key.parent,
      version: key.version,
    });
    if (shared.length === 0) {
      return Option.some(was);
    }

    const next = shared.filter(follows);

    return next.length === 1 ? Option.fromNullishOr(next[0]) : Option.none();
  });

/**
 * Read the key of a node's `Admission` cell.
 *
 * @param node - The node.
 * @returns Its version, its parent's kind and its own.
 */
const childKeyOf = (node: FoldedNode<Composed>): ChildKey => ({
  child: node.kind,
  parent: node.parentKind,
  version: node.version,
});

/**
 * Derive a node's generated fields from its own fields and the closed relations, as PostgreSQL
 * does (E1), from the node's `Admission` cell: `ancestry = parentAncestry | Enters[kind]`, `state`
 * the cell's position where it names one, else the oracle's own step over the shared positions
 * and `Follow` ({@link cellStepOf}; the predecessor's state for character data), an absent cell or
 * step leaving `was`, and `elements = elementsWas + IsElement[kind]`.
 *
 * @param node - The node.
 * @param grammar - The composed grammar.
 * @returns Its derived fields.
 */
const derivationOf = (node: FoldedNode<Composed>, grammar: ComposedGrammar): NodeDerived => {
  const key = childKeyOf(node);
  const admitted = admittedPosition(grammar);

  return {
    ancestry: node.parentAncestry.union(rowOf(grammar.ancestry.enters, node.kind)),
    elements:
      node.elementsWas +
      (Option.isSome(grammar.kinds.isElement.lookup({ kind: node.kind })) ? 1n : 0n),
    state: Option.match(admitted(key), {
      onNone: () => node.was,
      onSome: (position) =>
        position === 0
          ? Option.getOrElse(cellStepOf(grammar, key, node.was), () => node.was)
          : position,
    }),
  };
};

/**
 * Key a kind's row in one version.
 *
 * @param version - The version.
 * @param kind - The kind.
 * @returns One string per (version, kind).
 */
const kindKey = (version: string, kind: string): string => `${version} ${kind}`;

/**
 * A table of the laws keyed by (version, kind, governing type), each cell computed from the grammar
 * the first time a law reads it; an element no named type governs is keyed by its kind alone.
 */
type ByKind<A> = (version: SchemaVersion, kind: string, governs: Option.Option<string>) => A;

/**
 * Compute a table keyed by (version, kind, governing type) on demand, each cell once.
 *
 * @param compute - The cell at a key.
 * @returns The table.
 */
const byKind = <A>(compute: ByKind<A>): ByKind<A> => {
  const cells = new Map<string, A>();

  return (version, kind, governs) => {
    const key = [kindKey(version, kind), ...Option.toArray(governs)].join(" ");
    const held = cells.get(key);
    if (held !== undefined) {
      return held;
    }

    const cell = compute(version, kind, governs);
    cells.set(key, cell);

    return cell;
  };
};

/**
 * The resource type an item is listed under, whose `RootOfType` root is the item's root kind.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * The resource type of a test: `RootOfType`'s root for it is the root of a document whose feedback
 * is typed under "Feedback outcome type" beside an item's.
 */
const testType = "imsqti_test_xmlv3p0";

/**
 * What the laws read beside a document's rows: the composed grammar, and the tables the oracle
 * derives from it.
 */
export interface Laws {
  /**
   * The XSD default of each attribute a kind declares in a version, keyed `version kind name`: a
   * kind declares a name at most once in a version, so each key holds one value.
   */
  readonly defaults: ReadonlyMap<string, string>;
  readonly domains: ReadonlyMap<string, { readonly domain: ValueDomain; readonly regex: RegExp }>;
  /**
   * The kinds `IsElement` holds.
   */
  readonly elements: ReadonlySet<string>;
  /**
   * The bounds `Counted` states for a kind's positions in a version, a position's element
   * children numbering from `min` to `max`.
   */
  readonly counted: (
    version: SchemaVersion,
    kind: string,
  ) => readonly { readonly max: number; readonly min: number; readonly position: number }[];
  readonly grammar: ComposedGrammar;
  /**
   * The root kind of an item: `RootOfType`'s root for {@link itemType}.
   */
  readonly itemRoot: Option.Option<string>;
  /**
   * The root kind of a test: `RootOfType`'s root for {@link testType}.
   */
  readonly testRoot: Option.Option<string>;
  readonly kinds: ReadonlySet<string>;
  /**
   * The (version, kind) pairs that have a content model, keyed `version kind`: each holds a row of
   * `Last`, since every automaton ends somewhere.
   */
  readonly modeled: ReadonlySet<string>;
  /**
   * The positions of the open classes a kind admits in a version under a governing type: AL2's
   * mask `open`, under which two attributes of one class are not a repeated name.
   */
  readonly open: ByKind<Positions>;
  /**
   * The positions of the attributes a kind requires in a version under a governing type:
   * `Required`, the side of its governor's or its kind's admission its `use = required` selects.
   */
  readonly required: ByKind<Positions>;
}

/**
 * Derive the tables the laws read from the composed grammar: each domain's compiled regex, each
 * kind's required and open-class positions per version, the XSD defaults of the declared
 * attributes per version (from the inventory leaf), the element kinds, the item's root kind, the
 * `NodeKind` roster, the kinds with a content model and `Counted`'s bounds by kind.
 *
 * @param grammar - The composed grammar.
 * @returns The tables.
 */
export const lawsOf = (grammar: ComposedGrammar): Laws => {
  const counted = Map.groupBy(grammar.content.counted.rows, (row) =>
    kindKey(row.version, row.parent),
  );
  // The content models a family may end in: every model but that of the families no model holds.
  const ending = new Set(grammar.content.last.rows.map(({ model }) => model));
  const laws: Laws = {
    counted: (version, kind) =>
      (counted.get(kindKey(version, kind)) ?? []).map(({ max, min, position }) => ({
        max,
        min,
        position: Number(position),
      })),
    defaults: new Map(
      attributeDeclarations.flatMap(({ default: stated, kind, name, versions }) =>
        Option.toArray(stated).flatMap((value) =>
          versions.map((version) => [`${version} ${kind} ${name}`, value] as const),
        ),
      ),
    ),
    domains: new Map(
      grammar.attributes.domains.map((domain) => [
        domain.handle,
        { domain, regex: new RegExp(domain.pattern, patternFlags) },
      ]),
    ),
    elements: new Set(grammar.kinds.isElement.rows.map(({ kind }) => kind)),
    grammar,
    itemRoot: Option.fromNullishOr(
      grammar.package.rootOfType.rows.find(({ type }) => type === itemType)?.root,
    ),
    kinds: new Set(grammar.kinds.nodeKind.handles),
    modeled: new Set(
      grammar.content.contentModelOf.rows
        .filter(({ model }) => ending.has(model))
        .map(({ parent, version }) => kindKey(version, parent)),
    ),
    open: byKind(
      (version, kind, governs) =>
        new Set(
          openClasses.flatMap((name) =>
            Option.toArray(
              governedAdmission(grammar.attributes, { governs, kind, name, version }),
            ).map(({ position }) => position),
          ),
        ),
    ),
    required: byKind((version, kind, governs) =>
      requiredOf(grammar.attributes, grammar.kinds.attributeName, version, kind, governs),
    ),
    testRoot: Option.fromNullishOr(
      grammar.package.rootOfType.rows.find(({ type }) => type === testType)?.root,
    ),
  };

  return laws;
};

/**
 * One law over a document's node rows: its name, the rows it reads (`nodes`, every row; `members`,
 * the rows φ₀ = `start > 0` selects, the document node left out), and the keys of each row that
 * breaks it beside the node's own (`id`, `kind`, `parentKind`, `version`).
 */
interface NodeLaw {
  /**
   * Describe how a row breaks the law.
   *
   * @param node - The row.
   * @param view - Its document.
   * @param laws - The grammar's tables.
   * @returns The fields the law read that broke, or none when the row meets the law.
   */
  readonly breaks: (node: FoldedNode<Composed>, view: View, laws: Laws) => Option.Option<Keys>;
  readonly law: NodeLawName;
  readonly over: "members" | "nodes";
}

/**
 * Name the keys of a breach when a condition fails.
 *
 * @param holds - Whether the law holds.
 * @param keys - The failing row's keys when it does not.
 * @returns None when it holds, the keys otherwise.
 */
const unless = (holds: boolean, keys: () => Keys): Option.Option<Keys> =>
  holds ? Option.none() : Option.some(keys());

/**
 * Name an element's governing type among a breach's keys: `governs`, where a named type governs it,
 * and no key where none does.
 *
 * @param governs - The element's governing type.
 * @returns The keys.
 */
const governsKeys = (governs: Option.Option<string>): Keys =>
  Option.match(governs, { onNone: () => ({}), onSome: (type) => ({ governs: type }) });

/**
 * Write a set's members as one key field: their texts, space separated, in their order.
 *
 * @param set - The set.
 * @returns The field.
 */
const spaced = (set: Iterable<unknown>): string => [...set].map(String).join(" ");

/**
 * Read a key field written by {@link spaced} back as its members.
 *
 * @param text - The field, none when the keys do not hold it.
 * @returns Its members.
 */
const membersOf = (text: string | undefined): readonly string[] =>
  text === undefined || text === "" ? [] : text.split(" ");

/**
 * Read the position an attribute name holds among those an element admits (D8), under its
 * governor where one governs it, else under its kind.
 *
 * @param laws - The grammar's tables.
 * @param version - The version.
 * @param kind - The kind.
 * @param governs - The element's governing type, none where no named type governs it.
 * @param name - The `AttributeName` handle.
 * @returns Its position, or none when the element does not admit the name.
 */
const positionOf = (
  laws: Laws,
  version: SchemaVersion,
  kind: string,
  governs: Option.Option<string>,
  name: string,
): Option.Option<number> =>
  Option.map(
    governedAdmission(laws.grammar.attributes, { governs, kind, name, version }),
    ({ position }) => position,
  );

/**
 * Compute a node's string value from its children's rows, as the folds define it and
 * independently of them: its text and whitespace children's characters and its entity references
 * as `&name;`, in slot order, the empty string when it holds none; comments and instructions add
 * nothing.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns The string value.
 */
const stringValueOf = (view: View, node: FoldedNode<Composed>): string =>
  (view.childrenOf.get(node.id) ?? [])
    .map((child) => {
      if (child.kind === "text" || child.kind === "ws") {
        return view.textOf.get(child.id) ?? "";
      }

      return child.kind === "entityRef" ? `&${view.entityOf.get(child.id) ?? ""};` : "";
    })
    .join("");

/**
 * Read a node's own characters from its rows, as `Node.chars` holds them: a text's or whitespace's
 * value, an entity reference as `&name;`, and nothing for any other node or for no node.
 *
 * @param view - The document.
 * @param node - The node, none where no row is at the place read.
 * @returns Its characters.
 */
const ownCharactersOf = (view: View, node: FoldedNode<Composed> | undefined): string => {
  if (node?.kind === "text" || node?.kind === "ws") {
    return view.textOf.get(node.id) ?? "";
  }

  return node?.kind === "entityRef" ? `&${view.entityOf.get(node.id) ?? ""};` : "";
};

/**
 * Read an element's namespace name: a closed kind's `ElementName` namespace, a foreign element's
 * stored one.
 *
 * @param view - The document.
 * @param grammar - The composed grammar.
 * @param node - The element.
 * @returns The namespace name, empty for none; none for a node that is no element.
 */
const namespaceOf = (
  view: View,
  grammar: ComposedGrammar,
  node: FoldedNode<Composed>,
): Option.Option<string> =>
  isForeignKind(node.kind)
    ? Option.fromNullishOr(view.foreignNamespaceOf.get(node.id))
    : Option.map(
        grammar.kinds.elementName.lookup({ kind: node.kind }),
        ({ namespace }) => namespace,
      );

/**
 * Name the class a namespace name has against another (XML Schema Part 1 §3.10.4): absent when
 * it is empty, own when it is the other, and other otherwise.
 *
 * @param uri - The namespace name.
 * @param against - The namespace name it is classed against.
 * @returns The class.
 */
const classAgainst = (uri: string, against: string): "absent" | "other" | "own" => {
  if (uri === "") {
    return "absent";
  }

  return uri === against ? "own" : "other";
};

/**
 * The open attribute class of each namespace class: a name in no namespace, in its element's, and
 * in another.
 */
const attributeClasses = {
  absent: "no-namespace",
  other: "foreign",
  own: "own-namespace",
} as const;

/**
 * Decide whether a node's merged copy of its parent is its parent's fields: `document`,
 * `version`, `parentKind`, `parentStart`, `parentAncestry`, `parentNearest` and
 * `parentNearestKind` (trees.md §6).
 *
 * @param node - The node.
 * @param parent - Its parent's row, none when no row holds the id.
 * @returns Whether every copied field is its parent's.
 */
const parentCopied = (
  node: FoldedNode<Composed>,
  parent: FoldedNode<Composed> | undefined,
): boolean =>
  parent !== undefined &&
  node.document === parent.document &&
  node.version === parent.version &&
  node.parentKind === parent.kind &&
  node.parentStart === parent.start &&
  sameSet(node.parentAncestry, parent.derived.ancestry) &&
  node.parentNearest === parent.nearest &&
  node.parentNearestKind === parent.nearestKind;

/**
 * List a node's element children, in slot order.
 *
 * @param view - The document.
 * @param node - The node.
 * @param elements - The kinds that are elements.
 * @returns Its children whose kind `IsElement` holds.
 */
const elementChildrenOf = (
  view: View,
  node: FoldedNode<Composed>,
  elements: ReadonlySet<string>,
): readonly FoldedNode<Composed>[] =>
  (view.childrenOf.get(node.id) ?? []).filter(({ kind }) => elements.has(kind));

/**
 * Read an element's closed attribute as written and collapsed ({@link collapsed}).
 *
 * @param view - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed name.
 * @returns Its collapsed lexical form, or none when the element carries no such attribute.
 */
const collapsedValueOf = (view: View, node: NodeId, name: string): Option.Option<string> =>
  Option.map(valueOf(view, node, name), collapsed);

/**
 * The qualifiers whose place R6-head-qualifiers ties to an operator: `degree`, `momentabout` and
 * `logbase`, the qualifier kinds of {@link mathHeadQualifiers}.
 */
const headQualifierKinds: ReadonlySet<string> = new Set(
  mathHeadQualifiers.map(({ qualifier }) => qualifier),
);

/**
 * One part of a `cn`'s content: its text collapsed, and whether it is plain text.
 */
interface CnPart {
  /**
   * False when the part holds an element or an entity reference, which the form law does not judge.
   */
  readonly judged: boolean;
  readonly text: string;
}

/**
 * Split a `cn`'s content into parts at its `m:sep` children (MathML 3 §4.2.1): the text and
 * whitespace children's characters of each stretch between separators, collapsed (§2.1.7); comments
 * and instructions add nothing.
 *
 * @param view - The document.
 * @param node - The `cn`.
 * @param elements - The kinds that are elements.
 * @returns Its parts in order, one more than it has separators.
 */
const cnPartsOf = (
  view: View,
  node: FoldedNode<Composed>,
  elements: ReadonlySet<string>,
): readonly CnPart[] => {
  const raw: { judged: boolean; text: string }[] = [{ judged: true, text: "" }];

  for (const child of view.childrenOf.get(node.id) ?? []) {
    const last = raw.at(-1);
    if (last === undefined) {
      continue;
    }

    if (child.kind === "m:sep") {
      raw.push({ judged: true, text: "" });
    } else if (child.kind === "text" || child.kind === "ws") {
      last.text += view.textOf.get(child.id) ?? "";
    } else if (child.kind === "entityRef" || elements.has(child.kind)) {
      last.judged = false;
    }
  }

  return raw.map(({ judged, text }) => ({ judged, text: collapsed(text) }));
};

/**
 * The direction in effect around an element: the `dir` of its nearest ancestor that writes `ltr` or
 * `rtl`, `ltr` once the walk passes an `m:math` that writes neither. MathML 3 §2.2.1 says "the dir
 * attribute defaults to "ltr" on the math element (but inherits on all other elements which accept
 * the dir attribute)", and §3.1.5.1 sets a formula's direction by its `math` element, so an HTML
 * ancestor's `dir` above it is not read (reading 164).
 *
 * @param view - The document.
 * @param node - The element.
 * @returns The direction its parent passes it.
 */
const inheritedDirectionOf = (view: View, node: FoldedNode<Composed>): string => {
  for (const above of ancestorsOf(view, node)) {
    const written = collapsedValueOf(view, above.id, "dir");
    if (Option.isSome(written) && (written.value === "ltr" || written.value === "rtl")) {
      return written.value;
    }

    if (above.kind === "m:math") {
      return "ltr";
    }
  }

  return "ltr";
};

/**
 * Tell whether an element writes a `dir` other than the one it inherits, so `mrow dir="ltr"` in a
 * left-to-right formula changes none (operator decision 321). A `dir` that spells neither `ltr` nor
 * `rtl` changes nothing (MathML 3 §2.2.1 lists only those two; reading 164).
 *
 * @param view - The document.
 * @param node - The element.
 * @returns True when its `dir` is `ltr` or `rtl` and differs from {@link inheritedDirectionOf}.
 */
const changesDirection = (view: View, node: FoldedNode<Composed>): boolean =>
  Option.exists(
    collapsedValueOf(view, node.id, "dir"),
    (written) =>
      (written === "ltr" || written === "rtl") && written !== inheritedDirectionOf(view, node),
  );

/**
 * Find the child an `maction` shows: the one its `selection` (1 when absent) numbers, counted among
 * its element children from 1 (MathML 3 §3.7.1.1).
 *
 * @param view - The document.
 * @param node - The `maction`.
 * @param elements - The kinds that are elements.
 * @returns The id of the selected child, none when `selection` is no whole number or is out of
 *   range.
 */
const selectedChildOf = (
  view: View,
  node: FoldedNode<Composed>,
  elements: ReadonlySet<string>,
): Option.Option<NodeId> => {
  const rank = Option.match(collapsedValueOf(view, node.id, "selection"), {
    onNone: () => 1,
    onSome: (text) => (/^[0-9]+$/u.test(text) ? Number(text) : Number.NaN),
  });

  return Option.map(
    Option.fromNullishOr(elementChildrenOf(view, node, elements)[rank - 1]),
    ({ id }) => id,
  );
};

/**
 * Tell whether an element on the way up from an alignment group lets it through to its cell
 * (MathML 3 §3.5.5.2): an `mrow` or `mstyle` that changes no direction, `mphantom`, `mfenced`,
 * `semantics`, and an `maction` (whose selected child the caller has checked).
 *
 * @param view - The document.
 * @param node - The element.
 * @returns True when a group below it still stands in the cell.
 */
const letsGroupThrough = (view: View, node: FoldedNode<Composed>): boolean =>
  node.kind === "m:mrow" || node.kind === "m:mstyle"
    ? !changesDirection(view, node)
    : ["m:maction", "m:mfenced", "m:mphantom", "m:semantics"].includes(node.kind);

/**
 * Where an alignment group stands in its table cell.
 */
interface GroupPlace {
  /**
   * The group's nearest `m:mtd`.
   */
  readonly cell: FoldedNode<Composed>;
  /**
   * The kind of the first element between the group and its cell that stops it, none where the
   * group stands.
   */
  readonly through: Option.Option<string>;
}

/**
 * Judge where an `m:maligngroup` stands (MathML 3 §3.5.5.2 and §3.5.5.9).
 *
 * @param view - The document.
 * @param group - The group.
 * @param elements - The kinds that are elements.
 * @returns Its cell and the element that stops it, none when the group is not judged: no `m:mtd`
 *   holds it, or it sits under an `maction` child that is not the selected one.
 */
const placeOfGroup = (
  view: View,
  group: FoldedNode<Composed>,
  elements: ReadonlySet<string>,
): Option.Option<GroupPlace> => {
  const chain = ancestorsOf(view, group);
  const cell = chain.find(({ kind }) => kind === "m:mtd");
  if (cell === undefined) {
    return Option.none();
  }

  const between = chain.slice(0, chain.indexOf(cell));
  const path = [group, ...between];
  const shown = between.every(
    (above, index) =>
      above.kind !== "m:maction" ||
      Option.exists(selectedChildOf(view, above, elements), (id) => id === path[index]?.id),
  );

  return shown
    ? Option.some({
        cell,
        through: Option.map(
          Option.fromNullishOr(between.find((above) => !letsGroupThrough(view, above))),
          ({ kind }) => kind,
        ),
      })
    : Option.none();
};

/**
 * The elements a table cell holds, apart from the cells nested in it: its alignment groups and its
 * complete elements (those with no element children), each in document order.
 */
interface CellContent {
  readonly groups: readonly FoldedNode<Composed>[];
  readonly leaves: readonly FoldedNode<Composed>[];
}

/**
 * Collect a cell's alignment groups and complete elements in document order. A nested `m:mtd`,
 * empty or not, is another cell's: it is no leaf of this one and is not entered.
 *
 * @param view - The document.
 * @param cell - The `m:mtd`.
 * @param elements - The kinds that are elements.
 * @returns What the cell holds.
 */
const contentOfCell = (
  view: View,
  cell: FoldedNode<Composed>,
  elements: ReadonlySet<string>,
): CellContent => {
  const groups: FoldedNode<Composed>[] = [];
  const leaves: FoldedNode<Composed>[] = [];
  const visit = (parent: FoldedNode<Composed>): void => {
    for (const child of elementChildrenOf(view, parent, elements)) {
      if (child.kind === "m:mtd") {
        continue;
      }

      if (child.kind === "m:maligngroup") {
        groups.push(child);
      }

      if (elementChildrenOf(view, child, elements).length === 0) {
        leaves.push(child);
      } else {
        visit(child);
      }
    }
  };
  visit(cell);

  return { groups, leaves };
};

/**
 * Find the SSML fragment a node sits in, spec reading 3's "document": its nearest `ssml:speak`,
 * itself included. SSML's fragment removal removes a non-SSML element with everything below it
 * (SSML 1.1, §2.2.1), so a `speak` nested in foreign content beneath another is its own fragment.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns The id of its nearest `speak`, none outside every one.
 */
const fragmentOf = (view: View, node: FoldedNode<Composed>): NodeId | undefined =>
  [node, ...ancestorsOf(view, node)].find(({ kind }) => kind === "ssml:speak")?.id;

/**
 * What one SSML fragment defines: its lexicons' `xml:id`s and how many of its marks hold each
 * `name`, each by its value, collapsed ({@link collapsed}; an `xs:ID`'s and an `xs:token`'s
 * whiteSpace, SSML 1.1 §3.3.2).
 */
interface Fragment {
  readonly lexicons: ReadonlySet<string>;
  readonly marks: ReadonlyMap<string, number>;
}

/**
 * The fragments of each document, computed once per document.
 */
const fragmentCache = new WeakMap<View, ReadonlyMap<NodeId, Fragment>>();

/**
 * Collect what each SSML fragment of a document defines, by its `speak`'s id.
 *
 * @param view - The document.
 * @returns The fragments.
 */
const fragmentsOf = (view: View): ReadonlyMap<NodeId, Fragment> => {
  const held = fragmentCache.get(view);
  if (held !== undefined) {
    return held;
  }

  const lexicons = new Map<NodeId, Set<string>>();
  const marks = new Map<NodeId, Map<string, number>>();
  for (const node of view.members) {
    const fragment = fragmentOf(view, node);
    if (fragment !== undefined && node.kind === "ssml:lexicon") {
      for (const id of Option.toArray(valueOf(view, node.id, "xml:id"))) {
        lexicons.set(fragment, (lexicons.get(fragment) ?? new Set()).add(collapsed(id)));
      }
    }

    if (fragment !== undefined && node.kind === "ssml:mark") {
      for (const name of Option.toArray(valueOf(view, node.id, "name"))) {
        const counted = marks.get(fragment) ?? new Map<string, number>();
        counted.set(collapsed(name), (counted.get(collapsed(name)) ?? 0) + 1);
        marks.set(fragment, counted);
      }
    }
  }

  const fragments = new Map(
    view.members
      .filter(({ kind }) => kind === "ssml:speak")
      .map(({ id }): readonly [NodeId, Fragment] => [
        id,
        { lexicons: lexicons.get(id) ?? new Set(), marks: marks.get(id) ?? new Map() },
      ]),
  );
  fragmentCache.set(view, fragments);

  return fragments;
};

/**
 * Find the table a node takes part in (spec reading 126): its nearest `table`, itself included.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns The id of its nearest `table`, none where no `table` holds it.
 */
const tableOf = (view: View, node: FoldedNode<Composed>): NodeId | undefined =>
  [node, ...ancestorsOf(view, node)].find(({ kind }) => kind === "table")?.id;

/**
 * An NCName, `xs:NCName` as the value domains compile it: the form of a bare variable reference,
 * and of an ID's value, `xs:ID` being a restriction of it.
 */
const nameForm = new RegExp(
  Result.getOrThrowWith(
    Result.flatMap(builtinDomainOf("NCName"), (domain) => compile(domain, "exact")),
    (unread) => unread,
  ).pattern,
  patternFlags,
);

/**
 * The header ids of each document's tables, computed once per document.
 */
const tableHeaderCache = new WeakMap<View, ReadonlyMap<NodeId, ReadonlySet<string>>>();

/**
 * Collect the ids of the `th`s that take part in each table of a document, by the table's id,
 * each id collapsed (an `xs:ID`'s whiteSpace) and an NCName ({@link nameForm}): an `id` outside
 * `xs:ID`'s lexical space is no ID value, so a cell's `headers` token names no header by it (spec
 * reading 156).
 *
 * @param view - The document.
 * @returns Each table's header ids; a table no `th` with an ID takes part in holds none.
 */
const tableHeadersOf = (view: View): ReadonlyMap<NodeId, ReadonlySet<string>> => {
  const held = tableHeaderCache.get(view);
  if (held !== undefined) {
    return held;
  }

  const headers = new Map<NodeId, Set<string>>();
  for (const node of view.members) {
    const table = node.kind === "th" ? tableOf(view, node) : undefined;
    if (table !== undefined) {
      for (const id of Option.toArray(valueOf(view, node.id, "id")).map(collapsed)) {
        if (nameForm.test(id)) {
          headers.set(table, (headers.get(table) ?? new Set()).add(id));
        }
      }
    }
  }

  tableHeaderCache.set(view, headers);

  return headers;
};

/**
 * Decide whether a foreign element is one of spec reading 6's roots whose global declaration its
 * parent's `strict` wildcards find (C13): its expanded name, `namespace}local`, matches
 * `HeldRootsUnder`'s pattern for its (version, parent kind). Such an element is assessed against
 * that declaration, so the law "Strictly held" does not ask it for an `xsi:type`, and reading 6
 * keeps it foreign.
 *
 * @param grammar - The composed grammar.
 * @param view - The document.
 * @param node - The foreign element.
 * @returns Whether the parent's strict wildcards hold it by its declaration.
 */
const heldRoot = (grammar: ComposedGrammar, view: View, node: FoldedNode<Composed>): boolean =>
  Option.exists(
    Option.all({
      held: grammar.heldRootsUnder.lookup({ parent: node.parentKind, version: node.version }),
      name: Option.fromNullishOr(view.rows.openElementNames.find((row) => row.node === node.id)),
    }),
    ({ held, name }) => new RegExp(held.names, patternFlags).test(expandedText(name)),
  );

/**
 * The choices an interaction encloses, which N8's choice clause reads: each a choice class's
 * element whose parents in the information model are interactions, or for a gap one that "must only
 * appear within a 'gapMatchInteraction'" (reading 38). A simple choice's are the choice and order
 * interactions (§5.132), a simple associable choice's the associate interaction and the simple
 * match set (§5.131), which the match interaction holds (§5.133), a hotspot choice's the graphic
 * order and hotspot interactions (§5.67), an associable hotspot's the graphic associate and graphic
 * gap match interactions (§5.7), a gap text's and a gap image's the gap choice (§5.58, §5.56),
 * which the gap match and graphic gap match interactions hold (§6.17), and an inline choice's the
 * inline choice interaction (§5.73); the gap's is §5.55's sentence. A hottext may stand outside a
 * hottext interaction (reading 38), so it is none of them.
 *
 * The clause reads a choice that writes its `identifier` (multiplicity [1] in each class), the
 * value its interaction's response names: one that writes none breaks AL3, and the content model
 * (N5 to N7) places it as it places any element.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_SimpleChoice | QTI 3.0 information model, §5.132 SimpleChoice}
 */
const enclosedChoices: ReadonlySet<string> = new Set([
  "qti-associable-hotspot",
  "qti-gap",
  "qti-gap-img",
  "qti-gap-text",
  "qti-hotspot-choice",
  "qti-inline-choice",
  "qti-simple-associable-choice",
  "qti-simple-choice",
]);

/**
 * The laws of §1.3 and §1.5 over node rows, in the plan's notation and order, after the key of
 * `Node`, then N7's content laws: `Last` at the last slot, `Counted`'s bounds and `ChildBarredBy`.
 *
 * Under Unique Particle Attribution a content model's automaton states its order, its required
 * particles, at-most-once and exclusive choice: a child out of place breaks N5's `Follow`, and a
 * family that stops short breaks N7's `Last`. A bound of 2 to n, which a position automaton
 * relaxes, and a spec reading's count, are `Counted`'s.
 */
const nodeLaws: readonly NodeLaw[] = [
  {
    breaks: (node, { repeated }) => unless(!repeated.has(node), () => ({})),
    law: "Node key",
    over: "nodes",
  },
  {
    breaks: (node, { startTaken }) =>
      unless(!startTaken.has(node), () => ({ start: String(node.start) })),
    law: "T1 document order",
    over: "nodes",
  },
  {
    breaks: (node) =>
      unless((node.parent === node.id) === (node.start === 0n), () => ({
        parent: node.parent,
        start: String(node.start),
      })),
    law: "T2 root",
    over: "nodes",
  },
  {
    breaks: (node, { self }) =>
      unless(
        node.start > 0n ||
          (node.id === self &&
            node.at === 0n &&
            node.parent === node.id &&
            node.document === node.id &&
            node.nearest === node.id &&
            node.nearestKind === node.kind &&
            node.parentAncestry.size === 0),
        () => ({
          at: String(node.at),
          document: node.document,
          nearest: node.nearest,
          nearestKind: node.nearestKind,
          parent: node.parent,
          parentAncestry: spaced(node.parentAncestry),
        }),
      ),
    law: "N1 sentinel",
    over: "nodes",
  },
  {
    breaks: (node, { bySlot }) => {
      const missing = Array.from({ length: Number(node.children) }, (_, at) => BigInt(at)).filter(
        (at) => !bySlot.has(slotKey(node.id, at)),
      );

      return unless(missing.length === 0, () => ({
        children: String(node.children),
        missing: spaced(missing),
      }));
    },
    law: "N2 mirrors",
    over: "nodes",
  },
  {
    breaks: (node, { byId }) => {
      const parent = byId.get(node.parent);

      return unless(parent !== undefined && node.at < parent.children, () => ({
        at: String(node.at),
        parent: node.parent,
        parentChildren: String(parent?.children ?? 0n),
      }));
    },
    law: "N2 mirrors",
    over: "members",
  },
  {
    breaks: (node, { byId }) => {
      const parent = byId.get(node.parent);

      return unless(
        parentCopied(node, parent) && (node.at > 0n || node.start === node.parentStart + 1n),
        () => ({
          at: String(node.at),
          parent: node.parent,
          parentStart: String(node.parentStart),
          parentStartHeld: parent === undefined ? "" : String(parent.start),
          start: String(node.start),
        }),
      );
    },
    law: "T3 first child",
    over: "members",
  },
  {
    breaks: (node, { bySlot }) => {
      if (node.at === 0n) {
        return Option.none();
      }

      const before = bySlot.get(slotKey(node.parent, node.at - 1n));

      return unless(before !== undefined && before.end === node.start, () => ({
        predecessorEnd: before === undefined ? "" : String(before.end),
        start: String(node.start),
      }));
    },
    law: "T4 next sibling",
    over: "members",
  },
  {
    breaks: (node, { bySlot }) => {
      if (node.children === 0n) {
        return Option.none();
      }

      const last = bySlot.get(slotKey(node.id, node.children - 1n));

      return unless(last !== undefined && last.end === node.end, () => ({
        end: String(node.end),
        lastEnd: last === undefined ? "" : String(last.end),
      }));
    },
    law: "T5 last child",
    over: "nodes",
  },
  {
    breaks: (node) =>
      unless(node.end > node.start && (node.children > 0n || node.end === node.start + 1n), () => ({
        children: String(node.children),
        end: String(node.end),
        start: String(node.start),
      })),
    law: "T6 nonempty and leaf",
    over: "nodes",
  },
  {
    breaks: (node, _view, { grammar, kinds }) =>
      unless(
        kinds.has(node.kind) &&
          kinds.has(node.parentKind) &&
          grammar.kinds.versions.has(node.version),
        () => ({}),
      ),
    law: "N4 kinds",
    over: "nodes",
  },
  {
    breaks: (node, _view, { grammar }) =>
      unless(
        Option.isSome(
          grammar.admission.lookup({
            child: node.kind,
            parent: node.parentKind,
            version: node.version,
          }),
        ),
        () => ({}),
      ),
    law: "N5 admitted",
    over: "members",
  },
  {
    breaks: (node, _view, { grammar }) => {
      const key = childKeyOf(node);

      return Option.isNone(admittedPosition(grammar)(key))
        ? Option.none()
        : unless(Option.isSome(cellStepOf(grammar, key, node.was)), () => ({
            was: String(node.was),
          }));
    },
    law: "N5 Follow",
    over: "members",
  },
  {
    breaks: (node) =>
      unless(node.at > 0n || sameSlot(wasOf(node), identity), () => ({
        elementsWas: String(node.elementsWas),
        was: String(node.was),
      })),
    law: "N5 first slot",
    over: "nodes",
  },
  {
    breaks: (node, { bySlot }) => {
      const before = bySlot.get(slotKey(node.parent, node.at - 1n));

      return unless(
        node.at === 0n || (before !== undefined && sameSlot(wasOf(node), before.derived)),
        () => ({
          elementsWas: String(node.elementsWas),
          predecessorElements: before === undefined ? "" : String(before.derived.elements),
          predecessorState: before === undefined ? "" : String(before.derived.state),
          was: String(node.was),
        }),
      );
    },
    law: "N5 fold",
    over: "members",
  },
  {
    breaks: (node, view, { grammar }) => {
      const derived = derivationOf(node, grammar);
      const written = stringValueOf(view, node);
      // Reading 127's ends: the first and last code points of the node's own characters.
      const own = Array.from(ownCharactersOf(view, node), String);
      const first = own[0] ?? "";
      const last = own.at(-1) ?? "";

      return unless(
        sameSlot(node.derived, derived) &&
          sameSet(node.derived.ancestry, derived.ancestry) &&
          node.stringValue === written &&
          node.first === first &&
          node.last === last,
        () => ({
          ancestry: spaced(node.derived.ancestry),
          derivedAncestry: spaced(derived.ancestry),
          derivedElements: String(derived.elements),
          derivedFirst: first,
          derivedLast: last,
          derivedState: String(derived.state),
          derivedStringValue: written,
          elements: String(node.derived.elements),
          first: node.first,
          last: node.last,
          state: String(node.derived.state),
          stringValue: node.stringValue,
        }),
      );
    },
    law: "E1 derived",
    over: "nodes",
  },
  {
    breaks: (node, _view, { grammar }) => {
      const banned = rowOf(grammar.ancestry.banned, node.kind).intersection(node.parentAncestry);
      const missing = rowOf(grammar.ancestry.needs, node.kind).difference(node.parentAncestry);

      return unless(banned.size === 0 && missing.size === 0, () => ({
        parentAncestry: spaced(node.parentAncestry),
      }));
    },
    law: "N6 ancestry",
    over: "nodes",
  },
  {
    breaks: (node, { bySlot }) => {
      const last = bySlot.get(slotKey(node.id, node.children - 1n));

      return unless(
        node.children === 0n || (last !== undefined && sameSlot(endOf(node), last.derived)),
        () => ({
          childState: String(node.childState),
          elementChildren: String(node.elementChildren),
          lastElements: last === undefined ? "" : String(last.derived.elements),
          lastState: last === undefined ? "" : String(last.derived.state),
        }),
      );
    },
    law: "N7 last slot",
    over: "nodes",
  },
  {
    breaks: (node) =>
      unless(node.children > 0n || sameSlot(endOf(node), identity), () => ({
        childState: String(node.childState),
        elementChildren: String(node.elementChildren),
      })),
    law: "N7 empty family",
    over: "nodes",
  },
  {
    breaks: (node, _view, { grammar }) =>
      unless(
        Option.isSome(grammar.kinds.interaction.lookup({ kind: node.parentKind }))
          ? node.nearest === node.parent && node.nearestKind === node.parentKind
          : node.nearest === node.parentNearest && node.nearestKind === node.parentNearestKind,
        () => ({
          nearest: node.nearest,
          nearestKind: node.nearestKind,
          parent: node.parent,
          parentNearest: node.parentNearest,
        }),
      ),
    law: "N8 nearest",
    over: "members",
  },
  {
    // N8's choice clause: a choice that writes its identifier lies in an interaction, its nearest.
    breaks: (node, view, { grammar }) =>
      unless(
        !enclosedChoices.has(node.kind) ||
          Option.isNone(valueOf(view, node.id, "identifier")) ||
          Option.isSome(grammar.kinds.interaction.lookup({ kind: node.nearestKind })),
        () => ({ nearest: node.nearest, nearestKind: node.nearestKind }),
      ),
    law: "N8 nearest",
    over: "members",
  },
  {
    breaks: (node, view) => {
      const rows = view.attributesOf.get(node.id)?.length ?? 0;

      return unless(BigInt(rows) === node.attributes, () => ({
        attributes: String(node.attributes),
        rows: String(rows),
      }));
    },
    law: "AL2 count",
    over: "nodes",
  },
  {
    breaks: (node, view) => {
      const last = view.attributesOf.get(node.id)?.at(-1);

      return unless(sameSet(node.attrs, last?.derived.attrs ?? new Set()), () => ({
        attrs: spaced(node.attrs),
        lastAttrs: spaced(last?.derived.attrs ?? new Set()),
      }));
    },
    law: "AL2 last slot",
    over: "nodes",
  },
  {
    breaks: (node, _view, laws) => {
      const missing = laws.required(node.version, node.kind, node.governs).difference(node.attrs);

      return unless(missing.size === 0, () => ({ missing: spaced(missing) }));
    },
    law: "AL3 required",
    over: "nodes",
  },
  {
    breaks: (node, view) => {
      const declared = view.rows.namespaces.filter((row) => row.node === node.id);

      return unless(
        BigInt(declared.length) === node.namespaces &&
          declared.every((row, at) => row.at === BigInt(at)),
        () => ({
          declarations: String(declared.length),
          namespaces: String(node.namespaces),
        }),
      );
    },
    law: "Namespace family",
    over: "nodes",
  },
  {
    breaks: (node, view, { grammar }) => {
      const rule = grammar.lastWhere.find(
        ({ attribute, kind, parents, value, versions: holding }) =>
          kind === node.kind &&
          parents.includes(node.parentKind) &&
          holding.includes(node.version) &&
          Option.exists(
            valueOf(view, node.id, attribute),
            (lexical) => collapsed(lexical) === value,
          ),
      );
      const parent = view.byId.get(node.parent);

      return unless(
        rule === undefined ||
          (parent !== undefined && node.derived.elements === parent.elementChildren),
        () => ({
          attribute: rule?.attribute ?? "",
          elementChildren: String(parent?.elementChildren ?? 0n),
          elements: String(node.derived.elements),
          value: rule?.value ?? "",
        }),
      );
    },
    law: "default hotspot last slot",
    over: "members",
  },
  {
    breaks: (node, view, { elements, grammar, modeled }) =>
      unless(
        !modeled.has(kindKey(node.version, node.kind)) ||
          contentEnds(grammar.content, node.version, node.kind, node.childState),
        () => ({
          childState: String(node.childState),
          children: spaced(elementChildrenOf(view, node, elements).map(({ kind }) => kind)),
        }),
      ),
    law: "N7 Last",
    over: "nodes",
  },
  {
    breaks: (node, view, laws) => {
      const children = elementChildrenOf(view, node, laws.elements);
      const outside = laws.counted(node.version, node.kind).flatMap(({ max, min, position }) => {
        const count = children.filter(({ derived }) => derived.state === position).length;

        return count < min || count > max ? [`${String(position)}:${String(count)}`] : [];
      });

      return unless(outside.length === 0, () => ({ counts: outside.join(" ") }));
    },
    law: "N7 Counted",
    over: "nodes",
  },
  {
    breaks: (node, view, laws) =>
      Option.flatMap(
        laws.grammar.barredBy.lookup({ parent: node.kind, version: node.version }),
        ({ name, position }) => {
          const carries = Option.exists(
            positionOf(laws, node.version, node.kind, node.governs, name),
            (held) => node.attrs.has(held),
          );
          const barred = (view.childrenOf.get(node.id) ?? []).filter((child) =>
            Option.contains(admittedPosition(laws.grammar)(childKeyOf(child)), Number(position)),
          );

          return unless(!carries || barred.length === 0, () => ({
            barred: spaced(barred.map(({ kind }) => kind)),
          }));
        },
      ),
    law: "N7 barred by",
    over: "nodes",
  },
  {
    breaks: (node, view, { grammar }) => {
      if (!isForeignKind(node.kind)) {
        return Option.none();
      }

      const uri = view.foreignNamespaceOf.get(node.id);
      const parent = view.byId.get(node.parent);
      const against = parent === undefined ? Option.none() : namespaceOf(view, grammar, parent);

      return unless(
        uri !== undefined &&
          Option.exists(against, (held) => foreignKinds[classAgainst(uri, held)] === node.kind) &&
          (node.kind !== foreignKinds.absent || node.prefix === ""),
        () => ({
          parentNamespace: Option.getOrElse(against, () => ""),
          prefix: node.prefix,
          uri: uri ?? "",
        }),
      );
    },
    law: "Foreign element class",
    over: "members",
  },
  {
    breaks: (node, view, { grammar }) => {
      const owned = (view.attributesOf.get(node.id) ?? []).filter(
        ({ name }) => name === "no-namespace" || name === "own-namespace" || name === "foreign",
      );
      if (owned.length === 0) {
        return Option.none();
      }

      const against = Option.getOrElse(namespaceOf(view, grammar, node), () => "");
      const wrong = owned.filter((attribute) => {
        const row = view.openNameOf.get(attribute.id);

        return (
          row === undefined || attributeClasses[classAgainst(row.uri, against)] !== attribute.name
        );
      });

      return unless(wrong.length === 0, () => ({
        elementNamespace: against,
        wrong: wrong
          .map(({ at, id, name }) => `${String(at)}:${name}:${view.openNameOf.get(id)?.uri ?? ""}`)
          .join(" "),
      }));
    },
    law: "Foreign attribute class",
    over: "nodes",
  },
  {
    breaks: (node, view, laws) =>
      unless(
        !isForeignKind(node.kind) ||
          Option.isNone(governorOf(laws.grammar.attributes, node)) ||
          !(view.childrenOf.get(node.id) ?? []).some(({ kind }) => laws.elements.has(kind)),
        () => governsKeys(node.governs),
      ),
    law: "Foreign simple content",
    over: "nodes",
  },
  {
    breaks: (node, _view, laws) =>
      Option.flatMap(
        Option.fromNullishOr(attributeCounts.find(({ kind }) => kind === node.kind)),
        ({ max, min, names }) => {
          const held = names.filter((name) =>
            Option.exists(
              positionOf(laws, node.version, node.kind, node.governs, name),
              (position) => node.attrs.has(position),
            ),
          );

          return unless(held.length >= min && held.length <= max, () => ({
            held: spaced(held),
          }));
        },
      ),
    law: "AL5 attribute count",
    over: "members",
  },
  {
    // Reading 124: "This attribute is required when 'source' is used in 'picture'" (info
    // §5.135.3).
    breaks: (node, view) =>
      unless(
        node.kind !== "source" ||
          node.parentKind !== "picture" ||
          Option.isSome(valueOf(view, node.id, "srcset")),
        () => ({}),
      ),
    law: "Picture source srcset",
    over: "members",
  },
  {
    // Reading 124: a media element's source names its resource, §5.135.1's "This characteristic
    // must be present" read where HTML states it, in an audio or a video.
    breaks: (node, view) =>
      unless(
        node.kind !== "source" ||
          (node.parentKind !== "audio" && node.parentKind !== "video") ||
          Option.isSome(valueOf(view, node.id, "src")),
        () => ({}),
      ),
    law: "Media source src",
    over: "members",
  },
  {
    // Reading 125: a track in the subtitles state carries srclang (info §5.163.3), a track that
    // writes no kind being in it, HTML's missing value default.
    breaks: (node, view) => {
      if (node.kind !== "track") {
        return Option.none();
      }

      const written = valueOf(view, node.id, "kind");

      return unless(
        Option.getOrElse(written, () => "subtitles") !== "subtitles" ||
          Option.isSome(valueOf(view, node.id, "srclang")),
        () => ({ trackKind: Option.getOrElse(written, () => "") }),
      );
    },
    law: "Track srclang",
    over: "members",
  },
  {
    breaks: (node, view, { elements }) => {
      if (node.kind !== "m:apply") {
        return Option.none();
      }

      const [operator, ...rest] = elementChildrenOf(view, node, elements);

      return Option.flatMap(
        Option.fromNullishOr(operator === undefined ? undefined : mathArities.get(operator.kind)),
        ({ max, min, qualifiers }) => {
          const others = rest.filter(({ kind }) => !qualifiers.includes(kind));
          if (others.some(({ kind }) => mathQualifiers.has(kind))) {
            return Option.none();
          }

          return unless(others.length >= min && others.length <= max, () => ({
            arguments: String(others.length),
            operator: operator?.kind ?? "",
          }));
        },
      );
    },
    law: "MathML arity",
    over: "members",
  },
  {
    breaks: (node, view, { elements }) => {
      if (node.kind !== "m:apply") {
        return Option.none();
      }

      const [head, ...rest] = elementChildrenOf(view, node, elements);
      if (head === undefined || !mathHeadOperators.has(head.kind)) {
        return Option.none();
      }

      const stray = rest.find(
        ({ kind }) =>
          headQualifierKinds.has(kind) &&
          !mathHeadQualifiers.some(
            (listed) => listed.head === head.kind && listed.qualifier === kind,
          ),
      );

      return Option.map(Option.fromNullishOr(stray), ({ kind }) => ({
        head: head.kind,
        qualifier: kind,
      }));
    },
    law: "MathML head qualifier",
    over: "members",
  },
  {
    breaks: (node, view, { elements }) => {
      if (node.kind !== "m:cn") {
        return Option.none();
      }

      const type = Option.getOrElse(collapsedValueOf(view, node.id, "type"), () => cnDefaultType);
      const forms = cnForms.get(type);
      if (forms === undefined) {
        return Option.none();
      }

      const parts = cnPartsOf(view, node, elements);
      const base = Option.getOrElse(collapsedValueOf(view, node.id, "base"), () => "10");
      const keys = { base, type };
      if (parts.length !== forms.length) {
        return Option.some({
          ...keys,
          part: "",
          text: parts.map(({ text }) => text).join("|"),
        });
      }

      const wrong = parts.findIndex(
        ({ judged, text }, index) =>
          judged &&
          Option.exists(
            Option.map(
              cnPatternOf(
                forms[index] ?? "real",
                /^[+-]?[0-9]+$/u.test(base) ? Number(base) : Number.NaN,
              ),
              (pattern) => new RegExp(`^(?:${pattern})$`, patternFlags),
            ),
            (form) => !form.test(text),
          ),
      );

      return wrong === -1
        ? Option.none()
        : Option.some({ ...keys, part: String(wrong + 1), text: parts[wrong]?.text ?? "" });
    },
    law: "MathML cn form",
    over: "members",
  },
  {
    breaks: (node, view, { elements }) => {
      if (node.kind !== "m:maction") {
        return Option.none();
      }

      const children = elementChildrenOf(view, node, elements).length;
      const selection = Option.getOrElse(collapsedValueOf(view, node.id, "selection"), () => "1");
      const out = children === 0 || (/^[0-9]+$/u.test(selection) && Number(selection) > children);

      return out ? Option.some({ children: String(children), selection }) : Option.none();
    },
    law: "MathML maction selection",
    over: "members",
  },
  {
    breaks: (node, view, { elements }) =>
      node.kind === "m:maligngroup"
        ? Option.flatMap(placeOfGroup(view, node, elements), ({ cell, through }) =>
            Option.match(through, {
              onNone: () => Option.none(),
              onSome: (stopper) => Option.some({ cell: pathOf(view, cell.id), through: stopper }),
            }),
          )
        : Option.none(),
    law: "MathML align placement",
    over: "members",
  },
  {
    breaks: (node, view, { elements }) => {
      if (node.kind !== "m:mtd") {
        return Option.none();
      }

      const { groups, leaves } = contentOfCell(view, node, elements);
      const [first] = leaves;
      const judged = groups.some((group) =>
        Option.exists(placeOfGroup(view, group, elements), ({ through }) => Option.isNone(through)),
      );

      return judged && first !== undefined && first.kind !== "m:maligngroup"
        ? Option.some({ cell: pathOf(view, node.id), first: first.kind })
        : Option.none();
    },
    law: "MathML align first",
    over: "members",
  },
  {
    breaks: (node, view) =>
      node.kind === "ssml:lookup"
        ? Option.flatMap(valueOf(view, node.id, "ref"), (ref) => {
            const fragment = fragmentOf(view, node);

            return unless(
              fragment !== undefined &&
                (fragmentsOf(view).get(fragment)?.lexicons ?? new Set()).has(collapsed(ref)),
              () => ({ fragment: fragment ?? "", ref: collapsed(ref) }),
            );
          })
        : Option.none(),
    law: "SSML lexicon reference",
    over: "members",
  },
  {
    breaks: (node, view) => {
      if (node.kind !== "ssml:speak") {
        return Option.none();
      }

      const marks = fragmentsOf(view).get(node.id)?.marks ?? new Map<string, number>();
      const unmarked = ["startmark", "endmark"].flatMap((name) =>
        Option.toArray(valueOf(view, node.id, name))
          .map(collapsed)
          .filter((mark) => marks.get(mark) !== 1)
          .map((mark) => `${name}=${mark}:${String(marks.get(mark) ?? 0)}`),
      );

      return unless(unmarked.length === 0, () => ({ unmarked: unmarked.join(" ") }));
    },
    law: "SSML trim mark",
    over: "members",
  },
  {
    breaks: (node, view, { elements, grammar }) =>
      unless(
        !elements.has(node.kind) ||
          isForeignKind(node.kind) ||
          Option.match(node.governs, {
            onNone: () =>
              Option.isSome(
                grammar.xsi.anonymousType.lookup({ kind: node.kind, version: node.version }),
              ),
            onSome: (type) =>
              Option.isSome(
                grammar.xsi.xsiType.lookup({ kind: node.kind, type, version: node.version }),
              ),
          }),
        () => ({
          ...Option.match(grammar.xsi.declaredType(node.version, node.kind), {
            onNone: () => ({}),
            onSome: (declared) => ({ declared }),
          }),
          ...governsKeys(node.governs),
          value: Option.getOrElse(valueOf(view, node.id, "xsi:type"), () => ""),
        }),
      ),
    law: "XsiType derived",
    over: "members",
  },
  {
    breaks: (node, view, { grammar }) =>
      unless(
        !isForeignKind(node.kind) ||
          Option.isSome(node.governs) ||
          Option.isNone(
            grammar.content.strictlyHeld.lookup({
              child: node.kind,
              parent: node.parentKind,
              version: node.version,
            }),
          ) ||
          heldRoot(grammar, view, node),
        () => governsKeys(node.governs),
      ),
    law: "Strictly held",
    over: "members",
  },
  {
    breaks: (node, view, { grammar }) =>
      (isForeignKind(node.kind) ? node.governs : Option.none<string>()).pipe(
        Option.flatMap((governs) => {
          const parent = view.byId.get(node.parent);
          const against = parent === undefined ? Option.none() : namespaceOf(view, grammar, parent);
          const type = Option.match(expandedNameOf(governs), {
            onNone: () => "",
            onSome: ({ namespace }) => namespace,
          });
          const vocabulary = (namespace: string) =>
            grammar.kinds.elementName.rows.some((row) => row.namespace === namespace);

          return unless(
            type === xsNamespace ||
              Option.exists(
                against,
                (namespace) =>
                  !vocabulary(namespace) ||
                  typeAvailable(namespaceNameOf(namespace), namespaceNameOf(type)),
              ),
            () => ({
              governs,
              parentNamespace: Option.getOrElse(against, () => ""),
            }),
          );
        }),
      ),
    law: "XsiType available",
    over: "members",
  },
];

/**
 * Read a lexical form as its typed value, which a bound judges and a float map key is compared by:
 * an `xs:double` or `xs:float` by XML Schema's rules, `INF`, `-INF` and `NaN` included, after the
 * `collapse` class those primitives read their forms under, a decimal by JavaScript's `Number`,
 * which rounds it once to the nearest double (reading 144).
 *
 * @param form - The lexical form, which the domain's pattern has matched.
 * @returns The value; `NaN` for `NaN`, which no bound holds.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#double | XML Schema Part 2, 3.2.5 double}
 */
const numberOf = (form: string): number => {
  const value = collapsed(form);
  if (value === "INF" || value === "+INF") {
    return Number.POSITIVE_INFINITY;
  }

  if (value === "-INF") {
    return Number.NEGATIVE_INFINITY;
  }

  return value === "NaN" ? Number.NaN : Number(value);
};

/**
 * `xs:decimal`'s lexical space, read on a collapsed form: a sign, then integer digits with an
 * optional point and fraction digits, or a point and fraction digits, so a digit stands on one
 * side of the point at least (XML Schema 1.1 Part 2 §3.3.3.1, the `decimalLexicalRep` production,
 * the lexical space pantry's own value domain admits). `+`, `.`, `-.` and the empty text are no
 * decimal, and have no value to order.
 *
 * @see {@link https://www.w3.org/TR/xmlschema11-2/#decimal | XML Schema 1.1 Part 2, 3.3.3 decimal}
 */
const decimalForm = /^(?<sign>[+-]?)(?=\.?[0-9])(?<whole>[0-9]*)(?:\.(?<fraction>[0-9]*))?$/u;

/**
 * Order two `xs:decimal` lexical forms exactly, by the values XML Schema 1.1's decimalLexicalMap
 * gives them (Part 2 §3.3.3.1 and §E.1): each form's digits, signed, over ten to the count of its
 * fraction digits, of any digits.
 *
 * @param a - The first form.
 * @param b - The second form.
 * @returns Whether the first's value is below the second's; false when either is no decimal.
 */
const decimalBelow = (a: string, b: string): boolean => {
  const [first, second] = [decimalForm.exec(collapsed(a)), decimalForm.exec(collapsed(b))];
  if (first?.groups === undefined || second?.groups === undefined) {
    return false;
  }

  const places = Math.max(
    first.groups["fraction"]?.length ?? 0,
    second.groups["fraction"]?.length ?? 0,
  );
  const scaled = ({ fraction = "", sign = "", whole = "" }: Record<string, string | undefined>) =>
    (sign === "-" ? -1n : 1n) * BigInt(`0${whole}${fraction.padEnd(places, "0")}`);

  return scaled(first.groups) < scaled(second.groups);
};

/**
 * Find the bound a lexical form's typed value breaks: a double's or a float's lower bound, which no
 * pattern states (`#pantry/grammar/domains.ts`). The oracle reads the value with its own
 * `numberOf`, apart from the import's reader, so `-0` and `-1e-400` are zero and meet
 * `minInclusive 0`, `1e-400` is zero and fails `minExclusive 0`, and `NaN` fails every bound.
 *
 * @param domain - The domain, whose pattern the form matches.
 * @param form - The lexical form as written.
 * @returns The bound the value lies outside, none where it meets it or the domain has none.
 */
export const boundBroken = (domain: ValueDomain, form: string): Option.Option<DoubleBound> =>
  domain.bound.pipe(
    Option.filter(({ facet, value: bound }) => {
      const value = numberOf(form);
      switch (facet) {
        case "minExclusive": {
          return !(value > bound);
        }
        case "minInclusive": {
          return !(value >= bound);
        }
        default: {
          return facet satisfies never;
        }
      }
    }),
  );

/**
 * Decide whether a lexical form lies in its value domain: it matches the domain's pattern as
 * written, and its typed value meets the domain's bound.
 *
 * @param compiled - The domain and its compiled pattern.
 * @param compiled.domain - The domain.
 * @param compiled.regex - Its pattern, compiled with `patternFlags`.
 * @param form - The lexical form as written.
 * @returns Whether the form is in the domain.
 */
const inDomain = (
  compiled: { readonly domain: ValueDomain; readonly regex: RegExp },
  form: string,
): boolean => compiled.regex.test(form) && Option.isNone(boundBroken(compiled.domain, form));

/**
 * Whether a domain's identity type is an identifier a document declares: `ID`.
 *
 * @param domain - The domain.
 * @returns Whether its values are a document's ids.
 */
const isId = (domain: ValueDomain): boolean => Option.contains(domain.identity, "ID");

/**
 * Whether a domain's identity type refers to a document's ids: one `IDREF`, or a list of them
 * (`IDREFS`).
 *
 * @param domain - The domain.
 * @returns Whether its tokens name a document's ids.
 */
const isIdref = (domain: ValueDomain): boolean =>
  Option.exists(domain.identity, (type) => type === "IDREF" || type === "IDREFS");

/**
 * Read an attribute's admission cell: its domain, use and position under its owner's (version,
 * kind, governing type), its governor's `GovernedAttribute` cell where one governs the owner, else
 * its kind's `AttributeAdmission` cell.
 *
 * @param laws - The grammar's tables.
 * @param attribute - The attribute row.
 * @returns The cell, none for a name its owner does not admit.
 */
const admissionOf = (laws: Laws, attribute: FoldedAttribute<Composed>) =>
  governedAdmission(laws.grammar.attributes, {
    governs: attribute.governs,
    kind: attribute.kind,
    name: attribute.name,
    version: attribute.version,
  });

/**
 * Read an attribute's value domain: the domain of its `AttributeAdmission` cell, compiled.
 *
 * @param laws - The grammar's tables.
 * @param attribute - The attribute row.
 * @returns The domain and its pattern, none for a name its kind does not admit.
 */
const compiledOf = (laws: Laws, attribute: FoldedAttribute<Composed>) =>
  Option.flatMap(admissionOf(laws, attribute), ({ domain }) =>
    Option.fromNullishOr(laws.domains.get(domain)),
  );

/**
 * Each declared attribute's type, by `version kind name`: its definition and its whitespace class.
 */
const declaredTypes: ReadonlyMap<
  string,
  { readonly domain: Domain; readonly whiteSpace: WhiteSpace }
> = new Map(
  attributeDeclarations.flatMap(({ domain, kind, name, type, versions }) =>
    versions.map(
      (version) => [`${version} ${kind} ${name}`, { domain, whiteSpace: type.whiteSpace }] as const,
    ),
  ),
);

/**
 * Each union member's pattern, compiled once, by the member: what decides the member a union's
 * value is validated against.
 */
const memberPatterns = new Map<Domain, Option.Option<RegExp>>();

/**
 * Decide whether a union member's lexical space holds a form, the form read under the member's own
 * whitespace class.
 *
 * @param member - The member.
 * @param form - The form as written.
 * @returns Whether it holds it; false for a member whose definition does not compile.
 */
const memberHolds = (member: Domain, form: string): boolean => {
  const known = memberPatterns.get(member);
  const pattern =
    known ??
    Option.map(
      Result.getSuccess(compile(member, "xsd")),
      ({ pattern: text }) => new RegExp(text, patternFlags),
    );
  memberPatterns.set(member, pattern);

  return Option.exists(pattern, (regex) => regex.test(form));
};

/**
 * Read the whitespace class a value of a definition is normalized under: an atomic type's own, a
 * list's `collapse`, and a union's the class of its first member whose lexical space holds the
 * form, the member it is validated against (XSD 1.1 Part 2, §4.3.6: a union's normalization "is
 * controlled by the value of whiteSpace on that one of the memberTypes against which the union is
 * successfully validated").
 *
 * @param domain - The definition.
 * @param form - The form as written, one the definition holds.
 * @returns The class.
 */
const whiteSpaceOf = (domain: Domain, form: string): OracleWhiteSpace => {
  if (domain._tag === "atomic") {
    const stated = domain.facets.find(({ facet }) => facet === "whiteSpace")?.value;

    return stated === "preserve" || stated === "replace" ? stated : "collapse";
  }

  if (domain._tag === "list") {
    return "collapse";
  }

  return Option.match(
    Option.fromUndefinedOr(domain.members.find((member) => memberHolds(member, form))),
    { onNone: () => "preserve", onSome: (member) => whiteSpaceOf(member, form) },
  );
};

/**
 * Read the whitespace class an attribute's form is normalized under: its declared type's, a union's
 * resolved against the form ({@link whiteSpaceOf}), and `preserve` for a name no declaration
 * states.
 *
 * @param attribute - The attribute row.
 * @returns The class.
 */
const declaredWhiteSpaceOf = (attribute: FoldedAttribute<Composed>): OracleWhiteSpace => {
  const declared = declaredTypes.get(`${attribute.version} ${attribute.kind} ${attribute.name}`);
  if (declared === undefined) {
    return "preserve";
  }

  return declared.whiteSpace === "union"
    ? whiteSpaceOf(declared.domain, attribute.lexical)
    : declared.whiteSpace;
};

/**
 * Read an attribute as its type reads it, the one read every law past AL1 makes of a typed
 * attribute (spec reading 1, XSD 1.1 Part 2, §4.3.6). A form inside its value domain, as AL1 judges
 * it ({@link inDomain}), is its value after its type's whitespace class: a `preserve` type's as
 * written, a `replace` type's with each tab, line feed and carriage return a space, a `collapse`
 * type's collapsed. A form outside its domain, or a name its owner does not admit, has none, so AL1
 * refuses it alone and no law reads a value the document never wrote.
 *
 * @param laws - The grammar's tables.
 * @returns The reading: each attribute's value, or none.
 */
export const typedReadingOf =
  (laws: Laws): TypedReading =>
  (attribute) =>
    Option.flatMap(compiledOf(laws, attribute), (held) =>
      inDomain(held, attribute.lexical)
        ? Option.some(oracleValueOf(attribute.lexical, declaredWhiteSpaceOf(attribute)))
        : Option.none(),
    );

/**
 * Decide whether an attribute is a context declaration's `identifier`, which spec reading 74 counts
 * among its document's IDs: the information model makes it a UniqueIdentifier (§5.34.1), "unique
 * within the scope of the instance" (§7.43), and outranks the XSD, which types it an
 * `IdentifierDType`, an `xs:NCName` no ID table holds.
 *
 * @param attribute - The attribute row.
 * @returns Whether its kind is `qti-context-declaration` and its name `identifier`.
 */
const isContextIdentifier = (attribute: FoldedAttribute<Composed>): boolean =>
  attribute.kind === "qti-context-declaration" && attribute.name === "identifier";

/**
 * Read the domain an element's text is checked in: its governor's text domain, where that domain is
 * not universal (its pattern `xs:anySimpleType`'s and no facet stated), as `holdsCheckedText` of
 * `#pantry/qti/node.ts` reads it. A universal domain states nothing, and the string-value fold
 * steps over its element's children.
 *
 * @param laws - The grammar's tables.
 * @param node - The node.
 * @returns The compiled domain, or none for a node whose text is unchecked.
 */
const checkedTextOf = (laws: Laws, node: FoldedNode<Composed>) => {
  const universal = laws.domains.get(openDomain.handle)?.domain.pattern;

  return textDomainOf(laws.grammar.attributes, {
    governs: node.governs,
    kind: node.kind,
    version: node.version,
  }).pipe(
    Option.flatMap((domain) => Option.fromNullishOr(laws.domains.get(domain))),
    Option.filter(({ domain }) => domain.pattern !== universal || Option.isSome(domain.bound)),
  );
};

/**
 * Decide whether an element's text is read in an empty domain (`emptyDomains` of the attribute
 * grammar: `xs:NOTATION`'s, whose value space is the notations a schema declares, and no pinned XSD
 * declares one), which no value is in, so TextDomain refuses it whatever its text (C47).
 *
 * @param laws - The grammar's tables.
 * @param node - The node.
 * @returns Whether its governor's text domain is empty.
 */
const emptyTextOf = (laws: Laws, node: FoldedNode<Composed>): boolean =>
  Option.exists(
    textDomainOf(laws.grammar.attributes, {
      governs: node.governs,
      kind: node.kind,
      version: node.version,
    }),
    (domain) => laws.grammar.attributes.emptyDomains.includes(domain),
  );

/**
 * Collect a document's ids: the collapsed value of every attribute whose domain is an `ID`, or that
 * is a context declaration's `identifier` ({@link isContextIdentifier}), and of every element's
 * text whose governor reads it in an `ID` domain (C50), each that its domain holds, with the node
 * that carries it and the element its ID/IDREF binding names (reading 101: an attribute's element,
 * a text's parent), attributes first, each in document order. A value outside its domain is no ID
 * value, so it takes no part in the key (XML Schema 1.0 Part 1, 3.3.4, cvc-id.2): the value domain
 * law refuses it, and two such values never collide.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @returns The ids, their nodes and their owners, an id held twice listed twice.
 */
const idsOf = (
  view: View,
  laws: Laws,
): readonly { readonly id: string; readonly node: NodeId; readonly owner: NodeId }[] => [
  ...view.rows.attributes.flatMap((attribute) =>
    Option.exists(
      compiledOf(laws, attribute),
      (held) =>
        (isId(held.domain) || isContextIdentifier(attribute)) && inDomain(held, attribute.lexical),
    )
      ? [{ id: collapsed(attribute.lexical), node: attribute.node, owner: attribute.node }]
      : [],
  ),
  ...view.rows.nodes.flatMap((node) =>
    Option.exists(
      checkedTextOf(laws, node),
      (held) => isId(held.domain) && inDomain(held, node.stringValue),
    )
      ? [{ id: collapsed(node.stringValue), node: node.id, owner: node.parent }]
      : [],
  ),
];

/**
 * Read the fragment a `src` names within its own document: the characters after a leading `#`,
 * one or more of them (MathML 3 §4.2.7). A `src` that is no fragment is a file reference (reading
 * 103), which no law of this document reads.
 *
 * @param src - A `src`, collapsed.
 * @returns The characters after the `#`, none for any other `src`.
 */
const fragmentOfSrc = (src: string): Option.Option<string> =>
  Option.liftPredicate(src.slice(1), (rest) => src.startsWith("#") && rest !== "");

/**
 * Read the same-document fragment an `m:share` names.
 *
 * @param view - The document.
 * @param node - The element.
 * @returns The id its `src` names, none for any other element, for a `share` with no `src`, and
 *   for one whose `src` is a file reference.
 */
const shareFragmentOf = (view: View, node: FoldedNode<Composed>): Option.Option<string> =>
  node.kind === "m:share"
    ? Option.flatMap(collapsedValueOf(view, node.id, "src"), fragmentOfSrc)
    : Option.none();

/**
 * The `m:share` elements that dominate themselves, by document.
 */
const dominatingSharesCache = new WeakMap<View, ReadonlySet<NodeId>>();

/**
 * Find the `m:share` elements on a cycle of domination: an element dominates its children and, when
 * it is a `share`, the elements that carry the id its fragment names (MathML 3 §4.2.7, "An element
 * may not dominate itself"). The ids are the ones an IDREF token resolves against ({@link idsOf}).
 * Every cycle runs through a `share`, so each is found at one.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @returns The ids of the shares from which their own element can be reached.
 */
const dominatingSharesOf = (view: View, laws: Laws): ReadonlySet<NodeId> => {
  const held = dominatingSharesCache.get(view);
  if (held !== undefined) {
    return held;
  }

  const owners = Map.groupBy(idsOf(view, laws), ({ id }) => id);
  const targetsOf = (node: FoldedNode<Composed>): readonly NodeId[] =>
    Option.match(shareFragmentOf(view, node), {
      onNone: () => [],
      onSome: (fragment) => (owners.get(fragment) ?? []).map(({ owner }) => owner),
    });
  const dominates = (share: FoldedNode<Composed>): boolean => {
    const seen = new Set<NodeId>();
    const pending = [...targetsOf(share)];

    for (let id = pending.pop(); id !== undefined; id = pending.pop()) {
      if (id === share.id) {
        return true;
      }

      if (!seen.has(id)) {
        seen.add(id);

        const at = view.byId.get(id);
        pending.push(
          ...(view.childrenOf.get(id) ?? []).map((child) => child.id),
          ...(at === undefined ? [] : targetsOf(at)),
        );
      }
    }

    return false;
  };
  const found = new Set(
    view.members
      .filter((node) => Option.isSome(shareFragmentOf(view, node)) && dominates(node))
      .map(({ id }) => id),
  );
  dominatingSharesCache.set(view, found);

  return found;
};

/**
 * Decide whether an attribute's copy of its owner is its owner's fields (AL1).
 *
 * @param attribute - The attribute row.
 * @param owner - Its owner's node row, none when no row holds its id.
 * @returns Whether its kind, governing type, version and document are its owner's.
 */
const ownerCopied = (
  attribute: FoldedAttribute<Composed>,
  owner: FoldedNode<Composed> | undefined,
): boolean =>
  owner !== undefined &&
  owner.kind === attribute.kind &&
  Equal.equals(owner.governs, attribute.governs) &&
  owner.version === attribute.version &&
  owner.document === attribute.document;

/**
 * Decide whether an attribute's fold is its predecessor's with its own position (AL2): an open
 * class's position is one for many names, which the fold steps over no position of (the W5
 * amendment's C9), so its `attrs` is its `attrsWas`.
 *
 * @param attribute - The attribute row.
 * @param slot - Its slot among its owner's attributes.
 * @param before - Its predecessor, none for the first.
 * @param position - Its position, empty for a name its kind does not admit.
 * @returns Whether its slot, `attrsWas` and `attrs` are as the fold derives them.
 */
const attributeFolded = (
  attribute: FoldedAttribute<Composed>,
  slot: number,
  before: FoldedAttribute<Composed> | undefined,
  position: Positions,
): boolean =>
  attribute.at === BigInt(slot) &&
  sameSet(attribute.attrsWas, before?.derived.attrs ?? new Set<number>()) &&
  sameSet(
    attribute.derived.attrs,
    isOpenClass(attribute.name) ? attribute.attrsWas : attribute.attrsWas.union(position),
  );

/**
 * The prefixes no attribute in a namespace other than the XML namespace is written with: none,
 * which leaves a name in no namespace, `xml` and `xmlns` (Namespaces in XML 1.0, §3 and §6.2).
 */
const unboundPrefixes: ReadonlySet<string> = new Set(["", "xml", "xmlns"]);

/**
 * Decide law "Attribute prefix": an attribute's prefix agrees with the namespace its name is in. A
 * name in no namespace, a closed one whose handle spells no prefix or one of the `data-*` and
 * `no-namespace` classes, has none; an `xml:` name has `xml`; and a name in any other namespace, an
 * `xsi:` or `xlink:` handle's or one of the `own-namespace` and `foreign` classes, has a prefix
 * that is neither none, `xml` nor `xmlns`.
 *
 * @param attribute - The attribute's name handle and prefix.
 * @param attribute.name - Its `AttributeName` handle, an open class's included.
 * @param attribute.prefix - The prefix its name is written with.
 * @returns Whether the prefix agrees.
 */
const prefixAgrees = ({ name, prefix }: { readonly name: string; readonly prefix: string }) => {
  const spelled = isOpenClass(name) ? "" : handlePrefixOf(name);
  if (name === "own-namespace" || name === "foreign" || (spelled !== "" && spelled !== "xml")) {
    return !unboundPrefixes.has(prefix);
  }

  return prefix === spelled;
};

/**
 * Read the ids an attribute names: an IDREF or IDREFS attribute's tokens, and the fragment of an
 * `m:share`'s `src` (MathML 3 §4.2.7), which names an id of its document as a token does.
 *
 * @param attribute - The attribute row.
 * @param compiled - Its compiled value domain, none for an attribute with no cell.
 * @returns The ids it names, in order.
 */
const referencesOf = (
  attribute: FoldedAttribute<Composed>,
  compiled: Option.Option<{ readonly domain: ValueDomain }>,
): readonly string[] => [
  ...(Option.exists(compiled, (held) => isIdref(held.domain)) ? tokensOf(attribute.lexical) : []),
  ...(attribute.kind === "m:share" && attribute.name === "src"
    ? Option.toArray(fragmentOfSrc(collapsed(attribute.lexical)))
    : []),
];

/**
 * Evaluate the laws of §1.5 over a document's attribute rows: AL1's admission cell and owner copy,
 * AL2's masked distinctness, N5's first slot and AL2's fold, each value domain, and each IDREF
 * token's target.
 *
 * An attribute's domain and position are its `AttributeAdmission` cell's, under its owner's
 * (version, kind), and its `attrs` is `attrsWas | bit(x)`, `x` the position. AL2's distinctness is
 * `(attrsWas & bit(x) & ~open) = 0` (fin.md §16): a name already held is refused unless it is an
 * open class, whose many names share one position. An attribute with no cell has no domain and no
 * position, so AL1 refuses it and nothing derives from it.
 *
 * An element's breaches are listed law by law, in the order an attribute's laws are evaluated, and
 * each law's in attribute order, so an element's first breach, whose rule {@link verdictOf} names,
 * is a function of its attributes as a set, the same in whatever order the element writes them
 * (spec reading 137): one attribute's `value domain` comes before another's `Idref target` on one
 * element, whichever of the two is written first.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @param assembled - The ids of the document's assembly beyond its own, which its IDREFs may name
 *   (spec reading 117).
 * @returns The breaches, element by element, each element's law by law.
 */
const attributeBreaches = (
  view: View,
  laws: Laws,
  assembled: ReadonlySet<string>,
): readonly Breach[] => {
  const ids = new Set([...idsOf(view, laws).map(({ id }) => id), ...assembled]);

  return [...view.attributesOf].flatMap(([owner, owned]) => {
    const node = view.byId.get(owner);
    const at = pathOf(view, owner);

    const found = owned.map((attribute, slot): readonly (readonly Breach[])[] => {
      const breach = (law: LawName, keys: Keys = {}): Breach => ({
        document: view.path,
        keys: {
          at: String(attribute.at),
          ...governsKeys(attribute.governs),
          kind: attribute.kind,
          name: attribute.name,
          node: at,
          version: attribute.version,
          ...keys,
        },
        law,
      });
      const { lexical } = attribute;
      const admitted = admissionOf(laws, attribute);
      const compiled = compiledOf(laws, attribute);
      const before = owned[slot - 1];
      const x: Positions = new Set(Option.toArray(admitted).map(({ position }) => position));
      const repeated = attribute.attrsWas
        .intersection(x)
        .difference(laws.open(attribute.version, attribute.kind, attribute.governs));

      return [
        Option.isSome(admitted) ? [] : [breach("AL1 admission")],
        prefixAgrees(attribute) ? [] : [breach("Attribute prefix", { prefix: attribute.prefix })],
        ownerCopied(attribute, node)
          ? []
          : [
              breach("AL1 owner", {
                ownerDocument: node?.document ?? "",
                ownerKind: node?.kind ?? "",
                ownerVersion: node?.version ?? "",
              }),
            ],
        repeated.size === 0
          ? []
          : [breach("AL2 distinct", { attrsWas: spaced(attribute.attrsWas), position: spaced(x) })],
        attribute.at > 0n || attribute.attrsWas.size === 0
          ? []
          : [breach("N5 first slot", { attrsWas: spaced(attribute.attrsWas) })],
        attributeFolded(attribute, slot, before, x) && Option.isSome(admitted)
          ? []
          : [
              breach("AL2 fold", {
                attrs: spaced(attribute.derived.attrs),
                attrsWas: spaced(attribute.attrsWas),
                predecessorAttrs: spaced(before?.derived.attrs ?? new Set()),
              }),
            ],
        Option.exists(compiled, (held) => !held.regex.test(lexical))
          ? [breach("value domain", { lexical })]
          : [],
        Option.match(
          Option.flatMap(compiled.pipe(Option.filter((held) => held.regex.test(lexical))), (held) =>
            boundBroken(held.domain, lexical),
          ),
          {
            onNone: () => [],
            onSome: ({ facet, value }) => [
              breach("Double bound", { bound: String(value), facet, lexical }),
            ],
          },
        ),
        referencesOf(attribute, compiled)
          .filter((token) => !ids.has(token))
          .map((token) => breach("Idref target", { token })),
      ];
    });

    return (found[0] ?? []).flatMap((_, law) => found.flatMap((held) => held[law] ?? []));
  });
};

/**
 * Whether a text is past the most a key text holds (`keyText`): a value the schema copies into a
 * key, a containment or a family's hidden columns refused by its type before any law of the
 * specification reads it.
 *
 * @param value - The text.
 * @returns Whether its UTF-8 bytes are past `keyTextBytes`.
 */
const overKeyText = (value: string): boolean => utf8Length(value) > keyTextBytes;

/**
 * Read the characters a node row holds, `Node.chars`: a text or whitespace node's, an entity
 * reference's `&name;`, as its `E1_derived` check states them, and empty for every other node.
 *
 * @param view - The node's document.
 * @param node - The node.
 * @returns Its characters.
 */
const charsOf = (view: View, node: FoldedNode<Composed>): string => {
  if (node.kind === "text" || node.kind === "ws") {
    return view.textOf.get(node.id) ?? "";
  }

  const entity = node.kind === "entityRef" ? view.entityOf.get(node.id) : undefined;

  return entity === undefined ? "" : `&${entity};`;
};

/**
 * The package's manifest's path: its one `imsmanifest.xml`, at its root (IMS Content Packaging
 * 1.2).
 */
const manifestEntry = "imsmanifest.xml";

/**
 * A document's type, as its nodes and attributes copy it (`Node.documentType`): `manifest` for the
 * package's manifest, its one `imsmanifest.xml`, which is no resource's document (readings 146 and
 * 176), and for every other document the type of the resource that lists it, the type `RootOfType`
 * pairs with its root's kind, which is the type a resource lists it under wherever `RootOfType`
 * holds: an external record file's root, a `lom:lom`, gives `resourcemetadata/xml`. A root no type
 * pairs gives the empty text, which is no type.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @returns Its type, as the laws compare it.
 */
const documentTypeOf = (view: View, laws: Laws): string => {
  if (view.path === manifestEntry) {
    return "manifest";
  }

  const roots = view.rows.nodes.filter(
    ({ id, parent }) => parent === view.self && id !== view.self,
  );

  return (
    laws.grammar.package.rootOfType.rows.find(({ root }) => roots.some(({ kind }) => kind === root))
      ?.type ?? ""
  );
};

/**
 * Read a node's governor, `Node.governor`: what its attributes and text are read under, the
 * grammar's governor of its (version, kind, governing type) (`governorOf`), and its kind's own
 * where the grammar gives none (`KindGovernor`): no named type governs it, or its declared type,
 * a complex type a foreign element is not checked against, or a type its declared type does not
 * derive.
 *
 * @param laws - The grammar's tables.
 * @param node - The node's version, kind and governing type.
 * @returns The governor's `Governor` handle.
 */
const nodeGovernorOf = (
  laws: Laws,
  node: Pick<FoldedNode<Composed>, "governs" | "kind" | "version">,
): string =>
  Option.match(governorOf(laws.grammar.attributes, node), {
    onNone: () => node.kind,
    onSome: (governor) => governor,
  });

/**
 * Read the fields of a node row a key copy's selection or check reads
 * (`#pantry/test/key-copies.ts` `nodeFields`), its parent's from the parent's row: a root's parent
 * is the document node, which is governed by its own kind and is its own parent's kind.
 *
 * @param view - The node's document.
 * @param node - The node.
 * @param documentType - The document's type ({@link documentTypeOf}).
 * @param laws - The grammar's tables.
 * @returns Its fields.
 */
const nodeFieldsOf = (
  view: View,
  node: FoldedNode<Composed>,
  documentType: string,
  laws: Laws,
): DocumentRows["Node"] => {
  const parent = view.byId.get(node.parent);

  return {
    chars: charsOf(view, node),
    documentType,
    governor: nodeGovernorOf(laws, node),
    kind: node.kind,
    parentGovernor: parent === undefined ? "document" : nodeGovernorOf(laws, parent),
    parentKind: node.parentKind,
    parentParentKind: parent?.parentKind ?? "document",
    start: node.start,
    stringValue: node.stringValue,
    version: node.version,
  };
};

/**
 * Collect the texts one copy of the schema holds of a document (`#pantry/test/key-copies.ts`
 * `keyCopies`): each attribute or node its selection or check holds, by the field it reads, and for
 * a fold each owner of a member its step selects, by the owner's end.
 *
 * @param copy - The copy.
 * @param rows - The document's attributes and nodes, each with the fields a copy reads.
 * @param rows.attributes - Each attribute's node and fields.
 * @param rows.children - Each node's children's fields, by the node's id.
 * @param rows.nodes - Each node's id and fields.
 * @returns The texts, each with its node, in document order.
 */
const copiedTexts = (
  copy: KeyCopy,
  rows: {
    readonly attributes: readonly {
      readonly fields: DocumentRows["Attribute"];
      readonly node: NodeId;
    }[];
    readonly children: ReadonlyMap<NodeId, readonly DocumentRows["Node"][]>;
    readonly nodes: readonly { readonly fields: DocumentRows["Node"]; readonly node: NodeId }[];
  },
): readonly { readonly node: NodeId; readonly value: string }[] => {
  if (copy.source === "Attribute") {
    return rows.attributes
      .filter(({ fields }) => copy.holds(fields))
      .map(({ fields, node }) => ({ node, value: datumText(fields[copy.reads]) }));
  }

  return rows.nodes
    .filter(({ fields, node }) =>
      copy.by === "fold"
        ? (rows.children.get(node) ?? []).some((child) => copy.holds(child))
        : copy.holds(fields),
    )
    .map(({ fields, node }) => ({ node, value: datumText(fields[copy.reads]) }));
};

/**
 * Collect the texts of a document the schema holds in a key, each with the field that holds it, its
 * node, and the one bound of its kind (`#pantry/qti/limits.ts`): as key texts (`keyText`), every
 * text a copy of the schema writes into a `keyText` field (`#pantry/test/key-copies.ts`
 * `keyCopies`, read from the schema's statements: an ID's, an IDREF's, a manifest's, a
 * declaration's and every other attribute a containment or a check copies, and the string value of
 * each element whose text is checked or copied), and the document's path (`Document.path`); as
 * namespace names (`namespaceText`), an open attribute's namespace and its element's
 * (`OpenAttributeName.uri`, `OpenAttributeName.elementNamespace`) and a foreign element's
 * (`OpenElementName.namespace`); and as a local name, an open attribute's
 * (`OpenAttributeName.local`).
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @returns The texts, in the copies' order and document order within each.
 */
const keyTexts = (
  view: View,
  laws: Laws,
): readonly {
  readonly bound: number;
  readonly field: string;
  readonly node?: NodeId;
  readonly value: string;
}[] => {
  const nodeOfAttribute = new Map(view.rows.attributes.map(({ id, node }) => [id, node]));
  const documentType = documentTypeOf(view, laws);
  const nodes = view.rows.nodes.map((node) => ({
    fields: nodeFieldsOf(view, node, documentType, laws),
    node: node.id,
  }));
  const fieldsOf = new Map(nodes.map(({ fields, node }) => [node, fields]));
  const rows = {
    attributes: view.rows.attributes.map((attribute) => ({
      fields: {
        documentType,
        governor: nodeGovernorOf(laws, attribute),
        kind: attribute.kind,
        lexical: attribute.lexical,
        name: attribute.name,
        version: attribute.version,
      },
      node: attribute.node,
    })),
    children: new Map(
      [...view.childrenOf].map(([parent, children]) => [
        parent,
        children.flatMap(({ id }) => Option.toArray(Option.fromNullishOr(fieldsOf.get(id)))),
      ]),
    ),
    nodes,
  };

  return [
    { bound: keyTextBytes, field: "Document.path", value: view.path },
    ...keyCopies.flatMap((copy) =>
      copiedTexts(copy, rows).map(({ node, value }) => ({
        bound: keyTextBytes,
        field: copy.field,
        node,
        value,
      })),
    ),
    ...view.rows.attributes.flatMap((attribute) =>
      isOpenClass(attribute.name)
        ? Option.toArray(
            Option.flatMap(Option.fromNullishOr(view.byId.get(attribute.node)), (node) =>
              namespaceOf(view, laws.grammar, node),
            ),
          ).map((value) => ({
            bound: namespaceBytes,
            field: "OpenAttributeName.elementNamespace",
            node: attribute.node,
            value,
          }))
        : [],
    ),
    ...view.rows.openNames.flatMap(({ attribute, local, uri }) => {
      const node = nodeOfAttribute.get(attribute);

      return node === undefined
        ? []
        : [
            { bound: namespaceBytes, field: "OpenAttributeName.uri", node, value: uri },
            { bound: localNameBytes, field: "OpenAttributeName.local", node, value: local },
          ];
    }),
    ...view.rows.openElementNames.map(({ namespace, node }) => ({
      bound: namespaceBytes,
      field: "OpenElementName.namespace",
      node,
      value: namespace,
    })),
  ];
};

/**
 * Evaluate the laws over a document as a whole: one document node, the children family's key,
 * each character-data arm both ways, the `Document` row, the owners of the attribute, entity
 * reference, open name and foreign name rows, the open names' key, and `TextDomain` over each
 * text.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @param assembled - The ids of the document's assembly beyond its own, which its IDREF texts may
 *   name (spec reading 117).
 * @returns The breaches.
 */
const wholeBreaches = (
  view: View,
  laws: Laws,
  assembled: ReadonlySet<string>,
): readonly Breach[] => {
  const { rows } = view;
  const breach = (law: LawName, keys: Keys = {}): Breach => ({
    document: view.path,
    keys: { node: "", ...keys },
    law,
  });
  const arms = [
    { law: "text arm", nodes: "text", rows: rows.texts },
    { law: "ws arm", nodes: "ws", rows: rows.whitespace },
    { law: "comment arm", nodes: "comment", rows: rows.comments },
    { law: "pi arm", nodes: "pi", rows: rows.pis },
    { law: "entityRef arm", nodes: "entityRef", rows: rows.entityRefs },
    { law: "doctype arm", nodes: "doctype", rows: rows.doctypes },
  ] as const;
  const ownerOf = new Map(rows.attributes.map(({ id, node }) => [id, node] as const));
  const openKeys = new Set(
    rows.attributes.filter(({ name }) => isOpenClass(name)).map(({ id }) => id),
  );
  const attributeById = new Map(rows.attributes.map((attribute) => [attribute.id, attribute]));
  const openNameKeys = rows.openNames.map(({ attribute }) => attribute);
  const openNameIds = rows.openNames.map(
    ({ attribute, local, uri }) => `${ownerOf.get(attribute) ?? attribute} {${uri}}${local}`,
  );
  const foreign = new Set(rows.nodes.filter(({ kind }) => isForeignKind(kind)).map(({ id }) => id));
  const documentNodes = rows.nodes.filter(({ start }) => start === 0n).length;
  const ids = new Set([...idsOf(view, laws).map(({ id }) => id), ...assembled]);

  return [
    ...(documentNodes === 1
      ? []
      : [breach("N1 one document node", { documentNodes: String(documentNodes) })]),
    ...(view.bySlot.size === view.members.length
      ? []
      : [
          breach("N2 key", {
            members: String(view.members.length),
            slots: String(view.bySlot.size),
          }),
        ]),
    ...arms.flatMap(({ law, nodes: kind, rows: armRows }) => {
      const nodes = new Set(rows.nodes.filter((node) => node.kind === kind).map(({ id }) => id));
      const held = armRows.map(({ node }) => node);

      return sameSet(nodes, new Set(held)) && held.length === nodes.size
        ? []
        : [breach(law, { nodes: String(nodes.size), rows: String(held.length) })];
    }),
    // The Document row's node is the document node, the row at start 0. The view's own `self` is
    // read from the Document row, so the law compares the row with the tree, never with itself.
    ...(rows.nodes.some(({ id, start }) => start === 0n && id === rows.document.node)
      ? []
      : [
          breach("Document", {
            documentRow: rows.document.node,
            self: rows.nodes.find(({ start }) => start === 0n)?.id ?? "",
          }),
        ]),
    ...rows.attributes
      .filter(({ node }) => !laws.elements.has(view.byId.get(node)?.kind ?? "document"))
      .map(({ at, node }) =>
        breach("AL1 owner", {
          at: String(at),
          node: pathOf(view, node),
          ownerKind: view.byId.get(node)?.kind ?? "",
        }),
      ),
    ...rows.attributeEntities
      .filter(({ attribute }) => !ownerOf.has(attribute))
      .map(({ attribute, offset }) =>
        breach("AttributeEntity owner", { attribute, offset: String(offset) }),
      ),
    ...(sameSet(openKeys, new Set(openNameKeys)) && openNameKeys.length === openKeys.size
      ? []
      : [
          breach("AL4 open names", {
            openAttributes: String(openKeys.size),
            openNames: String(openNameKeys.length),
          }),
        ]),
    ...(new Set(openNameIds).size === openNameIds.length
      ? []
      : [
          breach("AL4 open name key", {
            distinct: String(new Set(openNameIds).size),
            openNames: String(openNameIds.length),
          }),
        ]),
    ...rows.openNames.flatMap(({ attribute, local }) => {
      const named = attributeById.get(attribute);
      const kind = (named === undefined ? undefined : view.byId.get(named.node))?.kind ?? "";
      const broken =
        named?.name === "data-*"
          ? !dataName.test(local)
          : named?.name === "no-namespace" && !isForeignKind(kind) && local.startsWith("data-");

      return broken ? [breach("AL4 data name", { class: named?.name ?? "", kind, local })] : [];
    }),
    ...rows.openNames.flatMap(({ attribute, local }) => {
      const named = attributeById.get(attribute);
      const owner = named === undefined ? undefined : view.byId.get(named.node);
      const declared =
        named?.name === "data-*" &&
        owner !== undefined &&
        Option.isSome(
          governedAdmission(laws.grammar.attributes, {
            governs: owner.governs,
            kind: owner.kind,
            name: local,
            version: owner.version,
          }),
        );

      return declared ? [breach("AL4 declared data name", { kind: owner.kind, local })] : [];
    }),
    ...(sameSet(foreign, new Set(rows.openElementNames.map(({ node }) => node))) &&
    rows.openElementNames.length === foreign.size
      ? []
      : [
          breach("OpenElementName", {
            foreignElements: String(foreign.size),
            names: String(rows.openElementNames.length),
          }),
        ]),
    ...rows.openElementNames.flatMap(({ local, namespace, node }) =>
      namespace === mathmlNamespace
        ? [breach("MathML foreign element", { local, namespace, node: pathOf(view, node) })]
        : [],
    ),
    ...rows.openElementNames.flatMap(({ local, namespace, node }) => {
      const row = view.byId.get(node);
      const named =
        row === undefined
          ? []
          : laws.grammar.kinds.elementName.rows
              .filter((held) => held.namespace === namespace && held.local === local)
              .map(({ kind }) => kind)
              .filter((kind) =>
                Option.isSome(
                  laws.grammar.admission.lookup({
                    child: kind,
                    parent: row.parentKind,
                    version: row.version,
                  }),
                ),
              );

      return named.length === 0
        ? []
        : [
            breach("OpenElementName canonical", {
              kinds: spaced(named),
              local,
              namespace,
              node: pathOf(view, node),
            }),
          ];
    }),
    ...rows.nodes.flatMap((node) => {
      const compiled = checkedTextOf(laws, node);

      return emptyTextOf(laws, node) ||
        Option.exists(
          compiled,
          (held) => !overKeyText(node.stringValue) && !held.regex.test(node.stringValue),
        )
        ? [
            breach("TextDomain", {
              ...governsKeys(node.governs),
              kind: node.kind,
              node: pathOf(view, node.id),
              value: node.stringValue,
              version: node.version,
            }),
          ]
        : Option.match(
            Option.flatMap(
              compiled.pipe(Option.filter((held) => held.regex.test(node.stringValue))),
              (held) => boundBroken(held.domain, node.stringValue),
            ),
            {
              onNone: () => [],
              onSome: ({ facet, value }) => [
                breach("Double bound", {
                  bound: String(value),
                  facet,
                  lexical: node.stringValue,
                  node: pathOf(view, node.id),
                }),
              ],
            },
          );
    }),
    // C50: an IDREF or IDREFS element text's tokens name ids of its document, as an attribute's do.
    ...rows.nodes.flatMap((node) =>
      Option.exists(checkedTextOf(laws, node), ({ domain }) => isIdref(domain))
        ? tokensOf(node.stringValue)
            .filter((token) => !ids.has(token))
            .map((token) =>
              breach("Idref target", {
                ...governsKeys(node.governs),
                kind: node.kind,
                name: `the text of ${node.kind}`,
                node: pathOf(view, node.id),
                token,
                version: node.version,
              }),
            )
        : [],
    ),
    // MathML 3 §4.2.7: no element dominates itself through its children and its shares' targets.
    ...view.members.flatMap((node) =>
      Option.match(shareFragmentOf(view, node), {
        onNone: () => [],
        onSome: (target) =>
          dominatingSharesOf(view, laws).has(node.id)
            ? [breach("MathML share cycle", { share: pathOf(view, node.id), target })]
            : [],
      }),
    ),
    ...keyTexts(view, laws)
      .filter(({ bound, value }) => utf8Length(value) > bound)
      .map(({ bound, field: held, node, value }) =>
        breach("Key text bound", {
          bound: String(bound),
          bytes: String(utf8Length(value)),
          field: held,
          node: node === undefined ? "" : pathOf(view, node),
        }),
      ),
    // Reading 131: a namespace declaration's normalized value is an RFC 3986 URI reference
    // (Namespaces in XML 1.0 §3, §2.1), judged by the oracle's own reading of Appendix A's grammar.
    ...rows.namespaces
      .filter(({ uri }) => !isUriReference(uri))
      .map(({ at, node, prefix, uri }) =>
        breach("Namespace name", { at: String(at), node: pathOf(view, node), prefix, uri }),
      ),
  ];
};

/**
 * A braced variable reference: `{identifier}`.
 */
const braced = /^\{(?<identifier>[^{}]+)\}$/u;

/**
 * Read the variable a reference attribute's value names, by the reference's spelling: a bare
 * reference's collapsed value when it is an NCName, a braced reference's identifier between the
 * braces. Any other value is a literal and names nothing.
 */
const referenced: Readonly<Record<Spelling, (form: string) => Option.Option<string>>> = {
  bare: (form) => Option.liftPredicate(collapsed(form), (value) => nameForm.test(value)),
  braced: (form) => Option.fromNullishOr(braced.exec(form)?.groups?.["identifier"]),
};

export { contentLawOf } from "#pantry/test/oracle-view.ts";

/**
 * Read an integer attribute as its type reads it: its form inside its value domain
 * ({@link typedValueOf}), and the integer that form spells, by XML Schema 1.1 Part 2's lexical
 * mapping (`integerOf`: §3.3.13 and §3.3.20, so `+0`, `-0` and `00` are all 0). A form
 * outside its domain, `1abc`, or `-1` for a count, has none.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed name.
 * @returns Its integer, or none when the element does not write it inside its domain.
 */
const typedIntegerOf = (view: View, node: NodeId, name: string): Option.Option<bigint> =>
  Option.flatMap(typedValueOf(view, node, name), integerOf);

/**
 * What the overlay laws read of one document beside its rows: its declarations by identifier,
 * whether its root is an item, and its root's kind, which the built-in variables it holds follow.
 */
interface Overlay {
  readonly declared: ReadonlyMap<string, readonly FoldedNode<Composed>[]>;
  readonly isItem: boolean;
  readonly laws: Laws;
  readonly rootKind: string;
  readonly view: View;
}

/**
 * One breach an overlay law finds on a node, before its document and path are attached.
 */
interface Finding {
  readonly keys: Keys;
  readonly law: LawName;
}

/**
 * The attributes by which an interaction binds a response variable: its `response-identifier`,
 * and an entry interaction's `string-identifier` (§5.48.2, §5.162.3: "binding the interaction to a
 * second response variable (of base-type string)").
 */
const bindingNames = ["response-identifier", "string-identifier"] as const;

/**
 * Read the base type a declaration writes, as its type reads it ({@link typedValueOf}): the type
 * every law that reads one judges, a binding's fit, a mapping's or an area mapping's type, a map
 * key's or a table value's form, and a feedback outcome's type. An unwritten `base-type` is no
 * type at all: a record has none ("Variables with record cardinality have no base-type",
 * information model tables 4.5.3 and 5.115.3), so a law about a record's whole value judges its
 * cardinality alone, and any other variable that writes none is refused by Declaration base type
 * alone, never by a law over a type it does not have (the orchestrator's ruling of 2026-11-06: one
 * cause is refused under one rule; lane NIL's audit, B12). One written outside its value domain
 * types nothing either: that domain refuses it alone, and every law over the declaration's type
 * judges it as one with no base type, as the schema's rows, which hold no `DeclarationBaseType`
 * for it, judge it (spec reading 158). Its type enumerates a restriction of `xs:string`, whose
 * whiteSpace is `preserve`, so a padded form lies outside it (`imsqti_asiv3p0_v1p0.xsd`, each
 * declaration's `base-type`).
 *
 * @param overlay - The item.
 * @param declaration - The declaration, or none where the node it types has no declaration parent.
 * @returns Its base type, none where it writes none, writes one outside its domain, or there is no
 *   declaration.
 */
const baseTypeOf = (
  overlay: Overlay,
  declaration: FoldedNode<Composed> | undefined,
): Option.Option<string> =>
  declaration === undefined
    ? Option.none()
    : typedValueOf(overlay.view, declaration.id, "base-type");

/**
 * Hold a declared type to a law's one admitted base type, where the declaration has a base type:
 * the keys of the breach it is, or none where it holds or there is none to judge.
 *
 * @param baseType - The declaration's base type, none where it writes none.
 * @param holds - Whether a base type is the one the law admits.
 * @returns The breach's keys, or none.
 */
const typeBreach = (
  baseType: Option.Option<string>,
  holds: (held: string) => boolean,
): Option.Option<{ readonly baseType: string }> =>
  baseType.pipe(
    Option.filter((held) => !holds(held)),
    Option.map((held) => ({ baseType: held })),
  );

/**
 * Read the cardinality a declaration writes, as its type reads it ({@link typedValueOf}): the
 * cardinality the fit laws judge ("BindingFit", "RecordBindingFit" and "Binding cardinality"), a
 * lookup table's outcome's and a feedback outcome's. A cardinality left unwritten is refused by AL3
 * alone, and one written outside its value domain by that domain alone, never by a law over a type
 * the declaration does not have (the orchestrator's ruling of 2026-11-06: an absent attribute is no
 * empty one, and one cause is refused under one rule). The schema's fit laws read a binding's
 * `BindingCardinality` (`#pantry/qti/interactions.ts`), copied from the declaration's
 * `DeclarationCardinality`, which such a declaration does not have, while its binding is still
 * declared (spec readings 158 and 159). Its type enumerates a restriction of `xs:string`, whose
 * whiteSpace is `preserve`, so a padded form lies outside it (`imsqti_asiv3p0_v1p0.xsd`, each
 * declaration's `cardinality`).
 *
 * @param overlay - The item.
 * @param declaration - The declaration.
 * @returns Its cardinality, or none where it writes none or one outside its domain.
 */
const cardinalityOf = (
  overlay: Overlay,
  declaration: FoldedNode<Composed>,
): Option.Option<string> => typedValueOf(overlay.view, declaration.id, "cardinality");

/**
 * Hold a declaration that holds a mapping or an area mapping to no record (§2.11.1.5: a mapping
 * "cannot be applied to variables of record cardinality"; §5.5: an area mapping maps "a source set
 * of point values"): the breach where its cardinality is `record`, none where it is another or
 * none ({@link cardinalityOf}).
 *
 * @param overlay - The item.
 * @param declaration - The declaration.
 * @param law - The law the table's kind states it under.
 * @returns The breach, none where it holds or there is no cardinality to judge.
 */
const recordBreach = (
  overlay: Overlay,
  declaration: FoldedNode<Composed>,
  law: "AreaMapping base type" | "MappableBaseType",
): readonly Finding[] =>
  Option.toArray(cardinalityOf(overlay, declaration))
    .filter((cardinality) => cardinality === "record")
    .map((cardinality): Finding => ({ keys: { cardinality }, law }));

/**
 * `xs:integer`'s lexical space.
 */
const xsIntegerForm = /^[+-]?[0-9]+$/u;

/**
 * `xs:double`'s lexical space, its mantissa and exponent captured.
 */
const xsDoubleForm =
  /^(?<mantissa>[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+))(?:[eE](?<exponent>[+-]?[0-9]+))?$/u;

/**
 * `xs:double`'s special values as XML Schema 1.0 spells them, reading 71's edition, in which `+INF`
 * is no lexical form.
 */
const doubleSpecials: ReadonlySet<string> = new Set(["INF", "-INF", "NaN"]);

/**
 * Decide whether a form, as written, is in `xs:double`'s lexical space: a special value, or a
 * decimal mantissa of any digits with an optional exponent of any digits.
 *
 * @param form - The form: a map key, or a slider's bound collapsed.
 * @returns Whether it is a double's lexical form.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#double | XML Schema Part 2, 3.2.5 double}
 */
const isDoubleForm = (form: string): boolean => doubleSpecials.has(form) || xsDoubleForm.test(form);

/**
 * Two runs of non-space characters with one whitespace character between them and none around: a
 * point's or a pair's written form.
 */
const twoItemsForm = /^(?<first>[^\t\n\r ]+)[\t\n\r ](?<second>[^\t\n\r ]+)$/u;

/**
 * Decide whether a text sorts strictly before another by code point, as PostgreSQL's `pg_c_utf8`
 * collation orders text.
 *
 * @param left - The first text.
 * @param right - The second.
 * @returns Whether it sorts before.
 */
const codePointsBefore = (left: string, right: string): boolean => {
  const a = Array.from(left, (char) => char.codePointAt(0) ?? 0);
  const b = Array.from(right, (char) => char.codePointAt(0) ?? 0);
  const at = a.findIndex((code, index) => code !== b[index]);

  return at === -1 ? a.length < b.length : at < b.length && (a[at] ?? 0) < (b[at] ?? 0);
};

/**
 * Read a point, pair or directed pair map key as its typed value: a point's two integers, a pair's
 * two items in code-point order, a directed pair's two in order, each joined by one space.
 *
 * @param baseType - The mapping's base type.
 * @param key - The key, as written.
 * @returns The value's text after `typed`, or none for another base type or a key that is not two
 *   items of it.
 */
const twoItemValueOf = (baseType: string, key: string): string | undefined => {
  const items = twoItemsForm.exec(key)?.groups;
  const first = items?.["first"] ?? "";
  const second = items?.["second"] ?? "";
  if (baseType === "point" && xsIntegerForm.test(first) && xsIntegerForm.test(second)) {
    return `typed ${String(BigInt(first))} ${String(BigInt(second))}`;
  }

  if (items === undefined || (baseType !== "pair" && baseType !== "directedPair")) {
    return undefined;
  }

  const ordered =
    baseType === "pair" && codePointsBefore(second, first) ? [second, first] : [first, second];

  return `typed ${ordered.join(" ")}`;
};

/**
 * Read a map key as the value its mapping's base type gives it, which two keys of one mapping may
 * not share (Map key): an integer by `BigInt`, a point as its two integers, a pair as its two items
 * in code-point order and a directed pair as its two in order; a float, every key in `xs:double`'s
 * lexical space (reading 154), as the double it names under reading 144, {@link numberOf}'s, which
 * rounds the decimal once to the nearest double, ties to even, at any digits and any exponent, an
 * infinity of its sign past the greatest finite double and a zero of its sign below half the least
 * subnormal. `String` writes -0 as 0 and every NaN as `NaN`, so `0` and `-0` repeat, as do two
 * `NaN`s: an identity constraint holds two keys one where they are "equal or identical" (XML Schema
 * 1.1 Part 1 §3.11.4), and -0 equals 0 while NaN is identical to itself (Part 2 §3.3.5.1). Every
 * other key, no value of its base type, is read by its lexical form.
 *
 * @param baseType - The mapping's base type.
 * @param key - The key, as written.
 * @returns The value's text: `typed` and the value where the schema compares a typed value, and
 *   `lexical` and the key everywhere else, so a typed value never meets a lexical form.
 */
const mapKeyValueOf = (baseType: string, key: string): string => {
  if (baseType === "integer" && xsIntegerForm.test(key)) {
    return `typed ${String(BigInt(key))}`;
  }

  const items = twoItemValueOf(baseType, key);
  if (items !== undefined) {
    return items;
  }

  return baseType === "float" && isDoubleForm(key)
    ? `typed ${String(numberOf(key))}`
    : `lexical ${key}`;
};

/**
 * Compile a built-in XSD type's lexical space as an attribute's typed value is read: exactly, its
 * whitespace class applied to nothing (reading 7), the pattern's anchors dropped so a list can
 * repeat it.
 *
 * @param local - The type's local name.
 * @returns The pattern's body.
 */
const exactBodyOf = (local: string): string =>
  Result.getOrThrowWith(
    Result.flatMap(builtinDomainOf(local), (domain) => compile(domain, "exact")),
    (unread) => unread,
  ).pattern.slice(1, -1);

/**
 * Each base type's lexical form as an attribute writes its value, with no whitespace around it
 * (reading 7): boolean `true` or `false` (reading 34), integer `xs:integer` (reading 45), float
 * and duration `xs:double`, identifier `IdentifierDType` (`xs:NCName`), uri `xs:anyURI` (reading
 * 71), a point two integers and a pair or directed pair two identifiers, one whitespace character
 * between them (as `BaseTypePattern` reads them); a base type absent here, `string` and `file`,
 * reads any text.
 */
const typedAttributeForms: ReadonlyMap<string, RegExp> = new Map(
  [
    ["boolean", "(?:true|false)"],
    ["integer", exactBodyOf("integer")],
    ["float", exactBodyOf("double")],
    ["duration", exactBodyOf("double")],
    ["identifier", exactBodyOf("NCName")],
    ["uri", exactBodyOf("anyURI")],
    ["point", `${exactBodyOf("integer")}[\\t\\n\\r ]${exactBodyOf("integer")}`],
    ["pair", `${exactBodyOf("NCName")}[\\t\\n\\r ]${exactBodyOf("NCName")}`],
    ["directedPair", `${exactBodyOf("NCName")}[\\t\\n\\r ]${exactBodyOf("NCName")}`],
  ].map(([baseType = "", body = ""]) => [baseType, new RegExp(`^${body}$`, patternFlags)]),
);

/**
 * Decide whether an attribute's typed value is a lexical form of its base type, as written
 * (Typed attribute value): a map key, a table entry's target or a table's default.
 *
 * @param baseType - The value's base type, its declaration's.
 * @param text - The attribute's lexical form.
 * @returns Whether it is one; a base type with no form here, `string` among them, holds any text.
 */
const typedAttributeHolds = (baseType: string, text: string): boolean =>
  typedAttributeForms.get(baseType)?.test(text) ?? true;

/**
 * Decide whether an element's text is a lexical form of a base type, as reading 7 reads a typed
 * value written as element content (Usage typed value): its outer XML whitespace is formatting,
 * and a uri's inner runs collapse as `xs:anyURI`'s `collapse` reads them, so the rest is
 * {@link typedAttributeHolds}'s form; `string` and `file` hold any text, whitespace included.
 *
 * @param baseType - The value's base type.
 * @param text - The element's string value.
 * @returns Whether it is one.
 */
export const typedTextHolds = (baseType: string, text: string): boolean => {
  const trimmed = text.replace(/^[\t\n\r ]+/u, "").replace(/[\t\n\r ]+$/u, "");

  return typedAttributeHolds(
    baseType,
    baseType === "uri" ? trimmed.replaceAll(/[\t\n\r ]+/gu, " ") : trimmed,
  );
};

/**
 * The choice classes whose identifier "must not be used by any other choice or item variable"
 * (information model §5.132.1, and §5.7.1, §5.55.1, §5.56.1, §5.58.1, §5.65.1, §5.67.1, §5.73.1
 * and §5.131.1), each class's element, which spec reading 104 as amended reads as one space of
 * identifiers: no two elements of the nine, of one class or of two, share an identifier.
 */
const choiceClasses: ReadonlySet<string> = new Set([
  "qti-associable-hotspot",
  "qti-gap",
  "qti-gap-img",
  "qti-gap-text",
  "qti-hotspot-choice",
  "qti-hottext",
  "qti-inline-choice",
  "qti-simple-associable-choice",
  "qti-simple-choice",
]);

/**
 * Decide whether a document declares an identifier as one of some declaration kinds.
 *
 * @param overlay - The document.
 * @param identifier - The identifier.
 * @param kinds - The declaration kinds.
 * @returns Whether a declaration of one of the kinds has the identifier.
 */
const declares = (overlay: Overlay, identifier: string, kinds: ReadonlySet<string>): boolean =>
  (overlay.declared.get(identifier) ?? []).some(({ kind }) => kinds.has(kind));

/**
 * Decide whether an identifier names a built-in variable of the document's root that stands as one
 * of some declaration kinds: `completionStatus` an outcome, `numAttempts` and `duration` responses,
 * `QTI_CONTEXT` a context (information model §2.2.2), which "are declared implicitly and must not
 * be declared" (`BuiltInVariable`, keyed by the root, spec reading 29).
 *
 * @param overlay - The document.
 * @param identifier - The identifier.
 * @param kinds - The declaration kinds.
 * @returns Whether a built-in variable of one of the kinds has the identifier under the root.
 */
const builtInAs = (overlay: Overlay, identifier: string, kinds: ReadonlySet<string>): boolean =>
  Option.exists(
    overlay.laws.grammar.references.builtIn.lookup({
      root: overlay.rootKind,
      variable: identifier,
    }),
    ({ declaration }) => kinds.has(declaration),
  );

/**
 * Read a count attribute of a node, or its XSD default when the node does not write it.
 *
 * @param overlay - The document.
 * @param node - The node.
 * @param name - The attribute's closed name.
 * @returns The count, or none when neither is written or the written form lies outside its value
 *   domain.
 */
const countAttribute = (
  overlay: Overlay,
  node: FoldedNode<Composed>,
  name: string,
): Option.Option<bigint> =>
  Option.isSome(valueOf(overlay.view, node.id, name))
    ? typedIntegerOf(overlay.view, node.id, name)
    : Option.flatMap(
        Option.fromNullishOr(overlay.laws.defaults.get(`${node.version} ${node.kind} ${name}`)),
        integerOf,
      );

/**
 * Read the variables a node's references name (`VariableReference`), each with the declaration
 * kinds it may name (`ContentReference`), none for a reference that may name any variable.
 *
 * @param overlay - The document.
 * @param node - The node.
 * @returns Each attribute that names a variable, the identifier it names, how it spells it, and
 *   its declaration kinds.
 */
const namedBy = (
  overlay: Overlay,
  node: FoldedNode<Composed>,
): readonly {
  readonly attribute: string;
  readonly identifier: string;
  readonly spelling: Spelling;
  readonly targets: ReadonlySet<string>;
}[] => {
  const { contentReference, variableReference } = overlay.laws.grammar.references;

  return variableReference.rows
    .filter(({ kind }) => kind === node.kind)
    .flatMap(({ attribute, spelling }) =>
      Option.toArray(
        valueOf(overlay.view, node.id, attribute).pipe(Option.flatMap(referenced[spelling])),
      ).map((identifier) => ({
        attribute,
        identifier,
        spelling,
        targets: new Set(
          contentReference.rows
            .filter((row) => row.kind === node.kind && row.attribute === attribute)
            .map(({ declaration }) => declaration),
        ),
      })),
    );
};

/**
 * The interactions whose response cardinality their most count decides, by that count's attribute:
 * "If max-choices is greater than 1 (or 0) then the interaction must be bound to a response with
 * multiple cardinality" (information model §5.30.2, and §5.66.1, §5.68.2, §5.107.3 and §5.128.2),
 * and the same sentence of `max-associations` (§5.8.2, §5.57.3, §5.59.2, §5.60.2 and §5.89.2):
 * spec reading 92, which found the select point interaction's.
 */
const cardinalityBounds: ReadonlyMap<string, string> = new Map([
  ["qti-associate-interaction", "max-associations"],
  ["qti-choice-interaction", "max-choices"],
  ["qti-gap-match-interaction", "max-associations"],
  ["qti-graphic-associate-interaction", "max-associations"],
  ["qti-graphic-gap-match-interaction", "max-associations"],
  ["qti-hotspot-interaction", "max-choices"],
  ["qti-hottext-interaction", "max-choices"],
  ["qti-match-interaction", "max-associations"],
  ["qti-position-object-interaction", "max-choices"],
  ["qti-select-point-interaction", "max-choices"],
]);

/**
 * The quotation punctuation of reading 127, main's set: the double quote, the single and double
 * curly and low quotes but the right single quotation mark, and the guillemets. The apostrophes
 * `'` and `’` are left out, since a possessive or an elision beside a `q` quotes nothing.
 */
const quotationMarks: ReadonlySet<string> = new Set([
  '"',
  "«",
  "»",
  "‘",
  "‚",
  "‛",
  "“",
  "”",
  "„",
  "‟",
  "‹",
  "›",
]);

/**
 * The least `figures` each rounding mode admits (reading 119; info §5.47.2 and §5.119.2): a
 * "non-zero positive integer" under `significantFigures`, "an integer greater than or equal to
 * zero" under `decimalPlaces`.
 */
const roundingLeast: ReadonlyMap<string, bigint> = new Map([
  ["decimalPlaces", 0n],
  ["significantFigures", 1n],
]);

/**
 * Read a collapsed `figures` as an integer: an `xs:integer` within the signed 64-bit range spec
 * reading 46 holds it to; anything else names a variable, or breaks the value domain.
 *
 * @param form - The collapsed form.
 * @returns The integer, or none for a form that is no such integer.
 */
const figuresInteger = (form: string): Option.Option<bigint> =>
  Option.filter(
    Option.liftPredicate(form, (value) => xsIntegerForm.test(value)).pipe(Option.map(BigInt)),
    (value) => value >= -(2n ** 63n) && value < 2n ** 63n,
  );

/**
 * Read a tolerance value's sign as reading 121 does: a value in `xs:double`'s lexical space is a
 * number, positive where its mantissa has no minus and a digit other than 0, or it is `INF`; any
 * other value is a string, which names a variable read at run time.
 *
 * @param value - The value, one item of the list.
 * @returns `positive`, `not positive` for `NaN`, `-INF` and every zero or negative, or `string`.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#double | XML Schema Part 2, 3.2.5 double}
 */
const toleranceSignOf = (value: string): "not positive" | "positive" | "string" => {
  if (value === "INF") {
    return "positive";
  }

  if (value === "-INF" || value === "NaN") {
    return "not positive";
  }

  const mantissa = xsDoubleForm.exec(value)?.groups?.["mantissa"];
  if (mantissa === undefined) {
    return "string";
  }

  return !mantissa.startsWith("-") && /[1-9]/u.test(mantissa) ? "positive" : "not positive";
};

/**
 * The learning resource types reading 122 forbids of the LOM vocabulary, as their values collapse:
 * "the LOM-defined values self assessment and exam are forbidden" (QTI 3.0 Metadata §2.7.5.1).
 */
const lomForbidden: ReadonlySet<string> = new Set(["exam", "self assessment"]);

/**
 * The kinds of an item whose `label` is text for a reader and asks for no tool (spec reading 128):
 * the information model describes `ItemFileInfo`'s, the type of `qti-calculator-info` and
 * `qti-digital-material`, as "A human readable label/short description for the file" (§5.80.2),
 * and `PrintedVariable`'s as one "appropriate for a tooltip" (§7.30.4), in both versions, and
 * neither states the tool sentence the other label characteristics state.
 */
const readerLabels: ReadonlySet<string> = new Set([
  "qti-calculator-info",
  "qti-digital-material",
  "qti-printed-variable",
]);

/**
 * The sources, collapsed, of the LOM vocabulary's terms (reading 122): LOMv1.0, and the empty
 * source, which the loose binding's default="LOMv1.0" fills (imsmd_loose_v1p3p2.xsd:1288). A term
 * that writes no source reads as the empty one.
 */
const lomVocabulary: ReadonlySet<string> = new Set(["", "LOMv1.0"]);

/**
 * The overlay laws of §1.7 over one node: O3's bindings, choice bounds and
 * content references, O4's arity and undeclared references, O5's mapping base type and O7's
 * selection bound.
 *
 * Bindings and references are read in items only, as today's schema selects them by the item
 * root; a test's feedback and printed variables name outcomes of the items it holds.
 */
const overlayLaws: readonly ((
  node: FoldedNode<Composed>,
  overlay: Overlay,
) => readonly Finding[])[] = [
  (node, overlay) =>
    // Reading 126: a cell's headers are "an unordered set of unique space-separated tokens ...,
    // each of which must have the value of an ID of a 'th' tag taking part in the same table"
    // (info §5.140.1), the table its nearest; a cell no table holds takes part in none.
    node.kind === "td" || node.kind === "th"
      ? Option.toArray(valueOf(overlay.view, node.id, "headers")).flatMap((headers) => {
          const tokens = headers.split(/[\t\n\r ]+/u).filter((token) => token !== "");
          const table = tableOf(overlay.view, node);
          const held =
            table === undefined
              ? new Set<string>()
              : (tableHeadersOf(overlay.view).get(table) ?? new Set<string>());
          const unnamed = tokens.filter((token) => !held.has(token));
          const repeated = tokens.filter((token, at) => tokens.indexOf(token) !== at);

          return unnamed.length === 0 && repeated.length === 0
            ? []
            : [
                {
                  keys: {
                    repeated: repeated.join(" "),
                    table: table === undefined ? "" : pathOf(overlay.view, table),
                    unnamed: unnamed.join(" "),
                  },
                  law: "Table headers",
                },
              ];
        })
      : [],
  (node, { view }) => {
    // Reading 127: "Quotation punctuation (such as quotation marks) that is quoting the contents
    // of the tag must not appear immediately before, after, or inside q tags" (§5.111), read at
    // the four characters beside and inside a q, each its neighbour's own, none for a neighbour
    // that holds no characters.
    if (node.kind !== "q") {
      return [];
    }

    const atSlot = (parent: NodeId, at: bigint): readonly string[] =>
      Array.from(ownCharactersOf(view, view.bySlot.get(slotKey(parent, at))), String);
    const positions: readonly (readonly [string, string | undefined])[] = [
      ["before it", node.at > 0n ? atSlot(node.parent, node.at - 1n).at(-1) : undefined],
      ["after it", atSlot(node.parent, node.at + 1n)[0]],
      ["at its start", atSlot(node.id, 0n)[0]],
      ["at its end", node.children > 0n ? atSlot(node.id, node.children - 1n).at(-1) : undefined],
    ];

    return positions
      .flatMap(([position, mark]) =>
        mark !== undefined && quotationMarks.has(mark)
          ? [{ keys: { mark, position }, law: "Quotation punctuation" as const }]
          : [],
      )
      .slice(0, 1);
  },
  (node, overlay) =>
    // Reading 105: a usage value that names its base type holds a lexical form of it, read as
    // element content is (reading 7), where it forms part of a record, that is, writes a
    // fieldIdentifier (usage data binding §2.6.5.1); one outside a record is untyped text.
    node.kind === "ud:value" && Option.isSome(valueOf(overlay.view, node.id, "fieldIdentifier"))
      ? Option.toArray(valueOf(overlay.view, node.id, "baseType")).flatMap((baseType) => {
          const text = stringValueOf(overlay.view, node);

          return typedTextHolds(baseType, text)
            ? []
            : [{ keys: { baseType, text }, law: "Usage typed value" }];
        })
      : [],
  (node, { view }) => {
    // Reading 122: "the LOM-defined values self assessment and exam are forbidden" (QTI 3.0
    // Metadata §2.7.5.1), of a term of the LOM vocabulary: its source LOMv1.0, or empty, which
    // the loose binding's default="LOMv1.0" fills, or not written; both compared collapsed. The
    // first value and the first source stand for the type, as the binding caps each at one (N7).
    if (node.kind !== "lom:learningResourceType") {
      return [];
    }

    const terms = view.childrenOf.get(node.id) ?? [];
    const value = terms.find(({ kind }) => kind === "lom:value");
    const source = terms.find(({ kind }) => kind === "lom:source");
    const term = value === undefined ? "" : collapsed(stringValueOf(view, value));
    const vocabulary = source === undefined ? "" : collapsed(stringValueOf(view, source));

    return value !== undefined && lomForbidden.has(term) && lomVocabulary.has(vocabulary)
      ? [
          {
            keys: { source: source === undefined ? "" : vocabulary, value: term },
            law: "LOM learning resource type",
          },
        ]
      : [];
  },
  (node, overlay) => {
    const { grammar } = overlay.laws;
    if (!overlay.isItem || Option.isNone(grammar.kinds.interaction.lookup({ kind: node.kind }))) {
      return [];
    }

    return bindingNames.flatMap((attribute): readonly Finding[] => {
      const bound = typedValueOf(overlay.view, node.id, attribute);
      if (Option.isNone(bound)) {
        return [];
      }

      const identifier = bound.value;
      const response = (overlay.declared.get(identifier) ?? []).find(
        ({ kind }) => kind === "qti-response-declaration",
      );
      if (response === undefined) {
        return [{ keys: { attribute, identifier }, law: "Binding declared" }];
      }

      const cardinality = cardinalityOf(overlay, response);
      if (Option.isNone(cardinality)) {
        return [];
      }

      // A string identifier's variable is "of base-type string" (§5.48.2, §5.162.3): a record,
      // which has no base type, is not, judged by its cardinality alone; another variable is
      // judged by its base type where it has one.
      const baseType = baseTypeOf(overlay, response);
      if (attribute === "string-identifier") {
        return cardinality.value === "record"
          ? [{ keys: { attribute, cardinality: cardinality.value, identifier }, law: "BindingFit" }]
          : Option.toArray(typeBreach(baseType, (held) => held === "string")).map(
              (keys): Finding => ({ keys: { ...keys, attribute, identifier }, law: "BindingFit" }),
            );
      }

      const record = Option.isSome(grammar.recordBindingFit.lookup({ kind: node.kind }));
      if (!record && !grammar.bindingFit.rows.some(({ kind }) => kind === node.kind)) {
        return [];
      }

      if (cardinality.value === "record") {
        return record ? [] : [{ keys: { identifier }, law: "RecordBindingFit" }];
      }

      return Option.toArray(
        typeBreach(baseType, (held) =>
          Option.isSome(
            grammar.bindingFit.lookup({
              baseType: held,
              cardinality: cardinality.value,
              kind: node.kind,
            }),
          ),
        ),
      ).map((keys): Finding => ({
        keys: { ...keys, cardinality: cardinality.value, identifier },
        law: "BindingFit",
      }));
    });
  },
  (node) =>
    // R10-b: a 3.0.0 document holds no custom interaction; a 3.0.1 document may.
    node.kind === "qti-custom-interaction" && node.version === "3.0.0"
      ? [{ keys: {}, law: "Custom interaction version" }]
      : [],
  (node, overlay) =>
    // R10-a: a portable custom interaction names its module by `module`, by a
    // `qti-interaction-modules` child, or by both; one with neither names none.
    node.kind === "qti-portable-custom-interaction" &&
    Option.isNone(valueOf(overlay.view, node.id, "module")) &&
    !(overlay.view.childrenOf.get(node.id) ?? []).some(
      ({ kind }) => kind === "qti-interaction-modules",
    )
      ? [{ keys: {}, law: "PCI module source" }]
      : [],
  (node, overlay) => {
    const { choiceBound, choiceCount } = overlay.laws.grammar.references;

    return Option.toArray(choiceBound.lookup({ kind: node.kind })).flatMap(
      ({ max, min, zero }): readonly Finding[] => {
        // Reading 18: a counted bound binds only where its least is written, and then a most of
        // 0 is a count below it; every other bound reads an unwritten least as its default, or 0,
        // and a most of 0 as no limit (reading 76).
        const written = Option.isSome(valueOf(overlay.view, node.id, min));
        if (zero === "counted" && !written) {
          return [];
        }

        const most = countAttribute(overlay, node, max);
        const least = Option.getOrElse(countAttribute(overlay, node, min), () => 0n);
        const choices = Option.map(choiceCount.lookup({ kind: node.kind }), ({ choice }) =>
          BigInt(
            (overlay.view.childrenOf.get(node.id) ?? []).filter(({ kind }) => kind === choice)
              .length,
          ),
        );
        const counted = (name: string, count: bigint): readonly Finding[] =>
          Option.toArray(choices)
            .filter((available) => count > available)
            .map((available) => ({
              keys: { attribute: name, choices: String(available), count: String(count) },
              law: "Choice bounds",
            }));

        return [
          ...Option.toArray(most)
            .filter((bound) => (zero === "counted" || bound !== 0n) && least > bound)
            .map((bound): Finding => ({
              keys: { least: String(least), max, min, most: String(bound) },
              law: "Choice bounds",
            })),
          ...counted(min, least),
          ...Option.toArray(most).flatMap((bound) => counted(max, bound)),
        ];
      },
    );
  },
  (node, overlay) =>
    overlay.isItem
      ? namedBy(overlay, node)
          .filter(
            ({ identifier, targets }) =>
              targets.size > 0 &&
              !declares(overlay, identifier, targets) &&
              !builtInAs(overlay, identifier, targets),
          )
          .flatMap(({ attribute, identifier }) =>
            Option.toArray(contentLawOf(node.kind, attribute)).map((law): Finding => ({
              keys: { attribute, identifier },
              law,
            })),
          )
      : [],
  (node, overlay) =>
    Option.toArray(overlay.laws.grammar.operatorArity.lookup({ kind: node.kind }))
      .filter(({ max, min }) => node.elementChildren < min || node.elementChildren > max)
      .map((): Finding => ({ keys: { count: String(node.elementChildren) }, law: "Arity" })),
  (node, overlay) =>
    overlay.isItem
      ? namedBy(overlay, node)
          .filter(
            ({ identifier, spelling, targets }) =>
              // Reading R15-k: a braced reference, a string attribute's, that names no variable is
              // a string value (information model §9.3.4), so nothing is undeclared.
              spelling === "bare" &&
              targets.size === 0 &&
              !overlay.declared.has(identifier) &&
              Option.isNone(
                overlay.laws.grammar.references.builtIn.lookup({
                  root: overlay.rootKind,
                  variable: identifier,
                }),
              ),
          )
          .map(({ identifier }): Finding => ({ keys: { identifier }, law: "Variable declared" }))
      : [],
  (node, overlay) => {
    // Reading 78: a mapping maps "a source set of any base-type (except file and duration)" (§5.88)
    // of a variable that is not a record (§2.11.1.5: "cannot be applied to variables of record
    // cardinality"). A record has no base type, so it is judged by its cardinality alone, and a
    // variable is judged by its base type where it has one. Each half reads one attribute, so a
    // declaration whose cardinality or base type is unwritten or outside its domain is judged by
    // the other half alone, since its own law refuses the attribute (spec reading 158).
    if (
      node.kind !== "qti-response-declaration" ||
      !(overlay.view.childrenOf.get(node.id) ?? []).some(({ kind }) => kind === "qti-mapping")
    ) {
      return [];
    }

    return [
      ...recordBreach(overlay, node, "MappableBaseType"),
      ...Option.toArray(
        typeBreach(baseTypeOf(overlay, node), (held) =>
          Option.isSome(overlay.laws.grammar.mappableBaseType.lookup({ baseType: held })),
        ),
      ).map((keys): Finding => ({ keys, law: "MappableBaseType" })),
    ];
  },
  (node, overlay) => {
    const children = overlay.view.childrenOf.get(node.id) ?? [];
    const baseType = baseTypeOf(overlay, node);
    // A declaration whose cardinality is unwritten or outside its domain has its tables, but no
    // cardinality for a law over them to read (the declarations overlay's `typedDeclarationOf`;
    // spec reading 158), so its own laws refuse it (AL3's required attribute, the value domain)
    // and neither AreaMapping base type nor Lookup table cardinality does again.
    const cardinality = cardinalityOf(overlay, node);
    const tables = children.filter(
      ({ kind }) => kind === "qti-match-table" || kind === "qti-interpolation-table",
    );

    // §5.5: an area mapping maps "a source set of point values": a record, which has no base type,
    // is judged by its cardinality alone, and a variable by its base type where it has one, each
    // half where its attribute has a value (spec reading 158).
    return [
      ...(node.kind === "qti-response-declaration" &&
      children.some(({ kind }) => kind === "qti-area-mapping")
        ? [
            ...recordBreach(overlay, node, "AreaMapping base type"),
            ...Option.toArray(typeBreach(baseType, (base) => base === "point")).map(
              (keys): Finding => ({ keys, law: "AreaMapping base type" }),
            ),
          ]
        : []),
      ...(node.kind === "qti-outcome-declaration"
        ? Option.toArray(cardinality)
            .filter((held) => held !== "single")
            .flatMap((held) =>
              tables.map(({ kind }): Finding => ({
                keys: { cardinality: held, kind },
                law: "Lookup table cardinality",
              })),
            )
        : []),
    ];
  },
  (node, overlay) => {
    if (node.kind !== "qti-mapping") {
      return [];
    }

    // A mapping of a declaration with no base type, a record's or one whose base type spells
    // nothing, reads its keys in none: each is its lexical form alone, and no type judges it (lane
    // NIL's audit, B12; spec reading 158).
    const baseType = baseTypeOf(overlay, overlay.view.byId.get(node.parent));
    const seen = new Set<string>();

    return (overlay.view.childrenOf.get(node.id) ?? [])
      .filter(({ kind }) => kind === "qti-map-entry")
      .flatMap(({ id }): readonly Finding[] => {
        const key = Option.getOrUndefined(valueOf(overlay.view, id, "map-key"));
        if (key === undefined) {
          return [];
        }

        const lexical = Option.toArray(
          typeBreach(baseType, (held) => typedAttributeHolds(held, key)),
        ).map((keys): Finding => ({ keys: { ...keys, value: key }, law: "Typed attribute value" }));
        const value = Option.match(baseType, {
          onNone: () => `lexical ${key}`,
          onSome: (held) => mapKeyValueOf(held, key),
        });
        if (!seen.has(value)) {
          seen.add(value);

          return lexical;
        }

        return [
          ...lexical,
          {
            keys: {
              ...Option.match(baseType, {
                onNone: () => ({}),
                onSome: (held) => ({ baseType: held }),
              }),
              key,
            },
            law: "Map key",
          },
        ];
      });
  },
  (node, overlay) => {
    if (node.kind !== "qti-match-table" && node.kind !== "qti-interpolation-table") {
      return [];
    }

    const baseType = baseTypeOf(overlay, overlay.view.byId.get(node.parent));
    const values = [
      ...Option.toArray(valueOf(overlay.view, node.id, "default-value")),
      ...(overlay.view.childrenOf.get(node.id) ?? []).flatMap(({ id }) =>
        Option.toArray(valueOf(overlay.view, id, "target-value")),
      ),
    ];

    return values.flatMap((value) =>
      Option.toArray(typeBreach(baseType, (held) => typedAttributeHolds(held, value))).map(
        (keys): Finding => ({ keys: { ...keys, value }, law: "Typed attribute value" }),
      ),
    );
  },
  (node, overlay) => {
    if (node.kind !== "qti-selection") {
      return [];
    }

    const parts = (overlay.view.childrenOf.get(node.parent) ?? []).filter(({ kind }) =>
      Option.isSome(overlay.laws.grammar.references.sectionPart.lookup({ kind })),
    ).length;
    const replaced = Option.contains(
      Option.flatMap(typedValueOf(overlay.view, node.id, "with-replacement"), booleanOf),
      true,
    );

    return Option.toArray(typedIntegerOf(overlay.view, node.id, "select"))
      .filter((count) => !replaced && count > BigInt(parts))
      .map((count): Finding => ({
        keys: { parts: String(parts), select: String(count) },
        law: "Selection bound",
      }));
  },
  (node, overlay) => {
    if (node.kind !== "qti-slider-interaction") {
      return [];
    }

    // Reading 9, the Schematron's 14Ba: "not(@upper-bound < @lower-bound)", each bound collapsed
    // and read where it is in xs:double's lexical space (reading 71's edition), as the double it
    // names (reading 144); a bound that is no xs:double has no value, and NaN orders against
    // nothing.
    return Option.all([
      valueOf(overlay.view, node.id, "lower-bound"),
      valueOf(overlay.view, node.id, "upper-bound"),
    ]).pipe(
      Option.map(([lower, upper]) => [collapsed(lower), collapsed(upper)] as const),
      Option.filter(
        ([lower, upper]) =>
          isDoubleForm(lower) && isDoubleForm(upper) && numberOf(upper) < numberOf(lower),
      ),
      Option.map(([lower, upper]): Finding => ({ keys: { lower, upper }, law: "Slider bounds" })),
      Option.toArray,
    );
  },
  (node, overlay) => {
    // Reading 119: "If roundingMode= 'significantFigures', the value of figures must be a
    // non-zero positive integer. If roundingMode='decimalPlaces', the value of figures must be an
    // integer greater than or equal to zero" (info §5.47.2, §5.119.2), the mode written or
    // EqualRounded's default (§5.47.1); a variable's name is read at run time.
    if (node.kind !== "qti-equal-rounded" && node.kind !== "qti-round-to") {
      return [];
    }

    const mode = Option.getOrElse(valueOf(overlay.view, node.id, "rounding-mode"), () =>
      node.kind === "qti-equal-rounded" ? "significantFigures" : "",
    );
    const least = roundingLeast.get(mode);

    return Option.toArray(
      Option.flatMap(typedValueOf(overlay.view, node.id, "figures"), figuresInteger),
    )
      .filter((figures) => least !== undefined && figures < least)
      .map((figures): Finding => ({
        keys: { figures: String(figures), least: String(least ?? 0n), mode },
        law: "Rounding figures",
      }));
  },
  (node, overlay) => {
    // Reading 121: "If the tolerance mode is absolute or relative then the tolerance must be
    // specified. The tolerance consists of two positive numbers, t0 and t1, ... If only one value
    // is given it is used for both" (info §5.46.2), each value a number where it is in
    // xs:double's lexical space and else a string naming a variable (§9.1.5).
    if (node.kind !== "qti-equal") {
      return [];
    }

    const mode = Option.getOrElse(valueOf(overlay.view, node.id, "tolerance-mode"), () => "exact");
    const tolerance = valueOf(overlay.view, node.id, "tolerance");
    if (Option.isNone(tolerance)) {
      return mode === "absolute" || mode === "relative"
        ? [{ keys: { count: "", mode, unsigned: "" }, law: "Equal tolerance" }]
        : [];
    }

    const values = tolerance.value.split(/[\t\n\r ]+/u).filter((value) => value !== "");
    const unsigned = values.filter((value) => toleranceSignOf(value) === "not positive");

    return values.length >= 1 && values.length <= 2 && unsigned.length === 0
      ? []
      : [
          {
            keys: { count: String(values.length), mode, unsigned: unsigned.join(" ") },
            law: "Equal tolerance",
          },
        ];
  },
  (node, overlay) =>
    Option.all([
      valueOf(overlay.view, node.id, "aria-valuemin"),
      valueOf(overlay.view, node.id, "aria-valuemax"),
    ]).pipe(
      Option.filter(([min, max]) => decimalBelow(max, min)),
      Option.map(([min, max]): Finding => ({
        keys: { max: collapsed(max), min: collapsed(min) },
        law: "Aria value range",
      })),
      Option.toArray,
    ),
  (node, overlay) => {
    const attribute = cardinalityBounds.get(node.kind);
    const bound = typedValueOf(overlay.view, node.id, "response-identifier");
    if (!overlay.isItem || attribute === undefined || Option.isNone(bound)) {
      return [];
    }

    const most = countAttribute(overlay, node, attribute);
    const response = (overlay.declared.get(bound.value) ?? []).find(
      ({ kind }) => kind === "qti-response-declaration",
    );
    const cardinality =
      response === undefined ? "" : Option.getOrElse(cardinalityOf(overlay, response), () => "");
    if (cardinality !== "single") {
      return [];
    }

    if (Option.exists(most, (count) => count === 0n || count > 1n)) {
      return [
        {
          keys: {
            attribute,
            cardinality,
            identifier: bound.value,
            most: Option.match(most, { onNone: () => "", onSome: String }),
          },
          law: "Binding cardinality",
        },
      ];
    }

    // Reading 169: "The GapMatchInteraction must be bound to a response variable with base-type
    // directedPair and either single or multiple cardinality, depending on the number of gaps"
    // (info §5.57): each gap takes a pair of its own, so two or more gaps take a multiple response.
    // The gaps are the ones the interaction is nearest to, an included fragment's among them, as
    // the spliced view holds them, each with its identifier, which a choice is read by.
    const gaps =
      node.kind === "qti-gap-match-interaction"
        ? overlay.view.members.filter(
            (member) =>
              member.kind === "qti-gap" &&
              member.nearest === node.id &&
              Option.isSome(valueOf(overlay.view, member.id, "identifier")),
          ).length
        : 0;

    return gaps > 1
      ? [
          {
            keys: { cardinality, gaps: String(gaps), identifier: bound.value },
            law: "Binding cardinality",
          },
        ]
      : [];
  },
  (node, overlay) => {
    const named = typedValueOf(overlay.view, node.id, "outcome-identifier");
    if (
      !(
        overlay.isItem || Option.exists(overlay.laws.testRoot, (kind) => kind === overlay.rootKind)
      ) ||
      Option.isNone(named) ||
      !overlay.laws.grammar.references.contentReference.rows.some(
        (row) => row.kind === node.kind && row.attribute === "outcome-identifier",
      )
    ) {
      return [];
    }

    const outcome = (overlay.declared.get(named.value) ?? []).find(
      ({ kind }) => kind === "qti-outcome-declaration",
    );
    if (outcome === undefined) {
      // A built-in session variable's name has no declaration. A feedback may name only one that
      // stands as an outcome ("Feedback reference", over `ContentReference`): of the item root's
      // rows, `completionStatus`, a single identifier (reading 77), so this types nothing the
      // reference law accepts. `numAttempts` and `duration` stand as responses and
      // `QTI_CONTEXT` as the context, which "Feedback reference" alone refuses, as the import's
      // rows do (the built-in-roots differential).
      const at = { root: "qti-assessment-item", variable: named.value };
      const builtIn = overlay.laws.grammar.references.builtIn.lookup(at);
      const builtInBase = Option.map(
        overlay.laws.grammar.references.builtInBaseType.lookup(at),
        ({ baseType }) => baseType,
      );

      return Option.isSome(builtIn) &&
        builtIn.value.declaration === "qti-outcome-declaration" &&
        !(
          Option.contains(builtInBase, "identifier") &&
          (builtIn.value.cardinality === "single" || builtIn.value.cardinality === "multiple")
        )
        ? [
            {
              keys: {
                ...Option.match(builtInBase, {
                  onNone: () => ({}),
                  onSome: (held) => ({ baseType: held }),
                }),
                cardinality: builtIn.value.cardinality,
                identifier: named.value,
              },
              law: "Feedback outcome type",
            },
          ]
        : [];
    }

    // A test's own feedback naming an outcome the test declares is typed with the test's other
    // content references, over every document the test reads (`contentBreachesOf`,
    // `#pantry/test/oracle-laws/tests.ts`); a built-in it names is typed above.
    if (!overlay.isItem) {
      return [];
    }

    // §5.49.1: "an outcome variable that must have a base-type of identifier and be of either
    // single or multiple cardinality". Each half judges the outcome where what it reads spells
    // something (spec readings 158 and 159): its cardinality where it has one, a record's being
    // neither; its base type where it has one. One unwritten, or spelling nothing, is AL3's,
    // Declaration base type's or its value domain's alone (the orchestrator's ruling of
    // 2026-11-06; lane NIL's audit, B11 and B12).
    const cardinality = cardinalityOf(overlay, outcome);
    const baseType = baseTypeOf(overlay, outcome);

    return Option.exists(cardinality, (held) => held !== "single" && held !== "multiple") ||
      Option.isSome(typeBreach(baseType, (held) => held === "identifier"))
      ? [
          {
            keys: {
              ...Option.match(baseType, {
                onNone: () => ({}),
                onSome: (held) => ({ baseType: held }),
              }),
              ...Option.match(cardinality, {
                onNone: () => ({}),
                onSome: (held) => ({ cardinality: held }),
              }),
              identifier: named.value,
            },
            law: "Feedback outcome type",
          },
        ]
      : [];
  },
  (node, overlay) => {
    const named = typedValueOf(overlay.view, node.id, "template-identifier");
    if (
      !overlay.isItem ||
      node.kind === "qti-template-variable" ||
      Option.isNone(named) ||
      !overlay.laws.grammar.references.contentReference.rows.some(
        (row) => row.kind === node.kind && row.attribute === "template-identifier",
      )
    ) {
      return [];
    }

    const template = (overlay.declared.get(named.value) ?? []).find(
      ({ kind }) => kind === "qti-template-declaration",
    );
    if (template === undefined) {
      return [];
    }

    // Each half judges the template where what it reads spells something (spec readings 158 and
    // 159, decision 432), as "Feedback outcome type" judges an outcome: its cardinality where it
    // has one, a record's being neither; its base type where it has one. One unwritten, or
    // spelling nothing, is AL3's, Declaration base type's or its value domain's alone (lane NIL's
    // audit, B11 and B12).
    const cardinality = cardinalityOf(overlay, template);
    const baseType = baseTypeOf(overlay, template);

    return Option.exists(cardinality, (held) => held !== "single" && held !== "multiple") ||
      Option.isSome(typeBreach(baseType, (held) => held === "identifier"))
      ? [
          {
            keys: {
              ...Option.match(baseType, {
                onNone: () => ({}),
                onSome: (held) => ({ baseType: held }),
              }),
              ...Option.match(cardinality, {
                onNone: () => ({}),
                onSome: (held) => ({ cardinality: held }),
              }),
              identifier: named.value,
              kind: node.kind,
            },
            law: "Template variable type",
          },
        ]
      : [];
  },
  (node, overlay) =>
    node.kind === "qti-associable-hotspot" &&
    node.parentKind === "qti-graphic-gap-match-interaction" &&
    Option.contains(typedValueOf(overlay.view, node.id, "shape"), "default")
      ? [{ keys: {}, law: "Graphic gap match default hotspot" }]
      : [],
];

/**
 * Evaluate the overlay laws of §1.7 a document states alone: O1's id key and an item's label
 * tools, O2's declaration key, O3's one binding per response (reading 92), and
 * {@link overlayLaws} over every node.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @param assembledCatalogs - The ids of the `qti-catalog`s its assembly places beyond its own
 *   (spec reading 117), none for a document judged alone.
 * @returns The breaches.
 */
const overlayBreaches = (
  view: View,
  laws: Laws,
  assembledCatalogs: ReadonlySet<string>,
): readonly Breach[] => {
  // A declaration whose identifier is unwritten, or outside its value domain, names no variable:
  // AL3 or that domain refuses it alone, and it shares no name with another declaration that names
  // nothing (spec readings 152 and 157). A name is the identifier as its type reads it, collapsed.
  const declarations = view.members.flatMap((node) =>
    laws.grammar.references.declarationKind.has(node.kind)
      ? Option.toArray(typedValueOf(view, node.id, "identifier")).map((name) => ({ name, node }))
      : [],
  );
  const declared = new Map(
    [...Map.groupBy(declarations, ({ name }) => name)].map(
      ([name, held]) => [name, held.map(({ node }) => node)] as const,
    ),
  );
  const root = view.childrenOf.get(view.self)?.find(({ kind }) => laws.elements.has(kind));
  const overlay: Overlay = {
    declared,
    isItem: Option.exists(laws.itemRoot, (kind) => kind === root?.kind),
    laws,
    rootKind: root?.kind ?? "",
    view,
  };
  const at = (node: NodeId, { keys, law }: Finding): Breach => ({
    document: view.path,
    keys: {
      kind: view.byId.get(node)?.kind ?? "",
      node: pathOf(view, node),
      version: view.byId.get(node)?.version ?? "",
      ...keys,
    },
    law,
  });
  const ids = Map.groupBy(idsOf(view, laws), ({ id }) => id);
  // Label tools: "If an item uses labels then values for the associated toolName and toolVersion
  // characteristics must also be provided", of each label whose characteristic's description says
  // so (reading 128): every element's but the ones of readerLabels, and the item root's own in
  // 3.0.1 alone (3.0.1's §4.1.3 says it of the item's own label, 3.0.0's does not).
  const missingTools =
    overlay.isItem && root !== undefined
      ? ["tool-name", "tool-version"].filter((name) => Option.isNone(valueOf(view, root.id, name)))
      : [];
  const labelled =
    missingTools.length === 0
      ? []
      : view.members.filter(
          ({ id, kind, version }) =>
            (id === root?.id ? version === "3.0.1" : !readerLabels.has(kind)) &&
            Option.isSome(valueOf(view, id, "label")),
        );
  // Reading R9-a: "Use only one card for any particular named support in a catalog" (§5.26.1), a
  // support compared by its collapsed value, and "Only one of the CardEntry instances can have a
  // default designation" (§5.27.2), an entry designating where its collapsed `default` is true or 1.
  const cards = Map.groupBy(
    view.members.flatMap((node) =>
      node.kind === "qti-card"
        ? Option.toArray(Option.map(valueOf(view, node.id, "support"), collapsed)).map(
            (support) => ({
              node,
              support,
            }),
          )
        : [],
    ),
    ({ node, support }) => `${node.parent} ${support}`,
  );
  const designated = Map.groupBy(
    view.members.filter(
      (node) =>
        node.kind === "qti-card-entry" &&
        Option.contains(
          Option.flatMap(Option.map(valueOf(view, node.id, "default"), collapsed), booleanOf),
          true,
        ),
    ),
    ({ parent }) => parent,
  );
  // Reading R9-a and 117: a `data-catalog-idref` names a `qti-catalog` of its assembly (§5.28.1,
  // §5.15.9): its document with every fragment spliced in, and every document its assembly places
  // whole, as "Idref target" resolves a token. The token is compared collapsed, as an IDREF is; an
  // ID of any other element does not serve. Only an attribute with an IDREF token is read, as
  // "Idref target" reads it: one the schema does not check, or an empty one, names nothing.
  const catalogIds = new Set([
    ...[...ids].flatMap(([id, held]) =>
      held.some(({ node }) => view.byId.get(node)?.kind === "qti-catalog") ? [id] : [],
    ),
    ...assembledCatalogs,
  ]);
  const catalogRefs = view.members.flatMap((node) =>
    (view.attributesOf.get(node.id) ?? [])
      .filter(
        (attribute) =>
          attribute.name === "data-catalog-idref" &&
          referencesOf(attribute, compiledOf(laws, attribute)).length > 0,
      )
      .map((attribute) => ({ node, token: collapsed(attribute.lexical) }))
      .filter(({ token }) => !catalogIds.has(token)),
  );
  // Reading 92: "Each response variable declared may be bound to one and only one interaction",
  // so in an item no two of the bindings Binding declared reads, each interaction's
  // `response-identifier` and `string-identifier` whatever the types it binds (readings 75 and
  // 172), name one response. A string identifier binds "a second response variable" (§5.48.2,
  // §5.162.3), so one that names its interaction's response binds it twice, as the schema's key
  // over `BoundVariable` counts it (the old `string-identifier-distinct`).
  const bindings = overlay.isItem
    ? Map.groupBy(
        view.members.flatMap((node) =>
          Option.isSome(laws.grammar.kinds.interaction.lookup({ kind: node.kind }))
            ? bindingNames.flatMap((attribute) =>
                Option.toArray(typedValueOf(view, node.id, attribute)).map((identifier) => ({
                  identifier,
                  node,
                })),
              )
            : [],
        ),
        ({ identifier }) => identifier,
      )
    : new Map<
        string,
        readonly { readonly identifier: string; readonly node: FoldedNode<Composed> }[]
      >();
  // Reading 104 as amended: a choice's identifier names one choice of the nine classes in its
  // document, whichever interactions hold them and whichever classes they are, and no item
  // variable: no declaration of its document and, in an item, no built-in variable.
  const choices = view.members.flatMap((node) =>
    choiceClasses.has(node.kind)
      ? Option.toArray(typedValueOf(overlay.view, node.id, "identifier")).map((identifier) => ({
          identifier,
          node,
        }))
      : [],
  );
  const choiceNames = Map.groupBy(choices, ({ identifier, node }) => `${node.kind} ${identifier}`);
  const classFound = new Set(
    [...choiceNames.values()].flatMap((held) => held.slice(1).map(({ node }) => node.id)),
  );
  const sharedNames = Map.groupBy(choices, ({ identifier }) => identifier);
  const variableOf = (identifier: string): string | undefined => {
    if (declared.has(identifier)) {
      return "declared";
    }

    return overlay.isItem &&
      Option.isSome(
        laws.grammar.references.builtIn.lookup({ root: overlay.rootKind, variable: identifier }),
      )
      ? "built-in"
      : undefined;
  };

  return [
    // Reading 101: an id's binding is the set of elements that purport it, an attribute's element
    // or an ID-typed text's parent, and cvc-id.2 refuses a binding of more than one member.
    ...[...ids].flatMap(([id, held]) => {
      const owners = [...new Set(held.map(({ owner }) => owner))];

      return owners.slice(1).map((owner) =>
        at(owner, {
          keys: { first: pathOf(view, owners[0] ?? owner), id },
          law: "DocumentId key",
        }),
      );
    }),
    ...labelled.map(({ id }) =>
      at(id, { keys: { missing: missingTools.join(" ") }, law: "Label tools" }),
    ),
    ...[...cards.values()].flatMap((held) =>
      held.slice(1).map(({ node, support }) =>
        at(node.id, {
          keys: { first: pathOf(view, held[0]?.node.id ?? node.id), support },
          law: "Card support",
        }),
      ),
    ),
    ...[...designated.values()].flatMap((held) =>
      held.slice(1).map((node) =>
        at(node.id, {
          keys: { first: pathOf(view, held[0]?.id ?? node.id) },
          law: "Card default entry",
        }),
      ),
    ),
    ...catalogRefs.map(({ node, token }) =>
      at(node.id, { keys: { token }, law: "Catalog reference" }),
    ),
    ...[...bindings].flatMap(([identifier, held]) =>
      held.slice(1).map(({ node }) =>
        at(node.id, {
          keys: { first: pathOf(view, held[0]?.node.id ?? node.id), identifier },
          law: "Binding unique",
        }),
      ),
    ),
    ...[...declared].flatMap(([identifier, nodes]) =>
      nodes.slice(1).map(({ id }) => at(id, { keys: { identifier }, law: "Declaration key" })),
    ),
    ...[...choiceNames.values()].flatMap((held) =>
      held.slice(1).map(({ identifier, node }) =>
        at(node.id, {
          keys: { first: pathOf(view, held[0]?.node.id ?? node.id), identifier },
          law: "Choice identifier key",
        }),
      ),
    ),
    // The nine classes share one space of identifiers: a choice of one class beside one of another
    // breaks the key too, at each member after the first the per-class grouping has not found.
    ...[...sharedNames.values()].flatMap((held) =>
      held
        .slice(1)
        .filter(({ node }) => !classFound.has(node.id))
        .map(({ identifier, node }) =>
          at(node.id, {
            keys: { first: pathOf(view, held[0]?.node.id ?? node.id), identifier },
            law: "Choice identifier key",
          }),
        ),
    ),
    ...choices.flatMap(({ identifier, node }) =>
      Option.toArray(Option.fromUndefinedOr(variableOf(identifier))).map((variable) =>
        at(node.id, { keys: { identifier, variable }, law: "Choice not variable" }),
      ),
    ),
    ...view.members.flatMap((node) =>
      overlayLaws.flatMap((law) => law(node, overlay).map((finding) => at(node.id, finding))),
    ),
  ];
};

/**
 * Evaluate every law of §1.3 to §1.5 and the document overlays of §1.7 over one folded document.
 *
 * @param path - The document's path in its package.
 * @param rows - Its folded rows.
 * @param laws - The grammar's tables.
 * @param assembled - The ids of the document's assembly beyond its own, which its IDREFs may name
 *   (spec reading 117), none for a document judged alone.
 * @param assembledCatalogs - Those of `assembled` whose owner is a `qti-catalog`, which its
 *   `data-catalog-idref`s may name (spec reading 117), none for a document judged alone.
 * @returns The breaches: the node laws in their order, the child sets, the attribute laws, the
 *   laws over the whole document, then the overlays.
 */
export const documentBreaches = (
  path: string,
  rows: FoldedRows<Composed>,
  laws: Laws,
  assembled: ReadonlySet<string> = new Set(),
  assembledCatalogs: ReadonlySet<string> = new Set(),
): readonly Breach[] => {
  const typed = typedReadingOf(laws);
  const view = viewOf(path, rows, typed);

  return [
    ...nodeLaws.flatMap((law) =>
      (law.over === "nodes" ? rows.nodes : view.members).flatMap((node) =>
        Option.toArray(law.breaks(node, view, laws)).map((keys): Breach => ({
          document: path,
          keys: {
            id: node.id,
            kind: node.kind,
            node: pathOf(view, node.id),
            parentKind: node.parentKind,
            version: node.version,
            ...keys,
          },
          law: law.law,
        })),
      ),
    ),
    ...attributeBreaches(view, laws, assembled),
    ...wholeBreaches(view, laws, assembled),
    ...overlayBreaches(view, laws, assembledCatalogs),
    ...lawDocumentBreaches(path, rows, laws.grammar, typed),
  ];
};

/**
 * One document a manifest lists, read: its path, the resources that list it, what the package laws
 * read of its root element, and its folded rows, or the refusal of a fold that has none.
 */
interface Listed {
  /**
   * Its rows indexed for the laws, less what the folds refused, and the breach of each refusal.
   */
  readonly folded: Folded;
  /**
   * The collapsed `identifier` its root element carries, none when it carries none.
   */
  readonly identifier: Option.Option<string>;
  readonly path: string;
  /**
   * The resource whose type it is read as ({@link typingResource}, reading 162).
   */
  readonly resource: ResourceOf;
  /**
   * Every resource that lists it, in the manifest's order: each one's records describe it where
   * its type is an item's or a test's, whatever type it is read as.
   */
  readonly resources: Arr.NonEmptyReadonlyArray<ResourceOf>;
  /**
   * The kind of its root element.
   */
  readonly rootKind: string;
  /**
   * Its XDM tree as shred gives it, which an including document splices in place (reading 117).
   */
  readonly tree: XdmDocument<Composed>;
}

/**
 * A resource of a manifest as the package laws read it: its node, identifier, type and href, its
 * href resolved, and its files' hrefs resolved.
 */
interface ResourceOf {
  readonly files: readonly ResolvedHref[];
  /**
   * The `ResourceType` handle its `type` spells, none for a type no version admits.
   */
  readonly handle: Option.Option<string>;
  readonly href: Option.Option<string>;
  readonly identifier: string;
  readonly node: FoldedNode<Composed>;
  /**
   * Its href resolved (reading 102: its launch parameters name no other file), none for a resource
   * with no href.
   */
  readonly resolved: Option.Option<ResolvedHref>;
  readonly type: string;
}

/**
 * Read the whitespace class an href's value is read under before it resolves: its declared type's,
 * a union's read as `preserve`, and `collapse` for an attribute no declaration states.
 *
 * @param key - The attribute's `version kind name`.
 * @returns The class.
 */
const hrefWhiteSpaceOf = (key: string): OracleWhiteSpace =>
  Option.match(Option.fromUndefinedOr(declaredTypes.get(key)), {
    onNone: () => "collapse",
    onSome: ({ whiteSpace }) => (whiteSpace === "union" ? "preserve" : whiteSpace),
  });

/**
 * The entry path an href resolves to in the package, none for one outside it.
 *
 * @param resolved - The href resolved.
 * @returns Its entry path.
 */
const entryPathAt = ({ resolution }: ResolvedHref): Option.Option<string> =>
  resolution.scope === "entry" ? Option.some(resolution.path) : Option.none();

/**
 * List a manifest's resources.
 *
 * @param manifest - The manifest's view.
 * @param grammar - The composed grammar, whose `ResourceType` roster a type is read under.
 * @returns Its `cp:resource` elements in document order, each with its `cp:file` children's hrefs.
 */
const resourcesOf = (manifest: View, grammar: ComposedGrammar): readonly ResourceOf[] =>
  manifest.members
    .filter(({ kind }) => kind === "cp:resource")
    .map((node) => {
      const type = Option.getOrElse(valueOf(manifest, node.id, "type"), () => "");

      const href = valueOf(manifest, node.id, "href");

      return {
        files: (manifest.childrenOf.get(node.id) ?? [])
          .filter(({ kind }) => kind === "cp:file")
          .flatMap(({ id }) =>
            Option.toArray(valueOf(manifest, id, "href")).map((lexical) =>
              resolvedAt(manifest, id, lexical),
            ),
          ),
        handle: Option.liftPredicate(type, (value) => grammar.package.resourceType.has(value)),
        href,
        identifier: collapsed(Option.getOrElse(valueOf(manifest, node.id, "identifier"), () => "")),
        node,
        resolved: href.pipe(Option.map((lexical) => resolvedAt(manifest, node.id, lexical))),
        type,
      };
    });

/**
 * Name the documents a manifest lists: each resource whose type `RootOfType` maps to a root kind,
 * through the entry path its `href` resolves to (readings 93 and 102). A resource with no `href`
 * names no document, and one whose `href` resolves outside the package names none either, which
 * "Document entry" refuses ({@link packageBreaches}).
 *
 * @param resources - The manifest's resources.
 * @param grammar - The composed grammar.
 * @returns Each document's path with its resource, in manifest order.
 */
const documentsOf = (
  resources: readonly ResourceOf[],
  grammar: ComposedGrammar,
): readonly { readonly path: string; readonly resource: ResourceOf }[] =>
  resources.flatMap((resource) => {
    const listsDocuments = Option.exists(resource.handle, (type) =>
      grammar.package.rootOfType.rows.some((row) => row.type === type),
    );

    return listsDocuments
      ? Option.toArray(resource.resolved.pipe(Option.flatMap(entryPathAt))).map((at) => ({
          path: at,
          resource,
        }))
      : [];
  });

/**
 * Choose the resource whose type a path's document is read as, of those that name it (readings 93
 * and 162): the first, in the manifest's order, whose type `RootOfType` pairs with the root's kind,
 * and the first of all where none does. Every other type's href then names no document of its
 * type, "Document entry" alone, and RootOfType breaks only where no resource that names the path
 * bears its root out, whatever order they are listed in. The sort is stable, so the resources
 * whose type the root bears out come first, each group in the manifest's order.
 *
 * @param resources - The resources that name the path, in the manifest's order.
 * @param rootKind - The kind of the document's root.
 * @param grammar - The composed grammar.
 * @returns The resource.
 */
const typingResource = (
  resources: Arr.NonEmptyReadonlyArray<ResourceOf>,
  rootKind: string,
  grammar: ComposedGrammar,
): ResourceOf =>
  Arr.headNonEmpty(
    Arr.sortWith(
      resources,
      ({ handle }) =>
        !Option.exists(handle, (type) =>
          Option.isSome(grammar.package.rootOfType.lookup({ root: rootKind, type })),
        ),
      Order.Boolean,
    ),
  );

/**
 * Collect the text of every descendant of a node of one kind.
 *
 * @param view - The document.
 * @param node - The ancestor.
 * @param kind - The descendants' kind.
 * @returns Their text content, collapsed, in document order. An `entry` names its document, so
 *   the law reads it in the document identifier's value space (`UniqueIdentifierDType`, an `xs:ID`,
 *   whose whitespace collapses), not as the `CharacterString` it is written as (reading 62).
 */
const descendantTexts = (view: View, node: FoldedNode<Composed>, kind: string): readonly string[] =>
  view.members
    .filter((member) => member.kind === kind && ancestorsOf(view, member).includes(node))
    .map(({ id }) => collapsed(contentOf(view, id)));

/**
 * The kinds whose `href` names a document merged into the one that holds it (reading 85): a
 * section ref, a facade for the section it names (information model §7.5), and an XInclude,
 * "treated as if it was actually an instance of the root element of the fragment" (§2.12).
 */
const including: ReadonlySet<string> = new Set(["qti-assessment-section-ref", "xi:include"]);

/**
 * The kinds an include is the information model's Include under (reading 114): the parents whose
 * content model holds an explicit `xi:include` particle, by the composed grammar.
 */
const includeParentsCache = new WeakMap<ComposedGrammar, ReadonlySet<string>>();

/**
 * Read the kinds an include is the information model's Include under.
 *
 * @param grammar - The composed grammar.
 * @returns The parents' kinds.
 */
const includeParentsOf = (grammar: ComposedGrammar): ReadonlySet<string> => {
  const held = includeParentsCache.get(grammar);
  if (held !== undefined) {
    return held;
  }

  const parents: ReadonlySet<string> = new Set(grammar.include.includeParent.handles);
  includeParentsCache.set(grammar, parents);

  return parents;
};

/**
 * Whether a node merges the document its href names into its own (reading 85): a section ref, or an
 * include under a parent the information model gives an Include (reading 114). An include in
 * wildcard content is foreign content, read as written.
 *
 * @param grammar - The composed grammar.
 * @param node - The node.
 * @param node.kind - Its kind.
 * @param node.parentKind - Its parent's kind.
 * @returns Whether it does.
 */
const merges = (
  grammar: ComposedGrammar,
  node: { readonly kind: string; readonly parentKind: string },
): boolean =>
  including.has(node.kind) &&
  (node.kind !== "xi:include" || includeParentsOf(grammar).has(node.parentKind));

/**
 * Find the inclusion cycles among a package's documents (reading 85): each chain of section refs
 * and includes, in any mix, that leads from a listed document back to it, over the documents the
 * manifest lists. Each cycle is found once, from its least path, and two refs of one document that
 * are not nested are no cycle. An include counts where the information model gives its parent an
 * Include (reading 114); one in wildcard content is read as written.
 *
 * @param documents - The documents the manifest lists, read.
 * @param grammar - The composed grammar, whose include parents an include counts under.
 * @returns Each cycle's paths, from its least, in the order the chain visits them.
 */
const inclusionCycles = (
  documents: readonly Listed[],
  grammar: ComposedGrammar,
): readonly (readonly string[])[] => {
  const edges = new Map<string, readonly string[]>();
  for (const { folded, path } of documents) {
    for (const view of Option.toArray(folded.view)) {
      edges.set(path, [
        ...(edges.get(path) ?? []),
        ...view.members
          .filter((member) => merges(grammar, member))
          .flatMap(({ id }) =>
            Option.toArray(valueOf(view, id, "href")).flatMap((href) =>
              Option.toArray(entryPathAt(resolvedAt(view, id, href))),
            ),
          ),
      ]);
    }
  }

  const cycles = new Map<string, readonly string[]>();
  const visit = (chain: readonly string[]): void => {
    const [start] = chain;
    const at = chain.at(-1);
    for (const next of at === undefined ? [] : (edges.get(at) ?? [])) {
      if (next === start && start !== undefined) {
        if (chain.every((held) => held >= start)) {
          cycles.set(spaced(chain), chain);
        }
      } else if (!chain.includes(next) && edges.has(next)) {
        visit([...chain, next]);
      }
    }
  };
  for (const from of [...edges.keys()].toSorted()) {
    visit([from]);
  }

  return [...cycles.values()];
};

/**
 * Whether a `srcset` is one image candidate, its URL alone between any outer whitespace (reading
 * 102, `#pantry/qti/package.ts` `srcsetCandidatePattern`): no comma, and no whitespace between
 * its first and last characters that are not whitespace.
 *
 * @param lexical - The attribute's lexical form.
 * @returns Whether it is.
 */
const oneCandidate = (lexical: string): boolean => {
  const inner = lexical.replace(/^[\t\n\r ]+/u, "").replace(/[\t\n\r ]+$/u, "");

  return !/[,\t\n\r ]/u.test(inner);
};

/**
 * Evaluate R6 and the reference half of the stated limit over each listed document (readings 102
 * and 103): every attribute of the grammar's reference census, and the string value of every
 * element of its text census (`textReferenceKinds`, spec reading R9-b), is resolved with the
 * `xml:base` values in scope ({@link resolvedAt}); one the representation reads no name from, and a
 * `srcset` of more than one candidate or with a descriptor, breaks "Href form"; and each that
 * resolves in the package names an entry ("File exists", IMS Content Packaging 1.2,
 * InterchangePackage (d)), a stimulus ref's a stimulus.
 *
 * @param documents - The documents the manifest lists, read.
 * @param entries - The package's entry paths.
 * @param grammar - The composed grammar, whose `ReferenceAttribute` is the census.
 * @returns The breaches, document by document in manifest order.
 */
const referenceBreaches = (
  documents: readonly Listed[],
  entries: ReadonlySet<string>,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const rootKinds = new Map(documents.map((listed) => [listed.path, listed.rootKind] as const));

  return documents.flatMap(({ folded, path }) => {
    if (Option.isNone(folded.view)) {
      return [];
    }

    const view = folded.view.value;
    const breach = (law: LawName, keys: Keys): Breach => ({
      document: path,
      keys: { node: "", ...keys },
      law,
    });
    const textReferences = view.members.flatMap((member) =>
      textReferenceKinds
        .filter(({ kind }) => kind === member.kind)
        .map(({ whiteSpace }) => {
          const lexical = stringValueOf(view, member);

          return {
            form: "uri" as const,
            lexical,
            member,
            resolution: resolvedAt(view, member.id, lexical, { whiteSpace }).resolution,
          };
        }),
    );
    const references = view.members.flatMap((member) =>
      [...(view.valuesOf.get(member.id) ?? new Map<string, string>())].flatMap(([name, lexical]) =>
        Option.toArray(
          grammar.references.referenceAttribute.lookup({
            kind: member.kind,
            name,
            version: member.version,
          }),
        ).map(({ form }) => ({
          form,
          lexical,
          member,
          resolution: resolvedAt(view, member.id, lexical, {
            srcset: form === "srcset",
            whiteSpace: hrefWhiteSpaceOf(`${member.version} ${member.kind} ${name}`),
          }).resolution,
        })),
      ),
    );
    const resolved = [...references, ...textReferences];

    return [
      ...resolved
        .filter(
          ({ form, lexical, resolution }) =>
            resolution.scope === "unresolved" || (form === "srcset" && !oneCandidate(lexical)),
        )
        .map(({ lexical, member, resolution }) =>
          breach("Href form", {
            href: lexical,
            limit: resolution.scope === "unresolved" ? resolution.limit : "srcset",
            node: pathOf(view, member.id),
          }),
        ),
      ...resolved.flatMap(({ member, resolution }) =>
        resolution.scope !== "entry" || entries.has(resolution.path)
          ? []
          : [breach("File exists", { from: pathOf(view, member.id), path: resolution.path })],
      ),
      ...resolved.flatMap(({ member, resolution }) =>
        member.kind !== "qti-assessment-stimulus-ref" ||
        resolution.scope !== "entry" ||
        rootKinds.get(resolution.path) === "qti-assessment-stimulus"
          ? []
          : [
              breach("Stimulus ref target", {
                node: pathOf(view, member.id),
                path: resolution.path,
              }),
            ],
      ),
    ];
  });
};

/**
 * Each content model's automaton as the include-root law compares positions in it: the positions
 * that follow each position, the positions each follows, and the positions a family of the model
 * may end on, by `model position`.
 */
interface Automata {
  readonly ends: ReadonlySet<string>;
  readonly follows: ReadonlyMap<string, readonly string[]>;
  readonly precedes: ReadonlyMap<string, readonly string[]>;
}

/**
 * The automata, read once per grammar.
 */
const automataCache = new WeakMap<ComposedGrammar, Automata>();

/**
 * Read every content model's automaton off the composed grammar's `Follow` and `Last`.
 *
 * @param grammar - The composed grammar.
 * @returns The automata.
 */
const automataOf = (grammar: ComposedGrammar): Automata => {
  const held = automataCache.get(grammar);
  if (held !== undefined) {
    return held;
  }

  const { rows } = grammar.content.follow;
  const automata: Automata = {
    ends: new Set(grammar.content.last.rows.map(({ model, position }) => `${model} ${position}`)),
    follows: new Map(
      [...Map.groupBy(rows, ({ from, model }) => `${model} ${from}`)].map(
        ([at, to]) => [at, to.map((row) => row.to).toSorted()] as const,
      ),
    ),
    precedes: new Map(
      [...Map.groupBy(rows, ({ model, to }) => `${model} ${to}`)].map(
        ([at, from]) => [at, from.map((row) => row.from).toSorted()] as const,
      ),
    ),
  };
  automataCache.set(grammar, automata);

  return automata;
};

/**
 * Read the positions a kind takes under a family: its one position, or a shared kind's positions.
 *
 * @param grammar - The composed grammar.
 * @param key - The family and the kind.
 * @returns The positions, none for a kind the family does not admit.
 */
const positionsUnder = (grammar: ComposedGrammar, key: ChildKey): readonly string[] =>
  Option.match(admittedPosition(grammar)(key), {
    onNone: () => [],
    onSome: (position) =>
      position === 0
        ? grammar.content
            .sharedPositions({ kind: key.child, parent: key.parent, version: key.version })
            .map(String)
        : [String(position)],
  });

/**
 * Write a position's place in its family's automaton: what follows it, what it follows, and whether
 * the family may end on it. A kind at a position of the include's signature is accepted in the
 * include's place by every family the include is accepted in.
 *
 * @param grammar - The composed grammar.
 * @param model - The family's content model.
 * @param position - The position.
 * @returns The signature.
 */
const signatureOf = (grammar: ComposedGrammar, model: string, position: string): string => {
  const { ends, follows, precedes } = automataOf(grammar);
  const at = `${model} ${position}`;

  return `${(follows.get(at) ?? []).join(",")} | ${(precedes.get(at) ?? []).join(",")} | ${String(ends.has(at))}`;
};

/**
 * Decide whether an include under a parent may stand for a root kind (reading 114), independently
 * of the grammar's choice-group reading: the root takes a position of the parent's model whose
 * signature is the include's own.
 *
 * @param grammar - The composed grammar.
 * @param version - The schema version.
 * @param parent - The include's parent's kind.
 * @param root - The fragment's root kind.
 * @returns Whether it may.
 */
const standsFor = (
  grammar: ComposedGrammar,
  version: SchemaVersion,
  parent: string,
  root: string,
): boolean => {
  const model = Option.getOrElse(contentModelOf(grammar.content, { parent, version }), () => "");
  const own = new Set(
    positionsUnder(grammar, { child: "xi:include", parent, version }).map((position) =>
      signatureOf(grammar, model, position),
    ),
  );

  return (
    root !== "xi:include" &&
    positionsUnder(grammar, { child: root, parent, version }).some((position) =>
      own.has(signatureOf(grammar, model, position)),
    )
  );
};

/**
 * One site of a listed document (reading 85): a section ref or an include the information model
 * reads, its href as written, whether that href resolves outside the package, the path it resolves
 * to and the listed document there.
 */
interface SiteOf {
  readonly document: Listed;
  readonly external: boolean;
  readonly href: Option.Option<string>;
  readonly node: FoldedNode<Composed>;
  readonly path: Option.Option<string>;
  readonly target: Option.Option<Listed>;
  readonly view: View;
}

/**
 * Find every site of the listed documents, each resolved as its `ReferencePath` is.
 *
 * @param documents - The documents the manifest lists, read.
 * @param grammar - The composed grammar.
 * @returns The sites, document by document in manifest order.
 */
const sitesOf = (documents: readonly Listed[], grammar: ComposedGrammar): readonly SiteOf[] => {
  const byPath = new Map(documents.map((listed) => [listed.path, listed] as const).toReversed());

  return documents.flatMap((document) => {
    if (Option.isNone(document.folded.view)) {
      return [];
    }

    const view = document.folded.view.value;

    return view.members
      .filter((member) => merges(grammar, member))
      .map((node): SiteOf => {
        const href = valueOf(view, node.id, "href");
        const resolved = href.pipe(Option.map((lexical) => resolvedAt(view, node.id, lexical)));
        const path = resolved.pipe(Option.flatMap(entryPathAt));

        return {
          document,
          external: Option.exists(resolved, ({ resolution }) => resolution.scope === "external"),
          href,
          node,
          path,
          target: path.pipe(Option.flatMap((at) => Option.fromNullishOr(byPath.get(at)))),
          view,
        };
      });
  });
};

/**
 * The include parents whose include splices its fragment in place, as the oracle reads reading 117
 * itself: every parent the composed grammar gives an Include (reading 114) but a section, since an
 * include in a section follows reading 86's rule for a section document ("includes in a section
 * follow it"), a site of the test's assembly that writes each element once, so its document is
 * judged as written. The schema states its own list (`#pantry/qti/tests.ts` `splicingParents`), and
 * `splicing-parents.oracle.test.ts` holds the two equal, so a bug in either shows there and is not
 * shared.
 *
 * @param grammar - The composed grammar.
 * @returns The parents' kinds.
 */
export const splicingParentsOf = (grammar: ComposedGrammar): ReadonlySet<string> =>
  new Set([...includeParentsOf(grammar)].filter((parent) => parent !== "qti-assessment-section"));

/**
 * Decide whether an include under a parent is spliced in place ({@link splicingParentsOf}).
 *
 * @param grammar - The composed grammar.
 * @param parent - The include's parent's kind.
 * @returns Whether it is.
 */
const splices = (grammar: ComposedGrammar, parent: string): boolean =>
  splicingParentsOf(grammar).has(parent);

/**
 * Decide whether a site splices its target in place: an include outside a section whose target is
 * listed and whose root the include may stand for.
 *
 * @param grammar - The composed grammar.
 * @param site - The site.
 * @returns The target, none for a site that splices nothing.
 */
const splicedTarget = (grammar: ComposedGrammar, site: SiteOf): Option.Option<Listed> =>
  site.node.kind === "xi:include" && splices(grammar, site.node.parentKind)
    ? site.target.pipe(
        Option.filter((target) =>
          standsFor(grammar, site.node.version, site.node.parentKind, target.rootKind),
        ),
      )
    : Option.none();

/**
 * Map each listed document to the documents its includes splice in place (reading 117,
 * {@link splicedTarget}), the package-level producers' reading of the merged document: a test's
 * references read every fragment the test or a section document it places splices.
 *
 * @param documents - The documents the manifest lists, read.
 * @param grammar - The composed grammar.
 * @returns Each splicing document's path, with its spliced documents' paths in site order.
 */
const splicedPathsOf = (
  documents: readonly Listed[],
  grammar: ComposedGrammar,
): ReadonlyMap<string, readonly string[]> => {
  const spliced = new Map<string, readonly string[]>();
  for (const site of sitesOf(documents, grammar)) {
    for (const target of Option.toArray(splicedTarget(grammar, site))) {
      spliced.set(site.document.path, [...(spliced.get(site.document.path) ?? []), target.path]);
    }
  }

  return spliced;
};

/**
 * Write a breach at a site, in its including document.
 *
 * @param site - The site.
 * @param law - The law it breaks.
 * @param keys - What the breach says beside the site's node.
 * @returns The breach.
 */
const siteBreach = (site: SiteOf, law: LawName, keys: Keys): Breach => ({
  document: site.document.path,
  keys: { node: pathOf(site.view, site.node.id), ...keys },
  law,
});

/**
 * Take one step of the interaction contexts' fixpoint: each named document's context is the
 * interaction the first site that names it stands in, its own document's nearest, or, outside
 * every interaction of that document, its document's present context.
 *
 * @param sites - Every site of the package.
 * @param contexts - The present contexts, by document path, as `path node`.
 * @returns The next contexts.
 */
const interactionContextsOf = (
  sites: readonly SiteOf[],
  contexts: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> => {
  const next = new Map<string, string>();
  for (const site of sites) {
    const local =
      site.node.nearestKind === "document"
        ? contexts.get(site.document.path)
        : `${site.document.path} ${pathOf(site.view, site.node.nearest)}`;
    for (const target of Option.toArray(site.target)) {
      if (local !== undefined && !next.has(target.path)) {
        next.set(target.path, local);
      }
    }
  }

  return next;
};

/**
 * Decide whether two steps of the fixpoint agree.
 *
 * @param held - The earlier contexts.
 * @param next - The later contexts.
 * @returns Whether they agree.
 */
const sameContexts = (
  held: ReadonlyMap<string, string>,
  next: ReadonlyMap<string, string>,
): boolean => next.size === held.size && [...next].every(([at, near]) => held.get(at) === near);

/**
 * Evaluate the include laws over the listed documents (readings 114, 115 and 117):
 *
 * - **"Include target":** an include the information model reads names, by an href this
 *   representation resolves, a document the manifest lists; an href that resolves outside the
 *   package (a scheme, a leading `/`, a climb above the root) names nothing to list, is stored and
 *   never fetched, and is judged no further (reading 115); an href that resolves to a path no entry
 *   holds is "File exists"'s alone (the references' law), which the import's `SitePath` refuses as
 *   its row is inserted, so it breaks no include law;
 * - **"Include root":** that document's root is a kind the include may stand for ({@link standsFor});
 * - **"Document entry"**, of a section ref: a section ref that writes an href names, by an href this
 *   representation resolves, a section document the manifest lists (information model §7.5, a
 *   section ref "functions as a facade for the qti-assessment-section to which it refers"); one
 *   with no href is AL3's, one whose path no entry holds "File exists"'s, and one whose href
 *   resolves outside the package "Remote section ref"'s;
 * - **"Remote section ref"**, a stated limit (reading 170): no section ref's href resolves outside
 *   the package, since the import never fetches the section it would name, which is the test's own
 *   content;
 * - **"Include fragment identifier":** no include's href carries a `#` after its path (XInclude 1.0
 *   §3.1), wherever the include stands;
 * - **"Fragment context"**, a stated limit: the sites that name one document stand inside one
 *   interaction or outside every interaction, each site's interaction its own document's nearest,
 *   or, outside every interaction of its document, its document's context's.
 *
 * @param documents - The documents the manifest lists, read.
 * @param grammar - The composed grammar.
 * @param entryPaths - The paths of the package's entries.
 * @returns The breaches, each at the including document.
 */
const inclusionBreaches = (
  documents: readonly Listed[],
  grammar: ComposedGrammar,
  entryPaths: ReadonlySet<string>,
): readonly Breach[] => {
  const sites = sitesOf(documents, grammar);
  const includes = documents.flatMap(({ folded, path }) =>
    Option.match(folded.view, {
      onNone: () => [],
      onSome: (view) =>
        view.members
          .filter(({ kind }) => kind === "xi:include")
          .flatMap((node) =>
            Option.toArray(valueOf(view, node.id, "href")).flatMap((href) =>
              href.includes("#")
                ? [
                    {
                      document: path,
                      keys: { href, node: pathOf(view, node.id) },
                      law: "Include fragment identifier" as const,
                    },
                  ]
                : [],
            ),
          ),
    }),
  );
  let contexts: ReadonlyMap<string, string> = new Map();
  for (let round = 0; round <= documents.length; round += 1) {
    const next = interactionContextsOf(sites, contexts);
    const settled = sameContexts(contexts, next);
    contexts = next;
    if (settled) {
      break;
    }
  }

  const placementsOf = Map.groupBy(
    sites.flatMap((site) =>
      Option.toArray(site.target).map((target) => ({
        at:
          site.node.nearestKind === "document"
            ? (contexts.get(site.document.path) ?? "outside every interaction")
            : `${site.document.path} ${pathOf(site.view, site.node.nearest)}`,
        target,
      })),
    ),
    ({ target }) => target.path,
  );

  return [
    ...sites.flatMap((site) => {
      if (Option.exists(site.path, (path) => !entryPaths.has(path))) {
        return [];
      }

      if (site.node.kind !== "xi:include" && site.external) {
        return [
          siteBreach(site, "Remote section ref", { href: Option.getOrElse(site.href, () => "") }),
        ];
      }

      if (site.node.kind !== "xi:include") {
        return Option.isSome(site.href) &&
          !Option.exists(site.target, ({ rootKind }) => rootKind === "qti-assessment-section")
          ? [
              siteBreach(site, "Document entry", {
                href: Option.getOrElse(site.href, () => ""),
                path: Option.getOrElse(site.path, () => ""),
              }),
            ]
          : [];
      }

      return Option.match(site.target, {
        onNone: () =>
          site.external
            ? []
            : [
                siteBreach(site, "Include target", {
                  href: Option.getOrElse(site.href, () => ""),
                  path: Option.getOrElse(site.path, () => ""),
                }),
              ],
        onSome: (target) =>
          standsFor(grammar, site.node.version, site.node.parentKind, target.rootKind)
            ? []
            : [
                siteBreach(site, "Include root", {
                  parentKind: site.node.parentKind,
                  path: target.path,
                  root: target.rootKind,
                  version: site.node.version,
                }),
              ],
      });
    }),
    ...includes,
    ...[...placementsOf].flatMap(([path, placed]) => {
      const distinct = [...new Set(placed.map(({ at }) => at))];
      const [first, second] = distinct;

      return first !== undefined &&
        second !== undefined &&
        distinct.some((at) => at !== "outside every interaction")
        ? [
            {
              document: path,
              keys: { first, node: "", path, second },
              law: "Fragment context" as const,
            },
          ]
        : [];
    }),
  ];
};

/**
 * Read a closed attribute of a written element, by its handle.
 *
 * @param element - The element, as shred gives it.
 * @param handle - The attribute's handle.
 * @returns Its lexical form, or none.
 */
const closedValueOf = (
  element: XdmClosedElement<Composed>,
  handle: string,
): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find(({ name }) => name._tag === "closed" && name.handle === handle)
      ?.lexical,
  );

/**
 * Splice a document's includes in place (reading 117, XInclude's result infoset): each include the
 * information model reads outside a section whose target is listed and whose root the include may
 * stand for is replaced by its target's root element, its own includes spliced in turn, unless the
 * target is already on the chain, which "Inclusion cycle" refuses.
 *
 * @param grammar - The composed grammar.
 * @param byPath - The listed documents by path.
 * @param element - The element whose children are spliced.
 * @param path - The path of the document the element is written in, its includes' base.
 * @param chain - The documents on the way down, the outermost first.
 * @returns The element, its includes replaced.
 */
const splicedElement = <E extends XdmClosedElement<Composed>>(
  grammar: ComposedGrammar,
  byPath: ReadonlyMap<string, Listed>,
  element: E,
  path: string,
  chain: readonly string[],
  above: readonly string[] = [],
): E => {
  const bases = [...above, ...Option.toArray(closedValueOf(element, "xml:base"))];
  const spliceChild = (child: XdmChild<Composed>, parent: string): XdmChild<Composed> => {
    if (child._tag !== "element") {
      return "children" in child
        ? { ...child, children: child.children.map((inner) => spliceChild(inner, child._tag)) }
        : child;
    }

    if (child.kind === "xi:include" && splices(grammar, parent)) {
      const href = closedValueOf(child, "href");
      const resolution = href.pipe(
        Option.map((value) =>
          resolveAttribute({
            bases: [...bases, ...Option.toArray(closedValueOf(child, "xml:base"))],
            document: path,
            lexical: value,
            srcset: false,
            whiteSpace: "collapse",
          }),
        ),
      );
      const resolved = Option.getOrUndefined(
        resolution.pipe(
          Option.flatMap((at) => (at.scope === "entry" ? Option.some(at.path) : Option.none())),
        ),
      );
      const target = resolved === undefined ? undefined : byPath.get(resolved);
      if (
        target !== undefined &&
        !chain.includes(target.path) &&
        standsFor(grammar, target.tree.version, parent, target.rootKind)
      ) {
        return splicedElement(grammar, byPath, target.tree.root, target.path, [
          ...chain,
          target.path,
        ]);
      }
    }

    return splicedElement(grammar, byPath, child, path, chain, bases);
  };

  return {
    ...element,
    children: element.children.map((child) => spliceChild(child, element.kind)),
  };
};

/**
 * Collect the documents a merged document is written in (spec reading 117): the listed documents
 * themselves, and every document their includes splice in, transitively, each once.
 *
 * @param listed - The documents at one path.
 * @param spliced - Each document's spliced targets, by its path.
 * @returns The documents, the listed ones first.
 */
const mergedDocumentsOf = (
  listed: readonly Listed[],
  spliced: ReadonlyMap<string, readonly { readonly target: Listed }[]>,
): readonly Listed[] => {
  const reached = new Map(listed.map((document) => [document.path, document] as const));
  const pending = [...listed];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    for (const { target } of spliced.get(next.path) ?? []) {
      if (!reached.has(target.path)) {
        reached.set(target.path, target);
        pending.push(target);
      }
    }
  }

  return [...listed, ...[...reached.values()].filter((document) => !listed.includes(document))];
};

/**
 * Whether an element is a `qti-catalog-info` or sits under one: catalog content is outside the
 * content body (information model §5.28), so R26 does not count its `xml:lang` (reading R9-c).
 *
 * @param view - The document.
 * @param id - The element's node.
 * @returns Whether the element is in a catalog.
 */
const inCatalog = (view: View, id: NodeId): boolean => {
  const element = view.byId.get(id);

  return (
    element !== undefined &&
    [element, ...ancestorsOf(view, element)].some(({ kind }) => kind === "qti-catalog-info")
  );
};

/**
 * Evaluate R26, `document-lang` (law "Document lang"; QTI 3.0 Metadata §2.7.1.3: "There must be
 * one value for each of the languages referred to by the language attributes on the associated
 * assessmentItem, test or object bank and its 'bodyElements'"): each language an item's or a test's
 * `xml:lang` states is listed by every general category of each record that is a child of the
 * `cp:metadata` of a resource whose `href` names the document, as every listed document's resource
 * does (`documentsOf`, readings 93 and 102). An item's `xml:lang` forms are its merged document's
 * (spec reading 117): its own, and those of every fragment its includes splice in; a fragment a
 * test places is a known under-refusal, which reading 117 lists.
 *
 * An `xml:lang` is read by its value, its form collapsed, and states a language only where that
 * value is a language tag: an empty one or one of whitespace alone states none (XML 1.0 §2.12), and
 * one that is no tag identifies none (RFC 5646 §2.1), so its value domain refuses it alone (spec
 * reading 174); a LOM `language` is its text as written. The two compare as tags, without regard to
 * case (RFC 5646 §2.1.1).
 *
 * @param documents - The documents the manifest lists that shredded.
 * @param manifest - The manifest's view.
 * @param grammar - The composed grammar, whose include roots say which includes splice.
 * @returns One breach for each (document, `xml:lang` form) some such category does not list, at
 *   the document.
 */
const documentLangBreaches = (
  documents: readonly Listed[],
  manifest: View,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const languagesOf = (general: FoldedNode<Composed>): readonly string[] =>
    (manifest.childrenOf.get(general.id) ?? [])
      .filter(({ kind }) => kind === "lom:language")
      .map(({ id }) => caseFolded(contentOf(manifest, id)));
  const spliced = Map.groupBy(
    sitesOf(documents, grammar).flatMap((site) =>
      Option.toArray(splicedTarget(grammar, site)).map((target) => ({
        from: site.document.path,
        target,
      })),
    ),
    ({ from }) => from,
  );

  return [
    ...Map.groupBy(
      documents.filter(({ resources }) => resources.some(({ type }) => lomNamedTypes.has(type))),
      ({ path }) => path,
    ),
  ].flatMap(([path, listed]) => {
    const generals = listed
      .flatMap(({ resources }) => resources.filter(({ type }) => lomNamedTypes.has(type)))
      .flatMap((resource) =>
        manifest.members.filter((member) => {
          const record = manifest.byId.get(member.parent);
          const owner = record === undefined ? undefined : manifest.byId.get(record.parent);

          return (
            member.kind === "lom:general" &&
            record?.kind === "lom:lom" &&
            owner?.kind === "cp:metadata.resource" &&
            owner.parent === resource.node.id
          );
        }),
      );
    const merged = listed.some(({ rootKind }) => rootKind === "qti-assessment-item")
      ? mergedDocumentsOf(listed, spliced)
      : listed;
    const forms = new Set(
      merged.flatMap(({ folded }) =>
        Option.match(folded.view, {
          onNone: () => [],
          onSome: (view) =>
            [...view.valuesOf]
              .filter(([id]) => !inCatalog(view, id))
              .flatMap(([, named]) => Option.toArray(Option.fromNullishOr(named.get("xml:lang")))),
        }),
      ),
    );

    return [...forms].flatMap((form): readonly Breach[] => {
      const value = caseFolded(collapsed(form));
      const missing = generals.filter((general) => !languagesOf(general).includes(value));

      return !languageTagForm.test(value) || missing.length === 0
        ? []
        : [
            {
              document: path,
              keys: {
                generals: spaced(missing.map(({ id }) => pathOf(manifest, id))),
                lang: form,
                node: "",
              },
              law: "Document lang",
            },
          ];
    });
  });
};

/**
 * Evaluate the laws of §1.6 and O6 over a package: the stated limit `href-form` first, then
 * `root-type-reverse`, `file-listed`, `href-listed`, `entry-kind`, `file-exists`,
 * `manifest-id-space`, `self-dependency` and `lom-identifier`, and reading 85's `inclusion-cycle`
 * ({@link inclusionCycles}), then R26's `document-lang` ({@link documentLangBreaches}).
 *
 * @param input - The package.
 * @param input.files - Its entries.
 * @param input.manifest - Its manifest's view.
 * @param input.documents - The documents its manifest lists that shredded.
 * @param input.missing - The document paths its manifest lists that are no entry.
 * @param laws - The grammar's tables.
 * @returns The breaches.
 */
const packageBreaches = (
  input: {
    readonly documents: readonly Listed[];
    readonly files: readonly PackageFile[];
    readonly manifest: View;
    readonly missing: readonly string[];
  },
  laws: Laws,
): readonly Breach[] => {
  const { grammar } = laws;
  const { manifest } = input;
  const breach = (law: LawName, keys: Keys): Breach => ({
    document: manifest.path,
    keys: { node: "", ...keys },
    law,
  });
  const resources = resourcesOf(manifest, grammar);
  const listedFiles = new Set(
    resources.flatMap(({ files }) => files.flatMap((file) => Option.toArray(entryPathAt(file)))),
  );
  const entryPaths = new Set(input.files.map(({ path }) => path));
  const fileNodes = manifest.members.flatMap((member) =>
    member.kind === "cp:file"
      ? Option.toArray(valueOf(manifest, member.id, "href")).map((href) => ({
          href,
          member,
          resolved: resolvedAt(manifest, member.id, href),
        }))
      : [],
  );
  const documentTyped = (resource: ResourceOf): boolean =>
    Option.exists(resource.handle, (type) =>
      grammar.package.rootOfType.rows.some((row) => row.type === type),
    );
  // The types each path is read under: the manifest's own, `manifest` (readings 146 and 176), then
  // each type a resource names the path under.
  const typesAt = new Map<string, ReadonlySet<string>>([[manifest.path, new Set(["manifest"])]]);
  for (const { path, resource } of documentsOf(resources, grammar)) {
    typesAt.set(path, new Set([...(typesAt.get(path) ?? []), resource.type]));
  }
  const manifestNode = manifest.members.find(({ kind }) => kind === "cp:manifest");
  const manifestId = Option.fromNullishOr(manifestNode).pipe(
    Option.flatMap(({ id }) => valueOf(manifest, id, "identifier")),
    Option.map(collapsed),
  );

  return [
    ...fileNodes
      .filter(({ resolved }) => resolved.resolution.scope === "unresolved")
      .map(({ href, member }) => breach("Href form", { href, node: pathOf(manifest, member.id) })),
    ...resources.flatMap((resource) =>
      Option.toArray(resource.href)
        .filter(() =>
          Option.exists(resource.resolved, ({ resolution }) => resolution.scope === "unresolved"),
        )
        .map((href) =>
          breach("Href form", {
            href,
            identifier: resource.identifier,
            node: pathOf(manifest, resource.node.id),
          }),
        ),
    ),
    ...input.documents.flatMap((document) =>
      Option.exists(document.resource.handle, (type) =>
        Option.isSome(grammar.package.rootOfType.lookup({ root: document.rootKind, type })),
      )
        ? []
        : [
            breach("RootOfType", {
              path: document.path,
              rootKind: document.rootKind,
              type: document.resource.type,
            }),
          ],
    ),
    ...input.files
      .filter(({ kind, path }) => kind === "file" && !listedFiles.has(path))
      .map(({ path }) => breach("File listed", { path })),
    ...resources.flatMap((resource) =>
      Option.toArray(resource.href)
        .filter(() =>
          Option.exists(
            resource.resolved,
            (own) =>
              !resource.files.some(
                (file) => file.resolution.scope === own.resolution.scope && file.path === own.path,
              ),
          ),
        )
        .map((href) =>
          breach("Href listed", {
            files: spaced(resource.files.map(({ path }) => path)),
            href,
            identifier: resource.identifier,
            node: pathOf(manifest, resource.node.id),
          }),
        ),
    ),
    ...input.missing.map((path) => breach("Document entry", { path })),
    ...resources
      .filter(documentTyped)
      .flatMap((resource) => Option.toArray(resource.resolved))
      .filter(({ resolution }) => resolution.scope !== "entry")
      .map(({ path }) => breach("Document entry", { path })),
    // A path two types name, the manifest's `manifest` among them, is one document, of the type its
    // root bears out where one does (readings 93, 146 and 162), so another's href names no document
    // of its type: "Document entry" alone, and the document is judged once, where its sites place
    // it.
    ...[...typesAt]
      .filter(([, types]) => types.size > 1)
      .map(([path, types]) =>
        breach("Document entry", { path, types: spaced([...types].toSorted()) }),
      ),
    ...fileNodes.flatMap(({ member, resolved }) =>
      Option.toArray(entryPathAt(resolved))
        .filter((path) => !entryPaths.has(path))
        .map((path) => breach("File exists", { from: pathOf(manifest, member.id), path })),
    ),
    ...inclusionCycles(input.documents, grammar).map((chain) =>
      breach("Inclusion cycle", { chain: spaced(chain), path: chain[0] ?? "" }),
    ),
    ...inclusionBreaches(input.documents, grammar, entryPaths),
    ...resources
      .filter(({ identifier }) => Option.exists(manifestId, (id) => id === identifier))
      .map((resource) =>
        breach("Manifest id space", {
          identifier: resource.identifier,
          node: pathOf(manifest, resource.node.id),
        }),
      ),
    ...manifest.members.flatMap((member) => {
      const resource = manifest.byId.get(member.parent);
      const ref = valueOf(manifest, member.id, "identifierref");
      const own =
        resource === undefined ? Option.none() : valueOf(manifest, resource.id, "identifier");

      return member.kind === "cp:dependency" &&
        Option.isSome(ref) &&
        Option.isSome(own) &&
        ref.value === own.value
        ? [breach("Self dependency", { identifier: ref.value, node: pathOf(manifest, member.id) })]
        : [];
    }),
    ...input.documents.flatMap((document): readonly Breach[] => {
      // The records of each item or test resource that lists the document, whatever type it is
      // read as (reading 162), each a `lom:lom` of the resource's own `cp:metadata` (spec reading
      // 62): a `cp:file`'s record describes the file ("The scope of Metadata is the parent
      // container class only", IMS Content Packaging 1.2 §6.7).
      const owners = new Set(
        document.resources.flatMap(({ node, type }) => (lomNamedTypes.has(type) ? [node] : [])),
      );
      const loms = manifest.members.filter((member) => {
        const [metadata, owner] = ancestorsOf(manifest, member);

        return (
          member.kind === "lom:lom" &&
          metadata?.kind === "cp:metadata.resource" &&
          owner !== undefined &&
          owners.has(owner)
        );
      });
      // The record's object is the document its resource names where its root is an item or a
      // test, whatever the resource's type, which RootOfType judges on its own (QTI 3.0 Metadata
      // §2.7.1.1: "the identifier of the associated item, test or object bank"; reading 93); a
      // document of another root is no object, and no entry matches it.
      const identifier = objectRoots.has(document.rootKind) ? document.identifier : Option.none();

      return loms.flatMap((lom) => {
        const entries = manifest.members
          .filter(
            (member) =>
              member.kind === "lom:identifier" &&
              ancestorsOf(manifest, member).some(
                (above) =>
                  above.kind === "lom:general" && ancestorsOf(manifest, above).includes(lom),
              ),
          )
          .flatMap((holder) => descendantTexts(manifest, holder, "lom:entry"));

        return entries.length === 0 || Option.exists(identifier, (id) => entries.includes(id))
          ? []
          : [
              breach("LomObjectIdentifier", {
                entries: JSON.stringify(entries),
                ...Option.match(identifier, {
                  onNone: () => ({}),
                  onSome: (id) => ({ identifier: id }),
                }),
                node: pathOf(manifest, lom.id),
              }),
            ];
      });
    }),
    ...documentLangBreaches(input.documents, manifest, grammar),
    ...referenceBreaches(input.documents, entryPaths, grammar),
  ];
};

/**
 * Draw the id of a node of one document: a uuid whose groups spell the document's number and the
 * node's, so a breach names its node by its place.
 *
 * @param document - The document's number in its package, the manifest 0.
 * @returns The id of the node numbered by its argument.
 */
const idsFor =
  (document: number) =>
  (index: number): NodeId =>
    `00000000-0000-4000-8${document.toString(16).padStart(3, "0")}-${index.toString(16).padStart(12, "0")}`;

/**
 * Read one document's bytes as crust's reader does, its refusals named by the rule the importer
 * names them by.
 *
 * @param path - The document's path in its package.
 * @param bytes - Its bytes.
 * @returns The tree, or the reader's refusal.
 */
const readDocument = (path: string, bytes: Uint8Array): Effect.Effect<XmlDocument, CodecRefusal> =>
  readXml(bytes).pipe(
    Effect.mapError((failure): CodecRefusal => ({
      _tag: "CodecRefusal",
      detail: failure.message,
      document: path,
      rule: failure._tag === "WellFormednessError" ? "well-formedness" : "reader-refusal",
    })),
  );

/**
 * Shred one document under the package's version, its refusals named by their rules: an attribute
 * its element's kind admits under no name or open class is `attribute-admission`, any other name
 * shred cannot represent `unmodeled-vocabulary`.
 *
 * @param path - The document's path in its package.
 * @param document - The tree crust read.
 * @param version - The package's version.
 * @param grammar - The grammar shred reads through.
 * @returns The XDM tree, or the codec's refusal.
 */
const shredDocument = (
  path: string,
  document: XmlDocument,
  version: SchemaVersion,
  grammar: ShredGrammar<Composed>,
): Effect.Effect<XdmDocument<Composed>, CodecRefusal> =>
  shred(document, version, grammar).pipe(
    Effect.mapError((failure): CodecRefusal => {
      const rule = (): CodecRule => {
        if (failure._tag === "NotQti3") {
          return "not-qti3";
        }

        return failure.reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary";
      };

      return { _tag: "CodecRefusal", detail: failure.message, document: path, rule: rule() };
    }),
  );

/**
 * Write where a node sits in its document from its unfolded rows, as {@link pathOf} does from its
 * folded ones: each step from the document node, its own parent, down, as `kind[at]`.
 *
 * @param rows - The document's node rows.
 * @param id - The node's id.
 * @returns The path, `/` for the document node; the walk stops at a node it has already met.
 */
const rowPathOf = (rows: readonly NodeRow<Composed>[], id: string): string => {
  const byId = new Map<string, NodeRow<Composed>>(rows.map((row) => [row.id, row]));
  const steps: string[] = [];
  const seen = new Set<string>();
  let at = byId.get(id);
  while (at !== undefined && at.parent !== at.id && !seen.has(at.id)) {
    seen.add(at.id);
    steps.push(`${at.kind}[${String(at.at)}]`);
    at = byId.get(at.parent);
  }

  return `/${steps.toReversed().join("/")}`;
};

/**
 * Name the breach a fold's refusal is: a child with no `Admission` cell breaks N5's admission
 * (`admission`), an attribute with no `AttributeAdmission` cell AL1's (`attribute-admission`).
 *
 * @param path - The document's path in its package.
 * @param tree - The document.
 * @param idOf - The ids its fold drew.
 * @param refusal - The fold's refusal.
 * @returns The breach, at the node the refusal names.
 */
const refusalBreach = (
  path: string,
  tree: XdmDocument<Composed>,
  idOf: (index: number) => NodeId,
  refusal: FoldRefusal,
): Breach => {
  const node = rowPathOf(flatten(tree, idOf).nodes, refusal.node);

  return refusal._tag === "ChildUnadmitted"
    ? {
        document: path,
        keys: {
          id: refusal.node,
          kind: refusal.kind,
          node,
          parentKind: refusal.parent,
          version: refusal.version,
        },
        law: refusal.reason === "unadmitted" ? "N5 admitted" : "N5 Follow",
      }
    : {
        document: path,
        keys: {
          at: String(refusal.at),
          kind: refusal.kind,
          name: refusal.name,
          node,
          version: refusal.version,
        },
        law: "AL1 admission",
      };
};

/**
 * A document folded for the laws: its rows indexed, less each node or attribute a fold refused,
 * and the breach of each refusal.
 */
interface Folded {
  /**
   * The breach of each node or attribute the folds refused, in the order they met them.
   */
  readonly refusals: readonly Breach[];
  /**
   * Its rows indexed for the laws, none where the folds refused its root element.
   */
  readonly view: Option.Option<View>;
}

/**
 * Read the slots that lead from a document's root element down to one of its nodes: each node's
 * place among its parent's children, as `flatten` numbers them.
 *
 * @param tree - The document.
 * @param idOf - Draws the id of each node, as `fold` reads it.
 * @param node - The node's id, as a fold's refusal names it.
 * @returns Its slots below the root, empty for the root itself; none for a node the document does
 *   not hold.
 */
const slotsTo = (
  tree: XdmDocument<Composed>,
  idOf: (index: number) => NodeId,
  node: string,
): Option.Option<readonly number[]> => {
  const rows = flatten(tree, idOf);
  const byId = new Map<string, NodeRow<Composed>>(rows.nodes.map((row) => [row.id, row] as const));
  const slots: number[] = [];
  let row = byId.get(node);
  while (row !== undefined && row.parent !== rows.document.node) {
    slots.unshift(Number(row.at));
    row = byId.get(row.parent);
  }

  return row === undefined ? Option.none() : Option.some(slots);
};

/**
 * Rebuild an element with one of its descendants changed: the element the slots lead to, given to
 * `change`.
 *
 * @param element - The element.
 * @param slots - The slots from it down to the element to change, empty for itself.
 * @param change - The change.
 * @returns The element rebuilt.
 */
const changedAt = <E extends XdmElement<Composed>>(
  element: E,
  slots: readonly number[],
  change: (target: XdmElement<Composed>) => XdmElement<Composed>,
): E => {
  const [slot, ...rest] = slots;
  if (slot === undefined) {
    // SAFETY: each change spreads the element it is given and replaces only its children or its
    // attributes, so the element it returns keeps every field of E.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    return change(element) as E;
  }

  return {
    ...element,
    children: element.children.map((child, at) =>
      at === slot && "children" in child ? changedAt(child, rest, change) : child,
    ),
  };
};

/**
 * Set aside what a fold refused: the child and its subtree, or the attribute.
 *
 * @param tree - The document.
 * @param idOf - Draws the id of each node, as `fold` reads it.
 * @param refusal - The fold's refusal.
 * @returns The document without it; none where the refused node is the root element, which no
 *   document stands without.
 */
const withoutRefused = (
  tree: XdmDocument<Composed>,
  idOf: (index: number) => NodeId,
  refusal: FoldRefusal,
): Option.Option<XdmDocument<Composed>> =>
  Option.flatMap(slotsTo(tree, idOf, refusal.node), (slots) => {
    if (refusal._tag === "ChildUnadmitted") {
      const parent = slots.slice(0, -1);
      const slot = slots.at(-1);

      return slot === undefined
        ? Option.none()
        : Option.some({
            ...tree,
            root: changedAt(tree.root, parent, (element) => ({
              ...element,
              children: element.children.filter((_, at) => at !== slot),
            })),
          });
    }

    return Option.some({
      ...tree,
      root: changedAt(tree.root, slots, (element) => ({
        ...element,
        attributes: element.attributes.filter((_, at) => BigInt(at) !== refusal.at),
      })),
    });
  });

/**
 * Fold one shredded document and index its rows for the laws.
 *
 * A fold that meets a missing cell, a child its parent does not admit or an attribute its kind does
 * not admit, refuses that node. Its breach is kept, the child and its subtree or the attribute are
 * set aside, and the rest is folded again, until the document folds: so every other row of the
 * document is judged, and through the manifest every document it lists, and precedence picks among
 * every breach, as the importer writes every row and the database judges them all. The refused
 * subtree is the one part left unjudged, since no state places it; a refused root leaves no rows.
 *
 * @param path - The document's path in its package.
 * @param tree - The document.
 * @param idOf - Draws the id of each node, as `fold` reads it.
 * @param grammar - The closed relations the folds read.
 * @param typed - How an attribute's type reads its value.
 * @returns The document's rows and its refusals' breaches.
 */
const foldedOf = (
  path: string,
  tree: XdmDocument<Composed>,
  idOf: (index: number) => NodeId,
  grammar: FoldGrammar<Composed>,
  typed: TypedReading,
): Folded => {
  const refusals: Breach[] = [];
  let current: Option.Option<XdmDocument<Composed>> = Option.some(tree);
  while (Option.isSome(current)) {
    const folded = fold(current.value, idOf, grammar);
    if (Result.isSuccess(folded)) {
      return { refusals, view: Option.some(viewOf(path, folded.success, typed)) };
    }

    refusals.push(refusalBreach(path, current.value, idOf, folded.failure));
    current = withoutRefused(current.value, idOf, folded.failure);
  }

  return { refusals, view: Option.none() };
};

/**
 * Read the collapsed `identifier` of a document's root element.
 *
 * @param tree - The document.
 * @returns The identifier, none when the root carries none.
 */
const rootIdentifierOf = (tree: XdmDocument<Composed>): Option.Option<string> =>
  Option.fromNullishOr(
    tree.root.attributes.find(({ name }) => name._tag === "closed" && name.handle === "identifier"),
  ).pipe(Option.map(({ lexical }) => collapsed(lexical)));

/**
 * Find the schema version a manifest declares: the text of its root's `metadata` child's
 * `schemaversion` child, as written.
 *
 * @param manifest - The manifest crust read.
 * @returns The text, or none when it declares none.
 */
const declaredVersion = (manifest: XmlDocument): Option.Option<string> =>
  Option.fromNullishOr(
    manifest.root.children
      .flatMap((child) => (child.kind === "element" && child.local === "metadata" ? [child] : []))
      .flatMap((metadata) =>
        metadata.children.flatMap((child) =>
          child.kind === "element" && child.local === "schemaversion" ? [child] : [],
        ),
      )
      .map((found) =>
        found.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
      )
      .at(0),
  );

/**
 * One judged document's assembly, as Q5.13's instances place it (spec reading 117): the ids of the
 * documents its section refs and its sections' includes place, at any depth, beyond its own, which
 * its IDREFs may name ("Idref target" over the assembly), those of them whose owner is a
 * `qti-catalog`, which its `data-catalog-idref`s may name ("Catalog reference" over the assembly),
 * and the breaches of "DocumentId key"
 * across its instances. A test's assembly writes each element once however often its document is
 * placed (reading 86), and any other's once per placement.
 */
interface Assembly {
  readonly breaches: readonly Breach[];
  readonly catalogs: ReadonlySet<string>;
  readonly ids: ReadonlySet<string>;
}

/**
 * Decide whether a site places its target whole, an instance of its own, rather than splicing it
 * in place: a section ref, or an include under a section ({@link splicingParentsOf}).
 *
 * @param grammar - The composed grammar.
 * @param site - The site.
 * @returns Whether it does.
 */
const placesWhole = (grammar: ComposedGrammar, site: SiteOf): boolean =>
  site.node.kind !== "xi:include" || !splices(grammar, site.node.parentKind);

/**
 * Drop the breaches two assemblies report alike, a nested one's and its container's.
 *
 * @param breaches - The breaches.
 * @returns Each once, in their first order.
 */
const dedupedBreaches = (breaches: readonly Breach[]): readonly Breach[] => [
  ...new Map(
    breaches.map((held) => [JSON.stringify([held.document, held.law, held.keys]), held] as const),
  ).values(),
];

/**
 * Build every judged document's assembly ({@link Assembly}): its instances, itself and each
 * document a site of an instance places whole, in pre-order, a document already on the chain left
 * out (the chain is "Inclusion cycle"'s), each instance's ids its document's in place.
 *
 * @param grammar - The composed grammar.
 * @param byPath - The listed documents, by path.
 * @param sites - Every site of the package.
 * @param read - Each judged document's fold in place: its rows, where the fold kept its root, and
 *   its refusals.
 * @param laws - The law tables.
 * @returns Each judged document's assembly, by path.
 */
const assembliesOf = (
  grammar: ComposedGrammar,
  byPath: ReadonlyMap<string, Listed>,
  sites: readonly SiteOf[],
  read: ReadonlyMap<string, Folded>,
  laws: Laws,
): ReadonlyMap<string, Assembly> => {
  const views = new Map(
    [...read].flatMap(([path, { view }]) =>
      Option.toArray(view).map((held) => [path, held] as const),
    ),
  );
  const ids = new Map([...views].map(([path, view]) => [path, idsOf(view, laws)] as const));
  const placements = new Map<string, readonly string[]>();
  for (const site of sites.filter((held) => placesWhole(grammar, held))) {
    for (const target of Option.toArray(site.target)) {
      placements.set(site.document.path, [
        ...(placements.get(site.document.path) ?? []),
        target.path,
      ]);
    }
  }

  const instancesOf = (path: string, chain: readonly string[]): readonly string[] => [
    path,
    ...(placements.get(path) ?? []).flatMap((target) =>
      chain.includes(target) ? [] : instancesOf(target, [...chain, target]),
    ),
  ];

  return new Map(
    [...views].map(([head]) => {
      const instances = instancesOf(head, [head]);
      const once = byPath.get(head)?.rootKind === "qti-assessment-test";
      const carriers = instances.flatMap((path, at) =>
        (ids.get(path) ?? []).map(({ id, owner }) => ({
          id,
          instance: once ? path : String(at),
          owner,
          path,
        })),
      );
      const breaches = [...Map.groupBy(carriers, ({ id }) => id)].flatMap(([id, held]) => {
        const byInstance = new Map<string, (typeof held)[number]>();
        for (const carrier of held) {
          if (!byInstance.has(carrier.instance)) {
            byInstance.set(carrier.instance, carrier);
          }
        }

        const [first, ...others] = [...byInstance.values()];
        const firstView = first === undefined ? undefined : views.get(first.path);

        return first === undefined || firstView === undefined
          ? []
          : others.flatMap(({ owner, path }): readonly Breach[] => {
              const view = views.get(path);

              return view === undefined
                ? []
                : [
                    {
                      document: path,
                      keys: {
                        first: `${first.path} ${pathOf(firstView, first.owner)}`,
                        id,
                        kind: view.byId.get(owner)?.kind ?? "",
                        node: pathOf(view, owner),
                        version: view.byId.get(owner)?.version ?? "",
                      },
                      law: "DocumentId key",
                    },
                  ];
            });
      });

      return [
        head,
        {
          breaches,
          catalogs: new Set(
            instances
              .slice(1)
              .flatMap((path) =>
                (ids.get(path) ?? []).flatMap(({ id, owner }) =>
                  views.get(path)?.byId.get(owner)?.kind === "qti-catalog" ? [id] : [],
                ),
              ),
          ),
          ids: new Set(
            instances.slice(1).flatMap((path) => (ids.get(path) ?? []).map(({ id }) => id)),
          ),
        },
      ] as const;
    }),
  );
};

/**
 * Judge every listed document's own laws in place (reading 117): a document an include splices into
 * another is judged inside each document that splices it, and not alone; every other document is
 * judged with its includes spliced, as XInclude's result infoset reads it, so its included
 * fragments' content stands where it is included, binding its item's responses and counting among
 * its IDs. A fold's refusals are breaches beside the rest of the document's ({@link foldedOf}).
 *
 * Breaches inside spliced content are reported against the including document, at their path in
 * its merged tree.
 *
 * @param documents - The documents the manifest lists, read.
 * @param grammar - The composed grammar.
 * @param foldGrammar - The closed relations the folds read.
 * @param laws - The law tables.
 * @returns The breaches, document by document in manifest order.
 */
const inPlaceBreaches = (
  documents: readonly Listed[],
  grammar: ComposedGrammar,
  foldGrammar: FoldGrammar<Composed>,
  laws: Laws,
): readonly Breach[] => {
  const typed = typedReadingOf(laws);
  const sites = sitesOf(documents, grammar);
  const byPath = new Map(documents.map((listed) => [listed.path, listed] as const).toReversed());
  const placed = new Set(
    sites.flatMap((site) => Option.toArray(splicedTarget(grammar, site)).map(({ path }) => path)),
  );
  const splicing = new Set(
    sites.flatMap((site) =>
      Option.isSome(splicedTarget(grammar, site)) ? [site.document.path] : [],
    ),
  );
  const read = new Map(
    documents
      .flatMap((listed, index): readonly (readonly [string, Folded])[] => {
        if (Option.isNone(listed.folded.view)) {
          return [[listed.path, listed.folded]];
        }

        if (placed.has(listed.path)) {
          return [];
        }

        if (!splicing.has(listed.path)) {
          return [[listed.path, listed.folded]];
        }

        const tree: XdmDocument<Composed> = {
          ...listed.tree,
          root: splicedElement(grammar, byPath, listed.tree.root, listed.path, [listed.path]),
        };

        return [[listed.path, foldedOf(listed.path, tree, idsFor(index + 1), foldGrammar, typed)]];
      })
      .toReversed(),
  );
  const assemblies = assembliesOf(grammar, byPath, sites, read, laws);

  return [
    ...documents.flatMap((listed) =>
      Option.match(Option.fromUndefinedOr(read.get(listed.path)), {
        onNone: () => [],
        onSome: ({ refusals, view }) => [
          ...refusals,
          ...Option.match(view, {
            onNone: () => [],
            onSome: (held) =>
              documentBreaches(
                held.path,
                held.rows,
                laws,
                assemblies.get(listed.path)?.ids ?? new Set(),
                assemblies.get(listed.path)?.catalogs ?? new Set(),
              ),
          }),
        ],
      }),
    ),
    ...dedupedBreaches([...assemblies.values()].flatMap(({ breaches }) => breaches)),
  ];
};

/**
 * Judge a package as the importer will read it, and every law over its rows.
 *
 * The manifest is read and its schema version decoded, then the manifest and each document it
 * lists are read and shredded in manifest order: the first refusal of the reader, the codec or the
 * importer's `data-ssml` check (documents only, never the manifest) is the judgment, since no row
 * of the package is written. Otherwise every document is folded, and
 * the judgment is every breach: the package laws first, as the package's own rows are written
 * first, then each document's in manifest order. A document whose fold meets a missing cell has no
 * rows, so its breaches are that refusal alone; a manifest that does not fold lists nothing, and
 * its refusal is the judgment's one breach.
 *
 * @param files - The package's entries, as `readPackage` reads them.
 * @param grammar - The composed grammar.
 * @param laws - Its tables, from {@link lawsOf}.
 * @returns The judgment.
 */
export const judge = Effect.fn("oracle.judge")(function* judge(
  files: readonly PackageFile[],
  grammar: ComposedGrammar,
  laws: Laws,
): Effect.fn.Return<Judgment> {
  const shredGrammar = shredGrammarOf(grammar);
  const foldGrammar = foldGrammarOf(grammar);
  const typed = typedReadingOf(laws);
  const manifestFile = files.find(({ kind }) => kind === "manifest");
  if (manifestFile === undefined) {
    return {
      _tag: "CodecRefusal",
      detail: "the package has no imsmanifest.xml at its root",
      document: "",
      rule: "manifest-root",
    } satisfies CodecRefusal;
  }

  const outcome = yield* Effect.gen(function* readAll() {
    const manifestXml = yield* readDocument(manifestFile.path, manifestFile.bytes);
    const version = yield* Effect.fromResult(
      Result.mapError(
        versionOf(grammar.kinds.versions.handles, declaredVersion(manifestXml)),
        (error): CodecRefusal => ({
          _tag: "CodecRefusal",
          detail: error.message,
          document: manifestFile.path,
          rule: "not-qti3",
        }),
      ),
    );
    const manifestTree = yield* shredDocument(
      manifestFile.path,
      manifestXml,
      version,
      shredGrammar,
    );
    const manifest = foldedOf(manifestFile.path, manifestTree, idsFor(0), foldGrammar, typed);
    const listing = Option.match(manifest.view, {
      onNone: () => [],
      onSome: (view) => documentsOf(resourcesOf(view, grammar), grammar),
    });
    const byPath = new Map(files.map((file) => [file.path, file]));
    const documents: Listed[] = [];
    const missing: string[] = [];
    // A path is one document (reading 93), of the type its root bears out (reading 162), and the
    // manifest's is the manifest, read above (reading 146), so a resource naming it reads nothing
    // more.
    const read = new Set<string>([manifestFile.path]);
    for (const [index, { path, resource }] of listing.entries()) {
      const file = byPath.get(path);
      if (file === undefined) {
        missing.push(path);
      } else if (!read.has(path)) {
        read.add(path);

        const xml = yield* readDocument(path, file.bytes);
        const tree = yield* shredDocument(path, xml, version, shredGrammar);
        const breach = dataSsmlBreachIn(tree);
        if (Option.isSome(breach)) {
          return yield* Effect.fail<CodecRefusal>({
            _tag: "CodecRefusal",
            detail: `${path} at ${breach.value}: Data-SSML 1.0 does not admit the value`,
            document: path,
            rule: "attribute-lexical",
          });
        }

        const resources: Arr.NonEmptyReadonlyArray<ResourceOf> = [
          resource,
          ...listing
            .slice(index + 1)
            .flatMap((listed) => (listed.path === path ? [listed.resource] : [])),
        ];
        documents.push({
          folded: foldedOf(path, tree, idsFor(index + 1), foldGrammar, typed),
          identifier: rootIdentifierOf(tree),
          path,
          resource: typingResource(resources, tree.root.kind, grammar),
          resources,
          rootKind: tree.root.kind,
          tree,
        });
      }
    }

    return { documents, manifest, missing };
  }).pipe(Effect.result);

  if (outcome._tag === "Failure") {
    return outcome.failure;
  }

  const { documents, manifest, missing } = outcome.success;

  return Option.match(manifest.view, {
    onNone: (): Judged => ({
      _tag: "Judged",
      breaches: manifest.refusals,
      documents: [manifestFile.path],
    }),
    onSome: (view): Judged => ({
      _tag: "Judged",
      breaches: [
        ...packageBreaches({ documents, files, manifest: view, missing }, laws),
        ...manifest.refusals,
        ...documentBreaches(view.path, view.rows, laws),
        ...inPlaceBreaches(documents, grammar, foldGrammar, laws),
        ...lawPackageBreaches(
          {
            documents: documents.flatMap((listed) =>
              Option.match(listed.folded.view, {
                onNone: () => [],
                onSome: ({ rows }) => [
                  { path: listed.path, resourceType: listed.resource.type, rows },
                ],
              }),
            ),
            entries: files.map(({ path }) => path),
            manifest: { path: view.path, rows: view.rows },
            spliced: splicedPathsOf(documents, grammar),
          },
          grammar,
          typed,
        ),
      ],
      documents: [view.path, ...documents.map(({ path }) => path)],
    }),
  });
});

/**
 * Write a list for an explanation.
 *
 * @param members - The members.
 * @returns Them, comma separated, in braces.
 */
const inBraces = (members: readonly string[]): string => `{${members.join(", ")}}`;

/**
 * Write the counts an operator takes for an explanation.
 *
 * @param min - The fewest.
 * @param max - The most, `Infinity` for no most.
 * @returns The one count, "`min` or `max`", or "`min` or more" when `max` is not finite.
 */
const countsShown = (min: number, max: number): string => {
  if (!Number.isFinite(max)) {
    return `${String(min)} or more`;
  }

  return min === max ? String(min) : `${String(min)} or ${String(max)}`;
};

/**
 * The kinds that take a position of a parent's content model: those whose `Admission` row holds
 * it, and those `Symbol` places there.
 *
 * @param grammar - The composed grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param position - The position.
 * @returns The kinds, in roster order.
 */
const kindsAt = (
  grammar: ComposedGrammar,
  version: string,
  parent: string,
  position: string,
): readonly string[] => [
  ...new Set([
    ...grammar.admission.rows
      .filter(
        (row) => row.version === version && row.parent === parent && row.position === position,
      )
      .map(({ child }) => child),
    ...Option.match(grammar.content.sharedModelOf.lookup({ parent, version }), {
      onNone: () => [],
      onSome: ({ model }) =>
        grammar.content.symbol.rows
          .filter((row) => row.model === model && row.position === position)
          .map(({ kind }) => kind),
    }),
  ]),
];

/**
 * Explain a value against the domain it is read under: the values an enumeration admits where it
 * is outside them, the pattern it misses, or the bound its typed value lies outside.
 *
 * @param grammar - The composed grammar.
 * @param handle - The domain's handle, none when no cell gives one.
 * @param form - The lexical form as written.
 * @param where - What the value is read for, and in which version, as `cp:resource@type in 3.0.0`.
 * @returns The explanation.
 */
const domainExplained = (
  grammar: ComposedGrammar,
  handle: Option.Option<string>,
  form: string,
  where: string,
): string =>
  Option.match(
    handle.pipe(
      Option.flatMap((held) =>
        Option.fromNullishOr(grammar.attributes.domains.find((domain) => domain.handle === held)),
      ),
    ),
    {
      onNone: () =>
        Option.exists(handle, (held) => grammar.attributes.emptyDomains.includes(held))
          ? `${JSON.stringify(form)} is read under ${Option.getOrElse(handle, () => "")}, whose value space is empty: it holds the notations the schema declares, and no pinned schema declares one`
          : `${JSON.stringify(form)} is read under no value domain`,
      onSome: (domain) => {
        if (new RegExp(domain.pattern, patternFlags).test(form)) {
          return `${JSON.stringify(form)} is outside ${domain.handle}'s ${Option.match(
            boundBroken(domain, form),
            { onNone: () => "", onSome: ({ facet, value }) => `${facet} ${String(value)}` },
          )}`;
        }

        return domain.enumeration.length > 0
          ? `${JSON.stringify(form)} is not among the ${String(domain.enumeration.length)} values of ${where}: ${domain.enumeration.join(", ")}`
          : `${JSON.stringify(form)} is outside ${domain.handle}, whose pattern is ${domain.pattern}`;
      },
    },
  );

/**
 * Read a breach's version.
 *
 * @param keys - The breach's keys, `version` among them.
 * @param grammar - The composed grammar.
 * @returns The version, none for one the roster lacks.
 */
const keyedVersion = (keys: Keys, grammar: ComposedGrammar): Option.Option<SchemaVersion> =>
  Option.liftPredicate(field(keys, "version"), (version) => grammar.kinds.versions.has(version));

/**
 * The attributes a breach's kind admits in its version under its governing type, by position.
 *
 * @param keys - The breach's keys, `kind`, `governs` and `version` among them.
 * @param grammar - The composed grammar.
 * @returns The admitted names with their positions, none for a version the roster lacks.
 */
const admittedNames = (keys: Keys, grammar: ComposedGrammar) =>
  Option.match(keyedVersion(keys, grammar), {
    onNone: () => [],
    onSome: (version) =>
      admittedOf(
        grammar.attributes,
        grammar.kinds.attributeName,
        version,
        field(keys, "kind"),
        Option.fromNullishOr(keys["governs"]),
      ),
  });

/**
 * Explain a content reference that names no declaration of the kinds `ContentReference` allows it.
 *
 * @param keys - The breach's keys.
 * @param grammar - The composed grammar.
 * @returns The explanation.
 */
const referenceExplained = (keys: Keys, grammar: ComposedGrammar): string =>
  `${field(keys, "attribute")} names ${field(keys, "identifier")}, which no ${inBraces(
    grammar.references.contentReference.rows
      .filter(
        ({ attribute, kind }) =>
          kind === field(keys, "kind") && attribute === field(keys, "attribute"),
      )
      .map(({ declaration }) => declaration),
  )} declares`;

/**
 * Explain a character-data arm whose rows are not its nodes, once each.
 *
 * @param kind - The arm's kind.
 * @param keys - The breach's keys.
 * @returns The explanation.
 */
const armExplained = (kind: string, keys: Keys): string =>
  `${field(keys, "rows")} ${kind} rows over ${field(keys, "nodes")} ${kind} nodes`;

/**
 * Explain a breach from its keys and the grammar relations its law reads.
 */
type Explainer = (keys: Keys, grammar: ComposedGrammar) => string;

/**
 * Name the roots a resource type's documents may have, for an explanation: its one root, the count
 * of an included fragment's, or none.
 *
 * @param grammar - The composed grammar.
 * @param type - The resource type.
 * @returns The roots, as a phrase.
 */
const rootsExplained = (grammar: ComposedGrammar, type: string): string => {
  const roots = grammar.package.rootOfType.rows.filter((row) => row.type === type);
  const [first] = roots;

  if (first === undefined) {
    return "no document";
  }

  return roots.length === 1
    ? first.root
    : `a document whose root is one of ${String(roots.length)} kinds an include stands for`;
};

/**
 * One law of the oracle, in one place: its explanation, computed from a breach's keys and the
 * closed relations the law reads. `node` marks a law over node rows, which {@link nodeLaws} states
 * in the order the oracle evaluates them. Its rule and its source are the law catalog's
 * (`#pantry/vocab/laws.ts` `lawTable`, {@link ruleOf} and {@link lawSources}), under the same name.
 */
export interface OracleLaw {
  readonly explain: Explainer;
  readonly node?: true;
}

/**
 * The oracle's own laws, each by the law catalog's name for it.
 */
const ownLaws = {
  "AL1 admission": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} admits no ${field(keys, "name")} in ${field(keys, "version")}; it admits ${inBraces(
        admittedNames(keys, grammar).map(({ name }) => name),
      )}`,
  },
  "AL1 owner": {
    explain: (keys) =>
      field(keys, "ownerDocument") === ""
        ? `the attribute at slot ${field(keys, "at")} sits on a ${field(keys, "ownerKind") || "missing node"}, which is no element`
        : `the attribute's owner copy (${field(keys, "kind")}, ${field(keys, "version")}) is not its owner's (${field(keys, "ownerKind")}, ${field(keys, "ownerVersion")}, document ${field(keys, "ownerDocument")})`,
  },
  "AL2 count": {
    explain: (keys) =>
      `attributes ${field(keys, "attributes")} over ${field(keys, "rows")} attribute rows`,
    node: true,
  },
  "AL2 distinct": {
    explain: (keys) =>
      `${field(keys, "name")} takes position ${field(keys, "position")}, which attrs ${inBraces(membersOf(keys["attrsWas"]))} already holds, and no open class does`,
  },
  "AL2 fold": {
    explain: (keys) =>
      `attrs ${inBraces(membersOf(keys["attrs"]))} from attrsWas ${inBraces(membersOf(keys["attrsWas"]))}, where its predecessor's fold is ${inBraces(membersOf(keys["predecessorAttrs"]))}`,
  },
  "AL2 last slot": {
    explain: (keys) =>
      `attrs ${inBraces(membersOf(keys["attrs"]))}, where its last attribute's fold is ${inBraces(membersOf(keys["lastAttrs"]))}`,
    node: true,
  },
  "AL3 required": {
    explain: (keys, grammar) => {
      const missing = new Set(membersOf(keys["missing"]).map(Number));

      return `${field(keys, "kind")} lacks ${inBraces(
        admittedNames(keys, grammar)
          .filter(({ position }) => missing.has(position))
          .map(({ name }) => name),
      )}, which Required holds`;
    },
    node: true,
  },
  "AL4 data name": {
    explain: (keys) =>
      `the ${field(keys, "class")} attribute ${field(keys, "local")} of ${field(keys, "kind")} is a name outside reading 13's data- language`,
  },
  "AL4 declared data name": {
    explain: (keys) =>
      `the data-* attribute ${field(keys, "local")} of ${field(keys, "kind")} is a custom name for what the element declares`,
  },
  "AL4 open name key": {
    explain: (keys) =>
      `${field(keys, "openNames")} open names, ${field(keys, "distinct")} distinct by (node, uri, local)`,
  },
  "AL4 open names": {
    explain: (keys) =>
      `${field(keys, "openNames")} open names over ${field(keys, "openAttributes")} open-class attributes`,
  },
  "AL5 attribute count": {
    explain: (keys) =>
      Option.match(
        Option.fromNullishOr(attributeCounts.find(({ kind }) => kind === field(keys, "kind"))),
        {
          onNone: () => `${field(keys, "kind")} counts no attributes`,
          onSome: ({ max, min, names, reading }) =>
            `${field(keys, "kind")} carries ${inBraces(membersOf(keys["held"]))} of ${inBraces([...names])}, where reading ${String(reading)} asks for ${Number.isFinite(max) ? `${String(min)} to ${String(max)}` : `at least ${String(min)}`}`,
        },
      ),
    node: true,
  },
  "AreaMapping base type": {
    explain: (keys) =>
      `an area mapping of base type ${JSON.stringify(field(keys, "baseType"))}, where an area mapping maps points alone`,
  },
  "Aria value range": {
    explain: (keys) =>
      `${field(keys, "kind")}'s aria-valuemax ${field(keys, "max")} is below its aria-valuemin ${field(keys, "min")}`,
  },
  Arity: {
    explain: (keys, grammar) =>
      Option.match(grammar.operatorArity.lookup({ kind: field(keys, "kind") }), {
        onNone: () => `${field(keys, "kind")} has no OperatorArity row`,
        onSome: ({ max, min }) =>
          `${field(keys, "kind")} holds ${field(keys, "count")} expressions; OperatorArity admits ${String(min)} to ${String(max)}`,
      }),
  },
  "Attribute prefix": {
    explain: (keys) =>
      `${field(keys, "kind")}'s attribute ${field(keys, "name")} is written with the prefix ${JSON.stringify(field(keys, "prefix"))}, where a name in no namespace has none, an xml: name has xml, and a name in another namespace has a declared prefix other than xml and xmlns`,
  },
  "AttributeEntity owner": {
    explain: (keys) =>
      `an entity reference at offset ${field(keys, "offset")} of attribute ${field(keys, "attribute")} has no attribute row`,
  },
  "Binding cardinality": {
    explain: (keys) =>
      keys["gaps"] === undefined
        ? `${field(keys, "kind")}'s ${field(keys, "attribute")} is ${field(keys, "most")}, so it binds a response of multiple cardinality, and ${field(keys, "identifier")} is ${field(keys, "cardinality")}`
        : `the gap match interaction holds ${field(keys, "gaps")} gaps, each taking a pair of its own, so it binds a response of multiple cardinality, and ${field(keys, "identifier")} is ${field(keys, "cardinality")}`,
  },
  "Binding declared": {
    explain: (keys) =>
      `response-identifier names ${field(keys, "identifier")}, which no qti-response-declaration declares`,
  },
  "Binding unique": {
    explain: (keys) =>
      `${field(keys, "kind")} binds ${field(keys, "identifier")}, which ${field(keys, "first")} already binds; a response variable is bound to one interaction only`,
  },
  BindingFit: {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} binds ${field(keys, "identifier")}, of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}; BindingFit admits ${inBraces(
        grammar.bindingFit.rows
          .filter(({ kind }) => kind === field(keys, "kind"))
          .map(({ baseType, cardinality }) => `${baseType} ${cardinality}`),
      )}`,
  },
  "Branch forward": {
    explain: (keys) =>
      `a branch rule of ${field(keys, "owner")} names ${field(keys, "target")}, which does not lie after it and no shuffle orders the two`,
  },
  "Branch target": {
    explain: (keys) =>
      `a branch rule of ${field(keys, "owner")} names ${field(keys, "target")}, which is no exit and no part of its kind in its test part that its placement may reach`,
  },
  "Card default entry": {
    explain: (keys) =>
      `the entry ${field(keys, "node")} designates itself the default of its card, which ${field(keys, "first")} already does`,
  },
  "Card support": {
    explain: (keys) =>
      `the card ${field(keys, "node")} names the support ${JSON.stringify(field(keys, "support"))}, which ${field(keys, "first")} already names in its catalog`,
  },
  "Catalog reference": {
    explain: (keys) =>
      `the element ${field(keys, "node")} names ${JSON.stringify(field(keys, "token"))} as its catalog, which no catalog of its document is called`,
  },
  "Choice bounds": {
    explain: (keys) =>
      field(keys, "choices") === ""
        ? `${field(keys, "min")} ${field(keys, "least")} exceeds ${field(keys, "max")} ${field(keys, "most")}`
        : `${field(keys, "attribute")} ${field(keys, "count")} exceeds the ${field(keys, "choices")} choices ${field(keys, "kind")} holds`,
  },
  "Choice identifier key": {
    explain: (keys) =>
      `${field(keys, "kind")}'s identifier ${field(keys, "identifier")} is the identifier of the choice at ${field(keys, "first")}; no two choices of a document share an identifier, of one class or of two`,
  },
  "Choice not variable": {
    explain: (keys) =>
      `${field(keys, "kind")}'s identifier ${field(keys, "identifier")} names ${field(keys, "variable") === "built-in" ? "a built-in variable" : "a variable its document declares"}; a choice's identifier names no item variable`,
  },
  "Condition type": {
    explain: (keys) =>
      `the condition of ${field(keys, "parentKind")} is ${field(keys, "baseType")} ${field(keys, "cardinality")}, not boolean single`,
  },
  "Context variable reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
  },
  "Custom interaction version": {
    explain: (keys) =>
      `the custom interaction ${field(keys, "node")} stands in a 3.0.0 document, which holds none: portable custom interactions take their place`,
  },
  "Declaration base type": {
    explain: (keys) =>
      `the ${field(keys, "kind")} at ${field(keys, "node")} is of cardinality ${JSON.stringify(field(keys, "cardinality"))} and base type ${JSON.stringify(field(keys, "baseType"))}, where a record declares no base type and every other variable declares one`,
  },
  "Declaration key": {
    explain: (keys) => `a second declaration of ${field(keys, "identifier")}`,
  },
  "Declaration not reserved": {
    explain: (keys) =>
      `${field(keys, "identifier")} is a built-in session variable, which is declared implicitly and must not be declared`,
  },
  Document: {
    explain: (keys) =>
      `the Document row's node ${field(keys, "documentRow")} is not the document node ${field(keys, "self")}`,
  },
  "Document entry": {
    explain: (keys) =>
      keys["href"] === undefined
        ? `the listed document ${field(keys, "path")} is no entry of the package`
        : `the section ref's href ${JSON.stringify(field(keys, "href"))} names no section document the package lists`,
  },
  "Document lang": {
    explain: (keys) =>
      `the document's xml:lang ${JSON.stringify(field(keys, "lang"))} states a language that its resource's LOM general categories ${inBraces(membersOf(keys["generals"]))} do not all list`,
  },
  "DocumentId key": {
    explain: (keys) =>
      `a second element purports the id ${field(keys, "id")}, which ${field(keys, "first")} already holds`,
  },
  "Double bound": {
    explain: (keys) =>
      `${field(keys, "lexical")} is a double whose value lies outside its domain's ${field(keys, "facet")} ${field(keys, "bound")}`,
  },
  "Double value": {
    explain: () =>
      "a bounded double's typed value is written where its lexical form is in xs:double's lexical space",
  },
  "E1 derived": {
    explain: (keys) =>
      `holds state ${field(keys, "state")}, ${field(keys, "elements")} elements, ancestry ${inBraces(membersOf(keys["ancestry"]))}, string value ${JSON.stringify(field(keys, "stringValue"))} and first and last characters ${JSON.stringify(field(keys, "first"))} and ${JSON.stringify(field(keys, "last"))}, where the closed relations, its children and its own characters derive state ${field(keys, "derivedState")}, ${field(keys, "derivedElements")} elements, ancestry ${inBraces(membersOf(keys["derivedAncestry"]))}, ${JSON.stringify(field(keys, "derivedStringValue"))} and ${JSON.stringify(field(keys, "derivedFirst"))} and ${JSON.stringify(field(keys, "derivedLast"))}`,
    node: true,
  },
  "Equal tolerance": {
    explain: (keys) => {
      const unsigned = membersOf(keys["unsigned"]);
      const count = field(keys, "count");

      return count === ""
        ? `the qti-equal compares in ${field(keys, "mode")} mode and writes no tolerance, where an absolute or relative comparison names its bounds`
        : `the qti-equal's tolerance holds ${count} values${unsigned.length === 0 ? "" : `, of which ${inBraces(unsigned)} are numbers not above 0`}, where a tolerance is one or two values, each number among them above 0`;
    },
  },
  "Feedback outcome type": {
    explain: (keys) =>
      `${field(keys, "kind")} names the outcome ${field(keys, "identifier")}, of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}, where a feedback outcome is an identifier of single or multiple cardinality`,
  },
  "Feedback reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
  },
  "File exists": {
    explain: (keys) =>
      `${field(keys, "path")} is named by ${field(keys, "from")} and is no entry of the package`,
  },
  "File listed": {
    explain: (keys) => `${field(keys, "path")} is the href of no cp:file`,
  },
  "Foreign attribute class": {
    explain: (keys) =>
      `${field(keys, "kind")}'s attributes ${inBraces(membersOf(keys["wrong"]))} (slot:class:namespace) are not of the class their namespace has against the element's ${JSON.stringify(field(keys, "elementNamespace"))}: no-namespace for none, own-namespace for the element's, foreign for another`,
    node: true,
  },
  "Foreign element class": {
    explain: (keys) =>
      keys["kind"] === foreignKinds.absent && (keys["prefix"] ?? "") !== ""
        ? `${field(keys, "kind")} is written with the prefix ${field(keys, "prefix")}, where a name in no namespace has no prefix`
        : `${field(keys, "kind")} stores the namespace ${JSON.stringify(field(keys, "uri"))} under a parent in ${JSON.stringify(field(keys, "parentNamespace"))}, where no-namespace-element is for none, own-namespace-element for the parent's and foreign-element for another`,
    node: true,
  },
  "Foreign simple content": {
    explain: (keys) =>
      `a foreign element governed by the simple type ${field(keys, "governs")} holds an element child, where a simple type's element holds text alone`,
    node: true,
  },
  "Fragment context": {
    explain: (keys) =>
      `${field(keys, "path")} is placed inside ${field(keys, "first")} and inside ${field(keys, "second")}, and one written element is judged under one nearest interaction, a limit of the representation`,
  },
  "Graphic gap match default hotspot": {
    explain: () =>
      "a qti-associable-hotspot of a qti-graphic-gap-match-interaction has shape default, where that interaction defines no default hotspot",
  },
  "Href form": {
    explain: (keys) =>
      `the href ${field(keys, "href")} names no file the representation can read a name from${keys["limit"] === undefined ? "" : ` (${field(keys, "limit")})`}, a limit of the representation (#pantry/import/overlays/package.ts Limit)`,
  },
  "Href listed": {
    explain: (keys) =>
      `${field(keys, "identifier")}'s href ${field(keys, "href")} names a path that is the href of none of its files ${inBraces(membersOf(keys["files"]))}`,
  },
  "Idref target": {
    explain: (keys) =>
      `${field(keys, "name")} names ${field(keys, "token")}, which no ID of the document holds`,
  },
  "Include fragment identifier": {
    explain: (keys) =>
      `the include ${field(keys, "node")} names ${field(keys, "href")}, with a fragment identifier, which XInclude makes a fatal error`,
  },
  "Include root": {
    explain: (keys) =>
      `the include ${field(keys, "node")} stands for ${field(keys, "root")}, the root of ${field(keys, "path")}, which ${field(keys, "parentKind")} does not admit where it admits the include`,
  },
  "Include target": {
    explain: (keys) =>
      keys["path"] === undefined || field(keys, "path") === ""
        ? `the include ${field(keys, "node")} names no document of the package by an href this representation resolves`
        : `the include ${field(keys, "node")} names ${field(keys, "path")}, which is no document the manifest lists`,
  },
  "Inclusion cycle": {
    explain: (keys) =>
      `the section refs and includes ${inBraces(membersOf(keys["chain"]))} lead from ${field(keys, "path")} back to it, so its merged document never ends`,
  },
  "Item ref target": {
    explain: (keys) =>
      `the item ref ${field(keys, "node")} names ${field(keys, "path")}, which is no item document of the package`,
  },
  "Key text bound": {
    explain: (keys) =>
      `its ${field(keys, "field")} holds ${field(keys, "bytes")} UTF-8 bytes, past the ${field(keys, "bound")} a key holds of its kind (#pantry/qti/limits.ts), a limit of the representation`,
  },
  "LOM learning resource type": {
    explain: (keys) =>
      `a learningResourceType of the LOM vocabulary (its source ${field(keys, "source") === "" ? "empty or not written, so the binding's default LOMv1.0" : JSON.stringify(field(keys, "source"))}) holds ${JSON.stringify(field(keys, "value"))}, which QTI 3.0 Metadata §2.7.5.1 forbids`,
  },
  "Label tools": {
    explain: (keys) =>
      `${field(keys, "kind")} carries a label, so the item's root must carry tool-name and tool-version, and it lacks ${inBraces(membersOf(keys["missing"]))}`,
  },
  "Literal lexical": {
    explain: (keys) =>
      `a qti-base-value of base-type ${field(keys, "baseType")} holds ${JSON.stringify(field(keys, "text"))}, which is no lexical form of it`,
  },
  LomObjectIdentifier: {
    explain: (keys) =>
      keys["identifier"] === undefined
        ? `the document writes no identifier, so none of its record's entries ${field(keys, "entries")} names it`
        : `the document ${field(keys, "identifier")} is named ${field(keys, "entries")} by its record`,
  },
  LomObjectTitle: {
    explain: (keys) =>
      keys["title"] === undefined
        ? `the document writes no title, so none of its record's title strings ${field(keys, "strings")} names it`
        : `the document titled ${JSON.stringify(field(keys, "title"))} is titled ${field(keys, "strings")} by its record in its language`,
  },
  "Lookup table cardinality": {
    explain: (keys) =>
      `a ${field(keys, "kind")} of an outcome of ${field(keys, "cardinality")} cardinality, where a lookup table sets a single outcome value`,
  },
  "Lookup type": {
    explain: (keys) =>
      `qti-lookup-outcome-value looks up a ${field(keys, "baseType")} ${field(keys, "cardinality")} in ${field(keys, "identifier")}'s ${field(keys, "table") || "missing table"}; it takes a single integer, float or duration, a match table's an integer`,
  },
  "Manifest id space": {
    explain: (keys) => `${field(keys, "identifier")} is also the manifest's identifier`,
  },
  "Map key": {
    explain: (keys) =>
      `a ${field(keys, "baseType")} mapping holds the key ${field(keys, "key")} twice, as written or as the value it names`,
  },
  MappableBaseType: {
    explain: (keys, grammar) =>
      `a mapping of base type ${JSON.stringify(field(keys, "baseType"))}; MappableBaseType holds ${inBraces(
        grammar.mappableBaseType.rows.map(({ baseType }) => baseType),
      )}`,
  },
  "Mapped response": {
    explain: (keys) =>
      `${field(keys, "kind")} names ${field(keys, "identifier")}, a ${field(keys, "declarationKind")} with no ${field(keys, "kind") === "qti-map-response-point" ? "qti-area-mapping of base-type point" : "qti-mapping"}`,
  },
  "Mastery range": {
    explain: (keys) =>
      `mastery-value ${field(keys, "masteryValue")} lies outside the normal range from ${JSON.stringify(field(keys, "normalMinimum"))} to ${JSON.stringify(field(keys, "normalMaximum"))}`,
  },
  "MathML align first": {
    explain: (keys) =>
      `the table cell at ${field(keys, "cell")} holds an alignment group, so its first complete element must be an m:maligngroup (MathML 3 §3.5.5.2), and it is ${field(keys, "first")}`,
    node: true,
  },
  "MathML align placement": {
    explain: (keys) =>
      `an m:maligngroup in the table cell at ${field(keys, "cell")} stands under ${field(keys, "through")}, which MathML 3 §3.5.5.2 does not let a group through to its cell: an mrow or mstyle that changes no direction, mphantom, mfenced, the selected child of an maction, and semantics do`,
    node: true,
  },
  "MathML arity": {
    explain: (keys) =>
      Option.match(Option.fromNullishOr(mathArities.get(field(keys, "operator"))), {
        onNone: () => `${field(keys, "operator")} has no MathML arity`,
        onSome: ({ max, min, section }) =>
          `m:apply applies ${field(keys, "operator")} to ${field(keys, "arguments")} arguments, where its class (MathML 3 §${section}) takes ${countsShown(min, max)}`,
      }),
    node: true,
  },
  "MathML cn form": {
    explain: (keys) => {
      const forms = cnForms.get(field(keys, "type")) ?? [];

      return field(keys, "part") === ""
        ? `a cn of type ${JSON.stringify(field(keys, "type"))} holds the parts ${JSON.stringify(field(keys, "text"))}, where its type takes ${String(forms.length)} (MathML 3 §4.2.1), split at m:sep`
        : `part ${field(keys, "part")} of a cn of type ${JSON.stringify(field(keys, "type"))}, ${JSON.stringify(field(keys, "text"))}, is no ${forms[Number(field(keys, "part")) - 1] ?? "valid"} in base ${field(keys, "base")} (MathML 3 §4.2.1)`;
    },
    node: true,
  },
  "MathML foreign element": {
    explain: (keys) =>
      `${field(keys, "node")} is a foreign element named {${field(keys, "namespace")}}${field(keys, "local")}, and no foreign element is in the MathML namespace: MathML content stands only inside m:math`,
  },
  "MathML head qualifier": {
    explain: (keys) =>
      `m:apply applies ${field(keys, "head")} with a ${field(keys, "qualifier")}, which ${field(keys, "head")}'s syntax table (MathML 3 §4.4) does not list: ${inBraces(
        mathHeadQualifiers
          .filter(({ qualifier }) => qualifier === field(keys, "qualifier"))
          .map(({ head }) => head),
      )} take it`,
    node: true,
  },
  "MathML maction selection": {
    explain: (keys) =>
      field(keys, "children") === "0"
        ? "an m:maction has no child, so no sub-expression is selected (MathML 3 §3.7.1.1)"
        : `an m:maction selects child ${field(keys, "selection")} of its ${field(keys, "children")}, where MathML 3 §3.7.1.1 calls a selection out of range an error`,
    node: true,
  },
  "MathML share cycle": {
    explain: (keys) =>
      `the m:share at ${field(keys, "share")} names #${field(keys, "target")}, and that element holds the share, so an element dominates itself (MathML 3 §4.2.7)`,
  },
  "Media source src": {
    explain: (keys) =>
      `a source in ${field(keys, "parentKind") || "a media element"} carries no src, where a source of an audio or a video names its media resource`,
    node: true,
  },
  "N1 one document node": {
    explain: (keys) => `${field(keys, "documentNodes")} nodes start at 0, where a document has one`,
  },
  "N1 sentinel": {
    explain: (keys) =>
      `the document node sits at slot ${field(keys, "at")} with parent ${field(keys, "parent")}, document ${field(keys, "document")}, nearest ${field(keys, "nearest")} (${field(keys, "nearestKind")}) and parentAncestry ${inBraces(membersOf(keys["parentAncestry"]))}, where it is its own at slot 0 and sits in no flag`,
    node: true,
  },
  "N2 key": {
    explain: (keys) =>
      `${field(keys, "members")} children over ${field(keys, "slots")} distinct (parent, at) slots`,
  },
  "N2 mirrors": {
    explain: (keys) =>
      keys["missing"] === undefined
        ? `slot ${field(keys, "at")} under a parent of ${field(keys, "parentChildren")} children`
        : `${field(keys, "children")} children, none at slots ${inBraces(membersOf(keys["missing"]))}`,
    node: true,
  },
  "N4 kinds": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} under ${field(keys, "parentKind")} in ${field(keys, "version")}: NodeKind holds ${inBraces(
        [field(keys, "kind"), field(keys, "parentKind")].filter((kind) =>
          grammar.kinds.nodeKind.has(kind),
        ),
      )}, SchemaVersion ${grammar.kinds.versions.has(field(keys, "version")) ? "holds" : "lacks"} ${field(keys, "version")}`,
    node: true,
  },
  "N5 Follow": {
    explain: (keys, grammar) => {
      const version = field(keys, "version");
      const parent = field(keys, "parentKind");
      const { was } = keys;
      if (was === undefined) {
        return `no position of ${parent}'s content model that names ${field(keys, "kind")} follows its predecessor in ${version}`;
      }

      const next = grammar.content.positions.handles.filter((to) =>
        contentFollows(grammar.content, { from: was, parent, to, version }),
      );

      return `${field(keys, "kind")} follows state ${was}, after which ${parent}'s content model in ${version} admits ${inBraces(
        next.map((to) => `${to}: ${kindsAt(grammar, version, parent, to).join(" ")}`),
      )}`;
    },
    node: true,
  },
  "N5 admitted": {
    explain: (keys, grammar) =>
      `${field(keys, "parentKind")} admits no ${field(keys, "kind")} in ${field(keys, "version")}; it admits ${inBraces(
        grammar.admission.rows
          .filter(
            ({ parent, version }) =>
              parent === field(keys, "parentKind") && version === field(keys, "version"),
          )
          .map(({ child }) => child),
      )}`,
    node: true,
  },
  "N5 first slot": {
    explain: (keys) =>
      keys["attrsWas"] === undefined
        ? `the first slot copies state ${field(keys, "was")} and ${field(keys, "elementsWas")} elements, where each fold starts at 0`
        : `the first attribute copies attrs ${inBraces(membersOf(keys["attrsWas"]))}, where the fold starts empty`,
    node: true,
  },
  "N5 fold": {
    explain: (keys) =>
      `copies state ${field(keys, "was")} and ${field(keys, "elementsWas")} elements, where its predecessor's fold is state ${field(keys, "predecessorState") || "none"} and ${field(keys, "predecessorElements") || "no"} elements`,
    node: true,
  },
  "N6 ancestry": {
    explain: (keys, grammar) => {
      const sits = new Set(membersOf(keys["parentAncestry"]));
      const kind = field(keys, "kind");

      return `${kind} sits in ${inBraces([...sits])}: Banned holds ${inBraces(
        [...rowOf(grammar.ancestry.banned, kind)].filter((flag) => sits.has(flag)),
      )} of it, and Needs lacks ${inBraces(
        [...rowOf(grammar.ancestry.needs, kind)].filter((flag) => !sits.has(flag)),
      )}`;
    },
    node: true,
  },
  "N7 Counted": {
    explain: (keys, grammar) =>
      membersOf(keys["counts"])
        .map((entry) => {
          const [position = "", count = ""] = entry.split(":");

          return Option.match(
            grammar.content.counted.lookup({
              parent: field(keys, "kind"),
              position,
              version: field(keys, "version"),
            }),
            {
              onNone: () => `${count} children at position ${position}`,
              onSome: ({ max, min }) =>
                `${count} children at position ${position}, which Counted bounds to ${String(min)} to ${String(max)}`,
            },
          );
        })
        .join("; "),
    node: true,
  },
  "N7 Last": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} holds ${inBraces(membersOf(keys["children"]))} and ends in state ${field(keys, "childState")}; its content model in ${field(keys, "version")} ends in ${inBraces(
        Option.match(
          contentModelOf(grammar.content, {
            parent: field(keys, "kind"),
            version: field(keys, "version"),
          }),
          {
            onNone: () => [],
            onSome: (model) =>
              grammar.content.last.rows
                .filter((row) => row.model === model)
                .map(({ position }) => position),
          },
        ),
      )}`,
    node: true,
  },
  "N7 barred by": {
    explain: (keys, grammar) =>
      Option.match(
        grammar.barredBy.lookup({ parent: field(keys, "kind"), version: field(keys, "version") }),
        {
          onNone: () => `${field(keys, "kind")} bars no position`,
          onSome: ({ name, position }) =>
            `${field(keys, "kind")} carries ${name}, which bars position ${position}, and holds ${inBraces(membersOf(keys["barred"]))} there`,
        },
      ),
    node: true,
  },
  "N7 empty family": {
    explain: (keys) =>
      `an empty family's end values are state ${field(keys, "childState")} and ${field(keys, "elementChildren")} elements, where each fold starts at 0`,
    node: true,
  },
  "N7 last slot": {
    explain: (keys) =>
      `end values state ${field(keys, "childState")} and ${field(keys, "elementChildren")} elements, where its last child's fold is state ${field(keys, "lastState") || "none"} and ${field(keys, "lastElements") || "no"} elements`,
    node: true,
  },
  "N8 nearest": {
    explain: (keys, grammar) =>
      keys["parent"] === undefined
        ? `${field(keys, "kind")} writes its identifier, a choice, and its nearest ${field(keys, "nearest")} is a ${field(keys, "nearestKind")}, no interaction, where every choice lies in one`
        : `nearest ${field(keys, "nearest")} (${field(keys, "nearestKind")}) under ${field(keys, "parent")}, a ${field(keys, "parentKind")}, where ${
            Option.isSome(grammar.kinds.interaction.lookup({ kind: field(keys, "parentKind") }))
              ? "an interaction parent is the nearest"
              : `the parent's nearest ${field(keys, "parentNearest")} is`
          }`,
    node: true,
  },
  "Namespace family": {
    explain: (keys) =>
      `namespaces ${field(keys, "namespaces")} over ${field(keys, "declarations")} declarations`,
    node: true,
  },
  "Namespace name": {
    explain: (keys) =>
      `${field(keys, "node")} binds ${field(keys, "prefix") === "" ? "the default namespace" : `the prefix ${field(keys, "prefix")}`} to ${JSON.stringify(field(keys, "uri"))}, which is no RFC 3986 URI reference`,
  },
  "Node key": {
    explain: (keys) => `a second row holds the id ${field(keys, "id")}`,
    node: true,
  },
  "One base": {
    explain: (keys) =>
      `the operands of ${field(keys, "kind")} are of base types ${field(keys, "bases")} or cardinalities ${field(keys, "cardinalities")}, which it takes of one`,
  },
  OpenElementName: {
    explain: (keys) =>
      `${field(keys, "names")} foreign names over ${field(keys, "foreignElements")} foreign elements`,
  },
  "OpenElementName canonical": {
    explain: (keys) =>
      `${field(keys, "node")} is a foreign element named {${field(keys, "namespace")}}${field(keys, "local")}, the name of ${inBraces(membersOf(keys["kinds"]))}, which its parent admits there, so it is read as that kind`,
  },
  "Operand fit": {
    explain: (keys) =>
      `an operand of ${field(keys, "kind")} is ${field(keys, "baseType")} ${field(keys, "cardinality")}, which it does not take there`,
  },
  "Outcome only": {
    explain: (keys) =>
      `${field(keys, "kind")} stands in ${field(keys, "language")} processing; only outcome processing admits it`,
  },
  "PCI module source": {
    explain: (keys) =>
      `the portable custom interaction ${field(keys, "node")} writes neither a module attribute nor a qti-interaction-modules child, so it names no module`,
  },
  "Picture source srcset": {
    explain: () =>
      "a source in a picture carries no srcset, where a source of a picture names its image candidates",
    node: true,
  },
  "Prefixed reference": {
    explain: (keys) =>
      `the test ${field(keys, "assembly")} reads the reference ${field(keys, "identifier")} in ${field(keys, "resolving")} ways, ${field(keys, "readings")}, where exactly one reading may name a scope of the test and a variable of it`,
  },
  "Printed variable reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
  },
  "Quotation punctuation": {
    explain: (keys) =>
      `the q has the quotation mark ${JSON.stringify(field(keys, "mark"))} ${field(keys, "position")}, where the user agent draws a q's quotation marks itself`,
  },
  "Record field key": {
    explain: (keys) => `a second field of one record value is named ${field(keys, "identifier")}`,
  },
  RecordBindingFit: {
    explain: (keys) =>
      `${field(keys, "kind")} binds the record ${field(keys, "identifier")}, which RecordBindingFit does not admit`,
  },
  "Reference type": {
    explain: (keys) =>
      `${field(keys, "kind")}'s ${field(keys, "attribute")} names ${field(keys, "identifier")}, which is no ${field(keys, "base")} single template or outcome variable`,
  },
  "Remote section ref": {
    explain: (keys) =>
      `the section ref's href ${JSON.stringify(field(keys, "href"))} names a section outside the package, which the import never fetches, so it cannot assemble the test: a limit of the representation (reading 170)`,
  },
  "Reserved type": {
    explain: (keys) =>
      `${field(keys, "identifier")} is declared by ${field(keys, "kind")} of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}, where the specification types it otherwise`,
  },
  RootOfType: {
    explain: (keys, grammar) =>
      `${field(keys, "path")} has root ${field(keys, "rootKind")} and is listed as ${field(keys, "type")}, which lists ${rootsExplained(grammar, field(keys, "type"))}`,
  },
  "Rounding figures": {
    explain: (keys) =>
      `${field(keys, "kind")} rounds to ${field(keys, "figures")} figures under ${field(keys, "mode")}, where that mode rounds to at least ${field(keys, "least")}`,
  },
  "SSML lexicon reference": {
    explain: (keys) =>
      field(keys, "fragment") === ""
        ? `ssml:lookup names the lexicon ${field(keys, "ref")} outside every ssml:speak`
        : `ssml:lookup names the lexicon ${field(keys, "ref")}, which no ssml:lexicon of its ssml:speak defines`,
    node: true,
  },
  "SSML trim mark": {
    explain: (keys) =>
      `ssml:speak trims at ${inBraces(membersOf(keys["unmarked"]))} (attribute=name:marks of that name in the speak), where each names exactly one of its marks`,
    node: true,
  },
  "Section identifier target": {
    explain: (keys) =>
      `the section-identifier ${field(keys, "identifier")} names no single section or section ref of the test ${field(keys, "assembly")}`,
  },
  "Selection bound": {
    explain: (keys) =>
      `selects ${field(keys, "select")} of the section's ${field(keys, "parts")} parts without replacement`,
  },
  "Selection required": {
    explain: (keys) =>
      `selects ${field(keys, "select")} of the section's parts, fewer than its ${field(keys, "required")} required parts`,
  },
  "Self dependency": {
    explain: (keys) =>
      `the resource ${field(keys, "identifier")} names itself in a cp:dependency, where a dependency names a sibling resource`,
  },
  "Set type": {
    explain: (keys) =>
      `${field(keys, "kind")} sets ${field(keys, "identifier")}, ${field(keys, "baseType")} ${field(keys, "cardinality")}, to a ${field(keys, "heldBase")} ${field(keys, "heldCardinality")}`,
  },
  "Slider bounds": {
    explain: (keys) =>
      `qti-slider-interaction's upper-bound ${field(keys, "upper")} is below its lower-bound ${field(keys, "lower")}`,
  },
  "Stimulus ref key": {
    explain: (keys) =>
      `two stimulus refs of one item share the identifier ${field(keys, "identifier")}`,
  },
  "Stimulus ref target": {
    explain: (keys) =>
      `a stimulus ref names ${field(keys, "path")}, which is no stimulus document of the package`,
  },
  "Strictly held": {
    explain: (keys) =>
      `${field(keys, "kind")} stands under ${field(keys, "parentKind")} only by its strict wildcards and no type governs it, where such an element stands only under an xsi:type naming a type of its document's schema set or of XML Schema`,
    node: true,
  },
  "Structure identifier": {
    explain: (keys) =>
      `${field(keys, "kind")} and ${field(keys, "other")} of one document share the identifier ${field(keys, "identifier")}`,
  },
  "T1 document order": {
    explain: (keys) =>
      `a second node of the document starts at ${field(keys, "start")}, where each start is one node's`,
    node: true,
  },
  "T2 root": {
    explain: (keys) =>
      `${field(keys, "kind")} starts at ${field(keys, "start")} with parent ${field(keys, "parent")}, where the one self-parented row is the root, at start 0`,
    node: true,
  },
  "T3 first child": {
    explain: (keys) =>
      `slot ${field(keys, "at")} starts at ${field(keys, "start")} with parentStart ${field(keys, "parentStart")} under a parent that starts at ${field(keys, "parentStartHeld") || "none"}, where its copy of the parent is the parent's fields and a first child starts one past its parent`,
    node: true,
  },
  "T4 next sibling": {
    explain: (keys) =>
      `starts at ${field(keys, "start")}, where its predecessor ends at ${field(keys, "predecessorEnd") || "no row"}`,
    node: true,
  },
  "T5 last child": {
    explain: (keys) =>
      `ends at ${field(keys, "end")}, where its last child ends at ${field(keys, "lastEnd") || "no row"}`,
    node: true,
  },
  "T6 nonempty and leaf": {
    explain: (keys) =>
      `holds [${field(keys, "start")}, ${field(keys, "end")}) over ${field(keys, "children")} children, where every interval is non-empty and a leaf's holds itself alone`,
    node: true,
  },
  "Table headers": {
    explain: (keys) => {
      const unnamed = membersOf(keys["unnamed"]);
      const repeated = membersOf(keys["repeated"]);
      const table = field(keys, "table");
      const broken = [
        ...(unnamed.length === 0
          ? []
          : [
              table === ""
                ? `name ${inBraces(unnamed)}, though the cell takes part in no table, so no th is its header`
                : `name ${inBraces(unnamed)}, which are the id of no th of its table ${table}`,
            ]),
        ...(repeated.length === 0 ? [] : [`repeat ${inBraces(repeated)}`]),
      ];

      return `the cell's headers ${broken.length === 0 ? "break no token rule" : broken.join(", and ")}, where each token is unique and names a th of the cell's own table`;
    },
  },
  "Template default target": {
    explain: (keys) =>
      `the template default of ${field(keys, "itemRef")} names ${field(keys, "template")}, which its item declares as no template variable`,
  },
  "Template default type": {
    explain: (keys) =>
      `the template default of ${field(keys, "itemRef")} sets ${field(keys, "template")}, a ${field(keys, "declared")}, to a ${field(keys, "held")}`,
  },
  "Template reads": {
    explain: (keys) =>
      `template processing's ${field(keys, "kind")} reads ${field(keys, "identifier")}, a response or outcome variable or a built-in but QTI_CONTEXT`,
  },
  "Template reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
  },
  "Template variable type": {
    explain: (keys) =>
      `${field(keys, "kind")} names the template variable ${field(keys, "identifier")}, of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}, where a template element's or a choice's template variable is an identifier of single or multiple cardinality`,
  },
  "Test name key": {
    explain: (keys) =>
      `${field(keys, "kind")} and ${field(keys, "other")} of the test ${field(keys, "test")}'s assembled documents share the identifier ${field(keys, "identifier")}`,
  },
  TextDomain: {
    explain: (keys, grammar) =>
      domainExplained(
        grammar,
        Option.flatMap(keyedVersion(keys, grammar), (version) =>
          textDomainOf(grammar.attributes, {
            governs: Option.fromNullishOr(keys["governs"]),
            kind: field(keys, "kind"),
            version,
          }),
        ),
        field(keys, "value"),
        `${field(keys, "kind")}'s text in ${field(keys, "version")}`,
      ),
  },
  "Track srclang": {
    explain: (keys) =>
      `a track ${field(keys, "trackKind") === "" ? "that writes no kind, so in its missing value default, the subtitles state," : "whose kind is subtitles"} carries no srclang, where a track in the subtitles state names its language`,
    node: true,
  },
  "Typed attribute value": {
    explain: (keys) =>
      `an attribute value of base type ${JSON.stringify(field(keys, "baseType"))} is written ${JSON.stringify(field(keys, "value"))}, which is no lexical form of it written without whitespace around it`,
  },
  "Typed value": {
    explain: (keys) =>
      `a value of base type ${JSON.stringify(field(keys, "baseType"))} is written ${JSON.stringify(field(keys, "text"))}, which is no lexical form of it`,
  },
  "Usage typed value": {
    explain: (keys) =>
      `a usage value of baseType ${JSON.stringify(field(keys, "baseType"))} is written ${JSON.stringify(field(keys, "text"))}, which is no lexical form of it`,
  },
  "Value cardinality": {
    // A declaration whose cardinality spells nothing keeps only the rule that reads neither
    // attribute, a value's field-identifier and base-type both or neither (reading 158), and its
    // breach holds no cardinality to name.
    explain: (keys) =>
      `a value set of ${keys["cardinality"] === undefined ? "a declaration whose cardinality spells nothing" : `${JSON.stringify(keys["cardinality"])} cardinality`} holds ${field(keys, "values")} values, ${field(keys, "fields")} of them with a field-identifier and ${field(keys, "typed")} with a base-type, where ${keys["cardinality"] === undefined ? "each value carries both or neither" : "a record's values each carry both and any other's neither"}`,
  },
  "Variable declared": {
    explain: (keys) =>
      `${field(keys, "kind")} names ${field(keys, "identifier")}, which nothing declares and no built-in variable is`,
  },
  "Variable kind": {
    explain: (keys) =>
      `${field(keys, "kind")} names ${field(keys, "identifier")}, a ${field(keys, "declarationKind")} variable, where it reads or sets only ${field(keys, "allowed")}`,
  },
  "Variable mapping source": {
    explain: (keys) =>
      `the variable mapping of ${field(keys, "itemRef")} maps ${field(keys, "source")}, which its item declares as no outcome variable`,
  },
  "Variable mapping target": {
    explain: (keys) =>
      `a variable mapping of ${field(keys, "itemRef")} names the target ${field(keys, "target")}, which another mapping of it or a built-in session variable already names`,
  },
  "Weighted base": {
    explain: (keys) =>
      `a qti-test-variables with a weight-identifier is of base-type ${field(keys, "baseType")}, not float`,
  },
  "XsiType available": {
    explain: (keys) =>
      `${field(keys, "kind")} is governed by ${field(keys, "governs")} under a parent in ${JSON.stringify(field(keys, "parentNamespace"))}, where its xsi:type names a type of its document's schema set or of XML Schema`,
    node: true,
  },
  "XsiType derived": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} is governed by ${keys["governs"] ?? "no named type"}${field(keys, "value") === "" ? "" : `, which its xsi:type ${JSON.stringify(field(keys, "value"))} names`}, and no type validly derived from its declared ${keys["declared"] ?? "anonymous type"} is; XsiType admits ${inBraces(
        grammar.xsi.xsiType.rows
          .filter(
            ({ kind, version }) =>
              kind === field(keys, "kind") && version === field(keys, "version"),
          )
          .map(({ type }) => type),
      )}`,
    node: true,
  },
  "comment arm": {
    explain: (keys) => armExplained("comment", keys),
  },
  "default hotspot last slot": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} with ${field(keys, "attribute")}="${field(keys, "value")}" is element ${field(keys, "elements")} of its parent's ${field(keys, "elementChildren")}, where ${inBraces(
        grammar.lastWhere
          .filter(({ kind }) => kind === field(keys, "kind"))
          .map(({ source }) => source),
      )} puts it last`,
    node: true,
  },
  "doctype arm": {
    explain: (keys) => armExplained("doctype", keys),
  },
  "entityRef arm": {
    explain: (keys) => armExplained("entityRef", keys),
  },
  "pi arm": {
    explain: (keys) => armExplained("pi", keys),
  },
  "text arm": {
    explain: (keys) => armExplained("text", keys),
  },
  "value domain": {
    explain: (keys, grammar) =>
      `${field(keys, "name")}: ${domainExplained(
        grammar,
        Option.map(
          Option.flatMap(keyedVersion(keys, grammar), (version) =>
            governedAdmission(grammar.attributes, {
              governs: Option.fromNullishOr(keys["governs"]),
              kind: field(keys, "kind"),
              name: field(keys, "name"),
              version,
            }),
          ),
          ({ domain }) => domain,
        ),
        field(keys, "lexical"),
        `${field(keys, "kind")}@${field(keys, "name")} in ${field(keys, "version")}`,
      )}`,
  },
  "ws arm": {
    explain: (keys) => armExplained("ws", keys),
  },
} as const satisfies Readonly<Record<string, OracleLaw>>;

/**
 * Every law of the oracle: its own and the laws its producers declare that it had not
 * (`#pantry/test/oracle-laws.ts` `addedLaws`), merged once. A law with no entry is no
 * {@link LawName}, so every table derived from this one holds it or a compile error says so.
 */
const oracleLaws = { ...ownLaws, ...addedLaws } as const satisfies Readonly<
  Record<string, OracleLaw>
>;

/**
 * The name of any law of the oracle.
 */
export type LawName = keyof typeof oracleLaws;

/**
 * Every law name, in the registry's order.
 */
export const lawNames: readonly LawName[] = Object.keys(oracleLaws).filter(
  (name): name is LawName => Object.hasOwn(oracleLaws, name),
);

/**
 * The name of a law over node rows.
 */
export type NodeLawName = {
  [L in LawName]: (typeof oracleLaws)[L] extends { readonly node: true } ? L : never;
}[LawName];

/**
 * The names of the laws over node rows.
 */
export const nodeLawNames: readonly NodeLawName[] = lawNames.filter(
  (name): name is NodeLawName => "node" in oracleLaws[name],
);

/**
 * The source each law states, by law.
 */
export const lawSources: Readonly<Record<LawName, string>> = pipe(
  oracleLaws,
  Rec.map((_, law) => lawTable[law].source),
);

/**
 * Name the rule a law's refusal is named by.
 *
 * @param law - The law.
 * @returns Its rule.
 */
export const ruleOf = (law: LawName): OracleRule => lawTable[law].rule;

/**
 * Each rule's place in the law catalog's precedence, the order a refusal names its rule by.
 */
const precedenceRank: ReadonlyMap<string, number> = new Map(
  precedence.map((rule, at) => [rule, at]),
);

/**
 * Name the verdict a judgment predicts: the rule of its breach whose rule the catalog's precedence
 * ranks first, as the database names the lowest-ranked law its rows break, whatever order the
 * oracle lists its breaches in. A rule the precedence does not rank stands after every rule it
 * does, the first listed of them first.
 *
 * @param judgment - The judgment.
 * @returns Accepted when the codec read every document and no law broke; otherwise refused under
 *   the codec's rule or the first-ranked breach's.
 */
export const verdictOf = (judgment: Judgment): PredictedVerdict => {
  if (judgment._tag === "CodecRefusal") {
    return { rule: judgment.rule, verdict: "refused" };
  }

  const rankOf = (breach: Breach): number =>
    precedenceRank.get(ruleOf(breach.law)) ?? Number.POSITIVE_INFINITY;
  let first: Breach | undefined;
  for (const breach of judgment.breaches) {
    if (first === undefined || rankOf(breach) < rankOf(first)) {
      first = breach;
    }
  }

  return first === undefined
    ? { verdict: "accepted" }
    : { rule: ruleOf(first.law), verdict: "refused" };
};

/**
 * Explain a breach: what its row holds against what its law's relations allow, computed from the
 * breach's keys and the grammar.
 *
 * @param law - The law.
 * @param keys - The failing row's keys.
 * @param grammar - The composed grammar.
 * @returns The explanation.
 */
export const explain = (law: LawName, keys: Keys, grammar: ComposedGrammar): string =>
  oracleLaws[law].explain(keys, grammar);

/**
 * Write a breach for a report: its law, its rule, where it broke, and its explanation.
 *
 * @param breach - The breach.
 * @param grammar - The composed grammar.
 * @returns One line.
 */
export const shownBreach = (breach: Breach, grammar: ComposedGrammar): string =>
  `${breach.law} (${ruleOf(breach.law)}) at ${breach.document}${field(breach.keys, "node")}: ${explain(breach.law, breach.keys, grammar)}`;
