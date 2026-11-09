/**
 * The committed securing tables, `securing-tables.generated.json`, expanded: what `checkAdmitted`
 * secures a document content admission already checked by, in place of the full XSD tables.
 *
 * `src/validate/securing.ts` says what the projection holds and how to regenerate it. A host that
 * serves admitted content loads this module and never `src/validate/tables.ts`. Loading it parses
 * the file and replaces each index by what it refers to, so each list is one array that every row
 * naming it shares. The test checks the file once, at authoring time, and no load re-checks it.
 *
 * @module
 */
import committed from "#plate/validate/securing-tables.generated.json" with { type: "json" };
import { expandSecuringTables } from "#plate/validate/securing.ts";
import type { SecuringTablesFile } from "#plate/validate/securing.ts";
import type { SecuringTables } from "#plate/validate/xsd.ts";

/**
 * The committed file, as the JSON module holds it.
 */
// SAFETY: src/validate/securing.test.ts decodes this file as SecuringTablesFile, refusing a key that Schema does not name, and proves it is what projectSecuringTables writes from the committed full tables; a JSON module types its strings as string, never as the literals SecuringTablesFile holds, so only an assertion names the type.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
const file = committed as SecuringTablesFile;

/**
 * The securing tables: each element's and named type's declared attributes and the fields the
 * structural walk reads, the same values the full tables hold there.
 */
export const securingTables: SecuringTables = expandSecuringTables(file);
