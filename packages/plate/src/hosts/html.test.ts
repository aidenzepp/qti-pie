import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { htmlHost, itemHost } from "#plate/hosts/html.ts";
import { message } from "#plate/messages.ts";
import type { Item } from "#plate/model/item.ts";
import { textOf } from "#plate/test/accessibility.ts";
import { readImports } from "#plate/test/imports.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

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
 * An item built by hand, as the model builds no interaction bound to a record yet: one Text Entry,
 * for a string, bound to the record response `ANSWER`, and no response processing.
 */
const answerItem: Item = {
  body: [
    {
      ariaLabel: Option.none(),
      ariaLabelledby: Option.none(),
      base: 10,
      baseType: "string",
      cardinality: "single",
      class: "",
      expectedLength: Option.none(),
      kind: "text-entry",
      path: "qti-assessment-item/qti-item-body/qti-text-entry-interaction",
      patternMask: Option.none(),
      patternMaskMessage: Option.none(),
      placeholder: Option.none(),
      response: "ANSWER",
    },
  ],
  document: "answer.xml",
  identifier: "answer",
  lang: Option.some("en"),
  outcomes: new Map(),
  processing: Option.none(),
  records: new Map([
    ["ANSWER", { correct: Option.none(), defaultValue: Option.none(), identifier: "ANSWER" }],
  ]),
  responses: new Map(),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Answer",
  unsupported: [],
};

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
 * Read which of a page's Choice Controls are checked.
 *
 * @param elements The page's elements.
 * @returns Each Choice Control's `value` with whether it carries `checked`, in document order.
 */
const choiceStates = (elements: readonly Element[]): readonly (readonly [unknown, boolean])[] =>
  slotted(elements, rowFor("choice-interaction", "control").slot).map((control) => [
    control.attrs["value"],
    control.attrs["checked"] !== undefined,
  ]);

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

/**
 * Construct the post a browser sends for a page whose form is `multipart/form-data`. The request
 * writes its own `content-type`, with the boundary.
 *
 * @param entries The form's entries, in order.
 * @returns A POST to the page, its body multipart.
 */
const multipartPost = (entries: readonly (readonly [string, string])[]): Request => {
  const body = new FormData();
  for (const [name, value] of entries) {
    body.append(name, value);
  }

  return new Request(`${origin}/`, { body, method: "POST" });
};

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
          inside.flatMap((element) =>
            element.tag === "button"
              ? [[element.attrs["type"], Object.hasOwn(element.attrs, "hidden")]]
              : [],
          ),
          [
            ["submit", true],
            ["submit", false],
          ],
        );
        assert.lengthOf(slotted(elements, rowFor("item", "status").slot), 0);
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "shows score 1 for a POST of BG007's correct answer, with no script",
    () =>
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
    { tags: ["corpus"] },
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
    { tags: ["corpus"] },
  );

  it.effect(
    "[W0-HOSTS] a multipart/form-data POST of the correct answer scores 1, with no script",
    () =>
      Effect.gen(function* postCorrectMultipart() {
        const { locale } = yield* configure({});
        const handler = yield* hostOf();
        const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
        const response = yield* Effect.promise(() =>
          handler(multipartPost([[controlName(page.elements, "true"), "true"]])),
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
    { tags: ["corpus"] },
  );

  it.effect(
    "[W0-HOSTS] a multipart POST of two answers to the single response is refused with the Status messages and the form again",
    () =>
      Effect.gen(function* postTwoMultipart() {
        const { locale } = yield* configure({});
        const handler = yield* hostOf();
        const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
        const name = controlName(page.elements, "true");
        const response = yield* Effect.promise(() =>
          handler(
            multipartPost([
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
    { tags: ["corpus"] },
  );

  it.effect("[W0-HOSTS] a multipart body that is not multipart answers 400", () =>
    Effect.gen(function* unreadableMultipart() {
      const configuration = yield* configure({});
      const handler = itemHost(acceptForTest(answerItem), configuration);
      const response = yield* Effect.promise(() =>
        handler(
          new Request(`${origin}/`, {
            body: "not a form",
            headers: { "content-type": "multipart/form-data; boundary=x" },
            method: "POST",
          }),
        ),
      );

      assert.strictEqual(response.status, 400);
      assert.lengthOf(
        elementsOf(parseHtml(yield* Effect.promise(() => response.text()))).filter(
          (element) => element.tag === "form",
        ),
        0,
      );
    }),
  );

  it.effect("[W0-HOSTS] a POST of another content type still answers 415", () =>
    Effect.gen(function* otherTypes() {
      const configuration = yield* configure({});
      const handler = itemHost(acceptForTest(answerItem), configuration);
      const statuses = yield* Effect.promise(() =>
        Promise.all(
          ["text/plain", "application/json", "multipart/mixed; boundary=x"].map((type) =>
            handler(
              new Request(`${origin}/`, {
                body: "a",
                headers: { "content-type": type },
                method: "POST",
              }),
            ).then(({ status }) => status),
          ),
        ),
      );

      assert.deepStrictEqual(statuses, [415, 415, 415]);
    }),
  );

  it.effect(
    "[W0-HOSTS] the host's posted strings come through postedStrings: a refused form-urlencoded post shows the posted choices checked",
    () =>
      Effect.gen(function* refusedShowsPosted() {
        const handler = yield* hostOf();
        const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
        const name = controlName(page.elements, "true");
        const refused = yield* pageOf(
          yield* Effect.promise(() =>
            handler(
              formPost([
                [name, "true"],
                [name, "false"],
              ]),
            ),
          ),
        );

        assert.deepStrictEqual(choiceStates(page.elements), [
          ["true", false],
          ["false", false],
        ]);
        assert.deepStrictEqual(choiceStates(refused.elements), [
          ["true", true],
          ["false", true],
        ]);
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "[W0-DEFAULT-SUBMIT] the HTML host's form begins with a hidden default submit and ends with the visible Submit",
    () =>
      Effect.gen(function* defaultSubmitFirst() {
        const handler = yield* htmlHost(hexItem.location, hexItem.bytes);
        const { elements } = yield* pageOf(
          yield* Effect.promise(() => handler(new Request(`${origin}/`))),
        );
        const form = elements.find((element) => element.tag === "form");
        const children = (form?.children ?? []).filter(
          (child): child is Element => child.kind === "element",
        );
        const [first, root, last, ...others] = children;

        assert.lengthOf(others, 0);
        assert.strictEqual(first?.tag, "button");
        assert.strictEqual(first?.attrs["type"], "submit");
        assert.isTrue(Object.hasOwn(first?.attrs ?? {}, "hidden"));
        assert.isFalse(Object.hasOwn(first?.attrs ?? {}, "name"));
        assert.isFalse(Object.hasOwn(first?.attrs ?? {}, "aria-hidden"));
        assert.isFalse(Object.hasOwn(first?.attrs ?? {}, "tabindex"));
        assert.isTrue(Object.hasOwn(root?.attrs ?? {}, "lang"));
        assert.strictEqual(last?.tag, "button");
        assert.strictEqual(last?.attrs["type"], "submit");
        assert.strictEqual(textOf(last ?? assert.fail("the form has no last button")), "Submit");
        assert.isFalse(Object.hasOwn(last?.attrs ?? {}, "hidden"));
      }),
  );

  it.effect("[W0-DEFAULT-SUBMIT] a form-urlencoded post with no button entry still scores", () =>
    Effect.gen(function* postWithoutButton() {
      const { locale } = yield* configure({});
      const handler = yield* htmlHost(hexItem.location, hexItem.bytes);
      const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
      const buttons = page.elements.filter((element) => element.tag === "button");

      // No button of the form names an entry, so a post through either submit carries only the
      // Text Entry's entry, which is what this post sends.
      assert.isAbove(buttons.length, 0);
      assert.isTrue(buttons.every((button) => !Object.hasOwn(button.attrs, "name")));

      const response = yield* Effect.promise(() =>
        handler(formPost([[textEntryName(page.elements), "ff"]])),
      );
      const { elements } = yield* pageOf(response);
      const [status] = slotted(elements, rowFor("item", "status").slot);

      assert.strictEqual(response.status, 200);
      assert.lengthOf(slotted(elements, rowFor("item", "message").slot), 0);
      assert.include(
        textOf(status ?? assert.fail("the page holds no Status part")),
        message(locale, "score", { score: "1" }),
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
    { tags: ["corpus"] },
  );

  it.effect(
    "answers another path with 404 and another method with 405",
    () =>
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
    { tags: ["corpus"] },
  );

  it.effect(
    "answers with a 500 page and no form when the document is an accepted test",
    () =>
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
    { tags: ["corpus"] },
  );

  it.effect(
    "[Q-20] record binding in the page: decodes a post for a record-bound Text Entry under its record binding, recording one entry and refusing two",
    () =>
      Effect.gen(function* postRecord() {
        const configuration = yield* configure({});
        const { locale } = configuration;
        const handler = itemHost(acceptForTest(answerItem), configuration);
        const page = yield* pageOf(yield* Effect.promise(() => handler(new Request(`${origin}/`))));
        const name = textEntryName(page.elements);
        const one = yield* Effect.promise(() => handler(formPost([[name, "abc"]])));
        const two = yield* Effect.promise(() =>
          handler(
            formPost([
              [name, "abc"],
              [name, "def"],
            ]),
          ),
        );
        const recorded = yield* pageOf(one);
        const refused = yield* pageOf(two);
        const [recordedStatus] = slotted(recorded.elements, rowFor("item", "status").slot);
        const [refusedStatus] = slotted(refused.elements, rowFor("item", "status").slot);
        const refusals = slotted(refused.elements, rowFor("item", "message").slot);

        assert.deepStrictEqual([one.status, two.status], [200, 200]);
        assert.include(
          textOf(recordedStatus ?? assert.fail("the recorded page holds no Status part")),
          message(locale, "responseRecorded"),
        );
        assert.lengthOf(slotted(recorded.elements, rowFor("item", "message").slot), 0);
        assert.include(
          textOf(refusedStatus ?? assert.fail("the refused page holds no Status part")),
          message(locale, "notAccepted"),
        );
        assert.deepStrictEqual(
          refusals.map((refusal) => textOf(refusal)),
          [message(locale, "malformedSingleMany")],
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
