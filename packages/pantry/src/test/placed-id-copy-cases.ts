/**
 * A placed ID's copy, as packages (lane NIL's audit, C1; NS4): the every-relation package with its
 * section document's rubric carrying an ID or not, the test placing that section document once or
 * twice, and the test's own first section carrying the same ID or not.
 *
 * `src/test/placed-id-copy.oracle.test.ts` holds the oracle and the importer's rows to each case,
 * and `src/import/placed-id-copy.db.test.ts` the database.
 */
import { assert } from "@effect/vitest";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { textOf, withText } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation package the cases edit.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * The section document's and the test's paths in the every-relation package.
 */
const paths = { section: "section.xml", test: "test.xml" } as const;

/**
 * One case: whether the section document's rubric carries the ID, whether the test places it twice,
 * and whether the test's own first section carries the same ID.
 */
export interface CopyCase {
  readonly collides: boolean;
  readonly sectionId: boolean;
  readonly twice: boolean;
}

/**
 * Every case, the small scope exhausted.
 */
export const cases: readonly CopyCase[] = [false, true].flatMap((sectionId) =>
  [false, true].flatMap((twice) =>
    [false, true].map((collides) => ({ collides, sectionId, twice })),
  ),
);

/**
 * Show a case.
 *
 * @param drawnCase - The case.
 * @returns Its three choices.
 */
export const shown = (drawnCase: CopyCase): string =>
  `section id ${String(drawnCase.sectionId)}, placed twice ${String(drawnCase.twice)}, test id ${String(drawnCase.collides)}`;

/**
 * The ID the cases write.
 */
const id = "sec-note";

/**
 * Write a case's package.
 *
 * @param drawnCase - The case.
 * @returns The package's entries.
 */
export const packageOf = (drawnCase: CopyCase): PackageEntries => {
  const section = textOf(base, paths.section);
  const test = textOf(base, paths.test);
  const sectionRef = `<qti-assessment-section-ref identifier="placement" href="${paths.section}"/>`;
  const rubric = `<qti-rubric-block use="instructions" view="candidate"><qti-content-body><div id="${id}">Read on.</div></qti-content-body></qti-rubric-block>`;
  // A section's rubric blocks follow its qti-ordering, so the rubric goes after it.
  const firstSection = `<qti-assessment-section identifier="first" title="First" visible="true">\n      <qti-ordering shuffle="true"/>`;
  assert.include(section, "<div><qti-printed-variable", "the section document's rubric");
  assert.include(test, sectionRef, "the test's section ref");
  assert.include(test, firstSection, "the test's first section");

  const placedSection = drawnCase.sectionId
    ? section.replace("<div><qti-printed-variable", `<div id="${id}"><qti-printed-variable`)
    : section;
  const twice = drawnCase.twice
    ? test.replace(
        sectionRef,
        `${sectionRef}<qti-assessment-section-ref identifier="again" href="${paths.section}"/>`,
      )
    : test;
  const placingTest = drawnCase.collides
    ? twice.replace(firstSection, `${firstSection}${rubric}`)
    : twice;

  return withText(withText(base, paths.section, placedSection), paths.test, placingTest);
};

/**
 * Whether a case's merged test holds one ID twice: the test's own rubric carries the ID the section
 * document places, which cvc-id clause 2 refuses over the merged document ("DocumentId key",
 * `AssembledId`'s key on `(assembly, id)`). Every other case is lawful: a section document placed
 * twice holds its IDs once (reading 86).
 *
 * The law oracle states DocumentId key over each assembly (`#pantry/test/oracle.ts`
 * `assembliesOf`, §2.12, readings 86 and 117), so it refuses this case under document-key as the
 * schema does, and every case is held to the oracle alike.
 *
 * @param drawnCase - The case.
 * @returns Whether it does.
 */
export const holdsTwice = (drawnCase: CopyCase): boolean =>
  drawnCase.collides && drawnCase.sectionId;
