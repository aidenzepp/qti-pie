import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, Effect, Exit, FileSystem, Layer, Schema } from "effect";
import { describe, inject } from "vitest";
import { TargetNotEmpty } from "#qti/cli/args.ts";
import { describeFailure } from "#qti/cli/errors.ts";
import { ExportData } from "#qti/cli/export.ts";
import { ErrorObject, successEnvelope } from "#qti/cli/output.ts";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { PackageNotFound } from "#qti/export/package.ts";
import { importPackage } from "#qti/import/package.ts";
import { exitCodeOf } from "#qti/cli/run.ts";
import { captureCli } from "#qti/test/cli.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

const fixtures = inject("fixtures");

/**
 * The folder every case here works under, `packages/qti/work/cli-export-db`. Each case uses its own
 * folders under it, and no other test file writes there.
 */
const root = path.resolve(import.meta.dirname, "..", "..", "work", "cli-export-db");

/**
 * A well-formed package id that no test here ever imports, so the lease database holds no package
 * with it.
 */
const absentId = "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40";

/**
 * The envelope of `export`, as a reader decodes it from a line of standard output.
 */
const exportEnvelope = Schema.fromJsonString(successEnvelope("export", ExportData));

/**
 * Make `work/cli-export-db/<name>` an empty folder and return it.
 */
const fresh = Effect.fn("test.export.db.fresh")(function* fresh(name: string) {
  const fs = yield* FileSystem.FileSystem;
  const folder = path.join(root, name);

  yield* fs.remove(folder, { force: true, recursive: true });
  yield* fs.makeDirectory(folder, { recursive: true });

  return folder;
});

/**
 * The files under `folder`, as paths relative to it, in order.
 */
const filesUnder = Effect.fn("test.export.db.filesUnder")(function* filesUnder(folder: string) {
  const fs = yield* FileSystem.FileSystem;
  const found = yield* fs.readDirectory(folder, { recursive: true });
  const files: string[] = [];

  for (const entry of found) {
    if ((yield* fs.stat(path.join(folder, entry))).type === "File") {
      files.push(entry);
    }
  }

  return files.toSorted();
});

describe.skipIf(!hasLease)(
  "cli/export.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("export on the lease", (it) => {
      it.effect("--dry-run writes nothing and lists the files a real export writes", () =>
        Effect.gen(function* dryRunLists() {
          const fs = yield* FileSystem.FileSystem;
          const folder = yield* fresh("dry-run");
          const absent = path.join(folder, "absent");
          const real = path.join(folder, "real");
          const id = yield* importPackage(fixtures.simple);

          const text = yield* captureCli(["export", "--dry-run", absent, id]);

          assert.isTrue(Exit.isSuccess(text.exit), text.stderr);
          assert.isFalse(yield* fs.exists(absent));

          const json = yield* captureCli(["--json", "export", "--dry-run", absent, id]);
          const written = yield* captureCli(["export", real, id]);

          assert.isTrue(Exit.isSuccess(json.exit), json.stderr);
          assert.isTrue(Exit.isSuccess(written.exit), written.stderr);
          assert.isFalse(yield* fs.exists(absent));

          const { data } = Schema.decodeUnknownSync(exportEnvelope)(json.stdout);

          assert.isTrue("dry_run" in data);
          assert.deepStrictEqual(
            data.entries.map((entry) => entry.path).toSorted(),
            yield* filesUnder(real),
          );
        }),
      );

      it.effect(
        "--json --dry-run decodes with the envelope and says the target would be created",
        () =>
          Effect.gen(function* dryRunJson() {
            const folder = yield* fresh("dry-run-json");
            const absent = path.join(folder, "absent");
            const id = yield* importPackage(fixtures.simple);
            const { exit, stderr, stdout } = yield* captureCli([
              "--json",
              "export",
              "--dry-run",
              absent,
              id,
            ]);

            assert.isTrue(Exit.isSuccess(exit), stderr);
            assert.strictEqual(stdout.split("\n").length, 1);

            const envelope = Schema.decodeUnknownSync(exportEnvelope)(stdout);

            assert.isTrue(envelope.ok);
            assert.deepStrictEqual(
              { ...envelope.data, entries: undefined },
              {
                dry_run: true,
                entries: undefined,
                package_id: id,
                target: absent,
                target_action: "create",
              },
            );
          }),
      );

      it.effect("--dry-run onto a non-empty folder without --yes refuses and writes nothing", () =>
        Effect.gen(function* dryRunRefused() {
          const fs = yield* FileSystem.FileSystem;
          const folder = yield* fresh("dry-run-refused");
          const id = yield* importPackage(fixtures.simple);
          const file = path.join(folder, "a.txt");

          yield* fs.writeFileString(file, "kept");

          const { exit } = yield* captureCli(["export", "--dry-run", folder, id]);
          const failure = Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;

          assert.instanceOf(failure, TargetNotEmpty);
          assert.strictEqual(describeFailure(failure).kind, "target-not-empty");
          assert.strictEqual(exitCodeOf(exit), 1);
          assert.deepStrictEqual(yield* fs.readDirectory(folder), ["a.txt"]);
          assert.strictEqual(yield* fs.readFileString(file), "kept");
        }),
      );

      it.effect("--yes --dry-run onto a non-empty folder reports replace and writes nothing", () =>
        Effect.gen(function* dryRunReplace() {
          const fs = yield* FileSystem.FileSystem;
          const folder = yield* fresh("dry-run-replace");
          const id = yield* importPackage(fixtures.simple);
          const file = path.join(folder, "a.txt");

          yield* fs.writeFileString(file, "kept");

          const { exit, stderr, stdout } = yield* captureCli([
            "--json",
            "export",
            "--yes",
            "--dry-run",
            folder,
            id,
          ]);

          assert.isTrue(Exit.isSuccess(exit), stderr);

          const { data } = Schema.decodeUnknownSync(exportEnvelope)(stdout);

          assert.strictEqual("target_action" in data ? data.target_action : undefined, "replace");
          assert.deepStrictEqual(yield* fs.readDirectory(folder), ["a.txt"]);
          assert.strictEqual(yield* fs.readFileString(file), "kept");
        }),
      );

      it.effect("--yes onto a symlink replaces the link and leaves what it pointed to", () =>
        Effect.gen(function* replacesLink() {
          const fs = yield* FileSystem.FileSystem;
          const folder = yield* fresh("link");
          const linked = path.join(folder, "linked");
          const link = path.join(folder, "link");
          const id = yield* importPackage(fixtures.simple);

          yield* fs.makeDirectory(linked, { recursive: true });
          yield* fs.writeFileString(path.join(linked, "kept.txt"), "kept");
          yield* fs.symlink(linked, link);

          const { exit, stderr } = yield* captureCli(["export", "--yes", link, id]);

          assert.isTrue(Exit.isSuccess(exit), stderr);
          assert.strictEqual((yield* fs.lstat(link)).type, "Directory");
          assert.include(yield* filesUnder(link), "imsmanifest.xml");
          assert.deepStrictEqual(yield* filesUnder(linked), ["kept.txt"]);
          assert.strictEqual(yield* fs.readFileString(path.join(linked, "kept.txt")), "kept");
        }),
      );

      it.effect.each([
        { command: ["export"], name: "export" },
        { command: ["export", "--dry-run"], name: "export --dry-run" },
      ])(
        "$name of a package id no package has fails as not-found, exit 1, naming the id",
        ({ command, name }) =>
          Effect.gen(function* absentPackage() {
            const fs = yield* FileSystem.FileSystem;
            const folder = yield* fresh(`absent-${name.replace(" ", "-")}`);
            const target = path.join(folder, "target");
            const { exit, stderr } = yield* captureCli([...command, target, absentId]);
            const failure = Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;

            assert.strictEqual(exitCodeOf(exit), 1);
            assert.instanceOf(failure, PackageNotFound);
            assert.strictEqual(
              failure instanceof PackageNotFound ? failure.packageId : "",
              absentId,
            );
            assert.strictEqual(describeFailure(failure).kind, "not-found");
            assert.isTrue(stderr.startsWith("error[not-found]:"), stderr);
            assert.include(stderr, absentId);
            assert.notInclude(stderr, "error[internal]");
            assert.isFalse(yield* fs.exists(target));
          }),
      );

      it.effect(
        "--yes onto a folder holding a file, of a package id no package has, keeps it",
        () =>
          Effect.gen(function* absentPackageKeeps() {
            const fs = yield* FileSystem.FileSystem;
            const folder = yield* fresh("absent-yes");
            const target = path.join(folder, "target");
            const file = path.join(target, "a.txt");

            yield* fs.makeDirectory(target, { recursive: true });
            yield* fs.writeFileString(file, "kept");

            const { exit } = yield* captureCli(["export", "--yes", target, absentId]);
            const failure = Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;

            assert.strictEqual(exitCodeOf(exit), 1);
            assert.strictEqual(describeFailure(failure).kind, "not-found");
            assert.strictEqual(yield* fs.readFileString(file), "kept");
            assert.deepStrictEqual(yield* fs.readDirectory(target), ["a.txt"]);
            assert.deepStrictEqual(yield* fs.readDirectory(folder), ["target"]);
          }),
      );

      it.effect(
        "--json export --dry-run of a package id no package has prints one error object",
        () =>
          Effect.gen(function* absentPackageJson() {
            const folder = yield* fresh("absent-json");
            const { exit, stderr } = yield* captureCli([
              "--json",
              "export",
              "--dry-run",
              path.join(folder, "target"),
              absentId,
            ]);

            assert.strictEqual(exitCodeOf(exit), 1);
            assert.strictEqual(stderr.trimEnd().split("\n").length, 1);

            const error = Schema.decodeUnknownSync(Schema.fromJsonString(ErrorObject))(stderr);

            assert.strictEqual(error.kind, "not-found");
            assert.strictEqual(error.exit_code, 1);
          }),
      );
    });
  },
);
