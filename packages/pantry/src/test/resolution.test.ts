/**
 * The law oracle's reading of a lexical form by its whitespace class (`oracleValueOf` of
 * `#pantry/test/resolution.ts`, XML Schema Part 2, §4.3.6), held at the sizes the oracle judges:
 *
 * - **Differential**: every form of at most five characters over an alphabet of the four XML
 *   whitespace characters, a no-break space, an ordinary letter, an astral character and a lone
 *   high and low surrogate, against a reference written as the specification states the classes, a
 *   walk over code points. The two agree on every form.
 * - **Size**: a value of {@link largeLength} characters, padded at both ends, which the ZIP reader's
 *   entry bound (`entryBytes` of `#pantry/package/zip.ts`, 64 MiB) admits, is read within Node's
 *   default heap in each class.
 *
 * It reads `oracleValueOf` alone and names no law oracle module, so it is not an oracle test
 * (`src/grammar/purity.test.ts`); the judgment of an item that holds a value this long is
 * `resolution-value.oracle.test.ts`'s.
 */
import { assert, describe, it } from "@effect/vitest";
import { oracleValueOf } from "#pantry/test/resolution.ts";
import type { OracleWhiteSpace } from "#pantry/test/resolution.ts";

/**
 * The length, in characters, of the large values: the ZIP reader admits an entry of 64 MiB, and a
 * value this long is one the oracle must judge.
 */
const largeLength = 64_000_000;

/**
 * The timeout, in milliseconds, of each test that reads a value of {@link largeLength} characters
 * through `oracleValueOf` alone: a hang guard.
 */
const readTimeoutMs = 2000;

/**
 * The three whitespace classes.
 */
const classes: readonly OracleWhiteSpace[] = ["collapse", "preserve", "replace"];

/**
 * Whether a code point is one of the XML whitespace characters (XML 1.0, production S).
 *
 * @param character - The code point, as a string.
 * @returns Whether it is a space, a tab, a line feed or a carriage return.
 */
const isXmlSpace = (character: string): boolean =>
  character === " " || character === "\t" || character === "\n" || character === "\r";

/**
 * Read a form as XML Schema Part 2, §4.3.6 states the classes, walking its code points: `replace`
 * writes each tab, line feed and carriage return as a space, `collapse` then joins the runs of
 * non-whitespace with one space each, and every class sets aside the whitespace at both ends,
 * which `preserve` otherwise keeps as written.
 *
 * @param lexical - The form.
 * @param whiteSpace - The class.
 * @returns The form's value.
 */
const referenceValueOf = (lexical: string, whiteSpace: OracleWhiteSpace): string => {
  const characters: string[] = [];
  for (const character of lexical) {
    characters.push(whiteSpace === "replace" && isXmlSpace(character) ? " " : character);
  }

  let first = 0;
  let last = characters.length;
  while (first < last && isXmlSpace(characters[first] ?? "")) {
    first += 1;
  }
  while (last > first && isXmlSpace(characters[last - 1] ?? "")) {
    last -= 1;
  }

  const inside = characters.slice(first, last);
  if (whiteSpace !== "collapse") {
    return inside.join("");
  }

  const words: string[] = [];
  let word = "";
  for (const character of inside) {
    if (isXmlSpace(character)) {
      if (word !== "") {
        words.push(word);
      }

      word = "";
    } else {
      word += character;
    }
  }
  if (word !== "") {
    words.push(word);
  }

  return words.join(" ");
};

/**
 * The characters the differential's forms are written over: a letter, the four XML whitespace
 * characters, a no-break space (not XML whitespace), an astral character and a lone high and a
 * lone low surrogate, which beside each other form a pair.
 */
const alphabet: readonly string[] = [
  "a",
  " ",
  "\t",
  "\n",
  "\r",
  "\u00A0",
  "😀",
  "\uD83D",
  "\uDE00",
];

/**
 * The longest form the differential tries, in characters of {@link alphabet}.
 */
const longestForm = 5;

/**
 * Write every form of at most {@link longestForm} characters of {@link alphabet}, shortest first.
 *
 * @returns Each form, the empty form first.
 */
const everyForm = (): readonly string[] => {
  let level: readonly string[] = [""];
  const forms: string[] = [""];
  for (let length = 1; length <= longestForm; length += 1) {
    level = level.flatMap((form) => alphabet.map((character) => `${form}${character}`));
    forms.push(...level);
  }

  return forms;
};

describe("oracleValueOf, the value of a lexical form by its whitespace class", () => {
  it("reads every form of at most five characters over the alphabet as the specification's walk does", () => {
    // Oracle: `referenceValueOf`, the definition of §4.3.6 as a walk over code points.
    const forms = everyForm();
    assert.lengthOf(forms, (alphabet.length ** (longestForm + 1) - 1) / (alphabet.length - 1));

    for (const whiteSpace of classes) {
      for (const form of forms) {
        assert.strictEqual(
          oracleValueOf(form, whiteSpace),
          referenceValueOf(form, whiteSpace),
          `${whiteSpace} ${JSON.stringify(form)}`,
        );
      }
    }
  });
});

describe("oracleValueOf over a value of 64,000,000 characters", () => {
  for (const whiteSpace of classes) {
    it(
      `reads a value padded at both ends under ${whiteSpace}, trimmed`,
      () => {
        const value = oracleValueOf(`\t${"x".repeat(largeLength - 2)}\n`, whiteSpace);

        assert.strictEqual(value.length, largeLength - 2);
        assert.isTrue(value.startsWith("xx") && value.endsWith("xx"));
      },
      readTimeoutMs,
    );
  }
});
