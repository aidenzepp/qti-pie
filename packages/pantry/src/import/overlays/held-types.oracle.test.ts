/**
 * The type a setter or a lookup sets its variable to, a row of its own (`HeldType`): over a box of
 * setters and lookups, each holding one expression, whose `identifier` names a declared variable,
 * a built-in one or an undeclared name, or names no variable at all (unwritten, empty, or no
 * NCName: spec reading 152), the import and the law oracle give one verdict.
 *
 * A setter that names no variable has no `VariableRef` row, so its expression's type has no
 * reference to be compared with: its `identifier` is refused by AL3 or its value domain alone, on
 * the import's rows as in the oracle. Before the held type was a row of its own, the import copied
 * the expression's type into the reference row such a setter lacks, and its rows broke "E1
 * derived" beside the oracle's AL3 or value domain.
 *
 * The held type itself is a query the database derives (`HeldType` of `#pantry/qti/queries.ts`),
 * which the import writes no row of, and `Set_type` and `Lookup_type` over it are rules over that
 * query, which the database alone judges: the host judges no statement over a derived relation. So
 * this box holds the import's references and the laws over its stored rows to the oracle, and the
 * oracle's `Set type` and `Lookup type` stand unjudged here ({@link databaseJudged}).
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), which
 * holds the two to one verdict: no case shows a disagreement but a class a lane's open fix owns
 * (`known`) or a law the database alone judges.
 *
 * Bound: every setter and the lookup, by each of seven identifiers, over an expression that fits
 * its declared variable and one that does not: 70 packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect } from "effect";
import { lookupKind, setKinds } from "#pantry/grammar/expression.ts";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, recordsClassOf, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The oracle's laws over a held type, which the database judges over its query and the host does
 * not: `Set type` (P20) and `Lookup type` (P22).
 */
const databaseJudged: readonly Signature[] = [
  { kind: "oracle-only-law", law: "Lookup type" },
  { kind: "oracle-only-law", law: "Set type" },
];

/**
 * The classes of disagreement the known table records, each waiting on its owner's fix, and the
 * laws the database alone judges here.
 */
const recorded: readonly Signature[] = [
  ...known.map(({ signature }) => signature),
  ...databaseJudged,
];

/**
 * A setter or the lookup.
 */
type Holder = (typeof setKinds)[number] | typeof lookupKind;

/**
 * Where each holder is written and the declared variable it sets: the template setters in the
 * item's template processing, the outcome setter and the lookup in its response processing, each
 * naming a variable of the kind it sets (information model §2.5, §2.6).
 */
const placements: Readonly<
  Record<Holder, { readonly processing: "response" | "template"; readonly variable: string }>
> = {
  "qti-lookup-outcome-value": { processing: "response", variable: "SCORE" },
  "qti-set-correct-response": { processing: "template", variable: "RESPONSE" },
  "qti-set-default-value": { processing: "template", variable: "RESPONSE" },
  "qti-set-outcome-value": { processing: "response", variable: "SCORE" },
  "qti-set-template-value": { processing: "template", variable: "T" },
};

/**
 * What a case's `identifier` is: the holder's declared variable, the built-in `numAttempts`, an
 * undeclared name, or no name (unwritten, empty, a digit first, a space inside).
 */
type Identifier = "a b" | "1a" | "declared" | "empty" | "numAttempts" | "U" | "unwritten";

/**
 * One case of the box: the holder, its identifier, and whether its expression's type fits the
 * declared variable, every one of which is float and single.
 */
interface Case {
  readonly fits: boolean;
  readonly holder: Holder;
  readonly identifier: Identifier;
}

/**
 * Hold a box's cases as the nonempty list a generator draws from.
 *
 * @param listed - The cases.
 * @returns The same cases, typed nonempty.
 * @throws {Error} When the box lists none, which its product never does.
 */
const nonEmpty = (listed: readonly Case[]): readonly [Case, ...Case[]] => {
  if (Arr.isReadonlyArrayNonEmpty(listed)) {
    return listed;
  }

  throw new Error("The box lists no case. List each holder, identifier and expression.");
};

/**
 * The setters and the lookup, each once.
 */
const holders: readonly Holder[] = [...setKinds, lookupKind];

/**
 * Every case of the box, 70 holders.
 */
const cases = nonEmpty(
  holders.flatMap((holder) =>
    (["declared", "numAttempts", "U", "unwritten", "empty", "1a", "a b"] as const).flatMap(
      (identifier) => [true, false].map((fits): Case => ({ fits, holder, identifier })),
    ),
  ),
);

/**
 * The box, every case once.
 */
const caseGen: Gen<Case> = element(cases);

/**
 * Whether a case's identifier names a variable, and what it resolves to.
 */
type Situation = "a built-in" | "declared" | "no variable" | "nothing declared";

/**
 * What each identifier names, and the `identifier` attribute it writes after its element's name,
 * none where it writes none: the holder's declared variable, `numAttempts`, `U`, nothing, an empty
 * value, a digit first and a space inside.
 */
const identifiers: Readonly<
  Record<
    Identifier,
    { readonly attribute: (holder: Holder) => string; readonly situation: Situation }
  >
> = {
  "1a": { attribute: () => ' identifier="1a"', situation: "no variable" },
  U: { attribute: () => ' identifier="U"', situation: "nothing declared" },
  "a b": { attribute: () => ' identifier="a b"', situation: "no variable" },
  declared: {
    attribute: (holder) => ` identifier="${placements[holder].variable}"`,
    situation: "declared",
  },
  empty: { attribute: () => ' identifier=""', situation: "no variable" },
  numAttempts: { attribute: () => ' identifier="numAttempts"', situation: "a built-in" },
  unwritten: { attribute: () => "", situation: "no variable" },
};

/**
 * Build a case's package: an item declaring a float response `RESPONSE`, a float outcome `SCORE`
 * with an interpolation table a lookup reads, and a float template `T`, its holder in the
 * processing it belongs to, over a float base value or a string one.
 *
 * @param input - The case.
 * @returns The package's entries.
 */
const entriesOf = (input: Case): PackageEntries => {
  const text = new TextEncoder();
  const expression = input.fits
    ? '<qti-base-value base-type="float">1</qti-base-value>'
    : '<qti-base-value base-type="string">x</qti-base-value>';
  const rule = `<${input.holder}${identifiers[input.identifier].attribute(input.holder)}>${expression}</${input.holder}>`;
  const { processing } = placements[input.holder];

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(`<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="item" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/></resource></resources></manifest>`),
    ],
    [
      "items/a.xml",
      text.encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${asi}" identifier="a" title="A" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-interpolation-table><qti-interpolation-table-entry source-value="1" target-value="1"/></qti-interpolation-table></qti-outcome-declaration><qti-template-declaration identifier="T" cardinality="single" base-type="float"/>${processing === "template" ? `<qti-template-processing>${rule}</qti-template-processing>` : ""}<qti-item-body><p>A.</p></qti-item-body>${processing === "response" ? `<qti-response-processing>${rule}</qti-response-processing>` : ""}</qti-assessment-item>`),
    ],
  ]);
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/expressions.ts, the type a setter or a lookup sets its variable to",
  (it) => {
    it.effect(
      "gives one verdict with the law oracle for a setter or a lookup whose identifier names a variable or none",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against readProgram's refusal and the
        // laws its rows break on the host, as the genetic differential judges them.
        // Bound: every case of the box, 70 holders.
        searched(
          ctx,
          Effect.gen(function* heldTypes() {
            const directory = yield* scratchDirectory("held-types-");
            const bench = { directory, grammar, laws };
            let at = 0;

            return yield* exhaust(
              {
                box: "each setter and the lookup, by each identifier, over a fitting and an unfitting expression",
                caseHang: Duration.minutes(2),
                coverage: requiredInSpace<Situation>([
                  "declared",
                  "a built-in",
                  "nothing declared",
                  "no variable",
                ]),
                generator: caseGen,
                limit: cases.length,
                literal: (input) => JSON.stringify(input),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against readProgram's refusal and its rows' host laws",
                },
                suite: "import/overlays/held-types",
              },
              (input, c) =>
                Effect.gen(function* judged() {
                  c.note(identifiers[input.identifier].situation);

                  const genome = yield* genomeOf(entriesOf(input));
                  const judgment = yield* judgeOne(genome, bench, at);
                  at += 1;
                  const message = `${JSON.stringify(input)}: ${JSON.stringify(judgment.summary)}`;

                  assert.deepStrictEqual(
                    judgment.disagreements
                      .filter((disagreement) => !recordsClassOf(recorded, disagreement))
                      .map(shownDisagreement),
                    [],
                    message,
                  );
                }),
            );
          }),
        ),
    );
  },
);
