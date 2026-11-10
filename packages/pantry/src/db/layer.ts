import { DbLayer } from "@bjornpagen/grizzle";
import type { PoolBounds } from "@bjornpagen/grizzle";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { Effect, FileSystem, Layer, Schema } from "effect";
import { loginConnection } from "#pantry/db/connection.ts";
import { SnapshotLoadError, SnapshotText, snapshotPath } from "#pantry/db/snapshot.ts";

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
 * The login (`#pantry/qti/logins.ts` `authorLogin`, over `#pantry/qti/schema.ts` `qti`) is a
 * resource of this layer, loaded and built once the settings, the CA and the snapshot are read:
 * building it composes the schema and its workload, so a build that fails on its settings never
 * pays for either. Nothing this module imports statically may reach the login
 * (`src/cli/startup.test.ts`).
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
    const snapshot = yield* fs.readFileString(snapshotPath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(SnapshotText)),
      Effect.mapError((reason) => new SnapshotLoadError({ path: snapshotPath, reason })),
    );
    const { authorLogin } = yield* Effect.promise(() => import("#pantry/qti/logins.ts"));
    const { qti } = yield* Effect.promise(() => import("#pantry/qti/schema.ts"));

    return DbLayer.make({
      ...connection,
      login: authorLogin(qti()),
      pool: authorAppPool,
      snapshot,
    });
  }),
).pipe(Layer.provide(NodeFileSystem.layer));
