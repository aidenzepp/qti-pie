import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as control from "#pantry/schema/test/control.ts";

const { relations } = control;

/**
 * Each relation of the module with its columns (sorted) and its primary key, in the spec's 4.3 and
 * 4.7.
 */
const declarations = [
  ["Selection", ["id", "section", "select", "withReplacement"], ["id"]],
  ["SelectionBounded", ["section", "select", "withReplacement"], ["section"]],
  ["DeclaredWithReplacement", ["node"], ["node"]],
  ["Ordering", ["id", "shuffle"], ["id"]],
  ["DeclaredOrderingShuffle", ["node"], ["node"]],
  ["AdaptiveSelection", ["id"], ["id"]],
  ["AdaptiveEngineRef", ["href", "id", "identifier"], ["id"]],
  ["AdaptiveSettingsRef", ["href", "id", "identifier"], ["id"]],
  ["UsageDataRef", ["href", "id", "identifier"], ["id"]],
  ["MetadataRef", ["href", "id", "identifier"], ["id"]],
  [
    "ItemSessionControl",
    [
      "allowComment",
      "allowReview",
      "allowSkipping",
      "id",
      "showFeedback",
      "showSolution",
      "validateResponses",
    ],
    ["id"],
  ],
  ["DeclaredAllowComment", ["node"], ["node"]],
  ["DeclaredAllowReview", ["node"], ["node"]],
  ["DeclaredAllowSkipping", ["node"], ["node"]],
  ["DeclaredShowFeedback", ["node"], ["node"]],
  ["DeclaredShowSolution", ["node"], ["node"]],
  ["DeclaredValidateResponses", ["node"], ["node"]],
  ["ItemSessionMaxAttempts", ["node", "value"], ["node"]],
  ["TimeLimits", ["allowLateSubmission", "id"], ["id"]],
  ["DeclaredAllowLateSubmission", ["node"], ["node"]],
  ["TimeLimitMin", ["node", "value"], ["node"]],
  ["TimeLimitMax", ["node", "value"], ["node"]],
] as const;

/**
 * The names the module's relations take in `roles.ts`, beside the nine arms' own.
 */
const added = [
  "DeclaredAllowComment",
  "DeclaredAllowLateSubmission",
  "DeclaredAllowReview",
  "DeclaredAllowSkipping",
  "DeclaredOrderingShuffle",
  "DeclaredShowFeedback",
  "DeclaredShowSolution",
  "DeclaredValidateResponses",
  "DeclaredWithReplacement",
  "ItemSessionMaxAttempts",
  "SelectionBounded",
  "TimeLimitMax",
  "TimeLimitMin",
] as const;

const fieldsOf = (relation: { readonly fields: object }): readonly string[] =>
  Object.keys(relation.fields).toSorted();

describe("the test control relations", () => {
  it("declares 22 relations, each with the columns and primary key of the spec", () => {
    assert.strictEqual(declarations.length, 22);
    assert.deepStrictEqual(
      Object.keys(relations).toSorted(),
      declarations.map(([name]) => name).toSorted(),
    );
    for (const [name, columns, primaryKey] of declarations) {
      const relation = relations[name];
      assert.strictEqual(relation.name, name);
      assert.deepStrictEqual(fieldsOf(relation), columns, name);
      assert.deepStrictEqual([...relation.primaryKey], primaryKey, name);
    }
  });

  it("keeps the nine arms keyed by their kinds", () => {
    assert.deepStrictEqual(Object.keys(control.arms).toSorted(), [
      "qti-adaptive-engine-ref",
      "qti-adaptive-selection",
      "qti-adaptive-settings-ref",
      "qti-item-session-control",
      "qti-metadata-ref",
      "qti-ordering",
      "qti-selection",
      "qti-time-limits",
      "qti-usagedata-ref",
    ]);
    assert.deepStrictEqual(fieldsOf(control.AdaptiveSelection), ["id"]);
  });

  it("types the reference identifiers, hrefs and time limits by contract", () => {
    const typed = [
      [relations.AdaptiveEngineRef.fields.identifier, contracts.AdaptiveRefIdentifier],
      [relations.AdaptiveSettingsRef.fields.identifier, contracts.AdaptiveRefIdentifier],
      [relations.UsageDataRef.fields.identifier, contracts.AdaptiveRefIdentifier],
      [relations.MetadataRef.fields.identifier, contracts.AdaptiveRefIdentifier],
      [relations.AdaptiveEngineRef.fields.href, contracts.AdaptiveRefHref],
      [relations.AdaptiveSettingsRef.fields.href, contracts.AdaptiveRefHref],
      [relations.UsageDataRef.fields.href, contracts.AdaptiveRefHref],
      [relations.MetadataRef.fields.href, contracts.AdaptiveRefHref],
      [relations.TimeLimitMin.fields.value, contracts.TimeLimitSeconds],
      [relations.TimeLimitMax.fields.value, contracts.TimeLimitSeconds],
    ] as const;
    for (const [field, contract] of typed) {
      assert.strictEqual(field.name, contract.name);
    }
  });

  it("holds the boolean columns to the boolean roster", () => {
    const booleans: readonly { readonly roster: unknown }[] = [
      relations.Selection.fields.withReplacement,
      relations.SelectionBounded.fields.withReplacement,
      relations.Ordering.fields.shuffle,
      relations.ItemSessionControl.fields.allowComment,
      relations.ItemSessionControl.fields.allowReview,
      relations.ItemSessionControl.fields.allowSkipping,
      relations.ItemSessionControl.fields.showFeedback,
      relations.ItemSessionControl.fields.showSolution,
      relations.ItemSessionControl.fields.validateResponses,
      relations.TimeLimits.fields.allowLateSubmission,
    ];
    for (const field of booleans) {
      assert.strictEqual(field.roster, rosters.XsBoolean);
    }
  });

  it("holds the integer columns as bigints", () => {
    const integers: readonly { readonly sql: string }[] = [
      relations.Selection.fields.select,
      relations.SelectionBounded.fields.select,
      relations.ItemSessionMaxAttempts.fields.value,
    ];
    for (const field of integers) {
      assert.strictEqual(field.sql, "bigint");
    }
  });

  it("declares the one candidate key a later containment targets, and no other statement", () => {
    assert.deepStrictEqual(
      control.rules.map((rule) => [rule.kind, rule.relation.name, [...rule.fields]]),
      [["key", "Selection", ["section"]]],
    );
  });

  it("gives Author a line for each of the thirteen relations beside the arms", () => {
    for (const name of added) {
      assert.strictEqual(Author.relations[name], relations[name], name);
    }
    assert.strictEqual(added.length, 13);
  });

  it("fills the registry attributes of the nine kinds from the inventory, in its order", () => {
    const registry = new Map(
      Object.entries(test.registry).map(([handle, row]) => [handle, row.attributes]),
    );
    const wanted = {
      "qti-adaptive-engine-ref": ["identifier", "href"],
      "qti-adaptive-selection": [],
      "qti-adaptive-settings-ref": ["identifier", "href"],
      "qti-item-session-control": [
        "max-attempts",
        "show-feedback",
        "allow-review",
        "show-solution",
        "allow-comment",
        "allow-skipping",
        "validate-responses",
      ],
      "qti-metadata-ref": ["identifier", "href"],
      "qti-ordering": ["shuffle"],
      "qti-selection": ["select", "with-replacement"],
      "qti-time-limits": ["min-time", "max-time", "allow-late-submission"],
      "qti-usagedata-ref": ["identifier", "href"],
    } as const;
    for (const [handle, attributes] of Object.entries(wanted)) {
      assert.deepStrictEqual([...(registry.get(handle) ?? [])], [...attributes], handle);
    }
  });

  it("declares the twelve new names the kinds carry beside the five landed", () => {
    const names = [
      "allow-comment",
      "allow-late-submission",
      "allow-review",
      "allow-skipping",
      "max-attempts",
      "max-time",
      "min-time",
      "select",
      "show-feedback",
      "show-solution",
      "validate-responses",
      "with-replacement",
    ];
    assert.deepStrictEqual(
      [...test.attributes],
      [
        ...names,
        "access",
        "category",
        "keep-together",
        "navigation-mode",
        "source-identifier",
        "submission-mode",
        "target",
        "target-identifier",
        "visible",
      ].toSorted(),
    );
  });
});
