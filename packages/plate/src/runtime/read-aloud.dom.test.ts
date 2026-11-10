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
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { redact, render } from "#plate/render.ts";
import { readAloud as entryReadAloud } from "#plate/runtime.dom.ts";
import { liveSlot } from "#plate/runtime/announce.dom.ts";
import { readAloud } from "#plate/runtime/read-aloud.dom.ts";
import type {
  ReadAloud,
  ReadAloudSynthesis,
  ReadAloudUtterance,
  ReadAloudVoice,
} from "#plate/runtime/read-aloud.dom.ts";
import { noSupports } from "#plate/supports.ts";
import type {
  LinkIndication,
  ReadingType,
  RestrictionType,
  SpokenPreferences,
  Supports,
  TypingEcho,
} from "#plate/supports.ts";
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
 * whether it is paused, and a way to end the utterances.
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
   * Whether the synthesis is in the paused state, as the Web Speech API keeps it: `pause` sets it,
   * `resume` clears it, and `cancel` leaves it as it is, so a queued utterance does not sound
   * while it stands.
   */
  readonly paused: () => boolean;
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
  let paused = false;

  return {
    calls,
    finish: () => {
      for (const utterance of spokenUtterances) {
        for (const listener of utterance.listeners.end) {
          listener();
        }
      }
    },
    paused: () => paused,
    spoken: spokenUtterances,
    synthesis: {
      cancel: () => {
        calls.push("cancel");
      },
      pause: () => {
        calls.push("pause");
        paused = true;
      },
      resume: () => {
        calls.push("resume");
        paused = false;
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

    it.effect(
      "[A-40b] play after pause resumes synthesis before speaking, so the new utterances sound",
      () =>
        Effect.gen(function* playAfterPause() {
          const root = mount(yield* renderedFixture);
          const fake = fakeSynthesis();
          const controller = readAloud(root, {
            supports: computerReadAloud,
            synthesis: fake.synthesis,
            utterance: fake.utterance,
          });

          controller.play();
          controller.pause();
          assert.isTrue(fake.paused());

          const callsAtPause = fake.calls.length;
          const spokenAtPause = fake.spoken.length;

          controller.play();
          assert.deepStrictEqual(fake.calls.slice(callsAtPause), [
            "cancel",
            "resume",
            ...wholeReading.map(() => "speak"),
          ]);
          assert.isFalse(fake.paused());
          assert.deepStrictEqual(fake.texts().slice(spokenAtPause), wholeReading);
          assert.strictEqual(controller.state, "speaking");

          controller.teardown();
          unmount(root);
        }),
    );

    it.effect(
      "[A-40b] stop from the paused state leaves synthesis unpaused: cancel, then resume",
      () =>
        Effect.gen(function* stopFromPaused() {
          const root = mount(yield* renderedFixture);
          const fake = fakeSynthesis();
          const controller = readAloud(root, {
            supports: computerReadAloud,
            synthesis: fake.synthesis,
            utterance: fake.utterance,
          });

          controller.play();
          controller.pause();
          assert.isTrue(fake.paused());

          const callsAtPause = fake.calls.length;

          controller.stop();
          assert.deepStrictEqual(fake.calls.slice(callsAtPause), ["cancel", "resume"]);
          assert.isFalse(fake.paused());
          assert.strictEqual(controller.state, "idle");

          yield* Effect.promise(frames);
          assert.strictEqual(liveText(root), "Stopped");

          controller.teardown();
          unmount(root);
        }),
    );

    it.effect("[A-40b] teardown from the paused state leaves synthesis unpaused", () =>
      Effect.gen(function* teardownFromPaused() {
        const root = mount(yield* renderedFixture);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        controller.play();
        controller.pause();
        assert.isTrue(fake.paused());
        yield* Effect.promise(frames);

        const announced = liveText(root);
        const callsAtPause = fake.calls.length;

        assert.strictEqual(announced, "Paused");

        controller.teardown();
        assert.deepStrictEqual(fake.calls.slice(callsAtPause), ["cancel", "resume"]);
        assert.isFalse(fake.paused());
        assert.strictEqual(controller.state, "idle");

        yield* Effect.promise(frames);
        assert.strictEqual(liveText(root), announced, "a teardown announces nothing");

        unmount(root);
      }),
    );

    it.effect("[A-40b] pause, stop, play speaks from the beginning, unpaused", () =>
      Effect.gen(function* pauseStopPlay() {
        const root = mount(yield* renderedFixture);
        const before = snapshot(root);
        const fake = fakeSynthesis();
        const controller = readAloud(root, {
          supports: computerReadAloud,
          synthesis: fake.synthesis,
          utterance: fake.utterance,
        });

        controller.play();
        controller.pause();
        controller.stop();

        const spokenAtStop = fake.spoken.length;

        controller.play();
        assert.deepStrictEqual(fake.texts().slice(spokenAtStop), wholeReading);
        assert.isFalse(fake.paused());
        assert.strictEqual(controller.state, "speaking");

        yield* Effect.promise(frames);
        assert.strictEqual(snapshot(root), before);

        controller.teardown();
        unmount(root);
      }),
    );

    it.effect(
      "[A-40b] an exit from speaking cancels alone: stop and teardown while speaking call no resume",
      () =>
        Effect.gen(function* exitFromSpeaking() {
          const root = mount(yield* renderedFixture);
          const fake = fakeSynthesis();
          const controller = readAloud(root, {
            supports: computerReadAloud,
            synthesis: fake.synthesis,
            utterance: fake.utterance,
          });

          controller.play();

          const callsAtPlay = fake.calls.length;

          controller.stop();
          assert.deepStrictEqual(fake.calls.slice(callsAtPlay), ["cancel"]);
          assert.isFalse(fake.paused());

          const callsAtStop = fake.calls.length;

          controller.teardown();
          assert.deepStrictEqual(fake.calls.slice(callsAtStop), [], "idle calls nothing");

          controller.play();

          const callsAtSecondPlay = fake.calls.length;

          controller.teardown();
          assert.deepStrictEqual(fake.calls.slice(callsAtSecondPlay), ["cancel"]);
          assert.isFalse(fake.paused());
          assert.notInclude(fake.calls, "resume");

          unmount(root);
        }),
    );

    it("[A-40b] the runtime entry exports readAloud", () => {
      assert.isFunction(entryReadAloud);
      assert.strictEqual(entryReadAloud, readAloud);
    });
  });
});

/**
 * The fixture item of issue m5-13, relative to the package.
 */
const spokenItem = "fixtures/m5/items/spoken.xml";

/**
 * Render the spoken fixture item as plate's SSR writes it, with the default configuration.
 *
 * @returns The item's HTML.
 */
const renderedSpoken = Effect.gen(function* renderSpokenFixture() {
  const bytes = new TextEncoder().encode(
    yield* Effect.promise(() => commands.readFile(spokenItem)),
  );
  const accepted = Option.getOrThrow(acceptedItem(yield* open(spokenItem, bytes)));
  const configuration = yield* configure({});

  return Result.getOrThrow(render(redact(accepted), configuration, { instance: "w0d" })).html;
});

/**
 * Construct a candidate's spoken preferences: the PNP's defaults, a computer read-aloud reading
 * type, and the changes given.
 *
 * @param changes The preferences to set.
 * @returns The spoken preferences.
 */
const preferences = (changes: Partial<SpokenPreferences> = {}): SpokenPreferences => ({
  linkIndication: Option.none(),
  pitch: 0.5,
  readingType: "computer-read-aloud",
  restrictions: new Set(),
  speechRate: 180,
  typingEcho: Option.none(),
  volume: 0.5,
  ...changes,
});

/**
 * A controller on a mounted item and the fake it speaks through.
 */
interface Attached {
  readonly controller: ReadAloud;
  readonly fake: FakeSynthesis;
  readonly root: HTMLElement;
}

/**
 * Mount an item and attach a controller to it with a recording fake.
 *
 * @param html The item's HTML.
 * @param spokenPreferences The `spoken` option, none for the option left out.
 * @param supports The supports, a computer-read-aloud candidate's by default.
 * @param voices The voices the fake offers, none for a fake that lists none.
 * @returns The mounted item, the controller and the fake.
 */
const attach = (
  html: string,
  spokenPreferences?: SpokenPreferences,
  supports: Supports = computerReadAloud,
  voices?: readonly ReadAloudVoice[],
): Attached => {
  const root = mount(html);
  const fake = fakeSynthesis();
  const common = {
    supports,
    synthesis:
      voices === undefined ? fake.synthesis : { ...fake.synthesis, getVoices: () => voices },
    utterance: fake.utterance,
  };
  const controller =
    spokenPreferences === undefined
      ? readAloud(root, common)
      : readAloud(root, { ...common, spoken: spokenPreferences });

  return { controller, fake, root };
};

/**
 * End a test's attachment: release the controller and remove the item.
 *
 * @param attached The attachment.
 */
const detach = ({ controller, root }: Attached): void => {
  controller.teardown();
  unmount(root);
};

/**
 * Focus a text control of a mounted item and type keys into it, as a candidate does.
 *
 * @param root The item root.
 * @param selector The control's selector.
 * @param keys The keys, in `userEvent.keyboard`'s syntax.
 * @returns A promise settled when the keys were typed.
 */
const typeInto = async (root: HTMLElement, selector: string, keys: string): Promise<void> => {
  const control = root.querySelector(selector);

  assert.instanceOf(control, HTMLElement);
  control.focus();
  await userEvent.keyboard(keys);
};

/**
 * The selector of the Text Entry's input in the spoken fixture.
 */
const textEntryControl = '[data-slot="text-entry-interaction-control"]';

/**
 * The selector of the Extended Text's textarea in the spoken fixture.
 */
const extendedTextControl = '[data-slot="extended-text-interaction-control"]';

/**
 * The spoken texts of the whole spoken fixture item for a computer-read-aloud candidate under no
 * preference: the link's text and the emphasised word are text runs of their own.
 */
const spokenWhole = [
  "Read the ",
  "style guide",
  " before you write.",
  "The ",
  "quick",
  " answer is best.",
  "Your name: ",
  "Describe your day in two sentences.",
];

/**
 * A formula as an HTML parser reads MathML into a page, which the spoken fixture cannot hold
 * until the MathML module renders (issue m3e-05): the engine reads the DOM, whatever wrote it.
 */
const formula = "<p>Solve <math><mi>x</mi><mo>+</mo><mn>1</mn></math> now.</p>";

/**
 * Two rubric blocks as issue m3e-01 writes them, a `div` with `data-use` and `data-view`, which the
 * spoken fixture cannot hold until the Rubric Block module renders.
 */
const rubrics =
  '<div data-use="instructions" data-view="candidate"><p>Answer in one line.</p></div>' +
  '<div data-use="navigation" data-view="candidate"><p>Use Next to move on.</p></div>';

/**
 * Put markup in front of an item's first paragraph.
 *
 * @param root The item root.
 * @param html The markup.
 */
const insertFirst = (root: HTMLElement, html: string): void => {
  const first = root.querySelector("p");

  assert.isNotNull(first);
  first.insertAdjacentHTML("beforebegin", html);
};

/**
 * Put markup after an item's second paragraph.
 *
 * @param root The item root.
 * @param html The markup.
 */
const insertAfterSecond = (root: HTMLElement, html: string): void => {
  const [, second] = root.querySelectorAll("p");

  assert.isDefined(second);
  second.insertAdjacentHTML("afterend", html);
};

describe(server.browser, () => {
  describe("the candidate's spoken preferences (issue m5-13)", () => {
    it.effect("[A-40d] rate, pitch and volume reach each utterance", () =>
      Effect.gen(function* prosodyReaches() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ pitch: 0.75, speechRate: 270, volume: 0.9 }),
        );

        attached.controller.play();

        assert.deepStrictEqual(attached.fake.texts(), spokenWhole);

        for (const utterance of attached.fake.spoken) {
          assert.strictEqual(utterance.rate, 1.5, utterance.text);
          assert.strictEqual(utterance.pitch, 1.5, utterance.text);
          assert.strictEqual(utterance.volume, 0.9, utterance.text);
        }

        detach(attached);
      }),
    );

    it.effect("[A-40d] without spoken preferences the defaults apply", () =>
      Effect.gen(function* defaultsApply() {
        const attached = attach(yield* renderedSpoken);

        attached.controller.play();

        assert.deepStrictEqual(attached.fake.texts(), spokenWhole);

        for (const utterance of attached.fake.spoken) {
          assert.strictEqual(utterance.rate, 1, utterance.text);
          assert.strictEqual(utterance.pitch, 1, utterance.text);
          assert.strictEqual(utterance.volume, 0.5, utterance.text);
        }

        detach(attached);
      }),
    );

    it.effect("[A-40d] rate, pitch and volume are held within the Web Speech bounds", () =>
      Effect.gen(function* boundsHold() {
        const html = yield* renderedSpoken;
        const cases: readonly {
          readonly change: Pick<SpokenPreferences, "pitch" | "speechRate" | "volume">;
          readonly want: readonly (number | undefined)[];
        }[] = [
          { change: { pitch: 9, speechRate: 99_999, volume: 4 }, want: [10, 2, 1] },
          { change: { pitch: -1, speechRate: 1, volume: -2 }, want: [0.1, 0, 0] },
          {
            change: { pitch: Number.NaN, speechRate: Number.NaN, volume: Number.NaN },
            want: [1, 1, 0.5],
          },
        ];

        for (const { change, want } of cases) {
          const attached = attach(html, preferences(change));

          attached.controller.play();

          const [first] = attached.fake.spoken;

          assert.isDefined(first);
          assert.deepStrictEqual([first.rate, first.pitch, first.volume], want);
          detach(attached);
        }
      }),
    );

    /*
     * Section 5's rows for the formula and the instructions rubric read SSR output, which the base
     * cannot write: m3e-05 (MathML) and m3e-01 (Rubric Block) are not on renderer/m5/main, so they
     * wait as todos, and the rows after them prove the same engine rules on spliced markup.
     */
    it.todo(
      "[A-40c] skip-math-equations passes over the formula in silence (todo: needs m3e-05 MathML on renderer/m5/main)",
    );

    it.todo(
      "[A-40c] directions-only reads only prompts and instruction rubrics (todo: needs m3e-01 Rubric Block on renderer/m5/main)",
    );

    it.effect(
      "[A-40c] skip-math and skip-chemistry equations pass over a spliced math element in silence",
      () =>
        Effect.gen(function* skipsMath() {
          const html = yield* renderedSpoken;

          for (const restriction of ["skip-math-equations", "skip-chemistry-equations"] as const) {
            const attached = attach(html, preferences({ restrictions: new Set([restriction]) }));

            insertAfterSecond(attached.root, formula);
            attached.controller.play();

            const texts = attached.fake.texts();

            assert.deepStrictEqual(
              texts,
              [
                "Read the ",
                "style guide",
                " before you write.",
                "The ",
                "quick",
                " answer is best.",
                "Solve ",
                " now.",
                "Your name: ",
                "Describe your day in two sentences.",
              ],
              restriction,
            );

            for (const piece of ["x", "+", "1"]) {
              assert.notInclude(texts, piece, restriction);
            }

            detach(attached);
          }

          const unrestricted = attach(html, preferences());

          insertAfterSecond(unrestricted.root, formula);
          unrestricted.controller.play();
          assert.deepStrictEqual(unrestricted.fake.texts().slice(6, 11), [
            "Solve ",
            "x",
            "+",
            "1",
            " now.",
          ]);
          detach(unrestricted);
        }),
    );

    it.effect("[A-40c] word-by-word reads only the chosen word", () =>
      Effect.gen(function* wordByWord() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ restrictions: new Set(["word-by-word"]) }),
        );
        const word = attached.root.querySelector("em");

        assert.isNotNull(word);
        attached.controller.play(word);

        assert.deepStrictEqual(attached.fake.texts(), ["quick"]);
        assert.strictEqual(attached.controller.state, "speaking");

        attached.fake.finish();
        assert.strictEqual(attached.controller.state, "idle");

        const link = attached.root.querySelector("a");

        assert.isNotNull(link);
        attached.controller.play(link);
        assert.deepStrictEqual(attached.fake.texts(), ["quick", "style guide"]);

        attached.fake.finish();
        detach(attached);
      }),
    );

    it.effect("[A-40c] word-by-word reads nothing when no word is chosen", () =>
      Effect.gen(function* noWordChosen() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ restrictions: new Set(["word-by-word"]) }),
        );
        const input = attached.root.querySelector(textEntryControl);

        assert.isNotNull(input);
        attached.controller.play();
        attached.controller.play(attached.root);
        attached.controller.play(document.body);
        attached.controller.play(input);

        assert.deepStrictEqual(attached.fake.texts(), []);
        assert.strictEqual(attached.controller.state, "idle");
        detach(attached);
      }),
    );

    it.effect("[A-40c] directions-only reads only the prompt of the rendered item", () =>
      Effect.gen(function* directionsOnlyRendered() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ restrictions: new Set(["directions-only"]) }),
        );

        attached.controller.play();

        assert.deepStrictEqual(attached.fake.texts(), ["Describe your day in two sentences."]);
        detach(attached);
      }),
    );

    it.effect(
      "[A-40c] directions-only reads a spliced instructions rubric and the prompt, not a navigation rubric",
      () =>
        Effect.gen(function* directionsOnly() {
          const attached = attach(
            yield* renderedSpoken,
            preferences({ restrictions: new Set(["directions-only"]) }),
          );

          insertFirst(attached.root, rubrics);
          attached.controller.play();

          assert.deepStrictEqual(attached.fake.texts(), [
            "Answer in one line.",
            "Describe your day in two sentences.",
          ]);
          detach(attached);
        }),
    );

    it.effect("[A-40c] unrestricted, and an ext: restriction, read the whole item", () =>
      Effect.gen(function* unrestricted() {
        const html = yield* renderedSpoken;

        const cases: readonly ReadonlySet<RestrictionType>[] = [
          new Set(),
          new Set(["unrestricted"]),
          new Set(["unrestricted", "ext:slow-reveal"]),
        ];

        for (const restrictions of cases) {
          const attached = attach(html, preferences({ restrictions }));

          attached.controller.play();
          assert.deepStrictEqual(attached.fake.texts(), spokenWhole, [...restrictions].join(" "));
          detach(attached);
        }
      }),
    );

    it.effect(
      "[A-40c] restrictions combine: word-by-word with a spliced formula passed over, and with directions-only",
      () =>
        Effect.gen(function* combine() {
          const html = yield* renderedSpoken;
          const mathAndWord = attach(
            html,
            preferences({ restrictions: new Set(["skip-math-equations", "word-by-word"]) }),
          );

          insertAfterSecond(mathAndWord.root, formula);

          const digit = mathAndWord.root.querySelector("mn");
          const word = mathAndWord.root.querySelector("em");

          assert.isNotNull(digit);
          assert.isNotNull(word);
          mathAndWord.controller.play(digit);
          assert.deepStrictEqual(mathAndWord.fake.texts(), [], "the formula is passed over");
          mathAndWord.controller.play(word);
          assert.deepStrictEqual(mathAndWord.fake.texts(), ["quick"]);
          detach(mathAndWord);

          const directionsAndWord = attach(
            html,
            preferences({ restrictions: new Set(["directions-only", "word-by-word"]) }),
          );
          const emphasis = directionsAndWord.root.querySelector("em");
          const prompt = directionsAndWord.root.querySelector('[data-slot$="-prompt"]');

          assert.isNotNull(emphasis);
          assert.isNotNull(prompt);
          directionsAndWord.controller.play(emphasis);
          assert.deepStrictEqual(
            directionsAndWord.fake.texts(),
            [],
            "a word outside the directions",
          );
          directionsAndWord.controller.play(prompt);
          assert.deepStrictEqual(directionsAndWord.fake.texts(), [
            "Describe your day in two sentences.",
          ]);
          detach(directionsAndWord);
        }),
    );

    it.effect("[A-40d] speak-link says link before a link's text", () =>
      Effect.gen(function* speakLink() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ linkIndication: Option.some("speak-link") }),
        );

        attached.controller.play();

        const texts = attached.fake.texts();
        const linked = texts.findIndex((text) => text.endsWith("style guide"));

        assert.strictEqual(texts[linked], "link style guide");
        assert.isTrue(texts[linked]?.startsWith("link"));
        assert.deepStrictEqual(
          texts.filter((_, index) => index !== linked),
          spokenWhole.filter((text) => text !== "style guide"),
          "no other utterance changes",
        );
        detach(attached);
      }),
    );

    it.effect("[A-40d] speak-link says link once, before the first text of a link of several", () =>
      Effect.gen(function* oneLinkWord() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ linkIndication: Option.some("speak-link") }),
        );

        attached.root
          .querySelector("a")
          ?.replaceChildren(
            ...new DOMParser().parseFromString("<b>see</b> the <i>guide</i>", "text/html").body
              .childNodes,
          );
        attached.controller.play();

        assert.deepStrictEqual(attached.fake.texts().slice(0, 6), [
          "Read the ",
          "link see",
          " the ",
          "guide",
          " before you write.",
          "The ",
        ]);
        detach(attached);
      }),
    );

    it.effect(
      "[A-40d] sound-effect marks a link as speak-link does, and none reads it as text",
      () =>
        Effect.gen(function* otherIndications() {
          const html = yield* renderedSpoken;
          const soundEffect = attach(
            html,
            preferences({ linkIndication: Option.some("sound-effect") }),
          );

          soundEffect.controller.play();
          assert.include(soundEffect.fake.texts(), "link style guide");
          detach(soundEffect);

          const unmarked: readonly Option.Option<LinkIndication>[] = [
            Option.some("none"),
            Option.none(),
          ];

          for (const linkIndication of unmarked) {
            const attached = attach(html, preferences({ linkIndication }));

            attached.controller.play();
            assert.deepStrictEqual(attached.fake.texts(), spokenWhole);
            detach(attached);
          }
        }),
    );

    it.effect("[A-40d] different-voice reads the link text in the synthesis's second voice", () =>
      Effect.gen(function* differentVoice() {
        const first: ReadAloudVoice = { default: true, lang: "en-US", name: "Alpha" };
        const second: ReadAloudVoice = { default: false, lang: "en-US", name: "Beta" };
        const html = yield* renderedSpoken;
        const attached = attach(
          html,
          preferences({ linkIndication: Option.some("different-voice") }),
          computerReadAloud,
          [first, second],
        );

        attached.controller.play();
        assert.deepStrictEqual(
          attached.fake.texts(),
          spokenWhole,
          "no link word with a second voice",
        );
        assert.deepStrictEqual(
          attached.fake.spoken.map((utterance) => utterance.voice),
          spokenWhole.map((text) => (text === "style guide" ? second : undefined)),
        );
        detach(attached);

        for (const voices of [undefined, [first]]) {
          const single = attach(
            html,
            preferences({ linkIndication: Option.some("different-voice") }),
            computerReadAloud,
            voices,
          );

          single.controller.play();
          assert.include(
            single.fake.texts(),
            "link style guide",
            "a single voice reads as speak-link",
          );
          assert.isTrue(single.fake.spoken.every((utterance) => utterance.voice === undefined));
          detach(single);
        }
      }),
    );

    it.effect("[A-40e] typing-echo words speaks each completed word typed in a text entry", () =>
      Effect.gen(function* echoWords() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ typingEcho: Option.some("words") }),
        );

        yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "two words "));

        assert.deepStrictEqual(attached.fake.texts(), ["two", "words"]);
        assert.strictEqual(attached.controller.state, "idle", "the echo is no reading");
        assert.deepStrictEqual(attached.fake.calls, ["speak", "speak"]);

        for (const utterance of attached.fake.spoken) {
          assert.strictEqual(utterance.rate, 1);
          assert.strictEqual(utterance.lang, "en");
        }

        detach(attached);
      }),
    );

    it.effect(
      "[A-40e] typing-echo words completes a word on punctuation and keeps apostrophes inside",
      () =>
        Effect.gen(function* echoPunctuation() {
          const attached = attach(
            yield* renderedSpoken,
            preferences({ typingEcho: Option.some("words") }),
          );

          yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "don't, stop. go"));

          assert.deepStrictEqual(
            attached.fake.texts(),
            ["don't", "stop"],
            "the word being typed is not yet complete",
          );
          detach(attached);
        }),
    );

    it.effect("[A-40e] typing-echo words speaks the last word of a line in an extended text", () =>
      Effect.gen(function* echoLine() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ typingEcho: Option.some("words") }),
        );

        yield* Effect.promise(() => typeInto(attached.root, extendedTextControl, "hi, yo{Enter}"));

        assert.deepStrictEqual(attached.fake.texts(), ["hi", "yo"]);
        detach(attached);
      }),
    );

    it.effect("[A-40e] typing-echo characters speaks each character typed", () =>
      Effect.gen(function* echoCharacters() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ typingEcho: Option.some("characters") }),
        );

        yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "ab c"));

        assert.deepStrictEqual(attached.fake.texts(), ["a", "b", "space", "c"]);
        detach(attached);
      }),
    );

    it.effect("[A-40e] typing-echo characters-and-words speaks each character and each word", () =>
      Effect.gen(function* echoBoth() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ typingEcho: Option.some("characters-and-words") }),
        );

        yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "ab "));

        assert.deepStrictEqual(attached.fake.texts(), ["a", "b", "space", "ab"]);
        detach(attached);
      }),
    );

    it.effect("[A-40e] typing-echo none, and no typing echo, speak nothing", () =>
      Effect.gen(function* echoOff() {
        const html = yield* renderedSpoken;

        const silent: readonly Option.Option<TypingEcho>[] = [Option.some("none"), Option.none()];

        for (const typingEcho of silent) {
          const attached = attach(html, preferences({ typingEcho }));

          yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "two words "));
          assert.deepStrictEqual(attached.fake.calls, []);
          detach(attached);
        }

        const absent = attach(html);

        yield* Effect.promise(() => typeInto(absent.root, textEntryControl, "two words "));
        assert.deepStrictEqual(absent.fake.calls, []);
        detach(absent);
      }),
    );

    it.effect("[A-40e] typing echo is off for a screen-reader reading type", () =>
      Effect.gen(function* echoOffForScreenReader() {
        const html = yield* renderedSpoken;
        const echoing = { typingEcho: Option.some("words" as const) };
        const attachments = [
          attach(
            html,
            preferences({ ...echoing, readingType: "screen-reader" }),
            spoken("screen-reader"),
          ),
          attach(
            html,
            preferences({ ...echoing, readingType: "screen-reader" }),
            computerReadAloud,
          ),
          attach(html, preferences(echoing), spoken("screen-reader")),
        ];

        for (const attached of attachments) {
          assert.isFalse(attached.controller.available);
          yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "two words "));
          assert.deepStrictEqual(attached.fake.calls, []);
          detach(attached);
        }
      }),
    );

    it.effect(
      "[A-40e] an option-only spoken is off at the start: no read-aloud support, no echo",
      () =>
        Effect.gen(function* optionOnly() {
          const attached = attach(
            yield* renderedSpoken,
            preferences({ typingEcho: Option.some("words") }),
            noSupports,
          );

          assert.isFalse(attached.controller.available);
          yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "two words "));
          assert.deepStrictEqual(attached.fake.calls, []);
          detach(attached);
        }),
    );

    it.effect("[A-40e] the echo waits out a pause and ends at teardown", () =>
      Effect.gen(function* echoPausedAndTornDown() {
        const attached = attach(
          yield* renderedSpoken,
          preferences({ typingEcho: Option.some("words") }),
        );

        attached.controller.play();
        attached.controller.pause();

        const reading = attached.fake.spoken.length;

        yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "held "));
        assert.strictEqual(attached.fake.spoken.length, reading, "nothing speaks under a pause");

        attached.controller.resume();
        yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "back "));
        assert.deepStrictEqual(attached.fake.texts().slice(reading), ["back"]);

        attached.controller.teardown();

        const afterTeardown = attached.fake.spoken.length;

        yield* Effect.promise(() => typeInto(attached.root, textEntryControl, "gone "));
        assert.strictEqual(attached.fake.spoken.length, afterTeardown);
        unmount(attached.root);
      }),
    );
  });
});
