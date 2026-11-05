/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * The vocabulary deriver: it reads the pinned QTI XSDs through crust's `readXml` and prints what
 * the pantry's vocabulary data is derived from. It is the one source of the XSD inventory leaves,
 * the HTML content sets and the operator arity table, and it holds the XSD reading the other
 * vocabularies' derivations share.
 *
 * Run it from `packages/pantry` as `node src/vocab/derive/derive.ts <target>`. It reads only the
 * files {@link sources} pins, from the shared cache, and touches no database. Each target prints to
 * standard output:
 *
 * - `asi`, `html` and `processing` print the inventory leaf of that name from the ASI 3.0.1 XSD,
 *   unformatted. The formatter owns the layout, comment wrapping included, so the deriver writes
 *   one paragraph per comment line and one element per array line.
 * - `sets` prints the four HTML content sets of `src/schema/content/sets.ts`, from the ASI 3.0.1 XSD:
 *   each set's name, source and size, then its names in code-point order.
 * - `arity` prints the child-expression multiplicity of the 64 expression kinds from the ASI 3.0 XSD,
 *   the table `src/schema/seed/operator-arity.ts` transcribes.
 * - `mathml` prints the MathML leaf, `src/vocab/inventory/mathml.ts`, from `mathml/mathml3.xsd` and
 *   the four documents it includes, unformatted like the others.
 *
 * A leaf is regenerated, `html`, `processing` and `mathml` likewise (the MathML leaf into
 * `src/vocab/inventory/`), with:
 *
 * ```sh
 * node src/vocab/derive/derive.ts asi > src/schema/content/inventory/asi.ts
 * pnpm exec vp fmt src/schema/content/inventory/asi.ts
 * ```
 *
 * The deriver imports nothing that reads the inventory, so it still runs while a leaf is being
 * rewritten. `derive.test.ts` checks every output against the committed file it feeds.
 *
 * Reading rules, stated once for every target:
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
 *   `complexContent` extension of a type of this document. A `complexContent` restriction states
 *   its whole content itself.
 * - A content model is read to its element references, each with its own occurrence bounds multiplied
 *   by those of every enclosing compositor and group reference, unbounded as `None`. A `choice`
 *   whose references hold two or more distinct names is also recorded as a choice group, after the
 *   groups nested inside it. A reference to an abstract element or a substitution group head is
 *   every element the group admits, in document order, and a choice group of its own unless it is
 *   an alternative of a choice that occurs once. A local declaration in the target namespace
 *   (`elementFormDefault="qualified"` or `form`) is written with the target namespace's prefix. An
 *   element wildcard references nothing and is recorded as `wildcard`.
 * - A complex type's attributes are its own declarations, then those of its attribute groups in
 *   reference order. A type derived by extension or restriction lists its base type's attributes,
 *   then those of the derivation step.
 * - An attribute declared with no type has `xs:anySimpleType`. Its `whiteSpace` class is `collapse`
 *   for a list and for every built-in but `xs:string` and `xs:anySimpleType` (`preserve`) and
 *   `xs:normalizedString` (`replace`); a restriction takes its own `whiteSpace` facet or else its
 *   base's class; a union is `collapse` when every member is, else `union`. An attribute wildcard
 *   adds no row; {@link attributeWildcardsOf} reads it.
 * - A type is mixed when it, or its `complexContent`, says so, or else when its base type is.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, Layer, Option, Order, Result, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { readSource, sourcePaths, sources } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";

/**
 * The XML Schema namespace, which every construct the deriver reads and every built-in type is in.
 */
const XS = "http://www.w3.org/2001/XMLSchema";

/**
 * The namespace of namespace declarations, which crust gives every `xmlns` attribute.
 */
const XMLNS = "http://www.w3.org/2000/xmlns/";

/**
 * The namespace the `xml` prefix is bound to without a declaration.
 */
const XML = "http://www.w3.org/XML/1998/namespace";

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
 * @param detail - The construct and what about it is not read.
 * @returns The failure.
 */
const refuse = (detail: string): Result.Result<never, XsdReadingError> =>
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
 * @param node - The element.
 * @returns Whether it groups particles.
 */
const isCompositor = (node: Element): boolean =>
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
    (attribute) => attribute.namespace === "" && attribute.local === name,
  ).pipe(Option.map((attribute) => attribute.value));

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
        ? Result.succeed({ local, namespace: "" })
        : refuse(`the prefix of ${lexical} is not declared on the xs:schema element`),
    onSome: (namespace) => Result.succeed({ local, namespace }),
  });
};

/**
 * A schema, from one document or from a document and those it includes, indexed for derivation.
 *
 * The component maps hold the top-level named components by local name, `elements` the top-level
 * element declarations. A valid schema names each component once per kind, and the pinned files
 * hold no named component below the top level. `declarations` holds, per element name, the
 * distinct `type` of its declarations at any depth, in document order; a declaration with an
 * anonymous type adds nothing. `substitutions` holds, per top-level element, the top-level
 * elements whose `substitutionGroup` names it, in document order. `namespaces` maps each prefix
 * the `xs:schema` element declares, `""` for the default namespace, and `xml`. `qualified` is
 * whether a local element declaration is in the target namespace by default
 * (`elementFormDefault="qualified"`), and `targetPrefix` is the prefix a name in the target
 * namespace is written with: `""` when that namespace is the default one or no namespace.
 */
export interface XsdSchema {
  readonly attributeGroups: ReadonlyMap<string, Element>;
  readonly complexTypes: ReadonlyMap<string, Element>;
  readonly declarations: ReadonlyMap<string, readonly string[]>;
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
 * @param root - The `xs:schema` element.
 * @param local - The kind's construct, such as `complexType`.
 * @returns Each named component of that kind under its name.
 */
const componentsOf = (root: Element, local: string): ReadonlyMap<string, Element> =>
  new Map(
    xsChildren(root, local).flatMap((component) =>
      Option.match(attributeOf(component, "name"), {
        onNone: () => [],
        onSome: (name) => [[name, component] as const],
      }),
    ),
  );

/**
 * The distinct declared types of every element name the schema declares, in document order.
 *
 * @param root - The `xs:schema` element.
 * @returns Each element name with the `type` values of its declarations, first-seen first.
 */
const declarationsOf = (root: Element): ReadonlyMap<string, readonly string[]> => {
  const declared = new Map<string, readonly string[]>();
  const visit = (node: Element): void => {
    const declaration = isXs(node, "element")
      ? Option.all([attributeOf(node, "name"), attributeOf(node, "type")])
      : Option.none();

    if (Option.isSome(declaration)) {
      const [name, type] = declaration.value;
      const types = declared.get(name) ?? [];

      if (!types.includes(type)) {
        declared.set(name, [...types, type]);
      }
    }

    for (const child of elementsOf(node)) {
      visit(child);
    }
  };

  visit(root);

  return declared;
};

/**
 * One schema document's part of a schema: everything {@link XsdSchema} holds but the
 * substitution groups, which may cross the documents of a schema.
 */
type DocumentIndex = Omit<XsdSchema, "substitutions">;

/**
 * The prefix a schema writes names in its target namespace with.
 *
 * @param namespaces - The prefixes the `xs:schema` element declares, with `xml`.
 * @param targetNamespace - The schema's target namespace, `""` for none.
 * @returns `""` for no namespace or the default one, else the first prefix the element binds to
 *   it, or an {@link XsdReadingError} when it binds none.
 */
const targetPrefixOf = (
  namespaces: ReadonlyMap<string, string>,
  targetNamespace: string,
): Result.Result<string, XsdReadingError> => {
  if (targetNamespace === "" || namespaces.get("") === targetNamespace) {
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
    const targetNamespace = Option.getOrElse(attributeOf(root, "targetNamespace"), () => "");

    return {
      attributeGroups: componentsOf(root, "attributeGroup"),
      complexTypes: componentsOf(root, "complexType"),
      declarations: declarationsOf(root),
      elements: componentsOf(root, "element"),
      groups: componentsOf(root, "group"),
      namespaces,
      qualified: Option.contains(attributeOf(root, "elementFormDefault"), "qualified"),
      simpleTypes: componentsOf(root, "simpleType"),
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
 * The substitution groups of a schema: per head, the top-level elements that name it in their
 * `substitutionGroup`, in document order.
 *
 * @param elements - The schema's top-level element declarations, in document order.
 * @param namespaces - The prefixes the schema binds.
 * @param targetNamespace - The schema's target namespace.
 * @returns The members by head, or an {@link XsdReadingError} for a head that is not a top-level
 *   element of the schema.
 */
const substitutionsOf = (
  elements: ReadonlyMap<string, Element>,
  namespaces: ReadonlyMap<string, string>,
  targetNamespace: string,
): Result.Result<ReadonlyMap<string, readonly string[]>, XsdReadingError> =>
  Result.gen(function* substitutionsOfBody() {
    const members = new Map<string, readonly string[]>();

    for (const [name, declaration] of elements) {
      const heads = Option.match(attributeOf(declaration, "substitutionGroup"), {
        onNone: () => [],
        onSome: (value) => value.split(/\s+/u).filter((head) => head !== ""),
      });

      for (const lexical of heads) {
        const head = yield* resolveIn(namespaces, lexical);

        if (head.namespace !== targetNamespace || !elements.has(head.local)) {
          return yield* refuse(
            `the element ${name} names ${lexical} as its substitution group head, which is no top-level element of this schema`,
          );
        }

        members.set(head.local, [...(members.get(head.local) ?? []), name]);
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

    const declarations = new Map<string, readonly string[]>();

    for (const part of parts) {
      for (const [name, types] of part.declarations) {
        const known = declarations.get(name) ?? [];

        declarations.set(name, [...known, ...types.filter((type) => !known.includes(type))]);
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
      complexTypes: yield* mergeComponents(
        "complexType",
        parts.map((part) => part.complexTypes),
      ),
      declarations,
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
 * The `whiteSpace` class of an attribute's declared type, as the inventory records it.
 */
export type WhiteSpace = "preserve" | "replace" | "collapse" | "union";

/**
 * The values of the XSD `whiteSpace` facet.
 */
const whiteSpaceFacets = ["preserve", "replace", "collapse"] as const;

/**
 * A simple type as a declaration or a derivation refers to it: by a QName, or as an anonymous
 * definition written in place.
 */
type SimpleTypeRef =
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
        ...Option.match(attributeOf(variety, "memberTypes"), {
          onNone: () => [],
          onSome: (value) => value.split(/\s+/u).filter((member) => member !== ""),
        }).map((lexical) => ({ _tag: "Named" as const, lexical })),
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
 * The name the inventory records for an anonymous simple type: `list`, `union`, or the base of its
 * restriction, read through nested anonymous restrictions.
 *
 * @param definition - The anonymous `xs:simpleType` element.
 * @returns The name, or an {@link XsdReadingError} when the type is none of the three.
 */
const inlineTypeName = (definition: Element): Result.Result<string, XsdReadingError> =>
  Result.gen(function* inlineTypeNameBody() {
    const variety = yield* requireChild(definition, ["list", "union", "restriction"]);

    if (!isXs(variety, "restriction")) {
      return variety.local;
    }

    const base = attributeOf(variety, "base");

    return Option.isSome(base)
      ? base.value
      : yield* inlineTypeName(yield* requireChild(variety, ["simpleType"]));
  });

/**
 * The ten attribute names every QTI element shares, which the inventory files as family `base`.
 */
const baseFamily: ReadonlySet<string> = new Set([
  "class",
  "data-catalog-idref",
  "data-qti-suppress-tts",
  "data-ssml",
  "dir",
  "id",
  "label",
  "lang",
  "xml:base",
  "xml:lang",
]);

/**
 * The built-in type of each `xml:` attribute a declaration may reference instead of declaring, by
 * local name in the XML namespace, as `xml.xsd` declares them: `xml:base` as `xs:anyURI` (line
 * 112), `xml:id` as `xs:ID` (line 134) and `xml:lang` as `xs:language`. The inventory writes the
 * type with the `xs:` prefix whatever prefix the referencing schema binds.
 */
const xmlAttributeTypes: ReadonlyMap<string, string> = new Map([
  ["base", "anyURI"],
  ["id", "ID"],
  ["lang", "language"],
]);

/**
 * One attribute an XSD type declares, as the inventory records it.
 *
 * `type` is the declared type as written, or for an anonymous type the name {@link inlineTypeName}
 * gives it; `default` is the declared default.
 */
export interface AttributeRow {
  readonly default: Option.Option<string>;
  readonly family: "base" | "aria" | "own";
  readonly name: string;
  readonly type: string;
  readonly use: "required" | "optional";
  readonly whiteSpace: WhiteSpace;
}

/**
 * The family an attribute name belongs to: `base` for the shared ten, `aria` for `role` and the
 * `aria-*` names, `own` for the rest.
 *
 * @param name - The attribute name as the XSD spells it.
 * @returns Its family.
 */
const familyOf = (name: string): AttributeRow["family"] => {
  if (baseFamily.has(name)) {
    return "base";
  }

  return name === "role" || name.startsWith("aria-") ? "aria" : "own";
};

/**
 * The name, declared type and class of a declaration that names its attribute.
 *
 * A declaration with neither a `type` nor an anonymous type has `xs:anySimpleType`, as XML Schema
 * gives it.
 *
 * @param schema - The schema the declaration is in.
 * @param declaration - The `xs:attribute` element.
 * @param name - Its `name`.
 * @returns The three, or an {@link XsdReadingError} for a type the reading rules do not read.
 */
const declaredType = (
  schema: XsdSchema,
  declaration: Element,
  name: string,
): Result.Result<Pick<AttributeRow, "name" | "type" | "whiteSpace">, XsdReadingError> =>
  Result.gen(function* declaredTypeBody() {
    const type = attributeOf(declaration, "type");

    if (Option.isSome(type)) {
      return {
        name,
        type: type.value,
        whiteSpace: yield* whiteSpaceOf(schema, { _tag: "Named", lexical: type.value }),
      };
    }

    const inline = firstXs(declaration, "simpleType");

    if (Option.isNone(inline)) {
      return { name, type: "xs:anySimpleType", whiteSpace: builtinWhiteSpace("anySimpleType") };
    }

    return {
      name,
      type: yield* inlineTypeName(inline.value),
      whiteSpace: yield* whiteSpaceOf(schema, { _tag: "Anonymous", definition: inline.value }),
    };
  });

/**
 * The name, declared type and class of a reference to an `xml:` attribute.
 *
 * @param schema - The schema the reference is in.
 * @param ref - The `ref` as written, which is also the row's name.
 * @returns The three, or an {@link XsdReadingError} for any reference but `xml:base`, `xml:id` and
 *   `xml:lang`.
 */
const referencedType = (
  schema: XsdSchema,
  ref: string,
): Result.Result<Pick<AttributeRow, "name" | "type" | "whiteSpace">, XsdReadingError> =>
  Result.gen(function* referencedTypeBody() {
    const name = yield* resolve(schema, ref);
    const builtin = yield* Option.match(
      Option.filter(
        Option.fromNullishOr(xmlAttributeTypes.get(name.local)),
        () => name.namespace === XML,
      ),
      {
        onNone: () => refuse(`the attribute reference ${ref} is not xml:base, xml:id or xml:lang`),
        onSome: (local) => Result.succeed(local),
      },
    );

    return { name: ref, type: `xs:${builtin}`, whiteSpace: builtinWhiteSpace(builtin) };
  });

/**
 * Read one attribute declaration or reference.
 *
 * @param schema - The schema the declaration is in.
 * @param declaration - The `xs:attribute` element.
 * @returns The row, or an {@link XsdReadingError} for a reference outside the XML namespace's
 *   `base`, `id` and `lang`, a `use` of `prohibited`, or a type the reading rules do not read.
 */
const attributeRow = (
  schema: XsdSchema,
  declaration: Element,
): Result.Result<AttributeRow, XsdReadingError> =>
  Result.gen(function* attributeRowBody() {
    const named = attributeOf(declaration, "name");
    const typed = Option.isSome(named)
      ? yield* declaredType(schema, declaration, named.value)
      : yield* referencedType(schema, yield* requireAttribute(declaration, "ref"));
    const use = Option.getOrElse(attributeOf(declaration, "use"), () => "optional");

    if (use !== "required" && use !== "optional") {
      return yield* refuse(`the attribute ${typed.name} has use="${use}"`);
    }

    return {
      default: attributeOf(declaration, "default"),
      family: familyOf(typed.name),
      name: typed.name,
      type: typed.type,
      use,
      whiteSpace: typed.whiteSpace,
    };
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
 * `complexContent` or `simpleContent`.
 *
 * @param complexType - The `xs:complexType` element.
 * @returns The step, `None` for a type with neither content child, or an {@link XsdReadingError}
 *   for a content child with neither step.
 */
const derivationOf = (
  complexType: Element,
): Result.Result<Option.Option<Element>, XsdReadingError> =>
  Option.match(
    Option.orElse(firstXs(complexType, "complexContent"), () =>
      firstXs(complexType, "simpleContent"),
    ),
    {
      onNone: () => Result.succeed(Option.none()),
      onSome: (content) =>
        Result.map(requireChild(content, ["extension", "restriction"]), Option.some),
    },
  );

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
 * The attribute wildcards a holder states itself: its own `xs:anyAttribute`, then those of each
 * attribute group it references, in reference order.
 *
 * @param schema - The schema the holder is in.
 * @param holder - A complex type, a derivation step or an attribute group.
 * @returns The `xs:anyAttribute` elements, or an {@link XsdReadingError} for an unknown attribute
 *   group.
 */
const ownWildcards = (
  schema: XsdSchema,
  holder: Element,
): Result.Result<readonly Element[], XsdReadingError> =>
  Result.gen(function* ownWildcardsBody() {
    const found = [...xsChildren(holder, "anyAttribute")];

    for (const reference of xsChildren(holder, "attributeGroup")) {
      const group = yield* requireComponent(
        schema,
        schema.attributeGroups,
        "attributeGroup",
        yield* requireAttribute(reference, "ref"),
      );

      found.push(...(yield* ownWildcards(schema, group)));
    }

    return found;
  });

/**
 * The attribute wildcards a complex type holds: its own and its attribute groups', then for an
 * extension of a type of this document its base type's, then its derivation step's.
 *
 * A restriction's wildcard is the step's alone, so a restriction does not read its base's. Each
 * wildcard is returned as written; XML Schema's union and intersection of wildcards is the
 * reader's.
 *
 * Public, and stable while the vocabularies are derived: the vocabularies state their elements'
 * wildcards in `open.ts`'s shape from it.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element, named or anonymous.
 * @returns The `xs:anyAttribute` elements, in that order.
 */
export const attributeWildcardsOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<readonly Element[], XsdReadingError> =>
  Result.gen(function* attributeWildcardsOfBody() {
    const found = [...(yield* ownWildcards(schema, complexType))];
    const step = yield* derivationOf(complexType);

    if (Option.isSome(step)) {
      const base = isXs(step.value, "extension")
        ? yield* baseTypeOf(schema, step.value)
        : Option.none();

      if (Option.isSome(base)) {
        found.push(...(yield* attributeWildcardsOf(schema, base.value)));
      }

      found.push(...(yield* ownWildcards(schema, step.value)));
    }

    return found;
  });

/**
 * Whether a complex type admits character data between its children.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns Its own or its `complexContent`'s `mixed`, else its base type's, else `false`.
 */
const mixedOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<boolean, XsdReadingError> =>
  Result.gen(function* mixedOfBody() {
    const content = firstXs(complexType, "complexContent");

    for (const holder of [complexType, ...Option.toArray(content)]) {
      const mixed = attributeOf(holder, "mixed");

      if (Option.isSome(mixed)) {
        if (mixed.value !== "true" && mixed.value !== "false") {
          return yield* refuse(`an ${holder.qname} has mixed="${mixed.value}"`);
        }

        return mixed.value === "true";
      }
    }

    if (Option.isNone(content)) {
      return false;
    }

    const step = yield* requireChild(content.value, ["extension", "restriction"]);
    const base = yield* baseTypeOf(schema, step);

    return Option.isSome(base) ? yield* mixedOf(schema, base.value) : false;
  });

/**
 * The occurrence a particle allows: the least count and the greatest, `None` when unbounded.
 */
export interface Occurs {
  readonly max: Option.Option<number>;
  readonly min: number;
}

/**
 * Exactly one occurrence, the default bounds of a particle.
 */
const once: Occurs = { max: Option.some(1), min: 1 };

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
 * The occurrence a particle's `minOccurs` and `maxOccurs` state, each 1 when absent.
 *
 * @param particle - An element, a compositor, a group reference or a wildcard.
 * @returns Its occurrence.
 */
const occursOf = (particle: Element): Result.Result<Occurs, XsdReadingError> =>
  Result.gen(function* occursOfBody() {
    const min = attributeOf(particle, "minOccurs");
    const max = Option.getOrElse(attributeOf(particle, "maxOccurs"), () => "1");

    return {
      max: max === "unbounded" ? Option.none() : Option.some(yield* countOf(particle, max)),
      min: Option.isSome(min) ? yield* countOf(particle, min.value) : 1,
    };
  });

/**
 * One element a content model references, with the occurrence it is allowed.
 */
export interface Reference {
  readonly name: string;
  readonly occurs: Occurs;
}

/**
 * A choice of two or more distinct element names, with the occurrence of the choice itself.
 */
export interface ChoiceGroup {
  readonly names: readonly string[];
  readonly occurs: Occurs;
}

/**
 * A content model read to its element references and its choice groups, each in reading order,
 * and whether it holds an element wildcard (`xs:any`) that may occur.
 */
export interface ContentReading {
  readonly choices: readonly ChoiceGroup[];
  readonly references: readonly Reference[];
  readonly wildcard: boolean;
}

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
 * Whether an element declaration is abstract, so that no element of its name is valid.
 *
 * @param declaration - The `xs:element` element.
 * @returns Whether it says `abstract="true"`.
 */
const isAbstract = (declaration: Element): boolean =>
  Option.contains(attributeOf(declaration, "abstract"), "true");

/**
 * The element names a reference to a top-level element admits: the element itself unless it is
 * abstract, then each member of its substitution group, read the same way, in document order.
 *
 * @param schema - The schema the element is declared in.
 * @param local - The element's local name.
 * @param seen - The heads being read around this one, so that a circular group, which XML Schema
 *   forbids, ends.
 * @returns The names, each written with the schema's target prefix.
 */
const substitutesOf = (
  schema: XsdSchema,
  local: string,
  seen: ReadonlySet<string>,
): readonly string[] => {
  const own = Option.exists(
    Option.fromNullishOr(schema.elements.get(local)),
    (declaration) => !isAbstract(declaration),
  )
    ? [qualify(schema, local)]
    : [];
  const members = (schema.substitutions.get(local) ?? []).filter((member) => !seen.has(member));

  return [
    ...own,
    ...members.flatMap((member) => substitutesOf(schema, member, new Set([...seen, local]))),
  ];
};

/**
 * The names an element particle references, as the content reading records them.
 *
 * A local declaration names one element, written with the target prefix when it is qualified
 * (its `form`, else the schema's `elementFormDefault`). A reference is written as the XSD writes
 * it, unless it names a top-level element of this schema that is abstract or heads a substitution
 * group: then it stands for every element {@link substitutesOf} admits for it.
 *
 * @param schema - The schema the particle is in.
 * @param particle - The `xs:element` particle.
 * @returns The names, in order, or an {@link XsdReadingError} for a particle with neither a
 *   `name` nor a `ref`.
 */
const particleNames = (
  schema: XsdSchema,
  particle: Element,
): Result.Result<readonly string[], XsdReadingError> =>
  Result.gen(function* particleNamesBody() {
    const declared = attributeOf(particle, "name");

    if (Option.isSome(declared)) {
      const form = Option.getOrElse(attributeOf(particle, "form"), () =>
        schema.qualified ? "qualified" : "unqualified",
      );

      return [form === "qualified" ? qualify(schema, declared.value) : declared.value];
    }

    const ref = yield* Option.match(attributeOf(particle, "ref"), {
      onNone: () => refuse("an xs:element has neither a name nor a ref"),
      onSome: (value) => Result.succeed(value),
    });
    const target = yield* resolve(schema, ref);
    const heads =
      target.namespace === schema.targetNamespace &&
      Option.exists(
        Option.fromNullishOr(schema.elements.get(target.local)),
        (declaration) => isAbstract(declaration) || schema.substitutions.has(target.local),
      );

    return heads ? substitutesOf(schema, target.local, new Set()) : [ref];
  });

/**
 * The particles a compositor or a group definition holds, in order.
 *
 * @param node - The parent construct.
 * @returns Its children other than annotations.
 */
const particlesOf = (node: Element): readonly Element[] =>
  elementsOf(node).filter((child) => !isXs(child, "annotation"));

/**
 * Read consecutive particles to their element references and choice groups.
 *
 * An element is the references {@link particleNames} gives it. When they are two or more distinct
 * names they are a choice group of their own, unless the element is an alternative of a choice and
 * occurs exactly once, so that the choice's group already holds them with the same bounds. A group
 * reference reads its group's particles; a compositor reads its own, and a choice among two or more
 * names adds its group after the ones nested in it, whether or not it is itself an alternative; a
 * wildcard references nothing, and is recorded when it may occur.
 *
 * @param schema - The schema the particles are in.
 * @param particles - The particles, in order.
 * @param outer - The occurrence of everything enclosing them.
 * @param alternative - Whether the particles are the alternatives of a choice.
 * @returns Their readings, concatenated in order.
 */
const readParticles = (
  schema: XsdSchema,
  particles: readonly Element[],
  outer: Occurs,
  alternative: boolean,
): Result.Result<ContentReading, XsdReadingError> =>
  Result.gen(function* readParticlesBody() {
    const readings: ContentReading[] = [];

    for (const particle of particles) {
      const own = yield* occursOf(particle);
      const occurs = times(outer, own);
      const flattened = alternative && own.min === 1 && Option.contains(own.max, 1);

      if (isXs(particle, "element")) {
        const names = yield* particleNames(schema, particle);
        const distinct = Arr.dedupe(names);

        readings.push({
          choices: distinct.length > 1 && !flattened ? [{ names: distinct, occurs }] : [],
          references: names.map((name) => ({ name, occurs })),
          wildcard: false,
        });
      } else if (isXs(particle, "any")) {
        readings.push({ choices: [], references: [], wildcard: !Option.contains(occurs.max, 0) });
      } else if (isXs(particle, "group")) {
        const group = yield* requireComponent(
          schema,
          schema.groups,
          "group",
          yield* requireAttribute(particle, "ref"),
        );

        readings.push(yield* readParticles(schema, particlesOf(group), occurs, alternative));
      } else if (isCompositor(particle)) {
        const inner = yield* readParticles(
          schema,
          particlesOf(particle),
          occurs,
          isXs(particle, "choice"),
        );
        const names = Arr.dedupe(inner.references.map((reference) => reference.name));

        readings.push(
          isXs(particle, "choice") && names.length > 1
            ? { ...inner, choices: [...inner.choices, { names, occurs }] }
            : inner,
        );
      }
    }

    return {
      choices: readings.flatMap((reading) => reading.choices),
      references: readings.flatMap((reading) => reading.references),
      wildcard: readings.some((reading) => reading.wildcard),
    };
  });

/**
 * The particles a complex type's content states, with its base type's ahead of them for an
 * extension.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns The particles, in content order.
 */
const contentParticles = (
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
 * Read a complex type's content to its element references and choice groups.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns The reading, its base type's content first for an extension.
 */
export const contentOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<ContentReading, XsdReadingError> =>
  Result.flatMap(contentParticles(schema, complexType), (particles) =>
    readParticles(schema, particles, once, false),
  );

/**
 * A kind of a vocabulary: its handle, the element it is, and the XSD type that element has here.
 *
 * Public: other vocabularies' derivations name their kinds with it when they call
 * {@link entryOf}.
 */
export interface KindSpec {
  readonly element: string;
  readonly handle: string;
  readonly type: string;
}

/**
 * A vocabulary's kinds as the deriver reads them: the label its leaf's comments use, the handles
 * that are an element of exactly one declared type, and the dotted handles that name an element
 * and one of its several types.
 */
interface Vocabulary {
  readonly label: string;
  readonly plain: readonly string[];
  readonly typed: Readonly<Record<string, Omit<KindSpec, "handle">>>;
}

/**
 * The inventory leaves, one per vocabulary, in the order the leaves are composed.
 */
export const leaves = ["asi", "html", "processing"] as const;

/**
 * The name of an inventory leaf.
 */
export type Leaf = (typeof leaves)[number];

/**
 * The three vocabularies the ASI 3.0.1 XSD's inventory covers, by leaf.
 *
 * The handles are the rosters of the kinds files that read the leaves; they are listed here, not
 * imported, because those files import the leaves. `asi` is phase 1's M0 and M1 elements and the
 * dotted kinds of the elements with several types; `html` is the HTML elements; `processing` is the
 * expressions and the response, outcome and template processing rules.
 */
export const vocabularies = {
  asi: {
    label: "ASI",
    plain: [
      "qti-area-map-entry",
      "qti-area-mapping",
      "qti-assessment-item",
      "qti-associable-hotspot",
      "qti-associate-interaction",
      "qti-catalog-info",
      "qti-choice-interaction",
      "qti-companion-materials-info",
      "qti-context-declaration",
      "qti-correct-response",
      "qti-default-value",
      "qti-drawing-interaction",
      "qti-end-attempt-interaction",
      "qti-extended-text-interaction",
      "qti-feedback-inline",
      "qti-gap",
      "qti-gap-img",
      "qti-gap-match-interaction",
      "qti-gap-text",
      "qti-graphic-associate-interaction",
      "qti-graphic-gap-match-interaction",
      "qti-graphic-order-interaction",
      "qti-hotspot-choice",
      "qti-hotspot-interaction",
      "qti-hottext",
      "qti-hottext-interaction",
      "qti-inline-choice",
      "qti-inline-choice-interaction",
      "qti-interpolation-table",
      "qti-interpolation-table-entry",
      "qti-item-body",
      "qti-label",
      "qti-map-entry",
      "qti-mapping",
      "qti-match-interaction",
      "qti-match-table",
      "qti-match-table-entry",
      "qti-media-interaction",
      "qti-modal-feedback",
      "qti-order-interaction",
      "qti-outcome-declaration",
      "qti-position-object-interaction",
      "qti-position-object-stage",
      "qti-printed-variable",
      "qti-prompt",
      "qti-response-declaration",
      "qti-response-processing",
      "qti-select-point-interaction",
      "qti-simple-associable-choice",
      "qti-simple-choice",
      "qti-simple-match-set",
      "qti-slider-interaction",
      "qti-stylesheet",
      "qti-template-declaration",
      "qti-text-entry-interaction",
      "qti-upload-interaction",
      "qti-value",
    ],
    typed: {
      "qti-content-body.feedback": {
        element: "qti-content-body",
        type: "FeedbackContentBodyDType",
      },
      "qti-content-body.modal": {
        element: "qti-content-body",
        type: "FeedbackFlowContentBodyDType",
      },
      "qti-content-body.rubric": {
        element: "qti-content-body",
        type: "RubricBlockContentBodyDType",
      },
      "qti-content-body.rubricTemplate": {
        element: "qti-content-body",
        type: "RubricBlockTemplateBlockContentBodyDType",
      },
      "qti-content-body.template": {
        element: "qti-content-body",
        type: "TemplateBlockContentBodyDType",
      },
      "qti-feedback-block": { element: "qti-feedback-block", type: "FeedbackBlockDType" },
      "qti-feedback-block.template": {
        element: "qti-feedback-block",
        type: "TemplateBlockFeedbackBlockDType",
      },
      "qti-rubric-block": { element: "qti-rubric-block", type: "RubricBlockDType" },
      "qti-template-block": { element: "qti-template-block", type: "TemplateBlockDType" },
      "qti-template-block.rubric": {
        element: "qti-template-block",
        type: "RubricBlockTemplateBlockDType",
      },
      "qti-template-inline": { element: "qti-template-inline", type: "TemplateInlineDType" },
      "qti-template-inline.rubric": {
        element: "qti-template-inline",
        type: "RubricBlockTemplateInlineDType",
      },
    },
  },
  html: {
    label: "HTML",
    plain: [
      "a",
      "abbr",
      "acronym",
      "address",
      "article",
      "aside",
      "audio",
      "b",
      "bdi",
      "bdo",
      "big",
      "blockquote",
      "br",
      "caption",
      "cite",
      "code",
      "col",
      "colgroup",
      "dd",
      "details",
      "dfn",
      "div",
      "dl",
      "dt",
      "em",
      "figcaption",
      "figure",
      "footer",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "header",
      "hr",
      "i",
      "img",
      "kbd",
      "label",
      "li",
      "nav",
      "object",
      "ol",
      "p",
      "param",
      "picture",
      "pre",
      "q",
      "rb",
      "rp",
      "rt",
      "rtc",
      "ruby",
      "samp",
      "section",
      "small",
      "source",
      "span",
      "strong",
      "sub",
      "summary",
      "sup",
      "table",
      "tbody",
      "td",
      "template",
      "tfoot",
      "th",
      "thead",
      "tr",
      "track",
      "tt",
      "ul",
      "var",
      "video",
    ],
    typed: {},
  },
  processing: {
    label: "ASI processing",
    plain: [
      "qti-and",
      "qti-any-n",
      "qti-base-value",
      "qti-container-size",
      "qti-contains",
      "qti-correct",
      "qti-custom-operator",
      "qti-default",
      "qti-delete",
      "qti-divide",
      "qti-duration-gte",
      "qti-duration-lt",
      "qti-equal",
      "qti-equal-rounded",
      "qti-exit-response",
      "qti-exit-template",
      "qti-exit-test",
      "qti-field-value",
      "qti-gcd",
      "qti-gt",
      "qti-gte",
      "qti-index",
      "qti-inside",
      "qti-integer-divide",
      "qti-integer-modulus",
      "qti-integer-to-float",
      "qti-is-null",
      "qti-lcm",
      "qti-lookup-outcome-value",
      "qti-lt",
      "qti-lte",
      "qti-map-response",
      "qti-map-response-point",
      "qti-match",
      "qti-math-constant",
      "qti-math-operator",
      "qti-max",
      "qti-member",
      "qti-min",
      "qti-multiple",
      "qti-not",
      "qti-null",
      "qti-number-correct",
      "qti-number-incorrect",
      "qti-number-presented",
      "qti-number-responded",
      "qti-number-selected",
      "qti-or",
      "qti-ordered",
      "qti-outcome-condition",
      "qti-outcome-else",
      "qti-outcome-else-if",
      "qti-outcome-if",
      "qti-outcome-maximum",
      "qti-outcome-minimum",
      "qti-outcome-processing",
      "qti-outcome-processing-fragment",
      "qti-pattern-match",
      "qti-power",
      "qti-product",
      "qti-random",
      "qti-random-float",
      "qti-random-integer",
      "qti-repeat",
      "qti-response-condition",
      "qti-response-else",
      "qti-response-else-if",
      "qti-response-if",
      "qti-response-processing-fragment",
      "qti-round",
      "qti-round-to",
      "qti-set-correct-response",
      "qti-set-default-value",
      "qti-set-outcome-value",
      "qti-set-template-value",
      "qti-stats-operator",
      "qti-string-match",
      "qti-substring",
      "qti-subtract",
      "qti-sum",
      "qti-template-condition",
      "qti-template-constraint",
      "qti-template-else",
      "qti-template-else-if",
      "qti-template-if",
      "qti-template-processing",
      "qti-test-variables",
      "qti-truncate",
      "qti-variable",
    ],
    typed: {},
  },
} as const satisfies { readonly [Name in Leaf]: Vocabulary };

/**
 * What the inventory records for one kind handle.
 */
export interface Entry extends KindSpec, ContentReading {
  readonly attributes: readonly AttributeRow[];
  readonly mixed: boolean;
}

/**
 * The one type an element is declared with.
 *
 * Public, and stable while the vocabularies are derived: a vocabulary's derivation reads its plain
 * handles' types with it before it calls {@link entryOf}.
 *
 * @param schema - The schema the element is declared in.
 * @param element - The element name.
 * @returns The type, or an {@link XsdReadingError} when the element is declared with no type or
 *   several, which a dotted handle must then choose between.
 */
export const soleTypeOf = (
  schema: XsdSchema,
  element: string,
): Result.Result<string, XsdReadingError> => {
  const types = schema.declarations.get(element) ?? [];

  return Option.match(types.length === 1 ? Arr.head(types) : Option.none(), {
    onNone: () =>
      refuse(
        `the element ${element} is declared with ${types.length} types (${types.join(", ")}), not one`,
      ),
    onSome: (type) => Result.succeed(type),
  });
};

/**
 * Read one kind's inventory entry from its complex type: the type's attributes, content and
 * mixedness, by the reading rules of the module comment.
 *
 * Public, and stable while the vocabularies are derived: a vocabulary whose kinds have anonymous
 * types reads its entries with it.
 *
 * @param schema - The schema the type is in.
 * @param kind - The kind's handle and element, and the name the entry records for its type.
 * @param complexType - The `xs:complexType` element, named or anonymous.
 * @returns The entry, or an {@link XsdReadingError} for a shape the reading rules do not cover.
 */
export const entryOfType = (
  schema: XsdSchema,
  kind: KindSpec,
  complexType: Element,
): Result.Result<Entry, XsdReadingError> =>
  Result.gen(function* entryOfTypeBody() {
    const attributes: AttributeRow[] = [];

    for (const declaration of yield* attributesOf(schema, complexType)) {
      attributes.push(yield* attributeRow(schema, declaration));
    }

    return {
      ...kind,
      ...(yield* contentOf(schema, complexType)),
      attributes,
      mixed: yield* mixedOf(schema, complexType),
    };
  });

/**
 * Read one kind's inventory entry: its type's attributes, content and mixedness, by the reading
 * rules of the module comment.
 *
 * Public, and stable while the vocabularies are derived: every vocabulary whose kinds have named
 * complex types reads its entries with it.
 *
 * @param schema - The schema the kind's type is in.
 * @param kind - The kind's handle, element and type; `type` names a top-level complex type of the
 *   schema.
 * @returns The entry, or an {@link XsdReadingError} when the type is not declared or has a shape
 *   the reading rules do not cover.
 */
export const entryOf = (schema: XsdSchema, kind: KindSpec): Result.Result<Entry, XsdReadingError> =>
  Result.flatMap(
    requireComponent(schema, schema.complexTypes, "complexType", kind.type),
    (complexType) => entryOfType(schema, kind, complexType),
  );

/**
 * Read a vocabulary's inventory entries.
 *
 * @param schema - The ASI 3.0.1 schema.
 * @param leaf - The vocabulary's leaf.
 * @returns Its entries in handle order.
 */
export const entriesOf = (
  schema: XsdSchema,
  leaf: Leaf,
): Result.Result<readonly Entry[], XsdReadingError> =>
  Result.gen(function* entriesOfBody() {
    const { plain, typed } = vocabularies[leaf];
    const entries: Entry[] = [];

    for (const handle of plain) {
      const type = yield* soleTypeOf(schema, handle);

      entries.push(yield* entryOf(schema, { element: handle, handle, type }));
    }

    for (const [handle, { element, type }] of Object.entries(typed)) {
      entries.push(yield* entryOf(schema, { element, handle, type }));
    }

    return Arr.sort(
      entries,
      Order.mapInput(Order.String, (entry: Entry) => entry.handle),
    );
  });

/**
 * A schema read from a pinned XSD and the pinned XSDs it includes: every document, by its path in
 * reading order, and the schema they make together.
 */
export interface SchemaSet {
  readonly documents: ReadonlyMap<SourcePath, XmlDocument>;
  readonly schema: XsdSchema;
}

/**
 * The MathML 3 XSD the ASI XSDs import, the document that includes the four that declare MathML.
 */
export const mathmlSource: SourcePath = "mathml/mathml3.xsd";

/**
 * The MathML documents that declare elements, in the order the MathML vocabulary lists its kinds:
 * the common elements (`math`, its annotations and `semantics`), then presentation, content, and
 * strict content, which the content document includes.
 */
export const mathmlParts = [
  "mathml/mathml3-common.xsd",
  "mathml/mathml3-presentation.xsd",
  "mathml/mathml3-content.xsd",
  "mathml/mathml3-strict-content.xsd",
] as const satisfies readonly SourcePath[];

/**
 * One MathML document's kinds: its path and the names it declares first, in document order.
 */
export interface MathmlPart {
  readonly names: readonly string[];
  readonly path: (typeof mathmlParts)[number];
}

/**
 * One element declaration of a schema document: the declaration, its name, and the top-level
 * component it is written in, `None` for a top-level declaration.
 */
interface Declared {
  readonly declaration: Element;
  readonly name: string;
  readonly scope: Option.Option<{ readonly kind: string; readonly name: string }>;
}

/**
 * Every element declaration of a schema document that names its element, in document order: each
 * top-level component, then the declarations written inside it.
 *
 * @param root - The `xs:schema` element.
 * @returns The declarations.
 */
const declaredElementsOf = (root: Element): readonly Declared[] =>
  elementsOf(root).flatMap((component) => {
    const own = isXs(component, "element")
      ? Option.toArray(
          Option.map(attributeOf(component, "name"), (name) => ({
            declaration: component,
            name,
            scope: Option.none(),
          })),
        )
      : [];
    const scope = Option.map(attributeOf(component, "name"), (name) => ({
      kind: component.local,
      name,
    }));
    const nested: Declared[] = [];
    const visit = (node: Element): void => {
      for (const child of elementsOf(node)) {
        const name = isXs(child, "element") ? attributeOf(child, "name") : Option.none();

        if (Option.isSome(name)) {
          nested.push({ declaration: child, name: name.value, scope });
        }

        visit(child);
      }
    };

    visit(component);

    return [...own, ...nested];
  });

/**
 * Whether a declaration is a top-level abstract one, which declares no kind.
 *
 * @param declared - The declaration.
 * @returns Whether it is top-level and `abstract="true"`.
 */
const isAbstractTop = (declared: Declared): boolean =>
  Option.isNone(declared.scope) && isAbstract(declared.declaration);

/**
 * Read the MathML kinds of each part: the names a part declares that no earlier part declares,
 * skipping the abstract top-level declarations, which no element can be.
 *
 * @param set - The MathML schema, read from {@link mathmlSource}.
 * @returns Each part's kinds, in {@link mathmlParts} order, or an {@link XsdReadingError} when the
 *   schema does not include a part.
 */
export const mathmlKindsOf = (
  set: SchemaSet,
): Result.Result<readonly MathmlPart[], XsdReadingError> =>
  Result.gen(function* mathmlKindsOfBody() {
    const seen = new Set<string>();
    const parts: MathmlPart[] = [];

    for (const path of mathmlParts) {
      const document = yield* Option.match(Option.fromNullishOr(set.documents.get(path)), {
        onNone: () => refuse(`the MathML schema ${mathmlSource} does not include ${path}`),
        onSome: (found) => Result.succeed(found),
      });
      const names = Arr.dedupe(
        declaredElementsOf(document.root)
          .filter((declared) => !isAbstractTop(declared) && !seen.has(declared.name))
          .map((declared) => declared.name),
      );

      for (const name of names) {
        seen.add(name);
      }

      parts.push({ names, path });
    }

    return parts;
  });

/**
 * The complex type an element declaration gives its element, and the name the inventory records
 * for it.
 */
interface DeclaredType {
  readonly complexType: Element;
  readonly designator: string;
}

/**
 * The complex type of an element declaration: its anonymous type, the top-level type its `type`
 * names, or, for a declaration with neither, its substitution group head's.
 *
 * An anonymous type is recorded as `anonymous, in` and the declaration it is written in: the
 * element's name, then, for a local declaration, the top-level component it is written in, such as
 * `anonymous, in m:semantics in group m:semantics`.
 *
 * @param schema - The schema the declaration is in.
 * @param declared - The declaration.
 * @returns The type and its designator, or an {@link XsdReadingError} for a simple type, a head
 *   that is no top-level element, or a declaration with no type and no head, whose type is
 *   `xs:anyType`.
 */
const declaredTypeOf = (
  schema: XsdSchema,
  declared: Declared,
): Result.Result<DeclaredType, XsdReadingError> =>
  Result.gen(function* declaredTypeOfBody() {
    const { declaration, name, scope } = declared;
    const anonymous = firstXs(declaration, "complexType");

    if (Option.isSome(anonymous)) {
      const where = Option.match(scope, {
        onNone: () => "",
        onSome: (outer) => ` in ${outer.kind} ${qualify(schema, outer.name)}`,
      });

      return {
        complexType: anonymous.value,
        designator: `anonymous, in ${qualify(schema, name)}${where}`,
      };
    }

    const type = attributeOf(declaration, "type");

    if (Option.isSome(type)) {
      return {
        complexType: yield* requireComponent(
          schema,
          schema.complexTypes,
          "complexType",
          type.value,
        ),
        designator: type.value,
      };
    }

    const head = attributeOf(declaration, "substitutionGroup");

    if (Option.isNone(head) || Option.isSome(firstXs(declaration, "simpleType"))) {
      return yield* refuse(
        `the element ${name} has no complex type of its own and no substitution group head to take one from`,
      );
    }

    const headName = yield* resolve(schema, head.value);
    const headDeclaration = yield* Option.match(componentOf(schema, schema.elements, headName), {
      onNone: () => refuse(`the substitution group head ${head.value} of ${name} is not declared`),
      onSome: (found) => Result.succeed(found),
    });

    return yield* declaredTypeOf(schema, {
      declaration: headDeclaration,
      name: headName.local,
      scope: Option.none(),
    });
  });

/**
 * A key that two attribute lists share exactly when they declare the same rows in the same order.
 *
 * @param rows - The attribute rows.
 * @returns The key.
 */
const attributesKey = (rows: readonly AttributeRow[]): string =>
  JSON.stringify(
    rows.map((row) => [row.name, row.type, row.use, row.whiteSpace, Option.getOrNull(row.default)]),
  );

/**
 * One MathML kind as read: its inventory entry and the complex type the entry was read from.
 */
export interface MathmlReading {
  readonly complexType: Element;
  readonly entry: Entry;
}

/**
 * The widest of an element's declarations: the one that admits every child the others admit, a
 * wildcard if any of them does, with the same attributes and the same mixedness.
 *
 * @param name - The element's name.
 * @param candidates - The reading each declaration gives, in reading order.
 * @returns The widest, or an {@link XsdReadingError} when no declaration is.
 */
const widestOf = (
  name: string,
  candidates: readonly MathmlReading[],
): Result.Result<MathmlReading, XsdReadingError> => {
  const namesOf = ({ entry }: MathmlReading): ReadonlySet<string> =>
    new Set(entry.references.map((reference) => reference.name));
  const covers = (wide: MathmlReading, narrow: MathmlReading): boolean =>
    [...namesOf(narrow)].every((child) => namesOf(wide).has(child)) &&
    attributesKey(wide.entry.attributes) === attributesKey(narrow.entry.attributes) &&
    wide.entry.mixed === narrow.entry.mixed &&
    (wide.entry.wildcard || !narrow.entry.wildcard);

  return Option.match(
    Arr.findFirst(candidates, (wide) => candidates.every((narrow) => covers(wide, narrow))),
    {
      onNone: () =>
        refuse(
          `the element ${name} is declared ${candidates.length} times, and no declaration admits every child and attribute the others admit`,
        ),
      onSome: (widest) => Result.succeed(widest),
    },
  );
};

/**
 * Read the MathML kinds: one reading per kind, in kind order.
 *
 * A kind declared once reads its declaration's type; one declared several times, `semantics`
 * alone, reads the widest of them ({@link widestOf}).
 *
 * @param set - The MathML schema, read from {@link mathmlSource}.
 * @returns The readings.
 */
export const mathmlReadingsOf = (
  set: SchemaSet,
): Result.Result<readonly MathmlReading[], XsdReadingError> =>
  Result.gen(function* mathmlReadingsOfBody() {
    const { schema } = set;
    const declarations = [...set.documents.values()]
      .flatMap((document) => declaredElementsOf(document.root))
      .filter((declared) => !isAbstractTop(declared));
    const readings: MathmlReading[] = [];

    for (const { names } of yield* mathmlKindsOf(set)) {
      for (const name of names) {
        const candidates: MathmlReading[] = [];

        for (const declared of declarations.filter((candidate) => candidate.name === name)) {
          const { complexType, designator } = yield* declaredTypeOf(schema, declared);
          const entry = yield* entryOfType(
            schema,
            { element: name, handle: qualify(schema, name), type: designator },
            complexType,
          );

          candidates.push({ complexType, entry });
        }

        readings.push(yield* widestOf(name, candidates));
      }
    }

    return readings;
  });

/**
 * Read the MathML inventory entries: one per kind, in kind order ({@link mathmlReadingsOf}).
 *
 * @param set - The MathML schema, read from {@link mathmlSource}.
 * @returns The entries.
 */
export const mathmlEntriesOf = (set: SchemaSet): Result.Result<readonly Entry[], XsdReadingError> =>
  Result.map(mathmlReadingsOf(set), (readings) => readings.map(({ entry }) => entry));

/**
 * One element of a schema whose declared type references a name: the element and that type.
 */
export interface Host {
  readonly element: string;
  readonly type: string;
}

/**
 * The elements whose declared type's content references an element name: every pair of an element
 * and a named complex type it is declared with, in declaration order.
 *
 * Public, and stable while the vocabularies are derived: the MathML and SSML vocabularies read the
 * QTI hosts of their roots with it.
 *
 * @param schema - The schema the elements are declared in.
 * @param name - The referenced name as the schema writes it, such as `m3:math`.
 * @returns The hosts.
 */
export const hostsOf = (
  schema: XsdSchema,
  name: string,
): Result.Result<readonly Host[], XsdReadingError> =>
  Result.gen(function* hostsOfBody() {
    const hosts: Host[] = [];

    for (const [element, types] of schema.declarations) {
      for (const type of types) {
        const complexType = componentOf(schema, schema.complexTypes, yield* resolve(schema, type));

        if (Option.isSome(complexType)) {
          const { references } = yield* contentOf(schema, complexType.value);

          if (references.some((reference) => reference.name === name)) {
            hosts.push({ element, type });
          }
        }
      }
    }

    return hosts;
  });

/**
 * Write an occurrence as a range: `1..1`, `0..n`.
 *
 * @param occurs - The occurrence.
 * @returns The range text.
 */
const rangeOf = (occurs: Occurs): string =>
  `${occurs.min}..${Option.match(occurs.max, { onNone: () => "n", onSome: String })}`;

/**
 * The lines of a JSDoc comment; `vp fmt` wraps them.
 *
 * @param paragraphs - Each paragraph as its lines: one line for prose, one per item for a list or
 *   a tag block. An empty paragraph is left out.
 * @returns The comment, from its opening line to its closing one.
 */
const commentOf = (paragraphs: readonly (readonly string[])[]): readonly string[] => [
  "/**",
  ...paragraphs
    .filter((lines) => lines.length > 0)
    .flatMap((lines, index) => [
      ...(index === 0 ? [] : [" *"]),
      ...lines.map((line) => ` * ${line}`),
    ]),
  " */",
];

/**
 * The helper functions and type imports every leaf opens with, after its module comment.
 */
const leafPreamble: readonly string[] = [
  'import { Option } from "effect";',
  "",
  "import type {",
  "  InventoryAttribute,",
  "  InventoryChild,",
  "  InventoryLeaf,",
  '} from "#pantry/schema/content/xsd-inventory.ts";',
  "",
  ...commentOf([
    ["Build an attribute row from its declaration."],
    [
      "@param name - The attribute name as the XSD spells it.",
      "@param type - The declared type name, or the base of an inline type.",
      "@param use - Whether the XSD requires the attribute.",
      "@param family - Which attribute family the name belongs to.",
      "@param whiteSpace - The `whiteSpace` class of the declared type.",
      "@param defaultValue - The XSD `default`, absent when none is declared.",
      "@returns The attribute row.",
    ],
  ]),
  "const attribute = (",
  "  name: string,",
  "  type: string,",
  '  use: InventoryAttribute["use"],',
  '  family: InventoryAttribute["family"],',
  '  whiteSpace: InventoryAttribute["whiteSpace"],',
  "  defaultValue?: string,",
  "): InventoryAttribute => ({",
  "  default: Option.fromNullishOr(defaultValue),",
  "  family,",
  "  name,",
  "  type,",
  "  use,",
  "  whiteSpace,",
  "});",
  "",
  ...commentOf([
    ["Build a child row from an element reference."],
    [
      "@param name - The referenced element name as the XSD spells it.",
      "@param min - The effective minimum occurrence.",
      "@param max - The effective maximum occurrence, `None` when unbounded.",
      "@returns The child row.",
    ],
  ]),
  "const child = (name: string, min: number, max: Option.Option<number>): InventoryChild => ({",
  "  max,",
  "  min,",
  "  name,",
  "});",
  "",
];

/**
 * Write an array property, one element per line.
 *
 * @param key - The property name.
 * @param items - The elements, each written as one expression.
 * @returns The property's lines at the entry's indentation.
 */
const arrayLines = (key: string, items: readonly string[]): readonly string[] =>
  items.length === 0
    ? [`    ${key}: [],`]
    : [`    ${key}: [`, ...items.map((item) => `      ${item},`), "    ],"];

/**
 * Write the call that builds one attribute row.
 *
 * @param row - The row.
 * @returns The `attribute(...)` call, the default last when one is declared.
 */
const attributeCall = (row: AttributeRow): string => {
  const args = [
    row.name,
    row.type,
    row.use,
    row.family,
    row.whiteSpace,
    ...Option.toArray(row.default),
  ];

  return `attribute(${args.map((arg) => JSON.stringify(arg)).join(", ")})`;
};

/**
 * Write the call that builds one child row.
 *
 * @param reference - The element reference.
 * @returns The `child(...)` call.
 */
const childCall = ({ name, occurs }: Reference): string => {
  const max = Option.match(occurs.max, {
    onNone: () => "Option.none()",
    onSome: (bound) => `Option.some(${bound})`,
  });

  return `child(${JSON.stringify(name)}, ${occurs.min}, ${max})`;
};

/**
 * Write one entry of a leaf's inventory object.
 *
 * @param entry - The entry.
 * @returns Its lines, from its key to its closing brace.
 */
const entryLines = (entry: Entry): readonly string[] => [
  `  ${JSON.stringify(entry.handle)}: {`,
  ...arrayLines("attributes", entry.attributes.map(attributeCall)),
  ...arrayLines("children", entry.references.map(childCall)),
  `    element: ${JSON.stringify(entry.element)},`,
  `    handle: ${JSON.stringify(entry.handle)},`,
  `    mixed: ${entry.mixed},`,
  `    type: ${JSON.stringify(entry.type)},`,
  "  },",
];

/**
 * The largest choice group a leaf's module comment lists; the larger ones are the content sets.
 */
const listedChoiceSize = 6;

/**
 * What a leaf module says about itself, beside its entries.
 *
 * Public, and stable while the vocabularies are derived: every vocabulary's leaf is written by
 * {@link renderLeaf} from one of these.
 */
export interface LeafSpec {
  /**
   * The command, run from `packages/pantry`, that prints the leaf, such as
   * `node src/vocab/derive/derive.ts asi`.
   */
  readonly command: string;
  /**
   * The name the leaf exports its entries under, such as `asiInventory`.
   */
  readonly exportName: string;
  /**
   * The vocabulary's name as the comments use it, such as `ASI`.
   */
  readonly label: string;
  /**
   * What the choice groups of more than six members are, which the comment does not list: the end
   * of the sentence "the larger groups are …", such as "the flow, inline and block content sets
   * and carry `0..n` or `1..n`".
   */
  readonly largerGroups: string;
  /**
   * Further module-comment paragraphs, each as its lines, written after the paragraph that names
   * the command; most leaves have none.
   */
  readonly notes: readonly (readonly string[])[];
  /**
   * The pinned XSDs the entries are read from, in reading order.
   */
  readonly sources: readonly SourcePath[];
  /**
   * The test file, relative to `packages/pantry`, that re-runs the command and compares its output
   * with the committed leaf, such as `src/vocab/derive/derive.test.ts`.
   */
  readonly test: string;
}

/**
 * Write a list of names in prose: `a`, `a and b`, `a, b and c`.
 *
 * @param names - The names, each already quoted as it is to be written.
 * @returns The list.
 */
const proseList = (names: readonly string[]): string =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;

/**
 * Write an inventory leaf module, unformatted.
 *
 * Public, and stable while the vocabularies are derived. The module comment states the entry
 * count, the command, its sources and test, the attribute declarations by `whiteSpace` class, the
 * spec's notes and the choice groups of two to six members; then come the helpers every leaf
 * shares and the entries, in the order given.
 *
 * @param spec - What the leaf says about itself.
 * @param entries - Its entries, in the order the leaf lists them.
 * @returns The module text, without a final line break, which `vp fmt` turns into the committed
 *   leaf.
 */
export const renderLeaf = (spec: LeafSpec, entries: readonly Entry[]): string => {
  const rows = entries.flatMap((entry) => entry.attributes);
  const classes = (["collapse", "preserve", "replace", "union"] as const).map(
    (whiteSpace) => `${whiteSpace} ${rows.filter((row) => row.whiteSpace === whiteSpace).length}`,
  );
  const groups = entries.flatMap((entry) => {
    const listed = entry.choices
      .filter((choice) => choice.names.length <= listedChoiceSize)
      .map((choice) => `(${choice.names.join(" | ")}){${rangeOf(choice.occurs)}}`);

    return listed.length === 0 ? [] : [`- \`${entry.handle}\`: ${listed.join("; ")}`];
  });
  const read = proseList(spec.sources.map((source) => `\`${source}\``));

  return [
    ...commentOf([
      [
        `The derived XSD inventory of the ${spec.label} vocabulary: one entry per kind handle, ${entries.length} entries.`,
      ],
      [
        `Generated by \`${spec.command}\` over ${read} and formatted with \`vp fmt\`; \`${spec.test}\` checks that a re-run reproduces this file byte for byte. Attribute declarations by \`whiteSpace\` class over these entries: ${classes.join(", ")}.`,
      ],
      ...spec.notes,
      [
        `A choice group's members each carry the group's bounds multiplied into their own, so a member of a \`(a | b){1..n}\` group reads \`{ min: 1, max: None }\`. The choice groups of two to six members, by entry (the larger groups are ${spec.largerGroups}):`,
      ],
      groups,
    ]),
    ...leafPreamble,
    ...commentOf([[`The ${spec.label} inventory, keyed by kind handle.`]]),
    `export const ${spec.exportName}: InventoryLeaf = {`,
    ...entries.flatMap(entryLines),
    "};",
  ].join("\n");
};

/**
 * The spec of each of the three ASI 3.0.1 leaves: read from `imsqti_asiv3p0p1_v1p0.xsd` by the
 * target of its name.
 *
 * @param leaf - The leaf.
 * @returns Its spec.
 */
export const leafSpecOf = (leaf: Leaf): LeafSpec => ({
  command: `node src/vocab/derive/derive.ts ${leaf}`,
  exportName: `${leaf}Inventory`,
  label: vocabularies[leaf].label,
  largerGroups: "the flow, inline and block content sets and carry `0..n` or `1..n`",
  notes: [],
  sources: ["imsqti_asiv3p0p1_v1p0.xsd"],
  test: "src/vocab/derive/derive.test.ts",
});

/**
 * The spec of the MathML leaf, `src/vocab/inventory/mathml.ts`: read from {@link mathmlSource}
 * and the documents it includes, in reading order, by the `mathml` target.
 */
export const mathmlLeaf: LeafSpec = {
  command: "node src/vocab/derive/derive.ts mathml",
  exportName: "mathmlInventory",
  label: "MathML",
  largerGroups:
    "the content expressions of the group `ContExp` (138 names), the math expressions of `MathExpression` (168: those, the presentation expressions and `m:semantics`) and its extensions by `m:none` and the elementary-math elements (169 to 172), the token contents of `m:cn`, `m:ci` and `m:csymbol` (30 and 31), the qualifiers (7) and the group `unary-arith.class` (9), and carry `0..n`, `1..1` or `1..n`",
  notes: [
    [
      "The kinds are the elements the MathML 3 XSD declares that are not abstract, each once, listed here by handle; `src/vocab/mathml.ts` keeps them in the order of the XSD's documents: common, presentation, content, then strict content. A handle is the element's name with the prefix `m:`, which the XSD binds to the MathML namespace, so a reference written in the XSD is already a handle. A reference to an abstract element or a substitution group head is read as every element its group admits, in document order.",
    ],
    [
      "An anonymous type is recorded as `anonymous, in` and the declaration it is written in; a substitution group member declared with no type has its head's. `m:semantics` is declared three times: in the common document's group `semantics`, and in the strict document's groups `semantics-ci` and `semantics-contexp`, which admit only some of its children. Its entry reads the common declaration, whose children include every child the other two admit. An attribute declared with no type has `xs:anySimpleType`, which preserves whitespace.",
    ],
  ],
  sources: [
    mathmlSource,
    "mathml/mathml3-content.xsd",
    "mathml/mathml3-strict-content.xsd",
    "mathml/mathml3-presentation.xsd",
    "mathml/mathml3-common.xsd",
  ],
  test: "src/vocab/derive/derive.test.ts",
};

/**
 * The four HTML content sets, each in code-point order.
 */
export interface ContentSets {
  readonly HBLOCK: readonly string[];
  readonly HFLOW: readonly string[];
  readonly HINL: readonly string[];
  readonly PHR: readonly string[];
}

/**
 * The complex type each read content set is the HTML part of.
 */
export const contentSetTypes = {
  HFLOW: "BaseHTML5FlowDType",
  HINL: "HTMLTextDType",
  PHR: "BaseHTML5PhrasingDType",
} as const;

/**
 * The HTML element names a complex type's content references: the names with no `qti-` prefix
 * and no namespace prefix, each once, in reading order.
 *
 * @param schema - The schema the type is in.
 * @param type - The complex type's name.
 * @returns The names.
 */
export const htmlNamesOf = (
  schema: XsdSchema,
  type: string,
): Result.Result<readonly string[], XsdReadingError> =>
  Result.gen(function* htmlNamesOfBody() {
    const complexType = yield* requireComponent(schema, schema.complexTypes, "complexType", type);
    const { references } = yield* contentOf(schema, complexType);

    return Arr.dedupe(
      references
        .map((reference) => reference.name)
        .filter((name) => !name.startsWith("qti-") && !name.includes(":")),
    );
  });

/**
 * Read the four HTML content sets: flow, inline and phrasing from their types, and block as flow
 * without inline.
 *
 * @param schema - The ASI 3.0.1 schema.
 * @returns The sets.
 */
export const contentSetsOf = (schema: XsdSchema): Result.Result<ContentSets, XsdReadingError> =>
  Result.gen(function* contentSetsOfBody() {
    const HFLOW = Arr.sort(yield* htmlNamesOf(schema, contentSetTypes.HFLOW), Order.String);
    const HINL = Arr.sort(yield* htmlNamesOf(schema, contentSetTypes.HINL), Order.String);
    const PHR = Arr.sort(yield* htmlNamesOf(schema, contentSetTypes.PHR), Order.String);

    return { HBLOCK: HFLOW.filter((name) => !HINL.includes(name)), HFLOW, HINL, PHR };
  });

/**
 * Write the content sets as the `sets` target prints them: per set a line of its name, source and
 * size, then a line of its names.
 *
 * @param sets - The sets.
 * @returns The text, without a final line break.
 */
export const printContentSets = (sets: ContentSets): string =>
  (
    [
      ["HFLOW", contentSetTypes.HFLOW],
      ["HINL", contentSetTypes.HINL],
      ["HBLOCK", "HFLOW - HINL"],
      ["PHR", contentSetTypes.PHR],
    ] as const
  )
    .flatMap(([name, source]) => [`${name} ${source} ${sets[name].length}`, sets[name].join(" ")])
    .join("\n");

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
 * @returns One count per particle, in order.
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
        const name = Option.orElse(attributeOf(particle, "name"), () =>
          attributeOf(particle, "ref"),
        );

        counts.push(times(Option.exists(name, (value) => kinds.has(value)) ? once : none, occurs));
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
      } else {
        counts.push(none);
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
 * @returns The text, without a final line break: the block `seed/operator-arity.ts` keeps in its
 *   comment.
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
const targetNames = ["asi", "html", "processing", "sets", "arity", "mathml"] as const;

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
 * The spec of a leaf's target: the leaf's module, read from the ASI 3.0.1 XSD.
 *
 * @param leaf - The leaf.
 * @returns Its target.
 */
const leafTarget = (leaf: Leaf): TargetSpec => ({
  print: ({ schema }) =>
    Result.map(entriesOf(schema, leaf), (entries) => renderLeaf(leafSpecOf(leaf), entries)),
  source: "imsqti_asiv3p0p1_v1p0.xsd",
});

/**
 * Every target's spec.
 */
const targets = {
  arity: {
    print: ({ schema }) => Result.map(arityOf(schema), printArity),
    source: "imsqti_asiv3p0_v1p0.xsd",
  },
  asi: leafTarget("asi"),
  html: leafTarget("html"),
  mathml: {
    print: (set) =>
      Result.map(mathmlEntriesOf(set), (entries) =>
        renderLeaf(
          mathmlLeaf,
          Arr.sort(
            entries,
            Order.mapInput(Order.String, (entry: Entry) => entry.handle),
          ),
        ),
      ),
    source: mathmlSource,
  },
  processing: leafTarget("processing"),
  sets: {
    print: ({ schema }) => Result.map(contentSetsOf(schema), printContentSets),
    source: "imsqti_asiv3p0p1_v1p0.xsd",
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
      const url = Option.fromNullishOr(URL.parse(location, sources[path].url)).pipe(
        Option.map((parsed) => parsed.href),
      );
      const pinned = url.pipe(
        Option.flatMap((href) =>
          Arr.findFirst(sourcePaths, (candidate) => sources[candidate].url === href),
        ),
      );

      if (Option.isNone(pinned)) {
        return yield* refuse(
          `${path} includes ${location}, which resolves to ${Option.getOrElse(url, () => "no URL")}, a file no pin in src/vocab/derive/sources.ts describes`,
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
  const pending: SourcePath[] = [path];

  while (pending.length > 0) {
    const next = pending.shift();

    if (next !== undefined && !documents.has(next)) {
      const document = yield* readSource(next);

      documents.set(next, document);
      pending.unshift(...(yield* Effect.fromResult(includesOf(next, document))));
    }
  }

  const schema = yield* Effect.fromResult(indexSchemas([...documents.values()]));

  return { documents, schema } satisfies SchemaSet;
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
    "Print what the vocabulary data is derived from, read from the pinned XSDs in ~/.cache/gr8des/qti3/xsd.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
    ),
  );
}
