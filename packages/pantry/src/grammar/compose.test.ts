import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { Kind, Name } from "#pantry/grammar/compose.ts";
import { fixedKinds, foreignKinds, openClasses } from "#pantry/grammar/kinds.ts";
import { toyFacets, toyGrammar, toyVocabulary } from "#pantry/test/gen/grammar.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * Whether a handle type kept its literals: `true` for a union of string literals, `false` once it
 * widened to `string`.
 */
type Literal<Handle extends string> = string extends Handle ? false : true;

describe("the composition", () => {
  it("keeps the vocabularies' handles as literal unions, so the XDM's compile-time contracts hold", () => {
    const kindsAreLiteral: Literal<Kind> = true;
    const namesAreLiteral: Literal<Name> = true;

    assert.isTrue(kindsAreLiteral && namesAreLiteral);
  });

  it.effect(
    "admits XML Schema's xsi: names on every element kind, xsi:nil only on the foreign kinds (audit A6)",
    () =>
      Effect.gen(function* xsi() {
        const { attributes, kinds } = yield* grammar;
        const holders = (name: string) =>
          attributes.admission.rows
            .filter((row) => row.name === name && row.version === "3.0.1")
            .map(({ kind }) => kind);
        const elements = kinds.isElement.rows.map(({ kind }) => kind);

        for (const name of ["xsi:schemaLocation", "xsi:type", "xsi:noNamespaceSchemaLocation"]) {
          assert.deepStrictEqual(new Set(holders(name)), new Set(elements), name);
        }

        assert.deepStrictEqual(new Set(holders("xsi:nil")), new Set(Object.values(foreignKinds)));
      }),
  );

  it.effect("codes the open classes first in AttributeName, 0 to 3", () =>
    Effect.gen(function* openCodes() {
      const { kinds } = yield* grammar;

      assert.deepStrictEqual(
        openClasses.map((name) => kinds.attributeName.codeOf(name)),
        [Option.some(0), Option.some(1), Option.some(2), Option.some(3)],
      );
    }),
  );

  it.effect(
    "gives every admitted child the content position 0 or a position its family's automaton reaches",
    () =>
      Effect.gen(function* positions() {
        const { admission, content } = yield* grammar;
        const reached = new Set(
          content.follow.rows.map(({ parent, to, version }) => `${version} ${parent} ${to}`),
        );
        const outside = admission.rows.filter(
          ({ parent, position, version }) =>
            position !== "0" && !reached.has(`${version} ${parent} ${position}`),
        );

        assert.deepStrictEqual(outside.slice(0, 10), []);
      }),
    60_000,
  );

  it("builds a toy grammar through the production path", () => {
    const result = toyGrammar([
      toyVocabulary({
        admission: [{ child: "e1", parent: "e0", version: "3.0.1" }],
        attributes: ["id"],
        data: ["ws"],
        facets: toyFacets({}),
        kinds: ["e0", "e1"],
      }),
    ]);

    assert.deepStrictEqual(
      Result.isSuccess(result) ? [...result.success.kinds.nodeKind.handles] : result.failure._tag,
      [...fixedKinds, "ws", "e0", "e1"],
    );
  });
});
