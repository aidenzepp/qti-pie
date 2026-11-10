/**
 * The item Root's hook in each engine's page: the magnification factor and the chosen colours the
 * hook writes as the Root's inline style are the Root's computed font size and colours in Chromium
 * and WebKit, and the item's content inherits them. The page loads no stylesheet and runs no
 * plate script, so what it measures is what the Root's `style` attribute alone does.
 *
 * It runs only inside the engine's page, under the in-page project of `vite.browser.config.ts`
 * (`test:browser`), and never in Node. Every case sits under a `describe` named by the engine
 * (`server.browser`), as in `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { server } from "vite-plus/test/browser/context";
import { acceptedItem, configure, noSupports, open, redact, render } from "#plate/index.ts";
import type { Accepted, DisplayPreferences, Supports } from "#plate/index.ts";

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
 * Render the item as a host does for one candidate, with the default configuration, and mount it
 * in a fresh container at the end of the page's body until the scope closes.
 *
 * @param supports The supports the render takes.
 * @returns The live computed styles of the mounted Root and of the item's paragraph, valid while
 *   the scope is open.
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
      const root = container.querySelector("qti-assessment-item");
      const paragraph = container.querySelector("p");

      if (root === null || paragraph === null) {
        return assert.fail("the mounted item has no Root or no paragraph");
      }

      return {
        paragraph: getComputedStyle(paragraph),
        root: getComputedStyle(root),
      };
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
    "[A-30a] in the page a factor of 2 doubles the Root's computed font size, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* doubled() {
          const bare = yield* mounted(noSupports);
          const magnified = yield* mounted(supportsWith({ magnification: Option.some(2) }));
          const base = pixels(bare.root);

          assert.isAbove(base, 0);
          assert.strictEqual(pixels(magnified.root), 2 * base);
          assert.strictEqual(pixels(bare.paragraph), base);
          assert.strictEqual(pixels(magnified.paragraph), 2 * base);
        }),
      ),
  );

  it.effect(
    "[A-30a] in the page a factor of 4 and a factor of 1.5 scale the Root's computed font size by that factor, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* scaled() {
          const bare = yield* mounted(noSupports);
          const base = pixels(bare.root);

          for (const factor of [1.5, 4]) {
            const magnified = yield* mounted(supportsWith({ magnification: Option.some(factor) }));

            assert.strictEqual(pixels(magnified.root), factor * base, `factor ${factor}`);
            assert.strictEqual(pixels(magnified.paragraph), factor * base, `factor ${factor}`);
          }

          const refused = yield* mounted(supportsWith({ magnification: Option.some(0) }));

          assert.strictEqual(pixels(refused.root), base);
        }),
      ),
  );

  it.effect(
    "[A-30a] [A-42a] in the page the chosen colours are the Root's computed colours, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* coloured() {
          const bare = yield* mounted(noSupports);

          for (const [fontColor, backgroundColor, color, background] of [
            ["#1a1a1a", "#ffffcc", "rgb(26, 26, 26)", "rgb(255, 255, 204)"],
            ["#abc", "#0f0", "rgb(170, 187, 204)", "rgb(0, 255, 0)"],
            ["#abcf", "#00ff00ff", "rgb(170, 187, 204)", "rgb(0, 255, 0)"],
          ] as const) {
            const chosen = yield* mounted(supportsWith(appearance({ backgroundColor, fontColor })));

            assert.strictEqual(chosen.root.color, color, fontColor);
            assert.strictEqual(chosen.root.backgroundColor, background, backgroundColor);
            assert.strictEqual(chosen.paragraph.color, color, `${fontColor} inherited`);
          }

          assert.notStrictEqual(bare.root.color, "rgb(26, 26, 26)");
          assert.notStrictEqual(bare.root.backgroundColor, "rgb(255, 255, 204)");
        }),
      ),
  );

  it.effect(
    "[A-42a] in the page a colour that is not a hex colour leaves the Root's computed colours as they are, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* refused() {
          const bare = yield* mounted(noSupports);
          const control = yield* mounted(supportsWith(appearance({ fontColor: "#1a1a1a" })));

          assert.strictEqual(control.root.color, "rgb(26, 26, 26)");
          assert.notStrictEqual(control.root.color, bare.root.color);

          for (const colour of ["red", "rgb(255, 0, 0)", "#12345", "red; background: url(x)"]) {
            const chosen = yield* mounted(
              supportsWith(appearance({ backgroundColor: colour, fontColor: colour })),
            );

            assert.strictEqual(chosen.root.color, bare.root.color, colour);
            assert.strictEqual(chosen.root.backgroundColor, bare.root.backgroundColor, colour);
          }
        }),
      ),
  );

  it.effect(
    "[A-30a] [A-42a] in the page a factor and colours together set the font size and both colours, in both engines",
    () =>
      Effect.scoped(
        Effect.gen(function* together() {
          const bare = yield* mounted(noSupports);
          const chosen = yield* mounted(
            supportsWith({
              magnification: Option.some(2),
              ...appearance({ backgroundColor: "#000000", fontColor: "#ffffff" }),
            }),
          );

          assert.strictEqual(pixels(chosen.root), 2 * pixels(bare.root));
          assert.strictEqual(chosen.root.color, "rgb(255, 255, 255)");
          assert.strictEqual(chosen.root.backgroundColor, "rgb(0, 0, 0)");
        }),
      ),
  );
});
