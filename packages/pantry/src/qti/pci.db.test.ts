/**
 * Phase 10's PCI fixtures through the importer and the export, on the lease: each positive
 * (`pciNames`) is imported, accepted as the law oracle accepts it, exported and compared with the
 * package it came from, every entry equal. The export reads the stored rows, so it needs the
 * database.
 *
 * The PCI laws' cases and twins are the law oracle's, on the free tier
 * (`#pantry/qti/interactions.oracle.test.ts`), and so are the negatives
 * (`#pantry/qti/pci.oracle.test.ts`).
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Formatter, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { materialize, pciNames } from "#pantry/test/fixtures.ts";
import { importAgreesWithOracle } from "#pantry/test/oracle-verdict.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The folder the positives are exported under, `packages/pantry/work/pci-db`, one scoped folder
 * per export. No other test file writes there.
 */
const exportRoot = path.resolve(import.meta.dirname, "..", "..", "work", "pci-db");

/**
 * Import a package the oracle accepts, failing the test when the importer refuses it.
 *
 * @param dir - The package.
 * @param label - Its name, for the assertion's message.
 * @returns The stored package's id.
 */
const acceptedAsOracle = (dir: string, label: string) =>
  Effect.flatMap(importAgreesWithOracle(dir, label), (id) =>
    Option.match(id, {
      onNone: () => assert.fail(`${label} was refused, as the oracle refuses it`),
      onSome: Effect.succeed,
    }),
  );

describe.skipIf(!hasLease)("pci.db.test.ts, on the lease", { timeout: leaseTestTimeoutMs }, () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
  })("the PCI positives through the importer and the export", (it) => {
    for (const name of pciNames) {
      it.effect(`imports ${name}, exports it and compares it equal`, () =>
        // Oracle: PostgreSQL accepts the package whole, as the law oracle does, and `comparePackage`
        // of the package with the files its export wrote finds every entry equal, which reads no
        // database.
        Effect.gen(function* roundTrips() {
          const fs = yield* FileSystem.FileSystem;
          const dir = yield* materialize(name);
          const id = yield* acceptedAsOracle(dir, name);

          yield* fs.makeDirectory(exportRoot, { recursive: true });

          const target = yield* fs.makeTempDirectoryScoped({ directory: exportRoot, prefix: name });

          yield* exportPackage(id, target);

          const report = yield* comparePackage(dir, target);

          assert.isFalse(
            report.some(({ outcome }) => outcome.kind === "differs"),
            `${name}: ${Formatter.format(report)}`,
          );
        }).pipe(Effect.scoped),
      );
    }
  });
});
