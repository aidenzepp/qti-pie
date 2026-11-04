import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { attr, doc, el } from "#plate/document/source.ts";
import type { SourceAttribute, SourceElement } from "#plate/document/source.ts";
import { checkRules } from "#plate/validate/rules.ts";

/**
 * The location every hand-built item in these tests carries.
 */
const location = "items/rules.xml";

/**
 * Construct a hand-built item from its declarations and its body's children.
 *
 * @param declarations The item's declarations, in document order.
 * @param body The children of its `qti-item-body`.
 * @returns The item as a source document.
 */
const item = (declarations: readonly SourceElement[], body: readonly SourceElement[]) =>
  doc(
    location,
    el(
      "qti-assessment-item",
      [attr("identifier", "rules"), attr("title", "Rules"), attr("time-dependent", "false")],
      [...declarations, el("qti-item-body", [], body)],
    ),
  );

/**
 * Construct a response declaration.
 *
 * @param identifier Its `identifier`.
 * @param cardinality Its `cardinality`.
 * @param baseType Its `base-type`, none when absent.
 * @returns The declaration.
 */
const response = (identifier: string, cardinality: string, baseType?: string): SourceElement =>
  el("qti-response-declaration", [
    attr("identifier", identifier),
    attr("cardinality", cardinality),
    ...(baseType === undefined ? [] : [attr("base-type", baseType)]),
  ]);

/**
 * Construct a single float outcome declaration.
 *
 * @param identifier Its `identifier`.
 * @returns The declaration.
 */
const outcome = (identifier: string): SourceElement =>
  el("qti-outcome-declaration", [
    attr("identifier", identifier),
    attr("cardinality", "single"),
    attr("base-type", "float"),
  ]);

/**
 * Construct a Choice with the given choice identifiers.
 *
 * @param responseIdentifier Its `response-identifier`.
 * @param choices The identifiers of its `qti-simple-choice` children.
 * @returns The interaction.
 */
const choice = (responseIdentifier: string, choices: readonly string[] = ["A", "B"]) =>
  el(
    "qti-choice-interaction",
    [attr("response-identifier", responseIdentifier)],
    choices.map((identifier) => el("qti-simple-choice", [attr("identifier", identifier)])),
  );

/**
 * Construct an interaction with only its `response-identifier` and any further attributes.
 *
 * @param local The interaction's local name.
 * @param responseIdentifier Its `response-identifier`.
 * @param attributes Its further attributes.
 * @returns The interaction.
 */
const interaction = (
  local: string,
  responseIdentifier: string,
  attributes: readonly SourceAttribute[] = [],
): SourceElement => el(local, [attr("response-identifier", responseIdentifier), ...attributes]);

/**
 * Reduce refusals to what a test asserts: the rule, the path and the detail.
 *
 * @param source The document to check.
 * @returns One entry per refusal, in the order `checkRules` gives them.
 */
const judged = (source: ReturnType<typeof item>) =>
  checkRules(source).map((refusal) => {
    assert.strictEqual(refusal.document, location);
    assert.isTrue(Option.isNone(refusal.suggestion));
    assert.isTrue(Option.isNone(refusal.readerRule));

    return {
      detail: refusal.detail,
      path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
      rule: refusal.rule,
    };
  });

describe("checkRules", () => {
  describe("undeclared-response", () => {
    it("[I-1] refuses an interaction naming RESP2 when only RESPONSE is declared", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "identifier")], [choice("RESP2")])),
        [
          {
            detail: { response: "RESP2" },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction/@response-identifier",
            rule: "undeclared-response",
          },
        ],
      );
    });

    it("[I-1] accepts an interaction naming its declared RESPONSE", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "identifier")], [choice("RESPONSE")])),
        [],
      );
    });

    it("[I-1] reads identifiers as NCNames, with their outer whitespace collapsed", () => {
      assert.deepStrictEqual(
        judged(item([response(" RESPONSE", "single", "identifier")], [choice("RESPONSE\n")])),
        [],
      );
    });
    it("[I-1] does not resolve a response-identifier that only an attribute wildcard admits", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier")],
            [el("p", [attr("response-identifier", "RESP2")]), choice("RESPONSE")],
          ),
        ),
        [],
      );
    });
  });

  describe("duplicate-identifier", () => {
    it("[I-1] refuses the second of two declarations named SCORE", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), outcome("SCORE"), outcome("SCORE")],
            [choice("RESPONSE")],
          ),
        ),
        [
          {
            detail: { identifier: "SCORE" },
            path: "qti-assessment-item/qti-outcome-declaration[2]/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("[I-1] refuses a response and an outcome declaration sharing an identifier", () => {
      assert.deepStrictEqual(
        judged(item([response("SCORE", "single", "identifier"), outcome("SCORE")], [])),
        [
          {
            detail: { identifier: "SCORE" },
            path: "qti-assessment-item/qti-outcome-declaration/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("[I-1] refuses the second of two choices named A", () => {
      assert.deepStrictEqual(
        judged(
          item([response("RESPONSE", "single", "identifier")], [choice("RESPONSE", ["A", "A"])]),
        ),
        [
          {
            detail: { identifier: "A" },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-simple-choice[2]/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("[I-1] accepts distinct declarations, and the same choice identifier in two interactions", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("RESPONSE2", "multiple", "identifier"),
              outcome("SCORE"),
            ],
            [choice("RESPONSE", ["A", "B"]), choice("RESPONSE2", ["A", "B"])],
          ),
        ),
        [],
      );
    });
  });

  describe("binding", () => {
    it("[I-1] refuses a Choice bound to a string declaration", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "string")], [choice("RESPONSE")])),
        [
          {
            detail: {
              baseType: "string",
              cardinality: "single",
              interaction: "qti-choice-interaction",
              response: "RESPONSE",
            },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
            rule: "binding",
          },
        ],
      );
    });

    it("[I-1] accepts a Choice bound to a multiple identifier declaration", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "multiple", "identifier")], [choice("RESPONSE")])),
        [],
      );
    });

    it("[I-1] refuses a Text Entry bound to a multiple declaration", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "multiple", "string")],
            [interaction("qti-text-entry-interaction", "RESPONSE")],
          ),
        ),
        [
          {
            detail: {
              baseType: "string",
              cardinality: "multiple",
              interaction: "qti-text-entry-interaction",
              response: "RESPONSE",
            },
            path: "qti-assessment-item/qti-item-body/qti-text-entry-interaction",
            rule: "binding",
          },
        ],
      );
    });

    it("[I-1] accepts a Text Entry bound to a record declaration, which phase 1 shows as a notice", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "record")],
            [interaction("qti-text-entry-interaction", "RESPONSE")],
          ),
        ),
        [],
      );
    });

    it("[I-1] reads the declaration the interaction names, not any declaration in the item", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("CHOICE", "single", "identifier"), response("TEXT", "single", "integer")],
            [choice("TEXT"), interaction("qti-text-entry-interaction", "CHOICE")],
          ),
        ),
        [
          {
            detail: {
              baseType: "integer",
              cardinality: "single",
              interaction: "qti-choice-interaction",
              response: "TEXT",
            },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
            rule: "binding",
          },
          {
            detail: {
              baseType: "identifier",
              cardinality: "single",
              interaction: "qti-text-entry-interaction",
              response: "CHOICE",
            },
            path: "qti-assessment-item/qti-item-body/qti-text-entry-interaction",
            rule: "binding",
          },
        ],
      );
    });
  });

  describe("max-strings (reading 19)", () => {
    it("[I-1] refuses an Extended Text bound to a multiple declaration without max-strings", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "multiple", "string")],
            [interaction("qti-extended-text-interaction", "RESPONSE")],
          ),
        ),
        [
          {
            detail: { attribute: "max-strings", element: "qti-extended-text-interaction" },
            path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
            rule: "missing-attribute",
          },
        ],
      );
    });

    it('[I-1] accepts an Extended Text bound to a multiple declaration with max-strings="2"', () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "multiple", "string")],
            [interaction("qti-extended-text-interaction", "RESPONSE", [attr("max-strings", "2")])],
          ),
        ),
        [],
      );
    });
  });
});
