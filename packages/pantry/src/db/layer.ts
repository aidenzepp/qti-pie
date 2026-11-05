/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { CredentialError, DbLayer } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { Config, Effect, FileSystem, Layer, Option, Redacted, Schema } from "effect";
import { fileURLToPath } from "node:url";
import { AuthorApp } from "#pantry/schema/logins.ts";

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
 * The development cluster's CA certificate could not be read, so the cluster is not set up for this
 * user: its state folder is missing or was never initialised.
 */
export class ClusterConfigError extends Schema.TaggedError<ClusterConfigError>()(
  "ClusterConfigError",
  { path: Schema.String, setting: Schema.Literal("GRIZZLE_PG_STATE") },
) {
  /**
   * The missing file and the two ways to supply it.
   */
  override get message(): string {
    return `Cannot read the local database's CA certificate at ${this.path}. Start the cluster from the grizzle clone (\`pnpm pg:init\`, and \`pnpm pg start\` after a reboot), or set ${this.setting} to the folder that holds its tls/ca.crt.`;
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
 * The local cluster scripts/db.sh migrates, read from the same variables with the same defaults as
 * the `GR8DES_PG_*` block at the top of scripts/db.sh; change one, change both.
 */
const localCluster = Config.all({
  database: Config.String("GR8DES_PG_DATABASE").pipe(Config.withDefault("gr8des_qti")),
  grizzleState: Config.option(Config.String("GRIZZLE_PG_STATE")),
  home: Config.String("HOME"),
  host: Config.String("GR8DES_PG_HOST").pipe(Config.withDefault("localhost")),
  port: Config.Port("GR8DES_PG_PORT").pipe(Config.withDefault(5433)),
  secrets: Config.option(Config.String("GR8DES_PG_SECRETS")),
});

/**
 * The author application's pool on the local cluster: verify-full TLS against grizzle's development
 * CA, and the password scripts/db.sh gave the login, read on each connection attempt.
 *
 * Building the layer fails with Effect's `ConfigError` for a missing or malformed setting, with a
 * {@link ClusterConfigError} when the CA is unreadable, and with a {@link SnapshotLoadError} when
 * the snapshot is. A missing password file is not found here: it fails each connection attempt
 * with grizzle's `CredentialError`.
 */
export const AuthorAppLayer = Layer.unwrap(
  Effect.gen(function* AuthorAppLayer() {
    const fs = yield* FileSystem.FileSystem;
    const cluster = yield* localCluster;
    const grizzleState = Option.getOrElse(
      cluster.grizzleState,
      () => `${cluster.home}/.local/var/grizzle/pg19rc1`,
    );
    const secrets = Option.getOrElse(
      cluster.secrets,
      () => `${cluster.home}/.local/var/gr8des/${cluster.database}`,
    );
    const ca = yield* fs.readFileString(`${grizzleState}/tls/ca.crt`).pipe(
      Effect.mapError(
        () =>
          new ClusterConfigError({
            path: `${grizzleState}/tls/ca.crt`,
            setting: "GRIZZLE_PG_STATE",
          }),
      ),
    );
    const snapshotPath = fileURLToPath(import.meta.resolve("#migrations/qti/snapshot.json"));
    const snapshot = yield* fs.readFileString(snapshotPath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(SnapshotText)),
      Effect.mapError((reason) => new SnapshotLoadError({ path: snapshotPath, reason })),
    );
    const password = fs.readFileString(`${secrets}/qti__author_app.password`).pipe(
      Effect.map((text) => Redacted.make(text.trim())),
      Effect.mapError((cause) => new CredentialError({ cause })),
    );

    return DbLayer.make({
      database: cluster.database,
      host: cluster.host,
      login: AuthorApp,
      password,
      port: cluster.port,
      snapshot,
      tls: { ca },
    });
  }),
).pipe(Layer.provide(NodeFileSystem.layer));
