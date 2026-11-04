import { assert, describe, it } from "@effect/vitest";
import { h, text } from "#plate/emit/node.ts";
import { serialise, toHtml, VoidElementChildren } from "#plate/emit/serialise.ts";

describe("toHtml", () => {
  it("escapes &, < and > in text", () => {
    assert.strictEqual(toHtml(h("p", {}, [text("a & <b>")])), "<p>a &amp; &lt;b&gt;</p>");
  });

  it('double-quotes an attribute value and escapes & and " in it', () => {
    assert.strictEqual(
      toHtml(h("abbr", { title: 'x "y" & z' })),
      '<abbr title="x &quot;y&quot; &amp; z"></abbr>',
    );
  });

  it("writes a true attribute as its bare name, in key order, and gives a void element no end tag", () => {
    assert.strictEqual(
      toHtml(h("input", { checked: true, type: "radio" })),
      '<input checked type="radio">',
    );
  });

  it("throws VoidElementChildren for a void element with children", () => {
    assert.throws(() => {
      toHtml(h("br", {}, [text("x")]));
    }, VoidElementChildren);
  });

  it("concatenates a nested tree's tags with no whitespace between them", () => {
    const tree = h("div", { class: "item" }, [
      h("p", {}, [text("Pick "), h("em", {}, [text("one")]), text(".")]),
      h("ul", {}, [h("li", {}, [text("a")]), h("li", {}, [text("b")])]),
    ]);
    assert.strictEqual(
      toHtml(tree),
      '<div class="item"><p>Pick <em>one</em>.</p><ul><li>a</li><li>b</li></ul></div>',
    );
  });

  it("gives an empty svg descendant an explicit end tag", () => {
    assert.strictEqual(toHtml(h("svg", {}, [h("use", {})])), "<svg><use></use></svg>");
  });

  it("writes one extra line feed after a textarea's start tag when its text starts with one", () => {
    assert.strictEqual(toHtml(h("textarea", {}, [text("\nx")])), "<textarea>\n\nx</textarea>");
  });

  it("writes no extra line feed when a pre's text does not start with one", () => {
    assert.strictEqual(toHtml(h("pre", {}, [text("x")])), "<pre>x</pre>");
  });

  it("writes the extra line feed when the content's first characters come after an empty text node", () => {
    assert.strictEqual(
      toHtml(h("listing", {}, [text(""), text("\nx")])),
      "<listing>\n\nx</listing>",
    );
  });

  it("writes no extra line feed when the line feed follows an element", () => {
    assert.strictEqual(
      toHtml(h("pre", {}, [h("b", {}, [text("a")]), text("\nx")])),
      "<pre><b>a</b>\nx</pre>",
    );
  });
});

describe("serialise", () => {
  it("writes to the sink in more than one chunk, which joined equal toHtml", () => {
    const tree = h("label", { for: "c1" }, [h("input", { id: "c1", type: "checkbox" }), text("A")]);
    const chunks: string[] = [];
    serialise(tree, {
      write: (chunk) => {
        chunks.push(chunk);
      },
    });
    assert.isAbove(chunks.length, 1);
    assert.strictEqual(chunks.join(""), toHtml(tree));
    assert.strictEqual(chunks.join(""), '<label for="c1"><input id="c1" type="checkbox">A</label>');
  });
});
