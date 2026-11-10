/**
 * This package's own install's schema: the QTI 3.0 schema this process opens, built once, here.
 * Only this package's own modules import it, its importer and command line and its tests, and its
 * author login (`#pantry/qti/own-login.ts`); the builders an install outside it calls
 * (`#pantry/qti/schema.ts`, `#pantry/qti/logins.ts`, `#pantry/export/scan.ts`) never do, so loading
 * them builds no schema, and such an install builds and holds its own.
 *
 * Its policy is the one of the install `GR8DES_QTI_INSTALL` names (`#pantry/db/install.ts`), and
 * this package's own, none, where it names none.
 */
import { installedPolicy } from "#pantry/db/install.ts";
import { qtiLevelsOf } from "#pantry/qti/schema.ts";

/**
 * The schema's levels for this process's install (`#pantry/qti/schema.ts` `qtiLevelsOf`).
 */
const levels = qtiLevelsOf(installedPolicy);

/**
 * The QTI 3.0 schema this process opens.
 */
export const Qti = levels.qti;

/**
 * {@link Qti}'s stored level, whose PostgreSQL schema holds every table.
 */
export const QtiBase = levels.base;

/**
 * The groups of the statements built with {@link Qti}, its policy's and its queries', by the law
 * each states: the schema's own naming of its laws reads them (`#pantry/test/law-namer.ts`
 * `namedLaws`), which the committed law-name dictionary is generated from.
 */
export const builtLawsByName = levels.lawsByName;
