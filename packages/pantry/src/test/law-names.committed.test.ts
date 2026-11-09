/**
 * The committed law-name dictionary (`#pantry/vocab/law-names.json`), held to the schema and the
 * committed snapshot: the file is the one `#pantry/test/law-names.ts` generates, and the importer's
 * namer over it (`#pantry/import/refusal.ts` `namerFrom`) names every law grizzle's `lawsOf(Qti)`
 * states, and every check's installed name, exactly as the schema's own naming does
 * (`#pantry/test/law-namer.ts`), so naming a refusal needs no schema.
 */
import { readFileSync } from "node:fs";
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option, Schema } from "effect";
import { committedLaws, lawNames, LawNamesFileSchema, namerFrom } from "#pantry/import/refusal.ts";
import type { LawNamer } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/own.ts";
import { installedNameOf, schemaLawNameOf, schemaLawsOf } from "#pantry/test/law-namer.ts";
import { lawNamesOf, lawNamesPath } from "#pantry/test/law-names.ts";

/**
 * The timeout, in milliseconds, of the tests that compile `Qti`'s law model: a hang guard, never a
 * budget. Measured 2026-11-08: a compile of the law model took 51 s at a load average of 60 to 76
 * (`#pantry/import/refusal.ts`'s record of `lawsByStatement`), so this is about twice that and
 * more.
 */
const lawModelTimeoutMs = 300_000;

/**
 * The committed dictionary, decoded.
 */
const committed = Schema.decodeUnknownSync(Schema.fromJsonString(LawNamesFileSchema))(
  readFileSync(lawNamesPath, "utf-8"),
);

/**
 * List every law a namer names otherwise than the schema's own naming does, each with both names,
 * and every check whose installed name it reads otherwise.
 *
 * @param namer - The namer under test.
 * @param laws - The laws to name.
 * @returns Each disagreement as a line of text, empty when they agree on every law.
 */
const disagreements = (namer: LawNamer, laws: readonly Law[]): readonly string[] =>
  laws.flatMap((law) => {
    const named = Option.getOrUndefined(namer.nameOf(law));
    const expected = Option.getOrUndefined(schemaLawNameOf(law));
    const installed =
      law.kind === "check"
        ? [
            Option.getOrUndefined(namer.installedOf(law)),
            Option.getOrUndefined(installedNameOf(Qti, law)),
          ]
        : [];

    return [
      ...(named === expected
        ? []
        : [
            `${law.kind} ${Formatter.format(law)}: dictionary ${String(named)}, schema ${String(expected)}`,
          ]),
      ...(installed[0] === installed[1]
        ? []
        : [
            `${Formatter.format(law)}: installed ${String(installed[0])}, schema ${String(installed[1])}`,
          ]),
    ];
  });

describe("the law-name dictionary", () => {
  it(
    "is the one the schema and the committed snapshot generate",
    () => {
      // Oracle: the generator over the schema's own naming and the snapshot's LawIds. Bound: every
      // law of lawsOf(Qti) the dictionary enters.
      assert.deepStrictEqual(
        committed,
        lawNamesOf(),
        "The committed law-name dictionary is stale: run `node src/test/law-names.ts` in packages/pantry, with GR8DES_QTI_INSTALL unset, and commit src/vocab/law-names.json.",
      );
    },
    lawModelTimeoutMs,
  );

  it(
    "names every law of Qti, and every check's installed name, as the schema's own naming does",
    () => {
      // Oracle: the schema's own naming, `lawsByStatement` and `constraintNamesOf` over Qti, the
      // second implementation. Bound: every law lawsOf(Qti) states, exhausted.
      assert.deepStrictEqual(
        disagreements(namerFrom(committed, committedLaws), schemaLawsOf(Qti)),
        [],
      );
    },
    lawModelTimeoutMs,
  );

  it(
    "finds a dictionary that misses an entry, names one wrongly, or misses a pattern",
    () => {
      // Oracle: the comparison above, on planted dictionaries. Live: an entry dropped, an entry's
      // name changed and a pattern dropped each yield a disagreement. Stale: the committed
      // dictionary yields none (the case above).
      const [firstId, firstEntry] = Object.entries(committed.laws).find(
        ([, { name }]) => name !== undefined,
      ) ?? ["", {}];
      const [firstPattern] = Object.keys(committed.patterns);
      const dropped = Object.fromEntries(
        Object.entries(committed.laws).filter(([id]) => id !== firstId),
      );
      const other = lawNames.find((name) => name !== firstEntry.name) ?? "comment arm";
      const renamed = { ...committed.laws, [firstId]: { ...firstEntry, name: other } };
      const unpatterned = Object.fromEntries(
        Object.entries(committed.patterns).filter(([key]) => key !== firstPattern),
      );
      const laws = schemaLawsOf(Qti);

      for (const planted of [
        { laws: dropped, patterns: committed.patterns },
        { laws: renamed, patterns: committed.patterns },
        { laws: committed.laws, patterns: unpatterned },
      ]) {
        assert.isAbove(disagreements(namerFrom(planted, committedLaws), laws).length, 0);
      }
    },
    lawModelTimeoutMs,
  );
});
