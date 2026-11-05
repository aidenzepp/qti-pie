import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";
import {
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
  areaShapes,
  baseTypes,
  behaviourClasses,
  cardinalities,
  interactionNames,
  messageAttributes,
  renders,
  styledClasses,
  templateName,
  templateNames,
  templatePrefixes,
} from "#plate/vocabulary.ts";
import type { ClassOwner } from "#plate/vocabulary.ts";

/**
 * Assert that a list holds each of its members once.
 *
 * @param list The list under test.
 */
const assertDistinct = (list: readonly string[]): void => {
  assert.strictEqual(new Set(list).size, list.length, `duplicates in ${list.join(", ")}`);
};

/**
 * The spaces inside the shorter URI the growth check reads, before it reads one with
 * {@link growthFactor} times as many: a run a backtracking trim of the outer whitespace scans from
 * each of its positions.
 */
const fewerSpaces = 4000;

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

  it.effect("[I-9b] reads 8 times the spaces inside a URI in under 32 times the time", () =>
    Effect.gen(function* readsInLinearTime() {
      const fewer = `a${" ".repeat(fewerSpaces)}b`;
      const more = `a${" ".repeat(fewerSpaces * growthFactor)}b`;
      assert.isTrue(Option.isNone(templateName(more)));

      const growth = yield* growthRatio(
        () => {
          templateName(fewer);
        },
        () => {
          templateName(more);
        },
      );
      assert.isBelow(
        growth,
        growthLimit,
        `8 times the spaces took ${growth.toFixed(1)} times as long`,
      );
    }),
  );
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

  it("has exactly the five shapes of a qti-area-map-entry", () => {
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
    assert.sameMembers([...areaShapes], ["circle", "default", "ellipse", "poly", "rect"]);
    // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
    assertDistinct(areaShapes);
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
          "qti-area-mapping",
          "qti-area-map-entry",
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

describe("the vocabulary class inventory", () => {
  const owners: readonly ClassOwner[] = [
    "choice-interaction",
    "text-entry-interaction",
    "extended-text-interaction",
    "body",
  ];
  const interactionOwners: readonly ClassOwner[] = [
    "choice-interaction",
    "text-entry-interaction",
    "extended-text-interaction",
  ];
  const writingClasses = [
    "qti-writing-orientation-vertical-rl",
    "qti-writing-orientation-vertical-lr",
  ] as const;

  it("[I-19] is closed: each owner holds a class once, every class is qti-*, styled is never behaviour", () => {
    assert.sameMembers(Object.keys(styledClasses), [...owners]);
    assert.sameMembers(Object.keys(behaviourClasses), [...owners]);
    for (const owner of owners) {
      const classes = [...styledClasses[owner], ...behaviourClasses[owner]];
      assertDistinct(classes);
      for (const name of classes) {
        assert.match(name, /^qti-[a-z0-9-]+$/u, owner);
      }
    }
    const styled = new Set(owners.flatMap((owner) => styledClasses[owner]));
    const behaviour = owners.flatMap((owner) => behaviourClasses[owner]);
    assert.deepStrictEqual(
      behaviour.filter((name) => styled.has(name)),
      [],
    );
  });

  it("[I-19] gives the three interactions exactly the summary table's classes and the sections' three", () => {
    // `vocab.txt:4026-4110`, the summary table (35 classes), then `:4325-5220`, the sections (3).
    const summaryTable = [
      "qti-choices-stacking-1",
      "qti-choices-stacking-2",
      "qti-choices-stacking-3",
      "qti-choices-stacking-4",
      "qti-choices-stacking-5",
      "qti-counter-down",
      "qti-counter-up",
      "qti-height-lines-15",
      "qti-height-lines-3",
      "qti-height-lines-6",
      "qti-input-control-hidden",
      "qti-input-width-1",
      "qti-input-width-10",
      "qti-input-width-15",
      "qti-input-width-2",
      "qti-input-width-20",
      "qti-input-width-25",
      "qti-input-width-3",
      "qti-input-width-30",
      "qti-input-width-35",
      "qti-input-width-4",
      "qti-input-width-40",
      "qti-input-width-45",
      "qti-input-width-50",
      "qti-input-width-6",
      "qti-input-width-72",
      "qti-labels-decimal",
      "qti-labels-lower-alpha",
      "qti-labels-none",
      "qti-labels-suffix-none",
      "qti-labels-suffix-parenthesis",
      "qti-labels-suffix-period",
      "qti-labels-upper-alpha",
      "qti-orientation-horizontal",
      "qti-orientation-vertical",
    ];
    const sections = [
      "qti-labels-cjk-ideographic",
      "qti-writing-orientation-vertical-lr",
      "qti-writing-orientation-vertical-rl",
    ];
    const held = new Set(
      interactionOwners.flatMap((owner) => [...styledClasses[owner], ...behaviourClasses[owner]]),
    );
    assert.deepStrictEqual([...held].toSorted(), [...summaryTable, ...sections].toSorted());
    for (const owner of interactionOwners) {
      assert.includeMembers([...styledClasses[owner]], [...writingClasses], owner);
    }
  });

  it("[I-19] styles the six body utility classes and nothing else on the body", () => {
    assert.sameMembers(
      [...styledClasses.body],
      [
        "qti-hidden",
        "qti-visually-hidden",
        "qti-underline",
        "qti-italic",
        "qti-bordered",
        "qti-well",
      ],
    );
    assert.deepStrictEqual([...behaviourClasses.body], []);
  });
});
