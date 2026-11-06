/**
 * The MathML cn laws (spec reading 2, MathML 3 validity): the module the cn slice of phase 6
 * revision N fills. Its slice will state the law "MathML cn form".
 *
 * It declares no relation and states no law yet, so {@link cnRelations} and {@link cnLaws} are
 * empty and `#pantry/qti/mathml.ts` composes them into `Qti` ahead of their slice.
 */
import type { Statement } from "@bjornpagen/grizzle";

/**
 * The relations the cn laws declare: none yet.
 */
export const cnRelations = {};

/**
 * The cn laws: none yet.
 */
export const cnLaws: readonly Statement[] = [];
