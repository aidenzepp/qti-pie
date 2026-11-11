/**
 * The committed law-name dictionary (`#pantry/vocab/law-names.json`), held to the schema: the file
 * is the one `#pantry/test/law-names.ts` generates from the schema's naming and grizzle's
 * `lawIdsOf`, and the
 * importer's namer over it (`#pantry/import/refusal.ts` `namerFrom`) names every law grizzle's
 * `lawsOf(Qti)` states, each as a refusal of it carries it (its id beside it), exactly as the
 * schema's own naming does (`#pantry/test/law-namer.ts`), so naming a refusal needs no schema.
 */
import { readFileSync } from "node:fs";
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Formatter, Option, Schema } from "effect";
import { lawNames, LawNamesFileSchema, namerFrom } from "#pantry/import/refusal.ts";
import type { LawNamer, LawNamesFile } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { schemaLawNameOf, schemaLawsOf } from "#pantry/test/law-namer.ts";
import { lawNamesOf, lawNamesPath, refusedOf } from "#pantry/test/law-names.ts";

/**
 * The committed dictionary, decoded.
 */
const committed = Schema.decodeUnknownSync(Schema.fromJsonString(LawNamesFileSchema))(
  readFileSync(lawNamesPath, "utf-8"),
);

/**
 * List every law a namer names otherwise than the schema's own naming does, each with both names.
 *
 * @param namer - The namer under test.
 * @param laws - The laws to name, each as a refusal of it carries it ({@link refusedOf}).
 * @returns Each disagreement as a line of text, empty when they agree on every law.
 */
const disagreements = (namer: LawNamer, laws: readonly Law[]): readonly string[] =>
  laws.flatMap((law) => {
    const named = Option.getOrUndefined(namer.nameOf(refusedOf(law)));
    const expected = Option.getOrUndefined(schemaLawNameOf(law));

    return named === expected
      ? []
      : [`${Formatter.format(law)}: dictionary ${String(named)}, schema ${String(expected)}`];
  });

describe("the law-name dictionary", () => {
  it("is the one the schema generates", () => {
    // Oracle: the generator over the schema's own naming and the ids grizzle's lawIdsOf(Qti)
    // gives the laws. Bound: every law of lawIdsOf(Qti) the dictionary enters.
    assert.deepStrictEqual(
      committed,
      lawNamesOf(),
      "The committed law-name dictionary is stale: run `node src/test/law-names.ts` in packages/pantry, and commit src/vocab/law-names.json.",
    );
  });

  it("names every law of Qti as the schema's own naming does", () => {
    // Oracle: the schema's own naming, `lawsByStatement` over Qti, the second implementation.
    // Bound: every law lawsOf(Qti) states, exhausted.
    assert.deepStrictEqual(disagreements(namerFrom(committed), schemaLawsOf(Qti)), []);
  });

  it("finds a dictionary that misses an entry, names one wrongly, or misses a pattern's, a generated field's or a contract's", () => {
    // Oracle: the comparison above, on planted dictionaries. Live: an entry dropped, an entry's
    // name changed, and the entry of a pattern law, of a generated field's law and of the
    // contract each dropped, each yield a disagreement. Stale: the committed dictionary yields
    // none (the case above).
    const [firstId, firstEntry] = Object.entries(committed.laws)[0] ?? ["", { name: "" }];
    const other = lawNames.find((name) => name !== firstEntry.name) ?? "comment arm";
    const laws = schemaLawsOf(Qti);
    const idOfKind = (kind: Law["kind"]): string =>
      refusedOf(
        Option.getOrThrowWith(
          Arr.findFirst(laws, (law) => law.kind === kind),
          () => new Error(`lawsOf(Qti) states no ${kind} law`),
        ),
      ).id;
    const without = (dropped: string): LawNamesFile => ({
      laws: Object.fromEntries(Object.entries(committed.laws).filter(([id]) => id !== dropped)),
    });

    for (const planted of [
      without(firstId),
      { laws: { ...committed.laws, [firstId]: { name: other } } },
      without(idOfKind("pattern")),
      without(idOfKind("generated")),
      without(idOfKind("contract")),
    ]) {
      assert.isAbove(disagreements(namerFrom(planted), laws).length, 0);
    }
  });
});
