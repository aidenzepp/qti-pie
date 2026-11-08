/**
 * A section's visibility is its own `visible`, and nothing else (spec reading 163): the XSD
 * requires the attribute, with no default, and the information model says "The visibility of each
 * section is determined solely by the value of its own visible attribute" (§4.2.6). A section that
 * writes none is neither visible nor invisible, so AL3 alone refuses it, on the import's rows as in
 * the law oracle: it has no `visible` flag, its `Section` row is not loose, and the oracle's scope
 * does not mix its children into its parent's order. Both read an unwritten `visible` as false
 * before, the import breaking "Test overlay"'s copy of `Section.visible` beside AL3.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`).
 *
 * Bound: the every-relation package with its first section, a section nested in it, and the placed
 * section document's root, each not kept together, each writing `visible` true, false, a malformed
 * value or none: one section under a test part, one in a section, one at a document's root, 64
 * packages, exhausted. The nested section holds a backward branch rule and the section ref, and the
 * placed root another, so each one's looseness decides a verdict: the first rule stands where the
 * nested section is loose under its shuffling parent, the second where both are.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, pipe } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, recordsClassOf, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside.
 */
const recorded: readonly Signature[] = known.map(({ signature }) => signature);

/**
 * What a section may write as its `visible`, simplest first, as the box shrinks toward the first.
 */
const writings = ["true", "false", "malformed", "unwritten"] as const;

/**
 * What a section writes as its `visible`.
 */
type Writing = (typeof writings)[number];

/**
 * Each writing's attribute, as its start tag holds it.
 */
const attributeOf = {
  false: ' visible="false"',
  malformed: ' visible="yes"',
  true: ' visible="true"',
  unwritten: "",
} as const satisfies Readonly<Record<Writing, string>>;

/**
 * The three sections the box varies, by where each sits.
 */
const depths = ["under a test part", "in a section", "at a document's root"] as const;

/**
 * Where a varied section sits.
 */
type Depth = (typeof depths)[number];

/**
 * What each varied section writes, by where it sits.
 */
type Visibility = Readonly<Record<Depth, Writing>>;

/**
 * Draw what each varied section writes.
 *
 * @param source - The choices.
 * @returns The writings.
 */
const visibilities: Gen<Visibility> = (source) => ({
  "at a document's root": element(writings)(source),
  "in a section": element(writings)(source),
  "under a test part": element(writings)(source),
});

/**
 * One edit of the base package: the text it replaces in a document, and what it writes there given
 * each varied section's `visible`.
 */
interface Edit {
  readonly path: string;
  readonly text: (attribute: (depth: Depth) => string) => string;
  readonly written: string;
}

/**
 * The every-relation package's edits, in order: the section ref moved out of the second section;
 * the first section, shuffling, not kept together and holding a nested section not kept together,
 * which holds both item refs (whose second rule jumps back to the first) and the section ref; and
 * the placed root, not kept together, given an item ref whose rule jumps back to the root's first.
 */
const edits: readonly Edit[] = [
  {
    path: "test.xml",
    text: () => "",
    written: '      <qti-assessment-section-ref identifier="placement" href="section.xml"/>\n',
  },
  {
    path: "test.xml",
    text: (attribute) =>
      [
        `    <qti-assessment-section identifier="first" title="First" keep-together="false"${attribute("under a test part")}>`,
        '      <qti-ordering shuffle="true"/>',
        `      <qti-assessment-section identifier="inner" title="Inner" keep-together="false"${attribute("in a section")}>`,
        "",
      ].join("\n"),
    written: [
      '    <qti-assessment-section identifier="first" title="First" visible="true">',
      '      <qti-ordering shuffle="true"/>',
      "",
    ].join("\n"),
  },
  {
    path: "test.xml",
    text: () =>
      [
        '      <qti-assessment-section-ref identifier="placement" href="section.xml"/>',
        "      </qti-assessment-section>",
        "    </qti-assessment-section>",
        '    <qti-assessment-section identifier="second" title="Second" visible="true">',
        "",
      ].join("\n"),
    written: [
      "    </qti-assessment-section>",
      '    <qti-assessment-section identifier="second" title="Second" visible="true">',
      "",
    ].join("\n"),
  },
  {
    path: "section.xml",
    text: (attribute) =>
      `<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="placed" title="A placed section" keep-together="false"${attribute("at a document's root")}>`,
    written:
      '<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="placed" title="A placed section" visible="true">',
  },
  {
    path: "section.xml",
    text: () =>
      [
        "  </qti-assessment-item-ref>",
        '  <qti-assessment-item-ref identifier="placedBack" href="items/item2.xml">',
        '    <qti-branch-rule target="placedItem"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule>',
        "  </qti-assessment-item-ref>",
        "</qti-assessment-section>",
      ].join("\n"),
    written: "  </qti-assessment-item-ref>\n</qti-assessment-section>",
  },
];

/**
 * The package every case edits.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * Write a case's package: the base, edited with each varied section's `visible`.
 *
 * @param visibility - What each varied section writes.
 * @returns Its entries.
 */
const packageOf = (visibility: Visibility): PackageEntries => {
  const attribute = (depth: Depth) => attributeOf[visibility[depth]];

  return new Map(
    [...base].map(([path, bytes]) => {
      const held = edits.filter((edit) => edit.path === path);
      if (held.length === 0) {
        return [path, bytes] as const;
      }

      let text = new TextDecoder().decode(bytes);
      for (const edit of held) {
        text = text.replace(edit.written, edit.text(attribute));
      }

      return [path, new TextEncoder().encode(text)] as const;
    }),
  );
};

/**
 * A situation the box must reach: each varied section writing each `visible`.
 */
type Situation = `${Depth}: ${Writing}`;

/**
 * Every situation the box must reach.
 */
const situations = pipe(
  depths,
  Arr.flatMap((depth) =>
    pipe(
      writings,
      Arr.map((writing): Situation => `${depth}: ${writing}`),
    ),
  ),
);

layer(NodeServices.layer, { excludeTestServices: true })("a section's visibility", (it) => {
  it.effect(
    "is its own visible alone, so one that writes none is refused by AL3 alone, on the import's rows as in the law oracle",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* sectionVisibilityRuns() {
          const directory = yield* scratchDirectory("section-visibility-");
          const bench = { directory, grammar, laws };
          let index = 0;
          for (const { path, written } of edits) {
            assert.deepStrictEqual(
              [...base].flatMap(([at, bytes]) =>
                at === path ? [new TextDecoder().decode(bytes).split(written).length - 1] : [],
              ),
              [1],
              `the base's ${path} writes ${written} once`,
            );
          }

          return yield* exhaust(
            {
              box: "the every-relation package with a section under its test part, one nested in it and the placed section document's root, none kept together, each writing visible true, false, malformed or not at all",
              caseHang: Duration.minutes(5),
              coverage: requiredInSpace<Situation>(situations),
              generator: visibilities,
              limit: writings.length ** depths.length,
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle against the laws the import's rows break on the host",
              },
              suite: "pantry/section-visibility",
            },
            (visibility: Visibility, c) =>
              Effect.gen(function* sectionVisibilityCase() {
                for (const depth of depths) {
                  c.note(`${depth}: ${visibility[depth]}`);
                }

                index += 1;
                const judged = yield* judgeOne(
                  yield* genomeOf(packageOf(visibility)),
                  bench,
                  index,
                );

                assert.deepStrictEqual(
                  judged.disagreements
                    .filter((disagreement) => !recordsClassOf(recorded, disagreement))
                    .map(shownDisagreement),
                  [],
                  `${depths.map((depth) => `${depth} ${visibility[depth]}`).join(", ")}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                );
              }),
          );
        }).pipe(Effect.scoped),
      ),
    600_000,
  );
});
