/**
 * The honesty check: what the ledger stands on, checked before any test runs.
 *
 * {@link honesty} is pure over in-memory inputs, the claims, the features file, the conformance
 * text and the test sources as text, and fails on exactly three things: a `limited` claim no test
 * that is not skipped tags (`unbacked-claim`), a tag naming an ID the features file lacks
 * (`unknown-tag`), and a features file that disagrees with the conformance text's Appendix A
 * (`features-drift`). It reads the tags with {@link scanTitles}, a static scan of the sources, so
 * it needs no test run; the one command repeats the claim check over real results.
 *
 * @module
 */
import type { Claim } from "#plate/ledger/claims.ts";
import { generateFeatures } from "#plate/ledger/features.ts";
import type { Feature } from "#plate/ledger/features.ts";
import { tagsOf } from "#plate/ledger/report.ts";

/**
 * A test title the static scan reads.
 */
export interface ScannedTitle {
  /**
   * The call's name as written, its members joined by dots, such as `it.effect.each`.
   */
  readonly call: string;

  /**
   * The 1-based line the title's literal opens on.
   */
  readonly line: number;

  /**
   * Whether the scan reads the test as skipped: its call, or a call around it, has a `skip` or
   * `todo` member.
   */
  readonly skipped: boolean;

  /**
   * The title as written between its quotes, with escapes and `${…}` left as text.
   */
  readonly title: string;
}

/**
 * The functions whose calls name tests and suites.
 */
const testFunctions = new Set(["describe", "it", "test"]);

/**
 * The call members that skip a test, and every test inside a skipped suite.
 */
const skipMembers = new Set(["skip", "todo"]);

/**
 * The punctuators after which a `/` opens a regular expression literal rather than dividing.
 */
const regexAfterPunctuator = new Set("([{}!%&*+,-:;<=>?^|~");

/**
 * The keywords after which a `/` opens a regular expression literal rather than dividing.
 */
const regexAfterKeyword = new Set([
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
 * Decide whether a character starts an identifier.
 *
 * @param character One character, or the empty string past the end of the text.
 * @returns Whether it is a letter, `_` or `$`.
 */
const startsWord = (character: string): boolean => /^[A-Za-z_$]$/u.test(character);

/**
 * Decide whether a character continues an identifier.
 *
 * @param character One character, or the empty string past the end of the text.
 * @returns Whether it is a letter, a digit, `_` or `$`.
 */
const continuesWord = (character: string): boolean => /^[\w$]$/u.test(character);

/**
 * Read the title of every test and suite in a test file's text, without running it.
 *
 * A title is the first argument of a call to `it`, `test` or `describe`, with any members
 * (`it.effect`, `test.effect`, `it.live`, `it.each`, `it.effect.each`), when that argument is a
 * string or template literal, on the call's line or a later one. A curried call such as
 * `it.each(table)("title", …)` gives the title of its second call. The scan walks the code as
 * JavaScript tokens, so a call written inside a comment, a string, a template literal or a regular
 * expression literal names no test; it tells a regular expression from a division by the token
 * before the `/`, as a parser does. A test is skipped when its call, or a call it sits inside, has
 * a `skip` or `todo` member.
 *
 * @param source A test file's text.
 * @returns Each title in the order its literal appears.
 */
export const scanTitles = (source: string): readonly ScannedTitle[] => {
  const titles: ScannedTitle[] = [];
  const newlines = Array.from(source.matchAll(/\n/gu), (match) => match.index);
  let at = 0;
  let previous = "";

  /**
   * Find the line a position of the text is on.
   *
   * @param index A position in the text.
   * @returns Its 1-based line.
   */
  const lineOf = (index: number): number => {
    const after = newlines.findIndex((newline) => newline >= index);

    return (after === -1 ? newlines.length : after) + 1;
  };

  /**
   * Step past whitespace and comments.
   */
  const skipTrivia = (): void => {
    while (at < source.length) {
      const pair = source.slice(at, at + 2);

      if (/^\s/u.test(pair)) {
        at += 1;
      } else if (pair === "//") {
        const end = source.indexOf("\n", at);

        at = end === -1 ? source.length : end;
      } else if (pair === "/*") {
        const end = source.indexOf("*/", at + 2);

        at = end === -1 ? source.length : end + 2;
      } else {
        return;
      }
    }
  };

  /**
   * Read an identifier or keyword.
   *
   * @returns The word.
   */
  const readWord = (): string => {
    const start = at;

    while (continuesWord(source.charAt(at))) {
      at += 1;
    }

    return source.slice(start, at);
  };

  /**
   * Read a single- or double-quoted string literal, which ends at its closing quote or, unclosed,
   * at the end of its line.
   *
   * @returns The text between the quotes, escapes left as written.
   */
  const readQuoted = (): string => {
    const quote = source.charAt(at);
    const start = at + 1;

    at = start;

    while (at < source.length && source.charAt(at) !== quote && source.charAt(at) !== "\n") {
      at += source.charAt(at) === "\\" ? 2 : 1;
    }

    const text = source.slice(start, at);

    at += 1;

    return text;
  };

  /**
   * Step past a regular expression literal and its flags. A `[…]` class may hold a `/`; a line end
   * before the closing `/` ends the literal there.
   */
  const skipRegex = (): void => {
    let inClass = false;

    at += 1;

    while (at < source.length && source.charAt(at) !== "\n") {
      const character = source.charAt(at);

      at += character === "\\" ? 2 : 1;

      if (character === "[") {
        inClass = true;
      } else if (character === "]") {
        inClass = false;
      } else if (character === "/" && !inClass) {
        readWord();

        return;
      }
    }
  };

  /**
   * Decide whether a `/` at the current position opens a regular expression literal: it does at
   * the start of the text, after a punctuator that cannot end an operand, and after a keyword that
   * takes an expression.
   *
   * @returns Whether the `/` opens a literal.
   */
  const opensRegex = (): boolean =>
    previous === "" || regexAfterPunctuator.has(previous) || regexAfterKeyword.has(previous);

  /**
   * Read the remaining tokens of the text, or, inside a call's parentheses or a template's
   * `${…}`, up to and including the bracket that closes it, recording every title on the way.
   *
   * @param skipped Whether the code sits inside a skipped call.
   * @param untilClose Whether to stop after the bracket that closes the code's opening one.
   */
  const walk = (skipped: boolean, untilClose: boolean): void => {
    let depth = 0;

    while (at < source.length) {
      const character = source.charAt(at);
      const pair = source.slice(at, at + 2);

      if (/^\s/u.test(character) || pair === "//" || pair === "/*") {
        skipTrivia();
      } else if (character === '"' || character === "'") {
        readQuoted();
        previous = "value";
      } else if (character === "`") {
        // oxlint-disable-next-line eslint/no-use-before-define -- `walk` and `readTemplate` recurse into each other as a template's `${…}` nests code.
        readTemplate(skipped);
        previous = "value";
      } else if (character === "/" && opensRegex()) {
        skipRegex();
        previous = "value";
      } else if (startsWord(character)) {
        const word = readWord();

        if (testFunctions.has(word) && previous !== ".") {
          // oxlint-disable-next-line eslint/no-use-before-define -- `walk` and `readCall` recurse into each other as a call's arguments nest calls.
          readCall(word, skipped);
        } else {
          previous = word;
        }
      } else {
        at += 1;
        previous = character;

        if ("([{".includes(character)) {
          depth += 1;
        } else if (")]}".includes(character)) {
          depth -= 1;

          if (untilClose && depth < 0) {
            return;
          }
        }
      }
    }
  };

  /**
   * Read a template literal, walking the code in each `${…}`.
   *
   * @param skipped Whether the literal sits inside a skipped call.
   * @returns The text between the backticks, escapes and `${…}` left as written.
   */
  const readTemplate = (skipped: boolean): string => {
    const start = at + 1;

    at = start;

    while (at < source.length && source.charAt(at) !== "`") {
      if (source.startsWith("${", at)) {
        at += 2;
        walk(skipped, true);
      } else {
        at += source.charAt(at) === "\\" ? 2 : 1;
      }
    }

    const text = source.slice(start, at);

    at += 1;

    return text;
  };

  /**
   * Read a call to a test function, from just after its name: its members, its title when its
   * first argument is a literal, and the rest of its arguments. A call whose first argument is not
   * a literal and that is called again, as `it.each(table)(…)`, has its title read from the next
   * call.
   *
   * @param name The test function's name.
   * @param skipped Whether the call sits inside a skipped call.
   */
  const readCall = (name: string, skipped: boolean): void => {
    const members = [name];

    while (source.charAt(at) === "." && startsWord(source.charAt(at + 1))) {
      at += 1;
      members.push(readWord());
    }

    const call = members.join(".");
    const own = skipped || members.some((member) => skipMembers.has(member));

    previous = members.at(-1) ?? name;
    skipTrivia();

    while (source.charAt(at) === "(") {
      at += 1;
      previous = "(";
      skipTrivia();

      const opener = source.charAt(at);

      if (opener === '"' || opener === "'" || opener === "`") {
        const line = lineOf(at);
        const title = opener === "`" ? readTemplate(own) : readQuoted();

        titles.push({ call, line, skipped: own, title });
        previous = "value";
        walk(own, true);

        return;
      }

      walk(own, true);
      skipTrivia();
    }
  };

  walk(false, false);

  return titles;
};

/**
 * One thing the honesty check finds wrong.
 *
 * `kind` names which of the three checks failed. `id` is the feature ID the problem concerns: the
 * claim's, the tag's, or the drifting row's. `detail` says, in words, where the problem is and
 * what to change.
 */
export interface HonestyProblem {
  readonly detail: string;
  readonly id: string;
  readonly kind: "features-drift" | "unbacked-claim" | "unknown-tag";
}

/**
 * What {@link honesty} checks.
 */
export interface HonestyInput {
  /**
   * The claims, `claims` from `#plate/ledger/claims.ts`.
   */
  readonly claims: readonly Claim[];

  /**
   * The conformance text, `conf.txt`, whose Appendix A the features file must agree with.
   */
  readonly conf: string;

  /**
   * The features file's rows, `features` from `#plate/ledger/features.ts`.
   */
  readonly features: readonly Feature[];

  /**
   * Each test file's text, keyed by its path relative to the package directory, such as
   * `src/styles.test.ts`.
   */
  readonly sources: ReadonlyMap<string, string>;
}

/**
 * A scanned title and the test file it is in.
 */
interface Located extends ScannedTitle {
  /**
   * The test file's path relative to the package directory.
   */
  readonly file: string;
}

/**
 * The fields of a features row the drift check compares, beside its ID.
 */
const comparedFields = ["elevated", "family", "level", "name"] as const;

/**
 * How to bring the features file back into line with the conformance text.
 */
const regenerate =
  "Regenerate it from the repository root: node packages/plate/scripts/features.ts && pnpm exec vp fmt packages/plate/src/ledger/features.generated.json.";

/**
 * Build a drift problem.
 *
 * @param id The drifting row's ID.
 * @param what What differs.
 * @returns The problem, its detail ending with how to regenerate the features file.
 */
const drift = (id: string, what: string): HonestyProblem => ({
  detail: `${what} ${regenerate}`,
  id,
  kind: "features-drift",
});

/**
 * Find the claims no test that the scan reads as running tags.
 *
 * @param claims The claims.
 * @param titles Every scanned title.
 * @returns An `unbacked-claim` problem for each such claim.
 */
const unbackedClaims = (
  claims: readonly Claim[],
  titles: readonly Located[],
): readonly HonestyProblem[] => {
  const backed = new Set(
    titles.filter((title) => !title.skipped).flatMap((title) => tagsOf(title.title)),
  );

  return claims
    .filter((claim) => !backed.has(claim.id))
    .map((claim) => ({
      detail: `The claim on ${claim.id} has no test tagged [${claim.id}] that is not skipped. Tag a running test that proves the row's bounded behaviour with [${claim.id}], or remove the claim from src/ledger/claims.ts.`,
      id: claim.id,
      kind: "unbacked-claim",
    }));
};

/**
 * Find the tags, skipped tests' included, that name no row of the features file.
 *
 * @param features The features file's rows.
 * @param titles Every scanned title.
 * @returns An `unknown-tag` problem for each such tag, in the order the titles are scanned.
 */
const unknownTags = (
  features: readonly Feature[],
  titles: readonly Located[],
): readonly HonestyProblem[] => {
  const ids = new Set(features.map((row) => row.id));

  return titles.flatMap((title) =>
    tagsOf(title.title)
      .filter((id) => !ids.has(id))
      .map((id) => ({
        detail: `${title.file}:${String(title.line)} tags [${id}] in the title "${title.title}", and the features file has no row ${id}. Change the tag to the Appendix A ID the test proves, or remove it.`,
        id,
        kind: "unknown-tag",
      })),
  );
};

/**
 * Compare the features file with the generator's reading of the conformance text, as a deep
 * equality would: the same rows, field for field, in the same order.
 *
 * @param committed The features file's rows.
 * @param generated The rows the generator reads from the conformance text.
 * @returns A `features-drift` problem for each row that differs, is on one side only, or, when
 *   every row matches, for the first place the two orders part.
 */
const featuresDrift = (
  committed: readonly Feature[],
  generated: readonly Feature[],
): readonly HonestyProblem[] => {
  const generatedById = new Map(generated.map((row) => [row.id, row]));
  const committedIds = new Set(committed.map((row) => row.id));

  const rowProblems = [
    ...committed.flatMap((row) => {
      const reading = generatedById.get(row.id);

      if (reading === undefined) {
        return [
          drift(
            row.id,
            `${row.id} is a row of the features file but not of conf.txt's Appendix A.`,
          ),
        ];
      }

      const differences = comparedFields
        .filter((field) => row[field] !== reading[field])
        .map(
          (field) =>
            `its ${field} is ${JSON.stringify(row[field])} in the features file and ${JSON.stringify(reading[field])} in conf.txt`,
        );

      return differences.length === 0
        ? []
        : [
            drift(
              row.id,
              `${row.id} disagrees with conf.txt's Appendix A: ${differences.join("; ")}.`,
            ),
          ];
    }),
    ...generated
      .filter((row) => !committedIds.has(row.id))
      .map((row) =>
        drift(row.id, `${row.id} is a row of conf.txt's Appendix A but not of the features file.`),
      ),
  ];

  if (rowProblems.length > 0) {
    return rowProblems;
  }

  const place = Array.from(
    { length: Math.max(committed.length, generated.length) },
    (_, index) => index,
  ).find((index) => committed[index]?.id !== generated[index]?.id);

  if (place === undefined) {
    return [];
  }

  const listed = committed[place]?.id;
  const read = generated[place]?.id;

  return [
    drift(
      listed ?? read ?? "",
      `The features file has ${listed ?? "no row"} at row ${String(place + 1)}, where conf.txt's Appendix A has ${read ?? "no row"}.`,
    ),
  ];
};

/**
 * Check what the ledger stands on.
 *
 * It fails on exactly three things. A claim, which makes its row `limited`, must be backed by at
 * least one test that tags its ID and that the scan does not read as skipped (`unbacked-claim`).
 * Every tag in a test title, skipped tests' included, must name a row of the features file
 * (`unknown-tag`). The features file must deep-equal what `generateFeatures` reads from the
 * conformance text, the check `features.test.ts` also makes (`features-drift`).
 *
 * @param input The claims, the features file, the conformance text and the test sources.
 * @returns Every problem found, the claims' first, then the tags' in file order, then the drift;
 *   empty when the ledger's inputs are honest.
 * @throws {ConformanceHeadingDefect} When the conformance text lacks a heading the generator
 *   reads, which means it is not the conformance text the features file was generated from.
 * @throws {Schema.SchemaError} When a row the generator reads does not decode as a features row.
 */
export const honesty = (input: HonestyInput): readonly HonestyProblem[] => {
  const titles = [...input.sources.keys()]
    .toSorted()
    .flatMap((file) =>
      scanTitles(input.sources.get(file) ?? "").map((title) => ({ ...title, file })),
    );

  return [
    ...unbackedClaims(input.claims, titles),
    ...unknownTags(input.features, titles),
    ...featuresDrift(input.features, generateFeatures(input.conf)),
  ];
};
