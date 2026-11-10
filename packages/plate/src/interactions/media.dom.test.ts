/**
 * The Media controller (Q-14), in each engine's page: the fixtures as plate's SSR writes them,
 * upgraded through the page's registry, with the media element's `play`, `pause`, `ended` and
 * `timeupdate` events dispatched by hand, so no media needs to load or play. Every case sits under
 * a `describe` named by the engine (`server.browser`), as in `src/runtime/upgrade.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { controller } from "#plate/interactions/media.dom.ts";
import { redact, render } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The folder of the area's fixture items, relative to the package, the in-page project's root,
 * which `commands.readFile` resolves paths against.
 */
const fixtureFolder = "fixtures/ei/items";

/**
 * The identifier of the response the Media binds.
 */
const response = "RESPONSE";

/**
 * Read a file of the package as text, through the test server. A file that cannot be read fails
 * the test.
 *
 * @param path The file's path relative to the package's root.
 * @returns The file's text.
 */
const fixtureText = (path: string) => Effect.promise(() => commands.readFile(path));

/**
 * What a test shows of an item beyond the item itself: the count of plays it restores, none for a
 * fresh one, and the mode and `finished` the page is rendered in.
 */
interface Showing {
  readonly count?: Option.Option<bigint>;
  readonly disabled?: boolean;
  readonly mode?: "answering" | "review" | "solution";
}

/**
 * Render an item's XML as plate's SSR writes it, with the default configuration.
 *
 * @param file The item's file name, which the verdict names as the document.
 * @param xml The item's XML.
 * @param showing What the page shows of it.
 * @returns The item's HTML.
 */
const renderedItem = (file: string, xml: string, showing: Showing = {}) =>
  Effect.gen(function* renderItem() {
    const accepted = Option.getOrThrow(
      acceptedItem(yield* open(`items/${file}`, new TextEncoder().encode(xml))),
    );
    const configuration = yield* configure({});
    const { count = Option.none(), ...rest } = showing;
    const values = Option.match(count, {
      onNone: () => ({}),
      onSome: (plays) => ({
        [response]: {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: plays }],
        } as const,
      }),
    });

    return Result.getOrThrow(
      render(redact(accepted), configuration, { instance: "me1", values, ...rest }),
    ).html;
  });

/**
 * Render one fixture item as plate's SSR writes it.
 *
 * @param file The fixture's file name.
 * @param count The count of plays the item restores, none for a fresh one.
 * @param showing What else the page shows of it.
 * @returns The item's HTML.
 */
const renderedFixture = (
  file: string,
  count: Option.Option<bigint> = Option.none(),
  showing: Omit<Showing, "count"> = {},
) =>
  Effect.flatMap(fixtureText(`${fixtureFolder}/${file}`), (xml) =>
    renderedItem(file, xml, { ...showing, count }),
  );

/**
 * Put some HTML into a fresh container at the end of the page's body.
 *
 * @param html The HTML.
 * @returns The container, which the caller removes.
 */
const mount = (html: string): HTMLElement => {
  const container = document.createElement("div");

  container.innerHTML = html;
  document.body.append(container);

  return container;
};

/**
 * Wait for two animation frames, so a text the live region writes on the next frame is written.
 *
 * @returns A promise of the second frame's timestamp.
 */
const frames = (): Promise<number> =>
  Effect.runPromise(
    Effect.callback<number>((resume) => {
      requestAnimationFrame(() => {
        requestAnimationFrame((time) => {
          resume(Effect.succeed(time));
        });
      });
    }),
  );

/**
 * What a test watches of one media element: how often the controller paused it and how often it
 * started it, which it never does.
 */
interface Watched {
  readonly media: HTMLMediaElement;
  readonly pauses: () => number;
  readonly starts: () => number;
}

/**
 * Take the one `audio` or `video` of a mounted item and stand a spy on `pause` and `play`, so a
 * stopped play and a play the controller started are seen without any media loading.
 *
 * @param container The mounted item.
 * @returns The element and its two counts.
 */
const watch = (container: HTMLElement): Watched => {
  const media = container.querySelector<HTMLMediaElement>("audio, video");

  assert.isNotNull(media);

  const element = media ?? new Audio();
  let pauses = 0;
  let starts = 0;

  Object.defineProperty(element, "pause", {
    configurable: true,
    value: () => {
      pauses += 1;
    },
  });
  Object.defineProperty(element, "play", {
    configurable: true,
    value: () => {
      starts += 1;

      return Promise.resolve();
    },
  });

  return { media: element, pauses: () => pauses, starts: () => starts };
};

/**
 * Give a media element a playback position and a state without loading anything, as an own
 * property over the element's own getters.
 *
 * @param media The element.
 * @param state The `currentTime` and, optionally, `duration` and `paused` it reports.
 * @param state.currentTime The playback position, in seconds.
 * @param state.duration The length of the media, in seconds.
 * @param state.paused Whether the element reports itself paused.
 */
const setState = (
  media: HTMLMediaElement,
  state: { readonly currentTime: number; readonly duration?: number; readonly paused?: boolean },
): void => {
  Object.defineProperty(media, "currentTime", { configurable: true, value: state.currentTime });

  if (state.duration !== undefined) {
    Object.defineProperty(media, "duration", { configurable: true, value: state.duration });
  }

  if (state.paused !== undefined) {
    Object.defineProperty(media, "paused", { configurable: true, value: state.paused });
  }
};

/**
 * Dispatch one of the media element's events.
 *
 * @param media The element.
 * @param type The event's type.
 */
const fire = (media: HTMLMediaElement, type: string): void => {
  media.dispatchEvent(new Event(type));
};

/**
 * Read the values of the hidden inputs of one name under a root, in order.
 *
 * @param root The interaction's root.
 * @returns The values.
 */
const hiddenIn = (root: ParentNode): readonly string[] =>
  [...root.querySelectorAll<HTMLInputElement>('input[type="hidden"]')].map((input) => input.value);

/**
 * Find the Media root of a mounted item.
 *
 * @param container The mounted item.
 * @returns The root, failing the test when there is none.
 */
const rootOf = (container: HTMLElement): HTMLElement => {
  const root = container.querySelector<HTMLElement>('[data-slot="media-interaction"]');

  assert.isNotNull(root);

  return root ?? container;
};

/**
 * Read the live region's text.
 *
 * @param container The mounted item.
 * @returns The text.
 */
const liveText = (container: HTMLElement): string =>
  container.querySelector('[data-slot="item-live"]')?.textContent ?? "";

describe(server.browser, () => {
  describe("the Media controller", () => {
    it.effect("[Q-14] the Media controller is implemented and leaves no stub mark", () =>
      Effect.gen(function* leavesNoMark() {
        assert.isTrue(controller.implemented);
        assert.strictEqual(controller.kind, "media");

        for (const file of ["media.xml", "media-video.xml"]) {
          const container = mount(yield* renderedFixture(file));
          const root = rootOf(container);
          const upgraded = upgrade(container);

          assert.deepStrictEqual(upgraded.controllers, [{ kind: "media", root }], file);
          assert.isUndefined(root.dataset["runtime"], file);
          assert.strictEqual(container.querySelectorAll("[data-runtime]").length, 0, file);

          upgraded.teardown();
          container.remove();
        }
      }),
    );

    it.effect("[Q-14] a play from the start counts one and writes the hidden input", () =>
      Effect.gen(function* countsOnePlay() {
        const container = mount(yield* renderedFixture("media.xml"));
        const root = rootOf(container);
        const { media, starts } = watch(container);
        const upgraded = upgrade(container);

        assert.deepStrictEqual(hiddenIn(root), []);
        setState(media, { currentTime: 0 });
        fire(media, "play");

        assert.deepStrictEqual(hiddenIn(root), ["1"]);

        const [input] = root.querySelectorAll<HTMLInputElement>('input[type="hidden"]');

        assert.strictEqual(input?.name, root.dataset["entryName"]);
        assert.strictEqual(root.dataset["minPlays"], "1");
        assert.strictEqual(starts(), 0);

        fire(media, "ended");
        fire(media, "play");

        assert.deepStrictEqual(hiddenIn(root), ["2"]);
        assert.strictEqual(root.querySelectorAll('input[type="hidden"]').length, 1);
        assert.strictEqual(starts(), 0);

        upgraded.teardown();
        container.remove();
      }),
    );

    it.effect("[Q-14] a restored count is continued, not started again", () =>
      Effect.gen(function* continuesCount() {
        const container = mount(yield* renderedFixture("media.xml", Option.some(1n)));
        const root = rootOf(container);
        const { media, pauses } = watch(container);
        const upgraded = upgrade(container);

        assert.deepStrictEqual(hiddenIn(root), ["1"]);
        setState(media, { currentTime: 0 });
        fire(media, "play");
        assert.deepStrictEqual(hiddenIn(root), ["2"]);
        assert.strictEqual(pauses(), 0);

        fire(media, "ended");
        fire(media, "play");
        assert.deepStrictEqual(hiddenIn(root), ["2"]);
        assert.strictEqual(pauses(), 1);

        upgraded.teardown();
        container.remove();
      }),
    );

    it.effect("[Q-14] a play resumed mid-way does not count again", () =>
      Effect.gen(function* resumesWithoutCounting() {
        const container = mount(yield* renderedFixture("media.xml"));
        const root = rootOf(container);
        const { media, pauses } = watch(container);
        const upgraded = upgrade(container);

        setState(media, { currentTime: 0 });
        fire(media, "play");
        setState(media, { currentTime: 3 });
        fire(media, "pause");
        fire(media, "play");

        assert.deepStrictEqual(hiddenIn(root), ["1"]);
        assert.strictEqual(pauses(), 0);

        setState(media, { currentTime: 7.5 });
        fire(media, "pause");
        fire(media, "play");
        assert.deepStrictEqual(hiddenIn(root), ["1"]);

        upgraded.teardown();
        container.remove();
      }),
    );

    it.effect("[Q-14] past max-plays, a play is stopped and the limit announced", () =>
      Effect.gen(function* stopsPastTheLimit() {
        const container = mount(yield* renderedFixture("media.xml"));
        const root = rootOf(container);
        const { media, pauses, starts } = watch(container);
        const upgraded = upgrade(container);

        assert.strictEqual(root.dataset["maxPlays"], "2");
        setState(media, { currentTime: 0 });
        fire(media, "play");
        fire(media, "ended");
        fire(media, "play");
        fire(media, "ended");
        yield* Effect.promise(frames);

        assert.deepStrictEqual(hiddenIn(root), ["2"]);
        assert.strictEqual(pauses(), 0);
        assert.strictEqual(liveText(container), "");

        fire(media, "play");
        yield* Effect.promise(frames);

        assert.strictEqual(pauses(), 1);
        assert.deepStrictEqual(hiddenIn(root), ["2"]);
        assert.match(liveText(container), /limit of 2 plays/u);
        assert.strictEqual(starts(), 0);

        fire(media, "ended");
        fire(media, "play");
        yield* Effect.promise(frames);

        assert.strictEqual(pauses(), 2);
        assert.deepStrictEqual(hiddenIn(root), ["2"]);

        upgraded.teardown();
        container.remove();
      }),
    );

    it.effect("[Q-14] a media with no max-plays is never stopped", () =>
      Effect.gen(function* neverStops() {
        const container = mount(yield* renderedFixture("media-video.xml"));
        const root = rootOf(container);
        const { media, pauses } = watch(container);
        const upgraded = upgrade(container);

        assert.strictEqual(root.dataset["maxPlays"], "0");
        setState(media, { currentTime: 0 });

        for (let play = 0; play < 12; play += 1) {
          fire(media, "ended");
          fire(media, "play");
        }

        assert.deepStrictEqual(hiddenIn(root), ["12"]);
        assert.strictEqual(pauses(), 0);

        upgraded.teardown();
        container.remove();
      }),
    );

    it.effect(
      "[Q-14] each wrap of a looping media counts one more, and the last allowed play is not looped",
      () =>
        Effect.gen(function* countsWraps() {
          const xml = (yield* fixtureText(`${fixtureFolder}/media-video.xml`)).replace(
            'autostart="true"',
            'autostart="true" max-plays="3"',
          );
          const container = mount(yield* renderedItem("media-loop.xml", xml));
          const root = rootOf(container);
          const { media, pauses } = watch(container);
          const upgraded = upgrade(container);

          assert.isTrue(media.loop);
          setState(media, { currentTime: 0, duration: 10 });
          fire(media, "play");
          assert.deepStrictEqual(hiddenIn(root), ["1"]);

          setState(media, { currentTime: 4.2 });
          fire(media, "timeupdate");
          setState(media, { currentTime: 9.8 });
          fire(media, "timeupdate");
          assert.deepStrictEqual(hiddenIn(root), ["1"]);

          setState(media, { currentTime: 0.2 });
          fire(media, "timeupdate");
          assert.deepStrictEqual(hiddenIn(root), ["2"]);
          assert.isTrue(media.loop);

          setState(media, { currentTime: 1 });
          fire(media, "timeupdate");
          setState(media, { currentTime: 3 });
          fire(media, "timeupdate");
          setState(media, { currentTime: 0.1 });
          fire(media, "timeupdate");
          assert.deepStrictEqual(hiddenIn(root), ["2"]);

          setState(media, { currentTime: 9.9 });
          fire(media, "timeupdate");
          setState(media, { currentTime: 0.2 });
          fire(media, "timeupdate");
          assert.deepStrictEqual(hiddenIn(root), ["3"]);
          assert.isFalse(media.loop);
          assert.strictEqual(pauses(), 0);

          upgraded.teardown();
          assert.isTrue(media.loop);
          container.remove();
        }),
    );

    it.effect(
      "[Q-14] a media already playing when the page upgrades counts one play, which its own play event does not repeat",
      () =>
        Effect.gen(function* countsAutostart() {
          const container = mount(yield* renderedFixture("media-video.xml"));
          const root = rootOf(container);
          const { media } = watch(container);

          setState(media, { currentTime: 0.2, paused: false });

          const upgraded = upgrade(container);

          assert.deepStrictEqual(hiddenIn(root), ["1"]);
          fire(media, "play");
          assert.deepStrictEqual(hiddenIn(root), ["1"]);

          setState(media, { currentTime: 4, paused: false });
          fire(media, "timeupdate");
          fire(media, "ended");
          setState(media, { currentTime: 0, paused: true });
          fire(media, "play");
          assert.deepStrictEqual(hiddenIn(root), ["2"]);

          upgraded.teardown();
          container.remove();
        }),
    );

    it.effect(
      "[Q-14] upgrade moves no focus and announces nothing; teardown removes every listener and keeps the hidden input",
      () =>
        Effect.gen(function* upgradesQuietly() {
          const container = mount(yield* renderedFixture("media.xml", Option.some(1n)));
          const root = rootOf(container);
          const { media, pauses } = watch(container);
          const focused: EventTarget[] = [];
          const record = (event: FocusEvent) => {
            focused.push(event.target ?? document);
          };
          const before = document.activeElement;

          document.addEventListener("focusin", record);

          const upgraded = upgrade(container);

          yield* Effect.promise(frames);
          document.removeEventListener("focusin", record);

          assert.strictEqual(document.activeElement, before);
          assert.deepStrictEqual(focused, []);
          assert.strictEqual(liveText(container), "");
          assert.deepStrictEqual(hiddenIn(root), ["1"]);

          setState(media, { currentTime: 0 });
          fire(media, "play");
          assert.deepStrictEqual(hiddenIn(root), ["2"]);

          upgraded.teardown();
          fire(media, "ended");
          fire(media, "play");
          fire(media, "ended");
          fire(media, "play");
          yield* Effect.promise(frames);

          assert.deepStrictEqual(hiddenIn(root), ["2"]);
          assert.strictEqual(pauses(), 0);
          assert.strictEqual(liveText(container), "");
          assert.strictEqual(document.activeElement, before);

          const again = upgrade(container);

          assert.lengthOf(again.controllers, 1);
          again.teardown();
          container.remove();
        }),
    );

    it.effect(
      "[Q-14] in review, in solution and when finished, nothing is counted, stopped or announced",
      () =>
        Effect.gen(function* staysInertWhenNotAnswering() {
          for (const showing of [
            { mode: "review" },
            { mode: "solution" },
            { disabled: true },
          ] as const) {
            const container = mount(yield* renderedFixture("media.xml", Option.some(2n), showing));
            const root = rootOf(container);
            const { media, pauses } = watch(container);
            const upgraded = upgrade(container);

            setState(media, { currentTime: 0 });
            fire(media, "play");
            fire(media, "ended");
            fire(media, "play");
            yield* Effect.promise(frames);

            assert.deepStrictEqual(hiddenIn(root), [], JSON.stringify(showing));
            assert.strictEqual(pauses(), 0, JSON.stringify(showing));
            assert.strictEqual(liveText(container), "", JSON.stringify(showing));

            upgraded.teardown();
            container.remove();
          }
        }),
    );

    it("[Q-14] a root without its parts attaches nothing, and its teardown still works", async () => {
      const container = mount(
        `<div data-slot="item"><div data-slot="item-live" aria-live="polite" aria-atomic="true"></div><div data-slot="media-interaction"></div><div data-slot="media-interaction" data-entry-name="q.R"></div></div>`,
      );
      const before = document.activeElement;
      const upgraded = upgrade(container);

      await frames();

      assert.lengthOf(upgraded.controllers, 2);
      assert.strictEqual(document.activeElement, before);
      assert.strictEqual(liveText(container), "");
      assert.strictEqual(container.querySelectorAll("input").length, 0);

      upgraded.teardown();
      container.remove();
    });

    it.effect("[Q-14] a first play begun after a seek counts one", () =>
      Effect.gen(function* countsSeekedFirstPlay() {
        const container = mount(yield* renderedFixture("media.xml"));
        const root = rootOf(container);
        const { media, pauses } = watch(container);
        const upgraded = upgrade(container);

        setState(media, { currentTime: 5 });
        fire(media, "play");

        assert.deepStrictEqual(hiddenIn(root), ["1"]);
        assert.strictEqual(pauses(), 0);

        upgraded.teardown();
        container.remove();
      }),
    );

    it.effect(
      "[Q-14] after the media ended, a play begun from a seeked position counts one more",
      () =>
        Effect.gen(function* countsSeekedPlayAfterEnd() {
          const container = mount(yield* renderedFixture("media.xml"));
          const root = rootOf(container);
          const { media, pauses } = watch(container);
          const upgraded = upgrade(container);

          setState(media, { currentTime: 0 });
          fire(media, "play");
          assert.deepStrictEqual(hiddenIn(root), ["1"]);

          fire(media, "ended");
          setState(media, { currentTime: 4 });
          fire(media, "play");

          assert.deepStrictEqual(hiddenIn(root), ["2"]);
          assert.strictEqual(pauses(), 0);

          upgraded.teardown();
          container.remove();
        }),
    );

    it.effect(
      "[Q-14] past max-plays, a play begun after a seek is stopped and the limit announced",
      () =>
        Effect.gen(function* stopsSeekedPlayPastTheLimit() {
          const container = mount(yield* renderedFixture("media.xml"));
          const root = rootOf(container);
          const { media, pauses, starts } = watch(container);
          const upgraded = upgrade(container);

          setState(media, { currentTime: 0 });
          fire(media, "play");
          fire(media, "ended");
          fire(media, "play");
          fire(media, "ended");
          assert.deepStrictEqual(hiddenIn(root), ["2"]);

          setState(media, { currentTime: 0.5 });
          fire(media, "play");
          yield* Effect.promise(frames);

          assert.strictEqual(pauses(), 1);
          assert.match(liveText(container), /limit of 2 plays/u);
          assert.deepStrictEqual(hiddenIn(root), ["2"]);
          assert.strictEqual(starts(), 0);

          upgraded.teardown();
          container.remove();
        }),
    );

    it.effect(
      "[Q-14] a pause then a play of the same playback is a resume from any position, the start included",
      () =>
        Effect.gen(function* resumesFromAnyPosition() {
          const container = mount(yield* renderedFixture("media.xml"));
          const root = rootOf(container);
          const { media, pauses } = watch(container);
          const upgraded = upgrade(container);

          setState(media, { currentTime: 0 });
          fire(media, "play");
          assert.deepStrictEqual(hiddenIn(root), ["1"]);

          fire(media, "pause");
          setState(media, { currentTime: 0 });
          fire(media, "play");

          assert.deepStrictEqual(hiddenIn(root), ["1"]);
          assert.strictEqual(pauses(), 0);

          fire(media, "pause");
          setState(media, { currentTime: 6 });
          fire(media, "play");
          fire(media, "pause");
          setState(media, { currentTime: 0.2 });
          fire(media, "play");

          assert.deepStrictEqual(hiddenIn(root), ["1"]);
          assert.strictEqual(pauses(), 0);

          upgraded.teardown();
          container.remove();
        }),
    );

    it.effect("[Q-14] a play the limit paused can never be resumed past the limit", () =>
      Effect.gen(function* neverResumesPastTheLimit() {
        const container = mount(yield* renderedFixture("media.xml"));
        const root = rootOf(container);
        const { media, pauses } = watch(container);
        const upgraded = upgrade(container);

        setState(media, { currentTime: 0 });
        fire(media, "play");
        fire(media, "ended");
        fire(media, "play");
        fire(media, "ended");
        setState(media, { currentTime: 0.5 });
        fire(media, "play");
        yield* Effect.promise(frames);

        assert.strictEqual(pauses(), 1);
        assert.match(liveText(container), /limit of 2 plays/u);

        fire(media, "play");
        assert.strictEqual(liveText(container), "");
        yield* Effect.promise(frames);

        assert.strictEqual(pauses(), 2);
        assert.match(liveText(container), /limit of 2 plays/u);
        assert.deepStrictEqual(hiddenIn(root), ["2"]);

        fire(media, "pause");
        setState(media, { currentTime: 3 });
        fire(media, "play");
        yield* Effect.promise(frames);

        assert.strictEqual(pauses(), 3);
        assert.deepStrictEqual(hiddenIn(root), ["2"]);

        upgraded.teardown();
        container.remove();
      }),
    );
  });
});
