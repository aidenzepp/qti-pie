/**
 * The terms of content packages that the schema (`#pantry/qti/package.ts`) and the importer
 * (`#pantry/import/program.ts`, `#pantry/import/overlays/package.ts`) both read. Loading this
 * module builds no relation of the schema.
 */

/**
 * The path of a package's manifest, the one entry no `cp:file` need list and the one document that
 * is no resource's (spec reading 146).
 */
export const manifestPath = "imsmanifest.xml";
