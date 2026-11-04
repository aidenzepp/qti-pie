import { assert, describe, it } from "@effect/vitest";
import { Duration, Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { attr, doc, el, text, xmlNamespace } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { runAttempt } from "#plate/engine/attempt.ts";
import { validateChoice } from "#plate/interactions/choice.ts";
import { message } from "#plate/messages.ts";
import { buildItem } from "#plate/model/item.ts";
import type {
  BodyNode,
  Branch,
  ChoiceInteraction,
  Expression,
  Item,
  Rule,
  TextEntryInteraction,
  UnsupportedFeature,
} from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { float } from "#plate/test/fixtures.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";

/**
 * The path of the item root, which every path in these tests starts with.
 */
const root = "qti-assessment-item";

/**
 * The path of the item body.
 */
const body = `${root}/qti-item-body`;

/**
 * Construct a declaration with its three attributes.
 *
 * @param local `qti-response-declaration` or `qti-outcome-declaration`.
 * @param identifier The declared identifier.
 * @param baseType The `base-type` value.
 * @param cardinality The `cardinality` value.
 * @param children The declaration's children, none by default.
 * @returns The declaration element.
 */
const declaration = (
  local: "qti-outcome-declaration" | "qti-response-declaration",
  identifier: string,
  baseType: string,
  cardinality: string,
  children: readonly SourceChild[] = [],
): SourceElement =>
  el(
    local,
    [attr("base-type", baseType), attr("cardinality", cardinality), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a container of `qti-value` children, such as `qti-correct-response`.
 *
 * @param local The container's name.
 * @param values Each value's text.
 * @returns The container element.
 */
const values = (local: string, ...texts: readonly string[]): SourceElement =>
  el(
    local,
    [],
    texts.map((value) => el("qti-value", [], [text(value)])),
  );

/**
 * Construct a `qti-simple-choice` holding only text.
 *
 * @param identifier The choice's identifier.
 * @param label The choice's text.
 * @returns The choice element.
 */
const choice = (identifier: string, label: string): SourceElement =>
  el("qti-simple-choice", [attr("identifier", identifier)], [text(label)]);

/**
 * Construct a `qti-response-processing` that names a built-in template by its purl URI.
 *
 * @param name The template's file name, with or without `.xml`.
 * @returns The processing element.
 */
const template = (name: string): SourceElement =>
  el("qti-response-processing", [
    attr("template", `https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/${name}`),
  ]);

/**
 * Construct a `qti-set-outcome-value` of `SCORE` to a float base value.
 *
 * @param value The base value's text.
 * @returns The rule element.
 */
const setScore = (value: string): SourceElement =>
  el(
    "qti-set-outcome-value",
    [attr("identifier", "SCORE")],
    [el("qti-base-value", [attr("base-type", "float")], [text(value)])],
  );

/**
 * `match_correct`'s rules as `ea422814` §5.1 quotes the template, written inline.
 *
 * @returns The inline processing element.
 */
const matchCorrectBlock = (): SourceElement =>
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-response-condition",
        [],
        [
          el(
            "qti-response-if",
            [],
            [
              el(
                "qti-match",
                [],
                [
                  el("qti-variable", [attr("identifier", "RESPONSE")]),
                  el("qti-correct", [attr("identifier", "RESPONSE")]),
                ],
              ),
              setScore("1"),
            ],
          ),
          el("qti-response-else", [], [setScore("0")]),
        ],
      ),
    ],
  );

/**
 * Construct an item document from its parts.
 *
 * @param parts The root's extra attributes, the declarations, the body's children and what follows
 *   the body.
 * @returns The document at `items/test.xml`.
 */
const item = (parts: {
  readonly after?: readonly SourceElement[];
  readonly attributes?: readonly SourceAttribute[];
  readonly body: readonly SourceChild[];
  readonly declarations: readonly SourceElement[];
}): SourceDocument =>
  doc(
    "items/test.xml",
    el(
      root,
      [attr("identifier", "item"), attr("title", "Item"), ...(parts.attributes ?? [])],
      [...parts.declarations, el("qti-item-body", [], parts.body), ...(parts.after ?? [])],
    ),
  );

/**
 * A BG007-shaped item: an identifier `RESPONSE` whose correct response is `true`, a float `SCORE`
 * with default 1, and a two-choice interaction with `max-choices="1"`.
 *
 * @param processing The item's response processing.
 * @returns The document at `items/BG007.xml`.
 */
const bg007 = (processing: SourceElement): SourceDocument =>
  doc(
    "items/BG007.xml",
    el(
      root,
      [
        attr("identifier", "beginnersguide007"),
        attr("title", "BG true false example "),
        attr("lang", "en-US", xmlNamespace),
      ],
      [
        declaration("qti-response-declaration", "RESPONSE", "identifier", "single", [
          values("qti-correct-response", "true"),
        ]),
        declaration("qti-outcome-declaration", "SCORE", "float", "single", [
          values("qti-default-value", "1"),
        ]),
        el(
          "qti-item-body",
          [],
          [
            el("p", [], [text("This is a True/False question?")]),
            el(
              "qti-choice-interaction",
              [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
              [choice("true", "True"), choice("false", "False")],
            ),
          ],
        ),
        processing,
      ],
    ),
  );

/**
 * A float `RESPONSE` whose correct response is 1.5, a float `SCORE` with no default, and
 * `match_correct`.
 *
 * @param templating What follows the declarations, such as a `qti-template-processing`; nothing
 *   by default.
 * @returns The document at `items/test.xml`.
 */
const floatMatchCorrect = (templating: readonly SourceElement[] = []): SourceDocument =>
  item({
    after: [template("match_correct")],
    body: [],
    declarations: [
      declaration("qti-response-declaration", "RESPONSE", "float", "single", [
        values("qti-correct-response", "1.5"),
      ]),
      declaration("qti-outcome-declaration", "SCORE", "float", "single"),
      ...templating,
    ],
  });

/**
 * A `qti-template-processing` that sets `RESPONSE`'s correct response to the float 2.5.
 */
const setsCorrectResponse: SourceElement = el(
  "qti-template-processing",
  [],
  [
    el(
      "qti-set-correct-response",
      [attr("identifier", "RESPONSE")],
      [el("qti-base-value", [attr("base-type", "float")], [text("2.5")])],
    ),
  ],
);

/**
 * Set `SCORE` to a float.
 *
 * @param value The number.
 * @returns The rule.
 */
const scoreRule = (value: number): Rule => ({
  expression: { kind: "base-value", value: float(value) },
  identifier: "SCORE",
  kind: "set-outcome",
});

/**
 * Construct a branch of a condition.
 *
 * @param when Its condition.
 * @param then The rules it runs.
 * @returns The branch.
 */
// oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the phase-1 slice list fixes; it is an array, never a function.
const branch = (when: Expression, then: readonly Rule[]): Branch => ({ then, when });

/**
 * `match_correct` as a rule tree: `SCORE` is 1 when `RESPONSE` matches its correct response, else
 * 0.
 */
const matchCorrect: readonly Rule[] = [
  {
    branches: [
      branch(
        {
          kind: "match",
          operands: [
            { identifier: "RESPONSE", kind: "variable" },
            { identifier: "RESPONSE", kind: "correct" },
          ],
        },
        [scoreRule(1)],
      ),
    ],
    kind: "condition",
    otherwise: Option.some([scoreRule(0)]),
  },
];

/**
 * An item whose body is one `qti-choice-interaction` bound to a single identifier response.
 *
 * @param attributes The interaction's attributes beside `response-identifier`.
 * @returns The document at `items/test.xml`.
 */
const choiceItem = (attributes: readonly SourceAttribute[]): SourceDocument =>
  item({
    body: [
      el(
        "qti-choice-interaction",
        [...attributes, attr("response-identifier", "RESPONSE")],
        [choice("A", "Ant"), choice("B", "Bee")],
      ),
    ],
    declarations: [declaration("qti-response-declaration", "RESPONSE", "identifier", "single")],
  });

/**
 * An item whose body is one `qti-text-entry-interaction` bound to a single integer response.
 *
 * @param attributes The interaction's attributes beside `response-identifier`.
 * @returns The document at `items/test.xml`.
 */
const textEntryItem = (attributes: readonly SourceAttribute[]): SourceDocument =>
  item({
    body: [
      el(
        "p",
        [],
        [
          el("qti-text-entry-interaction", [
            ...attributes,
            attr("response-identifier", "RESPONSE"),
          ]),
        ],
      ),
    ],
    declarations: [declaration("qti-response-declaration", "RESPONSE", "integer", "single")],
  });

/**
 * Find the one Choice model among body nodes.
 *
 * @param nodes The nodes to search.
 * @returns The Choice model; the test fails when there is none.
 */
const choiceIn = (nodes: readonly BodyNode[]): ChoiceInteraction => {
  const found = nodes.find((node): node is ChoiceInteraction => node.kind === "choice");
  assert.isDefined(found);

  return found;
};

/**
 * The children of a body element.
 *
 * @param node A body node.
 * @returns Its children; the test fails when it is not an element.
 */
const childrenOf = (node: BodyNode | undefined): readonly BodyNode[] => {
  assert.strictEqual(node?.kind, "element");

  return node?.kind === "element" ? node.children : [];
};

/**
 * The template declarations the growth check builds first, before it builds {@link growthFactor}
 * times as many.
 */
const fewerDeclarations = 1000;

/**
 * The growth check and its control build 8,000 declarations three times and 1,000 declarations 24
 * times. A quadratic record took about 4 s of that, which nears vitest's default of 5 s, and a
 * failing check should report its ratio, not a timeout.
 */
const growthTimeoutMs = 60_000;

/**
 * An item with `count` template declarations and an empty body. The model does not read a template
 * declaration, so each is one unsupported feature at its own path.
 *
 * @param count How many declarations the item holds.
 * @returns The document at `items/test.xml`.
 */
const templated = (count: number): SourceDocument =>
  item({
    body: [],
    declarations: Array.from({ length: count }, (_, index) =>
      el("qti-template-declaration", [
        attr("base-type", "integer"),
        attr("cardinality", "single"),
        attr("identifier", `T${index}`),
      ]),
    ),
  });

/**
 * The growth check's control, a deliberately quadratic dedupe: the scan `buildItem` made before it
 * kept each feature's paths in a set, which compares each entry with every entry kept so far.
 *
 * @param entries The features, in document order.
 * @returns The features once per feature and path, in document order.
 */
const dedupeQuadratically = (
  entries: readonly UnsupportedFeature[],
): readonly UnsupportedFeature[] => {
  const kept: UnsupportedFeature[] = [];
  for (const entry of entries) {
    if (!kept.some((held) => held.feature === entry.feature && held.path === entry.path)) {
      kept.push(entry);
    }
  }

  return kept;
};

describe("buildItem", () => {
  it.effect(
    "[I-0] [I-1] [I-2] [I-7] [Q-2] [I-9b] builds BG007's Choice, and its template's rule tree is the inline block's",
    () =>
      Effect.gen(function* buildsBg007() {
        const built: Item = yield* buildItem(bg007(template("match_correct")));
        const inline = yield* buildItem(bg007(matchCorrectBlock()));
        const interaction = choiceIn(built.body);

        assert.strictEqual(built.document, "items/BG007.xml");
        assert.strictEqual(built.identifier, "beginnersguide007");
        assert.strictEqual(built.title, "BG true false example ");
        assert.deepStrictEqual(built.lang, Option.some("en-US"));
        assert.deepStrictEqual(
          built.body.map((node) => node.kind),
          ["element", "choice"],
        );
        assert.deepStrictEqual(
          interaction.choices.map((option) => option.identifier),
          ["true", "false"],
        );
        assert.deepStrictEqual(interaction.choices[0]?.content, [{ kind: "text", text: "True" }]);
        assert.strictEqual(interaction.response, "RESPONSE");
        assert.strictEqual(interaction.cardinality, "single");
        assert.strictEqual(interaction.maxChoices, 1n);
        assert.strictEqual(interaction.minChoices, 0n);
        assert.strictEqual(interaction.shuffle, false);
        assert.strictEqual(interaction.path, `${body}/qti-choice-interaction`);
        assert.deepStrictEqual(
          built.responses.get("RESPONSE")?.correct,
          Option.some<Value>({
            baseType: "identifier",
            cardinality: "single",
            values: [{ baseType: "identifier", value: "true" }],
          }),
        );
        assert.deepStrictEqual(built.outcomes.get("SCORE")?.defaultValue, Option.some(float(1)));
        assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
        assert.deepStrictEqual(inline.processing, built.processing);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect("[I-9b] resolves map_response to its rule tree and reads the mapping", () =>
    Effect.gen(function* buildsMapResponse() {
      const built = yield* buildItem(
        item({
          after: [template("map_response.xml")],
          body: [el("qti-text-entry-interaction", [attr("response-identifier", "RESPONSE")])],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "string", "single", [
              el(
                "qti-mapping",
                [attr("default-value", "0")],
                [
                  el("qti-map-entry", [
                    attr("case-sensitive", "true"),
                    attr("map-key", "York"),
                    attr("mapped-value", "1"),
                  ]),
                  el("qti-map-entry", [attr("map-key", "york"), attr("mapped-value", "0.5")]),
                ],
              ),
            ]),
            declaration("qti-outcome-declaration", "SCORE", "float", "single"),
          ],
        }),
      );

      assert.deepStrictEqual(
        built.processing,
        Option.some<readonly Rule[]>([
          {
            branches: [
              branch({ kind: "is-null", operand: { identifier: "RESPONSE", kind: "variable" } }, [
                scoreRule(0),
              ]),
            ],
            kind: "condition",
            otherwise: Option.some([
              {
                expression: { identifier: "RESPONSE", kind: "map-response" },
                identifier: "SCORE",
                kind: "set-outcome",
              },
            ]),
          },
        ]),
      );
      assert.deepStrictEqual(
        built.responses.get("RESPONSE")?.mapping,
        Option.some({
          defaultValue: 0,
          entries: [
            { caseSensitive: true, key: { baseType: "string", value: "York" }, value: 1 },
            { caseSensitive: false, key: { baseType: "string", value: "york" }, value: 0.5 },
          ],
          lowerBound: Option.none(),
          upperBound: Option.none(),
        }),
      );
    }),
  );

  it.effect("[I-7] shows a hotspot interaction as a notice and keeps the rest of the body", () =>
    Effect.gen(function* hotspotIsNotice() {
      const built = yield* buildItem(
        item({
          body: [
            el("p", [], [text("Which one is Highland Lighthouse?")]),
            el(
              "qti-hotspot-interaction",
              [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
              [
                el("qti-prompt", [], [text("Pick one")]),
                el("img", [attr("alt", "a map"), attr("src", "images/map.svg")]),
                el("qti-hotspot-choice", [attr("coords", "418,29,40"), attr("identifier", "R")]),
              ],
            ),
            el("p", [], [text("After")]),
          ],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
          ],
        }),
      );
      const path = `${body}/qti-hotspot-interaction`;

      assert.deepStrictEqual(built.body[1], {
        feature: "qti-hotspot-interaction",
        kind: "unsupported",
        path,
      });
      assert.deepStrictEqual(
        built.body.map((node) => node.kind),
        ["element", "unsupported", "element"],
      );
      assert.deepStrictEqual(childrenOf(built.body[2]), [{ kind: "text", text: "After" }]);
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-hotspot-interaction", path, shown: "notice" },
      ]);
    }),
  );

  it.effect('[Q-2] marks shuffle="true" and keeps the choices in document order', () =>
    Effect.gen(function* shuffleIsMark() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-choice-interaction",
              [attr("response-identifier", "RESPONSE"), attr("shuffle", "true")],
              [choice("C", "Cat"), choice("A", "Ant"), choice("B", "Bee")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "identifier", "multiple"),
          ],
        }),
      );
      const interaction = choiceIn(built.body);

      assert.deepStrictEqual(
        interaction.choices.map((option) => option.identifier),
        ["C", "A", "B"],
      );
      assert.strictEqual(interaction.shuffle, true);
      assert.strictEqual(interaction.cardinality, "multiple");
      assert.deepStrictEqual(built.unsupported, [
        { feature: 'shuffle="true"', path: `${body}/qti-choice-interaction`, shown: "mark" },
      ]);
    }),
  );

  it.effect(
    "[I-0] [Q-2] marks adaptive and shuffle when true or 1, and neither when false or 0",
    () =>
      Effect.gen(function* booleanMarks() {
        const cases = [
          ["true", true],
          ["1", true],
          [" 1 ", true],
          ["false", false],
          ["0", false],
        ] as const;

        for (const [written, on] of cases) {
          const built = yield* buildItem(
            item({
              attributes: [attr("adaptive", written)],
              body: [
                el(
                  "qti-choice-interaction",
                  [attr("response-identifier", "RESPONSE"), attr("shuffle", written)],
                  [choice("A", "Ant"), choice("B", "Bee")],
                ),
              ],
              declarations: [
                declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
              ],
            }),
          );

          assert.strictEqual(choiceIn(built.body).shuffle, on, written);
          assert.deepStrictEqual(
            built.unsupported,
            on
              ? [
                  { feature: 'adaptive="true"', path: root, shown: "mark" },
                  {
                    feature: 'shuffle="true"',
                    path: `${body}/qti-choice-interaction`,
                    shown: "mark",
                  },
                ]
              : [],
            written,
          );
        }
      }),
  );

  it.effect("[Q-2] reads a Choice's aria-label and aria-labelledby, none when absent", () =>
    Effect.gen(function* choiceNames() {
      const named = choiceIn(
        (yield* buildItem(
          choiceItem([attr("aria-label", "Pick a city"), attr("aria-labelledby", "intro")]),
        )).body,
      );
      const unnamed = choiceIn((yield* buildItem(choiceItem([]))).body);

      assert.deepStrictEqual(named.ariaLabel, Option.some("Pick a city"));
      assert.deepStrictEqual(named.ariaLabelledby, Option.some("intro"));
      assert.deepStrictEqual(unnamed.ariaLabel, Option.none());
      assert.deepStrictEqual(unnamed.ariaLabelledby, Option.none());
    }),
  );

  it.effect("[Q-20] builds a Text Entry with its attributes and base 10 by default", () =>
    Effect.gen(function* buildsTextEntry() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "p",
              [],
              [
                text("Capital: "),
                el("qti-text-entry-interaction", [
                  attr("expected-length", " 12 "),
                  attr("placeholder-text", "a city"),
                  attr("response-identifier", "RESPONSE"),
                ]),
              ],
            ),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );
      const expected: TextEntryInteraction = {
        ariaLabel: Option.none(),
        ariaLabelledby: Option.none(),
        base: 10,
        baseType: "string",
        class: "",
        expectedLength: Option.some(12n),
        kind: "text-entry",
        path: `${body}/p/qti-text-entry-interaction`,
        patternMaskMessage: Option.none(),
        placeholder: Option.some("a city"),
        response: "RESPONSE",
      };

      assert.deepStrictEqual(childrenOf(built.body[0]), [
        { kind: "text", text: "Capital: " },
        expected,
      ]);
    }),
  );

  it.effect("[Q-20] shows a Text Entry with pattern-mask as the notice pattern-mask", () =>
    Effect.gen(function* patternMaskIsNotice() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "p",
              [],
              [
                el("qti-text-entry-interaction", [
                  attr("pattern-mask", "[A-Z]+"),
                  attr("response-identifier", "RESPONSE"),
                ]),
              ],
            ),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );
      const path = `${body}/p/qti-text-entry-interaction`;

      assert.deepStrictEqual(childrenOf(built.body[0]), [
        { feature: "pattern-mask", kind: "unsupported", path },
      ]);
      assert.deepStrictEqual(built.unsupported, [
        { feature: "pattern-mask", path, shown: "notice" },
      ]);
    }),
  );

  it.effect("[Q-5] builds an Extended Text with its prompt and format", () =>
    Effect.gen(function* buildsExtendedText() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-extended-text-interaction",
              [
                attr("expected-lines", "5"),
                attr("format", "preformatted"),
                attr("response-identifier", "RESPONSE"),
              ],
              [el("qti-prompt", [], [text("Write a poem.")])],
            ),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );
      const [node] = built.body;

      assert.strictEqual(node?.kind, "extended-text");
      assert.deepStrictEqual(
        node?.kind === "extended-text" ? [node.format, node.expectedLines, node.prompt] : [],
        ["preformatted", Option.some(5n), Option.some([{ kind: "text", text: "Write a poem." }])],
      );
    }),
  );

  it.effect("[Q-32] shows a portable custom interaction as a notice", () =>
    Effect.gen(function* pciIsNotice() {
      const path = `${body}/qti-portable-custom-interaction`;
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-portable-custom-interaction",
              [attr("module", "fractions"), attr("response-identifier", "RESPONSE")],
              [el("qti-interaction-markup", [], [el("div", [], [text("Loading")])])],
            ),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );

      assert.deepStrictEqual(built.body, [
        { feature: "qti-portable-custom-interaction", kind: "unsupported", path },
      ]);
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-portable-custom-interaction", path, shown: "notice" },
      ]);
    }),
  );

  it.effect("[I-0] [I-8] marks what it does not render outside the body and on body elements", () =>
    Effect.gen(function* marksUnread() {
      const built = yield* buildItem(
        item({
          after: [el("qti-modal-feedback", [attr("identifier", "fb")], [text("Well done")])],
          attributes: [attr("adaptive", "true")],
          body: [
            el(
              "p",
              [
                attr("base", "images/", xmlNamespace),
                attr("lang", "fr", xmlNamespace),
                attr("class", "lead"),
              ],
              [text("Bonjour")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "POINT", "point", "single"),
            el("qti-template-declaration", [
              attr("base-type", "integer"),
              attr("cardinality", "single"),
              attr("identifier", "T"),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(built.body[0], {
        attributes: [
          { name: "xml:lang", value: "fr" },
          { name: "class", value: "lead" },
        ],
        children: [{ kind: "text", text: "Bonjour" }],
        kind: "element",
        path: `${body}/p`,
        tag: "p",
      });
      assert.deepStrictEqual(built.lang, Option.none());
      assert.deepStrictEqual([...built.responses.keys()], []);
      assert.deepStrictEqual(built.unsupported, [
        { feature: 'adaptive="true"', path: root, shown: "mark" },
        {
          feature: 'base-type="point"',
          path: `${root}/qti-response-declaration`,
          shown: "mark",
        },
        {
          feature: "qti-template-declaration",
          path: `${root}/qti-template-declaration`,
          shown: "mark",
        },
        { feature: "xml:base", path: `${body}/p`, shown: "mark" },
        { feature: "qti-modal-feedback", path: `${root}/qti-modal-feedback`, shown: "mark" },
      ]);
    }),
  );

  it.effect("[I-1] [I-2] marks each record and each untyped declaration at its path", () =>
    Effect.gen(function* marksUnmodelledDeclarations() {
      const built = yield* buildItem(
        item({
          body: [],
          declarations: [
            el("qti-response-declaration", [
              attr("cardinality", "record"),
              attr("identifier", "DETAIL"),
            ]),
            el("qti-response-declaration", [
              attr("cardinality", "single"),
              attr("identifier", "BARE"),
            ]),
            declaration("qti-response-declaration", "RESPONSE", "string", "single"),
            el("qti-outcome-declaration", [
              attr("cardinality", "record"),
              attr("identifier", "CONTEXT"),
            ]),
            el("qti-outcome-declaration", [
              attr("cardinality", "multiple"),
              attr("identifier", "LIST"),
            ]),
          ],
        }),
      );
      const response = `${root}/qti-response-declaration`;
      const outcome = `${root}/qti-outcome-declaration`;

      assert.deepStrictEqual([...built.responses.keys()], ["RESPONSE"]);
      assert.deepStrictEqual([...built.outcomes.keys()], []);
      assert.deepStrictEqual(built.unsupported, [
        { feature: 'cardinality="record"', path: `${response}[1]`, shown: "mark" },
        { feature: 'base-type=""', path: `${response}[2]`, shown: "mark" },
        { feature: 'cardinality="record"', path: `${outcome}[1]`, shown: "mark" },
        { feature: 'base-type=""', path: `${outcome}[2]`, shown: "mark" },
      ]);
    }),
  );

  it.effect(
    "[I-1] reads a response's qti-default-value through the value model, none without",
    () =>
      Effect.gen(function* readsResponseDefault() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-response-declaration", "WITH", "integer", "single", [
                values("qti-default-value", " 7 "),
              ]),
              declaration("qti-response-declaration", "WITHOUT", "integer", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.responses.get("WITH")?.defaultValue,
          Option.some<Value>({
            baseType: "integer",
            cardinality: "single",
            values: [{ baseType: "integer", value: 7n }],
          }),
        );
        assert.deepStrictEqual(built.responses.get("WITHOUT")?.defaultValue, Option.none());
      }),
  );

  it.effect("[I-1] reads an integer correct response beyond 2^53 exactly", () =>
    Effect.gen(function* readsExactCorrect() {
      const built = yield* buildItem(
        item({
          body: [],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "integer", "single", [
              values("qti-correct-response", "9007199254740993"),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(
        built.responses.get("RESPONSE")?.correct,
        Option.some<Value>({
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: 2n ** 53n + 1n }],
        }),
      );
    }),
  );

  it.effect("[I-1] reads an integer map-key of 31 digits exactly", () =>
    Effect.gen(function* readsExactMapKey() {
      const built = yield* buildItem(
        item({
          body: [],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "integer", "single", [
              el(
                "qti-mapping",
                [],
                [
                  el("qti-map-entry", [
                    attr("map-key", "-1000000000000000000000000000000"),
                    attr("mapped-value", "1"),
                  ]),
                ],
              ),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(
        built.responses.get("RESPONSE")?.mapping,
        Option.some({
          defaultValue: 0,
          entries: [
            {
              caseSensitive: false,
              key: { baseType: "integer", value: -(10n ** 30n) },
              value: 1,
            },
          ],
          lowerBound: Option.none(),
          upperBound: Option.none(),
        }),
      );
    }),
  );

  it.effect(
    "[I-9b] gives no processing for map_response_point, another template or an element outside the engine",
    () =>
      Effect.gen(function* unsupportedProcessing() {
        const declarations = [
          declaration("qti-response-declaration", "RESPONSE", "string", "single"),
        ];
        const processing = `${root}/qti-response-processing`;
        const cases = [
          {
            element: template("map_response_point"),
            feature: "map_response_point",
            path: processing,
          },
          {
            element: el("qti-response-processing", [
              attr("template", "https://example.com/rp/custom.xml"),
            ]),
            feature: 'template="https://example.com/rp/custom.xml"',
            path: processing,
          },
          {
            element: el(
              "qti-response-processing",
              [],
              [
                el(
                  "qti-set-outcome-value",
                  [attr("identifier", "SCORE")],
                  [el("qti-sum", [], [el("qti-variable", [attr("identifier", "RESPONSE")])])],
                ),
              ],
            ),
            feature: "qti-sum",
            path: `${processing}/qti-set-outcome-value/qti-sum`,
          },
        ];

        for (const { element, feature, path } of cases) {
          const built = yield* buildItem(item({ after: [element], body: [], declarations }));

          assert.deepStrictEqual(built.processing, Option.none());
          assert.deepStrictEqual(built.unsupported, [{ feature, path, shown: "mark" }]);
        }
      }),
  );

  it.effect("[I-2] refuses an integer qti-value of abc as value-type at its path", () =>
    Effect.gen(function* refusesBadValue() {
      const refusal = yield* Effect.flip(
        buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-outcome-declaration", "COUNT", "integer", "single", [
                values("qti-default-value", "abc"),
              ]),
            ],
          }),
        ),
      );

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "value-type");
      assert.strictEqual(refusal.document, "items/test.xml");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${root}/qti-outcome-declaration/qti-default-value/qti-value`,
      });
    }),
  );

  it.effect('[Q-2] refuses max-choices="-1" as value-type, outside xs:nonNegativeInteger', () =>
    Effect.gen(function* refusesNegativeCount() {
      const refusal = yield* Effect.flip(buildItem(choiceItem([attr("max-choices", "-1")])));

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/qti-choice-interaction/@max-choices`,
      });
    }),
  );

  it.effect('[Q-20] refuses base="2147483648" as value-type, outside xs:int', () =>
    Effect.gen(function* refusesWideBase() {
      const refusal = yield* Effect.flip(buildItem(textEntryItem([attr("base", "2147483648")])));

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/p/qti-text-entry-interaction/@base`,
      });
    }),
  );

  it.effect('[Q-20] reads base="-2147483648", the least xs:int', () =>
    Effect.gen(function* readsLeastBase() {
      const built = yield* buildItem(textEntryItem([attr("base", "-2147483648")]));
      const [entry] = childrenOf(built.body[0]);

      assert.strictEqual(entry?.kind === "text-entry" ? entry.base : undefined, -2_147_483_648);
    }),
  );

  it.effect("[Q-2] refuses a max-choices of 10^30 as count-range and reads -0 as 0", () =>
    Effect.gen(function* refusesHugeCount() {
      const refusal = yield* Effect.flip(
        buildItem(choiceItem([attr("max-choices", "1000000000000000000000000000000")])),
      );
      const built = yield* buildItem(choiceItem([attr("min-choices", "-0")]));

      assert.strictEqual(refusal.rule, "count-range");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/qti-choice-interaction/@max-choices`,
      });
      assert.strictEqual(choiceIn(built.body).minChoices, 0n);
    }),
  );

  it.effect("[Q-2] holds a min-choices of 2^53+1 exactly", () =>
    Effect.gen(function* holdsBeyondSafe() {
      const built = yield* buildItem(choiceItem([attr("min-choices", "9007199254740993")]));

      assert.strictEqual(choiceIn(built.body).minChoices, 9_007_199_254_740_993n);
    }),
  );

  it.effect("[Q-2] holds a max-choices of 2^63-1, the greatest count, by its value", () =>
    Effect.gen(function* holdsGreatestCount() {
      for (const written of ["9223372036854775807", "+09223372036854775807"]) {
        const built = yield* buildItem(choiceItem([attr("max-choices", written)]));

        assert.strictEqual(choiceIn(built.body).maxChoices, 9_223_372_036_854_775_807n, written);
      }
    }),
  );

  it.effect("[Q-2] refuses a max-choices or min-choices of 2^63 as count-range (reading 46)", () =>
    Effect.gen(function* refusesBeyondCount() {
      for (const attribute of ["max-choices", "min-choices"]) {
        const refusal = yield* Effect.flip(
          buildItem(choiceItem([attr(attribute, "9223372036854775808")])),
        );

        assert.strictEqual(refusal.rule, "count-range", attribute);
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${body}/qti-choice-interaction/@${attribute}`,
        });
        assert.deepStrictEqual(refusal.detail, {
          attribute,
          greatest: "9223372036854775807",
          least: "-9223372036854775808",
          lexical: "9223372036854775808",
          reading: "46",
        });
      }
    }),
  );

  it.effect("[Q-20] [Q-5] holds expected-length and expected-lines exactly, with no bound", () =>
    Effect.gen(function* holdsUnboundedSizes() {
      const entry = yield* buildItem(
        textEntryItem([attr("expected-length", "9223372036854775808")]),
      );
      const extended = yield* buildItem(
        item({
          body: [
            el("qti-extended-text-interaction", [
              attr("expected-lines", "1000000000000000000000000000000"),
              attr("response-identifier", "RESPONSE"),
            ]),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );
      const [node] = childrenOf(entry.body[0]);
      const [lines] = extended.body;

      assert.deepStrictEqual(
        node?.kind === "text-entry" ? node.expectedLength : undefined,
        Option.some(9_223_372_036_854_775_808n),
      );
      assert.deepStrictEqual(
        lines?.kind === "extended-text" ? lines.expectedLines : undefined,
        Option.some(10n ** 30n),
      );
    }),
  );

  it.effect("[Q-2] says the too-few count it read from the source exactly, 2^53+1", () =>
    Effect.gen(function* saysExactCount() {
      const built = yield* buildItem(choiceItem([attr("min-choices", "9007199254740993")]));
      const messages = validateChoice(
        choiceIn(built.body),
        {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "A" }],
        },
        yield* configure({ validateResponses: true }),
      );

      assert.deepStrictEqual(messages, [
        { response: "RESPONSE", text: message("en", "atLeast", { n: "9,007,199,254,740,993" }) },
      ]);
    }),
  );

  it.effect(
    "[I-9b] marks a point RESPONSE's match_correct as variable:RESPONSE and runs no processing",
    () =>
      Effect.gen(function* marksPointMatchCorrect() {
        const built = yield* buildItem(
          item({
            after: [
              template("match_correct"),
              el("qti-modal-feedback", [attr("identifier", "fb")], [text("Well done")]),
            ],
            body: [],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "point", "single", [
                values("qti-correct-response", "10 10"),
              ]),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: 'base-type="point"',
            path: `${root}/qti-response-declaration`,
            shown: "mark",
          },
          { feature: "variable:RESPONSE", path: `${root}/qti-response-processing`, shown: "mark" },
          { feature: "qti-modal-feedback", path: `${root}/qti-modal-feedback`, shown: "mark" },
        ]);
      }),
  );

  it.effect("[I-9b] marks inline rules that read the built-in duration as variable:duration", () =>
    Effect.gen(function* marksBuiltInDuration() {
      const built = yield* buildItem(
        item({
          after: [
            el(
              "qti-response-processing",
              [],
              [
                el(
                  "qti-set-outcome-value",
                  [attr("identifier", "SCORE")],
                  [el("qti-variable", [attr("identifier", "duration")])],
                ),
              ],
            ),
          ],
          body: [],
          declarations: [declaration("qti-outcome-declaration", "SCORE", "float", "single")],
        }),
      );

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        { feature: "variable:duration", path: `${root}/qti-response-processing`, shown: "mark" },
      ]);
    }),
  );

  it.effect("[I-9b] marks inline rules that read a template variable as variable:T", () =>
    Effect.gen(function* marksTemplateVariable() {
      const built = yield* buildItem(
        item({
          after: [
            el(
              "qti-response-processing",
              [],
              [
                el(
                  "qti-set-outcome-value",
                  [attr("identifier", "SCORE")],
                  [el("qti-variable", [attr("identifier", "T")])],
                ),
              ],
            ),
          ],
          body: [],
          declarations: [
            declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            el("qti-template-declaration", [
              attr("base-type", "float"),
              attr("cardinality", "single"),
              attr("identifier", "T"),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        {
          feature: "qti-template-declaration",
          path: `${root}/qti-template-declaration`,
          shown: "mark",
        },
        { feature: "variable:T", path: `${root}/qti-response-processing`, shown: "mark" },
      ]);
    }),
  );

  it.effect("[I-9b] keeps BG007's match_correct tree, every identifier held, with no mark", () =>
    Effect.gen(function* keepsHeldTree() {
      const built = yield* buildItem(bg007(template("match_correct")));

      assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
      assert.deepStrictEqual(built.unsupported, []);
    }),
  );

  it.effect(
    "[I-9b] runs no processing for an item with template processing, and marks qti-template-processing",
    () =>
      Effect.gen(function* templatedRunsNone() {
        const built = yield* buildItem(floatMatchCorrect([setsCorrectResponse]));

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: "qti-template-processing",
            path: `${root}/qti-template-processing`,
            shown: "mark",
          },
        ]);
      }),
  );

  it.effect(
    "[I-9b] gives equal outcomes for the correct value and another on an item with template processing",
    () =>
      Effect.gen(function* templatedScoresNone() {
        const built = yield* buildItem(floatMatchCorrect([setsCorrectResponse]));
        const correct = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(1.5) }),
        );
        const other = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(2.5) }),
        );

        assert.deepStrictEqual(correct.outcomes, other.outcomes);
      }),
  );

  it.effect(
    "[I-9b] keeps match_correct for the same item without template processing, and scores 1",
    () =>
      Effect.gen(function* untemplatedRuns() {
        const built = yield* buildItem(floatMatchCorrect());
        const correct = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(1.5) }),
        );
        const other = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(2.5) }),
        );

        assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(correct.outcomes["SCORE"], float(1));
        assert.deepStrictEqual(other.outcomes["SCORE"], float(0));
      }),
  );

  it.effect(
    "[I-9b] runs a template URI padded with XML whitespace as the built-in it names, with no mark",
    () =>
      Effect.gen(function* runsPaddedTemplate() {
        const built = yield* buildItem(
          item({
            after: [
              el("qti-response-processing", [
                attr(
                  "template",
                  " \n\thttps://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct\n ",
                ),
              ]),
            ],
            body: [
              el(
                "qti-choice-interaction",
                [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
                [choice("A", "Ant"), choice("B", "Bee")],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single", [
                values("qti-correct-response", "A"),
              ]),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            ],
          }),
        );
        const after = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), {
            RESPONSE: {
              baseType: "identifier",
              cardinality: "single",
              values: [{ baseType: "identifier", value: "A" }],
            },
          }),
        );

        assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(after.outcomes["SCORE"], float(1));
      }),
  );

  it.effect('[I-1] [Q-2] binds response-identifier=" RESPONSE " to the declaration RESPONSE', () =>
    Effect.gen(function* bindsPaddedReference() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-choice-interaction",
              [attr("response-identifier", " RESPONSE ")],
              [choice("A", "Ant"), choice("B", "Bee")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
          ],
        }),
      );

      assert.strictEqual(choiceIn(built.body).response, "RESPONSE");
    }),
  );

  it.effect('[I-1] [Q-2] keys a declaration identifier="\\tRESPONSE\\n" as RESPONSE', () =>
    Effect.gen(function* keysPaddedDeclaration() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-choice-interaction",
              [attr("response-identifier", "RESPONSE")],
              [choice("A", "Ant"), choice("B", "Bee")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "\tRESPONSE\n", "identifier", "single"),
          ],
        }),
      );

      assert.deepStrictEqual([...built.responses.keys()], ["RESPONSE"]);
      assert.strictEqual(built.responses.get("RESPONSE")?.identifier, "RESPONSE");
      assert.strictEqual(choiceIn(built.body).response, "RESPONSE");
    }),
  );

  it.effect('[Q-2] reads a qti-simple-choice identifier=" A " as A', () =>
    Effect.gen(function* readsPaddedChoice() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-choice-interaction",
              [attr("response-identifier", "RESPONSE")],
              [choice(" A ", "Ant"), choice("B", "Bee")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
          ],
        }),
      );

      assert.deepStrictEqual(
        choiceIn(built.body).choices.map((option) => option.identifier),
        ["A", "B"],
      );
    }),
  );

  it.effect(
    "[I-9b] reads padded identifiers in inline processing as the declarations they name, with no mark",
    () =>
      Effect.gen(function* readsPaddedProcessing() {
        const built = yield* buildItem(
          item({
            after: [
              el(
                "qti-response-processing",
                [],
                [
                  el(
                    "qti-set-outcome-value",
                    [attr("identifier", " SCORE ")],
                    [el("qti-variable", [attr("identifier", " RESPONSE ")])],
                  ),
                ],
              ),
            ],
            body: [],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "float", "single"),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some<readonly Rule[]>([
            {
              expression: { identifier: "RESPONSE", kind: "variable" },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect('[I-0] reads a root identifier=" item-1 " as item-1', () =>
    Effect.gen(function* readsPaddedRoot() {
      const built = yield* buildItem(
        doc(
          "items/test.xml",
          el(
            root,
            [attr("identifier", " item-1 "), attr("title", "Item")],
            [el("qti-item-body", [], [])],
          ),
        ),
      );

      assert.strictEqual(built.identifier, "item-1");
    }),
  );

  it.effect(
    '[I-1] [Q-2] names the collapsed identifier when response-identifier=" OTHER " binds no declaration',
    () =>
      Effect.gen(function* namesCollapsedReference() {
        const refusal = yield* Effect.flip(
          buildItem(
            item({
              body: [
                el(
                  "qti-choice-interaction",
                  [attr("response-identifier", " OTHER ")],
                  [choice("A", "Ant")],
                ),
              ],
              declarations: [
                declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
              ],
            }),
          ),
        );

        assert.strictEqual(refusal.rule, "undeclared-response");
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${body}/qti-choice-interaction/@response-identifier`,
        });
        assert.deepStrictEqual(refusal.detail, { response: "OTHER" });
      }),
  );

  it.effect('[I-1] [Q-2] refuses response-identifier="OTHER" with no such declaration', () =>
    Effect.gen(function* refusesUnboundReference() {
      const refusal = yield* Effect.flip(
        buildItem(
          item({
            body: [
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "OTHER")],
                [choice("A", "Ant")],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
            ],
          }),
        ),
      );

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "undeclared-response");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/qti-choice-interaction/@response-identifier`,
      });
      assert.deepStrictEqual(refusal.detail, { response: "OTHER" });
    }),
  );

  it.live("trims a 50,000-character inner whitespace run in an attribute in linear time", () =>
    Effect.gen(function* linearAttributeTrim() {
      const run = " \t\n\r".repeat(12_500);
      const cases = [
        ["max-choices", `1${run}1`],
        ["shuffle", `true${run}false`],
      ] as const;
      for (const [name, written] of cases) {
        const [elapsed, refusal] = yield* Effect.timed(
          Effect.flip(Effect.suspend(() => buildItem(choiceItem([attr(name, written)])))),
        );
        assert.strictEqual(refusal.rule, "value-type", name);
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${body}/qti-choice-interaction/@${name}`,
        });
        assert.isBelow(Duration.toMillis(elapsed), 200, `${name}: ${Duration.format(elapsed)}`);
      }
    }),
  );

  it.effect(
    "[I-0] records 8,000 unsupported declarations, 8 times as many in under 32 times the time",
    () =>
      Effect.gen(function* recordsInConstantTime() {
        const fewer = templated(fewerDeclarations);
        const more = templated(fewerDeclarations * growthFactor);
        const built = yield* buildItem(more);
        assert.strictEqual(built.unsupported.length, fewerDeclarations * growthFactor);

        const growth = yield* growthRatio(
          () => {
            Effect.runSync(buildItem(fewer));
          },
          () => {
            Effect.runSync(buildItem(more));
          },
        );
        assert.isBelow(
          growth,
          growthLimit,
          `8 times the declarations took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "control: a quadratic dedupe of the same features fails the growth check",
    () =>
      Effect.gen(function* quadraticControl() {
        const fewer = (yield* buildItem(templated(fewerDeclarations))).unsupported;
        const more = (yield* buildItem(templated(fewerDeclarations * growthFactor))).unsupported;
        assert.deepStrictEqual(dedupeQuadratically([...fewer, ...fewer]), fewer);

        const growth = yield* growthRatio(
          () => {
            dedupeQuadratically(fewer);
          },
          () => {
            dedupeQuadratically(more);
          },
        );
        assert.isAtLeast(
          growth,
          growthLimit,
          `8 times the features took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );
});
