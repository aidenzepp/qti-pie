import { CredentialError, DbLayer } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { Config, Effect, FileSystem, Layer, Option, Redacted } from "effect";
import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };
import { AuthorApp } from "#qti/schema/logins.ts";

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
