/**
 * A rounding operator's rows over every way it can write its two attributes, `figures` and
 * `rounding-mode`. The import and the law oracle must give one verdict, and the rows must hold no
 * placeholder.
 *
 * Reading 119 judges a rounding operator's `figures` under the mode in force. That mode is the
 * written `rounding-mode`, or a `qti-equal-rounded`'s default (`EqualRoundedDType`,
 * `default="significantFigures"`). The XSD requires `figures` on both kinds and `rounding-mode` on
 * a `qti-round-to`.
 *
 * So the operator's `Rounding` row says which of the two it holds (`RoundingHolds`), and each one
 * is a row of its own where it exists: `RoundingFigures` and `RoundingMode`. Where it holds both,
 * `RoundingModeFigures` is the row the law judges. An operator that holds less than both leaves out
 * a required attribute, so AL3 refuses it alone and it has no row of what it lacks. The box's cases
 * show this: each refused case is refused by AL3, under no other law.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { rowsOf } from "#pantry/import/overlays/operators.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { equalRoundedMode } from "#pantry/qti/operators.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement, signatureOf } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The grammar shred reads each document by.
 */
const shredGrammar = shredGrammarOf(Result.getOrThrow(composed()));

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The classes of disagreement the known table records, each waiting on its owner's fix.
 */
const recorded: ReadonlySet<string> = new Set(Object.keys(known));

/**
 * One rounding operator of the box: its kind, its `rounding-mode` (written as `decimalPlaces`, or
 * not at all), and its `figures`: not written, `0`, `-1`, or the name of an integer variable.
 */
interface Case {
  readonly figures: "-1" | "0" | "COUNT" | "unwritten";
  readonly kind: "qti-equal-rounded" | "qti-round-to";
  readonly mode: "decimalPlaces" | "unwritten";
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

  throw new Error("The box lists no case. List each kind, mode and figures.");
};

/**
 * Every case of the box: each kind, under each mode, with each figures, 16 operators.
 */
const cases = nonEmpty(
  (["qti-equal-rounded", "qti-round-to"] as const).flatMap((kind) =>
    (["unwritten", "decimalPlaces"] as const).flatMap((mode) =>
      (["unwritten", "0", "-1", "COUNT"] as const).map((figures): Case => ({
        figures,
        kind,
        mode,
      })),
    ),
  ),
);

/**
 * The box, every case once.
 */
const caseGen: Gen<Case> = element(cases);

/**
 * The operator's attributes as written.
 *
 * @param input - The case.
 * @returns Its attributes' text, each with its leading space.
 */
const attributesOf = (input: Case): string =>
  [
    input.mode === "unwritten" ? "" : ` rounding-mode="${input.mode}"`,
    input.figures === "unwritten" ? "" : ` figures="${input.figures}"`,
  ].join("");

/**
 * The item a case writes: three outcomes, and response processing holding its operator.
 *
 * @param input - The case.
 * @returns The item's text.
 */
const itemOf = (input: Case): string => {
  const rule =
    input.kind === "qti-equal-rounded"
      ? `<qti-set-outcome-value identifier="FLAG"><qti-equal-rounded${attributesOf(input)}><qti-variable identifier="SCORE"/><qti-variable identifier="SCORE"/></qti-equal-rounded></qti-set-outcome-value>`
      : `<qti-set-outcome-value identifier="SCORE"><qti-round-to${attributesOf(input)}><qti-variable identifier="SCORE"/></qti-round-to></qti-set-outcome-value>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${asi}" identifier="a" title="A" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="FLAG" cardinality="single" base-type="boolean"/><qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer"/><qti-item-body><p>A.</p></qti-item-body><qti-response-processing>${rule}</qti-response-processing></qti-assessment-item>`;
};

/**
 * Build a case's package: a manifest listing its item.
 *
 * @param input - The case.
 * @returns The package's entries.
 */
const entriesOf = (input: Case): PackageEntries => {
  const text = new TextEncoder();

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(`<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="HOLDS"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="item" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/></resource></resources></manifest>`),
    ],
    ["items/a.xml", text.encode(itemOf(input))],
  ]);
};

/**
 * The mode in force on a case's operator: its written `rounding-mode`, else a
 * `qti-equal-rounded`'s default, else none.
 *
 * @param input - The case.
 * @returns The mode, or none.
 */
const modeInForce = (input: Case): readonly string[] => {
  if (input.mode !== "unwritten") {
    return [input.mode];
  }

  return input.kind === "qti-equal-rounded" ? [equalRoundedMode] : [];
};

/**
 * What an operator holds, by whether it writes `figures` and whether a mode is in force.
 *
 * @param figures - Whether it writes `figures`.
 * @param mode - Whether a mode is in force.
 * @returns The `RoundingHolds` handle.
 */
const holdingOf = (figures: boolean, mode: boolean): string => {
  if (figures) {
    return mode ? "both" : "figures";
  }

  return mode ? "mode" : "neither";
};

/**
 * Assert a case's rows hold exactly what it writes: its `Rounding` row holding a `figures` exactly
 * where it writes one and a mode exactly where one is in force; a `RoundingFigures` row, copying
 * the `figures`, exactly where written; a `RoundingMode` row, holding the written mode or the
 * default, exactly where one is in force; and a `RoundingModeFigures` row exactly where it holds
 * both. No row holds an empty text, the placeholder an unwritten attribute once wrote.
 *
 * @param input - The case.
 * @returns Whether the operator holds both, which a valid one does.
 */
const assertRows = (input: Case) =>
  Effect.gen(function* rowsHeld() {
    const xml = yield* readXml(new TextEncoder().encode(itemOf(input)));
    const rows = rowsOf(yield* shred(xml, "3.0.1", shredGrammar), {
      context: ownContext(idOf(0)),
      idOf,
    });
    const message = JSON.stringify(input);
    const mode = modeInForce(input);
    const figures = input.figures === "unwritten" ? [] : [input.figures];
    const both = figures.length > 0 && mode.length > 0;

    assert.deepStrictEqual(
      [...rows.Rounding.values()].map((row) => row.holds),
      [holdingOf(figures.length > 0, mode.length > 0)],
      message,
    );
    assert.deepStrictEqual(
      [...rows.RoundingFigures.values()].map(({ figuresLexical }) => figuresLexical),
      figures,
      message,
    );
    assert.deepStrictEqual(
      [...rows.RoundingMode.values()].map((row) => row.mode),
      mode,
      message,
    );
    assert.strictEqual(rows.RoundingModeFigures.size, both ? 1 : 0, message);
    for (const row of [
      ...rows.RoundingFigures.values(),
      ...rows.RoundingMode.values(),
      ...rows.RoundingModeFigures.values(),
    ]) {
      assert.notInclude(Object.values(row), "", `a row holds an empty text: ${message}`);
    }

    return both;
  });

/**
 * Whether the operator of a case holds both of its inputs, and so is valid as AL3 reads it.
 */
type Situation = "both, judged" | "less than both, AL3 alone";

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/operators.ts, a rounding operator's figures and mode written or not",
  (it) => {
    it.effect(
      "writes each rounding operator's figures and mode as rows exactly where it holds them, and the import and the oracle agree, AL3 alone refusing what holds less than both",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against readProgram's refusal and the
        // laws its rows break on the host, as the genetic differential judges them, over
        // EqualRoundedDType's and RoundToDType's attributes (figures required on both,
        // rounding-mode required on qti-round-to, defaulted on qti-equal-rounded) and reading 119.
        // Bound: every case of the box, 16 operators.
        searched(
          ctx,
          Effect.gen(function* holds() {
            const directory = yield* scratchDirectory("operators-holds-");
            const bench = { directory, grammar, laws };
            let at = 0;

            return yield* exhaust(
              {
                box: "each rounding kind under each mode, written or not, with each figures, written or not",
                caseHang: Duration.minutes(2),
                coverage: requiredInSpace<Situation>(["both, judged", "less than both, AL3 alone"]),
                generator: caseGen,
                limit: cases.length,
                literal: (input) => JSON.stringify(input),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against readProgram's refusal and its rows' host laws",
                },
                suite: "import/overlays/operators-holds",
              },
              (input, c) =>
                Effect.gen(function* judged() {
                  const both = yield* assertRows(input);
                  const judgment = yield* judgeOne(yield* genomeOf(entriesOf(input)), bench, at);
                  at += 1;
                  const message = `${JSON.stringify(input)}: ${JSON.stringify(judgment.summary)}`;
                  c.note(both ? "both, judged" : "less than both, AL3 alone");

                  assert.deepStrictEqual(
                    judgment.disagreements
                      .filter((disagreement) => !recorded.has(signatureOf(disagreement)))
                      .map(shownDisagreement),
                    [],
                    message,
                  );
                  if (!both) {
                    assert.strictEqual(judgment.summary.oracle, "laws AL3 required", message);
                  }
                }),
            );
          }),
        ),
      { timeout: 600_000 },
    );
  },
);
