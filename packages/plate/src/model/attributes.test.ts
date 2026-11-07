import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, attributePath, doc, el, walk } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import {
  coordsOf,
  doubleAttribute,
  pathOf,
  refusal,
  xsBooleanOf,
  xsInt,
} from "#plate/model/attributes.ts";
import type { AttributeRefusal, ModelWalk } from "#plate/model/attributes.ts";

/**
 * Construct the walk of a document whose root is one element, its paths as a model build walks
 * them.
 *
 * @param root The document's root element.
 * @returns The walk, every element of the document keyed to its path.
 */
const walkOf = (root: SourceElement): ModelWalk => {
  const document = doc("items/attributes.xml", root);

  return {
    builder: "buildItem",
    document,
    paths: new Map(Array.from(walk(document), (visit) => [visit.element, visit.path])),
  };
};

/**
 * Construct the refusal of an element's attribute at that attribute's path, as a model build
 * gives {@link doubleAttribute}.
 *
 * @param build The walk of the element's document.
 * @param element The element whose attribute is refused.
 * @returns The reader's refusal of an attribute of `element`.
 */
const refuseOn =
  (build: ModelWalk, element: SourceElement): AttributeRefusal =>
  (attribute, rule, detail) =>
    refusal(build, rule, attributePath(pathOf(build, element), attribute), detail);

describe("attributes", () => {
  it("reads xs:boolean's four lexical forms and nothing else", () => {
    assert.deepStrictEqual(xsBooleanOf("true"), Option.some(true));
    assert.deepStrictEqual(xsBooleanOf("false"), Option.some(false));
    assert.deepStrictEqual(xsBooleanOf("1"), Option.some(true));
    assert.deepStrictEqual(xsBooleanOf("0"), Option.some(false));
    assert.deepStrictEqual(xsBooleanOf("yes"), Option.none());
  });

  it.effect("reads an xs:int in range and refuses one outside it as value-type", () =>
    Effect.gen(function* readsXsInt() {
      const inRange = el("qti-text-entry-interaction", [attr("base", "2147483647")]);
      assert.deepStrictEqual(
        yield* xsInt(walkOf(inRange), inRange, "base"),
        Option.some(2_147_483_647),
      );

      const outside = el("qti-text-entry-interaction", [attr("base", "2147483648")]);
      const refused = yield* Effect.flip(xsInt(walkOf(outside), outside, "base"));
      assert.strictEqual(refused.rule, "value-type");
      assert.deepStrictEqual(refused.detail, { baseType: "xs:int", lexical: "2147483648" });
      assert.deepStrictEqual(refused.location, {
        kind: "path",
        path: "qti-text-entry-interaction/@base",
      });
    }),
  );

  it.effect(
    "reads an xs:double beyond the largest finite double as that double of its sign (reading 56)",
    () =>
      Effect.gen(function* readsDouble() {
        const declaration = el("qti-outcome-declaration", [
          attr("normal-maximum", "1e309"),
          attr("normal-minimum", "-1e309"),
        ]);
        const refuse = refuseOn(walkOf(declaration), declaration);

        assert.deepStrictEqual(
          yield* doubleAttribute(declaration, "normal-maximum", refuse),
          Option.some(Number.MAX_VALUE),
        );
        assert.deepStrictEqual(
          yield* doubleAttribute(declaration, "normal-minimum", refuse),
          Option.some(-Number.MAX_VALUE),
        );
      }),
  );

  it.effect("reads coords in written order, each with whether it is written with %", () =>
    Effect.gen(function* readsCoords() {
      const plain = el("qti-area-map-entry", [attr("coords", "10,20,30")]);
      assert.deepStrictEqual(yield* coordsOf(walkOf(plain), plain), [
        [10, false],
        [20, false],
        [30, false],
      ]);

      const percent = el("qti-area-map-entry", [attr("coords", "10%,20,30")]);
      assert.deepStrictEqual(yield* coordsOf(walkOf(percent), percent), [
        [10, true],
        [20, false],
        [30, false],
      ]);

      const decimal = el("qti-area-map-entry", [attr("coords", "10,2.5,30")]);
      const refused = yield* Effect.flip(coordsOf(walkOf(decimal), decimal));
      assert.strictEqual(refused.rule, "attribute-type");
    }),
  );
});
