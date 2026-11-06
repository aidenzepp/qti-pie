import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { guards } from "#pantry/import/guards.ts";
import { mathmlTreeGuards } from "#pantry/import/guards/mathml-tree.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { itemRows } from "#pantry/import/item.ts";
import { Rows } from "#pantry/import/tree.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const packageId = "22222222-2222-4222-8222-222222222222";

/**
 * The rows the item passes build for a hand-written item whose body holds one `m:math` of `math`.
 */
const rowsOf = (math: string) =>
  Effect.gen(function* handWrittenRows() {
    const text = `<qti-assessment-item xmlns="${itemNamespace}" xmlns:m="http://www.w3.org/1998/Math/MathML" identifier="hand" title="Hand" time-dependent="false"><qti-item-body><p><m:math>${math}</m:math></p></qti-item-body></qti-assessment-item>`;
    const doc = yield* readXml(new TextEncoder().encode(text));
    const built = yield* itemRows(
      {
        doc,
        packageId,
        path: "hand.xml",
        resource: "hand",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version: "3.0.1",
      },
      Rows.empty(),
    );

    return built.rows;
  });

const threeChildren = "<m:mfrac><m:mi>a</m:mi><m:mi>b</m:mi><m:mi>c</m:mi></m:mfrac>";

describe("the import's chain runs the MathML guards", () => {
  it.effect("refuses a three-child m:mfrac as union-count", () =>
    Effect.gen(function* threeChildMfrac() {
      const failure = yield* Effect.flip(guards(yield* rowsOf(threeChildren), []));

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "union-count");
    }),
  );

  it.effect("passes a valid item", () =>
    Effect.gen(function* validItem() {
      yield* guards(yield* rowsOf("<m:mfrac><m:mi>a</m:mi><m:mi>b</m:mi></m:mfrac>"), []);
    }),
  );
});

describe("mathmlTreeGuards", () => {
  it.effect("refuses a group under an m:mfrac inside a cell (probe 31) as admission", () =>
    Effect.gen(function* probe31() {
      const rows = yield* rowsOf(
        "<m:mtable><m:mtr><m:mtd><m:mfrac><m:mrow><m:maligngroup/><m:mi>a</m:mi></m:mrow><m:mi>b</m:mi></m:mfrac></m:mtd></m:mtr></m:mtable>",
      );
      const failure = yield* Effect.flip(mathmlTreeGuards(rows));

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "admission");
    }),
  );

  it.effect("passes a valid item", () =>
    Effect.gen(function* validItem() {
      yield* mathmlTreeGuards(yield* rowsOf("<m:mi>x</m:mi>"));
    }),
  );
});
