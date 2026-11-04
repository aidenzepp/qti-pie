import { Option } from "effect";

import type {
  ExpressionNode,
  IncludeNode,
  LiteralOrRef,
  Position,
  ProcessingAst,
  RuleNode,
} from "#pantry/processing/ast.ts";
import { resolvePrefixed } from "#pantry/processing/env.ts";
import type { DeclarationEntry, Environment } from "#pantry/processing/env.ts";
import { literalOrRef, patternOrRef } from "#pantry/processing/parse.ts";
import { prefixedReadings } from "#pantry/processing/prefixed.ts";
import type { PrefixedForm } from "#pantry/processing/prefixed.ts";
import { resultType } from "#pantry/processing/types.ts";
import type {
  BaseTypeOrAny,
  Cardinality,
  EffectiveType,
  ResultAttributes,
} from "#pantry/processing/types.ts";
import { BaseType } from "#pantry/schema/declaration.ts";

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
 * A nested `xi:include` stays an untyped `IncludeNode`: it holds no expression to type.
 */
export interface TypedRuleNode extends Omit<RuleNode, "branches" | "expression" | "rules"> {
  readonly branches: readonly TypedRuleNode[];
  readonly expression: Option.Option<TypedExpression>;
  readonly rules: readonly (IncludeNode | TypedRuleNode)[];
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
export type PId =
  | "P8"
  | "P20"
  | "P21"
  | "P22"
  | "P23"
  | "P24"
  | "P25"
  | "P26"
  | "P27"
  | "P29"
  | "item-duration"
  | "prefixed-ref";

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
 *
 * A refusal carries `readings`: for `prefixed-ref`, every reading of the name that resolves (none
 * when the name names no variable, two or more when it is ambiguous); empty for every other rule.
 */
export type CheckResult =
  | { readonly _tag: "ok"; readonly typed: TypedAst; readonly unresolved: readonly Unresolved[] }
  | {
      readonly _tag: "refused";
      readonly kind: string;
      readonly position: Position;
      readonly readings: readonly PrefixedForm[];
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
 * An operand rule: whether the operand types of one expression break its family's typing (P23).
 */
type OperandRule = (operands: readonly EffectiveType[]) => boolean;

/**
 * Whether a base type says nothing yet (`any`, `unknown`), so no rule can fault it.
 */
const silent = (baseType: BaseTypeOrAny): boolean => baseType === "any" || baseType === "unknown";

/**
 * Whether a type is a base type of the list, or says nothing.
 */
const baseIn = (type: EffectiveType, basics: readonly BaseTypeOrAny[]): boolean =>
  silent(type.baseType) || basics.includes(type.baseType);

/**
 * Whether a type has a cardinality of the list, or says nothing.
 */
const cardinalIn = (type: EffectiveType, cardinalities: readonly Cardinality[]): boolean =>
  type.cardinality === "unknown" || cardinalities.includes(type.cardinality);

/**
 * Whether every operand is of the base types given and single.
 */
const allSingle =
  (basics: readonly BaseTypeOrAny[]): OperandRule =>
  (operands) =>
    operands.every((type) => baseIn(type, basics) && cardinalIn(type, ["single"]));

/**
 * Whether two operands agree on their base type, or one says nothing.
 */
const sameBase = (a: EffectiveType, b: EffectiveType): boolean =>
  silent(a.baseType) || silent(b.baseType) || a.baseType === b.baseType;

/**
 * Whether no pair of operands disagrees on its base type.
 */
const oneBase = (operands: readonly EffectiveType[]): boolean =>
  operands.every((type) => operands.every((other) => sameBase(type, other)));

const numericalBases: readonly BaseTypeOrAny[] = ["float", "integer"];

/**
 * Every operator family of 4.10's P23 table: the rule an operator's operand types must satisfy,
 * each row read against `info.html` 6.9. Numerical is integer or float, never duration (4.12), and
 * a type that says nothing (`any`, `unknown`) satisfies every row.
 */
const operandRules: ReadonlyMap<string, OperandRule> = new Map<string, OperandRule>([
  // boolean
  ...["qti-and", "qti-any-n", "qti-not", "qti-or"].map((k): [string, OperandRule] => [
    k,
    allSingle(["boolean"]),
  ]),
  // match
  [
    "qti-match",
    ([a, b]) =>
      a === undefined ||
      b === undefined ||
      (compatible(a, b) && a.baseType !== "duration" && b.baseType !== "duration"),
  ],
  // numerical comparison
  ...["qti-equal", "qti-equal-rounded", "qti-gt", "qti-gte", "qti-lt", "qti-lte"].map(
    (k): [string, OperandRule] => [k, allSingle(numericalBases)],
  ),
  // duration comparison
  ...["qti-duration-gte", "qti-duration-lt"].map((k): [string, OperandRule] => [
    k,
    allSingle(["duration"]),
  ]),
  // membership
  [
    "qti-member",
    ([a, b]) =>
      a === undefined ||
      b === undefined ||
      (sameBase(a, b) &&
        a.baseType !== "duration" &&
        b.baseType !== "duration" &&
        cardinalIn(a, ["single"]) &&
        cardinalIn(b, ["multiple", "ordered"])),
  ],
  [
    "qti-delete",
    ([a, b]) =>
      a === undefined ||
      b === undefined ||
      (sameBase(a, b) && cardinalIn(a, ["single"]) && cardinalIn(b, ["multiple", "ordered"])),
  ],
  // containment
  [
    "qti-contains",
    ([a, b]) =>
      a === undefined ||
      b === undefined ||
      (compatible(a, b) &&
        a.baseType !== "duration" &&
        b.baseType !== "duration" &&
        cardinalIn(a, ["multiple", "ordered"]) &&
        cardinalIn(b, ["multiple", "ordered"])),
  ],
  // string
  ...["qti-pattern-match", "qti-string-match", "qti-substring"].map((k): [string, OperandRule] => [
    k,
    allSingle(["string"]),
  ]),
  // point
  [
    "qti-inside",
    (operands) =>
      operands.every(
        (type) => baseIn(type, ["point"]) && cardinalIn(type, ["multiple", "ordered", "single"]),
      ),
  ],
  // container constructors
  [
    "qti-multiple",
    (operands) =>
      oneBase(operands) && operands.every((type) => cardinalIn(type, ["single", "multiple"])),
  ],
  ...["qti-ordered", "qti-repeat"].map((k): [string, OperandRule] => [
    k,
    (operands) =>
      oneBase(operands) && operands.every((type) => cardinalIn(type, ["single", "ordered"])),
  ]),
  // container readers
  ...["qti-container-size", "qti-index", "qti-random"].map((k): [string, OperandRule] => [
    k,
    (operands) => operands.every((type) => cardinalIn(type, ["multiple", "ordered"])),
  ]),
  // record
  ["qti-field-value", (operands) => operands.every((type) => cardinalIn(type, ["record"]))],
  // numerical aggregate
  ...["qti-max", "qti-min", "qti-product", "qti-sum"].map((k): [string, OperandRule] => [
    k,
    (operands) =>
      operands.every(
        (type) =>
          baseIn(type, numericalBases) && cardinalIn(type, ["multiple", "ordered", "single"]),
      ),
  ]),
  // integer aggregate
  ...["qti-gcd", "qti-lcm"].map((k): [string, OperandRule] => [
    k,
    (operands) =>
      operands.every(
        (type) => baseIn(type, ["integer"]) && cardinalIn(type, ["multiple", "ordered", "single"]),
      ),
  ]),
  // numerical single
  ...[
    "qti-divide",
    "qti-math-operator",
    "qti-power",
    "qti-round",
    "qti-round-to",
    "qti-subtract",
    "qti-truncate",
  ].map((k): [string, OperandRule] => [k, allSingle(numericalBases)]),
  // integer single
  ...["qti-integer-divide", "qti-integer-modulus", "qti-integer-to-float"].map(
    (k): [string, OperandRule] => [k, allSingle(["integer"])],
  ),
  // statistics
  [
    "qti-stats-operator",
    (operands) =>
      operands.every(
        (type) => baseIn(type, numericalBases) && cardinalIn(type, ["multiple", "ordered"]),
      ),
  ],
]);

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
 * in `item` and `test` mode, except that in `test` mode a name declared nowhere whole that has a
 * prefixed form's shape is typed by `resolvePrefixed` in the test's reach, and refused
 * `prefixed-ref` when no reading or more than one resolves. A resolved prefixed name in a reference
 * attribute meets P24 like a whole name: the variable it resolves to is a template or outcome
 * variable of the matching base type; in `template` mode it is a template
 * parameter, typed `unknown` and recorded as unresolved. A
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

  const refuse = (
    rule: PId,
    kind: string,
    position: Position,
    readings: readonly PrefixedForm[] = [],
  ): void => {
    refusal ??= { _tag: "refused", kind, position, readings, rule };
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

  /**
   * The type of a prefixed name in the test's reach: the one reading that resolves gives it, and
   * none or several refuse `prefixed-ref` with the readings that resolved.
   */
  const typePrefixed = (identifier: string, kind: string, position: Position): EffectiveType => {
    const resolution = resolvePrefixed(identifier, env);
    if (resolution._tag === "resolved") {
      return resolution.type;
    }

    refuse(
      "prefixed-ref",
      kind,
      position,
      resolution._tag === "ambiguous" ? resolution.readings : [],
    );

    return unknownType;
  };

  /**
   * Whether a name read is the `duration` of an item that is not time dependent, which no
   * expression may read (S-R49, INFO#IV_Response): the item's own built-in in `item` mode, or an
   * item reference's item-session built-in through the test's reach.
   */
  const untimedDuration = (identifier: string): boolean => {
    if (env.mode === "item") {
      return identifier === "duration" && !env.timeDependent;
    }

    const resolution = resolvePrefixed(identifier, env);
    if (
      resolution._tag !== "resolved" ||
      resolution.source !== "builtIn" ||
      resolution.reading.variable !== "duration"
    ) {
      return false;
    }

    const entry = env.reach.get(resolution.reading.prefix);

    return entry?.kind === "item-ref" && !entry.scope.timeDependent;
  };

  const reference = (identifier: string, kind: string, position: Position): EffectiveType => {
    const declared = read(identifier, kind, position);
    const found = declared?.type ?? env.builtIns.get(identifier);
    if (found !== undefined) {
      if (declared === undefined && untimedDuration(identifier)) {
        refuse("item-duration", kind, position);
      }

      return found;
    }

    if (env.mode === "test" && prefixedReadings(identifier).length > 0) {
      const type = typePrefixed(identifier, kind, position);
      if (untimedDuration(identifier)) {
        refuse("item-duration", kind, position);
      }

      return type;
    }

    if (env.mode !== "template") {
      refuse("P8", kind, position);
    }

    return note(
      identifier,
      position,
      env.mode === "template" ? "template-parameter" : "untyped-variable",
    );
  };

  /**
   * The type of the variable a rule writes, refusing P8 in `item` and `test` mode when nothing is
   * named, except a `test` name of a prefixed form's shape, which is typed through the reach.
   */
  const target = (
    identifier: string,
    kind: string,
    position: Position,
  ): EffectiveType | undefined => {
    const found = env.declarations.get(identifier)?.type ?? env.builtIns.get(identifier);
    if (found !== undefined) {
      return found;
    }

    if (env.mode === "test" && prefixedReadings(identifier).length > 0) {
      return typePrefixed(identifier, kind, position);
    }

    if (env.mode !== "template") {
      refuse("P8", kind, position);
    }

    return undefined;
  };

  /**
   * P24: a reference in an attribute names a template or outcome variable of the matching base type
   * and single cardinality. A name declared whole or a built-in meets it directly; in `test` mode a
   * resolved prefixed name meets it through the variable it resolves to, and an unresolved or
   * ambiguous one is left to `reference`, which has refused it `prefixed-ref`.
   */
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

    if (!named && env.mode === "test") {
      const resolution = resolvePrefixed(identifier, env);
      const fitting =
        resolution._tag === "resolved" &&
        (resolution.variableKind === "template" || resolution.variableKind === "outcome") &&
        compatible(resolution.type, expected);
      if (resolution._tag === "resolved" && !fitting) {
        refuse("P24", node.kind, node.position);
      }
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

  /**
   * P29: a `qti-test-variables` with a `weight-identifier` is a float or has no `base-type`; only
   * outcome processing under a test environment checks it.
   */
  const checkWeight = (node: ExpressionNode): void => {
    const kind: string = node.kind;
    const written = processed(node, "base-type");
    if (
      kind === "qti-test-variables" &&
      processed(node, "weight-identifier") !== undefined &&
      written !== undefined &&
      written !== "float" &&
      ast.language === "outcome" &&
      env.mode === "test"
    ) {
      refuse("P29", kind, node.position);
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
      checkWeight(node);
    } else if (kind === "qti-custom-operator") {
      note(processed(node, "class") ?? "", node.position, "custom-operator");
    } else if (kind === "qti-field-value") {
      note(processed(node, "field-identifier") ?? "", node.position, "untyped-variable");
    }

    const operands = node.operands.map(typeExpression);
    const operandTypes = operands.map((operand) => operand.type);
    if (operandRules.get(kind)?.(operandTypes) === false) {
      refuse("P23", kind, node.position);
    }

    return {
      ...node,
      operands,
      type: resultType(node.kind, operandTypes, own),
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

  /**
   * The type of the template variable a template default sets: the declaration the item
   * reference's item holds under `template-identifier`, or `undefined` when the environment has no
   * item reference holder or the item declares no such template variable.
   */
  const templateOf = (node: RuleNode): EffectiveType | undefined => {
    const declared = env.holder?.declarations.get(processed(node, "template-identifier") ?? "");

    return declared?.kind === "template" ? declared.type : undefined;
  };

  const typeRule = (node: RuleNode): TypedRuleNode => {
    const kind: string = node.kind;
    let written: EffectiveType | undefined;
    if (setKinds.has(kind) || kind === "qti-lookup-outcome-value") {
      written = target(processed(node, "identifier") ?? "", kind, node.position);
    } else if (kind === "qti-template-default") {
      written = templateOf(node);
    }

    const expression = node.expression.pipe(Option.map((e) => typeExpression(e)));
    if (Option.isSome(expression)) {
      if (
        conditionKinds.has(kind) &&
        !compatible(expression.value.type, { baseType: "boolean", cardinality: "single" })
      ) {
        refuse("P21", kind, node.position);
      } else if (
        (setKinds.has(kind) || kind === "qti-template-default") &&
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
      rules: node.rules.map((child) => (child.kind === "xi:include" ? child : typeRule(child))),
    };
  };

  const rules = ast.rules.map((rule) => (rule.kind === "xi:include" ? rule : typeRule(rule)));

  return refusal ?? { _tag: "ok", typed: { ...ast, rules }, unresolved };
};
