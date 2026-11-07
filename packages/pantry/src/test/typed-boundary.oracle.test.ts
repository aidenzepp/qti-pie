/**
 * The law oracle's one read of a typed attribute past AL1 (`typedValueOf` in `oracle-view.ts`),
 * held to GEN-A's boundary seeds: a typed attribute whose form lies outside its type's lexical
 * space breaks AL1's lexical law alone, and no law reads a value the document never wrote.
 *
 * Oracle: the specification as a checker, XSD 1.1 Part 2 §4.3.6 (a value is judged after its
 * type's whiteSpace normalization: `preserve` for an `xs:string` restriction such as `base-type`,
 * `cardinality`, `show-hide`, `navigation-mode` and cp:resource's `type`, `collapse` for an
 * `xs:nonNegativeInteger` such as `max-choices`) and spec reading 7 (a mapping's typed QTI value in
 * an attribute is read exactly), and the law oracle's verdict over each seed and its control.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeSpec, specOf } from "#pantry/test/fixtures.ts";
import type { FixtureName, TextEdit } from "#pantry/test/fixtures.ts";
import { judge, lawsOf, ruleOf, verdictOf } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 4.6 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 60_000;

/**
 * The composed grammar every seed is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * `simple`'s item declarations, interaction and response processing as its `choice.xml` writes
 * them, its manifest's resource, and `test-linear`'s test part.
 */
const shipped = {
  interaction:
    '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
  outcome: '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
  resource: 'type="imsqti_item_xmlv3p0" href="choice.xml"',
  response:
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  template:
    '<qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>',
  testPart:
    '<qti-test-part navigation-mode="linear" submission-mode="individual" identifier="RTEST-13-A" title="Part A">',
};

/**
 * The outcome a feedback inline names, declared beside `simple`'s score.
 */
const feedbackDeclaration =
  '<qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>';

/**
 * A paragraph of `simple`'s with a feedback inline in it.
 *
 * @param showHide - The inline's \`show-hide\`.
 * @returns The paragraph.
 */
const feedbackInline = (showHide: string): string =>
  `<p>Look at the text in the picture.<qti-feedback-inline outcome-identifier="FEEDBACK" identifier="seen" show-hide="${showHide}">Seen.</qti-feedback-inline></p>`;

/**
 * One boundary seed: a fixture, the edit that writes one typed attribute's boundary form, and the
 * edit's control, the same structure with a valid form, which the oracle accepts.
 */
interface Seed {
  readonly control: readonly TextEdit[];
  readonly fixture: FixtureName;
  readonly label: string;
  readonly seed: readonly TextEdit[];
}

/**
 * Replace one text of one file.
 *
 * @param file - The file.
 * @param search - The text, which occurs once.
 * @param replacement - Its replacement.
 * @returns The edit.
 */
const edit = (file: string, search: string, replacement: string): TextEdit => ({
  _tag: "ReplaceText",
  file,
  replacement,
  search,
});

/**
 * A seed on `simple`'s `choice.xml` whose control is `simple` itself, accepted as shipped.
 *
 * @param label - What the seed writes.
 * @param search - The text the seed replaces.
 * @param replacement - The seed's text.
 * @returns The seed.
 */
const onChoice = (label: string, search: string, replacement: string): Seed => ({
  control: [],
  fixture: "simple",
  label,
  seed: [edit("choice.xml", search, replacement)],
});

/**
 * A seed that adds a structure to `simple`'s `choice.xml`, once with the boundary form and once,
 * as its control, with a valid one.
 *
 * @param label - What the seed writes.
 * @param search - The text the structure replaces.
 * @param written - The structure, with the form in place of `FORM`.
 * @param form - The boundary form.
 * @param valid - The valid form of the control.
 * @returns The seed.
 */
const added = (
  label: string,
  search: string,
  written: string,
  form: string,
  valid: string,
): Seed => ({
  control: [edit("choice.xml", search, written.replace("FORM", valid))],
  fixture: "simple",
  label,
  seed: [edit("choice.xml", search, written.replace("FORM", form))],
});

/**
 * GEN-A's boundary seeds (2026-11-07), each a typed attribute written outside its type's lexical
 * space. A declaration's `base-type` written outside it, and its `cardinality` padded into a
 * spelled one, are B11's cases: VD's patch reads those two through their own domains.
 */
const seeds: readonly Seed[] = [
  onChoice(
    'cardinality="-0" on a response declaration',
    shipped.response,
    shipped.response.replace('cardinality="single"', 'cardinality="-0"'),
  ),
  onChoice(
    'cardinality="multiple " on a response declaration',
    shipped.response,
    shipped.response.replace('cardinality="single"', 'cardinality="multiple "'),
  ),
  onChoice(
    'cardinality="0" on a response declaration',
    shipped.response,
    shipped.response.replace('cardinality="single"', 'cardinality="0"'),
  ),
  onChoice(
    'cardinality=" single" on an outcome declaration',
    shipped.outcome,
    shipped.outcome.replace('cardinality="single"', 'cardinality=" single"'),
  ),
  onChoice(
    'max-choices="" on a choice interaction',
    shipped.interaction,
    shipped.interaction.replace('max-choices="1"', 'max-choices=""'),
  ),
  added(
    'base-type="0.0" on a qti-base-value',
    shipped.template,
    '<qti-response-processing><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="FORM">1</qti-base-value></qti-set-outcome-value></qti-response-processing>',
    "0.0",
    "float",
  ),
  added(
    'target-value="" on an interpolation table entry',
    "</qti-outcome-declaration>",
    '</qti-outcome-declaration><qti-outcome-declaration identifier="GRADE" cardinality="single" base-type="float"><qti-interpolation-table><qti-interpolation-table-entry source-value="0" target-value="FORM"/></qti-interpolation-table></qti-outcome-declaration>',
    "",
    "1",
  ),
  {
    control: [
      edit(
        "choice.xml",
        "</qti-outcome-declaration>",
        `</qti-outcome-declaration>${feedbackDeclaration}`,
      ),
      edit("choice.xml", "<p>Look at the text in the picture.</p>", feedbackInline("show")),
    ],
    fixture: "simple",
    label: 'show-hide=" show " on a feedback inline',
    seed: [
      edit(
        "choice.xml",
        "</qti-outcome-declaration>",
        `</qti-outcome-declaration>${feedbackDeclaration}`,
      ),
      edit("choice.xml", "<p>Look at the text in the picture.</p>", feedbackInline(" show ")),
    ],
  },
  onChoice(
    'response-identifier="1RESPONSE" on a choice interaction',
    shipped.interaction,
    shipped.interaction.replace(
      'response-identifier="RESPONSE"',
      'response-identifier="1RESPONSE"',
    ),
  ),
  {
    control: [
      edit(
        "choice.xml",
        "</qti-outcome-declaration>",
        `</qti-outcome-declaration>${feedbackDeclaration}`,
      ),
      edit("choice.xml", "<p>Look at the text in the picture.</p>", feedbackInline("show")),
    ],
    fixture: "simple",
    label: 'outcome-identifier="1FEEDBACK" on a feedback inline',
    seed: [
      edit(
        "choice.xml",
        "</qti-outcome-declaration>",
        `</qti-outcome-declaration>${feedbackDeclaration}`,
      ),
      edit(
        "choice.xml",
        "<p>Look at the text in the picture.</p>",
        feedbackInline("show").replace(
          'outcome-identifier="FEEDBACK"',
          'outcome-identifier="1FEEDBACK"',
        ),
      ),
    ],
  },
  {
    control: [],
    fixture: "simple",
    label: 'type=" extension" on a cp:resource',
    seed: [
      edit(
        "imsmanifest.xml",
        shipped.resource,
        shipped.resource.replace('type="imsqti_item_xmlv3p0"', 'type=" extension"'),
      ),
    ],
  },
  {
    control: [],
    fixture: "simple",
    label: 'type="imsqti_item_xmlv3p0 " on a cp:resource',
    seed: [
      edit(
        "imsmanifest.xml",
        shipped.resource,
        shipped.resource.replace('type="imsqti_item_xmlv3p0"', 'type="imsqti_item_xmlv3p0 "'),
      ),
    ],
  },
  {
    control: [],
    fixture: "test-linear",
    label: 'navigation-mode="linear " on a test part',
    seed: [
      edit(
        "rtest13.xml",
        shipped.testPart,
        shipped.testPart.replace('navigation-mode="linear"', 'navigation-mode="linear "'),
      ),
    ],
  },
  {
    control: [],
    fixture: "test-linear",
    label: 'submission-mode="" on a test part',
    seed: [
      edit(
        "rtest13.xml",
        shipped.testPart,
        shipped.testPart.replace('submission-mode="individual"', 'submission-mode=""'),
      ),
    ],
  },
];

/**
 * Judge a fixture with edits by the law oracle.
 *
 * @param fixture - The fixture.
 * @param label - The package's name part.
 * @param edits - The edits.
 * @returns The judgment.
 */
const judged = (fixture: FixtureName, label: string, edits: readonly TextEdit[]) =>
  Effect.gen(function* judgedSeed() {
    const spec = specOf(fixture);
    const dir = yield* materializeSpec({
      ...spec,
      edits: [...spec.edits, ...edits],
      name: `typed-boundary-${label.replaceAll(/[^\da-z]+/giu, "-")}`,
    });

    return yield* judge(yield* readPackage(dir), grammar, laws);
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/oracle-view.ts, typedValueOf",
  (it) => {
    for (const { control, fixture, label, seed } of seeds) {
      it.effect(
        `refuses ${label} under attribute-lexical alone, and accepts its control`,
        () =>
          Effect.gen(function* boundarySeed() {
            const refused = yield* judged(fixture, label, seed);
            const accepted = yield* judged(fixture, `${label}-control`, control);

            assert.deepStrictEqual(
              verdictOf(refused),
              { rule: "attribute-lexical", verdict: "refused" },
              Formatter.format(refused),
            );
            assert.deepStrictEqual(
              refused._tag === "Judged"
                ? refused.breaches
                    .filter(({ law }) => ruleOf(law) !== "attribute-lexical")
                    .map(({ keys, law }) => `${law} ${Formatter.format(keys)}`)
                : [],
              [],
              "a law past AL1 read the form",
            );
            assert.deepStrictEqual(
              verdictOf(accepted),
              { verdict: "accepted" },
              Formatter.format(accepted),
            );
          }),
        testTimeoutMs,
      );
    }
  },
);
