/**
 * The names a document is written under (`#pantry/model/names.ts`), read off each kind's handle,
 * against the names the vocabulary rosters give the kinds, the rows the composition's
 * `ElementName` holds (`elementsOf` of `#pantry/grammar/kinds.ts`).
 */
import { assert, describe, it } from "@effect/vitest";
import { elementsOf } from "#pantry/grammar/kinds.ts";
import { elementNameOf } from "#pantry/model/names.ts";
import { vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";
import { namespaceNameOf } from "#pantry/vocab/namespaces.ts";

describe("elementNameOf", () => {
  it("reads every roster kind's handle as the name its roster gives the kind", () => {
    // Oracle: the rosters' own local names and namespaces, the `ElementName` rows, for all 634
    // kinds; a handle that spells another name differs here.
    const rows = elementsOf(
      vocabularies.map(({ kinds, namespace }) => ({
        kinds,
        namespace: namespaceNameOf(namespace),
      })),
    );
    const read = rows.map(({ handle }) => ({ handle, row: elementNameOf(handle) }));

    assert.strictEqual(rows.length, 634);
    assert.deepStrictEqual(read, rows);
  });

  it("refuses a handle whose prefix no vocabulary carries", () => {
    assert.throws(() => {
      elementNameOf("svg:circle");
    }, /svg:circle/u);
  });
});
