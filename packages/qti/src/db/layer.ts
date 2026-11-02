/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { CredentialError, DbLayer } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { Config, Effect, FileSystem, Layer, Option, Redacted, Schema } from "effect";
import { fileURLToPath } from "node:url";
import { AuthorApp } from "#qti/schema/logins.ts";

/**
 * The migrations snapshot could not be read from disk or is not a JSON object with a `fingerprint`.
 */
export class SnapshotLoadError extends Schema.TaggedError<SnapshotLoadError>()(
  "SnapshotLoadError",
  { path: Schema.String, reason: Schema.Unknown },
) {}

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
    const snapshotPath = fileURLToPath(import.meta.resolve("#migrations/qti/snapshot.json"));
    const snapshot = yield* fs.readFileString(snapshotPath).pipe(
      Effect.flatMap(Schema.decodeUnknownEffect(SnapshotText)),
      Effect.mapError((reason) => new SnapshotLoadError({ path: snapshotPath, reason })),
      Effect.orDie,
    );
    const ca = yield* fs.readFileString(`${grizzleState}/tls/ca.crt`);
    const password = fs.readFileString(`${secrets}/qti__author_app.password`).pipe(
      Effect.map((text) => Redacted.make(text.trim())),
      Effect.mapError((cause) => CredentialError.make({ cause })),
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
