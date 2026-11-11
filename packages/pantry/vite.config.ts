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

// Each project's testTimeout and hookTimeout is a hang guard, never a budget: the slowest test that
// takes it ran 12.2 s at a load average of 83 on 2026-11-07, and every test slower than half of it
// states its own (src/test/timeouts.test.ts holds both).
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
          hookTimeout: 60_000,
          include: databaseFiles,
          // One worker: every database test reads only its own package's rows, but at SERIALIZABLE
          // PostgreSQL's own foreign key check reads each referenced key through its index, taking
          // page-level SIRead locks there, so overlapping imports still fail with false 40001s.
          // grizzle's SSISCAN-01 took out the other cause, an insert's stored-absent check by a
          // sequential scan, whose relation-level SIRead lock failed them: on grizzle 26e3c15f, 9
          // workers met 1,008 40001s in 12 minutes and imports failed after the importer's 30 s of
          // retries (2026-11-09). Measured on a 14-core M4 Pro: at one worker, after the rest in
          // parallel, a full GR8DES_CORPUS=1 run passed in 1408 s.
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
