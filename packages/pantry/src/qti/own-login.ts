/**
 * This package's own install's login: the author application over the schema this process opens
 * (`#pantry/qti/own.ts`), its author role and its workloads, built once, here, when this module is
 * evaluated. The database layer loads it once its settings resolve (`#pantry/db/layer.ts`), and no
 * module the dry run or `--help` loads reaches it (`src/cli/startup.test.ts`).
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

/**
 * The author application's workloads: the export's reads, and the import's write program.
 */
export const [exportWork, importWork] = AuthorApp.workload;

/**
 * The export's reads of the documents and the entries over `Qti`, the very queries
 * {@link exportWork} holds.
 */
export const { documentsOf, entriesOf } = exportWork.programs;

/**
 * The export's scan of one document's nodes over `Qti`, the very ordered query {@link exportWork}
 * pages (`paged(documentScan)`, `#pantry/qti/logins.ts`).
 */
export const documentScan = exportWork.programs.documentScan.paged;
