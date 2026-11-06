/**
 * The MathML checks that read a whole tree, run as one: alignment groups, actions, `cn` content
 * and `share` targets (spec MA18, in the order of spec 4.8a's table).
 *
 * @module
 */
import { Effect } from "effect";
import { actionFinding } from "#pantry/import/guards/mathml-action.ts";
import { alignFinding } from "#pantry/import/guards/mathml-align.ts";
import { cnFinding } from "#pantry/import/guards/mathml-cn.ts";
import { shareFinding } from "#pantry/import/guards/mathml-share.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import type { Rows } from "#pantry/import/tree.ts";

/**
 * Refuse the first finding of the alignment, action, `cn` and `share` checks, in that order.
 *
 * Each check reads the rows and answers its own first finding, so an earlier check's finding wins
 * over a later check's whatever their places in the document. No row is written.
 *
 * @param rows - The rows an import built for one package.
 * @returns Nothing when every check passes; fails with the first finding.
 */
export const mathmlTreeGuards = Effect.fn("mathmlTreeGuards")(function* mathmlTreeGuards(
  rows: Rows,
): Effect.fn.Return<void, ImportRefused> {
  const found = [alignFinding, actionFinding, cnFinding, shareFinding]
    .map((check) => check(rows))
    .find((finding) => finding !== undefined);
  if (found !== undefined) {
    yield* found;
  }
});
