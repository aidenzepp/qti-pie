/**
 * N8's choice clause, held both ways: every choice that writes its identifier lies in an
 * interaction, its nearest. The schema states it as `Choice` into `ChoiceInteraction`
 * (`src/qti/interactions.ts`, "N8 nearest"), which the import writes only where the choice's
 * nearest is an interaction, and the law oracle as its second "N8 nearest" law over node rows, from
 * the information model's parents of each choice class and §5.55's gap, which "must only appear
 * within a 'gapMatchInteraction'" (spec reading 38).
 *
 * Before, the oracle stated only N8's copy of the nearest interaction, so a gap outside every
 * gap-match broke N8 in the import's rows and N6 alone in the oracle, a disagreement the genetic
 * differential kept as known (`#pantry/test/gen/genetic/known.ts`, its fixed entry "N8 nearest").
 *
 * Every case is one item holding one choice of a choice class, with its identifier or without,
 * placed in its own interaction, in a paragraph of an interaction not its own (a hottext
 * interaction, whose choices are hottexts), or in a paragraph of the body, in no interaction. The
 * genetic differential's judge (`#pantry/test/gen/genetic/judge.ts` `judgeOne`) holds the law
 * oracle against the laws the import's rows hold on the host, and the case says what each side
 * names:
 *
 * - The codec refuses every choice but the gap outside its own interaction, on both sides: the
 *   content model admits it only there, so it is no QTI element anywhere else;
 * - N8 breaks exactly where the choice writes its identifier and lies in no interaction, on both
 *   sides: a gap in the body, which the XSD admits in any phrasing container (reading 38).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * One choice class: its element, written with its identifier attribute or none, its own
 * interaction holding it, with the response declaration the interaction binds, and whether the
 * content model admits it outside its own interactions.
 */
interface ChoiceClass {
  readonly anywhere: boolean;
  readonly choice: (identifier: string) => string;
  readonly declaration: string;
  readonly own: (choice: string) => string;
}

/**
 * The response declaration a single identifier response writes.
 */
const single = `<qti-response-declaration identifier="R" cardinality="single" base-type="identifier"/>`;

/**
 * The response declaration a gap match binds.
 */
const directed = `<qti-response-declaration identifier="R" cardinality="multiple" base-type="directedPair"/>`;

/**
 * The response declaration an associate interaction binds.
 */
const paired = `<qti-response-declaration identifier="R" cardinality="multiple" base-type="pair"/>`;

/**
 * Each choice class, by its element: the eight N8's choice clause reads.
 */
const choiceClasses = {
  "qti-associable-hotspot": {
    anywhere: false,
    choice: (id) => `<qti-associable-hotspot${id} shape="circle" coords="1,1,1" match-max="1"/>`,
    declaration: paired,
    own: (choice) =>
      `<qti-graphic-associate-interaction response-identifier="R" max-associations="1"><object data="a.png" type="image/png"/>${choice}</qti-graphic-associate-interaction>`,
  },
  "qti-gap": {
    anywhere: true,
    choice: (id) => `<qti-gap${id}/>`,
    declaration: directed,
    own: (choice) =>
      `<qti-gap-match-interaction response-identifier="R" max-associations="1"><qti-gap-text identifier="W" match-max="1">w</qti-gap-text><p>x ${choice}</p></qti-gap-match-interaction>`,
  },
  "qti-gap-img": {
    anywhere: false,
    choice: (id) =>
      `<qti-gap-img${id} match-max="1"><object data="g.png" type="image/png"/></qti-gap-img>`,
    declaration: directed,
    own: (choice) =>
      `<qti-graphic-gap-match-interaction response-identifier="R" max-associations="1"><object data="a.png" type="image/png"/>${choice}<qti-associable-hotspot identifier="H" shape="circle" coords="1,1,1" match-max="1"/></qti-graphic-gap-match-interaction>`,
  },
  "qti-gap-text": {
    anywhere: false,
    choice: (id) => `<qti-gap-text${id} match-max="1">w</qti-gap-text>`,
    declaration: directed,
    own: (choice) =>
      `<qti-gap-match-interaction response-identifier="R" max-associations="1">${choice}<p>x <qti-gap identifier="G"/></p></qti-gap-match-interaction>`,
  },
  "qti-hotspot-choice": {
    anywhere: false,
    choice: (id) => `<qti-hotspot-choice${id} shape="circle" coords="1,1,1"/>`,
    declaration: single,
    own: (choice) =>
      `<qti-hotspot-interaction response-identifier="R" max-choices="1"><object data="a.png" type="image/png"/>${choice}</qti-hotspot-interaction>`,
  },
  "qti-inline-choice": {
    anywhere: false,
    choice: (id) => `<qti-inline-choice${id}>a</qti-inline-choice>`,
    declaration: single,
    own: (choice) =>
      `<p>pick <qti-inline-choice-interaction response-identifier="R">${choice}</qti-inline-choice-interaction></p>`,
  },
  "qti-simple-associable-choice": {
    anywhere: false,
    choice: (id) =>
      `<qti-simple-associable-choice${id} match-max="1">a</qti-simple-associable-choice>`,
    declaration: paired,
    own: (choice) =>
      `<qti-associate-interaction response-identifier="R" max-associations="1">${choice}</qti-associate-interaction>`,
  },
  "qti-simple-choice": {
    anywhere: false,
    choice: (id) => `<qti-simple-choice${id}>a</qti-simple-choice>`,
    declaration: single,
    own: (choice) =>
      `<qti-choice-interaction response-identifier="R" max-choices="1">${choice}</qti-choice-interaction>`,
  },
} as const satisfies Readonly<Record<string, ChoiceClass>>;

/**
 * Where a case places its choice: in its own interaction, in a paragraph of a hottext interaction
 * (an interaction, none of whose choices it is), or in a paragraph of the body, in no interaction.
 */
const placements = ["own", "foreign", "outside"] as const;

/**
 * A case: the choice's class, by its element, its placement, and whether it writes its identifier.
 */
interface ChoiceCase {
  readonly held: ChoiceClass;
  readonly identified: boolean;
  readonly kind: string;
  readonly placement: (typeof placements)[number];
}

/**
 * Every case: each class, placed each way, with its identifier and without.
 */
const cases: readonly ChoiceCase[] = Object.entries(choiceClasses).flatMap(([kind, held]) =>
  placements.flatMap((placement) =>
    [true, false].map((identified): ChoiceCase => ({ held, identified, kind, placement })),
  ),
);

/**
 * Show a case.
 *
 * @param drawn - The case.
 * @returns Its class, its placement, and whether it writes its identifier.
 */
const shownCase = ({ identified, kind, placement }: ChoiceCase): string =>
  `${kind} ${placement}${identified ? "" : " unidentified"}`;

/**
 * Write a case's package: a manifest listing one item, whose body places the choice.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const casePackage = ({ held, identified, placement }: ChoiceCase): PackageEntries => {
  const choice = held.choice(identified ? ` identifier="C"` : "");
  const { body, declaration } = {
    foreign: {
      body: `<qti-hottext-interaction response-identifier="R" max-choices="1"><p>a ${choice} b</p></qti-hottext-interaction>`,
      declaration: single,
    },
    outside: { body: `<p>a ${choice} b</p>`, declaration: "" },
    own: { body: held.own(choice), declaration: held.declaration },
  }[placement];
  const manifest = `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`;
  const item = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false">${declaration}<qti-item-body>${body}</qti-item-body></qti-assessment-item>`;
  const encoder = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", encoder.encode(manifest)],
    ["item.xml", encoder.encode(item)],
  ]);
};

/**
 * Read the laws one side of a judgment names: the oracle's laws, or the laws the import's rows
 * break on the host, from its summary.
 *
 * @param summary - The side's summary, `laws <laws>` or `built <laws>`.
 * @returns The laws it names.
 */
const lawsNamed = (summary: string): readonly string[] =>
  summary.replace(/^(?:laws|built) ?/u, "").split(", ");

layer(NodeServices.layer, { excludeTestServices: true })(
  "N8's choice clause, held by the import's rows and the law oracle alike",
  (it) => {
    it.effect(
      "every choice class, in its own interaction, another or none, with its identifier or without, has one verdict, N8 where a choice that writes its identifier lies in no interaction",
      (ctx) =>
        // Oracle: a second implementation, the law oracle against the laws the import's rows hold
        // on the host, and the specification, N8 where an identified choice lies in no
        // interaction. Bound: 8 choice classes x 3 placements x with or without an identifier, 48
        // cases, exhausted.
        searched(
          ctx,
          Effect.gen(function* choiceNearest() {
            const directory = yield* scratchDirectory("choice-nearest-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "every choice class, placed in its own interaction, another or none, with or without its identifier",
                caseHang: Duration.seconds(60),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const drawn = cases[at];

                  return drawn === undefined ? String(at) : shownCase(drawn);
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the import's rows' host laws",
                },
                suite: "pantry/choice-nearest",
              },
              (at) =>
                Effect.gen(function* choiceNearestCase() {
                  const drawn = cases[at];
                  assert.isDefined(drawn, `no case ${String(at)}`);
                  if (drawn === undefined) {
                    return;
                  }

                  const label = shownCase(drawn);
                  const judged = yield* judgeOne(yield* genomeOf(casePackage(drawn)), bench, at);
                  assert.deepStrictEqual(
                    judged.disagreements.map(shownDisagreement),
                    [],
                    `${label}: the oracle (${judged.summary.oracle}) and the import (${judged.summary.import}) disagree`,
                  );

                  const { held } = drawn;
                  assert.strictEqual(
                    judged.summary.oracle.startsWith("codec "),
                    !held.anywhere && drawn.placement !== "own",
                    `${label}: the oracle ${judged.summary.oracle}`,
                  );

                  const breaks = held.anywhere && drawn.identified && drawn.placement === "outside";
                  assert.strictEqual(
                    lawsNamed(judged.summary.oracle).includes("N8 nearest"),
                    breaks,
                    `${label}: the oracle names ${judged.summary.oracle}`,
                  );
                  assert.strictEqual(
                    lawsNamed(judged.summary.import).includes("N8 nearest"),
                    breaks,
                    `${label}: the import's rows break ${judged.summary.import}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
