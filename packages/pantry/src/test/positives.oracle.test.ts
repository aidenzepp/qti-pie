import { existsSync } from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readPackage } from "#pantry/package/read.ts";
import {
  catalogNames,
  companionNames,
  examplesTarball,
  materialize,
  pciNames,
} from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { judge, lawsOf, shownBreach, verdictOf } from "#pantry/test/oracle.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * Whether the examples tarball, which every positive here is cut or edited from, is on this
 * machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * The positives held to the law oracle: the catalog and companion-materials positives (decision
 * 447) and the PCI positives (decision 446). A positive the oracle refuses fails here, without a
 * lease.
 */
const positiveNames: readonly FixtureName[] = [...catalogNames, ...companionNames, ...pciNames];

/**
 * The composed grammar every positive is judged by, composed once for the whole file.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the law oracle reads, derived from {@link grammar}.
 */
const laws = lawsOf(grammar);

/**
 * Materialize a fixture in a root of its own and read its package.
 *
 * @param name - The fixture's name.
 * @returns The package's entries, as `readPackage` reads them.
 */
const packageOf = Effect.fn("positives.packageOf")(function* packageOf(name: FixtureName) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const root = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "positives-",
  });
  const config = ConfigProvider.layerAdd(
    ConfigProvider.fromUnknown({ GR8DES_QTI_FIXTURES: root }),
    { asPrimary: true },
  );
  const dir = yield* materialize(name).pipe(Effect.provide(config));

  return yield* readPackage(dir);
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the catalog, companion and PCI positives (skipped without the examples tarball)",
  (it) => {
    for (const name of positiveNames) {
      it.effect.skipIf(!tarballPresent)(`${name} is accepted by the law oracle`, () =>
        Effect.gen(function* positive() {
          const judgment = yield* judge(yield* packageOf(name), grammar, laws);

          if (judgment._tag === "CodecRefusal") {
            assert.fail(`the codec refused ${name}: ${judgment.rule}, ${judgment.detail}`);
          }

          assert.deepStrictEqual(
            judgment.breaches.map(({ law }) => law),
            [],
            `${name}: ${judgment.breaches.map((breach) => shownBreach(breach, grammar)).join("\n")}`,
          );
          assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });
        }).pipe(Effect.scoped),
      );
    }
  },
);
