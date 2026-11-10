import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate } from "effect";
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
 * wraps content that inherits whatever the Root's style sets.
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
 * List the tags of the elements below a Root that carry a `style` attribute, in document order.
 *
 * @param root The Root.
 * @returns The tag of each styled element below it.
 */
const styledBelow = (root: Element): readonly string[] =>
  below(root)
    .filter((element) => Object.hasOwn(element.attrs, "style"))
    .map((element) => element.tag);

/**
 * Read the `style` attribute the Root carries when the item renders under display preferences.
 *
 * @param display The display preferences to set.
 * @returns The Root's `style` attribute, none when it carries none.
 */
const rootStyleOf = (display: Partial<DisplayPreferences>) =>
  Effect.map(htmlWith(supportsWith(display)), (html) => {
    const { style } = rootOf(html).attrs;

    return Option.liftPredicate(style, Predicate.isString);
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
      assert.isUndefined(rootOf(without).attrs["style"]);
      assert.isUndefined(rootOf(withOthers).attrs["style"]);
    }),
  );

  it.effect("[A-30a] a magnification factor is written on the Root as font-size", () =>
    Effect.gen(function* written() {
      const html = yield* htmlWith(supportsWith({ magnification: Option.some(2) }));

      assert.strictEqual(rootOf(html).attrs["style"], "font-size: 200%");
      assert.include(html, 'style="font-size: 200%"');

      for (const [factor, style] of [
        [1.5, "font-size: 150%"],
        [1.333, "font-size: 133.3%"],
        [4, "font-size: 400%"],
        [0.5, "font-size: 50%"],
      ] as const) {
        assert.deepStrictEqual(
          yield* rootStyleOf({ magnification: Option.some(factor) }),
          Option.some(style),
          `factor ${factor}`,
        );
      }
    }),
  );

  it.effect("[A-30a] a factor that is not a positive finite number is not written", () =>
    Effect.gen(function* refused() {
      const control = yield* rootStyleOf({ magnification: Option.some(2) });

      assert.deepStrictEqual(control, Option.some("font-size: 200%"));

      const without = yield* htmlWith();

      for (const factor of [0, -0, -2, Number.NaN, Number.POSITIVE_INFINITY, -Infinity]) {
        const html = yield* htmlWith(supportsWith({ magnification: Option.some(factor) }));

        assert.isUndefined(rootOf(html).attrs["style"], `factor ${factor}`);
        assert.strictEqual(html, without, `factor ${factor}`);
      }
    }),
  );

  it.effect(
    "[A-30a] a factor is written to at most three decimals of its percentage, with no exponent, and never as a zero size",
    () =>
      Effect.gen(function* formatted() {
        for (const [factor, style] of [
          [1.15, "font-size: 115%"],
          [1.23456, "font-size: 123.456%"],
          [1.2345678, "font-size: 123.457%"],
          [1.00001, "font-size: 100.001%"],
          [1e21, "font-size: 100000000000000000000000%"],
        ] as const) {
          assert.deepStrictEqual(
            yield* rootStyleOf({ magnification: Option.some(factor) }),
            Option.some(style),
            `factor ${factor}`,
          );
        }

        for (const factor of [1e-9, Number.MIN_VALUE, 4e-6, Number.MAX_VALUE]) {
          assert.isTrue(
            Option.isNone(yield* rootStyleOf({ magnification: Option.some(factor) })),
            `factor ${factor}`,
          );
        }
      }),
  );

  it.effect("[A-42a] text and background colours are written on the Root", () =>
    Effect.gen(function* written() {
      const html = yield* htmlWith(
        supportsWith(appearance({ backgroundColor: "#ffffcc", fontColor: "#1a1a1a" })),
      );

      assert.strictEqual(rootOf(html).attrs["style"], "color: #1a1a1a; background-color: #ffffcc");
      assert.include(html, 'style="color: #1a1a1a; background-color: #ffffcc"');
    }),
  );

  it.effect(
    "[A-42a] only the colour given is written, and a factor and colours combine in a fixed order",
    () =>
      Effect.gen(function* combined() {
        assert.deepStrictEqual(
          yield* rootStyleOf(appearance({ fontColor: "#1a1a1a" })),
          Option.some("color: #1a1a1a"),
        );
        assert.deepStrictEqual(
          yield* rootStyleOf(appearance({ backgroundColor: "#ffffcc" })),
          Option.some("background-color: #ffffcc"),
        );
        assert.deepStrictEqual(
          yield* rootStyleOf({
            magnification: Option.some(2),
            ...appearance({ backgroundColor: "#000000", fontColor: "#ffffff" }),
          }),
          Option.some("font-size: 200%; color: #ffffff; background-color: #000000"),
        );
        assert.deepStrictEqual(
          yield* rootStyleOf({
            magnification: Option.some(1.5),
            ...appearance({ backgroundColor: "#ffffcc" }),
          }),
          Option.some("font-size: 150%; background-color: #ffffcc"),
        );
      }),
  );

  it.effect("[A-42a] a colour that is not a hex colour is not written", () =>
    Effect.gen(function* refused() {
      for (const colour of ["#ABC", "#abcd", "#aabbccdd", "#AaBbCc", "#0a0"]) {
        assert.deepStrictEqual(
          yield* rootStyleOf(appearance({ fontColor: colour })),
          Option.some(`color: ${colour}`),
          `font colour ${colour}`,
        );
        assert.deepStrictEqual(
          yield* rootStyleOf(appearance({ backgroundColor: colour })),
          Option.some(`background-color: ${colour}`),
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
          assert.strictEqual(html, without, JSON.stringify(colour));
        }

        assert.deepStrictEqual(
          yield* rootStyleOf(appearance({ backgroundColor: "#ffffcc", fontColor: colour })),
          Option.some("background-color: #ffffcc"),
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
      const { style: _style, ...others } = preferred.attrs;

      for (const name of ["data-mode", "data-slot", "id", "lang"]) {
        assert.isString(bare.attrs[name], name);
      }

      assert.deepStrictEqual(others, bare.attrs);
      assert.strictEqual(preferred.tag, bare.tag);
    }),
  );

  it.effect("[A-30a] [A-42a] only the Root carries a style attribute", () =>
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
      assert.isUndefined(bare.attrs["style"]);
      assert.isString(preferred.attrs["style"]);
      assert.deepStrictEqual(styledBelow(preferred), styledBelow(bare));
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
      assert.strictEqual(
        root.attrs["style"],
        "font-size: 150%; color: #1a1a1a; background-color: #ffffcc",
      );
      assert.isTrue(roundTrips(root));
    }),
  );
});
