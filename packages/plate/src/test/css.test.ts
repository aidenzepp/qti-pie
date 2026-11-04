import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { rowFor } from "#plate/emit/parts.ts";
import { scanSheet } from "#plate/test/css.ts";
import type { CssUnsupported } from "#plate/test/css.ts";

/**
 * Lines 15 to 34 of `work/planning/095fa660/fmt-probe/formatted.css`, what `vp fmt` writes for this
 * package's constructs, copied byte for byte.
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
