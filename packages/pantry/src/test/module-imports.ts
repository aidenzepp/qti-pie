/**
 * The one reader of a TypeScript module's imports, for the tests that hold pantry's module graph to
 * a rule: the command line's startup graph (`src/cli/startup.test.ts`) and the boundary between
 * the XML side and the PostgreSQL side (`src/import/boundary.test.ts`).
 */
import { Predicate } from "effect";

/**
 * How a module names another. `value` is a static `import … from`, `export … from` or bare
 * `import "…"` that brings a value in, a mixed `import { type A, b }` included. `type` is a
 * statement that is wholly `import type` or `export type`, which brings no value in. `dynamic` is
 * an `import("…")`, a call that loads the module only when it runs, or a type that names it.
 */
export type ImportForm = "dynamic" | "type" | "value";

/**
 * One import, re-export or `import("…")` of a module: how it names the module, the specifier, and
 * its `text`, the statement or call up to the specifier's closing quote with each run of white
 * space written as one space, for a test's failure message.
 */
export interface ModuleImport {
  readonly form: ImportForm;
  readonly specifier: string;
  readonly text: string;
}

/**
 * Tell how a matched import names its module, by the group of {@link moduleImports}' pattern that
 * holds its specifier.
 *
 * @param group - The group: `dynamic` for an `import("…")`, `from` or `bare` for a statement.
 * @param text - The statement or call, as {@link ModuleImport} writes it.
 * @returns How it names the module.
 */
const formOf = (group: string, text: string): ImportForm => {
  if (group === "dynamic") {
    return "dynamic";
  }

  return /^(?:import|export)\s+type\b/u.test(text) ? "type" : "value";
};

/**
 * Read every module a TypeScript module names: its imports and re-exports, type-only ones included,
 * its bare imports, and its dynamic `import(…)` calls and `import("…")` types.
 *
 * Comments are dropped and string literals kept whole first, so a commented-out import counts for
 * nothing, and a `/*` inside a string hides no code after it.
 *
 * @param source - The text of a TypeScript module.
 * @returns The imports, in source order.
 */
export const moduleImports = (source: string): readonly ModuleImport[] => {
  const code = source.replaceAll(
    /(?<literal>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu,
    (_text, literal: string | undefined) => literal ?? "",
  );
  const found = code.matchAll(
    /^[ \t]*(?:import|export)\b(?!\s*\()[^;]*?\bfrom\s*["'](?<from>[^"']+)["']|^[ \t]*import\s*["'](?<bare>[^"']+)["']|\bimport\s*\(\s*["'](?<dynamic>[^"']+)["']/gmu,
  );

  return [...found].flatMap(({ 0: written, groups }) => {
    const text = written.trim().replaceAll(/\s+/gu, " ");

    return Object.entries(groups ?? {}).flatMap(([group, specifier]) =>
      Predicate.isString(specifier) ? [{ form: formOf(group, text), specifier, text }] : [],
    );
  });
};
