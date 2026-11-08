/**
 * Every scratch folder the test support makes is under the package's `work/`: no call of the
 * platform's `makeTempDirectory` or `makeTempDirectoryScoped`, and no `mkdtemp`, leaves its folder
 * unnamed, which would put it in the operating system's temporary folder (AGENTS.md, "Shared
 * machine resources": never `/tmp`). A test reaches `work/` through
 * `#pantry/test/scratch.ts`'s `scratchDirectory` or `fileScratchDirectory`.
 *
 * Oracle: a search of every TypeScript module of `packages/pantry/src` and `packages/crust/src`,
 * reading each such call's whole argument list, so a `directory` on the next line counts.
 * `pnpm test` sets `TMPDIR` under `work/`, but a file run alone does not, so the search, not the
 * script, is the guard.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The source folders the search reads.
 */
const roots = [
  path.resolve(import.meta.dirname, ".."),
  path.resolve(import.meta.dirname, "..", "..", "..", "crust", "src"),
];

/**
 * A call that makes a temporary folder, up to its opening parenthesis.
 */
const callStart = /\b(?:makeTempDirectoryScoped|makeTempDirectory|mkdtempSync|mkdtemp)\(/gu;

/**
 * List every TypeScript module under a folder.
 *
 * @param folder - The folder.
 * @returns The modules' paths.
 */
const modulesUnder = (folder: string): readonly string[] =>
  readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) => path.join(entry.parentPath, entry.name));

/**
 * Read a call's argument list: the text from its opening parenthesis to the one that closes it.
 *
 * @param source - The module's text.
 * @param open - The offset just after the opening parenthesis.
 * @returns The arguments' text.
 */
const argumentsAt = (source: string, open: number): string => {
  let depth = 1;
  let at = open;
  for (; at < source.length && depth > 0; at += 1) {
    if (source[at] === "(") {
      depth += 1;
    } else if (source[at] === ")") {
      depth -= 1;
    }
  }

  return source.slice(open, at - 1);
};

/**
 * Find the calls in a module that make a temporary folder and name none: a platform call whose
 * options give no `directory`, or a `mkdtemp` whose prefix is not under `workRoot`.
 *
 * @param file - The module's path.
 * @returns Each such call as `file:line`.
 */
const unnamedIn = (file: string): readonly string[] => {
  const source = readFileSync(file, "utf-8");

  return [...source.matchAll(callStart)].flatMap((match) => {
    const named = match[0].startsWith("mkdtemp") ? /\bworkRoot\b/u : /\bdirectory\b/u;
    const line = source.slice(0, match.index).split("\n").length;

    return named.test(argumentsAt(source, match.index + match[0].length))
      ? []
      : [`${path.relative(path.resolve(import.meta.dirname, "..", "..", ".."), file)}:${line}`];
  });
};

describe("scratch folders", () => {
  it("are all made under a named folder, never the operating system's temporary one", () => {
    const files = roots.flatMap(modulesUnder);

    assert.isAbove(files.length, 100, "the search reads the sources");
    assert.deepStrictEqual(files.flatMap(unnamedIn), []);
  });
});
