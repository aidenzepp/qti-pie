import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  acceptedItem,
  configure,
  decodeRedacted,
  encodeRedacted,
  open,
  redact,
  render,
} from "#plate/index.ts";
import type { Accepted, Element, Node, Redacted, Verdict } from "#plate/index.ts";
import { companionMaterialsModule } from "#plate/content/companion-materials.ts";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import { parseContextOf } from "#plate/model/item.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";

/**
 * Where the companion materials fixture sits under the package, which `open` takes as the
 * document's location.
 */
const fixtureLocation = "fixtures/m5/items/companion-materials.xml";

/**
 * Where an item with a single Choice and no companion materials sits under the package: the pin
 * that an item without the element renders no list.
 */
const choiceLocation = "fixtures/m2/items/p1-single-choice.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * The asset base every render here passes, with its closing slash.
 */
const assetBase = "/assets/";

/**
 * The heading level every render here is configured with, so a heading at the level the
 * configuration names is told from one at the default.
 */
const headingLevel = 3;

/**
 * The label the list carries, which the module owns (decision D7).
 */
const listLabel = "Materials you may use";

/**
 * The `data-slot` marker of the list's root, as the part table derives it.
 */
const slot = "companion-materials";

/**
 * A file href whose scheme the URL policy drops, test input the list must write with no link.
 */
// oxlint-disable-next-line eslint/no-script-url -- the value is test input the module must drop, never a URL this code navigates to.
const scriptUrl = "javascript:alert(1)";

/**
 * Read a fixture as a host reads a document from storage.
 *
 * @param location The fixture's location under the package.
 * @returns The fixture's bytes.
 */
const bytesOf = (location: string): Effect.Effect<Uint8Array> =>
  Effect.promise(() => readFile(path.resolve(import.meta.dirname, "..", "..", location)));

/**
 * Read a fixture as text, the form a variant of it is cut from.
 *
 * @param location The fixture's location under the package.
 * @returns The fixture's text.
 */
const textOfFixture = (location: string): Effect.Effect<string> =>
  Effect.map(bytesOf(location), (bytes) => new TextDecoder().decode(bytes));

/**
 * Take the accepted item out of a verdict, failing the test when the verdict accepts none.
 *
 * @param verdict The verdict.
 * @returns The accepted item.
 */
const acceptedOf = (verdict: Verdict): Accepted =>
  Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the document is ${verdict.verdict}, not accepted`),
  );

/**
 * Open the companion materials fixture and take its accepted item.
 *
 * @returns The accepted item and the verdict that gave it.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  const verdict = yield* open(fixtureLocation, yield* bytesOf(fixtureLocation));

  return { accepted: acceptedOf(verdict), verdict };
});

/**
 * Open a variant of the fixture, one `from` replaced by `to`.
 *
 * @param from The text of the fixture to replace, which must occur in it.
 * @param to What takes its place.
 * @returns The verdict on the variant.
 */
const openVariant = Effect.fnUntraced(function* openVariant(from: string, to: string) {
  const source = yield* textOfFixture(fixtureLocation);
  assert.include(source, from, "the fixture holds the text the variant replaces");

  return yield* open(fixtureLocation, new TextEncoder().encode(source.replace(from, to)));
});

/**
 * Redact the accepted item and render it with the heading level, the fixed instance token and the
 * asset base, as a host does for one candidate.
 *
 * @param accepted The accepted item.
 * @returns The HTML the render wrote.
 */
const renderedHtml = Effect.fnUntraced(function* renderedHtml(accepted: Accepted) {
  const configuration = yield* configure({ headingLevel });
  const rendered = yield* Effect.fromResult(
    render(redact(accepted), configuration, { assetBase, instance }),
  );

  return rendered.html;
});

/**
 * Write a redacted item as the JSON text a host sends to a page.
 *
 * @param redacted The redacted item.
 * @returns The JSON text.
 */
const jsonOf = Effect.fnUntraced(function* jsonOf(redacted: Redacted) {
  return JSON.stringify(yield* Effect.fromResult(encodeRedacted(redacted)));
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
 * Give the position of a Root child among the Root's children: the index of the child that is or
 * holds the element.
 *
 * @param root The Root.
 * @param element The element.
 * @returns The index, or -1 when no child holds it.
 */
const positionIn = (root: Element, element: Element): number =>
  root.children.findIndex(
    (child) =>
      child.kind === "element" && (child === element || elementsOf([child]).includes(element)),
  );

/**
 * Find the Root child that carries a `data-slot`, failing when there is not exactly one.
 *
 * @param root The Root.
 * @param marker The marker.
 * @returns The child.
 */
const childSlotted = (root: Element, marker: string): Element => {
  const found = childrenOf(root).filter((child) => child.attrs["data-slot"] === marker);
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one Root child marked ${marker}, found ${found.length}`);
};

/**
 * Find the list the page holds: the one `aside` of the companion materials and its one `ul`.
 *
 * @param root The page's Root element.
 * @returns The list's items, in document order.
 */
const itemsOf = (root: Element): readonly Element[] => {
  const aside = childSlotted(root, slot);
  const [list, ...rest] = childrenOf(aside).filter((child) => child.tag === "ul");
  assert.lengthOf(rest, 0, "the aside holds one list");

  return list === undefined ? assert.fail("the aside holds no list") : childrenOf(list);
};

/**
 * Find the one list item of a kind of material.
 *
 * @param root The page's Root element.
 * @param material The `data-material` value.
 * @returns The item.
 */
const itemOf = (root: Element, material: string): Element => {
  const found = itemsOf(root).filter((item) => item.attrs["data-material"] === material);
  const [only, ...rest] = found;

  return only !== undefined && rest.length === 0
    ? only
    : assert.fail(`expected exactly one ${material} item, found ${found.length}`);
};

/**
 * Render the fixture and give the one list item of a kind of material.
 *
 * @param material The `data-material` value.
 * @returns The item.
 */
const renderedItem = Effect.fnUntraced(function* renderedItem(material: string) {
  const { accepted } = yield* acceptFixture();

  return itemOf(rootOf(yield* renderedHtml(accepted)), material);
});

/**
 * Parse a companion materials element as the item root's walk hands it to the module, its marks
 * recorded.
 *
 * @param element The element.
 * @returns The module's result and the features its marks named.
 */
const parsed = (element: SourceElement) => {
  const marked: string[] = [];
  const { context } = parseContextOf(
    doc(
      "items/test.xml",
      el(
        "qti-assessment-item",
        [attr("identifier", "item"), attr("title", "Item")],
        [element, el("qti-item-body", [], [])],
      ),
    ),
    element,
  );
  const result = companionMaterialsModule.parse(element, {
    catalogReferences: [],
    mark: (feature) => {
      marked.push(feature);

      return Result.succeed(Option.none());
    },
    path: context.path,
    read: context.read,
  });

  return { marked, result };
};

describe("I-13: companion materials, listed after the body with data attributes for the host", () => {
  it.effect(
    "[I-13] an item holding companion materials opens without the qti-companion-materials-info mark",
    () =>
      Effect.gen(function* accepts() {
        const { accepted, verdict } = yield* acceptFixture();

        assert.strictEqual(verdict.verdict, "accepted");
        assert.deepStrictEqual(
          accepted.unsupported.filter(({ feature }) => feature === "qti-companion-materials-info"),
          [],
        );
      }),
  );

  it.effect("[I-13] the materials render after the body as a labelled list", () =>
    Effect.gen(function* labelled() {
      const { accepted } = yield* acceptFixture();
      const root = rootOf(yield* renderedHtml(accepted));
      const aside = childSlotted(root, slot);
      const choice = childSlotted(root, "choice-interaction");
      const live = childSlotted(root, "item-live");
      const [heading, list, ...rest] = childrenOf(aside);

      assert.strictEqual(aside.tag, "aside");
      assert.isAbove(positionIn(root, aside), positionIn(root, choice));
      assert.isBelow(positionIn(root, aside), positionIn(root, live));
      assert.strictEqual(aside.attrs["aria-label"], listLabel);
      assert.lengthOf(rest, 0, "the aside holds a heading and a list");
      assert.strictEqual(heading?.tag, `h${headingLevel}`);
      assert.strictEqual(textOf(heading ?? aside), listLabel);
      assert.isString(heading?.attrs["id"]);
      assert.strictEqual(aside.attrs["aria-labelledby"], heading?.attrs["id"]);
      assert.strictEqual(list?.tag, "ul");
      assert.deepStrictEqual(
        itemsOf(root).map((item) => [item.tag, item.attrs["data-material"]]),
        [
          ["li", "calculator"],
          ["li", "rule"],
          ["li", "protractor"],
          ["li", "digital"],
          ["li", "physical"],
        ],
      );
    }),
  );

  it.effect("[I-13] the calculator carries its type for the host", () =>
    Effect.gen(function* calculator() {
      const item = yield* renderedItem("calculator");

      assert.deepStrictEqual(item.attrs, {
        "data-calculator-type": "scientific",
        "data-material": "calculator",
      });
      assert.strictEqual(
        textOf(item),
        "Scientific calculator: A scientific calculator with trigonometric keys",
      );
    }),
  );

  it.effect("[I-13] the rule lists its system, minimum length and increments with units", () =>
    Effect.gen(function* rule() {
      const item = yield* renderedItem("rule");
      const written = textOf(item);

      assert.deepStrictEqual(item.attrs, {
        "data-major-increment": "1",
        "data-major-unit": "Centimeter",
        "data-material": "rule",
        "data-minimum-length": "30",
        "data-minor-increment": "1",
        "data-minor-unit": "Millimeter",
        "data-system": "si",
      });
      assert.include(written, "A metric ruler for measuring the desk");
      assert.include(written, "30");
      assert.include(written, "1 Millimeter");
      assert.include(written, "1 Centimeter");
    }),
  );

  it.effect("[I-13] the protractor lists its system and increment", () =>
    Effect.gen(function* protractor() {
      const item = yield* renderedItem("protractor");
      const written = textOf(item);

      assert.deepStrictEqual(item.attrs, {
        "data-major-increment": "1",
        "data-major-unit": "Degree",
        "data-material": "protractor",
        "data-system": "us",
      });
      assert.include(written, "A protractor for measuring the corner");
      assert.include(written, "1 Degree");
    }),
  );

  it.effect(
    "[I-13] the digital material is a link to its package file through the asset base",
    () =>
      Effect.gen(function* digital() {
        const item = yield* renderedItem("digital");
        const [link, ...rest] = childrenOf(item);
        const [icon, ...others] = childrenOf(link ?? item);

        assert.deepStrictEqual(item.attrs, { "data-material": "digital" });
        assert.lengthOf(rest, 0, "the item holds the link alone");
        assert.strictEqual(link?.tag, "a");
        assert.strictEqual(link?.attrs["href"], "/assets/materials/table.pdf");
        assert.strictEqual(link?.attrs["type"], "application/pdf");
        assert.strictEqual(textOf(item), "Table of conversions");
        assert.lengthOf(others, 0);
        assert.strictEqual(icon?.tag, "img");
        assert.strictEqual(icon?.attrs["alt"], "");
        assert.strictEqual(icon?.attrs["src"], "/assets/materials/table-icon.png");
        assert.strictEqual(link?.children[0], icon, "the icon comes before the text");
      }),
  );

  it.effect("[I-13] the physical material renders its text", () =>
    Effect.gen(function* physical() {
      const item = yield* renderedItem("physical");

      assert.deepStrictEqual(item.attrs, { "data-material": "physical" });
      assert.strictEqual(textOf(item), "A sheet of squared paper");
    }),
  );

  it.effect("[I-13] an item without companion materials renders no aside", () =>
    Effect.gen(function* absent() {
      const verdict = yield* open(choiceLocation, yield* bytesOf(choiceLocation));
      const html = yield* renderedHtml(acceptedOf(verdict));

      assert.notInclude(html, `data-slot="${slot}"`);
      assert.notInclude(html, "<aside");
    }),
  );

  it.effect("[I-13] a digital material without a label is linked by its file's name", () =>
    Effect.gen(function* unlabelled() {
      const verdict = yield* openVariant(' label="Table of conversions"', "");
      const item = itemOf(rootOf(yield* renderedHtml(acceptedOf(verdict))), "digital");

      assert.strictEqual(textOf(item), "table.pdf");
    }),
  );

  it.effect("[I-13] a calculator's file info is a link after the calculator's text", () =>
    Effect.gen(function* info() {
      const verdict = yield* openVariant(
        "</qti-calculator>",
        '<qti-calculator-info mime-type="text/html" label="Key guide">' +
          "<qti-file-href>materials/keys.html</qti-file-href></qti-calculator-info></qti-calculator>",
      );
      const item = itemOf(rootOf(yield* renderedHtml(acceptedOf(verdict))), "calculator");
      const [link, ...rest] = childrenOf(item);

      assert.lengthOf(rest, 0);
      assert.strictEqual(link?.tag, "a");
      assert.strictEqual(link?.attrs["href"], "/assets/materials/keys.html");
      assert.strictEqual(link?.attrs["type"], "text/html");
      assert.strictEqual(textOf(link ?? item), "Key guide");
      assert.isTrue(
        textOf(item).startsWith("Scientific calculator: A scientific calculator"),
        "the text comes before the link",
      );
      assert.strictEqual(item.children.at(-1), link, "the link ends the item");
    }),
  );

  it.effect("[I-13] a file outside the package or the allowed schemes is listed with no link", () =>
    Effect.gen(function* outside() {
      const remote = yield* openVariant("materials/table.pdf", "https://files.example/table.pdf");
      const unsafe = yield* openVariant("materials/table.pdf", scriptUrl);
      const [remoteLink] = childrenOf(
        itemOf(rootOf(yield* renderedHtml(acceptedOf(remote))), "digital"),
      );
      const unsafeItem = itemOf(rootOf(yield* renderedHtml(acceptedOf(unsafe))), "digital");
      const [unsafeLink] = childrenOf(unsafeItem);

      assert.strictEqual(remoteLink?.attrs["href"], "https://files.example/table.pdf");
      assert.strictEqual(unsafeLink?.tag, "a");
      assert.notProperty(unsafeLink?.attrs ?? {}, "href");
      assert.strictEqual(textOf(unsafeItem), "Table of conversions");
    }),
  );

  it.effect("[I-13] a material's text is written as text, never as markup", () =>
    Effect.gen(function* escaped() {
      const verdict = yield* openVariant(
        "A sheet of squared paper",
        "&lt;b&gt;Paper&lt;/b&gt; &amp; pencil",
      );
      const root = rootOf(yield* renderedHtml(acceptedOf(verdict)));
      const item = itemOf(root, "physical");

      assert.strictEqual(textOf(item), "<b>Paper</b> & pencil");
      assert.lengthOf(childrenOf(item), 0);
    }),
  );

  it.effect("[I-13] an item whose companion materials list nothing renders no aside", () =>
    Effect.gen(function* empty() {
      const source = yield* textOfFixture(fixtureLocation);
      const emptied = source.replace(
        /<qti-companion-materials-info>[\s\S]*<\/qti-companion-materials-info>/u,
        "<qti-companion-materials-info/>",
      );
      assert.notStrictEqual(emptied, source);

      const verdict = yield* open(fixtureLocation, new TextEncoder().encode(emptied));
      const accepted = acceptedOf(verdict);
      const html = yield* renderedHtml(accepted);

      assert.strictEqual(verdict.verdict, "accepted");
      assert.notInclude(html, `data-slot="${slot}"`);
      assert.isFalse("content" in redact(accepted));
    }),
  );

  it.effect(
    "[I-13] an extension element inside leaves the verdict to its own island and the module marks nothing",
    () =>
      Effect.gen(function* extension() {
        const verdict = yield* openVariant(
          "</qti-companion-materials-info>",
          '<xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="more.xml"/></qti-companion-materials-info>',
        );

        assert.strictEqual(verdict.verdict, "unchecked");
        assert.deepStrictEqual(
          verdict.verdict === "unchecked" ? verdict.reasons.map(({ reason }) => reason) : [],
          ["xinclude"],
        );
      }),
  );

  it("[I-13] the module ignores an extension element among the materials and marks nothing", () => {
    const { marked, result } = parsed(
      el(
        "qti-companion-materials-info",
        [],
        [
          el("qti-physical-material", [], [text("Squared paper")]),
          el("widget", [], [text("ignored")], "urn:example:extension"),
          el("qti-physical-material", [], [text("A pencil")]),
        ],
      ),
    );
    const node = Result.getOrThrow(result);

    assert.deepStrictEqual(marked, []);
    assert.isTrue(Option.isSome(node));
    assert.deepStrictEqual(
      node.pipe(Option.map(({ materials }) => materials.map((material) => material.kind))),
      Option.some(["physical", "physical"]),
    );
  });

  it.effect("[I-13] the redacted value round-trips with the materials", () =>
    Effect.gen(function* codec() {
      const { accepted } = yield* acceptFixture();
      const configuration = yield* configure({ headingLevel });
      const redacted = redact(accepted);
      const json = yield* jsonOf(redacted);
      const restored = yield* Effect.fromResult(decodeRedacted(JSON.parse(json)));
      const options = { assetBase, instance };
      const direct = yield* Effect.fromResult(render(redacted, configuration, options));
      const stored = yield* Effect.fromResult(render(restored, configuration, options));

      assert.include(json, "A sheet of squared paper");
      assert.include(json, "materials/table.pdf");
      assert.strictEqual(stored.html, direct.html);
      assert.include(direct.html, "A sheet of squared paper");
    }),
  );

  it.effect("[I-13] a replacement for the list's root keeps its children and its marker", () =>
    Effect.gen(function* swapped() {
      const { accepted } = yield* acceptFixture();
      const configuration = yield* configure({ headingLevel });
      const rendered = yield* Effect.fromResult(
        render(redact(accepted), configuration, {
          assetBase,
          instance,
          parts: {
            "companion-materials": { root: (props, children) => h("section", props, children) },
          },
        }),
      );
      const section = childSlotted(rootOf(rendered.html), slot);

      assert.strictEqual(section.tag, "section");
      assert.strictEqual(section.attrs["aria-label"], listLabel);
      assert.lengthOf(itemsOf(rootOf(rendered.html)), 5);
    }),
  );

  it.effect("[I-13] the item with its list passes checkTree and round-trips", () =>
    Effect.gen(function* accessible() {
      const { accepted } = yield* acceptFixture();
      const root = rootOf(yield* renderedHtml(accepted));
      const ids = elementsOf([root]).flatMap((element) =>
        Object.hasOwn(element.attrs, "id") ? [String(element.attrs["id"])] : [],
      );

      assert.lengthOf(itemsOf(root), 5);
      assert.deepStrictEqual(checkTree(root, { baseLevel: headingLevel }), []);
      assert.strictEqual(new Set(ids).size, ids.length, "ids are unique");
      assert.isTrue(roundTrips(root), "the HTML round-trips");
    }),
  );
});
