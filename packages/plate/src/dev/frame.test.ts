import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { defaultTreeAdapter, parse } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { page, pageHeaders, pageHtml, slot } from "#plate/dev/frame.ts";
import type { Chrome } from "#plate/dev/frame.ts";
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
    "a page the playground answers carries exactly pageHeaders, whose policy allows frame-src 'self' and nothing 'unsafe-inline'",
    () =>
      Effect.gen(function* answered() {
        const response = yield* Effect.promise(() =>
          createHandler()(new Request("http://127.0.0.1:5190/no-such-page")),
        );
        const html = yield* Effect.promise(() => response.text());

        assert.strictEqual(response.status, 404);
        assert.deepStrictEqual(
          Object.fromEntries(response.headers),
          Object.fromEntries(Object.entries(pageHeaders)),
        );

        const directives = new Map(
          pageHeaders["content-security-policy"].split("; ").map((directive) => {
            const [name = "", ...sources] = directive.split(" ");

            return [name, sources] as const;
          }),
        );
        assert.deepStrictEqual(directives.get("frame-src"), ["'self'"]);
        for (const value of Object.values(pageHeaders)) {
          assert.notInclude(value, "unsafe-inline");
        }
        const { head, main } = partsOf(html);
        assert.deepStrictEqual(linkedSheets(head), sheetOrder);
        assertEndsWithThemeBox(main, "/no-such-page");
      }),
  );
});
