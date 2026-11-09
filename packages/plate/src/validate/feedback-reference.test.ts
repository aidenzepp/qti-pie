import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { open } from "#plate/validate/open.ts";
import { describeRefusal } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * An item whose body holds a feedback block and a feedback inline, and which holds a modal
 * feedback, each naming `outcome` in its `outcome-identifier`, beside one more declaration.
 *
 * @param outcome The name each feedback element gives.
 * @param declared The declaration that may answer it, as written.
 * @returns The document's bytes.
 */
const itemNaming = (outcome: string, declared: string): Uint8Array =>
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="fb" title="Feedback" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  ${declared}
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
    </qti-choice-interaction>
    <p>Inline <qti-feedback-inline outcome-identifier="${outcome}" identifier="A">shown</qti-feedback-inline></p>
    <qti-feedback-block outcome-identifier="${outcome}" identifier="A"><qti-content-body><p>block</p></qti-content-body></qti-feedback-block>
  </qti-item-body>
  <qti-modal-feedback outcome-identifier="${outcome}" identifier="A" show-hide="show"><qti-content-body>modal</qti-content-body></qti-modal-feedback>
</qti-assessment-item>`);

/**
 * Open an item and reduce its verdict to its refusals' rules, paths and details.
 *
 * @param outcome The name each feedback element gives.
 * @param declared The declaration that may answer it.
 * @returns The refusals, none for an accepted item.
 */
const refusalsOf = (outcome: string, declared: string) =>
  Effect.map(open("items/feedback.xml", itemNaming(outcome, declared)), (verdict: Verdict) =>
    verdict.verdict === "refused"
      ? verdict.refusals.map((refusal) => ({
          detail: refusal.detail,
          message: describeRefusal(refusal),
          path: refusal.location.kind === "path" ? refusal.location.path : "",
          rule: refusal.rule,
        }))
      : [],
  );

/**
 * The three feedback elements, in document order: the attribute's path and the element's local
 * name, with the line of the information model that types its `outcome-identifier`.
 */
const elements = [
  ["qti-item-body/p/qti-feedback-inline", "qti-feedback-inline", "info.txt:26184"],
  ["qti-item-body/qti-feedback-block", "qti-feedback-block", "info.txt:25704"],
  ["qti-modal-feedback", "qti-modal-feedback", "info.txt:35049"],
] as const;

/**
 * An outcome declaration, as written.
 *
 * @param identifier The outcome's identifier.
 * @param cardinality Its cardinality.
 * @param baseType Its base type.
 * @returns The element's markup.
 */
const outcome = (identifier: string, cardinality: string, baseType: string): string =>
  `<qti-outcome-declaration identifier="${identifier}" cardinality="${cardinality}" base-type="${baseType}"/>`;

describe("a feedback element's outcome-identifier (reading 77; pantry's Feedback reference and Feedback outcome type)", () => {
  it.effect(
    "[I-10] accepts an identifier outcome of single or multiple cardinality, and the built-in completionStatus",
    () =>
      Effect.gen(function* accepted() {
        assert.deepStrictEqual(
          yield* refusalsOf("FEEDBACK", outcome("FEEDBACK", "single", "identifier")),
          [],
        );
        assert.deepStrictEqual(
          yield* refusalsOf("FEEDBACK", outcome("FEEDBACK", "multiple", "identifier")),
          [],
        );
        assert.deepStrictEqual(yield* refusalsOf("completionStatus", ""), []);
      }),
  );

  it.effect(
    "[I-10] refuses, at each element's attribute, a name the item declares no variable of, as undeclared-variable",
    () =>
      Effect.gen(function* undeclared() {
        const refused = yield* refusalsOf("NOPE", outcome("FEEDBACK", "single", "identifier"));

        assert.deepStrictEqual(
          refused.map(({ detail, path, rule }) => ({ detail, path, rule })),
          elements.map(([path, element]) => ({
            detail: {
              attribute: "outcome-identifier",
              element,
              expected: "outcome",
              identifier: "NOPE",
            },
            path: `qti-assessment-item/${path}/@outcome-identifier`,
            rule: "undeclared-variable" as const,
          })),
        );
        assert.include(refused[0]?.message ?? "", "declares no outcome `NOPE`");
      }),
  );

  it.effect(
    "[I-10] refuses exactly the variables that are not identifier outcomes of single or multiple cardinality, over every kind, base type and cardinality (a property over the whole grid)",
    () =>
      Effect.gen(function* grid() {
        const kinds = [
          ["qti-outcome-declaration", true],
          ["qti-template-declaration", false],
          ["qti-response-declaration", false],
        ] as const;
        const baseTypes = ["identifier", "string", "float", "integer", "boolean"] as const;
        const cardinalities = ["single", "multiple", "ordered"] as const;
        for (const [declaration, isOutcome] of kinds) {
          for (const baseType of baseTypes) {
            for (const cardinality of cardinalities) {
              const written = `<${declaration} identifier="V" cardinality="${cardinality}" base-type="${baseType}"/>`;
              const refused = yield* refusalsOf("V", written);
              const allowed =
                isOutcome &&
                baseType === "identifier" &&
                (cardinality === "single" || cardinality === "multiple");
              const case_ = `${declaration} ${cardinality} ${baseType}`;

              assert.deepStrictEqual(
                refused.map(({ detail, path, rule }) => ({ detail, path, rule })),
                allowed
                  ? []
                  : elements.map(([path, element, line]) => ({
                      detail: {
                        attribute: "outcome-identifier",
                        check: "reference",
                        element,
                        expectedBaseType: "identifier",
                        expectedCardinalities: "single multiple",
                        expectedKind: "outcome",
                        identifier: "V",
                        source: line,
                      },
                      path: `qti-assessment-item/${path}/@outcome-identifier`,
                      rule: "expression-type" as const,
                    })),
                case_,
              );
              if (!allowed) {
                assert.include(
                  refused[0]?.message ?? "",
                  "names `V`, which is not an outcome of base type `identifier`, single or multiple",
                  case_,
                );
              }
            }
          }
        }
      }),
    60_000,
  );
});
