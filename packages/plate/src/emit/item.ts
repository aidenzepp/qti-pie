/**
 * The item Root around the emitted body (spec §4.3's item rows, §4.4).
 *
 * The library emits parts, not a page: the Root holds the body and nothing else, so the form, its
 * submit control and the page's title are the host's composition (rule `a9d04969`). The Root's
 * attributes are computed here, once, from the payload, and the Root is built through `applyPart`,
 * so an embedder's replacement holds the swap invariant.
 *
 * @module
 */
import { Option } from "effect";
import type { Effect } from "effect";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import type { EmitState, Payload } from "#plate/payload.ts";

/**
 * Add a boolean attribute to a part's attributes when its condition holds.
 *
 * @param attrs The part's other attributes.
 * @param name The boolean attribute, such as `data-finished`.
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
 * @returns The part's root element, refused when a replacement breaks the swap invariant.
 */
const itemPart = (
  state: EmitState,
  part: PartOf<"item">,
  props: Attributes,
  children: readonly Node[],
): Effect.Effect<Element, PartSwapRefused> => {
  const row = rowFor("item", part);

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
 * `data-finished` when the author disabled every control. It holds the body's nodes by identity,
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
      "data-finished",
      payload.finished,
    ),
    body,
  );
