import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { modelFinding } from "#pantry/import/guards/mathml.ts";
import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import { mathmlBlocks, presentationHandles } from "#pantry/test/mathml-blocks.ts";
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
 * Every element under a root, the root included, in document order, each with its parent.
 *
 * @param root - The root element.
 * @returns The elements with their parents.
 */
const walk = (
  root: Element,
  parent?: Element,
): readonly { readonly element: Element; readonly parent: Element | undefined }[] => [
  { element: root, parent },
  ...root.children.flatMap((child) => (child.kind === "element" ? walk(child, root) : [])),
];

/**
 * The handle of a MathML element.
 *
 * @param element - The element.
 * @returns `m:` and its local name.
 */
const handleOf = (element: Element): string => `m:${element.local}`;

/**
 * Whether an element is in the MathML namespace.
 *
 * @param element - The element.
 * @returns True for a MathML element.
 */
const isMathml = (element: Element): boolean => element.namespace === mathmlNamespace;

const hostEntries = Object.values(inventory).filter((entry) =>
  entry.children.some((child) => child.name === "m3:math"),
);

const kindBlocks = mathmlBlocks.filter((block) => block.part === "kind");

const hostBlocks = mathmlBlocks.filter((block) => block.part === "host");

describe("the host and presentation coverage blocks", () => {
  it("has unique names and writes only host and kind blocks for a 3.0.0 item", () => {
    const names = mathmlBlocks.map((block) => block.name);

    assert.strictEqual(new Set(names).size, names.length);
    assert.isTrue(mathmlBlocks.every((block) => block.part === "host" || block.part === "kind"));
    assert.isTrue(mathmlBlocks.every((block) => block.version === "3.0.0"));
    assert.strictEqual(hostBlocks.length, 63);
    assert.strictEqual(kindBlocks.length, 43);
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
        const handles = [...new Set(found.map(({ element }) => handleOf(element)))];
        const pairs = new Set(
          found.flatMap(({ element }) =>
            element.attributes
              .filter((attribute) => attribute.namespace === "")
              .map((attribute) => `${handleOf(element)} ${attribute.local}`),
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
        const root = yield* parseBlock(block);
        const findings = walk(root)
          .filter(({ element }) => isMathml(element))
          .map(({ element }) => ({
            finding: modelFinding(
              handleOf(element),
              element.children.flatMap((child) =>
                child.kind === "element" ? [handleOf(child)] : [],
              ),
            ),
            kind: handleOf(element),
          }))
          .filter(({ finding }) => finding !== undefined);

        assert.deepStrictEqual(findings, []);

        for (const { element } of walk(root)) {
          if (element.namespace === mathmlNamespace && element.local === "mglyph") {
            const names = new Set(element.attributes.map((attribute) => attribute.local));

            assert.isTrue(names.has("src") && names.has("alt"));
          }
        }
      }),
    );
  }

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
