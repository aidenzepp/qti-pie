import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace, walk } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import {
  begin,
  checkResponses,
  configure,
  decode,
  open,
  partition,
  postings,
  redact,
  render,
  restore,
  score,
} from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  Element,
  Entry,
  Node,
  Options,
  Redacted,
  ResponseValue,
  StoredRecord,
  Value,
  Verdict,
} from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import { modules } from "#plate/model/interactions.ts";
import type { Item } from "#plate/model/item.ts";
import { format } from "#plate/model/values.ts";
import { checkTree, textOf } from "#plate/test/accessibility.ts";
import { keyboardWalk, tabOrder } from "#plate/test/keyboard.ts";
import type { Key } from "#plate/test/keyboard.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The fixtures, by their path under the corpus root, which `open` takes as their location.
 */
const fixtures = {
  bg007: "QTI3_BPIG_Examples/items/BG007.xml",
  bg010: "QTI3_BPIG_Examples/items/BG010.xml",
  bg011: "QTI3_BeginnersGuide_Examples/items/BG011.xml",
  cat: "qtiv3-examples/CAT/test.xml",
  fractions: "qtiv3-examples/packaging/pci/src/fractions_deps_2.xml",
  hotspot: "QTI3_BPIG_Examples/items/QTI3-hotspot.xml",
  mathml: "QTI3_BPIG_Examples/items/MathML.xml",
} as const;

/**
 * The verdict `open` gives the hotspot fixture, whose one interaction is a Hotspot, read from the
 * table of modules: `accepted` once that module renders, `accepted-with-unsupported` while it is a
 * stub, whose `parse` shows the element as a notice. A module lands by setting `implemented: true`
 * and editing nothing shared, so no test writes the verdict a stub's kind earns.
 */
const hotspotVerdict: Verdict["verdict"] = modules.hotspot.implemented
  ? "accepted"
  : "accepted-with-unsupported";

/**
 * The instance token every render here passes, as an author with a stable token would.
 */
const instance = "q1";

/**
 * The submit control the author's form ends with.
 */
const submit = '<button type="submit">Submit</button>';

/**
 * Open a fixture as a host opens a document it read from storage.
 *
 * @param location The fixture's path under the corpus root.
 * @returns Its bytes, which `readSource` reads again for the label texts, and its verdict.
 */
const openFixture = Effect.fnUntraced(function* openFixture(location: string) {
  const bytes = yield* readCorpusFile(location);
  const verdict: Verdict = yield* open(location, bytes);

  return { bytes, verdict };
});

/**
 * Open a fixture whose verdict accepts it.
 *
 * @param location The fixture's path under the corpus root.
 * @returns The accepted document and its source.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture(location: string) {
  const { bytes, verdict } = yield* openFixture(location);
  const source = yield* readSource(location, bytes);
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not accepted`),
  );

  return { accepted, source };
});

/**
 * Write a value as JSON, every bigint, such as a count, as its decimal digits, which plain
 * `JSON.stringify` refuses to write, and every `Map` and `Set` as its entries.
 *
 * @param value The value.
 * @returns Its JSON text.
 */
const json = (value: Item["body"] | Redacted): string =>
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- `JSON.stringify` hands its replacer every value the item holds, of any type; the replacer only looks for a bigint, a `Map` or a `Set` to write out.
  JSON.stringify(value, (_key, field: unknown) => {
    if (Predicate.isBigInt(field)) {
      return String(field);
    }

    return field instanceof Map || field instanceof Set ? [...field] : field;
  });

/**
 * Count the occurrences of a string in a text.
 *
 * @param text The text.
 * @param needle The string.
 * @returns How many times `needle` occurs in `text`.
 */
const occurrences = (text: string, needle: string): number => text.split(needle).length - 1;

/**
 * Give the strings only an item's hidden parts hold: each correct response's values and each
 * mapping key, in their lexical form.
 *
 * @param item The accepted item.
 * @returns The strings, each once.
 */
const markersOf = (item: Item): readonly string[] => [
  ...new Set(
    [...item.responses.values()].flatMap((declaration) => [
      ...Option.match(declaration.correct, {
        onNone: () => [],
        onSome: (value) => value.values.map(format),
      }),
      ...Option.match(declaration.mapping, {
        onNone: () => [],
        onSome: (mapping) => mapping.entries.map((entry) => format(entry.key)),
      }),
    ]),
  ),
];

/**
 * Split a text into its words: runs of letters, digits and `_`.
 *
 * @param value The text.
 * @returns Its words.
 */
const wordsOf = (value: string): readonly string[] => value.split(/[^\p{L}\p{N}_]+/u);

/**
 * Tell whether an attribute may hold a hidden string as a word: a Choice Control's `value`, which
 * is a choice's identifier the body itself lists, or an ARIA state written as the token `true` or
 * `false`.
 *
 * @param element The attribute's element.
 * @param name The attribute's name.
 * @param value The attribute's value.
 * @returns Whether the word is the body's or ARIA's, not a hidden part's.
 */
const isOwnWord = (element: Element, name: string, value: string): boolean =>
  (element.attrs["data-slot"] === "choice-interaction-control" && name === "value") ||
  (name.startsWith("aria-") && (value === "true" || value === "false"));

/**
 * Find where emitted nodes hold a hidden string as a word, outside the places the body puts it.
 *
 * @param nodes The emitted nodes.
 * @param marker The hidden string.
 * @returns Each text or attribute that holds it, described; none when the nodes do not leak it.
 */
const leaksOf = (nodes: readonly Node[], marker: string): readonly string[] =>
  nodes.flatMap((node): readonly string[] => {
    if (node.kind === "text") {
      return wordsOf(node.text).includes(marker) ? [`text ${JSON.stringify(node.text)}`] : [];
    }

    const attributes = Object.entries(node.attrs).flatMap(([name, value]) =>
      value !== true && wordsOf(value).includes(marker) && !isOwnWord(node, name, value)
        ? [`${node.tag}@${name}=${JSON.stringify(value)}`]
        : [],
    );

    return [...attributes, ...leaksOf(node.children, marker)];
  });

/**
 * Parse one emitted HTML fragment into its single root element.
 *
 * @param html The fragment.
 * @returns Its root element.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);
  assert.lengthOf(rest, 0, "the fragment has one root");

  return root?.kind === "element" ? root : assert.fail("the fragment's root is not an element");
};

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Select the elements whose part marker ends with a part's suffix.
 *
 * @param elements The elements.
 * @param suffix The marker's end, such as `-control`.
 * @returns The elements marked with it, in order.
 */
const slotted = (elements: readonly Element[], suffix: string): readonly Element[] =>
  elements.filter((element) => {
    const slot = element.attrs["data-slot"];

    return slot !== undefined && slot !== true && slot.endsWith(suffix);
  });

/**
 * Give the characters below a source element, in document order.
 *
 * @param element The source element.
 * @returns Its text and its descendants' text, joined; an entity reference adds nothing.
 */
const textBelow = (element: SourceElement): string =>
  element.children
    .map((child) => {
      switch (child.kind) {
        case "element": {
          return textBelow(child);
        }
        case "entity": {
          return "";
        }
        case "text": {
          return child.text;
        }
        default: {
          return child satisfies never;
        }
      }
    })
    .join("");

/**
 * Give a source element's text, whitespace collapsed as `textOf` collapses an emitted one's.
 *
 * @param element The source element.
 * @returns Its text.
 */
const sourceTextOf = (element: SourceElement): string =>
  textBelow(element)
    .replaceAll(/[\t\n\f\r ]+/gu, " ")
    .trim();

/**
 * Give the texts of a document's QTI elements of one name whose parent is one of a set, in
 * document order.
 *
 * @param source The document.
 * @param local The elements' local name.
 * @param parents The parents' local names that count.
 * @returns The texts.
 */
const sourceTexts = (
  source: SourceDocument,
  local: string,
  parents: ReadonlySet<string>,
): readonly string[] =>
  [...walk(source)]
    .filter(
      ({ element, parent }) =>
        element.namespace === qtiNamespace &&
        element.local === local &&
        Option.exists(parent, (owner) => parents.has(owner.local)),
    )
    .map(({ element }) => sourceTextOf(element));

/**
 * The interactions phase 1 renders whose Prompts a render shows.
 */
const promptOwners: ReadonlySet<string> = new Set([
  "qti-choice-interaction",
  "qti-extended-text-interaction",
]);

/**
 * The parts a fixture's render holds, which the name checks examine: its Controls (`control-name`),
 * its Choice Labels (`label-name`) and its Prompts (`prompt-name`).
 */
interface Counts {
  readonly controls: number;
  readonly labels: number;
  readonly prompts: number;
}

/**
 * An accepted fixture and what its renders hold.
 */
interface Rendering {
  readonly counts: Counts;
  readonly location: string;
  /**
   * Its hidden strings, which no redacted item or render may hold outside the body's own places.
   */
  readonly markers: readonly string[];
  /**
   * The strings the refused post sent for `RESPONSE`, which the messages state restores.
   */
  readonly posted: readonly string[];
}

/**
 * The three render states: no inputs; a refused post's messages and posted text; disabled.
 *
 * @param posted The strings the refused post sent for `RESPONSE`.
 * @returns Each state's name and its options.
 */
const statesOf = (posted: readonly string[]): readonly (readonly [string, Options])[] => [
  ["no inputs", { instance }],
  [
    "messages and posted text",
    {
      instance,
      messages: [{ response: "RESPONSE", text: "Check this answer." }],
      posted: { RESPONSE: posted },
    },
  ],
  ["disabled", { disabled: true, instance }],
];

/**
 * Render an accepted fixture in every state and check each render: it round-trips, passes
 * `checkTree` at base level 2, labels each Choice Control with its `qti-simple-choice` text and
 * each Prompt with its `qti-prompt` text, holds no hidden string, and shows the verdict's notices.
 *
 * @param fixture The fixture.
 * @returns Nothing; each check is an assertion.
 */
const checkRenders = Effect.fnUntraced(function* checkRenders(fixture: Rendering) {
  const configuration: Configuration = yield* configure({});
  const { accepted, source } = yield* acceptFixture(fixture.location);
  const redacted = redact(accepted);
  const written = json(redacted);
  const notices = accepted.unsupported.flatMap((entry) =>
    entry.shown === "notice"
      ? [message(configuration.locale, "notice", { feature: entry.feature })]
      : [],
  );

  assert.deepStrictEqual(markersOf(accepted.item), fixture.markers);
  for (const marker of fixture.markers) {
    const quoted = JSON.stringify(marker);
    assert.strictEqual(
      occurrences(written, quoted),
      occurrences(json(accepted.item.body), quoted),
      `redact(${fixture.location}) holds ${quoted} outside its body`,
    );
  }

  for (const [state, options] of statesOf(fixture.posted)) {
    const where = `${fixture.location}, ${state}`;
    const rendered = yield* Effect.fromResult(render(redacted, configuration, options));
    const root = rootOf(rendered.html);
    const elements = elementsOf([root]);
    const labels = slotted(elements, "choice-interaction-label");
    const prompts = slotted(elements, "-prompt");

    assert.isTrue(roundTrips(root), `${where}: the HTML round-trips`);
    assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), [], where);
    assert.deepStrictEqual(
      labels.map(textOf),
      sourceTexts(source, "qti-simple-choice", new Set(["qti-choice-interaction"])),
      `${where}: each Label is its qti-simple-choice text`,
    );
    assert.deepStrictEqual(
      prompts.map(textOf),
      sourceTexts(source, "qti-prompt", promptOwners),
      `${where}: each Prompt is its qti-prompt text`,
    );
    assert.deepStrictEqual(
      {
        controls: slotted(elements, "-control").length,
        labels: labels.length,
        prompts: prompts.length,
      },
      fixture.counts,
      `${where}: the parts the name checks examine`,
    );
    for (const marker of fixture.markers) {
      assert.deepStrictEqual(leaksOf([root], marker), [], `${where}: the HTML holds ${marker}`);
    }

    assert.deepStrictEqual(
      slotted(elements, "item-notice").map(textOf),
      notices,
      `${where}: the notices`,
    );
  }
});

/**
 * Answer a fixture by keyboard alone, as its author composes it: render the item with a fixed
 * instance, put it in the author's native form, walk the form by keys until it submits, keep the
 * entries named for the instance, decode each response under its name in its interaction's base,
 * check the responses, then score them.
 *
 * @param accepted The accepted fixture.
 * @param keys The keys pressed, which must submit the form.
 * @param host The author's own fields, after the item and before the submit control.
 * @returns The form's tab order, the posted entries by owner, and the record `score` returns.
 */
const complete = Effect.fnUntraced(function* complete(
  accepted: Accepted,
  keys: readonly Key[],
  host = "",
) {
  const configuration: Configuration = yield* configure({});
  const redacted = redact(accepted);
  const rendered = yield* Effect.fromResult(render(redacted, configuration, { instance }));
  const form = rootOf(`<form>${rendered.html}${host}${submit}</form>`);
  const entries: readonly Entry[] = Option.getOrElse(keyboardWalk(form, keys), () =>
    assert.fail("the keys never submit the form"),
  );
  const posted = partition(entries, rendered.instance);
  const responses: Readonly<Record<string, ResponseValue>> = yield* Effect.fromResult(
    Result.all(
      Object.fromEntries(
        postings(redacted, rendered.instance).map(
          ({ binding, identifier, options }) =>
            [identifier, decode(posted.own, binding, options)] as const,
        ),
      ),
    ),
  );

  assert.deepStrictEqual(checkResponses(accepted, responses, configuration), []);

  const record: StoredRecord = yield* Effect.fromResult(score(accepted, responses));

  return { posted, record, tabOrder: tabOrder(form).map((element) => element.tag) };
});

/**
 * Give one variable of a stored record, as the values it stores.
 *
 * @param values The record's outcomes or its responses, by identifier, which share one type.
 * @param identifier The variable.
 * @returns The stored values, none when the record lacks the variable or it is NULL.
 */
const valuesOf = (values: StoredRecord["outcomes"], identifier: string): readonly unknown[] =>
  values[identifier]?.values.map((single) => single.value) ?? [];

describe("the vertical witness over the fixtures", { tags: ["corpus"] }, () => {
  it.effect("[I-0] open gives each fixture its verdict from spec §4.5's table", () =>
    Effect.gen(function* verdicts() {
      const table: readonly (readonly [string, Verdict["verdict"]])[] = [
        [fixtures.cat, "refused"],
        [fixtures.fractions, "refused"],
        [fixtures.mathml, "unchecked"],
        [fixtures.hotspot, hotspotVerdict],
        [fixtures.bg007, "accepted"],
        [fixtures.bg010, "accepted"],
        [fixtures.bg011, "accepted"],
      ];

      for (const [location, expected] of table) {
        const { verdict } = yield* openFixture(location);

        assert.strictEqual(verdict.verdict, expected, location);
        assert.strictEqual(verdict.document, location);
      }
    }),
  );

  describe("every rendered state", () => {
    it.effect("[Q-2] [I-7] [I-8] BG007 renders each state checked, labelled and redacted", () =>
      checkRenders({
        counts: { controls: 2, labels: 2, prompts: 0 },
        location: fixtures.bg007,
        markers: ["true"],
        posted: ["false"],
      }),
    );

    it.effect("[Q-20] [I-7] [I-8] BG010 renders each state checked, named and redacted", () =>
      checkRenders({
        counts: { controls: 1, labels: 0, prompts: 0 },
        location: fixtures.bg010,
        markers: ["York", "york"],
        posted: ["Paris"],
      }),
    );

    it.effect("[Q-5] [I-7] [I-8] [A-1] BG011 renders each state checked, named and redacted", () =>
      checkRenders({
        counts: { controls: 1, labels: 0, prompts: 0 },
        location: fixtures.bg011,
        markers: [],
        posted: ["Crows eat insects."],
      }),
    );

    it.effect("[I-7] [I-8] the hotspot item renders each state with its one notice", () =>
      checkRenders({
        counts: { controls: 0, labels: 0, prompts: 0 },
        location: fixtures.hotspot,
        markers: ["H"],
        posted: ["R"],
      }),
    );
  });

  describe("the keyboard-only completion", () => {
    it.effect("[Q-2] [I-9b] [keyboard] BG007 by keyboard: true scores 1, false 0, none 0", () =>
      Effect.gen(function* bg007() {
        const { accepted } = yield* acceptFixture(fixtures.bg007);
        const walks: readonly (readonly [readonly Key[], readonly unknown[], number])[] = [
          [["Tab", "Space", "Tab", "Enter"], ["true"], 1],
          [["Tab", "ArrowDown", "Tab", "Enter"], ["false"], 0],
          [["Tab", "Tab", "Enter"], [], 0],
        ];

        for (const [keys, chosen, expected] of walks) {
          const { record } = yield* complete(accepted, keys);

          assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), chosen);
          assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [expected]);
        }
      }),
    );

    it.effect(
      "[Q-20] [I-9b] [keyboard] BG010 by keyboard: YORK and york give 0.5, Paris and none 0",
      () =>
        Effect.gen(function* bg010() {
          const { accepted } = yield* acceptFixture(fixtures.bg010);
          const walks: readonly (readonly [readonly Key[], number])[] = [
            [["Tab", { type: "YORK" }, "Enter"], 0.5],
            [["Tab", { type: "york" }, "Enter"], 0.5],
            [["Tab", { type: "Paris" }, "Enter"], 0],
            [["Tab", "Tab", "Enter"], 0],
          ];

          for (const [keys, expected] of walks) {
            const { record } = yield* complete(accepted, keys);

            assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [expected]);
          }
        }),
    );

    it.effect(
      "[Q-5] [keyboard] BG011 by keyboard, past the video: the response is recorded, not scored",
      () =>
        Effect.gen(function* bg011() {
          const { accepted } = yield* acceptFixture(fixtures.bg011);
          const answer = "Crows eat insects.";
          const { record, tabOrder: stops } = yield* complete(accepted, [
            "Tab",
            "Tab",
            { type: answer },
            "Tab",
            "Enter",
          ]);

          assert.deepStrictEqual(stops, ["video", "textarea", "button"]);
          assert.isTrue(
            Option.isNone(accepted.item.processing),
            "BG011 has no response processing",
          );
          assert.strictEqual(record.attempt, "submitted");
          assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), [answer]);
          assert.deepStrictEqual(
            valuesOf(record.outcomes, "SCORE"),
            [0],
            "SCORE stays its default",
          );
        }),
    );

    it.effect(
      "[I-9b] [keyboard] the hotspot item shows one notice, posts its other entries, and scores 0",
      () =>
        Effect.gen(function* hotspot() {
          const { accepted } = yield* acceptFixture(fixtures.hotspot);
          const configuration = yield* configure({});
          const rendered = yield* Effect.fromResult(
            render(redact(accepted), configuration, { instance }),
          );
          const { posted, record } = yield* complete(
            accepted,
            ["Tab", { type: "seen" }, "Tab", "Enter"],
            '<input aria-label="Note" name="note" type="text">',
          );

          assert.lengthOf(slotted(elementsOf([rootOf(rendered.html)]), "item-notice"), 1);
          assert.deepStrictEqual(posted, { foreign: [], host: [["note", "seen"]], own: [] });
          assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), []);
          assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [0]);
        }),
    );
  });
});

describe(
  "an item whose template processing sets its correct response",
  { tags: ["corpus"] },
  () => {
    it.effect(
      "[I-5] [I-9b] template_digging opens accepted, its template processing read and its response processing some",
      () =>
        Effect.gen(function* templateDigging() {
          const location = "QTI3_BPIG_Examples/items/template_digging.xml";
          const { verdict } = yield* openFixture(location);
          const accepted = acceptedItem(verdict).pipe(
            Option.filter(() => verdict.verdict === "accepted"),
            Option.getOrElse(() => assert.fail(`${location} is ${verdict.verdict}, not accepted`)),
          );

          assert.isTrue(
            Option.isSome(accepted.item.templateProcessing),
            "the template processing is read",
          );
          assert.isTrue(Option.isSome(accepted.item.processing), "the response processing runs");
          assert.deepStrictEqual(accepted.unsupported, []);
        }),
    );

    it.effect(
      "[I-5] [I-9b] template_digging needs its record to score: with none it fails RecordRequired, and over begin's record its template-set correct response scores 1 and a wrong one 0",
      () =>
        Effect.gen(function* templateDiggingScores() {
          const location = "QTI3_BPIG_Examples/items/template_digging.xml";
          const { verdict } = yield* openFixture(location);
          const accepted = Option.getOrElse(acceptedItem(verdict), () =>
            assert.fail(`${location} is ${verdict.verdict}, not accepted`),
          );
          const stored = yield* Effect.fromResult(begin(accepted, { instance, seed: "20251107" }));
          const { record } = yield* Effect.fromResult(restore(accepted, stored));
          const correct = Option.getOrElse(Option.fromUndefinedOr(record.correct["RESPONSE"]), () =>
            assert.fail("begin's record holds no correct response for RESPONSE"),
          );
          const [single] = correct.values;
          const wrong: Value = {
            baseType: "float",
            cardinality: "single",
            values: [
              { baseType: "float", value: single?.baseType === "float" ? single.value + 1 : 0 },
            ],
          };
          const right = yield* Effect.fromResult(score(accepted, { RESPONSE: correct }, stored));
          const missed = yield* Effect.fromResult(score(accepted, { RESPONSE: wrong }, stored));

          assert.strictEqual(
            Option.getOrUndefined(Result.getFailure(score(accepted, { RESPONSE: correct })))?._tag,
            "RecordRequired",
          );
          assert.strictEqual(correct.baseType, "float");
          assert.deepStrictEqual(valuesOf(right.outcomes, "SCORE"), [1]);
          assert.deepStrictEqual(valuesOf(missed.outcomes, "SCORE"), [0]);
        }),
    );
  },
);
