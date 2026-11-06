/**
 * The dev playground's packages: the package listing at `/packages`, each package's page at
 * `/packages/<id>`, and its files at `/packages/<id>/files/<path>` (spec P4-24, §4.3).
 *
 * The packages are every `*.zip.d` directory under the corpus root, the zips of the example corpus
 * as phase 1's extraction unpacked them, then the repository's M2 fixture package, `fixtures/m2/`.
 * Each is read whole and judged by `openPackage` the first time something asks for it, and its
 * verdict is kept for the cache's life. A package's page lists its resources with the verdict on
 * each document and, when the package is accepted, a native form with one Start button per test;
 * the form posts to `/packages/<id>/tests`, which the playground's session pages take. The files
 * route serves only a file an accepted package lists, of a type `/assets/*` also serves, with the
 * same asset headers, so a package document an item embeds runs in the same sandbox.
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
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Duration, Effect, Exit, Option, Result, Schema } from "effect";
import type { Config } from "effect";
import { assetHeaders, page } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import { corpusRoot } from "#plate/document/corpus.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { openPackage } from "#plate/package/open.ts";
import type { PackageResource, PackageVerdict } from "#plate/package/open.ts";
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
   * fixture, opening each package not opened yet.
   */
  readonly packages: Effect.Effect<readonly PackageEntry[], PackagesFailure>;
}

/**
 * The suffix of a directory phase 1's extraction unpacked a zip into.
 */
const packageSuffix = ".zip.d";

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
 * The media types the files route serves, by lower-case extension; any other file is refused.
 *
 * It is the table `/assets/*` serves by (`assetTypes` in `#plate/dev/page.ts`): what an item body
 * embeds, images, audio, video, text tracks, stylesheets and HTML package documents. XML is absent
 * on purpose, because an item document holds its correct responses and mappings, which redaction
 * keeps off the page.
 */
const fileTypes: ReadonlyMap<string, string> = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".htm", "text/html; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".m4a", "audio/mp4"],
  [".m4v", "video/mp4"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".oga", "audio/ogg"],
  [".ogg", "audio/ogg"],
  [".ogv", "video/ogg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".vtt", "text/vtt; charset=utf-8"],
  [".wav", "audio/wav"],
  [".webm", "video/webm"],
  [".webp", "image/webp"],
]);

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
 * List the files of a directory, at any depth, by their POSIX paths from it.
 *
 * Symbolic links are not followed, as the document set's listing does not follow them, so a link
 * is never a package file.
 *
 * @param root The directory.
 * @param fix What to change when it cannot be listed.
 * @returns Each file's path from the directory, sorted.
 */
const filesUnder = (
  root: string,
  fix: string,
): Effect.Effect<readonly string[], PackageUnreadable> =>
  Effect.tryPromise({
    catch: (cause) => new PackageUnreadable({ detail: `${causeText(cause)}; ${fix}`, path: root }),
    try: () => readdir(root, { recursive: true, withFileTypes: true }),
  }).pipe(
    Effect.map((entries) =>
      entries
        .filter((entry) => entry.isFile())
        .map((entry) =>
          path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
        )
        .toSorted(),
    ),
  );

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

  return Effect.tryPromise({
    catch: (cause) =>
      new PackageUnreadable({
        detail: `${causeText(cause)}; restore the package's directory ${source.root}`,
        path: full,
      }),
    try: () => readFile(full),
  });
};

/**
 * Open one package from its directory: read every file under it, keyed by its path from the
 * package's root as a host keys an unzipped package's files, and judge them with `openPackage`.
 *
 * @param source The package.
 * @returns Its verdict.
 */
export const openDirectory: PackageOpener = Effect.fn("packages.openDirectory")(
  function* openDirectory(
    source: PackageSource,
  ): Effect.fn.Return<PackageVerdict, PackagesFailure> {
    const paths = yield* filesUnder(source.root, `restore the package's directory ${source.root}`);
    const files = new Map<string, Uint8Array>();
    for (const file of paths) {
      files.set(file, yield* readPackageFile(source, file));
    }

    return yield* openPackage(source.location, files);
  },
);

/**
 * Find the packages: every `*.zip.d` directory under the corpus root, at any depth, in the order of
 * their locations, then the fixture package, each with its id.
 *
 * Fails with {@link PackageUnreadable} when the corpus root cannot be listed, and a `ConfigError`
 * when neither `PLATE_CORPUS_DIR` nor `HOME` is set.
 */
const packageSources: Effect.Effect<readonly PackageSource[], PackagesFailure> = Effect.gen(
  function* packageSources() {
    const corpus = yield* corpusRoot;
    const entries = yield* Effect.tryPromise({
      catch: (cause) =>
        new PackageUnreadable({
          detail: `${causeText(cause)}; extract the 1EdTech QTI 3 examples once (phase 1 spec §10.2), or set PLATE_CORPUS_DIR to the directory that holds them`,
          path: corpus,
        }),
      try: () => readdir(corpus, { recursive: true, withFileTypes: true }),
    });
    const corpusLocations = entries
      .filter((entry) => entry.isDirectory() && entry.name.endsWith(packageSuffix))
      .map((entry) =>
        path.relative(corpus, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
      )
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
 * Keep an effect's result for the cache's life when it succeeds, and none of a failure.
 *
 * @param effect The effect.
 * @returns The effect that runs it once while it succeeds.
 */
const keptOnSuccess = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<Effect.Effect<A, E>> =>
  Effect.cachedWithTTL(effect, (exit) => (Exit.isSuccess(exit) ? Duration.infinity : 0));

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
      packages: table.pipe(Effect.flatMap((packages) => Effect.all([...packages.values()]))),
    })),
  );

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
 * @returns The page.
 */
const notePage = (status: number, title: string, said: string): Page =>
  page(status, "en", title, [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), back]);

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
 * Check the segments of a file's path, each decoded on its own: none is empty, `.` or `..`, and
 * none holds a separator, a backslash or NUL, so the path names exactly the directories the request
 * names and cannot climb out of the package's root.
 *
 * @param segments The request path's segments after `files`, still percent-encoded.
 * @returns The file's path from the package's root, or none when a segment does not decode or is
 *   refused.
 */
const filePath = (segments: readonly string[]): Option.Option<string> =>
  Result.match(
    Result.all(segments.map((segment) => Result.try(() => decodeURIComponent(segment)))),
    {
      onFailure: () => Option.none(),
      onSuccess: (decoded) =>
        decoded.length > 0 &&
        decoded.every(
          (segment) =>
            segment !== "" &&
            segment !== "." &&
            segment !== ".." &&
            !segment.includes("/") &&
            !segment.includes("\\") &&
            !segment.includes("\0"),
        )
          ? Option.some(decoded.join("/"))
          : Option.none(),
    },
  );

/**
 * Serve one file of a package: only a file the accepted package lists, of a type the route serves,
 * with the asset headers and its type.
 *
 * @param entry The package.
 * @param file The file's path from the package's root, already checked by {@link filePath}.
 * @returns The file's response, or the 404 page.
 */
const serveFile = (
  entry: PackageEntry,
  file: string,
): Effect.Effect<Page | Response, PackageUnreadable> => {
  const { verdict } = entry;
  const type = fileTypes.get(path.posix.extname(file).toLowerCase());
  if (
    (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") ||
    !verdict.accepted.files.has(file) ||
    type === undefined
  ) {
    return Effect.succeed(notFound());
  }

  return readPackageFile(entry, file).pipe(
    Effect.map(
      (bytes) =>
        new Response(new Uint8Array(bytes), { headers: { ...assetHeaders, "content-type": type } }),
    ),
  );
};

/**
 * Route one request under `/packages`: the listing at `/packages`, a package's page at
 * `/packages/<id>`, and a package's file at `/packages/<id>/files/<path>`, each for GET; another
 * method there is a 405, and any other path, an unknown id, an id or a path that does not decode, a
 * path that climbs and a file the package does not list are 404s.
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
      notePage(405, "Method not allowed", `${request.method} is not taken at ${pathname}.`),
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
            : Option.match(filePath(rest), {
                onNone: () => Effect.succeed(notFound()),
                onSome: (file) => serveFile(found, file),
              }),
      }),
    ),
  );
};
