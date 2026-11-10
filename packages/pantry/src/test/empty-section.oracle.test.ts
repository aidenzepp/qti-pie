/**
 * An assessment section that holds no part is valid (spec reading 26): the information model gives
 * a section's `sectionPart` the multiplicity [0..unbounded] (§4.2.15), and both XSDs' parts choice
 * is minOccurs="0". The "at least one other Section or Item" of §2.8 stands in §2, which both
 * versions mark "This Section is NOT NORMATIVE", so it states no requirement.
 *
 * Oracle: the XSD's section model and §4.2.15, as the case model records which children each
 * section holds, so no expected verdict or row is computed by the oracle's or the builder's own
 * reading. The database's side is `tests.db.test.ts`'s and `program.oracle.db.test.ts`'s.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { boolean, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { NodeMember } from "#pantry/import/write.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 2.4 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 240_000;

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every test and item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * A test rubric block, which a section may hold before its parts and which is no part.
 */
const rubric =
  '<qti-rubric-block view="candidate" use="instructions"><qti-content-body><p>Read</p></qti-content-body></qti-rubric-block>';

/**
 * What a case's inner section holds, if the outer section holds one: nothing, a rubric block
 * alone, or an item ref.
 */
type Inner = "absent" | "empty" | "rubric" | "item";

/**
 * One case: whether the outer section holds a rubric block and an item ref, what its inner
 * section holds, and the schema version the manifest names.
 */
interface SectionCase {
  readonly inner: Inner;
  readonly item: boolean;
  readonly rubric: boolean;
  readonly version: "3.0.0" | "3.0.1";
}

/**
 * Every choice of the box.
 */
const sectionCases: Gen<SectionCase> = (source) => ({
  inner: source.draw(element(["absent", "empty", "rubric", "item"] as const)),
  item: source.draw(boolean),
  rubric: source.draw(boolean),
  version: source.draw(element(["3.0.0", "3.0.1"] as const)),
});

/**
 * An item ref of the case's one item, by an identifier of its own.
 *
 * @param identifier - The ref's identifier.
 * @returns The ref.
 */
const itemRef = (identifier: string): string =>
  `<qti-assessment-item-ref identifier="${identifier}" href="item.xml"/>`;

/**
 * Write a test and item package for a case, each file's text encoded as UTF-8, as `readEntries`
 * returns one: the outer section `S`, in XSD order its rubric block, its item ref and its inner
 * section `S2`, in the one test part.
 *
 * @param drawn - The case.
 * @returns The entries, sorted by path.
 */
const packageOf = (drawn: SectionCase): readonly PackageFile[] => {
  const inner = {
    absent: "",
    empty: '<qti-assessment-section identifier="S2" title="Inner" visible="true"/>',
    item: `<qti-assessment-section identifier="S2" title="Inner" visible="true">${itemRef("R2")}</qti-assessment-section>`,
    rubric: `<qti-assessment-section identifier="S2" title="Inner" visible="true">${rubric}</qti-assessment-section>`,
  }[drawn.inner];
  const files = {
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${drawn.version}</schemaversion></metadata><organizations/><resources><resource identifier="T" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body><p>Hi</p></qti-item-body></qti-assessment-item>`,
    "test.xml": `<qti-assessment-test xmlns="${asi}" identifier="test" title="Test"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="Outer" visible="true">${drawn.rubric ? rubric : ""}${drawn.item ? itemRef("R1") : ""}${inner}</qti-assessment-section></qti-test-part></qti-assessment-test>`,
  };

  return Object.entries(files)
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));
};

/**
 * Each section's count of parts, by its identifier, as the case wrote them: the outer section's
 * item ref and inner section, and the inner section's item ref.
 *
 * @param drawn - The case.
 * @returns The counts, by section identifier, sorted.
 */
const partsOf = (drawn: SectionCase): readonly string[] =>
  [
    `S ${String((drawn.item ? 1 : 0) + (drawn.inner === "absent" ? 0 : 1))}`,
    ...(drawn.inner === "absent" ? [] : [`S2 ${String(drawn.inner === "item" ? 1 : 0)}`]),
  ].toSorted();

/**
 * Read every node of a nested tree, the root and its descendants.
 *
 * @param node - The tree's root.
 * @returns The nodes, in document order.
 */
const nodesOf = (node: NodeMember): readonly NodeMember[] => [
  node,
  ...node.children.flatMap(nodesOf),
];

/**
 * Build a case's import program through the reader, the codec and the overlay builders, its files
 * written to a scratch folder, and count each `Section` row's `SectionMember` rows.
 *
 * @param drawn - The case.
 * @returns `<identifier> <count>` for each section, sorted.
 */
const sectionRows = (drawn: SectionCase) =>
  Effect.scoped(
    Effect.gen(function* rowsOfCase() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* scratchDirectory("empty-section-");
      for (const { bytes, path } of packageOf(drawn)) {
        yield* fs.writeFile(`${dir}/${path}`, bytes);
      }

      const program = yield* readProgram(dir);
      const identifiers = new Map(
        [...program.inputs.Node.values()]
          .flatMap(nodesOf)
          .flatMap((node) =>
            node.attributes
              .filter((attribute) => attribute.name === "identifier")
              .map((attribute) => [node.id, attribute.lexical] as const),
          ),
      );
      const members = [...program.inputs.SectionMember.values()];

      return [...program.inputs.Section.values()]
        .map(
          ({ node }) =>
            `${identifiers.get(node) ?? node} ${String(members.filter(({ section }) => section === node).length)}`,
        )
        .toSorted();
    }),
  );

/**
 * A situation the box must reach: each way a section may hold no part.
 */
type SectionSituation =
  | "an outer section of nothing"
  | "an outer section of a rubric block alone"
  | "an empty section inside an empty section"
  | "a section of a rubric block alone inside a section of parts";

/**
 * The notes of a case, by what its sections hold.
 *
 * @param drawn - The case.
 * @returns The situations it reaches.
 */
const notesOf = (drawn: SectionCase): readonly SectionSituation[] => {
  const notes: SectionSituation[] = [];
  if (!drawn.item && drawn.inner === "absent") {
    notes.push(
      drawn.rubric ? "an outer section of a rubric block alone" : "an outer section of nothing",
    );
  }

  if (!drawn.item && drawn.inner === "empty") {
    notes.push("an empty section inside an empty section");
  }

  if (drawn.inner === "rubric") {
    notes.push("a section of a rubric block alone inside a section of parts");
  }

  return notes;
};

/**
 * Every situation the box must reach.
 */
const situations = [
  "an outer section of nothing",
  "an outer section of a rubric block alone",
  "an empty section inside an empty section",
  "a section of a rubric block alone inside a section of parts",
] as const satisfies readonly SectionSituation[];

describe("test/oracle.ts and import/overlays/tests.ts, a section that holds no part (spec reading 26)", () => {
  it.effect(
    "the oracle breaks no law of a test whose sections hold any number of parts, none included",
    (ctx) =>
      // Oracle: §4.2.15's [0..unbounded] and the XSD's section model, in whose order every case
      // writes its children.
      // Bound: every outer section of a rubric block or none, an item ref or none, and an inner
      // section absent, empty, of a rubric block or of an item ref, in each version, 32.
      searched(
        ctx,
        exhaust(
          {
            box: "every outer section of a rubric block or none, an item ref or none, and an inner section absent, empty, of a rubric block or of an item ref, in 3.0.0 or 3.0.1",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<SectionSituation>(situations),
            generator: sectionCases,
            limit: 40,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the information model's §4.2.15, sectionPart [0..unbounded], and the XSDs' minOccurs=0",
            },
            suite: "test/oracle-empty-section",
          },
          (drawn: SectionCase, c) =>
            Effect.gen(function* boxCase() {
              for (const note of notesOf(drawn)) {
                c.note(note);
              }

              const judgment = yield* judge(packageOf(drawn), grammar, laws);

              assert.deepStrictEqual(
                judgment._tag === "Judged"
                  ? judgment.breaches.map(({ law }) => law)
                  : [`codec ${judgment.rule}`],
                [],
                JSON.stringify(drawn),
              );
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "the import writes a Section row for each section and a SectionMember row for each part, none for a section that holds none",
    (ctx) =>
      // Oracle: the parts each case wrote, as `partsOf` counts them.
      // Bound: the same 32 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "every outer section of a rubric block or none, an item ref or none, and an inner section absent, empty, of a rubric block or of an item ref, in 3.0.0 or 3.0.1",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<SectionSituation>(situations),
            generator: sectionCases,
            limit: 40,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the parts each case writes, §4.2.15's sectionPart",
            },
            suite: "import/empty-section-rows",
          },
          (drawn: SectionCase, c) =>
            Effect.gen(function* rowsCase() {
              for (const note of notesOf(drawn)) {
                c.note(note);
              }

              assert.deepStrictEqual(
                yield* sectionRows(drawn),
                partsOf(drawn),
                JSON.stringify(drawn),
              );
            }).pipe(Effect.provide(NodeServices.layer)),
        ),
      ),
    testTimeoutMs,
  );
});
