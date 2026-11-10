import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { magnificationSteps } from "#plate/content/root.ts";
import { acceptedItem, configure, noSupports, open, redact, render } from "#plate/index.ts";
import type { Accepted, DisplayPreferences, Element, Node, Supports } from "#plate/index.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * A complete QTI 3 item with a paragraph and one Choice, written fresh for this file: the Root
 * wraps content that a data attribute on the Root must not reach.
 */
const itemText = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="root-probe" title="Root probe" adaptive="false" time-dependent="false"
  xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>B</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value>
      <qti-value>0</qti-value>
    </qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    <p>Read this paragraph at the size and in the colours the candidate chose.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-prompt>Which is second?</qti-prompt>
      <qti-simple-choice identifier="A">First</qti-simple-choice>
      <qti-simple-choice identifier="B">Second</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

/**
 * Open the item as a host opens a document it read from storage, and take its accepted item.
 *
 * @returns The accepted item.
 */
const accepted: Effect.Effect<Accepted> = Effect.map(
  open("root-probe.xml", new TextEncoder().encode(itemText)),
  (verdict) =>
    Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`the document is ${verdict.verdict}, not accepted`),
    ),
);

/**
 * Construct supports that are {@link noSupports} with only the display preferences given changed.
 *
 * @param display The display preferences to set, each of the rest left as `noSupports` has it.
 * @returns The supports.
 */
const supportsWith = (display: Partial<DisplayPreferences>): Supports => ({
  ...noSupports,
  display: { ...noSupports.display, ...display },
});

/**
 * Construct a text appearance from the colours given, none for a colour left out.
 *
 * @param colours The font and background colours, each as the host passes it.
 * @param colours.backgroundColor The background colour, none when absent.
 * @param colours.fontColor The font colour, none when absent.
 * @returns The display preference holding that appearance.
 */
const appearance = (colours: {
  readonly backgroundColor?: string;
  readonly fontColor?: string;
}): Partial<DisplayPreferences> => ({
  textAppearance: Option.some({
    backgroundColor: Option.fromUndefinedOr(colours.backgroundColor),
    fontColor: Option.fromUndefinedOr(colours.fontColor),
  }),
});

/**
 * Render the item as a host does for one candidate, with the default configuration and the fixed
 * instance token.
 *
 * @param supports The supports the render takes, none to leave the option out.
 * @returns The page's HTML, or the refusal of the configuration or the render.
 */
const htmlWith = (supports?: Supports) =>
  Effect.gen(function* renderItem() {
    const configuration = yield* configure({});
    const options = supports === undefined ? {} : { supports };
    const rendered = yield* Effect.fromResult(
      render(redact(yield* accepted, undefined, configuration, options), configuration, {
        instance,
        ...options,
      }),
    );

    return rendered.html;
  });

/**
 * Parse one emitted HTML fragment into its single root element.
 *
 * @param html The fragment.
 * @returns Its root element.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);
  assert.lengthOf(rest, 0, "the fragment has one root");

  return root?.kind === "element" ? root : assert.fail("the fragment's root is not an element");
};

/**
 * List the elements below a node, in document order, the node's own element excluded.
 *
 * @param node The node.
 * @returns Every element below it.
 */
const below = (node: Node): readonly Element[] =>
  node.kind === "text"
    ? []
    : node.children.flatMap((child) => (child.kind === "text" ? [] : [child, ...below(child)]));

/**
 * The attributes the Root hook writes, in the order it writes them: the magnification step, then
 * the font colour and the background colour (issue m3e-09b).
 */
const hookNames: readonly string[] = [
  "data-magnification",
  "data-font-color",
  "data-background-color",
];

/**
 * The attribute names no element may carry for the hook's sake: its three data attributes, and
 * `style`, which a `style-src` policy without `'unsafe-inline'` drops.
 */
const refusedNames: readonly string[] = [...hookNames, "style"];

/**
 * List the tags of the elements below a Root that carry an attribute the hook writes or a `style`
 * attribute, in document order.
 *
 * @param root The Root.
 * @returns The tag of each such element below it.
 */
const hookedBelow = (root: Element): readonly string[] =>
  below(root)
    .filter((element) => refusedNames.some((name) => Object.hasOwn(element.attrs, name)))
    .map((element) => element.tag);

/**
 * Read the attributes the hook wrote on a Root, by name, in the order the HTML carries them.
 *
 * @param root The Root.
 * @returns Each of the hook's three attributes the Root carries, none for one it does not.
 */
const hookAttributesOf = (root: Element): Readonly<Record<string, string | true>> =>
  Object.fromEntries(Object.entries(root.attrs).filter(([name]) => hookNames.includes(name)));

/**
 * Read the hook's attributes the Root carries when the item renders under display preferences,
 * and hold that the Root carries no `style`.
 *
 * @param display The display preferences to set.
 * @returns The hook's attributes on the Root, none for one it does not write.
 */
const rootAttributesOf = (display: Partial<DisplayPreferences>) =>
  Effect.map(htmlWith(supportsWith(display)), (html) => {
    const root = rootOf(html);

    assert.isUndefined(root.attrs["style"], "the Root carries no style");

    return hookAttributesOf(root);
  });

describe("the item Root's hook (issue m3e-09)", () => {
  it.effect("[A-30a] [A-42a] with no display preference the Root and the HTML are unchanged", () =>
    Effect.gen(function* unchanged() {
      const without = yield* htmlWith();
      const withNone = yield* htmlWith(noSupports);
      const withOthers = yield* htmlWith(
        supportsWith({
          invertDisplayPolarity: true,
          keywordEmphasis: true,
          languageOfInterface: Option.some("es"),
          layoutSingleColumn: true,
          ...appearance({}),
        }),
      );

      assert.strictEqual(withNone, without);
      assert.strictEqual(withOthers, without);

      for (const name of refusedNames) {
        assert.isUndefined(rootOf(without).attrs[name], name);
        assert.isUndefined(rootOf(withOthers).attrs[name], name);
      }
    }),
  );

  it.effect("[A-30a] a magnification factor is written on the Root as its nearest step", () =>
    Effect.gen(function* written() {
      const html = yield* htmlWith(supportsWith({ magnification: Option.some(2) }));

      assert.strictEqual(rootOf(html).attrs["data-magnification"], "200");
      assert.include(html, 'data-magnification="200"');
      assert.isUndefined(rootOf(html).attrs["style"]);

      for (const [factor, step] of [
        [1.5, "150"],
        [1.333, "125"],
        [1.6, "150"],
        [3.2, "300"],
        [1.125, "125"],
        [4, "400"],
        [6, "400"],
      ] as const) {
        assert.deepStrictEqual(
          yield* rootAttributesOf({ magnification: Option.some(factor) }),
          { "data-magnification": step },
          `factor ${factor}`,
        );
      }
    }),
  );

  it.effect("[A-30a] a factor that is not above 1, or is not finite, writes nothing", () =>
    Effect.gen(function* refused() {
      const control = yield* rootAttributesOf({ magnification: Option.some(2) });

      assert.deepStrictEqual(control, { "data-magnification": "200" });

      const without = yield* htmlWith();

      for (const factor of [
        1,
        1.1,
        0.5,
        0,
        -0,
        -2,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
      ]) {
        const html = yield* htmlWith(supportsWith({ magnification: Option.some(factor) }));

        assert.isUndefined(rootOf(html).attrs["data-magnification"], `factor ${factor}`);
        assert.isUndefined(rootOf(html).attrs["style"], `factor ${factor}`);
        assert.strictEqual(html, without, `factor ${factor}`);
      }
    }),
  );

  it.effect(
    "[A-30a] the step is the nearest of the scale with a tie to the larger, whatever the factor's digits, and the top step for any factor above it",
    () =>
      Effect.gen(function* nearest() {
        for (const [factor, step] of [
          [1.15, "125"],
          [1.2345678, "125"],
          [1.37, "125"],
          [1.375, "150"],
          [1.625, "175"],
          [1.87, "175"],
          [1.875, "200"],
          [2.24, "200"],
          [2.25, "250"],
          [2.75, "300"],
          [3.25, "350"],
          [3.74, "350"],
          [3.75, "400"],
          [1e21, "400"],
          [Number.MAX_VALUE, "400"],
        ] as const) {
          assert.deepStrictEqual(
            yield* rootAttributesOf({ magnification: Option.some(factor) }),
            { "data-magnification": step },
            `factor ${factor}`,
          );
        }

        for (const factor of [1.00001, 1.1, 1.1249, 1e-9, Number.MIN_VALUE, 4e-6]) {
          assert.deepStrictEqual(
            yield* rootAttributesOf({ magnification: Option.some(factor) }),
            {},
            `factor ${factor}`,
          );
        }
      }),
  );

  it.effect(
    "[A-30a] each step of the scale is written for its own factor, and no value off the scale is ever written",
    () =>
      Effect.gen(function* scale() {
        assert.deepStrictEqual(magnificationSteps, [125, 150, 175, 200, 250, 300, 350, 400]);

        for (const step of magnificationSteps) {
          assert.deepStrictEqual(
            yield* rootAttributesOf({ magnification: Option.some(step / 100) }),
            { "data-magnification": String(step) },
            `step ${step}`,
          );
        }

        const written = new Set(magnificationSteps.map(String));

        for (let tenth = 0; tenth <= 50; tenth += 1) {
          const factor = 1 + tenth / 10;
          const { "data-magnification": step } = yield* rootAttributesOf({
            magnification: Option.some(factor),
          });

          assert.isTrue(step === undefined || written.has(String(step)), `factor ${factor}`);
        }
      }),
  );

  it.effect(
    "[A-30a] [A-42a] the Root carries no inline style under any supports, so a style-src policy drops nothing",
    () =>
      Effect.gen(function* unstyled() {
        const bare = yield* htmlWith();

        assert.notInclude(bare, "style=");

        const preferred = yield* htmlWith(
          supportsWith({
            invertDisplayPolarity: true,
            keywordEmphasis: true,
            layoutSingleColumn: true,
            magnification: Option.some(2),
            ...appearance({ backgroundColor: "#000000", fontColor: "#ffffff" }),
          }),
        );
        const root = rootOf(preferred);

        assert.notInclude(preferred, "style=");
        assert.isUndefined(root.attrs["style"]);
        assert.deepStrictEqual(
          below(root).filter((element) => Object.hasOwn(element.attrs, "style")),
          [],
        );
      }),
  );

  it.effect(
    "[A-42a] the text and background colours are written on the Root as data attributes",
    () =>
      Effect.gen(function* written() {
        const html = yield* htmlWith(
          supportsWith(appearance({ backgroundColor: "#ffffcc", fontColor: "#1a1a1a" })),
        );

        assert.strictEqual(rootOf(html).attrs["data-font-color"], "#1a1a1a");
        assert.strictEqual(rootOf(html).attrs["data-background-color"], "#ffffcc");
        assert.include(html, 'data-font-color="#1a1a1a" data-background-color="#ffffcc"');
        assert.isUndefined(rootOf(html).attrs["style"]);
        assert.isUndefined(rootOf(html).attrs["data-magnification"]);
      }),
  );

  it.effect(
    "[A-42a] only the colour given is written, and a factor and colours combine as three attributes in a fixed order",
    () =>
      Effect.gen(function* combined() {
        assert.deepStrictEqual(yield* rootAttributesOf(appearance({ fontColor: "#1a1a1a" })), {
          "data-font-color": "#1a1a1a",
        });
        assert.deepStrictEqual(
          yield* rootAttributesOf(appearance({ backgroundColor: "#ffffcc" })),
          {
            "data-background-color": "#ffffcc",
          },
        );

        const both = yield* rootAttributesOf({
          magnification: Option.some(2),
          ...appearance({ backgroundColor: "#000000", fontColor: "#ffffff" }),
        });

        assert.deepStrictEqual(both, {
          "data-background-color": "#000000",
          "data-font-color": "#ffffff",
          "data-magnification": "200",
        });
        assert.deepStrictEqual(Object.keys(both), hookNames);
        assert.deepStrictEqual(
          yield* rootAttributesOf({
            magnification: Option.some(1.5),
            ...appearance({ backgroundColor: "#ffffcc" }),
          }),
          { "data-background-color": "#ffffcc", "data-magnification": "150" },
        );
      }),
  );

  it.effect("[A-42a] a colour that is not a hex colour is not written, in any form", () =>
    Effect.gen(function* refused() {
      for (const colour of ["#ABC", "#abcd", "#aabbccdd", "#AaBbCc", "#0a0"]) {
        assert.deepStrictEqual(
          yield* rootAttributesOf(appearance({ fontColor: colour })),
          { "data-font-color": colour },
          `font colour ${colour}`,
        );
        assert.deepStrictEqual(
          yield* rootAttributesOf(appearance({ backgroundColor: colour })),
          { "data-background-color": colour },
          `background colour ${colour}`,
        );
      }

      const without = yield* htmlWith();

      for (const colour of [
        "red; background: url(x)",
        "#12345",
        "#gggggg",
        "rgb(0,0,0)",
        "red",
        "",
        "#",
        "#ab",
        "#abcde",
        "#abcdefa",
        "#aabbccddee",
        " #abc",
        "#abc ",
        "#abc\n",
        "#fff\n",
        "#abc;",
        '#abc" onload="x',
        "#ａｂｃ",
        "ｆ#abc",
      ]) {
        for (const attempt of [
          appearance({ fontColor: colour }),
          appearance({ backgroundColor: colour }),
        ]) {
          const html = yield* htmlWith(supportsWith(attempt));

          assert.isUndefined(rootOf(html).attrs["style"], JSON.stringify(colour));
          assert.isUndefined(rootOf(html).attrs["data-font-color"], JSON.stringify(colour));
          assert.isUndefined(rootOf(html).attrs["data-background-color"], JSON.stringify(colour));
          assert.strictEqual(html, without, JSON.stringify(colour));
        }

        assert.deepStrictEqual(
          yield* rootAttributesOf(appearance({ backgroundColor: "#ffffcc", fontColor: colour })),
          { "data-background-color": "#ffffcc" },
          `font colour ${JSON.stringify(colour)} beside a valid background`,
        );
      }

      const hostile = yield* htmlWith(
        supportsWith(appearance({ fontColor: "red; background: url(x)" })),
      );

      assert.notInclude(hostile, "url(x)");
      assert.notInclude(hostile, "red;");
    }),
  );

  it.effect("[A-30a] [A-42a] the Root's chrome attributes are never replaced", () =>
    Effect.gen(function* chrome() {
      const bare = rootOf(yield* htmlWith());
      const preferred = rootOf(
        yield* htmlWith(
          supportsWith({
            magnification: Option.some(2),
            ...appearance({ backgroundColor: "#000000", fontColor: "#ffffff" }),
          }),
        ),
      );
      const others = Object.fromEntries(
        Object.entries(preferred.attrs).filter(([name]) => !refusedNames.includes(name)),
      );

      for (const name of ["data-mode", "data-slot", "id", "lang"]) {
        assert.isString(bare.attrs[name], name);
      }

      assert.deepStrictEqual(others, bare.attrs);
      assert.strictEqual(preferred.tag, bare.tag);
    }),
  );

  it.effect("[A-30a] [A-42a] only the Root carries the hook's attributes", () =>
    Effect.gen(function* rootOnly() {
      const bare = rootOf(yield* htmlWith());
      const preferred = rootOf(
        yield* htmlWith(
          supportsWith({
            magnification: Option.some(2),
            ...appearance({ backgroundColor: "#000000", fontColor: "#ffffff" }),
          }),
        ),
      );

      assert.deepStrictEqual(hookAttributesOf(bare), {});
      assert.deepStrictEqual(Object.keys(hookAttributesOf(preferred)), hookNames);
      assert.deepStrictEqual(hookedBelow(bare), []);
      assert.deepStrictEqual(hookedBelow(preferred), []);
    }),
  );

  it.effect("[A-30a] [A-42a] the rendered item passes checkTree and round-trips", () =>
    Effect.gen(function* checked() {
      const html = yield* htmlWith(
        supportsWith({
          magnification: Option.some(1.5),
          ...appearance({ backgroundColor: "#ffffcc", fontColor: "#1a1a1a" }),
        }),
      );
      const root = rootOf(html);

      assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
      assert.deepStrictEqual(hookAttributesOf(root), {
        "data-background-color": "#ffffcc",
        "data-font-color": "#1a1a1a",
        "data-magnification": "150",
      });
      assert.isTrue(roundTrips(root));
    }),
  );
});
