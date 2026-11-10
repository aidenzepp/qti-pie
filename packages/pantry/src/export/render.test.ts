import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { addRow, emptyScan } from "#pantry/export/pages.ts";
import { documentXml, scanXml } from "#pantry/export/render.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { names } from "#pantry/model/names.ts";
import { unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import { scrambledIdOf } from "#pantry/test/gen/xdm.ts";
import { scanRowsOf } from "#pantry/test/scan-rows.ts";

/**
 * A small item with a declaration naming its encoding and standalone, a comment and a processing
 * instruction in its prolog, namespace declarations, attributes in more than one namespace, text,
 * whitespace and nesting, so its scan carries every kind of row a document's scan attaches to a
 * node.
 */
const item = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<!-- one item -->
<?render keep?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="i" title="Render" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p>Pick <em>one</em>.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>
`;

/**
 * Read the item into its tree and its scan rows, with ids out of document order as drawn ids are.
 *
 * @returns The item's document node, the bytes `unshred` writes for its tree, and its scan rows in
 *   `start` order.
 */
const itemScan = Effect.fnUntraced(function* itemScan() {
  const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(item)));
  const tree = yield* Effect.orDie(shred(xml, "3.0.0", shredGrammarOf(grammar)));
  const rows = flatten(tree, scrambledIdOf);

  return {
    document: rows.document.node,
    expected: yield* Effect.orDie(unshred(tree, names)),
    scan: scanRowsOf(rows),
  };
});

describe("export/render.ts", () => {
  it.effect(
    "writes one document's bytes from its scan rows in order, reversed, interleaved and folded alike",
    () =>
      // Oracle: `unshred` of the tree the rows were flattened from, which no scan row reaches;
      // and a metamorphic relation: each row is folded by its own key, so the rows' order and the
      // fold `scanXml` takes are invisible.
      Effect.gen(function* everyOrderAlike() {
        const { document, expected, scan } = yield* itemScan();
        const interleaved = [
          ...scan.filter((_, index) => index % 2 === 1),
          ...scan.filter((_, index) => index % 2 === 0),
        ];

        const written = yield* documentXml(document, scan);

        assert.deepStrictEqual(written, expected);
        assert.deepStrictEqual(yield* documentXml(document, scan.toReversed()), expected);
        assert.deepStrictEqual(yield* documentXml(document, interleaved), expected);
        assert.deepStrictEqual(
          yield* scanXml(document, Arr.reduce(scan, emptyScan<Composed>(), addRow)),
          expected,
        );
      }),
  );
});
