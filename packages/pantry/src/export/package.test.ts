import path from "node:path";
import {
  NodeChildProcessSpawner,
  NodeFileSystem,
  NodePath,
  NodeServices,
} from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Console, Effect, Exit, FileSystem, Layer, Stdio } from "effect";
import { Command } from "effect/cli";
import { describe } from "vitest";
import { cli } from "#pantry/cli.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage, renderReport } from "#pantry/export/compare.ts";
import type { Report } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * What every test here runs on: the file system the comparison and the fixture materializer need,
 * and the process spawner `xmllint` and the materializer's `tar` and `unzip` need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory every scratch directory is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The directory `materialize("simple")` returned, set once by `beforeAll`.
 */
let SIMPLE = "";

/**
 * The directory `materialize("latin1")` returned, set once by `beforeAll`.
 */
let LATIN1 = "";

beforeAll(() =>
  Effect.gen(function* materializeFixtures() {
    SIMPLE = yield* materialize("simple");
    LATIN1 = yield* materialize("latin1");
  }).pipe(Effect.provide(TestLayer)),
);

layer(TestLayer, { excludeTestServices: true })("export/compare.ts, database-free", (it) => {
  it.effect("comparing simple with itself is all equal", () =>
    Effect.gen(function* compareSelf() {
      const report = yield* comparePackage(SIMPLE, SIMPLE);

      assert.deepStrictEqual(report, [
        { outcome: { kind: "canonical-equal" }, path: "choice.xml" },
        { outcome: { kind: "byte-identical" }, path: "images/sign.png" },
        { outcome: { kind: "canonical-equal" }, path: "imsmanifest.xml" },
      ]);
      assert.isTrue(renderReport(report).endsWith("\nall equal"));
    }),
  );

  it.effect(
    "the report renders one line per entry and a last line that counts the differences",
    () =>
      Effect.gen(function* renderMixed() {
        const text = renderReport([
          { outcome: { kind: "canonical-equal" }, path: "a.xml" },
          { outcome: { at: "missing", kind: "differs" }, path: "b.png" },
          { outcome: { kind: "byte-identical" }, path: "c.png" },
        ]);

        assert.strictEqual(
          text,
          "a.xml: canonical-equal\nb.png: differs at missing\nc.png: byte-identical\n1 differ",
        );
        yield* Effect.void;
      }),
  );

  it.effect("comparing simple with the latin1 fixture reports choice.xml as differing", () =>
    Effect.gen(function* compareLatin1() {
      const report = yield* comparePackage(SIMPLE, LATIN1);
      const outcome = (entry: string) => report.find((item) => item.path === entry)?.outcome;

      assert.strictEqual(outcome("choice.xml")?.kind, "differs");
      assert.strictEqual(outcome("imsmanifest.xml")?.kind, "canonical-equal");
      assert.strictEqual(outcome("images/sign.png")?.kind, "byte-identical");
      assert.isTrue(renderReport(report).endsWith("\n1 differ"));
    }),
  );

  it.effect("a sign.png with one byte changed differs at that byte offset", () =>
    Effect.gen(function* compareChangedPng() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const parent = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "export-compare-test-",
      });
      const copy = `${parent}/package`;

      yield* fs.copy(SIMPLE, copy);

      const png = yield* fs.readFile(`${copy}/images/sign.png`);
      const changed = Uint8Array.from(png);

      changed[1234] = ((changed[1234] ?? 0) + 1) % 256;
      yield* fs.writeFile(`${copy}/images/sign.png`, changed);

      const report = yield* comparePackage(SIMPLE, copy);

      assert.deepStrictEqual(report.find((item) => item.path === "images/sign.png")?.outcome, {
        at: "byte 1234",
        kind: "differs",
      });
      assert.strictEqual(report.filter((item) => item.outcome.kind === "differs").length, 1);
    }),
  );

  it.effect("an entry missing from the export differs at missing", () =>
    Effect.gen(function* compareMissing() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const parent = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "export-compare-test-",
      });
      const copy = `${parent}/package`;

      yield* fs.copy(SIMPLE, copy);
      yield* fs.remove(`${copy}/images/sign.png`);

      const report = yield* comparePackage(SIMPLE, copy);

      assert.deepStrictEqual(report.find((item) => item.path === "images/sign.png")?.outcome, {
        at: "missing",
        kind: "differs",
      });
    }),
  );
});

/**
 * The fixtures whose import is accepted and whose export is compared with them.
 */
const roundTripped = [
  "simple",
  "doctype",
  "latin1",
  "external",
  "utf16",
  "windows-1252",
  "padded-attributes",
  "padded-text",
  "padded-identifier-value",
  "comment-in-element",
] as const satisfies readonly FixtureName[];

/**
 * Import a fixture, export it to `work/export/<name>/`, compare the export with the fixture, and
 * leave the rendered report beside it in `work/export/<name>.report.txt`.
 *
 * @param name - The fixture to round-trip.
 * @returns The export directory and the report.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const exported = `${workDirectory}/export/${name}`;
    const id = yield* importPackage(source);

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    yield* fs.writeFileString(`${exported}.report.txt`, `${renderReport(report)}\n`);

    return { exported, report };
  });

/**
 * The outcome kind of one entry of a report.
 */
const kindOf = (report: Report, entry: string) =>
  report.find((item) => item.path === entry)?.outcome.kind;

/**
 * Run the command line on `args` with the console captured, in place of writing to the terminal.
 *
 * @param args - The command line after the program name.
 * @returns How the run ended, and what it wrote with `log` (standard output) and with `error`
 *   (standard error), each joined by line feeds.
 */
const runCli = Effect.fn("export/package.test.runCli")(function* runCli(args: readonly string[]) {
  const out: string[] = [];
  const err: string[] = [];
  const exit = yield* Command.run(cli, { version: "0.0.0" }).pipe(
    Effect.provide(Stdio.layerTest({ args: Effect.succeed(args) })),
    Effect.provideService(
      Console.Console,
      Object.assign(Object.create(console), {
        error: (...parts: readonly unknown[]): void => {
          err.push(parts.join(" "));
        },
        log: (...parts: readonly unknown[]): void => {
          out.push(parts.join(" "));
        },
      }),
    ),
    Effect.exit,
  );

  return { exit, stderr: err.join("\n"), stdout: out.join("\n") };
});

describe.skipIf(!hasLease)(
  "export/package.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("export/package.ts on the lease", (it) => {
      for (const name of roundTripped) {
        it.effect(`${name} round-trips through the database, every entry equal`, () =>
          Effect.gen(function* roundTripEqual() {
            const { report } = yield* roundTrip(name);

            assert.strictEqual(
              report.filter((item) => item.outcome.kind === "differs").length,
              0,
              renderReport(report),
            );
            assert.strictEqual(kindOf(report, "images/sign.png"), "byte-identical");
            assert.strictEqual(kindOf(report, "imsmanifest.xml"), "canonical-equal");
            assert.strictEqual(kindOf(report, "choice.xml"), "canonical-equal");
          }),
        );
      }

      it.effect("sharedMedia round-trips: its two items and manifest are canonical-equal", () =>
        Effect.gen(function* sharedMediaRoundTrip() {
          const { report } = yield* roundTrip("sharedMedia");

          assert.strictEqual(
            report.filter((item) => item.outcome.kind === "differs").length,
            0,
            renderReport(report),
          );
          assert.strictEqual(kindOf(report, "imsmanifest.xml"), "canonical-equal");
          assert.strictEqual(kindOf(report, "example/graphic_order.xml"), "canonical-equal");
          assert.strictEqual(kindOf(report, "example/hotspot.xml"), "canonical-equal");
          assert.strictEqual(kindOf(report, "example/ukair.png"), "byte-identical");
          assert.strictEqual(report.length, 4);
        }),
      );

      it.effect("the roundtrip command on sharedMedia prints the same report", () =>
        Effect.gen(function* sharedMediaCli() {
          const source = yield* materialize("sharedMedia");
          const { report } = yield* roundTrip("sharedMedia");
          const { exit, stderr, stdout } = yield* runCli(["roundtrip", "--yes", source]);

          assert.isTrue(Exit.isSuccess(exit), stderr);
          assert.strictEqual(stdout, renderReport(report));
          assert.strictEqual(stdout.split("\n").at(-1), "all equal");
        }),
      );

      it.effect("the latin1 export writes the euro sign as &#x20AC; and 0x85 as one byte", () =>
        Effect.gen(function* latin1Bytes() {
          const fs = yield* FileSystem.FileSystem;
          const { exported } = yield* roundTrip("latin1");
          const bytes = yield* fs.readFile(`${exported}/choice.xml`);

          assert.strictEqual(bytes.filter((byte) => byte === 0x85).length, 1);
          assert.include(Buffer.from(bytes).toString("latin1"), "&#x20AC;");
        }),
      );

      it.effect("the windows-1252 export is UTF-8 and declares UTF-8", () =>
        Effect.gen(function* windows1252Bytes() {
          const fs = yield* FileSystem.FileSystem;
          const { exported } = yield* roundTrip("windows-1252");
          const bytes = yield* fs.readFile(`${exported}/choice.xml`);
          const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

          assert.include(text.slice(0, text.indexOf("?>")), 'encoding="UTF-8"');
        }),
      );
    });
  },
);
