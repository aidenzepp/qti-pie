/**
 * A direct SQL writer for the database suites (grizzle's README, "Direct SQL access"; the rules
 * file's rule 8): the author login, `SET ROLE` to the author role, SERIALIZABLE, every deferrable
 * foreign key deferred, each run of one table's rows inserted as one statement with every column a
 * writer fills, the hidden ones among them by the comment grizzle installs on each, and a rollback.
 * A role writes a table, never its own view of it, which it holds SELECT on alone (README,
 * "Security model"). So a case's verdict is the server's judgment of its rows by their own CHECKs,
 * keys, domains and non-deferrable foreign keys: a family's owner axis among them where grizzle
 * does not defer it, judged at the end of the member's INSERT, so the writer sends the owner first.
 * An owner axis grizzle defers is judged only where a case sets it immediate.
 */
import { roleNameOf, schemaNameOf } from "@bjornpagen/grizzle";
import type { AnyRelation, DbConnection } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { assert } from "@effect/vitest";
import { Array as Arr, Effect, Match, Option, Predicate, Redacted, Schema } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { loginConnection } from "#pantry/db/connection.ts";
import { Qti, QtiBase } from "#pantry/qti/own.ts";
import { Author, AuthorApp } from "#pantry/qti/own-login.ts";

/**
 * The author login's PostgreSQL role, the one its session logs in as.
 */
const authorAppRole = roleNameOf(AuthorApp);

/**
 * The author role's PostgreSQL role, the one a direct writer's `SET ROLE` names, which holds
 * SELECT, INSERT and DELETE on every table of `Qti` it writes whole, every stored relation's
 * (grizzle's README, "Exactly what a role holds").
 */
export const authorRole = roleNameOf(Author);

/**
 * The author role's own PostgreSQL schema, which holds a view of each of its relations.
 */
export const authorViews = schemaNameOf(Author);

/**
 * The PostgreSQL schema of `Qti`'s tables, its stored level's (`#pantry/qti/base.ts`): grizzle
 * installs each level in a schema of its own, and every table is the stored level's.
 */
export const qtiSchema = schemaNameOf(QtiBase);

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
  const connection = (yield* loginConnection)(AuthorApp);
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
export const isServerError = (error: unknown): error is DatabaseError =>
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
export const writtenColumnsOf = (client: Client, table: string) =>
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
 * The constraints of one of `Qti`'s tables whose comment matches a `LIKE` pattern: keys or
 * foreign keys, which grizzle names by a digest and describes by its comment.
 *
 * @param client - The session.
 * @param table - The table.
 * @param pattern - The comment's pattern.
 * @returns The constraints' names.
 */
export const constraintsDescribed = (client: Client, table: string, pattern: string) =>
  rowsOf<{ readonly conname: string }>(
    client,
    `SELECT c.conname FROM pg_catalog.pg_constraint c
      WHERE c.conrelid = pg_catalog.to_regclass($1)
        AND pg_catalog.obj_description(c.oid, 'pg_constraint') LIKE $2`,
    [`${qtiSchema}.${table}`, pattern],
  ).pipe(Effect.map((rows) => rows.map(({ conname }) => conname)));

/**
 * The one constraint of one of `Qti`'s tables whose comment matches a `LIKE` pattern
 * ({@link constraintsDescribed}).
 *
 * @param client - The session.
 * @param table - The table.
 * @param pattern - The comment's pattern.
 * @returns The constraint's name; none or several fail the case.
 */
export const constraintDescribed = (client: Client, table: string, pattern: string) =>
  constraintsDescribed(client, table, pattern).pipe(
    Effect.map((names) => {
      assert.lengthOf(names, 1, `${table}: one constraint described ${pattern}`);

      return names[0] ?? "";
    }),
  );

/**
 * The foreign keys from one of `Qti`'s tables into another, by constraint name, read from the
 * catalogue: the constraints the containments between the two relations install.
 *
 * @param client - The session, before `SET ROLE`.
 * @param from - The referencing table.
 * @param to - The referenced table.
 * @returns The constraint names.
 */
export const foreignKeysBetween = (client: Client, from: string, to: string) =>
  rowsOf<{ readonly conname: string }>(
    client,
    `SELECT con.conname FROM pg_constraint con
       JOIN pg_class src ON src.oid = con.conrelid
       JOIN pg_class dst ON dst.oid = con.confrelid
       JOIN pg_namespace n ON n.oid = src.relnamespace
      WHERE con.contype = 'f' AND n.nspname = $1 AND src.relname = $2 AND dst.relname = $3`,
    [qtiSchema, from, to],
  ).pipe(Effect.map((rows) => rows.map(({ conname }) => conname)));

/**
 * Read the CHECKs of one of `Qti`'s tables, each with its definition and grizzle's comment, the
 * folds' among them.
 *
 * @param client - The session.
 * @param table - The table.
 * @returns The CHECKs.
 */
const checksOf = (client: Client, table: string) =>
  rowsOf<{ readonly comment: string | null; readonly definition: string }>(
    client,
    `SELECT pg_catalog.pg_get_constraintdef(c.oid) AS definition,
            pg_catalog.obj_description(c.oid, 'pg_constraint') AS comment
       FROM pg_catalog.pg_constraint c
      WHERE c.conrelid = pg_catalog.to_regclass($1) AND c.contype = 'c'`,
    [`${qtiSchema}.${table}`],
  );

/**
 * The key a case's hidden value for a column is held under: grizzle's comment on the column, except
 * that a fold's accumulator names its fold by its end, `Owner.field`, where grizzle names it by a
 * digest no case can know. The end is read off the one fold CHECK whose definition reads the
 * accumulator: its comment ends `into Owner(…, field)`.
 *
 * This reads grizzle's physical naming, which it exports no other way, as the vendored engine at
 * 72f7d03 writes it (`packages/engine/src`):
 *
 * - The accumulator's comment, `the accumulator <side> plane <n> of the fold <law> over the family
 *   <Owner>.<count>`, is `core/identity.ts:807`. `<law>` is the fold law's hashed identifier,
 *   minted by `law` at `core/identity.ts:949`.
 * - The fold CHECK's comment, `check of <Relation> for law <display>`, is `core/identity.ts:867`. The
 *   display, `<monoid> fold over <family> of <step> into <end>`, is
 *   `analysis/theory/theory.ts:308`.
 * - The CHECK's definition reads the accumulator's column by name.
 *
 * A repin that changes any of these fails a case here ("the one fold CHECK that reads it"), and
 * the guard's catalogue search states the shapes.
 *
 * @param columns - The table's written columns, each with its comment.
 * @param checks - The table's CHECKs, each with its definition and comment.
 * @returns Each column, in order, with its key; a declared field's is its comment or its name.
 */
export const columnKeys = (
  columns: readonly { readonly comment: string | null; readonly name: string }[],
  checks: readonly { readonly comment: string | null; readonly definition: string }[],
): readonly { readonly key: string; readonly name: string }[] =>
  columns.map(({ comment, name }) => {
    const accumulator =
      /^(?<side>the accumulator (?:before|after) plane \d+ of the fold) \S+ (?<family>over the family \S+)$/u.exec(
        comment ?? "",
      )?.groups;
    if (accumulator === undefined) {
      return { key: comment ?? name, name };
    }

    const ends = checks.flatMap(({ comment: law, definition }) => {
      const end =
        /^check of \S+ for law \S+ fold over .* into (?<owner>[A-Z][\dA-Za-z]*)\((?:[^()]*, )?(?<field>[\dA-Za-z]+)\)$/u.exec(
          law ?? "",
        )?.groups;

      return end !== undefined && definition.includes(name)
        ? [`${end["owner"] ?? ""}.${end["field"] ?? ""}`]
        : [];
    });
    assert.lengthOf(ends, 1, `${name} (${comment ?? ""}): the one fold CHECK that reads it`);

    return {
      key: `${accumulator["side"] ?? ""} ${ends[0] ?? ""} ${accumulator["family"] ?? ""}`,
      name,
    };
  });

/**
 * PostgreSQL's bound on one statement's parameters (the wire protocol's 16-bit count).
 */
const parameterBound = 65_535;

/**
 * Write one statement of a case, a run of rows of one table: each row's value for each written
 * column, a declared column by name and a hidden one by its key ({@link columnKeys}), every value a
 * parameter.
 *
 * @param client - The session.
 * @param run - The rows, all of one table.
 * @returns The statement and its parameters; a column a row does not fill, or a field its table
 *   lacks, fails the case, since every written column is the case's to state.
 */
const statementOf = (client: Client, run: Arr.NonEmptyReadonlyArray<Insert>) =>
  Effect.gen(function* statement() {
    const [{ table }] = run;
    const columns = columnKeys(
      yield* writtenColumnsOf(client, table),
      yield* checksOf(client, table),
    );
    for (const { row } of run) {
      assert.includeMembers(
        columns.map(({ name }) => name),
        Object.keys(row),
        `${table}: every field the row states is a column of its table`,
      );
    }

    assert.isAtMost(
      run.length * columns.length,
      parameterBound,
      `${table}: ${String(run.length)} rows of ${String(columns.length)} columns, within PostgreSQL's bound on one statement's parameters`,
    );

    return {
      text: `INSERT INTO ${qtiSchema}.${table} (${columns.map(({ name }) => `"${name}"`).join(", ")}) VALUES ${run
        .map(
          (_, row) =>
            `(${columns.map((_column, at) => `$${String(row * columns.length + at + 1)}`).join(", ")})`,
        )
        .join(", ")}`,
      values: run.flatMap(({ hidden = {}, row }) =>
        columns.map(
          ({ key, name }) =>
            row[name] ?? hidden[key] ?? assert.fail(`${table}: no value for ${name} (${key})`),
        ),
      ),
    };
  });

/**
 * A statement a case reads its rows back by, through the author role's views, once they are in and
 * before the rollback: a generated column's value, say.
 */
export interface Read {
  readonly text: string;
  readonly values: readonly unknown[];
}

/**
 * A stored row a case removes before it writes, by its key's columns: the row a variant of it
 * replaces.
 */
export interface Removal {
  readonly key: Readonly<Record<string, string | number | boolean>>;
  readonly table: string;
}

/**
 * One case of a direct writer: the stored rows it removes, the rows it writes, the deferrable
 * foreign keys it sets immediate once they are in, by name, and the statements it reads back. A
 * case that removes, sets or reads nothing states none.
 */
export interface Case {
  readonly immediate?: readonly string[];
  readonly inserts: readonly Insert[];
  readonly reads?: readonly Read[];
  readonly removed?: readonly Removal[];
}

/**
 * Judge a case as the author role, every deferrable foreign key deferred: remove its stored rows,
 * insert its rows in order, set its foreign keys immediate, read what it reads, and roll back. The
 * verdict is the server's on the rows by their own CHECKs, keys, domains and non-deferrable foreign
 * keys, and by those foreign keys, with the rows each read returns. Each run of one table's rows is
 * one statement, whose non-deferrable foreign keys PostgreSQL judges at its end, so the rows of a
 * run may come in any order among themselves (a tree's successor before its predecessor among
 * them).
 *
 * @param client - The session.
 * @param of - The case.
 * @returns The server's error, or none when the rows' own laws and those keys accept them, and each
 *   read's rows, none where the server refused; fails with any other failure.
 */
export const judgedCase = (
  client: Client,
  { immediate = [], inserts, reads = [], removed = [] }: Case,
) =>
  Effect.gen(function* insertDeferred() {
    const runs = Arr.isReadonlyArrayNonEmpty(inserts)
      ? Arr.groupWith(inserts, (left, right) => left.table === right.table)
      : [];
    const statements = yield* Effect.all(runs.map((run) => statementOf(client, run)));
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statementsInOrder() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      for (const { key, table } of removed) {
        const columns = Object.keys(key);
        yield* rowsOf(
          client,
          `DELETE FROM ${qtiSchema}.${table} WHERE ${columns.map((name, at) => `"${name}" = $${String(at + 1)}`).join(" AND ")}`,
          Object.values(key),
        );
      }

      for (const { text, values } of statements) {
        yield* rowsOf(client, text, values);
      }

      for (const name of immediate) {
        yield* rowsOf(client, `SET CONSTRAINTS ${qtiSchema}."${name}" IMMEDIATE`);
      }

      return yield* Effect.all(reads.map(({ text, values }) => rowsOf(client, text, values)));
    }).pipe(
      Effect.map((read) => ({ read, refused: Option.none<DatabaseError>() })),
      Effect.catch((error) =>
        isServerError(error.cause)
          ? Effect.succeed({ read: [], refused: Option.some(error.cause) })
          : Effect.fail(error),
      ),
    );
    yield* rowsOf(client, "ROLLBACK");

    return outcome;
  });

/**
 * The verdict of a case that removes and reads nothing ({@link judgedCase}).
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
) => judgedCase(client, { immediate, inserts }).pipe(Effect.map(({ refused }) => refused));

/**
 * Assert a direct writer's verdict: refused with the SQLSTATE and the constraint named, or
 * accepted.
 *
 * @param verdict - The server's error, none for an accepted row.
 * @param constraint - The constraint the refusal names: a row check's installed name, as
 *   `#pantry/test/judged-laws.ts` `checkConstraintOf` derives it, or a key's or foreign key's name
 *   as the catalog holds it.
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
 * Each relation's fields as grizzle describes their columns, read once a row of it is written.
 */
const fieldsOf = new WeakMap<AnyRelation, typeof FieldsSchema.Type.fields>();

/**
 * A fact of a relation as a direct writer's row: each field under its column, a closed id by its
 * code in its roster, a natural as its decimal text and a boolean or a text as itself. A value
 * already a code, or a field already a column's name, passes as it is.
 *
 * @param relation - The relation.
 * @param fact - The fact, every field the table's row holds.
 * @returns The row.
 */
export const sqlRowOf = (
  relation: AnyRelation,
  fact: Readonly<Record<string, string | number | bigint | boolean>>,
): SqlRow => {
  const fields = fieldsOf.get(relation) ?? Schema.decodeUnknownSync(FieldsSchema)(relation).fields;
  fieldsOf.set(relation, fields);

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

/**
 * A side of a family statement as grizzle keeps it: its member relation and the terms it names.
 */
const FamilySideSchema = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({ relation: Schema.Struct({ name: Schema.String }) }),
    Schema.Struct({ name: Schema.String }),
  ]),
  terms: Schema.Array(Schema.Unknown),
});

/**
 * A family as grizzle keeps it: its member side, and its owner and count. A tree's family is its
 * relation's rows below each root, each a member of its parent's.
 */
const FamilySchema = Schema.Struct({
  family: FamilySideSchema,
  kind: Schema.Literals(["counted", "ordered", "tree"]),
  slots: Schema.Struct({
    count: Schema.String,
    owner: Schema.Struct({ name: Schema.String, primaryKey: Schema.Array(Schema.String) }),
  }),
});

/**
 * A value a fact or a closed row holds, as a selection reads it.
 */
type Scalar = string | number | bigint | boolean;

/**
 * A {@link Scalar}.
 */
const ScalarSchema = Schema.Union([Schema.String, Schema.Number, Schema.BigInt, Schema.Boolean]);

/**
 * A comparison a selection makes.
 */
type Comparison = "eq" | "ne" | "lt" | "le" | "gt" | "ge";

/**
 * A selection's predicate as grizzle keeps it, of the shapes the selections of `Qti`'s hidden
 * folds are built of.
 */
type Expression =
  | { readonly args: readonly Expression[]; readonly kind: "and" }
  | { readonly args: readonly Expression[]; readonly kind: "or" }
  | { readonly arg: Expression; readonly kind: "not" }
  | { readonly arg: Expression; readonly kind: "in"; readonly values: readonly Scalar[] }
  | {
      readonly kind: "compare";
      readonly left: Expression;
      readonly op: Comparison;
      readonly right: Expression;
    }
  | { readonly field: string; readonly kind: "field" }
  | { readonly kind: "literal"; readonly value: Scalar }
  | {
      readonly args: readonly Expression[];
      readonly field: string;
      readonly kind: "closedAt";
      readonly relation: string;
    }
  | { readonly args: readonly Expression[]; readonly kind: "closedHas"; readonly relation: string };

/**
 * An {@link Expression}.
 */
const ExpressionSchema: Schema.Codec<Expression> = Schema.Union([
  Schema.Struct({
    args: Schema.Array(Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema)),
    kind: Schema.Literals(["and"]),
  }),
  Schema.Struct({
    args: Schema.Array(Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema)),
    kind: Schema.Literals(["or"]),
  }),
  Schema.Struct({
    arg: Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema),
    kind: Schema.Literals(["not"]),
  }),
  Schema.Struct({
    arg: Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema),
    kind: Schema.Literals(["in"]),
    values: Schema.Array(ScalarSchema),
  }),
  Schema.Struct({
    kind: Schema.Literals(["compare"]),
    left: Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema),
    op: Schema.Literals(["eq", "ne", "lt", "le", "gt", "ge"]),
    right: Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema),
  }),
  Schema.Struct({ field: Schema.String, kind: Schema.Literals(["field"]) }),
  Schema.Struct({ kind: Schema.Literals(["literal"]), value: ScalarSchema }),
  Schema.Struct({
    args: Schema.Array(Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema)),
    field: Schema.String,
    kind: Schema.Literals(["closedAt"]),
    relation: Schema.String,
  }),
  Schema.Struct({
    args: Schema.Array(Schema.suspend((): Schema.Codec<Expression> => ExpressionSchema)),
    kind: Schema.Literals(["closedHas"]),
    relation: Schema.String,
  }),
]);

/**
 * A count fold whose accumulators grizzle hides, as it keeps it: its step names its family's
 * owner terms alone, so each member steps by one where the step's selection holds it, or always
 * where the step is the member relation itself; its end is the owner's field. A selection of
 * another shape reads as no such fold, so a case states its accumulators as hidden values.
 */
const HiddenFoldSchema = Schema.Struct({
  end: Schema.Struct({ terms: Schema.NonEmptyArray(Schema.String) }),
  family: Schema.Struct({
    slots: Schema.Struct({ count: Schema.String, owner: Schema.Struct({ name: Schema.String }) }),
  }),
  kind: Schema.Literals(["fold"]),
  monoid: Schema.Struct({ name: Schema.Literals(["count"]) }),
  step: Schema.Struct({
    source: Schema.Union([
      Schema.Struct({ desc: Schema.Struct({ predicate: ExpressionSchema }) }),
      Schema.Struct({ name: Schema.String }),
    ]),
    terms: Schema.Array(Schema.String),
  }),
});

/**
 * A closed relation as grizzle declares it: its key's fields and its rows.
 */
const ClosedSchema = Schema.Struct({
  key: Schema.Array(Schema.String),
  kind: Schema.Literals(["closedRelation"]),
  rows: Schema.Array(Schema.Record(Schema.String, Schema.Unknown)),
});

/**
 * A containment as grizzle keeps it, both sides by relation and terms.
 */
const ContainmentSchema = Schema.Struct({
  kind: Schema.Literals(["contained"]),
  left: FamilySideSchema,
  right: FamilySideSchema,
});

/**
 * A relation as its statements name it.
 *
 * @param side - The side.
 * @returns The relation's name.
 */
const sideRelation = (side: typeof FamilySideSchema.Type): string =>
  "relation" in side.source ? side.source.relation.name : side.source.name;

/**
 * A side's field terms, a `pred` term as no field.
 *
 * @param side - The side.
 * @returns The fields, in order.
 */
const sideFields = (side: typeof FamilySideSchema.Type): readonly string[] =>
  side.terms.filter(Predicate.isString);

/**
 * `Qti`'s families, each as a member writes its hidden slots: the member relation, the member's
 * fields that name its owner, its slot (a counted family's is hidden, an ordered family's or a
 * tree's is its own last term, `at`), and the owner, its key and its count.
 */
const families = Qti.statements.flatMap((statement) =>
  Option.match(Schema.decodeUnknownOption(FamilySchema)(statement), {
    onNone: () => [],
    onSome: ({ family, kind, slots }) => {
      const fields = sideFields(family);

      return [
        {
          count: slots.count,
          kind,
          label: `${slots.owner.name}.${slots.count}`,
          member: sideRelation(family),
          owner: slots.owner.name,
          ownerKey: slots.owner.primaryKey,
          ownerTerms: kind === "counted" ? fields : fields.slice(0, -1),
          slot: kind === "counted" ? Option.none() : Option.fromNullishOr(fields.at(-1)),
        },
      ];
    },
  }),
);

/**
 * One of `Qti`'s families.
 */
type Family = (typeof families)[number];

/**
 * Whether a fact is a member of its relation's family: every fact of a counted or ordered family,
 * and a tree's every row below its roots, whose `start` grizzle draws above 0 (its φ₀).
 *
 * @param family - The family.
 * @param fact - The fact.
 * @returns Whether it is a member.
 */
const isMember = (family: Family, fact: Stated["fact"]): boolean =>
  family.kind !== "tree" || Number(fact["start"]) > 0;

/**
 * The key a case's hidden value for a fold's accumulator is held under ({@link columnKeys}).
 *
 * @param side - The accumulator: the fold's value before the member's step, or after it.
 * @param fold - The fold, by its end, `Owner.field`.
 * @param family - The family it folds over, `Owner.count`.
 * @returns The key.
 */
export const accumulatorOf = (side: "before" | "after", fold: string, family: string): string =>
  `the accumulator ${side} plane 0 of the fold ${fold} over the family ${family}`;

/**
 * `Qti`'s count folds whose accumulators are hidden, each over one of {@link families}: its end, the
 * owner's field, and its step's selection, none where every member steps.
 */
const hiddenFolds = Qti.statements.flatMap((statement) =>
  Option.match(Schema.decodeUnknownOption(HiddenFoldSchema)(statement), {
    onNone: () => [],
    onSome: ({ end, family, step }) => {
      const over = families.find(
        ({ label }) => label === `${family.slots.owner.name}.${family.slots.count}`,
      );
      const field = Arr.lastNonEmpty(end.terms);

      return over === undefined || step.terms.length !== over.ownerTerms.length
        ? []
        : [
            {
              end: field,
              family: over,
              label: `${over.owner}.${field}`,
              selection:
                "desc" in step.source ? Option.some(step.source.desc.predicate) : Option.none(),
            },
          ];
    },
  }),
);

/**
 * /**
 * `Qti`'s closed relations' rows, each by the text of its key and holding its values by field, read
 * once a selection reads one.
 */
const closedIndexes = new Map<string, ReadonlyMap<string, ReadonlyMap<string, Scalar>>>();

/**
 * Read a closed relation's rows by the text of their key, building its index once.
 *
 * @param relation - The closed relation's name.
 * @returns Each row's values by field, by the text of its key.
 */
const closedIndexOf = (relation: string): ReadonlyMap<string, ReadonlyMap<string, Scalar>> =>
  closedIndexes.get(relation) ??
  Option.match(
    Schema.decodeUnknownOption(ClosedSchema)(
      Object.values(Qti.relations).find(({ name }) => name === relation),
    ),
    {
      onNone: () =>
        assert.fail(`A selection reads ${relation}, which is no closed relation of Qti's.`),
      onSome: ({ key, rows }) => {
        const built = new Map(
          rows.map((row) => [
            key.map((name) => String(row[name])).join("\u0000"),
            new Map(
              Object.entries(row).flatMap(([name, value]) =>
                Option.match(Schema.decodeUnknownOption(ScalarSchema)(value), {
                  onNone: () => [],
                  onSome: (scalar) => [[name, scalar] as const],
                }),
              ),
            ),
          ]),
        );
        closedIndexes.set(relation, built);

        return built;
      },
    },
  );

/**
 * Read one field of the row of a closed relation at a key, as a selection's `closedAt` reads it.
 *
 * @param relation - The closed relation's name.
 * @param args - The key's values, in its fields' order.
 * @param field - The field.
 * @returns The row's value.
 */
const closedAt = (relation: string, args: readonly Scalar[], field: string): Scalar =>
  closedIndexOf(relation).get(args.map(String).join("\u0000"))?.get(field) ??
  assert.fail(`${relation} holds no value of ${field} at (${args.map(String).join(", ")}).`);

/**
 * Whether a closed relation holds a row at a key, as a selection's `closedHas` reads it.
 *
 * @param relation - The closed relation's name.
 * @param args - The key's values, in its fields' order.
 * @returns Whether it does.
 */
const closedHas = (relation: string, args: readonly Scalar[]): boolean =>
  closedIndexOf(relation).has(args.map(String).join("\u0000"));

/**
 * A value as a selection compares it: a number as the natural it is.
 *
 * @param value - The value.
 * @returns The value compared.
 */
const ordinalOf = (value: Scalar): Scalar => (Predicate.isNumber(value) ? BigInt(value) : value);

/**
 * Compare two values as a selection's `compare` does: equality over any values, order over
 * naturals.
 *
 * @param op - The comparison.
 * @param left - The left value.
 * @param right - The right value.
 * @returns Whether the comparison holds.
 */
const compared = (op: Comparison, left: Scalar, right: Scalar): boolean => {
  const [low, high] = [ordinalOf(left), ordinalOf(right)];
  if (op === "eq" || op === "ne") {
    return (low === high) === (op === "eq");
  }

  if (!Predicate.isBigInt(low) || !Predicate.isBigInt(high)) {
    return assert.fail(
      `A selection orders ${String(low)} and ${String(high)}, which are no naturals.`,
    );
  }

  return { ge: low >= high, gt: low > high, le: low <= high, lt: low < high }[op];
};

/**
 * Evaluate a selection's predicate over a fact, as PostgreSQL evaluates the CHECK grizzle compiles
 * it to: its fields read off the fact, a closed id as its handle, and a closed relation's field at
 * a key read off the relation's rows.
 *
 * @param expression - The predicate, or one of its operands.
 * @param fact - The fact, every field the predicate reads among its own.
 * @returns The value.
 */
const valueOf = (expression: Expression, fact: Stated["fact"]): Scalar =>
  Match.value(expression).pipe(
    Match.discriminatorsExhaustive("kind")({
      and: ({ args }) => args.every((arg) => valueOf(arg, fact) === true),
      closedAt: ({ args, field, relation }) =>
        closedAt(
          relation,
          args.map((arg) => valueOf(arg, fact)),
          field,
        ),
      closedHas: ({ args, relation }) =>
        closedHas(
          relation,
          args.map((arg) => valueOf(arg, fact)),
        ),
      compare: ({ left, op, right }) => compared(op, valueOf(left, fact), valueOf(right, fact)),
      field: ({ field }) =>
        fact[field] ?? assert.fail(`A selection reads ${field}, which the fact does not state.`),
      in: ({ arg, values }) => {
        const value = ordinalOf(valueOf(arg, fact));

        return values.some((held) => ordinalOf(held) === value);
      },
      literal: ({ value }) => value,
      not: ({ arg }) => valueOf(arg, fact) !== true,
      or: ({ args }) => args.some((arg) => valueOf(arg, fact) === true),
    }),
  );

/**
 * Record that one relation's rows are written after another's, unless they are one relation.
 *
 * @param into - The map, by the later relation.
 * @param from - The later relation.
 * @param to - The earlier one.
 */
const addAfter = (into: Map<string, Set<string>>, from: string, to: string): void => {
  if (from !== to) {
    into.set(from, (into.get(from) ?? new Set()).add(to));
  }
};

/**
 * The relations each relation's row is written after, where both are stated: by its owner axes, its
 * families' owners (`owners`, which PostgreSQL judges at the member's INSERT where grizzle does not
 * defer them, so no order may break one); and by its containments over every field of their targets
 * (`covered`, which grizzle installs at the statement unless a cycle defers them, so they order
 * where they can).
 */
const writtenAfter = (() => {
  const owners = new Map<string, Set<string>>();
  const covered = new Map<string, Set<string>>();
  for (const { member, owner } of families) {
    addAfter(owners, member, owner);
  }

  for (const statement of Qti.statements) {
    Option.map(Schema.decodeUnknownOption(ContainmentSchema)(statement), ({ left, right }) => {
      addAfter(covered, sideRelation(left), sideRelation(right));
    });
  }

  return { covered, owners } as const;
})();

/**
 * A fact a case states, of its relation: the writer derives its table, the order it is written
 * in, its families' hidden slots and its hidden folds' accumulators, so a case states rows and
 * never their order, slots or accumulators. `hidden` overrides a derived value, for the breach of
 * a hidden value itself, or one the writer cannot derive (no owner stated, a fold it does not
 * fold).
 */
export interface Stated {
  readonly fact: Readonly<Record<string, Scalar>>;
  readonly hidden?: Readonly<Record<string, number>>;
  readonly relation: AnyRelation & { readonly name: string };
}

/**
 * A relation's table, as grizzle converts a declared name: the table a direct writer writes a
 * relation's rows to, and a case reads a constraint of it from.
 *
 * @param relation - The relation's name.
 * @returns The table.
 */
export const tableOf = (relation: string): string => columnOf(relation);

/**
 * The text of a fact's values at some fields, the key a family groups its members by.
 *
 * @param fact - The fact.
 * @param fields - The fields.
 * @returns The key text.
 */
const keyAt = (fact: Stated["fact"], fields: readonly string[]): string =>
  fields.map((field) => String(fact[field])).join("\u0000");

/**
 * A side of a containment a writer copies values across: a relation, or a selection of it by a
 * predicate the writer reads. A selection of another shape reads as no such side, so the writer
 * copies across no containment of it.
 */
const CopySideSchema = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({
      desc: Schema.Struct({ predicate: ExpressionSchema }),
      relation: Schema.Struct({ name: Schema.String }),
    }),
    Schema.Struct({ name: Schema.String }),
  ]),
  terms: Schema.Array(Schema.Unknown),
});

/**
 * A containment as a writer copies values across it, both sides by relation and terms.
 */
const CopySchema = Schema.Struct({
  kind: Schema.Literals(["contained"]),
  left: CopySideSchema,
  right: CopySideSchema,
});

/**
 * A relation's name and its primary key's fields, as grizzle declares it.
 */
const KeyedSchema = Schema.Struct({ name: Schema.String, primaryKey: Schema.Array(Schema.String) });

/**
 * `Qti`'s stored relations' primary keys, by relation.
 */
const primaryKeys: ReadonlyMap<string, readonly string[]> = new Map(
  Object.values(Qti.relations).flatMap((relation) =>
    Option.match(Schema.decodeUnknownOption(KeyedSchema)(relation), {
      onNone: () => [],
      onSome: ({ name, primaryKey }) => [[name, primaryKey] as const],
    }),
  ),
);

/**
 * A side as a writer copies across it: its relation, and the selection that holds its rows.
 *
 * @param side - The side, as grizzle keeps it.
 * @returns Its relation and selection.
 */
const copySideOf = (side: typeof CopySideSchema.Type) =>
  "desc" in side.source
    ? { relation: side.source.relation.name, selection: Option.some(side.source.desc.predicate) }
    : { relation: side.source.name, selection: Option.none() };

/**
 * `Qti`'s containments a writer copies values across: each whose right side names its relation's
 * whole primary key, so a row of the left matches at most one of the right. A containment holds a
 * matched pair's other fields equal, so a value either side states is the other side's: a tree
 * member's copies of its parent's (T3), an attribute's of its element's, a document node's of its
 * `Document` row's, a site's of its include's.
 */
const copies = Qti.statements.flatMap((statement) =>
  Option.match(Schema.decodeUnknownOption(CopySchema)(statement), {
    onNone: () => [],
    onSome: ({ left, right }) => {
      const pairs = left.terms.flatMap((term, at) => {
        const other = right.terms[at];

        return Predicate.isString(term) && Predicate.isString(other)
          ? [[term, other] as const]
          : [];
      });
      const to = copySideOf(right);
      const key = primaryKeys.get(to.relation) ?? [];
      const keyPairs = key.flatMap((field) => pairs.filter(([, other]) => other === field));

      return key.length === 0 ||
        keyPairs.length !== key.length ||
        left.terms.length !== right.terms.length
        ? []
        : [
            {
              from: copySideOf(left),
              key: keyPairs,
              to,
              values: pairs.filter(([, other]) => !key.includes(other)),
            },
          ];
    },
  }),
);

/**
 * The fields a selection's predicate reads.
 *
 * @param expression - The predicate, or one of its operands.
 * @returns The fields.
 */
const fieldsRead = (expression: Expression): readonly string[] =>
  Match.value(expression).pipe(
    Match.discriminatorsExhaustive("kind")({
      and: ({ args }) => args.flatMap(fieldsRead),
      closedAt: ({ args }) => args.flatMap(fieldsRead),
      closedHas: ({ args }) => args.flatMap(fieldsRead),
      compare: ({ left, right }) => [...fieldsRead(left), ...fieldsRead(right)],
      field: ({ field }) => [field],
      in: ({ arg }) => fieldsRead(arg),
      literal: () => [],
      not: ({ arg }) => fieldsRead(arg),
      or: ({ args }) => args.flatMap(fieldsRead),
    }),
  );

/**
 * Whether a side's selection holds a fact: every fact of an unselected relation, and of a
 * selection a fact stating every field its predicate reads, where the predicate holds.
 *
 * @param side - The side.
 * @param side.selection - Its selection's predicate, none for the relation itself.
 * @param fact - The fact.
 * @returns Whether it does.
 */
const selects = (
  { selection }: { readonly selection: Option.Option<Expression> },
  fact: Stated["fact"],
): boolean =>
  Option.match(selection, {
    onNone: () => true,
    onSome: (predicate) =>
      fieldsRead(predicate).every((field) => fact[field] !== undefined) &&
      valueOf(predicate, fact) === true,
  });

/**
 * Each fact with the values its containments copy filled where it states none: across each of
 * {@link copies}, a left fact its side's selection holds and the one right fact its key fields
 * name hold each further pair equal, so a value one of them states fills the other's. It repeats
 * until no value moves, so a value runs down a tree from its root, a root's from its `Document`
 * row's.
 *
 * The right fact is the one the key names, whatever the right side's selection reads: the key is
 * its relation's primary key, so it names one row, and the containment holds that row in the
 * selection. A target that fixes fields beyond its terms, the document node `Document` copies into
 * (`#pantry/qti/chardata.ts`, its `governor`, `kind`, `parentKind`, `start` and `document`), says
 * those of the row it names and never picks among rows, so a fact that leaves them unstated takes
 * its copies as one that states them does.
 *
 * @param stated - The facts.
 * @returns The facts, each with its copied values.
 */
const copiedOf = (stated: readonly Stated[]): readonly Stated[] => {
  const facts = stated.map(({ fact }) => ({ ...fact }));
  const names = new Set(stated.map(({ relation }) => relation.name));
  const across = copies.filter(
    ({ from, to }) => names.has(from.relation) && names.has(to.relation),
  );
  const factsOf = (relation: string) =>
    facts.filter((_, at) => stated[at]?.relation.name === relation);
  const copyOnce = () =>
    across.flatMap(({ from, key, to, values }) => {
      const targets = new Map(
        factsOf(to.relation).map((fact) => [
          keyAt(
            fact,
            key.map(([, field]) => field),
          ),
          fact,
        ]),
      );

      return factsOf(from.relation)
        .filter((fact) => selects(from, fact))
        .flatMap((fact) => {
          const fields = key.map(([field]) => field);
          const target = fields.every((field) => fact[field] !== undefined)
            ? targets.get(keyAt(fact, fields))
            : undefined;

          return target === undefined
            ? []
            : values.flatMap(([field, other]) => {
                const [here, there] = [fact[field], target[other]];
                if (here === undefined && there !== undefined) {
                  fact[field] = there;

                  return [field];
                }

                if (there === undefined && here !== undefined) {
                  target[other] = here;

                  return [other];
                }

                return [];
              });
        });
    });
  while (copyOnce().length > 0) {
    // Each pass fills at least one value a pass before left empty, so the loop ends.
  }

  return stated.map((held, at) => ({ ...held, fact: facts[at] ?? held.fact }));
};

/**
 * Each fact with every value the writer derives for it stated: in the stated order,
 *
 * - Each value a containment copies where the fact states none ({@link copiedOf});
 * - Each owner with its families' counts and its hidden folds' ends, where it states none: the
 *   members stated under it, and the steps they make;
 * - Each member with its families' hidden slots: its index, its place among its owner's stated
 *   members (a counted family's; an ordered one's and a tree's is its own `at`), its copy, its
 *   owner's count, and a tree member's parent's start; a tree's root is its own parent;
 * - Each member with its hidden folds' accumulators: before, the steps of its owner's members at
 *   slots below its own, and after, that with its own step, one where the fold's selection holds
 *   it.
 *
 * Its own `hidden` overrides any of them. A corruption that edits these facts moves the fields it
 * names and nothing the writer derived from the lawful ones, as a writer that sets one wrong field
 * of a row the program filled does.
 *
 * @param given - The facts.
 * @returns The facts, each with its derived values.
 */
export const pinned = (given: readonly Stated[]): readonly Stated[] => {
  const stated = copiedOf(given);
  const membersOf = (family: Family, group: string) =>
    stated.flatMap((other, at) =>
      other.relation.name === family.member &&
      keyAt(other.fact, family.ownerTerms) === group &&
      isMember(family, other.fact)
        ? [at]
        : [],
    );
  const counted = stated.map(({ fact, relation }) => ({
    ...Object.fromEntries(
      families
        .filter(({ owner }) => owner === relation.name)
        .map((family) => [
          family.count,
          BigInt(membersOf(family, keyAt(fact, family.ownerKey)).length),
        ]),
    ),
    ...fact,
  }));
  const ownerOf = (family: Family, group: string) =>
    stated.findIndex(
      (other, index) =>
        other.relation.name === family.owner &&
        keyAt(counted[index] ?? {}, family.ownerKey) === group,
    );
  const folds = hiddenFolds.map((fold) => ({
    ...fold,
    steps: counted.map((fact, at) =>
      stated[at]?.relation.name === fold.family.member &&
      isMember(fold.family, fact) &&
      Option.match(fold.selection, {
        onNone: () => true,
        onSome: (predicate) => valueOf(predicate, fact) === true,
      })
        ? 1n
        : 0n,
    ),
  }));
  const stepsOf = (fold: (typeof folds)[number], members: readonly number[]) =>
    members.reduce((sum, member) => sum + (fold.steps[member] ?? 0n), 0n);
  const filled = counted.map((fact, at) => ({
    ...Object.fromEntries(
      folds
        .filter(({ family }) => family.owner === stated[at]?.relation.name)
        .map((fold) => [
          fold.end,
          stepsOf(fold, membersOf(fold.family, keyAt(fact, fold.family.ownerKey))),
        ]),
    ),
    ...fact,
  }));
  const slotOf = (family: Family, at: number, members: readonly number[]) =>
    Option.match(family.slot, {
      onNone: () => members.indexOf(at),
      onSome: (field) => Number(filled[at]?.[field]),
    });

  return stated.map((held, at) => {
    const fact = filled[at] ?? held.fact;
    const slots = families
      .filter(({ member }) => member === held.relation.name)
      .flatMap((family) => {
        const group = keyAt(fact, family.ownerTerms);
        const members = membersOf(family, group);
        const owner = filled[ownerOf(family, group)];

        return [
          ...(Option.isNone(family.slot)
            ? [[`the index of the family ${family.label}`, members.indexOf(at)] as const]
            : []),
          [
            `the owner's count of the family ${family.label}`,
            owner === undefined ? members.length : Number(owner[family.count]),
          ] as const,
          ...(family.kind === "tree" && owner !== undefined
            ? [
                [
                  `the parent's start of the family ${family.label}`,
                  Number(owner["start"]),
                ] as const,
              ]
            : []),
        ];
      });
    const accumulators = folds
      .filter(({ family }) => family.member === held.relation.name)
      .flatMap((fold) => {
        const members = membersOf(fold.family, keyAt(fact, fold.family.ownerTerms));
        const slot = slotOf(fold.family, at, members);
        const before = stepsOf(
          fold,
          members.filter((member) => slotOf(fold.family, member, members) < slot),
        );

        return [
          [accumulatorOf("before", fold.label, fold.family.label), Number(before)] as const,
          [
            accumulatorOf("after", fold.label, fold.family.label),
            Number(before + (fold.steps[at] ?? 0n)),
          ] as const,
        ];
      });

    return {
      fact,
      hidden: { ...Object.fromEntries(slots), ...Object.fromEntries(accumulators), ...held.hidden },
      relation: held.relation,
    };
  });
};

/**
 * The rows a case's stated facts are written as: in an order every owner axis between them keeps,
 * and every covering containment where no cycle defers it (owners first, the stated order
 * otherwise), each with every value the writer derives for it ({@link pinned}).
 *
 * @param stated - The facts.
 * @returns The rows, in writing order.
 */
export const statedInserts = (stated: readonly Stated[]): readonly Insert[] => {
  const derived = pinned(stated);
  const order: number[] = [];
  const remaining = derived.map((_, at) => at);
  const readyBy = (...maps: readonly ReadonlyMap<string, ReadonlySet<string>>[]) =>
    remaining.findIndex((at) =>
      maps.every((after) =>
        [...(after.get(derived[at]?.relation.name ?? "") ?? [])].every(
          (before) => !remaining.some((other) => derived[other]?.relation.name === before),
        ),
      ),
    );
  while (remaining.length > 0) {
    // A cycle of containments, which defers them, gives way to the owner axes alone.
    const both = readyBy(writtenAfter.owners, writtenAfter.covered);
    const ready = both === -1 ? readyBy(writtenAfter.owners) : both;
    order.push(...remaining.splice(ready === -1 ? 0 : ready, 1));
  }

  return order.flatMap((at) => {
    const held = derived[at];

    return held === undefined
      ? []
      : [
          {
            hidden: held.hidden ?? {},
            row: sqlRowOf(held.relation, held.fact),
            table: tableOf(held.relation.name),
          },
        ];
  });
};
