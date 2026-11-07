/**
 * Generated packages' write programs compiled as `DbLayer.make` compiles a workload program (R87):
 * the packages of the assembly generator's small box and a swarm's sample beyond it
 * (`#pantry/test/gen/assembly.ts`), each imported to its rows and its ChangeSet built by
 * `changeSetOf`, then every distinct Description among those ChangeSets compiled in one layer of
 * the author login. Compiling a ChangeSet runs grizzle's write filler over every family of the
 * schema, so a field the filler cannot fill fails on the first generated package compiled, named
 * with its literal.
 *
 * Why the distinct Descriptions and not every package: grizzle compiles a ChangeSet from its
 * Description, which names each insert and none of its rows, and `changeSetOf` names the same
 * inserts for every package, so the write program does not depend on the package. The 368 drawn
 * programs are one Description today, and the test holds that count to {@link distinctMeasured}:
 * a change that makes the Descriptions vary grows the set, each distinct one is compiled, and the
 * count fails loudly so that someone revisits why. Compiling the same Description again would cost
 * about 55 s each at grizzle `4b155e8` (measured 2026-11-06 at load average 60 to 70) and test
 * nothing new.
 *
 * Grizzle states no public canonical form of a Description, so {@link descriptionOf} reads the one
 * a ChangeSet value carries as its own `desc`, and fails when a value carries none. The layer needs
 * the committed snapshot to be the schema's, as every `DbLayer` does, and the import's write
 * program is also declared in the author login's workload (`#pantry/qti/logins.ts` `importWork`).
 */
import { DbLayer, login, OpenError, workload } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import {
  Cause,
  Duration,
  Effect,
  Exit,
  FileSystem,
  Layer,
  Predicate,
  Redacted,
  Schema,
} from "effect";
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
 * drew them: what the last tests compile the distinct Descriptions of.
 */
const programs: { readonly change: ReturnType<typeof changeSetOf>; readonly literal: string }[] =
  [];

/**
 * How many distinct Descriptions the drawn programs had when this test was written: one, since
 * `changeSetOf` names the same inserts for every package.
 */
const distinctMeasured = 1;

/**
 * Write the Description a ChangeSet value carries, its own `desc` accessor, which grizzle compiles
 * the ChangeSet from, canonically: every object's keys in code point order, a bigint as its digits
 * followed by `n`.
 *
 * @param change - The ChangeSet.
 * @returns The Description's text.
 */
const descriptionOf = (change: ReturnType<typeof changeSetOf>): string => {
  const desc = Predicate.hasProperty(change, "desc") ? change.desc : undefined;
  assert.isTrue(
    Predicate.isObject(desc),
    "a ChangeSet value carries no Description as its own desc; find grizzle's canonical form of one",
  );

  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- JSON.stringify's replacer reads each part of the Description, a JSON value of any shape.
  return JSON.stringify(desc, (_key, part: unknown) => {
    if (Predicate.isBigInt(part)) {
      return `${String(part)}n`;
    }

    return Predicate.isObject(part) && !Array.isArray(part)
      ? Object.fromEntries(
          Object.entries(part).toSorted(([x], [y]) => (x < y ? -1 : Number(x > y))),
        )
      : part;
  });
};

/**
 * The drawn programs with distinct Descriptions, once written: writing 368 Descriptions takes
 * seconds, and both tests below read the set.
 */
const distinctFound = new Map<"found", readonly (readonly [number, (typeof programs)[number]])[]>();

/**
 * The drawn programs with distinct Descriptions, each the first drawn of its Description, with its
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
    const text = descriptionOf(program.change);
    if (!first.has(text)) {
      first.set(text, [at, program]);
    }
  }

  const found = [...first.values()];
  distinctFound.set("found", found);

  return found;
};

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
 * Build a layer of the author login whose workload holds the {@link distinct} kept programs, each
 * under the name `case<n>` of its index and nothing else, and release it at once:
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
        Object.fromEntries(distinct().map(([at, { change }]) => [`case${String(at)}`, change])),
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
    "compiles every distinct Description among the generated packages' write programs as the layer compiles a workload program",
    () =>
      // Oracle: grizzle itself, `DbLayer.make`'s startup compilation: a program that does not
      // compile is `OpenError` carrying its `CompileError`, at `programs.case<n>`. Every kept
      // program is new to the snapshot, so a layer whose programs all compile stops at the first
      // of them it does not record, `WorkloadUngenerated` naming `case<n>`, which it can only name
      // once every program has compiled.
      // Bound: every distinct Description among the 368 packages the test above drew.
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

  it("draws write programs of exactly the Descriptions it measured, one", () => {
    // Oracle: the specification as a checker, `changeSetOf`'s one list of inserts: the write program
    // does not depend on the package. A change that makes it depend grows the set past
    // `distinctMeasured`, and this fails so that someone revisits the compile above.
    // Bound: the 368 packages the first test drew.
    const found = distinct();

    assert.isAbove(programs.length, 0, "no package was drawn");
    assert.strictEqual(
      found.length,
      distinctMeasured,
      `the drawn write programs have ${String(found.length)} distinct Descriptions, first drawn by ${found.map(([, { literal }]) => literal).join("; ")}`,
    );
  }, 600_000);
});
