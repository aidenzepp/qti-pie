import { assert, describe, it } from "@effect/vitest";
import { evaluators } from "#plate/engine/evaluate.ts";
import { arithmeticEvaluators } from "#plate/engine/expressions/arithmetic.ts";
import { comparisonEvaluators } from "#plate/engine/expressions/comparison.ts";
import { containersEvaluators } from "#plate/engine/expressions/containers.ts";
import { functionsEvaluators } from "#plate/engine/expressions/functions.ts";
import { integersEvaluators } from "#plate/engine/expressions/integers.ts";
import { logicEvaluators } from "#plate/engine/expressions/logic.ts";
import { referencesEvaluators } from "#plate/engine/expressions/references.ts";
import { roundingEvaluators } from "#plate/engine/expressions/rounding.ts";
import { testEvaluators } from "#plate/engine/expressions/test.ts";
import { textEvaluators } from "#plate/engine/expressions/text.ts";
import {
  expressionKinds,
  floatOrRefOf,
  intOrIdentifierOf,
  integerOrRefOf,
  isUnlanded,
  stringOrRefOf,
} from "#plate/model/expression.ts";
import type { DeclarationFacet, ExpressionKind, ReferenceEntry } from "#plate/model/expression.ts";
import { arithmeticReaders, arithmeticRules } from "#plate/model/expressions/arithmetic.ts";
import { comparisonReaders, comparisonRules } from "#plate/model/expressions/comparison.ts";
import { containersReaders, containersRules } from "#plate/model/expressions/containers.ts";
import { functionsReaders, functionsRules } from "#plate/model/expressions/functions.ts";
import { integersReaders, integersRules } from "#plate/model/expressions/integers.ts";
import { logicReaders, logicRules } from "#plate/model/expressions/logic.ts";
import { kindReaders, kindRules, landedKinds } from "#plate/model/expressions/read.ts";
import { referencesReaders, referencesRules } from "#plate/model/expressions/references.ts";
import { roundingReaders, roundingRules } from "#plate/model/expressions/rounding.ts";
import { testReaders, testRules } from "#plate/model/expressions/test.ts";
import { textReaders, textRules } from "#plate/model/expressions/text.ts";
import { tables } from "#plate/validate/tables.ts";

/**
 * The ten families' kind rules, by family.
 */
const modelFamilies = {
  arithmetic: arithmeticRules,
  comparison: comparisonRules,
  containers: containersRules,
  functions: functionsRules,
  integers: integersRules,
  logic: logicRules,
  references: referencesRules,
  rounding: roundingRules,
  test: testRules,
  text: textRules,
};

/**
 * The ten families' reader specs, by family.
 */
const readerFamilies = {
  arithmetic: arithmeticReaders,
  comparison: comparisonReaders,
  containers: containersReaders,
  functions: functionsReaders,
  integers: integersReaders,
  logic: logicReaders,
  references: referencesReaders,
  rounding: roundingReaders,
  test: testReaders,
  text: textReaders,
};

/**
 * Give each family's kinds, sorted, by family.
 *
 * @param families Each family's name and table.
 * @returns Each family's kinds.
 */
const kindsByFamily = (
  families: readonly (readonly [string, object])[],
): Readonly<Record<string, readonly string[]>> =>
  Object.fromEntries(families.map(([family, table]) => [family, Object.keys(table).toSorted()]));

/**
 * The ten families' evaluator entries, by family.
 */
const engineFamilies = {
  arithmetic: arithmeticEvaluators,
  comparison: comparisonEvaluators,
  containers: containersEvaluators,
  functions: functionsEvaluators,
  integers: integersEvaluators,
  logic: logicEvaluators,
  references: referencesEvaluators,
  rounding: roundingEvaluators,
  test: testEvaluators,
  text: textEvaluators,
};

/**
 * Count how many of some tables hold each kind, as a key.
 *
 * Set equality would pass a kind two families hold, so the count is what fails on it.
 *
 * @param families The families' tables.
 * @returns Each key's count, by key.
 */
const kindCounts = (families: readonly object[]): ReadonlyMap<string, number> => {
  const counted = new Map<string, number>();
  for (const table of families) {
    for (const kind of Object.keys(table)) {
      counted.set(kind, (counted.get(kind) ?? 0) + 1);
    }
  }

  return counted;
};

/**
 * Each of the 64 kinds, counted once.
 */
const once = Object.fromEntries(expressionKinds.map((kind) => [kind, 1]));

/**
 * Report whether a kind is landed in all three of its tables: its rule is not the unlanded rule,
 * its reader spec is not the stub, and its evaluator is not the stub marker.
 *
 * @param kind The kind.
 * @returns Whether every table holds a landed entry for the kind.
 */
const landedEverywhere = (kind: ExpressionKind): boolean =>
  !isUnlanded(kindRules[kind]) &&
  kindReaders[kind]._tag !== "unlanded" &&
  evaluators[kind] !== "unlanded";

/**
 * The declaration facet of each kind whose `identifier` names a declaration, by kind: a variable
 * for `qti-variable` and `qti-default`, a response for the three that read a response. Every
 * other kind declares none.
 */
const declarationFacets: Partial<Record<ExpressionKind, DeclarationFacet>> = {
  correct: { attribute: "identifier", expected: "response" },
  default: { attribute: "identifier", expected: "variable" },
  "map-response": { attribute: "identifier", expected: "response" },
  "map-response-point": { attribute: "identifier", expected: "response" },
  variable: { attribute: "identifier", expected: "variable" },
};

/**
 * The reference facet of each kind with an attribute whose XSD type admits a variable's name, by
 * kind: the attribute, its field, the base type the named variable must have, whether a reference
 * there is checked, and whether the attribute is a list. Every other kind declares none.
 */
const referenceFacets: Partial<Record<ExpressionKind, readonly ReferenceEntry[]>> = {
  "any-n": [
    { attribute: "max", baseType: "integer", checked: true, field: "max", list: false },
    { attribute: "min", baseType: "integer", checked: true, field: "min", list: false },
  ],
  equal: [
    { attribute: "tolerance", baseType: "float", checked: false, field: "tolerance", list: true },
  ],
  "equal-rounded": [
    { attribute: "figures", baseType: "integer", checked: true, field: "figures", list: false },
  ],
  index: [{ attribute: "n", baseType: "integer", checked: true, field: "n", list: false }],
  "pattern-match": [
    { attribute: "pattern", baseType: "string", checked: true, field: "pattern", list: false },
  ],
  "random-float": [
    { attribute: "max", baseType: "float", checked: true, field: "max", list: false },
    { attribute: "min", baseType: "float", checked: true, field: "min", list: false },
  ],
  "random-integer": [
    { attribute: "max", baseType: "integer", checked: true, field: "max", list: false },
    { attribute: "min", baseType: "integer", checked: true, field: "min", list: false },
    { attribute: "step", baseType: "integer", checked: true, field: "step", list: false },
  ],
  repeat: [
    {
      attribute: "number-repeats",
      baseType: "integer",
      checked: true,
      field: "numberRepeats",
      list: false,
    },
  ],
  "round-to": [
    { attribute: "figures", baseType: "integer", checked: true, field: "figures", list: false },
  ],
};

/**
 * Order a reference facet's entries by attribute, so two facets compare by their entries and not
 * by the order a family declares them in.
 *
 * @param entries The facet's entries.
 * @returns The entries, by attribute.
 */
const byAttribute = (entries: readonly ReferenceEntry[]): readonly ReferenceEntry[] =>
  entries.toSorted((left, right) => left.attribute.localeCompare(right.attribute));

/**
 * The kinds a later stage of this plan owns, by the unit that lands each (M3.b-2's P7T-01 has
 * landed its three random kinds with template processing, M3.b-3's P7O-02 the two duration
 * comparisons with duration values, and M3.b-3's P7O-04 the eight outcome-only kinds for a test's
 * outcome processing): `field-value`, which M3.b-4's P7R-03 lands with record values. It stays
 * unlanded in all three tables, so an item that holds one is marked and its processing runs none.
 * The ledger's claim on I-9a names this roster, and a unit that lands a kind removes it here.
 */
const laterKinds = {
  "P7R-03": ["field-value"],
} as const satisfies Readonly<Record<string, readonly ExpressionKind[]>>;

/**
 * Every kind of {@link laterKinds}, whatever its owner.
 */
const laterKindSet: ReadonlySet<ExpressionKind> = new Set(Object.values(laterKinds).flat());

/**
 * The kinds that run: each of the 64 the roster does not list, M3.b-1's 50 and any kind a later
 * stage has landed and removed from {@link laterKinds}.
 */
const runningKinds: readonly ExpressionKind[] = expressionKinds.filter(
  (kind) => !laterKindSet.has(kind),
);

describe("expressionKinds", () => {
  it("holds 64 kinds, none repeated", () => {
    assert.strictEqual(expressionKinds.length, 64);
    assert.strictEqual(new Set(expressionKinds).size, 64);
  });

  it("names, with the qti- prefix, exactly the XSD's children of qti-set-outcome-value", () => {
    const children = tables.elements["qti-set-outcome-value"]?.children ?? [];
    const fromXsd = new Set(children.map((child) => child.local));

    assert.isAbove(fromXsd.size, 0);
    assert.deepStrictEqual(new Set(expressionKinds.map((kind) => `qti-${kind}`)), fromXsd);
  });
});

describe("integerOrRefOf", () => {
  it("reads an xs:integer with its whitespace collapsed as an exact literal", () => {
    assert.deepStrictEqual(integerOrRefOf(" 42 "), { _tag: "literal", value: 42n });
  });

  it("reads INF, NaN and a name as references, by the union's order (ruling R4)", () => {
    assert.deepStrictEqual(integerOrRefOf("INF"), { _tag: "ref", identifier: "INF" });
    assert.deepStrictEqual(integerOrRefOf("NaN"), { _tag: "ref", identifier: "NaN" });
    assert.deepStrictEqual(integerOrRefOf("x"), { _tag: "ref", identifier: "x" });
  });
});

describe("floatOrRefOf", () => {
  it("reads INF, -INF, NaN and a decimal as xs:double literals", () => {
    assert.deepStrictEqual(floatOrRefOf("INF"), {
      _tag: "literal",
      value: Number.POSITIVE_INFINITY,
    });
    assert.deepStrictEqual(floatOrRefOf("-INF"), {
      _tag: "literal",
      value: Number.NEGATIVE_INFINITY,
    });
    assert.deepStrictEqual(floatOrRefOf("NaN"), { _tag: "literal", value: Number.NaN });
    assert.deepStrictEqual(floatOrRefOf("1.5"), { _tag: "literal", value: 1.5 });
  });

  it("reads a name as a reference", () => {
    assert.deepStrictEqual(floatOrRefOf("x"), { _tag: "ref", identifier: "x" });
  });
});

describe("intOrIdentifierOf", () => {
  it("reads an xs:int as an exact literal", () => {
    assert.deepStrictEqual(intOrIdentifierOf("5"), { _tag: "literal", value: 5n });
  });

  it("reads a name as a reference", () => {
    assert.deepStrictEqual(intOrIdentifierOf("n"), { _tag: "ref", identifier: "n" });
  });
});

describe("stringOrRefOf", () => {
  it("reads {X} as a reference when X names a declared variable (ruling R1)", () => {
    assert.deepStrictEqual(stringOrRefOf("{X}", new Set(["X"])), {
      _tag: "ref",
      identifier: "X",
    });
  });

  it("reads {X} as literal text, braces kept, when X names nothing (ruling R1)", () => {
    assert.deepStrictEqual(stringOrRefOf("{X}", new Set(["Y"])), {
      _tag: "literal",
      value: "{X}",
    });
  });

  it("reads other text as the literal as written, untrimmed", () => {
    assert.deepStrictEqual(stringOrRefOf(" [0-9]+ ", new Set(["X"])), {
      _tag: "literal",
      value: " [0-9]+ ",
    });
  });
});

describe("the expression families", () => {
  it("hold each of the 64 kinds in exactly one model family, with one kind rule", () => {
    assert.deepStrictEqual(Object.fromEntries(kindCounts(Object.values(modelFamilies))), once);
  });

  it("hold each of the 64 kinds in exactly one model family, with one reader spec", () => {
    assert.deepStrictEqual(Object.fromEntries(kindCounts(Object.values(readerFamilies))), once);
  });

  it("place each kind's reader spec in the family of its rule", () => {
    assert.deepStrictEqual(
      kindsByFamily(Object.entries(readerFamilies)),
      kindsByFamily(Object.entries(modelFamilies)),
    );
  });

  it("hold each of the 64 kinds in exactly one engine family, with one evaluator entry", () => {
    assert.deepStrictEqual(Object.fromEntries(kindCounts(Object.values(engineFamilies))), once);
  });

  it("place each kind in the same family in the model and the engine", () => {
    assert.deepStrictEqual(
      Object.fromEntries(
        Object.entries(modelFamilies).map(([family, table]) => [
          family,
          Object.keys(table).toSorted(),
        ]),
      ),
      Object.fromEntries(
        Object.entries(engineFamilies).map(([family, table]) => [
          family,
          Object.keys(table).toSorted(),
        ]),
      ),
    );
  });
});

describe("kindRules", () => {
  it("holds the unlanded rule for exactly the kinds whose reader spec is the stub and whose evaluator is the stub marker", () => {
    const unlanded = expressionKinds.filter((kind) => isUnlanded(kindRules[kind]));

    assert.deepStrictEqual(
      {
        evaluators: expressionKinds.filter((kind) => evaluators[kind] === "unlanded"),
        readers: expressionKinds.filter((kind) => kindReaders[kind]._tag === "unlanded"),
      },
      { evaluators: unlanded, readers: unlanded },
    );
  });

  it("declares the declaration facet of each kind landed in all three tables that names a declaration, and none on any other kind", () => {
    assert.deepStrictEqual(
      Object.fromEntries(
        expressionKinds.flatMap((kind) => {
          const facet = kindRules[kind].declaration;

          return facet === undefined ? [] : [[kind, facet]];
        }),
      ),
      Object.fromEntries(
        expressionKinds.flatMap((kind) => {
          const facet = declarationFacets[kind];

          return facet === undefined || !landedEverywhere(kind) ? [] : [[kind, facet]];
        }),
      ),
    );
  });

  it("declares a reference facet only on a kind landed in all three tables, with the entries its attributes give", () => {
    const declaring = expressionKinds.filter((kind) => kindRules[kind].references.length > 0);

    assert.deepStrictEqual(
      Object.fromEntries(declaring.map((kind) => [kind, byAttribute(kindRules[kind].references)])),
      Object.fromEntries(
        declaring.map((kind) => [
          kind,
          landedEverywhere(kind) ? byAttribute(referenceFacets[kind] ?? []) : [],
        ]),
      ),
    );
  });

  it("refuses each qti-equal operand that is not a single integer or float, by its position", () => {
    const mismatches = kindRules.equal.operandsAccept([
      { baseType: "string", cardinality: "single" },
      { baseType: "integer", cardinality: "multiple" },
    ]);

    assert.deepStrictEqual(mismatches, [
      { baseTypes: ["integer", "float"], cardinalities: ["single"], position: 1 },
      { baseTypes: ["integer", "float"], cardinalities: ["single"], position: 2 },
    ]);
  });

  it("accepts a qti-equal operand whose type says nothing yet", () => {
    assert.deepStrictEqual(
      kindRules.equal.operandsAccept([
        { baseType: "unknown", cardinality: "unknown" },
        { baseType: "any", cardinality: "single" },
      ]),
      [],
    );
  });

  it("types M1's kinds as the engine gives them", () => {
    const none: readonly [] = [];

    assert.deepStrictEqual(
      {
        baseValue: kindRules["base-value"].resultType(none, { baseType: "point" }),
        correct: kindRules.correct.resultType(none, {
          baseType: "identifier",
          cardinality: "multiple",
        }),
        equal: kindRules.equal.resultType(none, {}),
        isNull: kindRules["is-null"].resultType(none, {}),
        mapResponse: kindRules["map-response"].resultType(none, {}),
        mapResponsePoint: kindRules["map-response-point"].resultType(none, {}),
        match: kindRules.match.resultType(none, {}),
        undeclared: kindRules.variable.resultType(none, {}),
      },
      {
        baseValue: { baseType: "point", cardinality: "single" },
        correct: { baseType: "identifier", cardinality: "multiple" },
        equal: { baseType: "boolean", cardinality: "single" },
        isNull: { baseType: "boolean", cardinality: "single" },
        mapResponse: { baseType: "float", cardinality: "single" },
        mapResponsePoint: { baseType: "float", cardinality: "single" },
        match: { baseType: "boolean", cardinality: "single" },
        undeclared: { baseType: "unknown", cardinality: "unknown" },
      },
    );
  });
});

describe("kindReaders", () => {
  it("lists as landed exactly the kinds whose rule is landed, in the order of the kinds", () => {
    assert.deepStrictEqual(
      landedKinds,
      expressionKinds.filter((kind) => !isUnlanded(kindRules[kind])),
    );
  });
});

describe("the roster", () => {
  it("[I-9a] runs each kind the roster does not list, M3.b-1's 50 among them: its reader spec, its kind rule and its evaluator are landed, none a stub", () => {
    assert.isAtLeast(runningKinds.length, 50);
    assert.deepStrictEqual(
      runningKinds.filter((kind) => !landedEverywhere(kind)),
      [],
    );
  });

  it("holds unlanded exactly the kinds a later stage owns, listed by owner, each a stub in all three tables", () => {
    assert.deepStrictEqual(
      expressionKinds.filter((kind) => isUnlanded(kindRules[kind])),
      expressionKinds.filter((kind) => laterKindSet.has(kind)),
    );
    assert.deepStrictEqual(
      [...laterKindSet].filter(
        (kind) => kindReaders[kind]._tag !== "unlanded" || evaluators[kind] !== "unlanded",
      ),
      [],
    );
  });
});
