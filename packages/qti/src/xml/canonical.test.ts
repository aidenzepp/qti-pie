import { createHash } from "node:crypto";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import { materialize } from "#qti/test/fixtures.ts";
import { OracleError, OracleLayer, xmllintC14n } from "#qti/xml/oracle.ts";

/**
 * What every test here runs on: the process spawner `xmllintC14n` needs and the file system and
 * path services that spawner and the fixture materializer need.
 */
const TestLayer = OracleLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory `materialize("simple")` returned, set once by `beforeAll`.
 */
let simple = "";

/**
 * Hash bytes the way the spec quotes canonical forms.
 *
 * @param bytes - The bytes to hash.
 * @returns The 64 lower-case hex digits of their sha256.
 */
const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

beforeAll(() =>
  Effect.gen(function* materializeSimple() {
    simple = yield* materialize("simple");
  }).pipe(Effect.provide(TestLayer)),
);

layer(TestLayer)("xml/oracle.ts", (it) => {
  it.effect("the canonical form of simple's choice.xml has the recorded hash", () =>
    Effect.gen(function* choiceHash() {
      const canonical = yield* xmllintC14n(`${simple}/choice.xml`);

      assert.isTrue(sha256(canonical).startsWith("bd3a50514b81a896"));
    }),
  );

  it.effect("the canonical form of simple's imsmanifest.xml has the recorded hash", () =>
    Effect.gen(function* manifestHash() {
      const canonical = yield* xmllintC14n(`${simple}/imsmanifest.xml`);

      assert.isTrue(sha256(canonical).startsWith("c9e725ed181c63f0"));
    }),
  );

  it.effect(
    "a file that does not exist fails as OracleError with xmllint's exit code and message",
    () =>
      Effect.gen(function* missingFile() {
        const failure = yield* Effect.flip(xmllintC14n(`${simple}/missing.xml`));

        assert.instanceOf(failure, OracleError);
        assert.notStrictEqual(failure.exitCode, 0);
        assert.include(failure.stderr, "missing.xml");
      }),
  );

  it.effect("an executable named by XMLLINT that exits non-zero fails as OracleError", () =>
    Effect.gen(function* configuredExecutable() {
      const failure = yield* Effect.flip(xmllintC14n(`${simple}/choice.xml`)).pipe(
        Effect.provide(
          ConfigProvider.layer(ConfigProvider.fromUnknown({ XMLLINT: "/usr/bin/false" })),
        ),
      );

      assert.instanceOf(failure, OracleError);
      assert.strictEqual(failure.exitCode, 1);
    }),
  );
});
