import { createHash } from "node:crypto";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { defaultTreeAdapter, parse } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { page, pageHeaders, pageHtml, pageResponse, slot } from "#plate/dev/frame.ts";
import type { Chrome, Page, StyleSource } from "#plate/dev/frame.ts";
import { createHandler } from "#plate/dev/page.ts";
import { emptyTheme } from "#plate/dev/theme.ts";
import { h, text } from "#plate/emit/node.ts";

/**
 * An element as parse5's document parser gives it.
 */
type Parsed = DefaultTreeAdapterTypes.Element;

/**
 * The stylesheets every page links in its head, in order: plate's, the playground's, the theme's.
 */
const sheetOrder = ["/styles.css", "/playground.css", "/theme.css"];

/**
 * The chrome of a page whose theme box returns to an item page, with the flag off.
 */
const chrome: Chrome = {
  appearance: { dark: false, theme: emptyTheme },
  back: "/item?path=a.xml",
};

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
 * Find the one child of a parse5 parent with a tag.
 *
 * @param parent The parent.
 * @param tag The child's tag.
 * @returns The child; the test fails when there is none.
 */
const childOf = (parent: DefaultTreeAdapterTypes.ParentNode, tag: string): Parsed => {
  const found = childElements(parent).find((element) => element.tagName === tag);
  assert.isDefined(found, tag);

  return found;
};

/**
 * The two places of a page the frame writes into: its head and its `main`.
 */
interface Framed {
  readonly head: Parsed;
  readonly main: Parsed;
}

/**
 * Read a page as a browser reads a document and give its head and its `main`.
 *
 * @param html The page.
 * @returns The `head` and `main` elements; the test fails when either is missing.
 */
const partsOf = (html: string): Framed => {
  const root = childOf(parse(html), "html");

  return { head: childOf(root, "head"), main: childOf(childOf(root, "body"), "main") };
};

/**
 * Give the targets of the stylesheets a head links, in order.
 *
 * @param head The head.
 * @returns Each `link rel="stylesheet"`'s `href`.
 */
const linkedSheets = (head: Parsed): readonly string[] =>
  childElements(head).flatMap((element) =>
    element.tagName === "link" && attributeOf(element, "rel") === "stylesheet"
      ? [attributeOf(element, "href") ?? ""]
      : [],
  );

/**
 * Assert that `main` ends with the theme box: a form that posts to `/theme` and returns to a path.
 *
 * @param main The `main` element.
 * @param back The path the box returns to.
 */
const assertEndsWithThemeBox = (main: Parsed, back: string): void => {
  const box = childElements(main).at(-1);
  assert.isDefined(box);
  assert.strictEqual(box.tagName, "form");
  assert.strictEqual(attributeOf(box, "action"), "/theme");
  assert.strictEqual(attributeOf(box, "method"), "post");

  const returned = childElements(box).find((element) => attributeOf(element, "name") === "return");
  assert.isDefined(returned);
  assert.strictEqual(attributeOf(returned, "value"), back);
};

/**
 * Give every element of a parse5 tree with a tag, each before its descendants.
 *
 * @param parent The root.
 * @param tag The tag.
 * @returns The elements, in document order.
 */
const elementsNamed = (
  parent: DefaultTreeAdapterTypes.ParentNode,
  tag: string,
): readonly Parsed[] =>
  parent.childNodes.flatMap((node) =>
    defaultTreeAdapter.isElementNode(node)
      ? [...(node.tagName === tag ? [node] : []), ...elementsNamed(node, tag)]
      : [],
  );

/**
 * Give the text of a parse5 element as the browser reads it: its text nodes, joined.
 *
 * @param element The element.
 * @returns Its text content.
 */
const textContentOf = (element: Parsed): string =>
  element.childNodes
    .flatMap((node) => (defaultTreeAdapter.isTextNode(node) ? [node.value] : []))
    .join("");

/**
 * Give the CSP source that admits an inline style element holding a text: `'sha256-` the SHA-256 of
 * its UTF-8 text in base64, and `'`.
 *
 * @param style The element's text content.
 * @returns The source.
 */
const sourceOf = (style: string): StyleSource =>
  `'sha256-${createHash("sha256").update(style, "utf-8").digest("base64")}'`;

/**
 * The shape of every hash source a policy lists: the base64 of a 32-byte digest.
 */
const hashSource = /^'sha256-[A-Za-z0-9+/]{43}='$/u;

/**
 * Give the directives of a content security policy, each with its sources.
 *
 * @param policy The header's value.
 * @returns The sources of each directive, by its name, in the policy's order.
 */
const directivesOf = (policy: string): ReadonlyMap<string, readonly string[]> =>
  new Map(
    policy.split("; ").map((directive) => {
      const [name = "", ...sources] = directive.split(" ");

      return [name, sources] as const;
    }),
  );

/**
 * Construct a page whose one part is an item's HTML holding the given style elements, each with
 * its own text, before the item's paragraph.
 *
 * @param parts The HTML of each part, in marker order.
 * @returns The page.
 */
const itemPage = (...parts: readonly string[]): Page =>
  page(
    200,
    "en",
    "Styled",
    [h("h1", {}, [text("Styled")]), ...parts.map((_, index) => slot(index))],
    parts,
  );

/**
 * Write an item's HTML: a Root holding the style elements, then a paragraph.
 *
 * @param styles The text of each style element.
 * @returns The HTML a part holds.
 */
const itemHtml = (...styles: readonly string[]): string =>
  `<div id="item">${styles.map((style) => `<style>${style}</style>`).join("")}<p>Item</p></div>`;

/**
 * Answer a page as the playground's handler does, and read what the answer carries.
 *
 * @param shown The page.
 * @returns The response, its HTML and the sources of its policy's `style-src`.
 */
const answerOf = (shown: Page) =>
  Effect.promise(async () => {
    const response = pageResponse(shown, chrome);
    const html = await response.text();
    const policy = response.headers.get("content-security-policy") ?? "";

    return { html, policy, response, sources: directivesOf(policy).get("style-src") ?? [] };
  });

describe("the page frame", () => {
  it("a page written through the frame links the three sheets, puts its parts at their markers and ends main with the theme box", () => {
    const part = '<p id="frame-part">A part</p>';
    const html = pageHtml(
      page(200, "en", "Frame", [h("h1", {}, [text("Frame")]), slot(0)], [part]),
      chrome,
    );
    const { head, main } = partsOf(html);

    assert.isTrue(html.startsWith("<!doctype html>"));
    assert.deepStrictEqual(linkedSheets(head), sheetOrder);
    assert.include(html, part);
    assert.notInclude(html, "plate-slot");
    assert.strictEqual(childElements(main)[0]?.tagName, "h1");
    assertEndsWithThemeBox(main, chrome.back);
  });

  it.effect(
    "[W0-DEVHOST.2] a page's policy admits an item's style element by a per-response source and nothing 'unsafe-inline'",
    () =>
      Effect.gen(function* admitting() {
        const styles = [".first { color: red }", ".second { color: blue }"] as const;
        const answers = yield* Effect.all(
          styles.map((style) => answerOf(itemPage(itemHtml(style)))),
        );

        for (const [index, answer] of answers.entries()) {
          const [element, ...others] = elementsNamed(parse(answer.html), "style");
          assert.isDefined(element);
          assert.lengthOf(others, 0);
          assert.strictEqual(textContentOf(element), styles[index]);
          assert.deepStrictEqual(answer.sources, ["'self'", sourceOf(textContentOf(element))]);
          assert.notInclude(answer.policy, "unsafe-inline");
        }

        assert.notDeepEqual(answers[0]?.sources, answers[1]?.sources);
      }),
  );

  it.effect(
    "[W0-DEVHOST.2] the source is the hash of the text the browser reads: line breaks normalised and NUL replaced",
    () =>
      Effect.gen(function* hashed() {
        const style = ".a {\r\n  color: red;\r  margin: 0;\0\n}";
        const answer = yield* answerOf(itemPage(itemHtml(style)));
        const [element] = elementsNamed(parse(answer.html), "style");
        assert.isDefined(element);

        assert.strictEqual(textContentOf(element), ".a {\n  color: red;\n  margin: 0;\uFFFD\n}");
        assert.deepStrictEqual(answer.sources, ["'self'", sourceOf(textContentOf(element))]);
      }),
  );

  it.effect(
    "[W0-DEVHOST.2] a page lists one source for each distinct style element of its parts, in order, and none for markup that only reads like one",
    () =>
      Effect.gen(function* listing() {
        const styled = yield* answerOf(
          itemPage(
            `<div><style media="screen">.a { color: red }</style><style>.b { color: blue }</style></div>`,
            itemHtml(".a { color: red }"),
          ),
        );
        const elements = elementsNamed(parse(styled.html), "style");
        assert.deepStrictEqual(styled.sources, [
          "'self'",
          ...new Set(elements.map((element) => sourceOf(textContentOf(element)))),
        ]);
        assert.lengthOf(styled.sources, 3);

        const lookalikes = yield* answerOf(
          itemPage(
            "<p>&lt;style&gt;.a { color: red }&lt;/style&gt;</p><styles>.b { color: blue }</styles><my-style>.c {}</my-style>",
          ),
        );
        assert.deepStrictEqual(lookalikes.sources, ["'self'"]);
        assert.strictEqual(lookalikes.policy, pageHeaders()["content-security-policy"]);
      }),
  );

  it.effect(
    "[W0-DEVHOST.2] a page with no style element answers with exactly the headers of pageHeaders()",
    () =>
      Effect.gen(function* plain() {
        const answer = yield* answerOf(itemPage('<p id="frame-part">A part</p>'));

        assert.deepStrictEqual(Object.fromEntries(answer.response.headers), pageHeaders());
      }),
  );

  it.effect(
    "[W0-DEVHOST.2] the policy pin reads the source apart from the constant directives",
    () =>
      Effect.gen(function* pinned() {
        const response = yield* Effect.promise(() =>
          createHandler()(new Request("http://127.0.0.1:5190/no-such-page")),
        );
        const html = yield* Effect.promise(() => response.text());
        const { "content-security-policy": policy = "", ...others } = Object.fromEntries(
          response.headers,
        );
        const { "content-security-policy": constantPolicy, ...constants } = pageHeaders();

        assert.strictEqual(response.status, 404);
        assert.deepStrictEqual(others, constants);

        const directives = directivesOf(policy);
        const constantDirectives = directivesOf(constantPolicy);
        assert.deepStrictEqual([...directives.keys()], [...constantDirectives.keys()]);
        for (const [name, sources] of constantDirectives) {
          if (name !== "style-src") {
            assert.deepStrictEqual(directives.get(name), sources, name);
          }
        }

        const [self, ...hashes] = directives.get("style-src") ?? [];
        assert.strictEqual(self, "'self'");
        for (const source of hashes) {
          assert.match(source, hashSource);
        }
        assert.deepStrictEqual(directives.get("frame-src"), ["'self'"]);
        for (const value of Object.values(pageHeaders())) {
          assert.notInclude(value, "unsafe-inline");
        }

        const admitted = sourceOf("p { color: red }");
        const varied = directivesOf(pageHeaders([admitted])["content-security-policy"]);
        assert.match(admitted, hashSource);
        assert.deepStrictEqual(varied.get("style-src"), ["'self'", admitted]);
        for (const [name, sources] of constantDirectives) {
          if (name !== "style-src") {
            assert.deepStrictEqual(varied.get(name), sources, name);
          }
        }

        const { head, main } = partsOf(html);
        assert.deepStrictEqual(linkedSheets(head), sheetOrder);
        assertEndsWithThemeBox(main, "/no-such-page");
      }),
  );
});
