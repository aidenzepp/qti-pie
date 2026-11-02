/**
 * The author role: the one that reads and writes a QTI document or manifest tree.
 */
import { role } from "@bjornpagen/grizzle";
import { Qti } from "#qti/schema/qti.ts";

/**
 * The relations the migration seeds, which no role writes.
 */
const seededNames = [
  "Admission",
  "BindingFit",
  "OperatorArity",
  "OperatorArityMax",
  "ResourceTypeOf",
  "RootOfType",
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
 * Every stored relation of `Qti`, whole.
 */
// SAFETY: the filter keeps exactly the members whose type declares `fields`, which is what `StoredName` selects.
const stored = Object.fromEntries(
  Object.entries(Qti.relations).filter(([, member]) => "fields" in member),
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
) as Pick<Members, StoredName>;

/**
 * The stored relations the migration does not seed.
 */
// SAFETY: the keys of `stored` are `StoredName` and the filter removes the seeded names.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
const written = Object.keys(stored).filter((name) => !seeded.has(name)) as Exclude<
  StoredName,
  (typeof seededNames)[number]
>[];

export const Author = role(Qti, "author", stored, { write: written });
