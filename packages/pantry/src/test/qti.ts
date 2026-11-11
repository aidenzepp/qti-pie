/**
 * The composed `Qti` schema, its stored level and the groups of its queries' statements, as
 * pantry's own installation and its tests use them.
 *
 * The law oracle reaches this module (`#pantry/test/oracle.ts`), so it reads
 * `#pantry/qti/schema.ts` and nothing else of the schema: the author role, its login and their
 * workloads are in `#pantry/test/author.ts`, which the oracle never reaches.
 */
import { qtiLevels } from "#pantry/qti/schema.ts";

/**
 * The schema's levels, built by `qtiLevels` when a test loads this module: the one build `qti()`
 * also returns, so loading `#pantry/qti/schema.ts` alone composes nothing.
 */
const levels = qtiLevels();

/**
 * The `Qti` schema pantry's own installation uses, the top level: a test that reads the schema
 * imports it from here.
 */
export const Qti = levels.qti;

/**
 * {@link Qti}'s stored level, whose PostgreSQL schema holds every table.
 */
export const QtiBase = levels.base;

/**
 * The groups of the statements built with {@link Qti}, its queries', by the law each states: the
 * schema's own naming of its laws reads them (`#pantry/test/law-namer.ts` `namedLaws`), which the
 * committed law-name dictionary is generated from.
 */
export const builtLawsByName = levels.lawsByName;
