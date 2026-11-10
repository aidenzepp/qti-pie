/**
 * OD-14 (e) and CHROME-1 in Chromium and WebKit, with JavaScript on (spec §4.9 item 3).
 *
 * (a) is the control: opened directly from the walk corpus, each OD-14 (e) probe document runs its
 * script, which writes "SCRIPT RAN" into itself and gives the top page's URL `#od14-escaped`.
 * (b) is the proof: embedded by the probe item in the playground, the same documents run no script,
 * show no fallback, and cannot navigate the page, by script or by their `target="_top"` links.
 * (c) is CHROME-1: two corpus items' objects show their documents, not their fallback. A failed (b)
 * beside a passing (a) in an engine is the failed proof that cuts P3-28.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assert } from "@effect/vitest";
import type { Frame, Page } from "playwright-core";
import { ConfigProvider, Effect, Layer, Option, Predicate } from "effect";
import { playgroundCaches } from "#plate/dev/page.ts";
import { textOf } from "#plate/test/accessibility.ts";
import {
  Engine,
  Playground,
  WalkCorpus,
  eachEngine,
  playgroundLayer,
  walkCorpusLayer,
  withPage,
} from "#plate/test/browsers.ts";
import { elementsOf, itemTarget } from "#plate/test/playground-page.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The OD-14 (e) probe item, by path under the walk corpus's folder.
 */
const probeItem = "od14/od14-probe.xml";

/**
 * The two documents the probe item embeds, beside it, by path under the walk corpus's folder.
 * Opened directly, they are the control.
 */
const probeDocuments = ["od14/od14-probe.html", "od14/od14-probe.svg"] as const;

/**
 * The selector of the element each probe document's script writes into.
 */
const statusSelector = "#od14-status";

/**
 * What each probe document's status reads before its script runs.
 */
const notRun = "The script has not run.";

/**
 * What each probe document's script writes into its status.
 */
const scriptRan = "SCRIPT RAN";

/**
 * The fragment each probe document's script, and its `target="_top"` link, gives the top page.
 */
const escaped = "#od14-escaped";

/**
 * The probe item's fallback texts, one per object in document order: what the page would show if
 * an object did not show its document.
 */
const probeFallbacks = ["The HTML probe is not shown.", "The SVG probe is not shown."];

/**
 * CHROME-1's two items, by corpus path, each with the address the playground gives its one object
 * (`src/dev/page.test.ts` pins both) and the root element its document has.
 */
const chromeEmbeds = [
  {
    data: "/assets/qtiv3-examples/packaging/items/shared/orkney.html",
    item: "qtiv3-examples/packaging/items/orkney1.xml",
    root: "html",
  },
  {
    data: "/assets/qtiv3-examples/packaging/svg/rectangle.svg",
    item: "qtiv3-examples/packaging/svg/svg.xml",
    root: "svg",
  },
] as const;

/**
 * How long, in milliseconds, a test waits for a nested document, its status, or the effect of a
 * probe's script before it reads what is there.
 */
const bound = 10_000;

/**
 * How long, in milliseconds, a test waits after a click for the page's main frame to navigate.
 */
const settle = 2000;

/**
 * An `object` of a page the playground answered: its address as written, and its fallback text,
 * whitespace collapsed.
 */
interface Embed {
  readonly data: string;
  readonly fallback: string;
}

/**
 * A nested document reached from its `object`, and how it was reached: through Playwright's
 * `contentFrame()` on the element, or as the page's frame whose URL is the object's address.
 */
interface Reached {
  readonly frame: Frame;
  readonly via: "contentFrame()" | "frame URL";
}

/**
 * Read the `object` elements of a page the playground answered, as a reader of its HTML would.
 *
 * @param html The page's HTML.
 * @returns Each object's address and fallback text, in document order.
 */
const embedsOf = (html: string): readonly Embed[] =>
  elementsOf(parseHtml(html))
    .filter((element) => element.tag === "object")
    .map((object) => {
      const { data } = object.attrs;

      return { data: Predicate.isString(data) ? data : "", fallback: textOf(object) };
    });

/**
 * Reach the nested document an `object` of the page loaded: through `contentFrame()` on the
 * element first, else as the page's frame whose URL is the object's address.
 *
 * @param page The page.
 * @param index The object's position among the page's objects.
 * @param address The object's address, resolved against the page's URL.
 * @returns The document and how it was reached, or none when neither reaches it.
 */
const nestedDocument = Effect.fn("nestedDocument")(function* nestedDocument(
  page: Page,
  index: number,
  address: string,
): Effect.fn.Return<Option.Option<Reached>> {
  const element = yield* Effect.promise(() =>
    page.locator("object").nth(index).elementHandle({ timeout: bound }),
  );
  const content = Option.fromNullOr(yield* Effect.promise(() => element.contentFrame()));

  if (Option.isSome(content)) {
    return Option.some({ frame: content.value, via: "contentFrame()" });
  }

  return Option.map(
    Option.fromUndefinedOr(page.frames().find((frame) => frame.url() === address)),
    (frame): Reached => ({ frame, via: "frame URL" }),
  );
});

/**
 * Read the text an `object` renders of its own content. An object that shows its nested document
 * renders none of its children, so this is empty; an object that shows its fallback renders it.
 *
 * @param page The page.
 * @param index The object's position among the page's objects.
 * @returns The object's rendered text, trimmed.
 */
const renderedFallback = (page: Page, index: number): Effect.Effect<string> =>
  // oxlint-disable-next-line unicorn/prefer-dom-node-text-content -- This reads the rendered text, which is the point: `textContent` gives the fallback whether or not the object shows it.
  Effect.promise(() => page.locator("object").nth(index).innerText({ timeout: bound })).pipe(
    Effect.map((text) => text.trim()),
  );

/**
 * Wait, at most {@link bound}, for a nested document to finish loading and hold its status.
 *
 * @param frame The nested document's frame.
 * @returns An effect that settles when the status is there or the bound has passed.
 */
const awaitStatus = (frame: Frame): Effect.Effect<void> =>
  Effect.tryPromise(() =>
    frame.locator(statusSelector).waitFor({ state: "attached", timeout: bound }),
  ).pipe(Effect.ignore);

/**
 * Wait, at most {@link settle}, for the page's main frame to navigate.
 *
 * @param page The page.
 * @returns An effect that settles when the main frame navigates or the wait has passed.
 */
const awaitTopNavigation = (page: Page): Effect.Effect<void> =>
  Effect.tryPromise(() =>
    page.waitForEvent("framenavigated", {
      predicate: (frame) => frame === page.mainFrame(),
      timeout: settle,
    }),
  ).pipe(Effect.ignore);

eachEngine((it, name) => {
  it.layer(walkCorpusLayer)("OD-14 (e)", (walk) => {
    walk.effect(
      "(a) the control: opened by its file URL, each probe document runs its script, which writes SCRIPT RAN into its status and gives the page's URL #od14-escaped",
      () =>
        Effect.gen(function* control() {
          const { directory } = yield* WalkCorpus;

          for (const probe of probeDocuments) {
            const url = pathToFileURL(path.join(directory, probe)).href;
            const seen = yield* withPage({ javaScriptEnabled: true }, (page) =>
              Effect.gen(function* openControl() {
                yield* Effect.promise(() => page.goto(url));
                yield* Effect.tryPromise(() =>
                  page.locator(statusSelector, { hasText: scriptRan }).waitFor({ timeout: bound }),
                ).pipe(Effect.ignore);
                yield* Effect.tryPromise(() =>
                  page.waitForURL((address) => address.hash === escaped, { timeout: bound }),
                ).pipe(Effect.ignore);

                return {
                  status: yield* Effect.promise(() => page.locator(statusSelector).textContent()),
                  url: page.url(),
                };
              }),
            );

            assert.strictEqual(seen.status, scriptRan, `${name}, ${probe}: the status`);
            assert.isTrue(seen.url.endsWith(escaped), `${name}, ${probe}: the URL ${seen.url}`);
          }
        }),
    );

    walk.effect(
      "(b) the proof: embedded by the probe item in the playground, neither document runs its script or shows its fallback, and neither its script nor its target=_top link navigates the page",
      (context) =>
        Effect.gen(function* proof() {
          const { directory } = yield* WalkCorpus;

          yield* withPage({ javaScriptEnabled: true }, (page) =>
            Effect.gen(function* openProbe() {
              const { origin } = yield* Playground;
              const { version } = yield* Engine;
              const navigations: string[] = [];

              page.on("framenavigated", (frame) => {
                if (frame === page.mainFrame()) {
                  navigations.push(frame.url());
                }
              });

              const response = yield* Effect.promise(() =>
                page.goto(`${origin}${itemTarget(probeItem)}`),
              );

              assert.isNotNull(response);

              const embeds = embedsOf(yield* Effect.promise(() => response.text()));
              const itemUrl = page.url();

              assert.strictEqual(response.status(), 200);
              assert.deepStrictEqual(
                embeds.map((embed) => embed.fallback),
                probeFallbacks,
              );

              const frames: Frame[] = [];

              for (const [index, embed] of embeds.entries()) {
                const address = new URL(embed.data, itemUrl).href;
                const reached = yield* nestedDocument(page, index, address);

                if (Option.isNone(reached)) {
                  assert.fail(
                    `${name}: no nested document reached for ${embed.data}, by contentFrame() or by a frame at ${address}`,
                  );
                }

                const { frame, via } = reached.value;

                yield* Effect.promise(() =>
                  context.annotate(`${name} ${version}: ${embed.data} reached through ${via}`),
                );
                yield* awaitStatus(frame);

                const status = yield* Effect.promise(() =>
                  frame.locator(statusSelector).textContent({ timeout: bound }),
                );

                assert.strictEqual(frame.url(), address, `${name}, ${embed.data}: the frame's URL`);
                assert.strictEqual(status, notRun, `${name}, ${embed.data}: the status`);
                assert.strictEqual(
                  yield* renderedFallback(page, index),
                  "",
                  `${name}, ${embed.data}: the fallback "${embed.fallback}" is shown`,
                );
                frames.push(frame);
              }

              // The status elements, not the frames' whole text: the item's prose and the SVG's
              // script source both spell "SCRIPT RAN" without the script having run.
              const ran = yield* Effect.forEach(page.frames(), (frame) =>
                Effect.promise(() => frame.locator(statusSelector, { hasText: scriptRan }).count()),
              );

              assert.deepStrictEqual(
                ran,
                page.frames().map(() => 0),
                `${name}: per frame, the statuses reading ${scriptRan}`,
              );
              assert.strictEqual(page.url(), itemUrl, `${name}: the page's URL after load`);
              assert.isFalse(
                navigations.some((url) => url.includes(escaped)),
                `${name}: the main frame navigated to ${navigations.join(", ")}`,
              );

              const loaded = navigations.length;

              for (const frame of frames) {
                yield* Effect.promise(() =>
                  frame.locator('a[target="_top"]').click({ timeout: bound }),
                );
                yield* awaitTopNavigation(page);

                assert.strictEqual(
                  navigations.length,
                  loaded,
                  `${name}: the main frame navigated to ${navigations.slice(loaded).join(", ")} after the link in ${frame.url()}`,
                );
                assert.strictEqual(
                  page.url(),
                  itemUrl,
                  `${name}: the page's URL after the link in ${frame.url()}`,
                );
              }
            }),
          ).pipe(
            Effect.provide(
              playgroundLayer(
                {},
                Layer.merge(
                  playgroundCaches,
                  ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory })),
                ),
              ),
            ),
          );
        }),
    );
  });

  it.effect(
    "[I-8] (c) CHROME-1: in the playground over the corpus, orkney1.xml's HTML object and svg.xml's SVG object each show their document, not their fallback",
    (context) =>
      withPage({ javaScriptEnabled: true }, (page) =>
        Effect.gen(function* chromeOne() {
          const { origin } = yield* Playground;
          const { version } = yield* Engine;

          for (const expected of chromeEmbeds) {
            const response = yield* Effect.promise(() =>
              page.goto(`${origin}${itemTarget(expected.item)}`),
            );

            assert.isNotNull(response);

            const embeds = embedsOf(yield* Effect.promise(() => response.text()));
            const address = new URL(expected.data, page.url()).href;

            assert.strictEqual(response.status(), 200, expected.item);
            assert.deepStrictEqual(
              embeds.map((embed) => embed.data),
              [expected.data],
              expected.item,
            );

            const reached = yield* nestedDocument(page, 0, address);

            if (Option.isNone(reached)) {
              assert.fail(
                `${name}: no nested document reached for ${expected.data}, by contentFrame() or by a frame at ${address}`,
              );
            }

            const { frame, via } = reached.value;

            yield* Effect.promise(() =>
              context.annotate(
                `${name} ${version}: ${expected.data} reached through ${via}; its fallback reads "${embeds.map((embed) => embed.fallback).join("")}"`,
              ),
            );
            yield* Effect.tryPromise(() => frame.waitForLoadState("load", { timeout: bound })).pipe(
              Effect.ignore,
            );

            assert.strictEqual(frame.url(), address, `${name}, ${expected.data}: the frame's URL`);
            if (expected.root === "html") {
              const body = yield* Effect.promise(() =>
                frame.locator("body").textContent({ timeout: bound }),
              );

              assert.notStrictEqual(
                (body ?? "").trim(),
                "",
                `${name}, ${expected.data}: the body text`,
              );
            } else {
              assert.strictEqual(
                yield* Effect.promise(() => frame.locator("xpath=/*[local-name()='svg']").count()),
                1,
                `${name}, ${expected.data}: an svg root`,
              );
            }

            assert.strictEqual(
              yield* renderedFallback(page, 0),
              "",
              `${name}, ${expected.data}: the object shows its fallback`,
            );
          }
        }),
      ).pipe(Effect.provide(playgroundLayer({}))),
  );
});
