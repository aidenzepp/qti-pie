/**
 * The single-CDN level's foreign-markup rule (`#pantry/levels/cdn-foreign.ts`):
 *
 * - **Its laws**, with no database: the `Cdn` level states a `CdnForeign` check over each of the
 *   rule's derived relations, the attributes of an uninterpreted open class and the foreign
 *   elements, and every law it adds is a check over a relation of its own, so it states no law of
 *   `Qti` that `Qti` does not.
 * - **Its installation compiles**: grizzle's own check compiles an installation whose top level is
 *   the `Cdn` level, every statement of it, as `src/test/compile.test.ts` compiles `Qti`, so the
 *   rule's checks are known to compile however `lawsOf` reads them.
 */
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Formatter } from "effect";
import { singleCdn } from "#pantry/levels/cdn.ts";
import { qti } from "#pantry/qti/schema.ts";

/**
 * The origin the level is built for.
 */
const origin = "https://cdn.example.com/";

/**
 * The derived relations the foreign-markup rule judges: the attributes of an uninterpreted open
 * class, and the foreign elements.
 */
const foreignRelations = ["CdnForeignAttribute", "CdnForeignElement"] as const;

/**
 * The package directory, where grizzle is run from and where the committed migrations live.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * The folder the installation's configuration is written to, made and removed by its test.
 */
const configDirectory = path.join(packageDirectory, "work", "cdn-foreign-compile");

/**
 * How long reading the level's laws may take: `lawsOf` compiles `Qti`'s law model and the level's.
 * Measured 2026-11-10: 245.9 s at a load average of 64.72 to 95.91.
 * Measured 2026-11-10: 66.6 s at a load average of 66.91 to 104.00.
 */
const lawsTimeoutMs = 600_000;

/**
 * How long grizzle's check of the installation may take: it compiles every statement of `Qti` and
 * of the level, and every program of the author's login.
 * Measured 2026-11-10: 167.5 s at a load average of 64.72 to 95.91.
 * Measured 2026-11-10: 41.4 s at a load average of 66.91 to 104.00.
 */
const compileTimeoutMs = 360_000;

/**
 * The laws a level states that a lower level does not.
 *
 * @param laws - The level's laws.
 * @param lower - The lower level's laws.
 * @returns The laws only the level states, in its order.
 */
const addedLaws = (laws: readonly Law[], lower: readonly Law[]): readonly Law[] =>
  laws.filter((law) => !lower.some((held) => sameLaw(held, law)));

/**
 * The configuration of an installation whose top level is the `Cdn` level over `Qti`, with the
 * author's login and the committed migrations, as `grizzle.config.ts` configures `Qti`.
 */
const configText = `import { defineConfig } from "@bjornpagen/grizzle";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { Effect } from "effect";
import { migrationConnection } from "#pantry/db/connection.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import { qti } from "#pantry/qti/schema.ts";

export default defineConfig({
  connection: await Effect.runPromise(
    migrationConnection.pipe(Effect.provide(NodeFileSystem.layer)),
  ),
  logins: [authorLogin(qti())],
  migrations: ${JSON.stringify(path.join(packageDirectory, "migrations"))},
  schemas: [singleCdn(qti(), { origin: ${JSON.stringify(origin)} })],
});
`;

/**
 * Write the installation's configuration into its own folder, removing the folder when the scope
 * closes.
 *
 * @returns The configuration file's path.
 */
const writtenConfig = Effect.acquireRelease(
  Effect.tryPromise(async () => {
    await mkdir(configDirectory, { recursive: true });
    const file = path.join(configDirectory, "grizzle.config.ts");
    await writeFile(file, configText);

    return file;
  }),
  () => Effect.promise(() => rm(configDirectory, { force: true, recursive: true })),
);

/**
 * Run `pnpm exec grizzle check <config>` in the package directory and collect how it ended.
 * grizzle prints its findings on standard error, so both streams are read together.
 *
 * @param config - The configuration file's path.
 * @returns The exit code, and everything the process wrote.
 */
const grizzleCheck = (config: string) =>
  Effect.callback<{ readonly code: number | null; readonly output: string }, Error>((resume) => {
    const child = spawn("pnpm", ["exec", "grizzle", "check", config], {
      cwd: packageDirectory,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on("error", (error) => {
      resume(Effect.fail(error));
    });
    child.on("close", (code) => {
      resume(Effect.succeed({ code, output: Buffer.concat(chunks).toString("utf-8") }));
    });

    return Effect.sync(() => {
      child.kill();
    });
  });

describe("levels/cdn-foreign.ts", () => {
  it(
    "states a CdnForeign check over each derived relation of the rule at the Cdn level, and no law over a Qti relation",
    () => {
      // Oracle: spec U12 done_when, "lawsOf lists the four checks at level Cdn and no new Qti
      // law"; GOAL G4, a level only adds laws.
      const base = qti();
      const level = singleCdn(base, { origin });
      const baseLaws = lawsOf(base);
      const levelLaws = lawsOf(level);
      const added = addedLaws(levelLaws, baseLaws);
      // A level's record holds every relation of every level of it; a live derived relation is no
      // whole entry (`wholeEntriesOf`), so the record is what names the level's own.
      const baseNames = new Set(Object.keys(base.relations));
      const ownNames = new Set(Object.keys(level.relations).filter((name) => !baseNames.has(name)));

      assert.deepStrictEqual(
        added
          .flatMap((law) =>
            law.kind === "check" && law.name === "CdnForeign" ? [law.relation] : [],
          )
          .toSorted(),
        [...foreignRelations],
      );
      assert.deepStrictEqual(addedLaws(baseLaws, levelLaws), [], "a Qti law the level drops");
      for (const law of added) {
        assert.isTrue(
          law.kind === "check" && ownNames.has(law.relation),
          `${Formatter.format(law)} is a law the level states over no relation of its own`,
        );
      }
    },
    lawsTimeoutMs,
  );

  it.effect(
    "grizzle check compiles an installation holding the Cdn level: no statement of it does not compile",
    () =>
      Effect.scoped(
        Effect.gen(function* compiles() {
          const config = yield* writtenConfig;
          const { code, output } = yield* grizzleCheck(config);
          const lines = output.split("\n");

          // Oracle: grizzle's `compileSchema` and program compilation, as `grizzle check` runs
          // them over the installation. Drift against the committed snapshot passes, as in
          // `src/test/compile.test.ts`. Bound: the one installation; residual none.
          assert.isTrue(
            code === 0 || code === 1,
            `grizzle check exited ${String(code)}:\n${output}`,
          );
          assert.isTrue(
            lines.some((line) => line.startsWith("Cdn: ")),
            `grizzle check printed no Cdn line:\n${output}`,
          );
          assert.deepStrictEqual(
            lines.filter((line) => line.includes("does not compile")),
            [],
          );
        }),
      ),
    compileTimeoutMs,
  );
});
