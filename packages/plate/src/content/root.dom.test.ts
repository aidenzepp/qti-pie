/**
 * The item Root's hook in each engine's page (issue m3e-09, moved to data attributes by issue
 * m3e-09b): the magnification step the hook writes as `data-magnification` is the Root's computed
 * font size in Chromium and WebKit once plate's own sheet is adopted, and the item's content
 * inherits it; the colours the hook writes as `data-font-color` and `data-background-color` are
 * the Root's computed colours only when a host rule or a host script applies them, because plate's
 * sheet never sets a colour from them.
 *
 * Each case proves one surface. The step cases adopt plate's sheet, fetched from the dev server the
 * page runs under, as a constructed sheet for the scope of the test; the colour cases adopt none of
 * it and add a host rule of their own in a constructed sheet, or set `element.style` as a host
 * script does. The page runs no plate script, and a sheet or a style a case adopts leaves the page
 * when the case ends.
 *
 * It runs only inside the engine's page, under the in-page project of `vite.browser.config.ts`
 * (`test:browser`), and never in Node. Every case sits under a `describe` named by the engine
 * (`server.browser`), as in `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { server } from "vite-plus/test/browser/context";
import { magnificationSteps } from "#plate/content/root.ts";
import { acceptedItem, configure, noSupports, open, redact, render } from "#plate/index.ts";
import type { Accepted, DisplayPreferences, Supports } from "#plate/index.ts";

/**
 * A complete QTI 3 item with a paragraph and one Choice, written fresh for this file: the Root
 * wraps content that inherits whatever the Root's font size and colours are.
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
 * Render the item as a host does for one candidate, with the default configuration, and mount it
 * in a fresh container at the end of the page's body until the scope closes.
 *
 * @param supports The supports the render takes.
 * @returns The mounted Root element, and the live computed styles of the Root and of the item's
 *   paragraph, valid while the scope is open.
 */
const mounted = (supports: Supports) =>
  Effect.acquireRelease(
    Effect.gen(function* mount() {
      const configuration = yield* configure({});
      const { html } = yield* Effect.fromResult(
        render(redact(yield* accepted, undefined, configuration, { supports }), configuration, {
          instance: "q1",
          supports,
        }),
      );
      const container = document.createElement("div");

      container.innerHTML = html;
      document.body.append(container);

      return container;
    }),
    (container) =>
      Effect.sync(() => {
        container.remove();
      }),
  ).pipe(
    Effect.map((container) => {
      const root = container.querySelector<HTMLElement>("qti-assessment-item");
      const paragraph = container.querySelector("p");

      if (root === null || paragraph === null) {
        return assert.fail("the mounted item has no Root or no paragraph");
      }

      return {
        element: root,
        paragraph: getComputedStyle(paragraph),
        root: getComputedStyle(root),
      };
    }),
  );

/**
 * Fetch the text of plate's own sheet from the dev server the page runs under, as the stylesheet a
 * host links, and hold that it is the sheet and not a module that wraps it.
 *
 * @returns The sheet's CSS text.
 */
const plateSheet = Effect.tryPromise(() =>
  fetch(new URL("../styles.css", import.meta.url), { headers: { Accept: "text/css" } }).then(
    (response) => response.text(),
  ),
).pipe(
  Effect.tap((css) =>
    Effect.sync(() => {
      assert.include(css, ':where([data-slot="item"])', "the fetched text is plate's sheet");
    }),
  ),
);

/**
 * Adopt a constructed stylesheet on the page, as a host's own sheet reaches it, until the scope
 * closes.
 *
 * @param css The sheet's CSS text.
 * @returns Nothing; the sheet applies to the page while the scope is open.
 */
const adopted = (css: string) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const sheet = new CSSStyleSheet();

      sheet.replaceSync(css);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

      return sheet;
    }),
    (sheet) =>
      Effect.sync(() => {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter((held) => held !== sheet);
      }),
  );

/**
 * Read a computed `font-size` in pixels.
 *
 * @param style A computed style.
 * @returns The font size in pixels.
 */
const pixels = (style: CSSStyleDeclaration): number => Number(style.fontSize.replace(/px$/u, ""));

describe(server.browser, () => {
  it.effect(
    "[A-30a] in the page, with plate's sheet, each step is the Root's computed font size, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* stepped() {
          yield* adopted(yield* plateSheet);

          const bare = yield* mounted(noSupports);
          const base = pixels(bare.root);

          assert.isAbove(base, 0);
          assert.strictEqual(pixels(bare.paragraph), base);

          for (const step of magnificationSteps) {
            const magnified = yield* mounted(
              supportsWith({ magnification: Option.some(step / 100) }),
            );

            assert.strictEqual(
              magnified.element.dataset["magnification"],
              String(step),
              `step ${step}`,
            );
            assert.isNull(magnified.element.getAttribute("style"), `step ${step}`);
            assert.strictEqual(pixels(magnified.root), (step / 100) * base, `step ${step}`);
            assert.strictEqual(pixels(magnified.paragraph), (step / 100) * base, `step ${step}`);
          }

          const unmagnified = yield* mounted(supportsWith({ magnification: Option.some(1.1) }));

          assert.strictEqual(pixels(unmagnified.root), base);
          assert.strictEqual(pixels(unmagnified.paragraph), base);
        }),
      ),
  );

  it.effect(
    "[A-30a] in the page, with plate's sheet, a factor takes its nearest step and a factor that is not above 1 leaves the Root's computed font size as it is, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* scaled() {
          yield* adopted(yield* plateSheet);

          const bare = yield* mounted(noSupports);
          const base = pixels(bare.root);

          for (const [factor, step] of [
            [1.5, 150],
            [1.333, 125],
            [4, 400],
            [6, 400],
          ] as const) {
            const magnified = yield* mounted(supportsWith({ magnification: Option.some(factor) }));

            assert.strictEqual(pixels(magnified.root), (step / 100) * base, `factor ${factor}`);
            assert.strictEqual(
              pixels(magnified.paragraph),
              (step / 100) * base,
              `factor ${factor}`,
            );
          }

          for (const factor of [1, 0.5, 0, -2, Number.NaN, Number.POSITIVE_INFINITY]) {
            const refused = yield* mounted(supportsWith({ magnification: Option.some(factor) }));

            assert.strictEqual(pixels(refused.root), base, `factor ${factor}`);
            assert.strictEqual(pixels(refused.paragraph), base, `factor ${factor}`);
          }
        }),
      ),
  );

  it.effect(
    "[A-30a] in the page the step does nothing without plate's sheet: the Root's computed font size is the page's, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* unlinked() {
          const bare = yield* mounted(noSupports);
          const magnified = yield* mounted(supportsWith({ magnification: Option.some(2) }));

          assert.strictEqual(magnified.element.dataset["magnification"], "200");
          assert.strictEqual(pixels(magnified.root), pixels(bare.root));
        }),
      ),
  );

  it.effect(
    "[A-30a] [A-42a] in the page plate applies no colour: the Root's computed colours are the page's until a host rule keys on the attributes, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* hosted() {
          const bare = yield* mounted(noSupports);
          const pageColor = bare.root.color;
          const pageBackground = bare.root.backgroundColor;

          for (const [fontColor, backgroundColor, color, background] of [
            ["#1a1a1a", "#ffffcc", "rgb(26, 26, 26)", "rgb(255, 255, 204)"],
            ["#abc", "#0f0", "rgb(170, 187, 204)", "rgb(0, 255, 0)"],
            ["#abcf", "#00ff00ff", "rgb(170, 187, 204)", "rgb(0, 255, 0)"],
          ] as const) {
            const chosen = yield* mounted(supportsWith(appearance({ backgroundColor, fontColor })));

            assert.strictEqual(chosen.root.color, pageColor, `${fontColor} before the host rule`);
            assert.strictEqual(
              chosen.root.backgroundColor,
              pageBackground,
              `${backgroundColor} before the host rule`,
            );
            assert.notStrictEqual(pageColor, color, fontColor);
            assert.notStrictEqual(pageBackground, background, backgroundColor);

            yield* Effect.scoped(
              Effect.gen(function* rule() {
                yield* adopted(
                  `qti-assessment-item[data-font-color="${fontColor}"] { color: ${fontColor}; }
                   qti-assessment-item[data-background-color="${backgroundColor}"] { background-color: ${backgroundColor}; }`,
                );

                assert.strictEqual(chosen.root.color, color, fontColor);
                assert.strictEqual(chosen.root.backgroundColor, background, backgroundColor);
                assert.strictEqual(chosen.paragraph.color, color, `${fontColor} inherited`);
                assert.strictEqual(
                  bare.root.color,
                  pageColor,
                  "an item with no colour keeps the page's",
                );
              }),
            );

            assert.strictEqual(chosen.root.color, pageColor, `${fontColor} after the host rule`);
            assert.strictEqual(chosen.root.backgroundColor, pageBackground, backgroundColor);
          }
        }),
      ),
  );

  it.effect(
    "[A-42a] in the page a host script applies the colours from the two attributes through element.style, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* scripted() {
          const bare = yield* mounted(noSupports);
          const chosen = yield* mounted(
            supportsWith(appearance({ backgroundColor: "#ffffcc", fontColor: "#1a1a1a" })),
          );

          assert.strictEqual(chosen.root.color, bare.root.color);

          chosen.element.style.color = chosen.element.dataset["fontColor"] ?? "";
          chosen.element.style.backgroundColor = chosen.element.dataset["backgroundColor"] ?? "";

          assert.strictEqual(chosen.root.color, "rgb(26, 26, 26)");
          assert.strictEqual(chosen.root.backgroundColor, "rgb(255, 255, 204)");
          assert.strictEqual(chosen.paragraph.color, "rgb(26, 26, 26)");
        }),
      ),
  );

  it.effect(
    "[A-42a] in the page a colour that is not a hex colour leaves the Root's computed colours as they are under a host rule keyed on the attributes, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* refused() {
          yield* adopted(
            `qti-assessment-item[data-font-color] { color: #1a1a1a; }
             qti-assessment-item[data-background-color] { background-color: #ffffcc; }`,
          );

          const bare = yield* mounted(noSupports);
          const control = yield* mounted(
            supportsWith(appearance({ backgroundColor: "#ffffcc", fontColor: "#1a1a1a" })),
          );

          assert.strictEqual(control.element.dataset["fontColor"], "#1a1a1a");
          assert.strictEqual(control.element.dataset["backgroundColor"], "#ffffcc");
          assert.isNull(control.element.getAttribute("style"));
          assert.strictEqual(control.root.color, "rgb(26, 26, 26)");
          assert.strictEqual(control.root.backgroundColor, "rgb(255, 255, 204)");
          assert.notStrictEqual(control.root.color, bare.root.color);
          assert.notStrictEqual(control.root.backgroundColor, bare.root.backgroundColor);

          for (const colour of ["red", "rgb(255, 0, 0)", "#12345", "red; background: url(x)"]) {
            const chosen = yield* mounted(
              supportsWith(appearance({ backgroundColor: colour, fontColor: colour })),
            );

            assert.isFalse(Object.hasOwn(chosen.element.dataset, "fontColor"), colour);
            assert.isFalse(Object.hasOwn(chosen.element.dataset, "backgroundColor"), colour);
            assert.strictEqual(chosen.root.color, bare.root.color, colour);
            assert.strictEqual(chosen.root.backgroundColor, bare.root.backgroundColor, colour);
          }
        }),
      ),
  );

  it.effect(
    "[A-30a] [A-42a] in the page a factor and colours together: plate's sheet sets the font size and a host rule sets both colours, each from its own attribute, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* together() {
          const bare = yield* mounted(noSupports);

          yield* adopted(yield* plateSheet);
          yield* adopted(
            `qti-assessment-item[data-font-color="#ffffff"] { color: #ffffff; }
             qti-assessment-item[data-background-color="#000000"] { background-color: #000000; }`,
          );

          const chosen = yield* mounted(
            supportsWith({
              magnification: Option.some(2),
              ...appearance({ backgroundColor: "#000000", fontColor: "#ffffff" }),
            }),
          );

          assert.strictEqual(chosen.element.dataset["magnification"], "200");
          assert.strictEqual(chosen.element.dataset["fontColor"], "#ffffff");
          assert.strictEqual(chosen.element.dataset["backgroundColor"], "#000000");
          assert.isNull(chosen.element.getAttribute("style"));
          assert.strictEqual(pixels(chosen.root), 2 * pixels(bare.root));
          assert.strictEqual(chosen.root.color, "rgb(255, 255, 255)");
          assert.strictEqual(chosen.root.backgroundColor, "rgb(0, 0, 0)");
        }),
      ),
  );
});
