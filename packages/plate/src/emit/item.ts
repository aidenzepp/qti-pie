/**
 * The item chrome the library emits (spec §4.3's item rows, §4.4, §4.7's first list): the item Root
 * around the emitted body, and the Status part.
 *
 * The library emits parts, not a page: the Root holds the body and nothing else, and the Status
 * part decides no placement and no focus, so the form, its submit control, where the Status part
 * goes, where focus moves and the page's title are the host's composition (rule `a9d04969`). Each
 * part's attributes are computed here, once, and each part is built through `applyPart`, so an
 * embedder's replacement holds the swap invariant.
 *
 * @module
 */
import { Effect, Option } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf, RowContext } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { message } from "#plate/messages.ts";
import { identifyMessages } from "#plate/payload.ts";
import type { EmitState, Payload, ValidationMessage } from "#plate/payload.ts";

/**
 * Add a boolean attribute to a part's attributes when its condition holds.
 *
 * @param attrs The part's other attributes.
 * @param name The boolean attribute, such as `data-disabled`.
 * @param present Whether the part carries it.
 * @returns `attrs` with `name` present, or `attrs` unchanged.
 */
const withFlag = (attrs: Attributes, name: string, present: boolean): Attributes =>
  present ? { ...attrs, [name]: true } : attrs;

/**
 * Build one item part through its row and the embedder's replacement, if any, with its
 * `data-slot` marker beside the attributes it is given.
 *
 * @param state The emit state, which holds the resolved part overrides.
 * @param part The item part.
 * @param props The attributes the part carries, beside its marker.
 * @param children The nodes the part holds.
 * @param context Where the part is placed, such as the StatusHeading's level; none by default.
 * @returns The part's root element, refused when a replacement breaks the swap invariant.
 */
const itemPart = (
  state: EmitState,
  part: PartOf<"item">,
  props: Attributes,
  children: readonly Node[],
  context?: RowContext,
): Effect.Effect<Element, PartSwapRefused> => {
  const row = rowFor("item", part, context);

  return applyPart(
    row,
    { ...props, "data-slot": row.slot },
    children,
    Option.getOrUndefined(state.parts.replacementFor("item", part)),
  );
};

/**
 * Emit the item Root around an emitted body.
 *
 * The Root (`qti-assessment-item`) carries `lang`, its scoped `id`, `data-mode`, and
 * `data-disabled` when the author disabled every control. It holds the body's nodes by identity,
 * in order, and nothing else: no form, no submit control, no attempt state.
 *
 * @example
 *   emitItem(payload, state, body).pipe(Effect.map(toHtml));
 *   // a qti-assessment-item element, its id `<instance>-item`, holding the body's HTML
 *
 * @param payload The render's payload, which gives the language, the instance and the state.
 * @param state The emit state, which holds the part overrides.
 * @param body The emitted body, which the Root holds.
 * @returns The item Root, or the refusal of a replacement that breaks the swap invariant.
 */
export const emitItem = (
  payload: Payload,
  state: EmitState,
  body: readonly Node[],
): Effect.Effect<Element, PartSwapRefused> =>
  itemPart(
    state,
    "root",
    withFlag(
      {
        "data-mode": payload.mode,
        id: scopedId(payload.instance, "item"),
        lang: payload.lang,
      },
      "data-disabled",
      payload.finished,
    ),
    body,
  );

/**
 * What the author passes to the Status part (spec §4.1): the instance, the after-submit state its
 * heading names, and what the region shows under the heading.
 *
 * The region shows the score when `score` is set; else one Message per entry of `messages`, when
 * there are any; else, for `responseRecorded`, that state's text; else nothing under the heading.
 * `autofocus` is the author's focus choice: the region carries `autofocus` exactly when it is true.
 */
export interface StatusInput {
  readonly autofocus?: boolean;
  /**
   * The after-submit state, as `messages.ts` keys it.
   */
  readonly heading: "notAccepted" | "responseRecorded" | "scored";
  /**
   * The item instance key, which scopes the region's ids and its Messages' ids.
   */
  readonly instance: string;
  /**
   * The messages of a refused post, in the order validation gave them.
   */
  readonly messages?: readonly ValidationMessage[];
  /**
   * The score, already written as the candidate reads it.
   */
  readonly score?: string;
}

/**
 * Emit what the Status region shows under its heading: the score, the Messages, or the
 * `responseRecorded` text, by {@link StatusInput}'s precedence.
 *
 * @param input The author's Status input.
 * @param state The emit state, which gives the locale and the part overrides.
 * @returns The region's nodes after the heading, empty when the input gives nothing to show.
 */
const statusDetail = (
  input: StatusInput,
  state: EmitState,
): Effect.Effect<readonly Node[], PartSwapRefused> => {
  const { locale } = state;
  const messages = input.messages ?? [];
  if (input.score !== undefined) {
    return Effect.succeed([h("p", {}, [text(message(locale, "score", { score: input.score }))])]);
  }

  if (messages.length > 0) {
    return Effect.forEach(identifyMessages(input.instance, messages), (entry) =>
      itemPart(state, "message", { id: entry.id }, [text(entry.text)]),
    ).pipe(
      Effect.flatMap((items) => itemPart(state, "messages", {}, items)),
      Effect.map((list) => [list]),
    );
  }

  return Effect.succeed(
    input.heading === "responseRecorded"
      ? [h("p", {}, [text(message(locale, "responseRecorded"))])]
      : [],
  );
};

/**
 * Emit the Status part: the status region, its heading at the base level, then the score, the
 * Messages or the `responseRecorded` text.
 *
 * The region (`section`) carries its scoped `id`, `role="status"`, `aria-labelledby` naming its
 * heading, `tabindex="-1"`, and `autofocus` only when `input.autofocus` is true. Each Message `li`
 * carries the id {@link identifyMessages} gives its message, the id the payload writes into each
 * Control's `aria-describedby`, so the two agree. It places the region nowhere and moves no focus:
 * both are the author's composition (spec §4.7).
 *
 * @example
 *   emitStatus({ heading: "scored", instance: "i1", score: "1" }, state).pipe(Effect.map(toHtml));
 *   // a section, id `i1-status`, holding the heading "Scored" and "Score: 1"
 *
 * @param input The author's Status input.
 * @param state The emit state, which gives the locale, the base heading level and the part
 *   overrides.
 * @returns The Status region, or the refusal of a replacement that breaks the swap invariant.
 */
export const emitStatus = Effect.fnUntraced(function* emitStatus(
  input: StatusInput,
  state: EmitState,
): Effect.fn.Return<Element, PartSwapRefused> {
  const headingId = scopedId(input.instance, "status", "heading");
  const heading = yield* itemPart(
    state,
    "statusHeading",
    { id: headingId },
    [text(message(state.locale, input.heading))],
    { headingLevel: state.headingLevel },
  );
  const detail = yield* statusDetail(input, state);

  return yield* itemPart(
    state,
    "status",
    withFlag(
      {
        "aria-labelledby": headingId,
        id: scopedId(input.instance, "status"),
        role: "status",
        tabindex: "-1",
      },
      "autofocus",
      input.autofocus === true,
    ),
    [heading, ...detail],
  );
});
