import { DbLayer, roleNameOf, served } from "@bjornpagen/grizzle/runtime";
import type { PoolBounds } from "@bjornpagen/grizzle/runtime";
import { Effect, FileSystem, Layer, Schema } from "effect";
import { connectionServices, loginConnection } from "#pantry/db/connection.ts";
import { ServedAuthorLogin, ServedLoadError, ServedText, servedPath } from "#pantry/db/served.ts";
import type { AuthorLogin } from "#pantry/qti/logins.ts";

/**
 * The author application's session pool: at most 10 sessions, 1 kept open once opened, and the
 * others closed 5,000 ms after their last use.
 *
 * Grizzle chooses no size and no timeout: `DbLayer.make` takes the caller's `PoolBounds`, and
 * these are this package's choice. Pantry's calls on a `Db` run one after another: the import
 * opens one `Db` and applies one ChangeSet, the export reads its documents' pages in order, and the
 * database tests run one file at a time (`maxWorkers: 1`, vite.config.ts) and import one package at
 * a time, so 10 is headroom above what pantry uses, not a measured need. The session kept open
 * serves a process's next call, such as a test file's next import through the same layer, without
 * a new connection attempt; any other closes 5,000 ms after its last use, so a process between
 * calls holds one session of the server.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/999facc69571db35dc9878d47f2d82ba95c41456/packages/grizzle/src/adapter/types/layer.ts#L80-L95
 * @see https://github.com/bjornpagen/grizzle/blob/999facc69571db35dc9878d47f2d82ba95c41456/README.md#connecting
 */
const authorAppPool: PoolBounds = { idleTimeoutMs: 5000, max: 10, min: 1 };

/**
 * The author application's pool on the local cluster: the login's connection
 * (`#pantry/db/connection.ts`), with the password of the role grizzle installs for the login, its
 * pool, and the login's committed served workload, `migrations/qti/served/author_app.json`
 * (`#pantry/db/served.ts` `servedPath`), read from disk and served as the login's type (grizzle's
 * `served`), with no schema module evaluated: the login's type is an `import type`.
 *
 * It provides the login's `DbLayer`, for the author role, and {@link ServedAuthorLogin}, the served
 * login itself, whose `roles.author` every `Db.open` takes: grizzle opens a `Db` only on a role of
 * the served login its layer was built over.
 *
 * Building the layer fails with Effect's `ConfigError` for a missing or malformed setting, with a
 * `ClusterConfigError` (`#pantry/db/connection.ts`) when the CA is unreadable, with a
 * {@link ServedLoadError} when the served file is, and with grizzle's `OpenError` at stage `config`
 * for a file of another login. A missing password file is not found here: it fails each connection
 * attempt with grizzle's `CredentialError`.
 */
export const AuthorAppLayer = Layer.unwrap(
  Effect.gen(function* AuthorAppLayer() {
    const fs = yield* FileSystem.FileSystem;
    const connectionOf = yield* loginConnection;
    const file = yield* fs.readFileString(servedPath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(ServedText)),
      Effect.mapError((reason) => new ServedLoadError({ path: servedPath, reason })),
    );
    const login = served<AuthorLogin>(file, "author_app");

    return Layer.merge(
      DbLayer.make({ ...connectionOf(roleNameOf(login)), login, pool: authorAppPool }),
      Layer.succeed(ServedAuthorLogin, login),
    );
  }),
).pipe(Layer.provide(connectionServices));
