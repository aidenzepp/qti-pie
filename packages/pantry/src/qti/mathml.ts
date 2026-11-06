/**
 * The MathML laws (spec reading 2, MathML 3 validity) of phase 6 revision N, composed from the four
 * families each slice of the phase fills: apply (arity and head qualifiers), cn (the form of a
 * number's content), align (action selection and alignment groups) and share (the `share` cycle).
 *
 * {@link mathmlRelations} and {@link mathmlLaws} are `#pantry/qti/schema.ts`'s MathML members: the
 * four families' relations and laws, spread in that order.
 */
import { alignLaws, alignRelations } from "#pantry/qti/mathml-align.ts";
import { applyLaws, applyRelations } from "#pantry/qti/mathml-apply.ts";
import { cnLaws, cnRelations } from "#pantry/qti/mathml-cn.ts";
import { shareLaws, shareRelations } from "#pantry/qti/mathml-share.ts";

/**
 * The relations of the four MathML families, in the order apply, cn, align, share.
 */
export const mathmlRelations = {
  ...applyRelations,
  ...cnRelations,
  ...alignRelations,
  ...shareRelations,
};

/**
 * The laws of the four MathML families, in the order apply, cn, align, share.
 */
export const mathmlLaws = [...applyLaws, ...cnLaws, ...alignLaws, ...shareLaws];
