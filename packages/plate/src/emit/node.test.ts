import { assert, describe, it } from "@effect/vitest";
import { h, text } from "#plate/emit/node.ts";

describe("h", () => {
  it("returns an element with the given tag, attributes and children", () => {
    const props = { class: "choice", id: "c1" };
    const children = [text("Paris")];
    const element = h("label", props, children);
    assert.strictEqual(element.kind, "element");
    assert.strictEqual(element.tag, "label");
    assert.strictEqual(element.attrs, props);
    assert.strictEqual(element.children, children);
    assert.deepStrictEqual(element.attrs, { class: "choice", id: "c1" });
  });

  it("keeps a true attribute as true", () => {
    const element = h("input", { checked: true, type: "radio" });
    assert.strictEqual(element.attrs["checked"], true);
    assert.strictEqual(element.attrs["type"], "radio");
  });

  it("keeps a Text child as the same object", () => {
    const child = text("Choose one.");
    const element = h("p", {}, [child]);
    assert.strictEqual(element.children.length, 1);
    assert.strictEqual(element.children[0], child);
    assert.strictEqual(element.children[0]?.kind, "text");
  });

  it("gives an element made with no children an empty children array", () => {
    const element = h("br", {});
    assert.deepStrictEqual(element.children, []);
  });
});
