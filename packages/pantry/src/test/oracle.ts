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
 * - **§1.6:** `resource-type`, `root-type-reverse`, `file-listed`, `href-listed`, `entry-kind` and
 *   `manifest-id-space`.
 * - **§1.7, the overlays the grammar's relations state today:** O1 `document-key` (a cell's `headers`
 *   is the XSD's identifier list, with no reference rule: HTML's same-table rule was a departure,
 *   deleted by the operator's ruling of 2026-11-05); O2 `declaration-key`; O3 `binding-declared`,
 *   `binding-fit` with `record-binding-fit`, `choice-bounds`, and the feedback, template and
 *   printed-variable references; O4 arity (`P2`) and undeclared references (`P8`); O5
 *   `mapping-base-type`; O6 `lom-identifier`; O7 a selection's bound.
 *
 * The overlays' other laws have no statement yet beyond the rule each replaces, and the oracle
 * leaves them to their W5 slices: `lang-set-copy`, the reserved declarations, `mastery-range`, the
 * typed default and correct values, `max-strings-required`, `string-identifier-distinct`,
 * `aria-value-range`, `varref-copy`, adaptive feedback, coords by shape, the gap
 * and hottext owners beyond N8, `P20` to `P27`, `P29`, `template-derivation`, `calendar`, the usage
 * and CSM laws, and the typed values a domain derives beyond its regex (G5).
 */
import { Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { rowOf } from "#pantry/grammar/ancestry.ts";
import { admittedOf, requiredOf } from "#pantry/grammar/attributes.ts";
import type { ValueDomain } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { contentEnds, contentStep } from "#pantry/grammar/content.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import type { ValueFacet } from "#pantry/grammar/domains.ts";
import { foreignKinds, isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { Spelling } from "#pantry/grammar/references.ts";
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
import { flatten } from "#pantry/model/xdm.ts";
import type { ClosedName, NodeId, NodeRow, OpenNameRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import { ncName } from "#pantry/schema/patterns.ts";

/**
 * The rules a refusal is named by: the rule each law keeps from the guard or schema rule it
 * replaces (plan Q5.17), the codec's and the reader's, and three a law states that no rule of
 * today's importer names:
 *
 * - `child-set`: a content law of N7 (`Last`, `Counted`, `ChildBarredBy`), which ports a capacity
 *   use, a key or a mirror that today's schema refused under each relation's own name;
 * - `derived`: a field PostgreSQL derives (E1) that the host computed otherwise;
 * - `selection-bound`: a section selects more parts than it holds (O7), a law of the test vocabulary,
 *   which today's model does not read.
 */
export const oracleRules = [
  "admission",
  "ancestry-ban",
  "attribute-admission",
  "attribute-lexical",
  "binding-declared",
  "binding-fit",
  "body-empty",
  "child-set",
  "choice-bounds",
  "declaration-key",
  "derived",
  "document-key",
  "entry-kind",
  "feedback-ref",
  "file-listed",
  "hotspot-default",
  "href-listed",
  "href-path",
  "idref-target",
  "lom-identifier",
  "manifest-id-space",
  "manifest-root",
  "mapping-base-type",
  "not-qti3",
  "ordering",
  "owner-copy",
  "P2",
  "P28",
  "P8",
  "printed-variable-ref",
  "reachability",
  "reader-refusal",
  "record-binding-fit",
  "required-attribute",
  "resource-type",
  "root-type-reverse",
  "selection-bound",
  "template-ref",
  "text-copy",
  "union-count",
  "unmodeled-vocabulary",
  "well-formedness",
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
export interface Breach {
  readonly document: string;
  readonly keys: Keys;
  readonly law: LawName;
}

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
 * The rule each law's refusal is named by: one row per law, so a breach's rule is its law's.
 */
const lawRules = {
  "AL1 admission": "attribute-admission",
  "AL1 owner": "attribute-admission",
  "AL2 count": "attribute-admission",
  "AL2 distinct": "attribute-admission",
  "AL2 fold": "attribute-admission",
  "AL2 last slot": "attribute-admission",
  "AL3 required": "required-attribute",
  "AL4 open name key": "attribute-admission",
  "AL4 open names": "attribute-admission",
  Arity: "P2",
  "AttributeEntity owner": "attribute-lexical",
  "Binding declared": "binding-declared",
  BindingFit: "binding-fit",
  "Choice bounds": "choice-bounds",
  "Declaration key": "declaration-key",
  Document: "reachability",
  "Document entry": "entry-kind",
  "DocumentId key": "document-key",
  "E1 derived": "derived",
  "Feedback reference": "feedback-ref",
  "File listed": "file-listed",
  "Foreign attribute class": "attribute-admission",
  "Foreign element class": "unmodeled-vocabulary",
  "Href listed": "href-listed",
  "Idref target": "idref-target",
  LomObjectIdentifier: "lom-identifier",
  "Manifest id space": "manifest-id-space",
  MappableBaseType: "mapping-base-type",
  "N1 one document node": "reachability",
  "N1 sentinel": "reachability",
  "N2 key": "reachability",
  "N2 mirrors": "reachability",
  "N4 kinds": "admission",
  "N5 Follow": "ordering",
  "N5 admitted": "admission",
  "N5 first slot": "ordering",
  "N5 fold": "ordering",
  "N6 ancestry": "ancestry-ban",
  "N7 Counted": "child-set",
  "N7 Last": "child-set",
  "N7 barred by": "child-set",
  "N7 empty family": "union-count",
  "N7 last slot": "union-count",
  "N8 nearest": "owner-copy",
  "Namespace family": "reachability",
  "Node key": "reachability",
  OpenElementName: "unmodeled-vocabulary",
  "Printed variable reference": "printed-variable-ref",
  RecordBindingFit: "record-binding-fit",
  ResourceTypeOf: "resource-type",
  RootOfType: "root-type-reverse",
  "Selection bound": "selection-bound",
  "T1 document order": "reachability",
  "T2 root": "reachability",
  "T3 first child": "reachability",
  "T4 next sibling": "reachability",
  "T5 last child": "reachability",
  "T6 non-empty and leaf": "reachability",
  "Template reference": "template-ref",
  TextDomain: "text-copy",
  "Variable declared": "P8",
  "comment arm": "text-copy",
  "default hotspot last slot": "hotspot-default",
  "doctype arm": "text-copy",
  "entityRef arm": "text-copy",
  "pi arm": "text-copy",
  "text arm": "text-copy",
  "value domain": "attribute-lexical",
  "ws arm": "text-copy",
} as const satisfies Readonly<Record<LawName, OracleRule>>;

/**
 * The source each law states: a reading of `docs/spec-readings.md`, an XML Schema or XSD anchor, a
 * specification section, or the design document a structural law comes from. Where a law follows
 * one reading over another, its row says which. A law with no row is a compile error.
 */
export const lawSources = {
  "AL1 admission":
    "the XSDs' attribute declarations and wildcards as AttributeAdmission (fin.md D2); reading 13 for data-*, reading 47 for xsi:",
  "AL1 owner": "fin.md §16, the attribute family's owner copy (kind, version, document)",
  "AL2 count": "fin.md §16, the attribute family's count",
  "AL2 distinct":
    "XML 1.0 §3.1, WFC Unique Att Spec, by position (fin.md §16, masked by the open classes, D2)",
  "AL2 fold": "fin.md §16, attrs = attrsWas | bit(position)",
  "AL2 last slot": "fin.md §16, the attribute family's end value",
  "AL3 required": "the XSDs' use=\"required\": AttributeAdmission's use side (Required)",
  "AL4 open name key": "fin.md D2, an open-class attribute keeps its exact name; reading 13",
  "AL4 open names": "fin.md D2, an open-class attribute keeps its exact name; reading 13",
  Arity:
    "https://www.imsglobal.org/spec/qti/v3p0/info#Expr3 (§2.11.3, Operators: each operator's sub-expression count, as §2.11.3.28 Match, https://www.imsglobal.org/spec/qti/v3p0/info#OpMatch, 'takes two sub-expressions') (expression.ts OperatorArity); reading 21",
  "AttributeEntity owner":
    "XML 1.0 §4.1 (entity references in attribute values), kept unexpanded (plan §1.4)",
  "Binding declared":
    "https://www.imsglobal.org/spec/qti/v3p0/info#IV_Response (§2.2.2.2: 'Response variables are declared by response declarations and bound to interactions in the itemBody'); no sentence says a response-identifier naming nothing is invalid (draft reading)",
  BindingFit:
    "https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 (§2.4, each interaction's 'must be bound to a response variable with a base-type of … and … cardinality', as §2.4.1.1 https://www.imsglobal.org/spec/qti/v3p0/info#ChoiceInt) (expression.ts BindingFit)",
  "Choice bounds":
    "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ChoiceInteraction.Attr_max-choices (§5.30.2–§5.30.3); no sentence of the information model states min-choices ≤ max-choices (draft reading) (references.ts ChoiceBound); reading 18",
  "Declaration key":
    "https://www.imsglobal.org/spec/qti/v3p0/info#RootCharacteristic_OutcomeDeclaration.Attr_identifier (§4.5.1: 'All item variables declared in an item share the same namespace'); uniqueness itself is not stated (draft reading)",
  Document: "the XDM document node as the Document row (plan §1.4, fin.md D7)",
  "Document entry": "IMS Content Packaging 1.2: a listed document is an entry of the package",
  "DocumentId key":
    "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): an ID is unique in its document; reading 14",
  "E1 derived":
    "fin.md §17, E1: the fields closed relations determine, and the string value (folds.ts)",
  "Feedback reference":
    "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_FeedbackBlock.Attr_outcome-identifier (§5.49.1, §5.52.1, §5.93.1); no sentence states that it must name an outcome declaration (draft reading) (references.ts ContentReference)",
  "File listed": "IMS Content Packaging 1.2 and QTI packaging: every file is described; reading 33",
  "Foreign attribute class":
    "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: an open attribute's class agrees with its stored namespace against its element's",
  "Foreign element class":
    "XML Schema 1.0 Part 1 §3.10.4 (Wildcard allows Namespace Name), with Namespaces in XML 1.0 §2 for the absent namespace: a foreign element's class agrees with its stored namespace against its parent's",
  "Href listed": "IMS Content Packaging 1.2: a resource's href is the href of one of its files",
  "Idref target":
    "XML Schema Part 1, Validation Rule: Validation Root (the ID/IDREF table): an IDREF names an ID of its document; reading 14",
  LomObjectIdentifier:
    "https://www.imsglobal.org/spec/qti/v3p0/impl#h.lqndupc0ugmq (implementation guide §2.1.2, LOM Metadata: 'the test or item identifier should be present as an identifier in the LOM metadata'); reading 62, which rules the 'should' binding as an exception to reading 1 and states it consistent with reading 33",
  "Manifest id space":
    "IMS Content Packaging 1.2: the manifest's and its resources' identifiers are one xs:ID space",
  MappableBaseType:
    "https://www.imsglobal.org/spec/qti/v3p0/info#ExpMapResponse (§2.11.1.5: 'This expression cannot be applied to variables of record cardinality') and https://www.imsglobal.org/spec/qti/v3p0/info#Data_Mapping (§5.88); the base types a mapping maps are not stated (draft reading) (expression.ts MappableBaseType)",
  "N1 one document node": "XML 1.0 §2.1, one document entity; fin.md §12, entry 8",
  "N1 sentinel":
    "fin.md §12, entry 8: the document node is its own parent, document and nearest, at slot 0",
  "N2 key": "fin.md §5.2, the ordered family's key (parent, at)",
  "N2 mirrors": "fin.md §5.2, the ordered family: slots 0 to children − 1, each held",
  "N4 kinds": "fin.md §17, the NodeKind and SchemaVersion rosters",
  "N5 Follow":
    "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Follow; the operator's ruling of 2026-11-05)",
  "N5 admitted":
    "the XSDs' content models as Admission (content.ts); reading 6 for wildcard content",
  "N5 first slot": "fin.md §4.3, each fold's identity at slot 0",
  "N5 fold": "fin.md §4.5a, the predecessor copy",
  "N6 ancestry":
    "fin.md §13 P3 and §16: the information model's nesting rules as Banned and Needs (ancestry.ts, facets.ts); readings 25 and 38",
  "N7 Counted":
    "XML Schema Part 1 §3.9 occurrence bounds of 2 to n, which a position automaton relaxes, and spec counts (content.ts Counted: reading 26). The LOM vocabulary caps (facets.ts, cited R30) have no source: lom/imsmd_loose_v1p3p2.xsd:984 repeats source and value in an unbounded choice, and the 1EdTech Meta-data Best Practice Guide v1.3 §2.3.7 says only that a Vocabulary 'comprises two parts: the Source … and the Value'",
  "N7 Last":
    "XML Schema Part 1 §3.8, each content model as its Glushkov automaton (content.ts Last)",
  "N7 barred by":
    "the HTML Standard, colgroup: a span attribute bars col children (children.ts ChildBarredBy)",
  "N7 empty family": "fin.md §5.2, an empty family's end values are each fold's identity",
  "N7 last slot": "fin.md §5.2, the last-slot copy",
  "N8 nearest": "plan-qti-pie N8, the nearest interaction (fin.md §15, rule 3)",
  "Namespace family": "Namespaces in XML 1.0 §3, declarations in source order (fin.md §5.2)",
  "Node key": "trees.md §1, the tree relation's key, id",
  OpenElementName: "fin.md D2, a foreign element keeps its expanded name; reading 6",
  "Printed variable reference":
    "https://www.imsglobal.org/spec/qti/v3p0/info#DataAttribute_TestRubricBlock_qti-printed-variable (§5.160.6) and §2.7.1 ('Template variables can be referred to qti-printed-variable objects in the item body'); outcome targets are not stated (draft reading) (references.ts ContentReference)",
  RecordBindingFit:
    "https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 (§2.4.2.2: 'must be bound to a response variable with either single or record cardinality only'; §2.4.2.3 likewise) (expression.ts RecordBindingFit)",
  ResourceTypeOf:
    "QTI 3 packaging: the resource types each schema version admits (package.ts); reading 33",
  RootOfType: "QTI 3 packaging: the document root of each resource type (package.ts)",
  "Selection bound":
    "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_Selection.Attr_select (§5.129.1–§5.129.2; §4.2.3: 'selecting 3 elements from {A,B,C,D} without replacement might result in the selection {A,B,C}'); the bound is not stated (draft reading) (references.ts SectionPart); reading 26",
  "T1 document order": "trees.md §2, T1",
  "T2 root": "trees.md §2, T2",
  "T3 first child": "trees.md §2, T3, with the merged parent copy (trees.md §6)",
  "T4 next sibling": "trees.md §2, T4",
  "T5 last child": "trees.md §2, T5",
  "T6 non-empty and leaf": "trees.md §2, T6",
  "Template reference":
    "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_TemplateBlock.Attr_template-identifier (§5.145.1, §5.155.1; §2.7.2: 'A references must match the identifier in a corresponding template declaration') (references.ts ContentReference)",
  TextDomain:
    "XML Schema Part 2, each simple-content kind's type compiled with its whiteSpace (domains.ts); reading 7",
  "Variable declared":
    "https://www.imsglobal.org/spec/qti/v3p0/info#Variables (§2.2.2: 'All variables must be declared except for the built-in session variables'; §2.11.1.2, a variable expression names 'an item variable that has been declared … or is one of the built-in variables') (references.ts); readings 4, 29 and 48",
  "comment arm": "the XDM comment nodes as rows (plan §1.4)",
  "default hotspot last slot":
    "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_HotspotChoice.Attr_shape (§5.67.4); no sentence states that a default hotspot comes last (draft reading) (children.ts LastWhere, ruling D3)",
  "doctype arm": "the XDM doctype as a row (plan §1.4)",
  "entityRef arm": "the XDM entity references as rows (plan §1.4)",
  "pi arm": "the XDM processing instructions as rows (plan §1.4)",
  "text arm": "the XDM text nodes as rows (plan §1.4)",
  "value domain":
    "XML Schema Part 2, each attribute's simple type compiled with its whiteSpace and residual facets (domains.ts); readings 7, 45, 46, 56 and 61",
  "ws arm": "the XDM whitespace nodes as rows (plan §1.4)",
} as const satisfies Readonly<Record<LawName, string>>;

/**
 * Name the rule a law's refusal is named by.
 *
 * @param law - The law.
 * @returns Its rule.
 */
export const ruleOf = (law: LawName): OracleRule => lawRules[law];

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
 * The fold before a family's first slot: the identity of each of its folds, the content
 * automaton's start, state 0, and no element (fin.md §4.3).
 */
const identity: Slot = { elements: 0n, state: 0 };

/**
 * The XML whitespace characters the `collapse` class turns to spaces.
 */
const xmlWhitespace = /[\t\n\r]/gu;

/**
 * Collapse a lexical form: XML Schema's `collapse` whitespace class, which every name, number and
 * identifier an overlay law reads is read under. A value domain's own pattern absorbs its class
 * (`#pantry/grammar/domains.ts`), so the domain laws read the form as written.
 *
 * @param lexical - The form as read.
 * @returns The form with tabs, line feeds and carriage returns as spaces, trimmed, each run of
 *   spaces made one.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
const collapsed = (lexical: string): string =>
  lexical.replaceAll(xmlWhitespace, " ").trim().replaceAll(/ +/gu, " ");

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
 * Key a slot of a family.
 *
 * @param owner - The family's owner.
 * @param at - The slot.
 * @returns One string per (owner, slot).
 */
const slotKey = (owner: NodeId, at: bigint): string => `${owner} ${String(at)}`;

/**
 * Group rows by the node that owns them, keeping their order within each group.
 *
 * @param rows - The rows.
 * @param ownerOf - The id of a row's owner.
 * @returns Each owner's rows, in the order they came.
 */
const grouped = <Row>(
  rows: readonly Row[],
  ownerOf: (row: Row) => NodeId,
): ReadonlyMap<NodeId, readonly Row[]> => {
  const groups = new Map<NodeId, Row[]>();
  for (const row of rows) {
    const owner = ownerOf(row);
    const group = groups.get(owner);
    if (group === undefined) {
      groups.set(owner, [row]);
    } else {
      group.push(row);
    }
  }

  return groups;
};

/**
 * Whether an `AttributeName` handle is an open class, whose many names share one code.
 *
 * @param name - The handle.
 * @returns Whether it is `data-*`, `foreign`, `no-namespace` or `own-namespace`.
 */
const isOpenClass = (name: string): boolean => openClasses.some((open) => open === name);

/**
 * Keep an `AttributeName` handle when it names one attribute.
 *
 * @param name - An `AttributeName` handle.
 * @returns The handle, or none for an open class.
 */
const closedNameOf = (name: Composed["name"]): Option.Option<ClosedName<Composed>> =>
  Option.liftPredicate(name, (held): held is ClosedName<Composed> => !isOpenClass(held));

/**
 * One folded document with its rows indexed for the laws: by id, by slot, by owner, and each
 * element's closed attribute values by name.
 */
interface View {
  readonly attributesOf: ReadonlyMap<NodeId, readonly FoldedAttribute<Composed>[]>;
  /**
   * Each node row by its id, the first row that holds the id: a later row with the same id is in
   * {@link View.repeated}, never in place of the first.
   */
  readonly byId: ReadonlyMap<NodeId, FoldedNode<Composed>>;
  readonly bySlot: ReadonlyMap<string, FoldedNode<Composed>>;
  readonly childrenOf: ReadonlyMap<NodeId, readonly FoldedNode<Composed>[]>;
  readonly members: readonly FoldedNode<Composed>[];
  /**
   * The document's path in its package.
   */
  readonly path: string;
  /**
   * The node rows whose id an earlier row already holds, which the `Node` key refuses.
   */
  readonly repeated: ReadonlySet<FoldedNode<Composed>>;
  readonly rows: FoldedRows<Composed>;
  readonly self: NodeId;
  /**
   * The node rows whose `start` an earlier row of the document already holds, which T1's key
   * refuses.
   */
  readonly startTaken: ReadonlySet<FoldedNode<Composed>>;
  /**
   * The name of each entity-reference node, by node.
   */
  readonly entityOf: ReadonlyMap<NodeId, string>;
  /**
   * The stored namespace of each foreign element, by node: its `OpenElementName` row's.
   */
  readonly foreignNamespaceOf: ReadonlyMap<NodeId, string>;
  /**
   * Each open-class attribute's exact name, by the attribute's id: its `OpenName` row.
   */
  readonly openNameOf: ReadonlyMap<string, OpenNameRow>;
  /**
   * The character data of each text, whitespace and doctype node, by node.
   */
  readonly textOf: ReadonlyMap<NodeId, string>;
  readonly valuesOf: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
}

/**
 * Index a document's folded rows for the laws.
 *
 * @param path - The document's path in its package.
 * @param rows - Its folded rows.
 * @returns The view.
 */
const viewOf = (path: string, rows: FoldedRows<Composed>): View => {
  const self = rows.document.node;
  const members = rows.nodes.filter(({ start }) => start > 0n);
  const attributesOf = grouped(rows.attributes, ({ node }) => node);
  const valuesOf = new Map(
    [...attributesOf].map(([node, owned]) => [
      node,
      new Map(
        owned.flatMap((attribute) =>
          Option.toArray(closedNameOf(attribute.name)).map(
            (name) => [name, attribute.lexical] as const,
          ),
        ),
      ),
    ]),
  );
  const byId = new Map<NodeId, FoldedNode<Composed>>();
  const repeated = new Set<FoldedNode<Composed>>();
  const starts = new Set<bigint>();
  const startTaken = new Set<FoldedNode<Composed>>();
  for (const node of rows.nodes) {
    if (byId.has(node.id)) {
      repeated.add(node);
    } else {
      byId.set(node.id, node);
    }

    if (starts.has(node.start)) {
      startTaken.add(node);
    }

    starts.add(node.start);
  }

  return {
    attributesOf,
    byId,
    bySlot: new Map(members.map((node) => [slotKey(node.parent, node.at), node])),
    childrenOf: grouped(members, ({ parent }) => parent),
    entityOf: new Map(rows.entityRefs.map(({ name, node }) => [node, name])),
    foreignNamespaceOf: new Map(
      rows.openElementNames.map(({ namespace, node }) => [node, namespace]),
    ),
    members,
    openNameOf: new Map(rows.openNames.map((row) => [row.attribute, row])),
    path,
    repeated,
    rows,
    self,
    startTaken,
    textOf: new Map(
      [...rows.texts, ...rows.whitespace, ...rows.doctypes].map(({ node, value }) => [node, value]),
    ),
    valuesOf,
  };
};

/**
 * Read an element's closed attribute as written.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed name.
 * @returns Its lexical form, or none when the element carries no such attribute.
 */
const valueOf = (view: View, node: NodeId, name: string): Option.Option<string> =>
  Option.fromNullishOr(view.valuesOf.get(node)?.get(name));

/**
 * Read an element's text content: its text and whitespace children's characters, in order.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @returns The characters, empty when it holds none.
 */
const contentOf = (view: View, node: NodeId): string =>
  (view.childrenOf.get(node) ?? []).map(({ id }) => view.textOf.get(id) ?? "").join("");

/**
 * Follow parent links up from a node: the node, then each parent in turn, ending after the first
 * node at start 0, the document node. The walk stops before a node it has already met, so a cycle
 * of parent links, which T3 and T4 refuse, ends rather than growing without bound.
 *
 * @param view - The document.
 * @param start - The node to start at, none for no chain.
 * @param met - The ids the walk is not to enter again.
 * @returns The chain, nearest first.
 */
const chainFrom = (
  view: View,
  start: FoldedNode<Composed> | undefined,
  met: ReadonlySet<NodeId> = new Set(),
): readonly FoldedNode<Composed>[] => {
  const chain: FoldedNode<Composed>[] = [];
  const seen = new Set(met);
  let at = start;
  while (at !== undefined && !seen.has(at.id)) {
    seen.add(at.id);
    chain.push(at);
    at = at.start > 0n ? view.byId.get(at.parent) : undefined;
  }

  return chain;
};

/**
 * Write where a node sits in its document: each step from the document node down, as
 * `kind[at]`.
 *
 * @param view - The document.
 * @param id - The node's id.
 * @returns The path, `/` for the document node; on a cycle of parent links, the steps up to the
 *   first node met twice.
 */
const pathOf = (view: View, id: NodeId): string =>
  `/${chainFrom(view, view.byId.get(id))
    .filter(({ start }) => start > 0n)
    .map((at) => `${at.kind}[${String(at.at)}]`)
    .toReversed()
    .join("/")}`;

/**
 * The ancestors of a node, nearest first, the document node last.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Its ancestors; on a cycle of parent links, those up to the first node met twice.
 */
const ancestorsOf = (view: View, node: FoldedNode<Composed>): readonly FoldedNode<Composed>[] =>
  node.start > 0n ? chainFrom(view, view.byId.get(node.parent), new Set([node.id])) : [];

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
 * A table of the laws keyed by (version, kind), each cell computed from the grammar the first time
 * a law reads it.
 */
type ByKind<A> = (version: SchemaVersion, kind: string) => A;

/**
 * Compute a table keyed by (version, kind) on demand, each cell once.
 *
 * @param compute - The cell at a key.
 * @returns The table.
 */
const byKind = <A>(compute: ByKind<A>): ByKind<A> => {
  const cells = new Map<string, A>();

  return (version, kind) => {
    const key = kindKey(version, kind);
    const held = cells.get(key);
    if (held !== undefined) {
      return held;
    }

    const cell = compute(version, kind);
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
  readonly counted: ByKind<
    readonly { readonly max: number; readonly min: number; readonly position: number }[]
  >;
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
   * The positions of the open classes a kind admits in a version: AL2's mask `open`, under which
   * two attributes of one class are not a repeated name.
   */
  readonly open: ByKind<Positions>;
  /**
   * The positions of the attributes a kind requires in a version: `Required`, the side of
   * `AttributeAdmission` its `use = required` selects.
   */
  readonly required: ByKind<Positions>;
}

/**
 * Derive the tables the laws read from the composed grammar: each domain's compiled regex, each
 * kind's required and open-class positions per version, the XSD defaults of the ASI attributes,
 * the element kinds, the item's root kind, the `NodeKind` roster, the kinds with a content model
 * and `Counted`'s bounds by kind.
 *
 * @param grammar - The composed grammar.
 * @returns The tables.
 */
export const lawsOf = (grammar: ComposedGrammar): Laws => {
  const counted = Map.groupBy(grammar.content.counted.rows, (row) =>
    kindKey(row.version, row.parent),
  );

  return {
    counted: (version, kind) =>
      (counted.get(kindKey(version, kind)) ?? []).map(({ max, min, position }) => ({
        max,
        min,
        position: Number(position),
      })),
    defaults: new Map(
      Object.values(inventory).flatMap((entry) =>
        entry.attributes.flatMap((attribute) =>
          Option.toArray(attribute.default).map(
            (value) => [`${entry.handle} ${attribute.name}`, value] as const,
          ),
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
    itemRoot: Option.map(grammar.package.rootOfType.lookup({ type: itemType }), ({ root }) => root),
    kinds: new Set(grammar.kinds.nodeKind.handles),
    modeled: new Set(
      grammar.content.last.rows.map(({ parent, version }) => kindKey(version, parent)),
    ),
    open: byKind(
      (version, kind) =>
        new Set(
          openClasses.flatMap((name) =>
            Option.toArray(grammar.attributes.admission.lookup({ kind, name, version })).map(
              ({ position }) => Number(position),
            ),
          ),
        ),
    ),
    required: byKind((version, kind) =>
      requiredOf(grammar.attributes, grammar.kinds.attributeName, version, kind),
    ),
  };
};

/**
 * The names of the laws over node rows, in the order the oracle evaluates them.
 */
export const nodeLawNames = [
  "Node key",
  "T1 document order",
  "T2 root",
  "N1 sentinel",
  "N2 mirrors",
  "T3 first child",
  "T4 next sibling",
  "T5 last child",
  "T6 non-empty and leaf",
  "N4 kinds",
  "N5 admitted",
  "N5 Follow",
  "N5 first slot",
  "N5 fold",
  "E1 derived",
  "N6 ancestry",
  "N7 last slot",
  "N7 empty family",
  "N8 nearest",
  "AL2 count",
  "AL2 last slot",
  "AL3 required",
  "Namespace family",
  "default hotspot last slot",
  "N7 Last",
  "N7 Counted",
  "N7 barred by",
  "Foreign element class",
  "Foreign attribute class",
] as const;

/**
 * The name of a law over node rows, one of {@link nodeLawNames}.
 */
export type NodeLawName = (typeof nodeLawNames)[number];

/**
 * The names of the laws over a document's attribute, character-data and overlay rows and over a
 * package, in the order the oracle evaluates them.
 */
export const otherLawNames = [
  "AL1 admission",
  "AL1 owner",
  "AL2 distinct",
  "AL2 fold",
  "value domain",
  "Idref target",
  "N1 one document node",
  "N2 key",
  "text arm",
  "ws arm",
  "comment arm",
  "pi arm",
  "entityRef arm",
  "doctype arm",
  "Document",
  "AttributeEntity owner",
  "AL4 open names",
  "AL4 open name key",
  "OpenElementName",
  "TextDomain",
  "DocumentId key",
  "Declaration key",
  "Binding declared",
  "RecordBindingFit",
  "BindingFit",
  "Choice bounds",
  "Feedback reference",
  "Template reference",
  "Printed variable reference",
  "Arity",
  "Variable declared",
  "MappableBaseType",
  "Selection bound",
  "ResourceTypeOf",
  "RootOfType",
  "File listed",
  "Href listed",
  "Document entry",
  "Manifest id space",
  "LomObjectIdentifier",
] as const;

/**
 * The name of any law of the oracle.
 */
export type LawName = NodeLawName | (typeof otherLawNames)[number];

/**
 * Every law name, the node laws first.
 */
export const lawNames: readonly LawName[] = [...nodeLawNames, ...otherLawNames];

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
 * @param field - The field, none when the keys do not hold it.
 * @returns Its members.
 */
const membersOf = (field: string | undefined): readonly string[] =>
  field === undefined || field === "" ? [] : field.split(" ");

/**
 * Read the position an attribute name holds among those a kind admits (D8).
 *
 * @param laws - The grammar's tables.
 * @param version - The version.
 * @param kind - The kind.
 * @param name - The `AttributeName` handle.
 * @returns Its position, or none when the kind does not admit the name.
 */
const positionOf = (
  laws: Laws,
  version: SchemaVersion,
  kind: string,
  name: string,
): Option.Option<number> =>
  Option.map(laws.grammar.attributes.admission.lookup({ kind, name, version }), ({ position }) =>
    Number(position),
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
    law: "T6 non-empty and leaf",
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

      return unless(
        sameSlot(node.derived, derived) &&
          sameSet(node.derived.ancestry, derived.ancestry) &&
          node.stringValue === written,
        () => ({
          ancestry: spaced(node.derived.ancestry),
          derivedAncestry: spaced(derived.ancestry),
          derivedElements: String(derived.elements),
          derivedState: String(derived.state),
          derivedStringValue: written,
          elements: String(node.derived.elements),
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
      const missing = laws.required(node.version, node.kind).difference(node.attrs);

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
        rule === undefined || (parent !== undefined && node.at === parent.children - 1n),
        () => ({
          at: String(node.at),
          attribute: rule?.attribute ?? "",
          parentChildren: String(parent?.children ?? 0n),
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
          const carries = Option.exists(positionOf(laws, node.version, node.kind, name), (held) =>
            node.attrs.has(held),
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
          Option.exists(against, (held) => foreignKinds[classAgainst(uri, held)] === node.kind),
        () => ({
          parentNamespace: Option.getOrElse(against, () => ""),
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
 * Read an attribute's `AttributeAdmission` cell: its domain, use and position under its owner's
 * (version, kind).
 *
 * @param laws - The grammar's tables.
 * @param attribute - The attribute row.
 * @returns The cell, none for a name its kind does not admit.
 */
const admissionOf = (laws: Laws, attribute: FoldedAttribute<Composed>) =>
  laws.grammar.attributes.admission.lookup({
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
 * Collect a document's ids: the collapsed value of every attribute whose domain is an `ID`, with
 * the node each is on, in document order.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @returns The ids and their nodes, an id held twice listed twice.
 */
const idsOf = (view: View, laws: Laws): readonly { readonly id: string; readonly node: NodeId }[] =>
  view.rows.attributes.flatMap((attribute) =>
    Option.exists(compiledOf(laws, attribute), ({ domain }) => isId(domain))
      ? [{ id: collapsed(attribute.lexical), node: attribute.node }]
      : [],
  );

/**
 * Decide whether an attribute's copy of its owner is its owner's fields (AL1).
 *
 * @param attribute - The attribute row.
 * @param owner - Its owner's node row, none when no row holds its id.
 * @returns Whether its kind, version and document are its owner's.
 */
const ownerCopied = (
  attribute: FoldedAttribute<Composed>,
  owner: FoldedNode<Composed> | undefined,
): boolean =>
  owner !== undefined &&
  owner.kind === attribute.kind &&
  owner.version === attribute.version &&
  owner.document === attribute.document;

/**
 * Decide whether an attribute's fold is its predecessor's with its own position (AL2).
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
  sameSet(attribute.derived.attrs, attribute.attrsWas.union(position));

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
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @returns The breaches, in attribute order.
 */
const attributeBreaches = (view: View, laws: Laws): readonly Breach[] => {
  const ids = new Set(idsOf(view, laws).map(({ id }) => id));

  return [...view.attributesOf].flatMap(([owner, owned]) => {
    const node = view.byId.get(owner);
    const at = pathOf(view, owner);

    return owned.flatMap((attribute, slot): readonly Breach[] => {
      const breach = (law: LawName, keys: Keys = {}): Breach => ({
        document: view.path,
        keys: {
          at: String(attribute.at),
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
      const x: Positions = new Set(
        Option.toArray(admitted).map(({ position }) => Number(position)),
      );
      const repeated = attribute.attrsWas
        .intersection(x)
        .difference(laws.open(attribute.version, attribute.kind));

      return [
        ...(Option.isSome(admitted) ? [] : [breach("AL1 admission")]),
        ...(ownerCopied(attribute, node)
          ? []
          : [
              breach("AL1 owner", {
                ownerDocument: node?.document ?? "",
                ownerKind: node?.kind ?? "",
                ownerVersion: node?.version ?? "",
              }),
            ]),
        ...(repeated.size === 0
          ? []
          : [
              breach("AL2 distinct", { attrsWas: spaced(attribute.attrsWas), position: spaced(x) }),
            ]),
        ...(attribute.at > 0n || attribute.attrsWas.size === 0
          ? []
          : [breach("N5 first slot", { attrsWas: spaced(attribute.attrsWas) })]),
        ...(attributeFolded(attribute, slot, before, x) && Option.isSome(admitted)
          ? []
          : [
              breach("AL2 fold", {
                attrs: spaced(attribute.derived.attrs),
                attrsWas: spaced(attribute.attrsWas),
                predecessorAttrs: spaced(before?.derived.attrs ?? new Set()),
              }),
            ]),
        ...Option.match(compiled, {
          onNone: () => [],
          onSome: (held) => [
            ...(inDomain(held, lexical) ? [] : [breach("value domain", { lexical })]),
            ...(isIdref(held.domain)
              ? tokensOf(lexical)
                  .filter((token) => !ids.has(token))
                  .map((token) => breach("Idref target", { token }))
              : []),
          ],
        }),
      ];
    });
  });
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
    ({ attribute, local, prefix }) => `${ownerOf.get(attribute) ?? attribute} ${prefix}:${local}`,
  );
  const foreign = new Set(rows.nodes.filter(({ kind }) => isForeignKind(kind)).map(({ id }) => id));
  const documentNodes = rows.nodes.filter(({ start }) => start === 0n).length;

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
    ...(rows.document.node === view.self
      ? []
      : [breach("Document", { documentRow: rows.document.node, self: view.self })]),
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
    ...rows.nodes.flatMap((node) => {
      const compiled = laws.grammar.attributes.text
        .lookup({ kind: node.kind, version: node.version })
        .pipe(Option.flatMap(({ domain }) => Option.fromNullishOr(laws.domains.get(domain))));

      return Option.exists(compiled, (held) => !inDomain(held, node.stringValue))
        ? [
            breach("TextDomain", {
              kind: node.kind,
              node: pathOf(view, node.id),
              value: node.stringValue,
              version: node.version,
            }),
          ]
        : [];
    }),
  ];
};

/**
 * An NCName: the form of a bare variable reference.
 */
const nameForm = new RegExp(ncName, "u");

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
 * What the overlay laws read of one document beside its rows: its declarations by identifier and
 * whether its root is an item.
 */
interface Overlay {
  readonly declared: ReadonlyMap<string, readonly FoldedNode<Composed>[]>;
  readonly isItem: boolean;
  readonly laws: Laws;
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
    Option.fromNullishOr(overlay.laws.defaults.get(`${node.kind} ${name}`)),
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
  (node, overlay) => {
    const { grammar } = overlay.laws;
    const record = Option.isSome(grammar.recordBindingFit.lookup({ kind: node.kind }));
    const typed = grammar.bindingFit.rows.some(({ kind }) => kind === node.kind);
    const bound = collapsedOf(overlay, node, "response-identifier");
    if (!overlay.isItem || !(record || typed) || Option.isNone(bound)) {
      return [];
    }

    const identifier = bound.value;
    const response = (overlay.declared.get(identifier) ?? []).find(
      ({ kind }) => kind === "qti-response-declaration",
    );
    if (response === undefined) {
      return [{ keys: { identifier }, law: "Binding declared" }];
    }

    const cardinality = Option.getOrElse(collapsedOf(overlay, response, "cardinality"), () => "");
    const baseType = Option.getOrElse(collapsedOf(overlay, response, "base-type"), () => "");
    if (cardinality === "record") {
      return record ? [] : [{ keys: { identifier }, law: "RecordBindingFit" }];
    }

    return Option.isSome(grammar.bindingFit.lookup({ baseType, cardinality, kind: node.kind }))
      ? []
      : [{ keys: { baseType, cardinality, identifier }, law: "BindingFit" }];
  },
  (node, overlay) =>
    Option.toArray(overlay.laws.grammar.references.choiceBound.lookup({ kind: node.kind })).flatMap(
      ({ max, min }) => {
        const most = countAttribute(overlay, node, max);
        const least = Option.getOrElse(countAttribute(overlay, node, min), () => 0n);

        return Option.toArray(most)
          .filter((bound) => bound !== 0n && least > bound)
          .map((bound) => ({
            keys: { least: String(least), max, min, most: String(bound) },
            law: "Choice bounds",
          }));
      },
    ),
  (node, overlay) =>
    overlay.isItem
      ? namedBy(overlay, node)
          .filter(
            ({ identifier, targets }) =>
              targets.size > 0 && !declares(overlay, identifier, targets),
          )
          .flatMap(({ attribute, identifier }) =>
            Option.toArray(Option.fromNullishOr(contentLaws.get(attribute))).map(
              (law): Finding => ({ keys: { attribute, identifier }, law }),
            ),
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
              !overlay.laws.grammar.references.builtInVariable.has(identifier),
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
    if (node.kind !== "qti-selection") {
      return [];
    }

    const parts = (overlay.view.childrenOf.get(node.parent) ?? []).filter(({ kind }) =>
      Option.isSome(overlay.laws.grammar.references.sectionPart.lookup({ kind })),
    ).length;
    const replaced = Option.exists(
      collapsedOf(overlay, node, "with-replacement"),
      (form) => form === "true" || form === "1",
    );

    return Option.toArray(Option.flatMap(valueOf(overlay.view, node.id, "select"), countOf))
      .filter((count) => !replaced && count > BigInt(parts))
      .map((count): Finding => ({
        keys: { parts: String(parts), select: String(count) },
        law: "Selection bound",
      }));
  },
];

/**
 * Evaluate the overlay laws of §1.7 a document states alone: O1's id key, O2's declaration key,
 * and {@link overlayLaws} over every node.
 *
 * @param view - The document.
 * @param laws - The grammar's tables.
 * @returns The breaches.
 */
const overlayBreaches = (view: View, laws: Laws): readonly Breach[] => {
  const declarations = view.members.filter(({ kind }) =>
    laws.grammar.references.declarationKind.has(kind),
  );
  const declared = Map.groupBy(declarations, (node) =>
    collapsed(Option.getOrElse(valueOf(view, node.id, "identifier"), () => "")),
  );
  const root = view.childrenOf.get(view.self)?.find(({ kind }) => laws.elements.has(kind));
  const overlay: Overlay = {
    declared,
    isItem: Option.exists(laws.itemRoot, (kind) => kind === root?.kind),
    laws,
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

  return [
    ...[...ids].flatMap(([id, held]) =>
      held.slice(1).map(({ node }) => at(node, { keys: { id }, law: "DocumentId key" })),
    ),
    ...[...declared].flatMap(([identifier, nodes]) =>
      nodes.slice(1).map(({ id }) => at(id, { keys: { identifier }, law: "Declaration key" })),
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
}

/**
 * A resource of a manifest as the package laws read it: its node, identifier, type and href, and
 * its files' hrefs.
 */
interface ResourceOf {
  readonly files: readonly string[];
  /**
   * The `ResourceType` handle its `type` spells, none for a type no version admits.
   */
  readonly handle: Option.Option<string>;
  readonly href: Option.Option<string>;
  readonly identifier: string;
  readonly node: FoldedNode<Composed>;
  readonly type: string;
}

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

      return {
        files: (manifest.childrenOf.get(node.id) ?? [])
          .filter(({ kind }) => kind === "cp:file")
          .flatMap(({ id }) =>
            Option.toArray(valueOf(manifest, id, "href").pipe(Option.map(collapsed))),
          ),
        handle: Option.liftPredicate(type, (value) => grammar.package.resourceType.has(value)),
        href: valueOf(manifest, node.id, "href").pipe(Option.map(collapsed)),
        identifier: collapsed(Option.getOrElse(valueOf(manifest, node.id, "identifier"), () => "")),
        node,
        type,
      };
    });

/**
 * Name the documents a manifest lists: each resource whose type `RootOfType` maps to a root kind,
 * through its `href`, or through its one file when it has no `href`.
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
      Option.isSome(grammar.package.rootOfType.lookup({ type })),
    );
    const [only, ...rest] = resource.files;
    const path = Option.isSome(resource.href)
      ? resource.href
      : Option.fromNullishOr(rest.length === 0 ? only : undefined);

    return listsDocuments ? Option.toArray(path).map((at) => ({ path: at, resource })) : [];
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
 * The resource types whose LOM record names its document (reading 62): an item's and a test's, as
 * the implementation guide's LOM profile says "the test or item identifier should be present as
 * an identifier in the LOM metadata", a recommendation the operator rules binding.
 */
const lomNamed: ReadonlySet<string> = new Set([itemType, "imsqti_test_xmlv3p0"]);

/**
 * Evaluate the laws of §1.6 and O6 over a package: `resource-type`, `root-type-reverse`,
 * `file-listed`, `href-listed`, `entry-kind`, `manifest-id-space` and `lom-identifier`.
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
  const listedFiles = new Set(resources.flatMap(({ files }) => files));
  const manifestNode = manifest.members.find(({ kind }) => kind === "cp:manifest");
  const manifestId = Option.fromNullishOr(manifestNode).pipe(
    Option.flatMap(({ id }) => valueOf(manifest, id, "identifier")),
    Option.map(collapsed),
  );

  return [
    ...resources.flatMap((resource) =>
      Option.exists(resource.handle, (type) =>
        Option.isSome(
          grammar.package.resourceTypeOf.lookup({ type, version: resource.node.version }),
        ),
      )
        ? []
        : [
            breach("ResourceTypeOf", {
              identifier: resource.identifier,
              node: pathOf(manifest, resource.node.id),
              type: resource.type,
              version: resource.node.version,
            }),
          ],
    ),
    ...input.documents.flatMap((document) =>
      Option.exists(
        document.resource.handle.pipe(
          Option.flatMap((type) => grammar.package.rootOfType.lookup({ type })),
        ),
        ({ root }) => root === document.rootKind,
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
        .filter((href) => !resource.files.includes(href))
        .map((href) =>
          breach("Href listed", {
            files: spaced(resource.files),
            href,
            identifier: resource.identifier,
            node: pathOf(manifest, resource.node.id),
          }),
        ),
    ),
    ...input.missing.map((path) => breach("Document entry", { path })),
    ...resources
      .filter(({ identifier }) => Option.exists(manifestId, (id) => id === identifier))
      .map((resource) =>
        breach("Manifest id space", {
          identifier: resource.identifier,
          node: pathOf(manifest, resource.node.id),
        }),
      ),
    ...input.documents.flatMap((document): readonly Breach[] => {
      if (!lomNamed.has(document.resource.type)) {
        return [];
      }

      const loms = manifest.members.filter(
        (member) =>
          member.kind === "lom:lom" &&
          ancestorsOf(manifest, member).includes(document.resource.node),
      );
      const identifier = Option.exists(
        grammar.package.rootOfType.lookup({ type: document.resource.type }),
        ({ root }) => root === document.rootKind,
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
        ...documents.flatMap(({ folded }) =>
          Result.match(folded, {
            onFailure: (breach) => [breach],
            onSuccess: (read) => documentBreaches(read.path, read.rows, laws),
          }),
        ),
      ],
      documents: [view.path, ...documents.map(({ path }) => path)],
    }),
  });
});

/**
 * Read one key field of a breach.
 *
 * @param keys - The breach's keys.
 * @param name - The field's name.
 * @returns Its text, empty when the keys do not hold it.
 */
const field = (keys: Keys, name: string): string => keys[name] ?? "";

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
    ...grammar.content.symbol.rows
      .filter(
        (row) => row.version === version && row.parent === parent && row.position === position,
      )
      .map(({ kind }) => kind),
  ]),
];

/**
 * Explain a value against the domain it is read under: the pattern it misses, or the residual
 * facets its typed value lies outside.
 *
 * @param grammar - The composed grammar.
 * @param handle - The domain's handle, none when no cell gives one.
 * @param form - The lexical form as written.
 * @returns The explanation.
 */
const domainExplained = (
  grammar: ComposedGrammar,
  handle: Option.Option<string>,
  form: string,
): string =>
  Option.match(
    handle.pipe(
      Option.flatMap((held) =>
        Option.fromNullishOr(grammar.attributes.domains.find((domain) => domain.handle === held)),
      ),
    ),
    {
      onNone: () => `${JSON.stringify(form)} is read under no value domain`,
      onSome: (domain) => {
        const broken = facetsBroken(domain, form);

        return new RegExp(domain.pattern, patternFlags).test(form)
          ? `${JSON.stringify(form)} is outside ${domain.handle}'s ${broken.map(({ facet, value }) => `${facet} ${value}`).join(", ")}`
          : `${JSON.stringify(form)} is outside ${domain.handle}, whose pattern is ${domain.pattern}`;
      },
    },
  );

/**
 * The attributes a breach's kind admits in its version, by position.
 *
 * @param keys - The breach's keys, `kind` and `version` among them.
 * @param grammar - The composed grammar.
 * @returns The admitted names with their positions, none for a version the roster lacks.
 */
const admittedNames = (keys: Keys, grammar: ComposedGrammar) =>
  Option.match(
    Option.liftPredicate(field(keys, "version"), (version) => grammar.kinds.versions.has(version)),
    {
      onNone: () => [],
      onSome: (version) =>
        admittedOf(grammar.attributes, grammar.kinds.attributeName, version, field(keys, "kind")),
    },
  );

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
 * Each law's explanation, computed from a breach's keys and the closed relations the law reads.
 */
const explainers: Readonly<Record<LawName, Explainer>> = {
  "AL1 admission": (keys, grammar) =>
    `${field(keys, "kind")} admits no ${field(keys, "name")} in ${field(keys, "version")}; it admits ${inBraces(
      admittedNames(keys, grammar).map(({ name }) => name),
    )}`,
  "AL1 owner": (keys) =>
    field(keys, "ownerDocument") === ""
      ? `the attribute at slot ${field(keys, "at")} sits on a ${field(keys, "ownerKind") || "missing node"}, which is no element`
      : `the attribute's owner copy (${field(keys, "kind")}, ${field(keys, "version")}) is not its owner's (${field(keys, "ownerKind")}, ${field(keys, "ownerVersion")}, document ${field(keys, "ownerDocument")})`,
  "AL2 count": (keys) =>
    `attributes ${field(keys, "attributes")} over ${field(keys, "rows")} attribute rows`,
  "AL2 distinct": (keys) =>
    `${field(keys, "name")} takes position ${field(keys, "position")}, which attrs ${inBraces(membersOf(keys["attrsWas"]))} already holds, and no open class does`,
  "AL2 fold": (keys) =>
    `attrs ${inBraces(membersOf(keys["attrs"]))} from attrsWas ${inBraces(membersOf(keys["attrsWas"]))}, where its predecessor's fold is ${inBraces(membersOf(keys["predecessorAttrs"]))}`,
  "AL2 last slot": (keys) =>
    `attrs ${inBraces(membersOf(keys["attrs"]))}, where its last attribute's fold is ${inBraces(membersOf(keys["lastAttrs"]))}`,
  "AL3 required": (keys, grammar) => {
    const missing = new Set(membersOf(keys["missing"]).map(Number));

    return `${field(keys, "kind")} lacks ${inBraces(
      admittedNames(keys, grammar)
        .filter(({ position }) => missing.has(position))
        .map(({ name }) => name),
    )}, which Required holds`;
  },
  "AL4 open name key": (keys) =>
    `${field(keys, "openNames")} open names, ${field(keys, "distinct")} distinct by (node, prefix, local)`,
  "AL4 open names": (keys) =>
    `${field(keys, "openNames")} open names over ${field(keys, "openAttributes")} open-class attributes`,
  Arity: (keys, grammar) =>
    Option.match(grammar.operatorArity.lookup({ kind: field(keys, "kind") }), {
      onNone: () => `${field(keys, "kind")} has no OperatorArity row`,
      onSome: ({ max, min }) =>
        `${field(keys, "kind")} holds ${field(keys, "count")} expressions; OperatorArity admits ${String(min)} to ${String(max)}`,
    }),
  "AttributeEntity owner": (keys) =>
    `an entity reference at offset ${field(keys, "offset")} of attribute ${field(keys, "attribute")} has no attribute row`,
  "Binding declared": (keys) =>
    `response-identifier names ${field(keys, "identifier")}, which no qti-response-declaration declares`,
  BindingFit: (keys, grammar) =>
    `${field(keys, "kind")} binds ${field(keys, "identifier")}, of base type ${JSON.stringify(field(keys, "baseType"))} and cardinality ${JSON.stringify(field(keys, "cardinality"))}; BindingFit admits ${inBraces(
      grammar.bindingFit.rows
        .filter(({ kind }) => kind === field(keys, "kind"))
        .map(({ baseType, cardinality }) => `${baseType} ${cardinality}`),
    )}`,
  "Choice bounds": (keys) =>
    `${field(keys, "min")} ${field(keys, "least")} exceeds ${field(keys, "max")} ${field(keys, "most")}`,
  "Declaration key": (keys) => `a second declaration of ${field(keys, "identifier")}`,
  Document: (keys) =>
    `the Document row's node ${field(keys, "documentRow")} is not the document node ${field(keys, "self")}`,
  "Document entry": (keys) =>
    `the listed document ${field(keys, "path")} is no entry of the package`,
  "DocumentId key": (keys) => `a second element holds the id ${field(keys, "id")}`,
  "E1 derived": (keys) =>
    `holds state ${field(keys, "state")}, ${field(keys, "elements")} elements, ancestry ${inBraces(membersOf(keys["ancestry"]))} and string value ${JSON.stringify(field(keys, "stringValue"))}, where the closed relations and its children derive state ${field(keys, "derivedState")}, ${field(keys, "derivedElements")} elements, ancestry ${inBraces(membersOf(keys["derivedAncestry"]))} and ${JSON.stringify(field(keys, "derivedStringValue"))}`,
  "Feedback reference": (keys, grammar) => referenceExplained(keys, grammar),
  "File listed": (keys) => `${field(keys, "path")} is the href of no cp:file`,
  "Foreign attribute class": (keys) =>
    `${field(keys, "kind")}'s attributes ${inBraces(membersOf(keys["wrong"]))} (slot:class:namespace) are not of the class their namespace has against the element's ${JSON.stringify(field(keys, "elementNamespace"))}: no-namespace for none, own-namespace for the element's, foreign for another`,
  "Foreign element class": (keys) =>
    `${field(keys, "kind")} stores the namespace ${JSON.stringify(field(keys, "uri"))} under a parent in ${JSON.stringify(field(keys, "parentNamespace"))}, where no-namespace-element is for none, own-namespace-element for the parent's and foreign-element for another`,
  "Href listed": (keys) =>
    `${field(keys, "identifier")}'s href ${field(keys, "href")} is the href of none of its files ${inBraces(membersOf(keys["files"]))}`,
  "Idref target": (keys) =>
    `${field(keys, "name")} names ${field(keys, "token")}, which no ID attribute of the document holds`,
  LomObjectIdentifier: (keys) =>
    `the document ${field(keys, "identifier")} is named ${field(keys, "entries")} by its record`,
  "Manifest id space": (keys) => `${field(keys, "identifier")} is also the manifest's identifier`,
  MappableBaseType: (keys, grammar) =>
    `a mapping of base type ${JSON.stringify(field(keys, "baseType"))}; MappableBaseType holds ${inBraces(
      grammar.mappableBaseType.rows.map(({ baseType }) => baseType),
    )}`,
  "N1 one document node": (keys) =>
    `${field(keys, "documentNodes")} nodes start at 0, where a document has one`,
  "N1 sentinel": (keys) =>
    `the document node sits at slot ${field(keys, "at")} with parent ${field(keys, "parent")}, document ${field(keys, "document")}, nearest ${field(keys, "nearest")} (${field(keys, "nearestKind")}) and parentAncestry ${inBraces(membersOf(keys["parentAncestry"]))}, where it is its own at slot 0 and sits in no flag`,
  "N2 key": (keys) =>
    `${field(keys, "members")} children over ${field(keys, "slots")} distinct (parent, at) slots`,
  "N2 mirrors": (keys) =>
    keys["missing"] === undefined
      ? `slot ${field(keys, "at")} under a parent of ${field(keys, "parentChildren")} children`
      : `${field(keys, "children")} children, none at slots ${inBraces(membersOf(keys["missing"]))}`,
  "N4 kinds": (keys, grammar) =>
    `${field(keys, "kind")} under ${field(keys, "parentKind")} in ${field(keys, "version")}: NodeKind holds ${inBraces(
      [field(keys, "kind"), field(keys, "parentKind")].filter((kind) =>
        grammar.kinds.nodeKind.has(kind),
      ),
    )}, SchemaVersion ${grammar.kinds.versions.has(field(keys, "version")) ? "holds" : "lacks"} ${field(keys, "version")}`,
  "N5 Follow": (keys, grammar) => {
    const version = field(keys, "version");
    const parent = field(keys, "parentKind");
    const { was } = keys;
    if (was === undefined) {
      return `no position of ${parent}'s content model that names ${field(keys, "kind")} follows its predecessor in ${version}`;
    }

    const next = grammar.content.positions.handles.filter((to) =>
      Option.isSome(grammar.content.follow.lookup({ from: was, parent, to, version })),
    );

    return `${field(keys, "kind")} follows state ${was}, after which ${parent}'s content model in ${version} admits ${inBraces(
      next.map((to) => `${to}: ${kindsAt(grammar, version, parent, to).join(" ")}`),
    )}`;
  },
  "N5 admitted": (keys, grammar) =>
    `${field(keys, "parentKind")} admits no ${field(keys, "kind")} in ${field(keys, "version")}; it admits ${inBraces(
      grammar.admission.rows
        .filter(
          ({ parent, version }) =>
            parent === field(keys, "parentKind") && version === field(keys, "version"),
        )
        .map(({ child }) => child),
    )}`,
  "N5 first slot": (keys) =>
    keys["attrsWas"] === undefined
      ? `the first slot copies state ${field(keys, "was")} and ${field(keys, "elementsWas")} elements, where each fold starts at 0`
      : `the first attribute copies attrs ${inBraces(membersOf(keys["attrsWas"]))}, where the fold starts empty`,
  "N5 fold": (keys) =>
    `copies state ${field(keys, "was")} and ${field(keys, "elementsWas")} elements, where its predecessor's fold is state ${field(keys, "predecessorState") || "none"} and ${field(keys, "predecessorElements") || "no"} elements`,
  "N6 ancestry": (keys, grammar) => {
    const sits = new Set(membersOf(keys["parentAncestry"]));
    const kind = field(keys, "kind");

    return `${kind} sits in ${inBraces([...sits])}: Banned holds ${inBraces(
      [...rowOf(grammar.ancestry.banned, kind)].filter((flag) => sits.has(flag)),
    )} of it, and Needs lacks ${inBraces(
      [...rowOf(grammar.ancestry.needs, kind)].filter((flag) => !sits.has(flag)),
    )}`;
  },
  "N7 Counted": (keys, grammar) =>
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
  "N7 Last": (keys, grammar) =>
    `${field(keys, "kind")} holds ${inBraces(membersOf(keys["children"]))} and ends in state ${field(keys, "childState")}; its content model in ${field(keys, "version")} ends in ${inBraces(
      grammar.content.last.rows
        .filter(
          ({ parent, version }) =>
            parent === field(keys, "kind") && version === field(keys, "version"),
        )
        .map(({ position }) => position),
    )}`,
  "N7 barred by": (keys, grammar) =>
    Option.match(
      grammar.barredBy.lookup({ parent: field(keys, "kind"), version: field(keys, "version") }),
      {
        onNone: () => `${field(keys, "kind")} bars no position`,
        onSome: ({ name, position }) =>
          `${field(keys, "kind")} carries ${name}, which bars position ${position}, and holds ${inBraces(membersOf(keys["barred"]))} there`,
      },
    ),
  "N7 empty family": (keys) =>
    `an empty family's end values are state ${field(keys, "childState")} and ${field(keys, "elementChildren")} elements, where each fold starts at 0`,
  "N7 last slot": (keys) =>
    `end values state ${field(keys, "childState")} and ${field(keys, "elementChildren")} elements, where its last child's fold is state ${field(keys, "lastState") || "none"} and ${field(keys, "lastElements") || "no"} elements`,
  "N8 nearest": (keys, grammar) =>
    `nearest ${field(keys, "nearest")} (${field(keys, "nearestKind")}) under ${field(keys, "parent")}, a ${field(keys, "parentKind")}, where ${
      Option.isSome(grammar.kinds.interaction.lookup({ kind: field(keys, "parentKind") }))
        ? "an interaction parent is the nearest"
        : `the parent's nearest ${field(keys, "parentNearest")} is`
    }`,
  "Namespace family": (keys) =>
    `namespaces ${field(keys, "namespaces")} over ${field(keys, "declarations")} declarations`,
  "Node key": (keys) => `a second row holds the id ${field(keys, "id")}`,
  OpenElementName: (keys) =>
    `${field(keys, "names")} foreign names over ${field(keys, "foreignElements")} foreign elements`,
  "Printed variable reference": (keys, grammar) => referenceExplained(keys, grammar),
  RecordBindingFit: (keys) =>
    `${field(keys, "kind")} binds the record ${field(keys, "identifier")}, which RecordBindingFit does not admit`,
  ResourceTypeOf: (keys, grammar) =>
    `${field(keys, "identifier")} is of type ${JSON.stringify(field(keys, "type"))}, which ${field(keys, "version")} does not admit; it holds in ${inBraces(
      grammar.package.resourceTypeOf.rows
        .filter(({ type }) => type === field(keys, "type"))
        .map(({ version }) => version),
    )}`,
  RootOfType: (keys, grammar) =>
    `${field(keys, "path")} has root ${field(keys, "rootKind")} and is listed as ${field(keys, "type")}, which lists ${Option.match(
      grammar.package.rootOfType.lookup({ type: field(keys, "type") }),
      { onNone: () => "no document", onSome: ({ root }) => root },
    )}`,
  "Selection bound": (keys) =>
    `selects ${field(keys, "select")} of the section's ${field(keys, "parts")} parts without replacement`,
  "T1 document order": (keys) =>
    `a second node of the document starts at ${field(keys, "start")}, where each start is one node's`,
  "T2 root": (keys) =>
    `${field(keys, "kind")} starts at ${field(keys, "start")} with parent ${field(keys, "parent")}, where the one self-parented row is the root, at start 0`,
  "T3 first child": (keys) =>
    `slot ${field(keys, "at")} starts at ${field(keys, "start")} with parentStart ${field(keys, "parentStart")} under a parent that starts at ${field(keys, "parentStartHeld") || "none"}, where its copy of the parent is the parent's fields and a first child starts one past its parent`,
  "T4 next sibling": (keys) =>
    `starts at ${field(keys, "start")}, where its predecessor ends at ${field(keys, "predecessorEnd") || "no row"}`,
  "T5 last child": (keys) =>
    `ends at ${field(keys, "end")}, where its last child ends at ${field(keys, "lastEnd") || "no row"}`,
  "T6 non-empty and leaf": (keys) =>
    `holds [${field(keys, "start")}, ${field(keys, "end")}) over ${field(keys, "children")} children, where every interval is non-empty and a leaf's holds itself alone`,
  "Template reference": (keys, grammar) => referenceExplained(keys, grammar),
  TextDomain: (keys, grammar) =>
    domainExplained(
      grammar,
      Option.map(
        grammar.attributes.text.lookup({
          kind: field(keys, "kind"),
          version: field(keys, "version"),
        }),
        ({ domain }) => domain,
      ),
      field(keys, "value"),
    ),
  "Variable declared": (keys) =>
    `${field(keys, "kind")} names ${field(keys, "identifier")}, which nothing declares and no built-in variable is`,
  "comment arm": (keys) => armExplained("comment", keys),
  "default hotspot last slot": (keys, grammar) =>
    `${field(keys, "kind")} with ${field(keys, "attribute")}="${field(keys, "value")}" sits at slot ${field(keys, "at")} of ${field(keys, "parentChildren")}, where ${inBraces(
      grammar.lastWhere
        .filter(({ kind }) => kind === field(keys, "kind"))
        .map(({ source }) => source),
    )} puts it last`,
  "doctype arm": (keys) => armExplained("doctype", keys),
  "entityRef arm": (keys) => armExplained("entityRef", keys),
  "pi arm": (keys) => armExplained("pi", keys),
  "text arm": (keys) => armExplained("text", keys),
  "value domain": (keys, grammar) =>
    domainExplained(
      grammar,
      Option.map(
        grammar.attributes.admission.lookup({
          kind: field(keys, "kind"),
          name: field(keys, "name"),
          version: field(keys, "version"),
        }),
        ({ domain }) => domain,
      ),
      field(keys, "lexical"),
    ),
  "ws arm": (keys) => armExplained("ws", keys),
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
  explainers[law](keys, grammar);

/**
 * Write a breach for a report: its law, its rule, where it broke, and its explanation.
 *
 * @param breach - The breach.
 * @param grammar - The composed grammar.
 * @returns One line.
 */
export const shownBreach = (breach: Breach, grammar: ComposedGrammar): string =>
  `${breach.law} (${ruleOf(breach.law)}) at ${breach.document}${field(breach.keys, "node")}: ${explain(breach.law, breach.keys, grammar)}`;
