import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Console, Duration, Effect, FileSystem, Layer, Option, Schema } from "effect";
import { describe } from "vitest";
import { RoundtripData } from "#qti/cli/roundtrip.ts";
import { ErrorObject, successEnvelope } from "#qti/cli/output.ts";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { importPackage } from "#qti/import/package.ts";
import { spawnCli } from "#qti/test/cli.ts";
import { materializeCorpus } from "#qti/test/fixtures.ts";
import { hasLease, settings } from "#qti/test/settings.ts";

/**
 * The timeout, in milliseconds, for one corpus package: an import and an export in process, then
 * the CLI's own `roundtrip` of the same package as a child process.
 *
 * Measured on 2026-11-03 at `15ab803` on a lease, over the 28 corpus packages with the CLI's
 * default `--timeout`: the slowest case was `simple` at 27.58 s (`sharedMedia` 27.45 s, `svg` 27.13
 * s), the accepted packages' round trip through the CLI, and a refused package took 13.9 to 18.0 s,
 * nearly all of it the child's start and the layer's build. The budget is the larger of twice the
 * slowest case (55.2 s) and 120 s, the floor the slice sets. Raise it only on a new measurement
 * recorded here, never to make a run pass.
 */
const corpusCaseTimeoutMs = 120_000;

/**
 * The folder every case's scratch lives under, `packages/qti/work/cli-corpus`; each package has a
 * folder of its own under it, named for the package, so no two cases share a path.
 */
const scratchRoot = path.resolve(import.meta.dirname, "..", "work", "cli-corpus");

/**
 * The corpus's packages when `GR8DES_CORPUS=1` and a lease is held, and none otherwise.
 *
 * Vitest declares a file's cases before any runs, so the corpus's names are listed while the file
 * is collected; a run without both settings never opens the tarball. Each `dir` is a corpus `.zip`
 * file.
 */
const corpus =
  hasLease && settings.corpusRequested
    ? await Effect.runPromise(materializeCorpus().pipe(Effect.provide(NodeServices.layer)))
    : [];

/**
 * The envelope `roundtrip` prints under `--json`, as a reader decodes it from standard output.
 */
const roundtripEnvelope = Schema.fromJsonString(successEnvelope("roundtrip", RoundtripData));

/**
 * A line of standard error as an {@link ErrorObject}, or none when it is anything else.
 */
const errorObjectOf = Schema.decodeUnknownOption(Schema.fromJsonString(ErrorObject));

/**
 * Whether a string is a UUID, the shape of a package's id.
 */
const isUuid = Schema.is(Schema.String.check(Schema.isUUID()));

/**
 * The packages the importer refused, with the rule each broke.
 */
const refusals: { readonly name: string; readonly rule: string }[] = [];

/**
 * What the cases so far found, kept in the file's scope: vitest runs a file's cases in order, and
 * the last case reads this.
 */
const tally = {
  accepted: 0,
  equalEntries: 0,
  refused: refusals,
  slowestImport: { millis: 0, name: "" },
  slowestRoundtrip: { millis: 0, name: "" },
};

/**
 * The lines of standard error that decode as an {@link ErrorObject}; any other line is not counted.
 */
const errorObjectsOf = (stderr: string) =>
  stderr.split("\n").flatMap((line) => Option.toArray(errorObjectOf(line)));

/**
 * Run one corpus package through the importer and through the CLI, and assert the CLI lands it
 * where the importer does.
 */
const judge = Effect.fn("cli.corpus.judge")(function* judge(entry: {
  readonly dir: string;
  readonly name: string;
}) {
  const fs = yield* FileSystem.FileSystem;
  const cwd = path.join(scratchRoot, entry.name);
  const directTarget = path.join(cwd, "direct");

  yield* fs.remove(cwd, { force: true, recursive: true });
  yield* fs.makeDirectory(cwd, { recursive: true });

  const [importTime, direct] = yield* importPackage(entry.dir).pipe(Effect.result, Effect.timed);

  if (Duration.toMillis(importTime) > tally.slowestImport.millis) {
    tally.slowestImport = { millis: Duration.toMillis(importTime), name: entry.name };
  }

  const refusal = direct._tag === "Failure" ? direct.failure : undefined;

  assert.isTrue(
    refusal === undefined || refusal._tag === "ImportRefused",
    `${entry.name}: the importer failed with something other than a refusal`,
  );

  const report =
    direct._tag === "Success"
      ? yield* exportPackage(direct.success, directTarget).pipe(
          Effect.andThen(comparePackage(entry.dir, directTarget)),
        )
      : [];

  const [roundtripTime, cli] = yield* spawnCli(
    ["--quiet", "--json", "roundtrip", "--yes", path.resolve(entry.dir)],
    { cwd },
  ).pipe(Effect.timed);

  if (Duration.toMillis(roundtripTime) > tally.slowestRoundtrip.millis) {
    tally.slowestRoundtrip = { millis: Duration.toMillis(roundtripTime), name: entry.name };
  }

  const errors = errorObjectsOf(cli.stderr);

  if (refusal === undefined) {
    const envelope = Schema.decodeUnknownSync(roundtripEnvelope)(cli.stdout);
    const differing = report.filter(({ outcome }) => outcome.kind === "differs").length;

    assert.isTrue(
      isUuid(envelope.data.package_id),
      `${entry.name}: the CLI's package_id is a UUID`,
    );
    assert.deepStrictEqual(
      envelope.data.entries.map(({ outcome, path: at }) => ({ kind: outcome.kind, path: at })),
      report.map(({ outcome, path: at }) => ({ kind: outcome.kind, path: at })),
      `${entry.name}: the CLI's entries are the importer's`,
    );

    if (differing === 0) {
      assert.strictEqual(cli.code, 0, `${entry.name}: no entry differs, so the CLI exits 0`);
      assert.isTrue(envelope.ok, `${entry.name}: ok`);
    } else {
      assert.strictEqual(cli.code, 1, `${entry.name}: ${differing} differ, so the CLI exits 1`);
      assert.isFalse(envelope.ok, `${entry.name}: not ok`);
      assert.strictEqual(errors.length, 1, `${entry.name}: one ErrorObject line on stderr`);
      assert.strictEqual(errors[0]?.kind, "roundtrip-differs", `${entry.name}: the CLI's kind`);
    }

    tally.accepted += 1;
    tally.equalEntries += report.length - differing;
  } else {
    const rule = refusal._tag === "ImportRefused" ? refusal.rule : "";

    assert.strictEqual(cli.code, 1, `${entry.name}: refused directly, so the CLI exits 1`);
    assert.strictEqual(errors.length, 1, `${entry.name}: one ErrorObject line on stderr`);
    assert.strictEqual(errors[0]?.kind, "import-refused", `${entry.name}: the CLI's kind`);
    assert.strictEqual(errors[0]?.rule, rule, `${entry.name}: the CLI names the importer's rule`);
    tally.refused.push({ name: entry.name, rule });
  }
});

describe.skipIf(!hasLease)("cli.corpus.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: "120 seconds",
  })("the CLI against the importer over the corpus", (it) => {
    for (const entry of corpus) {
      it.effect(
        `${entry.name} lands through the CLI as it does through the importer`,
        () => judge(entry),
        {
          timeout: corpusCaseTimeoutMs,
        },
      );
    }

    it.effect.skipIf(!settings.corpusRequested)("the tally of accepted and refused packages", () =>
      Effect.gen(function* reports() {
        const refused = tally.refused.map(({ name, rule }) => `${name}:${rule}`).join(" ");

        yield* Console.log(
          `witness: accepted ${tally.accepted} refused ${tally.refused.length} of ${corpus.length}; refused ${refused}; equal entries ${tally.equalEntries}; slowest roundtrip ${tally.slowestRoundtrip.name} ${Math.round(tally.slowestRoundtrip.millis)}; slowest import ${tally.slowestImport.name} ${Math.round(tally.slowestImport.millis)}`,
        );

        assert.strictEqual(
          tally.accepted + tally.refused.length,
          corpus.length,
          "every package is accepted or refused",
        );
      }),
    );
  });
});
