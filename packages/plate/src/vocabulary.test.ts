import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  baseTypes,
  cardinalities,
  interactionNames,
  messageAttributes,
  renders,
  templateName,
  templateNames,
  templatePrefixes,
} from "#plate/vocabulary.ts";

/**
 * Assert that a list holds each of its members once.
 *
 * @param list The list under test.
 */
const assertDistinct = (list: readonly string[]): void => {
  assert.strictEqual(new Set(list).size, list.length, `duplicates in ${list.join(", ")}`);
};

describe("templateName", () => {
  it("[I-9b] resolves all four spellings of each built-in to its name", () => {
    for (const name of templateNames) {
      for (const prefix of templatePrefixes) {
        for (const suffix of ["", ".xml"]) {
          assert.deepStrictEqual(templateName(`${prefix}${name}${suffix}`), Option.some(name));
        }
      }
    }
  });

  it("[I-9b] resolves a CC2 template and an unknown URI to none", () => {
    for (const prefix of templatePrefixes) {
      assert.isTrue(Option.isNone(templateName(`${prefix}CC2_match.xml`)));
      assert.isTrue(Option.isNone(templateName(`${prefix}CC2_match_basic.xml`)));
      assert.isTrue(Option.isNone(templateName(`${prefix}match_correct.json`)));
    }
    assert.isTrue(Option.isNone(templateName("https://example.com/rptemplates/match_correct.xml")));
    assert.isTrue(Option.isNone(templateName("match_correct")));
    assert.isTrue(Option.isNone(templateName("")));
  });

  it("[I-9b] resolves a built-in padded with XML whitespace to its name, as xs:anyURI collapses it", () => {
    for (const name of templateNames) {
      for (const prefix of templatePrefixes) {
        for (const padding of [" ", "\n\t"]) {
          assert.deepStrictEqual(
            templateName(`${padding}${prefix}${name}${padding}`),
            Option.some(name),
          );
        }
      }
    }
  });

  it("[I-9b] resolves a URI with whitespace inside its name to none", () => {
    for (const prefix of templatePrefixes) {
      assert.isTrue(Option.isNone(templateName(`${prefix}match_ correct`)));
      assert.isTrue(Option.isNone(templateName(`${prefix}match_\ncorrect`)));
    }
  });
});

describe("the closed value sets", () => {
  it("has exactly the eleven base types and the four cardinalities", () => {
    assert.sameMembers(
      [...baseTypes],
      [
        "identifier",
        "boolean",
        "integer",
        "float",
        "string",
        "point",
        "pair",
        "directedPair",
        "duration",
        "file",
        "uri",
      ],
    );
    assertDistinct(baseTypes);
    assert.sameMembers([...cardinalities], ["single", "multiple", "ordered", "record"]);
    assertDistinct(cardinalities);
  });

  it("holds exactly the members spec §4.5 names, each once", () => {
    const lists: readonly (readonly [string, readonly string[], readonly string[]])[] = [
      [
        "interactionNames",
        interactionNames,
        ["qti-choice-interaction", "qti-text-entry-interaction", "qti-extended-text-interaction"],
      ],
      [
        "engine",
        renders.engine,
        [
          "qti-response-condition",
          "qti-response-if",
          "qti-response-else-if",
          "qti-response-else",
          "qti-set-outcome-value",
          "qti-match",
          "qti-variable",
          "qti-correct",
          "qti-base-value",
          "qti-is-null",
          "qti-map-response",
        ],
      ],
      [
        "elements",
        renders.elements,
        [
          "qti-assessment-item",
          "qti-response-declaration",
          "qti-outcome-declaration",
          "qti-correct-response",
          "qti-default-value",
          "qti-value",
          "qti-mapping",
          "qti-map-entry",
          "qti-item-body",
          "qti-response-processing",
          "qti-choice-interaction",
          "qti-text-entry-interaction",
          "qti-extended-text-interaction",
          "qti-prompt",
          "qti-simple-choice",
          ...renders.engine,
        ],
      ],
      [
        "notices",
        renders.notices.map((notice) => notice.feature),
        [
          "pattern-mask",
          'format="xhtml"',
          'cardinality="record"',
          'cardinality="multiple"',
          'cardinality="ordered"',
        ],
      ],
      [
        "marks",
        renders.marks.map((mark) => mark.feature),
        [
          'shuffle="true"',
          "string-identifier",
          'adaptive="true"',
          "qti-template-declaration",
          'base-type="point"',
          'base-type="duration"',
          'base-type="file"',
          'cardinality="record"',
          'base-type=""',
          "xml:base",
          "data-catalog-idref",
          "data-qti-suppress-tts",
          "data-ssml",
          "map_response_point",
        ],
      ],
      [
        "messageAttributes",
        messageAttributes,
        ["data-max-selections-message", "data-min-selections-message", "data-patternmask-message"],
      ],
      [
        "templatePrefixes",
        templatePrefixes,
        [
          "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/",
          "https://www.imsglobal.org/question/qti_v3p0/rptemplates/",
        ],
      ],
      ["templateNames", templateNames, ["match_correct", "map_response", "map_response_point"]],
    ];
    for (const [name, actual, expected] of lists) {
      assertDistinct(actual);
      assert.sameMembers([...actual], [...expected], name);
    }
  });

  it("binds each rendered interaction to base types and cardinalities from the closed sets", () => {
    assert.sameMembers(Object.keys(renders.bindings), [...interactionNames]);
    for (const binding of Object.values(renders.bindings)) {
      assertDistinct(binding.baseTypes);
      assertDistinct(binding.cardinalities);
      assert.includeMembers([...baseTypes], [...binding.baseTypes]);
      assert.includeMembers([...cardinalities], [...binding.cardinalities]);
    }
    assert.sameMembers([...renders.bindings["qti-choice-interaction"].baseTypes], ["identifier"]);
    assert.sameMembers(
      [...renders.bindings["qti-choice-interaction"].cardinalities],
      ["single", "multiple"],
    );
    for (const name of ["qti-text-entry-interaction", "qti-extended-text-interaction"] as const) {
      assert.sameMembers([...renders.bindings[name].baseTypes], ["string", "integer", "float"]);
      assert.sameMembers([...renders.bindings[name].cardinalities], ["single"]);
    }
    assert.sameMembers(
      [...renders.bindings["qti-extended-text-interaction"].formats],
      ["plain", "preformatted"],
    );
  });

  it("puts every notice on a rendered interaction", () => {
    for (const notice of renders.notices) {
      assert.includeMembers([...interactionNames], [...notice.on], notice.feature);
    }
  });

  it("has every engine name in elements", () => {
    assert.includeMembers([...renders.elements], [...renders.engine]);
  });
});
