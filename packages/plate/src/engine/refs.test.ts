import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import type { Declarations, Variables } from "#plate/engine/evaluate.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import {
  builtInType,
  builtInValue,
  referenceInteger,
  referenceValue,
  variableValue,
} from "#plate/engine/refs.ts";
import type { ScopeItem, TestScope } from "#plate/engine/scope.ts";
import type {
  OutcomeDeclaration,
  ResponseDeclaration,
  TemplateDeclaration,
} from "#plate/model/item.ts";
import { isNull, nullOf } from "#plate/model/values.ts";
import type { ModelledBaseType, Value } from "#plate/model/values.ts";

/**
 * A single identifier response value.
 */
const answer: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "A" }],
};

/**
 * A single float outcome value.
 */
const score: Value = {
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value: 0.75 }],
};

/**
 * A single integer outcome value.
 */
const count: Value = {
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value: 4n }],
};

/**
 * A single string outcome value.
 */
const word: Value = {
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value: "^[a-z]+$" }],
};

/**
 * The variables of an attempt with a response `RESPONSE`, an outcome `SCORE` and no attempt count.
 */
const variables: Variables = { outcomes: { SCORE: score }, responses: { RESPONSE: answer } };

/**
 * The variables of an attempt that also holds an integer outcome `COUNT` and a string outcome
 * `WORD`, which the reference cases name.
 */
const referenced: Variables = {
  ...variables,
  outcomes: { ...variables.outcomes, COUNT: count, WORD: word },
};

/**
 * Give the failure a Result holds, after checking that it failed.
 *
 * @param result The Result `variableValue` returned.
 * @returns Its failure.
 */
const failureOf = <A, E>(result: Result.Result<A, E>): E => {
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

describe("variableValue", () => {
  it("reads a response", () => {
    assert.deepStrictEqual(Result.getOrThrow(variableValue(variables, "RESPONSE")), answer);
  });

  it("reads an outcome", () => {
    assert.deepStrictEqual(Result.getOrThrow(variableValue(variables, "SCORE")), score);
  });

  it("reads numAttempts from the attempt count, as a single integer", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(variableValue({ ...variables, numAttempts: 3n }, "numAttempts")),
      { baseType: "integer", cardinality: "single", values: [{ baseType: "integer", value: 3n }] },
    );
  });

  it("reads an outcome named numAttempts before the attempt count", () => {
    const declared: Variables = {
      ...variables,
      numAttempts: 3n,
      outcomes: { ...variables.outcomes, numAttempts: score },
    };

    assert.deepStrictEqual(Result.getOrThrow(variableValue(declared, "numAttempts")), score);
  });

  it("[I-9a] reads the built-in completionStatus from the outcomes the record holds", () => {
    const status: Value = {
      baseType: "identifier",
      cardinality: "single",
      values: [{ baseType: "identifier", value: "completed" }],
    };
    const held: Variables = {
      ...variables,
      outcomes: { ...variables.outcomes, completionStatus: status },
    };

    assert.deepStrictEqual(Result.getOrThrow(variableValue(held, "completionStatus")), status);
  });

  it("[I-5] reads a template value", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(variableValue({ ...variables, templates: { T: count } }, "T")),
      count,
    );
  });

  it("[I-5] reads a template variable named numAttempts before the attempt count, as a declared variable", () => {
    const declared: Variables = {
      ...variables,
      numAttempts: 3n,
      templates: { numAttempts: count },
    };

    assert.deepStrictEqual(Result.getOrThrow(variableValue(declared, "numAttempts")), count);
  });

  it("[I-5] fails for a template variable when the variables hold no template values, the record's gap", () => {
    const failure = failureOf(variableValue(variables, "T"));

    assert.instanceOf(failure, UnknownIdentifierError);
    assert.deepStrictEqual(
      { _tag: failure._tag, holder: failure.holder, role: failure.role },
      { _tag: "UnknownIdentifierError", holder: "record", role: "variable" },
    );
  });

  for (const identifier of ["MISSING", "numAttempts", "completionStatus", "constructor"]) {
    it(`fails for ${identifier}, which the record holds no value of`, () => {
      const failure = failureOf(variableValue(variables, identifier));

      assert.instanceOf(failure, UnknownIdentifierError);
      assert.deepStrictEqual(
        {
          _tag: failure._tag,
          holder: failure.holder,
          identifier: failure.identifier,
          role: failure.role,
        },
        { _tag: "UnknownIdentifierError", holder: "record", identifier, role: "variable" },
      );
    });
  }
});

describe("builtInType", () => {
  it("[I-9a] names the type of each built-in the engine holds: completionStatus a single identifier, numAttempts a single integer", () => {
    assert.deepStrictEqual(
      ["completionStatus", "numAttempts", "duration", "QTI_CONTEXT", "constructor"].map((name) =>
        builtInType(name),
      ),
      [
        Option.some({ baseType: "identifier", cardinality: "single" }),
        Option.some({ baseType: "integer", cardinality: "single" }),
        Option.none(),
        Option.none(),
        Option.none(),
      ],
    );
  });
});

describe("referenceValue", () => {
  it("gives an integer literal as a single integer", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(referenced, {
          baseType: "integer",
          checked: true,
          reference: { _tag: "literal", value: 2n ** 64n },
        }),
      ),
      {
        baseType: "integer",
        cardinality: "single",
        values: [{ baseType: "integer", value: 2n ** 64n }],
      },
    );
  });

  it("gives an integer reference the outcome's value", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(referenced, {
          baseType: "integer",
          checked: true,
          reference: { _tag: "ref", identifier: "COUNT" },
        }),
      ),
      count,
    );
  });

  it("gives a float reference the float variable's value", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(referenced, {
          baseType: "float",
          checked: false,
          reference: { _tag: "ref", identifier: "SCORE" },
        }),
      ),
      score,
    );
  });

  it("gives a string literal as written, its braces kept", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(referenced, {
          baseType: "string",
          checked: true,
          reference: { _tag: "literal", value: "{NOWHERE}" },
        }),
      ),
      {
        baseType: "string",
        cardinality: "single",
        values: [{ baseType: "string", value: "{NOWHERE}" }],
      },
    );
  });

  it("gives a string reference the string variable's value", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(referenced, {
          baseType: "string",
          checked: true,
          reference: { _tag: "ref", identifier: "WORD" },
        }),
      ),
      word,
    );
  });

  it("fails for a name the variables hold no value of at a checked site", () => {
    const failure = failureOf(
      referenceValue(referenced, {
        baseType: "integer",
        checked: true,
        reference: { _tag: "ref", identifier: "MISSING" },
      }),
    );

    assert.instanceOf(failure, UnknownIdentifierError);
    assert.deepStrictEqual(
      {
        _tag: failure._tag,
        holder: failure.holder,
        identifier: failure.identifier,
        role: failure.role,
      },
      { _tag: "UnknownIdentifierError", holder: "record", identifier: "MISSING", role: "variable" },
    );
  });

  it("[I-9a] gives NULL of the site's base type at an unchecked site for a response or a built-in, as only a template or outcome variable may be named there (9.11)", () => {
    const held: Variables = {
      ...referenced,
      numAttempts: 5n,
      responses: { ...referenced.responses, RATE: score },
    };

    assert.deepStrictEqual(
      ["RATE", "numAttempts", "SCORE"].map((identifier) =>
        Result.getOrThrow(
          referenceValue(held, {
            baseType: "float",
            checked: false,
            reference: { _tag: "ref", identifier },
          }),
        ),
      ),
      [nullOf("float", "single"), nullOf("float", "single"), score],
    );
  });

  it("[I-5] gives a checked reference the template variable's value", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(
          { ...referenced, templates: { STEP: count } },
          { baseType: "integer", checked: true, reference: { _tag: "ref", identifier: "STEP" } },
        ),
      ),
      count,
    );
  });

  it("[I-5] gives a tolerance naming a template variable its value at the unchecked site, as 9.11 allows a template or outcome variable there", () => {
    const tolerance: Value = {
      baseType: "float",
      cardinality: "single",
      values: [{ baseType: "float", value: 0.01 }],
    };

    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(
          { ...referenced, templates: { TOLERANCE: tolerance } },
          {
            baseType: "float",
            checked: false,
            reference: { _tag: "ref", identifier: "TOLERANCE" },
          },
        ),
      ),
      tolerance,
    );
  });

  it("gives NULL of the site's base type for a name the variables hold no value of at an unchecked site", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(referenced, {
          baseType: "float",
          checked: false,
          reference: { _tag: "ref", identifier: "MISSING" },
        }),
      ),
      nullOf("float", "single"),
    );
  });
});

/**
 * Construct a single outcome declaration with no default and no reporting attributes.
 *
 * @param identifier Its identifier.
 * @param baseType Its base type.
 * @returns The declaration.
 */
const outcomeOf = (identifier: string, baseType: ModelledBaseType): OutcomeDeclaration => ({
  baseType,
  cardinality: "single",
  defaultValue: Option.none(),
  identifier,
  interpretation: Option.none(),
  longInterpretation: Option.none(),
  lookupTable: Option.none(),
  masteryValue: Option.none(),
  normalMaximum: Option.none(),
  normalMinimum: Option.none(),
  view: Option.none(),
});

/**
 * A single identifier response declaration, `RESPONSE`, with no correct response or mapping.
 */
const responseDeclaration: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "RESPONSE",
  mapping: Option.none(),
};

/**
 * A single integer template variable, `T`, with no default.
 */
const templateDeclaration: TemplateDeclaration = {
  baseType: "integer",
  cardinality: "single",
  defaultValue: Option.none(),
  identifier: "T",
  mathVariable: false,
  paramVariable: false,
};

/**
 * The declarations of each item below: a response `RESPONSE`, float outcomes `SCORE` and `NOTA`,
 * an integer outcome `N` and a template variable `T`.
 */
const itemDeclarations: Declarations = {
  outcomes: new Map([
    ["N", outcomeOf("N", "integer")],
    ["NOTA", outcomeOf("NOTA", "float")],
    ["SCORE", outcomeOf("SCORE", "float")],
  ]),
  responses: new Map([["RESPONSE", responseDeclaration]]),
  templates: new Map([["T", templateDeclaration]]),
};

/**
 * Construct a single float value.
 *
 * @param value The number.
 * @returns The value.
 */
const floatOf = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
});

/**
 * A presented item, `ITEM1`, with three processed attempts: its record holds `RESPONSE`, `SCORE`
 * 1.5, `NOTA` 0.5, `N` 4 and the template value `T`. It maps nothing and declares a `file`
 * response `UPLOAD`.
 */
const firstItem: ScopeItem = {
  categories: [],
  declarations: itemDeclarations,
  mappings: new Map(),
  numAttempts: 3,
  presented: true,
  record: {
    correct: {},
    defaults: {},
    outcomes: { N: count, NOTA: floatOf(0.5), SCORE: floatOf(1.5) },
    responses: { RESPONSE: answer },
    templates: { T: count },
  },
  ref: "ITEM1",
  unheld: new Map([["UPLOAD", { baseType: "file", cardinality: "single" }]]),
  weights: new Map(),
};

/**
 * An item not yet presented, `ITEM2`, whose record holds no template value. Its item ref maps its
 * `NOTA` to `SCORE`.
 */
const secondItem: ScopeItem = {
  ...firstItem,
  mappings: new Map([["SCORE", "NOTA"]]),
  numAttempts: 0,
  presented: false,
  record: {
    correct: {},
    defaults: {},
    outcomes: { N: count, NOTA: floatOf(0.75), SCORE: floatOf(0) },
    responses: { RESPONSE: nullOf("identifier", "single") },
    templates: {},
  },
  ref: "ITEM2",
};

/**
 * A test of one part `P1` holding `ITEM1` and `ITEM2`, which declares the outcome `TOTAL` and ran
 * for 90.5 seconds.
 */
const testScope: TestScope = {
  declared: new Set(["TOTAL"]),
  duration: Option.some(90.5),
  items: [firstItem, secondItem],
  parts: new Map([["P1", ["ITEM1", "ITEM2"]]]),
  sections: new Map(),
};

/**
 * The variables of a test's run: its outcome `TOTAL` and its test scope.
 */
const testRun: Variables = { outcomes: { TOTAL: score }, responses: {}, test: testScope };

describe("a test's run reads a prefixed name through its item ref [T-9]", () => {
  it("[T-9] variableValue gives ITEM1.SCORE read through its item ref: the item's outcome as its record holds it", () => {
    assert.deepStrictEqual(Result.getOrThrow(variableValue(testRun, "ITEM1.SCORE")), floatOf(1.5));
  });

  it("[T-9] variableValue gives ITEM1.1.SCORE, the first occurrence, read through its item ref as ITEM1.SCORE", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(variableValue(testRun, "ITEM1.1.SCORE")),
      floatOf(1.5),
    );
  });

  it("[T-9] variableValue gives ITEM1.2.SCORE read through its item ref as NULL of a single float: no second occurrence exists (G-R3, pending)", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(variableValue(testRun, "ITEM1.2.SCORE")),
      nullOf("float", "single"),
    );
  });

  it("[T-9] variableValue gives a mapping target read through its item ref before the item's own declaration of that name", () => {
    assert.deepStrictEqual(Result.getOrThrow(variableValue(testRun, "ITEM2.SCORE")), floatOf(0.75));
  });

  it("[T-9] variableValue gives ITEM1.numAttempts read through its item ref: the processed attempt count, a single integer", () => {
    assert.deepStrictEqual(Result.getOrThrow(variableValue(testRun, "ITEM1.numAttempts")), {
      baseType: "integer",
      cardinality: "single",
      values: [{ baseType: "integer", value: 3n }],
    });
  });

  it("[T-9] variableValue gives ITEM2.T read through its item ref as NULL of its declared type: the item is not yet presented (G-R3, pending)", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(variableValue(testRun, "ITEM2.T")),
      nullOf("integer", "single"),
    );
  });

  it("[T-9] variableValue gives ITEM1.UPLOAD, a file response, read through its item ref as a NULL (G-R3, pending)", () => {
    assert.isTrue(isNull(Result.getOrThrow(variableValue(testRun, "ITEM1.UPLOAD"))));
  });

  it("[T-9] variableValue gives the run's own outcome named ITEM1.SCORE before any read through its item ref", () => {
    const named: Variables = {
      ...testRun,
      outcomes: { ...testRun.outcomes, "ITEM1.SCORE": count },
    };

    assert.deepStrictEqual(Result.getOrThrow(variableValue(named, "ITEM1.SCORE")), count);
  });

  it("[T-9] variableValue without a test scope makes no read through its item ref: ITEM1.SCORE is the record's gap", () => {
    const failure = failureOf(variableValue(variables, "ITEM1.SCORE"));

    assert.deepStrictEqual(
      {
        _tag: failure._tag,
        holder: failure.holder,
        identifier: failure.identifier,
        role: failure.role,
      },
      {
        _tag: "UnknownIdentifierError",
        holder: "record",
        identifier: "ITEM1.SCORE",
        role: "variable",
      },
    );
  });

  it("[T-9] builtInValue gives the test's own duration, not a read through its item ref: its seconds as a single duration", () => {
    assert.deepStrictEqual(
      [builtInValue(testRun, "duration"), Result.getOrThrow(variableValue(testRun, "duration"))],
      [
        Option.some({
          baseType: "duration",
          cardinality: "single",
          values: [{ baseType: "duration", value: 90.5 }],
        }),
        {
          baseType: "duration",
          cardinality: "single",
          values: [{ baseType: "duration", value: 90.5 }],
        },
      ],
    );
  });

  it("[T-9] builtInValue gives the test's duration as NULL of a single duration when its scope holds no time, not a read through its item ref (G-R3, pending)", () => {
    const untimed: Variables = { ...testRun, test: { ...testScope, duration: Option.none() } };

    assert.deepStrictEqual(
      builtInValue(untimed, "duration"),
      Option.some(nullOf("duration", "single")),
    );
  });

  it("[T-9] builtInValue gives no duration without a test scope, so an item's duration stays unheld, with no read through its item ref", () => {
    assert.isTrue(Option.isNone(builtInValue({ ...variables, numAttempts: 1n }, "duration")));
  });

  it("[T-9] referenceInteger gives qti-index's n naming ITEM1.N read through its item ref", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(referenceInteger(testRun, { _tag: "ref", identifier: "ITEM1.N" })),
      Option.some(4n),
    );
  });

  it("[T-9] referenceValue keeps NULL at an unchecked site for ITEM1.SCORE, with no read through its item ref (9.11)", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(
        referenceValue(testRun, {
          baseType: "float",
          checked: false,
          reference: { _tag: "ref", identifier: "ITEM1.SCORE" },
        }),
      ),
      nullOf("float", "single"),
    );
  });
});
