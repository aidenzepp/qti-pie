/**
 * The package record, checked as properties: `recordOf` against RFC 4648's base64, and
 * `readPackage`'s refusal of a listed file that a link carries out of the package.
 */
import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, bytes, map } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Layer } from "effect";
import { PackageReadError, readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";

/**
 * The file system `readPackage` needs, and the process spawner and path service beside it.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The package's gitignored `work/`, under which every scratch directory is made.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The canonical form RFC 4648 section 4 gives base64: the 64-letter alphabet in groups of four,
 * the last group padded with `=` to four, and nothing else, so one byte string has one spelling.
 */
const canonicalBase64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;

/**
 * A listing as `readPackage` gives one: up to five files at distinct paths, each byte length
 * drawn across the three remainders modulo 3 that decide base64's padding.
 */
const listingOf: Gen<readonly PackageFile[]> = map(
  array(bytes({ max: 40, min: 0 }), { max: 5, min: 0 }),
  (contents) =>
    contents.map((content, index) => ({
      bytes: content,
      kind: index === 0 ? "manifest" : "file",
      path: index === 0 ? "imsmanifest.xml" : `f/${index}.bin`,
    })),
);

/**
 * Which padding each row's content ends with, the situation base64 encoders get wrong.
 */
const paddingOf = (length: number): "none" | "one" | "two" => {
  const remainder = length % 3;

  if (remainder === 0) {
    return "none";
  }

  return remainder === 2 ? "one" : "two";
};

describe("package/record.ts", () => {
  it.effect(
    "recordOf keeps the listing's order and paths, each content the canonical base64 of its bytes",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<"none" | "one" | "two" | "empty">(["none", "one", "two", "empty"], {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn(listingOf),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "Node's Buffer, a second base64 encoder (RFC 4648 §4), and Uint8Array.fromBase64's round trip",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/package/record",
          },
          (files, c) =>
            Effect.sync(() => {
              const rows = recordOf(files);

              c.noteAll(files.map((file) => paddingOf(file.bytes.length)));
              if (files.length === 0) {
                c.note("empty");
              }

              assert.deepStrictEqual(
                rows.map((row) => row.path),
                files.map((file) => file.path),
              );

              for (const [at, row] of rows.entries()) {
                const original = files[at]?.bytes ?? new Uint8Array();

                // Two oracles: Node's Buffer, a second base64 encoder, and the decode round trip.
                assert.match(row.content, canonicalBase64);
                assert.strictEqual(row.content, Buffer.from(original).toString("base64"));
                assert.deepStrictEqual(
                  Uint8Array.fromBase64(row.content),
                  Uint8Array.from(original),
                );
              }
            }),
        ),
      ),
  );
});

layer(TestLayer, { excludeTestServices: true })("package/read.ts readPackage", (suite) => {
  suite.effect("a listed file reached through a link that leaves the package is entry-path", () =>
    Effect.gen(function* refuseEscape() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const parent = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "record-test-",
      });
      const dir = `${parent}/package`;

      yield* fs.makeDirectory(dir);
      yield* fs.makeDirectory(`${parent}/elsewhere`);
      yield* fs.writeFileString(`${dir}/imsmanifest.xml`, "<manifest/>");
      yield* fs.writeFileString(`${parent}/elsewhere/outside.txt`, "outside");
      yield* fs.symlink(`${parent}/elsewhere`, `${dir}/up`);

      const failure = yield* Effect.flip(readPackage(dir));

      assert.instanceOf(failure, PackageReadError);
      assert.strictEqual(failure.rule, "entry-path");
      assert.strictEqual(failure.path, "up/outside.txt");
    }).pipe(Effect.scoped),
  );
});
