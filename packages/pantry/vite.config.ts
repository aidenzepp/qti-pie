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
//
// Measured on a 14-core M4 Pro: the database files at one worker after the rest in parallel passed a full
// GR8DES_CORPUS=1 run in 1408 s; one-pool runs failed at 6, 4 and 3 workers (40001, timeouts).
// On grizzle 26e3c15f, which carries c4f77a3d's fix of the owner insert's scan, 9 workers still met 1,008
// 40001s in 12 minutes, and imports failed after the importer's 30 s of retries (2026-11-09).
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
