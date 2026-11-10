import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  checkResponses,
  configure,
  decode,
  entryName,
  open,
  partition,
  postings,
  redact,
  render,
  restore,
  score,
  solution,
} from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  Element,
  Entry,
  Node,
  Options,
  Redacted,
  Responses,
  StoredRecord,
  Value,
  Verdict,
} from "#plate/index.ts";
import { attribute, checkTree, inputType, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The composite fixture's location as the host names it, its path under the package.
 */
const fixtureLocation = "fixtures/m3e/items/composite.xml";

/**
 * The composite fixture's file, which `open` reads as the host's bytes.
 */
const fixturePath = path.resolve(import.meta.dirname, "..", fixtureLocation);

/**
 * The instance token every render here passes, as an author with a stable token would.
 */
const instance = "q1";

/**
 * What the candidate types in the note, the one response the fixture's processing never reads.
 */
const note = "The trip was short, and the food was good.";

/**
 * The fixture's interactions in document order: the response each binds, the base type that
 * response declares, the `data-slot` of the interaction's Root, and the text a candidate who
 * answers it rightly posts.
 */
const interactions = [
  { baseType: "identifier", posted: "B", response: "COLOUR", slot: "choice-interaction" },
  { baseType: "string", posted: "Lisbon", response: "CITY", slot: "text-entry-interaction" },
  { baseType: "identifier", posted: "PAST", response: "TENSE", slot: "inline-choice-interaction" },
  { baseType: "string", posted: note, response: "NOTE", slot: "extended-text-interaction" },
] as const;

/**
 * The identifier of a response the fixture declares.
 */
type Part = (typeof interactions)[number]["response"];

/**
 * Construct the value of a single response that holds one text.
 *
 * @param baseType The response's base type.
 * @param value The text, a choice's identifier or what was typed.
 * @returns The value.
 */
const given = (baseType: "identifier" | "string", value: string): Value => ({
  baseType,
  cardinality: "single",
  values: [{ baseType, value }],
});

/**
 * Construct the NULL value of a single response.
 *
 * @param baseType The response's base type.
 * @returns The value, which holds no text.
 */
const absent = (baseType: "identifier" | "string"): Value => ({
  baseType,
  cardinality: "single",
  values: [],
});

/**
 * The responses that answer every scored part rightly and fill the note.
 */
const allRight: Readonly<Record<Part, Value>> = {
  CITY: given("string", "Lisbon"),
  COLOUR: given("identifier", "B"),
  NOTE: given("string", note),
  TENSE: given("identifier", "PAST"),
};

/**
 * The responses that answer every scored part wrongly and fill the note.
 */
const allWrong: Readonly<Record<Part, Value>> = {
  CITY: given("string", "Porto"),
  COLOUR: given("identifier", "A"),
  NOTE: given("string", note),
  TENSE: given("identifier", "PRESENT"),
};

/**
 * Unwrap a result the test requires to succeed.
 *
 * @param result The result.
 * @param what What produced it, for the failure's message.
 * @returns Its success.
 */
const ok = <A, E extends Error>(result: Result.Result<A, E>, what: string): A =>
  Result.getOrElse(result, (failure) => assert.fail(`${what}: ${failure.message}`));

/**
 * Open the composite fixture as a host opens a document it read from storage.
 *
 * @returns The verdict on the fixture.
 */
const openFixture = Effect.fnUntraced(function* openFixture() {
  const bytes = yield* Effect.tryPromise(() => readFile(fixturePath));

  return yield* open(fixtureLocation, bytes);
});

/**
 * Open the composite fixture and take the item its verdict accepts.
 *
 * @returns The accepted item.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  const verdict: Verdict = yield* openFixture();

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${fixtureLocation} is ${verdict.verdict}, not accepted`),
  );
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
 * Select the elements whose part marker ends with a part's suffix.
 *
 * @param elements The elements.
 * @param suffix The marker's end, such as `-control`.
 * @returns The elements marked with it, in order.
 */
const slotted = (elements: readonly Element[], suffix: string): readonly Element[] =>
  elements.filter((element) => attribute(element, "data-slot")?.endsWith(suffix) === true);

/**
 * Find the one element marked with a part, failing the test when there is none or several.
 *
 * @param elements The elements.
 * @param slot The part's whole `data-slot` marker.
 * @returns The element.
 */
const only = (elements: readonly Element[], slot: string): Element => {
  const [found, ...rest] = elements.filter((element) => attribute(element, "data-slot") === slot);
  assert.lengthOf(rest, 0, `${slot} marks one element`);

  return found ?? assert.fail(`${slot} marks no element`);
};

/**
 * Tell whether a control takes no input: a control is `disabled`, or, when it holds typed text, may
 * instead be `readonly`, which a radio or a select ignores.
 *
 * @param control The control's element.
 * @returns Whether the candidate cannot change it.
 */
const isLocked = (control: Element): boolean =>
  attribute(control, "disabled") !== undefined ||
  (attribute(control, "readonly") !== undefined &&
    (control.tag === "textarea" || (control.tag === "input" && inputType(control) === "text")));

/**
 * Give the entry names an element and its descendants post under, each once.
 *
 * @param element The element.
 * @returns The distinct `name` attributes, in document order.
 */
const namesIn = (element: Element): readonly string[] => [
  ...new Set(
    elementsOf([element]).flatMap((named) => {
      const name = attribute(named, "name");

      return name === undefined ? [] : [name];
    }),
  ),
];

/**
 * Render the composite fixture and parse its HTML.
 *
 * @param options The author's options for the render.
 * @returns The root element of the render.
 */
const renderFixture = Effect.fnUntraced(function* renderFixture(options: Options) {
  const accepted = yield* acceptFixture();
  const configuration: Configuration = yield* configure({});
  const { html } = yield* Effect.fromResult(render(redact(accepted), configuration, options));

  return rootOf(html);
});

/**
 * Post entries through a `FormData` as a browser posts a native form, and read them back as the
 * entries a handler holds.
 *
 * @param pairs The entries by name and text, in order.
 * @returns The form's entries.
 */
const formEntries = (pairs: readonly (readonly [string, string])[]): readonly Entry[] => {
  const form = new FormData();
  for (const [name, value] of pairs) {
    form.append(name, value);
  }

  return [...form];
};

/**
 * Decode every response the item posts from the entries a form carried, each under its posting's
 * base, as a host does.
 *
 * @param redacted The redacted item.
 * @param entries The posted entries.
 * @returns Each posted response's value, by identifier.
 */
const decodeAll = (redacted: Redacted, entries: readonly Entry[]): Responses => {
  const { own } = partition(entries, instance);

  return Object.fromEntries(
    postings(redacted, instance).map(({ binding, identifier, options }) => [
      identifier,
      ok(decode(own, binding, options), `decode ${identifier}`),
    ]),
  );
};

/**
 * Give the values a stored record holds for its `SCORE`.
 *
 * @param record The record `score` stored.
 * @returns The values of `SCORE`; none when it is NULL.
 */
const scoreOf = (record: StoredRecord): readonly unknown[] =>
  record.outcomes["SCORE"]?.values.map((single) => single.value) ?? [];

/**
 * Score responses against the fixture, a first attempt with no record.
 *
 * @param accepted The accepted fixture.
 * @param responses The candidate's responses.
 * @returns The stored record the attempt leaves.
 */
const scored = (accepted: Accepted, responses: Responses): StoredRecord =>
  ok(score(accepted, responses), "score");

/**
 * Write an item document of the composite shape that the refusal pins break: the response
 * declarations the body binds, and the body's interactions.
 *
 * @param declarations Each response declared as a single, by identifier and base type.
 * @param markup The item body's markup.
 * @returns The document's bytes.
 */
const documentOf = (
  declarations: readonly (readonly [identifier: string, baseType: string])[],
  markup: string,
): Uint8Array =>
  new TextEncoder().encode(
    `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="m3e-refused" title="Refused" adaptive="false" time-dependent="false">
${declarations
  .map(
    ([identifier, baseType]) =>
      `<qti-response-declaration identifier="${identifier}" cardinality="single" base-type="${baseType}"/>`,
  )
  .join("\n")}
<qti-item-body>${markup}</qti-item-body>
</qti-assessment-item>`,
  );

/**
 * Open a document the test wrote and reduce what its verdict refuses to what a pin asserts.
 *
 * @param bytes The document's bytes.
 * @returns The verdict's name and each refusal's rule, path and detail, in the order given.
 */
const refusalsOf = Effect.fnUntraced(function* refusalsOf(bytes: Uint8Array) {
  const verdict = yield* open("composite-refused.xml", bytes);

  return {
    refusals:
      verdict.verdict === "refused"
        ? verdict.refusals.map((refusal) => ({
            detail: refusal.detail,
            path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
            rule: refusal.rule,
          }))
        : [],
    verdict: verdict.verdict,
  };
});

/**
 * The path of the item body in a document of {@link documentOf}.
 */
const bodyPath = "qti-assessment-item/qti-item-body";

describe("a composite item: one body, four interactions of four kinds, four responses", () => {
  describe("open and render", () => {
    it.effect("[I-17] open accepts the composite fixture with no unsupported feature", () =>
      Effect.gen(function* accepts() {
        const verdict = yield* openFixture();
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`${fixtureLocation} is ${verdict.verdict}, not accepted`),
        );

        assert.strictEqual(verdict.verdict, "accepted");
        assert.deepStrictEqual(accepted.unsupported, []);
      }),
    );

    it.effect("[I-17] render emits each interaction's root once, in document order", () =>
      Effect.gen(function* roots() {
        const root = yield* renderFixture({ instance });
        const slots = slotted(elementsOf([root]), "-interaction").map((element) =>
          attribute(element, "data-slot"),
        );

        assert.deepStrictEqual(
          slots,
          interactions.map(({ slot }) => slot),
        );
      }),
    );

    it.effect(
      "[I-17] each interaction's controls post under their own response's entry name only",
      () =>
        Effect.gen(function* names() {
          const root = yield* renderFixture({ instance });
          const elements = elementsOf([root]);
          const roots = slotted(elements, "-interaction");
          const named = elements.filter((element) => attribute(element, "name") !== undefined);
          const own = interactions.map(({ response }) => entryName(instance, response));

          assert.deepStrictEqual(
            roots.map(namesIn),
            own.map((name) => [name]),
            "each interaction root holds the controls of its own response alone",
          );
          assert.deepStrictEqual(
            [...new Set(named.map((element) => attribute(element, "name")))],
            own,
            "every name in the HTML is one of the four entry names",
          );
          assert.strictEqual(
            roots.flatMap((interaction) =>
              elementsOf([interaction]).filter(
                (element) => attribute(element, "name") !== undefined,
              ),
            ).length,
            named.length,
            "no named control sits outside an interaction root",
          );
          for (const name of own) {
            assert.strictEqual(
              roots.filter((interaction) => namesIn(interaction).includes(name)).length,
              1,
              `${name} is carried by one interaction root`,
            );
          }
        }),
    );

    it.effect(
      "[I-17] the rendered item passes checkTree, its ids are unique, and its HTML round-trips",
      () =>
        Effect.gen(function* tree() {
          const root = yield* renderFixture({ instance });
          const ids = elementsOf([root]).flatMap((element) => {
            const id = attribute(element, "id");

            return id === undefined ? [] : [id];
          });
          const repeated = ids.filter((id, index) => ids.indexOf(id) !== index);

          assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
          assert.isAbove(ids.length, 0, "the render has ids to compare");
          assert.deepStrictEqual(repeated, [], "no id repeats");
          assert.isTrue(roundTrips(root), "the HTML round-trips");
        }),
    );

    it.effect("[I-17] the item holds one item live region however many interactions it holds", () =>
      Effect.gen(function* live() {
        const root = yield* renderFixture({ instance });
        const elements = elementsOf([root]);

        assert.lengthOf(slotted(elements, "-interaction"), 4);
        assert.lengthOf(
          elements.filter((element) => attribute(element, "data-slot") === "item-live"),
          1,
        );
      }),
    );
  });

  describe("post and decode", () => {
    it.effect(
      "[I-17] postings lists the four responses once each, with their declared base type and cardinality",
      () =>
        Effect.gen(function* listed() {
          const accepted = yield* acceptFixture();
          const listing = postings(redact(accepted), instance).map(({ binding, identifier }) => ({
            baseType: "baseType" in binding ? binding.baseType : binding.cardinality,
            cardinality: binding.cardinality,
            identifier,
            name: binding.name,
          }));

          assert.deepStrictEqual(
            listing,
            interactions.map(({ baseType, response }) => ({
              baseType,
              cardinality: "single",
              identifier: response,
              name: entryName(instance, response),
            })),
          );
        }),
    );

    it.effect(
      "[I-17] decode reads each posted response apart, and an entry of one never fills another",
      () =>
        Effect.gen(function* decoded() {
          const redacted = redact(yield* acceptFixture());
          const everything = formEntries(
            interactions.map(({ posted, response }) => [entryName(instance, response), posted]),
          );

          assert.deepStrictEqual(decodeAll(redacted, everything), allRight);

          for (const { baseType, posted, response } of interactions) {
            assert.deepStrictEqual(
              decodeAll(redacted, formEntries([[entryName(instance, response), posted]])),
              Object.fromEntries(
                interactions.map((other) => [
                  other.response,
                  other.response === response ? given(baseType, posted) : absent(other.baseType),
                ]),
              ),
              `only ${response} is posted, so only ${response} is filled`,
            );
          }
        }),
    );
  });

  describe("validate, score, solve and review", () => {
    it.effect("[I-17] checkResponses judges each interaction alone", () =>
      Effect.gen(function* judged() {
        const accepted = yield* acceptFixture();
        const validating: Configuration = yield* configure({ validateResponses: true });
        const messagesFor = (responses: Responses) =>
          checkResponses(accepted, responses, validating);
        const emptyColour = messagesFor({ ...allRight, COLOUR: absent("identifier") });

        assert.isNotEmpty(emptyColour, "an empty Choice with min-choices 1 is refused");
        assert.deepStrictEqual(
          [...new Set(emptyColour.map(({ response }) => response))],
          ["COLOUR"],
          "its messages name COLOUR alone, though CITY is filled",
        );
        assert.deepStrictEqual(
          messagesFor({
            CITY: absent("string"),
            COLOUR: given("identifier", "B"),
            NOTE: absent("string"),
            TENSE: absent("identifier"),
          }),
          [],
          "an empty CITY, TENSE or NOTE has no limit to break, so COLOUR filled leaves nothing to refuse",
        );
        assert.deepStrictEqual(messagesFor(allRight), [], "four valid responses give no message");
      }),
    );

    it.effect(
      "[I-17] score adds one per correct part: 3 for all correct, 2 with one wrong, 0 for none",
      () =>
        Effect.gen(function* scores() {
          const accepted = yield* acceptFixture();
          const scoredParts = ["COLOUR", "CITY", "TENSE"] as const;

          assert.deepStrictEqual(scoreOf(scored(accepted, allRight)), [3], "all correct");
          for (const wrong of scoredParts) {
            assert.deepStrictEqual(
              scoreOf(scored(accepted, { ...allRight, [wrong]: allWrong[wrong] })),
              [2],
              `${wrong} wrong, the other two right`,
            );
          }

          assert.deepStrictEqual(scoreOf(scored(accepted, allWrong)), [0], "none correct");
          assert.deepStrictEqual(
            scoreOf(scored(accepted, { ...allWrong, NOTE: absent("string") })),
            [0],
            "none correct, no note",
          );
          assert.deepStrictEqual(
            scoreOf(scored(accepted, { ...allRight, NOTE: absent("string") })),
            [3],
            "the note's absence takes nothing from the sum",
          );
          assert.deepStrictEqual(
            scored(accepted, allRight).outcomes["MAXSCORE"]?.values.map((single) => single.value),
            [3],
            "MAXSCORE stays its default",
          );
        }),
    );

    it.effect("[I-17] solution gives each scored response its correct value and NOTE none", () =>
      Effect.gen(function* solving() {
        const accepted = yield* acceptFixture();

        assert.deepStrictEqual(solution(accepted), {
          CITY: given("string", "Lisbon"),
          COLOUR: given("identifier", "B"),
          NOTE: absent("string"),
          TENSE: given("identifier", "PAST"),
        });
      }),
    );

    it.effect(
      "[I-17] restore after score renders every part's response in review mode with every control disabled or read-only",
      () =>
        Effect.gen(function* reviewed() {
          const accepted = yield* acceptFixture();
          const stored = scored(accepted, allRight);
          const { values } = ok(restore(accepted, stored), "restore");
          const root = yield* renderFixture({ instance, mode: "review", values });
          const elements = elementsOf([root]);
          const controls = slotted(elements, "-control");
          const radios = controls.filter(
            (control) => control.tag === "input" && inputType(control) === "radio",
          );
          const text = only(controls, "text-entry-interaction-control");
          const select = only(controls, "inline-choice-interaction-control");
          const area = only(controls, "extended-text-interaction-control");

          assert.deepStrictEqual(values, allRight, "restore gives back each part's response");
          assert.deepStrictEqual(
            slotted(elements, "-interaction").map((element) => attribute(element, "data-mode")),
            ["review", "review", "review", "review"],
          );
          assert.lengthOf(controls, 6, "three radios, a text input, a select and a textarea");
          for (const control of controls) {
            assert.isTrue(
              isLocked(control),
              `${attribute(control, "name") ?? ""} takes no input in review`,
            );
          }

          assert.deepStrictEqual(
            radios.map((radio) => [
              attribute(radio, "value"),
              attribute(radio, "checked") !== undefined,
            ]),
            [
              ["A", false],
              ["B", true],
              ["C", false],
            ],
            "COLOUR shows B",
          );
          assert.strictEqual(attribute(text, "value"), "Lisbon", "CITY shows Lisbon");
          assert.deepStrictEqual(
            elementsOf(select.children)
              .filter((option) => attribute(option, "selected") !== undefined)
              .map((option) => attribute(option, "value")),
            ["PAST"],
            "TENSE shows PAST",
          );
          assert.strictEqual(textOf(area), note, "NOTE shows the note");
          assert.deepStrictEqual(
            checkTree(root, { baseLevel: 2 }),
            [],
            "the review passes checkTree",
          );
        }),
    );
  });

  describe("refusals", () => {
    it.effect("[I-17] open refuses a composite item whose two interactions bind one response", () =>
      Effect.gen(function* boundTwice() {
        const { refusals, verdict } = yield* refusalsOf(
          documentOf(
            [
              ["COLOUR", "identifier"],
              ["CITY", "string"],
            ],
            `<qti-choice-interaction response-identifier="COLOUR" max-choices="1">
  <qti-simple-choice identifier="A">Red</qti-simple-choice>
  <qti-simple-choice identifier="B">Blue</qti-simple-choice>
</qti-choice-interaction>
<p>The capital of Portugal is <qti-text-entry-interaction response-identifier="CITY"/>.</p>
<qti-extended-text-interaction response-identifier="CITY"/>`,
          ),
        );

        assert.strictEqual(verdict, "refused");
        assert.deepStrictEqual(refusals, [
          {
            detail: {
              attribute: "response-identifier",
              check: "bound-once",
              interaction: "qti-extended-text-interaction",
              reading: "92",
              response: "CITY",
            },
            path: `${bodyPath}/qti-extended-text-interaction/@response-identifier`,
            rule: "binding",
          },
        ]);
      }),
    );

    it.effect(
      "[I-17] open refuses a composite item whose two Choices share a choice identifier",
      () =>
        Effect.gen(function* sharedChoice() {
          const { refusals, verdict } = yield* refusalsOf(
            documentOf(
              [
                ["COLOUR", "identifier"],
                ["SHAPE", "identifier"],
                ["CITY", "string"],
              ],
              `<qti-choice-interaction response-identifier="COLOUR" max-choices="1">
  <qti-simple-choice identifier="A">Red</qti-simple-choice>
  <qti-simple-choice identifier="B">Blue</qti-simple-choice>
</qti-choice-interaction>
<qti-choice-interaction response-identifier="SHAPE" max-choices="1">
  <qti-simple-choice identifier="C">Circle</qti-simple-choice>
  <qti-simple-choice identifier="A">Square</qti-simple-choice>
</qti-choice-interaction>
<p>The capital of Portugal is <qti-text-entry-interaction response-identifier="CITY"/>.</p>`,
            ),
          );

          assert.strictEqual(verdict, "refused");
          assert.deepStrictEqual(refusals, [
            {
              detail: { class: "qti-simple-choice", identifier: "A", reading: "104" },
              path: `${bodyPath}/qti-choice-interaction[2]/qti-simple-choice[2]/@identifier`,
              rule: "duplicate-identifier",
            },
          ]);
        }),
    );
  });
});
