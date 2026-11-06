/**
 * The MathML align laws (spec reading 2, MathML 3 validity): the module the align slice of phase 6
 * revision N fills. Its slice will state the laws "MathML maction selection", "MathML align
 * placement" and "MathML align first".
 *
 * It declares no relation and states no law yet, so {@link alignRelations} and {@link alignLaws} are
 * empty and `#pantry/qti/mathml.ts` composes them into `Qti` ahead of their slice.
 */
import type { Statement } from "@bjornpagen/grizzle";

/**
 * The relations the align laws declare: none yet.
 */
export const alignRelations = {};

/**
 * The align laws: none yet.
 */
export const alignLaws: readonly Statement[] = [];
