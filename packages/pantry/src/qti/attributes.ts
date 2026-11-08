/**
 * Uniform attributes: every attribute of every element as one `Attribute` row, an ordered family
 * under its element in source order, with its open name, its IDREF tokens and its unexpanded entity
 * references as ordered families under it, and the laws over them (plan §1.5; fin.md §16; the W5
 * amendment's C1, C3, C6, C7, C9, C14, C18 and C21, with the orchestrator's rulings of 2026-11-06).
 *
 * An attribute is read under its element's governor, `GoverningOf(version, kind, governs)`: the
 * kind itself where its declared type governs it, or the (kind, type) pair where an `xsi:type`
 * names a type derived from the declared one, or a simple type governs a foreign element (spec
 * readings 60, 83 and 84). The governor's attribute model, `AttributeModelOf(version, governor)`,
 * then gives the name's slot, `AttributeSlotOf(model, name)`, and the slot its value domain and
 * use, `AttributeGrammar(model, slot)`. `Attribute` copies `kind`, `version`, `document` and
 * `governs` from its element along the family's owner axis, so every law below reads its governor
 * inline.
 *
 * - **AL1, admission** (`AL1_admission`, rule `attribute-admission`): the name is one its element's
 *   governor admits, `{name} ⊆ AttributeSlotOf.row(model)`, with `{name}` the name's
 *   `Compute.singleton`. It is a named check, not a generated column's NOT NULL: the governor it
 *   reads is `version`, `kind` and `governs`, accumulated copies, and a generated field's term
 *   reads only the fields its caller writes (grizzle's README, "How a field is written"). An
 *   unadmitted name is refused `invariant-rejected` on the check's own law.
 * - **AL1, the lexical half** (`value_domain`, rule `attribute-lexical`): the lexical form as written
 *   matches its domain's compiled pattern, `ValueDomainOf.at("pattern", domain)`, through grizzle's
 *   `Compute.matches`. A universal domain, whose pattern admits every value (`universalDomains` of
 *   `#pantry/qti/node.ts`: `xs:anySimpleType`, and `xs:normalizedString` as written), states
 *   nothing and is not matched, so the backend's 32-entry regex cache holds only the patterns that
 *   judge something. An empty domain (`emptyDomains` of `#pantry/grammar/install.ts`: today
 *   `xs:NOTATION`'s, whose value space is the notations a schema declares, and no pinned XSD
 *   declares one, XML Schema 1.0 Part 2 §3.2.19) holds no value, so a value in one is refused by
 *   the domain's identity: grizzle refuses a pattern whose language is empty
 *   (`scalar/regex/admit.ts:98-102`, `matchPattern`), so the domain has no pattern to match (C47).
 * - **AL2** (C9): `slot` is the singleton of the name's slot, `Compute.singleton(slot)`. It is
 *   written by the host and proved by `E1_derived`, because a generated field reads the caller's
 *   fields alone and `version`, `kind` and `governs` are copies. The `or` fold over the family,
 *   whose step selection leaves the open classes out, ends in `Node.attrs`, and `AL2_distinct` is
 *   `attrsWas ∩ slot = ∅`. An open class is one slot for many names, and the selection keeps that
 *   slot out of every `attrsWas`, so two attributes of one class are no repeat with no mask (fin.md
 *   §16's `~open`), and C9's `in(name, openClasses)` disjunct would be redundant. grizzle emits the
 *   fold's slot-0 pin and its empty family's end.
 * - **AL3** (`AL3_required`, a check on `Node`): every slot the element's governor requires is in its
 *   `attrs`.
 * - **AL4** (C14): an open-class attribute has exactly one `OpenAttributeName`, a closed one none
 *   (`AL4_open_names`); open names are distinct by expanded name on an element (`key(node, uri,
 *   local)`); and `Foreign_attribute_class` holds each open name's stored namespace to its class
 *   against its element's namespace (XML Schema 1.0 Part 1 §3.10.4).
 * - **The prefix** (`Attribute_prefix`, C54): every attribute keeps the prefix its name is written
 *   with, so the export writes it back byte for byte (spec reading 47), and the prefix agrees with
 *   the namespace its name is in: none for a name in no namespace, `xml` for the XML namespace's,
 *   and a declared one, never `xml` or `xmlns`, for XML Schema's instance names, XLink's and the
 *   namespaced open classes (Namespaces in XML 1.0, §3 and §6.2). Whether the prefix is bound to
 *   that namespace in scope is not stated: no relation holds the bindings in scope at an element.
 * - **IDREF tokens** (C3, with grizzle's `Monoid.concat`): an IDREF or IDREFS attribute's `Idref`
 *   pieces, each a token with the whitespace written around it, concatenate to its lexical form,
 *   and each token after the first follows whitespace, so the tokens are exactly the lexical form's
 *   whitespace-separated tokens; every other attribute has none (`E1_derived`). `Idref target`
 *   (Q5.07) reads the tokens.
 * - **TextDomain** (a check on `Node`, rule `text-copy`): the string value of an element whose
 *   governor reads its text in a domain that is not universal, `Node.stringValue` (Q5.03's
 *   concatenation of its character data), matches that domain, which is not empty: a foreign
 *   element whose `xsi:type` names `xs:NOTATION` is refused whatever its text (spec reading 60). It
 *   is stated under Q5.03's own predicate, `holdsCheckedText`, the one its fold steps under, so the
 *   two cannot drift: a universal domain states nothing, and a checked value past `keyText`'s 660
 *   code points is refused by the fold's own accumulator type.
 *
 * Every check is named by its oracle law (`#pantry/test/oracle.ts` `LawName`) with spaces written
 * as underscores, since a check's name is an identifier; no law name holds an underscore.
 *
 * Coords by shape states nothing here beyond AL1's lexical half over `CoordsDType`: spec reading 59
 * reads coordinates that do not fit their shape by the HTML Standard's image-map processing model,
 * so they are valid (the orchestrator's ruling of 2026-11-06).
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
  generated,
  key,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import {
  AttributeGrammar,
  AttributeModelOf,
  AttributeName,
  AttributeSlot,
  AttributeSlotOf,
  boundedDomains,
  DoubleBound,
  emptyDomains,
  GoverningOf,
  KindNamespace,
  NodeKind,
  openElementClasses,
  Required,
  ResourceType,
  SchemaVersion,
  TextDomain,
  TypeName,
  ValueDomainOf,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import { handlePrefixes } from "#pantry/model/xdm.ts";
import { NamespacePrefix, OpenElementName } from "#pantry/qti/chardata.ts";
import { keyText, localNameBytes, namespaceText } from "#pantry/qti/limits.ts";
import { charsPattern, holdsCheckedText, Node, universalDomains } from "#pantry/qti/node.ts";

/**
 * XML 1.0's `Char` less its whitespace `S`, as the body of a character class.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const xmlNonSpace = "\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * An NCName's first character: XML 1.0's `NameStartChar` without the colon.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#NT-NCName | Namespaces in XML 1.0, NCName}
 */
const ncStart =
  "A-Z_a-z\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2FF}\\u{370}-\\u{37D}\\u{37F}-\\u{1FFF}\\u{200C}-\\u{200D}\\u{2070}-\\u{218F}\\u{2C00}-\\u{2FEF}\\u{3001}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFFD}\\u{10000}-\\u{EFFFF}";

/**
 * An NCName's later characters: XML 1.0's `NameChar` without the colon.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-NameChar | XML 1.0, NameChar}
 */
const ncChar = `\\-.0-9\\u{B7}\\u{300}-\\u{36F}\\u{203F}-\\u{2040}${ncStart}`;

/**
 * An attribute's lexical form, the record (U1): the value as attribute-value normalization leaves
 * it, each unexpanded entity reference kept as `&name;`, so any run of XML `Char`s, character
 * references to tabs and line breaks included. Its domain's pattern, not its type, judges it (AL1).
 * It is free text, in no key: a law that compares it across rows reads a bounded copy.
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const Lexical = str.regex(charsPattern);

/**
 * XML whitespace `S`, possibly none: what a lexical form holds around its token or value, an
 * `Idref` piece's and every other lead and trail of the schema, each typed by this one type.
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
export const Space = str.regex("^[\\t\\n\\r ]*$");

/**
 * A run of `Char`s holding no whitespace, unanchored: what an IDREF token is, which `E1_derived`
 * holds each `Idref.token` to. That it is an NCName follows from AL1's lexical half, since the
 * pieces concatenate to the lexical form.
 */
const nonSpacePattern = `^[${xmlNonSpace}]+$`;

/**
 * An open attribute's local name: an NCName of at most `localNameBytes` UTF-8 bytes
 * (`#pantry/qti/limits.ts`), the bound `(node, uri, local)` reads it at. Its pattern is read under
 * `su`, which reads an NCName exactly as `u` does (it holds no `.`), so its law, the byte bound's,
 * is no other type's: {@link EntityName} writes the same NCName under `u`, and a refusal names each
 * by its pattern. Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const OpenLocal = str.bytes(localNameBytes, str.regex(`^[${ncStart}][${ncChar}]*$`, "su"));

/**
 * An entity's name inside an attribute's lexical form: an NCName, since no entity name holds a
 * colon (Namespaces in XML 1.0, §7).
 * Exported for `src/import/refusal.ts`, which names its pattern law.
 */
export const EntityName = str.regex(`^[${ncStart}][${ncChar}]*$`);

/**
 * The nil uuid: the start of the owner-axis copy of `document`, which every member's owner
 * replaces.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * One attribute of an element, at its slot among the element's attributes in source order, which
 * keeps the attributes' order for byte fidelity.
 *
 * Its fields by how each is written:
 *
 * - **the host's:** `id`, `name` (an `AttributeName` handle, an open class's included), `prefix` (the
 *   prefix its name is written with, empty for none, of a declaration's type, since every prefix
 *   but `xml` is one a declaration in scope binds), `lexical` (the record) and `slot` (`{position}`
 *   of its name under its element's governor);
 * - **the family's group:** `node`, its element's id, which the nesting supplies;
 * - **drawn:** `at`, and the counts of its four families, `openName`, `idrefs`, `entities` and
 *   `doubleValue`;
 * - **accumulated** by grizzle: `kind`, `version`, `document`, `governs` and `documentType`, its
 *   element's, along the owner axis; `attrsWas` and `attrsAfter`, AL2's fold before and after this
 *   attribute; and `idrefText`, the end of its `Idref` pieces' concatenation.
 */
export const Attribute = relation(
  "Attribute",
  {
    at: drawn(natural),
    attrsAfter: accumulated(bits(AttributeSlot), Bits.of(AttributeSlot, [])),
    attrsWas: accumulated(bits(AttributeSlot), Bits.of(AttributeSlot, [])),
    document: accumulated(uuid, nilUuid),
    documentType: accumulated(closedId(ResourceType), "none"),
    doubleValue: drawn(natural),
    entities: drawn(natural),
    governs: accumulated(closedId(TypeName), "none"),
    id: uuid,
    idrefText: accumulated(keyText, ""),
    idrefs: drawn(natural),
    kind: accumulated(closedId(NodeKind), "document"),
    lexical: Lexical,
    name: closedId(AttributeName),
    node: uuid,
    openName: drawn(natural),
    prefix: NamespacePrefix,
    slot: bits(AttributeSlot),
    version: accumulated(closedId(SchemaVersion), "3.0.0"),
  },
  ["node", "id"],
);

/**
 * The exact name of an attribute under an open class (fin.md D2, C14): what its class leaves of
 * its name, an ordered family of at most one member under its `Attribute`.
 *
 * - **the host's:** `local` and `uri`, its local name and namespace name as written (an empty
 *   namespace for `data-*` and `no-namespace`), and `elementNamespace`, its element's namespace
 *   name, which the class is read against. Its prefix is its attribute's (`Attribute.prefix`);
 * - **the family's group:** `node` and `attribute`, its attribute's key;
 * - **drawn:** `at`, always 0;
 * - **accumulated** along the owner axis: `class`, its attribute's name (the open class), and `kind`,
 *   its element's kind.
 */
export const OpenAttributeName = relation(
  "OpenAttributeName",
  {
    at: drawn(natural),
    attribute: uuid,
    class: accumulated(closedId(AttributeName), "data-*"),
    elementNamespace: namespaceText,
    kind: accumulated(closedId(NodeKind), "document"),
    local: OpenLocal,
    node: uuid,
    uri: namespaceText,
  },
  ["node", "attribute", "at"],
);

/**
 * The typed value of an attribute whose domain bounds its value (`DoubleBound`), an ordered family
 * of at most one member under its `Attribute`: the IEEE double its lexical form maps to, which its
 * domain's bound judges, since whether a literal clears a bound turns on that rounding and no
 * pattern states it (XML Schema 1.1 Part 2, §3.3.5.2).
 *
 * - **the host's:** `value`, the double the import's reader of an attribute's or a text's double
 *   parses from the lexical form (`doubleOf` of `#pantry/import/write.ts`), written only where the
 *   form is in the domain's lexical space;
 * - **the family's group:** `node` and `attribute`, its attribute's key;
 * - **drawn:** `at`, always 0;
 * - **accumulated** along the owner axis: `governs`, `kind`, `name` and `version`, its attribute's,
 *   which read its domain.
 *
 * It holds a double's value for its bound alone. grizzle's `float8` has one zero: it writes -0 as 0
 * and reads -0 as +0 (`codec/scalar.ts` and `scalar/values/convert.ts` of grizzle-engine at the
 * vendored commit), so `-0` is stored as 0. No law reads a zero's sign: XML Schema orders -0 equal
 * to 0, so a bound judges them alike, and the lexical form keeps the sign for export.
 */
export const DoubleValue = relation(
  "DoubleValue",
  {
    at: drawn(natural),
    attribute: uuid,
    governs: accumulated(closedId(TypeName), "none"),
    kind: accumulated(closedId(NodeKind), "document"),
    name: accumulated(closedId(AttributeName), "data-*"),
    node: uuid,
    value: pg.float8,
    version: accumulated(closedId(SchemaVersion), "3.0.0"),
  },
  ["node", "attribute", "at"],
);

/**
 * The typed value of an element's text whose domain bounds its value (`DoubleBound`), the text an
 * `xsi:type` naming `NonNegativeDoubleDType` gives a foreign element: an ordered family of at most
 * one member under its `Node`, the text's twin of {@link DoubleValue}, held to the same bound law.
 *
 * - **the host's:** `value`, the double the import's reader of an attribute's or a text's double
 *   parses from the element's string value (`doubleOf` of `#pantry/import/write.ts`), written only
 *   where the string value is in the domain's lexical space;
 * - **the family's group:** `node`, its element's id;
 * - **drawn:** `at`, always 0;
 * - **accumulated** along the owner axis: `governs`, `kind` and `version`, its element's, which read
 *   its text's domain.
 *
 * Its value is a double's for its bound alone, -0 stored as 0 under grizzle's one-zero `float8`, as
 * {@link DoubleValue}'s is.
 */
export const TextDoubleValue = relation(
  "TextDoubleValue",
  {
    at: drawn(natural),
    governs: accumulated(closedId(TypeName), "none"),
    kind: accumulated(closedId(NodeKind), "document"),
    node: uuid,
    value: pg.float8,
    version: accumulated(closedId(SchemaVersion), "3.0.0"),
  },
  ["node", "at"],
);

/**
 * One IDREF token of an attribute whose domain is an `xs:IDREF` or `xs:IDREFS` (C3), in order, with
 * the whitespace written before and after it, so its `piece` is a stretch of the lexical form and
 * the pieces concatenate to it.
 *
 * `token`, and the concatenation's running values and end, are `keyText` (`#pantry/qti/limits.ts`):
 * `Idref target` (Q5.07) compares the token with a document's ids across rows, and the running
 * values ride the family's predecessor and last axes, each beside two uuids and a bigint in one
 * B-tree entry. So one bound serves every IDREF the schema holds, and an IDREFS value past it is
 * refused by the accumulator's type when grizzle fills the fold, a stated limit of the
 * representation.
 *
 * - **the host's:** `before`, `token` and `after`, from its split of the lexical form;
 * - **generated:** `piece`, `before ‖ token ‖ after`, the concatenation's step: a `keyText` whose
 *   domain refuses a piece past the bound, as grizzle's README states of a generated term of
 *   another pattern or byte bound than its field's ("How a field is written");
 * - **the family's group:** `node` and `attribute`;
 * - **drawn:** `at`;
 * - **accumulated:** `document`, its attribute's, along the owner axis, which `Idref target` reads
 *   (Q5.07); `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const Idref = relation.generated(
  "Idref",
  {
    after: Space,
    at: drawn(natural),
    attribute: uuid,
    before: Space,
    document: accumulated(uuid, nilUuid),
    node: uuid,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    token: keyText,
  },
  ["node", "attribute", "at"],
  (i) => ({
    piece: generated(keyText, Compute.concat(Compute.concat(i.before, i.token), i.after)),
  }),
);

/**
 * One unexpanded entity reference inside an attribute's lexical form, in offset order (plan §1.4):
 * the entity's name and the offset of its `&` in the lexical form, which keeps it as `&name;`.
 */
export const AttributeEntity = relation(
  "AttributeEntity",
  {
    at: drawn(natural),
    attribute: uuid,
    name: EntityName,
    node: uuid,
    offset: natural,
  },
  ["node", "attribute", "at"],
);

/**
 * Each element's attributes in source order, counted by `Node.attributes`.
 */
export const attributeFamily = ordered(on(Attribute, "node", "at"), fin(Node, "attributes"));

/**
 * Each open-class attribute's exact name, counted by `Attribute.openName`: one member for an open
 * class, none for a closed name (`AL4_open_names`).
 */
export const openNameFamily = ordered(
  on(OpenAttributeName, "node", "attribute", "at"),
  fin(Attribute, "openName"),
);

/**
 * Each IDREF or IDREFS attribute's tokens in order, counted by `Attribute.idrefs`.
 */
export const idrefFamily = ordered(on(Idref, "node", "attribute", "at"), fin(Attribute, "idrefs"));

/**
 * Each attribute's unexpanded entity references in offset order, counted by `Attribute.entities`.
 */
export const entityFamily = ordered(
  on(AttributeEntity, "node", "attribute", "at"),
  fin(Attribute, "entities"),
);

/**
 * Each bounded attribute's typed value, counted by `Attribute.doubleValue`: one member where the
 * attribute's domain is bounded and its lexical form is in the domain's lexical space, none
 * elsewhere (`Double_value`).
 */
export const doubleValueFamily = ordered(
  on(DoubleValue, "node", "attribute", "at"),
  fin(Attribute, "doubleValue"),
);

/**
 * Each bounded text's typed value, counted by `Node.doubleValue`: one member where the element's
 * text domain is bounded and its string value is in the domain's lexical space, none elsewhere
 * (`Double_value`).
 */
export const textDoubleValueFamily = ordered(
  on(TextDoubleValue, "node", "at"),
  fin(Node, "doubleValue"),
);

/**
 * Read the domain a typed text's element reads its text in, from the element's copies
 * (`TextDomain` under `GoverningOf`'s governor).
 *
 * @param t - The row.
 * @returns The closed read.
 */
const typedTextDomainOf = (t: RowScalars<typeof TextDoubleValue>) =>
  TextDomain.at("domain", t.version, GoverningOf.at("governor", t.version, t.kind, t.governs));

/**
 * An `Attribute` row as a row check or a selection reads it.
 */
type AttributeRow = RowScalars<typeof Attribute>;

/**
 * What an attribute's domain is read by: its name, and its element's version, kind and governing
 * type, which an `Attribute` row holds and a `DoubleValue` row copies.
 */
type NamedRow =
  | Pick<AttributeRow, "governs" | "kind" | "name" | "version">
  | Pick<RowScalars<typeof DoubleValue>, "governs" | "kind" | "name" | "version">;

/**
 * Read an attribute's governor: what its element reads its attributes by, under the element's
 * kind and governing type (`GoverningOf`, total on every lawful triple).
 *
 * @param a - The row.
 * @returns The closed read.
 */
const governorOf = (a: NamedRow) => GoverningOf.at("governor", a.version, a.kind, a.governs);

/**
 * Read an attribute's attribute model: its governor's in the version (`AttributeModelOf`, total).
 *
 * @param a - The row.
 * @returns The closed read.
 */
const attributeModelOf = (a: NamedRow) => AttributeModelOf.at("model", a.version, governorOf(a));

/**
 * Read an admitted attribute's slot under its element's governor (`AttributeSlotOf`).
 *
 * @param a - The row.
 * @returns The closed read, absent for an unadmitted name.
 */
const slotOf = (a: NamedRow) => AttributeSlotOf.at("slot", attributeModelOf(a), a.name);

/**
 * State that an attribute's name is one its element's governor admits: the singleton of the name
 * inside `AttributeSlotOf`'s row of names for the governor's model. It reads no NULL where the name
 * is unadmitted, so it is the admission law itself, not a closed read's absence.
 *
 * @param a - The row.
 * @returns The predicate.
 */
const admitted = (a: AttributeRow) =>
  a.eq(Compute.subset(Compute.singleton(a.name), AttributeSlotOf.row(attributeModelOf(a))), true);

/**
 * Read an admitted attribute's value domain under its element's governor.
 *
 * @param a - The row.
 * @returns The closed read, absent for an unadmitted name.
 */
const domainOf = (a: NamedRow) => AttributeGrammar.at("domain", attributeModelOf(a), slotOf(a));

/**
 * State that an attribute's name is an open class's.
 *
 * @param a - The row.
 * @returns The predicate.
 */
const open = (a: AttributeRow) => a.in(a.name, openClasses);

/**
 * State that an attribute's domain is an `xs:IDREF` or `xs:IDREFS` one, whose tokens are `Idref`
 * rows: its domain has a `ValueIdentity` row naming one of them. A domain of no identity has no
 * row, so the statement is false of it.
 *
 * @param a - The row.
 * @returns The predicate.
 */
const carriesIdrefs = (a: AttributeRow) =>
  a.and(
    ValueIdentity.has(domainOf(a)),
    a.in(ValueIdentity.at("identity", domainOf(a)), ["IDREF", "IDREFS"]),
  );

/**
 * The closed `AttributeName` handles whose names are in a namespace with a handle prefix
 * (`handlePrefixes` of `#pantry/model/xdm.ts`), by that prefix: a handle spells its namespace by
 * it.
 *
 * @param prefix - The handle prefix.
 * @returns The handles that begin with it and its colon.
 */
const handlesUnder = (prefix: (typeof handlePrefixes)[number]["prefix"]) =>
  AttributeName.handles.filter((handle) => handle.startsWith(`${prefix}:`));

/**
 * The names in the XML namespace, which is bound to `xml` and to no other prefix (Namespaces in XML
 * 1.0, §3): `xml.xsd`'s four.
 */
const xmlNames = handlesUnder("xml");

/**
 * The names in a namespace a document binds a prefix of its own choosing to: XML Schema's instance
 * names, XLink's, and the open classes of a name in a namespace, its element's or another.
 */
const boundNames = [
  ...handlePrefixes.flatMap(({ prefix }) => (prefix === "xml" ? [] : handlesUnder(prefix))),
  "own-namespace",
  "foreign",
] as const;

/**
 * The prefixes no attribute in a namespace other than the XML namespace is written with: none,
 * which leaves a name in no namespace (§6.2); `xml`, bound to the XML namespace alone; and `xmlns`,
 * which only declares a binding (Namespaces in XML 1.0, §3).
 */
const unboundPrefixes = ["", "xml", "xmlns"];

/**
 * A `Node` row as a row check reads it.
 */
type NodeRow = RowScalars<typeof Node>;

/**
 * Read an element's governor, as {@link governorOf} reads its attributes'.
 *
 * @param n - The row.
 * @returns The closed read.
 */
const nodeGovernorOf = (n: NodeRow) => GoverningOf.at("governor", n.version, n.kind, n.governs);

/**
 * Read the domain an element's governor reads its text in (`TextDomain`), absent for a governor
 * with no simple content, whose text no law reads in a domain ({@link holdsCheckedText} is false of
 * it).
 *
 * @param n - The row.
 * @returns The closed read.
 */
const textDomainOf = (n: NodeRow) => TextDomain.at("domain", n.version, nodeGovernorOf(n));

/**
 * Every statement over the attribute layer, each `check` named by its oracle law:
 *
 * - The four families;
 * - **AL1 owner:** an attribute's copy of its element's kind, version, document and governing type,
 *   riding `attributeFamily`'s owner axis; `OpenAttributeName`'s copies of its attribute's name and
 *   kind, and `Idref`'s of its document, riding their families' owner axes;
 * - **AL1** admission and its lexical half, **E1** the written slot and the IDREF tokens' agreement,
 *   **AL2** the fold and distinctness, **AL3** required, **AL4** open names, their key and the
 *   foreign attribute class, the prefix, and **TextDomain**, as the module's header states them.
 */
export const attributeLawsByName = {
  "AL1 admission": [check("AL1_admission", Attribute, admitted)],
  "AL1 owner": [
    contained(
      on(Attribute, "node", "kind", "version", "document", "governs", "documentType"),
      on(Node, "id", "kind", "version", "document", "governs", "documentType"),
    ),
    contained(
      on(OpenAttributeName, "node", "attribute", "class", "kind"),
      on(Attribute, "node", "id", "name", "kind"),
    ),
    contained(on(Idref, "node", "attribute", "document"), on(Attribute, "node", "id", "document")),
    contained(
      on(DoubleValue, "node", "attribute", "governs", "kind", "name", "version"),
      on(Attribute, "node", "id", "governs", "kind", "name", "version"),
    ),
    contained(
      on(TextDoubleValue, "node", "governs", "kind", "version"),
      on(Node, "id", "governs", "kind", "version"),
    ),
  ],
  "AL2 count": [attributeFamily],
  "AL2 distinct": [
    check("AL2_distinct", Attribute, (a) => a.eq(Compute.disjoint(a.attrsWas, a.slot), true)),
  ],
  "AL2 fold": [
    fold(
      attributeFamily,
      Monoid.or,
      on(
        select(Attribute, (a) => a.not(open(a))),
        "node",
        "slot",
        "attrsWas",
        "attrsAfter",
      ),
      on(Node, "id", "attrs"),
    ),
  ],
  "AL3 required": [
    check("AL3_required", Node, (n) =>
      n.eq(
        Compute.subset(
          Required.row(AttributeModelOf.at("model", n.version, nodeGovernorOf(n))),
          n.attrs,
        ),
        true,
      ),
    ),
  ],
  "AL4 open name key": [key(on(OpenAttributeName, "node", "uri", "local"))],
  "AL4 open names": [
    openNameFamily,
    check("AL4_open_names", Attribute, (a) =>
      a.or(a.and(open(a), a.eq(a.openName, 1n)), a.and(a.not(open(a)), a.eq(a.openName, 0n))),
    ),
  ],
  "Attribute prefix": [
    check("Attribute_prefix", Attribute, (a) =>
      a.or(
        a.and(a.in(a.name, xmlNames), a.eq(a.prefix, "xml")),
        a.and(a.in(a.name, boundNames), a.not(a.in(a.prefix, unboundPrefixes))),
        a.and(a.not(a.in(a.name, [...xmlNames, ...boundNames])), a.eq(a.prefix, "")),
      ),
    ),
  ],
  "AttributeEntity owner": [entityFamily],
  "Double bound": [
    check("Double_bound", DoubleValue, (d) =>
      d.or(
        d.and(
          d.eq(DoubleBound.at("facet", domainOf(d)), "minInclusive"),
          d.ge(d.value, DoubleBound.at("value", domainOf(d))),
        ),
        d.and(
          d.eq(DoubleBound.at("facet", domainOf(d)), "minExclusive"),
          d.gt(d.value, DoubleBound.at("value", domainOf(d))),
        ),
      ),
    ),
    check("Double_bound", TextDoubleValue, (t) =>
      t.or(
        t.and(
          t.eq(DoubleBound.at("facet", typedTextDomainOf(t)), "minInclusive"),
          t.ge(t.value, DoubleBound.at("value", typedTextDomainOf(t))),
        ),
        t.and(
          t.eq(DoubleBound.at("facet", typedTextDomainOf(t)), "minExclusive"),
          t.gt(t.value, DoubleBound.at("value", typedTextDomainOf(t))),
        ),
      ),
    ),
  ],
  "Double value": [
    doubleValueFamily,
    check("Double_value", Attribute, (a) => {
      const typed = a.and(
        admitted(a),
        a.in(domainOf(a), boundedDomains),
        Compute.matches(a.lexical, ValueDomainOf.at("pattern", domainOf(a))),
      );

      return a.or(
        a.and(typed, a.eq(a.doubleValue, 1n)),
        a.and(a.not(typed), a.eq(a.doubleValue, 0n)),
      );
    }),
    textDoubleValueFamily,
    check("Double_value", Node, (n) => {
      const typed = n.and(
        holdsCheckedText(n),
        n.in(textDomainOf(n), boundedDomains),
        Compute.matches(n.stringValue, ValueDomainOf.at("pattern", textDomainOf(n))),
      );

      return n.or(
        n.and(typed, n.eq(n.doubleValue, 1n)),
        n.and(n.not(typed), n.eq(n.doubleValue, 0n)),
      );
    }),
  ],
  "E1 derived": [
    idrefFamily,
    check("E1_derived", Attribute, (a) =>
      a.or(
        a.not(admitted(a)),
        a.and(
          a.eq(a.slot, Compute.singleton(slotOf(a))),
          a.or(
            a.and(carriesIdrefs(a), a.eq(a.lexical, a.idrefText)),
            a.and(a.not(carriesIdrefs(a)), a.eq(a.idrefs, 0n)),
          ),
        ),
      ),
    ),
    fold(
      idrefFamily,
      Monoid.concat,
      on(Idref, "node", "attribute", "piece", "piecesWas", "piecesAfter"),
      on(Attribute, "node", "id", "idrefText"),
    ),
    check("E1_derived", Idref, (i) =>
      i.and(Compute.matches(i.token, nonSpacePattern), i.or(i.eq(i.at, 0n), i.ne(i.before, ""))),
    ),
  ],
  "Foreign attribute class": [
    check("Foreign_attribute_class", OpenAttributeName, (o) =>
      o.and(
        o.or(
          o.and(o.in(o.class, ["data-*", "no-namespace"]), o.eq(o.uri, "")),
          o.and(o.eq(o.class, "own-namespace"), o.ne(o.uri, ""), o.eq(o.uri, o.elementNamespace)),
          o.and(o.eq(o.class, "foreign"), o.ne(o.uri, ""), o.ne(o.uri, o.elementNamespace)),
        ),
        o.or(
          o.in(o.kind, openElementClasses),
          o.eq(o.elementNamespace, KindNamespace.at("namespace", o.kind)),
        ),
      ),
    ),
    contained(
      on(
        select(OpenAttributeName, (o) => o.in(o.kind, openElementClasses)),
        "node",
        "elementNamespace",
      ),
      on(OpenElementName, "node", "namespace"),
    ),
  ],
  TextDomain: [
    check("TextDomain", Node, (n) =>
      n.or(
        n.not(holdsCheckedText(n)),
        n.and(
          n.not(n.in(textDomainOf(n), emptyDomains)),
          Compute.matches(n.stringValue, ValueDomainOf.at("pattern", textDomainOf(n))),
        ),
      ),
    ),
  ],
  "value domain": [
    check("value_domain", Attribute, (a) =>
      a.or(
        a.not(admitted(a)),
        a.in(domainOf(a), universalDomains),
        a.and(
          a.not(a.in(domainOf(a), emptyDomains)),
          Compute.matches(a.lexical, ValueDomainOf.at("pattern", domainOf(a))),
        ),
      ),
    ),
  ],
} as const;

/**
 * {@link attributeLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const attributeLaws = Object.values(attributeLawsByName).flat();
