/**
 * The registry item's sheet in a Tailwind v4 host (`src/registry/qti-pie.css`, issues m3g-05b and
 * #284): plate's rules sit in the `components` cascade layer, below Tailwind's `utilities`, so a
 * utility on a plate marker wins over plate's own declaration of the same property.
 *
 * A shadcn host's global stylesheet imports Tailwind and then the installed item's sheet.
 * `src/registry/qti-pie.host.css` holds those two imports, and this file links it, so the in-page
 * server compiles it through the Vite CSS pipeline that `vite.browser.config.ts` registers
 * `@tailwindcss/vite` in, and reads the result back by computed style, as
 * `src/test/tailwind.dom.test.tsx` does for plate's sheet imported directly. That file pins the
 * unlayered import's limit, where a plate rule beats a utility; this one proves the layered import
 * lifts it.
 *
 * The proof uses plain utilities, `p-0` and `bg-transparent`, on plate's markers, never the
 * wrapper's token classes: Tailwind compiles a token utility only for a theme that defines the
 * token, and the host sheet models none. Tailwind compiles a utility only for a class name written
 * out whole in a file it scans, so the literal class strings below are what the compiled sheet
 * holds.
 *
 * It links the sheet with a `link` element, not with `import "./qti-pie.host.css"`: the root
 * `tsconfig.json` sets `noUncheckedSideEffectImports` and the package declares no `*.css` module,
 * so `tsc` refuses a side-effect import of a stylesheet.
 *
 * It runs only inside the engine's page, under Vitest's browser mode in the in-page project of
 * `vite.browser.config.ts` (`test:browser`), and never in Node. Every case sits under a `describe`
 * named by the engine (`server.browser`), as in `src/test/page.dom.test.ts`, and every title
 * carries the tag `[m3g-05b]`.
 *
 * @see https://tailwindcss.com/docs/detecting-classes-in-source-files
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/@layer
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { server } from "vite-plus/test/browser/context";

/**
 * Where the in-page server serves the host sheet under test, relative to the package, the in-page
 * project's root.
 */
const sheetHref = "/src/registry/qti-pie.host.css";

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
  it.effect(
    "[m3g-05b] the host sheet loads and plate's rules apply through the layered import",
    () =>
      Effect.gen(function* plateRulesApply() {
        const link = yield* sheet;

        assert.isTrue(link.isConnected);
        assert.isNotNull(link.sheet);

        const item = yield* element("div", { "data-slot": "item" });

        assert.strictEqual(computed(item, "overflow"), "auto");
        assert.strictEqual(computed(item, "padding"), "3px");
      }),
  );

  it.effect("[m3g-05b] a utility on the item root wins over plate's padding: p-0 gives 0px", () =>
    Effect.gen(function* utilityWinsOnItem() {
      yield* sheet;

      const item = yield* element("div", { class: "p-0", "data-slot": "item" });

      assert.strictEqual(computed(item, "padding"), "0px");
    }),
  );

  it.effect(
    "[m3g-05b] a utility on the status region wins over plate's surface: bg-transparent gives a transparent background",
    () =>
      Effect.gen(function* utilityWinsOnStatus() {
        yield* sheet;

        const status = yield* element("div", {
          class: "bg-transparent",
          "data-slot": "item-status",
        });

        assert.strictEqual(computed(status, "background-color"), "rgba(0, 0, 0, 0)");
      }),
  );
});
