import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  attr,
  attributePath,
  doc,
  el,
  entity,
  mathmlNamespace,
  qtiNamespace,
  text,
  walk,
  xmlNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";

/**
 * A namespace no QTI document uses, for elements that share a local name with a QTI element.
 */
const otherNamespace = "urn:example:other";

/**
 * Collect every path {@link walk} gives a document, in the order it gives them.
 *
 * @param document The document to walk.
 * @returns The element paths in document order.
 */
const pathsOf = (document: SourceDocument): readonly string[] =>
  Array.from(walk(document), (visit) => visit.path);

/**
 * Find the path {@link walk} gives one element of a document, by identity.
 *
 * @param document The document to walk.
 * @param element The element to find.
 * @returns The element's path, or `undefined` when the walk never reaches it.
 */
const pathOf = (document: SourceDocument, element: SourceElement): string | undefined =>
  [...walk(document)].find((visit) => visit.element === element)?.path;

describe("walk paths", () => {
  it("names a QTI element by its local name alone, as BG007's choice interaction", () => {
    const interaction = el("qti-choice-interaction");
    const document = doc(
      "BG007.xml",
      el(
        "qti-assessment-item",
        [],
        [el("qti-response-declaration"), el("qti-item-body", [], [interaction])],
      ),
    );
    assert.strictEqual(
      pathOf(document, interaction),
      "qti-assessment-item/qti-item-body/qti-choice-interaction",
    );
  });

  it("adds [n] only for same-named siblings", () => {
    const document = doc(
      "fractions_deps_2.xml",
      el(
        "qti-assessment-item",
        [],
        [
          el(
            "qti-item-body",
            [],
            [
              el(
                "div",
                [],
                [
                  el("p"),
                  text("\n"),
                  el("qti-portable-custom-interaction"),
                  entity("nbsp"),
                  el("qti-portable-custom-interaction"),
                ],
              ),
            ],
          ),
          el("div"),
        ],
      ),
    );
    assert.deepStrictEqual(pathsOf(document), [
      "qti-assessment-item",
      "qti-assessment-item/qti-item-body",
      "qti-assessment-item/qti-item-body/div",
      "qti-assessment-item/qti-item-body/div/p",
      "qti-assessment-item/qti-item-body/div/qti-portable-custom-interaction[1]",
      "qti-assessment-item/qti-item-body/div/qti-portable-custom-interaction[2]",
      "qti-assessment-item/div",
    ]);
  });

  it("counts siblings as same-named only when both namespace and local name match", () => {
    const document = doc(
      "mixed.xml",
      el("qti-item-body", [], [el("p"), el("p", [], [], otherNamespace), el("p")]),
    );
    assert.deepStrictEqual(pathsOf(document), [
      "qti-item-body",
      "qti-item-body/p[1]",
      `qti-item-body/{${otherNamespace}}p`,
      "qti-item-body/p[2]",
    ]);
  });

  it("names a MathML child as {http://www.w3.org/1998/Math/MathML}math", () => {
    const identifier = el("mi", [], [text("x")], mathmlNamespace);
    const math = el("math", [], [identifier], mathmlNamespace);
    const document = doc("MathML.xml", el("qti-item-body", [], [el("p", [], [math])]));
    assert.strictEqual(
      pathOf(document, math),
      "qti-item-body/p/{http://www.w3.org/1998/Math/MathML}math",
    );
    assert.strictEqual(
      pathOf(document, identifier),
      "qti-item-body/p/{http://www.w3.org/1998/Math/MathML}math/{http://www.w3.org/1998/Math/MathML}mi",
    );
  });
});

describe("attributePath", () => {
  it("ends an attribute in no namespace with /@name", () => {
    assert.strictEqual(
      attributePath("qti-assessment-item", attr("identifier", "BG007")),
      "qti-assessment-item/@identifier",
    );
  });

  it("ends xml:lang with /@xml:lang", () => {
    assert.strictEqual(
      attributePath("qti-assessment-item", attr("lang", "en", xmlNamespace)),
      "qti-assessment-item/@xml:lang",
    );
  });

  it("spells an attribute in another namespace as /@{namespace}local", () => {
    assert.strictEqual(
      attributePath("qti-assessment-item", attr("schemaLocation", "x", xsiNamespace)),
      `qti-assessment-item/@{${xsiNamespace}}schemaLocation`,
    );
  });

  it("builds fractions_deps_2's location from the first PCI's modules", () => {
    const fallback = attr("fallback-configuration", "config.js");
    const modules = el("qti-interaction-modules", [fallback]);
    const document = doc(
      "fractions_deps_2.xml",
      el(
        "qti-assessment-item",
        [],
        [
          el(
            "qti-item-body",
            [],
            [
              el(
                "div",
                [],
                [
                  el("qti-portable-custom-interaction", [], [modules]),
                  el("qti-portable-custom-interaction", [], [el("qti-interaction-modules")]),
                ],
              ),
            ],
          ),
        ],
      ),
    );
    const visit = [...walk(document)].find((each) => each.element === modules);
    assert.isDefined(visit);
    assert.strictEqual(
      visit === undefined ? undefined : attributePath(visit.path, fallback),
      "qti-assessment-item/qti-item-body/div/qti-portable-custom-interaction[1]/qti-interaction-modules/@fallback-configuration",
    );
  });
});

describe("walk order", () => {
  it("visits every element in document order, each with its parent", () => {
    const prompt = el("qti-prompt", [], [text("Pick one.")]);
    const choice = el("qti-simple-choice", [attr("identifier", "A")]);
    const interaction = el("qti-choice-interaction", [], [prompt, choice]);
    const declaration = el("qti-response-declaration");
    const body = el("qti-item-body", [], [interaction]);
    const root = el("qti-assessment-item", [], [declaration, text(" "), body]);
    const visits = [...walk(doc("BG007.xml", root))];
    assert.deepStrictEqual(
      visits.map((visit) => visit.element),
      [root, declaration, body, interaction, prompt, choice],
    );
    assert.isTrue(Option.isNone(visits[0]?.parent ?? Option.some(root)));
    assert.deepStrictEqual(
      visits.slice(1).map((visit) => Option.getOrUndefined(visit.parent)),
      [root, root, body, interaction, interaction],
    );
  });

  it("visits a childless root alone", () => {
    const root = el("qti-assessment-item");
    const visits = [...walk(doc("empty.xml", root))];
    assert.strictEqual(visits.length, 1);
    assert.strictEqual(visits[0]?.element, root);
    assert.strictEqual(visits[0]?.path, "qti-assessment-item");
  });
});

describe("builders", () => {
  it("builds an element in the QTI namespace with no attributes or children by default", () => {
    assert.deepStrictEqual(el("qti-item-body"), {
      attributes: [],
      children: [],
      kind: "element",
      local: "qti-item-body",
      namespace: qtiNamespace,
    });
  });

  it("keeps an element's given attributes, children and namespace", () => {
    const attributes = [attr("display", "block")];
    const children = [text("x")];
    const math = el("math", attributes, children, mathmlNamespace);
    assert.strictEqual(math.attributes, attributes);
    assert.strictEqual(math.children, children);
    assert.strictEqual(math.namespace, mathmlNamespace);
  });

  it("builds an attribute in no namespace with references empty by default", () => {
    assert.deepStrictEqual(attr("identifier", "RESPONSE"), {
      local: "identifier",
      namespace: "",
      references: [],
      value: "RESPONSE",
    });
  });

  it("keeps an attribute's source spelling, namespace and references", () => {
    assert.deepStrictEqual(attr("label", "a&nbsp;b", xmlNamespace, ["nbsp"]), {
      local: "label",
      namespace: xmlNamespace,
      references: ["nbsp"],
      value: "a&nbsp;b",
    });
  });

  it("builds text, entity and document nodes", () => {
    const root = el("qti-assessment-item");
    assert.deepStrictEqual(text("Paris"), { kind: "text", text: "Paris" });
    assert.deepStrictEqual(entity("nbsp"), { kind: "entity", name: "nbsp" });
    assert.deepStrictEqual(doc("items/BG007.xml", root), { location: "items/BG007.xml", root });
  });
});
