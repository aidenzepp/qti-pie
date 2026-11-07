import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { landedKinds } from "#plate/model/expressions/read.ts";
import { packageTables } from "#plate/package/tables.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";
import { tables } from "#plate/validate/tables.ts";
import {
  answeredStatuses,
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
  areaShapes,
  baseTypes,
  behaviourClasses,
  cardinalities,
  cpVersions,
  interactionNames,
  manifestNamespace,
  messageAttributes,
  navigationModes,
  renders,
  resourceRoots,
  resourceTypes,
  sessionControlDefaults,
  sessionStatuses,
  styledClasses,
  submissionModes,
  templateName,
  templateNames,
  templatePrefixes,
  testMarks,
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
  it("resolves all four spellings of each built-in to its name", () => {
    for (const name of templateNames) {
      for (const prefix of templatePrefixes) {
        for (const suffix of ["", ".xml"]) {
          assert.deepStrictEqual(templateName(`${prefix}${name}${suffix}`), Option.some(name));
        }
      }
    }
  });

  it("resolves the three CC2 templates to their names under either prefix", () => {
    for (const prefix of templatePrefixes) {
      for (const name of ["CC2_match", "CC2_match_basic", "CC2_map_response"] as const) {
        assert.deepStrictEqual(templateName(`${prefix}${name}.xml`), Option.some(name));
        assert.deepStrictEqual(templateName(`${prefix}${name}`), Option.some(name));
      }
    }
  });

  it("resolves an unknown URI to none", () => {
    for (const prefix of templatePrefixes) {
      assert.isTrue(Option.isNone(templateName(`${prefix}CC2_other.xml`)));
      assert.isTrue(Option.isNone(templateName(`${prefix}cc2_match.xml`)));
      assert.isTrue(Option.isNone(templateName(`${prefix}match_correct.json`)));
    }
    assert.isTrue(Option.isNone(templateName("https://example.com/rptemplates/match_correct.xml")));
    assert.isTrue(Option.isNone(templateName("match_correct")));
    assert.isTrue(Option.isNone(templateName("")));
  });

  it("resolves a built-in padded with XML whitespace to its name, as xs:anyURI collapses it", () => {
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

  it("resolves a URI with whitespace inside its name to none", () => {
    for (const prefix of templatePrefixes) {
      assert.isTrue(Option.isNone(templateName(`${prefix}match_ correct`)));
      assert.isTrue(Option.isNone(templateName(`${prefix}match_\ncorrect`)));
    }
  });

  it.effect("reads 8 times the spaces inside a URI in under 32 times the time", () =>
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
        [
          "qti-choice-interaction",
          "qti-text-entry-interaction",
          "qti-extended-text-interaction",
          "qti-inline-choice-interaction",
        ],
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
          "qti-lookup-outcome-value",
          "qti-exit-response",
          "qti-response-processing-fragment",
        ],
      ],
      [
        "templateRules",
        renders.templateRules,
        [
          "qti-set-template-value",
          "qti-set-correct-response",
          "qti-set-default-value",
          "qti-template-condition",
          "qti-template-if",
          "qti-template-else-if",
          "qti-template-else",
          "qti-template-constraint",
          "qti-exit-template",
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
          "qti-match-table",
          "qti-match-table-entry",
          "qti-interpolation-table",
          "qti-interpolation-table-entry",
          "qti-item-body",
          "qti-response-processing",
          "qti-choice-interaction",
          "qti-text-entry-interaction",
          "qti-extended-text-interaction",
          "qti-inline-choice-interaction",
          "qti-prompt",
          "qti-simple-choice",
          "qti-inline-choice",
          "qti-label",
          "qti-printed-variable",
          "qti-template-block",
          "qti-content-body",
          "qti-template-inline",
          ...renders.engine,
          "qti-template-declaration",
          "qti-template-processing",
          ...renders.templateRules,
        ],
      ],
      [
        "notices",
        renders.notices.map((notice) => notice.feature),
        ["pattern-mask", 'cardinality="record"', "qti-inline-choice-interaction"],
      ],
      [
        "controlNotices",
        renders.controlNotices.map((notice) => notice.feature),
        ["min-strings>100"],
      ],
      [
        "marks",
        renders.marks.map((mark) => mark.feature),
        [
          "string-identifier",
          'adaptive="true"',
          'base-type="file"',
          'cardinality="record"',
          'base-type=""',
          "xml:base",
          "data-catalog-idref",
          "data-qti-suppress-tts",
          "data-ssml",
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
      [
        "templateNames",
        templateNames,
        [
          "match_correct",
          "map_response",
          "map_response_point",
          "CC2_match",
          "CC2_match_basic",
          "CC2_map_response",
        ],
      ],
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
    }
    assert.sameMembers(
      [...renders.bindings["qti-text-entry-interaction"].cardinalities],
      ["single"],
    );
    assert.sameMembers(
      [...renders.bindings["qti-extended-text-interaction"].cardinalities],
      ["single", "multiple", "ordered"],
    );
    assert.sameMembers(
      [...renders.bindings["qti-extended-text-interaction"].formats],
      ["plain", "preformatted", "xhtml"],
    );
    assert.sameMembers(
      [...renders.bindings["qti-inline-choice-interaction"].baseTypes],
      ["identifier"],
    );
    assert.sameMembers(
      [...renders.bindings["qti-inline-choice-interaction"].cardinalities],
      ["single"],
    );
  });

  it("[Q-12] shows an Inline Choice as its notice unless its choices hold only text and the seventeen text-safe elements", () => {
    const inlineChoice = renders.notices.filter(
      (notice) => notice.feature === "qti-inline-choice-interaction",
    );

    assert.deepStrictEqual(
      inlineChoice.map((notice) => notice.on),
      [["qti-inline-choice-interaction"]],
    );

    const [rule] = inlineChoice;
    const elements = rule?.when.kind === "not-text-safe" ? rule.when.elements : [];

    assertDistinct(elements);
    assert.sameMembers(
      [...elements],
      [
        "span",
        "em",
        "strong",
        "b",
        "i",
        "code",
        "kbd",
        "samp",
        "var",
        "small",
        "big",
        "tt",
        "cite",
        "dfn",
        "abbr",
        "acronym",
        "bdi",
      ],
    );
  });

  it("shows pattern-mask as a notice only for a pattern the translator refuses", () => {
    const patternMask = renders.notices.filter((notice) => notice.feature === "pattern-mask");

    assert.deepStrictEqual(
      patternMask.map((notice) => notice.when),
      [{ kind: "refused-pattern", name: "pattern-mask" }],
    );
  });

  it("shows min-strings>100 in place of an Extended Text's Controls when min-strings exceeds 100, whatever max-strings says", () => {
    assert.deepStrictEqual(renders.controlNotices, [
      {
        feature: "min-strings>100",
        on: ["qti-extended-text-interaction"],
        when: { kind: "integer-above", limit: 100n, name: "min-strings" },
      },
    ]);
  });

  it("puts every notice on a rendered interaction", () => {
    for (const notice of [...renders.notices, ...renders.controlNotices]) {
      assert.includeMembers([...interactionNames], [...notice.on], notice.feature);
    }
  });

  it("has every engine name in elements", () => {
    assert.includeMembers([...renders.elements], [...renders.engine]);
  });

  it("[I-5] has every template rule in elements, and marks no template declaration as such", () => {
    assert.includeMembers([...renders.elements], [...renders.templateRules]);
    assert.notInclude(
      renders.marks.map((mark) => mark.feature),
      "qti-template-declaration",
    );
  });

  it("[I-5] lists the template rules once each, every one an element the XSD declares", () => {
    assertDistinct(renders.templateRules);
    for (const name of renders.templateRules) {
      assert.isTrue(Object.hasOwn(tables.elements, name), name);
    }
  });

  it("[I-5] lists exactly the elements the XSD admits in qti-template-processing and in a template condition", () => {
    const admitted = ["qti-template-processing", "qti-template-condition"].flatMap((parent) =>
      (tables.elements[parent]?.children ?? []).map((child) => child.local),
    );

    assert.sameMembers([...renders.templateRules], [...new Set(admitted)]);
  });

  it("reads, with the registry's landed kinds, every response-processing element the engine read before the registry", () => {
    assert.includeMembers(
      [...renders.elements, ...landedKinds.map((kind) => `qti-${kind}`)],
      [
        ...renders.engine,
        "qti-match",
        "qti-variable",
        "qti-correct",
        "qti-base-value",
        "qti-is-null",
        "qti-map-response",
        "qti-map-response-point",
        "qti-equal",
      ],
    );
  });
});

describe("the vocabulary class inventory", () => {
  const owners: readonly ClassOwner[] = [
    "choice-interaction",
    "text-entry-interaction",
    "extended-text-interaction",
    "inline-choice-interaction",
    "body",
  ];
  const interactionOwners: readonly ClassOwner[] = [
    "choice-interaction",
    "text-entry-interaction",
    "extended-text-interaction",
    "inline-choice-interaction",
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

  it("[I-19] [Q-12] gives the four interactions exactly the summary table's classes and the sections' three", () => {
    // `vocab.txt:4026-4141`, the summary table (35 classes; Inline Choice's widths are Text Entry's),
    // then `:4325-5822`, the sections (3).
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

  it("[I-19] [Q-12] gives Inline Choice the fifteen widths and both writing classes, and no behaviour class", () => {
    // `vocab.txt:4110-4141`, the summary table's Inline Choice row; `:5818`, section 1.2.7.3.
    assert.deepStrictEqual(
      [...styledClasses["inline-choice-interaction"]],
      [
        ...[1, 2, 3, 4, 6, 10, 15, 20, 25, 30, 35, 40, 45, 50, 72].map(
          (width) => `qti-input-width-${width}`,
        ),
        ...writingClasses,
      ],
    );
    assert.deepStrictEqual([...behaviourClasses["inline-choice-interaction"]], []);
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

describe("M2's closed sets", () => {
  /**
   * The eight QTI resource types both CP profiles list (`imsqtiv3p0_imscpv1p2_v1p0.xsd:397-404`,
   * `imsqtiv3p0p1_imscpv1p2_v1p0.xsd:350-357`).
   */
  const qtiTypes = [
    "imsqti_test_xmlv3p0",
    "imsqti_section_xmlv3p0",
    "imsqti_item_xmlv3p0",
    "imsqti_resprocessing_xmlv3p0",
    "imsqti_outcomes_xmlv3p0",
    "imsqti_stimulus_xmlv3p0",
    "imsqti_fragment_xmlv3p0",
    "imsqti_rptemplate_xmlv3p0",
  ];

  it("has the two navigation modes and the two submission modes", () => {
    assert.deepStrictEqual([...navigationModes], ["linear", "nonlinear"]);
    assert.deepStrictEqual([...submissionModes], ["individual", "simultaneous"]);
  });

  it("names the two CP profile versions, each with its profile's resource types", () => {
    assert.deepStrictEqual([...cpVersions], ["3.0.0", "3.0.1"]);
    assert.sameMembers(Object.keys(resourceTypes), [...cpVersions]);
    assert.sameMembers(
      [...resourceTypes["3.0.0"]],
      [
        ...qtiTypes,
        "associatedcontent/learning-application-resource",
        "webcontent",
        "imsbasiclti_xmlv1p3",
        "controlfile",
        "resourcemetadata/xml",
        "resourceextmetadata/xml",
        "qtiusagedata/xml",
        "pls",
        "css2",
        "css3",
        "extension",
      ],
    );
    assert.sameMembers(
      [...resourceTypes["3.0.1"]],
      [
        ...qtiTypes,
        "associatedcontent/learning-application-resource",
        "webcontent",
        "imslti_xmlv1p1",
        "imsltia_xmlv1p0",
        "controlfile",
        "resourcemetadata/xml",
        "resourceextmetadata/xml",
        "qtiusagedata/xml",
        "pls",
        "css2",
        "css3",
        "extension",
      ],
    );
    for (const version of cpVersions) {
      assertDistinct(resourceTypes[version]);
    }
  });

  it("lists each profile's resource types as the committed package tables' type enumeration does, in order", () => {
    for (const version of cpVersions) {
      const resource = packageTables.get(version)?.get(manifestNamespace)?.elements["resource"];
      const type = resource?.attributes.find((attribute) => attribute.local === "type")?.type;
      assert.strictEqual(type?.kind, "enumeration", version);

      assert.deepStrictEqual(
        [...resourceTypes[version]],
        type?.kind === "enumeration" ? [...type.values] : [],
        version,
      );
    }
  });

  it("lists imslti_xmlv1p1 among the 3.0.1 resource types only", () => {
    assert.notInclude([...resourceTypes["3.0.0"]], "imslti_xmlv1p1");
    assert.include([...resourceTypes["3.0.1"]], "imslti_xmlv1p1");
  });

  it("pairs seven QTI resource types with the root their document has, and imsqti_fragment_xmlv3p0 with none", () => {
    assert.strictEqual(resourceRoots.length, 7);
    assert.sameDeepMembers(
      resourceRoots.map(([type, root]) => [type, root]),
      [
        ["imsqti_item_xmlv3p0", "qti-assessment-item"],
        ["imsqti_test_xmlv3p0", "qti-assessment-test"],
        ["imsqti_section_xmlv3p0", "qti-assessment-section"],
        ["imsqti_stimulus_xmlv3p0", "qti-assessment-stimulus"],
        ["imsqti_outcomes_xmlv3p0", "qti-outcome-declaration"],
        ["imsqti_rptemplate_xmlv3p0", "qti-response-processing"],
        ["imsqti_resprocessing_xmlv3p0", "qti-response-processing"],
      ],
    );

    const types = resourceRoots.map(([type]) => type);
    assertDistinct(types);
    assert.notInclude(types, "imsqti_fragment_xmlv3p0");
    for (const version of cpVersions) {
      assert.includeMembers([...resourceTypes[version]], types, version);
    }
  });

  it("gives the six session-control attributes the XSD defaults, and max-attempts none", () => {
    assert.deepStrictEqual(sessionControlDefaults, {
      "allow-comment": false,
      "allow-review": true,
      "allow-skipping": true,
      "show-feedback": false,
      "show-solution": false,
      "validate-responses": false,
    });
    assert.notProperty(sessionControlDefaults, "max-attempts");
  });

  it("has the three session statuses and the four answered statuses", () => {
    assert.deepStrictEqual([...sessionStatuses], ["initial", "pendingSubmission", "final"]);
    assert.deepStrictEqual(
      [...answeredStatuses],
      ["notpresented", "presented", "attempted", "answered"],
    );
  });

  it("keys exactly spec §4.6's marks, adaptive selection and xi:include, each once", () => {
    assertDistinct(testMarks);
    assert.include([...testMarks], "max-attempts:negative");
    assert.notInclude([...testMarks], "resource-type-mismatch");
    assert.sameMembers(
      [...testMarks],
      [
        "qti-selection",
        "qti-adaptive-selection",
        "qti-ordering",
        "qti-time-limits",
        "qti-pre-condition",
        "qti-branch-rule",
        "qti-rubric-block",
        "qti-test-feedback",
        "qti-assessment-section-ref",
        "qti-stylesheet",
        "qti-context-declaration",
        "qti-template-default",
        "xi:include",
        'allow-comment="true"',
        "max-attempts:negative",
        "root:qti-assessment-section",
        "root:qti-assessment-stimulus",
      ],
    );
  });

  it("[T-9] keys neither outcome processing nor a weight nor a variable mapping, which the test model reads", () => {
    const marks: readonly string[] = testMarks;
    for (const read of ["qti-outcome-processing", "qti-variable-mapping", "qti-weight"]) {
      assert.notInclude([...marks], read);
    }
    assert.include([...testMarks], "qti-template-default");
  });
});
