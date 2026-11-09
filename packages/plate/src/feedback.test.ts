/**
 * Feedback as a candidate sees it: `qti-modal-feedback`, `qti-feedback-block` and
 * `qti-feedback-inline` shown, hidden or withheld by the outcome values of the attempt a page
 * shows, through the host's own round trip, `score`, `restore`, then `render(redact(…))` in
 * review.
 *
 * The rule each case holds (lane P's `plate-feedback-rule.md`, from the information model): a
 * feedback element's outcome value matches its `identifier` when it holds a single of base type
 * identifier equal to it, as the value for single cardinality or as a member for multiple
 * (FeedbackBlock `show-hide`, 5.49.3, FeedbackInline 5.52.3, ModalFeedback 5.93.2); `show`, a
 * block's and an inline's default, shows it exactly when the value matches, and `hide` exactly when
 * it does not. Once response processing has run (`attempt` `submitted`) feedback reads the record's
 * outcomes; before, the body is the one "displayed to the candidate at the start of each attempt",
 * "with the visibility of any integrated feedback determined by the default values of the outcome
 * variables" (ItemSessionControl `allow-review`, 7.19.3). Modal feedback "is shown to the candidate
 * directly following response processing" (5.93), so never before. Hidden content never reaches the
 * page, and an interaction inside hidden feedback "must also be hidden. The candidate must not be
 * able to set or update the value of the associated response variables" (5.49).
 *
 * The 1EdTech cases read the corpus (tag `corpus`), and skip when it is missing.
 *
 * @module
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";
import { h } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import {
  acceptedItem,
  begin,
  checkResponses,
  configure,
  encodeRedacted,
  open,
  openPackage,
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
  Node,
  Redacted,
  ResponseValue,
  Value,
} from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { textOf } from "#plate/test/accessibility.ts";
import { float } from "#plate/test/fixtures.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The instance token every render here passes.
 */
const instance = "fb";

/**
 * The ModalFeedback part's `data-slot` marker, read through the part table.
 */
const modalSlot = rowFor("item", "modalFeedback").slot;

/**
 * The Notice part's `data-slot` marker, read through the part table.
 */
const noticeSlot = rowFor("item", "notice").slot;

/**
 * The QTI 3.0 namespace every hand-written item declares.
 */
const qti = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The three feedback elements, as an item's verdict names a feature.
 */
const feedbackFeatures: ReadonlySet<string> = new Set([
  "qti-feedback-block",
  "qti-feedback-inline",
  "qti-modal-feedback",
]);

/**
 * Construct a single identifier value.
 *
 * @param name The identifier.
 * @returns The value.
 */
const identifier = (name: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: name }],
});

/**
 * Construct a multiple identifier value, NULL when it holds none.
 *
 * @param members Its members.
 * @returns The value.
 */
const identifiers = (...members: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "multiple",
  values: members.map((value) => ({ baseType: "identifier", value })),
});

/**
 * Open an item's text, which `check` must accept with either accepting verdict.
 *
 * @param location The location `open` takes.
 * @param xml The item's XML.
 * @returns The accepted item.
 */
const openXml = Effect.fnUntraced(function* openXml(location: string, xml: string) {
  const verdict = yield* open(location, new TextEncoder().encode(xml));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Replace each MathML `math` element of a document, prefixed or not, by the text `[math]`. plate
 * leaves an item that holds MathML unchecked, so the BPIG feedback examples that hold some
 * (Example03, Example04) open only so.
 *
 * @param xml The document.
 * @returns The document with no MathML.
 */
const withoutMathml = (xml: string): string =>
  xml.replaceAll(/<(?<prefix>m:)?math\b[\s\S]*?<\/\k<prefix>math>/gu, "[math]");

/**
 * Open a corpus item, its MathML replaced ({@link withoutMathml}), which `check` must accept.
 *
 * @param location The item's path under the corpus root.
 * @returns The accepted item.
 */
const openCorpusItem = Effect.fnUntraced(function* openCorpusItem(location: string) {
  const bytes = yield* readCorpusFile(location);

  return yield* openXml(location, withoutMathml(new TextDecoder().decode(bytes)));
});

/**
 * What one render shows: the redacted item, its HTML, the Root, its text, and its modal feedback.
 */
interface Shown {
  readonly html: string;
  /**
   * The text of each ModalFeedback part, in document order.
   */
  readonly modal: readonly string[];
  /**
   * The ModalFeedback parts, in document order.
   */
  readonly modalParts: readonly Element[];
  readonly redacted: Redacted;
  readonly root: Element;
  /**
   * The Root's text, whitespace collapsed.
   */
  readonly text: string;
}

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the text an element holds as written, every text node below it in document order, with
 * whitespace collapsed and trimmed. Unlike an accessible name, it never reads an `aria-label` in
 * place of the content, so a titled modal feedback gives its content, not its title.
 *
 * @param element The element.
 * @returns Its text.
 */
const contentOf = (element: Element): string => {
  const below = (node: Node): string =>
    node.kind === "text" ? node.text : node.children.map(below).join("");

  return below(element).replaceAll(/\s+/gu, " ").trim();
};

/**
 * Give the elements of a tree a `data-slot` marks.
 *
 * @param nodes The tree's nodes.
 * @param slot The marker.
 * @returns The elements, in document order.
 */
const slotted = (nodes: readonly Node[], slot: string): readonly Element[] =>
  elementsOf(nodes).filter((element) => element.attrs["data-slot"] === slot);

/**
 * Render an item as an app shows it to a candidate: `redact` by the record, then `render` in
 * review with the responses the record holds.
 *
 * @param accepted The accepted item.
 * @param configuration The configuration.
 * @param record The record `redact` shows the item by; none for no record.
 * @param values The responses the controls show.
 * @returns What the render shows.
 */
const shownBy = (
  accepted: Accepted,
  configuration: Configuration,
  record?: ItemRecord,
  values: Readonly<Record<string, ResponseValue>> = {},
): Shown => {
  const redacted = redact(accepted, record, configuration);
  const { html } = Result.getOrElse(
    render(redacted, configuration, { instance, mode: "review", values }),
    (failure) => assert.fail(`render failed: ${failure._tag}`),
  );
  const [root] = parseHtml(html);
  const element = root?.kind === "element" ? root : assert.fail("the render holds no Root element");
  const modalParts = slotted([element], modalSlot);

  return {
    html,
    modal: modalParts.map(contentOf),
    modalParts,
    redacted,
    root: element,
    text: contentOf(element),
  };
};

/**
 * Score an attempt and restore its record, as a host does between the post and the next page.
 *
 * @param accepted The accepted item.
 * @param responses The responses posted.
 * @param stored The record before the attempt, none for an item delivered alone and unbegun.
 * @returns The restored record and responses.
 */
const scoredBy = (
  accepted: Accepted,
  responses: Readonly<Record<string, ResponseValue>>,
  stored?: Parameters<typeof score>[2],
) =>
  Result.getOrElse(
    Result.flatMap(score(accepted, responses, stored), (scored) => restore(accepted, scored)),
    (failure) => assert.fail(`scoring failed: ${failure._tag}`),
  );

/**
 * Begin an item's record and restore it, as a host shows an item's first attempt.
 *
 * @param accepted The accepted item.
 * @returns The record, attempt `none`.
 */
const begun = (accepted: Accepted): ItemRecord =>
  Result.getOrElse(
    Result.flatMap(begin(accepted, { instance, seed: "1" }), (stored) => restore(accepted, stored)),
    (failure) => assert.fail(`begin failed: ${failure._tag}`),
  ).record;

/**
 * Give a record whose response processing has run with an outcome set, or left out.
 *
 * @param record The record.
 * @param outcome The outcome's identifier.
 * @param value Its value; none to leave the outcome out of the record.
 * @returns The record, attempt `submitted`.
 */
const submittedWith = (
  record: ItemRecord,
  outcome: string,
  value: Option.Option<Value>,
): ItemRecord => ({
  ...record,
  attempt: "submitted",
  outcomes: Option.match(value, {
    onNone: () =>
      Object.fromEntries(Object.entries(record.outcomes).filter(([key]) => key !== outcome)),
    onSome: (held) => ({ ...record.outcomes, [outcome]: held }),
  }),
});

/**
 * The BPIG items the information model's feedback examples are, by corpus path.
 */
const bpig = {
  adaptive: "QTI3_BPIG_Examples/items/Example05-feedbackBlock-adaptive.xml",
  inline: "QTI3_BPIG_Examples/items/Example02-feedbackInline.xml",
  modal: "QTI3_BPIG_Examples/items/Example01-modalFeedback.xml",
  solution: "QTI3_BPIG_Examples/items/Example03-feedbackBlock-solution.xml",
  templateBlock: "QTI3_BPIG_Examples/items/Example04-feedbackBlock-templateBlock.xml",
} as const;

describe("the BPIG feedback examples", { tags: ["corpus"] }, () => {
  it.effect(
    "[I-10] Example01-modalFeedback shows only correct after the right answer, only incorrect after a wrong one, and neither before scoring",
    () =>
      Effect.gen(function* modalExample() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.modal);
        const right = scoredBy(accepted, { RESPONSE: identifier("true") });
        const wrong = scoredBy(accepted, { RESPONSE: identifier("false") });

        assert.deepStrictEqual(accepted.unsupported, []);
        assert.deepStrictEqual(shownBy(accepted, configuration, right.record, right.values).modal, [
          "correct",
        ]);
        assert.deepStrictEqual(shownBy(accepted, configuration, wrong.record, wrong.values).modal, [
          "incorrect",
        ]);
        assert.deepStrictEqual(shownBy(accepted, configuration, begun(accepted)).modal, []);
        assert.deepStrictEqual(shownBy(accepted, configuration).modal, []);
      }),
  );

  it.effect(
    "[I-10] Example01-modalFeedback shows the same modal feedback in answering as in review, and through a host's own part for it",
    () =>
      Effect.gen(function* modalModesAndPart() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.modal);
        const right = scoredBy(accepted, { RESPONSE: identifier("true") });
        const redacted = redact(accepted, right.record, configuration);
        const answering = yield* Effect.fromResult(
          render(redacted, configuration, { instance, values: right.values }),
        );
        const swapped = yield* Effect.fromResult(
          render(redacted, configuration, {
            instance,
            mode: "review",
            parts: { item: { modalFeedback: (props, children) => h("aside", props, children) } },
            values: right.values,
          }),
        );
        const [part] = slotted(parseHtml(answering.html), modalSlot);
        const [aside] = slotted(parseHtml(swapped.html), modalSlot);

        assert.strictEqual(part === undefined ? "" : contentOf(part), "correct");
        assert.strictEqual(aside?.tag, "aside");
        assert.strictEqual(aside === undefined ? "" : contentOf(aside), "correct");
      }),
  );

  it.effect(
    "[I-10] Example01-modalFeedback writes each shown modal feedback inside the Root after the body, a section with no aria-label when it has no title",
    () =>
      Effect.gen(function* modalPlacement() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.modal);
        const right = scoredBy(accepted, { RESPONSE: identifier("true") });
        const shown = shownBy(accepted, configuration, right.record, right.values);
        const [part] = shown.modalParts;

        assert.strictEqual(shown.root.tag, "qti-assessment-item");
        assert.strictEqual(part?.tag, "section");
        assert.isUndefined(part?.attrs["aria-label"]);
        assert.strictEqual(shown.root.children.at(-1), part, "the modal feedback ends the Root");
      }),
  );

  it.effect(
    "[I-7] Example02-feedbackInline shows neither choice's inline feedback before scoring, only That's correct after true, and only That's not correct after false",
    () =>
      Effect.gen(function* inlineExample() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.inline);
        const right = scoredBy(accepted, { RESPONSE: identifier("true") });
        const wrong = scoredBy(accepted, { RESPONSE: identifier("false") });
        const shownRight = shownBy(accepted, configuration, right.record, right.values).text;
        const shownWrong = shownBy(accepted, configuration, wrong.record, wrong.values).text;

        assert.deepStrictEqual(accepted.unsupported, []);
        for (const before of [
          shownBy(accepted, configuration).text,
          shownBy(accepted, configuration, begun(accepted)).text,
        ]) {
          assert.notInclude(before, "That's");
          assert.include(before, "True");
        }

        assert.include(shownRight, "That's correct");
        assert.notInclude(shownRight, "That's not correct");
        assert.include(shownWrong, "That's not correct");
        assert.notInclude(shownWrong, "That's correct");
      }),
  );

  it.effect(
    "[I-7] Example03-feedbackBlock-solution shows a block or inline when the multiple FEEDBACK contains its identifier, and its solution button's block until processing clears ASKSOLUTION",
    () =>
      Effect.gen(function* solutionExample() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.solution);
        const start = shownBy(accepted, configuration, begun(accepted));
        const right = scoredBy(accepted, { RESPONSE: float(7.389) });
        const wrong = scoredBy(accepted, { RESPONSE: float(1) });
        const shownRight = shownBy(accepted, configuration, right.record, right.values);
        const shownWrong = shownBy(accepted, configuration, wrong.record, wrong.values);
        const solution = shownBy(
          accepted,
          configuration,
          submittedWith(
            right.record,
            "FEEDBACK",
            Option.some(identifiers("SOLUTION", "SEEN-SOLUTION")),
          ),
        );

        // At the start, ASKSOLUTION holds its default, asksolution, and FEEDBACK is NULL.
        assert.include(
          start.redacted.notices,
          "qti-end-attempt-interaction",
          "the shown asksolution block's end-attempt notice is named",
        );
        assert.notInclude(start.text, "Correct");
        assert.notInclude(start.text, "No, that is not the correct answer");
        assert.notInclude(start.text, "your score for this question will be 0");

        assert.include(shownRight.text, "Correct");
        assert.notInclude(shownRight.text, "No, that is not the correct answer");
        assert.include(shownWrong.text, "No, that is not the correct answer");
        for (const scored of [shownRight, shownWrong]) {
          assert.notInclude(
            scored.redacted.notices,
            "qti-end-attempt-interaction",
            "a notice inside the hidden asksolution block is not named",
          );
          assert.lengthOf(slotted([scored.root], noticeSlot), 0);
          assert.notInclude(
            scored.redacted.responses.map((response) => response.identifier),
            "SOLREQUEST",
            "the response only the hidden block binds is hidden-only",
          );
        }

        assert.include(solution.text, "your score for this question will be 0");
        assert.notInclude(solution.text, "Correct");
        assert.notInclude(solution.text, "No, that is not the correct answer");
      }),
  );

  it.effect(
    "[I-5] Example04-feedbackBlock-templateBlock withholds every feedback block and inline with no record, naming none of the template parts inside them, and under begin's record shows only the blocks its outcome defaults show",
    () =>
      Effect.gen(function* templateBlockExample() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.templateBlock);
        const withheld = shownBy(accepted, configuration);
        const start = shownBy(accepted, configuration, begun(accepted));

        assert.includeMembers(
          [...withheld.redacted.notices],
          ["qti-feedback-block", "qti-feedback-inline"],
        );
        assert.notInclude(withheld.redacted.notices, "qti-template-block");
        assert.notInclude(withheld.redacted.notices, "qti-template-inline");
        assert.notInclude(withheld.text, "Incorrect");

        assert.notInclude(start.redacted.notices, "qti-feedback-block");
        assert.notInclude(start.redacted.notices, "qti-feedback-inline");
        assert.include(start.redacted.notices, "qti-end-attempt-interaction");
        for (const hidden of [
          "OK",
          "Not far off",
          "Incorrect",
          "here is the solution",
          "Sine Rule",
        ]) {
          assert.notInclude(start.text, hidden);
        }
      }),
  );

  it.effect(
    "[I-7] Example05-feedbackBlock-adaptive posts only the interaction of the part its BODY shows: RESPONSE1 at the start, the drop-downs of option2 after choosing them",
    () =>
      Effect.gen(function* adaptiveExample() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.adaptive);
        const start = begun(accepted);
        const chosen = scoredBy(accepted, { RESPONSE1: identifier("OPTION2") });
        const posted = (record: ItemRecord): readonly string[] =>
          postings(redact(accepted, record, configuration), instance).map(
            (posting) => posting.identifier,
          );
        const second = shownBy(accepted, configuration, chosen.record, chosen.values).text;

        assert.deepStrictEqual(posted(start), ["RESPONSE1"]);
        assert.deepStrictEqual(posted(chosen.record), ["RESPONSE22", "RESPONSE23", "RESPONSE24"]);
        assert.include(second, "OK, this is the type of input you have chosen");
        assert.notInclude(second, "Which of these input methods");
        assert.notInclude(second, "Choose the correct saying");
      }),
  );

  it.effect(
    "[I-7] Example05-feedbackBlock-adaptive ignores, in checkResponses and score, a response only hidden feedback binds, and judges a shown one",
    () =>
      Effect.gen(function* adaptiveHiddenResponses() {
        const configuration = yield* configure({});
        const accepted = yield* openCorpusItem(bpig.adaptive);
        const start = begun(accepted);
        const chosen = scoredBy(accepted, { RESPONSE1: identifier("OPTION2") });
        const stray = identifier("ZZZ");
        const forged = scoredBy(accepted, {
          RESPONSE1: identifier("OPTION2"),
          RESPONSE21: identifier("OPTION210"),
        });

        assert.deepStrictEqual(
          checkResponses(accepted, { RESPONSE22: stray }, configuration, start),
          [],
        );
        assert.deepStrictEqual(
          checkResponses(accepted, { RESPONSE22: stray }, configuration, chosen.record),
          [{ response: "RESPONSE22", text: message("en", "unknownChoice") }],
        );
        assert.deepStrictEqual(
          forged.values["RESPONSE21"],
          start.responses["RESPONSE21"],
          "score keeps the record's value of a response only hidden feedback binds",
        );
      }),
  );
});

/**
 * The cardinality of the outcome a grid item's feedback reads.
 */
type GridCardinality = "multiple" | "single";

/**
 * The grid's elements, each by the marker its content holds: a block, an inline and a modal
 * feedback, each with `show-hide` `show` (the block's and the inline's left to the default) and
 * `hide`, all over the outcome `FB` and the identifier `A`.
 */
const gridMarkers = [
  "BLOCKSHOW",
  "BLOCKHIDE",
  "INLINESHOW",
  "INLINEHIDE",
  "MODALSHOW",
  "MODALHIDE",
] as const;

/**
 * Write the grid item: {@link gridMarkers}' six elements over `FB`, an identifier outcome of a
 * cardinality, with a declared default or none.
 *
 * @param cardinality `FB`'s cardinality.
 * @param initial `FB`'s declared default, none for no default.
 * @returns The item's XML.
 */
const gridXml = (cardinality: GridCardinality, initial: Option.Option<string>): string =>
  [
    `<qti-assessment-item xmlns="${qti}" identifier="grid" title="Grid" adaptive="false" time-dependent="false">`,
    `<qti-outcome-declaration identifier="FB" cardinality="${cardinality}" base-type="identifier">`,
    Option.match(initial, {
      onNone: () => "",
      onSome: (value) => `<qti-default-value><qti-value>${value}</qti-value></qti-default-value>`,
    }),
    "</qti-outcome-declaration>",
    "<qti-item-body>",
    '<qti-feedback-block outcome-identifier="FB" identifier="A"><qti-content-body><p>BLOCKSHOW</p></qti-content-body></qti-feedback-block>',
    '<qti-feedback-block outcome-identifier="FB" identifier="A" show-hide="hide"><qti-content-body><p>BLOCKHIDE</p></qti-content-body></qti-feedback-block>',
    '<p>Inline: <qti-feedback-inline outcome-identifier="FB" identifier="A">INLINESHOW</qti-feedback-inline> <qti-feedback-inline outcome-identifier="FB" identifier="A" show-hide="hide">INLINEHIDE</qti-feedback-inline></p>',
    "</qti-item-body>",
    '<qti-modal-feedback outcome-identifier="FB" identifier="A" show-hide="show"><qti-content-body>MODALSHOW</qti-content-body></qti-modal-feedback>',
    '<qti-modal-feedback outcome-identifier="FB" identifier="A" show-hide="hide"><qti-content-body>MODALHIDE</qti-content-body></qti-modal-feedback>',
    "</qti-assessment-item>",
  ].join("");

/**
 * The values the grid sets `FB` to, by its cardinality: NULL, `A`, an identifier that matches no
 * element, and for multiple, `A` among others, and others without `A`.
 */
const gridValues: Readonly<Record<GridCardinality, readonly Value[]>> = {
  multiple: [
    identifiers(),
    identifiers("A"),
    identifiers("B"),
    identifiers("B", "A"),
    identifiers("B", "C"),
  ],
  single: [
    { baseType: "identifier", cardinality: "single", values: [] },
    identifier("A"),
    identifier("B"),
  ],
};

/**
 * Decide, as the rule says and never from plate's code, which of the grid's markers the page shows
 * for a value of `FB`: `A` matches when the value holds it as itself or a member; `show` shows its
 * element exactly when it matches and `hide` exactly when it does not; and a modal feedback only
 * once response processing has run.
 *
 * @param value `FB`'s value.
 * @param submitted Whether response processing has run in the attempt shown.
 * @returns The markers shown, in {@link gridMarkers}' order.
 */
const gridExpected = (value: Value, submitted: boolean): readonly string[] => {
  const matches = value.values.some(
    (single) => single.baseType === "identifier" && single.value === "A",
  );

  return gridMarkers.filter(
    (marker) =>
      (submitted || !marker.startsWith("MODAL")) && (marker.endsWith("SHOW") ? matches : !matches),
  );
};

/**
 * Give the grid's markers a render shows.
 *
 * @param shown The render.
 * @returns The markers, in {@link gridMarkers}' order.
 */
const gridShown = (shown: Shown): readonly string[] =>
  gridMarkers.filter((marker) => shown.text.includes(marker));

describe("feedback visibility over a grid of values", () => {
  for (const cardinality of ["single", "multiple"] as const) {
    it.effect(
      `[I-10] [I-7] shows each block, inline and modal feedback over a ${cardinality} FB exactly as the rule decides, for every value once processing has run`,
      () =>
        Effect.gen(function* gridSubmitted() {
          const configuration = yield* configure({});
          const accepted = yield* openXml("items/grid.xml", gridXml(cardinality, Option.none()));
          const record = begun(accepted);

          assert.deepStrictEqual(accepted.unsupported, []);
          for (const value of gridValues[cardinality]) {
            const shown = shownBy(
              accepted,
              configuration,
              submittedWith(record, "FB", Option.some(value)),
            );

            assert.deepStrictEqual(
              gridShown(shown),
              gridExpected(value, true),
              JSON.stringify(value.values),
            );
            assert.deepStrictEqual(shown.redacted.notices, []);
          }
        }),
    );

    it.effect(
      `[I-10] [I-7] before processing runs, shows the blocks and inlines a ${cardinality} FB's starting value shows, whatever the record's outcomes hold, and no modal feedback`,
      () =>
        Effect.gen(function* gridBefore() {
          const configuration = yield* configure({});
          const unset = yield* openXml("items/grid.xml", gridXml(cardinality, Option.none()));
          const preset = yield* openXml("items/grid.xml", gridXml(cardinality, Option.some("A")));
          const starting = cardinality === "single" ? identifier("A") : identifiers("A");
          const nothing = gridValues[cardinality][0] ?? assert.fail("the grid has no NULL value");

          for (const [accepted, start] of [
            [unset, nothing],
            [preset, starting],
          ] as const) {
            const record = begun(accepted);

            assert.deepStrictEqual(
              gridShown(shownBy(accepted, configuration)),
              gridExpected(start, false),
            );
            assert.deepStrictEqual(
              gridShown(shownBy(accepted, configuration, record)),
              gridExpected(start, false),
            );
            for (const value of gridValues[cardinality]) {
              assert.deepStrictEqual(
                gridShown(
                  shownBy(accepted, configuration, {
                    ...record,
                    outcomes: { ...record.outcomes, FB: value },
                  }),
                ),
                gridExpected(start, false),
                `attempt none, FB ${JSON.stringify(value.values)}`,
              );
            }
          }
        }),
    );
  }

  it.effect(
    "[I-10] [I-7] withholds a block and an inline whose outcome a submitted record holds no value of as their notices, and a modal feedback as a section holding only its notice",
    () =>
      Effect.gen(function* withheldGrid() {
        const configuration = yield* configure({});
        const accepted = yield* openXml("items/grid.xml", gridXml("single", Option.none()));
        const shown = shownBy(
          accepted,
          configuration,
          submittedWith(begun(accepted), "FB", Option.none()),
        );
        const notices = slotted([shown.root], noticeSlot).map(textOf);

        assert.deepStrictEqual(gridShown(shown), []);
        assert.sameMembers(
          [...shown.redacted.notices],
          [
            "qti-feedback-block",
            "qti-feedback-block",
            "qti-feedback-inline",
            "qti-feedback-inline",
            "qti-modal-feedback",
            "qti-modal-feedback",
          ],
        );
        assert.lengthOf(shown.modalParts, 2);
        for (const part of shown.modalParts) {
          assert.deepStrictEqual(
            textOf(part),
            message("en", "notice", { feature: "qti-modal-feedback" }),
          );
          assert.isUndefined(part.attrs["aria-label"]);
        }

        assert.include(notices, message("en", "notice", { feature: "qti-feedback-block" }));
        assert.include(notices, message("en", "notice", { feature: "qti-feedback-inline" }));
      }),
  );
});

/**
 * Write an item whose template processing runs: it sets `FB`'s default to `B` over its declared
 * `A`, and it shows a feedback block for each.
 *
 * @returns The item's XML.
 */
const templatedXml = (): string =>
  [
    `<qti-assessment-item xmlns="${qti}" identifier="templated" title="Templated" adaptive="false" time-dependent="false">`,
    '<qti-outcome-declaration identifier="FB" cardinality="single" base-type="identifier"><qti-default-value><qti-value>A</qti-value></qti-default-value></qti-outcome-declaration>',
    "<qti-item-body>",
    '<qti-feedback-block outcome-identifier="FB" identifier="A"><qti-content-body><p>SHOWS-A</p></qti-content-body></qti-feedback-block>',
    '<qti-feedback-block outcome-identifier="FB" identifier="B"><qti-content-body><p>SHOWS-B</p></qti-content-body></qti-feedback-block>',
    "</qti-item-body>",
    '<qti-template-processing><qti-set-default-value identifier="FB"><qti-base-value base-type="identifier">B</qti-base-value></qti-set-default-value></qti-template-processing>',
    "</qti-assessment-item>",
  ].join("");

/**
 * Write an adaptive item whose feedback holds content plate shows as a notice, an End Attempt
 * interaction, and nests: a feedback inline in a feedback block, and a feedback block in a template
 * block, each over its own outcome.
 *
 * @returns The item's XML.
 */
const nestedXml = (): string =>
  [
    `<qti-assessment-item xmlns="${qti}" identifier="nested" title="Nested" adaptive="true" time-dependent="false">`,
    '<qti-response-declaration identifier="ASK" cardinality="single" base-type="boolean"/>',
    '<qti-outcome-declaration identifier="OUTER" cardinality="single" base-type="identifier"/>',
    '<qti-outcome-declaration identifier="INNER" cardinality="single" base-type="identifier"/>',
    '<qti-template-declaration identifier="T" cardinality="single" base-type="identifier"><qti-default-value><qti-value>on</qti-value></qti-default-value></qti-template-declaration>',
    "<qti-item-body>",
    '<qti-feedback-block outcome-identifier="OUTER" identifier="O" id="tip" class="tip" xml:lang="fr"><qti-content-body>',
    '<p>OUTER-TEXT <qti-feedback-inline outcome-identifier="INNER" identifier="I">INNER-TEXT</qti-feedback-inline></p>',
    '<p><qti-end-attempt-interaction response-identifier="ASK" title="Hint"/></p>',
    "</qti-content-body></qti-feedback-block>",
    '<qti-template-block template-identifier="T" identifier="on"><qti-content-body>',
    '<qti-feedback-block outcome-identifier="INNER" identifier="I"><qti-content-body><p>TEMPLATED-TEXT</p></qti-content-body></qti-feedback-block>',
    "</qti-content-body></qti-template-block>",
    "</qti-item-body>",
    "</qti-assessment-item>",
  ].join("");

/**
 * Give the markers of {@link nestedXml}'s three feedback contents a render shows.
 *
 * @param shown The render.
 * @returns The markers, in document order.
 */
const nestedShown = (shown: Shown): readonly string[] =>
  ["OUTER-TEXT", "INNER-TEXT", "TEMPLATED-TEXT"].filter((marker) => shown.text.includes(marker));

/**
 * Give the identifiers of the responses a redaction lists.
 *
 * @param redacted The redacted item.
 * @returns The identifiers, in its order.
 */
const responsesOf = (redacted: Redacted): readonly string[] =>
  redacted.responses.map((response) => response.identifier);

describe("feedback in its place", () => {
  it.effect(
    "[I-5] before an attempt, feedback reads the default template processing set, and with no record an item whose template processing runs withholds every block",
    () =>
      Effect.gen(function* templatedDefault() {
        const configuration = yield* configure({});
        const accepted = yield* openXml("items/templated.xml", templatedXml());
        const record = begun(accepted);
        const started = shownBy(accepted, configuration, record);
        const unrecorded = shownBy(accepted, configuration);

        assert.deepStrictEqual(record.defaults["FB"], identifier("B"));
        assert.include(started.text, "SHOWS-B");
        assert.notInclude(started.text, "SHOWS-A");
        assert.deepStrictEqual(started.redacted.notices, []);
        assert.notInclude(unrecorded.text, "SHOWS-A");
        assert.notInclude(unrecorded.text, "SHOWS-B");
        assert.deepStrictEqual(unrecorded.redacted.notices, [
          "qti-feedback-block",
          "qti-feedback-block",
        ]);
      }),
  );

  it.effect(
    "[I-7] shows a feedback inline inside a feedback block only where both show, and a feedback block inside a template block only where the template block shows",
    () =>
      Effect.gen(function* nested() {
        const configuration = yield* configure({});
        const accepted = yield* openXml("items/nested.xml", nestedXml());
        const record = begun(accepted);
        const both = submittedWith(
          submittedWith(record, "OUTER", Option.some(identifier("O"))),
          "INNER",
          Option.some(identifier("I")),
        );
        const innerOnly = submittedWith(both, "OUTER", Option.some(identifier("X")));
        const templateOff: ItemRecord = { ...both, templates: { T: identifier("off") } };

        assert.deepStrictEqual(nestedShown(shownBy(accepted, configuration, both)), [
          "OUTER-TEXT",
          "INNER-TEXT",
          "TEMPLATED-TEXT",
        ]);
        assert.deepStrictEqual(nestedShown(shownBy(accepted, configuration, innerOnly)), [
          "TEMPLATED-TEXT",
        ]);
        assert.deepStrictEqual(nestedShown(shownBy(accepted, configuration, templateOff)), [
          "OUTER-TEXT",
          "INNER-TEXT",
        ]);
      }),
  );

  it.effect(
    "[I-7] names a notice inside a shown feedback block and not one inside a hidden one, whose response is then hidden-only",
    () =>
      Effect.gen(function* noticeInFeedback() {
        const configuration = yield* configure({});
        const accepted = yield* openXml("items/nested.xml", nestedXml());
        const record = begun(accepted);
        const shown = shownBy(
          accepted,
          configuration,
          submittedWith(record, "OUTER", Option.some(identifier("O"))),
        );
        const hidden = shownBy(
          accepted,
          configuration,
          submittedWith(record, "OUTER", Option.some(identifier("X"))),
        );

        assert.include(shown.redacted.notices, "qti-end-attempt-interaction");
        assert.include(responsesOf(shown.redacted), "ASK");
        assert.notInclude(hidden.redacted.notices, "qti-end-attempt-interaction");
        assert.lengthOf(slotted([hidden.root], noticeSlot), 0);
        assert.notInclude(responsesOf(hidden.redacted), "ASK");
      }),
  );

  it.effect(
    "[I-7] leaves a shown block's content in its place with no wrapper, writing none of its id, class or lang, and no hidden content in the HTML or the redacted JSON",
    () =>
      Effect.gen(function* contentInPlace() {
        const configuration = yield* configure({});
        const accepted = yield* openXml("items/nested.xml", nestedXml());
        const record = begun(accepted);
        const shown = shownBy(
          accepted,
          configuration,
          submittedWith(record, "OUTER", Option.some(identifier("O"))),
        );
        const hidden = shownBy(
          accepted,
          configuration,
          submittedWith(record, "OUTER", Option.some(identifier("X"))),
        );
        const json = JSON.stringify(Result.getOrThrow(encodeRedacted(hidden.redacted)));

        assert.include(shown.text, "OUTER-TEXT");
        assert.isFalse(
          elementsOf([shown.root]).some(
            (element) =>
              String(element.attrs["id"] ?? "").endsWith("tip") ||
              String(element.attrs["class"] ?? "").includes("tip") ||
              element.attrs["lang"] === "fr" ||
              element.tag.startsWith("qti-feedback"),
          ),
          "the block's own id, class and lang are not written, nor any feedback element",
        );
        assert.notInclude(hidden.html, "OUTER-TEXT");
        assert.notInclude(json, "OUTER-TEXT");
        assert.notInclude(json, "feedback");
      }),
  );

  it.effect(
    "[I-10] gives a titled modal feedback's section its title as aria-label, and shows a hide modal feedback once processing has run and not before",
    () =>
      Effect.gen(function* titledModal() {
        const configuration = yield* configure({});
        const accepted = yield* openXml(
          "items/titled.xml",
          [
            `<qti-assessment-item xmlns="${qti}" identifier="titled" title="Titled" adaptive="false" time-dependent="false">`,
            '<qti-outcome-declaration identifier="FB" cardinality="single" base-type="identifier"/>',
            "<qti-item-body><p>Body</p></qti-item-body>",
            '<qti-modal-feedback outcome-identifier="FB" identifier="never" show-hide="hide" title="Well done"><qti-content-body><p>KEEP GOING</p></qti-content-body></qti-modal-feedback>',
            "</qti-assessment-item>",
          ].join(""),
        );
        const record = begun(accepted);
        const after = shownBy(
          accepted,
          configuration,
          submittedWith(record, "FB", Option.some(identifier("other"))),
        );

        assert.deepStrictEqual(shownBy(accepted, configuration).modal, []);
        assert.deepStrictEqual(shownBy(accepted, configuration, record).modal, []);
        assert.deepStrictEqual(after.modal, ["KEEP GOING"]);
        assert.strictEqual(after.modalParts[0]?.attrs["aria-label"], "Well done");
      }),
  );

  it.effect(
    "[I-7] [Q-12] shows an Inline Choice whose choice holds a feedback inline as the notice qti-inline-choice-interaction, as a native option shows only text",
    () =>
      Effect.gen(function* inlineChoiceFeedback() {
        const configuration = yield* configure({});
        const accepted = yield* openXml(
          "items/picker.xml",
          [
            `<qti-assessment-item xmlns="${qti}" identifier="picker" title="Picker" adaptive="false" time-dependent="false">`,
            '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
            '<qti-outcome-declaration identifier="FB" cardinality="single" base-type="identifier"/>',
            "<qti-item-body><p>Pick ",
            '<qti-inline-choice-interaction response-identifier="RESPONSE">',
            '<qti-inline-choice identifier="a">Ant<qti-feedback-inline outcome-identifier="FB" identifier="a"> (six legs)</qti-feedback-inline></qti-inline-choice>',
            '<qti-inline-choice identifier="b">Bee</qti-inline-choice>',
            "</qti-inline-choice-interaction></p></qti-item-body>",
            "</qti-assessment-item>",
          ].join(""),
        );
        const shown = shownBy(accepted, configuration, begun(accepted));

        assert.deepStrictEqual(
          accepted.unsupported.map((feature) => [feature.feature, feature.shown]),
          [["qti-inline-choice-interaction", "notice"]],
        );
        assert.deepStrictEqual(shown.redacted.notices, ["qti-inline-choice-interaction"]);
        assert.isFalse(elementsOf([shown.root]).some((element) => element.tag === "select"));
      }),
  );
});

/**
 * The feedback test package, the directory its zip was extracted into, under the corpus root.
 */
const feedbackPackage = "qtiv3-examples/packaging/feedbackTest/feedbackTest.zip.d";

/**
 * Read every file under a corpus package's directory, keyed by its path from the directory with
 * `/` separators, as a host unzips a package.
 *
 * @param directory The package's directory under the corpus root.
 * @returns The files.
 */
const packageFiles = Effect.fnUntraced(function* packageFiles(directory: string) {
  const root = path.join(yield* corpusRoot, directory);
  const entries = yield* Effect.promise(() =>
    readdir(root, { recursive: true, withFileTypes: true }),
  );
  const paths = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    );
  const contents = yield* Effect.all(
    paths.map((file) => Effect.promise(() => readFile(path.join(root, file)))),
  );

  return new Map(paths.map((file, index) => [file, contents[index] ?? new Uint8Array()] as const));
});

describe("feedbackTest.zip", { tags: ["corpus"] }, () => {
  it.effect(
    "[I-10] [I-7] opens every item of the package, its MathML replaced, with no feedback element marked or noticed, and refuses the package only for the item refs its test names and its zip lacks",
    () =>
      Effect.gen(function* feedbackTest() {
        const files = yield* packageFiles(feedbackPackage);
        const items = [...files.keys()].filter(
          (file) => file.startsWith("id-") && file.endsWith(".xml"),
        );
        const verdict = yield* openPackage(feedbackPackage, files);

        assert.lengthOf(items, 6);
        for (const file of items) {
          const accepted = yield* openXml(
            file,
            withoutMathml(new TextDecoder().decode(files.get(file))),
          );

          assert.deepStrictEqual(
            accepted.unsupported.filter((feature) => feedbackFeatures.has(feature.feature)),
            [],
            file,
          );
        }

        assert.deepStrictEqual(
          verdict.verdict === "refused"
            ? [...new Set(verdict.refusals.map((refusal) => refusal.rule))]
            : [],
          ["item-ref-unresolved"],
        );
      }),
  );
});
