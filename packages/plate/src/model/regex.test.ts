import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { compile, matches, maximumStates, translate } from "#plate/model/regex.ts";
import type { Matcher, RegexRefused } from "#plate/model/regex.ts";
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
 * Compile a pattern the matcher must accept, failing the test when it refuses it.
 *
 * @param pattern The XSD pattern.
 * @returns Its matcher.
 */
const compiled = (pattern: string): Matcher => {
  const result = compile(pattern);

  assert.isTrue(Result.isSuccess(result), `${JSON.stringify(pattern)} was refused`);

  return Result.getOrThrow(result);
};

/**
 * Read a pattern that both the translator and the matcher must refuse, failing the test when
 * either accepts it or they refuse it differently.
 *
 * @param pattern The XSD pattern.
 * @returns The translator's refusal.
 */
const refused = (pattern: string): RegexRefused | undefined => {
  const result = translate(pattern);
  const matcher = compile(pattern);

  assert.isTrue(Result.isFailure(result), `${JSON.stringify(pattern)} was accepted`);
  assert.isTrue(Result.isFailure(matcher), `${JSON.stringify(pattern)} was compiled`);
  assert.deepStrictEqual(
    Result.isFailure(matcher) ? matcher.failure.position : undefined,
    Result.isFailure(result) ? result.failure.position : undefined,
  );

  return Result.isFailure(result) ? result.failure : undefined;
};

/**
 * Assert that a pattern takes one text and refuses another, through the translator's expression
 * and through the matcher alike.
 *
 * @param pattern The XSD pattern.
 * @param match A text it takes.
 * @param nonMatch A text it refuses.
 */
const holds = (pattern: string, match: string, nonMatch: string): void => {
  const expression = accepted(pattern);
  const matcher = compiled(pattern);

  for (const [text, expected] of [
    [match, true],
    [nonMatch, false],
  ] as const) {
    assert.strictEqual(
      expression.test(text),
      expected,
      `${JSON.stringify(pattern)} against ${JSON.stringify(text)}`,
    );
    assert.strictEqual(
      matches(matcher, text),
      expected,
      `the matcher of ${JSON.stringify(pattern)} against ${JSON.stringify(text)}`,
    );
  }
};

/**
 * Assert that a pattern is refused at a position.
 *
 * @param pattern The XSD pattern.
 * @param position The index, in UTF-16 code units, the refusal names.
 * @returns The refusal.
 */
const refusedAt = (pattern: string, position: number): RegexRefused | undefined => {
  const refusal = refused(pattern);

  assert.strictEqual(refusal?._tag, "RegexRefused");
  assert.strictEqual(refusal?.pattern, pattern);
  assert.strictEqual(refusal?.position, position);

  return refusal;
};

/**
 * Every pattern this file reads, and automata with loops, empty groups and branches, nested
 * quantifiers and characters outside the Basic Multilingual Plane.
 */
const patterns: readonly string[] = [
  "([0-9.]{0,6})",
  String.raw`([0-9.\\-]{0,10})`,
  String.raw`[0-9\.]+`,
  "abc",
  "^a$",
  "a",
  ".",
  String.raw`\s`,
  String.raw`\S`,
  String.raw`\d`,
  String.raw`\D`,
  String.raw`\w`,
  String.raw`\W`,
  String.raw`\i\c*`,
  String.raw`\I`,
  String.raw`\C`,
  String.raw`\p{Lu}`,
  String.raw`\P{Lu}`,
  String.raw`\p{N}+`,
  "[a-z-[aeiou]]",
  "[^a-z-[aeiou]]",
  "[^a-z]",
  "[-a]+",
  String.raw`[\d\s]+`,
  String.raw`[\^\[\]]+`,
  "x{2,3}",
  "x{2}",
  "x{2,}",
  "(ab)+|c?",
  String.raw`\p{IsBasicLatin}+`,
  String.raw`\P{IsBasicLatin}`,
  String.raw`\p{IsLatin-1Supplement}`,
  String.raw`\p{IsSpecials}`,
  String.raw`\P{IsSpecials}`,
  String.raw`[\p{IsBasicLatin}-[a-z]]`,
  String.raw`[^\p{IsBasicLatin}]`,
  String.raw`[\P{IsBasicLatin}\d]+`,
  String.raw`[a-zé-[\p{IsBasicLatin}]]`,
  `${"(".repeat(100)}a${")".repeat(100)}`,
  `[b${"-[a".repeat(99)}${"]".repeat(100)}`,
  "(a+)+b",
  "(a|a)*b",
  "(a|ab)*c",
  "(a*)*",
  "()",
  "(|a)+",
  "a|",
  "|",
  "a{0}",
  "x{0,3}y",
  "x{3,}",
  "(ab|a)(bc|c)",
  "(a|b)*abb",
  "(x{0,2}){2,3}",
  "😀+",
  ".😀.",
];

/**
 * Texts to match every pattern against: empty, short runs, the texts this file's cases use, line
 * breaks, digits of other scripts, characters outside the Basic Multilingual Plane and a lone
 * surrogate.
 */
const samples: readonly string[] = [
  "",
  "a",
  "aa",
  "aaa",
  "ab",
  "abab",
  "aba",
  "abb",
  "aabb",
  "babb",
  "abbc",
  "abc",
  "abcbc",
  "ac",
  "aac",
  "b",
  "c",
  "xabcx",
  "^a$",
  "x",
  "xx",
  "xxx",
  "xxxx",
  "xxxxx",
  "xxxxxxx",
  "y",
  "xy",
  "xxxy",
  "xxxxy",
  "12.5",
  "1234567",
  "-3.5",
  "3.5e1",
  "\\",
  "3.14",
  "\n",
  "\r",
  "\t",
  " ",
  "1 2",
  "٣",
  "1٣",
  "A",
  "B",
  "AB",
  "é",
  "e",
  "é1",
  "a.b-c",
  ":a:b",
  "1a",
  "a b",
  ".",
  "-a",
  "^[]",
  "\uFEFF",
  "\uFEFE",
  "\uFF01",
  "\uFFF0",
  "\uFFFD",
  "😀",
  "😀😀",
  "a😀b",
  "\uD83D",
];

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

describe("compile and matches", () => {
  it("agree with the translator's expression on every pattern and sample", () => {
    for (const pattern of patterns) {
      const expression = accepted(pattern);
      const matcher = compiled(pattern);

      for (const sample of samples) {
        assert.strictEqual(
          matches(matcher, sample),
          expression.test(sample),
          `${JSON.stringify(pattern)} against ${JSON.stringify(sample)}`,
        );
      }
    }
  });

  it("answers (a+)+b, (a|a)*b and (a|ab)*c against 100,000 characters without backtracking", () => {
    const as = "a".repeat(100_000);

    for (const pattern of ["(a+)+b", "(a|a)*b", "(a|ab)*c"]) {
      assert.isFalse(matches(compiled(pattern), as), pattern);
    }

    assert.isTrue(matches(compiled("(a+)+b"), `${as}b`));
    assert.isTrue(matches(compiled("(a|a)*b"), `${as}b`));
    assert.isTrue(matches(compiled("(a|ab)*c"), `${"ab".repeat(50_000)}c`));
  });

  it("compiles a pattern of exactly maximumStates states, and refuses one state more at its count, naming the limit", () => {
    // `a{n}` takes n states and the accepting one.
    assert.strictEqual(compiled(`a{${maximumStates - 1}}`).states, maximumStates);

    const refusal = refusedAt(`a{${maximumStates}}`, 1);

    assert.include(refusal?.reason ?? "", String(maximumStates));
  });

  it("counts optional copies, loops, branches and groups as it builds them", () => {
    // 63 optional copies of two states each, sharing one class, and the accepting state.
    const digits = compiled("[0-9]{0,63}");

    assert.strictEqual(digits.states, 127);
    assert.strictEqual(digits.classes.length, 1);
    assert.isTrue(matches(digits, "1".repeat(63)));
    assert.isFalse(matches(digits, "1".repeat(64)));
    refusedAt("[0-9]{0,64}", 5);
    // Two copies, the last looping back through one choice.
    assert.strictEqual(compiled("x{2,}").states, 4);
    // Three characters and two choices among them.
    assert.strictEqual(compiled("(a|b|c)").states, 6);
    // 12 copies of 12 states pass the limit at the outer count.
    refusedAt("(a{12}){12}", 7);
    // Each count fits, and the second takes the running count past the limit.
    refusedAt("a{100}b{100}", 7);
    // 130 branches: the choice before the 65th takes the count past the limit, at its |.
    refusedAt(Array.from({ length: 130 }, () => "a").join("|"), 127);
    // A count too large for any number type is refused, not expanded.
    refusedAt("a{99999999999999999999999}", 1);
  });
});
