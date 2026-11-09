/**
 * The tables of the QTI 3.0 ASI XSD, committed as `tables.generated.json` so that validation never
 * reads or parses the XSD at run time.
 *
 * `scripts/tables.ts` reads the cached XSD at `xsdPath` (`src/validate/xsd.ts`), generates the
 * tables with `generateTables` and writes the JSON, which {@link tables} loads. The test proves the
 * committed file is what the generator builds from that XSD today, that it decodes as `Tables`
 * with no key `Tables` does not name, and that the XSD is the one {@link xsdSha256} names. To
 * regenerate, from the repository root:
 *
 * ```sh
 * node packages/plate/scripts/tables.ts && pnpm exec vp fmt packages/plate/src/validate/tables.generated.json
 * ```
 *
 * `open` loads this module on a host's serving path, so loading it does no work but the JSON
 * module's parse: the test checks the file once, at authoring time, and no load re-checks it.
 *
 * @module
 */
import committed from "#plate/validate/tables.generated.json" with { type: "json" };
import type { Tables } from "#plate/validate/xsd.ts";

/**
 * The SHA-256 of the XSD the committed tables were generated from: the full QTI 3.0 ASI XSD,
 * `imsqti_asiv3p0p1_v1p0.xsd`, which D4 rules the only source of the tables.
 */
export const xsdSha256 = "bd82f6df3c7acec951fffc78548325a01e9e9bc91d5768d7415bdcbdc018341d";

/**
 * The committed tables, `tables.generated.json`, as the JSON module holds them: one element table
 * per local name the XSD declares in the QTI namespace.
 */
// SAFETY: src/validate/tables.test.ts decodes this file as Tables, refusing a key Tables does not name, and proves it is what generateTables builds from the XSD xsdSha256 names; a JSON module types its strings as string, never as the literals Tables holds, so only an assertion names the type.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
export const tables: Tables = committed as Tables;
