/**
 * The item Root's attribute hook (A-30a magnification, A-42a text and background colours, A-23
 * keyword emphasis): the item chrome asks it for the attributes the supports add to the Root, and
 * it answers with up to four data attributes, `data-magnification`, `data-font-color`,
 * `data-background-color` and `data-keyword-emphasis`, and never a `style`. With no such preference
 * it answers with none, and the Root is exactly what the chrome writes (issue m3e-09, moved to data
 * attributes by issue m3e-09b, #349, which closes #222; `data-keyword-emphasis` is issue m5-11's).
 *
 * The Root carries no `style` because plate's own pages serve `style-src 'self'`, as does any
 * hardened host, and that policy drops an inline `style` attribute, and the preference with it.
 * D25, the operator's ruling, moves each preference to a surface the policy does not drop:
 *
 * - **Magnification (A-30a)** is `data-magnification="<step>"`, the step one of
 *   {@link magnificationSteps} and nothing else. The factor in `supports.display.magnification`
 *   maps to a step so: a factor that is not a finite number, or is 1 or less, writes no attribute;
 *   otherwise its percentage (`factor * 100`) takes the nearest of the eight steps, a tie going to
 *   the larger step, so `112.5` and above is `125`, below it nothing (no magnification is nearer),
 *   and anything above `400` is `400`, the PNP guide's ceiling (WCAG 1.4.4 asks 200 %). plate's
 *   sheet applies the step in the `supports` block of `styles.css`, one rule per step, each setting
 *   the Root's `font-size` to the step's percentage, so the item's text and every length the sheet
 *   states in `em`, `ch` or `lh` scale from the first paint with no script. A length in `rem`
 *   follows the page's root font size, not the Root's, so it does not scale. This is issue m3e-09's
 *   proposed reading and it stands: an image keeps its authored size, and CSS `zoom` and
 *   `transform: scale` are not used (the first is under plate's Baseline floor, the second breaks
 *   reflow, WCAG 1.4.10).
 * - **Text and background colours (A-42a)** are `data-font-color="<hex>"` and
 *   `data-background-color="<hex>"` for `supports.display.textAppearance`'s `fontColor` and
 *   `backgroundColor`, each written only when it is `#` followed by exactly 3, 4, 6 or 8
 *   hexadecimal digits, in either case, and as the host gave it; any other value is not written. A
 *   host's `Supports` value reaches the HTML only through this checked path.
 * - **Keyword emphasis (A-23)** is the bare attribute `data-keyword-emphasis`, written exactly when
 *   `supports.display.keywordEmphasis` is true (issue m5-11). It carries no value to check. It
 *   marks the Root for a rule on text of the class `qti-keyword-emphasis`; plate's own sheet gives
 *   that rule no declaration yet, its `keyword-emphasis` block being empty until the class joins
 *   the styled-class inventory, so a host that wants the emphasis styles
 *   `[data-slot="item"][data-keyword-emphasis] .qti-keyword-emphasis` itself. Without the attribute
 *   the class renders plain, as emphasis meant for everyone is written with `strong` or `em`.
 *
 * **The host-sheet contract.** plate applies neither colour: its sheet cannot read an arbitrary
 * attribute value, and its tests refuse a custom property. The host that passed the supports
 * applies the colours itself, either through its own stylesheet, with a rule on the Root's
 * `data-slot="item"` marker or on the two attributes, written with the colours it passed (for
 * example `[data-slot="item"][data-font-color="#1a1a1a"] { color: #1a1a1a; }`), or in script, by
 * setting the Root's `element.style.color` and `element.style.backgroundColor` from the two
 * attributes, which `style-src` does not block. plate's own rules sit in `:where()`, so a host rule
 * wins without a higher specificity.
 *
 * **Stated limit: the runtime enhancement is deferred.** D25 lets the browser runtime apply the
 * colours through the CSSOM. The runtime's registry (`runtimeKinds` in `runtime/contract.dom.ts`)
 * is closed over interaction kinds and never upgrades the item Root, and a registry entry is a
 * shared contract this issue may not change. So the hook only carries the colours on the Root, and
 * until a later gate unit adds a Root controller keyed by `data-slot="item"` that reads the two
 * attributes and sets the Root's `style.color` and `style.backgroundColor`, a host that wants the
 * colours applies them as the contract above says.
 *
 * @module
 */
import { Array as Arr, Option } from "effect";
import type { RootHook } from "#plate/content/contract.ts";
import { when } from "#plate/emit/node.ts";
import type { Attributes } from "#plate/emit/node.ts";
import { noSupports } from "#plate/supports.ts";
import type { DisplayPreferences } from "#plate/supports.ts";

/**
 * The step scale of A-30a (D25, issue m3e-09b, #349): the eight percentages `data-magnification`
 * may hold, in ascending order, and so the only ones the `supports` block of `styles.css` styles,
 * one rule each. The Root hook takes the nearest step to a factor's percentage, a tie going to the
 * larger step and a factor above the last taking it, so no other value is ever written; the sheet's
 * witness imports this tuple to render a Root at every step.
 *
 * The scale bounds magnification alone. The A-42a colours are not on it: they are hex colours only,
 * on the Root as `data-font-color` and `data-background-color`, and the host applies them through
 * its own sheet by the host-sheet contract of {@link rootHook}; the runtime's CSSOM enhancement of
 * them is a stated limit, deferred to a later gate unit.
 */
export const magnificationSteps = [125, 150, 175, 200, 250, 300, 350, 400] as const;

/**
 * One step of {@link magnificationSteps}.
 */
type MagnificationStep = (typeof magnificationSteps)[number];

/**
 * A hexadecimal colour as CSS writes it, which A-42a's colours must be to be written: `#` and
 * exactly 3, 4, 6 or 8 hexadecimal digits of ASCII, in either case, and nothing else. Without the
 * `m` flag, `$` matches only the end of the text, so a trailing line feed is refused.
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
 * Take a colour of A-42a only when it is a hexadecimal colour.
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
 * Write the Root's attributes for a candidate's display preferences: the magnification step, the
 * font colour, the background colour and the keyword emphasis, in that order.
 *
 * @param display The display preferences of the supports.
 * @returns The data attributes that apply, an empty record when no preference applies.
 */
const attributesOf = (display: DisplayPreferences): Attributes => ({
  ...written(
    "data-magnification",
    display.magnification.pipe(Option.flatMap(stepOf), Option.map(String)),
  ),
  ...written(
    "data-font-color",
    display.textAppearance.pipe(Option.flatMap(({ fontColor }) => hexOf(fontColor))),
  ),
  ...written(
    "data-background-color",
    display.textAppearance.pipe(Option.flatMap(({ backgroundColor }) => hexOf(backgroundColor))),
  ),
  ...when(display.keywordEmphasis, { "data-keyword-emphasis": true }),
});

/**
 * The Root hook: magnification (A-30a) as `data-magnification` on a bounded step scale
 * ({@link magnificationSteps}) that plate's sheet applies, and the text and background colours
 * (A-42a) as `data-font-color` and `data-background-color` for the host's own sheet by contract
 * (D25, issue m3e-09b, #349), and keyword emphasis (A-23) as the bare `data-keyword-emphasis` that
 * marks the Root for a rule on `qti-keyword-emphasis` text (issue m5-11).
 *
 * It reads `state.supports.display` alone, an absent `supports` reading as none, and writes at most
 * those four attributes: no `style` on any element, no class, and no attribute the chrome writes.
 * The step is the nearest of the eight to the factor's percentage (a tie to the larger, none at or
 * below 1 or when not finite, `400` above 400), and a colour is written only when it is a hex
 * colour (`#` and exactly 3, 4, 6 or 8 hexadecimal digits). plate applies the step in its sheet and
 * applies no colour: the host that passed the supports applies the colours through its own
 * stylesheet or by setting `element.style` from the two attributes in script.
 *
 * Stated limit: the browser runtime's CSSOM enhancement of the colours is deferred to a later gate
 * unit, a Root controller keyed by `data-slot="item"` that reads the two attributes, because the
 * runtime's registry is closed over interaction kinds and never upgrades the Root.
 */
export const rootHook: RootHook = {
  /**
   * The Root's data attributes for the supports' magnification factor, text and background
   * colours and keyword emphasis (A-30a, A-42a, A-23), none when no preference applies. The chrome
   * writes its own attributes after these, so the four names here are the only ones this hook gives
   * and the chrome's are never replaced.
   */
  attributes: (state) => attributesOf((state.supports ?? noSupports).display),
  /**
   * True: the hook gives the Root's data attributes for A-30a, A-42a and A-23.
   */
  implemented: true,
};
