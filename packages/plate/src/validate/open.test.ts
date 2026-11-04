import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { open } from "#plate/validate/open.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * Open a file of the example corpus under its corpus-relative location, as a host opens a document
 * it read from storage.
 *
 * @param location The file's path under the corpus root, which the verdict carries as its document.
 * @returns The verdict on the file.
 */
const openCorpusFile = (location: string) =>
  readCorpusFile(location).pipe(Effect.flatMap((bytes) => open(location, bytes)));

/**
 * Read the refusals of a verdict, none when it is not `refused`.
 *
 * @param verdict The verdict.
 * @returns Its refusals in order.
 */
const refusalsOf = (verdict: Verdict): readonly Refusal[] =>
  verdict.verdict === "refused" ? verdict.refusals : [];

describe("validate/open.ts", () => {
  it.effect(
    "fractions_deps_2.xml is refused, fallback-configuration among its refusals with the suggestion secondary-configuration",
    () =>
      Effect.gen(function* fractions() {
        const location = "qtiv3-examples/packaging/pci/src/fractions_deps_2.xml";
        const verdict = yield* openCorpusFile(location);
        const path =
          "qti-assessment-item/qti-item-body/div/qti-portable-custom-interaction[1]/qti-interaction-modules/@fallback-configuration";
        const matching = refusalsOf(verdict).filter(
          (refusal) =>
            refusal.rule === "unknown-attribute" &&
            refusal.location.kind === "path" &&
            refusal.location.path === path,
        );

        assert.strictEqual(verdict.verdict, "refused");
        assert.strictEqual(verdict.document, location);
        assert.lengthOf(matching, 1);
        assert.deepStrictEqual(matching[0]?.suggestion, Option.some("secondary-configuration"));
        assert.strictEqual(matching[0]?.document, location);
      }),
  );

  it.effect("CAT/test.xml is refused with the reader's refusal as its only one", () =>
    Effect.gen(function* cat() {
      const location = "qtiv3-examples/CAT/test.xml";
      const verdict = yield* openCorpusFile(location);

      assert.strictEqual(verdict.verdict, "refused");
      assert.strictEqual(verdict.document, location);
      assert.deepStrictEqual(
        refusalsOf(verdict).map((refusal) => refusal.rule),
        ["reader-refused"],
      );
    }),
  );

  it.effect("BG007 is accepted, the positive control", () =>
    Effect.gen(function* bg007() {
      const location = "QTI3_BPIG_Examples/items/BG007.xml";
      const verdict = yield* openCorpusFile(location);

      assert.strictEqual(verdict.verdict, "accepted");
      assert.strictEqual(verdict.document, location);
    }),
  );
});
