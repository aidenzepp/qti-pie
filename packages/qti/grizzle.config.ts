import { defineConfig } from "@bjornpagen/grizzle";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Qti } from "#qti/schema/qti.ts";

export default defineConfig({ logins: [AuthorApp], schemas: [Qti] });
