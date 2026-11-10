import { assert } from "@effect/vitest";
import { Effect, Schema } from "effect";
import type { Page } from "playwright-core";
import { pageHeaders } from "#plate/dev/frame.ts";
import {
  bootModule,
  readRuntimeModule,
  runtimeModules,
  runtimeUrl,
} from "#plate/dev/runtime-assets.ts";
import { eachEngine, Playground, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import { itemTarget } from "#plate/test/playground-page.ts";

/**
 * The item every case opens: BG007's True/False Choice, a page the playground serves in full whose
 * Choice has no runtime kind, so an upgrade of it attaches nothing.
 */
const item = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * Today's page policy with `script-src 'self'` in place of `script-src 'none'`, written out in full
 * so the cases do not derive their expectation from the code they check.
 */
const policyWithRuntime =
  "default-src 'none'; style-src 'self'; img-src 'self' https: http:; media-src 'self' https: http:; object-src 'self'; frame-src 'self'; script-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";

/**
 * The script the page runs before its own: it records each `securitypolicyviolation` event the
 * document receives, as `<violated directive> <blocked URI>`, under `window.__plateViolations`.
 */
const recordViolations = `
  window.__plateViolations = [];
  document.addEventListener("securitypolicyviolation", (event) => {
    window.__plateViolations.push(event.violatedDirective + " " + event.blockedURI);
  });
`;

/**
 * What a page logged and loaded while it opened: its console errors and uncaught errors, and the
 * status of each response under `/runtime/`, by path.
 */
interface Watched {
  readonly errors: string[];
  readonly runtime: Map<string, number>;
}

/**
 * Start recording a page's console errors, uncaught errors and `/runtime/` responses, and its
 * `securitypolicyviolation` events.
 *
 * @param page The page, before it navigates.
 * @returns What the page has logged and loaded so far, kept up to date as it loads.
 */
const watch = Effect.fn("watch")(function* watch(page: Page): Effect.fn.Return<Watched> {
  const watched: Watched = { errors: [], runtime: new Map() };

  page.on("console", (message) => {
    if (message.type() === "error") {
      watched.errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    watched.errors.push(String(error));
  });
  page.on("response", (response) => {
    const { pathname } = new URL(response.url());

    if (pathname.startsWith("/runtime/")) {
      watched.runtime.set(pathname, response.status());
    }
  });
  yield* Effect.promise(() => page.addInitScript(recordViolations));

  return watched;
});

/**
 * Open the item page in a page and wait for the document to finish loading.
 *
 * @param page The page.
 * @returns The page's response status and its content-security policy.
 */
const open = Effect.fn("open")(function* open(page: Page) {
  const { origin } = yield* Playground;
  const response = yield* Effect.promise(() => page.goto(`${origin}${itemTarget(item)}`));

  assert.isNotNull(response);

  return {
    policy: response.headers()["content-security-policy"],
    status: response.status(),
  };
});

/**
 * Rewrite the HTML of the item page as the server answers it, headers kept, so a case can put an
 * element into a real response of the playground.
 *
 * @param page The page, before it navigates.
 * @param edit Rewrites the page's HTML.
 */
const editItemPage = (page: Page, edit: (html: string) => string) =>
  Effect.promise(() =>
    page.route(
      (url) => url.pathname === "/item",
      async (route) => {
        const response = await route.fetch();

        await route.fulfill({ body: edit(await response.text()), response });
      },
    ),
  );

/**
 * Read a value the page holds, by an expression it evaluates.
 *
 * @param page The page.
 * @param expression The expression, as the page's script would write it.
 * @returns The value, which the caller narrows.
 */
const evaluated = (page: Page, expression: string): Effect.Effect<unknown> =>
  Effect.promise(() => page.evaluate(expression));

/**
 * Read the `securitypolicyviolation` events the page recorded, each as `<violated directive>
 * <blocked URI>`.
 *
 * @param page The page, opened after {@link watch}.
 * @returns The recorded violations, in the order the document received them.
 */
const violationsOf = (page: Page): Effect.Effect<readonly string[]> =>
  Effect.promise(async () =>
    Schema.decodeUnknownSync(Schema.Array(Schema.String))(
      await page.evaluate("window.__plateViolations"),
    ),
  );

/**
 * Read an attribute of the page's `html` element.
 *
 * @param page The page.
 * @param name The attribute.
 * @returns Its value, or `null` when the element has none.
 */
const rootAttribute = (page: Page, name: string) =>
  Effect.promise(() => page.locator("html").getAttribute(name));

eachEngine((it) => {
  it.layer(playgroundLayer({ runtime: true }))("the playground with the runtime on", (served) => {
    served.effect(
      "[m3d-13] in Chromium and WebKit, a page served with the runtime on is upgraded with no policy violation",
      () =>
        withPage({ javaScriptEnabled: true }, (page) =>
          Effect.gen(function* upgraded() {
            const watched = yield* watch(page);
            const opened = yield* open(page);
            const graph = yield* runtimeModules(bootModule, readRuntimeModule);

            assert.strictEqual(opened.status, 200);
            assert.strictEqual(opened.policy, policyWithRuntime);
            yield* Effect.promise(() =>
              page.locator("html[data-runtime-upgraded]").waitFor({ state: "attached" }),
            );

            assert.strictEqual(yield* rootAttribute(page, "data-runtime-upgraded"), "0");
            assert.deepStrictEqual(yield* violationsOf(page), []);
            assert.deepStrictEqual(watched.errors, []);
            assert.deepStrictEqual(
              [...watched.runtime].toSorted(([left], [right]) => left.localeCompare(right)),
              graph
                .map(({ url }): [string, number] => [url, 200])
                .toSorted(([left], [right]) => left.localeCompare(right)),
            );
          }),
        ),
    );

    served.effect(
      "[m3d-13] in Chromium and WebKit, the served runtime upgrades a rendered interaction root and counts it",
      () =>
        withPage({ javaScriptEnabled: true }, (page) =>
          Effect.gen(function* counted() {
            const watched = yield* watch(page);

            yield* editItemPage(page, (html) =>
              html.replace(
                "</main>",
                '<div data-slot="hotspot-interaction" id="runtime-root"></div></main>',
              ),
            );
            yield* open(page);
            yield* Effect.promise(() =>
              page.locator("html[data-runtime-upgraded]").waitFor({ state: "attached" }),
            );

            assert.strictEqual(yield* rootAttribute(page, "data-runtime-upgraded"), "1");
            assert.deepStrictEqual(yield* violationsOf(page), []);
            assert.deepStrictEqual(watched.errors, []);
          }),
        ),
    );

    served.effect(
      "[m3d-13] in Chromium and WebKit, a page served with the runtime on still refuses an inline script",
      () =>
        withPage({ javaScriptEnabled: true }, (page) =>
          Effect.gen(function* refused() {
            const watched = yield* watch(page);

            yield* editItemPage(page, (html) =>
              html.replace(
                "</main>",
                '<script>document.documentElement.dataset.inline = "ran";</script></main>',
              ),
            );
            yield* open(page);
            yield* Effect.promise(() =>
              page.locator("html[data-runtime-upgraded]").waitFor({ state: "attached" }),
            );

            const violations = yield* violationsOf(page);

            assert.isNull(yield* rootAttribute(page, "data-inline"));
            assert.isTrue(violations.some((violation) => violation.startsWith("script-src")));
            assert.isAbove(watched.errors.length, 0);
          }),
        ),
    );
  });

  it.layer(playgroundLayer({}))("the playground with the runtime off", (served) => {
    served.effect(
      "[m3d-13] in Chromium and WebKit, a page served with the runtime off runs no script",
      () =>
        withPage({ javaScriptEnabled: true }, (page) =>
          Effect.gen(function* plain() {
            const watched = yield* watch(page);
            const opened = yield* open(page);

            assert.strictEqual(opened.status, 200);
            assert.strictEqual(opened.policy, pageHeaders["content-security-policy"]);
            assert.include(opened.policy, "script-src 'none'");
            assert.strictEqual(yield* evaluated(page, "document.scripts.length"), 0);
            assert.isNull(yield* rootAttribute(page, "data-runtime-upgraded"));
            assert.deepStrictEqual(yield* violationsOf(page), []);
            assert.deepStrictEqual(watched.errors, []);
            assert.deepStrictEqual([...watched.runtime], []);

            const { origin } = yield* Playground;
            const boot = yield* Effect.promise(() =>
              page.request.get(`${origin}${runtimeUrl(bootModule)}`),
            );

            assert.strictEqual(boot.status(), 404);
          }),
        ),
    );
  });
});
