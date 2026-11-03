import { Db } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Console, Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { changeSetOf, readRows } from "#qti/import/package.ts";
import { processingFixtureNames, materializeProcessing } from "#qti/processing/fixtures.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Package } from "#qti/schema/package.ts";
import { fixtureNames, materialize, materializeCorpus } from "#qti/test/fixtures.ts";
import { SQL_BYTES_CEILING, measure, watchMeters } from "#qti/test/meter.ts";
import { hasLease, leaseTestTimeoutMs, settings } from "#qti/test/settings.ts";

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
 * A package the gate measures: its name and the effect that makes its directory.
 */
interface Subject {
  readonly dir: Effect.Effect<string, unknown, unknown>;
  readonly name: string;
}

/**
 * Every package the gate measures, each a case: the base fixtures, the processing fixtures and, on
 * request, the corpus.
 */
const subjects: readonly Subject[] = [
  ...fixtureNames.map((name) => ({ dir: materialize(name), name: `fixture ${name}` })),
  ...processingFixtureNames.map((name) => ({
    dir: materializeProcessing(name),
    name: `processing ${name}`,
  })),
  ...corpus.map((entry) => ({ dir: Effect.succeed(entry.dir), name: `corpus ${entry.name}` })),
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
 * Judge one package: read it, compile its import, and hold the program to the bound.
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
    assert.isAtMost(
      bytes,
      PROGRAM_BYTES_MAX,
      `${subject.name}: the import compiles to sqlBytes ${bytes}/${SQL_BYTES_CEILING}, over the gate of ${PROGRAM_BYTES_MAX}`,
    );
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
          `${subject.name} compiles within ${PROGRAM_BYTES_MAX} bytes`,
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
