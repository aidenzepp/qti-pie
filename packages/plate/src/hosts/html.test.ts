import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { configure } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { htmlHost } from "#plate/hosts/html.ts";
import { message } from "#plate/messages.ts";
import { textOf } from "#plate/test/accessibility.ts";
import { readImports } from "#plate/test/imports.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * BG007's path under the corpus root, which the host takes as the item's location; its bytes are
 * read from the cache, never committed (rule `3ad87993`).
 */
const location = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * A hand-built Text Entry item whose integer is written in base 16: the largest byte, `ff`, is
 * correct, and `match_correct` scores it 1. Its location names no file; the host only puts it on
 * the verdict.
 */
const hexItem = {
  bytes: new TextEncoder().encode(
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" adaptive="false" time-dependent="false" xml:lang="en" identifier="largest-byte" title="The largest byte"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer"><qti-correct-response><qti-value>255</qti-value></qti-correct-response></qti-response-declaration><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-default-value><qti-value>0</qti-value></qti-default-value></qti-outcome-declaration><qti-item-body><p>The largest byte, in hexadecimal, is <qti-text-entry-interaction response-identifier="RESPONSE" base="16"/>.</p></qti-item-body><qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/></qti-assessment-item>',
  ),
  location: "largest-byte.xml",
} as const;

/**
 * The origin every request here names; the handler reads only the path.
 */
const origin = "http://host.test";

/**
 * Build the host as its callers do: read BG007's bytes from the cache, then yield the builder.
 *
 * @returns The host's Fetch handler.
 */
const hostOf = Effect.fnUntraced(function* hostOf() {
  const bytes = yield* readCorpusFile(location);

  return yield* htmlHost(location, bytes);
});

/**
 * List the elements of a tree in document order, each parent before its children.
 *
 * @param nodes The tree's nodes.
 * @returns Every element under them.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node): readonly Element[] =>
    node.kind === "element" ? [node, ...elementsOf(node.children)] : [],
  );

/**
 * Read a response's page as HTML.
 *
 * @param response The handler's response.
 * @returns The page's text and its elements, as a browser parses the page's markup.
 */
const pageOf = Effect.fnUntraced(function* pageOf(response: Response) {
  const html = yield* Effect.promise(() => response.text());

  return { elements: elementsOf(parseHtml(html)), html };
});

/**
 * Find the elements that carry a part's marker.
 *
 * @param elements The page's elements.
 * @param slot The part's `data-slot` value, read from the part table.
 * @returns The elements whose `data-slot` is `slot`, in document order.
 */
const slotted = (elements: readonly Element[], slot: string): readonly Element[] =>
  elements.filter((element) => element.attrs["data-slot"] === slot);

/**
 * Give the entry name of the Choice Control whose value is a choice's identifier, as a browser
 * posts it.
 *
 * @param elements The GET page's elements.
 * @param choice The choice's identifier.
 * @returns The Control's `name`.
 */
const controlName = (elements: readonly Element[], choice: string): string => {
  const control = slotted(elements, rowFor("choice-interaction", "control").slot).find(
    (element) => element.attrs["value"] === choice,
  );
  const name = control?.attrs["name"];

  return name === undefined || name === true
    ? assert.fail(`no Choice Control posts ${choice}`)
    : name;
};

/**
 * Give the entry name of the page's one Text Entry Control, as a browser posts it.
 *
 * @param elements The GET page's elements.
 * @returns The Control's `name`.
 */
const textEntryName = (elements: readonly Element[]): string => {
  const [control, ...others] = slotted(elements, rowFor("text-entry-interaction", "control").slot);
  const name = control?.attrs["name"];

  return others.length > 0 || name === undefined || name === true
    ? assert.fail("the page does not hold exactly one named Text Entry Control")
    : name;
};

/**
 * Construct the post a browser sends for the page's form.
 *
 * @param entries The form's entries, in order.
 * @returns A POST to the page, its body form-urlencoded.
 */
const formPost = (entries: readonly (readonly [string, string])[]): Request =>
  new Request(`${origin}/`, {
    body: new URLSearchParams(entries.map(([name, value]) => [name, value])).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  });

describe("the plain-HTML host", () => {
  it.effect(
    "answers a GET with a page that holds no script, links plate's sheet and holds the host's form around the item",
    () =>
      Effect.gen(function* getPage() {
        const handler = yield* hostOf();
        const response = yield* Effect.promise(() => handler(new Request(`${origin}/`)));
        const { elements, html } = yield* pageOf(response);
        const [form, ...otherForms] = elements.filter((element) => element.tag === "form");

        assert.strictEqual(response.status, 200);
        assert.match(response.headers.get("content-type") ?? "", /^text\/html;\s*charset=utf-8$/iu);
        assert.notInclude(html.toLowerCase(), "<script");
        assert.deepStrictEqual(
          elements.flatMap((element) =>
            element.tag === "link" && element.attrs["rel"] === "stylesheet"
              ? [element.attrs["href"]]
              : [],
          ),
          ["/styles.css"],
        );
        assert.lengthOf(otherForms, 0);

        const inside = elementsOf(form?.children ?? []);
        assert.strictEqual(form?.attrs["method"], "post");
        assert.lengthOf(slotted(inside, rowFor("item", "root").slot), 1);
        assert.deepStrictEqual(
          inside.flatMap((element) => (element.tag === "button" ? [element.attrs["type"]] : [])),
          ["submit"],
        );
        assert.lengthOf(slotted(elements, rowFor("item", "status").slot), 0);
      }),
  );

  it.effect("shows score 1 for a POST of BG007's correct answer, with no script", () =>
    Effect.gen(function* postCorrect() {
      const { locale } = yield* configure({});
      const handler = yield* hostOf();
      const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
      const response = yield* Effect.promise(() =>
        handler(formPost([[controlName(page.elements, "true"), "true"]])),
      );
      const { elements, html } = yield* pageOf(response);
      const [status, ...otherStatuses] = slotted(elements, rowFor("item", "status").slot);

      assert.strictEqual(response.status, 200);
      assert.notInclude(html.toLowerCase(), "<script");
      assert.lengthOf(otherStatuses, 0);
      assert.include(
        textOf(status ?? assert.fail("the page holds no Status part")),
        message(locale, "score", { score: "1" }),
      );
    }),
  );

  it.effect(
    "refuses a POST of two answers to the single response, with the Status part's messages and the form again",
    () =>
      Effect.gen(function* postTwo() {
        const { locale } = yield* configure({});
        const handler = yield* hostOf();
        const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
        const name = controlName(page.elements, "true");
        const response = yield* Effect.promise(() =>
          handler(
            formPost([
              [name, "true"],
              [name, "false"],
            ]),
          ),
        );
        const { elements } = yield* pageOf(response);
        const [status] = slotted(elements, rowFor("item", "status").slot);

        assert.strictEqual(response.status, 200);
        assert.include(
          textOf(status ?? assert.fail("the page holds no Status part")),
          message(locale, "notAccepted"),
        );
        assert.lengthOf(slotted(elements, rowFor("item", "message").slot), 1);
        assert.lengthOf(
          elements.filter((element) => element.tag === "form"),
          1,
        );
      }),
  );

  it.effect("scores a Text Entry's integer in the base it declares: ff in base 16 scores 1", () =>
    Effect.gen(function* postHex() {
      const { locale } = yield* configure({});
      const handler = yield* htmlHost(hexItem.location, hexItem.bytes);
      const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
      const response = yield* Effect.promise(() =>
        handler(formPost([[textEntryName(page.elements), "ff"]])),
      );
      const { elements } = yield* pageOf(response);
      const [status, ...otherStatuses] = slotted(elements, rowFor("item", "status").slot);

      assert.strictEqual(response.status, 200);
      assert.lengthOf(otherStatuses, 0);
      assert.lengthOf(slotted(elements, rowFor("item", "message").slot), 0);
      assert.include(
        textOf(status ?? assert.fail("the page holds no Status part")),
        message(locale, "score", { score: "1" }),
      );
    }),
  );

  it.effect(
    'keeps the Choice duty: its form carries autocomplete="off" and every page it answers says no-store',
    () =>
      Effect.gen(function* choiceDuty() {
        const handler = yield* hostOf();
        const get = yield* Effect.promise(() => handler(new Request(`${origin}/`)));
        const page = yield* pageOf(get);
        const post = yield* Effect.promise(() =>
          handler(formPost([[controlName(page.elements, "true"), "true"]])),
        );
        const posted = yield* pageOf(post);
        const elsewhere = yield* Effect.promise(() => handler(new Request(`${origin}/other`)));
        const put = yield* Effect.promise(() =>
          handler(new Request(`${origin}/`, { body: "", method: "PUT" })),
        );
        const unencoded = yield* Effect.promise(() =>
          handler(new Request(`${origin}/`, { body: "{}", method: "POST" })),
        );

        assert.isNotEmpty(slotted(page.elements, rowFor("choice-interaction", "control").slot));
        for (const elements of [page.elements, posted.elements]) {
          assert.deepStrictEqual(
            elements.flatMap((element) =>
              element.tag === "form" ? [element.attrs["autocomplete"]] : [],
            ),
            ["off"],
          );
        }

        assert.deepStrictEqual(
          [get, post, elsewhere, put, unencoded].map((response) => [
            response.status,
            response.headers.get("cache-control"),
          ]),
          [
            [200, "no-store"],
            [200, "no-store"],
            [404, "no-store"],
            [405, "no-store"],
            [415, "no-store"],
          ],
        );
      }),
  );

  it.effect("answers another path with 404 and another method with 405", () =>
    Effect.gen(function* otherRequests() {
      const handler = yield* hostOf();
      const elsewhere = yield* Effect.promise(() => handler(new Request(`${origin}/other`)));
      const put = yield* Effect.promise(() =>
        handler(new Request(`${origin}/`, { body: "", method: "PUT" })),
      );

      assert.strictEqual(elsewhere.status, 404);
      assert.strictEqual(put.status, 405);
      assert.strictEqual(put.headers.get("allow"), "GET, POST");
    }),
  );

  it.effect("answers with a 500 page and no form when the document is an accepted test", () =>
    Effect.gen(function* testRoot() {
      const testLocation = "QTI3_BeginnersGuide_Examples/BGtest.xml";
      const handler = yield* htmlHost(testLocation, yield* readCorpusFile(testLocation));
      const response = yield* Effect.promise(() => handler(new Request(`${origin}/`)));
      const { elements } = yield* pageOf(response);

      assert.strictEqual(response.status, 500);
      assert.strictEqual(response.headers.get("cache-control"), "no-store");
      assert.deepStrictEqual(
        elements.filter((element) => element.tag === "form"),
        [],
      );
    }),
  );

  it("imports only #plate/index.ts and node: modules, type imports included", () => {
    const { imports, unreadable } = readImports(
      readFileSync(new URL("html.ts", import.meta.url), "utf-8"),
    );

    assert.deepStrictEqual(unreadable, []);
    assert.include(
      imports.map(({ specifier }) => specifier),
      "#plate/index.ts",
    );
    assert.deepStrictEqual(
      imports.flatMap(({ specifier }) =>
        specifier === "#plate/index.ts" || specifier.startsWith("node:") ? [] : [specifier],
      ),
      [],
    );
  });
});
