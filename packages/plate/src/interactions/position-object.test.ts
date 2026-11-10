import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import {
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
import type {
  Accepted,
  Element,
  Node,
  Options,
  Redacted,
  RedactedJson,
  Value,
} from "#plate/index.ts";
import { partForSlot } from "#plate/emit/parts.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { positionObjectModule } from "#plate/interactions/position-object.ts";
import type { PositionObjectInteraction } from "#plate/interactions/position-object.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { Single } from "#plate/model/values.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The instance every render here passes, so the entry names and every id are fixed.
 */
const instance = "q1";

/**
 * The entry name the first interaction's inputs extend, `RESPONSE`, a `single` point.
 */
const single = entryName(instance, "RESPONSE");

/**
 * The entry name the second interaction's inputs extend, `PINS`, a `multiple` point.
 */
const multiple = entryName(instance, "PINS");

/**
 * The fixture folder of area `ei`, beside the package's `src`.
 */
const fixtureFolder = path.resolve(import.meta.dirname, "..", "..", "fixtures", "ei", "items");

/**
 * The marker prefix of every Position Object part, read through the part table's `slotFor` rule.
 */
const owner = "position-object-interaction";

/**
 * The fixture every test opens.
 */
const file = "position-object.xml";

/**
 * Read a fixture item as text.
 *
 * @param name The fixture's file name under `fixtures/ei/items`.
 * @returns The item's text.
 */
const textOfFixture = (name: string) =>
  Effect.tryPromise(() => readFile(path.join(fixtureFolder, name), "utf-8"));

/**
 * Open item text as a host opens a document it read from storage, and accept it.
 *
 * @param name The item's name, which the verdict carries as its location.
 * @param text The item's text.
 * @returns The accepted item, or a failed assertion naming the verdict.
 */
const accept = Effect.fnUntraced(function* accept(name: string, text: string) {
  const verdict = yield* open(`fixtures/ei/items/${name}`, new TextEncoder().encode(text));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${name} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open the fixture and accept it, with text edits applied first.
 *
 * @param edits Each `[from, to]` replaces one occurrence of `from` in the text.
 * @returns The accepted item.
 */
const fixture = Effect.fnUntraced(function* fixture(
  edits: readonly (readonly [string, string])[] = [],
) {
  let text = yield* textOfFixture(file);
  for (const [from, to] of edits) {
    assert.include(text, from, `${file} holds ${from}`);
    text = text.replace(from, to);
  }

  return yield* accept(file, text);
});

/**
 * Construct one point.
 *
 * @param x The horizontal coordinate.
 * @param y The vertical coordinate.
 * @returns The point.
 */
const point = (x: number, y: number): Single => ({
  baseType: "point",
  value: [BigInt(x), BigInt(y)],
});

/**
 * Construct a point value of one cardinality.
 *
 * @param cardinality The value's cardinality.
 * @param points The points, in order.
 * @returns The value.
 */
const pointsOf = (cardinality: "multiple" | "single", ...points: readonly Single[]): Value => ({
  baseType: "point",
  cardinality,
  values: points,
});

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Select the elements one part marks, in document order.
 *
 * @param root The tree's root.
 * @param part The part's marker suffix, empty for the Root.
 * @returns The elements carrying `position-object-interaction<part>`.
 */
const parts = (root: Element, part: string): readonly Element[] =>
  elementsOf([root]).filter((element) => element.attrs["data-slot"] === `${owner}${part}`);

/**
 * Read an attribute as a string.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, the empty string for a bare attribute, `undefined` when absent.
 */
const attr = (element: Element, name: string): string | undefined => {
  const value = element.attrs[name];

  return value === true ? "" : value;
};

/**
 * Render an accepted item and parse its HTML.
 *
 * @param accepted The accepted item.
 * @param options The render's options, the fixed instance by default.
 * @param configuration The configuration's inputs, none by default.
 * @returns The root element, the stage, the two interaction Roots and the HTML as written.
 */
const rendered = Effect.fnUntraced(function* rendered(
  accepted: Accepted,
  options: Options = {},
  configuration: { readonly validateResponses?: boolean } = {},
) {
  const configured = yield* configure(configuration);
  const page = yield* Effect.fromResult(
    render(redact(accepted), configured, { instance, ...options }),
  );
  const [root, ...rest] = parseHtml(page.html);
  assert.lengthOf(rest, 0, "one root");
  if (root?.kind !== "element") {
    return assert.fail("the root is not an element");
  }

  const [stage = assert.fail("the page holds no stage")] = parts(root, "-stage");
  const [first = assert.fail("no first Root"), second = assert.fail("no second Root")] = parts(
    root,
    "",
  );

  return { first, html: page.html, root, second, stage };
});

/**
 * Write a value or a redacted item as JSON, a bigint as its digits.
 *
 * @param value The value.
 * @returns Its JSON text.
 */
const json = (value: Redacted | RedactedJson): string =>
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- `JSON.stringify` hands its replacer every value, of any type; it only looks for a bigint.
  JSON.stringify(value, (_key, field: unknown) =>
    Predicate.isBigInt(field) ? String(field) : field,
  );

/**
 * Read the values the x and y inputs of a Root show, one pair per position in order.
 *
 * @param root An interaction's Root.
 * @returns Each position's `[x, y]`, an absent `value` as `undefined`.
 */
const inputsOf = (root: Element): readonly (readonly [string | undefined, string | undefined])[] =>
  parts(root, "-point").map((group) => [
    attr(parts(group, "-x")[0] ?? assert.fail("a position without x"), "value"),
    attr(parts(group, "-y")[0] ?? assert.fail("a position without y"), "value"),
  ]);

/**
 * Read the markers a Root draws, each by its placing attributes.
 *
 * @param root An interaction's Root.
 * @returns Each marker's tag and attributes, in order.
 */
const markersOf = (root: Element) =>
  parts(root, "-marker").map((marker) => ({
    attrs: Object.fromEntries(
      Object.entries(marker.attrs).map(([name, value]) => [name, String(value)]),
    ),
    tag: marker.tag,
  }));

/**
 * Give the model node of the fixture's interaction that binds a response.
 *
 * @param accepted The accepted item.
 * @param response The response identifier.
 * @returns The node.
 */
const nodeOf = (accepted: Accepted, response: string): PositionObjectInteraction => {
  const found = interactionsIn(accepted.item.body).find(
    (interaction): interaction is PositionObjectInteraction =>
      interaction.kind === "position-object" && interaction.response === response,
  );

  return found ?? assert.fail(`no position-object node binds ${response}`);
};

describe("[Q-17] Position Object", () => {
  it.effect(
    "[Q-17] open accepts the fixture: its body holds one container node of this module around the stage image and the two interactions, and its verdict lists no unsupported part",
    () =>
      Effect.gen(function* opens() {
        const accepted = yield* fixture();
        const container = accepted.item.body.find((node) => node.kind === "container");

        assert.deepStrictEqual(accepted.unsupported, []);
        if (container?.kind !== "container") {
          assert.fail("the body holds no container");
        }

        assert.strictEqual(container.module, "position-object");
        assert.strictEqual(
          container.path,
          "qti-assessment-item/qti-item-body/qti-position-object-stage",
        );
        assert.deepStrictEqual(
          container.children
            .filter((child) => child.kind !== "text")
            .map((child) => (child.kind === "element" ? `element:${child.tag}` : child.kind)),
          ["element:img", "position-object", "position-object"],
        );
        assert.deepStrictEqual(
          interactionsIn(accepted.item.body).map((interaction) => interaction.response),
          ["RESPONSE", "PINS"],
        );
      }),
  );

  it.effect(
    "[Q-17] render emits the stage once around both interactions, the stage image inside it, and each interaction's object and inputs",
    () =>
      Effect.gen(function* emits() {
        const page = yield* rendered(yield* fixture());
        const stages = parts(page.root, "-stage");
        const stageImages = page.stage.children.filter(
          (child): child is Element => child.kind === "element" && child.tag === "img",
        );

        assert.lengthOf(stages, 1);
        assert.strictEqual(page.stage.tag, "qti-position-object-stage");
        assert.lengthOf(stageImages, 1);
        assert.strictEqual(
          attr(stageImages[0] ?? page.stage, "src"),
          "images/position-object-stage.svg",
        );
        assert.lengthOf(parts(page.root, ""), 2);
        assert.isTrue(
          parts(page.root, "").every((root) => elementsOf([page.stage]).includes(root)),
          "the Roots stand inside the stage",
        );
        assert.lengthOf(parts(page.first, "-object"), 1);
        assert.lengthOf(parts(page.second, "-object"), 1);
        assert.strictEqual(
          attr(
            elementsOf(parts(page.first, "-object")).find((element) => element.tag === "img") ??
              page.first,
            "alt",
          ),
          "The fountain",
        );
        assert.lengthOf(parts(page.first, "-point"), 1);
        assert.lengthOf(parts(page.second, "-point"), 2);
        assert.lengthOf(parts(page.first, "-x"), 1);
        assert.lengthOf(parts(page.second, "-y"), 2);
        assert.isFalse(page.html.includes("Not supported here"), "no notice");
        for (const slot of [
          "",
          "-stage",
          "-object",
          "-markers",
          "-marker",
          "-points",
          "-point",
          "-x",
          "-y",
        ]) {
          assert.isTrue(
            Option.exists(partForSlot(`${owner}${slot}`), (part) => part.interaction === owner),
            `${owner}${slot} is a part`,
          );
        }
      }),
  );

  it.effect(
    "[Q-17] the inputs are bounded by the stage's size and named by interaction, position and axis",
    () =>
      Effect.gen(function* bounded() {
        const page = yield* rendered(yield* fixture());
        const xs = parts(page.root, "-x");
        const ys = parts(page.root, "-y");

        assert.lengthOf(xs, 3);
        assert.lengthOf(ys, 3);
        for (const input of [...xs, ...ys]) {
          assert.strictEqual(input.tag, "input");
          assert.strictEqual(attr(input, "type"), "number");
          assert.strictEqual(attr(input, "min"), "0");
          assert.strictEqual(attr(input, "step"), "1");
        }

        assert.deepStrictEqual(
          xs.map((input) => attr(input, "max")),
          ["500", "500", "500"],
        );
        assert.deepStrictEqual(
          ys.map((input) => attr(input, "max")),
          ["300", "300", "300"],
        );
        assert.deepStrictEqual(
          xs.map((input) => attr(input, "name")),
          [`${single}.x`, `${multiple}.x`, `${multiple}.x`],
        );
        assert.deepStrictEqual(
          ys.map((input) => attr(input, "name")),
          [`${single}.y`, `${multiple}.y`, `${multiple}.y`],
        );
        assert.strictEqual(attr(page.first, "data-entry-name"), single);
        assert.strictEqual(attr(page.second, "data-entry-name"), multiple);
        assert.deepStrictEqual(
          parts(page.second, "-point")
            .map((group) =>
              group.children.find((child) => child.kind === "element" && child.tag === "legend"),
            )
            .map((legend) => (legend?.kind === "element" ? legend.children : [])),
          [[{ kind: "text", text: "Position 1" }], [{ kind: "text", text: "Position 2" }]],
        );
        assert.include(attr(xs[0] ?? page.first, "aria-label") ?? "", "500");
        assert.include(attr(ys[0] ?? page.first, "aria-label") ?? "", "300");
      }),
  );

  it.effect(
    "[Q-17] the effective centre point is carried on the root, and the stage's size on the stage",
    () =>
      Effect.gen(function* centre() {
        const page = yield* rendered(yield* fixture());

        assert.strictEqual(attr(page.first, "data-center-point"), "10 20");
        assert.strictEqual(attr(page.second, "data-center-point"), "20 20");
        assert.strictEqual(attr(page.first, "data-max-choices"), "1");
        assert.strictEqual(attr(page.second, "data-max-choices"), "2");
        assert.strictEqual(attr(page.stage, "data-width"), "500");
        assert.strictEqual(attr(page.stage, "data-height"), "300");
        assert.strictEqual(attr(page.first, "data-mode"), "answering");
        assert.strictEqual(attr(page.first, "role"), "group");
      }),
  );

  it.effect(
    "[Q-17] a restored response fills the inputs and draws the object at each position",
    () =>
      Effect.gen(function* restored() {
        const accepted = yield* fixture();
        const configured = yield* configure({});
        const record = yield* Effect.fromResult(
          score(accepted, {
            PINS: pointsOf("multiple", point(100, 100), point(400, 200)),
            RESPONSE: pointsOf("single", point(250, 150)),
          }),
        );
        const stored = yield* Effect.fromResult(restore(accepted, record));
        const page = yield* Effect.fromResult(
          render(redact(accepted, stored.record, configured), configured, {
            instance,
            values: stored.values,
          }),
        );
        const [root] = parseHtml(page.html);
        const tree = root?.kind === "element" ? root : assert.fail("no root");
        const [first = assert.fail("no first"), second = assert.fail("no second")] = parts(
          tree,
          "",
        );

        assert.deepStrictEqual(stored.values["RESPONSE"], pointsOf("single", point(250, 150)));
        assert.deepStrictEqual(inputsOf(first), [["250", "150"]]);
        assert.deepStrictEqual(inputsOf(second), [
          ["100", "100"],
          ["400", "200"],
        ]);
        // The object's centre point, 10 20, lands at 250 150: the image's corner is at 240 130.
        assert.deepStrictEqual(markersOf(first), [
          {
            attrs: {
              "data-position": "1",
              "data-slot": `${owner}-marker`,
              height: "40",
              href: "images/position-object-token.svg",
              width: "40",
              x: "240",
              y: "130",
            },
            tag: "image",
          },
        ]);
        assert.deepStrictEqual(
          markersOf(second).map(({ attrs }) => [attrs["x"], attrs["y"]]),
          [
            ["80", "80"],
            ["380", "180"],
          ],
        );
        for (const svg of parts(tree, "-markers")) {
          assert.strictEqual(svg.tag, "svg");
          assert.strictEqual(attr(svg, "viewBox"), "0 0 500 300");
          assert.strictEqual(attr(svg, "aria-hidden"), "true");
        }

        assert.lengthOf(parts(tree, "-markers"), 2);
        assert.isTrue(
          parts(tree, "-marker").every((marker) =>
            parts(tree, "-markers").some((svg) => elementsOf([svg]).includes(marker)),
          ),
          "every marker lies inside a markers svg",
        );
        assert.deepStrictEqual(checkTree(tree, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-17] a refused post's strings fill the inputs in posted order, x then y per value (posted handed to render: the hosts collect no point strings until W0-POSTED-POINT)",
    () =>
      Effect.gen(function* posted() {
        const page = yield* rendered(yield* fixture(), {
          messages: [{ response: "RESPONSE", text: "Place the fountain on the plan." }],
          posted: { PINS: ["30", "40", "70"], RESPONSE: ["10", "20"] },
          values: { RESPONSE: pointsOf("single", point(250, 150)) },
        });
        const [x = assert.fail("no x")] = parts(page.first, "-x");

        assert.deepStrictEqual(inputsOf(page.first), [["10", "20"]]);
        assert.deepStrictEqual(inputsOf(page.second), [
          ["30", "40"],
          ["70", undefined],
        ]);
        assert.strictEqual(attr(x, "aria-invalid"), "true");
        assert.strictEqual(attr(x, "aria-describedby"), "q1-RESPONSE-message-0");
        assert.strictEqual(attr(x, "autofocus"), "");
        assert.lengthOf(markersOf(page.first), 1);
        assert.deepStrictEqual(
          markersOf(page.second).map(({ attrs }) => attrs["data-position"]),
          ["1"],
          "a position with one coordinate draws no marker",
        );
      }),
  );

  it.effect("[Q-17] the areas of the mapping are never rendered", () =>
    Effect.gen(function* hidden() {
      const page = yield* rendered(yield* fixture(), {
        values: { RESPONSE: pointsOf("single", point(250, 150)) },
      });

      for (const fragment of ["250,150,40", "100,100,30", "400,200,30", "mapped-value", "circle"]) {
        assert.notInclude(page.html, fragment);
      }

      assert.isTrue(
        elementsOf([page.root]).every(
          (element) => !["circle", "ellipse", "polygon", "rect"].includes(element.tag),
        ),
        "no shape element is drawn",
      );
    }),
  );

  it.effect(
    "[Q-17] postings binds each response as a point and decode reads the posted points",
    () =>
      Effect.gen(function* binds() {
        const accepted = yield* fixture();
        const bound = postings(redact(accepted), instance);

        assert.deepStrictEqual(
          bound.map((posting) => [posting.identifier, posting.binding]),
          [
            ["RESPONSE", { baseType: "point", cardinality: "single", name: single }],
            ["PINS", { baseType: "point", cardinality: "multiple", name: multiple }],
          ],
        );

        const [first = assert.fail("no first posting"), second = assert.fail("no second")] = bound;
        const one = yield* Effect.fromResult(
          decode(
            [
              [`${single}.x`, "250"],
              [`${single}.y`, "150"],
            ],
            first.binding,
            first.options,
          ),
        );
        const many = yield* Effect.fromResult(
          decode(
            [
              [`${multiple}.x`, "100"],
              [`${multiple}.y`, "100"],
              [`${multiple}.x`, "400"],
              [`${multiple}.y`, "200"],
            ],
            second.binding,
            second.options,
          ),
        );

        assert.deepStrictEqual(one, pointsOf("single", point(250, 150)));
        assert.deepStrictEqual(many, pointsOf("multiple", point(100, 100), point(400, 200)));
      }),
  );

  it.effect(
    "[Q-17] a position with x filled and y empty is Malformed, and validate reports it in tier (a)",
    () =>
      Effect.gen(function* malformed() {
        const accepted = yield* fixture();
        const [first = assert.fail("no posting")] = postings(redact(accepted), instance);
        const refused = decode(
          [
            [`${single}.x`, "10"],
            [`${single}.y`, ""],
          ],
          first.binding,
          first.options,
        );

        if (Result.isSuccess(refused)) {
          assert.fail("the half point decoded");
        }

        assert.instanceOf(refused.failure, Malformed);
        assert.strictEqual(refused.failure.reason, "point");

        for (const validateResponses of [false, true]) {
          const messages = positionObjectModule.validate(
            nodeOf(accepted, "RESPONSE"),
            refused.failure,
            yield* configure({ validateResponses }),
          );

          assert.lengthOf(messages, 1, `validateResponses ${String(validateResponses)}`);
          assert.strictEqual(messages[0]?.response, "RESPONSE");
        }
      }),
  );

  it.effect(
    "[Q-17] checkResponses: a position above max-choices is refused in tier (a), and one outside the stage in tier (b), under validateResponses, since the mapping maps a point anywhere",
    () =>
      Effect.gen(function* refused() {
        const accepted = yield* fixture();
        const lenient = yield* configure({});
        const strict = yield* configure({ validateResponses: true });
        const many = checkResponses(
          accepted,
          { PINS: pointsOf("multiple", point(1, 1), point(2, 2), point(3, 3)) },
          lenient,
        );
        const outside = checkResponses(
          accepted,
          { RESPONSE: pointsOf("single", point(600, 150)) },
          strict,
        );
        const below = checkResponses(
          accepted,
          { PINS: pointsOf("multiple", point(100, -5)) },
          strict,
        );
        const scored = checkResponses(
          accepted,
          { RESPONSE: pointsOf("single", point(600, 150)) },
          lenient,
        );
        const fine = checkResponses(
          accepted,
          {
            PINS: pointsOf("multiple", point(0, 0), point(500, 300)),
            RESPONSE: pointsOf("single", point(250, 150)),
          },
          strict,
        );

        assert.lengthOf(many, 1);
        assert.strictEqual(many[0]?.response, "PINS");
        assert.include(many[0]?.text ?? "", "2");
        assert.lengthOf(outside, 1);
        assert.strictEqual(outside[0]?.response, "RESPONSE");
        assert.include(outside[0]?.text ?? "", "500");
        assert.lengthOf(below, 1);
        assert.strictEqual(below[0]?.response, "PINS");
        assert.include(below[0]?.text ?? "", "300");
        assert.deepStrictEqual(scored, [], "a point off the stage scores at the default");
        assert.deepStrictEqual(fine, []);
      }),
  );

  it.effect("[Q-17] score maps each response's points by area", () =>
    Effect.gen(function* scores() {
      const accepted = yield* fixture();
      const scoreOf = (responses: Readonly<Record<string, Value>>) =>
        score(accepted, responses).pipe(
          Effect.fromResult,
          Effect.map((record) => record.outcomes["SCORE"]?.values.map((entry) => entry.value)),
        );

      assert.deepStrictEqual(accepted.unsupported, [], "the item is not unsupported");
      assert.deepStrictEqual(
        yield* scoreOf({
          PINS: pointsOf("multiple", point(100, 100), point(400, 200)),
          RESPONSE: pointsOf("single", point(250, 150)),
        }),
        [4],
      );
      assert.deepStrictEqual(
        yield* scoreOf({
          PINS: pointsOf("multiple", point(110, 90), point(10, 10)),
          RESPONSE: pointsOf("single", point(20, 20)),
        }),
        [1],
      );
      assert.deepStrictEqual(
        yield* scoreOf({
          PINS: pointsOf("multiple", point(100, 100), point(102, 100)),
          RESPONSE: pointsOf("single", point(270, 150)),
        }),
        [3],
        "an area maps once, and the first area listed that holds a point maps it",
      );
    }),
  );

  it.effect(
    "[Q-17] solution shows the correct positions, and finished modes disable the inputs",
    () =>
      Effect.gen(function* solved() {
        const accepted = yield* fixture();
        const correct = solution(accepted);
        const shown = yield* rendered(accepted, { mode: "solution", values: correct });
        const review = yield* rendered(accepted, {
          mode: "review",
          values: { RESPONSE: pointsOf("single", point(10, 10)) },
        });
        const answering = yield* rendered(accepted, {
          values: { RESPONSE: pointsOf("single", point(10, 10)) },
        });
        const disabled = yield* rendered(accepted, { disabled: true });

        assert.deepStrictEqual(correct["RESPONSE"], pointsOf("single", point(250, 150)));
        assert.deepStrictEqual(
          correct["PINS"],
          pointsOf("multiple", point(100, 100), point(400, 200)),
        );
        assert.deepStrictEqual(inputsOf(shown.first), [["250", "150"]]);
        assert.deepStrictEqual(inputsOf(shown.second), [
          ["100", "100"],
          ["400", "200"],
        ]);
        assert.lengthOf(markersOf(shown.second), 2);
        assert.strictEqual(attr(shown.first, "data-mode"), "solution");
        for (const page of [shown, review, disabled]) {
          assert.isTrue(
            [...parts(page.root, "-x"), ...parts(page.root, "-y")].every(
              (input) => attr(input, "disabled") === "",
            ),
            `${attr(page.first, "data-mode") ?? ""} disables the inputs`,
          );
        }

        assert.isTrue(
          [...parts(answering.root, "-x"), ...parts(answering.root, "-y")].every(
            (input) => attr(input, "disabled") === undefined,
          ),
          "answering leaves the inputs enabled",
        );
        assert.strictEqual(attr(disabled.first, "data-disabled"), "");
      }),
  );

  it.effect("[Q-17] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* trees() {
      const accepted = yield* fixture();
      const states: readonly (readonly [string, Options])[] = [
        ["no values", {}],
        [
          "restored",
          {
            values: {
              PINS: pointsOf("multiple", point(100, 100)),
              RESPONSE: pointsOf("single", point(250, 150)),
            },
          },
        ],
        [
          "refused post",
          {
            messages: [{ response: "PINS", text: "Place the benches." }],
            posted: { PINS: ["1", "2", "3", "4"] },
          },
        ],
        ["review", { mode: "review", values: { RESPONSE: pointsOf("single", point(1, 2)) } }],
        ["solution", { mode: "solution", values: solution(accepted) }],
        ["disabled", { disabled: true }],
      ];

      for (const [state, options] of states) {
        const page = yield* rendered(accepted, options);

        assert.lengthOf(parts(page.root, ""), 2, `${state}: both Roots render`);
        assert.isTrue(roundTrips(page.root), `${state}: the HTML round-trips`);
        assert.deepStrictEqual(checkTree(page.root, { baseLevel: 2 }), [], state);
        assert.notInclude(page.html, "style=", `${state}: no inline style`);
      }
    }),
  );

  it.effect(
    "[Q-17] redact's copy holds no correct response and no mapping, and its JSON carries the container with no path and decodes to the same body",
    () =>
      Effect.gen(function* redacts() {
        const accepted = yield* fixture();
        const configured = yield* configure({});
        const item = redact(accepted);
        const written = json(item);
        const encoded = yield* Effect.fromResult(encodeRedacted(item));
        const container = encoded.body.find((node) => node.kind === "container");

        assert.include(written, '"kind":"position-object"');
        assert.notInclude(written, "correct");
        assert.notInclude(written, "mapping");
        assert.notInclude(written, "250,150,40");
        assert.notInclude(json(encoded), '"path"');
        assert.deepStrictEqual(Object.keys(container ?? {}).toSorted(), [
          "children",
          "kind",
          "module",
        ]);
        assert.strictEqual(
          container?.kind === "container" ? container.module : "",
          "position-object",
        );

        const wire: unknown = JSON.parse(json(encoded));
        const decoded = yield* Effect.fromResult(decodeRedacted(wire));
        const again = decoded.body.find((node) => node.kind === "container");
        const options = {
          instance,
          values: { RESPONSE: pointsOf("single", point(250, 150)) },
        };

        assert.strictEqual(again?.kind, "container");
        assert.strictEqual(
          again?.kind === "container"
            ? again.children.filter((child) => child.kind !== "text").length
            : 0,
          3,
        );
        assert.strictEqual(
          (yield* Effect.fromResult(render(decoded, configured, options))).html,
          (yield* Effect.fromResult(render(item, configured, options))).html,
        );

        const tampered: unknown = JSON.parse(
          json(encoded).replace('"module":"position-object"', '"module":"slider"'),
        );

        assert.isTrue(Result.isFailure(decodeRedacted(tampered)));
      }),
  );

  it.effect(
    "[Q-17] a stage with no image, or none of this module's interactions inside it, gives the notice for the stage",
    () =>
      Effect.gen(function* notices() {
        const stagePath = "qti-assessment-item/qti-item-body/qti-position-object-stage";
        const noImage = yield* fixture([
          [
            '<img src="images/position-object-stage.svg" width="500" height="300"\n        alt="A park with a pond in the middle and a grove at each end"/>',
            "",
          ],
        ]);
        const noInteraction = yield* fixture([
          [
            '<qti-position-object-interaction response-identifier="RESPONSE" center-point="10 20">\n        <img src="images/position-object-token.svg" width="40" height="40" alt="The fountain"/>\n      </qti-position-object-interaction>',
            "",
          ],
          [
            '<qti-position-object-interaction response-identifier="PINS" max-choices="2">\n        <img src="images/position-object-token.svg" width="40" height="40" alt="A bench"/>\n      </qti-position-object-interaction>',
            "",
          ],
        ]);

        for (const [name, accepted] of [
          ["no image", noImage],
          ["no interaction", noInteraction],
        ] as const) {
          assert.deepStrictEqual(
            accepted.unsupported,
            [{ feature: "qti-position-object-stage", path: stagePath, shown: "notice" }],
            name,
          );
          assert.deepStrictEqual(
            accepted.item.body.filter((node) => node.kind !== "text").map((node) => node.kind),
            ["element", "unsupported"],
            name,
          );
          assert.deepStrictEqual(interactionsIn(accepted.item.body), [], name);

          const configured = yield* configure({});
          const page = yield* Effect.fromResult(render(redact(accepted), configured, { instance }));

          assert.include(page.html, "Not supported here", name);
          assert.notInclude(page.html, `data-slot="${owner}"`, name);
        }
      }),
  );
});
