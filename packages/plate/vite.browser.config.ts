import { defineConfig } from "vite-plus";

/**
 * The browser files' run (`test:browser`): the `src/**\/*.browser.test.ts` files, one at a time in
 * one worker. The unit run (`vite.config.ts`) excludes them.
 *
 * `globalSetup` (`src/test/browser-setup.ts`) runs before any file: it refuses the run while the
 * 1-minute load average is at the cap or above, so no engine launches, and while an engine is not
 * installed, so no test runs.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
    globalSetup: ["src/test/browser-setup.ts"],
    hookTimeout: 120_000,
    include: ["src/**/*.browser.test.ts"],
    maxWorkers: 1,
    testTimeout: 60_000,
  },
});
