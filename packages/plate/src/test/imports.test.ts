import { assert, describe, it } from "@effect/vitest";
import { checkAllowlist, readImports, sideEffectsOnly, valueClosure } from "#plate/test/imports.ts";
import type { Violation } from "#plate/test/imports.ts";

/**
 * Check the allowlist over an in-memory module map whose root is `src/a.ts`.
 *
 * @param modules The modules, by path under the package.
 * @returns The violations the closure from `src/a.ts` holds.
 */
const scan = (modules: Readonly<Record<string, string>>): readonly Violation[] =>
  checkAllowlist(new Map(Object.entries(modules)), ["src/a.ts"]);

/**
 * The one violation a module's import gives.
 *
 * @param module The module that imports.
 * @param specifier The specifier it imports.
 * @param name The name it imports.
 * @param line The line the declaration starts on.
 * @returns The violation.
 */
const violation = (module: string, specifier: string, name: string, line = 1): Violation => ({
  line,
  module,
  name,
  specifier,
});

describe("the allowlist's controls", () => {
  it('reports import { Schema } from "effect"', () => {
    assert.deepStrictEqual(scan({ "src/a.ts": 'import { Schema } from "effect";\n' }), [
      violation("src/a.ts", "effect", "Schema"),
    ]);
  });

  it('does not report import type { Schema } from "effect"', () => {
    assert.deepStrictEqual(scan({ "src/a.ts": 'import type { Schema } from "effect";\n' }), []);
  });

  it('does not report import { type Effect, Option } from "effect"', () => {
    assert.deepStrictEqual(
      scan({ "src/a.ts": 'import { type Effect, Option } from "effect";\n' }),
      [],
    );
  });

  it('does not report import { Array as Arr } from "effect": the name before as is allowed', () => {
    assert.deepStrictEqual(scan({ "src/a.ts": 'import { Array as Arr } from "effect";\n' }), []);
  });

  it('reports import * as E from "effect" as a namespace import', () => {
    assert.deepStrictEqual(scan({ "src/a.ts": 'import * as E from "effect";\n' }), [
      violation("src/a.ts", "effect", "*"),
    ]);
  });

  it('reports a default import of "effect" and any "effect/…" subpath', () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": 'import Effect from "effect";\nimport { Option } from "effect/Option";\n',
      }),
      [
        violation("src/a.ts", "effect", "default"),
        violation("src/a.ts", "effect/Option", "Option", 2),
      ],
    );
  });

  it("does not scan a module a root reaches only through import type", () => {
    const modules = {
      "src/a.ts": 'import type { B } from "#plate/b.ts";\n',
      "src/b.ts": 'import { Effect } from "effect";\n',
    };

    assert.deepStrictEqual(scan(modules), []);
    assert.deepStrictEqual(valueClosure(new Map(Object.entries(modules)), ["src/a.ts"]), [
      "src/a.ts",
    ]);
  });

  it("follows a value import of #plate/b.ts and reports b.ts's import of Effect", () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": 'import { b } from "#plate/b.ts";\n',
        "src/b.ts": 'import { Effect } from "effect";\n',
      }),
      [violation("src/b.ts", "effect", "Effect")],
    );
  });

  it('follows export { x } from "#plate/c.ts"', () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": 'export { x } from "#plate/c.ts";\n',
        "src/c.ts": 'import { Schema } from "effect";\n',
      }),
      [violation("src/c.ts", "effect", "Schema")],
    );
  });

  it('reports import "node:fs"', () => {
    assert.deepStrictEqual(scan({ "src/a.ts": 'import "node:fs";\n' }), [
      violation("src/a.ts", "node:fs", sideEffectsOnly),
    ]);
  });

  it("reports a value import written across three lines", () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": 'import { Option } from "effect";\nimport {\n  Effect,\n} from "effect";\n',
      }),
      [violation("src/a.ts", "effect", "Effect", 2)],
    );
  });

  it('follows export * from "#plate/d.ts" and reports export * from "effect" as a namespace import', () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": 'export * from "#plate/d.ts";\nexport * from "effect";\n',
        "src/d.ts": 'import { Schema } from "effect";\n',
      }),
      [violation("src/a.ts", "effect", "*", 2), violation("src/d.ts", "effect", "Schema")],
    );
  });

  it("does not count a dynamic import, import.meta, or an import inside a comment or a string", () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": [
          'const lazy = () => import("effect");',
          "const here = import.meta.url;",
          '// import { Schema } from "effect";',
          '/* export * from "effect"; */',
          "const quoted = 'import { Schema } from \"effect\"';",
          'const template = `\nimport { Schema } from "effect";\n`;',
          "",
        ].join("\n"),
      }),
      [],
    );
  });

  it("reports a declaration it cannot read rather than skipping it", () => {
    assert.deepStrictEqual(scan({ "src/a.ts": 'import fs = require("node:fs");\n' }), [
      violation("src/a.ts", "", "(unreadable)"),
    ]);
  });
});

describe("readImports", () => {
  it("reads each name before as, and which declarations and names are type-only", () => {
    assert.deepStrictEqual(
      readImports(
        [
          'import type { A } from "a";',
          'import { type B, C as D } from "b";',
          'import E, * as F from "c";',
          'export type * from "d";',
          'export { G as default } from "e";',
          "export { H };",
          "",
        ].join("\n"),
      ),
      {
        imports: [
          { line: 1, names: [{ name: "A", typeOnly: false }], specifier: "a", typeOnly: true },
          {
            line: 2,
            names: [
              { name: "B", typeOnly: true },
              { name: "C", typeOnly: false },
            ],
            specifier: "b",
            typeOnly: false,
          },
          {
            line: 3,
            names: [
              { name: "default", typeOnly: false },
              { name: "*", typeOnly: false },
            ],
            specifier: "c",
            typeOnly: false,
          },
          { line: 4, names: [{ name: "*", typeOnly: false }], specifier: "d", typeOnly: true },
          { line: 5, names: [{ name: "G", typeOnly: false }], specifier: "e", typeOnly: false },
        ],
        unreadable: [],
      },
    );
  });
});
