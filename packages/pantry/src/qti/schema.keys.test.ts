/**
 * No key `Qti` states is held by another key of its relation (cutover K7): a key whose selection's
 * conditions include another key's, and whose terms and fixed fields hold that key's terms, is a
 * law no state breaks without breaking the other one, and an index.
 *
 * Grizzle keys a containment's target by any such key, its terms among the target's terms and the
 * fields the target's selection fixes, by `field = literal` or `field = term` (README, "Keys";
 * `laws/model/plan.ts` `keyedBy` and `#fixedTarget` at `4b0d45e`), and a generated UNIQUE over a
 * declared key's fields reports that key's law (`laws/model/model.ts` `#implyingKey`). So the
 * narrower key is needed neither to key a target nor to name a refusal, and it costs a UNIQUE over
 * a law column, where a copy's source needs only a plain B-tree for its reverse probe.
 *
 * The keys are read off `lawsOf(Qti)`, every primary key and every key statement as an outcome
 * names it, never off grizzle's statement shapes. A held key a lane still owes the deletion of is a
 * row of {@link owed}, a list that only shrinks: a held key not owed fails, and so does an owed one
 * no longer held.
 */
import { lawsOf } from "@bjornpagen/grizzle";
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Equal } from "effect";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * How long reading `Qti`'s laws may take: `lawsOf` compiles its law model.
 * Measured 2026-11-08: 44.8 s at a load average of 68 to 80.
 */
const compileTimeout = 180_000;

/**
 * A term of a side, as a key's terms are compared: its kind and its field.
 */
type Term = LawSide["terms"][number];

/**
 * A key as implication reads it: its relation, its selection's conjuncts, each in the canonical
 * form `lawsOf` gives it, its terms, and the fields its selection fixes.
 */
interface Key {
  readonly conjuncts: LawSide["selection"]["conjuncts"];
  readonly fixed: ReadonlySet<string>;
  readonly relation: string;
  readonly terms: readonly Term[];
}

/**
 * The fields a selection fixes beyond a side's terms, each by a conjunct that equates it to a
 * literal or to one of the side's field terms: every row the side reads holds the one value there,
 * or the value of a term the key compares. A conjunct's literal is its second operand, its
 * canonical form (README, "lawsOf").
 *
 * @param side - The side.
 * @returns The fields.
 */
const fixedOf = (side: LawSide): ReadonlySet<string> => {
  const fields = new Set(side.terms.flatMap((t) => (t.kind === "field" ? [t.field] : [])));

  const fixed = side.selection.conjuncts.flatMap((c) => {
    if (c.kind !== "compare" || c.op !== "eq" || c.left.kind !== "field") {
      return [];
    }

    if (c.right.kind === "literal") {
      return [c.left.field];
    }

    if (c.right.kind !== "field") {
      return [];
    }

    if (fields.has(c.right.field)) {
      return [c.left.field];
    }

    return fields.has(c.left.field) ? [c.right.field] : [];
  });

  return new Set(fixed);
};

/**
 * Read a law as a key: a primary key over every row, or a key statement over its side.
 *
 * @param law - A law of `lawsOf(Qti)`.
 * @returns The key, or none for any other law.
 */
const keyOf = (law: Law): readonly Key[] => {
  if (law.kind === "primaryKey") {
    const terms = law.fields.map((field): Term => ({ field, kind: "field" }));

    return [{ conjuncts: [], fixed: new Set(), relation: law.relation, terms }];
  }

  if (law.kind === "key") {
    const { relation, selection, terms } = law.side;

    return [{ conjuncts: selection.conjuncts, fixed: fixedOf(law.side), relation, terms }];
  }

  return [];
};

/**
 * Whether one key holds another: the same relation, its conjuncts all the other's, and each of its
 * terms one of the other's terms or a field the other's selection fixes. Every two rows the other
 * reads that agree at its terms are then two rows this one reads that agree at its own.
 *
 * @param holder - The wider key.
 * @param key - The key it may hold.
 * @returns Whether it does.
 */
const holds = (holder: Key, key: Key): boolean =>
  holder.relation === key.relation &&
  holder.conjuncts.every((c) => key.conjuncts.some((k) => Equal.equals(c, k))) &&
  holder.terms.every(
    (t) =>
      key.terms.some((k) => k.kind === t.kind && k.field === t.field) ||
      (t.kind === "field" && key.fixed.has(t.field)),
  );

/**
 * A key's text: its relation, its terms and how many conjuncts select it.
 *
 * @param key - The key.
 * @returns The text.
 */
const textOf = (key: Key): string => {
  const terms = key.terms.map((t) => (t.kind === "field" ? t.field : `pred(${t.field})`));
  const count = key.conjuncts.length;
  const selected = count === 0 ? "" : ` where ${count} conjunct${count === 1 ? "" : "s"}`;

  return `${key.relation}(${terms.join(", ")})${selected}`;
};

/**
 * The held keys a lane of the grizzle cutover owes the deletion of, by their text, each with its
 * site and holder and how many share the text: the list only shrinks.
 */
const owed = {
  "Document(package, path) where 1 conjunct": [
    "lane E: package.ts, stimulusDocuments, held by Document's key (package, path)",
    1,
  ],
  "FileHref(package, path) where 1 conjunct": [
    "lane E: package.ts, entryFileHrefs, held by FileHref's primary key, its scope fixed",
    1,
  ],
  "MappingLookup(itemRef, name) where 1 conjunct": [
    "lane G: expressions.ts, mappedNames, held by MappingLookup's primary key (R7)",
    1,
  ],
  "Reference(node, name) where 1 conjunct": [
    "lane E: package.ts, entryReferences, held by Reference's primary key",
    1,
  ],
  "ReferencePath(node) where 1 conjunct": [
    "lane E: package.ts, hrefPaths, held by ReferencePath's primary key, its name fixed",
    1,
  ],
  "VariableLookup(document, name) where 1 conjunct": [
    "lane G: expressions.ts, absentNames, held by VariableLookup's primary key (R7)",
    1,
  ],
  "VariableRef(node) where 2 conjuncts": [
    "lane G: expressions.ts, heldReferences, held by VariableRef's primary key, its attribute fixed",
    1,
  ],
} as const satisfies Readonly<Record<string, readonly [site: string, count: number]>>;

describe("qti/schema.ts, its keys", { timeout: compileTimeout }, () => {
  it("states no key that another key of its relation holds", () => {
    // Oracle: implication by selection and terms, the sufficient condition grizzle keys a target
    // by. Bound: every primary key and key statement of `lawsOf(Qti)`.
    const keys = lawsOf(Qti).flatMap((law) => keyOf(law).map((key) => [law, key] as const));
    const held = keys.flatMap(([law, key]) => {
      if (law.kind !== "key") {
        return [];
      }

      const holders = keys.flatMap(([other, holder]) =>
        other !== law && holds(holder, key) ? [textOf(holder)] : [],
      );

      return Arr.isReadonlyArrayNonEmpty(holders) ? [[textOf(key), holders] as const] : [];
    });

    assert.deepStrictEqual(
      Object.fromEntries(
        Object.entries(Arr.groupBy(held, ([text]) => text)).map(([text, rows]) => [
          text,
          rows.length,
        ]),
      ),
      Object.fromEntries(Object.entries(owed).map(([text, [, count]]) => [text, count])),
      held.map(([text, holders]) => `${text}, held by ${holders.join(" and ")}`).join("\n"),
    );
  });
});
