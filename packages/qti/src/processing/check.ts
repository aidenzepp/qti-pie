import { Option } from "effect";

import type {
  ExpressionNode,
  IncludeNode,
  LiteralOrRef,
  Position,
  ProcessingAst,
  RuleNode,
} from "#qti/processing/ast.ts";
import type { Environment } from "#qti/processing/env.ts";
import { literalOrRef, patternOrRef } from "#qti/processing/parse.ts";
import { resultType } from "#qti/processing/types.ts";
import type { BaseTypeOrAny, EffectiveType, ResultAttributes } from "#qti/processing/types.ts";
import { BaseType } from "#qti/schema/declaration.ts";

/**
 * An expression with the type the checker assigned it, and its operands typed in turn.
 *
 * It is an `ExpressionNode` with `operands` narrowed, written with `Omit` so that reading
 * `operands` gives the typed array and not its intersection with the untyped one.
 */
export type TypedExpression = Omit<ExpressionNode, "operands"> & {
  readonly operands: readonly TypedExpression[];
  readonly type: EffectiveType;
};

/**
 * A rule whose expression, sub-rules and condition branches carry typed nodes.
 *
 * A nested `xi:include` is a rule of kind `xi:include` (the parser's reading of it), so it appears
 * here with no expression.
 */
export interface TypedRuleNode extends Omit<RuleNode, "branches" | "expression" | "rules"> {
  readonly branches: readonly TypedRuleNode[];
  readonly expression: Option.Option<TypedExpression>;
  readonly rules: readonly TypedRuleNode[];
}

/**
 * The processing AST with every expression typed.
 *
 * It is declared here and not in `ast.ts` so that `EffectiveType` has one owner (`types.ts`) and
 * this module, which depends on both, is the one that joins them.
 */
export interface TypedAst extends Omit<ProcessingAst, "rules"> {
  readonly rules: readonly (IncludeNode | TypedRuleNode)[];
}

/**
 * The bin 2 rules the checker owns, by id.
 */
export type PId = "P8" | "P20" | "P21" | "P22" | "P23" | "P24" | "P25" | "P26" | "P27" | "P29";

/**
 * A place the checker could not type, and so could not compare: a variable no declaration types, a
 * template parameter, or a custom operator whose result "is defined by the extension".
 */
export interface Unresolved {
  /**
   * The variable identifier, the `field-identifier` of a `qti-field-value`, or the `class` of a
   * `qti-custom-operator`.
   */
  readonly identifier: string;
  readonly position: Position;
  readonly reason: "custom-operator" | "template-parameter" | "untyped-variable";
}

/**
 * The outcome of a check: the typed AST with the places it could not type (empty when it typed
 * everything), or the first rule broken.
 */
export type CheckResult =
  | { readonly _tag: "ok"; readonly typed: TypedAst; readonly unresolved: readonly Unresolved[] }
  | {
      readonly _tag: "refused";
      readonly kind: string;
      readonly position: Position;
      readonly rule: PId;
    };

/**
 * The type of what the checker cannot say.
 */
const unknownType: EffectiveType = { baseType: "unknown", cardinality: "unknown" };

/**
 * The expression kinds whose `identifier` names a variable and whose type is that variable's.
 */
const variableKinds: ReadonlySet<string> = new Set(["qti-variable", "qti-default", "qti-correct"]);

/**
 * The attributes whose value may be a reference to a variable in place of a literal.
 */
const referenceAttributes: readonly string[] = [
  "figures",
  "max",
  "min",
  "n",
  "number-repeats",
  "pattern",
  "step",
];

/**
 * The value of an attribute after its `whiteSpace` class, or `undefined` when absent.
 */
const processed = (node: ExpressionNode, name: string): string | undefined =>
  node.attributes.get(name)?.processed;

/**
 * The literal or reference an attribute holds, or `undefined` when the node has no such attribute.
 * `pattern` is read under its own rule: only a braced name is a reference.
 */
const referenceIn = (node: ExpressionNode, name: string): LiteralOrRef | undefined => {
  const value = processed(node, name);
  if (value === undefined) {
    return undefined;
  }

  return name === "pattern" ? patternOrRef(value) : literalOrRef(value);
};

/**
 * Narrow a written base type to the declared ones, or `unknown` when it is none of them.
 */
const baseTypeOf = (value: string | undefined): BaseTypeOrAny =>
  BaseType.handles.find((handle) => handle === value) ?? "unknown";

/**
 * Check a processing tree: assign every expression a type bottom-up, through `resultType`, from its
 * operands' types and the declarations the environment holds.
 *
 * A reference whose identifier the environment does not hold types `unknown` and is recorded as
 * unresolved, never refused: in `template` mode it is a template parameter, in `item` and `test`
 * mode a variable only a later rule can name (`p3-17` turns the item case into a refusal). A
 * `qti-custom-operator` and the field of a `qti-field-value` are `unknown` and unresolved too. No
 * rule fires yet, so the result is always `ok`.
 *
 * @param ast - The parsed processing tree.
 * @param env - The declarations and built-ins its mode provides.
 * @returns The typed AST and the unresolved entries in document order, or the first rule broken.
 */
export const checkProcessing = (ast: ProcessingAst, env: Environment): CheckResult => {
  const unresolved: Unresolved[] = [];

  const note = (
    identifier: string,
    position: Position,
    reason: Unresolved["reason"],
  ): EffectiveType => {
    unresolved.push({ identifier, position, reason });

    return unknownType;
  };

  const reference = (identifier: string, position: Position): EffectiveType =>
    env.declarations.get(identifier)?.type ??
    env.builtIns.get(identifier) ??
    note(identifier, position, env.mode === "template" ? "template-parameter" : "untyped-variable");

  const typeExpression = (node: ExpressionNode): TypedExpression => {
    for (const name of referenceAttributes) {
      const found = referenceIn(node, name);
      if (found?._tag === "ref") {
        reference(found.identifier, node.position);
      }
    }

    const kind: string = node.kind;
    const operatorName = processed(node, "name");
    const attrs: ResultAttributes = operatorName === undefined ? {} : { name: operatorName };
    let own = attrs;
    if (variableKinds.has(kind)) {
      own = { ...attrs, ...reference(processed(node, "identifier") ?? "", node.position) };
    } else if (kind === "qti-base-value" || kind === "qti-test-variables") {
      own = { ...attrs, baseType: baseTypeOf(processed(node, "base-type")) };
    } else if (kind === "qti-custom-operator") {
      note(processed(node, "class") ?? "", node.position, "custom-operator");
    } else if (kind === "qti-field-value") {
      note(processed(node, "field-identifier") ?? "", node.position, "untyped-variable");
    }

    const operands = node.operands.map(typeExpression);

    return {
      ...node,
      operands,
      type: resultType(
        node.kind,
        operands.map((operand) => operand.type),
        own,
      ),
    };
  };

  const typeRule = (node: RuleNode): TypedRuleNode => ({
    ...node,
    branches: node.branches.map((branch) => typeRule(branch)),
    expression: node.expression.pipe(Option.map((expression) => typeExpression(expression))),
    rules: node.rules.map((child) => typeRule(child)),
  });

  const rules = ast.rules.map((rule) => (rule.kind === "xi:include" ? rule : typeRule(rule)));

  return { _tag: "ok", typed: { ...ast, rules }, unresolved };
};
