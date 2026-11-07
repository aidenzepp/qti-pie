/**
 * The law oracle's node laws over rows no document's text gives (`#pantry/test/oracle.ts`
 * `documentBreaches`).
 *
 * The genetic differential (`src/test/genetic.oracle.test.ts`) folds every row it judges from a
 * document's text, and there a first child's start is always its parent's plus one, and an
 * interaction's child always names it as its nearest under its own kind. So a clause of T3 or N8
 * that only rows of another shape break is out of its reach: TD-B's mutants or-t3-first (T3's
 * first-child start dropped) and or-n8-parent (N8's nearest kind under an interaction dropped)
 * survive it. Here one lawful document is folded, one field of one row is set to a value no fold
 * gives, and the oracle must raise the law that field breaks at that row, for every row the
 * clause reads:
 *
 * - **T3 first child:** a first child whose `start` is not its parent's `start + 1`, its parent's
 *   copies held;
 * - **N8 nearest:** an interaction's child whose `nearest` is its parent but whose `nearestKind` is
 *   another kind.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawsOf } from "#pantry/test/oracle.ts";

/**
 * The oracle's law tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * A lawful item whose body holds a choice interaction, so its rows have first children at every
 * depth and children of an interaction.
 */
const item = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><p>Pick one.</p><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-prompt>Which?</qti-prompt><qti-simple-choice identifier="A">A</qti-simple-choice><qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;

/**
 * Fold the item.
 *
 * @returns Its rows.
 */
const foldedItem = Effect.fnUntraced(function* foldedItem() {
  const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(item)));
  const tree = yield* Effect.orDie(shred(xml, "3.0.0", shredGrammarOf(grammar)));

  return yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));
});

/**
 * Judge the rows with one node's row replaced, and name the laws the oracle raises at that node.
 *
 * @param rows - The folded rows.
 * @param node - The node.
 * @param changed - Its new row.
 * @returns The laws raised at its id.
 */
const lawsAt = (
  rows: FoldedRows<Composed>,
  node: FoldedNode<Composed>,
  changed: FoldedNode<Composed>,
): readonly string[] =>
  documentBreaches(
    "item.xml",
    { ...rows, nodes: rows.nodes.map((held) => (held.id === node.id ? changed : held)) },
    laws,
  ).flatMap(({ keys, law }) => (keys["id"] === node.id ? [law] : []));

describe("the law oracle's node laws over rows no document's text gives", () => {
  it.effect("raises T3 at every first child whose start is not its parent's plus one", () =>
    // Oracle: the specification as a checker, T3's first-child clause (fin.md §16: a first
    // child's interval opens just after its parent's), on rows a fold never writes. Bound: every
    // first child of the item, each with its start moved one on.
    Effect.gen(function* firstChildren() {
      const rows = yield* foldedItem();
      const firsts = rows.nodes.filter(({ at, id, parent }) => at === 0n && id !== parent);
      assert.isAbove(firsts.length, 3, "the item has first children at several depths");
      assert.deepStrictEqual(
        firsts.filter((node) => lawsAt(rows, node, node).includes("T3 first child")),
        [],
        "the folded item breaks no T3 first child",
      );
      assert.deepStrictEqual(
        firsts.flatMap((node) =>
          lawsAt(rows, node, { ...node, start: node.start + 1n }).includes("T3 first child")
            ? []
            : [`${node.kind} at ${String(node.start)}`],
        ),
        [],
        "every first child moved one on breaks T3 first child",
      );
    }),
  );

  it.effect("raises N8 at every child of an interaction that names it under another kind", () =>
    // Oracle: the specification as a checker, N8's interaction clause (a child of an interaction
    // takes it as its nearest, under its kind), on rows a fold never writes. Bound: every child of
    // the item's choice interaction, each with its nearest kind set to the document's.
    Effect.gen(function* interactionChildren() {
      const rows = yield* foldedItem();
      const children = rows.nodes.filter(
        ({ parentKind }) => parentKind === "qti-choice-interaction",
      );
      assert.isAbove(children.length, 2, "the interaction has children");
      assert.deepStrictEqual(
        children.flatMap((node) =>
          lawsAt(rows, node, { ...node, nearestKind: "document" }).includes("N8 nearest")
            ? []
            : [`${node.kind} at ${String(node.start)}`],
        ),
        [],
        "every child of the interaction named under another kind breaks N8 nearest",
      );
    }),
  );
});
