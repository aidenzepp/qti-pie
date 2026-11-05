/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * The attribute grammar (review U1; fin.md §16, §17): `AttributeGrammar`, `ValueDomain`,
 * `ValueIdentity` and `TextDomain`, generated from the declarations the vocabulary leaves derive
 * from the pinned XSDs, and from nothing else but QTI's recorded spec readings.
 *
 * An element's attributes are one relation, `Attribute(node, at, name, lexical)`, and one CHECK
 * holds both admission and lexical validity:
 * `lexical ~ ValueDomain.pattern.at(AttributeGrammar.domain.at(version, kind, name))`. A name the
 * kind does not admit reads no domain, NULL, and the CHECK refuses it.
 *
 * - `AttributeGrammar` is (version, kind, name) → (domain, use, position): each attribute an element
 *   of a kind may carry in a version, the value domain it is read under, whether the kind requires
 *   it, and its position among the names the (version, kind) admits (D8), the coordinate a node's
 *   `attrs` set is over. `Required` is its side selected by `use = required`.
 * - `ValueDomain` is domain → (primitive, pattern, facets): one compiled lexical definition
 *   (`src/grammar/domains.ts`), the pattern an open-typed text payload. Each handle is one distinct
 *   definition.
 * - `ValueIdentity` is domain → identity, for the domains whose values are XML Schema's `ID`, `IDREF`
 *   or `IDREFS`, which the document's identity laws read. Most domains are none of them, so it is a
 *   relation of its own rather than a field.
 * - `TextDomain` is (version, kind) → domain: the domain of a simple-content kind's one text child.
 *
 * A declaration's domain is the leaf's resolution of its XSD type (`Domain`), with a spec reading
 * applied where QTI reads the attribute otherwise ({@link specReadings}).
 */
import { Option, Result, Schema } from "effect";
import { closed, fin, idField, roster, valueField } from "#pantry/grammar/closed.ts";
import type {
  Closed,
  ClosedRelationError,
  IdField,
  Roster,
  ValueField,
} from "#pantry/grammar/closed.ts";
import { compile, domainPrimitives, identities, openCompiled } from "#pantry/grammar/domains.ts";
import type {
  CompiledDomain,
  DomainPrimitive,
  Identity,
  Reading,
} from "#pantry/grammar/domains.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { attributeDeclarations, openAttribute } from "#pantry/vocab/inventory/attributes.ts";
import type { Domain, Facet, ValueType } from "#pantry/vocab/inventory/types.ts";

/**
 * Whether the XSD requires an attribute.
 */
export type Use = "optional" | "required";

/**
 * The `Use` roster: whether an element of a kind must carry an attribute.
 */
export const uses = ["optional", "required"] as const satisfies readonly Use[];

/**
 * One value domain: its handle, the name of the type it was first compiled from, and its compiled
 * definition.
 */
export interface ValueDomain extends CompiledDomain {
  readonly handle: string;
}

/**
 * The domain every open name's lexical form is read under (fin.md, D2): `xs:anySimpleType`, every
 * value, whitespace preserved. No declaration governs an open name, so its value is kept as
 * written and no typed value is derived from it.
 */
export const openDomain: ValueDomain = { ...openCompiled, handle: openAttribute.type.type };

/**
 * The `BaseType` roster in code order: the code space of every base-type field, `BindingFit`'s and
 * `MappableBaseType`'s among them. Its members are the XSD's `BaseTypeDType` enumeration
 * (`attributes.test.ts` reads them from the leaf); its order is the roster's own, append-only.
 */
export const baseTypes: readonly string[] = [
  "boolean",
  "integer",
  "float",
  "string",
  "identifier",
  "uri",
  "duration",
  "point",
  "pair",
  "directedPair",
  "file",
];

/**
 * One attribute a kind declares in some schema versions: the leaf's `AttributeDeclaration`, or one
 * the composition states (the document layer's `xml:` and `xsi:` names and the open classes), each
 * with its XSD type and that type's resolved domain.
 */
export interface Declared {
  readonly domain: Domain;
  readonly kind: string;
  readonly name: string;
  readonly type: ValueType;
  readonly use: Use;
  readonly versions: readonly SchemaVersion[];
}

/**
 * The text type of one simple-content kind in some schema versions: the leaf's `TextType`.
 */
export interface DeclaredText {
  readonly domain: Domain;
  readonly kind: string;
  readonly type: ValueType;
  readonly versions: readonly SchemaVersion[];
}

/**
 * The largest signed 64-bit integer, the bound spec reading 46 holds a count to.
 */
const int64Max = "9223372036854775807";

/**
 * The least signed 64-bit integer.
 */
const int64Min = "-9223372036854775808";

/**
 * Replace a definition's facets of some names with others: a spec reading's narrowing.
 *
 * @param domain - The definition.
 * @param replace - The facets that take the place of every facet of their names.
 * @returns The definition with them.
 */
const withFacets = (domain: Domain, replace: readonly Facet[]): Domain => {
  const names = new Set(replace.map(({ facet }) => facet));

  return {
    ...domain,
    facets: [...domain.facets.filter(({ facet }) => !names.has(facet)), ...replace],
  };
};

/**
 * Narrow an integer definition to the signed 64-bit range, keeping a tighter bound it states, and
 * every integer member of a union likewise.
 *
 * @param domain - The definition.
 * @returns The narrowed definition.
 */
const toInt64 = (domain: Domain): Domain => {
  if (domain._tag === "union") {
    return { ...domain, members: domain.members.map(toInt64) };
  }

  if (domain._tag !== "atomic" || domain.primitive !== "decimal") {
    return domain;
  }

  const bound = (
    name: "maxInclusive" | "minInclusive",
    limit: string,
    tighter: (a: bigint, b: bigint) => boolean,
  ) => {
    const stated = domain.facets.find(({ facet }) => facet === name);

    return stated !== undefined && tighter(BigInt(stated.value), BigInt(limit))
      ? stated.value
      : limit;
  };

  return withFacets(domain, [
    { facet: "maxInclusive", value: bound("maxInclusive", int64Max, (a, b) => a < b) },
    { facet: "minInclusive", value: bound("minInclusive", int64Min, (a, b) => a > b) },
  ]);
};

/**
 * One QTI spec reading of an attribute's value (`docs/spec-readings.md`): the reading's number, the
 * kinds it reads the attribute on (none for every kind that declares it), the attribute, how its
 * whitespace is read, and the definition it reads the XSD's as.
 */
interface SpecReading {
  readonly kinds: Option.Option<readonly string[]>;
  readonly name: string;
  readonly reading: number;
  readonly read: (domain: Domain) => Domain;
  readonly whiteSpace: Reading;
}

/**
 * A reading of the attribute on the listed kinds.
 *
 * @param reading - The reading's number.
 * @param kinds - The kinds.
 * @param name - The attribute.
 * @param whiteSpace - How its whitespace is read.
 * @param read - The definition it reads the XSD's as.
 * @returns The reading.
 */
const on = (
  reading: number,
  kinds: readonly string[],
  name: string,
  whiteSpace: Reading,
  read: (domain: Domain) => Domain = (domain) => domain,
): SpecReading => ({ kinds: Option.some(kinds), name, read, reading, whiteSpace });

/**
 * `xs:string`'s definition, every value with its whitespace preserved: what spec reading 8 reads a
 * match table entry's `target-value` as before the overlay types it by the outcome's base type.
 */
const stringDomain: Domain = {
  _tag: "atomic",
  builtin: "string",
  facets: [{ facet: "whiteSpace", value: "preserve" }],
  patterns: [],
  primitive: "string",
};

/**
 * SSML 1.1's `speak/@version`, which "must have the value \"1.1\"" (SSML 1.1, §3.1.1): spec
 * reading 39 narrows the XSD's `version.datatype`, an `xs:NMTOKEN`, to that one value. The type's
 * `collapse` whitespace stays the XSD's.
 *
 * @param domain - The XSD's definition.
 * @returns It with the one enumeration value.
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#S3.1.1 | SSML 1.1, 3.1.1 speak Root Element}
 */
const ssmlVersion = (domain: Domain): Domain => ({
  ...domain,
  facets: [
    ...domain.facets.filter(({ facet }) => facet !== "enumeration"),
    { facet: "enumeration", value: "1.1" },
  ],
});

/**
 * An Extended Language Range (RFC 4647, §2.2), `(1*8ALPHA / "*") *("-" (1*8alphanum / "*"))`, as
 * an XSD pattern, but for the two values SSML 1.1 §3.2.1 disallows, `und` and `zxx`, compared
 * without regard to ASCII case (RFC 4647, §2: language ranges "are to be treated as
 * case-insensitive"). A range of more than one subtag is never one of the two, whatever its first.
 */
const languageRange = (() => {
  const first = String.raw`[A-Za-z]{1,8}|\*`;
  const subtags = String.raw`(-([A-Za-z0-9]{1,8}|\*))+`;
  const single = [
    String.raw`\*`,
    String.raw`[A-Za-z]{1,2}`,
    String.raw`[A-Za-z]{4,8}`,
    String.raw`[A-TV-Ya-tv-y][A-Za-z]{2}`,
    String.raw`[Uu]([A-MO-Za-mo-z][A-Za-z]|[Nn][A-CE-Za-ce-z])`,
    String.raw`[Zz]([A-WYZa-wyz][A-Za-z]|[Xx][A-WYZa-wyz])`,
  ].join("|");

  return `((${first})${subtags}|${single})`;
})();

/**
 * SSML 1.1's `voice/@languages`, "either the empty string \"\" or a space-separated list of
 * languages", each "of the form \"language\" or \"language:accent\", where both language and
 * accent must be an Extended Language Range ... except that the values \"und\" and \"zxx\" are
 * disallowed" (SSML 1.1, §3.2.1): spec reading 42 gives each token of the XSD's `xs:NMTOKENS`
 * member that form, and keeps its empty-string member.
 *
 * @param domain - The XSD's `languages.datatype`, a union of `xs:NMTOKENS` and the empty string.
 * @returns The union with each list token narrowed.
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#S3.2.1 | SSML 1.1, 3.2.1 voice Element}
 * @see {@link https://www.rfc-editor.org/rfc/rfc4647#section-2.2 | RFC 4647, 2.2 Extended Language Range}
 */
const ssmlLanguages = (domain: Domain): Domain =>
  domain._tag === "union"
    ? {
        ...domain,
        members: domain.members.map((member) =>
          member._tag === "list"
            ? {
                ...member,
                item: {
                  ...member.item,
                  patterns: [...member.item.patterns, [`${languageRange}(:${languageRange})?`]],
                },
              }
            : member,
        ),
      }
    : domain;

/**
 * The counts spec reading 46 holds to the signed 64-bit range, on every kind that declares them.
 */
const counts = [
  "max-choices",
  "min-choices",
  "max-associations",
  "min-associations",
  "match-max",
  "match-min",
  "max-plays",
  "min-plays",
] as const;

/**
 * The attribute readings of `docs/spec-readings.md`, the only places the grammar departs from the
 * XSD's declarations, each stating its reading's number:
 *
 * - 7: a typed QTI value in an attribute is exact, outer whitespace invalid: its listed attributes
 *   read no whitespace class.
 * - 8: a match table entry's `target-value` is a value of the outcome's base type, not a base-type
 *   name: any text, typed by the overlay.
 * - 15: a `variable-identifier-ref` names an outcome declaration, an identifier and not an `IDREF`.
 * - 16: `normal-maximum` is greater than zero.
 * - 18: an order or graphic-order interaction's `min-choices` is at least 1.
 * - 39: an SSML `speak/@version` is `1.1`.
 * - 42: an SSML `voice/@languages` holds language ranges, `und` and `zxx` refused.
 * - 46: a count, and `figures`, is a signed 64-bit integer.
 *
 * Reading 14, restated, follows the XSD (a text-entry interaction's `response-identifier` and
 * `string-identifier` are `IDREF`s), so it states nothing here.
 */
export const specReadings: readonly SpecReading[] = [
  on(7, ["qti-map-entry"], "map-key", "exact"),
  on(7, ["qti-map-entry", "qti-area-map-entry"], "mapped-value", "exact"),
  on(7, ["qti-mapping", "qti-area-mapping"], "lower-bound", "exact"),
  on(7, ["qti-mapping", "qti-area-mapping"], "upper-bound", "exact"),
  on(
    7,
    ["qti-mapping", "qti-area-mapping", "qti-match-table", "qti-interpolation-table"],
    "default-value",
    "exact",
  ),
  on(7, ["qti-interpolation-table-entry"], "target-value", "exact"),
  on(7, ["qti-interpolation-table-entry"], "source-value", "exact"),
  on(7, ["ud:mapping"], "defaultValue", "exact"),
  on(7, ["ud:mapping"], "lowerBound", "exact"),
  on(7, ["ud:mapping"], "upperBound", "exact"),
  on(7, ["ud:mapEntry"], "mappedValue", "exact"),
  on(8, ["qti-match-table-entry"], "target-value", "exact", () => stringDomain),
  on(15, ["qti-outcome-declaration"], "variable-identifier-ref", "xsd", (domain) =>
    domain._tag === "atomic" && domain.builtin === "IDREF"
      ? { ...domain, builtin: "NCName" }
      : domain,
  ),
  on(16, ["qti-outcome-declaration"], "normal-maximum", "xsd", (domain) => ({
    ...domain,
    facets: [
      ...domain.facets.filter(({ facet }) => facet !== "minInclusive"),
      { facet: "minExclusive", value: "0" },
    ],
  })),
  on(
    18,
    ["qti-order-interaction", "qti-graphic-order-interaction"],
    "min-choices",
    "xsd",
    (domain) => withFacets(domain, [{ facet: "minInclusive", value: "1" }]),
  ),
  on(39, ["ssml:speak"], "version", "xsd", ssmlVersion),
  on(42, ["ssml:voice"], "languages", "xsd", ssmlLanguages),
  ...[...counts, "figures"].map((name): SpecReading => ({
    kinds: name === "figures" ? Option.some(["qti-round-to", "qti-equal-rounded"]) : Option.none(),
    name,
    read: toInt64,
    reading: 46,
    whiteSpace: "xsd",
  })),
];

/**
 * The spec readings of one kind's attribute, in the order {@link specReadings} lists them.
 *
 * @param kind - The kind.
 * @param name - The attribute.
 * @returns The readings that apply.
 */
const readingsOf = (kind: string, name: string): readonly SpecReading[] =>
  specReadings.filter(
    (reading) =>
      reading.name === name &&
      Option.match(reading.kinds, { onNone: () => true, onSome: (kinds) => kinds.includes(kind) }),
  );

/**
 * A declaration whose domain does not compile: the declaring kind, the attribute (empty for a
 * kind's text), and why.
 */
export class UncompiledDomain extends Schema.TaggedError<UncompiledDomain>()("UncompiledDomain", {
  detail: Schema.String,
  kind: Schema.String,
  name: Schema.String,
}) {
  /**
   * The declaration, the reason, and the repair.
   */
  override get message(): string {
    const subject = this.name === "" ? `the text of ${this.kind}` : `${this.kind}@${this.name}`;

    return `The domain of ${subject} does not compile: ${this.detail} Give it a spec reading in the attribute grammar, or extend the domain compiler.`;
  }
}

/**
 * The ways a composition's declarations have no attribute grammar: a domain that does not
 * compile, or a relation that has no constant (a kind or name outside its roster, a kind that
 * declares a name twice in a version).
 */
export type AttributeGrammarError = ClosedRelationError | UncompiledDomain;

/**
 * The key of `AttributeGrammar`: version, kind, then attribute name, each over its roster.
 */
export type AttributeKey = readonly [
  IdField<"version", string>,
  IdField<"kind", string>,
  IdField<"name", string>,
];

/**
 * The payload of `AttributeGrammar`: the attribute's value domain, whether it is required, and its
 * position among the names its (version, kind) admits.
 */
export type AttributePayload = readonly [
  IdField<"domain", string>,
  IdField<"use", Use>,
  IdField<"position", string>,
];

/**
 * The payload of `ValueDomain`: the primitive a typed value is derived in, the pattern its lexical
 * forms match as written, and its residual facets, spelled `facet=value` space-separated (empty for
 * none).
 */
export type DomainPayload = readonly [
  IdField<"primitive", DomainPrimitive>,
  ValueField<"pattern", string>,
  ValueField<"facets", string>,
];

/**
 * The closed relations of the attribute grammar.
 */
export interface AttributeGrammar {
  /**
   * `AttributeGrammar`: each attribute an element of a kind may carry in a version, with its value
   * domain, its use and its position.
   */
  readonly admission: Closed<AttributeKey, AttributePayload>;
  /**
   * The `ValueDomain` roster's domains, in code order: each at its first use, versions outermost,
   * then the declarations in order, then the texts.
   */
  readonly domains: readonly ValueDomain[];
  /**
   * `ValueIdentity`: the identity type of each domain that has one.
   */
  readonly identity: Closed<
    readonly [IdField<"domain", string>],
    readonly [IdField<"identity", Identity>]
  >;
  /**
   * The `AttributePosition` roster: a (version, kind)'s admitted names numbered from 0 in
   * `AttributeName` code order, so an element's `attrs` is a set over positions (D8), as wide as
   * the most names one (version, kind) admits.
   */
  readonly positions: Roster<string>;
  /**
   * `TextDomain`: the value domain of a simple-content kind's text in a version, the language its
   * one `Text` child is read in.
   */
  readonly text: Closed<
    readonly [IdField<"version", string>, IdField<"kind", string>],
    readonly [IdField<"domain", string>]
  >;
  /**
   * `ValueDomain`: each domain's primitive, pattern and residual facets.
   */
  readonly valueDomain: Closed<readonly [IdField<"domain", string>], DomainPayload>;
}

/**
 * The rosters the attribute grammar is keyed by, and the declarations it reads.
 */
export interface AttributeGrammarInput {
  /**
   * Every attribute the composition's kinds declare, and those the composition states.
   */
  readonly declarations: readonly Declared[];
  /**
   * The `NodeKind` roster.
   */
  readonly kinds: Roster<string>;
  /**
   * The `AttributeName` roster, its open-name classes included.
   */
  readonly names: Roster<string>;
  /**
   * The text type of every simple-content kind of the composition.
   */
  readonly texts: readonly DeclaredText[];
  /**
   * The `SchemaVersion` roster.
   */
  readonly versions: Roster<SchemaVersion>;
}

/**
 * Spell a domain's residual facets as `ValueDomain`'s `facets` payload.
 *
 * @param domain - The compiled domain.
 * @returns `facet=value` for each, space-separated; empty for none.
 */
const facetsText = (domain: CompiledDomain): string =>
  domain.facets.map(({ facet, value }) => `${facet}=${value}`).join(" ");

/**
 * Key a compiled domain by its definition: two domains are one when their primitive, pattern,
 * residual facets and identity agree.
 *
 * @param domain - The compiled domain.
 * @returns The key.
 */
const definitionKey = (domain: CompiledDomain): string =>
  [
    domain.primitive,
    domain.pattern,
    facetsText(domain),
    Option.getOrElse(domain.identity, () => ""),
  ].join("\u0000");

/**
 * The `ValueDomain` roster as it grows: each definition at its first use, under the first handle no
 * other definition holds.
 */
interface DomainRoster {
  readonly byDefinition: Map<string, ValueDomain>;
  readonly handles: Set<string>;
  readonly ordered: ValueDomain[];
}

/**
 * Add a compiled domain to the roster, or find the domain of its definition.
 *
 * A domain is named after the type it was first compiled from: a named type by its QName, an
 * anonymous one by the declaration it types, and a reading's by its type and the reading. A name
 * another definition holds is followed by a count.
 *
 * @param domains - The roster.
 * @param compiled - The compiled definition.
 * @param name - The handle it would take.
 * @returns The roster's domain of that definition.
 */
const intern = (domains: DomainRoster, compiled: CompiledDomain, name: string): ValueDomain => {
  const key = definitionKey(compiled);
  const known = domains.byDefinition.get(key);
  if (known !== undefined) {
    return known;
  }

  let handle = name;
  for (let count = 2; domains.handles.has(handle); count += 1) {
    handle = `${name} (${count})`;
  }

  const domain = { ...compiled, handle };
  domains.byDefinition.set(key, domain);
  domains.handles.add(handle);
  domains.ordered.push(domain);

  return domain;
};

/**
 * The handle a declaration's domain would take: its type's QName, or for an anonymous type the
 * declaration itself; with the spec readings that alter it.
 *
 * @param type - The declared type.
 * @param anonymous - The name of the declaration, for an anonymous type.
 * @param readings - The spec readings applied to it.
 * @returns The handle.
 */
const handleOf = (type: ValueType, anonymous: string, readings: readonly SpecReading[]): string => {
  const base = Option.isNone(type.inline) ? type.type : anonymous;

  return readings.length === 0
    ? base
    : `${base} (reading ${[...new Set(readings.map(({ reading }) => reading))].join(", ")})`;
};

/**
 * Compile one declaration's domain, its spec readings applied.
 *
 * @param domains - The roster, which a new domain joins.
 * @param declared - The declaring kind, the attribute's name, and the type with its domain.
 * @param declared.domain - The type's resolved definition.
 * @param declared.kind - The declaring kind.
 * @param declared.name - The attribute's name.
 * @param declared.type - The declared type.
 * @param anonymous - The handle an anonymous type's domain would take.
 * @returns The domain, or the declaration's compile failure.
 */
const domainOf = (
  domains: DomainRoster,
  declared: {
    readonly domain: Domain;
    readonly kind: string;
    readonly name: string;
    readonly type: ValueType;
  },
  anonymous: string,
): Result.Result<ValueDomain, UncompiledDomain> => {
  const readings = readingsOf(declared.kind, declared.name);
  let { domain } = declared;
  for (const reading of readings) {
    domain = reading.read(domain);
  }

  const whiteSpace: Reading = readings.some((reading) => reading.whiteSpace === "exact")
    ? "exact"
    : "xsd";

  return compile(domain, whiteSpace).pipe(
    Result.map((compiled) =>
      intern(domains, compiled, handleOf(declared.type, anonymous, readings)),
    ),
    Result.mapError(
      (cause) =>
        new UncompiledDomain({ detail: cause.message, kind: declared.kind, name: declared.name }),
    ),
  );
};

/**
 * One attribute an element may carry in one version, with its compiled domain.
 */
interface Admitted {
  readonly domain: ValueDomain;
  readonly kind: string;
  readonly name: string;
  readonly use: Use;
  readonly version: SchemaVersion;
}

/**
 * Generate the attribute grammar of a composition.
 *
 * @param input - The rosters and the declarations.
 * @returns `AttributeGrammar`, `ValueDomain`, `ValueIdentity` and `TextDomain`, with the domain and
 *   position rosters; or the first declaration whose domain does not compile, or the first relation
 *   that has no constant.
 */
export const generate = (
  input: AttributeGrammarInput,
): Result.Result<AttributeGrammar, AttributeGrammarError> =>
  Result.gen(function* generateAttributes() {
    const domains: DomainRoster = { byDefinition: new Map(), handles: new Set(), ordered: [] };
    const admitted: Admitted[] = [];
    const texts: {
      readonly domain: ValueDomain;
      readonly kind: string;
      readonly version: SchemaVersion;
    }[] = [];
    for (const version of input.versions.handles) {
      for (const declared of input.declarations) {
        if (declared.versions.includes(version)) {
          const domain = yield* domainOf(domains, declared, `${declared.kind}@${declared.name}`);
          admitted.push({
            domain,
            kind: declared.kind,
            name: declared.name,
            use: declared.use,
            version,
          });
        }
      }

      for (const declared of input.texts) {
        if (declared.versions.includes(version)) {
          const domain = yield* domainOf(
            domains,
            { ...declared, name: "" },
            `${declared.kind} text`,
          );
          texts.push({ domain, kind: declared.kind, version });
        }
      }
    }

    const domainRoster = yield* roster(
      "ValueDomain",
      domains.ordered.map(({ handle }) => handle),
    );
    const version: IdField<"version", string> = idField("version", input.versions);
    const kind = idField("kind", input.kinds);
    const domain = idField("domain", domainRoster);
    const byKind = Map.groupBy(admitted, (row) => `${row.version}\u0000${row.kind}`);
    const positionOf = new Map(
      [...byKind.values()].flatMap((rows) =>
        rows
          .map((row) => ({ code: Option.getOrElse(input.names.codeOf(row.name), () => -1), row }))
          .toSorted((left, right) => left.code - right.code)
          .map(({ row }, position) => [row, position] as const),
      ),
    );
    const positions = fin(
      "AttributePosition",
      Math.max(0, ...[...byKind.values()].map((rows) => rows.length)),
    );
    const admission = yield* closed({
      key: [version, kind, idField("name", input.names)],
      name: "AttributeGrammar",
      payload: [domain, idField("use", yield* roster("Use", uses)), idField("position", positions)],
      rows: admitted.map((row) => ({
        domain: row.domain.handle,
        kind: row.kind,
        name: row.name,
        position: String(positionOf.get(row) ?? 0),
        use: row.use,
        version: row.version,
      })),
    });
    const valueDomain = yield* closed({
      key: [domain],
      name: "ValueDomain",
      payload: [
        idField("primitive", yield* roster("DomainPrimitive", domainPrimitives)),
        valueField(
          "pattern",
          domains.ordered.map(({ pattern }) => pattern),
        ),
        valueField("facets", domains.ordered.map(facetsText)),
      ],
      rows: domains.ordered.map((held) => ({
        domain: held.handle,
        facets: facetsText(held),
        pattern: held.pattern,
        primitive: held.primitive,
      })),
    });
    const identity = yield* closed({
      key: [domain],
      name: "ValueIdentity",
      payload: [idField("identity", yield* roster("Identity", identities))],
      rows: domains.ordered.flatMap((held) =>
        Option.toArray(held.identity).map((value) => ({ domain: held.handle, identity: value })),
      ),
    });
    const text = yield* closed({
      key: [version, kind],
      name: "TextDomain",
      payload: [domain],
      rows: texts.map((row) => ({
        domain: row.domain.handle,
        kind: row.kind,
        version: row.version,
      })),
    });

    return { admission, domains: domains.ordered, identity, positions, text, valueDomain };
  });

/**
 * Read the attributes a kind admits in a version, by position: each admitted name with its domain
 * and use, positions ascending.
 *
 * @param grammar - The attribute grammar.
 * @param names - The `AttributeName` roster.
 * @param version - The version.
 * @param kind - The kind.
 * @returns The kind's admitted attributes, in position order.
 */
export const admittedOf = (
  grammar: AttributeGrammar,
  names: Roster<string>,
  version: SchemaVersion,
  kind: string,
): readonly {
  readonly domain: string;
  readonly name: string;
  readonly position: number;
  readonly use: Use;
}[] =>
  names.handles.flatMap((name) =>
    Option.match(grammar.admission.lookup({ kind, name, version }), {
      onNone: () => [],
      onSome: (row) => [{ domain: row.domain, name, position: Number(row.position), use: row.use }],
    }),
  );

/**
 * Read `Required`'s row for a kind in a version: the positions of the attributes an element of the
 * kind must carry, `AttributeGrammar`'s side selected by `use = required`. An element's `attrs`
 * must contain it, `bit_count(required & ~attrs) = 0` (AL3).
 *
 * @param grammar - The attribute grammar.
 * @param names - The `AttributeName` roster.
 * @param version - The version.
 * @param kind - The kind.
 * @returns The required positions.
 */
export const requiredOf = (
  grammar: AttributeGrammar,
  names: Roster<string>,
  version: SchemaVersion,
  kind: string,
): ReadonlySet<number> =>
  new Set(
    admittedOf(grammar, names, version, kind)
      .filter(({ use }) => use === "required")
      .map(({ position }) => position),
  );

/**
 * A count an element's attributes must meet beside `Required`: how many of a set of names it
 * carries, from `min` to `max`, a spec reading's rule the XSD's `use` cannot state.
 */
export interface AttributeCount {
  readonly kind: string;
  readonly max: number;
  readonly min: number;
  readonly names: readonly string[];
  readonly reading: number;
}

/**
 * The attributes SSML 1.1's fragment removal keeps on an element of the kind: those SSML declares
 * on it, in no namespace, with `xml:lang` and `xml:base`, which it keeps "with the exception of
 * xml:lang and xml:base" while removing "all non-synthesis namespace elements and attributes"
 * (SSML 1.1, §2.2.1). Spec reading 43 counts only these.
 *
 * @param kind - An SSML kind.
 * @returns Its surviving names, declared ones first, in the leaf's order.
 * @see {@link https://www.w3.org/TR/speech-synthesis11/#S2.2.1 | SSML 1.1, 2.2.1 Conforming Speech Synthesis Markup Language Fragments}
 */
const survivingNames = (kind: string): readonly string[] => [
  ...new Set(
    attributeDeclarations
      .filter((row) => row.kind === kind && !row.name.includes(":"))
      .map(({ name }) => name),
  ),
  "xml:lang",
  "xml:base",
];

/**
 * The attribute counts of `docs/spec-readings.md`:
 *
 * - 41: an SSML `meta` has exactly one of `name` and `http-equiv` (SSML 1.1, §3.1.6: "Either a name
 *   or http-equiv attribute is required. It is an error to provide both").
 * - 43: an SSML `voice` or `prosody` has at least one attribute fragment removal keeps (SSML 1.1,
 *   §3.2.1 and §3.2.4: "it is an error if no attributes are specified").
 *
 * A name a kind does not admit is no position of it, so it counts nothing: `xml:base` on `prosody`
 * is admitted only where SSML's attribute wildcard reads the XML namespace.
 */
export const attributeCounts: readonly AttributeCount[] = [
  { kind: "ssml:meta", max: 1, min: 1, names: ["name", "http-equiv"], reading: 41 },
  {
    kind: "ssml:voice",
    max: Number.POSITIVE_INFINITY,
    min: 1,
    names: survivingNames("ssml:voice"),
    reading: 43,
  },
  {
    kind: "ssml:prosody",
    max: Number.POSITIVE_INFINITY,
    min: 1,
    names: survivingNames("ssml:prosody"),
    reading: 43,
  },
];
