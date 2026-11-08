import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import type { Declarations } from "#plate/engine/evaluate.ts";
import type { UnknownIdentifierError } from "#plate/engine/failures.ts";
import {
  attemptsStarted,
  durationOf,
  itemName,
  itemVariable,
  keptItems,
  prefixedVariable,
  weightOf,
} from "#plate/engine/scope.ts";
import type {
  ItemFilters,
  PrefixedRead,
  Reading,
  ScopeItem,
  TestScope,
} from "#plate/engine/scope.ts";
import type {
  OutcomeDeclaration,
  ResponseDeclaration,
  TemplateDeclaration,
} from "#plate/model/item.ts";
import type { ModelledBaseType, Value } from "#plate/model/values.ts";

/**
 * Construct a single float value.
 *
 * @param value The number.
 * @returns The value.
 */
const floatValue = (value: number): Value => ({
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value }],
});

/**
 * Construct a single integer value.
 *
 * @param value The integer.
 * @returns The value.
 */
const integerValue = (value: bigint): Value => ({
  baseType: "integer",
  cardinality: "single",
  values: [{ baseType: "integer", value }],
});

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value.
 */
const identifierValue = (value: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * Construct a single outcome declaration with no reporting attributes and no default.
 *
 * @param identifier Its identifier.
 * @param baseType Its base type.
 * @returns The declaration.
 */
const outcome = (identifier: string, baseType: ModelledBaseType): OutcomeDeclaration => ({
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
const response: ResponseDeclaration = {
  areaMapping: Option.none(),
  baseType: "identifier",
  cardinality: "single",
  correct: Option.none(),
  defaultValue: Option.none(),
  identifier: "RESPONSE",
  mapping: Option.none(),
};

/**
 * A multiple integer template variable, `T`, with no default.
 */
const template: TemplateDeclaration = {
  baseType: "integer",
  cardinality: "multiple",
  defaultValue: Option.none(),
  identifier: "T",
  mathVariable: false,
  paramVariable: false,
};

/**
 * The declarations of the items below: a response `RESPONSE`, two float outcomes `SCORE` and
 * `NOTA`, and a template variable `T`.
 */
const declarations: Declarations = {
  outcomes: new Map([
    ["NOTA", outcome("NOTA", "float")],
    ["SCORE", outcome("SCORE", "float")],
  ]),
  responses: new Map([["RESPONSE", response]]),
  templates: new Map([["T", template]]),
};

/**
 * A presented item, `ITEM1`, that has started three attempts: its record holds `RESPONSE`, `SCORE`
 * 1.5, `NOTA` 0.5, the built-in `completionStatus`, the template value `T` and a template-set
 * default of `SCORE`. It is in the categories `alpha` and `beta`, weights `SCORE` by 2, maps
 * nothing and declares a `file` response `UPLOAD` and a `record` outcome `REC`.
 */
const item1: ScopeItem = {
  categories: ["alpha", "beta"],
  declarations,
  mappings: new Map(),
  numAttempts: 3,
  presented: true,
  record: {
    correct: {},
    defaults: { SCORE: floatValue(0.25) },
    outcomes: {
      NOTA: floatValue(0.5),
      SCORE: floatValue(1.5),
      completionStatus: identifierValue("completed"),
    },
    responses: { RESPONSE: identifierValue("A") },
    templates: { T: { baseType: "integer", cardinality: "multiple", values: [] } },
  },
  ref: "ITEM1",
  unheld: new Map([
    ["REC", { baseType: "file", cardinality: "record" }],
    ["UPLOAD", { baseType: "file", cardinality: "single" }],
  ]),
  weights: new Map([["SCORE", 2]]),
};

/**
 * An item not yet presented, `ITEM2`, whose record is fresh: no template value and no attempt
 * started. It is in the category `gamma` and maps its `NOTA` to `SCORE`.
 */
const item2: ScopeItem = {
  ...item1,
  categories: ["gamma"],
  mappings: new Map([["SCORE", "NOTA"]]),
  numAttempts: 0,
  presented: false,
  record: {
    correct: {},
    defaults: {},
    outcomes: {
      NOTA: floatValue(0.75),
      SCORE: floatValue(0),
      completionStatus: identifierValue("not_attempted"),
    },
    responses: { RESPONSE: { baseType: "identifier", cardinality: "single", values: [] } },
    templates: {},
  },
  ref: "ITEM2",
  weights: new Map(),
};

/**
 * An item, `ITEM3`, in the categories `beta` and `gamma`, whose record lacks its response and its
 * outcome `NOTA`: the record's gap.
 */
const item3: ScopeItem = {
  ...item1,
  categories: ["beta", "gamma"],
  record: { ...item1.record, outcomes: { SCORE: floatValue(1) }, responses: {} },
  ref: "ITEM3",
};

/**
 * A test with one part `P1` holding the section `S1`, which holds `ITEM1` and a nested section
 * `S2` holding `ITEM2`; a section `S3` holds `ITEM3`. The test declares `ITEM1.SCORE` whole and ran
 * for 90.5 seconds.
 */
const scope: TestScope = {
  declared: new Set(["ITEM1.SCORE", "TOTAL"]),
  duration: Option.some(90.5),
  items: [item1, item2, item3],
  parts: new Map([["P1", ["ITEM1", "ITEM2", "ITEM3"]]]),
  sections: new Map([
    ["S1", ["ITEM1", "ITEM2"]],
    ["S2", ["ITEM2"]],
    ["S3", ["ITEM3"]],
  ]),
};

/**
 * The filters with none set.
 */
const unfiltered: ItemFilters = {
  excludeCategory: Option.none(),
  includeCategory: Option.none(),
  sectionIdentifier: Option.none(),
};

/**
 * Give the identifiers of the item refs of items, in order.
 *
 * @param items The items.
 * @returns Their refs.
 */
const refsOf = (items: readonly ScopeItem[]): readonly string[] => items.map((each) => each.ref);

/**
 * Give the value a reading holds, after checking that it holds one.
 *
 * @param result The lookup's result.
 * @returns The value.
 */
const heldValue = (result: Result.Result<Reading, UnknownIdentifierError>): Value => {
  assert.isTrue(Result.isSuccess(result));

  const reading = Result.getOrThrow(result);
  assert.strictEqual(reading.kind, "held");

  return reading.kind === "held"
    ? reading.value
    : { baseType: "float", cardinality: "single", values: [] };
};

/**
 * Give the failure a lookup returned, after checking that it failed.
 *
 * @param result The lookup's result.
 * @returns The failure.
 */
const failureOf = <A>(result: Result.Result<A, UnknownIdentifierError>): UnknownIdentifierError => {
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

/**
 * Give the reading of a prefixed name, after checking that it resolved.
 *
 * @param name The name.
 * @returns The item it read through and its reading.
 */
const prefixed = (name: string) => {
  const result = prefixedVariable(scope, name);
  assert.isTrue(Result.isSuccess(result));

  const read = Result.getOrThrow(result);

  return { reading: read.reading, ref: read.item.ref };
};

/**
 * Give what a prefixed name names in its item and the occurrence it reads, after checking that it
 * resolved.
 *
 * @param name The name.
 * @returns What it names and the occurrence.
 */
const namedAt = (name: string): Pick<PrefixedRead, "named" | "occurrence"> => {
  const { named, occurrence } = Result.getOrThrow(prefixedVariable(scope, name));

  return { named, occurrence };
};

/**
 * Give the items a `section-identifier` keeps.
 *
 * @param identifier The section's identifier.
 * @returns The refs of the items kept.
 */
const section = (identifier: string): readonly string[] =>
  refsOf(keptItems(scope, { ...unfiltered, sectionIdentifier: Option.some(identifier) }));

describe("attemptsStarted", () => {
  it("[T-9] counts no attempt before the presentation, one past the processed ones while the item is open, and the processed ones once its limit closes it (info.txt:8468)", () => {
    assert.deepStrictEqual(
      [
        attemptsStarted(false, 0, 1),
        attemptsStarted(true, 0, 1),
        attemptsStarted(true, 1, 2),
        attemptsStarted(true, 2, 2),
        attemptsStarted(true, 3, 0),
      ],
      [0, 1, 2, 2, 4],
    );
  });
});

describe("keptItems", () => {
  it("[T-9] test scope lookup: keeps every item with no filter", () => {
    assert.deepStrictEqual(refsOf(keptItems(scope, unfiltered)), ["ITEM1", "ITEM2", "ITEM3"]);
  });

  it("[T-9] test scope lookup: a section-identifier keeps the section's items, a nested section's included, and an unknown section none", () => {
    assert.deepStrictEqual(section("S1"), ["ITEM1", "ITEM2"]);
    assert.deepStrictEqual(section("S2"), ["ITEM2"]);
    assert.deepStrictEqual(section("NONE"), []);
  });

  it("[T-9] test scope lookup: one shared category includes an item, and one shared category excludes it (9.25)", () => {
    const include = keptItems(scope, { ...unfiltered, includeCategory: Option.some(["beta"]) });
    const exclude = keptItems(scope, {
      ...unfiltered,
      excludeCategory: Option.some(["alpha", "delta"]),
    });
    const both = keptItems(scope, {
      excludeCategory: Option.some(["alpha"]),
      includeCategory: Option.some(["gamma", "beta"]),
      sectionIdentifier: Option.some("S1"),
    });

    assert.deepStrictEqual(refsOf(include), ["ITEM1", "ITEM3"]);
    assert.deepStrictEqual(refsOf(exclude), ["ITEM2", "ITEM3"]);
    assert.deepStrictEqual(refsOf(both), ["ITEM2"]);
  });

  it("[T-9] test scope lookup: an empty include list keeps no item and an empty exclude list drops none", () => {
    assert.deepStrictEqual(
      refsOf(keptItems(scope, { ...unfiltered, includeCategory: Option.some([]) })),
      [],
    );
    assert.deepStrictEqual(
      refsOf(keptItems(scope, { ...unfiltered, excludeCategory: Option.some([]) })),
      ["ITEM1", "ITEM2", "ITEM3"],
    );
  });
});

describe("itemVariable", () => {
  it("[T-9] test scope lookup: a mapping target reads its source outcome before the item's own declaration of the name", () => {
    assert.deepStrictEqual(
      itemName(item2, "SCORE"),
      Option.some({
        identifier: "NOTA",
        kind: "outcome",
        type: { baseType: "float", cardinality: "single" },
      }),
    );
    assert.deepStrictEqual(heldValue(itemVariable(item2, "SCORE")), floatValue(0.75));
    assert.deepStrictEqual(heldValue(itemVariable(item1, "SCORE")), floatValue(1.5));
  });

  it("[T-9] test scope lookup: a declaration is read before an item-session built-in, and the built-ins after", () => {
    const shadowing: ScopeItem = {
      ...item1,
      declarations: {
        ...declarations,
        outcomes: new Map([
          ...declarations.outcomes,
          ["numAttempts", outcome("numAttempts", "float")],
        ]),
      },
      record: {
        ...item1.record,
        outcomes: { ...item1.record.outcomes, numAttempts: floatValue(9) },
      },
    };

    assert.deepStrictEqual(heldValue(itemVariable(shadowing, "numAttempts")), floatValue(9));
    assert.deepStrictEqual(
      heldValue(itemVariable(item1, "completionStatus")),
      identifierValue("completed"),
    );
    assert.deepStrictEqual(
      itemName(item1, "completionStatus"),
      Option.some({
        identifier: "completionStatus",
        kind: "built-in",
        type: { baseType: "identifier", cardinality: "single" },
      }),
    );
  });

  it("[T-9] test scope lookup: numAttempts reads the count of attempts started as a single integer", () => {
    assert.deepStrictEqual(heldValue(itemVariable(item1, "numAttempts")), integerValue(3n));
    assert.deepStrictEqual(heldValue(itemVariable(item2, "numAttempts")), integerValue(0n));
  });

  it("[T-9] test scope lookup: a template variable of an item not presented reads NULL of its declared type (G-R3, pending: an item variable with no value reads NULL)", () => {
    assert.deepStrictEqual(heldValue(itemVariable(item2, "T")), {
      baseType: "integer",
      cardinality: "multiple",
      values: [],
    });
  });

  it("[T-9] test scope lookup: a file response and a record outcome read NULL of their declared types", () => {
    assert.deepStrictEqual(Result.getOrThrow(itemVariable(item1, "UPLOAD")), {
      kind: "unheld",
      type: { baseType: "file", cardinality: "single" },
    });
    assert.deepStrictEqual(Result.getOrThrow(itemVariable(item1, "REC")), {
      kind: "unheld",
      type: { baseType: "file", cardinality: "record" },
    });
  });

  it("[T-9] test scope lookup: a declared response or outcome the record holds no value of is the record's gap", () => {
    const response3 = failureOf(itemVariable(item3, "RESPONSE"));
    const outcome3 = failureOf(itemVariable(item3, "NOTA"));

    assert.deepStrictEqual(
      [response3.holder, response3.identifier, response3.role],
      ["record", "RESPONSE", "response"],
    );
    assert.deepStrictEqual(
      [outcome3.holder, outcome3.identifier, outcome3.role],
      ["record", "NOTA", "outcome"],
    );
  });

  it("[T-9] test scope lookup: a name the item holds nothing of is the item's", () => {
    const failure = failureOf(itemVariable(item1, "MISSING"));

    assert.deepStrictEqual(itemName(item1, "MISSING"), Option.none());
    assert.deepStrictEqual([failure.holder, failure.identifier], ["item", "MISSING"]);
  });
});

describe("prefixedVariable", () => {
  it("[T-9] test scope lookup: ITEMREF.VAR and ITEMREF.1.VAR read the item's variable through its item ref", () => {
    assert.deepStrictEqual(prefixed("ITEM2.NOTA"), {
      reading: { kind: "held", value: floatValue(0.75) },
      ref: "ITEM2",
    });
    assert.deepStrictEqual(prefixed("ITEM2.1.NOTA"), prefixed("ITEM2.NOTA"));
    assert.deepStrictEqual(prefixed("ITEM2.SCORE"), prefixed("ITEM2.NOTA"));
    assert.deepStrictEqual(namedAt("ITEM2.1.SCORE"), {
      named: {
        identifier: "NOTA",
        kind: "outcome",
        type: { baseType: "float", cardinality: "single" },
      },
      occurrence: 1n,
    });
    assert.deepStrictEqual(prefixed("ITEM3.numAttempts").reading, {
      kind: "held",
      value: integerValue(3n),
    });
  });

  it("[T-9] test scope lookup: ITEM1.2.SCORE names an occurrence that does not exist and reads NULL of the variable's type", () => {
    assert.deepStrictEqual(prefixed("ITEM3.2.SCORE"), {
      reading: { kind: "held", value: { baseType: "float", cardinality: "single", values: [] } },
      ref: "ITEM3",
    });
    assert.deepStrictEqual(namedAt("ITEM3.2.SCORE"), {
      named: {
        identifier: "SCORE",
        kind: "outcome",
        type: { baseType: "float", cardinality: "single" },
      },
      occurrence: 2n,
    });
    assert.deepStrictEqual(prefixed("ITEM3.02.UPLOAD").reading, {
      kind: "unheld",
      type: { baseType: "file", cardinality: "single" },
    });
  });

  it("[T-9] test scope lookup: a template-set default is read through the item's entry", () => {
    assert.deepStrictEqual(
      Result.map(
        prefixedVariable(scope, "ITEM1.NOTA"),
        (read) => read.item.record.defaults["SCORE"],
      ),
      Result.succeed(floatValue(0.25)),
    );
  });

  it("[T-9] test scope lookup: a name the test declares whole is not split", () => {
    const failure = failureOf(prefixedVariable(scope, "ITEM1.SCORE"));

    assert.deepStrictEqual([failure.holder, failure.identifier], ["record", "ITEM1.SCORE"]);
    assert.deepStrictEqual(prefixed("ITEM3.SCORE").reading, { kind: "held", value: floatValue(1) });
  });

  it("[T-9] test scope lookup: a name two readings resolve resolves to none (Admission A4)", () => {
    const dotted: ScopeItem = { ...item1, ref: "A.B" };
    const plain: ScopeItem = {
      ...item1,
      declarations: {
        ...declarations,
        outcomes: new Map([...declarations.outcomes, ["B.SCORE", outcome("B.SCORE", "float")]]),
      },
      record: { ...item1.record, outcomes: { ...item1.record.outcomes, "B.SCORE": floatValue(4) } },
      ref: "A",
    };
    const ambiguous: TestScope = { ...scope, items: [dotted, plain] };
    const failure = failureOf(prefixedVariable(ambiguous, "A.B.SCORE"));

    assert.deepStrictEqual([failure.holder, failure.identifier], ["record", "A.B.SCORE"]);
    assert.deepStrictEqual(
      Result.map(
        prefixedVariable({ ...scope, items: [plain] }, "A.B.SCORE"),
        (read) => read.reading,
      ),
      Result.succeed<Reading>({ kind: "held", value: floatValue(4) }),
    );
  });

  it("[T-9] test scope lookup: a name no reading resolves, and a part's or a section's duration, which the scope does not hold, read nothing", () => {
    const names = ["NOPE.SCORE", "ITEM1.MISSING", "P1.duration", "S1.duration", "UNDOTTED"];

    assert.deepStrictEqual(
      names.map((name) => failureOf(prefixedVariable(scope, name)).holder),
      ["record", "record", "record", "record", "record"],
    );
  });
});

describe("weightOf", () => {
  it("[T-9] test scope lookup: an item ref's weight by identifier, and 1.0 when the ref defines none", () => {
    assert.strictEqual(weightOf(item1, "SCORE"), 2);
    assert.strictEqual(weightOf(item1, "OTHER"), 1);
    assert.strictEqual(weightOf(item2, "SCORE"), 1);
  });
});

describe("durationOf", () => {
  it("[T-9] test scope lookup: the test's duration is a single duration of its seconds, and NULL of base type duration with none", () => {
    assert.deepStrictEqual(durationOf(scope), {
      baseType: "duration",
      cardinality: "single",
      values: [{ baseType: "duration", value: 90.5 }],
    });
    assert.deepStrictEqual(durationOf({ ...scope, duration: Option.none() }), {
      baseType: "duration",
      cardinality: "single",
      values: [],
    });
  });
});
