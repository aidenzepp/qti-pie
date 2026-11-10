/**
 * Generated packages' write programs compiled as `grizzle generate` compiles a workload program
 * into a login's served file (R87, through `@bjornpagen/grizzle/compile`'s `compileServed`): the
 * packages of the assembly generator's small box and a swarm's sample beyond it
 * (`#pantry/test/gen/assembly.ts`), each imported to its rows and its ChangeSet built by
 * `changeSetOf`, then the ChangeSet of every distinct list of inserts among them compiled into one
 * served file of the author login. Compiling a ChangeSet runs grizzle's write filler over every
 * family of the schema, so a field the filler cannot fill fails on the first generated package
 * compiled, named with its literal.
 *
 * Why the distinct insert lists and not every package: grizzle compiles a ChangeSet from its
 * Description, which names each insert and none of its rows (grizzle's README, "Writes"), so what
 * qti decides of a write program is the list of inserts `changeSetOf` passes to grizzle: each
 * relation of the package's inputs, inserted from an array. {@link insertsOf} writes that list
 * canonically from the inputs, which are qti's own, and the test compiles each distinct list once,
 * under the first package drawn with it. The 368 drawn programs have one list today, and the test
 * holds that count to {@link distinctMeasured}: a change that makes the list depend on the package
 * grows the set, each distinct list is compiled, and the count fails loudly so that someone
 * revisits why. Compiling the same program again would cost about 55 s each at grizzle `4b155e8`
 * (measured 2026-11-06 at load average 60 to 70) and test nothing new.
 *
 * The list is a complete key: a ChangeSet's compiled program depends only on its Description and
 * the schema, never on the rows bound at run time, so two packages with one list have one program.
 * The compile reads the committed snapshot, as `grizzle generate` does, and the import's write
 * program is also declared in the author login's workload (`#pantry/qti/own-login.ts`
 * `importWork`). The probe login holds an author role of its own
 * ({@link probeAuthor}), since grizzle puts a role in one login only.
 */
import { login, workload } from "@bjornpagen/grizzle";
import { compileServed } from "@bjornpagen/grizzle/compile";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { agree, exact, set, structuralHash } from "@grizzle/testing/oracle";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Cause, Duration, Effect, Exit, FileSystem, Result, Schema } from "effect";
import { fileURLToPath } from "node:url";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { readEntries } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import { authorRoleOf } from "#pantry/qti/roles.ts";
import {
  assemblyLiteral,
  assemblyPackage,
  sampledBounds,
  smallAssembly,
  swarmedAssembly,
} from "#pantry/test/gen/assembly.ts";
import type { Assembly } from "#pantry/test/gen/assembly.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 140.2 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 1_200_000;

/**
 * The probe login's author role, a role of its own over `Qti` (`#pantry/qti/roles.ts`
 * `authorRoleOf`): grizzle puts a role in one login only, and `AuthorApp` holds the package's own
 * (`#pantry/qti/own-login.ts` `Author`), so a probe login over that one is refused
 * (`LoginRefused`).
 */
const probeAuthor = authorRoleOf(Qti);

/**
 * Every generated package's write program, with the package's literal, in the order the searches
 * drew them, with the list of inserts it passes to grizzle: what the last tests compile the
 * distinct lists of.
 */
const programs: {
  readonly change: ReturnType<typeof changeSetOf>;
  readonly inserts: string;
  readonly literal: string;
}[] = [];

/**
 * How many distinct lists of inserts the drawn programs had when this test was written: one, since
 * `changeSetOf` inserts every relation of a package's inputs, each from an array.
 */
const distinctMeasured = 1;

/**
 * Write the inserts `changeSetOf` passes to grizzle for a package, canonically: each relation of
 * the package's inputs, in code point order, inserted from an array, as `changeSetOf` inserts
 * every one (`#pantry/import/write.test.ts`, "inserts every relation of a package's inputs").
 *
 * @param inputs - The package's inputs.
 * @returns The list's text.
 */
const insertsOf = (inputs: PackageInputs): string =>
  Object.keys(inputs)
    .toSorted((x, y) => (x < y ? -1 : Number(x > y)))
    .map((relation) => `insert ${relation} from an array`)
    .join("\n");

/**
 * The drawn programs with distinct lists of inserts, found once: both tests below read the set.
 */
const distinctFound = new Map<"found", readonly (readonly [number, (typeof programs)[number]])[]>();

/**
 * The drawn programs with distinct lists of inserts, each the first drawn of its list, with its
 * index among them all, found once all are drawn.
 *
 * @returns The programs, by their index in {@link programs}.
 */
const distinct = (): readonly (readonly [number, (typeof programs)[number]])[] => {
  const known = distinctFound.get("found");
  if (known !== undefined) {
    return known;
  }

  const first = new Map<string, readonly [number, (typeof programs)[number]]>();
  for (const [at, program] of programs.entries()) {
    const text = program.inserts;
    if (!first.has(text)) {
      first.set(text, [at, program]);
    }
  }

  const found = [...first.values()];
  distinctFound.set("found", found);

  return found;
};

/**
 * The law oracle's tables over the installed grammar, built once.
 */
const laws = lawsOf(grammar);

/**
 * Import one generated package to its rows, hold `readProgram` to the law oracle's judgment of
 * the same entries, and keep its write program. The reader, the container and the codec are the
 * stages `readProgram` judges, so where the oracle refuses there, `readProgram` refuses under the
 * oracle's rule; the laws are the database's stage, so wherever the oracle reads every document,
 * `readProgram` yields a write program over exactly the documents the oracle read.
 *
 * @param assembly - The package.
 * @returns Nothing; fails the case where `readProgram` and the oracle disagree.
 */
const keep = (assembly: Assembly) =>
  Effect.gen(function* kept() {
    const literal = assemblyLiteral(assembly);
    const dir = yield* scopedPackage(assemblyPackage(assembly));
    const judgment = yield* judge(yield* readEntries(dir), grammar, laws);
    const outcome = yield* Effect.result(readProgram(dir));
    if (judgment._tag === "CodecRefusal") {
      assert.isTrue(
        Result.isFailure(outcome) &&
          outcome.failure._tag === "ImportRefused" &&
          outcome.failure.rules.join("|") === judgment.rule,
        `${literal}: the law oracle refuses it under ${judgment.rule}, and readProgram ${Result.isFailure(outcome) ? `fails with ${outcome.failure.message}` : "yields a write program"}`,
      );

      return;
    }

    const program = Result.isSuccess(outcome)
      ? outcome.success
      : assert.fail(
          `${literal}: the law oracle reads every document, and readProgram fails with ${outcome.failure.message}`,
        );
    yield* agree(
      [
        ["the law oracle", judgment.documents],
        ["readProgram", [...program.inputs.Document.values()].map(({ path }) => path)],
      ],
      set(structuralHash, exact),
    );
    programs.push({
      change: changeSetOf(probeAuthor, program.inputs),
      inserts: insertsOf(program.inputs),
      literal,
    });
  }).pipe(Effect.scoped);

/**
 * The committed migrations snapshot, read from disk: the JSON value grizzle's `compileServed`
 * compiles a login under, the snapshot the committed served file was generated beside.
 */
const snapshotOf = Effect.gen(function* snapshotOf() {
  const fs = yield* FileSystem.FileSystem;
  const text = yield* fs.readFileString(
    fileURLToPath(import.meta.resolve("#migrations/qti/snapshot.json")),
  );

  return yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(
      Schema.StructWithRest(Schema.Struct({ fingerprint: Schema.String }), [
        Schema.Record(Schema.String, Schema.Json),
      ]),
    ),
  )(text);
});

/**
 * Compile the author login's served file with a workload of the {@link distinct} kept programs,
 * each under the name `case<n>` of its index and nothing else (`compileServed`, the one compile
 * `grizzle generate` runs for a login), under the committed snapshot, opening no session.
 *
 * @returns The exit of the compile.
 */
const compileKept = Effect.gen(function* compileKept() {
  const snapshot = yield* snapshotOf;
  const probe = login(Qti, "author_app", [probeAuthor], {
    workload: [
      workload(
        probeAuthor,
        Object.fromEntries(distinct().map(([at, { change }]) => [`case${String(at)}`, change])),
      ),
    ],
  });

  return yield* Effect.exit(compileServed(probe, snapshot, probe.workload));
});

/**
 * What the collecting searches hold `readProgram` to: the law oracle, a second reading of the
 * package through its own codec.
 */
const compiledOracle = {
  kind: "second-implementation",
  name: "the law oracle's judge: its codec refusal's rule, else a write program over exactly the documents it read",
} as const;

layer(NodeServices.layer, { excludeTestServices: true })("test/gen/assembly.ts, compiled", (it) => {
  it.effect(
    "imports every package of the small box and a swarm's sample to its write program",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's judgment of each package (`keep`), and
      // this collects the programs the last test compiles. Bound: the small box's 308 packages,
      // then 60 sampled past it under their own swarms.
      Effect.gen(function* collect() {
        yield* searched(
          ctx,
          exhaust(
            {
              box: "11 shapes of at most two parts, three item refs, one nesting and a chain of two documents, with one branch rule of every owner and target",
              caseHang: Duration.seconds(30),
              coverage: noCoverage,
              generator: smallAssembly,
              limit: 400,
              literal: assemblyLiteral,
              oracle: compiledOracle,
              suite: "pantry/test/gen-assembly-compile-box",
            },
            (assembly) => keep(assembly),
          ),
        );
        yield* searched(
          ctx,
          explore(
            {
              caseHang: Duration.seconds(30),
              concurrency: 1,
              coverage: noCoverage,
              draw: drawn(swarmedAssembly(sampledBounds)),
              kept: [],
              literal: ({ assembly }) => assemblyLiteral(assembly),
              oracle: compiledOracle,
              runs: 60,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/test/gen-assembly-compile-swarm",
            },
            ({ assembly }) => keep(assembly),
          ),
        );
      }),
    { timeout: testTimeoutMs },
  );

  it.effect(
    "compiles the write program of every distinct list of inserts among the generated packages as the layer compiles a workload program",
    () =>
      // Oracle: grizzle itself, the served file's compile: a program that does not compile is a
      // `ServedRefusal` naming it at `programs.case<n>`, and a workload whose programs all compile
      // serves.
      // Bound: every distinct list of inserts among the 368 packages the test above drew.
      Effect.gen(function* compiles() {
        assert.isAbove(programs.length, 0, "no package was drawn");

        const exit = yield* compileKept;
        const text = Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "";
        const marker = text.indexOf("programs.case");
        const at =
          marker === -1
            ? undefined
            : /^[0-9]+/u.exec(text.slice(marker + "programs.case".length))?.[0];
        const drawnCase = at === undefined ? "" : (programs[Number(at)]?.literal ?? "");

        assert.isTrue(
          Exit.isSuccess(exit),
          `${text}${drawnCase === "" ? "" : `\nthe generated case: ${drawnCase}`}`,
        );
      }),
    { timeout: testTimeoutMs },
  );

  it(
    "draws write programs of exactly the lists of inserts it measured, one",
    () => {
      // Oracle: the specification as a checker, `changeSetOf`'s one list of inserts: what qti passes
      // to grizzle does not depend on the package. A change that makes it depend grows the set past
      // `distinctMeasured`, and this fails so that someone revisits the compile above.
      // Bound: the 368 packages the first test drew.
      const found = distinct();

      assert.isAbove(programs.length, 0, "no package was drawn");
      assert.strictEqual(
        found.length,
        distinctMeasured,
        `the drawn write programs have ${String(found.length)} distinct lists of inserts, first drawn by ${found.map(([, { literal }]) => literal).join("; ")}`,
      );
    },
    testTimeoutMs,
  );
});
