/**
 * Generated packages read as the law oracle reads them (R87): every package of the assembly
 * generator's small box and a swarm's sample beyond it (`#pantry/test/gen/assembly.ts`) is read by
 * `readProgram` and judged by the law oracle over the same entries. Where the oracle refuses at the
 * reader, the container or the codec, `readProgram` refuses under the oracle's rule; where the
 * oracle reads every document, `readProgram` yields a write program over exactly the documents the
 * oracle read. `#pantry/test/gen/assembly.test.ts` holds the same packages' rows to reading 87.
 *
 * The write program itself is the author login's `importWrite` member, one ChangeSet over every
 * relation an import writes, whatever the package (`#pantry/qti/logins.ts`); `grizzle generate`
 * compiles it into the served file and `grizzle check` holds the file to it.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { agree, exact, set, structuralHash } from "@grizzle/testing/oracle";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readEntries } from "#pantry/package/read.ts";
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
 * The timeout, in milliseconds, of the test: a hang guard, never a budget. Measured 2026-11-07:
 * 140.2 s at a load average of 63 to 73, the slowest test of the file this one was cut from, which
 * held this test and two compiles; on 2026-11-10 it took 98.1 s alone, at a load average of 35 to
 * 57.
 */
const testTimeoutMs = 1_200_000;

/**
 * The law oracle's tables over the installed grammar, built once.
 */
const laws = lawsOf(grammar);

/**
 * Import one generated package to its rows, hold `readProgram` to the law oracle's judgment of
 * the same entries. The reader, the container and the codec are the
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
  }).pipe(Effect.scoped);

/**
 * What the collecting searches hold `readProgram` to: the law oracle, a second reading of the
 * package through its own codec.
 */
const compiledOracle = {
  kind: "second-implementation",
  name: "the law oracle's judge: its codec refusal's rule, else a write program over exactly the documents it read",
} as const;

layer(NodeServices.layer, { excludeTestServices: true })("test/gen/assembly.ts, read", (it) => {
  it.effect(
    "reads every package of the small box and a swarm's sample as the law oracle does",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's judgment of each package (`keep`).
      // Bound: the small box's 308 packages, then 60 sampled past it under their own swarms.
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
              suite: "pantry/test/gen-assembly-read-box",
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
              suite: "pantry/test/gen-assembly-read-swarm",
            },
            ({ assembly }) => keep(assembly),
          ),
        );
      }),
    { timeout: testTimeoutMs },
  );
});
