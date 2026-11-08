/**
 * The accessibility tree of Inline Choice (Q-12) in Chromium and WebKit, with JavaScript off: the
 * native `select` each one renders, its name, the value it shows, its options, the refusal of a
 * required one left at its Placeholder, the result of a scored post, and the disabled select of a
 * finished item and of the review and solution views.
 *
 * Chromium's own tree is read through the DevTools Protocol (`src/test/ax-tree.ts`), which gives a
 * combobox the text it shows as its value. Playwright's computed tree, read in both engines, gives
 * a combobox no value: the choice it shows is the option it marks selected, as `p6-01` recorded.
 * WebKit's native role for a select is a pop-up button; Playwright's tree exposes a combobox there
 * too, so the role is asserted the same in both engines.
 *
 * Expected values come from the code: the HTML each page answered gives the names (`nameOf`), the
 * options' texts and the presented order; `inlineChoiceOf` gives `inline.xml`'s Placeholder text,
 * fixed choice and the author's too-few message; `correctOf` and `solution` give the correct
 * response; `message` gives the renderer's words.
 */
import { assert } from "@effect/vitest";
import { Effect, Option, Predicate, Schema } from "effect";
import type { Locator, Page } from "playwright-core";
import { configure } from "#plate/configuration.ts";
import { openMember } from "#plate/dev/listing.ts";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { message } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import { format, isRecordValue } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { redact, render } from "#plate/render.ts";
import { solution } from "#plate/solution.ts";
import { attribute, nameOf, textOf } from "#plate/test/accessibility.ts";
import { byNodeId, chromiumTree, descendantsOf, propertyOf } from "#plate/test/ax-tree.ts";
import type { AxNode } from "#plate/test/ax-tree.ts";
import {
  eachEngine,
  playgroundLayer,
  walkPlaygroundLayer,
  withPage,
} from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import {
  assertResultFirst,
  byId,
  correctOf,
  count,
  elementsOf,
  exposed,
  inlineChoiceOf,
  openItem,
  submitRead,
  treeOf,
  treesRead,
} from "#plate/test/playground-page.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The corpus item: one Inline Choice of three, Gloucester, Lancaster and York, in a line of a
 * quotation, with no `qti-label` and no `data-prompt`, bound to `RESPONSE`, whose correct response
 * is York.
 */
const corpusItem = "QTI3_BPIG_Examples/items/QTI3-inline-choice.xml";

/**
 * The walk corpus's Inline Choice item: `RESPONSE`, a shuffled select of planets labelled Planet by
 * its `qti-label`, with a `data-prompt`, `required`, and the author's too-few message, its last
 * choice fixed; and `RESPONSE2`, a select with none of those.
 */
const walkItem = "inline.xml";

/**
 * The response each item's first Inline Choice binds, and the one `inline.xml`'s second binds.
 */
const responses = { labelled: "RESPONSE", unlabelled: "RESPONSE2" } as const;

/**
 * The choice the value test picks in `inline.xml`'s planets.
 */
const picked = "MARS";

/**
 * The Inline Choice's Control, Placeholder and Option markers, read through the part table.
 */
const slots = {
  control: rowFor("inline-choice-interaction", "control").slot,
  option: rowFor("inline-choice-interaction", "option").slot,
  placeholder: rowFor("inline-choice-interaction", "placeholder").slot,
};

/**
 * One option of a select as the HTML presents it: the identifier it posts (`""` for the
 * Placeholder), its text, and whether the HTML marks it `selected`.
 */
interface PresentedOption {
  readonly selected: boolean;
  readonly text: string;
  readonly value: string;
}

/**
 * A select as the HTML the page answered presents it: its id, the accessible name `nameOf` gives
 * it, whether it is `disabled` and marked invalid (`aria-invalid="true"`), and its options, the
 * Placeholder first, then the choices in presented order.
 */
interface PresentedSelect {
  readonly disabled: boolean;
  readonly id: string;
  readonly invalid: boolean;
  readonly name: string;
  readonly options: readonly PresentedOption[];
}

/**
 * Read the select of one response from a page's HTML.
 *
 * @param tree The page's tree.
 * @param response The response the select's entry posts.
 * @returns The select; the test fails unless the page holds exactly one, and its first option is
 *   the Placeholder and every other an Option.
 */
const selectIn = (tree: Element, response: string): PresentedSelect => {
  const controls = elementsOf([tree]).filter(
    (element) =>
      attribute(element, "data-slot") === slots.control &&
      (attribute(element, "name") ?? "").endsWith(`.${response}`),
  );

  assert.strictEqual(controls.length, 1, `the page holds one select for ${response}`);

  const [control] = controls;
  assert.isDefined(control);

  const options = elementsOf(control.children);

  assert.deepStrictEqual(
    options.map((option) => attribute(option, "data-slot")),
    options.map((_, index) => (index === 0 ? slots.placeholder : slots.option)),
    "the Placeholder, then one Option per choice",
  );

  return {
    disabled: attribute(control, "disabled") !== undefined,
    id: attribute(control, "id") ?? "",
    invalid: attribute(control, "aria-invalid") === "true",
    name: nameOf(control, tree),
    options: options.map((option) => ({
      selected: attribute(option, "selected") !== undefined,
      text: textOf(option),
      value: attribute(option, "value") ?? "",
    })),
  };
};

/**
 * Find the option of a select that posts an identifier.
 *
 * @param select The select.
 * @param value The identifier, `""` for the Placeholder.
 * @returns The option; the test fails when the select has none.
 */
const optionOf = (select: PresentedSelect, value: string): PresentedOption =>
  select.options.find((option) => option.value === value) ??
  assert.fail(`the select has an option for "${value}"`);

/**
 * An option of a select as `ariaSnapshotJSON` gives it: its role, its name, and `selected` when it
 * is the chosen one.
 */
const OptionSnapshot = Schema.Struct({
  name: Schema.optionalKey(Schema.String),
  role: Schema.String,
  selected: Schema.optionalKey(Schema.Boolean),
});

/**
 * A select as `ariaSnapshotJSON` gives it: its role, its name, `disabled` and `invalid` when set,
 * and its options; the keys a test does not read are ignored.
 */
const SelectSnapshot = Schema.Struct({
  children: Schema.optionalKey(Schema.Array(Schema.Union([Schema.String, OptionSnapshot]))),
  disabled: Schema.optionalKey(Schema.Boolean),
  invalid: Schema.optionalKey(Schema.Union([Schema.Boolean, Schema.String])),
  name: Schema.optionalKey(Schema.String),
  role: Schema.String,
});

/**
 * Read a select's node of Playwright's computed tree.
 *
 * @param target The select.
 * @returns Its node and its options, in order; the test fails unless the snapshot is one node.
 */
const snapshotSelect = Effect.fn("snapshotSelect")(function* snapshotSelect(target: Locator) {
  const nodes = yield* Schema.decodeUnknownEffect(Schema.Array(SelectSnapshot))(
    yield* Effect.promise(() => target.ariaSnapshotJSON()),
  );

  assert.strictEqual(nodes.length, 1, "the snapshot is one node");

  const [node] = nodes;
  assert.isDefined(node);

  return {
    node,
    options: (node.children ?? []).filter(
      (child): child is typeof OptionSnapshot.Type =>
        !Predicate.isString(child) && child.role === "option",
    ),
  };
});

/**
 * A select as Chromium's own tree exposes it: its combobox node, and the option nodes below it, not
 * ignored, in tree order.
 */
interface OwnSelect {
  readonly combobox: AxNode;
  readonly options: readonly AxNode[];
}

/**
 * Find a select's combobox in Chromium's tree, and the options below it.
 *
 * @param nodes The tree's nodes.
 * @param select The select.
 * @returns The combobox and its option nodes, not ignored, in tree order.
 */
const ownSelect = (nodes: readonly AxNode[], select: PresentedSelect): OwnSelect => {
  const combobox = exposed(nodes, "combobox", select.name);

  return {
    combobox,
    options: descendantsOf(combobox, byNodeId(nodes)).filter(
      (node) => !node.ignored && node.role === "option",
    ),
  };
};

/**
 * Assert that a select is a combobox with its name that shows a choice: in Playwright's computed
 * tree, with the state `disabled` exactly when expected and that choice's option the one selected;
 * in Chromium's own tree too, with that choice's text as the combobox's value.
 *
 * Chromium's tree marks the chosen option `selected` only while the select is enabled: a disabled
 * select's options each carry `disabled` and none `selected`, so there the combobox's value is the
 * one place that tree shows the choice. Playwright's computed tree marks it in both states.
 *
 * @param page The page.
 * @param engine The engine.
 * @param select The select, as the HTML presents it.
 * @param shown What it shows.
 * @param shown.chosen The option it shows.
 * @param shown.disabled Whether it is disabled.
 * @returns Once every assertion has held.
 */
const assertShows = Effect.fn("assertShows")(function* assertShows(
  page: Page,
  engine: EngineName,
  select: PresentedSelect,
  shown: { readonly chosen: PresentedOption; readonly disabled: boolean },
) {
  const control = byId(page, select.id);
  const snapshot = yield* snapshotSelect(control);

  assert.strictEqual(snapshot.node.role, "combobox");
  assert.strictEqual(snapshot.node.name, select.name);
  assert.strictEqual(snapshot.node.disabled ?? false, shown.disabled);
  assert.deepStrictEqual(
    snapshot.options.filter((option) => option.selected === true).map((option) => option.name),
    [shown.chosen.text],
  );
  assert.strictEqual(
    yield* count(
      page
        .getByRole("combobox", { disabled: shown.disabled, exact: true, name: select.name })
        .and(control),
    ),
    1,
  );
  assert.strictEqual(
    yield* count(
      control.getByRole("option", { exact: true, name: shown.chosen.text, selected: true }),
    ),
    1,
  );

  if (engine === "chromium") {
    const own = ownSelect(yield* chromiumTree(page, engine), select);

    assert.strictEqual(Option.getOrUndefined(own.combobox.value), shown.chosen.text);
    assert.strictEqual(propertyOf(own.combobox, "disabled"), shown.disabled ? true : undefined);
    assert.deepStrictEqual(
      own.options.map((option) => ({
        disabled: propertyOf(option, "disabled"),
        name: option.name,
        selected: propertyOf(option, "selected"),
      })),
      select.options.map((option) => ({
        disabled: shown.disabled ? true : undefined,
        name: option.text,
        selected: shown.disabled ? undefined : option.value === shown.chosen.value,
      })),
    );
  }
});

/**
 * Assert that a select is a combobox with the name `nameOf` gives it, in Playwright's computed
 * tree and, in Chromium, in Chromium's own tree.
 *
 * @param page The page.
 * @param engine The engine.
 * @param select The select, as the HTML presents it.
 * @returns Once every assertion has held.
 */
const assertNamed = Effect.fn("assertNamed")(function* assertNamed(
  page: Page,
  engine: EngineName,
  select: PresentedSelect,
) {
  const control = byId(page, select.id);
  const { node } = yield* snapshotSelect(control);

  assert.strictEqual(node.role, "combobox", select.id);
  assert.strictEqual(node.name, select.name, select.id);
  assert.strictEqual(
    yield* count(page.getByRole("combobox", { exact: true, name: select.name }).and(control)),
    1,
    `${select.id} is a combobox named "${select.name}"`,
  );

  if (engine === "chromium") {
    const own = ownSelect(yield* chromiumTree(page, engine), select);

    assert.strictEqual(own.combobox.name, select.name);
  }
});

/**
 * Open the corpus item, choose its correct response, and submit.
 *
 * @param page The page.
 * @returns The answered page's tree, once that page has loaded, and the identifier chosen.
 */
const answerCorrectly = Effect.fn("answerCorrectly")(function* answerCorrectly(page: Page) {
  const select = selectIn(yield* openItem(page, corpusItem), responses.labelled);
  const [correct] = yield* correctOf(corpusItem, responses.labelled);
  assert.isDefined(correct, `${corpusItem} declares a correct response`);

  yield* Effect.promise(() => byId(page, select.id).selectOption(correct));

  return { answered: yield* submitRead(page), correct };
});

/**
 * A read-only view of an item.
 */
type ShownMode = "review" | "solution";

/**
 * Open the corpus item and give what a view of it shows for its response: in solution, the
 * correct response `solution` gives; in review, a candidate's response that names the first choice
 * that is not correct, so the two views show different values.
 *
 * @param mode The view.
 * @returns The item `open` accepted and the response's value in that view; the test fails unless
 *   the item is accepted, and in review unless its Inline Choice for the response holds a choice
 *   that is not correct.
 */
const viewOf = Effect.fn("viewOf")(function* viewOf(mode: ShownMode) {
  const accepted = Option.getOrElse(acceptedItem(yield* openMember(corpusItem)), () =>
    assert.fail(`${corpusItem} is accepted`),
  );
  const correct = solution(accepted)[responses.labelled];
  assert.isDefined(correct, `${corpusItem} declares ${responses.labelled}`);
  assert(!isRecordValue(correct), `${corpusItem}'s ${responses.labelled} is not a record response`);
  if (mode === "solution") {
    return { accepted, value: correct };
  }

  const choices = interactionsIn(accepted.item.body).flatMap((interaction) =>
    interaction.kind === "inline-choice" && interaction.response === responses.labelled
      ? interaction.choices
      : [],
  );
  const correctIds = new Set(correct.values.map(format));
  const other = choices.find((choice) => !correctIds.has(choice.identifier));
  assert.isDefined(other, `${corpusItem} has a choice that is not correct`);

  const value: Value = {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: other.identifier }],
  };

  return { accepted, value };
});

/**
 * Wrap an item's HTML in a document of its own, as a host page holds it.
 *
 * @param html The item's HTML, `render`'s.
 * @returns The document.
 */
const documentOf = (html: string): string =>
  `<!doctype html><html lang="en"><title>Inline Choice</title><body>${html}</body></html>`;

eachEngine((it, name) => {
  it.layer(playgroundLayer({}))("the accessibility tree, Inline Choice", (tree) => {
    tree.effect(
      `[Q-12] Names: QTI3-inline-choice's select has role combobox and the name Answer, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* corpusNames() {
            const select = selectIn(yield* openItem(page, corpusItem), responses.labelled);

            assert.strictEqual(select.name, message("en", "answer"));
            yield* assertNamed(page, name, select);
          }),
        ),
    );

    tree.effect(
      `[Q-12] The result first: QTI3-inline-choice with York, then Submit: the fragment names the Status region, which is focused and holds the score, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* resultFirst() {
            const { answered } = yield* answerCorrectly(page);

            yield* assertResultFirst(page, name, answered, [
              message("en", "score", { score: "1" }),
            ]);
          }),
        ),
    );
  });

  it.layer(walkPlaygroundLayer)(
    "the accessibility tree, Inline Choice, over the walk corpus",
    (tree) => {
      tree.effect(
        `[Q-12] Names: inline.xml's RESPONSE select is named Planet by its qti-label, and RESPONSE2's Answer, both role combobox, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* walkNames() {
              const opened = yield* openItem(page, walkItem);
              const labelled = selectIn(opened, responses.labelled);
              const unlabelled = selectIn(opened, responses.unlabelled);

              assert.deepStrictEqual(
                [labelled.name, unlabelled.name],
                ["Planet", message("en", "answer")],
              );
              yield* assertNamed(page, name, labelled);
              yield* assertNamed(page, name, unlabelled);
            }),
          ),
      );

      tree.effect(
        `[Q-12] Value: inline.xml's RESPONSE shows its Placeholder, the author's data-prompt, before a choice, and Mars after selectOption("MARS"), in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* value() {
              const interaction = yield* inlineChoiceOf(walkItem, responses.labelled);
              const select = selectIn(yield* openItem(page, walkItem), responses.labelled);
              const placeholder = optionOf(select, "");
              const mars = optionOf(select, picked);

              assert.strictEqual(placeholder.text, Option.getOrUndefined(interaction.placeholder));
              assert.strictEqual(mars.text, "Mars");
              yield* assertShows(page, name, select, { chosen: placeholder, disabled: false });

              yield* Effect.promise(() => byId(page, select.id).selectOption(picked));

              yield* assertShows(page, name, select, { chosen: mars, disabled: false });
            }),
          ),
      );

      tree.effect(
        `[Q-12] Options: inline.xml's RESPONSE holds the Placeholder, then its choices in the presented order, None of these last, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* options() {
              const interaction = yield* inlineChoiceOf(walkItem, responses.labelled);
              const select = selectIn(yield* openItem(page, walkItem), responses.labelled);
              const fixed = interaction.choices.filter((choice) => choice.fixed);
              const texts = select.options.map((option) => option.text);

              assert.deepStrictEqual(select.options[0], {
                selected: true,
                text: Option.getOrUndefined(interaction.placeholder),
                value: "",
              });
              assert.sameMembers(
                select.options.slice(1).map((option) => option.value),
                interaction.choices.map((choice) => choice.identifier),
              );
              assert.deepStrictEqual(
                fixed.map((choice) => choice.identifier),
                [select.options.at(-1)?.value],
              );
              assert.strictEqual(texts.at(-1), "None of these");
              assert.deepStrictEqual(
                (yield* snapshotSelect(byId(page, select.id))).options.map((option) => option.name),
                texts,
              );

              if (name === "chromium") {
                assert.deepStrictEqual(
                  ownSelect(yield* chromiumTree(page, name), select).options.map(
                    (option) => option.name,
                  ),
                  texts,
                );
              }
            }),
          ),
      );

      tree.effect(
        `[Q-12] Refusal: inline.xml submitted with nothing chosen: the Status region is focused and holds Not accepted and the author's message, and RESPONSE's select is invalid and described by it, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* refusal() {
              const interaction = yield* inlineChoiceOf(walkItem, responses.labelled);
              const authored = Option.getOrUndefined(interaction.messages.min);
              assert.isDefined(authored, `${walkItem}'s RESPONSE carries its too-few message`);

              yield* openItem(page, walkItem);

              const answered = yield* submitRead(page);
              const select = selectIn(answered, responses.labelled);
              const control = byId(page, select.id);

              assert.isTrue(select.invalid, "the answered HTML marks RESPONSE invalid");
              yield* assertResultFirst(page, name, answered, [
                message("en", "notAccepted"),
                authored,
              ]);

              const { node } = yield* snapshotSelect(control);

              assert.strictEqual(node.role, "combobox");
              assert.strictEqual(node.name, select.name);
              assert.strictEqual(node.invalid, true);
              assert.strictEqual(
                yield* count(
                  page
                    .getByRole("combobox", {
                      description: authored,
                      exact: true,
                      name: select.name,
                    })
                    .and(control),
                ),
                1,
              );

              if (name === "chromium") {
                const own = ownSelect(yield* chromiumTree(page, name), select).combobox;

                assert.strictEqual(propertyOf(own, "invalid"), "true");
                assert.strictEqual(own.description, authored);
              }
            }),
          ),
      );
    },
  );

  it.layer(playgroundLayer({ configuration: { maxAttempts: 1 } }))(
    "the accessibility tree, Inline Choice, with one attempt",
    (tree) => {
      tree.effect(
        `[Q-12] Finished: QTI3-inline-choice with York, then Submit, under maxAttempts 1: the combobox is disabled and shows York, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* finished() {
              const { answered, correct } = yield* answerCorrectly(page);
              const select = selectIn(answered, responses.labelled);
              const chosen = optionOf(select, correct);

              assert.isTrue(select.disabled, "the answered HTML disables the select");
              assert.isTrue(chosen.selected, "the answered HTML restores the choice");
              assert.strictEqual(chosen.text, "York");
              yield* assertShows(page, name, select, { chosen, disabled: true });
            }),
          ),
      );
    },
  );

  for (const mode of ["review", "solution"] as const) {
    it.effect(
      `[Q-12] ${mode === "review" ? "Review" : "Solution"}: QTI3-inline-choice rendered in ${mode} with ${mode === "review" ? "a candidate's response" : "the correct response"}: the combobox is disabled and shows it, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* readOnly() {
            const view = yield* viewOf(mode);
            const configuration = yield* configure({});
            const { html } = yield* Effect.fromResult(
              render(redact(view.accepted), configuration, {
                mode,
                values: { [responses.labelled]: view.value },
              }),
            );
            const select = selectIn(treeOf(html), responses.labelled);
            const [shown] = view.value.values.map(format);
            assert.isDefined(shown, `the ${mode} view shows a value`);

            const chosen = optionOf(select, shown);

            assert.isTrue(select.disabled, `${mode} disables the select`);
            assert.isTrue(chosen.selected, `${mode} restores the value`);

            yield* Effect.promise(() => page.setContent(documentOf(html)));
            yield* assertShows(page, name, select, { chosen, disabled: true });
          }),
        ),
    );
  }
});
