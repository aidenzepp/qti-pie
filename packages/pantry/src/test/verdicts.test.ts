import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { parseVerdicts, renderVerdicts, verdictsPath } from "#pantry/test/verdicts.ts";
import type { VerdictRow } from "#pantry/test/verdicts.ts";

const accepted: VerdictRow = {
  file: "qtiv3-examples/packaging/simple/simple.zip",
  rule: "",
  verdict: "accepted",
};

const refused: VerdictRow = {
  file: "QTI3_BPIG_Examples/BPIG_22April.zip",
  rule: "file-exists",
  verdict: "refused",
};

/**
 * The tag of the error `effect` fails with.
 */
const failureTag = Effect.fn("failureTag")(function* failureTag<A>(
  effect: Effect.Effect<A, { readonly _tag: string }>,
) {
  const error = yield* Effect.flip(effect);

  return error._tag;
});

it.effect("round-trips rows through render and parse", () =>
  Effect.gen(function* roundTrip() {
    const text = yield* renderVerdicts([refused, accepted]);
    const rows = yield* parseVerdicts(text);

    assert.deepStrictEqual(rows, [refused, accepted]);
  }),
);

it.effect("renders a header, LF endings and a final newline", () =>
  Effect.gen(function* layout() {
    const text = yield* renderVerdicts([accepted]);

    assert.strictEqual(
      text,
      "file\tverdict\trule\nqtiv3-examples/packaging/simple/simple.zip\taccepted\t\n",
    );
  }),
);

it.effect("sorts unsorted rows by file in code-unit order", () =>
  Effect.gen(function* sorted() {
    const upper: VerdictRow = { ...accepted, file: "B.zip" };
    const lower: VerdictRow = { ...accepted, file: "a.zip" };
    const rows = yield* parseVerdicts(yield* renderVerdicts([lower, upper]));

    assert.deepStrictEqual(
      rows.map((row) => row.file),
      ["B.zip", "a.zip"],
    );
  }),
);

it.effect("refuses a field holding a tab or a newline", () =>
  Effect.gen(function* fields() {
    for (const file of ["a\tb.zip", "a\nb.zip"]) {
      assert.strictEqual(
        yield* failureTag(renderVerdicts([{ ...accepted, file }])),
        "VerdictsInvalid",
      );
    }
  }),
);

it.effect("refuses a refused row without a rule and an accepted row with one", () =>
  Effect.gen(function* rules() {
    assert.strictEqual(
      yield* failureTag(renderVerdicts([{ ...refused, rule: "" }])),
      "VerdictsInvalid",
    );
    assert.strictEqual(
      yield* failureTag(renderVerdicts([{ ...accepted, rule: "admission" }])),
      "VerdictsInvalid",
    );
  }),
);

it.effect("refuses a malformed line", () =>
  Effect.gen(function* malformed() {
    const header = "file\tverdict\trule\n";

    for (const text of [
      "",
      "file\tverdict\n",
      `${header}a.zip\taccepted\n`,
      `${header}a.zip\tmaybe\t\n`,
      `${header}a.zip\trefused\t\n`,
      `${header}a.zip\taccepted\tadmission\n`,
      `${header}a.zip\trefused\tnot-a-rule\n`,
      `${header}a.zip\taccepted\t`,
    ]) {
      assert.strictEqual(yield* failureTag(parseVerdicts(text)), "VerdictsInvalid");
    }
  }),
);

it("names the verdict file after the tarball", () => {
  assert.isTrue(
    verdictsPath("/home/x/.cache/gr8des/qti-examples-0a92fbb.tar.gz").endsWith(
      "/packages/pantry/verdicts/qti-examples-0a92fbb.tsv",
    ),
  );
  assert.isTrue(
    verdictsPath("/a/qti-examples-0a92fbb.tar.gz").endsWith("verdicts/qti-examples-0a92fbb.tsv"),
  );
});
