import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

/**
 * The Playwright provider without its `prewarm` hook. Vitest calls `prewarm` while it creates the
 * browser server, before `globalSetup`, and the stock hook launches each engine there, even when
 * `globalSetup` then refuses the run; without it the provider launches an engine only when it opens
 * the first page, after `globalSetup` passed.
 */
const { prewarm: _prewarm, ...provider } = playwright();

/**
 * The browser files' run (`test:browser`), in one run and one report, as two projects: the
 * Node-driven files (`src/**\/*.browser.test.ts`, project `node`), one at a time in one worker,
 * and the in-page files (`src/**\/*.dom.test.ts`, project `page`), inside Chromium and WebKit
 * headless under Vitest's browser mode with the Playwright provider. The unit run
 * (`vite.config.ts`) excludes both.
 *
 * The in-page project's server binds `127.0.0.1`, with the port left to Vitest (63315, or the next
 * free port up), so it is never `::1` or every interface, as Vite's default `localhost` may be, and
 * two worktrees' runs never collide on a fixed port.
 *
 * `globalSetup` (`src/test/browser-setup.ts`) runs before any file and, because the provider has no
 * `prewarm`, before any engine launches: it refuses the run while the 1-minute load average is at
 * the cap or above, and while an engine is not installed, so no engine starts and no test runs.
 */
export default defineConfig({
  test: {
    fileParallelism: false,
    globalSetup: ["src/test/browser-setup.ts"],
    hookTimeout: 120_000,
    maxWorkers: 1,
    projects: [
      {
        extends: true,
        test: {
          include: ["src/**/*.browser.test.ts"],
          name: "node",
        },
      },
      {
        extends: true,
        test: {
          api: { host: "127.0.0.1" },
          browser: {
            enabled: true,
            headless: true,
            instances: [{ browser: "chromium" }, { browser: "webkit" }],
            provider,
          },
          include: ["src/**/*.dom.test.ts"],
          name: "page",
        },
      },
    ],
    testTimeout: 60_000,
  },
});
