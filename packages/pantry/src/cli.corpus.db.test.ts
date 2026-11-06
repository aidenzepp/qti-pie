import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Console, Duration, Effect, FileSystem, Layer, Option, Schema } from "effect";
import { describe } from "vitest";
import { RoundtripData } from "#pantry/cli/roundtrip.ts";
import { ErrorObject, successEnvelope } from "#pantry/cli/output.ts";
import { lawFactsOf, refusalFieldsOf } from "#pantry/cli/refused.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { comparePackage } from "#pantry/export/compare.ts";
import { exportPackage } from "#pantry/export/package.ts";
import { importPackage } from "#pantry/import/package.ts";
import { matchesCommitted, spawnCli } from "#pantry/test/cli.ts";
import { oracleLocate } from "#pantry/test/locate.ts";
import { examplesTarball, materializeCorpus } from "#pantry/test/fixtures.ts";
import { hasLease, settings } from "#pantry/test/settings.ts";
import { renderVerdicts, verdictsPath } from "#pantry/test/verdicts.ts";
import type { VerdictRow } from "#pantry/test/verdicts.ts";

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
 * The folder every case's scratch lives under, `packages/pantry/work/cli-corpus`; each package has
 * a folder of its own under it, named for the package, so no two cases share a path.
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
 * The committed schemas of the two lines a roundtrip prints: its envelope, and its error object.
 */
const committedRoundtrip = matchesCommitted("roundtrip");

const committedError = matchesCommitted("error");

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
 * The verdict of every package the cases judged, keyed to the tarball member it came from; the last
 * case renders them as the verdict file.
 */
const verdicts: VerdictRow[] = [];

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
 * The identities of a refusal's laws, as a sorted list: the laws are a set, so their order is no
 * part of what the two refusals must agree on.
 */
const identities = (facts: readonly { readonly identity: string }[]): readonly string[] =>
  facts.map(({ identity }) => identity).toSorted();

/**
 * Run one corpus package through the importer and through the CLI, and assert the CLI lands it
 * where the importer does.
 *
 * The importer runs with the law oracle's locator (`oracleLocate`), so a refusal the database
 * names no row for is located by the host, and a schema that refuses what the oracle finds
 * unbroken dies as `LocateDisagreement`. The CLI passes none. The two runs are separate imports of
 * one package, so they agree on the rule and on the laws the database named, and the CLI's error
 * object carries both, read from the refusal's fields.
 */
const judge = Effect.fn("cli.corpus.judge")(function* judge(entry: {
  readonly dir: string;
  readonly member: string;
  readonly name: string;
}) {
  const fs = yield* FileSystem.FileSystem;
  const cwd = path.join(scratchRoot, entry.name);
  const directTarget = path.join(cwd, "direct");

  yield* fs.remove(cwd, { force: true, recursive: true });
  yield* fs.makeDirectory(cwd, { recursive: true });

  const [importTime, direct] = yield* importPackage(entry.dir, { locate: oracleLocate }).pipe(
    Effect.result,
    Effect.timed,
  );

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

  for (const line of cli.stderr.split("\n")) {
    if (Option.isSome(errorObjectOf(line))) {
      assert.isTrue(committedError(line), `${entry.name}: the error object's schema`);
    }
  }

  if (refusal === undefined) {
    assert.isTrue(committedRoundtrip(cli.stdout), `${entry.name}: the envelope's committed schema`);

    const envelope = Schema.decodeUnknownSync(roundtripEnvelope)(cli.stdout);
    const differing = report.filter(({ outcome }) => outcome.kind === "differs").length;

    const written = envelope.data;
    const packageId = "package_id" in written ? written.package_id : "";
    const entries = "entries" in written ? written.entries : [];

    assert.isTrue(isUuid(packageId), `${entry.name}: the CLI's package_id is a UUID`);
    assert.deepStrictEqual(
      entries.map(({ outcome, path: at }) => ({ kind: outcome.kind, path: at })),
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

    verdicts.push({ file: entry.member, rule: "", verdict: "accepted" });
    tally.accepted += 1;
    tally.equalEntries += report.length - differing;
  } else {
    const rule = refusal._tag === "ImportRefused" ? refusal.rule : "";

    assert.strictEqual(cli.code, 1, `${entry.name}: refused directly, so the CLI exits 1`);
    assert.strictEqual(errors.length, 1, `${entry.name}: one ErrorObject line on stderr`);
    assert.strictEqual(errors[0]?.kind, "import-refused", `${entry.name}: the CLI's kind`);
    assert.strictEqual(errors[0]?.rule, rule, `${entry.name}: the CLI names the importer's rule`);

    const laws = yield* Option.match(refusalFieldsOf(refusal), {
      onNone: () => Effect.succeed(Option.none()),
      onSome: lawFactsOf,
    });

    assert.deepStrictEqual(
      identities(errors[0]?.laws ?? []),
      identities(Option.getOrElse(laws, () => [])),
      `${entry.name}: the CLI names the laws the database named`,
    );
    assert.strictEqual(
      errors[0]?.sources === undefined,
      Option.isNone(laws),
      `${entry.name}: the CLI gives sources exactly when the database refused the package`,
    );
    verdicts.push({ file: entry.member, rule, verdict: "refused" });
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

        const fs = yield* FileSystem.FileSystem;
        const tarball = yield* examplesTarball;
        const committed = verdictsPath(tarball);
        const fresh = path.resolve(
          import.meta.dirname,
          "..",
          "work",
          "verdicts",
          path.basename(committed),
        );

        yield* fs.makeDirectory(path.dirname(fresh), { recursive: true });

        const rendered = yield* renderVerdicts(verdicts);

        yield* fs.writeFileString(fresh, rendered);

        const expected = yield* fs.readFileString(committed).pipe(Effect.option);

        assert.isTrue(
          Option.isSome(expected),
          `no committed verdict file at ${committed}; adopt the fresh one at ${fresh} with: cp ${fresh} ${committed}`,
        );
        assert.strictEqual(
          rendered,
          Option.getOrThrow(expected),
          `the verdicts differ from ${committed}; to adopt ${fresh}, run: cp ${fresh} ${committed}`,
        );
      }),
    );
  });
});
