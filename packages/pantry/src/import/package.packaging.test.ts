/**
 * The packaging fixtures on the lease (the spec's 4.12 to 4.14), PostgreSQL the judge: each
 * fixture's verdict is the law oracle's (`#pantry/test/locate.ts`, a second implementation), and a
 * package read from its zip writes the same rows as the same package read from its directory.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { previewPackage } from "#pantry/import/preview.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { importAgreesWithOracle, packagingFixtures } from "#pantry/test/locate.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

describe.skipIf(!hasLease)(
  "import/package.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("importPackage of the packaging fixtures on the lease", (it) => {
      for (const name of packagingFixtures) {
        it.effect(`gives ${name} the law oracle's verdict`, () =>
          // Oracle: a second implementation, the law oracle's verdict over the same entries.
          Effect.gen(function* oracleAgrees() {
            yield* importAgreesWithOracle(yield* materialize(name), name);
          }),
        );
      }

      it.effect("imports simple from its zip and from its directory as the same rows", () =>
        // Oracle: a universal one, a metamorphic relation: a zip and a directory of the same files
        // read as the same entries, so their imports write the same rows (the dry run's counts) and
        // both are accepted, each a package of its own.
        Effect.gen(function* sameRows() {
          const zip = yield* materializeZip("simple");
          const directory = yield* materialize("simple");
          const fromZip = yield* importAgreesWithOracle(zip, "simple.zip");
          const fromDirectory = yield* importAgreesWithOracle(directory, "simple");

          assert.isTrue(Option.isSome(fromZip) && Option.isSome(fromDirectory));
          assert.notStrictEqual(
            Option.getOrUndefined(fromZip),
            Option.getOrUndefined(fromDirectory),
          );
          assert.deepStrictEqual(yield* previewPackage(zip), yield* previewPackage(directory));
        }),
      );
    });
  },
);
