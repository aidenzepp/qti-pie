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
  h,
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
import { Malformed, pointEntryNames } from "#plate/form/encoding.ts";
import { format, isRecordValue } from "#plate/model/values.ts";
import { checkTree, nameOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The instance every render here passes, so the entry name and every id are fixed.
 */
const instance = "q1";

/**
 * The entry name the interaction's response posts under, which its two coordinate entries extend.
 */
const entry = entryName(instance, "RESPONSE");

/**
 * The two entry names a point posts under: `<entry>.x` then `<entry>.y`.
 */
const [entryX, entryY] = pointEntryNames(entry);

/**
 * The fixture folder of area `ei`, beside the package's `src`.
 */
const fixtureFolder = path.resolve(import.meta.dirname, "..", "..", "fixtures", "ei", "items");

/**
 * The marker prefix of every Select Point part, read through the part table's `slotFor` rule.
 */
const owner = "select-point-interaction";

/**
 * The strings of the fixture's area mapping that a rendered page must never carry: each area's
 * coordinates, its shape attribute and its mapped value.
 */
const mappingTells = ["120,80,40", "100,60,300,200", 'shape="', "mapped-value", "default-value"];

/**
 * Read a fixture item as text.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @returns The item's text.
 */
const textOfFixture = (file: string) =>
  Effect.tryPromise(() => readFile(path.join(fixtureFolder, file), "utf-8"));

/**
 * Open item text as a host opens a document it read from storage, and accept it.
 *
 * @param file The item's name, which the verdict carries as its location.
 * @param text The item's text.
 * @returns The accepted item, or a failed assertion naming the verdict.
 */
const accept = Effect.fnUntraced(function* accept(file: string, text: string) {
  const verdict = yield* open(`fixtures/ei/items/${file}`, new TextEncoder().encode(text));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${file} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open a fixture and accept it, with text edits applied first.
 *
 * @param file The fixture's file name under `fixtures/ei/items`.
 * @param edits Each `[from, to]` replaces one occurrence of `from` in the text.
 * @returns The accepted item.
 */
const fixture = Effect.fnUntraced(function* fixture(
  file: string,
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
 * Construct a point value of the fixture's `multiple` binding.
 *
 * @param marked Each point as `[x, y]`.
 * @returns The value.
 */
const points = (...marked: readonly (readonly [number, number])[]): Value => ({
  baseType: "point",
  cardinality: "multiple",
  values: marked.map(([x, y]) => ({ baseType: "point", value: [BigInt(x), BigInt(y)] })),
});

/**
 * Construct a point value of the single fixture's binding.
 *
 * @param x The point's x.
 * @param y The point's y.
 * @returns The value.
 */
const single = (x: number, y: number): Value => ({
  baseType: "point",
  cardinality: "single",
  values: [{ baseType: "point", value: [BigInt(x), BigInt(y)] }],
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
 * @returns The elements carrying `select-point-interaction<part>`.
 */
const parts = (root: Element, part: string): readonly Element[] =>
  elementsOf([root]).filter((element) => element.attrs["data-slot"] === `${owner}${part}`);

/**
 * Render an accepted item and parse its HTML.
 *
 * @param accepted The accepted item.
 * @param options The render's options, the fixed instance by default.
 * @param configuration The configuration's inputs, none by default.
 * @returns The root element, the Root of the interaction, and the HTML as written.
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

  const interaction = parts(root, "")[0] ?? assert.fail("the page holds no Select Point Root");

  return { html: page.html, interaction, root };
});

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
 * Read the `value` of each x and each y input, in document order, the empty string for one with
 * no `value`.
 *
 * @param root The tree's root.
 * @returns `[x, y]` per point group.
 */
const inputValues = (root: Element): readonly (readonly [string, string])[] =>
  parts(root, "-point").map((group) => [
    attr(parts(group, "-x")[0] ?? assert.fail("a point with no x"), "value") ?? "",
    attr(parts(group, "-y")[0] ?? assert.fail("a point with no y"), "value") ?? "",
  ]);

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
 * The correct response of the fixture `select-point.xml`.
 */
const correct = points([120, 80], [250, 150]);

describe("[Q-18] Select Point", () => {
  it.effect("[Q-18] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* opens() {
      for (const file of ["select-point.xml", "select-point-single.xml"]) {
        const accepted = yield* accept(file, yield* textOfFixture(file));

        assert.deepStrictEqual(accepted.unsupported, [], file);
        assert.strictEqual(
          accepted.item.body.some((node) => node.kind === "select-point"),
          true,
          `${file} holds a select-point node`,
        );
      }
    }),
  );

  it.effect("[Q-18] render emits the image and two point groups of two bounded number inputs", () =>
    Effect.gen(function* emits() {
      const page = yield* rendered(yield* fixture("select-point.xml"));
      const one = yield* rendered(yield* fixture("select-point-single.xml"));
      const groups = parts(page.root, "-point");
      const [image] = parts(page.root, "-image");

      assert.lengthOf(groups, 2);
      assert.lengthOf(parts(one.root, "-point"), 1);
      assert.isDefined(image);
      assert.isTrue(
        image !== undefined && elementsOf([image]).some((element) => element.tag === "img"),
        "the image part holds the author's img",
      );
      for (const group of groups) {
        const [x] = parts(group, "-x");
        const [y] = parts(group, "-y");

        assert.strictEqual(group.tag, "fieldset");
        assert.isDefined(x);
        assert.isDefined(y);
        for (const [input, bound] of [
          [x, "400"],
          [y, "300"],
        ] as const) {
          assert.strictEqual(input?.tag, "input");
          assert.strictEqual(attr(input ?? assert.fail("no input"), "type"), "number");
          assert.strictEqual(attr(input ?? assert.fail("no input"), "min"), "0");
          assert.strictEqual(attr(input ?? assert.fail("no input"), "max"), bound);
          assert.strictEqual(attr(input ?? assert.fail("no input"), "step"), "1");
        }
      }

      assert.deepStrictEqual(
        parts(page.root, "-x").map((input) => attr(input, "name")),
        [entryX, entryX],
      );
      assert.deepStrictEqual(
        parts(page.root, "-y").map((input) => attr(input, "name")),
        [entryY, entryY],
      );
      assert.isFalse(page.html.includes("Not supported here"), "no notice");
      for (const slot of [
        "",
        "-image",
        "-marker",
        "-markers",
        "-point",
        "-points",
        "-prompt",
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
    "[Q-18] each input is named by its point and axis and its range, and the root carries the image's size",
    () =>
      Effect.gen(function* names() {
        const page = yield* rendered(yield* fixture("select-point.xml"));
        const [prompt = assert.fail("the page holds no Prompt")] = parts(page.root, "-prompt");

        assert.deepStrictEqual(
          parts(page.root, "-point").map((group) => nameOf(group, page.root)),
          ["Point 1", "Point 2"],
        );
        assert.deepStrictEqual(
          parts(page.root, "-x").map((input) => nameOf(input, page.root)),
          ["Point 1, x, 0 to 400", "Point 2, x, 0 to 400"],
        );
        assert.deepStrictEqual(
          parts(page.root, "-y").map((input) => nameOf(input, page.root)),
          ["Point 1, y, 0 to 300", "Point 2, y, 0 to 300"],
        );
        assert.strictEqual(attr(page.interaction, "data-width"), "400");
        assert.strictEqual(attr(page.interaction, "data-height"), "300");
        assert.strictEqual(attr(page.interaction, "data-max-choices"), "2");
        assert.strictEqual(attr(page.interaction, "data-entry-name"), entry);
        assert.strictEqual(attr(page.interaction, "data-mode"), "answering");
        assert.strictEqual(attr(page.interaction, "role"), "group");
        assert.strictEqual(attr(page.interaction, "aria-labelledby"), attr(prompt, "id"));
        assert.strictEqual(
          nameOf(page.interaction, page.root),
          "Mark the pond and the oak on the plan of the garden.",
        );
      }),
  );

  it.effect("[Q-18] the areas of the mapping are never rendered", () =>
    Effect.gen(function* hidden() {
      const accepted = yield* fixture("select-point.xml");
      const states: readonly Options[] = [
        {},
        { values: { RESPONSE: points([120, 80]) } },
        { mode: "solution", values: solution(accepted) },
      ];

      for (const options of states) {
        const page = yield* rendered(accepted, options);

        for (const tell of mappingTells) {
          assert.notInclude(page.html, tell);
        }
      }

      const empty = yield* rendered(accepted);

      assert.deepStrictEqual(
        elementsOf([empty.root])
          .map((element) => element.tag)
          .filter((tag) => ["circle", "ellipse", "polygon", "rect"].includes(tag)),
        [],
        "with no point shown, no shape is drawn",
      );
    }),
  );

  it.effect("[Q-18] a restored response fills the inputs and draws one marker per point", () =>
    Effect.gen(function* restored() {
      const accepted = yield* fixture("select-point.xml");
      const page = yield* rendered(accepted, { values: { RESPONSE: points([120, 80]) } });
      const [markers = assert.fail("no markers svg")] = parts(page.root, "-markers");
      const marker = parts(page.root, "-marker");

      assert.deepStrictEqual(inputValues(page.root), [
        ["120", "80"],
        ["", ""],
      ]);
      assert.strictEqual(markers.tag, "svg");
      assert.strictEqual(attr(markers, "aria-hidden"), "true");
      assert.strictEqual(attr(markers, "viewBox"), "0 0 400 300");
      assert.lengthOf(marker, 1);
      assert.strictEqual(attr(marker[0] ?? assert.fail("no marker"), "cx"), "120");
      assert.strictEqual(attr(marker[0] ?? assert.fail("no marker"), "cy"), "80");
      assert.isTrue(
        elementsOf([markers]).includes(marker[0] ?? assert.fail("no marker")),
        "the marker lies in the markers svg",
      );
      assert.isTrue(
        elementsOf([parts(page.root, "-image")[0] ?? assert.fail("no image")]).includes(markers),
        "the markers svg lies in the image part",
      );

      const two = yield* rendered(accepted, { values: { RESPONSE: points([10, 20], [30, 40]) } });

      assert.deepStrictEqual(inputValues(two.root), [
        ["10", "20"],
        ["30", "40"],
      ]);
      assert.lengthOf(parts(two.root, "-marker"), 2);
    }),
  );

  it.effect(
    "[Q-18] a refused post's strings fill the inputs in posted order, x then y per value (posted handed to render: the hosts collect no point strings until W0-POSTED-POINT)",
    () =>
      Effect.gen(function* posted() {
        const accepted = yield* fixture("select-point.xml");
        const page = yield* rendered(accepted, {
          messages: [{ response: "RESPONSE", text: "Choose a point on the image." }],
          posted: { RESPONSE: ["120", "80", "500", ""] },
          values: { RESPONSE: points([10, 10]) },
        });

        assert.deepStrictEqual(inputValues(page.root), [
          ["120", "80"],
          ["500", ""],
        ]);
        assert.strictEqual(attr(page.interaction, "aria-describedby"), "q1-RESPONSE-message-0");
        assert.isTrue(
          parts(page.root, "-x").every((input) => attr(input, "aria-invalid") === "true"),
          "each input carries the refusal",
        );
        assert.strictEqual(
          attr(parts(page.root, "-x")[0] ?? assert.fail("no x"), "autofocus"),
          "",
          "the first input takes autofocus",
        );
        assert.lengthOf(parts(page.root, "-marker"), 1, "only a whole point is drawn");
      }),
  );

  it.effect(
    "[Q-18] postings binds the response as a multiple point and decode reads the posted points",
    () =>
      Effect.gen(function* binds() {
        const accepted = yield* fixture("select-point.xml");
        const [posting = assert.fail("no posting"), ...rest] = postings(redact(accepted), instance);

        assert.lengthOf(rest, 0);
        assert.deepStrictEqual(posting.binding, {
          baseType: "point",
          cardinality: "multiple",
          name: entry,
        });
        assert.strictEqual(posting.identifier, "RESPONSE");

        const decoded = yield* Effect.fromResult(
          decode(
            [
              [entryX, "120"],
              [entryY, "80"],
              ["other", "x"],
              [entryX, "250"],
              [entryY, "150"],
            ],
            posting.binding,
            posting.options,
          ),
        );

        assert.deepStrictEqual(
          isRecordValue(decoded) ? assert.fail("a record") : decoded.values.map(format),
          ["120 80", "250 150"],
        );
      }),
  );

  it.effect(
    "[Q-18] checkResponses: a negative coordinate is refused in tier (a), one beyond the image's size under validateResponses, each naming the bound, and a point with x filled and y empty is Malformed",
    () =>
      Effect.gen(function* outside() {
        const accepted = yield* fixture("select-point.xml");
        const [posting = assert.fail("no posting")] = postings(redact(accepted), instance);
        const strict = yield* configure({ validateResponses: true });
        const lax = yield* configure({ validateResponses: false });
        const wide = checkResponses(accepted, { RESPONSE: points([500, 80]) }, strict);
        const tall = checkResponses(accepted, { RESPONSE: points([120, 301]) }, strict);

        assert.lengthOf(wide, 1);
        assert.strictEqual(wide[0]?.response, "RESPONSE");
        assert.include(wide[0]?.text ?? "", "400");
        assert.include(wide[0]?.text ?? "", "x");
        assert.lengthOf(tall, 1);
        assert.include(tall[0]?.text ?? "", "300");
        assert.deepStrictEqual(
          checkResponses(accepted, { RESPONSE: points([500, 80]) }, lax),
          [],
          "a point beyond the image scores at the mapping's default, as the corpus items do",
        );
        assert.deepStrictEqual(
          (yield* Effect.fromResult(score(accepted, { RESPONSE: points([500, 80]) }))).outcomes[
            "SCORE"
          ]?.values.map((outcome) => outcome.value),
          [-1],
        );
        for (const configured of [lax, strict]) {
          const negative = checkResponses(accepted, { RESPONSE: points([-1, 80]) }, configured);
          const edge = checkResponses(accepted, { RESPONSE: points([400, 300]) }, configured);

          assert.lengthOf(negative, 1, "a negative coordinate is always refused");
          assert.include(negative[0]?.text ?? "", "400");
          assert.deepStrictEqual(edge, [], "the image's edge is inside");
        }

        const half = decode(
          [
            [entryX, "120"],
            [entryY, ""],
          ],
          posting.binding,
          posting.options,
        );

        assert.isTrue(Result.isFailure(half));
        if (Result.isFailure(half)) {
          assert.instanceOf(half.failure, Malformed);
          assert.strictEqual(half.failure.reason, "point");

          const messages = checkResponses(
            accepted,
            { RESPONSE: half.failure },
            yield* configure({}),
          );

          assert.lengthOf(messages, 1);
          assert.strictEqual(messages[0]?.response, "RESPONSE");
        }
      }),
  );

  it.effect(
    "[Q-18] checkResponses: above max-choices always, below min-choices only under validateResponses",
    () =>
      Effect.gen(function* bounds() {
        const accepted = yield* fixture("select-point.xml", [
          ['max-choices="2"', 'max-choices="2" min-choices="1"'],
        ]);
        const check = (value: Value, validateResponses: boolean) =>
          configure({ validateResponses }).pipe(
            Effect.map((configuration) =>
              checkResponses(accepted, { RESPONSE: value }, configuration),
            ),
          );
        const three = points([10, 10], [20, 20], [30, 30]);

        assert.lengthOf(yield* check(three, false), 1);
        assert.lengthOf(yield* check(three, true), 1);
        assert.include((yield* check(three, true))[0]?.text ?? "", "2");
        assert.deepStrictEqual(yield* check(points(), false), []);
        assert.lengthOf(yield* check(points(), true), 1);
        assert.deepStrictEqual(yield* check(points([10, 10]), true), []);
        assert.deepStrictEqual(yield* check(points([10, 10], [20, 20]), true), []);

        const one = yield* fixture("select-point-single.xml");

        assert.lengthOf(
          checkResponses(
            one,
            {
              RESPONSE: {
                baseType: "point",
                cardinality: "single",
                values: [
                  { baseType: "point", value: [1n, 1n] },
                  { baseType: "point", value: [2n, 2n] },
                ],
              },
            },
            yield* configure({}),
          ),
          1,
          "a single binding takes one point",
        );
      }),
  );

  it.effect(
    "[Q-18] score maps the points by area, a boundary point inside, the first area winning",
    () =>
      Effect.gen(function* scores() {
        const accepted = yield* fixture("select-point.xml");
        const scoreOf = (value: Value) =>
          score(accepted, { RESPONSE: value }).pipe(
            Effect.fromResult,
            Effect.map((record) =>
              record.outcomes["SCORE"]?.values.map((outcome) => outcome.value),
            ),
          );

        assert.deepStrictEqual(accepted.unsupported, [], "the item is not unsupported");
        assert.deepStrictEqual(yield* scoreOf(correct), [3]);
        assert.deepStrictEqual(yield* scoreOf(points([160, 80])), [1], "on the circle's edge");
        assert.deepStrictEqual(yield* scoreOf(points([120, 80])), [1], "in both, the first wins");
        assert.deepStrictEqual(yield* scoreOf(points([250, 150])), [2], "in the rect alone");
        assert.deepStrictEqual(yield* scoreOf(points([10, 10])), [-1], "in no area, the default");
        assert.deepStrictEqual(
          yield* scoreOf(points([10, 10], [10, 20])),
          [-2],
          "the default once per distinct point in no area",
        );
        assert.deepStrictEqual(
          yield* scoreOf(points([120, 80], [130, 80])),
          [1],
          "each area maps once",
        );

        const one = yield* fixture("select-point-single.xml");
        const oneScore = (value: Value) =>
          score(one, { RESPONSE: value }).pipe(
            Effect.fromResult,
            Effect.map((record) =>
              record.outcomes["SCORE"]?.values.map((outcome) => outcome.value),
            ),
          );

        assert.deepStrictEqual(yield* oneScore(single(120, 80)), [1]);
        assert.deepStrictEqual(yield* oneScore(single(121, 80)), [0]);
      }),
  );

  it.effect("[Q-18] solution shows the correct points, and finished modes disable the inputs", () =>
    Effect.gen(function* solved() {
      const accepted = yield* fixture("select-point.xml");
      const correctValues = solution(accepted);
      const shown = yield* rendered(accepted, { mode: "solution", values: correctValues });
      const review = yield* rendered(accepted, {
        mode: "review",
        values: { RESPONSE: points([10, 20]) },
      });
      const answering = yield* rendered(accepted, { values: { RESPONSE: points([10, 20]) } });
      const disabled = yield* rendered(accepted, {
        disabled: true,
        values: { RESPONSE: points([10, 20]) },
      });
      const inputs = (root: Element) => [...parts(root, "-x"), ...parts(root, "-y")];

      assert.deepStrictEqual(correctValues["RESPONSE"], correct);
      assert.deepStrictEqual(inputValues(shown.root), [
        ["120", "80"],
        ["250", "150"],
      ]);
      assert.lengthOf(parts(shown.root, "-marker"), 2);
      assert.strictEqual(attr(shown.interaction, "data-mode"), "solution");
      assert.isTrue(inputs(shown.root).every((input) => attr(input, "disabled") === ""));
      assert.isTrue(inputs(review.root).every((input) => attr(input, "disabled") === ""));
      assert.deepStrictEqual(inputValues(review.root)[0], ["10", "20"]);
      assert.isTrue(inputs(answering.root).every((input) => attr(input, "disabled") === undefined));
      assert.isTrue(inputs(disabled.root).every((input) => attr(input, "disabled") === ""));
      assert.strictEqual(attr(disabled.interaction, "data-disabled"), "");
    }),
  );

  it.effect("[Q-18] restore gives the stored points back and the page shows them", () =>
    Effect.gen(function* restores() {
      const accepted = yield* fixture("select-point.xml");
      const configured = yield* configure({});
      const record = yield* Effect.fromResult(
        score(accepted, { RESPONSE: points([250, 150], [10, 20]) }),
      );
      const restored = yield* Effect.fromResult(restore(accepted, record));
      const page = yield* Effect.fromResult(
        render(redact(accepted, restored.record, configured), configured, {
          instance,
          values: restored.values,
        }),
      );
      const [root] = parseHtml(page.html);

      assert.deepStrictEqual(restored.values["RESPONSE"], points([250, 150], [10, 20]));
      assert.deepStrictEqual(
        inputValues(root?.kind === "element" ? root : assert.fail("no root")),
        [
          ["250", "150"],
          ["10", "20"],
        ],
      );
    }),
  );

  it.effect("[Q-18] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* trees() {
      for (const file of ["select-point.xml", "select-point-single.xml"]) {
        const accepted = yield* fixture(file);
        const value = file === "select-point.xml" ? points([120, 80]) : single(120, 80);
        const states: readonly (readonly [string, Options])[] = [
          ["no values", {}],
          ["restored", { values: { RESPONSE: value } }],
          [
            "refused post",
            {
              messages: [{ response: "RESPONSE", text: "Choose a point on the image." }],
              posted: { RESPONSE: ["120", ""] },
            },
          ],
          ["review", { mode: "review", values: { RESPONSE: value } }],
          ["solution", { mode: "solution", values: solution(accepted) }],
          ["disabled", { disabled: true }],
        ];

        for (const [state, options] of states) {
          const page = yield* rendered(accepted, options);

          assert.isAbove(parts(page.root, "-point").length, 0, `${file}, ${state}: a point group`);
          assert.isTrue(roundTrips(page.root), `${file}, ${state}: the HTML round-trips`);
          assert.deepStrictEqual(checkTree(page.root, { baseLevel: 2 }), [], `${file}, ${state}`);
          assert.isTrue(
            elementsOf([page.root]).every((element) => element.attrs["style"] === undefined),
            `${file}, ${state}: no style attribute`,
          );
        }
      }
    }),
  );

  it.effect("[Q-18] redact's copy holds no correct response and no mapping", () =>
    Effect.gen(function* redacts() {
      const accepted = yield* fixture("select-point.xml");
      const redacted = redact(accepted);
      const written = json(redacted);
      const empty = yield* rendered(accepted);

      assert.include(written, '"kind":"select-point"', "the body holds the interaction's node");
      assert.notInclude(written, "correct");
      assert.notInclude(written, "250 150");
      assert.notInclude(written, "areaMapping");
      assert.notInclude(written, "mapped");
      for (const tell of ["120,80,40", "100,60,300,200", "circle", "rect"]) {
        assert.notInclude(written, tell);
      }
      assert.deepStrictEqual(inputValues(empty.root), [
        ["", ""],
        ["", ""],
      ]);
      assert.lengthOf(parts(empty.root, "-marker"), 0);
    }),
  );

  it.effect(
    "[Q-18] the redacted JSON form round-trips through the codec and renders the same HTML",
    () =>
      Effect.gen(function* codec() {
        for (const file of ["select-point.xml", "select-point-single.xml"]) {
          const accepted = yield* fixture(file);
          const configured = yield* configure({});
          const item = redact(accepted);
          const wire: unknown = JSON.parse(json(yield* Effect.fromResult(encodeRedacted(item))));
          const decoded = yield* Effect.fromResult(decodeRedacted(wire));
          const options = {
            instance,
            values: { RESPONSE: file === "select-point.xml" ? points([10, 20]) : single(10, 20) },
          };

          assert.strictEqual(
            (yield* Effect.fromResult(render(decoded, configured, options))).html,
            (yield* Effect.fromResult(render(item, configured, options))).html,
            file,
          );
        }

        const tampered: unknown = JSON.parse(
          json(
            yield* Effect.fromResult(encodeRedacted(redact(yield* fixture("select-point.xml")))),
          ).replace('"width":400', '"width":"wide"'),
        );

        assert.isTrue(Result.isFailure(decodeRedacted(tampered)));
      }),
  );

  it.effect(
    "[Q-18] an image with no width and height gives the interaction's own notice, and the deprecated object with a size is read",
    () =>
      Effect.gen(function* sized() {
        const unsized = yield* fixture("select-point.xml", [[' width="400" height="300"', ""]]);
        const object = yield* fixture("select-point.xml", [
          [
            '<img src="images/select-point-map.svg" width="400" height="300"\n        alt="A plan of a walled garden with a round pond, a fenced bed and a path"/>',
            '<object type="image/svg+xml" data="images/select-point-map.svg" width="400" height="300">A plan of a walled garden</object>',
          ],
        ]);
        const page = yield* rendered(object);

        assert.lengthOf(unsized.unsupported, 1);
        assert.strictEqual(unsized.unsupported[0]?.shown, "notice");
        assert.strictEqual(
          unsized.unsupported[0]?.path,
          "qti-assessment-item/qti-item-body/qti-select-point-interaction",
        );
        assert.include(unsized.unsupported[0]?.feature ?? "", "width");
        assert.isFalse(unsized.item.body.some((node) => node.kind === "select-point"));
        assert.deepStrictEqual(object.unsupported, []);
        assert.strictEqual(attr(page.interaction, "data-width"), "400");
        assert.isTrue(elementsOf([page.root]).some((element) => element.tag === "object"));
        assert.lengthOf(parts(page.root, "-point"), 2);
      }),
  );

  it.effect("[Q-18] a host swaps a part through the part overrides", () =>
    Effect.gen(function* swapped() {
      const accepted = yield* fixture("select-point.xml");
      const page = yield* rendered(accepted, {
        parts: {
          [owner]: {
            point: (props, children) =>
              h("fieldset", { ...props, "data-swapped": "yes" }, children),
          },
        },
        values: { RESPONSE: points([120, 80]) },
      });

      assert.isTrue(
        parts(page.root, "-point").every((group) => attr(group, "data-swapped") === "yes"),
      );
      assert.lengthOf(parts(page.root, "-point"), 2);
    }),
  );
});
