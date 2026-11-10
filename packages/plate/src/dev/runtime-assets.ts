/**
 * The dev playground's browser runtime, as the modules a page loads (issue m3d-13): the static
 * import graph from a runtime entry, each module's TypeScript stripped to JavaScript and each
 * `#plate/` specifier rewritten to the URL the playground serves that module at, all in memory.
 *
 * A page cannot resolve `#plate/*`, which `package.json` `imports` maps for Node alone, and there
 * is no bundler, so the playground does what a bundler would at its smallest: it walks the
 * declarations that load a module, strips the types of each module it reaches with Node's own
 * `stripTypeScriptTypes` (the same erasure Node runs the source with, so no module the repository
 * runs is refused), and answers only for the modules it reached. The walk follows `import` and
 * `export … from` declarations; a dynamic `import(…)` is not a declaration and is not followed, as
 * in the browser allowlist's reader (`src/test/imports.ts`).
 *
 * The runtime's promise is that its bundle carries no library (`runtime.dom.ts`), so a module whose
 * stripped text still loads anything but a `#plate/` TypeScript module ends the walk with
 * {@link RuntimeImportRefused}: a bare package such as `effect`, a Node built-in, a relative path.
 * That includes `import { type A } from "effect"`, which erasure leaves as `import {} from
 * "effect"`, a load a page cannot resolve.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it, and it
 * imports no module of the DOM program, which it names only by path.
 *
 * @module
 * @see https://nodejs.org/api/module.html#modulestriptypescripttypescode-options (`stripTypeScriptTypes`, `mode: "strip"` keeps every character's position and so every comment)
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { Effect, Schema } from "effect";

/**
 * The module a page loads to start the runtime (issue m3d-13), by its path under `src/`: it
 * upgrades the page once the document is parsed, and the runtime's graph hangs from it.
 */
export const bootModule = "dev/runtime-boot.dom.ts";

/**
 * The type of every module the playground serves under `/runtime/` (issue m3d-13).
 */
export const runtimeScriptType = "text/javascript; charset=utf-8";

/**
 * The prefix of the package's own import alias, which resolves to `src/`.
 */
const plateAlias = "#plate/";

/**
 * One segment of a module's path under `src/`: it begins with a word character or `-`, so it is
 * never `.` or `..` and a specifier cannot climb out of `src/`.
 */
const moduleSegment = /^[\w-][\w.-]*$/u;

/**
 * Give the URL a module is served at (issue m3d-13): `/runtime/` and its path under `src/` with
 * `.ts` replaced by `.js`.
 *
 * @param id The module's path under `src/`, such as `interactions/hotspot.dom.ts`.
 * @returns The URL path, such as `/runtime/interactions/hotspot.dom.js`.
 */
export const runtimeUrl = (id: string): string => `/runtime/${id.replace(/\.ts$/u, ".js")}`;

/**
 * The failure of a module of the runtime's graph that loads something a page cannot load from the
 * playground (issue m3d-13): a package, a Node built-in, a relative path, or a `#plate/` path that
 * is not a TypeScript module under `src/`.
 */
export class RuntimeImportRefused extends Schema.TaggedError<RuntimeImportRefused>()(
  "RuntimeImportRefused",
  { module: Schema.String, specifier: Schema.String },
) {
  /**
   * The module, the specifier, and what to change.
   */
  override get message(): string {
    return `${this.module} imports "${this.specifier}", which the playground cannot serve to a page: the runtime's modules may load only other #plate/ TypeScript modules, so no package or Node built-in reaches the page. Remove the import, or move what needs it out of the modules the runtime reaches.`;
  }
}

/**
 * The failure of a module of the runtime's graph that cannot be read or whose types cannot be
 * erased (issue m3d-13): the file is missing or unreadable, or it uses TypeScript syntax that has
 * to be compiled, not erased.
 */
export class RuntimeModuleUnreadable extends Schema.TaggedError<RuntimeModuleUnreadable>()(
  "RuntimeModuleUnreadable",
  { detail: Schema.String, module: Schema.String },
) {
  /**
   * The module, why, and what to change.
   */
  override get message(): string {
    return `Cannot serve the runtime module ${this.module}: ${this.detail}. Restore the file under packages/plate/src, and write it as erasable TypeScript (no enum, namespace or parameter property), which is all the playground strips.`;
  }
}

/**
 * Why the runtime's graph cannot be served (issue m3d-13): a module loads what a page cannot load,
 * or a module cannot be read or stripped.
 */
export type RuntimeFailure = RuntimeImportRefused | RuntimeModuleUnreadable;

/**
 * How the walk reads a module's TypeScript (issue m3d-13): by its path under `src/`, as the text
 * the file holds.
 *
 * @param id The module's path under `src/`.
 * @returns Its TypeScript, or {@link RuntimeModuleUnreadable} when it cannot be read.
 */
export type ReadModule = (id: string) => Effect.Effect<string, RuntimeModuleUnreadable>;

/**
 * One module of the runtime's graph as the playground serves it (issue m3d-13).
 */
export interface RuntimeModule {
  /**
   * The module's path under `src/`.
   */
  readonly id: string;
  /**
   * The JavaScript served: the module's text with its types erased and its `#plate/` specifiers
   * rewritten, every comment kept.
   */
  readonly source: string;
  /**
   * The URL path it is served at, {@link runtimeUrl} of `id`.
   */
  readonly url: string;
}

/**
 * The modules of the runtime's graph by the URL path each is served at: the whole set the
 * playground answers `/runtime/` with, and nothing else (issue m3d-13).
 */
export type RuntimeBundle = Effect.Effect<ReadonlyMap<string, string>, RuntimeFailure>;

/**
 * What a token of the source is: a name, a string literal, one punctuator character, or a value
 * (a number, template text or a regular expression literal).
 */
type TokenKind = "name" | "punctuator" | "string" | "value";

/**
 * A token of the source with where it is and how many brackets and template substitutions are open
 * where it starts; a closing bracket is read after it closes, so a bracket pair's tokens share the
 * depth of the code around it.
 */
interface Token {
  readonly depth: number;
  readonly end: number;
  readonly kind: TokenKind;
  readonly start: number;
  readonly text: string;
}

/**
 * White space and comments, which the tokenizer steps over. Every pattern below is sticky, so it
 * matches only at the index it is given.
 */
const skipped = /(?:\s+|\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))+/uy;

/**
 * A string literal, closed or not at the end of its line.
 */
const stringLiteral = /"(?:[^"\\\n]|\\[\s\S])*"?|'(?:[^'\\\n]|\\[\s\S])*'?/uy;

/**
 * An identifier or a keyword.
 */
const nameLiteral = /[\p{ID_Start}$_][\p{ID_Continue}$\u200C\u200D]*/uy;

/**
 * A numeric literal, loosely: a digit and the word characters and dots after it.
 */
const numberLiteral = /\.?\d[\w.]*/uy;

/**
 * Template text up to the closing backtick or the `${` that opens a substitution; the group `end`
 * holds which ended it, and is absent at the end of the source.
 */
const templateText = /(?:[^`\\$]|\\[\s\S]|\$(?!\{))*(?<end>`|\$\{)?/uy;

/**
 * A regular expression literal, its character classes and escapes included, with its flags.
 */
const regexLiteral = /\/(?:[^/\\[\n]|\\.|\[(?:[^\]\\\n]|\\.)*\])+\/[\p{ID_Continue}]*/uy;

/**
 * The keywords after which a `/` starts a regular expression rather than a division.
 */
const keywordsBeforeExpression: ReadonlySet<string> = new Set([
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
 * Match a sticky pattern at an index.
 *
 * @param pattern A pattern with the `y` flag.
 * @param source The source.
 * @param index Where the match must start.
 * @returns The match, or undefined when the pattern does not match there.
 */
const matchAt = (pattern: RegExp, source: string, index: number): RegExpExecArray | undefined => {
  pattern.lastIndex = index;

  return pattern.exec(source) ?? undefined;
};

/**
 * Decide whether a `/` after a token starts a regular expression literal: at the start, after a
 * punctuator that does not close a group, or after a keyword that precedes an expression.
 *
 * @param previous The token before the `/`, if any.
 * @returns Whether the `/` starts a regular expression.
 */
const regexMayFollow = (previous: Token | undefined): boolean =>
  previous === undefined ||
  (previous.kind === "punctuator" && !")]}".includes(previous.text)) ||
  (previous.kind === "name" && keywordsBeforeExpression.has(previous.text));

/**
 * Split JavaScript into tokens, stepping over comments and through template literals, whose
 * substitutions are tokenised one level deeper, so a comment, a string, a template or a regular
 * expression that holds the text of an import is never read as one.
 *
 * @param source The module's JavaScript.
 * @returns Its tokens, in source order.
 */
const tokenize = (source: string): readonly Token[] => {
  const tokens: Token[] = [];
  const open: ("bracket" | "substitution")[] = [];

  /**
   * Record a token with the number of groups open where it starts.
   *
   * @param kind The token's kind.
   * @param start Where its text starts.
   * @param end Where its text ends.
   * @returns `end`, the index to read on from.
   */
  const push = (kind: TokenKind, start: number, end: number): number => {
    tokens.push({ depth: open.length, end, kind, start, text: source.slice(start, end) });

    return end;
  };

  /**
   * Read template text up to its closing backtick, recorded as one value, or up to a `${`, which
   * opens a substitution whose code is read next.
   *
   * @param start The index after a backtick or a substitution's `}`.
   * @returns The index to read on from.
   */
  const template = (start: number): number => {
    const match = matchAt(templateText, source, start);
    const end = start + (match?.[0].length ?? 0);

    if (match?.groups?.["end"] === "${") {
      push("punctuator", end - 2, end);
      open.push("substitution");

      return end;
    }

    return push("value", start - 1, end);
  };

  /**
   * Read one punctuator, opening or closing a bracket or, at a substitution's `}`, returning to its
   * template's text.
   *
   * @param index Where the punctuator is.
   * @returns The index to read on from.
   */
  const punctuator = (index: number): number => {
    const character = source.charAt(index);

    if (character === "}" && open.at(-1) === "substitution") {
      open.pop();

      return template(index + 1);
    }

    if (")]}".includes(character)) {
      open.pop();
    }

    push("punctuator", index, index + 1);

    if ("([{".includes(character)) {
      open.push("bracket");
    }

    return index + 1;
  };

  /**
   * Read the token at an index: template text, a literal or name, a regular expression literal
   * where one may start, or else a punctuator.
   *
   * @param index Where the token starts.
   * @returns The index to read on from.
   */
  const step = (index: number): number => {
    if (source.charAt(index) === "`") {
      return template(index + 1);
    }

    const space = matchAt(skipped, source, index);

    if (space !== undefined) {
      return index + space[0].length;
    }

    for (const [pattern, kind] of [
      [stringLiteral, "string"],
      [nameLiteral, "name"],
      [numberLiteral, "value"],
    ] as const) {
      const match = matchAt(pattern, source, index);

      if (match !== undefined) {
        return push(kind, index, index + match[0].length);
      }
    }

    const regex =
      source.charAt(index) === "/" && regexMayFollow(tokens.at(-1))
        ? matchAt(regexLiteral, source, index)
        : undefined;

    return regex === undefined ? punctuator(index) : push("value", index, index + regex[0].length);
  };

  let index = 0;

  while (index < source.length) {
    index = step(index);
  }

  return tokens;
};

/**
 * Decide whether a token is a name, and that name when one is given.
 *
 * @param token The token, if any.
 * @param text The name it must be.
 * @returns Whether it is.
 */
const isName = (token: Token | undefined, text: string): boolean =>
  token?.kind === "name" && token.text === text;

/**
 * Decide whether a token is a given punctuator.
 *
 * @param token The token, if any.
 * @param text The punctuator.
 * @returns Whether it is.
 */
const isPunctuator = (token: Token | undefined, text: string): boolean =>
  token?.kind === "punctuator" && token.text === text;

/**
 * One module specifier a declaration loads, with where its text sits in the source, the quotes
 * excluded.
 */
interface Declared {
  readonly end: number;
  readonly specifier: string;
  readonly start: number;
}

/**
 * Read a string token as a specifier.
 *
 * @param token The token, a string literal.
 * @returns Its text without the quotes and where that text sits.
 */
const declared = (token: Token): Declared => ({
  end: token.end - 1,
  specifier: token.text.slice(1, -1),
  start: token.start + 1,
});

/**
 * Read the specifier `from "<specifier>"` gives at an index.
 *
 * @param tokens The module's tokens.
 * @param from The index `from` must be at.
 * @returns The specifier, or none when `from` and a string are not there.
 */
const specifierAfter = (tokens: readonly Token[], from: number): readonly Declared[] => {
  const specifier = tokens[from + 1];

  return isName(tokens[from], "from") && specifier?.kind === "string" ? [declared(specifier)] : [];
};

/**
 * Read the module a declaration at an index loads: `import "x"`, `import … from "x"`,
 * `export * from "x"`, `export * as n from "x"` and `export { … } from "x"`. A dynamic `import(…)`,
 * `import.meta` and a local `export` load nothing.
 *
 * @param tokens The module's tokens.
 * @param index The index of an `import` or `export` at the top level.
 * @returns The specifier it loads, or none.
 */
const loadedBy = (tokens: readonly Token[], index: number): readonly Declared[] => {
  const next = tokens[index + 1];

  if (isName(tokens[index], "import")) {
    if (isPunctuator(next, "(") || isPunctuator(next, ".")) {
      return [];
    }

    if (next?.kind === "string") {
      return [declared(next)];
    }

    const from = tokens.findIndex(
      (token, at) =>
        at > index &&
        token.depth === 0 &&
        isName(token, "from") &&
        tokens[at + 1]?.kind === "string",
    );

    return from === -1 ? [] : specifierAfter(tokens, from);
  }

  if (isPunctuator(next, "*")) {
    return specifierAfter(tokens, isName(tokens[index + 2], "as") ? index + 4 : index + 2);
  }

  if (isPunctuator(next, "{")) {
    const close = tokens.findIndex(
      (token, at) => at > index + 1 && token.depth === 0 && isPunctuator(token, "}"),
    );

    return close === -1 ? [] : specifierAfter(tokens, close + 1);
  }

  return [];
};

/**
 * Read the specifiers of a module's top-level `import` and `export … from` declarations.
 *
 * @param source The module's JavaScript, after its types are erased.
 * @returns The specifiers in source order.
 */
const declarationsIn = (source: string): readonly Declared[] => {
  const tokens = tokenize(source);

  return tokens.flatMap((token, index) =>
    token.depth === 0 &&
    (isName(token, "import") || isName(token, "export")) &&
    !isPunctuator(tokens[index - 1], ".")
      ? loadedBy(tokens, index)
      : [],
  );
};

/**
 * Give the module a specifier loads: a `#plate/` path of a TypeScript file under `src/`, none of
 * whose segments is `.` or `..`.
 *
 * @param specifier The specifier, as written.
 * @returns The module's path under `src/`, or none for any other specifier.
 */
const moduleOf = (specifier: string): string | undefined => {
  const id = specifier.slice(plateAlias.length);

  return specifier.startsWith(plateAlias) &&
    specifier.endsWith(".ts") &&
    id.split("/").every((segment) => moduleSegment.test(segment))
    ? id
    : undefined;
};

/**
 * Erase a module's types.
 *
 * `mode: "strip"` replaces each type with white space and keeps every other character where it
 * was, so a comment and a line number stay as written, and refuses syntax that needs a compiler
 * (an `enum`, a `namespace`, a parameter property), which Node refuses as well.
 *
 * @param id The module's path under `src/`.
 * @param source Its TypeScript.
 * @returns Its JavaScript, or {@link RuntimeModuleUnreadable} when Node cannot erase it.
 */
const stripped = (id: string, source: string): Effect.Effect<string, RuntimeModuleUnreadable> =>
  Effect.try({
    catch: (cause) =>
      new RuntimeModuleUnreadable({
        detail: cause instanceof Error ? cause.message : String(cause),
        module: id,
      }),
    try: () => stripTypeScriptTypes(source, { mode: "strip" }),
  });

/**
 * Walk the runtime's static import graph from a module and give each module it reaches as
 * JavaScript with its specifiers rewritten (issue m3d-13).
 *
 * A module is read, erased and listed once, in the order the walk first reaches it (depth first,
 * the entry first), however many modules load it and whether the loads form a cycle. Every
 * specifier its declarations load must name a `#plate/` TypeScript module, which becomes that
 * module's {@link runtimeUrl}; any other ends the walk with {@link RuntimeImportRefused}.
 *
 * @param entry The module the walk starts from, by its path under `src/`.
 * @param read How a module's TypeScript is read; {@link readRuntimeModule} for the package's files.
 * @returns Every module reached, the entry first; the first {@link RuntimeFailure} the walk meets
 *   otherwise.
 */
export const runtimeModules = Effect.fn("runtimeModules")(function* runtimeModules(
  entry: string,
  read: ReadModule,
): Effect.fn.Return<readonly RuntimeModule[], RuntimeFailure> {
  const reached = new Set<string>();
  const modules: RuntimeModule[] = [];

  /**
   * Read, erase and rewrite one module, list it, then walk the modules it loads.
   *
   * @param id The module's path under `src/`.
   */
  const visit = Effect.fnUntraced(function* visit(
    id: string,
  ): Effect.fn.Return<void, RuntimeFailure> {
    if (reached.has(id)) {
      return;
    }

    reached.add(id);

    const source = yield* Effect.flatMap(read(id), (text) => stripped(id, text));
    const loads = yield* Effect.forEach(declarationsIn(source), (found) => {
      const target = moduleOf(found.specifier);

      return target === undefined
        ? Effect.fail(new RuntimeImportRefused({ module: id, specifier: found.specifier }))
        : Effect.succeed({ found, target });
    });
    let served = source;

    for (const { found, target } of loads.toReversed()) {
      served = `${served.slice(0, found.start)}${runtimeUrl(target)}${served.slice(found.end)}`;
    }

    modules.push({ id, source: served, url: runtimeUrl(id) });

    for (const { target } of loads) {
      yield* visit(target);
    }
  });

  yield* visit(entry);

  return modules;
});

/**
 * Read a module of the package's `src/` from disk, as the text it holds, through the `#plate/`
 * alias `package.json` maps, so the playground reads the same file Node loads for that specifier
 * (issue m3d-13).
 *
 * @param id The module's path under `src/`.
 * @returns Its TypeScript, or {@link RuntimeModuleUnreadable} when the file cannot be read.
 */
export const readRuntimeModule: ReadModule = (id) =>
  Effect.tryPromise({
    catch: (cause) =>
      new RuntimeModuleUnreadable({
        detail: cause instanceof Error ? cause.message : String(cause),
        module: id,
      }),
    try: () => readFile(new URL(import.meta.resolve(`${plateAlias}${id}`)), "utf-8"),
  });

/**
 * The playground's runtime, built from the files on disk when it is run (issue m3d-13): the
 * modules of the graph from {@link bootModule}, by the URL path each is served at. It writes
 * nothing; a caller keeps the map for as long as the files may be taken as unchanged.
 */
export const runtimeBundle: RuntimeBundle = runtimeModules(bootModule, readRuntimeModule).pipe(
  Effect.map((modules) => new Map(modules.map(({ source, url }) => [url, source]))),
);
