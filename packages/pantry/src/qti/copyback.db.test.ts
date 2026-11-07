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
 * Every case is a direct SQL writer's (grizzle's README, "Direct SQL access"): the author login,
 * `SET ROLE` to the author role, at SERIALIZABLE, every deferrable foreign key deferred. It reads
 * a stored copy of the every-relation package, writes one variant of it, sets exactly one of the
 * two containments' foreign keys `IMMEDIATE`, and rolls back. So the server judges the variant by
 * that one law and no other, as if the other containment were dropped.
 */
import type { DbConnection } from "@bjornpagen/grizzle";
import { NodeFileSystem, NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Layer, Option, Redacted } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ValueBase } from "#pantry/qti/expression-types.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * The author login's PostgreSQL role, `<schema>__<login>`.
 */
const authorAppRole = "qti__author_app";

/**
 * The author role's PostgreSQL role, which holds SELECT, INSERT and DELETE on every table of `Qti`
 * it writes whole (grizzle's README, "Exactly what a role holds").
 */
const authorRole = "qti__author";

/**
 * The PostgreSQL schema of `Qti`'s tables.
 */
const qtiSchema = "qti";

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
 * A stored row as node-postgres decodes it, by column.
 */
type SqlRow = Readonly<Record<string, string | number | boolean>>;

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
  row: SqlRow,
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
 * The password a connection authenticates with, read once.
 *
 * @param password - The connection's password.
 * @returns The password's text.
 */
const passwordText = (password: DbConnection["password"]) =>
  (Redacted.isRedacted(password) ? Effect.succeed(password) : password).pipe(
    Effect.map(Redacted.value),
  );

/**
 * A session of the author login on the lease, over verify-full TLS against the cluster's CA,
 * closed with its scope: a direct SQL writer.
 */
const loginSession = Effect.gen(function* loginSession() {
  const connection = yield* loginConnection(authorAppRole);
  const password = yield* passwordText(connection.password);
  const client = new Client({
    database: connection.database,
    host: connection.transport.host,
    password,
    port: connection.transport.port,
    ssl: { ca: [connection.transport.ca].flat(), servername: connection.transport.servername },
    user: authorAppRole,
  });

  return yield* Effect.acquireRelease(
    Effect.tryPromise(() => client.connect()).pipe(Effect.as(client)),
    () => Effect.promise(() => client.end()),
  );
}).pipe(Effect.provide(NodeFileSystem.layer));

/**
 * Run one statement on a session and return its rows.
 *
 * @param client - The session.
 * @param text - The statement.
 * @param values - Its parameters.
 * @returns The rows, each as node-postgres decodes it.
 */
const rowsOf = <R extends QueryResultRow>(
  client: Client,
  text: string,
  values: readonly unknown[] = [],
) =>
  Effect.tryPromise(() => client.query<R>(text, [...values])).pipe(Effect.map(({ rows }) => rows));

/**
 * Whether a failure is a server error of node-postgres's, which carries a SQLSTATE and the
 * constraint it names.
 *
 * @param error - The failure's cause.
 * @returns Whether it is one.
 */
const isServerError = (error: unknown): error is DatabaseError =>
  error instanceof Error && "code" in error && "constraint" in error;

/**
 * The columns of a table a writer fills, in order: every live column PostgreSQL does not generate.
 *
 * @param client - The session.
 * @param table - The table.
 * @returns Their names.
 */
const writtenColumnsOf = (client: Client, table: string) =>
  rowsOf<{ readonly name: string }>(
    client,
    `SELECT a.attname AS name FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass($1) AND a.attnum > 0 AND NOT a.attisdropped
        AND a.attgenerated = ''
      ORDER BY a.attnum`,
    [`${qtiSchema}.${table}`],
  ).pipe(Effect.map((rows) => rows.map(({ name }) => name)));

/**
 * The one foreign key of a table whose comment, the law grizzle writes on each constraint, starts
 * and holds as given.
 *
 * @param client - The session.
 * @param table - The referencing table.
 * @param comment - How its comment is recognized.
 * @returns Its name.
 */
const foreignKeyOf = (client: Client, table: string, comment: Commented) =>
  rowsOf<{ readonly conname: string }>(
    client,
    `SELECT c.conname FROM pg_catalog.pg_constraint c
      WHERE c.contype = 'f' AND c.conrelid = pg_catalog.to_regclass($1)
        AND pg_catalog.starts_with(pg_catalog.obj_description(c.oid, 'pg_constraint'), $2)
        AND pg_catalog.strpos(pg_catalog.obj_description(c.oid, 'pg_constraint'), $3) > 0`,
    [`${qtiSchema}.${table}`, comment.starts, comment.holds],
  ).pipe(
    Effect.map((rows) => {
      assert.strictEqual(
        rows.length,
        1,
        `${table}: one foreign key commented "${comment.starts}…${comment.holds}"`,
      );

      return rows[0]?.conname ?? "";
    }),
  );

/**
 * Write one variant of a stored copy as the author role, every deferrable foreign key deferred,
 * set one foreign key immediate, and roll back: the server's verdict by that one law.
 *
 * @param client - The session.
 * @param of - The case.
 * @param stored - The stored copy.
 * @param columns - The copy's table's written columns.
 * @param constraint - The foreign key the case judges by.
 * @returns The server's error, or none when it accepted the variant.
 */
const judged = (
  client: Client,
  of: Case,
  stored: SqlRow,
  columns: readonly string[],
  constraint: string,
) =>
  Effect.gen(function* judgedByOne() {
    const { key, table } = copies[of.copy];
    const overrides = overridesOf(of.copy, of.variant, stored);

    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      if (of.variant !== "orphan") {
        yield* rowsOf(
          client,
          `DELETE FROM ${qtiSchema}.${table} WHERE ${key.map((name, at) => `"${name}" = $${String(at + 1)}`).join(" AND ")}`,
          key.map((name) => stored[name]),
        );
      }

      yield* rowsOf(
        client,
        `INSERT INTO ${qtiSchema}.${table} (${columns.map((name) => `"${name}"`).join(", ")}) VALUES (${columns
          .map((_, at) => `$${String(at + 1)}`)
          .join(", ")})`,
        columns.map((name) => overrides.get(name) ?? stored[name]),
      );
      yield* rowsOf(client, `SET CONSTRAINTS ${qtiSchema}."${constraint}" IMMEDIATE`);
    }).pipe(
      Effect.as(Option.none<DatabaseError>()),
      Effect.catch((error) =>
        isServerError(error.cause) ? Effect.succeed(Option.some(error.cause)) : Effect.fail(error),
      ),
    );
    yield* rowsOf(client, "ROLLBACK");

    return Option.getOrUndefined(outcome);
  });

describe.skipIf(!hasLease)(
  "qti/copyback.db.test.ts, on the lease",
  { timeout: testTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
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
            const id = yield* importPackage(dir);
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
                    const { stored: query, table } = copies[of.copy];
                    const [stored] = yield* rowsOf<SqlRow>(client, query, [id]);

                    assert.isDefined(
                      stored,
                      `${of.copy}: the every-relation package stores a copy`,
                    );

                    const columns = yield* writtenColumnsOf(client, table);
                    const constraint = yield* foreignKeyOf(
                      client,
                      of.direction === "forward" ? "attribute" : table,
                      copies[of.copy][of.direction],
                    );
                    const refused = yield* judged(client, of, stored ?? {}, columns, constraint);
                    const label = `${JSON.stringify(of)}: ${refused?.code ?? "accepted"} ${refused?.constraint ?? ""} ${refused?.message ?? ""}`;

                    c.note(refused === undefined ? "accepted" : "refused");
                    if (refusedByLaw(of)) {
                      assert.strictEqual(refused?.code, "23503", label);
                      assert.strictEqual(refused?.constraint, constraint, label);
                    } else {
                      assert.isUndefined(refused, label);
                    }
                  }),
              ),
            );
          }).pipe(Effect.scoped),
      );
    });
  },
);
