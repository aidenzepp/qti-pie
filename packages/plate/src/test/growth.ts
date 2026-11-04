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
 * Measure how a computation's CPU time grows with its input: time it on a smaller input and on one
 * {@link growthFactor} times as large, alternating so a busy spell slows both sizes, and keep the
 * fastest of {@link growthRuns} runs of each. A run of the smaller size repeats it
 * {@link growthFactor} times, so both runs last about as long for a linear computation and meet the
 * same cores and clock speeds.
 *
 * @param fewer The computation on the smaller input.
 * @param more The computation on the input {@link growthFactor} times as large.
 * @returns How many times as long `more` took as one run of `fewer`.
 */
export const growthRatio = (fewer: () => void, more: () => void): Effect.Effect<number> =>
  Effect.gen(function* timeGrowth() {
    let fewerMs = Number.POSITIVE_INFINITY;
    let moreMs = Number.POSITIVE_INFINITY;
    for (let run = 0; run < growthRuns; run += 1) {
      const fewerRun = yield* cpuMillis(() => {
        for (let repeat = 0; repeat < growthFactor; repeat += 1) {
          fewer();
        }
      });
      const moreRun = yield* cpuMillis(more);
      fewerMs = Math.min(fewerMs, fewerRun / growthFactor);
      moreMs = Math.min(moreMs, moreRun);
    }

    return moreMs / fewerMs;
  });
