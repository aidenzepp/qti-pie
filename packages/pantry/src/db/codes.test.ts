import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { committedRosters, inCommittedOrder } from "#pantry/db/codes.ts";

describe("inCommittedOrder", () => {
  it("keeps the committed order and appends new handles in the grammar's order", () => {
    assert.deepStrictEqual(inCommittedOrder(["a", "b", "c"], ["a", "x", "c", "b", "y"]), [
      "a",
      "b",
      "c",
      "x",
      "y",
    ]);
  });

  it("leaves out a committed handle the grammar dropped", () => {
    assert.deepStrictEqual(inCommittedOrder(["a", "b", "c"], ["a", "c", "x"]), ["a", "c", "x"]);
    assert.deepStrictEqual(inCommittedOrder(["a", "b", "c"], ["c", "a"]), ["a", "c"]);
  });

  it("returns the grammar's order when nothing is committed", () => {
    assert.deepStrictEqual(inCommittedOrder([], ["b", "a", "c"]), ["b", "a", "c"]);
  });
});

describe("committedRosters", () => {
  it("holds the committed snapshot's rosters", () => {
    assert.isAbove(committedRosters.get("ContentModel")?.length ?? 0, 0);
  });
});

describe("db/codes.ts, when it loads", () => {
  // Oracle: criterion 5, importing a program opens no file. The module's own text is read: a
  // top-level statement starts at column 0, so a top-level `await` sits on such a line, and a read
  // of a file needs a file-system module or a `readFile` call.
  const source = readFileSync(fileURLToPath(import.meta.resolve("#pantry/db/codes.ts")), "utf-8");
  const specifiers = [
    ...source.matchAll(/^[ \t]*import\b[^;]*?["'](?<specifier>[^"']+)["']/gmu),
  ].map(({ groups }) => groups?.["specifier"] ?? "");

  it("awaits nothing at top level and reads no file", () => {
    assert.deepStrictEqual(
      source.split("\n").filter((line) => /^\S.*\bawait\b/u.test(line)),
      [],
    );
    assert.notMatch(source, /\breadFile|\bFileSystem\b/u);
    assert.deepStrictEqual(
      specifiers.filter((specifier) => /^(?:@effect\/platform-node|node:fs)/u.test(specifier)),
      [],
    );
  });

  it("takes the roster orders from the generated module", () => {
    assert.include(specifiers, "#pantry/db/rosters.json");
  });
});
