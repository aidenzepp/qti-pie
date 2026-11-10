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
import { isStubbed } from "#plate/model/interactions.ts";
import type { BodyElement, BodyNode, InlineChoiceInteraction, Item } from "#plate/model/item.ts";
import type { Test } from "#plate/model/test.ts";
import { InvalidValue } from "#plate/model/values.ts";
import type { Redacted } from "#plate/payload.ts";
import { redact } from "#plate/render.ts";
import { allowedEffectNames, readImports, sourceModules, valueNames } from "#plate/test/imports.ts";
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
import type { CpVersion } from "#plate/vocabulary.ts";

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
const verdictOf = (source: SourceDocument): Verdict => check(source, tables, Option.none());

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
 * printed variable as `printed:<identifier>@<path>`, a template block or inline as
 * `<kind>:<identifier>@<path>` with its content, and a notice as `notice:<feature>@<path>`.
 *
 * @param nodes The nodes.
 * @returns One entry per node.
 */
const outline = (nodes: readonly BodyNode[]): readonly unknown[] =>
  nodes.map((node) => {
    if (isStubbed(node)) {
      return node.kind;
    }

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
  it("align-54 extension lists E10: refuses an onclick on a body p as unknown-attribute, since the extension lists cover p (reading 90)", () => {
    const verdict = verdictOf(
      item([body([el("p", [attr("class", "lead"), attr("onclick", "alert(1)")], [text("Hi")])])]),
    );

    assert.deepStrictEqual(refusalsOf(verdict), [
      { location: { kind: "path", path: `${bodyPath}/p/@onclick` }, rule: "unknown-attribute" },
    ]);
    assert.deepStrictEqual(
      verdict.verdict === "refused" ? verdict.refusals.map((refusal) => refusal.detail) : [],
      [{ attribute: "onclick", element: "p", reading: "90" }],
    );
  });

  it("align-54 extension lists E10: removes and marks an attribute in another namespace on qti-custom-operator, whose wildcard the extension lists do not cover", () => {
    const foreign = "urn:example:other";
    const operatorPath = `${root}/qti-response-processing/qti-set-outcome-value/qti-custom-operator`;
    const accepted = acceptedOf(
      verdictOf(
        item([
          score(),
          body([el("p", [], [text("Hi")])]),
          el(
            "qti-response-processing",
            [],
            [
              el(
                "qti-set-outcome-value",
                [attr("identifier", "SCORE")],
                [
                  el(
                    "qti-custom-operator",
                    [attr("class", "org.example.Half"), attr("x", "1", foreign)],
                    [el("qti-base-value", [attr("base-type", "float")], [text("1")])],
                  ),
                ],
              ),
            ],
          ),
        ]),
      ),
      "accepted-with-unsupported",
    );

    // The case is about attribute marks only; the custom operator earns its own mark.
    assert.deepStrictEqual(
      accepted.unsupported.filter((mark) => mark.feature.startsWith("attribute:")),
      [{ feature: `attribute:{${foreign}}x`, path: operatorPath, shown: "mark" }],
    );
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

  it("align-54 extension lists E10: keeps aria-keyshortcuts where the table declares aria-keyshorts (reading 10), and refuses aria-keyshorts where it does not as unknown-attribute (reading 90)", () => {
    const image = el("img", [
      attr("alt", "A cat"),
      attr("aria-keyshortcuts", "Alt+I"),
      attr("src", "cat.png"),
    ]);
    const accepted = acceptedOf(verdictOf(item([body([el("p", [], [image])])])), "accepted");
    const refused = verdictOf(item([body([el("p", [attr("aria-keyshorts", "Alt+P")], [image])])]));

    assert.deepStrictEqual(accepted.unsupported, []);
    assert.deepStrictEqual(namesOf(bodyElement(accepted, `${bodyPath}/p/img`)), [
      "alt",
      "aria-keyshortcuts",
      "src",
    ]);
    assert.deepStrictEqual(refusalsOf(refused), [
      {
        location: { kind: "path", path: `${bodyPath}/p/@aria-keyshorts` },
        rule: "unknown-attribute",
      },
    ]);
    assert.deepStrictEqual(
      refused.verdict === "refused" ? refused.refusals.map((refusal) => refusal.detail) : [],
      [{ attribute: "aria-keyshorts", element: "p", reading: "90" }],
    );
  });

  it("align-54 extension lists E10: compares names exactly: an HREF is no attribute a declares, refused as unknown-attribute (reading 90), and an element A is refused", () => {
    const undeclared = verdictOf(
      item([
        body([
          el("p", [], [el("a", [attr("HREF", scriptUrl), attr("href", "#note")], [text("Go")])]),
        ]),
      ]),
    );

    assert.deepStrictEqual(refusalsOf(undeclared), [
      { location: { kind: "path", path: `${bodyPath}/p/a/@HREF` }, rule: "unknown-attribute" },
    ]);
    assert.deepStrictEqual(
      undeclared.verdict === "refused" ? undeclared.refusals.map((refusal) => refusal.detail) : [],
      [{ attribute: "HREF", element: "a", reading: "90" }],
    );

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

describe("check, the built-in variables' identifiers (pantry DeclarationNotReserved) and qti-equal's tolerance values (reading 121, \"every tolerance is one or two values, each number among them above 0\")", () => {
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

  it('[I-9a] refuses an item whose qti-equal tolerance holds a number not above 0, -1, as attribute-type (reading 121, "each number among them above 0")', () => {
    assert.deepStrictEqual(refusalsOf(verdictOf(tolerating("-1"))), [
      {
        location: {
          kind: "path",
          path: `${root}/qti-response-processing/qti-response-condition/qti-response-if/qti-equal/@tolerance`,
        },
        rule: "attribute-type",
      },
    ]);
  });

  it("[I-9a] accepts an item whose qti-equal tolerance is 0.5, 1 2, TOL or INF, or 1,5 or +INF, which name variables read at run time (reading 121)", () => {
    for (const tolerance of ["0.5", "1 2", "TOL", "INF", "1,5", "+INF"]) {
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
 * Construct a single float outcome declaration that writes a `normal-minimum`.
 *
 * @param identifier Its `identifier`.
 * @param minimum Its `normal-minimum`, as written.
 * @returns The declaration.
 */
const bounded = (identifier: string, minimum: string): SourceElement =>
  el("qti-outcome-declaration", [
    attr("base-type", "float"),
    attr("cardinality", "single"),
    attr("identifier", identifier),
    attr("normal-minimum", minimum),
  ]);

/**
 * Give the `normal-minimum` the built model holds of each outcome, in declaration order.
 *
 * @param outcomes The model's outcome declarations.
 * @returns Each outcome's identifier and its minimum, none when it has none.
 */
const minimaOf = (
  outcomes: Item["outcomes"],
): readonly (readonly [string, Option.Option<number>])[] =>
  Array.from(outcomes.values(), (declaration) => [
    declaration.identifier,
    declaration.normalMinimum,
  ]);

describe("check, the default normal-minimum of a QTI 3.0.1 outcome (reading 149)", () => {
  /**
   * The versions a document is checked under: a 3.0.1 package's, a 3.0.0 package's, and none, as
   * a document opened alone states.
   */
  const versions: readonly Option.Option<CpVersion>[] = [
    Option.some("3.0.1"),
    Option.some("3.0.0"),
    Option.none(),
  ];

  /**
   * What a 3.0.1 package's document holds of each outcome: 0.0 where it writes none, and what it
   * writes where it writes one.
   *
   * @param unwritten The outcomes that write no `normal-minimum`.
   * @param written The outcome that writes one, and its value.
   * @returns The minima, and the minima under a 3.0.0 package and a lone document.
   */
  const expected = (
    unwritten: readonly string[],
    written: readonly [string, number],
  ): readonly (readonly (readonly [string, Option.Option<number>])[])[] =>
    versions.map((version) => [
      ...unwritten.map(
        (identifier) =>
          [
            identifier,
            Option.exists(version, (stated) => stated === "3.0.1") ? Option.some(0) : Option.none(),
          ] as const,
      ),
      [written[0], Option.some(written[1])] as const,
    ]);

  it("align-54 default minimum B3a: gives every outcome of a 3.0.1 package's item that writes no normal-minimum 0.0, an identifier outcome among them, keeps a written one, and gives none under 3.0.0 or alone", () => {
    const source = item([
      score(),
      outcome("FEEDBACK", "identifier"),
      bounded("LOW", "-2"),
      body([el("p", [], [text("Hello")])]),
    ]);
    const minima = versions.map((version) =>
      minimaOf(acceptedOf(check(source, tables, version), "accepted").item.outcomes),
    );

    assert.deepStrictEqual(minima, expected(["SCORE", "FEEDBACK"], ["LOW", -2]));
  });

  it("align-54 default minimum B3a: gives every outcome of a 3.0.1 package's test that writes no normal-minimum 0.0, an identifier outcome among them, keeps a written one, and gives none under 3.0.0 or alone", () => {
    const source = assessmentTest(
      [itemRef("q1")],
      [outcome("TOTAL", "float"), outcome("BAND", "identifier"), bounded("FLOOR", "-1")],
    );
    const minima = versions.map((version) =>
      minimaOf(acceptedTestOf(check(source, tables, version), "accepted").test.outcomes),
    );

    assert.deepStrictEqual(minima, expected(["TOTAL", "BAND"], ["FLOOR", -1]));
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

  it("align-54 empty section D1: accepts a hand-built section document whose root section holds nothing, marked as a section root (reading 26)", () => {
    const verdict = verdictOf(doc("section.xml", assessmentSection("S", [])));

    assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
    assert.isTrue(verdict.kind === "section");
    if (verdict.verdict === "accepted-with-unsupported" && verdict.kind === "section") {
      assert.strictEqual(verdict.accepted.identifier, "S");
      assert.deepStrictEqual(featuresOf(verdict.accepted.unsupported), [
        "root:qti-assessment-section@qti-assessment-section",
      ]);
    }
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

  it("align-54 includes E23: leaves a test holding an XInclude include unchecked, with no accepted test", () => {
    const include = el("include", [attr("href", "shared/items.xml")], [], xincludeNamespace);
    const verdict = verdictOf(assessmentTest([itemRef("q1"), include]));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.strictEqual(verdict.kind, "test");
    assert.isFalse("accepted" in verdict);
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        {
          path: `qti-assessment-test/qti-test-part/qti-assessment-section/{${xincludeNamespace}}include`,
          reason: "xinclude",
        },
      ]);
    }
  });

  it("align-54 includes E23: leaves a section document holding an XInclude include unchecked, with no accepted section", () => {
    const include = el("include", [attr("href", "shared/items.xml")], [], xincludeNamespace);
    const verdict = verdictOf(doc("section.xml", assessmentSection("S", [itemRef("q1"), include])));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.strictEqual(verdict.kind, "section");
    assert.isFalse("accepted" in verdict);
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        { path: `qti-assessment-section/{${xincludeNamespace}}include`, reason: "xinclude" },
      ]);
    }
  });

  /**
   * Includes whose form XInclude or the readings would refuse, each of which plate leaves only
   * unchecked (P4): none is refused for its form.
   */
  const includeForms = [
    {
      attributes: [attr("href", "shared/items.xml"), attr("xpointer", "element(/1)")],
      form: "an xpointer",
    },
    { attributes: [attr("href", "shared/items.xml"), attr("parse", "text")], form: 'parse="text"' },
    { attributes: [attr("href", "https://example.com/items.xml")], form: "an external href" },
  ];
  for (const { attributes, form } of includeForms) {
    it(`align-54 includes E23: leaves a test's include with ${form} only unchecked, never refused (P4)`, () => {
      const include = el("include", attributes, [], xincludeNamespace);
      const verdict = verdictOf(assessmentTest([itemRef("q1"), include]));

      assert.strictEqual(verdict.verdict, "unchecked");
      if (verdict.verdict === "unchecked") {
        assert.deepStrictEqual(verdict.reasons, [
          {
            path: `qti-assessment-test/qti-test-part/qti-assessment-section/{${xincludeNamespace}}include`,
            reason: "xinclude",
          },
        ]);
      }
    });
  }

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
 * Construct a paragraph whose `span` carries the given `data-ssml`.
 *
 * @param value The `span`'s `data-ssml`, as the XML reader gives it.
 * @returns The `p`.
 */
const spokenParagraph = (value: string): SourceElement =>
  el(
    "p",
    [],
    [text("Our word is "), el("span", [attr("data-ssml", value)], [text("mRNA")]), text(".")],
  );

/**
 * Construct a candidate rubric block holding {@link spokenParagraph}'s paragraph.
 *
 * @param value The `span`'s `data-ssml`.
 * @returns The `qti-rubric-block`.
 */
const spokenRubric = (value: string): SourceElement =>
  el(
    "qti-rubric-block",
    [attr("view", "candidate")],
    [el("qti-content-body", [], [spokenParagraph(value)])],
  );

/**
 * The three documents `checkRules` does not judge whose `span` carries a `data-ssml`: a stimulus,
 * a test whose section's rubric block holds it, and a section document whose rubric block does,
 * each with its kind and the `span`'s path.
 *
 * @param value The `span`'s `data-ssml`.
 * @returns The documents.
 */
const spokenDocuments = (value: string) =>
  [
    {
      kind: "stimulus",
      path: "qti-assessment-stimulus/qti-stimulus-body/p/span",
      source: stimulus([spokenParagraph(value)]),
    },
    {
      kind: "test",
      path: "qti-assessment-test/qti-test-part/qti-assessment-section/qti-rubric-block/qti-content-body/p/span",
      source: assessmentTest([spokenRubric(value), itemRef("q1")]),
    },
    {
      kind: "section",
      path: "qti-assessment-section/qti-rubric-block/qti-content-body/p/span",
      source: doc("section.xml", assessmentSection("S", [spokenRubric(value), itemRef("q1")])),
    },
  ] as const;

/**
 * Reduce a verdict that must refuse to its refusals' rules, paths and details.
 *
 * @param verdict The verdict.
 * @returns One entry per refusal, in order.
 */
const refusedFacts = (verdict: Verdict) =>
  verdict.verdict === "refused"
    ? verdict.refusals.map((refusal) => ({
        detail: refusal.detail,
        path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
        rule: refusal.rule,
      }))
    : assert.fail(`The verdict is ${verdict.verdict}, not refused.`);

describe("check, align-54 Data-SSML everywhere: a data-ssml value is Data-SSML JSON in every document (the operator's P3)", () => {
  it("align-54 Data-SSML everywhere P3: refuses data-ssml=\"hello\" in a stimulus, a test's rubric block and a section's rubric block, as attribute-type data-ssml with problem json at the attribute", () => {
    for (const { kind, path, source } of spokenDocuments("hello")) {
      const verdict = verdictOf(source);

      assert.strictEqual(verdict.kind, kind);
      assert.deepStrictEqual(refusedFacts(verdict), [
        {
          detail: { attribute: "data-ssml", check: "data-ssml", element: "span", problem: "json" },
          path: `${path}/@data-ssml`,
          rule: "attribute-type",
        },
      ]);
    }
  });

  it("align-54 Data-SSML everywhere P3: names an unknown property, a value of the wrong type and a value outside its list as the problem in each document", () => {
    const values = [
      ["name", '{"speak":{"alias":"messenger RNA"}}'],
      ["type", '{"sub":{"alias":3}}'],
      ["value", '{"say-as":{"interpret-as":"spell-out"}}'],
    ] as const;

    for (const [problem, value] of values) {
      assert.deepStrictEqual(
        spokenDocuments(value).map(({ source }) =>
          refusedFacts(verdictOf(source)).map((refusal) => refusal.detail["problem"]),
        ),
        [[problem], [problem], [problem]],
      );
    }
  });

  it("align-54 Data-SSML everywhere P3: accepts a data-ssml that is Data-SSML JSON in each document, with its notice", () => {
    assert.deepStrictEqual(
      spokenDocuments('{"sub":{"alias":"messenger RNA"}}').map(({ source }) => {
        const verdict = verdictOf(source);

        return [
          verdict.verdict,
          verdict.kind,
          verdict.verdict === "accepted-with-unsupported"
            ? featuresOf(verdict.accepted.unsupported)
            : [],
        ];
      }),
      [
        [
          "accepted-with-unsupported",
          "stimulus",
          ["root:qti-assessment-stimulus@qti-assessment-stimulus"],
        ],
        [
          "accepted-with-unsupported",
          "test",
          [
            "qti-rubric-block@qti-assessment-test/qti-test-part/qti-assessment-section/qti-rubric-block",
          ],
        ],
        [
          "accepted-with-unsupported",
          "section",
          ["root:qti-assessment-section@qti-assessment-section"],
        ],
      ],
    );
  });

  it("align-54 Data-SSML everywhere P3: does not judge a stimulus's data-ssml an attribute wildcard admits on a kind that does not declare it (rule 5b8ee08b)", () => {
    const verdict = verdictOf(
      stimulus([el("ul", [], [el("li", [attr("data-ssml", "hello")], [text("mRNA")])])]),
    );

    assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
    assert.strictEqual(verdict.kind, "stimulus");
  });

  it("align-54 Data-SSML everywhere P3: leaves a stimulus holding an unexpanded entity reference unchecked, judging none of its data-ssml, as an item's rules do", () => {
    const verdict = verdictOf(stimulus([spokenParagraph("hello"), el("p", [], [entity("more")])]));

    assert.strictEqual(verdict.verdict, "unchecked");
    assert.strictEqual(verdict.kind, "stimulus");
  });
});

/**
 * Construct a Portable Custom Interaction bound to `RESPONSE` that names its module by a `module`
 * attribute or by neither form.
 *
 * @param module Whether it carries a `module`.
 * @returns The interaction.
 */
const portableInteraction = (module: boolean): SourceElement =>
  el(
    "qti-portable-custom-interaction",
    [
      attr("custom-interaction-type-identifier", "urn:example:pci"),
      ...(module ? [attr("module", "pci")] : []),
      attr("response-identifier", "RESPONSE"),
    ],
    [el("qti-interaction-markup", [], [el("div")])],
  );

/**
 * Construct a Choice bound to `RESPONSE` holding one simple choice.
 *
 * @param identifier The choice's `identifier`.
 * @returns The interaction.
 */
const oneChoice = (identifier: string): SourceElement =>
  el(
    "qti-choice-interaction",
    [attr("response-identifier", "RESPONSE")],
    [el("qti-simple-choice", [attr("identifier", identifier)], [text("Yes")])],
  );

/**
 * The content a stimulus and an item share in the stimulus prose rule cases, each with the
 * declaration the item binds it to, if any, and the one refusal it earns: a `td` whose `headers`
 * names no header of its table (reading 126, E29), a `q` a quotation mark stands against (reading
 * 127, E30), a Choice whose two choices are both `A` (reading 104, E19), and a PCI that names its
 * module by neither form (R10-a, F6). Each `path` is under the body.
 */
const stimulusProse = [
  {
    content: el("table", [], [el("tr", [], [el("td", [attr("headers", "zz")], [text("x")])])]),
    declarations: [],
    name: "E29",
    refusal: {
      detail: {
        attribute: "headers",
        check: "headers",
        element: "td",
        reading: "126",
        token: "zz",
        value: "zz",
      },
      path: "table/tr/td/@headers",
      rule: "attribute-type",
    },
  },
  {
    content: el("p", [], [text("“"), el("q", [], [text("hi")]), text("”")]),
    declarations: [],
    name: "E30",
    refusal: {
      detail: { check: "quotation", element: "q", mark: "“", reading: "127", side: "before" },
      path: "p/q",
      rule: "text-not-allowed",
    },
  },
  {
    content: el(
      "div",
      [],
      [
        el(
          "qti-choice-interaction",
          [attr("response-identifier", "RESPONSE")],
          [
            el("qti-simple-choice", [attr("identifier", "A")], [text("Yes")]),
            el("qti-simple-choice", [attr("identifier", "A")], [text("No")]),
          ],
        ),
      ],
    ),
    declarations: [response("identifier", "single")],
    name: "E19",
    refusal: {
      detail: { class: "qti-simple-choice", identifier: "A", reading: "104" },
      path: "div/qti-choice-interaction/qti-simple-choice[2]/@identifier",
      rule: "duplicate-identifier",
    },
  },
  {
    content: el("div", [], [portableInteraction(false)]),
    declarations: [response("string", "single")],
    name: "F6",
    refusal: {
      detail: {
        attribute: "module",
        check: "pci-module-source",
        element: "qti-portable-custom-interaction",
        source: "info.txt:37583",
      },
      path: "div/qti-portable-custom-interaction",
      rule: "missing-attribute",
    },
  },
] as const;

describe("check, align-54 r11 stimulus prose rules: a stimulus's choices, table headers, quotations and PCIs are judged as an item's are (readings 104, 126 and 127; R10-a)", () => {
  it.each(stimulusProse)(
    "align-54 r11 stimulus prose rules $name: refuses the stimulus holding it, with the refusal the item holding it earns",
    ({ content, refusal }) => {
      const verdict = verdictOf(stimulus([content]));

      assert.strictEqual(verdict.kind, "stimulus");
      assert.deepStrictEqual(refusedFacts(verdict), [
        { ...refusal, path: `qti-assessment-stimulus/qti-stimulus-body/${refusal.path}` },
      ]);
    },
  );

  it.each(stimulusProse)(
    "align-54 r11 stimulus prose rules $name: the item holding it keeps exactly its refusal (control)",
    ({ content, declarations, refusal }) => {
      const verdict = verdictOf(item([...declarations, body([content])]));

      assert.strictEqual(verdict.kind, "item");
      assert.deepStrictEqual(refusedFacts(verdict), [
        { ...refusal, path: `${bodyPath}/${refusal.path}` },
      ]);
    },
  );

  it("align-54 r11 stimulus prose rules E19: refuses each of a stimulus's faults in document order, the choices pooled across its interactions", () => {
    const verdict = verdictOf(
      stimulus([
        el("div", [], [oneChoice("A")]),
        el("p", [], [el("q", [], [text("“hi”")])]),
        el("div", [], [oneChoice("A")]),
      ]),
    );

    assert.deepStrictEqual(refusedFacts(verdict), [
      {
        detail: { check: "quotation", element: "q", mark: "“", reading: "127", side: "start" },
        path: "qti-assessment-stimulus/qti-stimulus-body/p/q",
        rule: "text-not-allowed",
      },
      {
        detail: { class: "qti-simple-choice", identifier: "A", reading: "104" },
        path: "qti-assessment-stimulus/qti-stimulus-body/div[2]/qti-choice-interaction/qti-simple-choice/@identifier",
        rule: "duplicate-identifier",
      },
    ]);
  });

  it("align-54 r11 stimulus prose rules E29: accepts a stimulus whose cells name their table's headers, whose q stands clear of marks, whose choices differ and whose PCI names its module, marked as a stimulus root (control)", () => {
    const verdict = verdictOf(
      stimulus([
        el(
          "table",
          [],
          [
            el("tr", [], [el("th", [attr("id", "h")], [text("Head")])]),
            el("tr", [], [el("td", [attr("headers", "h")], [text("x")])]),
          ],
        ),
        el("p", [], [text("She said "), el("q", [], [text("hi")]), text(".")]),
        el("div", [], [choiceInteraction()]),
        el("div", [], [portableInteraction(true)]),
      ]),
    );

    assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
    assert.strictEqual(verdict.kind, "stimulus");
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

/**
 * A hand-built refusal for each `check`, rule and rewording align-54 adds (its refusal contract),
 * with the item that adds it and the fragments its sentence must hold: the facts its detail
 * carries, what settles it and the repair. Each fragment names a fact the rule's default sentence
 * never names, so each case fails until its branch words it.
 */
const align54Wordings: readonly {
  readonly detail: Readonly<Record<string, string>>;
  readonly item: string;
  readonly name: string;
  readonly rule: RefusalRule;
  readonly says: readonly string[];
}[] = [
  {
    detail: {
      baseType: "integer",
      cardinality: "multiple",
      check: "string-binding",
      interaction: "qti-text-entry-interaction",
      reading: "14",
      response: "NOTES",
    },
    item: "D3a",
    name: "a string-identifier binds a string response that is not a record",
    rule: "binding",
    says: [
      "`qti-text-entry-interaction`'s attribute `string-identifier` names `NOTES`, a multiple response of base type `integer`, and a `string-identifier` binds a `string` response that is not a `record` (reading 14).",
      "To make it valid: name such a response in `string-identifier`, or change the declaration of `NOTES`.",
    ],
  },
  {
    detail: {
      attribute: "response-identifier",
      check: "bound-once",
      interaction: "qti-choice-interaction",
      reading: "92",
      response: "RESPONSE",
    },
    item: "E11a",
    name: "one response, one binding",
    rule: "binding",
    says: [
      "`qti-choice-interaction`'s attribute `response-identifier` binds `RESPONSE`, which an earlier binding already binds, and a response is bound at most once, to one interaction (reading 92).",
      "To make it valid: declare a response of its own and name it in `response-identifier`, so that `RESPONSE` is bound once.",
    ],
  },
  {
    detail: {
      attribute: "max-choices",
      check: "count-cardinality",
      count: "0",
      interaction: "qti-choice-interaction",
      reading: "92",
      response: "RESPONSE",
    },
    item: "E11a",
    name: "a count of 0, no limit, needs a multiple response",
    rule: "binding",
    says: [
      "`qti-choice-interaction`'s `max-choices` is `0`, which sets no limit, so the interaction must be bound to a `multiple` response, and `RESPONSE` is not one (reading 92).",
      'To make it valid: declare `RESPONSE` with `cardinality="multiple"`, or set `max-choices` to `1`.',
    ],
  },
  {
    detail: {
      attribute: "max-associations",
      check: "count-cardinality",
      count: "2",
      interaction: "qti-match-interaction",
      reading: "92",
      response: "RESPONSE",
    },
    item: "E11a",
    name: "a count above 1 needs a multiple response",
    rule: "binding",
    says: [
      "`qti-match-interaction`'s `max-associations` is `2`, so the interaction must be bound to a `multiple` response, and `RESPONSE` is not one (reading 92).",
    ],
  },
  {
    detail: {
      cardinality: "single",
      check: "gap-match-single",
      gaps: "3",
      interaction: "qti-gap-match-interaction",
      response: "RESPONSE",
    },
    item: "P7",
    name: "several gaps need a multiple response",
    rule: "binding",
    says: [
      "`qti-gap-match-interaction` holds 3 gaps and is bound to `RESPONSE`, a single response, and an interaction of several gaps needs a `multiple` response.",
      'To make it valid: declare `RESPONSE` with `cardinality="multiple"`.',
    ],
  },
  {
    detail: {
      check: "context-variable",
      element: "qti-context-variable",
      identifier: "LOCALE",
      reading: "92",
    },
    item: "E11a",
    name: "a PCI's context variable names a context variable",
    rule: "undeclared-variable",
    says: [
      "`qti-context-variable` names `LOCALE`, which is neither a context variable the item declares nor the built-in `QTI_CONTEXT` (reading 92).",
      "To make it valid: name a context variable the item declares, or the built-in `QTI_CONTEXT`.",
    ],
  },
  {
    detail: {
      check: "count-pair",
      element: "qti-choice-interaction",
      least: "min-choices",
      leastValue: "3",
      most: "max-choices",
      mostValue: "2",
      reading: "76",
    },
    item: "E2",
    name: "a least count is at most its most",
    rule: "count-range",
    says: [
      "`qti-choice-interaction`'s `min-choices` is `3`, above its `max-choices`, `2`, and a least count is at most its most (reading 76).",
      "To make it valid: lower `min-choices` to at most `2`, or raise `max-choices` to at least `3`.",
    ],
  },
  {
    detail: {
      attribute: "max-choices",
      check: "choice-count",
      choices: "4",
      reading: "18",
      value: "5",
    },
    item: "D4a",
    name: "a count is at most the number of choices",
    rule: "count-range",
    says: [
      "`max-choices` is `5`, more than the interaction's 4 choices, and it may be at most the number of choices (reading 18).",
      "To make it valid: write a `max-choices` of at most 4, or give the interaction more choices.",
    ],
  },
  {
    detail: { check: "selection", parts: "3", reading: "79", select: "5" },
    item: "E4",
    name: "a selection without replacement selects at most its section's parts",
    rule: "count-range",
    says: [
      "`qti-selection` selects `5` without replacement from its section's 3 parts, and a selection without replacement selects at most its section's parts (reading 79).",
      'To make it valid: set `select` to at most 3, or set `with-replacement="true"`.',
    ],
  },
  {
    detail: {
      attribute: "identifier",
      check: "numbered",
      element: "qti-variable",
      itemRef: "Q1",
      reading: "88",
      reference: "Q1.2.SCORE",
    },
    item: "D6",
    name: "a numbered reading only under a selection with replacement",
    rule: "undeclared-variable",
    says: [
      "`qti-variable`'s attribute `identifier` names `Q1.2.SCORE`, a numbered instance of the item ref `Q1`, and an instance number counts only where a selection with replacement can repeat `Q1`, which none does (reading 88).",
      'To make it valid: name the variable without its instance number, or give a section that holds `Q1` a selection with `with-replacement="true"`.',
    ],
  },
  {
    detail: {
      attribute: "identifier",
      check: "setter",
      element: "qti-set-outcome-value",
      reading: "112",
      reference: "a.SCORE",
    },
    item: "D6",
    name: "a setter names the test's own declaration",
    rule: "undeclared-variable",
    says: [
      "`qti-set-outcome-value`'s attribute `identifier` names `a.SCORE`, which the test does not declare, and a setter sets a variable its own document declares, never an item's (reading 112).",
      "To make it valid: declare `a.SCORE` in the test, or set a variable the test declares.",
    ],
  },
  {
    detail: {
      baseType: "float",
      cardinality: "single",
      check: "feedback-outcome",
      element: "qti-feedback-block",
      identifier: "SCORE",
      reading: "77",
    },
    item: "E3a",
    name: "a feedback element names an identifier outcome, single or multiple",
    rule: "expression-type",
    says: [
      "`qti-feedback-block`'s attribute `outcome-identifier` names `SCORE`, a single outcome of base type `float`, and a feedback element names an outcome of base type `identifier`, single or multiple (reading 77).",
      "To make it valid: name an outcome of base type `identifier`, single or multiple, in `outcome-identifier`, or change the declaration of `SCORE`.",
    ],
  },
  {
    detail: {
      check: "default-hotspot",
      context: "qti-hotspot-interaction",
      element: "qti-hotspot-choice",
      reading: "80",
    },
    item: "E5",
    name: "a default hotspot comes last",
    rule: "misplaced-element",
    says: [
      '`qti-hotspot-choice` is a default hotspot, with `shape="default"`, and is not the last hotspot of `qti-hotspot-interaction`, where a default hotspot comes last (reading 80).',
      "To make it valid: move `qti-hotspot-choice` after the other hotspots of `qti-hotspot-interaction`.",
    ],
  },
  {
    detail: {
      check: "default-hotspot",
      context: "qti-graphic-gap-match-interaction",
      element: "qti-associable-hotspot",
      reading: "80",
    },
    item: "E5",
    name: "a graphic gap match interaction has no default hotspot",
    rule: "misplaced-element",
    says: [
      '`qti-associable-hotspot` is a default hotspot, with `shape="default"`, and `qti-graphic-gap-match-interaction` may hold none (reading 80).',
      "To make it valid: give `qti-associable-hotspot` another shape, or remove it.",
    ],
  },
  {
    detail: {
      check: "order",
      context: "qti-companion-materials-info",
      element: "qti-physical-material",
      reading: "96",
    },
    item: "E13",
    name: "order after a repeated wildcard",
    rule: "misplaced-element",
    says: [
      "`qti-physical-material` comes after a child of `qti-companion-materials-info` that its repeated wildcard holds, and no element of an earlier part of the sequence may follow such a child (reading 96).",
      "To make it valid: move `qti-physical-material` before the children the wildcard holds.",
    ],
  },
  {
    detail: {
      check: "lookup-cardinality",
      element: "qti-match-table",
      identifier: "GRADE",
      reading: "100",
    },
    item: "E15",
    name: "a lookup sets a single outcome",
    rule: "misplaced-element",
    says: [
      "`qti-match-table` belongs to the outcome `GRADE`, which is not single, and a lookup table sets a single outcome (reading 100).",
      'To make it valid: declare `GRADE` with `cardinality="single"`, or remove `qti-match-table`.',
    ],
  },
  {
    detail: { check: "quotation", mark: '"', reading: "127", side: "before" },
    item: "E30",
    name: "no quotation mark before a q",
    rule: "text-not-allowed",
    says: [
      'The quotation mark `"` stands immediately before this `q`, and a browser adds the quotation marks of a `q` itself (reading 127).',
      'To make it valid: remove the quotation mark `"`.',
    ],
  },
  {
    detail: { check: "quotation", mark: "”", reading: "127", side: "end" },
    item: "E30",
    name: "no quotation mark at the end of a q",
    rule: "text-not-allowed",
    says: ["The quotation mark `”` stands at the end of this `q`"],
  },
  {
    detail: {
      chain: "tests/test.xml sections/a.xml sections/b.xml sections/a.xml",
      href: "../sections/a.xml",
      identifier: "toA",
      reading: "85",
    },
    item: "E7",
    name: "the new rule inclusion-cycle",
    rule: "inclusion-cycle",
    says: [
      "The section ref `toA` points at `../sections/a.xml`, which leads back to a document already on its chain, `tests/test.xml sections/a.xml sections/b.xml sections/a.xml`, and an inclusion never reaches itself (reading 85).",
      "Rule `inclusion-cycle`.",
      "To make it valid: point the section ref at a document that does not lead back to one on its chain, or remove it.",
    ],
  },
  {
    detail: { reading: "87", reason: "backward", target: "Q1" },
    item: "E8a",
    name: "the new rule branch-target, a backward jump",
    rule: "branch-target",
    says: [
      "`qti-branch-rule`'s target `Q1` comes before the end of the element that holds the rule, and a branch rule jumps only forward (reading 87).",
      "Rule `branch-target`.",
      "To make it valid: name a later item ref, section or test part the rule may reach, or one of `EXIT_SECTION`, `EXIT_TESTPART` and `EXIT_TEST`.",
    ],
  },
  {
    detail: { reading: "87", reason: "self", target: "Q2" },
    item: "E8a",
    name: "the new rule branch-target, a jump to itself",
    rule: "branch-target",
    says: [
      "`qti-branch-rule`'s target `Q2` names the element that holds the rule, and a branch rule jumps only forward, never to its own element (reading 87).",
    ],
  },
  {
    detail: { reading: "87", reason: "outside-part", target: "S9" },
    item: "E8a",
    name: "the new rule branch-target, a jump outside its test part",
    rule: "branch-target",
    says: [
      "`qti-branch-rule`'s target `S9` lies outside what the rule may name: a test part's rule names a later test part, and any other rule an item ref, section or section ref of its own test part (reading 87).",
    ],
  },
  {
    detail: { reading: "87", reason: "unknown", target: "NOWHERE" },
    item: "E8b",
    name: "the new rule branch-target, an unknown target",
    rule: "branch-target",
    says: [
      "`qti-branch-rule`'s target `NOWHERE` names no test part, section, section ref or item ref the rule can reach, and no exit (reading 87).",
    ],
  },
  {
    detail: { reading: "87", reason: "repeatable", target: "Q3" },
    item: "E8b",
    name: "the new rule branch-target, a repeatable item ref",
    rule: "branch-target",
    says: [
      "`qti-branch-rule`'s target `Q3` names an item ref that a selection with replacement can repeat, which no branch rule may target (reading 87).",
      "To make it valid: name an item ref no selection with replacement repeats, or one of `EXIT_SECTION`, `EXIT_TESTPART` and `EXIT_TEST`.",
    ],
  },
  {
    detail: { reading: "87", reason: "ambiguous", target: "Q4" },
    item: "E8b",
    name: "the new rule branch-target, a target two placements supply",
    rule: "branch-target",
    says: [
      "`qti-branch-rule`'s target `Q4` names an element that two placements of one section document both supply, so it names two (reading 87).",
      "To make it valid: name an element placed once, or place that section document once.",
    ],
  },
  {
    detail: { document: "items/q1.xml", language: "fr", listed: "en de", reading: "134" },
    item: "E34",
    name: "the new rule document-lang",
    rule: "document-lang",
    says: [
      "The document `items/q1.xml` uses the language `fr`, and its resource's LOM general category lists only `en` and `de`; each language an item or test uses is listed there (reading 134).",
      "Rule `document-lang`.",
      "To make it valid: add a `language` of `fr` to the resource's LOM general category, or correct the document's language.",
    ],
  },
  {
    detail: { document: "items/q1.xml", language: "fr", listed: "", reading: "134" },
    item: "E34",
    name: "the new rule document-lang, with no language listed",
    rule: "document-lang",
    says: ["its resource's LOM general category lists no language;"],
  },
  {
    detail: { reading: "122", value: "self assessment" },
    item: "E25",
    name: "the new rule lom-learning-resource-type",
    rule: "lom-learning-resource-type",
    says: [
      "The LOM `learningResourceType` is `self assessment`, a LOM value that QTI forbids, since a QTI object may be reused in any kind of assessment (reading 122).",
      "Rule `lom-learning-resource-type`.",
      "To make it valid: use `exercise` or `questionnaire`, or a term of another vocabulary.",
    ],
  },
  {
    detail: {
      check: "choice-variable",
      class: "qti-simple-choice",
      identifier: "SCORE",
      reading: "104",
    },
    item: "E19",
    name: "a choice's identifier names no item variable",
    rule: "duplicate-identifier",
    says: [
      "`qti-simple-choice`'s identifier `SCORE` is also the name of an item variable or a built-in, and a choice's identifier names no item variable (reading 104).",
      "To make it valid: give the `qti-simple-choice` an identifier that no variable, built-in or other choice of the item uses.",
    ],
  },
  {
    detail: { baseType: "integer", check: "map-key", key: "01", reading: "98" },
    item: "B5b",
    name: "a mapping's keys are distinct",
    rule: "duplicate-identifier",
    says: [
      "The mapping's key `01` repeats an earlier key, compared as a value of base type `integer`, and a mapping's keys are distinct (reading 98).",
      "To make it valid: remove the repeated `qti-map-entry`, or give it a key no other entry has.",
    ],
  },
  {
    detail: { check: "field", field: "x", reading: "158" },
    item: "B7",
    name: "a record writes each field once",
    rule: "duplicate-identifier",
    says: [
      "The record value writes the field `x` more than once, and a record holds each field once (reading 158).",
      "To make it valid: write the field `x` once.",
    ],
  },
  {
    detail: {
      attribute: "for",
      check: "idref-target",
      element: "label",
      reading: "156",
      value: "name",
    },
    item: "E16",
    name: "an IDREF names an ID of the document",
    rule: "attribute-type",
    says: [
      "`label`'s attribute `for` is `name`, the `id` of no element of the document (reading 156).",
      "To make it valid: name in `for` the `id` of an element of the document.",
    ],
  },
  {
    detail: {
      attribute: "headers",
      check: "headers",
      element: "td",
      reading: "126",
      token: "h3",
      value: "h1 h3",
    },
    item: "E29",
    name: "headers names header cells of the same table, each once",
    rule: "attribute-type",
    says: [
      "`td`'s attribute `headers` is `h1 h3`, and its token `h3` is not the `id` of a `th` of the cell's own table, or repeats an earlier token (reading 126).",
      "To make it valid: make each token of `headers` the `id` of a `th` of the same table, each written once.",
    ],
  },
  {
    detail: {
      attribute: "mastery-value",
      check: "mastery-range",
      element: "qti-outcome-declaration",
      least: "0.0",
      reading: "149",
      value: "-1",
    },
    item: "E42b",
    name: "a mastery value at least the outcome's minimum",
    rule: "attribute-type",
    says: [
      "`qti-outcome-declaration`'s attribute `mastery-value` is `-1`, below the outcome's minimum, `0.0`, and a mastery value lies from the outcome's minimum to its maximum (reading 149).",
      "To make it valid: write a `mastery-value` of at least `0.0`, or lower the outcome's `normal-minimum`.",
    ],
  },
  {
    detail: {
      attribute: "mastery-value",
      check: "mastery-range",
      element: "qti-outcome-declaration",
      greatest: "10",
      reading: "149",
      value: "12",
    },
    item: "E42a",
    name: "a mastery value at most the outcome's maximum",
    rule: "attribute-type",
    says: [
      "`qti-outcome-declaration`'s attribute `mastery-value` is `12`, above the outcome's maximum, `10`, and a mastery value lies from the outcome's minimum to its maximum (reading 149).",
      "To make it valid: write a `mastery-value` of at most `10`, or raise the outcome's `normal-maximum`.",
    ],
  },
  {
    detail: { attribute: "data-ssml", check: "data-ssml", element: "span", problem: "json" },
    item: "P3",
    name: "a data-ssml value that is not JSON",
    rule: "attribute-type",
    says: [
      "`span`'s attribute `data-ssml` is not JSON, and a `data-ssml` value is Data-SSML JSON.",
      "To make it valid: write `data-ssml` as Data-SSML JSON, or remove it.",
    ],
  },
  {
    detail: { attribute: "data-ssml", check: "data-ssml", element: "span", problem: "name" },
    item: "P3",
    name: "a data-ssml value naming an unknown property",
    rule: "attribute-type",
    says: ["`span`'s attribute `data-ssml` names a property Data-SSML does not define,"],
  },
  {
    detail: { attribute: "data-ssml", check: "data-ssml", element: "span", problem: "type" },
    item: "P3",
    name: "a data-ssml value of an unknown type",
    rule: "attribute-type",
    says: [
      "`span`'s attribute `data-ssml` gives a property a value of a type Data-SSML does not allow it,",
    ],
  },
  {
    detail: { attribute: "data-ssml", check: "data-ssml", element: "span", problem: "value" },
    item: "P3",
    name: "a data-ssml value outside its property's values",
    rule: "attribute-type",
    says: ["`span`'s attribute `data-ssml` gives a property a value Data-SSML does not allow,"],
  },
  {
    detail: {
      attribute: "cardinality",
      baseType: "float",
      check: "reserved-outcome-type",
      element: "qti-outcome-declaration",
      identifier: "SCORE",
      reading: "153",
      value: "record",
    },
    item: "B1b",
    name: "a reserved outcome declared record",
    rule: "attribute-type",
    says: [
      "`qti-outcome-declaration`'s attribute `cardinality` is `record`, but an outcome named `SCORE` is a single value of the base type `float`, and a record has no base type (reading 153).",
      'To make it valid: declare `SCORE` with `cardinality="single"` and the base type `float`, or give `qti-outcome-declaration` another identifier.',
    ],
  },
  {
    detail: {
      attribute: "tool-name tool-version",
      check: "label-tool",
      element: "qti-assessment-item",
      labelled: "qti-assessment-item/qti-item-body/qti-text-entry-interaction",
      reading: "128",
    },
    item: "E31a",
    name: "a label names its tool",
    rule: "missing-attribute",
    says: [
      "`qti-assessment-item` must carry `tool-name` and `tool-version`, because `qti-assessment-item/qti-item-body/qti-text-entry-interaction` carries a `label`, and an item that uses labels names the tool that set them (reading 128).",
      "To make it valid: add `tool-name` and `tool-version` to `qti-assessment-item`, or remove the `label`.",
    ],
  },
  {
    detail: { check: "entry-key", path: "C:/items/q1.xml", reading: "138" },
    item: "E36",
    name: "an entry key with a backslash or a drive letter",
    rule: "package-path-outside",
    says: [
      "The package's entry `C:/items/q1.xml` holds a backslash or begins with a drive letter, so it names no path inside the package (reading 138).",
      "To make it valid: rename the entry with forward slashes and no drive letter.",
    ],
  },
  {
    detail: { check: "document-entry", path: "https://example.org/q1.xml", reading: "102" },
    item: "E17",
    name: "a document resource's href outside the package",
    rule: "package-path-outside",
    says: [
      "The resource's `href` is `https://example.org/q1.xml`, which leads outside the package, and a document resource's `href` names a document the package holds (reading 102).",
      "To make it valid: point the `href` at the document's path inside the package, relative to its root.",
    ],
  },
  {
    detail: {
      attribute: "src",
      check: "reference",
      document: "items/q1.xml",
      path: "images/a.png",
      reading: "103",
    },
    item: "E18",
    name: "a file reference names a held file",
    rule: "package-file-missing",
    says: [
      "The document `items/q1.xml` names the file `images/a.png` in its `src`, and the package's manifest lists no such file (reading 103).",
      "To make it valid: add `images/a.png` to the package and list it in a `file` entry, or correct the `src`.",
    ],
  },
  {
    detail: {
      check: "path-type",
      path: "items/q1.xml",
      reading: "162",
      type: "imsqti_test_xmlv3p0",
    },
    item: "E38",
    name: "one path, one document type",
    rule: "resource-type-mismatch",
    says: [
      "The manifest names `items/q1.xml` a document of type `imsqti_test_xmlv3p0`, and another resource names it a document of another type; a path is one document, of one type (reading 162).",
      "To make it valid: name `items/q1.xml` under one document type only.",
    ],
  },
  {
    detail: {
      check: "manifest-document",
      path: "imsmanifest.xml",
      reading: "146",
      type: "imsqti_item_xmlv3p0",
    },
    item: "E38",
    name: "no resource names the manifest",
    rule: "resource-type-mismatch",
    says: [
      "A resource of type `imsqti_item_xmlv3p0` names `imsmanifest.xml`, the package's manifest, which is no resource's document (reading 146).",
      "To make it valid: point the resource's `href` at its own document, not at the manifest.",
    ],
  },
  {
    detail: { attribute: "identifier", check: "unwritten", path: "q1.xml", reading: "148" },
    item: "E41a",
    name: "a root with no identifier beside a LOM identifier",
    rule: "lom-identifier",
    says: [
      "The document `q1.xml` writes no `identifier` on its root, so nothing matches the `identifier` its resource's LOM metadata gives (reading 148).",
      "To make it valid: write on the document's root the `identifier` its resource's LOM metadata gives.",
    ],
  },
  {
    detail: { attribute: "title", check: "unwritten", path: "q1.xml", reading: "148" },
    item: "E41a",
    name: "a root with no title beside a LOM title",
    rule: "lom-title",
    says: [
      "The document `q1.xml` writes no `title` on its root, so nothing matches the `title` its resource's LOM metadata gives (reading 148).",
      "To make it valid: write on the document's root the `title` its resource's LOM metadata gives.",
    ],
  },
  {
    detail: {
      attribute: "identifier",
      check: "unwritten",
      href: "q9.xml",
      path: "items/q9.xml",
      reading: "155",
    },
    item: "E41b",
    name: "an item ref with no identifier, judged like any other",
    rule: "item-ref-unresolved",
    says: [
      "The item ref that writes no `identifier` points at `q9.xml`, which resolves to `items/q9.xml`, and the manifest lists no item resource there (reading 155).",
      "To make it valid: point the item ref's `href` at an item resource the manifest lists, or list the item as a resource of the package.",
    ],
  },
  {
    detail: {
      check: "custom-interaction",
      element: "qti-custom-interaction",
      parent: "qti-item-body",
      version: "3.0.0",
    },
    item: "P2",
    name: "qti-custom-interaction in a 3.0.0 package",
    rule: "unknown-element",
    says: [
      "`qti-custom-interaction` is deprecated in QTI 3.0.0, which requires a Portable Custom Interaction, `qti-portable-custom-interaction`, in its place.",
      "To make it valid: replace `qti-custom-interaction` with a `qti-portable-custom-interaction`.",
    ],
  },
];

/**
 * A hand-built refusal for each `check` and rewording Revision 3 of align-54 adds, with the row of
 * its contract that adds it and the fragments its sentence must hold: the facts its detail carries,
 * what settles it and the repair. Each fragment names a fact the rule's default sentence never
 * names, so each case fails until its branch words it.
 */
const align54R3Wordings: readonly {
  readonly detail: Readonly<Record<string, string>>;
  readonly name: string;
  readonly row: string;
  readonly rule: RefusalRule;
  readonly says: readonly string[];
}[] = [
  {
    detail: {
      catalog: "glossary",
      check: "card-support",
      source: "info.txt:21097",
      support: "sign-language",
    },
    name: "a catalog holds one card per support",
    row: "F3a",
    rule: "duplicate-identifier",
    says: [
      "A `qti-card` names the support `sign-language`, as an earlier card of the catalog `glossary` does, and a catalog holds one card per support (info.txt:21097).",
      "To make it valid: remove the repeated `qti-card`, or merge its entries into the catalog's first card for `sign-language`.",
    ],
  },
  {
    detail: {
      check: "card-default",
      count: "2",
      element: "qti-card",
      source: "info.txt:21284",
      support: "sign-language",
    },
    name: "a card holds at most one default entry",
    row: "F3a",
    rule: "child-count",
    says: [
      "The `qti-card` for the support `sign-language` holds 2 entries that designate themselves default, and a card holds at most one default entry (info.txt:21284).",
      'To make it valid: keep `default="true"` on one `qti-card-entry` of the card, and remove it from the others.',
    ],
  },
  {
    detail: {
      attribute: "data-catalog-idref",
      check: "catalog-reference",
      element: "span",
      source: "info.txt:21437",
      target: "p",
      value: "note-1",
    },
    name: "a data-catalog-idref names a qti-catalog",
    row: "F3b",
    rule: "attribute-type",
    says: [
      "`span`'s attribute `data-catalog-idref` is `note-1`, the `id` of the element `p`, not of a `qti-catalog`, and a `data-catalog-idref` names a `qti-catalog` of its own document (info.txt:21437).",
      "To make it valid: name in `data-catalog-idref` the `id` of a `qti-catalog` of the document.",
    ],
  },
  {
    detail: {
      check: "reference",
      document: "items/q1.xml",
      element: "qti-file-href",
      path: "cards/sign.mp4",
      source: "info.txt:21151",
    },
    name: "a file reference an element's text makes names a held file",
    row: "F4",
    rule: "package-file-missing",
    says: [
      "The document `items/q1.xml` names the file `cards/sign.mp4` in its `qti-file-href`, and the package's manifest lists no such file (info.txt:21151).",
      "To make it valid: add `cards/sign.mp4` to the package and list it in a `file` entry, or correct the `qti-file-href`.",
    ],
  },
  {
    detail: {
      attribute: "module",
      check: "pci-module-source",
      element: "qti-portable-custom-interaction",
      source: "info.txt:37583",
    },
    name: "a PCI names its module",
    row: "F6",
    rule: "missing-attribute",
    says: [
      "`qti-portable-custom-interaction` carries no `module` and holds no `qti-interaction-modules`, and a PCI names its module by `module`, by `qti-interaction-modules`, or by both (info.txt:37583).",
      "To make it valid: add a `module` to `qti-portable-custom-interaction`, or a `qti-interaction-modules` inside it.",
    ],
  },
  {
    detail: {
      check: "remote-section",
      href: "https://example.org/sections/s1.xml",
      reading: "170",
    },
    name: "a remote section ref is refused under a stated limit",
    row: "C",
    rule: "package-path-outside",
    says: [
      "The section ref's `href` is `https://example.org/sections/s1.xml`, which leads outside the package; plate assembles a test from its package's documents and never fetches a section, so a remote section ref is refused, a stated limit and not a rule of QTI (reading 170).",
      "To make it valid: put the section document in the package and point the `href` at its path inside the package.",
    ],
  },
];

/**
 * The facts of a `string-binding` refusal of an interaction's `string-identifier` naming `NOTES`,
 * a response of base type `integer`.
 *
 * @param interaction The interaction's name.
 * @param cardinality The cardinality `NOTES` is declared with.
 * @returns The refusal's detail.
 */
const stringBound = (interaction: string, cardinality: string) => ({
  baseType: "integer",
  cardinality,
  check: "string-binding",
  interaction,
  reading: "14",
  response: "NOTES",
});

/**
 * Construct the `assembly-limit` refusal of the package `package.zip`, which points at the whole
 * package.
 *
 * @param detail The bound passed, its limit and the count reached.
 * @returns The refusal.
 */
const limitRefusal = (detail: Readonly<Record<string, string>>): Refusal =>
  refusalAt("assembly-limit", "package.zip", { kind: "document" }, detail);

describe("describeRefusal", () => {
  it("words every rule in refusalRules", () => {
    for (const rule of refusalRules) {
      assert.isAbove(describeRefusal(refusalOf(rule, {})).length, 0, rule);
    }
  });

  it.each(align54Wordings)("align-54 wording $item: $name", ({ detail, rule, says }) => {
    const sentence = describeRefusal(refusalOf(rule, detail));

    assert.notMatch(sentence, /[\n\r]/u);

    for (const fragment of says) {
      assert.include(sentence, fragment);
    }
  });

  it.each(align54R3Wordings)("align-54 R3 wording $row: $name", ({ detail, rule, says }) => {
    const sentence = describeRefusal(refusalOf(rule, detail));

    assert.notMatch(sentence, /[\n\r]/u);

    for (const fragment of says) {
      assert.include(sentence, fragment);
    }
  });

  it("align-54 r12 assembly limit: words a package whose tests assemble past the placements bound or the bytes bound with the limit and its number, the count reached, the cause and the remedy, as plate's own limit", () => {
    assert.strictEqual(
      describeRefusal(limitRefusal({ bound: "placements", limit: "2048", reached: "2049" })),
      "**`package.zip`: refused.** The package's tests assemble past plate's assembly limit of 2048 placements of section documents: they place section documents at least 2049 times, each document counted once for every test and context that places it; the limit is plate's own, not a rule of QTI. Rule `assembly-limit`. To make it valid: place fewer section documents in the package's tests, or split the package.",
    );
    assert.strictEqual(
      describeRefusal(limitRefusal({ bound: "bytes", limit: "4194304", reached: "4194560" })),
      "**`package.zip`: refused.** The package's tests assemble past plate's assembly limit of 4194304 bytes of section documents placed: they place at least 4194560 bytes of section documents, each document counted once for every test and context that places it; the limit is plate's own, not a rule of QTI. Rule `assembly-limit`. To make it valid: place fewer section documents in the package's tests, or split the package.",
    );
  });

  it("align-54 R3 wording F4: a file reference an attribute makes keeps its sentence, naming the attribute", () => {
    assert.strictEqual(
      describeRefusal(
        refusalOf("package-file-missing", {
          attribute: "src",
          check: "reference",
          document: "items/q1.xml",
          path: "images/a.png",
          reading: "103",
        }),
      ),
      "**`item.xml`, at `qti-assessment-item`: refused.** The document `items/q1.xml` names the file `images/a.png` in its `src`, and the package's manifest lists no such file (reading 103). Rule `package-file-missing`. To make it valid: add `images/a.png` to the package and list it in a `file` entry, or correct the `src`.",
    );
  });

  it("align-54 wording D2: compares a LOM title in the document's language, as xs:normalizedString, naming the language when the document has one", () => {
    const facts = {
      metadata: "Metadata Example Item #1",
      path: "choice.xml",
      reading: "62",
      resource: "choice",
      title: "Unattended Luggage",
    };
    const unstated = describeRefusal(refusalOf("lom-title", facts));
    const stated = describeRefusal(refusalOf("lom-title", { ...facts, language: "en" }));

    assert.include(
      unstated,
      "The document `choice.xml` has the title `Unattended Luggage`, and the LOM metadata of its resource `choice` gives `Metadata Example Item #1` instead; an item's or test's title must be one its LOM metadata gives in the document's language, compared as an `xs:normalizedString`, in which a tab or line break reads as a space (reading 62).",
    );
    assert.include(
      unstated,
      "To make it valid: make the resource's LOM title string in the document's language `Unattended Luggage`, or change the document's `title` to `Metadata Example Item #1`.",
    );
    assert.include(
      stated,
      "must be one its LOM metadata gives in the document's language, `en`, compared as an `xs:normalizedString`",
    );
  });

  it("align-54 wording D6: names the test's own variable as one reading of an ambiguous reference when its prefix is empty", () => {
    const sentence = describeRefusal(
      refusalOf("ambiguous-reference", {
        firstPrefix: "",
        firstVariable: "a.b",
        reading: "48",
        reference: "a.b",
        secondPrefix: "a",
        secondVariable: "b",
      }),
    );

    assert.include(
      sentence,
      "The reference `a.b` reads two ways, the test's own variable `a.b` and `a` with the variable `b`, and both name a variable that exists (reading 48).",
    );
    assert.include(
      sentence,
      "To make it valid: rename the test's own variable `a.b`, or the item ref, test part or section `a`, so that only one reading names a variable.",
    );
  });

  it("align-54 wording P1, B2b: words a printed variable's format as any text, %% and conversions over the codes and d", () => {
    const sentence = describeRefusal(
      refusalOf("attribute-type", {
        attribute: "format",
        check: "printf-format",
        element: "qti-printed-variable",
        reading: "132",
        value: "%q",
      }),
    );

    assert.include(
      sentence,
      "`qti-printed-variable`'s attribute `format` is `%q`, which is not a printf format: any text, `%%` for a percent sign, and conversions, each a `%`, then any of the flags `#`, `0`, a space, `+` and `-`, an optional width, an optional precision and one of the codes `E`, `e`, `f`, `G`, `g`, `r`, `R`, `i`, `o`, `X`, `x` or `d` (reading 132).",
    );
    assert.include(
      sentence,
      "To make it valid: end each conversion in one of those codes, and write a percent sign as `%%`.",
    );
  });

  // Rewritten under the Mind's ruling 5 (rule bb28660b): a `string-identifier` names "a second
  // response variable (of base-type string)" (info.txt:48078), of any cardinality but `record`, so
  // a Text Entry and an Extended Text are worded by one sentence, which demands no cardinality.
  it("align-54 r11 string response fit D3a: words a Text Entry's string-identifier as naming a string response that is not a record, demanding no cardinality (reading 14)", () => {
    const sentence = describeRefusal(
      refusalOf("binding", stringBound("qti-text-entry-interaction", "multiple")),
    );

    assert.include(
      sentence,
      "`qti-text-entry-interaction`'s attribute `string-identifier` names `NOTES`, a multiple response of base type `integer`, and a `string-identifier` binds a `string` response that is not a `record` (reading 14).",
    );
    assert.include(
      sentence,
      "To make it valid: name such a response in `string-identifier`, or change the declaration of `NOTES`.",
    );
    assert.notInclude(sentence, "a single `string` response");
  });

  it("align-54 r11 string response fit D3a: words an Extended Text's string-identifier naming a record as naming a string response that is not a record, demanding no cardinality (reading 14)", () => {
    const sentence = describeRefusal(
      refusalOf("binding", {
        baseType: "",
        cardinality: "record",
        check: "string-binding",
        interaction: "qti-extended-text-interaction",
        reading: "14",
        response: "NOTES",
      }),
    );

    assert.strictEqual(
      sentence,
      "**`item.xml`, at `qti-assessment-item`: refused.** `qti-extended-text-interaction`'s attribute `string-identifier` names `NOTES`, a record response, and a `string-identifier` binds a `string` response that is not a `record` (reading 14). Rule `binding`. To make it valid: name such a response in `string-identifier`, or change the declaration of `NOTES`.",
    );
  });

  it("words a Gap Match of several gaps bound record with a remedy that writes the base type a multiple declaration needs (reading 169, E39a)", () => {
    // A record declaration writes no base type, and a multiple one with none is refused under
    // E39a, so a remedy for a response that is not single names `base-type="directedPair"` too.
    assert.strictEqual(
      describeRefusal(
        refusalOf("binding", {
          cardinality: "record",
          check: "gap-match-single",
          gaps: "2",
          interaction: "qti-gap-match-interaction",
          response: "RESPONSE",
        }),
      ),
      '**`item.xml`, at `qti-assessment-item`: refused.** `qti-gap-match-interaction` holds 2 gaps and is bound to `RESPONSE`, a record response, and an interaction of several gaps needs a `multiple` response. Rule `binding`. To make it valid: declare `RESPONSE` with `cardinality="multiple"` and `base-type="directedPair"`.',
    );
  });

  it("align-54 r11 gaps bind multiple P7: words a Gap Match of several gaps bound ordered as naming an ordered response (reading 169)", () => {
    const sentence = describeRefusal(
      refusalOf("binding", {
        cardinality: "ordered",
        check: "gap-match-single",
        gaps: "2",
        interaction: "qti-gap-match-interaction",
        response: "RESPONSE",
      }),
    );

    assert.include(
      sentence,
      "`qti-gap-match-interaction` holds 2 gaps and is bound to `RESPONSE`, an ordered response, and an interaction of several gaps needs a `multiple` response.",
    );
    assert.notInclude(sentence, "a single response");
  });

  it("align-54 r11 gaps bind multiple P7: keeps a Gap Match of several gaps bound single worded as before (reading 169)", () => {
    assert.strictEqual(
      describeRefusal(
        refusalOf("binding", {
          cardinality: "single",
          check: "gap-match-single",
          gaps: "3",
          interaction: "qti-gap-match-interaction",
          response: "RESPONSE",
        }),
      ),
      '**`item.xml`, at `qti-assessment-item`: refused.** `qti-gap-match-interaction` holds 3 gaps and is bound to `RESPONSE`, a single response, and an interaction of several gaps needs a `multiple` response. Rule `binding`. To make it valid: declare `RESPONSE` with `cardinality="multiple"`.',
    );
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
    // Reading 60 ("a simple type it names governs its text and is checked"): an element whose
    // `xsi:type` names a simple type holds no element child.
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

  it("align-54 wording E24: words a qti-equal tolerance of 0, which is not one or two values, each a number above 0 or a variable's name (reading 121)", () => {
    const sentence = describeRefusal(
      refusalOf("attribute-type", {
        attribute: "tolerance",
        check: "tolerance-token",
        element: "qti-equal",
        reading: "121",
        value: "0",
      }),
    );

    assert.include(
      sentence,
      "`qti-equal`'s attribute `tolerance` is `0`, which is not one or two values, each a number above 0 or a variable's name (reading 121).",
    );
    assert.include(
      sentence,
      "To make it valid: write one or two values, one space apart, each a number above 0 or a variable's name.",
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

  it('names a dotted name that resolves to no item ref, test part or section variable, by reading 48 ("a dotted reference is accepted when exactly one reading names a real item ref, test part or section and its variable")', () => {
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

  it("align-54 built-ins by kind E22a: words a map-response or map-response-point of a built-in as naming it, which has no declaration, and never asks to declare it (reading 111)", () => {
    const cases = [
      ["qti-map-response", "numAttempts", { child: "qti-mapping" }, "with a `qti-mapping`"],
      [
        "qti-map-response-point",
        "duration",
        { baseType: "point", child: "qti-area-mapping" },
        "of base type `point` with a `qti-area-mapping`",
      ],
    ] as const;

    for (const [element, identifier, needs, lacks] of cases) {
      const sentence = describeRefusal(
        refusalOf("template-requirements", {
          ...needs,
          declaration: "qti-response-declaration",
          element,
          identifier,
        }),
      );

      assert.include(
        sentence,
        `\`${element}\` needs a \`qti-response-declaration\` ${lacks}, and names the built-in \`${identifier}\`, which has no declaration.`,
        element,
      );
      assert.include(
        sentence,
        `To make it valid: name a response the item declares in a \`qti-response-declaration\` ${lacks}.`,
        element,
      );
      assert.notInclude(sentence, `declare \`${identifier}\``, element);
    }
  });

  it("words a test's or a section's map-response or map-response-point of a built-in with the fix of a response an item declares, read through its item ref, never one the item declares (reading 166)", () => {
    const places = [
      [testLocation, "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value"],
      ["section.xml", "qti-assessment-section/qti-pre-condition/qti-gte"],
    ] as const;
    const cases = [
      ["qti-map-response", "duration", { child: "qti-mapping" }, "with a `qti-mapping`"],
      [
        "qti-map-response-point",
        "numAttempts",
        { baseType: "point", child: "qti-area-mapping" },
        "of base type `point` with a `qti-area-mapping`",
      ],
    ] as const;

    for (const [document, parent] of places) {
      for (const [element, identifier, needs, lacks] of cases) {
        const sentence = describeRefusal(
          refusalAt(
            "template-requirements",
            document,
            { kind: "path", path: `${parent}/${element}` },
            { ...needs, declaration: "qti-response-declaration", element, identifier },
          ),
        );

        assert.include(
          sentence,
          `\`${element}\` needs a \`qti-response-declaration\` ${lacks}, and names the built-in \`${identifier}\`, which has no declaration.`,
          `${document} ${element}`,
        );
        assert.include(
          sentence,
          `To make it valid: name a response an item declares in a \`qti-response-declaration\` ${lacks}, through its item ref, written \`ITEMREF.RESPONSE\`.`,
          `${document} ${element}`,
        );
        assert.notInclude(sentence, "a response the item declares", `${document} ${element}`);
      }
    }
  });

  it("keeps an item's sentence for a map-response of a built-in byte for byte (reading 166, control)", () => {
    assert.strictEqual(
      describeRefusal(
        refusalOf("template-requirements", {
          child: "qti-mapping",
          declaration: "qti-response-declaration",
          element: "qti-map-response",
          identifier: "numAttempts",
        }),
      ),
      "**`item.xml`, at `qti-assessment-item`: refused.** `qti-map-response` needs a `qti-response-declaration` with a `qti-mapping`, and names the built-in `numAttempts`, which has no declaration. Rule `template-requirements`. To make it valid: name a response the item declares in a `qti-response-declaration` with a `qti-mapping`.",
    );
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

/**
 * Construct a test that declares `TOTAL` and the given declarations before its one part, and whose
 * outcome processing sets `TOTAL` to an expression naming a variable through its `identifier`.
 *
 * @param declarations The test's declarations besides `TOTAL`.
 * @param local The expression's local name, such as `qti-correct`.
 * @param identifier The name the expression gives.
 * @returns The test, at {@link testLocation}.
 */
const readingByName = (
  declarations: readonly SourceElement[],
  local: string,
  identifier: string,
): SourceDocument =>
  doc(
    testLocation,
    el(
      "qti-assessment-test",
      [attr("identifier", "T"), attr("title", "Test")],
      [
        ...declarations,
        outcome("TOTAL", "integer"),
        el(
          "qti-test-part",
          [
            attr("identifier", "P"),
            attr("navigation-mode", "linear"),
            attr("submission-mode", "individual"),
          ],
          [assessmentSection("S", [itemRef("I1")])],
        ),
        el(
          "qti-outcome-processing",
          [],
          [
            el(
              "qti-set-outcome-value",
              [attr("identifier", "TOTAL")],
              [el(local, [attr("identifier", identifier)])],
            ),
          ],
        ),
      ],
    ),
  );

/**
 * The `undeclared-variable` refusals of a verdict, each with its detail and its sentence.
 *
 * @param verdict The verdict.
 * @returns Each such refusal's detail and sentence, in order; none when the verdict is not refused.
 */
const undeclaredOf = (verdict: Verdict) =>
  verdict.verdict === "refused"
    ? verdict.refusals
        .filter((refusal) => refusal.rule === "undeclared-variable")
        .map((refusal) => ({ detail: refusal.detail, sentence: describeRefusal(refusal) }))
    : [];

describe("check, a built-in's name a test declares, read as a response (reading 168)", () => {
  it("align-54 R3 declared built-in: refuses a qti-correct or qti-map-response of the outcome numAttempts or completionStatus a test declares, or of its context variable numAttempts, with declared naming the kind, and says the test declares it, not that it has no declaration", () => {
    for (const [identifier, declaration, declared, kind] of [
      ["numAttempts", outcome("numAttempts", "integer"), "outcome", "an outcome"],
      ["completionStatus", outcome("completionStatus", "identifier"), "outcome", "an outcome"],
      [
        "numAttempts",
        el("qti-context-declaration", [
          attr("base-type", "integer"),
          attr("cardinality", "single"),
          attr("identifier", "numAttempts"),
        ]),
        "context",
        "a context variable",
      ],
    ] as const) {
      for (const local of ["qti-correct", "qti-map-response"]) {
        const label = `${local} ${declared} ${identifier}`;
        const refusals = undeclaredOf(verdictOf(readingByName([declaration], local, identifier)));

        assert.deepStrictEqual(
          refusals.map((refusal) => refusal.detail),
          [{ declared, declarer: "test", element: local, expected: "response", identifier }],
          label,
        );
        assert.strictEqual(
          refusals.map((refusal) => refusal.sentence).join("\n"),
          `**\`${testLocation}\`, at \`qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/${local}\`: refused.** \`${local}\` names \`${identifier}\`, ${kind} the test declares in place of the built-in, and no response, so it has no mapping or correct response. Rule \`undeclared-variable\`. To make it valid: name a response an item declares, through its item ref, written \`ITEMREF.RESPONSE\`.`,
          label,
        );
      }
    }
  });

  it("align-54 R3 declared built-in: keeps today's sentence, byte for byte, for an item's qti-correct of the undeclared built-in completionStatus, and for a test's that declares no completionStatus, neither carrying declared", () => {
    const itemVerdict = verdictOf(
      item([
        score(),
        el("qti-item-body", [], [el("p", [], [text("x")])]),
        el(
          "qti-response-processing",
          [],
          [
            el(
              "qti-set-outcome-value",
              [attr("identifier", "SCORE")],
              [el("qti-correct", [attr("identifier", "completionStatus")])],
            ),
          ],
        ),
      ]),
    );
    const testVerdict = verdictOf(readingByName([], "qti-correct", "completionStatus"));

    assert.deepStrictEqual(undeclaredOf(itemVerdict), [
      {
        detail: { element: "qti-correct", expected: "response", identifier: "completionStatus" },
        sentence:
          "**`item.xml`, at `qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-correct`: refused.** `qti-correct` names the built-in `completionStatus`, which has no declaration, so no mapping or correct response. Rule `undeclared-variable`. To make it valid: name a declared response.",
      },
    ]);
    assert.deepStrictEqual(undeclaredOf(testVerdict), [
      {
        detail: {
          declarer: "test",
          element: "qti-correct",
          expected: "response",
          identifier: "completionStatus",
        },
        sentence: `**\`${testLocation}\`, at \`qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-correct\`: refused.** \`qti-correct\` names the built-in \`completionStatus\`, which has no declaration, so no mapping or correct response. Rule \`undeclared-variable\`. To make it valid: name a response an item declares, through its item ref, written \`ITEMREF.RESPONSE\`.`,
      },
    ]);
  });
});

describe("check, the builders it runs", () => {
  it("builders without a runtime: check runs no Effect.runSync, and no model module value-imports from effect more than Array, Data, Option, pipe and Result", () => {
    const modules = sourceModules();
    const verdict = modules.get("src/validate/verdict.ts");
    const builders = [...modules].filter(
      ([module]) =>
        module.startsWith("src/model/") && module.endsWith(".ts") && !module.endsWith(".test.ts"),
    );
    const effectNames = builders.flatMap(([module, source]) =>
      readImports(source)
        .imports.filter((declaration) => declaration.specifier === "effect")
        .flatMap(valueNames)
        .filter((name) => !allowedEffectNames.has(name))
        .map((name) => `${module}: ${name}`),
    );

    assert.isDefined(verdict);
    assert.isAbove(builders.length, 0);
    assert.deepStrictEqual(
      { effectNames, runSync: verdict.includes("Effect.runSync") },
      { effectNames: [], runSync: false },
    );
  });
});
