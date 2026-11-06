/**
 * The law oracle's branch laws against R87's model of reading 87 (lane OL, step 4 of R87's
 * finding): a differential over the packages R87's assembly generator draws
 * (`#pantry/test/gen/assembly.ts`).
 *
 * The oracle states `Branch target` and `Branch forward` over each document's folded rows, as
 * `src/qti/tests.ts`'s `branchLaws` judge the import's `BranchResolution` rows
 * (`#pantry/test/oracle-laws/tests.ts`). R87's model (`modelVerdict`) restates reading 87's bullets
 * over the generator's own assembled test, sharing no code with either. Every package the box
 * exhausts and the swarm samples must get one verdict from both: accepted by the model exactly when
 * the oracle raises no branch law, and refused for each fault the model finds under the law that
 * names it (`unresolved` and `target` are "Branch target", `forward` "Branch forward"). The model
 * stays the reference, and one model serves both R87's import witness and this differential.
 *
 * No generated package shuffles or selects with replacement, so the model's bullets on those never
 * apply; the oracle's shuffle and replacement arms are held by their mutations in
 * `src/test/oracle.complete.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage, requiredInSpace } from "@grizzle/testing/features";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import {
  assemblyLiteral,
  assemblyPackage,
  modelVerdict,
  sampledBounds,
  smallAssembly,
  swarmedAssembly,
} from "#pantry/test/gen/assembly.ts";
import type { Assembly } from "#pantry/test/gen/assembly.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf, shownBreach } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by, composed once for the file.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The branch law each fault of the model is named by.
 */
const faultLaws = {
  forward: "Branch forward",
  target: "Branch target",
  unresolved: "Branch target",
} as const;

/**
 * Judge one generated package both ways and hold the verdicts equal.
 *
 * @param assembly - The package.
 * @returns The verdict both give, for the search's notes.
 */
const agrees = (assembly: Assembly) =>
  Effect.gen(function* judgeBoth() {
    const literal = assemblyLiteral(assembly);
    const judgment = yield* judge(filesOf(assemblyPackage(assembly)), grammar, laws);
    const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
    const branch = new Set(
      breaches.flatMap(({ law }) =>
        law === "Branch forward" || law === "Branch target" ? [law] : [],
      ),
    );
    const model = modelVerdict(assembly);
    const expected = new Set(
      model.kind === "accepted" ? [] : [...model.faults].map((fault) => faultLaws[fault]),
    );

    assert.strictEqual(judgment._tag, "Judged", `${literal}: the codec refuses it`);
    assert.deepStrictEqual(
      [...branch].toSorted(),
      [...expected].toSorted(),
      `${literal}: the oracle raises ${[...branch].join(", ") || "no branch law"}, and reading 87's model ${model.kind === "accepted" ? "accepts it" : `refuses it (${[...model.faults].join(", ")})`}:\n${breaches.map((breach) => shownBreach(breach, grammar)).join("\n")}`,
    );
    assert.deepStrictEqual(
      breaches.filter(({ law }) => law !== "Branch forward" && law !== "Branch target"),
      [],
      `${literal}: the oracle raises a law no generated package breaks`,
    );

    return model.kind;
  });

describe("the law oracle's branch laws against reading 87's model", () => {
  it.effect(
    "agree on every package of the small box",
    (ctx) =>
      // Oracle: a second implementation, R87's model of reading 87's bullets over the generator's
      // assembled test (`modelVerdict`). Bound: R87's box, 11 shapes of at most two parts, three
      // item refs, one nesting and a chain of two documents, with one rule of every owner naming
      // every identifier or EXIT_TEST.
      searched(
        ctx,
        exhaust(
          {
            box: "R87's 11 shapes, each with one rule of every owner and target",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
            generator: smallAssembly,
            limit: 400,
            literal: assemblyLiteral,
            oracle: { kind: "second-implementation", name: "R87's model of reading 87" },
            suite: "pantry/oracle-laws-branch-box",
          },
          (assembly, c) =>
            Effect.gen(function* box() {
              c.note(yield* agrees(assembly));
            }),
        ),
      ),
    600_000,
  );

  it.effect(
    "agree on every package a swarm samples past the box",
    (ctx) =>
      // Oracle: as the box's. Bound: R87's sampled bounds (up to 4 documents in chains, sections
      // 3 deep, 3 children each, 2 parts and 3 rules), each case under its own swarm; 120 runs.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(30),
            concurrency: 1,
            coverage: noCoverage,
            draw: drawn(swarmedAssembly(sampledBounds)),
            kept: [],
            literal: ({ assembly }) => assemblyLiteral(assembly),
            oracle: { kind: "second-implementation", name: "R87's model of reading 87" },
            runs: 120,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/oracle-laws-branch-swarm",
          },
          ({ assembly }) => Effect.asVoid(agrees(assembly)),
        ),
      ),
    600_000,
  );
});
