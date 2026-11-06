import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, Predicate, Schema } from "effect";
import { openDomain } from "#pantry/grammar/attributes.ts";
import * as install from "#pantry/grammar/install.ts";
import { foreignKinds } from "#pantry/grammar/kinds.ts";
import { noType } from "#pantry/grammar/xsi.ts";

/**
 * The composed grammar, the generators' rows every declaration is compared with.
 */
const { grammar } = install;

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
 * A grizzle field descriptor as these laws read it: a closed id carries its roster.
 */
const Descriptor = Schema.Struct({
  roster: Schema.optional(
    Schema.Struct({ handles: Schema.Array(Schema.String), name: Schema.String }),
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
  // The content grammar is keyed by automaton where it is generated, so each relation is its
  // generator's rows one to one, and nothing regroups families into models here.
  { expected: () => grammar.content.contentModelOf.rows, name: "ContentModelOf" },
  {
    expected: () =>
      grammar.content.modelPositions.rows.map(({ model, positions }) => ({
        model,
        positions: BigInt(positions),
      })),
    name: "ModelPositions",
  },
  { expected: () => grammar.content.follow.rows, name: "Follow" },
  { expected: () => grammar.content.last.rows, name: "Last" },
  { expected: () => grammar.content.sharedModelOf.rows, name: "SharedModelOf" },
  {
    expected: () =>
      grammar.content.sharedModelPositions.rows.map(({ model, positions }) => ({
        model,
        positions: BigInt(positions),
      })),
    name: "SharedPositions",
  },
  { expected: () => grammar.content.symbol.rows, name: "Symbol" },
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
];

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

  it("make CountedOf and BarredOf total, their nonzero rows exactly today's Counted but its caps and ChildBarredBy, and Capped exactly Counted's caps", () => {
    const keys = new Set(families.map(({ parent, version }) => `${version} ${parent}`));
    for (const name of ["CountedOf", "BarredOf", "ContentModelOf", "SharedModelOf"]) {
      const relation = relationNamed(name);
      assert.deepStrictEqual(
        new Set(keyedSet(name, relation.key, relation.rows).keys()),
        new Set([...keys].map((key) => tupleText(key.split(" ")))),
        name,
      );
    }

    // Oracle: Counted's own rows, split by their bounds. A cap (0 to 1, spec reading 130) is a
    // set row of Capped, which a family may hold several of; every other count is CountedOf's,
    // and the generators state one such counted and one barred position per family, which a
    // function of (version, parent) needs.
    const capped = grammar.content.counted.rows.filter(({ max, min }) => min === 0 && max === 1);
    const counted = grammar.content.counted.rows.filter(({ max, min }) => min !== 0 || max !== 1);
    assert.isTrue(oncePerFamily(counted));
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
        counted.map(({ max, min, parent, position, version }) =>
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
    assert.strictEqual(counted.length, 2);
    assert.deepStrictEqual(
      new Set(
        relationNamed("Capped").rows.map(({ parent, position, version }) =>
          tupleText([version, parent, position]),
        ),
      ),
      new Set(
        capped.map(({ parent, position, version }) => tupleText([version, parent, position])),
      ),
    );
    // The loose LOM binding's 82 capped (parent, kind) pairs, in both versions.
    assert.strictEqual(capped.length, 164);
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
    assert.deepStrictEqual(handlesOf("ContentModel"), grammar.content.models.handles);
    assert.deepStrictEqual(handlesOf("SharedModel"), grammar.content.sharedModels.handles);
    assert.strictEqual(handlesOf("SharedModel")[0], "none");
    // Spec reading 118's include model is a model of its own, and names the ignored elements'
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
