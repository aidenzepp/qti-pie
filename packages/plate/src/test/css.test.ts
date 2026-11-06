import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { rowFor } from "#plate/emit/parts.ts";
import { compounds, scanSheet, uses, varReferences } from "#plate/test/css.ts";
import type { Compound, CssUnsupported, Use } from "#plate/test/css.ts";

/**
 * What `vp fmt` writes for this package's constructs, copied byte for byte from its output: one
 * declaration per line, attribute values in double quotes, and a selector too long for one line
 * broken inside its parentheses, each argument of `:where(` and `:has(` on a line of its own and
 * each closing parenthesis on its own line.
 */
const formatted = `:where(
  [data-slot="choice-interaction-choice"]:has(
    [data-slot="choice-interaction-control"]:focus-visible
  ),
  [data-slot="text-entry-interaction-control"]:focus-visible
) {
  outline: 2px solid color-mix(in oklab, var(--ring, oklch(0.708 0 0)) 50%, transparent);
}
:where([data-slot="choice-interaction-control"]) {
  clip-path: inset(50%);
  position: absolute;
  width: 1px;
  height: 1px;
}
@media (forced-colors: active) {
  :where([data-slot="choice-interaction-control"]) {
    clip-path: none;
    position: static;
  }
}
`;

describe("scanSheet", () => {
  it.effect(
    "scans the formatter's style: a broken selector, inset() and a forced-colors block",
    () =>
      Effect.gen(function* formatterStyle() {
        const sheet = yield* scanSheet(formatted);

        assert.strictEqual(sheet.rules.length, 3);

        const [first, second, third] = sheet.rules;
        assert.deepStrictEqual(first?.selectors, [
          ':where([data-slot="choice-interaction-choice"]:has([data-slot="choice-interaction-control"]:focus-visible), [data-slot="text-entry-interaction-control"]:focus-visible)',
        ]);
        assert.deepStrictEqual(first?.declarations, [
          {
            important: false,
            property: "outline",
            value: "2px solid color-mix(in oklab, var(--ring, oklch(0.708 0 0)) 50%, transparent)",
          },
        ]);
        assert.deepStrictEqual(first?.conditions, []);
        assert.deepStrictEqual(second?.declarations[0], {
          important: false,
          property: "clip-path",
          value: "inset(50%)",
        });
        assert.deepStrictEqual(second?.conditions, []);
        assert.deepStrictEqual(third?.conditions, ["@media (forced-colors: active)"]);
        assert.deepStrictEqual(
          third?.declarations.map((declaration) => declaration.property),
          ["clip-path", "position"],
        );
      }),
  );

  it.effect("keeps a child combinator inside :has()", () =>
    Effect.gen(function* childCombinator() {
      const selector = `:has(> [data-slot="${rowFor("choice-interaction", "control").slot}"])`;
      const sheet = yield* scanSheet(`${selector} {\n  color: red;\n}\n`);

      assert.deepStrictEqual(
        sheet.rules.map((rule) => rule.selectors),
        [[selector]],
      );
    }),
  );

  it.effect("splits a selector list on its top-level commas only", () =>
    Effect.gen(function* selectorList() {
      const sheet = yield* scanSheet('a,\nb:is(c, d),\n[title="e, f"] { color: red }');

      assert.deepStrictEqual(sheet.rules[0]?.selectors, ["a", "b:is(c, d)", '[title="e, f"]']);
    }),
  );

  it.effect("reads !important apart from the value", () =>
    Effect.gen(function* important() {
      const sheet = yield* scanSheet("a { color: red !important }");

      assert.deepStrictEqual(sheet.rules[0]?.declarations, [
        { important: true, property: "color", value: "red" },
      ]);
    }),
  );

  it.effect("drops comments between rules and declarations, and keeps /* inside a string", () =>
    Effect.gen(function* comments() {
      const sheet = yield* scanSheet(
        [
          "/* first */",
          "a { /* before */ color: red; /* between */ background: blue /* trailing */; }",
          "/* between rules */",
          'b { content: "/* kept */"; }',
        ].join("\n"),
      );

      assert.deepStrictEqual(sheet.rules, [
        {
          conditions: [],
          declarations: [
            { important: false, property: "color", value: "red" },
            { important: false, property: "background", value: "blue" },
          ],
          selectors: ["a"],
        },
        {
          conditions: [],
          declarations: [{ important: false, property: "content", value: '"/* kept */"' }],
          selectors: ["b"],
        },
      ]);
    }),
  );

  it.effect("gives each rule in a @supports block its condition", () =>
    Effect.gen(function* supports() {
      const sheet = yield* scanSheet(
        "@supports (display:  grid) {\n  a { display: grid }\n  b { display: grid }\n}\nc { color: red }",
      );

      assert.deepStrictEqual(
        sheet.rules.map((rule) => rule.conditions),
        [["@supports (display: grid)"], ["@supports (display: grid)"], []],
      );
    }),
  );

  const refusals: readonly (readonly [
    css: string,
    construct: CssUnsupported["construct"],
    detail: string,
  ])[] = [
    ["a { b { color: red } }", "nesting", "b"],
    ["@media (x) { @supports (y) { a { color: red } } }", "nesting", "@supports (y)"],
    ['@import "x.css";', "at-rule", "@import"],
    ["@counter-style x { system: cyclic; }", "at-rule", "@counter-style"],
    ["@font-face { font-family: x; }", "at-rule", "@font-face"],
    ["@layer base { a { color: red } }", "at-rule", "@layer"],
    ["@media (x) { @keyframes k { to { opacity: 0 } } }", "at-rule", "@keyframes"],
    ["color: red;", "declaration-outside-rule", "color: red"],
    ["a { color: red;", "unbalanced", "{"],
    ['a { content: "x; }', "unbalanced", '"'],
    ["a:is(b { color: red }", "unbalanced", "("],
    ["a { color: red } /* open", "unbalanced", "/*"],
  ];

  for (const [css, construct, detail] of refusals) {
    it.effect(`refuses ${JSON.stringify(css)} as ${construct}`, () =>
      Effect.gen(function* refusal() {
        const error = yield* Effect.flip(scanSheet(css));

        assert.strictEqual(error._tag, "CssUnsupported");
        assert.strictEqual(error.construct, construct);
        assert.strictEqual(error.detail, detail);
      }),
    );
  }
});

/**
 * A compound with nothing in it, for building the expected compounds.
 */
const empty: Compound = {
  attributes: [],
  classes: [],
  ids: [],
  pseudoClasses: [],
  pseudoElements: [],
  type: Option.none(),
};

describe("compounds", () => {
  it("reads :where() and :has() one level at a time, with the markers as attribute tests", () => {
    const choice = rowFor("choice-interaction", "choice").slot;
    const control = rowFor("choice-interaction", "control").slot;
    const inner = `[data-slot="${choice}"]:has([data-slot="${control}"]:checked)`;

    const outer = compounds(`:where(${inner})`);
    assert.deepStrictEqual(outer, [
      { ...empty, pseudoClasses: [{ name: "where", selectors: [inner] }] },
    ]);

    const where = compounds(outer[0]?.pseudoClasses[0]?.selectors[0] ?? "");
    assert.deepStrictEqual(where, [
      {
        ...empty,
        attributes: [
          {
            flag: Option.none(),
            name: "data-slot",
            operator: Option.some("="),
            value: Option.some(choice),
          },
        ],
        pseudoClasses: [{ name: "has", selectors: [`[data-slot="${control}"]:checked`] }],
      },
    ]);

    const has = compounds(where[0]?.pseudoClasses[0]?.selectors[0] ?? "");
    assert.deepStrictEqual(has, [
      {
        ...empty,
        attributes: [
          {
            flag: Option.none(),
            name: "data-slot",
            operator: Option.some("="),
            value: Option.some(control),
          },
        ],
        pseudoClasses: [{ name: "checked", selectors: [] }],
      },
    ]);
  });

  it("drops the combinators between compounds", () => {
    assert.deepStrictEqual(compounds(".a b > [x]::before"), [
      { ...empty, classes: ["a"] },
      { ...empty, type: Option.some("b") },
      {
        ...empty,
        attributes: [
          { flag: Option.none(), name: "x", operator: Option.none(), value: Option.none() },
        ],
        pseudoElements: ["before"],
      },
    ]);
  });

  it("reads an ID, an attribute test's flag and a single-colon pseudo-element", () => {
    assert.deepStrictEqual(compounds('*#main + [lang|="en" i] ~ p:BEFORE'), [
      { ...empty, ids: ["main"], type: Option.some("*") },
      {
        ...empty,
        attributes: [
          {
            flag: Option.some("i"),
            name: "lang",
            operator: Option.some("|="),
            value: Option.some("en"),
          },
        ],
      },
      { ...empty, pseudoElements: ["before"], type: Option.some("p") },
    ]);
  });
});

/**
 * Write each use as one line, `<kind> <name>`, with ` for <property>` after a `value` use.
 *
 * @param found The uses.
 * @returns One line per use, in order.
 */
const lines = (found: readonly Use[]): readonly string[] =>
  found.map(
    (use) =>
      `${use.kind} ${use.name}${Option.match(use.property, { onNone: () => "", onSome: (property) => ` for ${property}` })}`,
  );

describe("uses", () => {
  it.effect(
    "reports a sheet's properties, values, functions, units, selectors and conditions",
    () =>
      Effect.gen(function* sheetUses() {
        const sheet = yield* scanSheet(
          "a { display: grid; width: 10ch; outline-color: color-mix(in oklab, var(--ring, oklch(0.708 0 0)) 50%, transparent); } @media (forced-colors: active) { .b > c:hover::before { display: none } }",
        );

        assert.includeMembers(
          [...lines(uses(sheet))],
          [
            "function color-mix",
            "function var",
            "function oklch",
            "unit ch",
            "unit %",
            "media-feature forced-colors",
            "at-rule media",
            "value grid for display",
            "selector type",
            "selector class",
            "selector child",
            "pseudo-class hover",
            "pseudo-element before",
            "property outline-color",
          ],
        );
      }),
  );

  it.effect("descends into :where(), :is(), :not() and :has()", () =>
    Effect.gen(function* nestedUses() {
      const sheet = yield* scanSheet("x:where(y:has(z:checked)) { color: red }");

      assert.includeMembers(
        [...lines(uses(sheet))],
        ["pseudo-class where", "pseudo-class has", "pseudo-class checked"],
      );
    }),
  );
});

describe("varReferences", () => {
  it("reads a reference's name and fallback", () => {
    assert.deepStrictEqual(varReferences("var(--ring, oklch(0.708 0 0))"), [
      { fallback: Option.some("oklch(0.708 0 0)"), name: "--ring" },
    ]);
  });

  it("gives a reference without a comma no fallback", () => {
    assert.deepStrictEqual(varReferences("var(--a)"), [{ fallback: Option.none(), name: "--a" }]);
  });

  it("finds a reference inside another function", () => {
    assert.deepStrictEqual(
      varReferences("color-mix(in oklab, var(--ring, oklch(0.708 0 0)) 50%, transparent)"),
      [{ fallback: Option.some("oklch(0.708 0 0)"), name: "--ring" }],
    );
  });

  it("finds a reference nested in a fallback, after the one that holds it", () => {
    assert.deepStrictEqual(varReferences("var(--a,  var( --b, red ))"), [
      { fallback: Option.some("var(--b, red)"), name: "--a" },
      { fallback: Option.some("red"), name: "--b" },
    ]);
  });
});
