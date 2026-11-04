import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { usageGuards } from "#qti/import/guards/usage.ts";
import { judgedLater } from "#qti/import/judged.ts";
import { NotQti3 } from "#qti/import/manifest.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { usageRows } from "#qti/import/usage.ts";
import {
  ManifestIdentifier,
  PackagePath,
  UsageMappingScore,
  UsageValueToken,
} from "#qti/schema/contracts.ts";
import { AttributeLexical, Edge, Tree, TreeRoot } from "#qti/schema/node.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import * as ud from "#qti/schema/usage.ts";
import { materialize, materializePackage } from "#qti/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

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

/**
 * `rows` with `relation`'s rows replaced by `change` of them.
 */
const changed = <R extends AnyRelation>(
  rows: Rows,
  relation: R,
  change: (facts: readonly Fact<R>[]) => readonly Fact<R>[],
): Rows => new Map(rows).set(relation, change(Rows.of(rows, relation)));

/**
 * The refusal the usage guards give `rows`, failing the test when they pass.
 */
const refusal = (rows: Rows) =>
  Effect.gen(function* refused() {
    const failure = yield* Effect.flip(usageGuards(rows));

    return failure;
  });

/**
 * An edit that writes `name="value"` on the document's first `mapping` element.
 */
const onMapping = (name: string, value: string) => (text: string) =>
  text.replace(/<mapping\b[^>]*>/u, (tag) =>
    tag
      .replace(new RegExp(`\\s${name}="[^"]*"`, "u"), "")
      .replace("<mapping", `<mapping ${name}="${value}"`),
  );

const firstOf = <T>(list: readonly T[]): T => Option.getOrThrow(Option.fromNullishOr(list[0]));

/**
 * The schema's containment: every `UsageTypedValue(id, value)` has a `UsageValue(id, value)`.
 */
const assertContained = (rows: Rows): void => {
  const values = Rows.of(rows, ud.UsageValue);
  for (const typed of Rows.of(rows, ud.UsageTypedValue)) {
    assert.isTrue(values.some((row) => row.id === typed.id && row.value === typed.value));
  }
};

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
          path: PackagePath("example.xml"),
          resource: ManifestIdentifier("USAGE-TOTAL-TEST-106391"),
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

  suite.effect("usage3's and usage3-padded's rows pass", () =>
    Effect.gen(function* controls() {
      for (const name of ["usage3", "usage3-padded", "usage3-typed"] as const) {
        const { rows } = yield* rowsOf(name);
        yield* usageGuards(rows);
      }
    }),
  );

  suite.effect("a value before a target object is refused as ordering", () =>
    Effect.gen(function* valueFirst() {
      const { rows } = yield* rowsOf("usage3");
      const value = firstOf(Rows.of(rows, ud.UsageValue));
      const target = firstOf(
        Rows.of(rows, ud.TargetObject).filter((row) => row.statistic === value.statistic),
      );
      const positions = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.position]));
      const swapped = changed(rows, Edge, (edges) =>
        edges.map((edge) => {
          if (edge.child === value.id) {
            return { ...edge, position: positions.get(target.id) ?? 0n };
          }

          return edge.child === target.id
            ? { ...edge, position: positions.get(value.id) ?? 0n }
            : edge;
        }),
      );
      const failure = yield* refusal(swapped);

      assert.strictEqual(failure.rule, "ordering");
      assert.include(failure.detail, value.statistic);
    }),
  );

  suite.effect("a mapping before a target object is refused as ordering", () =>
    Effect.gen(function* mappingFirst() {
      const { rows } = yield* rowsOf("usage3");
      const mapping = firstOf(Rows.of(rows, ud.UsageMapping));
      const target = firstOf(
        Rows.of(rows, ud.TargetObject).filter((row) => row.statistic === mapping.statistic),
      );
      const positions = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.position]));
      const swapped = changed(rows, Edge, (edges) =>
        edges.map((edge) => {
          if (edge.child === mapping.id) {
            return { ...edge, position: positions.get(target.id) ?? 0n };
          }

          return edge.child === target.id
            ? { ...edge, position: positions.get(mapping.id) ?? 0n }
            : edge;
        }),
      );

      assert.strictEqual((yield* refusal(swapped)).rule, "ordering");
    }),
  );

  suite.effect("usage3-feb-30 is refused as calendar though its pattern admits it", () =>
    Effect.gen(function* feb30() {
      const { rows } = yield* rowsOf("usage3-feb-30");
      const failure = yield* refusal(rows);

      assert.strictEqual(failure.rule, "calendar");
      assert.include(failure.detail, "2004-02-30");
    }),
  );

  suite.effect("a date is real by month length and leap year", () =>
    Effect.gen(function* calendar() {
      const { rows } = yield* rowsOf("usage3");
      const statistic = firstOf(Rows.of(rows, ud.Statistic));
      const dated = (value: string) =>
        changed(rows, ud.StatisticLastUpdated, () => [{ node: statistic.id, value }]);

      for (const real of ["2004-02-29", "2000-02-29", "2003-02-28", "2003-04-30", "2003-12-31"]) {
        yield* usageGuards(dated(real));
      }

      for (const unreal of ["2003-02-29", "2100-02-29", "2004-04-31", "2004-06-31", "2004-09-31"]) {
        const failure = yield* refusal(dated(unreal));

        assert.strictEqual(failure.rule, "calendar");
        assert.include(failure.detail, unreal);
      }
    }),
  );

  suite.effect("a value disagreeing with its text children is refused as text-copy", () =>
    Effect.gen(function* valueText() {
      const { rows } = yield* rowsOf("usage3");
      const first = firstOf(Rows.of(rows, ud.UsageValue));
      const edited = changed(rows, ud.UsageValue, (values) =>
        values.map((row) => (row.id === first.id ? { ...row, value: `${row.value}9` } : row)),
      );
      const failure = yield* refusal(edited);

      assert.strictEqual(failure.rule, "text-copy");
      assert.include(failure.detail, first.id);
    }),
  );

  suite.effect("a collapsed form that is not the collapse of the value is text-copy", () =>
    Effect.gen(function* collapsedText() {
      const { rows } = yield* rowsOf("usage3-padded");
      const padded = firstOf(Rows.of(rows, ud.UsageValue).filter((row) => row.value === " 0.87 "));
      const edited = changed(rows, ud.UsageValue, (values) =>
        values.map((row) =>
          row.id === padded.id ? { ...row, collapsed: UsageValueToken(padded.value) } : row,
        ),
      );

      assert.strictEqual((yield* refusal(edited)).rule, "text-copy");
    }),
  );

  suite.effect("a mapping default that is not its written defaultValue is typed-copy", () =>
    Effect.gen(function* defaultValue() {
      const { rows } = yield* rowsOf("usage3");
      const declared = new Set(Rows.of(rows, ud.DeclaredDefaultValue).map((row) => row.node));
      const written = Option.getOrThrow(
        Option.fromNullishOr(Rows.of(rows, ud.UsageMapping).find((row) => declared.has(row.id))),
      );
      const padded = Rows.add(rows, AttributeLexical, [
        {
          attribute: "defaultValue",
          kind: "ud:mapping",
          node: written.id,
          value: ` ${written.defaultValue} `,
        },
      ]);

      yield* usageGuards(padded);

      const edited = changed(padded, ud.UsageMapping, (list) =>
        list.map((row) =>
          row.id === written.id ? { ...row, defaultValue: UsageMappingScore("1") } : row,
        ),
      );
      const failure = yield* refusal(edited);

      assert.strictEqual(failure.rule, "typed-copy");
      assert.include(failure.detail, written.id);
    }),
  );

  suite.effect("an undeclared default other than 0 is typed-copy", () =>
    Effect.gen(function* undeclared() {
      const { rows } = yield* rowsOf("usage3");
      const mapping = firstOf(Rows.of(rows, ud.UsageMapping));
      const stripped = changed(rows, ud.DeclaredDefaultValue, (list) =>
        list.filter((row) => row.node !== mapping.id),
      );
      const edited = changed(stripped, ud.UsageMapping, (list) =>
        list.map((row) =>
          row.id === mapping.id ? { ...row, defaultValue: UsageMappingScore("1") } : row,
        ),
      );

      assert.strictEqual((yield* refusal(edited)).rule, "typed-copy");
    }),
  );

  suite.effect("a typed value disagreeing with its value is typed-copy", () =>
    Effect.gen(function* typedValue() {
      const { rows } = yield* rowsOf("usage3-typed");
      const typed = firstOf(Rows.of(rows, ud.UsageTypedValue));
      const edited = changed(rows, ud.UsageTypedValue, (list) =>
        list.map((row) => (row.id === typed.id ? { ...row, value: `${row.value}1` } : row)),
      );
      const arm = firstOf(Rows.of(rows, ud.relations.UsageTypedValueFloat));
      const armEdited = changed(rows, ud.relations.UsageTypedValueFloat, (list) =>
        list.map((row) =>
          row.id === arm.id
            ? { ...row, value: judgedLater<typeof row.value>(`${row.value}1`) }
            : row,
        ),
      );

      assert.strictEqual((yield* refusal(edited)).rule, "typed-copy");
      assert.strictEqual((yield* refusal(armEdited)).rule, "typed-copy");
    }),
  );

  suite.effect("a lexical row equal to its column is typed-copy", () =>
    Effect.gen(function* lexicalEqual() {
      const { rows } = yield* rowsOf("usage3");
      const statistic = firstOf(Rows.of(rows, ud.Statistic));
      const edited = Rows.add(rows, AttributeLexical, [
        {
          attribute: "name",
          kind: "ud:ordinaryStatistic",
          node: statistic.id,
          value: statistic.name,
        },
      ]);
      const failure = yield* refusal(edited);

      assert.strictEqual(failure.rule, "typed-copy");
      assert.include(failure.detail, statistic.id);
    }),
  );

  suite.effect("a lexical row that does not process to its column is typed-copy", () =>
    Effect.gen(function* lexicalWrong() {
      const { rows } = yield* rowsOf("usage3-padded");
      const edited = changed(rows, AttributeLexical, (list) =>
        list.map((row) => (row.attribute === "name" ? { ...row, value: " OTHER " } : row)),
      );

      assert.strictEqual((yield* refusal(edited)).rule, "typed-copy");
    }),
  );

  suite.effect("a map key holding a tab, line feed or carriage return is typed-copy", () =>
    Effect.gen(function* mapKey() {
      const { rows } = yield* rowsOf("usage3");
      const entry = firstOf(Rows.of(rows, ud.UsageMapEntry));

      for (const bad of ["a\tb", "a\nb", "a\rb"]) {
        const edited = changed(rows, ud.UsageMapEntry, (list) =>
          list.map((row) => (row.id === entry.id ? { ...row, mapKey: bad } : row)),
        );

        assert.strictEqual((yield* refusal(edited)).rule, "typed-copy");
      }
    }),
  );

  suite.effect("a typed boolean value outside true and false is refused usage-typed-value", () =>
    Effect.gen(function* typedBoolean() {
      const failure = yield* Effect.flip(
        rowsOf("usage3", (text) =>
          text.replace("<value>0.87</value>", '<value baseType="boolean">yes</value>'),
        ),
      );

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "usage-typed-value");
    }),
  );

  suite.effect("a typed boolean value of true is written in its arm", () =>
    Effect.gen(function* typedTrue() {
      const { rows } = yield* rowsOf("usage3", (text) =>
        text.replace("<value>0.87</value>", '<value baseType="boolean">true</value>'),
      );

      assert.deepStrictEqual(
        Rows.of(rows, ud.relations.UsageTypedValueBoolean).map((row) => row.value),
        ["true"],
      );
    }),
  );

  suite.effect("a typed value's element text is read trimmed, a string's is kept", () =>
    Effect.gen(function* paddedTyped() {
      const { rows } = yield* rowsOf("usage3", (text) =>
        text.replace("<value>0.87</value>", '<value baseType="boolean"> true </value>'),
      );
      const stringRows = (yield* rowsOf("usage3", (text) =>
        text.replace("<value>0.87</value>", '<value baseType="string"> a </value>'),
      )).rows;

      assert.deepStrictEqual(
        Rows.of(rows, ud.relations.UsageTypedValueBoolean).map((row) => row.value),
        ["true"],
      );
      assert.deepStrictEqual(
        Rows.of(stringRows, ud.relations.UsageTypedValueString).map((row) => row.value),
        [" a "],
      );
      assert.deepStrictEqual(
        Rows.of(rows, ud.UsageTypedValue).map((row) => row.value),
        [" true "],
      );
      assertContained(rows);
      assertContained(stringRows);
      yield* usageGuards(rows);
      yield* usageGuards(stringRows);
    }),
  );

  suite.effect(
    "a padded float's arm holds it trimmed; its UsageTypedValue copies its UsageValue",
    () =>
      Effect.gen(function* paddedFloat() {
        const { rows } = yield* rowsOf("usage3-float-padded");
        const value = firstOf(Rows.of(rows, ud.UsageValue));
        const typed = firstOf(Rows.of(rows, ud.UsageTypedValue));
        const arm = firstOf(Rows.of(rows, ud.relations.UsageTypedValueFloat));
        const armEdited = changed(rows, ud.relations.UsageTypedValueFloat, (list) =>
          list.map((row) =>
            row.id === arm.id ? { ...row, value: judgedLater<typeof row.value>(" 0.87 ") } : row,
          ),
        );
        const typedEdited = changed(rows, ud.UsageTypedValue, (list) =>
          list.map((row) =>
            row.id === typed.id ? { ...row, value: judgedLater<typeof row.value>("0.87") } : row,
          ),
        );

        assert.strictEqual(arm.value, "0.87");
        assert.strictEqual(typed.value, " 0.87 ");
        assert.strictEqual(value.value, " 0.87 ");
        assert.strictEqual(value.collapsed, "0.87");
        assertContained(rows);
        yield* usageGuards(rows);
        assert.strictEqual((yield* refusal(armEdited)).rule, "typed-copy");
        assert.strictEqual((yield* refusal(typedEdited)).rule, "typed-copy");
      }),
  );

  suite.effect("an outer-padded ud:mapping or ud:mapEntry score attribute is usage-lexical", () =>
    Effect.gen(function* paddedScores() {
      const edits = [
        (text: string) => text.replace('mappedValue="412.5267"', 'mappedValue=" 412.5267"'),
        onMapping("defaultValue", " 0"),
        onMapping("lowerBound", "1 "),
        onMapping("upperBound", "&#9;1"),
      ];

      for (const edit of edits) {
        const failure = yield* Effect.flip(rowsOf("usage3", edit));

        assert.instanceOf(failure, ImportRefused);
        assert.strictEqual(failure.rule, "usage-lexical");
      }
    }),
  );

  suite.effect("usage3-padded's tab inside a mapKey is still admitted", () =>
    Effect.gen(function* tabbedKey() {
      const { rows } = yield* rowsOf("usage3-padded");

      assert.isTrue(Rows.of(rows, ud.UsageMapEntry).some((row) => row.mapKey === "a b"));
    }),
  );

  suite.effect("a caseSensitive outside xs:boolean is refused attribute-lexical", () =>
    Effect.gen(function* strayCaseSensitive() {
      const failure = yield* Effect.flip(
        rowsOf("usage3", (text) =>
          text.replace('<mapEntry mapKey="d1"', '<mapEntry caseSensitive="maybe" mapKey="d1"'),
        ),
      );

      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "attribute-lexical");
    }),
  );

  suite.effect("a padded caseSensitive collapses to its handle", () =>
    Effect.gen(function* paddedCaseSensitive() {
      const { rows } = yield* rowsOf("usage3", (text) =>
        text.replace('<mapEntry mapKey="d1"', '<mapEntry caseSensitive=" true " mapKey="d1"'),
      );

      assert.deepStrictEqual(
        Rows.of(rows, ud.UsageMapEntryCaseSensitive).map((row) => row.value),
        ["true"],
      );
    }),
  );
});
