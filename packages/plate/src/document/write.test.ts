import type { Attribute, Child, Element } from "@qti-pie/crust/tree.ts";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readSource } from "#plate/document/read.ts";
import { attr, el, text, xmlnsNamespace, xsiNamespace } from "#plate/document/source.ts";
import { writeDocument } from "#plate/document/write.ts";

/**
 * The Results Reporting namespace the hand-built document's elements are in.
 */
const resultNamespace = "http://www.imsglobal.org/xsd/imsqti_result_v3p0";

/**
 * The `xsi:schemaLocation` value the hand-built document carries.
 */
const schemaLocation = `${resultNamespace} imsqti_resultv3p0_v1p0.xsd`;

/**
 * Construct an unprefixed element in the Results Reporting namespace, as crust's tree holds it.
 *
 * @param local The element's local name.
 * @param attributes Its attributes in document order.
 * @param children Its children in document order.
 * @returns The element in the default namespace.
 */
const element = (
  local: string,
  attributes: readonly Attribute[] = [],
  children: readonly Child[] = [],
): Element => ({
  attributes,
  children,
  kind: "element",
  local,
  namespace: resultNamespace,
  prefix: "",
  qname: local,
});

/**
 * Construct an attribute as crust's tree holds it.
 *
 * @param qname The attribute's name as written.
 * @param value Its value, with no unexpanded entity reference.
 * @param namespace Its namespace, none by default.
 * @returns The attribute whose local name and prefix split `qname` at its colon.
 */
const attribute = (qname: string, value: string, namespace = ""): Attribute => {
  const [prefix, local] = qname.includes(":") ? qname.split(":") : ["", qname];

  return { local: local ?? qname, namespace, prefix: prefix ?? "", qname, references: [], value };
};

/**
 * A small namespaced results document: a default namespace, a prefixed one with an attribute in
 * it, a childless element, nesting, and text that needs escaping.
 */
const tree: Element = element(
  "assessmentResult",
  [
    attribute("xmlns", resultNamespace, xmlnsNamespace),
    attribute("xmlns:xsi", xsiNamespace, xmlnsNamespace),
    attribute("xsi:schemaLocation", schemaLocation, xsiNamespace),
  ],
  [
    element("context", [attribute("sourcedId", "s-1")]),
    element(
      "itemResult",
      [
        attribute("identifier", "I1"),
        attribute("sequenceIndex", "1"),
        attribute("datestamp", "2026-11-05T10:00:00Z"),
        attribute("sessionStatus", "final"),
      ],
      [
        element(
          "responseVariable",
          [
            attribute("identifier", "RESPONSE"),
            attribute("cardinality", "single"),
            attribute("baseType", "string"),
          ],
          [
            element(
              "candidateResponse",
              [],
              [element("value", [], [{ cdata: false, kind: "text", value: 'x < y & "z"' }])],
            ),
          ],
        ),
      ],
    ),
  ],
);

describe("document/write.ts", () => {
  it("writes a namespaced tree after the XML declaration, a childless element as <x/>", () => {
    assert.strictEqual(
      writeDocument(tree),
      [
        '<?xml version="1.0" encoding="utf-8"?>\n',
        `<assessmentResult xmlns="${resultNamespace}" xmlns:xsi="${xsiNamespace}" xsi:schemaLocation="${schemaLocation}">`,
        '<context sourcedId="s-1"/>',
        '<itemResult identifier="I1" sequenceIndex="1" datestamp="2026-11-05T10:00:00Z" sessionStatus="final">',
        '<responseVariable identifier="RESPONSE" cardinality="single" baseType="string">',
        '<candidateResponse><value>x &lt; y &amp; "z"</value></candidateResponse>',
        "</responseVariable></itemResult></assessmentResult>",
      ].join(""),
    );
  });

  it.effect("the written text reads back through readSource to the same tree", () =>
    Effect.gen(function* roundTrip() {
      const source = yield* readSource(
        "hand-built-result.xml",
        new TextEncoder().encode(writeDocument(tree)),
      );

      assert.deepStrictEqual(
        source.root,
        el(
          "assessmentResult",
          [
            attr("xmlns", resultNamespace, xmlnsNamespace),
            attr("xsi", xsiNamespace, xmlnsNamespace),
            attr("schemaLocation", schemaLocation, xsiNamespace),
          ],
          [
            el("context", [attr("sourcedId", "s-1")], [], resultNamespace),
            el(
              "itemResult",
              [
                attr("identifier", "I1"),
                attr("sequenceIndex", "1"),
                attr("datestamp", "2026-11-05T10:00:00Z"),
                attr("sessionStatus", "final"),
              ],
              [
                el(
                  "responseVariable",
                  [
                    attr("identifier", "RESPONSE"),
                    attr("cardinality", "single"),
                    attr("baseType", "string"),
                  ],
                  [
                    el(
                      "candidateResponse",
                      [],
                      [el("value", [], [text('x < y & "z"')], resultNamespace)],
                      resultNamespace,
                    ),
                  ],
                  resultNamespace,
                ),
              ],
              resultNamespace,
            ),
          ],
          resultNamespace,
        ),
      );
    }),
  );
});
