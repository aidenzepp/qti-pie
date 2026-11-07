/**
 * The mutations of the law oracle's laws over the tests and sections
 * (`#pantry/test/oracle-laws/tests.ts`), each drawn to break exactly its law in an accepted package
 * (`src/test/complete.oracle.test.ts`).
 *
 * Each edits the every-relation package's test (`test.xml`: one part, the sections `first` and
 * `second`, the item refs `ref1` to `ref3`, a branch rule `ref1 → ref2`, a variable mapping and a
 * template default under `ref1`, the section ref `placement` placing `section.xml`, and outcome
 * processing that reads `ref1.SCORE` and the section `first`), its section document (`section.xml`:
 * the section `placed` and its item ref `placedItem`) or an item. A mutation never renames an
 * element another reference names, since the reference would break a law of its own first.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import {
  duplicateDrawn,
  editText,
  replaceDrawn,
  replaceOnce,
  textOf,
  withText,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Base, Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation test.
 */
const test = "test.xml";

/**
 * The every-relation section document.
 */
const section = "section.xml";

/**
 * The every-relation manifest.
 */
const manifest = "imsmanifest.xml";

/**
 * A branch rule whose condition always holds, naming a target.
 *
 * @param target - The target.
 * @returns The rule's text.
 */
const ruleTo = (target: string): string =>
  `<qti-branch-rule target="${target}"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule>`;

/**
 * An item ref of the second item, which every document at the package's root names by the same
 * href.
 *
 * @param identifier - Its identifier.
 * @param attributes - Further attributes, written after the href.
 * @returns The item ref's text.
 */
const itemRefOf = (identifier: string, attributes = ""): string =>
  `<qti-assessment-item-ref identifier="${identifier}" href="items/item2.xml"${attributes}/>`;

/**
 * Draw one of a list of edits and apply it to the base.
 *
 * @param edits - The edits, each a drawn edit of the base's entries.
 * @returns The mutation's edit.
 */
const oneOf =
  (edits: readonly ((entries: PackageEntries) => Gen<PackageEntries>)[]) =>
  ({ entries }: Base): Gen<PackageEntries> =>
  (source) => {
    const edit = edits[source.draw(int(0, edits.length - 1))];
    if (edit === undefined) {
      throw new Error("no edit to draw");
    }

    return source.draw(edit(entries));
  };

/**
 * Lift an edit of a package's entries to a mutation's edit of its base.
 *
 * @param edit - The drawn edit of the entries.
 * @returns The mutation's edit.
 */
const onBase =
  (edit: (entries: PackageEntries) => Gen<PackageEntries>) =>
  ({ entries }: Base): Gen<PackageEntries> =>
    edit(entries);

/**
 * Edit one entry of a package by a fixed edit of its text.
 *
 * @param path - The entry's path.
 * @param edit - The edit.
 * @returns The drawn edit of the package, which draws nothing.
 */
const fixed =
  (path: string, edit: (text: string) => string) =>
  (entries: PackageEntries): Gen<PackageEntries> =>
  () =>
    editText(entries, path, edit);

/**
 * Edit one entry of a package by a drawn edit of its text.
 *
 * @param path - The entry's path.
 * @param edit - The drawn edit.
 * @returns The drawn edit of the package.
 */
const drawnIn =
  (path: string, edit: (text: string) => Gen<string>) =>
  (entries: PackageEntries): Gen<PackageEntries> =>
  (source) =>
    withText(entries, path, source.draw(edit(textOf(entries, path))));

/**
 * The names `test.xml` writes, none of which another reference names but by the rule `ref1 → ref2`
 * and the reads of `ref1.SCORE` and the section `first`.
 */
const testNames = ["part1", "first", "ref1", "ref2", "second", "ref3", "placement"] as const;

/**
 * The names `section.xml` writes.
 */
const sectionNames = ["placed", "placedItem"] as const;

/**
 * Insert an item ref as the last part of a drawn section of a document.
 *
 * @param text - The document.
 * @param ref - The item ref's text.
 * @returns A generator of the edited text.
 */
const inDrawnSection = (text: string, ref: string): Gen<string> =>
  replaceDrawn(text, /<\/qti-assessment-section>/u, (match) => `${ref}${match[0]}`);

/**
 * Each law's mutation, by law.
 */
export const testMutations = {
  // Branch forward (reading 87): a rule that names its own owner, its owner's section, a test part
  // that names itself (R87's p1[s1(i1)] p1=>p1), or a section naming an earlier one, which no
  // shuffle orders.
  "Branch forward": {
    mutate: oneOf([
      fixed(test, (text) => replaceOnce(text, 'target="ref2"', 'target="ref1"')),
      fixed(test, (text) => replaceOnce(text, 'target="ref2"', 'target="first"')),
      fixed(test, (text) =>
        replaceOnce(
          text,
          'submission-mode="individual">',
          `submission-mode="individual">${ruleTo("part1")}`,
        ),
      ),
      fixed(test, (text) =>
        replaceOnce(
          text,
          '<qti-assessment-section identifier="second" title="Second" visible="true">',
          `<qti-assessment-section identifier="second" title="Second" visible="true">${ruleTo("first")}`,
        ),
      ),
    ]),
    over: "package",
  },
  // Branch target (reading 87, §5.23, §5.98): a target that names nothing; a test part from an
  // item ref; a section from a test part; an item ref a section document places, which nothing
  // outside it may target; or an item ref a selection with replacement can repeat.
  "Branch target": {
    mutate: oneOf([
      fixed(test, (text) => replaceOnce(text, 'target="ref2"', 'target="nowhere"')),
      fixed(test, (text) => replaceOnce(text, 'target="ref2"', 'target="part1"')),
      fixed(test, (text) => replaceOnce(text, 'target="ref2"', 'target="placedItem"')),
      fixed(test, (text) =>
        replaceOnce(
          text,
          'submission-mode="individual">',
          `submission-mode="individual">${ruleTo("first")}`,
        ),
      ),
      fixed(test, (text) =>
        replaceOnce(
          replaceOnce(text, 'target="ref2"', 'target="ref3"'),
          '<qti-selection select="1"/>',
          '<qti-selection select="1" with-replacement="true"/>',
        ),
      ),
    ]),
    over: "package",
  },
  // Item ref target (B2, B3): an item ref whose href names the stimulus, the section document,
  // the usage data, a fragment, or a file no resource's href names; or an item resource's href
  // whose file the package does not hold, which names no item document (§5.6.5). ref1 is spared:
  // its mapping, template default and `ref1.SCORE` read its item, and would break their laws first.
  "Item ref target": {
    mutate: oneOf([
      ...(
        [
          { identifier: "ref2", path: test },
          { identifier: "ref3", path: test },
          { identifier: "placedItem", path: section },
        ] as const
      ).map(({ identifier, path }) =>
        drawnIn(path, (text) => (source) => {
          const href = source.draw(
            element([
              "items/stimulus.xml",
              "section.xml",
              "usage.xml",
              "items/fragment.xml",
              "items/media/pic.png",
            ]),
          );

          return replaceOnce(
            text,
            `identifier="${identifier}" href="items/item2.xml"`,
            `identifier="${identifier}" href="${href}"`,
          );
        }),
      ),
      (entries: PackageEntries): Gen<PackageEntries> =>
        (source) => {
          const identifier = source.draw(element(["ref2", "ref3"] as const));
          const listed = editText(entries, manifest, (text) =>
            replaceOnce(
              text,
              "  <resources>",
              '  <resources>\n    <resource identifier="ghost-res" type="imsqti_item_xmlv3p0" href="items/ghost.xml"><file href="items/ghost.xml"/></resource>',
            ),
          );

          return editText(listed, test, (text) =>
            replaceOnce(
              text,
              `identifier="${identifier}" href="items/item2.xml"`,
              `identifier="${identifier}" href="items/ghost.xml"`,
            ),
          );
        },
    ]),
    over: "package",
  },
  // Prefixed reference (M3, readings 48 and 88): `ref1.SCORE` read as a variable its item does not
  // declare, through a scope the test does not hold, or numbered without a selection with
  // replacement, so no reading resolves; or `placedItem.SCORE` once the test places the section
  // document twice, so its one reading reads a name two placements give.
  "Prefixed reference": {
    mutate: oneOf([
      drawnIn(
        test,
        (text) => (source) =>
          replaceOnce(
            text,
            'identifier="ref1.SCORE"',
            `identifier="${source.draw(element(["ref1.NOPE", "ref9.SCORE", "ref1.1.SCORE", "first.SCORE"]))}"`,
          ),
      ),
      fixed(test, (text) =>
        replaceOnce(
          replaceOnce(text, 'identifier="ref1.SCORE"', 'identifier="placedItem.SCORE"'),
          '<qti-assessment-section-ref identifier="placement" href="section.xml"/>',
          '<qti-assessment-section-ref identifier="placement" href="section.xml"/><qti-assessment-section-ref identifier="again" href="section.xml"/>',
        ),
      ),
    ]),
    over: "package",
  },
  // Section identifier target (A61): a section-identifier naming nothing, an item ref or a test
  // part, or the section document's section once the test places it twice.
  "Section identifier target": {
    mutate: oneOf([
      drawnIn(
        test,
        (text) => (source) =>
          replaceOnce(
            text,
            'section-identifier="first"',
            `section-identifier="${source.draw(element(["nowhere", "ref2", "part1", "placement2"]))}"`,
          ),
      ),
      fixed(test, (text) =>
        replaceOnce(
          replaceOnce(text, 'section-identifier="first"', 'section-identifier="placed"'),
          '<qti-assessment-section-ref identifier="placement" href="section.xml"/>',
          '<qti-assessment-section-ref identifier="placement" href="section.xml"/><qti-assessment-section-ref identifier="again" href="section.xml"/>',
        ),
      ),
    ]),
    over: "package",
  },
  // Selection required (§4.2.2): the section `second`, which selects one part, given two or three
  // required item refs.
  "Selection required": {
    mutate: onBase(
      drawnIn(test, (text) => (source) => {
        const required = source.draw(int(2, 3));
        const refs = Array.from({ length: required }, (_, at) =>
          itemRefOf(`needed${String(at + 1)}`, ' required="true"'),
        ).join("");

        return replaceOnce(
          text,
          '<qti-assessment-section-ref identifier="placement" href="section.xml"/>',
          `<qti-assessment-section-ref identifier="placement" href="section.xml"/>${refs}`,
        );
      }),
    ),
    over: "package",
  },
  // Stimulus ref key (§7.6.2): a second stimulus ref of the item's identifier, beside the first.
  "Stimulus ref key": {
    mutate: ({ entries }) =>
      drawnIn("items/item.xml", (text) =>
        duplicateDrawn(text, /<qti-assessment-stimulus-ref identifier="[^"]+" href="[^"]+"\/>/u),
      )(entries),
    over: "package",
  },
  // Structure identifier (reading 86): a new item ref of a document given a name the document
  // already writes, as the last part of a drawn section of it.
  "Structure identifier": {
    mutate: oneOf([
      drawnIn(
        test,
        (text) => (source) =>
          source.draw(inDrawnSection(text, itemRefOf(source.draw(element([...testNames]))))),
      ),
      drawnIn(
        section,
        (text) => (source) =>
          source.draw(inDrawnSection(text, itemRefOf(source.draw(element([...sectionNames]))))),
      ),
    ]),
    over: "package",
  },
  // Template default target (A37): ref1's template default naming an integer variable its item
  // declares as no template, or a name its item does not declare, so its expression's type, an
  // integer, still fits.
  "Template default target": {
    mutate: onBase(
      drawnIn(
        test,
        (text) => (source) =>
          replaceOnce(
            text,
            'template-identifier="N"',
            `template-identifier="${source.draw(element(["COUNT", "DIGITS", "LEVER", "CTX", "ABSENT"]))}"`,
          ),
      ),
    ),
    over: "package",
  },
  // Test name key (reading 86): a new item ref in one document of the assembly given a name the
  // other writes, so the two documents' names are each a key and the assembly's are not.
  "Test name key": {
    mutate: oneOf([
      drawnIn(
        section,
        (text) => (source) =>
          source.draw(inDrawnSection(text, itemRefOf(source.draw(element([...testNames]))))),
      ),
      drawnIn(
        test,
        (text) => (source) =>
          source.draw(inDrawnSection(text, itemRefOf(source.draw(element([...sectionNames]))))),
      ),
    ]),
    over: "package",
  },
  // Variable mapping source (A34): ref1's mapping reading a name its item declares as no outcome,
  // a built-in, or nothing.
  "Variable mapping source": {
    mutate: onBase(
      drawnIn(
        test,
        (text) => (source) =>
          replaceOnce(
            text,
            'source-identifier="SCORE"',
            `source-identifier="${source.draw(element(["RESPONSE", "N", "SHOWN", "CTX", "duration", "ABSENT"]))}"`,
          ),
      ),
    ),
    over: "package",
  },
  // Variable mapping target (reading 97): a second mapping of ref1 to its target; a target that
  // is a built-in session variable; or one that is another variable its item declares.
  "Variable mapping target": {
    mutate: oneOf([
      fixed(test, (text) =>
        replaceOnce(
          text,
          '<qti-variable-mapping source-identifier="SCORE" target-identifier="ITEMSCORE"/>',
          '<qti-variable-mapping source-identifier="SCORE" target-identifier="ITEMSCORE"/><qti-variable-mapping source-identifier="COUNT" target-identifier="ITEMSCORE"/>',
        ),
      ),
      drawnIn(
        test,
        (text) => (source) =>
          replaceOnce(
            text,
            'target-identifier="ITEMSCORE"',
            `target-identifier="${source.draw(element(["completionStatus", "numAttempts", "duration", "COUNT", "RESPONSE", "N"]))}"`,
          ),
      ),
    ]),
    over: "package",
  },
} as const satisfies Readonly<Record<string, Mutation>>;
