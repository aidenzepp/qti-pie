/**
 * The candidate's comment on an item, a stub module: an item whose session control sets
 * `allow-comment` lets the candidate leave a comment with a step, and three hubs consult this
 * module, as a module-level value, for what the comment does at each place it touches.
 *
 * - `render` asks {@link CommentModule.part} for the part that follows the item's body and its
 *   item-placed content and comes before the live region.
 * - `recordStep` (`#plate/session/start.ts`) asks {@link CommentModule.keep} which comment the
 *   session item holds after a step, through `SessionItem.comment`.
 * - The results writer (`#plate/results/results.ts`) asks {@link CommentModule.report} for the text
 *   of the item result's `candidateComment`. Results Reporting puts a candidate's comment in an
 *   item result after all of that result's variables, its response, template and outcome variables
 *   alike, so the text is the last child of the item result.
 *
 * The stub does nothing: it writes no part, keeps nothing and reports nothing, so no page, stored
 * session or results document changes while it stands. Issue m5-09 fills the module.
 *
 * A test reaches every hub by registering another module in place of this file, with
 * `vi.doMock("#plate/session/comment.ts", () => ({ commentModule }))`, and importing what it reads
 * of plate dynamically after the mock.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Element } from "#plate/emit/node.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { Locale } from "#plate/messages.ts";
import type { EmitState } from "#plate/payload.ts";

/**
 * What the comment part is written from: the item's setting, the payload's state, the item
 * instance and the comment the session holds.
 */
export interface CommentFacts {
  /**
   * Whether the item allows a comment: the `allow-comment` of its session control, which reaches
   * `render` as the configuration's `allowComment`.
   */
  readonly allowed: boolean;
  /**
   * The payload's `finished`: whether the author's item is over, so a control would be read-only.
   */
  readonly finished: boolean;
  /**
   * The item's instance token, from which the part's ids and its posted name derive.
   */
  readonly instance: string;
  /**
   * The comment the session item holds, none when it holds none.
   */
  readonly kept: Option.Option<string>;
  /**
   * The locale the renderer writes its own text in, which the part's label is written in.
   */
  readonly locale: Locale;
}

/**
 * The comment seam: the three answers the hubs ask for, and whether the module is filled.
 */
export interface CommentModule {
  /**
   * Whether the module is filled: false for the stub, which issue m5-09 replaces.
   */
  readonly implemented: boolean;
  /**
   * The comment the session item holds after a step.
   *
   * @param posted The comment the step carries, none when it carries none.
   * @param allowed Whether the item's session control allows a comment.
   * @param kept The comment the item held before the step.
   * @returns The comment the item holds now: the stub gives `kept`.
   */
  readonly keep: (
    posted: Option.Option<string>,
    allowed: boolean,
    kept: Option.Option<string>,
  ) => Option.Option<string>;
  /**
   * The part that follows the body: a label and its control, as one element.
   *
   * @param facts What the part is written from.
   * @param state The render's emit state, which gives the part rows their replacements.
   * @returns The part, or none when the item shows no comment control; refused when a
   *   replacement breaks the swap invariant. The stub gives none.
   */
  readonly part: (
    facts: CommentFacts,
    state: EmitState,
  ) => Result.Result<Option.Option<Element>, PartSwapRefused>;
  /**
   * The text of the item result's `candidateComment`.
   *
   * @param kept The comment the session item holds.
   * @returns The text to report, or none when the item result writes no `candidateComment`. The
   *   stub gives none.
   */
  readonly report: (kept: Option.Option<string>) => Option.Option<string>;
}

/**
 * The comment module, a stub: it writes no part, keeps what the item already held and reports
 * nothing, until issue m5-09 fills it.
 */
export const commentModule: CommentModule = {
  /**
   * False: the module is a stub until issue m5-09 lands it.
   */
  implemented: false,
  /**
   * Keep what the item held, whatever a step posts, until issue m5-09 decides what a step keeps.
   */
  keep: (_posted, _allowed, kept) => kept,
  /**
   * No part: the item shows no comment control until issue m5-09 writes one.
   */
  part: () => Result.succeed(Option.none()),
  /**
   * No text: the item result writes no `candidateComment` until issue m5-09 reports one.
   */
  report: () => Option.none(),
};
