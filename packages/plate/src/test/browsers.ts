/**
 * The browser harness: Chromium and WebKit from `playwright-core`, headless; the dev playground on
 * a port the system chooses; the walk corpus in a scratch folder; and the two guards every browser
 * run passes, the load cap and the reserved ports.
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
import { constants } from "node:fs";
import { access, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { layer } from "@effect/vitest";
import type { Vitest } from "@effect/vitest";
import { chromium, webkit } from "playwright-core";
import type { Browser, BrowserType, Page } from "playwright-core";
import { ConfigProvider, Context, Effect, Layer, Predicate, Result, Schema, pipe } from "effect";
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
 * The failure of an engine whose executable is missing or cannot be run.
 */
export class BrowsersMissing extends Schema.TaggedError<BrowsersMissing>()("BrowsersMissing", {
  engine: Schema.Literals(engineNames),
  executable: Schema.String,
}) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `The ${this.engine} executable ${this.executable} is missing or cannot be run. Run the browser tests through \`pnpm --filter @qti-pie/plate test:browser\`, which reads the engines from ~/.cache/gr8des/ms-playwright, and download them there once with \`${browsersCommand}\`.`;
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
 * The failure of reading, from Playwright's browser registry, the executable a headless launch
 * runs.
 */
export class RegistryUnreadable extends Schema.TaggedError<RegistryUnreadable>()(
  "RegistryUnreadable",
  { detail: Schema.String },
) {
  /**
   * What failed and what to change.
   */
  override get message(): string {
    return `Cannot read the executable a headless launch runs from playwright-core's browser registry: ${this.detail}. The harness reads it from \`playwright-core/lib/coreBundle\`; check that module's layout against the installed playwright-core.`;
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
 * The name Playwright's browser registry gives the executable a headless launch of each engine
 * runs. A headless Chromium launch runs the headless shell (`chromium-headless-shell`), the only
 * Chromium `browsers` downloads (`--only-shell`); a WebKit launch runs `webkit`.
 *
 * @see https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright-core/src/server/chromium/chromium.ts (`getExecutableName`: headless picks `chromium-headless-shell`)
 */
const executableNames = {
  chromium: "chromium-headless-shell",
  webkit: "webkit",
} as const satisfies Record<EngineName, string>;

/**
 * Node's `require`, which loads `playwright-core/lib/coreBundle`. That module is in
 * `playwright-core`'s `exports` map but ships no types, so it is loaded here and read as
 * `unknown`; `playwright-core`'s own entry loads the same module, so its registry is the one a
 * launch reads.
 */
const requireModule = createRequire(import.meta.url);

/**
 * Read a property of a value from Playwright's untyped bundle.
 *
 * @param target The value.
 * @param key The property's name.
 * @returns The property's value, or {@link RegistryUnreadable} when the value has no such property.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The registry comes from an untyped CommonJS bundle, so each step reads an unknown value and checks it.
const member = (target: unknown, key: string): Result.Result<unknown, RegistryUnreadable> =>
  Predicate.hasProperty(target, key)
    ? Result.succeed(target[key])
    : Result.fail(new RegistryUnreadable({ detail: `it has no ${key}` }));

/**
 * The part of a registry executable the harness reads, as Playwright's registry declares it:
 * `executablePath` gives the path the executable runs from under `PLAYWRIGHT_BROWSERS_PATH`,
 * whether or not anything is installed there, or `undefined` on a platform it does not support.
 * The bundle is untyped, so {@link executableOf} checks each value it reads again.
 */
interface RegistryExecutable {
  readonly executablePath: () => string | undefined;
}

/**
 * The part of Playwright's browser registry the harness reads, as the registry declares it:
 * `findExecutable` gives the executable registered under a name, or `undefined` for a name it does
 * not know. Each method is called on its object, which it reads as `this`.
 */
interface BrowserRegistry {
  readonly findExecutable: (name: string) => RegistryExecutable | undefined;
}

/**
 * Whether a value from Playwright's untyped bundle is a {@link BrowserRegistry}.
 *
 * @param value The value.
 * @returns Whether it has a `findExecutable` function.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The registry comes from an untyped CommonJS bundle, so each step reads an unknown value and checks it.
const isBrowserRegistry = (value: unknown): value is BrowserRegistry =>
  Predicate.hasProperty(value, "findExecutable") && Predicate.isFunction(value.findExecutable);

/**
 * Whether a value from Playwright's untyped bundle is a {@link RegistryExecutable}.
 *
 * @param value The value.
 * @returns Whether it has an `executablePath` function.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The registry comes from an untyped CommonJS bundle, so each step reads an unknown value and checks it.
const isRegistryExecutable = (value: unknown): value is RegistryExecutable =>
  Predicate.hasProperty(value, "executablePath") && Predicate.isFunction(value.executablePath);

/**
 * Find the executable a headless launch of the engine runs, as Playwright's browser registry
 * resolves it under `PLAYWRIGHT_BROWSERS_PATH`.
 *
 * `BrowserType.executablePath()` names Chromium's full browser, which `browsers` does not
 * download, not the headless shell a headless launch runs, so the path comes from the registry,
 * where the launch itself reads it.
 *
 * @param name The engine.
 * @returns The executable's path, which may not exist; {@link RegistryUnreadable} when the registry
 *   does not have the layout this reads.
 * @see https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright-core/src/server/registry/index.ts (`Registry.findExecutable`, `executablePath`)
 */
export const executableOf = (name: EngineName): Result.Result<string, RegistryUnreadable> =>
  pipe(
    member(requireModule("playwright-core/lib/coreBundle"), "registry"),
    Result.flatMap((module) => member(module, "registry")),
    Result.flatMap((registry) =>
      isBrowserRegistry(registry)
        ? Result.succeed(registry.findExecutable(executableNames[name]))
        : Result.fail(new RegistryUnreadable({ detail: "its registry has no findExecutable" })),
    ),
    Result.flatMap((executable) =>
      isRegistryExecutable(executable)
        ? Result.succeed(executable.executablePath())
        : Result.fail(
            new RegistryUnreadable({ detail: `it registers no ${executableNames[name]}` }),
          ),
    ),
    Result.flatMap((found) =>
      Predicate.isString(found) && found !== ""
        ? Result.succeed(found)
        : Result.fail(
            new RegistryUnreadable({ detail: `it names no ${executableNames[name]} executable` }),
          ),
    ),
  );

/**
 * Require the executable a headless launch of the engine runs to exist and be executable.
 *
 * @param name The engine.
 * @returns The executable's path; {@link BrowsersMissing} when it is missing or cannot be run.
 */
export const requireExecutable = Effect.fn("requireExecutable")(function* requireExecutable(
  name: EngineName,
): Effect.fn.Return<string, BrowsersMissing | RegistryUnreadable> {
  const executable = yield* Effect.fromResult(executableOf(name));

  yield* Effect.tryPromise({
    catch: () => new BrowsersMissing({ engine: name, executable }),
    try: () => access(executable, constants.X_OK),
  });

  return executable;
});

/**
 * Launch the engine headless and provide it as {@link Engine}; releasing the layer closes the
 * browser and every context it holds.
 *
 * @param name The engine.
 * @returns The layer; it fails with {@link BrowsersMissing} when the executable is missing, with
 *   {@link LaunchFailed} when it is there but does not launch, and with {@link RegistryUnreadable}
 *   when Playwright's registry cannot say where the executable is.
 */
export const engineLayer = (
  name: EngineName,
): Layer.Layer<Engine, BrowsersMissing | LaunchFailed | RegistryUnreadable> =>
  Layer.effect(
    Engine,
    Effect.gen(function* launch() {
      yield* requireExecutable(name);

      const browser = yield* Effect.acquireRelease(
        Effect.tryPromise({
          catch: (cause) =>
            new LaunchFailed({
              detail: cause instanceof Error ? cause.message : String(cause),
              engine: name,
            }),
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
