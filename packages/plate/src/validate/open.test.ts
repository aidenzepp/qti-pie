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

/**
 * How many entries a large flat document repeats: past the roughly 120,000 arguments V8 takes in
 * one call, so a spread of them into a call's arguments overflows the stack.
 */
const large = 200_000;

/**
 * A large flat document takes this long at most, in milliseconds; each opens in about 2 s here.
 */
const largeTimeout = 60_000;

/**
 * Write an item document as bytes, as a host reads one from storage.
 *
 * @param head The declarations before the body.
 * @param body The content of `qti-item-body`.
 * @returns The document's UTF-8 bytes.
 */
const itemBytes = (head: string, body: string): Uint8Array =>
  new TextEncoder().encode(
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false">${head}<qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
  );

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

  describe("a large flat document", () => {
    it.effect(
      "a body of 200,000 hr elements is accepted",
      () =>
        Effect.gen(function* manyChildren() {
          const verdict = yield* open("large.xml", itemBytes("", "<hr/>".repeat(large)));

          assert.strictEqual(verdict.verdict, "accepted");
        }),
      largeTimeout,
    );

    it.effect(
      "a declaration with 200,000 undeclared attributes is refused, one unknown-attribute each",
      () =>
        Effect.gen(function* manyAttributes() {
          const attributes = Array.from({ length: large }, (_, index) => ` a${index}="x"`).join("");
          const head = `<qti-outcome-declaration identifier="O" cardinality="single" base-type="float"${attributes}/>`;
          const verdict = yield* open("large.xml", itemBytes(head, "<p>x</p>"));
          const refusals = refusalsOf(verdict);
          const paths = new Set(
            refusals.map((refusal) =>
              refusal.location.kind === "path" ? refusal.location.path : "",
            ),
          );

          assert.strictEqual(verdict.verdict, "refused");
          assert.lengthOf(refusals, large);
          assert.isTrue(refusals.every((refusal) => refusal.rule === "unknown-attribute"));
          assert.strictEqual(paths.size, large);
        }),
      largeTimeout,
    );

    it.effect(
      "a video holding 200,000 sources with javascript URLs is accepted with unsupported features",
      () =>
        Effect.gen(function* manySources() {
          const sources = '<source src="javascript:x"/>'.repeat(large);
          const body = `<video controls="controls">${sources}</video>`;
          const verdict = yield* open("large.xml", itemBytes("", body));

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
        }),
      largeTimeout,
    );
  });
});
