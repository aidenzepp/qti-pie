/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
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
import { Array as Arr, Match, Option, Result, Schema } from "effect";
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
 * The length facets of XML Schema Part 2, 4.3.1 to 4.3.3, each a count of its type's units of
 * length: characters, octets or list items.
 */
const lengthFacets = ["length", "minLength", "maxLength"] as const;

/**
 * A length facet.
 */
type LengthFacet = (typeof lengthFacets)[number];

/**
 * The rules XML Schema 1.0 Part 2 sets on a simple type's length facets, each as the Recommendation
 * names it: one value per facet a step (4.1.3, Single Facet Value), a `nonNegativeInteger` value
 * (the XML representations, 4.3.1.2, 4.3.2.2 and 4.3.3.2), and the schema component constraints of
 * 4.3.1.4, 4.3.2.4 and 4.3.3.4.
 */
export const lengthRules = [
  "Single Facet Value",
  "value is a nonNegativeInteger",
  "length valid restriction",
  "minLength valid restriction",
  "maxLength valid restriction",
  "minLength <= maxLength",
  "length and minLength or maxLength",
] as const;

/**
 * A rule of {@link lengthRules}.
 */
export type LengthRule = (typeof lengthRules)[number];

/**
 * The section of XML Schema 1.0 Part 2 that states each length rule.
 */
const lengthRuleSections: Readonly<Record<LengthRule, string>> = {
  "Single Facet Value": "4.1.3",
  "length and minLength or maxLength": "4.3.1.4",
  "length valid restriction": "4.3.1.4",
  "maxLength valid restriction": "4.3.3.4",
  "minLength <= maxLength": "4.3.2.4",
  "minLength valid restriction": "4.3.2.4",
  "value is a nonNegativeInteger": "4.3.1.2, 4.3.2.2 and 4.3.3.2",
};

/**
 * Spell a facet as a refusal names it: its name and its value as written, quoted.
 *
 * @param held - The facet, none for no facet.
 * @returns The spelling, empty for none.
 */
const spellFacet = (held: { readonly facet: string; readonly value: string } | undefined): string =>
  held === undefined ? "" : `${held.facet} ${JSON.stringify(held.value)}`;

/**
 * The XSD states a simple type whose length facets XML Schema 1.0 Part 2 makes an error, so the
 * schema is invalid and no domain, and no pattern, is derived for the type.
 *
 * `type` names the simple type, `rule` the rule it breaks, and `facets` the facets that break it
 * as the derivation states them: the two in conflict, the step's first where one is the step's and
 * the other its base's, or the one whose value is no `nonNegativeInteger`.
 */
export class InvalidLengthFacets extends Schema.TaggedError<InvalidLengthFacets>()(
  "InvalidLengthFacets",
  {
    facets: Schema.Array(
      Schema.Struct({ facet: Schema.Literals(lengthFacets), value: Schema.String }),
    ),
    rule: Schema.Literals(lengthRules),
    type: Schema.String,
  },
) {
  /**
   * The type, the facets and the rule they break, and what to change.
   */
  override get message(): string {
    const [first, second] = this.facets;
    const stated = ((): string => {
      switch (this.rule) {
        case "Single Facet Value": {
          return `${spellFacet(first)} and ${spellFacet(second)} in one restriction step`;
        }
        case "value is a nonNegativeInteger": {
          return `${spellFacet(first)}, which is no nonNegativeInteger`;
        }
        case "length valid restriction":
        case "maxLength valid restriction":
        case "minLength valid restriction": {
          return `${spellFacet(first)} where its base type states ${spellFacet(second)}`;
        }
        case "length and minLength or maxLength":
        case "minLength <= maxLength": {
          return `${spellFacet(first)} beside ${spellFacet(second)}`;
        }
        default: {
          return this.rule satisfies never;
        }
      }
    })();

    return `The XSD is invalid: the simple type ${this.type} states ${stated}, which XML Schema 1.0 Part 2 forbids (${this.rule}, section ${lengthRuleSections[this.rule]}). Correct the type's facets in the XSD; the deriver derives domains from valid schemas only.`;
  }
}

/**
 * A length facet as a restriction states it, with the count its value reads as.
 */
interface StatedLength {
  readonly count: bigint;
  readonly facet: Facet & { readonly facet: LengthFacet };
}

/**
 * The length facets one list of facets states, each at most once.
 */
type Lengths = Readonly<Partial<Record<LengthFacet, StatedLength>>>;

/**
 * `xs:nonNegativeInteger`'s lexical space after the `collapse` its `whiteSpace` applies: `+`
 * before any digits and `-` before zero only (spec reading 64).
 */
const nonNegativeInteger = /^[\t\n\r ]*(?:\+?\d+|-0+)[\t\n\r ]*$/u;

/**
 * A length rule broken, and the facets that break it, before the type is named.
 */
interface Broken {
  readonly facets: readonly (Facet & { readonly facet: LengthFacet })[];
  readonly rule: LengthRule;
}

/**
 * Whether a facet is a length facet.
 *
 * @param held - The facet.
 * @returns Whether it is `length`, `minLength` or `maxLength`.
 */
const isLength = (held: Facet): held is Facet & { readonly facet: LengthFacet } =>
  held.facet === "length" || held.facet === "minLength" || held.facet === "maxLength";

/**
 * Read the length facets of a list of facets that states each at most once.
 *
 * @param facets - The facets.
 * @returns Each length facet with its count, or the rule a facet breaks: a facet stated twice, or a
 *   value that is no `nonNegativeInteger`.
 */
const lengthsOf = (facets: readonly Facet[]): Result.Result<Lengths, Broken> => {
  const lengths: Partial<Record<LengthFacet, StatedLength>> = {};
  for (const stated of facets.filter(isLength)) {
    const held = lengths[stated.facet];
    if (held !== undefined) {
      return Result.fail({ facets: [held.facet, stated], rule: "Single Facet Value" });
    }

    if (!nonNegativeInteger.test(stated.value)) {
      return Result.fail({ facets: [stated], rule: "value is a nonNegativeInteger" });
    }

    lengths[stated.facet] = { count: BigInt(stated.value.trim()), facet: stated };
  }

  return Result.succeed(lengths);
};

/**
 * Name a rule two facets break.
 *
 * @param rule - The rule.
 * @param first - The facet the step states, or the first of the pair.
 * @param second - The other.
 * @returns The broken rule.
 */
const brokenPair = (rule: LengthRule, first: StatedLength, second: StatedLength): Broken => ({
  facets: [first.facet, second.facet],
  rule,
});

/**
 * The first schema component constraint of Part 2, 4.3.1.4 to 4.3.3.4, a step's length facets
 * break against its base's, as {@link lengthsHold} reads them.
 *
 * @param inherited - The base's length facets.
 * @param stated - The step's.
 * @returns The rule broken and its facets, none when every constraint holds.
 */
const firstBroken = (inherited: Lengths, stated: Lengths): Option.Option<Broken> => {
  const restriction = [
    ["length", "length valid restriction", (held: bigint, was: bigint) => held === was],
    ["minLength", "minLength valid restriction", (held: bigint, was: bigint) => held >= was],
    ["maxLength", "maxLength valid restriction", (held: bigint, was: bigint) => held <= was],
  ] as const;
  for (const [name, rule, holds] of restriction) {
    const held = stated[name];
    const was = inherited[name];
    if (held !== undefined && was !== undefined && !holds(held.count, was.count)) {
      return Option.some(brokenPair(rule, held, was));
    }
  }

  const { length, maxLength, minLength } = { ...inherited, ...stated };
  if (minLength !== undefined && maxLength !== undefined && minLength.count > maxLength.count) {
    return Option.some(brokenPair("minLength <= maxLength", minLength, maxLength));
  }

  if (
    length !== undefined &&
    minLength !== undefined &&
    !(minLength.count <= length.count && inherited.minLength?.count === minLength.count)
  ) {
    return Option.some(brokenPair("length and minLength or maxLength", length, minLength));
  }

  if (
    length !== undefined &&
    maxLength !== undefined &&
    !(length.count <= maxLength.count && inherited.maxLength?.count === maxLength.count)
  ) {
    return Option.some(brokenPair("length and minLength or maxLength", length, maxLength));
  }

  return Option.none();
};

/**
 * Check one restriction step's length facets against its base's, as XML Schema 1.0 Part 2 rules
 * them: one value each (4.1.3), a `nonNegativeInteger` value, and the schema component constraints
 * of 4.3.1.4, 4.3.2.4 and 4.3.3.4 over the derived type's facets, which are the step's and, for
 * each facet it does not state, its base's.
 *
 * Clauses 1.2 and 2.2 of "length and minLength or maxLength" admit a `minLength` (`maxLength`)
 * beside `length` only where some type the derived one restricts states the same `minLength`
 * (`maxLength`) and no `length`. Every base this function is given passed the same check, so along
 * its derivation `minLength` never falls and `maxLength` never rises, and that ancestor exists
 * exactly when the base itself states the same value: an ancestor that states no `length` has it
 * then, and one that states `length` keeps it from an ancestor that does not.
 *
 * @param base - The base's facets, valid by this check.
 * @param step - The step's facets.
 * @returns Nothing, or the first rule the step breaks, with its facets.
 * @see {@link https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#length-coss | XML Schema Part 2, 4.3.1.4 Constraints on length Schema Components}
 * @see {@link https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#minLength-coss | XML Schema Part 2, 4.3.2.4 Constraints on minLength Schema Components}
 * @see {@link https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#maxLength-coss | XML Schema Part 2, 4.3.3.4 Constraints on maxLength Schema Components}
 */
const lengthsHold = (base: readonly Facet[], step: readonly Facet[]): Result.Result<void, Broken> =>
  Result.flatMap(Result.all([lengthsOf(base), lengthsOf(step)]), ([inherited, stated]) =>
    Option.match(firstBroken(inherited, stated), {
      onNone: () => Result.void,
      onSome: (broken) => Result.fail(broken),
    }),
  );

/**
 * Restrict a domain by one derivation step's facets.
 *
 * @param domain - The base's domain.
 * @param facets - The step's facets, in document order.
 * @param type - The simple type the step defines, as a refusal names it: its QName as the schema
 *   writes it, or where an anonymous type stands.
 * @returns The restricted domain: the step's patterns one more required set, its enumeration in
 *   place of the base's, and each other facet it states in place of the base's of the same name;
 *   or an {@link InvalidLengthFacets} when its length facets break a rule of XML Schema Part 2.
 */
export const restricted = (
  domain: Domain,
  facets: readonly Facet[],
  type: string,
): Result.Result<Domain, InvalidLengthFacets> =>
  Result.gen(function* restrictedBody() {
    yield* Result.mapError(
      lengthsHold(domain.facets, facets),
      (broken) => new InvalidLengthFacets({ ...broken, type }),
    );

    const patterns = facets
      .filter(({ facet: name }) => name === "pattern")
      .map(({ value }) => value);
    const stated = new Set(
      facets.filter(({ facet: name }) => name !== "pattern").map(({ facet: name }) => name),
    );
    const kept = domain.facets.filter(({ facet: name }) => !stated.has(name));

    return {
      ...domain,
      facets: [...kept, ...facets.filter(({ facet: name }) => name !== "pattern")],
      patterns: patterns.length === 0 ? domain.patterns : [...domain.patterns, patterns],
    };
  });

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
 * The ways a simple type has no domain: the deriver does not read its shape, or its facets make the
 * schema invalid.
 */
export type DomainError = InvalidLengthFacets | XsdReadingError;

/**
 * Resolve a built-in type's domain.
 *
 * @param local - Its local name in the XML Schema namespace.
 * @returns Its domain, or an {@link XsdReadingError} for a name no built-in has.
 */
export const builtinDomainOf = (local: string): Result.Result<Domain, DomainError> => {
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
    : Result.flatMap(builtinDomainOf(derivation.base), (base) =>
        Result.map(restricted(base, derivation.facets, `xs:${local}`), (domain) =>
          domain._tag === "atomic" ? { ...domain, builtin: local } : domain,
        ),
      );
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
 * @param ref - The type: a QName as written, or an `xs:simpleType` element with the words a
 *   refusal names it by, its QName for a named type's definition and where it stands for an
 *   anonymous one.
 * @param seen - The named types being resolved around this one, so a circular derivation, which
 *   XML Schema forbids, is refused rather than followed.
 * @returns Its domain, an {@link XsdReadingError} for a type the reading does not resolve, or an
 *   {@link InvalidLengthFacets} for a type whose length facets make the schema invalid.
 */
export const domainOf = (
  schema: XsdSchema,
  ref:
    | { readonly _tag: "Anonymous"; readonly definition: Element; readonly name: string }
    | { readonly _tag: "Named"; readonly lexical: string },
  seen: ReadonlySet<string> = new Set(),
): Result.Result<Domain, DomainError> => {
  const here = ref._tag === "Named" ? ref.lexical : ref.name;
  const typed = (holder: Element, attribute: string): Result.Result<Domain, DomainError> =>
    Option.match(attributeOf(holder, attribute), {
      onNone: () =>
        Option.match(firstXs(holder, "simpleType"), {
          onNone: () => refuse(`an ${holder.qname} names no type`),
          onSome: (definition) =>
            domainOf(
              schema,
              {
                _tag: "Anonymous",
                definition,
                name: `the anonymous ${attribute === "base" ? "base" : "item"} type of ${here}`,
              },
              seen,
            ),
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

      return yield* domainOf(
        schema,
        { _tag: "Anonymous", definition, name: ref.lexical },
        new Set([...seen, key]),
      );
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
        members.push(
          yield* domainOf(
            schema,
            { _tag: "Anonymous", definition, name: `an anonymous member type of ${here}` },
            seen,
          ),
        );
      }

      return { _tag: "union", facets: [], members, patterns: [] } as const;
    }

    return yield* restricted(yield* typed(step, "base"), yield* facetsOf(step), here);
  });
};

/**
 * Resolve the domain of a type reading, as the deriver spells it: a built-in `xs:<local>`, any
 * other name as the schema writes it, or an anonymous definition.
 *
 * @param schema - The schema the reading was made in, whose prefixes its names are written with.
 * @param type - The reading.
 * @param name - The words a refusal names an anonymous definition by: where it stands.
 * @returns Its domain.
 */
const readingDomainOf = (
  schema: XsdSchema,
  type: TypeReading,
  name: string,
): Result.Result<Domain, DomainError> =>
  Match.valueTags(type, {
    list: ({ item }) =>
      Result.map(readingDomainOf(schema, item, `the item type of ${name}`), (domain) => ({
        _tag: "list" as const,
        facets: [facet("whiteSpace", "collapse")],
        item: domain,
        patterns: [],
      })),
    named: ({ name: lexical }) =>
      lexical.startsWith("xs:")
        ? builtinDomainOf(lexical.slice("xs:".length))
        : domainOf(schema, { _tag: "Named", lexical }),
    restriction: ({ base, facets }) =>
      Result.flatMap(readingDomainOf(schema, base, `the base type of ${name}`), (domain) =>
        restricted(domain, facets, name),
      ),
    union: ({ members }) =>
      Result.map(
        Result.all(
          members.map((member) => readingDomainOf(schema, member, `a member type of ${name}`)),
        ),
        (domains) => ({ _tag: "union" as const, facets: [], members: domains, patterns: [] }),
      ),
  });

/**
 * Resolve the domain of a value type the deriver read in a schema.
 *
 * @param schema - The schema it was read in.
 * @param type - The value type.
 * @param owner - What the type is read for, such as `attribute max-choices of
 *   qti-choice-interaction`, which a refusal names an anonymous definition by.
 * @returns Its domain: its anonymous definition's, or its named type's; or a {@link DomainError}.
 */
export const valueDomainOf = (
  schema: XsdSchema,
  type: ValueType,
  owner: string,
): Result.Result<Domain, DomainError> =>
  Option.match(type.inline, {
    onNone: () => readingDomainOf(schema, { _tag: "named", name: type.type }, type.type),
    onSome: (definition) =>
      readingDomainOf(schema, definition, `the anonymous simple type of ${owner}`),
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
