import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { vocabularyFacets } from "#pantry/grammar/facets.ts";
import { toyFacets, toyGrammar, toySources, toyVocabulary } from "#pantry/test/gen/grammar.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * A toy composition whose parent `e0` admits `e1` and `e2` at positions 1 and 2 of its model, and
 * bars them as stated.
 *
 * @param barrings - The barrings, each its kinds and attribute.
 * @returns The composition's grammar, or its refusal.
 */
const barredToy = (
  barrings: readonly { readonly kinds: readonly [string, ...string[]]; readonly name: string }[],
) => {
  const toy = toyVocabulary({
    admission: [],
    attributes: ["span", "width"],
    data: ["ws", "comment", "pi"],
    facets: toyFacets({
      children: {
        barrings: barrings.map(({ kinds, name }) => ({
          kinds,
          name,
          parents: ["e0"],
          source: "toy",
          versions: ["3.0.1"],
        })),
        lastWhere: [],
      },
    }),
    kinds: ["e0", "e1", "e2", "e3"],
  });

  return toyGrammar([
    {
      ...toy,
      models: [
        {
          content: {
            _tag: "element-only",
            particle: {
              _tag: "group",
              compositor: "sequence",
              occurs: { max: Option.some(1), min: 1 },
              particles: [
                {
                  _tag: "element",
                  kinds: ["e1"],
                  occurs: { max: Option.none(), min: 0 },
                  sources: toySources(["3.0.1"]),
                },
                {
                  _tag: "element",
                  kinds: ["e2"],
                  occurs: { max: Option.none(), min: 0 },
                  sources: toySources(["3.0.1"]),
                },
              ],
              sources: toySources(["3.0.1"]),
            },
          },
          kind: "e0",
          sources: toySources(["3.0.1"]),
          type: Option.none(),
          versions: ["3.0.1"],
        },
      ],
    },
  ]);
};

describe("ChildBarredBy", () => {
  it.effect("bars colgroup's col, at col's content position, while colgroup carries span", () =>
    Effect.gen(function* colgroup() {
      const { admission, barredBy } = yield* grammar;

      for (const version of ["3.0.0", "3.0.1"] as const) {
        assert.deepStrictEqual(
          barredBy.lookup({ parent: "colgroup", version }),
          Option.map(
            admission.lookup({ child: "col", parent: "colgroup", version }),
            ({ position }) => ({
              name: "span",
              parent: "colgroup",
              position,
              version,
            }),
          ),
        );
      }
    }),
  );

  it.effect("cites each row's own barring as its source, every barring of every vocabulary", () =>
    // Oracle: the specification as a checker: a closed relation's row carries the source of the
    // fact it states (fin.md §17, provenance), here the barring the vocabulary's facet states.
    Effect.gen(function* provenance() {
      const { barredBy } = yield* grammar;
      const stated = [...vocabularyFacets.values()].flatMap(({ children }) =>
        children.barrings.flatMap(({ parents, source, versions }) =>
          versions.flatMap((version) => parents.map((parent) => ({ parent, source, version }))),
        ),
      );

      assert.isNotEmpty(stated);
      assert.deepStrictEqual(
        stated.map(({ parent, version }) => barredBy.sourceOf({ parent, version })),
        stated.map(({ source }) => Option.some({ _tag: "spec", cite: source })),
      );
    }),
  );

  it("refuses each named invalid barring: an unadmitted kind, kinds at two positions, a second attribute", () => {
    const tagOf = (result: ReturnType<typeof barredToy>) =>
      Result.isFailure(result) ? result.failure._tag : "composed";

    assert.deepStrictEqual(
      [
        tagOf(barredToy([{ kinds: ["e1"], name: "span" }])),
        tagOf(barredToy([{ kinds: ["e3"], name: "span" }])),
        tagOf(barredToy([{ kinds: ["e1", "e2"], name: "span" }])),
        tagOf(barredToy([{ kinds: ["ws"], name: "span" }])),
        tagOf(
          barredToy([
            { kinds: ["e1"], name: "span" },
            { kinds: ["e2"], name: "width" },
          ]),
        ),
      ],
      ["composed", "UnadmittedChild", "SplitMembers", "SplitMembers", "KeyCollision"],
    );
  });
});

describe("LastWhere", () => {
  it.effect("names the default hotspot under the two interactions that end with it", () =>
    Effect.gen(function* lastSlot() {
      const { admission, lastWhere } = yield* grammar;

      assert.deepStrictEqual(
        lastWhere.flatMap(({ kind, parents, versions }) =>
          parents.flatMap((parent) =>
            versions.filter((version) =>
              Option.isNone(admission.lookup({ child: kind, parent, version })),
            ),
          ),
        ),
        [],
      );
    }),
  );

  it.effect(
    "puts last only a hotspot choice's default, under the hotspot and graphic order interactions, never an associable hotspot's (spec reading 71)",
    () =>
      // Oracle: the specification as a checker. "The default hotspot, if defined, must appear
      // last" is said of the HotspotChoice class (§5.67), whose choices the hotspot and graphic
      // order interactions hold, and of the hotspot interaction's choices (§5.68.6); the
      // AssociableHotspot class (§5.7) and the graphic associate interaction's hotspots (§5.59.4)
      // say nothing of a default, so a rule over `qti-associable-hotspot` refuses valid content.
      Effect.gen(function* readingSeventyOne() {
        const { lastWhere } = yield* grammar;

        assert.deepStrictEqual(
          new Set(
            lastWhere.flatMap(({ attribute, kind, parents, value }) =>
              parents.map((parent) => `${parent} ${kind} ${attribute}=${value}`),
            ),
          ),
          new Set([
            "qti-hotspot-interaction qti-hotspot-choice shape=default",
            "qti-graphic-order-interaction qti-hotspot-choice shape=default",
          ]),
        );
      }),
  );
});
