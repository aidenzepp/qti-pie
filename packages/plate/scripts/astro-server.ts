/**
 * The Astro host's server: one scoped resource that builds `hosts/astro/` and serves the build on
 * `127.0.0.1:5192`, the one module that opens Astro's port.
 *
 * It serves the way the probe `p4-29` chose: a production build with `@astrojs/node` in
 * standalone mode, whose pages hold no script. Astro's dev server is never used: it injects
 * `/@vite/client` into every page and can background itself onto port 4321.
 * `scripts/astro-check.ts` and the browser test `src/hosts/astro.browser.test.ts` open it;
 * importing it starts nothing.
 *
 * Run as a script, it serves the host until Ctrl-C or SIGTERM. From the repository root:
 *
 * ```sh
 * pnpm --filter @qti-pie/plate host:astro
 * ```
 *
 * Then open `http://127.0.0.1:5192/`. `PLATE_CORPUS_DIR` names another corpus root.
 *
 * @module
 */
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { Console, Effect, Schema } from "effect";
import type { Scope } from "effect";
import { corpusRoot } from "#plate/document/corpus.ts";
import { dial } from "#plate/test/dial.ts";

/**
 * Astro's port, which `hosts/astro/astro.config.ts` sets as `server.port`.
 */
export const astroPort = 5192;

/**
 * The origin the built server answers on.
 */
const origin = `http://127.0.0.1:${String(astroPort)}`;

/**
 * Plate's package directory, the parent of `scripts/`.
 */
const plateDirectory = path.resolve(import.meta.dirname, "..");

/**
 * The Astro project, `hosts/astro/`, which has no `package.json` of its own.
 */
const hostDirectory = path.join(plateDirectory, "hosts", "astro");

/**
 * The standalone server the build writes.
 */
const serverEntry = path.join(hostDirectory, "dist", "server", "entry.mjs");

/**
 * The scratch directory the children write temporary files under, never the system's own.
 */
const scratchDirectory = path.join(plateDirectory, "work", ".vp-tmp");

/**
 * How often, and how many times, the server is dialled while it starts and after it stops. The
 * probe measured a quarter of a second to answer and under a tenth to free the port, unloaded;
 * ten seconds leaves room for a loaded machine.
 */
const portWait = { attempts: 200, interval: "50 millis" } as const;

/**
 * How many of a child's last output lines a failure carries.
 */
const tailLines = 20;

/**
 * The step of serving that failed: reading the corpus setting, finding the port taken, building,
 * or starting the built server.
 */
const AstroStage = Schema.Literals(["corpus", "port", "build", "start"]);

/**
 * The failure of {@link astroServer}: the step, what to change, and the child's last output lines,
 * so a person can fix it without running Astro by hand.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class AstroFailed extends Schema.TaggedError<AstroFailed>()("AstroFailed", {
  detail: Schema.String,
  output: Schema.Array(Schema.String),
  stage: AstroStage,
}) {
  /**
   * The step, what failed and what to change, then the child's output when it wrote any.
   */
  override get message(): string {
    return [
      `The Astro host failed at its ${this.stage} step: ${this.detail}`,
      ...(this.output.length === 0 ? [] : ["Its last output lines:", ...this.output]),
    ].join("\n");
  }
}

/**
 * Keep the last {@link tailLines} non-empty lines of a child's output.
 *
 * @param chunks What the child wrote, standard error and standard output interleaved.
 * @returns The lines.
 */
const tailOf = (chunks: readonly string[]): readonly string[] =>
  chunks
    .join("")
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(-tailLines);

/**
 * The whole environment of both children: the corpus root, telemetry off and a scratch directory
 * inside the package. Nothing of the caller's environment reaches them, so no setting or secret of
 * the caller's can be written into the build, its caches or its logs.
 *
 * @param corpus The corpus root, as `corpusRoot` resolved it.
 * @returns The environment.
 */
const childEnvironment = (corpus: string) => ({
  ASTRO_TELEMETRY_DISABLED: "1",
  PLATE_CORPUS_DIR: corpus,
  TMPDIR: scratchDirectory,
});

/**
 * A started Node child and what it has written so far, standard error and standard output
 * interleaved.
 */
interface Started {
  readonly child: ChildProcess;
  readonly output: readonly string[];
}

/**
 * Start a Node child in plate's directory, collecting its output.
 *
 * A child that cannot start emits `error`, which this records in its output, so the event never
 * goes unheard.
 *
 * @param args Node's arguments.
 * @param environment The child's whole environment.
 * @returns The child and its output.
 */
const startNode = (args: readonly string[], environment: Readonly<Record<string, string>>) => {
  const output: string[] = [];
  const child = spawn(process.execPath, args, {
    cwd: plateDirectory,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.setEncoding("utf-8").on("data", (chunk: string) => {
    output.push(chunk);
  });
  child.stderr.setEncoding("utf-8").on("data", (chunk: string) => {
    output.push(chunk);
  });
  child.on("error", (cause) => {
    output.push(`${cause.message}\n`);
  });

  return { child, output } satisfies Started;
};

/**
 * Tell whether a child is still running.
 *
 * @param child The child.
 * @returns Whether it has neither exited nor been ended by a signal.
 */
const isRunning = (child: ChildProcess): boolean =>
  child.exitCode === null && child.signalCode === null;

/**
 * Write how a child ended.
 *
 * @param child The child, once it has ended.
 * @returns `exit code <n>` or `signal <name>`.
 */
const endOf = (child: ChildProcess): string =>
  child.exitCode === null
    ? `signal ${child.signalCode ?? "unknown"}`
    : `exit code ${String(child.exitCode)}`;

/**
 * Wait for a child to end: to exit, to be ended by a signal, or to fail to start.
 *
 * @param child The child.
 * @returns How it ended, as a person reads it.
 */
const ended = (child: ChildProcess): Effect.Effect<string> =>
  isRunning(child)
    ? Effect.callback<string>((resume) => {
        child.once("exit", () => {
          resume(Effect.succeed(endOf(child)));
        });
        child.once("error", (cause) => {
          resume(Effect.succeed(`a failure to start (${cause.message})`));
        });
      })
    : Effect.succeed(endOf(child));

/**
 * Build `hosts/astro/` with Astro's own command line, `astro build`, and wait for it.
 *
 * @param environment The child's whole environment.
 * @returns Nothing; {@link AstroFailed} when the build does not exit 0.
 */
const build = Effect.fnUntraced(function* build(
  environment: Readonly<Record<string, string>>,
): Effect.fn.Return<void, AstroFailed> {
  const astro = path.join(
    path.dirname(createRequire(import.meta.url).resolve("astro/package.json")),
    "bin",
    "astro.mjs",
  );
  const { child, output } = startNode([astro, "build", "--root", hostDirectory], environment);
  const end = yield* ended(child);

  yield* end === "exit code 0"
    ? Effect.void
    : Effect.fail(
        new AstroFailed({
          detail: `astro build --root ${hostDirectory} ended with ${end}. Fix what its output names, then run this again.`,
          output: tailOf(output),
          stage: "build",
        }),
      );
});

/**
 * Dial {@link astroPort} until it gives the answer wanted, the attempts run out, or `running`
 * says to stop.
 *
 * @param wanted `accepted` to wait for the server, `refused` to wait for the port to be free.
 * @param running Whether to keep dialling; a server that has ended will never answer.
 * @returns Whether the answer came.
 */
const awaitPort = Effect.fnUntraced(function* awaitPort(
  wanted: "accepted" | "refused",
  running: () => boolean = () => true,
): Effect.fn.Return<boolean> {
  for (let attempt = 0; attempt < portWait.attempts && running(); attempt += 1) {
    if ((yield* dial(astroPort)) === wanted) {
      return true;
    }

    yield* Effect.sleep(portWait.interval);
  }

  return false;
});

/**
 * Stop the server: SIGTERM, then SIGKILL when it has not ended within ten seconds, then wait until
 * the port is free. It never fails; `scripts/astro-check.ts` confirms the port is free afterwards.
 *
 * @param started The server.
 * @returns An effect that stops it.
 */
const stop = (started: Started): Effect.Effect<void> =>
  Effect.gen(function* stopServer() {
    started.child.kill("SIGTERM");
    yield* ended(started.child).pipe(
      Effect.timeoutOrElse({
        duration: "10 seconds",
        orElse: () =>
          Effect.sync(() => started.child.kill("SIGKILL")).pipe(
            Effect.andThen(ended(started.child)),
          ),
      }),
    );
    yield* awaitPort("refused");
  });

/**
 * Serve the Astro host on `127.0.0.1:5192` until the scope closes.
 *
 * It resolves the corpus root as `corpusRoot` does (`PLATE_CORPUS_DIR`, or the cache under
 * `HOME`) and hands it to the page as `PLATE_CORPUS_DIR`, refuses to start when something already
 * answers on 5192, builds `hosts/astro/`, starts the built server and waits until 5192 answers.
 * Closing the scope stops the server and waits until 5192 is free. The page reads BG010 from the
 * corpus root on each request.
 *
 * @returns The origin the page is served at; {@link AstroFailed} when the corpus setting cannot be
 *   read, the port is taken, the build fails, or the server ends or does not answer in time.
 */
export const astroServer: Effect.Effect<{ readonly origin: string }, AstroFailed, Scope.Scope> =
  Effect.gen(function* astroServer() {
    const corpus = yield* corpusRoot.pipe(
      Effect.mapError(
        (error) =>
          new AstroFailed({
            detail: `${error.message}. Set PLATE_CORPUS_DIR to the directory that holds 1EdTech's QTI 3 examples, or set HOME.`,
            output: [],
            stage: "corpus",
          }),
      ),
    );

    if ((yield* dial(astroPort)) === "accepted") {
      return yield* new AstroFailed({
        detail: `something already answers on ${origin}. Stop what holds port ${String(astroPort)}, then run this again.`,
        output: [],
        stage: "port",
      });
    }

    const environment = childEnvironment(corpus);
    yield* Effect.tryPromise({
      catch: (cause) =>
        new AstroFailed({
          detail: `cannot create the scratch directory ${scratchDirectory} (${cause instanceof Error ? cause.message : String(cause)}). Make plate's work/ folder writable.`,
          output: [],
          stage: "build",
        }),
      try: () => mkdir(scratchDirectory, { recursive: true }),
    });
    yield* build(environment);

    const started = yield* Effect.acquireRelease(
      Effect.sync(() => startNode([serverEntry], environment)),
      stop,
    );
    const answered = yield* awaitPort("accepted", () => isRunning(started.child));

    if (!answered) {
      const state = isRunning(started.child)
        ? "it is still running"
        : `it ended with ${endOf(started.child)}`;

      return yield* new AstroFailed({
        detail: `the built server, node ${serverEntry}, did not answer on ${origin}, and ${state}. Fix what its output names, then run this again.`,
        output: tailOf(started.output),
        stage: "start",
      });
    }

    return { origin };
  }).pipe(Effect.withSpan("astroServer"));

/**
 * Wait for SIGINT or SIGTERM, whichever comes first. While it waits, the signals no longer end
 * the process on their own, so the scope around it stops the server before the process exits.
 */
const stopped = Effect.callback((resume: (signalled: Effect.Effect<void>) => void) => {
  const stopSignal = () => {
    process.off("SIGINT", stopSignal);
    process.off("SIGTERM", stopSignal);
    resume(Effect.void);
  };
  process.on("SIGINT", stopSignal);
  process.on("SIGTERM", stopSignal);

  return Effect.sync(() => {
    process.off("SIGINT", stopSignal);
    process.off("SIGTERM", stopSignal);
  });
});

if (import.meta.main) {
  await Effect.runPromise(
    Effect.scoped(
      Effect.gen(function* serve() {
        const served = yield* astroServer;
        yield* Console.log(
          `The Astro host is at ${served.origin}/ (listening on 127.0.0.1 only). Ctrl-C stops it.`,
        );
        yield* stopped;
      }),
    ).pipe(
      Effect.catch((error) =>
        Console.error(error.message).pipe(
          Effect.andThen(
            Effect.sync(() => {
              process.exitCode = 1;
            }),
          ),
        ),
      ),
    ),
  );
}
