import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  noSupports,
  open,
  readPnp,
  redact,
  render,
} from "#plate/index.ts";
import type {
  DisplayPreferences,
  Element,
  FontSize,
  Node,
  Supports,
  TextPreferences,
} from "#plate/index.ts";
import { scanSheet } from "#plate/test/css.ts";
import type { Sheet, StyleRule } from "#plate/test/css.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The bytes of a fixture under `fixtures/m5/`.
 *
 * @param name The path under `fixtures/m5/`.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m5/${name}`, import.meta.url)));

/**
 * The text of the sheet plate ships, which the display block's rules are read from.
 */
const sheetText: string = readFileSync(new URL(import.meta.resolve("#plate/styles.css")), "utf-8");

/**
 * The comment that opens the display block of the sheet, the span issue m5-12 owns.
 */
const blockOpen = "/* begin display (issue m5-12) */";

/**
 * The comment that closes the display block.
 */
const blockClose = "/* end display */";

/**
 * Render the display fixture under the supports and give the HTML.
 *
 * @param supports The supports the host enabled.
 * @returns The HTML of the rendered item.
 */
const renderWith = (supports: Supports): Effect.Effect<string> =>
  Effect.gen(function* renderDisplayItem() {
    const verdict = yield* open("items/display.xml", fixture("items/display.xml"));
    const accepted = Option.getOrThrow(acceptedItem(verdict));
    const configuration = yield* configure({});
    const redacted = redact(accepted, undefined, configuration, { supports });
    const rendered = yield* Effect.fromResult(
      render(redacted, configuration, { instance: "q1", supports }),
    );

    return rendered.html;
  }).pipe(Effect.orDie);

/**
 * Collect every element of a tree in document order.
 *
 * @param nodes The nodes to walk.
 * @returns Each element, each before its descendants.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Find the item Root in rendered HTML.
 *
 * @param html The rendered HTML.
 * @returns The `qti-assessment-item` element.
 */
const rootOf = (html: string): Element =>
  elementsOf(parseHtml(html)).find((element) => element.attrs["data-slot"] === "item") ??
  assert.fail("no item Root in the rendered HTML");

/**
 * The attributes the Root carries under the supports, with the chrome's own left out.
 *
 * @param supports The supports the host enabled.
 * @returns The Root's attributes that are not `data-mode`, `data-slot`, `id` or `lang`.
 */
const preferenceAttributes = (supports: Supports): Effect.Effect<Record<string, string>> =>
  Effect.map(renderWith(supports), (html) =>
    Object.fromEntries(
      Object.entries(rootOf(html).attrs).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" &&
          !["data-mode", "data-slot", "id", "lang"].includes(entry[0]),
      ),
    ),
  );

/**
 * Supports with the display preferences changed from none.
 *
 * @param display The display preferences to change.
 * @returns The supports, every other support off.
 */
const withDisplay = (display: Partial<DisplayPreferences>): Supports => ({
  ...noSupports,
  display: { ...noSupports.display, ...display },
});

/**
 * The text preferences with nothing set.
 */
const noText: TextPreferences = {
  colorTheme: Option.none(),
  fontNames: [],
  fontSize: Option.none(),
  genericFontFace: Option.none(),
  letterSpacing: Option.none(),
  lineHeight: Option.none(),
  lineSpacing: Option.none(),
  uniformFontSizing: false,
  wordSpacing: Option.none(),
  wordWrapping: false,
};

/**
 * Supports with the text preferences changed from none.
 *
 * @param text The text preferences to change.
 * @returns The supports, every other support off.
 */
const withText = (text: Partial<TextPreferences>): Supports =>
  withDisplay({ text: Option.some({ ...noText, ...text }) });

/**
 * A font size as a factor of the item's own.
 *
 * @param value The factor.
 * @returns The font size.
 */
const factor = (value: number): FontSize => ({ kind: "factor", value });

/**
 * A font size in points.
 *
 * @param value The size.
 * @returns The font size.
 */
const points = (value: number): FontSize => ({ kind: "points", value });

/**
 * The attributes the Root carries under text preferences changed from none.
 *
 * @param changes The text preferences to change.
 * @returns The Root's preference attributes.
 */
const textAttributesWith = (changes: Partial<TextPreferences>) =>
  preferenceAttributes(withText(changes));

/**
 * The `data-font-size` the Root carries for a font size.
 *
 * @param size The font size.
 * @returns The attribute's value, none when the Root carries none.
 */
const sizedAttribute = (size: FontSize) =>
  Effect.map(
    textAttributesWith({ fontSize: Option.some(size) }),
    (found) => found["data-font-size"],
  );

/**
 * The `data-color-theme` the Root carries for a colour theme.
 *
 * @param name The theme as the profile gave it.
 * @returns The attribute's value, none when the Root carries none.
 */
const themeAttribute = (name: string) =>
  Effect.map(
    textAttributesWith({ colorTheme: Option.some(name) }),
    (found) => found["data-color-theme"],
  );

/**
 * Pair each step of a scale with itself, for a scale whose rule declares the step as it is written.
 *
 * @param steps The steps.
 * @returns Each step with the value its rule declares.
 */
const identical = (steps: readonly string[]): readonly (readonly [string, string])[] =>
  steps.map((step) => [step, step] as const);

/**
 * The supports a PNP file gives, read as the host reads it.
 *
 * @param name The path under `fixtures/m5/`.
 * @returns The supports.
 */
const supportsOf = (name: string): Effect.Effect<Supports> =>
  readPnp(fixture(name)).pipe(Effect.orDie);

/**
 * Scan the display block of the sheet, the rules between its two comments.
 *
 * @returns The block's rules, in source order.
 */
const displayBlock: Effect.Effect<Sheet> = Effect.suspend(() => {
  const start = sheetText.indexOf(blockOpen);
  const end = sheetText.indexOf(blockClose);

  assert.isTrue(start !== -1 && end > start, "the sheet holds the display block");

  return scanSheet(sheetText.slice(start + blockOpen.length, end)).pipe(Effect.orDie);
});

/**
 * Find the rules of the block whose selector list names an attribute test.
 *
 * @param sheet The block.
 * @param test The attribute test as written, such as `[data-layout="single-column"]`.
 * @returns The rules whose selectors include the test.
 */
const rulesNaming = (sheet: Sheet, test: string): readonly StyleRule[] =>
  sheet.rules.filter((rule) => rule.selectors.some((selector) => selector.includes(test)));

/**
 * The value a rule declares for a property.
 *
 * @param rule The rule.
 * @param property The property name.
 * @returns The value, none when the rule does not declare it.
 */
const declared = (rule: StyleRule, property: string): Option.Option<string> =>
  Option.fromNullishOr(
    rule.declarations.find((declaration) => declaration.property === property)?.value,
  );

/**
 * The relative luminance of a six-digit hex colour, as WCAG 2 defines it.
 *
 * @param hex The colour, `#rrggbb`.
 * @returns The luminance, 0 to 1.
 */
const luminance = (hex: string): number => {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
};

/**
 * The WCAG 2 contrast ratio of two six-digit hex colours.
 *
 * @param first One colour.
 * @param second The other.
 * @returns The ratio, 1 to 21.
 */
const contrast = (first: string, second: string): number => {
  const [lighter = 0, darker = 0] = [luminance(first), luminance(second)].toSorted(
    (left, right) => right - left,
  );

  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * The text and background colour each themed pair of the schema's `color-theme` vocabulary names,
 * by theme: the themes that fix colours. `default` fixes none, and `default-reverse` swaps the
 * item's own two, so neither is here.
 */
const themePairs = {
  "black-cream": ["#000000", "#fffdd0"],
  "black-cyan": ["#000000", "#00ffff"],
  "black-rose": ["#000000", "#ffc0cb"],
  "blue-yellow": ["#0000cd", "#ffff00"],
  "cream-black": ["#fffdd0", "#000000"],
  "cyan-black": ["#00ffff", "#000000"],
  "darkgray-medgray": ["#333333", "#c8c8c8"],
  "high-contrast": ["#000000", "#ffffff"],
  "high-contrast-reverse": ["#ffffff", "#000000"],
  "medgray-darkgray": ["#c8c8c8", "#333333"],
  "rose-black": ["#ffc0cb", "#000000"],
  "yellow-blue": ["#ffff00", "#000080"],
} as const satisfies Readonly<Record<string, readonly [string, string]>>;

describe("the high-contrast catalog alternative (row A-17)", () => {
  it.effect("[A-17] an at-start high-contrast support shows the image's high-contrast card", () =>
    Effect.gen(function* checkHighContrastCard() {
      const supports = yield* supportsOf("pnp-display.xml");
      const html = yield* renderWith(supports);
      const plain = yield* renderWith(noSupports);
      const items = elementsOf(parseHtml(html)).filter(
        (element) => element.attrs["data-support"] === "high-contrast",
      );
      const [card] = items;

      assert.isTrue(supports.catalog.has("high-contrast"));
      assert.strictEqual(items.length, 1);
      assert.include(html, 'src="images/harbour-high-contrast.png"');
      assert.isAbove(
        html.indexOf("harbour-high-contrast.png"),
        html.indexOf('src="images/harbour.png"'),
      );
      assert.isAbove(
        html.indexOf("harbour-high-contrast.png"),
        html.indexOf('data-slot="choice-interaction"'),
      );
      assert.strictEqual(card?.tag, "li");
      assert.notInclude(plain, "harbour-high-contrast");
      assert.notInclude(plain, "data-support");
    }),
  );
});

describe("inverted polarity (row A-20)", () => {
  it.effect("[A-20] inverted polarity with colours marks the root and sets both colours", () =>
    Effect.gen(function* checkPolarity() {
      const supports = yield* supportsOf("pnp-display.xml");
      const attributes = yield* preferenceAttributes(supports);

      assert.strictEqual(attributes["data-polarity"], "inverted");
      assert.strictEqual(attributes["data-polarity-foreground"], "#ffffff");
      assert.strictEqual(attributes["data-polarity-background"], "#000000");

      const bare = yield* preferenceAttributes(withDisplay({ invertDisplayPolarity: true }));

      assert.deepStrictEqual(bare, { "data-polarity": "inverted" });

      const oneColour = yield* preferenceAttributes(
        withDisplay({
          invertDisplayPolarity: true,
          invertedColors: Option.some({
            background: Option.none(),
            foreground: Option.some("#ffff00"),
          }),
        }),
      );

      assert.deepStrictEqual(oneColour, {
        "data-polarity": "inverted",
        "data-polarity-foreground": "#ffff00",
      });
    }),
  );

  it.effect("[A-20] a colour that is not a hex colour is never written", () =>
    Effect.gen(function* checkPolarityColours() {
      const attributes = yield* preferenceAttributes(
        withDisplay({
          invertDisplayPolarity: true,
          invertedColors: Option.some({
            background: Option.some("red; background: url(x)"),
            foreground: Option.some("#fffff"),
          }),
        }),
      );

      assert.deepStrictEqual(attributes, { "data-polarity": "inverted" });
    }),
  );

  it.effect("[A-20] without the preference the root carries no polarity marker", () =>
    Effect.gen(function* checkNoPolarity() {
      const supports = withDisplay({
        invertedColors: Option.some({
          background: Option.some("#000000"),
          foreground: Option.some("#ffffff"),
        }),
      });
      const attributes = yield* preferenceAttributes(supports);

      assert.deepStrictEqual(
        Object.keys(attributes).filter((name) => name.startsWith("data-polarity")),
        [],
      );
      assert.strictEqual(yield* renderWith(supports), yield* renderWith(noSupports));
    }),
  );

  it.effect("[A-20] the block swaps the card pair when the host gives no colour", () =>
    Effect.gen(function* checkPolarityRules() {
      const sheet = yield* displayBlock;
      const rules = rulesNaming(
        sheet,
        '[data-polarity="inverted"]:not([data-polarity-foreground], [data-polarity-background])',
      );
      const [rule] = rules;

      assert.strictEqual(rules.length, 1);
      assert.deepStrictEqual(
        declared(rule ?? assert.fail("no polarity rule"), "color"),
        Option.some("var(--card, oklch(1 0 0))"),
      );
      assert.deepStrictEqual(
        declared(rule ?? assert.fail("no polarity rule"), "background-color"),
        Option.some("var(--card-foreground, oklch(0.145 0 0))"),
      );
    }),
  );
});

describe("single column (row A-26)", () => {
  it.effect("[A-26] single column marks the root and the supports block flows one column", () =>
    Effect.gen(function* checkSingleColumn() {
      const supports = yield* supportsOf("pnp-display.xml");
      const attributes = yield* preferenceAttributes(supports);
      const sheet = yield* displayBlock;
      const rules = rulesNaming(sheet, '[data-layout="single-column"]');

      assert.strictEqual(attributes["data-layout"], "single-column");
      assert.strictEqual(rules.length, 1);
      assert.deepStrictEqual(
        declared(rules[0] ?? assert.fail("no rule"), "column-count"),
        Option.some("1"),
      );
      assert.deepStrictEqual(
        yield* preferenceAttributes(withDisplay({ layoutSingleColumn: false })),
        {},
      );
    }),
  );
});

describe("the zoom amount (row A-30b)", () => {
  it.effect("[A-30b] the zoom amount is the magnification m3e-09 applies", () =>
    Effect.gen(function* checkZoom() {
      const supports = yield* supportsOf("pnp-display.xml");
      const attributes = yield* preferenceAttributes(supports);

      assert.strictEqual(attributes["data-magnification"], "250");
      assert.deepStrictEqual(
        yield* preferenceAttributes(withDisplay({ magnification: Option.some(1) })),
        {},
      );
    }),
  );
});

describe("text appearance beyond the colours (row A-42b)", () => {
  it.effect("[A-42b] font size, family and spacing become data attributes", () =>
    Effect.gen(function* checkTextAppearance() {
      const supports = yield* supportsOf("pnp-display.xml");
      const attributes = yield* preferenceAttributes(supports);

      assert.strictEqual(attributes["data-font-size"], "1.5em");
      assert.strictEqual(
        attributes["data-font-family"],
        '"Atkinson Hyperlegible", "Verdana", sans-serif',
      );
      assert.strictEqual(attributes["data-font-generic"], "sans-serif");
      assert.strictEqual(attributes["data-line-height"], "1.75");
      assert.strictEqual(attributes["data-letter-spacing"], "2px");
      assert.strictEqual(attributes["data-word-spacing"], "4px");
      assert.strictEqual(attributes["data-color-theme"], "black-cream");
    }),
  );

  it.effect("[A-42b] each scale takes the nearest step, a tie to the larger, and clamps", () =>
    Effect.gen(function* checkSteps() {
      assert.strictEqual(yield* sizedAttribute(factor(1.2)), "1.25em");
      assert.strictEqual(yield* sizedAttribute(factor(1.125)), "1.25em");
      assert.strictEqual(yield* sizedAttribute(factor(1)), "1em");
      assert.strictEqual(yield* sizedAttribute(factor(0.1)), "0.75em");
      assert.strictEqual(yield* sizedAttribute(factor(9)), "3em");
      assert.strictEqual(yield* sizedAttribute(points(13)), "14pt");
      assert.strictEqual(yield* sizedAttribute(points(11.9)), "12pt");
      assert.strictEqual(yield* sizedAttribute(points(40)), "36pt");
      assert.isUndefined(yield* sizedAttribute(factor(0)));
      assert.isUndefined(yield* sizedAttribute(factor(-1)));
      assert.isUndefined(yield* sizedAttribute(factor(Number.NaN)));
      assert.isUndefined(yield* sizedAttribute(points(Number.POSITIVE_INFINITY)));

      assert.strictEqual(
        (yield* textAttributesWith({ lineHeight: Option.some(1.4) }))["data-line-height"],
        "1.5",
      );
      assert.strictEqual(
        (yield* textAttributesWith({ letterSpacing: Option.some(0.1) }))["data-letter-spacing"],
        "0.5px",
      );
      assert.strictEqual(
        (yield* textAttributesWith({ wordSpacing: Option.some(100) }))["data-word-spacing"],
        "16px",
      );
      assert.deepStrictEqual(yield* textAttributesWith({ lineHeight: Option.some(0) }), {});
    }),
  );

  it.effect("[A-42b] the font family keeps the names quoted and the generic last", () =>
    Effect.gen(function* checkFamily() {
      assert.deepStrictEqual(
        yield* textAttributesWith({ fontNames: ['Odd "Name"', "Back\\slash"] }),
        {
          "data-font-family": '"Odd \\"Name\\"", "Back\\\\slash"',
        },
      );
      assert.deepStrictEqual(
        yield* textAttributesWith({ genericFontFace: Option.some("monospaced") }),
        {
          "data-font-family": "monospace",
          "data-font-generic": "monospace",
        },
      );
      assert.deepStrictEqual(
        yield* textAttributesWith({
          fontNames: ["Verdana"],
          genericFontFace: Option.some("serif"),
        }),
        {
          "data-font-family": '"Verdana", serif',
          "data-font-generic": "serif",
        },
      );
      assert.deepStrictEqual(yield* textAttributesWith({ fontNames: ["", "Line\nbreak"] }), {});
    }),
  );

  it.effect("[A-42b] the colour theme marks the root and the block defines its pair", () =>
    Effect.gen(function* checkTheme() {
      const sheet = yield* displayBlock;

      for (const [name, [text, ground]] of Object.entries(themePairs)) {
        const [rule] = rulesNaming(sheet, `[data-color-theme="${name}"]`);

        assert.strictEqual(yield* themeAttribute(name), name);
        assert.deepStrictEqual(
          declared(rule ?? assert.fail(`no rule for ${name}`), "color"),
          Option.some(text),
        );
        assert.deepStrictEqual(
          declared(rule ?? assert.fail(`no rule for ${name}`), "background-color"),
          Option.some(ground),
        );
        assert.isAtLeast(contrast(text, ground), 7, `${name} holds 7:1`);
      }

      const [reverse] = rulesNaming(sheet, '[data-color-theme="default-reverse"]');

      assert.strictEqual(yield* themeAttribute("default"), "default");
      assert.strictEqual(yield* themeAttribute("default-reverse"), "default-reverse");
      assert.deepStrictEqual(
        declared(reverse ?? assert.fail("no default-reverse rule"), "color"),
        Option.some("var(--card, oklch(1 0 0))"),
      );
      assert.strictEqual(rulesNaming(sheet, '[data-color-theme="default"]').length, 0);
      assert.strictEqual(yield* themeAttribute("ext:quiet-room"), "ext:quiet-room");
      assert.isUndefined(yield* themeAttribute("fuchsia"));
      assert.isUndefined(yield* themeAttribute("ext:"));
    }),
  );

  it.effect("[A-42b] the block applies each step of each scale and the generic family", () =>
    Effect.gen(function* checkScales() {
      const sheet = yield* displayBlock;
      const scales = [
        {
          attribute: "data-font-size",
          property: "font-size",
          steps: identical(["0.75em", "1em", "1.25em", "1.5em", "2em", "2.5em", "3em"]),
        },
        {
          attribute: "data-font-size",
          property: "font-size",
          steps: [
            ["10pt", "13.333px"],
            ["12pt", "16px"],
            ["14pt", "18.667px"],
            ["18pt", "24px"],
            ["24pt", "32px"],
            ["36pt", "48px"],
          ],
        },
        {
          attribute: "data-line-height",
          property: "line-height",
          steps: identical(["1", "1.15", "1.25", "1.5", "1.75", "2", "2.5", "3"]),
        },
        {
          attribute: "data-letter-spacing",
          property: "letter-spacing",
          steps: identical(["0.5px", "1px", "2px", "3px", "4px", "6px"]),
        },
        {
          attribute: "data-word-spacing",
          property: "word-spacing",
          steps: identical(["1px", "2px", "4px", "8px", "16px"]),
        },
      ] satisfies readonly {
        readonly attribute: string;
        readonly property: string;
        readonly steps: readonly (readonly [string, string])[];
      }[];

      for (const { attribute, property, steps } of scales) {
        for (const [step, value] of steps) {
          const [rule] = rulesNaming(sheet, `[${attribute}="${step}"]`);

          assert.deepStrictEqual(
            declared(rule ?? assert.fail(`no rule for ${attribute}=${step}`), property),
            Option.some(value),
            `${attribute}=${step}`,
          );
        }
      }

      for (const generic of ["cursive", "fantasy", "monospace", "sans-serif", "serif"]) {
        const [rule] = rulesNaming(sheet, `[data-font-generic="${generic}"]`);

        assert.deepStrictEqual(
          declared(rule ?? assert.fail(`no rule for ${generic}`), "font-family"),
          Option.some(generic),
        );
      }
    }),
  );
});

describe("preferences that change nothing", () => {
  it.effect("[A-20] [A-26] [A-42b] an option-only preference changes nothing", () =>
    Effect.gen(function* checkOptionSet() {
      const plain = yield* renderWith(noSupports);
      const supports = yield* readPnp(
        new TextEncoder().encode(
          `<access-for-all-pnp xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0">
            <invert-display-polarity foreground="#ffffff" background="#000000"/>
            <layout-single-column/>
            <text-appearance><font-size>2</font-size></text-appearance>
            <activate-as-option-set>
              <invert-display-polarity/>
              <layout-single-column/>
              <text-appearance/>
            </activate-as-option-set>
          </access-for-all-pnp>`,
        ),
      ).pipe(Effect.orDie);

      assert.strictEqual(yield* renderWith(supports), plain);
    }),
  );

  it.effect("[A-30b] [A-42b] no preference leaves the Root with only the chrome's attributes", () =>
    Effect.gen(function* checkNone() {
      const html = yield* renderWith(noSupports);

      assert.deepStrictEqual(Object.keys(rootOf(html).attrs).toSorted(), [
        "data-mode",
        "data-slot",
        "id",
        "lang",
      ]);
      assert.notInclude(html, "style=");
    }),
  );
});

describe("no inline style under any display preference", () => {
  it.effect(
    "[A-20] [A-26] [A-30b] [A-42b] the Root writes no style attribute and no custom property",
    () =>
      Effect.gen(function* checkNoStyle() {
        const html = yield* renderWith(yield* supportsOf("pnp-display.xml"));

        assert.notInclude(html, "style=");
        assert.notInclude(html, "--qti");
        assert.isFalse(
          Object.keys(rootOf(html).attrs).some((name) => name === "style" || name === "class"),
        );
      }),
  );
});
