/**
 * The two copies of an attribute whose reverse containment is stated over the selection's key, on
 * the lease, PostgreSQL itself the judge: `ExpressionAttribute`, a typing attribute's copy keyed by
 * `(node, attribute)`, and `SectionIdentifier`, a `section-identifier`'s copy keyed by `node`
 * (`#pantry/qti/expressions.ts`).
 *
 * Each copy is held by two containments. The forward one, the attribute's `(node, name, kind,
 * lexical)` into its copy's, carries the copy's kind and lexical form. The reverse one, the copy's
 * key into the attribute selection's key, needs only the attribute to exist, so no UNIQUE holds
 * `Attribute.lexical`, which no pattern bounds. A copy whose lexical form differs from its
 * attribute's is therefore refused by the forward containment alone, and a copy with no attribute
 * at all by the reverse alone.
 *
 * Every case is a direct SQL writer's (grizzle's README, "Direct SQL access"), through the one
 * direct writer (`#pantry/test/direct-sql.ts`): the author login, `SET ROLE` to the author role, at
 * SERIALIZABLE, every deferrable foreign key deferred. It reads a stored copy of the every-relation
 * package, removes it unless the variant is an orphan beside it, writes one variant of it, sets
 * exactly one of the two containments' foreign keys `IMMEDIATE`, and rolls back. So the server
 * judges the variant by that one law and no other, as if the other containment were dropped. A
 * copy is a value the program fills itself, so its variant is the stored row by column, every
 * written column the stored one's but the ones the variant overrides.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer, Option, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { ValueBase } from "#pantry/qti/expression-types.ts";
import {
  constraintDescribed,
  judgedCase,
  loginSession,
  qtiSchema,
  writtenColumnsOf,
} from "#pantry/test/direct-sql.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hasLease } from "#pantry/test/settings.ts";

/**
 * A node no stored row holds: an orphan copy's.
 */
const strayNode = "00000000-0000-4000-8000-0000000000c5";

/**
 * The timeout of the one test here: an import of the every-relation package, then the box's twelve
 * transactions, each a handful of statements.
 */
const testTimeoutMs = 600_000;

/**
 * The two copies.
 */
type Copy = "ExpressionAttribute" | "SectionIdentifier";

/**
 * What a case writes in place of the stored copy:
 *
 * - `control`: the stored copy, deleted and written again unchanged;
 * - `wrong lexical`: the stored copy, deleted and written again with a lexical form its attribute
 *   does not hold, its row CHECKs still kept;
 * - `orphan`: a second copy, the stored one's fields under a node no attribute is on.
 */
type Variant = "control" | "orphan" | "wrong lexical";

/**
 * Which containment a case judges by: the attribute into its copy, or the copy into the attribute.
 */
type Direction = "forward" | "reverse";

/**
 * One case of the box.
 */
interface Case {
  readonly copy: Copy;
  readonly direction: Direction;
  readonly variant: Variant;
}

/**
 * Every copy, variant and direction: the box's twelve cases.
 */
const cases: Gen<Case> = (source) => ({
  copy: element<Copy>(["ExpressionAttribute", "SectionIdentifier"])(source),
  direction: element<Direction>(["forward", "reverse"])(source),
  variant: element<Variant>(["control", "wrong lexical", "orphan"])(source),
});

/**
 * The oracle: the laws' own definitions. The forward containment refuses a copy whose lexical form
 * is not its attribute's, since the attribute's copy at that key holds another; the reverse refuses
 * a copy no attribute is on. Each accepts every other variant, the control included.
 *
 * @param of - The case.
 * @returns Whether the one containment it judges by refuses its variant.
 */
const refusedByLaw = ({ direction, variant }: Case): boolean =>
  direction === "forward" ? variant === "wrong lexical" : variant === "orphan";

/**
 * How a foreign key's comment, the law grizzle writes on each constraint (`grizzle names`), is
 * recognized: its start, and a part it holds after the selections' predicates, which the comment
 * spells out as JSON.
 */
interface Commented {
  readonly holds: string;
  readonly starts: string;
}

/**
 * Each copy's table, the query that reads one stored copy of a package, and its two containments'
 * foreign keys: the forward one on `attribute`, the reverse one on the copy's own table.
 */
const copies = {
  ExpressionAttribute: {
    forward: {
      holds: ") to ExpressionAttribute(node, attribute, kind, lexical)",
      starts: "foreign key Attribute(node where ",
    },
    key: ["node", "attribute"],
    reverse: {
      holds: ") to Attribute(node where ",
      starts: "foreign key ExpressionAttribute(node where ",
    },
    // A written copy of a `base-type`; the stored one reads `float`.
    stored: `SELECT c.* FROM ${qtiSchema}.expression_attribute c
       JOIN ${qtiSchema}.node n ON n.id = c.node
       JOIN ${qtiSchema}.document d ON d.node = n.document
      WHERE d.package = $1 AND c.written AND c.lexical = 'float'
      ORDER BY c.node LIMIT 1`,
    table: "expression_attribute",
  },
  SectionIdentifier: {
    forward: {
      holds: ") to SectionIdentifier(node, attribute, kind, lexical)",
      starts: "foreign key Attribute(node where ",
    },
    key: ["node"],
    reverse: { holds: "", starts: "foreign key SectionIdentifier(node) to Attribute(node where " },
    stored: `SELECT c.* FROM ${qtiSchema}.section_identifier c
       JOIN ${qtiSchema}.document d ON d.node = c.document
      WHERE d.package = $1
      ORDER BY c.node LIMIT 1`,
    table: "section_identifier",
  },
} as const satisfies Record<
  Copy,
  {
    readonly forward: Commented;
    readonly key: readonly string[];
    readonly reverse: Commented;
    readonly stored: string;
    readonly table: string;
  }
>;

/**
 * The columns a variant of a stored copy writes, keeping every row CHECK of its table.
 *
 * - `ExpressionAttribute`'s wrong lexical form is `integer` under the base type `integer`, which
 *   `E1_derived` admits (a written `base-type` matches its base's spelling), and its attribute
 *   reads `float`.
 * - `SectionIdentifier`'s is its lexical form after one more space, written into `before`, so
 *   `E1_derived`'s `lexical = before ‖ identifier ‖ after` still holds.
 *
 * @param copy - The copy.
 * @param variant - What to write.
 * @param row - The stored copy.
 * @returns The columns it writes in place of the stored copy's.
 */
const overridesOf = (
  copy: Copy,
  variant: Variant,
  row: StoredRow,
): ReadonlyMap<string, string | number> => {
  if (variant === "control") {
    return new Map();
  }

  if (variant === "orphan") {
    return new Map([["node", strayNode]]);
  }

  return copy === "ExpressionAttribute"
    ? new Map<string, string | number>([
        ["base_type", ValueBase.handles.indexOf("integer")],
        ["lexical", "integer"],
      ])
    : new Map([
        ["before", ` ${String(row["before"])}`],
        ["lexical", ` ${String(row["lexical"])}`],
      ]);
};

/**
 * A stored copy as node-postgres decodes it, by column: a text, a number or a boolean each, or
 * NULL. The copy is the table's whole row (`SELECT c.*`), so it holds the generated column of a
 * selected foreign key, which is NULL wherever its selection fails.
 */
const StoredSchema = Schema.Record(
  Schema.String,
  Schema.NullOr(Schema.Union([Schema.String, Schema.Number, Schema.Boolean])),
);

type StoredRow = typeof StoredSchema.Type;

/**
 * How a foreign key's comment is recognized, as the `LIKE` pattern `constraintDescribed` matches:
 * its start, then the part it holds.
 *
 * @param comment - How its comment is recognized.
 * @returns The pattern.
 */
const patternOf = (comment: Commented): string => `${comment.starts}%${comment.holds}%`;

/**
 * A column of a stored copy.
 *
 * @param stored - The stored copy.
 * @param name - The column.
 * @returns Its value.
 */
const columnOf = (stored: StoredRow, name: string) =>
  stored[name] ?? assert.fail(`the stored copy holds no ${name}`);

describe.skipIf(!hasLease)(
  "qti/copyback.db.test.ts, on the lease",
  { timeout: testTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("an attribute's copy, held by its forward and its keyed reverse containment", (it) => {
      it.effect(
        "refuses a copy of another lexical form by the forward containment alone, and a copy of no attribute by the reverse alone",
        (ctx) =>
          // Oracle: the two laws' definitions (`refusedByLaw`), against PostgreSQL judging each
          // variant by one containment's foreign key with the other deferred and rolled back.
          // Bound: both copies, all three variants and both directions, 12 cases.
          Effect.gen(function* copyback() {
            const dir = yield* scopedPackage(
              everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }),
            );
            const id = yield* importDir(dir);
            const client = yield* loginSession;

            return yield* searched(
              ctx,
              exhaust(
                {
                  box: "both copies, every variant and both directions",
                  caseHang: Duration.minutes(2),
                  coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
                  generator: cases,
                  limit: 12,
                  literal: JSON.stringify,
                  oracle: {
                    kind: "postgresql",
                    name: "one containment's foreign key, the other deferred",
                  },
                  suite: "pantry/qti/copyback",
                },
                (of, c) =>
                  Effect.gen(function* oneCase() {
                    const { key, stored: query, table } = copies[of.copy];
                    // The login holds no SELECT of its own, so the stored copy is read as the author
                    // role, a case that writes nothing and reads it.
                    const { read } = yield* judgedCase(client, {
                      inserts: [],
                      reads: [{ text: query, values: [id] }],
                    });
                    const [stored] = Schema.decodeUnknownSync(Schema.Array(StoredSchema))(
                      read[0] ?? [],
                    );

                    assert.isDefined(
                      stored,
                      `${of.copy}: the every-relation package stores a copy`,
                    );

                    const overrides = overridesOf(of.copy, of.variant, stored);
                    const constraint = yield* constraintDescribed(
                      client,
                      of.direction === "forward" ? "attribute" : table,
                      patternOf(copies[of.copy][of.direction]),
                    );
                    const { refused } = yield* judgedCase(client, {
                      immediate: [constraint],
                      inserts: [
                        {
                          row: Object.fromEntries(
                            (yield* writtenColumnsOf(client, table)).map(({ name }) => [
                              name,
                              overrides.get(name) ?? columnOf(stored, name),
                            ]),
                          ),
                          table,
                        },
                      ],
                      removed:
                        of.variant === "orphan"
                          ? []
                          : [
                              {
                                key: Object.fromEntries(
                                  key.map((name) => [name, columnOf(stored, name)]),
                                ),
                                table,
                              },
                            ],
                    });
                    const error = Option.getOrUndefined(refused);
                    const label = `${JSON.stringify(of)}: ${error?.code ?? "accepted"} ${error?.constraint ?? ""} ${error?.message ?? ""}`;

                    c.note(error === undefined ? "accepted" : "refused");
                    if (refusedByLaw(of)) {
                      assert.strictEqual(error?.code, "23503", label);
                      assert.strictEqual(error?.constraint, constraint, label);
                    } else {
                      assert.isUndefined(error, label);
                    }
                  }),
              ),
            );
          }).pipe(Effect.scoped),
      );
    });
  },
);
