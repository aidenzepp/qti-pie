import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage, requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import {
  Array as Arr,
  Duration,
  Effect,
  Formatter,
  Option,
  Predicate,
  Result,
  Schema,
} from "effect";
import { openDomain } from "#pantry/grammar/attributes.ts";
import {
  closedWithin,
  dependentField,
  idField,
  roster,
  valueField,
} from "#pantry/grammar/closed.ts";
import type { AnyField, AnyKeyField } from "#pantry/grammar/closed.ts";
import * as install from "#pantry/grammar/install.ts";
import { foreignKinds, openClasses } from "#pantry/grammar/kinds.ts";
import { noType } from "#pantry/grammar/xsi.ts";

/**
 * The composed grammar, the generators' rows every declaration is compared with.
 */
const { grammar } = install;

/**
 * The most bits one constant holds: PostgreSQL's longest bit string, `VARBITMAXLEN` = INT_MAX − 7
 * (19rc1, `src/include/utils/varbit.h:83`), grizzle's `constantMaxBits` (README, "Limits").
 */
const constantMaxBits = 2_147_483_640;

/**
 * The most UTF-8 bytes a roster handle holds: a PostgreSQL `name`, NAMEDATALEN − 1 (README, "Tables
 * and types").
 */
const handleMaxBytes = 63;

/**
 * How long one exhaustive search here may take: each walks at most a few thousand cases of rows the
 * module already holds, in well under a second, so a minute only bounds a hang.
 */
const caseHang = Duration.minutes(1);

/**
 * A field's value in a closed relation's rows: a handle or a text, or a natural.
 */
const ValueSchema = Schema.Union([Schema.String, Schema.BigInt]);

/**
 * A field's value in a closed relation's rows.
 */
type Value = typeof ValueSchema.Type;

/**
 * A closed relation's row: each field's value under its name.
 */
const RowSchema = Schema.Record(Schema.String, ValueSchema);

/**
 * A closed relation's row.
 */
type Row = typeof RowSchema.Type;

/**
 * Parse rows read from a declaration or a generator into {@link Row}s.
 */
const rowsOf = Schema.decodeUnknownSync(Schema.Array(RowSchema));

/**
 * A grizzle field descriptor as the size and layout laws read it: a closed id carries its roster,
 * and a slot its fin, its owner's key and rows and its count field.
 */
const Descriptor = Schema.Struct({
  roster: Schema.optional(
    Schema.Struct({ handles: Schema.Array(Schema.String), name: Schema.String }),
  ),
  slots: Schema.optional(
    Schema.Struct({
      count: Schema.String,
      owner: Schema.Struct({ key: Schema.Array(Schema.String), rows: Schema.Array(RowSchema) }),
    }),
  ),
});

/**
 * An installed closed relation as these laws read it: its name, fields, key and rows.
 */
const InstalledSchema = Schema.Struct({
  fields: Schema.Record(Schema.String, Descriptor),
  key: Schema.Array(Schema.String),
  kind: Schema.Literal("closedRelation"),
  name: Schema.String,
  rows: Schema.Array(RowSchema),
});

/**
 * An installed closed relation.
 */
type Installed = typeof InstalledSchema.Type;

/**
 * An installed roster as these laws read it: its name and its handles in code order.
 */
const InstalledRosterSchema = Schema.Struct({
  handles: Schema.Array(Schema.String),
  kind: Schema.Literal("closed"),
  name: Schema.String,
});

/**
 * Every closed relation `install.ts` declares, in export order, each parsed from its export.
 */
const installed: readonly Installed[] = Object.values(install).flatMap((value) =>
  Option.toArray(Schema.decodeUnknownOption(InstalledSchema)(value)),
);

/**
 * Every roster `install.ts` declares, in export order, each parsed from its export.
 */
const rosters = Object.values(install).flatMap((value) =>
  Option.toArray(Schema.decodeUnknownOption(InstalledRosterSchema)(value)),
);

/**
 * Spell a value as text, a natural marked so no handle spells the same.
 *
 * @param value - A field's value.
 * @returns Its text.
 */
const textOf = (value: Value | undefined): string =>
  Predicate.isBigInt(value) ? `${value}n` : JSON.stringify(value ?? null);

/**
 * Spell a tuple of values as one text.
 *
 * @param values - The values, in order.
 * @returns Their texts, space-separated.
 */
const tupleText = (values: readonly (Value | undefined)[]): string => values.map(textOf).join(" ");

/**
 * Read rows as a keyed set: each row's text by its key's text (rule 7). A repeat, identical or not,
 * is refused: grizzle's closed relation holds one row per key, and an oracle that collapsed a
 * repeat would hide one.
 *
 * @param name - The relation, for the failure.
 * @param key - The key's fields.
 * @param rows - The rows.
 * @returns Each row's text by its key's text.
 */
const keyedSet = (
  name: string,
  key: readonly string[],
  rows: readonly Row[],
): ReadonlyMap<string, string> => {
  const set = new Map<string, string>();
  for (const row of rows) {
    const at = key.map((field) => textOf(row[field])).join(" ");
    assert.isFalse(set.has(at), `${name} states two rows at (${at})`);
    set.set(
      at,
      Object.keys(row)
        .toSorted()
        .map((field) => `${field}=${textOf(row[field])}`)
        .join(" "),
    );
  }

  return set;
};

/**
 * Find an installed relation by name.
 *
 * @param name - The relation's name.
 * @returns It.
 */
const relationNamed = (name: string): Installed =>
  Option.getOrThrowWith(
    Arr.findFirst(installed, (relation) => relation.name === name),
    () => new Error(`install.ts declares no closed relation ${name}.`),
  );

/**
 * One comparison of the rows law: an installed relation and the rows its generator states, as the
 * relation keys them, each built only when its case runs.
 */
interface Comparison {
  readonly expected: () => readonly object[];
  readonly name: string;
}

/**
 * Each family of the content grammar, (version, parent), in code order.
 */
const families = grammar.kinds.versions.handles.flatMap((version) =>
  grammar.kinds.nodeKind.handles.map((parent) => ({ parent, version })),
);

/**
 * The generator's governor of each governed handle: its kind and governing type.
 */
const governed: ReadonlyMap<string, { readonly governs: string; readonly kind: string }> = new Map(
  grammar.attributes.governor.rows.map(({ governor, governs, kind }) => [
    governor,
    { governs, kind },
  ]),
);

/**
 * The relations stated one to one with a generator's, or as the rulings restate them over the
 * generator's rows: each the second implementation of its declaration.
 */
const comparisons: readonly Comparison[] = [
  {
    expected: () => grammar.admission.rows,
    name: "ChildGrammar",
  },
  { expected: () => grammar.content.strictlyHeld.rows, name: "StrictlyHeld" },
  { expected: () => grammar.ancestry.enters.rows, name: "Enters" },
  { expected: () => grammar.ancestry.banned.rows, name: "Banned" },
  { expected: () => grammar.ancestry.needs.rows, name: "Needs" },
  { expected: () => grammar.xsi.xsiType.rows, name: "XsiType" },
  {
    expected: () => [
      ...grammar.attributes.admission.rows.map(({ kind, ...row }) => ({ ...row, governor: kind })),
      ...grammar.attributes.governed.rows,
    ],
    name: "AttributeGrammar",
  },
  {
    expected: () =>
      [
        ...grammar.attributes.admission.rows.map(({ kind, ...row }) => ({
          ...row,
          governor: kind,
        })),
        ...grammar.attributes.governed.rows,
      ]
        .filter(({ use }) => use === "required")
        .map(({ governor, position, version }) => ({ governor, slot: position, version })),
    name: "Required",
  },
  { expected: () => grammar.attributes.valueDomain.rows, name: "ValueDomainOf" },
  {
    expected: () => {
      const identity = new Map(
        grammar.attributes.identity.rows.map((row) => [row.domain, row.identity]),
      );

      return [
        ...grammar.attributes.valueDomain.rows.map(({ domain }) => domain),
        ...grammar.attributes.emptyDomains,
      ].map((domain) => ({ domain, identity: identity.get(domain) ?? "none" }));
    },
    name: "ValueIdentity",
  },
  {
    expected: () =>
      grammar.kinds.versions.handles.flatMap((version) =>
        [
          ...grammar.kinds.nodeKind.handles.map((kind) => ({
            domain: Option.match(grammar.attributes.text.lookup({ kind, version }), {
              onNone: () => openDomain.handle,
              onSome: ({ domain }) => domain,
            }),
            governor: kind,
          })),
          ...[...governed].map(([governor, { governs }]) => ({
            domain: Option.match(grammar.attributes.typeText.lookup({ governs, version }), {
              onNone: () => openDomain.handle,
              onSome: ({ domain }) => domain,
            }),
            governor,
          })),
        ].map((row) => ({ ...row, version })),
      ),
    name: "TextDomain",
  },
  {
    expected: () => [
      ...grammar.xsi.xsiType.rows.map(({ kind, type, version }) => ({
        governor: Option.match(
          grammar.attributes.governor.lookup({ governs: type, kind, version }),
          { onNone: () => kind, onSome: ({ governor }) => governor },
        ),
        governs: type,
        kind,
        version,
      })),
      ...grammar.kinds.versions.handles.flatMap((version) => [
        ...Object.values(foreignKinds).flatMap((kind) =>
          grammar.xsi.typeName.handles.map((governs) => ({
            governor: Option.match(grammar.attributes.governor.lookup({ governs, kind, version }), {
              onNone: () => kind,
              onSome: ({ governor }) => governor,
            }),
            governs,
            kind,
            version,
          })),
        ),
        ...["document", "text", "ws", "comment", "pi", "entityRef", "doctype"].map((kind) => ({
          governor: kind,
          governs: noType,
          kind,
          version,
        })),
      ]),
    ],
    name: "GoverningOf",
  },
  {
    expected: () =>
      grammar.kinds.elementName.rows.map(({ kind, namespace }) => ({ kind, namespace })),
    name: "KindNamespace",
  },
  { expected: () => grammar.operatorArity.rows, name: "OperatorArity" },
  { expected: () => grammar.bindingFit.rows, name: "BindingFit" },
  { expected: () => grammar.recordBindingFit.rows, name: "RecordBindingFit" },
  { expected: () => grammar.mappableBaseType.rows, name: "MappableBaseType" },
  { expected: () => grammar.package.resourceTypeOf.rows, name: "ResourceTypeOf" },
  { expected: () => grammar.package.rootOfType.rows, name: "RootOfType" },
  { expected: () => grammar.include.includeRoot.rows, name: "IncludeRoot" },
  { expected: () => grammar.include.includeParentKind.rows, name: "IncludeParentKind" },
  { expected: () => grammar.references.declares.rows, name: "Declares" },
  { expected: () => grammar.references.builtIn.rows, name: "BuiltInVariable" },
  { expected: () => grammar.references.variableReference.rows, name: "VariableReference" },
  { expected: () => grammar.references.contentReference.rows, name: "ContentReference" },
  { expected: () => grammar.references.choiceBound.rows, name: "ChoiceBound" },
  { expected: () => grammar.references.choiceCount.rows, name: "ChoiceCount" },
  { expected: () => grammar.references.sectionPart.rows, name: "SectionPart" },
  { expected: () => grammar.references.referenceAttribute.rows, name: "ReferenceAttribute" },
  { expected: () => grammar.kindByNameUnder.rows, name: "KindByNameUnder" },
  { expected: () => grammar.heldRootsUnder.rows, name: "HeldRootsUnder" },
  { expected: () => grammar.typeAvailable.rows, name: "TypeAvailable" },
  {
    expected: () => grammar.baseTypes.handles.map((code) => ({ code, lexical: code })),
    name: "BaseTypeLexical",
  },
  {
    expected: () =>
      [...grammar.typedCardinalities.handles, "record"].map((code) => ({ code, lexical: code })),
    name: "CardinalityLexical",
  },
  {
    expected: () => grammar.package.resourceType.handles.map((code) => ({ code, lexical: code })),
    name: "ResourceTypeLexical",
  },
  {
    expected: () =>
      grammar.references.reservedTarget.handles.map((code) => ({ code, lexical: code })),
    name: "ReservedTargetLexical",
  },
];

/**
 * Index rows by a key's text, each row spelled by some of its fields: a relation's rows per model,
 * or a generator's per family, as one set of texts per key.
 *
 * @param rows - The rows.
 * @param by - The fields whose values name a row's group.
 * @param fields - The fields that spell a row within its group.
 * @returns Each group's rows' texts, by the group's text.
 */
const indexed = (
  rows: readonly Row[],
  by: readonly string[],
  fields: readonly string[],
): ReadonlyMap<string, ReadonlySet<string>> => {
  const groups = new Map<string, Set<string>>();
  for (const row of rows) {
    const at = tupleText(by.map((field) => row[field]));
    const group = groups.get(at) ?? new Set<string>();
    group.add(tupleText(fields.map((field) => row[field])));
    groups.set(at, group);
  }

  return groups;
};

/**
 * Index an installed relation's rows by model, each spelled by its other key fields.
 *
 * @param name - The relation, keyed by `model` first.
 * @returns Each model's rows' texts, by the model's text.
 */
const byModel = (name: string): ReadonlyMap<string, ReadonlySet<string>> => {
  const relation = relationNamed(name);

  return indexed(
    relation.rows,
    ["model"],
    relation.key.filter((field) => field !== "model"),
  );
};

/**
 * Index a generator's rows by family, (version, parent), each spelled by the given fields.
 *
 * @param rows - The generator's rows.
 * @param fields - The fields beside the family, in the installed key's order.
 * @returns Each family's rows' texts, by the family's text.
 */
const byFamily = (
  rows: readonly object[],
  fields: readonly string[],
): ReadonlyMap<string, ReadonlySet<string>> => indexed(rowsOf(rows), ["version", "parent"], fields);

/**
 * Read a total function of (version, parent) at every family: `ContentModelOf` or `SharedModelOf`.
 *
 * @param name - The relation's name.
 * @returns Each family's model's text, by the family's text.
 */
const modelsByFamily = (name: string): ReadonlyMap<string, string> =>
  new Map(
    relationNamed(name).rows.map((row) => [
      tupleText([row["version"], row["parent"]]),
      tupleText([row["model"]]),
    ]),
  );

/**
 * A model's count of positions, `ModelPositions` or `SharedPositions`, by the model's text.
 *
 * @param name - The count relation's name.
 * @returns Each model's count.
 */
const countsByModel = (name: string): ReadonlyMap<string, Value | undefined> =>
  new Map(relationNamed(name).rows.map((row) => [tupleText([row["model"]]), row["positions"]]));

/**
 * The empty set of row texts: a group no row is in.
 */
const noRows: ReadonlySet<string> = new Set();

/**
 * Whether a generator states at most one row per (version, parent) family.
 *
 * @param rows - The generator's rows.
 * @returns Whether no family has two.
 */
const oncePerFamily = (
  rows: readonly { readonly parent: string; readonly version: string }[],
): boolean =>
  [...Map.groupBy(rows, ({ parent, version }) => `${version} ${parent}`).values()].every(
    (held) => held.length === 1,
  );

/**
 * Find an installed roster's handles by name.
 *
 * @param name - The roster's name.
 * @returns Its handles, in code order.
 */
const handlesOf = (name: string): readonly string[] =>
  Option.getOrThrow(Arr.findFirst(rosters, (held) => held.name === name)).handles;

/**
 * The content grammar as both sides state it, indexed once: each family's model, each model's and
 * each family's `Follow` and `Last` rows, and each model's positions.
 */
const content = {
  familyFollow: byFamily(grammar.content.follow.rows, ["from", "to"]),
  familyLast: byFamily(grammar.content.last.rows, ["position"]),
  follow: byModel("Follow"),
  last: byModel("Last"),
  models: modelsByFamily("ContentModelOf"),
  positions: countsByModel("ModelPositions"),
};

/**
 * `Symbol` as both sides state it, indexed once: each family's shared model, each model's and each
 * family's rows, and each model's positions.
 */
const shared = {
  family: byFamily(grammar.content.symbol.rows, ["kind", "position"]),
  models: modelsByFamily("SharedModelOf"),
  positions: countsByModel("SharedPositions"),
  symbol: byModel("Symbol"),
};

/**
 * How long each exhaustive search of every relation or family may run: about ten times what each
 * took on 2026-11-06, a few seconds, under a load average of about 20.
 */
const searchTimeout = 120_000;

describe("the installed relations", () => {
  it.effect(
    "hold exactly their generators' rows, as keyed sets, every relation stated over the generator's rows",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every relation stated one to one or restated over a generator's rows, every row",
            caseHang,
            coverage: noCoverage,
            generator: int(0, comparisons.length - 1),
            limit: comparisons.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "composed()'s closed.ts relations" },
            suite: "grammar/install/rows",
          },
          (index) =>
            Effect.sync(() => {
              const { expected, name } = Arr.getUnsafe(comparisons, index);
              const relation = relationNamed(name);
              const fields = Object.keys(relation.fields);
              const stated = rowsOf(expected()).map((row) =>
                Object.fromEntries(
                  fields.flatMap((field) => {
                    const value = row[field];

                    return value === undefined ? [] : [[field, value] as const];
                  }),
                ),
              );

              assert.deepStrictEqual(
                keyedSet(name, relation.key, relation.rows),
                keyedSet(`${name}'s generator`, relation.key, stated),
                name,
              );
            }),
        ),
      ),
    searchTimeout,
  );

  it.effect(
    "give every content family its own automaton: the model's Follow, Last and positions are the family's",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every (version, parent) family, 2 × 644",
            caseHang,
            coverage: requiredInSpace<"empty" | "follows" | "no model">([
              "empty",
              "follows",
              "no model",
            ]),
            generator: int(0, families.length - 1),
            limit: families.length,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the family's generated Follow and Last",
            },
            suite: "grammar/install/content-models",
          },
          (index, c) =>
            Effect.sync(() => {
              const family = Arr.getUnsafe(families, index);
              const at = tupleText([family.version, family.parent]);
              const model = content.models.get(at) ?? "";
              const follow = content.familyFollow.get(at) ?? noRows;
              const last = content.familyLast.get(at) ?? noRows;
              if (follow.size > 0) {
                c.note("follows");
              } else {
                c.note(last.size > 0 ? "empty" : "no model");
              }

              assert.deepStrictEqual(content.follow.get(model) ?? noRows, follow, at);
              assert.deepStrictEqual(content.last.get(model) ?? noRows, last, at);
              assert.strictEqual(
                content.positions.get(model),
                BigInt(grammar.content.follow.key[2].sizeOf(family)),
                at,
              );
            }),
        ),
      ),
    searchTimeout,
  );

  it.effect(
    "key Symbol by shared model: each family's (kind, position) rows are exactly its dependent Symbol's",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every (version, parent) family, 2 × 644",
            caseHang,
            coverage: requiredInSpace<"shared" | "unshared">(["shared", "unshared"]),
            generator: int(0, families.length - 1),
            limit: families.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the family's generated Symbol" },
            suite: "grammar/install/symbol",
          },
          (index, c) =>
            Effect.sync(() => {
              const family = Arr.getUnsafe(families, index);
              const at = tupleText([family.version, family.parent]);
              const model = shared.models.get(at) ?? "";
              const symbol = shared.family.get(at) ?? noRows;
              c.note(symbol.size > 0 ? "shared" : "unshared");

              assert.deepStrictEqual(shared.symbol.get(model) ?? noRows, symbol, at);
              assert.strictEqual(model === textOf("none"), symbol.size === 0, at);
              if (symbol.size > 0) {
                assert.strictEqual(
                  shared.positions.get(model),
                  BigInt(grammar.content.symbol.key[3].sizeOf(family)),
                  at,
                );
              }
            }),
        ),
      ),
    searchTimeout,
  );

  it("make CountedOf and BarredOf total, their nonzero rows exactly today's Counted and ChildBarredBy", () => {
    const keys = new Set(families.map(({ parent, version }) => `${version} ${parent}`));
    for (const name of ["CountedOf", "BarredOf", "ContentModelOf", "SharedModelOf"]) {
      const relation = relationNamed(name);
      assert.deepStrictEqual(
        new Set(keyedSet(name, relation.key, relation.rows).keys()),
        new Set([...keys].map((key) => tupleText(key.split(" ")))),
        name,
      );
    }

    // The generators state one counted and one barred position per family, which a function of
    // (version, parent) needs.
    assert.isTrue(oncePerFamily(grammar.content.counted.rows));
    assert.isTrue(oncePerFamily(grammar.barredBy.rows));

    assert.deepStrictEqual(
      new Set(
        relationNamed("CountedOf")
          .rows.filter((row) => row["position"] !== "0")
          .map(({ max, min, parent, position, version }) =>
            tupleText([version, parent, position, min, max]),
          ),
      ),
      new Set(
        grammar.content.counted.rows.map(({ max, min, parent, position, version }) =>
          tupleText([
            version,
            parent,
            position,
            BigInt(min),
            Number.isFinite(max) ? BigInt(max) : 9_223_372_036_854_775_807n,
          ]),
        ),
      ),
    );
    assert.strictEqual(grammar.content.counted.rows.length, 2);
    assert.deepStrictEqual(
      new Set(
        relationNamed("BarredOf")
          .rows.filter((row) => row["position"] !== "0")
          .map(({ parent, position, slot, version }) =>
            tupleText([version, parent, position, slot]),
          ),
      ),
      new Set(
        grammar.barredBy.rows.map(({ name, parent, position, version }) =>
          tupleText([
            version,
            parent,
            position,
            Option.getOrThrow(grammar.attributes.admission.lookup({ kind: parent, name, version }))
              .position,
          ]),
        ),
      ),
    );
    assert.strictEqual(grammar.barredBy.rows.length, 2);
  });
});

describe("the diagonals", () => {
  for (const { field, name } of [
    { field: "position", name: "PositionSelf" },
    { field: "slot", name: "SlotSelf" },
    { field: "name", name: "AttributeNameSelf" },
    { field: "baseType", name: "BaseTypeSelf" },
    { field: "cardinality", name: "CardinalitySelf" },
  ]) {
    it.effect(
      `give ${name}.row(c) exactly {c}, every code exhausted`,
      (ctx) => {
        const relation = relationNamed(name);
        const handles = relation.fields[field]?.roster?.handles ?? [];

        return searched(
          ctx,
          exhaust(
            {
              box: `every code of ${relation.fields[field]?.roster?.name ?? field}, ${handles.length}`,
              caseHang,
              coverage: noCoverage,
              generator: int(0, handles.length - 1),
              limit: handles.length,
              literal: Formatter.format,
              oracle: { kind: "specification", name: "C6: a diagonal's row is a singleton" },
              suite: `grammar/install/${name}`,
            },
            (code) =>
              Effect.sync(() => {
                const at = Arr.getUnsafe(handles, code);

                assert.deepStrictEqual(
                  relation.rows.filter((row) => row[field] === at).map((row) => row["self"]),
                  [at],
                );
              }),
          ),
        );
      },
      searchTimeout,
    );
  }
});

describe("the rosters", () => {
  it("hold every generator's handles in code order, the null objects where the rulings place them", () => {
    assert.deepStrictEqual(handlesOf("NodeKind"), grammar.kinds.nodeKind.handles);
    assert.deepStrictEqual(handlesOf("AttributeName"), grammar.kinds.attributeName.handles);
    assert.deepStrictEqual(handlesOf("TypeName"), grammar.xsi.typeName.handles);
    assert.deepStrictEqual(handlesOf("SchemaVersion"), grammar.kinds.versions.handles);
    assert.deepStrictEqual(handlesOf("BaseType"), [...grammar.baseTypes.handles, "none"]);
    assert.deepStrictEqual(handlesOf("Cardinality"), [
      ...grammar.typedCardinalities.handles,
      "record",
    ]);
    assert.deepStrictEqual(handlesOf("ResourceType"), [
      "none",
      ...grammar.package.resourceType.handles,
    ]);
    assert.deepStrictEqual(handlesOf("Position"), grammar.content.positions.handles);
    assert.deepStrictEqual(handlesOf("AttributeSlot"), grammar.attributes.positions.handles);
    assert.deepStrictEqual(handlesOf("Governor"), [
      ...grammar.kinds.nodeKind.handles,
      ...governed.keys(),
    ]);
    assert.deepStrictEqual(handlesOf("Identity"), [
      ...grammar.attributes.identity.payload[0].roster.handles,
      "none",
    ]);
    assert.strictEqual(handlesOf("SharedModel")[0], "none");
    // Spec reading 111's include model is a model of its own, and names the ignored elements'
    // wildcards at two positions.
    assert.lengthOf(handlesOf("SharedModel"), 25);
    assert.lengthOf(handlesOf("ContentModel"), 115);
  });

  it("spell every handle within a PostgreSQL name, every type and governor among them", () => {
    assert.deepStrictEqual(
      rosters.flatMap(({ handles, name }) =>
        handles
          .filter((handle) => new TextEncoder().encode(handle).length > handleMaxBytes)
          .map((handle) => `${name} ${handle}`),
      ),
      [],
    );
    assert.isAtMost(
      Math.max(...grammar.xsi.typeName.handles.map((h) => new TextEncoder().encode(h).length)),
      handleMaxBytes,
    );
    assert.isAtMost(
      Math.max(...[...governed.keys()].map((h) => new TextEncoder().encode(h).length)),
      handleMaxBytes,
    );
  });

  it("list the handle sets the laws test membership in, each its generator's", () => {
    const isElement = new Set(grammar.kinds.isElement.rows.map(({ kind }) => kind));

    assert.deepStrictEqual(
      new Set(install.nonElementKinds),
      new Set(grammar.kinds.nodeKind.handles.filter((kind) => !isElement.has(kind))),
    );
    assert.deepStrictEqual(
      new Set(install.interactionKinds),
      new Set(grammar.kinds.interaction.rows.map(({ kind }) => kind)),
    );
    assert.lengthOf(install.interactionKinds, 22);
    assert.deepStrictEqual(new Set(install.openClasses), new Set(openClasses));
    assert.deepStrictEqual(
      new Set(install.openElementClasses),
      new Set(Object.values(foreignKinds)),
    );
    assert.deepStrictEqual(
      new Set(install.documentTypes),
      new Set(grammar.package.rootOfType.rows.map(({ type }) => type)),
    );
  });
});

/**
 * A constant's shape: its cells, one per point of its key's space, and the bits per cell.
 */
interface Layout {
  readonly cells: number;
  readonly width: number;
}

/**
 * Count the codes a payload field holds: its roster's, or the distinct values its rows hold, at
 * least one, since PostgreSQL has no `bit(0)`.
 *
 * @param relation - The relation.
 * @param field - A payload field.
 * @returns The field's code count.
 */
const codesOf = (relation: Installed, field: string): number => {
  const roster_ = relation.fields[field]?.roster;

  return roster_ === undefined
    ? Math.max(1, new Set(relation.rows.map((row) => textOf(row[field]))).size)
    : roster_.handles.length;
};

/**
 * Lay out a relation's constant as fin.md §17 does from grizzle's declaration: one cell per point
 * of the key's space, the product of its closed ids' codes, or, where the key holds slots, each
 * owner's block at its own counts after the blocks before it; and w = ⌈log₂(1 + |payload space|)⌉
 * bits a cell.
 *
 * @param relation - The installed relation.
 * @returns Its layout.
 */
const declaredLayout = (relation: Installed): Layout => {
  const sizeOf = (field: string) => relation.fields[field]?.roster?.handles.length ?? 0;
  let points = 1;
  for (const field of Object.keys(relation.fields)) {
    if (!relation.key.includes(field)) {
      points *= codesOf(relation, field);
    }
  }

  const width = points.toString(2).length;
  const fin = relation.key
    .map((field) => relation.fields[field]?.slots)
    .find((slots) => slots !== undefined);
  if (fin === undefined) {
    let cells = 1;
    for (const field of relation.key) {
      cells *= sizeOf(field);
    }

    return { cells, width };
  }

  const counts = new Map(
    fin.owner.rows.map((row) => [
      fin.owner.key.map((field) => textOf(row[field])).join(" "),
      Number(row[fin.count]),
    ]),
  );
  let owners: readonly (readonly string[])[] = [[]];
  for (const field of relation.key.slice(0, fin.owner.key.length)) {
    const handles = relation.fields[field]?.roster?.handles ?? [];
    owners = owners.flatMap((owner) => handles.map((handle) => [...owner, handle]));
  }

  let cells = 0;
  for (const owner of owners) {
    const count = counts.get(owner.map((handle) => textOf(handle)).join(" ")) ?? 0;
    let block = 1;
    for (const field of relation.key.slice(fin.owner.key.length)) {
      block *= relation.fields[field]?.slots === undefined ? sizeOf(field) : count;
    }

    cells += block;
  }

  return { cells, width };
};

/**
 * Restate an installed relation in `closed.ts`, the generators' own encoder: closed ids over
 * rosters of the same handles, a slot as a dependent `fin` sized by its owner's count, and an
 * open-typed field over its column's values, each spelled as its text.
 *
 * @param relation - The installed relation.
 * @returns Its `closed.ts` twin, or why `closed.ts` refuses its rows.
 */
const twinOf = (relation: Installed) => {
  const rosterOf = (field: string) =>
    Result.getOrThrow(
      roster(`${relation.name}.${field}`, relation.fields[field]?.roster?.handles ?? []),
    );
  const key = relation.key.map((field): AnyKeyField => {
    const fin = relation.fields[field]?.slots;
    if (fin === undefined) {
      return idField(field, rosterOf(field));
    }

    const counts = new Map(
      fin.owner.rows.map((row) => [
        fin.owner.key.map((held) => textOf(row[held])).join(" "),
        Number(row[fin.count]),
      ]),
    );

    return dependentField(
      field,
      rosterOf(field),
      (prefix) =>
        counts.get(
          relation.key
            .slice(0, fin.owner.key.length)
            .map((held) => textOf(prefix[held]))
            .join(" "),
        ) ?? 0,
    );
  });
  const open = new Set(
    Object.keys(relation.fields).filter((field) => relation.fields[field]?.roster === undefined),
  );
  const payload = Object.keys(relation.fields)
    .filter((field) => !relation.key.includes(field))
    .map((field): AnyField =>
      open.has(field)
        ? valueField(
            field,
            relation.rows.map((row) => textOf(row[field])),
          )
        : idField(field, rosterOf(field)),
    );

  return closedWithin(constantMaxBits)({
    key,
    name: relation.name,
    payload,
    rows: relation.rows.map((row) =>
      Object.fromEntries(
        Object.keys(relation.fields).map((field) => {
          const value = row[field];

          return [field, open.has(field) ? textOf(value) : String(value)] as const;
        }),
      ),
    ),
  });
};

describe("the constants", () => {
  it.effect(
    "lay out each relation as fin.md §17 does, cells × width within one bit string, its key closed ids and its rows one per key",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every installed relation",
            caseHang,
            coverage: requiredInSpace<"product" | "slots">(["product", "slots"]),
            generator: int(0, installed.length - 1),
            limit: installed.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "closed.ts's layout of the same rows" },
            suite: "grammar/install/layout",
          },
          (index, c) =>
            Effect.sync(() => {
              const relation = Arr.getUnsafe(installed, index);
              c.note(
                relation.key.some((field) => relation.fields[field]?.slots !== undefined)
                  ? "slots"
                  : "product",
              );

              assert.isTrue(
                relation.key.every((field) => relation.fields[field]?.roster !== undefined),
                `${relation.name}'s key holds a field that is no closed id`,
              );
              keyedSet(relation.name, relation.key, relation.rows);

              const { cells, width } = declaredLayout(relation);
              const twin = twinOf(relation);
              assert.isTrue(Result.isSuccess(twin), relation.name);
              if (Result.isSuccess(twin)) {
                assert.deepStrictEqual(
                  { cells, width },
                  { cells: twin.success.cells, width: twin.success.width },
                  relation.name,
                );
              }

              assert.isAtMost(cells * width, constantMaxBits, relation.name);
            }),
        ),
      ),
    searchTimeout,
  );
});
