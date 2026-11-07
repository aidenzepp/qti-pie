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
 * `attribute-admission` (an attribute its kind admits under no name) and `not-qti3` and nothing
 * else ({@link CodecRefusal}). The documents that shred are folded. A fold that meets a child or an
 * attribute with no cell has no rows, and its refusal is the one breach of its document; every law
 * is evaluated over the rows of the documents that fold, each breach reported with the law, the
 * rule the law keeps from the guard or schema rule it replaces, and where it broke
 * ({@link Breach}).
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
 * `lang-set-copy`, `string-identifier-distinct`, coords by shape, the gap and hottext owners
 * beyond N8, `template-derivation`, the CSM laws, and the typed values a domain derives beyond its
 * regex (G5).
 */
import { Effect, Option, pipe, Record as Rec, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { rowOf } from "#pantry/grammar/ancestry.ts";
import {
  admissionOf as governedAdmission,
  admittedOf,
  attributeCounts,
  governorOf,
  openDomain,
  requiredOf,
  textDomainOf,
} from "#pantry/grammar/attributes.ts";
import type { ValueDomain } from "#pantry/grammar/attributes.ts";
import { typedCardinalities } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import {
  contentEnds,
  contentFollows,
  contentModelOf,
  contentStep,
  noSharedModel,
} from "#pantry/grammar/content.ts";
import { mathArities, mathQualifiers } from "#pantry/grammar/expression.ts";
import { booleanOf, compile, patternFlags } from "#pantry/grammar/domains.ts";
import type { ValueFacet } from "#pantry/grammar/domains.ts";
import { foreignKinds, isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { Spelling } from "#pantry/grammar/references.ts";
import { expandedText } from "#pantry/grammar/names.ts";
import { expandedNameOf, noType } from "#pantry/grammar/xsi.ts";
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
} from "#pantry/model/xdm.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { builtinDomainOf } from "#pantry/vocab/derive/domains.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { keyTextBytes, localNameBytes, namespaceBytes, utf8Length } from "#pantry/qti/limits.ts";
import { splicingParents } from "#pantry/qti/tests.ts";
import { datumText, keyCopies } from "#pantry/test/key-copies.ts";
import type { DocumentRows, KeyCopy } from "#pantry/test/key-copies.ts";
import { isUriReference } from "#pantry/test/uri-reference.ts";
import { addedLaws, lawDocumentBreaches, lawPackageBreaches } from "#pantry/test/oracle-laws.ts";
import { mathmlNamespace, xsNamespace } from "#pantry/vocab/namespaces.ts";
import { resolveAttribute } from "#pantry/test/resolution.ts";
import {
  ancestorsOf,
  field,
  collapsed,
  contentOf,
  isOpenClass,
  pathOf,
  resolvedAt,
  slotKey,
  valueOf,
  viewOf,
} from "#pantry/test/oracle-view.ts";
import type { LawBreach, ResolvedHref, View } from "#pantry/test/oracle-view.ts";
import type { OracleWhiteSpace } from "#pantry/test/resolution.ts";
import { typeAvailable } from "#pantry/vocab/open.ts";

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
  "branch-forward",
  "branch-target",
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
  "item-duration",
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
  "prefixed-ref",
  "printed-variable-ref",
  "q-punctuation",
  "reachability",
  "reader-refusal",
  "record-binding-fit",
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
 * AL1, and every other name shred cannot represent is `unmodeled-vocabulary`.
 */
export type CodecRule = Extract<
  OracleRule,
  | "attribute-admission"
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
 * the cell's position where it names one, else `contentStep` of `#pantry/grammar/content.ts` over
 * `Symbol` and `Follow` (the predecessor's state for character data), an absent cell or step
 * leaving `was`, and `elements = elementsWas + IsElement[kind]`.
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
          ? Option.getOrElse(contentStep(grammar.content, admitted, key, node.was), () => node.was)
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
 * the first time a law reads it.
 */
type ByKind<A> = (version: SchemaVersion, kind: string, governs: string) => A;

/**
 * Compute a table keyed by (version, kind, governing type) on demand, each cell once.
 *
 * @param compute - The cell at a key.
 * @returns The table.
 */
const byKind = <A>(compute: ByKind<A>): ByKind<A> => {
  const cells = new Map<string, A>();

  return (version, kind, governs) => {
    const key = `${kindKey(version, kind)} ${governs}`;
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

  return {
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
  };
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
 * @param governs - The element's governing type.
 * @param name - The `AttributeName` handle.
 * @returns Its position, or none when the element does not admit the name.
 */
const positionOf = (
  laws: Laws,
  version: SchemaVersion,
  kind: string,
  governs: string,
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
 * The header ids of each document's tables, computed once per document.
 */
const tableHeaderCache = new WeakMap<View, ReadonlyMap<NodeId, ReadonlySet<string>>>();

/**
 * Collect the ids of the `th`s that take part in each table of a document, by the table's id,
 * each id collapsed (an `xs:ID`'s whiteSpace).
 *
 * @param view - The document.
 * @returns Each table's header ids; a table no `th` with an `id` takes part in holds none.
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
      for (const id of Option.toArray(valueOf(view, node.id, "id"))) {
        headers.set(table, (headers.get(table) ?? new Set()).add(collapsed(id)));
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
      const admitted = admittedPosition(grammar);
      const key = childKeyOf(node);

      return Option.isNone(admitted(key))
        ? Option.none()
        : unless(Option.isSome(contentStep(grammar.content, admitted, key, node.was)), () => ({
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
        () => ({ governs: node.governs }),
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
          Option.isSome(
            grammar.xsi.xsiType.lookup({
              kind: node.kind,
              type: node.governs,
              version: node.version,
            }),
          ),
        () => ({
          declared: grammar.xsi.declaredType(node.version, node.kind),
          governs: node.governs,
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
          node.governs !== noType ||
          Option.isNone(
            grammar.content.strictlyHeld.lookup({
              child: node.kind,
              parent: node.parentKind,
              version: node.version,
            }),
          ) ||
          heldRoot(grammar, view, node),
        () => ({ governs: node.governs }),
      ),
    law: "Strictly held",
    over: "members",
  },
  {
    breaks: (node, view, { grammar }) => {
      if (!isForeignKind(node.kind) || node.governs === noType) {
        return Option.none();
      }

      const parent = view.byId.get(node.parent);
      const against = parent === undefined ? Option.none() : namespaceOf(view, grammar, parent);
      const type = Option.match(expandedNameOf(node.governs), {
        onNone: () => "",
        onSome: ({ namespace }) => namespace,
      });
      const vocabulary = (namespace: string) =>
        grammar.kinds.elementName.rows.some((row) => row.namespace === namespace);

      return unless(
        type === xsNamespace ||
          Option.exists(
            against,
            (namespace) => !vocabulary(namespace) || typeAvailable(namespace, type),
          ),
        () => ({
          governs: node.governs,
          parentNamespace: Option.getOrElse(against, () => ""),
        }),
      );
    },
    law: "XsiType available",
    over: "members",
  },
];

/**
 * Read a lexical form as the typed value a residual facet bounds: an `xs:double` or `xs:float` by
 * XML Schema's rules, `INF`, `-INF` and `NaN` included, or an `xs:decimal`, after the `collapse`
 * class those primitives read their forms under.
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
 * An `xs:decimal`'s lexical form, collapsed: a sign, integer digits and fraction digits.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#decimal | XML Schema Part 2, 3.2.3 decimal}
 */
const decimalForm = /^(?<sign>[+-]?)(?<whole>[0-9]*)(?:\.(?<fraction>[0-9]*))?$/u;

/**
 * Order two `xs:decimal` lexical forms exactly, by their values.
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
 * Find the residual facets a lexical form's typed value breaks: the bounds on a float, a double or
 * a non-integer decimal that a domain's pattern cannot state (`#pantry/grammar/domains.ts`). `NaN`
 * fails every bound.
 *
 * @param domain - The domain, whose pattern the form matches.
 * @param form - The lexical form as written.
 * @returns Each facet the value lies outside, in the domain's order.
 */
export const facetsBroken = (domain: ValueDomain, form: string): readonly ValueFacet[] => {
  if (domain.facets.length === 0) {
    return [];
  }

  const value = numberOf(form);

  return domain.facets.filter(({ facet, value: bound }) => {
    const limit = numberOf(bound);
    switch (facet) {
      case "maxExclusive": {
        return !(value < limit);
      }
      case "maxInclusive": {
        return !(value <= limit);
      }
      case "minExclusive": {
        return !(value > limit);
      }
      case "minInclusive": {
        return !(value >= limit);
      }
      default: {
        return facet satisfies never;
      }
    }
  });
};

/**
 * Decide whether a lexical form lies in its value domain: it matches the domain's pattern as
 * written, and its typed value meets every residual facet.
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
): boolean => compiled.regex.test(form) && facetsBroken(compiled.domain, form).length === 0;

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
    Option.filter(({ domain }) => domain.pattern !== universal || domain.facets.length > 0),
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
  owner.governs === attribute.governs &&
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
 * @returns The breaches, element by element, each element's law by law.
 */
const attributeBreaches = (view: View, laws: Laws): readonly Breach[] => {
  const ids = new Set(idsOf(view, laws).map(({ id }) => id));

  return [...view.attributesOf].flatMap(([owner, owned]) => {
    const node = view.byId.get(owner);
    const at = pathOf(view, owner);

    const found = owned.map((attribute, slot): readonly (readonly Breach[])[] => {
      const breach = (law: LawName, keys: Keys = {}): Breach => ({
        document: view.path,
        keys: {
          at: String(attribute.at),
          governs: attribute.governs,
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
        Option.exists(compiled, (held) => !inDomain(held, lexical))
          ? [breach("value domain", { lexical })]
          : [],
        Option.exists(compiled, (held) => isIdref(held.domain))
          ? tokensOf(lexical)
              .filter((token) => !ids.has(token))
              .map((token) => breach("Idref target", { token }))
          : [],
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
 * Read the fields of a node row a key copy's selection or check reads
 * (`#pantry/test/key-copies.ts` `nodeFields`), its parent's from the parent's row: a root's parent
 * is the document node, which governs no type and is its own parent's kind.
 *
 * @param view - The node's document.
 * @param node - The node.
 * @returns Its fields.
 */
const nodeFieldsOf = (view: View, node: FoldedNode<Composed>): DocumentRows["Node"] => {
  const parent = view.byId.get(node.parent);

  return {
    chars: charsOf(view, node),
    governs: node.governs,
    kind: node.kind,
    parentGoverns: parent?.governs ?? noType,
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
  const nodes = view.rows.nodes.map((node) => ({
    fields: nodeFieldsOf(view, node),
    node: node.id,
  }));
  const fieldsOf = new Map(nodes.map(({ fields, node }) => [node, fields]));
  const rows = {
    attributes: view.rows.attributes.map((attribute) => ({
      fields: {
        governs: attribute.governs,
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
 * @returns The breaches.
 */
const wholeBreaches = (view: View, laws: Laws): readonly Breach[] => {
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
  const openNameKeys = rows.openNames.map(({ attribute }) => attribute);
  const openNameIds = rows.openNames.map(
    ({ attribute, local, uri }) => `${ownerOf.get(attribute) ?? attribute} {${uri}}${local}`,
  );
  const foreign = new Set(rows.nodes.filter(({ kind }) => isForeignKind(kind)).map(({ id }) => id));
  const documentNodes = rows.nodes.filter(({ start }) => start === 0n).length;
  const ids = new Set(idsOf(view, laws).map(({ id }) => id));

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
          (held) => !overKeyText(node.stringValue) && !inDomain(held, node.stringValue),
        )
        ? [
            breach("TextDomain", {
              governs: node.governs,
              kind: node.kind,
              node: pathOf(view, node.id),
              value: node.stringValue,
              version: node.version,
            }),
          ]
        : [];
    }),
    // C50: an IDREF or IDREFS element text's tokens name ids of its document, as an attribute's do.
    ...rows.nodes.flatMap((node) =>
      Option.exists(checkedTextOf(laws, node), ({ domain }) => isIdref(domain))
        ? tokensOf(node.stringValue)
            .filter((token) => !ids.has(token))
            .map((token) =>
              breach("Idref target", {
                governs: node.governs,
                kind: node.kind,
                name: `the text of ${node.kind}`,
                node: pathOf(view, node.id),
                token,
                version: node.version,
              }),
            )
        : [],
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
 * An NCName, `xs:NCName` as the value domains compile it: the form of a bare variable reference.
 */
const nameForm = new RegExp(
  Result.getOrThrowWith(
    Result.flatMap(builtinDomainOf("NCName"), (domain) => compile(domain, "exact")),
    (unread) => unread,
  ).pattern,
  patternFlags,
);

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

/**
 * The law a content reference breaks, by the attribute that makes it: a feedback element's
 * outcome (`feedback-ref`), a template element's or choice's template variable (`template-ref`),
 * and what a printed variable prints or indexes by (`printed-variable-ref`).
 */
export const contentLaws: ReadonlyMap<string, LawName> = new Map([
  ["base", "Printed variable reference"],
  ["identifier", "Printed variable reference"],
  ["index", "Printed variable reference"],
  ["outcome-identifier", "Feedback reference"],
  ["template-identifier", "Template reference"],
]);

/**
 * The law a content reference breaks where its kind decides it rather than its attribute: a
 * portable custom interaction's context variable (`context-variable-ref`), whose `identifier` is
 * also a printed variable's attribute.
 */
const contentKindLaws: ReadonlyMap<string, LawName> = new Map([
  ["qti-context-variable", "Context variable reference"],
]);

/**
 * Name the law a content reference breaks: its kind's, else its attribute's.
 *
 * @param kind - The kind of the element that makes the reference.
 * @param attribute - The attribute it makes it by.
 * @returns The law, none for a reference no law reads.
 */
export const contentLawOf = (kind: string, attribute: string): Option.Option<LawName> =>
  Option.orElse(Option.fromNullishOr(contentKindLaws.get(kind)), () =>
    Option.fromNullishOr(contentLaws.get(attribute)),
  );

/**
 * The language of a non-negative integer after the `collapse` class: digits, an optional `+`.
 */
const nonNegative = /^\+?[0-9]+$/u;

/**
 * Read a non-negative integer form.
 *
 * @param form - The form as written.
 * @returns Its value, or none when it is no non-negative integer.
 */
const countOf = (form: string): Option.Option<bigint> =>
  Option.liftPredicate(collapsed(form), (value) => nonNegative.test(value)).pipe(
    Option.map(BigInt),
  );

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
 * Read a node's collapsed attribute.
 *
 * @param overlay - The document.
 * @param node - The node.
 * @param name - The attribute's closed name.
 * @returns The collapsed form, or none when the node carries no such attribute.
 */
const collapsedOf = (overlay: Overlay, node: FoldedNode<Composed>, name: string) =>
  valueOf(overlay.view, node.id, name).pipe(Option.map(collapsed));

/**
 * The cardinalities a declaration's `cardinality` spells: a typed variable's three and `record`,
 * the `Cardinality` roster's handles.
 */
const spelledCardinalities: ReadonlySet<string> = new Set([...typedCardinalities, "record"]);

/**
 * The attributes by which an interaction binds a response variable: its `response-identifier`,
 * and an entry interaction's `string-identifier` (§5.48.2, §5.162.3: "binding the interaction to a
 * second response variable (of base-type string)").
 */
const bindingNames = ["response-identifier", "string-identifier"] as const;

/**
 * Read the cardinality a response declaration writes, where it writes one as a cardinality is
 * spelled: the bindings the fit laws judge ("BindingFit", "RecordBindingFit" and "Binding
 * cardinality"). A cardinality left unwritten is refused by AL3 alone, and one written as no
 * cardinality by its value domain alone, never by a fit law over a type the declaration does not
 * have (the orchestrator's ruling of 2026-11-06: an absent attribute is no empty one, and one cause
 * is refused under one rule). The schema's fit laws read a binding's `BindingDeclaration`
 * (`#pantry/qti/interactions.ts`), which only a declared binding has, and that row's cardinality is
 * the `Declaration` row's, which holds an unwritten or unspelled one as `single` (lane NIL's audit,
 * B11): until no `Declaration` row is written for one, a binding whose `single` its interaction
 * does not fit is refused by the schema under BindingFit as well as AL3 or the value domain.
 *
 * @param overlay - The item.
 * @param declaration - The response declaration.
 * @returns The cardinality as written, or none.
 */
const spelledCardinalityOf = (
  overlay: Overlay,
  declaration: FoldedNode<Composed>,
): Option.Option<string> =>
  Option.filter(valueOf(overlay.view, declaration.id, "cardinality"), (written) =>
    spelledCardinalities.has(written),
  );

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
 * Decide whether an `xs:double` lexical form has a typed value the schema compares: grizzle's
 * double form, at most 15 significant digits on each side of the point (`DBL_DIG`) and an exponent
 * of at most 293, or a special value (grizzle's `scalar/lexical.ts` `doubleForm`, restated by its
 * bounds rather than its pattern).
 *
 * @param key - The key.
 * @returns Whether it is in the form.
 */
const inDoubleForm = (key: string): boolean => {
  if (key === "INF" || key === "-INF" || key === "NaN") {
    return true;
  }

  const groups = xsDoubleForm.exec(key)?.groups;
  const mantissa = (groups?.["mantissa"] ?? "").replace(/^[+-]/u, "");
  const [integer = "", fraction = ""] = mantissa.split(".");
  const exponent = groups?.["exponent"] ?? "0";

  return (
    groups !== undefined &&
    integer.replace(/^0+/u, "").length <= 15 &&
    fraction.replace(/0+$/u, "").length <= 15 &&
    Math.abs(Number(exponent)) <= 293
  );
};

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
 * not share (Map key): an integer by `BigInt`, a float in grizzle's double form by `Number`, which
 * rounds a decimal once to its nearest double as PostgreSQL's cast does, a point as its two
 * integers, a pair as its two items in code-point order and a directed pair as its two in order;
 * every other key, a float outside the form included, by its lexical form.
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

  const special = key === "INF" || key === "-INF" || key === "NaN";

  return baseType === "float" && !special && inDoubleForm(key)
    ? `typed ${String(Number(key))}`
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
 * and §5.131.1), each class's element, which spec reading 104 reads one class at a time.
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
 * @returns The count, or none when neither is written or the form is no non-negative integer.
 */
const countAttribute = (
  overlay: Overlay,
  node: FoldedNode<Composed>,
  name: string,
): Option.Option<bigint> =>
  Option.orElse(valueOf(overlay.view, node.id, name), () =>
    Option.fromNullishOr(overlay.laws.defaults.get(`${node.version} ${node.kind} ${name}`)),
  ).pipe(Option.flatMap(countOf));

/**
 * Read the variables a node's references name (`VariableReference`), each with the declaration
 * kinds it may name (`ContentReference`), none for a reference that may name any variable.
 *
 * @param overlay - The document.
 * @param node - The node.
 * @returns Each attribute that names a variable, the identifier it names, and its declaration
 *   kinds.
 */
const namedBy = (
  overlay: Overlay,
  node: FoldedNode<Composed>,
): readonly {
  readonly attribute: string;
  readonly identifier: string;
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
    // element content is (reading 7); one that names none is untyped text.
    node.kind === "ud:value"
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
      const bound = collapsedOf(overlay, node, attribute);
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

      const cardinality = spelledCardinalityOf(overlay, response);
      if (Option.isNone(cardinality)) {
        return [];
      }

      const baseType = Option.getOrElse(collapsedOf(overlay, response, "base-type"), () => "");
      if (attribute === "string-identifier") {
        return baseType === "string"
          ? []
          : [{ keys: { attribute, baseType, identifier }, law: "BindingFit" }];
      }

      const record = Option.isSome(grammar.recordBindingFit.lookup({ kind: node.kind }));
      if (!record && !grammar.bindingFit.rows.some(({ kind }) => kind === node.kind)) {
        return [];
      }

      if (cardinality.value === "record") {
        return record ? [] : [{ keys: { identifier }, law: "RecordBindingFit" }];
      }

      return Option.isSome(
        grammar.bindingFit.lookup({ baseType, cardinality: cardinality.value, kind: node.kind }),
      )
        ? []
        : [{ keys: { baseType, cardinality: cardinality.value, identifier }, law: "BindingFit" }];
    });
  },
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
            ({ identifier, targets }) =>
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
    const mapped =
      node.kind === "qti-response-declaration" &&
      (overlay.view.childrenOf.get(node.id) ?? []).some(({ kind }) => kind === "qti-mapping");
    const baseType = Option.getOrElse(collapsedOf(overlay, node, "base-type"), () => "");

    return mapped && Option.isNone(overlay.laws.grammar.mappableBaseType.lookup({ baseType }))
      ? [{ keys: { baseType }, law: "MappableBaseType" }]
      : [];
  },
  (node, overlay) => {
    const children = overlay.view.childrenOf.get(node.id) ?? [];
    const baseType = Option.getOrElse(collapsedOf(overlay, node, "base-type"), () => "");
    // The cardinality the schema holds of the declaration (`cardinalityOf` of the declarations
    // overlay): an unwritten or unspelled one is held as `single`, so its own laws refuse it
    // (AL1's required attribute, the value domain) and Lookup table cardinality does not again.
    const written = Option.getOrElse(collapsedOf(overlay, node, "cardinality"), () => "");
    const cardinality = spelledCardinalities.has(written) ? written : "single";
    const tables = children.filter(
      ({ kind }) => kind === "qti-match-table" || kind === "qti-interpolation-table",
    );

    return [
      ...(node.kind === "qti-response-declaration" &&
      baseType !== "point" &&
      children.some(({ kind }) => kind === "qti-area-mapping")
        ? [{ keys: { baseType }, law: "AreaMapping base type" } as const]
        : []),
      ...(node.kind === "qti-outcome-declaration" && cardinality !== "single"
        ? tables.map(({ kind }): Finding => ({
            keys: { cardinality, kind },
            law: "Lookup table cardinality",
          }))
        : []),
    ];
  },
  (node, overlay) => {
    if (node.kind !== "qti-mapping") {
      return [];
    }

    const declaration = overlay.view.byId.get(node.parent);
    const baseType =
      declaration === undefined
        ? ""
        : Option.getOrElse(collapsedOf(overlay, declaration, "base-type"), () => "");
    const seen = new Set<string>();

    return (overlay.view.childrenOf.get(node.id) ?? [])
      .filter(({ kind }) => kind === "qti-map-entry")
      .flatMap(({ id }): readonly Finding[] => {
        const key = Option.getOrUndefined(valueOf(overlay.view, id, "map-key"));
        if (key === undefined) {
          return [];
        }

        const lexical: readonly Finding[] = typedAttributeHolds(baseType, key)
          ? []
          : [{ keys: { baseType, value: key }, law: "Typed attribute value" }];
        const value = mapKeyValueOf(baseType, key);
        if (!seen.has(value)) {
          seen.add(value);

          return lexical;
        }

        return [...lexical, { keys: { baseType, key }, law: "Map key" }];
      });
  },
  (node, overlay) => {
    if (node.kind !== "qti-match-table" && node.kind !== "qti-interpolation-table") {
      return [];
    }

    const declaration = overlay.view.byId.get(node.parent);
    const baseType =
      declaration === undefined
        ? ""
        : Option.getOrElse(collapsedOf(overlay, declaration, "base-type"), () => "");
    const values = [
      ...Option.toArray(valueOf(overlay.view, node.id, "default-value")),
      ...(overlay.view.childrenOf.get(node.id) ?? []).flatMap(({ id }) =>
        Option.toArray(valueOf(overlay.view, id, "target-value")),
      ),
    ];

    return values
      .filter((value) => !typedAttributeHolds(baseType, value))
      .map((value): Finding => ({ keys: { baseType, value }, law: "Typed attribute value" }));
  },
  (node, overlay) => {
    if (node.kind !== "qti-selection") {
      return [];
    }

    const parts = (overlay.view.childrenOf.get(node.parent) ?? []).filter(({ kind }) =>
      Option.isSome(overlay.laws.grammar.references.sectionPart.lookup({ kind })),
    ).length;
    const replaced = Option.contains(
      Option.flatMap(collapsedOf(overlay, node, "with-replacement"), booleanOf),
      true,
    );

    return Option.toArray(Option.flatMap(valueOf(overlay.view, node.id, "select"), countOf))
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

    return Option.all([
      valueOf(overlay.view, node.id, "lower-bound"),
      valueOf(overlay.view, node.id, "upper-bound"),
    ]).pipe(
      Option.filter(([lower, upper]) => numberOf(upper) < numberOf(lower)),
      Option.map(([lower, upper]): Finding => ({
        keys: { lower: collapsed(lower), upper: collapsed(upper) },
        law: "Slider bounds",
      })),
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

    return Option.toArray(Option.flatMap(collapsedOf(overlay, node, "figures"), figuresInteger))
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
    const bound = collapsedOf(overlay, node, "response-identifier");
    if (!overlay.isItem || attribute === undefined || Option.isNone(bound)) {
      return [];
    }

    const most = countAttribute(overlay, node, attribute);
    const response = (overlay.declared.get(bound.value) ?? []).find(
      ({ kind }) => kind === "qti-response-declaration",
    );
    const cardinality =
      response === undefined
        ? ""
        : Option.getOrElse(spelledCardinalityOf(overlay, response), () => "");

    return Option.exists(most, (count) => count === 0n || count > 1n) && cardinality === "single"
      ? [
          {
            keys: {
              attribute,
              cardinality,
              identifier: bound.value,
              most: Option.match(most, { onNone: () => "", onSome: String }),
            },
            law: "Binding cardinality",
          },
        ]
      : [];
  },
  (node, overlay) => {
    const named = collapsedOf(overlay, node, "outcome-identifier");
    if (
      !overlay.isItem ||
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
      return [];
    }

    // An outcome that writes no cardinality is refused by AL3 ("required-attribute") alone, not
    // judged as the `single` the schema holds it as (the orchestrator's ruling of 2026-11-06).
    const written = collapsedOf(overlay, outcome, "cardinality");
    if (Option.isNone(written)) {
      return [];
    }

    const baseType = Option.getOrElse(collapsedOf(overlay, outcome, "base-type"), () => "");
    const cardinality = written.value;

    return baseType === "identifier" && (cardinality === "single" || cardinality === "multiple")
      ? []
      : [
          {
            keys: { baseType, cardinality, identifier: named.value },
            law: "Feedback outcome type",
          },
        ];
  },
  (node, overlay) =>
    node.kind === "qti-associable-hotspot" &&
    node.parentKind === "qti-graphic-gap-match-interaction" &&
    Option.contains(collapsedOf(overlay, node, "shape"), "default")
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
 * @returns The breaches.
 */
const overlayBreaches = (view: View, laws: Laws): readonly Breach[] => {
  // A declaration without an identifier declares no variable: AL3 refuses it, and it shares no
  // identifier with another declaration that lacks one.
  const declarations = view.members.filter(
    ({ id, kind }) =>
      laws.grammar.references.declarationKind.has(kind) &&
      Option.isSome(valueOf(view, id, "identifier")),
  );
  const declared = Map.groupBy(declarations, (node) =>
    collapsed(Option.getOrElse(valueOf(view, node.id, "identifier"), () => "")),
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
  // Reading 92: "Each response variable declared may be bound to one and only one interaction",
  // so in an item no two of the interactions Binding declared reads name one response.
  const bindings = overlay.isItem
    ? Map.groupBy(
        view.members.flatMap((node) =>
          (Option.isSome(laws.grammar.recordBindingFit.lookup({ kind: node.kind })) ||
            laws.grammar.bindingFit.rows.some(({ kind }) => kind === node.kind)) &&
          Option.isSome(valueOf(view, node.id, "response-identifier"))
            ? [
                {
                  identifier: collapsed(
                    Option.getOrElse(valueOf(view, node.id, "response-identifier"), () => ""),
                  ),
                  node,
                },
              ]
            : [],
        ),
        ({ identifier }) => identifier,
      )
    : new Map<
        string,
        readonly { readonly identifier: string; readonly node: FoldedNode<Composed> }[]
      >();
  // Reading 104: a choice's identifier names one choice of its class in its document, whichever
  // interactions hold them, and no item variable: no declaration of its document and, in an item,
  // no built-in variable.
  const choices = view.members.flatMap((node) =>
    choiceClasses.has(node.kind)
      ? Option.toArray(collapsedOf(overlay, node, "identifier")).map((identifier) => ({
          identifier,
          node,
        }))
      : [],
  );
  const choiceNames = Map.groupBy(choices, ({ identifier, node }) => `${node.kind} ${identifier}`);
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
 * @returns The breaches: the node laws in their order, the child sets, the attribute laws, the
 *   laws over the whole document, then the overlays.
 */
export const documentBreaches = (
  path: string,
  rows: FoldedRows<Composed>,
  laws: Laws,
): readonly Breach[] => {
  const view = viewOf(path, rows);

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
    ...attributeBreaches(view, laws),
    ...wholeBreaches(view, laws),
    ...overlayBreaches(view, laws),
    ...lawDocumentBreaches(path, rows, laws.grammar),
  ];
};

/**
 * One document a manifest lists, read: its path, the resource that lists it, what the package laws
 * read of its root element, and its folded rows, or the refusal of a fold that has none.
 */
interface Listed {
  /**
   * Its rows indexed for the laws, or the one breach of a document the folds refuse, since it has
   * no rows for any other law to read.
   */
  readonly folded: Result.Result<View, Breach>;
  /**
   * The collapsed `identifier` its root element carries, none when it carries none.
   */
  readonly identifier: Option.Option<string>;
  readonly path: string;
  readonly resource: ResourceOf;
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
 * Each declared attribute's whitespace class, by `version kind name`, a union's read as
 * `preserve`: what an href's value is read under before it resolves.
 */
const hrefWhiteSpaces: ReadonlyMap<string, OracleWhiteSpace> = new Map(
  attributeDeclarations.flatMap(({ kind, name, type, versions }) =>
    versions.map(
      (version) =>
        [
          `${version} ${kind} ${name}`,
          type.whiteSpace === "union" ? "preserve" : type.whiteSpace,
        ] as const,
    ),
  ),
);

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
    for (const view of Result.isSuccess(folded) ? [folded.success] : []) {
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
 * The resource types whose LOM record names its document (reading 62): an item's and a test's, as
 * the implementation guide's LOM profile says "the test or item identifier should be present as
 * an identifier in the LOM metadata", a recommendation the operator rules binding.
 */
const lomNamed: ReadonlySet<string> = new Set([itemType, "imsqti_test_xmlv3p0"]);

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
 * and 103): every attribute of the grammar's reference census is resolved with the `xml:base`
 * values in scope ({@link resolvedAt}); one the representation reads no name from, and a `srcset`
 * of more than one candidate or with a descriptor, breaks "Href form"; and each that resolves in
 * the package names an entry ("File exists", IMS Content Packaging 1.2, InterchangePackage (d)), a
 * stimulus ref's a stimulus.
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
    if (Result.isFailure(folded)) {
      return [];
    }

    const view = folded.success;
    const breach = (law: LawName, keys: Keys): Breach => ({
      document: path,
      keys: { node: "", ...keys },
      law,
    });
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
            whiteSpace:
              hrefWhiteSpaces.get(`${member.version} ${member.kind} ${name}`) ?? "collapse",
          }).resolution,
        })),
      ),
    );

    return [
      ...references
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
      ...references.flatMap(({ member, resolution }) =>
        resolution.scope !== "entry" || entries.has(resolution.path)
          ? []
          : [breach("File exists", { from: pathOf(view, member.id), path: resolution.path })],
      ),
      ...references.flatMap(({ member, resolution }) =>
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
 * reads, its href as written, the path it resolves to and the listed document there.
 */
interface SiteOf {
  readonly document: Listed;
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
    if (Result.isFailure(document.folded)) {
      return [];
    }

    const view = document.folded.success;

    return view.members
      .filter((member) => merges(grammar, member))
      .map((node): SiteOf => {
        const href = valueOf(view, node.id, "href");
        const path = href.pipe(
          Option.flatMap((lexical) => entryPathAt(resolvedAt(view, node.id, lexical))),
        );

        return {
          document,
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
 * Decide whether an include under a parent is spliced in place, by the schema's one statement of it
 * (`#pantry/qti/tests.ts` `splicingParents`, spec reading 117): one a section holds is a site of
 * the test's assembly instead, which reading 86 reads as Q5.13's instances do, each written element
 * once, so its document is judged as written.
 *
 * @param parent - The include's parent's kind.
 * @returns Whether it is.
 */
const splices = (parent: string): boolean => splicingParents.some((kind) => kind === parent);

/**
 * Decide whether a site splices its target in place: an include outside a section whose target is
 * listed and whose root the include may stand for.
 *
 * @param grammar - The composed grammar.
 * @param site - The site.
 * @returns The target, none for a site that splices nothing.
 */
const splicedTarget = (grammar: ComposedGrammar, site: SiteOf): Option.Option<Listed> =>
  site.node.kind === "xi:include" && splices(site.node.parentKind)
    ? site.target.pipe(
        Option.filter((target) =>
          standsFor(grammar, site.node.version, site.node.parentKind, target.rootKind),
        ),
      )
    : Option.none();

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
 *   representation resolves, a document the manifest lists;
 * - **"Include root":** that document's root is a kind the include may stand for ({@link standsFor});
 * - **"Include fragment identifier":** no include's href carries a `#` after its path (XInclude 1.0
 *   §3.1), wherever the include stands;
 * - **"Fragment context"**, a stated limit: the sites that name one document stand inside one
 *   interaction or outside every interaction, each site's interaction its own document's nearest,
 *   or, outside every interaction of its document, its document's context's.
 *
 * @param documents - The documents the manifest lists, read.
 * @param grammar - The composed grammar.
 * @returns The breaches, each at the including document.
 */
const inclusionBreaches = (
  documents: readonly Listed[],
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const sites = sitesOf(documents, grammar);
  const includes = documents.flatMap(({ folded, path }) =>
    Result.isSuccess(folded)
      ? folded.success.members
          .filter(({ kind }) => kind === "xi:include")
          .flatMap((node) =>
            Option.toArray(valueOf(folded.success, node.id, "href")).flatMap((href) =>
              href.includes("#")
                ? [
                    {
                      document: path,
                      keys: { href, node: pathOf(folded.success, node.id) },
                      law: "Include fragment identifier" as const,
                    },
                  ]
                : [],
            ),
          )
      : [],
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
      if (site.node.kind !== "xi:include") {
        return [];
      }

      return Option.match(site.target, {
        onNone: () => [
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

    if (child.kind === "xi:include" && splices(parent)) {
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
 * Evaluate R26, `document-lang` (law "Document lang"; QTI 3.0 Metadata §2.7.1.3: "There must be
 * one value for each of the languages referred to by the language attributes on the associated
 * assessmentItem, test or object bank and its 'bodyElements'"): each language an item's or a test's
 * `xml:lang` states is listed by every general category of each record that is a child of the
 * `cp:metadata` of a resource whose `href` names the document, as every listed document's resource
 * does (`documentsOf`, readings 93 and 102). An item's `xml:lang` forms are its merged document's
 * (spec reading 117): its own, and those of every fragment its includes splice in; a fragment a
 * test places is a known under-refusal, which reading 117 lists.
 *
 * An `xml:lang` is read by its value, its form collapsed, and one that is empty or all whitespace
 * states no language (XML 1.0 §2.12); a LOM `language` is its text as written. The two compare as
 * tags, without regard to case (RFC 5646 §2.1.1).
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
      documents.filter(({ resource }) => lomNamed.has(resource.type)),
      ({ path }) => path,
    ),
  ].flatMap(([path, listed]) => {
    const generals = listed.flatMap(({ resource }) =>
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
        Result.isSuccess(folded)
          ? [...folded.success.valuesOf.values()].flatMap((named) =>
              Option.toArray(Option.fromNullishOr(named.get("xml:lang"))),
            )
          : [],
      ),
    );

    return [...forms].flatMap((form): readonly Breach[] => {
      const value = caseFolded(collapsed(form));
      const missing = generals.filter((general) => !languagesOf(general).includes(value));

      return value === "" || missing.length === 0
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
  const typesAt = new Map<string, ReadonlySet<string>>();
  for (const { path, resource } of input.documents) {
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
    // A path two resources name under two document types would be two documents at one path,
    // which `Document`'s key over (package, path) refuses: the import reads each (path, type) a
    // resource's href names as a document of that type (reading 93).
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
    ...inclusionBreaches(input.documents, grammar),
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
      if (!lomNamed.has(document.resource.type)) {
        return [];
      }

      // The resource's own records, each a `lom:lom` of its `cp:metadata` (spec reading 62): a
      // `cp:file`'s record describes the file ("The scope of Metadata is the parent container class
      // only", IMS Content Packaging 1.2 §6.7).
      const loms = manifest.members.filter((member) => {
        const [metadata, owner] = ancestorsOf(manifest, member);

        return (
          member.kind === "lom:lom" &&
          metadata?.kind === "cp:metadata.resource" &&
          owner === document.resource.node
        );
      });
      const identifier = Option.isSome(
        grammar.package.rootOfType.lookup({
          root: document.rootKind,
          type: document.resource.type,
        }),
      )
        ? document.identifier
        : Option.none();

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
                identifier: Option.getOrElse(identifier, () => ""),
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
 * Fold one shredded document and index its rows for the laws.
 *
 * @param path - The document's path in its package.
 * @param tree - The document.
 * @param idOf - Draws the id of each node, as `fold` reads it.
 * @param grammar - The closed relations the folds read.
 * @returns The view, or the breach of a fold that meets a missing cell and so has no rows.
 */
const foldedOf = (
  path: string,
  tree: XdmDocument<Composed>,
  idOf: (index: number) => NodeId,
  grammar: FoldGrammar<Composed>,
): Result.Result<View, Breach> =>
  Result.mapBoth(fold(tree, idOf, grammar), {
    onFailure: (refusal) => refusalBreach(path, tree, idOf, refusal),
    onSuccess: (rows) => viewOf(path, rows),
  });

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
 * Judge every listed document's own laws in place (reading 117): a document an include splices into
 * another is judged inside each document that splices it, and not alone; every other document is
 * judged with its includes spliced, as XInclude's result infoset reads it, so its included
 * fragments' content stands where it is included, binding its item's responses and counting among
 * its IDs. A document whose fold meets a missing cell has that refusal as its one breach.
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

  return documents.flatMap((listed, index) => {
    if (Result.isFailure(listed.folded)) {
      return [listed.folded.failure];
    }

    if (placed.has(listed.path)) {
      return [];
    }

    if (!splicing.has(listed.path)) {
      return documentBreaches(listed.path, listed.folded.success.rows, laws);
    }

    const tree: XdmDocument<Composed> = {
      ...listed.tree,
      root: splicedElement(grammar, byPath, listed.tree.root, listed.path, [listed.path]),
    };

    return Result.match(foldedOf(listed.path, tree, idsFor(index + 1), foldGrammar), {
      onFailure: (breach) => [breach],
      onSuccess: (read) => documentBreaches(read.path, read.rows, laws),
    });
  });
};

/**
 * Judge a package as the importer will read it, and every law over its rows.
 *
 * The manifest is read and its schema version decoded, then the manifest and each document it
 * lists are read and shredded in manifest order: the first refusal of the reader or the codec is
 * the judgment, since no row of the package is written. Otherwise every document is folded, and
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
    const manifest = foldedOf(manifestFile.path, manifestTree, idsFor(0), foldGrammar);
    const listing = Result.match(manifest, {
      onFailure: () => [],
      onSuccess: (view) => documentsOf(resourcesOf(view, grammar), grammar),
    });
    const byPath = new Map(files.map((file) => [file.path, file]));
    const documents: Listed[] = [];
    const missing: string[] = [];
    for (const [index, { path, resource }] of listing.entries()) {
      const file = byPath.get(path);
      if (file === undefined) {
        missing.push(path);
      } else {
        const xml = yield* readDocument(path, file.bytes);
        const tree = yield* shredDocument(path, xml, version, shredGrammar);
        documents.push({
          folded: foldedOf(path, tree, idsFor(index + 1), foldGrammar),
          identifier: rootIdentifierOf(tree),
          path,
          resource,
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

  return Result.match(manifest, {
    onFailure: (breach): Judged => ({
      _tag: "Judged",
      breaches: [breach],
      documents: [manifestFile.path],
    }),
    onSuccess: (view): Judged => ({
      _tag: "Judged",
      breaches: [
        ...packageBreaches({ documents, files, manifest: view, missing }, laws),
        ...documentBreaches(view.path, view.rows, laws),
        ...inPlaceBreaches(documents, grammar, foldGrammar, laws),
        ...lawPackageBreaches(
          {
            documents: documents.flatMap((listed) =>
              Result.isSuccess(listed.folded)
                ? [
                    {
                      path: listed.path,
                      resourceType: listed.resource.type,
                      rows: listed.folded.success.rows,
                    },
                  ]
                : [],
            ),
            entries: files.map(({ path }) => path),
            manifest: { path: view.path, rows: view.rows },
          },
          grammar,
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
        model === noSharedModel
          ? []
          : grammar.content.symbol.rows
              .filter((row) => row.model === model && row.position === position)
              .map(({ kind }) => kind),
    }),
  ]),
];

/**
 * Explain a value against the domain it is read under: the values an enumeration admits where it
 * is outside them, the pattern it misses, or the residual facets its typed value lies outside.
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
          return `${JSON.stringify(form)} is outside ${domain.handle}'s ${facetsBroken(domain, form)
            .map(({ facet, value }) => `${facet} ${value}`)
            .join(", ")}`;
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
        field(keys, "governs"),
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
 * One law of the oracle, in one place: the rule its refusal is named by, the source it states, and
 * its explanation, computed from a breach's keys and the closed relations the law reads. `node`
 * marks a law over node rows, which {@link nodeLaws} states in the order the oracle evaluates
 * them.
 */
export interface OracleLaw {
  readonly explain: Explainer;
  readonly node?: true;
  readonly rule: OracleRule;
  readonly source: string;
}

/**
 * The oracle's own laws. Each source is a reading of `docs/spec-readings.md`, an XML Schema or XSD
 * anchor, a specification section, or the design document a structural law comes from; where a law
 * follows one reading over another, its source says which.
 */
const ownLaws = {
  "AL1 admission": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} admits no ${field(keys, "name")} in ${field(keys, "version")}; it admits ${inBraces(
        admittedNames(keys, grammar).map(({ name }) => name),
      )}`,
    rule: "attribute-admission",
    source:
      "the XSDs' attribute declarations and wildcards as AttributeAdmission (fin.md D2); reading 13 for data-*, reading 47 for xsi:; and the declarations readings refuse (attributes.ts readingRefusals): 9 (role on source, the Schematron's RULE ARIA ROLE 1a) and 85 (xi:include's xpointer)",
  },
  "AL1 owner": {
    explain: (keys) =>
      field(keys, "ownerDocument") === ""
        ? `the attribute at slot ${field(keys, "at")} sits on a ${field(keys, "ownerKind") || "missing node"}, which is no element`
        : `the attribute's owner copy (${field(keys, "kind")}, ${field(keys, "version")}) is not its owner's (${field(keys, "ownerKind")}, ${field(keys, "ownerVersion")}, document ${field(keys, "ownerDocument")})`,
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's owner copy (kind, version, document)",
  },
  "AL2 count": {
    explain: (keys) =>
      `attributes ${field(keys, "attributes")} over ${field(keys, "rows")} attribute rows`,
    node: true,
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's count",
  },
  "AL2 distinct": {
    explain: (keys) =>
      `${field(keys, "name")} takes position ${field(keys, "position")}, which attrs ${inBraces(membersOf(keys["attrsWas"]))} already holds, and no open class does`,
    rule: "attribute-admission",
    source:
      "XML 1.0 §3.1, WFC Unique Att Spec, by position (fin.md §16, masked by the open classes, D2)",
  },
  "AL2 fold": {
    explain: (keys) =>
      `attrs ${inBraces(membersOf(keys["attrs"]))} from attrsWas ${inBraces(membersOf(keys["attrsWas"]))}, where its predecessor's fold is ${inBraces(membersOf(keys["predecessorAttrs"]))}`,
    rule: "attribute-admission",
    source: "fin.md §16, attrs = attrsWas | bit(position)",
  },
  "AL2 last slot": {
    explain: (keys) =>
      `attrs ${inBraces(membersOf(keys["attrs"]))}, where its last attribute's fold is ${inBraces(membersOf(keys["lastAttrs"]))}`,
    node: true,
    rule: "attribute-admission",
    source: "fin.md §16, the attribute family's end value",
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
    rule: "required-attribute",
    source:
      "the XSDs' use=\"required\", and reading 123: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BDO (§5.11: 'Authors must specify the dir attribute on this tag'), where the XSD declares bdo's dir optional (attributes.ts readingUses): AttributeAdmission's use side (Required)",
  },
  "AL4 open name key": {
    explain: (keys) =>
      `${field(keys, "openNames")} open names, ${field(keys, "distinct")} distinct by (node, uri, local)`,
    rule: "attribute-admission",
    source: "fin.md D2, an open-class attribute keeps its exact name; reading 13",
  },
  "AL4 open names": {
    explain: (keys) =>
      `${field(keys, "openNames")} open names over ${field(keys, "openAttributes")} open-class attributes`,
    rule: "attribute-admission",
    source: "fin.md D2, an open-class attribute keeps its exact name; reading 13",
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
    rule: "attribute-count",
    source:
      "readings 41 and 43 (attributes.ts attributeCounts): https://www.w3.org/TR/speech-synthesis11/#S3.1.6 (SSML 1.1 §3.1.6, meta: 'Either a name or http-equiv attribute is required. It is an error to provide both name and http-equiv attributes'); https://www.w3.org/TR/speech-synthesis11/#S3.2.1 and #S3.2.4 (§3.2.1, voice, and §3.2.4, prosody: 'Although each attribute individually is optional, it is an error if no attributes are specified'), counting what §2.2.1's fragment removal keeps: SSML's own attributes, xml:lang and xml:base",
  },
  "AreaMapping base type": {
    explain: (keys) =>
      `an area mapping of base type ${JSON.stringify(field(keys, "baseType"))}, where an area mapping maps points alone`,
    rule: "mapping-base-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_AreaMapping (§5.5, the AreaMapping class: 'A special class used to create a mapping from a source set of point values to a target set of float values'): an area mapping's response declaration is of base type point (mapping.ts AreaMapping_base_type)",
  },
  "Aria value range": {
    explain: (keys) =>
      `${field(keys, "kind")}'s aria-valuemax ${field(keys, "max")} is below its aria-valuemin ${field(keys, "min")}`,
    rule: "aria-value-range",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ARIABase.Attr_aria-valuemax (§5.2.31, and §7.1.31 of ARIABaseEmpty: 'Authors MUST ensure the value of 'aria-valuemax' is greater than or equal to the value of 'aria-valuemin''), both read as xs:decimal, as the XSD types them (interactions.ts AriaRange); reading 91 makes the MUST a law",
  },
  Arity: {
    explain: (keys, grammar) =>
      Option.match(grammar.operatorArity.lookup({ kind: field(keys, "kind") }), {
        onNone: () => `${field(keys, "kind")} has no OperatorArity row`,
        onSome: ({ max, min }) =>
          `${field(keys, "kind")} holds ${field(keys, "count")} expressions; OperatorArity admits ${String(min)} to ${String(max)}`,
      }),
    rule: "P2",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Abstract_ExpressionGroup (§6.9, ExpressionGroup: each operator's attribute is of a container class whose logic attribute's multiplicity is its sub-expression count, §5.83.1 Logic0toMany '[0.. unbounded]', §5.84.1 Logic1toMany and §5.94.1 NumericLogic1toMany '[1.. unbounded]', §5.85.1 LogicPair '[2]' and §5.86.1 LogicSingle '[1]', or of its own class, whose logic attribute states its count, as §5.113.2 Repeat's '[1.. unbounded]' with §5.113's 'The repeat operator takes one or more sub-expressions', over §6.9.49's '0 or more'; a leaf class's children row reads 'There are no children.'; as §6.9.21, https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-match, 'The match operator takes two sub-expressions') (expression.ts OperatorArity); reading 21",
  },
  "Attribute prefix": {
    explain: (keys) =>
      `${field(keys, "kind")}'s attribute ${field(keys, "name")} is written with the prefix ${JSON.stringify(field(keys, "prefix"))}, where a name in no namespace has none, an xml: name has xml, and a name in another namespace has a declared prefix other than xml and xmlns`,
    rule: "attribute-admission",
    source:
      "reading 47 (an xsi: attribute is exported byte for byte, C54), with https://www.w3.org/TR/xml-names/#ns-decl (Namespaces in XML 1.0 §3: 'The prefix xml is by definition bound to the namespace name http://www.w3.org/XML/1998/namespace … Other prefixes MUST NOT be bound to this namespace name'; 'The prefix xmlns is used only to declare namespace bindings') and https://www.w3.org/TR/xml-names/#defaulting (§6.2: 'The namespace name for an unprefixed attribute name always has no value'): every attribute keeps the prefix its name is written with, empty for a name in no namespace, xml for the XML namespace's, and neither empty, xml nor xmlns for an xsi:, xlink: or namespaced open name (attributes.ts Attribute_prefix)",
  },
  "AttributeEntity owner": {
    explain: (keys) =>
      `an entity reference at offset ${field(keys, "offset")} of attribute ${field(keys, "attribute")} has no attribute row`,
    rule: "attribute-lexical",
    source: "XML 1.0 §4.1 (entity references in attribute values), kept unexpanded (plan §1.4)",
  },
  "Binding cardinality": {
    explain: (keys) =>
      `${field(keys, "kind")}'s ${field(keys, "attribute")} is ${field(keys, "most")}, so it binds a response of multiple cardinality, and ${field(keys, "identifier")} is ${field(keys, "cardinality")}`,
    rule: "binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_max-choices (§5.30.2: 'If max-choices is greater than 1 (or 0) then the interaction must be bound to a response with multiple cardinality'), and the same sentence of max-choices (§5.66.1, §5.68.2, §5.107.3, §5.128.2) and max-associations (§5.8.2, §5.57.3, §5.59.2, §5.60.2, §5.89.2), reading 92; the Schematron's RESPONSEDEC rule 2 is the choice interaction's case; a most left unwritten reads its XSD default",
  },
  "Binding declared": {
    explain: (keys) =>
      `response-identifier names ${field(keys, "identifier")}, which no qti-response-declaration declares`,
    rule: "binding-declared",
    source:
      "reading 75: https://www.imsglobal.org/spec/qti/v3p0/info#Data_ResponseDeclaration (§5.115: 'Response variables are declared by response declarations and bound to interactions in the itemBody'), https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_BasePromptInteraction.Attr_response-identifier (§5.15.7, and §5.18.6, §5.19.6, §5.45.1 and §5.162.1, each of multiplicity [1]: 'The response variable associated with the interaction') and each interaction class's binding sentence, as https://www.imsglobal.org/spec/qti/v3p0/info#Data_ChoiceInteraction (§5.30: 'The ChoiceInteraction must be bound to a response variable with a base-type of identifier and single or multiple cardinality'): an interaction's response-identifier names a response declaration of its item; the text entry interaction's response-identifier is the XSD's IDREF (reading 14), every other interaction's, the extended text interaction's among them, an IdentifierDType this law resolves",
  },
  "Binding unique": {
    explain: (keys) =>
      `${field(keys, "kind")} binds ${field(keys, "identifier")}, which ${field(keys, "first")} already binds; a response variable is bound to one interaction only`,
    rule: "binding-unique",
    source:
      "reading 92: https://www.imsglobal.org/spec/qti/v3p0/info#Data_ResponseDeclaration (§5.115: 'Each response variable declared may be bound to one and only one interaction'): no two interactions of an item name one response variable",
  },
  BindingFit: {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} binds ${field(keys, "identifier")}, of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}; BindingFit admits ${inBraces(
        grammar.bindingFit.rows
          .filter(({ kind }) => kind === field(keys, "kind"))
          .map(({ baseType, cardinality }) => `${baseType} ${cardinality}`),
      )}`,
    rule: "binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 (§2.4, each interaction's 'must be bound to a response variable with a base-type of … and … cardinality', as §2.4.1.1 https://www.imsglobal.org/spec/qti/v3p0/info#ChoiceInt) (expression.ts BindingFit)",
  },
  "Branch forward": {
    explain: (keys) =>
      `a branch rule of ${field(keys, "owner")} names ${field(keys, "target")}, which does not lie after it and no shuffle orders the two`,
    rule: "branch-forward",
    source:
      "reading 87: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BranchRule (§5.23: 'the test jumps forward to the item, section or part referred to by the target identifier', 'the target must refer to an item or section in the same test-part that has not yet been presented'): a target lies after its source's end in the assembled test, unless the section that orders the two shuffles (§5.98: the child elements of an invisible section not kept together 'are mixed into the parent's selection prior to shuffling'); fixed is not read, a recorded limit (tests.ts Branch_forward)",
  },
  "Branch target": {
    explain: (keys) =>
      `a branch rule of ${field(keys, "owner")} names ${field(keys, "target")}, which is no exit and no part of its kind in its test part that its placement may reach`,
    rule: "branch-target",
    source:
      "reading 87: https://www.imsglobal.org/spec/qti/v3p0/info#Data_BranchRule (§5.23: 'In the case of an item or section, the target must refer to an item or section in the same test-part … For test-parts, the target must refer to another test-part'; §5.23.1, the reserved EXIT_SECTION, EXIT_TESTPART and EXIT_TEST), §7.5 ('branching rules should treat referred sections as leaf nodes') and §5.98 ('It is therefore an error to make such an item the target of a branch-rule', of an item a selection with replacement can repeat): a target is an exit, or a part of its source's kind in its source's test part, in an instance that holds its source's, never a replaceable item ref (tests.ts Branch_target)",
  },
  "Choice bounds": {
    explain: (keys) =>
      field(keys, "choices") === ""
        ? `${field(keys, "min")} ${field(keys, "least")} exceeds ${field(keys, "max")} ${field(keys, "most")}`
        : `${field(keys, "attribute")} ${field(keys, "count")} exceeds the ${field(keys, "choices")} choices ${field(keys, "kind")} holds`,
    rule: "choice-bounds",
    source:
      "reading 76: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_min-choices (§5.30.3: 'min-choices must be less than or equal to the limit imposed by max-choices'; §5.30.2: 'If max-choices is 0 then there is no restriction'), the same sentence for min-associations (§5.8.3, §5.57.2, §5.59.1, §5.60.1, §5.89.3), match-min (§5.7.9, §5.56.6, §5.58.6, §5.131.7), min-choices (§5.66.2, §5.68.1, §5.107.2, §5.128.1) and min-strings (§5.48.7, with reading 53's 0); reading 18: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_OrderInteraction.Attr_max-choices (§5.97.3, and §5.61.2 of the graphic order interaction: 'Used in conjunction with min-choices, if specified, max-choices must be greater than or equal to min-choices and must not exceed the number of choices available'; §5.97.2, §5.61.1: min-choices 'must not exceed the number of choices available. If unspecified, all of the choices must be ordered and max-choices is ignored'), with no 0 exemption, read only where min-choices is written (references.ts ChoiceBound's counted zero and ChoiceCount); the media interaction's plays by reading 9, the Schematron's rule 13Ba read by intent, max-plays 0 no limit (§5.92.3)",
  },
  "Choice identifier key": {
    explain: (keys) =>
      `${field(keys, "kind")}'s identifier ${field(keys, "identifier")} is the identifier of the ${field(keys, "kind")} at ${field(keys, "first")}; a choice's identifier names one choice of its class in its document`,
    rule: "choice-identifier-distinct",
    source:
      'reading 104: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SimpleChoice.Attr_identifier (§5.132.1, and §5.7.1, §5.55.1, §5.56.1, §5.58.1, §5.65.1, §5.67.1, §5.73.1 and §5.131.1: \'This identifier must not be used by any other choice or item variable\', each class naming its own noun) and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Identifier (§7.16: an identifier is \'a logical reference to another object in the item, such as an itemVariable or choice\'): no two choices of one kind in a document share an identifier, whichever interactions hold them, nor two hottexts of a document, compared collapsed (interactions.ts key(on(Choice, "document", "kind", "identifier")) and key(on(Hottext, "document", "identifier")))',
  },
  "Choice not variable": {
    explain: (keys) =>
      `${field(keys, "kind")}'s identifier ${field(keys, "identifier")} names ${field(keys, "variable") === "built-in" ? "a built-in variable" : "a variable its document declares"}; a choice's identifier names no item variable`,
    rule: "choice-identifier-distinct",
    source:
      "reading 104: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SimpleChoice.Attr_identifier (§5.132.1 and the other choice classes' identifier: 'This identifier must not be used by any other choice or item variable'), https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Variable (§7.47: a variable is one 'declared in a corresponding variable declaration or is one of the built-in variables'), https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ResponseDeclaration.Attr_identifier (§5.115.1, and §4.5.1 and §5.151.1: 'The identifiers of the built-in session variables are reserved. They are completionStatus, numAttempts and duration') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'There is one built-in context variable named \"QTI_CONTEXT\" with record cardinality'): no choice or hottext bears the identifier of a declaration of its document, nor in an item that of a built-in variable, compared collapsed (interactions.ts ChoiceVariableName, Choice_not_variable)",
  },
  "Condition type": {
    explain: (keys) =>
      `the condition of ${field(keys, "parentKind")} is ${field(keys, "baseType")} ${field(keys, "cardinality")}, not boolean single`,
    rule: "P21",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_ResponseCondition_qti-response-if (§5.114.1, and §5.114.2 and §5.117 of the response branches, §5.99.1, §5.99.2 and §5.101 of the outcome branches, and §5.149.1, §5.149.2 and §5.154 of the template branches: each 'consists of an expression which must have an effective base-type of boolean and single cardinality'), and https://www.imsglobal.org/spec/qti/v3p0/info#Data_TemplateConstraint (§5.150: 'A templateConstraint contains an expression which must have an effective base-type of boolean and single cardinality') (expressions.ts Condition_type; the old checker's P21)",
  },
  "Context variable reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
    rule: "context-variable-ref",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_PortableCustomInteraction_qti-context-variable (§5.106.6: 'This allows an item author to bind a context variable to the PCI instance'), https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'Context variables, variables declared by context declarations', and 'There is one built-in context variable named \"QTI_CONTEXT\" with record cardinality') and the Schematron's rule 20Ba (reading 9): a PCI's qti-context-variable names QTI_CONTEXT or a declared context variable (references.ts ContentReference)",
  },
  "Declaration base type": {
    explain: (keys) =>
      `${field(keys, "identifier")} is of cardinality ${JSON.stringify(field(keys, "cardinality"))} and base type ${JSON.stringify(field(keys, "baseType"))}, where a record declares no base type and every other variable declares one`,
    rule: "declaration-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_base-type (§4.5.3, and §5.34.3, §5.115.3, §5.151.3: 'The value space from which the variable's value can be drawn (or in the case of containers, from which the individual values are drawn) is identified with a base-type', 'Variables with record cardinality have no base-type'): a record declares no base type (BaseType none), and every other variable declares one",
  },
  "Declaration key": {
    explain: (keys) => `a second declaration of ${field(keys, "identifier")}`,
    rule: "declaration-key",
    source:
      "reading 74: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_identifier (§4.5.1, and §5.34.1, §5.115.1, §5.151.1: 'All item variables declared in an item share the same namespace'); a response's and a context's identifier is a UniqueIdentifier (§5.115.1, §5.34.1; §7.43: 'unique within the scope of the instance'), though the 3.0.1 XSD types the context's an IdentifierDType, an xs:NCName, so DocumentId key counts it among the IDs",
  },
  "Declaration not reserved": {
    explain: (keys) =>
      `${field(keys, "identifier")} is a built-in session variable, which is declared implicitly and must not be declared`,
    rule: "declaration-reserved",
    source:
      "reading 72: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_identifier (§4.5.1, §5.115.1, §5.151.1: 'The identifiers of the built-in session variables are reserved. They are completionStatus, numAttempts and duration'), each spelled exactly, with no alias, the identifier compared collapsed (references.ts BuiltInVariable, its session variables); the context variable QTI_CONTEXT is Reserved type's",
  },
  Document: {
    explain: (keys) =>
      `the Document row's node ${field(keys, "documentRow")} is not the document node ${field(keys, "self")}`,
    rule: "reachability",
    source: "the XDM document node as the Document row (plan §1.4, fin.md D7)",
  },
  "Document entry": {
    explain: (keys) => `the listed document ${field(keys, "path")} is no entry of the package`,
    rule: "entry-kind",
    source:
      "IMS Content Packaging 1.2: a listed document is an entry of the package, and one document: a resource names the document at its href, read as a document of its type (reading 93), so no path is listed as documents of two types (qti/package.ts, Document's key over package and path)",
  },
  "Document lang": {
    explain: (keys) =>
      `the document's xml:lang ${JSON.stringify(field(keys, "lang"))} states a language that its resource's LOM general categories ${inBraces(membersOf(keys["generals"]))} do not all list`,
    rule: "document-lang",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.3, Language: 'There must be one value for each of the languages referred to by the language attributes on the associated assessmentItem, test or object bank and its 'bodyElements'', normative by its §1.2; ~/.cache/gr8des/qti-md-bind/index.txt:1509 and :388): each language an item's or a test's xml:lang states (XML 1.0 §2.12, the empty one stating none) is listed by every general category of each record of the resource whose href names the document (identity.ts documentLang, through metadata.ts LomObject); xml:lang compared by its collapsed xs:language value and the LOM language as written, both as tags without regard to case (RFC 5646 §2.1.1)",
  },
  "DocumentId key": {
    explain: (keys) =>
      `a second element purports the id ${field(keys, "id")}, which ${field(keys, "first")} already holds`,
    rule: "document-key",
    source:
      "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): no id's [binding] has more than one member, an attribute's binding its element, an ID-typed element text's its parent (§3.15.5; reading 101; identity.ts IdBinding); reading 14; reading 74: a context declaration's identifier, a UniqueIdentifier (https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ContextDeclaration.Attr_identifier, §5.34.1), is one of the document's IDs, though the 3.0.1 XSD types it an IdentifierDType",
  },
  "E1 derived": {
    explain: (keys) =>
      `holds state ${field(keys, "state")}, ${field(keys, "elements")} elements, ancestry ${inBraces(membersOf(keys["ancestry"]))}, string value ${JSON.stringify(field(keys, "stringValue"))} and first and last characters ${JSON.stringify(field(keys, "first"))} and ${JSON.stringify(field(keys, "last"))}, where the closed relations, its children and its own characters derive state ${field(keys, "derivedState")}, ${field(keys, "derivedElements")} elements, ancestry ${inBraces(membersOf(keys["derivedAncestry"]))}, ${JSON.stringify(field(keys, "derivedStringValue"))} and ${JSON.stringify(field(keys, "derivedFirst"))} and ${JSON.stringify(field(keys, "derivedLast"))}`,
    node: true,
    rule: "derived",
    source:
      "fin.md §17, E1: the fields closed relations determine, and the string value (folds.ts)",
  },
  "Equal tolerance": {
    explain: (keys) => {
      const unsigned = membersOf(keys["unsigned"]);
      const count = field(keys, "count");

      return count === ""
        ? `the qti-equal compares in ${field(keys, "mode")} mode and writes no tolerance, where an absolute or relative comparison names its bounds`
        : `the qti-equal's tolerance holds ${count} values${unsigned.length === 0 ? "" : `, of which ${inBraces(unsigned)} are numbers not above 0`}, where a tolerance is one or two values, each number among them above 0`;
    },
    rule: "P36",
    source:
      "reading 121: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Equal.Attr_tolerance (§5.46.2: 'If the tolerance mode is absolute or relative then the tolerance must be specified. The tolerance consists of two positive numbers, t0 and t1, that define the lower and upper bounds. If only one value is given it is used for both') and #DataModel_ToleranceList (§9.1.5: 'a space separated list of either strings (must not contain a space) or numbers'): a qti-equal whose tolerance-mode is absolute or relative writes tolerance, every tolerance holds one or two values, and each value in xs:double's lexical space is above 0, a string naming a variable read at run time (operators.ts Tolerance, toleranceRequired, Equal_tolerance)",
  },
  "Feedback outcome type": {
    explain: (keys) =>
      `${field(keys, "kind")} names the outcome ${field(keys, "identifier")}, of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}, where a feedback outcome is an identifier of single or multiple cardinality`,
    rule: "feedback-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier (§5.49.1, and §5.52.1, §5.93.1, §5.148.1, §5.157.2: 'The identifier of an outcome variable that must have a base-type of identifier and be of either single or multiple cardinality'); the built-in completionStatus is 'a single identifier' (§2.2.2.3)",
  },
  "Feedback reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
    rule: "feedback-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier (§5.49.1, and §5.52.1, §5.93.1, §5.148.1, §5.157.2: 'The identifier of an outcome variable that must have a base-type of identifier and be of either single or multiple cardinality'), the built-in completionStatus among them (§2.2.2.3: 'a single identifier'); the outcome's base type and cardinality are Feedback outcome type's (references.ts ContentReference)",
  },
  "File exists": {
    explain: (keys) =>
      `${field(keys, "path")} is named by ${field(keys, "from")} and is no entry of the package`,
    rule: "file-exists",
    source:
      "imscp_infov1p2pd2.txt:409 and :411 (IMS Content Packaging 1.2, InterchangePackage (b): 'Any file described in the Manifest using a URI that resolves to a location within the InterchangePackage shall be included in the InterchangePackage'; (d): 'When a file contained in an InterchangePackage references another file using a URI that resolves to a location within the InterchangePackage, the referenced file shall be described in the InterchangePackage's Manifest'): a cp:file's href that resolves in the package names an entry, an external one left out (reading 35), and so does each reference a document resolves in the package (readings 102 and 103, package.ts ReferencePath)",
  },
  "File listed": {
    explain: (keys) => `${field(keys, "path")} is the href of no cp:file`,
    rule: "file-listed",
    source: "IMS Content Packaging 1.2 and QTI packaging: every file is described; reading 33",
  },
  "Foreign attribute class": {
    explain: (keys) =>
      `${field(keys, "kind")}'s attributes ${inBraces(membersOf(keys["wrong"]))} (slot:class:namespace) are not of the class their namespace has against the element's ${JSON.stringify(field(keys, "elementNamespace"))}: no-namespace for none, own-namespace for the element's, foreign for another`,
    node: true,
    rule: "attribute-admission",
    source:
      "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: an open attribute's class agrees with its stored namespace against its element's",
  },
  "Foreign element class": {
    explain: (keys) =>
      keys["kind"] === foreignKinds.absent && (keys["prefix"] ?? "") !== ""
        ? `${field(keys, "kind")} is written with the prefix ${field(keys, "prefix")}, where a name in no namespace has no prefix`
        : `${field(keys, "kind")} stores the namespace ${JSON.stringify(field(keys, "uri"))} under a parent in ${JSON.stringify(field(keys, "parentNamespace"))}, where no-namespace-element is for none, own-namespace-element for the parent's and foreign-element for another`,
    node: true,
    rule: "unmodeled-vocabulary",
    source:
      "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: a foreign element's class agrees with its stored namespace against its parent's; and Namespaces in XML 1.0 §5 (Namespace constraint: No Prefix Undeclaring) with §6.2, a name in no namespace is unprefixed, so a no-namespace element is written with no prefix (C4)",
  },
  "Foreign simple content": {
    explain: (keys) =>
      `a foreign element governed by the simple type ${field(keys, "governs")} holds an element child, where a simple type's element holds text alone`,
    node: true,
    rule: "child-set",
    source:
      "reading 60: https://www.w3.org/TR/xmlschema-1/#cvc-type (XML Schema 1.0 Part 1 §3.3.4, Element Locally Valid (Type), clause 3.1.2: an element a simple type governs holds no element child), over each foreign element whose xsi:type names a simple type (attributes.ts Governor, TypeText); its attributes are AL1's under the governor, the four xsi: names alone (clause 3.1.1), and its text TextDomain's under the type (clause 3.1.3)",
  },
  "Fragment context": {
    explain: (keys) =>
      `${field(keys, "path")} is placed inside ${field(keys, "first")} and inside ${field(keys, "second")}, and one written element is judged under one nearest interaction, a limit of the representation`,
    rule: "fragment-context",
    source:
      "reading 117: https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_FlowGroup_include (§6.15.8, and the include attribute of each class §9.4.1 lists: 'This provides the insertion of markup from external files. … When using XML this is achieved using the 'XInclude' approach') and https://www.w3.org/TR/xinclude-11/#creating-result (XInclude 1.1 §4.7: 'The result infoset is a copy of the source infoset, with each xi:include element processed as follows'): an included fragment's content is judged in place, as the including document's result infoset holds it; it is one written element per node, judged under the union of the ancestries of the includes that place it and under one nearest interaction; a fragment two includes place inside different interactions, or one inside an interaction and one outside, would need two rows per node, so it is refused: a stated limit of the representation, not a law of the specification",
  },
  "Graphic gap match default hotspot": {
    explain: () =>
      "a qti-associable-hotspot of a qti-graphic-gap-match-interaction has shape default, where that interaction defines no default hotspot",
    rule: "hotspot-default",
    source:
      "reading 80: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_GraphicGapMatchInteraction_qti-associable-hotspot (§5.60.9: 'The default hotspot must not be defined')",
  },
  "Href form": {
    explain: (keys) =>
      `the href ${field(keys, "href")} names no file the representation can read a name from${keys["limit"] === undefined ? "" : ` (${field(keys, "limit")})`}, a limit of the representation (#pantry/import/overlays/package.ts Limit)`,
    rule: "href-form",
    source:
      "reading 102 (overlays/package.ts Limit): every href is resolved before its row is written, its value read by its whitespace class, its path merged with the xml:base in scope or its document's path, its dot segments removed and each segment percent-decoded (RFC 3986 §2.1, §5.2 and §6.2.2.2); a path with a scheme, a leading /, a climb above the package root or an external base is external (reading 35), admitted and never resolved where a cp:file or a content reference holds it, and refused where a law needs the href to name an entry; an empty path names its own document (§4.4). What stays refused is a stated limit of the representation, not a law of the specification: a % that starts no percent-encoding, octets that spell no UTF-8, a segment that decodes to / or U+0000, a backslash, a tab, line feed or carriage return a preserving type keeps, a : in the first segment of a path with no scheme, and a srcset of more than one candidate or with a descriptor",
  },
  "Href listed": {
    explain: (keys) =>
      `${field(keys, "identifier")}'s href ${field(keys, "href")} names a path that is the href of none of its files ${inBraces(membersOf(keys["files"]))}`,
    rule: "href-listed",
    source:
      "imscp_infov1p2pd2.txt:770 (IMS Content Packaging 1.2, §6.6.2: 'A file reference declared in a Resource{ Href } shall have an associated declaration in a File object in the same Resource'): a resource href names the file one of its own files names, compared by resolved path in the package and as written outside it, its launch parameters aside (reading 102)",
  },
  "Idref target": {
    explain: (keys) =>
      `${field(keys, "name")} names ${field(keys, "token")}, which no ID of the document holds`,
    rule: "idref-target",
    source:
      "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): an IDREF names an ID of its document, an attribute's tokens and an IDREF- or IDREFS-typed element text's alike (§3.15.5; reading 101); reading 14",
  },
  "Include fragment identifier": {
    explain: (keys) =>
      `the include ${field(keys, "node")} names ${field(keys, "href")}, with a fragment identifier, which XInclude makes a fatal error`,
    rule: "include-href",
    source:
      "reading 115: https://www.w3.org/TR/xinclude-11/#include_element (XInclude 1.1 §3.1, href: 'Fragment identifiers must not be used; their appearance is a fatal error'): an xi:include's href carries no #, wherever it stands after the path",
  },
  "Include root": {
    explain: (keys) =>
      `the include ${field(keys, "node")} stands for ${field(keys, "root")}, the root of ${field(keys, "path")}, which ${field(keys, "parentKind")} does not admit where it admits the include`,
    rule: "include-root",
    source:
      "reading 114: https://www.imsglobal.org/spec/qti/v3p0/info#Imported_Include (§9.4.1, Include's parent classes, and 'This denotes the use of the XInclude feature [XInclude, 16]'), https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_FlowGroup_include (§6.15.8 and its siblings: 'This provides the insertion of markup from external files') and https://www.w3.org/TR/xinclude-11/#docii (XInclude 1.1 §4.2.1: an included document's 'set of top-level included items is the children of the acquired infoset's document information item'): an include under a parent whose model holds one stands for its fragment's root, which is one of its particle's choice-group alternatives, a kind whose position the parent's automaton follows and ends on as the include's",
  },
  "Include target": {
    explain: (keys) =>
      keys["path"] === undefined || field(keys, "path") === ""
        ? `the include ${field(keys, "node")} names no document of the package by an href this representation resolves`
        : `the include ${field(keys, "node")} names ${field(keys, "path")}, which is no document the manifest lists`,
    rule: "include-target",
    source:
      "reading 115: https://www.imsglobal.org/spec/qti/v3p0/info#Imported_Include (§9.4.1: 'This denotes the use of the XInclude feature [XInclude, 16]'); https://www.w3.org/TR/xinclude-11/#include_element (XInclude 1.1 §3.1: 'If the href attribute is absent when XML processing is specified, the xpointer or fragid attribute must be present', and reading 85 refuses xpointer, and the pinned XInclude.xsd declares no fragid), https://www.w3.org/TR/xinclude-11/#xml-included-items (§4.2: 'Resources that are unavailable for any reason … result in a resource error') and https://www.w3.org/TR/xinclude-11/#fallback_element (§3.2: 'If the xi:fallback element is missing, a resource error results in a fatal error'): an include the information model reads names, by an href this representation resolves, a document its package lists; one that holds a fallback is refused alike, since the representation applies no fallback, a stated limit",
  },
  "Inclusion cycle": {
    explain: (keys) =>
      `the section refs and includes ${inBraces(membersOf(keys["chain"]))} lead from ${field(keys, "path")} back to it, so its merged document never ends`,
    rule: "inclusion-cycle",
    source:
      "reading 85: https://www.w3.org/TR/xinclude-11/#loops (XInclude 1.1 §4.2.7: 'it is a fatal error to process another xi:include element with an include location and xpointer attribute value that have already been processed in the inclusion chain'), the XInclude https://www.imsglobal.org/spec/qti/v3p0/info#Imported_Include (§9.4.1) names, and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_AssessmentSectionRef (§7.5: the section ref 'functions as a facade for the qti-assessment-section to which it refers', the document that holds it, 'with the refered-to section merged in', behaving as 'a document that has all the same sections aggregated in one document', which a chain that returns to its own document has none of): no chain of qti-assessment-section-ref and xi:include hrefs, over the documents the manifest lists, returns to a document already on it",
  },
  "Item duration": {
    explain: (keys) =>
      `${field(keys, "kind")} reads duration in an item that is not time-dependent`,
    rule: "item-duration",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#IV_Response (§2.2.2.2: 'The value of duration for items that are not time dependent must not be used in any item or test-level expression', info.txt:8468) (expressions.ts Item_duration over ItemTiming; the UP audit's A62)",
  },
  "Item ref target": {
    explain: (keys) =>
      `the item ref ${field(keys, "node")} names ${field(keys, "path")}, which is no item document of the package`,
    rule: "item-ref-target",
    source:
      "the UP audit's B2: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_AssessmentItemRef.Attr_href (§5.6.5: 'The URI used to refer to the item's file (e.g., elsewhere in the same content package)', info.txt:14764): an item ref's href names a document of the package, and that document's root is an item (tests.ts ItemRefTarget)",
  },
  "Key text bound": {
    explain: (keys) =>
      `its ${field(keys, "field")} holds ${field(keys, "bytes")} UTF-8 bytes, past the ${field(keys, "bound")} a key holds of its kind (#pantry/qti/limits.ts), a limit of the representation`,
    rule: "key-text-bound",
    source:
      "src/qti/limits.ts: a text a key, a containment or a family's hidden columns hold takes its kind's one bound, the least every key of the kind leaves it under grizzle's representability rule, PostgreSQL's BTMaxItemSize (nbtree.h): a key text (keyText) at most keyTextBytes UTF-8 bytes, a namespace name (namespaceText) at most namespaceBytes, a local name at most localNameBytes, each what grizzle's keyTextBytes leaves beside its widest key's other fields; a stated limit of the representation, not a law of the specification",
  },
  "LOM learning resource type": {
    explain: (keys) =>
      `a learningResourceType of the LOM vocabulary (its source ${field(keys, "source") === "" ? "empty or not written, so the binding's default LOMv1.0" : JSON.stringify(field(keys, "source"))}) holds ${JSON.stringify(field(keys, "value"))}, which QTI 3.0 Metadata §2.7.5.1 forbids`,
    rule: "lom-learning-resource-type",
    source:
      "reading 122: https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.5.1, Learning Resource Type: 'the LOM-defined values self assessment and exam are forbidden', normative by its §1.2): a learningResourceType of the LOM vocabulary holds neither, its term the LOM vocabulary's where its source is LOMv1.0, empty, or not written, which the loose binding defaults to LOMv1.0 (imsmd_loose_v1p3p2.xsd:1288); a term of another source is another vocabulary's, which the loose binding does not enforce (§3.6), and is not refused; source and value compared collapsed (metadata.ts LomResourceType, LomResourceTypeSource)",
  },
  "Label tools": {
    explain: (keys) =>
      `${field(keys, "kind")} carries a label, so the item's root must carry tool-name and tool-version, and it lacks ${inBraces(membersOf(keys["missing"]))}`,
    rule: "label-tool",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_BaseSequence.Attr_label (§5.16.5, and §5.15.5, §5.17.5 to §5.21.5 and §5.79.4: 'If an item uses labels then values for the associated toolName and toolVersion characteristics must also be provided'), of the label of each kind whose type takes it from one of those classes, in both versions (labels.ts toolLabelKinds), and not of ItemFileInfo's ('A human readable label/short description for the file', §5.80.2) or PrintedVariable's ('such as would be appropriate for a tooltip', §7.30.4), which state none; reading 128: https://www.imsglobal.org/sites/default/files/spec/qti/v3/info/imsqti_asi_v3p0p1_infomodel_v1p0.html (QTI 3.0.1 §4.1.3, the item's label: 'If an item uses labels then values for the associated toolName and toolVersion attributes must also be provided'; ~/.cache/gr8des/qti301/info301.txt:11490) of a 3.0.1 item root's own label, where 3.0.0's §4.1.3 ('A human readable label that can be used to describe the Item', ~/.cache/gr8des/anyuri-specs/qti/info.txt:10162) states none; the version is the manifest's schemaversion (reading 67), and the sentence binds an item, not a stimulus or a test",
  },
  "Literal lexical": {
    explain: (keys) =>
      `a qti-base-value of base-type ${field(keys, "baseType")} holds ${JSON.stringify(field(keys, "text"))}, which is no lexical form of it`,
    rule: "attribute-lexical",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a qti-base-value's text is a lexical form of its base-type, the same language as Typed value's (expression-types.ts BaseTypePattern; readings 7, 34, 45 and 71)",
  },
  LomObjectIdentifier: {
    explain: (keys) =>
      `the document ${field(keys, "identifier")} is named ${field(keys, "entries")} by its record`,
    rule: "lom-identifier",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.1, Identifier: 'One of the values given for the identifier must have an entry that matches the identifier of the associated item, test or object bank', normative by its §1.2), over the general category's identifiers alone; info §4.1.1 and §4.4.1 ('MUST be the same'); reading 62 as UP's audit merges it (docs/research/up.md §2.2), the entry compared collapsed",
  },
  LomObjectTitle: {
    explain: (keys) =>
      `the document titled ${JSON.stringify(field(keys, "title"))} is titled ${field(keys, "strings")} by its record in its language`,
    rule: "lom-title",
    source:
      "https://www.imsglobal.org/sites/default/files/spec/qti/v3/md-bind/index.html (QTI 3.0 Metadata §2.7.1.2, Title: 'The title must have a value that matches the value of the title attribute of the associated item, test or object bank. The language used to interpret the title is taken from the language attribute of the associated item, test or object bank', normative by its §1.2); info §4.1.2 and §4.4.2; reading 62 as UP's audit merges it (docs/research/up.md §2.2). Titles compare in xs:normalizedString's value space and language tags without regard to case (RFC 5646 §2.1.1; metadata.ts)",
  },
  "Lookup table cardinality": {
    explain: (keys) =>
      `a ${field(keys, "kind")} of an outcome of ${field(keys, "cardinality")} cardinality, where a lookup table sets a single outcome value`,
    rule: "lookup-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootAttribute_OutcomeDeclaration_lookupTable (§4.5.13: a lookup table maps 'a numeric source value to a single outcome value in the declared value set'): a qti-match-table's or qti-interpolation-table's outcome declaration is of single cardinality (mapping.ts Lookup_table_cardinality)",
  },
  "Lookup type": {
    explain: (keys) =>
      `qti-lookup-outcome-value looks up a ${field(keys, "baseType")} ${field(keys, "cardinality")} in ${field(keys, "identifier")}'s ${field(keys, "table") || "missing table"}; it takes a single integer, float or duration, a match table's an integer`,
    rule: "P22",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_LookupOutcomeValue_expressionGroup (§5.87.2: 'An expression which must have single cardinality and an effective base-type of either integer, float or duration. Integer type is required when the associated table is a matchTable'), looked up in the outcome's table (§5.87: 'in the lookupTable associated with the outcome's declaration') (expressions.ts Lookup_type; the old checker's P22)",
  },
  "Manifest id space": {
    explain: (keys) => `${field(keys, "identifier")} is also the manifest's identifier`,
    rule: "manifest-id-space",
    source:
      "IMS Content Packaging 1.2: the manifest's and its resources' identifiers are one xs:ID space",
  },
  "Map key": {
    explain: (keys) =>
      `a ${field(keys, "baseType")} mapping holds the key ${field(keys, "key")} twice, as written or as the value it names`,
    rule: "map-key-unique",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping (§5.88.4 and §7.21: 'The map is defined by a set of mapEntries, each of which maps a single value from the source set onto a single float'), so a mapping is a function of its source value: no two of its entries share a key, compared as values of its base type where the schema holds one (an integer's canonical form, a float of grizzle's double form as its double, mapping.ts MapKeyInteger and MapKeyFloat) and as written otherwise (readings 7, 34 and 45)",
  },
  MappableBaseType: {
    explain: (keys, grammar) =>
      `a mapping of base type ${JSON.stringify(field(keys, "baseType"))}; MappableBaseType holds ${inBraces(
        grammar.mappableBaseType.rows.map(({ baseType }) => baseType),
      )}`,
    rule: "mapping-base-type",
    source:
      "reading 78: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping (§5.88, the Mapping class: \"A special class used to create a mapping from a source set of any base-type (except file and duration) to a single 'float'\") (expression.ts MappableBaseType)",
  },
  "Mapped response": {
    explain: (keys) =>
      `${field(keys, "kind")} names ${field(keys, "identifier")}, a ${field(keys, "declarationKind")} with no ${field(keys, "kind") === "qti-map-response-point" ? "qti-area-mapping of base-type point" : "qti-mapping"}`,
    rule: "P27",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Derived_MapResponse (§7.22, MapResponse: it 'transforms it using the associated mapping, which must have been declared'; §6.9.46, MapResponsePoint: it takes 'a response variable that must be of base-type point, and transforms it using the associated areaMapping', which §5.115.7 says 'may only be present in declarations of variables with base-type point') (expressions.ts Mapped_response; the old checker's P27)",
  },
  "Mastery range": {
    explain: (keys) =>
      `mastery-value ${field(keys, "masteryValue")} lies outside the normal range from ${JSON.stringify(field(keys, "normalMinimum"))} to ${JSON.stringify(field(keys, "normalMaximum"))}`,
    rule: "mastery-range",
    source:
      "reading 9: the Schematron's RULE SPECIFIC CLASS OUTCOMEDEC 1 (ASI 3.0.1 XSD, on qti-outcome-declaration: 'not(@mastery-value < @normal-minimum)', 'The mastery-value attribute value must not be less than the normal-minimum value'; 'not(@mastery-value > @normal-maximum)', 'The mastery-value attribute value must not be greater than the normal-maximum value'), read by its intent: each pair judged where both are written, as xs:double values (INF and -INF infinite), NaN ordered against nothing; a value outside grizzle's double lexical form (outer whitespace, over 15 significant digits, an exponent beyond 293) is not judged, a recorded limit",
  },
  "MathML arity": {
    explain: (keys) =>
      Option.match(Option.fromNullishOr(mathArities.get(field(keys, "operator"))), {
        onNone: () => `${field(keys, "operator")} has no MathML arity`,
        onSome: ({ max, min, section }) =>
          `m:apply applies ${field(keys, "operator")} to ${field(keys, "arguments")} arguments, where its class (MathML 3 §${section}) takes ${min === max ? String(min) : `${String(min)} or ${String(max)}`}`,
      }),
    node: true,
    rule: "math-arity",
    source:
      "reading 2 (expression.ts mathArities): https://www.w3.org/TR/MathML3/chapter4.html#contm.unary (MathML 3 §4.3.4.6: 'Unary operators take a single argument') and #contm.binary (§4.3.4.5: 'Binary operators take two arguments'), each operator's class from its syntax table in §4.4 (§4.1.5: the Class row 'indicate[s] how many arguments the operator represented by this element takes'); an apply with a qualifier or an interval beside its operator is not judged, and moment is left out, since §4.4.8.6's own example applies it to five arguments",
  },
  "MathML foreign element": {
    explain: (keys) =>
      `${field(keys, "node")} is a foreign element named {${field(keys, "namespace")}}${field(keys, "local")}, and no foreign element is in the MathML namespace: MathML content stands only inside m:math`,
    rule: "unmodeled-vocabulary",
    source:
      "MathML 3 RelaxNG mathml3-common.rnc: start = math (line 15) and anyElement = element (* - m:*) (line 61); MathML 3 §2.2, 'All other MathML content must be contained in a math element'; reading 2",
  },
  "Media source src": {
    explain: (keys) =>
      `a source in ${field(keys, "parentKind") || "a media element"} carries no src, where a source of an audio or a video names its media resource`,
    node: true,
    rule: "source-src",
    source:
      "reading 124: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Source.Attr_src (§5.135.1: 'The value must be a valid non-empty URL potentially surrounded by spaces. This characteristic must be present'), read in a media element as the HTML Standard it restates splits it (https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element: where 'The source element's parent is a media element', 'This attribute must be present'; where it is a picture element, 'The src attribute must not be present'): a source whose parent is an audio or a video carries src (html.ts Media_source_src)",
  },
  "N1 one document node": {
    explain: (keys) => `${field(keys, "documentNodes")} nodes start at 0, where a document has one`,
    rule: "reachability",
    source: "XML 1.0 §2.1, one document entity; fin.md §12, entry 8",
  },
  "N1 sentinel": {
    explain: (keys) =>
      `the document node sits at slot ${field(keys, "at")} with parent ${field(keys, "parent")}, document ${field(keys, "document")}, nearest ${field(keys, "nearest")} (${field(keys, "nearestKind")}) and parentAncestry ${inBraces(membersOf(keys["parentAncestry"]))}, where it is its own at slot 0 and sits in no flag`,
    node: true,
    rule: "reachability",
    source:
      "fin.md §12, entry 8: the document node is its own parent, document and nearest, at slot 0",
  },
  "N2 key": {
    explain: (keys) =>
      `${field(keys, "members")} children over ${field(keys, "slots")} distinct (parent, at) slots`,
    rule: "reachability",
    source: "fin.md §5.2, the ordered family's key (parent, at)",
  },
  "N2 mirrors": {
    explain: (keys) =>
      keys["missing"] === undefined
        ? `slot ${field(keys, "at")} under a parent of ${field(keys, "parentChildren")} children`
        : `${field(keys, "children")} children, none at slots ${inBraces(membersOf(keys["missing"]))}`,
    node: true,
    rule: "reachability",
    source: "fin.md §5.2, the ordered family: slots 0 to children − 1, each held",
  },
  "N4 kinds": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} under ${field(keys, "parentKind")} in ${field(keys, "version")}: NodeKind holds ${inBraces(
        [field(keys, "kind"), field(keys, "parentKind")].filter((kind) =>
          grammar.kinds.nodeKind.has(kind),
        ),
      )}, SchemaVersion ${grammar.kinds.versions.has(field(keys, "version")) ? "holds" : "lacks"} ${field(keys, "version")}`,
    node: true,
    rule: "admission",
    source: "fin.md §17, the NodeKind and SchemaVersion rosters",
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
    rule: "ordering",
    source:
      "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Follow; the operator's ruling of 2026-11-05)",
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
    rule: "admission",
    source: "the XSDs' content models as Admission (content.ts); reading 6 for wildcard content",
  },
  "N5 first slot": {
    explain: (keys) =>
      keys["attrsWas"] === undefined
        ? `the first slot copies state ${field(keys, "was")} and ${field(keys, "elementsWas")} elements, where each fold starts at 0`
        : `the first attribute copies attrs ${inBraces(membersOf(keys["attrsWas"]))}, where the fold starts empty`,
    node: true,
    rule: "ordering",
    source: "fin.md §4.3, each fold's identity at slot 0",
  },
  "N5 fold": {
    explain: (keys) =>
      `copies state ${field(keys, "was")} and ${field(keys, "elementsWas")} elements, where its predecessor's fold is state ${field(keys, "predecessorState") || "none"} and ${field(keys, "predecessorElements") || "no"} elements`,
    node: true,
    rule: "ordering",
    source: "fin.md §4.5a, the predecessor copy",
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
    rule: "ancestry-ban",
    source:
      "fin.md §13 P3 and §16: the information model's nesting rules as Banned and Needs (ancestry.ts, facets.ts); readings 25 and 38",
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
    rule: "child-set",
    source:
      "XML Schema Part 1 §3.9 occurrence bounds of 2 to n, which a position automaton relaxes (content.ts Counted), and the loose LOM binding's Schematron caps: each element the binding bounds to one inside an unbounded choice stands at most once in its family (lom/imsmd_loose_v1p3p2.xsd:18-21 and 85-92, its 94 asserts at 93-911; reading 130)",
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
    rule: "child-set",
    source:
      "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Last)",
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
    rule: "child-set",
    source:
      "the HTML Standard, colgroup: a span attribute bars col children (children.ts ChildBarredBy)",
  },
  "N7 empty family": {
    explain: (keys) =>
      `an empty family's end values are state ${field(keys, "childState")} and ${field(keys, "elementChildren")} elements, where each fold starts at 0`,
    node: true,
    rule: "union-count",
    source: "fin.md §5.2, an empty family's end values are each fold's identity",
  },
  "N7 last slot": {
    explain: (keys) =>
      `end values state ${field(keys, "childState")} and ${field(keys, "elementChildren")} elements, where its last child's fold is state ${field(keys, "lastState") || "none"} and ${field(keys, "lastElements") || "no"} elements`,
    node: true,
    rule: "union-count",
    source: "fin.md §5.2, the last-slot copy",
  },
  "N8 nearest": {
    explain: (keys, grammar) =>
      `nearest ${field(keys, "nearest")} (${field(keys, "nearestKind")}) under ${field(keys, "parent")}, a ${field(keys, "parentKind")}, where ${
        Option.isSome(grammar.kinds.interaction.lookup({ kind: field(keys, "parentKind") }))
          ? "an interaction parent is the nearest"
          : `the parent's nearest ${field(keys, "parentNearest")} is`
      }`,
    node: true,
    rule: "owner-copy",
    source: "plan-qti-pie N8, the nearest interaction (fin.md §15, rule 3)",
  },
  "Namespace family": {
    explain: (keys) =>
      `namespaces ${field(keys, "namespaces")} over ${field(keys, "declarations")} declarations`,
    node: true,
    rule: "reachability",
    source: "Namespaces in XML 1.0 §3, declarations in source order (fin.md §5.2)",
  },
  "Namespace name": {
    explain: (keys) =>
      `${field(keys, "node")} binds ${field(keys, "prefix") === "" ? "the default namespace" : `the prefix ${field(keys, "prefix")}`} to ${JSON.stringify(field(keys, "uri"))}, which is no RFC 3986 URI reference`,
    rule: "namespace-name",
    source:
      "reading 131: https://www.w3.org/TR/xml-names/#ns-decl (Namespaces in XML 1.0 (Third Edition) §3: 'The attribute's normalized value MUST be either a URI reference — the namespace name identifying the namespace — or an empty string'; §2.1: 'An XML namespace is identified by a URI reference [RFC3986]'; a relative reference is deprecated, §2.2, not refused; §8 lets a processor leave it unchecked, which leaves the document's constraint standing): a namespace declaration's normalized value is RFC 3986's URI-reference (https://www.rfc-editor.org/rfc/rfc3986#appendix-A), the empty one a relative-ref of an empty path (chardata.ts NamespaceUri)",
  },
  "Node key": {
    explain: (keys) => `a second row holds the id ${field(keys, "id")}`,
    node: true,
    rule: "reachability",
    source: "trees.md §1, the tree relation's key, id",
  },
  "One base": {
    explain: (keys) =>
      `the operands of ${field(keys, "kind")} are of base types ${field(keys, "bases")} or cardinalities ${field(keys, "cardinalities")}, which it takes of one`,
    rule: "P23",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-multiple (§6.9.13, and §6.9.14 Ordered: 'Although the sub-expressions may be of any base-type they must all be of the same base-type'; §5.113, Repeat: 'all of which must have either single or ordered cardinality and the same base-type'; §6.9.21, Match: 'which must both have the same base-type and cardinality'; §6.9.33, Member, and §6.9.20, Delete: 'which must both have the same base-type'; §6.9.25, Contains: 'which must both have the same base-type and cardinality - either multiple or ordered'), a type no declaration says aside (reading 4) (expressions.ts One_base; the old checker's P23)",
  },
  OpenElementName: {
    explain: (keys) =>
      `${field(keys, "names")} foreign names over ${field(keys, "foreignElements")} foreign elements`,
    rule: "unmodeled-vocabulary",
    source: "fin.md D2, a foreign element keeps its expanded name; reading 6",
  },
  "OpenElementName canonical": {
    explain: (keys) =>
      `${field(keys, "node")} is a foreign element named {${field(keys, "namespace")}}${field(keys, "local")}, the name of ${inBraces(membersOf(keys["kinds"]))}, which its parent admits there, so it is read as that kind`,
    rule: "unmodeled-vocabulary",
    source:
      "https://www.w3.org/TR/xmlschema-1/#cvc-assess-elt (XML Schema 1.0 Part 1 §3.3.4, Schema-Validity Assessment (Element), clauses 1.1.1.2 and 1.1.1.3.2: an element is assessed against the declaration its context determines or its name resolves to, a particle's own or a top-level one a lax or strict wildcard finds, §3.10.4 clause 2), so an element whose expanded name its parent admits there is that declaration's kind and never a foreign element (shred.ts childReadingOf; install.ts KindByNameUnder, the names each (version, parent) admits, C8)",
  },
  "Operand fit": {
    explain: (keys) =>
      `an operand of ${field(keys, "kind")} is ${field(keys, "baseType")} ${field(keys, "cardinality")}, which it does not take there`,
    rule: "P23",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-member (§6.9, ExpressionGroup, normative: each operator's sub-expression base types and cardinalities, as §6.9.33 qti-member and §6.9.20 qti-delete say: 'The first sub-expression must have single cardinality and the second must be a multiple or ordered container'), a type no declaration says aside (reading 4) (expression.ts expressionTypings, OperandBase, LeadCardinality and TailCardinality; the old checker's P23)",
  },
  "Outcome only": {
    explain: (keys) =>
      `${field(keys, "kind")} stands in ${field(keys, "language")} processing; only outcome processing admits it`,
    rule: "P25",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-number-correct (§6.9.58 to §6.9.64 and §6.9.41, normative: qti-number-correct, qti-number-incorrect, qti-number-presented, qti-number-responded, qti-number-selected, qti-outcome-minimum, qti-outcome-maximum and qti-test-variables, each 'which can only be used in outcomes processing') (expressions.ts Outcome_only, its language Processing's; the old checker's P25)",
  },
  "Picture source srcset": {
    explain: () =>
      "a source in a picture carries no srcset, where a source of a picture names its image candidates",
    node: true,
    rule: "source-srcset",
    source:
      "reading 124: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Source.Attr_srcset (§5.135.3: \"This attribute is required when 'source' is used in 'picture'\"); https://html.spec.whatwg.org/multipage/embedded-content.html#the-source-element (where 'The source element's parent is a picture element', 'The srcset attribute must be present'): a source whose parent is a picture carries srcset (html.ts Picture_source_srcset)",
  },
  "Prefixed reference": {
    explain: (keys) =>
      `the test ${field(keys, "assembly")} reads the reference ${field(keys, "identifier")} in ${field(keys, "resolving")} ways, ${field(keys, "readings")}, where exactly one reading may name a scope of the test and a variable of it`,
    rule: "prefixed-ref",
    source:
      "readings 48 and 88: https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Variable (§7.47: 'values taken from an individual item session can be looked up by prefixing the name of the item variable with the identifier assigned to the item in the qti-assessment-item-ref, separated by a period character'; for an item 'allowed to be replaced (i.e. that have the with-replacement attribute set to \"true\")', 'a number that denotes the instance's place in the sequence of the item's instantiation is inserted between the item variable identifier and the item variable'), https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1: 'Identifiers containing the period character are reserved for use in prefixing') and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_TimeLimits (§7.40: 'For qti-assessment-sections, qti-test-parts and whole qti-assessment-tests the time limits relate to the durations of all the item sessions plus any other time spent navigating that part of the test'), a part's or section's duration read by its identifier's prefix as an item's variables are (reading 48), over the assembled test (readings 4, 5 and 86): a test-level reference is accepted when exactly one of its readings, unsplit, split at a dot, or numbered at two dots, names a scope of the test and a variable of that scope, a numbered one only under a selection with replacement and only from 1, and none through a name two placements give (expressions.ts Reading: the key and the containment over its resolving readings, M3, and Prefixed_reference)",
  },
  "Printed variable reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
    rule: "printed-variable-ref",
    source:
      "reading 77: https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_PrintedVariable.Attr_identifier (§7.30.6: 'The outcome variable or template variable must have been defined. The values of response variables cannot be printed directly'), the built-in completionStatus among them (§2.2.2.3) (references.ts ContentReference)",
  },
  "Quotation punctuation": {
    explain: (keys) =>
      `the q has the quotation mark ${JSON.stringify(field(keys, "mark"))} ${field(keys, "position")}, where the user agent draws a q's quotation marks itself`,
    rule: "q-punctuation",
    source:
      "reading 127: https://www.imsglobal.org/spec/qti/v3p0/info#Data_Q (§5.111, Q: 'Quotation punctuation (such as quotation marks) that is quoting the contents of the tag must not appear immediately before, after, or inside q tags; they will be inserted into the rendering by the user agent'; ~/.cache/gr8des/anyuri-specs/qti/info.txt:38400, and the 3.0.1 model's ~/.cache/gr8des/qti301/info301.txt:55430): a q is refused where the last character of its sibling before it, the first of its sibling after it, or the first or last character of its own content is a quotation mark, one of \" « » ‘ ‚ ‛ “ ” „ ‟ ‹ › (main's set, which leaves out the apostrophes ' and ’), each read off a text, whitespace or entity reference row, so an element, a comment or an instruction beside the q holds no punctuation (quotation.ts Quotation_punctuation)",
  },
  "Record field key": {
    explain: (keys) => `a second field of one record value is named ${field(keys, "identifier")}`,
    rule: "value-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_CardinalityEnum (§8.16, CardinalityEnum, record: 'a special container that contains a set of independent values each identified by its own identifier and having its own base-type'): no two fields of one record value share a field-identifier, compared collapsed",
  },
  RecordBindingFit: {
    explain: (keys) =>
      `${field(keys, "kind")} binds the record ${field(keys, "identifier")}, which RecordBindingFit does not admit`,
    rule: "record-binding-fit",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_TextEntryInteraction (§5.162: 'The textEntryInteraction must be bound to a response variable with single or record cardinality only') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_ExtendedTextInteraction (§5.48: 'The qti-extended-text-interaction must be bound to a response variable of single, multiple, ordered or record cardinality'); every other class's binding sentence names no record (§5.30 and BindingFit's others) (expression.ts RecordBindingFit)",
  },
  "Reference type": {
    explain: (keys) =>
      `${field(keys, "kind")}'s ${field(keys, "attribute")} names ${field(keys, "identifier")}, which is no ${field(keys, "base")} single template or outcome variable`,
    rule: "P24",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Union_IntegerOrVariableRef (§9.3.3, §9.3.1 and §9.3.4: an integerOrVariableRef, floatOrVariableRef or stringOrVariableRef names a template or outcome variable of that base type, single) (expression.ts ReferenceBase; the old checker's P24)",
  },
  "Reserved type": {
    explain: (keys) =>
      `${field(keys, "identifier")} is declared by ${field(keys, "kind")} of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}, where the specification types it otherwise`,
    rule: "reserved-type",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Root_OutcomeDeclaration (§4.5, OutcomeDeclaration: 'SCORE needs to be a float.', 'MAXSCORE needs to be a float.', 'PASSED needs to be a boolean.'), of an outcome declaration of that identifier; https://www.imsglobal.org/spec/qti/v3p0/info#RootAttribute_AssessmentItem_qti-context-declaration (§4.1.10, and §4.4.7 of a test: 'An implementation MUST support the global variable \"QTI_CONTEXT\" with record cardinality') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'There is one built-in context variable named \"QTI_CONTEXT\" with record cardinality'), which the implementation guide, a document with no normative mark, declares explicitly (its §3.7.11, 'an explicit (though unnecessary) <qti-context-declaration> of QTI_CONTEXT'): a declaration of QTI_CONTEXT is a record context declaration, since one of another kind or cardinality would make one identifier name two variables (reading 74)",
  },
  RootOfType: {
    explain: (keys, grammar) =>
      `${field(keys, "path")} has root ${field(keys, "rootKind")} and is listed as ${field(keys, "type")}, which lists ${rootsExplained(grammar, field(keys, "type"))}`,
    rule: "root-type-reverse",
    source: "QTI 3 packaging: the document root of each resource type (package.ts)",
  },
  "Rounding figures": {
    explain: (keys) =>
      `${field(keys, "kind")} rounds to ${field(keys, "figures")} figures under ${field(keys, "mode")}, where that mode rounds to at least ${field(keys, "least")}`,
    rule: "P10",
    source:
      "reading 119: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_EqualRounded.Attr_figures (§5.47.2: 'If roundingMode= 'significantFigures', the value of figures must be a non-zero positive integer. If roundingMode='decimalPlaces', the value of figures must be an integer greater than or equal to zero') and #DataCharacteristic_RoundTo.Attr_figures (§5.119.2, the same of rounding-mode), under the EqualRounded default significantFigures (§5.47.1): a figures whose collapsed form is an integer is at least 1 under significantFigures and at least 0 under decimalPlaces, a variable's name read at run time (operators.ts Rounding, Rounding_figures)",
  },
  "SSML lexicon reference": {
    explain: (keys) =>
      field(keys, "fragment") === ""
        ? `ssml:lookup names the lexicon ${field(keys, "ref")} outside every ssml:speak`
        : `ssml:lookup names the lexicon ${field(keys, "ref")}, which no ssml:lexicon of its ssml:speak defines`,
    node: true,
    rule: "ssml-fragment",
    source:
      "reading 3: https://www.w3.org/TR/speech-synthesis11/#S3.1.5.2 (SSML 1.1 §3.1.5.2: 'The ref attribute specifies a name that references a lexicon document as assigned by the xml:id attribute of the lexicon element') and #S3.1.5.1 (§3.1.5.1: 'The scope of this name is the current SSML document'), the document being the lookup's nearest speak (identity.ts ssmlLexiconReference, through SsmlScope)",
  },
  "SSML trim mark": {
    explain: (keys) =>
      `ssml:speak trims at ${inBraces(membersOf(keys["unmarked"]))} (attribute=name:marks of that name in the speak), where each names exactly one of its marks`,
    node: true,
    rule: "ssml-fragment",
    source:
      "reading 3: https://www.w3.org/TR/speech-synthesis11/#S3.1.1.1 (SSML 1.1 §3.1.1.1: 'Only markers defined once in the document, i.e. that are unique, are permitted as the value of either startmark or endmark'; 'It is an error if the value given for either startmark or endmark is not a valid mark in the document'), the document being the speak, each name an xs:token (§3.3.2) compared by its collapsed value (identity.ts ssmlTrimMark)",
  },
  "Section identifier target": {
    explain: (keys) =>
      `the section-identifier ${field(keys, "identifier")} names no single section or section ref of the test ${field(keys, "assembly")}`,
    rule: "section-identifier-target",
    source:
      "readings 5 and 86: https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_Number.Attr_section-identifier (§7.27.1, and §7.28.1, §7.39.1: 'If specified, only variables from items in the qti-assessment-section with matching identifier are matched', info.txt:69115), resolved over each test that places the document: a section-identifier names exactly one section or section ref of the assembled test (expressions.ts Reading, form name; the UP audit's A61)",
  },
  "Selection bound": {
    explain: (keys) =>
      `selects ${field(keys, "select")} of the section's ${field(keys, "parts")} parts without replacement`,
    rule: "selection-bounds",
    source:
      "reading 79: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Selection.Attr_select (§5.129.1: 'The number of children to select may exceed the number of child elements defined only if with-replacement is true'; 'Sub-sections always count as 1') (references.ts SectionPart)",
  },
  "Selection required": {
    explain: (keys) =>
      `selects ${field(keys, "select")} of the section's parts, fewer than its ${field(keys, "required")} required parts`,
    rule: "selection-required",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_required (§4.2.2, and §5.6.2 of the item ref: 'If a child element is required it must appear (at least once) in the selection. It is an error if a section contains a selection rule that selects fewer child elements than the number of required elements it contains'): a section's parts whose required is true are at most its selection's select (tests.ts Selection_required)",
  },
  "Self dependency": {
    explain: (keys) =>
      `the resource ${field(keys, "identifier")} names itself in a cp:dependency, where a dependency names a sibling resource`,
    rule: "self-dependency",
    source:
      "imscp_infov1p2pd2.txt:1105 (IMS Content Packaging 1.2, §6.11.5, the IdentifierRef class, rule B ii: an IdentifierRef child of a Dependency object 'Shall not reference the Dependency's parent Resource'): a cp:dependency's identifierref is not its own resource's identifier, compared as written (package.ts Self_dependency)",
  },
  "Set type": {
    explain: (keys) =>
      `${field(keys, "kind")} sets ${field(keys, "identifier")}, ${field(keys, "baseType")} ${field(keys, "cardinality")}, to a ${field(keys, "heldBase")} ${field(keys, "heldCardinality")}`,
    rule: "P20",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Data_SetValue (§5.130, SetValue, normative, the class of every setter, outcome, response and template rules alike: 'floating point values can not be assigned to integer variables and vice-versa. The truncate, round or integerToFloat operators must be used to achieve numeric type conversion'; §5.130.2, its expression: 'The expression which must have an effective base-type and cardinality that matches the base-type and cardinality of the outcome variable being set') (expressions.ts Set_type; the old checker's P20)",
  },
  "Slider bounds": {
    explain: (keys) =>
      `qti-slider-interaction's upper-bound ${field(keys, "upper")} is below its lower-bound ${field(keys, "lower")}`,
    rule: "slider-bounds",
    source:
      "reading 9, the Schematron's rule 14Ba (RULE_SET_INTERACTION_14B, ASI 3.0.1 XSD, on qti-slider-interaction: 'not(@upper-bound < @lower-bound)', 'The upper-bound attribute value must not be less than the lower-bound value'), its values read as xs:double; the information model (§5.134.1-2) states no order",
  },
  "Stimulus ref key": {
    explain: (keys) =>
      `two stimulus refs of one item share the identifier ${field(keys, "identifier")}`,
    rule: "stimulus-ref-key",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_AssessmentStimulusRef.Attr_identifier (§7.6.1: 'The unique identifier for the stimulus reference'; §7.6.2: 'each reference must have a unique identifier'), compared collapsed: no two stimulus refs of one item share an identifier (tests.ts StimulusRef)",
  },
  "Stimulus ref target": {
    explain: (keys) =>
      `a stimulus ref names ${field(keys, "path")}, which is no stimulus document of the package`,
    rule: "stimulus-ref-target",
    source:
      "info.txt:67012 and :67066 (https://www.imsglobal.org/spec/qti/v3p0/info#Derived_AssessmentStimulusRef, §7.6: the stimulus ref 'enables reference to a 'qti-assessment-stimulus' instance', and its href is 'The uri used to refer to the stimulus file'): a stimulus ref's href that resolves in the package names a listed document whose root is a qti-assessment-stimulus; an external href is not resolved (reading 35's reading of an absolute URI) (package.ts ReferencePath, the UP audit's B5)",
  },
  "Strictly held": {
    explain: (keys) =>
      `${field(keys, "kind")} stands under ${field(keys, "parentKind")} only by its strict wildcards and no type governs it, where such an element stands only under an xsi:type naming a type of its document's schema set or of XML Schema`,
    node: true,
    rule: "unmodeled-vocabulary",
    source:
      "reading 81: https://www.w3.org/TR/xmlschema-1/#cvc-wildcard (XML Schema 1.0 Part 1 §3.10.4, Item Valid (Wildcard), clause 2: a strict wildcard's element has the context-determined declaration mustFind), with §3.3.4 clause 1.2 and §3.3.5 [validity] clause 1.1.3: an element only the strict wildcards of its parent's model hold (install.ts StrictlyHeld) stands only under an xsi:type naming a type of its document's schema set or a built-in, so its governing type is not none (C44; shred: strict-undeclared), but for reading 6's root whose declaration the wildcard finds (§3.10.4 clause 2, §3.3.4 clause 1.1.1.3.2), kept foreign and unrefused (install.ts HeldRootsUnder, C13)",
  },
  "Structure identifier": {
    explain: (keys) =>
      `${field(keys, "kind")} and ${field(keys, "other")} of one document share the identifier ${field(keys, "identifier")}`,
    rule: "structure-identifier",
    source:
      "reading 86: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1: 'The identifier of the section or item reference must be unique within the test and must not be the identifier of any testPart') and §5.159.1 ('The identifier of the test part must be unique within the test and must not be the identifier of any qti-assessment-section or qti-assessment-item-ref'), compared collapsed: no two test parts, sections, section refs or item refs of one document share an identifier, whatever their roles (tests.ts Named)",
  },
  "T1 document order": {
    explain: (keys) =>
      `a second node of the document starts at ${field(keys, "start")}, where each start is one node's`,
    node: true,
    rule: "reachability",
    source: "trees.md §2, T1",
  },
  "T2 root": {
    explain: (keys) =>
      `${field(keys, "kind")} starts at ${field(keys, "start")} with parent ${field(keys, "parent")}, where the one self-parented row is the root, at start 0`,
    node: true,
    rule: "reachability",
    source: "trees.md §2, T2",
  },
  "T3 first child": {
    explain: (keys) =>
      `slot ${field(keys, "at")} starts at ${field(keys, "start")} with parentStart ${field(keys, "parentStart")} under a parent that starts at ${field(keys, "parentStartHeld") || "none"}, where its copy of the parent is the parent's fields and a first child starts one past its parent`,
    node: true,
    rule: "reachability",
    source: "trees.md §2, T3, with the merged parent copy (trees.md §6)",
  },
  "T4 next sibling": {
    explain: (keys) =>
      `starts at ${field(keys, "start")}, where its predecessor ends at ${field(keys, "predecessorEnd") || "no row"}`,
    node: true,
    rule: "reachability",
    source: "trees.md §2, T4",
  },
  "T5 last child": {
    explain: (keys) =>
      `ends at ${field(keys, "end")}, where its last child ends at ${field(keys, "lastEnd") || "no row"}`,
    node: true,
    rule: "reachability",
    source: "trees.md §2, T5",
  },
  "T6 nonempty and leaf": {
    explain: (keys) =>
      `holds [${field(keys, "start")}, ${field(keys, "end")}) over ${field(keys, "children")} children, where every interval is non-empty and a leaf's holds itself alone`,
    node: true,
    rule: "reachability",
    source: "trees.md §2, T6",
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
    rule: "table-headers",
    source:
      "reading 126: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TDH.Attr_headers (§5.140.1: \"an unordered set of unique space-separated tokens that are case-sensitive, each of which must have the value of an ID of a 'th' tag taking part in the same table as the 'td' or 'th' tag\"); https://html.spec.whatwg.org/multipage/tables.html#attr-tdth-headers: a cell's headers tokens are unique, and each is the id of a th whose nearest table is the cell's, a cell no table holds taking part in none (html.ts TableScope, TableHeader, tableHeaders)",
  },
  "Template default target": {
    explain: (keys) =>
      `the template default of ${field(keys, "itemRef")} names ${field(keys, "template")}, which its item declares as no template variable`,
    rule: "template-default-target",
    source:
      "the UP audit's A37: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateDefault.Attr_template-identifier (§5.152.1: 'The identifier of the template variable affected'; §5.152: 'The default value of a template variable in an item can be overridden based on the test context'): a template default names a template declaration of the item its item ref names, compared collapsed (expressions.ts TemplateDefault, through tests.ts ItemRefDocument); an item ref that names an LTI link names no item, so no template of it (reading 110)",
  },
  "Template default type": {
    explain: (keys) =>
      `the template default of ${field(keys, "itemRef")} sets ${field(keys, "template")}, a ${field(keys, "declared")}, to a ${field(keys, "held")}`,
    rule: "P20",
    source:
      "the UP audit's A38, the old checker's P20 for a setter: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_TemplateDefault_expressionGroup (§5.152.2: 'An expression which must result in a value with base-type and cardinality matching the declaration of the associated variable's qti-template-declaration'): a template default's expression fits its template variable's type, a type no declaration says aside (reading 4) (expressions.ts Template_default_type)",
  },
  "Template reads": {
    explain: (keys) =>
      `template processing's ${field(keys, "kind")} reads ${field(keys, "identifier")}, a response or outcome variable or a built-in but QTI_CONTEXT`,
    rule: "P26",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Abstract_TemplateRuleGroup (§6.50: 'An expression used in a qti-template-rule must not refer to the value of a response variable or outcome variable. It may only refer to the values of the template variables'), with https://www.imsglobal.org/spec/qti/v3p0/info#Data_ContextDeclaration (§5.34: 'Context variables may be referenced in template processing, in response processing, and in outcome processing'): template processing reads template and context variables, QTI_CONTEXT among them, and no response, outcome or built-in session variable (expressions.ts Template_reads; the old checker's P26)",
  },
  "Template reference": {
    explain: (keys, grammar) => referenceExplained(keys, grammar),
    rule: "template-ref",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateBlock.Attr_template-identifier (§5.145.1, and §5.155.1, §5.122.1, §5.124.1 and each choice's, as §5.132.3: 'The identifier of a template variable'), a template variable being one a template declaration declares (https://www.imsglobal.org/spec/qti/v3p0/info#Data_TemplateDeclaration, §5.151: 'Template declarations declare item variables that are to be used specifically for the purposes of cloning items') (references.ts ContentReference)",
  },
  "Test name key": {
    explain: (keys) =>
      `${field(keys, "kind")} and ${field(keys, "other")} of the test ${field(keys, "test")}'s assembled documents share the identifier ${field(keys, "identifier")}`,
    rule: "test-name-key",
    source:
      "reading 86: https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_AssessmentSection.Attr_identifier (§4.2.1) and §5.159.1, read over the assembled test (reading 5): the test document and every section document its section refs and includes place; and §7.5.3 ('A test may refer to the same section multiple times within a test'), so a section document placed twice is one document and names nothing twice: no two written elements of one test share an identifier (tests.ts InstanceName, AssembledName)",
  },
  TextDomain: {
    explain: (keys, grammar) =>
      domainExplained(
        grammar,
        Option.flatMap(keyedVersion(keys, grammar), (version) =>
          textDomainOf(grammar.attributes, {
            governs: field(keys, "governs"),
            kind: field(keys, "kind"),
            version,
          }),
        ),
        field(keys, "value"),
        `${field(keys, "kind")}'s text in ${field(keys, "version")}`,
      ),
    rule: "text-copy",
    source:
      "XML Schema Part 2, each simple-content kind's type compiled with its whiteSpace (domains.ts); reading 7; and https://www.w3.org/TR/xmlschema-2/#NOTATION (§3.2.19: 'The ·value space· of NOTATION is the set of QNames of notations declared in the current schema'), which no pinned XSD declares, so a text read in xs:NOTATION's empty domain is refused (reading 60, C47: attributes.ts emptyDomains)",
  },
  "Track srclang": {
    explain: (keys) =>
      `a track ${field(keys, "trackKind") === "" ? "that writes no kind, so in its missing value default, the subtitles state," : "whose kind is subtitles"} carries no srclang, where a track in the subtitles state names its language`,
    node: true,
    rule: "track-srclang",
    source:
      'reading 125: https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Track.Attr_srclang (§5.163.3: "This attribute must be present if the tag\'s kind attribute is in the subtitles state"); https://html.spec.whatwg.org/multipage/media.html#the-track-element (kind: "The attribute\'s missing value default is the subtitles state"): a track that writes no kind, or writes kind as subtitles, carries srclang (html.ts Track_srclang, subtitleTrackSrclang)',
  },
  "Typed attribute value": {
    explain: (keys) =>
      `an attribute value of base type ${JSON.stringify(field(keys, "baseType"))} is written ${JSON.stringify(field(keys, "value"))}, which is no lexical form of it written without whitespace around it`,
    rule: "attribute-lexical",
    source:
      "readings 7 and 8, and https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a qti-map-entry's map-key is a value of its mapping's base type (§7.21.1, 'The source value'), and a lookup table entry's target-value and a table's default-value are values of its outcome's base type (§5.90.1, §5.78.1, §7.23.2, §7.18.3); each is written as its base type's lexical form with no whitespace around it unless the base type is string (mapping.ts Typed_attribute_value over expression-types.ts BaseTypePattern)",
  },
  "Typed value": {
    explain: (keys) =>
      `a value of base type ${JSON.stringify(field(keys, "baseType"))} is written ${JSON.stringify(field(keys, "text"))}, which is no lexical form of it`,
    rule: "typed-copy",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Value (§7.46, Value: 'The base-type is defined by the 'base-type' attribute of the declaration except in the case of variables with record cardinality') and https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a qti-value's text is a lexical form of its base type, outer whitespace formatting but for string (reading 7): boolean true or false (reading 34), integer xs:integer unbounded (reading 45), float xs:double (reading 56) and duration xs:double (§8.13: 'Durations are represented using the 'xsd:double' datatype'), identifier IdentifierDType, uri xs:anyURI (reading 71), point two integers, pair and directedPair two identifiers; string and file any text",
  },
  "Usage typed value": {
    explain: (keys) =>
      `a usage value of baseType ${JSON.stringify(field(keys, "baseType"))} is written ${JSON.stringify(field(keys, "text"))}, which is no lexical form of it`,
    rule: "typed-copy",
    source:
      "reading 105: https://www.imsglobal.org/sites/default/files/spec/qti/v3/ud-bind/index.html (QTI 3.0 Usage Data binding §2.6.5, Value: 'A class that can represent a single value of any baseType'; §2.7.1, BaseTypeEnum) and https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_BaseTypeEnum (§8.13, BaseTypeEnum, each base type's value set): a ud:value that writes baseType holds a lexical form of that base type, read as a qti-value's text is (readings 7, 34, 45 and 71), and one that writes none is xs:normalizedString text (metadata.ts UsageValue over expression-types.ts BaseTypePattern)",
  },
  "Value cardinality": {
    explain: (keys) =>
      `a value set of ${JSON.stringify(field(keys, "cardinality"))} cardinality holds ${field(keys, "values")} values, ${field(keys, "fields")} of them with a field-identifier and ${field(keys, "typed")} with a base-type, where a record's values each carry both and any other's neither`,
    rule: "value-cardinality",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Enumerated_CardinalityEnum (§8.16, CardinalityEnum: single 'a single value'; record 'a set of independent values each identified by its own identifier and having its own base-type') and https://www.imsglobal.org/spec/qti/v3p0/info#Derived_Value (§7.46.1, §7.46.2: field-identifier and base-type are 'only used for' a value that forms part of a record): a single variable's default or correct value holds one qti-value, and a value is a record's field, with its field-identifier and base-type, exactly when its variable is a record",
  },
  "Variable declared": {
    explain: (keys) =>
      `${field(keys, "kind")} names ${field(keys, "identifier")}, which nothing declares and no built-in variable is`,
    rule: "P8",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#AbstractAttribute_ExpressionGroup_qti-variable (§6.9.40, qti-variable, normative: 'This expression looks up the value of an itemVariable that has been declared in a corresponding variableDeclaration or is one of the built-in variables'), https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_Variable.Attr_identifier (§7.47.1, Variable's identifier: 'The identifier of the item variable that has been declared in a corresponding variable declaration or of the built-in variables') and https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_SetValue.Attr_identifier (§5.130.1, a setter's: 'The identifier of the variable to be set') (references.ts); readings 4, 29 and 48",
  },
  "Variable kind": {
    explain: (keys) =>
      `${field(keys, "kind")} names ${field(keys, "identifier")}, a ${field(keys, "declarationKind")} variable, where it reads or sets only ${field(keys, "allowed")}`,
    rule: "variable-kind",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info, each processing element's definition of the variable it reads or sets: §7.10.1 Correct ('The identifier of the associated response variable'), §7.22.1 MapResponse ('the associated Response variable'), §6.9.46 MapResponsePoint ('looks up the value of a response variable'), §5.87.1 and §6.32.1 LookupOutcomeValue ('the outcome variable to be set'), §6.32.3 and §6.39.4 SetOutcomeValue ('sets the value of an outcome variable'), §6.50.1 SetTemplateValue ('sets the value of a template variable'), §6.50.4 SetDefaultValue ('The response variable or outcome variable to have its default value set'), §6.50.5 SetCorrectResponse ('The response variable to have its correct value set'), and §7.47.1 Variable and §7.12.1 Default, any item variable (§2.2.2: 'context, response, outcome or template variables'): a reference by identifier names a declaration, or a built-in standing as one (BuiltInVariable), of a kind its element reads or sets; and a setter (§5.130.1 SetValue: 'The identifier of the variable to be set') sets a variable of its own document, which only an unsplit reading names, since an item's variables reach a test only to be looked up (§2.11.1.2: 'values taken from an individual item session can be looked up by prefixing'), reading 112 (expression-types.ts ReferenceDeclaration and setterKinds, over VariableRef and a test's Reading)",
  },
  "Variable mapping source": {
    explain: (keys) =>
      `the variable mapping of ${field(keys, "itemRef")} maps ${field(keys, "source")}, which its item declares as no outcome variable`,
    rule: "variable-mapping-source",
    source:
      "the UP audit's A34: https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_VariableMapping.Attr_source-identifier (§7.48.1: 'The identifier of the outcome variable to identify the name of the source identifier during outcome processing variable mapping', info.txt:71657): a mapping's source names an outcome declaration of the item its item ref names, compared collapsed (expressions.ts MappingSource, through tests.ts ItemRefDocument); an item ref that names an LTI link names no item, so no outcome of it (reading 110)",
  },
  "Variable mapping target": {
    explain: (keys) =>
      `a variable mapping of ${field(keys, "itemRef")} names the target ${field(keys, "target")}, which another mapping of it or a built-in session variable already names`,
    rule: "variable-mapping-target",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#Derived_VariableMapping (§7.48: 'Variable mappings allow outcome variables declared with the name source-identifier in the corresponding item to be treated as if they were declared with the name target-identifier during outcome processing') with §4.5.1 ('All item variables declared in an item share the same namespace'; 'The identifiers of the built-in session variables are reserved') and reading 74: no two mappings of one item ref name one target, no target names a built-in session variable, and no target names another variable its item declares (reading 97), compared collapsed (tests.ts VariableMapping; expressions.ts MappingSource, its declared half)",
  },
  "Weighted base": {
    explain: (keys) =>
      `a qti-test-variables with a weight-identifier is of base-type ${field(keys, "baseType")}, not float`,
    rule: "P29",
    source:
      "https://www.imsglobal.org/spec/qti/v3p0/info#DerivedCharacteristic_TestVariables.Attr_weight-identifier (§7.39.5, TestVariables: 'The behaviour of this characterisic is only defined if the base-type attribute is float or omitted . When a weighting is specified the result of the expression always has base-type float'): with a weight-identifier, a base-type, where written, is float (expressions.ts Weighted_base; the old checker's P29)",
  },
  "XsiType available": {
    explain: (keys) =>
      `${field(keys, "kind")} is governed by ${field(keys, "governs")} under a parent in ${JSON.stringify(field(keys, "parentNamespace"))}, where its xsi:type names a type of its document's schema set or of XML Schema`,
    node: true,
    rule: "xsi-type",
    source:
      "readings 60 and 81: https://www.w3.org/TR/xmlschema-1/#cvc-assess-elt (XML Schema 1.0 Part 1 §3.3.4, Schema-Validity Assessment (Element), clause 1.2: an element no declaration assesses is assessed against the type its xsi:type resolves to in the schema its document is assessed against), so a foreign element's governing type is none, one of XML Schema's own, or a type of a schema set its parent's namespace stands in (open.ts typeAvailable; install.ts TypeAvailable, C15 and C36); a parent in no vocabulary's namespace stands in documents of every set, and the document's own set is reading 81's recorded limit",
  },
  "XsiType derived": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} is governed by ${field(keys, "governs")}${field(keys, "value") === "" ? "" : `, which its xsi:type ${JSON.stringify(field(keys, "value"))} names`}, and no type validly derived from its declared ${field(keys, "declared")} is; XsiType admits ${inBraces(
        grammar.xsi.xsiType.rows
          .filter(
            ({ kind, version }) =>
              kind === field(keys, "kind") && version === field(keys, "version"),
          )
          .map(({ type }) => type),
      )}`,
    node: true,
    rule: "xsi-type",
    source:
      "reading 47: https://www.w3.org/TR/xmlschema-1/#cvc-elt (XML Schema 1.0 Part 1 §3.3.4, Element Locally Valid (Element), clause 4.3: the local type definition 'must be validly derived from the {type definition}', §3.4.6 and §3.14.6), over the type that governs each element of a vocabulary kind (Node.governs: its xsi:type's, else its declared type; xsi.ts XsiType). Clauses 4.1 and 4.2, a value that is no QName in scope or names no type, are the codec's (shred: type-unresolved, type-unknown)",
  },
  "comment arm": {
    explain: (keys) => armExplained("comment", keys),
    rule: "text-copy",
    source: "the XDM comment nodes as rows (plan §1.4)",
  },
  "default hotspot last slot": {
    explain: (keys, grammar) =>
      `${field(keys, "kind")} with ${field(keys, "attribute")}="${field(keys, "value")}" is element ${field(keys, "elements")} of its parent's ${field(keys, "elementChildren")}, where ${inBraces(
        grammar.lastWhere
          .filter(({ kind }) => kind === field(keys, "kind"))
          .map(({ source }) => source),
      )} puts it last`,
    node: true,
    rule: "hotspot-default",
    source:
      "reading 80: https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_HotspotInteraction_qti-hotspot-choice (§5.68.6, and the HotspotChoice class description, §5.67: 'The default hotspot, if defined, must appear last'), of qti-hotspot-choice only, since the AssociableHotspot class (§5.7) and the graphic associate interaction's hotspots (§5.59.4) state no such rule; last among its parent's element children, so whitespace, comments and instructions after it do not count (children.ts LastWhere, ruling D3)",
  },
  "doctype arm": {
    explain: (keys) => armExplained("doctype", keys),
    rule: "text-copy",
    source: "the XDM doctype as a row (plan §1.4)",
  },
  "entityRef arm": {
    explain: (keys) => armExplained("entityRef", keys),
    rule: "text-copy",
    source: "the XDM entity references as rows (plan §1.4)",
  },
  "pi arm": {
    explain: (keys) => armExplained("pi", keys),
    rule: "text-copy",
    source: "the XDM processing instructions as rows (plan §1.4)",
  },
  "text arm": {
    explain: (keys) => armExplained("text", keys),
    rule: "text-copy",
    source: "the XDM text nodes as rows (plan §1.4)",
  },
  "value domain": {
    explain: (keys, grammar) =>
      `${field(keys, "name")}: ${domainExplained(
        grammar,
        Option.map(
          Option.flatMap(keyedVersion(keys, grammar), (version) =>
            governedAdmission(grammar.attributes, {
              governs: field(keys, "governs"),
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
    rule: "attribute-lexical",
    source:
      "XML Schema Part 2, each attribute's simple type compiled with its whiteSpace and residual facets (domains.ts); readings 7, 45, 46, 56 and 71; and the readings that hold a type to its stricter source (attributes.ts specReadings): 2 (MathML's number without a plus, and cn's base a positive integer), 9 (h1's role heading, tab or presentation, the Schematron's RULE ARIA ROLE 1b), 120 (qti-index's n at least 1), 123 (bdo's dir without auto), 124 and 125 (a media URL non-empty), 129 (xml:lang, lang and srclang BCP 47 language tags), 132 (a printed variable's format a printf format string of at most one conversion) and 135 (a MIME type RFC 2045's two tokens and a slash); and a usage statistic's lastUpdated, the usage data's DateDType (usagedata/imsqti_usagedatav3p0_v1p0.xsd:127-131, xs:date restricted by the pattern [0-9]{4}-[0-9]{2}-[0-9]{2}), the month lengths and the leap rule included (XML Schema 1.1 Part 2 §3.3.9, Day-of-month Representations), which StatisticDate.day restates as grizzle's lexical(date), whose pattern makes the generated date's cast total (Q5.12)",
  },
  "ws arm": {
    explain: (keys) => armExplained("ws", keys),
    rule: "text-copy",
    source: "the XDM whitespace nodes as rows (plan §1.4)",
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
  Rec.map(({ source }) => source),
);

/**
 * Name the rule a law's refusal is named by.
 *
 * @param law - The law.
 * @returns Its rule.
 */
export const ruleOf = (law: LawName): OracleRule => oracleLaws[law].rule;

/**
 * Name the verdict a judgment predicts.
 *
 * @param judgment - The judgment.
 * @returns Accepted when the codec read every document and no law broke; otherwise refused under
 *   the codec's rule or the first breach's.
 */
export const verdictOf = (judgment: Judgment): PredictedVerdict => {
  if (judgment._tag === "CodecRefusal") {
    return { rule: judgment.rule, verdict: "refused" };
  }

  const [first] = judgment.breaches;

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
