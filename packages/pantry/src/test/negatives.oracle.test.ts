/**
 * What the law oracle predicts for each of phase 5's 62 test-layer negatives ({@link
 * negativeNames}), pinned, so the leased import of them (`import/tests.negatives.db.test.ts`) has a
 * rule to expect where the oracle finds one.
 *
 * Each negative is materialized and read as `importAgreesWithOracle` reads a package
 * (`#pantry/test/locate.ts` `oracleVerdict`), and its verdict is held to {@link expectations}: the
 * rules the oracle's breaches name, or accepted. The oracle judges every breach of a package, so
 * the import, which refuses a package under the rule of the first object that fails, may name any
 * of the set. The positives these negatives are built over are accepted ({@link positives}), so a
 * set holds only the negative's own breaches. The table also records `main`'s rule for each
 * negative (`main:packages/pantry/src/import/tests.db.test.ts:190-325`, at `2b276d76`), the name
 * the database-era suite expected, which several laws have since renamed or retired.
 *
 * Four negatives are "(direct)" only: their spec is the positive's own, and the leased suite alters
 * the positive's rows by hand because the importer cannot write their breach. Their representation
 * law is superseded (audit A part 5), so the oracle's verdict on each is its positive's, pinned
 * beside it.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as plain, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { readPackage } from "#pantry/package/read.ts";
import { materialize, negativeNames } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { oracleVerdict } from "#pantry/test/locate.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * What the oracle predicts for one negative, and what `main` expected of it.
 *
 * `oracle` is `"accepted"` when the oracle finds no breach, and otherwise the set of rules its
 * breaches name, sorted. `main` is the rules `main`'s leased suite expected the import to refuse it
 * under.
 */
export interface NegativeExpectation {
  readonly main: readonly string[];
  readonly oracle: "accepted" | readonly string[];
}

/**
 * The oracle's prediction for each of {@link negativeNames}, keyed by name, for the leased import
 * of them to read. A negative whose `oracle` is `"accepted"` and that is not "(direct)" is a
 * finding: `item-duration-not-timed`, whose breach the oracle once hid under the noise of a
 * refused positive, and `section-ref-to-item`, whose `main` rule
 * `section-ref-target` no longer exists.
 */
export const expectations: Readonly<Record<(typeof negativeNames)[number], NegativeExpectation>> = {
  "branch-backward": { main: ["branch-forward"], oracle: ["branch-forward"] },
  "branch-exit-misspelled": { main: ["branch-target"], oracle: ["branch-target"] },
  "branch-into-ref": { main: ["branch-target"], oracle: ["branch-target"] },
  "branch-part-to-item": { main: ["branch-target"], oracle: ["branch-target"] },
  "branch-replacement-target": { main: ["branch-forward"], oracle: ["branch-target"] },
  "branch-unknown-target": { main: ["branch-target"], oracle: ["branch-target"] },
  "duration-of-item-ref": { main: ["prefixed-ref"], oracle: "accepted" },
  "feedback-outcome-float": { main: ["feedback-ref"], oracle: ["feedback-ref"] },
  "feedback-template": {
    main: ["ancestry-ban", "binding-declared"],
    oracle: ["P8", "ancestry-ban", "prefixed-ref"],
  },
  "include-text": { main: ["include-parse"], oracle: ["attribute-lexical"] },
  "include-xpointer": { main: ["include-xpointer"], oracle: ["attribute-admission"] },
  "instance-spelling-canonical": { main: ["value-lexical"], oracle: "accepted" },
  "item-duration-in-item": { main: ["item-duration"], oracle: ["item-duration"] },
  "item-duration-not-timed": { main: ["item-duration"], oracle: "accepted" },
  "item-in-section": { main: ["admission"], oracle: ["unmodeled-vocabulary"] },
  "item-prefixed": { main: ["prefixed-root"], oracle: "accepted" },
  "item-ref-missing": { main: ["item-ref-target"], oracle: ["file-exists", "item-ref-target"] },
  "item-ref-to-stimulus": { main: ["item-ref-target"], oracle: ["item-ref-target"] },
  "mapping-target-twice": {
    main: ["variable-mapping-target"],
    oracle: ["variable-mapping-target"],
  },
  "mapping-undeclared": { main: ["variable-mapping-source"], oracle: ["variable-mapping-source"] },
  "navigation-misspelled": {
    main: ["attribute-lexical", "value-lexical"],
    oracle: ["attribute-lexical"],
  },
  "part-no-section": { main: ["structure-count"], oracle: ["child-set"] },
  "part-order": { main: ["ordering"], oracle: ["ordering"] },
  "precondition-number-correct": { main: ["P25"], oracle: ["P25"] },
  "prefixed-ambiguous": { main: ["prefixed-ref"], oracle: ["prefixed-ref"] },
  "prefixed-undeclared-variable": { main: ["prefixed-ref"], oracle: ["prefixed-ref"] },
  "prefixed-unknown-ref": { main: ["prefixed-ref"], oracle: ["prefixed-ref"] },
  "rubric-empty-view": { main: ["attribute-lexical"], oracle: ["attribute-lexical"] },
  "rubric-in-rubric": {
    main: ["ancestry-ban", "unmodeled-vocabulary"],
    oracle: ["unmodeled-vocabulary"],
  },
  "rubric-interaction": { main: ["ancestry-ban"], oracle: ["ancestry-ban", "idref-target"] },
  "rubric-no-body": { main: ["structure-count"], oracle: ["child-set"] },
  "rubric-printed-undeclared": { main: ["binding-declared"], oracle: ["P8", "prefixed-ref"] },
  "section-adaptive-and-selection": { main: ["ordering"], oracle: ["ordering"] },
  "section-feedback-undeclared": { main: ["binding-declared"], oracle: ["P8", "prefixed-ref"] },
  "section-identifier-unknown": {
    main: ["section-identifier-target", "reach-copy"],
    oracle: ["section-identifier-target"],
  },
  "section-prefixed-unresolved": { main: ["prefixed-ref"], oracle: ["prefixed-ref"] },
  "section-printed-undeclared": { main: ["binding-declared"], oracle: ["P8", "prefixed-ref"] },
  "section-ref-cycle": { main: ["section-ref-cycle"], oracle: ["inclusion-cycle"] },
  "section-ref-identifier-clash": { main: ["structure-identifier"], oracle: ["test-name-key"] },
  "section-ref-to-item": { main: ["section-ref-target"], oracle: "accepted" },
  "section-two-isc": { main: ["structure-count"], oracle: ["ordering"] },
  "section-unprefixed-undeclared": {
    main: ["P8", "binding-declared"],
    oracle: ["P8", "prefixed-ref"],
  },
  "section-variable-in-test": { main: ["section-variable-ref"], oracle: "accepted" },
  "select-not-integer": {
    main: ["attribute-lexical", "value-lexical"],
    oracle: ["attribute-lexical"],
  },
  "select-over": { main: ["selection-bounds"], oracle: ["selection-bounds"] },
  "select-under-required": { main: ["selection-required"], oracle: ["selection-required"] },
  "stimulus-300-attributes": {
    main: ["admission", "attribute-admission"],
    oracle: ["attribute-admission"],
  },
  "stimulus-300-include": { main: ["admission"], oracle: ["admission"] },
  "stimulus-body-empty": { main: ["body-empty"], oracle: ["child-set"] },
  "stimulus-missing-image": {
    main: ["file-exists", "document-reference"],
    oracle: ["file-exists"],
  },
  "stimulus-ref-duplicate": { main: ["stimulus-ref-key"], oracle: ["stimulus-ref-key"] },
  "stimulus-ref-to-item": { main: ["stimulus-ref-target"], oracle: ["stimulus-ref-target"] },
  "stimulus-typed-test": { main: ["resource-root"], oracle: ["root-type-reverse"] },
  "template-default-type": { main: ["P20"], oracle: ["P20"] },
  "template-default-undeclared": {
    main: ["template-default-target"],
    oracle: ["template-default-target"],
  },
  "test-declares-duration": { main: ["declaration-reserved"], oracle: ["declaration-reserved"] },
  "test-duplicate-identifier": {
    main: ["structure-identifier"],
    oracle: ["structure-identifier", "test-name-key"],
  },
  "test-identifier-mismatch": { main: ["lom-identifier"], oracle: ["lom-identifier"] },
  "test-lang-no-lom": { main: ["document-lang"], oracle: ["document-lang"] },
  "test-no-part": { main: ["structure-count"], oracle: ["child-set"] },
  "test-title-mismatch": { main: ["lom-title"], oracle: ["lom-title"] },
  "test-undeclared-variable": { main: ["P8"], oracle: ["P8", "prefixed-ref"] },
};

/**
 * The four "(direct)" negatives, each with the positive its spec is, whose verdict theirs must
 * equal: "superseded representation law (audit A part 5)".
 */
const direct = [
  ["duration-of-item-ref", "test-mapping"],
  ["instance-spelling-canonical", "test-mapping"],
  ["item-prefixed", "test-mapping"],
  ["section-variable-in-test", "test-section-ref"],
] as const satisfies readonly (readonly [(typeof negativeNames)[number], FixtureName])[];

/**
 * The five test-layer positives the oracle once refused, because they broke readings 88, 90, 93,
 * 97, 110 and 115, which landed after them (research 08d145d1). Each is fixed and stays a
 * positive, and the oracle accepts it.
 */
const positives = [
  "test-content",
  "test-include",
  "test-lti",
  "test-mapping",
  "stimulus-301",
] as const satisfies readonly FixtureName[];

/**
 * Materialize a fixture in a root of its own and judge it by the oracle.
 *
 * @param name - The fixture's name.
 * @returns `"accepted"`, or the sorted rules the oracle's breaches name.
 */
const verdictOf = Effect.fn("negatives.oracle.verdictOf")(function* verdictOf(name: FixtureName) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const root = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "negatives-oracle-",
  });
  const config = ConfigProvider.layerAdd(
    ConfigProvider.fromUnknown({ GR8DES_QTI_FIXTURES: root }),
    { asPrimary: true },
  );
  const dir = yield* materialize(name).pipe(Effect.provide(config));
  const verdict = yield* oracleVerdict(yield* readPackage(dir));

  return verdict.kind === "accepted" ? "accepted" : [...verdict.rules].toSorted();
});

describe("test/negatives.oracle.test.ts", () => {
  plain("states each of the 62 negatives once", () => {
    assert.strictEqual(negativeNames.length, 62);
    assert.deepStrictEqual(Object.keys(expectations).toSorted(), [...negativeNames].toSorted());
  });
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the law oracle's prediction for each test-layer negative",
  (it) => {
    for (const name of negativeNames) {
      it.effect(`predicts ${name}`, () =>
        Effect.gen(function* predictsNegative() {
          const { oracle } = expectations[name];

          assert.deepStrictEqual(
            yield* verdictOf(name),
            oracle === "accepted" ? oracle : [...oracle],
            name,
          );
        }).pipe(Effect.scoped),
      );
    }

    for (const name of positives) {
      it.effect(`accepts the positive ${name}`, () =>
        Effect.gen(function* acceptsPositive() {
          assert.strictEqual(yield* verdictOf(name), "accepted", name);
        }).pipe(Effect.scoped),
      );
    }

    for (const [name, base] of direct) {
      it.effect(`judges the "(direct)" ${name} as its positive ${base}`, () =>
        Effect.gen(function* judgesDirect() {
          assert.deepStrictEqual(yield* verdictOf(name), yield* verdictOf(base), name);
        }).pipe(Effect.scoped),
      );
    }
  },
);
