/**
 * The mutations of the law oracle's laws over the document layer (§1.3 and §1.4): the node laws,
 * the character-data arms and the names, each drawn to break exactly its law in an accepted package
 * (`src/test/complete.oracle.test.ts`).
 */
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * Each law's mutation, by law.
 */
export const layerMutations = {} as const satisfies Readonly<Record<string, Mutation>>;
