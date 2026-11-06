/**
 * An `xi:include` the walk reaches inside wildcard content keeps its attributes (decision 280):
 * under a `qti-custom-operator`, directly or under a foreign element, it is written by the same
 * builder as one standing where a rule stands, exactly once. Every case reads an inline literal
 * with `readXml`, runs `treeRows` and `processingRows`, and reads the rows; no database.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { processingRows } from "#pantry/import/processing.ts";
import type { ProcessingInput } from "#pantry/import/processing.ts";
import { Rows, treeRows } from "#pantry/import/tree.ts";
import { environmentOf } from "#pantry/processing/env.ts";
import { XIncludeUri } from "#pantry/schema/contracts.ts";
import * as ruleSchema from "#pantry/schema/rule.ts";

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const xi = "http://www.w3.org/2001/XInclude";

const of = <R extends AnyRelation>(rows: Rows, relation: R): readonly Fact<R>[] =>
  Rows.of(rows, relation);

/**
 * Write the tree and processing rows of a `qti-response-processing` holding `body`.
 */
const rowsOf = (body: string) =>
  Effect.gen(function* writeRows() {
    const text = `<qti-response-processing xmlns="${asi}" xmlns:xi="${xi}" xmlns:ma="urn:test:ma">${body}</qti-response-processing>`;
    const doc = yield* readXml(new TextEncoder().encode(text));
    const declaring = yield* readXml(
      new TextEncoder().encode(
        `<qti-assessment-item xmlns="${asi}"><qti-outcome-declaration identifier="S" cardinality="single" base-type="float"/></qti-assessment-item>`,
      ),
    );
    const tree = crypto.randomUUID();
    const built = yield* treeRows(
      doc,
      { charset: doc.charset, id: tree, kind: "document", root: "item", version: "3.0.0" },
      Rows.empty(),
    );
    const input: ProcessingInput = {
      document: tree,
      env: environmentOf(declaring, "test"),
      language: "response",
      mode: "test",
      nodes: built.nodes,
      root: doc.root,
      rootKind: "item",
      tree,
      version: "3.0.0",
    };
    const rows = yield* processingRows(input, built.rows);

    return { nodes: built.nodes, rows };
  });

const includesOf = (root: Element): readonly Element[] =>
  [root, ...root.children.flatMap((c) => (c.kind === "element" ? includesOf(c) : []))].filter(
    (e) => e.qname === "xi:include",
  );

const operator = (inner: string): string =>
  `<qti-set-outcome-value identifier="S"><qti-custom-operator class="org.example.Op"><qti-null/>${inner}</qti-custom-operator></qti-set-outcome-value>`;

describe("xi:include inside wildcard content", () => {
  it.effect("writes one XIncludeHref row for an include under a foreign element", () =>
    Effect.gen(function* underForeign() {
      const { nodes, rows } = yield* rowsOf(
        operator('<ma:extension><xi:include href="a.xml" parse="xml"/></ma:extension>'),
      );
      const include = [...nodes].find(([element]) => element.qname === "xi:include");
      assert.isDefined(include);
      assert.deepStrictEqual(of(rows, ruleSchema.XIncludeHref), [
        { node: include[1].id, value: XIncludeUri("a.xml") },
      ]);
      assert.deepStrictEqual(of(rows, ruleSchema.XInclude), [{ id: include[1].id }]);
      assert.strictEqual(of(rows, ruleSchema.XIncludeParse).length, 1);
    }),
  );

  it.effect("writes one row for an include directly under the operator and one per include", () =>
    Effect.gen(function* directAndNested() {
      const { rows } = yield* rowsOf(
        operator(
          '<xi:include href="b.xml"/><ma:x><ma:y><xi:include href="c.xml"/></ma:y></ma:x><xi:include href="d.xml"><ma:z><xi:include href="e.xml"/></ma:z></xi:include>',
        ),
      );
      assert.deepStrictEqual(
        of(rows, ruleSchema.XIncludeHref)
          .map((row) => row.value)
          .toSorted(),
        ["b.xml", "c.xml", "d.xml", "e.xml"],
      );
      assert.strictEqual(of(rows, ruleSchema.XInclude).length, 4);
    }),
  );

  it.effect("still writes exactly one row for an include where a rule stands", () =>
    Effect.gen(function* ruleLevel() {
      const { rows } = yield* rowsOf('<xi:include href="a.xml"/>');
      assert.deepStrictEqual(
        of(rows, ruleSchema.XIncludeHref).map((row) => row.value),
        ["a.xml"],
      );
    }),
  );

  it.effect("has an include node per include element in the tree", () =>
    Effect.gen(function* countNodes() {
      const { nodes, rows } = yield* rowsOf(operator('<ma:e><xi:include href="a.xml"/></ma:e>'));
      const [root] = [...nodes.keys()];
      assert.isDefined(root);
      assert.strictEqual(includesOf(root).length, of(rows, ruleSchema.XInclude).length);
    }),
  );
});
