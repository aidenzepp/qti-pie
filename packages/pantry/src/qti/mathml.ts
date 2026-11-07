/**
 * The MathML laws (spec reading 2, MathML 3 validity) of phase 6 revision N, composed from the four
 * families each slice of the phase fills: apply (arity and head qualifiers), cn (the form of a
 * number's content), align (action selection and alignment groups) and share (the `share` cycle).
 *
 * {@link mathmlRelations} and {@link mathmlLaws} are `#pantry/qti/schema.ts`'s MathML members: the
 * four families' relations and laws, spread in that order; {@link mathmlLawsByName} names each law.
 */
import { alignLaws, alignRelations } from "#pantry/qti/mathml-align.ts";
import { applyLaws, applyRelations, headQualifierLaw } from "#pantry/qti/mathml-apply.ts";
import { cnCountLaws, cnLaws, cnRelations } from "#pantry/qti/mathml-cn.ts";
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

/**
 * The checks of {@link mathmlLaws} that one name names.
 *
 * @param name - The check's name.
 * @returns Those checks.
 */
const checksNamed = (name: string) =>
  mathmlLaws.filter((statement) => statement.kind === "check" && statement.name === name);

/**
 * Whether a statement is one {@link mathmlLawsByName} names apart from the restatements: the head
 * qualifier containment or a cn part count containment.
 *
 * @param statement - A statement of {@link mathmlLaws}.
 * @returns Whether it is.
 */
const namedApart = (statement: (typeof mathmlLaws)[number]): boolean =>
  statement === headQualifierLaw || Object.values(cnCountLaws).some((count) => count === statement);

/**
 * {@link mathmlLaws} by the law each states, the law's name its key, as every other module names
 * its laws where it states them (`namedLaws`, `#pantry/import/refusal.ts`), each check in the
 * group of its own name:
 *
 * - **MathML head qualifier:** the apply family's head qualifier containment, a pair MathML 3's §4.4
 *   syntax tables list (`mathml-apply.ts`, reading R6-head-qualifiers);
 * - **MathML cn form:** a `cn`'s four part count containments, over the judged `cn`s and over every
 *   typed `cn` ({@link cnCountLaws}): a wrong part count is a `cn` of the wrong form;
 * - **E1 derived:** every other statement of the four families, a restatement of the tree, the
 *   align family's keys of one `selection` per `m:maction` and one `dir` per element among them
 *   (decision 426: uniqueness of derived rows, not a document's identity).
 */
export const mathmlLawsByName = {
  "E1 derived": mathmlLaws.filter((statement) =>
    statement.kind === "check" ? statement.name === "E1_derived" : !namedApart(statement),
  ),
  "MathML align first": checksNamed("MathML_align_first"),
  "MathML align placement": checksNamed("MathML_align_placement"),
  "MathML arity": checksNamed("MathML_arity"),
  "MathML cn form": [...Object.values(cnCountLaws), ...checksNamed("MathML_cn_form")],
  "MathML head qualifier": [headQualifierLaw],
  "MathML maction selection": checksNamed("MathML_maction_selection"),
  "MathML share cycle": checksNamed("MathML_share_cycle"),
};
