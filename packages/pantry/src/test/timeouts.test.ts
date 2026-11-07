/**
 * Every timeout a search runs under is a hang guard, never its budget: a search stops by its case
 * count (`runs`, an exhaustive `limit`), and its test's timeout is only the deadline past which it
 * hung. `@grizzle/testing`'s `searched` reads that timeout as the search's deadline and fails with
 * `DeadlineReached` once it arrives (`explore.ts`, `Run.deadline`), so a timeout near a search's
 * running time makes the search check less as the machine gets busier, and fail red where nothing
 * is wrong. Vitest's own default, 5 s, is a deadline no suite chose.
 *
 * The guard reads every test file of `packages/pantry/src` and `packages/crust/src`, and each
 * package's `vite.config.ts`:
 *
 * - Each test project states its `testTimeout` and `hookTimeout`, at least {@link hangGuardMs}, so no
 *   test runs under the 5 s default;
 * - Each test that calls `searched` and states a timeout of its own, or sits in a `describe` that
 *   states one, states at least {@link hangGuardMs}, a number or a constant of the file that holds
 *   one, so it reads.
 *
 * The floor is measured, not chosen: every suite was run once on 2026-11-07, pantry's free project
 * and crust's, each under `nice -n 15` with 3 workers at a load average of 64 to 73 (lane TD-B).
 * The slowest test that took a project's timeout, re-run under it, ran 12.2 s at a load average of
 * 83 (`fixtures.foreign.test.ts`), so the floor, 60 s, is over 4× that, and every test that ran
 * past half of it states its own timeout, at least 2× its time there.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The least timeout a test project or a search may state, in milliseconds.
 */
const hangGuardMs = 60_000;

/**
 * The package folders the guard reads, each with its `src` and its `vite.config.ts`.
 */
const packages = [
  path.resolve(import.meta.dirname, "..", ".."),
  path.resolve(import.meta.dirname, "..", "..", "..", "crust"),
];

/**
 * A test file the guard reads: its path, for the messages, and its text.
 */
interface Source {
  readonly file: string;
  readonly text: string;
}

/**
 * Read every test file under a package's `src`.
 *
 * @param root - The package's folder.
 * @returns Its test files.
 */
const testsOf = (root: string): readonly Source[] =>
  readdirSync(path.join(root, "src"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
    .map((entry) => {
      const file = path.join(entry.parentPath, entry.name);

      return { file: path.relative(path.dirname(root), file), text: readFileSync(file, "utf-8") };
    });

/**
 * The offset just past a string literal, a comment, or none: what the reader skips whole, so a
 * bracket or a comma inside one is no syntax.
 *
 * @param text - The module's text.
 * @param at - The offset of the character to read.
 * @returns The offset past the literal or comment that starts there, or -1.
 */
const skipped = (text: string, at: number): number => {
  const quote = text[at];
  if (quote === '"' || quote === "'" || quote === "`") {
    let next = at + 1;
    while (next < text.length && text[next] !== quote) {
      next += text[next] === "\\" ? 2 : 1;
    }

    return next + 1;
  }

  if (text.startsWith("//", at)) {
    const end = text.indexOf("\n", at);

    return end === -1 ? text.length : end;
  }

  return text.startsWith("/*", at) ? text.indexOf("*/", at) + 2 : -1;
};

/**
 * Split a call's arguments at its top-level commas.
 *
 * @param text - The module's text.
 * @param open - The offset of the call's opening parenthesis.
 * @returns The arguments' texts, and the offset just past the closing parenthesis.
 */
const argumentsAt = (text: string, open: number): readonly [readonly string[], number] => {
  const parts: string[] = [];
  let depth = 0;
  let start = open + 1;
  let at = open + 1;
  while (at < text.length) {
    const past = skipped(text, at);
    if (past !== -1) {
      at = past;
      continue;
    }

    const character = text[at] ?? "";
    if ("([{".includes(character)) {
      depth += 1;
    } else if (")]}".includes(character)) {
      if (depth === 0) {
        parts.push(text.slice(start, at));

        return [parts, at + 1];
      }

      depth -= 1;
    } else if (character === "," && depth === 0) {
      parts.push(text.slice(start, at));
      start = at + 1;
    }

    at += 1;
  }

  return [parts, at];
};

/**
 * Read the numeric literals of an initializer.
 *
 * @param initializer - The text after a constant's `=`.
 * @returns Its numbers, `_` separators dropped.
 */
const numbersIn = (initializer: string): readonly number[] =>
  [...initializer.matchAll(/(?<![\w.])\d[\d_]*(?![\w.])/gu)].map(([digits]) =>
    Number(digits.replaceAll("_", "")),
  );

/**
 * The milliseconds each exported numeric constant of the packages' sources holds, the less of a
 * conditional's two, for a timeout a test imports.
 */
const exported: ReadonlyMap<string, number> = new Map(
  packages
    .flatMap((root) =>
      readdirSync(path.join(root, "src"), { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
        .map((entry) => readFileSync(path.join(entry.parentPath, entry.name), "utf-8")),
    )
    .flatMap((text) =>
      [...text.matchAll(/\bexport const (?<name>\w+)\s*=\s*(?<value>[^;]+);/gu)].flatMap(
        ({ groups }) => {
          const numbers = numbersIn(groups?.["value"] ?? "");

          return numbers.length === 0
            ? []
            : [[groups?.["name"] ?? "", Math.min(...numbers)] as const];
        },
      ),
    ),
);

/**
 * Read a timeout's milliseconds: a numeric literal, or a constant of the file or an exported one
 * whose initializer is a numeric literal, or a conditional of two, of which the less.
 *
 * @param text - The module's text.
 * @param written - The timeout as written.
 * @returns The milliseconds, or `unread` for a timeout the guard cannot read.
 */
const millisOf = (text: string, written: string): number | "unread" => {
  if (/^\d[\d_]*$/u.test(written)) {
    return Number(written.replaceAll("_", ""));
  }

  const initializer = new RegExp(`\\bconst ${written}\\s*=\\s*(?<value>[^;]+);`, "u").exec(text)
    ?.groups?.["value"];
  const numbers = numbersIn(initializer ?? "");

  return numbers.length > 0 ? Math.min(...numbers) : (exported.get(written) ?? "unread");
};

/**
 * Read the timeout a test or a `describe` call states: a `{ timeout }` option among its arguments,
 * or a numeric literal or constant past its function (its third argument).
 *
 * @param text - The module's text.
 * @param parts - The call's arguments, its title first.
 * @returns The milliseconds, `unread`, or none where it states no timeout.
 */
const statedTimeout = (text: string, parts: readonly string[]): number | "unread" | undefined => {
  const option = parts
    .slice(1)
    .map((part) => part.trim())
    .filter((part) => part.startsWith("{"))
    .map((part) => /^\{[^{]*?\btimeout\s*:\s*(?<value>[\w$]+)/u.exec(part)?.groups?.["value"])
    .find((value) => value !== undefined);
  const third = (parts[1] ?? "").trim().startsWith("{") ? undefined : parts[2]?.trim();
  if (option !== undefined) {
    return millisOf(text, option);
  }

  if (third === undefined || third === "") {
    return undefined;
  }

  return /^[\w$]+$/u.test(third) ? millisOf(text, third) : "unread";
};

/**
 * A test that calls `searched` under a timeout it states: where, its title, and the milliseconds.
 */
interface Stated {
  readonly at: string;
  readonly timeout: number | "unread";
}

/**
 * Mark where a module's string literals and comments stand, so a call written inside one, as a
 * planted case's text, is no call.
 *
 * @param text - The module's text.
 * @returns Each literal's or comment's start and end offsets.
 */
const quotedIn = (text: string): readonly (readonly [number, number])[] => {
  const spans: (readonly [number, number])[] = [];
  let at = 0;
  while (at < text.length) {
    const past = skipped(text, at);
    if (past === -1) {
      at += 1;
    } else {
      spans.push([at, past]);
      at = past;
    }
  }

  return spans;
};

/**
 * Find every search's stated timeout in a test file: each test call whose body calls `searched`,
 * with the timeout it states, else the innermost `describe` around it that states one.
 *
 * @param source - The test file.
 * @returns Each stated timeout.
 */
export const searchTimeouts = (source: Source): readonly Stated[] => {
  const { file, text } = source;
  const scopes: {
    readonly end: number;
    readonly start: number;
    readonly timeout: number | "unread";
  }[] = [];
  const stated: Stated[] = [];
  const quoted = quotedIn(text);
  for (const call of text.matchAll(
    /\b(?<callee>describe|it|test|\w+(?=\.effect\b))(?:\.\w+(?:\([^)]*\))?)*\s*\(/gu,
  )) {
    if (quoted.some(([start, past]) => start <= call.index && call.index < past)) {
      continue;
    }

    const open = call.index + call[0].length - 1;
    const [parts, end] = argumentsAt(text, open);
    const title = (parts[0] ?? "").trim();
    if (!/^["'`]/u.test(title)) {
      continue;
    }

    const own = statedTimeout(text, parts);
    if (call.groups?.["callee"] === "describe") {
      if (own !== undefined) {
        scopes.push({ end, start: call.index, timeout: own });
      }

      continue;
    }

    const around = scopes.findLast(({ end: last, start }) => start < call.index && last > end);
    const timeout = own ?? around?.timeout;
    if (timeout !== undefined && parts.slice(1).some((part) => /\bsearched\(/u.test(part))) {
      stated.push({ at: `${file}: ${title.slice(1, 80)}`, timeout });
    }
  }

  return stated;
};

/**
 * Read a test project's stated timeouts from its configuration's text.
 *
 * @param config - The text of a `vite.config.ts`.
 * @returns Each `testTimeout` and `hookTimeout` it states, in order.
 */
export const projectTimeouts = (config: string): readonly (readonly [string, number])[] =>
  [...config.matchAll(/\b(?<key>testTimeout|hookTimeout)\s*:\s*(?<value>[\d_]+)/gu)].map(
    ({ groups }) => [groups?.["key"] ?? "", Number((groups?.["value"] ?? "").replaceAll("_", ""))],
  );

/**
 * The stated timeouts of the searches of a planted test file.
 *
 * @param text - The file's text.
 * @returns Each search's stated timeout, in order.
 */
const planted = (text: string): readonly (number | "unread")[] =>
  searchTimeouts({ file: "planted.test.ts", text }).map(({ timeout }) => timeout);

describe("the timeouts a test runs under", () => {
  it("states each project's testTimeout and hookTimeout, at least the hang guard, in both packages", () => {
    for (const root of packages) {
      const config = readFileSync(path.join(root, "vite.config.ts"), "utf-8");
      const projects = Math.max(1, [...config.matchAll(/\bname\s*:\s*"/gu)].length);
      const timeouts = projectTimeouts(config);

      for (const key of ["testTimeout", "hookTimeout"]) {
        const stated = timeouts.filter(([name]) => name === key).map(([, ms]) => ms);
        assert.lengthOf(stated, projects, `${root}/vite.config.ts states ${key} in each project`);
        assert.isTrue(
          stated.every((ms) => ms >= hangGuardMs),
          `${root}/vite.config.ts: ${key} ${stated.join(", ")} below the hang guard ${String(hangGuardMs)}`,
        );
      }
    }
  });

  it("states no search a timeout below the hang guard, and each one as a number it reads", () => {
    const short = packages
      .flatMap(testsOf)
      .flatMap(searchTimeouts)
      .filter(({ timeout }) => timeout === "unread" || timeout < hangGuardMs)
      .map(({ at, timeout }) => `${at} (${String(timeout)})`);

    assert.deepStrictEqual(
      short,
      [],
      "searches whose stated timeout is a budget, not a hang guard",
    );
  });

  it("finds a planted search under a deadline, a project on the 5 s default and an unread timeout", () => {
    // Oracle: the rule above, on the named cases. Live: a search under the hang guard, stated
    // itself, by a constant, and by its describe. Wild: a search at vitest's 5 s, one under a
    // describe's 30 s, an unread timeout, and a configuration that states none.

    assert.deepStrictEqual(
      planted(
        [
          'it.effect("a", (ctx) => searched(ctx, x), 120_000);',
          "const guard = 600_000;",
          'it.effect("b", (ctx) => searched(ctx, x), guard);',
          'describe("c", { timeout: 300_000 }, () => { it.effect("d", (ctx) => searched(ctx, x)); });',
          'it.effect("e", (ctx) => searched(ctx, x), 5_000);',
          'describe("f", { timeout: 30_000 }, () => { it.effect("g", (ctx) => searched(ctx, x)); });',
          'it.effect("h", (ctx) => searched(ctx, x), timeoutOf(x));',
          'it.effect("i", () => Effect.void, 5_000);',
        ].join("\n"),
      ),
      [120_000, 600_000, 300_000, 5000, 30_000, "unread"],
    );
    assert.deepStrictEqual(
      planted('it.effect("j", (ctx) => searched(ctx, x), 5_000);').filter(
        (timeout) => timeout === "unread" || timeout < hangGuardMs,
      ),
      [5000],
      "the planted deadline-bounded search is below the hang guard",
    );
    assert.deepStrictEqual(projectTimeouts("export default defineConfig({ test: {} });"), []);
  });
});
