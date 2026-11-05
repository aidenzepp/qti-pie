import { defineConfig } from "vite-plus";
import type { Reporter } from "vitest/node";

/**
 * Print the residual table once a run ends (doctrine rule 15): each search's residual line, which
 * `@grizzle/testing/vitest`'s `searched` annotates its test with, riskiest first. It is that
 * library's `residualReporter`, which its exports map does not list, so it is restated here, as
 * pantry's config restates it, and it collects each run's rows afresh, so a watch mode's reruns
 * never pile up.
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

export default defineConfig({
  test: {
    // @grizzle/testing's setup draws the run seed every searched() test reads, or replays a given one.
    globalSetup: ["@grizzle/testing/vitest/global-setup"],
    include: ["src/**/*.test.ts"],
    reporters: ["default", residualReporter()],
  },
});
