import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
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

  it.effect("CAT/test.xml shows its refusal and no form", () =>
    Effect.gen(function* cat() {
      const { html, response } = yield* get(createHandler(), itemTarget(paths.cat));
      const rules = elementsOf(parseHtml(html)).flatMap((element) =>
        element.attrs["data-rule"] === undefined ? [] : [element.attrs["data-rule"]],
      );

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(rules, ["reader-refused"]);
      assert.notInclude(html, "<form");
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
});
