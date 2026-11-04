import { assert, describe, it } from "@effect/vitest";
import { h, text } from "#plate/emit/node.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";

describe("parseHtml", () => {
  it("maps elements, attributes and text to the output tree's nodes, and drops comments", () => {
    assert.deepStrictEqual(parseHtml('<p class="a">x<!-- note --><em>y</em></p>'), [
      h("p", { class: "a" }, [text("x"), h("em", {}, [text("y")])]),
    ]);
  });

  it("names a prefixed attribute prefix:name, and an attribute with an empty prefix by its name", () => {
    assert.deepStrictEqual(
      parseHtml('<svg xmlns="http://www.w3.org/2000/svg"><use xlink:href="#a"></use></svg>'),
      [h("svg", { xmlns: "http://www.w3.org/2000/svg" }, [h("use", { "xlink:href": "#a" })])],
    );
  });

  it("gives a template element its content's child nodes", () => {
    assert.deepStrictEqual(parseHtml("<template><b>z</b></template>"), [
      h("template", {}, [h("b", {}, [text("z")])]),
    ]);
  });
});

describe("roundTrips", () => {
  it.each([
    ["ul > li > a", h("ul", {}, [h("li", {}, [text("a")])])],
    ["p > x", h("p", {}, [text("x")])],
    ["label > span > y", h("label", {}, [h("span", {}, [text("y")])])],
    ["svg > use with href", h("svg", {}, [h("use", { href: "#a" })])],
    [
      "table > tbody > tr > td > 1",
      h("table", {}, [h("tbody", {}, [h("tr", {}, [h("td", {}, [text("1")])])])]),
    ],
    ["textarea > \\nx", h("textarea", {}, [text("\nx")])],
    ["pre > \\nx", h("pre", {}, [text("\nx")])],
  ])("round-trips %s", (_name, node) => {
    assert.isTrue(roundTrips(node));
  });

  it("round-trips an input with a true attribute, which the parser gives as an empty value", () => {
    assert.isTrue(roundTrips(h("input", { checked: true, type: "radio" })));
  });

  it("round-trips a tree whose text children are split or empty, as HTML's text model merges them", () => {
    assert.isTrue(roundTrips(h("p", {}, [text("a"), text(""), text("b")])));
  });

  it.each([
    ["p > div, which the parser splits into three nodes", h("p", {}, [h("div", {})])],
    [
      "table > tr > td, where the parser inserts a tbody",
      h("table", {}, [h("tr", {}, [h("td", {}, [text("1")])])]),
    ],
    [
      "textarea > a\\r\\nb, whose CRLF the parser turns into LF",
      h("textarea", {}, [text("a\r\nb")]),
    ],
  ])("can fail: %s does not round-trip", (_name, node) => {
    assert.isFalse(roundTrips(node));
  });
});
