import { DbLayer } from "@bjornpagen/grizzle";
import type { PoolBounds } from "@bjornpagen/grizzle";
import { Effect, FileSystem, Layer, Option, Schema } from "effect";
import { fileURLToPath } from "node:url";
import { connectionServices, loginConnection } from "#pantry/db/connection.ts";
import { installed, snapshotPathOf } from "#pantry/db/install.ts";

/**
 * The migrations snapshot could not be read from disk or is not a JSON object with a `fingerprint`.
 * The usual cause is a checkout made without git-lfs, which leaves a pointer file where the
 * snapshot belongs.
 */
export class SnapshotLoadError extends Schema.TaggedError<SnapshotLoadError>()(
  "SnapshotLoadError",
  { path: Schema.String, reason: Schema.Unknown },
) {
  /**
   * The file, why that is likely, and the command that fixes it.
   */
  override get message(): string {
    return `Cannot read the migrations snapshot at ${this.path}. Without git-lfs it checks out as a pointer file. Run \`git lfs pull\` in the checkout that holds it, then try again; where GR8DES_QTI_INSTALL names an install, the install's own grizzle config generates it into the install's migrations folder.`;
  }
}

/**
 * The snapshot file's text as the JSON value `DbLayer.make` takes: an object with its `fingerprint`
 * and every other key kept, because grizzle parses the whole form itself.
 */
const SnapshotText = Schema.fromJsonString(
  Schema.StructWithRest(Schema.Struct({ fingerprint: Schema.String }), [
    Schema.Record(Schema.String, Schema.Json),
  ]),
);

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
 * The snapshot the author login opens: the committed one, or, where `GR8DES_QTI_INSTALL` names an
 * install, the install's (`#pantry/db/install.ts`), whose `Qti` this process builds with the same
 * policy, so the two are one schema's.
 */
const snapshotPath = Option.match(installed, {
  onNone: () => fileURLToPath(import.meta.resolve("#migrations/qti/snapshot.json")),
  onSome: snapshotPathOf,
});

/**
 * The author application's pool on the local cluster: the login's connection
 * (`#pantry/db/connection.ts`), with the password of the role grizzle installs for the login, its
 * pool, and its install's migrations snapshot, read from disk.
 *
 * The login (`#pantry/qti/logins.ts`) is a resource of this layer, loaded once the settings, the
 * CA and the snapshot are read, and only then given to the connection: grizzle builds its workload
 * when that module is evaluated, so a build that fails on its settings never pays for the
 * workload. Nothing this module imports statically may reach the login (`src/cli/startup.test.ts`).
 *
 * The login's type is the dynamic import's, so the layer provides `DbLayer` for exactly the author
 * role: grizzle's `DbLayerService` is invariant in its role, and a layer built for `AnyLogin` would
 * serve no role a caller opens.
 *
 * Building the layer fails with Effect's `ConfigError` for a missing or malformed setting, with a
 * `ClusterConfigError` (`#pantry/db/connection.ts`) when the CA is unreadable, and with a
 * {@link SnapshotLoadError} when the snapshot is. A missing password file is not found here: it
 * fails each connection attempt with grizzle's `CredentialError`.
 */
export const AuthorAppLayer = Layer.unwrap(
  Effect.gen(function* AuthorAppLayer() {
    const fs = yield* FileSystem.FileSystem;
    const connectionOf = yield* loginConnection;
    const snapshot = yield* fs.readFileString(snapshotPath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(SnapshotText)),
      Effect.mapError((reason) => new SnapshotLoadError({ path: snapshotPath, reason })),
    );
    const { AuthorApp } = yield* Effect.promise(() => import("#pantry/qti/logins.ts"));

    return DbLayer.make({
      ...connectionOf(AuthorApp),
      login: AuthorApp,
      pool: authorAppPool,
      snapshot,
    });
  }),
).pipe(Layer.provide(connectionServices));
