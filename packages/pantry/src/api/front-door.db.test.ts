/**
 * The front door, on the lease: an app's whole use of pantry through `@qti-pie/pantry` alone (GOAL
 * "Implementation shape" item 1, spec U16). The test builds the author login's runtime itself, as
 * an app does at grizzle `b927d99`: it reads the served file `grizzle generate` writes for the
 * installation, serves the login from it with grizzle's `served`, and provides that login's
 * `DbLayer` and `ServedAuthorLogin`. It then runs the operator's script: an accepted corpus zip
 * from its bytes, a QTI-invalid fixture refused at the `Qti` level, the new package found by paging
 * `listPackages`, its documents listed, and one document read and compared with the export.
 *
 * Every program and name of pantry's it uses is imported from the package's own name. Only the
 * cluster's connection, the served file's path and the fixtures come from inside the package: they
 * are this checkout's, which an app supplies from its own installation.
 */
import { DbLayer, roleNameOf, served } from "@bjornpagen/grizzle/runtime";
import type { PoolBounds } from "@bjornpagen/grizzle/runtime";
import type { Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option, Schema, Stream } from "effect";
import { describe } from "vitest";
import {
  exportPackage,
  importPackage,
  listDocuments,
  listPackages,
  readDocument,
  ServedAuthorLogin,
} from "@qti-pie/pantry";
import type { AuthorLogin } from "@qti-pie/pantry";
import { loginConnection } from "#pantry/db/connection.ts";
import { servedPath } from "#pantry/db/served.ts";
import { scannedRows } from "#pantry/export/pages.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The pool an app states for its author login: grizzle states no bounds of its own, so the caller
 * names every one. These are the bounds `#pantry/db/layer.ts` gives pantry's own pool.
 */
const frontDoorPool: PoolBounds = { idleTimeoutMs: 5000, max: 10, min: 1 };

/**
 * The author login's runtime, built as an app builds it: the served file this checkout's
 * `grizzle generate` wrote for the `author_app` login, read and parsed as JSON, served as the
 * login's type (`served<AuthorLogin>`), and its `DbLayer` over the login's connection to the local
 * cluster (the role `roleNameOf` names, which `scripts/db.sh migrate` gives a password). Beside the
 * layer it provides `ServedAuthorLogin`, the same served login, whose author role each program
 * opens its `Db` on.
 *
 * The served file is read when the layer is built, never when the file loads, so a run without a
 * lease opens no file.
 */
const frontDoorLayer = Layer.unwrap(
  Effect.gen(function* frontDoorLayer() {
    const fs = yield* FileSystem.FileSystem;
    const connectionOf = yield* loginConnection;
    const file = yield* fs
      .readFileString(servedPath)
      .pipe(Effect.flatMap(Schema.decodeUnknownEffect(Schema.fromJsonString(Schema.Json))));
    const login = served<AuthorLogin>(file, "author_app");

    return Layer.merge(
      DbLayer.make({ ...connectionOf(roleNameOf(login)), login, pool: frontDoorPool }),
      Layer.succeed(ServedAuthorLogin, login),
    );
  }),
).pipe(Layer.provide(NodeServices.layer));

/**
 * The accepted corpus package the script imports: `simple` from the examples tarball, which the
 * committed verdict file records as accepted.
 */
const acceptedZip = "simple";

/**
 * The documents `simple.zip` holds, sorted: its manifest and its one item. Its third entry,
 * `images/sign.png`, is no document.
 */
const acceptedDocuments = ["choice.xml", "imsmanifest.xml"];

/**
 * The item document of {@link acceptedZip} the script reads.
 */
const itemPath = "choice.xml";

/**
 * The QTI-invalid fixture the script imports: a test with no test part, which the `Qti` level
 * refuses (`#pantry/test/negatives.ts`).
 */
const invalidFixture = "test-no-part";

/**
 * The page size the listing walk asks for: one, so each stored package is a page of its own and
 * the walk follows the cursors whenever the database holds more than the one package it looks for.
 */
const listingPageSize = 1;

/**
 * The page size the document listing asks for, larger than any package's document count.
 */
const documentPageSize = 100;

/**
 * Page `listPackages` from the first page until a listing has the package's id, and stop there.
 *
 * @param packageId - The id the import's verdict gave.
 * @returns The package's listing, or none when no page holds it.
 */
const findPackage = (packageId: Uuid) =>
  scannedRows((request) => listPackages(request), listingPageSize).pipe(
    Stream.filter((listing) => listing.id === packageId),
    Stream.runHead,
  );

/**
 * Page `listDocuments` of a package to its end.
 *
 * @param packageId - The package whose documents to list.
 * @returns Every listing of the package's documents.
 */
const documentsOf = (packageId: Uuid) =>
  Stream.runCollect(scannedRows((request) => listDocuments(packageId, request), documentPageSize));

describe.skipIf(!hasLease)(
  "api/front-door.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(frontDoorLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("an app's script through @qti-pie/pantry", (it) => {
      it.effect(
        "accepts a corpus zip from its bytes, then lists, reads and exports the package",
        () =>
          Effect.gen(function* acceptedScript() {
            const fs = yield* FileSystem.FileSystem;
            const bytes = yield* fs.readFile(yield* materializeZip(acceptedZip));
            const verdict = yield* importPackage({ bytes, name: `${acceptedZip}.zip` });

            if (verdict.verdict !== "accepted") {
              assert.fail(`${acceptedZip}: refused under ${verdict.refusal.rule}`);
            }

            const { packageId } = verdict;
            const listing = yield* findPackage(packageId);

            assert.isTrue(Option.isSome(listing), "no page of listPackages holds the new package");

            const documents = yield* documentsOf(packageId);

            assert.deepStrictEqual(
              documents.map((document) => document.path).toSorted(),
              acceptedDocuments,
            );
            for (const document of documents) {
              assert.strictEqual(document.package, packageId, document.path);
            }

            const read = yield* readDocument(packageId, itemPath);
            const exported = (yield* exportPackage(packageId)).find(
              (entry) => entry.path === itemPath,
            );

            assert.isDefined(exported, `the export holds no ${itemPath}`);
            assert.deepStrictEqual(read, exported?.bytes);
          }),
      );

      it.effect("refuses a QTI-invalid fixture at the Qti level", () =>
        Effect.gen(function* refusedScript() {
          const verdict = yield* importPackage(yield* materialize(invalidFixture));

          if (verdict.verdict !== "refused") {
            assert.fail(`${invalidFixture}: accepted as ${verdict.packageId}`);
          }

          assert.strictEqual(verdict.refusal.kind, "qti");
          assert.strictEqual(verdict.refusal.level, "Qti");
        }),
      );
    });
  },
);
