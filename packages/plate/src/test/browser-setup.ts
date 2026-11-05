/**
 * The browser run's global setup, which `vite.browser.config.ts` registers as `globalSetup`.
 *
 * Before any browser file loads, it refuses the run while the 1-minute load average is at the cap
 * or above, and while an engine's executable is missing, so a refused run launches no engine.
 */
import os from "node:os";
import { Effect } from "effect";
import { engineNames, refuseLoad, requireExecutable } from "#plate/test/browsers.ts";

/**
 * The checks a browser run passes before any engine launches: the load cap, then each engine's
 * executable.
 */
const ready = Effect.gen(function* ready() {
  const [load = Number.NaN] = os.loadavg();

  yield* Effect.fromResult(refuseLoad(load));
  yield* Effect.forEach(engineNames, (name) => requireExecutable(name), { discard: true });
}).pipe(Effect.withSpan("browserSetup"));

/**
 * Run the checks before the browser run. A failure rejects with the typed error, whose message
 * says what to change, and Vitest stops the run before any test file loads.
 *
 * @returns A promise that settles once every check has passed.
 */
export default async function setup(): Promise<void> {
  await Effect.runPromise(ready);
}
