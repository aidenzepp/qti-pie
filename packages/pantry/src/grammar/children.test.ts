import { globSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import {
  capacityMap,
  childSets,
  childStatements,
  guardStatements,
} from "#pantry/grammar/children.ts";
import type {
  ChildStatement,
  ChildSets,
  Kinds,
  ParentLaws,
  Vocabulary,
} from "#pantry/grammar/children.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import { r30Asserts } from "#pantry/schema/metadata.ts";

/**
 * Today's eleven vocabularies, in the order the `NodeKind` and `AttributeName` rosters compose
 * them.
 */
const modules = [generic, asi, html, cp, lom, qmd, cpx, drd, csmd, ud, xi] as const;

/**
 * The vocabularies as the generator reads them.
 */
const vocabularies: readonly Vocabulary[] = modules;

/**
 * The two schema versions, in code order.
 */
const versions = ["3.0.0", "3.0.1"] as const;

/**
 * The `NodeKind` roster at today's composition, K = 363.
 */
const kinds = modules.flatMap((module): readonly string[] => module.kinds);

/**
 * The `AttributeName` roster at today's composition: each name once, at its first vocabulary.
 */
const attributes = [...new Set(modules.flatMap((module): readonly string[] => module.attributes))];

/**
 * The registry rows of every kind, for element tests and local names.
 */
const registry = new Map(vocabularies.flatMap(({ registry: rows }) => Object.entries(rows)));

/**
 * Generate the child-set relations of today's composition from some statements.
 *
 * @param statements - The statements.
 * @returns The relations, or the reason they have none.
 */
const generate = (statements: readonly ChildStatement[]) =>
  childSets({ attributes, kinds, statements, versions, vocabularies });

/**
 * The child-set relations of today's composition and statements.
 */
const generated = generate(childStatements);

/**
 * The relations of today's composition, failing the test that reads them when there are none.
 */
const sets = Effect.fromResult(generated);

/**
 * A parent's children in source order, and the attribute names the parent carries.
 */
interface Family {
  readonly attrs: readonly string[];
  readonly children: readonly string[];
}

/**
 * Judge a family by the child-set laws, as N7 spells them over the folded sets: `childKinds`, the
 * positions held, and `childTwos`, the positions held twice, by `twos = twos | (kinds & x)` before
 * `kinds = kinds | x`.
 *
 * @param laws - The parent's laws.
 * @param family - The family.
 * @returns The relation of each law the family breaks, none when it holds.
 */
const judge = (laws: ParentLaws, family: Family): readonly string[] => {
  const held = new Set<number>();
  const twice = new Set<number>();
  for (const child of family.children) {
    const position = laws.positions.get(child);
    if (position === undefined) {
      return [`unadmitted ${child}`];
    }

    if (held.has(position)) {
      twice.add(position);
    }

    held.add(position);
  }

  const hits = (mask: ReadonlySet<number>): number =>
    [...mask].filter((position) => held.has(position)).length;
  const barred = Option.exists(
    laws.barredBy,
    ({ name, position }) => family.attrs.includes(name) && held.has(position),
  );

  return [
    ...([...laws.required].every((position) => held.has(position)) ? [] : ["ChildRequired"]),
    ...(laws.anyOf.every((mask) => mask.size === 0 || hits(mask) > 0) ? [] : ["ChildAnyOf"]),
    ...(laws.exclusive.every((mask) => hits(mask) <= 1) ? [] : ["ChildExclusive"]),
    ...([...laws.atMostOnce].every((position) => !twice.has(position)) ? [] : ["ChildAtMostOnce"]),
    ...(barred ? ["ChildBarredBy"] : []),
  ];
};

/**
 * Judge a family of children under a parent with no attributes.
 *
 * @param all - The relations.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param children - The children in order.
 * @returns The laws the family breaks.
 */
const judged = (
  all: ChildSets,
  version: SchemaVersionHandle,
  parent: string,
  children: readonly string[],
): readonly string[] => judge(all.lawsOf(version, parent), { attrs: [], children });

/**
 * Build the least family the parent's laws accept: one child of the first kind at each required
 * position, and one for each `anyOf` slot no earlier child meets.
 *
 * @param laws - The parent's laws.
 * @returns The children.
 */
const leastFamily = (laws: ParentLaws): readonly string[] => {
  const firstAt = (position: number): readonly string[] => {
    const found = [...laws.positions].find(([, at]) => at === position);

    return found === undefined ? [] : [found[0]];
  };
  const required = [...laws.required].toSorted((a, b) => a - b).flatMap(firstAt);
  const met = new Set(required.map((kind) => laws.positions.get(kind)));
  const anyOf = laws.anyOf
    .filter((mask) => ![...mask].some((position) => met.has(position)))
    .flatMap((mask) => [...mask].slice(0, 1).flatMap(firstAt));

  return [...required, ...anyOf];
};

/**
 * Resolve a statement's members under one parent: its named kinds, or every element the parent
 * admits.
 *
 * @param statement - The statement.
 * @param laws - The parent's laws.
 * @returns The kinds.
 */
const membersOf = (statement: ChildStatement, laws: ParentLaws): readonly string[] => {
  const { law } = statement;
  if (law.law === "exclusive") {
    return law.alternatives.flat();
  }

  if (law.law === "barredBy") {
    return law.kinds;
  }

  return law.members.of === "kinds"
    ? law.members.kinds
    : [...laws.positions.keys()].filter((kind) => (registry.get(kind)?.local ?? "") !== "");
};

/**
 * Find what a statement's laws fail to do under one parent, beside the least family the parent's
 * laws accept: refuse the family without a required member, refuse a member twice or two members
 * of a union counted at most once, refuse two alternatives, and refuse a barred child under its
 * attribute, while admitting the family with one member.
 *
 * @param all - The relations.
 * @param statement - The statement.
 * @param version - The version it is read in.
 * @param parent - The parent it is read under.
 * @returns A sentence for each thing the laws get wrong, none when they state the statement.
 */
const misses = (
  all: ChildSets,
  statement: ChildStatement,
  version: SchemaVersionHandle,
  parent: string,
): readonly string[] => {
  const laws = all.lawsOf(version, parent);
  const least = leastFamily(laws);
  const members = membersOf(statement, laws);
  const [first = "", second = first] = members;
  const without = least.filter((kind) => !members.includes(kind));
  const where = `${statement.source} under ${parent} in ${version}`;
  const accepts = (children: readonly string[], attrs: readonly string[]) =>
    judge(laws, { attrs, children }).length === 0;
  const { law } = statement;
  const expectations: readonly (readonly [boolean, string])[] = [
    [accepts(least, []), `${where}: the least family is refused`],
    ...(law.law === "atLeastOne" || law.law === "exactlyOne"
      ? [[!accepts(without, []), `${where}: a family with no member is admitted`] as const]
      : []),
    ...(law.law === "atMostOne" || law.law === "exactlyOne"
      ? [
          [
            accepts([...without, first], []),
            `${where}: a family with one member is refused`,
          ] as const,
          [
            !accepts([...without, first, first], []),
            `${where}: two ${first} are admitted`,
          ] as const,
          [
            !accepts([...without, first, second], []),
            `${where}: ${first} and ${second} are admitted`,
          ] as const,
        ]
      : []),
    ...(law.law === "exclusive"
      ? [
          [
            accepts([...least, law.alternatives[0][0]], []),
            `${where}: one alternative is refused`,
          ] as const,
          [
            !accepts([...least, law.alternatives[0][0], law.alternatives[1][0]], []),
            `${where}: two alternatives are admitted`,
          ] as const,
        ]
      : []),
    ...(law.law === "barredBy"
      ? [
          [
            accepts([...least, first], []),
            `${where}: ${first} is refused without ${law.name}`,
          ] as const,
          [
            !accepts([...least, first], [law.name]),
            `${where}: ${first} is admitted with ${law.name}`,
          ] as const,
        ]
      : []),
  ];

  return expectations.flatMap(([holds, miss]) => (holds ? [] : [miss]));
};

describe("the capacity map", () => {
  it("holds the 56 uses, numbered from 1 within each module", () => {
    const ordinals = Map.groupBy(capacityMap, ({ id }) => id.split("#")[0] ?? "");

    assert.strictEqual(capacityMap.length, 56);
    for (const [module, uses] of ordinals) {
      assert.deepStrictEqual(
        uses.map(({ id }) => id),
        uses.map((_, index) => `${module}#${index + 1}`),
      );
    }
  });

  it("keeps 31 uses as set laws and names an owner for each of the other 25", () => {
    const forms = Map.groupBy(capacityMap, ({ becomes }) => becomes.as);
    const sizes = Object.fromEntries([...forms].map(([form, uses]) => [form, uses.length]));

    assert.deepStrictEqual(sizes, {
      containment: 1,
      "counted family": 8,
      key: 2,
      "key and containment": 14,
      "set law": 31,
    });
    for (const { becomes, id } of capacityMap) {
      if (becomes.as === "set law") {
        assert.isAbove(becomes.rules.length, 0, id);
      } else {
        assert.isAbove(becomes.owner.length, 0, id);
        assert.isAbove(becomes.law.length, 0, id);
      }
    }
  });

  it.effect("states every set law and every guard as its relations' rows", () =>
    Effect.gen(function* everyStatement() {
      const all = yield* sets;
      const missed = childStatements.flatMap((statement) =>
        statement.versions.flatMap((version) =>
          statement.parents.flatMap((parent) => misses(all, statement, version, parent)),
        ),
      );

      assert.deepStrictEqual(missed, []);
      assert.strictEqual(childStatements.length, 110 + guardStatements.length);
    }),
  );
});

describe("the guards' fixtures", () => {
  it.effect("admits a 3.0.1 table's tbody or tr children, never both, and both in 3.0.0", () =>
    Effect.gen(function* tableBodies() {
      const all = yield* sets;

      assert.deepStrictEqual(judged(all, "3.0.1", "table", ["tbody", "tr"]), ["ChildExclusive"]);
      assert.deepStrictEqual(judged(all, "3.0.1", "table", ["tbody", "ws", "tbody"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "table", ["tr", "tr"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "table", []), []);
      assert.deepStrictEqual(judged(all, "3.0.0", "table", ["tbody", "tr"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "table", ["caption", "tr", "caption"]), [
        "ChildAtMostOnce",
      ]);
    }),
  );

  it.effect("refuses an item body with no element child (body-empty)", () =>
    Effect.gen(function* emptyBody() {
      const all = yield* sets;

      assert.deepStrictEqual(judged(all, "3.0.1", "qti-item-body", ["ws"]), ["ChildRequired"]);
      assert.deepStrictEqual(judged(all, "3.0.0", "qti-item-body", ["comment", "pi"]), [
        "ChildRequired",
      ]);
      assert.deepStrictEqual(judged(all, "3.0.1", "qti-item-body", ["ws", "p", "ws"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "qti-item-body", ["qti-rubric-block"]), []);
    }),
  );

  it.effect("refuses a template processing with no template rule (P28)", () =>
    Effect.gen(function* emptyTemplateProcessing() {
      const all = yield* sets;

      assert.deepStrictEqual(judged(all, "3.0.1", "qti-template-processing", []), [
        "ChildRequired",
      ]);
      assert.deepStrictEqual(judged(all, "3.0.1", "qti-template-processing", ["ws"]), [
        "ChildRequired",
      ]);
      assert.deepStrictEqual(
        judged(all, "3.0.1", "qti-template-processing", ["qti-template-constraint"]),
        [],
      );
    }),
  );

  it.effect("counts a stage, the media and the gaps as unions (union-count)", () =>
    Effect.gen(function* unions() {
      const all = yield* sets;
      const hotspot = "qti-hotspot-interaction";
      const media = "qti-media-interaction";

      assert.deepStrictEqual(judged(all, "3.0.1", hotspot, ["qti-hotspot-choice"]), [
        "ChildRequired",
      ]);
      assert.deepStrictEqual(judged(all, "3.0.1", hotspot, ["img", "qti-hotspot-choice"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", hotspot, ["img", "picture"]), [
        "ChildAtMostOnce",
      ]);
      assert.deepStrictEqual(judged(all, "3.0.1", media, ["audio", "audio"]), ["ChildAtMostOnce"]);
      assert.deepStrictEqual(judged(all, "3.0.1", media, ["object", "video"]), ["ChildAtMostOnce"]);
      assert.deepStrictEqual(judged(all, "3.0.1", media, ["qti-prompt", "video"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "qti-gap-match-interaction", ["p"]), [
        "ChildRequired",
      ]);
      assert.deepStrictEqual(
        judged(all, "3.0.1", "qti-gap-match-interaction", ["qti-gap-img", "qti-gap-text", "p"]),
        [],
      );
      assert.deepStrictEqual(judged(all, "3.0.1", "tr", []), ["ChildRequired"]);
      assert.deepStrictEqual(judged(all, "3.0.1", "tr", ["th", "td"]), []);
    }),
  );

  it.effect("folds a union a law counts as one into one position", () =>
    Effect.gen(function* unionPosition() {
      const all = yield* sets;
      const stage = all.lawsOf("3.0.1", "qti-gap-img");
      const table = all.lawsOf("3.0.1", "table");

      assert.deepStrictEqual(
        ["object", "img", "picture", "ws"].map((kind) => stage.positions.get(kind)),
        [1, 1, 1, 0],
      );
      assert.deepStrictEqual([...stage.required], [1]);
      assert.deepStrictEqual([...stage.atMostOnce], [1]);
      assert.deepStrictEqual(
        ["caption", "col", "tbody", "tfoot", "thead", "tr"].map((kind) =>
          table.positions.get(kind),
        ),
        [1, 0, 2, 3, 4, 5],
      );
      assert.deepStrictEqual(table.exclusive, [new Set([2, 5])]);
    }),
  );
});

describe("the capacity uses' fixtures", () => {
  it.effect("refuses a details without its one summary and a picture without its one img", () =>
    Effect.gen(function* summaries() {
      const all = yield* sets;

      assert.deepStrictEqual(judged(all, "3.0.1", "details", ["summary", "p"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "details", ["p"]), ["ChildRequired"]);
      assert.deepStrictEqual(judged(all, "3.0.1", "details", ["summary", "summary"]), [
        "ChildAtMostOnce",
      ]);
      assert.deepStrictEqual(judged(all, "3.0.1", "picture", ["source", "source", "img"]), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "picture", ["img"]), ["ChildRequired"]);
      assert.deepStrictEqual(judged(all, "3.0.1", "picture", ["source", "img", "img"]), [
        "ChildAtMostOnce",
      ]);
    }),
  );

  it.effect("refuses a col under a colgroup that carries span", () =>
    Effect.gen(function* colgroupSpan() {
      const laws = (yield* sets).lawsOf("3.0.1", "colgroup");

      assert.deepStrictEqual(judge(laws, { attrs: ["span"], children: ["col"] }), [
        "ChildBarredBy",
      ]);
      assert.deepStrictEqual(judge(laws, { attrs: ["span"], children: ["ws"] }), []);
      assert.deepStrictEqual(judge(laws, { attrs: [], children: ["col", "col"] }), []);
    }),
  );

  it.effect("requires a 3.0.1 modal's content body and caps a 3.0.0 one at one", () =>
    Effect.gen(function* modalBody() {
      const all = yield* sets;
      const body = "qti-content-body.modal";

      assert.deepStrictEqual(judged(all, "3.0.1", "qti-modal-feedback", []), ["ChildRequired"]);
      assert.deepStrictEqual(judged(all, "3.0.0", "qti-modal-feedback", []), []);
      assert.deepStrictEqual(judged(all, "3.0.0", "qti-modal-feedback", [body, body]), [
        "ChildAtMostOnce",
      ]);
    }),
  );

  it.effect("caps lom:duration under lom:technical, R30 assert 92", () =>
    Effect.gen(function* technicalDuration() {
      const all = yield* sets;

      assert.deepStrictEqual(judged(all, "3.0.1", "lom:technical", ["lom:duration"]), []);
      assert.deepStrictEqual(
        judged(all, "3.0.1", "lom:technical", ["lom:duration", "lom:duration"]),
        ["ChildAtMostOnce"],
      );
    }),
  );

  it.effect("requires a manifest's metadata, organizations and resources once each", () =>
    Effect.gen(function* manifest() {
      const all = yield* sets;
      const whole = ["cp:metadata.manifest", "cp:organizations", "cp:resources"];

      assert.deepStrictEqual(judged(all, "3.0.1", "cp:manifest", whole), []);
      assert.deepStrictEqual(judged(all, "3.0.1", "cp:manifest", whole.slice(1)), [
        "ChildRequired",
      ]);
      assert.deepStrictEqual(judged(all, "3.0.0", "cp:manifest", [...whole, "cp:resources"]), [
        "ChildAtMostOnce",
      ]);
    }),
  );
});

describe("the relations", () => {
  it.effect("hold exactly the positions and masks each parent's laws read", () =>
    Effect.gen(function* rowsAgree() {
      const all = yield* sets;
      const offsets = Array.from({ length: all.positions }, (_, position) => position);
      const disagreements = versions.flatMap((version) =>
        kinds.flatMap((parent) => {
          const laws = all.lawsOf(version, parent);
          const masks = [
            ["ChildRequired", all.required, laws.required],
            ["ChildAtMostOnce", all.atMostOnce, laws.atMostOnce],
          ] as const;
          const slotted = [
            ["ChildAnyOf", all.anyOf, laws.anyOf],
            ["ChildExclusive", all.exclusive, laws.exclusive],
          ] as const;

          return [
            ...[...laws.positions].flatMap(([child, position]) =>
              Option.contains(
                Option.map(all.position.lookup({ child, parent, version }), (row) => row.position),
                position,
              )
                ? []
                : [`ChildPosition ${version} ${parent} ${child}`],
            ),
            ...masks.flatMap(([name, relation, mask]) =>
              offsets.flatMap((position) =>
                Option.isSome(relation.lookup({ parent, position, version })) === mask.has(position)
                  ? []
                  : [`${name} ${version} ${parent} ${position}`],
              ),
            ),
            ...slotted.flatMap(([name, relation, slots]) =>
              slots.flatMap((mask, slot) =>
                offsets.flatMap((position) =>
                  Option.isSome(relation.lookup({ parent, position, slot, version })) ===
                  mask.has(position)
                    ? []
                    : [`${name} ${version} ${parent} ${slot} ${position}`],
                ),
              ),
            ),
          ];
        }),
      );

      assert.deepStrictEqual(disagreements, []);
      assert.deepStrictEqual(
        Option.map(
          all.barredBy.lookup({ parent: "colgroup", version: "3.0.1" }),
          (row) => row.name,
        ),
        Option.some("span"),
      );
    }),
  );

  it.effect("are 7 positions wide, with ChildPosition total over the 17,661 admitted triples", () =>
    Effect.gen(function* sizes() {
      const all = yield* sets;
      const measured = [
        all.position,
        all.required,
        all.anyOf,
        all.exclusive,
        all.atMostOnce,
        all.barredBy,
      ].map((relation) => [
        relation.name,
        relation.rows.length,
        relation.cells,
        relation.width,
        relation.bytes,
      ]);

      assert.strictEqual(all.positions, 7);
      assert.deepStrictEqual(measured, [
        ["ChildPosition", 17_661, 263_538, 3, 98_835],
        ["ChildRequired", 79, 5082, 1, 644],
        ["ChildAnyOf", 0, 0, 1, 8],
        ["ChildExclusive", 2, 5082, 1, 644],
        ["ChildAtMostOnce", 220, 5082, 1, 644],
        ["ChildBarredBy", 2, 726, 11, 1007],
      ]);
    }),
  );
});

/**
 * Generate from one statement under both versions, and read why it has no relations.
 *
 * @param statements - The statements.
 * @returns The failure, or undefined when the statements have relations.
 */
const refusalOf = (statements: readonly ChildStatement[]) =>
  Option.getOrUndefined(Result.getFailure(generate(statements)));

/**
 * Construct a test statement that holds in both versions.
 *
 * @param parents - Its parents.
 * @param law - Its law.
 * @returns The statement.
 */
const stated = (parents: Kinds, law: ChildStatement["law"]): ChildStatement => ({
  law,
  parents,
  source: "test",
  versions,
});

describe("the refusals", () => {
  it("refuses a member its parent does not admit", () => {
    const failure = refusalOf([
      stated(["table"], { law: "atMostOne", members: { kinds: ["li"], of: "kinds" } }),
    ]);

    assert.strictEqual(failure?._tag, "UnadmittedChild");
    assert.include(
      failure?.message ?? "",
      "names li under table in 3.0.0, which table does not admit there",
    );
  });

  it("refuses to count the element children of a parent that admits none", () => {
    const failure = refusalOf([
      stated(["cp:schema"], { law: "atLeastOne", members: { of: "elements" } }),
    ]);

    assert.strictEqual(failure?._tag, "NoElementChild");
  });

  it("refuses an alternative another law of the parent splits", () => {
    const failure = refusalOf([
      stated(["table"], { alternatives: [["caption", "thead"], ["tr"]], law: "exclusive" }),
      stated(["table"], { law: "atMostOne", members: { kinds: ["caption"], of: "kinds" } }),
    ]);

    assert.strictEqual(failure?._tag, "SplitMembers");
    assert.include(
      failure?.message ?? "",
      "reads caption, thead under table in 3.0.0 as one position",
    );
  });

  it("refuses a parent that bars children under two attributes", () => {
    const failure = refusalOf([
      stated(["colgroup"], { kinds: ["col"], law: "barredBy", name: "span" }),
      stated(["colgroup"], { kinds: ["col"], law: "barredBy", name: "width" }),
    ]);

    assert.strictEqual(failure?._tag, "KeyCollision");
  });
});

/**
 * Whether an inventory child's element name is a kind's element: its registry local name, bare or
 * after a prefix.
 *
 * @param name - The element name the inventory lists.
 * @param kind - A kind handle.
 * @returns Whether the kind is that element.
 */
const isElementNamed = (name: string, kind: string): boolean => {
  const local = registry.get(kind)?.local ?? "";

  return local !== "" && (name === local || name.endsWith(`:${local}`));
};

/**
 * List the members of a 3.0.1 count statement whose bound the ASI XSD's inventory does not state.
 *
 * @param all - The relations.
 * @param statement - The statement.
 * @returns `source parent kind` for each member under each parent whose inventory child is optional
 *   where the law requires it, or repeatable where the law caps it.
 */
const unbacked = (all: ChildSets, statement: ChildStatement): readonly string[] => {
  const { law } = statement;
  if (!statement.versions.includes("3.0.1") || law.law === "exclusive" || law.law === "barredBy") {
    return [];
  }

  return statement.parents.flatMap((parent) => {
    const entry = Object.hasOwn(inventory, parent) ? inventory[parent] : undefined;
    const members = membersOf(statement, all.lawsOf("3.0.1", parent));

    return (entry?.children ?? []).flatMap((bound) =>
      members
        .filter((kind) => isElementNamed(bound.name, kind))
        .filter(
          () =>
            (law.law !== "atMostOne" && bound.min < 1) ||
            (law.law !== "atLeastOne" && !Option.exists(bound.max, (max) => max <= 1)),
        )
        .map((kind) => `${statement.source} ${parent} ${kind}`),
    );
  });
};

describe("against the inventory", () => {
  it.effect("states no 3.0.1 bound the ASI XSD's min and max do not", () =>
    Effect.gen(function* inventoryBacked() {
      const all = yield* sets;

      assert.deepStrictEqual(
        childStatements.flatMap((statement) => unbacked(all, statement)),
        [],
      );
    }),
  );
});

/**
 * The old schema's folder, whose `capacity` uses the map transcribes. The checks that read it
 * leave with it.
 */
const schemaRoot = path.resolve(import.meta.dirname, "..", "schema");

/**
 * Cut the text between an opening parenthesis and its match.
 *
 * @param text - The source.
 * @param open - The index of the opening parenthesis.
 * @returns The text inside the pair, empty when it is never closed.
 */
const inside = (text: string, open: number): string => {
  let depth = 0;
  for (let index = open; index < text.length; index += 1) {
    if (text[index] === "(") {
      depth += 1;
    }

    if (text[index] === ")") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(open + 1, index);
      }
    }
  }

  return "";
};

/**
 * Write one side of a use, `on(R, "f")` or the same over a selection of `R`, as `R.f` or
 * `R[k = v].f`.
 *
 * @param side - The side, with no whitespace.
 * @returns The side in the map's notation.
 */
const sideOf = (side: string): string => {
  const groups =
    /^on\((?:select\((?<selected>[^,]+),\{(?<record>[^}]*)\}\)|(?<plain>[^,]+)),"(?<field>\w+)"\)$/u.exec(
      side,
    )?.groups ?? {};
  const { field = "", plain, record = "", selected = "" } = groups;
  const pairs = record.split(",").map((pair) => pair.replace(":", " = ").replaceAll('"', ""));

  return plain === undefined ? `${selected}[${pairs.join(", ")}].${field}` : `${plain}.${field}`;
};

/**
 * Write one end of a bound: a count, `*` for unbounded, or the field a bound reads.
 *
 * @param end - The end, with no whitespace.
 * @returns The end in the map's notation.
 */
const endOf = (end: string): string => {
  if (end === '"*"') {
    return "*";
  }

  const { count, field } = /^(?:(?<count>\d+)n|ref\("(?<field>\w+)"\))$/u.exec(end)?.groups ?? {};

  return count ?? field ?? end;
};

/**
 * Read every use in one module of the old schema, in source order.
 *
 * @param module - The module's path under `src/schema/`.
 * @returns Each use's id, sides and bound in the map's notation.
 */
const usesIn = (module: string) => {
  const text = readFileSync(path.join(schemaRoot, module), "utf-8");

  return [...text.matchAll(/\bcapacity\s*\(/gu)].map((call, index) => {
    const compact = inside(text, call.index + call[0].length - 1)
      .replaceAll(" as const", "")
      .replaceAll(/\s+/gu, "")
      .replaceAll(/,(?<close>[)}\]])/gu, "$<close>");
    const {
      from = "",
      target = "",
      within = "",
    } = /^(?<target>.*),\{from:(?<from>.*),within:(?<within>.*)\}$/u.exec(compact)?.groups ?? {};
    const { high = "", low = "" } =
      /^within\((?<low>[^,]+),(?<high>.+)\)$/u.exec(within)?.groups ?? {};

    return {
      bound: low === "" ? within : `${endOf(low)}..${endOf(high)}`,
      from: sideOf(from),
      id: `${module}#${index + 1}`,
      target: sideOf(target),
    };
  });
};

/**
 * The (parent, child) pairs the R30 use caps, as `parent child`.
 */
const r30Pairs = capacityMap
  .filter(({ id }) => id === "metadata.ts#1")
  .flatMap(({ becomes }) => (becomes.as === "set law" ? becomes.rules : []))
  .flatMap(({ law, parents }) => {
    if (law.law !== "atMostOne" || law.members.of !== "kinds") {
      return [];
    }

    const [child] = law.members.kinds;

    return parents.map((parent) => `${parent} ${child}`);
  });

describe("against the old schema", () => {
  it("transcribes every use, in each module's order", () => {
    const written = globSync("**/*.ts", { cwd: schemaRoot })
      .filter((module) => !module.endsWith(".test.ts"))
      .toSorted()
      .flatMap(usesIn);

    assert.deepStrictEqual(
      capacityMap.map(({ bound, from, id, target }) => ({ bound, from, id, target })),
      written,
    );
  });

  it("caps R30's 80 pairs, with assert 92 under lom:technical as lom:duration", () => {
    const asserted = new Set(
      r30Asserts.map(({ child, parent }) =>
        parent === "lom:technical" && child === "lom:duration.string"
          ? `${parent} lom:duration`
          : `${parent} ${child}`,
      ),
    );

    assert.strictEqual(new Set(r30Pairs).size, 80);
    assert.deepStrictEqual(r30Pairs.toSorted(), [...asserted].toSorted());
  });
});
