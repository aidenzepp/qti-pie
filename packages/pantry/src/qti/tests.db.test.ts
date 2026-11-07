/**
 * The test layer's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the constraint the law installs.
 *
 * Every case writes one row no stored node names into its table, through a direct SQL writer
 * (grizzle's README, "Direct SQL access"): the author login, `SET ROLE` to the author role, at
 * SERIALIZABLE, every foreign key deferred. A role writes a table, never its own view of it, which
 * it holds SELECT on alone (README, "Security model"). A row CHECK is judged as the row is
 * inserted, before any deferred key, so its SQLSTATE (23514) and its constraint, the check's name,
 * are the verdict. The transaction rolls back. The rows below are none of a family's members, so no
 * hidden column of grizzle's needs filling: `SectionSelection`, `TestToken`, `TestFlag` and
 * `Section`, an owner whose drawn count and fold end are its own columns; each row fills exactly
 * its table's written columns, which the catalogue lists, or the case fails before any statement
 * runs. An href's own laws are `#pantry/qti/package.ts`'s, judged in `package.db.test.ts`.
 *
 * The cases over whole packages need the importer's ChangeSet (Q5.15), and are listed for it and
 * for the network seat's probe:
 *
 * - A test whose section ref names a section document that refs it back is refused by
 *   `Instance(document, rootKind, children) → TestDocument(node, rootKind, sites)` (Inclusion
 *   cycle); the same test with the cycle cut is accepted;
 * - A section document placed twice in one test is accepted, and an item ref of the test that shares
 *   an identifier with a section of the placed document is refused by `key(AssembledName, assembly,
 *   identifier)` (Test name key);
 * - A branch rule on an item ref naming the item ref after it is accepted; one naming the item ref
 *   before it is refused by `Branch_forward` unless their section's `qti-ordering` shuffles, and
 *   one naming its own owner or its section is refused by `Branch_forward` either way; one naming
 *   an item ref under a selection with replacement is refused by `Branch_target`;
 * - An item ref whose href names no entry is refused by `ReferencePath(package, path) →
 *   Entry(package, path)`, and a section ref whose href names an item document by the site's
 *   containment into the section documents;
 * - A section holding three parts, two of them required, under a selection of `select="1"` is refused
 *   by `Selection_required`, and under `select="2"` accepted.
 */
import { NodeFileSystem } from "@effect/platform-node";
import type { DbConnection } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect, Option, Redacted } from "effect";
import { Client } from "pg";
import type { DatabaseError, QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { AttributeName, NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

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
 * A row a direct writer inserts into one of `Qti`'s tables: every column it fills by name, a closed
 * id by its code.
 */
type SqlRow = Readonly<Record<string, string | number | boolean>>;

/**
 * Read the columns of one of `Qti`'s tables a direct writer fills: every live column PostgreSQL
 * does not generate, a family's hidden ones among them (README, "Direct SQL access": a family's
 * values are a direct writer's to fill).
 *
 * @param client - The session.
 * @param table - The table.
 * @returns The columns' names, none for a table the schema does not hold.
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
 * Insert one row into its table as the author role, every foreign key deferred, and roll back: the
 * server's verdict on the row by its own CHECKs, keys and domains.
 *
 * @param client - The session.
 * @param table - The table to insert into.
 * @param row - The row, exactly the table's written columns.
 * @returns The server's error, or none when every statement succeeded; fails with any other
 *   failure.
 */
const deferredInsert = (client: Client, table: string, row: SqlRow) =>
  Effect.gen(function* insertDeferred() {
    const columns = Object.keys(row);
    assert.sameMembers(
      columns,
      yield* writtenColumnsOf(client, table),
      `${table}: the row fills every column a direct writer fills`,
    );
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      yield* rowsOf(
        client,
        `INSERT INTO ${qtiSchema}.${table} (${columns.join(", ")}) VALUES (${columns
          .map((_, at) => `$${String(at + 1)}`)
          .join(", ")})`,
        Object.values(row),
      );
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
 * The code of a handle in its roster, the value a direct writer stores in its closed-id column.
 *
 * @param handles - The roster's handles.
 * @param handle - The handle.
 * @returns Its code.
 */
const codeOf = (handles: readonly string[], handle: string): number => {
  const code = handles.indexOf(handle);
  assert.isAtLeast(code, 0, `${handle} is a handle of its roster`);

  return code;
};

/**
 * Uuids no stored row holds: the node, its document and its parent.
 */
const stray = {
  document: "00000000-0000-4000-8000-0000000013d0",
  node: "00000000-0000-4000-8000-0000000013f0",
  parent: "00000000-0000-4000-8000-0000000013e0",
} as const;

/**
 * A node's tuple as an overlay copies it (C18), for a node of one kind.
 *
 * @param kind - The node's kind.
 * @returns The tuple's columns.
 */
const tupleOf = (kind: string) =>
  ({
    document: stray.document,
    kind: codeOf(NodeKind.handles, kind),
    nearest: stray.document,
    node: stray.node,
    parent: stray.parent,
    start: 3,
    version: codeOf(SchemaVersion.handles, "3.0.1"),
  }) satisfies SqlRow;

/**
 * A selection of `select` over a section of `members` parts, `required` of them required.
 *
 * @param fields - The case's counts and flag.
 * @param fields.members - The section's parts.
 * @param fields.required - Its required parts.
 * @param fields.select - The selection's `select`, written plainly.
 * @param fields.withReplacement - Its `with-replacement`.
 * @returns The row.
 */
const selection = (fields: {
  readonly members: number;
  readonly required: number;
  readonly select: number;
  readonly withReplacement: boolean;
}) =>
  ({
    ...tupleOf("qti-selection"),
    members: fields.members,
    required: fields.required,
    select_form: String(fields.select),
    select_lead: "",
    select_lexical: String(fields.select),
    select_trail: "",
    with_replacement: fields.withReplacement,
  }) satisfies SqlRow;

/**
 * A section under a test part whose scope its own laws accept, its parts counted `members`.
 *
 * @param members - The parts' count.
 * @returns The row.
 */
const sectionRow = (members: number) =>
  ({
    ...tupleOf("qti-assessment-section"),
    keep_together: true,
    loose_chain: false,
    members,
    mixes: false,
    parent_kind: codeOf(NodeKind.handles, "qti-test-part"),
    parent_loose_chain: false,
    parent_mixes: false,
    part: stray.parent,
    replaced: false,
    replacing: false,
    required: 0,
    shuffle: false,
    visible: true,
    with_replacement: false,
  }) satisfies SqlRow;

/**
 * Assert that a row is refused by one constraint with one SQLSTATE.
 *
 * @param refused - The server's verdict.
 * @param code - The expected SQLSTATE.
 * @param constraints - The constraints that may name it, one of which must.
 * @param what - The case, for the message.
 */
const assertRefused = (
  refused: Option.Option<DatabaseError>,
  code: string,
  constraints: readonly string[],
  what: string,
): void => {
  const error = Option.getOrUndefined(refused);

  assert.strictEqual(error?.code, code, what);
  assert.include(constraints, error?.constraint, what);
};

describe.skipIf(!hasLease)("qti/tests.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the test layer's laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "accepts a selection of exactly its section's parts, and refuses one over unless it is with replacement, by Selection_bound",
        () =>
          // Oracle: PostgreSQL, the `selection_bound` CHECK; reading 79 says which states it holds.
          // Bound: select at members and at members + 1, with and without replacement, members 3.
          Effect.gen(function* selectionBound() {
            const client = yield* loginSession;
            const at = { members: 3, required: 0, select: 3, withReplacement: false } as const;

            assert.isTrue(
              Option.isNone(yield* deferredInsert(client, "section_selection", selection(at))),
              "select = members",
            );
            assertRefused(
              yield* deferredInsert(client, "section_selection", selection({ ...at, select: 4 })),
              "23514",
              ["selection_bound"],
              "select = members + 1",
            );
            assert.isTrue(
              Option.isNone(
                yield* deferredInsert(
                  client,
                  "section_selection",
                  selection({ ...at, select: 4, withReplacement: true }),
                ),
              ),
              "select = members + 1 with replacement",
            );
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a selection that selects fewer parts than its section's required parts, by Selection_required",
        () =>
          // Oracle: PostgreSQL, the `selection_required` CHECK; info §4.2.2 says which states it
          // holds. Bound: two required parts of three, under select 2 and select 1.
          Effect.gen(function* selectionRequired() {
            const client = yield* loginSession;
            const base = { members: 3, required: 2, withReplacement: false } as const;

            assert.isTrue(
              Option.isNone(
                yield* deferredInsert(
                  client,
                  "section_selection",
                  selection({ ...base, select: 2 }),
                ),
              ),
              "select = required",
            );
            assertRefused(
              yield* deferredInsert(client, "section_selection", selection({ ...base, select: 1 })),
              "23514",
              ["selection_required"],
              "select = required − 1",
            );
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses a selection whose select is not its lexical form's integer, by E1_derived",
        () =>
          // Oracle: PostgreSQL, the `e_1_derived` CHECK (`selectLexical = lead ‖ form ‖ trail`).
          // Bound: a padded form split right, and the same form with its lead dropped.
          Effect.gen(function* selectSplit() {
            const client = yield* loginSession;
            const padded = {
              ...selection({ members: 3, required: 0, select: 2, withReplacement: false }),
              select_lead: " ",
              select_lexical: " 2\t",
              select_trail: "\t",
            };

            assert.isTrue(
              Option.isNone(yield* deferredInsert(client, "section_selection", padded)),
              "a padded select split around its integer",
            );
            assertRefused(
              yield* deferredInsert(client, "section_selection", { ...padded, select_lead: "" }),
              "23514",
              ["e_1_derived"],
              "a split that drops the lead",
            );
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts a token split around its collapsed value and a flag read from its form, and refuses either written otherwise, by E1_derived",
        () =>
          // Oracle: PostgreSQL, each relation's `e_1_derived` CHECK; XML Schema Part 2 §4.3.6
          // (collapse) and §3.2.2.1 (boolean) say which states it holds. Bound: one right and one
          // wrong row each.
          Effect.gen(function* tokensAndFlags() {
            const client = yield* loginSession;
            const token = {
              lead: " ",
              lexical: " Q01 ",
              name: codeOf(AttributeName.handles, "identifier"),
              node: stray.node,
              trail: " ",
              value: "Q01",
            };
            const flag = {
              kind: codeOf(NodeKind.handles, "qti-assessment-section"),
              lexical: " 1 ",
              name: codeOf(AttributeName.handles, "visible"),
              node: stray.node,
              parent_kind: codeOf(NodeKind.handles, "qti-test-part"),
              value: true,
            };

            assert.isTrue(Option.isNone(yield* deferredInsert(client, "test_token", token)));
            assertRefused(
              yield* deferredInsert(client, "test_token", { ...token, lead: "", value: " Q01" }),
              "23514",
              ["e_1_derived"],
              "a value with whitespace at its start",
            );
            assert.isTrue(Option.isNone(yield* deferredInsert(client, "test_flag", flag)));
            assertRefused(
              yield* deferredInsert(client, "test_flag", { ...flag, value: false }),
              "23514",
              ["e_1_derived"],
              "1 read as false",
            );
          }).pipe(Effect.scoped),
      );

      it.effect(
        "accepts a section that holds no part, and one that holds one (spec reading 26)",
        () =>
          // Oracle: the information model's §4.2.15, a section's `sectionPart` of multiplicity
          // [0..unbounded], and both XSDs' minOccurs="0" (spec reading 26): no CHECK of `section`
          // reads its count of parts.
          // Bound: members 0 and 1, each accepted.
          Effect.gen(function* sectionParts() {
            const client = yield* loginSession;

            for (const members of [0, 1]) {
              assert.isTrue(
                Option.isNone(yield* deferredInsert(client, "section", sectionRow(members))),
                `a section of ${String(members)} parts`,
              );
            }
          }).pipe(Effect.scoped),
      );
    },
  );
});
