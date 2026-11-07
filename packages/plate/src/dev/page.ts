/**
 * The dev playground: an example host, composed from plate's parts and pure functions the way an
 * author would compose them, behind one Fetch handler.
 *
 * The library decides no form, submit control, flow or attempt limit (rule `a9d04969`), so this
 * module owns them all: it lists every member of the corpus's document set under the verdict
 * `open` gives it, reports those verdicts as a table at `/verdicts` and the feature ledger the one
 * command last wrote at `/ledger`, opens any member through the verdict cache of
 * `#plate/dev/listing.ts`, begins each sitting's record with `begin` under the playground's seed
 * (one `begin` draws when it is built with none), keeps the `Accepted` item and the stored record
 * in its store on the server, and sends only the HTML of `render(redact(…))`, redacted with that
 * record, inside its own native form. A post is partitioned and decoded on the server, checked
 * with `checkResponses` and scored with `score`, both against the stored record, and answered with
 * the page after a submit: the Status part first, one `autofocus`, and a title that names the
 * state. Every page is built through `h` and `toHtml`, so document text is escaped, and
 * every response carries the content-security headers of rule `723e580c`. It also serves plate's
 * stylesheet, its own sheet and the host CSS of the theme its theme box last accepted, which it
 * keeps with a dark flag in memory until it restarts. Every page links the three sheets, carries
 * `class="dark"` on `html` while the flag is on, and ends with the theme box, the playground's own
 * form beside the item's. It reads the corpus through `readCorpusFile` and the ledger from
 * `PLATE_LEDGER_DIR`, and opens no port: `scripts/serve.ts` is the listener.
 *
 * The item form's action names the Status region as its fragment, so the page after a submit opens
 * at the result.
 *
 * It also serves M2's routes, each composed in its own module: the packages at `/packages`
 * (`#plate/dev/packages.ts`), the test sessions under `/sessions` and their Start posts
 * (`#plate/dev/test-page.ts`), a session's review, solution and results
 * (`#plate/dev/review-page.ts`), and the plain-HTML host (`#plate/hosts/html.ts`) around BG007 at
 * `/hosts/html`, its prefix stripped. One store holds the test sessions; the index links the
 * packages and resumes each session still in progress.
 *
 * @module
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Config, ConfigProvider, Effect, Option, Ref, Result, Schema } from "effect";
import { decodeSession } from "#plate/codec/session.ts";
import { decodeStoredFloat } from "#plate/codec/values.ts";
import {
  assetHeaders,
  assetTypes,
  page,
  pageHeaders,
  pageHtml,
  servedFilePath,
  slot,
} from "#plate/dev/frame.ts";
import type { Appearance, Page } from "#plate/dev/frame.ts";
import { groupVerdicts, keptOnSuccess, verdictCache } from "#plate/dev/listing.ts";
import type { OpenFailure, VerdictCache, VerdictGroup } from "#plate/dev/listing.ts";
import {
  packageAt,
  packageCache,
  packageHref,
  packageSuffix,
  routePackages,
  testIn,
} from "#plate/dev/packages.ts";
import type { PackageCache, PackagesFailure } from "#plate/dev/packages.ts";
import { entriesOf, postOf, valuesOf } from "#plate/dev/post.ts";
import { reviewPath, routeReview } from "#plate/dev/review-page.ts";
import type { ReviewPlayground } from "#plate/dev/review-page.ts";
import { sessionHref } from "#plate/dev/sitting.ts";
import { boundedStore, sessionStore } from "#plate/dev/store.ts";
import type { SessionEntry, SessionStore, Store } from "#plate/dev/store.ts";
import { routeSessions, sessionPath } from "#plate/dev/test-page.ts";
import type { SessionPlayground } from "#plate/dev/test-page.ts";
import { emptyTheme, parseTheme, themeCss } from "#plate/dev/theme.ts";
import type { ThemeRefused } from "#plate/dev/theme.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { text } from "#plate/emit/node.ts";
import { scopedId } from "#plate/emit/parts.ts";
import {
  begin,
  checkResponses,
  configure,
  h,
  redact,
  render,
  renderStatus,
  ResponsesRefused,
  restore,
  score,
} from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  Element,
  InvalidConfiguration,
  Options,
  StatusInput,
  StoredRecord,
  ValidationMessage,
  Value,
} from "#plate/index.ts";
import { htmlHost } from "#plate/hosts/html.ts";
import type { HtmlHost } from "#plate/hosts/html.ts";
import { ledgerDirectory } from "#plate/ledger/directory.ts";
import { Ledger } from "#plate/ledger/report.ts";
import { ledgerHtml, verdictTable } from "#plate/ledger/view.ts";
import { message, numeral } from "#plate/messages.ts";
import type { PackageTest } from "#plate/package/open.ts";
import { current } from "#plate/session/start.ts";
import { acceptedItem, describeRefusal } from "#plate/validate/verdict.ts";
import type { AcceptedKind, Verdict } from "#plate/validate/verdict.ts";

/**
 * A Fetch handler: one request in, one response out.
 */
export type Handler = (request: Request) => Promise<Response>;

/**
 * The settings of one playground, each optional.
 *
 * `configuration` is the input `configure` decodes, every default when absent; `seed` is the seed
 * every sitting's record begins under, given to `begin` as it is, and when absent `begin` draws one
 * for each sitting (a fixed seed is guessable, so it is for tests); `newInstance` draws the
 * instance token of each item the playground opens, a random UUID when absent, and must give a new
 * token each call, since the playground holds each open item under its token (a test gives a fixed
 * one so a sitting's values follow from its seed alone); `provider` is where `readCorpusFile` reads
 * `PLATE_CORPUS_DIR` and `HOME` and the ledger page reads `PLATE_LEDGER_DIR`, the process
 * environment when absent; `verdicts` is the cache that opens and keeps the corpus's members, a new
 * one over `openMember` when absent; `packages` is the cache that opens and keeps the packages, a
 * new one over `openDirectory` when absent. Handlers given one cache share its opens, and a test
 * counts them through the cache's opener; a cache reads the corpus root of the first handler that
 * asks, so share one only between handlers over the same root.
 */
export interface PlaygroundSettings {
  readonly configuration?: Partial<Configuration>;
  readonly newInstance?: () => string;
  readonly packages?: PackageCache;
  readonly provider?: ConfigProvider.ConfigProvider;
  readonly seed?: string;
  readonly verdicts?: VerdictCache;
}

/**
 * The item the plain-HTML host serves at {@link hostMount}: BG007, read from the corpus cache,
 * never from a committed copy (rule `3ad87993`).
 */
const hostItem = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * The path the plain-HTML host is mounted at; the host sees each request's path with it stripped.
 */
const hostMount = "/hosts/html";

/**
 * The id of the index's region of test sessions in progress.
 */
const inProgressId = "sessions-in-progress";

/**
 * The type of every stylesheet the playground serves.
 */
const cssType = "text/css; charset=utf-8";

/**
 * The package's stylesheets the playground serves, by request path: plate's default theme and the
 * playground's own sheet, each read from the package's source on every request.
 */
const sheets: ReadonlyMap<string, URL> = new Map([
  ["/playground.css", new URL(import.meta.resolve("#plate/dev/playground.css"))],
  ["/styles.css", new URL(import.meta.resolve("#plate/styles.css"))],
]);

/**
 * The command that writes the ledger, which the ledger page and its errors name.
 */
const ledgerCommand = "pnpm --filter @qti-pie/plate ledger";

/**
 * The file the ledger page reads: `ledger.json` in the folder the one command writes to,
 * {@link ledgerDirectory}.
 */
const ledgerFile = ledgerDirectory.pipe(
  Config.map((directory) => path.join(directory, "ledger.json")),
);

/**
 * Decode `ledger.json`'s text, as the one command encodes it.
 */
const decodeLedger = Schema.decodeEffect(Schema.fromJsonString(Ledger));

/**
 * The ledger page found no `ledger.json`: the one command has not written one there yet.
 */
class LedgerMissing extends Schema.TaggedError<LedgerMissing>()("LedgerMissing", {
  path: Schema.String,
}) {
  /**
   * The file and what to run.
   */
  override get message(): string {
    return `No ledger is written at ${this.path} yet. Run ${ledgerCommand} from the repository root, then reload the page.`;
  }
}

/**
 * The ledger page could not read `ledger.json`, or read one that does not decode as a ledger.
 */
class LedgerUnreadable extends Schema.TaggedError<LedgerUnreadable>()("LedgerUnreadable", {
  detail: Schema.String,
  path: Schema.String,
}) {
  /**
   * The file, why, and what to run.
   */
  override get message(): string {
    return `Cannot read the ledger ${this.path}: ${this.detail}. Run ${ledgerCommand} from the repository root to write it again, then reload the page.`;
  }
}

/**
 * The failure of a read of one of the package's stylesheets: the file is missing or unreadable.
 */
class SheetUnreadable extends Schema.TaggedError<SheetUnreadable>()("SheetUnreadable", {
  detail: Schema.String,
  path: Schema.String,
}) {
  /**
   * The file and what to change.
   */
  override get message(): string {
    return `Cannot read the stylesheet ${this.path}: ${this.detail}. Restore the file from the package's source.`;
  }
}

/**
 * What a page after a post shows, kept so a post past the attempt limit shows it again.
 */
interface Shown {
  readonly status: StatusInput & { readonly heading: "responseRecorded" | "scored" };
  readonly values: Readonly<Record<string, Value>>;
}

/**
 * One sitting of an opened item, held in the playground's store under its instance token: the
 * accepted document, the record `begin` started or the last `score` returned, in the form the host
 * stores, the scored attempts, and what the last scored page showed.
 */
interface Session {
  readonly accepted: Accepted;
  readonly attempts: number;
  readonly last: Option.Option<Shown>;
  readonly path: string;
  readonly record: StoredRecord;
}

/**
 * The failure of building the plain-HTML host: BG007 or the corpus cannot be read, or the host's
 * configuration does not decode.
 */
type HostFailure = Config.ConfigError | CorpusFileUnreadable | CorpusMissing | InvalidConfiguration;

/**
 * A playground's state and settings: its theme box's appearance, its open items' sittings, oldest
 * first, its configuration input, how it draws an opened item's instance token, the seed its
 * sittings begin under (none for one `begin` draws), the verdicts of the corpus's members, its
 * packages, its test sessions, and the plain-HTML host, built the first time it is asked for.
 */
interface Playground {
  readonly appearance: Ref.Ref<Appearance>;
  readonly configuration: Partial<Configuration>;
  readonly host: Effect.Effect<HtmlHost, HostFailure>;
  readonly newInstance: () => string;
  readonly packages: PackageCache;
  readonly seed: Option.Option<string>;
  readonly sessions: Store<Session>;
  readonly tests: SessionStore;
  readonly verdicts: VerdictCache;
}

/**
 * One session in progress as the index lists it: the link to its page and the link's text.
 */
interface Resume {
  readonly href: string;
  readonly label: string;
}

/**
 * The state an item page names in its title, as `messages.ts` keys it.
 */
type PageState = "answering" | "notAccepted" | "responseRecorded" | "scored";

/**
 * What one item page shows besides the item: its state, the Status part's input when the page
 * follows a post, and `render`'s view options.
 */
interface ItemView {
  readonly disabled: boolean;
  readonly options: Pick<Options, "messages" | "posted" | "values">;
  readonly state: PageState;
  readonly status: Option.Option<StatusInput>;
}

/**
 * The link back to the listing, on every page but the listing.
 */
const home: Element = h("p", {}, [h("a", { href: "/" }, [text("All documents")])]);

/**
 * Construct a page that says one thing: a 404, a refused method or a developer error.
 *
 * @param status The status code.
 * @param title The page's title and heading.
 * @param said What the page says, a developer error's message included.
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
    [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), home],
    [],
    headers,
  );

/**
 * Construct the 404 page every refused path answers with, a traversal included.
 *
 * @returns The 404 page.
 */
const notFound = (): Page =>
  notePage(404, "Not found", "No document, asset or open item is at this address.");

/**
 * Construct the page of a developer error: a failure the playground's own code or settings
 * caused, reported with its message.
 *
 * @param error The failure.
 * @returns The 500 page.
 */
const failurePage = (error: { readonly message: string }): Page =>
  notePage(500, "Playground error", error.message);

/**
 * Give the target of an item's page.
 *
 * @param corpusPath The document's corpus path.
 * @param instance The instance token a post names, none for the first open.
 * @returns `/item?path=…`, with `&instance=…` after it when given, and never a fragment.
 */
const itemTarget = (corpusPath: string, instance?: string): string =>
  `/item?${new URLSearchParams(
    instance === undefined
      ? [["path", corpusPath]]
      : [
          ["path", corpusPath],
          ["instance", instance],
        ],
  ).toString()}`;

/**
 * Read the corpus path of an `/assets/*` request through {@link servedFilePath}, which decodes each
 * segment of the request path on its own, so the path cannot climb out of the directory an item's
 * asset base names.
 *
 * `check`'s URL pass leaves a segment such as `..%2Fx` literal in the URL it writes, inside the
 * package as a URL (rule `723e580c`), so the route that serves package files must decode it and
 * refuse a climb. `readCorpusFile` refuses a path that leaves the corpus root on its own; this read
 * also refuses one that climbs and comes back.
 *
 * @param pathname The request path, still percent-encoded.
 * @returns The corpus path, or none when a segment does not decode or is refused.
 */
const assetPath = (pathname: string): Option.Option<string> =>
  servedFilePath(pathname.slice("/assets/".length).split("/"));

/**
 * Give the asset base of an item: its package directory under `/assets/`, each segment
 * percent-encoded, with its closing `/`.
 *
 * @param corpusPath The item document's corpus path.
 * @returns The base `render` rebases package paths onto.
 */
const assetBaseOf = (corpusPath: string): string => {
  const directory = path.posix.dirname(corpusPath);

  return directory === "."
    ? "/assets/"
    : `/assets/${directory.split("/").map(encodeURIComponent).join("/")}/`;
};

/**
 * Report whether an asset lies in the package directory of an item the playground holds open.
 *
 * @param playground The playground.
 * @param corpusPath The asset's corpus path.
 * @returns Whether some open item's directory holds it.
 */
const inOpenPackage = (playground: Playground, corpusPath: string): boolean =>
  playground.sessions.ids().some((instance) =>
    Option.exists(playground.sessions.get(instance), (session) => {
      const directory = path.posix.dirname(session.path);

      return directory === "." || corpusPath.startsWith(`${directory}/`);
    }),
  );

/**
 * Give the heading of a top folder of the corpus: its name, or `Corpus root` for members at the
 * root.
 *
 * @param folder The folder, `.` for the root.
 * @returns The heading's text.
 */
const folderHeading = (folder: string): string => (folder === "." ? "Corpus root" : folder);

/**
 * Construct the listing page: the packages and the playground's reports in a `nav`, the region of
 * test sessions in progress, each a Resume link to its page, then one region per verdict, named by
 * its heading with the verdict and its count, holding a heading per top folder and a list of its
 * members, each a link to its item page whose text is its corpus path.
 *
 * @param groups The members, grouped by verdict and then by top folder.
 * @param resumes The sessions in progress, newest first.
 * @returns The page.
 */
const listing = (groups: readonly VerdictGroup[], resumes: readonly Resume[]): Page =>
  page(200, "en", "plate dev playground", [
    h("h1", {}, [text("plate dev playground")]),
    h("p", {}, [
      text(
        "Every document of the example corpus, by its verdict and then by its top folder. Open one, answer it with the keyboard or the mouse, and submit the form. The server scores the answer; no script runs.",
      ),
    ]),
    h("nav", {}, [
      h("ul", {}, [
        h("li", {}, [h("a", { href: "/packages" }, [text("Packages")])]),
        h("li", {}, [h("a", { href: "/verdicts" }, [text("Verdicts")])]),
        h("li", {}, [h("a", { href: "/ledger" }, [text("Ledger")])]),
      ]),
    ]),
    h("section", { "aria-labelledby": inProgressId }, [
      h("h2", { id: inProgressId }, [text("Sessions in progress")]),
      resumes.length === 0
        ? h("p", {}, [
            text(
              "No test session is in progress. Start one with a Start button on a package's page.",
            ),
          ])
        : h(
            "ul",
            {},
            resumes.map(({ href, label }) => h("li", {}, [h("a", { href }, [text(label)])])),
          ),
    ]),
    ...groups.map(({ count, folders, verdict }) =>
      h("section", { "aria-labelledby": `verdict-${verdict}`, "data-verdict": verdict }, [
        h("h2", { "data-count": String(count), id: `verdict-${verdict}` }, [
          text(`${verdict} (${String(count)})`),
        ]),
        ...folders.flatMap(({ folder, members }) => [
          h("h3", {}, [text(folderHeading(folder))]),
          h(
            "ul",
            {},
            members.map((member) =>
              h("li", {}, [h("a", { href: itemTarget(member) }, [text(member)])]),
            ),
          ),
        ]),
      ]),
    ),
  ]);

/**
 * What each root besides an item is, as the page of such a document names it.
 */
const rootNames: Readonly<Record<Exclude<AcceptedKind, "item">, string>> = {
  section: "an assessment section",
  stimulus: "an assessment stimulus",
  test: "an assessment test",
};

/**
 * Construct the page of a document `open` accepted whose root is not an item: what it is, and the
 * page of the package it lies in, where its package's tests start, or the package listing when it
 * lies in no package's directory. The playground opens only items on their own.
 *
 * @param corpusPath The document's corpus path.
 * @param kind Its root's kind, which a data attribute also gives.
 * @param packaged The id of the package whose directory holds it, none when no package's does.
 * @returns The page.
 */
const rootPage = (
  corpusPath: string,
  kind: Exclude<AcceptedKind, "item">,
  packaged: Option.Option<string>,
): Page =>
  page(200, "en", `Accepted ${kind}: ${corpusPath}`, [
    h("h1", {}, [text(`Accepted ${kind}: ${corpusPath}`)]),
    h("p", { "data-kind": kind }, [
      text(
        `plate accepts this document as ${rootNames[kind]}. The playground opens items on their own and delivers a test from its package.`,
      ),
    ]),
    h(
      "p",
      {},
      Option.match(packaged, {
        onNone: () => [
          text("It lies in no package's directory. The "),
          h("a", { href: "/packages" }, [text("package listing")]),
          text(" has every package the playground opens."),
        ],
        onSome: (id) => [
          text("Its package's page lists the package's resources and starts its tests: "),
          h("a", { href: packageHref(id) }, [text(id)]),
          text("."),
        ],
      }),
    ),
    home,
  ]);

/**
 * Construct the page of a document `open` did not accept: each refusal or each reason it is
 * unchecked, with its rule or reason as a data attribute.
 *
 * @param corpusPath The document's corpus path.
 * @param state `Refused` or `Unchecked`, which leads the title.
 * @param lines Each refusal's rule and sentence, or each reason and the path it concerns.
 * @returns The page.
 */
const verdictPage = (
  corpusPath: string,
  state: "Refused" | "Unchecked",
  lines: readonly (readonly [attribute: Readonly<Record<string, string>>, said: string])[],
): Page =>
  page(200, "en", `${state}: ${corpusPath}`, [
    h("h1", {}, [text(corpusPath)]),
    h("p", {}, [
      text(
        state === "Refused"
          ? "open refused this document:"
          : "open cannot check all of this document, so it is not rendered:",
      ),
    ]),
    h(
      "ul",
      {},
      lines.map(([attribute, said]) => h("li", attribute, [text(said)])),
    ),
    home,
  ]);

/**
 * Construct the verdicts page: the per-document verdict report as a table, one row per member of
 * the document set in its order, its path the row header and a link to its item page.
 *
 * @param verdicts Every member's verdict, from the verdict cache.
 * @returns The page.
 */
const verdictsPage = (verdicts: readonly Verdict[]): Page =>
  page(200, "en", "Verdicts", [
    h("h1", {}, [text("Verdicts")]),
    h("p", {}, [
      text(
        "The verdict open gives each document of the example corpus, with each refusal or reason it is unchecked, and the unsupported features an accepted document holds. Each path opens its document.",
      ),
    ]),
    verdictTable(verdicts),
    home,
  ]);

/**
 * Construct the ledger page: the ledger as the view writes it, an `article` whose headings start
 * at `h1`.
 *
 * @param ledger The ledger the one command wrote.
 * @returns The page.
 */
const ledgerPage = (ledger: Ledger): Page =>
  page(200, "en", "Feature ledger", [ledgerHtml(ledger), home]);

/**
 * Construct the page `/ledger` shows before the one command has written a ledger: the file it
 * looked for, and the command to run before reloading.
 *
 * @param missing The file that is not there.
 * @returns The page.
 */
const noLedgerPage = (missing: LedgerMissing): Page =>
  page(200, "en", "No feature ledger yet", [
    h("h1", {}, [text("No feature ledger yet")]),
    h("p", {}, [text(`No ledger is written at ${missing.path} yet.`)]),
    h("p", {}, [
      text("Run "),
      h("code", {}, [text(ledgerCommand)]),
      text(" from the repository root, then reload this page."),
    ]),
    home,
  ]);

/**
 * The id of an item page's title, which names the item's form.
 */
const titleId = "playground-title";

/**
 * Give the id of the Status region a page after a submit holds: the id `renderStatus` gives the
 * region of an instance, which the item form's action names as its fragment.
 *
 * @param instance The item's instance token.
 * @returns The region's id.
 */
const resultId = (instance: string): string => scopedId(instance, "status");

/**
 * Compose an item page: the item's title, then the item region, holding the Status part when the
 * page follows a post and the playground's native form around the rendered item and its Submit.
 * The form is named by the item's title, so a screen reader announces it by that name and not as
 * an unnamed group.
 *
 * The form posts to the item's target with its instance token and, as its fragment, the id of the
 * Status region that every page after a submit holds first in reading order. That page is the
 * answer to the post, so the browser opens it at the fragment, with no script: HTML's "scroll to
 * the fragment" focuses the region, which carries `tabindex="-1"`, scrolls it into view and starts
 * sequential focus navigation there, so reading starts at the result, not at the top of the page.
 * The action is written before the post's outcome is known, so the fragment is the same after
 * every submit, and the page of every outcome holds the region it names.
 *
 * The item is redacted with the sitting's record, read back from its stored form through
 * `restore`, so its printed variables, template blocks and choices show by its template values;
 * the record itself stays on the server.
 *
 * @param accepted The accepted document.
 * @param session The item's corpus path, instance token and stored record.
 * @param configuration The configuration.
 * @param view What the page shows besides the item.
 * @returns The page, or a developer error's page when the record does not restore or a render
 *   fails.
 */
const itemPage = (
  accepted: Accepted,
  session: { readonly instance: string; readonly path: string; readonly record: StoredRecord },
  configuration: Configuration,
  view: ItemView,
): Page => {
  const { locale } = configuration;

  return Result.match(
    Result.gen(function* composeItem() {
      const { record } = yield* restore(accepted, session.record);
      const redacted = redact(accepted, record);
      const title = redacted.title.trim();
      const status = yield* Option.match(view.status, {
        onNone: () => Result.succeed<readonly string[]>([]),
        onSome: (input) =>
          Result.map(renderStatus(input, configuration), (rendered) => [rendered.html]),
      });
      const item = yield* render(redacted, configuration, {
        ...view.options,
        assetBase: assetBaseOf(session.path),
        disabled: view.disabled,
        instance: session.instance,
      });
      const submit = h(
        "button",
        view.disabled ? { disabled: true, type: "submit" } : { type: "submit" },
        [text(message(locale, "submit"))],
      );
      const form = h(
        "form",
        {
          action: `${itemTarget(session.path, session.instance)}#${resultId(session.instance)}`,
          "aria-labelledby": titleId,
          autocomplete: "off",
          method: "post",
          novalidate: true,
        },
        [slot(status.length), submit],
      );

      return page(
        200,
        locale,
        message(locale, "title", { state: message(locale, view.state), title }),
        [
          h("h1", { id: titleId }, [text(title)]),
          home,
          h("div", { id: "playground-item" }, [...status.map((_, index) => slot(index)), form]),
        ],
        [...status, item.html],
      );
    }),
    {
      onFailure: failurePage,
      onSuccess: (composed) => composed,
    },
  );
};

/**
 * Write the score a stored record holds, as the candidate reads it in the locale.
 *
 * @param accepted The accepted document.
 * @param stored The record `score` returned.
 * @param locale The locale.
 * @returns The single value of `SCORE`, or none when the item has no response processing or
 *   `SCORE` is absent or NULL, which makes the page say the response was recorded.
 */
const scoreText = (
  accepted: Accepted,
  stored: StoredRecord,
  locale: string,
): Option.Option<string> => {
  const [single] = stored.outcomes["SCORE"]?.values ?? [];
  if (Option.isNone(accepted.item.processing) || single === undefined) {
    return Option.none();
  }

  switch (single.baseType) {
    case "float": {
      return Option.map(decodeStoredFloat(single.value), (number) =>
        new Intl.NumberFormat(locale).format(number),
      );
    }
    case "integer": {
      return Option.some(new Intl.NumberFormat(locale).format(BigInt(single.value)));
    }
    case "directedPair":
    case "pair":
    case "point": {
      return Option.some(single.value.join(" "));
    }
    case "boolean":
    case "identifier":
    case "string":
    case "uri": {
      return Option.some(String(single.value));
    }
    default: {
      return single satisfies never;
    }
  }
};

/**
 * Construct the page of a refused post: the Status part with the messages first, and the item
 * with the posted text and its invalid Controls, the first of which takes the page's one
 * `autofocus`.
 *
 * The Status region is the fragment's target here as after any submit: the action named it before
 * the outcome was known, and the messages are the result a screen reader reads first. The first
 * invalid Control keeps `autofocus`, so keyboard focus can start where the answer is corrected.
 * HTML skips autofocus in a document whose fragment names an element, so a browser that follows
 * that rule leaves focus on the region, and the next Tab moves into the item; one that does not
 * moves focus on to the Control.
 *
 * @param target The item's instance and session.
 * @param configuration The configuration.
 * @param messages The validation messages.
 * @param posted The strings the post sent, by response.
 * @returns The page.
 */
const refusedPage = (
  target: { readonly instance: string; readonly session: Session },
  configuration: Configuration,
  messages: readonly ValidationMessage[],
  posted: Readonly<Record<string, readonly string[]>>,
): Page =>
  itemPage(
    target.session.accepted,
    { instance: target.instance, path: target.session.path, record: target.session.record },
    configuration,
    {
      disabled: false,
      options: { messages, posted },
      state: "notAccepted",
      status: Option.some({ heading: "notAccepted", instance: target.instance, messages }),
    },
  );

/**
 * Construct the page after a scored post: the Status part first, the fragment's target, with
 * `autofocus`, and the item restored from the posted values, disabled with its Submit once the
 * attempt limit is reached.
 *
 * @param target The item's instance and session, after the attempt.
 * @param configuration The configuration, which gives `maxAttempts` (0 means unlimited).
 * @param shown What the page shows.
 * @returns The page.
 */
const scoredPage = (
  target: { readonly instance: string; readonly session: Session },
  configuration: Configuration,
  shown: Shown,
): Page =>
  itemPage(
    target.session.accepted,
    { instance: target.instance, path: target.session.path, record: target.session.record },
    configuration,
    {
      disabled:
        configuration.maxAttempts > 0 && target.session.attempts >= configuration.maxAttempts,
      options: { values: shown.values },
      state: shown.status.heading,
      status: Option.some(shown.status),
    },
  );

/**
 * The failure of a route: the corpus, a package, a stylesheet or the ledger is missing or
 * unreadable, or the settings are missing or invalid.
 */
type RouteFailure =
  | Config.ConfigError
  | CorpusFileUnreadable
  | CorpusMissing
  | InvalidConfiguration
  | LedgerUnreadable
  | PackagesFailure
  | SheetUnreadable;

/**
 * Construct the page a route's failure answers with: the 404 page for a path the corpus does not
 * hold, and a developer error's page when the corpus, a package, a stylesheet or the ledger is
 * missing or unreadable or the settings are missing or invalid.
 *
 * @param error The failure.
 * @returns The page.
 */
const routeFailure = (error: RouteFailure): Page =>
  error._tag === "CorpusFileUnreadable" ? notFound() : failurePage(error);

/**
 * Give the id of the package whose directory holds a member of the document set: the innermost
 * `*.zip.d` directory on its path.
 *
 * @param playground The playground.
 * @param corpusPath The member's corpus path.
 * @returns The package's id, or none when no package's directory holds the member.
 */
const packageOfMember = Effect.fnUntraced(function* packageOfMember(
  playground: Playground,
  corpusPath: string,
): Effect.fn.Return<Option.Option<string>, PackagesFailure> {
  const directories = corpusPath.split("/").slice(0, -1);
  const innermost = directories.findLastIndex((directory) => directory.endsWith(packageSuffix));
  if (innermost === -1) {
    return Option.none();
  }

  const found = yield* packageAt(
    playground.packages,
    directories.slice(0, innermost + 1).join("/"),
  );

  return found.pipe(Option.map(({ id }) => id));
});

/**
 * Give a stored test session's Resume link, named "Resume: {test}, Item n of N" for its current
 * item.
 *
 * @param id The session id.
 * @param entry The store's entry.
 * @param test The test the session was started from.
 * @param configuration The playground's configuration.
 * @returns The link, or none when the session is closed or its stored form does not fit the test.
 */
const resumeOf = (
  id: string,
  entry: SessionEntry,
  test: PackageTest,
  configuration: Configuration,
): Option.Option<Resume> => {
  const session = decodeSession(entry.session, test.test);
  if (Result.isFailure(session) || session.success.status === "closed") {
    return Option.none();
  }

  const shown = current(test.test, session.success, configuration);
  if (Result.isFailure(shown) || shown.success.kind !== "item") {
    return Option.none();
  }

  const { count, sequenceIndex } = shown.success;
  const { locale } = shown.success.configuration;

  return Option.some({
    href: sessionHref(id),
    label: message(locale, "resume", {
      count: numeral(locale, count),
      n: numeral(locale, sequenceIndex),
      test: test.test.test.title.trim(),
    }),
  });
};

/**
 * Give each test session in progress, newest first, as its Resume link.
 *
 * A session whose package, test or stored form no longer fits its entry is left out: its own page
 * reports that developer error. A closed session is not in progress. The configuration is decoded
 * only when the store holds a session, so the index of a playground that started none never
 * decodes it.
 *
 * @param playground The playground.
 * @returns The sessions' links.
 */
const sessionsInProgress = Effect.fnUntraced(function* sessionsInProgress(
  playground: Playground,
): Effect.fn.Return<readonly Resume[], InvalidConfiguration | PackagesFailure> {
  const ids = playground.tests.ids().toReversed();
  if (ids.length === 0) {
    return [];
  }

  const configuration = yield* configure(playground.configuration);
  const resumes: Resume[] = [];
  for (const id of ids) {
    const entry = playground.tests.get(id);
    if (Option.isSome(entry)) {
      const found = yield* packageAt(playground.packages, entry.value.packageLocation);
      const resume = found.pipe(
        Option.flatMap((held) => testIn(held, entry.value.testHref)),
        Option.flatMap((test) => resumeOf(id, entry.value, test, configuration)),
      );
      if (Option.isSome(resume)) {
        resumes.push(resume.value);
      }
    }
  }

  return resumes;
});

/**
 * Answer a member of the document set with its item page, or with its refusals or unchecked
 * reasons, from its cached verdict, or, for an accepted test, section or stimulus, with the page
 * that says what it is and links its package; a path that names no member is not found.
 *
 * Each open of an accepted item is a new sitting: it draws an instance token, begins the sitting's
 * record with `begin` under the playground's seed, or one `begin` draws, and keeps the record in
 * the playground's store. `begin`'s failure cannot occur on a checked item; it answers as a
 * developer error.
 *
 * @param playground The playground.
 * @param corpusPath The document's corpus path, as the request named it.
 * @returns The page.
 */
const openItem = Effect.fn("playground.openItem")(function* openItem(
  playground: Playground,
  corpusPath: string,
): Effect.fn.Return<Page, InvalidConfiguration | OpenFailure | PackagesFailure> {
  const member = yield* playground.verdicts.verdictOf(corpusPath);
  if (Option.isNone(member)) {
    return notFound();
  }

  const configuration = yield* configure(playground.configuration);
  const verdict = member.value;

  switch (verdict.verdict) {
    case "refused": {
      return verdictPage(
        corpusPath,
        "Refused",
        verdict.refusals.map((refusal) => [
          { "data-rule": refusal.rule },
          describeRefusal(refusal),
        ]),
      );
    }
    case "unchecked": {
      return verdictPage(
        corpusPath,
        "Unchecked",
        verdict.reasons.map((reason) => [
          { "data-reason": reason.reason },
          `${reason.reason} at ${reason.path}`,
        ]),
      );
    }
    case "accepted":
    case "accepted-with-unsupported": {
      const accepted = acceptedItem(verdict);
      if (verdict.kind !== "item" || Option.isNone(accepted)) {
        return verdict.kind === "item"
          ? notFound()
          : rootPage(corpusPath, verdict.kind, yield* packageOfMember(playground, corpusPath));
      }

      const instance = playground.newInstance();
      const begun = begin(
        accepted.value,
        Option.match(playground.seed, {
          onNone: () => ({ instance }),
          onSome: (seed) => ({ instance, seed }),
        }),
      );
      if (Result.isFailure(begun)) {
        return failurePage(begun.failure);
      }

      playground.sessions.set(instance, {
        accepted: accepted.value,
        attempts: 0,
        last: Option.none(),
        path: corpusPath,
        record: begun.success,
      });

      return itemPage(
        accepted.value,
        { instance, path: corpusPath, record: begun.success },
        configuration,
        {
          disabled: false,
          options: {},
          state: "answering",
          status: Option.none(),
        },
      );
    }
    default: {
      return verdict satisfies never;
    }
  }
});

/**
 * Take a post of an open item: decode it on the server, check it, score it when it is accepted,
 * and answer with the page after the submit. The post is decoded and checked against the
 * sitting's stored record, read back through `restore`, and scored over it, and the record `score`
 * returns replaces it in the store.
 *
 * A post past the attempt limit is not scored; the page of the last scored post answers it.
 *
 * @param playground The playground.
 * @param request The post.
 * @param target The corpus path and instance token the form's action names.
 * @returns The page.
 */
const submit = Effect.fn("playground.submit")(function* submit(
  playground: Playground,
  request: Request,
  target: { readonly instance: string; readonly path: string },
): Effect.fn.Return<Page, InvalidConfiguration> {
  const held = Option.filter(
    playground.sessions.get(target.instance),
    (sitting) => sitting.path === target.path,
  );
  if (Option.isNone(held)) {
    return notePage(
      404,
      "Item not open",
      "This item is no longer open here, perhaps because the server restarted. Open it again from the list.",
    );
  }

  const session = held.value;
  const configuration = yield* configure(playground.configuration);
  const opened = { instance: target.instance, session };
  const finished = configuration.maxAttempts > 0 && session.attempts >= configuration.maxAttempts;
  if (finished && Option.isSome(session.last)) {
    return scoredPage(opened, configuration, session.last.value);
  }

  const entries = yield* entriesOf(request);
  if (Option.isNone(entries)) {
    return notePage(
      400,
      "Not a form post",
      "The post's body is not a form; submit the item's form.",
    );
  }

  const restored = restore(session.accepted, session.record);
  if (Result.isFailure(restored)) {
    return failurePage(restored.failure);
  }

  const { record } = restored.success;
  const post = postOf(session.accepted, target.instance, entries.value, record);
  const { posted } = post;
  const messages = checkResponses(session.accepted, post.decoded, configuration, record);
  if (messages.length > 0) {
    return refusedPage(opened, configuration, messages, posted);
  }

  const values = valuesOf(post);

  return Result.match(score(session.accepted, values, session.record), {
    onFailure: (error) =>
      error instanceof ResponsesRefused
        ? refusedPage(opened, configuration, error.messages, posted)
        : failurePage(error),
    onSuccess: (stored) => {
      const said = scoreText(session.accepted, stored, configuration.locale);
      const shown: Shown = {
        status: Option.match(said, {
          onNone: () => ({
            autofocus: true,
            heading: "responseRecorded",
            instance: target.instance,
          }),
          onSome: (written) => ({
            autofocus: true,
            heading: "scored",
            instance: target.instance,
            score: written,
          }),
        }),
        values,
      };
      const next: Session = {
        ...session,
        attempts: session.attempts + 1,
        last: Option.some(shown),
        record: stored,
      };
      playground.sessions.set(target.instance, next);

      return scoredPage({ instance: target.instance, session: next }, configuration, shown);
    },
  });
});

/**
 * Read the ledger the one command last wrote, from `ledger.json` in `PLATE_LEDGER_DIR`.
 *
 * @returns The ledger; fails with {@link LedgerMissing} when the file is not there, and with
 *   {@link LedgerUnreadable} when it cannot be read or does not decode as a ledger.
 */
const readLedger = Effect.fn("playground.readLedger")(function* readLedger(): Effect.fn.Return<
  Ledger,
  Config.ConfigError | LedgerMissing | LedgerUnreadable
> {
  const file = yield* ledgerFile;
  const contents = yield* Effect.tryPromise({
    catch: (cause) =>
      cause instanceof Error && "code" in cause && cause.code === "ENOENT"
        ? new LedgerMissing({ path: file })
        : new LedgerUnreadable({
            detail: cause instanceof Error ? cause.message : String(cause),
            path: file,
          }),
    try: () => readFile(file, "utf-8"),
  });

  return yield* decodeLedger(contents).pipe(
    Effect.mapError((error) => new LedgerUnreadable({ detail: error.message, path: file })),
  );
});

/**
 * Serve one package asset: decode its path segment by segment, refuse a path outside an open
 * item's package directory or of a type the playground does not serve, and send the bytes with the
 * asset headers.
 *
 * @param playground The playground.
 * @param pathname The request path, still percent-encoded.
 * @returns The asset's response, or the 404 page.
 */
const serveAsset = Effect.fn("playground.serveAsset")(function* serveAsset(
  playground: Playground,
  pathname: string,
): Effect.fn.Return<Page | Response, Config.ConfigError | CorpusFileUnreadable | CorpusMissing> {
  const relative = assetPath(pathname);
  const type = relative.pipe(
    Option.flatMap((corpusPath) =>
      Option.fromUndefinedOr(assetTypes.get(path.posix.extname(corpusPath).toLowerCase())),
    ),
  );
  if (
    Option.isNone(relative) ||
    Option.isNone(type) ||
    !inOpenPackage(playground, relative.value)
  ) {
    return notFound();
  }

  const bytes = yield* readCorpusFile(relative.value);

  return new Response(new Uint8Array(bytes), {
    headers: { ...assetHeaders, "content-type": type.value },
  });
});

/**
 * Read the path the plain-HTML host sees for a request's path: the path below {@link hostMount},
 * `/` for the mount itself.
 *
 * @param pathname The request's path.
 * @returns The host's path, or none when the path is not under the mount.
 */
const hostPath = (pathname: string): Option.Option<string> => {
  if (pathname === hostMount) {
    return Option.some("/");
  }

  return pathname.startsWith(`${hostMount}/`)
    ? Option.some(pathname.slice(hostMount.length))
    : Option.none();
};

/**
 * Pass a request to the plain-HTML host with its mount's prefix stripped, its query, method,
 * headers and body kept, and answer with the host's response, to which each page header the host
 * does not set is added, so the host's page gets the playground's content-security headers too.
 *
 * @param playground The playground, whose host is built the first time it is asked for.
 * @param request The request.
 * @param pathname The host's path, from {@link hostPath}.
 * @returns The host's response.
 */
const serveHost = Effect.fn("playground.serveHost")(function* serveHost(
  playground: Playground,
  request: Request,
  pathname: string,
): Effect.fn.Return<Response, HostFailure> {
  const host = yield* playground.host;
  const url = new URL(request.url);
  url.pathname = pathname;
  const hosted = yield* Effect.promise(() =>
    host(
      new Request(url, {
        body: request.body,
        duplex: "half",
        headers: request.headers,
        method: request.method,
      }),
    ),
  );
  const headers = new Headers(hosted.headers);
  for (const [name, value] of Object.entries(pageHeaders)) {
    if (!headers.has(name)) {
      headers.set(name, value);
    }
  }

  return new Response(hosted.body, { headers, status: hosted.status });
});

/**
 * Construct a stylesheet response: the CSS with the page headers and the CSS type.
 *
 * @param css The stylesheet's bytes or text.
 * @returns The 200 response.
 */
const cssResponse = (css: Uint8Array<ArrayBuffer> | string): Response =>
  new Response(css, { headers: { ...pageHeaders, "content-type": cssType } });

/**
 * Serve one of the package's stylesheets, read from its file.
 *
 * @param file The stylesheet's file URL.
 * @returns The response.
 */
const serveSheet = Effect.fn("playground.serveSheet")(function* serveSheet(
  file: URL,
): Effect.fn.Return<Response, SheetUnreadable> {
  const bytes = yield* Effect.tryPromise({
    catch: (cause) =>
      new SheetUnreadable({
        detail: cause instanceof Error ? cause.message : String(cause),
        path: fileURLToPath(file),
      }),
    try: () => readFile(file),
  });

  return cssResponse(new Uint8Array(bytes));
});

/**
 * Read one text field of a form post.
 *
 * @param form The post's fields.
 * @param name The field's name.
 * @returns Its first value, or none when it is absent or a file.
 */
const field = (form: FormData, name: string): Option.Option<string> => {
  const value = form.get(name);

  return value === null || value instanceof Blob ? Option.none() : Option.some(value);
};

/**
 * Give the `Location` a theme box post returns to: the `return` field's path and query when it is
 * a URL on the request's origin whose path and query stay on that origin, and `/` otherwise.
 *
 * The WHATWG parser reads the field against the request's URL, stripping tabs and newlines as a
 * browser does, so no prefix check is needed: `/\t/evil.example` parses as `//evil.example`,
 * another origin. The path and query are parsed once more because a same-origin URL can have a path
 * that begins with `//` (`/.//evil.example`), which a browser follows to another host.
 *
 * @param value The `return` field, none when it is absent.
 * @param requestUrl The post's URL.
 * @returns The `Location`, never the field's raw value.
 */
const returnLocation = (value: Option.Option<string>, requestUrl: string): string => {
  const { origin } = new URL(requestUrl);
  const parsed = value.pipe(
    Option.flatMap((written) =>
      written.trim() === "" ? Option.none() : Option.fromNullOr(URL.parse(written, requestUrl)),
    ),
  );
  if (Option.isNone(parsed) || parsed.value.origin !== origin) {
    return "/";
  }

  const location = `${parsed.value.pathname}${parsed.value.search}`;

  return URL.parse(location, requestUrl)?.origin === origin ? location : "/";
};

/**
 * Construct the page of a theme the box did not accept: the refusal's message, and its cause and
 * the part it quotes, with the stored theme unchanged. Its own box returns where the refused post
 * would have, since `/theme` is no page to go back to.
 *
 * @param refusal The refusal.
 * @param back The return location of the refused post.
 * @returns The 400 page.
 */
const themeRefusedPage = (refusal: ThemeRefused, back: string): Page => ({
  ...page(400, "en", "Theme not accepted", [
    h("h1", {}, [text("Theme not accepted")]),
    h("p", {}, [text(refusal.message)]),
    h("p", { "data-cause": refusal.cause }, [
      text("Refused part: "),
      h("code", {}, [text(refusal.detail)]),
    ]),
    h("p", {}, [text("The stored theme is unchanged.")]),
    home,
  ]),
  back: Option.some(back),
});

/**
 * Take a theme box post: read its `theme`, `dark` and `return` fields, store an accepted theme and
 * the dark flag, and answer 303 to the return location; a refused theme answers 400 and stores
 * nothing.
 *
 * @param playground The playground.
 * @param request The post.
 * @returns The redirect, or the page of a refused theme or a body that is not a form.
 */
const postTheme = Effect.fn("playground.postTheme")(function* postTheme(
  playground: Playground,
  request: Request,
): Effect.fn.Return<Page | Response> {
  const form = yield* Effect.result(
    // oxlint-disable-next-line typescript/no-deprecated -- The deprecation warns against parsing an untrusted server's multipart response; this is a post to the playground's own form, read on 127.0.0.1, and scripts/serve.ts caps its body at 1 MiB before the handler sees it.
    Effect.tryPromise(() => request.formData()),
  );
  if (Result.isFailure(form)) {
    return notePage(400, "Not a form post", "The post's body is not a form; submit the theme box.");
  }

  const fields = form.success;
  const location = returnLocation(field(fields, "return"), request.url);
  const theme = yield* Effect.result(
    parseTheme(Option.getOrElse(field(fields, "theme"), () => "")),
  );
  if (Result.isFailure(theme)) {
    return themeRefusedPage(theme.failure, location);
  }

  yield* Ref.set(playground.appearance, { dark: fields.has("dark"), theme: theme.success });

  return new Response(null, { headers: { ...pageHeaders, location }, status: 303 });
});

/**
 * Answer the index: the listing of the document set with the test sessions in progress. A member
 * that cannot be read answers with a developer error's page, since the page's own address exists.
 *
 * @param playground The playground.
 * @returns The page.
 */
const indexPage = (playground: Playground): Effect.Effect<Page, RouteFailure> =>
  Effect.all({
    resumes: sessionsInProgress(playground),
    verdicts: playground.verdicts.verdicts,
  }).pipe(
    Effect.map(({ resumes, verdicts }) => listing(groupVerdicts(verdicts), resumes)),
    Effect.catchTag("CorpusFileUnreadable", (unreadable) =>
      Effect.succeed(failurePage(unreadable)),
    ),
  );

/**
 * Route one request for the test delivery routes, in this order: a session's review, solution and
 * results (`reviewPath`), a Start post and a session's pages (`sessionPath`), the packages under
 * `/packages`, and the plain-HTML host under `/hosts/html`, its prefix stripped; any other path is
 * a 404. The session and review routes read one object, the playground's decoded configuration
 * with its packages and its test sessions. BG007 missing from the corpus is a developer error,
 * since the host's mount always serves it.
 *
 * @param playground The playground.
 * @param request The request.
 * @returns The response, or the page to answer with.
 */
const routeTests = (
  playground: Playground,
  request: Request,
): Effect.Effect<Page | Response, RouteFailure> => {
  const { pathname } = new URL(request.url);
  const read = Effect.map(
    configure(playground.configuration),
    (configuration): ReviewPlayground & SessionPlayground => ({
      configuration,
      packages: playground.packages,
      sessions: playground.tests,
    }),
  );

  if (reviewPath(pathname)) {
    return read.pipe(Effect.flatMap((sessions) => routeReview(sessions, request)));
  }

  if (sessionPath(pathname)) {
    return read.pipe(Effect.flatMap((sessions) => routeSessions(sessions, request)));
  }

  if (pathname === "/packages" || pathname.startsWith("/packages/")) {
    return routePackages(playground.packages, request);
  }

  return Option.match(hostPath(pathname), {
    onNone: () => Effect.succeed(notFound()),
    onSome: (hosted) =>
      serveHost(playground, request, hosted).pipe(
        Effect.catchTag("CorpusFileUnreadable", (unreadable) =>
          Effect.succeed(failurePage(unreadable)),
        ),
      ),
  });
};

/**
 * Route one request: the listing, the verdicts page, the ledger page, an item page, a post, an
 * asset, a stylesheet, or a theme box post; any other path goes to {@link routeTests}. A method a
 * route does not take is a 405 whose `Allow` names the methods it takes. A member the listing or
 * the verdicts page cannot read is a developer error there, since the page's own address exists;
 * so is a ledger that cannot be read, while a ledger not yet written shows the command that
 * writes it.
 *
 * @param playground The playground.
 * @param request The request.
 * @returns The response, or the page to answer with.
 */
const route = (
  playground: Playground,
  request: Request,
): Effect.Effect<Page | Response, RouteFailure> => {
  const url = new URL(request.url);
  /**
   * Answer a method the route does not take with the 405 page, whose `Allow` names the methods it
   * takes (RFC 9110 §15.5.6).
   *
   * @param allowed The methods the route takes at the request's target.
   * @returns The 405 page.
   */
  const refusedMethod = (allowed: readonly string[]) =>
    Effect.succeed(
      notePage(405, "Method not allowed", `${request.method} is not taken at ${url.pathname}.`, {
        allow: allowed.join(", "),
      }),
    );
  /**
   * Answer a GET with a page built from every member's verdict, and any other method with the 405
   * page. A member that cannot be read answers with a developer error's page.
   *
   * @param shown Builds the page from the verdicts, in the document set's order.
   * @returns The page.
   */
  const fromVerdicts = (shown: (verdicts: readonly Verdict[]) => Page) =>
    request.method === "GET"
      ? playground.verdicts.verdicts.pipe(
          Effect.map(shown),
          Effect.catchTag("CorpusFileUnreadable", (unreadable) =>
            Effect.succeed(failurePage(unreadable)),
          ),
        )
      : refusedMethod(["GET"]);

  if (url.pathname === "/") {
    return request.method === "GET" ? indexPage(playground) : refusedMethod(["GET"]);
  }

  if (url.pathname === "/verdicts") {
    return fromVerdicts(verdictsPage);
  }

  if (url.pathname === "/ledger") {
    return request.method === "GET"
      ? readLedger().pipe(
          Effect.map(ledgerPage),
          Effect.catchTag("LedgerMissing", (missing) => Effect.succeed(noLedgerPage(missing))),
        )
      : refusedMethod(["GET"]);
  }

  if (url.pathname === "/item") {
    const corpusPath = url.searchParams.get("path") ?? "";
    const instance = url.searchParams.get("instance");

    if (request.method === "GET") {
      return openItem(playground, corpusPath);
    }

    if (instance === null) {
      return refusedMethod(["GET"]);
    }

    return request.method === "POST"
      ? submit(playground, request, { instance, path: corpusPath })
      : refusedMethod(["GET", "POST"]);
  }

  if (url.pathname.startsWith("/assets/")) {
    return request.method === "GET" ? serveAsset(playground, url.pathname) : refusedMethod(["GET"]);
  }

  const sheet = sheets.get(url.pathname);
  if (sheet !== undefined) {
    return request.method === "GET" ? serveSheet(sheet) : refusedMethod(["GET"]);
  }

  if (url.pathname === "/theme.css") {
    return request.method === "GET"
      ? Effect.map(Ref.get(playground.appearance), ({ theme }) => cssResponse(themeCss(theme)))
      : refusedMethod(["GET"]);
  }

  if (url.pathname === "/theme") {
    return request.method === "POST" ? postTheme(playground, request) : refusedMethod(["POST"]);
  }

  return routeTests(playground, request);
};

/**
 * Give the path and query a page's theme box returns to by default: the request's own, except at
 * `/theme`, which has no page to go back to, so the listing.
 *
 * @param request The request the page answers.
 * @returns The path and query.
 */
const ownTarget = (request: Request): string => {
  const url = new URL(request.url);

  return url.pathname === "/theme" ? "/" : `${url.pathname}${url.search}`;
};

/**
 * Answer with a route's outcome: a response as it is, or a page written with its chrome, the
 * stored appearance read now and the theme box returning to the page's own path and query unless
 * the page names another, with the page headers and then the page's own.
 *
 * @param playground The playground.
 * @param request The request.
 * @param outcome The route's response or page.
 * @returns The response.
 */
const answer = (
  playground: Playground,
  request: Request,
  outcome: Page | Response,
): Effect.Effect<Response> =>
  outcome instanceof Response
    ? Effect.succeed(outcome)
    : Effect.map(
        Ref.get(playground.appearance),
        (appearance) =>
          new Response(
            pageHtml(outcome, {
              appearance,
              back: Option.getOrElse(outcome.back, () => ownTarget(request)),
            }),
            { headers: { ...pageHeaders, ...outcome.headers }, status: outcome.status },
          ),
      );

/**
 * Construct a playground's Fetch handler, with its own store of open items' sittings and their
 * records, its own test sessions, theme and dark flag, its own plain-HTML host, built once its
 * first build succeeds, and its own verdict and package caches unless the settings give them: a
 * member's verdict and a package's, once its open succeeds, are kept for the handler's life.
 *
 * It runs `open`, `configure`, the corpus read and the ledger read with `Effect.runPromise`;
 * `begin`, `restore`, `render`, `renderStatus`, `decode`, `checkResponses` and `score` are plain
 * functions. A failure the playground's settings or code cause answers with a 500 page that gives
 * its message, and the promise never rejects.
 *
 * @example
 *   const handle = createHandler({ configuration: { maxAttempts: 0 } });
 *   const response = await handle(new Request("http://127.0.0.1:5190/"));
 *   // 200, the listing
 *
 * @param settings The configuration input, the sittings' seed and instance tokens, the config
 *   provider, and the verdict and package caches, each optional.
 * @returns The handler.
 */
export const createHandler = (settings: PlaygroundSettings = {}): Handler => {
  const playground: Playground = {
    appearance: Ref.makeUnsafe<Appearance>({ dark: false, theme: emptyTheme }),
    configuration: settings.configuration ?? {},
    host: Effect.runSync(
      keptOnSuccess(
        Effect.gen(function* builtHost() {
          return yield* htmlHost(hostItem, yield* readCorpusFile(hostItem));
        }),
      ),
    ),
    newInstance: settings.newInstance ?? (() => crypto.randomUUID()),
    packages: settings.packages ?? Effect.runSync(packageCache()),
    seed: Option.fromUndefinedOr(settings.seed),
    sessions: boundedStore(),
    tests: sessionStore(),
    verdicts: settings.verdicts ?? Effect.runSync(verdictCache()),
  };
  /**
   * Provide the settings' config provider to an effect, or leave it on the process environment.
   *
   * @param effect The effect to run.
   * @returns The effect, reading its configuration from `settings.provider` when one is given.
   */
  const provided = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
    settings.provider === undefined
      ? effect
      : effect.pipe(Effect.provide(ConfigProvider.layer(settings.provider)));

  return (request) =>
    Effect.runPromise(
      provided(route(playground, request)).pipe(
        Effect.match({ onFailure: routeFailure, onSuccess: (outcome) => outcome }),
        Effect.flatMap((outcome) => answer(playground, request, outcome)),
        Effect.catchDefect((defect) =>
          answer(
            playground,
            request,
            failurePage({ message: defect instanceof Error ? defect.message : String(defect) }),
          ),
        ),
        Effect.withSpan("playground.request", {
          attributes: { method: request.method, url: request.url },
        }),
      ),
    );
};

/**
 * The playground's handler, over the process environment and every configuration default.
 */
export const handler: Handler = createHandler();
