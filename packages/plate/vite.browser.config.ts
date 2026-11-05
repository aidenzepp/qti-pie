import { defineConfig } from "vite-plus";

/**
 * The browser files' run (`test:browser`): the `src/**\/*.browser.test.ts` files, one at a time in
 * one worker. The unit run (`vite.config.ts`) excludes them.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
    hookTimeout: 120_000,
    include: ["src/**/*.browser.test.ts"],
    maxWorkers: 1,
    testTimeout: 60_000,
  },
});
