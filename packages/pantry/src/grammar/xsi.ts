/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * The relations of the `xsi:type` law, "XsiType derived" (rule `xsi-type`, spec reading 47): the
 * `TypeName` roster of the pinned XSDs' named types, and `XsiType(version, kind, type)`, the types
 * an element of a kind may name in its `xsi:type`. An element's governing type, `Node.governs`, is
 * a `TypeName` code: the type its `xsi:type` names, its declared type without one, and the null
 * object {@link noType} where no named type governs it.
 *
 * An element a declaration assesses strictly may carry `xsi:type` only where its value is a QName
 * that resolves to a type definition validly derived from the declared one (XML Schema 1.0 Part 1,
 * §3.3.4 Element Locally Valid (Element), clause 4; derivation by §3.4.6 and §3.14.6), and the
 * definition is one of the schema its document is assessed against (clause 4.1, "resolves to a type
 * definition"; spec reading 81's schema sets). So a kind's row names a derived type only where a
 * schema set its documents are assessed against holds it, its own schema's or XML Schema's
 * (`typeAvailable` of `#pantry/vocab/open.ts`): a content-packaging kind such as `csmd:GUID` names
 * no ASI type, which no manifest's set imports. A kind standing in several sets takes the union,
 * reading 81's limit. The codec resolves the QName against the element's in-scope namespaces, and
 * the law reads this set. An element of an anonymous declared type admits no named type, since none
 * derives from an anonymous one: its only row is {@link noType}, its own type with no `xsi:type`.
 *
 * A foreign element has no declaration, so no derivation constrains its `xsi:type`, and this law
 * selects it out. Its `xsi:type` still governs it where the QName resolves to a type its document's
 * schema set holds or a built-in (§3.3.4, Schema-Validity Assessment (Element), clause 1.2; spec
 * reading 60): the codec writes that type to `Node.governs`, and `none` for a name no such type
 * has, which leaves the element to lax assessment. The foreign governor laws judge it where the
 * type is simple, through the attribute grammar's `Governor` (`#pantry/grammar/attributes.ts`): it
 * admits the four `xsi:` names alone (Element Locally Valid (Type), clause 3.1.1), holds no element
 * child (clause 3.1.2, law "Foreign simple content") and holds text in the type's `TypeText`
 * domain (clause 3.1.3, `TextDomain`). A complex type is spec reading 50's unchecked limit.
 */
import { Option, Result, Schema } from "effect";
import { closed, idField, roster, sourced } from "#pantry/grammar/closed.ts";
import type { ClosedRelationError, IdField, Roster, Sourced } from "#pantry/grammar/closed.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type {
  ContentModel,
  ExpandedName,
  Source,
  Sources,
  TypeDerivation,
} from "#pantry/vocab/inventory/types.ts";
import { vocabularyNamespaces, xsNamespace } from "#pantry/vocab/namespaces.ts";
import { typeAvailable } from "#pantry/vocab/open.ts";

/**
 * The null object of a node's governing type: the `TypeName` handle of no named type, which an
 * anonymous declared type, a foreign element whose `xsi:type` gives it no type, and a node that is
 * no element take. No pinned XSD names a type `none` in QTI's namespace, whose type handles carry
 * no prefix, so no type's handle is spelled so (`xsi.test.ts`).
 */
export const noType = "none";

/**
 * The prefix each pinned namespace's type handles open with: the one its vocabulary's kind handles
 * carry (`vocabularyNamespaces`), none for QTI's own, and `xs:` for XML Schema's built-ins.
 *
 * Each namespace has its own prefix and each prefix ends a handle's first `:` or opens none, so a
 * handle spells exactly one expanded name ({@link expandedNameOf}). A handle is held in a
 * PostgreSQL `name`, at most 63 UTF-8 bytes (grizzle's README, "Tables and types"), which an
 * expanded name `{namespace}local` overruns 132 times among the pinned types; a prefixed one is at
 * most 40 bytes.
 */
export const typePrefixes: ReadonlyMap<string, string> = new Map([
  ...Object.values(vocabularyNamespaces).map(
    ({ namespace, prefix }) => [namespace, prefix] as const,
  ),
  [xsNamespace, "xs:"],
]);

/**
 * The namespace each type handle prefix stands for: {@link typePrefixes} read backward.
 */
const prefixedNamespaces: ReadonlyMap<string, string> = new Map(
  [...typePrefixes].map(([namespace, prefix]) => [prefix, namespace] as const),
);

/**
 * Spell a type's expanded name as its `TypeName` handle: its namespace's prefix
 * ({@link typePrefixes}), then its local name, so `xs:NCName`, `lom:Identifier.Type` and, in QTI's
 * own namespace, `ItemBodyDType`. A type in a namespace no pinned XSD declares, which no roster
 * holds, keeps its expanded name, `{namespace}local`, which opens with a `{` no prefixed handle
 * does, so no two names share a handle.
 *
 * @param name - The type's name.
 * @returns The handle.
 */
export const typeHandle = ({ local, namespace }: ExpandedName): string => {
  const prefix = typePrefixes.get(namespace);

  return prefix === undefined ? `{${namespace}}${local}` : `${prefix}${local}`;
};

/**
 * Read a `TypeName` handle back as the expanded name it spells, {@link typeHandle}'s inverse.
 *
 * @param handle - A handle {@link typeHandle} spelled, or {@link noType}.
 * @returns The name, or none for {@link noType} and for a handle whose prefix no pinned namespace
 *   has.
 */
export const expandedNameOf = (handle: string): Option.Option<ExpandedName> => {
  if (handle === noType) {
    return Option.none();
  }

  if (handle.startsWith("{")) {
    const close = handle.indexOf("}");

    return close > 0
      ? Option.some({ local: handle.slice(close + 1), namespace: handle.slice(1, close) })
      : Option.none();
  }

  const colon = handle.indexOf(":");

  return Option.map(
    Option.fromNullishOr(prefixedNamespaces.get(handle.slice(0, colon + 1))),
    (namespace) => ({ local: handle.slice(colon + 1), namespace }),
  );
};

/**
 * `XsiType`: (version, kind, type) where an element of the kind may name the type in its
 * `xsi:type`, each row sourced to the kind's model in its version, whose declared type it derives
 * from.
 */
export type XsiType = Sourced<
  readonly [IdField<"version", SchemaVersion>, IdField<"kind", string>, IdField<"type", string>],
  readonly []
>;

/**
 * The `xsi:type` law's relations of a composition.
 */
export interface XsiTypes {
  /**
   * Find the type a kind declares in a version: the governing type of its element without
   * `xsi:type`.
   *
   * @param version - The version.
   * @param kind - The kind.
   * @returns The declared type's handle, {@link noType} for an anonymous one or a kind no model
   *   declares.
   */
  readonly declaredType: (version: SchemaVersion, kind: string) => string;
  /**
   * Whether a version's pinned schemas define a type: the names its derivations list, built-ins
   * included. An `xsi:type` resolves only against its document's version (XML Schema 1.0 Part 1,
   * §3.3.4, Element Locally Valid (Element), clause 4.2: the QName must resolve "to a type
   * definition" of the schemas the document is assessed against), so a type of 3.0.1 alone names
   * none in 3.0.0. Every lookup of a type by name asks this; {@link XsiTypes.typeName} is the code
   * space, never a lookup.
   *
   * @param version - The document's version.
   * @param handle - The type's handle, as {@link typeHandle} spells it.
   * @returns Whether the version defines it.
   */
  readonly definedIn: (version: SchemaVersion, handle: string) => boolean;
  /**
   * The `TypeName` roster, the code space of every governing-type field: {@link noType}, then every
   * named type of the pinned XSDs of every version, built-ins included, each as {@link typeHandle}
   * spells it, in the order the derivations first name it. It is no lookup: a name is a type of a
   * version only where {@link XsiTypes.definedIn} says so.
   */
  readonly typeName: Roster<string>;
  readonly xsiType: XsiType;
}

/**
 * A model declares a type that no derivation lists in one of its versions, so the types validly
 * derived from it are not known.
 */
export class UnderivedType extends Schema.TaggedError<UnderivedType>()("UnderivedType", {
  kind: Schema.String,
  type: Schema.String,
  version: Schema.String,
}) {
  /**
   * The kind, its declared type and version, and the repair.
   */
  override get message(): string {
    return `${this.kind} declares the type ${this.type} in ${this.version}, which no type derivation lists, so the types its xsi:type may name are unknown. Derive the type's derivations in that version.`;
  }
}

/**
 * The ways the `xsi:type` relations have no constant.
 */
export type XsiTypeError = ClosedRelationError | UnderivedType;

/**
 * Read a version's source of a row whose sources are aligned with its versions.
 *
 * @param sources - The sources.
 * @param at - The version's index.
 * @returns The version's source.
 */
const sourceIn = (sources: Sources, at: number): Source => sources[at] ?? sources[0];

/**
 * The derivations read for lookup: each (version, type)'s derived names, the `TypeName` roster's
 * handles, {@link noType} first, and the handles each version's schemas name.
 */
interface DerivationIndex {
  readonly derivedFrom: ReadonlyMap<string, readonly ExpandedName[]>;
  readonly names: readonly string[];
  readonly namesIn: ReadonlyMap<SchemaVersion, ReadonlySet<string>>;
}

/**
 * The index of each derivations list read so far. Every composition reads the one leaf, and its
 * `xs:anyType` row lists every name of a version, so indexing it once keeps a composition's cost
 * in its own rows.
 */
const derivationIndexes = new WeakMap<readonly TypeDerivation[], DerivationIndex>();

/**
 * Index derivations for lookup, once per list.
 *
 * @param derivations - The derivations.
 * @returns Their index.
 */
const derivationIndexOf = (derivations: readonly TypeDerivation[]): DerivationIndex => {
  const known = derivationIndexes.get(derivations);
  if (known !== undefined) {
    return known;
  }

  const index: DerivationIndex = {
    derivedFrom: new Map(
      derivations.flatMap(({ derived, type, versions }) =>
        versions.map((version) => [`${version} ${typeHandle(type)}`, derived] as const),
      ),
    ),
    names: [
      noType,
      ...new Set(derivations.flatMap(({ derived, type }) => [type, ...derived].map(typeHandle))),
    ],
    namesIn: new Map(
      [...new Set(derivations.flatMap(({ versions }) => versions))].map((version) => [
        version,
        new Set(
          derivations
            .filter(({ versions }) => versions.includes(version))
            .flatMap(({ derived, type }) => [type, ...derived].map(typeHandle)),
        ),
      ]),
    ),
  };
  derivationIndexes.set(derivations, index);

  return index;
};

/**
 * Generate the `xsi:type` relations from the content models' declared types and the types validly
 * derived from each.
 *
 * @param input - The rosters, the models and the derivations.
 * @param input.derivations - The named types validly derived from each type, per version.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.models - The content models, each with its declared type.
 * @param input.namespaceOf - The namespace of each modeled kind, empty for a kind of no
 *   vocabulary.
 * @param input.versions - The `SchemaVersion` roster.
 * @returns The relations, or the first model whose type no derivation lists, or the first row no
 *   constant can hold.
 */
export const xsiTypesOf = (input: {
  readonly derivations: readonly TypeDerivation[];
  readonly kinds: Roster<string>;
  readonly models: readonly ContentModel[];
  readonly namespaceOf: ReadonlyMap<string, string>;
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<XsiTypes, XsiTypeError> =>
  Result.gen(function* generateXsiTypes() {
    const { derivedFrom, names, namesIn } = derivationIndexOf(input.derivations);
    const rows: {
      readonly kind: string;
      readonly source: Source;
      readonly type: string;
      readonly version: SchemaVersion;
    }[] = [];
    const declared = new Map<string, string>();
    for (const { kind, sources, type, versions } of input.models) {
      for (const [at, version] of versions.entries()) {
        const source = sourceIn(sources, at);
        declared.set(
          `${version} ${kind}`,
          Option.match(type, { onNone: () => noType, onSome: typeHandle }),
        );
        if (Option.isNone(type)) {
          rows.push({ kind, source, type: noType, version });
        }

        for (const named of Option.toArray(type)) {
          const derived = derivedFrom.get(`${version} ${typeHandle(named)}`);
          if (derived === undefined) {
            return yield* Result.fail(
              new UnderivedType({ kind, type: typeHandle(named), version }),
            );
          }

          const namespace = input.namespaceOf.get(kind) ?? "";
          rows.push(
            ...derived
              .filter(
                (held) => held.namespace === namespace || typeAvailable(namespace, held.namespace),
              )
              .map((held) => ({ kind, source, type: typeHandle(held), version })),
          );
        }
      }
    }

    const typeName = yield* roster("TypeName", names);
    const sourceOf = new Map(
      rows.map(({ kind, source, type, version }) => [`${version} ${kind} ${type}`, source]),
    );
    const relation = yield* closed({
      key: [
        idField("version", input.versions),
        idField("kind", input.kinds),
        idField("type", typeName),
      ],
      name: "XsiType",
      payload: [],
      rows: rows.map(({ kind, type, version }) => ({ kind, type, version })),
    });

    return {
      declaredType: (version, kind) => declared.get(`${version} ${kind}`) ?? noType,
      definedIn: (version, handle) => namesIn.get(version)?.has(handle) ?? false,
      typeName,
      // Every row is stated with its model's source, so a row without one is a defect here.
      xsiType: sourced(relation, ({ kind, type, version }) =>
        Option.getOrThrowWith(
          Option.fromNullishOr(sourceOf.get(`${version} ${kind} ${type}`)),
          () => new Error(`XsiType states ${type} on ${kind} in ${version} with no source.`),
        ),
      ),
    };
  });
