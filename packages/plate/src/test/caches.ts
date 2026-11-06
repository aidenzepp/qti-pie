/**
 * The caches under `~/.cache/gr8des` that plate's unit tests read, and the vitest test tag that
 * marks the tests reading each one.
 *
 * A tag with `skip: true` skips every test that carries it when vitest collects the file, so the
 * hooks and layers around those tests never start, and a file or describe whose every test is
 * skipped is skipped whole. That is why a missing cache is declared once, as a tag, rather than
 * checked by each test at run time. vitest's `strictTags` (on by default) refuses a tag the run
 * does not declare.
 *
 * Test support: `vite.config.ts` declares {@link cacheTags} as the unit run's tags, and this
 * module's own test imports it; nothing else does. Nothing here fetches or writes a cache.
 *
 * @module
 * @see https://vitest.dev/guide/test-tags
 */
import { access } from "node:fs/promises";
import path from "node:path";
import { Config, Console, Effect } from "effect";
import { corpusRoot } from "#plate/document/corpus.ts";
import { confPath } from "#plate/ledger/features.ts";
import { xsdPart2CachePath } from "#plate/model/blocks.ts";
import { webFeaturesPath } from "#plate/test/baseline.ts";
import { xsdDirectory } from "#plate/test/xsd.ts";

/**
 * Where QTI 3's response-processing templates are cached, `.cache/gr8des/qti3/rptemplates` under
 * `HOME`, one `<name>.xml` per template.
 */
export const rptemplatesDirectory: Config.Config<string> = Config.String("HOME").pipe(
  Config.map((home) => path.join(home, ".cache", "gr8des", "qti3", "rptemplates")),
);

/**
 * The setting that relocates a cache: `PLATE_CORPUS_DIR` names the corpus root itself, and `HOME`
 * names the home folder every other cache sits under.
 */
type Variable = "HOME" | "PLATE_CORPUS_DIR";

/**
 * How each {@link Variable} relocates its cache, worded as the readers' own errors word it.
 */
const relocation: Record<Variable, string> = {
  HOME: "or set HOME to the home folder that holds .cache/gr8des",
  PLATE_CORPUS_DIR: "or set PLATE_CORPUS_DIR to the folder that holds them",
};

/**
 * One cache a unit test reads, and the test tag that marks the tests reading it.
 */
export interface Cache {
  /**
   * The vitest tag a test carries when it reads this cache.
   */
  readonly tag: string;
  /**
   * The cache's contents, as a noun phrase.
   */
  readonly what: string;
  /**
   * The cache's file or directory, from the reader the tests themselves use.
   */
  readonly path: Config.Config<string>;
  /**
   * How to put the cache at its path, as a clause that starts with a verb.
   */
  readonly fetch: string;
  readonly variable: Variable;
}

/**
 * Every cache, in the order the unit run declares their tags. The `fetch` texts follow the errors
 * each reader already gives.
 */
export const caches: readonly Cache[] = [
  {
    fetch: "extract the examples there, each nested zip into the X.zip.d/ folder beside it",
    path: corpusRoot,
    tag: "corpus",
    variable: "PLATE_CORPUS_DIR",
    what: "1EdTech's QTI 3 examples",
  },
  {
    fetch:
      "fetch into that folder the 1EdTech QTI 3.0 XSDs whose SHA-256 src/package/tables.test.ts lists",
    path: xsdDirectory,
    tag: "qti-xsd",
    variable: "HOME",
    what: "the QTI 3.0 XSDs",
  },
  {
    fetch: "fetch QTI 3's rptemplates there",
    path: rptemplatesDirectory,
    tag: "rptemplates",
    variable: "HOME",
    what: "QTI 3's response-processing templates",
  },
  {
    fetch: "fetch the 1EdTech QTI 3.0 Conformance and Certification text there as conf.txt",
    path: confPath,
    tag: "conformance-text",
    variable: "HOME",
    what: "the QTI 3.0 conformance text",
  },
  {
    fetch:
      "fetch https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/ there as xmlschema-2-20041028.html",
    path: Config.String("HOME").pipe(Config.map((home) => path.join(home, xsdPart2CachePath))),
    tag: "xsd-datatypes",
    variable: "HOME",
    what: "XML Schema Part 2: Datatypes Second Edition",
  },
  {
    fetch: "fetch data.json of the npm package web-features@3.45.0 there",
    path: webFeaturesPath,
    tag: "web-features",
    variable: "HOME",
    what: "web-features 3.45.0's data",
  },
];

/**
 * Whether a cache that is missing fails its tests rather than skipping them:
 * `PLATE_REQUIRE_CACHES`, false when unset. It reads `1`, `true`, `yes` and their opposites; any
 * other value is a `ConfigError`, so a misspelt setting fails the run rather than being guessed.
 * A run that must not pass on skipped tests sets it.
 */
export const requireCaches: Config.Config<boolean> = Config.Boolean("PLATE_REQUIRE_CACHES").pipe(
  Config.withDefault(false),
);

/**
 * One cache's test tag, structurally vitest's `TestTagDefinition`, declared here so this module
 * imports nothing from vitest. `skip` is true when the cache is missing and
 * {@link requireCaches} is false; `description` is what `vp test --list-tags` prints for it.
 */
export interface CacheTag {
  readonly description: string;
  readonly name: string;
  readonly skip: boolean;
}

/**
 * Probe one cache's path and give its test tag, printing one notice when the cache is missing.
 *
 * Any failure of `access` counts as missing: the tests could not read the cache either.
 *
 * @param cache The cache.
 * @param required Whether a missing cache fails its tests rather than skipping them.
 * @returns The cache's tag; a `ConfigError` when its path cannot be resolved.
 */
const tagOf = Effect.fnUntraced(function* tagOf(cache: Cache, required: boolean) {
  const at = yield* cache.path;
  const missing = yield* Effect.isFailure(Effect.tryPromise(() => access(at)));
  const repair = `${cache.fetch}, ${relocation[cache.variable]}`;

  if (missing) {
    yield* Console.error(
      required
        ? `plate: the tests tagged ${cache.tag} will fail, because PLATE_REQUIRE_CACHES is set: they need ${cache.what}, and ${at} is missing. To run them, ${repair}.`
        : `plate: the tests tagged ${cache.tag} are skipped: they need ${cache.what}, and ${at} is missing. To run them, ${repair}. Set PLATE_REQUIRE_CACHES=1 to make them fail instead.`,
    );
  }

  return {
    description: `Needs ${cache.what} at ${at}: ${repair}.`,
    name: cache.tag,
    skip: missing && !required,
  };
});

/**
 * Probe every cache once and give the unit run one test tag per cache, in {@link caches}' order.
 *
 * For each cache that is missing it prints one line to standard error, starting `plate:`, that
 * says whether its tests are skipped or will fail, which path is missing, and how to supply it.
 * It fails only with a `ConfigError`: a malformed {@link requireCaches}, or a path whose setting
 * is unset.
 */
export const cacheTags: Effect.Effect<CacheTag[], Config.ConfigError> = Effect.gen(
  function* cacheTags() {
    const required = yield* requireCaches;

    return yield* Effect.all(caches.map((cache) => tagOf(cache, required)));
  },
).pipe(Effect.withSpan("cacheTags"));
