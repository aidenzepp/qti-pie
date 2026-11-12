/**
 * Regression tests for six ALF-themed sample items a downstream user reported as unsupported on
 * 2026-11-12. Each item is a match, gap-match or order interaction, in a text and a picture form.
 * The fixtures are in `fixtures/regress/reported-2026-11-12/`, with their relative image hrefs
 * intact.
 *
 * Each item has three cases: it opens, it renders its interaction, and its key scores to the
 * maximum. A case that fails on main today is an expected failure (`it.effect.fails`) with a note
 * of why, so the suite stays green and the case fails loudly once the implementation lands and the
 * marker has to go.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { configure, open, redact, render, score } from "#plate/index.ts";
import type { Element, Node, Value } from "#plate/index.ts";
import type { Single } from "#plate/model/values.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

const dir = path.resolve(import.meta.dirname, "..", "fixtures", "regress", "reported-2026-11-12");

/**
 * The interaction an item holds, which fixes the shape of its key.
 */
type Kind = "gap-match" | "match" | "order";

/**
 * One reported item: its file, interaction, and whether it is a picture item, whose `style`
 * attributes `open` refuses today.
 */
interface Item {
  readonly kind: Kind;
  readonly name: string;
  readonly picture: boolean;
}

const items: readonly Item[] = [
  { kind: "match", name: "sample-alf-match-text", picture: false },
  { kind: "match", name: "sample-alf-match-picture", picture: true },
  { kind: "gap-match", name: "sample-alf-gap-match-text", picture: false },
  { kind: "gap-match", name: "sample-alf-gap-match-picture", picture: true },
  { kind: "order", name: "sample-alf-order-text", picture: false },
  { kind: "order", name: "sample-alf-order-picture", picture: true },
];

/**
 * The expected failure's reason, by item: a text item opens but its interaction is a stub notice;
 * a picture item is refused for its `style` attribute.
 */
const reasonOf = (item: Item): string =>
  item.picture
    ? "the item is refused: unknown-attribute on `style` (picture item)"
    : `stub interaction: qti-${item.kind}-interaction renders as a "Not supported here" notice`;

const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Every token the rendered tree carries: its attribute values, split on whitespace, and its text.
 */
const tokensOf = (nodes: readonly Node[]): ReadonlySet<string> => {
  const found = new Set<string>();
  const walk = (level: readonly Node[]): void => {
    for (const node of level) {
      if (node.kind === "element") {
        for (const value of Object.values(node.attrs)) {
          for (const token of String(value).split(/\s+/u)) {
            found.add(token);
          }
        }
        walk(node.children);
      } else {
        for (const token of node.text.split(/\s+/u)) {
          found.add(token);
        }
      }
    }
  };

  walk(nodes);

  return found;
};

/**
 * Read an item's bytes and open it.
 */
const openItem = Effect.fnUntraced(function* openItem(name: string) {
  const bytes = yield* Effect.promise(() => readFile(path.join(dir, "items", `${name}.xml`)));

  return {
    text: new TextDecoder().decode(bytes),
    verdict: yield* open(`items/${name}.xml`, bytes),
  };
});

/**
 * The identifiers an item declares for its choices, gaps and associables.
 */
const declaredIdentifiers = (text: string): readonly string[] =>
  [
    ...text.matchAll(
      /<qti-(?:simple-associable-choice|simple-choice|gap-text|gap)\s[^>]*?identifier="(?<id>[^"]+)"/gu,
    ),
  ].flatMap((found) => (found.groups?.["id"] === undefined ? [] : [found.groups["id"]]));

/**
 * The key an item declares, as the response value a candidate who answered correctly gives.
 */
const keyOf = (text: string, kind: Kind): Value => {
  const block =
    /<qti-correct-response>(?<body>.*?)<\/qti-correct-response>/su.exec(text)?.groups?.["body"] ??
    "";
  const values = [...block.matchAll(/<qti-value>(?<value>[^<]*)<\/qti-value>/gu)].map(
    (found) => found.groups?.["value"] ?? "",
  );

  if (kind === "order") {
    return {
      baseType: "identifier",
      cardinality: "ordered",
      values: values.map((value): Single => ({ baseType: "identifier", value })),
    };
  }

  return {
    baseType: "directedPair",
    cardinality: "multiple",
    values: values.map((value): Single => {
      const [source = "", target = ""] = value.split(" ");

      return { baseType: "directedPair", value: [source, target] };
    }),
  };
};

/**
 * Register an expected failure for a case that fails today, or an ordinary case that passes.
 */
const caseOf = (failsToday: boolean) => (failsToday ? it.effect.fails : it.effect);

describe.each(items)("regression: $name (reported 2026-11-12)", (item) => {
  // Passes for a text item (accepted with unsupported features); fails for a picture item.
  caseOf(item.picture)(`opens${item.picture ? ` [expected fail: ${reasonOf(item)}]` : ""}`, () =>
    Effect.gen(function* opens() {
      const { verdict } = yield* openItem(item.name);

      assert.notStrictEqual(verdict.verdict, "refused", `${item.name} is refused`);
    }),
  );

  // Fails today for every item: the interaction is a stub notice (text), or the item is refused.
  caseOf(true)(`renders the interaction [expected fail: ${reasonOf(item)}]`, () =>
    Effect.gen(function* renders() {
      const { text, verdict } = yield* openItem(item.name);
      const accepted = Option.getOrElse(acceptedItem(verdict), () =>
        assert.fail(`${item.name} is ${verdict.verdict}`),
      );
      const configuration = yield* configure({});
      const rendered = yield* Effect.fromResult(
        render(redact(accepted), configuration, { instance: "regress" }),
      );
      const tree = parseHtml(rendered.html);

      assert.notInclude(rendered.html, "Not supported here", "an unsupported notice is shown");
      assert.isAbove(elementsOf(tree).length, 0);

      const tokens = tokensOf(tree);
      const missing = declaredIdentifiers(text).filter((identifier) => !tokens.has(identifier));

      assert.deepStrictEqual(missing, [], "identifiers declared but not rendered");
    }),
  );

  // Fails today for a picture item (not accepted); the text items score, as match_correct-style
  // processing runs over the declared key whatever the stub renders.
  caseOf(item.picture)(
    `scores the key${item.picture ? ` [expected fail: ${reasonOf(item)}]` : ""}`,
    () =>
      Effect.gen(function* scoresKey() {
        const { text, verdict } = yield* openItem(item.name);
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`${item.name} is ${verdict.verdict}`),
        );
        const record = yield* Effect.fromResult(
          score(accepted, { RESPONSE: keyOf(text, item.kind) }),
        );
        const scores = record.outcomes["SCORE"]?.values.map((single) => single.value) ?? [];

        assert.deepStrictEqual(scores, [1]);
      }),
  );
});
