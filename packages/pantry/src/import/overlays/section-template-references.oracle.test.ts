/**
 * A template element's `template-identifier` in a section document or an included fragment names a
 * template variable of each assembly that places its document (spec readings 5 and 117; §2.7.2: "A
 * references must match the identifier in a corresponding template declaration"): a fragment's,
 * one its item declares, and a section document's, one its test declares, which is none, since a
 * test declares no template variable. The import wrote a fragment's template names and never a
 * section document's (`SectionTemplateName` was a fragment's alone), so a section document's
 * template reference, which the law oracle refuses under "Template reference", passed on the
 * import's rows.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), which
 * holds the two to one verdict and one rule: no case shows any disagreement.
 *
 * Bound: a test placing a section document whose item includes a fragment, and the section
 * document including a fragment of its own, with one template inline or template block in the
 * section document, its fragment, the item's fragment or a section document no test places, naming
 * the item's template variable, nothing, or an outcome both the item and the test declare: 4
 * places, 2 elements and 3 names, 24 packages, exhausted. A template block is no element of a test
 * rubric's content, so in a section document both sides refuse it before any row; a template inline
 * there is N6's as well as "Template reference"'s.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Option, pipe } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The namespace of every QTI 3.0 document of the box.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Where a case's template element sits: in the section document the test places, in the fragment
 * that section document includes, in the fragment the item includes, or in a section document no
 * test places, whose references resolve nowhere.
 */
const places = [
  "section document",
  "section fragment",
  "item fragment",
  "unplaced section",
] as const;

/**
 * An element of {@link places}.
 */
type Place = (typeof places)[number];

/**
 * The template elements a case writes.
 */
const elements = ["qti-template-inline", "qti-template-block"] as const;

/**
 * An element of {@link elements}.
 */
type Element = (typeof elements)[number];

/**
 * What a case's `template-identifier` does: name the item's template variable, name nothing, or
 * misname, naming an outcome the item and the test both declare, which no template element may
 * name.
 */
const namings = ["names", "names nothing", "misnames"] as const;

/**
 * An element of {@link namings}.
 */
type Naming = (typeof namings)[number];

/**
 * The value each of {@link namings} writes: the item's template variable `T`, `NOPE`, which nothing
 * declares, or the outcome `OUT`.
 */
const names: Readonly<Record<Naming, string>> = {
  misnames: "OUT",
  names: "T",
  "names nothing": "NOPE",
};

/**
 * One case of the box.
 */
interface TemplateCase {
  readonly element: Element;
  readonly naming: Naming;
  readonly place: Place;
}

/**
 * Every case of the box: each place, element and name.
 */
const cases: readonly TemplateCase[] = places.flatMap((place) =>
  elements.flatMap((element) => namings.map((naming) => ({ element, naming, place }))),
);

/**
 * Write a case as text.
 *
 * @param input - The case.
 * @returns Its text.
 */
const literalOf = ({ element, naming, place }: TemplateCase): string =>
  `${element} template-identifier="${names[naming]}" in the ${place}`;

/**
 * The manifest of every case: the test, the section document it places, the item, each fragment,
 * and the section document no test places.
 */
const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="T" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/><dependency identifierref="S"/></resource><resource identifier="S" type="imsqti_section_xmlv3p0" href="section.xml"><file href="section.xml"/><dependency identifierref="I"/><dependency identifierref="SF"/></resource><resource identifier="SF" type="imsqti_fragment_xmlv3p0" href="section-fragment.xml"><file href="section-fragment.xml"/></resource><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/><dependency identifierref="IF"/></resource><resource identifier="IF" type="imsqti_fragment_xmlv3p0" href="item-fragment.xml"><file href="item-fragment.xml"/></resource><resource identifier="U" type="imsqti_section_xmlv3p0" href="unplaced.xml"><file href="unplaced.xml"/><dependency identifierref="I"/></resource></resources></manifest>`;

/**
 * Write the content a case puts at one place: its template element there, plain text elsewhere.
 *
 * @param input - The case.
 * @param place - The place.
 * @returns The content.
 */
const contentAt = (input: TemplateCase, place: Place): string => {
  if (input.place !== place) {
    return "<p>Plain.</p>";
  }

  const named = `template-identifier="${names[input.naming]}" identifier="x" show-hide="show"`;

  return input.element === "qti-template-inline"
    ? `<p><qti-template-inline ${named}>x</qti-template-inline></p>`
    : `<qti-template-block ${named}><qti-content-body><p>x</p></qti-content-body></qti-template-block>`;
};

/**
 * Write a section document: a rubric holding its content and an item ref to the item.
 *
 * @param identifier - The section's identifier.
 * @param content - The rubric's content.
 * @returns Its text.
 */
const sectionOf = (identifier: string, content: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-section xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="${identifier}" title="S" visible="true"><qti-rubric-block use="instructions" view="candidate"><qti-content-body>${content}</qti-content-body></qti-rubric-block><qti-assessment-item-ref identifier="${identifier}-item" href="item.xml"/></qti-assessment-section>`;

/**
 * Write a fragment: a division holding its content.
 *
 * @param content - The content.
 * @returns Its text.
 */
const fragmentOf = (content: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns="${asi}">${content}</div>`;

/**
 * Write a case's package.
 *
 * @param input - The case.
 * @returns Its entries.
 */
const packageOf = (input: TemplateCase): PackageEntries => {
  const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="i" title="I" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="OUT" cardinality="single" base-type="integer"/><qti-template-declaration identifier="T" cardinality="single" base-type="integer"/><qti-item-body><xi:include href="item-fragment.xml"/></qti-item-body></qti-assessment-item>`;
  const test = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="${asi}" identifier="t" title="T"><qti-outcome-declaration identifier="OUT" cardinality="single" base-type="integer"/><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="o" title="O" visible="true"><qti-assessment-section-ref identifier="placed" href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;
  const section = sectionOf(
    "s",
    `${contentAt(input, "section document")}<xi:include href="section-fragment.xml"/>`,
  );
  const text = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", text.encode(manifest)],
    ["item.xml", text.encode(item)],
    ["item-fragment.xml", text.encode(fragmentOf(contentAt(input, "item fragment")))],
    ["section.xml", text.encode(section)],
    ["section-fragment.xml", text.encode(fragmentOf(contentAt(input, "section fragment")))],
    ["test.xml", text.encode(test)],
    ["unplaced.xml", text.encode(sectionOf("u", contentAt(input, "unplaced section")))],
  ]);
};

/**
 * A situation the box must reach: each place under each name.
 */
type Situation = `${Place}, ${Naming}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "a section document's or a fragment's template-identifier",
  (it) => {
    it.effect(
      "names a template variable of each assembly that places its document, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* sectionTemplateReferencesRuns() {
            const directory = yield* scratchDirectory("section-template-references-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "a template inline or block in a placed section document, its fragment, an item's fragment or an unplaced section document, naming the item's template variable, nothing, or an outcome",
                caseHang: Duration.minutes(5),
                coverage: requiredInSpace<Situation>(
                  pipe(
                    places,
                    Arr.flatMap((place) =>
                      pipe(
                        namings,
                        Arr.map((naming): Situation => `${place}, ${naming}`),
                      ),
                    ),
                  ),
                ),
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) =>
                  Option.match(Option.fromUndefinedOr(cases[at]), {
                    onNone: () => String(at),
                    onSome: literalOf,
                  }),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/section-template-references",
              },
              (at, c) =>
                Effect.gen(function* sectionTemplateReferencesCase() {
                  const input = cases[at];
                  assert.isDefined(input, `no case ${String(at)}`);
                  c.note(`${input.place}, ${input.naming}`);

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(input)), bench, at);

                  assert.deepStrictEqual(
                    judged.disagreements.map(shownDisagreement),
                    [],
                    `${literalOf(input)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
      600_000,
    );
  },
);
