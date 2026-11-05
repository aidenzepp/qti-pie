import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { translate } from "#plate/model/regex.ts";
import type { RegexRefused } from "#plate/model/regex.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";

/**
 * Translate a pattern the translator must accept, failing the test when it refuses it.
 *
 * @param pattern The XSD pattern.
 * @returns The JavaScript expression it translates to.
 */
const accepted = (pattern: string): RegExp => {
  const result = translate(pattern);

  assert.isTrue(Result.isSuccess(result), `${JSON.stringify(pattern)} was refused`);

  return Result.isSuccess(result) ? result.success : /(?!)/v;
};

/**
 * Translate a pattern the translator must refuse, failing the test when it accepts it.
 *
 * @param pattern The XSD pattern.
 * @returns The refusal.
 */
const refused = (pattern: string): RegexRefused | undefined => {
  const result = translate(pattern);

  assert.isTrue(Result.isFailure(result), `${JSON.stringify(pattern)} was accepted`);

  return Result.isFailure(result) ? result.failure : undefined;
};

/**
 * Assert that a pattern takes one text and refuses another.
 *
 * @param pattern The XSD pattern.
 * @param match A text it takes.
 * @param nonMatch A text it refuses.
 */
const holds = (pattern: string, match: string, nonMatch: string): void => {
  const expression = accepted(pattern);

  assert.isTrue(
    expression.test(match),
    `${JSON.stringify(pattern)} refuses ${JSON.stringify(match)}`,
  );
  assert.isFalse(
    expression.test(nonMatch),
    `${JSON.stringify(pattern)} takes ${JSON.stringify(nonMatch)}`,
  );
};

/**
 * Assert that a pattern is refused at a position.
 *
 * @param pattern The XSD pattern.
 * @param position The index, in UTF-16 code units, the refusal names.
 */
const refusedAt = (pattern: string, position: number): void => {
  const refusal = refused(pattern);

  assert.strictEqual(refusal?._tag, "RegexRefused");
  assert.strictEqual(refusal?.pattern, pattern);
  assert.strictEqual(refusal?.position, position);
};

describe("translate", () => {
  it("reads the corpus's three patterns", () => {
    holds("([0-9.]{0,6})", "12.5", "1234567");
    // `\\` is an escaped backslash and the `-` before `]` is a literal dash.
    holds(String.raw`([0-9.\\-]{0,10})`, "-3.5", "3.5e1");
    assert.isTrue(accepted(String.raw`([0-9.\\-]{0,10})`).test("\\"));
    holds(String.raw`[0-9\.]+`, "3.14", "");
  });

  it("anchors the whole pattern, and reads ^ and $ as ordinary characters", () => {
    holds("abc", "abc", "xabcx");
    holds("^a$", "^a$", "a");
  });

  it("writes the v flag", () => {
    assert.strictEqual(accepted("a").flags, "v");
  });

  it("reads . as any character but a line feed or a carriage return", () => {
    holds(".", "x", "\n");
    assert.isFalse(accepted(".").test("\r"));
  });

  it("reads \\s as XSD's four whitespace characters, and \\S as their complement", () => {
    holds(String.raw`\s`, "\t", " ");
    holds(String.raw`\S`, " ", "\t");
  });

  it("reads \\d as a decimal digit of any script, and \\w without punctuation, separators or others", () => {
    holds(String.raw`\d`, "٣", "a");
    holds(String.raw`\D`, "a", "٣");
    holds(String.raw`\w`, "a", ".");
    holds(String.raw`\W`, " ", "a");
  });

  it("reads \\i and \\c as XML 1.0 name characters, colon included", () => {
    holds(String.raw`\i\c*`, "a.b-c", "1a");
    holds(String.raw`\i\c*`, ":a:b", "a b");
    holds(String.raw`\I`, "1", "a");
    holds(String.raw`\C`, " ", ".");
  });

  it("maps category escapes to the General_Category", () => {
    holds(String.raw`\p{Lu}`, "A", "a");
    holds(String.raw`\P{Lu}`, "a", "A");
    holds(String.raw`\p{N}+`, "1٣", "x");
  });

  it("reads class subtraction, negation, ranges and escapes inside a class", () => {
    holds("[a-z-[aeiou]]", "b", "a");
    holds("[^a-z-[aeiou]]", "B", "b");
    holds("[^a-z]", "A", "a");
    holds("[-a]+", "-a", "b");
    holds(String.raw`[\d\s]+`, "1 2", "a");
    holds(String.raw`[\^\[\]]+`, "^[]", "a");
  });

  it("reads quantifiers, groups and branches", () => {
    holds("x{2,3}", "xx", "x");
    holds("x{2,3}", "xxx", "xxxx");
    holds("x{2}", "xx", "xxx");
    holds("x{2,}", "xxxx", "x");
    holds("(ab)+|c?", "abab", "aba");
    assert.isTrue(accepted("(ab)+|c?").test(""));
  });

  it("refuses what Appendix F's grammar does not define, naming the position", () => {
    refusedAt("[abc", 0);
    refusedAt("ab\\k<x>", 2);
    refusedAt("a*?", 2);
    refusedAt("(?:a)", 1);
    refusedAt("a\\1", 1);
    refusedAt("(ab", 0);
    refusedAt("ab)", 2);
    refusedAt("x{3,2}", 1);
    refusedAt("a{", 1);
    refusedAt("[a-c-e]", 4);
    refusedAt("[z-a]", 1);
    refusedAt("[]", 1);
    refusedAt(String.raw`\p{Lx}`, 0);
  });

  it("reads block escapes as the ranges of XML Schema's block table", () => {
    holds(String.raw`\p{IsBasicLatin}+`, "abc", "é");
    holds(String.raw`\P{IsBasicLatin}`, "é", "a");
    holds(String.raw`\p{IsLatin-1Supplement}`, "é", "e");
    // Specials is listed twice: U+FEFF alone, and U+FFF0 to U+FFFD; U+FF01 lies between them.
    holds(String.raw`\p{IsSpecials}`, "\uFEFF", "\uFF01");
    holds(String.raw`\p{IsSpecials}`, "\uFFFD", "\uFEFE");
    holds(String.raw`\P{IsSpecials}`, "\uFF01", "\uFFF0");
  });

  it("reads block escapes inside a class, negated or subtracted", () => {
    holds(String.raw`[\p{IsBasicLatin}-[a-z]]`, "A", "a");
    holds(String.raw`[^\p{IsBasicLatin}]`, "é", "a");
    holds(String.raw`[\P{IsBasicLatin}\d]+`, "é1", "a");
    holds(String.raw`[a-zé-[\p{IsBasicLatin}]]`, "é", "a");
  });

  it("refuses a block name the table does not list, at its escape", () => {
    refusedAt(String.raw`ab\p{IsNoSuchBlock}`, 2);
    refusedAt(String.raw`[a\P{IsBasicLatin1}]`, 2);
    refusedAt(String.raw`\p{isBasicLatin}`, 0);
  });

  it("reads groups and classes nested 100 deep, and refuses the 101st level at its opening", () => {
    holds(`${"(".repeat(100)}a${")".repeat(100)}`, "a", "aa");
    refusedAt(`${"(".repeat(101)}a${")".repeat(101)}`, 100);
    holds(`[b${"-[a".repeat(99)}${"]".repeat(100)}`, "b", "a");
    refusedAt(`[b${"-[a".repeat(100)}${"]".repeat(101)}`, 300);
    // Groups and classes share the one count.
    refusedAt(`${"(".repeat(99)}[b-[a]]${")".repeat(99)}`, 102);
  });

  it("refuses a pattern nested thousands deep instead of overflowing the stack", () => {
    refusedAt(`${"(".repeat(100_000)}a${")".repeat(100_000)}`, 100);
    refusedAt(`[b${"-[a".repeat(100_000)}${"]".repeat(100_001)}`, 300);
  });

  it("passes the browser allowlist as a root", () => {
    const table = readFileSync(
      new URL(import.meta.resolve("#plate/model/blocks.generated.json")),
      "utf-8",
    );
    // `sourceModules` reads only `.ts` files; the block table is JSON and imports nothing.
    const modules = new Map([...sourceModules(), ["src/model/blocks.generated.json", table]]);

    assert.deepStrictEqual(checkAllowlist(modules, ["src/model/regex.ts"]), []);
  });
});
