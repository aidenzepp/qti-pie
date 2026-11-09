/**
 * The installed `Qti` on the lease, read the way a direct SQL reader reads it: as the author login,
 * with PostgreSQL's catalog its oracle.
 *
 * - The login opens its one role through `AuthorAppLayer`.
 * - The role's view of `Node` decodes `kind`: `kind_name` stands beside it, and every row it shows
 *   names the handle of its code in `NodeKind`.
 *
 * That `Author` holds every relation whole (G6) and that no relation is `mutable` are facts of the
 * declarations, checked in `schema.test.ts`. The installation's lack of a policy and of an UPDATE
 * grant follows from them in grizzle, which tests that derivation itself.
 */
import { Db } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { NodeKind } from "#pantry/grammar/install.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { authorRole, authorViews, loginSession, rowsOf } from "#pantry/test/direct-sql.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

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
              [authorViews],
            );
            const ordinal = (name: string) =>
              columns.find((column) => column.column_name === name)?.ordinal_position;
            const kind = ordinal("kind");

            assert.isDefined(kind);
            assert.strictEqual(ordinal("kind_name"), (kind ?? 0) + 1);

            const rows = yield* rowsOf<{ readonly kind: number; readonly kind_name: string }>(
              client,
              `SELECT kind::integer AS kind, kind_name FROM ${authorViews}.node`,
            );

            for (const row of rows) {
              assert.strictEqual(row.kind_name, NodeKind.handles[row.kind]);
            }
          }),
      );
    },
  );
});
