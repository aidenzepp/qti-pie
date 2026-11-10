import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { DbLayer, roleNameOf, served } from "@bjornpagen/grizzle/runtime";
import type { PoolBounds } from "@bjornpagen/grizzle/runtime";
import { Effect, FileSystem, Layer, Option, Schema } from "effect";
import { connectionServices, loginConnection } from "#pantry/db/connection.ts";
import { installed, servedPathOf } from "#pantry/db/install.ts";
import {
  AuthorLogin,
  ServedLoadError,
  ServedText,
  servedPath as committedServed,
} from "#pantry/db/served.ts";
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
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/grizzle/src/adapter/types/layer.ts#L89-L107
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/README.md#connecting
 */
const authorAppPool: PoolBounds = { idleTimeoutMs: 5000, max: 10, min: 1 };

/**
 * The served file the author login opens: the committed one, or, where `GR8DES_QTI_INSTALL` names
 * an install, the install's own (`#pantry/db/install.ts` `servedPathOf`), which the install's
 * grizzle config generated with its migrations, so the file and the database it was migrated to are
 * one installation's.
 */
const servedFilePath = Option.match(installed, {
  onNone: () => committedServed,
  onSome: servedPathOf,
});

/**
 * The author application's pool on the local cluster: the login's connection
 * (`#pantry/db/connection.ts`), with the password of the role grizzle installs for the login, its
 * pool, and its install's served workload, read from disk and served as the login's type
 * (grizzle's `served`), with no schema module evaluated: the login's type is an `import type`.
 *
 * It provides the login's `DbLayer`, for the author role, and {@link AuthorLogin}, the served login
 * itself, whose `roles.author` every `Db.open` takes: grizzle opens a `Db` only on a role of the
 * served login its layer was built over.
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
    const file = yield* fs.readFileString(servedFilePath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(ServedText)),
      Effect.mapError((reason) => new ServedLoadError({ path: servedFilePath, reason })),
    );
    const login = served<AuthorAppLogin>(file, "author_app");

    return Layer.merge(
      DbLayer.make({ ...connectionOf(roleNameOf(login)), login, pool: authorAppPool }),
      Layer.succeed(AuthorLogin, login),
    );
  }),
).pipe(Layer.provide(connectionServices));

/**
 * Everything an import in this process runs on, one layer that needs nothing: Node's file system,
 * which the package's read (`readPackage` of `#pantry/import/read.ts`) reads the package through,
 * and {@link AuthorAppLayer}, the author login and its `DbLayer`, which its write (`importPackage`
 * of `#pantry/import/package.ts`) applies through. So
 * `readPackage(dir).pipe(Effect.flatMap(importPackage), Effect.provide(ImportLive))` imports a
 * package, here and in an install outside this package alike, and the command line runs every
 * command that reaches the database on it (`#pantry/cli/engine.ts` `withAuthorApp`).
 *
 * It is built from the process's settings, read through Effect `Config`: the cluster's
 * (`GR8DES_PG_HOST`, `GR8DES_PG_PORT`, `GR8DES_PG_DATABASE`, `GR8DES_PG_CA`, `GR8DES_PG_SECRETS`)
 * and the install `GR8DES_QTI_INSTALL` names, whose served file it opens (`#pantry/db/install.ts`).
 * The import's `RetrySchedule` and `WrapApply` are references whose defaults are the live ones, so
 * the layer provides neither. Building it fails as {@link AuthorAppLayer} fails.
 */
export const ImportLive = Layer.merge(AuthorAppLayer, NodeFileSystem.layer);
