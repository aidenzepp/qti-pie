import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { modelFinding } from "#pantry/import/guards/mathml.ts";
import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import {
  annotationXmlBlock,
  contentHandles,
  mathmlBlocks,
  presentationHandles,
} from "#pantry/test/mathml-blocks.ts";
import type { MathmlBlock } from "#pantry/test/mathml-blocks.ts";

const mathmlNamespace = "http://www.w3.org/1998/Math/MathML";

const qtiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Parse a block's fragment inside a wrapper element that declares the two namespaces it uses.
 *
 * @param block - The block.
 * @returns The wrapper element, whose children are the fragment.
 */
const parseBlock = Effect.fn("test.mathmlBlocks.parse")(function* parseBlock(block: MathmlBlock) {
  const text = `<w xmlns="${qtiNamespace}" xmlns:m="${mathmlNamespace}">${block.xml}</w>`;
  const document = yield* readXml(new TextEncoder().encode(text));

  return document.root;
});

/**
 * One element of a parsed block with its parent and its handle: `m:` and its local name, except for
 * the `m:semantics` of an `m:bvar` or of another `m:semantics.ci`, which is the kind
 * `m:semantics.ci`.
 */
interface Found {
  readonly element: Element;
  readonly handle: string;
  readonly parent: Element | undefined;
}

/**
 * Every element under a root, the root included, in document order, each with its parent and
 * handle.
 *
 * @param root - The root element.
 * @param parent - The root's parent, when the root is not the fragment's own.
 * @param parentHandle - The parent's handle.
 * @returns The elements.
 */
const walk = (root: Element, parent?: Element, parentHandle?: string): readonly Found[] => {
  const handle =
    root.local === "semantics" && (parentHandle === "m:bvar" || parentHandle === "m:semantics.ci")
      ? "m:semantics.ci"
      : `m:${root.local}`;

  return [
    { element: root, handle, parent },
    ...root.children.flatMap((child) =>
      child.kind === "element" ? walk(child, root, handle) : [],
    ),
  ];
};

/**
 * Whether an element is in the MathML namespace.
 *
 * @param element - The element.
 * @returns True for a MathML element.
 */
const isMathml = (element: Element): boolean => element.namespace === mathmlNamespace;

/**
 * The content-model findings of a block: each MathML element whose element children break its
 * kind's model, and the non-local rule of `m:mglyph` (its `src` and `alt`).
 *
 * @param block - The block.
 * @returns One entry per fault, none when the block passes.
 */
const findingsOf = Effect.fn("test.mathmlBlocks.findings")(function* findingsOf(
  block: MathmlBlock,
) {
  const root = yield* parseBlock(block);
  const found = walk(root).filter(({ element }) => isMathml(element));
  const handles = new Map(found.map(({ element, handle }) => [element, handle]));
  const faults: string[] = [];

  for (const { element, handle } of found) {
    const finding = modelFinding(
      handle,
      element.children.flatMap((child) =>
        child.kind === "element" ? [handles.get(child) ?? `m:${child.local}`] : [],
      ),
    );

    if (finding !== undefined) {
      faults.push(`${handle}: ${finding}`);
    }

    if (element.local === "mglyph") {
      const names = new Set(element.attributes.map((attribute) => attribute.local));

      if (!names.has("src") || !names.has("alt")) {
        faults.push(`${handle}: src and alt`);
      }
    }
  }

  return faults;
});

const hostEntries = Object.values(inventory).filter((entry) =>
  entry.children.some((child) => child.name === "m3:math"),
);

const kindBlocks = mathmlBlocks.filter((block) => block.part === "kind");

const presentationBlocks = kindBlocks.filter((block) =>
  presentationHandles.includes(`m:${block.name.slice("kind-".length)}`),
);

const contentBlocks = kindBlocks.filter((block) => !presentationBlocks.includes(block));

const hostBlocks = mathmlBlocks.filter((block) => block.part === "host");

describe("the host, presentation and content coverage blocks", () => {
  it("has unique names and writes only host and kind blocks for a 3.0.0 item", () => {
    const names = mathmlBlocks.map((block) => block.name);

    assert.strictEqual(new Set(names).size, names.length);
    assert.isTrue(mathmlBlocks.every((block) => block.part === "host" || block.part === "kind"));
    assert.isTrue(mathmlBlocks.every((block) => block.version === "3.0.0"));
    assert.strictEqual(hostBlocks.length, 63);
    assert.strictEqual(presentationBlocks.length, 43);
    assert.strictEqual(kindBlocks.length, 193);
  });

  it("puts m:math under every roster host the composed inventory names", () => {
    assert.strictEqual(hostEntries.length, 63);

    const covered = new Set(hostBlocks.map((block) => block.handles[0]));

    assert.deepStrictEqual(
      hostEntries.map((entry) => entry.handle).filter((handle) => !covered.has(handle)),
      [],
    );
    assert.strictEqual(covered.size, hostBlocks.length);
  });

  it("covers every presentation handle in some kind block", () => {
    const covered = new Set(kindBlocks.flatMap((block) => block.handles));

    assert.strictEqual(presentationHandles.length, 43);
    assert.deepStrictEqual(
      presentationHandles.filter((handle) => !covered.has(handle)),
      [],
    );
    assert.isTrue(presentationHandles.every((handle) => handle in mathmlInventory));
    assert.isFalse(presentationHandles.includes("m:annotation-xml"));
  });

  for (const block of mathmlBlocks) {
    it.effect(`${block.name} parses and says what it holds`, () =>
      Effect.gen(function* checkBlock() {
        const root = yield* parseBlock(block);
        const found = walk(root).filter(({ element }) => isMathml(element));
        const handles = [...new Set(found.map(({ handle }) => handle))];
        const pairs = new Set(
          found.flatMap(({ element, handle }) =>
            element.attributes
              .filter((attribute) => attribute.namespace === "")
              .map((attribute) => `${handle} ${attribute.local}`),
          ),
        );
        const claimed = block.handles.filter((handle) => handle in mathmlInventory);

        assert.deepStrictEqual(new Set(claimed), new Set(handles));
        assert.deepStrictEqual(new Set(block.pairs.map((pair) => pair.join(" "))), pairs);
        assert.isTrue(handles.every((handle) => handle in mathmlInventory));
      }),
    );

    it.effect(`${block.name} passes the MathML content models`, () =>
      Effect.gen(function* checkModels() {
        assert.deepStrictEqual(yield* findingsOf(block), []);
      }),
    );
  }

  it("covers every leaf handle but m:annotation-xml in some kind block", () => {
    const covered = new Set(kindBlocks.flatMap((block) => block.handles));
    const leaf = Object.keys(mathmlInventory).filter((handle) => handle !== "m:annotation-xml");

    assert.strictEqual(contentHandles.length, 150);
    assert.strictEqual(contentBlocks.length, 150);
    assert.deepStrictEqual(
      leaf.filter((handle) => !covered.has(handle)),
      [],
    );
    assert.deepStrictEqual([...presentationHandles, ...contentHandles].toSorted(), leaf.toSorted());
    assert.isTrue(
      contentBlocks.every((block) =>
        contentHandles.some((handle) => block.handles.includes(handle)),
      ),
    );
  });

  it("names the content handle each content block is for, with its qualifiers and heads", () => {
    for (const block of contentBlocks) {
      assert.isTrue(
        block.handles.includes(`m:${block.name.slice("kind-".length)}`),
        `${block.name} holds its own handle`,
      );
    }
  });

  it.effect("keeps m:annotation-xml apart, one MathExpression kind inside it", () =>
    Effect.gen(function* checkAnnotationXml() {
      const root = yield* parseBlock(annotationXmlBlock);
      const holders = walk(root).filter(({ handle }) => handle === "m:annotation-xml");
      const children = holders.flatMap(({ element }) =>
        element.children.flatMap((child) => (child.kind === "element" ? [child] : [])),
      );

      assert.isFalse(mathmlBlocks.some((block) => block.handles.includes("m:annotation-xml")));
      assert.isTrue(annotationXmlBlock.handles.includes("m:annotation-xml"));
      assert.strictEqual(holders.length, 1);
      assert.strictEqual(children.length, 1);
      assert.isTrue(children.every((child) => `m:${child.local}` in mathmlInventory));
      assert.deepStrictEqual(yield* findingsOf(annotationXmlBlock), []);
    }),
  );

  it.effect(
    "puts each host's element directly around an m:math, the item body being the fragment's own root",
    () =>
      Effect.gen(function* checkHosts() {
        for (const block of hostBlocks) {
          const entry = hostEntries.find((candidate) => candidate.handle === block.handles[0]);
          const root = yield* parseBlock(block);
          const parents = walk(root)
            .filter(({ element }) => isMathml(element) && element.local === "math")
            .map(({ parent }) => (parent === root ? "qti-item-body" : parent?.local));

          assert.isTrue(
            entry === undefined ? false : parents.includes(entry.element),
            `${block.name}: m:math under ${entry?.element ?? "no host"}`,
          );
        }
      }),
  );
});
