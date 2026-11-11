/**
 * The author role over the test fixture's `Qti`, its author login and the login's workloads, as
 * pantry's own installation and its author-side tests use them.
 *
 * Its own module, apart from `#pantry/test/qti.ts`: the law oracle reaches that fixture, and reads
 * no statement of the schema beyond `#pantry/qti/schema.ts`, so the role and login builders stay
 * out of its reach. Loading this module builds the author login, which holds the author role:
 * grizzle puts a role in one login only, so a test that builds another login over the author role
 * must not load this module.
 */
import { authorLogin } from "#pantry/qti/logins.ts";
import { authorRole } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/test/qti.ts";

/**
 * The author role over {@link Qti}, the role a test opens its `Db` on and builds its ChangeSets
 * for: the one {@link authorLogin} holds.
 */
export const Author = authorRole(Qti);

/**
 * The author application's login over {@link Qti}, `qti__author_app` on the cluster, the login a
 * test's `DbLayer` serves.
 */
export const AuthorApp = authorLogin(Qti);

/**
 * The author login's two workloads: the export's reads, and the import's write program.
 */
export const [exportWork, importWork] = AuthorApp.workload;
