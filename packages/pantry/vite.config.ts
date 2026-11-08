import { globSync, readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";

/**
 * Test files that open the leased database: named `*.db.test.ts` or `*.packaging.test.ts`, or gated
 * on `hasLease` from `#pantry/test/settings.ts`. Read from the tree, so a new file joins by its
 * name or its gate and no list needs keeping.
 */
const databaseFiles = globSync("src/**/*.test.ts", { cwd: import.meta.dirname })
  .filter(
    (file) =>
      /\.(?:db|packaging)\.test\.ts$/u.test(file) ||
      readFileSync(`${import.meta.dirname}/${file}`, "utf-8").includes("hasLease"),
  )
  .toSorted();

/**
 * The V8 heap of each database worker, in MiB: twice the least the two files that write 8 entries
 * of 64 MiB in one family, `import/package.large.db.test.ts` and `qti/package.db.test.ts`'s Bind
 * bound case, passed under. grizzle 1.0.0-beta.1 holds each value's hex text as the fact's identity
 * and again as its row's text, and builds each statement's literal from them (grizzle-engine
 * `scalar/values/bytes.ts`, `codec/recordset.ts`): up to 2.2 GB of heap outlived a full collection
 * during the write, beside the 0.6 GB a worker holds before it. Measured 2026-11-07 at `4e82dde5`,
 * each file alone on the lease at 2,048, 2,560, 3,072 and 3,584 MiB: the package import passed
 * from 3,072 and the Bind bound case from 3,584, each running out of heap below. Node's default
 * here is 4,192 MiB, and less on a host with less memory. Lower it on a new measurement recorded
 * here once grizzle's after-beta "bytes past 268,435,443" item removes those copies.
 */
const databaseHeapMiB = 7168;

// Each project's testTimeout and hookTimeout is a hang guard, never a budget: the slowest test that
// takes it ran 12.2 s at a load average of 83 on 2026-11-07, and every test slower than half of it
// states its own (src/test/timeouts.test.ts holds both).
//
// Measured on a 14-core M4 Pro: the database files at one worker after the rest in parallel passed a full
// GR8DES_CORPUS=1 run in 1408 s; one-pool runs failed at 6, 4 and 3 workers (40001, timeouts).
export default defineConfig({
  test: {
    // @grizzle/testing's setup draws the run seed every searched() test reads, or replays a given one.
    globalSetup: ["@grizzle/testing/vitest/global-setup", "./src/test/global-setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          exclude: ["**/node_modules/**", ...databaseFiles],
          hookTimeout: 60_000,
          include: ["src/**/*.test.ts"],
          name: "free",
          sequence: { groupOrder: 1 },
          testTimeout: 60_000,
        },
      },
      {
        extends: true,
        test: {
          execArgv: [`--max-old-space-size=${String(databaseHeapMiB)}`],
          hookTimeout: 60_000,
          include: databaseFiles,
          maxWorkers: 1,
          name: "database",
          sequence: { groupOrder: 2 },
          testTimeout: 60_000,
        },
      },
    ],
    reporters: ["default", "@grizzle/testing/vitest/reporter"],
    // Counts each test file's compositions of the grammar, and fails a file that composes production's twice.
    setupFiles: ["./src/test/compositions.ts"],
  },
});
