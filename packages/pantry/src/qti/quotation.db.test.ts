/**
 * The quotation law (spec reading 127) on the lease, PostgreSQL itself the judge: `simple` with a
 * `q` in its item, refused under `q-punctuation` where a curly quotation mark stands inside it,
 * and accepted where a curly apostrophe stands beside it. What
 * the lease holds is that PostgreSQL reads the check's non-ASCII marks as the host does; the
 * check's predicate over every mark at every end, the builder's rows and the oracle's verdict are
 * held on the free tier (`quotation.oracle.test.ts`, `src/test/rv-q.oracle.test.ts`).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import type { TextEdit } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

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
        "refuses simple with a curly quotation mark inside a q under q-punctuation, and accepts it with a curly apostrophe beside one",
        () =>
          // Oracle: PostgreSQL, every law of the schema over a whole package, as the oracle predicts
          // it (`src/test/rv-q.oracle.test.ts`): main's `quoted-q` refused `q-punctuation`.
          // Bound: one non-ASCII mark refused and one non-ASCII apostrophe accepted.
          Effect.gen(function* packages() {
            const cases = [
              { dir: withParagraph("inside", `<p>Look at the <q>“text”</q>.</p>`), refused: true },
              {
                dir: withParagraph("apostrophe", `<p>Look at the picture’<q>text</q>.</p>`),
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
