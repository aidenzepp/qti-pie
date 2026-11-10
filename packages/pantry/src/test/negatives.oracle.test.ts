/**
 * The law oracle's prediction for each of phase 5's 60 test-layer negatives ({@link
 * negativeNames}), held to the table `#pantry/test/negatives.ts` pins ({@link expectations}), which
 * the leased import of them (`import/tests.negatives.db.test.ts`) reads too.
 *
 * Each negative is materialized and read as `importAgreesWithOracle` reads a package
 * (`#pantry/test/oracle-verdict.ts` `oracleVerdict`), and its verdict is held to
 * {@link expectations}: the rules the oracle's breaches name, or accepted. The oracle judges every
 * breach of a package, so the import, which refuses a package under the rule of the first object
 * that fails, may name any of the set. The positives these negatives are built over are accepted
 * ({@link positives}), so a set holds only the negative's own breaches.
 *
 * Four negatives are "(direct)" only: their spec is the positive's own, and the leased suite alters
 * the positive's rows by hand because the importer cannot write their breach. Their representation
 * law is superseded (audit A part 5), so the oracle's verdict on each is its positive's, pinned
 * beside it.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as plain, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { readEntries } from "#pantry/package/read.ts";
import { materialize, negativeNames } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { expectations } from "#pantry/test/negatives.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The four "(direct)" negatives, each with the positive its spec is, whose verdict theirs must
 * equal: "superseded representation law (audit A part 5)".
 */
const direct = [
  ["duration-of-item-ref", "test-mapping"],
  ["instance-spelling-canonical", "test-mapping"],
  ["item-prefixed", "test-mapping"],
  ["section-variable-in-test", "test-section-ref"],
] as const satisfies readonly (readonly [(typeof negativeNames)[number], FixtureName])[];

/**
 * The five test-layer positives the oracle once refused, because they broke readings 88, 90, 93,
 * 97, 110 and 115, which landed after them (research 08d145d1). Each is fixed and stays a
 * positive, and the oracle accepts it.
 */
const positives = [
  "test-content",
  "test-include",
  "test-lti",
  "test-mapping",
  "stimulus-301",
] as const satisfies readonly FixtureName[];

/**
 * Materialize a fixture in a root of its own and judge it by the oracle.
 *
 * @param name - The fixture's name.
 * @returns `"accepted"`, or the sorted rules the oracle's breaches name.
 */
const verdictOf = Effect.fn("negatives.oracle.verdictOf")(function* verdictOf(name: FixtureName) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const root = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "negatives-oracle-",
  });
  const config = ConfigProvider.layerAdd(
    ConfigProvider.fromUnknown({ GR8DES_QTI_FIXTURES: root }),
    { asPrimary: true },
  );
  const dir = yield* materialize(name).pipe(Effect.provide(config));
  const verdict = yield* oracleVerdict(yield* readEntries(dir));

  return verdict.kind === "accepted" ? "accepted" : [...verdict.rules].toSorted();
});

describe("test/negatives.oracle.test.ts", () => {
  plain("states each of the 60 negatives once", () => {
    assert.strictEqual(negativeNames.length, 60);
    assert.deepStrictEqual(Object.keys(expectations).toSorted(), [...negativeNames].toSorted());
  });
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the law oracle's prediction for each test-layer negative",
  (it) => {
    for (const name of negativeNames) {
      it.effect(`predicts ${name}`, () =>
        Effect.gen(function* predictsNegative() {
          const { oracle } = expectations[name];

          assert.deepStrictEqual(
            yield* verdictOf(name),
            oracle === "accepted" ? oracle : [...oracle],
            name,
          );
        }).pipe(Effect.scoped),
      );
    }

    for (const name of positives) {
      it.effect(`accepts the positive ${name}`, () =>
        Effect.gen(function* acceptsPositive() {
          assert.strictEqual(yield* verdictOf(name), "accepted", name);
        }).pipe(Effect.scoped),
      );
    }

    for (const [name, base] of direct) {
      it.effect(`judges the "(direct)" ${name} as its positive ${base}`, () =>
        Effect.gen(function* judgesDirect() {
          assert.deepStrictEqual(yield* verdictOf(name), yield* verdictOf(base), name);
        }).pipe(Effect.scoped),
      );
    }
  },
);
