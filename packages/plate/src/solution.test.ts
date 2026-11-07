import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import type { Expression, TemplateRule } from "#plate/model/expression.ts";
import type { Item, ResponseDeclaration } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { redact } from "#plate/render.ts";
import type { Responses } from "#plate/session/session.ts";
import { solution } from "#plate/solution.ts";
import { bg007Item } from "#plate/test/fixtures.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, acceptForTest } from "#plate/validate/verdict.ts";

/**
 * BG007, a true-or-false Choice bound to the single identifier response `RESPONSE` whose correct
 * response is the choice `true`, by its path under the corpus root, which `open` takes as its
 * location.
 */
const bg007 = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * The single identifier value holding one identifier.
 *
 * @param identifier The identifier.
 * @returns The value holding it.
 */
const identifierValue = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * A multiple identifier response that declares no correct response, beside the hand-built
 * BG007's `RESPONSE`, which declares `true`.
 */
const undeclared: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "multiple",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "OTHER",
  mapping: Option.none(),
};

/**
 * A single identifier response that declares the correct response `kept`, which the templated
 * item's template processing gives a default but no correct response.
 */
const kept: ResponseDeclaration = {
  ...undeclared,
  cardinality: "single",
  correct: Option.some(identifierValue("kept")),
  identifier: "KEPT",
};

/**
 * Construct a `qti-variable` reading a variable.
 *
 * @param identifier The variable's identifier.
 * @returns The expression.
 */
const variableOf = (identifier: string): Expression => ({
  identifier,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.none(),
});

/**
 * The template processing of {@link templated}: it sets the template variable `T`, then the
 * correct response of `RESPONSE` in a template condition's branch and of `OTHER` in its
 * `qti-template-else`, and only the default of `KEPT`.
 */
const templateRules: readonly TemplateRule[] = [
  {
    expression: { kind: "base-value", operands: [], value: identifierValue("true") },
    identifier: "T",
    kind: "set-template-value",
  },
  {
    branches: [
      {
        // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name section 0.5 of the phase-8 slice list fixes; it is an array, never a function.
        then: [
          { expression: variableOf("T"), identifier: "RESPONSE", kind: "set-correct-response" },
        ],
        when: { kind: "is-null", operands: [variableOf("T")] },
      },
    ],
    kind: "template-condition",
    otherwise: Option.some([
      { expression: variableOf("T"), identifier: "OTHER", kind: "set-correct-response" },
    ]),
  },
  { expression: variableOf("T"), identifier: "KEPT", kind: "set-default-value" },
];

/**
 * The hand-built BG007 with the responses `OTHER` and `KEPT` beside `RESPONSE`, the single
 * identifier template variable `T`, and {@link templateRules} as template processing that runs.
 */
const templated: Item = {
  ...bg007Item,
  responses: new Map([
    ...bg007Item.responses,
    [undeclared.identifier, undeclared],
    [kept.identifier, kept],
  ]),
  templateProcessing: Option.some(templateRules),
  templates: new Map([
    [
      "T",
      {
        baseType: "identifier",
        cardinality: "single",
        defaultValue: Option.none(),
        identifier: "T",
        mathVariable: false,
        paramVariable: false,
      },
    ],
  ]),
};

/**
 * Hand `solution` a redacted item, which its type refuses: the type test is the
 * `@ts-expect-error` below, which `tsc` fails on if the call ever type-checks. No test calls it.
 *
 * @returns What `solution` would make of it.
 */
const solutionOfRedacted = (): Responses =>
  // @ts-expect-error -- a `Redacted` is not `Accepted`: redact drops the correct responses, so only check's output gives a solution.
  solution(redact(acceptForTest(bg007Item)));

describe("solution", () => {
  it.effect(
    "gives BG007's correct choice, read from the corpus",
    () =>
      Effect.gen(function* bg007Solution() {
        const verdict = yield* open(bg007, yield* readCorpusFile(bg007));
        const accepted = Option.getOrElse(acceptedItem(verdict), () =>
          assert.fail(`${bg007} is ${verdict.verdict}, not accepted`),
        );

        assert.deepStrictEqual(solution(accepted), { RESPONSE: identifierValue("true") });
      }),
    { tags: ["corpus"] },
  );

  it("gives NULL of the declared type for a response that declares no correct response", () => {
    const accepted = acceptForTest({
      ...bg007Item,
      responses: new Map([...bg007Item.responses, [undeclared.identifier, undeclared]]),
    });

    assert.deepStrictEqual(solution(accepted), {
      OTHER: nullOf("identifier", "multiple"),
      RESPONSE: identifierValue("true"),
    });
  });

  it("[I-5] gives a record's correct response before the declaration's", () => {
    assert.deepStrictEqual(
      solution(acceptForTest(templated), {
        correct: { OTHER: identifierValue("other"), RESPONSE: identifierValue("false") },
      }),
      {
        KEPT: identifierValue("kept"),
        OTHER: identifierValue("other"),
        RESPONSE: identifierValue("false"),
      },
    );
  });

  it("[I-5] gives the declaration's correct response where the record holds none", () => {
    assert.deepStrictEqual(solution(acceptForTest(templated), { correct: {} }), {
      KEPT: identifierValue("kept"),
      OTHER: nullOf("identifier", "multiple"),
      RESPONSE: identifierValue("true"),
    });
  });

  it("[I-5] reads no inherited member of a record's correct responses as an override", () => {
    const constructor: ResponseDeclaration = { ...kept, identifier: "constructor" };
    const accepted = acceptForTest({
      ...bg007Item,
      responses: new Map([[constructor.identifier, constructor]]),
    });

    assert.deepStrictEqual(solution(accepted, { correct: {} }), {
      constructor: identifierValue("kept"),
    });
  });

  it("[I-5] with no record, gives NULL for each response a template-set correct response targets, at any depth, and the declared value for another", () => {
    assert.deepStrictEqual(solution(acceptForTest(templated)), {
      KEPT: identifierValue("kept"),
      OTHER: nullOf("identifier", "multiple"),
      RESPONSE: nullOf("identifier", "single"),
    });
  });

  it("[I-5] gives the declared correct responses of an item whose template processing does not run, with or without a record", () => {
    const accepted = acceptForTest({ ...templated, templateProcessing: Option.none() });
    const declared = {
      KEPT: identifierValue("kept"),
      OTHER: nullOf("identifier", "multiple"),
      RESPONSE: identifierValue("true"),
    };

    assert.deepStrictEqual(solution(accepted), declared);
    assert.deepStrictEqual(solution(accepted, { correct: {} }), declared);
  });

  it("is typed to refuse a redacted item", () => {
    assert.isFunction(solutionOfRedacted);
  });
});
