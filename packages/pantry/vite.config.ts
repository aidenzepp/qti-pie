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

// Measured on a 14-core M4 Pro: the database files at one worker after the rest in parallel passed a full
// GR8DES_CORPUS=1 run in 1408 s; one-pool runs failed at 6, 4 and 3 workers (40001, timeouts).
export default defineConfig({
  test: {
    globalSetup: ["./src/test/global-setup.ts"],
    projects: [
      {
        extends: true,
        test: {
          exclude: ["**/node_modules/**", ...databaseFiles],
          include: ["src/**/*.test.ts"],
          name: "free",
          sequence: { groupOrder: 1 },
        },
      },
      {
        extends: true,
        test: {
          include: databaseFiles,
          maxWorkers: 1,
          name: "database",
          sequence: { groupOrder: 2 },
        },
      },
    ],
  },
});
