import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { acceptedItem, configure, open, redact, render } from "#plate/index.ts";
import type { Accepted, Element, Node, Verdict } from "#plate/index.ts";
import { compounds, compoundsDeep, scanSheet } from "#plate/test/css.ts";
import type { Sheet, StyleRule } from "#plate/test/css.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { behaviourClasses, styledClasses } from "#plate/vocabulary.ts";

/**
 * Where the vocabulary fixture sits under the package, which `open` takes as the document's
 * location.
 */
const fixtureLocation = "fixtures/m3e/items/vocabulary.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * The six classes the sheet styled on the item body before the shared vocabulary's general classes
 * and CSS utilities joined them.
 */
const earlierClasses: readonly string[] = [
  "qti-hidden",
  "qti-visually-hidden",
  "qti-underline",
  "qti-italic",
  "qti-bordered",
  "qti-well",
];

/**
 * The classes the body leaves out until the operator rules: the two writing-mode names for
 * horizontal text, the eleven list styles only one section of the vocabulary lists (the first four
 * from Section 1.1.7, the rest from Section 2.10), and `qti-keyword-emphasis`, a preference of a
 * later issue. The text indent scale, whose two sections disagree, is left out by prefix.
 */
const excludedClasses: ReadonlySet<string> = new Set([
  "qti-writing-mode-vertical-tb",
  "qti-writing-mode-horizontal-tb",
  "qti-keyword-emphasis",
  "qti-list-style-type-kannada",
  "qti-list-style-type-katakana",
  "qti-list-style-type-katakana-iroha",
  "qti-list-style-type-none",
  "qti-list-style-type-ethiopic-halehame",
  "qti-list-style-type-ethiopic-halehame-am",
  "qti-list-style-type-ethiopic-halehame-ti-er",
  "qti-list-style-type-ethiopic-halehame-ti-et",
  "qti-list-style-type-hangul",
  "qti-list-style-type-hangul-consonant",
  "qti-list-style-type-urdu",
]);

/**
 * The prefix of the text indent classes, which the body leaves out.
 */
const textIndentPrefix = "qti-text-indent-";

/**
 * Count from one number to another.
 *
 * @param first The first number.
 * @param last The last number.
 * @returns Each whole number from `first` to `last`, in order.
 */
const range = (first: number, last: number): readonly number[] =>
  Array.from({ length: last - first + 1 }, (_unused, index) => first + index);

/**
 * Write a fraction of a whole as the percentage a utility declares: six decimals at most, no
 * trailing zero.
 *
 * @param numerator The part.
 * @param denominator The whole.
 * @returns The percentage with its unit, such as `33.333333%`.
 */
const percent = (numerator: number, denominator: number): string =>
  `${Math.round((numerator / denominator) * 1e8) / 1e6}%`;

/**
 * Write a number of the listing's quarter-rem steps as a length.
 *
 * @param steps The number of steps.
 * @returns `0` for none, otherwise the steps times 0.25 in rem.
 */
const quarterRems = (steps: number): string => (steps === 0 ? "0" : `${steps * 0.25}rem`);

/**
 * The display utilities' keywords: `qti-display-<keyword>` declares `display: <keyword>`.
 */
const displays: readonly string[] = [
  "inline",
  "inline-block",
  "block",
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "table",
  "table-cell",
  "table-row",
  "list-item",
  "inherit",
];

/**
 * The flex utilities, each with the property and value it declares.
 */
const flexes: readonly (readonly [name: string, property: string, value: string])[] = [
  ["qti-flex-direction-column", "flex-direction", "column"],
  ["qti-flex-direction-row", "flex-direction", "row"],
  ["qti-flex-grow-0", "flex-grow", "0"],
  ["qti-flex-grow-1", "flex-grow", "1"],
];

/**
 * The seven margin steps, each with the length it declares.
 */
const marginSteps: readonly (readonly [step: string, value: string])[] = [
  ["0", "0"],
  ["1", "0.25rem"],
  ["2", "0.5rem"],
  ["3", "1rem"],
  ["4", "1.5rem"],
  ["5", "3rem"],
  ["auto", "auto"],
];

/**
 * The six padding steps, which are the margin's without `auto`.
 */
const paddingSteps: readonly (readonly [step: string, value: string])[] = marginSteps.filter(
  ([step]) => step !== "auto",
);

/**
 * The side letters of the spacing utilities, each with the sides it sets (a logical property's
 * suffix) and, for an axis, the shorthand that sets both of its sides at once.
 */
const sides: readonly (readonly [
  letter: string,
  longhands: readonly string[],
  shorthand: string | undefined,
])[] = [
  ["t", ["block-start"], undefined],
  ["b", ["block-end"], undefined],
  ["s", ["inline-start"], undefined],
  ["e", ["inline-end"], undefined],
  ["x", ["inline-start", "inline-end"], "inline"],
  ["y", ["block-start", "block-end"], "block"],
];

/**
 * The listing's size steps shared by the height and width utilities: `px`, then each number of
 * quarter rems, a `p5` being a half step.
 */
const sizeSteps: readonly string[] = [
  "px",
  "0",
  "0p5",
  "1",
  "1p5",
  "2",
  "2p5",
  "3",
  "3p5",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "20",
  "24",
  "28",
  "32",
  "36",
  "40",
  "44",
  "48",
  "52",
  "56",
  "60",
  "64",
  "72",
  "80",
  "96",
];

/**
 * The listing's fractional sizes shared by the height and width utilities: halves, thirds,
 * quarters, fifths and sixths.
 */
const fractionSteps: readonly string[] = [
  "1-2",
  "1-3",
  "2-3",
  "1-4",
  "2-4",
  "3-4",
  ...range(1, 4).map((numerator) => `${numerator}-5`),
  ...range(1, 5).map((numerator) => `${numerator}-6`),
];

/**
 * The height utilities' steps: the size steps, the fractions, `auto` and `full`.
 */
const heightSteps: readonly string[] = [...sizeSteps, ...fractionSteps, "auto", "full"];

/**
 * The width utilities' steps: the height's, and the twelfths from `1-12` to `11-12`.
 */
const widthSteps: readonly string[] = [
  ...heightSteps,
  ...range(1, 11).map((numerator) => `${numerator}-12`),
];

/**
 * Give the length a height or width step declares.
 *
 * @param step A step of {@link heightSteps} or {@link widthSteps}.
 * @returns `1px` for `px`, `auto`, `100%` for `full`, a percentage for a fraction, and otherwise
 *   the number of quarter rems the step names.
 */
const sizeValue = (step: string): string => {
  const fraction = /^(?<numerator>\d+)-(?<denominator>\d+)$/u.exec(step)?.groups;
  if (fraction?.["numerator"] !== undefined && fraction["denominator"] !== undefined) {
    return percent(Number(fraction["numerator"]), Number(fraction["denominator"]));
  }

  switch (step) {
    case "px": {
      return "1px";
    }
    case "auto": {
      return "auto";
    }
    case "full": {
      return "100%";
    }
    default: {
      return quarterRems(Number(step.replace("p5", ".5")));
    }
  }
};

/**
 * The list styles both sections of the shared vocabulary list, each a predefined counter style the
 * class of the same name sets.
 */
const listStyles: readonly string[] = [
  "arabic-indic",
  "armenian",
  "bengali",
  "cambodian",
  "circle",
  "cjk-earthly-branch",
  "cjk-heavenly-stem",
  "cjk-ideographic",
  "decimal",
  "decimal-leading-zero",
  "devanagari",
  "disc",
  "georgian",
  "gujarati",
  "gurmukhi",
  "hebrew",
  "hiragana",
  "hiragana-iroha",
  "khmer",
  "korean-hangul-formal",
  "korean-hanja-formal",
  "korean-hanja-informal",
  "lao",
  "lower-alpha",
  "lower-armenian",
  "lower-greek",
  "lower-latin",
  "lower-roman",
  "malayalam",
  "mongolian",
  "myanmar",
  "oriya",
  "persian",
  "simp-chinese-formal",
  "simp-chinese-informal",
  "square",
  "telugu",
  "thai",
  "tibetan",
  "trad-chinese-formal",
  "trad-chinese-informal",
  "upper-alpha",
  "upper-armenian",
  "upper-latin",
  "upper-roman",
];

/**
 * The classes of Section 1.1 that set one property each, with that property and the value it
 * declares: the alignments, the floats and clears, the vertical writing modes and the two text
 * orientation classes.
 */
const declaring: readonly (readonly [name: string, property: string, value: string])[] = [
  ["qti-align-left", "text-align", "left"],
  ["qti-align-center", "text-align", "center"],
  ["qti-align-right", "text-align", "right"],
  ["qti-valign-top", "vertical-align", "top"],
  ["qti-valign-middle", "vertical-align", "middle"],
  ["qti-valign-baseline", "vertical-align", "baseline"],
  ["qti-valign-bottom", "vertical-align", "bottom"],
  ["qti-fullwidth", "inline-size", "100%"],
  ["qti-float-left", "float", "left"],
  ["qti-float-right", "float", "right"],
  ["qti-float-none", "float", "none"],
  ["qti-float-clear-left", "clear", "left"],
  ["qti-float-clear-right", "clear", "right"],
  ["qti-float-clear-both", "clear", "both"],
  ["qti-writing-mode-vertical-rl", "writing-mode", "vertical-rl"],
  ["qti-writing-mode-vertical-lr", "writing-mode", "vertical-lr"],
  ["qti-text-orientation-upright", "text-orientation", "upright"],
  ["qti-text-combine-upright-all", "text-combine-upright", "all"],
];

/**
 * The general-purpose classes of Section 1.1 beyond the six the sheet had: the layout grid's row,
 * twelve columns and eleven offsets, `qti-display-inline-block`, the classes that set one
 * property, the clearfix and the 45 list styles.
 */
const generalClasses: readonly string[] = [
  "qti-layout-row",
  ...range(1, 12).map((column) => `qti-layout-col${column}`),
  ...range(1, 11).map((offset) => `qti-layout-offset${offset}`),
  "qti-display-inline-block",
  ...declaring.map(([name]) => name),
  "qti-float-clearfix",
  ...listStyles.map((style) => `qti-list-style-type-${style}`),
];

/**
 * The display utilities of Section 2, by class name.
 */
const displayClasses: readonly string[] = displays.map((keyword) => `qti-display-${keyword}`);

/**
 * The flex utilities of Section 2, by class name.
 */
const flexClasses: readonly string[] = flexes.map(([name]) => name);

/**
 * The margin utilities of Section 2: every step on all sides, then each side letter's steps.
 */
const marginClasses: readonly string[] = [
  ...marginSteps.map(([step]) => `qti-margin-${step}`),
  ...sides.flatMap(([letter]) => marginSteps.map(([step]) => `qti-margin-${letter}-${step}`)),
];

/**
 * The padding utilities of Section 2: every step on all sides, then each side letter's steps.
 */
const paddingClasses: readonly string[] = [
  ...paddingSteps.map(([step]) => `qti-padding-${step}`),
  ...sides.flatMap(([letter]) => paddingSteps.map(([step]) => `qti-padding-${letter}-${step}`)),
];

/**
 * The height utilities of Section 2, by class name.
 */
const heightClasses: readonly string[] = heightSteps.map((step) => `qti-height-${step}`);

/**
 * The width utilities of Section 2, by class name.
 */
const widthClasses: readonly string[] = widthSteps.map((step) => `qti-width-${step}`);

/**
 * Read the stylesheet as the host links it and scan it, as the sheet's own tests do.
 */
const sheetOf: Effect.Effect<Sheet, Error> = Effect.tryPromise({
  catch: (cause) => new Error("cannot read src/styles.css", { cause }),
  try: () => readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8"),
}).pipe(Effect.flatMap(scanSheet));

/**
 * Find the rules that style one class on its own: a selector that is that class alone, with no
 * type, attribute, pseudo-class or pseudo-element beside it.
 *
 * @param sheet The scanned sheet.
 * @param name The class's name.
 * @returns Each such rule, in sheet order.
 */
const ownRules = (sheet: Sheet, name: string): readonly StyleRule[] =>
  sheet.rules.filter((rule) =>
    rule.selectors.some((selector) => {
      const [only, ...rest] = compounds(selector);

      return (
        only !== undefined &&
        rest.length === 0 &&
        only.classes.length === 1 &&
        only.classes[0] === name &&
        Option.isNone(only.type) &&
        only.attributes.length === 0 &&
        only.pseudoClasses.length === 0 &&
        only.pseudoElements.length === 0
      );
    }),
  );

/**
 * Read the value a rule gives a property.
 *
 * @param rule The rule.
 * @param property The property's name.
 * @returns The last value the rule declares for it, or `undefined` when it declares none.
 */
const valueOf = (rule: StyleRule, property: string): string | undefined =>
  rule.declarations.findLast((declaration) => declaration.property === property)?.value;

/**
 * Read the value a class gives a property, through the class's own rules.
 *
 * @param sheet The scanned sheet.
 * @param name The class's name.
 * @param property The property's name.
 * @returns The value the class's last rule that declares the property gives it, or `undefined`
 *   when no rule of the class declares it.
 */
const classValue = (sheet: Sheet, name: string, property: string): string | undefined =>
  ownRules(sheet, name)
    .map((rule) => valueOf(rule, property))
    .findLast((value) => value !== undefined);

/**
 * Check that a class declares a property with one value, reporting a miss as a line.
 *
 * @param sheet The scanned sheet.
 * @param name The class's name.
 * @param property The property's name.
 * @param expected The value the class must declare.
 * @returns No line when it does, otherwise one line naming the class, the property and what the
 *   sheet gives.
 */
const mismatch = (
  sheet: Sheet,
  name: string,
  property: string,
  expected: string,
): readonly string[] => {
  const actual = classValue(sheet, name, property);

  return actual === expected
    ? []
    : [`${name} { ${property}: ${actual ?? "(none)"} }, not ${expected}`];
};

/**
 * Read a declared percentage in millionths of a percent, so sums of percentages are exact.
 *
 * @param value A declared value such as `8.333333%`, or `undefined` for none declared.
 * @returns The percentage times a million, rounded; `NaN` when the value is not a percentage.
 */
const micro = (value: string | undefined): number =>
  Math.round(Number(value?.replace(/%$/u, "") ?? "NaN") * 1e6);

/**
 * Read every class any selector of the sheet names, at any depth.
 *
 * @param sheet The scanned sheet.
 * @returns The class names.
 */
const namedClasses = (sheet: Sheet): ReadonlySet<string> =>
  new Set(
    sheet.rules
      .flatMap((rule) => rule.selectors)
      .flatMap(compoundsDeep)
      .flatMap((compound) => compound.classes),
  );

/**
 * The body classes beyond the six the sheet had: every class of the body owner but those.
 */
const addedClasses: readonly string[] = styledClasses.body.filter(
  (name) => !earlierClasses.includes(name),
);

/**
 * Read the vocabulary fixture as a host reads a document from storage.
 */
const fixtureBytes: Effect.Effect<Uint8Array> = Effect.promise(() =>
  readFile(path.resolve(import.meta.dirname, "..", fixtureLocation)),
);

/**
 * Read the fixture's text.
 */
const fixtureText: Effect.Effect<string> = fixtureBytes.pipe(
  Effect.map((bytes) => new TextDecoder().decode(bytes)),
);

/**
 * Take the accepted item out of a verdict, failing the test when the verdict accepts none.
 *
 * @param verdict The verdict.
 * @returns The accepted item.
 */
const acceptedOf = (verdict: Verdict): Accepted =>
  Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the document is ${verdict.verdict}, not accepted`),
  );

/**
 * Open the vocabulary fixture, redact it and render it as a host does for one candidate.
 *
 * @returns The nodes the page's HTML parses to.
 */
const renderedFixture = Effect.fnUntraced(function* renderedFixture() {
  const accepted = acceptedOf(yield* open(fixtureLocation, yield* fixtureBytes));
  const configuration = yield* configure({});
  const rendered = yield* Effect.fromResult(render(redact(accepted), configuration, { instance }));

  return parseHtml(rendered.html);
});

/**
 * List the elements of some nodes, at any depth, in document order.
 *
 * @param nodes The nodes.
 * @returns Each element, a parent before its children.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Read the characters of some nodes, at any depth, in document order.
 *
 * @param nodes The nodes.
 * @returns Their text, joined.
 */
const textOf = (nodes: readonly Node[]): string =>
  nodes.map((node) => (node.kind === "text" ? node.text : textOf(node.children))).join("");

/**
 * Read an element's `class` attribute.
 *
 * @param element The element.
 * @returns The value as written, `undefined` when the element carries none; a bare attribute reads
 *   as the empty string.
 */
const classAttribute = (element: Element): string | undefined => {
  const value = element.attrs["class"];

  return value === true ? "" : value;
};

/**
 * Read an element's classes.
 *
 * @param element The element.
 * @returns Its `class` attribute split on white space, none when it has no `class`.
 */
const classesOn = (element: Element): readonly string[] =>
  (classAttribute(element) ?? "").split(/\s+/u).filter((name) => name !== "");

/**
 * The elements the fixture puts classes on: `div`, `p`, `ol` and `span`.
 */
const classedTags: ReadonlySet<string> = new Set(["div", "p", "ol", "span"]);

/**
 * The words that open the fixture's eleven blocks, in the order the fixture's source writes them,
 * which is the order a reader meets them.
 */
const ordinals: readonly string[] = [
  "First:",
  "Second:",
  "Third:",
  "Fourth:",
  "Fifth:",
  "Sixth:",
  "Seventh:",
  "Eighth:",
  "Ninth:",
  "Tenth:",
  "Eleventh:",
];

/**
 * Read where each word first occurs in a text.
 *
 * @param source The text.
 * @param words The words.
 * @returns Each word's position, `-1` for a word the text lacks.
 */
const positionsOf = (source: string, words: readonly string[]): readonly number[] =>
  words.map((word) => source.indexOf(word));

/**
 * Tell whether positions are all found and strictly increasing.
 *
 * @param positions The positions.
 * @returns Whether none is below zero and each is above the one before.
 */
const increasing = (positions: readonly number[]): boolean =>
  positions.every(
    (position, index) => position >= 0 && (index === 0 || position > (positions[index - 1] ?? -1)),
  );

/**
 * Read the class values the fixture's source gives, in the order it writes them.
 *
 * @param source The fixture's text.
 * @returns Each `class` attribute's value.
 */
const authoredClassValues = (source: string): readonly string[] =>
  Array.from(
    source.matchAll(/ class="(?<value>[^"]*)"/gu),
    (match) => match.groups?.["value"] ?? "",
  );

/**
 * Check a margin or padding utility of one side letter and step: its own rules declare only the
 * logical properties of its side, and give them the step's length.
 *
 * @param sheet The scanned sheet.
 * @param family `margin` or `padding`.
 * @param side The side letter's row of {@link sides}.
 * @param step The step's name and length.
 * @returns One line for each way the utility misses, none when it holds.
 */
const spacingFailures = (
  sheet: Sheet,
  family: "margin" | "padding",
  side: (typeof sides)[number],
  step: readonly [step: string, value: string],
): readonly string[] => {
  const [letter, longhands, shorthand] = side;
  const [stepName, value] = step;
  const name = `qti-${family}-${letter}-${stepName}`;
  const properties = ownRules(sheet, name).flatMap((rule) =>
    rule.declarations.map((declaration) => declaration.property),
  );
  const allowed = new Set([
    ...longhands.map((suffix) => `${family}-${suffix}`),
    ...(shorthand === undefined ? [] : [`${family}-${shorthand}`]),
  ]);
  const covered = new Set(
    properties.flatMap((property) =>
      property === `${family}-${shorthand}`
        ? longhands
        : longhands.filter((suffix) => property === `${family}-${suffix}`),
    ),
  );
  const unchanged = properties.filter((property) => classValue(sheet, name, property) !== value);

  if (properties.length === 0) {
    return [`${name} has no rule`];
  }

  return [
    ...properties
      .filter((property) => !allowed.has(property))
      .map((property) => `${name} declares ${property}, not a logical side of ${letter}`),
    ...longhands
      .filter((suffix) => !covered.has(suffix))
      .map((suffix) => `${name} leaves ${family}-${suffix} unset`),
    ...unchanged.map((property) => `${name} gives ${property} another value than ${value}`),
  ];
};

describe("the shared vocabulary on the item body", () => {
  it("[I-19] the body owner holds every general-purpose class of Section 1.1 but the excluded ones", () => {
    assert.includeMembers([...styledClasses.body], [...earlierClasses]);
    assert.includeMembers([...styledClasses.body], [...generalClasses]);
    assert.lengthOf(
      generalClasses.filter((name) => name.startsWith("qti-list-style-type-")),
      45,
    );
    assert.lengthOf(
      generalClasses.filter((name) => name.startsWith("qti-layout-col")),
      12,
    );
    assert.lengthOf(
      generalClasses.filter((name) => name.startsWith("qti-layout-offset")),
      11,
    );
    assert.deepStrictEqual(
      styledClasses.body.filter(
        (name) => excludedClasses.has(name) || name.startsWith(textIndentPrefix),
      ),
      [],
    );
  });

  it("[I-20] the body owner holds every CSS utility family of Section 2 but the excluded ones", () => {
    const families = [
      ["display", displayClasses, 12],
      ["flex", flexClasses, 4],
      ["margin", marginClasses, 49],
      ["padding", paddingClasses, 42],
      ["height", heightClasses, 52],
      ["width", widthClasses, 63],
    ] as const;

    for (const [family, classes, count] of families) {
      assert.lengthOf(classes, count, family);
      assert.includeMembers([...styledClasses.body], [...classes], family);
    }

    assert.deepStrictEqual(
      styledClasses.body.filter((name) => name.startsWith(textIndentPrefix)),
      [],
    );
  });

  it("[I-19] [I-20] the table stays closed and behaviour-free", () => {
    assert.strictEqual(new Set(styledClasses.body).size, styledClasses.body.length);
    for (const name of styledClasses.body) {
      assert.match(name, /^qti-[a-z0-9-]+$/u, name);
    }

    assert.deepStrictEqual([...behaviourClasses.body], []);
  });

  it.effect(
    "[I-19] [I-20] every body class has a rule in the sheet, and the sheet names no qti-* class outside the table",
    () =>
      Effect.gen(function* closure() {
        const sheet = yield* sheetOf;
        const named = namedClasses(sheet);
        const owned = new Set(Object.values(styledClasses).flat());

        assert.isAbove(addedClasses.length, 0, "the body owner holds classes beyond the six");
        assert.deepStrictEqual(
          styledClasses.body.filter((name) => !named.has(name)),
          [],
        );
        assert.deepStrictEqual(
          [...named].filter((name) => name.startsWith("qti-") && !owned.has(name)),
          [],
        );
      }),
  );

  it.effect("[I-20] the margin and padding utilities use logical properties", () =>
    Effect.gen(function* logical() {
      const sheet = yield* sheetOf;
      const failures = sides.flatMap((side) => [
        ...marginSteps.flatMap((step) => spacingFailures(sheet, "margin", side, step)),
        ...paddingSteps.flatMap((step) => spacingFailures(sheet, "padding", side, step)),
      ]);

      assert.deepStrictEqual(failures, []);
    }),
  );

  it.effect("[I-20] the spacing steps 0 to 5 follow the listing's scale in rem", () =>
    Effect.gen(function* spacing() {
      const sheet = yield* sheetOf;

      assert.deepStrictEqual(
        [
          ...marginSteps.flatMap(([step, value]) =>
            mismatch(sheet, `qti-margin-${step}`, "margin", value),
          ),
          ...paddingSteps.flatMap(([step, value]) =>
            mismatch(sheet, `qti-padding-${step}`, "padding", value),
          ),
        ],
        [],
      );
      assert.deepStrictEqual(
        ["0", "1", "2", "3", "4", "5", "auto"].map((step) =>
          classValue(sheet, `qti-margin-${step}`, "margin"),
        ),
        ["0", "0.25rem", "0.5rem", "1rem", "1.5rem", "3rem", "auto"],
      );
      assert.deepStrictEqual(
        ["0", "1", "2", "3", "4", "5"].map((step) =>
          classValue(sheet, `qti-padding-${step}`, "padding"),
        ),
        ["0", "0.25rem", "0.5rem", "1rem", "1.5rem", "3rem"],
      );
    }),
  );

  it.effect(
    "[I-20] the height and width scales are a quarter rem per step, with the fractions as percentages",
    () =>
      Effect.gen(function* sizes() {
        const sheet = yield* sheetOf;

        assert.deepStrictEqual(
          [
            ...heightSteps.flatMap((step) =>
              mismatch(sheet, `qti-height-${step}`, "block-size", sizeValue(step)),
            ),
            ...widthSteps.flatMap((step) =>
              mismatch(sheet, `qti-width-${step}`, "inline-size", sizeValue(step)),
            ),
          ],
          [],
        );
        assert.deepStrictEqual(
          [
            classValue(sheet, "qti-height-4", "block-size"),
            classValue(sheet, "qti-width-12", "inline-size"),
            classValue(sheet, "qti-height-0p5", "block-size"),
            classValue(sheet, "qti-width-1-3", "inline-size"),
            classValue(sheet, "qti-width-11-12", "inline-size"),
            classValue(sheet, "qti-height-full", "block-size"),
            classValue(sheet, "qti-width-px", "inline-size"),
          ],
          ["1rem", "3rem", "0.125rem", "33.333333%", "91.666667%", "100%", "1px"],
        );
      }),
  );

  it.effect("[I-20] each display utility declares its display, and each flex utility its own", () =>
    Effect.gen(function* displaying() {
      const sheet = yield* sheetOf;

      assert.deepStrictEqual(
        [
          ...displays.flatMap((keyword) =>
            mismatch(sheet, `qti-display-${keyword}`, "display", keyword),
          ),
          ...flexes.flatMap(([name, property, value]) => mismatch(sheet, name, property, value)),
        ],
        [],
      );
    }),
  );

  it.effect("[I-19] the layout columns plus offsets never exceed the row", () =>
    Effect.gen(function* grid() {
      const sheet = yield* sheetOf;
      const failures: string[] = [
        ...mismatch(sheet, "qti-layout-row", "display", "flex"),
        ...mismatch(sheet, "qti-layout-row", "flex-wrap", "wrap"),
      ];

      for (const column of range(1, 12)) {
        const name = `qti-layout-col${column}`;
        failures.push(
          ...mismatch(sheet, name, "flex", `0 0 ${percent(column, 12)}`),
          ...mismatch(sheet, name, "max-inline-size", percent(column, 12)),
          ...mismatch(sheet, name, "box-sizing", "border-box"),
        );
      }

      for (const offset of range(1, 11)) {
        failures.push(
          ...mismatch(
            sheet,
            `qti-layout-offset${offset}`,
            "margin-inline-start",
            percent(offset, 12),
          ),
        );
      }

      for (const column of range(1, 11)) {
        for (const offset of range(1, 12 - column)) {
          const total =
            micro(classValue(sheet, `qti-layout-col${column}`, "max-inline-size")) +
            micro(classValue(sheet, `qti-layout-offset${offset}`, "margin-inline-start"));

          if (!(total <= 100 * 1e6)) {
            failures.push(`qti-layout-col${column} and offset${offset} add up to ${total / 1e6}%`);
          }
        }
      }

      assert.deepStrictEqual(failures, []);
    }),
  );

  it.effect("[I-19] the single-property classes declare what Section 1.1 says", () =>
    Effect.gen(function* single() {
      const sheet = yield* sheetOf;
      const clearfix = sheet.rules.filter((rule) =>
        rule.selectors.includes(".qti-float-clearfix::after"),
      );

      assert.deepStrictEqual(
        declaring.flatMap(([name, property, value]) => mismatch(sheet, name, property, value)),
        [],
      );
      assert.lengthOf(clearfix, 1, "the clearfix has one ::after rule");
      assert.deepStrictEqual(
        clearfix.flatMap((rule) =>
          rule.declarations.map((declaration) => [declaration.property, declaration.value]),
        ),
        [
          ["content", '""'],
          ["display", "table"],
          ["clear", "both"],
        ],
      );
    }),
  );

  it.effect("[I-19] a float or a layout column never changes reading order", () =>
    Effect.gen(function* reading() {
      const source = yield* fixtureText;
      const nodes = yield* renderedFixture();
      const elements = elementsOf(nodes);
      const floated = elements.filter((element) => classesOn(element).includes("qti-float-right"));
      const columns = elements.filter((element) =>
        classesOn(element).some((name) => name.startsWith("qti-layout-col")),
      );

      assert.isTrue(increasing(positionsOf(source, ordinals)), "the source writes them in order");
      assert.isAbove(floated.length, 0, "the fixture floats an element right");
      assert.isAbove(columns.length, 1, "the fixture has layout columns");
      assert.isTrue(
        floated.every((element) => textOf([element]).startsWith("Second:")),
        "the floated paragraph is the second block",
      );
      assert.isTrue(
        increasing(positionsOf(textOf(nodes), ordinals)),
        "the page reads them in the order the source writes them",
      );
    }),
  );

  it.effect(
    "[I-19] each kept list-style class declares its list-style-type, and no excluded one has a rule",
    () =>
      Effect.gen(function* lists() {
        const sheet = yield* sheetOf;

        assert.lengthOf(listStyles, 45);
        assert.deepStrictEqual(
          listStyles.flatMap((style) =>
            mismatch(sheet, `qti-list-style-type-${style}`, "list-style-type", style),
          ),
          [],
        );
        assert.deepStrictEqual(
          [...namedClasses(sheet)].filter(
            (name) => excludedClasses.has(name) || name.startsWith(textIndentPrefix),
          ),
          [],
        );
      }),
  );

  it.effect("[I-20] no utility declares a colour, a custom property or !important", () =>
    Effect.gen(function* plain() {
      const sheet = yield* sheetOf;
      const added = new Set(addedClasses);
      const rules = sheet.rules.filter((rule) =>
        rule.selectors.some((selector) =>
          compoundsDeep(selector).some((compound) =>
            compound.classes.some((name) => added.has(name)),
          ),
        ),
      );
      const colour =
        /#[\da-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark|var)\(|\b(?:transparent|currentcolor)\b/iu;

      assert.isAbove(addedClasses.length, 0, "the body owner holds classes beyond the six");
      assert.isAtLeast(rules.length, addedClasses.length, "each added class has a rule");
      assert.deepStrictEqual(
        rules
          .flatMap((rule) => rule.declarations)
          .filter(
            (declaration) =>
              declaration.important ||
              declaration.property.startsWith("--") ||
              declaration.property.includes("color") ||
              colour.test(declaration.value),
          )
          .map((declaration) => `${declaration.property}: ${declaration.value}`),
        [],
      );
    }),
  );

  it.effect(
    "[I-19] [I-20] the vocabulary fixture renders every class it carries unchanged on its element",
    () =>
      Effect.gen(function* carried() {
        const source = yield* fixtureText;
        const elements = elementsOf(yield* renderedFixture());
        const rendered = elements
          .filter((element) => classedTags.has(element.tag))
          .map(classAttribute)
          .filter((value) => value !== undefined);

        assert.deepStrictEqual(rendered, authoredClassValues(source));
        for (const tag of classedTags) {
          assert.isTrue(
            elements.some((element) => element.tag === tag && classesOn(element).length > 0),
            `a ${tag} carries a class`,
          );
        }
      }),
  );

  it.effect(
    "[I-19] [I-20] the vocabulary fixture carries a class of each family, every one in the body owner's table",
    () =>
      Effect.gen(function* families() {
        const used = authoredClassValues(yield* fixtureText).flatMap((value) =>
          value.split(/\s+/u),
        );
        const prefixes = [
          "qti-layout-row",
          "qti-layout-col",
          "qti-layout-offset",
          "qti-display-",
          "qti-flex-",
          "qti-margin-",
          "qti-padding-",
          "qti-height-",
          "qti-width-",
          "qti-align-",
          "qti-valign-",
          "qti-fullwidth",
          "qti-float-left",
          "qti-float-right",
          "qti-float-none",
          "qti-float-clear-",
          "qti-float-clearfix",
          "qti-writing-mode-",
          "qti-text-orientation-",
          "qti-text-combine-",
          "qti-list-style-type-",
          ...earlierClasses,
        ];

        assert.deepStrictEqual(
          used.filter((name) => !styledClasses.body.includes(name)),
          [],
          "the fixture uses only classes the body owner holds",
        );
        assert.deepStrictEqual(
          prefixes.filter((prefix) => !used.some((name) => name.startsWith(prefix))),
          [],
          "the fixture carries a class of each family",
        );
      }),
  );
});
