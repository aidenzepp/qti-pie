/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * Shred: a document as crust's reader gives it, read into the relational XDM tree through a
 * grammar's kind resolution and admission.
 *
 * Shred is the codec at the model's boundary, where names become handles. It refuses what has no
 * representation to write, under two rules: `not-qti3` ({@link NotQti3}), a document in no schema
 * version the model holds, and `unmodeled-vocabulary` ({@link UnmodeledVocabulary}), a name no
 * handle stands for or an attribute its kind admits under no name. Every other rule of QTI
 * is a law the database states over the rows `flatten` writes (`src/model/xdm.ts`), and shred
 * checks none of them: it keeps each lexical form as read.
 *
 * An element is read through the kind its name resolves to under its parent's kind. Where its
 * parent admits the foreign kind of its namespace class (its namespace against its parent's,
 * `namespaceClassOf`) and no kind it admits takes the name, it is a foreign element of that class
 * instead, kept under its exact name. A foreign element's content is assessed laxly, through
 * `xs:anyType`, whose content is a `##any` `lax` wildcard (XML Schema 1.0 Part 1, §3.4.7, and
 * §3.10.4, clause 1), so its children are read the same way under it: one a global declaration
 * names is of that kind, and any other is passed over as foreign while its own children are read in
 * turn (spec readings 30 and 57). The admission relation already says which parents admit which
 * classes of foreign element and which kinds a wildcard's processing validates, so shred reads no
 * wildcard.
 *
 * An attribute is read under its closed `AttributeName` handle where its element's kind admits that
 * handle, and otherwise under the open class its name falls in (`openClassOf` of
 * `#pantry/vocab/open.ts`, the one classifier of open names), where the kind admits that class
 * (fin.md, D2). Both are one lookup in `AttributeAdmission`; the value domain its lexical form is
 * read under is the grammar's to apply, never a field of the tree (U1).
 *
 * `unshred` (`src/model/unshred.ts`) is the way back, through the inverse of the same names.
 */
import { Effect, Option, Result, Schema } from "effect";
import { exportCharset } from "@qti-pie/crust/charset.ts";
import type { Attribute, Child, Element, Misc, XmlDocument } from "@qti-pie/crust/tree.ts";
import { foreignKinds } from "#pantry/grammar/kinds.ts";
import type { ForeignKind } from "#pantry/grammar/kinds.ts";
import { handlePrefixes, none } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  ExpandedName,
  ElementKind,
  OpenClass,
  Standalone,
  XdmAttribute,
  XdmAttributeName,
  XdmCharacter,
  XdmChild,
  XdmClosedElement,
  XdmDeclaration,
  XdmDocument,
  XdmElement,
  XdmMisc,
  XdmNamespace,
  XdmVocabulary,
  XmlVersion,
} from "#pantry/model/xdm.ts";
import {
  namespaceClassOf,
  xmlNamespace,
  xmlnsNamespace,
  xsiNamespace,
} from "#pantry/vocab/namespaces.ts";
import { openClassOf, openClassRefusals } from "#pantry/vocab/open.ts";

/**
 * The grammar a document is shredded through, in the handle types of one {@link XdmVocabulary}:
 * kind resolution, the `AttributeName` roster, and the two admission relations. Each member
 * answers from a closed relation the grammar composes; shred holds no vocabulary of its own.
 */
export interface ShredGrammar<V extends XdmVocabulary> {
  /**
   * Whether a kind's content admits a child of a kind: a row of the admission relation, the key set
   * of `Order` (`src/grammar/order.ts`).
   *
   * Shred asks it of a parent and the kind an element's name resolves to under it, and of the
   * parent and the foreign kind of the element's namespace class: a parent that admits that class
   * reads a name that resolves to no kind it admits as a foreign element of the class.
   *
   * @param version - The version of the element's document.
   * @param parent - The kind of the element's parent, a foreign kind for a foreign element.
   * @param child - A kind, or a foreign kind.
   * @returns Whether `parent` admits `child` in that version.
   */
  readonly admitsChild: (
    version: V["version"],
    parent: ElementKind<V> | ForeignKind,
    child: ElementKind<V> | ForeignKind,
  ) => boolean;
  /**
   * Whether a kind admits an attribute name: a row of `AttributeAdmission`.
   *
   * @param version - The version of the attribute's document.
   * @param kind - The kind of the attribute's element, a foreign kind for a foreign element.
   * @param name - A closed handle, or an open class.
   * @returns Whether the kind admits an attribute of that name in that version.
   */
  readonly admitted: (
    version: V["version"],
    kind: ElementKind<V> | ForeignKind,
    name: ClosedName<V> | OpenClass,
  ) => boolean;
  /**
   * Find the closed handle that spells an attribute's qualified name: the `AttributeName` roster.
   *
   * @param spelling - The local name for an attribute in no namespace, `xml:` or `xsi:` before it
   *   in the XML or XSI namespace.
   * @returns The handle, or none when no closed handle spells it.
   */
  readonly closedName: (spelling: string) => Option.Option<ClosedName<V>>;
  /**
   * Find the type a kind declares: an element's governing type without `xsi:type`.
   *
   * @param version - The version of the element's document.
   * @param kind - The element's kind.
   * @returns The declared type's `TypeName` handle, `none` for an anonymous one.
   */
  readonly declaredType: (version: V["version"], kind: ElementKind<V>) => string;
  /**
   * Find the kind an element is: `resolve` of `src/grammar/kinds.ts`.
   *
   * @param namespace - The element's namespace name, empty when it has none.
   * @param local - The element's local name.
   * @param parent - The kind of the element's parent, a foreign kind for a foreign element;
   *   `document` for the root element.
   * @returns The element's kind, or none when no vocabulary names that element under that parent.
   */
  readonly resolve: (
    namespace: string,
    local: string,
    parent: ElementKind<V> | ForeignKind | "document",
  ) => Option.Option<ElementKind<V>>;
  /**
   * Find the type an expanded name names: the `TypeName` roster.
   *
   * @param name - The name an `xsi:type` resolves to.
   * @returns The type's handle, or none when no pinned schema names a type so.
   */
  readonly typeName: (name: ExpandedName) => Option.Option<string>;
}

/**
 * Why a name has no representation:
 *
 * - `unnamed`: an element no kind names under its parent, where the parent admits no foreign element
 *   of its namespace class;
 * - `unadmitted`: an attribute its element's kind admits neither under its closed handle nor under
 *   its open class;
 * - `declared`: an `xml:` or `xsi:` attribute its kind does not admit that `xml.xsd` or XML Schema
 *   declares, which no open class holds, since the model reads it under its closed handle only;
 * - `data-name`: a no-namespace attribute named `data-…` outside the data class's language (reading
 *   13 of `docs/spec-readings.md`);
 * - `namespace-entity`: a namespace declaration whose namespace name holds an unexpanded entity
 *   reference, so no namespace name can be read from it;
 * - `type-unresolved`: an `xsi:type` on an element a declaration assesses whose value is no QName
 *   whose prefix is in scope (XML Schema 1.0 Part 1, §3.3.4 clause 4.1, §3.15.3);
 * - `type-unknown`: an `xsi:type` there whose QName names no type of the pinned schemas (clause 4.2).
 *
 * `declared` and `data-name` are `openClassOf`'s own refusals (`openClassRefusals` of
 * `#pantry/vocab/open.ts`), passed through under their names.
 */
export const unmodeledReasons = [
  "unnamed",
  "unadmitted",
  ...openClassRefusals,
  "namespace-entity",
  "type-unresolved",
  "type-unknown",
] as const;

/**
 * The document holds an element or an attribute that no handle names, or that its kind admits
 * under no name, so the model has no row to write it as.
 *
 * `name` is the qualified name as written. For an attribute `parent` is the element that carries
 * it; for an element it is the enclosing element, none for the root. A namespace declaration is
 * refused as the attribute it is written as.
 */
export class UnmodeledVocabulary extends Schema.TaggedError<UnmodeledVocabulary>()(
  "UnmodeledVocabulary",
  {
    kind: Schema.Literals(["element", "attribute"]),
    name: Schema.String,
    parent: Schema.Option(Schema.String),
    reason: Schema.Literals(unmodeledReasons),
  },
) {
  /**
   * The element or attribute, where it is, why it has no representation, and what to do with the
   * document.
   */
  override get message(): string {
    const what = Option.match(this.parent, {
      onNone: () => `The root element ${this.name}`,
      onSome: (parent) => `The ${this.kind} ${this.name} in ${parent}`,
    });
    const why = {
      "data-name":
        'begins with "data-", and a data attribute is named "data-" then lower-case letters, digits, "_", "." or "-"',
      declared:
        "is declared by xml.xsd or XML Schema, so it is read only under its own name, which its element does not admit",
      "namespace-entity": "declares a namespace through an entity reference, which is never read",
      "type-unknown":
        "names a type no pinned schema defines, so XML Schema refuses the element it types (cvc-elt 4.2)",
      "type-unresolved":
        "is no QName whose prefix is declared in scope, so it names no type (cvc-elt 4.1)",
      unadmitted: "is admitted on its element under no name or open class",
      unnamed:
        "is not in the vocabulary the model reads, and its parent admits no foreign element in its namespace",
    }[this.reason];

    return `${what} ${why}, so the document has no representation. Remove or rename it, or report it with the document if QTI admits it there.`;
  }
}

/**
 * Why a document is not read as QTI 3: its package declares no QTI 3 schema version, or its XML
 * declaration declares a version other than 1.x.
 */
export const notQti3Reasons = ["schema-version", "xml-version"] as const;

/**
 * The document is not a QTI 3 document: its package declares a schema version the
 * `SchemaVersion` roster does not hold, or none, or its XML declaration declares a version other
 * than 1.x, which no QTI 3 document is written in.
 *
 * `found` is the version as written, none when the package declares no schema version.
 */
export class NotQti3 extends Schema.TaggedError<NotQti3>()("NotQti3", {
  expected: Schema.String,
  found: Schema.Option(Schema.String),
  reason: Schema.Literals(notQti3Reasons),
}) {
  /**
   * The version found, the versions read, and the repair.
   */
  override get message(): string {
    const found = Option.match(this.found, {
      onNone: () => "declares none",
      onSome: (value) => `is ${JSON.stringify(value)}`,
    });

    return this.reason === "schema-version"
      ? `The package's QTI schema version ${found}, and the model reads ${this.expected}. Import a QTI 3 package whose manifest declares one of them.`
      : `The document's XML version ${found}, and a QTI 3 document is written in ${this.expected}. Write the document as XML 1.0.`;
  }
}

/**
 * Decode the schema version a package declares into its `SchemaVersion` handle.
 *
 * Every document of a package is read in the version its manifest declares, so the version is
 * decoded once per package and handed to {@link shred} for each document.
 *
 * @param versions - The `SchemaVersion` roster.
 * @param declared - The version the package's manifest declares, as written; none when it declares
 *   none.
 * @returns The handle, or `NotQti3` when the roster holds no such version.
 */
export const versionOf = <Version extends string>(
  versions: readonly Version[],
  declared: Option.Option<string>,
): Result.Result<Version, NotQti3> =>
  Result.fromOption(
    declared.pipe(
      Option.flatMap((value) =>
        Option.fromNullishOr(versions.find((version) => version === value)),
      ),
    ),
    () =>
      new NotQti3({
        expected: versions.join(" or "),
        found: declared,
        reason: "schema-version",
      }),
  );

/**
 * The prefix a closed `AttributeName` handle spells for each namespace a closed name can be in,
 * {@link handlePrefixes}. An attribute in any other namespace has no closed handle, and one in
 * these that no closed handle spells, and no schema declares, is `foreign` (`openClassOf`).
 */
const prefixOf: ReadonlyMap<string, string> = new Map(
  handlePrefixes.map(({ namespace, prefix }) => [namespace, prefix]),
);

/**
 * The language of an XML declaration's `VersionNum`: `1.`, then one or more digits.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-VersionNum | XML 1.0, VersionNum}
 */
const xmlVersionNum = /^1\.[0-9]+$/u;

/**
 * A run of character data made only of XML whitespace.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const whitespaceRun = /^[ \t\r\n]+$/u;

/**
 * Whether a declaration's version is a `VersionNum`.
 *
 * @param value - The version as written.
 * @returns Whether it matches {@link xmlVersionNum}, which every `1.${number}` spelling of digits
 *   does.
 */
const isXmlVersion = (value: string): value is XmlVersion => xmlVersionNum.test(value);

/**
 * The `standalone` values crust's reader admits, which are exactly the {@link Standalone} values.
 */
const standalones: ReadonlyMap<string, Standalone> = new Map([
  ["no", "no"],
  ["yes", "yes"],
]);

/**
 * How an element is read, and so the kind its children are read under: as an element of a kind,
 * or as a foreign element of the foreign kind of its namespace class. Each keeps the crust
 * element, whose name its refusals read, a foreign element is named by, and its children's
 * namespace classes are read against.
 */
type Reading<V extends XdmVocabulary> =
  | { readonly _tag: "kind"; readonly element: Element; readonly kind: ElementKind<V> }
  | { readonly _tag: "foreign"; readonly element: Element; readonly kind: ForeignKind };

/**
 * How an element of a kind is read.
 */
type KindReading<V extends XdmVocabulary> = Extract<Reading<V>, { readonly _tag: "kind" }>;

/**
 * Refuse an element no kind names under its parent.
 *
 * @param element - The element.
 * @param parent - The enclosing element, none for the root.
 * @returns The refusal.
 */
const unnamedElement = (element: Element, parent: Option.Option<Element>): UnmodeledVocabulary =>
  new UnmodeledVocabulary({
    kind: "element",
    name: element.qname,
    parent: parent.pipe(Option.map((above) => above.qname)),
    reason: "unnamed",
  });

/**
 * Refuse an attribute, or a namespace declaration, that has no representation on its element.
 *
 * @param attribute - The attribute.
 * @param element - The element that carries it.
 * @param reason - Why it has none.
 * @returns The refusal.
 */
const unmodeledAttribute = (
  attribute: Attribute,
  element: Element,
  reason: Exclude<UnmodeledVocabulary["reason"], "unnamed">,
): UnmodeledVocabulary =>
  new UnmodeledVocabulary({
    kind: "attribute",
    name: attribute.qname,
    parent: Option.some(element.qname),
    reason,
  });

/**
 * Read an element's namespace declarations, in source order.
 *
 * They are read before the element's own name, which they may bind. A declaration whose value
 * holds an unexpanded entity reference has no namespace name to record, since the entity's text
 * is never read, and {@link XdmNamespace} keeps none.
 *
 * @param element - The element.
 * @returns The declarations, `xmlns` as the empty prefix; or the refusal of the first that holds
 *   an entity reference.
 */
const namespacesOf = (
  element: Element,
): Result.Result<readonly XdmNamespace[], UnmodeledVocabulary> =>
  Result.all(
    element.attributes
      .filter((attribute) => attribute.namespace === xmlnsNamespace)
      .map((attribute) =>
        attribute.references.length === 0
          ? Result.succeed({
              prefix: attribute.qname === "xmlns" ? "" : attribute.local,
              uri: attribute.value,
            })
          : Result.fail(unmodeledAttribute(attribute, element, "namespace-entity")),
      ),
  );

/**
 * The namespace bindings in scope at an element: each prefix's namespace name, the empty prefix
 * the default namespace's, `""` where none is declared.
 */
type Scope = ReadonlyMap<string, string>;

/**
 * The bindings in scope above the root element: `xml`, bound by definition, and no default
 * namespace (Namespaces in XML 1.0, §3).
 */
const builtinScope: Scope = new Map([
  ["", ""],
  ["xml", xmlNamespace],
]);

/**
 * Extend the bindings in scope by an element's own declarations, an inner declaration of a
 * prefix taking the place of an outer one (Namespaces in XML 1.0, §6.1).
 *
 * @param outer - The bindings in scope at the element's parent.
 * @param declarations - The element's own declarations.
 * @returns The bindings in scope at the element.
 */
const scopeOf = (outer: Scope, declarations: readonly XdmNamespace[]): Scope =>
  declarations.length === 0
    ? outer
    : new Map([...outer, ...declarations.map(({ prefix, uri }) => [prefix, uri] as const)]);

/**
 * An `xsi:type` value after XML Schema's `collapse` whitespace (Part 2, §4.3.6), as a prefix and a
 * local name: a QName, at most one colon, neither part empty or holding whitespace.
 */
const qNameParts = /^(?:(?<prefix>[^\s:]+):)?(?<local>[^\s:]+)$/u;

/**
 * Read an element's governing type (XML Schema 1.0 Part 1, §3.3.4 clause 4): the type its
 * `xsi:type` names, resolved against the bindings in scope, as an unprefixed name takes the default
 * namespace (§3.15.3); or its declared type without one. A foreign element has no declaration and
 * is assessed laxly, so no named type governs it here (readings 50 and 60).
 *
 * @param reading - How the element is read.
 * @param scope - The bindings in scope at it.
 * @param version - The version of its document.
 * @param grammar - The grammar.
 * @returns The governing type's handle, or the refusal of an `xsi:type` that names no type.
 */
const governsOf = <V extends XdmVocabulary>(
  reading: Reading<V>,
  scope: Scope,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<string, UnmodeledVocabulary> => {
  if (reading._tag === "foreign") {
    return Result.succeed(none);
  }

  const { element, kind } = reading;
  const typed = element.attributes.find(
    (attribute) => attribute.namespace === xsiNamespace && attribute.local === "type",
  );
  if (typed === undefined) {
    return Result.succeed(grammar.declaredType(version, kind));
  }

  const parts = qNameParts.exec(typed.value.replaceAll(/[\t\n\r ]+/gu, " ").trim())?.groups;
  const namespace = scope.get(parts?.["prefix"] ?? "");
  if (parts === undefined || typed.references.length > 0 || namespace === undefined) {
    return Result.fail(unmodeledAttribute(typed, element, "type-unresolved"));
  }

  return Result.fromOption(grammar.typeName({ local: parts["local"] ?? "", namespace }), () =>
    unmodeledAttribute(typed, element, "type-unknown"),
  );
};

/**
 * Read the root element's kind: the kind its name resolves to under the document node, which
 * admits no foreign element.
 *
 * @param element - The root element.
 * @param grammar - The grammar.
 * @returns How it is read, or its refusal.
 */
const rootReadingOf = <V extends XdmVocabulary>(
  element: Element,
  grammar: ShredGrammar<V>,
): Result.Result<KindReading<V>, UnmodeledVocabulary> =>
  Result.fromOption(
    grammar
      .resolve(element.namespace, element.local, "document")
      .pipe(Option.map((kind) => ({ _tag: "kind", element, kind }) as const)),
    () => unnamedElement(element, Option.none()),
  );

/**
 * Read an element under its parent, of a kind or foreign: as the kind its name has there, or as a
 * foreign element of its namespace class.
 *
 * A kind the parent admits wins. Where the parent admits the foreign kind of the element's
 * namespace class, its namespace against the parent's (`namespaceClassOf`), any other name is a
 * foreign element of that class: an element no vocabulary names, one a lax wildcard finds no global
 * declaration for, as a `qti-printed-variable` directly inside `m:annotation-xml` is (spec reading
 * 30), and a QTI root inside a custom interaction (reading 6). Under a foreign element the same
 * holds, since its content is a `##any` `lax` wildcard: a globally declared element is read as its
 * kind, and any other as foreign, its children read in turn (reading 57). The admission relation
 * has already followed each wildcard's namespace constraint and processing (XML Schema 1.0,
 * §3.10.4), so this is the whole decision. Anywhere else the element is the kind its name resolves
 * to, which the database's admission law refuses where the parent does not admit it, and it is
 * refused here when its name resolves to none.
 *
 * @param element - The element.
 * @param parent - How its parent is read.
 * @param version - The version of its document.
 * @param grammar - The grammar.
 * @returns How it is read, or its refusal.
 */
const childReadingOf = <V extends XdmVocabulary>(
  element: Element,
  parent: Reading<V>,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<Reading<V>, UnmodeledVocabulary> => {
  const resolved = grammar.resolve(element.namespace, element.local, parent.kind);
  const foreign = foreignKinds[namespaceClassOf(element.namespace, parent.element.namespace)];
  if (
    !Option.exists(resolved, (kind) => grammar.admitsChild(version, parent.kind, kind)) &&
    grammar.admitsChild(version, parent.kind, foreign)
  ) {
    return Result.succeed({ _tag: "foreign", element, kind: foreign });
  }

  return Result.fromOption(
    resolved.pipe(Option.map((kind) => ({ _tag: "kind", element, kind }) as const)),
    () => unnamedElement(element, Option.some(parent.element)),
  );
};

/**
 * Spell the qualified name an attribute's closed handle would have.
 *
 * @param attribute - The attribute's namespace name and local name.
 * @returns The local name in no namespace, the {@link prefixOf} prefix and the local name
 *   in a namespace that has one; none in any other namespace.
 */
const spellingOf = ({ local, namespace }: Attribute): Option.Option<string> =>
  namespace === ""
    ? Option.some(local)
    : Option.map(Option.fromNullishOr(prefixOf.get(namespace)), (prefix) => `${prefix}:${local}`);

/**
 * Read one attribute of an element: under its closed handle where the element's kind admits it,
 * else under its open class where the kind admits that.
 *
 * @param attribute - The attribute, never a namespace declaration.
 * @param reading - How the element that carries it is read.
 * @param version - The version of its document.
 * @param grammar - The grammar.
 * @returns The attribute with its lexical form and entity references as read, or its refusal.
 */
const attributeOf = <V extends XdmVocabulary>(
  attribute: Attribute,
  reading: Reading<V>,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<XdmAttribute<V>, UnmodeledVocabulary> => {
  const { kind } = reading;
  const read = (name: XdmAttributeName<V>): XdmAttribute<V> => ({
    lexical: attribute.value,
    name,
    references: attribute.references,
  });
  const closed = spellingOf(attribute).pipe(
    Option.flatMap(grammar.closedName),
    Option.filter((handle) => grammar.admitted(version, kind, handle)),
  );
  if (Option.isSome(closed)) {
    return Result.succeed(read({ _tag: "closed", handle: closed.value }));
  }

  const { local, namespace } = reading.element;
  const host = { foreign: reading._tag === "foreign", local, namespace };

  return Result.match(openClassOf(attribute, host), {
    onFailure: ({ reason }) => Result.fail(unmodeledAttribute(attribute, reading.element, reason)),
    onSuccess: (name) =>
      grammar.admitted(version, kind, name._tag)
        ? Result.succeed(read(name))
        : Result.fail(unmodeledAttribute(attribute, reading.element, "unadmitted")),
  });
};

/**
 * Read an element's attributes, in source order, its namespace declarations left out.
 *
 * @param reading - How the element is read.
 * @param version - The version of its document.
 * @param grammar - The grammar.
 * @returns The attributes, or the refusal of the first that has no representation there.
 */
const attributesOf = <V extends XdmVocabulary>(
  reading: Reading<V>,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<readonly XdmAttribute<V>[], UnmodeledVocabulary> =>
  Result.all(
    reading.element.attributes
      .filter((attribute) => attribute.namespace !== xmlnsNamespace)
      .map((attribute) => attributeOf(attribute, reading, version, grammar)),
  );

/**
 * Join each stretch of an element's character data into one run, and drop the runs left empty.
 *
 * Crust's reader keeps a CDATA section as a run of its own beside the text around it, and the XDM
 * keeps no record of the form a run was written in, so a stretch of character data between two
 * other nodes is one node, as in the XPath data model. Its whitespace class is the whole run's.
 *
 * @param children - The element's children as crust read them, in document order.
 * @returns The children with every two adjacent runs joined; an empty run holds no character to
 *   keep.
 * @see {@link https://www.w3.org/TR/xpath-datamodel/#TextNodeOverview | XDM 3.1, Text Nodes}
 */
const joinRuns = (children: readonly Child[]): readonly Child[] => {
  const joined: Child[] = [];
  for (const child of children) {
    const last = joined.at(-1);
    if (child.kind === "text" && last?.kind === "text") {
      joined[joined.length - 1] = { cdata: false, kind: "text", value: last.value + child.value };
    } else {
      joined.push(child);
    }
  }

  return joined.filter((child) => child.kind !== "text" || child.value !== "");
};

/**
 * Read a comment or a processing instruction.
 *
 * @param misc - The node as crust read it.
 * @returns The node in the tree, its text as read.
 */
const miscOf = (misc: Misc): XdmMisc =>
  misc.kind === "comment"
    ? { _tag: "comment", value: misc.text }
    : { _tag: "pi", data: misc.data, target: misc.target };

/**
 * Read a child of an element that is not an element.
 *
 * @param child - The child as crust read it, a run never empty after {@link joinRuns}.
 * @returns A `ws` node for a run of whitespace only and a `text` node for any other run; the
 *   comment, processing instruction or entity reference otherwise.
 */
const characterOf = (child: Exclude<Child, Element>): XdmCharacter => {
  switch (child.kind) {
    case "text": {
      return whitespaceRun.test(child.value)
        ? { _tag: "ws", value: child.value }
        : { _tag: "text", value: child.value };
    }
    case "comment":
    case "pi": {
      return miscOf(child);
    }
    case "entityRef": {
      return { _tag: "entityRef", name: child.name };
    }
    default: {
      return child satisfies never;
    }
  }
};

/**
 * An element read into the tree without its children, of a kind or foreign, the list they are
 * appended to, and how it is read, which its children are read under.
 */
interface Opened<V extends XdmVocabulary> {
  readonly children: XdmChild<V>[];
  readonly element: XdmElement<V>;
  readonly reading: Reading<V>;
  /**
   * The namespace bindings in scope at the element, which its children's are read from.
   */
  readonly scope: Scope;
}

/**
 * Read what every element holds but its children: its namespace declarations, then its
 * attributes, once its kind is known, the order in which each binds or names the next.
 *
 * @param reading - How the element is read.
 * @param version - The version of its document.
 * @param grammar - The grammar.
 * @returns The declarations, the attributes and the prefix, or the refusal of the first of its
 *   names that has no representation.
 */
const contentOf = <V extends XdmVocabulary>(
  reading: Reading<V>,
  outer: Scope,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<
  Pick<XdmClosedElement<V>, "attributes" | "governs" | "namespaces" | "prefix"> & {
    readonly scope: Scope;
  },
  UnmodeledVocabulary
> =>
  Result.gen(function* elementContent() {
    const namespaces = yield* namespacesOf(reading.element);
    const scope = scopeOf(outer, namespaces);
    const attributes = yield* attributesOf(reading, version, grammar);
    const governs = yield* governsOf(reading, scope, version, grammar);

    return { attributes, governs, namespaces, prefix: reading.element.prefix, scope };
  });

/**
 * Read an element without its children: of its kind, or foreign under its exact name.
 *
 * @param reading - How it is read.
 * @param outer - The namespace bindings in scope at its parent.
 * @param version - The version of its document.
 * @param grammar - The grammar.
 * @returns The element with an empty children list the walk fills, or its refusal.
 */
const open = <V extends XdmVocabulary>(
  reading: Reading<V>,
  outer: Scope,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<Opened<V>, UnmodeledVocabulary> =>
  Result.map(contentOf(reading, outer, version, grammar), (content) => {
    const children: XdmChild<V>[] = [];
    const { local, namespace } = reading.element;
    const { attributes, governs, namespaces, prefix, scope } = content;

    return {
      children,
      element:
        reading._tag === "kind"
          ? {
              _tag: "element",
              attributes,
              children,
              governs,
              kind: reading.kind,
              namespaces,
              prefix,
            }
          : {
              _tag: reading.kind,
              attributes,
              children,
              name: { local, namespace },
              namespaces,
              prefix,
            },
      reading,
      scope,
    };
  });

/**
 * A child of an element waiting to be read, and the element it is read into, whose reading is the
 * context it is read in.
 */
interface Pending<V extends XdmVocabulary> {
  readonly into: Opened<V>;
  readonly node: Child;
}

/**
 * Push an element's children onto the walk's stack, last first, so they leave it in document
 * order.
 *
 * @param stack - The walk's stack.
 * @param opened - The element read so far, whose children list they are appended to.
 * @param children - Its children as crust read them, their runs joined.
 */
const pushChildren = <V extends XdmVocabulary>(
  stack: Pending<V>[],
  opened: Opened<V>,
  children: readonly Child[],
): void => {
  for (let at = children.length - 1; at >= 0; at -= 1) {
    const node = children[at];
    if (node !== undefined) {
      stack.push({ into: opened, node });
    }
  }
};

/**
 * Read an element into the element it sits in, by {@link childReadingOf}, appending it to that
 * element's children.
 *
 * @param element - The element as crust read it.
 * @param into - The element it sits in.
 * @param version - The version of the document.
 * @param grammar - The grammar.
 * @returns The element read so far, or its refusal.
 */
const openInto = <V extends XdmVocabulary>(
  element: Element,
  into: Opened<V>,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<Opened<V>, UnmodeledVocabulary> =>
  Result.gen(function* openChild() {
    const opened = yield* open(
      yield* childReadingOf(element, into.reading, version, grammar),
      into.scope,
      version,
      grammar,
    );
    into.children.push(opened.element);

    return opened;
  });

/**
 * Read the root element and everything below it.
 *
 * The walk keeps its own stack, so a tree of any depth is read without recursion, and it reads the
 * elements in document order, so the refusal it returns is the document's first. Each children list
 * receives its children in document order, because a child's whole subtree leaves the stack before
 * its next sibling does.
 *
 * @param root - The root element as crust read it.
 * @param version - The version of the document.
 * @param grammar - The grammar.
 * @returns The root element in the tree, or the refusal of the first element or attribute in
 *   document order that has no representation.
 */
const rootOf = <V extends XdmVocabulary>(
  root: Element,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Result.Result<XdmClosedElement<V>, UnmodeledVocabulary> =>
  Result.gen(function* readRoot() {
    const reading = yield* rootReadingOf(root, grammar);
    const children: XdmChild<V>[] = [];
    const { attributes, governs, namespaces, prefix, scope } = yield* contentOf(
      reading,
      builtinScope,
      version,
      grammar,
    );
    const element: XdmClosedElement<V> = {
      _tag: "element",
      attributes,
      children,
      governs,
      kind: reading.kind,
      namespaces,
      prefix,
    };
    const top: Opened<V> = { children, element, reading, scope };
    const stack: Pending<V>[] = [];
    pushChildren(stack, top, joinRuns(root.children));
    for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
      const { into, node } = next;
      if (node.kind === "element") {
        const opened = yield* openInto(node, into, version, grammar);
        pushChildren(stack, opened, joinRuns(node.children));
      } else {
        into.children.push(characterOf(node));
      }
    }

    return element;
  });

/**
 * Read a `standalone` pseudo-attribute.
 *
 * @param written - The value as written, none when the declaration writes none.
 * @returns The value. Dies on a value other than `yes` or `no`, which crust's reader refuses, so
 *   only a tree built by hand can hold one.
 */
const standaloneOf = (written: Option.Option<string>): Effect.Effect<Option.Option<Standalone>> =>
  Option.match(written, {
    onNone: () => Effect.succeedNone,
    onSome: (value) => {
      const read = standalones.get(value);

      return read === undefined
        ? Effect.die(
            new Error(
              `The XML declaration's standalone is ${JSON.stringify(value)}, which crust's reader refuses. Shred a document crust's reader read.`,
            ),
          )
        : Effect.succeedSome(read);
    },
  });

/**
 * Read the XML declaration.
 *
 * @param document - The document as crust read it.
 * @returns The declaration with its version, `encoding` and `standalone` as written, none when the
 *   document writes none; `NotQti3` for a version other than 1.x, which crust's reader admits.
 *   Dies as {@link standaloneOf} does.
 */
const declarationOf = Effect.fnUntraced(function* declarationOf(
  document: XmlDocument,
): Effect.fn.Return<Option.Option<XdmDeclaration>, NotQti3> {
  if (Option.isNone(document.declaration)) {
    return Option.none();
  }

  const { encoding, standalone, version } = document.declaration.value;
  if (!isXmlVersion(version)) {
    return yield* new NotQti3({
      expected: "XML 1.x",
      found: Option.some(version),
      reason: "xml-version",
    });
  }

  return Option.some({ encoding, standalone: yield* standaloneOf(standalone), version });
});

/**
 * Shred a document crust read into the relational XDM tree, in one schema version.
 *
 * Crust's tree holds the doctype apart from the prolog, so the tree holds it first among the
 * document node's children, where unshred writes it back. The export label is decided here, once,
 * as crust decides it from the read label and the characters the document holds.
 *
 * @param document - The document as crust's reader gave it.
 * @param version - The version its package declares, decoded by {@link versionOf}.
 * @param grammar - The grammar it is read through.
 * @returns The tree; `NotQti3` for an XML version other than 1.x, and `UnmodeledVocabulary` for the
 *   first element or attribute in document order that has no representation. Dies on a
 *   `standalone` crust's reader refuses.
 */
export const shred = Effect.fn("model.shred")(function* shred<V extends XdmVocabulary>(
  document: XmlDocument,
  version: V["version"],
  grammar: ShredGrammar<V>,
): Effect.fn.Return<XdmDocument<V>, NotQti3 | UnmodeledVocabulary> {
  yield* Effect.annotateCurrentSpan({ charset: document.charset, version });

  return {
    _tag: "document",
    charset: document.charset,
    declaration: yield* declarationOf(document),
    doctype: document.doctype,
    epilog: document.epilog.map(miscOf),
    exportCharset: exportCharset(document.charset, document),
    prolog: document.prolog.map(miscOf),
    root: yield* Effect.fromResult(rootOf(document.root, version, grammar)),
    version,
  };
});
