import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { NotQti3 } from "#qti/import/manifest.ts";
import { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { usageRows } from "#qti/import/usage.ts";
import { AttributeLexical, Edge, Tree, TreeRoot } from "#qti/schema/node.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import * as ud from "#qti/schema/usage.ts";
import { materialize, materializePackage } from "#qti/test/fixtures.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * The one row of a list that must hold exactly one.
 */
const only = <T>(list: readonly T[]): T => {
  assert.strictEqual(list.length, 1);

  return Option.getOrThrow(Option.fromNullishOr(list[0]));
};

const packageId = "44444444-4444-4444-8444-444444444444";

/**
 * The text of a usage file of `directory`, after `edit` turns it into the text under test.
 */
const textOf = (directory: string, file: string, edit: (text: string) => string = (t) => t) =>
  Effect.gen(function* readText() {
    const fs = yield* FileSystem.FileSystem;
    const bytes = yield* fs.readFile(path.join(directory, file));

    return edit(new TextDecoder().decode(bytes));
  });

/**
 * The usage rows of `example.xml` of the named fixture after `edit`.
 */
const rowsOf = (name: Parameters<typeof materialize>[0], edit?: (text: string) => string) =>
  Effect.gen(function* usageOf() {
    const directory = yield* materialize(name);
    const text = yield* textOf(directory, "example.xml", edit);
    const doc = yield* readXml(new TextEncoder().encode(text));

    return {
      text,
      ...(yield* usageRows(
        doc,
        {
          package: packageId,
          path: "example.xml",
          resource: "USAGE-TOTAL-TEST-106391",
          resourceType: "qtiusagedata/xml",
          version: "3.0.0",
        },
        Rows.empty(),
      )),
    };
  });

layer(NodeServices.layer, { excludeTestServices: true })("import/usage.ts", (suite) => {
  suite.effect("usage3 yields the counts of the example", () =>
    Effect.gen(function* usage3() {
      const { rows, text } = yield* rowsOf("usage3");
      const mappings = Rows.of(rows, ud.UsageMapping);
      const entries = Rows.of(rows, ud.UsageMapEntry);

      assert.strictEqual(Rows.of(rows, ud.Statistic).length, 26);
      assert.strictEqual(Rows.of(rows, ud.OrdinaryStatisticArm).length, 24);
      assert.strictEqual(Rows.of(rows, ud.CategorizedStatisticArm).length, 2);
      assert.strictEqual(Rows.of(rows, ud.TargetObject).length, 26);
      assert.strictEqual(Rows.of(rows, ud.UsageValue).length, 24);
      assert.strictEqual(Rows.of(rows, ud.UsageTypedValue).length, 0);
      assert.strictEqual(mappings.length, 2);
      assert.deepStrictEqual(
        mappings.map((mapping) => entries.filter((entry) => entry.mapping === mapping.id).length),
        [4, 9],
      );
      assert.strictEqual(
        Rows.of(rows, ud.DeclaredDefaultValue).length,
        [...text.matchAll(/<mapping\b[^>]*\bdefaultValue=/gu)].length,
      );
      assert.strictEqual(Rows.of(rows, ud.TargetObjectPartIdentifier).length, 15);
      assert.strictEqual(Rows.of(rows, ud.StatisticGlossary).length, 5);
      assert.strictEqual(Rows.of(rows, AttributeLexical).length, 0);
    }),
  );

  suite.effect("usage3's document, usage-data row and statistics are bound to the tree", () =>
    Effect.gen(function* usage3Document() {
      const { rows } = yield* rowsOf("usage3");
      const tree = only(Rows.of(rows, Tree));
      const usageData = only(Rows.of(rows, ud.UsageData));

      assert.deepStrictEqual(Rows.of(rows, Document), [
        {
          id: tree.id,
          package: packageId,
          path: "example.xml",
          resource: "USAGE-TOTAL-TEST-106391",
          resourceType: "qtiusagedata/xml",
          root: "usagedata",
          version: "3.0.0",
        },
      ]);
      assert.strictEqual(Rows.of(rows, DocumentIdentifier).length, 0);
      assert.strictEqual(Rows.of(rows, DocumentTitle).length, 0);
      assert.deepStrictEqual(usageData, { document: tree.id, id: tree.id });
      assert.deepStrictEqual(Rows.of(rows, TreeRoot), [{ node: tree.id, tree: tree.id }]);

      const edges = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge]));
      for (const statistic of Rows.of(rows, ud.Statistic)) {
        assert.strictEqual(statistic.usageData, tree.id);
        assert.strictEqual(edges.get(statistic.id)?.position, statistic.position);
      }
      const first = Option.getOrThrow(Option.fromNullishOr(Rows.of(rows, ud.Statistic)[0]));
      assert.deepStrictEqual(first.kind, "ordinary");
      assert.strictEqual(first.name, "AIS");
    }),
  );

  suite.effect("usage3-typed gives every value a typed row and an arm row", () =>
    Effect.gen(function* usage3Typed() {
      const { rows } = yield* rowsOf("usage3-typed");
      const values = Rows.of(rows, ud.UsageValue);
      const typed = Rows.of(rows, ud.UsageTypedValue);
      const arms = [
        ...Rows.of(rows, ud.relations.UsageTypedValueFloat),
        ...Rows.of(rows, ud.relations.UsageTypedValueIdentifier),
      ];

      assert.strictEqual(values.length, 24);
      assert.deepStrictEqual(
        typed.map((row) => row.id).toSorted(),
        values.map((row) => row.id).toSorted(),
      );
      assert.deepStrictEqual(Rows.of(rows, ud.UsageValueBaseType).length, 24);
      assert.strictEqual(arms.length, 24);
      assert.strictEqual(Rows.of(rows, ud.relations.UsageTypedValueFloat).length, 19);
      assert.strictEqual(Rows.of(rows, ud.relations.UsageTypedValueIdentifier).length, 5);
      for (const row of typed) {
        const value = values.find((candidate) => candidate.id === row.id)?.value;
        assert.strictEqual(row.value, value);
        assert.strictEqual(arms.find((arm) => arm.id === row.id)?.value, value);
      }
    }),
  );

  suite.effect("usage3-padded keeps the lexical forms where processing changed them", () =>
    Effect.gen(function* usage3Padded() {
      const { rows } = yield* rowsOf("usage3-padded");
      const lexical = Rows.of(rows, AttributeLexical);
      const statistic = Option.getOrThrow(Option.fromNullishOr(Rows.of(rows, ud.Statistic)[0]));
      const entry = Option.getOrThrow(Option.fromNullishOr(Rows.of(rows, ud.UsageMapEntry)[0]));

      assert.strictEqual(lexical.length, 2);
      assert.deepStrictEqual(
        lexical.find((row) => row.node === statistic.id),
        { attribute: "name", kind: "ud:ordinaryStatistic", node: statistic.id, value: " AIS " },
      );
      assert.strictEqual(statistic.name, "AIS");
      assert.deepStrictEqual(
        lexical.find((row) => row.node === entry.id),
        { attribute: "mapKey", kind: "ud:mapEntry", node: entry.id, value: "a\tb" },
      );
      assert.strictEqual(entry.mapKey, "a b");
      assert.strictEqual(
        Rows.of(rows, ud.TargetObject).find((row) => row.identifier === " item1 ")?.identifier,
        " item1 ",
      );
      assert.strictEqual(
        Rows.of(rows, ud.UsageValue).find((row) => row.value === " 0.87 ")?.collapsed,
        "0.87",
      );
      assert.strictEqual(Rows.of(rows, ud.UsageTypedValue).length, 0);
    }),
  );

  suite.effect("a usage-data file of the 2.2 namespace is NotQti3", () =>
    Effect.gen(function* corpusUsage() {
      const directory = yield* materializePackage("usageData");
      const fs = yield* FileSystem.FileSystem;
      const file = (yield* fs.readDirectory(directory))
        .toSorted()
        .find((name) => /^USAGE-.*\.xml$/u.test(name));
      const text = yield* textOf(directory, file ?? "missing.xml");
      const doc = yield* readXml(new TextEncoder().encode(text));
      const failure = yield* Effect.flip(
        usageRows(
          doc,
          {
            package: packageId,
            path: "x.xml",
            resource: "R",
            resourceType: "qtiusagedata/xml",
            version: "3.0.0",
          },
          Rows.empty(),
        ),
      );

      assert.instanceOf(failure, NotQti3);
      assert.include(failure.detail, "imsqti_usagedata_v2p2");
    }),
  );

  suite.effect("an objectType outside the roster is UnmodeledVocabulary", () =>
    Effect.gen(function* badObjectType() {
      const failure = yield* Effect.flip(
        rowsOf("usage3", (text) =>
          text.replace(
            '<targetObject identifier="Item_VB123456"/>',
            '<targetObject identifier="Item_VB123456" objectType="Item"/>',
          ),
        ),
      );

      assert.instanceOf(failure, UnmodeledVocabulary);
      assert.deepStrictEqual(
        failure,
        new UnmodeledVocabulary({
          kind: "attribute",
          name: "objectType",
          parent: Option.some("targetObject"),
        }),
      );
    }),
  );
});
