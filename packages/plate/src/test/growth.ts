import { threadCpuUsage } from "node:process";
import { Effect } from "effect";

/**
 * How many times as large the second input of a growth check is: a linear computation then takes
 * about 8 times as long on it, and a quadratic one about 64 times.
 */
export const growthFactor = 8;

/**
 * The most a computation's time may grow by on {@link growthFactor} times the input, 4 times linear
 * and half of quadratic, so a busy machine neither fails a linear computation nor passes a
 * quadratic one.
 */
export const growthLimit = 32;

/**
 * The runs of each size a growth check times, keeping the fastest, so a run a busy machine slowed
 * does not count.
 */
export const growthRuns = 3;

/**
 * Run a computation and measure the CPU time this thread spent on it, which a busy machine
 * inflates far less than wall-clock time: the time other processes hold the CPU is not counted.
 *
 * @param work The computation.
 * @returns The thread's CPU time over `work`, in milliseconds.
 */
export const cpuMillis = (work: () => void): Effect.Effect<number> =>
  Effect.sync(() => {
    const before = threadCpuUsage();
    work();

    const { system, user } = threadCpuUsage(before);

    return (system + user) / 1000;
  });

/**
 * The least CPU time, in milliseconds, a timed run of the smaller input must take for a growth
 * ratio to mean anything. A Linux VM accounts thread CPU time in coarse ticks, so a run of a few
 * milliseconds reads as 0 there and both sides of the ratio are 0 (probe of 2026-11-10); the
 * sample grows until the clock can see it. It changes no limit.
 */
export const growthFloorMs = 20;

/**
 * The most the repeat count of {@link growthSample} grows to, so a clock that reads 0 for any
 * sample still ends the search.
 */
export const growthSampleCap = 1024;

/**
 * Find the repeat count at which a growth check's sample is long enough to read: double it from 1
 * until a sample of that many repeats takes at least {@link growthFloorMs}, or it reaches
 * {@link growthSampleCap}.
 *
 * @param measure The CPU time, in milliseconds, of a sample of the given repeat count.
 * @returns The repeat count.
 */
export const growthSample = (
  measure: (repeats: number) => Effect.Effect<number>,
): Effect.Effect<number> =>
  Effect.gen(function* searchSample() {
    let repeats = 1;
    while (repeats < growthSampleCap) {
      const millis = yield* measure(repeats);
      if (millis >= growthFloorMs) {
        return repeats;
      }

      repeats *= 2;
    }

    return growthSampleCap;
  });

/**
 * Measure how a computation's CPU time grows with its input: time it on a smaller input and on one
 * {@link growthFactor} times as large, alternating so a busy spell slows both sizes, and keep the
 * fastest of {@link growthRuns} runs of each. A run of the smaller size repeats it
 * {@link growthFactor} times, so both runs last about as long for a linear computation and meet the
 * same cores and clock speeds. Both sides repeat their run the count {@link growthSample} finds, so
 * the smaller side lasts at least {@link growthFloorMs} and a coarse clock still reads it.
 *
 * @param fewer The computation on the smaller input.
 * @param more The computation on the input {@link growthFactor} times as large.
 * @param clock Measures the CPU time of a computation, in milliseconds.
 * @returns How many times as long `more` took as one run of `fewer`.
 */
export const growthRatio = (
  fewer: () => void,
  more: () => void,
  clock: (work: () => void) => Effect.Effect<number> = cpuMillis,
): Effect.Effect<number> => {
  const repeatFewer = (times: number) => () => {
    for (let repeat = 0; repeat < times; repeat += 1) {
      fewer();
    }
  };

  return Effect.gen(function* timeGrowth() {
    const k = yield* growthSample((repeats) => clock(repeatFewer(repeats * growthFactor)));
    const repeatMore = () => {
      for (let repeat = 0; repeat < k; repeat += 1) {
        more();
      }
    };
    let fewerMs = Number.POSITIVE_INFINITY;
    let moreMs = Number.POSITIVE_INFINITY;
    for (let run = 0; run < growthRuns; run += 1) {
      const fewerRun = yield* clock(repeatFewer(k * growthFactor));
      const moreRun = yield* clock(repeatMore);
      fewerMs = Math.min(fewerMs, fewerRun / (k * growthFactor));
      moreMs = Math.min(moreMs, moreRun / k);
    }

    return moreMs / fewerMs;
  });
};
