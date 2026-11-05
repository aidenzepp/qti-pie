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
 * The qualifiers an operator's syntax table lists: `root` takes `degree` (§4.4.2.11), `log` takes
 * `logbase` (§4.4.7.7). Every other operator here lists none.
 */
const ownQualifiers: ReadonlyMap<string, readonly string[]> = new Map([
  ["m:log", ["m:logbase"]],
  ["m:root", ["m:degree"]],
]);

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
  ].map(([kind, arity]): readonly [string, MathArity] => [
    kind,
    { ...arity, qualifiers: ownQualifiers.get(kind) ?? [] },
  ]),
);
