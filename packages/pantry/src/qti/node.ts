/**
 * The relational XDM: every node of every document as one `Node` row, the document node its tree's
 * root, and the laws that make each document's rows one tree in document order whose content is its
 * vocabularies' (plan §1.3, N1 to N12; `docs/rfc/trees.md`; the W5 amendment's C5, C8, C10 to C13,
 * C15, C21, C22 and C25).
 *
 * `Node` is `tree(on(Node, "parent", "at"), fin(Node, "children"), { root: "document" })`: grizzle
 * draws each row's slot, count and pre-order interval `[start, end)` from the nesting its writer
 * sends, and its natives (T0 to T6, the root pin) make each document's rows one tree. Every other
 * law here rides one of the tree's three foreign keys or is a row CHECK:
 *
 * - The owner axis carries the parent copies (N3): `version`, `kind`, `governs`, `ancestry`,
 *   `nearest`, `nearestKind` and `parentKind` into `version`, `parentKind`, `parentGoverns`,
 *   `parentAncestry`, `parentNearest`, `parentNearestKind` and `parentParentKind`;
 * - The predecessor axis carries the content automaton's state into `was` (N5), and each fold's
 *   running value;
 * - The last axis carries the last child's state into `lastState` (N7), and each fold's end.
 *
 * Three facts of grizzle at the pinned commit shape the statements (each is in the slice report):
 *
 * - A containment rides a tree axis only when its member side selects the tree's members,
 *   `select(Node, start > 0)`, and its owner side, on the last axis, selects nothing
 *   (`analysis/theory/families.ts` `axisShapes`, `selectsMembers`). The owner axis itself is
 *   planned from the plain `parent`, so the root still holds its own copies.
 * - A `relation.generated` term reads the caller's fields alone: a drawn or accumulated field is
 *   refused when the relation is built. So `ancestry`, which reads `parentAncestry`, is written by
 *   the host and proved by a row check, as `state` is (C5).
 * - A check is named by an identifier, so each is named by its oracle law with spaces written as
 *   underscores (`N1_sentinel` for "N1 sentinel"); no law name holds an underscore.
 */
import {
  accumulated,
  Bits,
  bits,
  check,
  closedId,
  Compute,
  contained,
  drawn,
  fin,
  fold,
  Monoid,
  natural,
  on,
  pred,
  relation,
  select,
  str,
  tree,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { openDomain } from "#pantry/grammar/attributes.ts";
import {
  AttributeSlot,
  Banned,
  BarredOf,
  ChildGrammar,
  ContentModelOf,
  CountedOf,
  Enters,
  Flag,
  Follow,
  GoverningOf,
  interactionKinds,
  Last,
  Needs,
  NodeKind,
  nonElementKinds,
  openElementClasses,
  Position,
  PositionSelf,
  SchemaVersion,
  SharedModelOf,
  SlotSelf,
  Symbol as ContentSymbol,
  TextDomain,
  TypeName,
  ValueDomainOf,
  XsiType,
} from "#pantry/grammar/install.ts";
import type { ValueDomain } from "#pantry/grammar/install.ts";
import { keyText } from "#pantry/qti/limits.ts";

/**
 * The first characters of an XML Namespaces NCName: XML 1.0's NameStartChar without the colon,
 * written as classes, since grizzle's pattern grammar has no `\p`.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#NT-NCName | Namespaces in XML 1.0, NCName}
 */
const ncNameStart = "A-Z_a-zÀ-ÖØ-öø-˿Ͱ-ͽͿ-῿‌-‍⁰-↏Ⰰ-⿯、-퟿豈-﷏ﷰ-�\\u{10000}-\\u{EFFFF}";

/**
 * The later characters of an NCName: its start characters and XML 1.0's NameChar additions.
 */
const ncNameContinuation = `${ncNameStart}\\-.0-9·̀-ͯ‿-⁀`;

/**
 * An element's prefix as written: an NCName, or the empty string for an unprefixed name. The bound
 * of 256 characters is a key's byte bound, since a prefix may sit in a key.
 */
export const prefixPattern = `^(?:[${ncNameStart}][${ncNameContinuation}]{0,255})?$`;

/**
 * A node's characters: any run of XML 1.0's Char, tabs, line feeds and carriage returns included.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-Char | XML 1.0, Char}
 */
export const charsPattern =
  "^[\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]*$";

/**
 * The text type of a node's characters. Exported for `src/import/refusal.ts`, which names its
 * pattern law.
 */
export const Chars = str.regex(charsPattern);

/**
 * The nil uuid: the parent copy's start, which only the root's own value ever replaces, since the
 * owner axis holds the root to itself.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * One node of a document: an element, a run of character data, a comment, an instruction, an entity
 * reference, the doctype or the document node itself.
 *
 * Its fields by how each is written (§C):
 *
 * - **the host's:** `id`, `document` (the root field, on the root alone, its own id), `kind`,
 *   `version`, `governs`, `prefix`, `nearest`, `nearestKind`, `state` (its content-automaton state,
 *   from `contentStep`), `ancestry` (`parentAncestry ∪ Enters(kind)`), `chars` (a text or
 *   whitespace node's characters, an entity reference's `&name;`, empty elsewhere) and
 *   `stringPiece` (its `chars` where its parent's text is checked or copied, empty elsewhere: the
 *   string value fold's step);
 * - **the tree's group:** `parent`, which the nesting supplies and the root holds as its own id;
 * - **drawn:** `at`, `children`, `start`, `end`, and the attribute and namespace family counts;
 * - **accumulated** by grizzle along the tree's axes: the parent copies (`parentParentKind` the
 *   parent's own `parentKind`, so a member's string value can be selected by its grandparent, as
 *   {@link copiedTitleText} is), `was` and `lastState`, and each fold's values: `elementsWas`,
 *   `elements` and `elementChildren`; `countedChildren` and `barredChildren`; `charsWas`,
 *   `charsAfter` and `stringValue`; and `attrs`, the end of the attribute family's fold (AL2).
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const Node = relation(
  "Node",
  {
    ancestry: bits(Flag),
    at: drawn(natural),
    attributes: drawn(natural),
    attrs: accumulated(bits(AttributeSlot), Bits.of(AttributeSlot, [])),
    barredChildren: accumulated(natural, 0n),
    chars: Chars,
    charsAfter: accumulated(keyText, ""),
    charsWas: accumulated(keyText, ""),
    children: drawn(natural),
    countedChildren: accumulated(natural, 0n),
    document: uuid,
    elementChildren: accumulated(natural, 0n),
    elements: accumulated(natural, 0n),
    elementsWas: accumulated(natural, 0n),
    end: drawn(natural),
    governs: closedId(TypeName),
    id: uuid,
    kind: closedId(NodeKind),
    lastState: accumulated(closedId(Position), "0"),
    namespaces: drawn(natural),
    nearest: uuid,
    nearestKind: closedId(NodeKind),
    parent: uuid,
    parentAncestry: accumulated(bits(Flag), Bits.of(Flag, [])),
    parentGoverns: accumulated(closedId(TypeName), "none"),
    parentKind: accumulated(closedId(NodeKind), "document"),
    parentNearest: accumulated(uuid, nilUuid),
    parentNearestKind: accumulated(closedId(NodeKind), "document"),
    parentParentKind: accumulated(closedId(NodeKind), "document"),
    prefix: str.regex(prefixPattern),
    start: drawn(natural),
    state: closedId(Position),
    stringPiece: keyText,
    stringValue: accumulated(keyText, ""),
    version: closedId(SchemaVersion),
    was: accumulated(closedId(Position), "0"),
  },
  ["id"],
);

/**
 * A `Node` row as a row check or a selection reads it.
 */
type NodeRow = RowScalars<typeof Node>;

/**
 * State φ₀, a member of its parent's family: every row but the root, whose start is 0 (T2).
 *
 * The spelling is the tree's own member selection, `start > 0`, which a containment's member side
 * must state exactly to ride one of the tree's axes.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const member = (n: NodeRow) => n.gt(n.start, 0n);

/**
 * State that a row is an element: its kind is none of the seven kinds that are no element (C8).
 *
 * @param n - The row.
 * @returns The predicate.
 */
const element = (n: NodeRow) => n.not(n.in(n.kind, nonElementKinds));

/**
 * State that a row's kind has a content model: an element, or the document node. Every such
 * (version, kind) has a `ContentModelOf` model that ends somewhere in `Last`, and every other kind
 * holds no child.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const modeled = (n: NodeRow) => n.or(element(n), n.eq(n.kind, "document"));

/**
 * Read a member's position in its parent's content model, `ChildGrammar`'s cell: a position above
 * 0 where one particle names its kind, 0 for character data and for a kind several particles name,
 * and nothing where the parent does not admit the kind.
 *
 * @param n - The row.
 * @returns The closed read.
 */
const positionOf = (n: NodeRow) => ChildGrammar.at("position", n.version, n.parentKind, n.kind);

/**
 * State that a member steps its parent's automaton: an element, or character data a particle names,
 * as the document's doctype (position 1) and SSML's text in `ssml:speak` (spec reading 40) are.
 * Every other member is character data that carries its predecessor's state.
 *
 * The split is by position, not by kind, because `contentStep` steps every child whose position is
 * not 0, character data included.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const positioned = (n: NodeRow) => n.or(element(n), n.ne(positionOf(n), "0"));

/**
 * The value domains that check nothing: those whose pattern is `xs:anySimpleType`'s, every string
 * of XML characters, and that state no facet (`xs:anySimpleType` and `xs:normalizedString` at the
 * pinned grammar). A text under one of them can fail no TextDomain check, so it is never folded.
 */
export const universalDomains: readonly (typeof ValueDomain.handles)[number][] = (() => {
  const any = ValueDomainOf.rows.find(({ domain }) => domain === openDomain.handle)?.pattern;

  return ValueDomainOf.rows
    .filter(({ facets, pattern }) => pattern === any && facets === "")
    .map(({ domain }) => domain);
})();

/**
 * State that an element under its governor holds checked text: its `TextDomain` under
 * `GoverningOf`'s governor of (version, kind, governs) is none of {@link universalDomains}. Simple
 * content holds only character data, and a complex type's governor reads `xs:anySimpleType`
 * (`TextDomain` is total), so this is the element whose string value TextDomain judges.
 *
 * Q5.05's TextDomain check reads it over an element's own kind and type ({@link holdsCheckedText}),
 * and the string value's fold over a member's parent's (`parentKind`, `parentGoverns`), so the two
 * select one set of elements.
 *
 * @param n - The row.
 * @param kind - The element's kind: the row's own, or its parent's copy.
 * @param governs - The element's governing type: the row's own, or its parent's copy.
 * @returns The predicate.
 */
export const checkedText = (
  n: NodeRow,
  kind: NodeRow["kind"] | NodeRow["parentKind"],
  governs: NodeRow["governs"] | NodeRow["parentGoverns"],
) =>
  n.not(
    n.in(
      TextDomain.at("domain", n.version, GoverningOf.at("governor", n.version, kind, governs)),
      universalDomains,
    ),
  );

/**
 * State that a row is an element whose text TextDomain checks: {@link checkedText} of its own kind
 * and governing type.
 *
 * @param n - The row.
 * @returns The predicate.
 */
export const holdsCheckedText = (n: NodeRow) => checkedText(n, n.kind, n.governs);

/**
 * State that a member is a child of an element whose text TextDomain checks: {@link checkedText} of
 * its parent's copied kind and governing type, the fields the member carries.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const inCheckedText = (n: NodeRow) => checkedText(n, n.parentKind, n.parentGoverns);

/**
 * The simple-content kinds whose text an overlay copies though no TextDomain check reads it (their
 * domain is universal), so their string value is folded beside the checked kinds'. A copied kind
 * gets no TextDomain law from this list. Other slices add a kind through the orchestrator.
 *
 * - `lom:entry`: Q5.12's `lom-identifier` compares an item's LOM general identifier's entry with its
 *   identifier (reading 62).
 * - `lom:language`: Q5.07's identity overlay reads a resource's LOM language set.
 * - `qti-value`: Q5.08's declaration overlay checks its lexical form against its declaration's base
 *   type (C1, O2), not against its governing type.
 * - `qti-base-value`: Q5.10's expression overlay checks a literal's lexical form against its own base
 *   type (O4).
 * - `ud:value`: Q5.12's metadata overlay checks a usage statistic's value against the base type its
 *   `baseType` names (O6, spec reading 97), not against its governing type's
 *   `xs:normalizedString`.
 */
export const copiedTextKinds = [
  "lom:entry",
  "lom:language",
  "qti-value",
  "qti-base-value",
  "ud:value",
] as const satisfies readonly (typeof NodeKind.handles)[number][];

/**
 * State that a member is a child of a LOM title's string, whose text Q5.12's `lom-title` copies
 * (spec reading 62, QTI 3.0 Metadata §2.7.1.2): its parent is a `lom:string` and its grandparent a
 * `lom:title`. A `lom:string` under a description, a keyword or any other LangString is not
 * folded, since nothing reads its text and a description runs past `keyText`'s bound (723 and 967
 * code points in the corpus's `maxfiles`).
 *
 * @param n - The row.
 * @returns The predicate.
 */
export const copiedTitleText = (n: NodeRow) =>
  n.and(n.eq(n.parentKind, "lom:string"), n.eq(n.parentParentKind, "lom:title"));

/**
 * State that a member's characters make its parent's string value: it is a member, and its parent's
 * text is checked ({@link inCheckedText}) or copied ({@link copiedTextKinds},
 * {@link copiedTitleText}). The string value's fold steps these rows, and `E1_derived` gives
 * exactly these a `stringPiece`.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const inStringValue = (n: NodeRow) =>
  n.and(member(n), n.or(inCheckedText(n), n.in(n.parentKind, copiedTextKinds), copiedTitleText(n)));

/**
 * State that a foreign element is governed by a simple type: its governor under `GoverningOf` is
 * the (kind, type) pair, not its kind. `GoverningOf` gives a foreign kind under a type its pair
 * exactly where the grammar's `Governor` holds one, every named simple type of the leaf and no
 * complex one (`compose.ts`, `governedOf`), and the kind itself under every other type, `none`
 * included, so a foreign kind's own handle as its governor is the type's absence or its complex
 * content (spec readings 50 and 60).
 *
 * @param n - The row, of a foreign kind.
 * @returns The predicate.
 */
const simplyGoverned = (n: NodeRow) =>
  n.not(n.in(GoverningOf.at("governor", n.version, n.kind, n.governs), openElementClasses));

/**
 * The tree of every document's nodes, its root the document node (N2, N9 to N11; trees.md §5).
 *
 * Grizzle states its family over the members (φ₀), its intervals, T0 to T6 and the root pin.
 */
export const nodeTree = tree(on(Node, "parent", "at"), fin(Node, "children"), {
  root: "document",
});

/**
 * The tree's members, every row but each document's root: the member side of every containment
 * that rides one of the tree's axes.
 */
const members = select(Node, member);

/**
 * The one tuple of a node every overlay copies (C18): its id, document, kind, start, nearest
 * interaction, version and parent. Each overlay's containment into it shares one superkey UNIQUE on
 * `Node`, so an overlay carries all seven, whichever it reads.
 */
export const nodeRef = on(Node, "id", "document", "kind", "start", "nearest", "version", "parent");

/**
 * A node's context (spec readings 76 and 110): the fields the tree's owner axis copies to its
 * children, with its id, children, document and start. It is exactly the column set the owner
 * axis's foreign key targets, so a containment into it shares that UNIQUE on `Node` and adds no
 * index: a document's `Document` row states its document node's context through it, and an
 * include's site copies the include's ancestry and nearest interaction through it.
 */
export const nodeContext = on(
  Node,
  "id",
  "children",
  "ancestry",
  "document",
  "governs",
  "kind",
  "nearest",
  "nearestKind",
  "parentKind",
  "start",
  "version",
);

/**
 * A node's element counts (C18): the elements before and including it among its siblings, and its
 * own element children, which the default hotspot's last-slot law compares (Q5.09).
 */
export const nodeCounts = on(Node, "id", "elements", "elementChildren");

/**
 * The elements fold (Q4.01's hand-off): each member element counts once, so `elements` is its
 * element rank among its siblings, 1-based, and its parent's `elementChildren` its element count.
 */
const elementsFold = fold(
  nodeTree,
  Monoid.count,
  on(
    select(Node, (n) => n.and(member(n), element(n))),
    "parent",
    "elementsWas",
    "elements",
  ),
  on(Node, "id", "elementChildren"),
);

/**
 * The counted position's fold (N7, C15): the element children at the one position of their parent's
 * model whose count `CountedOf` bounds beside the automaton.
 */
const countedFold = fold(
  nodeTree,
  Monoid.count,
  on(
    select(Node, (n) =>
      n.and(
        member(n),
        element(n),
        n.eq(n.state, CountedOf.at("position", n.version, n.parentKind)),
      ),
    ),
    "parent",
  ),
  on(Node, "id", "countedChildren"),
);

/**
 * The barred position's fold (N7, C15): the element children at the position `BarredOf` bars when
 * its parent carries the barring attribute.
 */
const barredFold = fold(
  nodeTree,
  Monoid.count,
  on(
    select(Node, (n) =>
      n.and(member(n), element(n), n.eq(n.state, BarredOf.at("position", n.version, n.parentKind))),
    ),
    "parent",
  ),
  on(Node, "id", "barredChildren"),
);

/**
 * The string value's fold: the characters of an element's children, in order, where TextDomain
 * checks that element's text or an overlay copies it ({@link inStringValue}), its `stringValue`
 * (XDM's string value of an element of simple content), which TextDomain judges (Q5.05) and the
 * overlays of {@link copiedTextKinds} copy. Comments and instructions add their empty `chars`. No
 * other element's children are stepped, so mixed content and text nothing reads store no running
 * prefixes.
 *
 * The running text rides the tree's predecessor and last axes, so it is a column of their keys, and
 * grizzle refuses a key whose B-tree entry can pass PostgreSQL's `BTMaxItemSize`
 * (`UnrepresentableKey`). So `charsWas`, `charsAfter` and `stringValue` are `keyText`
 * (`#pantry/qti/limits.ts`), and a folded string value past its bound is refused by that type's
 * pattern, by name: a stated limit of the representation (spec reading 60). A fold's step is of its
 * accumulators' type, so the step is `stringPiece`, a `keyText` copy of the child's `chars` that
 * `E1_derived` proves, never `chars` itself, whose text no key holds.
 */
const stringValueFold = fold(
  nodeTree,
  Monoid.concat,
  on(select(Node, inStringValue), "parent", "stringPiece", "charsWas", "charsAfter"),
  on(Node, "id", "stringValue"),
);

/**
 * Every statement over `Node` that Q5.03 owns, each `check` named by its oracle law: the tree, the
 * root's sentinel, the three axis copies, content order and its end, the counts beside the
 * automaton, ancestry, the nearest interaction and the governing type.
 *
 * - **N1:** the document node is the one row at start 0, its own document, at the automaton's start
 *   state and with no governing type, each of its parent copies its own field. grizzle pins no base
 *   of an owner-axis copy on a tree (`laws/model/plan.ts` `#pin`): the owner axis's foreign key,
 *   planned from the plain `parent`, holds the root to itself, which leaves `parentAncestry` free,
 *   since `Enters(document)` is empty (C10). So the root's copies and `state` are pinned here. Its
 *   ancestry and nearest interaction are its document's context (spec reading 110), which its
 *   `Document` row states through {@link nodeContext}: none and itself for every document but an
 *   included fragment, whose content is judged in the context its includes stand in.
 * - **N3:** the parent copies, riding the owner axis.
 * - **N5:** the predecessor copy, riding the predecessor axis; `N5_Follow`, one `Follow` bit of its
 *   parent's model (`ContentModelOf`) for every member that steps its parent's automaton, a row
 *   check, since a side names fields and the model is a closed read; and `N5_admitted`, which holds
 *   each member's state to its position: the one its kind's particle names, its predecessor's for
 *   character data no particle names, or one of `Symbol`'s for a kind several particles name. An
 *   unadmitted kind reads no position and is refused.
 * - **E1:** `ancestry` is `parentAncestry ∪ Enters(kind)`, only character data has characters, and
 *   `stringPiece` is a member's `chars` where its parent's text is checked or copied, empty
 *   elsewhere.
 * - **N6:** no banned flag above a node, and every flag it needs.
 * - **N7:** the last-slot copy, riding the last axis; `N7_Last`, its own model's `Last` holds every
 *   modeled node's last state; and the counted and barred positions' bounds, each on the owner,
 *   each vacuous where its position is 0.
 * - **N8:** a member's nearest interaction is its parent where the parent is one, else its parent's.
 * - **N12:** each vocabulary element's governing type is one its kind may name in `xsi:type`; a
 *   foreign element is assessed laxly and is selected out.
 * - **Foreign simple content** (C41, spec reading 60): a foreign element a simple type governs holds
 *   no element child (XML Schema 1.0 Part 1, §3.3.4, Element Locally Valid (Type), clause 3.1.2),
 *   its `elementChildren` the elements fold's end. Its attributes are AL1's under the governor and
 *   its text TextDomain's (Q5.05).
 *
 * "Strictly held" (C44, C13) reads the foreign element's expanded name, so it is `chardata.ts`'s,
 * over `OpenElementName`.
 */
export const nodeLaws = [
  nodeTree,
  check("N1_sentinel", Node, (n) =>
    n.or(
      n.and(member(n), n.ne(n.kind, "document")),
      n.and(
        n.eq(n.start, 0n),
        n.eq(n.kind, "document"),
        n.eq(n.document, n.id),
        n.eq(n.parentKind, n.kind),
        n.eq(n.parentGoverns, n.governs),
        n.eq(n.parentNearest, n.nearest),
        n.eq(n.parentNearestKind, n.nearestKind),
        n.eq(n.parentParentKind, n.parentKind),
        n.eq(n.state, "0"),
        n.eq(n.governs, "none"),
      ),
    ),
  ),
  contained(
    on(
      members,
      "parent",
      "version",
      "parentKind",
      "parentGoverns",
      "parentAncestry",
      "parentNearest",
      "parentNearestKind",
      "parentParentKind",
    ),
    on(
      Node,
      "id",
      "version",
      "kind",
      "governs",
      "ancestry",
      "nearest",
      "nearestKind",
      "parentKind",
    ),
  ),
  contained(on(members, "parent", pred("at"), "was"), on(members, "parent", "at", "state")),
  check("N5_Follow", Node, (n) =>
    n.or(
      n.not(member(n)),
      n.not(positioned(n)),
      n.eq(
        Compute.subset(
          PositionSelf.row(n.state),
          Follow.row(ContentModelOf.at("model", n.version, n.parentKind), n.was),
        ),
        true,
      ),
    ),
  ),
  check("N5_admitted", Node, (n) =>
    n.or(
      n.eq(n.start, 0n),
      n.and(n.ne(positionOf(n), "0"), n.eq(n.state, positionOf(n))),
      n.and(n.eq(positionOf(n), "0"), n.not(element(n)), n.eq(n.state, n.was)),
      n.and(
        n.eq(positionOf(n), "0"),
        element(n),
        n.eq(
          Compute.subset(
            PositionSelf.row(n.state),
            ContentSymbol.row(SharedModelOf.at("model", n.version, n.parentKind), n.kind),
          ),
          true,
        ),
      ),
    ),
  ),
  check("E1_derived", Node, (n) =>
    n.and(
      n.eq(n.ancestry, Compute.union(n.parentAncestry, Enters.row(n.kind))),
      n.or(n.in(n.kind, ["text", "ws", "entityRef"]), n.eq(n.chars, "")),
      n.or(
        n.and(inStringValue(n), n.eq(n.stringPiece, n.chars)),
        n.and(n.not(inStringValue(n)), n.eq(n.stringPiece, "")),
      ),
    ),
  ),
  check("N6_ancestry", Node, (n) =>
    n.and(
      n.eq(Compute.disjoint(n.parentAncestry, Banned.row(n.kind)), true),
      n.eq(Compute.subset(Needs.row(n.kind), n.parentAncestry), true),
    ),
  ),
  contained(on(Node, "id", pred("children"), "lastState"), on(members, "parent", "at", "state")),
  check("N7_Last", Node, (n) =>
    n.or(
      n.not(modeled(n)),
      n.eq(
        Compute.subset(
          PositionSelf.row(n.lastState),
          Last.row(ContentModelOf.at("model", n.version, n.kind)),
        ),
        true,
      ),
    ),
  ),
  elementsFold,
  countedFold,
  barredFold,
  check("N7_Counted", Node, (n) =>
    n.or(
      n.not(modeled(n)),
      n.eq(CountedOf.at("position", n.version, n.kind), "0"),
      n.between(
        n.countedChildren,
        CountedOf.at("min", n.version, n.kind),
        CountedOf.at("max", n.version, n.kind),
      ),
    ),
  ),
  check("N7_barred_by", Node, (n) =>
    n.or(
      n.not(modeled(n)),
      n.eq(BarredOf.at("position", n.version, n.kind), "0"),
      n.eq(Compute.disjoint(SlotSelf.row(BarredOf.at("slot", n.version, n.kind)), n.attrs), true),
      n.eq(n.barredChildren, 0n),
    ),
  ),
  stringValueFold,
  check("N8_nearest", Node, (n) =>
    n.or(
      n.eq(n.start, 0n),
      n.and(
        n.in(n.parentKind, interactionKinds),
        n.eq(n.nearest, n.parent),
        n.eq(n.nearestKind, n.parentKind),
      ),
      n.and(
        n.not(n.in(n.parentKind, interactionKinds)),
        n.eq(n.nearest, n.parentNearest),
        n.eq(n.nearestKind, n.parentNearestKind),
      ),
    ),
  ),
  contained(
    on(
      select(Node, (n) => n.and(element(n), n.not(n.in(n.kind, openElementClasses)))),
      "version",
      "kind",
      "governs",
    ),
    on(XsiType, "version", "kind", "type"),
  ),
  check("Foreign_simple_content", Node, (n) =>
    n.or(
      n.not(n.in(n.kind, openElementClasses)),
      n.not(simplyGoverned(n)),
      n.eq(n.elementChildren, 0n),
    ),
  ),
] as const;
