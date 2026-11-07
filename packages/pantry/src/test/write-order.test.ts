/**
 * No write of `Qti` meets a pair of foreign keys PostgreSQL checks in an order no INSERT can keep:
 * a family's owner axis, the member's copy of its owner's count, which PostgreSQL checks at the
 * member's INSERT (so grizzle writes the owner first), closed into a cycle by the laws' own foreign
 * keys that PostgreSQL checks at the statement too. A containment is checked at the statement when
 * its target holds no field beyond the ones it names and it lies on no cycle of the laws' foreign
 * keys (grizzle's README, "Direct SQL access", 23503), and grizzle reads that cycle among the laws'
 * keys alone, leaving the owner axes out (engine `laws/model/model.ts` `#deferral`). So a
 * containment from an owner into its own family's member over every field of the member is
 * installed immediate beside the owner axis, and the owner's INSERT meets it before its member
 * exists: every such write is refused 23503. The LOM string's and the assessment object's language
 * laws were stated so until they were turned to run from the member into its owner
 * (`#pantry/qti/metadata.ts`), and the corpus tier refused sharedMedia and metaData by the first.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option, Predicate, Schema } from "effect";
import { Qti } from "#pantry/qti/schema.ts";

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
 * A foreign key as the laws give it: from one relation into another, and whether its target holds
 * no field beyond the terms it names.
 */
interface Edge {
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
 * Read a schema's statements as the foreign keys its laws install and its families' owner axes,
 * each a member's key into its owner.
 *
 * @param statements - The schema's statements.
 * @returns The laws' foreign keys and the owner axes.
 */
const keysOf = (statements: readonly unknown[]) => {
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

/**
 * Whether one relation reaches another along edges.
 *
 * @param edges - The edges.
 * @param from - The first relation.
 * @param to - The second.
 * @returns Whether a path of at least one edge leads from the first to the second.
 */
const reaches = (edges: readonly Edge[], from: string, to: string): boolean => {
  const seen = new Set<string>();
  const frontier = [from];
  for (let at = frontier.shift(); at !== undefined; at = frontier.shift()) {
    for (const edge of edges.filter((candidate) => candidate.from === at)) {
      if (edge.to === to) {
        return true;
      }

      if (!seen.has(edge.to)) {
        seen.add(edge.to);
        frontier.push(edge.to);
      }
    }
  }

  return false;
};

/**
 * The cycles a write cannot order: each relation pair joined by a law's foreign key PostgreSQL
 * checks at the statement, whose target reaches back to its source along the statement-checked
 * keys and at least one owner axis.
 *
 * @param keys - The schema's keys.
 * @param keys.axes - Its families' owner axes.
 * @param keys.laws - Its laws' foreign keys.
 * @returns Each such law's key, as `from -> to`.
 */
const unorderable = (keys: ReturnType<typeof keysOf>): readonly string[] => {
  const between = keys.laws.filter(({ from, to }) => from !== to);
  const immediate = between.filter(({ covers, from, to }) => covers && !reaches(between, to, from));
  const axes = keys.axes.filter(({ from, to }) => from !== to);

  return [
    ...new Set(
      immediate
        .filter(
          ({ from, to }) =>
            reaches([...immediate, ...axes], to, from) && !reaches(immediate, to, from),
        )
        .map(({ from, to }) => `${from} -> ${to}`),
    ),
  ];
};

describe("the order of Qti's writes", () => {
  it("meets no cycle of statement-checked foreign keys through a family's owner axis", () => {
    // Oracle: grizzle's deferral of a law's foreign key (README, "Direct SQL access": deferred
    // when its target has another field or it lies on a cycle of the laws' keys; at the statement
    // otherwise) and the owner axis, a member's key into its owner checked at the member's INSERT,
    // which the drafted _init of grizzle 4b155e8 installs so: there, the only two cycles of
    // statement-checked keys across tables are this guard's two shapes at the schema before the
    // metadata repair (LomString into LomStringLanguage, AssessmentObject into ObjectLang).
    // Bound: every statement of Qti.
    assert.deepStrictEqual(unorderable(keysOf(Qti.statements)), []);
  });

  it("finds the shape the metadata repair removed, an owner's containment into its own family's member", () => {
    // Oracle: the corpus tier's refusal of sharedMedia, `contained LomString(node, language) in
    // LomStringLanguage(node, language)` (23503 at the string's INSERT), restated as two relations.
    // Bound: the shape, its repaired direction, and the same law over a target holding another
    // field, which grizzle defers.
    const owner = { fields: { language: 0, languages: 0, node: 0 }, kind: "relation", name: "O" };
    const member = { fields: { language: 0, node: 0 }, kind: "relation", name: "M" };
    const family = {
      family: { source: member, terms: ["node"] },
      kind: "counted",
      slots: { count: "languages", kind: "fin", owner },
    };
    const wider = { ...member, fields: { ...member.fields, other: 0 } };
    const contained = (
      left: typeof owner | typeof member | { readonly relation: typeof owner },
      right: typeof owner | typeof member | typeof wider,
      terms: readonly string[],
    ) => ({
      kind: "contained",
      left: { source: left, terms },
      right: { source: right, terms },
    });

    assert.deepStrictEqual(
      unorderable(keysOf([family, contained({ relation: owner }, member, ["node", "language"])])),
      ["O -> M"],
    );
    assert.deepStrictEqual(
      unorderable(keysOf([family, contained(member, owner, ["node", "language"])])),
      [],
    );
    assert.deepStrictEqual(
      unorderable(keysOf([family, contained({ relation: owner }, wider, ["node", "language"])])),
      [],
    );
  });
});
