import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { partForSlot } from "#plate/emit/parts.ts";
import { Malformed } from "#plate/form/encoding.ts";
import {
  acceptedItem,
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
import type { Accepted, Options, Responses, StoredRecord, Verdict } from "#plate/index.ts";
import { endAttemptModule } from "#plate/interactions/end-attempt.ts";
import type { Value } from "#plate/model/values.ts";
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
  /\/\* begin end-attempt-interaction \(issue ei-02\) \*\/(?<css>[^]*?)\/\* end end-attempt-interaction \*\//u;

/**
 * The instance every render here uses.
 */
const instance = "e1";

/**
 * The entry name the End Attempt's button posts under in {@link instance}.
 */
const hintName = entryName(instance, "HINT");

/**
 * The marker of the Root.
 */
const rootSlot = "end-attempt-interaction";

/**
 * The marker of the Control, the one native button.
 */
const controlSlot = "end-attempt-interaction-control";

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
  const verdict: Verdict = yield* open("items/end-attempt.xml", new TextEncoder().encode(xml));

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
 * Open the fixture item, which `open` must accept.
 *
 * @returns The accepted item.
 */
const fixture = Effect.fnUntraced(function* fixture() {
  return yield* accepting(yield* fixtureText("end-attempt.xml"));
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
 * Construct a single boolean value.
 *
 * @param value The boolean.
 * @returns The value holding it.
 */
const flag = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * Construct a single identifier value.
 *
 * @param identifier The identifier.
 * @returns The value holding it.
 */
const choice = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * Read the values an outcome holds in a stored record.
 *
 * @param stored The record.
 * @param identifier The outcome's identifier.
 * @returns The outcome's values, none for NULL, and none at all for an outcome the record lacks.
 */
const outcomeOf = (
  stored: {
    readonly outcomes: Readonly<
      Record<string, { readonly values: readonly { readonly value: unknown }[] }>
    >;
  },
  identifier: string,
): readonly unknown[] | undefined => stored.outcomes[identifier]?.values.map(({ value }) => value);

/**
 * Score one attempt of an accepted item.
 *
 * @param accepted The accepted item.
 * @param responses The attempt's responses.
 * @param record The record before the attempt, none for the first attempt.
 * @returns The record after the attempt.
 */
const attempt = (accepted: Accepted, responses: Responses, record?: StoredRecord) =>
  Effect.fromResult(score(accepted, responses, record));

/**
 * Place an item's render in a minimal page as a host composes one: the item's root, and a plain
 * `form` holding its content and the host's own submit button after it, which `checkTree`'s
 * `submit-order` rule reads the End Attempt's button against.
 *
 * @param root The item's root.
 * @returns The page's root.
 */
const composed = (root: Element): Element =>
  h("qti-assessment-item", root.attrs, [
    h("form", { action: "/submit", method: "post", novalidate: true }, [
      ...root.children,
      h("button", { type: "submit" }, [text("Submit")]),
    ]),
  ]);

/**
 * Write a minimal item that holds one End Attempt in a paragraph and no response processing, whose
 * `HINT` declaration is the one given.
 *
 * @param declaration The `qti-response-declaration` of `HINT`.
 * @returns The item's XML.
 */
const minimalItem = (declaration: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="ei-end-attempt-binding" title="Binding" adaptive="false" time-dependent="false">
  ${declaration}
  <qti-item-body>
    <p>Ask for a <qti-end-attempt-interaction response-identifier="HINT" title="Hint"/> now.</p>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * A host's replacement for the Control that tries to change what the interaction computed: a plain
 * button that posts nothing under another name and value.
 *
 * @param props The attributes the part carries.
 * @param children The nodes the part holds.
 * @returns A button that carries `props` under its own `type`, `name` and `value`.
 */
const hostile = (props: Attributes, children: readonly Node[]) =>
  h("button", { ...props, name: "other", type: "button", value: "false" }, children);

describe("end-attempt", () => {
  it.effect("[Q-4] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* acceptsFixture() {
      const { accepted, verdict } = yield* opened(yield* fixtureText("end-attempt.xml"));

      assert.strictEqual(verdict.verdict, "accepted");
      assert.isTrue(Option.isSome(accepted));
      assert.deepStrictEqual(unsupportedFeatures(verdict), []);
      assert.notInclude(
        unsupportedFeatures(verdict).map((entry) => entry.feature),
        "qti-end-attempt-interaction",
      );
    }),
  );

  it.effect("[Q-4] render emits a native submit button in the sentence, its text the title", () =>
    Effect.gen(function* rendersButton() {
      const { root, tree } = yield* rendering(yield* fixture());
      const control = onlyPart(tree, controlSlot);
      const interaction = onlyPart(tree, rootSlot);
      const sentences = elementsIn(tree).filter(
        (element) => element.tag === "p" && element.children.includes(interaction),
      );

      assert.strictEqual(control.tag, "button");
      assert.deepStrictEqual(
        ["type", "name", "value"].map((name) => attributeOf(control, name)),
        [Option.some("submit"), Option.some(hintName), Option.some("true")],
      );
      assert.strictEqual(textIn(control), "Hint");
      assert.strictEqual(interaction.tag, "qti-end-attempt-interaction");
      assert.deepStrictEqual(interaction.children, [control]);
      assert.lengthOf(sentences, 1);
      assert.deepStrictEqual(
        sentences[0]?.children.map((child) => (child.kind === "text" ? child.text : child.tag)),
        [
          "Stuck on the riddle? Ask for a ",
          "qti-end-attempt-interaction",
          " before you answer again.",
        ],
      );
      assert.deepStrictEqual(partsOf(tree, "item-notice"), []);
      assert.isTrue(roundTrips(root));
    }),
  );

  it.effect(
    "[Q-4] postings binds the response as a single boolean whose absent entry is false",
    () =>
      Effect.gen(function* bindsBoolean() {
        const configuration = yield* configure({});
        const item = yield* fixture();
        const found = postings(redact(item, undefined, configuration), instance);
        const hint = found.find((posting) => posting.identifier === "HINT");
        const other = found.find((posting) => posting.identifier === "RESPONSE");

        assert.deepStrictEqual(hint?.binding, {
          baseType: "boolean",
          cardinality: "single",
          name: hintName,
        });
        assert.deepStrictEqual(hint?.options.absent, flag(false));
        assert.isUndefined(other?.options.absent);
      }),
  );

  it.effect("[Q-4] a post with the button's entry decodes to true", () =>
    Effect.gen(function* decodesPressed() {
      const configuration = yield* configure({});
      const item = yield* fixture();
      const posting = postings(redact(item, undefined, configuration), instance).find(
        (found) => found.identifier === "HINT",
      );

      assert.deepStrictEqual(
        decode(
          [
            [entryName(instance, "RESPONSE"), "tree"],
            [hintName, "true"],
          ],
          posting?.binding ?? assert.fail("no posting for HINT"),
          posting?.options,
        ),
        Result.succeed(flag(true)),
      );
    }),
  );

  it.effect(
    "[Q-4] a post without the button's entry decodes to false, whatever the default value",
    () =>
      Effect.gen(function* decodesAbsent() {
        const configuration = yield* configure({});
        const source = yield* fixtureText("end-attempt.xml");
        const defaulted = yield* accepting(
          varied(source, [
            '<qti-response-declaration identifier="HINT" cardinality="single" base-type="boolean"/>',
            '<qti-response-declaration identifier="HINT" cardinality="single" base-type="boolean"><qti-default-value><qti-value>true</qti-value></qti-default-value></qti-response-declaration>',
          ]),
        );
        const entries = [[entryName(instance, "RESPONSE"), "tree"]] as const;

        for (const item of [yield* fixture(), defaulted]) {
          const redacted = redact(item, undefined, configuration);
          const found = postings(redacted, instance);
          const posting = found.find((candidate) => candidate.identifier === "HINT");

          assert.deepStrictEqual(
            decode(
              entries,
              posting?.binding ?? assert.fail("no posting for HINT"),
              posting?.options,
            ),
            Result.succeed(flag(false)),
          );

          const decoded = Object.fromEntries(
            found.map(({ binding, identifier, options }) => [
              identifier,
              Result.getOrThrow(decode(entries, binding, options)),
            ]),
          );
          const stored = yield* attempt(item, decoded);

          assert.deepStrictEqual(decoded["HINT"], flag(false));
          assert.deepStrictEqual(outcomeOf(stored, "FEEDBACK"), []);
          assert.deepStrictEqual(outcomeOf(stored, "SCORE"), [0]);
        }

        const withoutOptions = postings(redact(defaulted, undefined, configuration), instance).find(
          (candidate) => candidate.identifier === "HINT",
        );

        assert.deepStrictEqual(
          decode(entries, withoutOptions?.binding ?? assert.fail("no posting for HINT")),
          Result.succeed({ baseType: "boolean", cardinality: "single", values: [] }),
        );
      }),
  );

  it.effect("[Q-4] score with the button pressed runs response processing with HINT true", () =>
    Effect.gen(function* scoresPressed() {
      const { accepted, verdict } = yield* opened(yield* fixtureText("end-attempt.xml"));
      const item = Option.getOrElse(accepted, () => assert.fail(`the item is ${verdict.verdict}`));

      assert.deepStrictEqual(unsupportedFeatures(verdict), []);

      const pressed = yield* attempt(item, { HINT: flag(true), RESPONSE: choice("tree") });
      const answered = yield* attempt(item, { HINT: flag(false), RESPONSE: choice("candle") });

      assert.deepStrictEqual(outcomeOf(pressed, "FEEDBACK"), ["clue"]);
      assert.deepStrictEqual(outcomeOf(pressed, "SCORE"), [0]);
      assert.deepStrictEqual(outcomeOf(answered, "FEEDBACK"), []);
      assert.deepStrictEqual(outcomeOf(answered, "SCORE"), [1]);
    }),
  );

  it.effect(
    "[Q-4] count-attempt false leaves numAttempts unchanged; true and absent count the attempt",
    () =>
      Effect.gen(function* countsAttempts() {
        const source = yield* fixtureText("end-attempt.xml");
        const pressed = { HINT: flag(true), RESPONSE: choice("tree") };
        const unpressed = { HINT: flag(false), RESPONSE: choice("tree") };
        const cases = [
          ['count-attempt="false"', 0],
          ['count-attempt="0"', 0],
          ['count-attempt="true"', 1],
          ['count-attempt="1"', 1],
          ["", 1],
        ] as const;

        for (const [written, counted] of cases) {
          const item = yield* accepting(varied(source, [' count-attempt="false"', ` ${written}`]));
          const first = yield* attempt(item, pressed);
          const second = yield* attempt(item, unpressed, first);
          const third = yield* attempt(item, pressed, second);

          assert.strictEqual(first.numAttempts, counted, `${written}: pressed`);
          assert.strictEqual(second.numAttempts, counted + 1, `${written}: not pressed`);
          assert.strictEqual(third.numAttempts, counted + 1 + counted, `${written}: pressed again`);
        }
      }),
  );

  it.effect(
    "[Q-4] with two buttons, only the attempt ended through a button that does not count is left uncounted",
    () =>
      Effect.gen(function* countsPerButton() {
        const item = yield* accepting(
          varied(
            yield* fixtureText("end-attempt.xml"),
            [
              '<qti-response-declaration identifier="HINT" cardinality="single" base-type="boolean"/>',
              '<qti-response-declaration identifier="HINT" cardinality="single" base-type="boolean"/><qti-response-declaration identifier="SKIP" cardinality="single" base-type="boolean"/>',
            ],
            [
              " before you answer again.</p>",
              ' before you answer again. <qti-end-attempt-interaction response-identifier="SKIP" title="Skip"/></p>',
            ],
          ),
        );
        const { tree } = yield* rendering(item);
        const answers = { RESPONSE: choice("tree") };

        assert.lengthOf(partsOf(tree, controlSlot), 2);
        assert.strictEqual(
          (yield* attempt(item, { ...answers, HINT: flag(true), SKIP: flag(false) })).numAttempts,
          0,
        );
        assert.strictEqual(
          (yield* attempt(item, { ...answers, HINT: flag(false), SKIP: flag(true) })).numAttempts,
          1,
        );
        assert.strictEqual(
          (yield* attempt(item, { ...answers, HINT: flag(false), SKIP: flag(false) })).numAttempts,
          1,
        );
      }),
  );

  it.effect("[Q-4] the Root carries data-count-attempt with the value read, true when absent", () =>
    Effect.gen(function* carriesCountAttempt() {
      const source = yield* fixtureText("end-attempt.xml");
      const cases = [
        ['count-attempt="false"', "false"],
        ['count-attempt="0"', "false"],
        ['count-attempt="true"', "true"],
        ['count-attempt="1"', "true"],
        ["", "true"],
      ] as const;

      for (const [written, carried] of cases) {
        const { tree } = yield* rendering(
          yield* accepting(varied(source, [' count-attempt="false"', ` ${written}`])),
        );

        assert.deepStrictEqual(
          attributeOf(onlyPart(tree, rootSlot), "data-count-attempt"),
          Option.some(carried),
          written,
        );
      }
    }),
  );

  it.effect("[Q-4] a count-attempt that is no xs:boolean is refused", () =>
    Effect.gen(function* refusesCountAttempt() {
      const { accepted, verdict } = yield* opened(
        varied(yield* fixtureText("end-attempt.xml"), [
          'count-attempt="false"',
          'count-attempt="never"',
        ]),
      );

      assert.strictEqual(verdict.verdict, "refused");
      assert.isTrue(Option.isNone(accepted));
    }),
  );

  it.effect("[Q-4] finished modes disable the button", () =>
    Effect.gen(function* disablesWhenFinished() {
      const item = yield* fixture();
      const answering = yield* rendering(item);
      const reviewed = yield* rendering(item, { mode: "review" });
      const solved = yield* rendering(item, { mode: "solution", values: solution(item) });
      const finished = yield* rendering(item, { disabled: true });
      const modeOf = ({ tree }: { readonly tree: readonly Node[] }) =>
        attributeOf(onlyPart(tree, rootSlot), "data-mode");

      assert.isTrue(
        attributeOf(onlyPart(answering.tree, controlSlot), "disabled").pipe(Option.isNone),
      );
      for (const { tree } of [reviewed, solved, finished]) {
        assert.isTrue(attributeOf(onlyPart(tree, controlSlot), "disabled").pipe(Option.isSome));
      }

      assert.deepStrictEqual(
        [answering, reviewed, solved, finished].map(modeOf),
        ["answering", "review", "solution", "answering"].map((mode) => Option.some(mode)),
      );
      assert.isTrue(
        attributeOf(onlyPart(finished.tree, rootSlot), "data-disabled").pipe(Option.isSome),
      );
      assert.isTrue(
        attributeOf(onlyPart(answering.tree, rootSlot), "data-disabled").pipe(Option.isNone),
      );
    }),
  );

  it.effect("[Q-4] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* accessible() {
      const item = yield* fixture();

      for (const options of [
        {},
        { mode: "review", values: { HINT: flag(true) } },
        { mode: "solution", values: solution(item) },
        { disabled: true },
      ] satisfies readonly Options[]) {
        const { root, tree } = yield* rendering(item, options);

        assert.deepStrictEqual(checkTree(composed(root), { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(root));
        assert.strictEqual(nameOf(onlyPart(tree, controlSlot), root), "Hint");
      }
    }),
  );

  it.effect(
    "[Q-4] a blank title is named by the author's aria-label, else by the renderer's End attempt",
    () =>
      Effect.gen(function* namesBlankTitle() {
        const source = yield* fixtureText("end-attempt.xml");
        const unnamed = yield* rendering(
          yield* accepting(varied(source, ['title="Hint"', 'title=""'])),
        );
        const labelled = yield* rendering(
          yield* accepting(
            varied(source, ['title="Hint"', 'title="  " aria-label="Ask for a clue"']),
          ),
        );
        const referenced = yield* rendering(
          yield* accepting(
            varied(
              source,
              ['title="Hint"', 'title="" aria-labelledby="note"'],
              ["<p>Stuck", '<p id="note">Stuck'],
            ),
          ),
        );
        const named = yield* rendering(
          yield* accepting(
            varied(source, ['title="Hint"', 'title="Hint" aria-label="Ask for a clue"']),
          ),
        );

        assert.strictEqual(
          nameOf(onlyPart(unnamed.tree, controlSlot), unnamed.root),
          "End attempt",
        );
        assert.strictEqual(
          nameOf(onlyPart(labelled.tree, controlSlot), labelled.root),
          "Ask for a clue",
        );
        assert.deepStrictEqual(
          attributeOf(onlyPart(referenced.tree, controlSlot), "aria-labelledby"),
          Option.some(`${instance}--note`),
        );
        assert.strictEqual(nameOf(onlyPart(named.tree, controlSlot), named.root), "Hint");
        assert.isTrue(
          attributeOf(onlyPart(named.tree, controlSlot), "aria-label").pipe(Option.isNone),
        );
        for (const { root } of [unnamed, labelled]) {
          assert.deepStrictEqual(checkTree(composed(root), { baseLevel: 2 }), []);
        }
      }),
  );

  it.effect("[Q-4] a response that is not a single boolean is the notice for that binding", () =>
    Effect.gen(function* noticesOtherBindings() {
      const cases = [
        [
          '<qti-response-declaration identifier="HINT" cardinality="multiple" base-type="boolean"/>',
          'cardinality="multiple"',
        ],
        [
          '<qti-response-declaration identifier="HINT" cardinality="single" base-type="string"/>',
          'base-type="string"',
        ],
      ] as const;

      for (const [declaration, feature] of cases) {
        const { accepted, verdict } = yield* opened(minimalItem(declaration));
        const { tree } = yield* rendering(Option.getOrThrow(accepted));

        assert.strictEqual(verdict.verdict, "accepted-with-unsupported", feature);
        assert.deepStrictEqual(
          unsupportedFeatures(verdict).map((entry) => entry.feature),
          [feature],
        );
        assert.deepStrictEqual(partsOf(tree, controlSlot), [], feature);
        assert.lengthOf(partsOf(tree, "item-notice"), 1, feature);
      }

      const { verdict } = yield* opened(
        minimalItem(
          '<qti-response-declaration identifier="HINT" cardinality="single" base-type="boolean"/>',
        ),
      );

      assert.strictEqual(verdict.verdict, "accepted");
    }),
  );

  it.effect(
    "[Q-4] checkResponses refuses an entry the button cannot post, and accepts either boolean",
    () =>
      Effect.gen(function* checksResponses() {
        const configuration = yield* configure({ validateResponses: true });
        const item = yield* fixture();
        const configured = yield* configure({});
        const posting = postings(redact(item, undefined, configured), instance).find(
          (found) => found.identifier === "HINT",
        );
        const binding = posting?.binding ?? assert.fail("no posting for HINT");
        const refused = [
          decode([[hintName, "maybe"]], binding, posting?.options),
          decode(
            [
              [hintName, "true"],
              [hintName, "true"],
            ],
            binding,
            posting?.options,
          ),
        ].map((decoded) => {
          assert.isTrue(Result.isFailure(decoded));

          return checkResponses(item, { HINT: Result.merge(decoded) }, configuration);
        });

        assert.deepStrictEqual(
          refused.map((messages) => messages.map(({ response }) => response)),
          [["HINT"], ["HINT"]],
        );
        for (const [messages] of refused) {
          assert.include(messages?.text ?? "", "Hint");
          assert.include(messages?.text ?? "", "Press it again");
        }

        assert.deepStrictEqual(checkResponses(item, { HINT: flag(true) }, configuration), []);
        assert.deepStrictEqual(checkResponses(item, { HINT: flag(false) }, configuration), []);
        assert.deepStrictEqual(checkResponses(item, {}, configuration), []);
        assert.deepStrictEqual(
          checkResponses(
            item,
            { HINT: new Malformed({ entry: hintName, reason: "boolean" }) },
            configuration,
          ).map(({ response }) => response),
          ["HINT"],
        );
      }),
  );

  it.effect(
    "[Q-4] a refused post leaves the button described by its messages, and focus goes to it",
    () =>
      Effect.gen(function* describesRefusal() {
        const { tree } = yield* rendering(yield* fixture(), {
          messages: [{ response: "HINT", text: "Press it again." }],
          posted: { HINT: ["maybe"] },
        });
        const control = onlyPart(tree, controlSlot);

        assert.deepStrictEqual(
          attributeOf(control, "aria-describedby"),
          Option.some(`${instance}-HINT-message-0`),
        );
        assert.isTrue(attributeOf(control, "autofocus").pipe(Option.isSome));
        assert.deepStrictEqual(attributeOf(control, "value"), Option.some("true"));
      }),
  );

  it.effect(
    "[Q-4] restore gives the stored response back, and the button shows nothing of it",
    () =>
      Effect.gen(function* restoresStored() {
        const item = yield* fixture();
        const stored = yield* attempt(item, { HINT: flag(true), RESPONSE: choice("tree") });
        const restored = yield* Effect.fromResult(restore(item, stored));
        const shown = yield* rendering(item, { values: restored.values });
        const fresh = yield* rendering(item);

        assert.deepStrictEqual(restored.values["HINT"], flag(true));
        assert.deepStrictEqual(
          onlyPart(shown.tree, controlSlot).attrs,
          onlyPart(fresh.tree, controlSlot).attrs,
        );
      }),
  );

  it.effect("[Q-4] its redacted JSON decodes back and renders the same HTML", () =>
    Effect.gen(function* roundTripsJson() {
      const configuration = yield* configure({});
      const item = yield* fixture();
      const redacted = redact(item, undefined, configuration);
      const encoded = yield* Effect.fromResult(encodeRedacted(redacted));
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the item survives JSON text, the form a host sends; `structuredClone` would keep the bigints and Options JSON drops.
      const handedOver: unknown = JSON.parse(JSON.stringify(encoded));
      const decoded = yield* Effect.fromResult(decodeRedacted(handedOver));
      const decodedRender = yield* Effect.fromResult(render(decoded, configuration, { instance }));

      assert.include(valuesIn(JSON.stringify(encoded)), "end-attempt");
      assert.include(decodedRender.html, 'type="submit"');
      assert.strictEqual((yield* rendering(item)).html, decodedRender.html);
    }),
  );

  it.effect(
    "[Q-4] resolves each marker back to its part, and a host swaps a part by the part table's rules",
    () =>
      Effect.gen(function* swapsParts() {
        const item = yield* fixture();
        const configuration = yield* configure({});
        const redacted = redact(item, undefined, configuration);
        const swapped = yield* Effect.fromResult(
          render(redacted, configuration, {
            instance,
            parts: {
              "end-attempt-interaction": {
                root: (props, children) => h("span", props, children),
              },
            },
          }),
        );
        const kept = yield* Effect.fromResult(
          render(redacted, configuration, {
            instance,
            parts: { "end-attempt-interaction": { control: hostile } },
          }),
        );
        const refusedControl = render(redacted, configuration, {
          instance,
          parts: {
            "end-attempt-interaction": { control: (props, children) => h("a", props, children) },
          },
        });
        const refusedRoot = render(redacted, configuration, {
          instance,
          parts: {
            "end-attempt-interaction": { root: (props, children) => h("div", props, children) },
          },
        });
        const control = onlyPart(parseHtml(kept.html), controlSlot);

        for (const slot of [rootSlot, controlSlot]) {
          assert.isTrue(Option.isSome(partForSlot(slot)), slot);
        }

        assert.strictEqual(onlyPart(parseHtml(swapped.html), rootSlot).tag, "span");
        assert.deepStrictEqual(
          ["type", "name", "value"].map((name) => attributeOf(control, name)),
          [Option.some("submit"), Option.some(hintName), Option.some("true")],
        );
        assert.isTrue(Result.isFailure(refusedControl));
        assert.isTrue(Result.isFailure(refusedRoot));
      }),
  );

  it.effect("[Q-4] the part rows hold every attribute the render writes beyond the state", () =>
    Effect.gen(function* holdsMerged() {
      const source = yield* fixtureText("end-attempt.xml");
      const variants = [
        { options: {}, xml: source },
        {
          options: { messages: [{ response: "HINT", text: "Press it again." }] },
          xml: varied(source, [' count-attempt="false"', ' count-attempt="true" class="ask"']),
        },
        { options: { mode: "review" }, xml: source },
        {
          options: {},
          xml: varied(
            source,
            ['title="Hint"', 'title="" aria-label="Clue" aria-labelledby="note"'],
            ["<p>Stuck", '<p id="note">Stuck'],
          ),
        },
      ] satisfies readonly { readonly options: Options; readonly xml: string }[];
      const state = new Set(["data-disabled", "data-mode", "data-slot"]);
      const written = new Map<string, Set<string>>([
        [rootSlot, new Set()],
        [controlSlot, new Set()],
      ]);

      for (const { options, xml } of variants) {
        const { tree } = yield* rendering(yield* accepting(xml), options);
        for (const [slot, names] of written) {
          for (const element of partsOf(tree, slot)) {
            for (const name of Object.keys(element.attrs)) {
              if (!state.has(name)) {
                names.add(name);
              }
            }
          }
        }
      }

      assert.sameMembers(
        [...(written.get(rootSlot) ?? [])],
        [...endAttemptModule.parts.root.merged],
      );
      assert.sameMembers(
        [...(written.get(controlSlot) ?? [])],
        [...endAttemptModule.parts.control.merged],
      );
      assert.sameMembers(Object.keys(endAttemptModule.parts), ["control", "root"]);
      assert.isTrue(endAttemptModule.implemented);
    }),
  );

  it.effect("[Q-4] the stylesheet block draws the button as a control and shows its focus", () =>
    Effect.gen(function* stylesTheButton() {
      const sheet = yield* Effect.tryPromise(() =>
        readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8"),
      );
      const block = stylesheetBlock.exec(sheet)?.groups?.["css"] ?? "";

      assert.include(block, `[data-slot="${rootSlot}"]`);
      assert.include(block, `[data-slot="${controlSlot}"]`);
      assert.include(block, "min-block-size: 24px");
      assert.include(block, ":focus-visible");
      assert.include(block, ":disabled");
    }),
  );
});
