import { defineConfig } from "vite-plus";

export default defineConfig({
  test: {
    // @grizzle/testing's setup draws the run seed every searched() test reads, or replays a given one.
    globalSetup: ["@grizzle/testing/vitest/global-setup"],
    // A hang guard, never a budget: the slowest test that takes it ran 1.1 s at a load average near
    // 70 on 2026-11-07 (packages/pantry/src/test/timeouts.test.ts holds every suite's).
    hookTimeout: 60_000,
    include: ["src/**/*.test.ts"],
    reporters: ["default", "@grizzle/testing/vitest/reporter"],
    testTimeout: 60_000,
  },
});
