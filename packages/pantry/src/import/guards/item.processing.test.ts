import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { ItemGuardRefusal, itemGuards } from "#pantry/import/guards/item.ts";
import { ProcessingGuardRefusal, processingGuards } from "#pantry/import/guards/processing.ts";
import { itemRows } from "#pantry/import/item.ts";
import { Rows, treeRows } from "#pantry/import/tree.ts";
import * as attributed from "#pantry/schema/expression-attributes.ts";
import { AttributeLexical, Node } from "#pantry/schema/node.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as ruleSchema from "#pantry/schema/rule.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * The committed processing fixture whose attributes are padded, relative to `packages/pantry`,
 * where the tests run.
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

  suite.effect("refuses a figures number that its padded lexical row does not process to", () =>
    Effect.gen(function* figuresDisagrees() {
      const rows = yield* paddedRows();
      const wrong = new Map(rows).set(
        attributed.EqualRounded,
        Rows.of(rows, attributed.EqualRounded).map((row) => ({
          ...row,
          figuresValue: row.figuresValue + 1n,
        })),
      );
      const refusal = yield* Effect.flip(itemGuards(wrong));

      assert.instanceOf(refusal, ItemGuardRefusal);
      assert.strictEqual(refusal.rule, "typed-copy");
    }),
  );
});

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The rows of an item whose one `qti-custom-operator` holds `children`, with the operand rows the
 * item's expressions would have, so the ordering of the operator's children is the only thing a
 * processing guard can find wrong.
 */
const operatorRows = Effect.fn("operatorRows")(function* operatorRows(children: string) {
  const doc = yield* readXml(
    new TextEncoder().encode(
      `<qti-assessment-item xmlns="${asi}" xmlns:ma="urn:test:ma" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-processing><qti-set-outcome-value identifier="S"><qti-custom-operator>${children}</qti-custom-operator></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`,
    ),
  );
  const built = yield* treeRows(
    doc,
    { charset: doc.charset, id: packageId, kind: "document", root: "item", version: "3.0.0" },
    Rows.empty(),
  );
  const nodes = Rows.of(built.rows, Node);
  const idOf = (kind: string) =>
    Option.getOrThrow(Option.fromNullishOr(nodes.find((node) => node.kind === kind)?.id));
  const operator = idOf("qti-custom-operator");
  const withRule = Rows.add(built.rows, ruleSchema.RuleOperand, [
    {
      child: operator,
      position: 0n,
      rule: idOf("qti-set-outcome-value"),
      ruleKind: "qti-set-outcome-value",
    },
  ]);

  return Rows.add(withRule, processing.Operand, [
    { child: idOf("qti-base-value"), expression: operator, position: 0n },
  ]);
});

describe("import/guards/processing.ts", () => {
  it.effect("P30 refuses a foreign child that comes before the operand (lax/19)", () =>
    Effect.gen(function* foreignFirst() {
      const rows = yield* operatorRows(
        '<ma:first/><qti-base-value base-type="integer">1</qti-base-value>',
      );
      const refusal = yield* Effect.flip(processingGuards(rows));

      assert.instanceOf(refusal, ProcessingGuardRefusal);
      assert.strictEqual(refusal.rule, "P30");
    }),
  );

  it.effect("P30 accepts the operand before a foreign child", () =>
    Effect.gen(function* operandFirst() {
      const rows = yield* operatorRows(
        '<qti-base-value base-type="integer">1</qti-base-value><ma:first/>',
      );

      yield* processingGuards(rows);
    }),
  );
});
