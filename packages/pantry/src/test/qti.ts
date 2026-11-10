/**
 * The composed `Qti` schema, its author role and its author login, as pantry's own installation
 * and its tests use them.
 */
import { authorLogin } from "#pantry/qti/logins.ts";
import { authorRole } from "#pantry/qti/roles.ts";
import { qti } from "#pantry/qti/schema.ts";

/**
 * The `Qti` schema pantry's own installation uses, built by {@link qti} when a test loads this
 * module: a test that reads the schema imports it from here, and loading
 * `#pantry/qti/schema.ts` alone composes nothing.
 */
export const Qti = qti();

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
