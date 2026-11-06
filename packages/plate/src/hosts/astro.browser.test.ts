/**
 * The Astro host in Chromium and WebKit: the production build `astroServer` serves on
 * `127.0.0.1:5192`, opened once for the file and shared by both engines.
 *
 * With script off, the page holds no script, its Text Entry has the name `nameOf` gives it, and the
 * browser's own same-origin post of BG010's correct response passes Astro's origin check and
 * scores 1; the browser's Back after that post fetches the page again and restores nothing. With
 * script on, neither the page nor its scored answer holds a script element. Once the host's scope
 * closes, port 5192 is free.
 *
 * `scripts/astro-check.ts` proves the page over Node's `fetch`, whose post carries no `Origin`;
 * this file proves what only a browser sends: `Origin` with `Sec-Fetch-Site: same-origin`.
 *
 * Expected values come from the code: the name from `nameOf` over the HTML the host answered, the
 * typed answer from BG010's correct response, the Status from `message`, and parts through the
 * part table.
 */
import { assert, it, layer } from "@effect/vitest";
import type { Locator, Page } from "playwright-core";
import { Context, Effect, Layer, Option, Schema } from "effect";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { message, numeral } from "#plate/messages.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import { engineLayer, engineNames, withPage } from "#plate/test/browsers.ts";
import { dial } from "#plate/test/dial.ts";
import {
  correctOf,
  count,
  elementsOf,
  inStatus,
  snapshotOf,
  treeOf,
} from "#plate/test/playground-page.ts";
import { statusOf } from "#plate/test/session-page.ts";
import { astroPort, astroServer } from "#scripts/astro-server.ts";

/**
 * BG010's corpus path: the item the Astro host serves, an inline Text Entry in a paragraph.
 */
const bg010 = "QTI3_BPIG_Examples/items/BG010.xml";

/**
 * The identifier of BG010's one response declaration, whose correct response is typed.
 */
const responseId = "RESPONSE";

/**
 * The `data-slot` marker of a Text Entry Control, read through the part table.
 */
const textEntrySlot = rowFor("text-entry-interaction", "control").slot;

/**
 * How long building and starting the host, and stopping it, may each take. The probe `p4-29`
 * measured about a second to build and a quarter of a second to answer, unloaded, and
 * `astroServer`'s release waits at most ten seconds for the server to end and ten for the port to
 * be free; thirty seconds leaves room for a loaded machine.
 */
const hostTimeout = "30 seconds";

/**
 * The Astro host as the file's tests reach it: the origin its page is served at.
 */
class AstroHost extends Context.Service<AstroHost, { readonly origin: string }>()(
  "@qti-pie/plate/hosts/astro.browser.test/AstroHost",
) {}

/**
 * The Astro host served by `astroServer` for as long as the layer is held; releasing it stops the
 * server and waits until port 5192 is free.
 */
const astroHostLayer = Layer.effect(
  AstroHost,
  astroServer.pipe(Effect.map((served) => AstroHost.of(served))),
);

/**
 * Locate the page's Text Entry Controls by the part table's marker.
 *
 * @param page The page.
 * @returns The locator.
 */
const textEntryIn = (page: Page): Locator => page.locator(`[data-slot="${textEntrySlot}"]`);

/**
 * Open the host's page and read the HTML it answered.
 *
 * @param page The page.
 * @param origin The host's origin.
 * @returns The HTML and its tree; the test fails unless the page answered 200.
 */
const openHost = Effect.fn("openHost")(function* openHost(page: Page, origin: string) {
  const answer = yield* Effect.promise(() => page.goto(`${origin}/`));

  assert.isNotNull(answer, "the host answered GET /");
  assert.strictEqual(answer.status(), 200, "GET /");

  const html = yield* Effect.promise(() => answer.text());

  return { html, tree: treeOf(html) };
});

/**
 * Find the one Text Entry Control of a page's tree.
 *
 * @param tree The page's tree.
 * @returns The Control; the test fails unless the page holds exactly one.
 */
const textEntryOf = (tree: Element): Element => {
  const controls = elementsOf([tree]).filter(
    (element) => attribute(element, "data-slot") === textEntrySlot,
  );
  const [control] = controls;

  assert.strictEqual(controls.length, 1, "BG010's page holds one Text Entry");
  assert.isDefined(control);

  return control;
};

/**
 * Read BG010's correct response, the one value its mapping scores 1.
 *
 * @returns The value; the test fails unless BG010 has exactly one.
 */
const correctAnswer = Effect.fn("correctAnswer")(function* correctAnswer() {
  const values = yield* correctOf(bg010, responseId);
  const [value] = values;

  assert.strictEqual(values.length, 1, "BG010's correct response is one value");
  assert.isDefined(value);

  return value;
});

/**
 * Type a value into the Text Entry and post the host's form with its submit button, the browser's
 * own form submission, then wait for the answer to load.
 *
 * @param page The page, on the host's item page.
 * @param tree The page's tree, which gives the submit button's name.
 * @param value The value to type.
 * @returns The post's headers, its form entries, and the answer's status and HTML.
 */
const answerWith = Effect.fn("answerWith")(function* answerWith(
  page: Page,
  tree: Element,
  value: string,
) {
  const submit =
    elementsOf([tree]).find(
      (element) => element.tag === "button" && attribute(element, "type") === "submit",
    ) ?? assert.fail("the host's form has a submit button");

  yield* Effect.promise(() => textEntryIn(page).fill(value));

  const [posted, answered] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForRequest(
        (request) => request.method() === "POST" && request.isNavigationRequest(),
      ),
      page.waitForResponse(
        (response) =>
          response.request().method() === "POST" && response.request().isNavigationRequest(),
      ),
      page.waitForEvent("framenavigated", { predicate: (frame) => frame === page.mainFrame() }),
      page.getByRole("button", { exact: true, name: nameOf(submit, tree) }).click(),
    ]),
  );
  yield* Effect.promise(() => page.waitForLoadState("load"));

  return {
    entries: new URLSearchParams(posted.postData() ?? ""),
    headers: yield* Effect.promise(() => posted.allHeaders()),
    html: yield* Effect.promise(() => answered.text()),
    status: answered.status(),
  };
});

/**
 * Assert that the page shows the scored Status with BG010's score of 1.
 *
 * @param page The page, after the post.
 * @returns Once the assertions have held.
 */
const assertScored = Effect.fn("assertScored")(function* assertScored(page: Page) {
  const status = yield* statusOf(page);

  assert.isTrue(Option.isSome(status), "the answer shows a Status region");
  assert.strictEqual(Option.getOrThrow(status).heading, message("en", "scored"));
  assert.strictEqual(
    yield* inStatus(page, message("en", "score", { score: numeral("en", 1) })),
    1,
    "BG010 scores 1",
  );
});

/**
 * Count the script elements of the page's document, as the engine's own script reads them.
 *
 * @param page The page, with script on.
 * @returns `document.scripts.length`; the test fails unless it is a number.
 */
const scriptsIn = Effect.fn("scriptsIn")(function* scriptsIn(page: Page) {
  return yield* Schema.decodeUnknownEffect(Schema.Number)(
    yield* Effect.promise(() => page.evaluate("document.scripts.length")),
  );
});

/*
 * One host for the file, around both engines. The anonymous block adds no `describe`, so each
 * engine's stays the outermost, as the ledger counts browser results. The block builds the host
 * before its first own test and releases it after its last own test, and Vitest collects a
 * `describe`'s tests only after the block's callback returns, so the engines' tests are not its
 * own. So an own test opens it, building the host in the block's scope before either engine's
 * block reuses it, and an own test closes it, holding that scope until both engines have run. An
 * engine's block that built the host itself would find port 5192 taken, which `astroServer`
 * refuses.
 */
layer(astroHostLayer, { excludeTestServices: true, timeout: hostTimeout })((host) => {
  host.effect("The Astro host answers on 127.0.0.1:5192 before either engine opens it", () =>
    Effect.gen(function* answersFirst() {
      const { origin } = yield* AstroHost;

      assert.strictEqual(origin, `http://127.0.0.1:${String(astroPort)}`);
      assert.strictEqual(yield* dial(astroPort), "accepted");
    }),
  );

  for (const name of engineNames) {
    host.layer(engineLayer(name))(name, (engine) => {
      engine.effect(
        "[Q-20] With script off, BG010's page holds no <script, its Text Entry has the name nameOf gives it, and the browser's same-origin post of the correct response passes Astro's origin check and scores 1",
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* scriptOff() {
              const { origin } = yield* AstroHost;
              const typed = yield* correctAnswer();
              const { html, tree } = yield* openHost(page, origin);

              assert.notInclude(html.toLowerCase(), "<script", "the host's page");

              const control = textEntryOf(tree);
              const entryName = nameOf(control, tree);
              const shown = yield* snapshotOf(textEntryIn(page));

              assert.notStrictEqual(entryName, "", "nameOf gives BG010's Text Entry a name");
              assert.strictEqual(shown.role, "textbox");
              assert.strictEqual(shown.name ?? "", entryName, "the name nameOf gives it");

              const answer = yield* answerWith(page, tree, typed);

              assert.strictEqual(answer.headers["origin"], origin, "the post's Origin");
              assert.strictEqual(
                answer.headers["sec-fetch-site"],
                "same-origin",
                "the post's Sec-Fetch-Site",
              );
              assert.strictEqual(
                answer.status,
                200,
                "Astro's origin check let the post through; it answers a refused one with 403",
              );
              assert.strictEqual(answer.entries.get(attribute(control, "name") ?? ""), typed);
              assert.notInclude(answer.html.toLowerCase(), "<script", "the host's answer");

              yield* assertScored(page);
            }),
          ),
      );

      engine.effect(
        "With script off, the browser's Back after the scored post fetches BG010's page again, and nothing typed or shown is restored",
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* backAfterPost() {
              const { origin } = yield* AstroHost;
              const typed = yield* correctAnswer();
              const { tree } = yield* openHost(page, origin);

              yield* answerWith(page, tree, typed);
              yield* assertScored(page);

              const back = yield* Effect.promise(() => page.goBack());

              assert.isNotNull(back, "the browser fetched the page again, not from a page cache");
              assert.strictEqual(back.request().method(), "GET");
              assert.strictEqual(back.status(), 200, "GET /");
              assert.strictEqual(back.headers()["cache-control"], "no-store");
              assert.strictEqual(yield* count(textEntryIn(page)), 1);
              assert.strictEqual(
                yield* Effect.promise(() => textEntryIn(page).inputValue()),
                "",
                "the typed value is not restored",
              );
              assert.isTrue(Option.isNone(yield* statusOf(page)), "no Status is shown");
            }),
          ),
      );

      engine.effect(
        "With script on, neither BG010's page nor its scored answer holds a script element: document.scripts.length is 0",
        () =>
          withPage({ javaScriptEnabled: true }, (page) =>
            Effect.gen(function* scriptOn() {
              const { origin } = yield* AstroHost;
              const typed = yield* correctAnswer();
              const { tree } = yield* openHost(page, origin);

              assert.strictEqual(yield* scriptsIn(page), 0, "the host's page");

              yield* answerWith(page, tree, typed);
              yield* assertScored(page);

              assert.strictEqual(yield* scriptsIn(page), 0, "the host's answer");
            }),
          ),
      );
    });
  }

  host.effect("The Astro host still answers on 127.0.0.1:5192 after both engines' tests", () =>
    Effect.gen(function* answersLast() {
      assert.strictEqual(yield* dial(astroPort), "accepted");
    }),
  );
});

it.live("Port 5192 is free once the Astro host's scope closes", () =>
  Effect.gen(function* freed() {
    assert.strictEqual(yield* dial(astroPort), "refused");
  }),
);
