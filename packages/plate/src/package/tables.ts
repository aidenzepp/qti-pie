/**
 * The tables of the two QTI 3.0 content packaging profiles, committed as `tables.generated.json` so
 * that a manifest is checked without reading or parsing an XSD at run time.
 *
 * A package's `metadata/schemaversion` names its CP version, `3.0.0` or `3.0.1`, and each version's
 * profile imports the schemas of LOM, QTI metadata, curriculum standards and the CP extension. For
 * each version the file holds the tables and the occurrences of every namespace that profile's
 * tables reach, keyed by namespace URI, each generated from the one cached schema that declares the
 * namespace. XLink's schema is imported but reached by nothing, so it has no table.
 *
 * `scripts/package-tables.ts` reads the cached XSDs, generates the tables with `generateTables` and
 * `generateOccurrences` and writes the JSON, which this module loads. The test proves the committed
 * file is what the script builds today, that it decodes as {@link PackageTablesFile} with no key
 * that Schema does not name, and that every XSD it reads has the SHA-256 the test lists. To
 * regenerate, from the repository root:
 *
 * ```sh
 * node packages/plate/scripts/package-tables.ts && pnpm exec vp fmt packages/plate/src/package/tables.generated.json
 * ```
 *
 * Loading this module decodes nothing: the test checks the file once, at authoring time, and the
 * maps below hold the JSON module's own objects.
 *
 * @module
 */
import { Schema } from "effect";
import committed from "#plate/package/tables.generated.json" with { type: "json" };
import { Occurrences, Tables } from "#plate/validate/xsd.ts";

/**
 * The Schema of the committed file: per CP version, per namespace URI, that namespace's
 * occurrences and tables. The test decodes the file by it.
 */
export const PackageTablesFile = Schema.Record(
  Schema.String,
  Schema.Record(Schema.String, Schema.Struct({ occurrences: Occurrences, tables: Tables })),
);

/**
 * The committed file, as the JSON module holds it.
 */
// SAFETY: src/package/tables.test.ts decodes this file as PackageTablesFile, refusing a key that Schema does not name, and proves it is what scripts/package-tables.ts builds; a JSON module types its strings as string, never as the literals Tables holds, so only an assertion names the type.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
const file = committed as typeof PackageTablesFile.Type;

/**
 * The committed tables: per CP version, `3.0.0` and `3.0.1`, the tables of each namespace its
 * profile reaches, keyed by namespace URI.
 */
export const packageTables: ReadonlyMap<string, ReadonlyMap<string, Tables>> = new Map(
  Object.entries(file).map(([version, namespaces]) => [
    version,
    new Map(Object.entries(namespaces).map(([namespace, { tables }]) => [namespace, tables])),
  ]),
);

/**
 * The committed occurrences, keyed as {@link packageTables} is: how many times each element and
 * named type of a namespace admits each child it names.
 */
export const packageOccurrences: ReadonlyMap<string, ReadonlyMap<string, Occurrences>> = new Map(
  Object.entries(file).map(([version, namespaces]) => [
    version,
    new Map(
      Object.entries(namespaces).map(([namespace, { occurrences }]) => [namespace, occurrences]),
    ),
  ]),
);
