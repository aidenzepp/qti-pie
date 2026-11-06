import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";

import { modelFinding } from "#pantry/import/guards/mathml.ts";
import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import { families } from "#pantry/schema/mathml/values.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import {
  annotationXmlBlock,
  contentHandles,
  mathmlBlocks,
  mathmlGroups,
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

const kindBlocks = mathmlBlocks.filter(
  (block) => block.part === "kind" && block.version === "3.0.0",
);

const presentationBlocks = kindBlocks.filter((block) =>
  presentationHandles.includes(`m:${block.name.slice("kind-".length)}`),
);

const contentBlocks = kindBlocks.filter((block) => !presentationBlocks.includes(block));

const hostBlocks = mathmlBlocks.filter((block) => block.part === "host");

const attributeBlocks = mathmlBlocks.filter((block) => block.part === "attribute");

const paddedBlocks = mathmlBlocks.filter((block) => block.part === "padded");

const blocksFor301 = mathmlBlocks.filter((block) => block.version === "3.0.1");

/**
 * The base document a block goes in, from its site.
 *
 * @param block - The block.
 * @returns The base item, test or stimulus.
 */
const documentOf = (block: MathmlBlock): "item" | "stimulus" | "test" => {
  if (block.site === "test-head" || block.site === "test-tail") {
    return "test";
  }

  return block.site === "stimulus-body" ? "stimulus" : "item";
};

/**
 * The host a fragment's own root `m:math` sits in when the fragment is the whole body: the item
 * body of the base item, or the stimulus body of the base stimulus.
 *
 * @param block - The block.
 * @returns The element the root stands for.
 */
const rootHostOf = (block: MathmlBlock): string =>
  documentOf(block) === "stimulus" ? "qti-stimulus-body" : "qti-item-body";

describe("the host, presentation and content coverage blocks", () => {
  it("has unique names and a block of each part, one of them for a 3.0.1 item", () => {
    const names = [...mathmlBlocks, annotationXmlBlock].map((block) => block.name);

    assert.strictEqual(new Set(names).size, names.length);
    assert.deepStrictEqual([...new Set(mathmlBlocks.map((block) => block.part))].toSorted(), [
      "attribute",
      "host",
      "kind",
      "padded",
    ]);
    assert.strictEqual(hostBlocks.length, 66);
    assert.strictEqual(presentationBlocks.length, 43);
    assert.strictEqual(kindBlocks.length, 193);
    assert.strictEqual(paddedBlocks.length, 1);
    assert.strictEqual(blocksFor301.length, 1);
    assert.strictEqual(
      mathmlBlocks.length,
      hostBlocks.length +
        kindBlocks.length +
        attributeBlocks.length +
        paddedBlocks.length +
        blocksFor301.length,
    );
  });

  it("puts m:math under every roster host the composed inventory names", () => {
    assert.strictEqual(hostEntries.length, 66);

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
    "puts each host's element directly around an m:math, the body of the base document being the fragment's own root",
    () =>
      Effect.gen(function* checkHosts() {
        for (const block of hostBlocks) {
          const entry = hostEntries.find((candidate) => candidate.handle === block.handles[0]);
          const root = yield* parseBlock(block);
          const parents = walk(root)
            .filter(({ element }) => isMathml(element) && element.local === "math")
            .map(({ parent }) => (parent === root ? rootHostOf(block) : parent?.local));

          assert.isTrue(
            entry === undefined ? false : parents.includes(entry.element),
            `${block.name}: m:math under ${entry?.element ?? "no host"}`,
          );
        }
      }),
  );
});

/**
 * An XML `collapse`: runs of XML space become one space, and the ends are trimmed.
 *
 * @param value - The attribute value as written.
 * @returns The collapsed value.
 */
const collapse = (value: string): string =>
  value.replaceAll(/[ \t\n\r]+/gu, " ").replaceAll(/^ | $/gu, "");

/**
 * The family of each MathML `(kind, attribute)` pair that has one, keyed by the kind, a space and
 * the attribute.
 */
const familyOf = new Map(
  families.flatMap((family) => family.pairs.map(([kind, name]) => [`${kind} ${name}`, family])),
);

/**
 * The base pattern of each contract family's value type.
 */
const contractBase: ReadonlyMap<string, string> = new Map([
  ["EmbedSourceUri", patterns.anyUri],
  ["HyperlinkUri", patterns.anyUri],
  ["MathmlBaseValue", patterns.mathmlPositiveInteger],
  ["MathmlCdValue", patterns.ncName],
  ["MathmlCdgroupValue", patterns.anyUri],
  ["MathmlDefinitionUrlValue", patterns.anyUri],
  ["MathmlIndexValue", patterns.mathmlInteger],
  ["MathmlNameValue", patterns.ncName],
  ["MathmlNargsValue", patterns.xsNonNegativeInteger],
  ["MathmlPositionValue", patterns.mathmlInteger],
  ["MathmlScriptlevelValue", patterns.xsInteger],
  ["MathmlSelectionValue", patterns.mathmlPositiveInteger],
  ["MathmlShiftValue", patterns.mathmlInteger],
  ["MathmlSpanValue", patterns.mathmlPositiveInteger],
  ["MathmlSrcValue", patterns.anyUri],
]);

const patternSources: ReadonlyMap<string, string> = new Map(
  Object.entries(patterns).flatMap(([name, source]) =>
    name.endsWith("Flags") ? [] : [[name, source]],
  ),
);

const rosterMembers: ReadonlyMap<string, readonly string[]> = new Map(
  Object.values(rosters).flatMap((roster) =>
    "handles" in roster ? [[roster.name, roster.handles]] : [],
  ),
);

/**
 * Whether a family's value type admits a value, read as the family judges it.
 *
 * @param pair - The pair's kind, a space and the attribute, naming the family.
 * @param value - The value.
 * @returns True when the roster, the pattern or the contract's base admits it.
 */
const familyAdmits = (pair: string, value: string): boolean => {
  const family = familyOf.get(pair);

  if (family === undefined) {
    return false;
  }

  if (family.class === "tautology") {
    return true;
  }

  if (family.class === "roster") {
    return rosterMembers.get(family.valueType)?.includes(value) ?? false;
  }

  const source =
    family.class === "contract"
      ? contractBase.get(family.valueType)
      : patternSources.get(family.valueType);

  return source !== undefined && new RegExp(source, "u").test(value);
};

/**
 * One attribute of a MathML element in a parsed block, in no namespace.
 */
interface Written {
  readonly handle: string;
  readonly name: string;
  readonly pair: string;
  readonly value: string;
}

const writtenBy = Effect.fn("test.mathmlBlocks.written")(function* writtenBy(block: MathmlBlock) {
  const root = yield* parseBlock(block);

  return walk(root)
    .filter(({ element }) => isMathml(element))
    .flatMap(({ element, handle }) =>
      element.attributes
        .filter((attribute) => attribute.namespace === "")
        .map((attribute): Written => ({
          handle,
          name: attribute.local,
          pair: `${handle} ${attribute.local}`,
          value: attribute.value,
        })),
    );
});

/**
 * The MathML relations of a set of blocks, counted as spec 4.11 counts them: one arm per distinct
 * kind, one family per distinct family, `HtmlId` and `DocumentId` for an `id`, `AttributeIdref` and
 * `DocumentId` for an `xref`, and `AttributeLexical` for a value that differs from its collapse.
 *
 * @param blocks - The blocks of one fixture.
 * @returns The distinct relations, and the pairs that name no family and are not `id`, `xref` or
 *   `m:maction/@actiontype`.
 */
const relationsOf = Effect.fn("test.mathmlBlocks.relations")(function* relationsOf(
  blocks: readonly MathmlBlock[],
) {
  const relations = new Set<string>();
  const unfamilied: string[] = [];

  for (const block of blocks) {
    const root = yield* parseBlock(block);

    for (const { handle } of walk(root).filter(({ element }) => isMathml(element))) {
      relations.add(`arm ${handle}`);
    }

    for (const { name, pair, value } of yield* writtenBy(block)) {
      const family = familyOf.get(pair);

      if (name === "id") {
        relations.add("HtmlId").add("DocumentId");
      } else if (name === "xref") {
        relations.add("AttributeIdref").add("DocumentId");
      } else if (family !== undefined) {
        relations.add(`family ${family.handle}`);
      } else if (pair !== "m:maction actiontype") {
        unfamilied.push(pair);
      }

      if (value !== collapse(value)) {
        relations.add("AttributeLexical");
      }
    }
  }

  return { relations, unfamilied };
});

/**
 * The most MathML relations one fixture holds: 40, which with a base item of 90 stays within
 * ⌊819,200 / 6,300⌋ = 130 (spec 4.11).
 */
const mathmlRelationsMax = 40;

const baseRelations = 90;

const relationsCap = 130;

/**
 * Every leaf pair, the kind, a space and the attribute, over the composed inventory.
 */
const leafPairs = Object.entries(mathmlInventory).flatMap(([handle, entry]) =>
  entry.attributes.map((attribute) => `${handle} ${attribute.name}`),
);

describe("the attribute blocks, the padded block and the groups", () => {
  it("writes every one of the 1,851 leaf pairs in an attribute block or the annotation-xml block", () => {
    const written = new Set(
      [...attributeBlocks, annotationXmlBlock].flatMap((block) =>
        block.pairs.map((pair) => pair.join(" ")),
      ),
    );

    assert.strictEqual(leafPairs.length, 1851);
    assert.deepStrictEqual(
      leafPairs.filter((pair) => !written.has(pair)),
      [],
    );
    assert.deepStrictEqual(
      leafPairs.filter(
        (pair) =>
          pair.startsWith("m:annotation-xml ") &&
          !annotationXmlBlock.pairs.some((candidate) => candidate.join(" ") === pair),
      ),
      [],
    );
    assert.strictEqual(
      annotationXmlBlock.pairs.filter(([kind]) => kind === "m:annotation-xml").length,
      11,
    );
    assert.isFalse(
      attributeBlocks.some((block) => block.pairs.some(([kind]) => kind === "m:annotation-xml")),
    );
  });

  it.effect("gives every attribute a value its family admits", () =>
    Effect.gen(function* checkValues() {
      for (const block of [...attributeBlocks, annotationXmlBlock]) {
        for (const { name, pair, value } of yield* writtenBy(block)) {
          if (name === "id" || name === "xref" || pair === "m:maction actiontype") {
            continue;
          }

          assert.isTrue(
            familyAdmits(pair, value),
            `${block.name}: ${pair}=${JSON.stringify(value)}`,
          );
        }
      }
    }),
  );

  it.effect("names an id of the same block in every xref, and writes no id twice in a block", () =>
    Effect.gen(function* checkXrefs() {
      for (const block of [...attributeBlocks, annotationXmlBlock]) {
        const written = yield* writtenBy(block);
        const ids = written.filter(({ name }) => name === "id").map(({ value }) => value);

        assert.strictEqual(new Set(ids).size, ids.length, block.name);

        for (const { value } of written.filter(({ name }) => name === "xref")) {
          assert.isTrue(ids.includes(value), `${block.name}: xref ${value}`);
        }
      }
    }),
  );

  it.effect("puts m:share's src on an id that is no ancestor of the share", () =>
    Effect.gen(function* checkShare() {
      const block = attributeBlocks.find((candidate) => candidate.name === "attr-share");
      const root = block === undefined ? undefined : yield* parseBlock(block);
      const found = root === undefined ? [] : walk(root);
      const shares = found.filter(({ handle }) => handle === "m:share");
      const target = shares
        .flatMap(({ element }) =>
          element.attributes.filter((attribute) => attribute.local === "src"),
        )
        .map((attribute) => attribute.value.slice(1))
        .at(0);
      const holders = found.filter(({ element }) =>
        element.attributes.some(
          (attribute) => attribute.local === "id" && attribute.value === target,
        ),
      );

      assert.strictEqual(shares.length, 1);
      assert.strictEqual(holders.length, 1);
      assert.isFalse(
        shares.some(({ element }) => holders.some(({ element: holder }) => holder === element)),
      );
    }),
  );

  it.effect("gives every m:share a src that is a fragment naming an id of its own block", () =>
    Effect.gen(function* checkShares() {
      let seen = 0;

      for (const block of mathmlBlocks.filter((candidate) =>
        candidate.handles.includes("m:share"),
      )) {
        const written = yield* writtenBy(block);
        const ids = new Set(written.filter(({ name }) => name === "id").map(({ value }) => value));

        for (const { value } of written.filter(({ pair }) => pair === "m:share src")) {
          seen += 1;
          assert.isTrue(value.startsWith("#"), `${block.name}: ${value}`);
          assert.isTrue(ids.has(value.slice(1)), `${block.name}: ${value}`);
        }
      }

      assert.isAtLeast(seen, 2);
    }),
  );

  it.effect(
    "writes the padded block's values padded and unsigned, with the one sign D6 lists",
    () =>
      Effect.gen(function* checkPadded() {
        const [block] = paddedBlocks;
        const written = block === undefined ? [] : yield* writtenBy(block);
        const valuesOf = (pair: string) =>
          written.filter((entry) => entry.pair === pair).map(({ value }) => value);
        const signed = written.filter(({ value }) => value.trim().startsWith("+"));
        const padded = written.filter(({ value }) => value !== collapse(value));

        assert.deepStrictEqual(valuesOf("m:msrow position"), [" 1 "]);
        assert.deepStrictEqual(valuesOf("m:mtd rowspan"), [" 2 "]);
        assert.deepStrictEqual(valuesOf("m:msline length"), [" 3 "]);
        assert.deepStrictEqual(valuesOf("m:mstyle scriptsizemultiplier"), [" 0.5 "]);
        assert.deepStrictEqual(valuesOf("m:mstyle scriptlevel"), ["+1"]);
        assert.deepStrictEqual(
          signed.map(({ pair }) => pair),
          ["m:mstyle scriptlevel"],
        );
        assert.isTrue(block?.xml.includes("<m:cbytes>AQID AQID</m:cbytes>") ?? false);
        assert.isAtLeast(padded.length, 25);
        assert.deepStrictEqual(
          [...valuesOf("m:mstyle mathsize"), ...valuesOf("m:mi mathsize")].map((value) =>
            value.trim(),
          ),
          ["small", "1em"],
        );
        assert.deepStrictEqual(
          [...valuesOf("m:mstyle mathbackground"), ...valuesOf("m:mi background")].map((value) =>
            value.trim(),
          ),
          ["transparent", "#fff"],
        );
        assert.deepStrictEqual(
          valuesOf("m:mfrac linethickness").map((value) => value.trim()),
          ["thick", "1px"],
        );

        for (const { pair, name, value } of written) {
          if (name !== "id" && pair !== "m:maction actiontype") {
            assert.isTrue(
              familyAdmits(pair, value) || familyAdmits(pair, collapse(value)),
              `${pair}=${JSON.stringify(value)}`,
            );
          }
        }
      }),
  );

  it.effect("puts one kind block under 3.0.1, and it passes the MathML content models", () =>
    Effect.gen(function* checkVersion() {
      const [block] = blocksFor301;

      assert.strictEqual(block?.part, "kind");
      assert.deepStrictEqual(block === undefined ? ["no block"] : yield* findingsOf(block), []);
    }),
  );

  it("names the groups math-gen-<n>, each block in exactly one, all of one version", () => {
    const names = mathmlGroups.map((group) => group.name);
    const grouped = mathmlGroups.flatMap((group) => group.blocks.map((block) => block.name));

    assert.strictEqual(new Set(names).size, names.length);
    assert.deepStrictEqual(
      names,
      names.map((_, index) => `math-gen-${index + 1}`),
    );
    assert.deepStrictEqual(grouped.toSorted(), mathmlBlocks.map((block) => block.name).toSorted());
    assert.isFalse(grouped.includes(annotationXmlBlock.name));
    assert.isTrue(
      mathmlGroups.every((group) => group.blocks.every((block) => block.version === group.version)),
    );
    assert.deepStrictEqual(
      mathmlGroups.filter((group) => group.version === "3.0.1").map((group) => group.name),
      mathmlGroups
        .filter((group) => group.blocks.some((block) => blocksFor301.includes(block)))
        .map((group) => group.name),
    );
  });

  it("keeps the blocks of one group in one base document: the item, the test or the stimulus", () => {
    for (const group of mathmlGroups) {
      assert.strictEqual(new Set(group.blocks.map(documentOf)).size, 1, group.name);
    }
    assert.deepStrictEqual(
      mathmlGroups.filter((group) => group.blocks.some((block) => documentOf(block) !== "item")),
      mathmlGroups.slice(-2),
    );
  });

  it("keeps the QTI identifiers of the host blocks in one group distinct", () => {
    for (const group of mathmlGroups) {
      const identifiers = group.blocks
        .filter((block) => block.part === "host")
        .flatMap((block) => [
          ...new Set(
            [...block.xml.matchAll(/\b(?:identifier|response-identifier)="(?<value>[^"]+)"/gu)].map(
              (match) => match.groups?.["value"],
            ),
          ),
        ]);

      assert.strictEqual(new Set(identifiers).size, identifiers.length, group.name);
    }
  });

  it("writes ids that are distinct across the blocks of one group", () => {
    for (const group of mathmlGroups) {
      const ids = group.blocks.flatMap((block) =>
        [...block.xml.matchAll(/\bid="(?<value>[^"]+)"/gu)].map((match) =>
          (match.groups?.["value"] ?? "").trim(),
        ),
      );

      assert.strictEqual(new Set(ids).size, ids.length, group.name);
    }
  });

  it.effect("holds at most 40 MathML relations in a group, 130 with the base item's 90", () =>
    Effect.gen(function* checkGroups() {
      for (const group of mathmlGroups) {
        const { relations, unfamilied } = yield* relationsOf(group.blocks);

        assert.deepStrictEqual(unfamilied, [], group.name);
        assert.isAtMost(relations.size, mathmlRelationsMax, group.name);
        assert.isAtMost(baseRelations + relations.size, relationsCap, group.name);
      }
    }),
  );
});
