/**
 * The programs pantry runs on a database, held to its author login's workload: no production module
 * calls a `Db` outside its `workload` handles. A served `Db` runs the programs `grizzle generate`
 * compiled into the login's served file alone, and refuses every other operation before any SQL,
 * yet its type still declares `apply`, `compile`, `execute`, `explain`, `get`, `page` and
 * `refresh`, so a call of one typechecks and fails only when it runs. This search refuses it until
 * grizzle's type does.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/grizzle/src/adapter/db/served.ts#L133-L160
 */
import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The `src` folder.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * A `Db`'s operations outside its workload, each one a served `Db` refuses.
 */
const adHocOperations = ["apply", "compile", "execute", "explain", "get", "page", "refresh"];

/**
 * Blank out a module's comments, keeping its strings whole, so a call a comment names counts for
 * nothing. The pattern writes its quotation marks and backtick as `\u0022`, `\u0027` and
 * `\u0060`, so `src/test/timeouts.test.ts`, which reads a regular expression literal as code,
 * reads this file to its end.
 *
 * @param source - The text of a TypeScript module.
 * @returns The text with every comment removed.
 */
const withoutComments = (source: string): string =>
  source.replaceAll(
    /(?<literal>\u0022(?:\\.|[^\u0022\\\n])*\u0022|\u0027(?:\\.|[^\u0027\\\n])*\u0027|\u0060(?:\\.|[^\u0060\\])*\u0060)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu,
    (_text, literal: string | undefined) => literal ?? "",
  );

/**
 * Find a module's calls on a `Db` outside its workload: each name it binds to what `Db.open` opens
 * (`const db = yield* Db.open(…)`, through a wrapper such as `retried(…, Db.open(…))` too), and
 * each `name.operation(` of {@link adHocOperations} on such a name.
 *
 * @param source - The text of a TypeScript module.
 * @returns Each call as `name.operation`, once each, sorted.
 */
const adHocCalls = (source: string): readonly string[] => {
  const code = withoutComments(source);
  const opened = [
    ...code.matchAll(/\bconst\s+(?<name>[A-Za-z_$][\w$]*)\s*=\s*yield\*[^;]*?\bDb\.open\(/gu),
  ].flatMap(({ groups: { name } = {} }) => (name === undefined ? [] : [name]));
  const calls = opened.flatMap((name) =>
    adHocOperations.flatMap((operation) =>
      new RegExp(
        `(?<![\\w$.])${name.replaceAll("$", "\\$")}\\s*\\.\\s*${operation}\\s*\\(`,
        "u",
      ).test(code)
        ? [`${name}.${operation}`]
        : [],
    ),
  );

  return [...new Set(calls)].toSorted();
};

/**
 * List the production modules under `src`: every module but the tests and the test support under
 * `src/test/`.
 *
 * @returns Their paths relative to `src`, sorted.
 */
const productionModules = (): readonly string[] =>
  globSync("**/*.ts", { cwd: sourceRoot })
    .filter((file) => !file.endsWith(".test.ts") && !file.startsWith("test/"))
    .toSorted();

describe("pantry's programs on a database", () => {
  it("are members of the author login's workload, every one", () => {
    // Oracle: the source of every production module, read for the names `Db.open` binds and the
    // operations called on them. Bound: every module outside the tests and the test support.
    const found = productionModules().flatMap((file) =>
      adHocCalls(readFileSync(path.join(sourceRoot, file), "utf-8")).map(
        (call) => `${file}: ${call}`,
      ),
    );

    assert.deepStrictEqual(
      found,
      [],
      "A production module calls a Db outside its workload, which a served Db refuses when the call runs: declare the program as a member of the author login's workload (src/qti/logins.ts), run grizzle generate, and call it through db.workload.",
    );
  });

  it("finds a planted call of every operation on any name Db.open binds, and none through the workload or in a comment", () => {
    // Oracle: the rule as its comment states it, on planted sources. Live: a get and an apply on a
    // handle named other than `db`, opened through a wrapper. Stale: the same operations through
    // `workload`, on a name `Db.open` never bound, and inside a comment.
    const planted = [
      'const session = yield* retried("open", Db.open(Author, {}), schedule);',
      "yield* session.get(Package, { id });",
      "yield* session\n  .apply(changes, {});",
      "yield* session.workload.packageOf.get({ id });",
      "yield* other.get(Package, { id });",
      "// session.explain(scan, {}) reads a plan",
    ].join("\n");

    assert.deepStrictEqual(adHocCalls(planted), ["session.apply", "session.get"]);
    assert.deepStrictEqual(
      adHocCalls(
        "const db = yield* Db.open(Author, {});\nyield* db.workload.importWrite.apply(rows, {});",
      ),
      [],
    );
  });
});
