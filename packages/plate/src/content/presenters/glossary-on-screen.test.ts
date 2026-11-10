import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  decodeRedacted,
  encodeRedacted,
  noSupports,
  open,
  redact,
  render,
} from "#plate/index.ts";
import type { Accepted, Element, Node, Supports } from "#plate/index.ts";
import { checkTree, nameOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";

/**
 * Where the glossary fixture sits under the package, which `open` takes as the document's location.
 */
const fixtureLocation = "fixtures/m3e/items/glossary.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * An asset base on another origin, with its closing slash.
 */
const assetBase = "https://cdn.example/pkg/";

/**
 * The sentence of the fixture's `lens` card, which nothing else in the item says.
 */
const lensDefinition = "A lens is a curved piece of glass that bends the light passing through it.";

/**
 * The sentence of the fixture's `mirror` card.
 */
const mirrorDefinition =
  "A mirror is a smooth surface that sends most of the light that reaches it back.";

/**
 * The supports a host enables to show glossary definitions, and nothing else.
 */
const glossaryOn: Supports = { ...noSupports, catalog: new Set(["glossary-on-screen"]) };

/**
 * The supports a host enables to show another catalog support alone, which leaves every glossary
 * card dormant.
 */
const glossaryOff: Supports = { ...noSupports, catalog: new Set(["additional-directions"]) };

/**
 * Wrap an item body and its catalogs in a complete QTI 3 item with one Choice, written fresh for
 * these rows: a paragraph or two and a catalog or two are what each row varies.
 *
 * @param body The markup of the item body before the Choice.
 * @param catalogs The markup of the `qti-catalog` elements.
 * @returns The item's XML.
 */
const itemWith = (body: string, catalogs: string): string => `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
  identifier="glossary-row" title="Glossary row" adaptive="false" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body>
    ${body}
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-prompt>Pick one.</qti-prompt>
      <qti-simple-choice identifier="A">One</qti-simple-choice>
      <qti-simple-choice identifier="B">Two</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
  <qti-catalog-info>${catalogs}</qti-catalog-info>
</qti-assessment-item>`;

/**
 * Open item XML as a host opens a document it read from storage, and take its accepted item.
 *
 * @param xml The item's XML.
 * @returns The accepted item.
 */
const accepting = Effect.fnUntraced(function* accepting(xml: string) {
  const verdict = yield* open(fixtureLocation, new TextEncoder().encode(xml));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the document is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Open the glossary fixture and take its accepted item.
 *
 * @returns The accepted item.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  const bytes = yield* Effect.promise(() =>
    readFile(path.resolve(import.meta.dirname, "..", "..", "..", fixtureLocation)),
  );
  const verdict = yield* open(fixtureLocation, bytes);

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the fixture is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Redact the accepted item under the supports and render it with the default configuration, the
 * fixed instance token and the asset base, as a host does for one candidate.
 *
 * @param accepted The accepted item.
 * @param supports The supports the host enabled.
 * @returns The HTML the render wrote.
 */
const renderedHtml = Effect.fnUntraced(function* renderedHtml(
  accepted: Accepted,
  supports: Supports,
) {
  const configuration = yield* configure({});
  const rendered = yield* Effect.fromResult(
    render(redact(accepted, undefined, undefined, { supports }), configuration, {
      assetBase,
      instance,
      supports,
    }),
  );

  return rendered.html;
});

/**
 * Parse one emitted HTML fragment into its single root element.
 *
 * @param html The fragment.
 * @returns Its root element.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);
  assert.lengthOf(rest, 0, "the fragment has one root");

  return root?.kind === "element" ? root : assert.fail("the fragment's root is not an element");
};

/**
 * List the elements below nodes, in document order, the nodes' own elements first.
 *
 * @param nodes The nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * List an element's child elements, leaving out the text between them.
 *
 * @param element The parent.
 * @returns Its element children, in document order.
 */
const childrenOf = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Collect the text below a node, as written.
 *
 * @param node The node.
 * @returns Its text.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

/**
 * Read one attribute of an element as a string.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns The value, none when the element has no such attribute or writes it bare.
 */
const attributeOf = (element: Element, name: string): string | undefined => {
  const value = element.attrs[name];

  return value === undefined || value === true ? undefined : value;
};

/**
 * Find the terms of a page: each `span` of a paragraph, in document order.
 *
 * @param root The page's Root element.
 * @returns The spans that sit in a `p` of the Root's children.
 */
const termsOf = (root: Element): readonly Element[] =>
  childrenOf(root)
    .filter((child) => child.tag === "p")
    .flatMap((paragraph) => childrenOf(paragraph).filter((child) => child.tag === "span"));

/**
 * Find the term of a page by its text, failing the test when there is not exactly one.
 *
 * @param root The page's Root element.
 * @param term The term's text.
 * @returns The term's `span`.
 */
const termNamed = (root: Element, term: string): Element => {
  const found = termsOf(root).filter((span) => textOf(span) === term);
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one term ${term}, found ${found.length}`);
};

/**
 * Find every glossary disclosure of a page: each `details` of the Root's descendants.
 *
 * @param root The page's Root element.
 * @returns The `details`, in document order.
 */
const disclosuresOf = (root: Element): readonly Element[] =>
  elementsOf(root.children).filter((element) => element.tag === "details");

/**
 * Find the disclosure a term points at through `aria-details`, failing the test when it points at
 * none or at more than one element.
 *
 * @param root The page's Root element.
 * @param term The term's `span`.
 * @returns The `details` the term names.
 */
const disclosureOf = (root: Element, term: Element): Element => {
  const id = attributeOf(term, "aria-details");
  const found = elementsOf(root.children).filter((element) => attributeOf(element, "id") === id);
  const [only, ...rest] = found;

  return id !== undefined && only !== undefined && rest.length === 0 && only.tag === "details"
    ? only
    : assert.fail(`${textOf(term)} points at ${String(id)}, which is not exactly one details`);
};

/**
 * Give the first `summary` child of a `details`, failing the test when it has none.
 *
 * @param details The `details`.
 * @returns Its `summary`.
 */
const summaryOf = (details: Element): Element =>
  childrenOf(details).find((child) => child.tag === "summary") ??
  assert.fail("the details has no summary");

/**
 * Collect every `id` of a tree.
 *
 * @param root The tree's root.
 * @returns The ids in document order, the root's first.
 */
const idsOf = (root: Element): readonly string[] =>
  [root, ...elementsOf(root.children)].flatMap((element) => {
    const id = attributeOf(element, "id");

    return id === undefined ? [] : [id];
  });

describe("A-15: glossary on screen, a native disclosure beside each term", () => {
  it.effect("[A-15] open accepts the glossary fixture and marks nothing unsupported", () =>
    Effect.gen(function* accepts() {
      const accepted = yield* acceptFixture();

      assert.deepStrictEqual(
        accepted.unsupported.filter(({ feature }) => feature === "qti-catalog-info"),
        [],
      );
    }),
  );

  it.effect(
    "[A-15] with the support off a glossary term is plain text and no definition is in the page",
    () =>
      Effect.gen(function* plain() {
        const accepted = yield* acceptFixture();
        const baseline = yield* renderedHtml(accepted, noSupports);
        const off = yield* renderedHtml(accepted, glossaryOff);
        const json = JSON.stringify(
          yield* Effect.fromResult(
            encodeRedacted(redact(accepted, undefined, undefined, { supports: glossaryOff })),
          ),
        );

        assert.strictEqual(off, baseline);
        assert.notInclude(off, "<details");
        assert.notInclude(off, "aria-details");
        assert.include(off, "<span>lens</span>");

        for (const definition of [lensDefinition, mirrorDefinition, "glossary/prism.html"]) {
          assert.notInclude(off, definition);
          assert.notInclude(json, definition);
        }
      }),
  );

  it.effect("[A-15] with the support on each term is marked and points at its definition", () =>
    Effect.gen(function* marked() {
      const accepted = yield* acceptFixture();
      const root = rootOf(yield* renderedHtml(accepted, glossaryOn));

      for (const term of ["lens", "prism", "mirror"]) {
        const span = termNamed(root, term);

        assert.isDefined(attributeOf(span, "id"), `${term} has an id to be named by`);
        assert.strictEqual(disclosureOf(root, span).tag, "details");
      }

      assert.lengthOf(disclosuresOf(root), 3);
    }),
  );

  it.effect(
    "[A-15] each definition sits in a details after the term's enclosing block, closed, its summary named by the term",
    () =>
      Effect.gen(function* sitsAfterBlock() {
        const accepted = yield* acceptFixture();
        const root = rootOf(yield* renderedHtml(accepted, glossaryOn));
        const lens = termNamed(root, "lens");
        const details = disclosureOf(root, lens);
        const summary = summaryOf(details);
        const rootChildren = childrenOf(root);
        const paragraph = rootChildren.find((child) => childrenOf(child).includes(lens));

        assert.isDefined(paragraph, "the term sits in a p of the Root");
        assert.include(rootChildren, details, "the details is a child of the Root");
        assert.strictEqual(
          rootChildren.indexOf(details),
          rootChildren.indexOf(paragraph ?? lens) + 1,
          "the details follows the paragraph that holds the term",
        );
        assert.isFalse(Object.hasOwn(details.attrs, "open"), "the details is closed");
        assert.strictEqual(textOf(summary), "Definition");
        assert.strictEqual(nameOf(summary, root), "Definition lens");
        assert.include(textOf(details), lensDefinition);
        assert.notInclude(textOf(paragraph ?? lens), lensDefinition);
      }),
  );

  it.effect("[A-15] two terms in one block give two definitions in document order", () =>
    Effect.gen(function* inOrder() {
      const accepted = yield* acceptFixture();
      const root = rootOf(yield* renderedHtml(accepted, glossaryOn));
      const lens = disclosureOf(root, termNamed(root, "lens"));
      const prism = disclosureOf(root, termNamed(root, "prism"));
      const mirror = disclosureOf(root, termNamed(root, "mirror"));
      const order = childrenOf(root).filter(
        (child) => child.tag === "p" || child.tag === "details",
      );

      assert.deepStrictEqual(
        order.map((child) => child.tag),
        ["p", "details", "details", "p", "details"],
      );
      assert.strictEqual(order[1], lens);
      assert.strictEqual(order[2], prism);
      assert.strictEqual(order[4], mirror);
      assert.notStrictEqual(attributeOf(lens, "id"), attributeOf(prism, "id"));
    }),
  );

  it.effect(
    "[A-15] a glossary card with only a file href gives a link to the file inside the details",
    () =>
      Effect.gen(function* linked() {
        const accepted = yield* acceptFixture();
        const root = rootOf(yield* renderedHtml(accepted, glossaryOn));
        const details = disclosureOf(root, termNamed(root, "prism"));
        const links = elementsOf(details.children).filter((element) => element.tag === "a");

        assert.lengthOf(links, 1);
        assert.strictEqual(
          attributeOf(links[0] ?? details, "href"),
          `${assetBase}glossary/prism.html`,
        );
        assert.strictEqual(attributeOf(links[0] ?? details, "type"), "text/html");
        assert.strictEqual(textOf(links[0] ?? details), "glossary/prism.html");
      }),
  );

  it.effect("[A-15] an empty glossary card leaves the term plain", () =>
    Effect.gen(function* emptyCard() {
      const accepted = yield* acceptFixture();
      const html = yield* renderedHtml(accepted, glossaryOn);
      const beam = termNamed(rootOf(html), "beam");

      assert.deepStrictEqual(beam.attrs, {});
      assert.include(html, "<span>beam</span>");
      assert.lengthOf(disclosuresOf(rootOf(html)), 3);
    }),
  );

  it.effect("[A-15] the definitions are in the redacted copy only when the support is on", () =>
    Effect.gen(function* redactedCopy() {
      const accepted = yield* acceptFixture();
      const on = yield* Effect.fromResult(
        encodeRedacted(redact(accepted, undefined, undefined, { supports: glossaryOn })),
      );
      const off = yield* Effect.fromResult(encodeRedacted(redact(accepted)));
      const decoded = yield* Effect.fromResult(decodeRedacted(structuredClone(on)));
      const configuration = yield* configure({});
      const rendered = yield* Effect.fromResult(
        render(decoded, configuration, { assetBase, instance, supports: glossaryOn }),
      );

      for (const definition of [lensDefinition, mirrorDefinition, "glossary/prism.html"]) {
        assert.include(JSON.stringify(on), definition);
        assert.notInclude(JSON.stringify(off), definition);
        assert.include(rendered.html, definition);
      }

      assert.strictEqual(rendered.html, yield* renderedHtml(accepted, glossaryOn));
    }),
  );

  it.effect(
    "[A-15] the item with definitions passes checkTree, its ids are unique, and it round-trips",
    () =>
      Effect.gen(function* accessible() {
        const accepted = yield* acceptFixture();
        const root = rootOf(yield* renderedHtml(accepted, glossaryOn));
        const ids = idsOf(root);

        assert.lengthOf(disclosuresOf(root), 3);
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
        assert.strictEqual(new Set(ids).size, ids.length, "ids are unique");
        assert.isTrue(roundTrips(root), "the HTML round-trips");
      }),
  );

  it.effect(
    "[A-15] a catalog's cards of other supports stay in the listing, and a glossary card the disclosure presents does not",
    () =>
      Effect.gen(function* listed() {
        const accepted = yield* accepting(
          itemWith(
            '<p>A <span data-catalog-idref="g">lens</span> bends light.</p>',
            `<qti-catalog id="g">
               <qti-card support="glossary-on-screen"><qti-html-content><p>${lensDefinition}</p></qti-html-content></qti-card>
               <qti-card support="ext:pacing"><qti-html-content><p>Take a pause.</p></qti-html-content></qti-card>
             </qti-catalog>`,
          ),
        );
        const both: Supports = {
          ...noSupports,
          catalog: new Set(["ext:pacing", "glossary-on-screen"]),
        };
        const glossaryAlone = rootOf(yield* renderedHtml(accepted, glossaryOn));
        const withPacing = rootOf(yield* renderedHtml(accepted, both));
        const listings = elementsOf(withPacing.children).filter((element) =>
          Object.hasOwn(element.attrs, "data-catalog"),
        );
        const [listing] = listings;

        assert.lengthOf(disclosuresOf(glossaryAlone), 1);
        assert.lengthOf(
          elementsOf(glossaryAlone.children).filter((element) =>
            Object.hasOwn(element.attrs, "data-catalog"),
          ),
          0,
          "no listing holds the card the disclosure presents",
        );
        assert.lengthOf(disclosuresOf(withPacing), 1);
        assert.lengthOf(listings, 1);
        assert.deepStrictEqual(
          childrenOf(listing ?? withPacing).map((card) => attributeOf(card, "data-support")),
          ["ext:pacing"],
        );
        assert.notInclude(textOf(listing ?? withPacing), lensDefinition);
      }),
  );

  it.effect(
    "[A-15] two terms of one catalog each get their own disclosure, and an authored id is kept",
    () =>
      Effect.gen(function* twice() {
        const accepted = yield* accepting(
          itemWith(
            `<p>A <span id="first" data-catalog-idref="g">lens</span> here.</p>
             <p>A <span data-catalog-idref="g">lens</span> there.</p>`,
            `<qti-catalog id="g">
               <qti-card support="glossary-on-screen"><qti-html-content><p>${lensDefinition}</p></qti-html-content></qti-card>
             </qti-catalog>`,
          ),
        );
        const root = rootOf(yield* renderedHtml(accepted, glossaryOn));
        const [first, second] = termsOf(root);
        const ids = idsOf(root);

        assert.strictEqual(attributeOf(first ?? root, "id"), "q1--first");
        assert.strictEqual(attributeOf(second ?? root, "id"), "q1-catalog-g-0");
        assert.lengthOf(disclosuresOf(root), 2);
        assert.notStrictEqual(
          attributeOf(disclosureOf(root, first ?? root), "id"),
          attributeOf(disclosureOf(root, second ?? root), "id"),
        );
        assert.strictEqual(new Set(ids).size, ids.length, "ids are unique");
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[A-15] a reference inside a definition attaches nothing, so a definition that names its own term renders once",
    () =>
      Effect.gen(function* selfReferencing() {
        const accepted = yield* accepting(
          itemWith(
            '<p>A <span data-catalog-idref="a">lens</span> bends light.</p>',
            `<qti-catalog id="a">
               <qti-card support="glossary-on-screen"><qti-html-content><p>A <span data-catalog-idref="a">lens</span> and a <span data-catalog-idref="b">prism</span>.</p></qti-html-content></qti-card>
             </qti-catalog>
             <qti-catalog id="b">
               <qti-card support="glossary-on-screen"><qti-html-content><p>A <span data-catalog-idref="a">prism</span> is not a lens.</p></qti-html-content></qti-card>
             </qti-catalog>`,
          ),
        );
        const root = rootOf(yield* renderedHtml(accepted, glossaryOn));
        const [disclosure] = disclosuresOf(root);
        const inside = elementsOf(disclosure?.children ?? []).filter(
          (element) => element.tag === "span",
        );

        assert.lengthOf(disclosuresOf(root), 1);
        assert.lengthOf(inside, 2);
        for (const span of inside) {
          assert.deepStrictEqual(span.attrs, {});
        }
      }),
  );

  it.effect(
    "[A-15] a term inside a Choice's Prompt, where the emitter hands a presenter no element, leaves its definition in the listing, so no definition is dropped",
    () =>
      Effect.gen(function* inPrompt() {
        const accepted = yield* accepting(
          itemWith(
            "<p>Read the Choice.</p>",
            `<qti-catalog id="g">
               <qti-card support="glossary-on-screen"><qti-html-content><p>${lensDefinition}</p></qti-html-content></qti-card>
             </qti-catalog>`,
          ).replace(
            "<qti-prompt>Pick one.</qti-prompt>",
            '<qti-prompt>Pick the <span data-catalog-idref="g">lens</span>.</qti-prompt>',
          ),
        );
        const html = yield* renderedHtml(accepted, glossaryOn);
        const root = rootOf(html);
        const listing = elementsOf(root.children).find((element) =>
          Object.hasOwn(element.attrs, "data-catalog"),
        );
        const [disclosure] = disclosuresOf(root);

        assert.include(html, "<span>lens</span>");
        assert.lengthOf(disclosuresOf(root), 1);
        assert.isDefined(listing, "the definition is listed after the body");
        assert.include(textOf(listing ?? root), lensDefinition);
        assert.isUndefined(disclosure?.attrs["id"]);
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(root), "the HTML round-trips");
      }),
  );

  it.effect(
    "[A-15] a catalog named by a term in the body and by one in a Prompt is presented beside the body's term alone",
    () =>
      Effect.gen(function* both() {
        const accepted = yield* accepting(
          itemWith(
            '<p>A <span data-catalog-idref="g">lens</span> bends light.</p>',
            `<qti-catalog id="g">
               <qti-card support="glossary-on-screen"><qti-html-content><p>${lensDefinition}</p></qti-html-content></qti-card>
             </qti-catalog>`,
          ).replace(
            "<qti-prompt>Pick one.</qti-prompt>",
            '<qti-prompt>Pick the <span data-catalog-idref="g">lens</span>.</qti-prompt>',
          ),
        );
        const html = yield* renderedHtml(accepted, glossaryOn);
        const root = rootOf(html);

        assert.lengthOf(disclosuresOf(root), 1);
        assert.notInclude(html, "data-catalog=");
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
      }),
  );
});
