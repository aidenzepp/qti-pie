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
import { Option, Result } from "effect";
import { themeText } from "#plate/dev/theme.ts";
import type { Theme } from "#plate/dev/theme.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { toHtml } from "#plate/emit/serialise.ts";

/**
 * The headers of every HTML page (rule `723e580c`): no script and no `'unsafe-inline'` in any
 * directive, posts only to this origin, and no caching. The stylesheets and the theme box's
 * redirect carry them too, a stylesheet with its own type. The policy stands behind `check`'s URL
 * pass: it refuses by default and allows only what a rendered item loads, so markup the pass let
 * through still cannot run script or post to another origin.
 *
 * `object-src 'self'` lets an item's `object` load a package document from `/assets/`.
 * `frame-src 'self'` is there for Chromium, which also checks the document an `object` loads
 * into its nested browsing context against `frame-src` (then `child-src`, then `default-src`).
 * WebKit and Firefox check `object-src` alone, as CSP Level 3 says: an `object`'s requests,
 * the navigation of its nested browsing context included, fall under `object-src`, whose fallback
 * list holds neither `frame-src` nor `child-src`. The nested document is sandboxed by its own
 * header ({@link assetHeaders}), not by this policy.
 *
 * @see https://w3c.github.io/webappsec-csp/#directive-object-src (CSP Level 3, object-src, its note)
 * @see https://w3c.github.io/webappsec-csp/#effective-directive-for-a-request (object, embed: object-src)
 * @see https://w3c.github.io/webappsec-csp/#directive-fallback-list (object-src falls back to default-src only)
 * @see https://github.com/WebKit/WebKit/commit/fb743bfbe7abba7c7553bf73eef0ba6d3d1cf1c4 (WebKit: the nested browsing context of an object or embed respects object-src)
 * @see https://github.com/WebKit/WebKit/blob/5e62f67e97ebccc9da92e1ab166cfe640767dea4/LayoutTests/http/tests/security/contentSecurityPolicy/object-src-allows-object-blocked-by-frame-src.html (WebKit's test: object-src 'self' with frame-src 'none' loads the document)
 * @see https://github.com/chromium/chromium/blob/3cb88deaf2150d76f4c414a90862f07440a404cc/content/browser/renderer_host/navigation_request.cc#L8405-L8423 (Chromium checks frame-src on every child navigation, an object's included)
 * @see https://github.com/chromium/chromium/blob/3cb88deaf2150d76f4c414a90862f07440a404cc/services/network/public/cpp/content_security_policy/content_security_policy.cc#L1281-L1308 (Chromium's frame-src falls back to child-src, then default-src)
 * @see https://github.com/mozilla-firefox/firefox/blob/935e9f7e39fcb9d738d3ac064905dcf4cc0c9cfc/dom/security/nsCSPUtils.cpp#L385-L388 (Firefox maps an object's load to object-src)
 */
export const pageHeaders = {
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
 * What every page carries besides its content: the theme box's stored appearance, and the path and
 * query the box returns to.
 */
export interface Chrome {
  readonly appearance: Appearance;
  readonly back: string;
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
 * Write a whole HTML page: the doctype, `html` in the locale and with the `dark` class while the
 * flag is on, a head with the title and the three stylesheets, and `main` holding the page's nodes
 * and then the theme box, with each marker replaced by its part's HTML.
 *
 * @param shown The page.
 * @param chrome The stored appearance and the theme box's return path.
 * @returns The page's HTML.
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
