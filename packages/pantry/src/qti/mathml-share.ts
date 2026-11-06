/**
 * The MathML share laws (spec reading 2, MathML 3 validity): the module the share slice of phase 6
 * revision N fills. Its slice will state the law "MathML share cycle".
 *
 * It declares no relation and states no law yet, so {@link shareRelations} and {@link shareLaws} are
 * empty and `#pantry/qti/mathml.ts` composes them into `Qti` ahead of their slice.
 */
import type { Statement } from "@bjornpagen/grizzle";

/**
 * The relations the share laws declare: none yet.
 */
export const shareRelations = {};

/**
 * The share laws: none yet.
 */
export const shareLaws: readonly Statement[] = [];
