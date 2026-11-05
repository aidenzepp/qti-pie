/**
 * Serves the dev playground (`src/dev/page.ts`) on `127.0.0.1`: a person's entry to
 * `src/dev/listen.ts`, which opens every port the package opens.
 *
 * From the repository root:
 *
 * ```sh
 * pnpm --filter @qti-pie/plate serve
 * ```
 *
 * Then open `http://localhost:5190`. `PLATE_DEV_PORT` picks another port and `PLATE_CORPUS_DIR`
 * another corpus root. Ctrl-C, or SIGTERM, closes the server and every open connection, so the
 * process exits.
 */
import { Config, Console, Effect } from "effect";
import { listen } from "#plate/dev/listen.ts";
import type { ListenFailed } from "#plate/dev/listen.ts";
import { handler } from "#plate/dev/page.ts";

/**
 * The port: `PLATE_DEV_PORT`, 5190 when it is not set.
 */
const port = Config.Port("PLATE_DEV_PORT").pipe(Config.withDefault(5190));

/**
 * Wait for SIGINT or SIGTERM, whichever comes first.
 *
 * While it waits, the signals no longer end the process on their own, so the scope around it
 * closes the server before the process exits.
 */
const stopped = Effect.callback((resume: (signalled: Effect.Effect<void>) => void) => {
  const stop = () => {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    resume(Effect.void);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  return Effect.sync(() => {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
  });
});

/**
 * State why the port could not be opened, naming the setting that picks another one.
 *
 * @param error The listener's failure.
 * @returns The line a person reads.
 */
const refusal = (error: ListenFailed): string =>
  `Cannot listen on 127.0.0.1:${String(error.port)}: ${error.detail}. Stop what holds the port, or set PLATE_DEV_PORT to a free one.`;

/**
 * Listen at the configured port, answer every request through the playground, and close the
 * server and its connections on SIGINT or SIGTERM.
 */
const program = Effect.scoped(
  Effect.gen(function* serve() {
    const listening = yield* listen({ handler, port: yield* port });
    yield* Console.log(
      `The dev playground is at http://localhost:${String(listening.port)}/ (listening on ${listening.origin} only). Ctrl-C stops it.`,
    );
    yield* stopped;
  }),
);

/**
 * Print a failure and set the exit code to 1.
 *
 * @param line The line a person reads.
 * @returns An effect that prints it.
 */
const failed = (line: string) =>
  Console.error(line).pipe(
    Effect.andThen(
      Effect.sync(() => {
        process.exitCode = 1;
      }),
    ),
  );

await Effect.runPromise(
  program.pipe(
    Effect.catchTag("ListenFailed", (error) => failed(refusal(error))),
    Effect.catch((error) => failed(error.message)),
  ),
);
