/**
 * The read-aloud engine (A-40a, A-40b, A-40f): a controller a host attaches to one rendered item
 * that speaks the item's speech plan through the Web Speech API, and only when the candidate asks.
 *
 * The item's DOM is the plan's source: the rendered body carries `data-ssml`,
 * `data-qti-suppress-tts` and `lang` as the author wrote them, so {@link readAloud} maps the item
 * root to a `SourceElement` tree and hands it to `speechPlan`, which reads only the structural
 * fields. The plan's `spoken` text is what an utterance says; its `written` text stays what the
 * candidate sees. Nothing here writes into the item: no `aria-label`, no accessible name, no hidden
 * text, no control, no attribute. That is the braille defect this engine avoids: a pronunciation
 * written into an accessible name reaches a braille display and a screen reader as the item's text,
 * so a candidate reads `World Wide Web Consortium` where the item says `W3C`. The pronunciation
 * lives in the utterance alone.
 *
 * The controller is unavailable, and every call on it is a no-op, for a candidate whose spoken
 * support is off or whose reading type is `screen-reader` (A-40a: the candidate's own screen
 * reader speaks, and two voices would compete), when the supports suppress text-to-speech for the
 * whole item (A-40f), and when the page has no speech synthesis. It builds no control: the host's
 * own buttons call `play`, `pause`, `resume` and `stop`. Each state change is announced through the
 * item's live region (`liveRegionOf`), never by moving focus. The strings are this module's, in
 * English (D7).
 *
 * A browser module: it value-imports from `effect` only `Option`.
 *
 * @module
 */
import { Option } from "effect";
import { xmlNamespace } from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { liveRegionOf, liveSlot } from "#plate/runtime/announce.dom.ts";
import { speechPlan } from "#plate/speech/plan.ts";
import type { Lexicon, SpeechSegment } from "#plate/speech/plan.ts";
import type { Supports } from "#plate/supports.ts";

/**
 * Where a controller stands: `idle` before the candidate plays and after a stop or the end of the
 * reading, `speaking` while utterances are queued or sounding, `paused` while the candidate holds
 * the reading.
 */
export type ReadAloudState = "idle" | "paused" | "speaking";

/**
 * The part of a `SpeechSynthesisUtterance` the engine touches: the language it sets from the
 * segment's nearest `lang`, and the `end` and `error` events that tell it an utterance is over.
 * `SpeechSynthesisUtterance` satisfies it; a test's fake needs nothing more.
 */
export interface ReadAloudUtterance {
  /**
   * Listen for the utterance's end: `end` when it was spoken, `error` when the engine dropped it.
   * Either settles the utterance once.
   *
   * @param type The event.
   * @param listener Called when the event fires.
   */
  readonly addEventListener: (type: "end" | "error", listener: () => void) => void;
  lang: string;
}

/**
 * The part of `SpeechSynthesis` the engine calls, so a host or a test passes a recording fake and
 * no speech engine runs. `globalThis.speechSynthesis` satisfies it and is the default.
 */
export interface ReadAloudSynthesis {
  /**
   * Drop every queued utterance and silence the one sounding; the engine then treats their `end`
   * and `error` events as over.
   */
  readonly cancel: () => void;
  /**
   * Hold the utterance sounding and the queue behind it.
   */
  readonly pause: () => void;
  /**
   * Let a held reading go on.
   */
  readonly resume: () => void;
  /**
   * Queue an utterance after those already queued. The method form is deliberate: TypeScript
   * compares a method's parameters bivariantly, which lets `globalThis.speechSynthesis`, whose
   * `speak` takes a `SpeechSynthesisUtterance`, stand as the default; the property form the lint
   * prefers would refuse it. The browser's own `speak` throws a `TypeError` for an utterance that
   * is not a `SpeechSynthesisUtterance`, so a host that passes its own `utterance` factory passes
   * the synthesis that speaks what it makes.
   *
   * @param utterance The utterance to queue.
   */
  // oxlint-disable-next-line typescript/method-signature-style -- A method's parameter is compared bivariantly, so `globalThis.speechSynthesis` (whose `speak` takes a `SpeechSynthesisUtterance`) satisfies the interface and is the default; the property form would refuse it.
  speak(utterance: ReadAloudUtterance): void;
}

/**
 * What a host hands {@link readAloud}: the candidate's supports (`readAloud` and `suppressTts` are
 * read), the lexicon whose aliases the spoken text takes, and the speech engine, the page's by
 * default.
 */
export interface ReadAloudOptions {
  /**
   * The PLS lexicon applied to the spoken text (A-35), none by default.
   */
  readonly lexicon?: Lexicon;
  /**
   * The supports the host enabled for the candidate: the controller is available only under a
   * `computer-read-aloud` reading type with `suppressTts` off.
   */
  readonly supports: Supports;
  /**
   * The synthesis to speak through, `globalThis.speechSynthesis` by default; without either, the
   * controller is unavailable.
   */
  readonly synthesis?: ReadAloudSynthesis;
  /**
   * Make the utterance for one spoken text, `new SpeechSynthesisUtterance(text)` by default.
   *
   * @param text The text to speak.
   * @returns The utterance, before its language is set.
   */
  readonly utterance?: (text: string) => ReadAloudUtterance;
}

/**
 * The read-aloud controller of one rendered item. Every method is a no-op while `available` is
 * false, and none moves focus or writes into the item.
 */
export interface ReadAloud {
  /**
   * Whether the candidate may read this item aloud: false for a `screen-reader` reading type, for
   * no spoken support, for `suppressTts`, and when no synthesis exists.
   */
  readonly available: boolean;
  /**
   * Hold the reading, when speaking: the synthesis pauses and the state is `paused`.
   */
  readonly pause: () => void;
  /**
   * Start reading: the item's plan is read from its DOM now, so content changed since attach is
   * spoken as it stands; a reading in progress is cancelled and this one starts from the beginning.
   * A segment the content withholds from computer read-aloud (`data-qti-suppress-tts`) is skipped,
   * and so is a pause segment, since the Web Speech API has no pause to queue and the gap between
   * utterances stands in.
   *
   * @param from The element the reading starts at, in document order; every segment before it is
   *   skipped. Absent, or outside the item, the reading starts at the item's beginning.
   */
  readonly play: (from?: Element) => void;
  /**
   * Let a held reading go on, when paused: the synthesis resumes and the state is `speaking`.
   */
  readonly resume: () => void;
  readonly state: ReadAloudState;
  /**
   * End the reading, when speaking or paused: the synthesis cancels its queue and the state is
   * `idle`. The next `play` starts from the beginning.
   */
  readonly stop: () => void;
  /**
   * Silence the reading and release the controller, before the item's markup is replaced. It
   * announces nothing, since the host is discarding the item's live region with the item.
   */
  readonly teardown: () => void;
}

/**
 * The announcement of each state the candidate drives the controller into, through the item's live
 * region: the module's own strings, in English, until a later pass centralises them (D7).
 */
const announcements: Readonly<Record<ReadAloudState, string>> = {
  idle: "Stopped",
  paused: "Paused",
  speaking: "Reading aloud",
};

/**
 * The speech engine a controller speaks through: a synthesis and the factory of its utterances.
 */
interface Engine {
  readonly synthesis: ReadAloudSynthesis;
  readonly utterance: (text: string) => ReadAloudUtterance;
}

/**
 * Resolve the engine from the options: the synthesis given, else the page's, and the utterance
 * factory given, else the page's constructor. None when neither the options nor the page has a
 * synthesis, which makes the controller unavailable.
 *
 * @param options The host's options.
 * @returns The engine, or none.
 */
const engineOf = (options: ReadAloudOptions): Option.Option<Engine> =>
  Option.map(
    Option.orElse(Option.fromNullishOr(options.synthesis), () =>
      Option.fromNullishOr(globalThis.speechSynthesis),
    ),
    (synthesis) => ({
      synthesis,
      utterance: options.utterance ?? ((text) => new SpeechSynthesisUtterance(text)),
    }),
  );

/**
 * Map a DOM attribute to a source attribute. HTML's `lang` is what the emitter wrote `xml:lang`
 * as, so it maps back to `xml:lang` in the XML namespace, where the plan reads a segment's
 * language.
 *
 * @param attribute The DOM attribute.
 * @returns The source attribute, with its value as written.
 */
const sourceAttribute = (attribute: Attr): SourceAttribute =>
  attribute.namespaceURI === null && attribute.localName === "lang"
    ? { local: "lang", namespace: xmlNamespace, references: [], value: attribute.value }
    : {
        local: attribute.localName,
        namespace: attribute.namespaceURI ?? "",
        references: [],
        value: attribute.value,
      };

/**
 * Report whether a node is the item's live region, the one element under the item root whose text
 * is the controller's own announcement and never the item's content.
 *
 * @param node The node.
 * @returns Whether it carries the live region's marker.
 */
const isLiveRegion = (node: Element): boolean =>
  node instanceof HTMLElement && node.dataset["slot"] === liveSlot;

/**
 * Map a rendered element and the part of its subtree a predicate keeps to the `SourceElement` tree
 * `speechPlan` reads: each element by its namespace, local name, attributes and children, each
 * text or CDATA node by its text, every other node left out, the live region left out.
 *
 * @param element The element.
 * @param kept Whether a node is part of the tree; an element left out takes its subtree with it.
 * @returns The element's source view.
 */
const sourceOf = (element: Element, kept: (node: Node) => boolean): SourceElement => ({
  attributes: [...element.attributes].map(sourceAttribute),
  children: [...element.childNodes].flatMap((child): readonly SourceChild[] => {
    if (!kept(child)) {
      return [];
    }

    if (child instanceof Element) {
      return isLiveRegion(child) ? [] : [sourceOf(child, kept)];
    }

    return child instanceof Text ? [{ kind: "text", text: child.data }] : [];
  }),
  kind: "element",
  local: element.localName,
  namespace: element.namespaceURI ?? "",
});

/**
 * Collect the nodes under an item root that come strictly before an element in document order:
 * each node the walk reaches before `from` that is not one of its ancestors, so leaving them out
 * keeps `from`, its ancestors' context (`lang`, suppression, prosody) and everything after it.
 *
 * @param itemRoot The item's root.
 * @param from An element under the root.
 * @returns The nodes before `from`.
 */
const nodesBefore = (itemRoot: HTMLElement, from: Element): ReadonlySet<Node> => {
  const before = new Set<Node>();
  const walker = document.createTreeWalker(itemRoot, NodeFilter.SHOW_ALL);

  for (let node = walker.nextNode(); node !== null && node !== from; node = walker.nextNode()) {
    if (!node.contains(from)) {
      before.add(node);
    }
  }

  return before;
};

/**
 * Report whether a segment is one an utterance speaks for a computer-read-aloud candidate: it has
 * spoken text (a pause has none) and the content does not withhold it from computer read-aloud.
 *
 * @param segment The segment.
 * @returns Whether it is spoken.
 */
const isSpoken = (segment: SpeechSegment): boolean =>
  segment.spoken !== "" && !segment.suppressed.has("computer-read-aloud");

/**
 * Read the segments to speak from an item's DOM, from an element on.
 *
 * The plan of the whole item is read once; the start is found by reading the plan of the item with
 * everything strictly before `from` left out, whose segments are the tail of the whole plan, so the
 * reading starts where that tail begins; an element inside content a `sub` or `say-as` speaks as
 * one segment starts at that segment. An element outside the item, or the item itself, starts the
 * reading at the beginning.
 *
 * @param itemRoot The item's root.
 * @param from The element to start at, or none.
 * @param lexicon The lexicon whose aliases the spoken text takes.
 * @returns The spoken segments from `from` on, in document order.
 */
const segmentsFrom = (
  itemRoot: HTMLElement,
  from: Element | undefined,
  lexicon: Lexicon | undefined,
): readonly SpeechSegment[] => {
  const whole = speechPlan(
    sourceOf(itemRoot, () => true),
    lexicon,
  ).segments;

  if (from === undefined || from === itemRoot || !itemRoot.contains(from)) {
    return whole.filter(isSpoken);
  }

  const before = nodesBefore(itemRoot, from);
  const tail = speechPlan(
    sourceOf(itemRoot, (node) => !before.has(node)),
    lexicon,
  ).segments;

  return whole.slice(Math.max(0, whole.length - tail.length)).filter(isSpoken);
};

/**
 * Attach a read-aloud controller to one rendered item (A-40a, A-40b, A-40f).
 *
 * Nothing speaks until `play`. The controller is unavailable, every call a no-op, unless
 * `supports.readAloud` is `computer-read-aloud`, `supports.suppressTts` is off and a synthesis
 * exists. It writes nothing into the item, so no pronunciation reaches an `aria-label`, an
 * accessible name or visually hidden text (the braille defect the module comment names), and it
 * never calls `focus()`. PNP spoken preferences (rate, pitch, volume, restrictions, typing echo)
 * are not applied here (issue m5-13).
 *
 * @example
 *   const reading = readAloud(itemRoot, { supports });
 *   playButton.disabled = !reading.available;
 *   playButton.addEventListener("click", () => reading.play());
 *   // before the item's markup is replaced:
 *   reading.teardown();
 *
 * @param itemRoot The item's root (`data-slot="item"`), whose live region announces state changes.
 * @param options The supports, the lexicon and the speech engine.
 * @returns The controller.
 */
export const readAloud = (itemRoot: HTMLElement, options: ReadAloudOptions): ReadAloud => {
  const engine = engineOf(options);
  const available =
    Option.contains(options.supports.readAloud, "computer-read-aloud") &&
    !options.supports.suppressTts &&
    Option.isSome(engine);
  const region = liveRegionOf(itemRoot);
  let state: ReadAloudState = "idle";
  let run = 0;

  const enter = (next: ReadAloudState): void => {
    state = next;
    region.announce(announcements[next]);
  };

  const cancel = (synthesis: ReadAloudSynthesis): void => {
    run += 1;

    if (state !== "idle") {
      synthesis.cancel();
    }
  };

  const speak = ({ synthesis, utterance }: Engine, segments: readonly SpeechSegment[]): void => {
    const token = run;
    const settled = new WeakSet<ReadAloudUtterance>();
    let outstanding = segments.length;
    const settle = (spoken: ReadAloudUtterance): void => {
      if (settled.has(spoken) || token !== run) {
        return;
      }

      settled.add(spoken);
      outstanding -= 1;

      if (outstanding === 0) {
        enter("idle");
      }
    };
    const utteranceOf = (segment: SpeechSegment): ReadAloudUtterance => {
      const spoken = utterance(segment.spoken);

      if (Option.isSome(segment.lang)) {
        spoken.lang = segment.lang.value;
      }

      spoken.addEventListener("end", () => {
        settle(spoken);
      });
      spoken.addEventListener("error", () => {
        settle(spoken);
      });

      return spoken;
    };

    for (const segment of segments) {
      synthesis.speak(utteranceOf(segment));
    }
  };

  const whenAvailable = (act: (engine: Engine) => void): void => {
    if (available && Option.isSome(engine)) {
      act(engine.value);
    }
  };

  return {
    available,
    pause: () => {
      whenAvailable(({ synthesis }) => {
        if (state === "speaking") {
          synthesis.pause();
          enter("paused");
        }
      });
    },
    play: (from) => {
      whenAvailable((current) => {
        cancel(current.synthesis);

        const segments = segmentsFrom(itemRoot, from, options.lexicon);

        if (segments.length === 0) {
          if (state !== "idle") {
            enter("idle");
          }

          return;
        }

        enter("speaking");
        speak(current, segments);
      });
    },
    resume: () => {
      whenAvailable(({ synthesis }) => {
        if (state === "paused") {
          synthesis.resume();
          enter("speaking");
        }
      });
    },
    get state(): ReadAloudState {
      return state;
    },
    stop: () => {
      whenAvailable(({ synthesis }) => {
        if (state !== "idle") {
          cancel(synthesis);
          enter("idle");
        }
      });
    },
    teardown: () => {
      whenAvailable(({ synthesis }) => {
        cancel(synthesis);
        state = "idle";
      });
    },
  };
};
