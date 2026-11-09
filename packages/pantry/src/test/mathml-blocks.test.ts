import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import {
  annotationXmlBlock,
  contentHandles,
  mathmlBlocks,
  mathmlGroups,
  presentationHandles,
} from "#pantry/test/mathml-blocks.ts";
import type { MathmlBlock } from "#pantry/test/mathml-blocks.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * Every block the data states: the listed blocks and the `m:annotation-xml` block that no group
 * holds.
 */
const everyBlock: readonly MathmlBlock[] = [...mathmlBlocks, annotationXmlBlock];

/**
 * The MathML kinds whose attribute declarations no block writes: none, `m:semantics.contexp`
 * included (`attr-semantics-contexp`, a `m:semantics` standing as a content expression, spec
 * reading 2). The blocks were generated against `main`'s tree, which has one `m:semantics` kind
 * where this base's grammar splits it by position, so its split kinds are written by blocks of this
 * port's.
 */
const unwritten: ReadonlySet<string> = new Set();

/**
 * The base document a block goes into, by its site: the item, the test or the stimulus.
 */
const baseOf = (block: MathmlBlock): "item" | "stimulus" | "test" => {
  if (block.site === "stimulus-body") {
    return "stimulus";
  }

  return block.site === "test-head" || block.site === "test-tail" ? "test" : "item";
};

/**
 * The values of the plain `id` attributes a block's fragment writes.
 */
const idsOf = (block: MathmlBlock): readonly string[] =>
  Array.from(block.xml.matchAll(/\sid="(?<id>[^"]*)"/gu), (match) => match.groups?.["id"] ?? "");

describe("the MathML coverage blocks", () => {
  it("name every block once", () => {
    const names = everyBlock.map(({ name }) => name);

    assert.strictEqual(new Set(names).size, names.length);
  });

  it.effect("hold, in handles, only kinds of the composed grammar", () =>
    Effect.gen(function* handlesAreKinds() {
      const { kinds } = yield* grammar;
      const known = new Set<string>(kinds.isElement.rows.map(({ kind }) => kind));
      const unknown = [...presentationHandles, ...contentHandles].filter(
        (handle) => !known.has(handle),
      );

      assert.deepStrictEqual(unknown, []);
    }),
  );

  it("cover every presentation and content handle in some block", () => {
    const held = new Set(everyBlock.flatMap(({ handles }) => handles));
    const missing = [...presentationHandles, ...contentHandles].filter(
      (handle) => !held.has(handle),
    );

    assert.deepStrictEqual(missing, []);
  });

  it("write every MathML attribute declaration of the inventory in some block's pairs, but those of the kinds in `unwritten`", () => {
    const written = new Set(
      everyBlock.flatMap(({ pairs }) => pairs.map(([kind, name]) => `${kind} ${name}`)),
    );
    const missing = [
      ...new Set(
        attributeDeclarations
          .filter(({ kind }) => kind.startsWith("m:") && !unwritten.has(kind))
          .map(({ kind, name }) => `${kind} ${name}`),
      ),
    ].filter((pair) => !written.has(pair));

    assert.deepStrictEqual(missing, []);
  });

  it("leave `unwritten` exactly the kinds that no block writes a pair of", () => {
    const written = new Set(everyBlock.flatMap(({ pairs }) => pairs.map(([kind]) => kind)));

    assert.deepStrictEqual(
      [...unwritten].filter((kind) => written.has(kind)),
      [],
    );
  });

  it("put every listed block in exactly one group, and the annotation-xml block in none", () => {
    const grouped = mathmlGroups.flatMap(({ blocks }) => blocks.map(({ name }) => name));

    assert.deepStrictEqual(grouped.toSorted(), mathmlBlocks.map(({ name }) => name).toSorted());
    assert.isFalse(grouped.includes(annotationXmlBlock.name));
  });

  it("share, within a group, one version and one base document", () => {
    for (const group of mathmlGroups) {
      assert.isAbove(group.blocks.length, 0, group.name);
      assert.deepStrictEqual(
        new Set(group.blocks.map(({ version }) => version)),
        new Set([group.version]),
        group.name,
      );
      assert.strictEqual(new Set(group.blocks.map(baseOf)).size, 1, group.name);
    }
  });

  it("keep ids distinct within a group", () => {
    for (const group of mathmlGroups) {
      const ids = group.blocks.flatMap(idsOf);

      assert.strictEqual(new Set(ids).size, ids.length, group.name);
    }
  });
});
