import { Effect } from "effect";
import { defineConfig } from "vite-plus";
import { cacheTags } from "#plate/test/caches.ts";

export default defineConfig(async () => ({
  test: {
    // Both kinds of browser file, the Node-driven `*.browser.test.ts` and the in-page `*.dom.test.ts`,
    // run only under `vite.browser.config.ts` (`test:browser`), never in this Node run.
    exclude: ["src/**/*.browser.test.ts", "src/**/*.dom.test.ts", "src/**/*.dom.test.tsx"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    // One tag per cache under ~/.cache/gr8des, probed once per run: a missing cache skips the tests
    // that carry its tag, unless PLATE_REQUIRE_CACHES is set (`src/test/caches.ts`).
    tags: [...(await Effect.runPromise(cacheTags))],
  },
}));
