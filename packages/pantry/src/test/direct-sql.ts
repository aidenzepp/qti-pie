/**
 * A direct SQL writer for the database suites (grizzle's README, "Direct SQL access"; the rules
 * file's rule 8): the author login, `SET ROLE` to the author role, SERIALIZABLE, every deferrable
 * foreign key deferred, each row inserted into its table with every column a writer fills, a
 * family's hidden index and copy of its owner's count among them by the comment grizzle installs
 * on each, and a rollback. A role writes a table, never its own view of it, which it holds SELECT
 * on alone (README, "Security model"). So a case's verdict is the server's judgment of its rows by
 * their own CHECKs, keys, domains and non-deferrable foreign keys: a counted family's owner axis
 * among them, which is judged at the member's INSERT, so a case writes the owner first.
 */
import type { AnyRelation, DbConnection } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { assert } from "@effect/vitest";
import { Effect, Option, Predicate, Redacted, Schema } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { loginConnection } from "#pantry/db/connection.ts";

/**
 * The author login's PostgreSQL role, `<schema>__<login>`.
 */
const authorAppRole = "qti__author_app";

/**
 * The author role's PostgreSQL role, which is also the schema of its views.
 */
const authorRole = "qti__author";

/**
 * The PostgreSQL schema of `Qti`'s tables.
 */
const qtiSchema = "qti";

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
 * A session of the author login on the lease, over verify-full TLS against the cluster's CA, closed
 * with its scope: a direct SQL writer.
 */
export const loginSession = Effect.gen(function* loginSession() {
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
export const rowsOf = <R extends QueryResultRow>(
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
 * A row a direct writer inserts into one of `Qti`'s tables: its declared columns by name, a closed
 * id by its code.
 */
export type SqlRow = Readonly<Record<string, string | number | boolean>>;

/**
 * One row of a case, with its table and its hidden columns by the comment grizzle installs on each.
 */
export interface Insert {
  readonly hidden?: Readonly<Record<string, number>>;
  readonly row: SqlRow;
  readonly table: string;
}

/**
 * Read the columns of one of `Qti`'s tables a direct writer fills, with grizzle's comment on each:
 * every live column PostgreSQL does not generate, a family's hidden ones among them (README,
 * "Direct SQL access": a family's values are a direct writer's to fill).
 *
 * @param client - The session.
 * @param table - The table.
 * @returns The columns, in order, none for a table the schema does not hold.
 */
const writtenColumnsOf = (client: Client, table: string) =>
  rowsOf<{ readonly comment: string | null; readonly name: string }>(
    client,
    `SELECT a.attname AS name, pg_catalog.col_description(a.attrelid, a.attnum) AS comment
       FROM pg_catalog.pg_attribute a
      WHERE a.attrelid = pg_catalog.to_regclass($1) AND a.attnum > 0 AND NOT a.attisdropped
        AND a.attgenerated = ''
      ORDER BY a.attnum`,
    [`${qtiSchema}.${table}`],
  );

/**
 * Write one statement of a case: its row's value for each written column of its table, a declared
 * column by name and a hidden one by its comment.
 *
 * @param client - The session.
 * @param insert - The row and its table.
 * @returns The statement and its parameters; a column the row does not fill, or a field its table
 *   lacks, fails the case, since every written column is the case's to state.
 */
const statementOf = (client: Client, { hidden = {}, row, table }: Insert) =>
  Effect.gen(function* statement() {
    const columns = yield* writtenColumnsOf(client, table);
    assert.includeMembers(
      columns.map(({ name }) => name),
      Object.keys(row),
      `${table}: every field the row states is a column of its table`,
    );

    return {
      text: `INSERT INTO ${qtiSchema}.${table} (${columns.map(({ name }) => `"${name}"`).join(", ")}) VALUES (${columns
        .map((_, at) => `$${String(at + 1)}`)
        .join(", ")})`,
      values: columns.map(
        ({ comment, name }) =>
          row[name] ??
          hidden[comment ?? ""] ??
          assert.fail(`${table}: no value for ${name} (${comment ?? "a declared field"})`),
      ),
    };
  });

/**
 * Insert a case's rows, in order, as the author role, every deferrable foreign key deferred, then
 * set the given ones immediate, and roll back: the server's verdict on the rows by their own
 * CHECKs, keys, domains and non-deferrable foreign keys, and by those foreign keys.
 *
 * @param client - The session.
 * @param inserts - The rows, each with its table.
 * @param immediate - The deferrable foreign keys to check once the rows are in, by name.
 * @returns The server's error, or none when the rows' own laws and those keys accept them; fails
 *   with any other failure.
 */
export const judged = (
  client: Client,
  inserts: readonly Insert[],
  immediate: readonly string[] = [],
) =>
  Effect.gen(function* insertDeferred() {
    const statements = yield* Effect.all(inserts.map((insert) => statementOf(client, insert)));
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statementsInOrder() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      for (const { text, values } of statements) {
        yield* rowsOf(client, text, values);
      }

      for (const name of immediate) {
        yield* rowsOf(client, `SET CONSTRAINTS ${qtiSchema}."${name}" IMMEDIATE`);
      }
    }).pipe(
      Effect.as(Option.none<DatabaseError>()),
      Effect.catch((error) =>
        isServerError(error.cause) ? Effect.succeed(Option.some(error.cause)) : Effect.fail(error),
      ),
    );
    yield* rowsOf(client, "ROLLBACK");

    return outcome;
  });

/**
 * Assert a direct writer's verdict: refused with the SQLSTATE and the constraint named, or
 * accepted.
 *
 * @param verdict - The server's error, none for an accepted row.
 * @param constraint - The constraint the refusal names: PostgreSQL's spelling of a check's name,
 *   or a key's or foreign key's name as the catalog holds it.
 * @param refused - Whether the law refuses the rows.
 * @param label - The case, for a failure's message.
 * @param code - The SQLSTATE of the refusal: 23514, a CHECK's, unless the law is a key.
 */
export const assertVerdict = (
  verdict: Option.Option<DatabaseError>,
  constraint: string,
  refused: boolean,
  label: string,
  code = "23514",
): void => {
  const error = Option.getOrUndefined(verdict);
  if (refused) {
    assert.strictEqual(error?.code, code, `${label}: ${error?.message ?? "accepted"}`);
    assert.strictEqual(error?.constraint, constraint, label);
  } else {
    assert.isUndefined(error, `${label}: ${error?.message ?? ""}`);
  }
};

/**
 * A family member's hidden columns at a slot, by the comment grizzle installs on each: its index
 * and its copy of its owner's count.
 *
 * @param family - The family, `Owner.count`.
 * @param index - The member's slot.
 * @param count - The owner's count.
 * @returns The hidden values.
 */
export const familySlot = (family: string, index: number, count: number) => ({
  [`the index of the family ${family}`]: index,
  [`the owner's count of the family ${family}`]: count,
});

/**
 * The code of a handle in its roster, the value a direct writer stores in its closed-id column.
 *
 * @param handles - The roster's handles.
 * @param handle - The handle.
 * @returns Its code.
 */
export const codeOf = (handles: readonly string[], handle: string): number => {
  const code = handles.indexOf(handle);
  assert.isAtLeast(code, 0, `${handle} is a handle of its roster`);

  return code;
};

/**
 * A field of a relation as grizzle describes its column: a closed id's code over its roster's
 * handles, or a value stored as itself.
 */
const FieldSchema = Schema.Struct({
  column: Schema.Union([
    Schema.Struct({ handles: Schema.Array(Schema.String), kind: Schema.Literals(["code"]) }),
    Schema.Struct({ kind: Schema.String }),
  ]),
});

/**
 * A relation as grizzle declares it, its fields by name.
 */
const FieldsSchema = Schema.Struct({ fields: Schema.Record(Schema.String, FieldSchema) });

/**
 * A field's column name, as grizzle converts a declared name: its segments, split before each
 * capital that follows a lowercase letter or a digit, lowercased and joined by underscores. A
 * name this misses fails {@link judged}'s column check, never a statement.
 *
 * @param field - The field.
 * @returns The column.
 */
const columnOf = (field: string): string =>
  field.replaceAll(/(?<before>[\da-z])(?<capital>[A-Z])/gu, "$<before>_$<capital>").toLowerCase();

/**
 * A fact of a relation as a direct writer's row: each field under its column, a closed id by its
 * code in its roster, a natural as its decimal text and a boolean or a text as itself.
 *
 * @param relation - The relation.
 * @param fact - The fact, every field the table's row holds.
 * @returns The row.
 */
export const sqlRowOf = (
  relation: AnyRelation,
  fact: Readonly<Record<string, string | bigint | boolean>>,
): SqlRow => {
  const { fields } = Schema.decodeUnknownSync(FieldsSchema)(relation);

  return Object.fromEntries(
    Object.entries(fact).map(([field, value]): readonly [string, string | number | boolean] => {
      const column = fields[field]?.column;
      if (column !== undefined && "handles" in column && Predicate.isString(value)) {
        return [columnOf(field), codeOf(column.handles, value)];
      }

      return [columnOf(field), Predicate.isBigInt(value) ? String(value) : value];
    }),
  );
};
