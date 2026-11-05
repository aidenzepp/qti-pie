/**
 * The author role: the one that reads and writes a QTI document or manifest tree.
 */
import { role } from "@bjornpagen/grizzle";
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
 * The author role: every stored relation of `Qti`, whole, writing all but the seeded ones.
 */
export const Author = role(Qti, "author", stored, { write: written });
