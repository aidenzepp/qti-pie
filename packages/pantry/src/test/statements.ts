/**
 * A schema's laws read as the foreign keys between its stored relations: each containment's key and
 * each family's owner axis, read off the laws grizzle's public `lawsOf` lists (through
 * `schemaLawsOf` of `#pantry/import/refusal.ts`, the one compile per process) and the relations'
 * typed `kind` and `name`, never off grizzle's statement shapes.
 */
import { schemaLawsOf } from "#pantry/import/refusal.ts";
import type { Qti } from "#pantry/qti/schema.ts";

/**
 * A foreign key as the laws give it: from one relation into another, by their declared names.
 */
export interface ForeignKey {
  readonly from: string;
  readonly to: string;
}

/**
 * Read a schema's laws as the foreign keys its containments install and its families' owner axes.
 *
 * - `laws`: one key per containment law a statement states between stored relations, a mirrors' two
 *   and an alternatives' containments among them. A containment that reads a closed relation
 *   installs a CHECK on the source's rows, no key.
 * - `axes`: one key per counted or ordered family, from its member into its owner. Every family also
 *   installs the reverse key, its owner's proof key into its last member, as `Qti`'s drafted
 *   `_init` holds for each of its families.
 *
 * @param schema - The schema, `Qti`.
 * @returns The containments' foreign keys and the owner axes, one per law.
 */
export const keysOf = (schema: typeof Qti) => {
  const stored: ReadonlySet<string> = new Set(
    Object.values(schema.relations).flatMap((relation) =>
      relation.kind === "relation" ? [relation.name] : [],
    ),
  );
  const laws = schemaLawsOf(schema);

  return {
    axes: laws.flatMap((law): readonly ForeignKey[] =>
      law.kind === "family" ? [{ from: law.member.relation, to: law.slots.owner }] : [],
    ),
    laws: laws.flatMap((law): readonly ForeignKey[] =>
      law.kind === "contained" && stored.has(law.from.relation) && stored.has(law.to.relation)
        ? [{ from: law.from.relation, to: law.to.relation }]
        : [],
    ),
  };
};
