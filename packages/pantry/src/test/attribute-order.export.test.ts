/**
 * Spec reading 137 over the export: an element's attributes and its namespace declarations are
 * sets (XML Information Set §2.2, [attributes] and [namespace attributes] unordered), which the
 * database stores with no order (`Node.attributes`, `Node.openAttributes` and `Node.namespaces` are
 * `counted` families), so the export writes them in Canonical XML 1.0's order: the declarations
 * first, by the prefix each declares, then the attributes by namespace name, then local name, each
 * compared by code point (§2.2, "Document Order").
 *
 * One element is written with every ordered selection of at most four of seven attributes and
 * declarations, then taken through the path a stored document travels: shred, the rows `flatten`
 * writes, handed to assembly with every list reversed (an order no set has), and `unshred`. Each
 * element of the result must write its attributes in Canonical XML's order, whatever order the
 * source wrote them in, and the result must be the source canonically.
 *
 * @see {@link https://www.w3.org/TR/xml-c14n/#DocumentOrder | Canonical XML 1.0, §2.2 Document Order}
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { shuffled } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Order } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import { XMLNS_NAMESPACE } from "@qti-pie/crust/tree.ts";
import type { Attribute, Child, Element } from "@qti-pie/crust/tree.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { names } from "#pantry/model/names.ts";
import { shred } from "#pantry/model/shred.ts";
import { unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows } from "#pantry/model/xdm.ts";
import { caseHang } from "#pantry/test/gen/xdm.ts";

/**
 * The grammar shred reads through, projected once.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * Order texts by code point, Canonical XML's lexicographic order ("based on the UCS codepoint
 * values"), the oracle's own: JavaScript's comparison reads UTF-16 code units, which put a code
 * point above U+FFFF before one from U+E000 to U+FFFF.
 */
const byCodePoint: Order.Order<string> = Order.mapInput(Order.Array(Order.Number), (text: string) =>
  Array.from(text, (point) => point.codePointAt(0) ?? 0),
);

/**
 * Whether an attribute of crust's tree is a namespace declaration.
 *
 * @param attribute - The attribute.
 * @returns Whether its namespace is the `xmlns` namespace.
 */
const isDeclaration = (attribute: Attribute): boolean => attribute.namespace === XMLNS_NAMESPACE;

/**
 * The prefix a namespace declaration declares: its local name, or the empty prefix where it is the
 * default namespace's unprefixed `xmlns`.
 *
 * @param declaration - The declaration.
 * @returns The prefix.
 */
const declaredPrefixOf = (declaration: Attribute): string =>
  declaration.prefix === "" ? "" : declaration.local;

/**
 * Canonical XML's order of one element's attributes, declarations included: every declaration
 * first, by the prefix it declares, the default namespace's empty prefix least; then every
 * attribute by namespace name, the empty one least, then local name.
 */
const canonicalOrder: Order.Order<Attribute> = Order.combine(
  Order.mapInput(Order.Boolean, (attribute: Attribute) => !isDeclaration(attribute)),
  Order.combine(
    Order.mapInput(byCodePoint, (attribute: Attribute) =>
      isDeclaration(attribute) ? declaredPrefixOf(attribute) : attribute.namespace,
    ),
    Order.mapInput(byCodePoint, (attribute: Attribute) =>
      isDeclaration(attribute) ? "" : attribute.local,
    ),
  ),
);

/**
 * List an element and every element below it, in document order.
 *
 * @param element - The element.
 * @returns The elements.
 */
const elementsOf = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child: Child) =>
    child.kind === "element" ? elementsOf(child) : [],
  ),
];

/**
 * Hand a document's rows over with every list reversed: an order a set does not have, which
 * assembly must not read.
 *
 * @param rows - The rows.
 * @returns The same rows, each list reversed.
 */
const reversed = (rows: FlatRows<Composed>): FlatRows<Composed> => ({
  attributeEntities: rows.attributeEntities.toReversed(),
  attributes: rows.attributes.toReversed(),
  comments: rows.comments.toReversed(),
  doctypes: rows.doctypes.toReversed(),
  document: rows.document,
  encodingDecls: rows.encodingDecls.toReversed(),
  entityRefs: rows.entityRefs.toReversed(),
  namespaces: rows.namespaces.toReversed(),
  nodes: rows.nodes.toReversed(),
  openAttributeEntities: rows.openAttributeEntities.toReversed(),
  openAttributes: rows.openAttributes.toReversed(),
  openElementNames: rows.openElementNames.toReversed(),
  pis: rows.pis.toReversed(),
  sdDecls: rows.sdDecls.toReversed(),
  texts: rows.texts.toReversed(),
  whitespace: rows.whitespace.toReversed(),
  xmlDecls: rows.xmlDecls.toReversed(),
});

/**
 * The attributes and declarations the box's element carries a selection of: an `id`, a `class`, an
 * `xml:lang` (in the XML namespace, so after every attribute in none), two names of the `data-*`
 * class, U+F900 and U+10000, which code-point order and UTF-16 order put in opposite orders, and
 * two namespace declarations no name uses.
 */
const specifications = [
  'id="a"',
  'class="c"',
  'xml:lang="en"',
  'data-豈="1"',
  'data-𐀀="2"',
  'xmlns:q="urn:example:q"',
  'xmlns:p="urn:example:p"',
] as const;

/**
 * The situations the box must reach: no attribute, some, the open class's two names, a declaration
 * after an attribute, and the two declarations against their canonical order.
 */
type Situation =
  | "bare"
  | "carried"
  | "repeated open class"
  | "declaration after an attribute"
  | "declarations reversed";

/**
 * Where the declarations of {@link specifications} start.
 */
const firstDeclaration = specifications.findIndex((written) => written.startsWith("xmlns"));

describe("spec reading 137, attribute order, through the export", () => {
  it.effect(
    "writes every element's declarations, then its attributes, in Canonical XML's order, and the source canonically",
    (ctx) =>
      // Oracle: a universal one, export ∘ import = id up to Canonical XML, and Canonical XML's
      // order of each element's attributes stated here by code point.
      // Bound: every ordered selection of at most four of the seven on one div, 1,100 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "every ordered selection of at most 4 of the 7 attributes and declarations on one div",
            caseHang,
            coverage: requiredInSpace<Situation>([
              "bare",
              "carried",
              "repeated open class",
              "declaration after an attribute",
              "declarations reversed",
            ]),
            generator: shuffled(
              specifications.map((_, at) => at),
              { max: 4, min: 0 },
            ),
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "export ∘ import = id, each element's attributes in Canonical XML's order",
            },
            suite: "pantry/test/attribute-order-export",
          },
          (carried, c) =>
            Effect.gen(function* box() {
              c.note(carried.length === 0 ? "bare" : "carried");
              if (carried.includes(3) && carried.includes(4)) {
                c.note("repeated open class");
              }

              const declared = carried.findIndex((at) => at >= firstDeclaration);
              if (
                declared !== -1 &&
                carried.slice(0, declared).some((at) => at < firstDeclaration)
              ) {
                c.note("declaration after an attribute");
              }

              const [first, second] = [firstDeclaration, firstDeclaration + 1];
              if (carried.includes(second) && carried.indexOf(second) < carried.indexOf(first)) {
                c.note("declarations reversed");
              }

              const attributes = carried.map((at) => ` ${specifications[at] ?? ""}`).join("");
              const text = [
                '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false" adaptive="false">',
                `<qti-item-body><div${attributes}>a</div></qti-item-body>`,
                "</qti-assessment-item>",
              ].join("");
              const label = carried.join(" ");
              const source = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
              const tree = yield* Effect.orDie(shred(source, "3.0.1", shredGrammar));
              const assembled = yield* Effect.orDie(
                Effect.fromResult(assemble(reversed(flatten(tree)))),
              );
              const written = yield* Effect.orDie(
                readXml(yield* Effect.orDie(unshred(assembled, names))),
              );

              for (const element of elementsOf(written.root)) {
                assert.deepStrictEqual(
                  element.attributes.map(({ qname }) => qname),
                  element.attributes.toSorted(canonicalOrder).map(({ qname }) => qname),
                  `${label}: ${element.qname} writes its attributes in Canonical XML's order`,
                );
              }

              assert.deepStrictEqual(
                canonicalize(written),
                canonicalize(source),
                `${label}: the export is the source canonically`,
              );
            }),
        ),
      ),
  );
});
