import { defineConfig } from "@bjornpagen/grizzle";
import { AuthorApp } from "#pantry/schema/logins.ts";
import { Qti } from "#pantry/schema/qti.ts";

export default defineConfig({ logins: [AuthorApp], schemas: [Qti] });
