import { createHash } from "node:crypto";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Layer } from "effect";
import { materialize } from "#qti/test/fixtures.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { OracleError, OracleLayer, xmllintC14n } from "#qti/xml/oracle.ts";
import { readXml } from "@qti-pie/crust/read.ts";

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

/**
 * Read `path`, canonicalize it with {@link canonicalize}, and return the bytes beside the oracle's.
 *
 * @param path - An XML file the oracle accepts.
 * @returns The canonicalizer's bytes and `xmllint --c14n`'s bytes for the same file.
 */
const bothCanonicals = Effect.fn("canonical.test.bothCanonicals")(function* bothCanonicals(
  path: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const document = yield* readXml(yield* fs.readFile(path));

  return { actual: canonicalize(document), expected: yield* xmllintC14n(path) };
});

/**
 * Decode canonical bytes as UTF-8 so a mismatch reads as text.
 */
const decodeText = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

/**
 * Assert that two byte arrays are equal, showing the text first so a mismatch is readable.
 */
const assertSameBytes = (actual: Uint8Array, expected: Uint8Array): void => {
  assert.strictEqual(decodeText(actual), decodeText(expected));
  assert.deepStrictEqual([...actual], [...expected]);
};

layer(TestLayer)("xml/canonical.ts", (it) => {
  it.effect("simple's choice.xml canonicalizes to the oracle's bytes", () =>
    Effect.gen(function* choice() {
      const { actual, expected } = yield* bothCanonicals(`${simple}/choice.xml`);

      assert.isAbove(expected.length, 0);
      assertSameBytes(actual, expected);
    }),
  );

  it.effect("simple's imsmanifest.xml canonicalizes to the oracle's bytes", () =>
    Effect.gen(function* manifest() {
      const { actual, expected } = yield* bothCanonicals(`${simple}/imsmanifest.xml`);

      assert.isAbove(expected.length, 0);
      assertSameBytes(actual, expected);
    }),
  );

  for (const name of ["doctype", "latin1"] as const) {
    it.effect(`the ${name} fixture canonicalizes to the oracle's bytes`, () =>
      Effect.gen(function* variant() {
        const directory = yield* materialize(name);
        const { actual, expected } = yield* bothCanonicals(`${directory}/choice.xml`);

        assert.isAbove(expected.length, 0);
        assertSameBytes(actual, expected);
      }),
    );
  }

  // These four files are copies of crust's `src/fixtures/dtd/`: no package reads another package's files.
  for (const file of ["markup", "attr-ws", "attlist-nmtokens", "quote"]) {
    it.effect(`fixtures/dtd/${file}.xml canonicalizes to the oracle's bytes`, () =>
      Effect.gen(function* dtdFixture() {
        const { actual, expected } = yield* bothCanonicals(
          `${import.meta.dirname}/fixtures/dtd/${file}.xml`,
        );

        assert.isAbove(expected.length, 0);
        assertSameBytes(actual, expected);
      }),
    );
  }

  it.effect("the external fixture canonicalizes to the golden bytes, without the oracle", () =>
    Effect.gen(function* external() {
      const fs = yield* FileSystem.FileSystem;
      const directory = yield* materialize("external");
      const document = yield* readXml(yield* fs.readFile(`${directory}/choice.xml`));
      const golden = yield* fs.readFile(`${import.meta.dirname}/fixtures/golden/external.c14n`);

      assert.isAbove(golden.length, 0);
      assertSameBytes(canonicalize(document), golden);
    }),
  );
});
