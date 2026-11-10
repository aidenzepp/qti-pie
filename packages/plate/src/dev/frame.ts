/**
 * The dev playground's page frame: what every HTML page the playground answers carries besides its
 * own content. It gives the page headers and the asset headers of rule `723e580c`, the shape of a
 * page before its chrome is added, and the writer that wraps a page in the document, links the
 * three stylesheets, ends `main` with the theme box and puts each part's HTML where its marker
 * stands. The two routes that serve files, `/assets/*` and a package's files, also share their
 * media types and how they decode a file's path from the request.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 *
 * @module
 */
import { createHash } from "node:crypto";
import { Option, Result } from "effect";
import { defaultTreeAdapter, parse } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { themeText } from "#plate/dev/theme.ts";
import type { Theme } from "#plate/dev/theme.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { toHtml } from "#plate/emit/serialise.ts";

/**
 * A hash source of a content security policy: `'sha256-` the SHA-256 digest in base64, and `'`.
 */
export type StyleSource = `'sha256-${string}'`;

/**
 * The headers of every HTML page (rule `723e580c`) as a function of the item style elements the
 * response carries: no script and nothing inline-allowing in any directive, posts only to this
 * origin, and no caching. The stylesheets and the theme box's redirect carry them too, a
 * stylesheet with its own type. The policy stands behind `check`'s URL pass: it refuses by
 * default and allows only what a rendered item loads, so markup the pass let through still cannot
 * run script or post to another origin.
 *
 * `object-src 'self'` lets an item's `object` load a package document from `/assets/`.
 * `frame-src 'self'` is there for Chromium, which also checks the document an `object` loads
 * into its nested browsing context against `frame-src` (then `child-src`, then `default-src`).
 * WebKit and Firefox check `object-src` alone, as CSP Level 3 says: an `object`'s requests,
 * the navigation of its nested browsing context included, fall under `object-src`, whose fallback
 * list holds neither `frame-src` nor `child-src`. The nested document is sandboxed by its own
 * header ({@link assetHeaders}), not by this policy.
 *
 * `style-src` is `'self'` and one hash source for each style element an item's HTML holds in the
 * response, from {@link pageResponse}. The renderer gives a content module no nonce to write, so
 * the page hashes the element's text instead, which needs no change to the renderer. The sources
 * differ with the response's content and are never constant; without an item style element the
 * list is `'self'` alone.
 *
 * @param styleSources The hash source of each style element the response carries, none by default.
 * @returns The headers.
 * @see https://w3c.github.io/webappsec-csp/#directive-object-src (CSP Level 3, object-src, its note)
 * @see https://w3c.github.io/webappsec-csp/#effective-directive-for-a-request (object, embed: object-src)
 * @see https://w3c.github.io/webappsec-csp/#directive-fallback-list (object-src falls back to default-src only)
 * @see https://github.com/WebKit/WebKit/commit/fb743bfbe7abba7c7553bf73eef0ba6d3d1cf1c4 (WebKit: the nested browsing context of an object or embed respects object-src)
 * @see https://github.com/WebKit/WebKit/blob/5e62f67e97ebccc9da92e1ab166cfe640767dea4/LayoutTests/http/tests/security/contentSecurityPolicy/object-src-allows-object-blocked-by-frame-src.html (WebKit's test: object-src 'self' with frame-src 'none' loads the document)
 * @see https://github.com/chromium/chromium/blob/3cb88deaf2150d76f4c414a90862f07440a404cc/content/browser/renderer_host/navigation_request.cc#L8405-L8423 (Chromium checks frame-src on every child navigation, an object's included)
 * @see https://github.com/chromium/chromium/blob/3cb88deaf2150d76f4c414a90862f07440a404cc/services/network/public/cpp/content_security_policy/content_security_policy.cc#L1281-L1308 (Chromium's frame-src falls back to child-src, then default-src)
 * @see https://github.com/mozilla-firefox/firefox/blob/935e9f7e39fcb9d738d3ac064905dcf4cc0c9cfc/dom/security/nsCSPUtils.cpp#L385-L388 (Firefox maps an object's load to object-src)
 * @see https://w3c.github.io/webappsec-csp/#match-element-to-source-list (CSP Level 3: an inline element matches a hash source of its text)
 */
export const pageHeaders = (styleSources: readonly StyleSource[] = []) =>
  ({
    "cache-control": "no-store",
    "content-security-policy": [
      "default-src 'none'",
      `style-src ${["'self'", ...styleSources].join(" ")}`,
      "img-src 'self' https: http:",
      "media-src 'self' https: http:",
      "object-src 'self'",
      "frame-src 'self'",
      "script-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
    "content-type": "text/html; charset=utf-8",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
  }) as const satisfies Readonly<Record<string, string>>;

/**
 * The directive of {@link pageHeaders}' policy that refuses every script.
 */
const scriptRefused = "script-src 'none'";

/**
 * The headers of every HTML page while the playground's runtime is on (issue m3d-13): the
 * {@link pageHeaders} with `script-src 'self'` in place of `script-src 'none'`, and every other
 * directive as it is.
 *
 * `'self'` admits the page's own origin's scripts and nothing more: no `'unsafe-inline'`, no
 * `'unsafe-eval'`, no host, no hash. The playground serves the runtime from its own origin, so the
 * policy admits that and still refuses an inline script, an event-handler attribute and a script
 * from any other origin. It is derived from {@link pageHeaders} so the two cannot drift, and the
 * stylesheets, redirects and package documents keep `script-src 'none'`, since none of them is a
 * page that loads the runtime.
 *
 * @see https://w3c.github.io/webappsec-csp/#grammardef-scheme-source (`'self'`, a source expression)
 */
export const runtimePageHeaders = {
  ...pageHeaders,
  "content-security-policy": pageHeaders["content-security-policy"].replace(
    scriptRefused,
    "script-src 'self'",
  ),
} as const satisfies Readonly<Record<string, string>>;

/**
 * The headers of every served asset besides its type: a package document is a live document, so
 * it runs in a sandbox with no script, plugins, base or form target.
 */
export const assetHeaders = {
  "content-security-policy":
    "sandbox; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "x-content-type-options": "nosniff",
} as const satisfies Readonly<Record<string, string>>;

/**
 * The media types the playground serves an item's files with, by lower-case extension: `/assets/*`
 * and a package's files route both serve by it, and refuse any other file.
 *
 * The list holds what an item body embeds: images, audio, video, text tracks, stylesheets and
 * HTML package documents. XML is absent on purpose, because an item document holds its correct
 * responses and mappings, which redaction keeps off the page.
 */
export const assetTypes: ReadonlyMap<string, string> = new Map([
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
 * Decode the path of a file a route serves below a root, each segment of the request path on its
 * own: none may fail to decode, be empty, `.` or `..`, or hold a separator, a backslash or NUL.
 *
 * A segment that decodes to a separator or a dot segment (`..%2Fx`, `%2e%2e%2f`) is refused, so the
 * decoded path holds exactly the directories the request path names and cannot climb out of the
 * root. A path that climbs and comes back is refused too, so a path names its file one way only.
 * `/assets/*` and a package's files route both read a file's path through it.
 *
 * @param segments The request path's segments below the route, still percent-encoded.
 * @returns The file's path from the root, its segments joined with `/`, or none when there is no
 *   segment or a segment does not decode or is refused.
 */
export const servedFilePath = (segments: readonly string[]): Option.Option<string> =>
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
 * What the theme box last stored: the accepted theme and the dark flag, `emptyTheme` and off at
 * start.
 */
export interface Appearance {
  readonly dark: boolean;
  readonly theme: Theme;
}

/**
 * An HTML page before its chrome is added: its status, the headers it carries besides
 * {@link pageHeaders} (a 405's `Allow`), its language and title, the nodes inside `main`, the HTML
 * of each part its markers hold, and where its theme box returns when the page's own address is
 * not the place to go back to.
 */
export interface Page {
  readonly back: Option.Option<string>;
  readonly headers: Readonly<Record<string, string>>;
  readonly locale: string;
  readonly main: readonly Node[];
  readonly parts: readonly string[];
  readonly status: number;
  readonly title: string;
}

/**
 * What every page carries besides its content: the theme box's stored appearance, the path and
 * query the box returns to, and, while the playground's runtime is on, the URL of the module the
 * head loads (issue m3d-13).
 *
 * A page with no `runtime` has no `script` element, as every page had before the runtime existed.
 */
export interface Chrome {
  readonly appearance: Appearance;
  readonly back: string;
  readonly runtime?: string;
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
export const slot = (index: number): Element => h("plate-slot", { "data-index": String(index) });

/**
 * Construct a page whose theme box returns to the page's own path and query.
 *
 * @param status The status code.
 * @param locale The page's language.
 * @param title The page's title, as the candidate reads it.
 * @param main The nodes inside `main`.
 * @param parts The HTML of each part, in marker order.
 * @param headers The headers the page carries besides {@link pageHeaders}, none by default.
 * @returns The page.
 */
export const page = (
  status: number,
  locale: string,
  title: string,
  main: readonly Node[],
  parts: readonly string[] = [],
  headers: Readonly<Record<string, string>> = {},
): Page => ({ back: Option.none(), headers, locale, main, parts, status, title });

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
 * Write a tree the playground built as HTML.
 *
 * The playground builds every page tree in its own code through `h`, and a rendered item reaches
 * a page as HTML in a part, never as a tree, so no host markup is written here and a refusal is a
 * defect in the playground's code that no caller recovers from: it is thrown, as before the
 * serialiser returned its refusals.
 *
 * @param node The tree to write.
 * @returns The HTML `toHtml` gives for `node`.
 * @throws {VoidElementChildren} When `node` breaks one of the serialiser's rules; it throws the
 *   reason `toHtml`'s `MarkupRefused` carries, which is any other class of `MarkupRefusal` for the
 *   rule broken.
 */
const written = (node: Node): string =>
  Result.getOrThrowWith(toHtml(node), (refused) => refused.reason);

/**
 * Write a whole HTML page: the doctype, `html` in the locale and with the `dark` class while the
 * flag is on, a head with the title and the three stylesheets, and `main` holding the page's nodes
 * and then the theme box, with each marker replaced by its part's HTML. While the chrome names a
 * runtime module, the head also holds one `script type="module"` that loads it, which a browser
 * defers until the document is parsed.
 *
 * @param shown The page.
 * @param chrome The stored appearance and the theme box's return path.
 * @returns The page's HTML.
 * @throws {VoidElementChildren} When the page's nodes break one of the serialiser's rules, a
 *   defect in the playground's code (see {@link written}).
 */
export const pageHtml = (shown: Page, chrome: Chrome): string => {
  const tree = h(
    "html",
    chrome.appearance.dark ? { class: "dark", lang: shown.locale } : { lang: shown.locale },
    [
      h("head", {}, [
        h("meta", { charset: "utf-8" }),
        h("meta", { content: "width=device-width, initial-scale=1", name: "viewport" }),
        h("title", {}, [text(shown.title)]),
        ...sheetLinks,
        ...(chrome.runtime === undefined
          ? []
          : [h("script", { src: chrome.runtime, type: "module" })]),
      ]),
      h("body", {}, [h("main", {}, [...shown.main, themeBox(chrome)])]),
    ],
  );

  let html = written(tree);
  for (const [index, part] of shown.parts.entries()) {
    html = html.replace(written(slot(index)), () => part);
  }

  return `<!doctype html>${html}`;
};

/**
 * Give the text of each style element in a parsed tree, as the browser's DOM holds it: the
 * element's text nodes joined, with the parser's own normalisation (line breaks as `\n`, NUL as
 * U+FFFD) already applied. An element inside a `template` is not live and has no entry.
 *
 * @param parent The node to search below.
 * @returns The text of each style element below `parent`, in document order.
 */
const styleTexts = (parent: DefaultTreeAdapterTypes.ParentNode): readonly string[] =>
  defaultTreeAdapter.getChildNodes(parent).flatMap((node) =>
    defaultTreeAdapter.isElementNode(node)
      ? [
          ...(defaultTreeAdapter.getTagName(node) === "style"
            ? [
                defaultTreeAdapter
                  .getChildNodes(node)
                  .flatMap((child) =>
                    defaultTreeAdapter.isTextNode(child)
                      ? [defaultTreeAdapter.getTextNodeContent(child)]
                      : [],
                  )
                  .join(""),
              ]
            : []),
          ...styleTexts(node),
        ]
      : [],
  );

/**
 * Give the hash source that admits an inline style element with a text: `'sha256-` the SHA-256 of
 * the text in UTF-8, in base64, and `'`.
 *
 * @param content The element's text content.
 * @returns The source.
 */
const styleSourceOf = (content: string): StyleSource =>
  `'sha256-${createHash("sha256").update(content, "utf-8").digest("base64")}'`;

/**
 * Give the hash source of each distinct style element a written page holds, once each, in
 * document order. The page is read with a spec-compliant HTML parser, as the browser reads it, so
 * the text hashed is the text the browser's check hashes: character references are not decoded
 * in a `style` of HTML, line breaks and NUL are normalised, and markup that only reads like an
 * element (escaped text, a comment, a `textarea`'s text) is not one.
 *
 * Every page the playground writes goes through here, so a page with no `<style` in it, which
 * cannot hold a style element, is not parsed.
 *
 * @param html The page's HTML as it is sent.
 * @returns The sources, none when the page holds no style element.
 */
const styleSources = (html: string): readonly StyleSource[] =>
  /<style/iu.test(html) ? [...new Set(styleTexts(parse(html)).map(styleSourceOf))] : [];

/**
 * Answer a page as the playground does: its HTML with the status and headers it carries over
 * {@link pageHeaders}, whose `style-src` admits each style element the written page holds by the
 * hash of its text, so a response admits its own item's style elements and no other.
 *
 * @param shown The page.
 * @param chrome The stored appearance and the theme box's return path.
 * @returns The response.
 * @throws {VoidElementChildren} When the page's nodes break one of the serialiser's rules, a
 *   defect in the playground's code (see {@link written}).
 */
export const pageResponse = (shown: Page, chrome: Chrome): Response => {
  const html = pageHtml(shown, chrome);

  return new Response(html, {
    headers: { ...pageHeaders(styleSources(html)), ...shown.headers },
    status: shown.status,
  });
};
