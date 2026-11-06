/**
 * The MathML apply laws (spec reading 2, MathML 3 validity): the module the apply slice of phase 6
 * revision N fills. Its slice will state the laws "MathML arity" and "MathML head qualifier".
 *
 * It declares no relation and states no law yet, so {@link applyRelations} and {@link applyLaws} are
 * empty and `#pantry/qti/mathml.ts` composes them into `Qti` ahead of their slice.
 */
import type { Statement } from "@bjornpagen/grizzle";

/**
 * The relations the apply laws declare: none yet.
 */
export const applyRelations = {};

/**
 * The apply laws: none yet.
 */
export const applyLaws: readonly Statement[] = [];
