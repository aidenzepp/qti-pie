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
 * The candidate's spoken preferences (issue m5-13; A-40c, A-40d, A-40e) arrive as the `spoken`
 * option, a `SpokenPreferences`, and apply from the controller's attach: the rate, pitch and volume
 * of every utterance, what the reading leaves out (`word-by-word`, `directions-only`,
 * `skip-math-equations` and `skip-chemistry-equations`), how a link is marked, and the echo of what
 * the candidate types. An option-only `spoken` is off at the start (D17), so `spoken` changes
 * nothing for a candidate whose `supports.readAloud` is none.
 *
 * The synthesis keeps its paused state across `cancel()`, and an utterance queued while it is
 * paused does not sound until `resume()` clears the state. So every exit from `paused` (a `play`, a
 * `stop`, a `teardown`) calls `cancel()` and then `resume()`: the cancel flushes what the pause
 * held, and the resume leaves the page's synthesis unpaused for the next reading and for whatever
 * else on the page speaks (A-40b, issue m4-04b, GitHub issue #221). An exit from `speaking` calls
 * `cancel()` alone, and `idle` calls nothing.
 *
 * A browser module: it value-imports from `effect` only `Option`.
 *
 * @module
 */
import { Option } from "effect";
import { mathmlNamespace, xmlNamespace } from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { liveRegionOf, liveSlot } from "#plate/runtime/announce.dom.ts";
import { speechPlan } from "#plate/speech/plan.ts";
import type { Lexicon, SpeechSegment } from "#plate/speech/plan.ts";
import type {
  LinkIndication,
  RestrictionType,
  SpokenPreferences,
  Supports,
  TypingEcho,
} from "#plate/supports.ts";

/**
 * Where a controller stands: `idle` before the candidate plays and after a stop or the end of the
 * reading, `speaking` while utterances are queued or sounding, `paused` while the candidate holds
 * the reading.
 */
export type ReadAloudState = "idle" | "paused" | "speaking";

/**
 * The part of a `SpeechSynthesisVoice` the engine reads, to choose a second voice for a link
 * (A-40d, issue m5-13). `SpeechSynthesisVoice` satisfies it.
 */
export interface ReadAloudVoice {
  readonly default: boolean;
  readonly lang: string;
  readonly name: string;
}

/**
 * The part of a `SpeechSynthesisUtterance` the engine touches: the language it sets from the
 * segment's nearest `lang`, the rate, pitch and volume it sets from the candidate's spoken
 * preferences (A-40d, issue m5-13), the voice it sets on a link under `different-voice`, and the
 * `end` and `error` events that tell it an utterance is over. `SpeechSynthesisUtterance` satisfies
 * it; a test's fake needs nothing more than `addEventListener` and `lang`, and records the rest.
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
  /**
   * The pitch, 0 to 2, set on every utterance the engine makes.
   */
  pitch?: number;
  /**
   * The rate, 0.1 to 10, set on every utterance the engine makes.
   */
  rate?: number;
  /**
   * The voice, set only on a link's utterance under `different-voice` when the synthesis offers a
   * second voice.
   */
  voice?: ReadAloudVoice | null;
  /**
   * The volume, 0 to 1, set on every utterance the engine makes.
   */
  volume?: number;
}

/**
 * The part of `SpeechSynthesis` the engine calls, so a host or a test passes a recording fake and
 * no speech engine runs. `globalThis.speechSynthesis` satisfies it and is the default.
 */
export interface ReadAloudSynthesis {
  /**
   * Drop every queued utterance and silence the one sounding; the engine then treats their `end`
   * and `error` events as over. It does not change the paused state: a synthesis paused before the
   * cancel stays paused after it, and an utterance queued then does not sound until `resume`
   * (A-40b, issue m4-04b, GitHub issue #221).
   */
  readonly cancel: () => void;
  /**
   * The voices the engine offers, which `different-voice` reads to find a second voice for a link
   * (A-40d, issue m5-13). Absent, or fewer than two, and a link is marked as `speak-link` marks it.
   * The browser's list may be empty until its voices have loaded, so the engine reads it at each
   * `play`.
   */
  readonly getVoices?: () => readonly ReadAloudVoice[];
  /**
   * Hold the utterance sounding and the queue behind it.
   */
  readonly pause: () => void;
  /**
   * Let a held reading go on: clear the paused state, which `cancel` leaves in place.
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
 * read), the lexicon whose aliases the spoken text takes, the candidate's spoken preferences, and
 * the speech engine, the page's by default.
 */
export interface ReadAloudOptions {
  /**
   * The PLS lexicon applied to the spoken text (A-35), none by default.
   */
  readonly lexicon?: Lexicon;
  /**
   * The candidate's spoken preferences from the PNP (`PnpSupports.spoken`), applied from the
   * attach (A-40c, A-40d, A-40e, issue m5-13): the restrictions, the speech rate, pitch and
   * volume, the link indication and the typing echo. Absent, the PNP's defaults apply: no
   * restriction, rate 180 words a minute, pitch 0.5, volume 0.5, links read as text and no echo.
   * It is not a switch: the controller is available only as `supports` says, and a `spoken`
   * whose reading type is `screen-reader` makes it unavailable too.
   *
   * Plate cannot tell chemistry from mathematics, so `skip-chemistry-equations` passes over every
   * MathML `math` element, as `skip-math-equations` does. `sound-effect` plays no sound, since
   * plate ships none, and marks a link as `speak-link` does. An `ext:` restriction is ignored.
   */
  readonly spoken?: SpokenPreferences;
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
   * spoken as it stands; a reading in progress is cancelled and this one starts from the beginning,
   * and from the paused state the synthesis resumes after the cancel, so this reading sounds
   * (A-40b, issue m4-04b, GitHub issue #221). A segment the content withholds from computer
   * read-aloud (`data-qti-suppress-tts`) is skipped, and so is a pause segment, since the Web
   * Speech API has no pause to queue and the gap between utterances stands in.
   *
   * Under the `word-by-word` restriction (A-40c) only the word the candidate chose is read: the
   * first text run at `from`, or the whole `sub` or `say-as` content it lies in, and then the
   * reading ends. With no `from`, or one outside the item or without text, nothing is read.
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
   * `idle`. From the paused state the synthesis then resumes, so it is left unpaused (A-40b, issue
   * m4-04b, GitHub issue #221). The next `play` starts from the beginning.
   */
  readonly stop: () => void;
  /**
   * Silence the reading and release the controller, before the item's markup is replaced. From the
   * paused state the synthesis cancels and then resumes, so the page's synthesis is left unpaused
   * for whatever speaks next (A-40b, issue m4-04b, GitHub issue #221). It announces nothing, since
   * the host is discarding the item's live region with the item.
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
 * The text a link's start is marked with in the tree the plan reads: a private-use character no
 * item text holds, which the plan turns into a segment of its own and {@link readingOf} takes out.
 * The plan keeps no link of its own, so a link is known to the reading by the markers around it.
 */
const linkOpen = "\uE000";

/**
 * The text a link's end is marked with, the counterpart of {@link linkOpen}.
 */
const linkClose = "\uE001";

/**
 * Every marker character, which a segment that swallowed one (a link inside an element a `sub` or
 * `say-as` speaks as one segment) has taken out of its spoken text.
 */
const linkMarkers = /[\uE000\uE001]/gu;

/**
 * Report whether an element is a link: an HTML `a` with an `href`.
 *
 * @param element The element.
 * @returns Whether it is a link.
 */
const isLink = (element: Element): boolean =>
  element instanceof HTMLAnchorElement && element.hasAttribute("href");

/**
 * Make the source text child that stands for a link boundary.
 *
 * @param text The marker, {@link linkOpen} or {@link linkClose}.
 * @returns The text child.
 */
const markerOf = (text: string): SourceChild => ({ kind: "text", text });

/**
 * Map a rendered element and the part of its subtree a predicate keeps to the `SourceElement` tree
 * `speechPlan` reads: each element by its namespace, local name, attributes and children, each
 * text or CDATA node by its text, every other node left out, the live region left out. With
 * `links`, a text child that is a marker stands before and after each link, as a sibling of it so
 * a link's own `data-ssml` never speaks them.
 *
 * @param element The element.
 * @param kept Whether a node is part of the tree; an element left out takes its subtree with it.
 * @param links Whether to mark the links.
 * @returns The element's source view.
 */
const sourceOf = (
  element: Element,
  kept: (node: Node) => boolean,
  links: boolean,
): SourceElement => ({
  attributes: [...element.attributes].map(sourceAttribute),
  children: [...element.childNodes].flatMap((child): readonly SourceChild[] => {
    if (!kept(child)) {
      return [];
    }

    if (child instanceof Element) {
      if (isLiveRegion(child)) {
        return [];
      }

      const mapped = sourceOf(child, kept, links);

      return links && isLink(child) ? [markerOf(linkOpen), mapped, markerOf(linkClose)] : [mapped];
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
 * What the candidate's restrictions (A-40c) leave out of a reading, as the engine applies them:
 * `skipMath` for `skip-math-equations` and `skip-chemistry-equations`, `directionsOnly` and
 * `wordByWord` as named. `unrestricted` and an `ext:` restriction set none of them.
 */
interface Restrictions {
  readonly directionsOnly: boolean;
  readonly skipMath: boolean;
  readonly wordByWord: boolean;
}

/**
 * Read the restrictions a candidate's spoken preferences name. Several combine.
 *
 * @param restrictions The `restrictions` of the spoken preferences, or none when `spoken` is
 *   absent.
 * @returns The restrictions the engine applies.
 */
const restrictionsOf = (restrictions: ReadonlySet<RestrictionType> | undefined): Restrictions => ({
  directionsOnly: restrictions?.has("directions-only") ?? false,
  skipMath:
    (restrictions?.has("skip-math-equations") ?? false) ||
    (restrictions?.has("skip-chemistry-equations") ?? false),
  wordByWord: restrictions?.has("word-by-word") ?? false,
});

/**
 * The elements `directions-only` reads: the prompt of an interaction, whose part carries a
 * `data-slot` ending in `-prompt`, and a rubric block whose `use` is `instructions`.
 */
const directionSelector = '[data-slot$="-prompt"], [data-use="instructions"]';

/**
 * Report whether a node belongs to the directions: it is, or lies inside, a direction element, or
 * it is an element that holds one, so the context (`lang`, suppression) of a direction's ancestors
 * stays in the tree.
 *
 * @param node The node.
 * @returns Whether `directions-only` keeps it.
 */
const isDirection = (node: Node): boolean => {
  const element = node instanceof Element ? node : node.parentElement;

  return (
    element !== null &&
    (element.closest(directionSelector) !== null ||
      (node instanceof Element && node.querySelector(directionSelector) !== null))
  );
};

/**
 * Report whether a node is a MathML `math` element, the element `skip-math-equations` passes over.
 *
 * @param node The node.
 * @returns Whether it is one.
 */
const isMath = (node: Node): boolean =>
  node instanceof Element && node.namespaceURI === mathmlNamespace && node.localName === "math";

/**
 * Construct the predicate that decides which nodes of the item a reading keeps under the
 * restrictions: a `math` element and its subtree are left out under `skipMath`, and everything but
 * the directions and their ancestors under `directionsOnly`.
 *
 * @param restrictions The restrictions.
 * @returns Whether a node is part of the reading's tree.
 */
const keepsOf =
  (restrictions: Restrictions): ((node: Node) => boolean) =>
  (node) =>
    !(restrictions.skipMath && isMath(node)) && (!restrictions.directionsOnly || isDirection(node));

/**
 * Where a segment stands in a link: `first` for the first spoken segment of a link, `inside` for
 * a later one, `none` outside every link.
 */
type LinkRole = "first" | "inside" | "none";

/**
 * One segment of a reading and where it stands in a link.
 */
interface ReadingSegment {
  readonly link: LinkRole;
  readonly segment: SpeechSegment;
}

/**
 * Read an item's DOM into its reading: the plan's segments in document order, with the link
 * markers taken out and each segment's place in a link recorded.
 *
 * @param itemRoot The item's root.
 * @param kept Whether a node is part of the tree the plan reads.
 * @param lexicon The lexicon whose aliases the spoken text takes.
 * @param links Whether to mark the links.
 * @returns The reading, markers excluded.
 */
const readingOf = (
  itemRoot: HTMLElement,
  kept: (node: Node) => boolean,
  lexicon: Lexicon | undefined,
  links: boolean,
): readonly ReadingSegment[] => {
  const reading: ReadingSegment[] = [];
  let depth = 0;
  let pending = false;

  for (const segment of speechPlan(sourceOf(itemRoot, kept, links), lexicon).segments) {
    if (links && segment.written === linkOpen) {
      depth += 1;
      pending = true;
    } else if (links && segment.written === linkClose) {
      depth = Math.max(0, depth - 1);
      pending = false;
    } else {
      const spoken = links ? segment.spoken.replaceAll(linkMarkers, "") : segment.spoken;
      const first: boolean = depth > 0 && pending && isSpoken({ ...segment, spoken });
      const inside: LinkRole = first ? "first" : "inside";

      pending &&= !first;
      reading.push({ link: depth === 0 ? "none" : inside, segment: { ...segment, spoken } });
    }
  }

  return reading;
};

/**
 * The options a reading is read with: the lexicon, the restrictions and whether to mark links.
 */
interface ReadingOptions {
  readonly lexicon: Lexicon | undefined;
  readonly links: boolean;
  readonly restrictions: Restrictions;
}

/**
 * Read the segments to speak from an item's DOM, from an element on.
 *
 * The plan of the whole item is read once; the start is found by reading the plan of the item with
 * everything strictly before `from` left out, whose segments are the tail of the whole plan, so the
 * reading starts where that tail begins; an element inside content a `sub` or `say-as` speaks as
 * one segment starts at that segment. An element outside the item, or the item itself, starts the
 * reading at the beginning.
 *
 * Under `word-by-word` the reading is the one segment at `from`, and nothing when `from` is
 * absent, outside the item, or holds no text the other restrictions keep: the candidate chooses
 * the word, so the item's beginning is no choice.
 *
 * @param itemRoot The item's root.
 * @param from The element to start at, or none.
 * @param options The lexicon, the restrictions and whether to mark links.
 * @returns The spoken segments from `from` on, in document order.
 */
const readingFrom = (
  itemRoot: HTMLElement,
  from: Element | undefined,
  { lexicon, links, restrictions }: ReadingOptions,
): readonly ReadingSegment[] => {
  const kept = keepsOf(restrictions);
  const whole = readingOf(itemRoot, kept, lexicon, links);

  if (from === undefined || from === itemRoot || !itemRoot.contains(from)) {
    return restrictions.wordByWord ? [] : whole.filter(({ segment }) => isSpoken(segment));
  }

  const before = nodesBefore(itemRoot, from);
  const tail = readingOf(itemRoot, (node) => kept(node) && !before.has(node), lexicon, links);
  const fromHere = whole.slice(Math.max(0, whole.length - tail.length));

  if (!restrictions.wordByWord) {
    return fromHere.filter(({ segment }) => isSpoken(segment));
  }

  const own = readingOf(
    itemRoot,
    (node) => kept(node) && (node.contains(from) || from.contains(node)),
    lexicon,
    false,
  );
  const [word] = fromHere;

  return own.length > 0 && word !== undefined && isSpoken(word.segment) ? [word] : [];
};

/**
 * The speech rate the PNP gives a candidate who sets none, in words per minute, and the pitch and
 * volume likewise: the defaults of the `spoken` feature.
 */
const defaultSpeech = { pitch: 0.5, speechRate: 180, volume: 0.5 } as const;

/**
 * The Web Speech values of one utterance.
 */
interface Prosody {
  readonly pitch: number;
  readonly rate: number;
  readonly volume: number;
}

/**
 * Bound a number, a value that is not finite taking the fallback.
 *
 * @param value The value.
 * @param low The least allowed.
 * @param high The most allowed.
 * @param fallback What a value that is not finite becomes.
 * @returns The value within the bounds.
 */
const bounded = (value: number, low: number, high: number, fallback: number): number =>
  Number.isFinite(value) ? Math.min(high, Math.max(low, value)) : fallback;

/**
 * Map the candidate's speech rate, pitch and volume onto Web Speech (A-40d): the rate is the words
 * per minute over the default 180, within 0.1 and 10; the pitch is the PNP's, whose default is
 * 0.5, doubled, within 0 and 2; the volume is as given, within 0 and 1.
 *
 * @param spoken The candidate's spoken preferences, or none for the PNP's defaults.
 * @returns The rate, pitch and volume every utterance carries.
 */
const prosodyOf = (spoken: SpokenPreferences | undefined): Prosody => ({
  pitch: bounded((spoken?.pitch ?? defaultSpeech.pitch) * 2, 0, 2, 1),
  rate: bounded(
    (spoken?.speechRate ?? defaultSpeech.speechRate) / defaultSpeech.speechRate,
    0.1,
    10,
    1,
  ),
  volume: bounded(spoken?.volume ?? defaultSpeech.volume, 0, 1, defaultSpeech.volume),
});

/**
 * Set the candidate's rate, pitch and volume on an utterance.
 *
 * @param utterance The utterance.
 * @param prosody The values to set.
 */
const applyProsody = (utterance: ReadAloudUtterance, prosody: Prosody): void => {
  utterance.pitch = prosody.pitch;
  utterance.rate = prosody.rate;
  utterance.volume = prosody.volume;
};

/**
 * Choose the second voice a link is read in under `different-voice`: the first voice that is not
 * the default one, one in the default voice's language first. None when the synthesis offers fewer
 * than two voices or does not list them.
 *
 * @param synthesis The synthesis.
 * @returns The voice, or none.
 */
const secondVoiceOf = (synthesis: ReadAloudSynthesis): Option.Option<ReadAloudVoice> => {
  const voices = synthesis.getVoices?.() ?? [];
  const primary = voices.find((voice) => voice.default) ?? voices[0];

  return primary === undefined
    ? Option.none()
    : Option.fromNullishOr(
        voices.find((voice) => voice !== primary && voice.lang === primary.lang) ??
          voices.find((voice) => voice !== primary),
      );
};

/**
 * The word `speak-link` says before a link's text: the module's own string, in English (D7).
 */
const linkWord = "link";

/**
 * What a typed character is called when the echo speaks it, a space or any other white space
 * having no sound of its own: the module's own string, in English (D7).
 */
const spaceName = "space";

/**
 * A character of punctuation that ends a word the candidate has typed, an apostrophe excepted,
 * which joins the letters on either side of it.
 */
const wordEnd = /^(?!['\u2019])[\s\p{P}]$/u;

/**
 * The word at the end of a text: letters, digits and marks, an apostrophe between two of them kept
 * inside the word and the apostrophes after it left out.
 */
const lastWord = /(?<word>[\p{L}\p{N}\p{M}]+(?:['\u2019][\p{L}\p{N}\p{M}]+)*)['\u2019]*$/u;

/**
 * Report whether an event target is a control of a Text Entry or an Extended Text of the item.
 *
 * @param itemRoot The item's root.
 * @param target The event's target.
 * @returns Whether it is a text control of the item.
 */
const isTextControl = (
  itemRoot: HTMLElement,
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement =>
  (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) &&
  itemRoot.contains(target) &&
  target.closest(
    '[data-slot="text-entry-interaction"], [data-slot="extended-text-interaction"]',
  ) !== null;

/**
 * Read what the typing echo speaks for one input event (A-40e): the character typed under
 * `characters` and `characters-and-words`, and the word a space, a line break or punctuation
 * completes under `words` and `characters-and-words`. Only typed text and a line break echo; a
 * paste, a deletion and a composition speak nothing.
 *
 * @param mode The typing echo.
 * @param event The input event.
 * @param control The text control the event came from.
 * @returns The texts to speak, in order.
 */
const echoesOf = (
  mode: TypingEcho,
  event: InputEvent,
  control: HTMLInputElement | HTMLTextAreaElement,
): readonly string[] => {
  const lineBreak = event.inputType === "insertLineBreak" || event.inputType === "insertParagraph";
  const data = event.inputType === "insertText" ? (event.data ?? "") : "";

  if (data === "" && !lineBreak) {
    return [];
  }

  const characters = mode === "characters" || mode === "characters-and-words";
  const words = mode === "words" || mode === "characters-and-words";
  const spoken: string[] = [];

  if (characters && !lineBreak) {
    spoken.push(/^\s+$/u.test(data) ? spaceName : data);
  }

  if (words && (lineBreak || wordEnd.test(data))) {
    const caret = control.selectionStart ?? control.value.length;
    const before = control.value.slice(0, Math.max(0, caret - (lineBreak ? 1 : data.length)));
    const word = lastWord.exec(before)?.groups?.["word"];

    if (word !== undefined) {
      spoken.push(word);
    }
  }

  return spoken;
};

/**
 * Attach a read-aloud controller to one rendered item (A-40a, A-40b, A-40f), applying the
 * candidate's spoken preferences (A-40c, A-40d, A-40e, issue m5-13).
 *
 * Nothing speaks until `play`, but for the typing echo, which speaks what the candidate types in
 * the item's Text Entry and Extended Text and nothing else. The controller is unavailable, every
 * call a no-op and the echo off, unless `supports.readAloud` is `computer-read-aloud`,
 * `supports.suppressTts` is off, the `spoken` option's reading type is not `screen-reader` and a
 * synthesis exists. It writes nothing into the item, so no pronunciation reaches an `aria-label`,
 * an accessible name or visually hidden text (the braille defect the module comment names), and it
 * never calls `focus()`.
 *
 * The preferences of `options.spoken` apply as {@link ReadAloudOptions.spoken} says. The typing
 * echo speaks a character (`characters`), a word a space, a line break or punctuation completes
 * (`words`), or both, as an utterance queued behind a reading in progress; it changes no state, and
 * is not spoken while the candidate has paused the reading, which would hold it until the resume.
 * A link is marked as the `link-indication` says: `speak-link` and `sound-effect` say "link"
 * before the link's first text, in the link's own language; `different-voice` reads the link in
 * the synthesis's second voice, and as `speak-link` when it offers none.
 *
 * @example
 *   const reading = readAloud(itemRoot, { spoken: Option.getOrThrow(pnp.spoken), supports: pnp });
 *   playButton.disabled = !reading.available;
 *   playButton.addEventListener("click", () => reading.play());
 *   // before the item's markup is replaced:
 *   reading.teardown();
 *
 * @param itemRoot The item's root (`data-slot="item"`), whose live region announces state changes.
 * @param options The supports, the spoken preferences, the lexicon and the speech engine.
 * @returns The controller.
 */
export const readAloud = (itemRoot: HTMLElement, options: ReadAloudOptions): ReadAloud => {
  const engine = engineOf(options);
  const available =
    Option.contains(options.supports.readAloud, "computer-read-aloud") &&
    options.spoken?.readingType !== "screen-reader" &&
    !options.supports.suppressTts &&
    Option.isSome(engine);
  const region = liveRegionOf(itemRoot);
  const prosody = prosodyOf(options.spoken);
  const restrictions = restrictionsOf(options.spoken?.restrictions);
  const indication: LinkIndication = Option.getOrElse(
    Option.fromNullishOr(options.spoken).pipe(Option.flatMap((spoken) => spoken.linkIndication)),
    () => "none",
  );
  const typingEcho: TypingEcho = Option.getOrElse(
    Option.fromNullishOr(options.spoken).pipe(Option.flatMap((spoken) => spoken.typingEcho)),
    () => "none",
  );
  let state: ReadAloudState = "idle";
  let run = 0;

  const enter = (next: ReadAloudState): void => {
    state = next;
    region.announce(announcements[next]);
  };

  /**
   * Leave the current reading: advance the run, so the events of the utterances it queued change
   * nothing, and flush the synthesis. From `speaking` the synthesis cancels alone. From `paused` it
   * cancels and then resumes, since `cancel()` keeps the paused state and what the next reading
   * queues would not sound under it (A-40b, issue m4-04b, GitHub issue #221). From `idle` it calls
   * nothing.
   *
   * @param synthesis The synthesis to flush.
   */
  const cancel = (synthesis: ReadAloudSynthesis): void => {
    run += 1;

    if (state === "idle") {
      return;
    }

    synthesis.cancel();

    if (state === "paused") {
      synthesis.resume();
    }
  };

  const speak = ({ synthesis, utterance }: Engine, segments: readonly ReadingSegment[]): void => {
    const token = run;
    const settled = new WeakSet<ReadAloudUtterance>();
    const second =
      indication === "different-voice" ? secondVoiceOf(synthesis) : Option.none<ReadAloudVoice>();
    const saysLink =
      indication === "speak-link" ||
      indication === "sound-effect" ||
      (indication === "different-voice" && Option.isNone(second));
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
    const utteranceOf = ({ link, segment }: ReadingSegment): ReadAloudUtterance => {
      const spoken = utterance(
        link === "first" && saysLink ? `${linkWord} ${segment.spoken}` : segment.spoken,
      );

      if (Option.isSome(segment.lang)) {
        spoken.lang = segment.lang.value;
      }

      applyProsody(spoken, prosody);

      if (link !== "none" && Option.isSome(second)) {
        spoken.voice = second.value;
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

  const echo = (event: Event): void => {
    whenAvailable(({ synthesis, utterance }) => {
      const control = event.target;

      if (
        state === "paused" ||
        !(event instanceof InputEvent) ||
        !isTextControl(itemRoot, control)
      ) {
        return;
      }

      for (const text of echoesOf(typingEcho, event, control)) {
        const spoken = utterance(text);
        const language = control.closest("[lang]")?.getAttribute("lang") ?? "";

        if (language !== "") {
          spoken.lang = language;
        }

        applyProsody(spoken, prosody);
        synthesis.speak(spoken);
      }
    });
  };

  if (available && typingEcho !== "none") {
    itemRoot.addEventListener("input", echo);
  }

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

        const segments = readingFrom(itemRoot, from, {
          lexicon: options.lexicon,
          links: indication !== "none",
          restrictions,
        });

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
        itemRoot.removeEventListener("input", echo);
        cancel(synthesis);
        state = "idle";
      });
    },
  };
};
