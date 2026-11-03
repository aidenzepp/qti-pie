import { assert, describe, it } from "@effect/vitest";
import {
  ImportRefused,
  isMappedLaw,
  patternRuleSources,
  ruleOfError,
  ruleOfLaw,
} from "#qti/import/refusal.ts";
import type { ImportLaw } from "#qti/import/refusal.ts";
import * as patterns from "#qti/schema/patterns.ts";

it("sends a contract no row names to value-lexical, unmapped", () => {
  const law: ImportLaw = { contract: "NoSuchContract", kind: "contract" };

  assert.strictEqual(ruleOfLaw(law), "value-lexical");
  assert.isFalse(isMappedLaw(law));
});

it("passes an ImportRefused through ruleOfError as itself", () => {
  const refused = new ImportRefused({
    detail: "the max-choices attribute of qti-choice-interaction is not a non-negative integer",
    rule: "attribute-lexical",
  });

  assert.strictEqual(ruleOfError(refused), refused);
});

/**
 * A synthetic containment law between two sides, by relation and fields.
 */
const contained = (
  from: string,
  fromFields: readonly string[],
  to: string,
  toFields: readonly string[],
  selection: readonly { readonly field: string; readonly value: string }[] = [],
): ImportLaw => ({
  from: { fields: fromFields, relation: from, selection: [] },
  kind: "contained",
  to: { fields: toFields, relation: to, selection },
});

/**
 * A synthetic capacity law of `target` by `from`, the target selected on `selection`.
 */
const capacity = (
  target: string,
  targetFields: readonly string[],
  from: string,
  fromFields: readonly string[],
  selection: readonly { readonly field: string; readonly value: string }[] = [],
): ImportLaw => ({
  from: { fields: fromFields, relation: from, selection: [] },
  kind: "capacity",
  target: { fields: targetFields, relation: target, selection },
});

const check = (relation: string, name: string): ImportLaw => ({ kind: "check", name, relation });

/**
 * Assert a law is recognized and refused under `rule`.
 */
const assertMapped = (law: ImportLaw, rule: string): void => {
  assert.strictEqual(ruleOfLaw(law), rule);
  assert.isTrue(isMappedLaw(law));
};

describe("the rules of the canonical wave's new laws", () => {
  it("keys AttributeSpelling attribute-lexical, as AttributeLexical is", () => {
    const spelling: ImportLaw = {
      fields: ["node", "attribute"],
      kind: "key",
      relation: "AttributeSpelling",
    };

    assertMapped(spelling, "attribute-lexical");
    assert.strictEqual(
      ruleOfLaw(spelling),
      ruleOfLaw({ ...spelling, relation: "AttributeLexical" }),
    );
  });

  it("gives AttributeSpelling's containments the rules AttributeLexical's get", () => {
    const pairs = [
      [["node", "kind"], "Node", ["id", "kind"]],
      [["kind", "attribute"], "AttributeAdmission", ["kind", "attribute"]],
    ] as const;

    for (const [fields, to, toFields] of pairs) {
      const lexical = contained("AttributeLexical", fields, to, toFields);
      const spelling = contained("AttributeSpelling", fields, to, toFields);

      assertMapped(spelling, ruleOfLaw(lexical));
      assert.isTrue(isMappedLaw(lexical));
      assert.strictEqual(ruleOfLaw(spelling), "attribute-admission");
    }
  });

  it("names the four Order*ChoicesN containments typed-copy", () => {
    const pairs = [
      ["OrderMinChoicesN", "OrderInteraction", "minChoicesN"],
      ["OrderMaxChoicesN", "OrderInteraction", "maxChoicesN"],
      ["GraphicOrderMinChoicesN", "GraphicOrderInteraction", "minChoicesN"],
      ["GraphicOrderMaxChoicesN", "GraphicOrderInteraction", "maxChoicesN"],
    ] as const;

    for (const [from, to, column] of pairs) {
      assertMapped(contained(from, ["node", "value"], to, ["id", column]), "typed-copy");
    }
  });

  it("names the two minimum-choices checks attribute-lexical", () => {
    assertMapped(check("OrderMinChoicesN", "OrderMinChoicesPositive"), "attribute-lexical");
    assertMapped(
      check("GraphicOrderMinChoicesN", "GraphicOrderMinChoicesPositive"),
      "attribute-lexical",
    );
  });

  const arms = [
    ["EqualRoundedFiguresRef", "EqualRounded", "figuresKind"],
    ["RoundToFiguresRef", "RoundTo", "figuresKind"],
    ["IndexNRef", "Index", "nKind"],
    ["RepeatNumberRepeatsRef", "Repeat", "numberRepeatsKind"],
  ] as const;

  it("names each *Ref arm's containment P32", () => {
    for (const [arm, parent, kind] of arms) {
      assertMapped(
        contained(arm, ["node"], parent, ["id"], [{ field: kind, value: "ref" }]),
        "P32",
      );
    }
  });

  it("names each *Ref arm's capacity P32", () => {
    for (const [arm, parent, kind] of arms) {
      assertMapped(capacity(parent, ["id"], arm, ["node"], [{ field: kind, value: "ref" }]), "P32");
    }
  });

  it("names each *RefZero check P32", () => {
    assertMapped(check("EqualRounded", "EqualRoundedFiguresRefZero"), "P32");
    assertMapped(check("RoundTo", "RoundToFiguresRefZero"), "P32");
    assertMapped(check("Index", "IndexNRefZero"), "P32");
    assertMapped(check("Repeat", "RepeatNumberRepeatsRefZero"), "P32");
  });

  it("names ManifestSchemaVersion's two new containments typed-copy", () => {
    assertMapped(
      contained("ManifestSchemaVersion", ["metadata", "package"], "ManifestMetadata", [
        "id",
        "manifest",
      ]),
      "typed-copy",
    );
    assertMapped(
      contained("ManifestSchemaVersion", ["package", "version"], "Package", [
        "id",
        "schemaversion",
      ]),
      "typed-copy",
    );
  });

  it("keeps a resource's own schemaversion containment schema-version", () => {
    assertMapped(
      contained("Resource", ["package", "schemaversion"], "Package", ["id", "schemaversion"]),
      "schema-version",
    );
  });
});

/**
 * A synthetic pattern law over one regex source.
 */
const pattern = (source: string): ImportLaw => ({ flags: "u", kind: "pattern", source });

describe("the rules of a pattern", () => {
  const sources = new Set<string>(
    Object.entries(patterns)
      .filter(([name]) => !name.endsWith("Flags"))
      .map(([, source]) => source),
  );

  it("keeps a row only for a source the schema still exports", () => {
    assert.isAbove(patternRuleSources.length, 0);
    for (const source of patternRuleSources) {
      assert.isTrue(sources.has(source), source);
    }
  });

  it("keeps the DRD and rubric-use rows", () => {
    const drd = [
      patterns.drdAccessMode,
      patterns.drdAdaptationDetail,
      patterns.drdAdaptationMediaType,
      patterns.drdAdaptationType,
      patterns.drdApiInteroperable,
      patterns.drdControlFlexibility,
      patterns.drdDisplayTransformability,
      patterns.drdEducationalComplexityOfAdaptation,
      patterns.drdHazard,
    ];

    for (const source of drd) {
      assertMapped(pattern(source), "drd-value");
    }
    assertMapped(pattern(patterns.useEnumExt), "attribute-lexical");
    assertMapped(pattern(patterns.viewList), "attribute-lexical");
    assertMapped(pattern(patterns.ariaRelevantList), "attribute-lexical");
  });
});
