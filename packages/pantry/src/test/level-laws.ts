/**
 * The laws a level adds over the level below it, as the level tests read them: grizzle's `lawsOf`
 * of each level, compared by `sameLaw`.
 */
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";

/**
 * Select the laws a level states that a lower level does not.
 *
 * @param laws - The level's laws.
 * @param lower - The lower level's laws.
 * @returns The laws only the level states, in its order.
 */
export const addedLaws = (laws: readonly Law[], lower: readonly Law[]): readonly Law[] =>
  laws.filter((law) => !lower.some((held) => sameLaw(held, law)));
