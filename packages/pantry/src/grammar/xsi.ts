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
 * §3.3.4 Element Locally Valid (Element), clause 4; derivation by §3.4.6 and §3.14.6). The codec
 * resolves the QName against the element's in-scope namespaces, and the law reads this set. An
 * element of an anonymous declared type admits no named type, since none derives from an anonymous
 * one: its only row is {@link noType}, its own type with no `xsi:type`.
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

/**
 * The null object of a node's governing type: the `TypeName` handle of no named type, which an
 * anonymous declared type, a foreign element whose `xsi:type` gives it no type, and a node that is
 * no element take. No type's handle is spelled so, since every other one opens with `{`.
 */
export const noType = "none";

/**
 * Spell a type's expanded name as its `TypeName` handle, `{namespace}local` (James Clark's
 * notation), so no two types share one.
 *
 * @param name - The type's name.
 * @returns The handle.
 */
export const typeHandle = ({ local, namespace }: ExpandedName): string => `{${namespace}}${local}`;

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
   * The `TypeName` roster: {@link noType}, then every named type of the pinned XSDs, built-ins
   * included, each as {@link typeHandle} spells it, in the order the derivations first name it.
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
 * The derivations read for lookup: each (version, type)'s derived names, and the `TypeName`
 * roster's handles, {@link noType} first.
 */
interface DerivationIndex {
  readonly derivedFrom: ReadonlyMap<string, readonly ExpandedName[]>;
  readonly names: readonly string[];
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
 * @param input.versions - The `SchemaVersion` roster.
 * @returns The relations, or the first model whose type no derivation lists, or the first row no
 *   constant can hold.
 */
export const xsiTypesOf = (input: {
  readonly derivations: readonly TypeDerivation[];
  readonly kinds: Roster<string>;
  readonly models: readonly ContentModel[];
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<XsiTypes, XsiTypeError> =>
  Result.gen(function* generateXsiTypes() {
    const { derivedFrom, names } = derivationIndexOf(input.derivations);
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

          rows.push(...derived.map((held) => ({ kind, source, type: typeHandle(held), version })));
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
