import { schema } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as ud from "#qti/schema/kinds/ud.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as usage from "#qti/schema/usage.ts";
import * as value from "#qti/schema/value.ts";

/**
 * The schema over the modules the usage relations bind and the module itself.
 */
const probe = () =>
  schema(
    "P4UsageProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...value.relations,
      ...usage.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...value.rules,
      ...usage.rules,
    ],
  );

type Statement = (typeof usage.rules)[number];

/**
 * The relation and bindings a statement side selects, or none where it names a relation whole.
 */
const selectionOf = (side: Statement extends infer S ? S : never, which: "left" | "right") => {
  const source: unknown = side.kind === "mirrors" ? side[which].source : undefined;

  return Predicate.hasProperty(source, "relation") && Predicate.hasProperty(source, "bindings")
    ? { bindings: source.bindings, relation: source.relation }
    : undefined;
};

const mirrorsInto = (target: AnyRelation) =>
  usage.rules.flatMap((rule) =>
    rule.kind === "mirrors" && rule.right.source === target ? [rule] : [],
  );

const capacities = () => usage.rules.flatMap((rule) => (rule.kind === "capacity" ? [rule] : []));

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (
  rule: ReturnType<typeof capacities>[number] | undefined,
): readonly [unknown, unknown] | undefined => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
      ? rule.desc.within
      : undefined;

  return within === undefined ? undefined : [within.low, within.high];
};

describe("usage", () => {
  it("builds a schema over the modules it binds without refusal", () => {
    const built = probe();
    for (const name of Object.keys(usage.relations)) {
      assert.isTrue(name in built.relations, name);
    }
  });

  it("holds the seven objectType values and the two statistic kinds", () => {
    assert.deepStrictEqual(
      [...usage.TargetObjectType.handles],
      ["test", "testpart", "section", "item", "outcome", "interaction", "choice"],
    );
    assert.deepStrictEqual([...usage.StatisticKind.handles], ["ordinary", "categorized"]);
  });

  it("mirrors UsageData's document on the Documents of root usagedata", () => {
    const [rule, ...rest] = mirrorsInto(usage.relations.UsageData);
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.kind, "mirrors");

    const left = rule === undefined ? undefined : selectionOf(rule, "left");
    assert.strictEqual(left?.relation, document.relations.Document);
    assert.deepStrictEqual(left?.bindings, { root: "usagedata" });
  });

  it("mirrors each statistic arm on the Statistics of its kind", () => {
    const arms = [
      [usage.relations.OrdinaryStatisticArm, "ordinary"],
      [usage.relations.CategorizedStatisticArm, "categorized"],
    ] as const;
    for (const [arm, kind] of arms) {
      const rules = mirrorsInto(arm);
      assert.strictEqual(rules.length, 1, kind);

      const [rule] = rules;
      const left = rule === undefined ? undefined : selectionOf(rule, "left");
      assert.strictEqual(left?.relation, usage.relations.Statistic, kind);
      assert.deepStrictEqual(left?.bindings, { kind }, kind);
    }
  });

  it("counts each Statistic's target objects as one or more", () => {
    const rows = capacities().filter((rule) => rule.from.source === usage.relations.TargetObject);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0]?.target.source, usage.relations.Statistic);
    assert.deepStrictEqual(boundsOf(rows[0]), [1n, "*"]);
  });

  it("types the statistic context as a URI and its date as a usage date", () => {
    assert.strictEqual(usage.relations.Statistic.fields.context.pattern.source, patterns.anyUri);
    assert.strictEqual(
      usage.relations.StatisticLastUpdated.fields.value.pattern.source,
      patterns.usageDate,
    );
  });

  it("keys every optional-attribute relation by its node, into Statistic", () => {
    const names = [
      "StatisticGlossary",
      "StatisticCaseCount",
      "StatisticStdError",
      "StatisticStdDeviation",
      "StatisticLastUpdated",
    ] as const;
    for (const name of names) {
      assert.deepStrictEqual([...usage.relations[name].primaryKey], ["node"], name);
      assert.isTrue(
        usage.rules.some(
          (rule) =>
            rule.kind === "contained" &&
            rule.left.source === usage.relations[name] &&
            rule.right.source === usage.relations.Statistic,
        ),
        name,
      );
    }
  });

  it("names a node arm for each of the seven ud kinds", () => {
    assert.deepStrictEqual(Object.keys(usage.arms).toSorted(), [...ud.kinds].toSorted());
    assert.strictEqual(usage.arms["ud:value"], usage.relations.UsageValue);
    assert.strictEqual(usage.arms["ud:mapping"], usage.relations.UsageMapping);
    assert.strictEqual(usage.arms["ud:mapEntry"], usage.relations.UsageMapEntry);
  });

  it("bounds the one value of an ordinary statistic and the one mapping of a categorized one", () => {
    const pairs = [
      [usage.relations.UsageValue, "ordinary"],
      [usage.relations.UsageMapping, "categorized"],
    ] as const;
    for (const [from, kind] of pairs) {
      const rows = capacities().filter((rule) => rule.from.source === from);
      assert.strictEqual(rows.length, 1, kind);

      const [row] = rows;
      const source: unknown = row?.target.source;
      const selected = Predicate.hasProperty(source, "relation") ? source.relation : undefined;
      const bindings = Predicate.hasProperty(source, "bindings") ? source.bindings : undefined;
      assert.isTrue(selected === usage.relations.Statistic, kind);
      assert.deepStrictEqual<unknown>(bindings, { kind }, kind);
      assert.deepStrictEqual([...(row?.target.fields ?? [])], ["id"], kind);
      assert.deepStrictEqual([...(row?.from.fields ?? [])], ["statistic"], kind);
      assert.deepStrictEqual(boundsOf(row), [1n, 1n], kind);
    }
  });

  it("holds one or more map entries per mapping", () => {
    const rows = capacities().filter((rule) => rule.from.source === usage.relations.UsageMapEntry);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0]?.target.source, usage.relations.UsageMapping);
    assert.deepStrictEqual(boundsOf(rows[0]), [1n, "*"]);
  });

  it("declares the typed-value alternatives over the eleven base types", () => {
    const [rule, ...rest] = usage.rules.flatMap((candidate) =>
      candidate.kind === "alternatives" ? [candidate] : [],
    );
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.parent, usage.relations.UsageTypedValue);
    assert.strictEqual(rule?.discriminator, "baseType");
    assert.strictEqual(rule?.roster, declaration.relations.BaseType);

    const named = Object.keys(rule?.arms ?? {}).toSorted();
    assert.deepStrictEqual(named, [...declaration.BaseType.handles].toSorted());
    assert.strictEqual(named.length, 11);
    for (const arm of Object.values(rule?.arms ?? {})) {
      assert.isTrue(Object.values(usage.relations).includes(arm));
    }
  });

  it("keys each ud:value relation by the node's id", () => {
    const names = [
      "UsageValue",
      "UsageValueFieldIdentifier",
      "UsageValueBaseType",
      "UsageTypedValue",
    ] as const;
    for (const name of names) {
      assert.deepStrictEqual([...usage.relations[name].primaryKey], ["id"], name);
    }
  });

  it("refuses a padded or trailing-junk float in the typed float arm and admits a bare one", () => {
    const { pattern } = usage.relations.UsageTypedValueFloat.fields.value;
    const float = new RegExp(pattern.source, pattern.flags);
    assert.isTrue(float.test("0.87"));
    assert.isFalse(float.test("0.87x"));
    assert.isFalse(float.test(" 0.87 "));
  });

  it("does not admit a value under a categorized statistic, and admits entity references in one", () => {
    const rows = new Set(ud.admission.map((row) => `${row.parent}|${row.child}`));
    assert.isFalse(rows.has("ud:categorizedStatistic|ud:value"));
    assert.isTrue(rows.has("ud:value|entityRef"));
  });

  it("keeps the declared-default marker and the bound and case-sensitivity leaves under their owners", () => {
    const owners = [
      ["DeclaredDefaultValue", "UsageMapping"],
      ["UsageMappingLowerBound", "UsageMapping"],
      ["UsageMappingUpperBound", "UsageMapping"],
      ["UsageMapEntryCaseSensitive", "UsageMapEntry"],
    ] as const;
    for (const [name, owner] of owners) {
      assert.deepStrictEqual([...usage.relations[name].primaryKey], ["node"], name);
      assert.isTrue(
        usage.rules.some(
          (rule) =>
            rule.kind === "contained" &&
            rule.left.source === usage.relations[name] &&
            rule.right.source === usage.relations[owner],
        ),
        name,
      );
    }
  });
});
