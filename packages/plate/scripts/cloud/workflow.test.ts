import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

/**
 * The plate workflow under test, the per-PR checks the cloud fan-out's area branches run.
 */
const workflow = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  ".github",
  "workflows",
  "plate.yml",
);

/**
 * The failure of reading the workflow file.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
class WorkflowUnreadable extends Schema.TaggedError<WorkflowUnreadable>()("WorkflowUnreadable", {
  detail: Schema.String,
}) {}

/**
 * Read the workflow's job steps, each as the text of its list item, in order.
 *
 * The workflow is read as text, one step per ` - ` item under ` steps:`, because plate declares no
 * YAML parser and the shape pinned here is the order and content of those items.
 *
 * @returns The whole file, and each step's text.
 */
const readSteps = (): Effect.Effect<
  { readonly file: string; readonly steps: readonly string[] },
  WorkflowUnreadable
> =>
  Effect.try({
    catch: (cause) => new WorkflowUnreadable({ detail: String(cause) }),
    try: () => {
      const file = readFileSync(workflow, "utf-8");
      const [, body = ""] = file.split("\n    steps:\n");

      return { file, steps: body.split(/^ {6}- /mu).slice(1) };
    },
  });

/**
 * Find the position of the one step that matches, failing the test when none or several do.
 *
 * @param steps Each step's text, in order.
 * @param label What the step is, for the failure message.
 * @param matches Whether a step is the one sought.
 * @returns The step's index.
 */
const indexOf = (
  steps: readonly string[],
  label: string,
  matches: (step: string) => boolean,
): number => {
  const found = steps.flatMap((step, index) => (matches(step) ? [index] : []));

  assert.lengthOf(found, 1, `expected one ${label} step, found ${found.length}`);

  return found[0] ?? -1;
};

describe(".github/workflows/plate.yml", () => {
  it.effect("runs only on pull requests into the renderer area branches", () =>
    Effect.gen(function* trigger() {
      const { file } = yield* readSteps();

      assert.include(file, 'on:\n  pull_request:\n    branches: ["renderer/*/main"]\n');
      assert.notInclude(file, "push:");
    }),
  );

  it.effect("pins every action to a full commit sha with its version in a comment", () =>
    Effect.gen(function* pinned() {
      const { file } = yield* readSteps();
      const uses = file.split("\n").filter((line) => line.includes("uses: "));

      assert.isAbove(uses.length, 0);

      for (const line of uses) {
        assert.match(line, /uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+(?:\.\d+)*$/u, line);
      }
    }),
  );

  it.effect(
    "checks out the whole history, which the ledger's agreement test reads with git show",
    () =>
      Effect.gen(function* history() {
        const { steps } = yield* readSteps();
        const checkout =
          steps[indexOf(steps, "checkout", (step) => step.includes("actions/checkout@"))];

        assert.include(checkout, "fetch-depth: 0");
        assert.include(checkout, "lfs: true");
      }),
  );

  it.effect("installs xmllint from libxml2-utils after setup-node and before the checks", () =>
    Effect.gen(function* xmllint() {
      const { steps } = yield* readSteps();
      const node = indexOf(steps, "setup-node", (step) => step.includes("actions/setup-node@"));
      const apt = indexOf(steps, "apt", (step) => step.includes("apt-get install"));
      const check = indexOf(steps, "pnpm check", (step) => step.startsWith("run: pnpm check"));

      assert.match(
        steps[apt] ?? "",
        /^run: sudo apt-get update && sudo apt-get install -y --no-install-recommends libxml2-utils\n/u,
      );
      assert.isBelow(node, apt);
      assert.isBelow(apt, check);
    }),
  );

  it.effect(
    "keeps ~/.cache/gr8des with actions/cache, keyed by what decides the caches' contents",
    () =>
      Effect.gen(function* cache() {
        const { steps } = yield* readSteps();
        const step =
          steps[indexOf(steps, "actions/cache", (text) => text.includes("actions/cache@"))] ?? "";

        assert.match(step, /^uses: actions\/cache@[0-9a-f]{40} # v4\.\d+\.\d+\n/u);
        assert.include(step, "path: ~/.cache/gr8des\n");
        assert.include(
          step,
          // oxlint-disable-next-line no-template-curly-in-string -- the text is a GitHub Actions expression, not a template.
          "key: gr8des-${{ runner.os }}-${{ hashFiles('packages/plate/scripts/cloud/fetch-caches.sh', 'packages/plate/src/test/xsd-layout.ts') }}\n",
        );
      }),
  );

  it.effect("restores the cache, fetches what is missing, then runs pnpm check and the tests", () =>
    Effect.gen(function* order() {
      const { steps } = yield* readSteps();
      const cache = indexOf(steps, "actions/cache", (step) => step.includes("actions/cache@"));
      const fetch = indexOf(steps, "fetch-caches", (step) =>
        step.startsWith("run: bash packages/plate/scripts/cloud/fetch-caches.sh"),
      );
      const check = indexOf(steps, "pnpm check", (step) => step.startsWith("run: pnpm check"));
      const test = indexOf(steps, "test", (step) =>
        step.startsWith("run: pnpm --filter @qti-pie/plate test"),
      );

      assert.isBelow(cache, fetch);
      assert.isBelow(fetch, check);
      assert.isBelow(check, test);
    }),
  );
});
