/**
 * A review's answer marks against the solution: `render`'s `solution` option, in `review`, marks
 * each choice of a Choice and the answer of an Inline Choice or a Text Entry `right`, `wrong` or
 * `missed`, over the four pools of edullm's demo test, and marks nothing without it, in another
 * mode, under messages, or where no correct response says what is right.
 *
 * @module
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { RecordValue, Value } from "#plate/model/values.ts";
import { redact, render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { restore } from "#plate/restore.ts";
import { score } from "#plate/score.ts";
import type { Responses } from "#plate/session/session.ts";
import { solution } from "#plate/solution.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The instance token every render here passes, as the app's step pages do.
 */
const instance = "step-1";

/**
 * The markers the marks are read by: a Choice's row, Control and Mark, and the Inline Choice's and
 * the Text Entry's Control and Mark.
 */
const slot = {
  choice: rowFor("choice-interaction", "choice").slot,
  choiceControl: rowFor("choice-interaction", "control").slot,
  choiceMark: rowFor("choice-interaction", "mark").slot,
  inlineControl: rowFor("inline-choice-interaction", "control").slot,
  inlineMark: rowFor("inline-choice-interaction", "mark").slot,
  modalFeedback: rowFor("item", "modalFeedback").slot,
  textControl: rowFor("text-entry-interaction", "control").slot,
  textMark: rowFor("text-entry-interaction", "mark").slot,
};

/**
 * Write one item of edullm's demo pools at edullm 329c47930, its declarations and processing as
 * written there and its feedback shortened: `SCORE` set to `MAXSCORE`, 1, when the response matches
 * its correct response and to 0 otherwise, `FEEDBACK` set to `none` for NULL and to `answered` for
 * any answer, and a modal feedback for each, so the card's credit shows beside the marks.
 *
 * @param identifier The item's identifier, which is its title too.
 * @param declaration The response declaration, its correct response included.
 * @param body The item body.
 * @returns The document's bytes.
 */
const poolItem = (identifier: string, declaration: string, body: string): Uint8Array =>
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false" xml:lang="en">
  ${declaration}
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>1</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>
  <qti-item-body>${body}</qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-variable identifier="MAXSCORE"/></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-response-condition>
      <qti-response-if>
        <qti-is-null><qti-variable identifier="RESPONSE"/></qti-is-null>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">none</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="FEEDBACK"><qti-base-value base-type="identifier">answered</qti-base-value></qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
  </qti-response-processing>
  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="answered" show-hide="show"><qti-content-body><p>[answered]</p></qti-content-body></qti-modal-feedback>
  <qti-modal-feedback outcome-identifier="FEEDBACK" identifier="none" show-hide="show"><qti-content-body><p>[none]</p></qti-content-body></qti-modal-feedback>
</qti-assessment-item>`);

/**
 * The shapes pool's `shape-red-circle.xml`: a horizontal Choice of four pictures, the red circle
 * right.
 */
const redCircleItem = poolItem(
  "shape-red-circle",
  `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>red-circle</qti-value></qti-correct-response>
  </qti-response-declaration>`,
  `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1" shuffle="false" class="qti-orientation-horizontal">
      <qti-prompt>Which one is the red circle?</qti-prompt>
      <qti-simple-choice identifier="red-circle"><img src="https://cdn.edullm.ai/demo/shapes/red-circle.svg" alt="a red circle" width="120" height="120"/></qti-simple-choice>
      <qti-simple-choice identifier="blue-circle"><img src="https://cdn.edullm.ai/demo/shapes/blue-circle.svg" alt="a blue circle" width="120" height="120"/></qti-simple-choice>
      <qti-simple-choice identifier="red-square"><img src="https://cdn.edullm.ai/demo/shapes/red-square.svg" alt="a red square" width="120" height="120"/></qti-simple-choice>
      <qti-simple-choice identifier="yellow-triangle"><img src="https://cdn.edullm.ai/demo/shapes/yellow-triangle.svg" alt="a yellow triangle" width="120" height="120"/></qti-simple-choice>
    </qti-choice-interaction>`,
);

/**
 * The stars pool's `stars-01.xml`: a picture, then a Choice of the numbers 1 to 3, 1 right.
 */
const stars = poolItem(
  "stars-01",
  `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>N1</qti-value></qti-correct-response>
  </qti-response-declaration>`,
  `<p><img src="https://cdn.edullm.ai/demo/stars/1.svg" alt="1 yellow star" width="500" height="300"/></p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1" shuffle="false">
      <qti-prompt>How many stars?</qti-prompt>
      <qti-simple-choice identifier="N1">1</qti-simple-choice>
      <qti-simple-choice identifier="N2">2</qti-simple-choice>
      <qti-simple-choice identifier="N3">3</qti-simple-choice>
    </qti-choice-interaction>`,
);

/**
 * The sentence pool's `sentence-01.xml`: an Inline Choice in a sentence, moo right.
 */
const sentence = poolItem(
  "sentence-01",
  `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>moo</qti-value></qti-correct-response>
  </qti-response-declaration>`,
  `<p>Finish the sentence.</p>
    <p>A cow says <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="false">
      <qti-inline-choice identifier="moo">moo</qti-inline-choice>
      <qti-inline-choice identifier="quack">quack</qti-inline-choice>
      <qti-inline-choice identifier="tweet">tweet</qti-inline-choice>
    </qti-inline-choice-interaction>.</p>`,
);

/**
 * The typed number pool's `after-01.xml`: an integer Text Entry in a sentence, 2 right.
 */
const number = poolItem(
  "after-01",
  `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer">
    <qti-correct-response><qti-value>2</qti-value></qti-correct-response>
  </qti-response-declaration>`,
  `<p>Type the number that comes after 1.</p>
    <p>1, <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="2"/></p>`,
);

/**
 * A multiple Choice of three colours, red and blue right, so one review can show a right pick, a
 * wrong pick and a right choice missed.
 */
const colours = poolItem(
  "colours",
  `<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier">
    <qti-correct-response><qti-value>red</qti-value><qti-value>blue</qti-value></qti-correct-response>
  </qti-response-declaration>`,
  `<qti-choice-interaction response-identifier="RESPONSE" max-choices="0" shuffle="false">
      <qti-prompt>Which are colours of the flag?</qti-prompt>
      <qti-simple-choice identifier="red">Red</qti-simple-choice>
      <qti-simple-choice identifier="green">Green</qti-simple-choice>
      <qti-simple-choice identifier="blue">Blue</qti-simple-choice>
    </qti-choice-interaction>`,
);

/**
 * The stars item with no `qti-correct-response`, scored by nothing, so its correct response is
 * NULL.
 */
const unkeyed = new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="unkeyed" title="unkeyed" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-prompt>How many stars?</qti-prompt>
      <qti-simple-choice identifier="N1">1</qti-simple-choice>
      <qti-simple-choice identifier="N2">2</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`);

/**
 * A Text Entry bound to a `record` response, which `qti-match` does not compare.
 */
const measured = new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="measured" title="measured" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="NUMBER" cardinality="record"/>
  <qti-item-body><p>The length in metres is <qti-text-entry-interaction response-identifier="NUMBER"/>.</p></qti-item-body>
</qti-assessment-item>`);

/**
 * Open an item and take it accepted.
 *
 * @param location The document's location.
 * @param bytes The document.
 * @returns The accepted item.
 */
const accepting = Effect.fnUntraced(function* accepting(location: string, bytes: Uint8Array) {
  const verdict = yield* open(location, bytes);

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * Construct a single identifier, a Choice's or an Inline Choice's answer.
 *
 * @param identifier The choice.
 * @returns The value.
 */
const picked = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * Construct a single integer, the typed number's answer.
 *
 * @param value The number.
 * @returns The value.
 */
const typed = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * The NULL answer of a single identifier or integer response: nothing picked, nothing typed.
 *
 * @param baseType The response's base type.
 * @returns The value.
 */
const nothing = (baseType: "identifier" | "integer"): Value => ({
  baseType,
  cardinality: "single",
  values: [],
});

/**
 * Score an answer and render the item in review from the record `score` returned, as the app
 * shows a candidate the answered page: `score`, `restore`, then `redact` by the restored record,
 * and `render` with the restored values and, unless the options say otherwise, the solution
 * `solution(accepted, record)` gives.
 *
 * @param accepted The item.
 * @param answers The answers, by response identifier.
 * @param configuration The configuration.
 * @param options The render's options beside the instance and the values, from the solution:
 *   `review` and the solution by default; {@link withoutSolution} leaves the solution out.
 * @returns The rendered tree's root.
 */
const reviewed = (
  accepted: Accepted,
  answers: Responses,
  configuration: Configuration,
  options: (correct: Responses) => Options = (correct) => ({ mode: "review", solution: correct }),
): Element =>
  Result.getOrThrow(
    Result.gen(function* review() {
      const stored = yield* score(accepted, answers);
      const { record, values } = yield* restore(accepted, stored);
      const rendered = yield* render(redact(accepted, record, configuration), configuration, {
        ...options(solution(accepted, record)),
        instance,
        values,
      });
      const [root] = parseHtml(rendered.html);

      return root?.kind === "element" ? root : assert.fail("the render holds no item Root");
    }),
  );

/**
 * The options of a review render that passes no solution.
 *
 * @returns The options: `review`, no solution.
 */
const withoutSolution = (): Options => ({ mode: "review" });

/**
 * List an element and every element below it, in document order.
 *
 * @param nodes The nodes to walk.
 * @returns The elements.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Whether an element of the parsed page carries a boolean attribute. The render writes a `true`
 * attribute as its bare name, which parses to the empty string (`#plate/test/round-trip.ts`
 * `parseHtml`), so the parsed page holds no `true`: the attribute is carried when it is present.
 *
 * @param element The element, as `parseHtml` read it.
 * @param name The attribute's name.
 * @returns Whether the element carries it.
 */
const carries = (element: Element, name: string): boolean => element.attrs[name] !== undefined;

/**
 * Read an attribute that holds a string.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value; none when the element does not carry it or carries it as a boolean.
 */
const attributeOf = (element: Element, name: string): Option.Option<string> => {
  const value = element.attrs[name];

  return value === undefined || value === true ? Option.none() : Option.some(value);
};

/**
 * Give the elements below a root that carry a marker, in document order.
 *
 * @param root The root.
 * @param marker The `data-slot` marker.
 * @returns The elements.
 */
const partsOf = (root: Element, marker: string): readonly Element[] =>
  elementsOf([root]).filter((element) =>
    Option.contains(attributeOf(element, "data-slot"), marker),
  );

/**
 * A Mark as the page writes it: the mark its `data-answer` carries and the words it holds.
 */
interface ShownMark {
  readonly answer: string;
  readonly words: string;
}

/**
 * Read a Mark element.
 *
 * @param mark The Mark.
 * @returns Its `data-answer` and its words.
 */
const shownMark = (mark: Element): ShownMark => ({
  answer: Option.getOrElse(attributeOf(mark, "data-answer"), () => ""),
  words: textOf(mark),
});

/**
 * Read each choice of a Choice with its Mark: the choice's identifier, its Control's `checked`, and
 * the Mark its Label holds, none when it holds none.
 *
 * @param root The rendered item Root.
 * @returns One entry per choice, in presented order.
 */
const choiceMarks = (
  root: Element,
): readonly {
  readonly checked: boolean;
  readonly choice: string;
  readonly mark: Option.Option<ShownMark>;
}[] =>
  partsOf(root, slot.choice).map((row) => {
    const [control] = partsOf(row, slot.choiceControl);
    const marks = partsOf(row, slot.choiceMark);

    assert.isAtMost(marks.length, 1, "a choice holds at most one Mark");

    return {
      checked: control !== undefined && carries(control, "checked"),
      choice: Option.getOrElse(
        Option.fromUndefinedOr(control).pipe(Option.flatMap((held) => attributeOf(held, "value"))),
        () => "",
      ),
      mark: Option.fromUndefinedOr(marks[0]).pipe(Option.map(shownMark)),
    };
  });

/**
 * Read the credit the answered page's modal feedback card carries.
 *
 * @param root The rendered item Root.
 * @returns Each card's `data-credit`, in order.
 */
const credits = (root: Element): readonly string[] =>
  partsOf(root, slot.modalFeedback).map((card) =>
    Option.getOrElse(attributeOf(card, "data-credit"), () => ""),
  );

/**
 * Place an item Root in a minimal page that carries `lang`, as `checkTree` reads one.
 *
 * @param root The item Root.
 * @returns The page's root.
 */
const pageOf = (root: Element): Element => h("main", { lang: "en" }, [root]);

describe("review marks against the solution: the four demo pools", () => {
  it.effect(
    "marks the shapes pool's red square, picked, wrong and the red circle, not picked, right: one Mark each, in its Label, and the card red",
    () =>
      Effect.gen(function* redSquarePicked() {
        const configuration = yield* configure({});
        const accepted = yield* accepting("items/shape-red-circle.xml", redCircleItem);
        const root = reviewed(accepted, { RESPONSE: picked("red-square") }, configuration);

        assert.deepStrictEqual(choiceMarks(root), [
          {
            checked: false,
            choice: "red-circle",
            mark: Option.some({ answer: "missed", words: "Right answer" }),
          },
          { checked: false, choice: "blue-circle", mark: Option.none() },
          {
            checked: true,
            choice: "red-square",
            mark: Option.some({ answer: "wrong", words: "Your answer, wrong" }),
          },
          { checked: false, choice: "yellow-triangle", mark: Option.none() },
        ]);
        assert.deepStrictEqual(credits(root), ["none"]);

        const page = pageOf(root);
        const names = partsOf(root, slot.choiceControl).map((control) => nameOf(control, page));

        assert.deepStrictEqual(names, [
          "a red circle Right answer",
          "a blue circle",
          "a red square Your answer, wrong",
          "a yellow triangle",
        ]);
        assert.deepStrictEqual(checkTree(page, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "marks the stars pool's 1, picked, right, and nothing else, with the card green; picking 2 marks 2 wrong and 1 missed",
    () =>
      Effect.gen(function* starsMarks() {
        const configuration = yield* configure({});
        const accepted = yield* accepting("items/stars-01.xml", stars);
        const right = reviewed(accepted, { RESPONSE: picked("N1") }, configuration);
        const wrong = reviewed(accepted, { RESPONSE: picked("N2") }, configuration);

        assert.deepStrictEqual(
          choiceMarks(right).map(({ choice, mark }) => [choice, mark]),
          [
            ["N1", Option.some({ answer: "right", words: "Your answer, right" })],
            ["N2", Option.none()],
            ["N3", Option.none()],
          ],
        );
        assert.deepStrictEqual(credits(right), ["full"]);
        assert.deepStrictEqual(
          choiceMarks(wrong).map(({ choice, mark }) => [choice, mark]),
          [
            ["N1", Option.some({ answer: "missed", words: "Right answer" })],
            ["N2", Option.some({ answer: "wrong", words: "Your answer, wrong" })],
            ["N3", Option.none()],
          ],
        );
        assert.deepStrictEqual(credits(wrong), ["none"]);
        assert.deepStrictEqual(checkTree(pageOf(right), { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "marks the sentence pool's dropdown: wrong, then the right word beside it; right alone; with no answer, only the right word",
    () =>
      Effect.gen(function* sentenceMarks() {
        const configuration = yield* configure({});
        const accepted = yield* accepting("items/sentence-01.xml", sentence);
        const marksFor = (answer: Value) =>
          partsOf(reviewed(accepted, { RESPONSE: answer }, configuration), slot.inlineMark).map(
            shownMark,
          );
        const wrong = reviewed(accepted, { RESPONSE: picked("quack") }, configuration);
        const [control] = partsOf(wrong, slot.inlineControl);
        const shown = elementsOf(control === undefined ? [] : [control]).find((option) =>
          carries(option, "selected"),
        );

        assert.deepStrictEqual(marksFor(picked("quack")), [
          { answer: "wrong", words: "Your answer, wrong" },
          { answer: "missed", words: "Right answer: moo" },
        ]);
        assert.deepStrictEqual(marksFor(picked("moo")), [
          { answer: "right", words: "Your answer, right" },
        ]);
        assert.deepStrictEqual(marksFor(nothing("identifier")), [
          { answer: "missed", words: "Right answer: moo" },
        ]);
        assert.isTrue(
          control !== undefined && carries(control, "disabled"),
          "the dropdown stays disabled",
        );
        assert.isTrue(
          Option.exists(Option.fromUndefinedOr(shown), (option) =>
            Option.contains(attributeOf(option, "value"), "quack"),
          ),
          "the dropdown still shows the candidate's answer",
        );
        assert.deepStrictEqual(credits(wrong), ["none"]);
        assert.deepStrictEqual(checkTree(pageOf(wrong), { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "marks the typed number pool's box: wrong, then the right number beside it, both named by the box's aria-describedby; right alone; with no answer, only the right number",
    () =>
      Effect.gen(function* numberMarks() {
        const configuration = yield* configure({});
        const accepted = yield* accepting("items/after-01.xml", number);
        const wrong = reviewed(accepted, { RESPONSE: typed(3n) }, configuration);
        const right = reviewed(accepted, { RESPONSE: typed(2n) }, configuration);
        const empty = reviewed(accepted, { RESPONSE: nothing("integer") }, configuration);
        const describedby = (root: Element) =>
          partsOf(root, slot.textControl).map((control) =>
            attributeOf(control, "aria-describedby"),
          );
        const ids = (root: Element) =>
          partsOf(root, slot.textMark).map((mark) =>
            Option.getOrElse(attributeOf(mark, "id"), () => ""),
          );

        assert.deepStrictEqual(partsOf(wrong, slot.textMark).map(shownMark), [
          { answer: "wrong", words: "Your answer, wrong" },
          { answer: "missed", words: "Right answer: 2" },
        ]);
        assert.deepStrictEqual(ids(wrong), [
          `${instance}-RESPONSE-mark-0`,
          `${instance}-RESPONSE-mark-1`,
        ]);
        assert.deepStrictEqual(describedby(wrong), [Option.some(ids(wrong).join(" "))]);
        assert.deepStrictEqual(partsOf(right, slot.textMark).map(shownMark), [
          { answer: "right", words: "Your answer, right" },
        ]);
        assert.deepStrictEqual(describedby(right), [Option.some(`${instance}-RESPONSE-mark-0`)]);
        assert.deepStrictEqual(partsOf(empty, slot.textMark).map(shownMark), [
          { answer: "missed", words: "Right answer: 2" },
        ]);
        assert.deepStrictEqual(credits(wrong), ["none"]);
        assert.deepStrictEqual(credits(right), ["full"]);
        assert.isTrue(
          partsOf(wrong, slot.textControl).every((control) => carries(control, "readonly")),
          "the box stays readonly, still a tab stop",
        );
        assert.deepStrictEqual(checkTree(pageOf(wrong), { baseLevel: 2 }), []);
      }),
  );
});

describe("review marks against the solution: what they judge", () => {
  it.effect(
    "marks each choice of a multiple Choice by whether the correct response holds it: a right pick, a wrong pick and a right choice missed",
    () =>
      Effect.gen(function* multipleMarks() {
        const configuration = yield* configure({});
        const accepted = yield* accepting("items/colours.xml", colours);
        const answer: Value = {
          baseType: "identifier",
          cardinality: "multiple",
          values: [
            { baseType: "identifier", value: "red" },
            { baseType: "identifier", value: "green" },
          ],
        };
        const root = reviewed(accepted, { RESPONSE: answer }, configuration);

        assert.deepStrictEqual(
          choiceMarks(root).map(({ choice, mark }) => [
            choice,
            mark.pipe(Option.map((held) => held.answer)),
          ]),
          [
            ["red", Option.some("right")],
            ["green", Option.some("wrong")],
            ["blue", Option.some("missed")],
          ],
        );
      }),
  );

  it.effect(
    "marks nothing for a response whose correct response is NULL, and nothing for a record response even when the solution passed is the answer itself",
    () =>
      Effect.gen(function* unmarked() {
        const configuration = yield* configure({});
        const keyless = yield* accepting("items/unkeyed.xml", unkeyed);
        const root = reviewed(keyless, { RESPONSE: picked("N1") }, configuration);
        const record = yield* accepting("items/measured.xml", measured);
        const typedRecord: RecordValue = {
          cardinality: "record",
          fields: [{ identifier: "stringValue", value: { baseType: "string", value: "2" } }],
        };
        const rendered = Result.getOrThrow(
          render(redact(record, undefined, configuration), configuration, {
            instance,
            mode: "review",
            solution: { NUMBER: typedRecord },
            values: { NUMBER: typedRecord },
          }),
        );

        assert.isTrue(choiceMarks(root).every(({ mark }) => Option.isNone(mark)));
        assert.notInclude(rendered.html, "data-answer");
        assert.notInclude(rendered.html, slot.textMark);
      }),
  );
});

describe("review marks against the solution: where they show", () => {
  it.effect(
    "writes no Mark and no data-answer in a review without the solution, which is the page review gave before marks existed",
    () =>
      Effect.gen(function* noSolution() {
        const configuration = yield* configure({});
        for (const [location, bytes, answer] of [
          ["items/shape-red-circle.xml", redCircleItem, picked("red-square")],
          ["items/stars-01.xml", stars, picked("N1")],
          ["items/sentence-01.xml", sentence, picked("quack")],
          ["items/after-01.xml", number, typed(3n)],
        ] as const) {
          const accepted = yield* accepting(location, bytes);
          const root = reviewed(accepted, { RESPONSE: answer }, configuration, withoutSolution);
          const marked = elementsOf([root]).filter(
            (element) =>
              element.attrs["data-answer"] !== undefined ||
              [slot.choiceMark, slot.inlineMark, slot.textMark].some((marker) =>
                Option.contains(attributeOf(element, "data-slot"), marker),
              ),
          );

          assert.deepStrictEqual(marked, [], location);
          assert.isTrue(
            partsOf(root, slot.textControl).every(
              (control) => control.attrs["aria-describedby"] === undefined,
            ),
            `${location}: no aria-describedby on the box`,
          );
        }
      }),
  );

  it.effect(
    "writes the same page with the solution as without it in answering and in solution, and in a review with messages",
    () =>
      Effect.gen(function* otherModes() {
        const configuration = yield* configure({});
        const accepted = yield* accepting("items/after-01.xml", number);
        const answers = { RESPONSE: typed(3n) };
        const messages = [{ response: "RESPONSE", text: "Enter a number." }];
        const cases: readonly Options[] = [
          { mode: "answering" },
          { mode: "solution" },
          { messages, mode: "review", posted: { RESPONSE: ["three"] } },
        ];
        for (const [index, base] of cases.entries()) {
          assert.deepStrictEqual(
            reviewed(accepted, answers, configuration, (correct) => ({
              ...base,
              solution: correct,
            })),
            reviewed(accepted, answers, configuration, () => base),
            `case ${String(index)}`,
          );
        }
      }),
  );

  it.effect("keeps data-answer on a host's replacement Mark, which a swap merges", () =>
    Effect.gen(function* swappedMark() {
      const configuration = yield* configure({});
      const accepted = yield* accepting("items/stars-01.xml", stars);
      const root = reviewed(accepted, { RESPONSE: picked("N2") }, configuration, (correct) => ({
        mode: "review",
        parts: {
          "choice-interaction": {
            mark: (props: Attributes, children: readonly Node[]) =>
              h("strong", { ...props, "data-answer": "host" }, children),
          },
        },
        solution: correct,
      }));
      const marks = partsOf(root, slot.choiceMark);

      assert.deepStrictEqual(
        marks.map((mark) => [mark.tag, attributeOf(mark, "data-answer")]),
        [
          ["strong", Option.some("missed")],
          ["strong", Option.some("wrong")],
        ],
      );
    }),
  );
});
