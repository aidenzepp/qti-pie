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
 *   governor admits, `{name} ⊆ AttributeSlotOf.row(model)` through the diagonal
 *   `AttributeNameSelf`. It is a named check, not a generated column's NOT NULL: PostgreSQL reports
 *   a NULL in a NOT NULL column as 23502, which names no law of the installation, so grizzle would
 *   answer an unadmitted name with `ExecutionFailure` rather than `invariant-rejected`.
 * - **AL1, the lexical half** (`value_domain`, rule `attribute-lexical`): the lexical form as written
 *   matches its domain's compiled pattern, `ValueDomainOf.at("pattern", domain)`, through grizzle's
 *   `Compute.matches`. A universal domain, whose pattern admits every value (`universalDomains` of
 *   `#pantry/qti/node.ts`: `xs:anySimpleType`, and `xs:normalizedString` as written), states
 *   nothing and is not matched, so the backend's 32-entry regex cache holds only the patterns that
 *   judge something. An empty domain (`emptyDomains` of `#pantry/grammar/install.ts`: today
 *   `xs:NOTATION`'s, whose value space is the notations a schema declares, and no pinned XSD
 *   declares one, XML Schema 1.0 Part 2 §3.2.19) holds no value, so a value in one is refused by
 *   the domain's identity: grizzle refuses a pattern whose language is empty
 *   (`scalar/regex/admit.ts:121`), so the domain has no pattern to match (C47).
 * - **AL2** (C9): `slot` is the singleton of the name's slot, `SlotSelf.row(position)` (C6). It is
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
 *   against its element's namespace (XML Schema 1.0 Part 1 §3.10.4); and `AL4_data_name` holds a
 *   `data-*` name to reading 13's language (`dataName` of `#pantry/vocab/open.ts`, matched by its
 *   source) and a no-namespace name of an element that is not foreign to not begin `data-`; and
 *   `AL4_declared_data_name` keeps a `data-*` name from being a custom one where the element's
 *   governor admits it as a declared attribute (goal part E): a declared name is its closed
 *   attribute, never an open name beside or instead of it. An element an `xsi:type` governs is
 *   judged by the governor its kind and `governs` read.
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
  key,
  Monoid,
  natural,
  on,
  ordered,
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
  AttributeNameSelf,
  AttributeSlot,
  AttributeSlotOf,
  emptyDomains,
  GoverningOf,
  KindNamespace,
  NodeKind,
  openElementClasses,
  Required,
  ResourceType,
  SchemaVersion,
  SlotSelf,
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
import { dataName } from "#pantry/vocab/open.ts";

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
 * XML whitespace `S`, possibly none: what an `Idref` piece holds around its token.
 * Exported for `src/import/refusal.ts`, which names its pattern law.
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
 * - **drawn:** `at`, and the counts of its three families, `openName`, `idrefs` and `entities`;
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
 * - **accumulated** along the owner axis: `class`, its attribute's name (the open class), and its
 *   element's `kind`, `version` and `governs`, which `AL4_declared_data_name` reads its governor
 *   by.
 */
export const OpenAttributeName = relation(
  "OpenAttributeName",
  {
    at: drawn(natural),
    attribute: uuid,
    class: accumulated(closedId(AttributeName), "data-*"),
    elementNamespace: namespaceText,
    governs: accumulated(closedId(TypeName), "none"),
    kind: accumulated(closedId(NodeKind), "document"),
    local: OpenLocal,
    node: uuid,
    uri: namespaceText,
    version: accumulated(closedId(SchemaVersion), "3.0.0"),
  },
  ["node", "attribute", "at"],
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
 * - **the host's:** `before`, `token` and `after`, from its split of the lexical form, and `piece`,
 *   `before ‖ token ‖ after`, which `E1_derived` proves. It is written, not generated, because a
 *   concat fold's accumulators are of its step's type exactly (grizzle's `check/fold.ts`
 *   `foldRule`), and a generated `‖` is text of no pattern, which no bound could then carry;
 * - **the family's group:** `node` and `attribute`;
 * - **drawn:** `at`;
 * - **accumulated:** `document`, its attribute's, along the owner axis, which `Idref target` reads
 *   (Q5.07); `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const Idref = relation(
  "Idref",
  {
    after: Space,
    at: drawn(natural),
    attribute: uuid,
    before: Space,
    document: accumulated(uuid, nilUuid),
    node: uuid,
    piece: keyText,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    token: keyText,
  },
  ["node", "attribute", "at"],
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
 * The data- names the schemas declare as closed attributes: every `AttributeName` handle that
 * begins `data-`, but the open class `data-*`.
 */
const declaredDataNames = AttributeName.handles.filter(
  (name) => name.startsWith("data-") && name !== "data-*",
);

/**
 * An `Attribute` row as a row check or a selection reads it.
 */
type AttributeRow = RowScalars<typeof Attribute>;

/**
 * Read an attribute's governor: what its element reads its attributes by, under the element's
 * kind and governing type (`GoverningOf`, total on every lawful triple).
 *
 * @param a - The row.
 * @returns The closed read.
 */
const governorOf = (a: AttributeRow) => GoverningOf.at("governor", a.version, a.kind, a.governs);

/**
 * Read an attribute's attribute model: its governor's in the version (`AttributeModelOf`, total).
 *
 * @param a - The row.
 * @returns The closed read.
 */
const attributeModelOf = (a: AttributeRow) =>
  AttributeModelOf.at("model", a.version, governorOf(a));

/**
 * Read an admitted attribute's slot under its element's governor (`AttributeSlotOf`).
 *
 * @param a - The row.
 * @returns The closed read, absent for an unadmitted name.
 */
const slotOf = (a: AttributeRow) => AttributeSlotOf.at("slot", attributeModelOf(a), a.name);

/**
 * State that an attribute's name is one its element's governor admits: the singleton of the name
 * inside `AttributeSlotOf`'s row of names for the governor's model. It reads no NULL where the name
 * is unadmitted, so it is the admission law itself, not a closed read's absence.
 *
 * @param a - The row.
 * @returns The predicate.
 */
const admitted = (a: AttributeRow) =>
  a.eq(
    Compute.subset(AttributeNameSelf.row(a.name), AttributeSlotOf.row(attributeModelOf(a))),
    true,
  );

/**
 * Read an admitted attribute's value domain under its element's governor.
 *
 * @param a - The row.
 * @returns The closed read, absent for an unadmitted name.
 */
const domainOf = (a: AttributeRow) => AttributeGrammar.at("domain", attributeModelOf(a), slotOf(a));

/**
 * State that an attribute's name is an open class's.
 *
 * @param a - The row.
 * @returns The predicate.
 */
const open = (a: AttributeRow) => a.in(a.name, openClasses);

/**
 * State that an attribute's domain is an `xs:IDREF` or `xs:IDREFS` one, whose tokens are `Idref`
 * rows.
 *
 * @param a - The row.
 * @returns The predicate.
 */
const carriesIdrefs = (a: AttributeRow) =>
  a.in(ValueIdentity.at("identity", domainOf(a)), ["IDREF", "IDREFS"]);

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
 * Read the domain an element's governor reads its text in (`TextDomain`, total).
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
      on(OpenAttributeName, "node", "attribute", "class", "kind", "version", "governs"),
      on(Attribute, "node", "id", "name", "kind", "version", "governs"),
    ),
    contained(on(Idref, "node", "attribute", "document"), on(Attribute, "node", "id", "document")),
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
  "AL4 data name": [
    check("AL4_data_name", OpenAttributeName, (o) =>
      o.and(
        o.or(o.ne(o.class, "data-*"), Compute.matches(o.local, dataName.source)),
        o.or(
          o.ne(o.class, "no-namespace"),
          o.in(o.kind, openElementClasses),
          o.eq(Compute.startsWith(o.local, "data-"), false),
        ),
      ),
    ),
  ],
  "AL4 declared data name": [
    check("AL4_declared_data_name", OpenAttributeName, (o) =>
      o.or(
        o.ne(o.class, "data-*"),
        o.and(
          ...declaredDataNames.map((name) =>
            o.or(
              o.ne(o.local, name),
              o.eq(
                Compute.subset(
                  AttributeNameSelf.row(name),
                  AttributeSlotOf.row(
                    AttributeModelOf.at(
                      "model",
                      o.version,
                      GoverningOf.at("governor", o.version, o.kind, o.governs),
                    ),
                  ),
                ),
                false,
              ),
            ),
          ),
        ),
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
  "E1 derived": [
    idrefFamily,
    check("E1_derived", Attribute, (a) =>
      a.or(
        a.not(admitted(a)),
        a.and(
          a.eq(a.slot, SlotSelf.row(slotOf(a))),
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
      i.and(
        i.eq(
          i.piece,
          Compute.concat(
            Compute.concat(Compute.base(i.before), Compute.base(i.token)),
            Compute.base(i.after),
          ),
        ),
        Compute.matches(i.token, nonSpacePattern),
        i.or(i.eq(i.at, 0n), i.ne(i.before, "")),
      ),
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
