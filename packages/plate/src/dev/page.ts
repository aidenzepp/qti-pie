/**
 * The dev playground: an example host, composed from plate's parts and pure functions the way an
 * author would compose them, behind one Fetch handler.
 *
 * The library decides no form, submit control, flow or attempt limit (rule `a9d04969`), so this
 * module owns them all: it lists four corpus documents, opens one with `open`, keeps the
 * `Accepted` item and the stored record on the server, and sends only the HTML of
 * `render(redact(…))` inside its own native form. A post is partitioned and decoded on the server,
 * checked with `checkResponses`, scored with `score`, and answered with the page after a submit
 * that spec §4.7 sets: the Status part first, one `autofocus`, and a title that names the state.
 * Every page is built through `h` and `toHtml`, so document text is escaped, and every response
 * carries the content-security headers of rule `723e580c`. It reads the corpus through
 * `readCorpusFile` and opens no port: `scripts/serve.ts` is the listener.
 *
 * @module
 */
import path from "node:path";
import { ConfigProvider, Effect, Option, Result } from "effect";
import type { Config } from "effect";
import { decodeStoredFloat } from "#plate/codec/values.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { text } from "#plate/emit/node.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { isPosted } from "#plate/form/encoding.ts";
import {
  checkResponses,
  configure,
  decode,
  entryName,
  h,
  Malformed,
  open,
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
import { message } from "#plate/messages.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { describeRefusal } from "#plate/validate/verdict.ts";

/**
 * A Fetch handler: one request in, one response out.
 */
export type Handler = (request: Request) => Promise<Response>;

/**
 * The settings of one playground, each optional.
 *
 * `configuration` is the input `configure` decodes, every default when absent; `provider` is where
 * `readCorpusFile` reads `PLATE_CORPUS_DIR` and `HOME`, the process environment when absent.
 */
export interface PlaygroundSettings {
  readonly configuration?: Partial<Configuration>;
  readonly provider?: ConfigProvider.ConfigProvider;
}

/**
 * A corpus document the listing names: its short label, what it shows, and its corpus path.
 */
export interface ListedDocument {
  readonly label: string;
  readonly path: string;
  readonly shows: string;
}

/**
 * The documents the listing names, in order: phase 1's three accepted fixtures and the refused
 * CAT test.
 */
export const documents: readonly ListedDocument[] = [
  {
    label: "BG007",
    path: "QTI3_BPIG_Examples/items/BG007.xml",
    shows: "a Choice, true or false, scored by match_correct",
  },
  {
    label: "BG010",
    path: "QTI3_BPIG_Examples/items/BG010.xml",
    shows: "a Text Entry in a quotation, scored by map_response",
  },
  {
    label: "BG011",
    path: "QTI3_BeginnersGuide_Examples/items/BG011.xml",
    shows: "an Extended Text below an image and a video, with no response processing",
  },
  {
    label: "CAT",
    path: "qtiv3-examples/CAT/test.xml",
    shows: "a test document, which open refuses",
  },
];

/**
 * The most sessions a playground keeps; the oldest is evicted first (OD-10's placeholder).
 */
const sessionLimit = 100;

/**
 * The headers of every HTML page (`work/planning/mind/od14-decisions.md`, rule `723e580c`): no
 * script and no `'unsafe-inline'` in any directive, posts only to this origin, and no caching.
 */
const pageHeaders = {
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'none'; style-src 'self'; img-src 'self' https: http:; media-src 'self' https: http:; object-src 'self'; script-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
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
 * A playground's state and settings: its sessions, oldest first, and its configuration input.
 */
interface Playground {
  readonly configuration: Partial<Configuration>;
  readonly sessions: Map<string, Session>;
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
 * Write a whole HTML page: the doctype, `html` in the locale, a head with the title, and `main`
 * holding the page's nodes, with each marker replaced by its part's HTML.
 *
 * @param locale The page's language.
 * @param title The page's title, as the candidate reads it.
 * @param main The nodes inside `main`.
 * @param parts The HTML of each part, in marker order.
 * @returns The page's HTML.
 */
const pageHtml = (
  locale: string,
  title: string,
  main: readonly Node[],
  parts: readonly string[] = [],
): string => {
  const tree = h("html", { lang: locale }, [
    h("head", {}, [
      h("meta", { charset: "utf-8" }),
      h("meta", { content: "width=device-width, initial-scale=1", name: "viewport" }),
      h("title", {}, [text(title)]),
    ]),
    h("body", {}, [h("main", {}, main)]),
  ]);

  let html = toHtml(tree);
  for (const [index, part] of parts.entries()) {
    html = html.replace(toHtml(slot(index)), () => part);
  }

  return `<!doctype html>${html}`;
};

/**
 * Construct an HTML response with the page headers.
 *
 * @param status The status code.
 * @param html The page.
 * @returns The response.
 */
const htmlResponse = (status: number, html: string): Response =>
  new Response(html, { headers: pageHeaders, status });

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
 * @returns The response.
 */
const notePage = (status: number, title: string, said: string): Response =>
  htmlResponse(
    status,
    pageHtml("en", title, [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), home]),
  );

/**
 * The 404 every refused path answers with, a traversal included.
 */
const notFound = (): Response =>
  notePage(404, "Not found", "No document, asset or open item is at this address.");

/**
 * Construct the page of a developer error: a failure the playground's own code or settings
 * caused, reported with its message.
 *
 * @param error The failure.
 * @returns The 500 response.
 */
const failurePage = (error: { readonly message: string }): Response =>
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
 * Construct the listing page: the four documents, each a link to its item page.
 *
 * @returns The response.
 */
const listing = (): Response =>
  htmlResponse(
    200,
    pageHtml("en", "plate dev playground", [
      h("h1", {}, [text("plate dev playground")]),
      h("p", {}, [
        text(
          "Open a document, answer it with the keyboard or the mouse, and submit the form. The server scores the answer; no script runs.",
        ),
      ]),
      h(
        "ul",
        {},
        documents.map((entry) =>
          h("li", {}, [
            h("a", { href: itemTarget(entry.path) }, [text(entry.label)]),
            text(`: ${entry.shows} (${entry.path})`),
          ]),
        ),
      ),
    ]),
  );

/**
 * Construct the page of a document `open` did not accept: each refusal or each reason it is
 * unchecked, with its rule or reason as a data attribute.
 *
 * @param corpusPath The document's corpus path.
 * @param state `Refused` or `Unchecked`, which leads the title.
 * @param lines Each refusal's rule and sentence, or each reason and the path it concerns.
 * @returns The response.
 */
const verdictPage = (
  corpusPath: string,
  state: "Refused" | "Unchecked",
  lines: readonly (readonly [attribute: Readonly<Record<string, string>>, said: string])[],
): Response =>
  htmlResponse(
    200,
    pageHtml("en", `${state}: ${corpusPath}`, [
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
    ]),
  );

/**
 * Compose an item page: the item's title, then the item region, holding the Status part when the
 * page follows a post and the playground's native form around the rendered item and its Submit.
 *
 * The form posts to the item's target with its instance token and no fragment, so a browser
 * flushes the page's one `autofocus`.
 *
 * @param accepted The accepted document.
 * @param session The item's corpus path and instance token.
 * @param configuration The configuration.
 * @param view What the page shows besides the item.
 * @returns The response, or a developer error's page when a render fails.
 */
const itemPage = (
  accepted: Accepted,
  session: { readonly instance: string; readonly path: string },
  configuration: Configuration,
  view: ItemView,
): Response => {
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
          action: itemTarget(session.path, session.instance),
          method: "post",
          novalidate: true,
        },
        [slot(status.length), submit],
      );

      return pageHtml(
        locale,
        message(locale, "title", { state: message(locale, view.state), title }),
        [
          h("h1", {}, [text(title)]),
          home,
          h("div", { id: "playground-item" }, [...status.map((_, index) => slot(index)), form]),
        ],
        [...status, item.html],
      );
    }),
    {
      onFailure: failurePage,
      onSuccess: (html) => htmlResponse(200, html),
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
    case "pair": {
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
 * with the posted text and its invalid Controls, the first of which takes `autofocus`.
 *
 * @param target The item's instance and session.
 * @param configuration The configuration.
 * @param messages The validation messages.
 * @param posted The strings the post sent, by response.
 * @returns The response.
 */
const refusedPage = (
  target: { readonly instance: string; readonly session: Session },
  configuration: Configuration,
  messages: readonly ValidationMessage[],
  posted: Readonly<Record<string, readonly string[]>>,
): Response =>
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
 * Construct the page after a scored post: the Status part first, with `autofocus`, and the item
 * restored from the posted values, disabled with its Submit once the attempt limit is reached.
 *
 * @param target The item's instance and session, after the attempt.
 * @param configuration The configuration, which gives `maxAttempts` (0 means unlimited).
 * @param shown What the page shows.
 * @returns The response.
 */
const scoredPage = (
  target: { readonly instance: string; readonly session: Session },
  configuration: Configuration,
  shown: Shown,
): Response =>
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
 * Answer a failure of the corpus read: 404 for a path the corpus does not hold, and a developer
 * error's page when the corpus or its settings are missing.
 *
 * @param error The failure.
 * @returns The response.
 */
const corpusFailure = (
  error: Config.ConfigError | CorpusFileUnreadable | CorpusMissing | InvalidConfiguration,
): Response => (error._tag === "CorpusFileUnreadable" ? notFound() : failurePage(error));

/**
 * Open a document and answer with its item page, or with its refusals or unchecked reasons.
 *
 * @param playground The playground.
 * @param corpusPath The document's corpus path, as the request named it.
 * @returns The response.
 */
const openItem = Effect.fn("playground.openItem")(function* openItem(
  playground: Playground,
  corpusPath: string,
): Effect.fn.Return<
  Response,
  Config.ConfigError | CorpusFileUnreadable | CorpusMissing | InvalidConfiguration
> {
  const relative = joinedSegments(corpusPath.split("/"));
  if (Option.isNone(relative)) {
    return notFound();
  }

  const configuration = yield* configure(playground.configuration);
  const verdict = yield* open(relative.value, yield* readCorpusFile(relative.value));

  switch (verdict.verdict) {
    case "refused": {
      return verdictPage(
        relative.value,
        "Refused",
        verdict.refusals.map((refusal) => [
          { "data-rule": refusal.rule },
          describeRefusal(refusal),
        ]),
      );
    }
    case "unchecked": {
      return verdictPage(
        relative.value,
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
        path: relative.value,
        record: Option.none(),
      });

      return itemPage(verdict.accepted, { instance, path: relative.value }, configuration, {
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
 * @returns The response.
 */
const submit = Effect.fn("playground.submit")(function* submit(
  playground: Playground,
  request: Request,
  target: { readonly instance: string; readonly path: string },
): Effect.fn.Return<Response, InvalidConfiguration> {
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
 * Serve one package asset: decode its path segment by segment, refuse a path outside an open
 * item's package directory or of a type the playground does not serve, and send the bytes with the
 * asset headers.
 *
 * @param playground The playground.
 * @param pathname The request path, still percent-encoded.
 * @returns The response.
 */
const serveAsset = Effect.fn("playground.serveAsset")(function* serveAsset(
  playground: Playground,
  pathname: string,
): Effect.fn.Return<Response, Config.ConfigError | CorpusFileUnreadable | CorpusMissing> {
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
 * Route one request: the listing, an item page, a post, or an asset; anything else is a 404, and a
 * method a route does not take is a 405.
 *
 * @param playground The playground.
 * @param request The request.
 * @returns The response.
 */
const route = (
  playground: Playground,
  request: Request,
): Effect.Effect<
  Response,
  Config.ConfigError | CorpusFileUnreadable | CorpusMissing | InvalidConfiguration
> => {
  const url = new URL(request.url);
  const refusedMethod = Effect.succeed(
    notePage(405, "Method not allowed", `${request.method} is not taken at ${url.pathname}.`),
  );

  if (url.pathname === "/") {
    return request.method === "GET" ? Effect.succeed(listing()) : refusedMethod;
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

  return Effect.succeed(notFound());
};

/**
 * Construct a playground's Fetch handler, with its own sessions.
 *
 * It runs `open`, `configure` and the corpus read with `Effect.runPromise`; `render`,
 * `renderStatus`, `decode`, `checkResponses` and `score` are plain functions. A failure the
 * playground's settings or code cause answers with a 500 page that gives its message, and the
 * promise never rejects.
 *
 * @example
 *   const handle = createHandler({ configuration: { maxAttempts: 0 } });
 *   const response = await handle(new Request("http://127.0.0.1:5190/"));
 *   // 200, the listing
 *
 * @param settings The configuration input and the config provider, each optional.
 * @returns The handler.
 */
export const createHandler = (settings: PlaygroundSettings = {}): Handler => {
  const playground: Playground = {
    configuration: settings.configuration ?? {},
    sessions: new Map(),
  };
  const provided = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
    settings.provider === undefined
      ? effect
      : effect.pipe(Effect.provide(ConfigProvider.layer(settings.provider)));

  return (request) =>
    Effect.runPromise(
      provided(route(playground, request)).pipe(
        Effect.match({ onFailure: corpusFailure, onSuccess: (response) => response }),
        Effect.catchDefect((defect) =>
          Effect.succeed(
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
