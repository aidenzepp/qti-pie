/**
 * The two copy-backs `70a76ff3` narrowed in `#pantry/qti/expressions.ts`, checked against the
 * four-column laws they replace, over every small instance of their relations (R87's independent
 * check of N2's proof).
 *
 * At grizzle `4b155e8` a referenced UNIQUE must be bounded, and the four-column reverse
 * containments referenced one that holds `Attribute.lexical`, which no pattern bounds. Each reverse
 * is now stated over the selection's key alone:
 *
 * - **ExpressionAttribute:** `writtenAttributes(node, attribute) ⊆ typingAttributes(node, name)`,
 *   where it was `writtenAttributes(node, attribute, kind, lexical) ⊆ typingAttributes(node, name,
 *   kind, lexical)`, beside the forward `typingAttributes(node, name, kind, lexical) ⊆
 *   ExpressionAttribute(node, attribute, kind, lexical)` and the keys `ExpressionAttribute(node,
 *   attribute)` and `typingAttributes(node, name)`.
 * - **SectionIdentifier:** `SectionIdentifier(node) ⊆ sectionIdentifierAttributes(node)`, where it
 *   was the four-column `SectionIdentifier(node, attribute, kind, lexical) ⊆
 *   sectionIdentifierAttributes(node, name, kind, lexical)`, beside the forward and the keys
 *   `SectionIdentifier(node)` and `sectionIdentifierAttributes(node)`.
 *
 * Each law is restated over plain rows, so the check reads neither grizzle nor the overlays: it
 * shows the narrowed laws admit exactly the instances the four-column laws did. In particular a
 * copy whose lexical form differs from its attribute's is refused, by the forward containment
 * alone, since the key leaves no second row for it to equal.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";

/**
 * An attribute of the copied selection, as the law reads it: its node, its name, its element's
 * kind and its lexical form.
 */
interface SourceRow {
  readonly kind: string;
  readonly lexical: string;
  readonly name: string;
  readonly node: string;
}

/**
 * A copy's row, as the law reads it: its node, the attribute it copies, its kind, its lexical
 * form, and whether the reverse containment reads it (ExpressionAttribute's `written`; every
 * SectionIdentifier row).
 */
interface CopyRow {
  readonly attribute: string;
  readonly kind: string;
  readonly lexical: string;
  readonly node: string;
  readonly written: boolean;
}

/**
 * One instance of a selection and its copy, each a keyed set: no two source rows share the
 * selection's key, and no two copies share the copy's key.
 */
interface Instance {
  readonly copies: readonly CopyRow[];
  readonly sources: readonly SourceRow[];
}

/**
 * How one copy-back keys its two sides: ExpressionAttribute and its selection by node and name,
 * SectionIdentifier and its selection by node alone.
 */
type Keying = "node" | "node and name";

/**
 * The verdict of the forward containment and one reverse over an instance: whether every law
 * holds.
 *
 * @param instance - The rows.
 * @param reverse - The reverse containment: the four-column one, or the one over the key.
 * @returns Whether the instance is admitted.
 */
const admits = (instance: Instance, reverse: "four columns" | "key"): boolean => {
  const forward = instance.sources.every((s) =>
    instance.copies.some(
      (c) =>
        c.node === s.node && c.attribute === s.name && c.kind === s.kind && c.lexical === s.lexical,
    ),
  );
  const backward = instance.copies
    .filter(({ written }) => written)
    .every((c) =>
      instance.sources.some(
        (s) =>
          s.node === c.node &&
          s.name === c.attribute &&
          (reverse === "key" || (s.kind === c.kind && s.lexical === c.lexical)),
      ),
    );

  return forward && backward;
};

/**
 * A keyed set of rows: each key's row, or its absence.
 *
 * @param keys - The key values, each one draw.
 * @param row - The rows a key may hold.
 * @returns The generator.
 */
const keyed =
  <K, R>(keys: readonly K[], row: (key: K) => Gen<R | undefined>): Gen<readonly R[]> =>
  (source) =>
    keys.flatMap((key) => {
      const held = source.draw(row(key));

      return held === undefined ? [] : [held];
    });

/**
 * Every instance over one node, two names, two kinds and two lexical forms, keyed as the copy-back
 * keys its sides. Keyed by node alone, a source row's name and a copy's attribute are payload,
 * drawn per node; keyed by node and name, each (node, name) is a key of its own.
 *
 * @param keying - How the copy-back keys its sides.
 * @returns The generator.
 */
const instancesOf = (keying: Keying): Gen<Instance> => {
  const names = ["base-type", "name"] as const;
  const keys: readonly (readonly [string, (typeof names)[number] | undefined])[] =
    keying === "node" ? [["n1", undefined]] : names.map((n) => ["n1", n] as const);
  const lexicals = ["integer", "float"] as const;
  const kinds = ["qti-base-value", "qti-math-operator"] as const;

  return (source) => ({
    copies: source.draw(
      keyed(
        keys,
        ([node, name]) =>
          (s) =>
            s.draw(element([false, true] as const))
              ? {
                  attribute: name ?? s.draw(element(names)),
                  kind: s.draw(element(kinds)),
                  lexical: s.draw(element(lexicals)),
                  node,
                  written: keying === "node" ? true : s.draw(element([false, true] as const)),
                }
              : undefined,
      ),
    ),
    sources: source.draw(
      keyed(
        keys,
        ([node, name]) =>
          (s) =>
            s.draw(element([false, true] as const))
              ? {
                  kind: s.draw(element(kinds)),
                  lexical: s.draw(element(lexicals)),
                  name: name ?? s.draw(element(names)),
                  node,
                }
              : undefined,
      ),
    ),
  });
};

/**
 * A situation the box must reach: a read copy whose lexical form differs from its attribute's, a
 * read copy with no attribute, an unread copy with no attribute, and both verdicts.
 */
type Situation =
  | "a read copy with another lexical form"
  | "a read copy with no attribute"
  | "an unread copy with no attribute"
  | "admitted"
  | "refused";

/**
 * Name the situations one instance reaches.
 *
 * @param instance - The rows.
 * @param admitted - Whether the four-column laws admit it.
 * @returns Its situations.
 */
const situationsOf = (instance: Instance, admitted: boolean): readonly Situation[] => {
  const attributeOf = (c: CopyRow) =>
    instance.sources.find((s) => s.node === c.node && s.name === c.attribute);
  const reached: [Situation, boolean][] = [
    [
      "a read copy with another lexical form",
      instance.copies.some(
        (c) =>
          c.written &&
          attributeOf(c)?.lexical !== undefined &&
          attributeOf(c)?.lexical !== c.lexical,
      ),
    ],
    [
      "a read copy with no attribute",
      instance.copies.some((c) => c.written && attributeOf(c) === undefined),
    ],
    [
      "an unread copy with no attribute",
      instance.copies.some((c) => !c.written && attributeOf(c) === undefined),
    ],
    ["admitted", admitted],
    ["refused", !admitted],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

describe("qti/expressions.ts, the copy-backs over the selection's key", () => {
  for (const [keying, situations] of [
    [
      "node and name",
      [
        "a read copy with another lexical form",
        "a read copy with no attribute",
        "an unread copy with no attribute",
        "admitted",
        "refused",
      ],
    ],
    [
      "node",
      [
        "a read copy with another lexical form",
        "a read copy with no attribute",
        "admitted",
        "refused",
      ],
    ],
  ] as const) {
    it.effect(
      `admits exactly what the four-column laws admit, keyed by ${keying}, and refuses a copy whose lexical form is not its attribute's`,
      (ctx) =>
        // Oracle: a specification, the four-column reverse containment that 70a76ff3 replaced,
        // beside the forward containment and both keys, restated over plain rows.
        // Bound: every instance over one node, two names, two kinds and two lexical forms, each
        // side keyed as the copy-back keys it.
        searched(
          ctx,
          exhaust(
            {
              box: `every keyed instance over one node, two names, two kinds and two lexical forms, keyed by ${keying}`,
              caseHang: Duration.seconds(5),
              coverage: requiredInSpace<Situation>(situations),
              generator: instancesOf(keying),
              limit: 5000,
              literal: (instance) => JSON.stringify(instance),
              oracle: { kind: "specification", name: "the four-column copy-back laws" },
              suite: `pantry/qti/expressions-copy-back-${keying === "node" ? "section" : "attribute"}`,
            },
            (instance, c) =>
              Effect.sync(() => {
                const four = admits(instance, "four columns");
                c.noteAll(situationsOf(instance, four));

                assert.strictEqual(admits(instance, "key"), four, JSON.stringify(instance));
                for (const copy of instance.copies) {
                  const source = instance.sources.find(
                    (s) => s.node === copy.node && s.name === copy.attribute,
                  );
                  if (copy.written && source !== undefined && source.lexical !== copy.lexical) {
                    assert.isFalse(admits(instance, "key"), JSON.stringify(instance));
                  }
                }
              }),
          ),
        ),
    );
  }
});
