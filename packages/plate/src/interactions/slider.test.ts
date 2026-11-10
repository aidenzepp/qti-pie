import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { h } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { partForSlot } from "#plate/emit/parts.ts";
import {
  acceptedItem,
  begin,
  checkResponses,
  configure,
  decode,
  decodeRedacted,
  encodeRedacted,
  entryName,
  open,
  postings,
  redact,
  render,
  restore,
  score,
  solution,
} from "#plate/index.ts";
import type { Accepted, Options, Verdict } from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { checkTree, nameOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { unsupportedFeatures } from "#plate/validate/verdict.ts";

/**
 * The folder the area's fixture items sit in.
 */
const itemsDirectory = path.resolve(import.meta.dirname, "..", "..", "fixtures", "ei", "items");

/**
 * The block of the stylesheet this slice owns, between its delimiters.
 */
const stylesheetBlock =
  /\/\* begin slider-interaction \(issue ei-16\) \*\/(?<css>[^]*?)\/\* end slider-interaction \*\//u;

/**
 * The instance every render here uses.
 */
const instance = "s1";

/**
 * Read a fixture item's text.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @returns The XML as written.
 */
const fixtureText = (file: string) =>
  Effect.tryPromise(() => readFile(path.join(itemsDirectory, file), "utf-8"));

/**
 * Open an item's XML and give its verdict and, when it accepts the item, the accepted item.
 *
 * @param xml The item's XML.
 * @returns The verdict and the accepted item, none when the verdict accepts no item.
 */
const opened = Effect.fnUntraced(function* opened(xml: string) {
  const verdict: Verdict = yield* open("items/slider.xml", new TextEncoder().encode(xml));

  return { accepted: acceptedItem(verdict), verdict };
});

/**
 * Open an item's XML, which `open` must accept.
 *
 * @param xml The item's XML.
 * @returns The accepted item.
 */
const accepting = Effect.fnUntraced(function* accepting(xml: string) {
  const { accepted, verdict } = yield* opened(xml);

  return Option.getOrElse(accepted, () => assert.fail(`the item is ${verdict.verdict}`));
});

/**
 * Open one of the fixture items, which `open` must accept.
 *
 * @param file The fixture's file name.
 * @returns The accepted item.
 */
const fixture = Effect.fnUntraced(function* fixture(file: string) {
  return yield* accepting(yield* fixtureText(file));
});

/**
 * Render an accepted item as an author does: redacted under the default configuration, then
 * rendered in the instance, and its HTML parsed.
 *
 * @param accepted The accepted item.
 * @param options The render's further inputs.
 * @returns The HTML, its parsed tree and the item's root element.
 */
const rendering = Effect.fnUntraced(function* rendering(accepted: Accepted, options: Options = {}) {
  const configuration = yield* configure({});
  const rendered = yield* Effect.fromResult(
    render(redact(accepted, undefined, configuration), configuration, { instance, ...options }),
  );
  const tree = parseHtml(rendered.html);
  const [root] = tree;

  return {
    html: rendered.html,
    root: root?.kind === "element" ? root : assert.fail("the render holds no root element"),
    tree,
  };
});

/**
 * List the elements among some nodes, in document order, each followed by those below it.
 *
 * @param nodes The nodes.
 * @returns Every element.
 */
const elementsIn = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsIn(node.children)] : []));

/**
 * Find the elements that carry a part's marker.
 *
 * @param nodes The rendered tree.
 * @param slot The part's `data-slot` marker.
 * @returns Each element carrying it, in document order.
 */
const partsOf = (nodes: readonly Node[], slot: string): readonly Element[] =>
  elementsIn(nodes).filter((element) => element.attrs["data-slot"] === slot);

/**
 * Find the one element that carries a part's marker.
 *
 * @param nodes The rendered tree.
 * @param slot The part's marker.
 * @returns That element; a failed assertion when there is not exactly one.
 */
const onlyPart = (nodes: readonly Node[], slot: string): Element => {
  const found = partsOf(nodes, slot);
  const [first] = found;

  return found.length === 1 && first !== undefined
    ? first
    : assert.fail(`${slot} is on ${String(found.length)} elements, not one`);
};

/**
 * Read the text an element holds, below it too.
 *
 * @param element The element.
 * @returns Its text nodes' text, joined.
 */
const textIn = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.text : textIn(child))).join("");

/**
 * Read an attribute of an element as a string, a boolean attribute present as the empty string.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns The value, none when absent.
 */
const attributeOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromUndefinedOr(element.attrs[name]).pipe(
    Option.map((value) => (value === true ? "" : value)),
  );

/**
 * The marker of the Control, the one native range.
 */
const controlSlot = "slider-interaction-control";

/**
 * Read the one Control of a render.
 *
 * @param nodes The rendered tree.
 * @returns The Control.
 */
const controlOf = (nodes: readonly Node[]): Element => onlyPart(nodes, controlSlot);

/**
 * The markers of a Root's children, in order.
 *
 * @param root The Root's element.
 * @returns The marker of each child element that carries one.
 */
const childSlots = (root: Element): readonly string[] =>
  root.children.flatMap((child) =>
    child.kind === "element" ? Option.toArray(attributeOf(child, "data-slot")) : [],
  );

/**
 * Write a fixture's XML with some text changed.
 *
 * @param xml The fixture's XML.
 * @param replacements The text to find and what to write in its place.
 * @returns The XML with each replacement made, each of which must find its text once.
 */
const varied = (xml: string, ...replacements: readonly (readonly [string, string])[]): string => {
  let changed = xml;
  for (const [from, to] of replacements) {
    assert.strictEqual(changed.split(from).length, 2, `${from} must occur once in the fixture`);
    changed = changed.replace(from, to);
  }

  return changed;
};

/**
 * Collect every value JSON text holds, its strings, numbers, booleans and nulls among them.
 *
 * @param written The JSON text.
 * @returns Each value, in the order the parser revives them.
 */
const valuesIn = (written: string): readonly unknown[] => {
  const found: unknown[] = [];

  JSON.parse(written, (_key, value) => {
    found.push(value);
  });

  return found;
};

/**
 * A host's replacement for the lower bound's label: a `b` holding what it is handed.
 *
 * @param props The attributes the part carries.
 * @param children The nodes the part holds.
 * @returns A `b` with `props` and `children`.
 */
const bold = (props: Attributes, children: readonly Node[]) => h("b", props, children);

/**
 * A host's replacement for the Control that tries to change what the interaction computed: a text
 * input of other bounds, step and value.
 *
 * @param props The attributes the part carries.
 * @returns An input that carries `props` under its own `type`, `min`, `max`, `step` and `value`.
 */
const hostile = (props: Attributes) =>
  h("input", { ...props, max: "1", min: "5", step: "any", type: "text", value: "9" });

describe("slider", () => {
  it.effect("[Q-19] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* acceptsFixtures() {
      for (const file of ["slider.xml", "slider-float.xml"]) {
        const { accepted, verdict } = yield* opened(yield* fixtureText(file));

        assert.strictEqual(verdict.verdict, "accepted", file);
        assert.isTrue(Option.isSome(accepted), file);
        assert.deepStrictEqual(unsupportedFeatures(verdict), [], file);
      }
    }),
  );

  it.effect(
    "[Q-19] render emits a native range over the bounds, an integer binding rounding them outward",
    () =>
      Effect.gen(function* rendersRange() {
        const { tree } = yield* rendering(yield* fixture("slider.xml"));
        const control = controlOf(tree);

        assert.strictEqual(control.tag, "input");
        assert.deepStrictEqual(
          ["type", "min", "max", "step"].map((name) => attributeOf(control, name)),
          [Option.some("range"), Option.some("0"), Option.some("10"), Option.some("2")],
        );
        assert.strictEqual(control.attrs["name"], entryName(instance, "RESPONSE"));
        assert.deepStrictEqual(partsOf(tree, "item-notice"), []);
      }),
  );

  it.effect("[Q-19] an integer binding with no step steps by 1", () =>
    Effect.gen(function* integerDefaultStep() {
      const { tree } = yield* rendering(
        yield* accepting(varied(yield* fixtureText("slider.xml"), [' step="2"', ""])),
      );

      assert.deepStrictEqual(attributeOf(controlOf(tree), "step"), Option.some("1"));
    }),
  );

  it.effect('[Q-19] a float binding with no step renders step="any"', () =>
    Effect.gen(function* floatContinuous() {
      const { tree } = yield* rendering(yield* fixture("slider-float.xml"));
      const control = controlOf(tree);

      assert.deepStrictEqual(
        ["type", "min", "max", "step"].map((name) => attributeOf(control, name)),
        [Option.some("range"), Option.some("0"), Option.some("1.5"), Option.some("any")],
      );
    }),
  );

  it.effect("[Q-19] a float binding keeps its own step, and a step of 0 constrains nothing", () =>
    Effect.gen(function* floatSteps() {
      const text = yield* fixtureText("slider-float.xml");
      const stepped = yield* rendering(
        yield* accepting(varied(text, ['upper-bound="1.5"', 'upper-bound="1.5" step="0.25"'])),
      );
      const zero = yield* rendering(
        yield* accepting(varied(text, ['upper-bound="1.5"', 'upper-bound="1.5" step="0"'])),
      );

      assert.deepStrictEqual(attributeOf(controlOf(stepped.tree), "step"), Option.some("0.25"));
      assert.deepStrictEqual(attributeOf(controlOf(zero.tree), "step"), Option.some("any"));
    }),
  );

  it.effect(
    "[Q-19] the control starts at the restored value, else the default, else the lower bound",
    () =>
      Effect.gen(function* startsAtShownValue() {
        const integerItem = yield* fixture("slider.xml");
        const floatItem = yield* fixture("slider-float.xml");
        const restored = yield* rendering(integerItem, { values: { RESPONSE: integer(6n) } });
        const started = yield* Effect.fromResult(begin(floatItem, { instance, seed: "7" }));
        const defaulted = yield* rendering(floatItem, {
          values: (yield* Effect.fromResult(restore(floatItem, started))).values,
        });
        const neither = yield* rendering(integerItem);
        const raised = yield* rendering(
          yield* accepting(
            varied(yield* fixtureText("slider.xml"), ['lower-bound="0.5"', 'lower-bound="3"']),
          ),
        );

        assert.deepStrictEqual(attributeOf(controlOf(restored.tree), "value"), Option.some("6"));
        assert.deepStrictEqual(
          attributeOf(controlOf(defaulted.tree), "value"),
          Option.some("0.75"),
        );
        assert.deepStrictEqual(attributeOf(controlOf(neither.tree), "value"), Option.some("0"));
        assert.deepStrictEqual(attributeOf(controlOf(raised.tree), "value"), Option.some("3"));
      }),
  );

  it.effect(
    "[Q-19] a refused post shows the number it posted, and the control is invalid and described by its messages",
    () =>
      Effect.gen(function* refusedPost() {
        const { tree } = yield* rendering(yield* fixture("slider.xml"), {
          messages: [{ response: "RESPONSE", text: "Choose a number." }],
          posted: { RESPONSE: ["7"] },
          values: { RESPONSE: integer(6n) },
        });
        const control = controlOf(tree);
        const described = attributeOf(control, "aria-describedby").pipe(
          Option.map((ids) => ids.split(" ")),
          Option.getOrElse((): string[] => []),
        );

        assert.deepStrictEqual(attributeOf(control, "value"), Option.some("7"));
        assert.deepStrictEqual(attributeOf(control, "aria-invalid"), Option.some("true"));
        assert.isTrue(attributeOf(control, "autofocus").pipe(Option.isSome));
        assert.include(described, `${instance}-RESPONSE-message-0`);
      }),
  );

  it.effect(
    "[Q-19] the bounds are labelled at the ends and the steps listed when step-label asks",
    () =>
      Effect.gen(function* labelsBounds() {
        const { tree } = yield* rendering(yield* fixture("slider.xml"));
        const control = controlOf(tree);
        const lower = onlyPart(tree, "slider-interaction-lower-bound");
        const upper = onlyPart(tree, "slider-interaction-upper-bound");
        const steps = onlyPart(tree, "slider-interaction-steps");

        assert.deepStrictEqual([textIn(lower), textIn(upper)], ["0", "10"]);
        assert.strictEqual(steps.tag, "datalist");
        assert.deepStrictEqual(
          steps.children.map((child) =>
            child.kind === "element" ? [child.tag, child.attrs["value"]] : [],
          ),
          ["0", "2", "4", "6", "8", "10"].map((value) => ["option", value]),
        );
        assert.deepStrictEqual(attributeOf(control, "list"), attributeOf(steps, "id"));
        assert.deepStrictEqual(
          attributeOf(control, "aria-describedby").pipe(Option.map((ids) => ids.split(" "))),
          Option.some([lower.attrs["id"], upper.attrs["id"]]),
        );
      }),
  );

  it.effect("[Q-19] no datalist is written unless step-label is true", () =>
    Effect.gen(function* noStepLabels() {
      const text = yield* fixtureText("slider.xml");

      for (const variant of [
        varied(text, [' step-label="true"', ""]),
        varied(text, [' step-label="true"', ' step-label="false"']),
        varied(text, [' step-label="true"', ' step-label="0"']),
      ]) {
        const { tree } = yield* rendering(yield* accepting(variant));

        assert.deepStrictEqual(partsOf(tree, "slider-interaction-steps"), []);
        assert.isTrue(attributeOf(controlOf(tree), "list").pipe(Option.isNone));
      }

      const { tree } = yield* rendering(
        yield* accepting(varied(text, [' step-label="true"', ' step-label="1"'])),
      );

      assert.lengthOf(partsOf(tree, "slider-interaction-steps"), 1);
    }),
  );

  it.effect(
    "[Q-19] a step-label it cannot draw, over 21 steps or with no step to list, is a mark on the verdict and no datalist",
    () =>
      Effect.gen(function* marksUndrawnLabels() {
        const text = yield* fixtureText("slider.xml");
        const twentyOne = yield* opened(
          varied(text, ['upper-bound="9.5"', 'upper-bound="19.5"'], ['step="2"', 'step="1"']),
        );
        const twentyTwo = yield* opened(
          varied(text, ['upper-bound="9.5"', 'upper-bound="20.5"'], ['step="2"', 'step="1"']),
        );
        const continuous = yield* opened(
          varied(yield* fixtureText("slider-float.xml"), [
            'reverse="true"',
            'reverse="true" step-label="true"',
          ]),
        );

        assert.strictEqual(twentyOne.verdict.verdict, "accepted");
        assert.strictEqual(
          partsOf(
            (yield* rendering(Option.getOrThrow(twentyOne.accepted))).tree,
            "slider-interaction-steps",
          ).length,
          1,
        );
        for (const undrawn of [twentyTwo, continuous]) {
          assert.strictEqual(undrawn.verdict.verdict, "accepted-with-unsupported");
          assert.deepStrictEqual(
            unsupportedFeatures(undrawn.verdict).map((feature) => feature.feature),
            ["step-label"],
          );

          const { tree } = yield* rendering(Option.getOrThrow(undrawn.accepted));

          assert.deepStrictEqual(partsOf(tree, "slider-interaction-steps"), []);
          assert.isTrue(attributeOf(controlOf(tree), "list").pipe(Option.isNone));
        }
      }),
  );

  it.effect(
    "[Q-19] orientation and reverse are carried as hints the stylesheet reads, and the sheet draws them",
    () =>
      Effect.gen(function* carriesHints() {
        const vertical = yield* rendering(yield* fixture("slider-float.xml"));
        const plain = yield* rendering(yield* fixture("slider.xml"));
        const root = onlyPart(vertical.tree, "slider-interaction");
        const sheet = yield* Effect.tryPromise(() =>
          readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8"),
        );
        const block = stylesheetBlock.exec(sheet)?.groups?.["css"] ?? "";

        assert.deepStrictEqual(attributeOf(root, "data-orientation"), Option.some("vertical"));
        assert.isTrue(attributeOf(root, "data-reverse").pipe(Option.isSome));
        assert.isTrue(
          attributeOf(onlyPart(plain.tree, "slider-interaction"), "data-orientation").pipe(
            Option.isNone,
          ),
        );
        assert.isTrue(
          attributeOf(onlyPart(plain.tree, "slider-interaction"), "data-reverse").pipe(
            Option.isNone,
          ),
        );
        assert.include(block, '[data-orientation="vertical"]');
        assert.include(block, "writing-mode: vertical-lr");
      }),
  );

  it.effect(
    "[Q-19] reverse draws the high bound where the low one usually sits: the Control's dir and the bounds' order follow orientation and reverse",
    () =>
      Effect.gen(function* drawsReverse() {
        const text = yield* fixtureText("slider-float.xml");
        const cases = [
          { dir: Option.none(), order: "lower-upper", orientation: "vertical", reverse: "true" },
          {
            dir: Option.some("rtl"),
            order: "upper-lower",
            orientation: "vertical",
            reverse: "false",
          },
          {
            dir: Option.some("rtl"),
            order: "upper-lower",
            orientation: "horizontal",
            reverse: "true",
          },
          { dir: Option.none(), order: "lower-upper", orientation: "horizontal", reverse: "false" },
        ] as const;

        for (const { dir, order, orientation, reverse } of cases) {
          const { tree } = yield* rendering(
            yield* accepting(
              varied(
                text,
                ['orientation="vertical"', `orientation="${orientation}"`],
                ['reverse="true"', `reverse="${reverse}"`],
              ),
            ),
          );
          const root = onlyPart(tree, "slider-interaction");
          const bounds = childSlots(root).filter((slot) => slot.includes("-bound"));
          const between = childSlots(root).filter(
            (slot) => slot === controlSlot || slot.includes("-bound"),
          );

          assert.deepStrictEqual(
            attributeOf(controlOf(tree), "dir"),
            dir,
            `${orientation} ${reverse}`,
          );
          assert.deepStrictEqual(
            bounds.map((slot) => slot.replace("slider-interaction-", "").replace("-bound", "")),
            order.split("-"),
            `${orientation} ${reverse}`,
          );
          assert.strictEqual(between[1], controlSlot, `${orientation} ${reverse}`);
        }
      }),
  );

  it.effect(
    "[Q-19] postings binds the response as a single integer and decode reads the posted number",
    () =>
      Effect.gen(function* bindsInteger() {
        const configuration = yield* configure({});
        const item = yield* fixture("slider.xml");
        const [posting, ...others] = postings(redact(item, undefined, configuration), instance);

        assert.deepStrictEqual(others, []);
        assert.deepStrictEqual(posting?.binding, {
          baseType: "integer",
          cardinality: "single",
          name: entryName(instance, "RESPONSE"),
        });
        assert.deepStrictEqual(posting?.options, { base: 10 });
        assert.deepStrictEqual(
          decode(
            [[entryName(instance, "RESPONSE"), "6"]],
            posting?.binding ?? assert.fail("no posting"),
            posting?.options,
          ),
          Result.succeed(integer(6n)),
        );

        const floating = yield* fixture("slider-float.xml");
        const [floatPosting] = postings(redact(floating, undefined, configuration), instance);

        assert.deepStrictEqual(
          decode(
            [[entryName(instance, "RESPONSE"), "0.75"]],
            floatPosting?.binding ?? assert.fail("no float posting"),
            floatPosting?.options,
          ),
          Result.succeed(float(0.75)),
        );
      }),
  );

  it.effect(
    "[Q-19] checkResponses: a value outside the bounds or off the steps is refused in tier (a)",
    () =>
      Effect.gen(function* refusesOutsideRange() {
        const configuration = yield* configure({});
        const item = yield* fixture("slider.xml");
        const check = (value: bigint) =>
          checkResponses(item, { RESPONSE: integer(value) }, configuration);
        const [above] = check(12n);
        const [off] = check(5n);

        assert.deepStrictEqual(configuration.validateResponses, false);
        assert.deepStrictEqual(check(6n), []);
        assert.deepStrictEqual(check(0n), []);
        assert.deepStrictEqual(check(10n), []);
        assert.strictEqual(check(12n).length, 1);
        assert.strictEqual(above?.response, "RESPONSE");
        assert.include(above?.text ?? "", "10");
        assert.strictEqual(check(5n).length, 1);
        assert.include(off?.text ?? "", "2");
        assert.notDeepEqual(above?.text, off?.text);
        assert.include(check(-2n)[0]?.text ?? "", "0");
        assert.strictEqual(check(-2n).length, 1);
        assert.strictEqual(check(11n).length, 1);
      }),
  );

  it.effect(
    "[Q-19] checkResponses: a float binding holds its bounds and, when written, its step, to the double's own rounding",
    () =>
      Effect.gen(function* checksFloat() {
        const configuration = yield* configure({ validateResponses: true });
        const text = yield* fixtureText("slider-float.xml");
        const continuous = yield* accepting(text);
        const stepped = yield* accepting(
          varied(
            text,
            ['lower-bound="0"', 'lower-bound="0.5"'],
            ['upper-bound="1.5"', 'upper-bound="1.5" step="0.1"'],
          ),
        );
        const check = (item: Accepted, value: number) =>
          checkResponses(item, { RESPONSE: float(value) }, configuration);

        assert.deepStrictEqual(check(continuous, 0.3), []);
        assert.deepStrictEqual(check(continuous, 0), []);
        assert.deepStrictEqual(check(continuous, 1.5), []);
        assert.strictEqual(check(continuous, 1.6).length, 1);
        assert.strictEqual(check(continuous, -0.1).length, 1);
        assert.deepStrictEqual(check(stepped, 0.8), []);
        assert.deepStrictEqual(check(stepped, 1.1), []);
        assert.strictEqual(check(stepped, 0.85).length, 1);
        assert.strictEqual(check(stepped, 0.3).length, 1);
      }),
  );

  it.effect(
    "[Q-19] checkResponses: text that is no number is refused as for any numeric control, and no post is NULL, which counts",
    () =>
      Effect.gen(function* refusesMalformed() {
        const configuration = yield* configure({ validateResponses: true });
        const configured = yield* configure({});
        const item = yield* fixture("slider.xml");
        const [posting] = postings(redact(item, undefined, configured), instance);
        const name = entryName(instance, "RESPONSE");
        const binding = posting?.binding ?? assert.fail("no posting");
        const decoded = decode([[name, "six"]], binding, posting?.options);

        assert.isTrue(Result.isFailure(decoded));
        assert.deepStrictEqual(
          checkResponses(item, { RESPONSE: Result.merge(decoded) }, configuration),
          [{ response: "RESPONSE", text: message("en", "malformedNumber") }],
        );
        assert.deepStrictEqual(checkResponses(item, {}, configuration), []);
      }),
  );

  it.effect("[Q-19] score with the correct value gives the maximum and another below it", () =>
    Effect.gen(function* scoresCorrect() {
      const item = yield* fixture("slider.xml");
      const maximum = item.item.outcomes.get("SCORE")?.normalMaximum ?? Option.none();
      const scoreOf = (value: bigint) =>
        Effect.fromResult(score(item, { RESPONSE: integer(value) })).pipe(
          Effect.map((stored) => stored.outcomes["SCORE"]?.values.map(({ value: held }) => held)),
        );

      assert.deepStrictEqual(maximum, Option.some(1));
      assert.deepStrictEqual(yield* scoreOf(6n), [1]);
      assert.deepStrictEqual(yield* scoreOf(4n), [0]);
      assert.isTrue(Result.isFailure(score(item, { RESPONSE: integer(12n) })));
    }),
  );

  it.effect(
    "[Q-19] solution shows the correct value, and review and solution modes disable the control",
    () =>
      Effect.gen(function* showsSolution() {
        const item = yield* fixture("slider.xml");
        const correct = solution(item);
        const answering = yield* rendering(item);
        const reviewed = yield* rendering(item, {
          mode: "review",
          values: { RESPONSE: integer(4n) },
        });
        const solved = yield* rendering(item, { mode: "solution", values: correct });
        const finished = yield* rendering(item, { disabled: true });

        assert.deepStrictEqual(correct["RESPONSE"], integer(6n));
        assert.isTrue(attributeOf(controlOf(answering.tree), "disabled").pipe(Option.isNone));
        assert.deepStrictEqual(attributeOf(controlOf(reviewed.tree), "value"), Option.some("4"));
        assert.deepStrictEqual(attributeOf(controlOf(solved.tree), "value"), Option.some("6"));
        for (const { tree } of [reviewed, solved]) {
          assert.isTrue(attributeOf(controlOf(tree), "disabled").pipe(Option.isSome));
        }

        assert.deepStrictEqual(
          [reviewed, solved].map(({ tree }) =>
            attributeOf(onlyPart(tree, "slider-interaction"), "data-mode"),
          ),
          [Option.some("review"), Option.some("solution")],
        );
        assert.isTrue(attributeOf(controlOf(finished.tree), "disabled").pipe(Option.isSome));
        assert.isTrue(
          attributeOf(onlyPart(finished.tree, "slider-interaction"), "data-disabled").pipe(
            Option.isSome,
          ),
        );
      }),
  );

  it.effect("[Q-19] restore gives the stored value back for the control to show", () =>
    Effect.gen(function* restoresStored() {
      const item = yield* fixture("slider.xml");
      const stored = yield* Effect.fromResult(score(item, { RESPONSE: integer(4n) }));
      const restored = yield* Effect.fromResult(restore(item, stored));
      const { tree } = yield* rendering(item, { values: restored.values });

      assert.deepStrictEqual(restored.values["RESPONSE"], integer(4n));
      assert.deepStrictEqual(attributeOf(controlOf(tree), "value"), Option.some("4"));
    }),
  );

  it.effect("[Q-19] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* accessible() {
      for (const file of ["slider.xml", "slider-float.xml"]) {
        const item = yield* fixture(file);

        for (const options of [
          {},
          { mode: "review", values: { RESPONSE: float(0.5) } },
          { mode: "solution", values: solution(item) },
          { disabled: true },
        ] satisfies readonly Options[]) {
          const { root, tree } = yield* rendering(item, options);
          const prompt = onlyPart(tree, "slider-interaction-prompt");

          assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), [], file);
          assert.isTrue(roundTrips(root), file);
          assert.strictEqual(nameOf(controlOf(tree), root), textIn(prompt), file);
          assert.strictEqual(controlOf(tree).attrs["aria-labelledby"], prompt.attrs["id"], file);
        }
      }
    }),
  );

  it.effect(
    "[Q-19] with no prompt, the author's aria-label names the control, else the renderer does: Answer, or Answer n of count",
    () =>
      Effect.gen(function* namesWithoutPrompt() {
        const text = yield* fixtureText("slider.xml");
        const promptless = varied(text, [
          /<qti-prompt>[^]*?<\/qti-prompt>/u.exec(text)?.[0] ?? "",
          "",
        ]);
        const labelled = yield* rendering(
          yield* accepting(varied(promptless, ['step="2"', 'step="2" aria-label="Pots of seeds"'])),
        );
        const unnamed = yield* rendering(yield* accepting(promptless));
        const twice = yield* rendering(
          yield* accepting(
            varied(
              promptless,
              [
                "</qti-response-declaration>",
                '</qti-response-declaration><qti-response-declaration identifier="SECOND" cardinality="single" base-type="float"/>',
              ],
              [
                "</qti-slider-interaction>",
                '</qti-slider-interaction><qti-slider-interaction response-identifier="SECOND" lower-bound="0" upper-bound="1"/>',
              ],
            ),
          ),
        );

        assert.deepStrictEqual(partsOf(labelled.tree, "slider-interaction-prompt"), []);
        assert.strictEqual(nameOf(controlOf(labelled.tree), labelled.root), "Pots of seeds");
        assert.strictEqual(nameOf(controlOf(unnamed.tree), unnamed.root), message("en", "answer"));
        assert.deepStrictEqual(
          partsOf(twice.tree, controlSlot).map((control) => nameOf(control, twice.root)),
          [
            message("en", "answerOf", { count: "2", n: "1" }),
            message("en", "answerOf", { count: "2", n: "2" }),
          ],
        );
        for (const { root } of [labelled, unnamed, twice]) {
          assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
        }
      }),
  );

  it.effect(
    "[Q-19] a slider bound to a response it cannot render is the notice for that binding",
    () =>
      Effect.gen(function* noticesOtherBindings() {
        const text = yield* fixtureText("slider.xml");
        const cases = [
          [
            [
              'cardinality="single" base-type="integer"',
              'cardinality="multiple" base-type="integer"',
            ],
            'cardinality="multiple"',
          ],
          [
            ['cardinality="single" base-type="integer"', 'cardinality="single" base-type="string"'],
            'base-type="string"',
          ],
        ] as const;

        for (const [replacement, feature] of cases) {
          const { accepted, verdict } = yield* opened(varied(text, replacement));
          const item = Option.getOrThrow(accepted);
          const { tree } = yield* rendering(item);

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported", feature);
          assert.deepStrictEqual(
            unsupportedFeatures(verdict).map((entry) => entry.feature),
            [feature],
          );
          assert.deepStrictEqual(partsOf(tree, controlSlot), [], feature);
          assert.lengthOf(partsOf(tree, "item-notice"), 1, feature);
        }
      }),
  );

  it.effect("[Q-19] a bound or step that is no finite number is the notice naming it", () =>
    Effect.gen(function* noticesUnbounded() {
      const text = yield* fixtureText("slider.xml");
      const cases = [
        [['upper-bound="9.5"', 'upper-bound="INF"'], 'upper-bound="INF"'],
        [['step="2"', 'step="INF"'], 'step="INF"'],
      ] as const;

      for (const [replacement, feature] of cases) {
        const { accepted, verdict } = yield* opened(varied(text, replacement));
        const { tree } = yield* rendering(Option.getOrThrow(accepted));

        assert.strictEqual(verdict.verdict, "accepted-with-unsupported", feature);
        assert.deepStrictEqual(
          unsupportedFeatures(verdict).map((entry) => entry.feature),
          [feature],
        );
        assert.deepStrictEqual(partsOf(tree, controlSlot), [], feature);
        assert.lengthOf(partsOf(tree, "item-notice"), 1, feature);
      }
    }),
  );

  it.effect("[Q-19] redact's copy holds no correct response", () =>
    Effect.gen(function* holdsNoAnswer() {
      const configuration = yield* configure({});
      const leaked = [
        ["slider.xml", [6, "6"]],
        ["slider-float.xml", [0.5, "0.5", 0.75, "0.75"]],
      ] as const;

      for (const [file, answers] of leaked) {
        const item = yield* fixture(file);
        const json = yield* Effect.fromResult(
          encodeRedacted(redact(item, undefined, configuration)),
        );
        const written = JSON.stringify(json);
        const { tree } = yield* rendering(item);

        assert.include(valuesIn(written), "slider", `${file}: the redacted body holds the slider`);
        assert.notInclude(written, "qti-correct-response", file);
        assert.notInclude(written, "qti-default-value", file);
        for (const answer of answers) {
          assert.notInclude(valuesIn(written), answer, `${file}: ${String(answer)}`);
        }

        assert.deepStrictEqual(attributeOf(controlOf(tree), "value"), Option.some("0"), file);
      }
    }),
  );

  it.effect("[Q-19] its redacted JSON decodes back and renders the same HTML", () =>
    Effect.gen(function* roundTripsJson() {
      const configuration = yield* configure({});

      for (const file of ["slider.xml", "slider-float.xml"]) {
        const item = yield* fixture(file);
        const redacted = redact(item, undefined, configuration);
        const encoded = yield* Effect.fromResult(encodeRedacted(redacted));
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
        const handedOver: unknown = JSON.parse(JSON.stringify(encoded));
        const decoded = yield* Effect.fromResult(decodeRedacted(handedOver));
        const decodedRender = yield* Effect.fromResult(
          render(decoded, configuration, { instance }),
        );

        assert.include(decodedRender.html, 'type="range"', file);
        assert.strictEqual((yield* rendering(item)).html, decodedRender.html, file);
      }
    }),
  );

  it.effect(
    "[Q-19] resolves each marker back to its part, and a host swaps a part by the part table's rules",
    () =>
      Effect.gen(function* swapsParts() {
        const item = yield* fixture("slider.xml");
        const slots = [
          "slider-interaction",
          "slider-interaction-prompt",
          "slider-interaction-control",
          "slider-interaction-lower-bound",
          "slider-interaction-upper-bound",
          "slider-interaction-steps",
        ];
        const configuration = yield* configure({});
        const redacted = redact(item, undefined, configuration);
        const swapped = yield* rendering(item, {
          parts: { "slider-interaction": { lowerBound: bold } },
        });
        const kept = yield* Effect.fromResult(
          render(redacted, configuration, {
            instance,
            parts: { "slider-interaction": { control: hostile } },
          }),
        );
        const refused = render(redacted, configuration, {
          instance,
          parts: { "slider-interaction": { control: (props) => h("div", props) } },
        });
        const control = controlOf(parseHtml(kept.html));

        for (const slot of slots) {
          assert.isTrue(Option.isSome(partForSlot(slot)), slot);
        }

        assert.strictEqual(onlyPart(swapped.tree, "slider-interaction-lower-bound").tag, "b");
        assert.deepStrictEqual(
          ["type", "min", "max", "step", "value"].map((name) => attributeOf(control, name)),
          [
            Option.some("range"),
            Option.some("0"),
            Option.some("10"),
            Option.some("2"),
            Option.some("0"),
          ],
        );
        assert.isTrue(Result.isFailure(refused));
      }),
  );
});
