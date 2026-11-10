import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

/**
 * The directory of the workflows under test: the per-PR checks the cloud fan-out's branches run.
 */
const workflows = path.resolve(import.meta.dirname, "..", "..", "..", "..", ".github", "workflows");

/**
 * A workflow file under test, by its name in that directory.
 */
type Workflow = "main.yml" | "plate.yml";

/**
 * The failure of reading a workflow file.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
class WorkflowUnreadable extends Schema.TaggedError<WorkflowUnreadable>()("WorkflowUnreadable", {
  detail: Schema.String,
}) {}

/**
 * Read a workflow's job steps, each as the text of its list item, in order.
 *
 * The workflow is read as text, one step per ` - ` item under ` steps:`, because plate declares no
 * YAML parser and the shape pinned here is the order and content of those items.
 *
 * @param name The workflow file to read.
 * @returns The whole file, and each step's text.
 */
const readSteps = (
  name: Workflow,
): Effect.Effect<
  { readonly file: string; readonly steps: readonly string[] },
  WorkflowUnreadable
> =>
  Effect.try({
    catch: (cause) => new WorkflowUnreadable({ detail: String(cause) }),
    try: () => {
      const file = readFileSync(path.join(workflows, name), "utf-8");
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

/**
 * Whether a step is an `actions/cache` step keeping the given path.
 *
 * Two cache steps share a workflow, so a cache step is told apart by its `path:`, not by the
 * action it uses.
 *
 * @param cachePath The `path:` the sought cache step keeps, as written in the workflow.
 * @returns The matcher for {@link indexOf}.
 */
const cacheOf =
  (cachePath: string) =>
  (step: string): boolean =>
    step.includes("actions/cache@") && step.includes(`path: ${cachePath}\n`);

/**
 * Assert that every `uses:` line in a workflow names a full commit sha with its version in a
 * comment, so no action floats on a tag.
 *
 * @param file The workflow's text.
 */
const assertPinnedActions = (file: string): void => {
  const uses = file.split("\n").filter((line) => line.includes("uses: "));

  assert.isAbove(uses.length, 0);

  for (const line of uses) {
    assert.match(line, /uses: [\w.-]+\/[\w.-]+@[0-9a-f]{40} # v\d+(?:\.\d+)*$/u, line);
  }
};

/**
 * Assert the positions of the browser steps a workflow's job ends with: the playwright-core version
 * read, the browsers cache keyed by it, the install on a cache miss, the system libraries, and the
 * browser suite, in that order and all after the unit suite.
 *
 * @param steps Each step's text, in order.
 * @param test The index of the plate unit suite's step.
 */
const assertBrowserSteps = (steps: readonly string[], test: number): void => {
  const version = indexOf(steps, "playwright version", (step) =>
    step.startsWith("id: playwright\n"),
  );
  const browsers = indexOf(steps, "browsers cache", cacheOf("~/.cache/gr8des/ms-playwright"));
  const install = indexOf(steps, "browsers install", (step) =>
    step.includes("run: pnpm --filter @qti-pie/plate run browsers\n"),
  );
  const deps = indexOf(steps, "install-deps", (step) =>
    step.startsWith(
      "run: pnpm --filter @qti-pie/plate exec playwright-core install-deps chromium webkit\n",
    ),
  );
  const browser = indexOf(steps, "test:browser", (step) =>
    step.startsWith("run: pnpm --filter @qti-pie/plate run test:browser\n"),
  );

  assert.include(
    steps[version],
    'run: echo "version=$(node -p "require(\'./packages/plate/node_modules/playwright-core/package.json\').version")" >> "$GITHUB_OUTPUT"\n',
  );
  assert.include(steps[browsers], "id: browsers\n");
  assert.include(
    steps[browsers],
    // oxlint-disable-next-line no-template-curly-in-string -- the text is a GitHub Actions expression, not a template.
    "key: playwright-${{ runner.os }}-${{ steps.playwright.outputs.version }}\n",
  );
  assert.match(steps[install] ?? "", /^if: steps\.browsers\.outputs\.cache-hit != 'true'\n/u);
  assert.isBelow(test, version);
  assert.isBelow(version, browsers);
  assert.isBelow(browsers, install);
  assert.isBelow(install, deps);
  assert.isBelow(deps, browser);
};

describe(".github/workflows/plate.yml", () => {
  it.effect("runs only on pull requests into the renderer area branches and the gate branch", () =>
    Effect.gen(function* trigger() {
      const { file } = yield* readSteps("plate.yml");

      assert.include(
        file,
        'on:\n  pull_request:\n    branches: ["renderer/*/main", "gate/cloud-fanout"]\n',
      );
      assert.notInclude(file, "push:");
    }),
  );

  it.effect("pins every action to a full commit sha with its version in a comment", () =>
    Effect.gen(function* pinned() {
      const { file } = yield* readSteps("plate.yml");

      assertPinnedActions(file);
    }),
  );

  it.effect(
    "checks out the whole history, which the ledger's agreement test reads with git show",
    () =>
      Effect.gen(function* history() {
        const { steps } = yield* readSteps("plate.yml");
        const checkout =
          steps[indexOf(steps, "checkout", (step) => step.includes("actions/checkout@"))];

        assert.include(checkout, "fetch-depth: 0");
        assert.include(checkout, "lfs: true");
      }),
  );

  it.effect("installs xmllint from libxml2-utils after setup-node and before the checks", () =>
    Effect.gen(function* xmllint() {
      const { steps } = yield* readSteps("plate.yml");
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
        const { steps } = yield* readSteps("plate.yml");
        const step = steps[indexOf(steps, "gr8des cache", cacheOf("~/.cache/gr8des"))] ?? "";

        assert.match(step, /^uses: actions\/cache@[0-9a-f]{40} # v4\.\d+\.\d+\n/u);
        assert.include(
          step,
          // oxlint-disable-next-line no-template-curly-in-string -- the text is a GitHub Actions expression, not a template.
          "key: gr8des-${{ runner.os }}-${{ hashFiles('packages/plate/scripts/cloud/fetch-caches.sh', 'packages/plate/src/test/xsd-layout.ts') }}\n",
        );
      }),
  );

  it.effect(
    "keeps Playwright's browsers with a second actions/cache, keyed by the installed playwright-core's version",
    () =>
      Effect.gen(function* browsersCache() {
        const { steps } = yield* readSteps("plate.yml");
        const step =
          steps[indexOf(steps, "browsers cache", cacheOf("~/.cache/gr8des/ms-playwright"))] ?? "";

        assert.match(
          step,
          /^id: browsers\n {8}uses: actions\/cache@[0-9a-f]{40} # v4\.\d+\.\d+\n/u,
        );
        assert.include(
          step,
          // oxlint-disable-next-line no-template-curly-in-string -- the text is a GitHub Actions expression, not a template.
          "key: playwright-${{ runner.os }}-${{ steps.playwright.outputs.version }}\n",
        );
      }),
  );

  it.effect(
    "restores the cache, fetches what is missing, runs pnpm check and the unit suite, then the browser steps",
    () =>
      Effect.gen(function* order() {
        const { steps } = yield* readSteps("plate.yml");
        const cache = indexOf(steps, "gr8des cache", cacheOf("~/.cache/gr8des"));
        const fetch = indexOf(steps, "fetch-caches", (step) =>
          step.startsWith("run: bash packages/plate/scripts/cloud/fetch-caches.sh"),
        );
        const check = indexOf(steps, "pnpm check", (step) => step.startsWith("run: pnpm check"));
        const test = indexOf(steps, "test", (step) =>
          step.startsWith("run: pnpm --filter @qti-pie/plate test\n"),
        );

        assert.isBelow(cache, fetch);
        assert.isBelow(fetch, check);
        assert.isBelow(check, test);
        assertBrowserSteps(steps, test);
      }),
  );

  it.effect("sets PLATE_TIMING_SCALE to 3 on the test step, the slower runner's allowance", () =>
    Effect.gen(function* scale() {
      const { steps } = yield* readSteps("plate.yml");
      const test = indexOf(steps, "test", (step) =>
        step.startsWith("run: pnpm --filter @qti-pie/plate test\n"),
      );

      assert.match(steps[test] ?? "", /\n {8}env:\n(?: {10}#.*\n)* {10}PLATE_TIMING_SCALE: "3"\n/u);
    }),
  );
});

describe(".github/workflows/main.yml", () => {
  it.effect("runs only on pull requests into main", () =>
    Effect.gen(function* trigger() {
      const { file } = yield* readSteps("main.yml");

      assert.include(file, 'on:\n  pull_request:\n    branches: ["main"]\n');
      assert.notInclude(file, "push:");
    }),
  );

  it.effect("pins every action to a full commit sha with its version in a comment", () =>
    Effect.gen(function* pinned() {
      const { file } = yield* readSteps("main.yml");

      assertPinnedActions(file);
    }),
  );

  it.effect(
    "runs pnpm check, crust's tests, pantry's database-free project, then plate's unit and browser steps",
    () =>
      Effect.gen(function* order() {
        const { steps } = yield* readSteps("main.yml");
        const check = indexOf(steps, "pnpm check", (step) => step.startsWith("run: pnpm check\n"));
        const crust = indexOf(steps, "crust test", (step) =>
          step.startsWith("run: pnpm --filter @qti-pie/crust test\n"),
        );
        const pantry = indexOf(steps, "pantry free", (step) =>
          step.startsWith("run: pnpm --filter @qti-pie/pantry test --project free\n"),
        );
        const test = indexOf(steps, "plate test", (step) =>
          step.startsWith("run: pnpm --filter @qti-pie/plate test\n"),
        );

        assert.isBelow(check, crust);
        assert.isBelow(crust, pantry);
        assert.isBelow(pantry, test);
        assertBrowserSteps(steps, test);
      }),
  );
});
