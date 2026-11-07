/**
 * The closed relations of expressions and response bindings: `OperatorArity`, `BindingFit`,
 * `RecordBindingFit` and `MappableBaseType` (fin.md §17, "qti-pie, erased").
 *
 * Each generator is a function of a composition's rosters and its vocabularies' facets, which
 * state the rows in the shape the QTI vocabulary states them. A row naming a handle the
 * composition has no code for is refused by {@link closed}.
 *
 * None of the four has a version digit, because each holds in 3.0.0 and 3.0.1 alike: the ASI 3.0
 * and 3.0.1 XSDs give the same arity rows, which `expression.test.ts` checks over the pinned XSD
 * cache, and the binding and mapping rules are stated once for both versions.
 */
import { Option } from "effect";
import type { Array as Arr, Result } from "effect";
import { closed, idField, int8Max, valueField } from "#pantry/grammar/closed.ts";
import type {
  Closed,
  ClosedRelationError,
  IdField,
  Roster,
  ValueField,
} from "#pantry/grammar/closed.ts";
import type { ContentModel, Particle } from "#pantry/vocab/inventory/types.ts";

/**
 * The code spaces a composition gives the four relations' fields: each roster's handles in code
 * order, so a handle's code is its position.
 */
export interface Rosters {
  readonly baseTypes: Roster<string>;
  readonly cardinalities: Roster<string>;
  readonly kinds: Roster<string>;
}

/**
 * `OperatorArity`: kind → (min, max), the fewest and the most child expressions an expression
 * kind's content admits. A kind with no upper bound has `int8Max`, the top of a child count's
 * `int8` carrier, the bound that bounds nothing as its max.
 */
export type OperatorArity = Closed<
  readonly [IdField<"kind", string>],
  readonly [ValueField<"min", bigint>, ValueField<"max", bigint>]
>;

/**
 * `BindingFit`: the set of (base type, cardinality, kind) where an interaction of that kind may
 * bind a typed response variable of that base type and cardinality.
 */
export type BindingFit = Closed<
  readonly [IdField<"baseType", string>, IdField<"cardinality", string>, IdField<"kind", string>],
  readonly []
>;

/**
 * `RecordBindingFit`: the set of interaction kinds that may bind a record response variable.
 */
export type RecordBindingFit = Closed<readonly [IdField<"kind", string>], readonly []>;

/**
 * `MappableBaseType`: the set of base types a `qti-mapping` may be of.
 */
export type MappableBaseType = Closed<readonly [IdField<"baseType", string>], readonly []>;

/**
 * The child-expression multiplicity of one expression kind: the least count and the greatest.
 */
export interface Arity {
  readonly max: bigint;
  readonly min: bigint;
}

/**
 * One expression kind's arity, as a vocabulary states it.
 */
export interface ArityRow extends Arity {
  readonly kind: string;
}

/**
 * The base types and cardinalities an interaction's typed response variable may have: every
 * pairing of one of its base types with one of its cardinalities fits.
 */
export interface TypedFit {
  readonly baseTypes: Arr.NonEmptyReadonlyArray<string>;
  readonly cardinalities: Arr.NonEmptyReadonlyArray<string>;
  readonly kind: string;
}

/**
 * A vocabulary's share of the expression relations: its expression kinds' arities, its
 * interactions' typed bindings, and the interactions that may bind a record.
 */
export interface ExpressionFacet {
  readonly arities: readonly ArityRow[];
  readonly recordFits: readonly string[];
  readonly typedFits: readonly TypedFit[];
}

/**
 * The least and greatest number of element children a particle's valid contents hold, `Infinity`
 * for no greatest.
 */
interface ChildBounds {
  readonly max: number;
  readonly min: number;
}

/**
 * Count the element children a particle's valid contents hold, by XML Schema Part 1's occurrence
 * arithmetic (3.8.6, the effective total range): an element or a wildcard counts 1, a sequence the
 * sum of its particles', a choice the least or the greatest of its alternatives', each times the
 * particle's own bounds.
 *
 * @param particle - The particle.
 * @returns The least and greatest count.
 */
const childBoundsOf = (particle: Particle): ChildBounds => {
  const inner = ((): ChildBounds => {
    switch (particle._tag) {
      case "element":
      case "any": {
        return { max: 1, min: 1 };
      }
      case "group": {
        const parts = particle.particles.map(childBoundsOf);
        if (particle.compositor !== "choice") {
          return {
            max: parts.reduce((sum, { max }) => sum + max, 0),
            min: parts.reduce((sum, { min }) => sum + min, 0),
          };
        }

        return parts.length === 0
          ? { max: 0, min: 0 }
          : {
              max: Math.max(...parts.map(({ max }) => max)),
              min: Math.min(...parts.map(({ min }) => min)),
            };
      }
      default: {
        return particle satisfies never;
      }
    }
  })();
  const most = Option.getOrElse(particle.occurs.max, () => Number.POSITIVE_INFINITY);

  return {
    max: inner.max === 0 || most === 0 ? 0 : inner.max * most,
    min: inner.min * particle.occurs.min,
  };
};

/**
 * Read the arity of each expression kind from its content model: the least and greatest number of
 * child expressions its valid contents hold, `int8Max` for no greatest. A kind whose models in two
 * versions give different arities gives two rows, which `OperatorArity`'s key refuses, since the
 * relation has no version digit.
 *
 * @param models - The content-model IR.
 * @param kinds - The expression kinds.
 * @returns One row per expression kind and distinct arity, in the models' order.
 */
export const aritiesOf = (
  models: readonly ContentModel[],
  kinds: ReadonlySet<string>,
): readonly ArityRow[] => {
  const rows = new Map<string, ArityRow>();
  for (const { content, kind } of models) {
    if (kinds.has(kind)) {
      const bounds =
        content._tag === "element-only" || content._tag === "mixed"
          ? childBoundsOf(content.particle)
          : { max: 0, min: 0 };
      const row = {
        kind,
        max: Number.isFinite(bounds.max) ? BigInt(bounds.max) : int8Max,
        min: BigInt(bounds.min),
      };
      rows.set(`${kind} ${row.min} ${row.max}`, row);
    }
  }

  return [...rows.values()];
};

/**
 * The base types with no map key a mapping could compare, `duration` and `file`. Every other base
 * type is mappable.
 */
const withoutMapKey: ReadonlySet<string> = new Set(["duration", "file"]);

/**
 * Generate `OperatorArity` over a composition's kinds: one function, kind → (min, max).
 *
 * Its payload fields, `min` and `max`, are open-typed `int8` fields, each coded by its active
 * domain: the distinct values the rows hold, ascending, so the domain of `max` ends in
 * `int8Max`, the top of a child count's `int8` carrier, the bound that bounds nothing.
 *
 * @param input - The `NodeKind` roster and each vocabulary's facet.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.facets - The vocabularies' facets.
 * @returns The relation, or the reason it has no constant, such as an expression kind the
 *   composition does not hold.
 */
export const operatorArity = (input: {
  readonly facets: readonly ExpressionFacet[];
  readonly kinds: Roster<string>;
}): Result.Result<OperatorArity, ClosedRelationError> => {
  const rows = input.facets.flatMap((facet) => facet.arities);

  return closed({
    key: [idField("kind", input.kinds)],
    name: "OperatorArity",
    payload: [
      valueField(
        "min",
        rows.map((row) => row.min),
      ),
      valueField(
        "max",
        rows.map((row) => row.max),
      ),
    ],
    rows,
  });
};

/**
 * Generate `BindingFit` over a composition's rosters: a set over base type × cardinality × kind,
 * each interaction's product of base types and cardinalities.
 *
 * @param input - The rosters and each vocabulary's facet.
 * @param input.rosters - The `BaseType`, `TypedCardinality` and `NodeKind` rosters.
 * @param input.facets - The vocabularies' facets.
 * @returns The relation, or the reason it has no constant, such as an interaction kind the
 *   composition does not hold.
 */
export const bindingFit = (input: {
  readonly facets: readonly ExpressionFacet[];
  readonly rosters: Rosters;
}): Result.Result<BindingFit, ClosedRelationError> =>
  closed({
    key: [
      idField("baseType", input.rosters.baseTypes),
      idField("cardinality", input.rosters.cardinalities),
      idField("kind", input.rosters.kinds),
    ],
    name: "BindingFit",
    payload: [],
    rows: input.facets.flatMap((facet) =>
      facet.typedFits.flatMap(({ baseTypes, cardinalities, kind }) =>
        baseTypes.flatMap((baseType) =>
          cardinalities.map((cardinality) => ({ baseType, cardinality, kind })),
        ),
      ),
    ),
  });

/**
 * Generate `RecordBindingFit` over a composition's kinds: a set over kind.
 *
 * @param input - The `NodeKind` roster and each vocabulary's facet.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.facets - The vocabularies' facets.
 * @returns The relation, or the reason it has no constant.
 */
export const recordBindingFit = (input: {
  readonly facets: readonly ExpressionFacet[];
  readonly kinds: Roster<string>;
}): Result.Result<RecordBindingFit, ClosedRelationError> =>
  closed({
    key: [idField("kind", input.kinds)],
    name: "RecordBindingFit",
    payload: [],
    rows: input.facets.flatMap((facet) => facet.recordFits.map((kind) => ({ kind }))),
  });

/**
 * Generate `MappableBaseType` over a composition's base types: a set over base type, holding
 * every base type that has a map key.
 *
 * @param baseTypes - The `BaseType` roster.
 * @returns The relation, or the reason it has no constant.
 */
export const mappableBaseType = (
  baseTypes: Roster<string>,
): Result.Result<MappableBaseType, ClosedRelationError> =>
  closed({
    key: [idField("baseType", baseTypes)],
    name: "MappableBaseType",
    payload: [],
    rows: baseTypes.handles
      .filter((baseType) => !withoutMapKey.has(baseType))
      .map((baseType) => ({ baseType })),
  });

/**
 * The number of arguments an operator of Content MathML takes when an `m:apply` applies it, by its
 * operator class (MathML 3, §4.3.4 Operator Classes), and the qualifiers it takes beside them.
 */
export interface MathArity {
  /**
   * The greatest count, `Infinity` for no greatest (as the importer's `OperatorArity` writes
   * `int8Max`).
   */
  readonly max: number;
  readonly min: number;
  /**
   * The qualifier kinds its syntax table lists ("Qualifiers"), which are no argument.
   */
  readonly qualifiers: readonly string[];
  /**
   * The section of MathML 3 whose syntax table gives its class.
   */
  readonly section: string;
}

/**
 * The unary operators of Content MathML, each with the section of its syntax table: the classes
 * unary-arith, unary-functional, unary-logical, unary-set, unary-elementary, unary-veccalc and
 * unary-linalg, of which MathML 3 §4.3.4.6 says "Unary operators take a single argument". `minus`
 * and `root`, which are binary-arith as well, are {@link binaryOrUnary}. `moment` is left out: its
 * class is unary-functional, but the Recommendation's own example applies it to five arguments
 * (§4.4.8.6,
 * `<apply><moment/><degree>…</degree><momentabout>…</momentabout><cn>6</cn>…<cn>5</cn></apply>`),
 * so its class states no count the Recommendation keeps.
 */
const unaryOperators: readonly (readonly [string, string])[] = [
  ["inverse", "4.4.1.2"],
  ["ident", "4.4.1.5"],
  ["domain", "4.4.1.6"],
  ["codomain", "4.4.1.7"],
  ["image", "4.4.1.8"],
  ["factorial", "4.4.2.2"],
  ["not", "4.4.2.16"],
  ["abs", "4.4.2.20"],
  ["conjugate", "4.4.2.21"],
  ["arg", "4.4.2.22"],
  ["real", "4.4.2.23"],
  ["imaginary", "4.4.2.24"],
  ["floor", "4.4.2.26"],
  ["ceiling", "4.4.2.27"],
  ["divergence", "4.4.4.4"],
  ["grad", "4.4.4.5"],
  ["curl", "4.4.4.6"],
  ["laplacian", "4.4.4.7"],
  ["card", "4.4.5.12"],
  ...["sin", "cos", "tan", "sec", "csc", "cot"].map((name) => [name, "4.4.7.1"] as const),
  ...["arcsin", "arccos", "arctan", "arcsec", "arccsc", "arccot"].map(
    (name) => [name, "4.4.7.2"] as const,
  ),
  ...["sinh", "cosh", "tanh", "sech", "csch", "coth"].map((name) => [name, "4.4.7.3"] as const),
  ...["arcsinh", "arccosh", "arctanh", "arcsech", "arccsch", "arccoth"].map(
    (name) => [name, "4.4.7.4"] as const,
  ),
  ["exp", "4.4.7.5"],
  ["ln", "4.4.7.6"],
  ["log", "4.4.7.7"],
  ["determinant", "4.4.9.4"],
  ["transpose", "4.4.9.5"],
];

/**
 * The binary operators of Content MathML, each with the section of its syntax table: the classes
 * binary-arith, binary-logical, binary-reln, binary-set and binary-linalg, of which MathML 3
 * §4.3.4.5 says "Binary operators take two arguments".
 */
const binaryOperators: readonly (readonly [string, string])[] = [
  ["quotient", "4.4.2.1"],
  ["divide", "4.4.2.3"],
  ["power", "4.4.2.8"],
  ["rem", "4.4.2.9"],
  ["implies", "4.4.2.17"],
  ["neq", "4.4.3.2"],
  ["equivalent", "4.4.3.7"],
  ["approx", "4.4.3.8"],
  ["factorof", "4.4.3.9"],
  ["in", "4.4.5.5"],
  ["notin", "4.4.5.6"],
  ["notsubset", "4.4.5.9"],
  ["notprsubset", "4.4.5.10"],
  ["setdiff", "4.4.5.11"],
  ["tendsto", "4.4.6.4"],
  ["vectorproduct", "4.4.9.7"],
  ["scalarproduct", "4.4.9.8"],
  ["outerproduct", "4.4.9.9"],
];

/**
 * The two operators whose syntax tables give both classes, unary-arith and binary-arith: `minus`
 * (§4.4.2.6) and `root` (§4.4.2.11), one argument or two.
 */
const binaryOrUnary: readonly (readonly [string, string])[] = [
  ["minus", "4.4.2.6"],
  ["root", "4.4.2.11"],
];

/**
 * The qualifier kinds of Content MathML's `apply` (`mathml3-content.rnc`, `BvarQ`, `DomainQ` and
 * `Qualifier`), `interval` among them since `DomainQ` admits it: an `m:apply` holding one beside
 * an operator here, other than the operator's own, is a binding or qualified application whose
 * argument count no class states, and `interval` may be read as an argument or a qualifier, so
 * spec reading 2's arity law does not judge it.
 */
export const mathQualifiers: ReadonlySet<string> = new Set([
  "m:bvar",
  "m:condition",
  "m:degree",
  "m:domainofapplication",
  "m:interval",
  "m:logbase",
  "m:lowlimit",
  "m:momentabout",
  "m:uplimit",
]);

/**
 * The operators whose class takes at least a number of arguments and no more: `selector`, class
 * nary-linalg, "accepts one or more arguments" (MathML 3 §4.4.9.6). Each is its name, least count
 * and section.
 */
const unboundedOperators: readonly (readonly [string, number, string])[] = [
  ["selector", 1, "4.4.9.6"],
];

/**
 * One qualifier an operator's syntax table lists beside its arguments.
 */
export interface HeadQualifier {
  /**
   * The operator the qualifier stands beside, an `m:` kind.
   */
  readonly head: string;
  /**
   * The qualifier, an `m:` kind.
   */
  readonly qualifier: string;
  /**
   * The section of MathML 3 whose syntax table lists it.
   */
  readonly section: string;
}

/**
 * The head-specific qualifiers of Content MathML, one row per head and qualifier
 * (R6-head-qualifiers; MathML 3 §4.3.3, "Qualifiers", and each operator's syntax table in §4.4):
 * `degree` beside `root` (§4.4.2.11), `moment` (§4.4.8.6), `diff` (§4.4.4.2) and `partialdiff`
 * (§4.4.4.3); `momentabout` beside `moment`; `logbase` beside `log` (§4.4.7.7). The qualifiers
 * every binding application shares, `bvar` and the limits, are {@link mathQualifiers}; these three
 * belong to a head, and any other operator that holds one is wrong.
 */
export const mathHeadQualifiers: readonly HeadQualifier[] = [
  { head: "m:root", qualifier: "m:degree", section: "4.4.2.11" },
  { head: "m:diff", qualifier: "m:degree", section: "4.4.4.2" },
  { head: "m:partialdiff", qualifier: "m:degree", section: "4.4.4.3" },
  { head: "m:log", qualifier: "m:logbase", section: "4.4.7.7" },
  { head: "m:moment", qualifier: "m:degree", section: "4.4.8.6" },
  { head: "m:moment", qualifier: "m:momentabout", section: "4.4.8.6" },
];

/**
 * Each Content MathML operator's argument count under `m:apply` (spec reading 2, MathML 3 §4.3.4.5
 * and §4.3.4.6, and §4.1.5: the Class row "indicate[s] how many arguments the operator represented
 * by this element takes"), by its kind.
 */
export const mathArities: ReadonlyMap<string, MathArity> = new Map(
  [
    ...unaryOperators.map(([name, section]) => [`m:${name}`, { max: 1, min: 1, section }] as const),
    ...binaryOperators.map(
      ([name, section]) => [`m:${name}`, { max: 2, min: 2, section }] as const,
    ),
    ...binaryOrUnary.map(([name, section]) => [`m:${name}`, { max: 2, min: 1, section }] as const),
    ...unboundedOperators.map(
      ([name, min, section]) => [`m:${name}`, { max: Infinity, min, section }] as const,
    ),
    ...["partialdiff"].map(
      (name) => [`m:${name}`, { max: 2, min: 2, section: "4.4.4.3" }] as const,
    ),
  ].map(([kind, arity]): readonly [string, MathArity] => [
    kind,
    {
      ...arity,
      qualifiers: mathHeadQualifiers
        .filter(({ head }) => head === kind)
        .map(({ qualifier }) => qualifier),
    },
  ]),
);

/**
 * The n-ary and quantifier operators of MathML 3 §4.4 whose syntax tables list none of
 * `degree`, `momentabout` and `logbase`: the classes nary-arith, nary-logical, nary-reln, nary-set,
 * nary-stats and nary-functional (§4.3.4.7), and the quantifiers `forall` and `exists` (§4.4.3).
 * Unary and binary operators are the keys of {@link mathArities}.
 */
const unqualifiedOperators: readonly string[] = [
  "plus",
  "times",
  "max",
  "min",
  "gcd",
  "lcm",
  "compose",
  "and",
  "or",
  "xor",
  "union",
  "intersect",
  "cartesianproduct",
  "eq",
  "gt",
  "lt",
  "geq",
  "leq",
  "mean",
  "median",
  "mode",
  "sdev",
  "variance",
  "forall",
  "exists",
].map((name) => `m:${name}`);

/**
 * The operator kinds the head-qualifier law judges (R6-head-qualifiers): every key of
 * {@link mathArities}, every head of {@link mathHeadQualifiers}, and the n-ary and quantifier
 * operators that take no head qualifier. A `degree`, `momentabout` or `logbase` beside one of them
 * is a qualifier its operator does not list.
 */
export const mathHeadOperators: ReadonlySet<string> = new Set([
  ...mathArities.keys(),
  ...mathHeadQualifiers.map(({ head }) => head),
  ...unqualifiedOperators,
]);

/**
 * The mathematical form a part of a `cn`'s content takes (MathML 3 §4.2.1).
 */
export type CnForm = "double" | "hexdouble" | "integer" | "real";

/**
 * What a `cn`'s `type` implies for its content (MathML 3 §4.2.1; R6-hexdouble): the form of each
 * part, in order, the parts being separated by `m:sep`. Every other `type`, `constant` among them,
 * is text and is not listed.
 */
export const cnForms: ReadonlyMap<string, readonly CnForm[]> = new Map<string, readonly CnForm[]>([
  ["complex-cartesian", ["real", "real"]],
  ["complex-polar", ["real", "real"]],
  ["double", ["double"]],
  ["e-notation", ["real", "integer"]],
  ["hexdouble", ["hexdouble"]],
  ["integer", ["integer"]],
  ["rational", ["integer", "integer"]],
  ["real", ["real"]],
]);

/**
 * The `type` of a `cn` that has none (§4.2.1: "If the type attribute is omitted, it defaults to
 * real").
 */
export const cnDefaultType = "real";

/**
 * The class of the digits of a base from 2 to 36: `0-9` and then the Latin letters in alphabetical
 * order, case not significant, each with a value below the base.
 */
const digitClassOf = (base: number): string => {
  if (base <= 10) {
    return `[0-${String(base - 1)}]`;
  }

  const last = String.fromCodePoint(86 + base);

  return `[0-9a-${last}A-${last.toUpperCase()}]`;
};

/**
 * The lexical space of `xs:double` (XML Schema Part 2, §3.2.5.1).
 */
const doublePattern = "[+-]?([0-9]+(\\.[0-9]*)?|\\.[0-9]+)([Ee][+-]?[0-9]+)?|[+-]?INF|NaN";

/**
 * The pattern of a form over a part's collapsed text, in XML Schema's regular expressions (which
 * anchor themselves), by the digits of a base (R6-hexdouble; MathML 3 §4.2.1).
 *
 * An integer is an optional `-` or `+` and one or more digits. A real is that sign, then digits
 * with at most one point, one side of which may be empty. A double is the `xs:double` lexical space
 * and a hexdouble sixteen hex digits, neither of which reads the base.
 *
 * @param form - The form a part takes.
 * @param base - The radix of an integer's and a real's digits.
 * @returns The pattern, or nothing for an integer or a real whose base is not a whole number from 2
 *   to 36, where the digits beyond the alphabet are application specific.
 */
export const cnPatternOf = (form: CnForm, base: number): Option.Option<string> => {
  if (form === "double") {
    return Option.some(doublePattern);
  }

  if (form === "hexdouble") {
    return Option.some("[0-9A-Fa-f]{16}");
  }

  if (!Number.isInteger(base) || base < 2 || base > 36) {
    return Option.none();
  }

  const digit = digitClassOf(base);

  return Option.some(
    form === "integer" ? `[+-]?${digit}+` : `[+-]?(${digit}+(\\.${digit}*)?|\\.${digit}+)`,
  );
};

// Expression typing (O4, plan §1.7; the W5 amendment's C6, C16 and C17; Q5.10).

/**
 * The base types an expression's value is typed with, in code order: the `ValueBase` roster's
 * handles. These are expression-typing codes, not QTI's declaration codes: QTI's eleven base types,
 * spelled as `BaseType` spells them, then `any`, the type of `qti-null`, whose value "is treated as
 * if it is of any desired base-type" (information model §2.11.1.4, Null), and `unknown`, the type
 * of a value no declaration of its document types: a response processing template's parameter, a
 * test's item variable, a record's field, a custom operator's result. `ValueBaseOf` maps `BaseType`
 * onto it, `none` (a record's base type) onto `unknown`.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#ExprNull | QTI 3.0 information model, Null}
 */
export const valueBases = [
  "boolean",
  "integer",
  "float",
  "string",
  "identifier",
  "uri",
  "duration",
  "point",
  "pair",
  "directedPair",
  "file",
  "any",
  "unknown",
] as const;

/**
 * A `ValueBase` handle.
 */
export type ValueBase = (typeof valueBases)[number];

/**
 * The cardinalities an expression's value is typed with, in code order: the `ValueCardinality`
 * roster's handles. QTI's four cardinalities, then `unknown`, the cardinality of `qti-null` and of
 * a value no declaration types. `ValueCardinalityOf` maps `Cardinality` onto it.
 */
export const valueCardinalities = ["single", "multiple", "ordered", "record", "unknown"] as const;

/**
 * A `ValueCardinality` handle.
 */
export type ValueCardinality = (typeof valueCardinalities)[number];

/**
 * The processing languages an expression or a rule is written in, in code order: the `Language`
 * roster's handles. Response, outcome and template processing, the three roots' (information model
 * §2.6 to §2.8), and `none` for an expression outside every processing root, such as a test's
 * branch rule or precondition, or a rule a fallback holds.
 */
export const languages = ["response", "outcome", "template", "none"] as const;

/**
 * A `Language` handle.
 */
export type Language = (typeof languages)[number];

/**
 * How a processing reference names its variable, in code order: the `ReferenceResolution`
 * roster's handles.
 * `declared`, a declaration of its document; `builtIn`, one of the built-in variables
 * (`BuiltInVariable`); `unresolved`, neither, which only a document that is no item may hold: a
 * response processing template's parameters and a test's item variables are declared elsewhere.
 */
export const resolutions = ["declared", "builtIn", "unresolved"] as const;

/**
 * The tables a processing reference needs its declaration to hold, in code order: the
 * `ReferencedTable` roster's handles. `qti-map-response` needs a `qti-mapping` and
 * `qti-map-response-point` a `qti-area-mapping` (information model §2.11.3.29 and §2.11.3.30);
 * `qti-lookup-outcome-value` a `qti-match-table` or a `qti-interpolation-table` (§2.5.1.4); every
 * other reference `none`.
 */
export const referencedTables = [
  "none",
  "qti-mapping",
  "qti-area-mapping",
  "qti-match-table",
  "qti-interpolation-table",
] as const;

/**
 * A `ReferencedTable` handle.
 */
export type ReferencedTable = (typeof referencedTables)[number];

/**
 * Which table each processing reference reads of its variable's declaration, in the order a
 * reference reads them: `qti-map-response` a `qti-mapping`, `qti-map-response-point` a
 * `qti-area-mapping` (information model §2.11.3.29 and §2.11.3.30), and `qti-lookup-outcome-value`
 * a `qti-match-table`, else a `qti-interpolation-table` (§2.5.1.4). Every other reference reads
 * none. The `TableReader` relation holds these rows, and the importer's reading of a reference's
 * table follows them.
 */
export const tableReaders = [
  { kind: "qti-map-response", table: "qti-mapping" },
  { kind: "qti-map-response-point", table: "qti-area-mapping" },
  { kind: "qti-lookup-outcome-value", table: "qti-match-table" },
  { kind: "qti-lookup-outcome-value", table: "qti-interpolation-table" },
] as const satisfies readonly { readonly kind: string; readonly table: ReferencedTable }[];

/**
 * The response processing templates 1EdTech publishes, in code order: the `RpTemplate` roster's
 * handles, `none` for a `template` URI that names none of them. The two forms of the published
 * URI prefix, each with or without `.xml`, name each (QTI 3.0 implementation guide, Response
 * Processing Templates; the corpus's `rptemplates/` documents).
 */
export const rpTemplates = [
  "none",
  "match_correct",
  "map_response",
  "map_response_point",
  "CC2_match",
  "CC2_match_basic",
  "CC2_map_response",
] as const;

/**
 * An `RpTemplate` handle.
 */
export type RpTemplate = (typeof rpTemplates)[number];

/**
 * The URI prefixes a published template's `template` URI is written under.
 */
export const rpTemplatePrefixes = [
  "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/",
  "https://www.imsglobal.org/question/qti_v3p0/rptemplates/",
] as const;

/**
 * XML whitespace, `S`, possibly none, as a pattern's piece.
 */
const ws = "[\\t\\n\\r ]*";

/**
 * Escape a literal for a pattern: every character the pattern grammar reads as syntax.
 *
 * @param text - The literal.
 * @returns It, each syntax character behind a backslash.
 */
const escaped = (text: string): string => text.replaceAll(/[.*+?^${}()|[\]\\/-]/gu, "\\$&");

/**
 * The pattern each published template's `template` URI matches: either prefix, the template's
 * name, an optional `.xml`, with the whitespace an `xs:anyURI` collapses around it.
 *
 * @param template - The template.
 * @returns The anchored pattern.
 */
export const rpTemplatePattern = (template: Exclude<RpTemplate, "none">): string =>
  `^${ws}(?:${rpTemplatePrefixes.map(escaped).join("|")})${escaped(template)}(?:\\.xml)?${ws}$`;

/**
 * How an expression kind's result type follows from its operands and its attributes, beside the
 * closed sets of results it may take at all (`ResultBase`, `ResultCardinality`):
 *
 * - `fixed`: the sets are one type, and say it all;
 * - `numeric`: `integer` when every typed operand is an integer, `unknown` when one is unknown, else
 *   `float` (information model §2.11.3: Sum, Product, Subtract, Min, Max);
 * - `container`: its operands' one base type, `any` for none, `unknown` for several;
 * - `first`: its one operand's base type (Index, Random);
 * - `second`: its second operand's type (Delete);
 * - `declared`: the type of the variable its `identifier` names (Variable, Default, Correct);
 * - `attribute`: its own attribute's (BaseValue's and TestVariables' `base-type`, MathOperator's
 *   `name`).
 */
export type Typing =
  | "attribute"
  | "container"
  | "declared"
  | "first"
  | "fixed"
  | "numeric"
  | "second";

/**
 * One expression kind's typing: the base types and cardinalities its operands may have, its first
 * operand's and its later operands' apart, whether they must share one base type or one
 * cardinality, the results it may give and how, and whether only outcome processing admits it.
 * `unknown` is no operand's restriction: an operand of a type no declaration says passes every
 * rule, as the information model's typing defers it (spec reading 4).
 */
export interface ExpressionTyping {
  readonly kind: string;
  readonly lead: readonly ValueCardinality[];
  readonly oneBase: boolean;
  readonly oneCardinality: boolean;
  readonly operandBases: readonly ValueBase[];
  readonly outcomeOnly: boolean;
  readonly resultBases: readonly ValueBase[];
  readonly resultCardinalities: readonly ValueCardinality[];
  readonly tail: readonly ValueCardinality[];
  readonly typing: Typing;
}

/**
 * QTI's eleven base types, the typed values an operand may hold.
 */
const allBases: readonly ValueBase[] = valueBases.filter(
  (base) => base !== "any" && base !== "unknown",
);

/**
 * The numerical base types: integer and float, never duration (information model §2.11.3, the
 * comparison operators' "numerical base-type"; Duration Lt and Duration Gte take durations apart).
 */
const numerical: readonly ValueBase[] = ["integer", "float"];

/**
 * Every base type but duration, which Match, Member and Contains refuse ("not of base-type
 * duration", information model §2.11.3.28, §2.11.3.33 and §2.11.3.8).
 */
const notDuration: readonly ValueBase[] = allBases.filter((base) => base !== "duration");

/**
 * QTI's four cardinalities.
 */
const allCardinalities: readonly ValueCardinality[] = ["single", "multiple", "ordered", "record"];

/**
 * Every cardinality but record.
 */
const notRecord: readonly ValueCardinality[] = ["single", "multiple", "ordered"];

/**
 * The containers, multiple and ordered.
 */
const containers: readonly ValueCardinality[] = ["multiple", "ordered"];

/**
 * A kind that takes operands, every one of the same base types and cardinalities.
 *
 * @param kind - The kind.
 * @param operandBases - The base types its operands may have.
 * @param cardinalities - The cardinalities its operands may have.
 * @param result - Its result.
 * @returns The typing, its result fixed unless `result` says how.
 */
const operator = (
  kind: string,
  operandBases: readonly ValueBase[],
  cardinalities: readonly ValueCardinality[],
  result: Pick<ExpressionTyping, "resultBases" | "resultCardinalities" | "typing">,
  shared: Partial<Pick<ExpressionTyping, "oneBase" | "oneCardinality">> = {},
): ExpressionTyping => ({
  kind,
  lead: cardinalities,
  oneBase: shared.oneBase ?? false,
  oneCardinality: shared.oneCardinality ?? false,
  operandBases,
  outcomeOnly: false,
  resultBases: result.resultBases,
  resultCardinalities: result.resultCardinalities,
  tail: cardinalities,
  typing: result.typing,
});

/**
 * A fixed result of one type.
 *
 * @param base - Its base type.
 * @param cardinality - Its cardinality.
 * @returns The result.
 */
const fixed = (
  base: ValueBase,
  cardinality: ValueCardinality,
): Pick<ExpressionTyping, "resultBases" | "resultCardinalities" | "typing"> => ({
  resultBases: [base],
  resultCardinalities: [cardinality],
  typing: "fixed",
});

/**
 * A kind with no operand, of one fixed type.
 *
 * @param kind - The kind.
 * @param base - Its result's base type.
 * @param cardinality - Its result's cardinality.
 * @param outcomeOnly - Whether only outcome processing admits it.
 * @returns The typing.
 */
const leaf = (
  kind: string,
  base: ValueBase,
  cardinality: ValueCardinality,
  outcomeOnly = false,
): ExpressionTyping => ({
  ...operator(kind, [], [], fixed(base, cardinality)),
  outcomeOnly,
});

/**
 * A boolean single result, every predicate's.
 */
const predicate = fixed("boolean", "single");

/**
 * The typing of every QTI expression kind, read against the information model's normative class
 * tables (§6.9 and §6.30, each kind's "sub-expressions" and "result" sentences; §2.11 says the
 * same, and is not normative) and the old checker's P23 table (`docs/goals/qti/phase-3.md` 4.10),
 * which this replaces. A leaf whose table leaves its type open (`qti-null`, `qti-test-variables`
 * with no `base-type`) is typed `unknown`; `expression-spec.oracle.test.ts` holds every leaf to its
 * table. `expression.test.ts` holds its kinds to
 * `OperatorArity`'s, the 64 the ASI XSD's expression group names.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Expr3 | QTI 3.0 information model, §2.11.3 Operators}
 */
export const expressionTypings: readonly ExpressionTyping[] = [
  ...["qti-and", "qti-any-n", "qti-not", "qti-or"].map((kind) =>
    operator(kind, ["boolean"], ["single"], predicate),
  ),
  {
    ...leaf("qti-base-value", "boolean", "single"),
    resultBases: allBases,
    typing: "attribute",
  },
  operator("qti-container-size", allBases, containers, fixed("integer", "single")),
  operator("qti-contains", notDuration, containers, predicate, {
    oneBase: true,
    oneCardinality: true,
  }),
  ...["qti-correct", "qti-default", "qti-variable"].map((kind): ExpressionTyping => ({
    ...leaf(kind, "unknown", "unknown"),
    resultBases: [...allBases, "unknown"],
    resultCardinalities: valueCardinalities,
    typing: "declared",
  })),
  operator("qti-custom-operator", allBases, allCardinalities, fixed("unknown", "unknown")),
  {
    ...operator(
      "qti-delete",
      allBases,
      containers,
      {
        resultBases: valueBases,
        resultCardinalities: valueCardinalities,
        typing: "second",
      },
      { oneBase: true },
    ),
    lead: ["single"],
  },
  ...["qti-duration-gte", "qti-duration-lt"].map((kind) =>
    operator(kind, ["duration"], ["single"], predicate),
  ),
  ...["qti-equal", "qti-equal-rounded", "qti-gt", "qti-gte", "qti-lt", "qti-lte"].map((kind) =>
    operator(kind, numerical, ["single"], predicate),
  ),
  operator("qti-field-value", allBases, ["record"], fixed("unknown", "single")),
  ...["qti-gcd", "qti-lcm"].map((kind) =>
    operator(kind, ["integer"], notRecord, fixed("integer", "single")),
  ),
  ...["qti-index", "qti-random"].map((kind) =>
    operator(kind, allBases, containers, {
      resultBases: valueBases,
      resultCardinalities: ["single"],
      typing: "first",
    }),
  ),
  operator("qti-inside", ["point"], notRecord, predicate),
  ...(
    [
      ["qti-integer-divide", "integer"],
      ["qti-integer-modulus", "integer"],
      ["qti-integer-to-float", "float"],
    ] as const
  ).map(([kind, result]) => operator(kind, ["integer"], ["single"], fixed(result, "single"))),
  operator("qti-is-null", allBases, allCardinalities, predicate),
  leaf("qti-map-response", "float", "single"),
  leaf("qti-map-response-point", "float", "single"),
  operator("qti-match", notDuration, allCardinalities, predicate, {
    oneBase: true,
    oneCardinality: true,
  }),
  leaf("qti-math-constant", "float", "single"),
  operator("qti-math-operator", numerical, ["single"], {
    resultBases: numerical,
    resultCardinalities: ["single"],
    typing: "attribute",
  }),
  ...["qti-max", "qti-min", "qti-product", "qti-sum"].map((kind) =>
    operator(kind, numerical, notRecord, {
      resultBases: ["integer", "float", "unknown"],
      resultCardinalities: ["single"],
      typing: "numeric",
    }),
  ),
  operator("qti-subtract", numerical, ["single"], {
    resultBases: ["integer", "float", "unknown"],
    resultCardinalities: ["single"],
    typing: "numeric",
  }),
  {
    ...operator("qti-member", notDuration, containers, predicate, { oneBase: true }),
    lead: ["single"],
  },
  operator(
    "qti-multiple",
    allBases,
    ["single", "multiple"],
    { resultBases: valueBases, resultCardinalities: ["multiple"], typing: "container" },
    { oneBase: true },
  ),
  ...["qti-ordered", "qti-repeat"].map((kind) =>
    operator(
      kind,
      allBases,
      ["single", "ordered"],
      { resultBases: valueBases, resultCardinalities: ["ordered"], typing: "container" },
      { oneBase: true },
    ),
  ),
  leaf("qti-null", "any", "unknown"),
  ...[
    "qti-number-correct",
    "qti-number-incorrect",
    "qti-number-presented",
    "qti-number-responded",
    "qti-number-selected",
  ].map((kind) => leaf(kind, "integer", "single", true)),
  // Tables 6.9.64 and 6.9.65 (normative, both versions): "the result has cardinality multiple and
  // base-type float", NULL where an item declares no maximum.
  ...["qti-outcome-maximum", "qti-outcome-minimum"].map((kind) =>
    leaf(kind, "float", "multiple", true),
  ),
  ...["qti-pattern-match", "qti-string-match", "qti-substring"].map((kind) =>
    operator(kind, ["string"], ["single"], predicate),
  ),
  ...(
    [
      ["qti-divide", "float"],
      ["qti-power", "float"],
      ["qti-round", "integer"],
      ["qti-round-to", "float"],
      ["qti-truncate", "integer"],
    ] as const
  ).map(([kind, result]) => operator(kind, numerical, ["single"], fixed(result, "single"))),
  leaf("qti-random-float", "float", "single"),
  leaf("qti-random-integer", "integer", "single"),
  operator("qti-stats-operator", numerical, containers, fixed("float", "single")),
  {
    ...leaf("qti-test-variables", "unknown", "multiple", true),
    resultBases: [...allBases, "unknown"],
    typing: "attribute",
  },
];

/**
 * Whether a kind takes operands: a leaf's operand sets are empty, so no operand rule reads it.
 *
 * @param typing - The kind's typing.
 * @returns Whether its operands have any cardinality.
 */
const takesOperands = (typing: ExpressionTyping): boolean => typing.lead.length > 0;

/**
 * `OperandBase`: the set of (kind, base) where an operand of an expression of the kind may be of
 * the base type. A kind that takes operands admits `unknown` beside its own, and `any` is no
 * operand's bit (`ValueBaseBit`), so an operand no declaration types breaks no rule.
 *
 * @param typings - The kinds' typings.
 * @returns The rows, each (kind, base) once.
 */
export const operandBaseRows = (
  typings: readonly ExpressionTyping[],
): readonly { readonly base: ValueBase; readonly kind: string }[] =>
  typings.flatMap((typing) =>
    takesOperands(typing)
      ? [...typing.operandBases, "unknown" as const].map((base) => ({ base, kind: typing.kind }))
      : [],
  );

/**
 * `LeadCardinality` or `TailCardinality`: the set of (kind, cardinality) where an expression's
 * first operand, or a later one, may be of the cardinality. Only Member and Delete tell them
 * apart.
 *
 * @param typings - The kinds' typings.
 * @param place - Which operands: the first, `lead`, or the later ones, `tail`.
 * @returns The rows, each (kind, cardinality) once.
 */
export const placeCardinalityRows = (
  typings: readonly ExpressionTyping[],
  place: "lead" | "tail",
): readonly { readonly cardinality: ValueCardinality; readonly kind: string }[] =>
  typings.flatMap((typing) =>
    typing[place].map((cardinality) => ({ cardinality, kind: typing.kind })),
  );

/**
 * `ResultBase`: the set of (kind, base) an expression of the kind may be typed with.
 *
 * @param typings - The kinds' typings.
 * @returns The rows.
 */
export const resultBaseRows = (
  typings: readonly ExpressionTyping[],
): readonly { readonly base: ValueBase; readonly kind: string }[] =>
  typings.flatMap((typing) => typing.resultBases.map((base) => ({ base, kind: typing.kind })));

/**
 * `ResultCardinality`: the set of (kind, cardinality) an expression of the kind may be typed with.
 *
 * @param typings - The kinds' typings.
 * @returns The rows.
 */
export const resultCardinalityRows = (
  typings: readonly ExpressionTyping[],
): readonly { readonly cardinality: ValueCardinality; readonly kind: string }[] =>
  typings.flatMap((typing) =>
    typing.resultCardinalities.map((cardinality) => ({ cardinality, kind: typing.kind })),
  );

/**
 * The kinds of one typing, a handle list a law reads through `Compute.in` (C8).
 *
 * @param typings - The kinds' typings.
 * @param typing - The typing.
 * @returns Its kinds, in table order.
 */
export const kindsTyped = (
  typings: readonly ExpressionTyping[],
  typing: Typing,
): readonly string[] => typings.filter((row) => row.typing === typing).map(({ kind }) => kind);

/**
 * The processing roots and the language each opens (information model §2.6, §2.7 and §2.8).
 */
export const processingRoots = [
  ["qti-response-processing", "response"],
  ["qti-outcome-processing", "outcome"],
  ["qti-template-processing", "template"],
] as const satisfies readonly (readonly [string, Language])[];

/**
 * The rules whose one expression is a condition, boolean and single (information model §2.5.1.2,
 * ResponseIf and ResponseElseIf, and their outcome and template counterparts; §2.8.1.6,
 * TemplateConstraint): rule P21.
 */
export const conditionKinds = [
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-response-else-if",
  "qti-response-if",
  "qti-template-constraint",
  "qti-template-else-if",
  "qti-template-if",
] as const;

/**
 * The rules that set the variable their `identifier` names to their one expression's value, which
 * must fit the variable's type (information model §2.5.1.3, SetOutcomeValue, and §2.8.1: the
 * template, default and correct setters): rule P20.
 */
export const setKinds = [
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
] as const;

/**
 * The rule that looks its one expression's value up in a table of its variable's declaration
 * (information model §2.5.1.4, LookupOutcomeValue): rule P22.
 */
export const lookupKind = "qti-lookup-outcome-value";

/**
 * Every rule and processing kind: the three roots, their fragments, the conditions and their
 * branches, the setters, the lookup and the exits (information model §2.5 to §2.8, the old
 * parser's table B).
 */
export const ruleKinds = [
  ...processingRoots.map(([kind]) => kind),
  ...conditionKinds,
  ...setKinds,
  lookupKind,
  "qti-exit-response",
  "qti-exit-template",
  "qti-exit-test",
  "qti-outcome-condition",
  "qti-outcome-else",
  "qti-outcome-processing-fragment",
  "qti-response-condition",
  "qti-response-else",
  "qti-response-processing-fragment",
  "qti-template-condition",
  "qti-template-else",
] as const;

/**
 * The built-in variables each root holds, with the type a reference to one has (information model
 * §2.2.2, Item Variables, and §2.2.2.1, Context Variable; spec reading 29, the UP audit's A63): an
 * item's `numAttempts`, `duration` (a float of seconds), `completionStatus` and `QTI_CONTEXT`; a
 * test's or a section's `duration` (a duration) and `QTI_CONTEXT`. `test` marks the second.
 */
export const builtInTypes = [
  { baseType: "integer", cardinality: "single", test: false, variable: "numAttempts" },
  { baseType: "float", cardinality: "single", test: false, variable: "duration" },
  { baseType: "identifier", cardinality: "single", test: false, variable: "completionStatus" },
  { baseType: "unknown", cardinality: "record", test: false, variable: "QTI_CONTEXT" },
  { baseType: "duration", cardinality: "single", test: true, variable: "duration" },
  { baseType: "unknown", cardinality: "record", test: true, variable: "QTI_CONTEXT" },
] as const satisfies readonly {
  readonly baseType: ValueBase;
  readonly cardinality: ValueCardinality;
  readonly test: boolean;
  readonly variable: string;
}[];

/**
 * The base type of the literal a variable reference stands in place of.
 *
 * @param kind - The referring element's kind.
 * @param attribute - The attribute the reference is made by.
 * @returns `string` for a pattern, `float` for a random float's bounds, else `integer`.
 */
const literalBaseOf = (kind: string, attribute: string): ValueBase => {
  if (attribute === "pattern") {
    return "string";
  }

  return kind === "qti-random-float" ? "float" : "integer";
};

/**
 * `ReferenceBase`: (kind, attribute) → base, the base type a variable named in place of a literal
 * must have, single (rule P24): the literal member of the attribute's union, a string for
 * `qti-pattern-match`'s `pattern`, a float for `qti-random-float`'s bounds, an integer for every
 * other (information model §2.11.3: the `integerOrVariableRef`, `floatOrVariableRef` and
 * `stringOrVariableRef` attributes).
 *
 * @param references - The variable references processing makes: `VariableReference`'s rows over the
 *   expression kinds.
 * @returns One row per reference that stands in place of a literal, its `identifier` aside.
 */
export const referenceBaseRows = (
  references: readonly { readonly attribute: string; readonly kind: string }[],
): readonly { readonly attribute: string; readonly base: ValueBase; readonly kind: string }[] =>
  references
    .filter(({ attribute }) => attribute !== "identifier")
    .map(({ attribute, kind }) => ({ attribute, base: literalBaseOf(kind, attribute), kind }));

/**
 * The pattern of the names `qti-math-operator` gives an integer result: `signum`, `floor` and
 * `ceil` (information model §2.11.3.32, MathOperator); every other name gives a float. The name is
 * an `xs:string` enumeration, `whiteSpace` preserve, so the pattern is exact.
 */
export const integerMathOperators = "^(?:signum|floor|ceil)$";

/**
 * The pattern a lexical form of a coded value matches when it spells the handle: the handle itself,
 * exactly, since `base-type` and `qti-math-operator`'s `name` are `xs:string` enumerations whose
 * `whiteSpace` is preserve.
 *
 * @param handle - The handle.
 * @returns The anchored pattern.
 */
export const spelledPattern = (handle: string): string => `^${escaped(handle)}$`;
