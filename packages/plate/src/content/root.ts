/**
 * The item Root's attribute hook (A-30a magnification, A-42a text and background colours): the
 * item chrome asks it for the attributes the supports add to the Root, and it answers with one,
 * the Root's inline `style`, so the item is magnified and recoloured from the first paint with no
 * script and no change to the sheet. With no such preference it answers with none, and the Root is
 * exactly what the chrome writes (issue m3e-09).
 *
 * The `style` holds up to three declarations in a fixed order, separated by `; `: `font-size` from
 * `supports.display.magnification`, then `color` and `background-color` from
 * `supports.display.textAppearance`. It is an inline style rather than a custom property the sheet
 * reads because `styles.test.ts` forbids a custom-property declaration in the sheet and a `var()`
 * outside the sheet's tokens, so the sheet's `supports` block stays empty.
 *
 * Magnification is the proposed reading of A-30a (the operator rules on it in issue m3e-09's pull
 * request): the factor scales the Root's `font-size`, so the item's text and every length the
 * sheet writes in `em`, `ch` or `lh` follow it, and an image keeps its authored size. A length in
 * `rem` follows the page's root font size, not the Root's, so it does not scale. CSS `zoom` and
 * `transform: scale` are not used: the first is under plate's Baseline floor, and the second
 * breaks reflow (WCAG 1.4.10).
 *
 * A host's `Supports` value reaches the HTML only through this checked path: a factor is written
 * only when it is a finite number above 0 whose percentage is finite and not 0 after rounding to
 * three decimals, and a colour only when it is `#` followed by exactly 3, 4, 6 or 8 hexadecimal
 * digits, in either case; any other value is not written.
 *
 * A host whose Content Security Policy forbids inline styles (a `style-src` without
 * `'unsafe-inline'` or `'unsafe-hashes'`) drops the `style` attribute, and so the preference. Such
 * a host applies `supports.display` through its own sheet, keyed on the Root's `data-slot="item"`
 * marker.
 *
 * @module
 */
import { Option } from "effect";
import type { RootHook } from "#plate/content/contract.ts";
import { noSupports } from "#plate/supports.ts";
import type { DisplayPreferences } from "#plate/supports.ts";

/**
 * A hexadecimal colour as CSS writes it, which A-42a's colours must be to be written: `#` and
 * exactly 3, 4, 6 or 8 hexadecimal digits of ASCII, in either case, and nothing else. Without the
 * `m` flag, `$` matches only the end of the text, so a trailing line feed is refused.
 */
const hexColour = /^#(?:[0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/u;

/**
 * The percentage's writer: English digits, a full stop, at most three decimals, no grouping and
 * never an exponent, whatever the size of the number.
 */
const percentage = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3, useGrouping: false });

/**
 * Write the `font-size` declaration that magnifies the Root by a factor (A-30a): the factor as a
 * percentage, so a factor of 2 is `200%`.
 *
 * @param factor The magnification factor the supports give.
 * @returns The declaration, none when the factor is not a finite number above 0, or when its
 *   percentage overflows or rounds to 0, since a text of no size is not a magnification.
 */
const magnification = (factor: number): Option.Option<string> =>
  Option.some(factor * 100).pipe(
    Option.filter((percent) => percent > 0 && Number.isFinite(percent)),
    Option.map((percent) => percentage.format(percent)),
    Option.filter((written) => written !== "0"),
    Option.map((written) => `font-size: ${written}%`),
  );

/**
 * Write a colour declaration of the Root (A-42a).
 *
 * @param property The CSS property that takes the colour.
 * @param colour The colour the supports give, none for the default.
 * @returns The declaration, none when there is no colour or it is not a hexadecimal colour.
 */
const colouring = (
  property: "background-color" | "color",
  colour: Option.Option<string>,
): Option.Option<string> =>
  colour.pipe(
    Option.filter((value) => hexColour.test(value)),
    Option.map((value) => `${property}: ${value}`),
  );

/**
 * Write the Root's declarations for a candidate's display preferences, in the order of the `style`
 * attribute: `font-size`, `color`, `background-color`.
 *
 * @param display The display preferences of the supports.
 * @returns The declarations that apply, none when no preference applies.
 */
const declarations = (display: DisplayPreferences): readonly string[] => [
  ...Option.toArray(display.magnification.pipe(Option.flatMap(magnification))),
  ...Option.toArray(
    display.textAppearance.pipe(Option.flatMap(({ fontColor }) => colouring("color", fontColor))),
  ),
  ...Option.toArray(
    display.textAppearance.pipe(
      Option.flatMap(({ backgroundColor }) => colouring("background-color", backgroundColor)),
    ),
  ),
];

/**
 * The Root hook: magnification (A-30a) and the text and background colours (A-42a) as the item
 * Root's inline style (issue m3e-09).
 *
 * It reads `state.supports.display` alone, an absent `supports` reading as none, and writes
 * nothing else: no other attribute, no class, and no `style` on any element but the Root. Images
 * are not magnified (the factor scales the Root's `font-size`, the proposed reading), a colour is
 * written only when it is a hex colour, and a host whose Content Security Policy forbids inline
 * styles applies the preferences through its own sheet, keyed on the Root's `data-slot="item"`
 * marker.
 */
export const rootHook: RootHook = {
  /**
   * The Root's `style` for the supports' magnification factor and text and background colours
   * (A-30a, A-42a), none when no preference applies. The chrome writes its own attributes after
   * these, so `style` is the only attribute this hook gives and the chrome's are never replaced.
   */
  attributes: (state) => {
    const style = declarations((state.supports ?? noSupports).display);

    return style.length === 0 ? {} : { style: style.join("; ") };
  },
  /**
   * True: the hook gives the Root's `style` for A-30a and A-42a.
   */
  implemented: true,
};
