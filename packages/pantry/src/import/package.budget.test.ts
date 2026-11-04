import { Db } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, it as plain, layer } from "@effect/vitest";
import { Console, Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { changeSetOf, readRows } from "#pantry/import/package.ts";
import type { ProcessingFixtureName } from "#pantry/processing/fixtures.ts";
import { processingFixtureNames, materializeProcessing } from "#pantry/processing/fixtures.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { Package } from "#pantry/schema/package.ts";
import { fixtureNames, materialize, materializeCorpus } from "#pantry/test/fixtures.ts";
import { SQL_BYTES_CEILING, measure, watchMeters } from "#pantry/test/meter.ts";
import { hasLease, leaseTestTimeoutMs, settings } from "#pantry/test/settings.ts";

/**
 * The per-package program gate: the import of one package compiles to a program of at most this
 * many SQL bytes, 800 KiB, which is 80 percent of the compiler's ceiling of 1,048,576 (decisions 69
 * and 72).
 *
 * The gate is per package, not per roster: a package's import is one `ChangeSet` with a member for
 * each relation the package has facts in, so what grows the program is the roster of relations a
 * package reaches, and the schema's growth shows in the largest admitted package. The whole-roster
 * worst case is `scripts/measure.ts --programs`, reported and not gated here.
 */
const PROGRAM_BYTES_MAX = 819_200;

/**
 * The processing fixtures whose program is reported, not gated (decision 134): `processing-item`,
 * `padded-reference`, `padded-literal` and `template-item` compile above `PROGRAM_BYTES_MAX` and
 * below the compiler's ceiling. Each prints a `program_report_only:` line and still fails past the
 * ceiling or a refusal. The list is re-measured at the regenerate (`p13-t40`'s merge) and at the
 * freeze; nothing fails when a member falls under the gate.
 */
const REPORT_ONLY: ReadonlySet<ProcessingFixtureName> = new Set([
  "padded-literal",
  "padded-reference",
  "processing-item",
  "template-item",
]);

/**
 * What a package's program size earns: `over-cap` past the compiler's ceiling for any package,
 * `reported` for a listed package under it, `over-gate` for an unlisted package past the gate,
 * else `within`.
 */
type Verdict = "over-cap" | "over-gate" | "reported" | "within";

/**
 * The verdict for a package of `bytes` SQL bytes, listed in `REPORT_ONLY` or not.
 */
const verdictOf = (reportOnly: boolean, bytes: number): Verdict => {
  if (bytes > SQL_BYTES_CEILING) {
    return "over-cap";
  }

  if (reportOnly) {
    return "reported";
  }

  return bytes > PROGRAM_BYTES_MAX ? "over-gate" : "within";
};

/**
 * The corpus's packages when `GR8DES_CORPUS=1` and a lease is held, and none otherwise.
 *
 * Vitest declares a file's cases before any runs, so the corpus's names are listed while the file
 * is collected; a run without both settings never opens the tarball.
 */
const corpus =
  hasLease && settings.corpusRequested
    ? await Effect.runPromise(materializeCorpus().pipe(Effect.provide(NodeServices.layer)))
    : [];

/**
 * A package the gate measures: its name, the effect that makes its directory and whether its
 * program is reported, not gated.
 */
interface Subject {
  readonly dir: Effect.Effect<string, unknown, unknown>;
  readonly name: string;
  readonly reportOnly: boolean;
}

/**
 * Every package the gate measures, each a case: the base fixtures, the processing fixtures and, on
 * request, the corpus.
 */
const subjects: readonly Subject[] = [
  ...fixtureNames.map((name) => ({
    dir: materialize(name),
    name: `fixture ${name}`,
    reportOnly: false,
  })),
  ...processingFixtureNames.map((name) => ({
    dir: materializeProcessing(name),
    name: `processing ${name}`,
    reportOnly: REPORT_ONLY.has(name),
  })),
  ...corpus.map((entry) => ({
    dir: Effect.succeed(entry.dir),
    name: `corpus ${entry.name}`,
    reportOnly: false,
  })),
];

/**
 * What the cases so far found, kept in the file's scope: vitest runs a file's cases in order, and
 * the last case reads this.
 */
const tally = {
  largest: { bytes: 0, members: 0, name: "" },
  measured: 0,
  refusedByRead: 0,
};

/**
 * Judge one package: read it, compile its import, and hold the program to the bound: the gate for
 * a gated package, the compiler's ceiling for a listed one.
 *
 * A package `readRows` refuses is counted as `refused_by_read` and not compiled.
 */
const judge = (subject: Subject) =>
  Effect.gen(function* judges() {
    const dir = yield* subject.dir;
    const read = yield* Effect.result(readRows(dir));
    if (read._tag === "Failure") {
      tally.refusedByRead += 1;

      return;
    }

    const changes = changeSetOf(read.success.rows);
    const members =
      1 +
      [...read.success.rows].filter(([relation, facts]) => relation !== Package && facts.length > 0)
        .length;
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const measured = yield* Effect.scoped(
      Effect.gen(function* compiles() {
        const meters = yield* watchMeters;

        return yield* measure(
          (program: typeof changes) =>
            Effect.scoped(
              // SAFETY: `db.compile` is generic over the program's type, which a `ChangeSet` built in a loop cannot state; it reads the value, whose type is not read.
              // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
              db.compile(program as never),
            ).pipe(Effect.asVoid),
          meters,
          changes,
        );
      }),
    );
    const bytes = measured.charged.sqlBytes;

    tally.measured += 1;
    if (bytes > tally.largest.bytes) {
      tally.largest = { bytes, members, name: subject.name };
    }

    assert.isUndefined(
      measured.refusal,
      `${subject.name}: the compiler refused the import (${measured.refusal}) at sqlBytes ${bytes}/${SQL_BYTES_CEILING}`,
    );
    assert.isAbove(
      bytes,
      0,
      `${subject.name}: the meter watch saw no charge, so the size is unmeasured`,
    );

    const verdict = verdictOf(subject.reportOnly, bytes);

    if (verdict === "reported") {
      yield* Console.log(
        `program_report_only: ${subject.name} sqlBytes ${bytes}/${SQL_BYTES_CEILING} gate ${PROGRAM_BYTES_MAX}`,
      );
    }

    assert.include(
      ["reported", "within"],
      verdict,
      `${subject.name}: the import compiles to sqlBytes ${bytes}/${SQL_BYTES_CEILING}, verdict ${verdict}: it crossed ${verdict === "over-cap" ? `the compiler's ceiling of ${SQL_BYTES_CEILING}` : `the gate of ${PROGRAM_BYTES_MAX}`}; shrink the program, or, for a package the operator rules report-only, list it in REPORT_ONLY`,
    );
  });

describe("import/package.budget.test.ts, the verdict", () => {
  plain("a listed package over the gate is reported", () => {
    assert.strictEqual(verdictOf(true, 854_795), "reported");
  });

  plain("an unlisted package over the gate is over-gate", () => {
    assert.strictEqual(verdictOf(false, 854_795), "over-gate");
  });

  plain("any package over the ceiling is over-cap", () => {
    assert.strictEqual(verdictOf(true, 1_048_577), "over-cap");
    assert.strictEqual(verdictOf(false, 1_048_577), "over-cap");
  });

  plain("the gate's edge holds", () => {
    assert.strictEqual(verdictOf(false, 819_200), "within");
    assert.strictEqual(verdictOf(false, 819_201), "over-gate");
  });

  plain("the report-only list holds the four processing fixtures", () => {
    assert.strictEqual(REPORT_ONLY.size, 4);
    for (const name of REPORT_ONLY) {
      assert.include(processingFixtureNames, name);
    }
  });
});

describe.skipIf(!hasLease)(
  "import/package.budget.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "60 seconds",
    })("the import's program per package", (it) => {
      for (const subject of subjects) {
        it.effect(
          `${subject.name} compiles within ${subject.reportOnly ? `the cap of ${SQL_BYTES_CEILING}` : `${PROGRAM_BYTES_MAX}`} bytes`,
          () =>
            // SAFETY: the subject's directory effect needs the file system and process spawner `NodeServices` gives the layer; `Subject` erases that requirement so one list holds both kinds of fixture.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
            judge(subject) as Effect.Effect<void>,
        );
      }

      it.effect(
        "the largest admitted package, and that every package was measured or refused",
        () =>
          Effect.gen(function* reports() {
            yield* Console.log(
              `program_import_max: ${tally.largest.name} sqlBytes ${tally.largest.bytes}/${SQL_BYTES_CEILING} members ${tally.largest.members} measured ${tally.measured} refused_by_read ${tally.refusedByRead} of ${subjects.length}`,
            );

            assert.isAbove(tally.measured, 0, "no package was measured");
            assert.strictEqual(
              tally.measured + tally.refusedByRead,
              subjects.length,
              "every package is measured or refused by the read",
            );
          }),
      );
    });
  },
);
