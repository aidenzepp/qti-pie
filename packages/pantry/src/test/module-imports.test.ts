import { assert, describe, it } from "@effect/vitest";
import { moduleImports } from "#pantry/test/module-imports.ts";

/**
 * Read a module's imports as `form specifier`, the form and the module each names.
 *
 * @param source - The text of a TypeScript module.
 * @returns Each import as `form specifier`, in source order.
 */
const formsOf = (source: string): readonly string[] =>
  moduleImports(source).map(({ form, specifier }) => `${form} ${specifier}`);

describe("moduleImports", () => {
  it("reads every form: a statement, a type-only statement, and a dynamic import or type", () => {
    assert.deepStrictEqual(
      formsOf(
        [
          'import {\n  a,\n  b,\n} from "#pantry/a.ts";',
          'import type {\n  C,\n} from "#pantry/c.ts";',
          'export { d } from "#pantry/d.ts";',
          'export * from "#pantry/e.ts";',
          'import "#pantry/f.ts";',
          'const g = await import("#pantry/g.ts");',
          'type H = import("#pantry/h.ts").H;',
          'export type { I } from "#pantry/i.ts";',
          'import { type J, k } from "#pantry/j.ts";',
        ].join("\n"),
      ),
      [
        "value #pantry/a.ts",
        "type #pantry/c.ts",
        "value #pantry/d.ts",
        "value #pantry/e.ts",
        "value #pantry/f.ts",
        "dynamic #pantry/g.ts",
        "dynamic #pantry/h.ts",
        "type #pantry/i.ts",
        "value #pantry/j.ts",
      ],
    );
  });

  it("writes a statement's text on one line, up to its specifier", () => {
    assert.deepStrictEqual(
      moduleImports('  import {\n  a,\n  b,\n} from "#pantry/a.ts";\n').map(({ text }) => text),
      ['import { a, b, } from "#pantry/a.ts"'],
    );
  });

  it("reads no import inside a comment, and loses none after a string", () => {
    assert.deepStrictEqual(
      formsOf(
        [
          '/* import { a } from "#pantry/a.ts"; */',
          '// import "#pantry/b.ts";',
          '// const load = () => import("#pantry/g.ts");',
          'const glob = "src/**/*.ts";',
          'export { c } from "#pantry/c.ts";',
        ].join("\n"),
      ),
      ["value #pantry/c.ts"],
    );
  });
});
