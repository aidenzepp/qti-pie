import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { MathNode } from "#plate/content/mathml.ts";
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
import type { BodyNode } from "#plate/model/item.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";

/**
 * Where the MathML fixture sits under the package, which `open` takes as the document's location.
 */
const fixtureLocation = "fixtures/m3e/items/mathml.xml";

/**
 * The instance token every render here passes, so two renders of equal items give equal HTML.
 */
const instance = "q1";

/**
 * Read the MathML fixture's text as a host reads a document from storage.
 */
const fixtureText: Effect.Effect<string> = Effect.promise(() =>
  readFile(path.resolve(import.meta.dirname, "..", "..", fixtureLocation), "utf-8"),
);

/**
 * Open a document from its text, as a host opens one it read from storage.
 *
 * @param xml The document's text.
 * @returns The verdict on it.
 */
const openText = (xml: string): Effect.Effect<Verdict> =>
  open(fixtureLocation, new TextEncoder().encode(xml));

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
 * Open the MathML fixture and take its accepted item.
 *
 * @returns The accepted item and the verdict that gave it.
 */
const acceptFixture = Effect.fnUntraced(function* acceptFixture() {
  const verdict = yield* openText(yield* fixtureText);

  return { accepted: acceptedOf(verdict), verdict };
});

/**
 * Open the fixture with the block formula's `separators=",;"` rewritten, so one fixture gives the
 * other spellings section 3.3.8 of MathML 3 defines.
 *
 * @param separators The `separators` attribute as rewritten, the whole `name="value"`.
 * @returns The accepted item.
 */
const acceptRewritten = Effect.fnUntraced(function* acceptRewritten(separators: string) {
  const original = yield* fixtureText;
  const marker = 'separators=",;"';
  assert.include(original, marker, "the fixture writes the separators the helper rewrites");

  return acceptedOf(yield* openText(original.replace(marker, separators)));
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
 * Redact an accepted item and render it with the default configuration and the fixed instance
 * token, as a host does for one candidate.
 *
 * @param accepted The accepted item.
 * @returns The page's HTML and its Root element.
 */
const rendered = Effect.fnUntraced(function* rendered(accepted: Accepted) {
  const configuration = yield* configure({});
  const page = yield* Effect.fromResult(render(redact(accepted), configuration, { instance }));

  return { html: page.html, root: rootOf(page.html) };
});

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
 * Join the text an element holds, at any depth, as written.
 *
 * @param element The element.
 * @returns Its text content.
 */
const textOf = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.text : textOf(child))).join("");

/**
 * Find every element of one tag below a root.
 *
 * @param root The root.
 * @param tag The tag.
 * @returns The elements with that tag, in document order.
 */
const byTag = (root: Element, tag: string): readonly Element[] =>
  elementsOf(root.children).filter((element) => element.tag === tag);

/**
 * The fixture's `math` elements, in document order, by what each holds.
 */
const formulas = {
  alttext: 5,
  block: 1,
  hexdouble: 6,
  inline: 0,
  insideRtlParagraph: 3,
  rtl: 2,
  semantics: 4,
} as const;

/**
 * Pick one of the fixture's `math` elements from a rendered page, failing the test when the page
 * does not render all eight.
 *
 * @param root The page's Root element.
 * @param which The formula.
 * @returns Its `math` element.
 */
const formulaOf = (root: Element, which: keyof typeof formulas): Element => {
  const maths = byTag(root, "math");
  assert.lengthOf(maths, 8, "the fixture's eight formulas render");

  const math = maths[formulas[which]];

  return math ?? assert.fail(`the ${which} formula renders`);
};

/**
 * Write an element's subtree compactly: the tag, its attributes in name order as `name=value`,
 * and its element children and non-blank text in order, so a test asserts a MathML tree in one
 * line.
 *
 * @param element The element.
 * @returns The outline.
 */
const outline = (element: Element): string => {
  const attributes = Object.entries(element.attrs)
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}=${value === true ? "" : value}`)
    .join(",");
  const children = element.children
    .flatMap((child) => {
      if (child.kind === "element") {
        return [outline(child)];
      }

      return child.text.trim() === "" ? [] : [child.text];
    })
    .join(" ");

  return `${element.tag}${attributes === "" ? "" : `[${attributes}]`}{${children}}`;
};

/**
 * The outline of a fence operator.
 *
 * @param character The fence character.
 * @returns The outline of its `mo`.
 */
const fence = (character: string): string => `mo[fence=true]{${character}}`;

/**
 * The outline of a separator operator.
 *
 * @param character The separator character.
 * @returns The outline of its `mo`.
 */
const separator = (character: string): string => `mo[separator=true]{${character}}`;

/**
 * The outline of an `mi`.
 *
 * @param name The identifier.
 * @returns The outline.
 */
const mi = (name: string): string => `mi{${name}}`;

/**
 * Collect the `math` content nodes of a redacted item's body, at any depth, in document order.
 *
 * @param nodes The body nodes.
 * @returns Each `math` node with its path.
 */
const mathNodesOf = (
  nodes: readonly BodyNode[],
): readonly { readonly node: MathNode; readonly path: string }[] =>
  nodes.flatMap((node) => {
    if (node.kind === "content" && node.element === "math") {
      return [{ node: node.node, path: node.path }];
    }

    if (node.kind === "element") {
      return mathNodesOf(node.children);
    }

    return [];
  });

/**
 * Take a redacted item through the codec: encoded to JSON, written and read as text, decoded.
 *
 * @param item The redacted item.
 * @returns The JSON text written and the item decoded from it.
 */
const throughCodec = Effect.fnUntraced(function* throughCodec(item: Redacted) {
  const json = JSON.stringify(yield* Effect.fromResult(encodeRedacted(item)));
  const decoded = yield* Effect.fromResult(decodeRedacted(JSON.parse(json)));

  return { decoded, json };
});

describe("I-18: MathML in the item body", () => {
  it.effect("[I-18] open accepts the MathML fixture as checked", () =>
    Effect.gen(function* accepts() {
      const { accepted, verdict } = yield* acceptFixture();

      assert.strictEqual(verdict.verdict, "accepted");
      assert.deepStrictEqual(
        accepted.unsupported.filter(({ feature }) => feature.includes("math")),
        [],
        "no math element is a notice or a mark",
      );
    }),
  );

  it.effect("[I-18] an inline math renders as a math element in place", () =>
    Effect.gen(function* inline() {
      const { accepted } = yield* acceptFixture();
      const { root } = yield* rendered(accepted);
      const math = formulaOf(root, "inline");
      const [paragraph] = byTag(root, "p");

      assert.isDefined(paragraph);
      assert.include(childrenOf(paragraph), math, "the first paragraph holds the formula");
      assert.strictEqual(
        outline(math),
        "math[dir=ltr]{mi{P} mo{=} msup{mi{d} mn{2}}}",
        "the mi, mo, mn and msup keep their order and their text",
      );
    }),
  );

  it.effect('[I-18] a block math keeps display="block"', () =>
    Effect.gen(function* block() {
      const { accepted } = yield* acceptFixture();
      const { root } = yield* rendered(accepted);

      assert.strictEqual(formulaOf(root, "block").attrs["display"], "block");
    }),
  );

  it.effect("[I-18] mfenced is rewritten into mrow with fence and separator operators", () =>
    Effect.gen(function* fenced() {
      const { accepted } = yield* acceptFixture();
      const { html, root } = yield* rendered(accepted);
      const [first] = childrenOf(formulaOf(root, "block"));

      assert.isDefined(first);
      assert.strictEqual(
        outline(first),
        `mrow{${fence("(")} mrow{${mi("a")} ${separator(",")} ${mi("b")} ${separator(";")} ${mi("c")}} ${fence(")")}}`,
      );
      assert.notInclude(html, "mfenced");
      assert.lengthOf(byTag(root, "mfenced"), 0);
    }),
  );

  it.effect(
    "[I-18] mfenced's defaults and an empty separators attribute follow section 3.3.8",
    () =>
      Effect.gen(function* defaults() {
        const { accepted } = yield* acceptFixture();
        const { root } = yield* rendered(accepted);
        const nested = childrenOf(formulaOf(root, "block")).at(2);

        assert.isDefined(nested);
        assert.strictEqual(
          outline(nested),
          `mrow{mrow{${fence("(")} mrow{${mi("x")} ${separator(",")} ${mi("y")}} ${fence(")")}}}`,
          "no attributes: ( and ) fence the arguments, separated by ,",
        );

        const [empty] = childrenOf(
          formulaOf((yield* rendered(yield* acceptRewritten('separators=""'))).root, "block"),
        );

        assert.isDefined(empty);
        assert.strictEqual(
          outline(empty),
          `mrow{${fence("(")} mrow{${mi("a")} ${mi("b")} ${mi("c")}} ${fence(")")}}`,
          "an empty separators attribute inserts no separator",
        );

        const [repeated] = childrenOf(
          formulaOf((yield* rendered(yield* acceptRewritten('separators=" ; "'))).root, "block"),
        );

        assert.isDefined(repeated);
        assert.strictEqual(
          outline(repeated),
          `mrow{${fence("(")} mrow{${mi("a")} ${separator(";")} ${mi("b")} ${separator(";")} ${mi("c")}} ${fence(")")}}`,
          "the last separator repeats for further children, and white space is ignored",
        );
      }),
  );

  it.effect("[I-18] a math writes its own direction, ltr unless it writes rtl", () =>
    Effect.gen(function* direction() {
      const { accepted } = yield* acceptFixture();
      const { root } = yield* rendered(accepted);
      const inside = formulaOf(root, "insideRtlParagraph");
      const paragraph = byTag(root, "p").find((p) => childrenOf(p).includes(inside));

      assert.strictEqual(formulaOf(root, "rtl").attrs["dir"], "rtl");
      assert.strictEqual(inside.attrs["dir"], "ltr");
      assert.strictEqual(paragraph?.attrs["dir"], "rtl", "the paragraph around it stays rtl");
      assert.deepStrictEqual(
        byTag(root, "math").map((math) => math.attrs["dir"]),
        ["ltr", "ltr", "rtl", "ltr", "ltr", "ltr", "ltr", "ltr"],
      );
    }),
  );

  it.effect("[I-18] semantics keeps its first child and its annotations", () =>
    Effect.gen(function* semantics() {
      const { accepted } = yield* acceptFixture();
      const { root } = yield* rendered(accepted);
      const [wrapper] = childrenOf(formulaOf(root, "semantics"));

      assert.isDefined(wrapper);
      assert.strictEqual(wrapper.tag, "semantics");

      const [presentation, annotation, annotationXml] = childrenOf(wrapper);

      assert.isDefined(presentation);
      assert.isDefined(annotation);
      assert.isDefined(annotationXml);
      assert.strictEqual(outline(presentation), "mfrac{mn{1} mn{2}}");
      assert.strictEqual(
        outline(annotation),
        String.raw`annotation[encoding=application/x-tex]{\frac{1}{2}}`,
      );
      assert.strictEqual(annotationXml.tag, "annotation-xml");
      assert.strictEqual(annotationXml.attrs["encoding"], "application/xhtml+xml");
      assert.deepStrictEqual(
        childrenOf(annotationXml).map(outline),
        ["p{one half}"],
        "the paragraph inside is emitted as body content",
      );
    }),
  );

  it.effect("[I-18] alttext is kept as written and no aria-label is added", () =>
    Effect.gen(function* alttext() {
      const { accepted } = yield* acceptFixture();
      const { root } = yield* rendered(accepted);

      assert.strictEqual(formulaOf(root, "alttext").attrs["alttext"], "x squared");
      for (const math of byTag(root, "math")) {
        assert.isFalse(Object.hasOwn(math.attrs, "aria-label"), outline(math));
      }
    }),
  );

  it.effect("[I-18] a hexdouble cn keeps its digits as written", () =>
    Effect.gen(function* hexdouble() {
      const { accepted } = yield* acceptFixture();
      const { root } = yield* rendered(accepted);
      const [cn] = childrenOf(formulaOf(root, "hexdouble"));

      assert.isDefined(cn);
      assert.strictEqual(outline(cn), "cn[type=hexdouble]{7ff0000000000000}");
      assert.strictEqual(textOf(cn), "7ff0000000000000");
    }),
  );

  it.effect("[I-18] a math inside a redacted item carries no path and holds no QTI-only data", () =>
    Effect.gen(function* redacted() {
      const { accepted } = yield* acceptFixture();
      const { decoded, json } = yield* throughCodec(redact(accepted));
      const maths = mathNodesOf(decoded.body);

      assert.lengthOf(maths, 8);
      assert.deepStrictEqual(
        maths.map((math) => math.path),
        Array.from({ length: 8 }, () => ""),
      );
      assert.deepStrictEqual(
        maths.map(({ node }) => node.attributes),
        [
          [],
          [{ name: "display", value: "block" }],
          [{ name: "dir", value: "rtl" }],
          [],
          [],
          [{ name: "alttext", value: "x squared" }],
          [],
          [],
        ],
        "the attributes are the ones the source wrote: no dir is added, no aria-label",
      );
      assert.notInclude(json, "aria-label");
      assert.notInclude(json, "mfenced");
      assert.notInclude(json, "qti-item-body/", "no path reaches the JSON");
    }),
  );

  it.effect(
    "[I-18] the item with MathML passes checkTree, round-trips and survives the codec",
    () =>
      Effect.gen(function* survives() {
        const { accepted } = yield* acceptFixture();
        const configuration = yield* configure({});
        const item = redact(accepted);
        const direct = yield* Effect.fromResult(render(item, configuration, { instance }));
        const { decoded } = yield* throughCodec(item);
        const stored = yield* Effect.fromResult(render(decoded, configuration, { instance }));
        const root = rootOf(direct.html);

        assert.lengthOf(byTag(root, "math"), 8);
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(root), "the HTML parser reads math into the MathML namespace");
        assert.strictEqual(stored.html, direct.html);
      }),
  );
});
