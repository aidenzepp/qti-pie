/**
 * Static imports, read from TypeScript source, for the tests that hold the package's module graph
 * to a rule: the browser allowlist (`src/browser.test.ts`) and the core boundary.
 *
 * {@link readImports} tokenises a module far enough to step over comments, strings, template
 * literals and regular expression literals, then reads every top-level `import` declaration and
 * every `export … from`, whether written on one line or across several. A dynamic `import(…)` and
 * `import.meta` are not declarations. A declaration it cannot classify is reported as unreadable,
 * never skipped, so a form of import it does not know fails a scan instead of passing it.
 *
 * A declaration loads its module at run time unless it is type-only as a whole (`import type`,
 * `export type`): under `verbatimModuleSyntax`, `import { type A } from "x"` is kept as
 * `import {} from "x"`.
 *
 * Test support: nothing outside `src/test/` and test files imports it, except
 * `src/ledger/runtime-size.ts`, which measures the browser runtime over {@link valueClosure}, the
 * same value-import closure the browser boundary test checks.
 *
 * @module
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * One name a declaration imports or re-exports.
 */
export interface ImportedName {
  /**
   * The name before `as`; `default` for a default import, and `*` for a namespace import or an
   * `export *`.
   */
  readonly name: string;
  /**
   * Whether this name alone is type-only, as `A` is in `import { type A } from "x"`.
   */
  readonly typeOnly: boolean;
}

/**
 * One static `import` declaration, or one `export … from`.
 */
export interface StaticImport {
  /**
   * The line the declaration starts on, from 1.
   */
  readonly line: number;
  /**
   * The names it imports, in source order; empty for a bare `import "…"`.
   */
  readonly names: readonly ImportedName[];
  /**
   * The module specifier, without its quotes.
   */
  readonly specifier: string;
  /**
   * Whether the whole declaration is type-only (`import type`, `export type`).
   */
  readonly typeOnly: boolean;
}

/**
 * What {@link readImports} reads from one module.
 */
export interface ModuleImports {
  readonly imports: readonly StaticImport[];
  /**
   * The lines of the `import` and `export` declarations it could not classify.
   */
  readonly unreadable: readonly number[];
}

/**
 * One import a module may not make.
 */
export interface Violation {
  /**
   * The line its declaration starts on, from 1; 0 for a root that is not in the module map.
   */
  readonly line: number;
  /**
   * The module that makes it, by path under the package.
   */
  readonly module: string;
  /**
   * The name it imports, or one of {@link sideEffectsOnly}, {@link unreadable} and
   * {@link missingModule}.
   */
  readonly name: string;
  readonly specifier: string;
}

/**
 * The names a browser module may value-import from `effect` (the OD-6 ruling, rule `e2bd87f2`).
 */
export const allowedEffectNames: ReadonlySet<string> = new Set([
  "Array",
  "Data",
  "Option",
  "Result",
  "pipe",
]);

/**
 * The name a violation gives a declaration that loads a module without importing a value from it,
 * such as a bare `import "node:fs"`.
 */
export const sideEffectsOnly = "(side effects)";

/**
 * The name a violation gives a declaration the reader could not classify; its specifier is empty.
 */
export const unreadable = "(unreadable)";

/**
 * The name a violation gives an import of a `#plate/` module that is not in the module map, or a
 * root that is not in it.
 */
export const missingModule = "(missing module)";

/**
 * The prefix of the package's own import alias, which resolves to `src/`.
 */
const plateAlias = "#plate/";

/**
 * What a {@link Token} holds: a name, a string literal, one punctuator character, or a value.
 */
type TokenKind = "name" | "punctuator" | "string" | "value";

/**
 * A token of the source: a name, a string literal, one punctuator character, or a value
 * (a number, template text or a regular expression literal).
 */
interface Token {
  /**
   * How many brackets and template substitutions are open where the token starts.
   */
  readonly depth: number;
  readonly kind: TokenKind;
  readonly start: number;
  readonly text: string;
}

/**
 * The tokens a {@link Token} kind is read from, tried in order. Whitespace and comments are
 * skipped. Every pattern is sticky, so it matches only at the index it is given.
 */
const tokenPatterns: readonly (readonly [RegExp, TokenKind | "skip"])[] = [
  [/\s+/uy, "skip"],
  [/\/\/[^\n]*/uy, "skip"],
  [/\/\*[\s\S]*?(?:\*\/|$)/uy, "skip"],
  [/"(?:[^"\\\n]|\\[\s\S])*"?|'(?:[^'\\\n]|\\[\s\S])*'?/uy, "string"],
  [/[\p{ID_Start}$_][\p{ID_Continue}$‌‍]*/uy, "name"],
  [/\.?\d[\w.]*/uy, "value"],
];

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
 * Split a module's source into tokens, stepping over comments and through template literals,
 * whose substitutions are tokenised one level deeper.
 *
 * @param source The module's source.
 * @returns Its tokens, in source order.
 */
const tokenize = (source: string): readonly Token[] => {
  const tokens: Token[] = [];
  // The open brackets, and the template substitutions, innermost last.
  const groups: ("bracket" | "substitution")[] = [];

  /**
   * Record a token with the number of brackets and substitutions open where it starts.
   *
   * @param kind The token's kind.
   * @param start Where its text starts.
   * @param end Where its text ends.
   * @returns `end`, the index to read on from.
   */
  const push = (kind: TokenKind, start: number, end: number): number => {
    tokens.push({ depth: groups.length, kind, start, text: source.slice(start, end) });

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
      groups.push("substitution");

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

    if (character === "}" && groups.at(-1) === "substitution") {
      groups.pop();

      return template(index + 1);
    }

    if (")]}".includes(character)) {
      groups.pop();
    }

    push("punctuator", index, index + 1);

    if ("([{".includes(character)) {
      groups.push("bracket");
    }

    return index + 1;
  };

  /**
   * Read the token at an index: template text, a token a pattern matches, a regular expression
   * literal where one may start, or else a punctuator.
   *
   * @param index Where the token starts.
   * @returns The index to read on from.
   */
  const step = (index: number): number => {
    if (source.charAt(index) === "`") {
      return template(index + 1);
    }

    for (const [pattern, kind] of tokenPatterns) {
      const match = matchAt(pattern, source, index);

      if (match !== undefined) {
        const end = index + match[0].length;

        return kind === "skip" ? end : push(kind, index, end);
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
const isName = (token: Token | undefined, text?: string): boolean =>
  token?.kind === "name" && (text === undefined || token.text === text);

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
 * Decide whether a token can name an import: a name, or a string (`import { "a-b" as c }`).
 *
 * @param token The token, if any.
 * @returns Whether it can.
 */
const isNameOrString = (token: Token | undefined): boolean =>
  token?.kind === "name" || token?.kind === "string";

/**
 * Give the text a name or string token names: a string without its quotes.
 *
 * @param token A name or string token.
 * @returns The name.
 */
const nameIn = (token: Token): string =>
  token.kind === "string" ? token.text.slice(1, -1) : token.text;

/**
 * Read one specifier of a braced list: `A`, `A as B`, `type A` or `type A as B`.
 *
 * @param group The specifier's tokens, between its commas.
 * @returns The name it imports, or undefined when the tokens form no specifier.
 */
const readSpecifier = (group: readonly Token[]): ImportedName | undefined => {
  const [first, second, third] = group;

  if (!group.every(isNameOrString) || first === undefined) {
    return undefined;
  }

  if (group.length === 1 || (group.length === 3 && isName(second, "as"))) {
    return { name: nameIn(first), typeOnly: false };
  }

  const typed = isName(first, "type") && second !== undefined;

  return typed && (group.length === 2 || (group.length === 4 && isName(third, "as")))
    ? { name: nameIn(second), typeOnly: true }
    : undefined;
};

/**
 * Read a braced specifier list whose `{` is at `open`.
 *
 * @param tokens The module's tokens.
 * @param open The index of the `{`.
 * @returns The names and the index after the `}`, or undefined when the list does not read.
 */
const readNamedList = (
  tokens: readonly Token[],
  open: number,
): { readonly names: readonly ImportedName[]; readonly next: number } | undefined => {
  const close = tokens.findIndex((token, index) => index > open && isPunctuator(token, "}"));
  const groups: Token[][] = [[]];

  for (const token of tokens.slice(open + 1, Math.max(close, open + 1))) {
    if (isPunctuator(token, ",")) {
      groups.push([]);
    } else {
      groups.at(-1)?.push(token);
    }
  }

  const names = groups.filter((group) => group.length > 0).map(readSpecifier);

  return close === -1 || names.includes(undefined)
    ? undefined
    : { names: names.filter((name) => name !== undefined), next: close + 1 };
};

/**
 * Read `from "<specifier>"` at an index.
 *
 * @param tokens The module's tokens.
 * @param index Where `from` must be.
 * @returns The specifier, or undefined when `from` and a string are not there.
 */
const readFrom = (tokens: readonly Token[], index: number): string | undefined => {
  const specifier = tokens[index + 1];

  return isName(tokens[index], "from") && specifier?.kind === "string"
    ? nameIn(specifier)
    : undefined;
};

/**
 * Read an import clause: a default binding, then a namespace import or a braced list, each
 * optional but not both absent.
 *
 * @param tokens The module's tokens.
 * @param start The index of the clause's first token.
 * @returns The names and the index after the clause, or undefined when it does not read.
 */
const readClause = (
  tokens: readonly Token[],
  start: number,
): { readonly names: readonly ImportedName[]; readonly next: number } | undefined => {
  const named = isName(tokens[start]);
  const defaults: readonly ImportedName[] = named ? [{ name: "default", typeOnly: false }] : [];
  const index = named ? start + 1 : start;

  if (named && !isPunctuator(tokens[index], ",")) {
    return { names: defaults, next: index };
  }

  const rest = named ? index + 1 : index;

  if (isPunctuator(tokens[rest], "*")) {
    return isName(tokens[rest + 1], "as") && isName(tokens[rest + 2])
      ? { names: [...defaults, { name: "*", typeOnly: false }], next: rest + 3 }
      : undefined;
  }

  const list = isPunctuator(tokens[rest], "{") ? readNamedList(tokens, rest) : undefined;

  return list === undefined ? undefined : { names: [...defaults, ...list.names], next: list.next };
};

/**
 * What reading one `import` or `export` gives: a declaration, a declaration that does not read, or
 * nothing to read (a dynamic import, `import.meta`, a local export).
 */
type Reading =
  | { readonly kind: "import"; readonly value: Omit<StaticImport, "line"> }
  | { readonly kind: "none" }
  | { readonly kind: "unreadable" };

/**
 * The reading of an `import` or `export` with nothing to read: a dynamic import, `import.meta` or a
 * local export.
 */
const none: Reading = { kind: "none" };

/**
 * The reading of an `import` or `export` declaration the reader cannot classify.
 */
const notRead: Reading = { kind: "unreadable" };

/**
 * Decide whether the `type` at an index is `import type`'s modifier rather than a default binding
 * named `type` (`import type from "x"`, `import type, { a } from "x"`).
 *
 * @param tokens The module's tokens.
 * @param index The index of the token after `import`.
 * @returns Whether it is the modifier.
 */
const isImportTypeModifier = (tokens: readonly Token[], index: number): boolean => {
  const next = tokens[index + 1];
  const bindsType = isName(next, "from") && tokens[index + 2]?.kind === "string";

  return (
    isName(tokens[index], "type") &&
    (isPunctuator(next, "{") || isPunctuator(next, "*") || (isName(next) && !bindsType))
  );
};

/**
 * Read the `import` at an index.
 *
 * @param tokens The module's tokens.
 * @param at The index of `import`.
 * @returns The reading.
 */
const readImport = (tokens: readonly Token[], at: number): Reading => {
  const first = tokens[at + 1];

  if (isPunctuator(first, "(") || isPunctuator(first, ".")) {
    return none;
  }

  if (first?.kind === "string") {
    return { kind: "import", value: { names: [], specifier: nameIn(first), typeOnly: false } };
  }

  const typeOnly = isImportTypeModifier(tokens, at + 1);
  const clause = readClause(tokens, typeOnly ? at + 2 : at + 1);
  const specifier = clause === undefined ? undefined : readFrom(tokens, clause.next);

  return clause === undefined || specifier === undefined
    ? notRead
    : { kind: "import", value: { names: clause.names, specifier, typeOnly } };
};

/**
 * Read the `export` at an index: `export * from`, `export * as n from` and `export { … } from`,
 * each also as `export type`. Any other `export` reads as nothing, except `export import`, which
 * does not read.
 *
 * @param tokens The module's tokens.
 * @param at The index of `export`.
 * @returns The reading.
 */
const readExport = (tokens: readonly Token[], at: number): Reading => {
  const after = tokens[at + 2];
  const typeOnly =
    isName(tokens[at + 1], "type") && (isPunctuator(after, "{") || isPunctuator(after, "*"));
  const head = typeOnly ? at + 2 : at + 1;

  if (isPunctuator(tokens[head], "*")) {
    const renamed = isName(tokens[head + 1], "as");
    const specifier =
      renamed && !isNameOrString(tokens[head + 2])
        ? undefined
        : readFrom(tokens, renamed ? head + 3 : head + 1);

    return specifier === undefined
      ? notRead
      : { kind: "import", value: { names: [{ name: "*", typeOnly: false }], specifier, typeOnly } };
  }

  if (isPunctuator(tokens[head], "{")) {
    const list = readNamedList(tokens, head);

    if (list === undefined || !isName(tokens[list.next], "from")) {
      return list === undefined ? notRead : none;
    }

    const specifier = readFrom(tokens, list.next);

    return specifier === undefined
      ? notRead
      : { kind: "import", value: { names: list.names, specifier, typeOnly } };
  }

  return isName(tokens[head], "import") ? notRead : none;
};

/**
 * Find the line an index of the source falls on, from 1.
 *
 * @param source The source.
 * @param index The index.
 * @returns The line.
 */
const lineOf = (source: string, index: number): number => source.slice(0, index).split("\n").length;

/**
 * Read a module's static imports: every top-level `import` declaration, bare ones included, and
 * every `export … from`, `export *` included, each whether written on one line or several.
 *
 * @param source The module's TypeScript source.
 * @returns The declarations in source order, and the lines of those it could not classify.
 */
export const readImports = (source: string): ModuleImports => {
  const tokens = tokenize(source);
  const readings = tokens.flatMap((token, index) => {
    const declares =
      token.depth === 0 &&
      (isName(token, "import") || isName(token, "export")) &&
      !isPunctuator(tokens[index - 1], ".");

    if (!declares) {
      return [];
    }

    const reading = token.text === "import" ? readImport(tokens, index) : readExport(tokens, index);

    return [{ line: lineOf(source, token.start), reading }];
  });

  return {
    imports: readings.flatMap(({ line, reading }) =>
      reading.kind === "import" ? [{ line, ...reading.value }] : [],
    ),
    unreadable: readings.flatMap(({ line, reading }) =>
      reading.kind === "unreadable" ? [line] : [],
    ),
  };
};

/**
 * List the names a declaration imports as values: none when it is type-only as a whole.
 *
 * @param declaration The declaration.
 * @returns The names that are not type-only.
 */
export const valueNames = (declaration: StaticImport): readonly string[] =>
  declaration.typeOnly
    ? []
    : declaration.names.filter((name) => !name.typeOnly).map((name) => name.name);

/**
 * Resolve a `#plate/` specifier to the module it names, by path under the package.
 *
 * @param specifier The specifier.
 * @returns `src/<x>` for `#plate/<x>`, or undefined for any other specifier.
 */
export const resolvePlate = (specifier: string): string | undefined =>
  specifier.startsWith(plateAlias) ? `src/${specifier.slice(plateAlias.length)}` : undefined;

/**
 * Collect every module the roots reach through declarations that load a module: an `import` or
 * `export … from` that is not type-only as a whole, of a `#plate/` specifier. A module reached only
 * through `import type` or `export type` is not reached.
 *
 * @param modules The modules' sources, by path under the package (`src/<x>`).
 * @param roots The paths to start from.
 * @returns The paths reached, the roots included, in the order the walk first reached them. A
 *   path not in `modules` is reached but not read.
 */
export const valueClosure = (
  modules: ReadonlyMap<string, string>,
  roots: readonly string[],
): readonly string[] => {
  const reached = new Set<string>();

  /**
   * Reach a module once, then every module its value declarations load.
   *
   * @param module The module's path under the package.
   */
  const visit = (module: string): void => {
    const source = modules.get(module);

    if (reached.has(module)) {
      return;
    }

    reached.add(module);

    for (const declaration of source === undefined ? [] : readImports(source).imports) {
      const target = resolvePlate(declaration.specifier);

      if (target !== undefined && !declaration.typeOnly) {
        visit(target);
      }
    }
  };

  for (const root of roots) {
    visit(root);
  }

  return [...reached];
};

/**
 * List the names of one declaration that break the allowlist.
 *
 * @param declaration The declaration.
 * @param modules The module map, to find a `#plate/` target.
 * @returns The offending names, empty when the declaration keeps to the allowlist.
 */
const offendingNames = (
  declaration: StaticImport,
  modules: ReadonlyMap<string, string>,
): readonly string[] => {
  const target = resolvePlate(declaration.specifier);
  const names = valueNames(declaration);

  if (declaration.typeOnly) {
    return [];
  }

  if (target !== undefined) {
    return modules.has(target) ? [] : [missingModule];
  }

  if (names.length === 0) {
    return [sideEffectsOnly];
  }

  return declaration.specifier === "effect"
    ? names.filter((name) => !allowedEffectNames.has(name))
    : names;
};

/**
 * Check the browser allowlist over the value-import closure of the roots. A module breaks it by
 * loading `effect` for a value outside {@link allowedEffectNames} (a namespace import, a default
 * import and `export *` included), by loading `effect` or any other specifier only for its side
 * effects, by any value import of an `effect/…` subpath, another package or a `node:` specifier, by
 * importing a `#plate/` module that is not in the map, or by a declaration that does not read.
 *
 * @param modules The modules' sources, by path under the package (`src/<x>`).
 * @param roots The paths to start from.
 * @returns Every violation, by module in walk order and then by line.
 */
export const checkAllowlist = (
  modules: ReadonlyMap<string, string>,
  roots: readonly string[],
): readonly Violation[] =>
  valueClosure(modules, roots).flatMap((module): readonly Violation[] => {
    const source = modules.get(module);

    if (source === undefined) {
      return roots.includes(module)
        ? [{ line: 0, module, name: missingModule, specifier: module }]
        : [];
    }

    const { imports, unreadable: lines } = readImports(source);
    const found = [
      ...imports.flatMap((declaration) =>
        offendingNames(declaration, modules).map((name) => ({
          line: declaration.line,
          module,
          name,
          specifier: declaration.specifier,
        })),
      ),
      ...lines.map((line) => ({ line, module, name: unreadable, specifier: "" })),
    ];

    return found.toSorted((left, right) => left.line - right.line);
  });

/**
 * Read the package's modules, tests included, from disk: its TypeScript sources and its JSON files,
 * which a source imports `with { type: "json" }`, as `model/blocks.ts` imports the block table.
 *
 * A JSON module reads as a module with no import declarations, so a walk reaches it and stops
 * there, and a `#plate/` import of one is not a missing module.
 *
 * @returns Each `.ts` and `.json` file under `src/`, by path under the package (`src/<x>`), in path
 *   order.
 */
export const sourceModules = (): ReadonlyMap<string, string> => {
  const root = new URL("../", import.meta.url);

  return new Map(
    readdirSync(root, { encoding: "utf-8", recursive: true })
      .filter((file) => file.endsWith(".ts") || file.endsWith(".json"))
      .toSorted()
      .map((file) => [
        `src/${file.split(path.sep).join("/")}`,
        readFileSync(new URL(file, root), "utf-8"),
      ]),
  );
};
