import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { Kind } from "#pantry/grammar/compose.ts";
import { fixedKinds, isForeignKind } from "#pantry/grammar/kinds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { names } from "#pantry/model/names.ts";
import type { ElementKind } from "#pantry/model/xdm.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * Whether a composed kind is an element kind: no kind the XDM fixes, and no foreign kind.
 *
 * @param kind - The kind.
 * @returns Whether it is one.
 */
const isElementKind = (kind: Kind): kind is ElementKind<Composed> =>
  !fixedKinds.some((fixed) => fixed === kind) && !isForeignKind(kind);

describe("the names a document is written under", () => {
  it.effect(
    "name every element kind as the composed grammar's ElementName does, read off the rosters alone",
    () =>
      // Oracle: the composition's `ElementName`, the kinds generator's reading of the same rosters.
      // The names module reads them without composing, so this test is where the two would part.
      Effect.gen(function* sameNames() {
        const { kinds } = yield* grammar;
        const rows = kinds.elementName.rows;

        assert.isAbove(rows.length, 0);
        assert.deepStrictEqual(
          rows.map(({ kind }) => (isElementKind(kind) ? names.element(kind) : undefined)),
          rows.map(({ local, namespace }) => ({ local, namespace })),
        );
      }),
  );
});
