import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { defaultTreeAdapter, parse } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { createHandler, documents } from "#plate/dev/page.ts";
import type { Handler } from "#plate/dev/page.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { entryName } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { MessageKey } from "#plate/messages.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The origin every request is made against; the handler never opens it.
 */
const origin = "http://127.0.0.1:5190";

/**
 * The corpus paths of the documents the playground lists.
 */
const paths = {
  bg007: "QTI3_BPIG_Examples/items/BG007.xml",
  bg010: "QTI3_BPIG_Examples/items/BG010.xml",
  bg011: "QTI3_BeginnersGuide_Examples/items/BG011.xml",
  cat: "qtiv3-examples/CAT/test.xml",
} as const;

/**
 * The headers every page carries, exactly (`work/planning/mind/od14-decisions.md`, rule
 * `723e580c`).
 */
const pageHeaders = {
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'none'; style-src 'self'; img-src 'self' https: http:; media-src 'self' https: http:; object-src 'self'; script-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
} as const;

/**
 * The headers every served asset carries, exactly.
 */
const assetHeaders = {
  "content-security-policy":
    "sandbox; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "x-content-type-options": "nosniff",
} as const;

/**
 * The scratch folder this file owns, under the package's git-ignored `work/`.
 */
const scratch = path.resolve(import.meta.dirname, "..", "..", "work", "page-test");

/**
 * The hand-built item whose title holds a script element, inside the scratch corpus root.
 */
const hostile = "items/hostile.xml";

/**
 * The title of {@link hostile}, as the candidate would read it.
 */
const hostileTitle = "<script>alert(1)</script>";

/**
 * A handler over the scratch corpus root, which holds only {@link hostile}.
 */
const scratchHandler = createHandler({
  provider: ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: scratch }),
});

beforeAll(async () => {
  rmSync(scratch, { force: true, recursive: true });
  mkdirSync(path.join(scratch, "items"), { recursive: true });

  const bg007 = new TextDecoder().decode(await Effect.runPromise(readCorpusFile(paths.bg007)));
  writeFileSync(
    path.join(scratch, hostile),
    bg007.replace(
      'title="BG true false example "',
      'title="&lt;script&gt;alert(1)&lt;/script&gt;"',
    ),
  );
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

/**
 * A response with its body read as text.
 */
interface Answer {
  readonly html: string;
  readonly response: Response;
}

/**
 * Send one request to a handler and read the body as text.
 *
 * @param handle The handler.
 * @param request The request.
 * @returns The response and its body.
 */
const send = (handle: Handler, request: Request) =>
  Effect.promise(async (): Promise<Answer> => {
    const response = await handle(request);

    return { html: await response.text(), response };
  });

/**
 * Send a GET for a target to a handler.
 *
 * @param handle The handler.
 * @param target The path and query.
 * @returns The response and its body.
 */
const get = (handle: Handler, target: string) => send(handle, new Request(`${origin}${target}`));

/**
 * Post entries to a form action, as a browser posts a native form.
 *
 * @param handle The handler.
 * @param action The form's `action`.
 * @param entries The entries, in order.
 * @returns The response and its body.
 */
const post = (handle: Handler, action: string, entries: readonly (readonly [string, string])[]) => {
  const form = new FormData();
  for (const [name, value] of entries) {
    form.append(name, value);
  }

  return send(handle, new Request(new URL(action, origin), { body: form, method: "POST" }));
};

/**
 * The origin the theme cases send to, the name a browser shows, so an absolute `return` on it
 * reaches the second origin check.
 */
const themeOrigin = "http://localhost:5190";

/**
 * Send a GET for a target on {@link themeOrigin} and read the body as bytes.
 *
 * @param handle The handler.
 * @param target The path and query.
 * @returns The response and its body's bytes.
 */
const bytes = (handle: Handler, target: string) =>
  Effect.promise(async () => {
    const response = await handle(new Request(`${themeOrigin}${target}`));

    return { body: new Uint8Array(await response.arrayBuffer()), response };
  });

/**
 * Post the theme box's fields to `/theme` on {@link themeOrigin}.
 *
 * @param handle The handler.
 * @param entries The fields, in order.
 * @returns The response and its body.
 */
const postTheme = (handle: Handler, entries: readonly (readonly [string, string])[]) => {
  const form = new FormData();
  for (const [name, value] of entries) {
    form.append(name, value);
  }

  return send(handle, new Request(`${themeOrigin}/theme`, { body: form, method: "POST" }));
};

/**
 * Read the stored theme's CSS from `/theme.css` on {@link themeOrigin}.
 *
 * @param handle The handler.
 * @returns The response and its body.
 */
const themeSheet = (handle: Handler) => send(handle, new Request(`${themeOrigin}/theme.css`));

/**
 * A theme the box accepts: `--primary` in both blocks and `--font-sans` in `:root`.
 */
const acceptedTheme = `:root {
  --primary: oklch(0.205 0 0);
  --font-sans: "Inter", sans-serif;
}

.dark {
  --primary: oklch(0.922 0 0);
}
`;

/**
 * Assert that a response carries every header the listing carries, its type aside.
 *
 * @param listing The `GET /` response.
 * @param response The response to check.
 */
const assertPageHeaders = (listing: Response, response: Response): void => {
  for (const [name, value] of listing.headers) {
    if (name !== "content-type") {
      assert.strictEqual(response.headers.get(name), value, name);
    }
  }
  for (const [, value] of response.headers) {
    assert.notInclude(value, "unsafe-inline");
  }
};

/**
 * Give the target of the item page for a corpus path.
 *
 * @param corpusPath The document's corpus path.
 * @returns `/item?path=…`.
 */
const itemTarget = (corpusPath: string): string =>
  `/item?${new URLSearchParams({ path: corpusPath }).toString()}`;

/**
 * Collect every element of a tree in document order, the roots included.
 *
 * @param nodes The roots.
 * @returns The elements.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the text of nodes, as a reader reads it, with whitespace collapsed.
 *
 * @param nodes The nodes.
 * @returns Their text.
 */
const textOf = (nodes: readonly Node[]): string =>
  nodes
    .map((node) => (node.kind === "text" ? node.text : textOf(node.children)))
    .join("")
    .replaceAll(/\s+/gu, " ")
    .trim();

/**
 * Find the one element of a page that a predicate picks.
 *
 * @param html The page.
 * @param picks The predicate.
 * @returns The first element it picks; the test fails when there is none.
 */
const find = (html: string, picks: (element: Element) => boolean): Element => {
  const found = elementsOf(parseHtml(html)).find(picks);
  assert.isDefined(found);

  return found;
};

/**
 * Give the item page's form `action`.
 *
 * @param html The item page.
 * @returns The action.
 */
const actionOf = (html: string): string => {
  const { action } = find(html, (element) => element.tag === "form").attrs;
  assert.isString(action);

  return String(action);
};

/**
 * Give the instance token an item page's form posts under.
 *
 * @param html The item page.
 * @returns The token its action names.
 */
const instanceOf = (html: string): string =>
  new URL(actionOf(html), origin).searchParams.get("instance") ?? "";

/**
 * The stylesheets every page links in its head, in order: plate's, the playground's, the theme's.
 */
const sheetOrder = ["/styles.css", "/playground.css", "/theme.css"];

/**
 * An element as parse5's document parser gives it.
 */
type Parsed = DefaultTreeAdapterTypes.Element;

/**
 * Give the element children of a parse5 parent.
 *
 * @param parent The parent.
 * @returns Its children that are elements, in order.
 */
const childElements = (parent: DefaultTreeAdapterTypes.ParentNode): readonly Parsed[] =>
  parent.childNodes.filter((node): node is Parsed => defaultTreeAdapter.isElementNode(node));

/**
 * Read one attribute of a parse5 element.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, or `undefined` when the element has none.
 */
const attributeOf = (element: Parsed, name: string): string | undefined =>
  element.attrs.find((attribute) => attribute.name === name)?.value;

/**
 * Read a page as a browser reads a document, which keeps the `html` and `head` elements that
 * `parseHtml`'s fragment reading drops.
 *
 * @param html The page.
 * @returns Its `html` element; the test fails when there is none.
 */
const documentRoot = (html: string): Parsed => {
  const [root] = childElements(parse(html));
  assert.isDefined(root);

  return root;
};

/**
 * Give the targets of the stylesheets a page's head links, in order.
 *
 * @param html The page.
 * @returns Each `link rel="stylesheet"`'s `href`.
 */
const linkedSheets = (html: string): readonly string[] => {
  const head = childElements(documentRoot(html)).find((element) => element.tagName === "head");
  assert.isDefined(head);

  return childElements(head).flatMap((element) =>
    element.tagName === "link" && attributeOf(element, "rel") === "stylesheet"
      ? [attributeOf(element, "href") ?? ""]
      : [],
  );
};

/**
 * Find a page's theme box: the form that posts to `/theme`.
 *
 * @param html The page.
 * @returns The box; the test fails when there is none.
 */
const themeBoxOf = (html: string): Element =>
  find(html, (element) => element.tag === "form" && element.attrs["action"] === "/theme");

/**
 * Find the control of a form that a field name names.
 *
 * @param form The form.
 * @param name The field's name.
 * @returns The first control with that name; the test fails when there is none.
 */
const fieldOf = (form: Element, name: string): Element => {
  const found = elementsOf(form.children).find((element) => element.attrs["name"] === name);
  assert.isDefined(found);

  return found;
};

/**
 * Assert that a control of a form has a label in that form, through its `id`.
 *
 * @param form The form.
 * @param control The control.
 */
const assertLabelled = (form: Element, control: Element): void => {
  const { id } = control.attrs;
  assert.isString(id);
  assert.isDefined(
    elementsOf(form.children).find(
      (element) => element.tag === "label" && element.attrs["for"] === id,
    ),
  );
};

/**
 * Assert that a page ends its `main` with the theme box, outside every other form: a form that
 * posts to `/theme` and holds a labelled `theme` textarea, a labelled `dark` checkbox, a hidden
 * `return` field and a submit button.
 *
 * @param html The page.
 * @returns The box.
 */
const assertThemeBox = (html: string): Element => {
  const elements = elementsOf(parseHtml(html));
  const main = elements.find((element) => element.tag === "main");
  const box = main?.children.findLast((child): child is Element => child.kind === "element");
  assert.isDefined(box);

  const textarea = fieldOf(box, "theme");
  const dark = fieldOf(box, "dark");

  assert.strictEqual(box.tag, "form");
  assert.strictEqual(box.attrs["action"], "/theme");
  assert.strictEqual(box.attrs["method"], "post");
  for (const form of elements.filter((element) => element.tag === "form" && element !== box)) {
    assert.notInclude(elementsOf(form.children), box);
  }
  assert.strictEqual(textarea.tag, "textarea");
  assertLabelled(box, textarea);
  assert.strictEqual(dark.tag, "input");
  assert.strictEqual(dark.attrs["type"], "checkbox");
  assertLabelled(box, dark);
  assert.strictEqual(fieldOf(box, "return").attrs["type"], "hidden");
  assert.isDefined(
    elementsOf(box.children).find(
      (element) => element.tag === "button" && element.attrs["type"] === "submit",
    ),
  );

  return box;
};

/**
 * Give the classes of a page's `html` element.
 *
 * @param html The page.
 * @returns Its `class` value split on whitespace, empty when it has none.
 */
const htmlClasses = (html: string): readonly string[] =>
  (attributeOf(documentRoot(html), "class") ?? "").split(/\s+/u).filter((name) => name !== "");

/**
 * Report whether a page's theme box has its Dark checkbox checked.
 *
 * @param html The page.
 * @returns Whether the `dark` control carries `checked`.
 */
const darkChecked = (html: string): boolean =>
  Object.hasOwn(fieldOf(themeBoxOf(html), "dark").attrs, "checked");

/**
 * Give the path and query a page's theme box returns to.
 *
 * @param html The page.
 * @returns The `return` field's value.
 */
const returnOf = (html: string): string | true | undefined =>
  fieldOf(themeBoxOf(html), "return").attrs["value"];

/**
 * The state a page after a submit names in its title.
 */
type State = Extract<MessageKey, "notAccepted" | "responseRecorded" | "scored">;

/**
 * Assert spec §4.7's rule on a page after a submit: the Status part first in the item region, its
 * heading at the base level, exactly one `autofocus` where the state puts it, a title naming the
 * state, and no fragment in the action or in a redirect.
 *
 * @param answer The page after the submit.
 * @param state The state the page must name.
 * @param title The item's title.
 */
const assertAfterSubmit = (answer: Answer, state: State, title: string): void => {
  const { html, response } = answer;
  const all = elementsOf(parseHtml(html));
  const region = find(html, (element) => element.attrs["id"] === "playground-item");
  const [first, second] = region.children.filter((child) => child.kind === "element");
  const focused = all.filter((element) => Object.hasOwn(element.attrs, "autofocus"));
  const titleElement = all.find((element) => element.tag === "title");

  assert.strictEqual(first?.attrs["role"], "status");
  assert.strictEqual(second?.tag, "form");
  assert.strictEqual(
    elementsOf(first?.children ?? []).find((element) => /^h[1-6]$/u.test(element.tag))?.tag,
    "h2",
  );
  assert.lengthOf(focused, 1);
  if (state === "notAccepted") {
    assert.strictEqual(focused[0]?.attrs["aria-invalid"], "true");
  } else {
    assert.strictEqual(focused[0]?.attrs["role"], "status");
    assert.strictEqual(focused[0]?.attrs["id"], first?.attrs["id"]);
  }

  assert.strictEqual(
    textOf(titleElement?.children ?? []),
    message("en", "title", { state: message("en", state), title }),
  );
  assert.notInclude(actionOf(html), "#");
  assert.isNull(response.headers.get("location"));
};

describe("dev/page.ts", () => {
  it.effect("the listing has the four documents, in a main landmark under an h1", () =>
    Effect.gen(function* listing() {
      const { html, response } = yield* get(createHandler(), "/");
      const hrefs = elementsOf(parseHtml(html)).flatMap((element) =>
        element.tag === "a" ? [String(element.attrs["href"])] : [],
      );

      assert.strictEqual(response.status, 200);
      assert.match(html, /^<!doctype html><html lang="en">/u);
      assert.strictEqual(
        find(html, (element) => element.tag === "main").children.find(
          (child) => child.kind === "element",
        )?.kind,
        "element",
      );
      assert.isDefined(elementsOf(parseHtml(html)).find((element) => element.tag === "h1"));
      assert.deepStrictEqual(
        documents.map((entry) => entry.path),
        [paths.bg007, paths.bg010, paths.bg011, paths.cat],
      );
      for (const corpusPath of Object.values(paths)) {
        assert.include(hrefs, itemTarget(corpusPath));
      }
    }),
  );

  it.effect("CAT/test.xml shows its refusal and no item form", () =>
    Effect.gen(function* cat() {
      const { html, response } = yield* get(createHandler(), itemTarget(paths.cat));
      const elements = elementsOf(parseHtml(html));
      const rules = elements.flatMap((element) =>
        element.attrs["data-rule"] === undefined ? [] : [element.attrs["data-rule"]],
      );
      const actions = elements.flatMap((element) =>
        element.tag === "form" ? [element.attrs["action"]] : [],
      );

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(rules, ["reader-refused"]);
      assert.isTrue(actions.every((action) => action === "/theme"));
    }),
  );

  it.effect("[Q-2] [I-9b] a BG007 open, then a POST of the true choice, shows score 1", () =>
    Effect.gen(function* scored() {
      const handle = createHandler();
      const opened = yield* get(handle, itemTarget(paths.bg007));
      const instance = instanceOf(opened.html);
      const answered = yield* post(handle, actionOf(opened.html), [
        [entryName(instance, "RESPONSE"), "true"],
      ]);
      const status = find(answered.html, (element) => element.attrs["role"] === "status");

      assert.strictEqual(opened.response.status, 200);
      assert.notInclude(opened.html, "autofocus");
      assert.strictEqual(
        textOf(
          elementsOf(parseHtml(opened.html)).find((element) => element.tag === "title")?.children ??
            [],
        ),
        message("en", "title", {
          state: message("en", "answering"),
          title: "BG true false example",
        }),
      );
      assert.strictEqual(answered.response.status, 200);
      assert.include(textOf(status.children), message("en", "score", { score: "1" }));
      assertAfterSubmit(answered, "scored", "BG true false example");
    }),
  );

  it.effect(
    "[Q-2] two entries for BG007's single response are refused: atMost 1, on an invalid, focused Control, with both choices kept",
    () =>
      Effect.gen(function* overTicked() {
        const handle = createHandler();
        const opened = yield* get(handle, itemTarget(paths.bg007));
        const name = entryName(instanceOf(opened.html), "RESPONSE");
        const refused = yield* post(handle, actionOf(opened.html), [
          [name, "true"],
          [name, "false"],
        ]);
        const said = find(
          refused.html,
          (element) =>
            element.tag === "li" &&
            textOf(element.children) === message("en", "atMost", { n: "1" }),
        );
        const id = String(said.attrs["id"]);
        const control = find(refused.html, (element) =>
          String(element.attrs["aria-describedby"] ?? "")
            .split(" ")
            .includes(id),
        );

        const kept = elementsOf(parseHtml(refused.html)).flatMap((element) =>
          element.attrs["name"] === name && Object.hasOwn(element.attrs, "checked")
            ? [element.attrs["value"]]
            : [],
        );

        assert.strictEqual(control.attrs["name"], name);
        assert.strictEqual(control.attrs["aria-invalid"], "true");
        assert.isTrue(Object.hasOwn(control.attrs, "autofocus"));
        assert.deepStrictEqual(kept, ["true", "false"]);
        assertAfterSubmit(refused, "notAccepted", "BG true false example");
      }),
  );

  it.effect("[Q-5] BG011, which has no processing, records the response", () =>
    Effect.gen(function* recorded() {
      const handle = createHandler();
      const opened = yield* get(handle, itemTarget(paths.bg011));
      const answered = yield* post(handle, actionOf(opened.html), [
        [entryName(instanceOf(opened.html), "RESPONSE"), "Crows clean up."],
      ]);

      assertAfterSubmit(answered, "responseRecorded", "BG media example");
    }),
  );

  it.effect(
    "with maxAttempts 1 a scored submit disables every control and the Submit; with 0 none",
    () =>
      Effect.gen(function* attempts() {
        const submitOnce = Effect.fn("submitOnce")(function* submitOnce(maxAttempts: number) {
          const handle = createHandler({ configuration: { maxAttempts } });
          const opened = yield* get(handle, itemTarget(paths.bg007));
          const answered = yield* post(handle, actionOf(opened.html), [
            [entryName(instanceOf(opened.html), "RESPONSE"), "false"],
          ]);
          const form = find(answered.html, (element) => element.tag === "form");

          return elementsOf(form.children).filter((element) =>
            ["button", "input", "select", "textarea"].includes(element.tag),
          );
        });
        const limited = yield* submitOnce(1);
        const unlimited = yield* submitOnce(0);

        assert.isAbove(limited.length, 2);
        assert.isTrue(limited.some((element) => element.tag === "button"));
        assert.isTrue(limited.every((element) => Object.hasOwn(element.attrs, "disabled")));
        assert.isAbove(unlimited.length, 2);
        assert.isTrue(unlimited.every((element) => !Object.hasOwn(element.attrs, "disabled")));
      }),
  );

  it.effect(
    "[Q-20] no answer reaches the page: BG010's mapping keys appear in no HTML the handler returns",
    () =>
      Effect.gen(function* allowlist() {
        const handle = createHandler();
        const listed = yield* get(handle, "/");
        const opened = yield* get(handle, itemTarget(paths.bg010));
        const answered = yield* post(handle, actionOf(opened.html), [
          [entryName(instanceOf(opened.html), "RESPONSE"), "London"],
        ]);

        assert.include(answered.html, "London");
        for (const page of [listed, opened, answered]) {
          assert.notMatch(page.html, /york/iu);
        }
        assertAfterSubmit(answered, "scored", "BG Missing Word example");
      }),
  );

  it.effect("a document path that leaves the corpus root is refused with 404", () =>
    Effect.gen(function* traversal() {
      const handle = createHandler();
      const inside = yield* get(handle, itemTarget(paths.bg007));
      const parent = yield* get(handle, itemTarget(`../${paths.bg007}`));
      const climbing = yield* get(handle, itemTarget(`QTI3_BPIG_Examples/../../${paths.bg007}`));

      assert.strictEqual(inside.response.status, 200);
      assert.strictEqual(parent.response.status, 404);
      assert.strictEqual(climbing.response.status, 404);
    }),
  );

  it.effect(
    "an asset path holding ..%2F or %2e%2e%2f is refused with 404, where the plain path is served",
    () =>
      Effect.gen(function* assets() {
        const handle = createHandler();
        const airplane = "/assets/QTI3_BPIG_Examples/items/images/airplane.png";
        const before = yield* get(handle, airplane);
        yield* get(handle, itemTarget(paths.bg007));
        yield* get(handle, itemTarget(paths.bg011));

        const served = yield* get(handle, airplane);
        const crows = yield* get(
          handle,
          "/assets/QTI3_BeginnersGuide_Examples/items/resources/crows.jpg",
        );
        const encoded = yield* get(
          handle,
          "/assets/QTI3_BeginnersGuide_Examples/items/..%2F..%2FQTI3_BPIG_Examples/items/images/airplane.png",
        );
        const dotted = yield* get(
          handle,
          "/assets/QTI3_BeginnersGuide_Examples/items/%2e%2e%2f%2e%2e%2fQTI3_BPIG_Examples/items/images/airplane.png",
        );
        const document = yield* get(handle, `/assets/${paths.bg007}`);

        assert.strictEqual(before.response.status, 404);
        assert.strictEqual(served.response.status, 200);
        assert.strictEqual(served.response.headers.get("content-type"), "image/png");
        assert.strictEqual(crows.response.status, 200);
        assert.strictEqual(encoded.response.status, 404);
        assert.strictEqual(dotted.response.status, 404);
        assert.strictEqual(document.response.status, 404);
      }),
  );

  it.effect("the headers are on /, /item and /assets/*, and none allows 'unsafe-inline'", () =>
    Effect.gen(function* headers() {
      const handle = createHandler();
      const pages = [
        yield* get(handle, "/"),
        yield* get(handle, itemTarget(paths.bg007)),
        yield* get(handle, itemTarget(paths.cat)),
      ];
      const asset = yield* get(handle, "/assets/QTI3_BPIG_Examples/items/images/airplane.png");

      for (const page of pages) {
        for (const [name, value] of Object.entries(pageHeaders)) {
          assert.strictEqual(page.response.headers.get(name), value);
        }
        assert.strictEqual(page.response.headers.get("content-type"), "text/html; charset=utf-8");
      }
      assert.strictEqual(asset.response.status, 200);
      for (const [name, value] of Object.entries(assetHeaders)) {
        assert.strictEqual(asset.response.headers.get(name), value);
      }
      assert.isNull(asset.response.headers.get("cache-control"));
      for (const { response } of [...pages, asset]) {
        for (const [, value] of response.headers) {
          assert.notInclude(value, "unsafe-inline");
        }
      }
    }),
  );

  it.effect("a document title that holds <script> appears escaped", () =>
    Effect.gen(function* escaped() {
      const { html, response } = yield* get(scratchHandler, itemTarget(hostile));
      const heading = find(html, (element) => element.tag === "h1");

      assert.strictEqual(response.status, 200);
      assert.notInclude(html, "<script");
      assert.include(html, "&lt;script&gt;");
      assert.strictEqual(textOf(heading.children), hostileTitle);
    }),
  );

  it.effect(
    "GET /styles.css and /playground.css serve their files as text/css, and they and /theme.css carry the page headers",
    () =>
      Effect.gen(function* sheets() {
        const handle = createHandler();
        const listing = yield* get(handle, "/");
        const files = [
          ["/styles.css", "#plate/styles.css"],
          ["/playground.css", "#plate/dev/playground.css"],
        ] as const;

        for (const [target, specifier] of files) {
          const served = yield* bytes(handle, target);

          assert.strictEqual(served.response.status, 200, target);
          assert.strictEqual(
            served.response.headers.get("content-type"),
            "text/css; charset=utf-8",
          );
          assert.deepStrictEqual(
            served.body,
            new Uint8Array(readFileSync(new URL(import.meta.resolve(specifier)))),
          );
          assertPageHeaders(listing.response, served.response);
        }

        const theme = yield* themeSheet(handle);
        assert.strictEqual(theme.response.status, 200);
        assert.strictEqual(theme.response.headers.get("content-type"), "text/css; charset=utf-8");
        assertPageHeaders(listing.response, theme.response);
      }),
  );

  it.effect(
    "POST /theme stores an accepted theme and answers 303 to its return; /theme.css then serves it",
    () =>
      Effect.gen(function* stored() {
        const handle = createHandler();
        const listing = yield* get(handle, "/");
        const before = yield* themeSheet(handle);
        const target = `/item?path=${paths.bg007}`;
        const posted = yield* postTheme(handle, [
          ["theme", acceptedTheme],
          ["dark", "on"],
          ["return", target],
        ]);
        const after = yield* themeSheet(handle);

        assert.notInclude(before.html, "--primary");
        assert.strictEqual(posted.response.status, 303);
        assert.strictEqual(posted.response.headers.get("location"), target);
        assertPageHeaders(listing.response, posted.response);
        assert.include(
          after.html,
          ':root {\n  --primary: oklch(0.205 0 0);\n  --font-sans: "Inter", sans-serif;\n}',
        );
        assert.include(after.html, ".dark {\n  --primary: oklch(0.922 0 0);\n}");
        assert.include(after.html, ".dark {\n  color-scheme: dark;\n}");
      }),
  );

  it.effect(
    "a refused theme answers 400 with its refusal escaped and the page headers, and leaves /theme.css unchanged",
    () =>
      Effect.gen(function* refused() {
        const handle = createHandler();
        const listing = yield* get(handle, "/");
        yield* postTheme(handle, [["theme", acceptedTheme]]);

        const before = yield* themeSheet(handle);
        const answered = yield* postTheme(handle, [
          ["theme", ":root { --x: 1 }\n<b> { --y: 2 }"],
          ["return", "/"],
        ]);
        const after = yield* themeSheet(handle);
        const cause = find(answered.html, (element) => element.attrs["data-cause"] !== undefined);

        assert.strictEqual(answered.response.status, 400);
        assert.strictEqual(
          answered.response.headers.get("content-type"),
          "text/html; charset=utf-8",
        );
        assertPageHeaders(listing.response, answered.response);
        assert.isNull(answered.response.headers.get("location"));
        assert.strictEqual(cause.attrs["data-cause"], "selector");
        assert.include(textOf(cause.children), "<b>");
        assert.include(answered.html, "&lt;b&gt;");
        assert.notInclude(answered.html, "<b>");
        assert.include(before.html, "--primary");
        assert.strictEqual(after.html, before.html);
      }),
  );

  it.effect("a return that leaves the origin, or whose path begins with //, redirects to /", () =>
    Effect.gen(function* offsite() {
      const handle = createHandler();
      const returns = [
        "//evil.example/",
        "/\t/evil.example",
        "/\t\\evil.example",
        "/.//evil.example",
        "/x/..//evil.example",
        "http://localhost:5190//evil.example",
      ];

      for (const value of returns) {
        const posted = yield* postTheme(handle, [
          ["theme", acceptedTheme],
          ["return", value],
        ]);

        assert.strictEqual(posted.response.status, 303, JSON.stringify(value));
        assert.strictEqual(posted.response.headers.get("location"), "/", JSON.stringify(value));
      }
    }),
  );

  it.effect("an absent or empty return redirects to /", () =>
    Effect.gen(function* fallback() {
      const handle = createHandler();
      const absent = yield* postTheme(handle, [["theme", acceptedTheme]]);
      const empty = yield* postTheme(handle, [
        ["theme", acceptedTheme],
        ["return", ""],
      ]);

      for (const { response } of [absent, empty]) {
        assert.strictEqual(response.status, 303);
        assert.strictEqual(response.headers.get("location"), "/");
      }
    }),
  );

  it.effect(
    "the listing and the BG007 item page link the three sheets in order and end main with the theme box, outside the item form",
    () =>
      Effect.gen(function* themeBox() {
        const handle = createHandler();
        const listed = yield* get(handle, "/");
        const opened = yield* get(handle, itemTarget(paths.bg007));

        for (const page of [listed, opened]) {
          assert.deepStrictEqual(linkedSheets(page.html), sheetOrder);
          assertThemeBox(page.html);
        }
        assert.match(actionOf(opened.html), /^\/item\?/u);
      }),
  );

  it.effect(
    "the 400 page of a refused theme links the three sheets and carries the box, which returns where the post would have",
    () =>
      Effect.gen(function* refusedBox() {
        const target = itemTarget(paths.bg007);
        const answered = yield* postTheme(createHandler(), [
          ["theme", "body { color: red }"],
          ["return", target],
        ]);

        assert.strictEqual(answered.response.status, 400);
        assert.deepStrictEqual(linkedSheets(answered.html), sheetOrder);
        assert.strictEqual(fieldOf(assertThemeBox(answered.html), "return").attrs["value"], target);
      }),
  );

  it.effect(
    "after POST /theme with dark=on the item page's html has class dark and the box's Dark is checked; with the flag off neither",
    () =>
      Effect.gen(function* dark() {
        const handle = createHandler();
        const before = yield* get(handle, itemTarget(paths.bg007));
        yield* postTheme(handle, [
          ["theme", acceptedTheme],
          ["dark", "on"],
        ]);

        const on = yield* get(handle, itemTarget(paths.bg007));
        yield* postTheme(handle, [["theme", acceptedTheme]]);

        const off = yield* get(handle, itemTarget(paths.bg007));
        assert.notInclude(htmlClasses(before.html), "dark");
        assert.include(htmlClasses(on.html), "dark");
        assert.isTrue(darkChecked(on.html));
        assert.notInclude(htmlClasses(off.html), "dark");
        assert.isFalse(darkChecked(off.html));
      }),
  );

  it.effect("the box's return field holds the page's own path and query", () =>
    Effect.gen(function* returnField() {
      const handle = createHandler();
      const listed = yield* get(handle, "/");
      const opened = yield* get(handle, itemTarget(paths.bg007));
      const action = actionOf(opened.html);
      const answered = yield* post(handle, action, [
        [entryName(instanceOf(opened.html), "RESPONSE"), "true"],
      ]);
      assert.strictEqual(returnOf(listed.html), "/");
      assert.strictEqual(returnOf(opened.html), itemTarget(paths.bg007));
      assert.strictEqual(returnOf(answered.html), action);
    }),
  );

  it.effect("the box's textarea shows the stored theme's text, escaped", () =>
    Effect.gen(function* escapedTheme() {
      const handle = createHandler();
      const stored = ':root {\n  --font-sans: "A&B", serif;\n}\n';
      const posted = yield* postTheme(handle, [["theme", stored]]);
      const listed = yield* get(handle, "/");
      const textarea = fieldOf(themeBoxOf(listed.html), "theme");

      assert.strictEqual(posted.response.status, 303);
      assert.include(listed.html, "A&amp;B");
      assert.notInclude(listed.html, "A&B");
      assert.strictEqual(
        textarea.children.map((child) => (child.kind === "text" ? child.text : "")).join(""),
        stored,
      );
    }),
  );
});
