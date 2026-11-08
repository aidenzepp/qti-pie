/**
 * The test support's count of the grammar's compositions, and its guard: a test file composes
 * production's grammar at most once.
 *
 * Vitest loads this module before each test file (`setupFiles` in `vite.config.ts`) and isolates
 * each file in a process of its own, so it subscribes to {@link compositions} before the file's
 * first import can compose and counts that file's compositions alone. Every reader of production's
 * grammar shares `composed()`'s one composition, `install.ts` included, so a second composition of
 * production's list is work the file repeats, and the `afterAll` hook below fails the file. The
 * guard counts work, not time, so a loaded machine cannot pass or fail it.
 */
import type { ChannelListener } from "node:diagnostics_channel";
import { afterAll, assert } from "@effect/vitest";
import { compositions } from "#pantry/grammar/compositions.ts";

/**
 * A vocabulary list as the counter keys it: by identity, whatever its vocabularies.
 */
type List = readonly unknown[];

/**
 * How many times this process has composed each vocabulary list, by the list's identity, so a toy
 * list leaves the count with the list.
 */
const counts = new WeakMap<List, number>();

/**
 * How many compositions this process has announced, of any list: the guard reads production's list
 * only when there was one, so a file that composes nothing never loads the generators for it.
 */
let announced = 0;

/**
 * Read how many times this process has composed a vocabulary list.
 *
 * @param list - The list, by identity: a copy of it is another list.
 * @returns The compositions announced for it since this module loaded.
 */
export const compositionsOf = (list: List): number => counts.get(list) ?? 0;

/**
 * Count one composition {@link compositions} announces. A message that is no array is no list, and
 * counts for nothing.
 *
 * @param message - The vocabulary list `compose` was given.
 */
const onComposition: ChannelListener = (message) => {
  if (Array.isArray(message)) {
    announced += 1;
    counts.set(message, compositionsOf(message) + 1);
  }
};

compositions.subscribe(onComposition);

afterAll(async () => {
  compositions.unsubscribe(onComposition);
  if (announced === 0) {
    return;
  }

  const { vocabularies } = await import("#pantry/grammar/compose.ts");
  const times = compositionsOf(vocabularies);

  assert.isAtMost(
    times,
    1,
    `This test file composed production's grammar ${times} times, and a test file composes it once. Read it through \`composed()\` from \`#pantry/grammar/compose.ts\`, which composes it on its first call and returns that result after, rather than through \`compose(vocabularies)\`.`,
  );
});
