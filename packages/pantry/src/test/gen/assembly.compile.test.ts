/**
 * Generated packages' write programs compiled as `DbLayer.make` compiles a workload program (R87):
 * the packages of the assembly generator's small box and a swarm's sample beyond it
 * (`#pantry/test/gen/assembly.ts`), each imported to its rows and its ChangeSet built by
 * `changeSetOf`, then a spread of {@link compiledCount} of those ChangeSets compiled in one layer of
 * the author login. Compiling a ChangeSet runs grizzle's write filler over every family of the
 * schema, so a field the filler cannot fill, such as an owner-axis copy of a column the owner fills
 * after its members, fails on the first generated package compiled, named with its literal.
 *
 * Why a spread and not every package: grizzle compiles a ChangeSet from its Description, which
 * names each insert and none of its rows, and `changeSetOf` names the same inserts for every
 * package, so every package's program is one program. `workload` checks each program it is given
 * against the schema, at about 10 s a ChangeSet over `Qti` (measured 2026-11-06 at load average 60:
 * 9.2 s for one, 72.5 s for five), so the 368 drawn programs would take an hour.
 *
 * It needs the committed snapshot to be the schema's, and grizzle's nested write of a tree that
 * owns an ordered family (`Node.attributes`) to compile, which grizzle `64f0427` refuses
 * (`docs/grizzle-findings.md`, R87). It lands with the pin that fixes that, beside the import's
 * write program in the author login's workload (`#pantry/qti/logins.ts` `importWork`).
 */
import { DbLayer, login, OpenError, workload } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Cause, Duration, Effect, Exit, FileSystem, Layer, Redacted, Schema } from "effect";
import net from "node:net";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { readProgram } from "#pantry/import/program.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import { Author } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";
import {
  assemblyLiteral,
  assemblyPackage,
  sampledBounds,
  smallAssembly,
  swarmedAssembly,
} from "#pantry/test/gen/assembly.ts";
import type { Assembly } from "#pantry/test/gen/assembly.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";

/**
 * Every generated package's write program, with the package's literal, in the order the searches
 * drew them: what the last test compiles a spread of.
 */
const programs: { readonly change: ReturnType<typeof changeSetOf>; readonly literal: string }[] =
  [];

/**
 * How many of the drawn programs the last test compiles: the first, the last, and the rest spread
 * evenly between them.
 */
const compiledCount = 6;

/**
 * The drawn programs the last test compiles, each with its index among them all: the first, the
 * last, and the rest evenly spread.
 *
 * @returns The programs, by their index in {@link programs}.
 */
const spread = (): readonly (readonly [number, (typeof programs)[number]])[] =>
  [
    ...new Set(
      Array.from({ length: compiledCount }, (_, at) =>
        Math.round((at * (programs.length - 1)) / (compiledCount - 1)),
      ),
    ),
  ].flatMap((index) => {
    const program = programs[index];

    return program === undefined ? [] : [[index, program] as const];
  });

/**
 * Import one generated package to its rows and keep its write program.
 *
 * @param assembly - The package.
 * @returns Nothing.
 */
const keep = (assembly: Assembly) =>
  Effect.gen(function* kept() {
    const program = yield* readProgram(yield* scopedPackage(assemblyPackage(assembly)));
    programs.push({
      change: changeSetOf(Author, program.inputs),
      literal: assemblyLiteral(assembly),
    });
  }).pipe(Effect.scoped);

/**
 * The committed migrations snapshot, as the layer reads it (`#pantry/db/layer.ts`).
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
 * Build a layer of the author login whose workload holds the {@link spread} of the kept programs,
 * each under the name `case<n>` of its index and nothing else, and release it at once:
 * `DbLayer.make` compiles every program before it compares their access with the snapshot
 * (grizzle's `adapter/pool/registry.ts` `startupCheck`, `loginAccess` then `accessDrift`), and
 * opens no session.
 *
 * @returns The exit of building the layer.
 */
const compileKept = Effect.gen(function* compileKept() {
  const snapshot = yield* snapshotOf;
  const probe = login(Qti, "author_app", [Author], {
    workload: [
      workload(
        Author,
        Object.fromEntries(spread().map(([at, { change }]) => [`case${String(at)}`, change])),
      ),
    ],
  });
  const built = DbLayer.make({
    connectTimeoutMs: 1000,
    database: "unused",
    driver: pg,
    login: probe,
    password: Effect.succeed(Redacted.make("unused")),
    pool: { idleTimeoutMs: 1000, max: 1, min: 0 },
    snapshot,
    transport: {
      ca: "an unused CA: this layer is built and released without connecting\n",
      host: "localhost",
      kind: "sslRequest",
      open: () => new net.Socket(),
      port: 1,
      servername: "localhost",
    },
  });

  return yield* Effect.exit(Effect.scoped(Layer.build(built)));
});

layer(NodeServices.layer, { excludeTestServices: true })("test/gen/assembly.ts, compiled", (it) => {
  it.effect(
    "imports every package of the small box and a swarm's sample to its write program",
    (ctx) =>
      // Oracle: none; this collects the programs the last test compiles. Bound: the small box's 308
      // packages, then 60 sampled past it under their own swarms.
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
              runs: 60,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/test/gen-assembly-compile-swarm",
            },
            ({ assembly }) => keep(assembly),
          ),
        );
      }),
    { timeout: 1_200_000 },
  );

  it.effect(
    "compiles a spread of the generated packages' write programs as the layer compiles a workload program",
    () =>
      // Oracle: grizzle itself, `DbLayer.make`'s startup compilation: a program that does not
      // compile is `OpenError` carrying its `CompileError`, at `programs.case<n>`. Every kept
      // program is new to the snapshot, so a layer whose programs all compile stops at the first
      // of them it does not record, `WorkloadUngenerated` naming `case<n>`, which it can only name
      // once every program has compiled.
      // Bound: 6 of the packages the test above drew, spread over the box and the sample.
      Effect.gen(function* compiles() {
        assert.isAbove(programs.length, 0, "no package was drawn");

        const exit = yield* compileKept;
        const failure = Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;
        const text = Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "";
        const marker = text.indexOf("programs.case");
        const at =
          marker === -1
            ? undefined
            : /^[0-9]+/u.exec(text.slice(marker + "programs.case".length))?.[0];
        const drawnCase = at === undefined ? "" : (programs[Number(at)]?.literal ?? "");

        assert.isTrue(
          failure instanceof OpenError &&
            failure.reason._tag === "WorkloadUngenerated" &&
            /program author_app\.case[0-9]+ is not in snapshot\.json/u.test(failure.message),
          `${text}${drawnCase === "" ? "" : `\nthe generated case: ${drawnCase}`}`,
        );
      }),
    { timeout: 1_200_000 },
  );
});
