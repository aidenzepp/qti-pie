/**
 * The Astro host's configuration: one on-demand page served by a production build with
 * `@astrojs/node` in standalone mode, on `127.0.0.1:5192` only.
 *
 * `scripts/astro-server.ts` builds and serves it; Astro's dev server is never used, since it
 * injects a script into every page. The dev toolbar is off, and `compressHTML` stays at its
 * default, which leaves `render`'s fragment byte for byte as plate wrote it.
 *
 * @module
 */
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

export default defineConfig({
  adapter: node({ mode: "standalone" }),
  devToolbar: { enabled: false },
  output: "server",
  server: { host: "127.0.0.1", port: 5192 },
});
