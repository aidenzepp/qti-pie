import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
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
});
