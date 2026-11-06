/**
 * The installed `Qti` on the lease, read the way a direct SQL reader reads it: as the author login,
 * with grizzle's catalogue its oracle (PostgreSQL itself judges each privilege and each policy).
 *
 * - The login opens its one role through `AuthorAppLayer`.
 * - The role's view of `Node` decodes `kind`: `kind_name` stands beside it, and every row it shows
 *   names the handle of its code in `NodeKind`.
 * - No row-security policy is installed: `Author` holds every relation whole (G6).
 * - No relation is mutable: no role of the installation holds UPDATE on any of its relations.
 */
import { Db } from "@bjornpagen/grizzle";
import type { DbConnection } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Redacted } from "effect";
import { Client } from "pg";
import type { QueryResultRow } from "pg";
import { describe } from "vitest";
import { loginConnection } from "#pantry/db/connection.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { NodeKind } from "#pantry/grammar/install.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
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
 * with its scope: the reader a direct SQL writer is.
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
    Effect.tryPromise(() => client.connect()),
    () => Effect.promise(() => client.end()),
  );
}).pipe(Effect.provide(NodeFileSystem.layer));

/**
 * Run one statement on a session and return its rows.
 *
 * @param client - The session.
 * @param text - The statement.
 * @param values - Its parameters, as text.
 * @returns The rows, each as node-postgres decodes it.
 */
const rowsOf = <R extends QueryResultRow>(
  client: Client,
  text: string,
  values: readonly string[] = [],
) =>
  Effect.tryPromise(() => client.query<R>(text, [...values])).pipe(Effect.map(({ rows }) => rows));

describe.skipIf(!hasLease)("qti/schema.db.test.ts, on the lease", () => {
  layer(AuthorAppLayer, { timeout: authorLayerHookTimeoutMs })(
    "the installed Qti, read as the author login",
    (it) => {
      it.effect("opens the author role through the login's layer", () =>
        Effect.gen(function* opensTheAuthorRole() {
          const db = yield* Db.open(AuthorApp.roles.author, {});

          assert.isDefined(db);
        }),
      );

      it.effect(
        "shows kind_name beside kind in the role's view of Node, each row naming its code's handle",
        () =>
          Effect.gen(function* decodesKind() {
            const client = yield* loginSession;

            yield* rowsOf(client, `SET ROLE ${authorRole}`);

            const columns = yield* rowsOf<{
              readonly column_name: string;
              readonly ordinal_position: number;
            }>(
              client,
              "SELECT column_name, ordinal_position FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'node' ORDER BY ordinal_position",
              [authorRole],
            );
            const ordinal = (name: string) =>
              columns.find((column) => column.column_name === name)?.ordinal_position;
            const kind = ordinal("kind");

            assert.isDefined(kind);
            assert.strictEqual(ordinal("kind_name"), (kind ?? 0) + 1);

            const rows = yield* rowsOf<{ readonly kind: number; readonly kind_name: string }>(
              client,
              `SELECT kind::integer AS kind, kind_name FROM ${authorRole}.node`,
            );

            for (const row of rows) {
              assert.strictEqual(row.kind_name, NodeKind.handles[row.kind]);
            }
          }),
      );

      it.effect("installs no row-security policy on any relation", () =>
        Effect.gen(function* noPolicy() {
          const client = yield* loginSession;
          const policies = yield* rowsOf<{ readonly policyname: string }>(
            client,
            "SELECT schemaname, tablename, policyname FROM pg_catalog.pg_policies WHERE schemaname = $1 OR schemaname LIKE $2",
            [qtiSchema, `${qtiSchema}\\_\\_%`],
          );

          assert.deepStrictEqual(policies, []);
        }),
      );

      it.effect("grants no role of the installation UPDATE on any relation", () =>
        Effect.gen(function* noUpdate() {
          const client = yield* loginSession;
          const relations = yield* rowsOf<{ readonly relations: number }>(
            client,
            "SELECT count(*)::integer AS relations FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace WHERE (n.nspname = $1 OR n.nspname LIKE $2) AND c.relkind IN ('r', 'p', 'v', 'm')",
            [qtiSchema, `${qtiSchema}\\_\\_%`],
          );
          const updatable = yield* rowsOf<{ readonly relname: string }>(
            client,
            "SELECT n.nspname, c.relname, r.rolname FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace CROSS JOIN pg_catalog.pg_roles r WHERE (n.nspname = $1 OR n.nspname LIKE $2) AND c.relkind IN ('r', 'p', 'v', 'm') AND r.rolname LIKE $2 AND pg_catalog.has_any_column_privilege(r.oid, c.oid, 'UPDATE')",
            [qtiSchema, `${qtiSchema}\\_\\_%`],
          );

          assert.isAbove(Number(relations[0]?.relations), 0);
          assert.deepStrictEqual(updatable, []);
        }),
      );
    },
  );
});
