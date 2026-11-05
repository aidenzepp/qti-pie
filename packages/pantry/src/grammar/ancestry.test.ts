import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { admits, flags, generate, rowOf, step } from "#pantry/grammar/ancestry.ts";
import type { Ancestry, AncestrySets, Flag } from "#pantry/grammar/ancestry.ts";
import { NodeKind } from "#pantry/schema/node.ts";
import { admission, ancestryStep } from "#pantry/schema/seed/admission.ts";
import { ancestryHandles, interactionKinds } from "#pantry/schema/seed/ancestry.ts";

/**
 * Today's composition: the 363 `NodeKind` handles the `AncestryStep` rows range over, and the 20
 * interaction kinds.
 */
const today = { interactions: interactionKinds, kinds: NodeKind.handles };

/**
 * The ancestry grammar over today's composition.
 */
const grammar = Effect.fromResult(generate(today));

/**
 * An `AncestryStep` row: the ancestry a node sits in, its kind, and the ancestry it hands its
 * children, each ancestry by its handle.
 */
interface StepRow {
  readonly ancestry: string;
  readonly kind: string;
  readonly next: string;
}

/**
 * The ancestries a tree reaches, and where its nodes sit.
 */
interface Closure {
  /**
   * Each ancestry some node sits in, under its handle.
   */
  readonly ancestries: ReadonlyMap<string, Ancestry>;
  /**
   * Each (ancestry handle, kind) pair some node is, as {@link placeOf} spells it.
   */
  readonly placed: ReadonlySet<string>;
}

/**
 * Construct an ancestry from its flags.
 *
 * @param held - The flags.
 * @returns The ancestry holding them.
 */
const at = (...held: readonly Flag[]): Ancestry => new Set(held);

/**
 * Name an ancestry as an `Ancestry` handle is named: its flags in code order joined with `.`,
 * `root` for none.
 *
 * @param ancestry - The ancestry.
 * @returns Its handle.
 */
const nameOf = (ancestry: Ancestry): string => {
  const held = flags.filter((flag) => ancestry.has(flag));

  return held.length === 0 ? "root" : held.join(".");
};

/**
 * Spell a node's place, the ancestry it sits in and its kind, as one key.
 *
 * @param ancestry - The ancestry's handle.
 * @param kind - The kind.
 * @returns The key.
 */
const placeOf = (ancestry: string, kind: string): string => `${ancestry}\u0000${kind}`;

/**
 * Spell a step row as one key.
 *
 * @param row - The row.
 * @returns Its three fields, as one key.
 */
const keyOf = (row: StepRow): string => `${placeOf(row.ancestry, row.kind)}\u0000${row.next}`;

/**
 * Close the ancestries over the composed `Admission` rows, both versions together, as
 * `AncestryStep`'s roster was closed: a tree starts at every kind no row admits as a child, in the
 * empty ancestry, and a node the law admits hands each child kind its step.
 *
 * @param sets - The ancestry grammar.
 * @returns The ancestries reached, and the places nodes reach.
 */
const closure = (sets: AncestrySets): Closure => {
  const childrenOf = Map.groupBy(admission, (row) => row.parent);
  const children = new Set(admission.map((row) => row.child));
  const pending: (readonly [Ancestry, string])[] = [...childrenOf.keys()]
    .filter((kind) => !children.has(kind))
    .map((kind) => [at(), kind] as const);
  const ancestries = new Map<string, Ancestry>();
  const placed = new Set<string>();

  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [parent, kind] = next;
    const place = placeOf(nameOf(parent), kind);

    if (!placed.has(place) && admits(sets, parent, kind)) {
      placed.add(place);
      ancestries.set(nameOf(parent), parent);

      const inner = step(sets, parent, kind);
      for (const row of childrenOf.get(kind) ?? []) {
        pending.push([inner, row.child]);
      }
    }
  }

  return { ancestries, placed };
};

/**
 * Expand the law over ancestries: one row for each ancestry and each kind the law admits there,
 * with the step it hands its children.
 *
 * @param sets - The ancestry grammar.
 * @param ancestries - The ancestries.
 * @returns The rows, ancestries outermost.
 */
const expand = (sets: AncestrySets, ancestries: Iterable<Ancestry>): readonly StepRow[] =>
  [...ancestries].flatMap((parent) =>
    NodeKind.handles
      .filter((kind) => admits(sets, parent, kind))
      .map((kind) => ({ ancestry: nameOf(parent), kind, next: nameOf(step(sets, parent, kind)) })),
  );

describe("the three sets", () => {
  it.effect("are 363 kinds by 8 flags, 2,904 one-bit cells and 371 bytes each", () =>
    Effect.gen(function* sizes() {
      const sets = yield* grammar;

      for (const set of [sets.enters, sets.banned, sets.needs]) {
        assert.strictEqual(set.cells, 2904, set.name);
        assert.strictEqual(set.width, 1, set.name);
        assert.strictEqual(set.bytes, 371, set.name);
      }

      assert.deepStrictEqual(
        [sets.enters, sets.banned, sets.needs].map((set) => [set.name, set.rows.length]),
        [
          ["Enters", 38],
          ["Banned", 122],
          ["Needs", 1],
        ],
      );
    }),
  );

  it.effect("hold each kind's flags as its row", () =>
    Effect.gen(function* rows() {
      const sets = yield* grammar;

      assert.deepStrictEqual(rowOf(sets.enters, "qti-gap-match-interaction"), at("int", "gap"));
      assert.deepStrictEqual(rowOf(sets.enters, "qti-prompt"), at("choice"));
      assert.deepStrictEqual(rowOf(sets.enters, "p"), at());
      assert.deepStrictEqual(
        rowOf(sets.banned, "qti-choice-interaction"),
        at("int", "choice", "htx", "rubric", "tmpl", "modal"),
      );
      assert.deepStrictEqual(rowOf(sets.banned, "qti-gap"), at());
      assert.deepStrictEqual(rowOf(sets.needs, "qti-gap"), at("gap"));
    }),
  );

  it.effect("refuse a kind the roster lacks, naming the set that names it", () =>
    Effect.gen(function* refusals() {
      const noGap = yield* Effect.flip(
        Effect.fromResult(
          generate({ ...today, kinds: today.kinds.filter((kind) => kind !== "qti-gap") }),
        ),
      );
      const unknownInteraction = yield* Effect.flip(
        Effect.fromResult(
          generate({
            ...today,
            interactions: [...today.interactions, "qti-portable-custom-interaction"],
          }),
        ),
      );

      assert.strictEqual(noGap._tag, "OutsideCodeSpace");
      assert.include(noGap.message, "Needs has a row whose kind is qti-gap");
      assert.include(
        unknownInteraction.message,
        "Enters has a row whose kind is qti-portable-custom-interaction",
      );
    }),
  );
});

describe("the law", () => {
  it.effect("steps by the kind's row of Enters", () =>
    Effect.gen(function* steps() {
      const sets = yield* grammar;

      assert.deepStrictEqual(step(sets, at(), "qti-choice-interaction"), at("int"));
      assert.deepStrictEqual(step(sets, at("int"), "qti-prompt"), at("int", "choice"));
      assert.deepStrictEqual(
        step(sets, at("int", "choice"), "qti-hottext"),
        at("int", "choice", "htx"),
      );
      assert.deepStrictEqual(step(sets, at("fb"), "qti-choice-interaction"), at("fb", "int"));
      assert.deepStrictEqual(step(sets, at(), "p"), at());
    }),
  );

  it.effect("refuses a banned flag and a needed one missing, and admits the rest", () =>
    Effect.gen(function* bans() {
      const sets = yield* grammar;
      const refused = [
        [at("int"), "qti-choice-interaction"],
        [at("int", "choice"), "qti-text-entry-interaction"],
        [at(), "qti-gap"],
        [at("rubric"), "qti-rubric-block"],
        [at("int", "htx"), "qti-hottext"],
        [at("htx"), "qti-text-entry-interaction"],
      ] as const;
      const admitted = [
        [at("int", "gap"), "qti-gap"],
        [at("int", "choice"), "qti-hottext"],
        [at("fb"), "qti-choice-interaction"],
        [at("fb", "int", "gap", "choice", "htx"), "p"],
      ] as const;

      for (const [ancestry, kind] of refused) {
        assert.isFalse(admits(sets, ancestry, kind), `${nameOf(ancestry)} ${kind}`);
      }

      for (const [ancestry, kind] of admitted) {
        assert.isTrue(admits(sets, ancestry, kind), `${nameOf(ancestry)} ${kind}`);
      }
    }),
  );

  it.effect(
    "reads the bans in the parent's ancestry, since 22 kinds enter a flag they are banned under",
    () =>
      Effect.gen(function* parentAncestry() {
        const sets = yield* grammar;
        const selfBanned = NodeKind.handles.filter(
          (kind) => !rowOf(sets.banned, kind).isDisjointFrom(rowOf(sets.enters, kind)),
        );

        assert.deepStrictEqual(
          selfBanned.toSorted(),
          [...interactionKinds, "qti-rubric-block", "qti-hottext"].toSorted(),
        );

        for (const kind of selfBanned) {
          assert.isTrue(admits(sets, at(), kind), kind);
          assert.isFalse(rowOf(sets.banned, kind).isDisjointFrom(step(sets, at(), kind)), kind);
        }
      }),
  );
});

describe("against AncestryStep", () => {
  it.effect("closes over the composed Admission rows to the 56 reachable ancestries", () =>
    Effect.gen(function* reachable() {
      const { ancestries } = closure(yield* grammar);

      assert.strictEqual(ancestries.size, 56);
      assert.deepStrictEqual([...ancestries.keys()].toSorted(), [...ancestryHandles].toSorted());
    }),
  );

  it.effect("expands to exactly the 18,924 AncestryStep rows and their next", () =>
    Effect.gen(function* reproduce() {
      const sets = yield* grammar;
      const { ancestries } = closure(sets);
      const rows = expand(sets, ancestries.values()).filter((row) => ancestries.has(row.next));

      assert.strictEqual(rows.length, 18_924);
      assert.deepStrictEqual(rows.map(keyOf).toSorted(), ancestryStep.map(keyOf).toSorted());
    }),
  );

  it.effect("admits 248 places more than AncestryStep, none of which a tree reaches", () =>
    Effect.gen(function* equivalent() {
      const sets = yield* grammar;
      const { ancestries, placed } = closure(sets);
      const expansion = expand(sets, ancestries.values());
      const beyond = expansion.filter((row) => !ancestries.has(row.next));

      // 56 × 363 places: 1,156 the bans refuse, 18,924 `AncestryStep` holds, and 248 whose step
      // leaves the 56 ancestries, which `AncestryStep` could not name.
      assert.strictEqual(56 * 363 - expansion.length, 1156);
      assert.strictEqual(beyond.length, 248);
      assert.deepStrictEqual(
        beyond.filter((row) => placed.has(placeOf(row.ancestry, row.kind))),
        [],
      );
    }),
  );
});
