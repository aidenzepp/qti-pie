/**
 * Every timeout a test runs under is a hang guard, measured, never its budget: a search stops by
 * its case count (`runs`, an exhaustive `limit`), and its test's timeout is only the deadline past
 * which it hung. `@grizzle/testing`'s `searched` reads that timeout as the search's deadline and
 * fails with `DeadlineReached` once it arrives (`explore.ts`, `Run.deadline`), so a timeout near a
 * search's running time makes the search check less as the machine gets busier, and fail red where
 * nothing is wrong. Vitest's own default, 5 s, is a deadline no suite chose.
 *
 * The guard reads every test file of `packages/pantry/src` and `packages/crust/src`, and each
 * package's `vite.config.ts`:
 *
 * - Each test project states its `testTimeout` and `hookTimeout`, at least {@link hangGuardMs}, so no
 *   test runs under the 5 s default;
 * - Each test that calls `searched` and states a timeout of its own, or sits in a `describe` that
 *   states one, states at least {@link hangGuardMs}, a number or a constant that holds one, so it
 *   reads;
 * - Each constant a test, a `describe`, a `layer` or a hook of the free project states as its timeout
 *   records in its doc comment a measurement taken at a load average of at least {@link busyLoad},
 *   written `Measured <day>: <seconds> s at a load average of <least>`, or `of <least> to <most>`,
 *   the least and most figures `uptime` gave through the run (its one-, five- and fifteen-minute
 *   averages), of the slowest test or hook it times, and holds at least twice the slowest such
 *   measurement. A budget measured on an idle machine is one a busy machine exceeds: the hooks of
 *   `vocab/derive/declarations.test.ts` and `vocab/derive/models.test.ts`, measured at a load near
 *   12 and given four times that, took 231 s and 427 s at a load of 76 to 87, past budgets of 160 s
 *   and 240 s;
 * - Each timeout a test, a `describe`, a `layer` or a hook of the free project states is such a
 *   constant, or a conditional of them, and never a number or a string written in place, so every
 *   stated timeout carries its measurement;
 * - The guard reads each test file to its end: none opens a string, a template or a comment the
 *   reader never closes ({@link openIn}), so no call after one goes unread, and the reader takes a
 *   regular expression and a template's substitution as the code they are;
 * - {@link exempt} holds only test files of either package that still write a timeout in place, so an
 *   entry outlives neither its file nor its literal.
 *
 * The database project's files, named `*.db.test.ts` or `*.packaging.test.ts` or gated on the lease
 * (`vite.config.ts` reads them so), run one at a time on a lease, which a free run does not hold,
 * so the measured-constant and literal rules leave their timeouts to a measurement taken there. A
 * test that runs only under `GR8DES_GENETIC=1`, or sits in a `describe` that does, is a long
 * budget, as a conditional constant's other branch is: it states a named constant, and its
 * measurement is the long run's. {@link exempt} names the files no lane may edit, which the literal
 * rule leaves as they are.
 *
 * The floor is measured, not chosen: every suite was run once on 2026-11-07, pantry's free project
 * and crust's, each under `nice -n 15` with 3 workers at a load average of 63 to 73 (lane TD-B).
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
 * The test files the literal rule leaves as they are, each with why: a file no lane may edit.
 */
const exempt: ReadonlyMap<string, string> = new Map([
  [
    "pantry/src/test/declaration-rows.oracle.test.ts",
    "measurement owed: its 338-case exhaust ran 620.1 s in lane NIL's run of 2026-11-07 under the swarm, whose load was not recorded, and 48.3 s at a load average of 5 to 12; its 1_800_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/test/count-forms.oracle.test.ts",
    "measurement owed: its 28-case exhaust ran 41.3 s at a load average of 33 to 46 in FIX-NS5's run of 2026-11-07, and 48.7 s in a concurrent one, whose load was not recorded; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/test/test-fragment-references.oracle.test.ts",
    "measurement owed: its 32-case exhaust ran 61.2 s at a load average of 31 to 46 in FIX-ASM's run of 2026-11-07, beside two other suites, and 135.9 s in lane ASM's run under the swarm, whose load was not recorded; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/import/overlays/manifest-identifiers.oracle.test.ts",
    "measurement owed: its 320-case exhaust ran 20.8 s, and 16.1 s at a load average of 32 to 39, in FB-WRITE's runs of 2026-11-07; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/import/manifest-document.oracle.test.ts",
    "measurement owed: its 146-package box ran 20.0 s in FIX-MANIFEST's run of 2026-11-07, which recorded no load average; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/import/overlays/expressions.absence.oracle.test.ts",
    "measurement owed: its 18-package box ran under FB-EXPR's run of 2026-11-07, whose load average was below 60, and its 9-package box, once FIX-A1 struck the timing cases, 3.9 s at a load average of 34 to 40 beside four other suites; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/import/law-names.test.ts",
    "measurement owed: its one test compiles Qti's law model twice (6caa20ef), measured only at a load average below 60; its 300_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/import/overlays/expressions.ns1.oracle.test.ts",
    "measurement owed: FB-EXPR's NS1 guard (66716a8b) ran at a load average below 60; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/qti/item-ref-href.oracle.test.ts",
    "measurement owed: FIX-ITEMREF's 128-package exhaust (65a3c4dd) ran 8.8 s at a load average of 21 to 22, its slowest run; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/qti/duplicate-declaration.oracle.test.ts",
    "measurement owed: FIX-DUPDECL's 21-package guard (8c6394a1) ran in a run of 2026-11-07 that recorded no load average; its 600_000 stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/grammar/attributes.test.ts",
    "measurement owed: its describe's literal 300_000 went unread until the guard's reader took a regular expression literal as one (2026-11-10), and no lane edits this file; it stays in place until it is remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/model/shred.oracle.test.ts",
    "measurement owed: its literals 150_000 and 420_000 went unread until the guard's reader took a regular expression literal as one (2026-11-10), and no lane edits this file; they stay in place until they are remeasured at a load average of at least 60",
  ],
  [
    "pantry/src/test/complete.oracle.test.ts",
    "measurement owed: its literal 300_000 went unread until the guard's reader took a regular expression literal as one (2026-11-10), and no lane edits this file; it stays in place until it is remeasured at a load average of at least 60",
  ],
]);

/**
 * The least load average a timeout's measurement may be taken at, of every figure `uptime` gave
 * through the run: a busy machine's, as a run beside the other suites reaches it.
 */
const busyLoad = 60;

/**
 * The folder holding both packages, which a module's path is relative to.
 */
const packagesRoot = path.resolve(import.meta.dirname, "..", "..", "..");

/**
 * The package folders the guard reads, each with its `src` and its `vite.config.ts`, by the
 * import alias its modules are reached by.
 */
const packages = { crust: "crust", pantry: "pantry" } as const;

/**
 * A measurement a timeout's doc comment records: how long the slowest test or hook it times took,
 * in seconds, and the least load average `uptime` gave through the run.
 */
interface Measurement {
  readonly load: number;
  readonly seconds: number;
}

/**
 * A constant of a module: where it is declared, the measurements its doc comment records, and its
 * milliseconds, the least number its initializer holds, or `unread` for one that holds none.
 */
interface Constant {
  readonly at: string;
  readonly measured: readonly Measurement[];
  readonly ms: number | "unread";
}

/**
 * A test file the guard reads: its path, for the messages, its text, and the constants it reaches
 * by name, its own and those it imports.
 */
interface Source {
  readonly constants: ReadonlyMap<string, Constant>;
  readonly file: string;
  readonly text: string;
}

/**
 * The words after which a `/` opens a regular expression literal rather than dividing.
 */
const beforeRegex: ReadonlySet<string> = new Set([
  "await",
  "case",
  "delete",
  "do",
  "else",
  "in",
  "instanceof",
  "new",
  "of",
  "return",
  "throw",
  "typeof",
  "void",
  "yield",
]);

/**
 * Whether the `/` at an offset opens a regular expression literal, read from the text before it: it
 * divides after a name, a number, a literal or a closing parenthesis or bracket, and opens a
 * regular expression after anything else, an operator, an opening bracket, a comma or a `}`, or one
 * of {@link beforeRegex}.
 *
 * @param text - The module's text.
 * @param at - The offset of the `/`.
 * @returns Whether a regular expression may open there.
 */
const opensRegex = (text: string, at: number): boolean => {
  let back = at - 1;
  while (back >= 0 && /\s/u.test(text.charAt(back))) {
    back -= 1;
  }

  const last = text.charAt(back);
  if (/[\w$]/u.test(last)) {
    let first = back;
    while (first > 0 && /[\w$]/u.test(text.charAt(first - 1))) {
      first -= 1;
    }

    return beforeRegex.has(text.slice(first, back + 1));
  }

  return back < 0 || !")]\u0022\u0027\u0060".includes(last);
};

/**
 * Find the end of the regular expression literal that opens at an offset: its closing `/`, outside
 * a character class and an escape. A literal ends on its line, so a `/` the line never closes was a
 * division.
 *
 * @param text - The module's text.
 * @param at - The offset of the opening `/`.
 * @returns The offset past the closing `/`, or -1 where the line closes none.
 */
const regexEnd = (text: string, at: number): number => {
  let inClass = false;
  for (let next = at + 1; next < text.length && text[next] !== "\n"; next += 1) {
    const character = text[next];
    if (character === "\\") {
      next += 1;
    } else if (character === "[") {
      inClass = true;
    } else if (character === "]") {
      inClass = false;
    } else if (character === "/" && !inClass) {
      return next + 1;
    }
  }

  return -1;
};

/**
 * Find the end of the template literal that opens at an offset: its closing backtick, past each
 * substitution, which is read as code.
 *
 * @param text - The module's text.
 * @param at - The offset of the opening backtick.
 * @param skip - Reads the literal or comment that starts at an offset of a substitution, as
 *   {@link skipped} does.
 * @returns The offset past the closing backtick, past the text's end where there is none.
 */
const templateEnd = (
  text: string,
  at: number,
  skip: (text: string, at: number) => number,
): number => {
  let next = at + 1;
  while (next < text.length && text[next] !== "`") {
    if (text[next] === "\\") {
      next += 2;
    } else if (text.startsWith("${", next)) {
      let depth = 1;
      next += 2;
      while (next < text.length && depth > 0) {
        const past = skip(text, next);
        if (past === -1) {
          depth += text[next] === "{" ? 1 : 0;
          depth -= text[next] === "}" ? 1 : 0;
          next += 1;
        } else {
          next = past;
        }
      }
    } else {
      next += 1;
    }
  }

  return next + 1;
};

/**
 * The offset just past a string literal, a template literal, a regular expression literal, a
 * comment, or none: what the reader skips whole, so a bracket, a comma or a quotation mark inside
 * one is no syntax. A template's substitutions are read as code, where a literal of their own may
 * hold a backtick or a brace. A string ends on its line, as a string does, and a string, a template
 * or a block comment the text never closes ends one past the text's end, so every reader stops
 * there and {@link openIn} finds it: a block comment's missing close once read as offset 1, which
 * sent the reader back to the text's start forever while its spans filled the heap. A quotation
 * mark in a regular expression literal of `db/workload-only.test.ts` once opened a string that a
 * glob's quotation mark closed, and the glob's `/*` was then read as a comment.
 *
 * @param text - The module's text.
 * @param at - The offset of the character to read.
 * @returns The offset past the literal or comment that starts there, past the text's end for one
 *   the text never closes, or -1.
 */
const skipped = (text: string, at: number): number => {
  const quote = text[at];
  if (quote === '"' || quote === "'") {
    let next = at + 1;
    while (next < text.length && text[next] !== quote && text[next] !== "\n") {
      next += text[next] === "\\" ? 2 : 1;
    }

    return text[next] === quote ? next + 1 : text.length + 1;
  }

  if (quote === "`") {
    return templateEnd(text, at, skipped);
  }

  if (text.startsWith("//", at)) {
    const end = text.indexOf("\n", at);

    return end === -1 ? text.length : end;
  }

  if (text.startsWith("/*", at)) {
    const end = text.indexOf("*/", at + 2);

    return end === -1 ? text.length + 1 : end + 2;
  }

  return quote === "/" && opensRegex(text, at) ? regexEnd(text, at) : -1;
};

/**
 * Split a bracketed list, a call's arguments or an object's entries, at its top-level commas.
 *
 * @param text - The module's text.
 * @param open - The offset of the list's opening bracket.
 * @returns The items' texts, and the offset just past the closing bracket.
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
 * Mark where a module's string literals, template literals, regular expression literals and
 * comments stand, so a call written inside one, as a planted case's text, is no call.
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
 * Find the string literal, template literal or block comment a module opens and never closes, as
 * the reader reads it: a literal the reader misreads can open one, and every call after it then
 * reads as quoted, so the guard reads none of them.
 *
 * @param text - The module's text.
 * @returns The offset where the unclosed literal or comment starts, or none.
 */
const openIn = (text: string): number | undefined =>
  quotedIn(text).find(([, past]) => past > text.length)?.[0];

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
 * Read the measurements a doc comment records, each `Measured <day>: <seconds> s at a load average
 * of <least>`, or `of <least> to <most>`, a line break of the comment read as a space.
 *
 * @param doc - The doc comment's text.
 * @returns Each measurement, in order.
 */
const measurementsIn = (doc: string): readonly Measurement[] =>
  [
    ...doc
      .replaceAll(/\s*\n\s*\*\s*/gu, " ")
      .matchAll(
        /\bMeasured \d{4}-\d{2}-\d{2}: (?<seconds>\d+(?:\.\d+)?) s at a load average of (?<load>\d+(?:\.\d+)?)/gu,
      ),
  ].map(({ groups }) => ({
    load: Number(groups?.["load"] ?? ""),
    seconds: Number(groups?.["seconds"] ?? ""),
  }));

/**
 * Read a module's constants, each with the doc comment just above it.
 *
 * @param file - The module's path, relative to {@link packagesRoot}.
 * @param text - The module's text.
 * @returns Each constant by its name, and whether the module exports it.
 */
const constantsIn = (
  file: string,
  text: string,
): readonly (readonly [string, Constant, boolean])[] =>
  [
    ...text.matchAll(
      /(?:\/\*\*(?<doc>(?:[^*]|\*(?!\/))*)\*\/\s*)?(?<exported>export\s+)?\bconst (?<name>[\w$]+)\s*=\s*(?<value>[^;]+);/gu,
    ),
  ].map(({ groups }) => {
    const name = groups?.["name"] ?? "";
    const numbers = numbersIn(groups?.["value"] ?? "");

    return [
      name,
      {
        at: `${file}: ${name}`,
        measured: measurementsIn(groups?.["doc"] ?? ""),
        ms: numbers.length === 0 ? "unread" : Math.min(...numbers),
      },
      groups?.["exported"] !== undefined,
    ] as const;
  });

/**
 * Read every TypeScript module of both packages' `src`.
 *
 * @returns Each module's path, relative to {@link packagesRoot}, and its text.
 */
const modulesOf = (): readonly (readonly [string, string])[] =>
  Object.values(packages).flatMap((name) =>
    readdirSync(path.join(packagesRoot, name, "src"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => {
        const file = path.join(entry.parentPath, entry.name);

        return [path.relative(packagesRoot, file), readFileSync(file, "utf-8")] as const;
      }),
  );

/**
 * The constants each module of both packages exports, by the module's path.
 */
const exportedBy: ReadonlyMap<string, ReadonlyMap<string, Constant>> = new Map(
  modulesOf().map(([file, text]) => [
    file,
    new Map(
      constantsIn(file, text).flatMap(([name, constant, exported]) =>
        exported ? [[name, constant] as const] : [],
      ),
    ),
  ]),
);

/**
 * Read the constants a module imports from either package by its alias, `#pantry/…` or `#crust/…`,
 * each under the name the module reads it by.
 *
 * @param text - The module's text.
 * @returns Each imported constant the guard finds exported.
 */
const importedIn = (text: string): readonly (readonly [string, Constant])[] =>
  [
    ...text.matchAll(
      /\bimport\s*(?:type\s*)?\{(?<names>[^}]*)\}\s*from\s*["']#(?<alias>pantry|crust)\/(?<module>[^"']+)["']/gu,
    ),
  ].flatMap(({ groups }) => {
    const alias = groups?.["alias"] === "crust" ? packages.crust : packages.pantry;
    const exported = exportedBy.get(path.join(alias, "src", groups?.["module"] ?? ""));

    return (groups?.["names"] ?? "").split(",").flatMap((written) => {
      const [name = "", local = name] = written
        .trim()
        .replace(/^type\s+/u, "")
        .split(/\s+as\s+/u);
      const constant = exported?.get(name);

      return constant === undefined ? [] : [[local, constant] as const];
    });
  });

/**
 * Read a test file: its own constants and those it imports, each by the name it reads it by.
 *
 * @param file - The file's path, for the messages.
 * @param text - The file's text.
 * @returns The source.
 */
const sourceOf = (file: string, text: string): Source => ({
  constants: new Map([
    ...importedIn(text),
    ...constantsIn(file, text).map(([name, constant]) => [name, constant] as const),
  ]),
  file,
  text,
});

/**
 * Read every test file under a package's `src`.
 *
 * @param name - The package's folder name.
 * @returns Its test files.
 */
const testsOf = (name: string): readonly Source[] =>
  readdirSync(path.join(packagesRoot, name, "src"), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
    .map((entry) => {
      const file = path.join(entry.parentPath, entry.name);

      return sourceOf(path.relative(packagesRoot, file), readFileSync(file, "utf-8"));
    });

/**
 * Whether a test file runs in the database project, as `vite.config.ts` reads it: by its name, or
 * by the lease gate its text names. The gate's name is matched as a pattern, so this file's own
 * text does not name it and move the guard there.
 *
 * @param source - The test file.
 * @returns Whether it is a database file.
 */
const inDatabaseProject = ({ file, text }: Source): boolean =>
  /\.(?:db|packaging)\.test\.ts$/u.test(file) || /has[L]ease/u.test(text);

/**
 * Read a timeout's milliseconds: a numeric literal, a constant the file reaches whose initializer
 * holds a number, or a conditional of two, of which the less.
 *
 * @param source - The file the timeout is written in.
 * @param written - The timeout as written.
 * @returns The milliseconds, or `unread` for a timeout the guard cannot read.
 */
const millisOf = (source: Source, written: string): number | "unread" => {
  const timeout = written.trim();
  const conditional = /^[^?:]+\?(?<when>[^:]+):(?<otherwise>[^:]+)$/u.exec(timeout)?.groups;
  if (conditional !== undefined) {
    const either = [conditional["when"] ?? "", conditional["otherwise"] ?? ""].map((branch) =>
      millisOf(source, branch),
    );

    return either.includes("unread") ? "unread" : Math.min(...either.map(Number));
  }

  if (/^\d[\d_]*$/u.test(timeout)) {
    return Number(timeout.replaceAll("_", ""));
  }

  return source.constants.get(timeout)?.ms ?? "unread";
};

/**
 * A call of a test, a `describe`, a `layer` or a hook: its callee, its arguments, and where it
 * starts and ends.
 */
interface Call {
  readonly callee: string;
  readonly chain: string;
  readonly end: number;
  readonly parts: readonly string[];
  readonly start: number;
}

/**
 * The hooks whose second argument is their timeout.
 */
const hooks: ReadonlySet<string> = new Set(["afterAll", "afterEach", "beforeAll", "beforeEach"]);

/**
 * Find a module's calls of tests, `describe`s, `layer`s and hooks, outside its string literals and
 * comments.
 *
 * @param text - The module's text.
 * @returns Each call, in order.
 */
const callsIn = (text: string): readonly Call[] => {
  const quoted = quotedIn(text);

  return [
    ...text.matchAll(
      /\b(?<callee>describe|it|test|layer|afterAll|afterEach|beforeAll|beforeEach|\w+(?=\.effect\b))(?:\.\w+(?:\([^)]*\))?)*\s*\(/gu,
    ),
  ].flatMap((call) => {
    if (quoted.some(([start, past]) => start <= call.index && call.index < past)) {
      return [];
    }

    const [parts, end] = argumentsAt(text, call.index + call[0].length - 1);

    return [
      { callee: call.groups?.["callee"] ?? "", chain: call[0], end, parts, start: call.index },
    ];
  });
};

/**
 * Read the `timeout` entry of an options object.
 *
 * @param part - An argument's text.
 * @returns The entry's value as written, or none where the argument is no object or states none.
 */
const optionTimeout = (part: string): string | undefined => {
  const object = part.trim();
  if (!object.startsWith("{")) {
    return undefined;
  }

  const [entries] = argumentsAt(object, 0);

  return entries
    .map((entry) => /^\s*timeout\s*(?::(?<value>[\s\S]+))?$/u.exec(entry))
    .map((found) => (found === null ? undefined : (found.groups?.["value"]?.trim() ?? "timeout")))
    .find((value) => value !== undefined);
};

/**
 * Read the timeout a call states, as written: a hook's second argument, a `layer`'s `timeout`
 * option, or a test's or a `describe`'s `{ timeout }` option among its arguments or the number or
 * constant past its function (its third argument).
 *
 * @param call - The call.
 * @returns The timeout as written, or none where it states none, or a test or `describe` has no
 *   written title.
 */
const timeoutOf = ({ callee, parts }: Call): string | undefined => {
  if (hooks.has(callee)) {
    const timeout = parts[1]?.trim();

    return timeout === "" ? undefined : timeout;
  }

  if (callee === "layer") {
    return optionTimeout(parts[1] ?? "");
  }

  if (!/^[\u0022\u0027\u0060]/u.test((parts[0] ?? "").trim())) {
    return undefined;
  }

  const option = parts
    .slice(1)
    .map(optionTimeout)
    .find((value) => value !== undefined);
  const third = (parts[1] ?? "").trim().startsWith("{") ? undefined : parts[2]?.trim();

  return option ?? (third === "" ? undefined : third);
};

/**
 * A test that calls `searched` under a timeout it states: where, its title, and the milliseconds.
 */
interface Stated {
  readonly at: string;
  readonly timeout: number | "unread";
}

/**
 * Find every search's stated timeout in a test file: each test call whose body calls `searched`,
 * with the timeout it states, else the innermost `describe` around it that states one.
 *
 * @param source - The test file.
 * @returns Each stated timeout.
 */
export const searchTimeouts = (source: Source): readonly Stated[] => {
  const scopes: {
    readonly end: number;
    readonly start: number;
    readonly timeout: number | "unread";
  }[] = [];
  const stated: Stated[] = [];
  for (const call of callsIn(source.text)) {
    const title = (call.parts[0] ?? "").trim();
    if (
      hooks.has(call.callee) ||
      call.callee === "layer" ||
      !/^[\u0022\u0027\u0060]/u.test(title)
    ) {
      continue;
    }

    const written = timeoutOf(call);
    const own = written === undefined ? undefined : millisOf(source, written);
    if (call.callee === "describe") {
      if (own !== undefined) {
        scopes.push({ end: call.end, start: call.start, timeout: own });
      }

      continue;
    }

    const around = scopes.findLast(({ end, start }) => start < call.start && end > call.end);
    const timeout = own ?? around?.timeout;
    if (timeout !== undefined && call.parts.slice(1).some((part) => /\bsearched\(/u.test(part))) {
      stated.push({ at: `${source.file}: ${title.slice(1, 80)}`, timeout });
    }
  }

  return stated;
};

/**
 * Whether a call runs only under `GR8DES_GENETIC=1`: its own chain, or a `describe`'s around it,
 * skips it unless `settings.geneticRequested`.
 *
 * @param calls - The file's calls.
 * @param call - The call.
 * @returns Whether only the long run runs it.
 */
const geneticOnly = (calls: readonly Call[], call: Call): boolean =>
  [
    call,
    ...calls.filter(
      ({ callee, end, start }) => callee === "describe" && start < call.start && end > call.end,
    ),
  ].some(({ chain }) => /\bgeneticRequested\b/u.test(chain));

/**
 * Find every constant a test file states as a timeout: each name in a test's, a `describe`'s, a
 * `layer`'s or a hook's timeout that names a constant the file reaches whose initializer holds a
 * number.
 *
 * @param source - The test file.
 * @returns Each such constant, once for each call that states it.
 */
const namedTimeouts = (source: Source): readonly Constant[] => {
  const calls = callsIn(source.text);

  return calls
    .filter((call) => !geneticOnly(calls, call))
    .flatMap((call) =>
      [...(timeoutOf(call) ?? "").matchAll(/(?<![\w$.])[A-Za-z_$][\w$]*/gu)].flatMap(([name]) => {
        const constant = source.constants.get(name);

        return constant === undefined || constant.ms === "unread" ? [] : [constant];
      }),
    );
};

/**
 * A timeout written in place: a call's stated timeout that holds a number or a string, not only
 * the names of constants.
 */
interface Written {
  readonly at: string;
  readonly timeout: string;
}

/**
 * Find every timeout a test file writes in place: each call whose stated timeout holds a numeric
 * or string literal.
 *
 * @param source - The test file.
 * @returns Each such timeout, where it stands and as written.
 */
const writtenTimeouts = (source: Source): readonly Written[] =>
  callsIn(source.text).flatMap((call) => {
    const timeout = timeoutOf(call);
    const line = source.text.slice(0, call.start).split("\n").length;

    return timeout !== undefined && /[\u0022\u0027\u0060]|(?<![\w$.])\d/u.test(timeout)
      ? [{ at: `${source.file}:${String(line)}`, timeout: timeout.replaceAll(/\s+/gu, " ") }]
      : [];
  });

/**
 * Why a constant is no measured timeout: `idle` where none of its measurements was taken at a load
 * average of {@link busyLoad} or more, and `short` where it holds less than twice the slowest of
 * those; none where it is one.
 *
 * @param constant - The constant.
 * @returns Why it fails the rule, or none.
 */
const unmeasured = ({ measured, ms }: Constant): "idle" | "short" | undefined => {
  const busy = measured.filter(({ load }) => load >= busyLoad).map(({ seconds }) => seconds);
  if (busy.length === 0) {
    return "idle";
  }

  return ms === "unread" || ms < 2 * 1000 * Math.max(...busy) ? "short" : undefined;
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
  searchTimeouts(sourceOf("planted.test.ts", text)).map(({ timeout }) => timeout);

describe("the timeouts a test runs under", () => {
  it("states each project's testTimeout and hookTimeout, at least the hang guard, in both packages", () => {
    for (const name of Object.values(packages)) {
      const config = readFileSync(path.join(packagesRoot, name, "vite.config.ts"), "utf-8");
      const projects = Math.max(1, [...config.matchAll(/\bname\s*:\s*\u0022/gu)].length);
      const timeouts = projectTimeouts(config);

      for (const key of ["testTimeout", "hookTimeout"]) {
        const stated = timeouts.filter(([held]) => held === key).map(([, ms]) => ms);
        assert.lengthOf(stated, projects, `${name}/vite.config.ts states ${key} in each project`);
        assert.isTrue(
          stated.every((ms) => ms >= hangGuardMs),
          `${name}/vite.config.ts: ${key} ${stated.join(", ")} below the hang guard ${String(hangGuardMs)}`,
        );
      }
    }
  });

  it("states no search a timeout below the hang guard, and each one as a number it reads", () => {
    const short = Object.values(packages)
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

  it("times the free project by constants measured at a busy load, each twice its slowest", () => {
    const failing = new Map(
      Object.values(packages)
        .flatMap(testsOf)
        .filter((source) => !inDatabaseProject(source))
        .flatMap(namedTimeouts)
        .flatMap((constant) => {
          const why = unmeasured(constant);

          return why === undefined ? [] : [[constant.at, `${constant.at} (${why})`] as const];
        }),
    );

    assert.deepStrictEqual(
      [...failing.values()].toSorted(),
      [],
      `timeout constants with no measurement at a load average of ${String(busyLoad)} or more (idle), or under twice their slowest (short)`,
    );
  });

  it("states every timeout of the free project as a named constant, never a literal", () => {
    const literal = Object.values(packages)
      .flatMap(testsOf)
      .filter((source) => !inDatabaseProject(source) && !exempt.has(source.file))
      .flatMap(writtenTimeouts)
      .map(({ at, timeout }) => `${at} (${timeout})`);

    assert.deepStrictEqual(literal, [], "timeouts written in place, not as a measured constant");
  });

  it("exempts only test files of either package that still write a timeout in place", () => {
    const sources = Object.values(packages).flatMap(testsOf);
    const read = new Set(sources.map(({ file }) => file));
    const literal = new Set(
      sources.filter((source) => writtenTimeouts(source).length > 0).map(({ file }) => file),
    );

    assert.deepStrictEqual(
      [...exempt.keys()].filter((file) => !read.has(file)),
      [],
      "exempt files that are no test file of either package: delete the entry of a file that is gone or renamed",
    );
    assert.deepStrictEqual(
      [...exempt.keys()].filter((file) => !literal.has(file)),
      [],
      "exempt files that write no timeout in place: delete the entry of a file the literal rule can read",
    );
  });

  it("reads every test file to its end, none opening a literal or a comment it never closes", () => {
    const open = Object.values(packages)
      .flatMap(testsOf)
      .flatMap(({ file, text }) => {
        const at = openIn(text);

        return at === undefined ? [] : [`${file}:${String(text.slice(0, at).split("\n").length)}`];
      });

    assert.deepStrictEqual(
      open,
      [],
      "test files whose text the reader misreads, so the calls after the unclosed literal go unread",
    );
  });

  it("reads past a regular expression, a template and a division, and finds the call after each", () => {
    // Oracle: the reader's rule on planted modules, each followed by a search at vitest's 5 s that
    // the guard must find. Live: a regular expression that holds a quotation mark, an apostrophe or
    // a backtick, one in a character class or after `return`, a template whose substitution holds
    // a template or a quoted backtick, and a division beside a string that holds a slash. Wild: the
    // misreads of the reader that took a regular expression for code, where `db/workload-only.test.ts`'s
    // quotation mark opened a string a glob's closed.
    const search = 'it.effect("a", (ctx) => searched(ctx, x), 5_000);';
    /* oxlint-disable no-template-curly-in-string -- planted module text, which holds templates */
    const read = [
      'const p = /"/u;\nconst g = "**/*.ts";',
      "const p = /'/u;\nconst g = '**/*.ts';",
      'const p = /`/u;\nconst g = "**/*.ts";',
      'const p = /["\'`/]/u;\nconst g = "**/*.ts";',
      'const f = () => {\n  return /"/u;\n};\nconst g = "**/*.ts";',
      'const t = `a ${x ? `"` : "`"} b`;\nconst g = "**/*.ts";',
      'const t = `a ${{ b: `${c}` }.b} d`;\nconst g = "**/*.ts";',
      'const half = total / 2;\nconst ratio = (a + b) / 2 / c;\nconst slash = "/";',
    ];
    /* oxlint-enable no-template-curly-in-string */

    for (const text of read) {
      assert.isUndefined(openIn(text), text);
      assert.deepStrictEqual(planted(`${text}\n${search}`), [5000], text);
    }
  });

  it("reads a literal or a comment the text never closes to the text's end, and finds where it opened", () => {
    // Oracle: the reader's rule on planted modules. Live: a string that reaches the end of its line,
    // a template and one whose substitution never closes, and a block comment, which once read as
    // offset 1 and sent the reader back to the text's start forever. Wild: a call after each, which
    // the reader must leave unread.
    const search = 'it.effect("a", (ctx) => searched(ctx, x), 5_000);';
    const unclosed: readonly (readonly [string, string])[] = [
      ['const s = "never closed;', '"'],
      ["const s = 'never closed;", "'"],
      ["const t = `never closed;", "`"],
      // oxlint-disable-next-line no-template-curly-in-string -- planted module text
      ["const t = `a ${b;", "`"],
      ["const c = 1; /* never closed;", "/*"],
    ];

    for (const [text, opener] of unclosed) {
      assert.strictEqual(openIn(text), text.indexOf(opener), text);
      assert.strictEqual(openIn(`${text}\n${search}`), text.indexOf(opener), text);
      assert.deepStrictEqual(planted(`${text}\n${search}`), [], text);
    }
  });

  it("finds a planted search under a deadline, a project on the 5 s default and an unread timeout", () => {
    // Oracle: the rule above, on the named cases. Live: a search under the hang guard, stated
    // itself, by a constant, by its describe, and by a conditional of two. Wild: a search at
    // vitest's 5 s, one under a describe's 30 s, an unread timeout, and a configuration that
    // states none.

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
          'it.effect("k", (ctx) => searched(ctx, x), { timeout: long ? 900_000 : guard });',
        ].join("\n"),
      ),
      [120_000, 600_000, 300_000, 5000, 30_000, "unread", 600_000],
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

  it("finds a planted constant measured on an idle machine, or under twice its slowest", () => {
    // Oracle: the rule above, on the named cases. Live: a constant measured at a busy load and
    // over twice it, read by a test, a hook and a layer, and by a conditional's branch. Wild: the
    // prose the two hooks that timed out held ("at a load average near 12"), a canonical
    // measurement at a load of 12, a busy measurement the budget is under twice of, a constant with
    // no doc comment, and a literal, which names no constant.
    const source = sourceOf(
      "planted.test.ts",
      [
        "/**",
        " * Measured 2026-11-07: 23.1 s at a load average",
        " * of 63 to 73, its slowest test.",
        " */",
        "const busy = 60_000;",
        "/** Measured on 2026-11-05 at a load average near 12: 30 s. The budget is four times that. */",
        "const idle = 160_000;",
        "/** Measured 2026-11-05: 30 s at a load average of 12. */",
        "const quiet = 160_000;",
        "/** Measured 2026-11-07: 231.4 s at a load average of 76 to 87. */",
        "const short = 160_000;",
        "const bare = 60_000;",
        'it.effect("a", () => Effect.void, busy);',
        'describe("b", { timeout: idle }, () => {});',
        "beforeAll(() => preload, quiet);",
        'layer(Suite, { timeout: short })("c", (it) => {});',
        'it.effect("d", () => Effect.void, { timeout: long ? busy : bare });',
        'it.effect("e", () => Effect.void, 5_000);',
      ].join("\n"),
    );

    assert.deepStrictEqual(
      namedTimeouts(source).map((constant) => [constant.at, unmeasured(constant)]),
      [
        ["planted.test.ts: busy", undefined],
        ["planted.test.ts: idle", "idle"],
        ["planted.test.ts: quiet", "idle"],
        ["planted.test.ts: short", "short"],
        ["planted.test.ts: busy", undefined],
        ["planted.test.ts: bare", "idle"],
      ],
    );
  });

  it("finds a planted timeout written in place, and leaves a long run's and a named one", () => {
    // Oracle: the last two rules, on the named cases. Live: a test, a describe, a layer and a hook
    // that each state a constant or a conditional of two, a hook that states none, and a long run's
    // constant with no measurement, which the measured rule leaves to the long run. Wild: a number
    // stated by a test, a describe, a layer and a hook, a duration written as a string, and a
    // number beside a constant in a conditional.
    const source = sourceOf(
      "planted.test.ts",
      [
        "const named = 60_000;",
        "const longTimeoutMs = 3_600_000;",
        'it.effect("a", () => Effect.void, named);',
        'describe("b", { timeout: long ? named : named }, () => {});',
        'layer(Suite, { timeout: named })("c", (it) => {});',
        "beforeAll(() => preload, named);",
        "beforeAll(() =>\n  preload,\n);",
        'it.effect.skipIf(!settings.geneticRequested)("d", () => Effect.void, longTimeoutMs);',
        'it.effect("e", () => Effect.void, 120_000);',
        'describe("f", { timeout: 300_000 }, () => {});',
        'layer(Suite, { timeout: "120 seconds" })("g", (it) => {});',
        "beforeAll(() => preload, 60_000);",
        'it.effect("h", () => Effect.void, { timeout: long ? 900_000 : named });',
      ].join("\n"),
    );

    assert.deepStrictEqual(
      writtenTimeouts(source).map(({ at, timeout }) => `${at} ${timeout}`),
      [
        "planted.test.ts:11 120_000",
        "planted.test.ts:12 300_000",
        'planted.test.ts:13 "120 seconds"',
        "planted.test.ts:14 60_000",
        "planted.test.ts:15 long ? 900_000 : named",
      ],
    );
    assert.deepStrictEqual(
      namedTimeouts(source).map(({ at }) => at),
      Array.from({ length: 6 }, () => "planted.test.ts: named"),
      "the long run's constant is left to the long run",
    );
  });
});
