import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // Both kinds of browser file, the Node-driven `*.browser.test.ts` and the in-page `*.dom.test.ts`,
    // run only under `vite.browser.config.ts` (`test:browser`), never in this Node run.
    exclude: ["src/**/*.browser.test.ts", "src/**/*.dom.test.ts"],
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
