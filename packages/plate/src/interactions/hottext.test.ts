import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { decodeRedacted, encodeRedacted } from "#plate/codec/redacted.ts";
import { configure } from "#plate/configuration.ts";
import type { Attributes, Element, Node, PartFunction } from "#plate/emit/node.ts";
import { h } from "#plate/emit/node.ts";
import { UnknownPart } from "#plate/emit/parts.ts";
import { decode, entryName, Malformed } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { Value } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { checkResponses } from "#plate/responses.ts";
import { restore } from "#plate/restore.ts";
import type { Restored } from "#plate/restore.ts";
import { ResponsesRefused, score } from "#plate/score.ts";
import { solution } from "#plate/solution.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, unsupportedFeatures } from "#plate/validate/verdict.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The item instance every render here is made under, so the entry name is known.
 */
const instance = "q1";

/**
 * The identifier of the response every Hot Text here binds.
 */
const response = "RESPONSE";

/**
 * The name the Hot Text's controls post under when the host chooses none.
 */
const name = entryName(instance, response);

/**
 * The `data-slot` marker of each Hot Text part the render writes.
 */
const slots = {
  choice: "hottext-interaction-choice",
  content: "hottext-interaction-content",
  control: "hottext-interaction-control",
  prompt: "hottext-interaction-prompt",
  root: "hottext-interaction",
} as const;

/**
 * Read a fixture item of this area as the text the author wrote.
 *
 * @param file The fixture's file name under `fixtures/m3d/items/`.
 * @returns The item's XML.
 */
const fixtureText = (file: string): string =>
  readFileSync(new URL(`../../fixtures/m3d/items/${file}`, import.meta.url), "utf-8");

/**
 * Open an item from its XML and give the accepted item, which `open` must accept.
 *
 * @param xml The item's XML.
 * @param location The location the host names the item by.
 * @returns The accepted item.
 */
const accept = Effect.fnUntraced(function* accept(xml: string, location: string) {
  const verdict = yield* open(location, new TextEncoder().encode(xml));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open one of this area's fixture items, as written or edited.
 *
 * @param file The fixture's file name.
 * @param edit The edit that makes a variant of the item's XML, none for the item as written.
 * @returns The accepted item.
 */
const opened = (file: string, edit: (xml: string) => string = (xml) => xml) =>
  accept(edit(fixtureText(file)), `fixtures/m3d/items/${file}`);

/**
 * Render an accepted item as the host would for one candidate, in the default configuration.
 *
 * @param accepted The accepted item.
 * @param options What the host passes to `render` beside the instance.
 * @param record The attempt's record, whose template values show or hide the item's template
 *   parts; none to show the item as it reads with no record.
 * @returns The rendered HTML.
 */
const rendered = (accepted: Accepted, options: Options = {}, record?: Restored["record"]) =>
  Effect.gen(function* renderHotText() {
    const configuration = yield* configure({});
    const { html } = yield* Effect.fromResult(
      render(redact(accepted, record, configuration), configuration, { instance, ...options }),
    );

    return html;
  });

/**
 * Write an item whose template processing draws the variable `OFFER`, which three hottexts name:
 * `ONE` and `TWO` when it names them, and `THREE` unless it names it.
 *
 * @param offer The identifier template processing sets `OFFER` to.
 * @returns The item's XML.
 */
const drawnItem = (offer: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="w-hottext-drawn" title="Drawn" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-template-declaration identifier="OFFER" cardinality="single" base-type="identifier"/>
  <qti-template-processing>
    <qti-set-template-value identifier="OFFER"><qti-base-value base-type="identifier">${offer}</qti-base-value></qti-set-template-value>
  </qti-template-processing>
  <qti-item-body>
    <qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">
      <p>Take <qti-hottext identifier="ONE" template-identifier="OFFER" show-hide="show">the first</qti-hottext>, <qti-hottext identifier="TWO" template-identifier="OFFER" show-hide="show">the second</qti-hottext> or <qti-hottext identifier="THREE" template-identifier="OFFER" show-hide="hide">the third</qti-hottext> today.</p>
    </qti-hottext-interaction>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * Parse rendered HTML into its one root element.
 *
 * @param html The rendered HTML.
 * @returns The `qti-assessment-item` element.
 */
const rootOf = (html: string): Element => {
  const parsed = parseHtml(html);
  const [root] = parsed;

  if (parsed.length !== 1 || root?.kind !== "element") {
    return assert.fail("the HTML is not exactly one element");
  }

  return root;
};

/**
 * List an element and every element below it, in document order.
 *
 * @param node The subtree's root.
 * @returns The elements, the root first when it is one.
 */
const elementsIn = (node: Node): readonly Element[] =>
  node.kind === "element" ? [node, ...node.children.flatMap(elementsIn)] : [];

/**
 * List the elements of a tree that carry a `data-slot` marker.
 *
 * @param root The tree.
 * @param slot The marker.
 * @returns The elements, in document order.
 */
const partsOf = (root: Element, slot: string): readonly Element[] =>
  elementsIn(root).filter((element) => element.attrs["data-slot"] === slot);

/**
 * Give the one part of a tree a marker names.
 *
 * @param root The tree.
 * @param slot The marker.
 * @returns The part; the test fails when the tree holds none or several.
 */
const partOf = (root: Element, slot: string): Element => {
  const found = partsOf(root, slot);
  const [only] = found;

  return found.length === 1 && only !== undefined
    ? only
    : assert.fail(`${slot} is written ${String(found.length)} times, not once`);
};

/**
 * Give the first descendant element of a tree with a tag.
 *
 * @param root The tree.
 * @param tag The tag.
 * @returns The element; the test fails when the tree holds none.
 */
const firstTag = (root: Element, tag: string): Element =>
  elementsIn(root).find((element) => element.tag === tag) ??
  assert.fail(`the tree holds no <${tag}>`);

/**
 * Give the identifiers of the controls a tree holds, in document order.
 *
 * @param root The tree.
 * @returns Each control's `value`.
 */
const valuesOf = (root: Element): readonly string[] =>
  partsOf(root, slots.control).map((control) => String(control.attrs["value"]));

/**
 * Give the identifiers of the controls a tree holds that are checked.
 *
 * @param root The tree.
 * @returns The `value` of each checked control, in document order.
 */
const checkedOf = (root: Element): readonly string[] =>
  partsOf(root, slots.control)
    .filter((control) => control.attrs["checked"] !== undefined)
    .map((control) => String(control.attrs["value"]));

/**
 * Construct a host's replacement for a part: the part as an element of one tag, keeping the
 * attributes and children it is handed.
 *
 * @param tag The replacement's tag.
 * @returns The part function.
 */
const swap =
  (tag: string): PartFunction<Attributes> =>
  (props, children) =>
    h(tag, props, children);

/**
 * Construct the value of an identifier response.
 *
 * @param cardinality The response's cardinality.
 * @param identifiers The identifiers it holds.
 * @returns The value.
 */
const identifiers = (cardinality: "multiple" | "single", ...members: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality,
  values: members.map((value) => ({ baseType: "identifier", value })),
});

/**
 * The fixture's correct response, as its declaration writes it.
 */
const correct = identifiers("multiple", "LAMP", "HORN");

/**
 * The message the author wrote for too few selections.
 */
const authorMin = "Pick at least one duty.";

/**
 * The message the author wrote for too many selections.
 */
const authorMax = "Pick no more than two duties.";

/**
 * Give an item's SCORE after one attempt, read from the record `score` stored.
 *
 * @param accepted The accepted item.
 * @param value The candidate's response.
 * @returns The outcome `SCORE`, a float.
 */
const scoreAfter = (accepted: Accepted, value: Value) =>
  Effect.gen(function* scoreOf() {
    const stored = yield* Effect.fromResult(score(accepted, { [response]: value }));
    const record = yield* Effect.fromResult(decodeRecord(stored));
    const outcome = record.outcomes["SCORE"];

    return outcome?.values[0]?.baseType === "float"
      ? outcome.values[0].value
      : assert.fail("SCORE is not a float");
  });

describe("Hot Text", () => {
  it.effect("[Q-11] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* opens() {
      for (const file of ["hottext.xml", "hottext-single.xml"]) {
        const verdict = yield* open(
          `fixtures/m3d/items/${file}`,
          new TextEncoder().encode(fixtureText(file)),
        );

        assert.isTrue(Option.isSome(acceptedItem(verdict)), `${file} is accepted`);
        assert.deepStrictEqual(
          unsupportedFeatures(verdict).filter((entry) => entry.feature.startsWith("qti-hottext")),
          [],
          file,
        );
        assert.strictEqual(verdict.verdict, "accepted", file);
      }
    }),
  );

  it.effect(
    "[Q-11] render keeps the author's sentence and turns each hottext into a control in place",
    () =>
      Effect.gen(function* inPlace() {
        const root = rootOf(yield* rendered(yield* opened("hottext.xml")));
        const paragraph = firstTag(partOf(root, slots.content), "p");
        const controls = partsOf(root, slots.control);

        assert.strictEqual(
          textOf(paragraph),
          "Each evening the harbour keeper lights the lamp, writes the log, sounds the horn when fog rolls in and pours a cup of tea before bed.",
        );
        assert.deepStrictEqual(valuesOf(root), ["LAMP", "LOG", "HORN", "TEA"]);
        assert.strictEqual(controls.length, 4);
        assert.strictEqual(partsOf(root, slots.root).length, 1);

        const labels = partsOf(root, slots.choice);

        assert.deepStrictEqual(
          labels.map((label) => [label.tag, textOf(label)]),
          [
            ["label", "lights the lamp"],
            ["label", "writes the log"],
            ["label", "sounds the horn"],
            ["label", "pours a cup of tea"],
          ],
        );
        for (const [index, control] of controls.entries()) {
          assert.isTrue(
            elementsIn(labels[index] ?? paragraph).includes(control),
            `control ${String(index)} sits in its label`,
          );
          assert.isTrue(elementsIn(paragraph).includes(control), "and in the paragraph");
        }

        const emphasis = firstTag(paragraph, "em");

        assert.isTrue(
          elementsIn(emphasis).includes(controls[1] ?? emphasis),
          "the hottext the author put in an em stays in it",
        );
        assert.isFalse(elementsIn(emphasis).includes(controls[0] ?? emphasis));
      }),
  );

  it.effect(
    "[Q-11] the rendered HTML parses back to the same tree: no part breaks the author's paragraph",
    () =>
      Effect.gen(function* parsesBack() {
        const html = yield* rendered(yield* opened("hottext.xml"));
        const root = rootOf(html);
        const paragraph = firstTag(root, "p");

        assert.isTrue(roundTrips(root));
        assert.strictEqual(
          elementsIn(paragraph).filter((element) => element.attrs["data-slot"] === slots.control)
            .length,
          4,
        );
        assert.isTrue(
          partsOf(root, slots.control).every((control) => elementsIn(paragraph).includes(control)),
        );
        assert.strictEqual(partsOf(root, "item-notice").length, 0);
      }),
  );

  it.effect("[Q-11] a single response renders radio buttons sharing one name", () =>
    Effect.gen(function* radios() {
      const root = rootOf(yield* rendered(yield* opened("hottext-single.xml")));
      const controls = partsOf(root, slots.control);

      assert.isAbove(controls.length, 1);
      for (const control of controls) {
        assert.strictEqual(control.attrs["type"], "radio");
        assert.strictEqual(control.attrs["name"], name);
      }

      const many = rootOf(yield* rendered(yield* opened("hottext.xml")));

      for (const control of partsOf(many, slots.control)) {
        assert.strictEqual(control.attrs["type"], "checkbox");
        assert.strictEqual(control.attrs["name"], name);
      }

      const single = yield* opened("hottext.xml", (xml) =>
        xml.replace('max-choices="2"', 'max-choices="1"'),
      );

      for (const control of partsOf(rootOf(yield* rendered(single)), slots.control)) {
        assert.strictEqual(control.attrs["type"], "radio", "max-choices 1 posts one identifier");
      }
    }),
  );

  it.effect("[Q-11] a hottext a template hides keeps its text and has no control", () =>
    Effect.gen(function* hidden() {
      const root = rootOf(yield* rendered(yield* opened("hottext-single.xml")));
      const paragraph = firstTag(partOf(root, slots.content), "p");

      assert.strictEqual(
        textOf(paragraph),
        "At the stall the crates held pears, plums and figs, all picked that week.",
      );
      assert.deepStrictEqual(valuesOf(root), ["PEARS", "PLUMS"]);
      assert.isFalse(
        partsOf(root, slots.choice).some((label) => textOf(label).includes("figs")),
        "the hidden words sit in no label",
      );
      assert.isTrue(roundTrips(root));

      const shown = yield* opened("hottext-single.xml", (xml) =>
        xml.replace(
          "<qti-value>PEARS</qti-value>\n    </qti-default-value>",
          "<qti-value>FIGS</qti-value>\n    </qti-default-value>",
        ),
      );

      assert.deepStrictEqual(valuesOf(rootOf(yield* rendered(shown))), ["PEARS", "PLUMS", "FIGS"]);
    }),
  );

  it.effect(
    "[Q-11] a restored response checks its controls and the solution mode checks the correct ones",
    () =>
      Effect.gen(function* restoring() {
        const accepted = yield* opened("hottext.xml");
        const answer = identifiers("multiple", "LOG", "TEA");
        const stored = yield* Effect.fromResult(score(accepted, { [response]: answer }));
        const restored = yield* Effect.fromResult(restore(accepted, stored));
        const answered = rootOf(yield* rendered(accepted, { values: restored.values }));

        assert.deepStrictEqual(checkedOf(answered), ["LOG", "TEA"]);

        const nothing = rootOf(yield* rendered(accepted));

        assert.deepStrictEqual(checkedOf(nothing), []);

        const correctValues = solution(accepted);

        assert.deepStrictEqual(correctValues, { [response]: correct });

        const solved = rootOf(
          yield* rendered(accepted, { mode: "solution", values: correctValues }),
        );

        assert.deepStrictEqual(checkedOf(solved), ["LAMP", "HORN"]);
        assert.isTrue(
          partsOf(solved, slots.control).every(
            (control) => control.attrs["disabled"] !== undefined,
          ),
          "a solution cannot be changed",
        );
        assert.strictEqual(partOf(solved, slots.root).attrs["data-mode"], "solution");
      }),
  );

  it.effect(
    "[Q-11] postings binds the response as identifier and decode reads the checked controls",
    () =>
      Effect.gen(function* posting() {
        const accepted = yield* opened("hottext.xml");
        const listed = postings(redact(accepted), instance);

        assert.deepStrictEqual(
          listed.map(({ binding, identifier }) => ({ binding, identifier })),
          [
            {
              binding: { baseType: "identifier", cardinality: "multiple", name },
              identifier: response,
            },
          ],
        );

        const [first] = listed;

        if (first === undefined) {
          assert.fail("the item has no posting for its Hot Text");
        }

        assert.deepStrictEqual(
          decode(
            [
              [name, "LAMP"],
              [name, "HORN"],
            ],
            first.binding,
            first.options,
          ),
          Result.succeed(correct),
        );
        assert.deepStrictEqual(
          decode([[name, "NOT AN ID"]], first.binding, first.options),
          Result.fail(new Malformed({ entry: name, reason: "identifier" })),
        );
      }),
  );

  it.effect(
    "[Q-11] checkResponses: above max-choices is refused; below min-choices only under validateResponses",
    () =>
      Effect.gen(function* validating() {
        const accepted = yield* opened("hottext.xml");
        const lenient = yield* configure({});
        const strict = yield* configure({ validateResponses: true });
        const three = identifiers("multiple", "LAMP", "LOG", "HORN");
        const none = identifiers("multiple");

        assert.deepStrictEqual(checkResponses(accepted, { [response]: three }, lenient), [
          { response, text: authorMax },
        ]);
        assert.deepStrictEqual(checkResponses(accepted, { [response]: three }, strict), [
          { response, text: authorMax },
        ]);
        assert.deepStrictEqual(checkResponses(accepted, { [response]: none }, lenient), []);
        assert.deepStrictEqual(checkResponses(accepted, { [response]: none }, strict), [
          { response, text: authorMin },
        ]);
        assert.deepStrictEqual(checkResponses(accepted, {}, strict), [
          { response, text: authorMin },
        ]);
        assert.deepStrictEqual(
          checkResponses(accepted, { [response]: identifiers("multiple", "LAMP", "HORN") }, strict),
          [],
        );

        const plain = yield* opened("hottext.xml", (xml) =>
          xml.replaceAll(/\s+data-m(?:in|ax)-selections-message="[^"]*"/gu, ""),
        );

        assert.deepStrictEqual(checkResponses(plain, { [response]: three }, lenient), [
          { response, text: message("en", "atMost", { n: "2" }) },
        ]);
        assert.deepStrictEqual(checkResponses(plain, { [response]: none }, strict), [
          { response, text: message("en", "atLeast", { n: "1" }) },
        ]);
      }),
  );

  it.effect(
    "[Q-11] checkResponses: an identifier no hottext presents, a repeat and a repeated post are refused",
    () =>
      Effect.gen(function* refusing() {
        const accepted = yield* opened("hottext.xml");
        const configuration = yield* configure({});
        const unknown = { response, text: message("en", "unknownChoice") };

        assert.deepStrictEqual(
          checkResponses(
            accepted,
            { [response]: identifiers("multiple", "LAMP", "NOPE") },
            configuration,
          ),
          [unknown],
        );
        assert.deepStrictEqual(
          checkResponses(
            accepted,
            { [response]: identifiers("multiple", "LAMP", "LAMP") },
            configuration,
          ),
          [unknown],
        );
        assert.deepStrictEqual(
          checkResponses(
            accepted,
            { [response]: new Malformed({ entry: name, reason: "identifier" }) },
            configuration,
          ),
          [unknown],
        );

        const single = yield* opened("hottext-single.xml");

        assert.deepStrictEqual(
          checkResponses(
            single,
            { [response]: new Malformed({ entry: name, reason: "single-many" }) },
            configuration,
          ),
          [{ response, text: message("en", "atMost", { n: "1" }) }],
        );
        assert.deepStrictEqual(
          checkResponses(single, { [response]: identifiers("single", "FIGS") }, configuration),
          [unknown],
          "a hottext the template hides is not presented",
        );
        assert.deepStrictEqual(
          checkResponses(single, { [response]: identifiers("single", "PLUMS") }, configuration),
          [],
        );
      }),
  );

  it.effect(
    "[Q-11] score with the correct identifiers gives the maximum and a wrong one scores below it",
    () =>
      Effect.gen(function* scoring() {
        const accepted = yield* opened("hottext.xml");
        const maximum = yield* scoreAfter(accepted, correct);

        assert.strictEqual(maximum, 1);
        assert.isBelow(
          yield* scoreAfter(accepted, identifiers("multiple", "LAMP", "LOG")),
          maximum,
        );
        assert.isBelow(yield* scoreAfter(accepted, identifiers("multiple", "TEA")), maximum);
        assert.isBelow(yield* scoreAfter(accepted, identifiers("multiple")), maximum);

        const refused = score(accepted, {
          [response]: identifiers("multiple", "LAMP", "LOG", "HORN"),
        });

        assert.deepStrictEqual(
          Result.isFailure(refused) && refused.failure instanceof ResponsesRefused
            ? refused.failure.messages
            : [],
          [{ response, text: authorMax }],
          "score takes only the identifiers the Hot Text accepts, above max-choices refused",
        );
      }),
  );

  it.effect("[Q-11] the group is named by the prompt", () =>
    Effect.gen(function* naming() {
      const root = rootOf(yield* rendered(yield* opened("hottext.xml")));
      const group = partOf(root, slots.root);
      const prompt = partOf(root, slots.prompt);

      assert.strictEqual(group.attrs["role"], "group");
      assert.strictEqual(textOf(prompt), "Select the two duties that keep ships safe in fog.");
      assert.strictEqual(nameOf(group, root), textOf(prompt));
      assert.strictEqual(group.attrs["aria-labelledby"], prompt.attrs["id"]);

      const labelled = rootOf(
        yield* rendered(
          yield* opened("hottext.xml", (xml) =>
            xml
              .replace(/<qti-prompt>[^<]*<\/qti-prompt>/u, "")
              .replace(
                '<qti-hottext-interaction response-identifier="RESPONSE"',
                '<qti-hottext-interaction aria-label="Duties in fog" response-identifier="RESPONSE"',
              ),
          ),
        ),
      );

      assert.strictEqual(partsOf(labelled, slots.prompt).length, 0);
      assert.strictEqual(nameOf(partOf(labelled, slots.root), labelled), "Duties in fog");

      const controls = partsOf(root, slots.control);

      assert.deepStrictEqual(
        controls.map((control) => nameOf(control, root)),
        ["lights the lamp", "writes the log", "sounds the horn", "pours a cup of tea"],
        "each control is named by its hottext's text",
      );
    }),
  );

  it.effect("[Q-11] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* accessible() {
      const many = yield* opened("hottext.xml");
      const single = yield* opened("hottext-single.xml");
      const states = [
        yield* rendered(many),
        yield* rendered(many, { mode: "review", values: { [response]: correct } }),
        yield* rendered(many, { mode: "solution", values: solution(many) }),
        yield* rendered(many, { disabled: true }),
        yield* rendered(many, {
          messages: [{ response, text: authorMax }],
          posted: { [response]: ["LAMP", "LOG", "HORN"] },
        }),
        yield* rendered(single),
        yield* rendered(single, { values: { [response]: identifiers("single", "PLUMS") } }),
      ];

      for (const [index, html] of states.entries()) {
        const root = rootOf(html);

        assert.strictEqual(
          partsOf(root, slots.control).length,
          index < 5 ? 4 : 2,
          `state ${String(index)} holds its controls`,
        );
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), [], `state ${String(index)}`);
        assert.isTrue(roundTrips(root), `state ${String(index)} round-trips`);
      }
    }),
  );

  it.effect("[Q-11] redact's copy holds no correct response", () =>
    Effect.gen(function* redacting() {
      for (const file of ["hottext.xml", "hottext-single.xml"]) {
        const accepted = yield* opened(file);
        const encoded = yield* Effect.fromResult(encodeRedacted(redact(accepted)));
        const written = JSON.stringify(encoded);

        assert.include(written, '"kind":"hottext"', `${file} holds its Hot Text`);
        assert.notMatch(written, /correct/iu, `${file} writes no correct response`);
        assert.notInclude(written, "qti-value");
        assert.notInclude(written, "template-identifier");
        assert.notInclude(written, "show-hide");
        assert.notInclude(written, "OFFER");
        assert.deepStrictEqual(
          encoded.responses.map((binding) => Object.keys(binding).toSorted()),
          [["baseType", "cardinality", "identifier"]],
          `${file} lists the binding alone`,
        );

        const configuration = yield* configure({});
        const again = yield* Effect.fromResult(
          // oxlint-disable-next-line unicorn/prefer-structured-clone -- the round trip is the JSON a host sends to a page, which a structured clone does not take.
          decodeRedacted(JSON.parse(written)),
        );
        const direct = yield* Effect.fromResult(
          render(redact(accepted), configuration, { instance }),
        );
        const viaJson = yield* Effect.fromResult(render(again, configuration, { instance }));

        assert.strictEqual(viaJson.html, direct.html, `${file} renders the same from its JSON`);
      }
    }),
  );

  it.effect(
    "[Q-11] a refused post shows what was posted, marks the controls invalid and focuses the first",
    () =>
      Effect.gen(function* refused() {
        const accepted = yield* opened("hottext.xml");
        const root = rootOf(
          yield* rendered(accepted, {
            messages: [{ response, text: authorMax }],
            posted: { [response]: ["LAMP", "LOG", "HORN"] },
            values: { [response]: identifiers("multiple", "TEA") },
          }),
        );
        const controls = partsOf(root, slots.control);

        assert.deepStrictEqual(checkedOf(root), ["LAMP", "LOG", "HORN"]);
        assert.isTrue(controls.every((control) => control.attrs["aria-invalid"] === "true"));
        assert.isTrue(
          controls.every((control) =>
            String(control.attrs["aria-describedby"]).includes("message"),
          ),
        );
        assert.deepStrictEqual(
          controls.map((control) => control.attrs["autofocus"] !== undefined),
          [true, false, false, false],
        );
      }),
  );

  it.effect(
    "[Q-11] the host's entry name, the finished state and the review state reach the controls",
    () =>
      Effect.gen(function* states() {
        const accepted = yield* opened("hottext.xml");
        const named = rootOf(yield* rendered(accepted, { names: { [response]: "answer-1" } }));

        assert.isTrue(
          partsOf(named, slots.control).every((control) => control.attrs["name"] === "answer-1"),
        );

        const finished = rootOf(yield* rendered(accepted, { disabled: true }));

        assert.isTrue(
          partsOf(finished, slots.control).every((control) => control.attrs["disabled"] === ""),
        );
        assert.strictEqual(partOf(finished, slots.root).attrs["data-disabled"], "");

        const review = rootOf(yield* rendered(accepted, { mode: "review" }));

        assert.isTrue(
          partsOf(review, slots.control).every((control) => control.attrs["disabled"] === ""),
        );
      }),
  );

  it.effect("[Q-11] a host overrides each Hot Text part, and the part table names them", () =>
    Effect.gen(function* overriding() {
      const accepted = yield* opened("hottext.xml");
      const configuration = yield* configure({});
      const root = rootOf(
        yield* rendered(accepted, {
          parts: {
            "hottext-interaction": {
              choice: swap("span"),
              content: swap("section"),
              prompt: swap("p"),
              root: swap("section"),
            },
          },
        }),
      );

      assert.strictEqual(partOf(root, slots.root).tag, "section");
      assert.strictEqual(partOf(root, slots.content).tag, "section");
      assert.strictEqual(partOf(root, slots.prompt).tag, "p");
      assert.isTrue(partsOf(root, slots.choice).every((label) => label.tag === "span"));
      assert.strictEqual(partsOf(root, slots.control).length, 4);

      const unknown = render(redact(accepted), configuration, {
        instance,
        parts: { "hottext-interaction": { gap: swap("span") } },
      });

      assert.isTrue(Result.isFailure(unknown));
      assert.isTrue(
        Result.isFailure(unknown) && unknown.failure instanceof UnknownPart,
        "a part Hot Text has not is refused",
      );
    }),
  );
  it.effect(
    "[Q-11] a replacement of a part cannot change what plate computed there: id, for, name, type, value, checked, disabled and the group's role and name",
    () =>
      Effect.gen(function* owning() {
        const accepted = yield* opened("hottext.xml");
        const root = rootOf(
          yield* rendered(accepted, {
            parts: {
              "hottext-interaction": {
                choice: (_props, children) => h("label", { for: "evil" }, children),
                control: () =>
                  h("input", {
                    checked: true,
                    disabled: true,
                    id: "evil",
                    name: "evil",
                    type: "text",
                    value: "evil",
                  }),
                prompt: (_props, children) => h("qti-prompt", { id: "evil" }, children),
                root: (_props, children) =>
                  h(
                    "qti-hottext-interaction",
                    { "aria-labelledby": "evil", role: "presentation" },
                    children,
                  ),
              },
            },
          }),
        );
        const [first] = partsOf(root, slots.control);
        const [label] = partsOf(root, slots.choice);
        const group = partOf(root, slots.root);

        assert.deepStrictEqual(
          [first?.attrs["id"], first?.attrs["name"], first?.attrs["type"], first?.attrs["value"]],
          [`${instance}-${response}-control-0`, name, "checkbox", "LAMP"],
        );
        assert.isUndefined(first?.attrs["checked"], "a Control plate leaves unchecked stays so");
        assert.isUndefined(first?.attrs["disabled"], "and one plate leaves enabled");
        assert.strictEqual(label?.attrs["for"], `${instance}-${response}-control-0`);
        assert.strictEqual(group.attrs["role"], "group");
        assert.strictEqual(group.attrs["aria-labelledby"], `${instance}-${response}-prompt`);
        assert.strictEqual(
          partOf(root, slots.prompt).attrs["id"],
          `${instance}-${response}-prompt`,
        );
      }),
  );

  it.effect(
    "[Q-11] a hottext the record's template value hides is plain text, posting it is refused, and an item whose template processing runs withholds the choice",
    () =>
      Effect.gen(function* templated() {
        const accepted = yield* accept(drawnItem("TWO"), "fixtures/m3d/items/drawn.xml");
        const configuration = yield* configure({});
        const stored = yield* Effect.fromResult(begin(accepted, { instance, seed: "1" }));
        const { record } = yield* Effect.fromResult(restore(accepted, stored));
        const shown = rootOf(yield* rendered(accepted, {}, record));

        assert.deepStrictEqual(
          valuesOf(shown),
          ["TWO", "THREE"],
          "OFFER names TWO: ONE (show) is hidden, TWO (show) is shown, THREE (hide) is shown",
        );
        assert.strictEqual(
          textOf(firstTag(shown, "p")),
          "Take the first, the second or the third today.",
        );
        assert.deepStrictEqual(
          checkResponses(
            accepted,
            { [response]: identifiers("single", "ONE") },
            configuration,
            record,
          ),
          [{ response, text: message("en", "unknownChoice") }],
        );
        assert.deepStrictEqual(
          checkResponses(
            accepted,
            { [response]: identifiers("single", "TWO") },
            configuration,
            record,
          ),
          [],
        );

        const withheld = rootOf(yield* rendered(accepted));

        assert.deepStrictEqual(valuesOf(withheld), [], "no value, no choice");
        assert.include(textOf(firstTag(withheld, "p")), "the first");
        assert.include(textOf(firstTag(withheld, "p")), "the third");
      }),
  );
});
