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
import { importPackage } from "#pantry/import/package.ts";
import { previewPackage } from "#pantry/import/preview.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { importAgreesWithOracle, packagingFixtures } from "#pantry/test/locate.ts";
import { danglingIncludeName, materializeProcessing } from "#pantry/test/processing-fixtures.ts";
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

      for (const [name, dir, rules] of [
        [danglingIncludeName, materializeProcessing(danglingIncludeName), ["include-target"]],
        [
          "rtest01-include-target",
          materialize("rtest01-include-target"),
          ["file-exists", "include-target"],
        ],
      ] as const) {
        it.effect(`refuses ${name} by the law its dangling include breaks`, () =>
          // Oracle: the specification as a checker, reading 115: an include whose href names no
          // document the manifest lists is refused under "Include target", the import's own
          // ChangeSet writing its site with no SiteTarget, never by an engine refusal of a write to
          // a document the change does not insert. dangling-include names a file only a resource's
          // file entry lists, so include-target alone refuses it; rtest01-include-target names a
          // file no entry holds, so file-exists refuses it as well, as the law oracle states.
          Effect.gen(function* includeTarget() {
            const refused = yield* Effect.flip(importPackage(yield* dir));

            assert.include(
              rules,
              refused instanceof ImportRefused ? refused.rule : refused._tag,
              name,
            );
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
