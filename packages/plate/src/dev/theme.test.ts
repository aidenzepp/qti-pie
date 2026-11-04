import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { emptyTheme, parseTheme, themeCss, themeText } from "#plate/dev/theme.ts";
import type { ThemeDeclaration, ThemeRefused } from "#plate/dev/theme.ts";

/**
 * The default neutral `:root` and `.dark` blocks of shadcn/ui, verbatim from its theming file at
 * commit `4aaea19`, lines 204-271:
 * https://github.com/shadcn-ui/ui/blob/4aaea19d9cff3e0908e12a8c1d504b8c5ec34610/apps/v4/content/docs/(root)/theming.mdx
 */
const fixture = `
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
`;

/**
 * Read a block's `--name: value;` lines straight from the fixture text, without the parser, as the
 * declarations the parser must give back.
 *
 * @param block The block's text, from its selector to its closing brace.
 * @returns Each line's name and value, in order.
 */
const lines = (block: string): readonly ThemeDeclaration[] =>
  Array.from(block.matchAll(/^ {2}(?<name>--[\w-]+): (?<value>.+);$/gmu), ({ groups }) => [
    groups?.["name"] ?? "",
    groups?.["value"] ?? "",
  ]);

/**
 * A `:root` block of numbered declarations that is more than 33 KiB long.
 */
const oversized = `:root {\n${Array.from({ length: 1400 }, (_, index) => `  --size-${index}: oklch(1 0 0);\n`).join("")}}\n`;

describe("parseTheme", () => {
  it.effect(
    "reads shadcn's default neutral :root and .dark blocks, every declaration in order",
    () =>
      Effect.gen(function* fixtureTheme() {
        const theme = yield* parseTheme(fixture);
        const darkStart = fixture.indexOf(".dark {");

        assert.deepStrictEqual(theme.light, lines(fixture.slice(0, darkStart)));
        assert.deepStrictEqual(theme.dark, lines(fixture.slice(darkStart)));
        assert.strictEqual(theme.light.length, 32);
        assert.strictEqual(theme.dark.length, 31);
        assert.deepStrictEqual(
          theme.dark.find(([name]) => name === "--border"),
          ["--border", "oklch(1 0 0 / 10%)"],
        );
      }),
  );

  it.effect(
    "reads nothing as the empty theme, and a lone .dark block as dark declarations only",
    () =>
      Effect.gen(function* partialThemes() {
        assert.deepStrictEqual(yield* parseTheme(""), emptyTheme);
        assert.deepStrictEqual(yield* parseTheme(".dark {\n  --primary: oklch(0.922 0 0);\n}\n"), {
          dark: [["--primary", "oklch(0.922 0 0)"]],
          light: [],
        });
      }),
  );

  it.effect("drops a comment between declarations and keeps a quoted value with its quotes", () =>
    Effect.gen(function* commentsAndQuotes() {
      const theme = yield* parseTheme(
        ':root {\n  --radius: 0.625rem; /* corners */\n  --font-sans: "Inter", sans-serif;\n}\n',
      );

      assert.deepStrictEqual(theme, {
        dark: [],
        light: [
          ["--radius", "0.625rem"],
          ["--font-sans", '"Inter", sans-serif'],
        ],
      });
    }),
  );

  const refusals: readonly (readonly [
    description: string,
    text: string,
    cause: ThemeRefused["cause"],
    detail: string,
  ])[] = [
    ["another selector", "body { color: red }", "selector", "body"],
    [
      "an at-rule",
      "@theme inline { --color-primary: var(--primary); }",
      "selector",
      "@theme inline",
    ],
    ["an at-rule inside a block", ":root { @apply border-border; }", "selector", "@apply"],
    [
      "a second :root block",
      ":root { --a: 1; }\n.dark { --a: 2; }\n:root { --b: 3; }",
      "selector",
      ":root",
    ],
    ["text after the last block", ":root { --a: 1; } --b: 2;", "selector", "--b: 2;"],
    ["a property that is not custom", ":root { color: red }", "declaration", "color"],
    ["a declaration without a colon", ":root { --a }", "declaration", "--a"],
    ["a url() call", ":root { --x: url(https://e.example/a) }", "value", "url("],
    ["a url() call in capitals", ":root { --x: URL(https://e.example/a) }", "value", "URL("],
    ["an image-set() call", ":root { --x: image-set(a 1x) }", "value", "image-set("],
    ["a -webkit-image-set() call", ":root { --x: -webkit-image-set(a 1x) }", "value", "image-set("],
    ["a src() call", ':root { --x: src("https://e.example/a") }', "value", "src("],
    ["a src() call in capitals", ':root { --x: SRC("https://e.example/a") }', "value", "SRC("],
    ["markup", ":root { --x: </textarea> }", "value", "<"],
    ["!important", ":root { --x: red !important }", "value", "!important"],
    ["a semicolon inside quotes", ':root { --x: "a;b" }', "value", ";"],
    ["a comment opener inside quotes", ':root { --x: "/*" }', "value", "/*"],
    ["an empty value", ":root { --x: ; }", "value", "--x"],
    ["a value over 512 characters", `:root { --x: ${"a".repeat(513)} }`, "value", "--x"],
    [
      "a quoted string across a line feed",
      ':root {\n  --x: "a\nb";\n  --next: red;\n}\n',
      "value",
      "--x",
    ],
    ["a quoted string across a carriage return", ":root { --x: 'a\rb' }", "value", "--x"],
    ["a quoted string across a form feed", ':root { --x: "a\fb" }', "value", "--x"],
    ["an escaped line feed inside quotes", ':root { --x: "a\\\nb" }', "value", "\\"],
    ["an extra closing brace", ":root { --x: 1 } }", "unbalanced", "}"],
    ["an unclosed block", ":root { --x: 1", "unbalanced", "{"],
    ["an unterminated string", ':root { --x: "a }', "unbalanced", '"'],
    ["an unterminated comment", ":root { --x: 1 } /* open", "unbalanced", "/*"],
  ];

  for (const [description, text, cause, detail] of refusals) {
    it.effect(`refuses ${description} as ${cause}`, () =>
      Effect.gen(function* refusal() {
        const error = yield* Effect.flip(parseTheme(text));

        assert.strictEqual(error._tag, "ThemeRefused");
        assert.strictEqual(error.cause, cause);
        assert.strictEqual(error.detail, detail);
      }),
    );
  }

  it.effect("keeps a line break outside quotes, which CSS reads as white space", () =>
    Effect.gen(function* lineBreakOutsideQuotes() {
      const theme = yield* parseTheme(':root {\n  --font-sans: "Inter",\n    sans-serif;\n}\n');

      assert.deepStrictEqual(theme.light, [["--font-sans", '"Inter",\n    sans-serif']]);
      assert.deepStrictEqual(yield* parseTheme(themeText(theme)), theme);
    }),
  );

  it.effect("refuses 33 KiB of declarations as too-large", () =>
    Effect.gen(function* tooLarge() {
      assert.isAbove(new TextEncoder().encode(oversized).length, 33 * 1024);

      const error = yield* Effect.flip(parseTheme(oversized));

      assert.strictEqual(error.cause, "too-large");
    }),
  );

  it.effect("measures the size in UTF-8 bytes, not characters", () =>
    Effect.gen(function* utf8Size() {
      const text = `/* ${"é".repeat(17_000)} */\n:root {\n  --radius: 0.625rem;\n}\n`;

      assert.isBelow(text.length, 32 * 1024);

      const error = yield* Effect.flip(parseTheme(text));

      assert.strictEqual(error.cause, "too-large");
    }),
  );

  it.effect("checks the size first, and a selector before a declaration", () =>
    Effect.gen(function* order() {
      assert.strictEqual((yield* Effect.flip(parseTheme(`${oversized} }`))).cause, "too-large");
      assert.strictEqual(
        (yield* Effect.flip(parseTheme(":root { color: red }\nbody { --x: 1 }"))).cause,
        "selector",
      );
      assert.strictEqual(
        (yield* Effect.flip(parseTheme(":root { --x: url(a) }\n.dark { color: red }"))).cause,
        "declaration",
      );
    }),
  );

  it.effect("quotes at most 80 characters of the offending part", () =>
    Effect.gen(function* shortDetail() {
      const error = yield* Effect.flip(parseTheme(`.${"x".repeat(200)} { --a: 1 }`));

      assert.strictEqual(error.cause, "selector");
      assert.strictEqual(error.detail, `.${"x".repeat(79)}`);
    }),
  );
});

/**
 * A line that declares a custom property, as ` --name: value;`.
 */
const customPropertyLine = /^\s*--[\w-]+\s*:/mu;

describe("themeText", () => {
  it.effect("gives back the theme parseTheme read from it", () =>
    Effect.gen(function* roundTrip() {
      const fixtureTheme = yield* parseTheme(fixture);

      assert.deepStrictEqual(yield* parseTheme(themeText(fixtureTheme)), fixtureTheme);
    }),
  );

  it("writes each block in one format, :root first and an empty block left out", () => {
    assert.strictEqual(
      themeText({
        dark: [["--a", "2"]],
        light: [
          ["--a", "1"],
          ["--b", '"x y"'],
        ],
      }),
      ':root {\n  --a: 1;\n  --b: "x y";\n}\n\n.dark {\n  --a: 2;\n}\n',
    );
    assert.strictEqual(themeText({ dark: [["--a", "2"]], light: [] }), ".dark {\n  --a: 2;\n}\n");
  });

  it.effect("writes the empty theme as nothing, which reads back as the empty theme", () =>
    Effect.gen(function* emptyText() {
      assert.strictEqual(themeText(emptyTheme), "");
      assert.deepStrictEqual(yield* parseTheme(themeText(emptyTheme)), emptyTheme);
    }),
  );
});

describe("themeCss", () => {
  it("lets the browser's own colours follow an empty theme, with no .dark rule", () => {
    const css = themeCss(emptyTheme);

    assert.include(css, ":root {\n  color-scheme: light;\n}");
    assert.include(css, "html {\n  font-family: var(--font-sans, system-ui, sans-serif);\n}");
    assert.include(
      css,
      "body {\n  background-color: var(--background, Canvas);\n  color: var(--foreground, CanvasText);\n}",
    );
    assert.notMatch(css, customPropertyLine);
    assert.notInclude(css, ".dark");
  });

  it.effect(
    "starts with the theme's text and gives a theme with .dark declarations a dark scheme",
    () =>
      Effect.gen(function* fixtureCss() {
        const fixtureTheme = yield* parseTheme(fixture);
        const css = themeCss(fixtureTheme);

        assert.isTrue(css.startsWith(themeText(fixtureTheme)));
        assert.include(css, ".dark {\n  color-scheme: dark;\n}");
      }),
  );

  it("gives a theme with no .dark declarations no dark scheme", () => {
    assert.notInclude(themeCss({ dark: [], light: [["--a", "1"]] }), "color-scheme: dark");
  });

  it("writes the theme, then the schemes, then the html and body rules, each block once", () => {
    assert.strictEqual(
      themeCss({ dark: [["--a", "2"]], light: [["--a", "1"]] }),
      [
        ":root {\n  --a: 1;\n}\n",
        ".dark {\n  --a: 2;\n}\n",
        ":root {\n  color-scheme: light;\n}\n",
        ".dark {\n  color-scheme: dark;\n}\n",
        "html {\n  font-family: var(--font-sans, system-ui, sans-serif);\n}\n",
        "body {\n  background-color: var(--background, Canvas);\n  color: var(--foreground, CanvasText);\n}\n",
      ].join("\n"),
    );
  });
});
