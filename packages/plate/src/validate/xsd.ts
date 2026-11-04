/**
 * The QTI XSD as tables: for every element the XSD declares, the attributes it admits with their
 * types and its attribute wildcard, the children it admits, its element wildcard and whether it
 * holds text. {@link generateTables} builds them from the XSD's source view; structural validation
 * reads them and never the XSD itself.
 *
 * @module
 */
import { Effect, Option, Schema } from "effect";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { xmlNamespace, xmlnsNamespace, xsdNamespace } from "#plate/document/source.ts";
import { isNcName } from "#plate/model/values.ts";

/**
 * The XML Schema built-in types a table records by name.
 *
 * They are the built-ins the QTI XSD uses, except `ID`, `IDREF` and `IDREFS`, which record as
 * `NCName` and a list of it: the tables check an identifier's spelling only, and whether it names a
 * declared variable is a prose rule.
 */
export const builtinNames = [
  "anyType",
  "anyURI",
  "boolean",
  "decimal",
  "double",
  "int",
  "integer",
  "NCName",
  "nonNegativeInteger",
  "normalizedString",
  "string",
] as const;

/**
 * The name of a built-in type a table records.
 */
export type BuiltinName = (typeof builtinNames)[number];

/**
 * The Schema of a built-in type's name.
 */
const Builtin = Schema.Literals(builtinNames);

/**
 * The type of an attribute's value, as the XSD's simple type defines it.
 *
 * Each kind records the built-in it derives from: an `enumeration` or a `pattern` by its `base`, a
 * `builtin` by its `name`, and a `list` or a `union` through its item or members. `minInclusive` is
 * the facet's lexical value, so an integer bound stays exact.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `AttributeType` is the type and the Schema of an attribute's type under one name, as section 0.5 of the phase-1 slice list names it; the type is written out because the Schema is recursive.
export type AttributeType =
  | { readonly base: BuiltinName; readonly kind: "enumeration"; readonly values: readonly string[] }
  | { readonly item: AttributeType; readonly kind: "list" }
  | { readonly kind: "union"; readonly members: readonly AttributeType[] }
  | { readonly kind: "builtin"; readonly minInclusive?: string; readonly name: BuiltinName }
  | { readonly base: BuiltinName; readonly kind: "pattern"; readonly pattern: string };

/**
 * The Schema of an attribute's type, recursive through a list's item and a union's members.
 */
export const AttributeType: Schema.Codec<AttributeType> = Schema.Union([
  Schema.Struct({
    base: Builtin,
    kind: Schema.Literal("enumeration"),
    values: Schema.Array(Schema.String),
  }),
  Schema.Struct({
    item: Schema.suspend((): Schema.Codec<AttributeType> => AttributeType),
    kind: Schema.Literal("list"),
  }),
  Schema.Struct({
    kind: Schema.Literal("union"),
    members: Schema.Array(Schema.suspend((): Schema.Codec<AttributeType> => AttributeType)),
  }),
  Schema.Struct({
    kind: Schema.Literal("builtin"),
    minInclusive: Schema.optionalKey(Schema.String),
    name: Builtin,
  }),
  Schema.Struct({ base: Builtin, kind: Schema.Literal("pattern"), pattern: Schema.String }),
]);

/**
 * The Schema of a wildcard, the `xs:anyAttribute` or `xs:any` of an element's type.
 *
 * `namespace` is `##any`, `##other` (any namespace except the target namespace, which is QTI's, and
 * except no namespace) or the sorted list of namespaces it admits, `""` standing for no namespace.
 * `process` is the wildcard's `processContents`.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Wildcard` is the Schema and the type of a wildcard under one name, as section 0.5 of the phase-1 slice list names it.
export const Wildcard = Schema.Struct({
  namespace: Schema.Union([Schema.Literals(["##any", "##other"]), Schema.Array(Schema.String)]),
  process: Schema.Literals(["strict", "lax", "skip"]),
});

/**
 * A wildcard, as {@link Wildcard} decodes it.
 */
export type Wildcard = typeof Wildcard.Type;

/**
 * The namespace rule of a wildcard.
 */
type WildcardNamespace = Wildcard["namespace"];

/**
 * The Schema of an element an element table admits as a child, by namespace and local name.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ChildName` is the Schema and the type of a child's name under one name, as section 0.5 of the phase-1 slice list names it.
export const ChildName = Schema.Struct({ local: Schema.String, namespace: Schema.String });

/**
 * A child's name, as {@link ChildName} decodes it.
 */
export type ChildName = typeof ChildName.Type;

/**
 * The Schema of one attribute an element admits by name: its namespace, `""` for none, and local
 * name, its `use`, its `default` when the XSD gives one, and its type.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `AttributeTable` is the Schema and the type of an attribute's table under one name, as section 0.5 of the phase-1 slice list names it.
export const AttributeTable = Schema.Struct({
  default: Schema.optionalKey(Schema.String),
  local: Schema.String,
  namespace: Schema.String,
  type: AttributeType,
  use: Schema.Literals(["required", "optional", "prohibited"]),
});

/**
 * An attribute's table, as {@link AttributeTable} decodes it.
 */
export type AttributeTable = typeof AttributeTable.Type;

/**
 * The Schema of one element's table: the attributes it admits by name, sorted by namespace then
 * local name, and its attribute wildcard; the children it admits, its element wildcard and whether
 * it holds text.
 *
 * A missing wildcard is an absent key, never `null`, so a table writes to JSON as plain data.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `ElementTable` is the Schema and the type of an element's table under one name, as section 0.5 of the phase-1 slice list names it.
export const ElementTable = Schema.Struct({
  anyAttribute: Schema.optionalKey(Wildcard),
  anyElement: Schema.optionalKey(Wildcard),
  attributes: Schema.Array(AttributeTable),
  children: Schema.Array(ChildName),
  text: Schema.Boolean,
});

/**
 * An element's table, as {@link ElementTable} decodes it.
 */
export type ElementTable = typeof ElementTable.Type;

/**
 * The Schema of the tables: one element table per local name the XSD declares, global or local,
 * in the QTI namespace, keyed in sorted order.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Tables` is the Schema and the type of the tables under one name, as section 0.5 of the phase-1 slice list names it.
export const Tables = Schema.Struct({ elements: Schema.Record(Schema.String, ElementTable) });

/**
 * The tables, as {@link Tables} decodes them.
 */
export type Tables = typeof Tables.Type;

/**
 * The failure of table generation on an XSD construct the tables have no form for.
 *
 * `construct` names the construct, such as `xs:maxLength` or `xs:pattern`, and `detail` says what
 * about it could not be mapped.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class TableGenerationError extends Schema.TaggedError<TableGenerationError>()(
  "TableGenerationError",
  { construct: Schema.String, detail: Schema.String },
) {
  /**
   * The construct, what could not be mapped, and where to map it.
   */
  override get message(): string {
    return `The XSD's ${this.construct} has no table form: ${this.detail}. Map it in generateTables (src/validate/xsd.ts) before generating tables from this XSD.`;
  }
}

/**
 * Construct a {@link TableGenerationError}.
 *
 * @param construct The construct that could not be mapped.
 * @param detail What about it could not be mapped.
 * @returns The failure.
 */
const failure = (construct: string, detail: string): TableGenerationError =>
  new TableGenerationError({ construct, detail });

/**
 * The XSD's pattern for shape coordinates: three or four numbers, or an even count of six or more,
 * each a run of digits with an optional `%`.
 */
const coordinatesPattern = String.raw`(([0-9]+%?[,]){2}([0-9]+%?))|(([0-9]+%?[,]){3}([0-9]+%?))|(([0-9]+%?[,]){2}(([0-9]+%?[,]){2})+([0-9]+%?[,])([0-9]+%?))`;

/**
 * Shape coordinates, the XSD's own pattern anchored whole.
 *
 * The pattern uses only syntax that XSD and JavaScript read alike, so the check is built from the
 * same string the map keys it by and cannot drift from it.
 */
const coordinates = new RegExp(`^(?:${coordinatesPattern})$`, "u");

/**
 * A length: digits, then an optional percent sign.
 */
const length = /^[0-9]+%?$/u;

/**
 * A MIME type: two runs of Basic Latin characters other than the XSD's excluded punctuation,
 * joined by a slash.
 *
 * The `v` flag's class subtraction stands for the XSD's. `\p{ASCII}` is U+0000 to U+007F, the Basic
 * Latin block the XSD names `\p{IsBasicLatin}`. `(` and `)` are escaped because the `v` flag
 * refuses them bare inside a class.
 */
const mimeType = /^[\p{ASCII}--[\(\)<>@,;:\\"\/\[\]?=]]+\/[\p{ASCII}--[\(\)<>@,;:\\"\/\[\]?=]]+$/v;

/**
 * An extension name: `ext:` and at least one letter, digit, `_`, `.` or `-`.
 */
const extensionName = /^ext:[a-zA-Z0-9_.-]+$/u;

/**
 * Report whether a value is an NCName wrapped in braces, a variable reference in a string.
 *
 * @param value The value to check.
 * @returns Whether it is `{`, an NCName and `}`.
 */
const isBracedNcName = (value: string): boolean =>
  value.startsWith("{") && value.endsWith("}") && isNcName(value.slice(1, -1));

/**
 * A hand-written JavaScript check for each `xs:pattern` value of the QTI XSD, keyed by the value as
 * the source view holds it, entities already decoded.
 *
 * An XSD pattern matches the whole value, so every check is anchored at both ends. The patterns
 * built from `\i` and `\c` minus `:` are the NCName production, which {@link isNcName} checks. A
 * pattern missing here is a {@link TableGenerationError}, so the tables never hold a pattern that
 * structural validation cannot check.
 */
export const patternEquivalents: ReadonlyMap<string, (value: string) => boolean> = new Map([
  [coordinatesPattern, (value: string) => coordinates.test(value)],
  [String.raw`\{[\i-[:]][\c-[:]]*\}`, isBracedNcName],
  ["[0-9]+%?", (value: string) => length.test(value)],
  [
    String.raw`[\p{IsBasicLatin}-[()<>@,;:\\"/\[\]?=]]+/[\p{IsBasicLatin}-[()<>@,;:\\"/\[\]?=]]+`,
    (value: string) => mimeType.test(value),
  ],
  [String.raw`(ext:)[a-zA-Z0-9_\.\-]+`, (value: string) => extensionName.test(value)],
  [String.raw`[\i-[:]][\c-[:]]*`, isNcName],
]);

/**
 * Construct the type of a built-in with no facets.
 *
 * @param name The built-in's name.
 * @returns Its attribute type.
 */
const builtinType = (name: BuiltinName): AttributeType => ({ kind: "builtin", name });

/**
 * The type of an attribute the tables cannot see into: one in an imported namespace, which is
 * recorded without reading the imported schema, and one declared with no type, which is
 * `xs:anySimpleType` and admits any string.
 */
const anyString = builtinType("string");

/**
 * The attribute type of each XML Schema built-in a simple type may name, by local name.
 */
const builtins: ReadonlyMap<string, AttributeType> = new Map([
  ...builtinNames.map((name) => [name, builtinType(name)] as const),
  ["ID", builtinType("NCName")],
  ["IDREF", builtinType("NCName")],
  ["IDREFS", { item: builtinType("NCName"), kind: "list" }],
]);

/**
 * Report whether a string is an attribute declaration's `use`.
 */
const isUse = Schema.is(AttributeTable.fields.use);

/**
 * Report whether a string is a wildcard's `processContents`.
 */
const isProcess = Schema.is(Wildcard.fields.process);

/**
 * The facets a restriction may carry, the only three in the QTI XSD.
 */
const knownFacets = ["enumeration", "minInclusive", "pattern"] as const;

/**
 * Report whether a string names one of {@link knownFacets}.
 */
const isKnownFacet = Schema.is(Schema.Literals(knownFacets));

/**
 * The namespace prefixes in scope at an XSD element, `""` for the default namespace.
 */
type Scope = ReadonlyMap<string, string>;

/**
 * A QName of the XSD resolved to its namespace and local name.
 */
interface QName {
  readonly local: string;
  readonly namespace: string;
}

/**
 * What a type admits: its attributes by name and its children, each keyed by {@link clarkName}, its
 * attribute and element wildcards, and whether it holds text.
 */
interface TypeTable {
  readonly anyAttribute: Option.Option<Wildcard>;
  readonly anyElement: Option.Option<Wildcard>;
  readonly attributes: ReadonlyMap<string, AttributeTable>;
  readonly children: ReadonlyMap<string, ChildName>;
  readonly text: boolean;
}

/**
 * The attribute declarations and attribute wildcards one construct holds, attribute group
 * references expanded, in document order.
 */
interface Declarations {
  readonly attributes: readonly AttributeTable[];
  readonly wildcards: readonly Wildcard[];
}

/**
 * The children and element wildcards one content model holds, model groups flattened and group
 * references expanded, in document order.
 */
interface Particles {
  readonly children: readonly ChildName[];
  readonly wildcards: readonly Wildcard[];
}

/**
 * What one table generation reads and remembers: the schema's target namespace and its attribute
 * and element forms, each XSD element's namespace scope, the top-level definitions by name, and the
 * named types it has mapped or is mapping.
 *
 * The caches and `pending` belong to one call of {@link generateTables}, so the generation stays
 * pure over its source view.
 */
interface Context {
  readonly attributeGroups: ReadonlyMap<string, SourceElement>;
  readonly attributes: ReadonlyMap<string, SourceElement>;
  readonly complexCache: Map<string, TypeTable>;
  readonly complexTypes: ReadonlyMap<string, SourceElement>;
  readonly elements: ReadonlyMap<string, SourceElement>;
  readonly groups: ReadonlyMap<string, SourceElement>;
  /**
   * The names of the types being mapped, so a type that derives from itself fails rather than
   * looping.
   */
  readonly pending: Set<string>;
  readonly qualifiedAttributes: boolean;
  readonly qualifiedElements: boolean;
  readonly scopes: ReadonlyMap<SourceElement, Scope>;
  readonly simpleCache: Map<string, AttributeType>;
  readonly simpleTypes: ReadonlyMap<string, SourceElement>;
  readonly target: string;
}

/**
 * The table of a simple type, or of a built-in simple type: text, and no attributes or children.
 */
const simpleTypeTable: TypeTable = {
  anyAttribute: Option.none(),
  anyElement: Option.none(),
  attributes: new Map(),
  children: new Map(),
  text: true,
};

/**
 * The table of `xs:anyType`, the type of an element declared without one: mixed content, and no
 * attributes or children by name but any of either through its lax wildcards.
 */
const anyTypeTable: TypeTable = {
  anyAttribute: Option.some({ namespace: "##any", process: "lax" }),
  anyElement: Option.some({ namespace: "##any", process: "lax" }),
  attributes: new Map(),
  children: new Map(),
  text: true,
};

/**
 * Compare two strings by UTF-16 code units, so the tables' order does not depend on a locale.
 *
 * @param left The first string.
 * @param right The second string.
 * @returns A negative number, zero or a positive number as `left` sorts before, with or after
 *   `right`.
 */
const compareText = (left: string, right: string): number => {
  if (left < right) {
    return -1;
  }

  return left > right ? 1 : 0;
};

/**
 * Sort strings by code unit and drop repeats.
 *
 * @param values The strings.
 * @returns Each distinct string once, in order.
 */
const sortedUnique = (values: readonly string[]): readonly string[] =>
  [...new Set(values)].toSorted(compareText);

/**
 * Name an attribute or child in Clark notation, `{namespace}local`, a key equal only for equal
 * names.
 *
 * @param name The name's parts.
 * @returns The name as one string.
 */
const clarkName = (name: QName): string => `{${name.namespace}}${name.local}`;

/**
 * Compare two names by namespace, then local name, the order of the tables' attributes and
 * children.
 *
 * @param left The first name.
 * @param right The second name.
 * @returns A negative number, zero or a positive number as `left` sorts before, with or after
 *   `right`.
 */
const compareNames = (left: QName, right: QName): number =>
  compareText(left.namespace, right.namespace) || compareText(left.local, right.local);

/**
 * Report whether a child of an XSD element is itself an element in the XML Schema namespace.
 *
 * @param child A child of an XSD element.
 * @returns Whether it is an XSD element.
 */
const isXsdElement = (child: SourceChild): child is SourceElement =>
  child.kind === "element" && child.namespace === xsdNamespace;

/**
 * List an XSD element's XSD element children, in document order.
 *
 * @param element The XSD element.
 * @returns Its children in the XML Schema namespace.
 */
const xsdChildren = (element: SourceElement): readonly SourceElement[] =>
  element.children.filter(isXsdElement);

/**
 * Find an XSD element's first XSD child with a local name.
 *
 * @param element The XSD element.
 * @param local The child's local name, such as `complexContent`.
 * @returns The child, or `undefined` when it has none.
 */
const childNamed = (element: SourceElement, local: string): SourceElement | undefined =>
  xsdChildren(element).find((child) => child.local === local);

/**
 * Read an unqualified attribute of an XSD element, such as `name`, `type` or `base`.
 *
 * @param element The XSD element.
 * @param local The attribute's local name.
 * @returns Its value, or `undefined` when the element has no such attribute.
 */
const valueOf = (element: SourceElement, local: string): string | undefined =>
  element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local)
    ?.value;

/**
 * Split a whitespace-separated list, such as `memberTypes`, into its items.
 *
 * @param list The list as written.
 * @returns Its non-empty items.
 */
const listItems = (list: string): readonly string[] =>
  list.split(/[\t\n\r ]+/u).filter((item) => item !== "");

/**
 * Extend a namespace scope with an element's own declarations.
 *
 * A declaration is an attribute in the xmlns namespace: `xmlns:p` has the local name `p`, and the
 * default namespace's `xmlns` has the local name `xmlns`, which no prefix may be.
 *
 * @param element The element.
 * @param parent The scope of the element's parent.
 * @returns The scope at the element.
 */
const declare = (element: SourceElement, parent: Scope): Scope => {
  const declarations = element.attributes.filter(
    (attribute) => attribute.namespace === xmlnsNamespace,
  );
  if (declarations.length === 0) {
    return parent;
  }

  return new Map([
    ...parent,
    ...declarations.map(
      (declaration) =>
        [declaration.local === "xmlns" ? "" : declaration.local, declaration.value] as const,
    ),
  ]);
};

/**
 * What one walk of the schema finds: each XSD element's namespace scope, and every named element
 * declaration with its name, in document order.
 */
interface SchemaIndex {
  readonly declarations: readonly (readonly [string, SourceElement])[];
  readonly scopes: ReadonlyMap<SourceElement, Scope>;
}

/**
 * Walk the schema once: record each XSD element's namespace scope, and collect every
 * `xs:element` with a `name`, global or local, in document order.
 *
 * Annotations are skipped, since nothing in them declares. The walk keeps its own stack.
 *
 * @param root The `xs:schema` element.
 * @returns The scopes, and each named element declaration with its name.
 */
const indexSchema = (root: SourceElement): SchemaIndex => {
  const scopes = new Map<SourceElement, Scope>();
  const declarations: (readonly [string, SourceElement])[] = [];
  const pending: (readonly [SourceElement, Scope])[] = [[root, declare(root, new Map())]];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [element, scope] = next;
    scopes.set(element, scope);

    const name = valueOf(element, "name");
    if (element.local === "element" && name !== undefined) {
      declarations.push([name, element]);
    }

    for (const child of xsdChildren(element).toReversed()) {
      if (child.local !== "annotation") {
        pending.push([child, declare(child, scope)]);
      }
    }
  }

  return { declarations, scopes };
};

/**
 * Index the schema's top-level definitions of one kind by name.
 *
 * @param root The `xs:schema` element.
 * @param local The definition's construct, such as `complexType`.
 * @returns Each named definition of that kind.
 */
const definitions = (root: SourceElement, local: string): ReadonlyMap<string, SourceElement> =>
  new Map(
    xsdChildren(root).flatMap((child) => {
      const name = valueOf(child, "name");

      return child.local === local && name !== undefined ? [[name, child] as const] : [];
    }),
  );

/**
 * Resolve a QName written in an XSD attribute, such as `type="xs:string"` or `ref="xml:lang"`.
 *
 * The `xml` prefix is always the XML namespace. An unprefixed name takes the default namespace in
 * scope, or no namespace when none is declared.
 *
 * @param context The generation's context.
 * @param element The XSD element whose attribute holds the QName.
 * @param qname The QName as written.
 * @returns The resolved name, or {@link TableGenerationError} when its prefix is not declared.
 */
const resolveQName = (
  context: Context,
  element: SourceElement,
  qname: string,
): Effect.Effect<QName, TableGenerationError> => {
  const colon = qname.indexOf(":");
  const prefix = colon === -1 ? "" : qname.slice(0, colon);
  const local = qname.slice(colon + 1);
  if (prefix === "xml") {
    return Effect.succeed({ local, namespace: xmlNamespace });
  }

  const namespace = context.scopes.get(element)?.get(prefix);
  if (namespace !== undefined) {
    return Effect.succeed({ local, namespace });
  }

  return prefix === ""
    ? Effect.succeed({ local, namespace: "" })
    : Effect.fail(failure("QName", `the prefix "${prefix}" of ${qname} is not declared`));
};

/**
 * Report the built-in an atomic type derives from.
 *
 * @param type The type.
 * @returns The built-in's name, or none for a list or a union.
 */
const derivedBuiltin = (type: AttributeType): Option.Option<BuiltinName> => {
  switch (type.kind) {
    case "builtin": {
      return Option.some(type.name);
    }
    case "enumeration":
    case "pattern": {
      return Option.some(type.base);
    }
    case "list":
    case "union": {
      return Option.none();
    }
    default: {
      return type satisfies never;
    }
  }
};

/**
 * Apply a restriction's facets to its base type.
 *
 * One restriction uses one kind of facet: one or more `enumeration`s, which name the values and
 * keep the base's built-in; one `pattern`, which must have an entry in {@link patternEquivalents};
 * or one `minInclusive`. A pattern or a bound restricts a plain built-in only.
 *
 * @param base The type the restriction restricts.
 * @param facets The restriction's facet elements.
 * @returns The restricted type, or {@link TableGenerationError} naming a facet the tables have no
 *   form for.
 */
const applyFacets = Effect.fnUntraced(function* applyFacets(
  base: AttributeType,
  facets: readonly SourceElement[],
): Effect.fn.Return<AttributeType, TableGenerationError> {
  const values: Readonly<Record<(typeof knownFacets)[number], string[]>> = {
    enumeration: [],
    minInclusive: [],
    pattern: [],
  };
  for (const facet of facets) {
    if (!isKnownFacet(facet.local)) {
      return yield* failure(
        `xs:${facet.local}`,
        `the facet ${facet.local} is not one of ${knownFacets.join(", ")}`,
      );
    }

    const value = valueOf(facet, "value");
    if (value === undefined) {
      return yield* failure(`xs:${facet.local}`, "the facet has no value");
    }

    values[facet.local].push(value);
  }

  const { enumeration, minInclusive, pattern } = values;
  const kinds = [enumeration, minInclusive, pattern].filter((found) => found.length > 0).length;
  if (kinds === 0) {
    return base;
  }

  if (kinds > 1) {
    return yield* failure(
      "xs:restriction",
      "it combines more than one of enumeration, pattern and minInclusive",
    );
  }

  if (enumeration.length > 0) {
    const builtin = derivedBuiltin(base);
    if (Option.isNone(builtin)) {
      return yield* failure("xs:enumeration", "it restricts a list or a union type");
    }

    return { base: builtin.value, kind: "enumeration", values: enumeration };
  }

  const construct = pattern.length > 0 ? "xs:pattern" : "xs:minInclusive";
  if (base.kind !== "builtin" || base.minInclusive !== undefined) {
    return yield* failure(construct, "it restricts a type that is not a built-in without facets");
  }

  const [only, ...more] = pattern.length > 0 ? pattern : minInclusive;
  if (only === undefined || more.length > 0) {
    return yield* failure(construct, "one restriction holds more than one of it");
  }

  if (pattern.length === 0) {
    return { kind: "builtin", minInclusive: only, name: base.name };
  }

  if (!patternEquivalents.has(only)) {
    return yield* failure(construct, `the pattern ${only} has no entry in patternEquivalents`);
  }

  return { base: base.name, kind: "pattern", pattern: only };
});

/**
 * Map a named simple type, or an XML Schema built-in, to its attribute type.
 *
 * A named type is mapped once per generation and then read from the cache.
 *
 * @param context The generation's context.
 * @param name The type's resolved name.
 * @returns Its attribute type, or {@link TableGenerationError} when no such simple type exists.
 */
const namedSimpleType = Effect.fnUntraced(function* namedSimpleType(
  context: Context,
  name: QName,
): Effect.fn.Return<AttributeType, TableGenerationError> {
  if (name.namespace === xsdNamespace) {
    const known = builtins.get(name.local);
    if (known === undefined) {
      return yield* failure("type", `xs:${name.local} is not a built-in the tables record`);
    }

    return known;
  }

  const definition =
    name.namespace === context.target ? context.simpleTypes.get(name.local) : undefined;
  if (definition === undefined) {
    return yield* failure("type", `no simple type ${clarkName(name)} is declared`);
  }

  const cached = context.simpleCache.get(name.local);
  if (cached !== undefined) {
    return cached;
  }

  if (context.pending.has(name.local)) {
    return yield* failure("xs:simpleType", `${name.local} derives from itself`);
  }

  context.pending.add(name.local);

  // oxlint-disable-next-line eslint/no-use-before-define -- `namedSimpleType` and `simpleType` are mutually recursive, as a simple type names others; the call runs only after both are defined.
  const type = yield* simpleType(context, definition);
  context.pending.delete(name.local);
  context.simpleCache.set(name.local, type);

  return type;
});

/**
 * Map the type an XSD construct names in an attribute, or defines inline in an `xs:simpleType`
 * child.
 *
 * @param context The generation's context.
 * @param holder The construct, such as an `xs:list` with its `itemType`.
 * @param attribute The attribute that names the type.
 * @returns The type, or none when the construct names no type and defines none inline.
 */
const typeOf = Effect.fnUntraced(function* typeOf(
  context: Context,
  holder: SourceElement,
  attribute: string,
): Effect.fn.Return<Option.Option<AttributeType>, TableGenerationError> {
  const name = valueOf(holder, attribute);
  if (name !== undefined) {
    return Option.some(yield* namedSimpleType(context, yield* resolveQName(context, holder, name)));
  }

  const inline = childNamed(holder, "simpleType");

  // oxlint-disable-next-line eslint/no-use-before-define -- `typeOf` and `simpleType` are mutually recursive, as simple types nest inline; the call runs only after both are defined.
  return inline === undefined ? Option.none() : Option.some(yield* simpleType(context, inline));
});

/**
 * Map an `xs:simpleType` definition to its attribute type: a restriction of a built-in or a named
 * type with its facets, a list, or a union of `memberTypes` and inline members.
 *
 * @param context The generation's context.
 * @param definition The `xs:simpleType` element.
 * @returns The attribute type, or {@link TableGenerationError} naming what could not be mapped.
 */
const simpleType = Effect.fnUntraced(function* simpleType(
  context: Context,
  definition: SourceElement,
): Effect.fn.Return<AttributeType, TableGenerationError> {
  const derivation = xsdChildren(definition).find((child) => child.local !== "annotation");
  if (derivation === undefined) {
    return yield* failure("xs:simpleType", "it holds no restriction, list or union");
  }

  if (derivation.local === "restriction") {
    const base = yield* typeOf(context, derivation, "base");
    if (Option.isNone(base)) {
      return yield* failure("xs:restriction", "it has neither a base nor an inline simple type");
    }

    const facets = xsdChildren(derivation).filter(
      (child) => child.local !== "annotation" && child.local !== "simpleType",
    );

    return yield* applyFacets(base.value, facets);
  }

  if (derivation.local === "list") {
    const item = yield* typeOf(context, derivation, "itemType");
    if (Option.isNone(item)) {
      return yield* failure("xs:list", "it has neither an itemType nor an inline simple type");
    }

    return { item: item.value, kind: "list" };
  }

  if (derivation.local === "union") {
    const members: AttributeType[] = [];
    for (const member of listItems(valueOf(derivation, "memberTypes") ?? "")) {
      members.push(
        yield* namedSimpleType(context, yield* resolveQName(context, derivation, member)),
      );
    }
    for (const inline of xsdChildren(derivation).filter((child) => child.local === "simpleType")) {
      members.push(yield* simpleType(context, inline));
    }
    if (members.length === 0) {
      return yield* failure("xs:union", "it has no member types");
    }

    return { kind: "union", members };
  }

  return yield* failure(
    `xs:${derivation.local}`,
    "a simple type holds it in place of a derivation",
  );
});

/**
 * Map an `xs:anyAttribute` or `xs:any` to its wildcard, with XSD's defaults `##any` and `strict`.
 *
 * In a namespace list, `##targetNamespace` becomes the target namespace and `##local` becomes `""`.
 *
 * @param context The generation's context.
 * @param element The wildcard element.
 * @returns The wildcard, or {@link TableGenerationError} for a value XSD does not define.
 */
const wildcardOf = Effect.fnUntraced(function* wildcardOf(
  context: Context,
  element: SourceElement,
): Effect.fn.Return<Wildcard, TableGenerationError> {
  const construct = `xs:${element.local}`;
  const process = valueOf(element, "processContents") ?? "strict";
  if (!isProcess(process)) {
    return yield* failure(construct, `processContents="${process}" is not strict, lax or skip`);
  }

  const namespace = valueOf(element, "namespace") ?? "##any";
  if (namespace === "##any" || namespace === "##other") {
    return { namespace, process };
  }

  const names: string[] = [];
  for (const token of listItems(namespace)) {
    if (token === "##targetNamespace") {
      names.push(context.target);
    } else if (token === "##local") {
      names.push("");
    } else if (token.startsWith("##")) {
      return yield* failure(construct, `the namespace token ${token} is not one XSD defines`);
    } else {
      names.push(token);
    }
  }

  return { namespace: sortedUnique(names), process };
});

/**
 * Report whether a wildcard's namespace rule is `##any` or `##other` rather than a list.
 *
 * @param namespace The rule.
 * @returns Whether it is one of the two named rules.
 */
const isNamedRule = (namespace: WildcardNamespace): namespace is "##any" | "##other" =>
  namespace === "##any" || namespace === "##other";

/**
 * Join two wildcard namespace rules into the rule that admits what either admits.
 *
 * `##other` excludes the target namespace and no namespace, so its union with a list is `##other`
 * when the list holds neither and `##any` when it holds both.
 *
 * @param target The schema's target namespace.
 * @param left One rule.
 * @param right The other rule.
 * @returns The union, or {@link TableGenerationError} when `##other` and a list holding only one of
 *   the two excluded namespaces have no union a rule can write.
 */
const unionNamespaces = (
  target: string,
  left: WildcardNamespace,
  right: WildcardNamespace,
): Effect.Effect<WildcardNamespace, TableGenerationError> => {
  if (left === "##any" || right === "##any") {
    return Effect.succeed("##any");
  }

  if (!isNamedRule(left) && !isNamedRule(right)) {
    return Effect.succeed(sortedUnique([...left, ...right]));
  }

  const list = isNamedRule(left) ? right : left;
  if (isNamedRule(list)) {
    return Effect.succeed("##other");
  }

  const coversTarget = list.includes(target);
  if (coversTarget === list.includes("")) {
    return Effect.succeed(coversTarget ? "##any" : "##other");
  }

  return Effect.fail(
    failure("wildcard", `the union of ##other and the list ${list.join(" ")} has no rule`),
  );
};

/**
 * Report whether two wildcards admit the same namespaces with the same processing.
 *
 * @param left One wildcard.
 * @param right The other.
 * @returns Whether they are equal; a namespace list is sorted, so equal lists are equal in order.
 */
const sameWildcard = (left: Wildcard, right: Wildcard): boolean =>
  left.process === right.process &&
  (isNamedRule(left.namespace) || isNamedRule(right.namespace)
    ? left.namespace === right.namespace
    : left.namespace.join(" ") === right.namespace.join(" "));

/**
 * Join the wildcards one construct gathers from its own `xs:anyAttribute` and its attribute groups.
 *
 * XSD intersects them; the tables take them when they are all equal, which is how the QTI XSD
 * writes them, and fail on any other intersection.
 *
 * @param wildcards The gathered wildcards.
 * @returns The construct's wildcard, none when it gathered none.
 */
const completeWildcard = (
  wildcards: readonly Wildcard[],
): Effect.Effect<Option.Option<Wildcard>, TableGenerationError> => {
  const [first, ...rest] = wildcards;
  if (first === undefined) {
    return Effect.succeed(Option.none());
  }

  return rest.every((wildcard) => sameWildcard(wildcard, first))
    ? Effect.succeed(Option.some(first))
    : Effect.fail(failure("xs:anyAttribute", "one type gathers attribute wildcards that differ"));
};

/**
 * The processing a wildcard asks for, from the strictest to the laxest.
 */
const processOrder: readonly Wildcard["process"][] = ["strict", "lax", "skip"];

/**
 * Join two optional wildcards into one that admits what either admits, with the laxer processing:
 * two declarations of one element name, an extension and its base, or two `xs:any` of one content
 * model.
 *
 * @param target The schema's target namespace.
 * @param left One wildcard, or `undefined`.
 * @param right The other, or `undefined`.
 * @returns The joined wildcard, none when neither is given.
 */
const unionWildcards = Effect.fnUntraced(function* unionWildcards(
  target: string,
  left: Wildcard | undefined,
  right: Wildcard | undefined,
): Effect.fn.Return<Option.Option<Wildcard>, TableGenerationError> {
  if (left === undefined || right === undefined) {
    return Option.fromNullishOr(left ?? right);
  }

  const namespace = yield* unionNamespaces(target, left.namespace, right.namespace);
  const process =
    processOrder.indexOf(left.process) >= processOrder.indexOf(right.process)
      ? left.process
      : right.process;

  return Option.some({ namespace, process });
});

/**
 * Join the element wildcards one content model gathers.
 *
 * Each `xs:any` is a particle of its own, so an element any of them matches is admitted: the
 * tables take their union, as {@link unionWildcards} joins two.
 *
 * @param target The schema's target namespace.
 * @param wildcards The gathered wildcards.
 * @returns The content model's wildcard, none when it gathered none.
 */
const joinWildcards = Effect.fnUntraced(function* joinWildcards(
  target: string,
  wildcards: readonly Wildcard[],
): Effect.fn.Return<Option.Option<Wildcard>, TableGenerationError> {
  let joined = Option.none<Wildcard>();
  for (const wildcard of wildcards) {
    joined = yield* unionWildcards(target, Option.getOrUndefined(joined), wildcard);
  }

  return joined;
});

/**
 * Refuse an attribute declaration that fixes its value, which the tables cannot record.
 *
 * @param declaration The `xs:attribute` element.
 * @returns Nothing, or {@link TableGenerationError} when it fixes its value.
 */
const refuseFixed = (declaration: SourceElement): Effect.Effect<void, TableGenerationError> =>
  valueOf(declaration, "fixed") === undefined
    ? Effect.void
    : Effect.fail(failure("xs:attribute", "a fixed value is not recorded by the tables"));

/**
 * Add a declaration's `default` to an attribute table when it has one.
 *
 * @param table The table without a default.
 * @param value The default as written, or `undefined`.
 * @returns The table, with `default` only when a value is given.
 */
const withDefault = (table: AttributeTable, value: string | undefined): AttributeTable =>
  value === undefined ? table : { default: value, ...table };

/**
 * Map an `xs:attribute` declaration or reference to its attribute table.
 *
 * A reference into the target namespace takes the global declaration's type. A reference into an
 * imported namespace, such as `xml:lang`, is recorded by namespace and local name as a string,
 * without reading the imported schema. A local declaration is in no namespace unless its `form`,
 * or the schema's `attributeFormDefault`, is `qualified`.
 *
 * @param context The generation's context.
 * @param declaration The `xs:attribute` element.
 * @returns The table, or {@link TableGenerationError} naming what could not be mapped.
 */
const attributeTable = Effect.fnUntraced(function* attributeTable(
  context: Context,
  declaration: SourceElement,
): Effect.fn.Return<AttributeTable, TableGenerationError> {
  const use = valueOf(declaration, "use") ?? "optional";
  if (!isUse(use)) {
    return yield* failure("xs:attribute", `use="${use}" is not required, optional or prohibited`);
  }

  yield* refuseFixed(declaration);

  const ref = valueOf(declaration, "ref");
  if (ref !== undefined) {
    const name = yield* resolveQName(context, declaration, ref);
    if (name.namespace !== context.target) {
      return withDefault({ ...name, type: anyString, use }, valueOf(declaration, "default"));
    }

    const global = context.attributes.get(name.local);
    if (global === undefined) {
      return yield* failure("xs:attribute", `no global attribute ${ref} is declared`);
    }

    yield* refuseFixed(global);

    const type = yield* typeOf(context, global, "type");

    return withDefault(
      { ...name, type: Option.getOrElse(type, () => anyString), use },
      valueOf(declaration, "default") ?? valueOf(global, "default"),
    );
  }

  const local = valueOf(declaration, "name");
  if (local === undefined) {
    return yield* failure("xs:attribute", "a declaration has neither a name nor a ref");
  }

  const form = valueOf(declaration, "form") ?? (context.qualifiedAttributes ? "qualified" : "");
  const type = yield* typeOf(context, declaration, "type");

  return withDefault(
    {
      local,
      namespace: form === "qualified" ? context.target : "",
      type: Option.getOrElse(type, () => anyString),
      use,
    },
    valueOf(declaration, "default"),
  );
});

/**
 * Gather a construct's attribute declarations and wildcards, expanding its attribute group
 * references, nested ones included.
 *
 * @param context The generation's context.
 * @param holder A complex type, a derivation or an attribute group.
 * @param groups The attribute groups being expanded, so a group that refers to itself fails.
 * @returns The declarations and wildcards in document order.
 */
const gather = Effect.fnUntraced(function* gather(
  context: Context,
  holder: SourceElement,
  groups: ReadonlySet<string>,
): Effect.fn.Return<Declarations, TableGenerationError> {
  const attributes: AttributeTable[] = [];
  const wildcards: Wildcard[] = [];
  for (const child of xsdChildren(holder)) {
    if (child.local === "attribute") {
      attributes.push(yield* attributeTable(context, child));
    } else if (child.local === "anyAttribute") {
      wildcards.push(yield* wildcardOf(context, child));
    } else if (child.local === "attributeGroup") {
      const ref = valueOf(child, "ref");
      if (ref === undefined) {
        return yield* failure("xs:attributeGroup", "a reference has no ref");
      }

      const name = yield* resolveQName(context, child, ref);
      const group =
        name.namespace === context.target ? context.attributeGroups.get(name.local) : undefined;
      if (group === undefined) {
        return yield* failure("xs:attributeGroup", `no attribute group ${ref} is declared`);
      }

      if (groups.has(name.local)) {
        return yield* failure("xs:attributeGroup", `${ref} refers to itself`);
      }

      const nested = yield* gather(context, group, new Set([...groups, name.local]));
      attributes.push(...nested.attributes);
      wildcards.push(...nested.wildcards);
    }
  }

  return { attributes, wildcards };
});

/**
 * Apply attribute declarations over inherited attributes.
 *
 * A declaration replaces an inherited one of the same name. A `prohibited` one adds nothing, and in
 * a restriction it removes the inherited attribute.
 *
 * @param inherited The base type's attributes.
 * @param declared The derivation's own declarations.
 * @param restricting Whether the derivation is a restriction.
 * @returns The derived type's attributes.
 */
const applyDeclarations = (
  inherited: ReadonlyMap<string, AttributeTable>,
  declared: readonly AttributeTable[],
  restricting: boolean,
): ReadonlyMap<string, AttributeTable> => {
  const attributes = new Map(inherited);
  for (const declaration of declared) {
    if (declaration.use !== "prohibited") {
      attributes.set(clarkName(declaration), declaration);
    } else if (restricting) {
      attributes.delete(clarkName(declaration));
    }
  }

  return attributes;
};

/**
 * Name the child an `xs:element` particle admits.
 *
 * A reference into the target namespace names a global element, which must be declared. A
 * reference into an imported namespace, such as `m3:math`, is the child by namespace and local
 * name, and the imported schema is never read. A local declaration is in no namespace unless its
 * `form`, or the schema's `elementFormDefault`, is `qualified`; its own table comes from its own
 * declaration, so its content is not walked here.
 *
 * @param context The generation's context.
 * @param declaration The `xs:element` particle.
 * @returns The child's name, or {@link TableGenerationError} naming what could not be mapped.
 */
const childName = Effect.fnUntraced(function* childName(
  context: Context,
  declaration: SourceElement,
): Effect.fn.Return<ChildName, TableGenerationError> {
  const ref = valueOf(declaration, "ref");
  if (ref !== undefined) {
    const name = yield* resolveQName(context, declaration, ref);
    if (name.namespace === context.target && !context.elements.has(name.local)) {
      return yield* failure("xs:element", `no global element ${ref} is declared`);
    }

    return { local: name.local, namespace: name.namespace };
  }

  const local = valueOf(declaration, "name");
  if (local === undefined) {
    return yield* failure("xs:element", "a declaration has neither a name nor a ref");
  }

  const form = valueOf(declaration, "form") ?? (context.qualifiedElements ? "qualified" : "");

  return { local, namespace: form === "qualified" ? context.target : "" };
});

/**
 * The model groups a content model nests, whose particles flatten into it.
 */
const modelGroups: ReadonlySet<string> = new Set(["all", "choice", "sequence"]);

/**
 * Gather a content model's children and element wildcards, flattening `sequence`, `choice` and
 * `all` and expanding `xs:group` references, nested ones included.
 *
 * Order and counts are dropped: the tables keep which children an element admits, never a content
 * model automaton. Constructs that are not particles, such as attribute declarations, are skipped.
 *
 * @param context The generation's context.
 * @param holder A complex type, a derivation, a model group or a group definition.
 * @param groups The groups being expanded, so a group that refers to itself fails.
 * @returns The children and wildcards in document order.
 */
const gatherParticles = Effect.fnUntraced(function* gatherParticles(
  context: Context,
  holder: SourceElement,
  groups: ReadonlySet<string>,
): Effect.fn.Return<Particles, TableGenerationError> {
  const children: ChildName[] = [];
  const wildcards: Wildcard[] = [];
  for (const child of xsdChildren(holder)) {
    if (child.local === "element") {
      children.push(yield* childName(context, child));
    } else if (child.local === "any") {
      wildcards.push(yield* wildcardOf(context, child));
    } else if (modelGroups.has(child.local)) {
      const nested = yield* gatherParticles(context, child, groups);
      children.push(...nested.children);
      wildcards.push(...nested.wildcards);
    } else if (child.local === "group") {
      const ref = valueOf(child, "ref");
      if (ref === undefined) {
        return yield* failure("xs:group", "a reference has no ref");
      }

      const name = yield* resolveQName(context, child, ref);
      const group = name.namespace === context.target ? context.groups.get(name.local) : undefined;
      if (group === undefined) {
        return yield* failure("xs:group", `no group ${ref} is declared`);
      }

      if (groups.has(name.local)) {
        return yield* failure("xs:group", `${ref} refers to itself`);
      }

      const nested = yield* gatherParticles(context, group, new Set([...groups, name.local]));
      children.push(...nested.children);
      wildcards.push(...nested.wildcards);
    }
  }

  return { children, wildcards };
});

/**
 * Key children by {@link clarkName}, so a child named twice is admitted once.
 *
 * @param children The children.
 * @returns Each distinct child, keyed by its name.
 */
const childMap = (children: Iterable<ChildName>): ReadonlyMap<string, ChildName> =>
  new Map([...children].map((child) => [clarkName(child), child]));

/**
 * Report whether a complex type's content is mixed, so its element holds text.
 *
 * As XSD reads them, its `complexContent`'s `mixed` decides when it has one, otherwise the type's
 * own, and neither means element-only. The value is an `xs:boolean`.
 *
 * @param type The `xs:complexType` element.
 * @param content Its `xs:complexContent`, when it has one.
 * @returns Whether its content is mixed.
 */
const isMixed = (type: SourceElement, content?: SourceElement): boolean => {
  const mixed =
    (content === undefined ? undefined : valueOf(content, "mixed")) ?? valueOf(type, "mixed");
  const value = mixed?.trim();

  return value === "true" || value === "1";
};

/**
 * The attribute wildcard of a derived type: a restriction's own, and an extension's base's joined
 * with its own and taking its own processing, as XSD defines both.
 *
 * @param target The schema's target namespace.
 * @param restricting Whether the derivation is a restriction.
 * @param base The base type's attribute wildcard.
 * @param own The derivation's own attribute wildcard.
 * @returns The derived type's attribute wildcard.
 */
const derivedAttributeWildcard = (
  target: string,
  restricting: boolean,
  base: Option.Option<Wildcard>,
  own: Option.Option<Wildcard>,
): Effect.Effect<Option.Option<Wildcard>, TableGenerationError> => {
  if (restricting || Option.isNone(base)) {
    return Effect.succeed(own);
  }

  if (Option.isNone(own)) {
    return Effect.succeed(base);
  }

  return unionNamespaces(target, base.value.namespace, own.value.namespace).pipe(
    Effect.map((namespace) => Option.some({ namespace, process: own.value.process })),
  );
};

/**
 * Report the table of the type a name resolves to: a named complex type, a named simple type or an
 * XML Schema built-in.
 *
 * @param context The generation's context.
 * @param name The type's resolved name.
 * @returns Its table, or {@link TableGenerationError} when no such type exists.
 */
const typeTable = Effect.fnUntraced(function* typeTable(
  context: Context,
  name: QName,
): Effect.fn.Return<TypeTable, TableGenerationError> {
  if (name.namespace === xsdNamespace) {
    if (name.local === "anyType") {
      return anyTypeTable;
    }

    if (builtins.has(name.local)) {
      return simpleTypeTable;
    }

    return yield* failure("type", `xs:${name.local} is not a built-in the tables record`);
  }

  const complex =
    name.namespace === context.target ? context.complexTypes.get(name.local) : undefined;
  if (complex === undefined) {
    if (name.namespace === context.target && context.simpleTypes.has(name.local)) {
      return simpleTypeTable;
    }

    return yield* failure("type", `no type ${clarkName(name)} is declared`);
  }

  const cached = context.complexCache.get(name.local);
  if (cached !== undefined) {
    return cached;
  }

  if (context.pending.has(name.local)) {
    return yield* failure("xs:complexType", `${name.local} derives from itself`);
  }

  context.pending.add(name.local);

  // oxlint-disable-next-line eslint/no-use-before-define -- `typeTable` and `complexTable` are mutually recursive, as a complex type derives from another; the call runs only after both are defined.
  const table = yield* complexTable(context, complex);
  context.pending.delete(name.local);
  context.complexCache.set(name.local, table);

  return table;
});

/**
 * Report the table of a complex type.
 *
 * Without `complexContent` or `simpleContent`, its attributes and children are its own. An
 * extension inherits its base's attributes and children and adds its own, and each of its
 * wildcards is the union of its base's and its own. A restriction inherits its base's attributes
 * and applies its own declarations, its attribute wildcard is its own alone, and its children and
 * element wildcard are its own alone, as XSD defines them. It holds text when its content is mixed
 * or simple, never by inheritance.
 *
 * @param context The generation's context.
 * @param type The `xs:complexType` element.
 * @returns Its table, or {@link TableGenerationError} naming what could not be mapped.
 */
const complexTable = Effect.fnUntraced(function* complexTable(
  context: Context,
  type: SourceElement,
): Effect.fn.Return<TypeTable, TableGenerationError> {
  const content = childNamed(type, "complexContent") ?? childNamed(type, "simpleContent");
  if (content === undefined) {
    const own = yield* gather(context, type, new Set());
    const particles = yield* gatherParticles(context, type, new Set());

    return {
      anyAttribute: yield* completeWildcard(own.wildcards),
      anyElement: yield* joinWildcards(context.target, particles.wildcards),
      attributes: applyDeclarations(new Map(), own.attributes, false),
      children: childMap(particles.children),
      text: isMixed(type),
    };
  }

  const derivation = childNamed(content, "extension") ?? childNamed(content, "restriction");
  if (derivation === undefined) {
    return yield* failure(`xs:${content.local}`, "it holds neither an extension nor a restriction");
  }

  const baseName = valueOf(derivation, "base");
  if (baseName === undefined) {
    return yield* failure(`xs:${derivation.local}`, "it has no base");
  }

  const base = yield* typeTable(context, yield* resolveQName(context, derivation, baseName));
  const own = yield* gather(context, derivation, new Set());
  const particles = yield* gatherParticles(context, derivation, new Set());
  const ownElements = yield* joinWildcards(context.target, particles.wildcards);
  const restricting = derivation.local === "restriction";

  return {
    anyAttribute: yield* derivedAttributeWildcard(
      context.target,
      restricting,
      base.anyAttribute,
      yield* completeWildcard(own.wildcards),
    ),
    anyElement: restricting
      ? ownElements
      : yield* unionWildcards(
          context.target,
          Option.getOrUndefined(base.anyElement),
          Option.getOrUndefined(ownElements),
        ),
    attributes: applyDeclarations(base.attributes, own.attributes, restricting),
    children: restricting
      ? childMap(particles.children)
      : childMap([...base.children.values(), ...particles.children]),
    text: content.local === "simpleContent" || isMixed(type, content),
  };
});

/**
 * Report the table of an element declaration's type: its `type`, its inline type, or, with
 * neither, `xs:anyType`.
 *
 * @param context The generation's context.
 * @param element The `xs:element` element.
 * @returns Its type's table, or {@link TableGenerationError} naming what could not be mapped.
 */
const declarationTable = Effect.fnUntraced(function* declarationTable(
  context: Context,
  element: SourceElement,
): Effect.fn.Return<TypeTable, TableGenerationError> {
  const typeName = valueOf(element, "type");
  if (typeName !== undefined) {
    return yield* typeTable(context, yield* resolveQName(context, element, typeName));
  }

  const complex = childNamed(element, "complexType");
  if (complex !== undefined) {
    return yield* complexTable(context, complex);
  }

  return childNamed(element, "simpleType") === undefined ? anyTypeTable : simpleTypeTable;
});

/**
 * Sort attribute tables by namespace, then local name.
 *
 * @param attributes The tables.
 * @returns The tables in order.
 */
const sortAttributes = (attributes: Iterable<AttributeTable>): readonly AttributeTable[] =>
  [...attributes].toSorted(compareNames);

/**
 * Sort children by namespace, then local name.
 *
 * @param children The children.
 * @returns The children in order.
 */
const sortChildren = (children: Iterable<ChildName>): readonly ChildName[] =>
  [...children].toSorted(compareNames);

/**
 * Add the wildcards an element table has to it, each as a key only when present.
 *
 * The keys go in front, so every table is built in the sorted key order its Schema encodes, and
 * writing the tables as JSON gives the same bytes either way.
 *
 * @param table The table without wildcards.
 * @param anyAttribute The attribute wildcard, if any.
 * @param anyElement The element wildcard, if any.
 * @returns The table with `anyAttribute` and `anyElement` set where given.
 */
const withWildcards = (
  table: ElementTable,
  anyAttribute: Option.Option<Wildcard>,
  anyElement: Option.Option<Wildcard>,
): ElementTable => {
  const withElements = Option.match(anyElement, {
    onNone: () => table,
    onSome: (wildcard) => ({ anyElement: wildcard, ...table }),
  });

  return Option.match(anyAttribute, {
    onNone: () => withElements,
    onSome: (wildcard) => ({ anyAttribute: wildcard, ...withElements }),
  });
};

/**
 * Build an element's table from its type's table.
 *
 * @param type The table of the element's type.
 * @returns The element table, attributes and children sorted.
 */
const elementTable = (type: TypeTable): ElementTable =>
  withWildcards(
    {
      attributes: sortAttributes(type.attributes.values()),
      children: sortChildren(type.children.values()),
      text: type.text,
    },
    type.anyAttribute,
    type.anyElement,
  );

/**
 * Write an attribute type as a string equal only for equal types.
 *
 * @param type The type.
 * @returns Its canonical spelling.
 */
const typeKey = (type: AttributeType): string => {
  switch (type.kind) {
    case "builtin": {
      return JSON.stringify([type.kind, type.name, type.minInclusive ?? null]);
    }
    case "enumeration": {
      return JSON.stringify([type.kind, type.base, type.values]);
    }
    case "pattern": {
      return JSON.stringify([type.kind, type.base, type.pattern]);
    }
    case "list": {
      return JSON.stringify([type.kind, typeKey(type.item)]);
    }
    case "union": {
      return JSON.stringify([type.kind, type.members.map(typeKey)]);
    }
    default: {
      return type satisfies never;
    }
  }
};

/**
 * Join two attribute types into the type that admits what either admits.
 *
 * @param left One type.
 * @param right The other.
 * @returns `left` when they are equal, otherwise a union of their distinct members.
 */
const unionTypes = (left: AttributeType, right: AttributeType): AttributeType => {
  if (typeKey(left) === typeKey(right)) {
    return left;
  }

  const members = new Map<string, AttributeType>();
  for (const type of [left, right]) {
    for (const member of type.kind === "union" ? type.members : [type]) {
      members.set(typeKey(member), member);
    }
  }

  return { kind: "union", members: [...members.values()] };
};

/**
 * Make an attribute optional, for an element name one of whose types does not declare it.
 *
 * @param table The attribute's table.
 * @returns The table with `use` optional where it was required.
 */
const asOptional = (table: AttributeTable): AttributeTable =>
  table.use === "required" ? { ...table, use: "optional" } : table;

/**
 * Join two declarations of one attribute from two types of one element name.
 *
 * It is required only when both require it, its type admits either type's values, and it keeps a
 * default only when both give the same one.
 *
 * @param left One declaration.
 * @param right The other.
 * @returns The joined table.
 */
const unionAttribute = (left: AttributeTable, right: AttributeTable): AttributeTable =>
  withDefault(
    {
      local: left.local,
      namespace: left.namespace,
      type: unionTypes(left.type, right.type),
      use: left.use === "required" && right.use === "required" ? "required" : "optional",
    },
    left.default === right.default ? left.default : undefined,
  );

/**
 * Join the tables of two declarations of one element name, so nothing either type admits is
 * refused.
 *
 * An attribute only one declares becomes optional. Children and wildcards are joined and text is
 * allowed when either allows it.
 *
 * @param target The schema's target namespace.
 * @param left One table.
 * @param right The other.
 * @returns The joined table, or {@link TableGenerationError} when two wildcards have no union.
 */
const unionTables = Effect.fnUntraced(function* unionTables(
  target: string,
  left: ElementTable,
  right: ElementTable,
): Effect.fn.Return<ElementTable, TableGenerationError> {
  const leftNames = new Set(left.attributes.map(clarkName));
  const rightAttributes = new Map(right.attributes.map((table) => [clarkName(table), table]));
  const attributes = [
    ...left.attributes.map((table) => {
      const other = rightAttributes.get(clarkName(table));

      return other === undefined ? asOptional(table) : unionAttribute(table, other);
    }),
    ...right.attributes.filter((table) => !leftNames.has(clarkName(table))).map(asOptional),
  ];

  const children = childMap([...left.children, ...right.children]);
  const anyAttribute = yield* unionWildcards(target, left.anyAttribute, right.anyAttribute);
  const anyElement = yield* unionWildcards(target, left.anyElement, right.anyElement);

  return withWildcards(
    {
      attributes: sortAttributes(attributes),
      children: sortChildren(children.values()),
      text: left.text || right.text,
    },
    anyAttribute,
    anyElement,
  );
});

/**
 * Generate the tables of an XSD from its source view.
 *
 * Every `xs:element` with a `name`, global or local, gets the table of its type, and a name
 * declared with more than one type gets the union of their tables. Attribute group references
 * expand, extensions and restrictions inherit, and every simple type maps to an
 * {@link AttributeType}. Content models flatten into the children an element admits, through
 * group references, with no order or counts. The XSD is recorded as written; readings that set
 * part of it aside are applied over the tables by structural validation. Imported schemas are
 * never read: an element referenced from one is a child by name only.
 *
 * @param xsd The XSD, whose root is `xs:schema`.
 * @returns The tables, elements sorted by name, attributes and children by namespace then local
 *   name, or {@link TableGenerationError} naming the first construct with no table form.
 */
export const generateTables = Effect.fn("generateTables")(function* generateTables(
  xsd: SourceDocument,
): Effect.fn.Return<Tables, TableGenerationError> {
  const { root } = xsd;
  if (root.namespace !== xsdNamespace || root.local !== "schema") {
    return yield* failure(
      "xs:schema",
      `the root of ${xsd.location} is {${root.namespace}}${root.local}, not xs:schema`,
    );
  }

  const { declarations, scopes } = indexSchema(root);
  const context: Context = {
    attributeGroups: definitions(root, "attributeGroup"),
    attributes: definitions(root, "attribute"),
    complexCache: new Map(),
    complexTypes: definitions(root, "complexType"),
    elements: definitions(root, "element"),
    groups: definitions(root, "group"),
    pending: new Set(),
    qualifiedAttributes: valueOf(root, "attributeFormDefault") === "qualified",
    qualifiedElements: valueOf(root, "elementFormDefault") === "qualified",
    scopes,
    simpleCache: new Map(),
    simpleTypes: definitions(root, "simpleType"),
    target: valueOf(root, "targetNamespace") ?? "",
  };

  const tables = new Map<string, ElementTable>();
  for (const [name, element] of declarations) {
    const table = elementTable(yield* declarationTable(context, element));
    const seen = tables.get(name);
    tables.set(name, seen === undefined ? table : yield* unionTables(context.target, seen, table));
  }

  return {
    elements: Object.fromEntries(
      [...tables].toSorted(([left], [right]) => compareText(left, right)),
    ),
  };
});
