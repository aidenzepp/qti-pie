import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { DbLayer, served } from "@bjornpagen/grizzle/runtime";
import type { PoolBounds } from "@bjornpagen/grizzle/runtime";
import { Effect, FileSystem, Layer, Schema } from "effect";
import { primedLoginConnection } from "#pantry/db/connection.ts";
import { AuthorLogin, ServedLoadError, ServedText, servedPath } from "#pantry/db/served.ts";
import type { AuthorAppLogin } from "#pantry/qti/logins.ts";

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
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/grizzle/src/adapter/types/layer.ts#L90-L108
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/README.md#connecting
 */
const authorAppPool: PoolBounds = { idleTimeoutMs: 5000, max: 10, min: 1 };

/**
 * The author application's pool on the local cluster: the login's connection
 * (`#pantry/db/connection.ts` `primedLoginConnection`), with the password of the role grizzle
 * installs for the login, its pool, and the committed served workload, read from disk and served as
 * the login's type (grizzle's `served`), with no schema module evaluated: the login's type is an
 * `import type`.
 *
 * It provides the login's `DbLayer`, for the author role, and {@link AuthorLogin}, the served login
 * itself, whose `roles.author` every `Db.open` takes: grizzle opens a `Db` only on a role of the
 * served login its layer was built over.
 *
 * Building the layer fails with Effect's `ConfigError` for a missing or malformed setting, with a
 * `ClusterConfigError` (`#pantry/db/connection.ts`) when the CA is unreadable, with a
 * {@link ServedLoadError} when the served file is, with the command's `PasswordCommandError` where
 * `GR8DES_PG_PASSWORD_COMMAND` names one, which the build runs once for the login's role before
 * any connection attempt, and with grizzle's `OpenError` at stage `config` for a file of another
 * login. A missing password file is not found here: it fails each connection attempt with
 * grizzle's `CredentialError`.
 */
export const AuthorAppLayer = Layer.unwrap(
  Effect.gen(function* AuthorAppLayer() {
    const fs = yield* FileSystem.FileSystem;
    const connectionOf = yield* primedLoginConnection;
    const file = yield* fs.readFileString(servedPath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(ServedText)),
      Effect.mapError((reason) => new ServedLoadError({ path: servedPath, reason })),
    );
    const login = served<AuthorAppLogin>(file, "author_app");
    const connection = yield* connectionOf(login);

    return Layer.merge(
      DbLayer.make({ ...connection, login, pool: authorAppPool }),
      Layer.succeed(AuthorLogin, login),
    );
  }),
).pipe(Layer.provide(NodeFileSystem.layer));

/**
 * Everything an import in this process runs on, one layer that needs nothing: Node's file system,
 * which the package's read (`readPackage` of `#pantry/import/read.ts`) reads the package through,
 * and {@link AuthorAppLayer}, the author login and its `DbLayer`, which its write (`importPackage`
 * of `#pantry/import/package.ts`) applies through. So
 * `importDir(dir).pipe(Effect.provide(ImportLive))` (`#pantry/test/import-dir.ts`) imports a
 * package into this package's own install, and the command line runs every command that reaches
 * the database on it (`#pantry/cli/engine.ts` `withAuthorApp`). It is the command line's and the
 * tests' own, since `package.json`'s `"exports"` map does not list this module: an application
 * builds its own author `DbLayer`, opens its `Db` and passes `db.workload` to `importPackage`.
 *
 * It is built from the process's settings, read through Effect `Config`: the cluster's
 * (`GR8DES_PG_HOST`, `GR8DES_PG_PORT`, `GR8DES_PG_DATABASE`, `GR8DES_PG_CA`, `GR8DES_PG_SECRETS`),
 * and it opens the committed served file.
 * The import's `RetrySchedule` and `WrapApply` are references whose defaults are the live ones, so
 * the layer provides neither. Building it fails as {@link AuthorAppLayer} fails.
 */
export const ImportLive = Layer.merge(AuthorAppLayer, NodeFileSystem.layer);
