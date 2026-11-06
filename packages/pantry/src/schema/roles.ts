/**
 * The author role: the one that reads and writes a QTI document or manifest tree.
 */
import { role } from "@bjornpagen/grizzle";
import type {
  Alternatives,
  Capacity,
  Check,
  Containment,
  Key,
  Mirrors,
  Mutable,
  RelationOfKey,
  Selection,
  Side,
  StatementsOf,
} from "@bjornpagen/grizzle";
import { Qti } from "#pantry/schema/qti.ts";

/**
 * The relations the migration seeds, which no role writes.
 */
export const seededNames = [
  "Admission",
  "AncestryStep",
  "AttributeAdmission",
  "AttributeExclusion",
  "AttributeWildcard",
  "BindingFit",
  "GlobalAttribute",
  "GlobalElement",
  "MappableBaseType",
  "MathmlAttributeType",
  "OperatorArity",
  "OperatorArityMax",
  "OperatorArityUnbounded",
  "RecordBindingFit",
  "ResourceTypeOf",
  "RootOfType",
  "RootSchemaSet",
  "WildcardExclusion",
  "WildcardHost",
] as const;

const seeded: ReadonlySet<string> = new Set(seededNames);

type Members = typeof Qti.relations;

/**
 * The names of `Qti`'s stored relations: the members that declare fields, the rosters aside.
 */
type StoredName = {
  readonly [Name in keyof Members]: Members[Name] extends { readonly fields: unknown }
    ? Name
    : never;
}[keyof Members];

/**
 * `Qti`'s stored relations, each under its own name: the members that declare fields, the rosters
 * aside. The author role holds every one whole.
 */
const storedEntries = Object.entries(Qti.relations).filter(([, member]) => "fields" in member);

// SAFETY: the entries are the members of `Qti.relations` that declare `fields`, each under its own key, which is `Pick<Members, StoredName>`.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
const stored = Object.fromEntries(storedEntries) as Pick<Members, StoredName>;

// SAFETY: the names are the keys of `stored`, which is `StoredName`, less the seeded ones.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
const written = Object.keys(stored).filter((name) => !seeded.has(name)) as Exclude<
  StoredName,
  (typeof seededNames)[number]
>[];

/**
 * The relation a side of a law names: a selection names the relation it selects from.
 */
type SideRelation<R> = R extends Selection<infer Rel> ? Rel : R;

/**
 * The relations a side of a law names.
 */
type SideNames<X> = X extends Side<infer Src> ? SideRelation<Src> : never;

/**
 * The relations a law names, by its kind. A copy of grizzle's own `NamedBy`
 * (`types/schema/schema.ts`, with `SideRelation` in `types/schema/statements.ts:137`, at
 * `48256f8`), which grizzle does not export; `roles.test.ts` holds the copy to grizzle's role.
 */
type NamedBy<St> =
  St extends Key<infer R, readonly string[]>
    ? R
    : St extends Mutable<infer R>
      ? R
      : St extends Check<string, infer R>
        ? R
        : St extends Containment<infer L, infer R>
          ? SideNames<L> | SideNames<R>
          : St extends Mirrors<infer L, infer R>
            ? SideNames<L> | SideNames<R>
            : St extends Capacity<infer T, infer F>
              ? SideNames<T> | SideNames<F>
              : St extends Alternatives<infer P, string, infer C, infer Arms>
                ? RelationOfKey<P> | C | RelationOfKey<Exclude<Arms[keyof Arms], undefined>>
                : never;

/**
 * The laws of `St` whose relations are all in `Whole`: grizzle's `KeptStatement`, read over a union
 * the caller has already built. Reading `Author.statements` through grizzle's `KeptStatements`
 * costs about 4.1 instantiations per statement per role entry, and over the merged `Qti` that
 * passes TypeScript's limit (TS2589); over a built union the same computation is linear.
 */
export type KeptOf<St, Whole> = St extends unknown
  ? [NamedBy<St>] extends [Whole]
    ? St
    : never
  : never;

/**
 * The entries of `Qti`'s stored relations, as one union.
 */
type WholeEntries = Pick<Members, StoredName>[StoredName];

/**
 * The laws of `Qti` the author role keeps: those whose relations are all whole entries.
 */
type AuthorStatements = KeptOf<StatementsOf<typeof Qti>[number], WholeEntries>;

const built = role(Qti, "author", stored, { write: written });

/**
 * The author role with its kept laws typed over `AuthorStatements`.
 */
type AuthorRole = Omit<typeof built, "statements"> & {
  readonly statements: readonly AuthorStatements[];
};

/**
 * The author role: every stored relation of `Qti`, whole, writing all but the seeded ones.
 */
// SAFETY: `built` is the role, unchanged; its statements are the laws of `Qti` whose relations are all whole entries, which `AuthorStatements` names over the same union grizzle's `KeptStatements` reads.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; a direct assertion would compare the two statement types, which is the instantiation this avoids.
export const Author = built as unknown as AuthorRole;
