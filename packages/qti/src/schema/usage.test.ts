import { schema } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as document from "#qti/schema/document.ts";
import * as ud from "#qti/schema/kinds/ud.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as usage from "#qti/schema/usage.ts";

/**
 * The schema over the modules the usage relations bind and the module itself.
 */
const probe = () =>
  schema(
    "P4UsageProbe",
    { ...node.relations, ...pkg.relations, ...document.relations, ...usage.relations },
    [...node.rules, ...pkg.rules, ...document.rules, ...usage.rules],
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

  it("names a node arm for each of its four kinds, all of them ud kinds", () => {
    assert.deepStrictEqual(Object.keys(usage.arms).toSorted(), [
      "ud:categorizedStatistic",
      "ud:ordinaryStatistic",
      "ud:targetObject",
      "ud:usageData",
    ]);

    const kinds: readonly string[] = ud.kinds;
    for (const handle of Object.keys(usage.arms)) {
      assert.isTrue(kinds.includes(handle), handle);
    }
  });
});
