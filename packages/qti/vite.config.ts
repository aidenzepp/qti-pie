import { defineConfig } from "vite-plus";

export default defineConfig({ test: { globalSetup: ["./src/test/global-setup.ts"] } });
