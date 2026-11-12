/**
 * The law oracle's judgment of an item whose attribute holds a value of 64,000,000 characters, the
 * size the ZIP reader's entry bound (`entryBytes` of `#pantry/package/zip.ts`, 64 MiB) admits. The
 * oracle reads each typed attribute inside its value domain through `oracleValueOf` of
 * `#pantry/test/resolution.ts` (`typedReadingOf` of `#pantry/test/oracle.ts`), so a read that
 * builds an array of a character each ends the worker in the default heap before
 * `documentBreaches` returns a verdict.
 *
 * Bound: one item that breaks no law, with its `class` attribute's lexical form replaced by one
 * letter repeated 64,000,000 times. It is named for the oracle, as `src/grammar/purity.test.ts`
 * requires of a test that imports it; `resolution.test.ts` holds `oracleValueOf` alone.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { documentBreaches, lawsOf, typedReadingOf } from "#pantry/test/oracle.ts";
import { asiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The length, in characters, of the large value: the ZIP reader admits an entry of 64 MiB, and a
 * value this long is one the oracle must judge.
 */
const largeLength = 64_000_000;

/**
 * The timeout, in milliseconds, of the test that judges an item with an attribute of {@link
 * largeLength} characters, which reads the value beside the document's other laws: a hang guard.
 */
const judgeTimeoutMs = 30_000;

/**
 * The composed grammar the item is read and folded under.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The law oracle's tables over the grammar.
 */
const laws = lawsOf(grammar);

/**
 * An item that breaks no law, with one `class` attribute on its paragraph.
 */
const item = `<qti-assessment-item xmlns="${asiNamespace}" identifier="i" title="t" time-dependent="false" adaptive="false"><qti-item-body><p class="x">x</p></qti-item-body></qti-assessment-item>`;

describe("documentBreaches over an item whose class attribute holds 64,000,000 characters", () => {
  it.effect(
    "judges the item, and reads the attribute's value in full",
    () =>
      Effect.gen(function* judgesLargeClass() {
        const read = yield* Effect.orDie(readXml(new TextEncoder().encode(item)));
        const tree = yield* Effect.orDie(shred(read, "3.0.1", shredGrammarOf(grammar)));
        const rows = Result.getOrThrow(fold(tree, foldGrammarOf(grammar)));
        assert.deepStrictEqual(
          documentBreaches("doc.xml", rows, laws).map(({ law }) => law),
          [],
          "the item as written breaks no law",
        );

        const lexical = "x".repeat(largeLength);
        const edited = {
          ...rows,
          attributes: rows.attributes.map((attribute) =>
            attribute.name === "class" ? { ...attribute, lexical } : attribute,
          ),
        };
        const held = edited.attributes.find(({ name }) => name === "class");
        assert.isDefined(held);

        const typed = typedReadingOf(laws)(held);
        assert.isTrue(Option.isSome(typed) && typed.value.length === largeLength);
        assert.isArray(documentBreaches("doc.xml", edited, laws));
      }),
    judgeTimeoutMs,
  );
});
