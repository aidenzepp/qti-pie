/**
 * A schema's statements read as the foreign keys between its stored relations: each law's key and
 * each family's owner axis, as grizzle keeps the statements on `schema(...).statements`, parsed at
 * this boundary with Effect Schema so a test reads typed sides, never grizzle's internal types.
 */
import { Option, Predicate, Schema } from "effect";

/**
 * A relation as a statement's side holds it: stored (`relation`) or closed (`closedRelation`), with
 * its fields by name.
 */
const RelationSchema = Schema.Struct({
  fields: Schema.Record(Schema.String, Schema.Unknown),
  kind: Schema.String,
  name: Schema.String,
});

/**
 * A side of a statement as grizzle keeps it: a selection over a relation, or a whole relation, and
 * its terms, a `pred` one as an object over its field.
 */
const SideSchema = Schema.Struct({
  source: Schema.Union([Schema.Struct({ relation: RelationSchema }), RelationSchema]),
  terms: Schema.Array(Schema.Union([Schema.String, Schema.Struct({ field: Schema.String })])),
});

/**
 * The statements that install a foreign key, as grizzle keeps them: a containment, a mirrors, and a
 * counted or ordered family, whose owner axis is its member's key into its owner.
 */
const StatementSchema = Schema.Union([
  Schema.Struct({
    kind: Schema.Literals(["contained", "mirrors"]),
    left: SideSchema,
    right: SideSchema,
  }),
  Schema.Struct({
    family: SideSchema,
    kind: Schema.Literals(["counted", "ordered"]),
    slots: Schema.Struct({ owner: RelationSchema }),
  }),
]);

/**
 * A statement's kind, read before its shape.
 */
const KindSchema = Schema.Struct({ kind: Schema.String });

/**
 * The kinds of statement {@link StatementSchema} must read.
 */
const keyKinds: ReadonlySet<string> = new Set(["contained", "counted", "mirrors", "ordered"]);

/**
 * A side as {@link SideSchema} reads it.
 */
type StoredSide = typeof SideSchema.Type;

/**
 * The relation a side reads.
 *
 * @param side - The side.
 * @returns The relation.
 */
const relationOf = (side: StoredSide): typeof RelationSchema.Type =>
  "relation" in side.source ? side.source.relation : side.source;

/**
 * A foreign key as the statements give it: from one relation into another, by their declared
 * names, and whether its target holds no field beyond the terms it names.
 */
export interface Edge {
  readonly covers: boolean;
  readonly from: string;
  readonly to: string;
}

/**
 * The foreign key a containment from one side into another installs, none where either side reads
 * a closed relation, whose containment grizzle installs as a CHECK on the source's rows.
 *
 * @param from - The source side.
 * @param to - The target side.
 * @returns The edge, or none.
 */
const edgesOf = (from: StoredSide, to: StoredSide): readonly Edge[] => {
  const source = relationOf(from);
  const target = relationOf(to);
  const terms = new Set(to.terms.filter(Predicate.isString));

  return source.kind !== "relation" || target.kind !== "relation"
    ? []
    : [
        {
          covers: Object.keys(target.fields).every((field) => terms.has(field)),
          from: source.name,
          to: target.name,
        },
      ];
};

/**
 * Read a schema's statements as the foreign keys its laws install and its families' owner axes.
 *
 * - `laws`: one edge per containment between stored relations, and one each way per mirrors;
 * - `axes`: one edge per counted or ordered family, from its member into its owner. Every family also
 *   installs the reverse key, its owner's proof key into its last member, as `Qti`'s drafted
 *   `_init` (`20261107020714`) holds for each of its 68 families.
 *
 * @param statements - The schema's statements.
 * @returns The laws' foreign keys and the owner axes, one per statement and direction.
 */
export const keysOf = (statements: readonly unknown[]) => {
  const laws: Edge[] = [];
  const axes: Edge[] = [];
  for (const statement of statements) {
    const kind = Option.map(Schema.decodeUnknownOption(KindSchema)(statement), ({ kind: k }) => k);
    if (Option.isSome(kind) && keyKinds.has(kind.value)) {
      const read = Schema.decodeUnknownSync(StatementSchema)(statement);
      if (read.kind === "contained") {
        laws.push(...edgesOf(read.left, read.right));
      } else if (read.kind === "mirrors") {
        laws.push(...edgesOf(read.left, read.right), ...edgesOf(read.right, read.left));
      } else if ("family" in read) {
        axes.push({ covers: true, from: relationOf(read.family).name, to: read.slots.owner.name });
      }
    }
  }

  return { axes, laws };
};
