/**
 * The dev playground: an example host, composed from plate's parts and pure functions the way an
 * author would compose them, behind one Fetch handler.
 *
 * The library decides no form, submit control, flow or attempt limit (rule `a9d04969`), so this
 * module owns them all: it lists every member of the corpus's document set under the verdict
 * `open` gives it, reports those verdicts as a table at `/verdicts` and the feature ledger the one
 * command last wrote at `/ledger`, opens any member through the verdict cache of
 * `#plate/dev/listing.ts`, keeps the `Accepted` item and the stored record on the server, and
 * sends only the HTML of `render(redact(…))` inside its own native form. A post is partitioned and
 * decoded on the server, checked with `checkResponses`, scored with `score`, and answered with the
 * page after a submit that spec §4.7 sets: the Status part first, one `autofocus`, and a title that
 * names the state. Every page is built through `h` and `toHtml`, so document text is escaped, and
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
 * @module
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Config, ConfigProvider, Effect, Option, Ref, Result, Schema } from "effect";
import { decodeStoredFloat } from "#plate/codec/values.ts";
import { groupVerdicts, verdictCache } from "#plate/dev/listing.ts";
import type { OpenFailure, VerdictCache, VerdictGroup } from "#plate/dev/listing.ts";
import { emptyTheme, parseTheme, themeCss, themeText } from "#plate/dev/theme.ts";
import type { Theme, ThemeRefused } from "#plate/dev/theme.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { text } from "#plate/emit/node.ts";
import { scopedId } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { isPosted } from "#plate/form/encoding.ts";
import {
  checkResponses,
  configure,
  decode,
  entryName,
  h,
  Malformed,
  partition,
  redact,
  render,
  renderStatus,
  ResponsesRefused,
  score,
} from "#plate/index.ts";
import type {
  Accepted,
  Binding,
  Configuration,
  DecodeOptions,
  Element,
  Entry,
  InvalidConfiguration,
  Node,
  Options,
  StatusInput,
  StoredRecord,
  ValidationMessage,
  Value,
} from "#plate/index.ts";
import { ledgerDirectory } from "#plate/ledger/directory.ts";
import { Ledger } from "#plate/ledger/report.ts";
import { ledgerHtml, verdictTable } from "#plate/ledger/view.ts";
import { message } from "#plate/messages.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { describeRefusal } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * A Fetch handler: one request in, one response out.
 */
export type Handler = (request: Request) => Promise<Response>;

/**
 * The settings of one playground, each optional.
 *
 * `configuration` is the input `configure` decodes, every default when absent; `provider` is where
 * `readCorpusFile` reads `PLATE_CORPUS_DIR` and `HOME` and the ledger page reads
 * `PLATE_LEDGER_DIR`, the process environment when absent; `verdicts` is the cache that opens and
 * keeps the corpus's members, a new one over `openMember` when absent. Handlers given one cache
 * share its opens, and a test counts them through the cache's opener; the cache reads the corpus
 * root of the first handler that asks, so share one only between handlers over the same root.
 */
export interface PlaygroundSettings {
  readonly configuration?: Partial<Configuration>;
  readonly provider?: ConfigProvider.ConfigProvider;
  readonly verdicts?: VerdictCache;
}

/**
 * The most sessions a playground keeps; the oldest is evicted first (OD-10's placeholder).
 */
const sessionLimit = 100;

/**
 * The headers of every HTML page (`work/planning/mind/od14-decisions.md`, rule `723e580c`): no
 * script and no `'unsafe-inline'` in any directive, posts only to this origin, and no caching.
 * The stylesheets and the theme box's redirect carry them too, a stylesheet with its own type.
 *
 * `object-src 'self'` lets an item's `object` load a package document from `/assets/`.
 * `frame-src 'self'` is there for Chromium, which also checks the document an `object` loads
 * into its nested browsing context against `frame-src` (then `child-src`, then `default-src`);
 * WebKit and Firefox check `object-src` alone (`docs/research/1909bcff.md`). The nested document
 * is sandboxed by its own header ({@link assetHeaders}), not by this policy.
 */
const pageHeaders = {
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'none'; style-src 'self'; img-src 'self' https: http:; media-src 'self' https: http:; object-src 'self'; frame-src 'self'; script-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "content-type": "text/html; charset=utf-8",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
} as const satisfies Readonly<Record<string, string>>;

/**
 * The headers of every served asset besides its type: a package document is a live document, so
 * it runs in a sandbox with no script, plugins, base or form target.
 */
const assetHeaders = {
  "content-security-policy":
    "sandbox; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "x-content-type-options": "nosniff",
} as const satisfies Readonly<Record<string, string>>;

/**
 * The media types `/assets/*` serves, by lower-case extension; any other file is refused.
 *
 * The list holds what an item body embeds: images, audio, video, text tracks, stylesheets and
 * HTML package documents. XML is absent on purpose, because an item document holds its correct
 * responses and mappings, which redaction keeps off the page.
 */
const assetTypes: ReadonlyMap<string, string> = new Map([
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
  readonly status: StatusInput;
  readonly values: Readonly<Record<string, Value>>;
}

/**
 * One opened item, held on the server under its instance token: the accepted document, the
 * record the last `score` returned, the scored attempts, and what the last scored page showed.
 */
interface Session {
  readonly accepted: Accepted;
  readonly attempts: number;
  readonly last: Option.Option<Shown>;
  readonly path: string;
  readonly record: Option.Option<StoredRecord>;
}

/**
 * What the theme box last stored: the accepted theme and the dark flag, `emptyTheme` and off at
 * start.
 */
interface Appearance {
  readonly dark: boolean;
  readonly theme: Theme;
}

/**
 * A playground's state and settings: its theme box's appearance, its sessions, oldest first, its
 * configuration input, and the verdicts of the corpus's members.
 */
interface Playground {
  readonly appearance: Ref.Ref<Appearance>;
  readonly configuration: Partial<Configuration>;
  readonly sessions: Map<string, Session>;
  readonly verdicts: VerdictCache;
}

/**
 * An HTML page before its chrome is added: its status, its language and title, the nodes inside
 * `main`, the HTML of each part its markers hold, and where its theme box returns when the page's
 * own address is not the place to go back to.
 */
interface Page {
  readonly back: Option.Option<string>;
  readonly locale: string;
  readonly main: readonly Node[];
  readonly parts: readonly string[];
  readonly status: number;
  readonly title: string;
}

/**
 * What every page carries besides its content: the theme box's stored appearance, and the path and
 * query the box returns to.
 */
interface Chrome {
  readonly appearance: Appearance;
  readonly back: string;
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
 * How one response travels through the playground's form: its identifier, its binding and the
 * number base of a Text Entry.
 */
interface Posting {
  readonly binding: Binding;
  readonly options: DecodeOptions;
  readonly response: string;
}

/**
 * The marker element a page tree holds where a part's HTML goes.
 *
 * `render` and `renderStatus` return HTML, and the node tree has no raw-HTML node, so the page is
 * built around markers and each marker's serialised form is replaced by its part afterwards. The
 * serialiser escapes `<` in every text and attribute, so a marker's spelling can come only from a
 * marker element, never from document text.
 *
 * @param index The part's position in the page's parts.
 * @returns The marker.
 */
const slot = (index: number): Element => h("plate-slot", { "data-index": String(index) });

/**
 * Construct a page whose theme box returns to the page's own path and query.
 *
 * @param status The status code.
 * @param locale The page's language.
 * @param title The page's title, as the candidate reads it.
 * @param main The nodes inside `main`.
 * @param parts The HTML of each part, in marker order.
 * @returns The page.
 */
const page = (
  status: number,
  locale: string,
  title: string,
  main: readonly Node[],
  parts: readonly string[] = [],
): Page => ({ back: Option.none(), locale, main, parts, status, title });

/**
 * The stylesheets every page links, in cascade order: plate's default theme, the playground's own
 * sheet, then the host CSS of the stored theme.
 */
const sheetLinks: readonly Element[] = ["/styles.css", "/playground.css", "/theme.css"].map(
  (href) => h("link", { href, rel: "stylesheet" }),
);

/**
 * The id of the theme box's heading, which names the box.
 */
const themeHeadingId = "playground-theme-heading";

/**
 * Construct the theme box: the playground's own form, outside the item's, that posts a pasted
 * theme, the dark flag and the page to return to `/theme`, named by its heading, Theme, so a screen
 * reader announces it by that name and not as an unnamed group.
 *
 * Its textarea shows the stored theme as `themeText` writes it, and its Dark checkbox is checked
 * while the flag is on, so applying the box unchanged keeps the appearance.
 *
 * @param chrome The stored appearance and the return path.
 * @returns The form.
 */
const themeBox = ({ appearance, back }: Chrome): Element =>
  h("form", { action: "/theme", "aria-labelledby": themeHeadingId, method: "post" }, [
    h("h2", { id: themeHeadingId }, [text("Theme")]),
    h("p", {}, [
      text(
        "Paste a shadcn theme's :root and .dark blocks, tick Dark to use the .dark block, and apply the theme. The dev playground keeps it until the server restarts.",
      ),
    ]),
    h("label", { for: "playground-theme" }, [text("Theme blocks")]),
    h("textarea", { id: "playground-theme", name: "theme", rows: "12", spellcheck: "false" }, [
      text(themeText(appearance.theme)),
    ]),
    h("p", {}, [
      h(
        "input",
        appearance.dark
          ? { checked: true, id: "playground-dark", name: "dark", type: "checkbox" }
          : { id: "playground-dark", name: "dark", type: "checkbox" },
      ),
      h("label", { for: "playground-dark" }, [text("Dark")]),
    ]),
    h("input", { name: "return", type: "hidden", value: back }),
    h("button", { type: "submit" }, [text("Apply theme")]),
  ]);

/**
 * Write a whole HTML page: the doctype, `html` in the locale and with the `dark` class while the
 * flag is on, a head with the title and the three stylesheets, and `main` holding the page's nodes
 * and then the theme box, with each marker replaced by its part's HTML.
 *
 * @param shown The page.
 * @param chrome The stored appearance and the theme box's return path.
 * @returns The page's HTML.
 */
const pageHtml = (shown: Page, chrome: Chrome): string => {
  const tree = h(
    "html",
    chrome.appearance.dark ? { class: "dark", lang: shown.locale } : { lang: shown.locale },
    [
      h("head", {}, [
        h("meta", { charset: "utf-8" }),
        h("meta", { content: "width=device-width, initial-scale=1", name: "viewport" }),
        h("title", {}, [text(shown.title)]),
        ...sheetLinks,
      ]),
      h("body", {}, [h("main", {}, [...shown.main, themeBox(chrome)])]),
    ],
  );

  let html = toHtml(tree);
  for (const [index, part] of shown.parts.entries()) {
    html = html.replace(toHtml(slot(index)), () => part);
  }

  return `<!doctype html>${html}`;
};

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
 * @returns The page.
 */
const notePage = (status: number, title: string, said: string): Page =>
  page(status, "en", title, [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), home]);

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
 * Check that a corpus path names a file below a directory without leaving it: relative, no empty,
 * `.` or `..` segment, and no backslash or NUL.
 *
 * `readCorpusFile` refuses a path that leaves the corpus root on its own; this check also refuses
 * one that climbs and comes back, so a path names its file one way only.
 *
 * @param segments The path's segments, already decoded.
 * @returns The path joined with `/`, or none when a segment is refused.
 */
const joinedSegments = (segments: readonly string[]): Option.Option<string> =>
  segments.length > 0 &&
  segments.every(
    (segment) =>
      segment !== "" &&
      segment !== "." &&
      segment !== ".." &&
      !segment.includes("/") &&
      !segment.includes("\\") &&
      !segment.includes("\0"),
  )
    ? Option.some(segments.join("/"))
    : Option.none();

/**
 * Read the corpus path of an `/assets/*` request, decoding each segment of the request path on
 * its own.
 *
 * A segment that decodes to a separator or a dot segment (`..%2Fx`, `%2e%2e%2f`) is refused, so
 * the decoded path holds exactly the directories the request path names and cannot climb out of
 * the directory an item's asset base names (`work/planning/mind/od14-decisions.md`).
 *
 * @param pathname The request path, still percent-encoded.
 * @returns The corpus path, or none when a segment does not decode or is refused.
 */
const assetPath = (pathname: string): Option.Option<string> =>
  Result.match(
    Result.all(
      pathname
        .slice("/assets/".length)
        .split("/")
        .map((segment) => Result.try(() => decodeURIComponent(segment))),
    ),
    { onFailure: () => Option.none(), onSuccess: joinedSegments },
  );

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
  [...playground.sessions.values()].some((session) => {
    const directory = path.posix.dirname(session.path);

    return directory === "." || corpusPath.startsWith(`${directory}/`);
  });

/**
 * Keep a session, evicting the oldest past {@link sessionLimit}.
 *
 * An existing instance keeps its place, so eviction follows the order items were opened.
 *
 * @param playground The playground.
 * @param instance The session's instance token.
 * @param session The session.
 */
const remember = (playground: Playground, instance: string, session: Session): void => {
  playground.sessions.set(instance, session);
  for (const oldest of playground.sessions.keys()) {
    if (playground.sessions.size <= sessionLimit) {
      break;
    }

    playground.sessions.delete(oldest);
  }
};

/**
 * Give the heading of a top folder of the corpus: its name, or `Corpus root` for members at the
 * root.
 *
 * @param folder The folder, `.` for the root.
 * @returns The heading's text.
 */
const folderHeading = (folder: string): string => (folder === "." ? "Corpus root" : folder);

/**
 * Construct the listing page: the playground's reports in a `nav`, then one region per verdict,
 * named by its heading with the verdict and its count, holding a heading per top folder and a list
 * of its members, each a link to its item page whose text is its corpus path.
 *
 * @param groups The members, grouped by verdict and then by top folder.
 * @returns The page.
 */
const listing = (groups: readonly VerdictGroup[]): Page =>
  page(200, "en", "plate dev playground", [
    h("h1", {}, [text("plate dev playground")]),
    h("p", {}, [
      text(
        "Every document of the example corpus, by its verdict and then by its top folder. Open one, answer it with the keyboard or the mouse, and submit the form. The server scores the answer; no script runs.",
      ),
    ]),
    h("nav", {}, [
      h("ul", {}, [
        h("li", {}, [h("a", { href: "/verdicts" }, [text("Verdicts")])]),
        h("li", {}, [h("a", { href: "/ledger" }, [text("Ledger")])]),
      ]),
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
 * @param accepted The accepted document.
 * @param session The item's corpus path and instance token.
 * @param configuration The configuration.
 * @param view What the page shows besides the item.
 * @returns The page, or a developer error's page when a render fails.
 */
const itemPage = (
  accepted: Accepted,
  session: { readonly instance: string; readonly path: string },
  configuration: Configuration,
  view: ItemView,
): Page => {
  const { locale } = configuration;
  const redacted = redact(accepted);
  const title = redacted.title.trim();

  return Result.match(
    Result.gen(function* composeItem() {
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
 * Collect the response each interaction of body nodes binds, in document order, inside elements,
 * Prompts and choices, each with the number base its Controls post in: a Text Entry's or an
 * Extended Text's `base`, and 10 for a Choice.
 *
 * @param nodes The body nodes.
 * @returns Each interaction's response identifier and base.
 */
const responsesIn = (nodes: readonly BodyNode[]): readonly (readonly [string, number])[] =>
  nodes.flatMap((node): readonly (readonly [string, number])[] => {
    switch (node.kind) {
      case "element": {
        return responsesIn(node.children);
      }
      case "choice": {
        return [
          [node.response, 10],
          ...responsesIn(Option.getOrElse(node.prompt, () => [])),
          ...node.choices.flatMap((choice) => responsesIn(choice.content)),
        ];
      }
      case "extended-text": {
        return [
          [node.response, node.base],
          ...responsesIn(Option.getOrElse(node.prompt, () => [])),
        ];
      }
      case "text-entry": {
        return [[node.response, node.base]];
      }
      case "text":
      case "unsupported": {
        return [];
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Collect the postings of an item's interactions in document order, one per response: the
 * response's declared base type and cardinality under the entry name `render` gives its
 * Controls, and a Text Entry's base.
 *
 * A response with no declaration, or of a base type no phase-1 interaction posts, is left out, so
 * `checkResponses` treats it as NULL and `score` keeps its value.
 *
 * @param accepted The accepted document.
 * @param instance The instance token.
 * @returns The postings.
 */
const postingsOf = (accepted: Accepted, instance: string): readonly Posting[] => {
  const seen = new Set<string>();

  return responsesIn(accepted.item.body).flatMap(([response, base]): readonly Posting[] => {
    const declaration = accepted.item.responses.get(response);
    if (seen.has(response) || declaration === undefined || !isPosted(declaration.baseType)) {
      return [];
    }

    seen.add(response);

    return [
      {
        binding: {
          baseType: declaration.baseType,
          cardinality: declaration.cardinality,
          name: entryName(instance, response),
        },
        options: { base },
        response,
      },
    ];
  });
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
    { instance: target.instance, path: target.session.path },
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
    { instance: target.instance, path: target.session.path },
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
 * Construct the page a route's failure answers with: the 404 page for a path the corpus does not
 * hold, and a developer error's page when the corpus, a stylesheet or the ledger is missing or
 * unreadable or the settings are missing or invalid.
 *
 * @param error The failure.
 * @returns The page.
 */
const routeFailure = (
  error:
    | Config.ConfigError
    | CorpusFileUnreadable
    | CorpusMissing
    | InvalidConfiguration
    | LedgerUnreadable
    | SheetUnreadable,
): Page => (error._tag === "CorpusFileUnreadable" ? notFound() : failurePage(error));

/**
 * Answer a member of the document set with its item page, or with its refusals or unchecked
 * reasons, from its cached verdict; a path that names no member is not found.
 *
 * @param playground The playground.
 * @param corpusPath The document's corpus path, as the request named it.
 * @returns The page.
 */
const openItem = Effect.fn("playground.openItem")(function* openItem(
  playground: Playground,
  corpusPath: string,
): Effect.fn.Return<Page, InvalidConfiguration | OpenFailure> {
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
      const instance = crypto.randomUUID();
      remember(playground, instance, {
        accepted: verdict.accepted,
        attempts: 0,
        last: Option.none(),
        path: corpusPath,
        record: Option.none(),
      });

      return itemPage(verdict.accepted, { instance, path: corpusPath }, configuration, {
        disabled: false,
        options: {},
        state: "answering",
        status: Option.none(),
      });
    }
    default: {
      return verdict satisfies never;
    }
  }
});

/**
 * Take a post of an open item: decode it on the server, check it, score it when it is accepted,
 * and answer with the page after the submit.
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
  const session = playground.sessions.get(target.instance);
  if (session === undefined || session.path !== target.path) {
    return notePage(
      404,
      "Item not open",
      "This item is no longer open here, perhaps because the server restarted. Open it again from the list.",
    );
  }

  const configuration = yield* configure(playground.configuration);
  const current = { instance: target.instance, session };
  const finished = configuration.maxAttempts > 0 && session.attempts >= configuration.maxAttempts;
  if (finished && Option.isSome(session.last)) {
    return scoredPage(current, configuration, session.last.value);
  }

  const form = yield* Effect.result(
    // oxlint-disable-next-line typescript/no-deprecated -- The deprecation warns against parsing an untrusted server's multipart response; this is a post to the playground's own form, read on 127.0.0.1, and scripts/serve.ts caps its body at 1 MiB before the handler sees it.
    Effect.tryPromise(() => request.formData()),
  );
  if (Result.isFailure(form)) {
    return notePage(
      400,
      "Not a form post",
      "The post's body is not a form; submit the item's form.",
    );
  }

  const { own } = partition(
    Array.from(form.success, ([name, value]): Entry => [name, value]),
    target.instance,
  );
  const postings = postingsOf(session.accepted, target.instance);
  const decoded = Object.fromEntries(
    postings.map(({ binding, options, response }) => [
      response,
      Result.merge(decode(own, binding, options)),
    ]),
  );
  const posted = Object.fromEntries(
    postings.map(({ binding, response }) => [
      response,
      own.flatMap(([name, value]) =>
        name !== binding.name || value instanceof Blob ? [] : [value],
      ),
    ]),
  );
  const messages = checkResponses(session.accepted, decoded, configuration);
  if (messages.length > 0) {
    return refusedPage(current, configuration, messages, posted);
  }

  const values = Object.fromEntries(
    Object.entries(decoded).flatMap(([response, value]) =>
      value instanceof Malformed ? [] : [[response, value] as const],
    ),
  );

  return Result.match(score(session.accepted, values, Option.getOrUndefined(session.record)), {
    onFailure: (error) =>
      error instanceof ResponsesRefused
        ? refusedPage(current, configuration, error.messages, posted)
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
        record: Option.some(stored),
      };
      remember(playground, target.instance, next);

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
 * Route one request: the listing, the verdicts page, the ledger page, an item page, a post, an
 * asset, a stylesheet, or a theme box post; anything else is a 404, and a method a route does not
 * take is a 405. A member the listing or the verdicts page cannot read is a developer error there,
 * since the page's own address exists; so is a ledger that cannot be read, while a ledger not yet
 * written shows the command that writes it.
 *
 * @param playground The playground.
 * @param request The request.
 * @returns The response, or the page to answer with.
 */
const route = (
  playground: Playground,
  request: Request,
): Effect.Effect<
  Page | Response,
  | Config.ConfigError
  | CorpusFileUnreadable
  | CorpusMissing
  | InvalidConfiguration
  | LedgerUnreadable
  | SheetUnreadable
> => {
  const url = new URL(request.url);
  const refusedMethod = Effect.succeed(
    notePage(405, "Method not allowed", `${request.method} is not taken at ${url.pathname}.`),
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
      : refusedMethod;

  if (url.pathname === "/") {
    return fromVerdicts((verdicts) => listing(groupVerdicts(verdicts)));
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
      : refusedMethod;
  }

  if (url.pathname === "/item") {
    const corpusPath = url.searchParams.get("path") ?? "";
    const instance = url.searchParams.get("instance");

    if (request.method === "GET") {
      return openItem(playground, corpusPath);
    }

    return request.method === "POST" && instance !== null
      ? submit(playground, request, { instance, path: corpusPath })
      : refusedMethod;
  }

  if (url.pathname.startsWith("/assets/")) {
    return request.method === "GET" ? serveAsset(playground, url.pathname) : refusedMethod;
  }

  const sheet = sheets.get(url.pathname);
  if (sheet !== undefined) {
    return request.method === "GET" ? serveSheet(sheet) : refusedMethod;
  }

  if (url.pathname === "/theme.css") {
    return request.method === "GET"
      ? Effect.map(Ref.get(playground.appearance), ({ theme }) => cssResponse(themeCss(theme)))
      : refusedMethod;
  }

  if (url.pathname === "/theme") {
    return request.method === "POST" ? postTheme(playground, request) : refusedMethod;
  }

  return Effect.succeed(notFound());
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
 * the page names another, with the page headers.
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
            { headers: pageHeaders, status: outcome.status },
          ),
      );

/**
 * Construct a playground's Fetch handler, with its own sessions, theme and dark flag, and its own
 * verdict cache unless the settings give one: a member's verdict, once its open succeeds, is kept
 * for the handler's life.
 *
 * It runs `open`, `configure`, the corpus read and the ledger read with `Effect.runPromise`;
 * `render`, `renderStatus`, `decode`, `checkResponses` and `score` are plain functions. A failure
 * the playground's settings or code cause answers with a 500 page that gives its message, and the
 * promise never rejects.
 *
 * @example
 *   const handle = createHandler({ configuration: { maxAttempts: 0 } });
 *   const response = await handle(new Request("http://127.0.0.1:5190/"));
 *   // 200, the listing
 *
 * @param settings The configuration input, the config provider and the verdict cache, each
 *   optional.
 * @returns The handler.
 */
export const createHandler = (settings: PlaygroundSettings = {}): Handler => {
  const playground: Playground = {
    appearance: Ref.makeUnsafe<Appearance>({ dark: false, theme: emptyTheme }),
    configuration: settings.configuration ?? {},
    sessions: new Map(),
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
