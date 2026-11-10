/**
 * The read-aloud engine in each engine's page (A-40a, A-40b, A-40f): the fixture item
 * `fixtures/m4/items/read-aloud.xml` is rendered as plate's SSR writes it, pasted into the page,
 * and a controller attached to it with a recording fake synthesis, so every assertion is on what
 * the fake recorded and on the DOM. Nothing speaks until the candidate plays; the spoken texts are
 * the speech plan's, in document order; pause, resume and stop drive the synthesis and the state;
 * suppressed content is never spoken; a screen-reader candidate gets no controller; and the item's
 * DOM is never written.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/runtime/upgrade.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { commands, server } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { readAloud as entryReadAloud } from "#plate/runtime.dom.ts";
import { liveSlot } from "#plate/runtime/announce.dom.ts";
import { readAloud } from "#plate/runtime/read-aloud.dom.ts";
import type { ReadAloudSynthesis, ReadAloudUtterance } from "#plate/runtime/read-aloud.dom.ts";
import { noSupports } from "#plate/supports.ts";
import type { ReadingType, Supports } from "#plate/supports.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The fixture item, relative to the package, which `commands.readFile` resolves this file's paths
 * against.
 */
const fixtureItem = "fixtures/m4/items/read-aloud.xml";

/**
 * Render the fixture item as plate's SSR writes it, with the default configuration.
 *
 * @returns The item's HTML.
 */
const renderedFixture = Effect.gen(function* renderFixture() {
  const bytes = new TextEncoder().encode(
    yield* Effect.promise(() => commands.readFile(fixtureItem)),
  );
  const accepted = Option.getOrThrow(acceptedItem(yield* open(fixtureItem, bytes)));
  const configuration = yield* configure({});

  return Result.getOrThrow(render(redact(accepted), configuration, { instance: "w0d" })).html;
});

/**
 * Put some HTML into a fresh container at the end of the page's body.
 *
 * @param html The HTML.
 * @returns The item root inside the container, which the caller removes through
 * {@link unmount}.
 */
const mount = (html: string): HTMLElement => {
  const container = document.createElement("div");

  container.innerHTML = html;
  document.body.append(container);

  const root = container.querySelector<HTMLElement>('[data-slot="item"]');

  assert.isNotNull(root);

  return root;
};

/**
 * Remove a mounted item's container from the page.
 *
 * @param root The item root {@link mount} gave.
 */
const unmount = (root: HTMLElement): void => {
  root.parentElement?.remove();
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
 * The supports of a candidate whose spoken support has a reading type, every other support off.
 *
 * @param readingType The reading type.
 * @returns The supports.
 */
const spoken = (readingType: ReadingType): Supports => ({
  ...noSupports,
  readAloud: Option.some(readingType),
});

/**
 * The supports of a computer-read-aloud candidate.
 */
const computerReadAloud = spoken("computer-read-aloud");

/**
 * An utterance the fake records: its text and language, and the listeners the engine attached,
 * which {@link FakeSynthesis.finish} fires as the engine would.
 */
interface FakeUtterance extends ReadAloudUtterance {
  readonly listeners: { end: (() => void)[]; error: (() => void)[] };
  readonly text: string;
}

/**
 * A recording fake of the Web Speech API: the calls made on it, in order, the utterances spoken,
 * and a way to end them.
 */
interface FakeSynthesis {
  /**
   * The names of the methods called, in order.
   */
  readonly calls: string[];
  /**
   * Fire `end` on every utterance spoken so far, in order, as an engine does when it finishes.
   */
  readonly finish: () => void;
  /**
   * The utterances spoken, in order.
   */
  readonly spoken: FakeUtterance[];
  readonly synthesis: ReadAloudSynthesis;
  /**
   * The texts of the utterances spoken, in order.
   */
  readonly texts: () => readonly string[];
  readonly utterance: (text: string) => FakeUtterance;
}

/**
 * Construct a recording fake synthesis and its utterance factory.
 *
 * @returns The fake.
 */
const fakeSynthesis = (): FakeSynthesis => {
  const calls: string[] = [];
  const spokenUtterances: FakeUtterance[] = [];
  const made = new Map<ReadAloudUtterance, FakeUtterance>();

  return {
    calls,
    finish: () => {
      for (const utterance of spokenUtterances) {
        for (const listener of utterance.listeners.end) {
          listener();
        }
      }
    },
    spoken: spokenUtterances,
    synthesis: {
      cancel: () => {
        calls.push("cancel");
      },
      pause: () => {
        calls.push("pause");
      },
      resume: () => {
        calls.push("resume");
      },
      speak: (utterance) => {
        calls.push("speak");

        const fake = made.get(utterance);

        assert.isDefined(fake, "the engine speaks only utterances its factory made");
        spokenUtterances.push(fake);
      },
    },
    texts: () => spokenUtterances.map((utterance) => utterance.text),
    utterance: (text) => {
      const listeners: FakeUtterance["listeners"] = { end: [], error: [] };
      const fake: FakeUtterance = {
        addEventListener: (type, listener) => {
          listeners[type].push(listener);
        },
        lang: "",
        listeners,
        text,
      };

      made.set(fake, fake);

      return fake;
    },
  };
};

/**
 * The spoken texts of the whole fixture item for a computer-read-aloud candidate, in document
 * order: the `sub` alias in place of `W3C`, `QTI` spelled out, the suppressed paragraph left out,
 * and the choices' labels.
 */
const wholeReading = [
  "The ",
  "World Wide Web Consortium",
  " publishes the format ",
  "Q T I",
  " builds on.",
  "Which body publishes it?",
  "A standards body",
  "A publisher",
  "A library, ",
  "une bibliothèque",
];

/**
 * The text the fixture's `data-qti-suppress-tts="computer-read-aloud"` paragraph holds.
 */
const suppressedText = "Only a screen reader reads this note.";

/**
 * Serialise an item root for comparison with the live region's text blanked, since the live region
 * is the one place the controller writes, by design, and what it writes is an announcement.
 *
 * @param root The item root.
 * @returns The root's `outerHTML` with the live region emptied.
 */
const snapshot = (root: HTMLElement): string => {
  const copy = root.cloneNode(true);

  assert.instanceOf(copy, HTMLElement);

  const live = copy.querySelector(`[data-slot="${liveSlot}"]`);

  if (live !== null) {
    live.textContent = "";
  }

  return copy.outerHTML;
};

/**
 * The text of an item's live region.
 *
 * @param root The item root.
 * @returns The live region's text, or `undefined` without one.
 */
const liveText = (root: HTMLElement): string | undefined =>
  root.querySelector(`[data-slot="${liveSlot}"]`)?.textContent;

describe(server.browser, () => {
  describe("the read-aloud engine", () => {
    it.effect("[A-40b] nothing speaks until the candidate plays", () =>
      Effect.gen(function* nothingUntilPlay() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        yield* Effect.promise(frames);

        assert.isTrue(controller.available);
        assert.strictEqual(controller.state, "idle");
        assert.deepStrictEqual(fake.calls, []);
        assert.strictEqual(liveText(root), "");

        controller.teardown();
        unmount(root);
      }),
    );

    it.effect("[A-40b] play speaks each segment's spoken text in document order", () =>
      Effect.gen(function* playSpeaksThePlan() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        controller.play();

        assert.deepStrictEqual(fake.texts(), wholeReading);
        assert.deepStrictEqual(
          fake.spoken.map((utterance) => utterance.lang),
          wholeReading.map((text) => (text === "une bibliothèque" ? "fr" : "en")),
        );
        assert.strictEqual(controller.state, "speaking");
        assert.deepStrictEqual(
          fake.calls,
          wholeReading.map(() => "speak"),
        );

        controller.teardown();
        unmount(root);
      }),
    );

    it.effect("[A-40b] pause, resume and stop drive the synthesis and the state", () =>
      Effect.gen(function* pauseResumeStop() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        controller.pause();
        controller.resume();
        controller.stop();
        assert.deepStrictEqual(fake.calls, [], "idle takes no pause, resume or stop");

        controller.play();
        controller.pause();
        assert.strictEqual(fake.calls.at(-1), "pause");
        assert.strictEqual(controller.state, "paused");

        controller.pause();
        assert.strictEqual(fake.calls.filter((call) => call === "pause").length, 1);

        controller.resume();
        assert.strictEqual(fake.calls.at(-1), "resume");
        assert.strictEqual(controller.state, "speaking");

        controller.resume();
        assert.strictEqual(fake.calls.filter((call) => call === "resume").length, 1);

        controller.stop();
        assert.strictEqual(fake.calls.at(-1), "cancel");
        assert.strictEqual(controller.state, "idle");

        const before = fake.spoken.length;

        controller.play();
        assert.deepStrictEqual(fake.texts().slice(before), wholeReading);
        assert.strictEqual(controller.state, "speaking");

        controller.teardown();
        unmount(root);
      }),
    );

    it.effect("[A-40b] play from an element starts the reading there", () =>
      Effect.gen(function* playFromAnElement() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });
        const [, second] = root.querySelectorAll('[data-slot="choice-interaction-choice"]');

        assert.isDefined(second);

        controller.play(second);
        assert.deepStrictEqual(fake.texts(), ["A publisher", "A library, ", "une bibliothèque"]);

        const spokenSoFar = fake.spoken.length;
        const emphasis = root.querySelector("em");

        assert.isNotNull(emphasis);

        controller.play(emphasis);
        assert.deepStrictEqual(fake.texts().slice(spokenSoFar), ["une bibliothèque"]);

        const afterEmphasis = fake.spoken.length;

        controller.play(document.body);
        assert.deepStrictEqual(fake.texts().slice(afterEmphasis), wholeReading);

        controller.teardown();
        unmount(root);
      }),
    );

    it.effect("[A-40f] content suppressed for computer read-aloud is never spoken", () =>
      Effect.gen(function* suppressedNeverSpoken() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        assert.include(root.textContent, suppressedText);

        controller.play();

        const texts = fake.texts();

        assert.isAbove(texts.length, 0);

        for (const text of texts) {
          assert.notInclude(text, suppressedText);
          assert.notInclude(text, "screen reader");
        }

        assert.include(texts, "Which body publishes it?");
        assert.strictEqual(
          texts.indexOf("Which body publishes it?"),
          texts.indexOf(" builds on.") + 1,
        );

        controller.teardown();
        unmount(root);
      }),
    );

    it.effect("[A-40f] suppressTts in the supports makes the controller unavailable", () =>
      Effect.gen(function* suppressTtsUnavailable() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: { ...computerReadAloud, suppressTts: true },
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        assert.isFalse(controller.available);

        controller.play();
        controller.pause();
        controller.resume();
        controller.stop();

        assert.deepStrictEqual(fake.calls, []);
        assert.strictEqual(controller.state, "idle");

        controller.teardown();
        unmount(root);
      }),
    );

    it.effect(
      "[A-40a] for a screen-reader candidate the controller is unavailable and speaks nothing",
      () =>
        Effect.gen(function* screenReaderUnavailable() {
          const root = mount(yield* renderedFixture);

          for (const supports of [spoken("screen-reader"), noSupports]) {
            const fake = fakeSynthesis();
            const controller = readAloud(root, {
              supports,
              synthesis: fake.synthesis,
              utterance: fake.utterance,
            });

            assert.isFalse(controller.available);

            controller.play();

            assert.deepStrictEqual(fake.calls, []);
            assert.deepStrictEqual(fake.texts(), []);
            assert.strictEqual(controller.state, "idle");

            controller.teardown();
          }

          unmount(root);
        }),
    );

    it.effect(
      "[A-40a] [A-40b] the item's DOM is unchanged: no pronunciation in aria-label or hidden text",
      () =>
        Effect.gen(function* domUnchanged() {
          const html = yield* renderedFixture;

          for (const readingType of ["computer-read-aloud", "screen-reader"] as const) {
            const root = mount(html);
            const before = snapshot(root);
            const labelled = root.querySelectorAll("[aria-label], [aria-labelledby]").length;
            const fake = fakeSynthesis();
            const controller = readAloud(root, {
              supports: spoken(readingType),
              synthesis: fake.synthesis,
              utterance: fake.utterance,
            });

            controller.play();
            controller.pause();
            controller.resume();
            controller.stop();
            controller.play();
            controller.teardown();
            yield* Effect.promise(frames);

            assert.strictEqual(snapshot(root), before, readingType);
            assert.strictEqual(
              root.querySelectorAll("[aria-label], [aria-labelledby]").length,
              labelled,
              readingType,
            );
            assert.strictEqual(
              root.querySelectorAll(".qti-visually-hidden").length,
              0,
              readingType,
            );
            assert.notInclude(root.textContent, "World Wide Web Consortium", readingType);
            assert.notInclude(root.textContent, "Q T I", readingType);
            assert.include(root.textContent, "W3C", readingType);

            for (const named of root.querySelectorAll("[aria-label]")) {
              assert.notInclude(
                named.getAttribute("aria-label") ?? "",
                "World Wide Web Consortium",
                readingType,
              );
            }

            unmount(root);
          }
        }),
    );

    it.effect(
      "[A-40b] state changes are announced through the item's live region and focus never moves",
      () =>
        Effect.gen(function* announcedNotFocused() {
          const root = mount(yield* renderedFixture);
          const fake = fakeSynthesis();
          const focused: EventTarget[] = [];
          const record = (event: FocusEvent) => {
            focused.push(event.target ?? document);
          };
          const activeBefore = document.activeElement;

          document.addEventListener("focusin", record);

          const controller = readAloud(root, {
            supports: computerReadAloud,
            synthesis: fake.synthesis,
            utterance: fake.utterance,
          });

          controller.play();
          yield* Effect.promise(frames);
          assert.strictEqual(liveText(root), "Reading aloud");

          controller.pause();
          yield* Effect.promise(frames);
          assert.strictEqual(liveText(root), "Paused");

          controller.resume();
          yield* Effect.promise(frames);
          assert.strictEqual(liveText(root), "Reading aloud");

          controller.stop();
          yield* Effect.promise(frames);
          assert.strictEqual(liveText(root), "Stopped");

          document.removeEventListener("focusin", record);
          assert.strictEqual(document.activeElement, activeBefore);
          assert.deepStrictEqual(focused, []);

          controller.teardown();
          unmount(root);
        }),
    );

    it.effect("[A-40b] the reading ends by itself when the last utterance ends", () =>
      Effect.gen(function* endsByItself() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        controller.play();
        controller.stop();

        const stoppedCalls = fake.calls.length;

        fake.finish();
        assert.strictEqual(controller.state, "idle");
        assert.strictEqual(
          fake.calls.length,
          stoppedCalls,
          "a cancelled run's events change nothing",
        );

        const before = fake.spoken.length;

        controller.play();
        assert.strictEqual(controller.state, "speaking");

        const [first] = fake.spoken.slice(before);

        assert.isDefined(first);

        for (const listener of first.listeners.end) {
          listener();
        }

        assert.strictEqual(
          controller.state,
          "speaking",
          "one utterance's end is not the reading's",
        );

        fake.finish();
        yield* Effect.promise(frames);
        assert.strictEqual(controller.state, "idle");
        assert.strictEqual(liveText(root), "Stopped");
        assert.notInclude(
          fake.calls.slice(stoppedCalls),
          "cancel",
          "a reading that ends by itself is not cancelled",
        );

        controller.teardown();
        unmount(root);
      }),
    );

    it("[A-40b] the runtime entry exports readAloud", () => {
      assert.isFunction(entryReadAloud);
      assert.strictEqual(entryReadAloud, readAloud);
    });
  });
});
