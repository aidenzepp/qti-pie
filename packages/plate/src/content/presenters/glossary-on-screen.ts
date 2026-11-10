/**
 * The Glossary on Screen presenter (A-15, issue m3e-08): the catalog module hands it each card of
 * the support `glossary-on-screen` the host enabled, with the body element that references the
 * card's catalog, and it gives the definition as a native disclosure after that element's block
 * and marks the element as the disclosure's subject.
 *
 * The disclosure is a `details` whose `summary` the reader activates to reveal the definition, by
 * keyboard (Enter or Space on the focused `summary`) or pointer, with no script and no hover-only
 * reveal (WCAG 2.1.1, 1.4.13): the browser gives the `summary` its role, its name and its
 * expanded state (4.1.2) and keeps the definition out of the page's flow until it is asked for.
 * The `details` follows the term's enclosing block, because a `details` is flow content and a `p`
 * that held one would close at it when the HTML is parsed, and the term points at it with
 * `aria-details`, so the disclosure follows the block it belongs to in focus order (2.4.3). Plate
 * moves no focus: opening the disclosure moves nothing else (3.2.1), and the presenter writes no
 * `open`, so every definition stays dormant until a request.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { CatalogCard, CatalogFile } from "#plate/content/catalog-info.ts";
import type { CatalogPresentation, CatalogPresenter } from "#plate/content/contract.ts";
import type { ReferencingElement } from "#plate/emit/body.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
import { classifyUrl, formatUrl } from "#plate/model/url.ts";
import type { EmitState } from "#plate/payload.ts";

/**
 * The support the presenter presents.
 */
const support = "glossary-on-screen";

/**
 * The text of every glossary `summary`, in English as the other strings a module writes are. The
 * `summary`'s accessible name adds the term to it through `aria-labelledby`, so two disclosures of
 * one block are told apart by name.
 */
const summaryText = "Definition";

/**
 * The ids of the disclosure written for a referencing element: the `details` the element points at
 * and the `summary` that names it. Each is the element's id and a suffix after a colon, which an
 * authored id (an XML `ID`, an NCName) and every id plate writes (`<instance>-…`) lack, so no id of
 * the page can equal one of them, and two elements' disclosures never share an id because their
 * element ids differ.
 *
 * @param reference The referencing element.
 * @returns The ids of its `details` and its `summary`.
 */
const idsOf = (reference: ReferencingElement) => ({
  details: `${reference.id}:definition`,
  summary: `${reference.id}:definition-summary`,
});

/**
 * Write one `qti-file-href` of a card as a link: its text the href as written, its `href` the path
 * resolved against the asset base as the emitter resolves a body `a`'s, and its `type` the
 * `mime-type`. A value `url.ts` drops (one that leaves the package, or an unparsable one) is
 * written with no `href`, so the text alone names the file.
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
 * Write the `summary` of a disclosure: the fixed text, and for a disclosure of a referencing
 * element an id and an `aria-labelledby` naming the `summary` itself and the element, so the
 * control is named by its label and the term it defines.
 *
 * @param reference The referencing element the disclosure is written for, none when the presenter
 *   was handed none.
 * @returns The `summary`.
 */
const summaryOf = (reference: ReferencingElement | undefined): Element => {
  if (reference === undefined) {
    return h("summary", {}, [text(summaryText)]);
  }

  const { summary } = idsOf(reference);

  return h("summary", { "aria-labelledby": `${summary} ${reference.id}`, id: summary }, [
    text(summaryText),
  ]);
};

/**
 * The Glossary on Screen presenter (A-15, issue m3e-08): a native `details` after the enclosing
 * block of each element that references a glossary catalog, its `summary` the control that opens
 * it, and the element marked with `aria-details` naming it. Plate moves no focus.
 */
export const glossaryOnScreenPresenter: CatalogPresenter<typeof support, CatalogCard> = {
  /**
   * True: the presenter renders the support.
   */
  implemented: true,
  /**
   * Present one glossary card for the element that references its catalog (A-15, issue m3e-08):
   * the card's content through the kit, then one link per file href, inside a closed `details`
   * after the element's block, and `aria-details` for the element. A presenter handed no element
   * writes the `details` with no ids and marks nothing. Plate moves no focus.
   *
   * @param card The active card of the support.
   * @param state The emit state, which gives the asset base the file links resolve against.
   * @param kit The render kit, whose `nodes` emits the card's content.
   * @param reference The element the card is presented for, whose id the disclosure derives its own
   *   ids from.
   * @returns The disclosure with the attributes and place that mark the element, or the refusal of
   *   a part swap.
   */
  present: (card, state, kit, reference) =>
    Result.map(kit.nodes(card.content), (content): CatalogPresentation => {
      const details = h(
        "details",
        {
          ...Option.match(Option.fromNullishOr(reference), {
            onNone: () => ({}),
            onSome: (given) => ({ id: idsOf(given).details }),
          }),
          "data-support": card.support,
          ...Option.match(card.lang, { onNone: () => ({}), onSome: (lang) => ({ lang }) }),
        },
        [summaryOf(reference), ...content, ...card.files.map((file) => fileLink(file, state))],
      );

      return reference === undefined
        ? { nodes: [details] }
        : {
            attributes: { "aria-details": idsOf(reference).details },
            nodes: [details],
            place: "after-block",
          };
    }),
  support,
};
