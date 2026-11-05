import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // The browser files run only under `vite.browser.config.ts` (`test:browser`).
    exclude: ["src/**/*.browser.test.ts"],
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
