import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import {
  attr,
  doc,
  el,
  entity,
  mathmlNamespace,
  qtiNamespace,
  text,
  xincludeNamespace,
  xmlNamespace,
  xmlnsNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import type { BodyElement, BodyNode, InlineChoiceInteraction, Item } from "#plate/model/item.ts";
import type { Test } from "#plate/model/test.ts";
import { InvalidValue } from "#plate/model/values.ts";
import type { Redacted } from "#plate/payload.ts";
import { redact } from "#plate/render.ts";
import { open } from "#plate/validate/open.ts";
import { Refusal, refusalRules } from "#plate/validate/refusal.ts";
import type { Location, RefusalRule } from "#plate/validate/refusal.ts";
import { tables } from "#plate/validate/tables.ts";
import {
  acceptedItem,
  acceptForTest,
  acceptSectionForTest,
  acceptStimulusForTest,
  acceptTestForTest,
  check,
  describeRefusal,
  unsupportedFeatures,
} from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest, RootSummary, Verdict } from "#plate/validate/verdict.ts";
import { baseTypes } from "#plate/vocabulary.ts";

/**
 * A `javascript:` URL, which every URL attribute drops.
 */
// oxlint-disable-next-line eslint/no-script-url -- the value is test input check must drop, never a URL this code navigates to.
const scriptUrl = "javascript:x";

/**
 * The path of the item root, which every path in these tests starts with.
 */
const root = "qti-assessment-item";

/**
 * The path of the item body.
 */
const bodyPath = `${root}/qti-item-body`;

/**
 * Construct a `qti-assessment-item` with its required attributes and the given parts.
 *
 * @param parts The root's children: declarations, the body and the processing.
 * @param attributes The root's further attributes.
 * @returns The document, at `item.xml`.
 */
const item = (
  parts: readonly SourceElement[],
  attributes: readonly SourceAttribute[] = [],
): SourceDocument =>
  doc(
    "item.xml",
    el(
      "qti-assessment-item",
      [
        attr("identifier", "item-1"),
        attr("time-dependent", "false"),
        attr("title", "Verdict"),
        ...attributes,
      ],
      parts,
    ),
  );

/**
 * Construct the declaration of `RESPONSE`.
 *
 * @param baseType Its `base-type`.
 * @param cardinality Its `cardinality`.
 * @param children Its children, none by default.
 * @returns The declaration.
 */
const response = (
  baseType: string,
  cardinality: string,
  children: readonly SourceChild[] = [],
): SourceElement =>
  el(
    "qti-response-declaration",
    [attr("base-type", baseType), attr("cardinality", cardinality), attr("identifier", "RESPONSE")],
    children,
  );

/**
 * Construct a `qti-correct-response` holding one `qti-value`.
 *
 * @param value The value's text.
 * @returns The container.
 */
const correct = (value: string): SourceElement =>
  el("qti-correct-response", [], [el("qti-value", [], [text(value)])]);

/**
 * The declaration of a float `SCORE`.
 */
const score = (): SourceElement =>
  el("qti-outcome-declaration", [
    attr("base-type", "float"),
    attr("cardinality", "single"),
    attr("identifier", "SCORE"),
  ]);

/**
 * Construct the item body.
 *
 * @param children Its children.
 * @param attributes Its attributes, none by default.
 * @returns The body element.
 */
const body = (
  children: readonly SourceChild[],
  attributes: readonly SourceAttribute[] = [],
): SourceElement => el("qti-item-body", attributes, children);

/**
 * Construct a `qti-choice-interaction` bound to `RESPONSE` with two text choices.
 *
 * @param attributes Its further attributes.
 * @returns The interaction.
 */
const choiceInteraction = (attributes: readonly SourceAttribute[] = []): SourceElement =>
  el(
    "qti-choice-interaction",
    [attr("response-identifier", "RESPONSE"), ...attributes],
    [
      el("qti-simple-choice", [attr("identifier", "A")], [text("Yes")]),
      el("qti-simple-choice", [attr("identifier", "B")], [text("No")]),
    ],
  );

/**
 * 1EdTech's `match_correct` response-processing template (`rptemplates/match_correct.xml`), the
 * root of its own document.
 */
const matchCorrect = el(
  "qti-response-processing",
  [],
  [
    el(
      "qti-response-condition",
      [],
      [
        el(
          "qti-response-if",
          [],
          [
            el(
              "qti-match",
              [],
              [
                el("qti-variable", [attr("identifier", "RESPONSE")]),
                el("qti-correct", [attr("identifier", "RESPONSE")]),
              ],
            ),
            el(
              "qti-set-outcome-value",
              [attr("identifier", "SCORE")],
              [el("qti-base-value", [attr("base-type", "float")], [text("1")])],
            ),
          ],
        ),
        el(
          "qti-response-else",
          [],
          [
            el(
              "qti-set-outcome-value",
              [attr("identifier", "SCORE")],
              [el("qti-base-value", [attr("base-type", "float")], [text("0")])],
            ),
          ],
        ),
      ],
    ),
  ],
);

/**
 * Check a document against the committed tables.
 *
 * @param source The document.
 * @returns Its verdict.
 */
const verdictOf = (source: SourceDocument): Verdict => check(source, tables);

/**
 * Read the accepted item of a verdict that must accept an item.
 *
 * @param verdict The verdict.
 * @param expected Which of the two accepting verdicts it must be.
 * @returns Its accepted item.
 */
const acceptedOf = (
  verdict: Verdict,
  expected: "accepted" | "accepted-with-unsupported",
): Accepted => {
  assert.strictEqual(verdict.verdict, expected);
  assert.strictEqual(verdict.kind, "item");

  return (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "item"
    ? verdict.accepted
    : assert.fail(
        `The verdict is ${verdict.verdict} on a ${verdict.kind}, not ${expected} on an item.`,
      );
};

/**
 * Read the refusals of a verdict that must refuse the document.
 *
 * @param verdict The verdict.
 * @returns Each refusal's rule and location, in order.
 */
const refusalsOf = (
  verdict: Verdict,
): readonly { readonly location: Location; readonly rule: string }[] => {
  assert.strictEqual(verdict.verdict, "refused");

  return verdict.verdict === "refused"
    ? verdict.refusals.map((refusal) => ({ location: refusal.location, rule: refusal.rule }))
    : assert.fail(`The verdict is ${verdict.verdict}, not refused.`);
};

/**
 * Find the body element at a path, searching interactions' prompts and choices too.
 *
 * @param nodes The nodes to search.
 * @param path The element's path.
 * @returns The element, or none.
 */
const elementAt = (nodes: readonly BodyNode[], path: string): Option.Option<BodyElement> => {
  for (const node of nodes) {
    if (node.kind === "element") {
      if (node.path === path) {
        return Option.some(node);
      }

      const found = elementAt(node.children, path);
      if (Option.isSome(found)) {
        return found;
      }
    }
  }

  return Option.none();
};

/**
 * Give the body element at a path, which must exist.
 *
 * @param accepted The accepted document.
 * @param path The element's path.
 * @returns The element.
 */
const bodyElement = (accepted: Accepted, path: string): BodyElement =>
  Option.getOrElse(elementAt(accepted.item.body, path), () =>
    assert.fail(`No body element at ${path}.`),
  );

/**
 * Name the attributes of a body element.
 *
 * @param element The element.
 * @returns Its attribute names, in order.
 */
const namesOf = (element: BodyElement): readonly string[] =>
  element.attributes.map((attribute) => attribute.name);

/**
 * Write a body's nodes compactly: an element as its tag with its children, text as itself, a
 * printed variable as `printed:<identifier>@<path>`, a template or feedback block or inline as
 * `<kind>:<identifier>@<path>` with its content, and a notice as `notice:<feature>@<path>`.
 *
 * @param nodes The nodes.
 * @returns One entry per node.
 */
const outline = (nodes: readonly BodyNode[]): readonly unknown[] =>
  nodes.map((node) => {
    switch (node.kind) {
      case "element": {
        return { [node.tag]: outline(node.children) };
      }
      case "text": {
        return node.text;
      }
      case "unsupported": {
        return `notice:${node.feature}@${node.path}`;
      }
      case "printed-variable": {
        return `printed:${node.identifier}@${node.path}`;
      }
      case "feedback-block":
      case "feedback-inline":
      case "template-block":
      case "template-inline": {
        return { [`${node.kind}:${node.identifier}@${node.path}`]: outline(node.content) };
      }
      case "choice":
      case "extended-text":
      case "inline-choice":
      case "text-entry": {
        return node.kind;
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Find every Inline Choice among body nodes, in the elements they nest in too.
 *
 * @param nodes The nodes to search.
 * @returns The Inline Choices, in document order.
 */
const inlineChoicesIn = (nodes: readonly BodyNode[]): readonly InlineChoiceInteraction[] =>
  nodes.flatMap((node) => {
    if (node.kind === "element") {
      return inlineChoicesIn(node.children);
    }

    return node.kind === "inline-choice" ? [node] : [];
  });

describe("check", () => {
  it("accepts a valid item it renders in full", () => {
    const accepted = acceptedOf(
      verdictOf(item([body([el("p", [], [text("Hello")])])])),
      "accepted",
    );

    assert.strictEqual(accepted.document, "item.xml");
    assert.strictEqual(accepted.item.identifier, "item-1");
    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(outline(accepted.item.body), [{ p: ["Hello"] }]);
  });

  it("[I-5] accepts an item whose body prints a variable as accepted, holding the printed variable as a body node and naming it no unsupported feature", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([
          score(),
          body([
            el(
              "p",
              [],
              [text("Score: "), el("qti-printed-variable", [attr("identifier", "SCORE")])],
            ),
          ]),
        ]),
      ),
      "accepted",
    );

    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(outline(accepted.item.body), [
      { p: ["Score: ", `printed:SCORE@${bodyPath}/p/qti-printed-variable`] },
    ]);
  });

  it("refuses a root outside the QTI namespace with not-qti-root alone", () => {
    const xhtml = "http://www.w3.org/1999/xhtml";
    const verdict = verdictOf(doc("page.xml", el("html", [], [el("body", [], [], xhtml)], xhtml)));

    assert.deepStrictEqual(refusalsOf(verdict), [
      { location: { kind: "path", path: `{${xhtml}}html` }, rule: "not-qti-root" },
    ]);
  });

  it("leaves a MathML child unchecked, with no accepted document", () => {
    const math = el("math", [], [el("mi", [], [text("x")], mathmlNamespace)], mathmlNamespace);
    const verdict = verdictOf(item([body([el("p", [], [text("Solve "), math])])]));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.isFalse("accepted" in verdict);
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        { path: `${bodyPath}/p/{${mathmlNamespace}}math`, reason: "mathml" },
      ]);
    }
  });

  it("leaves an XInclude child unchecked, with no accepted document", () => {
    const include = el(
      "include",
      [attr("href", "x.xml"), attr("parse", "bogus")],
      [el("div", [], [])],
      xincludeNamespace,
    );
    const verdict = verdictOf(item([body([el("p", [], [include])])]));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.isFalse("accepted" in verdict);
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        { path: `${bodyPath}/p/{${xincludeNamespace}}include`, reason: "xinclude" },
      ]);
    }
  });

  it("leaves 1EdTech's match_correct template, a processing root, unchecked", () => {
    const verdict = verdictOf(doc("match_correct.xml", matchCorrect));

    assert.strictEqual(verdict.verdict, "unchecked");
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        { path: "qti-response-processing", reason: "root" },
      ]);
    }
  });

  it("leaves an entity reference in a correct response's value unchecked, not refused", () => {
    const verdict = verdictOf(
      item([
        response("identifier", "single", [
          el("qti-correct-response", [], [el("qti-value", [], [entity("choiceA")])]),
        ]),
        body([el("p", [], [text("Hello")])]),
      ]),
    );

    assert.strictEqual(verdict.verdict, "unchecked");
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        {
          path: `${root}/qti-response-declaration/qti-correct-response/qti-value`,
          reason: "entity",
        },
      ]);
    }
  });

  // A Choice is declared only locally in the XSD, so the custom interaction's lax wildcard passes
  // over it: neither the walk nor the prose rules judge it, and its undeclared response is no fault.
  it("accepts a Choice directly in a custom interaction, unsupported: the walk does not check it", () => {
    const vendor = el(
      "qti-choice-interaction",
      [attr("response-identifier", "VENDOR")],
      [
        el("qti-simple-choice", [attr("identifier", "A")], [text("Yes")]),
        el("qti-simple-choice", [attr("identifier", "B")], [text("No")]),
      ],
    );
    const verdict = verdictOf(
      item([
        response("identifier", "single"),
        body([el("qti-custom-interaction", [attr("response-identifier", "RESPONSE")], [vendor])]),
      ]),
    );

    assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
  });

  it("refuses a Choice in a div in a custom interaction bound to an undeclared response, at the path the walk names", () => {
    const vendor = el(
      "qti-choice-interaction",
      [attr("response-identifier", "VENDOR")],
      [
        el("qti-simple-choice", [attr("identifier", "A")], [text("Yes")]),
        el("qti-simple-choice", [attr("identifier", "B")], [text("No")]),
      ],
    );
    const verdict = verdictOf(
      item([
        response("identifier", "single"),
        body([
          el(
            "qti-custom-interaction",
            [attr("response-identifier", "RESPONSE")],
            [el("div", [], [vendor])],
          ),
        ]),
      ]),
    );

    assert.deepStrictEqual(refusalsOf(verdict), [
      {
        location: {
          kind: "path",
          path: `${bodyPath}/qti-custom-interaction/div/qti-choice-interaction/@response-identifier`,
        },
        rule: "undeclared-response",
      },
    ]);
  });

  it("leaves an entity reference unchecked, in text and in an attribute value", () => {
    const verdict = verdictOf(
      item([body([el("p", [attr("class", "&wide;", "", ["wide"])], [text("a"), entity("nbsp")])])]),
    );

    assert.strictEqual(verdict.verdict, "unchecked");
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        { path: `${bodyPath}/p/@class`, reason: "entity" },
        { path: `${bodyPath}/p`, reason: "entity" },
      ]);
    }
  });

  it("leaves a QTI element that is none of the six roots unchecked at the root, of kind none", () => {
    const verdict = verdictOf(doc("fragment.xml", el("p", [], [text("Read this.")])));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.strictEqual(verdict.kind, "none");
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [{ path: "p", reason: "root" }]);
    }
  });

  it("[Q-31] accepts a qti-hotspot-interaction with unsupported features, naming it", () => {
    const hotspot = el(
      "qti-hotspot-interaction",
      [attr("response-identifier", "RESPONSE")],
      [
        el("img", [attr("alt", "A map"), attr("height", "100"), attr("src", "map.png")]),
        el("qti-hotspot-choice", [
          attr("coords", "10,10,5"),
          attr("identifier", "A"),
          attr("shape", "circle"),
        ]),
      ],
    );
    const accepted = acceptedOf(
      verdictOf(item([response("identifier", "single"), body([hotspot])])),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      {
        feature: "qti-hotspot-interaction",
        path: `${bodyPath}/qti-hotspot-interaction`,
        shown: "notice",
      },
    ]);
    assert.deepStrictEqual(outline(accepted.item.body), [
      `notice:qti-hotspot-interaction@${bodyPath}/qti-hotspot-interaction`,
    ]);
  });

  it("[Q-2] accepts a shuffled Choice naming no unsupported feature, with no notice in the body", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([
          response("identifier", "single"),
          body([choiceInteraction([attr("shuffle", "true")])]),
        ]),
      ),
      "accepted",
    );

    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(outline(accepted.item.body), ["choice"]);
  });

  it("refuses an integer declaration's value outside its lexical space with value-type", () => {
    const verdict = verdictOf(item([response("integer", "single", [correct("abc")])]));

    assert.deepStrictEqual(refusalsOf(verdict), [
      {
        location: {
          kind: "path",
          path: `${root}/qti-response-declaration/qti-correct-response/qti-value`,
        },
        rule: "value-type",
      },
    ]);
  });

  it("returns the structural and the prose refusals together, structure first", () => {
    const verdict = verdictOf(
      item([
        response("identifier", "single", [correct("1")]),
        body([el("p", [], [text("Hi")])], [attr("foo", "bar")]),
      ]),
    );

    assert.deepStrictEqual(refusalsOf(verdict), [
      { location: { kind: "path", path: `${bodyPath}/@foo` }, rule: "unknown-attribute" },
      {
        location: {
          kind: "path",
          path: `${root}/qti-response-declaration/qti-correct-response/qti-value`,
        },
        rule: "value-type",
      },
    ]);
  });

  it("refuses a max-choices beyond the signed 64-bit range with count-range", () => {
    const verdict = verdictOf(
      item([
        response("identifier", "multiple"),
        body([choiceInteraction([attr("max-choices", "9223372036854775808")])]),
      ]),
    );

    assert.deepInclude(refusalsOf(verdict), {
      location: { kind: "path", path: `${bodyPath}/qti-choice-interaction/@max-choices` },
      rule: "count-range",
    });
  });
});

describe("check, E3: attributes only a wildcard admits", () => {
  it("removes an onclick on a body p and marks it", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([body([el("p", [attr("class", "lead"), attr("onclick", "alert(1)")], [text("Hi")])])]),
      ),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "attribute:onclick", path: `${bodyPath}/p`, shown: "mark" },
    ]);
    assert.deepStrictEqual(namesOf(bodyElement(accepted, `${bodyPath}/p`)), ["class"]);
  });

  it("neither marks nor removes xsi:schemaLocation, xsi:noNamespaceSchemaLocation, xml:lang or a namespace declaration on the root", () => {
    const accepted = acceptedOf(
      verdictOf(
        item(
          [body([el("p", [], [text("Hi")])])],
          [
            attr("xsi", xsiNamespace, xmlnsNamespace),
            attr("schemaLocation", "urn:qti item.xsd", xsiNamespace),
            attr("noNamespaceSchemaLocation", "item.xsd", xsiNamespace),
            attr("lang", "en", xmlNamespace),
          ],
        ),
      ),
      "accepted",
    );

    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(accepted.item.lang, Option.some("en"));
  });

  it("keeps aria-keyshortcuts where the table declares aria-keyshorts, and removes aria-keyshorts where it does not", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([
          body([
            el(
              "p",
              [attr("aria-keyshorts", "Alt+P")],
              [
                el("img", [
                  attr("alt", "A cat"),
                  attr("aria-keyshortcuts", "Alt+I"),
                  attr("src", "cat.png"),
                ]),
              ],
            ),
          ]),
        ]),
      ),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "attribute:aria-keyshorts", path: `${bodyPath}/p`, shown: "mark" },
    ]);
    assert.deepStrictEqual(namesOf(bodyElement(accepted, `${bodyPath}/p`)), []);
    assert.deepStrictEqual(namesOf(bodyElement(accepted, `${bodyPath}/p/img`)), [
      "alt",
      "aria-keyshortcuts",
      "src",
    ]);
  });

  it("compares names exactly: an HREF is wildcard-only, and an element A is refused", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([
          body([
            el("p", [], [el("a", [attr("HREF", scriptUrl), attr("href", "#note")], [text("Go")])]),
          ]),
        ]),
      ),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "attribute:HREF", path: `${bodyPath}/p/a`, shown: "mark" },
    ]);
    assert.deepStrictEqual(bodyElement(accepted, `${bodyPath}/p/a`).attributes, [
      { name: "href", value: "#note" },
    ]);

    const refused = verdictOf(
      item([body([el("p", [], [el("A", [attr("href", scriptUrl)], [text("Go")])])])]),
    );

    assert.deepStrictEqual(refusalsOf(refused), [
      { location: { kind: "path", path: `${bodyPath}/p/A` }, rule: "unknown-element" },
    ]);
  });
});

/**
 * Construct an `xsi:type` naming a QTI type through the prefix `q`.
 *
 * @param local The type's local name.
 * @returns The attribute.
 */
const xsiType = (local: string): SourceAttribute => attr("type", `q:${local}`, xsiNamespace);

describe("check, reading 47: xsi:type", () => {
  it("accepts an item carrying valid xsi:type attributes, with no attribute: mark for them", () => {
    const accepted = acceptedOf(
      verdictOf(
        item(
          [body([el("p", [xsiType("HTMLTextDType")], [text("Hi")])], [xsiType("ItemBodyDType")])],
          [attr("q", qtiNamespace, xmlnsNamespace), xsiType("AssessmentItemDType")],
        ),
      ),
      "accepted",
    );

    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(outline(accepted.item.body), [{ p: ["Hi"] }]);
  });

  it("keeps what the governing type declares: a qti-null typed WeightDType earns no attribute: mark (AD-9)", () => {
    const weighted = el("qti-null", [
      xsiType("WeightDType"),
      attr("identifier", "W"),
      attr("value", "1"),
    ]);
    const verdict = verdictOf(
      item(
        [
          score(),
          body([el("p", [], [text("Hi")])]),
          el(
            "qti-response-processing",
            [],
            [el("qti-set-outcome-value", [attr("identifier", "SCORE")], [weighted])],
          ),
        ],
        [attr("q", qtiNamespace, xmlnsNamespace)],
      ),
    );
    // The case is about attribute marks only, so any other mark the processing earns is left
    // out of the assertion.
    const unsupported =
      verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
        ? verdict.accepted.unsupported
        : assert.fail(`The verdict is ${verdict.verdict}, not an accepting one.`);

    assert.deepStrictEqual(
      unsupported.filter((mark) => mark.feature.startsWith("attribute:")),
      [],
    );
  });
});

describe("check, the URL pass", () => {
  it("drops a javascript: href, keeps the link and its text, and places the notice after it", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([body([el("p", [], [el("a", [attr("href", scriptUrl)], [text("Go")]), text(".")])])]),
      ),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "url-scheme:javascript", path: `${bodyPath}/p/a`, shown: "notice" },
    ]);
    assert.deepStrictEqual(outline(accepted.item.body), [
      { p: [{ a: ["Go"] }, `notice:url-scheme:javascript@${bodyPath}/p/a`, "."] },
    ]);
    assert.deepStrictEqual(namesOf(bodyElement(accepted, `${bodyPath}/p/a`)), []);
    assert.deepStrictEqual(accepted.item.unsupported, accepted.unsupported);
  });

  it("puts the notice in place of a bare link with no text", () => {
    const accepted = acceptedOf(
      verdictOf(item([body([el("p", [], [text("See "), el("a", [attr("href", "/etc")])])])])),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "url-outside-package", path: `${bodyPath}/p/a`, shown: "notice" },
    ]);
    assert.deepStrictEqual(outline(accepted.item.body), [
      { p: ["See ", `notice:url-outside-package@${bodyPath}/p/a`] },
    ]);
  });

  it("places the notices of a source and a track after their video, never inside it", () => {
    const video = el(
      "video",
      [attr("controls", "controls")],
      [
        el("source", [attr("src", scriptUrl), attr("type", "video/mp4")]),
        el("track", [attr("kind", "captions"), attr("src", "data:text/vtt,x")]),
      ],
    );
    const accepted = acceptedOf(
      verdictOf(item([body([el("div", [], [video, el("p", [], [text("After")])])])])),
      "accepted-with-unsupported",
    );
    const at = `${bodyPath}/div/video`;

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "url-scheme:javascript", path: `${at}/source`, shown: "notice" },
      { feature: "url-scheme:data", path: `${at}/track`, shown: "notice" },
    ]);
    assert.deepStrictEqual(outline(accepted.item.body), [
      {
        div: [
          { video: [{ source: [] }, { track: [] }] },
          `notice:url-scheme:javascript@${at}/source`,
          `notice:url-scheme:data@${at}/track`,
          { p: ["After"] },
        ],
      },
    ]);
  });

  it("places a notice inside the choice whose image lost its src", () => {
    const choices = el(
      "qti-choice-interaction",
      [attr("response-identifier", "RESPONSE")],
      [
        el(
          "qti-simple-choice",
          [attr("identifier", "A")],
          [el("img", [attr("alt", "A cat"), attr("src", scriptUrl)])],
        ),
        el("qti-simple-choice", [attr("identifier", "B")], [text("No")]),
      ],
    );
    const accepted = acceptedOf(
      verdictOf(item([response("identifier", "single"), body([choices])])),
      "accepted-with-unsupported",
    );
    const at = `${bodyPath}/qti-choice-interaction/qti-simple-choice[1]/img`;
    const [interaction] = accepted.item.body;

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "url-scheme:javascript", path: at, shown: "notice" },
    ]);
    assert.strictEqual(interaction?.kind, "choice");
    if (interaction?.kind === "choice") {
      assert.deepStrictEqual(outline(interaction.choices[0]?.content ?? []), [
        { img: [] },
        `notice:url-scheme:javascript@${at}`,
      ]);
    }
  });

  it("marks a URL dropped inside a part the body already shows as a notice", () => {
    const hotspot = el(
      "qti-hotspot-interaction",
      [attr("response-identifier", "RESPONSE")],
      [
        el("img", [attr("alt", "A map"), attr("src", scriptUrl)]),
        el("qti-hotspot-choice", [
          attr("coords", "10,10,5"),
          attr("identifier", "A"),
          attr("shape", "circle"),
        ]),
      ],
    );
    const accepted = acceptedOf(
      verdictOf(item([response("identifier", "single"), body([hotspot])])),
      "accepted-with-unsupported",
    );
    const at = `${bodyPath}/qti-hotspot-interaction`;

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "qti-hotspot-interaction", path: at, shown: "notice" },
      { feature: "url-scheme:javascript", path: `${at}/img`, shown: "mark" },
    ]);
    assert.deepStrictEqual(outline(accepted.item.body), [`notice:qti-hotspot-interaction@${at}`]);
  });

  it("writes a kept URL in its parsed form, and an item whose URLs are all kept is accepted", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([
          body([
            el(
              "p",
              [],
              [
                el("img", [attr("alt", "A cat"), attr("src", "images/a b.png")]),
                el("a", [attr("href", "https://example.com/x")], [text("More")]),
              ],
            ),
          ]),
        ]),
      ),
      "accepted",
    );

    assert.deepStrictEqual(bodyElement(accepted, `${bodyPath}/p/img`).attributes, [
      { name: "alt", value: "A cat" },
      { name: "src", value: "images/a%20b.png" },
    ]);
    assert.deepStrictEqual(bodyElement(accepted, `${bodyPath}/p/a`).attributes, [
      { name: "href", value: "https://example.com/x" },
    ]);
  });
});

/**
 * Construct an item whose duration `RESPONSE` has the correct response written, scored by
 * `match_correct`.
 *
 * @param written The correct response's text.
 * @returns The document.
 */
const matchedDuration = (written: string): SourceDocument =>
  item([
    response("duration", "single", [correct(written)]),
    score(),
    body([el("p", [], [text("How long did it take?")])]),
    el("qti-response-processing", [
      attr("template", "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"),
    ]),
  ]);

describe("check, a duration value (G-R1, pending: a duration is not numerical)", () => {
  it("[I-9a] holds a duration response's correct response written as seconds, and runs its match_correct, whose qti-match compares the two durations (a template's content is P13's, deferred)", () => {
    const accepted = acceptedOf(verdictOf(matchedDuration("60")), "accepted");
    const declared = accepted.item.responses.get("RESPONSE");

    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(
      declared?.correct,
      Option.some({
        baseType: "duration",
        cardinality: "single",
        values: [{ baseType: "duration", value: 60 }],
      }),
    );

    const conditions = accepted.item.processing.pipe(
      Option.map((rules) =>
        rules.map((rule) =>
          rule.kind === "condition"
            ? rule.branches.map((branch) => [
                branch.when.kind,
                branch.when.operands.map((operand) => operand.kind),
              ])
            : rule.kind,
        ),
      ),
    );

    assert.deepStrictEqual(conditions, Option.some([[["match", ["variable", "correct"]]]]));
  });

  it("[I-9a] refuses a duration response's correct response written as an ISO 8601 duration, as value-type", () => {
    assert.deepStrictEqual(refusalsOf(verdictOf(matchedDuration("PT1M"))), [
      {
        location: {
          kind: "path",
          path: `${root}/qti-response-declaration/qti-correct-response/qti-value`,
        },
        rule: "value-type",
      },
    ]);
  });

  it("[I-9a] refuses a qti-sum over a duration outcome as expression-type (pantry P23)", () => {
    const refusals = refusalsOf(
      verdictOf(
        item([
          el("qti-outcome-declaration", [
            attr("base-type", "duration"),
            attr("cardinality", "single"),
            attr("identifier", "TIME"),
          ]),
          score(),
          body([el("p", [], [text("How long?")])]),
          el(
            "qti-response-processing",
            [],
            [
              el(
                "qti-set-outcome-value",
                [attr("identifier", "SCORE")],
                [el("qti-sum", [], [el("qti-variable", [attr("identifier", "TIME")])])],
              ),
            ],
          ),
        ]),
      ),
    );

    assert.deepStrictEqual(refusals, [
      {
        location: {
          kind: "path",
          path: `${root}/qti-response-processing/qti-set-outcome-value/qti-sum`,
        },
        rule: "expression-type",
      },
    ]);
  });
});

/**
 * Construct an item that declares one single variable, and a body.
 *
 * @param kind The declaration's local name.
 * @param identifier Its `identifier`.
 * @param baseType Its `base-type`.
 * @returns The item.
 */
const declaring = (kind: string, identifier: string, baseType: string): SourceDocument =>
  item([
    el(kind, [
      attr("base-type", baseType),
      attr("cardinality", "single"),
      attr("identifier", identifier),
    ]),
    body([el("p", [], [text("Hello")])]),
  ]);

/**
 * Construct an item whose response processing sets `SCORE` when two floats are equal within an
 * absolute tolerance.
 *
 * @param tolerance The `qti-equal`'s `tolerance`, as written.
 * @returns The item.
 */
const tolerating = (tolerance: string): SourceDocument =>
  item([
    score(),
    body([el("p", [], [text("Hello")])]),
    el(
      "qti-response-processing",
      [],
      [
        el(
          "qti-response-condition",
          [],
          [
            el(
              "qti-response-if",
              [],
              [
                el(
                  "qti-equal",
                  [attr("tolerance", tolerance), attr("tolerance-mode", "absolute")],
                  [
                    el("qti-base-value", [attr("base-type", "float")], [text("1.0")]),
                    el("qti-base-value", [attr("base-type", "float")], [text("1.5")]),
                  ],
                ),
                el(
                  "qti-set-outcome-value",
                  [attr("identifier", "SCORE")],
                  [el("qti-base-value", [attr("base-type", "float")], [text("1")])],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  ]);

describe("check, the built-in variables' identifiers and qti-equal's tolerance tokens (pantry DeclarationNotReserved and P6)", () => {
  it("[I-9a] refuses an item that declares a variable named completionStatus, numAttempts or duration as attribute-type at its identifier (pantry DeclarationNotReserved)", () => {
    for (const [kind, identifier, baseType] of [
      ["qti-outcome-declaration", "completionStatus", "identifier"],
      ["qti-response-declaration", "numAttempts", "integer"],
      ["qti-response-declaration", "duration", "float"],
      ["qti-template-declaration", "duration", "float"],
    ] as const) {
      assert.deepStrictEqual(refusalsOf(verdictOf(declaring(kind, identifier, baseType))), [
        { location: { kind: "path", path: `${root}/${kind}/@identifier` }, rule: "attribute-type" },
      ]);
    }
  });

  it("[I-9a] accepts an item that declares a variable with any other identifier", () => {
    for (const [kind, identifier, baseType] of [
      ["qti-outcome-declaration", "STATUS", "identifier"],
      ["qti-response-declaration", "ATTEMPTS", "integer"],
      ["qti-outcome-declaration", "Duration", "float"],
    ] as const) {
      assert.notStrictEqual(
        verdictOf(declaring(kind, identifier, baseType)).verdict,
        "refused",
        identifier,
      );
    }
  });

  it("[I-9a] refuses an item whose qti-equal tolerance holds a token that is neither an xs:double nor an NCName, 1,5, as attribute-type (pantry P6)", () => {
    assert.deepStrictEqual(refusalsOf(verdictOf(tolerating("1,5"))), [
      {
        location: {
          kind: "path",
          path: `${root}/qti-response-processing/qti-response-condition/qti-response-if/qti-equal/@tolerance`,
        },
        rule: "attribute-type",
      },
    ]);
  });

  it("[I-9a] accepts an item whose qti-equal tolerance is 0.5, 1 2, TOL (an NCName) or INF", () => {
    for (const tolerance of ["0.5", "1 2", "TOL", "INF"]) {
      assert.notStrictEqual(verdictOf(tolerating(tolerance)).verdict, "refused", tolerance);
    }
  });
});

describe("check, the base types of SCORE, MAXSCORE and PASSED (pantry ReservedOutcomeTypes)", () => {
  it("[I-9a] refuses an item whose outcome SCORE is an integer, MAXSCORE a string or PASSED an integer, as attribute-type at its base-type (pantry ReservedOutcomeTypes)", () => {
    for (const [identifier, baseType] of [
      ["SCORE", "integer"],
      ["MAXSCORE", "string"],
      ["PASSED", "integer"],
    ] as const) {
      assert.deepStrictEqual(
        refusalsOf(verdictOf(declaring("qti-outcome-declaration", identifier, baseType))),
        [
          {
            location: { kind: "path", path: `${root}/qti-outcome-declaration/@base-type` },
            rule: "attribute-type",
          },
        ],
        identifier,
      );
    }
  });

  it("[I-9a] accepts an item whose outcome SCORE and MAXSCORE are floats, PASSED a boolean, an integer outcome of another name, and an integer response named SCORE", () => {
    for (const [kind, identifier, baseType] of [
      ["qti-outcome-declaration", "SCORE", "float"],
      ["qti-outcome-declaration", "MAXSCORE", "float"],
      ["qti-outcome-declaration", "PASSED", "boolean"],
      ["qti-outcome-declaration", "TOTAL", "integer"],
      ["qti-response-declaration", "SCORE", "integer"],
    ] as const) {
      assert.notStrictEqual(
        verdictOf(declaring(kind, identifier, baseType)).verdict,
        "refused",
        `${kind} ${identifier}`,
      );
    }
  });
});

/**
 * The location of every hand-built test, section and stimulus document in these tests.
 */
const testLocation = "tests/test.xml";

/**
 * Construct a `qti-assessment-section` with its required attributes.
 *
 * @param identifier Its `identifier`, also its `title`.
 * @param children Its children, in document order.
 * @returns The section.
 */
const assessmentSection = (identifier: string, children: readonly SourceChild[]): SourceElement =>
  el(
    "qti-assessment-section",
    [attr("identifier", identifier), attr("title", identifier), attr("visible", "true")],
    children,
  );

/**
 * Construct a test of one linear, individual part `P` holding one section `S`.
 *
 * @param sectionChildren The section's children.
 * @param testChildren The test's children after the part.
 * @returns The test, at {@link testLocation}.
 */
const assessmentTest = (
  sectionChildren: readonly SourceChild[],
  testChildren: readonly SourceElement[] = [],
): SourceDocument =>
  doc(
    testLocation,
    el(
      "qti-assessment-test",
      [attr("identifier", "T"), attr("title", "Test")],
      [
        el(
          "qti-test-part",
          [
            attr("identifier", "P"),
            attr("navigation-mode", "linear"),
            attr("submission-mode", "individual"),
          ],
          [assessmentSection("S", sectionChildren)],
        ),
        ...testChildren,
      ],
    ),
  );

/**
 * Construct a `qti-assessment-item-ref` to `items/<identifier>.xml`.
 *
 * @param identifier Its `identifier`.
 * @param children Its children, such as a `qti-branch-rule`.
 * @returns The item ref.
 */
const itemRef = (identifier: string, children: readonly SourceElement[] = []): SourceElement =>
  el(
    "qti-assessment-item-ref",
    [attr("href", `items/${identifier}.xml`), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a stimulus document with its required attributes.
 *
 * @param children The children of its `qti-stimulus-body`.
 * @returns The stimulus, at `stimulus.xml`.
 */
const stimulus = (children: readonly SourceChild[]): SourceDocument =>
  doc(
    "stimulus.xml",
    el(
      "qti-assessment-stimulus",
      [attr("identifier", "stimulus-1"), attr("title", "Stimulus")],
      [el("qti-stimulus-body", [], children)],
    ),
  );

/**
 * Read a corpus document from the cache and give its verdict.
 *
 * @param location The document's path under the corpus root.
 * @returns Its verdict.
 */
const corpusVerdict = (location: string) =>
  readCorpusFile(location).pipe(
    Effect.flatMap((bytes) => readSource(location, bytes)),
    Effect.map(verdictOf),
  );

/**
 * Read the accepted test of a verdict that must accept a test.
 *
 * @param verdict The verdict.
 * @param expected Which of the two accepting verdicts it must be.
 * @returns Its accepted test.
 */
const acceptedTestOf = (
  verdict: Verdict,
  expected: "accepted" | "accepted-with-unsupported",
): AcceptedTest => {
  assert.strictEqual(verdict.verdict, expected);
  assert.strictEqual(verdict.kind, "test");

  return (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
    ? verdict.accepted
    : assert.fail(
        `The verdict is ${verdict.verdict} on a ${verdict.kind}, not ${expected} on a test.`,
      );
};

/**
 * Write a verdict's unsupported features as `<feature>@<path>`.
 *
 * @param features The features.
 * @returns One entry per feature, in order.
 */
const featuresOf = (
  features: readonly { readonly feature: string; readonly path: string }[],
): readonly string[] => features.map(({ feature, path }) => `${feature}@${path}`);

/**
 * Construct a single outcome declaration with no default.
 *
 * @param identifier Its `identifier`.
 * @param baseType Its `base-type`.
 * @returns The declaration.
 */
const outcome = (identifier: string, baseType: string): SourceElement =>
  el("qti-outcome-declaration", [
    attr("base-type", baseType),
    attr("cardinality", "single"),
    attr("identifier", identifier),
  ]);

describe("check, the base types of a test's SCORE, MAXSCORE and PASSED", () => {
  it("[I-9a] accepts a test whose outcome SCORE is an integer and MAXSCORE a string, which the information model types in an item only (info.txt:8478, :8480)", () => {
    const verdict = verdictOf(
      assessmentTest([itemRef("q1")], [outcome("SCORE", "integer"), outcome("MAXSCORE", "string")]),
    );

    assert.strictEqual(verdict.verdict, "accepted");
    assert.strictEqual(verdict.kind, "test");
  });

  it("[I-9a] refuses a test whose outcome PASSED is an integer, as attribute-type at its base-type (pantry ReservedOutcomeTypes; info.txt:8482)", () => {
    assert.deepStrictEqual(
      refusalsOf(verdictOf(assessmentTest([itemRef("q1")], [outcome("PASSED", "integer")]))),
      [
        {
          location: {
            kind: "path",
            path: "qti-assessment-test/qti-outcome-declaration/@base-type",
          },
          rule: "attribute-type",
        },
      ],
    );
  });
});

/**
 * Construct a test whose outcome processing looks `I1.SCORE`, which it reads through its item ref
 * `I1`, up with an operand.
 *
 * @param operand The lookup's operand.
 * @returns The test.
 */
const lookingUp = (operand: SourceElement): SourceDocument =>
  assessmentTest(
    [itemRef("I1")],
    [
      outcome("SCORE", "float"),
      el(
        "qti-outcome-processing",
        [],
        [el("qti-lookup-outcome-value", [attr("identifier", "I1.SCORE")], [operand])],
      ),
    ],
  );

describe("check, a test's lookup of an outcome it reads through an item ref (reading 28; pantry P22)", () => {
  it("[T-9] refuses, in the test's own verdict, the lookup operand of a dotted target that is a string, as expression-type with reading 28 and no table, and accepts an integer one, its processing marked", () => {
    const refused = verdictOf(
      lookingUp(el("qti-base-value", [attr("base-type", "string")], [text("x")])),
    );
    const accepted = verdictOf(
      lookingUp(el("qti-base-value", [attr("base-type", "integer")], [text("1")])),
    );

    assert.strictEqual(refused.verdict, "refused");
    assert.deepStrictEqual(
      refused.verdict === "refused"
        ? refused.refusals.map((refusal) => ({
            detail: refusal.detail,
            location: refusal.location,
            rule: refusal.rule,
          }))
        : [],
      [
        {
          detail: {
            element: "qti-lookup-outcome-value",
            expressionBaseType: "string",
            expressionCardinality: "single",
            identifier: "I1.SCORE",
            reading: "28",
          },
          location: {
            kind: "path",
            path: "qti-assessment-test/qti-outcome-processing/qti-lookup-outcome-value",
          },
          rule: "expression-type",
        },
      ],
    );
    // The engine holds no item's outcome to set, so the accepted test's processing is marked.
    acceptedTestOf(accepted, "accepted-with-unsupported");
  });
});

/**
 * Construct a test whose record outcome `R` holds a `qti-default-value` of one field.
 *
 * @param attributes The field's attributes, as `[local, value]` pairs.
 * @param written The field's text, as written.
 * @returns The test.
 */
const recordFieldTest = (
  attributes: readonly (readonly [string, string])[],
  written: string,
): SourceDocument =>
  assessmentTest(
    [itemRef("I1")],
    [
      el(
        "qti-outcome-declaration",
        [attr("cardinality", "record"), attr("identifier", "R")],
        [
          el(
            "qti-default-value",
            [],
            [
              el(
                "qti-value",
                attributes.map(([local, value]) => attr(local, value)),
                [text(written)],
              ),
            ],
          ),
        ],
      ),
    ],
  );

describe("check, a record outcome's field in a test (info.txt:73046; pantry's test import runs semanticRows)", () => {
  const field = "qti-assessment-test/qti-outcome-declaration/qti-default-value/qti-value";
  const named = ["field-identifier", "n"] as const;
  const integer = ["base-type", "integer"] as const;

  it("[I-1] refuses, in the test's own verdict, a record field in a test declaration that lacks field-identifier, lacks base-type, or is outside its base-type", () => {
    assert.deepStrictEqual(
      [
        refusalsOf(verdictOf(recordFieldTest([integer], "1"))),
        refusalsOf(verdictOf(recordFieldTest([named], "1"))),
        refusalsOf(verdictOf(recordFieldTest([named, integer], "abc"))),
      ],
      [
        [
          {
            location: { kind: "path", path: `${field}/@field-identifier` },
            rule: "missing-attribute",
          },
        ],
        [{ location: { kind: "path", path: `${field}/@base-type` }, rule: "missing-attribute" }],
        [{ location: { kind: "path", path: field }, rule: "value-type" }],
      ],
    );
  });

  it("[I-1] accepts a record field in a test declaration that names its field and fits its base-type, marked cardinality=record as before (G-R4, pending)", () => {
    assert.deepStrictEqual(
      featuresOf(
        acceptedTestOf(
          verdictOf(recordFieldTest([named, integer], "1")),
          "accepted-with-unsupported",
        ).unsupported,
      ),
      ['cardinality="record"@qti-assessment-test/qti-outcome-declaration'],
    );
  });
});

describe("check, every QTI 3 root", () => {
  it.effect(
    "[T-4] [S-0] accepts BGtest.xml as a test it delivers in full",
    () =>
      Effect.gen(function* bgTest() {
        const location = "QTI3_BeginnersGuide_Examples/BGtest.xml";
        const accepted = acceptedTestOf(yield* corpusVerdict(location), "accepted");

        assert.strictEqual(accepted.document, location);
        assert.strictEqual(accepted.test.document, location);
        assert.strictEqual(accepted.test.identifier, "BGtest");
        assert.deepStrictEqual(accepted.unsupported, []);
        assert.deepStrictEqual(
          accepted.test.parts.map((part) => part.identifier),
          ["testPart-1"],
        );
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "[T-4] [S-0] accepts rtest08.xml as a test with unsupported features, its rubric blocks marked",
    () =>
      Effect.gen(function* rubricTest() {
        const location = "qtiv3-examples/tests/rtest08.xml";
        const accepted = acceptedTestOf(
          yield* corpusVerdict(location),
          "accepted-with-unsupported",
        );
        const nonlinear = "qti-assessment-test/qti-test-part[2]";

        assert.deepStrictEqual(accepted.unsupported, [
          {
            feature: "qti-rubric-block",
            path: `${nonlinear}/qti-assessment-section[1]/qti-rubric-block`,
            shown: "mark",
          },
          {
            feature: "qti-rubric-block",
            path: `${nonlinear}/qti-assessment-section[2]/qti-rubric-block`,
            shown: "mark",
          },
        ]);
        assert.deepStrictEqual(accepted.unsupported, accepted.test.unsupported);
        assert.deepStrictEqual(accepted.test.outcomeProcessing, { kind: "absent" });
      }),
    { tags: ["corpus"] },
  );

  it("refuses a hand-built empty section document with child-count, of kind section", () => {
    const verdict = verdictOf(doc("section.xml", assessmentSection("S", [])));

    assert.deepStrictEqual(refusalsOf(verdict), [
      { location: { kind: "path", path: "qti-assessment-section" }, rule: "child-count" },
    ]);
    assert.strictEqual(verdict.kind, "section");
  });

  it("accepts a section document with unsupported features, marked as a section root", () => {
    const verdict = verdictOf(doc("section.xml", assessmentSection("S", [itemRef("q1")])));

    assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
    assert.isTrue(verdict.kind === "section");
    if (verdict.verdict === "accepted-with-unsupported" && verdict.kind === "section") {
      assert.strictEqual(verdict.accepted.document, "section.xml");
      assert.strictEqual(verdict.accepted.identifier, "S");
      assert.deepStrictEqual(featuresOf(verdict.accepted.unsupported), [
        "root:qti-assessment-section@qti-assessment-section",
      ]);
    }
  });

  it("accepts a stimulus holding an interaction with unsupported features, marked as a stimulus root", () => {
    const verdict = verdictOf(stimulus([el("div", [], [choiceInteraction()])]));

    assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
    assert.isTrue(verdict.kind === "stimulus");
    if (verdict.verdict === "accepted-with-unsupported" && verdict.kind === "stimulus") {
      assert.strictEqual(verdict.accepted.document, "stimulus.xml");
      assert.strictEqual(verdict.accepted.identifier, "stimulus-1");
      assert.strictEqual(verdict.accepted.title, "Stimulus");
      assert.deepStrictEqual(featuresOf(verdict.accepted.unsupported), [
        "root:qti-assessment-stimulus@qti-assessment-stimulus",
      ]);
    }
  });

  it("leaves a stimulus holding MathML unchecked, of kind stimulus", () => {
    const math = el("math", [], [el("mi", [], [text("x")], mathmlNamespace)], mathmlNamespace);
    const verdict = verdictOf(stimulus([el("p", [], [math])]));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.strictEqual(verdict.kind, "stimulus");
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        {
          path: `qti-assessment-stimulus/qti-stimulus-body/p/{${mathmlNamespace}}math`,
          reason: "mathml",
        },
      ]);
    }
  });

  it("marks a test's xi:include rather than leaving the test unchecked", () => {
    const include = el("include", [attr("href", "shared/items.xml")], [], xincludeNamespace);
    const accepted = acceptedTestOf(
      verdictOf(assessmentTest([itemRef("q1"), include])),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(featuresOf(accepted.unsupported), [
      `xi:include@qti-assessment-test/qti-test-part/qti-assessment-section/{${xincludeNamespace}}include`,
    ]);
  });

  it("refuses a test's outcome-only expression outside outcome processing once, as expression-placement", () => {
    const branch = el(
      "qti-branch-rule",
      [attr("target", "EXIT_TEST")],
      [
        el(
          "qti-gte",
          [],
          [
            el("qti-number-correct"),
            el("qti-base-value", [attr("base-type", "integer")], [text("1")]),
          ],
        ),
      ],
    );
    const verdict = verdictOf(assessmentTest([itemRef("q1", [branch])]));

    assert.deepStrictEqual(refusalsOf(verdict), [
      {
        location: {
          kind: "path",
          path: "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref/qti-branch-rule/qti-gte/qti-number-correct",
        },
        rule: "expression-placement",
      },
    ]);
    assert.strictEqual(verdict.kind, "test");
  });

  it("[I-5] refuses a test whose rubric block prints a variable the test does not declare, naming the test in the sentence", () => {
    const rubric = el(
      "qti-rubric-block",
      [attr("view", "candidate")],
      [
        el(
          "qti-content-body",
          [],
          [el("p", [], [el("qti-printed-variable", [attr("identifier", "NOPE")])])],
        ),
      ],
    );
    const verdict = verdictOf(assessmentTest([rubric, itemRef("q1")]));
    const path =
      "qti-assessment-test/qti-test-part/qti-assessment-section/qti-rubric-block/qti-content-body/p/qti-printed-variable/@identifier";

    assert.deepStrictEqual(refusalsOf(verdict), [
      { location: { kind: "path", path }, rule: "undeclared-variable" },
    ]);
    assert.strictEqual(verdict.kind, "test");
    assert.include(
      verdict.verdict === "refused" ? verdict.refusals.map(describeRefusal).join("\n") : "",
      "and the test declares no outcome `NOPE`.",
    );
  });

  it("leaves a qti-response-processing root unchecked, of kind response-processing", () => {
    const verdict = verdictOf(doc("match_correct.xml", matchCorrect));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.strictEqual(verdict.kind, "response-processing");
  });

  it("leaves a qti-outcome-declaration root unchecked, of kind outcome-declaration", () => {
    const verdict = verdictOf(doc("score.xml", score()));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.strictEqual(verdict.kind, "outcome-declaration");
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        { path: "qti-outcome-declaration", reason: "root" },
      ]);
    }
  });

  it("refuses a foreign root with kind none", () => {
    const xhtml = "http://www.w3.org/1999/xhtml";
    const verdict = verdictOf(doc("page.xml", el("html", [], [], xhtml)));

    assert.strictEqual(verdict.verdict, "refused");
    assert.strictEqual(verdict.kind, "none");
  });

  it.effect("refuses bytes that are not well-formed with kind none", () =>
    Effect.gen(function* notWellFormed() {
      const verdict = yield* open("broken.xml", new TextEncoder().encode("<qti-assessment-test"));

      assert.strictEqual(verdict.verdict, "refused");
      assert.strictEqual(verdict.kind, "none");
    }),
  );

  it("refuses an item with the kind item, and an item's accepting verdict carries kind item", () => {
    const refused = verdictOf(item([response("integer", "single", [correct("abc")])]));
    const accepted = verdictOf(item([body([el("p", [], [text("Hello")])])]));

    assert.strictEqual(refused.verdict, "refused");
    assert.strictEqual(refused.kind, "item");
    assert.strictEqual(accepted.verdict, "accepted");
    assert.strictEqual(accepted.kind, "item");
  });
});

/**
 * Construct an item whose paragraph holds an Inline Choice bound to `RESPONSE`: a choice `A` of
 * text, then a choice `B` of the given content.
 *
 * @param content Choice `B`'s children.
 * @returns The item.
 */
const inlineItem = (content: readonly SourceChild[]): SourceDocument =>
  item([
    response("identifier", "single"),
    body([
      el(
        "p",
        [],
        [
          text("Pick "),
          el(
            "qti-inline-choice-interaction",
            [attr("response-identifier", "RESPONSE")],
            [
              el("qti-inline-choice", [attr("identifier", "A")], [text("Ant")]),
              el("qti-inline-choice", [attr("identifier", "B")], content),
            ],
          ),
        ],
      ),
    ]),
  ]);

/**
 * The path of the Inline Choice {@link inlineItem} builds.
 */
const inlinePath = `${bodyPath}/p/qti-inline-choice-interaction`;

describe("check, an Inline Choice's choice content (I8)", () => {
  it("[Q-12] keeps the notice qti-inline-choice-interaction for a choice that holds an img, and lists it", () => {
    const accepted = acceptedOf(
      verdictOf(inlineItem([el("img", [attr("alt", "a bee"), attr("src", "bee.png")])])),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "qti-inline-choice-interaction", path: inlinePath, shown: "notice" },
    ]);
    assert.deepStrictEqual(outline(accepted.item.body), [
      { p: ["Pick ", `notice:qti-inline-choice-interaction@${inlinePath}`] },
    ]);
  });

  it("[Q-12] builds an Inline Choice whose choice holds an em", () => {
    const accepted = acceptedOf(verdictOf(inlineItem([el("em", [], [text("Bee")])])), "accepted");

    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(outline(accepted.item.body), [{ p: ["Pick ", "inline-choice"] }]);
  });
});

describe("acceptForTest", () => {
  it("wraps a hand-built item with its own unsupported features", () => {
    const built: Item = {
      body: [],
      document: "hand.xml",
      identifier: "hand",
      lang: Option.none(),
      outcomes: new Map(),
      processing: Option.none(),
      responses: new Map(),
      templateProcessing: Option.none(),
      templates: new Map(),
      title: "Hand",
      unsupported: [{ feature: "xml:base", path: root, shown: "mark" }],
    };
    const accepted = acceptForTest(built);

    assert.strictEqual(accepted.item, built);
    assert.strictEqual(accepted.document, "hand.xml");
    assert.deepStrictEqual(accepted.unsupported, built.unsupported);
  });
});

/**
 * A hand-built test model with one mark.
 */
const handTest: Test = {
  document: "tests/hand.xml",
  identifier: "hand",
  outcomeProcessing: { kind: "absent" },
  outcomes: new Map(),
  parts: [],
  title: "Hand",
  unsupported: [
    {
      feature: "qti-pre-condition",
      path: "qti-assessment-test/qti-test-part/qti-pre-condition",
      shown: "mark",
    },
  ],
};

describe("acceptTestForTest, acceptSectionForTest and acceptStimulusForTest", () => {
  it("wrap a hand-built test with its own document and unsupported features", () => {
    const accepted = acceptTestForTest(handTest);

    assert.strictEqual(accepted.test, handTest);
    assert.strictEqual(accepted.document, "tests/hand.xml");
    assert.deepStrictEqual(accepted.unsupported, handTest.unsupported);
  });

  it("wrap a hand-built section and stimulus summary as they are", () => {
    const summary: RootSummary = {
      document: "sections/hand.xml",
      identifier: "S",
      title: "Section",
      unsupported: [
        { feature: "root:qti-assessment-section", path: "qti-assessment-section", shown: "mark" },
      ],
    };

    assert.deepStrictEqual({ ...acceptSectionForTest(summary) }, summary);
    assert.deepStrictEqual({ ...acceptStimulusForTest(summary) }, summary);
  });

  it("give an AcceptedTest that redact does not take", () => {
    const accepted: AcceptedTest = acceptTestForTest(handTest);
    const redactTest = (): Redacted =>
      // @ts-expect-error -- redact takes an accepted item, and an AcceptedTest is not an Accepted.
      redact(accepted);

    assert.isFunction(redactTest);
  });
});

describe("acceptedItem", () => {
  it.effect(
    "gives BG007's accepted item, read from the corpus",
    () =>
      Effect.gen(function* bg007() {
        const location = "QTI3_BPIG_Examples/items/BG007.xml";
        const source = yield* readCorpusFile(location).pipe(
          Effect.flatMap((bytes) => readSource(location, bytes)),
        );
        const verdict = verdictOf(source);
        const accepted = acceptedItem(verdict);

        assert.strictEqual(Option.getOrUndefined(accepted), acceptedOf(verdict, "accepted"));
        assert.deepStrictEqual(
          accepted.pipe(Option.map(({ item: built }) => built.identifier)),
          Option.some("beginnersguide007"),
        );
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "[Q-12] accepts QTI3-inline-choice.xml with one Inline Choice of three choices",
    () =>
      Effect.gen(function* inlineChoiceItem() {
        const location = "QTI3_BPIG_Examples/items/QTI3-inline-choice.xml";
        const source = yield* readCorpusFile(location).pipe(
          Effect.flatMap((bytes) => readSource(location, bytes)),
        );
        const accepted = acceptedOf(verdictOf(source), "accepted");
        const inlineChoices = inlineChoicesIn(accepted.item.body);

        assert.deepStrictEqual(accepted.unsupported, []);
        assert.strictEqual(inlineChoices.length, 1);
        assert.strictEqual(inlineChoices[0]?.choices.length, 3);
      }),
    { tags: ["corpus"] },
  );

  it("gives the item of an accepted-with-unsupported verdict", () => {
    const verdict = verdictOf(
      item([body([el("p", [], [el("a", [attr("href", scriptUrl)], [text("Go")])])])]),
    );

    assert.strictEqual(
      Option.getOrUndefined(acceptedItem(verdict)),
      acceptedOf(verdict, "accepted-with-unsupported"),
    );
  });

  it("gives none for a refused verdict", () => {
    const xhtml = "http://www.w3.org/1999/xhtml";
    const verdict = verdictOf(doc("page.xml", el("html", [], [], xhtml)));

    assert.strictEqual(verdict.verdict, "refused");
    assert.deepStrictEqual(acceptedItem(verdict), Option.none());
  });

  it("gives none for an unchecked verdict", () => {
    const math = el("math", [], [el("mi", [], [text("x")], mathmlNamespace)], mathmlNamespace);
    const verdict = verdictOf(item([body([el("p", [], [math])])]));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.deepStrictEqual(acceptedItem(verdict), Option.none());
  });

  it("gives none for an accepted test", () => {
    const verdict = verdictOf(assessmentTest([itemRef("q1")]));

    assert.strictEqual(verdict.verdict, "accepted");
    assert.strictEqual(verdict.kind, "test");
    assert.deepStrictEqual(acceptedItem(verdict), Option.none());
  });
});

describe("unsupportedFeatures", () => {
  it("gives an accepted test's marks, a section's root mark and an item's features", () => {
    const test: Verdict = {
      accepted: acceptTestForTest(handTest),
      document: handTest.document,
      kind: "test",
      verdict: "accepted-with-unsupported",
    };
    const section = verdictOf(doc("section.xml", assessmentSection("S", [itemRef("q1")])));
    const linked = verdictOf(
      item([body([el("p", [], [el("a", [attr("href", scriptUrl)], [text("Go")])])])]),
    );

    assert.deepStrictEqual(unsupportedFeatures(test), handTest.unsupported);
    assert.deepStrictEqual(featuresOf(unsupportedFeatures(section)), [
      "root:qti-assessment-section@qti-assessment-section",
    ]);
    assert.deepStrictEqual(
      unsupportedFeatures(linked),
      acceptedOf(linked, "accepted-with-unsupported").unsupported,
    );
  });

  it("gives none for a refused and an unchecked verdict", () => {
    const xhtml = "http://www.w3.org/1999/xhtml";

    assert.deepStrictEqual(
      unsupportedFeatures(verdictOf(doc("page.xml", el("html", [], [], xhtml)))),
      [],
    );
    assert.deepStrictEqual(
      unsupportedFeatures(verdictOf(doc("match_correct.xml", matchCorrect))),
      [],
    );
  });
});

/**
 * Construct a refusal of a named document at a location.
 *
 * @param rule The rule it breaks.
 * @param document The document it refuses.
 * @param location Where in the document it points.
 * @param detail The facts its wording reads.
 * @returns The refusal.
 */
const refusalAt = (
  rule: RefusalRule,
  document: string,
  location: Location,
  detail: Readonly<Record<string, string>> = {},
): Refusal =>
  new Refusal({
    detail,
    document,
    location,
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });

/**
 * Construct a refusal of `item.xml` at the item root.
 *
 * @param rule The rule it breaks.
 * @param detail The facts its wording reads.
 * @returns The refusal.
 */
const refusalOf = (rule: RefusalRule, detail: Readonly<Record<string, string>>): Refusal =>
  refusalAt(rule, "item.xml", { kind: "path", path: root }, detail);

/**
 * What remains of a Markdown sentence once its code spans are removed, and the spans' contents.
 */
interface CodeSpans {
  readonly outside: string;
  readonly spans: readonly string[];
}

/**
 * Remove a line's code spans by CommonMark's rule (0.31.2, §6.1): a run of n backticks opens a
 * span that the next run of exactly n backticks closes, and a run that no later run closes is
 * literal text. A span's content loses one space at each end when it begins and ends with a space
 * and is not all spaces, where a space is U+0020 alone: a tab or any other whitespace is content.
 *
 * @param markdown One line of Markdown.
 * @returns The text outside the spans, and each span's content in order.
 */
const codeSpans = (markdown: string): CodeSpans => {
  const opener = /`+/u.exec(markdown);

  if (opener === null) {
    return { outside: markdown, spans: [] };
  }

  const [fence] = opener;
  const rest = markdown.slice(opener.index + fence.length);
  const closer = [...rest.matchAll(/`+/gu)].find((run) => run[0].length === fence.length);

  if (closer === undefined) {
    const after = codeSpans(rest);

    return {
      outside: markdown.slice(0, opener.index + fence.length) + after.outside,
      spans: after.spans,
    };
  }

  const content = rest.slice(0, closer.index);
  const padded = content.startsWith(" ") && content.endsWith(" ") && /[^ ]/u.test(content);
  const after = codeSpans(rest.slice(closer.index + fence.length));

  return {
    outside: markdown.slice(0, opener.index) + after.outside,
    spans: [padded ? content.slice(1, -1) : content, ...after.spans],
  };
};

/**
 * The gate review's value (P2-8): backticks that close a one-backtick span early, then an image
 * and a link.
 */
const escapingValue =
  "1`` ![](https://tracker.example/p.gif) [Approve item](https://evil.example) ``";

/**
 * The URI of 1EdTech's `match_correct` response processing template.
 */
const matchCorrectUri = "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct";

/**
 * QTI 3.0's content packaging namespace, which a package's manifest root is in.
 */
const qtiPackageNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * A hand-built refusal for each rule M2 adds, as the arguments of {@link refusalAt}, with the
 * author facts its wording must write in code spans. The refusals are built inside each test, so a
 * rule missing from the roster fails that test rather than the file.
 */
const m2Wordings: readonly {
  readonly args: readonly [RefusalRule, string, Location, Readonly<Record<string, string>>?];
  readonly name: string;
  readonly spans: readonly string[];
}[] = [
  {
    args: [
      "expression-placement",
      "test.xml",
      {
        kind: "path",
        path: "qti-assessment-test/qti-test-part/qti-pre-condition/qti-number-correct",
      },
      { context: "qti-pre-condition", element: "qti-number-correct", reading: "23" },
    ],
    name: "expression-placement of an element",
    spans: ["qti-number-correct", "qti-pre-condition", "qti-outcome-processing"],
  },
  {
    args: [
      "expression-placement",
      "test.xml",
      {
        kind: "path",
        path: "qti-assessment-test/qti-test-part/qti-branch-rule/qti-variable/@weight-identifier",
      },
      {
        attribute: "weight-identifier",
        context: "qti-branch-rule",
        element: "qti-variable",
        reading: "23",
      },
    ],
    name: "expression-placement of an attribute",
    spans: ["qti-variable", "weight-identifier", "qti-branch-rule", "qti-outcome-processing"],
  },
  {
    args: [
      "not-qti3-package",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest" },
      { element: "manifest", namespace: "http://www.imsglobal.org/xsd/imscp_v1p1" },
    ],
    name: "not-qti3-package",
    spans: ["manifest", "http://www.imsglobal.org/xsd/imscp_v1p1", qtiPackageNamespace],
  },
  {
    args: [
      "package-profile",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/metadata/schemaversion" },
      { schemaversion: "1.2" },
    ],
    name: "package-profile",
    spans: ["schemaversion", "1.2", "3.0.0", "3.0.1"],
  },
  {
    args: ["package-profile", "package/imsmanifest.xml", { kind: "path", path: "manifest" }],
    name: "package-profile with no schemaversion",
    spans: ["schemaversion", "3.0.0", "3.0.1"],
  },
  {
    args: ["package-manifest-missing", "package.zip", { kind: "document" }],
    name: "package-manifest-missing",
    spans: ["package.zip", "imsmanifest.xml"],
  },
  {
    args: ["package-path-outside", "package.zip", { kind: "document" }, { path: "../outside.xml" }],
    name: "package-path-outside of a file the package holds",
    spans: ["package.zip", "../outside.xml", "/", ".."],
  },
  {
    args: [
      "package-path-outside",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/file/@href" },
      { path: "../a.xml" },
    ],
    name: "package-path-outside of a manifest href",
    spans: [
      "package/imsmanifest.xml",
      "manifest/resources/resource/file/@href",
      "../a.xml",
      "/",
      "..",
      "xml:base",
    ],
  },
  {
    args: ["package-file-unlisted", "package.zip", { kind: "document" }, { path: "notes.txt" }],
    name: "package-file-unlisted",
    spans: ["notes.txt", "file"],
  },
  {
    args: [
      "package-file-missing",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/file/@href" },
      { path: "items/missing.xml", resource: "ITEM-1" },
    ],
    name: "package-file-missing",
    spans: ["ITEM-1", "items/missing.xml"],
  },
  {
    args: [
      "dependency-unresolved",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/dependency/@identifierref" },
      { dependency: "RES-9", resource: "ITEM-1" },
    ],
    name: "dependency-unresolved",
    spans: ["ITEM-1", "RES-9"],
  },
  {
    args: [
      "item-ref-unresolved",
      "tests/test.xml",
      {
        kind: "path",
        path: "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref/@href",
      },
      { href: "../items/q1.xml", identifier: "q1", path: "items/q1.xml" },
    ],
    name: "item-ref-unresolved",
    spans: ["q1", "../items/q1.xml", "items/q1.xml"],
  },
  {
    args: [
      "ambiguous-reference",
      "test.xml",
      { kind: "path", path: "qti-assessment-test/qti-outcome-processing/qti-variable/@identifier" },
      {
        firstPrefix: "a.b",
        firstVariable: "SCORE",
        reading: "48",
        reference: "a.b.SCORE",
        secondPrefix: "a",
        secondVariable: "b.SCORE",
      },
    ],
    name: "ambiguous-reference",
    spans: ["a.b.SCORE", "a.b", "SCORE", "a", "b.SCORE"],
  },
  {
    args: [
      "resource-type-mismatch",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/@type" },
      { path: "passages/night.xml", root: "qti-assessment-stimulus", type: "imsqti_item_xmlv3p0" },
    ],
    name: "resource-type-mismatch",
    spans: ["passages/night.xml", "imsqti_item_xmlv3p0", "qti-assessment-stimulus"],
  },
  {
    args: [
      "resource-type-mismatch",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/@type" },
      {
        expected: "imsqti_stimulus_xmlv3p0",
        path: "passages/night.xml",
        root: "qti-assessment-stimulus",
        type: "imsqti_item_xmlv3p0",
      },
    ],
    name: "resource-type-mismatch with the type the root names",
    spans: [
      "passages/night.xml",
      "imsqti_item_xmlv3p0",
      "qti-assessment-stimulus",
      "imsqti_stimulus_xmlv3p0",
    ],
  },
  {
    args: [
      "lom-identifier",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/metadata/lom/general/identifier" },
      {
        identifier: "choice",
        metadata: "qti_v2_item_01",
        path: "choice.xml",
        reading: "62",
        resource: "item-choice",
      },
    ],
    name: "lom-identifier",
    spans: ["choice.xml", "choice", "item-choice", "qti_v2_item_01", "identifier"],
  },
  {
    args: [
      "lom-identifier",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/metadata/lom/general/identifier[1]" },
      {
        identifier: "choice",
        metadata: "qti_v2_item_01",
        others: "2",
        path: "choice.xml",
        reading: "62",
        resource: "item-choice",
      },
    ],
    name: "lom-identifier with other entries",
    spans: ["choice.xml", "choice", "item-choice", "qti_v2_item_01", "identifier"],
  },
  {
    args: [
      "lom-title",
      "package/imsmanifest.xml",
      { kind: "path", path: "manifest/resources/resource/metadata/lom/general/title" },
      {
        metadata: "Metadata Example Item #1",
        path: "choice.xml",
        reading: "62",
        resource: "choice",
        title: "Unattended Luggage",
      },
    ],
    name: "lom-title",
    spans: ["choice.xml", "choice", "Unattended Luggage", "Metadata Example Item #1", "title"],
  },
  {
    args: [
      "expression-type",
      "tests/test.xml",
      { kind: "path", path: "qti-assessment-test/qti-outcome-processing/qti-lookup-outcome-value" },
      {
        element: "qti-lookup-outcome-value",
        expressionBaseType: "string",
        expressionCardinality: "single",
        identifier: "I1.SCORE",
        reading: "28",
      },
    ],
    name: "expression-type of a dotted lookup",
    spans: ["qti-lookup-outcome-value", "I1.SCORE", "string", "integer", "float", "duration"],
  },
];

describe("describeRefusal", () => {
  it("words every rule in refusalRules", () => {
    for (const rule of refusalRules) {
      assert.isAbove(describeRefusal(refusalOf(rule, {})).length, 0, rule);
    }
  });

  it("keeps a value holding backticks inside one code span, whole", () => {
    const { outside, spans } = codeSpans(
      describeRefusal(refusalOf("value-type", { baseType: "integer", lexical: escapingValue })),
    );

    assert.notInclude(outside, "![");
    assert.notInclude(outside, "](");
    assert.include(spans, escapingValue);
  });

  it("keeps the document, the path, the parser's message and the reader's detail inside code spans, whole", () => {
    const sentences = {
      "document as a whole": describeRefusal(
        refusalAt("unknown-element", escapingValue, { kind: "document" }),
      ),
      "document at a path": describeRefusal(
        refusalAt("unknown-element", escapingValue, { kind: "path", path: root }),
      ),
      "document at a position": describeRefusal(
        refusalAt("unknown-element", escapingValue, { column: 3, kind: "position", line: 2 }),
      ),
      "document not QTI": describeRefusal(
        refusalAt("not-qti-root", escapingValue, { kind: "document" }),
      ),
      "not-well-formed message": describeRefusal(
        refusalAt(
          "not-well-formed",
          "item.xml",
          { column: 3, kind: "position", line: 2 },
          { message: escapingValue },
        ),
      ),
      path: describeRefusal(
        refusalAt("unknown-element", "item.xml", { kind: "path", path: escapingValue }),
      ),
      "reader-refused detail": describeRefusal(
        refusalAt("reader-refused", "item.xml", { kind: "document" }, { detail: escapingValue }),
      ),
    };

    for (const [where, sentence] of Object.entries(sentences)) {
      const { outside, spans } = codeSpans(sentence);

      assert.notInclude(outside, "![", where);
      assert.notInclude(outside, "](", where);
      assert.include(spans, escapingValue, where);
    }
  });

  it("keeps a value of spaces and other whitespace whole inside its code span", () => {
    for (const lexical of [" \t ", "  \t\t  ", " \u00A0 ", " \t", "\t ", "\t", "   "]) {
      const { spans } = codeSpans(
        describeRefusal(refusalOf("value-type", { baseType: "integer", lexical })),
      );

      assert.include(spans, lexical, JSON.stringify(lexical));
    }
  });

  it("writes a value holding a blank line on the sentence's one line", () => {
    const sentence = describeRefusal(
      refusalOf("value-type", {
        baseType: "integer",
        lexical: "1\n\n![](https://tracker.example/p.gif)\r\n",
      }),
    );

    assert.notMatch(sentence, /[\n\r]/u);
    assert.notInclude(codeSpans(sentence).outside, "![");
  });

  it("[I-9a] gives a duration's value-type the seconds remedy a parse failure gives, and keeps an integer's sentence", () => {
    const sentence = describeRefusal(
      refusalOf("value-type", { baseType: "duration", lexical: "PT1M" }),
    );
    const { spans } = codeSpans(sentence);
    const parse = new InvalidValue({ baseType: "duration", lexical: "PT1M" }).message;
    const remedy = parse.slice(parse.indexOf("; write ") + "; ".length);

    assert.include(spans, "PT1M");
    assert.include(spans, "90.5");
    assert.include(spans, "PT1M30.5S");
    assert.include(sentence.replaceAll("`", ""), `To make it valid: ${remedy}.`);
    assert.include(
      describeRefusal(refusalOf("value-type", { baseType: "integer", lexical: "1.5" })),
      "`1.5` is not a value of base type `integer`. Rule `value-type`. To make it valid: write a value of base type `integer`.",
    );
  });

  it("cites the reading that refuses a child, and names QTI 3.0's schema only when none does", () => {
    const cited = describeRefusal(
      refusalOf("unknown-element", { element: "b", parent: "data", reading: "60" }),
    );
    const schema = describeRefusal(refusalOf("unknown-element", { element: "b", parent: "p" }));

    assert.include(
      cited,
      "`data` may not hold `b`; XML Schema allows no such child there (reading 60).",
    );
    assert.notInclude(cited, "QTI 3.0's schema");
    assert.include(schema, "`p` may not hold `b`; QTI 3.0's schema allows no such child there.");
  });

  it("[I-9a] cites the information model's line for an attribute-type refusal no reading settles, and the reading where one does", () => {
    const sourced = describeRefusal(
      refusalOf("attribute-type", {
        attribute: "figures",
        element: "qti-round-to",
        expected: "an integer at least 1 when rounding-mode is significantFigures",
        least: "1",
        source: "info.txt:39732",
        value: "0",
        whenAttribute: "rounding-mode",
        whenValue: "significantFigures",
      }),
    );
    const read = describeRefusal(
      refusalOf("attribute-type", {
        attribute: "min-choices",
        element: "qti-order-interaction",
        expected: "an integer at least 1",
        reading: "18",
        source: "info.txt:1",
        value: "0",
      }),
    );

    assert.include(
      sourced,
      "`qti-round-to`'s attribute `figures` is `0`, which is not an integer at least 1 when rounding-mode is significantFigures (info.txt:39732).",
    );
    assert.include(
      sourced,
      "To make it valid: write a value that is an integer at least 1 when rounding-mode is significantFigures.",
    );
    assert.include(read, "which is not an integer at least 1 (reading 18).");
    assert.notInclude(read, "info.txt");
  });

  it("[I-9a] words a declaration that takes a built-in variable's identifier, citing the information model's line (pantry DeclarationNotReserved)", () => {
    const sentence = describeRefusal(
      refusalOf("attribute-type", {
        attribute: "identifier",
        check: "reserved-identifier",
        element: "qti-outcome-declaration",
        expected:
          "an identifier other than the built-in variables' completionStatus, numAttempts and duration",
        pantry: "DeclarationNotReserved",
        source: "info.txt:12006",
        value: "completionStatus",
      }),
    );

    assert.include(
      sentence,
      "`qti-outcome-declaration`'s attribute `identifier` is `completionStatus`, the identifier of a built-in variable, which no declaration may take (info.txt:12006).",
    );
    assert.include(sentence, "Rule `attribute-type`.");
    assert.include(
      sentence,
      "To make it valid: give `qti-outcome-declaration` another identifier; the built-in variable needs no declaration.",
    );
  });

  it("[I-9a] words an outcome SCORE, MAXSCORE or PASSED of another base type, citing the information model's line (pantry ReservedOutcomeTypes)", () => {
    const sentence = describeRefusal(
      refusalOf("attribute-type", {
        attribute: "base-type",
        baseType: "float",
        check: "reserved-outcome-type",
        element: "qti-outcome-declaration",
        expected: "float, the base type of an outcome named SCORE",
        identifier: "SCORE",
        pantry: "ReservedOutcomeTypes",
        source: "info.txt:8478",
        value: "integer",
      }),
    );

    assert.include(
      sentence,
      "`qti-outcome-declaration`'s attribute `base-type` is `integer`, but an outcome named `SCORE` must have the base type `float` (info.txt:8478).",
    );
    assert.include(sentence, "Rule `attribute-type`.");
    assert.include(
      sentence,
      "To make it valid: change `base-type` to `float`, or give `qti-outcome-declaration` another identifier.",
    );
  });

  it("[I-9a] words a qti-equal tolerance whose token is neither a number nor a variable's name, citing the information model's line (pantry P6)", () => {
    const sentence = describeRefusal(
      refusalOf("attribute-type", {
        attribute: "tolerance",
        check: "tolerance-token",
        element: "qti-equal",
        expected: "a list of numbers (xs:double) and variable names (NCName), one space apart",
        pantry: "P6",
        source: "info.txt:24946",
        value: "1,5",
      }),
    );

    assert.include(
      sentence,
      "`qti-equal`'s attribute `tolerance` is `1,5`, which holds a token that is neither a number (`xs:double`) nor a variable's name (an NCName) (info.txt:24946).",
    );
    assert.include(
      sentence,
      "To make it valid: write each token of `tolerance` as a number or a variable's name, one space apart.",
    );
  });

  it("[I-9a] names the mode under which a qti-equal must carry a tolerance, and cites the information model's line", () => {
    const sentence = describeRefusal(
      refusalOf("missing-attribute", {
        attribute: "tolerance",
        element: "qti-equal",
        source: "info.txt:24946",
        whenAttribute: "tolerance-mode",
        whenValue: "relative",
      }),
    );
    const unconditional = describeRefusal(
      refusalOf("missing-attribute", { attribute: "identifier", element: "qti-simple-choice" }),
    );

    assert.include(
      sentence,
      "`qti-equal` must carry the attribute `tolerance` when `tolerance-mode` is `relative`, and it has none (info.txt:24946).",
    );
    assert.include(sentence, "To make it valid: add `tolerance` to `qti-equal`.");
    assert.include(
      unconditional,
      "`qti-simple-choice` must carry the attribute `identifier`, and it has none.",
    );
  });

  it("names which operand of a qti-equal is not a single integer or float", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        acceptsBaseTypes: "integer float",
        acceptsCardinalities: "single",
        check: "operand",
        element: "qti-equal",
        expressionBaseType: "string",
        expressionCardinality: "single",
        operand: "2",
      }),
    );

    assert.include(sentence, "Operand 2 of `qti-equal` is a single `string` value");
    assert.include(sentence, "a single `integer` or `float`");
    assert.notInclude(sentence, "outcome");
  });

  it("names the condition of a qti-response-if that is not a single boolean", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        check: "condition",
        element: "qti-response-if",
        expressionBaseType: "integer",
        expressionCardinality: "single",
      }),
    );

    assert.include(sentence, "The condition of `qti-response-if` is a single `integer` value");
    assert.include(sentence, "not a single `boolean`");
    assert.notInclude(sentence, "outcome, to a");
  });

  it("names the operand of a qti-and that is not a single boolean, and what qti-and takes", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        acceptsBaseTypes: "boolean",
        acceptsCardinalities: "single",
        check: "operand",
        element: "qti-and",
        expressionBaseType: "integer",
        expressionCardinality: "multiple",
        operand: "3",
      }),
    );

    assert.include(sentence, "Operand 3 of `qti-and` is a multiple `integer` value");
    assert.include(sentence, "it takes a single `boolean` value");
    assert.notInclude(sentence, "`float`");
    assert.notInclude(sentence, "outcome, to a");
  });

  it("names the cardinalities a qti-container-size takes, of any base type, and no base type in a code span", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        acceptsBaseTypes: "any",
        acceptsCardinalities: "multiple ordered",
        check: "operand",
        element: "qti-container-size",
        expressionBaseType: "",
        expressionCardinality: "record",
        operand: "1",
      }),
    );
    const { spans } = codeSpans(sentence);

    assert.include(sentence, "Operand 1 of `qti-container-size` is a record untyped value");
    assert.include(sentence, "a multiple or ordered value of any base type");
    assert.notInclude(sentence, "outcome, to a");

    for (const baseType of [...baseTypes, "any"]) {
      assert.notInclude(spans, baseType, baseType);
    }
  });

  it("names the attribute of a qti-any-n whose reference is not a single integer variable", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        attribute: "min",
        check: "reference",
        element: "qti-any-n",
        expectedBaseType: "integer",
        identifier: "LABEL",
      }),
    );

    assert.include(sentence, "`qti-any-n`'s attribute `min` names `LABEL`");
    assert.include(sentence, "not a single template or outcome variable of base type `integer`");
    assert.notInclude(sentence, "outcome, to a");
  });

  it("[I-5] offers a test's printed variable only an outcome the test declares, never a template variable, for its base and for its identifier (pantry printed-variable-ref)", () => {
    const base = describeRefusal(
      refusalOf("expression-type", {
        attribute: "base",
        check: "reference",
        declarer: "test",
        element: "qti-printed-variable",
        expectedBaseType: "integer",
        identifier: "SCORE",
      }),
    );
    const named = describeRefusal(
      refusalOf("expression-type", {
        attribute: "identifier",
        check: "reference",
        declarer: "test",
        element: "qti-printed-variable",
        identifier: "duration",
        source: "info.txt:70296",
        variableKind: "response",
      }),
    );

    assert.include(
      base,
      "`qti-printed-variable`'s attribute `base` names `SCORE`, which is not a single outcome variable of base type `integer`.",
    );
    assert.include(
      base,
      "To make it valid: in `base`, name a single outcome variable of base type `integer` that the test declares, or write a value of that base type.",
    );
    assert.include(
      named,
      "`qti-printed-variable`'s attribute `identifier` names `duration`, a response variable, which is not an outcome variable (info.txt:70296).",
    );
    assert.include(
      named,
      "To make it valid: in `identifier`, name an outcome variable that the test declares.",
    );

    for (const sentence of [base, named]) {
      assert.notInclude(sentence, "template");
    }
  });

  it("[I-5] names a printed variable's identifier that names a response as neither a template nor an outcome variable, and says no base type (pantry printed-variable-ref)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        attribute: "identifier",
        check: "reference",
        element: "qti-printed-variable",
        identifier: "RESPONSE",
        source: "info.txt:70296",
        variableKind: "response",
      }),
    );
    const remedy = sentence.slice(sentence.indexOf("To make it valid:"));

    assert.include(
      sentence,
      "`qti-printed-variable`'s attribute `identifier` names `RESPONSE`, a response variable, which is neither a template nor an outcome variable (info.txt:70296).",
    );
    assert.include(remedy, "name a template or outcome variable in `identifier`");
    assert.include(remedy, "an outcome that response processing sets to the response's value");
    assert.notInclude(sentence, "base type");
    assert.notInclude(sentence, "untyped");
    assert.notInclude(sentence, "single");
  });

  it("[I-5] names a printed variable's identifier that names a context variable, with no remedy about a response (pantry printed-variable-ref)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        attribute: "identifier",
        check: "reference",
        element: "qti-printed-variable",
        identifier: "CONTEXT",
        source: "info.txt:70296",
        variableKind: "context",
      }),
    );

    assert.include(
      sentence,
      "`qti-printed-variable`'s attribute `identifier` names `CONTEXT`, a context variable, which is neither a template nor an outcome variable (info.txt:70296).",
    );
    assert.include(
      sentence,
      "To make it valid: name a template or outcome variable in `identifier`.",
    );
    assert.notInclude(sentence, "base type");
  });

  it("[I-5] names a template-identifier that names a float template variable as not an identifier template variable, single or multiple, citing the element's line (pantry template-ref)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        attribute: "template-identifier",
        check: "reference",
        element: "qti-simple-choice",
        expectedBaseType: "identifier",
        expectedCardinalities: "single multiple",
        identifier: "F",
        source: "info.txt:42466",
      }),
    );
    const remedy = sentence.slice(sentence.indexOf("To make it valid:"));

    assert.include(
      sentence,
      "`qti-simple-choice`'s attribute `template-identifier` names `F`, which is not a template variable of base type `identifier`, single or multiple (info.txt:42466).",
    );
    assert.include(
      remedy,
      "name a template variable of base type `identifier`, single or multiple, in `template-identifier`",
    );
    assert.notInclude(sentence, "outcome");
    assert.notInclude(sentence, "a single template");
  });

  it("[I-5] names the response variable a template rule reads, which may read only template and context variables (pantry P26)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        check: "template-read",
        element: "qti-variable",
        identifier: "RESPONSE",
        variableKind: "response",
      }),
    );

    assert.include(
      sentence,
      "`qti-variable` reads `RESPONSE`, a response variable, in template processing, which may read only template and context variables (info.txt:65111).",
    );
    assert.include(sentence, "To make it valid: read a template variable instead.");
    assert.notInclude(sentence, "correct or default");
    assert.notInclude(sentence, "outcome, to a");
  });

  it("[I-5] words a template rule's qti-correct of a response with a remedy that names neither qti-correct nor qti-default (pantry P26)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        check: "template-read",
        element: "qti-correct",
        identifier: "RESPONSE",
        variableKind: "response",
      }),
    );
    const remedy = sentence.slice(sentence.indexOf("To make it valid:"));

    assert.include(
      sentence,
      "`qti-correct` reads `RESPONSE`, a response variable, in template processing, which may read only template and context variables (info.txt:65111).",
    );
    assert.include(remedy, "a template variable");
    assert.notInclude(remedy, "qti-correct");
    assert.notInclude(remedy, "qti-default");
  });

  it("[I-5] names the attribute through which a template rule reads a response, qti-repeat's number-repeats (pantry P26)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        attribute: "number-repeats",
        check: "template-read",
        element: "qti-repeat",
        identifier: "RESPONSE",
        variableKind: "response",
      }),
    );
    const remedy = sentence.slice(sentence.indexOf("To make it valid:"));

    assert.include(
      sentence,
      "`qti-repeat`'s attribute `number-repeats` names `RESPONSE`, a response variable, in template processing, which may read only template and context variables (info.txt:65111).",
    );
    assert.include(remedy, "name a template variable in `number-repeats`");
    assert.notInclude(remedy, "qti-correct");
    assert.notInclude(remedy, "qti-default");
  });

  it("[I-5] names the template variable a qti-set-template-value sets to a value of another type, not an outcome (pantry P20)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        element: "qti-set-template-value",
        expressionBaseType: "float",
        expressionCardinality: "single",
        identifier: "N",
        outcomeBaseType: "integer",
        outcomeCardinality: "single",
        targetKind: "template",
      }),
    );

    assert.include(
      sentence,
      "`qti-set-template-value` sets `N`, a single `integer` template variable, to a single `float` value.",
    );
    assert.notInclude(sentence, "outcome");
  });

  it("[I-5] names the response whose correct response a qti-set-correct-response sets to a value of another type, not an outcome (pantry P20)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        element: "qti-set-correct-response",
        expressionBaseType: "integer",
        expressionCardinality: "single",
        identifier: "RESPONSE",
        outcomeBaseType: "identifier",
        outcomeCardinality: "single",
        targetKind: "response",
      }),
    );

    assert.include(
      sentence,
      "`qti-set-correct-response` sets the correct response of `RESPONSE`, a single `identifier` response, to a single `integer` value.",
    );
    assert.notInclude(sentence, "outcome");
  });

  it("[I-5] names the outcome a qti-set-outcome-value sets, with no target kind in its detail (pantry P20)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        element: "qti-set-outcome-value",
        expressionBaseType: "integer",
        expressionCardinality: "single",
        identifier: "SCORE",
        outcomeBaseType: "float",
        outcomeCardinality: "single",
      }),
    );

    assert.include(
      sentence,
      "`qti-set-outcome-value` sets `SCORE`, a single `float` outcome, to a single `integer` value.",
    );
  });

  it("[I-5] names the kinds of variable a template rule's target must be when the item declares none of them by its name (pantry P8, DeclaredRefKind)", () => {
    const template = describeRefusal(
      refusalOf("undeclared-variable", {
        element: "qti-set-template-value",
        expected: "template",
        identifier: "RESPONSE",
      }),
    );
    const defaulted = describeRefusal(
      refusalOf("undeclared-variable", {
        element: "qti-set-default-value",
        expected: "response outcome",
        identifier: "N",
      }),
    );

    assert.include(
      template,
      "`qti-set-template-value` names `RESPONSE`, and the item declares no template variable `RESPONSE`.",
    );
    assert.include(
      template,
      "To make it valid: declare `RESPONSE`, or name a declared template variable.",
    );
    assert.include(
      defaulted,
      "`qti-set-default-value` names `N`, and the item declares no response or outcome `N`.",
    );
    assert.include(
      defaulted,
      "To make it valid: declare `N`, or name a declared response or outcome.",
    );
  });

  it("[T-9] names the test as the declarer of a variable a test's qti-variable reads and nothing declares, and keeps the fix to declare it, which a test may", () => {
    const sentence = describeRefusal(
      refusalOf("undeclared-variable", {
        declarer: "test",
        element: "qti-variable",
        expected: "variable",
        identifier: "NOPE",
      }),
    );

    assert.include(
      sentence,
      "`qti-variable` names `NOPE`, and the test declares no variable `NOPE`.",
    );
    assert.include(sentence, "To make it valid: declare `NOPE`, or name a declared variable.");
    assert.notInclude(sentence, "the item declares");
  });

  it("[T-9] tells a test's qti-map-response or qti-correct, with the test as the declarer, to name an item's response through its item ref, since a test declares no response", () => {
    for (const element of ["qti-map-response", "qti-correct"]) {
      for (const identifier of ["SCORE", "A.B"]) {
        const sentence = describeRefusal(
          refusalOf("undeclared-variable", {
            declarer: "test",
            element,
            expected: "response",
            identifier,
          }),
        );

        assert.include(
          sentence,
          `\`${element}\` names \`${identifier}\`, and the test declares no response \`${identifier}\`; only an item declares responses.`,
          `${element} ${identifier}`,
        );
        assert.include(
          sentence,
          "To make it valid: name a response an item declares, through its item ref, written `ITEMREF.RESPONSE`.",
          `${element} ${identifier}`,
        );
        assert.notInclude(sentence, "the item declares", `${element} ${identifier}`);
        assert.notInclude(sentence, `declare \`${identifier}\``, `${element} ${identifier}`);
      }
    }
  });

  it("[T-9] names the built-in a test's qti-correct reads, with the test as the declarer, as the built-in, and gives the item-ref fix", () => {
    for (const identifier of ["numAttempts", "duration"]) {
      const sentence = describeRefusal(
        refusalOf("undeclared-variable", {
          declarer: "test",
          element: "qti-correct",
          expected: "response",
          identifier,
        }),
      );

      assert.include(
        sentence,
        `\`qti-correct\` names the built-in \`${identifier}\`, which has no declaration, so no mapping or correct response.`,
        identifier,
      );
      assert.include(
        sentence,
        "To make it valid: name a response an item declares, through its item ref, written `ITEMREF.RESPONSE`.",
        identifier,
      );
      assert.notInclude(sentence, "declares no", identifier);
      assert.notInclude(sentence, `declare \`${identifier}\``, identifier);
    }
  });

  it("names a built-in a mapping or correct response reads as the built-in, which has no declaration (built-in or dotted response wording)", () => {
    for (const element of ["qti-map-response", "qti-correct"]) {
      for (const identifier of ["numAttempts", "duration"]) {
        const sentence = describeRefusal(
          refusalOf("undeclared-variable", { element, expected: "response", identifier }),
        );

        assert.include(
          sentence,
          `\`${element}\` names the built-in \`${identifier}\`, which has no declaration, so no mapping or correct response.`,
        );
        assert.include(sentence, "To make it valid: name a declared response.");
        assert.notInclude(sentence, `declare \`${identifier}\``);
      }
    }
  });

  it("names a dotted name a mapping or correct response reads as a read through an item ref, test part or section (built-in or dotted response wording)", () => {
    for (const element of ["qti-map-response", "qti-correct"]) {
      for (const identifier of ["I1.numAttempts", "I1.SCORE"]) {
        const sentence = describeRefusal(
          refusalOf("undeclared-variable", {
            element,
            expected: "response",
            identifier,
            prefix: "I1",
          }),
        );

        assert.include(
          sentence,
          `\`${element}\` names \`${identifier}\`, which reads, through an item ref, test part or section, a variable that is not a response its item declares.`,
        );
        assert.include(
          sentence,
          "To make it valid: name a response the item declares, written `ITEMREF.RESPONSE`.",
        );
        assert.notInclude(sentence, `declare \`${identifier}\``);
      }
    }
  });

  it("keeps the declaration fix for an undotted name that is no built-in (built-in or dotted response wording, control)", () => {
    for (const element of ["qti-map-response", "qti-correct"]) {
      const sentence = describeRefusal(
        refusalOf("undeclared-variable", { element, expected: "response", identifier: "SCORE" }),
      );

      assert.include(sentence, "the item declares no response `SCORE`.");
      assert.include(sentence, "To make it valid: declare `SCORE`, or name a declared response.");
    }
  });

  it("gives a dotted name no ref is read through, one an item declares whole, the sentence that names no item ref (dotted wording through a ref only)", () => {
    for (const element of ["qti-map-response", "qti-correct"]) {
      for (const identifier of ["X.Y", "A.B"]) {
        const sentence = describeRefusal(
          refusalOf("undeclared-variable", { element, expected: "response", identifier }),
        );

        assert.include(
          sentence,
          `\`${element}\` names \`${identifier}\`, and the item declares no response \`${identifier}\`.`,
          `${element} ${identifier}`,
        );
        assert.notInclude(sentence, "item ref", `${element} ${identifier}`);
        assert.notInclude(sentence, "ITEMREF.RESPONSE", `${element} ${identifier}`);
      }
    }
  });

  it("keeps the item-ref sentence for a dotted name read through a ref, the built-in sentence and the declaration fix (dotted wording through a ref only, control)", () => {
    for (const element of ["qti-map-response", "qti-correct"]) {
      for (const [identifier, prefix] of [
        ["I1.SCORE", "I1"],
        ["I1.numAttempts", "I1"],
        ["X.Y", "X"],
      ] as const) {
        const sentence = describeRefusal(
          refusalOf("undeclared-variable", { element, expected: "response", identifier, prefix }),
        );

        assert.include(
          sentence,
          `\`${element}\` names \`${identifier}\`, which reads, through an item ref, test part or section, a variable that is not a response its item declares.`,
          `${element} ${identifier}`,
        );
        assert.include(
          sentence,
          "To make it valid: name a response the item declares, written `ITEMREF.RESPONSE`.",
          `${element} ${identifier}`,
        );
      }

      const builtIn = describeRefusal(
        refusalOf("undeclared-variable", {
          element,
          expected: "response",
          identifier: "numAttempts",
        }),
      );
      const undotted = describeRefusal(
        refusalOf("undeclared-variable", { element, expected: "response", identifier: "SCORE" }),
      );

      assert.include(builtIn, `names the built-in \`numAttempts\`, which has no declaration`);
      assert.include(undotted, "To make it valid: declare `SCORE`, or name a declared response.");
    }
  });

  it("names the base type of a weighted qti-test-variables that is not float, says a weight is defined only for float or none, and gives the fix: drop the weight or the base-type (G-R3 199)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        baseType: "integer",
        check: "weight",
        element: "qti-test-variables",
      }),
    );

    assert.include(
      sentence,
      "`qti-test-variables` is weighted and has the base type `integer`, but a weight is defined only for the base type `float` or none (info.txt:71457).",
    );
    assert.include(
      sentence,
      "To make it valid: remove `weight-identifier` from `qti-test-variables`, or remove its `base-type`.",
    );
    assert.notInclude(sentence, "outcome, to a");
  });

  it("names the built-in duration an item that is not time dependent reads, and the attribute that names it", () => {
    const read = describeRefusal(
      refusalOf("undeclared-variable", {
        check: "untimed-duration",
        element: "qti-variable",
        identifier: "duration",
      }),
    );
    const named = describeRefusal(
      refusalOf("undeclared-variable", {
        attribute: "min",
        check: "untimed-duration",
        element: "qti-any-n",
        identifier: "duration",
      }),
    );

    assert.include(
      read,
      "`qti-variable` reads the built-in `duration`, which an item that is not time dependent does not have",
    );
    assert.include(read, '`time-dependent="true"`');
    assert.notInclude(read, "declares no");
    assert.include(named, "`qti-any-n`'s attribute `min` names the built-in `duration`");
    assert.notInclude(named, "declares no");
  });

  it("[I-9a] names the built-in a qti-lookup-outcome-value sets, which only a qti-set-outcome-value may set, and cites the information model's line", () => {
    const sentence = describeRefusal(
      refusalOf("undeclared-variable", {
        check: "built-in-target",
        element: "qti-lookup-outcome-value",
        identifier: "completionStatus",
        source: "info.txt:8488",
      }),
    );

    assert.include(
      sentence,
      "`qti-lookup-outcome-value` sets the built-in `completionStatus`, which only a `qti-set-outcome-value` may set (info.txt:8488).",
    );
    assert.include(
      sentence,
      "To make it valid: set `completionStatus` with a `qti-set-outcome-value`, or name a declared outcome.",
    );
  });

  it("[T-9] words the lookup operand of a dotted target by what every lookup reads, and names no table (reading 28)", () => {
    const sentence = describeRefusal(
      refusalOf("expression-type", {
        element: "qti-lookup-outcome-value",
        expressionBaseType: "string",
        expressionCardinality: "single",
        identifier: "I1.SCORE",
        reading: "28",
      }),
    );

    assert.include(
      sentence,
      "`qti-lookup-outcome-value` looks `I1.SCORE` up with a single `string` value, but a lookup reads only a single `integer`, `float` or `duration` value (reading 28).",
    );
    assert.include(
      sentence,
      "To make it valid: look `I1.SCORE` up with a single `integer`, `float` or `duration` value.",
    );
    assert.notInclude(sentence, "table");
    assert.notInclude(sentence, "sets");
  });

  it("names a dotted name that resolves to no item ref, test part or section variable (reading 48)", () => {
    const sentence = describeRefusal(
      refusalOf("undeclared-variable", {
        check: "reading",
        element: "qti-variable",
        identifier: "part1.SCORE",
        reading: "48",
      }),
    );

    assert.include(
      sentence,
      "`qti-variable` names `part1.SCORE`, which resolves to no item ref, test part or section variable (reading 48).",
    );
    assert.notInclude(sentence, "declares no");
  });

  it("names the attribute that names an undeclared variable", () => {
    const sentence = describeRefusal(
      refusalOf("undeclared-variable", {
        attribute: "min",
        element: "qti-any-n",
        expected: "variable",
        identifier: "MIN",
      }),
    );

    assert.include(
      sentence,
      "`qti-any-n`'s attribute `min` names `MIN`, and the item declares no variable `MIN`.",
    );
  });

  it("[I-5] names the test, not an item, as what declares no outcome a test's printed variable names (pantry printed-variable-ref, binding-declared)", () => {
    const sentence = describeRefusal(
      refusalOf("undeclared-variable", {
        attribute: "identifier",
        declarer: "test",
        element: "qti-printed-variable",
        expected: "outcome",
        identifier: "NOPE",
      }),
    );

    assert.include(
      sentence,
      "`qti-printed-variable`'s attribute `identifier` names `NOPE`, and the test declares no outcome `NOPE`.",
    );
    assert.include(sentence, "To make it valid: declare `NOPE`, or name a declared outcome.");
    assert.notInclude(sentence, "the item");
  });

  it("names the qti-map-response that needs a mapping, not a template", () => {
    const sentence = describeRefusal(
      refusalOf("template-requirements", {
        child: "qti-mapping",
        declaration: "qti-response-declaration",
        element: "qti-map-response",
        identifier: "RESPONSE",
      }),
    );

    assert.include(sentence, "`qti-map-response`");
    assert.notInclude(sentence, "response processing template");
  });

  it("names the response processing template and its URI when a template needs the declaration", () => {
    const sentence = describeRefusal(
      refusalOf("template-requirements", {
        child: "qti-mapping",
        declaration: "qti-response-declaration",
        element: "qti-response-processing",
        identifier: "RESPONSE",
        template: matchCorrectUri,
      }),
    );

    assert.include(sentence, "response processing template");
    assert.include(sentence, matchCorrectUri);
  });

  it("words a dotted map-response or map-response-point whose response lacks what it needs as a response of the item an item ref names, fixed in that item, never asking to declare the dotted name (dotted mapping remedy)", () => {
    const cases = [
      ["qti-map-response", { child: "qti-mapping" }, "with a `qti-mapping`", "a `qti-mapping`"],
      [
        "qti-map-response-point",
        { baseType: "point", child: "qti-area-mapping" },
        "of base type `point` with a `qti-area-mapping`",
        "a `qti-area-mapping` and the base type `point`",
      ],
    ] as const;

    for (const [element, needs, lacks, gives] of cases) {
      const sentence = describeRefusal(
        refusalOf("template-requirements", {
          ...needs,
          declaration: "qti-response-declaration",
          element,
          identifier: "ITEM1.UNMAPPED",
          prefix: "ITEM1",
        }),
      );

      assert.include(
        sentence,
        `\`${element}\` reads \`ITEM1.UNMAPPED\`, a response of the item that item ref \`ITEM1\` names, and that item does not declare it ${lacks}.`,
        element,
      );
      assert.include(
        sentence,
        `To make it valid: give that response ${gives} in the item that item ref \`ITEM1\` names.`,
        element,
      );
      assert.notInclude(sentence, "declare `ITEM1.UNMAPPED`", element);
      assert.notInclude(sentence, "the item has none", element);
    }
  });

  it("keeps the declaration fix for an item's own map-response, whose refusal has no prefix (dotted mapping remedy, control)", () => {
    const sentence = describeRefusal(
      refusalOf("template-requirements", {
        child: "qti-mapping",
        declaration: "qti-response-declaration",
        element: "qti-map-response",
        identifier: "RESPONSE",
      }),
    );

    assert.include(
      sentence,
      "`qti-map-response` needs `RESPONSE` in a `qti-response-declaration` with a `qti-mapping`, and the item has none.",
    );
    assert.include(
      sentence,
      "To make it valid: declare `RESPONSE` in a `qti-response-declaration` with a `qti-mapping`.",
    );
    assert.notInclude(sentence, "item ref");
  });

  it.each(m2Wordings)("writes the author facts of $name in code spans", ({ args, spans }) => {
    const [rule] = args;
    const sentence = describeRefusal(refusalAt(...args));
    const written = codeSpans(sentence);

    assert.notMatch(sentence, /[\n\r]/u);
    assert.include(written.spans, rule);

    for (const span of spans) {
      assert.include(written.spans, span);
    }
  });

  it("[I-9a] gives an item's weighted qti-variable the weight remedy in an item: remove the attribute, never move it into outcome processing", () => {
    const sentence = describeRefusal(
      refusalAt(
        "expression-placement",
        "item.xml",
        {
          kind: "path",
          path: `${root}/qti-response-processing/qti-set-outcome-value/qti-variable/@weight-identifier`,
        },
        { attribute: "weight-identifier", element: "qti-variable", reading: "23" },
      ),
    );
    const { spans } = codeSpans(sentence);

    assert.include(spans, "qti-variable");
    assert.include(spans, "weight-identifier");
    assert.notInclude(spans, "qti-outcome-processing");
    assert.include(sentence, "To make it valid: remove `weight-identifier` from `qti-variable`.");
  });

  it("names both readings of an ambiguous reference, each its prefix and its variable", () => {
    const ambiguous = m2Wordings.find(({ args: [rule] }) => rule === "ambiguous-reference");
    assert.isDefined(ambiguous);

    const refusal = refusalAt(...ambiguous.args);
    const { spans } = codeSpans(describeRefusal(refusal));
    const readings = ["firstPrefix", "firstVariable", "secondPrefix", "secondVariable"].map(
      (key) => refusal.detail[key],
    );

    assert.deepStrictEqual(readings, ["a.b", "SCORE", "a", "b.SCORE"]);

    for (const fact of readings) {
      assert.include(spans, fact);
    }
  });

  it("keeps a package path holding backticks inside one code span, whole", () => {
    for (const rule of [
      "package-path-outside",
      "package-file-unlisted",
      "package-file-missing",
    ] as const) {
      const { outside, spans } = codeSpans(
        describeRefusal(
          refusalAt(rule, "package.zip", { kind: "document" }, { path: escapingValue }),
        ),
      );

      assert.notInclude(outside, "![", rule);
      assert.notInclude(outside, "](", rule);
      assert.include(spans, escapingValue, rule);
    }
  });
});
