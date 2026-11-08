import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Schema } from "effect";
import { Refusal, refusalRules } from "#plate/validate/refusal.ts";

/**
 * One refusal for each location kind, each paired with a rule that produces that kind.
 */
const cases = () => [
  new Refusal({
    detail: { element: "qti-choice-interation" },
    document: "items/BG007.xml",
    location: { kind: "path", path: "qti-assessment-item/qti-item-body/qti-choice-interation" },
    readerRule: Option.none(),
    rule: "unknown-element",
    suggestion: Option.some("qti-choice-interaction"),
  }),
  new Refusal({
    detail: { found: "<" },
    document: "items/BG010.xml",
    location: { column: 14, kind: "position", line: 3 },
    readerRule: Option.none(),
    rule: "not-well-formed",
    suggestion: Option.none(),
  }),
  new Refusal({
    detail: { entity: "loop" },
    document: "items/BG011.xml",
    location: { kind: "document" },
    readerRule: Option.some("entity-cycle"),
    rule: "reader-refused",
    suggestion: Option.none(),
  }),
];

/**
 * An encoded refusal for each rule the readings, the queued follow-ups, the count ruling, M2's test
 * and package stages and align-54 add, written as a caller would send it rather than built through
 * the class, so decoding is what checks the rule against the roster.
 */
const addedRules = [
  // Reading 38 ("a `qti-gap` appears only within a gap-match interaction"), cited by its number as
  // every producer writes it.
  {
    detail: { element: "qti-gap", reading: "38" },
    path: "qti-assessment-item/qti-item-body/p/qti-gap",
    rule: "misplaced-element",
  },
  {
    detail: {
      child: "qti-value",
      element: "qti-default-value",
      required: "exactly one",
      source: "info.txt:73049",
    },
    path: "qti-assessment-item/qti-response-declaration/qti-default-value",
    rule: "child-count",
  },
  {
    detail: { identifier: "SCORE2" },
    path: "qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-variable/@identifier",
    rule: "undeclared-variable",
  },
  {
    detail: { identifier: "SCORE" },
    path: "qti-assessment-item/qti-response-processing/qti-set-outcome-value",
    rule: "expression-type",
  },
  {
    detail: {
      attribute: "max-choices",
      greatest: "9223372036854775807",
      lexical: "9223372036854775808",
    },
    path: "qti-assessment-item/qti-item-body/qti-choice-interaction/@max-choices",
    rule: "count-range",
  },
  {
    detail: { context: "qti-pre-condition", element: "qti-number-correct", reading: "23" },
    path: "qti-assessment-test/qti-test-part/qti-pre-condition/qti-number-correct",
    rule: "expression-placement",
  },
  {
    detail: { element: "manifest", namespace: "http://www.imsglobal.org/xsd/imscp_v1p1" },
    path: "manifest",
    rule: "not-qti3-package",
  },
  {
    detail: { schemaversion: "1.2" },
    path: "manifest/metadata/schemaversion",
    rule: "package-profile",
  },
  { detail: {}, path: "imsmanifest.xml", rule: "package-manifest-missing" },
  { detail: { path: "../outside.xml" }, path: "../outside.xml", rule: "package-path-outside" },
  { detail: { path: "notes.txt" }, path: "notes.txt", rule: "package-file-unlisted" },
  {
    detail: { path: "items/missing.xml", resource: "ITEM-1" },
    path: "manifest/resources/resource/file/@href",
    rule: "package-file-missing",
  },
  {
    detail: { dependency: "RES-9", resource: "ITEM-1" },
    path: "manifest/resources/resource/dependency/@identifierref",
    rule: "dependency-unresolved",
  },
  {
    detail: { href: "items/q1.xml", identifier: "q1", path: "items/q1.xml" },
    path: "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref/@href",
    rule: "item-ref-unresolved",
  },
  {
    detail: {
      firstPrefix: "a.b",
      firstVariable: "SCORE",
      reading: "48",
      reference: "a.b.SCORE",
      secondPrefix: "a",
      secondVariable: "b.SCORE",
    },
    path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-variable/@identifier",
    rule: "ambiguous-reference",
  },
  {
    detail: {
      path: "passages/night.xml",
      root: "qti-assessment-stimulus",
      type: "imsqti_item_xmlv3p0",
    },
    path: "manifest/resources/resource/@type",
    rule: "resource-type-mismatch",
  },
  {
    detail: {
      identifier: "choice",
      metadata: "qti_v2_item_01",
      path: "choice.xml",
      reading: "62",
      resource: "choice",
    },
    path: "manifest/resources/resource/metadata/{http://ltsc.ieee.org/xsd/LOM}lom/{http://ltsc.ieee.org/xsd/LOM}general/{http://ltsc.ieee.org/xsd/LOM}identifier",
    rule: "lom-identifier",
  },
  {
    detail: {
      metadata: "Metadata Example Item #1",
      others: "1",
      path: "choice.xml",
      reading: "62",
      resource: "choice",
      title: "Unattended Luggage",
    },
    path: "manifest/resources/resource/metadata/{http://ltsc.ieee.org/xsd/LOM}lom/{http://ltsc.ieee.org/xsd/LOM}general/{http://ltsc.ieee.org/xsd/LOM}title",
    rule: "lom-title",
  },
  {
    detail: {
      chain: "tests/test.xml sections/a.xml sections/b.xml sections/a.xml",
      href: "../sections/a.xml",
      identifier: "toA",
      reading: "85",
    },
    path: "qti-assessment-section/qti-assessment-section-ref",
    rule: "inclusion-cycle",
  },
  {
    detail: { reading: "87", reason: "backward", target: "Q1" },
    path: "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref[2]/qti-branch-rule/@target",
    rule: "branch-target",
  },
  {
    detail: { document: "items/q1.xml", language: "fr", listed: "en", reading: "134" },
    path: "manifest/resources/resource/metadata/{http://ltsc.ieee.org/xsd/LOM}lom/{http://ltsc.ieee.org/xsd/LOM}general",
    rule: "document-lang",
  },
  {
    detail: { reading: "122", value: "exam" },
    path: "manifest/resources/resource/metadata/{http://ltsc.ieee.org/xsd/LOM}lom/{http://ltsc.ieee.org/xsd/LOM}educational/{http://ltsc.ieee.org/xsd/LOM}learningResourceType",
    rule: "lom-learning-resource-type",
  },
] as const;

describe("refusalRules", () => {
  it("lists the validator's, the verdict's and the reader's nineteen rules, M2's thirteen, then align-54's four, 36 in all", () => {
    assert.deepStrictEqual(
      [...refusalRules],
      [
        "unknown-element",
        "unknown-attribute",
        "missing-attribute",
        "attribute-type",
        "padded-attribute",
        "text-not-allowed",
        "misplaced-element",
        "child-count",
        "undeclared-response",
        "duplicate-identifier",
        "binding",
        "template-requirements",
        "value-type",
        "undeclared-variable",
        "expression-type",
        "count-range",
        "not-qti-root",
        "not-well-formed",
        "reader-refused",
        "expression-placement",
        "not-qti3-package",
        "package-profile",
        "package-manifest-missing",
        "package-path-outside",
        "package-file-unlisted",
        "package-file-missing",
        "dependency-unresolved",
        "item-ref-unresolved",
        "ambiguous-reference",
        "resource-type-mismatch",
        "lom-identifier",
        "lom-title",
        "inclusion-cycle",
        "branch-target",
        "document-lang",
        "lom-learning-resource-type",
      ],
    );
    assert.strictEqual(refusalRules.length, 36);
  });

  it("holds no rule twice", () => {
    assert.strictEqual(new Set(refusalRules).size, refusalRules.length);
  });
});

describe("Refusal", () => {
  it.effect("round-trips through its Schema with each location kind", () =>
    Effect.gen(function* roundTrip() {
      const refusals = cases();
      assert.deepStrictEqual(
        refusals.map((refusal) => refusal.location.kind),
        ["path", "position", "document"],
      );
      for (const refusal of refusals) {
        const encoded = yield* Schema.encodeEffect(Refusal)(refusal);
        const decoded = yield* Schema.decodeUnknownEffect(Refusal)(encoded);
        assert.instanceOf(decoded, Refusal);
        assert.deepStrictEqual(decoded, refusal);
      }
    }),
  );

  it.effect("fails to decode a rule outside refusalRules", () =>
    Effect.gen(function* outsideRule() {
      const [refusal] = cases();
      assert.isDefined(refusal);

      const encoded = yield* Schema.encodeEffect(Refusal)(refusal);
      const decode = Schema.decodeUnknownEffect(Refusal);
      const accepted = yield* decode(encoded);
      assert.strictEqual(accepted.rule, "unknown-element");

      const error = yield* Effect.flip(decode({ ...encoded, rule: "unknown-rule" }));
      assert.strictEqual(error._tag, "SchemaError");
    }),
  );

  it.effect.each(addedRules)("decodes a refusal with the rule $rule", ({ detail, path, rule }) =>
    Effect.gen(function* addedRule() {
      const decoded = yield* Schema.decodeUnknownEffect(Refusal)({
        _tag: "Refusal",
        detail,
        document: "items/added.xml",
        location: { kind: "path", path },
        readerRule: Option.none(),
        rule,
        suggestion: Option.none(),
      });
      assert.instanceOf(decoded, Refusal);
      assert.strictEqual(decoded.rule, rule);
      assert.deepStrictEqual(decoded.detail, detail);
    }),
  );
});
