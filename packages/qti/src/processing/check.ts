import { Option } from "effect";

import type {
  ExpressionNode,
  IncludeNode,
  LiteralOrRef,
  Position,
  ProcessingAst,
  RuleNode,
} from "#qti/processing/ast.ts";
import type { DeclarationEntry, Environment } from "#qti/processing/env.ts";
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
 * The expression kinds only outcome processing admits (P25).
 */
const outcomeOnlyKinds: ReadonlySet<string> = new Set([
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-test-variables",
]);

/**
 * The rule kinds whose expression is a condition (P21).
 */
const conditionKinds: ReadonlySet<string> = new Set([
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-response-else-if",
  "qti-response-if",
  "qti-template-constraint",
  "qti-template-else-if",
  "qti-template-if",
]);

/**
 * The rule kinds that name a variable they write: the target's type is the type the expression
 * must have (P20).
 */
const setKinds: ReadonlySet<string> = new Set([
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
]);

/**
 * Whether two types can be the same: each side agrees or one side says nothing (`any`, `unknown`).
 */
const compatible = (a: EffectiveType, b: EffectiveType): boolean =>
  (a.baseType === b.baseType ||
    a.baseType === "any" ||
    b.baseType === "any" ||
    a.baseType === "unknown" ||
    b.baseType === "unknown") &&
  (a.cardinality === b.cardinality || a.cardinality === "unknown" || b.cardinality === "unknown");

/**
 * The base type a reference attribute of a kind must name (P24): `pattern` a string, the `min`,
 * `max` and `step` of `qti-random-float` a float, every other one an integer.
 */
const referencedBaseType = (kind: string, attribute: string): BaseTypeOrAny => {
  if (attribute === "pattern") {
    return "string";
  }

  const floating = kind === "qti-random-float" && ["max", "min", "step"].includes(attribute);

  return floating ? "float" : "integer";
};

/**
 * The value of an attribute after its `whiteSpace` class, or `undefined` when absent.
 */
const processed = (node: Pick<ExpressionNode, "attributes">, name: string): string | undefined =>
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
 * operands' types and the declarations the environment holds, and refuse the first rule of 4.10's
 * bin 2 it breaks.
 *
 * A rule fires only when the types it compares are known: a comparison against `unknown` or `any`
 * is not a refusal. A reference whose identifier the environment does not hold is refused naming P8
 * in `item` mode; in `template` mode it is a template parameter, and in `test` mode a variable a
 * test environment would type, and either types `unknown` and is recorded as unresolved. A
 * `qti-custom-operator` and the field of a `qti-field-value` are `unknown` and unresolved too (P49
 * is a record, never a refusal).
 *
 * @param ast - The parsed processing tree.
 * @param env - The declarations and built-ins its mode provides.
 * @returns The typed AST and the unresolved entries in document order, or the first rule broken.
 */
export const checkProcessing = (ast: ProcessingAst, env: Environment): CheckResult => {
  const unresolved: Unresolved[] = [];
  let refusal: Extract<CheckResult, { readonly _tag: "refused" }> | undefined;

  const refuse = (rule: PId, kind: string, position: Position): void => {
    refusal ??= { _tag: "refused", kind, position, rule };
  };

  const note = (
    identifier: string,
    position: Position,
    reason: Unresolved["reason"],
  ): EffectiveType => {
    unresolved.push({ identifier, position, reason });

    return unknownType;
  };

  /**
   * The declaration an identifier names, with the P26 refusal for a template rule that reads a
   * response or outcome variable.
   */
  const read = (
    identifier: string,
    kind: string,
    position: Position,
  ): DeclarationEntry | undefined => {
    const declared = env.declarations.get(identifier);
    if (ast.language === "template") {
      const builtIn = declared === undefined && env.builtIns.has(identifier);
      if (
        (declared !== undefined && (declared.kind === "response" || declared.kind === "outcome")) ||
        (builtIn && identifier !== "QTI_CONTEXT")
      ) {
        refuse("P26", kind, position);
      }
    }

    return declared;
  };

  const reference = (identifier: string, kind: string, position: Position): EffectiveType => {
    const declared = read(identifier, kind, position);
    const found = declared?.type ?? env.builtIns.get(identifier);
    if (found !== undefined) {
      return found;
    }

    if (env.mode === "item") {
      refuse("P8", kind, position);
    }

    return note(
      identifier,
      position,
      env.mode === "template" ? "template-parameter" : "untyped-variable",
    );
  };

  /**
   * The type of the variable a rule writes, refusing P8 in `item` mode when nothing is named.
   */
  const target = (
    identifier: string,
    kind: string,
    position: Position,
  ): EffectiveType | undefined => {
    const found = env.declarations.get(identifier)?.type ?? env.builtIns.get(identifier);
    if (found === undefined && env.mode === "item") {
      refuse("P8", kind, position);
    }

    return found;
  };

  const checkAttributeReference = (
    node: ExpressionNode,
    name: string,
    identifier: string,
  ): void => {
    const type = reference(identifier, node.kind, node.position);
    const declared = env.declarations.get(identifier);
    const named = declared !== undefined || env.builtIns.has(identifier);
    const expected: EffectiveType = {
      baseType: referencedBaseType(node.kind, name),
      cardinality: "single",
    };
    const variable = declared?.kind === "template" || declared?.kind === "outcome";
    if (named && (!variable || !compatible(type, expected))) {
      refuse("P24", node.kind, node.position);
    }
  };

  const checkMapping = (node: ExpressionNode): void => {
    const identifier = processed(node, "identifier") ?? "";
    reference(identifier, node.kind, node.position);

    const declared = env.declarations.get(identifier);
    if (declared === undefined) {
      return;
    }

    const kind: string = node.kind;
    const point = kind === "qti-map-response-point";
    const mapped = point ? declared.areaMapping : declared.mapping;
    const typed =
      !point || compatible(declared.type, { baseType: "point", cardinality: "unknown" });
    if (declared.kind !== "response" || !mapped || !typed) {
      refuse("P27", node.kind, node.position);
    }
  };

  const typeExpression = (node: ExpressionNode): TypedExpression => {
    const kind: string = node.kind;
    if (outcomeOnlyKinds.has(kind) && ast.language !== "outcome") {
      refuse("P25", kind, node.position);
    }

    for (const name of referenceAttributes) {
      const found = referenceIn(node, name);
      if (found?._tag === "ref") {
        checkAttributeReference(node, name, found.identifier);
      }
    }

    const operatorName = processed(node, "name");
    const attrs: ResultAttributes = operatorName === undefined ? {} : { name: operatorName };
    let own = attrs;
    if (variableKinds.has(kind)) {
      own = { ...attrs, ...reference(processed(node, "identifier") ?? "", kind, node.position) };
    } else if (kind === "qti-map-response" || kind === "qti-map-response-point") {
      checkMapping(node);
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

  const checkLookup = (node: RuleNode, expression: TypedExpression): void => {
    const declared = env.declarations.get(processed(node, "identifier") ?? "");
    const { baseType, cardinality } = expression.type;
    if (
      (cardinality !== "single" && cardinality !== "unknown") ||
      !["any", "duration", "float", "integer", "unknown"].includes(baseType)
    ) {
      refuse("P22", node.kind, node.position);
    } else if (declared !== undefined) {
      const table = declared.matchTable || declared.interpolationTable;
      if (!table || (declared.matchTable && !["any", "integer", "unknown"].includes(baseType))) {
        refuse("P22", node.kind, node.position);
      }
    }
  };

  const typeRule = (node: RuleNode): TypedRuleNode => {
    const kind: string = node.kind;
    const written =
      setKinds.has(kind) || kind === "qti-lookup-outcome-value"
        ? target(processed(node, "identifier") ?? "", kind, node.position)
        : undefined;
    const expression = node.expression.pipe(Option.map((e) => typeExpression(e)));
    if (Option.isSome(expression)) {
      if (
        conditionKinds.has(kind) &&
        !compatible(expression.value.type, { baseType: "boolean", cardinality: "single" })
      ) {
        refuse("P21", kind, node.position);
      } else if (
        setKinds.has(kind) &&
        written !== undefined &&
        !compatible(expression.value.type, written)
      ) {
        refuse("P20", kind, node.position);
      } else if (kind === "qti-lookup-outcome-value") {
        checkLookup(node, expression.value);
      }
    }

    return {
      ...node,
      branches: node.branches.map((branch) => typeRule(branch)),
      expression,
      rules: node.rules.map((child) => typeRule(child)),
    };
  };

  const rules = ast.rules.map((rule) => (rule.kind === "xi:include" ? rule : typeRule(rule)));

  return refusal ?? { _tag: "ok", typed: { ...ast, rules }, unresolved };
};
