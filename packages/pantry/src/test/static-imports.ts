/**
 * The static import graph of pantry's source, read from its text: the imports a module writes, and
 * the modules a module reaches through them that name a forbidden module. The startup tests
 * (`src/cli/startup.test.ts`, `src/index.startup.test.ts`) hold the command line's and the entry's
 * graphs to what each may load.
 */
import path from "node:path";

/**
 * The `src` folder, where `#pantry/<x>` resolves to `src/<x>`.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * One import or re-export of a source module, as it is written.
 */
export interface StaticImport {
  readonly specifier: string;
  readonly text: string;
}

/**
 * Every static, non-type import of `source`: `import … from "x"`, a bare `import "x"`, and
 * `export … from "x"`, each over any number of lines.
 *
 * A dynamic `import(…)` is not counted, nor is a statement that is wholly `import type` or
 * `export type`. A mixed `import { type A, b }` is counted, because `b` is a value.
 *
 * @param source - The text of a TypeScript module.
 * @returns The statements, in source order.
 */
export const staticImports = (source: string): readonly StaticImport[] => {
  const withoutComments = source
    .replaceAll(/\/\*[\s\S]*?\*\//gu, "")
    .replaceAll(/^\s*\/\/.*$/gmu, "");
  const statements = withoutComments.matchAll(
    /^[ \t]*(?:import\s*["'](?<bare>[^"']+)["']|(?:import|export)\b(?!\s*\()[^;]*?\bfrom\s*["'](?<named>[^"']+)["'])/gmu,
  );

  return [...statements]
    .filter(([text]) => !/^\s*(?:import|export)\s+type\b/u.test(text))
    .map(({ 0: text, groups }) => ({
      specifier: groups?.["bare"] ?? groups?.["named"] ?? "",
      text: text.trim(),
    }));
};

/**
 * The modules a module reaches through static `#pantry/` imports, and the first import that names a
 * forbidden module.
 *
 * @param entry - The absolute path of the module to start from.
 * @param forbidden - The specifier prefixes no module of the graph may import.
 * @param read - Reads a module's text.
 * @returns Each offending module and import, as `module: import`.
 */
export const forbiddenImports = (
  entry: string,
  forbidden: readonly string[],
  read: (file: string) => string,
): readonly string[] => {
  const seen = new Set<string>();
  const offences: string[] = [];
  const pending = [entry];

  while (pending.length > 0) {
    const file = pending.pop() ?? entry;

    if (seen.has(file)) {
      continue;
    }

    seen.add(file);

    for (const { specifier, text } of staticImports(read(file))) {
      if (forbidden.some((prefix) => specifier.startsWith(prefix))) {
        offences.push(`${path.relative(sourceRoot, file)}: ${text.replaceAll(/\s+/gu, " ")}`);
      } else if (specifier.startsWith("#pantry/")) {
        pending.push(path.join(sourceRoot, specifier.slice("#pantry/".length)));
      }
    }
  }

  return offences;
};
