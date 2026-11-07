import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Node } from "#plate/emit/node.ts";
import {
  EscapableRawTextElementChild,
  EventHandlerAttribute,
  MalformedAttributeName,
  MalformedTagName,
  PlaintextElement,
  RawTextChildren,
  serialise,
  toHtml,
  toHtmlWithin,
  VoidElementChildren,
} from "#plate/emit/serialise.ts";

/**
 * Read what {@link toHtml} throws for a tree through effect's `Result`, so a refusal case asserts
 * the refusal's `_tag` and fields rather than its message.
 *
 * @param tree The tree the serialiser refuses.
 * @returns The thrown value, or undefined when `tree` is written.
 */
// oxlint-disable-next-line anti-slop/no-unknown-returns -- A thrown value can be any value; each case asserts its `_tag` and fields.
const refusalOf = (tree: Node): unknown =>
  Option.getOrUndefined(Result.getFailure(Result.try(() => toHtml(tree))));

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

  it("escapes < and > in an attribute value", () => {
    assert.strictEqual(toHtml(h("abbr", { title: "a<b>c" })), '<abbr title="a&lt;b&gt;c"></abbr>');
  });

  it("writes attribute names that hold hyphens, colons and upper case as they read", () => {
    assert.strictEqual(
      toHtml(h("svg", { "aria-hidden": "true", viewBox: "0 0 1 1", "xlink:href": "#a" })),
      '<svg aria-hidden="true" viewBox="0 0 1 1" xlink:href="#a"></svg>',
    );
  });

  it("throws MalformedTagName for a tag that is not a lower-case letter then letters, digits and hyphens", () => {
    for (const tag of ["", "Div", "1p", "-p", "p q", "p>", "p/", "x:y", "img src=x"]) {
      assert.throws(() => {
        toHtml(h(tag, {}));
      }, MalformedTagName);
      assert.throws(() => {
        toHtml(h("div", {}, [h(tag, {})]));
      }, MalformedTagName);
      assert.include(refusalOf(h(tag, {})), { _tag: "MalformedTagName", tag });
      assert.include(refusalOf(h("div", {}, [h(tag, {})])), { _tag: "MalformedTagName", tag });
    }
  });

  it("throws MalformedAttributeName for an empty name or one holding whitespace, a quote, >, /, = or a control", () => {
    const names = [
      "",
      "a b",
      "a\tb",
      "a\nb",
      'a"',
      "a'",
      "a>",
      "a/",
      "a=b",
      "a\u0000",
      "a\u007F",
      "a\u0085",
    ];
    for (const name of names) {
      assert.throws(() => {
        toHtml(h("p", { [name]: "x" }));
      }, MalformedAttributeName);
      assert.throws(() => {
        toHtml(h("input", { [name]: true }));
      }, MalformedAttributeName);
      assert.include(refusalOf(h("p", { [name]: "x" })), {
        _tag: "MalformedAttributeName",
        attribute: name,
        tag: "p",
      });
      assert.include(refusalOf(h("input", { [name]: true })), {
        _tag: "MalformedAttributeName",
        attribute: name,
        tag: "input",
      });
    }
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
    assert.include(refusalOf(h("br", {}, [text("x")])), { _tag: "VoidElementChildren", tag: "br" });
  });

  it("throws RawTextChildren for any child, text or element, of a raw-text element", () => {
    const tags = [
      "iframe",
      "noembed",
      "noframes",
      "noscript",
      "plaintext",
      "script",
      "style",
      "xmp",
    ];
    for (const tag of tags) {
      for (const child of [text("x"), text(""), h("b", {})]) {
        assert.throws(() => {
          toHtml(h(tag, {}, [child]));
        }, RawTextChildren);
        assert.include(refusalOf(h(tag, {}, [child])), { _tag: "RawTextChildren", tag });
      }
    }
  });

  it("throws PlaintextElement for an empty plaintext element, at the root or under another", () => {
    assert.throws(() => {
      toHtml(h("plaintext", {}));
    }, PlaintextElement);
    assert.throws(() => {
      toHtml(
        h("div", {}, [
          h("p", {}, [h("plaintext", {})]),
          h("button", { type: "submit" }, [text("Submit")]),
        ]),
      );
    }, PlaintextElement);
    assert.include(refusalOf(h("plaintext", {})), { _tag: "PlaintextElement" });
    assert.include(refusalOf(h("div", {}, [h("p", {}, [h("plaintext", {})])])), {
      _tag: "PlaintextElement",
    });
  });

  it("writes none of a plaintext element's bytes before refusing it", () => {
    const chunks: string[] = [];
    assert.throws(() => {
      serialise(h("div", {}, [h("plaintext", {})]), {
        write: (chunk) => {
          chunks.push(chunk);
        },
      });
    }, PlaintextElement);
    assert.deepStrictEqual(chunks, ["<div>"]);
  });

  it("throws EventHandlerAttribute for an attribute name starting with on, in any case, with any value", () => {
    for (const name of ["onclick", "ONLOAD", "onfocus", "oNmouseover", "on"]) {
      assert.throws(() => {
        toHtml(h("p", { [name]: "alert(1)" }));
      }, EventHandlerAttribute);
      assert.throws(() => {
        toHtml(h("input", { [name]: true }));
      }, EventHandlerAttribute);
      assert.throws(() => {
        toHtml(h("div", {}, [h("button", { [name]: "" }, [text("Submit")])]));
      }, EventHandlerAttribute);
      assert.include(refusalOf(h("p", { [name]: "alert(1)" })), {
        _tag: "EventHandlerAttribute",
        attribute: name,
        tag: "p",
      });
      assert.include(refusalOf(h("input", { [name]: true })), {
        _tag: "EventHandlerAttribute",
        attribute: name,
        tag: "input",
      });
      assert.include(refusalOf(h("div", {}, [h("button", { [name]: "" }, [text("Submit")])])), {
        _tag: "EventHandlerAttribute",
        attribute: name,
        tag: "button",
      });
    }
  });

  it("writes none of an element's bytes before refusing its event-handler attribute", () => {
    const chunks: string[] = [];
    assert.throws(() => {
      serialise(h("div", {}, [h("b", { onclick: "x" }, [text("a")])]), {
        write: (chunk) => {
          chunks.push(chunk);
        },
      });
    }, EventHandlerAttribute);
    assert.deepStrictEqual(chunks, ["<div>"]);
  });

  it("writes an attribute that holds on anywhere but at the start of its name", () => {
    assert.strictEqual(
      toHtml(h("button", { "aria-controls": "c1", "data-onclick": "x" }, [text("Go")])),
      '<button aria-controls="c1" data-onclick="x">Go</button>',
    );
  });

  it("writes a raw-text element with no children as its start and end tags", () => {
    assert.strictEqual(toHtml(h("script", { src: "a.js" })), '<script src="a.js"></script>');
  });

  it("throws EscapableRawTextElementChild for an element under textarea or title", () => {
    for (const tag of ["textarea", "title"]) {
      assert.throws(() => {
        toHtml(h(tag, {}, [text("a"), h("b", {}, [text("x")])]));
      }, EscapableRawTextElementChild);
      assert.include(refusalOf(h(tag, {}, [text("a"), h("b", {}, [text("x")])])), {
        _tag: "EscapableRawTextElementChild",
        child: "b",
        tag,
      });
    }
  });

  it("escapes a title's text", () => {
    assert.strictEqual(
      toHtml(h("title", {}, [text("a </title> & b")])),
      "<title>a &lt;/title&gt; &amp; b</title>",
    );
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

/**
 * A tree whose text nodes count the reads of their text.
 */
interface CountedTree {
  /**
   * How many distinct text nodes have had their text read.
   */
  readonly read: () => number;
  readonly tree: Node;
}

/**
 * Build a `div` of text nodes, each `length` characters long, whose `text` getter records the node
 * it was read on, so a case can show how far a walk went.
 *
 * @param count The number of text nodes.
 * @param length The characters in each.
 * @returns The tree and the count of text nodes read.
 */
const countedTree = (count: number, length: number): CountedTree => {
  const read = new Set<number>();
  const value = "y".repeat(length);
  const children = Array.from({ length: count }, (_, index): Node => ({
    kind: "text",
    get text() {
      read.add(index);

      return value;
    },
  }));

  return { read: () => read.size, tree: h("div", {}, children) };
};

describe("toHtmlWithin", () => {
  it("gives none for a tree past the budget, reading no text node after the chunk that passes it", () => {
    const { read, tree } = countedTree(1000, 1000);

    assert.isTrue(Option.isNone(toHtmlWithin(tree, 10_000)));
    assert.isBelow(read(), 20);
  });

  it("gives exactly toHtml's string under a budget at or above its length", () => {
    const { tree } = countedTree(1000, 1000);
    const html = toHtml(tree);

    assert.strictEqual(html.length, 1_000_011);
    assert.deepStrictEqual(toHtmlWithin(tree, html.length), Option.some(html));
    assert.deepStrictEqual(toHtmlWithin(tree, html.length + 1), Option.some(html));
    assert.isTrue(Option.isNone(toHtmlWithin(tree, html.length - 1)));
  });

  it("counts text as escaped, so a budget of its HTML as written holds and one less fails", () => {
    const tree = h("p", {}, [text("a & b")]);

    assert.deepStrictEqual(toHtmlWithin(tree, 16), Option.some("<p>a &amp; b</p>"));
    assert.isTrue(Option.isNone(toHtmlWithin(tree, 15)));
  });
});
