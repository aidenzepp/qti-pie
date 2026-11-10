/**
 * The quotation law (spec reading 127) on the lease, PostgreSQL itself the judge (testing doctrine,
 * rule 3), written to run at the integration slice's database tier, never by a hand.
 *
 * Two kinds of case:
 *
 * - **Stray rows** of `Quotation` no stored node names, through the author role (`db.apply`), each
 *   true to `E1_derived` but for the one the case breaks: a row CHECK is judged as the row is
 *   inserted, and every foreign key into `Node` is deferred, so it never speaks first. The outcome
 *   is `invariant-rejected` with the expected law among its `laws` (membership, C22). A row whose
 *   ends hold no quotation mark is refused at commit by its deferred foreign keys alone, never by
 *   the check.
 * - **Whole packages** through the importer: `simple` with a `q` in its item, refused under
 *   `q-punctuation` where a quotation mark stands beside or inside it, main's `quoted-q` among
 *   them, and accepted where an apostrophe or nothing does.
 */
import { Db } from "@bjornpagen/grizzle";
import type { Fact, Law, RefusedLaw } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";

import type { Quotation } from "#pantry/qti/quotation.ts";
import { quotationMarks } from "#pantry/qti/quotation.ts";
import { materialize, materializeSpec } from "#pantry/test/fixtures.ts";
import type { TextEdit } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";
import { AuthorLogin } from "#pantry/db/served.ts";
import { importFacts } from "#pantry/test/import-facts.ts";

/**
 * A uuid no stored row holds: the document, parent and nearest interaction every stray row names.
 */
const stray = "00000000-0000-4000-8000-0000000012f0";

/**
 * The node of one stray row, distinct for each row of a case.
 *
 * @param at - The row's number, 0 to 99.
 * @returns Its uuid.
 */
const strayNode = (at: number): `${string}-${string}-${string}-${string}-${string}` =>
  `00000000-0000-4000-8000-0000000012${String(at).padStart(2, "0")}`;

/**
 * Whether an outcome is `invariant-rejected` with a law among its `laws` that the predicate picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - Picks the expected law.
 * @returns Whether it holds one.
 */
const rejectedBy = (
  outcome: { readonly kind: string; readonly refused?: { readonly laws: readonly RefusedLaw[] } },
  picks: (law: Law) => boolean,
): boolean =>
  outcome.kind === "invariant-rejected" &&
  (outcome.refused?.laws ?? []).some(({ law }) => picks(law));

/**
 * Pick the check of one relation by its name.
 *
 * @param name - The check's name.
 * @returns The predicate.
 */
const quotationCheck =
  (name: string) =>
  (law: Law): boolean =>
    law.kind === "check" && law.relation === "Quotation" && law.name === name;

/**
 * A stray `q`'s row, true to `E1_derived`: the second of three siblings, with two children, every
 * end a letter, so each end's member exists and no end is a quotation mark.
 *
 * @param at - The row's number.
 * @param fields - The fields the case sets.
 * @returns The row.
 */
const strayRow = (
  at: number,
  fields: Partial<Fact<typeof Quotation>> = {},
): Fact<typeof Quotation> => ({
  after: "a",
  at: 1n,
  before: "b",
  children: 2n,
  document: stray,
  first: "c",
  firstAt: 0n,
  kind: "q",
  last: "d",
  nearest: stray,
  nextAt: 2n,
  node: strayNode(at),
  parent: stray,
  parentAt: 0n,
  siblings: 3n,
  start: BigInt(10 + at),
  version: "3.0.1",
  ...fields,
});

/**
 * The four ends a quotation mark may stand at, each with the fields that put a character there.
 */
const ends = [
  ["after", (character: string) => ({ after: character })],
  ["before", (character: string) => ({ before: character })],
  ["first", (character: string) => ({ first: character })],
  ["last", (character: string) => ({ last: character })],
] as const;

/**
 * `simple`'s item with one edit of its first paragraph, materialized once under its own name.
 *
 * A fixture edit holds a file's bytes, each as the latin1 character of its value
 * (`#pantry/test/fixtures.ts`, `TextEdit`), and `choice.xml` is UTF-8. So the paragraph is spelled
 * as its UTF-8 bytes, so a curly quotation mark lands in the file as the character itself, as an
 * author writes it.
 *
 * @param name - The fixture's name.
 * @param paragraph - The paragraph that replaces it, as text.
 * @returns The package's directory.
 */
const withParagraph = (name: string, paragraph: string) => {
  const edit: TextEdit = {
    _tag: "ReplaceText",
    file: "choice.xml",
    replacement: Buffer.from(paragraph, "utf-8").toString("latin1"),
    search: "<p>Look at the text in the picture.</p>",
  };

  return materializeSpec({
    edits: [edit],
    member: "qtiv3-examples/packaging/simple/simple.zip",
    name: `rv-q-${name}`,
  });
};

describe.skipIf(!hasLease)(
  "qti/quotation.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the quotation law, judged by PostgreSQL", (it) => {
      it.effect(
        "refuses a quotation mark at each of a q's four ends by Quotation_punctuation, and an apostrophe by none",
        () =>
          // Oracle: PostgreSQL, the row CHECK Quotation_punctuation (reading 127, §5.111), each row
          // true to E1_derived, so the check is the one CHECK it breaks.
          // Bound: every quotation mark at every end, one row each, and the right single quote
          // and the apostrophe at every end.
          Effect.gen(function* marks() {
            const db = yield* Db.open((yield* AuthorLogin).roles.author, {});
            for (const [end, at] of ends) {
              for (const mark of quotationMarks) {
                const outcome = yield* db.workload.importWrite.apply(
                  importFacts({ Quotation: [strayRow(0, at(mark))] }),
                  {},
                );

                assert.isTrue(
                  rejectedBy(outcome, quotationCheck("Quotation_punctuation")),
                  `${mark} at ${end}`,
                );
              }

              for (const apostrophe of ["’", "'"]) {
                const outcome = yield* db.workload.importWrite.apply(
                  importFacts({ Quotation: [strayRow(0, at(apostrophe))] }),
                  {},
                );

                assert.isFalse(
                  rejectedBy(outcome, quotationCheck("Quotation_punctuation")),
                  `${apostrophe} at ${end}`,
                );
              }
            }
          }),
      );

      it.effect(
        "refuses a row whose slot after the q is not one past it, whose first child's slot is not 0, or whose missing neighbour holds an end, by E1_derived",
        () =>
          // Oracle: PostgreSQL, the row CHECK E1_derived over Quotation: nextAt = at + 1,
          // firstAt = 0, and the end of a neighbour that does not exist is empty.
          // Bound: each derived field once, wrong.
          Effect.gen(function* derived() {
            const db = yield* Db.open((yield* AuthorLogin).roles.author, {});
            for (const fields of [
              { nextAt: 3n },
              { firstAt: 1n },
              { at: 0n, nextAt: 1n },
              { at: 2n, nextAt: 3n, siblings: 3n },
              { children: 0n },
            ] as const) {
              const outcome = yield* db.workload.importWrite.apply(
                importFacts({ Quotation: [strayRow(1, fields)] }),
                {},
              );

              assert.isTrue(
                rejectedBy(outcome, quotationCheck("E1_derived")),
                Formatter.format(fields),
              );
            }
          }),
      );

      it.effect(
        "refuses simple with a quotation mark beside or inside a q under q-punctuation, quoted-q among them, and accepts it with an apostrophe or nothing there",
        () =>
          // Oracle: PostgreSQL, every law of the schema over a whole package, as the oracle predicts
          // it (`src/test/rv-q.oracle.test.ts`): main's `quoted-q` refused `q-punctuation`.
          // Bound: quoted-q, a mark at each end, and two lawful q's.
          Effect.gen(function* packages() {
            const cases = [
              { dir: materialize("quoted-q"), refused: true },
              {
                dir: withParagraph("after", `<p>Look at the <q>text</q>” here.</p>`),
                refused: true,
              },
              { dir: withParagraph("inside", `<p>Look at the <q>“text”</q>.</p>`), refused: true },
              {
                dir: withParagraph("apostrophe", `<p>Look at the picture’<q>text</q>.</p>`),
                refused: false,
              },
              {
                dir: withParagraph("plain", `<p>Look at the <q>text</q> here.</p>`),
                refused: false,
              },
            ];
            for (const { dir, refused } of cases) {
              const outcome = yield* Effect.result(importDir(yield* dir));

              assert.isTrue(
                refused
                  ? outcome._tag === "Failure" &&
                      outcome.failure instanceof ImportRefused &&
                      outcome.failure.rules.includes("q-punctuation")
                  : outcome._tag === "Success",
                outcome._tag === "Failure" ? outcome.failure.message : "accepted",
              );
            }
          }),
        leaseTestTimeoutMs,
      );
    });
  },
);
