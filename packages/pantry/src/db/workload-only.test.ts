/**
 * The programs pantry runs on a database, held to its author login's workload: every call on a `Db`
 * outside its `workload` handles is listed here, and the list only shrinks. grizzle's served layer
 * keeps only `workload` on a `Db`, deleting its ad-hoc `apply`, `compile`, `execute`, `explain`,
 * `get`, `page` and `refresh` (the served-workload plan, ~/.cache/gr8des/integration), so a call
 * that is no member of the workload has nothing to run on once the layer serves the committed one.
 */
import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The `src` folder.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * A `Db`'s operations outside its workload, each one grizzle's served layer deletes.
 */
const adHocOperations = ["apply", "compile", "execute", "explain", "get", "page", "refresh"];

/**
 * The calls on a `Db` outside its workload today, each `module: name.operation`. The list only
 * shrinks: a module that starts one fails the test, and so does an entry whose call is gone, until
 * the entry goes too.
 *
 * - `import/package.ts` applies the package's ChangeSet, `changeSetOf`'s with the package's rows,
 *   which the served re-pin replaces with the `importWrite` member's `apply` of the same rows.
 */
const pendingCalls: readonly string[] = ["import/package.ts: db.apply"];

/**
 * Blank out a module's comments, keeping its strings whole, so a call a comment names counts for
 * nothing.
 *
 * @param source - The text of a TypeScript module.
 * @returns The text with every comment removed.
 */
const withoutComments = (source: string): string =>
  source.replaceAll(
    /(?<literal>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|\/\*[\s\S]*?\*\/|\/\/[^\n]*/gu,
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
  it("are members of the author login's workload but where the list says otherwise", () => {
    // Oracle: the source of every production module, read for the names `Db.open` binds and the
    // operations called on them. Bound: every module outside the tests and the test support.
    const found = productionModules().flatMap((file) =>
      adHocCalls(readFileSync(path.join(sourceRoot, file), "utf-8")).map(
        (call) => `${file}: ${call}`,
      ),
    );

    assert.deepStrictEqual(
      found,
      pendingCalls,
      "A production module calls a Db outside its workload, which grizzle's served layer deletes: declare the program as a member of the author login's workload (src/qti/logins.ts) and call it through db.workload. An entry whose call is gone is deleted.",
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
