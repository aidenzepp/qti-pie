/**
 * The High Contrast presenter (A-17, issue m5-12): the catalog module hands it each card of the
 * support `high-contrast` the host enabled, and it presents the card's content, an alternative
 * image or text in a high-contrast form, then one link for each file the card names. That is the
 * listing every other card gets, so a landed presenter changes no byte of the page; the support
 * owns the presentation from here, and a presentation beside the referencing element waits for the
 * catalog module to hand its presenters that element.
 *
 * @module
 */
import { Result } from "effect";
import type { CatalogCard, CatalogFile } from "#plate/content/catalog-info.ts";
import type { CatalogPresenter } from "#plate/content/contract.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { classifyUrl, formatUrl } from "#plate/model/url.ts";
import type { EmitState } from "#plate/payload.ts";

/**
 * The support the presenter presents.
 */
const support = "high-contrast";

/**
 * Write one file of a card as a link: its text the href as written, its `href` the path resolved
 * against the asset base as the emitter resolves a body link's, and its `type` the `mime-type`. A
 * URL `url.ts` drops, one that leaves the package or cannot be parsed, is written with no `href`,
 * so the text alone names the file.
 *
 * @param file The file.
 * @param state The emit state, which gives the asset base.
 * @returns The link.
 */
const fileLink = (file: CatalogFile, state: EmitState): Element => {
  const url = classifyUrl("link", file.href);
  const href: Attributes = url.kind === "dropped" ? {} : { href: formatUrl(url, state.assetBase) };

  return h("a", { ...href, type: file.mimeType }, [text(file.href)]);
};

/**
 * The High Contrast presenter (A-17, issue m5-12).
 */
export const highContrastPresenter: CatalogPresenter<typeof support, CatalogCard> = {
  /**
   * True: the presenter presents the support's cards.
   */
  implemented: true,
  /**
   * Present a high-contrast card: its content emitted as the body is, then a link for each of its
   * files.
   *
   * @param card The active card of the support.
   * @param state The emit state, which gives the asset base the links resolve against.
   * @param kit The render kit, whose `nodes` emits the card's content.
   * @returns The nodes the card's list item holds, or the refusal of a part swap.
   */
  present: (card, state, kit) =>
    Result.map(kit.nodes(card.content), (content): readonly Node[] => [
      ...content,
      ...card.files.map((file) => fileLink(file, state)),
    ]),
  support,
};
