/**
 * The expressions of response processing as the item model holds them: the names of the expression
 * kinds, the variants, the types of the attributes that may name a variable, with the one
 * classifier of each, and the rules that hold expressions.
 *
 * It imports from `effect` with `import type` only and value-imports only
 * `#plate/model/values.ts`, so an engine module, which is a browser module, may value-import its
 * names.
 *
 * @module
 */
import type { Option } from "effect";
import { isNcName, parseLexical, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * The expression kinds: the local name of each element QTI 3.0's XSD admits as a child of
 * `qti-set-outcome-value`, without its `qti-` prefix, in sorted order.
 *
 * An expression's `kind` is one of them, so the reader, the kind rules and the engine's family
 * tables key every kind by the same name.
 */
export const expressionKinds = [
  "and",
  "any-n",
  "base-value",
  "container-size",
  "contains",
  "correct",
  "custom-operator",
  "default",
  "delete",
  "divide",
  "duration-gte",
  "duration-lt",
  "equal",
  "equal-rounded",
  "field-value",
  "gcd",
  "gt",
  "gte",
  "index",
  "inside",
  "integer-divide",
  "integer-modulus",
  "integer-to-float",
  "is-null",
  "lcm",
  "lt",
  "lte",
  "map-response",
  "map-response-point",
  "match",
  "math-constant",
  "math-operator",
  "max",
  "member",
  "min",
  "multiple",
  "not",
  "null",
  "number-correct",
  "number-incorrect",
  "number-presented",
  "number-responded",
  "number-selected",
  "or",
  "ordered",
  "outcome-maximum",
  "outcome-minimum",
  "pattern-match",
  "power",
  "product",
  "random",
  "random-float",
  "random-integer",
  "repeat",
  "round",
  "round-to",
  "stats-operator",
  "string-match",
  "substring",
  "subtract",
  "sum",
  "test-variables",
  "truncate",
  "variable",
] as const;

/**
 * An expression kind, one of {@link expressionKinds}.
 */
export type ExpressionKind = (typeof expressionKinds)[number];

/**
 * The value of an operator's attribute that holds either a literal or a reference to a variable
 * whose value stands in for it when the operator is evaluated, as the information model's
 * `integerOrVariableRef`, `floatOrVariableRef` and `stringOrVariableRef` admit: a `literal` with
 * its typed value, or a `ref` with the variable's identifier.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IT_Use
 */
export type LiteralOrRef<A> =
  | { readonly _tag: "literal"; readonly value: A }
  | { readonly _tag: "ref"; readonly identifier: string };

/**
 * An integer attribute that may name a variable, such as `qti-round-to`'s `figures`: an exact
 * integer at any size (reading 45), or a reference.
 */
export type IntegerOrRef = LiteralOrRef<bigint>;

/**
 * A float attribute that may name a variable, such as `qti-random-float`'s `max` or one token of
 * `qti-equal`'s `tolerance`: an `xs:double`, which may be an infinity or NaN, or a reference.
 */
export type FloatOrRef = LiteralOrRef<number>;

/**
 * A string attribute that may name a variable, `qti-pattern-match`'s `pattern`: the text as
 * written, or a reference written as `{name}`.
 */
export type StringOrRef = LiteralOrRef<string>;

/**
 * An `xs:int` attribute that may name a variable, such as `qti-index`'s `n`: an exact integer,
 * whose range the XSD's `xs:int` member holds, or a reference.
 */
export type IntOrIdentifier = LiteralOrRef<bigint>;

/**
 * Construct the reference to a variable.
 *
 * @param identifier The variable's identifier.
 * @returns The reference.
 */
const reference = (identifier: string): LiteralOrRef<never> => ({ _tag: "ref", identifier });

/**
 * Classify a value of a union of an XSD integer type and a variable's name by the union's order:
 * the integer first, so only text outside the integer's lexical space names a variable.
 *
 * The integer member collapses whitespace and an integer holds no inner whitespace, so its outer
 * XML whitespace goes before it is read. A name holds no whitespace, so the same trim leaves a
 * valid name as written. A value outside both members never reaches a classifier on a checked
 * item; it is a reference to the trimmed text.
 *
 * @param written The attribute's value as written.
 * @returns The exact integer, or the reference.
 */
const integerOrName = (written: string): LiteralOrRef<bigint> => {
  const lexical = trimXmlSpace(written);
  const parsed = parseLexical("integer", lexical);

  return parsed._tag === "Success" && parsed.success.baseType === "integer"
    ? { _tag: "literal", value: parsed.success.value }
    : reference(lexical);
};

/**
 * Classify an integer attribute's value, such as `qti-round-to`'s `figures`, as the XSD's union of
 * `xs:integer` and an NCName reads it: an `xs:integer` is a literal, exact at any size, and
 * anything else is a reference. So `INF` and `NaN`, which are no integer, name variables (ruling
 * R4). The reader and the validator both classify through it, so they never split a value
 * differently.
 *
 * The range of an attribute such as `figures` is the structure check's (reading 46), not this
 * function's.
 *
 * @param written The attribute's value as written.
 * @returns The literal or the reference it holds.
 */
export const integerOrRefOf = (written: string): IntegerOrRef => integerOrName(written);

/**
 * Classify a float attribute's value, such as `qti-random-float`'s `max` or one token of
 * `qti-equal`'s `tolerance`, as the XSD's union of `xs:double` and a variable's name reads it: the
 * double first, so `INF`, `-INF` and `NaN` are literals, and anything else is a reference. A
 * literal beyond the largest finite double names that double, of its sign (reading 56), as
 * `parseLexical` reads a float. The reader and the validator both classify through it.
 *
 * The double member collapses whitespace and a name holds none, so the outer XML whitespace goes
 * first. A value outside both members never reaches a classifier on a checked item; it is a
 * reference to the trimmed text.
 *
 * @param written The attribute's value, or one token of a list, as written.
 * @returns The literal or the reference it holds.
 */
export const floatOrRefOf = (written: string): FloatOrRef => {
  const lexical = trimXmlSpace(written);
  const parsed = parseLexical("float", lexical);

  return parsed._tag === "Success" && parsed.success.baseType === "float"
    ? { _tag: "literal", value: parsed.success.value }
    : reference(lexical);
};

/**
 * Classify an `xs:int` attribute's value, such as `qti-index`'s `n`, as the XSD's union of `xs:int`
 * and `xs:NCName` reads it: an integer is a literal and anything else is a reference. The two
 * members do not overlap, and the `xs:int` member holds the literal's range, so the literal is not
 * range-checked here. The reader and the validator both classify through it.
 *
 * @param written The attribute's value as written.
 * @returns The literal or the reference it holds.
 */
export const intOrIdentifierOf = (written: string): IntOrIdentifier => integerOrName(written);

/**
 * Classify a string attribute's value, `qti-pattern-match`'s `pattern`, as literal text or a
 * reference.
 *
 * Only a value that is exactly `{name}`, whose name is an NCName that names a variable the item
 * holds, is a reference. Any other value is literal text as written, its whitespace and braces
 * kept (reading 7), a braced name that names no variable included: the information model treats a
 * string attribute that "appears to be a reference to a template or outcome variable but there is
 * no variable with the given name" as a string value (ruling R1). So the split is made at read
 * time, against the declared names, and the engine never meets a name that names nothing.
 *
 * @param written The attribute's value as written.
 * @param declared The names of the variables the item holds: every declaration's identifier and
 *   the built-in variables.
 * @returns The literal or the reference it holds.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IT_Use
 */
export const stringOrRefOf = (written: string, declared: ReadonlySet<string>): StringOrRef => {
  const name = written.startsWith("{") && written.endsWith("}") ? written.slice(1, -1) : "";

  return isNcName(name) && declared.has(name)
    ? reference(name)
    : { _tag: "literal", value: written };
};

/**
 * The values of a `qti-equal`'s `tolerance-mode`, whose XSD type restricts `xs:string`, so a value
 * is compared as written. The default is `exact`.
 */
export const toleranceModes = ["absolute", "exact", "relative"] as const;

/**
 * An expression of response processing, tagged by `kind`: `qti-match`, `qti-variable`,
 * `qti-correct`, `qti-base-value`, `qti-is-null`, `qti-map-response`, `qti-map-response-point` and
 * `qti-equal`.
 *
 * Every variant holds its sub-expressions in `operands`, a tuple of the kind's operand count, so a
 * walk recurses over `operands` without knowing the kind, and an evaluator that takes them apart
 * meets no missing operand. A variant holds each attribute of its element: an optional one with a
 * default holds the default when absent, as `equal`'s tolerance mode (`exact`), tolerance (none)
 * and bounds (both included) do, and one with no default is an `Option`, as `variable`'s
 * `weightIdentifier` is, which an item reads and never evaluates. The reader builds an `equal` only
 * in its `exact` mode, the one mode the engine runs; one in `absolute` or `relative` mode is
 * marked.
 */
export type Expression =
  | { readonly kind: "match"; readonly operands: readonly [Expression, Expression] }
  | {
      readonly includeLowerBound: boolean;
      readonly includeUpperBound: boolean;
      readonly kind: "equal";
      readonly operands: readonly [Expression, Expression];
      readonly tolerance: readonly FloatOrRef[];
      readonly toleranceMode: (typeof toleranceModes)[number];
    }
  | {
      readonly identifier: string;
      readonly kind: "variable";
      readonly operands: readonly [];
      readonly weightIdentifier: Option.Option<string>;
    }
  | { readonly identifier: string; readonly kind: "correct"; readonly operands: readonly [] }
  | { readonly kind: "base-value"; readonly operands: readonly []; readonly value: Value }
  | { readonly kind: "is-null"; readonly operands: readonly [Expression] }
  | { readonly identifier: string; readonly kind: "map-response"; readonly operands: readonly [] }
  | {
      readonly identifier: string;
      readonly kind: "map-response-point";
      readonly operands: readonly [];
    };

/**
 * One `qti-response-if` or `qti-response-else-if`: its condition and the rules it runs.
 */
export interface Branch {
  readonly then: readonly Rule[];
  readonly when: Expression;
}

/**
 * A response rule of phase 1's engine subset: a `qti-response-condition` with its branches in
 * order and its `qti-response-else`, or a `qti-set-outcome-value`.
 */
export type Rule =
  | {
      readonly branches: readonly Branch[];
      readonly kind: "condition";
      readonly otherwise: Option.Option<readonly Rule[]>;
    }
  | { readonly expression: Expression; readonly identifier: string; readonly kind: "set-outcome" };
