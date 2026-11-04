import { CredentialError, OpenError, TokenError, TransportFailure } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Config, ConfigProvider, Effect, Result } from "effect";
import { describeFailure, kindExitCode, kindHelp, RoundtripDiffers } from "#qti/cli/errors.ts";
import { ClusterConfigError, SnapshotLoadError } from "#qti/db/layer.ts";
import { PackageNotFound } from "#qti/export/package.ts";

/**
 * What a failure is, without its help: the kind and the exit code.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
const identity = (failure: unknown) => {
  const { exitCode, kind } = describeFailure(failure);

  return { exitCode, kind };
};

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

    assert.deepStrictEqual(identity(failure), config);
  });

  it("a SnapshotLoadError exits 78 as config", () => {
    const failure = new SnapshotLoadError({ path: "/snapshot.json", reason: "pointer file" });

    assert.deepStrictEqual(identity(failure), config);
  });

  it.effect("Effect's ConfigError exits 78 as config", () =>
    Effect.gen(function* configError() {
      const result = yield* Effect.gen(function* readHome() {
        return yield* Config.String("HOME");
      }).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))), Effect.result);

      assert.isTrue(Result.isFailure(result));

      if (Result.isFailure(result)) {
        assert.deepStrictEqual(identity(result.failure), config);
      }
    }),
  );

  it("an OpenError or a TransportFailure carrying a CredentialError exits 78 as config", () => {
    assert.deepStrictEqual(identity(OpenError.make({ reason: credential })), config);
    assert.deepStrictEqual(identity(TransportFailure.make({ reason: credential })), config);
  });

  it("an OpenError with another reason stays database", () => {
    const other = TokenError.make({ cause: new Error("refused") });

    assert.deepStrictEqual(identity(OpenError.make({ reason: other })), database);
  });

  it("a TransportFailure with another reason, or none, stays database", () => {
    assert.deepStrictEqual(
      identity({ _tag: "TransportFailure", reason: { _tag: "LayerReleased" } }),
      database,
    );
    assert.deepStrictEqual(identity({ _tag: "TransportFailure" }), database);
  });
});

describe("describeFailure, what to do next", () => {
  it("every kind has a non-empty help", () => {
    assert.sameMembers(Object.keys(kindHelp), Object.keys(kindExitCode));

    for (const help of Object.values(kindHelp)) {
      assert.isAbove(help.length, 0);
    }
  });

  it("a failure without a help of its own gets the help of its kind", () => {
    assert.strictEqual(describeFailure({ _tag: "TransientFailure" }).help, kindHelp.database);
  });

  it("a RoundtripDiffers names the diff to run", () => {
    const failure = new RoundtripDiffers({ differing: 2, exportDir: "work/export/pkg" });

    assert.include(describeFailure(failure).help, "diff -r");
  });
});

describe("describeFailure, a package id no package has", () => {
  it("a PackageNotFound exits 1 as not-found, with the help of its kind", () => {
    const failure = new PackageNotFound({ packageId: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40" });

    assert.deepStrictEqual(identity(failure), { exitCode: 1, kind: "not-found" });
    assert.strictEqual(describeFailure(failure).help, kindHelp["not-found"]);
  });
});
