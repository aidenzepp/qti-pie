/**
 * The mutations of the law oracle's laws over the declarations, the LOM title and the laws lane OL
 * added (#pantry/test/oracle-laws/documents.ts), each drawn to break exactly its law in an accepted
 * package (`src/test/oracle.complete.test.ts`).
 */
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * Each law's mutation, by law.
 */
export const documentMutations = {} as const satisfies Readonly<Record<string, Mutation>>;
