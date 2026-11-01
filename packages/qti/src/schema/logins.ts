/**
 * The logins that open a connection: the author application, with no programs yet.
 */
import { login } from "@bjornpagen/grizzle";
import { Qti } from "#qti/schema/qti.ts";
import { Author } from "#qti/schema/roles.ts";

export const AuthorApp = login(Qti, "author_app", [Author], { workload: [] });
