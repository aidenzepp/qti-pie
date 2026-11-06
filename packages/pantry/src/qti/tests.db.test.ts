/**
 * The test layer's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): each
 * refused state is one the law's model refuses, named by the constraint the law installs.
 *
 * Every case writes one row no stored node names, through a direct SQL writer: the author login,
 * `SET ROLE` to the author role, at SERIALIZABLE, every foreign key deferred, then the one under
 * test set immediate where a case reads one. A row CHECK is judged as the row is inserted, before
 * any deferred key, so its SQLSTATE (23514) and its constraint, the check's name, are the verdict;
 * a foreign key's is 23503 and one of the constraints its containment installs. The transaction
 * rolls back. The rows below are none of a family's members, so no hidden column of grizzle's
 * needs filling: `SectionSelection`, `TestToken`, `TestFlag`, `Href` and `Section`, an owner whose
 * drawn count and fold end are its own columns.
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
 * - An item ref whose href names no entry is refused by `Href(package, path) → Entry(package, path)`,
 *   and a section ref whose href names an item document by the site's containment into the section
 *   documents;
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
 * A row a direct writer inserts into one of the author role's views: its columns as the view names
 * them, a closed id by its code.
 */
type SqlRow = Readonly<Record<string, string | number | boolean>>;

/**
 * The foreign keys from one of `Qti`'s tables into another, by constraint name, read from the
 * catalogue: the constraints a containment between the two relations installs.
 *
 * @param client - The session, before `SET ROLE`.
 * @param from - The referencing table.
 * @param to - The referenced table.
 * @returns The constraint names.
 */
const foreignKeys = (client: Client, from: string, to: string) =>
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
 * Insert one row as the author role, every foreign key deferred, then set the given ones
 * immediate, and roll back: the server's verdict on the row by its own laws and those constraints.
 *
 * @param client - The session.
 * @param view - The author role's view to insert into.
 * @param row - The row.
 * @param immediate - The constraints to check at once after the insert.
 * @returns The server's error, or none when every statement succeeded; fails with any other
 *   failure.
 */
const deferredInsert = (client: Client, view: string, row: SqlRow, immediate: readonly string[]) =>
  Effect.gen(function* insertDeferred() {
    const columns = Object.keys(row);
    yield* rowsOf(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");

    const outcome = yield* Effect.gen(function* statements() {
      yield* rowsOf(client, `SET ROLE ${authorRole}`);
      yield* rowsOf(client, "SET CONSTRAINTS ALL DEFERRED");
      yield* rowsOf(
        client,
        `INSERT INTO ${authorRole}.${view} (${columns.join(", ")}) VALUES (${columns
          .map((_, at) => `$${String(at + 1)}`)
          .join(", ")})`,
        Object.values(row),
      );
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
 * Uuids no stored row holds: the node, its document, its parent and its package.
 */
const stray = {
  document: "00000000-0000-4000-8000-0000000013d0",
  node: "00000000-0000-4000-8000-0000000013f0",
  package: "00000000-0000-4000-8000-0000000013a0",
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
 * An href of an item ref in a test at `tests/`, as written and as resolved.
 *
 * @param href - The collapsed href.
 * @param path - The entry it names.
 * @returns The row.
 */
const hrefRow = (href: string, path: string) =>
  ({
    ...tupleOf("qti-assessment-item-ref"),
    directory: "tests/",
    href,
    package: stray.package,
    path,
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
          // Oracle: PostgreSQL, the `selection_bound` CHECK; reading 70 says which states it holds.
          // Bound: select at members and at members + 1, with and without replacement, members 3.
          Effect.gen(function* selectionBound() {
            const client = yield* loginSession;
            const at = { members: 3, required: 0, select: 3, withReplacement: false } as const;

            assert.isTrue(
              Option.isNone(yield* deferredInsert(client, "section_selection", selection(at), [])),
              "select = members",
            );
            assertRefused(
              yield* deferredInsert(
                client,
                "section_selection",
                selection({ ...at, select: 4 }),
                [],
              ),
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
                  [],
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
                  [],
                ),
              ),
              "select = required",
            );
            assertRefused(
              yield* deferredInsert(
                client,
                "section_selection",
                selection({ ...base, select: 1 }),
                [],
              ),
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
              Option.isNone(yield* deferredInsert(client, "section_selection", padded, [])),
              "a padded select split around its integer",
            );
            assertRefused(
              yield* deferredInsert(
                client,
                "section_selection",
                { ...padded, select_lead: "" },
                [],
              ),
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

            assert.isTrue(Option.isNone(yield* deferredInsert(client, "test_token", token, [])));
            assertRefused(
              yield* deferredInsert(
                client,
                "test_token",
                { ...token, lead: "", value: " Q01" },
                [],
              ),
              "23514",
              ["e_1_derived"],
              "a value with whitespace at its start",
            );
            assert.isTrue(Option.isNone(yield* deferredInsert(client, "test_flag", flag, [])));
            assertRefused(
              yield* deferredInsert(client, "test_flag", { ...flag, value: false }, []),
              "23514",
              ["e_1_derived"],
              "1 read as false",
            );
          }).pipe(Effect.scoped),
      );

      it.effect(
        "refuses an href outside the resolved form by Href_form, a path that is not its directory and href by E1_derived, and an href that names no entry by its containment into Entry",
        () =>
          // Oracle: PostgreSQL: the `href_form` and `e_1_derived` CHECKs, and the foreign keys
          // `Href(package, path) → Entry(package, path)` installs (23503). Bound: one plain href
          // and each named way to break it.
          Effect.gen(function* hrefs() {
            const client = yield* loginSession;
            const entryKeys = yield* foreignKeys(client, "href", "entry");
            assert.isNotEmpty(entryKeys, "href references entry");

            assert.isTrue(
              Option.isNone(
                yield* deferredInsert(
                  client,
                  "href",
                  hrefRow("items/a.xml", "tests/items/a.xml"),
                  [],
                ),
              ),
              "a plain href",
            );
            assertRefused(
              yield* deferredInsert(client, "href", hrefRow("../a.xml", "tests/../a.xml"), []),
              "23514",
              ["href_form"],
              "a dot segment",
            );
            assertRefused(
              yield* deferredInsert(client, "href", hrefRow("items/a.xml", "items/a.xml"), []),
              "23514",
              ["e_1_derived"],
              "a path that drops the directory",
            );
            assertRefused(
              yield* deferredInsert(
                client,
                "href",
                hrefRow("items/a.xml", "tests/items/a.xml"),
                entryKeys,
              ),
              "23503",
              entryKeys,
              "an href that names no entry",
            );
          }).pipe(Effect.scoped),
      );

      it.effect("refuses a section that holds no part, by Section_parts", () =>
        // Oracle: PostgreSQL, the `section_parts` CHECK; reading 26 says which states it holds.
        // Bound: members 1, accepted, and 0, refused.
        Effect.gen(function* sectionParts() {
          const client = yield* loginSession;

          assert.isTrue(Option.isNone(yield* deferredInsert(client, "section", sectionRow(1), [])));
          assertRefused(
            yield* deferredInsert(client, "section", sectionRow(0), []),
            "23514",
            ["section_parts"],
            "an empty section",
          );
        }).pipe(Effect.scoped),
      );
    },
  );
});
