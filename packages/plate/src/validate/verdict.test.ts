import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  attr,
  doc,
  el,
  entity,
  mathmlNamespace,
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
import type { BodyElement, BodyNode, Item } from "#plate/model/item.ts";
import { Refusal, refusalRules } from "#plate/validate/refusal.ts";
import type { Location, RefusalRule } from "#plate/validate/refusal.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptForTest, check, describeRefusal } from "#plate/validate/verdict.ts";
import type { Accepted, Verdict } from "#plate/validate/verdict.ts";

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
 * Read the accepted document of a verdict that must accept it.
 *
 * @param verdict The verdict.
 * @param expected Which of the two accepting verdicts it must be.
 * @returns Its accepted document.
 */
const acceptedOf = (
  verdict: Verdict,
  expected: "accepted" | "accepted-with-unsupported",
): Accepted => {
  assert.strictEqual(verdict.verdict, expected);

  return verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? verdict.accepted
    : assert.fail(`The verdict is ${verdict.verdict}, not ${expected}.`);
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
 * Write a body's nodes compactly: an element as its tag with its children, text as itself and a
 * notice as `notice:<feature>@<path>`.
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
      case "choice":
      case "extended-text":
      case "text-entry": {
        return node.kind;
      }
      default: {
        return node satisfies never;
      }
    }
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

  it("accepts a Choice inside a custom interaction as foreign content, unsupported (reading 6)", () => {
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

  it("leaves a root other than qti-assessment-item unchecked", () => {
    const verdict = verdictOf(
      doc(
        "stimulus.xml",
        el(
          "qti-assessment-stimulus",
          [attr("identifier", "stimulus-1"), attr("title", "Stimulus")],
          [el("qti-stimulus-body", [], [el("p", [], [text("Read this.")])])],
        ),
      ),
    );

    assert.strictEqual(verdict.verdict, "unchecked");
    if (verdict.verdict === "unchecked") {
      assert.deepStrictEqual(verdict.reasons, [
        { path: "qti-assessment-stimulus", reason: "root" },
      ]);
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

  it("marks shuffle on the verdict with no notice in the body", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([
          response("identifier", "single"),
          body([choiceInteraction([attr("shuffle", "true")])]),
        ]),
      ),
      "accepted-with-unsupported",
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: 'shuffle="true"', path: `${bodyPath}/qti-choice-interaction`, shown: "mark" },
    ]);
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

describe("check, processing the model does not hold", () => {
  it("accepts a point response's match_correct with a variable mark, not a refusal", () => {
    const accepted = acceptedOf(
      verdictOf(
        item([
          response("point", "single", [correct("10 10")]),
          score(),
          body([el("p", [], [text("Click the city.")])]),
          el("qti-response-processing", [
            attr("template", "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"),
          ]),
        ]),
      ),
      "accepted-with-unsupported",
    );

    assert.deepInclude(accepted.unsupported, {
      feature: "variable:RESPONSE",
      path: `${root}/qti-response-processing`,
      shown: "mark",
    });
    assert.isTrue(Option.isNone(accepted.item.processing));
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
 * Construct a refusal of `item.xml` at the item root.
 *
 * @param rule The rule it breaks.
 * @param detail The facts its wording reads.
 * @returns The refusal.
 */
const refusalOf = (rule: RefusalRule, detail: Readonly<Record<string, string>>): Refusal =>
  new Refusal({
    detail,
    document: "item.xml",
    location: { kind: "path", path: root },
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });

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
});
