/**
 * The gate probe W0-TAILWIND: Tailwind CSS and plate's sheet compile together in the in-page run.
 *
 * The reference app builds its stylesheet the shadcn way, `@import "tailwindcss"` for the
 * utilities and `@import "@qti-pie/plate/styles.css"` for plate's sheet, and no in-page test has
 * loaded a sheet Tailwind compiled: the others inject `src/styles.css` as text. This file links
 * `src/test/tailwind.css`, which holds those two imports, so the in-page server compiles it through
 * the Vite CSS pipeline that `vite.browser.config.ts` registers `@tailwindcss/vite` in, and reads
 * the result back by computed style. It observes three things: that Tailwind compiles in the
 * in-page project; that a package's import of its own exported sheet by name resolves inside that
 * compile; and that the two sheets apply together on one page.
 *
 * It links the sheet with a `link` element, not with `import "./tailwind.css"`: the root
 * `tsconfig.json` sets `noUncheckedSideEffectImports` and the package declares no `*.css` module,
 * so `tsc` refuses a side-effect import of a stylesheet.
 *
 * Tailwind finds the class names it compiles by scanning the project's files, so the literal class
 * strings below (`p-4`, `mt-2` and `p-0`) are what the compiled sheet holds.
 *
 * The last row pins a limit, not a goal: Tailwind puts its utilities in `@layer utilities` and
 * plate's sheet is unlayered, and an unlayered declaration beats a layered one whatever its
 * specificity, so a plate rule wins over a utility on the same property. The cascade-layer policy
 * is an open ruling (issue #284).
 *
 * It runs only inside the engine's page, under Vitest's browser mode in the in-page project of
 * `vite.browser.config.ts` (`test:browser`), and never in Node. Every case sits under a `describe`
 * named by the engine (`server.browser`), as in `src/test/page.dom.test.ts`, and every title
 * carries the tag `[W0-TAILWIND]`.
 *
 * @see https://tailwindcss.com/docs/detecting-classes-in-source-files
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { server } from "vite-plus/test/browser/context";

/**
 * Where the in-page server serves the sheet under test, relative to the package, the in-page
 * project's root.
 */
const sheetHref = "/src/test/tailwind.css";

/**
 * The failure of the linked sheet not loading: the `link` element fired `error` instead of `load`.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
class SheetNotLoaded extends Schema.TaggedError<SheetNotLoaded>()("SheetNotLoaded", {
  event: Schema.String,
  href: Schema.String,
}) {
  /**
   * The sheet, the event the `link` fired, and where to look.
   */
  override get message(): string {
    return `The stylesheet ${this.href} did not load: its link element fired an "${this.event}" event. Check that the file exists and that the in-page server compiled it; the server's log names the CSS error. Then run the browser tests again.`;
  }
}

/**
 * Append a `link` to the sheet to the page's `head`, wait for its `load` event, and remove it when
 * the caller's scope closes.
 *
 * The listeners are in place before the `link` joins the document, so no event is missed. A `link`
 * that fires `error` is removed before the failure, because a failed acquire runs no release.
 *
 * @returns The loaded `link`; {@link SheetNotLoaded} when it fires `error`.
 */
const sheet = Effect.acquireRelease(
  Effect.callback<HTMLLinkElement, SheetNotLoaded>((resume) => {
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = sheetHref;
    link.addEventListener(
      "load",
      () => {
        resume(Effect.succeed(link));
      },
      { once: true },
    );
    link.addEventListener(
      "error",
      (event) => {
        link.remove();
        resume(Effect.fail(new SheetNotLoaded({ event: event.type, href: sheetHref })));
      },
      { once: true },
    );
    document.head.append(link);
  }),
  (link) =>
    Effect.sync(() => {
      link.remove();
    }),
);

/**
 * Append an element with the given attributes to the page's `body`, and remove it when the
 * caller's scope closes.
 *
 * @param tag The element's tag name.
 * @param attributes The element's attributes, by name.
 * @returns The element.
 */
const element = (tag: keyof HTMLElementTagNameMap, attributes: Readonly<Record<string, string>>) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const made = document.createElement(tag);

      for (const [name, value] of Object.entries(attributes)) {
        made.setAttribute(name, value);
      }

      document.body.append(made);

      return made;
    }),
    (made) =>
      Effect.sync(() => {
        made.remove();
      }),
  );

/**
 * Read one property of an element's computed style, as the engine resolves it.
 *
 * @param target The element.
 * @param property The property's CSS name.
 * @returns The resolved value.
 */
const computed = (target: Element, property: string): string =>
  getComputedStyle(target).getPropertyValue(property);

describe(server.browser, () => {
  it.effect("[W0-TAILWIND] the sheet loads: the link's load event fires", () =>
    Effect.gen(function* sheetLoads() {
      const link = yield* sheet;

      assert.isTrue(link.isConnected);
      assert.isNotNull(link.sheet);
    }),
  );

  it.effect("[W0-TAILWIND] a Tailwind utility applies in the page", () =>
    Effect.gen(function* utilityApplies() {
      yield* sheet;

      const box = yield* element("div", { class: "p-4" });

      assert.strictEqual(computed(box, "padding"), "16px");
    }),
  );

  it.effect("[W0-TAILWIND] Tailwind's base layer applies", () =>
    Effect.gen(function* baseApplies() {
      yield* sheet;

      const heading = yield* element("h1", {});

      assert.strictEqual(computed(heading, "margin-top"), "0px");
      assert.strictEqual(computed(heading, "font-size"), computed(document.body, "font-size"));
    }),
  );

  it.effect("[W0-TAILWIND] plate's rule from the imported package sheet applies", () =>
    Effect.gen(function* plateRuleApplies() {
      yield* sheet;

      const item = yield* element("div", { "data-slot": "item" });

      assert.strictEqual(computed(item, "overflow"), "auto");
      assert.strictEqual(computed(item, "padding"), "3px");
    }),
  );

  it.effect("[W0-TAILWIND] a plate vocabulary class and a utility apply on one element", () =>
    Effect.gen(function* bothApply() {
      yield* sheet;

      const well = yield* element("div", { class: "qti-well mt-2" });

      assert.strictEqual(computed(well, "padding"), "12px 16px");
      assert.strictEqual(computed(well, "margin-top"), "8px");
      assert.strictEqual(computed(well, "border-radius"), "10px");
    }),
  );

  it.effect(
    "[W0-TAILWIND] a plate rule wins over a utility while the sheet is unlayered (#284)",
    () =>
      Effect.gen(function* plateWinsUnlayered() {
        yield* sheet;

        const item = yield* element("div", { class: "p-0", "data-slot": "item" });

        // This assertion flips to "0px" once the sheet or the import is layered (#284).
        assert.strictEqual(computed(item, "padding"), "3px");
      }),
  );
});
