/**
 * The dev playground's packages: the package listing at `/packages`, each package's page at
 * `/packages/<id>`, and its files at `/packages/<id>/files/<path>`.
 *
 * The packages are every `*.zip.d` directory under the corpus root, each a zip of the example
 * corpus extracted beside it, then the repository's M2 fixture package, `fixtures/m2/`.
 * Each is read whole and judged by `openPackage` the first time something asks for it, and its
 * verdict is kept for the cache's life. A package's page lists its resources with the verdict on
 * each document and, when the package is accepted, a native form with one Start button per test;
 * the form posts to `/packages/<id>/tests`, which the playground's session pages take. The files
 * route serves only a file in an accepted package's `files`, which leaves out every QTI document,
 * of a type `/assets/*` also serves, with the same asset headers, so a package document an item
 * embeds runs in the same sandbox. It reads the file under the key `openPackage` judged it by, and
 * never through a link out of the package's root.
 *
 * The route returns the frame's {@link Page} for every HTML answer, so the playground's handler
 * writes it with the stylesheets, the theme box and the page headers, and a `Response` only for a
 * file. Every page is built through `h`, so a package's names and titles are escaped.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 *
 * @module
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { Effect, Option, Result, Schema } from "effect";
import type { Config } from "effect";
import { assetHeaders, assetTypes, page, servedFilePath } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import { keptOnSuccess } from "#plate/dev/listing.ts";
import { corpusRoot } from "#plate/document/corpus.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { openPackage } from "#plate/package/open.ts";
import type { PackageResource, PackageTest, PackageVerdict } from "#plate/package/open.ts";
import { packageFiles } from "#plate/package/store.ts";
import { describeRefusal } from "#plate/validate/verdict.ts";

/**
 * Where one package's files are, and how the playground's routes name it.
 */
export interface PackageSource {
  /**
   * The package's one path segment in the routes, `/packages/<id>`: its directory's name without
   * `.zip.d`, or its whole location when another package's directory has the same name (see
   * {@link packageIds}).
   */
  readonly id: string;
  /**
   * The location `openPackage` names it by, which every verdict and accepted document in it
   * carries: its directory's path under the corpus root, or `fixtures/m2` for the fixture package.
   */
  readonly location: string;
  /**
   * The directory that holds its files.
   */
  readonly root: string;
}

/**
 * One package with the verdict `openPackage` gave it.
 */
export interface PackageEntry extends PackageSource {
  readonly verdict: PackageVerdict;
}

/**
 * The failure of a read of the packages: the corpus root cannot be listed, or a package's
 * directory or one of its files cannot be listed or read.
 *
 * `path` is the directory or file, and `detail` says why and what to change.
 */
export class PackageUnreadable extends Schema.TaggedError<PackageUnreadable>()(
  "PackageUnreadable",
  { detail: Schema.String, path: Schema.String },
) {
  /**
   * The path and why it cannot be read, in one line.
   */
  override get message(): string {
    return `cannot read ${this.path}: ${this.detail}`;
  }
}

/**
 * The failure of a package route: the packages cannot be read, or neither `PLATE_CORPUS_DIR` nor
 * `HOME` is set.
 */
export type PackagesFailure = Config.ConfigError | PackageUnreadable;

/**
 * Read and judge one package, giving its verdict.
 */
export type PackageOpener = (
  source: PackageSource,
) => Effect.Effect<PackageVerdict, PackagesFailure>;

/**
 * The packages and their verdicts, each package opened at most once while its open succeeds.
 *
 * The packages are found the first time something asks, and each is opened the first time its
 * verdict is asked for. The map behind it is keyed by the ids of the packages found, so what it
 * keeps is bounded by the corpus and the fixture; a failed open is not kept, so the next request
 * opens that package again. Concurrent requests share an open in flight.
 */
export interface PackageCache {
  /**
   * One package with its verdict, opening that package alone the first time it is asked for; none
   * when no package has the id.
   *
   * @param id The id a request names, its percent escapes decoded.
   */
  readonly packageOf: (id: string) => Effect.Effect<Option.Option<PackageEntry>, PackagesFailure>;
  /**
   * Every package with its verdict, the corpus's in the order of their locations and then the
   * fixture, opening each package not opened yet, at most 8 at once.
   */
  readonly packages: Effect.Effect<readonly PackageEntry[], PackagesFailure>;
}

/**
 * The suffix of the directory a corpus zip is extracted into, `X.zip.d/` beside `X.zip`: such a
 * directory is a package.
 */
export const packageSuffix = ".zip.d";

/**
 * The fixture package's location, as the playground names it.
 */
const fixtureLocation = "fixtures/m2";

/**
 * The fixture package's directory, `fixtures/m2/` in this package's source.
 */
const fixtureRoot = path.resolve(import.meta.dirname, "..", "..", "fixtures", "m2");

/**
 * The name of the field each Start button of a package's page posts: the test's path from the
 * package's root, the test document's `href` in the manifest.
 */
export const testField = "test";

/**
 * Give the message of a failed file-system call.
 *
 * @param cause What the call rejected with.
 * @returns Its message, or the value as text.
 */
const causeText = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

/**
 * Give the ids of packages by their locations, in the same order.
 *
 * A package's id is the last segment of its location without `.zip.d`, the name its zip had, so a
 * corpus package reads as `BegGuide_March2025` and the fixture as `m2`. Two packages whose
 * directories share that name, such as the corpus's two `items.zip.d`, each take their whole
 * location instead, so no id names two packages and the id never depends on the order packages are
 * found in.
 *
 * @param locations Each package's location, every one distinct.
 * @returns Each package's id.
 */
export const packageIds = (locations: readonly string[]): readonly string[] => {
  const names = locations.map((location) => {
    const name = path.posix.basename(location);

    return name.endsWith(packageSuffix) ? name.slice(0, -packageSuffix.length) : name;
  });
  const counts = new Map<string, number>();
  for (const name of names) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return names.map((name, index) =>
    name === "" || (counts.get(name) ?? 0) > 1 ? (locations[index] ?? name) : name,
  );
};

/**
 * One entry a walk of a directory meets: a real file or a real directory.
 */
interface WalkEntry {
  /**
   * Whether it is a directory; a file when not.
   */
  readonly directory: boolean;
  /**
   * Its POSIX path from the walk's root.
   */
  readonly path: string;
}

/**
 * List the files and directories under a directory, at any depth, by their POSIX paths from it.
 *
 * Symbolic links are not followed: the walk reads one directory at a time and descends only into
 * real directories, so a link, to a file or to a directory, is never an entry, and nothing outside
 * the directory is listed through one. Node's recursive `readdir` descends into a linked
 * directory, which is why the walk does not use it.
 *
 * @param root The directory.
 * @param fix What to change when it cannot be listed.
 * @returns Each entry, a directory before what it holds, in the order the walk meets them.
 */
const walkUnder = (
  root: string,
  fix: string,
): Effect.Effect<readonly WalkEntry[], PackageUnreadable> => {
  /**
   * List the entries under one directory of the walk.
   *
   * @param relative The directory's POSIX path from the root, empty for the root itself.
   * @returns Each entry under it, by its path from the root.
   */
  const walk = (relative: string): Effect.Effect<readonly WalkEntry[], PackageUnreadable> => {
    const directory = path.join(root, relative);

    return Effect.tryPromise({
      catch: (cause) =>
        new PackageUnreadable({ detail: `${causeText(cause)}; ${fix}`, path: directory }),
      try: () => readdir(directory, { withFileTypes: true }),
    }).pipe(
      Effect.flatMap((entries) =>
        Effect.all(
          entries.map((entry) => {
            const child = relative === "" ? entry.name : `${relative}/${entry.name}`;

            return entry.isDirectory()
              ? walk(child).pipe(
                  Effect.map((under) => [{ directory: true, path: child }, ...under]),
                )
              : Effect.succeed(entry.isFile() ? [{ directory: false, path: child }] : []);
          }),
        ),
      ),
      Effect.map((lists) => lists.flat()),
    );
  };

  return walk("");
};

/**
 * List the files of a directory, at any depth, by their POSIX paths from it, through
 * {@link walkUnder}, so no link is followed and no link is a file.
 *
 * @param root The directory.
 * @param fix What to change when it cannot be listed.
 * @returns Each file's path from the directory, sorted.
 */
const filesUnder = (
  root: string,
  fix: string,
): Effect.Effect<readonly string[], PackageUnreadable> =>
  walkUnder(root, fix).pipe(
    Effect.map((entries) =>
      entries
        .filter((entry) => !entry.directory)
        .map((entry) => entry.path)
        .toSorted(),
    ),
  );

/**
 * Construct the failure of a file-system call on a path in a package's directory.
 *
 * @param source The package.
 * @param full The path the call was given.
 * @returns A function from the call's rejection to the failure.
 */
const unreadable =
  (source: PackageSource, full: string) =>
  (cause: unknown): PackageUnreadable =>
    new PackageUnreadable({
      detail: `${causeText(cause)}; restore the package's directory ${source.root}`,
      path: full,
    });

/**
 * Read one file of a package.
 *
 * @param source The package.
 * @param file The file's path from the package's root, a path it lists or holds.
 * @returns The file's bytes.
 */
const readPackageFile = (
  source: PackageSource,
  file: string,
): Effect.Effect<Uint8Array, PackageUnreadable> => {
  const full = path.join(source.root, file);

  return Effect.tryPromise({ catch: unreadable(source, full), try: () => readFile(full) });
};

/**
 * Give the real path of a path in a package's directory, every link on the way resolved.
 *
 * @param source The package.
 * @param full The path.
 * @returns Its real path.
 */
const realPathOf = (
  source: PackageSource,
  full: string,
): Effect.Effect<string, PackageUnreadable> =>
  Effect.tryPromise({ catch: unreadable(source, full), try: () => realpath(full) });

/**
 * Find the key a package's directory holds a file under: the path from its root, as the directory
 * walk finds it, that `openPackage` kept for the file's normal form.
 *
 * {@link openDirectory} gives `openPackage` the walk's paths in the walk's order, and
 * `packageFiles` keeps, of two keys with one normal form, the first, so the same walk through
 * `packageFiles` gives the key whose bytes were judged. A walk that finds a key `packageFiles`
 * refuses, such as a file named `foo\secret.png` (reading 138), gives no key, so no file of that
 * package is read, and never one through a link `foo`.
 *
 * @param source The package.
 * @param file The file's path in normal form.
 * @returns The key, none when the directory holds no file of that normal form now.
 */
const heldKey = (
  source: PackageSource,
  file: string,
): Effect.Effect<Option.Option<string>, PackageUnreadable> =>
  filesUnder(source.root, `restore the package's directory ${source.root}`).pipe(
    Effect.map((paths) =>
      Result.match(packageFiles(new Map(paths.map((key) => [key, key])), source.location), {
        onFailure: () => Option.none(),
        onSuccess: (held) => Option.fromUndefinedOr(held.get(file)),
      }),
    ),
  );

/**
 * Read a file of a package by its key, only when its real path lies inside the package's real
 * root, so a link swapped in after the walk never reaches a file outside it.
 *
 * @param source The package.
 * @param key The file's key, as the directory walk found it.
 * @returns The file's bytes, none when its real path is outside the root.
 */
const readInside = Effect.fnUntraced(function* readInside(
  source: PackageSource,
  key: string,
): Effect.fn.Return<Option.Option<Uint8Array>, PackageUnreadable> {
  const root = yield* realPathOf(source, source.root);
  const full = yield* realPathOf(source, path.join(source.root, key));
  if (!full.startsWith(`${root}${path.sep}`)) {
    return Option.none();
  }

  return Option.some(
    yield* Effect.tryPromise({ catch: unreadable(source, full), try: () => readFile(full) }),
  );
});

/**
 * Open one package from its directory: read every file under it, at most 8 at once, keyed by its
 * path from the package's root as a host keys an unzipped package's files, and judge them with
 * `openPackage`.
 *
 * @param source The package.
 * @returns Its verdict.
 */
export const openDirectory: PackageOpener = Effect.fn("packages.openDirectory")(
  function* openDirectory(
    source: PackageSource,
  ): Effect.fn.Return<PackageVerdict, PackagesFailure> {
    const paths = yield* filesUnder(source.root, `restore the package's directory ${source.root}`);
    const files = yield* Effect.forEach(
      paths,
      (file) => Effect.map(readPackageFile(source, file), (bytes) => [file, bytes] as const),
      { concurrency: 8 },
    );

    return yield* openPackage(source.location, new Map(files));
  },
);

/**
 * Find the packages: every `*.zip.d` directory under the corpus root, at any depth, in the order of
 * their locations, then the fixture package, each with its id.
 *
 * The corpus is walked through {@link walkUnder}, so a `*.zip.d` reached only through a link, a
 * linked directory or a link inside a package, is not a package.
 *
 * Fails with {@link PackageUnreadable} when a directory under the corpus root cannot be listed, and
 * a `ConfigError` when neither `PLATE_CORPUS_DIR` nor `HOME` is set.
 */
const packageSources: Effect.Effect<readonly PackageSource[], PackagesFailure> = Effect.gen(
  function* packageSources() {
    const corpus = yield* corpusRoot;
    const entries = yield* walkUnder(
      corpus,
      "extract the 1EdTech QTI 3 examples once under ~/.cache/gr8des/qti3-examples, each nested zip into the X.zip.d/ folder beside it, or set PLATE_CORPUS_DIR to the directory that holds them",
    );
    const corpusLocations = entries
      .filter((entry) => entry.directory && entry.path.endsWith(packageSuffix))
      .map((entry) => entry.path)
      .toSorted();
    const locations = [...corpusLocations, fixtureLocation];
    const ids = packageIds(locations);

    return locations.map((location, index) => ({
      id: ids[index] ?? location,
      location,
      root: location === fixtureLocation ? fixtureRoot : path.join(corpus, location),
    }));
  },
).pipe(Effect.withSpan("packages.packageSources"));

/**
 * Construct a package cache over the corpus root and the fixture package.
 *
 * The packages are found the first time a verdict is asked for, and each is opened through the
 * opener the first time its verdict is asked for. The opener is called only then, once per package
 * while its opens succeed, so a test can count the opens through it. The playground builds one
 * cache per handler, which `scripts/serve.ts` builds once per process.
 *
 * @param opener How a package is opened; {@link openDirectory} when absent.
 * @returns The cache.
 */
export const packageCache = (opener: PackageOpener = openDirectory): Effect.Effect<PackageCache> =>
  packageSources.pipe(
    Effect.flatMap((sources) =>
      Effect.all(
        sources.map((source) =>
          keptOnSuccess(Effect.suspend(() => opener(source))).pipe(
            Effect.map(
              (opened) =>
                [
                  source.id,
                  opened.pipe(Effect.map((verdict): PackageEntry => ({ ...source, verdict }))),
                ] as const,
            ),
          ),
        ),
      ),
    ),
    Effect.map((entries) => new Map(entries)),
    keptOnSuccess,
    Effect.map((table): PackageCache => ({
      packageOf: (id) =>
        table.pipe(
          Effect.flatMap((packages) => {
            const entry = packages.get(id);

            return entry === undefined ? Effect.succeedNone : Effect.asSome(entry);
          }),
        ),
      packages: table.pipe(
        Effect.flatMap((packages) => Effect.all([...packages.values()], { concurrency: 8 })),
      ),
    })),
  );

/**
 * Find the package at a location among the playground's packages, opening only the package whose
 * id that location gives.
 *
 * A package's id is its directory's name without `.zip.d`, or its whole location when another
 * package shares that name ({@link packageIds}), so the package is one of the two ids tried, and
 * the one whose location matches.
 *
 * @param packages The packages.
 * @param location The package's location, as `openPackage` names it.
 * @returns The package, or none when no package is at the location.
 */
export const packageAt = Effect.fnUntraced(function* packageAt(
  packages: PackageCache,
  location: string,
): Effect.fn.Return<Option.Option<PackageEntry>, PackagesFailure> {
  for (const id of new Set([...packageIds([location]), location])) {
    const found = yield* packages.packageOf(id);
    if (Option.isSome(found) && found.value.location === location) {
      return found;
    }
  }

  return Option.none();
});

/**
 * Give the test at a path in a package.
 *
 * @param entry The package.
 * @param href The test's path from the package's root.
 * @returns The test with its items, or none when the package is not accepted or holds no test
 *   there.
 */
export const testIn = (entry: PackageEntry, href: string): Option.Option<PackageTest> => {
  const { verdict } = entry;

  return verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? Option.fromUndefinedOr(verdict.accepted.tests.get(`${entry.location}/${href}`))
    : Option.none();
};

/**
 * Give the path of a package's page, its id percent-encoded as one segment.
 *
 * @param id The package's id.
 * @returns `/packages/<id>`.
 */
export const packageHref = (id: string): string => `/packages/${encodeURIComponent(id)}`;

/**
 * Give the asset base of a document in a package: its directory under the package's files route,
 * each segment percent-encoded, with its closing `/`, the base `render` rebases the document's
 * package paths onto so they reach this route.
 *
 * @param id The package's id.
 * @param document The document's path from the package's root.
 * @returns `/packages/<id>/files/<directory>/`, or `/packages/<id>/files/` for a document at the
 *   root.
 */
export const packageAssetBase = (id: string, document: string): string => {
  const directory = path.posix.dirname(document);

  return directory === "."
    ? `${packageHref(id)}/files/`
    : `${packageHref(id)}/files/${directory.split("/").map(encodeURIComponent).join("/")}/`;
};

/**
 * The links at the end of every package page: the package listing, then the corpus listing.
 */
const back: Element = h("p", {}, [
  h("a", { href: "/packages" }, [text("All packages")]),
  text(" · "),
  h("a", { href: "/" }, [text("All documents")]),
]);

/**
 * Construct a page that says one thing: a 404 or a refused method.
 *
 * @param status The status code.
 * @param title The page's title and heading.
 * @param said What the page says.
 * @param headers The headers the page carries besides the page headers, such as a 405's `Allow`.
 * @returns The page.
 */
const notePage = (
  status: number,
  title: string,
  said: string,
  headers: Readonly<Record<string, string>> = {},
): Page =>
  page(
    status,
    "en",
    title,
    [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), back],
    [],
    headers,
  );

/**
 * Construct the 404 page every refused package path answers with, a traversal included.
 *
 * @returns The 404 page.
 */
const notFound = (): Page =>
  notePage(404, "Not found", "No package or package file is at this address.");

/**
 * Construct the package listing: a table of every package, its id as the row header and a link to
 * its page, then its location and its verdict.
 *
 * @param entries Every package with its verdict.
 * @returns The page.
 */
const listing = (entries: readonly PackageEntry[]): Page =>
  page(200, "en", "Packages", [
    h("h1", {}, [text("Packages")]),
    h("p", {}, [
      text(
        "Every content package of the example corpus, each an extracted zip under the corpus root, then the M2 fixture package, with the verdict openPackage gives it. Open a package to see its resources and start its tests.",
      ),
    ]),
    h("table", {}, [
      h("thead", {}, [
        h("tr", {}, [
          h("th", { scope: "col" }, [text("Package")]),
          h("th", { scope: "col" }, [text("Location")]),
          h("th", { scope: "col" }, [text("Verdict")]),
        ]),
      ]),
      h(
        "tbody",
        {},
        entries.map(({ id, location, verdict }) =>
          h("tr", { "data-verdict": verdict.verdict }, [
            h("th", { scope: "row" }, [h("a", { href: packageHref(id) }, [text(id)])]),
            h("td", {}, [h("code", {}, [text(location)])]),
            h("td", {}, [text(verdict.verdict)]),
          ]),
        ),
      ),
    ]),
    h("p", {}, [h("a", { href: "/" }, [text("All documents")])]),
  ]);

/**
 * Construct one resource of a package's tree: its identifier and declared type, then its document's
 * path and the verdict on it.
 *
 * @param resource The resource.
 * @returns The list item.
 */
const resourceItem = (resource: PackageResource): Element =>
  h(
    "li",
    Option.match(resource.verdict, {
      onNone: () => ({}),
      onSome: (verdict) => ({ "data-verdict": verdict.verdict }),
    }),
    [
      h("code", {}, [text(resource.identifier)]),
      text(`, ${resource.type}`),
      h("ul", {}, [
        h("li", {}, [
          Option.match(resource.path, {
            onNone: () => text("No document in the package"),
            onSome: (document) => h("code", {}, [text(document)]),
          }),
        ]),
        h("li", {}, [
          text(
            Option.match(resource.verdict, {
              onNone: () => "Not judged",
              onSome: (verdict) => `${verdict.verdict}, ${verdict.kind}`,
            }),
          ),
        ]),
      ]),
    ],
  );

/**
 * Construct the tests part of a package's page: for an accepted package, the playground's native
 * form posting to `/packages/<id>/tests`, with one Start button per test whose value is the test's
 * path; otherwise the sentence that says why no test starts.
 *
 * @param entry The package.
 * @returns The part's nodes.
 */
const testsPart = (entry: PackageEntry): readonly Node[] => {
  const { verdict } = entry;
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return [h("p", {}, [text(`No test starts: the package is ${verdict.verdict}.`)])];
  }

  const prefix = `${entry.location}/`;
  const tests = [...verdict.accepted.tests].map(([location, test]) => ({
    path: location.startsWith(prefix) ? location.slice(prefix.length) : location,
    title: test.test.test.title,
  }));
  if (tests.length === 0) {
    return [h("p", {}, [text("No test starts: the package holds no test.")])];
  }

  return [
    h("form", { action: `${packageHref(entry.id)}/tests`, method: "post" }, [
      h(
        "ul",
        {},
        tests.map((test) =>
          h("li", {}, [
            h("code", {}, [text(test.path)]),
            text(" "),
            h("button", { name: testField, type: "submit", value: test.path }, [
              text(`Start: ${test.title}`),
            ]),
          ]),
        ),
      ),
    ]),
  ];
};

/**
 * Construct a package's page: its location and verdict, every refusal that refuses it, its
 * resources in the manifest's order with the verdict on each document, and its tests.
 *
 * @param entry The package.
 * @returns The page.
 */
const packagePage = (entry: PackageEntry): Page => {
  const { verdict } = entry;
  const accepting =
    verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported";

  return page(200, "en", `Package: ${entry.id}`, [
    h("h1", {}, [text(entry.id)]),
    h("p", {}, [
      text("Location "),
      h("code", {}, [text(entry.location)]),
      text(
        accepting
          ? `, ${verdict.verdict}, content packaging ${verdict.accepted.version}.`
          : `, ${verdict.verdict}.`,
      ),
    ]),
    ...(verdict.verdict === "refused"
      ? [
          h("h2", {}, [text("Refusals")]),
          h(
            "ul",
            {},
            verdict.refusals.map((refusal) =>
              h("li", { "data-rule": refusal.rule }, [text(describeRefusal(refusal))]),
            ),
          ),
        ]
      : []),
    h("h2", {}, [text("Resources")]),
    verdict.resources.length === 0
      ? h("p", {}, [text("The manifest is not read, so no resource is listed.")])
      : h("ul", {}, verdict.resources.map(resourceItem)),
    h("h2", {}, [text("Tests")]),
    ...testsPart(entry),
    back,
  ]);
};

/**
 * Serve one file of a package: only a file in the accepted package's `files`, of a type the route
 * serves, read under the key `openPackage` judged it by and from inside the package's real root,
 * with the asset headers and its type.
 *
 * @param entry The package.
 * @param file The file's path from the package's root, already decoded by {@link servedFilePath}.
 * @returns The file's response, or the 404 page.
 */
const serveFile = Effect.fnUntraced(function* serveFile(
  entry: PackageEntry,
  file: string,
): Effect.fn.Return<Page | Response, PackageUnreadable> {
  const { verdict } = entry;
  const type = assetTypes.get(path.posix.extname(file).toLowerCase());
  if (
    (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") ||
    !verdict.accepted.files.has(file) ||
    type === undefined
  ) {
    return notFound();
  }

  const key = yield* heldKey(entry, file);
  if (Option.isNone(key)) {
    return notFound();
  }

  return Option.match(yield* readInside(entry, key.value), {
    onNone: notFound,
    onSome: (bytes) =>
      new Response(new Uint8Array(bytes), { headers: { ...assetHeaders, "content-type": type } }),
  });
});

/**
 * Route one request under `/packages`: the listing at `/packages`, a package's page at
 * `/packages/<id>`, and a package's file at `/packages/<id>/files/<path>`, each for GET; another
 * method there is a 405 whose `Allow` names GET, and any other path, an unknown id, an id or a
 * path that does not decode, a path that climbs, a file not in the accepted package's `files` and a
 * file whose real path leaves the package's root are 404s.
 *
 * `POST /packages/<id>/tests`, which a package page's Start buttons post to, is not this route's;
 * the playground routes it to its session pages first.
 *
 * @example
 *   const cache = Effect.runSync(packageCache());
 *   const outcome = await Effect.runPromise(
 *     routePackages(cache, new Request("http://127.0.0.1:5190/packages")),
 *   );
 *   // the listing's page, which the playground writes with its frame
 *
 * @param cache The packages.
 * @param request The request.
 * @returns The page to answer with, or a file's response.
 */
export const routePackages = (
  cache: PackageCache,
  request: Request,
): Effect.Effect<Page | Response, PackagesFailure> => {
  const { pathname } = new URL(request.url);
  const [root, base, id, files, ...rest] = pathname.split("/");
  const known =
    root === "" &&
    base === "packages" &&
    (id === undefined ||
      (id !== "" && (files === undefined || (files === "files" && rest.length > 0))));
  if (!known) {
    return Effect.succeed(notFound());
  }

  if (request.method !== "GET") {
    return Effect.succeed(
      notePage(405, "Method not allowed", `${request.method} is not taken at ${pathname}.`, {
        allow: "GET",
      }),
    );
  }

  if (id === undefined) {
    return cache.packages.pipe(Effect.map(listing));
  }

  const decoded = Result.try(() => decodeURIComponent(id));
  if (Result.isFailure(decoded)) {
    return Effect.succeed(notFound());
  }

  return cache.packageOf(decoded.success).pipe(
    Effect.flatMap((entry): Effect.Effect<Page | Response, PackagesFailure> =>
      Option.match(entry, {
        onNone: () => Effect.succeed(notFound()),
        onSome: (found) =>
          files === undefined
            ? Effect.succeed(packagePage(found))
            : Option.match(servedFilePath(rest), {
                onNone: () => Effect.succeed(notFound()),
                onSome: (file) => serveFile(found, file),
              }),
      }),
    ),
  );
};
