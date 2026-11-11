/**
 * The item Root's attribute hook: the item chrome asks it for the attributes the supports add to
 * the Root, and it answers with data attributes only, never a `style`, a class or a custom
 * property. With no such preference it answers with none, and the Root is exactly what the chrome
 * writes.
 *
 * The attributes follow D25 (the operator's ruling, issue m3e-09b, #349): plate's own pages serve
 * `style-src 'self'`, as does any hardened host, and that policy drops an inline `style` attribute,
 * and its sheet states no custom property, so a preference reaches the page as a data attribute on
 * a bounded step scale that plate's sheet applies, or, for a value no scale bounds (a colour, a
 * font name), as a data attribute for the host's own sheet by the host-sheet contract below.
 *
 * - **Magnification (A-30a, A-30b)**: `data-magnification="<step>"`, one of
 *   {@link magnificationSteps}. The writer is m3e-09b's, declared here as that issue (#349) has it
 *   so the Root hook is one body; the A-30b zoom amount is the factor `readPnp` gives, and the
 *   display markers below sit beside it.
 * - **Inverted polarity (A-20)**: `data-polarity="inverted"` when `invertDisplayPolarity` is on, and
 *   `data-polarity-foreground` and `data-polarity-background` for each colour of `invertedColors`
 *   that is a hex colour. The host applies a colour it passed; where a colour is not given plate's
 *   sheet swaps the item's card pair for that side.
 * - **Single column (A-26)**: `data-layout="single-column"`; plate's sheet resets the Root to one
 *   column. The vocabulary's own column classes are not named by the sheet yet, so the stacking of
 *   `qti-layout-col*` rows is a stated limit that waits for the layout styles of issue m3e-06.
 * - **Text appearance beyond the colours (A-42b)**: `data-font-size` ({@link fontSizeFactors} in
 *   `em`, {@link fontSizePoints} in `pt`), `data-line-height` ({@link lineHeights}),
 *   `data-letter-spacing` ({@link letterSpacings}, pixels), `data-word-spacing`
 *   ({@link wordSpacings}, pixels), `data-font-generic` ({@link genericFamilies}) and
 *   `data-color-theme` ({@link colorThemes} and `ext:` names), which plate's sheet applies, and
 *   `data-font-family`, the names quoted in order and then the generic family, which no scale
 *   bounds and so is the host's to apply.
 * - **Keyword emphasis (A-23)**: the bare `data-keyword-emphasis`, written exactly when
 *   `display.keywordEmphasis` is true (issue m5-11). It carries no value to check. It marks the
 *   Root for the rule of plate's sheet on text of the class `qti-keyword-emphasis`; without it the
 *   class renders plain, as emphasis meant for everyone is written with `strong` or `em`. The Root
 *   row of the part table does not list it, so a host's replacement of the Root may drop it.
 *
 * **The host-sheet contract.** plate applies no colour a host passed and no font family a host
 * named: its sheet cannot read an arbitrary attribute value. The host applies them through its own
 * stylesheet, with a rule on the Root's `data-slot="item"` marker or on the attributes, or in
 * script by setting `element.style` from the attributes, which `style-src` does not block. plate's
 * own rules sit in `:where()`, so a host rule wins without a higher specificity.
 *
 * **Stated limits.** The theme colours reach the Root and what inherits from it, so a control the
 * sheet colours from the shadcn tokens keeps the host's colours. `lineSpacing`, `uniformFontSizing`
 * and `wordWrapping` have no default fixed by the issue and are written by nothing.
 * `data-font-size` and `data-magnification` both set the Root's `font-size` in the sheet, and the
 * display block comes after the supports block, so a font size wins over a magnification.
 *
 * @module
 */
import { Array as Arr, Option } from "effect";
import type { RootHook } from "#plate/content/contract.ts";
import { when } from "#plate/emit/node.ts";
import type { Attributes } from "#plate/emit/node.ts";
import { noSupports } from "#plate/supports.ts";
import type {
  DisplayPreferences,
  FontSize,
  GenericFontFace,
  TextPreferences,
} from "#plate/supports.ts";

/**
 * The step scale of A-30a (D25, issue m3e-09b, #349): the eight percentages `data-magnification`
 * may hold, in ascending order, and so the only ones the `supports` block of `styles.css` styles,
 * one rule each. The Root hook takes the nearest step to a factor's percentage, a tie going to the
 * larger step and a factor above the last taking it, so no other value is ever written; the sheet's
 * witness imports this tuple to render a Root at every step.
 *
 * The scale bounds magnification alone. A-30b's zoom amount is the factor `readPnp` gives, written
 * through it.
 */
export const magnificationSteps = [125, 150, 175, 200, 250, 300, 350, 400] as const;

/**
 * One step of {@link magnificationSteps}.
 */
type MagnificationStep = (typeof magnificationSteps)[number];

/**
 * A hexadecimal colour as CSS writes it, which a colour of the display preferences must be to be
 * written: `#` and exactly 3, 4, 6 or 8 hexadecimal digits of ASCII, in either case, and nothing
 * else. Without the `m` flag, `$` matches only the end of the text, so a trailing line feed is
 * refused.
 */
const hexColour = /^#(?:[0-9A-Fa-f]{3,4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/u;

/**
 * Each step of {@link magnificationSteps} with the percentage from which it is the nearest step:
 * the midpoint between the step below it, or 100 for no magnification below the first, and itself.
 * A percentage at a midpoint is nearer neither, and takes the larger step.
 */
const thresholds = Arr.zip([100, ...magnificationSteps], magnificationSteps).map(
  ([below, step]) => ({ from: (below + step) / 2, step }),
);

/**
 * Take the step of {@link magnificationSteps} a magnification factor maps to (A-30a, D25).
 *
 * @param factor The magnification factor the supports give.
 * @returns The nearest step to the factor's percentage, a tie going to the larger step and a factor
 *   above the last step taking it; none when the factor is not a finite number, is 1 or less, or
 *   is nearer 100 than the first step.
 */
const stepOf = (factor: number): Option.Option<MagnificationStep> =>
  Option.some(factor).pipe(
    Option.filter((value) => Number.isFinite(value) && value > 1),
    Option.flatMap((value) =>
      Option.fromNullishOr(thresholds.findLast(({ from }) => value * 100 >= from)),
    ),
    Option.map(({ step }) => step),
  );

/**
 * Take a colour of the display preferences only when it is a hexadecimal colour.
 *
 * @param colour The colour the supports give, none for the default.
 * @returns The colour as given, none when there is no colour or it is not `#` and exactly 3, 4, 6
 *   or 8 hexadecimal digits.
 */
const hexOf = (colour: Option.Option<string>): Option.Option<string> =>
  colour.pipe(Option.filter((value) => hexColour.test(value)));

/**
 * Write one attribute of the Root, or none.
 *
 * @param name The attribute's name.
 * @param value The attribute's value, none to write nothing.
 * @returns The attribute as a record of one entry, or an empty record.
 */
const written = (name: string, value: Option.Option<string>): Attributes =>
  Option.match(value, {
    onNone: () => ({}),
    onSome: (text) => ({ [name]: text }),
  });

/**
 * The step scale of a font size given as a factor of the item's own (A-42b, issue m5-12), in
 * ascending order: the values `data-font-size` may hold with the unit `em`, and so the only ones
 * the display block of `styles.css` styles for a factor. The scale runs from three quarters of the
 * item's own size to three times it, WCAG 1.4.4's 200 % among the steps.
 */
export const fontSizeFactors = [0.75, 1, 1.25, 1.5, 2, 2.5, 3] as const;

/**
 * The step scale of a font size given in points (A-42b, issue m5-12), in ascending order: the
 * values `data-font-size` may hold with the unit `pt`, and the only ones the display block styles
 * for points.
 */
export const fontSizePoints = [10, 12, 14, 18, 24, 36] as const;

/**
 * The step scale of the line height as a unitless multiple (A-42b, issue m5-12), in ascending
 * order: the values `data-line-height` may hold, 1.5 among them, the line height WCAG 1.4.12 (Text
 * Spacing) asks content to withstand.
 */
export const lineHeights = [1, 1.15, 1.25, 1.5, 1.75, 2, 2.5, 3] as const;

/**
 * The step scale of the letter spacing in pixels (A-42b, issue m5-12), in ascending order: the
 * values `data-letter-spacing` may hold with the unit `px`.
 */
export const letterSpacings = [0.5, 1, 2, 3, 4, 6] as const;

/**
 * The step scale of the word spacing in pixels (A-42b, issue m5-12), in ascending order: the values
 * `data-word-spacing` may hold with the unit `px`. The PNP gives no unit for it, and pixels match
 * the letter spacing's.
 */
export const wordSpacings = [1, 2, 4, 8, 16] as const;

/**
 * The CSS generic family each `generic-font-face` of the PNP names (A-42b, issue m5-12), which is
 * what `data-font-generic` holds and the display block styles: `monospaced` is `monospace` and
 * `sans serif` is `sans-serif`.
 */
export const genericFamilies = {
  cursive: "cursive",
  fantasy: "fantasy",
  monospaced: "monospace",
  "sans serif": "sans-serif",
  serif: "serif",
} as const satisfies Readonly<Record<GenericFontFace, string>>;

/**
 * The colour themes of the PNP guide's `color-theme` that plate styles (A-42b, issue m5-12): the
 * values `data-color-theme` holds that the display block defines, `default` among them for the
 * item's own colours. The first word is the text colour family and the second the background's.
 * An `ext:` theme is written as given and styled by the host.
 */
export const colorThemes = [
  "black-cream",
  "black-cyan",
  "black-rose",
  "blue-yellow",
  "cream-black",
  "cyan-black",
  "darkgray-medgray",
  "default",
  "default-reverse",
  "high-contrast",
  "high-contrast-reverse",
  "medgray-darkgray",
  "rose-black",
  "yellow-blue",
] as const;

/**
 * An `ext:` theme: the prefix and at least one further character that is not white space.
 */
const extendedTheme = /^ext:\S+$/u;

/**
 * Whether a font name can be written between quotes: not empty or white space alone, and holding
 * no control character, which no font name has and which would break the attribute's one line.
 */
const nameable = /^(?!\s*$)[^\p{Cc}]+$/u;

/**
 * Take the nearest step of a scale to a value (A-42b, issue m5-12).
 *
 * @param steps The scale, in ascending order.
 * @param value The preference as the supports give it.
 * @returns The step nearest the value, a tie going to the larger step, a value below the first step
 *   taking it and a value above the last taking that; none when the value is not a finite number
 *   above zero.
 */
const nearestOf = (steps: readonly number[], value: number): Option.Option<number> =>
  Option.some(value).pipe(
    Option.filter((candidate) => Number.isFinite(candidate) && candidate > 0),
    Option.flatMap((candidate) =>
      Option.fromNullishOr(
        Arr.zip([Number.NEGATIVE_INFINITY, ...steps], steps)
          .map(([below, step]) => ({ from: (below + step) / 2, step }))
          .findLast(({ from }) => candidate >= from),
      ),
    ),
    Option.map(({ step }) => step),
  );

/**
 * Write a font size as the value `data-font-size` holds: the nearest step of the factor scale in
 * `em` or of the point scale in `pt`.
 *
 * @param size The font size the supports give.
 * @returns The step with its unit, none when the size is not a finite number above zero.
 */
const fontSizeOf = (size: FontSize): Option.Option<string> =>
  size.kind === "factor"
    ? nearestOf(fontSizeFactors, size.value).pipe(Option.map((step) => `${step}em`))
    : nearestOf(fontSizePoints, size.value).pipe(Option.map((step) => `${step}pt`));

/**
 * Write a scale's nearest step with a unit.
 *
 * @param steps The scale.
 * @param unit The unit that follows the step, empty for none.
 * @param value The preference as the supports give it, none for the default.
 * @returns The step with its unit, none when there is no value or it is not above zero.
 */
const stepped = (
  steps: readonly number[],
  unit: string,
  value: Option.Option<number>,
): Option.Option<string> =>
  value.pipe(
    Option.flatMap((number) => nearestOf(steps, number)),
    Option.map((step) => `${step}${unit}`),
  );

/**
 * Write one font name as a CSS string: between double quotes, with the backslash and the double
 * quote escaped.
 *
 * @param name The font name as the profile gave it.
 * @returns The quoted name.
 */
const quoted = (name: string): string =>
  `"${name.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;

/**
 * Write the font family as the value `data-font-family` holds: the usable names in order, quoted,
 * then the generic family.
 *
 * @param text The text preferences of the supports.
 * @returns The comma-separated list, none when no name is usable and no generic family is given.
 */
const familyOf = (text: TextPreferences): Option.Option<string> =>
  Option.some([
    ...text.fontNames.filter((name) => nameable.test(name)).map(quoted),
    ...text.genericFontFace.pipe(
      Option.map((face) => genericFamilies[face]),
      Option.toArray,
    ),
  ]).pipe(
    Option.filter((entries) => entries.length > 0),
    Option.map((entries) => entries.join(", ")),
  );

/**
 * Write the colour theme as the value `data-color-theme` holds.
 *
 * @param theme The theme as the profile gave it, none for no theme.
 * @returns The theme when it is one of {@link colorThemes} or an `ext:` name, none otherwise.
 */
const themeOf = (theme: Option.Option<string>): Option.Option<string> =>
  theme.pipe(
    Option.filter(
      (value) => extendedTheme.test(value) || colorThemes.some((candidate) => candidate === value),
    ),
  );

/**
 * Write the Root's attributes for the text appearance beyond the colours (A-42b).
 *
 * @param text The text preferences of the supports.
 * @returns The data attributes that apply, an empty record when none does.
 */
const textAttributes = (text: TextPreferences): Attributes => ({
  ...written("data-font-size", text.fontSize.pipe(Option.flatMap(fontSizeOf))),
  ...written("data-font-family", familyOf(text)),
  ...written(
    "data-font-generic",
    text.genericFontFace.pipe(Option.map((face) => genericFamilies[face])),
  ),
  ...written("data-line-height", stepped(lineHeights, "", text.lineHeight)),
  ...written("data-letter-spacing", stepped(letterSpacings, "px", text.letterSpacing)),
  ...written("data-word-spacing", stepped(wordSpacings, "px", text.wordSpacing)),
  ...written("data-color-theme", themeOf(text.colorTheme)),
});

/**
 * Write the Root's attributes for the inverted polarity (A-20): the marker when the preference is
 * on, and each colour that is a hex colour.
 *
 * @param display The display preferences of the supports.
 * @returns The data attributes that apply, an empty record when the polarity is not inverted.
 */
const polarityAttributes = (display: DisplayPreferences): Attributes =>
  display.invertDisplayPolarity
    ? {
        "data-polarity": "inverted",
        ...written(
          "data-polarity-foreground",
          display.invertedColors.pipe(Option.flatMap(({ foreground }) => hexOf(foreground))),
        ),
        ...written(
          "data-polarity-background",
          display.invertedColors.pipe(Option.flatMap(({ background }) => hexOf(background))),
        ),
      }
    : {};

/**
 * Write the Root's attributes for a candidate's display preferences: the magnification step, the
 * polarity, the single-column marker, the text appearance, then the keyword emphasis marker.
 *
 * @param display The display preferences of the supports.
 * @returns The data attributes that apply, an empty record when no preference applies.
 */
const attributesOf = (display: DisplayPreferences): Attributes => ({
  ...written(
    "data-magnification",
    display.magnification.pipe(Option.flatMap(stepOf), Option.map(String)),
  ),
  ...polarityAttributes(display),
  ...written(
    "data-layout",
    Option.some("single-column").pipe(Option.filter(() => display.layoutSingleColumn)),
  ),
  ...display.text.pipe(Option.match({ onNone: () => ({}), onSome: textAttributes })),
  ...when(display.keywordEmphasis, { "data-keyword-emphasis": true }),
});

/**
 * The Root hook: the display preferences (A-20, A-23, A-26, A-30a and A-30b, A-42b) as data
 * attributes on the item Root, as the module head states (D25, issues m3e-09b, m5-11 and m5-12).
 *
 * It reads `state.supports.display` alone, an absent `supports` reading as none, and writes only
 * the attributes the module head names: no `style` on any element, no class, and no attribute the
 * chrome writes. The Root row of the part table merges each of them but the keyword emphasis
 * marker, so a host's replacement of the Root cannot drop one of those and the sheet may key on it.
 */
export const rootHook: RootHook = {
  /**
   * The Root's data attributes for the supports' display preferences, none when no preference
   * applies. The chrome writes its own attributes after these, so the names here are the only ones
   * this hook gives and the chrome's are never replaced.
   */
  attributes: (state) => attributesOf((state.supports ?? noSupports).display),
  /**
   * True: the hook gives the Root's data attributes for the display preferences.
   */
  implemented: true,
};
