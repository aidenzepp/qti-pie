/**
 * The declaration a variable reference names, a row of its own (lane NIL's NS1): over a small box
 * of references, in an item and in a response rule fragment the item splices, the import writes a
 * reference's declaration row exactly where its name resolves to a declaration, never a nil uuid
 * where it names a built-in variable or nothing, and the import and the law oracle give one
 * verdict.
 *
 * A reference resolves among its item's declarations, else to one of the item's built-in variables
 * ("declared implicitly", information model §2.2.2), else to nothing, which "Variable declared"
 * refuses in an item. Each reference is judged two ways by the genetic differential's judge
 * (`judgeOne` of `#pantry/test/gen/genetic/judge.ts`), which reports a uuid the import never minted
 * as `dangling-uuid`, and its host rows are held to the resolution directly.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect } from "effect";
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
 * The classes of disagreement the known table records, each waiting on its owner's fix.
 */
const recorded: readonly Signature[] = known.map(({ signature }) => signature);

/**
 * One reference of the box: the name it spells, which the item declares (`SCORE`), a built-in
 * variable of the item (`numAttempts`) or nothing (`U`); the element that makes it, a rule or an
 * expression; and where it is written, in the item or in the fragment it splices.
 */
interface Case {
  readonly at: "fragment" | "item";
  readonly by: "expression" | "rule";
  readonly name: "numAttempts" | "SCORE" | "U";
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

  throw new Error("The box lists no case. List each name, element and place.");
};

/**
 * Every case of the box, 12 references.
 */
const cases = nonEmpty(
  (["SCORE", "numAttempts", "U"] as const).flatMap((name) =>
    (["rule", "expression"] as const).flatMap((by) =>
      (["item", "fragment"] as const).map((at): Case => ({ at, by, name })),
    ),
  ),
);

/**
 * The box, every case once.
 */
const caseGen: Gen<Case> = element(cases);

/**
 * The response rule a case writes.
 *
 * @param input - The case.
 * @returns The rule's text.
 */
const ruleOf = (input: Case): string =>
  input.by === "rule"
    ? `<qti-set-outcome-value identifier="${input.name}"><qti-base-value base-type="integer">1</qti-base-value></qti-set-outcome-value>`
    : `<qti-set-outcome-value identifier="SCORE"><qti-variable identifier="${input.name}"/></qti-set-outcome-value>`;

/**
 * Build a case's package: an item declaring `SCORE`, its response processing holding the rule, or
 * an include of a fragment that holds it.
 *
 * @param input - The case.
 * @returns The package's entries.
 */
const entriesOf = (input: Case): PackageEntries => {
  const text = new TextEncoder();
  const processing = input.at === "item" ? ruleOf(input) : '<xi:include href="rules.xml"/>';
  const fragment =
    input.at === "fragment"
      ? '<resource identifier="rules" type="imsqti_fragment_xmlv3p0" href="items/rules.xml"><file href="items/rules.xml"/></resource>'
      : "";

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(`<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="NS1"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="item" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/></resource>${fragment}</resources></manifest>`),
    ],
    [
      "items/a.xml",
      text.encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="a" title="A" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="integer"/><qti-item-body><p>A.</p></qti-item-body><qti-response-processing>${processing}</qti-response-processing></qti-assessment-item>`),
    ],
    ...(input.at === "fragment"
      ? [
          [
            "items/rules.xml",
            text.encode(`<?xml version="1.0" encoding="UTF-8"?>
${ruleOf(input).replace("<qti-set-outcome-value ", `<qti-set-outcome-value xmlns="${asi}" `)}`),
          ] as const,
        ]
      : []),
  ]);
};

/**
 * Whether a case's name resolves to a declaration of the item, the one way a reference has a
 * declaration row.
 */
type Situation = "a built-in" | "declared" | "nothing";

/**
 * What a case's name resolves to.
 *
 * @param input - The case.
 * @returns The situation.
 */
const situationOf = (input: Case): Situation => {
  if (input.name === "SCORE") {
    return "declared";
  }

  return input.name === "U" ? "nothing" : "a built-in";
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/expressions.ts, the declaration a variable reference names",
  (it) => {
    it.effect(
      "writes a reference's declaration row exactly where its name is declared, never the nil uuid, and the import and the oracle agree",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against readProgram's refusal and the
        // laws its rows break on the host, as the genetic differential judges them, and the
        // resolution's three outcomes (information model §2.2.2's implicit built-ins).
        // Bound: every case of the box, 12 references.
        searched(
          ctx,
          Effect.gen(function* declarations() {
            const directory = yield* scratchDirectory("expressions-ns1-");
            const bench = { directory, grammar, laws };
            let at = 0;

            return yield* exhaust(
              {
                box: "each name (declared, built in, nothing) by a rule or an expression, in the item or its fragment",
                caseHang: Duration.minutes(2),
                coverage: requiredInSpace<Situation>(["declared", "a built-in", "nothing"]),
                generator: caseGen,
                limit: cases.length,
                literal: (input) => JSON.stringify(input),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against readProgram's refusal and its rows' host laws",
                },
                suite: "import/overlays/expressions-ns1",
              },
              (input, c) =>
                Effect.gen(function* judged() {
                  c.note(situationOf(input));

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
      { timeout: 600_000 },
    );
  },
);
