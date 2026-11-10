/**
 * The composed `Qti` schema, as pantry's own installation and its tests use it.
 *
 * The law oracle reaches this module (`#pantry/test/oracle.ts`), so it reads
 * `#pantry/qti/schema.ts` and nothing else of the schema: the author role, its login and their
 * workloads are in `#pantry/test/author.ts`, which the oracle never reaches.
 */
import { qti } from "#pantry/qti/schema.ts";

/**
 * The `Qti` schema pantry's own installation uses, built by {@link qti} when a test loads this
 * module: a test that reads the schema imports it from here, and loading
 * `#pantry/qti/schema.ts` alone composes nothing.
 */
export const Qti = qti();
