/**
 * The expression overlays' free tests: their statements build beside every law they read, each
 * check is named by its law, the typing table covers exactly `OperatorArity`'s kinds, every
 * `BaseTypePattern` row speaks its XSD type's installed language, and `OperatorArity` agrees with
 * each expression kind's content automaton at its bounds.
 *
 * The fixtures' verdicts are `#pantry/import/overlays/expressions.test.ts`'s, and the database's
 * `expressions.db.test.ts`'s.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option, Schema } from "effect";
import { contentEnds, stepOf } from "#pantry/grammar/content.ts";
import { int8Max } from "#pantry/grammar/closed.ts";
import {
  builtInTypes,
  expressionTypings,
  rpTemplatePattern,
  rpTemplates,
} from "#pantry/grammar/expression.ts";
import { openDomain } from "#pantry/grammar/attributes.ts";
import {
  BaseType,
  BuiltInVariable,
  grammar,
  OperatorArity,
  ValueDomainOf,
  VariableReference,
} from "#pantry/grammar/install.ts";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import { Declaration } from "#pantry/qti/declarations.ts";
import {
  BaseTypePattern,
  booleanValuePattern,
  domainValues,
  expressionKinds,
  Language,
  LeadCardinality,
  OperandBase,
  pairValuePattern,
  pointValuePattern,
  processingReferences,
  ReferenceBase,
  ReferenceDeclaration,
  referenceDeclarations,
  setKindHandles,
  setterKinds,
  lookupKindHandle,
  ReferencedTable,
  ReferenceResolution,
  ResultBase,
  ResultCardinality,
  RpTemplate,
  ruleKindHandles,
  TailCardinality,
  unjudgedBaseTypes,
  ValueBase,
  ValueBaseBit,
  ValueBaseForm,
  ValueBaseOf,
  ValueCardinality,
  ValueCardinalityBit,
  ValueCardinalityOf,
} from "#pantry/qti/expression-types.ts";
import {
  Expression,
  ExpressionAttribute,
  expressionLaws,
  ItemTiming,
  Literal,
  Operand,
  Processing,
  ProcessingTemplate,
  referenceRelations,
  VariableRef,
} from "#pantry/qti/expressions.ts";
import { AreaMapping, InterpolationTable, Mapping, MatchTable } from "#pantry/qti/mapping.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { itemRefKind, linkResourceTypes, nilUuid } from "#pantry/qti/tests.ts";

/**
 * The rule each of this module's check names keeps, the oracle laws `#pantry/test/oracle.ts` names
 * with spaces for underscores (Q5.17 maps them).
 */
const checkRules = {
  Arity: "P2",
  Condition_type: "P21",
  E1_derived: "derived",
  Item_duration: "item-duration",
  Literal_lexical: "attribute-lexical",
  Lookup_type: "P22",
  Mapped_response: "P27",
  One_base: "P23",
  Operand_fit: "P23",
  Outcome_only: "P25",
  Prefixed_reference: "prefixed-ref",
  Reference_type: "P24",
  Section_identifier_target: "section-identifier-target",
  Set_type: "P20",
  Template_default_target: "template-default-target",
  Template_default_type: "P20",
  Template_reads: "P26",
  Variable_declared: "P8",
  Variable_mapping_source: "variable-mapping-source",
  Variable_mapping_target: "variable-mapping-target",
  Weighted_base: "P29",
} as const;

/**
 * Compile a base type's installed pattern as a match reads it.
 *
 * @param baseType - The base type.
 * @returns Its pattern, under the `u` flag.
 */
const patternOf = (baseType: string): RegExp =>
  new RegExp(BaseTypePattern.rows.find((row) => row.baseType === baseType)?.pattern ?? "^$", "u");

describe("qti/expressions.ts, declared", () => {
  it("builds a schema of every relation its laws read, with its laws and theirs, each statement once", () => {
    const built = schema(
      "ExpressionLayer",
      {
        ...Qti.relations,
        AreaMapping,
        BaseTypePattern,
        Declaration,
        Expression,
        ExpressionAttribute,
        InterpolationTable,
        ItemTiming,
        Language,
        LeadCardinality,
        Literal,
        Mapping,
        MatchTable,
        Operand,
        OperandBase,
        Processing,
        ProcessingTemplate,
        ReferenceBase,
        ReferenceResolution,
        ReferencedTable,
        ResultBase,
        ResultCardinality,
        RpTemplate,
        TailCardinality,
        ValueBase,
        ValueBaseBit,
        ValueBaseForm,
        ValueBaseOf,
        ValueCardinality,
        ValueCardinalityBit,
        ValueCardinalityOf,
        VariableRef,
      },
      [...nodeLaws, ...chardataLaws, ...attributeLaws, ...expressionLaws],
    );

    for (const relation of [
      Expression,
      Operand,
      Processing,
      VariableRef,
      ExpressionAttribute,
      ItemTiming,
      Literal,
      ProcessingTemplate,
      ...Object.values(referenceRelations),
    ]) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(expressionLaws).size, expressionLaws.length);
  }, 120_000);

  it("names each check by a law whose rule it keeps", () => {
    // Oracle: the rule table of plan §2.2 (P2, P8, P20 to P27, P29) and the C17 proofs' `derived`.
    const named = new Set(
      expressionLaws.flatMap((statement) => (statement.kind === "check" ? [statement.name] : [])),
    );

    assert.deepStrictEqual([...named].toSorted(), Object.keys(checkRules).toSorted());
  });

  it("types exactly OperatorArity's expression kinds, each once", () => {
    // Oracle: `OperatorArity`, read from the ASI XSD's expression group (`facets.ts`).
    const kinds = expressionTypings.map(({ kind }) => kind);

    assert.strictEqual(new Set(kinds).size, kinds.length);
    assert.deepStrictEqual(kinds.toSorted(), OperatorArity.rows.map(({ kind }) => kind).toSorted());
    assert.deepStrictEqual([...expressionKinds].toSorted(), kinds.toSorted());
  });

  it("gives every kind that takes operands the unknown base type, and no operand the any base type", () => {
    // Oracle: spec reading 4 (a type no declaration says passes every rule) and the information
    // model's Null, which no operand bit holds.
    for (const typing of expressionTypings.filter(({ lead }) => lead.length > 0)) {
      const bases = new Set(
        OperandBase.rows.filter(({ kind }) => kind === typing.kind).map(({ base }) => base),
      );

      assert.isTrue(bases.has("unknown"), typing.kind);
      assert.isFalse(bases.has("any"), typing.kind);
    }
  });

  it("reads each root's built-in variables from the installed BuiltInVariable, as reading 29 types them", () => {
    // Oracle: a second statement of the same facts, `builtInTypes` (spec reading 29: an item's
    // and a response processing template's `duration` a float, a test's and a section's a
    // `duration`; the UP audit's A63), against the installed relation's rows, each declaration
    // code read through `ValueBaseOf` and `ValueCardinalityOf`. Bound: every row of both.
    const itemRoots = new Set(["qti-assessment-item", "qti-response-processing"]);
    const testRoots = new Set(["qti-assessment-test", "qti-assessment-section"]);
    const valueOf = new Map(ValueBaseOf.rows.map(({ baseType, value }) => [baseType, value]));
    const cardinalityOf = new Map(
      ValueCardinalityOf.rows.map(({ cardinality, value }) => [cardinality, value]),
    );
    const installed = BuiltInVariable.rows.map(
      ({ baseType, cardinality, root, variable }) =>
        `${root} ${variable} ${valueOf.get(baseType) ?? "?"} ${cardinalityOf.get(cardinality) ?? "?"}`,
    );
    const stated = builtInTypes.flatMap(({ baseType, cardinality, test, variable }) =>
      [...(test ? testRoots : itemRoots)].map(
        (root) => `${root} ${variable} ${baseType} ${cardinality}`,
      ),
    );

    assert.strictEqual(new Set(installed).size, installed.length);
    assert.deepStrictEqual(installed.toSorted(), stated.toSorted());
  });

  it("states the declaration kinds of every reference by identifier processing makes, each row cited", () => {
    // Oracle: the information model's definitions of each processing element's `identifier`
    // (`referenceDeclarations`, each with its section and words), against `VariableReference`'s
    // rows over the processing kinds: every such reference has a row, and the installed
    // `ReferenceDeclaration` holds exactly the stated pairs. Bound: every processing reference by
    // `identifier`, 10 kinds.
    const stated = new Set(
      referenceDeclarations.flatMap(({ declarations, kind }) =>
        declarations.map((declaration) => `${kind} identifier ${declaration}`),
      ),
    );
    const referring = processingReferences
      .filter(({ attribute }) => attribute === "identifier")
      .map(({ kind }) => kind);

    assert.deepStrictEqual(
      referenceDeclarations.map(({ kind }) => kind).toSorted(),
      [...new Set(referring)].toSorted(),
    );
    assert.isTrue(referenceDeclarations.every(({ source }) => /^§\d/u.test(source)));
    assert.deepStrictEqual(
      [...setterKinds].toSorted(),
      [...setKindHandles, lookupKindHandle].toSorted(),
      "the setters are the rules that set their variable",
    );
    assert.deepStrictEqual(
      ReferenceDeclaration.rows
        .map(({ attribute, declaration, kind }) => `${kind} ${attribute} ${declaration}`)
        .toSorted(),
      [...stated].toSorted(),
    );
  });

  it("holds no rule kind among the expression kinds", () => {
    const rules = new Set<string>(ruleKindHandles);

    assert.deepStrictEqual(
      expressionKinds.filter((kind) => rules.has(kind)),
      [],
    );
  });

  it("gives every base type the pattern Typed value reads it by, one language per base type", () => {
    // Oracle: a second reading of the same rule, Q5.08's `Typed_value` sources: the installed
    // `ValueDomainOf` pattern of each domain `domainValues` names, its own boolean, point and pair
    // patterns, and every text for the unjudged base types. Bound: every `BaseType` handle.
    const installed = new Map(ValueDomainOf.rows.map(({ domain, pattern }) => [domain, pattern]));
    const own = new Map<string, string>([
      ["boolean", booleanValuePattern],
      ["directedPair", pairValuePattern],
      ["pair", pairValuePattern],
      ["point", pointValuePattern],
    ]);
    for (const baseType of BaseType.handles) {
      const domain = domainValues.find(({ baseTypes }) =>
        baseTypes.some((judged) => judged === baseType),
      )?.domain;
      const expected =
        domain === undefined
          ? (own.get(baseType) ?? installed.get(openDomain.handle))
          : installed.get(domain);

      assert.isDefined(expected, baseType);
      assert.strictEqual(
        BaseTypePattern.rows.find((row) => row.baseType === baseType)?.pattern,
        expected,
        baseType,
      );
    }

    assert.deepStrictEqual(
      BaseTypePattern.rows.map(({ baseType }) => baseType).toSorted(),
      [...BaseType.handles].toSorted(),
    );
    assert.deepStrictEqual([...unjudgedBaseTypes].toSorted(), ["file", "none", "string"]);
  });

  it("reads reading 34's boolean and reading 45's integer", () => {
    // Oracle: spec readings 34 (true and false only) and 45 (no bound on an integer).
    assert.deepStrictEqual(
      ["true", "false", " true ", "1", "0", "TRUE"].map((form) => patternOf("boolean").test(form)),
      [true, true, true, false, false, false],
    );
    assert.isTrue(patternOf("integer").test("1000000000000000000000000000001"));
    assert.deepStrictEqual(
      ["3 4", " 3 4 ", "3", "3 4 5", "a b"].map((form) => patternOf("point").test(form)),
      [true, true, false, false, false],
    );
  });

  it("names each published template's URI forms and no other", () => {
    // Oracle: the published URI forms, two prefixes, each with and without `.xml`.
    for (const template of rpTemplates.filter((handle) => handle !== "none")) {
      const pattern = new RegExp(rpTemplatePattern(template), "u");
      for (const prefix of [
        "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/",
        "https://www.imsglobal.org/question/qti_v3p0/rptemplates/",
      ]) {
        assert.isTrue(pattern.test(`${prefix}${template}`), template);
        assert.isTrue(pattern.test(`${prefix}${template}.xml`), template);
        assert.isFalse(pattern.test(`${prefix}${template}x.xml`), template);
      }
    }
  });
});

/**
 * The arity of every expression kind as the deleted seed held it
 * (`src/schema/seed/operator-arity.ts` at its deletion, the old deriver's `arity` output over the
 * ASI 3.0 XSD): the least and the most child expressions, `*` for no most.
 */
const seededArity = `
qti-base-value 0 0|qti-variable 0 0|qti-default 0 0|qti-correct 0 0|qti-map-response 0 0
qti-map-response-point 0 0|qti-math-constant 0 0|qti-null 0 0|qti-random-integer 0 0
qti-random-float 0 0|qti-number-correct 0 0|qti-number-incorrect 0 0|qti-number-presented 0 0
qti-number-responded 0 0|qti-number-selected 0 0|qti-outcome-minimum 0 0|qti-outcome-maximum 0 0
qti-test-variables 0 0|qti-and 1 *|qti-or 1 *|qti-not 1 1|qti-any-n 1 *|qti-match 2 2|qti-equal 2 2
qti-equal-rounded 2 2|qti-gt 2 2|qti-gte 2 2|qti-lt 2 2|qti-lte 2 2|qti-duration-lt 2 2
qti-duration-gte 2 2|qti-member 2 2|qti-contains 2 2|qti-delete 2 2|qti-substring 2 2
qti-string-match 2 2|qti-pattern-match 1 1|qti-inside 1 1|qti-multiple 0 *|qti-ordered 0 *
qti-repeat 1 *|qti-container-size 1 1|qti-is-null 1 1|qti-random 1 1|qti-index 1 1
qti-field-value 1 1|qti-sum 1 *|qti-product 1 *|qti-subtract 2 2|qti-divide 2 2|qti-power 2 2
qti-integer-divide 2 2|qti-integer-modulus 2 2|qti-integer-to-float 1 1|qti-round 1 1
qti-truncate 1 1|qti-round-to 1 1|qti-min 1 *|qti-max 1 *|qti-gcd 1 *|qti-lcm 1 *
qti-math-operator 1 *|qti-stats-operator 1 1|qti-custom-operator 0 *`
  .trim()
  .split(/[|\n]/u)
  .map((row) => row.split(" "))
  .map(([kind = "", min = "0", max = "*"]) => ({
    kind,
    max: max === "*" ? int8Max : BigInt(max),
    min: BigInt(min),
  }));

/**
 * The arity law as `Arity` states it, `between(operands, min, max)`, over a kind's installed row.
 *
 * @param kind - The expression's kind.
 * @param operands - Its operand count.
 * @returns Whether the law holds.
 */
const arityHolds = (kind: string, operands: bigint): boolean => {
  const row = OperatorArity.rows.find((held) => held.kind === kind);

  return row !== undefined && operands >= row.min && operands <= row.max;
};

/**
 * Run a kind's content automaton over `count` `qti-null` children.
 *
 * @param version - The schema version.
 * @param kind - The parent kind.
 * @param count - The number of children.
 * @returns Whether the automaton admits the sequence.
 */
const admits = (
  version: (typeof grammar.kinds.versions.handles)[number],
  kind: string,
  count: number,
) => {
  let state: Option.Option<number> = Option.some(0);
  for (let at = 0; at < count; at += 1) {
    state = state.pipe(
      Option.flatMap((was) => stepOf(grammar, { child: "qti-null", parent: kind, version }, was)),
    );
  }

  return Option.exists(state, (end) => contentEnds(grammar.content, version, kind, end));
};

describe("qti/expressions.ts, arity", () => {
  it("holds exactly at the seeded bounds, at min − 1, min, max and max + 1, for every kind", () => {
    // Oracle: a second implementation, the deleted seed's arity table, the old deriver's output
    // over the ASI 3.0 XSD, against `Arity` over the installed `OperatorArity`. Bound: all 64 kinds,
    // at min − 1 (where min > 0), min, max and max + 1 for a bounded kind, and min + 3 for an
    // unbounded one.
    assert.strictEqual(seededArity.length, 64);
    let judged = 0;
    for (const { kind, max, min } of seededArity) {
      const counts = [
        ...(min > 0n ? [min - 1n] : []),
        min,
        ...(max === int8Max ? [min + 3n] : [max, max + 1n]),
      ];
      for (const count of counts) {
        assert.strictEqual(
          arityHolds(kind, count),
          count >= min && count <= max,
          `${kind} ${count}`,
        );
        judged += 1;
      }
    }

    assert.isAtLeast(judged, 64 * 3);
  });

  it("never refuses a count each kind's content automaton admits within its bounds", () => {
    // Oracle: each kind's Glushkov automaton (`content.ts`), which admits every operand count in
    // [min, max]; it admits counts past them too, since a repeated group's bounds are no
    // automaton's, so `Arity` is the one law over them. Bound: every kind in both versions, every
    // count from min to max or min + 3.
    for (const version of grammar.kinds.versions.handles) {
      for (const { kind, max, min } of OperatorArity.rows) {
        const top = max === int8Max ? min + 3n : max;
        for (let count = min; count <= top; count += 1n) {
          assert.isTrue(admits(version, kind, Number(count)), `${kind} ${count} in ${version}`);
        }
      }
    }
  });
});

/**
 * A value a stored selection compares.
 */
type Value = boolean | string;

/**
 * A selection's predicate term as grizzle keeps it, each field optional.
 */
interface StoredTerm {
  readonly arg?: StoredTerm;
  readonly args?: readonly StoredTerm[];
  readonly field?: string;
  readonly fn?: string;
  readonly kind: string;
  readonly left?: StoredTerm;
  readonly op?: string;
  readonly right?: StoredTerm;
  readonly value?: Value;
  readonly values?: readonly Value[];
}

const ValueSchema = Schema.Union([Schema.Boolean, Schema.String]);

const isText = Schema.is(Schema.String);

const StoredTermSchema: Schema.Codec<StoredTerm> = Schema.Struct({
  arg: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  args: Schema.optionalKey(
    Schema.Array(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  ),
  field: Schema.optionalKey(Schema.String),
  fn: Schema.optionalKey(Schema.String),
  kind: Schema.String,
  left: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  op: Schema.optionalKey(Schema.String),
  right: Schema.optionalKey(Schema.suspend((): Schema.Codec<StoredTerm> => StoredTermSchema)),
  value: Schema.optionalKey(ValueSchema),
  values: Schema.optionalKey(Schema.Array(ValueSchema)),
});

const SideSchema = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({
      desc: Schema.Struct({ predicate: StoredTermSchema }),
      relation: Schema.Struct({ name: Schema.String }),
    }),
    Schema.Struct({ name: Schema.String }),
  ]),
  terms: Schema.Array(Schema.Unknown),
});

const ContainedSchema = Schema.Struct({
  kind: Schema.Literal("contained"),
  left: SideSchema,
  right: SideSchema,
});

/**
 * A row's values by field, as a selection's predicate reads them.
 */
type Row = Readonly<Record<string, Value>>;

/**
 * Evaluate a stored predicate term on a row. A term of a kind this does not read is no value, so a
 * predicate that holds one never holds.
 *
 * @param term - The term.
 * @param row - The row.
 * @returns Its value, none for a term of another kind.
 */
const valueOf = (term: StoredTerm, row: Row): Value | undefined => {
  const holds = (operand: StoredTerm | undefined) =>
    operand !== undefined && valueOf(operand, row) === true;
  const readers = new Map<string, () => Value | undefined>([
    ["and", () => (term.args ?? []).every((arg) => holds(arg))],
    [
      "compare",
      () =>
        term.left !== undefined && term.right !== undefined
          ? (valueOf(term.left, row) === valueOf(term.right, row)) === (term.op === "eq")
          : undefined,
    ],
    [
      "closedAt",
      () => {
        // A closed lookup of `VariableReference`'s spelling by a row's kind and attribute.
        const [kind, attribute] = (term.args ?? []).map((arg) => valueOf(arg, row));

        return term.field === "spelling"
          ? VariableReference.rows.find((r) => r.kind === kind && r.attribute === attribute)
              ?.spelling
          : undefined;
      },
    ],
    [
      "compute",
      () => {
        const [text, pattern] = (term.args ?? []).map((arg) => valueOf(arg, row));

        return term.fn === "matches" && isText(text) && isText(pattern)
          ? new RegExp(pattern, "u").test(text)
          : undefined;
      },
    ],
    ["field", () => (term.field === undefined ? undefined : row[term.field])],
    [
      "in",
      () => {
        const value = term.arg === undefined ? undefined : valueOf(term.arg, row);

        return value === undefined ? undefined : (term.values ?? []).includes(value);
      },
    ],
    ["literal", () => term.value],
    ["not", () => term.arg !== undefined && valueOf(term.arg, row) === false],
    ["or", () => (term.args ?? []).some((arg) => holds(arg))],
  ]);

  return readers.get(term.kind)?.();
};

type StoredSide = typeof SideSchema.Type;

/**
 * Whether a side of a statement holds a row: every row of a whole relation, a selection's row
 * where its predicate holds.
 *
 * @param side - The side.
 * @param row - The row.
 * @returns Whether it holds it.
 */
const selects = (side: StoredSide, row: Row): boolean =>
  "desc" in side.source ? valueOf(side.source.desc.predicate, row) === true : true;

const relationOf = (side: StoredSide): string =>
  "desc" in side.source ? side.source.relation.name : side.source.name;

/**
 * The expression layer's containments from one relation's terms into another's.
 *
 * @param from - The contained side's relation and terms.
 * @param to - The containing side's relation and terms.
 * @returns The containments.
 */
const containmentsOf = (
  from: readonly [string, ...string[]],
  to: readonly [string, ...string[]],
): readonly (typeof ContainedSchema.Type)[] =>
  expressionLaws.flatMap((statement) =>
    Option.toArray(Schema.decodeUnknownOption(ContainedSchema)(statement)).filter(
      ({ left, right }) =>
        relationOf(left) === from[0] &&
        relationOf(right) === to[0] &&
        left.terms.length === from.length - 1 &&
        right.terms.length === to.length - 1 &&
        left.terms.every((term, at) => term === from[at + 1]) &&
        right.terms.every((term, at) => term === to[at + 1]),
    ),
  );

const CheckSchema = Schema.Struct({
  desc: Schema.Struct({ predicate: StoredTermSchema }),
  kind: Schema.Literal("check"),
  name: Schema.String,
  relation: Schema.Struct({ name: Schema.String }),
});

describe("qti/expressions.ts, a test's braced reference that names no variable (reading R15-k)", () => {
  // Oracle: information model §9.3.4, "if a string appears to be a reference to a template or
  // outcome variable but there is no variable with the given name it should be treated simply as
  // string value", over the stored statements, evaluated on a row each.
  const pattern = { attribute: "pattern", kind: "qti-pattern-match" } as const;
  const bare = { attribute: "identifier", kind: "qti-variable" } as const;
  const unresolved = { form: "unsplit", identifier: "NOSUCH", source: "none" } as const;
  const [resolving, ...more] = containmentsOf(
    ["AssembledReference", "assembly", "node", "attribute"],
    ["Reading", "assembly", "node", "attribute"],
  );
  const [declared, ...moreChecks] = expressionLaws.flatMap((statement) =>
    Option.toArray(Schema.decodeUnknownOption(CheckSchema)(statement)).filter(
      ({ name, relation }) => name === "Variable_declared" && relation.name === "Reading",
    ),
  );

  it("needs no resolving reading of a braced reference, and one of a bare one", () => {
    assert.deepStrictEqual(more, []);
    assert.isDefined(resolving, "the reference's resolving reading");
    if (resolving !== undefined) {
      const reference = { role: "variable" };

      assert.isFalse(selects(resolving.left, { ...reference, ...pattern }), "a braced pattern");
      assert.isTrue(selects(resolving.left, { ...reference, ...bare }), "a bare identifier");
      assert.isFalse(
        selects(resolving.left, {
          ...reference,
          attribute: "identifier",
          kind: "qti-set-outcome-value",
        }),
        "a setter's is the other containment's",
      );
    }
  });

  it("declares a braced name no variable a string value, and a bare one still refused", () => {
    assert.deepStrictEqual(moreChecks, []);
    assert.isDefined(declared, "the reading's Variable_declared");
    if (declared !== undefined) {
      const holds = (row: Row) => valueOf(declared.desc.predicate, row) === true;

      assert.isTrue(holds({ ...unresolved, ...pattern }), "a braced pattern naming nothing");
      assert.isFalse(holds({ ...unresolved, ...bare }), "a bare identifier naming nothing");
      assert.isTrue(holds({ ...unresolved, ...bare, source: "declared" }));
      assert.isTrue(holds({ ...unresolved, ...bare, form: "split" }));
      assert.isTrue(holds({ ...unresolved, ...bare, identifier: "A.B" }));
    }
  });
});

describe("qti/expressions.ts, an LTI item ref", () => {
  const [lti] = linkResourceTypes;
  const reading = {
    form: "split",
    found: true,
    kind: "qti-variable",
    namedKind: itemRefKind,
    number: "",
    replaced: false,
    resourceType: lti ?? "none",
    source: "none",
  } as const;

  it("resolves a prefixed reference through an LTI item ref that names no variable, unchecked (reading 110)", () => {
    // Oracle: reading 110 as p15-2.1 amends it: an LTI link has no declarations to resolve
    // against, so `LTI01.SCORE` is accepted unchecked.
    assert.isDefined(lti, "an LTI resource type");

    const [resolving, ...more] = containmentsOf(
      ["AssembledReference", "assembly", "node", "attribute"],
      ["Reading", "assembly", "node", "attribute"],
    );
    assert.isDefined(resolving, "the reference's resolving reading");
    assert.deepStrictEqual(more, []);
    if (resolving !== undefined) {
      assert.isTrue(selects(resolving.right, reading), "an LTI item ref's reading resolves");
      assert.isFalse(
        selects(resolving.right, { ...reading, resourceType: "imsqti_item_xmlv3p0" }),
        "an item ref's item that declares no such variable still does not",
      );
      assert.isFalse(selects(resolving.right, { ...reading, resourceType: "none" }));
      assert.isFalse(selects(resolving.right, { ...reading, found: false }));
      assert.isFalse(
        selects(resolving.right, { ...reading, kind: "qti-set-outcome-value" }),
        "a setter's prefixed reading resolves nothing (reading 112)",
      );
      assert.isFalse(selects(resolving.right, { ...reading, form: "name" }));
    }
  });

  it("judges a variable mapping's source in an item, not in an LTI link's none", () => {
    // Oracle: reading 110: a variable mapping under an LTI item ref names no declaration of an
    // item (the host writes the nil document), and is accepted unchecked; a mapping under an item
    // ref still has its item and its source's declaration.
    const [document, ...moreDocuments] = containmentsOf(
      ["MappingSource", "itemRef", "itemDocument"],
      ["ItemRefDocument", "node", "document"],
    );
    assert.isDefined(document, "the mapping's item");
    assert.deepStrictEqual(moreDocuments, []);

    const [source, ...moreSources] = containmentsOf(
      [
        "MappingSource",
        "declaration",
        "itemDocument",
        "source",
        "declarationKind",
        "declBaseType",
        "declCardinality",
      ],
      [
        "Declaration",
        "node",
        "document",
        "identifier",
        "declarationKind",
        "baseType",
        "cardinality",
      ],
    );
    assert.isDefined(source, "the mapping's source declaration");
    assert.deepStrictEqual(moreSources, []);
    for (const side of [document?.left, source?.left]) {
      assert.isDefined(side);
      if (side !== undefined) {
        assert.isFalse(selects(side, { itemDocument: nilUuid }), "an LTI link's mapping");
        assert.isTrue(
          selects(side, { itemDocument: "11111111-1111-4111-8111-111111111111" }),
          "an item's mapping",
        );
      }
    }
  });

  it("still judges a template default under an LTI item ref, which has no template variables", () => {
    // Oracle: reading 110 keeps a template default under an LTI item ref refused (p15-37's brief).
    const [held, ...more] = containmentsOf(
      ["TemplateDefault", "itemRef", "itemDocument"],
      ["ItemRefDocument", "node", "document"],
    );
    assert.isDefined(held, "the template default's item");
    assert.deepStrictEqual(more, []);
    if (held !== undefined) {
      assert.isTrue(selects(held.left, { itemDocument: nilUuid }));
    }
  });
});
