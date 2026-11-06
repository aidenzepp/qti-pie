/**
 * The mutations of the law oracle's laws over the tests and sections
 * (#pantry/test/oracle-laws/tests.ts), each drawn to break exactly its law in an accepted package
 * (`src/test/oracle.complete.test.ts`).
 */
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * Each law's mutation, by law.
 */
export const testMutations = {} as const satisfies Readonly<Record<string, Mutation>>;
