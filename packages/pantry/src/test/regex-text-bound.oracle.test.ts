/**
 * The law oracle's "Regex text bound" (`#pantry/test/oracle.ts`, reading 178) at the bound: an
 * attribute's lexical form of exactly `regexTextBytes` UTF-8 bytes raises nothing, one byte more
 * raises the law once, and the measure is bytes, not characters.
 *
 * No mutation of `src/test/complete.oracle.test.ts` breaks the law alone, since a package carrying
 * an attribute of 256 MiB through the oracle's parse does not fit a test's memory. So one lawful
 * item is folded from its text, its paragraph's `data-` attribute row (named by its open class,
 * `data-*`) is given each long value in place, and the oracle judges the rows at
 * `regexTextBreaches`, the law's own seam inside `documentBreaches`: the oracle's other attribute
 * laws test a lexical form against its value domain with a JavaScript regular expression, whose
 * backtracking stack overflows on a value this long (a `RangeError` at 268,435,455 characters,
 * none at 16,000,000). Each long value is built once.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { regexTextBytes } from "#pantry/qti/limits.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { lawsOf, regexTextBreaches } from "#pantry/test/oracle.ts";

/**
 * The oracle's law tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * A lawful item whose paragraph carries a `data-note`, the attribute each case lengthens.
 */
const item = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p data-note="n">Hello.</p></qti-item-body></qti-assessment-item>`;

/**
 * Fold the item.
 *
 * @returns Its rows.
 */
const foldedItem = Effect.fnUntraced(function* foldedItem() {
  const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(item)));
  const tree = yield* Effect.orDie(shred(xml, "3.0.0", shredGrammarOf(grammar)));

  return yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));
});

/**
 * Judge the rows with the paragraph's `data-note` set to a value under "Regex text bound" alone.
 *
 * @param rows - The folded rows.
 * @param note - The note's lexical form.
 * @returns Each breach's keys, as the oracle writes them, and its law.
 */
const regexBreaches = (
  rows: FoldedRows<Composed>,
  note: string,
): readonly Readonly<Record<string, string>>[] =>
  regexTextBreaches(
    "item.xml",
    {
      ...rows,
      attributes: rows.attributes.map((attribute) =>
        attribute.name === "data-*" ? { ...attribute, lexical: note } : attribute,
      ),
    },
    laws,
  ).map(({ keys, law }) => ({ ...keys, law }));

describe("the law oracle's Regex text bound", () => {
  it.effect("raises the law one byte past the bound, never at it, counting UTF-8 bytes", () =>
    // Oracle: the specification as a checker, reading 178's bound in UTF-8 bytes (PostgreSQL's
    // `RE_execute` widens one `pg_wchar` per byte), with RFC 3629's three bytes for U+20AC.
    // Bound: the bound itself and one byte past it, once in one-byte characters and once with a
    // three-byte character, so a measure in characters would miss the last case.
    Effect.gen(function* atTheBound() {
      const rows = yield* foldedItem();
      assert.deepStrictEqual(regexBreaches(rows, "n"), [], "the folded item breaks no bound");

      assert.deepStrictEqual(regexBreaches(rows, "x".repeat(regexTextBytes)), [], "at the bound");

      const past = regexBreaches(rows, "x".repeat(regexTextBytes + 1));
      assert.deepStrictEqual(
        past.map(({ bound, bytes, field, law, name }) => ({ bound, bytes, field, law, name })),
        [
          {
            bound: String(regexTextBytes),
            bytes: String(regexTextBytes + 1),
            field: "Attribute.lexical",
            law: "Regex text bound",
            name: "data-*",
          },
        ],
        "one byte past it, in one-byte characters",
      );

      const wide = `${"x".repeat(regexTextBytes - 2)}\u{20AC}`;
      assert.strictEqual(wide.length, regexTextBytes - 1, "fewer characters than the bound");
      assert.deepStrictEqual(
        regexBreaches(rows, wide).map(({ bytes }) => bytes),
        [String(regexTextBytes + 1)],
        "one byte past it, through a three-byte character",
      );
    }),
  );
});
