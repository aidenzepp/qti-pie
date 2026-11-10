import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  configure,
  decodeRedacted,
  encodeRedacted,
  open,
  redact,
  render,
} from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  Element,
  Node,
  Options,
  Redacted,
  Verdict,
} from "#plate/index.ts";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceChild } from "#plate/document/source.ts";
import { buildItem } from "#plate/model/item.ts";
import { attribute, checkTree, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";
import type { OutcomeView } from "#plate/vocabulary.ts";

/**
 * The rubric fixture's location as the host names it, its path under the package.
 */
const fixtureLocation = "fixtures/m3e/items/rubric.xml";

/**
 * The rubric fixture's file, which `open` reads as the host's bytes.
 */
const fixturePath = path.resolve(import.meta.dirname, "..", "..", fixtureLocation);

/**
 * The instance token every render here passes.
 */
const instance = "q1";

/**
 * The path of the item body in a document of the fixture's shape.
 */
const bodyPath = "qti-assessment-item/qti-item-body";

/**
 * A word only the fixture's scorer rubric holds.
 */
const scorerWord = "tamarind";

/**
 * The text of the fixture's candidate instructions rubric.
 */
const instructions = "Read every option before you choose one.";

/**
 * Open the rubric fixture as a host opens a document it read from storage.
 *
 * @returns The verdict on the fixture.
 */
const openFixture = Effect.fnUntraced(function* openFixture() {
  const bytes = yield* Effect.tryPromise(() => readFile(fixturePath));

  return yield* open(fixtureLocation, bytes);
});

/**
 * Take the item a verdict accepts, failing the test when it accepts none.
 *
 * @param verdict The verdict.
 * @param what The document the verdict is on, for the failure's message.
 * @returns The accepted item.
 */
const acceptedOf = (verdict: Verdict, what: string): Accepted =>
  Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${what} is ${verdict.verdict}, not accepted`),
  );

/**
 * Open the rubric fixture and take the item its verdict accepts.
 *
 * @returns The accepted item.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  return acceptedOf(yield* openFixture(), fixtureLocation);
});

/**
 * Open an item written as XML text, as a host opens one it read from storage.
 *
 * @param xml The document's text.
 * @returns The accepted item.
 */
const acceptText = Effect.fnUntraced(function* acceptText(xml: string) {
  return acceptedOf(yield* open("items/text.xml", new TextEncoder().encode(xml)), "the text item");
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
 * List the elements of a tree in document order, each before its descendants.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * List the rubric blocks a render wrote, in document order: each element that carries `data-use`.
 *
 * @param root The render's root.
 * @returns The rubric blocks' elements.
 */
const rubricsOf = (root: Element): readonly Element[] =>
  elementsOf([root]).filter((element) => attribute(element, "data-use") !== undefined);

/**
 * Give the names of the attributes an element carries, sorted.
 *
 * @param element The element.
 * @returns Its attribute names.
 */
const attributeNames = (element: Element): readonly string[] =>
  Object.keys(element.attrs).toSorted();

/**
 * Find the one rubric block of a use, failing the test when there is none or several.
 *
 * @param root The render's root.
 * @param use The rubric's `use` as written.
 * @returns Its element.
 */
const rubricOf = (root: Element, use: string): Element => {
  const [found, ...rest] = rubricsOf(root).filter(
    (element) => attribute(element, "data-use") === use,
  );
  assert.lengthOf(rest, 0, `${use} marks one rubric`);

  return found ?? assert.fail(`the render holds no rubric of use ${use}`);
};

/**
 * Give the tag a render wrote a heading with, found by its text.
 *
 * @param root The render's root.
 * @param words The heading's text.
 * @returns The heading's tag, failing the test when the render holds no such heading.
 */
const headingTag = (root: Element, words: string): string => {
  const found = elementsOf([root]).find(
    (element) => /^h[1-6]$/u.test(element.tag) && textOf(element) === words,
  );

  return found?.tag ?? assert.fail(`the render holds no heading "${words}"`);
};

/**
 * Give the position of the element a predicate finds among a render's elements, in document order.
 *
 * @param root The render's root.
 * @param find What the element carries.
 * @returns Its index, failing the test when no element matches.
 */
const positionOf = (root: Element, find: (element: Element) => boolean): number => {
  const position = elementsOf([root]).findIndex(find);
  assert.isAtLeast(position, 0, "the render holds the element");

  return position;
};

/**
 * Give the position of the Choice root among a render's elements.
 *
 * @param root The render's root.
 * @returns Its index.
 */
const choiceAt = (root: Element): number =>
  positionOf(root, (element) => attribute(element, "data-slot") === "choice-interaction");

/**
 * What one render of an item gives.
 */
interface Shown {
  readonly html: string;
  readonly redacted: Redacted;
  readonly root: Element;
}

/**
 * Redact an accepted item to a view and render it to that view, as a host shows an item to a
 * viewer.
 *
 * @param accepted The accepted item.
 * @param view The view the item is shown to, the candidate's when absent.
 * @param headingLevel The configuration's heading level.
 * @returns The redacted item, the HTML and its parsed root.
 */
const showTo = (accepted: Accepted, view?: OutcomeView, headingLevel = 2) =>
  Effect.gen(function* showing() {
    const configuration: Configuration = yield* configure({ headingLevel });
    const redacted = redact(accepted, undefined, configuration, view === undefined ? {} : { view });
    const options: Options = view === undefined ? { instance } : { instance, view };
    const { html } = yield* Effect.fromResult(render(redacted, configuration, options));
    const shown: Shown = { html, redacted, root: rootOf(html) };

    return shown;
  });

/**
 * The outcome declaration and Choice an item written as text holds beside its body.
 *
 * @param body The markup inside the item body, before the Choice.
 * @returns The item as XML text.
 */
const itemText = (body: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="rubric-text" title="Rubric text" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response>
      <qti-value>B</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-item-body>
    ${body}
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">One</qti-simple-choice>
      <qti-simple-choice identifier="B">Two</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * Construct a source rubric block, as a document read from XML holds one.
 *
 * @param use The block's `use`.
 * @param view The block's `view`.
 * @param content The children of its `qti-content-body`.
 * @returns The element.
 */
const rubricSource = (use: string, view: string, content: readonly SourceChild[]) =>
  el(
    "qti-rubric-block",
    [attr("use", use), attr("view", view)],
    [el("qti-content-body", [], content)],
  );

/**
 * Construct a source paragraph.
 *
 * @param words The paragraph's text.
 * @returns The element.
 */
const paragraph = (words: string) => el("p", [], [text(words)]);

describe("a rubric block in an item body", () => {
  it.effect(
    "[I-11] open accepts the rubric fixture and its verdict marks no rubric block unsupported",
    () =>
      Effect.gen(function* accepts() {
        const verdict = yield* openFixture();
        const accepted = acceptedOf(verdict, fixtureLocation);

        assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
        assert.deepStrictEqual(
          accepted.unsupported.filter(({ feature }) => feature === "qti-rubric-block"),
          [],
        );
      }),
  );

  it.effect("[I-11] a candidate render shows a candidate rubric's content in document order", () =>
    Effect.gen(function* candidate() {
      const { root } = yield* showTo(yield* acceptFixture());
      const rubric = rubricOf(root, "instructions");

      assert.strictEqual(rubric.tag, "div");
      assert.strictEqual(attribute(rubric, "data-view"), "candidate");
      assert.strictEqual(textOf(rubric), instructions);
      assert.isBelow(
        positionOf(root, (element) => element === rubric),
        choiceAt(root),
      );
      assert.deepStrictEqual(
        rubricsOf(root).map((element) => attribute(element, "data-use")),
        ["instructions", "ext:pacing", "navigation"],
      );
      assert.isBelow(
        choiceAt(root),
        positionOf(root, (element) => element === rubricOf(root, "ext:pacing")),
      );
    }),
  );

  it.effect("[I-11] a candidate render and its redacted copy hold no scorer rubric", () =>
    Effect.gen(function* candidate() {
      const { html, redacted, root } = yield* showTo(yield* acceptFixture());
      const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(redacted)));

      assert.notInclude(html, scorerWord);
      assert.notInclude(json, scorerWord);
      assert.notInclude(json, "scoring");
      assert.notInclude(html, "qti-rubric-block");
      assert.deepStrictEqual(
        elementsOf([root]).filter(
          (element) =>
            attribute(element, "data-slot") === "item-notice" &&
            textOf(element).includes("qti-rubric-block"),
        ),
        [],
      );
      assert.notInclude(redacted.notices, "qti-rubric-block");
    }),
  );

  it.effect("[I-11] a scorer render shows the scorer rubric and not a candidate-only one", () =>
    Effect.gen(function* scorer() {
      const { html, root } = yield* showTo(yield* acceptFixture(), "scorer");
      const rubric = rubricOf(root, "scoring");

      assert.include(textOf(rubric), scorerWord);
      assert.strictEqual(attribute(rubric, "data-view"), "scorer");
      assert.notInclude(html, instructions);
      assert.deepStrictEqual(
        rubricsOf(root).map((element) => attribute(element, "data-use")),
        ["scoring"],
      );
      assert.isAbove(
        positionOf(root, (element) => element === rubric),
        choiceAt(root),
      );
    }),
  );

  it.effect("[I-11] a rubric listing two views shows to each and to no third", () =>
    Effect.gen(function* views() {
      const accepted = yield* acceptFixture();
      const shownTo = (view: OutcomeView) =>
        Effect.map(showTo(accepted, view), ({ root }) =>
          rubricsOf(root).some((element) => attribute(element, "data-use") === "ext:pacing"),
        );

      assert.isTrue(yield* shownTo("candidate"));
      assert.isTrue(yield* shownTo("tutor"));
      assert.isFalse(yield* shownTo("proctor"));
      assert.isFalse(yield* shownTo("scorer"));
      assert.isFalse(yield* shownTo("author"));
      assert.isFalse(yield* shownTo("testConstructor"));
    }),
  );

  it.effect("[I-11] a printed variable in a rubric prints the outcome's value", () =>
    Effect.gen(function* printed() {
      const { html, root } = yield* showTo(yield* acceptFixture());

      assert.include(
        textOf(rubricOf(root, "ext:pacing")),
        "Prenez un rythme tranquille pour cette question.",
      );
      assert.notInclude(html, "qti-printed-variable");
    }),
  );

  it.effect("[I-11] a heading inside a rubric honours the base heading level", () =>
    Effect.gen(function* headings() {
      const accepted = yield* acceptFixture();
      const base = yield* showTo(accepted);
      const raised = yield* showTo(accepted, undefined, 3);

      assert.strictEqual(headingTag(base.root, "Harbour log"), "h2");
      assert.strictEqual(headingTag(base.root, "Rythme"), "h2");
      assert.strictEqual(headingTag(raised.root, "Harbour log"), "h3");
      assert.strictEqual(headingTag(raised.root, "Rythme"), "h3");
    }),
  );

  it.effect("[I-11] a heading in a rubric is read by the shift of the item's headings", () =>
    Effect.gen(function* shifted() {
      const accepted = yield* acceptText(
        itemText(
          '<h3>Deeper in the body</h3><qti-rubric-block use="instructions" view="candidate"><qti-content-body><h2>Shallower in the rubric</h2></qti-content-body></qti-rubric-block>',
        ),
      );
      const base = (yield* showTo(accepted)).root;
      const raised = (yield* showTo(accepted, undefined, 4)).root;

      assert.strictEqual(headingTag(base, "Shallower in the rubric"), "h2");
      assert.strictEqual(headingTag(base, "Deeper in the body"), "h3");
      assert.strictEqual(headingTag(raised, "Shallower in the rubric"), "h4");
      assert.strictEqual(headingTag(raised, "Deeper in the body"), "h5");
    }),
  );

  it.effect(
    "[I-11] the rubric's use and view are written as authored, and its xml:lang as lang",
    () =>
      Effect.gen(function* authored() {
        const { root } = yield* showTo(yield* acceptFixture());
        const pacing = rubricOf(root, "ext:pacing");

        assert.strictEqual(attribute(pacing, "data-view"), "candidate tutor");
        assert.strictEqual(attribute(pacing, "lang"), "fr");
        assert.deepStrictEqual(attributeNames(pacing), ["data-use", "data-view", "lang"]);
        assert.deepStrictEqual(attributeNames(rubricOf(root, "instructions")), [
          "data-use",
          "data-view",
        ]);
        assert.deepStrictEqual(attributeNames(rubricOf(root, "navigation")), [
          "data-use",
          "data-view",
        ]);
      }),
  );

  it.effect(
    "[I-11] a view list written with extra white space shows to each view it names, written single-spaced",
    () =>
      Effect.gen(function* spaced() {
        const accepted = yield* acceptText(
          itemText(
            '<qti-rubric-block use="scoring" view="  scorer&#9;proctor&#10;tutor "><qti-content-body><p>For three views.</p></qti-content-body></qti-rubric-block>',
          ),
        );
        const rubricFor = (view: OutcomeView) =>
          Effect.map(showTo(accepted, view), ({ root }) => rubricsOf(root));

        for (const view of ["scorer", "proctor", "tutor"] as const) {
          const [rubric, ...rest] = yield* rubricFor(view);

          assert.lengthOf(rest, 0, view);
          assert.strictEqual(
            attribute(rubric ?? assert.fail(view), "data-view"),
            "scorer proctor tutor",
          );
        }

        assert.lengthOf(yield* rubricFor("candidate"), 0);
        assert.lengthOf(yield* rubricFor("author"), 0);
      }),
  );

  it.effect(
    "[I-11] a rubric's stylesheet and catalog are read past: marked, rendered as nothing",
    () =>
      Effect.gen(function* readPast() {
        const accepted = yield* acceptFixture();
        const rubricPath = `${bodyPath}/qti-rubric-block[4]`;

        assert.deepStrictEqual(accepted.unsupported, [
          { feature: "qti-stylesheet", path: `${rubricPath}/qti-stylesheet`, shown: "mark" },
          { feature: "qti-catalog-info", path: `${rubricPath}/qti-catalog-info`, shown: "mark" },
        ]);

        const { html, root } = yield* showTo(accepted);
        const navigation = rubricOf(root, "navigation");

        assert.deepStrictEqual(
          navigation.children.flatMap((child) => (child.kind === "element" ? [child.tag] : [])),
          ["p"],
        );
        assert.strictEqual(textOf(navigation), "Move between the options with the arrow keys.");
        assert.notInclude(html, "rubric.css");
        assert.notInclude(html, "space bar");
      }),
  );

  it.effect("[I-11] a rubric in a rubric's content body is placed in document order", () =>
    Effect.gen(function* nested() {
      const item = yield* Effect.fromResult(
        buildItem(
          doc(
            "items/nested.xml",
            el(
              "qti-assessment-item",
              [attr("identifier", "nested"), attr("title", "Nested")],
              [
                el(
                  "qti-item-body",
                  [],
                  [
                    rubricSource("instructions", "candidate", [
                      paragraph("Outer first."),
                      rubricSource("navigation", "candidate", [paragraph("Nested middle.")]),
                      rubricSource("scoring", "scorer", [paragraph("Nested hidden.")]),
                      paragraph("Outer last."),
                    ]),
                  ],
                ),
              ],
            ),
          ),
        ),
      );
      const { html, root } = yield* showTo(acceptForTest(item));
      const outer = rubricOf(root, "instructions");
      const inner = rubricOf(root, "navigation");

      assert.deepStrictEqual(
        outer.children.map((child) =>
          child.kind === "element" ? [child.tag, attribute(child, "data-use")] : child.text,
        ),
        [
          ["p", undefined],
          ["div", "navigation"],
          ["p", undefined],
        ],
      );
      assert.strictEqual(textOf(inner), "Nested middle.");
      assert.strictEqual(attribute(inner, "data-view"), "candidate");
      assert.notInclude(html, "Nested hidden.");
      assert.deepStrictEqual(
        elementsOf([root])
          .filter((element) => element.tag === "p")
          .map(textOf),
        ["Outer first.", "Nested middle.", "Outer last."],
      );
    }),
  );

  it.effect("[I-11] the rendered item with its rubric passes checkTree and round-trips", () =>
    Effect.gen(function* conforms() {
      const accepted = yield* acceptFixture();

      for (const view of ["candidate", "tutor", "scorer"] as const) {
        const { root } = yield* showTo(accepted, view);

        assert.isAbove(rubricsOf(root).length, 0, `the ${view} render holds a rubric`);
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), [], view);
        assert.isTrue(roundTrips(root), view);
      }
    }),
  );

  it.effect("[I-11] the rubric survives the redacted codec", () =>
    Effect.gen(function* coded() {
      const accepted = yield* acceptFixture();
      const configuration: Configuration = yield* configure({});
      const { html, redacted } = yield* showTo(accepted);
      const json = yield* Effect.fromResult(encodeRedacted(redacted));
      const decoded = yield* Effect.fromResult(decodeRedacted(structuredClone(json)));
      const again = yield* Effect.fromResult(render(decoded, configuration, { instance }));
      const rubrics = decoded.body.flatMap((node) =>
        node.kind === "content" && node.element === "qti-rubric-block" ? [node] : [],
      );

      assert.strictEqual(again.html, html);
      assert.deepStrictEqual(
        rubrics.map(({ node }) => node.use),
        ["instructions", "ext:pacing", "navigation"],
      );
      assert.deepStrictEqual(
        rubrics.map(({ path: where }) => where),
        ["", "", ""],
      );
      assert.deepStrictEqual(
        rubrics.map(({ node }) => node.lang),
        [Option.none(), Option.some("fr"), Option.none()],
      );
      assert.notInclude(JSON.stringify(json), '"path"');
      assert.isTrue(Result.isSuccess(encodeRedacted(decoded)));
    }),
  );
});
