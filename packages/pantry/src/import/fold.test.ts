import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { foldAt, foldOf, ownContext } from "#pantry/import/fold.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId } from "#pantry/model/xdm.ts";

/**
 * Two documents whose nodes are numbered from one range, so each holds ids the other lacks: an item
 * with an interaction, text and an attribute below its body, and a bare item.
 */
const documents = [
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-item-body><p>a <b>b</b></p><qti-choice-interaction response-identifier="R" max-choices="1"><qti-simple-choice identifier="A">A</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`,
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="j" title="t" time-dependent="false"/>`,
] as const;

/**
 * Number a document's nodes from an offset, so two documents' ids never meet.
 *
 * @param offset - The first number.
 * @returns The document's `idOf`.
 */
const idsFrom =
  (offset: number) =>
  (index: number): NodeId =>
    `00000000-0000-4000-8000-${(offset + index).toString(16).padStart(12, "0")}`;

describe("foldAt", () => {
  it.effect("read every node's fold, and refuse a node of another document by its id", () =>
    // Oracle: foldOf's own map, every node it is given; an id of the other document is none of
    // its nodes. Bound: two documents, every node of each.
    Effect.gen(function* everyNode() {
      const folded: {
        readonly folds: ReturnType<typeof foldOf>;
        readonly rows: FlatRows<Composed>;
      }[] = [];
      for (const [at, text] of documents.entries()) {
        const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
        const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));
        const rows = flatten(tree, idsFrom(at * 1000));
        folded.push({ folds: foldOf(rows.nodes, ownContext(rows.document.node)), rows });
      }

      for (const [at, { folds, rows }] of folded.entries()) {
        for (const node of rows.nodes) {
          assert.strictEqual(foldAt(folds, node.id), folds.get(node.id), node.id);
        }

        const other = folded[1 - at];
        if (other === undefined) {
          assert.fail("the test folds two documents");
        }

        for (const node of other.rows.nodes) {
          assert.throws(() => {
            foldAt(folds, node.id);
          }, node.id);
        }
      }
    }),
  );
});
