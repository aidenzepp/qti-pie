import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Schema } from "effect";
import type { AnyClosed } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import * as install from "#pantry/grammar/install.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * The most codes one law's cell packs: each code takes 16 bits of an `int8` (fin.md §12, entry
 * 12), so a cell holds four. A law packs the key digits it indexes by; it reads a payload by
 * function application at that index (fin.md §17, "One representation"), never in the cell.
 */
const cellCodes = 4;

/**
 * The most values one code space may hold: a code is 16 bits of the cell.
 */
const codeSpace = 2 ** 16;

/**
 * The most bits one PostgreSQL bit string holds, `VARBITMAXLEN` (19rc1,
 * `src/include/utils/varbit.h:83`).
 */
const varbitMaxBits = 2_147_483_647 - 7;

/**
 * A closed relation as the size laws read it: its constant's shape, whatever its fields.
 */
type Constant = Pick<AnyClosed, "bytes" | "cells" | "key" | "name" | "payload" | "width">;

/**
 * Every closed relation of the composition a law or a reader reads.
 *
 * @param composedGrammar - The composed grammar.
 * @returns The relations.
 */
const constantsOf = (composedGrammar: ComposedGrammar): readonly Constant[] => [
  composedGrammar.admission,
  composedGrammar.content.follow,
  composedGrammar.content.last,
  composedGrammar.content.symbol,
  composedGrammar.content.counted,
  composedGrammar.content.strictlyHeld,
  composedGrammar.barredBy,
  composedGrammar.ancestry.enters,
  composedGrammar.ancestry.banned,
  composedGrammar.ancestry.needs,
  composedGrammar.kinds.interaction,
  composedGrammar.kinds.isElement,
  composedGrammar.attributes.admission,
  composedGrammar.attributes.text,
  composedGrammar.attributes.governor,
  composedGrammar.attributes.governed,
  composedGrammar.attributes.typeText,
  composedGrammar.operatorArity,
  composedGrammar.bindingFit,
  composedGrammar.recordBindingFit,
  composedGrammar.mappableBaseType,
  composedGrammar.package.resourceTypeOf,
  composedGrammar.package.rootOfType,
];

/**
 * The size of a field's code space at its widest: a roster's handles, or an open field's values.
 *
 * @param field - The field.
 * @returns The size.
 */
const widthOf = (field: Constant["key"][number] | Constant["payload"][number]): number =>
  field._tag === "value" ? field.values.length : field.roster.handles.length;

describe("the constants", () => {
  it.effect(
    "size each string by §17's formulas: cells the product of the key's spaces (summed over prefixes for a dependent field), width the bits of 1 + the payload space, bytes ⌈cells · width / 8⌉ + 8",
    (ctx) =>
      Effect.gen(function* sizes() {
        const constants = constantsOf(yield* grammar);
        for (const { bytes, cells, key, name, payload, width } of constants) {
          const payloadPoints = payload.reduce((product, field) => product * widthOf(field), 1);
          if (key.every((field) => field._tag !== "dependent")) {
            assert.strictEqual(
              cells,
              key.reduce((product, field) => product * widthOf(field), 1),
              name,
            );
          } else {
            assert.isAtMost(
              cells,
              key.reduce((product, field) => product * widthOf(field), 1),
              name,
            );
          }

          assert.strictEqual(
            2 ** width >= 1 + payloadPoints && 2 ** (width - 1) < 1 + payloadPoints,
            true,
            name,
          );
          assert.strictEqual(bytes, Math.ceil((cells * width) / 8) + 8, name);
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            constants
              .map(({ bytes, cells, name, width }) => `${name} ${cells}×${width} ${bytes} B`)
              .join("; "),
            "sizes",
          ),
        );
      }),
  );

  it.effect(
    "index by at most four key codes, each code space within 16 bits, each string within one bit string",
    () =>
      Effect.gen(function* caps() {
        const constants = constantsOf(yield* grammar);

        assert.deepStrictEqual(
          constants.filter(({ key }) => key.length > cellCodes).map(({ name }) => name),
          [],
        );
        assert.deepStrictEqual(
          constants.flatMap(({ key, name, payload }) =>
            [...key, ...payload]
              .filter((field) => widthOf(field) > codeSpace)
              .map((field) => `${name}.${field.name}`),
          ),
          [],
        );
        assert.deepStrictEqual(
          constants
            .filter(({ cells, width }) => cells * width > varbitMaxBits)
            .map(({ name }) => name),
          [],
        );
      }),
  );
});

/**
 * A field's value in an installed relation's rows.
 */
const ValueSchema = Schema.Union([Schema.String, Schema.BigInt]);

/**
 * An installed relation's row.
 */
const RowSchema = Schema.Record(Schema.String, ValueSchema);

/**
 * An installed closed relation as its constant's size reads it: each field's roster, a slot's fin,
 * its key and its rows (`install.ts`).
 */
const InstalledSchema = Schema.Struct({
  fields: Schema.Record(
    Schema.String,
    Schema.Struct({
      roster: Schema.optional(Schema.Struct({ handles: Schema.Array(Schema.String) })),
      slots: Schema.optional(
        Schema.Struct({
          count: Schema.String,
          owner: Schema.Struct({ key: Schema.Array(Schema.String), rows: Schema.Array(RowSchema) }),
        }),
      ),
    }),
  ),
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
 * Spell a value as text, a natural marked so no handle spells the same.
 *
 * @param value - A field's value.
 * @returns Its text.
 */
const textOf = (value: typeof ValueSchema.Type | undefined): string =>
  Predicate.isBigInt(value) ? `${value}n` : JSON.stringify(value ?? null);

/**
 * Size an installed relation's string of cells as grizzle lays it out (fin.md §17, README "Closed
 * relations"): one cell per point of the key's space, its closed ids' product or, where it holds
 * slots, each owner's block at its own counts; w bits a cell, the bits of 1 + the payload's codes;
 * and ⌈cells · w / 8⌉ + 8 bytes.
 *
 * @param relation - The installed relation.
 * @returns Its bytes as installed, and as the product of its key's rosters, slots read as their
 *   whole roster.
 */
const installedBytes = (relation: Installed): readonly [number, number] => {
  const size = (field: string) => relation.fields[field]?.roster?.handles.length ?? 0;
  let points = 1;
  for (const field of Object.keys(relation.fields)) {
    if (!relation.key.includes(field)) {
      points *=
        relation.fields[field]?.roster === undefined
          ? Math.max(1, new Set(relation.rows.map((row) => textOf(row[field]))).size)
          : size(field);
    }
  }

  const width = points.toString(2).length;
  let product = 1;
  for (const field of relation.key) {
    product *= size(field);
  }

  const fin = relation.key
    .map((field) => relation.fields[field]?.slots)
    .find((slots) => slots !== undefined);
  let cells = product;
  if (fin !== undefined) {
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

    cells = 0;
    for (const owner of owners) {
      const count = counts.get(owner.map((handle) => textOf(handle)).join(" ")) ?? 0;
      let block = 1;
      for (const field of relation.key.slice(fin.owner.key.length)) {
        block *= relation.fields[field]?.slots === undefined ? size(field) : count;
      }

      cells += block;
    }
  }

  return [Math.ceil((cells * width) / 8) + 8, Math.ceil((product * width) / 8) + 8];
};

/**
 * Each installed constant's bytes as installed, and as the product of its key's rosters, so a
 * grammar that grows a constant shows it here (C4).
 *
 * Measured on 2026-11-06 at grizzle `4016b69` from the packs `grizzle generate` drafts for the
 * composed `Qti` (a scratch configuration, no database): each constant's `generate_series` cell
 * count and `bit(w)` cell width, its bytes ⌈cells · w / 8⌉ + 8, the widest pack where a relation
 * installs a payload string beside its membership set. The products of the three slotted relations
 * are the rosters' arithmetic, 115 content models, 306 positions, 644 kinds and 25 shared models:
 * Follow 115 · 306², Last 115 · 306 and Symbol 25 · 644 · 306 one-bit cells. `Capped`, spec reading
 * 130's caps, is a set over (version, parent, position) with no slot, 2 · 644 · 306 one-bit cells,
 * taken by the same formula on 2026-11-06. `ValueDomainOf` and `ValueIdentity` are keyed by the
 * 242 domains the attribute readings 2, 120, 123, 124, 125, 129 and 132 leave, taken by the same
 * formula on 2026-11-06.
 */
const measuredBytes = {
  AttributeGrammar: [2_178_996, 2_178_996],
  AttributeNameSelf: [21_330, 21_330],
  Banned: [813, 813],
  BarredOf: [2584, 2584],
  BaseTypeLexical: [14, 14],
  BaseTypeSelf: [26, 26],
  BindingFit: [3872, 3872],
  BuiltInVariable: [2584, 2584],
  Capped: [49_274, 49_274],
  CardinalityLexical: [10, 10],
  CardinalitySelf: [10, 10],
  ChildGrammar: [933_164, 933_164],
  ChoiceBound: [1538, 1538],
  ChoiceCount: [813, 813],
  ContentModelOf: [1135, 1135],
  ContentReference: [132_994, 132_994],
  CountedOf: [1779, 1779],
  Declares: [250, 250],
  Enters: [813, 813],
  Follow: [45_579, 1_346_026],
  GoverningOf: [786_332, 786_332],
  HeldRootsUnder: [330, 330],
  IncludeParentKind: [106, 106],
  IncludeRoot: [12_566, 12_566],
  KindByNameUnder: [974, 974],
  KindNamespace: [330, 330],
  Last: [495, 4407],
  MappableBaseType: [10, 10],
  ModelPositions: [95, 95],
  Needs: [813, 813],
  OperatorArity: [330, 330],
  PositionSelf: [11_713, 11_713],
  RecordBindingFit: [89, 89],
  ReferenceAttribute: [132_994, 132_994],
  Required: [36_281, 36_281],
  ReservedTargetLexical: [9, 9],
  ResourceTypeLexical: [22, 22],
  ResourceTypeOf: [14, 14],
  RootOfType: [1779, 1779],
  SectionPart: [89, 89],
  SharedModelOf: [813, 813],
  SharedPositions: [21, 21],
  SlotSelf: [1521, 1521],
  StrictlyHeld: [103_692, 103_692],
  Symbol: [160_123, 615_833],
  TextDomain: [2646, 2646],
  TypeAvailable: [175, 175],
  ValueDomainOf: [432, 432],
  ValueIdentity: [99, 99],
  VariableReference: [66_501, 66_501],
  XsiType: [71_492, 71_492],
} as const satisfies Readonly<Record<string, readonly [number, number]>>;

/**
 * Size a set of `cells` one-bit cells as PostgreSQL stores it: ⌈cells / 8⌉ bytes of bits after the
 * 8-byte header.
 *
 * @param cells - The set's cells.
 * @returns Its bytes.
 */
const setBytes = (cells: number): number => Math.ceil(cells / 8) + 8;

describe("the installed constants", () => {
  it.effect(
    "are as large as measured, beside §17's dependent strings and the product over (version, parent) that keying by model and slots replaced",
    () =>
      Effect.gen(function* installedSizes() {
        const composedGrammar = yield* grammar;
        const installed = Object.values(install).flatMap((value) =>
          Option.toArray(Schema.decodeUnknownOption(InstalledSchema)(value)),
        );

        assert.deepStrictEqual(
          Object.fromEntries(
            installed.map((relation) => [relation.name, installedBytes(relation)]),
          ),
          measuredBytes,
        );

        // The content grammar three ways: §17's dependent string by (version, parent) family, as the
        // generator lays it out; as installed, by model, with slots; and as the product of
        // (version, parent) and closedId(Position) for each position, C4's shape before G-fin.
        // Measured on 2026-11-06: §17's cells are the sums over the 1,288 families of install.ts's
        // ModelPositions by ContentModelOf (Σn² 2,057,052 for Follow, Σn 27,440 for Last, after
        // spec reading 44 takes `voice` out of `ssml:token` and `ssml:w`) and of
        // its SharedPositions by SharedModelOf (644 · Σs, 644 · 3,978 for Symbol); the products
        // are 1,288 · 306², 1,288 · 306 and 1,288 · 644 · 306 one-bit cells.
        const families =
          composedGrammar.kinds.versions.handles.length *
          composedGrammar.kinds.nodeKind.handles.length;
        const positions = composedGrammar.content.positions.handles.length;
        const kinds = composedGrammar.kinds.nodeKind.handles.length;

        assert.deepStrictEqual(
          {
            Follow: [
              composedGrammar.content.follow.bytes,
              measuredBytes.Follow[0],
              setBytes(families * positions * positions),
            ],
            Last: [
              composedGrammar.content.last.bytes,
              measuredBytes.Last[0],
              setBytes(families * positions),
            ],
            Symbol: [
              composedGrammar.content.symbol.bytes,
              measuredBytes.Symbol[0],
              setBytes(families * kinds * positions),
            ],
          },
          {
            Follow: [257_140, 45_579, 15_075_404],
            Last: [3438, 495, 49_274],
            Symbol: [320_237, 160_123, 31_727_312],
          },
        );
      }),
  );
});
