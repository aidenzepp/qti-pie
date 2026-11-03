import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { ItemGuardRefusal, itemGuards } from "#qti/import/guards/item.ts";
import { itemRows } from "#qti/import/item.ts";
import { Rows } from "#qti/import/tree.ts";
import { AttributeLexical } from "#qti/schema/node.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * The committed processing fixture whose attributes are padded, relative to `packages/qti`, where
 * the tests run.
 */
const padded = "src/processing/fixtures/guards/padded-processing.xml";

const packageId = crypto.randomUUID();

/**
 * The rows `itemRows` builds for the padded-processing item.
 */
const paddedRows = Effect.fn("paddedRows")(function* paddedRows() {
  const fs = yield* FileSystem.FileSystem;
  const doc = yield* readXml(yield* fs.readFile(path.join(padded)));
  const built = yield* itemRows(
    {
      doc,
      packageId,
      path: "padded-processing.xml",
      resource: "padded-processing",
      resourceLomHasGeneral: false,
      resourceType: "imsqti_item_xmlv3p0",
      version: "3.0.0",
    },
    Rows.empty(),
  );

  return built.rows;
});

layer(NodeServices.layer, { excludeTestServices: true })("import/guards/item.ts", (suite) => {
  suite.effect("accepts the lexical rows of a processing tree whose attributes are padded", () =>
    Effect.gen(function* paddedAccepted() {
      const rows = yield* paddedRows();
      const pairs = Rows.of(rows, AttributeLexical)
        .map((row) => `${row.kind}/${row.attribute}`)
        .toSorted();

      assert.deepStrictEqual(pairs, [
        "qti-correct/identifier",
        "qti-equal-rounded/figures",
        "qti-equal/tolerance",
        "qti-string-match/case-sensitive",
      ]);
      yield* itemGuards(rows);
    }),
  );

  suite.effect("refuses a lexical row that does not process to its typed column", () =>
    Effect.gen(function* paddedRefused() {
      const rows = yield* paddedRows();
      const wrong = new Map(rows).set(
        AttributeLexical,
        Rows.of(rows, AttributeLexical).map((row) =>
          row.kind === "qti-correct" ? { ...row, value: " S " } : row,
        ),
      );
      const refusal = yield* Effect.flip(itemGuards(wrong));

      assert.instanceOf(refusal, ItemGuardRefusal);
      assert.strictEqual(refusal.rule, "typed-copy");
    }),
  );
});
