/**
 * What Gap Match's (Q-6) runtime controller reads from the markup the core renders and shows back
 * in it: the gap texts and the gaps, their names and limits, the pairs the hidden inputs hold, and
 * the placed text a gap shows (issue m3d-04).
 *
 * The controller builds no interaction structure of its own. A placement is shown as the SSR writes
 * a restored one, the core's `gap-match-interaction-gap-choice` part inside its gap, and
 * {@link GapMatchView.restore} puts the gaps' content and attributes back as the SSR wrote them.
 *
 * @module
 */
import { announcements } from "#plate/runtime/select-place.dom.ts";
import type { Placement } from "#plate/runtime/select-place.dom.ts";

/**
 * A gap text placed in a gap, as the select-then-place driver reports it.
 */
export type GapPlacement = Placement<HTMLElement, HTMLElement>;

/**
 * The `data-slot` marker of a gap text in the word bank.
 */
const choiceSlot = "gap-match-interaction-choice";

/**
 * The `data-slot` marker of a gap in the author's sentence.
 */
const gapSlot = "gap-match-interaction-gap";

/**
 * The `data-slot` marker of the list that holds the gap texts.
 */
const choicesSlot = "gap-match-interaction-choices";

/**
 * The `data-slot` marker of the placed text a gap shows.
 */
const gapChoiceSlot = "gap-match-interaction-gap-choice";

/**
 * What Gap Match's controller reads and shows over one rendered interaction.
 */
export interface GapMatchView {
  /**
   * The gaps of the sentence, in document order, each with an identifier.
   */
  readonly gaps: readonly HTMLElement[];

  /**
   * The gap texts of the word bank, in presented order, each with an identifier.
   */
  readonly tokens: readonly HTMLElement[];

  /**
   * Tell whether a gap text's `match-group` lets it fill a gap.
   *
   * @param token A gap text.
   * @param gap A gap.
   * @returns True when the gap text names no group, or names this gap.
   */
  readonly admits: (token: HTMLElement, gap: HTMLElement) => boolean;

  /**
   * Tell whether a gap text may still be picked up: it fills fewer gaps than its `match-max`, where
   * 0 is no limit.
   *
   * @param token A gap text.
   * @param placements The placements so far.
   * @returns False once the gap text fills as many gaps as it may.
   */
  readonly available: (token: HTMLElement, placements: readonly GapPlacement[]) => boolean;

  /**
   * Find the gap text the select-then-place driver holds: the one marked `aria-pressed="true"`.
   *
   * @returns The held gap text, or `undefined` when none is held.
   */
  readonly held: () => HTMLElement | undefined;

  /**
   * Read the name a gap text or a gap is announced by.
   *
   * @param element A gap text or a gap.
   * @returns Its name: for a gap text, its text; for a gap, "Gap n" by its place in the sentence.
   */
  readonly labelOf: (element: HTMLElement) => string;

  /**
   * Write a placement as the pair a hidden input holds.
   *
   * @param placement The placement.
   * @returns The gap text's identifier, a space, and the gap's identifier.
   */
  readonly pairOf: (placement: GapPlacement) => string;

  /**
   * Find the placement a gap shows, for the key or click that returns it.
   *
   * @param placements The placements so far.
   * @param element The element the key was pressed on or the click landed on.
   * @returns The placement of the gap the element is or sits in, or `undefined` for none.
   */
  readonly placementOf: (
    placements: readonly GapPlacement[],
    element: Element,
  ) => GapPlacement | undefined;

  /**
   * Give the reason a gap text is refused, in place of the protocol's "is full".
   *
   * The protocol announces a refusal as the gap being full. A gap that holds nothing and is out of
   * the held gap text's `match-group` is not full, so the controller says what is true.
   *
   * @param text What the protocol is about to announce.
   * @param placements The placements so far.
   * @returns The sentence to announce instead, or `undefined` to announce the text as it is.
   */
  readonly refusal: (text: string, placements: readonly GapPlacement[]) => string | undefined;

  /**
   * Read the pairs of a response back into placements.
   *
   * @param pairs The pairs as the hidden inputs hold them, `<gap text> <gap>`.
   * @returns The placements of the pairs that name a gap text and a gap, the first pair for each
   *   gap only, in the order given.
   */
  readonly restored: (pairs: readonly string[]) => readonly GapPlacement[];

  /**
   * Give the interaction's markup back as the SSR wrote it: the placed text each gap showed, the
   * role and name the view gave the gaps, and the role it took from the word bank's list.
   */
  readonly restore: () => void;

  /**
   * Show the placements in the gaps: each placed gap text as a `gap-match-interaction-gap-choice`
   * inside its gap, and no such part in a gap that holds none. A gap already showing the placed gap
   * text keeps the part as it is, so the text the SSR wrote for a restored gap image, which the
   * markup alone cannot name, is never replaced by the view's fallback name.
   *
   * @param placements The placements.
   */
  readonly show: (placements: readonly GapPlacement[]) => void;
}

/**
 * Collapse runs of white space to one space and trim the ends.
 *
 * @param value The text.
 * @returns The collapsed text.
 */
const collapse = (value: string): string => value.replaceAll(/\s+/gu, " ").trim();

/**
 * Read an element's identifier under a `data-*` name.
 *
 * @param element The element.
 * @param name The `dataset` key.
 * @returns The identifier, empty when it carries none.
 */
const identifierOf = (element: HTMLElement, name: "gap" | "identifier"): string =>
  element.dataset[name] ?? "";

/**
 * Read a gap text's `match-max` as the core writes it: the most gaps it fills, 0 for no limit.
 *
 * @param token A gap text.
 * @returns The limit, 0 when it is unwritten or not a count.
 */
const matchMaxOf = (token: HTMLElement): number => {
  const written = Math.trunc(Number(token.dataset["matchMax"] ?? ""));

  return Number.isNaN(written) || written < 0 ? 0 : written;
};

/**
 * Read the gaps a gap text may fill from its `match-group`.
 *
 * @param token A gap text.
 * @returns The gap identifiers, none when the gap text names no group and so fills any gap.
 */
const matchGroupOf = (token: HTMLElement): readonly string[] =>
  (token.dataset["matchGroup"] ?? "").split(/\s+/u).filter((identifier) => identifier !== "");

/**
 * Tell whether a gap text's `match-group` lets it fill a gap.
 *
 * @param token A gap text.
 * @param gap A gap.
 * @returns True when the gap text names no group, or names this gap.
 */
const admits = (token: HTMLElement, gap: HTMLElement): boolean => {
  const group = matchGroupOf(token);

  return group.length === 0 || group.includes(identifierOf(gap, "gap"));
};

/**
 * Read the text a gap text is named by when it holds no text: the `alt`, `aria-label` or `title`
 * of the first element inside it that has one, as a gap image's object does.
 *
 * @param token A gap text.
 * @returns The text, empty when nothing inside names it.
 */
const innerName = (token: HTMLElement): string => {
  for (const element of token.querySelectorAll("[alt], [aria-label], [title]")) {
    const named = collapse(
      element.getAttribute("alt") ??
        element.getAttribute("aria-label") ??
        element.getAttribute("title") ??
        "",
    );

    if (named !== "") {
      return named;
    }
  }

  return "";
};

/**
 * Give each element an attribute it lacks, leaving every element that already has one as the author
 * wrote it.
 *
 * @param elements The elements.
 * @param name The attribute's name.
 * @param valueFor Compute the value for an element from its place in `elements`.
 * @returns The elements the attribute was written on, so a teardown removes it from those alone.
 */
const claim = (
  elements: readonly HTMLElement[],
  name: string,
  valueFor: (index: number) => string,
): readonly HTMLElement[] => {
  const written: HTMLElement[] = [];

  for (const [index, element] of elements.entries()) {
    if (!element.hasAttribute(name)) {
      element.setAttribute(name, valueFor(index));
      written.push(element);
    }
  }

  return written;
};

/**
 * Tell whether an element's child nodes are exactly the given ones, in order.
 *
 * @param element The element.
 * @param children The nodes it should hold.
 * @returns True when it holds those nodes and no others.
 */
const holds = (element: HTMLElement, children: readonly ChildNode[]): boolean =>
  element.childNodes.length === children.length &&
  children.every((child, index) => element.childNodes[index] === child);

/**
 * Read the parts of a rendered Gap Match and give each gap a role and a name.
 *
 * A focusable gap needs a name a keyboard user hears on arrival (4.1.2), so a gap the author named
 * no other way becomes a `group` named "Gap n", n its place in the sentence. The select-then-place
 * driver gives each gap text, an `li`, `role="button"`, so the `ul` that holds them is no longer a
 * list of list items (axe's `list` rule, WCAG 1.3.1): the view gives that `ul` `role="none"` while
 * the upgrade holds. The SSR's markup stays recoverable: {@link GapMatchView.restore} removes what
 * this wrote and puts back each gap's own content, which {@link GapMatchView.show} may have
 * changed.
 *
 * @param root The interaction's root, `data-slot="gap-match-interaction"`.
 * @returns The view; its lists are empty for a root without the parts.
 */
export const viewOf = (root: HTMLElement): GapMatchView => {
  /**
   * Collect the parts of a marker that carry an identifier, in document order.
   *
   * @param slot The parts' `data-slot` marker.
   * @param name The `dataset` key of the identifier.
   * @returns The parts.
   */
  const withIdentifier = (slot: string, name: "gap" | "identifier"): readonly HTMLElement[] =>
    [...root.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)].filter(
      (element) => identifierOf(element, name) !== "",
    );
  const tokens = withIdentifier(choiceSlot, "identifier");
  const gaps = withIdentifier(gapSlot, "gap");
  const content = gaps.map((gap) => [gap, [...gap.childNodes]] as const);
  const named = claim(gaps, "aria-label", (index) => `Gap ${index + 1}`);
  const grouped = claim(gaps, "role", () => "group");
  const unlisted = claim(
    [...root.querySelectorAll<HTMLElement>(`[data-slot="${choicesSlot}"]`)],
    "role",
    () => "none",
  );

  /**
   * Read the name a gap text or a gap is announced by.
   *
   * @param element A gap text or a gap.
   * @returns Its `aria-label`, else its text, else what is inside it, else "Choice n of count".
   */
  const labelOf = (element: HTMLElement): string => {
    const labelled = collapse(element.getAttribute("aria-label") ?? "");
    const written = labelled === "" ? collapse(element.textContent) : labelled;

    if (written !== "") {
      return written;
    }

    const inside = innerName(element);

    return inside === "" ? `Choice ${tokens.indexOf(element) + 1} of ${tokens.length}` : inside;
  };

  /**
   * Find the gap text the driver marks held.
   *
   * @returns The gap text with `aria-pressed="true"`, or `undefined` when none.
   */
  const held = () => tokens.find((token) => token.getAttribute("aria-pressed") === "true");

  return {
    admits,
    available: (token, placements) => {
      const limit = matchMaxOf(token);

      return (
        limit === 0 || placements.filter((placement) => placement.token === token).length < limit
      );
    },
    gaps,
    held,
    labelOf,
    pairOf: ({ target, token }) =>
      `${identifierOf(token, "identifier")} ${identifierOf(target, "gap")}`,
    placementOf: (placements, element) => {
      const gap = gaps.find((candidate) => candidate.contains(element));

      return placements.find((placement) => placement.target === gap);
    },
    refusal: (text, placements) => {
      const token = held();
      const gap = gaps.find((candidate) => text === announcements.full(labelOf(candidate)));

      return token !== undefined &&
        gap !== undefined &&
        !admits(token, gap) &&
        !placements.some((placement) => placement.target === gap)
        ? `${labelOf(token)} cannot go in ${labelOf(gap)}.`
        : undefined;
    },
    restore: () => {
      for (const [gap, children] of content) {
        if (!holds(gap, children)) {
          gap.replaceChildren(...children);
        }
      }

      for (const gap of named) {
        gap.removeAttribute("aria-label");
      }

      for (const element of [...grouped, ...unlisted]) {
        element.removeAttribute("role");
      }
    },
    restored: (pairs) => {
      const placements: GapPlacement[] = [];

      for (const pair of pairs) {
        const [source, target, ...rest] = pair.split(/\s+/u).filter((part) => part !== "");
        const token = tokens.find((candidate) => identifierOf(candidate, "identifier") === source);
        const gap = gaps.find((candidate) => identifierOf(candidate, "gap") === target);

        if (
          token !== undefined &&
          gap !== undefined &&
          rest.length === 0 &&
          !placements.some((placement) => placement.target === gap)
        ) {
          placements.push({ target: gap, token });
        }
      }

      return placements;
    },
    show: (placements) => {
      for (const gap of gaps) {
        const placement = placements.find((candidate) => candidate.target === gap);
        const shown = [...gap.querySelectorAll<HTMLElement>(`[data-slot="${gapChoiceSlot}"]`)];
        const [first] = shown;

        if (placement === undefined) {
          for (const stale of shown) {
            stale.remove();
          }
        } else if (
          first === undefined ||
          shown.length > 1 ||
          first.dataset["identifier"] !== identifierOf(placement.token, "identifier")
        ) {
          const choice = document.createElement("span");

          choice.dataset["slot"] = gapChoiceSlot;
          choice.dataset["identifier"] = identifierOf(placement.token, "identifier");
          choice.textContent = labelOf(placement.token);

          for (const stale of shown) {
            stale.remove();
          }

          gap.append(choice);
        }
      }
    },
    tokens,
  };
};
