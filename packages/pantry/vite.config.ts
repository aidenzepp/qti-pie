import { globSync, readFileSync } from "node:fs";
import { defineConfig } from "vite-plus";
import type { Reporter } from "vitest/node";

/**
 * Print the residual table once a run ends (doctrine rule 15): each search's residual line, which
 * `@grizzle/testing/vitest`'s `searched` annotates its test with, riskiest first. It is that
 * library's `residualReporter`, which its exports map does not list, so it is restated here, and it
 * collects each run's rows afresh, so a watch mode's reruns never pile up.
 *
 * @returns The reporter.
 */
const residualReporter = (): Reporter => {
  let rows: { readonly line: string; readonly risk: number }[] = [];

  return {
    onTestCaseAnnotate: (_testCase, annotation) => {
      if (annotation.type === "residual") {
        rows.push({ line: annotation.message, risk: Number(annotation.attachment?.body ?? "0") });
      }
    },
    onTestRunEnd: () => {
      const ended = rows.toSorted((left, right) => right.risk - left.risk);
      rows = [];
      if (ended.length > 0) {
        process.stdout.write(
          ["residual risk, riskiest first:", ...ended.map(({ line }) => `  ${line}`), ""].join(
            "\n",
          ),
        );
      }
    },
    onTestRunStart: () => {
      rows = [];
    },
  };
};

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
    // @grizzle/testing's setup draws the run seed every searched() test reads, or replays a given one.
    globalSetup: ["@grizzle/testing/vitest/global-setup", "./src/test/global-setup.ts"],
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
    reporters: ["default", residualReporter()],
  },
});
