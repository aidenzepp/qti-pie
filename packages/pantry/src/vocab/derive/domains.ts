/**
 * The value-domain reading: every simple type the vocabularies' attributes and texts are read
 * under, resolved through its derivation to the XSD primitive it restricts and the facets in force
 * (review U1), so the domain's law reads explicit data and restates no type by hand.
 *
 * A type is resolved through XML Schema 1.0 Part 2's rules:
 *
 * - A named type is its definition: a built-in by {@link builtins}, the derivation XML Schema Part 2,
 *   3.3, gives it; a type of a schema by its `xs:simpleType`, read in that schema.
 * - A restriction keeps its base's facets and adds its own. Its `pattern` facets are one more set the
 *   value must match one of (4.3.4: the patterns of one step are alternatives, and every step's
 *   must hold); its `enumeration` facets replace the base's; every other facet it states replaces
 *   the base's of the same name.
 * - A list is a list of its item type's domain, with the list's own facets over the list.
 * - A union is its members' domains, with the union's own facets over the union.
 *
 * The `whiteSpace` in force is stated on every atomic domain, explicitly: a value is matched after
 * that normalization, so a law over the raw lexical form reads it.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#built-in-derived | XML Schema Part 2, Derived datatypes}
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-pattern | XML Schema Part 2, pattern}
 */
import { Array as Arr, Match, Option, Result } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import {
  attributeOf,
  elementsOf,
  firstXs,
  isXs,
  refuse,
  requireComponent,
  resolve,
  xsChildren,
} from "#pantry/vocab/derive/derive.ts";
import type { XsdReadingError, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import { anyUriPattern, translatePattern } from "#pantry/grammar/domains.ts";
import type { UnreadPattern } from "#pantry/grammar/domains.ts";
import type {
  Domain,
  Facet,
  FacetName,
  Primitive,
  TypeReading,
  ValueType,
  XsdBuiltin,
} from "#pantry/vocab/inventory/types.ts";
import { xsNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The XSD primitive datatypes, and `anySimpleType`, the simple ur-type.
 */
const primitives: ReadonlySet<string> = new Set<Primitive>([
  "anySimpleType",
  "anyURI",
  "base64Binary",
  "boolean",
  "date",
  "dateTime",
  "decimal",
  "double",
  "duration",
  "float",
  "gDay",
  "gMonth",
  "gMonthDay",
  "gYear",
  "gYearMonth",
  "hexBinary",
  "NOTATION",
  "QName",
  "string",
  "time",
]);

/**
 * Whether a built-in name is a primitive.
 *
 * @param local - The built-in's local name.
 * @returns Whether {@link primitives} holds it.
 */
const isPrimitive = (local: string): local is Primitive => primitives.has(local);

/**
 * One built-in derived type: its base, and the facets its derivation adds, or for a list type its
 * item type and the list's facets.
 */
type Builtin =
  | { readonly _tag: "list"; readonly facets: readonly Facet[]; readonly item: string }
  | { readonly _tag: "restriction"; readonly base: string; readonly facets: readonly Facet[] };

/**
 * State a facet.
 *
 * @param name - Its name.
 * @param value - Its value.
 * @returns The facet.
 */
const facet = (name: FacetName, value: string): Facet => ({ facet: name, value });

/**
 * The built-in derived types of XML Schema Part 2, 3.3, by local name: each restriction's base and
 * facets, each list's item type, as the specification's own schema for schemas declares them.
 */
const builtinTable = {
  ENTITIES: { _tag: "list", facets: [facet("minLength", "1")], item: "ENTITY" },
  ENTITY: { _tag: "restriction", base: "NCName", facets: [] },
  ID: { _tag: "restriction", base: "NCName", facets: [] },
  IDREF: { _tag: "restriction", base: "NCName", facets: [] },
  IDREFS: { _tag: "list", facets: [facet("minLength", "1")], item: "IDREF" },
  NCName: {
    _tag: "restriction",
    base: "Name",
    facets: [facet("pattern", "[\\i-[:]][\\c-[:]]*")],
  },
  NMTOKEN: { _tag: "restriction", base: "token", facets: [facet("pattern", "\\c+")] },
  NMTOKENS: { _tag: "list", facets: [facet("minLength", "1")], item: "NMTOKEN" },
  Name: { _tag: "restriction", base: "token", facets: [facet("pattern", "\\i\\c*")] },
  byte: {
    _tag: "restriction",
    base: "short",
    facets: [facet("minInclusive", "-128"), facet("maxInclusive", "127")],
  },
  int: {
    _tag: "restriction",
    base: "long",
    facets: [facet("minInclusive", "-2147483648"), facet("maxInclusive", "2147483647")],
  },
  integer: {
    _tag: "restriction",
    base: "decimal",
    facets: [facet("fractionDigits", "0"), facet("pattern", "[\\-+]?[0-9]+")],
  },
  language: {
    _tag: "restriction",
    base: "token",
    facets: [facet("pattern", "[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*")],
  },
  long: {
    _tag: "restriction",
    base: "integer",
    facets: [
      facet("minInclusive", "-9223372036854775808"),
      facet("maxInclusive", "9223372036854775807"),
    ],
  },
  negativeInteger: {
    _tag: "restriction",
    base: "nonPositiveInteger",
    facets: [facet("maxInclusive", "-1")],
  },
  nonNegativeInteger: {
    _tag: "restriction",
    base: "integer",
    facets: [facet("minInclusive", "0")],
  },
  nonPositiveInteger: {
    _tag: "restriction",
    base: "integer",
    facets: [facet("maxInclusive", "0")],
  },
  normalizedString: {
    _tag: "restriction",
    base: "string",
    facets: [facet("whiteSpace", "replace")],
  },
  positiveInteger: {
    _tag: "restriction",
    base: "nonNegativeInteger",
    facets: [facet("minInclusive", "1")],
  },
  short: {
    _tag: "restriction",
    base: "int",
    facets: [facet("minInclusive", "-32768"), facet("maxInclusive", "32767")],
  },
  token: {
    _tag: "restriction",
    base: "normalizedString",
    facets: [facet("whiteSpace", "collapse")],
  },
  unsignedByte: {
    _tag: "restriction",
    base: "unsignedShort",
    facets: [facet("maxInclusive", "255")],
  },
  unsignedInt: {
    _tag: "restriction",
    base: "unsignedLong",
    facets: [facet("maxInclusive", "4294967295")],
  },
  unsignedLong: {
    _tag: "restriction",
    base: "nonNegativeInteger",
    facets: [facet("maxInclusive", "18446744073709551615")],
  },
  unsignedShort: {
    _tag: "restriction",
    base: "unsignedInt",
    facets: [facet("maxInclusive", "65535")],
  },
} as const satisfies Readonly<Record<string, Builtin>>;

/**
 * The built-in derived types, by local name.
 */
export const builtins: ReadonlyMap<string, Builtin> = new Map(Object.entries(builtinTable));

/**
 * Every built-in type's local name, its base's beside it in XML Schema's type hierarchy (Part 2,
 * 3.3 and 3.2; Part 1, 3.4.7): a derived built-in's base, `anySimpleType` for a primitive and for
 * a built-in list, `anyType` for `anySimpleType`, and none for `anyType`.
 */
export const builtinBases: ReadonlyMap<string, Option.Option<string>> = new Map([
  ["anyType", Option.none()],
  ...[...primitives].map(
    (local) =>
      [local, Option.some(local === "anySimpleType" ? "anyType" : "anySimpleType")] as const,
  ),
  ...[...builtins].map(
    ([local, builtin]) =>
      [local, Option.some(builtin._tag === "list" ? "anySimpleType" : builtin.base)] as const,
  ),
]);

/**
 * The lexical grammar a primitive's own definition gives as patterns, where the specification
 * states it as one: `anyURI`'s (spec reading 61). Every other primitive's lexical space is its
 * datatype's, which the domain's primitive names.
 */
const primitivePatterns: Readonly<Partial<Record<Primitive, readonly (readonly string[])[]>>> = {
  anyURI: [[anyUriPattern]],
};

/**
 * The `whiteSpace` a primitive is read with: `preserve` for `string` and `anySimpleType`, and the
 * fixed `collapse` of every other primitive (XML Schema Part 2, 4.3.6).
 *
 * @param primitive - The primitive.
 * @returns Its `whiteSpace`.
 */
const primitiveWhiteSpace = (primitive: Primitive): string =>
  primitive === "string" || primitive === "anySimpleType" ? "preserve" : "collapse";

/**
 * Restrict a domain by one derivation step's facets.
 *
 * @param domain - The base's domain.
 * @param facets - The step's facets, in document order.
 * @returns The restricted domain: the step's patterns one more required set, its enumeration in
 *   place of the base's, and each other facet it states in place of the base's of the same name.
 */
export const restricted = (domain: Domain, facets: readonly Facet[]): Domain => {
  const patterns = facets.filter(({ facet: name }) => name === "pattern").map(({ value }) => value);
  const stated = new Set(
    facets.filter(({ facet: name }) => name !== "pattern").map(({ facet: name }) => name),
  );
  const kept = domain.facets.filter(({ facet: name }) => !stated.has(name));

  return {
    ...domain,
    facets: [...kept, ...facets.filter(({ facet: name }) => name !== "pattern")],
    patterns: patterns.length === 0 ? domain.patterns : [...domain.patterns, patterns],
  };
};

/**
 * The domain of a primitive: no facet but its `whiteSpace`.
 *
 * @param primitive - The primitive.
 * @returns Its domain.
 */
const primitiveDomain = (primitive: Primitive): Domain => ({
  _tag: "atomic",
  builtin: primitive,
  facets: [facet("whiteSpace", primitiveWhiteSpace(primitive))],
  patterns: primitivePatterns[primitive] ?? [],
  primitive,
});

/**
 * Whether a name is a built-in simple type's.
 *
 * @param local - A local name in the XML Schema namespace.
 * @returns Whether it is a primitive or a derived built-in.
 */
const isBuiltin = (local: string): local is XsdBuiltin => isPrimitive(local) || builtins.has(local);

/**
 * Resolve a built-in type's domain.
 *
 * @param local - Its local name in the XML Schema namespace.
 * @returns Its domain, or an {@link XsdReadingError} for a name no built-in has.
 */
export const builtinDomainOf = (local: string): Result.Result<Domain, XsdReadingError> => {
  if (!isBuiltin(local)) {
    return refuse(`xs:${local} is no built-in simple type`);
  }

  if (isPrimitive(local)) {
    return Result.succeed(primitiveDomain(local));
  }

  const builtin = Option.fromNullishOr(builtins.get(local));

  if (Option.isNone(builtin)) {
    return refuse(`xs:${local} is no built-in simple type`);
  }

  const derivation = builtin.value;

  return derivation._tag === "list"
    ? Result.map(builtinDomainOf(derivation.item), (item) => ({
        _tag: "list",
        facets: [facet("whiteSpace", "collapse"), ...derivation.facets],
        item,
        patterns: [],
      }))
    : Result.map(builtinDomainOf(derivation.base), (base) => {
        const domain = restricted(base, derivation.facets);

        return domain._tag === "atomic" ? { ...domain, builtin: local } : domain;
      });
};

/**
 * The facets of XML Schema 1.0 Part 2, 4.3, by element name.
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
 * Read one derivation step's facets.
 *
 * @param step - The `xs:restriction`.
 * @returns Its facets, in document order, or an {@link XsdReadingError} for a facet with no value.
 */
const facetsOf = (step: Element): Result.Result<readonly Facet[], XsdReadingError> =>
  Result.all(
    elementsOf(step)
      .filter((node) => !isXs(node, "annotation") && !isXs(node, "simpleType"))
      .map((node) =>
        Option.match(attributeOf(node, "value"), {
          onNone: () => refuse(`an ${node.qname} has no value`),
          onSome: (value) =>
            Option.match(
              Arr.findFirst(facetNames, (name) => isXs(node, name)),
              {
                onNone: () =>
                  refuse(`an xs:restriction holds an ${node.qname}, which is no XSD facet`),
                onSome: (name) => Result.succeed(facet(name, value)),
              },
            ),
        }),
      ),
  );

/**
 * Resolve a simple type's domain, by name or as a definition in place.
 *
 * @param schema - The schema the reference is written in.
 * @param ref - The type: a QName as written, or an `xs:simpleType` element.
 * @param seen - The named types being resolved around this one, so a circular derivation, which
 *   XML Schema forbids, is refused rather than followed.
 * @returns Its domain, or an {@link XsdReadingError} for a type the reading does not resolve.
 */
export const domainOf = (
  schema: XsdSchema,
  ref:
    | { readonly _tag: "Anonymous"; readonly definition: Element }
    | { readonly _tag: "Named"; readonly lexical: string },
  seen: ReadonlySet<string> = new Set(),
): Result.Result<Domain, XsdReadingError> => {
  const typed = (holder: Element, attribute: string): Result.Result<Domain, XsdReadingError> =>
    Option.match(attributeOf(holder, attribute), {
      onNone: () =>
        Option.match(firstXs(holder, "simpleType"), {
          onNone: () => refuse(`an ${holder.qname} names no type`),
          onSome: (definition) => domainOf(schema, { _tag: "Anonymous", definition }, seen),
        }),
      onSome: (lexical) => domainOf(schema, { _tag: "Named", lexical }, seen),
    });

  return Result.gen(function* domainOfBody() {
    if (ref._tag === "Named") {
      const name = yield* resolve(schema, ref.lexical);

      if (name.namespace === xsNamespace) {
        return yield* builtinDomainOf(name.local);
      }

      const key = `{${name.namespace}}${name.local}`;

      if (seen.has(key)) {
        return yield* refuse(`the simple type ${ref.lexical} derives from itself`);
      }

      const definition = yield* requireComponent(
        schema,
        schema.simpleTypes,
        "simpleType",
        ref.lexical,
      );

      return yield* domainOf(schema, { _tag: "Anonymous", definition }, new Set([...seen, key]));
    }

    const variety = Arr.findFirst(elementsOf(ref.definition), (node) =>
      ["list", "union", "restriction"].some((local) => isXs(node, local)),
    );

    if (Option.isNone(variety)) {
      return yield* refuse("an xs:simpleType holds no list, union or restriction");
    }

    const step = variety.value;

    if (isXs(step, "list")) {
      return {
        _tag: "list",
        facets: [facet("whiteSpace", "collapse")],
        item: yield* typed(step, "itemType"),
        patterns: [],
      } as const;
    }

    if (isXs(step, "union")) {
      const members: Domain[] = [];

      for (const lexical of Option.match(attributeOf(step, "memberTypes"), {
        onNone: () => [],
        onSome: (value) => value.split(/\s+/u).filter((member) => member !== ""),
      })) {
        members.push(yield* domainOf(schema, { _tag: "Named", lexical }, seen));
      }

      for (const definition of xsChildren(step, "simpleType")) {
        members.push(yield* domainOf(schema, { _tag: "Anonymous", definition }, seen));
      }

      return { _tag: "union", facets: [], members, patterns: [] } as const;
    }

    return restricted(yield* typed(step, "base"), yield* facetsOf(step));
  });
};

/**
 * Resolve the domain of a type reading, as the deriver spells it: a built-in `xs:<local>`, any
 * other name as the schema writes it, or an anonymous definition.
 *
 * @param schema - The schema the reading was made in, whose prefixes its names are written with.
 * @param type - The reading.
 * @returns Its domain.
 */
const readingDomainOf = (
  schema: XsdSchema,
  type: TypeReading,
): Result.Result<Domain, XsdReadingError> =>
  Match.valueTags(type, {
    list: ({ item }) =>
      Result.map(readingDomainOf(schema, item), (domain) => ({
        _tag: "list" as const,
        facets: [facet("whiteSpace", "collapse")],
        item: domain,
        patterns: [],
      })),
    named: ({ name }) =>
      name.startsWith("xs:")
        ? builtinDomainOf(name.slice("xs:".length))
        : domainOf(schema, { _tag: "Named", lexical: name }),
    restriction: ({ base, facets }) =>
      Result.map(readingDomainOf(schema, base), (domain) => restricted(domain, facets)),
    union: ({ members }) =>
      Result.map(
        Result.all(members.map((member) => readingDomainOf(schema, member))),
        (domains) => ({ _tag: "union" as const, facets: [], members: domains, patterns: [] }),
      ),
  });

/**
 * Resolve the domain of a value type the deriver read in a schema.
 *
 * @param schema - The schema it was read in.
 * @param type - The value type.
 * @returns Its domain: its anonymous definition's, or its named type's.
 */
export const valueDomainOf = (
  schema: XsdSchema,
  type: ValueType,
): Result.Result<Domain, XsdReadingError> =>
  Option.match(type.inline, {
    onNone: () => readingDomainOf(schema, { _tag: "named", name: type.type }),
    onSome: (definition) => readingDomainOf(schema, definition),
  });

/**
 * Write the patterns leaf, unformatted: the regular expressions the schema's typed strings take
 * from the vocabularies' domains, each in the dialect `str.regex` reads, as a literal grizzle's
 * types can check. Today that is `xs:anyURI`'s lexical pattern ({@link anyUriPattern}), through
 * the one translation of XSD's regular expressions ({@link translatePattern}).
 *
 * @returns The module text, without a final line break, which `vp fmt` turns into the committed
 *   leaf, or an {@link UnreadPattern} when the translation refuses the pattern.
 */
export const renderPatterns = (): Result.Result<string, UnreadPattern> =>
  Result.map(translatePattern(anyUriPattern), (anyUri) =>
    [
      "/**",
      " * The regular expressions the schema's typed strings take from the vocabularies' domains, each",
      " * translated from its XSD pattern into the dialect `str.regex` reads, as a literal.",
      " *",
      " * Generated by `node src/vocab/derive/domains.ts` and formatted with `vp fmt`;",
      " * `src/vocab/derive/domains.test.ts` checks that a re-run reproduces this file byte for byte.",
      " */",
      "",
      "/**",
      " * `xs:anyURI`'s lexical space (spec reading 61), anchored: `anyUriPattern` of",
      " * `src/grammar/domains.ts`, translated. Judged on the collapsed value.",
      " */",
      `export const anyUriSource = ${JSON.stringify(anyUri)} as const;`,
    ].join("\n"),
  );

if (import.meta.main) {
  console.log(Result.getOrThrowWith(renderPatterns(), (unread) => unread));
}
