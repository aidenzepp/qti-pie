/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { DbLayer } from "@bjornpagen/grizzle";
import type { PoolBounds } from "@bjornpagen/grizzle";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { Effect, FileSystem, Layer, Schema } from "effect";
import { fileURLToPath } from "node:url";
import { loginConnection } from "#pantry/db/connection.ts";

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
    return `Cannot read the migrations snapshot at ${this.path}. Without git-lfs it checks out as a pointer file. Run \`git lfs pull\` in this checkout, then try again.`;
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
 * The PostgreSQL role grizzle installs for the author login, `<schema>__<login>` (`qti` and
 * `author_app`), which names the password file scripts/db.sh writes for it.
 */
const authorAppRole = "qti__author_app";

/**
 * The author application's session pool: at most 10 sessions, 1 kept open once opened, and the
 * others closed 5,000 ms after their last use.
 *
 * Grizzle states no number of its own. These are the bounds grizzle 48256f8 fixed for every pool,
 * which every lease run of this package has passed under.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/48256f8d61484d18aea2023f2d6fb54d07d46abf/packages/engine/src/core/policy.ts
 */
const authorAppPool: PoolBounds = { idleTimeoutMs: 5000, max: 10, min: 1 };

/**
 * The author application's pool on the local cluster: the login's connection
 * (`#pantry/db/connection.ts`), its pool, and the committed migrations snapshot, read from disk.
 *
 * The login (`#pantry/qti/logins.ts`) is a resource of this layer, loaded once the settings, the
 * CA and the snapshot are read: grizzle builds its workload when that module is evaluated, so a
 * build that fails on its settings never pays for the workload. Nothing this module imports
 * statically may reach the login (`src/cli/startup.test.ts`).
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
    const connection = yield* loginConnection(authorAppRole);
    const snapshotPath = fileURLToPath(import.meta.resolve("#migrations/qti/snapshot.json"));
    const snapshot = yield* fs.readFileString(snapshotPath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(SnapshotText)),
      Effect.mapError((reason) => new SnapshotLoadError({ path: snapshotPath, reason })),
    );
    const { AuthorApp } = yield* Effect.promise(() => import("#pantry/qti/logins.ts"));

    return DbLayer.make({ ...connection, login: AuthorApp, pool: authorAppPool, snapshot });
  }),
).pipe(Layer.provide(NodeFileSystem.layer));
