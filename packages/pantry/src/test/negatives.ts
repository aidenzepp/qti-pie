/**
 * What the law oracle predicts for each of phase 5's 60 test-layer negatives ({@link
 * negativeNames}), pinned in one table: the free oracle test (`negatives.oracle.test.ts`) holds the
 * oracle to it, and the leased import of the negatives (`import/tests.negatives.db.test.ts`) reads
 * the rule to expect where the oracle finds one.
 *
 * The table also records `main`'s rule for each negative
 * (`main:packages/pantry/src/import/tests.db.test.ts:190-325`, at `2b276d76`), the name the
 * database-era suite expected, which several laws have since renamed or retired.
 */
import type { negativeNames } from "#pantry/test/fixtures.ts";

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
 * finding. `section-ref-to-item`, whose `main` rule `section-ref-target` no longer exists, was one
 * until #46 (25d16460) stated "Document entry" for a section ref whose href names no section
 * document: its section ref names an item.
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
    oracle: ["ancestry-ban", "template-ref"],
  },
  "include-text": { main: ["include-parse"], oracle: ["attribute-lexical"] },
  "include-xpointer": { main: ["include-xpointer"], oracle: ["attribute-admission"] },
  "instance-spelling-canonical": { main: ["value-lexical"], oracle: "accepted" },
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
  "rubric-printed-undeclared": { main: ["binding-declared"], oracle: ["printed-variable-ref"] },
  "section-adaptive-and-selection": { main: ["ordering"], oracle: ["ordering"] },
  "section-feedback-undeclared": { main: ["binding-declared"], oracle: ["feedback-ref"] },
  "section-identifier-unknown": {
    main: ["section-identifier-target", "reach-copy"],
    oracle: ["section-identifier-target"],
  },
  "section-prefixed-unresolved": { main: ["prefixed-ref"], oracle: ["prefixed-ref"] },
  "section-printed-undeclared": {
    main: ["binding-declared"],
    oracle: ["P8", "prefixed-ref", "printed-variable-ref"],
  },
  "section-ref-cycle": { main: ["section-ref-cycle"], oracle: ["inclusion-cycle"] },
  "section-ref-identifier-clash": { main: ["structure-identifier"], oracle: ["test-name-key"] },
  "section-ref-to-item": { main: ["section-ref-target"], oracle: ["entry-kind"] },
  "section-two-isc": { main: ["structure-count"], oracle: ["ordering"] },
  "section-unprefixed-undeclared": {
    main: ["P8", "binding-declared"],
    oracle: ["P8", "prefixed-ref", "printed-variable-ref"],
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
