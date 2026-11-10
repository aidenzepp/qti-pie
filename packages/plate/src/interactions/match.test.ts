import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import { decodeRedacted, encodeRedacted } from "#plate/codec/redacted.ts";
import { configure } from "#plate/configuration.ts";
import type { Attributes, Element, Node, PartFunction } from "#plate/emit/node.ts";
import { h } from "#plate/emit/node.ts";
import { decode, entryName, Malformed } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { Value } from "#plate/model/values.ts";
import { postings } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { checkResponses } from "#plate/responses.ts";
import { restore } from "#plate/restore.ts";
import { ResponsesRefused, score } from "#plate/score.ts";
import { solution } from "#plate/solution.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, unsupportedFeatures } from "#plate/validate/verdict.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The item instance every render here is made under unless a test names another, so the entry
 * name is known.
 */
const instance = "m1";

/**
 * The identifier of the response every Match here binds.
 */
const response = "RESPONSE";

/**
 * The name the Match's controls post under when the host chooses none.
 */
const name = entryName(instance, response);

/**
 * The `data-slot` marker of each Match part the render writes.
 */
const slots = {
  cell: "match-interaction-cell",
  columnHeader: "match-interaction-column-header",
  control: "match-interaction-control",
  corner: "match-interaction-corner",
  prompt: "match-interaction-prompt",
  root: "match-interaction",
  rowHeader: "match-interaction-row-header",
  table: "match-interaction-table",
} as const;

/**
 * The fixture items of this module: the matrix of tools and trades, and the shuffled instruments.
 */
const fixtures = ["match.xml", "match-shuffle.xml"] as const;

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
    assert.fail(`${location} is ${verdict.verdict}, not accepted: ${JSON.stringify(verdict)}`),
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
 * Replace the one place a text occurs in an item's XML, failing the test when it is not there.
 *
 * @param xml The item's XML.
 * @param from The text to find.
 * @param to The text to put in its place.
 * @returns The edited XML.
 */
const edited = (xml: string, from: string, to: string): string => {
  assert.include(xml, from);

  return xml.replace(from, to);
};

/**
 * What a test passes `render` beyond the item: the host's options, and the seed the shuffle is
 * keyed by.
 */
interface Showing extends Options {
  readonly seed?: string;
}

/**
 * Render an accepted item as the host would for one candidate.
 *
 * @param accepted The accepted item.
 * @param showing What the host passes to `render` beside the instance, and the seed.
 * @returns The rendered HTML.
 */
const rendered = (accepted: Accepted, showing: Showing = {}) =>
  Effect.gen(function* renderMatch() {
    const { seed, ...options } = showing;
    const configuration = yield* configure(seed === undefined ? {} : { seed });
    const { html } = yield* Effect.fromResult(
      render(redact(accepted, undefined, configuration), configuration, { instance, ...options }),
    );

    return html;
  });

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
 * Read an attribute of an emitted element as a string.
 *
 * @param element The element.
 * @param attribute The attribute's name.
 * @returns The value, `undefined` when the element does not carry it.
 */
const attributeOf = (element: Element, attribute: string): string | undefined => {
  const value = element.attrs[attribute];

  return value === true ? "" : value;
};

/**
 * Give the pairs the controls of a tree post, in document order.
 *
 * @param root The tree.
 * @returns Each control's `value`.
 */
const valuesOf = (root: Element): readonly string[] =>
  partsOf(root, slots.control).map((control) => String(control.attrs["value"]));

/**
 * Give the pairs of the controls a tree holds that are checked.
 *
 * @param root The tree.
 * @returns The `value` of each checked control, in document order.
 */
const checkedOf = (root: Element): readonly string[] =>
  partsOf(root, slots.control)
    .filter((control) => control.attrs["checked"] !== undefined)
    .map((control) => String(control.attrs["value"]));

/**
 * Give the identifiers of one set's headers, in the order the table presents them.
 *
 * @param root The tree.
 * @param slot The header part's marker: the row headers or the column headers.
 * @returns Each header's `data-identifier`.
 */
const headersOf = (root: Element, slot: string): readonly string[] =>
  partsOf(root, slot).map((header) => attributeOf(header, "data-identifier") ?? "");

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
 * Construct the multiple directed-pair value that pairs each source with its target.
 *
 * @param pairs Each pair: its source and its target.
 * @returns The value.
 */
const pairValue = (...pairs: readonly (readonly [string, string])[]): Value => ({
  baseType: "directedPair",
  cardinality: "multiple",
  values: pairs.map(([source, target]) => ({
    baseType: "directedPair" as const,
    value: [source, target] as const,
  })),
});

/**
 * The main fixture's correct response: each tool with its trade.
 */
const correct = pairValue(["TROWEL", "GARDENER"], ["ANVIL", "SMITH"], ["LOOM", "WEAVER"]);

/**
 * The message the author wrote for too many matches.
 */
const authorMax = "Make three matches at most.";

/**
 * The message the author wrote for too few matches.
 */
const authorMin = "Make at least one match.";

/**
 * Check a response as the item's interactions do.
 *
 * @param accepted The accepted item.
 * @param value The response's value, none to leave it out.
 * @param validateResponses Whether tier (b) limits apply too.
 * @returns The messages `checkResponses` gives.
 */
const checked = (accepted: Accepted, value?: Value, validateResponses = false) =>
  Effect.map(configure({ validateResponses }), (configuration) =>
    checkResponses(accepted, value === undefined ? {} : { [response]: value }, configuration),
  );

/**
 * The texts of the messages a check gave.
 *
 * @param messages The messages.
 * @returns Their texts, in order.
 */
const textsOf = (messages: readonly { readonly text: string }[]): readonly string[] =>
  messages.map(({ text }) => text);

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

/**
 * Give the orders a rendered tree presents the two sets in: the row headers' identifiers and the
 * column headers'.
 *
 * @param root The tree.
 * @returns Each set's identifiers, in presented order.
 */
const ordersOf = (root: Element) => ({
  columns: headersOf(root, slots.columnHeader),
  rows: headersOf(root, slots.rowHeader),
});

/**
 * Give the one `tr` an element sits in, failing the test when it sits in none.
 *
 * @param root The tree.
 * @param element The element.
 * @returns The row.
 */
const rowAround = (root: Element, element: Element): Element =>
  elementsIn(root).find(
    (candidate) =>
      candidate.tag === "tr" &&
      candidate.children.some((child) => elementsIn(child).includes(element)),
  ) ?? assert.fail("the element sits in no tr");

describe("Match", () => {
  it.effect("[Q-13] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* opens() {
      for (const file of fixtures) {
        const verdict = yield* open(
          `fixtures/m3d/items/${file}`,
          new TextEncoder().encode(fixtureText(file)),
        );

        assert.isTrue(Option.isSome(acceptedItem(verdict)), `${file} is accepted`);
        assert.deepStrictEqual(
          unsupportedFeatures(verdict).filter((entry) => entry.feature.startsWith("qti-match")),
          [],
          file,
        );
        assert.strictEqual(verdict.verdict, "accepted", file);
      }
    }),
  );

  it.effect(
    "[Q-13] render emits a table of 3 row headers, 4 column headers and 12 checkboxes with data-slot markers",
    () =>
      Effect.gen(function* emitsMatrix() {
        const root = rootOf(yield* rendered(yield* opened("match.xml")));
        const table = partOf(root, slots.table);
        const rows = partsOf(root, slots.rowHeader);
        const columns = partsOf(root, slots.columnHeader);
        const controls = partsOf(root, slots.control);

        assert.strictEqual(partsOf(root, slots.root).length, 1);
        assert.strictEqual(table.tag, "table");
        assert.strictEqual(partOf(root, slots.corner).tag, "th");
        assert.strictEqual(rows.length, 3);
        assert.strictEqual(columns.length, 4);
        assert.strictEqual(partsOf(root, slots.cell).length, 12);
        assert.strictEqual(controls.length, 12);
        assert.isTrue(rows.every((row) => row.tag === "th"));
        assert.isTrue(columns.every((column) => column.tag === "th"));
        assert.isTrue(partsOf(root, slots.cell).every((cell) => cell.tag === "td"));
        assert.deepStrictEqual(headersOf(root, slots.rowHeader), ["TROWEL", "ANVIL", "LOOM"]);
        assert.deepStrictEqual(headersOf(root, slots.columnHeader), [
          "GARDENER",
          "SMITH",
          "WEAVER",
          "MASON",
        ]);
        assert.deepStrictEqual(rows.map(textOf), ["Trowel", "Anvil", "Loom"]);
        assert.deepStrictEqual(columns.map(textOf), ["Gardener", "Blacksmith", "Weaver", "Mason"]);

        const expected = ["TROWEL", "ANVIL", "LOOM"].flatMap((source) =>
          ["GARDENER", "SMITH", "WEAVER", "MASON"].map((target) => `${source} ${target}`),
        );

        assert.deepStrictEqual(valuesOf(root), expected);
        for (const control of controls) {
          assert.strictEqual(control.tag, "input");
          assert.strictEqual(control.attrs["type"], "checkbox");
          assert.strictEqual(control.attrs["name"], name);
          assert.isTrue(elementsIn(table).includes(control), "every control sits in the table");
        }

        assert.strictEqual(attributeOf(partOf(root, slots.root), "data-max-associations"), "3");
        assert.strictEqual(attributeOf(rows[0] ?? table, "data-match-max"), "2");
        assert.strictEqual(attributeOf(columns[0] ?? table, "data-match-max"), "1");
      }),
  );

  it.effect(
    "[Q-13] the corner cell carries data-first-column-header, and every cell's control is named by its row and column",
    () =>
      Effect.gen(function* naming() {
        const root = rootOf(yield* rendered(yield* opened("match.xml")));
        const corner = partOf(root, slots.corner);
        const rows = partsOf(root, slots.rowHeader);
        const columns = partsOf(root, slots.columnHeader);

        assert.strictEqual(textOf(corner), "Tool");

        for (const control of partsOf(root, slots.control)) {
          const [source = "", target = ""] = String(control.attrs["value"]).split(" ");
          const row = rows.find((header) => attributeOf(header, "data-identifier") === source);
          const column = columns.find(
            (header) => attributeOf(header, "data-identifier") === target,
          );
          const heard = nameOf(control, root);

          assert.isDefined(row);
          assert.isDefined(column);
          assert.include(heard, textOf(row ?? corner));
          assert.include(heard, textOf(column ?? corner));
        }

        const [first] = partsOf(root, slots.control);

        assert.strictEqual(nameOf(first ?? corner, root), "Trowel with Gardener");

        const group = partOf(root, slots.root);
        const prompt = partOf(root, slots.prompt);

        assert.strictEqual(group.attrs["role"], "group");
        assert.strictEqual(nameOf(group, root), "Match each tool with the trade that uses it.");
        assert.strictEqual(nameOf(partOf(root, slots.table), root), textOf(prompt));

        const bare = rootOf(
          yield* rendered(
            yield* opened("match.xml", (xml) =>
              xml.replace(' data-first-column-header="Tool"', ""),
            ),
          ),
        );

        assert.strictEqual(textOf(partOf(bare, slots.corner)), "");
      }),
  );

  it.effect(
    "[Q-13] a restored response checks its cells and the solution mode checks the correct ones",
    () =>
      Effect.gen(function* restoring() {
        const accepted = yield* opened("match.xml");
        const answer = pairValue(["TROWEL", "MASON"], ["LOOM", "WEAVER"]);
        const stored = yield* Effect.fromResult(score(accepted, { [response]: answer }));
        const restored = yield* Effect.fromResult(restore(accepted, stored));
        const answered = rootOf(yield* rendered(accepted, { values: restored.values }));

        assert.deepStrictEqual(restored.values, { [response]: answer });
        assert.deepStrictEqual(checkedOf(answered), ["TROWEL MASON", "LOOM WEAVER"]);
        assert.deepStrictEqual(checkedOf(rootOf(yield* rendered(accepted))), []);

        const correctValues = solution(accepted);

        assert.deepStrictEqual(correctValues, { [response]: correct });

        const solved = rootOf(
          yield* rendered(accepted, { mode: "solution", values: correctValues }),
        );

        assert.deepStrictEqual(checkedOf(solved), [
          "TROWEL GARDENER",
          "ANVIL SMITH",
          "LOOM WEAVER",
        ]);
        assert.isTrue(
          partsOf(solved, slots.control).every(
            (control) => control.attrs["disabled"] !== undefined,
          ),
          "a solution cannot be changed",
        );
        assert.strictEqual(partOf(solved, slots.root).attrs["data-mode"], "solution");

        const posted = rootOf(
          yield* rendered(accepted, {
            messages: [{ response, text: authorMax }],
            posted: { [response]: ["TROWEL GARDENER", "ANVIL MASON"] },
            values: { [response]: answer },
          }),
        );
        const controls = partsOf(posted, slots.control);

        assert.deepStrictEqual(checkedOf(posted), ["TROWEL GARDENER", "ANVIL MASON"]);
        assert.isTrue(controls.every((control) => control.attrs["aria-invalid"] === "true"));
        assert.deepStrictEqual(
          controls.map((control) => control.attrs["autofocus"] !== undefined),
          controls.map((_, index) => index === 0),
        );
      }),
  );

  it.effect(
    "[Q-13] shuffle orders each set by seed and instance and keeps fixed choices in place",
    () =>
      Effect.gen(function* shuffles() {
        const accepted = yield* opened("match-shuffle.xml");
        const sources = ["VIOLIN", "TRUMPET", "DRUM", "FLUTE", "PIANO"];
        const targets = ["STRINGS", "BRASS", "PERCUSSION", "WOODWIND", "KEYBOARD"];
        const first = ordersOf(rootOf(yield* rendered(accepted, { instance: "i1", seed: "s" })));
        const again = ordersOf(rootOf(yield* rendered(accepted, { instance: "i1", seed: "s" })));
        const other = ordersOf(rootOf(yield* rendered(accepted, { instance: "i2", seed: "s" })));
        const keyed = ordersOf(rootOf(yield* rendered(accepted, { instance: "i1", seed: "t" })));

        assert.deepStrictEqual(first, again);
        assert.notDeepEqual(first.rows, other.rows);
        assert.notDeepEqual(first.columns, other.columns);
        assert.notDeepEqual(first.rows, keyed.rows);
        assert.notDeepEqual(first.rows, sources);
        assert.notDeepEqual(first.columns, targets);
        for (const shown of [first, other, keyed]) {
          assert.sameMembers([...shown.rows], sources);
          assert.sameMembers([...shown.columns], targets);
          assert.strictEqual(shown.rows[2], "DRUM", "the fixed source keeps its index");
          assert.strictEqual(shown.columns[2], "PERCUSSION", "the fixed target keeps its index");
        }

        const shuffled = rootOf(yield* rendered(accepted, { instance: "i1", seed: "s" }));

        assert.deepStrictEqual(
          valuesOf(shuffled),
          first.rows.flatMap((source) => first.columns.map((target) => `${source} ${target}`)),
          "the cells follow the presented order of both sets",
        );

        const plain = ordersOf(rootOf(yield* rendered(yield* opened("match.xml"), { seed: "s" })));

        assert.deepStrictEqual(plain.rows, ["TROWEL", "ANVIL", "LOOM"]);
        assert.deepStrictEqual(plain.columns, ["GARDENER", "SMITH", "WEAVER", "MASON"]);
      }),
  );

  it.effect(
    "[Q-13] postings binds the response as directedPair and decode reads the checked cells",
    () =>
      Effect.gen(function* posting() {
        const accepted = yield* opened("match.xml");
        const listed = postings(redact(accepted), instance);

        assert.deepStrictEqual(
          listed.map(({ binding, identifier }) => ({ binding, identifier })),
          [
            {
              binding: { baseType: "directedPair", cardinality: "multiple", name },
              identifier: response,
            },
          ],
        );

        const [first] = listed;

        if (first === undefined) {
          assert.fail("the item has no posting for its Match");
        }

        assert.deepStrictEqual(
          decode(
            [
              [name, "TROWEL GARDENER"],
              [name, "LOOM WEAVER"],
            ],
            first.binding,
            first.options,
          ),
          Result.succeed(pairValue(["TROWEL", "GARDENER"], ["LOOM", "WEAVER"])),
        );
        assert.deepStrictEqual(
          decode([[name, "TROWEL"]], first.binding, first.options),
          Result.fail(new Malformed({ entry: name, reason: "identifier" })),
        );
      }),
  );

  it.effect("[Q-13] checkResponses: a choice over its match-max is refused in tier (a)", () =>
    Effect.gen(function* overMatchMax() {
      const accepted = yield* opened("match.xml");
      const source = yield* checked(accepted, pairValue(["ANVIL", "SMITH"], ["ANVIL", "MASON"]));
      const target = yield* checked(
        accepted,
        pairValue(["TROWEL", "GARDENER"], ["LOOM", "GARDENER"]),
      );

      assert.strictEqual(source.length, 1);
      assert.match(textsOf(source).join("\n"), /\bANVIL\b/u);
      assert.strictEqual(target.length, 1);
      assert.match(textsOf(target).join("\n"), /\bGARDENER\b/u);
      assert.deepStrictEqual(
        yield* checked(accepted, pairValue(["TROWEL", "GARDENER"], ["TROWEL", "MASON"])),
        [],
        "a source with match-max 2 may be in two pairs",
      );
      assert.deepStrictEqual(
        yield* checked(accepted, pairValue(["ANVIL", "SMITH"], ["ANVIL", "MASON"]), true),
        source,
      );
    }),
  );

  it.effect("[Q-13] checkResponses: a pair outside a match-group is refused in tier (a)", () =>
    Effect.gen(function* outsideMatchGroup() {
      const accepted = yield* opened("match-shuffle.xml");
      const messages = yield* checked(accepted, pairValue(["VIOLIN", "BRASS"]));

      assert.strictEqual(messages.length, 1);
      assert.match(textsOf(messages).join("\n"), /\bVIOLIN\b.*\bBRASS\b/u);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["VIOLIN", "STRINGS"])), []);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["VIOLIN", "KEYBOARD"])), []);
      assert.deepStrictEqual(yield* checked(accepted, pairValue(["TRUMPET", "BRASS"])), []);

      const unknown = message("en", "unknownChoice");

      assert.deepStrictEqual(textsOf(yield* checked(accepted, pairValue(["VIOLIN", "NOPE"]))), [
        unknown,
      ]);
      assert.deepStrictEqual(
        textsOf(yield* checked(accepted, pairValue(["STRINGS", "VIOLIN"]))),
        [unknown],
        "a pair runs from the first set to the second",
      );
    }),
  );

  it.effect(
    "[Q-13] checkResponses: above max-associations always, below min-associations only under validateResponses",
    () =>
      Effect.gen(function* associationBounds() {
        const accepted = yield* opened("match.xml");
        const four = pairValue(
          ["TROWEL", "GARDENER"],
          ["TROWEL", "MASON"],
          ["ANVIL", "SMITH"],
          ["LOOM", "WEAVER"],
        );

        for (const validateResponses of [false, true]) {
          assert.deepStrictEqual(textsOf(yield* checked(accepted, four, validateResponses)), [
            authorMax,
          ]);
        }

        assert.deepStrictEqual(yield* checked(accepted, correct), []);
        assert.deepStrictEqual(yield* checked(accepted, correct, true), []);

        const floored = yield* opened("match.xml", (xml) =>
          edited(xml, 'max-associations="3"', 'max-associations="3" min-associations="1"'),
        );

        assert.deepStrictEqual(yield* checked(floored, pairValue()), []);
        assert.deepStrictEqual(yield* checked(floored), []);
        assert.deepStrictEqual(textsOf(yield* checked(floored, pairValue(), true)), [authorMin]);
        assert.deepStrictEqual(textsOf(yield* checked(floored, undefined, true)), [authorMin]);
        assert.deepStrictEqual(yield* checked(floored, pairValue(["LOOM", "WEAVER"]), true), []);

        const plain = yield* opened("match.xml", (xml) =>
          edited(
            xml.replaceAll(/\s+data-m(?:in|ax)-selections-message="[^"]*"/gu, ""),
            'max-associations="3"',
            'max-associations="3" min-associations="1"',
          ),
        );

        assert.deepStrictEqual(textsOf(yield* checked(plain, four)), [
          message("en", "atMost", { n: "3" }),
        ]);
        assert.deepStrictEqual(textsOf(yield* checked(plain, pairValue(), true)), [
          message("en", "atLeast", { n: "1" }),
        ]);

        const single = yield* opened("match.xml", (xml) =>
          edited(xml, ' max-associations="3"', ""),
        );

        assert.deepStrictEqual(
          textsOf(yield* checked(single, correct)),
          [authorMax],
          "an unwritten max-associations is 1, in the author's words",
        );
        assert.deepStrictEqual(yield* checked(single, pairValue(["ANVIL", "SMITH"])), []);

        const wordless = yield* opened("match.xml", (xml) =>
          edited(
            xml.replaceAll(/\s+data-m(?:in|ax)-selections-message="[^"]*"/gu, ""),
            ' max-associations="3"',
            "",
          ),
        );

        assert.deepStrictEqual(textsOf(yield* checked(wordless, correct)), [
          message("en", "atMost", { n: "1" }),
        ]);

        const unlimited = yield* opened("match.xml", (xml) =>
          edited(xml, 'max-associations="3"', 'max-associations="0"'),
        );

        assert.deepStrictEqual(yield* checked(unlimited, four), []);
      }),
  );

  it.effect("[Q-13] score maps the pairs", () =>
    Effect.gen(function* scoring() {
      const accepted = yield* opened("match.xml");
      const maximum = yield* scoreAfter(accepted, correct);

      assert.strictEqual(maximum, 3);
      assert.isBelow(
        yield* scoreAfter(
          accepted,
          pairValue(["TROWEL", "GARDENER"], ["ANVIL", "SMITH"], ["LOOM", "MASON"]),
        ),
        maximum,
      );
      assert.strictEqual(yield* scoreAfter(accepted, pairValue(["LOOM", "WEAVER"])), 1);
      assert.strictEqual(yield* scoreAfter(accepted, pairValue()), 0);

      const refused = score(accepted, {
        [response]: pairValue(["ANVIL", "SMITH"], ["ANVIL", "MASON"]),
      });

      assert.isTrue(
        Result.isFailure(refused) && refused.failure instanceof ResponsesRefused,
        "score takes only the pairs the Match accepts, a choice over its match-max refused",
      );
    }),
  );

  it.effect("[Q-13] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* accessible() {
      const tools = yield* opened("match.xml");
      const instruments = yield* opened("match-shuffle.xml");
      const states = [
        yield* rendered(tools),
        yield* rendered(tools, { mode: "review", values: { [response]: correct } }),
        yield* rendered(tools, { mode: "solution", values: solution(tools) }),
        yield* rendered(tools, { disabled: true }),
        yield* rendered(tools, {
          messages: [{ response, text: authorMax }],
          posted: { [response]: ["TROWEL GARDENER", "ANVIL MASON"] },
        }),
        yield* rendered(tools, { names: { [response]: "answer-1" } }),
        yield* rendered(instruments, { seed: "s" }),
        yield* rendered(instruments, { seed: "s", values: solution(instruments) }),
      ];

      for (const [index, html] of states.entries()) {
        const root = rootOf(html);
        const table = partOf(root, slots.table);
        const columns = partsOf(root, slots.columnHeader);

        assert.strictEqual(
          partsOf(root, slots.control).length,
          index < 6 ? 12 : 25,
          `state ${String(index)} holds its controls`,
        );
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), [], `state ${String(index)}`);
        assert.isTrue(roundTrips(root), `state ${String(index)} round-trips`);
        assert.isTrue(
          columns.every((column) => column.attrs["scope"] === "col"),
          `state ${String(index)}: every column header has scope col`,
        );

        for (const cell of partsOf(root, slots.cell)) {
          const row = rowAround(table, cell);
          const header = row.children.find(
            (child): child is Element =>
              child.kind === "element" && child.attrs["data-slot"] === slots.rowHeader,
          );
          const position = row.children
            .filter((child): child is Element => child.kind === "element")
            .indexOf(cell);

          assert.isDefined(header, `state ${String(index)}: a cell's row has a row header`);
          assert.strictEqual(header?.attrs["scope"], "row");
          assert.isDefined(
            columns[position - 1],
            `state ${String(index)}: a cell's column has a column header`,
          );
          assert.strictEqual(
            elementsIn(cell).filter((element) => element.attrs["data-slot"] === slots.control)
              .length,
            1,
            `state ${String(index)}: a cell holds one control`,
          );
        }
      }

      const named = rootOf(states[5] ?? "");

      assert.isTrue(
        partsOf(named, slots.control).every((control) => control.attrs["name"] === "answer-1"),
      );

      const finished = rootOf(states[3] ?? "");

      assert.isTrue(
        partsOf(finished, slots.control).every((control) => control.attrs["disabled"] === ""),
      );
      assert.strictEqual(partOf(finished, slots.root).attrs["data-disabled"], "");
    }),
  );

  it.effect("[Q-13] redact's copy holds no correct response", () =>
    Effect.gen(function* redacting() {
      for (const file of fixtures) {
        const accepted = yield* opened(file);
        const encoded = yield* Effect.fromResult(encodeRedacted(redact(accepted)));
        const written = JSON.stringify(encoded);

        assert.include(written, '"kind":"match"', `${file} holds its Match`);
        assert.notMatch(written, /correct/iu, `${file} writes no correct response`);
        assert.notInclude(written, "qti-value");
        assert.notInclude(written, "SCORE");
        for (const pair of [
          "TROWEL GARDENER",
          "ANVIL SMITH",
          "LOOM WEAVER",
          "VIOLIN STRINGS",
          "DRUM PERCUSSION",
        ]) {
          assert.notInclude(written, pair, file);
        }

        assert.deepStrictEqual(
          encoded.responses.map((binding) => Object.keys(binding).toSorted()),
          [["baseType", "cardinality", "identifier"]],
          `${file} lists the binding alone`,
        );

        const configuration = yield* configure({ seed: "s" });
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

  it.effect("[Q-13] a host overrides each Match part, and plate keeps what it computed there", () =>
    Effect.gen(function* overriding() {
      const accepted = yield* opened("match.xml");
      const root = rootOf(
        yield* rendered(accepted, {
          parts: {
            "match-interaction": {
              control: () =>
                h("input", {
                  checked: true,
                  disabled: true,
                  id: "evil",
                  name: "evil",
                  type: "text",
                  value: "evil",
                }),
              prompt: swap("p"),
              root: (_props, children) =>
                h("section", { "aria-labelledby": "evil", role: "presentation" }, children),
            },
          },
        }),
      );
      const group = partOf(root, slots.root);
      const [first] = partsOf(root, slots.control);

      assert.strictEqual(group.tag, "section");
      assert.strictEqual(group.attrs["role"], "group");
      assert.strictEqual(group.attrs["aria-labelledby"], `${instance}-${response}-prompt`);
      assert.strictEqual(partOf(root, slots.prompt).tag, "p");
      assert.deepStrictEqual(
        [first?.attrs["name"], first?.attrs["type"], first?.attrs["value"]],
        [name, "checkbox", "TROWEL GARDENER"],
      );
      assert.isUndefined(first?.attrs["checked"], "a Control plate leaves unchecked stays so");
      assert.isUndefined(first?.attrs["disabled"], "and one plate leaves enabled");
      assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
    }),
  );
});
