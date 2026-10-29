import { defineConfig } from "@bjornpagen/grizzle";
import { AuthorApp, Smoke } from "#qti/smoke/schema.ts";

export default defineConfig({ logins: [AuthorApp], schemas: [Smoke] });
