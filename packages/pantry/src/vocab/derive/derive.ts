/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * The XSD reading the vocabulary derivations share: it reads the pinned QTI XSDs through crust's
 * `readXml`, for `models.ts`, `declarations.ts`, `domains.ts`, `ssml.ts` and `extensions.ts`, and
 * reads the operator arity table.
 *
 * Run it from `packages/pantry` as `node src/vocab/derive/derive.ts arity`. It reads only the files
 * {@link sources} pins, from the shared cache, and touches no database. It prints to standard
 * output the child-expression multiplicity of the 64 expression kinds from the ASI 3.0 XSD: the
 * table `OperatorArity` holds (`src/grammar/expression.ts`), which `derive.test.ts` checks against
 * the arity `aritiesOf` reads from the content-model IR.
 *
 * Reading rules, stated once for every reading:
 *
 * - A schema is its entry document and every pinned document an `xs:include` names, read depth first,
 *   each once, the `schemaLocation` resolved against the including document's pinned URL. Every
 *   document has the same target namespace, prefixes and `elementFormDefault`, so the schema's
 *   components are the union of theirs. An `xs:redefine` or `xs:override` is refused; an
 *   `xs:import` is not followed.
 * - A type reference (`type`, `base`, `ref`, `memberTypes`, `substitutionGroup`) is a QName resolved
 *   through the namespaces the `xs:schema` element declares. A name in the XSD namespace is a
 *   built-in; a name in the target namespace names a top-level component of the schema.
 * - A complex type's content is its own particles, after its base type's content when it is a
 *   `complexContent` extension of a type of this document ({@link contentParticles}). A
 *   `complexContent` restriction states its whole content itself. The content-model IR
 *   (`models.ts`) reads those particles; this module reads no content model of its own.
 * - A complex type's attributes are its own declarations, then those of its attribute groups in
 *   reference order. A type derived by extension or restriction lists its base type's attributes,
 *   then those of the derivation step. A reference into the XML namespace carries no type here:
 *   `xml.xsd` declares it, and `declarations.ts` reads it there.
 * - An attribute declared with no type has `xs:anySimpleType`. Its `whiteSpace` class is `collapse`
 *   for a list and for every built-in but `xs:string` and `xs:anySimpleType` (`preserve`) and
 *   `xs:normalizedString` (`replace`); a restriction takes its own `whiteSpace` facet or else its
 *   base's class; a union is `collapse` when every member is, else `union`. An attribute wildcard
 *   adds no row; {@link attributeWildcardOf} reads it.
 * - A simple type is written as its QName, a built-in as `xs:<local>` whatever prefix the schema
 *   binds to the XML Schema namespace. An anonymous simple type keeps its definition
 *   ({@link InlineType}): a restriction's base and facets in document order, a list's item type, a
 *   union's members, its `memberTypes` first. Its designator is `list`, `union`, or its
 *   restriction's base, read through nested anonymous restrictions.
 * - A type is mixed when it, or its `complexContent`, says so, or else when its base type is
 *   ({@link mixedOf}). A type with simple content holds text of the base its `simpleContent`
 *   extends, through the simple content of a complex base ({@link textTypeOf}).
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, Layer, Match, Option, pipe, Result, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { booleanOf } from "#pantry/grammar/domains.ts";
import { readPlaced, sourcePaths, sources } from "#pantry/vocab/derive/sources.ts";
import type { Placed, SourcePath } from "#pantry/vocab/derive/sources.ts";
import type {
  AttributeWildcard,
  Facet,
  FacetName,
  InlineType,
  NamespaceConstraint,
  Processing,
  TypeReading,
  ValueType,
  WhiteSpace,
} from "#pantry/vocab/inventory/types.ts";
import {
  noNamespace,
  xmlNamespace as XML,
  xmlnsNamespace as XMLNS,
  xsNamespace as XS,
} from "#pantry/vocab/namespaces.ts";

/**
 * The XSD does not have a shape the deriver reads.
 *
 * `detail` names the construct and what about it the reading rules do not cover.
 */
export class XsdReadingError extends Schema.TaggedError<XsdReadingError>()("XsdReadingError", {
  detail: Schema.String,
}) {
  /**
   * What the deriver met, and what to change before deriving again.
   */
  override get message(): string {
    return `The XSD does not have the shape the deriver reads: ${this.detail}. The deriver reads the files src/vocab/derive/sources.ts pins; extend its reading rules before deriving from any other.`;
  }
}

/**
 * Refuse a construct the reading rules do not cover.
 *
 * Public: every vocabulary's reading refuses with it.
 *
 * @param detail - The construct and what about it is not read.
 * @returns The failure.
 */
export const refuse = (detail: string): Result.Result<never, XsdReadingError> =>
  Result.fail(new XsdReadingError({ detail }));

/**
 * The element children of an element, in document order.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param node - The parent element.
 * @returns Its children that are elements.
 */
export const elementsOf = (node: Element): readonly Element[] =>
  node.children.flatMap((child) => (child.kind === "element" ? [child] : []));

/**
 * Whether an element is the XSD construct named `local`.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param node - The element.
 * @param local - The construct's local name, such as `sequence`.
 * @returns Whether the element is `xs:<local>`.
 */
export const isXs = (node: Element, local: string): boolean =>
  node.namespace === XS && node.local === local;

/**
 * Whether an element is a compositor: a `sequence`, a `choice` or an `all`.
 *
 * Public, and stable while the vocabularies are derived: the content-model IR (`models.ts`) reads
 * content models' structure with it.
 *
 * @param node - The element.
 * @returns Whether it groups particles.
 */
export const isCompositor = (node: Element): boolean =>
  isXs(node, "sequence") || isXs(node, "choice") || isXs(node, "all");

/**
 * The children of an element that are the XSD construct named `local`, in document order.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param node - The parent element.
 * @param local - The construct's local name.
 * @returns The matching children.
 */
export const xsChildren = (node: Element, local: string): readonly Element[] =>
  elementsOf(node).filter((child) => isXs(child, local));

/**
 * The first child of an element that is the XSD construct named `local`.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param node - The parent element.
 * @param local - The construct's local name.
 * @returns The child, or `None` when there is none.
 */
export const firstXs = (node: Element, local: string): Option.Option<Element> =>
  Arr.head(xsChildren(node, local));

/**
 * The value of an element's attribute that is in no namespace.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param node - The element.
 * @param name - The attribute's local name, such as `minOccurs`.
 * @returns The value, or `None` when the element has no such attribute.
 */
export const attributeOf = (node: Element, name: string): Option.Option<string> =>
  Arr.findFirst(
    node.attributes,
    (attribute) => attribute.namespace === noNamespace && attribute.local === name,
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * The value of an attribute the construct must carry.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param node - The construct.
 * @param name - The attribute's local name.
 * @returns The value, or an {@link XsdReadingError} naming the construct when it is absent.
 */
export const requireAttribute = (
  node: Element,
  name: string,
): Result.Result<string, XsdReadingError> =>
  Option.match(attributeOf(node, name), {
    onNone: () => refuse(`an ${node.qname} has no ${name} attribute`),
    onSome: (value) => Result.succeed(value),
  });

/**
 * The items of a list-valued attribute, such as `memberTypes`, or `substitutionGroup` as XML Schema
 * 1.1 lists it: its value split at white space. An absent one states no item, as XML Schema 1.0
 * makes each optional: a union's members are then its anonymous member types alone (Part 2,
 * §4.1.2), and an element names no substitution group head (Part 1, §3.3.2).
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param node - The element.
 * @param name - The attribute's local name.
 * @returns The items in order; none when the element has no such attribute.
 */
export const listAttributeOf = (node: Element, name: string): readonly string[] =>
  Option.match(attributeOf(node, name), {
    onNone: () => [],
    onSome: (value) => value.split(/\s+/u).filter((item) => item !== ""),
  });

/**
 * Group items by a key, as `Map.groupBy` does, each group non-empty by construction.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param items - The items, in order.
 * @param keyOf - The key of an item.
 * @returns Each key, in the order it is first met, with its items in order.
 */
export const groupedBy = <A, K>(
  items: Iterable<A>,
  keyOf: (item: A) => K,
): ReadonlyMap<K, Arr.NonEmptyReadonlyArray<A>> => {
  const groups = new Map<K, Arr.NonEmptyArray<A>>();

  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);

    if (group === undefined) {
      groups.set(key, [item]);
    } else {
      group.push(item);
    }
  }

  return groups;
};

/**
 * A resolved QName: a namespace name and a local name.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 */
export interface QName {
  readonly local: string;
  readonly namespace: string;
}

/**
 * Resolve a QName-valued attribute through the namespaces a schema element declares.
 *
 * @param namespaces - The prefixes the `xs:schema` element declares, with `xml`.
 * @param lexical - The value as written, such as `xs:string` or `ChoiceInteractionDType`.
 * @returns The resolved name; an unprefixed name with no default namespace is in no namespace. A
 *   prefix the schema element does not declare is an {@link XsdReadingError}.
 */
const resolveIn = (
  namespaces: ReadonlyMap<string, string>,
  lexical: string,
): Result.Result<QName, XsdReadingError> => {
  const colon = lexical.indexOf(":");
  const prefix = colon === -1 ? "" : lexical.slice(0, colon);
  const local = lexical.slice(colon + 1);

  return Option.match(Option.fromNullishOr(namespaces.get(prefix)), {
    onNone: () =>
      prefix === ""
        ? Result.succeed({ local, namespace: noNamespace })
        : refuse(`the prefix of ${lexical} is not declared on the xs:schema element`),
    onSome: (namespace) => Result.succeed({ local, namespace }),
  });
};

/**
 * A schema, from one document or from a document and those it includes, indexed for derivation.
 *
 * The component maps hold the top-level named components by local name, `elements` the top-level
 * element declarations and `attributes` the top-level attribute declarations. A valid schema names
 * each component once per kind, and the pinned files hold no named component below the top level.
 * `declarations` holds, per element name, the distinct `type` of its declarations at any depth, in
 * document order; a declaration with an anonymous type adds nothing. `substitutions` holds, for
 * every top-level element, the top-level elements whose `substitutionGroup` names it, in document
 * order, none for an element that heads no group.
 * `namespaces` maps each prefix the `xs:schema` element declares, `""` for the default namespace,
 * and `xml`. `qualified` is whether a local element declaration is in the target namespace by
 * default (`elementFormDefault="qualified"`), and `targetPrefix` is the prefix a name in the target
 * namespace is written with: `""` when that namespace is the default one or no namespace.
 */
export interface XsdSchema {
  readonly attributeGroups: ReadonlyMap<string, Element>;
  readonly attributes: ReadonlyMap<string, Element>;
  readonly complexTypes: ReadonlyMap<string, Element>;
  readonly declarations: ReadonlyMap<string, Arr.NonEmptyReadonlyArray<string>>;
  readonly elements: ReadonlyMap<string, Element>;
  readonly groups: ReadonlyMap<string, Element>;
  readonly namespaces: ReadonlyMap<string, string>;
  readonly qualified: boolean;
  readonly simpleTypes: ReadonlyMap<string, Element>;
  readonly substitutions: ReadonlyMap<string, readonly string[]>;
  readonly targetNamespace: string;
  readonly targetPrefix: string;
}

/**
 * The top-level components of a schema of one kind, by name.
 *
 * Every top-level component has a `name`: the schema for schemas requires it of `topLevelElement`,
 * `topLevelAttribute`, `topLevelComplexType`, `topLevelSimpleType`, `namedGroup` and
 * `namedAttributeGroup` (XML Schema 1.0 Part 1, Appendix A).
 *
 * @param root - The `xs:schema` element.
 * @param local - The kind's construct, such as `complexType`.
 * @returns Each component of that kind under its name, or an {@link XsdReadingError} for one with
 *   no `name`.
 */
const componentsOf = (
  root: Element,
  local: string,
): Result.Result<ReadonlyMap<string, Element>, XsdReadingError> =>
  Result.map(
    Result.all(
      xsChildren(root, local).map((component) =>
        Result.map(requireAttribute(component, "name"), (name) => [name, component] as const),
      ),
    ),
    (named) => new Map(named),
  );

/**
 * Every element declaration below a node, the node included, that states its name and its type, as
 * the pair of the two, in document order.
 *
 * @param node - The node.
 * @returns The pairs.
 */
const typedDeclarationsIn = (node: Element): readonly (readonly [string, string])[] => [
  ...(isXs(node, "element")
    ? Option.toArray(Option.all([attributeOf(node, "name"), attributeOf(node, "type")]))
    : []),
  ...elementsOf(node).flatMap(typedDeclarationsIn),
];

/**
 * Each element name with the distinct `type` values of its declarations, first-seen first.
 *
 * @param pairs - The declarations as name and type pairs, in document order.
 * @returns The names in the order they are first declared.
 */
const typesByName = (
  pairs: Iterable<readonly [string, string]>,
): ReadonlyMap<string, Arr.NonEmptyReadonlyArray<string>> =>
  new Map(
    [...groupedBy(pairs, ([name]) => name)].map(
      ([name, declared]) =>
        [
          name,
          pipe(
            declared,
            Arr.map(([, type]) => type),
            Arr.dedupe,
          ),
        ] as const,
    ),
  );

/**
 * One schema document's part of a schema: everything {@link XsdSchema} holds but the
 * substitution groups, which may cross the documents of a schema.
 */
type DocumentIndex = Omit<XsdSchema, "substitutions">;

/**
 * What each value of `elementFormDefault` and `form` says of a local element declaration: whether
 * it is in its schema's target namespace (XML Schema 1.0 Part 1, §3.3.2, `{target namespace}`).
 */
const formReadings: ReadonlyMap<string, boolean> = new Map([
  ["qualified", true],
  ["unqualified", false],
]);

/**
 * `elementFormDefault`'s XSD default, `unqualified`, read through {@link formReadings}: a schema
 * document that states none puts its local element declarations in no namespace (XML Schema 1.0
 * Part 1, §3.15.2, `elementFormDefault = (qualified | unqualified) : unqualified`).
 */
const elementFormDefault = false;

/**
 * Read a form attribute, `elementFormDefault` or `form`.
 *
 * @param node - The `xs:schema` or the `xs:element`.
 * @param name - The attribute.
 * @returns Whether it says `qualified`, `None` when the element does not carry it, or an
 *   {@link XsdReadingError} for a value that is neither `qualified` nor `unqualified`.
 */
const formOf = (
  node: Element,
  name: "elementFormDefault" | "form",
): Result.Result<Option.Option<boolean>, XsdReadingError> =>
  Option.match(attributeOf(node, name), {
    onNone: () => Result.succeed(Option.none()),
    onSome: (value) =>
      Option.match(Option.fromNullishOr(formReadings.get(value)), {
        onNone: () =>
          refuse(
            `an ${node.qname} has ${name}="${value}", which is neither qualified nor unqualified`,
          ),
        onSome: (qualified) => Result.succeed(Option.some(qualified)),
      }),
  });

/**
 * The namespace of the element a declaration declares (XML Schema 1.0 Part 1, §3.3.2,
 * `{target namespace}`): its schema's target namespace for a top-level declaration, and for a local
 * one whose `form`, or else whose schema's `elementFormDefault`, is `qualified`; no namespace for
 * any other local one.
 *
 * Public, and stable while the vocabularies are derived: the content-model IR names each
 * declaration's kind in it.
 *
 * @param schema - The schema the declaration is in.
 * @param declaration - The `xs:element` declaration.
 * @param global - Whether it is a top-level declaration.
 * @returns The namespace, or an {@link XsdReadingError} for a `form` that is neither `qualified`
 *   nor `unqualified`.
 */
export const elementNamespaceOf = (
  schema: XsdSchema,
  declaration: Element,
  global: boolean,
): Result.Result<string, XsdReadingError> =>
  global
    ? Result.succeed(schema.targetNamespace)
    : Result.map(formOf(declaration, "form"), (form) =>
        Option.getOrElse(form, () => schema.qualified) ? schema.targetNamespace : noNamespace,
      );

/**
 * The prefix a schema writes names in its target namespace with.
 *
 * @param namespaces - The prefixes the `xs:schema` element declares, with `xml`.
 * @param targetNamespace - The schema's target namespace, {@link noNamespace} for none.
 * @returns `""` for no namespace or the default one, else the first prefix the element binds to
 *   it, or an {@link XsdReadingError} when it binds none.
 */
const targetPrefixOf = (
  namespaces: ReadonlyMap<string, string>,
  targetNamespace: string,
): Result.Result<string, XsdReadingError> => {
  if (targetNamespace === noNamespace || namespaces.get("") === targetNamespace) {
    return Result.succeed("");
  }

  return Option.match(
    Arr.findFirst([...namespaces], ([, namespace]) => namespace === targetNamespace),
    {
      onNone: () =>
        refuse(`the xs:schema element binds no prefix to its target namespace ${targetNamespace}`),
      onSome: ([prefix]) => Result.succeed(prefix),
    },
  );
};

/**
 * Index one schema document.
 *
 * @param document - A schema document as crust read it.
 * @returns Its part of the schema, or an {@link XsdReadingError} when the root is not `xs:schema`
 *   or binds no prefix to its target namespace.
 */
const indexDocument = (document: XmlDocument): Result.Result<DocumentIndex, XsdReadingError> =>
  Result.gen(function* indexDocumentBody() {
    const { root } = document;

    if (!isXs(root, "schema")) {
      return yield* refuse(`the root element is ${root.qname}, not xs:schema`);
    }

    const declared = root.attributes.flatMap((attribute) =>
      attribute.namespace === XMLNS
        ? [[attribute.prefix === "" ? "" : attribute.local, attribute.value] as const]
        : [],
    );
    const namespaces: ReadonlyMap<string, string> = new Map([["xml", XML], ...declared]);
    // A document with no `targetNamespace` has an absent `{target namespace}` (§3.15.2).
    const targetNamespace = Option.getOrElse(
      attributeOf(root, "targetNamespace"),
      () => noNamespace,
    );

    return {
      attributeGroups: yield* componentsOf(root, "attributeGroup"),
      attributes: yield* componentsOf(root, "attribute"),
      complexTypes: yield* componentsOf(root, "complexType"),
      declarations: typesByName(typedDeclarationsIn(root)),
      elements: yield* componentsOf(root, "element"),
      groups: yield* componentsOf(root, "group"),
      namespaces,
      qualified: Option.getOrElse(
        yield* formOf(root, "elementFormDefault"),
        () => elementFormDefault,
      ),
      simpleTypes: yield* componentsOf(root, "simpleType"),
      targetNamespace,
      targetPrefix: yield* targetPrefixOf(namespaces, targetNamespace),
    };
  });

/**
 * Merge one kind of top-level component over a schema's documents.
 *
 * @param kind - The kind's construct name, for the refusal.
 * @param maps - Each document's components of that kind, in reading order.
 * @returns The components of every document, or an {@link XsdReadingError} when two documents
 *   declare a component of the kind under one name.
 */
const mergeComponents = (
  kind: string,
  maps: readonly ReadonlyMap<string, Element>[],
): Result.Result<ReadonlyMap<string, Element>, XsdReadingError> => {
  const merged = new Map<string, Element>();

  for (const map of maps) {
    for (const [name, component] of map) {
      if (merged.has(name)) {
        return refuse(`two documents of the schema both declare a top-level xs:${kind} ${name}`);
      }

      merged.set(name, component);
    }
  }

  return Result.succeed(merged);
};

/**
 * The substitution groups of a schema: for every top-level element, the top-level elements that
 * name it in their `substitutionGroup`, in document order.
 *
 * @param elements - The schema's top-level element declarations, in document order.
 * @param namespaces - The prefixes the schema binds.
 * @param targetNamespace - The schema's target namespace.
 * @returns The members by head, none for an element that heads no group, or an
 *   {@link XsdReadingError} for a head that is not a top-level element of the schema.
 */
const substitutionsOf = (
  elements: ReadonlyMap<string, Element>,
  namespaces: ReadonlyMap<string, string>,
  targetNamespace: string,
): Result.Result<ReadonlyMap<string, readonly string[]>, XsdReadingError> =>
  Result.gen(function* substitutionsOfBody() {
    const members = new Map<string, string[]>([...elements.keys()].map((name) => [name, []]));

    for (const [name, declaration] of elements) {
      for (const lexical of listAttributeOf(declaration, "substitutionGroup")) {
        const head = yield* resolveIn(namespaces, lexical);
        const group =
          head.namespace === targetNamespace
            ? Option.fromNullishOr(members.get(head.local))
            : Option.none();

        if (Option.isNone(group)) {
          return yield* refuse(
            `the element ${name} names ${lexical} as its substitution group head, which is no top-level element of this schema`,
          );
        }

        group.value.push(name);
      }
    }

    return members;
  });

/**
 * Whether two prefix maps bind the same prefixes to the same namespaces.
 *
 * @param left - One map.
 * @param right - The other.
 * @returns Whether they are equal.
 */
const sameBindings = (
  left: ReadonlyMap<string, string>,
  right: ReadonlyMap<string, string>,
): boolean =>
  left.size === right.size &&
  [...left].every(([prefix, namespace]) => right.get(prefix) === namespace);

/**
 * Index a schema read from one document and the documents it includes.
 *
 * Every document must have the first one's target namespace, bind the same prefixes and have the
 * same `elementFormDefault`, so one set of bindings resolves every QName of the schema; the
 * components are the union of the documents', `declarations` lists each name's types over the
 * documents in reading order, and the substitution groups are read over the union.
 *
 * @param documents - The schema documents as crust read them, the including document first.
 * @returns The index, or an {@link XsdReadingError} for no document, a root that is not
 *   `xs:schema`, documents that disagree on the three, or a component two documents declare.
 */
export const indexSchemas = (
  documents: readonly XmlDocument[],
): Result.Result<XsdSchema, XsdReadingError> =>
  Result.gen(function* indexSchemasBody() {
    const parts: DocumentIndex[] = [];

    for (const document of documents) {
      parts.push(yield* indexDocument(document));
    }

    const [first, ...rest] = parts;

    if (first === undefined) {
      return yield* refuse("a schema is read from at least one document, and none was given");
    }

    for (const part of rest) {
      if (part.targetNamespace !== first.targetNamespace) {
        return yield* refuse(
          `an included document has the target namespace "${part.targetNamespace}", not the including document's "${first.targetNamespace}"`,
        );
      }

      if (!sameBindings(part.namespaces, first.namespaces) || part.qualified !== first.qualified) {
        return yield* refuse(
          "an included document binds its prefixes or sets elementFormDefault differently from the including document, which one set of bindings cannot read",
        );
      }
    }

    const elements = yield* mergeComponents(
      "element",
      parts.map((part) => part.elements),
    );

    return {
      attributeGroups: yield* mergeComponents(
        "attributeGroup",
        parts.map((part) => part.attributeGroups),
      ),
      attributes: yield* mergeComponents(
        "attribute",
        parts.map((part) => part.attributes),
      ),
      complexTypes: yield* mergeComponents(
        "complexType",
        parts.map((part) => part.complexTypes),
      ),
      declarations: typesByName(
        parts.flatMap((part) =>
          [...part.declarations].flatMap(([name, types]) =>
            types.map((type) => [name, type] as const),
          ),
        ),
      ),
      elements,
      groups: yield* mergeComponents(
        "group",
        parts.map((part) => part.groups),
      ),
      namespaces: first.namespaces,
      qualified: first.qualified,
      simpleTypes: yield* mergeComponents(
        "simpleType",
        parts.map((part) => part.simpleTypes),
      ),
      substitutions: yield* substitutionsOf(elements, first.namespaces, first.targetNamespace),
      targetNamespace: first.targetNamespace,
      targetPrefix: first.targetPrefix,
    };
  });

/**
 * Index a schema document that includes no other.
 *
 * @param document - A schema document as crust read it.
 * @returns The index, or an {@link XsdReadingError} when the root is not `xs:schema`.
 */
export const indexSchema = (document: XmlDocument): Result.Result<XsdSchema, XsdReadingError> =>
  indexSchemas([document]);

/**
 * Resolve a QName-valued attribute through the namespaces the schema element declares.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param schema - The schema the value is written in.
 * @param lexical - The value as written, such as `xs:string` or `ChoiceInteractionDType`.
 * @returns The resolved name; an unprefixed name with no default namespace is in no namespace. A
 *   prefix the schema element does not declare is an {@link XsdReadingError}.
 */
export const resolve = (
  schema: XsdSchema,
  lexical: string,
): Result.Result<QName, XsdReadingError> => resolveIn(schema.namespaces, lexical);

/**
 * The component a resolved name names, when it is a top-level component of this schema.
 *
 * @param schema - The schema to look in.
 * @param components - One of the schema's component maps.
 * @param name - The resolved name.
 * @returns The component, or `None` for a built-in, a foreign name or an undeclared one.
 */
const componentOf = (
  schema: XsdSchema,
  components: ReadonlyMap<string, Element>,
  name: QName,
): Option.Option<Element> =>
  name.namespace === schema.targetNamespace
    ? Option.fromNullishOr(components.get(name.local))
    : Option.none();

/**
 * The component a QName-valued attribute must name.
 *
 * Public, and stable while the vocabularies are derived: other vocabularies' readings share it.
 *
 * @param schema - The schema the value is written in.
 * @param components - The component map of the kind the value must name.
 * @param kind - That kind's construct name, for the refusal.
 * @param lexical - The value as written.
 * @returns The component, or an {@link XsdReadingError} when the schema declares none by that name.
 */
export const requireComponent = (
  schema: XsdSchema,
  components: ReadonlyMap<string, Element>,
  kind: string,
  lexical: string,
): Result.Result<Element, XsdReadingError> =>
  Result.gen(function* requireComponentBody() {
    const name = yield* resolve(schema, lexical);

    return yield* Option.match(componentOf(schema, components, name), {
      onNone: () => refuse(`no top-level xs:${kind} named ${lexical} is declared in this document`),
      onSome: (component) => Result.succeed(component),
    });
  });

/**
 * The first child of a construct that is one of the XSD constructs it must hold.
 *
 * @param node - The construct.
 * @param locals - The constructs it may hold, in order of preference.
 * @returns The first child found, or an {@link XsdReadingError} naming the construct when it holds
 *   none of them.
 */
const requireChild = (
  node: Element,
  locals: readonly string[],
): Result.Result<Element, XsdReadingError> =>
  Option.match(
    Arr.findFirst(elementsOf(node), (child) => locals.some((local) => isXs(child, local))),
    {
      onNone: () =>
        refuse(`an ${node.qname} holds none of ${locals.map((local) => `xs:${local}`).join(", ")}`),
      onSome: (child) => Result.succeed(child),
    },
  );

/**
 * The values of the XSD `whiteSpace` facet.
 */
const whiteSpaceFacets = ["preserve", "replace", "collapse"] as const;

/**
 * A simple type as a declaration or a derivation refers to it: by a QName, or as an anonymous
 * definition written in place.
 */
export type SimpleTypeRef =
  | { readonly _tag: "Named"; readonly lexical: string }
  | { readonly _tag: "Anonymous"; readonly definition: Element };

/**
 * The class of a built-in type: `xs:string` preserves, `xs:normalizedString` replaces, and every
 * other built-in collapses, but for `xs:anySimpleType`, the type of an attribute declared with no
 * type, which preserves: XML Schema 1.0 Part 1, 3.1.4, normalizes a value validated by the simple
 * ur-type definition "as in the preserve case".
 *
 * @param local - The built-in's local name.
 * @returns Its class.
 */
const builtinWhiteSpace = (local: string): WhiteSpace => {
  if (local === "string" || local === "anySimpleType") {
    return "preserve";
  }

  return local === "normalizedString" ? "replace" : "collapse";
};

/**
 * The `whiteSpace` class of a simple type.
 *
 * @param schema - The schema the reference is written in.
 * @param ref - The type, by name or as an anonymous definition.
 * @returns Its class, or an {@link XsdReadingError} for a name that is no built-in and no simple
 *   type of the document, or a definition that is no list, union or restriction.
 */
const whiteSpaceOf = (
  schema: XsdSchema,
  ref: SimpleTypeRef,
): Result.Result<WhiteSpace, XsdReadingError> =>
  Result.gen(function* whiteSpaceOfBody() {
    if (ref._tag === "Named") {
      const name = yield* resolve(schema, ref.lexical);

      if (name.namespace === XS) {
        return builtinWhiteSpace(name.local);
      }

      const definition = yield* requireComponent(
        schema,
        schema.simpleTypes,
        "simpleType",
        ref.lexical,
      );

      return yield* whiteSpaceOf(schema, { _tag: "Anonymous", definition });
    }

    const variety = yield* requireChild(ref.definition, ["list", "union", "restriction"]);

    if (isXs(variety, "list")) {
      return "collapse";
    }

    if (isXs(variety, "union")) {
      const members: SimpleTypeRef[] = [
        ...listAttributeOf(variety, "memberTypes").map((lexical) => ({
          _tag: "Named" as const,
          lexical,
        })),
        ...xsChildren(variety, "simpleType").map((definition) => ({
          _tag: "Anonymous" as const,
          definition,
        })),
      ];
      const classes: WhiteSpace[] = [];

      for (const member of members) {
        classes.push(yield* whiteSpaceOf(schema, member));
      }

      return classes.length > 0 && classes.every((value) => value === "collapse")
        ? "collapse"
        : "union";
    }

    const facet = firstXs(variety, "whiteSpace");

    if (Option.isSome(facet)) {
      const value = yield* requireAttribute(facet.value, "value");

      return yield* Option.match(
        Arr.findFirst(whiteSpaceFacets, (candidate) => candidate === value),
        {
          onNone: () => refuse(`an xs:whiteSpace facet has the value ${value}`),
          onSome: (known) => Result.succeed(known),
        },
      );
    }

    const base = attributeOf(variety, "base");

    if (Option.isSome(base)) {
      return yield* whiteSpaceOf(schema, { _tag: "Named", lexical: base.value });
    }

    const definition = yield* requireChild(variety, ["simpleType"]);

    return yield* whiteSpaceOf(schema, { _tag: "Anonymous", definition });
  });

/**
 * The facets of XML Schema 1.0 Part 2, 4.3, by element name: what an anonymous restriction may
 * state beside its base.
 */
const facetNames: readonly FacetName[] = [
  "enumeration",
  "fractionDigits",
  "length",
  "maxExclusive",
  "maxInclusive",
  "maxLength",
  "minExclusive",
  "minInclusive",
  "minLength",
  "pattern",
  "totalDigits",
  "whiteSpace",
];

/**
 * Write a QName-valued reference to a type as the inventory writes it.
 *
 * Public, and stable while the vocabularies are derived: every vocabulary's types are spelled with
 * it, so SSML's `xsd:token` is written `xs:token` as the ASI and MathML schemas write it.
 *
 * @param schema - The schema the reference is written in.
 * @param lexical - The QName as written, such as `xsd:token` or `m:length`.
 * @returns `xs:<local>` for a name in the XML Schema namespace, whatever prefix the schema binds to
 *   it, and any other name as written; an {@link XsdReadingError} for an undeclared prefix.
 */
export const spell = (schema: XsdSchema, lexical: string): Result.Result<string, XsdReadingError> =>
  Result.map(resolve(schema, lexical), (name) =>
    name.namespace === XS ? `xs:${name.local}` : lexical,
  );

/**
 * Read one facet of an anonymous restriction.
 *
 * @param node - A child of the `xs:restriction` other than its annotation and its anonymous base.
 * @returns The facet, or an {@link XsdReadingError} for an element that is no XSD facet or has no
 *   `value`.
 */
const facetOf = (node: Element): Result.Result<Facet, XsdReadingError> =>
  Result.gen(function* facetOfBody() {
    const facet = yield* Option.match(
      Arr.findFirst(facetNames, (name) => isXs(node, name)),
      {
        onNone: () => refuse(`an xs:restriction holds an ${node.qname}, which is no XSD facet`),
        onSome: (name) => Result.succeed(name),
      },
    );

    return { facet, value: yield* requireAttribute(node, "value") };
  });

/**
 * Read an anonymous simple type's definition.
 *
 * Public, and stable while the vocabularies are derived: a vocabulary whose kinds have simple
 * content of an anonymous type reads that type with it.
 *
 * @param schema - The schema the type is written in.
 * @param definition - The anonymous `xs:simpleType` element.
 * @returns Its definition, every named type in it spelled; an {@link XsdReadingError} for a type
 *   that is no list, union or restriction, or a restriction that holds an element no facet is.
 */
export const inlineOf = (
  schema: XsdSchema,
  definition: Element,
): Result.Result<InlineType, XsdReadingError> => {
  const named = (lexical: string): Result.Result<TypeReading, XsdReadingError> =>
    Result.map(spell(schema, lexical), (name) => ({ _tag: "named", name }) as const);
  const referenced = (
    holder: Element,
    attribute: string,
  ): Result.Result<TypeReading, XsdReadingError> =>
    Option.match(attributeOf(holder, attribute), {
      onNone: () =>
        Result.flatMap(requireChild(holder, ["simpleType"]), (nested) => inlineOf(schema, nested)),
      onSome: named,
    });

  return Result.gen(function* inlineOfBody() {
    const variety = yield* requireChild(definition, ["list", "union", "restriction"]);

    if (isXs(variety, "list")) {
      return { _tag: "list", item: yield* referenced(variety, "itemType") } as const;
    }

    if (isXs(variety, "union")) {
      const members: TypeReading[] = [];

      for (const lexical of listAttributeOf(variety, "memberTypes")) {
        members.push(yield* named(lexical));
      }

      for (const nested of xsChildren(variety, "simpleType")) {
        members.push(yield* inlineOf(schema, nested));
      }

      return { _tag: "union", members } as const;
    }

    const facets: Facet[] = [];

    for (const node of elementsOf(variety)) {
      if (!isXs(node, "annotation") && !isXs(node, "simpleType")) {
        facets.push(yield* facetOf(node));
      }
    }

    return {
      _tag: "restriction",
      base: yield* referenced(variety, "base"),
      facets,
    } as const;
  });
};

/**
 * The designator the inventory records for a type: a named type's name, or for an anonymous one,
 * in place of a name, `list` or `union`, or for a restriction its base's designator.
 *
 * Public, and stable while the vocabularies are derived: a vocabulary that records an anonymous
 * type names it with it.
 *
 * @param type - The type.
 * @returns Its designator; a restriction's is read through nested anonymous restrictions to the
 *   named type, list or union they restrict.
 */
export const designatorOf = (type: TypeReading): string =>
  Match.valueTags(type, {
    list: () => "list",
    named: ({ name }) => name,
    restriction: ({ base }) => designatorOf(base),
    union: () => "union",
  });

/**
 * Read the simple type a value is read under.
 *
 * Public, and stable while the vocabularies are derived: a vocabulary whose kinds are declared with
 * a simple type reads their text's type with it.
 *
 * @param schema - The schema the reference is written in.
 * @param ref - The type, by name or as an anonymous definition.
 * @returns Its designator, its definition when anonymous, and its class; an {@link XsdReadingError}
 *   for a type the reading rules do not read.
 */
export const valueTypeOf = (
  schema: XsdSchema,
  ref: SimpleTypeRef,
): Result.Result<ValueType, XsdReadingError> =>
  Result.gen(function* valueTypeOfBody() {
    const whiteSpace = yield* whiteSpaceOf(schema, ref);

    if (ref._tag === "Named") {
      return { inline: Option.none(), type: yield* spell(schema, ref.lexical), whiteSpace };
    }

    const inline = yield* inlineOf(schema, ref.definition);

    return { inline: Option.some(inline), type: designatorOf(inline), whiteSpace };
  });

/**
 * What an `xs:attribute` states of its attribute whatever its type: its name, and the declared use
 * and default.
 */
export interface AttributeUse {
  /**
   * The `xs:attribute` that declares or references it, which its provenance cites.
   */
  readonly declaration: Element;
  readonly default: Option.Option<string>;
  readonly name: string;
  readonly use: "required" | "optional";
}

/**
 * One attribute an XSD type declares or references, as the reading finds it: its use, and either
 * the simple type its declaration states (`declared`) or, for a reference into the XML namespace
 * (`xml`), no type here, since `xml.xsd` declares it and `declarations.ts` reads it there.
 */
export type AttributeRow = AttributeUse &
  (({ readonly _tag: "declared" } & ValueType) | { readonly _tag: "xml" });

/**
 * The type of an attribute declared with neither a `type` nor an anonymous type: the simple
 * ur-type, `xs:anySimpleType` (XML Schema 1.0 Part 1, §3.2.2, `{type definition}`), its value
 * preserved ({@link builtinWhiteSpace}).
 */
const untypedAttribute: ValueType = {
  inline: Option.none(),
  type: "xs:anySimpleType",
  whiteSpace: builtinWhiteSpace("anySimpleType"),
};

/**
 * An attribute declaration's `use` when it states none (XML Schema 1.0 Part 1, §3.2.2,
 * `use = (optional | prohibited | required) : optional`).
 */
const attributeUseDefault = "optional";

/**
 * The simple type of a declaration that names its attribute.
 *
 * A declaration with neither a `type` nor an anonymous type has {@link untypedAttribute}'s.
 *
 * @param schema - The schema the declaration is in.
 * @param declaration - The `xs:attribute` element.
 * @returns The type, or an {@link XsdReadingError} for a type the reading rules do not read.
 */
export const declaredType = (
  schema: XsdSchema,
  declaration: Element,
): Result.Result<ValueType, XsdReadingError> => {
  const type = attributeOf(declaration, "type");

  if (Option.isSome(type)) {
    return valueTypeOf(schema, { _tag: "Named", lexical: type.value });
  }

  return Option.match(firstXs(declaration, "simpleType"), {
    onNone: () => Result.succeed(untypedAttribute),
    onSome: (definition) => valueTypeOf(schema, { _tag: "Anonymous", definition }),
  });
};

/**
 * Read one attribute declaration or reference.
 *
 * @param schema - The schema the declaration is in.
 * @param declaration - The `xs:attribute` element.
 * @returns The row, or an {@link XsdReadingError} for a reference outside the XML namespace, a
 *   `use` of `prohibited`, or a type the reading rules do not read.
 */
const attributeRow = (
  schema: XsdSchema,
  declaration: Element,
): Result.Result<AttributeRow, XsdReadingError> =>
  Result.gen(function* attributeRowBody() {
    const named = attributeOf(declaration, "name");
    const name = Option.isSome(named) ? named.value : yield* requireAttribute(declaration, "ref");
    const use = Option.getOrElse(attributeOf(declaration, "use"), () => attributeUseDefault);

    if (use !== "required" && use !== "optional") {
      return yield* refuse(`the attribute ${name} has use="${use}"`);
    }

    const held = { declaration, default: attributeOf(declaration, "default"), name, use } as const;

    if (Option.isSome(named)) {
      return { _tag: "declared", ...held, ...(yield* declaredType(schema, declaration)) };
    }

    if ((yield* resolve(schema, name)).namespace !== XML) {
      return yield* refuse(`the attribute reference ${name} is not in the XML namespace`);
    }

    return { _tag: "xml", ...held };
  });

/**
 * The attribute declarations a holder states itself: its own `xs:attribute` children, then those
 * of each attribute group it references, in reference order.
 *
 * @param schema - The schema the holder is in.
 * @param holder - A complex type, a derivation step or an attribute group.
 * @returns The declarations, or an {@link XsdReadingError} for an unknown attribute group.
 */
const ownAttributes = (
  schema: XsdSchema,
  holder: Element,
): Result.Result<readonly Element[], XsdReadingError> =>
  Result.gen(function* ownAttributesBody() {
    const found = [...xsChildren(holder, "attribute")];

    for (const reference of xsChildren(holder, "attributeGroup")) {
      const group = yield* requireComponent(
        schema,
        schema.attributeGroups,
        "attributeGroup",
        yield* requireAttribute(reference, "ref"),
      );

      found.push(...(yield* ownAttributes(schema, group)));
    }

    return found;
  });

/**
 * The derivation step of a complex type: the `extension` or `restriction` of its
 * `complexContent` or `simpleContent`, of which a complex type holds at most one (XML Schema 1.0
 * Part 1, §3.4.2, `(simpleContent | complexContent | ...)`).
 *
 * Public, and stable while the vocabularies are derived: the content-model IR reads a type's base
 * with it.
 *
 * @param complexType - The `xs:complexType` element.
 * @returns The step, `None` for a type with neither content child, or an {@link XsdReadingError}
 *   for a type with both, or a content child with neither step.
 */
export const derivationOf = (
  complexType: Element,
): Result.Result<Option.Option<Element>, XsdReadingError> => {
  const contents = elementsOf(complexType).filter(
    (child) => isXs(child, "complexContent") || isXs(child, "simpleContent"),
  );

  if (contents.length > 1) {
    return refuse(`an ${complexType.qname} holds ${contents.length} content children, not one`);
  }

  return Option.match(Arr.head(contents), {
    onNone: () => Result.succeed(Option.none()),
    onSome: (content) =>
      Result.map(requireChild(content, ["extension", "restriction"]), Option.some),
  });
};

/**
 * The complex type of this document a derivation step's base names.
 *
 * @param schema - The schema the step is in.
 * @param step - The `xs:extension` or `xs:restriction` element.
 * @returns The base type, or `None` for a built-in or foreign base such as `xs:anyType`.
 */
const baseTypeOf = (
  schema: XsdSchema,
  step: Element,
): Result.Result<Option.Option<Element>, XsdReadingError> =>
  Result.gen(function* baseTypeOfBody() {
    const base = yield* resolve(schema, yield* requireAttribute(step, "base"));

    return componentOf(schema, schema.complexTypes, base);
  });

/**
 * The attribute declarations a complex type holds, its base type's included.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns The declarations in reading order (see the module comment).
 */
const attributesOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<readonly Element[], XsdReadingError> =>
  Result.gen(function* attributesOfBody() {
    const found = [...(yield* ownAttributes(schema, complexType))];
    const step = yield* derivationOf(complexType);

    if (Option.isSome(step)) {
      const base = yield* baseTypeOf(schema, step.value);

      if (Option.isSome(base)) {
        found.push(...(yield* attributesOf(schema, base.value)));
      }

      found.push(...(yield* ownAttributes(schema, step.value)));
    }

    return found;
  });

/**
 * Read the attributes a complex type holds, its base type's included, in reading order (see the
 * module comment).
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns Each declaration's or reference's row, or an {@link XsdReadingError} for one the
 *   reading rules do not read.
 */
export const attributeRowsOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<readonly AttributeRow[], XsdReadingError> =>
  Result.flatMap(attributesOf(schema, complexType), (declarations) =>
    Result.all(declarations.map((declaration) => attributeRow(schema, declaration))),
  );

/**
 * An attribute wildcard as the IR states it: its namespace constraint as the XSD writes it, and its
 * processing.
 */
export type AttributeWildcardReading = Pick<AttributeWildcard, "namespace" | "processing">;

/**
 * The `namespace` values of a wildcard the reading covers: every one the pinned XSDs write. A list
 * of namespace names, which no pinned XSD writes, is refused.
 */
const namespaceReadings: ReadonlyMap<string, NamespaceConstraint> = new Map([
  ["##any", "##any"],
  ["##local", "##local"],
  ["##other", "##other"],
]);

/**
 * What each `processContents` value of a wildcard means.
 */
const processingReadings: ReadonlyMap<string, Processing> = new Map([
  ["lax", "lax"],
  ["skip", "skip"],
  ["strict", "strict"],
]);

/**
 * The XSD defaults of a wildcard's attributes, read when it omits them: `namespace = ... : ##any`
 * and `processContents = (lax | skip | strict) : strict`, alike for `xs:any` and `xs:anyAttribute`
 * (XML Schema 1.0 Part 1, §3.10.2 and §3.4.2).
 */
const wildcardDefaults = { namespace: "##any", processContents: "strict" } as const;

/**
 * Read a value of a wildcard's attribute through its table of readings.
 *
 * @param node - The wildcard.
 * @param name - The attribute, `namespace` or `processContents`.
 * @param readings - What each value the reading covers means.
 * @returns The value's meaning, its {@link wildcardDefaults} entry's when the wildcard omits it, or
 *   an {@link XsdReadingError} for a value the table lacks.
 */
const readWildcardAttribute = <A>(
  node: Element,
  name: keyof typeof wildcardDefaults,
  readings: ReadonlyMap<string, A>,
): Result.Result<A, XsdReadingError> => {
  const value = Option.getOrElse(attributeOf(node, name), () => wildcardDefaults[name]);

  return Option.match(Option.fromNullishOr(readings.get(value)), {
    onNone: () => refuse(`an ${node.qname} has ${name}="${value}", which the IR does not read`),
    onSome: (reading) => Result.succeed(reading),
  });
};

/**
 * Read a wildcard's namespace constraint and processing, with the XSD defaults
 * ({@link wildcardDefaults}).
 *
 * Public, and stable while the vocabularies are derived: the content-model IR reads an element
 * wildcard with it.
 *
 * @param node - An `xs:any` or `xs:anyAttribute` element.
 * @returns The wildcard, or an {@link XsdReadingError} for a namespace list or an unknown
 *   `processContents`, which the IR does not hold.
 */
export const wildcardOf = (
  node: Element,
): Result.Result<AttributeWildcardReading, XsdReadingError> =>
  Result.gen(function* wildcardOfBody() {
    return {
      namespace: yield* readWildcardAttribute(node, "namespace", namespaceReadings),
      processing: yield* readWildcardAttribute(node, "processContents", processingReadings),
    };
  });

/**
 * The attribute groups a holder references, their own references included, in reading order.
 *
 * @param schema - The schema the holder is in.
 * @param holder - A complex type, a derivation step or an attribute group.
 * @returns The groups, or an {@link XsdReadingError} for an unknown attribute group.
 */
const attributeGroupsOf = (
  schema: XsdSchema,
  holder: Element,
): Result.Result<readonly Element[], XsdReadingError> =>
  Result.gen(function* attributeGroupsOfBody() {
    const found: Element[] = [];

    for (const reference of xsChildren(holder, "attributeGroup")) {
      const group = yield* requireComponent(
        schema,
        schema.attributeGroups,
        "attributeGroup",
        yield* requireAttribute(reference, "ref"),
      );

      found.push(group, ...(yield* attributeGroupsOf(schema, group)));
    }

    return found;
  });

/**
 * The wildcard holders state themselves, the complete wildcard of XML Schema 1.0 Part 1, 3.4.2:
 * each holder's `xs:anyAttribute` and its attribute groups'.
 *
 * @param schema - The schema the holders are in.
 * @param holders - A complex type, and its derivation step when it has one.
 * @returns The one wildcard they state, or `None`; an {@link XsdReadingError} for two, whose
 *   intersection the reading does not compute.
 */
const completeWildcardOf = (
  schema: XsdSchema,
  holders: readonly Element[],
): Result.Result<Option.Option<AttributeWildcardReading>, XsdReadingError> =>
  Result.gen(function* completeWildcardOfBody() {
    const found: AttributeWildcardReading[] = [];

    for (const holder of holders) {
      for (const node of [holder, ...(yield* attributeGroupsOf(schema, holder))]) {
        for (const wildcard of xsChildren(node, "anyAttribute")) {
          found.push(yield* wildcardOf(wildcard));
        }
      }
    }

    return found.length > 1
      ? yield* refuse(
          `a complex type states ${found.length} attribute wildcards, whose intersection is not read`,
        )
      : Arr.head(found);
  });

/**
 * Read a complex type's attribute wildcard, as XML Schema 1.0 Part 1, 3.4.2, builds it.
 *
 * A type with no derivation, and a restriction, hold their complete wildcard alone. An extension
 * holds the union of its complete wildcard and its base type's (XML Schema 1.0 Part 1, 3.10.6):
 * the base's when it states none, else `##any` when either is `##any`, and otherwise the complete
 * wildcard's own constraint, with its processing. Both wildcards of an extension are its schema's,
 * so two `##other`s exclude the same namespace and their union is `##other`; no pinned type
 * extends a `##local` wildcard, whose union with `##other` this reading leaves at the complete
 * wildcard's.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element, named or anonymous.
 * @returns The wildcard, `None` when the type admits only its declared attributes; an
 *   {@link XsdReadingError} for an extension of `xs:anyType`, whose wildcard is not read.
 * @see {@link https://www.w3.org/TR/xmlschema-1/#Complex_Type_Definitions | XML Schema 1.0, Complex Type Definitions}
 */
export const attributeWildcardOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<Option.Option<AttributeWildcardReading>, XsdReadingError> =>
  Result.gen(function* attributeWildcardOfBody() {
    const step = yield* derivationOf(complexType);
    const complete = yield* completeWildcardOf(schema, [complexType, ...Option.toArray(step)]);

    if (Option.isNone(step) || isXs(step.value, "restriction")) {
      return complete;
    }

    const base = yield* resolve(schema, yield* requireAttribute(step.value, "base"));

    if (base.namespace === XS && base.local === "anyType") {
      return yield* refuse("the attribute wildcard of an extension of xs:anyType is not read");
    }

    const baseType = componentOf(schema, schema.complexTypes, base);
    const inherited = Option.isSome(baseType)
      ? yield* attributeWildcardOf(schema, baseType.value)
      : Option.none();

    return Option.match(complete, {
      onNone: () => inherited,
      onSome: (own) =>
        Option.some({
          namespace: Option.exists(inherited, (wildcard) => wildcard.namespace === "##any")
            ? "##any"
            : own.namespace,
          processing: own.processing,
        }),
    });
  });

/**
 * Read an `xs:boolean` attribute of an XSD construct.
 *
 * @param node - The construct.
 * @param name - The attribute, such as `mixed` or `abstract`.
 * @returns Its value, `None` when the construct does not carry it, or an {@link XsdReadingError}
 *   for a value that is no `xs:boolean`.
 */
const booleanAttributeOf = (
  node: Element,
  name: string,
): Result.Result<Option.Option<boolean>, XsdReadingError> =>
  Option.match(attributeOf(node, name), {
    onNone: () => Result.succeed(Option.none()),
    onSome: (value) =>
      Option.match(booleanOf(value), {
        onNone: () => refuse(`an ${node.qname} has ${name}="${value}", which is no xs:boolean`),
        onSome: (held) => Result.succeed(Option.some(held)),
      }),
  });

/**
 * `mixed`'s XSD default, read for a type that states it neither on itself nor on its
 * `complexContent`, and has no base type of the schema to take it from (XML Schema 1.0 Part 1,
 * §3.4.2, `mixed = boolean : false`).
 */
const mixedDefault = false;

/**
 * Whether a complex type admits character data between its children.
 *
 * Public, and stable while the vocabularies are derived: the content-model IR reads a type's
 * `{content type}` with it.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns Its own or its `complexContent`'s `mixed`, else its base type's, else
 *   {@link mixedDefault}.
 */
export const mixedOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<boolean, XsdReadingError> =>
  Result.gen(function* mixedOfBody() {
    const content = firstXs(complexType, "complexContent");

    for (const holder of [complexType, ...Option.toArray(content)]) {
      const mixed = yield* booleanAttributeOf(holder, "mixed");

      if (Option.isSome(mixed)) {
        return mixed.value;
      }
    }

    if (Option.isNone(content)) {
      return mixedDefault;
    }

    const step = yield* requireChild(content.value, ["extension", "restriction"]);
    const base = yield* baseTypeOf(schema, step);

    return Option.isSome(base) ? yield* mixedOf(schema, base.value) : mixedDefault;
  });

/**
 * Read the type of a complex type's simple content: the base its `xs:extension` extends, through
 * the simple content of a complex base.
 *
 * @param schema - The schema the type is in.
 * @param simpleContent - The type's `xs:simpleContent` element.
 * @returns The text's type, or an {@link XsdReadingError} for a `simpleContent` restriction, which
 *   the reading rules do not read, or a complex base with no simple content.
 */
export const textTypeOf = (
  schema: XsdSchema,
  simpleContent: Element,
): Result.Result<ValueType, XsdReadingError> =>
  Result.gen(function* textTypeOfBody() {
    const step = yield* requireChild(simpleContent, ["extension", "restriction"]);

    if (!isXs(step, "extension")) {
      return yield* refuse("a simpleContent restriction is not read");
    }

    const lexical = yield* requireAttribute(step, "base");
    const base = componentOf(schema, schema.complexTypes, yield* resolve(schema, lexical));

    if (Option.isNone(base)) {
      return yield* valueTypeOf(schema, { _tag: "Named", lexical });
    }

    return yield* Option.match(firstXs(base.value, "simpleContent"), {
      onNone: () =>
        refuse(`a simpleContent extends the complex type ${lexical}, which has no simple content`),
      onSome: (inherited) => textTypeOf(schema, inherited),
    });
  });

/**
 * The occurrence a particle allows: the least count and the greatest, `None` when unbounded.
 */
export interface Occurs {
  readonly max: Option.Option<number>;
  readonly min: number;
}

/**
 * A particle's `minOccurs` and `maxOccurs` when it states neither (XML Schema 1.0 Part 1, §3.9.2,
 * `maxOccurs = (nonNegativeInteger | unbounded) : 1` and `minOccurs = nonNegativeInteger : 1`).
 */
const occursDefault = 1;

/**
 * Exactly one occurrence, the default bounds of a particle.
 */
const once: Occurs = { max: Option.some(occursDefault), min: occursDefault };

/**
 * No occurrence: what a particle that holds nothing counted contributes.
 */
const none: Occurs = { max: Option.some(0), min: 0 };

/**
 * Multiply two occurrences, as a particle's own bounds compose with its enclosing particle's.
 *
 * A bound of zero on either side makes the product's maximum zero, unbounded or not.
 *
 * @param outer - The enclosing particle's occurrence.
 * @param inner - The particle's own.
 * @returns The product.
 */
const times = (outer: Occurs, inner: Occurs): Occurs => ({
  max:
    Option.contains(outer.max, 0) || Option.contains(inner.max, 0)
      ? Option.some(0)
      : Option.zipWith(outer.max, inner.max, (a, b) => a * b),
  min: outer.min * inner.min,
});

/**
 * Read an occurrence bound.
 *
 * @param particle - The particle the bound is on.
 * @param value - The bound as written.
 * @returns The count, or an {@link XsdReadingError} when it is not a non-negative integer.
 */
const countOf = (particle: Element, value: string): Result.Result<number, XsdReadingError> =>
  /^\d+$/u.test(value)
    ? Result.succeed(Number(value))
    : refuse(`an ${particle.qname} has the occurrence bound ${value}`);

/**
 * The occurrence a particle's `minOccurs` and `maxOccurs` state, each {@link occursDefault} when
 * absent.
 *
 * Public, and stable while the vocabularies are derived: the content-model IR (`models.ts`) reads
 * content models' structure with it.
 *
 * @param particle - An element, a compositor, a group reference or a wildcard.
 * @returns Its occurrence.
 */
export const occursOf = (particle: Element): Result.Result<Occurs, XsdReadingError> =>
  Result.gen(function* occursOfBody() {
    const min = attributeOf(particle, "minOccurs");
    const max = attributeOf(particle, "maxOccurs");

    return {
      max: yield* Option.match(max, {
        onNone: () => Result.succeed(Option.some(occursDefault)),
        onSome: (value) =>
          value === "unbounded"
            ? Result.succeed(Option.none())
            : Result.map(countOf(particle, value), Option.some),
      }),
      min: yield* Option.match(min, {
        onNone: () => Result.succeed(occursDefault),
        onSome: (value) => countOf(particle, value),
      }),
    };
  });

/**
 * Write a name declared in a schema's target namespace with the prefix the schema binds to it.
 *
 * @param schema - The schema.
 * @param local - The declared name.
 * @returns `prefix:local`, or `local` when the schema writes its target namespace unprefixed.
 */
export const qualify = (schema: XsdSchema, local: string): string =>
  schema.targetPrefix === "" ? local : `${schema.targetPrefix}:${local}`;

/**
 * `abstract`'s XSD default (XML Schema 1.0 Part 1, §3.3.2, `abstract = boolean : false`).
 */
const abstractDefault = false;

/**
 * Whether an element declaration is abstract, so that no element of its name is valid.
 *
 * Public, and stable while the vocabularies are derived: the content-model IR skips abstract
 * declarations with it.
 *
 * @param declaration - The `xs:element` element.
 * @returns Its `abstract` read as an `xs:boolean`, {@link abstractDefault} when it states none, or
 *   an {@link XsdReadingError} for a value that is no `xs:boolean`.
 */
export const isAbstract = (declaration: Element): Result.Result<boolean, XsdReadingError> =>
  Result.map(
    booleanAttributeOf(declaration, "abstract"),
    Option.getOrElse(() => abstractDefault),
  );

/**
 * The particles a compositor or a group definition holds, in order.
 *
 * Public, and stable while the vocabularies are derived: the content-model IR (`models.ts`) reads
 * content models' structure with it.
 *
 * @param node - The parent construct.
 * @returns Its children other than annotations.
 */
export const particlesOf = (node: Element): readonly Element[] =>
  elementsOf(node).filter((child) => !isXs(child, "annotation"));

/**
 * The particles a complex type's content states, with its base type's ahead of them for an
 * extension.
 *
 * Public, and stable while the vocabularies are derived: the content-model IR (`models.ts`) reads
 * content models' structure with it.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns The particles, in content order.
 */
export const contentParticles = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<readonly Element[], XsdReadingError> =>
  Result.gen(function* contentParticlesBody() {
    const isParticle = (node: Element): boolean => isCompositor(node) || isXs(node, "group");
    const content = firstXs(complexType, "complexContent");

    if (Option.isNone(content)) {
      return elementsOf(complexType).filter(isParticle);
    }

    const step = yield* requireChild(content.value, ["extension", "restriction"]);
    const base = isXs(step, "extension") ? yield* baseTypeOf(schema, step) : Option.none();
    const inherited = Option.isSome(base) ? yield* contentParticles(schema, base.value) : [];

    return [...inherited, ...elementsOf(step).filter(isParticle)];
  });

/**
 * The one type an element is declared with.
 *
 * Public: the operator arity reading ({@link arityOf}) finds each expression kind's type with it.
 *
 * @param schema - The schema the element is declared in.
 * @param element - The element name.
 * @returns The type, or an {@link XsdReadingError} when the element is declared with no type or
 *   several, which a dotted handle must then choose between.
 */
export const soleTypeOf = (
  schema: XsdSchema,
  element: string,
): Result.Result<string, XsdReadingError> =>
  Option.match(Option.fromNullishOr(schema.declarations.get(element)), {
    onNone: () => refuse(`the element ${element} has no declaration that states its type`),
    onSome: ([type, ...others]) =>
      others.length === 0
        ? Result.succeed(type)
        : refuse(
            `the element ${element} is declared with ${others.length + 1} types (${[type, ...others].join(", ")}), not one`,
          ),
  });

/**
 * A schema read from a pinned XSD and the pinned XSDs it includes: every document, by its path in
 * reading order, and the schema they make together.
 */
export interface SchemaSet {
  readonly documents: ReadonlyMap<SourcePath, XmlDocument>;
  readonly placed: ReadonlyMap<SourcePath, Placed>;
  readonly schema: XsdSchema;
}

/**
 * The MathML 3 XSD the ASI XSDs import, the document that includes the four that declare MathML.
 */
export const mathmlSource: SourcePath = "mathml/mathml3.xsd";

/**
 * The directive a leaf opens with when a constant of one of its anonymous types is named after
 * QTI's `shape` attribute: the lint refuses the word in a symbol, read as a description of
 * structure, and here it is the vocabulary's own name, as in `src/grammar/attributes.ts`.
 */
export const attributeNameDirective =
  "/* oxlint-disable anti-slop/no-shape-in-symbol-names -- Each anonymous type's constant is named after the attribute that declares it, and `shape` is the attribute QTI names, not a structural description. */";

/**
 * The 64 expression kinds, in the order of the arity table: the 18 leaves, then the 46 operators.
 */
export const expressionKinds = [
  "qti-base-value",
  "qti-variable",
  "qti-default",
  "qti-correct",
  "qti-map-response",
  "qti-map-response-point",
  "qti-math-constant",
  "qti-null",
  "qti-random-integer",
  "qti-random-float",
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-outcome-minimum",
  "qti-outcome-maximum",
  "qti-test-variables",
  "qti-and",
  "qti-or",
  "qti-not",
  "qti-any-n",
  "qti-match",
  "qti-equal",
  "qti-equal-rounded",
  "qti-gt",
  "qti-gte",
  "qti-lt",
  "qti-lte",
  "qti-duration-lt",
  "qti-duration-gte",
  "qti-member",
  "qti-contains",
  "qti-delete",
  "qti-substring",
  "qti-string-match",
  "qti-pattern-match",
  "qti-inside",
  "qti-multiple",
  "qti-ordered",
  "qti-repeat",
  "qti-container-size",
  "qti-is-null",
  "qti-random",
  "qti-index",
  "qti-field-value",
  "qti-sum",
  "qti-product",
  "qti-subtract",
  "qti-divide",
  "qti-power",
  "qti-integer-divide",
  "qti-integer-modulus",
  "qti-integer-to-float",
  "qti-round",
  "qti-truncate",
  "qti-round-to",
  "qti-min",
  "qti-max",
  "qti-gcd",
  "qti-lcm",
  "qti-math-operator",
  "qti-stats-operator",
  "qti-custom-operator",
] as const;

/**
 * One expression kind's child-expression multiplicity: the fewest and the most child expressions
 * its content admits, `max` `None` when unbounded.
 */
export interface ArityRow extends Occurs {
  readonly kind: (typeof expressionKinds)[number];
}

/**
 * Add counts, as consecutive particles add.
 *
 * @param counts - The counts.
 * @returns Their sum, unbounded when any is, and no occurrence for none.
 */
const sumOf = (counts: readonly Occurs[]): Occurs => {
  let total = none;

  for (const count of counts) {
    total = {
      max: Option.zipWith(total.max, count.max, (sum, max) => sum + max),
      min: total.min + count.min,
    };
  }

  return total;
};

/**
 * Combine the counts of a choice's branches: the least minimum and the greatest maximum.
 *
 * @param counts - The branches' counts.
 * @returns The choice's count, unbounded when any branch is, and no occurrence for no branch.
 */
const eitherOf = (counts: readonly Occurs[]): Occurs =>
  counts.length === 0
    ? none
    : {
        max: Option.map(Option.all(counts.map((count) => count.max)), (maxes) =>
          Math.max(...maxes),
        ),
        min: Math.min(...counts.map((count) => count.min)),
      };

/**
 * The name an element particle writes: its `name`, or the QName its `ref` names as written, of
 * which it carries exactly one (XML Schema 1.0 Part 1, §3.3.3, Schema Representation Constraint:
 * Element Declaration Representation OK, clause 2.1).
 *
 * @param particle - The `xs:element` particle.
 * @returns The name, or an {@link XsdReadingError} for a particle with neither or both.
 */
const elementNameOf = (particle: Element): Result.Result<string, XsdReadingError> =>
  Option.match(attributeOf(particle, "name"), {
    onNone: () => requireAttribute(particle, "ref"),
    onSome: (name) =>
      Option.isSome(attributeOf(particle, "ref"))
        ? refuse(`an ${particle.qname} particle carries both name and ref`)
        : Result.succeed(name),
  });

/**
 * Count the child expressions consecutive particles admit.
 *
 * An element counts once when it is an expression kind and not at all otherwise; a sequence or an
 * `all` adds its particles' counts, a choice takes the least minimum and the greatest maximum of
 * its branches, a group reference counts its group's particles, and a wildcard counts nothing. Each
 * count is multiplied by its particle's own occurrence.
 *
 * @param schema - The schema the particles are in.
 * @param particles - The particles.
 * @param kinds - The expression kinds.
 * @returns One count per particle, in order, or an {@link XsdReadingError} for a construct that is
 *   no particle.
 */
const countParticles = (
  schema: XsdSchema,
  particles: readonly Element[],
  kinds: ReadonlySet<string>,
): Result.Result<readonly Occurs[], XsdReadingError> =>
  Result.gen(function* countParticlesBody() {
    const counts: Occurs[] = [];

    for (const particle of particles) {
      const occurs = yield* occursOf(particle);

      if (isXs(particle, "element")) {
        const name = yield* elementNameOf(particle);

        counts.push(times(kinds.has(name) ? once : none, occurs));
      } else if (isXs(particle, "group")) {
        const group = yield* requireComponent(
          schema,
          schema.groups,
          "group",
          yield* requireAttribute(particle, "ref"),
        );

        counts.push(times(sumOf(yield* countParticles(schema, particlesOf(group), kinds)), occurs));
      } else if (isCompositor(particle)) {
        const inner = yield* countParticles(schema, particlesOf(particle), kinds);

        counts.push(times(isXs(particle, "choice") ? eitherOf(inner) : sumOf(inner), occurs));
      } else if (isXs(particle, "any")) {
        counts.push(none);
      } else {
        return yield* refuse(`an ${particle.qname} stands where a particle is counted`);
      }
    }

    return counts;
  });

/**
 * Read the child-expression multiplicity of every expression kind.
 *
 * @param schema - The ASI 3.0 schema.
 * @returns One row per kind of {@link expressionKinds}, in its order.
 */
export const arityOf = (schema: XsdSchema): Result.Result<readonly ArityRow[], XsdReadingError> =>
  Result.gen(function* arityOfBody() {
    const kinds: ReadonlySet<string> = new Set(expressionKinds);
    const rows: ArityRow[] = [];

    for (const kind of expressionKinds) {
      const complexType = yield* requireComponent(
        schema,
        schema.complexTypes,
        "complexType",
        yield* soleTypeOf(schema, kind),
      );
      const particles = yield* contentParticles(schema, complexType);

      rows.push({ ...sumOf(yield* countParticles(schema, particles, kinds)), kind });
    }

    return rows;
  });

/**
 * Write the arity rows as the `arity` target prints them, one kind per line, such as
 * `qti-not                  min=1 max=1`, with `*` for an unbounded maximum.
 *
 * @param rows - The rows.
 * @returns The text, without a final line break.
 */
export const printArity = (rows: readonly ArityRow[]): string =>
  rows
    .map((row) => {
      const max = Option.match(row.max, { onNone: () => "*", onSome: String });

      return `${row.kind.padEnd(24)} min=${row.min} max=${max}`;
    })
    .join("\n");

/**
 * The targets the deriver prints, in the order its help lists them.
 */
const targetNames = ["arity"] as const;

/**
 * The name of a target the deriver prints.
 */
export type Target = (typeof targetNames)[number];

/**
 * What a target derives: the pinned XSD it reads, and the text it prints from that schema.
 */
interface TargetSpec {
  readonly print: (set: SchemaSet) => Result.Result<string, XsdReadingError>;
  readonly source: SourcePath;
}

/**
 * Every target's spec.
 */
const targets = {
  arity: {
    print: ({ schema }) => Result.map(arityOf(schema), printArity),
    source: "imsqti_asiv3p0_v1p0.xsd",
  },
} as const satisfies { readonly [Name in Target]: TargetSpec };

/**
 * The pinned XSDs a schema document includes, in the order its `xs:include` elements name them.
 *
 * A `schemaLocation` is a URI reference, resolved against the URL the including document is pinned
 * at, and must be the URL of another pin. The deriver reads no `xs:redefine` or `xs:override`, and
 * refuses a document that has one rather than read it without them; `xs:import` names another
 * namespace's schema, which the including vocabulary reads by itself, and is not followed.
 *
 * @param path - The including document's pin.
 * @param document - Its tree.
 * @returns The included pins, or an {@link XsdReadingError} for a redefinition, an override, or a
 *   location that resolves to no pin.
 */
export const includesOf = (
  path: SourcePath,
  document: XmlDocument,
): Result.Result<readonly SourcePath[], XsdReadingError> =>
  Result.gen(function* includesOfBody() {
    const refused = Arr.findFirst(
      elementsOf(document.root),
      (child) => isXs(child, "redefine") || isXs(child, "override"),
    );

    if (Option.isSome(refused)) {
      return yield* refuse(
        `${path} has an ${refused.value.qname}, which redefines the components of another document`,
      );
    }

    const included: SourcePath[] = [];

    for (const include of xsChildren(document.root, "include")) {
      const location = yield* requireAttribute(include, "schemaLocation");
      const url = Option.fromNullishOr(URL.parse(location, sources[path].url));

      if (Option.isNone(url)) {
        return yield* refuse(
          `${path} includes ${location}, which does not resolve to a URL against ${sources[path].url}`,
        );
      }

      const { href } = url.value;
      const pinned = Arr.findFirst(sourcePaths, (candidate) => sources[candidate].url === href);

      if (Option.isNone(pinned)) {
        return yield* refuse(
          `${path} includes ${location}, which resolves to ${href}, a file no pin in src/vocab/derive/sources.ts describes`,
        );
      }

      included.push(pinned.value);
    }

    return included;
  });

/**
 * Read a pinned XSD, every pinned XSD it includes, and theirs, each once, and index them as one
 * schema.
 *
 * The documents are read depth first: the entry, then each document it includes, in order, each
 * followed by the documents it includes before the next.
 *
 * @param path - The entry document's pin.
 * @returns The documents in reading order and their schema.
 */
export const loadSchemaSet = Effect.fn("vocab.loadSchemaSet")(function* loadSchemaSet(
  path: SourcePath,
) {
  const documents = new Map<SourcePath, XmlDocument>();
  const placed = new Map<SourcePath, Placed>();
  const pending: SourcePath[] = [path];

  for (let next = pending.shift(); next !== undefined; next = pending.shift()) {
    if (!documents.has(next)) {
      const read = yield* readPlaced(next);

      documents.set(next, read.document);
      placed.set(next, read);
      pending.unshift(...(yield* Effect.fromResult(includesOf(next, read.document))));
    }
  }

  const schema = yield* Effect.fromResult(indexSchemas([...documents.values()]));

  return { documents, placed, schema } satisfies SchemaSet;
});

/**
 * Read a pinned XSD and the pinned XSDs it includes, and index them.
 *
 * @param path - The entry document's pin.
 * @returns The indexed schema.
 */
export const loadSchema = Effect.fn("vocab.loadSchema")(function* loadSchema(path: SourcePath) {
  return (yield* loadSchemaSet(path)).schema;
});

/**
 * Derive one target's text from its pinned XSD.
 *
 * @param target - What to derive.
 * @returns The text the command prints for it, without a final line break.
 */
export const derive = Effect.fn("vocab.derive")(function* derive(target: Target) {
  const { print, source } = targets[target];

  return yield* Effect.fromResult(print(yield* loadSchemaSet(source)));
});

/**
 * The command line: `derive <target>` prints one target to standard output.
 */
const command = Command.make(
  "derive",
  { target: Argument.Literals("target", targetNames) },
  Effect.fn("vocab.deriveCommand")(function* deriveCommand({ target }) {
    yield* Console.log(yield* derive(target));
  }),
).pipe(
  Command.withDescription(
    "Print the expression kinds' arity table, read from the pinned ASI 3.0 XSD in ~/.cache/gr8des/qti3/xsd.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
    ),
  );
}
