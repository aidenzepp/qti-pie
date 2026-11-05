/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * The vocabulary deriver: it reads the pinned QTI XSDs through crust's `readXml` and prints what
 * the pantry's vocabulary data is derived from. It is the one source of the XSD inventory leaves,
 * the HTML content sets and the operator arity table.
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
 *
 * A leaf is regenerated, `html` and `processing` likewise, with:
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
 * - A type reference (`type`, `base`, `ref`, `memberTypes`) is a QName resolved through the
 *   namespaces the `xs:schema` element declares. A name in the XSD namespace is a built-in; a name
 *   in the target namespace names a top-level component of the same document.
 * - A complex type's content is its own particles, after its base type's content when it is a
 *   `complexContent` extension of a type of this document. A `complexContent` restriction states
 *   its whole content itself.
 * - A content model is read to its element references, each with its own occurrence bounds multiplied
 *   by those of every enclosing compositor and group reference, unbounded as `None`. A `choice`
 *   whose references hold two or more distinct names is also recorded as a choice group, after the
 *   groups nested inside it.
 * - A complex type's attributes are its own declarations, then those of its attribute groups in
 *   reference order. A type derived by extension or restriction lists its base type's attributes,
 *   then those of the derivation step.
 * - An attribute's `whiteSpace` class is `collapse` for a list and for every built-in but `xs:string`
 *   (`preserve`) and `xs:normalizedString` (`replace`); a restriction takes its own `whiteSpace`
 *   facet or else its base's class; a union is `collapse` when every member is, else `union`.
 * - A type is mixed when it, or its `complexContent`, says so, or else when its base type is.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, Layer, Option, Order, Result, Schema } from "effect";
import { Argument, Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { readSource } from "#pantry/vocab/derive/sources.ts";
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
 * @param node - The parent element.
 * @returns Its children that are elements.
 */
const elementsOf = (node: Element): readonly Element[] =>
  node.children.flatMap((child) => (child.kind === "element" ? [child] : []));

/**
 * Whether an element is the XSD construct named `local`.
 *
 * @param node - The element.
 * @param local - The construct's local name, such as `sequence`.
 * @returns Whether the element is `xs:<local>`.
 */
const isXs = (node: Element, local: string): boolean =>
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
 * @param node - The parent element.
 * @param local - The construct's local name.
 * @returns The matching children.
 */
const xsChildren = (node: Element, local: string): readonly Element[] =>
  elementsOf(node).filter((child) => isXs(child, local));

/**
 * The first child of an element that is the XSD construct named `local`.
 *
 * @param node - The parent element.
 * @param local - The construct's local name.
 * @returns The child, or `None` when there is none.
 */
const firstXs = (node: Element, local: string): Option.Option<Element> =>
  Arr.head(xsChildren(node, local));

/**
 * The value of an element's attribute that is in no namespace.
 *
 * @param node - The element.
 * @param name - The attribute's local name, such as `minOccurs`.
 * @returns The value, or `None` when the element has no such attribute.
 */
const attributeOf = (node: Element, name: string): Option.Option<string> =>
  Arr.findFirst(
    node.attributes,
    (attribute) => attribute.namespace === "" && attribute.local === name,
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * One schema document, indexed for derivation.
 *
 * The component maps hold the top-level named components by local name. A valid schema names each
 * component once per kind, and the pinned files hold no named component below the top level.
 * `declarations` holds, per element name, the distinct `type` of its declarations at any depth, in
 * document order; a declaration with an anonymous type adds nothing. `namespaces` maps each prefix
 * the `xs:schema` element declares, `""` for the default namespace, and `xml`.
 */
export interface XsdSchema {
  readonly attributeGroups: ReadonlyMap<string, Element>;
  readonly complexTypes: ReadonlyMap<string, Element>;
  readonly declarations: ReadonlyMap<string, readonly string[]>;
  readonly groups: ReadonlyMap<string, Element>;
  readonly namespaces: ReadonlyMap<string, string>;
  readonly simpleTypes: ReadonlyMap<string, Element>;
  readonly targetNamespace: string;
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
 * Index a schema document for derivation.
 *
 * @param document - A schema document as crust read it.
 * @returns The index, or an {@link XsdReadingError} when the root is not `xs:schema`.
 */
export const indexSchema = (document: XmlDocument): Result.Result<XsdSchema, XsdReadingError> => {
  const { root } = document;

  if (!isXs(root, "schema")) {
    return refuse(`the root element is ${root.qname}, not xs:schema`);
  }

  const declared = root.attributes.flatMap((attribute) =>
    attribute.namespace === XMLNS
      ? [[attribute.prefix === "" ? "" : attribute.local, attribute.value] as const]
      : [],
  );

  return Result.succeed({
    attributeGroups: componentsOf(root, "attributeGroup"),
    complexTypes: componentsOf(root, "complexType"),
    declarations: declarationsOf(root),
    groups: componentsOf(root, "group"),
    namespaces: new Map([["xml", XML], ...declared]),
    simpleTypes: componentsOf(root, "simpleType"),
    targetNamespace: Option.getOrElse(attributeOf(root, "targetNamespace"), () => ""),
  });
};

/**
 * A resolved QName: a namespace name and a local name.
 */
interface QName {
  readonly local: string;
  readonly namespace: string;
}

/**
 * Resolve a QName-valued attribute through the namespaces the schema element declares.
 *
 * @param schema - The schema the value is written in.
 * @param lexical - The value as written, such as `xs:string` or `ChoiceInteractionDType`.
 * @returns The resolved name; an unprefixed name with no default namespace is in no namespace. A
 *   prefix the schema element does not declare is an {@link XsdReadingError}.
 */
const resolve = (schema: XsdSchema, lexical: string): Result.Result<QName, XsdReadingError> => {
  const colon = lexical.indexOf(":");
  const prefix = colon === -1 ? "" : lexical.slice(0, colon);
  const local = lexical.slice(colon + 1);

  return Option.match(Option.fromNullishOr(schema.namespaces.get(prefix)), {
    onNone: () =>
      prefix === ""
        ? Result.succeed({ local, namespace: "" })
        : refuse(`the prefix of ${lexical} is not declared on the xs:schema element`),
    onSome: (namespace) => Result.succeed({ local, namespace }),
  });
};

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
 * @param schema - The schema the value is written in.
 * @param components - The component map of the kind the value must name.
 * @param kind - That kind's construct name, for the refusal.
 * @param lexical - The value as written.
 * @returns The component, or an {@link XsdReadingError} when the schema declares none by that name.
 */
const requireComponent = (
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
 * @param node - The construct.
 * @param name - The attribute's local name.
 * @returns The value, or an {@link XsdReadingError} naming the construct when it is absent.
 */
const requireAttribute = (node: Element, name: string): Result.Result<string, XsdReadingError> =>
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
 * other built-in collapses.
 *
 * @param local - The built-in's local name.
 * @returns Its class.
 */
const builtinWhiteSpace = (local: string): WhiteSpace => {
  if (local === "string") {
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
 * local name in the XML namespace, as `xml.xsd` declares them. The inventory writes the type with
 * the `xs:` prefix whatever prefix the referencing schema binds.
 */
const xmlAttributeTypes: ReadonlyMap<string, string> = new Map([
  ["base", "anyURI"],
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
 * @param schema - The schema the declaration is in.
 * @param declaration - The `xs:attribute` element.
 * @param name - Its `name`.
 * @returns The three, or an {@link XsdReadingError} when the declaration has no type.
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

    const definition = yield* requireChild(declaration, ["simpleType"]);

    return {
      name,
      type: yield* inlineTypeName(definition),
      whiteSpace: yield* whiteSpaceOf(schema, { _tag: "Anonymous", definition }),
    };
  });

/**
 * The name, declared type and class of a reference to an `xml:` attribute.
 *
 * @param schema - The schema the reference is in.
 * @param ref - The `ref` as written, which is also the row's name.
 * @returns The three, or an {@link XsdReadingError} for any reference but `xml:base` and
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
        onNone: () => refuse(`the attribute reference ${ref} is not xml:base or xml:lang`),
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
 *   `base` and `lang`, a `use` of `prohibited`, or a declaration with no type.
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
 * A content model read to its element references and its choice groups, each in reading order.
 */
export interface ContentReading {
  readonly choices: readonly ChoiceGroup[];
  readonly references: readonly Reference[];
}

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
 * An element is one reference; a group reference reads its group's particles; a compositor reads
 * its own, and a choice among two or more names adds its group after the ones nested in it; a
 * wildcard references nothing.
 *
 * @param schema - The schema the particles are in.
 * @param particles - The particles, in order.
 * @param outer - The occurrence of everything enclosing them.
 * @returns Their readings, concatenated in order.
 */
const readParticles = (
  schema: XsdSchema,
  particles: readonly Element[],
  outer: Occurs,
): Result.Result<ContentReading, XsdReadingError> =>
  Result.gen(function* readParticlesBody() {
    const readings: ContentReading[] = [];

    for (const particle of particles) {
      const occurs = times(outer, yield* occursOf(particle));

      if (isXs(particle, "element")) {
        const name = yield* Option.match(
          Option.orElse(attributeOf(particle, "name"), () => attributeOf(particle, "ref")),
          {
            onNone: () => refuse("an xs:element has neither a name nor a ref"),
            onSome: (value) => Result.succeed(value),
          },
        );

        readings.push({ choices: [], references: [{ name, occurs }] });
      } else if (isXs(particle, "group")) {
        const group = yield* requireComponent(
          schema,
          schema.groups,
          "group",
          yield* requireAttribute(particle, "ref"),
        );

        readings.push(yield* readParticles(schema, particlesOf(group), occurs));
      } else if (isCompositor(particle)) {
        const inner = yield* readParticles(schema, particlesOf(particle), occurs);
        const names = Arr.dedupe(inner.references.map((reference) => reference.name));

        readings.push(
          isXs(particle, "choice") && names.length > 1
            ? { choices: [...inner.choices, { names, occurs }], references: inner.references }
            : inner,
        );
      }
    }

    return {
      choices: readings.flatMap((reading) => reading.choices),
      references: readings.flatMap((reading) => reading.references),
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
    readParticles(schema, particles, once),
  );

/**
 * A kind of a vocabulary: its handle, the element it is, and the XSD type that element has here.
 */
interface KindSpec {
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
 * @param schema - The schema the element is declared in.
 * @param element - The element name.
 * @returns The type, or an {@link XsdReadingError} when the element is declared with no type or
 *   several, which a dotted handle must then choose between.
 */
const soleTypeOf = (schema: XsdSchema, element: string): Result.Result<string, XsdReadingError> => {
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
 * Read one kind's inventory entry.
 *
 * @param schema - The schema the kind's type is in.
 * @param kind - The kind's handle, element and type.
 * @returns The entry.
 */
const entryOf = (schema: XsdSchema, kind: KindSpec): Result.Result<Entry, XsdReadingError> =>
  Result.gen(function* entryOfBody() {
    const complexType = yield* requireComponent(
      schema,
      schema.complexTypes,
      "complexType",
      kind.type,
    );
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
 * Write an inventory leaf module, unformatted.
 *
 * @param leaf - The leaf's vocabulary.
 * @param entries - Its entries, in handle order.
 * @returns The module text, without a final line break, which `vp fmt` turns into the committed
 *   leaf.
 */
export const renderLeaf = (leaf: Leaf, entries: readonly Entry[]): string => {
  const { label } = vocabularies[leaf];
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

  return [
    ...commentOf([
      [
        `The derived XSD inventory of the ${label} vocabulary: one entry per kind handle, ${entries.length} entries.`,
      ],
      [
        `Generated by \`node src/vocab/derive/derive.ts ${leaf}\` over \`imsqti_asiv3p0p1_v1p0.xsd\` and formatted with \`vp fmt\`; \`src/vocab/derive/derive.test.ts\` checks that a re-run reproduces this file byte for byte. Attribute declarations by \`whiteSpace\` class over these entries: ${classes.join(", ")}.`,
      ],
      [
        "A choice group's members each carry the group's bounds multiplied into their own, so a member of a `(a | b){1..n}` group reads `{ min: 1, max: None }`. The choice groups of two to six members, by entry (the larger groups are the flow, inline and block content sets and carry `0..n` or `1..n`):",
      ],
      groups,
    ]),
    ...leafPreamble,
    ...commentOf([[`The ${label} inventory, keyed by kind handle.`]]),
    `export const ${leaf}Inventory: InventoryLeaf = {`,
    ...entries.flatMap(entryLines),
    "};",
  ].join("\n");
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
const targetNames = ["asi", "html", "processing", "sets", "arity"] as const;

/**
 * The name of a target the deriver prints.
 */
export type Target = (typeof targetNames)[number];

/**
 * What a target derives: the pinned XSD it reads, and the text it prints from that schema.
 */
interface TargetSpec {
  readonly print: (schema: XsdSchema) => Result.Result<string, XsdReadingError>;
  readonly source: SourcePath;
}

/**
 * The spec of a leaf's target: the leaf's module, read from the ASI 3.0.1 XSD.
 *
 * @param leaf - The leaf.
 * @returns Its target.
 */
const leafTarget = (leaf: Leaf): TargetSpec => ({
  print: (schema) => Result.map(entriesOf(schema, leaf), (entries) => renderLeaf(leaf, entries)),
  source: "imsqti_asiv3p0p1_v1p0.xsd",
});

/**
 * Every target's spec.
 */
const targets = {
  arity: {
    print: (schema) => Result.map(arityOf(schema), printArity),
    source: "imsqti_asiv3p0_v1p0.xsd",
  },
  asi: leafTarget("asi"),
  html: leafTarget("html"),
  processing: leafTarget("processing"),
  sets: {
    print: (schema) => Result.map(contentSetsOf(schema), printContentSets),
    source: "imsqti_asiv3p0p1_v1p0.xsd",
  },
} as const satisfies { readonly [Name in Target]: TargetSpec };

/**
 * Read a pinned XSD and index it.
 *
 * @param path - The pinned file.
 * @returns The indexed schema.
 */
export const loadSchema = Effect.fn("vocab.loadSchema")(function* loadSchema(path: SourcePath) {
  return yield* Effect.fromResult(indexSchema(yield* readSource(path)));
});

/**
 * Derive one target's text from its pinned XSD.
 *
 * @param target - What to derive.
 * @returns The text the command prints for it, without a final line break.
 */
export const derive = Effect.fn("vocab.derive")(function* derive(target: Target) {
  const { print, source } = targets[target];

  return yield* Effect.fromResult(print(yield* loadSchema(source)));
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
