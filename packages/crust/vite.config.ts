import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // @grizzle/testing's setup draws the run seed every searched() test reads, or replays a given one.
    globalSetup: ["@grizzle/testing/vitest/global-setup"],
    include: ["src/**/*.test.ts"],
    reporters: ["default", "@grizzle/testing/vitest/reporter"],
  },
});
