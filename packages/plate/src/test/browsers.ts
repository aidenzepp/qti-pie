/**
 * The browser harness: Chromium and WebKit from `playwright-core`, headless; the dev playground on
 * a port the system chooses; the walk corpus in a scratch folder; the key that moves focus to the
 * next control in each engine; and the two guards every browser run passes, the load cap and the
 * reserved ports.
 *
 * A browser test lives in a `src/**\/*.browser.test.ts` file, which only `test:browser`
 * (`vite.browser.config.ts`) selects, and registers its cases through {@link eachEngine}, so each
 * runs once in each engine. Every browser, context, page, server and folder the harness opens is
 * held by a scope and closed when that scope ends, however the test ends.
 *
 * The harness names no DOM type: the program's `lib` is `esnext` alone, so a test reads a page
 * through Playwright's API.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import path from "node:path";
import { layer } from "@effect/vitest";
import type { Vitest } from "@effect/vitest";
import { chromium, webkit } from "playwright-core";
import type { Browser, BrowserType, Page } from "playwright-core";
import { ConfigProvider, Context, Effect, Layer, Result, Schema } from "effect";
import type { Config, Scope } from "effect";
import { listen } from "#plate/dev/listen.ts";
import type { ListenFailed } from "#plate/dev/listen.ts";
import type { PlaygroundSettings } from "#plate/dev/page.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { writeWalkCorpus } from "#scripts/walk-corpus.ts";
import type { ProbeUnderivable, ProbeUnwritable } from "#scripts/walk-corpus.ts";

/**
 * The engines every browser test runs in: Chromium, and WebKit, which stands in for Safari until
 * `safaridriver` is enabled.
 */
export const engineNames = ["chromium", "webkit"] as const;

/**
 * An engine a browser test runs in.
 */
export type EngineName = (typeof engineNames)[number];

/**
 * The ports no browser run holds: 5190 is the dev playground's `serve`, and the others belong to
 * other servers on this machine, 5433 and 5435 among them the database servers. The harness binds
 * port 0, and {@link refusePort} refuses a bound port among these.
 */
export const reservedPorts = [5190, 5191, 5192, 5433, 5435] as const;

/**
 * The 1-minute load average at or above which no browser run starts (rule `c8a113fd`).
 */
export const loadCap = 60;

/**
 * The command that downloads the engines, once, into `~/.cache/gr8des/ms-playwright`.
 */
const browsersCommand = "pnpm --filter @qti-pie/plate browsers";

/**
 * The folder the walk corpus is written under: the package's git-ignored `work/browser-test/`.
 */
const browserTestDirectory = path.resolve(import.meta.dirname, "..", "..", "work", "browser-test");

/**
 * The failure of a browser run that would start while the 1-minute load average is at
 * {@link loadCap} or above.
 */
export class LoadTooHigh extends Schema.TaggedError<LoadTooHigh>()("LoadTooHigh", {
  load: Schema.Number,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `The 1-minute load average is ${this.load.toFixed(2)}, at or above the browser runs' cap of ${String(loadCap)}. Wait until it falls under ${String(loadCap)}, then run the browser tests again.`;
  }
}

/**
 * The failure of a playground bound to one of the {@link reservedPorts}.
 */
export class ReservedPort extends Schema.TaggedError<ReservedPort>()("ReservedPort", {
  port: Schema.Number,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Port ${String(this.port)} is reserved for another server on this machine (${reservedPorts.join(", ")}). Listen on port 0, so the system chooses a free port.`;
  }
}

/**
 * The failure of an engine whose executable is not installed: Playwright's launch found no file at
 * the path it runs, under `PLAYWRIGHT_BROWSERS_PATH`.
 */
export class BrowsersMissing extends Schema.TaggedError<BrowsersMissing>()("BrowsersMissing", {
  engine: Schema.Literals(engineNames),
  executable: Schema.String,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `The ${this.engine} executable is missing: Playwright looked for it at ${this.executable}. Run the browser tests through \`pnpm --filter @qti-pie/plate test:browser\`, which reads the engines from ~/.cache/gr8des/ms-playwright, and download them there once with \`${browsersCommand}\`.`;
  }
}

/**
 * The failure of an engine whose executable is installed but does not launch.
 */
export class LaunchFailed extends Schema.TaggedError<LaunchFailed>()("LaunchFailed", {
  detail: Schema.String,
  engine: Schema.Literals(engineNames),
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot launch ${this.engine}: ${this.detail}. Download the engines again with \`${browsersCommand}\` if the install is damaged, or free memory and processes if the system refused the launch.`;
  }
}

/**
 * Refuse a browser run while the 1-minute load average is at or above {@link loadCap}.
 *
 * @param load The 1-minute load average, as `os.loadavg()` reads it.
 * @returns The load when it is under the cap, else {@link LoadTooHigh}; a load that is not a number
 *   is refused too.
 */
export const refuseLoad = (load: number): Result.Result<number, LoadTooHigh> =>
  load < loadCap ? Result.succeed(load) : Result.fail(new LoadTooHigh({ load }));

/**
 * Refuse a bound port that is one of the {@link reservedPorts}.
 *
 * @param port The port a listener bound.
 * @returns The port when it is not reserved, else {@link ReservedPort}.
 */
export const refusePort = (port: number): Result.Result<number, ReservedPort> =>
  reservedPorts.some((reserved) => reserved === port)
    ? Result.fail(new ReservedPort({ port }))
    : Result.succeed(port);

/**
 * A launched engine: its name, its headless browser, and the version that browser reports. The
 * browser closes when the {@link engineLayer} that launched it is released.
 */
export class Engine extends Context.Service<
  Engine,
  { readonly browser: Browser; readonly name: EngineName; readonly version: string }
>()("@qti-pie/plate/test/browsers/Engine") {}

/**
 * A dev playground listening on `127.0.0.1`: the origin its pages are requested from and the port
 * the system chose. The server closes when the {@link playgroundLayer} that opened it is released.
 */
export class Playground extends Context.Service<
  Playground,
  { readonly origin: string; readonly port: number }
>()("@qti-pie/plate/test/browsers/Playground") {}

/**
 * The walk corpus, written into a fresh folder that is removed when the {@link walkCorpusLayer}
 * that wrote it is released. A playground serves it with `PLATE_CORPUS_DIR` set to `directory`.
 */
export class WalkCorpus extends Context.Service<WalkCorpus, { readonly directory: string }>()(
  "@qti-pie/plate/test/browsers/WalkCorpus",
) {}

/**
 * The `playwright-core` browser type of each engine.
 */
const browserTypes = { chromium, webkit } as const satisfies Record<EngineName, BrowserType>;

/**
 * The text Playwright's launch error carries when the engine's executable is not installed, with
 * the path it looked for after it.
 *
 * @see https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright-core/src/server/registry/index.ts (`executablePathOrDie`: "Executable doesn't exist at …")
 */
const missingExecutable = /Executable doesn't exist at (?<executable>[^\r\n]+)/u;

/**
 * Read a failed launch: {@link BrowsersMissing} when Playwright found no executable to run, else
 * {@link LaunchFailed}.
 *
 * @param name The engine.
 * @param detail The launch error's message.
 * @returns The failure.
 */
const launchFailure = (name: EngineName, detail: string): BrowsersMissing | LaunchFailed => {
  const executable = missingExecutable.exec(detail)?.groups?.["executable"];

  return executable === undefined
    ? new LaunchFailed({ detail, engine: name })
    : new BrowsersMissing({ engine: name, executable: executable.trim() });
};

/**
 * Launch the engine headless and provide it as {@link Engine}; releasing the layer closes the
 * browser and every context it holds.
 *
 * @param name The engine.
 * @returns The layer; it fails with {@link BrowsersMissing} when the executable is not installed,
 *   and with {@link LaunchFailed} when it is there but does not launch.
 */
export const engineLayer = (
  name: EngineName,
): Layer.Layer<Engine, BrowsersMissing | LaunchFailed> =>
  Layer.effect(
    Engine,
    Effect.gen(function* launch() {
      const browser = yield* Effect.acquireRelease(
        Effect.tryPromise({
          catch: (cause) =>
            launchFailure(name, cause instanceof Error ? cause.message : String(cause)),
          try: () => browserTypes[name].launch({ headless: true }),
        }),
        (launched) => Effect.promise(() => launched.close()),
      );

      return Engine.of({ browser, name, version: browser.version() });
    }).pipe(Effect.withSpan("engineLayer", { attributes: { engine: name } })),
  );

/**
 * Open the dev playground on `127.0.0.1` at a port the system chooses and provide it as
 * {@link Playground}; releasing the layer closes the server and every connection it holds.
 *
 * `#plate/dev/page.ts` is imported when the layer is built, not with this module: it resolves its
 * stylesheets with `import.meta.resolve` as it loads, which Vite's server module runner does not
 * support, and that runner loads `globalSetup` (`src/test/browser-setup.ts`), which imports this
 * module for its guards. The test workers, which build the layer, support it.
 *
 * @param settings The playground's settings: its configuration, its config provider (where the
 *   corpus is read from) and its verdict cache, each optional.
 * @returns The layer; it fails with `ListenFailed` when no port can be bound, and with
 *   {@link ReservedPort} when the bound port is reserved.
 */
export const playgroundLayer = (
  settings: PlaygroundSettings,
): Layer.Layer<Playground, ListenFailed | ReservedPort> =>
  Layer.effect(
    Playground,
    Effect.gen(function* open() {
      const { createHandler } = yield* Effect.promise(() => import("#plate/dev/page.ts"));
      const listening = yield* listen({ handler: createHandler(settings), port: 0 });
      const port = yield* Effect.fromResult(refusePort(listening.port));

      return Playground.of({ origin: listening.origin, port });
    }).pipe(Effect.withSpan("playgroundLayer")),
  );

/**
 * Write the walk corpus into a fresh folder under the package's `work/browser-test/` and provide
 * it as {@link WalkCorpus}; releasing the layer removes the folder.
 *
 * The folder reaches `writeWalkCorpus` as `PLATE_WALK_CORPUS_DIR`; every other setting, `HOME` and
 * `PLATE_CORPUS_DIR` among them, comes from the config provider in place, the environment by
 * default, since the derived probes are read from the example corpus.
 */
export const walkCorpusLayer: Layer.Layer<
  WalkCorpus,
  CorpusFileUnreadable | CorpusMissing | Config.ConfigError | ProbeUnderivable | ProbeUnwritable
> = Layer.effect(
  WalkCorpus,
  Effect.gen(function* writeWalk() {
    const directory = yield* Effect.acquireRelease(
      Effect.sync(() => path.join(browserTestDirectory, `walk-corpus-${randomUUID()}`)),
      (folder) => Effect.promise(() => rm(folder, { force: true, recursive: true })),
    );
    const ambient = yield* ConfigProvider.ConfigProvider;
    const provider = ConfigProvider.orElse(
      ConfigProvider.fromUnknown({ PLATE_WALK_CORPUS_DIR: directory }),
      ambient,
    );

    yield* writeWalkCorpus.pipe(Effect.provide(ConfigProvider.layer(provider)));

    return WalkCorpus.of({ directory });
  }).pipe(Effect.withSpan("walkCorpusLayer")),
);

/**
 * The walk corpus, and a playground over it whose configuration turns on `validateResponses`, so a
 * post's entry is checked against its `pattern-mask`; it provides both {@link WalkCorpus} and
 * {@link Playground}.
 */
export const walkPlaygroundLayer: Layer.Layer<
  Playground | WalkCorpus,
  | CorpusFileUnreadable
  | CorpusMissing
  | Config.ConfigError
  | ListenFailed
  | ProbeUnderivable
  | ProbeUnwritable
  | ReservedPort
> = Layer.unwrap(
  Effect.gen(function* overWalkCorpus() {
    const { directory } = yield* WalkCorpus;

    return playgroundLayer({
      configuration: { validateResponses: true },
      provider: ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory }),
    });
  }),
).pipe(Layer.provideMerge(walkCorpusLayer));

/**
 * Open one page in a new browser context of the {@link Engine} and use it; the page and its context
 * are closed when `use` ends, however it ends.
 *
 * @param options The context's settings.
 * @param options.javaScriptEnabled Whether the page runs script; browser tests run with it off
 *   unless their brief says on.
 * @param use Use the page.
 * @returns What `use` returns.
 */
export const withPage = <A, E, R>(
  options: { readonly javaScriptEnabled: boolean },
  use: (page: Page) => Effect.Effect<A, E, R>,
): Effect.Effect<A, E, Engine | Exclude<R, Scope.Scope>> =>
  Effect.scoped(
    Effect.gen(function* openPage() {
      const { browser } = yield* Engine;
      const context = yield* Effect.acquireRelease(
        Effect.promise(() => browser.newContext({ javaScriptEnabled: options.javaScriptEnabled })),
        (opened) => Effect.promise(() => opened.close()),
      );
      const page = yield* Effect.acquireRelease(
        Effect.promise(() => context.newPage()),
        (opened) => Effect.promise(() => opened.close()),
      );

      return yield* use(page);
    }),
  );

/**
 * A key that moves focus to the next control: Tab, or Option-Tab, which Playwright names
 * `Alt+Tab`.
 */
export type NextControlKey = "Alt+Tab" | "Tab";

/**
 * The document {@link nextControlKey} probes with: one button, a control Tab skips where it moves
 * only between text fields.
 */
const keyProbe = '<!doctype html><title>Key probe</title><button type="button">Probe</button>';

/**
 * Find the key that moves focus to the next control of any kind, text field or not, in the page's
 * engine as it is set up.
 *
 * WebKit on macOS keeps Safari's split by default: Tab highlights only text fields and pop-up
 * menus, and Option-Tab highlights clickable items too, the radios, checkboxes and buttons among
 * them; with Safari's "Press Tab to highlight each item" on, Tab highlights every item. Elsewhere
 * Tab reaches every control. So the key is probed, not assumed: the page loads a document of one
 * button and Tab is pressed once from its start; when focus lands on the button the key is Tab,
 * else Option-Tab.
 *
 * Call it once on a fresh page, before the page opens what the test reads: the probe replaces the
 * page's document, and the test's next navigation replaces the probe.
 *
 * @param page The page.
 * @returns `Tab` when Tab reaches the button, else `Alt+Tab`.
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
export const nextControlKey = Effect.fn("nextControlKey")(function* nextControlKey(
  page: Page,
): Effect.fn.Return<NextControlKey> {
  yield* Effect.promise(() => page.setContent(keyProbe));
  yield* Effect.promise(() => page.keyboard.press("Tab"));

  const reached = yield* Effect.promise(() => page.locator("button:focus").count());

  return reached > 0 ? "Tab" : "Alt+Tab";
});

/**
 * Register a file's browser tests once per engine: for each of {@link engineNames}, a `describe`
 * named by the engine whose tests share one launch of it, through `@effect/vitest`'s `layer`.
 *
 * @param tests Register the tests of one engine's `describe`.
 * @param tests.it The `describe`'s test API, whose tests have {@link Engine}.
 * @param tests.name The engine.
 */
export const eachEngine = (
  tests: (it: Vitest.MethodsNonLive<Engine>, name: EngineName) => void,
): void => {
  for (const name of engineNames) {
    layer(engineLayer(name))(name, (it) => {
      tests(it, name);
    });
  }
};
