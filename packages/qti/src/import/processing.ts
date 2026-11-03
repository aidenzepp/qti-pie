/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the XSD attribute `qti-inside` names, the region kind, not a structure. */

/**
 * The processing rows of one tree: the expressions of a response, outcome or template processing
 * root, their operands, arms and attributes, and the variables they refer to.
 *
 * {@link processingRows} first judges the tree (parse, required attributes, type check) and writes
 * no row for a tree it refuses. The rows it writes sit beside the node, edge and generic-arm rows
 * `treeRows` already wrote under the same {@link NodeIndex}.
 */
import { Effect, Option, Schema } from "effect";
import type { ImportRefused, Rule } from "#qti/import/refusal.ts";
import { closedOf, Rows, spelledInteger, typedAttribute } from "#qti/import/tree.ts";
import type { NodeIndex, UnmodeledVocabulary, WhiteSpace } from "#qti/import/tree.ts";
import type {
  AttributeValue,
  IncludeNode,
  Language,
  LiteralOrRef,
  Position,
  RuleOrExpressionKind,
} from "#qti/processing/ast.ts";
import { checkProcessing } from "#qti/processing/check.ts";
import type { PId } from "#qti/processing/check.ts";
import type { Environment, Mode } from "#qti/processing/env.ts";
import { literalOrRef, parseProcessing } from "#qti/processing/parse.ts";
import {
  MathConstantName,
  MathOperatorName,
  RoundingMode,
  Shape,
  StatsOperatorName,
  ToleranceMode,
  XIncludeParseValue,
  XsBoolean,
} from "#qti/schema/content/rosters.ts";
import { BaseType } from "#qti/schema/declaration.ts";
import * as expression from "#qti/schema/expression.ts";
import * as attributed from "#qti/schema/expression-attributes.ts";
import { Edge } from "#qti/schema/node.ts";
import type {
  AttributeNameHandle,
  NodeKindHandle,
  RootKindHandle,
  SchemaVersionHandle,
} from "#qti/schema/node.ts";
import * as processing from "#qti/schema/processing.ts";
import * as ruleSchema from "#qti/schema/rule.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * A processing tree the importer refuses to write rows for.
 *
 * `rule` is the id of 4.10's rule it breaks and `detail` says which element breaks it, where it
 * stands in the tree and what to change.
 */
export class ProcessingRefused extends Schema.TaggedError<ProcessingRefused>()(
  "ProcessingRefused",
  {
    detail: Schema.String,
    rule: Schema.Literals([
      "P5",
      "P8",
      "P20",
      "P21",
      "P22",
      "P23",
      "P24",
      "P25",
      "P26",
      "P27",
      "P29",
    ]),
  },
) {
  /**
   * What was refused and by which rule, in one sentence.
   */
  override get message(): string {
    return `The processing was refused under the ${this.rule} rule: ${this.detail}`;
  }
}

/**
 * What {@link processingRows} needs beside the rows: the processing root, the node each of its
 * elements became, the document and tree it belongs to, and the environment it is checked in.
 *
 * `document` is the id of the document whose declarations a reference names and `tree` the id of
 * the tree whose nodes the rows hang from; an item's document and tree share one id.
 */
export interface ProcessingInput {
  readonly document: string;
  readonly env: Environment;
  readonly language: Language;
  readonly mode: Mode;
  readonly nodes: NodeIndex;
  readonly root: Element;
  readonly rootKind: RootKindHandle;
  readonly tree: string;
  readonly version: SchemaVersionHandle;
}

/**
 * One node of a tree: its id and its kind.
 */
interface NodeEntry {
  readonly id: string;
  readonly kind: NodeKindHandle;
}

/**
 * The attributes each expression and rule kind must carry, from 3.3 table A and B (`use` required).
 *
 * The value-setting rules are here because their `identifier` is the variable reference this module
 * writes.
 */
const requiredAttributes: Readonly<Partial<Record<RuleOrExpressionKind, readonly string[]>>> = {
  "qti-any-n": ["min", "max"],
  "qti-base-value": ["base-type"],
  "qti-correct": ["identifier"],
  "qti-default": ["identifier"],
  "qti-equal-rounded": ["figures"],
  "qti-field-value": ["field-identifier"],
  "qti-index": ["n"],
  "qti-inside": ["shape", "coords"],
  "qti-lookup-outcome-value": ["identifier"],
  "qti-map-response": ["identifier"],
  "qti-map-response-point": ["identifier"],
  "qti-math-constant": ["name"],
  "qti-math-operator": ["name"],
  "qti-outcome-maximum": ["outcome-identifier"],
  "qti-outcome-minimum": ["outcome-identifier"],
  "qti-pattern-match": ["pattern"],
  "qti-random-float": ["max"],
  "qti-random-integer": ["max"],
  "qti-repeat": ["number-repeats"],
  "qti-round-to": ["rounding-mode", "figures"],
  "qti-set-correct-response": ["identifier"],
  "qti-set-default-value": ["identifier"],
  "qti-set-outcome-value": ["identifier"],
  "qti-set-template-value": ["identifier"],
  "qti-stats-operator": ["name"],
  "qti-string-match": ["case-sensitive"],
  "qti-substring": ["case-sensitive"],
  "qti-test-variables": ["variable-identifier"],
  "qti-variable": ["identifier"],
};

/**
 * Why each rule of the checker refuses and what to change, the second half of a refusal's detail.
 */
const guidance: Readonly<Record<PId, string>> = {
  P20: "its expression does not have the type of the variable it sets. Change the expression or the variable's declaration so that the two agree.",
  P21: "a condition must be a single boolean. Change the expression to one that is.",
  P22: "the lookup's expression or its variable has a type or a table it cannot use. Change the expression, or declare the table the lookup reads.",
  P23: "its operands have types the operator does not accept. Change the operands.",
  P24: "an attribute names a variable that is the wrong kind or type for it. Name an outcome or template variable of a number type.",
  P25: "it is only allowed in outcome processing. Move it there or replace it.",
  P26: "a template's rules may not read a response or outcome variable. Read a template variable instead.",
  P27: "it names a variable that has no mapping of the kind it needs. Declare the mapping or name another variable.",
  P29: "a weighted test variable must be a float. Set base-type to float or remove the weight.",
  P8: "it names a variable that no declaration of the document declares and no built-in provides. Declare the variable, or correct the identifier.",
};

/**
 * A node's place in its tree: the child indexes from the processing root, joined by `/`.
 *
 * @param position - The node's position.
 * @returns The path, or `the root` for the processing root itself.
 */
const placeOf = (position: Position): string =>
  position.path.length === 0 ? "the root" : position.path.join("/");

/**
 * The detail of a checker refusal: the element, its place and the rule's reason.
 *
 * @param rule - The rule the checker named.
 * @param kind - The refused element's kind.
 * @param position - Where the element stands.
 * @returns The sentence that names the element and what to change.
 */
const detailOf = (rule: PId, kind: string, position: Position): string =>
  `${kind} at ${placeOf(position)} is refused: ${guidance[rule]}`;

/**
 * An expression as the row builder and the required-attribute scan read it: the untyped AST's
 * `ExpressionNode` and the checker's `TypedExpression` both fit.
 */
interface ExpressionLike {
  readonly attributes: ReadonlyMap<string, AttributeValue>;
  readonly element: Element;
  readonly kind: RuleOrExpressionKind;
  readonly operands: readonly ExpressionLike[];
  readonly position: Position;
  readonly text: Option.Option<string>;
}

/**
 * A rule as the row builder reads it: the untyped `RuleNode` and the checker's `TypedRuleNode` both
 * fit.
 */
interface RuleLike {
  readonly attributes: ReadonlyMap<string, AttributeValue>;
  readonly branches: readonly RuleLike[];
  readonly element: Element;
  readonly expression: Option.Option<ExpressionLike>;
  readonly kind: RuleOrExpressionKind;
  readonly position: Position;
  readonly rules: readonly (IncludeNode | RuleLike)[];
}

/**
 * The expressions and rules of a tree, flat: each kind of node in document order, and both
 * together.
 */
interface Flat {
  readonly expressions: readonly ExpressionLike[];
  readonly includes: readonly IncludeNode[];
  readonly ordered: readonly (ExpressionLike | RuleLike)[];
  readonly rules: readonly RuleLike[];
}

const nothing: Flat = { expressions: [], includes: [], ordered: [], rules: [] };

/**
 * Flatten an expression and its operands, in document order.
 *
 * @param node - The expression at the top of the subtree.
 * @returns The subtree's expressions.
 */
const flattenExpression = (node: ExpressionLike): Flat => {
  const inner = node.operands.map(flattenExpression);

  return {
    expressions: [node, ...inner.flatMap((found) => found.expressions)],
    includes: [],
    ordered: [node, ...inner.flatMap((found) => found.ordered)],
    rules: [],
  };
};

/**
 * Flatten a rule, its guarding or held expression, its condition branches and its sub-rules, in
 * document order. An `xi:include` is listed and holds nothing.
 *
 * @param node - The rule or include at the top of the subtree.
 * @returns The subtree's expressions and rules.
 */
const flattenRule = (node: IncludeNode | RuleLike): Flat => {
  if (node.kind === "xi:include") {
    return { ...nothing, includes: [node] };
  }

  const own = Option.match(node.expression, { onNone: () => nothing, onSome: flattenExpression });
  const nested = [...node.branches, ...node.rules].map(flattenRule);

  return {
    expressions: [...own.expressions, ...nested.flatMap((found) => found.expressions)],
    includes: nested.flatMap((found) => found.includes),
    ordered: [node, ...own.ordered, ...nested.flatMap((found) => found.ordered)],
    rules: [node, ...nested.flatMap((found) => found.rules)],
  };
};

/**
 * Flatten the top-level rules of a processing root.
 *
 * @param rules - The root's rules in document order.
 * @returns Every expression and rule under them.
 */
const flatten = (rules: readonly (IncludeNode | RuleLike)[]): Flat => {
  const found = rules.map(flattenRule);

  return {
    expressions: found.flatMap((one) => one.expressions),
    includes: found.flatMap((one) => one.includes),
    ordered: found.flatMap((one) => one.ordered),
    rules: found.flatMap((one) => one.rules),
  };
};

/**
 * The first node that lacks an attribute its kind requires, in document order.
 *
 * @param flat - The flattened tree.
 * @returns The node's kind and place and the attribute, none when every node is complete.
 */
const firstMissing = (
  flat: Flat,
): Option.Option<{
  readonly attribute: string;
  readonly kind: string;
  readonly position: Position;
}> =>
  Option.fromNullishOr(
    flat.ordered.flatMap((node) =>
      (requiredAttributes[node.kind] ?? [])
        .filter((name) => !node.attributes.has(name))
        .map((attribute) => ({ attribute, kind: node.kind, position: node.position })),
    )[0],
  );

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of enumerations,
 * booleans and numbers are template-literal types, and the value read is a string until that
 * pattern says it fits, so the cast narrows only the type; a value the pattern refuses is refused
 * there.
 *
 * @param value - The attribute's processed value.
 * @returns The same text, typed as the column that judges it.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.3).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * A mixed-union attribute (`figures`, `min`, `max`, `step`) as the column holds it, with how it
 * was read.
 */
interface UnionValue {
  readonly parsed: LiteralOrRef;
  readonly value: string;
}

/**
 * The attributes of one node, read one at a time under their `whiteSpace` class; the rows
 * accumulate the `AttributeLexical` rows the reads produced.
 */
interface Reader {
  /**
   * The processed value of an attribute, none when the node does not carry it.
   */
  readonly read: (name: AttributeNameHandle) => Option.Option<string>;
  /**
   * The rows so far; call it after the last read.
   */
  readonly rows: () => Rows;
  /**
   * A mixed-union attribute: a number is stored collapsed, a bare name as read, and any other
   * text as given, so a padded name stays a literal the column's pattern refuses.
   */
  readonly union: (name: AttributeNameHandle) => Option.Option<UnionValue>;
}

/**
 * Open the reads of one node's attributes.
 *
 * @param rows - The rows so far.
 * @param node - The node whose attributes are read.
 * @param entry - The node's id and kind in the tree.
 * @returns The reader over the node.
 */
const readerOf = (
  rows: Rows,
  node: { readonly attributes: ReadonlyMap<string, AttributeValue> },
  entry: NodeEntry,
): Reader => {
  let built = rows;
  /**
   * Read one attribute under the class `whiteSpace` names for it, keeping its lexical row.
   */
  const take = (name: AttributeNameHandle, whiteSpace: (found: AttributeValue) => WhiteSpace) =>
    Option.fromNullishOr(node.attributes.get(name)).pipe(
      Option.map((found) => {
        const typed = typedAttribute(
          built,
          entry.id,
          entry.kind,
          name,
          found.lexical,
          whiteSpace(found),
        );
        built = typed.rows;

        return typed.value;
      }),
    );

  return {
    read: (name) => take(name, (found) => found.whiteSpace),
    rows: () => built,
    union: (name) =>
      Option.fromNullishOr(node.attributes.get(name)).pipe(
        Option.flatMap((found) => {
          const parsed = literalOrRef(found.lexical);
          const collapsed = parsed._tag === "literal" && parsed.value !== found.lexical;

          return take(name, () => (collapsed ? "collapse" : "preserve")).pipe(
            Option.map((value) => ({ parsed, value })),
          );
        }),
      ),
  };
};

const noUnion: UnionValue = { parsed: { _tag: "literal", value: "" }, value: "" };

/**
 * A number-or-variable attribute as the rows hold it: its kind, the number a literal writes (`0`
 * for a reference), the variable a reference names and the rows with the literal's spelling kept.
 */
interface Counted {
  readonly identifier: Option.Option<string>;
  readonly kind: "literal" | "ref";
  readonly rows: Rows;
  readonly value: bigint;
}

/**
 * Read the integer of a number-or-variable attribute: a reference is the variable it names and a
 * literal must be an integer, refused before any row is written when it is not.
 *
 * @param rows - The rows so far.
 * @param entry - The node that carries the attribute.
 * @param name - The attribute's registry name.
 * @param parsed - The attribute's value, told apart as a literal or a reference.
 * @param rule - The rule a refused literal carries.
 * @param where - The element and attribute, for the refusal's detail.
 * @returns The kind, the number, the variable and the rows; `ImportRefused` for a literal that is
 *   not an integer.
 */
const countRows = Effect.fn("import.processing.countRows")(function* countRows(
  rows: Rows,
  entry: NodeEntry,
  name: AttributeNameHandle,
  parsed: LiteralOrRef,
  rule: Rule,
  where: string,
): Effect.fn.Return<Counted, ImportRefused> {
  if (parsed._tag === "ref") {
    return { identifier: Option.some(parsed.identifier), kind: "ref", rows, value: 0n };
  }

  const spelled = yield* spelledInteger(
    rows,
    entry.id,
    entry.kind,
    name,
    parsed.value,
    "integer",
    rule,
    where,
  );

  return { identifier: Option.none(), kind: "literal", rows: spelled.rows, value: spelled.value };
});

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 *
 * @param value - The attribute's value, none when the node does not carry it.
 * @param make - Builds the fact from the value.
 * @returns A list of the one fact, or the empty list.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * The text of an attribute the tree is known to carry: the required ones, which the scan checked.
 *
 * @param value - The attribute's value.
 * @returns The value, the empty text for an attribute the scan would have refused.
 */
const need = (value: Option.Option<string>): string => Option.getOrElse(value, () => "");

/**
 * The arity the seed tables hold, by expression kind.
 */
const arity: ReadonlyMap<
  NodeKindHandle,
  { readonly max: Option.Option<bigint>; readonly min: bigint }
> = new Map(
  operatorArity.map((entry) => [
    entry.kind,
    {
      max: Option.fromNullishOr(operatorArityMax.find((seed) => seed.kind === entry.kind)?.max),
      min: entry.min,
    },
  ]),
);

/**
 * Write the references of a node that names a variable: the `VariableRef` row and the arm for the
 * way it names it.
 *
 * A name the document declares is a declared reference with its declaring kind; a name only the
 * mode provides is a built-in; in a template document any other name is a template parameter; in
 * any other mode a name nothing declares has no arm, and the checker has already refused it in an
 * `item`.
 *
 * @param rows - The rows so far.
 * @param input - The processing input.
 * @param node - The referring node.
 * @param identifier - The processed identifier it names.
 * @returns The rows with the reference added.
 */
const referenceRows = (
  rows: Rows,
  input: ProcessingInput,
  node: NodeEntry,
  identifier: string,
): Rows => {
  const declaration = input.env.declarations.get(identifier);
  if (declaration !== undefined) {
    return Rows.add(
      Rows.add(rows, processing.VariableRef, [
        { document: input.tree, id: node.id, kind: "declared" },
      ]),
      processing.DeclaredRef,
      [
        {
          declarationKind: declaration.kind,
          document: input.document,
          id: node.id,
          identifier: judgedLater(identifier),
          referrerKind: node.kind,
        },
      ],
    );
  }

  const builtIn = processing.BuiltIn.handles.find(
    (name) => name === identifier && input.env.builtIns.has(name),
  );
  if (builtIn !== undefined) {
    return Rows.add(
      Rows.add(rows, processing.VariableRef, [
        { document: input.tree, id: node.id, kind: "builtIn" },
      ]),
      processing.BuiltInRef,
      [{ id: node.id, name: builtIn, referrerKind: node.kind }],
    );
  }

  if (input.mode !== "template") {
    return rows;
  }

  return Rows.add(
    Rows.add(rows, processing.VariableRef, [
      { document: input.tree, id: node.id, kind: "templateParameter" },
    ]),
    processing.TemplateParameterRef,
    [
      {
        document: input.tree,
        id: node.id,
        identifier: judgedLater(identifier),
        referrerKind: node.kind,
        rootKind: input.rootKind,
      },
    ],
  );
};

type BaseTypeHandle = (typeof BaseType.handles)[number];

/**
 * The row of a literal's value in the arm of its base type.
 */
const literalArmRows: Record<BaseTypeHandle, (rows: Rows, id: string, text: string) => Rows> = {
  boolean: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralBoolean, [{ id, value: judgedLater(text) }]),
  directedPair: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralDirectedPair, [{ id, value: judgedLater(text) }]),
  duration: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralDuration, [{ id, value: judgedLater(text) }]),
  file: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralFile, [{ id, value: judgedLater(text) }]),
  float: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralFloat, [{ id, value: judgedLater(text) }]),
  identifier: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralIdentifier, [{ id, value: judgedLater(text) }]),
  integer: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralInteger, [{ id, value: judgedLater(text) }]),
  pair: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralPair, [{ id, value: judgedLater(text) }]),
  point: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralPoint, [{ id, value: judgedLater(text) }]),
  string: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralString, [{ id, value: judgedLater(text) }]),
  uri: (rows, id, text) =>
    Rows.add(rows, processing.relations.LiteralUri, [{ id, value: judgedLater(text) }]),
};

/**
 * What an arm builder is given: the reads of its node, the node and its entry, and the input.
 */
interface Arm {
  readonly attributes: Reader;
  readonly entry: NodeEntry;
  readonly input: ProcessingInput;
  readonly node: ExpressionLike;
}

/**
 * Read the three category and section filters of an outcome-only expression and return the writer
 * of their rows, to be called after the node's last read.
 *
 * @param attributes - The node's reader.
 * @returns A function that adds the filter rows for the written ones.
 */
const filtersOf = (attributes: Reader) => {
  const section = attributes.read("section-identifier");
  const include = attributes.read("include-category");
  const exclude = attributes.read("exclude-category");

  return (rows: Rows, id: string): Rows => {
    const withSection = Rows.add(
      rows,
      expression.ExpressionSectionIdentifier,
      written(section, (own) => ({ node: id, value: judgedLater(own) })),
    );
    const withInclude = Rows.add(
      withSection,
      expression.ExpressionIncludeCategory,
      written(include, (own) => ({ node: id, value: judgedLater(own) })),
    );

    return Rows.add(
      withInclude,
      expression.ExpressionExcludeCategory,
      written(exclude, (own) => ({ node: id, value: judgedLater(own) })),
    );
  };
};

/**
 * The `weight-identifier` rows of an outcome-only expression, once read.
 *
 * @param rows - The rows so far.
 * @param id - The expression's node id.
 * @param weight - The attribute's processed value, none when not written.
 * @returns The rows with the weight added where written.
 */
const weightOf = (rows: Rows, id: string, weight: Option.Option<string>): Rows =>
  Rows.add(
    rows,
    attributed.ExpressionWeightIdentifier,
    written(weight, (own) => ({ node: id, value: judgedLater(own) })),
  );

/**
 * The `figures` columns of a rounding operator and the rows its value adds: the kind, the typed
 * number and the spelling or the variable it names.
 *
 * `figures` is refused under `attribute-lexical` as it is at the commit today (decision 123).
 *
 * @param arm - The reads of the node and its entry.
 * @param figures - The `figures` attribute.
 * @param element - The operator's kind, for the refusal's detail.
 * @returns The columns, the rows with the spelling kept and the variable `figures` names, if it
 *   names one.
 */
const roundingFigures = Effect.fn("import.processing.roundingFigures")(function* roundingFigures(
  { attributes, entry }: Arm,
  figures: UnionValue,
  element: "qti-equal-rounded" | "qti-round-to",
): Effect.fn.Return<
  {
    readonly columns: { readonly figuresKind: "literal" | "ref"; readonly figuresValue: bigint };
    readonly identifier: Option.Option<string>;
    readonly rows: Rows;
  },
  ImportRefused
> {
  const counted = yield* countRows(
    attributes.rows(),
    entry,
    "figures",
    figures.parsed,
    "attribute-lexical",
    `${element} figures`,
  );

  return {
    columns: { figuresKind: counted.kind, figuresValue: counted.value },
    identifier: counted.identifier,
    rows: counted.rows,
  };
});

/**
 * The rows of a `qti-outcome-minimum` or `qti-outcome-maximum`: the shared `OutcomeMinMax` row, the
 * thin arm of the kind, the filters and the weight.
 *
 * @param arm - The reads of the node, its entry and the input.
 * @param thin - The thin arm of the node's kind.
 * @returns The rows with the bound's added.
 */
const outcomeBoundRows = (
  { attributes, entry }: Arm,
  thin: typeof attributed.OutcomeMaximumArm | typeof attributed.OutcomeMinimumArm,
): Rows => {
  const outcome = need(attributes.read("outcome-identifier"));
  const weight = attributes.read("weight-identifier");
  const filters = filtersOf(attributes);
  const built = Rows.add(attributes.rows(), attributed.OutcomeMinMax, [
    { id: entry.id, kind: entry.kind, outcomeIdentifier: judgedLater(outcome) },
  ]);

  return weightOf(Rows.add(filters(built, entry.id), thin, [{ id: entry.id }]), entry.id, weight);
};

/**
 * The attributed arms, by kind; a kind not here is a thin arm.
 */
const armBuilders: Readonly<Partial<Record<RuleOrExpressionKind, (arm: Arm) => Rows>>> = {
  "qti-any-n": ({ attributes, entry }) => {
    const min = need(attributes.union("min").pipe(Option.map((found) => found.value)));
    const max = need(attributes.union("max").pipe(Option.map((found) => found.value)));

    return Rows.add(attributes.rows(), attributed.AnyN, [
      { id: entry.id, max: judgedLater(max), min: judgedLater(min) },
    ]);
  },
  "qti-base-value": ({ attributes, entry, node }) => {
    const baseType = BaseType.handles.find(
      (handle) => handle === need(attributes.read("base-type")),
    );
    const built = attributes.rows();

    return baseType === undefined
      ? built
      : literalArmRows[baseType](
          Rows.add(built, processing.Literal, [{ baseType, id: entry.id }]),
          entry.id,
          Option.getOrElse(node.text, () => ""),
        );
  },
  "qti-custom-operator": ({ attributes, entry }) => {
    const className = attributes.read("class");
    const definition = attributes.read("definition");
    const built = Rows.add(attributes.rows(), attributed.CustomOperator, [{ id: entry.id }]);

    return Rows.add(
      Rows.add(
        built,
        attributed.CustomOperatorClass,
        written(className, (own) => ({ node: entry.id, value: judgedLater(own) })),
      ),
      attributed.CustomOperatorDefinition,
      written(definition, (own) => ({ node: entry.id, value: judgedLater(own) })),
    );
  },
  "qti-field-value": ({ attributes, entry }) => {
    const field = need(attributes.read("field-identifier"));

    return Rows.add(attributes.rows(), attributed.FieldValue, [
      { fieldIdentifier: judgedLater(field), id: entry.id },
    ]);
  },
  "qti-outcome-maximum": (arm) => outcomeBoundRows(arm, attributed.OutcomeMaximumArm),
  "qti-outcome-minimum": (arm) => outcomeBoundRows(arm, attributed.OutcomeMinimumArm),
  "qti-pattern-match": ({ attributes, entry }) => {
    const pattern = need(attributes.read("pattern"));

    return Rows.add(attributes.rows(), attributed.PatternMatch, [
      { id: entry.id, pattern: judgedLater(pattern) },
    ]);
  },
  "qti-random-float": ({ attributes, entry }) => {
    const max = Option.getOrElse(attributes.union("max"), () => noUnion);
    const min = attributes.union("min");
    const built = Rows.add(attributes.rows(), attributed.RandomFloat, [
      { id: entry.id, max: judgedLater(max.value) },
    ]);

    return Rows.add(
      built,
      attributed.RandomFloatMin,
      written(min, (own) => ({ node: entry.id, value: judgedLater(own.value) })),
    );
  },
  "qti-random-integer": ({ attributes, entry }) => {
    const max = Option.getOrElse(attributes.union("max"), () => noUnion);
    const min = attributes.union("min");
    const step = attributes.union("step");
    const built = Rows.add(attributes.rows(), attributed.RandomInteger, [
      { id: entry.id, max: judgedLater(max.value) },
    ]);

    return Rows.add(
      Rows.add(
        built,
        attributed.RandomIntegerMin,
        written(min, (own) => ({ node: entry.id, value: judgedLater(own.value) })),
      ),
      attributed.RandomIntegerStep,
      written(step, (own) => ({ node: entry.id, value: judgedLater(own.value) })),
    );
  },
  "qti-variable": ({ attributes, entry, input }) => {
    const identifier = need(attributes.read("identifier"));
    const weight = attributes.read("weight-identifier");
    const built = referenceRows(
      Rows.add(attributes.rows(), attributed.Variable, [{ id: entry.id }]),
      input,
      entry,
      identifier,
    );

    return Rows.add(
      built,
      attributed.VariableWeightIdentifier,
      written(weight, (own) => ({
        node: entry.id,
        rootKind: input.rootKind,
        value: judgedLater(own),
      })),
    );
  },
};

/**
 * The attributed arms whose closed or number-or-variable attributes are narrowed before the rows
 * are written, by kind: a value outside its roster, or a literal that is not an integer, is
 * refused.
 */
const countedArmBuilders: Readonly<
  Partial<Record<RuleOrExpressionKind, (arm: Arm) => Effect.Effect<Rows, ImportRefused>>>
> = {
  "qti-equal": Effect.fn("import.processing.equal")(function* equal({ attributes, entry }: Arm) {
    const mode = attributes.read("tolerance-mode");
    const lower = attributes.read("include-lower-bound");
    const upper = attributes.read("include-upper-bound");
    const tolerance = attributes.read("tolerance");
    const toleranceMode = yield* closedOf(
      ToleranceMode.handles,
      Option.getOrElse(mode, () => "exact"),
      "P6",
      "the tolerance-mode attribute of qti-equal",
    );
    const includeLowerBound = yield* closedOf(
      XsBoolean.handles,
      Option.getOrElse(lower, () => "true"),
      "attribute-lexical",
      "the include-lower-bound attribute of qti-equal",
    );
    const includeUpperBound = yield* closedOf(
      XsBoolean.handles,
      Option.getOrElse(upper, () => "true"),
      "attribute-lexical",
      "the include-upper-bound attribute of qti-equal",
    );
    let built = Rows.add(attributes.rows(), attributed.Equal, [
      { id: entry.id, includeLowerBound, includeUpperBound, toleranceMode },
    ]);
    /**
     * The marker rows of a defaulted attribute the source wrote.
     */
    const marker = (value: Option.Option<string>) => written(value, () => ({ node: entry.id }));
    built = Rows.add(built, attributed.DeclaredToleranceMode, marker(mode));
    built = Rows.add(built, attributed.DeclaredIncludeLowerBound, marker(lower));
    built = Rows.add(built, attributed.DeclaredIncludeUpperBound, marker(upper));

    return Rows.add(
      built,
      attributed.EqualTolerance,
      written(tolerance, (own) => ({
        node: entry.id,
        toleranceMode,
        value: judgedLater(own),
      })),
    );
  }),
  "qti-equal-rounded": Effect.fn("import.processing.equalRounded")(function* equalRounded(
    arm: Arm,
  ) {
    const { attributes, entry } = arm;
    const mode = attributes.read("rounding-mode");
    const roundingMode = yield* closedOf(
      RoundingMode.handles,
      Option.getOrElse(mode, () => "significantFigures"),
      "P6",
      "the rounding-mode attribute of qti-equal-rounded",
    );
    const figures = Option.getOrElse(attributes.union("figures"), () => noUnion);
    const counted = yield* roundingFigures(arm, figures, "qti-equal-rounded");
    const built = Rows.add(counted.rows, attributed.EqualRounded, [
      { ...counted.columns, id: entry.id, roundingMode },
    ]);

    return Rows.add(
      Rows.add(
        built,
        attributed.EqualRoundedFiguresRef,
        written(counted.identifier, (own) => ({ identifier: judgedLater(own), node: entry.id })),
      ),
      attributed.DeclaredRoundingMode,
      written(mode, () => ({ node: entry.id })),
    );
  }),
  "qti-index": Effect.fn("import.processing.index")(function* index({ attributes, entry }: Arm) {
    const found = need(attributes.read("n"));
    const counted = yield* countRows(
      attributes.rows(),
      entry,
      "n",
      literalOrRef(found),
      "P6",
      "qti-index n",
    );

    return Rows.add(
      Rows.add(counted.rows, attributed.Index, [
        { id: entry.id, nKind: counted.kind, nValue: counted.value },
      ]),
      attributed.IndexNRef,
      written(counted.identifier, (own) => ({ identifier: judgedLater(own), node: entry.id })),
    );
  }),
  "qti-inside": Effect.fn("import.processing.inside")(function* inside({ attributes, entry }: Arm) {
    const region = yield* closedOf(
      Shape.handles,
      need(attributes.read("shape")),
      "P6",
      "the shape attribute of qti-inside",
    );
    const coords = need(attributes.read("coords"));

    return Rows.add(attributes.rows(), attributed.Inside, [
      { coords: judgedLater(coords), id: entry.id, shape: region },
    ]);
  }),
  "qti-math-constant": Effect.fn("import.processing.mathConstant")(function* mathConstant({
    attributes,
    entry,
  }: Arm) {
    const name = yield* closedOf(
      MathConstantName.handles,
      need(attributes.read("name")),
      "P6",
      "the name attribute of qti-math-constant",
    );

    return Rows.add(attributes.rows(), attributed.MathConstant, [{ id: entry.id, name }]);
  }),
  "qti-math-operator": Effect.fn("import.processing.mathOperator")(function* mathOperator({
    attributes,
    entry,
  }: Arm) {
    const name = yield* closedOf(
      MathOperatorName.handles,
      need(attributes.read("name")),
      "P6",
      "the name attribute of qti-math-operator",
    );

    return Rows.add(attributes.rows(), attributed.MathOperator, [{ id: entry.id, name }]);
  }),
  "qti-repeat": Effect.fn("import.processing.repeat")(function* repeat({ attributes, entry }: Arm) {
    const found = need(attributes.read("number-repeats"));
    const counted = yield* countRows(
      attributes.rows(),
      entry,
      "number-repeats",
      literalOrRef(found),
      "P6",
      "qti-repeat number-repeats",
    );

    return Rows.add(
      Rows.add(counted.rows, attributed.Repeat, [
        { id: entry.id, numberRepeatsKind: counted.kind, numberRepeatsValue: counted.value },
      ]),
      attributed.RepeatNumberRepeatsRef,
      written(counted.identifier, (own) => ({ identifier: judgedLater(own), node: entry.id })),
    );
  }),
  "qti-round-to": Effect.fn("import.processing.roundTo")(function* roundTo(arm: Arm) {
    const { attributes, entry } = arm;
    const roundingMode = yield* closedOf(
      RoundingMode.handles,
      need(attributes.read("rounding-mode")),
      "P6",
      "the rounding-mode attribute of qti-round-to",
    );
    const figures = Option.getOrElse(attributes.union("figures"), () => noUnion);
    const counted = yield* roundingFigures(arm, figures, "qti-round-to");

    return Rows.add(
      Rows.add(counted.rows, attributed.RoundTo, [
        { ...counted.columns, id: entry.id, roundingMode },
      ]),
      attributed.RoundToFiguresRef,
      written(counted.identifier, (own) => ({ identifier: judgedLater(own), node: entry.id })),
    );
  }),
  "qti-stats-operator": Effect.fn("import.processing.statsOperator")(function* statsOperator({
    attributes,
    entry,
  }: Arm) {
    const name = yield* closedOf(
      StatsOperatorName.handles,
      need(attributes.read("name")),
      "P6",
      "the name attribute of qti-stats-operator",
    );

    return Rows.add(attributes.rows(), attributed.StatsOperator, [{ id: entry.id, name }]);
  }),
  "qti-string-match": Effect.fn("import.processing.stringMatch")(function* stringMatch({
    attributes,
    entry,
  }: Arm) {
    const caseSensitive = yield* closedOf(
      XsBoolean.handles,
      need(attributes.read("case-sensitive")),
      "attribute-lexical",
      "the case-sensitive attribute of qti-string-match",
    );
    const substring = attributes.read("substring");
    const substringHandle = yield* closedOf(
      XsBoolean.handles,
      Option.getOrElse(substring, () => "false"),
      "attribute-lexical",
      "the substring attribute of qti-string-match",
    );
    const built = Rows.add(attributes.rows(), attributed.StringMatch, [
      { caseSensitive, id: entry.id, substring: substringHandle },
    ]);

    return Rows.add(
      built,
      attributed.DeclaredSubstring,
      written(substring, () => ({ node: entry.id })),
    );
  }),
  "qti-substring": Effect.fn("import.processing.substring")(function* substring({
    attributes,
    entry,
  }: Arm) {
    const caseSensitive = yield* closedOf(
      XsBoolean.handles,
      need(attributes.read("case-sensitive")),
      "attribute-lexical",
      "the case-sensitive attribute of qti-substring",
    );

    return Rows.add(attributes.rows(), attributed.Substring, [{ caseSensitive, id: entry.id }]);
  }),
  "qti-test-variables": Effect.fn("import.processing.testVariables")(function* testVariables({
    attributes,
    entry,
  }: Arm) {
    const variable = need(attributes.read("variable-identifier"));
    const baseType = attributes.read("base-type");
    const weight = attributes.read("weight-identifier");
    const filters = filtersOf(attributes);
    const baseTypeHandle = yield* Option.match(baseType, {
      onNone: () => Effect.succeed(Option.none<(typeof BaseType.handles)[number]>()),
      onSome: (own) =>
        closedOf(BaseType.handles, own, "P6", "the base-type attribute of qti-test-variables").pipe(
          Effect.map(Option.some),
        ),
    });
    const built = Rows.add(attributes.rows(), attributed.TestVariables, [
      { id: entry.id, variableIdentifier: judgedLater(variable) },
    ]);

    return weightOf(
      Rows.add(
        filters(built, entry.id),
        attributed.TestVariablesBaseType,
        written(baseTypeHandle, (own) => ({ node: entry.id, value: own })),
      ),
      entry.id,
      weight,
    );
  }),
};

/**
 * The expression kinds whose thin arm also takes the section and category filters.
 */
const countingKinds: ReadonlySet<string> = new Set([
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
]);

/**
 * The expression kinds that name a variable by their `identifier` and are thin arms.
 */
const referringKinds: ReadonlySet<string> = new Set([
  "qti-correct",
  "qti-default",
  "qti-map-response",
  "qti-map-response-point",
]);

type ThinKind = Exclude<keyof typeof expression.arms, "qti-base-value">;

/**
 * Whether a kind has a thin arm: an arm that holds the node's id and nothing else.
 *
 * @param kind - A node kind.
 * @returns Whether `expression.arms` holds a thin arm for it.
 */
const isThin = (kind: string): kind is ThinKind =>
  kind in expression.arms && kind !== "qti-base-value";

/**
 * Write one expression's rows: its `Expression` and `ExpressionMax` rows, the `Operand` row of each
 * of its operands, and its arm with the attribute rows its kind carries.
 *
 * @param rows - The rows so far.
 * @param input - The processing input.
 * @param node - The expression.
 * @param entry - The node it became.
 * @returns The rows with the expression's added.
 */
const expressionRows = Effect.fn("import.processing.expressionRows")(function* expressionRows(
  rows: Rows,
  input: ProcessingInput,
  node: ExpressionLike,
  entry: NodeEntry,
): Effect.fn.Return<Rows, ImportRefused> {
  const seeded = arity.get(entry.kind);
  const bounded = seeded !== undefined && Option.isSome(seeded.max);
  let built = rows;
  if (seeded !== undefined) {
    built = Rows.add(built, processing.Expression, [
      {
        bounded: bounded ? "bounded" : "unbounded",
        document: input.tree,
        id: entry.id,
        kind: entry.kind,
        min: seeded.min,
      },
    ]);
    built = Rows.add(
      built,
      processing.ExpressionMax,
      written(seeded.max, (max) => ({ id: entry.id, kind: entry.kind, max })),
    );
  }

  built = Rows.add(
    built,
    processing.Operand,
    node.operands.flatMap((operand) => {
      const child = input.nodes.get(operand.element);

      return child === undefined
        ? []
        : [
            {
              child: child.id,
              expression: entry.id,
              position: BigInt(node.element.children.indexOf(operand.element)),
            },
          ];
    }),
  );

  const attributes = readerOf(built, node, entry);
  const arm: Arm = { attributes, entry, input, node };
  const counted = countedArmBuilders[node.kind];
  if (counted !== undefined) {
    return yield* counted(arm);
  }

  const builder = armBuilders[node.kind];
  if (builder !== undefined) {
    return builder(arm);
  }

  if (!isThin(node.kind)) {
    return attributes.rows();
  }

  const filters = countingKinds.has(node.kind) ? filtersOf(attributes) : undefined;
  const identifier = referringKinds.has(node.kind)
    ? attributes.read("identifier")
    : Option.none<string>();
  let thin = Rows.add(attributes.rows(), expression.arms[node.kind], [{ id: entry.id }]);
  thin = filters === undefined ? thin : filters(thin, entry.id);

  return Option.match(identifier, {
    onNone: () => thin,
    onSome: (own) => referenceRows(thin, input, entry, own),
  });
});

/**
 * Write the reference rows of a value-setting rule: the variable it names, read from its
 * `identifier`.
 *
 * @param rows - The rows so far.
 * @param input - The processing input.
 * @param node - The rule.
 * @param entry - The node it became.
 * @returns The rows with the reference added, and the `AttributeLexical` row of a padded
 *   identifier.
 */
const ruleReferenceRows = (
  rows: Rows,
  input: ProcessingInput,
  node: RuleLike,
  entry: NodeEntry,
): Rows => {
  const attributes = readerOf(rows, node, entry);
  const identifier = attributes.read("identifier");

  return Option.match(identifier, {
    onNone: () => attributes.rows(),
    onSome: (own) => referenceRows(attributes.rows(), input, entry, own),
  });
};

/**
 * The rule kinds that name the variable they write or read by their `identifier`.
 */
const referringRules: ReadonlySet<string> = new Set([
  "qti-lookup-outcome-value",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
]);

/**
 * The branches of a condition that hang under it by a `condition` column: the `if` and the `else`
 * of each language. The `else-if` of a condition is unbounded and stays a thin arm.
 */
const branchArms = {
  "qti-outcome-else": ruleSchema.OutcomeElseArm,
  "qti-outcome-if": ruleSchema.OutcomeIfArm,
  "qti-response-else": ruleSchema.ResponseElseArm,
  "qti-response-if": ruleSchema.ResponseIfArm,
  "qti-template-else": ruleSchema.TemplateElseArm,
  "qti-template-if": ruleSchema.TemplateIfArm,
};

/**
 * Whether a kind is the `if` or `else` of a condition.
 *
 * @param kind - A node kind.
 * @returns Whether `branchArms` holds an arm for it.
 */
const isBranch = (kind: string): kind is keyof typeof branchArms => kind in branchArms;

type ThinRuleKind = Exclude<
  keyof typeof ruleSchema.arms,
  keyof typeof branchArms | "qti-template-processing" | "xi:fallback" | "xi:include"
>;

/**
 * Whether a kind is a rule whose arm holds the node's id and nothing else.
 *
 * @param kind - A node kind.
 * @returns Whether `ruleSchema.arms` holds a thin arm for it.
 */
const isThinRule = (kind: string): kind is ThinRuleKind =>
  kind in ruleSchema.arms &&
  !isBranch(kind) &&
  kind !== "qti-template-processing" &&
  kind !== "xi:fallback" &&
  kind !== "xi:include";

/**
 * Write one rule's rows: its arm and the `RuleOperand` row of the one expression it holds.
 *
 * A branch arm is written only under its condition, which the caller names; a rule whose element
 * the node index does not hold is skipped by the caller.
 *
 * @param rows - The rows so far.
 * @param input - The processing input.
 * @param node - The rule.
 * @param entry - The node it became.
 * @param conditions - The condition node each branch hangs under, by branch element.
 * @returns The rows with the rule's added.
 */
const ruleRows = (
  rows: Rows,
  input: ProcessingInput,
  node: RuleLike,
  entry: NodeEntry,
  conditions: ReadonlyMap<Element, NodeEntry>,
): Rows => {
  let built = rows;
  if (isBranch(node.kind)) {
    const condition = conditions.get(node.element);
    built =
      condition === undefined
        ? built
        : Rows.add(built, branchArms[node.kind], [{ condition: condition.id, id: entry.id }]);
  } else if (isThinRule(node.kind)) {
    built = Rows.add(built, ruleSchema.arms[node.kind], [{ id: entry.id }]);
  }

  return Rows.add(
    built,
    ruleSchema.RuleOperand,
    Option.toArray(node.expression).flatMap((held) => {
      const child = input.nodes.get(held.element);

      return child === undefined
        ? []
        : [
            {
              child: child.id,
              position: BigInt(node.element.children.indexOf(held.element)),
              rule: entry.id,
              ruleKind: entry.kind,
            },
          ];
    }),
  );
};

/**
 * Write the rows of an `xi:include`: the node, the optional attributes the source wrote and the
 * `Fallback` of its `xi:fallback` child. The include is stored as written and never resolved.
 *
 * @param rows - The rows so far.
 * @param input - The processing input.
 * @param node - The include.
 * @param entry - The node it became.
 * @returns The rows with the include's added.
 */
const includeRows = Effect.fn("import.processing.includeRows")(function* includeRows(
  rows: Rows,
  input: ProcessingInput,
  node: IncludeNode,
  entry: NodeEntry,
): Effect.fn.Return<Rows, ImportRefused> {
  const attributes = readerOf(rows, node, entry);
  const href = attributes.read("href");
  const parse = attributes.read("parse");
  const xpointer = attributes.read("xpointer");
  const encoding = attributes.read("encoding");
  const accept = attributes.read("accept");
  const acceptLanguage = attributes.read("accept-language");
  const own = (value: string) => ({ node: entry.id, value: judgedLater(value) });
  const parseHandle = yield* Option.match(parse, {
    onNone: () => Effect.succeed(Option.none<(typeof XIncludeParseValue.handles)[number]>()),
    onSome: (value) =>
      closedOf(XIncludeParseValue.handles, value, "P6", "the parse attribute of xi:include").pipe(
        Effect.map(Option.some),
      ),
  });
  let built = Rows.add(attributes.rows(), ruleSchema.XInclude, [{ id: entry.id }]);
  built = Rows.add(built, ruleSchema.XIncludeHref, written(href, own));
  built = Rows.add(
    built,
    ruleSchema.XIncludeParse,
    written(parseHandle, (value) => ({ node: entry.id, value })),
  );
  built = Rows.add(built, ruleSchema.XIncludeXpointer, written(xpointer, own));
  built = Rows.add(built, ruleSchema.XIncludeEncoding, written(encoding, own));
  built = Rows.add(built, ruleSchema.XIncludeAccept, written(accept, own));
  built = Rows.add(built, ruleSchema.XIncludeAcceptLanguage, written(acceptLanguage, own));

  return Rows.add(
    built,
    ruleSchema.Fallback,
    Option.toArray(node.fallback).flatMap((element) => {
      const fallback = input.nodes.get(element);

      return fallback === undefined ? [] : [{ id: fallback.id }];
    }),
  );
});

/**
 * Write the arm of the processing root the caller supplied: a template processing with the item it
 * hangs under, or the thin arm of an outcome processing or a fragment. A `qti-response-processing`
 * root is the item importer's row and writes nothing here.
 *
 * @param rows - The rows so far.
 * @param entry - The node the root became.
 * @returns The rows with the root's arm added.
 */
const rootRows = (rows: Rows, entry: NodeEntry): Rows => {
  if (entry.kind === "qti-template-processing") {
    const item = Rows.of(rows, Edge).find((edge) => edge.child === entry.id)?.parent;

    return item === undefined
      ? rows
      : Rows.add(rows, ruleSchema.TemplateProcessing, [{ id: entry.id, item }]);
  }

  return isThinRule(entry.kind)
    ? Rows.add(rows, ruleSchema.arms[entry.kind], [{ id: entry.id }])
    : rows;
};

/**
 * Write the rows of a processing tree: its expressions with their operands, arms and attributes,
 * its rules with their arms and operands, its includes, and the variable references of its
 * expressions and value-setting rules.
 *
 * The tree is judged first, and nothing is written for a tree that fails: it is parsed
 * (`parseProcessing`), every required attribute is looked for (`P5`), and it is type checked
 * (`checkProcessing`). A rule's `identifier` is read for its variable reference only; the
 * `qti-response-processing` root's own rows are the item importer's.
 *
 * @param input - The processing root with the nodes `treeRows` wrote for it, the document and tree
 *   ids, the root kind and the mode, language and environment it is checked in.
 * @param rows - The rows so far, which already hold the tree's node and edge rows.
 * @returns The rows with this tree's added; `ProcessingRefused` for a missing required attribute
 *   (`P5`) or a rule of the checker, `ImportRefused` for a `figures`, `n` or `number-repeats`
 *   literal that is not an integer, and `UnmodeledVocabulary` for an element or attribute the
 *   processing vocabulary does not hold at that place.
 */
export const processingRows = Effect.fn("import.processingRows")(function* processingRows(
  input: ProcessingInput,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused | ProcessingRefused | UnmodeledVocabulary> {
  const ast = yield* parseProcessing(input.root, input.language);
  const missing = firstMissing(flatten(ast.rules));
  if (Option.isSome(missing)) {
    const { attribute, kind, position } = missing.value;

    return yield* new ProcessingRefused({
      detail: `${kind} at ${placeOf(position)} has no ${attribute} attribute, which ${kind} requires. Add ${attribute} with the value the QTI schema asks for.`,
      rule: "P5",
    });
  }

  const checked = checkProcessing(ast, input.env);
  if (checked._tag === "refused") {
    return yield* new ProcessingRefused({
      detail: detailOf(checked.rule, checked.kind, checked.position),
      rule: checked.rule,
    });
  }

  const tree = flatten(checked.typed.rules);
  let built = rows;
  for (const node of tree.expressions) {
    const entry = input.nodes.get(node.element);
    if (entry !== undefined) {
      built = yield* expressionRows(built, input, node, entry);
    }
  }

  const conditions = new Map<Element, NodeEntry>(
    tree.rules.flatMap((node) => {
      const condition = input.nodes.get(node.element);

      return condition === undefined
        ? []
        : node.branches.map((branch): [Element, NodeEntry] => [branch.element, condition]);
    }),
  );
  for (const node of tree.rules) {
    const entry = input.nodes.get(node.element);
    if (entry !== undefined) {
      built = ruleRows(built, input, node, entry, conditions);
      built = referringRules.has(node.kind) ? ruleReferenceRows(built, input, node, entry) : built;
    }
  }

  for (const node of tree.includes) {
    const entry = input.nodes.get(node.element);
    built = entry === undefined ? built : yield* includeRows(built, input, node, entry);
  }

  const root = input.nodes.get(input.root);

  return root === undefined ? built : rootRows(built, root);
});
