import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import { inspect } from "node:util";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as contracts from "#pantry/schema/contracts.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import * as node from "#pantry/schema/node.ts";
import { Author } from "#pantry/schema/roles.ts";
import * as control from "#pantry/schema/test/control.ts";
import * as structure from "#pantry/schema/test/structure.ts";

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

type Rule = (typeof control.rules)[number];

interface Side {
  readonly source: object;
  readonly fields: readonly string[];
}

interface Owner {
  readonly name: string;
}

/**
 * A containment or capacity side as `[relation, selection bindings or none, fields]`: a selected
 * side names the relation it selects from and the handles it binds.
 */
const sideOf = (side: Side): readonly [unknown, unknown, readonly string[]] => {
  const { source } = side;
  const selected = "relation" in source && "bindings" in source;

  return [
    selected ? source.relation : source,
    selected ? source.bindings : undefined,
    [...side.fields],
  ];
};

const containments = control.rules.filter((rule) => rule.kind === "contained");

const capacities = control.rules.filter((rule) => rule.kind === "capacity");

const checks = control.rules.filter((rule) => rule.kind === "check");

const containedFrom = (relation: Owner) =>
  containments
    .filter((rule) => sideOf(rule.left)[0] === relation)
    .map((rule) => [sideOf(rule.left), sideOf(rule.right)]);

const boundsOf = (rule: Rule | undefined): string =>
  inspect(
    Predicate.hasProperty(rule, "desc") && Predicate.hasProperty(rule.desc, "within")
      ? rule.desc.within
      : undefined,
    { depth: null },
  );

const capacityOver = (target: Owner) =>
  capacities.filter((rule) => sideOf(rule.target)[0] === target);

const checkText = (name: string): string => {
  const rule = checks.find((found) => found.name === name);

  return inspect(rule && "desc" in rule ? rule.desc : undefined, {
    depth: null,
    maxStringLength: 100_000,
  });
};

const byName = (left: string, right: string): number => left.localeCompare(right);

describe("the test control laws", () => {
  it("builds the probe over node, structure and control without refusal", () => {
    const built = schema(
      "QtiControlProbe",
      { ...node.relations, ...structure.relations, ...control.relations },
      [...node.rules, ...structure.rules, ...control.rules],
    );
    assert.include(Object.keys(built.relations), "SelectionBounded");
  });

  it("states only containments, capacities, checks and the one key", () => {
    assert.deepStrictEqual([...new Set(control.rules.map((rule) => rule.kind))].toSorted(byName), [
      "capacity",
      "check",
      "contained",
      "key",
    ]);
    assert.deepStrictEqual(
      control.rules
        .filter((rule) => rule.kind === "key")
        .map((rule) => [rule.relation.name, [...rule.fields]]),
      [["Selection", ["section"]]],
    );
  });

  it("binds a selection to its edge and its section", () => {
    const { Selection } = relations;
    const whole = containedFrom(Selection).filter(([left]) => left?.[1] === undefined);

    assert.deepStrictEqual(whole, [
      [
        [Selection, undefined, ["id", "section"]],
        [node.relations.Edge, undefined, ["child", "parent"]],
      ],
      [
        [Selection, undefined, ["section"]],
        [structure.relations.AssessmentSection, undefined, ["id"]],
      ],
    ]);
  });

  it("binds SelectionBounded into Selection, sound and complete over both false spellings", () => {
    const { Selection, SelectionBounded } = relations;

    assert.deepStrictEqual(containedFrom(SelectionBounded), [
      [
        [SelectionBounded, undefined, ["section", "select", "withReplacement"]],
        [Selection, undefined, ["section", "select", "withReplacement"]],
      ],
    ]);

    const complete = containedFrom(Selection).filter(([left]) => left?.[1] !== undefined);

    assert.deepStrictEqual(complete, [
      [
        [Selection, { withReplacement: "false" }, ["section"]],
        [SelectionBounded, undefined, ["section"]],
      ],
      [
        [Selection, { withReplacement: "0" }, ["section"]],
        [SelectionBounded, undefined, ["section"]],
      ],
    ]);
  });

  it("holds a bounded selection to a false spelling of with-replacement", () => {
    const text = checkText("SelectionBoundedWithoutReplacement");
    const rule = checks.find((found) => found.name === "SelectionBoundedWithoutReplacement");

    assert.strictEqual(rule?.relation, relations.SelectionBounded);
    assert.include(text, "withReplacement");
    assert.include(text, "false");
    assert.include(text, "0");
    assert.notInclude(text, "true");
  });

  it("counts a section's children against select: at most, unless with replacement; at least the required", () => {
    const { RequiredChild, StructureChild } = structure.relations;
    const bounded = capacityOver(relations.SelectionBounded);
    const required = capacityOver(relations.Selection);

    assert.strictEqual(bounded.length, 1);
    assert.strictEqual(required.length, 1);

    const [atMost] = bounded;
    const [atLeast] = required;

    assert.isDefined(atMost);
    assert.isDefined(atLeast);
    assert.deepStrictEqual(sideOf(atMost.target), [
      relations.SelectionBounded,
      undefined,
      ["section"],
    ]);
    assert.deepStrictEqual(sideOf(atMost.from), [StructureChild, undefined, ["parent"]]);
    assert.include(boundsOf(atMost), "select");
    assert.include(boundsOf(atMost), "*");
    assert.deepStrictEqual(sideOf(atLeast.target), [relations.Selection, undefined, ["section"]]);
    assert.deepStrictEqual(sideOf(atLeast.from), [RequiredChild, undefined, ["parent"]]);
    assert.include(boundsOf(atLeast), "0n");
    assert.include(boundsOf(atLeast), "select");
  });

  it("keeps xs:int's range on select and max-attempts", () => {
    for (const [name, relation] of [
      ["SelectionSelectInt", relations.Selection],
      ["MaxAttemptsInt", relations.ItemSessionMaxAttempts],
    ] as const) {
      const rule = checks.find((found) => found.name === name);

      assert.strictEqual(rule?.relation, relation, name);
      assert.include(checkText(name), "-2147483648", name);
      assert.include(checkText(name), "2147483647", name);
    }

    assert.include(checkText("SelectionSelectInt"), "select");
    assert.include(checkText("MaxAttemptsInt"), "value");
    assert.deepStrictEqual(checks.map((rule) => rule.name).toSorted(byName), [
      "MaxAttemptsInt",
      "SelectionBoundedWithoutReplacement",
      "SelectionSelectInt",
    ]);
  });

  it("admits select zero and a negative select: no check bounds select below", () => {
    const text = checkText("SelectionSelectInt");

    assert.notInclude(text, "0n");
    assert.notInclude(text, "1n");
  });

  it("gives an adaptive selection exactly one engine ref and at most one of each other ref", () => {
    const refs = capacityOver(relations.AdaptiveSelection).map((rule) => {
      const [relation, bindings, fields] = sideOf(rule.from);

      return { bindings, bounds: boundsOf(rule), fields, relation, target: sideOf(rule.target) };
    });

    assert.deepStrictEqual(
      refs.map((found) => found.bindings),
      [
        { childKind: "qti-adaptive-engine-ref", parentKind: "qti-adaptive-selection" },
        { childKind: "qti-adaptive-settings-ref", parentKind: "qti-adaptive-selection" },
        { childKind: "qti-metadata-ref", parentKind: "qti-adaptive-selection" },
        { childKind: "qti-usagedata-ref", parentKind: "qti-adaptive-selection" },
      ],
    );

    for (const found of refs) {
      assert.strictEqual(found.relation, node.relations.Edge);
      assert.deepStrictEqual(found.fields, ["parent"]);
      assert.deepStrictEqual(found.target, [relations.AdaptiveSelection, undefined, ["id"]]);
    }

    const [engine, ...others] = refs;

    assert.strictEqual(engine?.bounds.match(/1n/gu)?.length, 2);
    for (const found of others) {
      assert.include(found.bounds, "0n");
      assert.strictEqual(found.bounds.match(/1n/gu)?.length, 1);
    }
  });

  it("binds each marker and optional value to its arm", () => {
    const owners = [
      ["DeclaredWithReplacement", "Selection"],
      ["DeclaredOrderingShuffle", "Ordering"],
      ["DeclaredAllowComment", "ItemSessionControl"],
      ["DeclaredAllowReview", "ItemSessionControl"],
      ["DeclaredAllowSkipping", "ItemSessionControl"],
      ["DeclaredShowFeedback", "ItemSessionControl"],
      ["DeclaredShowSolution", "ItemSessionControl"],
      ["DeclaredValidateResponses", "ItemSessionControl"],
      ["ItemSessionMaxAttempts", "ItemSessionControl"],
      ["DeclaredAllowLateSubmission", "TimeLimits"],
      ["TimeLimitMin", "TimeLimits"],
      ["TimeLimitMax", "TimeLimits"],
    ] as const;

    for (const [marker, owner] of owners) {
      assert.deepStrictEqual(
        containedFrom(relations[marker]),
        [
          [
            [relations[marker], undefined, ["node"]],
            [relations[owner], undefined, ["id"]],
          ],
        ],
        marker,
      );
    }
  });

  it("counts every statement the module declares", () => {
    assert.strictEqual(control.rules.length, 27);
  });
});
