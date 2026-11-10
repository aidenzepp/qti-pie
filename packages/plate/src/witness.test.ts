import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeStoredFloat } from "#plate/codec/values.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import {
  checkResponses,
  configure,
  decode,
  entryName,
  isPosted,
  Malformed,
  partition,
  redact,
  render,
  renderStatus,
  score,
} from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  Element,
  Node,
  Redacted,
  Rendered,
  StoredRecord,
  ValidationMessage,
  Value,
} from "#plate/index.ts";
import type { BodyNode, ChoiceInteraction } from "#plate/model/item.ts";
import { attribute, checkTree, textOf } from "#plate/test/accessibility.ts";
import { keyboardWalk, tabOrder } from "#plate/test/keyboard.ts";
import type { Key } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import { choicesItem, choicesProbe, xhtmlItem, xhtmlProbe } from "#scripts/walk-corpus.ts";

/**
 * A case reads at most a few corpus documents, which takes well under a second here; the bound
 * leaves room for a slow machine without letting a hung read stall the suite.
 */
const corpusTimeoutMs = 60_000;

/**
 * The instance token every render here passes, as an author with a stable token would.
 */
const instance = "witness";

/**
 * The QTI 3 namespace and the attributes every hand-built item's root carries.
 */
const itemRoot =
  'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" adaptive="false" time-dependent="false" xml:lang="en"';

/**
 * The `match_correct` template, which sets `SCORE` to 1 when `RESPONSE` matches its correct
 * response and to 0 otherwise.
 */
const matchCorrect =
  '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>';

/**
 * A float `SCORE` whose default is 0, the outcome `match_correct` sets.
 */
const scoreDeclaration =
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-default-value><qti-value>0</qti-value></qti-default-value></qti-outcome-declaration>';

/**
 * The author's message for a booking code that does not match the Text Entry's `pattern-mask`.
 */
const codeMessage = "Write three capital letters, a hyphen and two digits, such as ABC-12.";

/**
 * A hand-built Text Entry item: a booking code checked against `pattern-mask="[A-Z]{3}-[0-9]{2}"`
 * with the author's `data-patternmask-message`, scored by `match_correct` against `QTI-30`.
 */
const bookingCode = `<qti-assessment-item ${itemRoot} identifier="booking-code" title="Booking code"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"><qti-correct-response><qti-value>QTI-30</qti-value></qti-correct-response></qti-response-declaration>${scoreDeclaration}<qti-item-body><p>Your booking code is <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="6" pattern-mask="[A-Z]{3}-[0-9]{2}" data-patternmask-message="${codeMessage}"/>.</p></qti-item-body>${matchCorrect}</qti-assessment-item>`;

/**
 * A hand-built Extended Text bound to an `ordered` string with `max-strings="3"`, so it shows three
 * Controls in a group its Prompt names, scored by `match_correct` against the two steps in order.
 */
const teaSteps = `<qti-assessment-item ${itemRoot} identifier="tea-steps" title="Making tea"><qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="string"><qti-correct-response><qti-value>Boil the water</qti-value><qti-value>Add the tea</qti-value></qti-correct-response></qti-response-declaration>${scoreDeclaration}<qti-item-body><qti-extended-text-interaction response-identifier="RESPONSE" max-strings="3"><qti-prompt>Write the steps to make tea, one to a box, in order.</qti-prompt></qti-extended-text-interaction></qti-item-body>${matchCorrect}</qti-assessment-item>`;

/**
 * The `ccPackage` Choice scored by the `CC2_match` template: a true-or-false question whose correct
 * response is `true`, presented in document order.
 */
const ccPackageItem = "qtiv3-examples/packaging/ccPackage/testitems/QUE_102010.xml";

/**
 * The author's `data-max-selections-message` on `RESPONSE1`'s Choice of the walk corpus's shuffled
 * Choices item, {@link choicesProbe}, whose `max-choices` is 2.
 */
const tooManyMessage = "Choose no more than two elements for table salt.";

/**
 * The author's `data-min-selections-message` on `RESPONSE3`'s Choice of {@link choicesProbe},
 * whose `min-choices` is 2.
 */
const tooFewMessage = "Choose two metals or more.";

/**
 * A shuffled single Choice of the corpus whose last choice, `ChoiceD`, is fixed, scored by
 * `match_correct` against `ChoiceA`.
 */
const fixedItem = "qtiv3-examples/packaging/items/choice_fixed.xml";

/**
 * The seed both shuffled cases render with. Under it and {@link instance}, `choice_fixed` presents
 * `ChoiceC`, `ChoiceA`, `ChoiceB`, then the fixed `ChoiceD`, so its correct choice is not where the
 * document puts it.
 */
const seed = "3";

/**
 * The six elements each Choice of {@link choicesProbe} offers, by response, as their choice
 * identifiers in document order; no identifier is shared across the item.
 */
const elements = {
  RESPONSE1: ["SALT_NA", "SALT_CL", "SALT_K", "SALT_I", "SALT_CA", "SALT_F"],
  RESPONSE2: ["GAS_HE", "GAS_NE", "GAS_AR", "GAS_H", "GAS_N", "GAS_O"],
  RESPONSE3: ["METAL_FE", "METAL_CU", "METAL_ZN", "METAL_C", "METAL_S", "METAL_P"],
} as const;

/**
 * Collect the Choices of an item body, in document order.
 *
 * @param nodes The body.
 * @returns Each Choice interaction it holds.
 */
const choicesIn = (nodes: readonly BodyNode[]): readonly ChoiceInteraction[] =>
  nodes.flatMap((node): readonly ChoiceInteraction[] => {
    if (node.kind === "choice") {
      return [node];
    }

    return node.kind === "element" ? choicesIn(node.children) : [];
  });

/**
 * An item `open` accepted, and its redaction, the one input `render` takes.
 */
interface Opened {
  readonly accepted: Accepted;
  readonly redacted: Redacted;
}

/**
 * Open a document as a host opens one it read from storage, and require an accepting verdict.
 *
 * @param location The document's location, which `open` takes.
 * @param bytes The document's bytes.
 * @returns The accepted document and its redaction.
 */
const openAccepted = Effect.fnUntraced(function* openAccepted(location: string, bytes: Uint8Array) {
  const verdict = yield* open(location, bytes);
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not accepted`),
  );

  return { accepted, redacted: redact(accepted) };
});

/**
 * Open a hand-built item.
 *
 * @param name The item's file name, which `open` takes as its location.
 * @param xml The item's text.
 * @returns The accepted item and its redaction.
 */
const openBuilt = (name: string, xml: string) =>
  openAccepted(`items/${name}.xml`, new TextEncoder().encode(xml));

/**
 * Open a corpus document.
 *
 * @param location The document's path under the corpus root.
 * @returns The accepted document and its redaction.
 */
const openCorpus = Effect.fnUntraced(function* openCorpus(location: string) {
  return yield* openAccepted(location, yield* readCorpusFile(location));
});

/**
 * Parse an HTML fragment into its single root element.
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
 * Give the Controls of one response in a page, in the order the HTML emits them.
 *
 * @param page The page.
 * @param response The response identifier.
 * @returns The Controls posting under the response's entry name.
 */
const controlsOf = (page: Element, response: string): readonly Element[] =>
  elementsOf([page]).filter(
    (element) => attribute(element, "name") === entryName(instance, response),
  );

/**
 * Give a Control's `value` attribute.
 *
 * @param control The Control.
 * @returns Its value.
 */
const valueOf = (control: Element): string =>
  attribute(control, "value") ?? assert.fail(`a ${control.tag} Control has no value`);

/**
 * Compose the page an author serves around one render, and check it: the Status part when there is
 * one, then the author's native form holding the item and its submit control, under a `div` that
 * gives the language. `checkTree` must pass on every page, so each step of a case is checked.
 *
 * @param item The item's render.
 * @param status The Status part's render, when the page shows one.
 * @param disabled Whether the submit control is disabled, as after the last attempt.
 * @returns The page's root.
 */
const pageOf = (item: Rendered, status: Option.Option<Rendered>, disabled = false): Element => {
  const submit = disabled
    ? '<button disabled type="submit">Submit</button>'
    : '<button type="submit">Submit</button>';
  const page = rootOf(
    `<div lang="en">${Option.match(status, { onNone: () => "", onSome: (part) => part.html })}<form action="/submit" method="post" novalidate>${item.html}${submit}</form></div>`,
  );

  assert.deepStrictEqual(checkTree(page, { baseLevel: 2 }), [], "checkTree passes on the page");

  return page;
};

/**
 * Compose the first page of an item: its render with no inputs, in the author's form.
 *
 * @param opened The item.
 * @param configuration The configuration.
 * @returns The page's root.
 */
const firstPage = Effect.fnUntraced(function* firstPage(
  opened: Opened,
  configuration: Configuration,
) {
  return pageOf(
    yield* Effect.fromResult(render(opened.redacted, configuration, { instance })),
    Option.none(),
  );
});

/**
 * What one submission of the author's form gave: each posted response decoded, the strings the
 * form sent for each, and `checkResponses`' messages.
 */
interface Posted {
  readonly decoded: Readonly<Record<string, Value | Malformed>>;
  readonly messages: readonly ValidationMessage[];
  readonly sent: Readonly<Record<string, readonly string[]>>;
}

/**
 * Walk a page by keys until its form submits, keep the entries named for the instance, decode each
 * response under its entry name, and check the responses.
 *
 * @param opened The item.
 * @param configuration The configuration.
 * @param page The page walked.
 * @param keys The keys pressed, which must submit the form.
 * @returns The decoded responses, the strings sent, and the messages.
 */
const submit = (
  opened: Opened,
  configuration: Configuration,
  page: Element,
  keys: readonly Key[],
): Posted => {
  const entries = Option.getOrElse(keyboardWalk(page, keys), () =>
    assert.fail("the keys never submit the form"),
  );
  const { own } = partition(entries, instance);
  // A record response, which no item here declares, has no base type, so it is left out.
  const bindings = opened.redacted.responses.flatMap((response) =>
    response.cardinality !== "record" && isPosted(response.baseType)
      ? [
          {
            baseType: response.baseType,
            cardinality: response.cardinality,
            identifier: response.identifier,
            name: entryName(instance, response.identifier),
          },
        ]
      : [],
  );
  const decoded = Object.fromEntries(
    bindings.map((binding) => [binding.identifier, Result.merge(decode(own, binding))] as const),
  );
  const sent = Object.fromEntries(
    bindings.map(({ identifier, name }) => [
      identifier,
      entries.flatMap(([posted, value]) => (posted === name ? [value] : [])),
    ]),
  );

  return {
    decoded,
    messages: checkResponses(opened.accepted, decoded, configuration),
    sent,
  };
};

/**
 * Compose the page of a refused post: the Status part with the messages, then the item showing the
 * strings the form sent, its invalid Controls marked, the first of which takes `autofocus`.
 *
 * @param opened The item.
 * @param configuration The configuration.
 * @param refused The refused post.
 * @returns The page's root.
 */
const refusedPage = Effect.fnUntraced(function* refusedPage(
  opened: Opened,
  configuration: Configuration,
  refused: Posted,
) {
  assert.isNotEmpty(refused.messages, "the post is refused");

  const status = yield* Effect.fromResult(
    renderStatus({ heading: "notAccepted", instance, messages: refused.messages }, configuration),
  );
  const item = yield* Effect.fromResult(
    render(opened.redacted, configuration, {
      instance,
      messages: refused.messages,
      posted: refused.sent,
    }),
  );

  return pageOf(item, Option.some(status));
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

/**
 * Write the score a stored record holds as the candidate reads it in English: its single float
 * `SCORE`.
 *
 * @param record The record `score` returned.
 * @returns The written score, or none when `SCORE` is not a single float.
 */
const scoreTextOf = (record: StoredRecord): Option.Option<string> => {
  const [single] = record.outcomes["SCORE"]?.values ?? [];

  return single?.baseType === "float"
    ? Option.map(decodeStoredFloat(single.value), (number) =>
        new Intl.NumberFormat("en").format(number),
      )
    : Option.none();
};

/**
 * Score an accepted post, then compose the page after it: the Status part, focused, with the score
 * when the item has response processing, and the item showing the scored values, disabled with its
 * submit control after the one attempt the default configuration allows.
 *
 * @param opened The item.
 * @param configuration The configuration.
 * @param accepted The accepted post.
 * @returns The record `score` returned.
 */
const scored = Effect.fnUntraced(function* scored(
  opened: Opened,
  configuration: Configuration,
  accepted: Posted,
) {
  assert.deepStrictEqual(accepted.messages, [], "the post is accepted");

  const values = Object.fromEntries(
    Object.entries(accepted.decoded).map(
      ([response, value]) =>
        [
          response,
          value instanceof Malformed ? assert.fail(`${response} is malformed`) : value,
        ] as const,
    ),
  );
  const record = yield* Effect.fromResult(score(opened.accepted, values));
  const said = Option.isSome(opened.accepted.item.processing) ? scoreTextOf(record) : Option.none();
  const status = yield* Effect.fromResult(
    renderStatus(
      Option.match(said, {
        onNone: () => ({ autofocus: true, heading: "responseRecorded", instance }) as const,
        onSome: (written) =>
          ({ autofocus: true, heading: "scored", instance, score: written }) as const,
      }),
      configuration,
    ),
  );
  const item = yield* Effect.fromResult(
    render(opened.redacted, configuration, { disabled: true, instance, values }),
  );

  pageOf(item, Option.some(status), true);

  return record;
});

/**
 * Build the keys that walk a page's tab order once, in order, and then submit: from the stop that
 * holds `autofocus`, or from before the first stop when none does, Tab reaches each stop, the keys
 * `act` gives are pressed there, and Enter on the submit control, the last stop, submits.
 *
 * @param page The page.
 * @param act The keys to press at a stop, none to pass it by.
 * @returns The keys.
 */
const walkThrough = (page: Element, act: (stop: Element) => readonly Key[]): readonly Key[] => {
  const stops = tabOrder(page);
  const focused = stops.findIndex((stop) => attribute(stop, "autofocus") !== undefined);

  return stops.flatMap((stop, index): readonly Key[] => {
    if (index < focused) {
      return [];
    }

    const reach: readonly Key[] = index === focused ? [] : ["Tab"];

    return [...reach, ...(attribute(stop, "type") === "submit" ? ["Enter" as const] : act(stop))];
  });
};

/**
 * Give what to press at a stop to tick, or untick, the Controls at given presented positions: Space
 * on each of them, nothing elsewhere.
 *
 * @param page The page whose Controls the positions count.
 * @param picks The presented positions, from 0, by response identifier.
 * @returns The keys {@link walkThrough} presses at a stop.
 */
const ticking =
  (page: Element, picks: Readonly<Record<string, readonly number[]>>) =>
  (stop: Element): readonly Key[] =>
    Object.entries(picks).some(([response, positions]) =>
      positions.some((position) => controlsOf(page, response)[position] === stop),
    )
      ? ["Space"]
      : [];

describe("the M1-R witness: each feature through the composition an author builds", () => {
  it.effect(
    "[Q-20] [keyboard] a Text Entry's pattern-mask refuses a mismatching entry with the author's message, and a matching one is accepted and scores 1",
    () =>
      Effect.gen(function* patternMask() {
        const configuration = yield* configure({ validateResponses: true });
        const opened = yield* openBuilt("booking-code", bookingCode);
        const refused = submit(opened, configuration, yield* firstPage(opened, configuration), [
          "Tab",
          { type: "abc-12" },
          "Enter",
        ]);

        assert.deepStrictEqual(refused.messages, [{ response: "RESPONSE", text: codeMessage }]);

        const again = yield* refusedPage(opened, configuration, refused);
        const control =
          controlsOf(again, "RESPONSE")[0] ?? assert.fail("the refused page shows no Control");
        const status =
          elementsOf([again]).find((element) => attribute(element, "role") === "status") ??
          assert.fail("the refused page shows no Status region");

        assert.strictEqual(valueOf(control), "abc-12", "the Control shows the text sent");
        assert.strictEqual(attribute(control, "aria-invalid"), "true");
        assert.isDefined(attribute(control, "autofocus"), "the invalid Control takes focus");
        assert.include(textOf(status), codeMessage, "the Status part shows the author's message");

        const matching = submit(opened, configuration, yield* firstPage(opened, configuration), [
          "Tab",
          { type: "QTI-30" },
          "Enter",
        ]);
        const record = yield* scored(opened, configuration, matching);

        assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), ["QTI-30"]);
        assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [1]);
      }),
  );

  it.effect(
    "[Q-5] [keyboard] xhtml.xml posts the text typed into each xhtml Extended Text, as typed",
    () =>
      Effect.gen(function* xhtmlExtendedText() {
        const configuration = yield* configure({});
        const opened = yield* openAccepted(xhtmlItem, new TextEncoder().encode(xhtmlProbe));
        const typed = "Dear Sam,\nMy town is <b>small</b> & quiet.";
        const xhtml = ["RESPONSE2", "RESPONSE4", "RESPONSE5"];
        const page = yield* firstPage(opened, configuration);
        const formatted = elementsOf([page]).filter(
          (element) => attribute(element, "data-format") === "xhtml",
        );

        assert.deepStrictEqual(
          formatted.map((control) => attribute(control, "name")),
          xhtml.map((response) => entryName(instance, response)),
          "the xhtml Controls",
        );

        const record = yield* scored(
          opened,
          configuration,
          submit(
            opened,
            configuration,
            page,
            walkThrough(page, (stop) => (formatted.includes(stop) ? [{ type: typed }] : [])),
          ),
        );

        assert.lengthOf(opened.redacted.responses, 5, "the item declares five responses");
        for (const { identifier } of opened.redacted.responses) {
          assert.deepStrictEqual(
            valuesOf(record.responses, identifier),
            xhtml.includes(identifier) ? [typed] : [],
            identifier,
          );
        }
      }),
  );

  it.effect(
    "align-54 choice witness W1: choices.xml is accepted, three shuffled multiple Choices of six elements each with no identifier shared: RESPONSE1 at most 2 with the author's message, RESPONSE2 at most 2, RESPONSE3 at least 2 with the author's message, and no outcome or response processing",
    () =>
      Effect.gen(function* choicesWitness() {
        const { accepted } = yield* openAccepted(
          choicesItem,
          new TextEncoder().encode(choicesProbe),
        );
        const choices = choicesIn(accepted.item.body);
        const identifiers = choices.flatMap((choice) =>
          choice.choices.map((each) => each.identifier),
        );

        assert.deepStrictEqual(
          choices.map((choice) => [
            choice.response,
            choice.cardinality,
            choice.shuffle,
            choice.maxChoices,
            choice.minChoices,
            Option.toArray(choice.messages.max),
            Option.toArray(choice.messages.min),
            choice.choices.map((each) => each.identifier),
          ]),
          [
            ["RESPONSE1", "multiple", true, 2n, 0n, [tooManyMessage], [], [...elements.RESPONSE1]],
            ["RESPONSE2", "multiple", true, 2n, 0n, [], [], [...elements.RESPONSE2]],
            ["RESPONSE3", "multiple", true, 0n, 2n, [], [tooFewMessage], [...elements.RESPONSE3]],
          ],
        );
        assert.lengthOf(new Set(identifiers), 18, "no choice identifier is shared");
        assert.deepStrictEqual([...accepted.item.outcomes.keys()], [], "it declares no outcome");
        assert.isTrue(Option.isNone(accepted.item.processing), "it has no response processing");
        assert.deepStrictEqual(accepted.item.unsupported, [], "it shows no notice");
      }),
  );

  it.effect(
    "[Q-2] [keyboard] shuffled corpus Choices keep their order across a refused post with one instance and seed, and the presented choices post",
    () =>
      Effect.gen(function* refusedShuffle() {
        const configuration = yield* configure({ seed, validateResponses: true });
        const opened = yield* openAccepted(choicesItem, new TextEncoder().encode(choicesProbe));
        const responses = ["RESPONSE1", "RESPONSE2", "RESPONSE3"] as const;
        const first = yield* firstPage(opened, configuration);
        const presentedIn = (page: Element) =>
          responses.map((response) => controlsOf(page, response).map(valueOf));
        const presented = presentedIn(first);
        const at = (response: number, position: number): string =>
          presented[response]?.[position] ??
          assert.fail(`${responses[response] ?? ""} presents no choice ${String(position)}`);

        for (const [index, response] of responses.entries()) {
          const order = presented[index] ?? [];
          const offered: readonly string[] = elements[response];

          assert.sameMembers([...order], [...offered], "each Choice presents its six elements");
          assert.notDeepEqual([...order], [...offered], "each Choice is presented shuffled");
        }

        const refused = submit(
          opened,
          configuration,
          first,
          walkThrough(first, ticking(first, { RESPONSE1: [0, 1, 2] })),
        );

        assert.deepStrictEqual(refused.messages, [
          { response: "RESPONSE1", text: tooManyMessage },
          { response: "RESPONSE3", text: tooFewMessage },
        ]);

        const again = yield* refusedPage(opened, configuration, refused);
        const focused =
          controlsOf(again, "RESPONSE1")[0] ?? assert.fail("the refused page shows no Control");

        assert.deepStrictEqual(presentedIn(again), presented, "the orders survive the refusal");
        assert.sameMembers(
          controlsOf(again, "RESPONSE1").flatMap((control) =>
            attribute(control, "checked") === undefined ? [] : [valueOf(control)],
          ),
          [at(0, 0), at(0, 1), at(0, 2)],
          "the refused page shows the posted choices",
        );
        assert.isDefined(attribute(focused, "autofocus"), "the first invalid Control takes focus");

        const record = yield* scored(
          opened,
          configuration,
          submit(
            opened,
            configuration,
            again,
            walkThrough(again, ticking(again, { RESPONSE1: [2], RESPONSE3: [0, 1] })),
          ),
        );

        assert.isTrue(Option.isNone(opened.accepted.item.processing), "no processing scores it");
        assert.sameMembers([...valuesOf(record.responses, "RESPONSE1")], [at(0, 0), at(0, 1)]);
        assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE2"), []);
        assert.sameMembers([...valuesOf(record.responses, "RESPONSE3")], [at(2, 0), at(2, 1)]);
      }),
  );

  it.effect(
    "[Q-2] [I-9b] [keyboard] a shuffled corpus Choice posts the presented choice and scores it by identifier: ChoiceA, presented second, scores 1",
    () =>
      Effect.gen(function* presentedChoice() {
        const configuration = yield* configure({ seed });
        const opened = yield* openCorpus(fixedItem);
        const page = yield* firstPage(opened, configuration);

        assert.deepStrictEqual(controlsOf(page, "RESPONSE").map(valueOf), [
          "ChoiceC",
          "ChoiceA",
          "ChoiceB",
          "ChoiceD",
        ]);

        const record = yield* scored(
          opened,
          configuration,
          submit(opened, configuration, page, ["Tab", "ArrowDown", "Tab", "Enter"]),
        );

        assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), ["ChoiceA"]);
        assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [1]);
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect(
    "[Q-2] [I-9b] [keyboard] a ccPackage CC2_match item scores 1 by keyboard",
    () =>
      Effect.gen(function* ccPackage() {
        const configuration = yield* configure({});
        const opened = yield* openCorpus(ccPackageItem);
        const record = yield* scored(
          opened,
          configuration,
          submit(opened, configuration, yield* firstPage(opened, configuration), [
            "Tab",
            "Space",
            "Tab",
            "Enter",
          ]),
        );

        assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), ["true"]);
        assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [1]);
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect(
    "[Q-5] [keyboard] a hand-built ordered Extended Text posts its ordered value: in order it scores 1, reversed 0",
    () =>
      Effect.gen(function* orderedContainer() {
        const configuration = yield* configure({});
        const opened = yield* openBuilt("tea-steps", teaSteps);
        const walks: readonly (readonly [readonly string[], number])[] = [
          [["Boil the water", "Add the tea"], 1],
          [["Add the tea", "Boil the water"], 0],
        ];

        for (const [steps, expected] of walks) {
          const page = yield* firstPage(opened, configuration);
          const boxes = controlsOf(page, "RESPONSE");

          assert.lengthOf(boxes, 3, "max-strings gives three Controls");

          const record = yield* scored(
            opened,
            configuration,
            submit(
              opened,
              configuration,
              page,
              walkThrough(page, (stop) => {
                const step = steps[boxes.indexOf(stop)];

                return step === undefined ? [] : [{ type: step }];
              }),
            ),
          );

          assert.deepStrictEqual(valuesOf(record.responses, "RESPONSE"), steps);
          assert.deepStrictEqual(valuesOf(record.outcomes, "SCORE"), [expected]);
        }
      }),
  );
});
