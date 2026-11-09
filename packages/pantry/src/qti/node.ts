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
 * - The owner axis carries the parent copies (N3): `version`, `kind`, `governor`, `ancestry`,
 *   `nearest`, `nearestKind` and `parentKind` into `version`, `parentKind`, `parentGovernor`,
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
  key,
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
  AnonymousType,
  AttributeSlot,
  Banned,
  BarredOf,
  Capped,
  ChildGrammar,
  ContentModelOf,
  CountedOf,
  DocumentType,
  Enters,
  Flag,
  FollowMember,
  FollowSetOf,
  GoverningOf,
  Governor,
  interactionKinds,
  KindGovernor,
  Last,
  Needs,
  NodeKind,
  nonElementKinds,
  openElementClasses,
  Position,
  SchemaVersion,
  SharedModelOf,
  Symbol as ContentSymbol,
  TextDomain,
  TypeName,
  ValueDomainOf,
  XsiType,
} from "#pantry/grammar/install.ts";
import type { ValueDomain } from "#pantry/grammar/install.ts";
import { keyText, prefixBytes } from "#pantry/qti/limits.ts";

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
 * An element's prefix as written: an NCName, or the empty string for an unprefixed name.
 * `Node.prefix` reads it at `prefixBytes` UTF-8 bytes (`#pantry/qti/limits.ts`), the bound of the
 * namespace declaration's prefix, whose key `Namespace(node, prefix)` holds it, so one language
 * holds both.
 */
const prefixPattern = `^(?:[${ncNameStart}][${ncNameContinuation}]*)?$`;

/**
 * The text type of an element's prefix: {@link prefixPattern} at `prefixBytes` UTF-8 bytes.
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const Prefix = str.bytes(prefixBytes, str.regex(prefixPattern));

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
 * The type of a node's first or last character: one code point, or the empty string where the
 * node holds no characters. A law can read a text's end only on the text's own row, since `chars`
 * is unbounded and fits no key; one code point fits every key, so the ends are what a law over a
 * node's neighbours compares (`#pantry/qti/quotation.ts`, spec reading 127). Exported for
 * `src/import/refusal.ts`, which names its pattern law.
 */
export const EndCharacter = str.regex("^.?$", "su");

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
 *   `version`, `documentType` (its document's type: `manifest` for the package's manifest, else the
 *   type of the resource that lists it; its document's `Document.documentType` at the root, its
 *   parent's below), `governor` (what its attributes and text are read under: its kind's own
 *   `Governor` handle where no named type governs it, else `GoverningOf`'s of its
 *   {@link ElementType} or `OpenElementType`), `prefix`, `nearest`, `nearestKind`, `state` (its
 *   content-automaton state, from `placedStep`), `ancestry` (`parentAncestry ∪ Enters(kind)`),
 *   `chars` (a text or whitespace node's characters, an entity reference's `&name;`, empty
 *   elsewhere: the string value fold's step), and `first` and `last` (the first and last code
 *   points of its `chars`, empty where `chars` is);
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
    documentType: closedId(DocumentType),
    elementChildren: accumulated(natural, 0n),
    elements: accumulated(natural, 0n),
    elementsWas: accumulated(natural, 0n),
    end: drawn(natural),
    first: EndCharacter,
    governor: closedId(Governor),
    id: uuid,
    kind: closedId(NodeKind),
    last: EndCharacter,
    lastState: accumulated(closedId(Position), "0"),
    namespaces: drawn(natural),
    nearest: uuid,
    nearestKind: closedId(NodeKind),
    parent: uuid,
    parentAncestry: accumulated(bits(Flag), Bits.of(Flag, [])),
    parentGovernor: accumulated(closedId(Governor), "document"),
    parentKind: accumulated(closedId(NodeKind), "document"),
    parentNearest: accumulated(uuid, nilUuid),
    parentNearestKind: accumulated(closedId(NodeKind), "document"),
    parentParentKind: accumulated(closedId(NodeKind), "document"),
    prefix: Prefix,
    start: drawn(natural),
    state: closedId(Position),
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
 * A vocabulary element's governing type, keyed by its node, where a named type governs it (XML
 * Schema 1.0 Part 1, §3.3.4, Element Locally Valid (Element), clause 4; spec reading 47): the type
 * its `xsi:type` names, else its declared type. An element of an anonymous declared type has none,
 * and so has a node that is no element; a foreign element's type is its `OpenElementType`
 * (`#pantry/qti/chardata.ts`).
 *
 * - **the host's:** `type`, the shred's reading of the element's `xsi:type` or its kind's declared
 *   type; and its node's `document`, `governor`, `kind` and `version`, copied through the `(id,
 *   kind, version, document, governor)` tuple the attribute and identity overlays copy too.
 */
export const ElementType = relation(
  "ElementType",
  {
    document: uuid,
    governor: closedId(Governor),
    kind: closedId(NodeKind),
    node: uuid,
    type: closedId(TypeName),
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * Read the governor a named type gives an element: `GoverningOf`'s of its (version, kind, type),
 * and its kind's own where `GoverningOf` holds no such triple, an `xsi:type` naming a type its
 * kind's declared type does not derive, which `XsiType derived` refuses. So it is the governor the
 * attribute grammar reads the element's attributes under (`#pantry/grammar/attributes.ts`
 * `governorOf`, its kind's own rows where it gives none). The row of the element's type, an
 * {@link ElementType} or a foreign element's `OpenElementType`, holds its governor to it.
 *
 * @param version - The element's version.
 * @param kind - Its kind.
 * @param type - Its governing type.
 * @returns The governor's term.
 */
export const typeGovernorOf = (
  version: Parameters<typeof GoverningOf.has>[0],
  kind: Parameters<typeof GoverningOf.has>[1],
  type: Parameters<typeof GoverningOf.has>[2],
) =>
  Compute.cond(
    GoverningOf.has(version, kind, type),
    GoverningOf.at("governor", version, kind, type),
    KindGovernor.at("governor", kind),
  );

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
 * State that a row is a vocabulary element: an element of no foreign kind, which a declaration
 * assesses strictly.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const vocabularyElement = (n: NodeRow) =>
  n.and(element(n), n.not(n.in(n.kind, openElementClasses)));

/**
 * State that a vocabulary element has a named governing type, its {@link ElementType}: its kind's
 * model declares a named type, so the element is governed by it or by one its `xsi:type` names. A
 * kind whose declared type is anonymous (`AnonymousType`) admits no named type, since none derives
 * from an anonymous one (spec reading 47).
 *
 * @param n - The row.
 * @returns The predicate.
 */
const namedlyTyped = (n: NodeRow) =>
  n.and(vocabularyElement(n), n.not(AnonymousType.has(n.version, n.kind)));

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
 * State that a member steps its parent's automaton: a kind its parent admits, and an element, or
 * character data a particle names, as the document's doctype (position 1) and SSML's text in
 * `ssml:speak` (spec reading 40) are. Every other admitted member is character data that carries
 * its predecessor's state.
 *
 * The split is by position, not by kind, because `placedStep` steps every child whose position is
 * not 0, character data included. A kind its parent does not admit steps nothing (`stepOf` is
 * none), and {@link positionOf} reads nothing there, so the `ChildGrammar.has` guard states that
 * false outright rather than leaving it unknown, which a check refuses (decision 440):
 * `N5_admitted` alone refuses such a member, as the oracle judges it.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const positioned = (n: NodeRow) =>
  n.and(
    ChildGrammar.has(n.version, n.parentKind, n.kind),
    n.or(element(n), n.ne(positionOf(n), "0")),
  );

/**
 * The value domains that check nothing: those whose pattern is `xs:anySimpleType`'s, every string
 * of XML characters (`xs:anySimpleType` and `xs:normalizedString` at the pinned grammar). No such
 * domain bounds a typed value, since a bound is a double's or a float's (`DoubleBound`), whose
 * pattern is its lexical space. A text under one of them can fail no TextDomain check, so it is
 * never folded.
 */
export const universalDomains: readonly (typeof ValueDomain.handles)[number][] = (() => {
  const any = ValueDomainOf.rows.find(({ domain }) => domain === openDomain.handle)?.pattern;

  return ValueDomainOf.rows.filter(({ pattern }) => pattern === any).map(({ domain }) => domain);
})();

/**
 * State that an element under its governor holds checked text: its governor has a `TextDomain`,
 * and it is none of {@link universalDomains}. Simple content holds only character data, and a
 * governor with no simple content has no `TextDomain` row, so this is the element whose string
 * value TextDomain judges.
 *
 * Q5.05's TextDomain check reads it over an element's own governor ({@link holdsCheckedText}), and
 * the string value's fold over a member's parent's (`parentGovernor`), so the two select one set of
 * elements.
 *
 * @param n - The row.
 * @param governor - The element's governor: the row's own, or its parent's copy.
 * @returns The predicate.
 */
export const checkedText = (
  n: NodeRow,
  governor: NodeRow["governor"] | NodeRow["parentGovernor"],
) =>
  n.and(
    TextDomain.has(n.version, governor),
    n.not(n.in(TextDomain.at("domain", n.version, governor), universalDomains)),
  );

/**
 * State that a row is an element whose text TextDomain checks: {@link checkedText} of its own
 * governor.
 *
 * @param n - The row.
 * @returns The predicate.
 */
export const holdsCheckedText = (n: NodeRow) => checkedText(n, n.governor);

/**
 * State that a member is a child of an element whose text TextDomain checks: {@link checkedText} of
 * its parent's copied governor, the field the member carries.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const inCheckedText = (n: NodeRow) => checkedText(n, n.parentGovernor);

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
 * - `qti-resource-icon`: the text census's `TextReference` reads an icon's string value as a file
 *   reference (spec reading R9-b); its type, `URLDType`, is an `xs:normalizedString`, so no
 *   TextDomain check reads it. A card's file is an `xs:anyURI`, which TextDomain checks, so it is
 *   folded already.
 * - `qti-base-value`: Q5.10's expression overlay checks a literal's lexical form against its own base
 *   type (O4).
 * - `ud:value`: Q5.12's metadata overlay checks a usage statistic's value against the base type its
 *   `baseType` names (O6, spec reading 105), not against its governing type's
 *   `xs:normalizedString`.
 */
export const copiedTextKinds = [
  "lom:entry",
  "lom:language",
  "qti-value",
  "qti-base-value",
  "qti-resource-icon",
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
 * The two terms of a LOM learning resource type, its vocabulary's `source` and its `value`, whose
 * text `lom-learning-resource-type` copies (spec reading 122, `#pantry/qti/metadata.ts`).
 */
export const vocabularyTermKinds = [
  "lom:source",
  "lom:value",
] as const satisfies readonly (typeof NodeKind.handles)[number][];

/**
 * State that a member is a child of a LOM learning resource type's term, whose text Q5.12's
 * `lom-learning-resource-type` copies (spec reading 122, QTI 3.0 Metadata §2.7.5.1): its parent is
 * a `lom:source` or a `lom:value` ({@link vocabularyTermKinds}) and its grandparent a
 * `lom:learningResourceType`. The terms of every other LOM vocabulary are not folded, since
 * nothing reads their text.
 *
 * @param n - The row.
 * @returns The predicate.
 */
export const copiedVocabularyText = (n: NodeRow) =>
  n.and(
    n.in(n.parentKind, vocabularyTermKinds),
    n.eq(n.parentParentKind, "lom:learningResourceType"),
  );

/**
 * State that a member's characters make its parent's string value: it is a member, and its parent's
 * text is checked ({@link inCheckedText}) or copied ({@link copiedTextKinds},
 * {@link copiedTitleText}, {@link copiedVocabularyText}). The string value's fold steps these rows'
 * `chars`.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const inStringValue = (n: NodeRow) =>
  n.and(
    member(n),
    n.or(
      inCheckedText(n),
      n.in(n.parentKind, copiedTextKinds),
      copiedTitleText(n),
      copiedVocabularyText(n),
    ),
  );

/**
 * State that a foreign element is governed by a simple type: its governor is the (kind, type)
 * pair, not its kind. `GoverningOf` gives a foreign kind under a type its pair exactly where the
 * grammar's `Governor` holds one, every named simple type of the leaf and no complex one
 * (`compose.ts`, `governedOf`), and the kind itself under every other type, and an element no type
 * governs is governed by its kind ({@link KindGovernor}), so a foreign kind's own handle as its
 * governor is the type's absence or its complex content (spec readings 50 and 60).
 *
 * @param n - The row, of a foreign kind.
 * @returns The predicate.
 */
const simplyGoverned = (n: NodeRow) => n.not(n.in(n.governor, openElementClasses));

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
 * that rides one of the tree's axes, and the side an overlay names a node by its parent and slot
 * through (`#pantry/qti/quotation.ts`). `(parent, at)` is a key of the members alone: the root is
 * its own parent at slot 0, as its first child is, so no key over every row of `Node` holds it.
 */
export const members = select(Node, member);

/**
 * The one tuple of a node every overlay copies (C18): its id, document, kind, start, nearest
 * interaction, version and parent. Each overlay's containment into it shares one superkey UNIQUE on
 * `Node`, so an overlay carries all seven, whichever it reads.
 */
export const nodeRef = on(Node, "id", "document", "kind", "start", "nearest", "version", "parent");

/**
 * A node's context (spec readings 85 and 117): the fields the tree's owner axis copies to its
 * children, with its id, children, document and start, and its document's type, which every node
 * of a document holds alike. It is exactly the columns the owner axis's foreign key targets, in the
 * order grizzle carries them, by their declared places (grizzle `85ec7ecf`), so a containment into
 * it shares that UNIQUE on `Node` and adds no index: an include's site copies the include's
 * ancestry and nearest interaction through it.
 */
export const nodeContext = on(
  Node,
  "id",
  "children",
  "start",
  "document",
  "ancestry",
  "documentType",
  "governor",
  "kind",
  "nearest",
  "nearestKind",
  "parentKind",
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
 * model whose count `CountedOf` bounds beside the automaton, none in a family `CountedOf` has no
 * row of.
 */
const countedFold = fold(
  nodeTree,
  Monoid.count,
  on(
    select(Node, (n) =>
      n.and(
        member(n),
        element(n),
        CountedOf.has(n.version, n.parentKind),
        n.eq(n.state, CountedOf.at("position", n.version, n.parentKind)),
      ),
    ),
    "parent",
  ),
  on(Node, "id", "countedChildren"),
);

/**
 * The element children at the positions `Capped` holds (N7, spec reading 130): a family's children
 * at a position its parent's model caps at one, which the key over `(parent, state)` holds to one
 * child each. A position names one kind alone where a reading caps it (`content.ts`, `cappedBy`),
 * so the key holds the kind to one child of the family.
 */
const cappedChildren = select(Node, (n) =>
  n.and(
    member(n),
    element(n),
    n.eq(Compute.subset(Compute.singleton(n.state), Capped.row(n.version, n.parentKind)), true),
  ),
);

/**
 * The barred position's fold (N7, C15): the element children at the position `BarredOf` bars when
 * its parent carries the barring attribute, none in a family `BarredOf` has no row of.
 */
const barredFold = fold(
  nodeTree,
  Monoid.count,
  on(
    select(Node, (n) =>
      n.and(
        member(n),
        element(n),
        BarredOf.has(n.version, n.parentKind),
        n.eq(n.state, BarredOf.at("position", n.version, n.parentKind)),
      ),
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
 * pattern, by name: a stated limit of the representation (spec reading 60). The step is the
 * member's own `chars`, unbounded text no key holds: a fold's accumulators are of its step's type
 * but for their own pattern and byte bound, and each one's domain refuses a running value outside
 * its own (grizzle's README, "Families", `fold`), so a member whose characters alone pass the bound
 * is refused by `charsAfter`'s.
 */
const stringValueFold = fold(
  nodeTree,
  Monoid.concat,
  on(select(Node, inStringValue), "parent", "chars", "charsWas", "charsAfter"),
  on(Node, "id", "stringValue"),
);

/**
 * Every statement over `Node` that Q5.03 owns, by the law each states, its name the law table's
 * (`#pantry/import/refusal.ts`), and each `check` named by its oracle law: the tree, the
 * root's sentinel, the three axis copies, content order and its end, the counts beside the
 * automaton, ancestry, the nearest interaction and the governing type.
 *
 * - **N1:** the document node is the one row at start 0, its own document, at the automaton's start
 *   state and governed by its own kind, each of its parent copies its own field. grizzle pins no
 *   base of an owner-axis copy on a tree (`laws/model/plan.ts` `#pin`): the owner axis's foreign
 *   key, planned from the plain `parent`, holds the root to itself, which leaves `parentAncestry`
 *   free, since `Enters(document)` is empty (C10). So the root's copies and `state` are pinned
 *   here. Its ancestry and nearest interaction are its document's context (spec reading 117), which
 *   its `Document` row states (`#pantry/qti/chardata.ts`): none and itself for every document but
 *   an included fragment, whose content is judged in the context its includes stand in.
 * - **N3:** the parent copies, riding the owner axis.
 * - **N5:** the predecessor copy, riding the predecessor axis; `N5_Follow`, one bit of its
 *   predecessor's follow set in its parent's model (`FollowMember` of `FollowSetOf`, under
 *   `ContentModelOf`) for every member that steps its parent's automaton, a row check, since a side
 *   names fields and the set is a closed read; and `N5_admitted`, which holds each member's state
 *   to its position: the one its kind's particle names, its predecessor's for character data no
 *   particle names, or one of `Symbol`'s for a kind several particles name. An unadmitted kind
 *   reads no position and is refused.
 * - **E1:** `ancestry` is `parentAncestry ∪ Enters(kind)`, only character data has characters,
 *   `first` and `last` are the first and last code points of `chars` (each one code point by its
 *   type, so `startsWith` and `endsWith` pin it), and both empty exactly where `chars` is; the
 *   string value's fold over the `chars` of the members whose parent's text is checked or copied;
 *   and `governor`: its kind's own (`KindGovernor`) on a node no named type governs, a node that is
 *   no element or a vocabulary element of an anonymous declared type, and on an {@link ElementType}
 *   the governor its type gives ({@link typeGovernorOf}), the row's copy of its node's. A foreign
 *   element's governor is `chardata.ts`'s, over its `OpenElementType`.
 * - **N6:** no banned flag above a node, and every flag it needs.
 * - **N7:** the last-slot copy, riding the last axis; `N7_Last`, its own model's `Last` holds every
 *   modeled node's last state; and the counted and barred positions' bounds, each on the owner,
 *   each vacuous where its position is 0.
 * - **N8:** a member's nearest interaction is its parent where the parent is one, else its parent's.
 * - **N12:** each vocabulary element whose kind declares a named type has an {@link ElementType}, and
 *   each type is one its kind may name in `xsi:type`; an element of an anonymous declared type has
 *   none, since its kind has no `XsiType` row; a foreign element is assessed laxly and is selected
 *   out.
 * - **Foreign simple content** (C41, spec reading 60): a foreign element a simple type governs holds
 *   no element child (XML Schema 1.0 Part 1, §3.3.4, Element Locally Valid (Type), clause 3.1.2),
 *   its `elementChildren` the elements fold's end. Its attributes are AL1's under the governor and
 *   its text TextDomain's (Q5.05).
 *
 * "Strictly held" (C44, C13) reads the foreign element's expanded name, so it is `chardata.ts`'s,
 * over `OpenElementName`.
 */
export const nodeLawsByName = {
  "E1 derived": [
    check("E1_derived", Node, (n) =>
      n.and(
        n.eq(n.ancestry, Compute.union(n.parentAncestry, Enters.row(n.kind))),
        n.or(
          n.eq(n.governor, KindGovernor.at("governor", n.kind)),
          n.in(n.kind, openElementClasses),
          namedlyTyped(n),
        ),
        n.or(n.in(n.kind, ["text", "ws", "entityRef"]), n.eq(n.chars, "")),
        n.or(
          n.and(n.eq(n.chars, ""), n.eq(n.first, ""), n.eq(n.last, "")),
          n.and(
            n.ne(n.first, ""),
            n.ne(n.last, ""),
            n.eq(Compute.startsWith(n.chars, n.first), true),
            n.eq(Compute.endsWith(n.chars, n.last), true),
          ),
        ),
      ),
    ),
    stringValueFold,
    contained(
      on(ElementType, "node", "kind", "version", "document", "governor"),
      on(Node, "id", "kind", "version", "document", "governor"),
    ),
    check("E1_derived", ElementType, (t) =>
      t.eq(t.governor, typeGovernorOf(t.version, t.kind, t.type)),
    ),
  ],
  "Foreign simple content": [
    check("Foreign_simple_content", Node, (n) =>
      n.or(
        n.not(n.in(n.kind, openElementClasses)),
        n.not(simplyGoverned(n)),
        n.eq(n.elementChildren, 0n),
      ),
    ),
  ],
  "N1 sentinel": [
    check("N1_sentinel", Node, (n) =>
      n.or(
        n.and(member(n), n.ne(n.kind, "document")),
        n.and(
          n.eq(n.start, 0n),
          n.eq(n.kind, "document"),
          n.eq(n.document, n.id),
          n.eq(n.parentKind, n.kind),
          n.eq(n.parentGovernor, n.governor),
          n.eq(n.parentNearest, n.nearest),
          n.eq(n.parentNearestKind, n.nearestKind),
          n.eq(n.parentParentKind, n.parentKind),
          n.eq(n.state, "0"),
          n.eq(n.governor, "document"),
        ),
      ),
    ),
  ],
  "N2 tree": [nodeTree],
  "N5 Follow": [
    check("N5_Follow", Node, (n) =>
      n.or(
        n.not(member(n)),
        n.not(positioned(n)),
        n.eq(
          Compute.subset(
            Compute.singleton(n.state),
            FollowMember.row(
              FollowSetOf.at("set", ContentModelOf.at("model", n.version, n.parentKind), n.was),
            ),
          ),
          true,
        ),
      ),
    ),
  ],
  "N5 admitted": [
    check("N5_admitted", Node, (n) =>
      n.or(
        n.eq(n.start, 0n),
        n.and(n.ne(positionOf(n), "0"), n.eq(n.state, positionOf(n))),
        n.and(n.eq(positionOf(n), "0"), n.not(element(n)), n.eq(n.state, n.was)),
        n.and(
          n.eq(positionOf(n), "0"),
          element(n),
          SharedModelOf.has(n.version, n.parentKind),
          n.eq(
            Compute.subset(
              Compute.singleton(n.state),
              ContentSymbol.row(SharedModelOf.at("model", n.version, n.parentKind), n.kind),
            ),
            true,
          ),
        ),
      ),
    ),
  ],
  "N5 fold": [
    contained(on(members, "parent", pred("at"), "was"), on(members, "parent", "at", "state")),
    elementsFold,
  ],
  "N6 ancestry": [
    check("N6_ancestry", Node, (n) =>
      n.and(
        n.eq(Compute.disjoint(n.parentAncestry, Banned.row(n.kind)), true),
        n.eq(Compute.subset(Needs.row(n.kind), n.parentAncestry), true),
      ),
    ),
  ],
  "N7 Counted": [
    countedFold,
    check("N7_Counted", Node, (n) =>
      n.or(
        n.not(modeled(n)),
        n.not(CountedOf.has(n.version, n.kind)),
        n.between(
          n.countedChildren,
          CountedOf.at("min", n.version, n.kind),
          CountedOf.at("max", n.version, n.kind),
        ),
      ),
    ),
    key(on(cappedChildren, "parent", "state")),
  ],
  "N7 Last": [
    check("N7_Last", Node, (n) =>
      n.or(
        n.not(modeled(n)),
        n.eq(
          Compute.subset(
            Compute.singleton(n.lastState),
            Last.row(ContentModelOf.at("model", n.version, n.kind)),
          ),
          true,
        ),
      ),
    ),
  ],
  "N7 barred by": [
    barredFold,
    check("N7_barred_by", Node, (n) =>
      n.or(
        n.not(modeled(n)),
        n.not(BarredOf.has(n.version, n.kind)),
        n.eq(
          Compute.disjoint(Compute.singleton(BarredOf.at("slot", n.version, n.kind)), n.attrs),
          true,
        ),
        n.eq(n.barredChildren, 0n),
      ),
    ),
  ],
  "N7 last slot": [
    contained(on(Node, "id", pred("children"), "lastState"), on(members, "parent", "at", "state")),
  ],
  "N8 nearest": [
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
  ],
  "T3 first child": [
    contained(
      on(
        members,
        "parent",
        "version",
        "documentType",
        "parentKind",
        "parentGovernor",
        "parentAncestry",
        "parentNearest",
        "parentNearestKind",
        "parentParentKind",
      ),
      on(
        Node,
        "id",
        "version",
        "documentType",
        "kind",
        "governor",
        "ancestry",
        "nearest",
        "nearestKind",
        "parentKind",
      ),
    ),
  ],
  "XsiType derived": [
    contained(on(select(Node, namedlyTyped), "id"), on(ElementType, "node")),
    contained(on(ElementType, "version", "kind", "type"), on(XsiType, "version", "kind", "type")),
  ],
} as const;

/**
 * Every statement over `Node` that Q5.03 owns, {@link nodeLawsByName}'s statements in one list.
 */
export const nodeLaws = Object.values(nodeLawsByName).flat();
