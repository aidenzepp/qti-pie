import { CredentialError, OpenError, TokenError, TransportFailure } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Config, ConfigProvider, Effect, Result } from "effect";
import { describeFailure } from "#qti/cli/errors.ts";
import { ClusterConfigError, SnapshotLoadError } from "#qti/db/layer.ts";

const config = { exitCode: 78, kind: "config" };

const database = { exitCode: 1, kind: "database" };

/**
 * What the password reader of `AuthorAppLayer` fails with when the password file is missing.
 */
const credential = CredentialError.make({ cause: new Error("ENOENT") });

describe("describeFailure, the local set-up", () => {
  it("a ClusterConfigError exits 78 as config", () => {
    const failure = new ClusterConfigError({
      path: "/state/tls/ca.crt",
      setting: "GRIZZLE_PG_STATE",
    });

    assert.deepStrictEqual(describeFailure(failure), config);
  });

  it("a SnapshotLoadError exits 78 as config", () => {
    const failure = new SnapshotLoadError({ path: "/snapshot.json", reason: "pointer file" });

    assert.deepStrictEqual(describeFailure(failure), config);
  });

  it.effect("Effect's ConfigError exits 78 as config", () =>
    Effect.gen(function* configError() {
      const result = yield* Effect.gen(function* readHome() {
        return yield* Config.String("HOME");
      }).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))), Effect.result);

      assert.isTrue(Result.isFailure(result));

      if (Result.isFailure(result)) {
        assert.deepStrictEqual(describeFailure(result.failure), config);
      }
    }),
  );

  it("an OpenError or a TransportFailure carrying a CredentialError exits 78 as config", () => {
    assert.deepStrictEqual(describeFailure(OpenError.make({ reason: credential })), config);
    assert.deepStrictEqual(describeFailure(TransportFailure.make({ reason: credential })), config);
  });

  it("an OpenError with another reason stays database", () => {
    const other = TokenError.make({ cause: new Error("refused") });

    assert.deepStrictEqual(describeFailure(OpenError.make({ reason: other })), database);
  });

  it("a TransportFailure with another reason, or none, stays database", () => {
    assert.deepStrictEqual(
      describeFailure({ _tag: "TransportFailure", reason: { _tag: "LayerReleased" } }),
      database,
    );
    assert.deepStrictEqual(describeFailure({ _tag: "TransportFailure" }), database);
  });
});
