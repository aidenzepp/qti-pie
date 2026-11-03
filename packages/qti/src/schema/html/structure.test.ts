import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option, Predicate } from "effect";
import { entryOf } from "#qti/schema/content/xsd-inventory.ts";
import * as structure from "#qti/schema/html/structure.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The 20 handles of spec 4.8's V05 column.
 */
const handles =
  "br caption col colgroup details dl figcaption figure hr ol rtc ruby table tbody td tfoot th thead tr ul".split(
    " ",
  );

/**
 * The optional-attribute relations, each with its arm and the pattern of its value.
 */
const optional = [
  ["TableSummary", "Table", patterns.xsString],
  ["ColSpan", "Col", patterns.positiveInteger],
  ["ColgroupSpan", "Colgroup", patterns.positiveInteger],
  ["TdAbbr", "Td", patterns.xsString],
  ["TdAxis", "Td", patterns.xsString],
  ["TdRowspan", "Td", patterns.positiveInteger],
  ["TdColspan", "Td", patterns.positiveInteger],
  ["ThAbbr", "Th", patterns.xsString],
  ["ThAxis", "Th", patterns.xsString],
  ["ThRowspan", "Th", patterns.positiveInteger],
  ["ThColspan", "Th", patterns.positiveInteger],
] as const;

/**
 * The optional-attribute relations whose value is a closed roster, each with its arm and the
 * roster's name.
 */
const closedOptional = [
  ["DetailsOpen", "Details", "XsBoolean"],
  ["TdScope", "Td", "CellScope"],
  ["TdAlign", "Td", "CellAlign"],
  ["TdValign", "Td", "CellValign"],
  ["ThScope", "Th", "CellScope"],
  ["ThAlign", "Th", "CellAlign"],
  ["ThValign", "Th", "CellValign"],
] as const;

/**
 * The capacities of spec 4.8 and 4.11: the counted child kind, the parent relation's name, and the
 * inclusive bounds.
 */
const expectedCapacities = [
  ["caption", "Table", 0n, 1n],
  ["thead", "Table", 0n, 1n],
  ["tfoot", "Table", 0n, 1n],
  ["summary", "Details", 1n, 1n],
  ["col", "ColgroupSpan", 0n, 0n],
] as const;

/**
 * A relation that is the source of one of this module's containments.
 */
type Source = Extract<(typeof structure.rules)[number], { kind: "contained" }>["left"]["source"];

/**
 * The containments `rules` declares from `source`, each as the source fields, the target relation
 * and the target fields.
 */
const containments = (rules: typeof structure.rules, source: Source) =>
  rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === source
      ? [[[...rule.left.fields], rule.right.source, [...rule.right.fields]] as const]
      : [],
  );

/**
 * The capacity statements of this module.
 */
const capacities = () =>
  structure.rules.flatMap((rule) => (rule.kind === "capacity" ? [rule] : []));

type Capacity = ReturnType<typeof capacities>[number];

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: Capacity): readonly [unknown, unknown] => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
      ? rule.desc.within
      : undefined;

  assert.isDefined(within, "capacity description");

  return [within.low, within.high];
};

/**
 * The child kind a capacity counts, when its source selects `Edge` on `childKind` alone.
 */
const childKindOf = (rule: Capacity): string | undefined => {
  const source: unknown = rule.from.source;

  return Predicate.hasProperty(source, "relation") &&
    source.relation === node.relations.Edge &&
    Predicate.hasProperty(source, "bindings") &&
    Predicate.hasProperty(source.bindings, "childKind") &&
    Object.keys(source.bindings).length === 1
    ? String(source.bindings.childKind)
    : undefined;
};

describe("html/structure", () => {
  it("keys 20 arms by the V05 handles", () => {
    assert.strictEqual(handles.length, 20);
    assert.deepStrictEqual(Object.keys(structure.arms).toSorted(), handles.toSorted());
  });

  it("names every handle a NodeKind and gives its arm a single id key", () => {
    for (const [handle, arm] of Object.entries(structure.arms)) {
      assert.include(node.relations.NodeKind.handles, handle);
      assert.deepStrictEqual([...arm.primaryKey], ["id"]);
    }
  });

  it("gives each arm exactly the own attributes the inventory lists as required", () => {
    for (const [handle, arm] of Object.entries(structure.arms)) {
      const entry = entryOf(handle);

      assert.isTrue(Option.isSome(entry), handle);

      const own = Option.getOrThrow(entry).attributes.filter((a) => a.family === "own");
      const required = own.filter((a) => a.use === "required").map((a) => a.name);
      assert.deepStrictEqual(Object.keys(arm.fields), ["id", ...required].toSorted(), handle);
    }
  });

  it("holds an optional attribute as a node-keyed row contained into its arm", () => {
    for (const [name, arm, pattern] of optional) {
      const relation = structure.relations[name];
      assert.deepStrictEqual([...relation.primaryKey], ["node"], name);
      assert.deepStrictEqual(Object.keys(relation.fields), ["node", "value"], name);
      assert.strictEqual(relation.fields.value.pattern.source, pattern, name);
      assert.deepStrictEqual(containments(structure.rules, relation), [
        [["node"], structure.relations[arm], ["id"]],
      ]);
    }
  });

  it("holds a closed optional attribute as a node-keyed row over its roster", () => {
    for (const [name, arm, roster] of closedOptional) {
      const relation = structure.relations[name];
      assert.deepStrictEqual([...relation.primaryKey], ["node"], name);
      assert.deepStrictEqual(Object.keys(relation.fields), ["node", "value"], name);
      assert.strictEqual(relation.fields.value.roster.name, roster, name);
      assert.deepStrictEqual(containments(structure.rules, relation), [
        [["node"], structure.relations[arm], ["id"]],
      ]);
    }
  });

  it("holds the five capacities, each with its bounds", () => {
    const found = capacities().map((rule) => [
      childKindOf(rule),
      rule.target.source,
      ...boundsOf(rule),
    ]);

    assert.deepStrictEqual(
      found,
      expectedCapacities.map(([kind, parent, low, high]) => [
        kind,
        structure.relations[parent],
        low,
        high,
      ]),
    );

    for (const rule of capacities()) {
      assert.deepStrictEqual([...rule.from.fields], ["parent"], "counts the edges of the parent");
    }
  });

  it("builds a probe schema over node.relations and structure.relations", () => {
    const probe = schema("HtmlStructureProbe", { ...node.relations, ...structure.relations }, [
      ...node.rules,
      ...structure.rules,
    ]);
    for (const name of Object.keys(structure.relations)) {
      assert.property(probe.relations, name);
    }
    assert.strictEqual(
      Object.keys(structure.relations).length,
      20 + optional.length + closedOptional.length,
    );
  });
});
