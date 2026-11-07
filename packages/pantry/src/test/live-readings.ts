/**
 * The spec readings as `docs/spec-readings.md` states them today, so a test that records a
 * disagreement against a reading can hold the record to the reading's own words: a reading
 * rewritten or withdrawn so that it no longer says what the record cites turns the record stale,
 * where a reading number alone would still resolve (reading 26 kept its number when its rule was
 * withdrawn).
 */
import path from "node:path";
import { Effect, FileSystem } from "effect";

/**
 * `docs/spec-readings.md`, at the repository's root.
 */
const readingsPath = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "docs",
  "spec-readings.md",
);

/**
 * Split the readings document into its readings: each numbered paragraph, from its `N. ` line to
 * the next reading or heading, with every run of whitespace written as one space, so a sentence
 * the document wraps across lines reads as written.
 *
 * @param text - The document.
 * @returns Each reading's text, by its number.
 */
export const readingsOf = (text: string): ReadonlyMap<number, string> => {
  const readings = new Map<number, string[]>();
  let current: string[] | undefined;
  for (const line of text.split("\n")) {
    const numbered = /^(?<number>\d+)\. /u.exec(line)?.groups?.["number"];
    if (numbered !== undefined) {
      current = [line];
      readings.set(Number(numbered), current);
    } else if (line.startsWith("#")) {
      current = undefined;
    } else {
      current?.push(line);
    }
  }

  return new Map(
    [...readings].map(([number, lines]) => [number, lines.join(" ").replaceAll(/\s+/gu, " ")]),
  );
};

/**
 * Read the readings as the document states them now.
 *
 * @returns Each reading's text, by its number.
 */
export const liveReadings = Effect.fn("test.liveReadings")(function* liveReadings() {
  const fs = yield* FileSystem.FileSystem;

  return readingsOf(yield* fs.readFileString(readingsPath));
});

/**
 * Whether a reading still says a sentence: the reading exists and its text holds the sentence,
 * whitespace read as {@link readingsOf} reads it.
 *
 * @param readings - The readings, from {@link liveReadings}.
 * @param reading - The reading's number.
 * @param says - The sentence.
 * @returns Whether it does.
 */
export const stillSays = (
  readings: ReadonlyMap<number, string>,
  reading: number,
  says: string,
): boolean => (readings.get(reading) ?? "").includes(says.replaceAll(/\s+/gu, " "));
