/**
 * This package's own install's login: the author application over the schema this process opens
 * (`#pantry/qti/own.ts`) and its author role, built once, here, when this module is evaluated. It
 * is test support, for the tests that read the login or its role (`src/qti/schema.test.ts`,
 * `src/import/roster.test.ts`, `src/test/direct-sql.ts`). No production module loads it: the
 * database layer serves the login's committed file instead (`#pantry/db/served.ts`,
 * `#pantry/db/layer.ts`), and `src/cli/startup.test.ts` holds the static imports of that layer and
 * of the dry run clear of it.
 */
import { authorAppOf } from "#pantry/qti/logins.ts";
import { Qti } from "#pantry/qti/own.ts";

/**
 * The author application's login over `Qti` (`#pantry/qti/logins.ts` `authorAppOf`).
 */
export const AuthorApp = authorAppOf(Qti);

/**
 * The author role, the one role of {@link AuthorApp}.
 */
export const Author = AuthorApp.roles.author.role;
