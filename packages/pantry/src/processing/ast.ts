import type { Option } from "effect";

import type { NodeKindHandle } from "#pantry/schema/node.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The processing AST: the response, outcome and template processing of an item or test, read from
 * phase-1's immutable XML tree into plain readonly data.
 *
 * Nothing here evaluates. The types name what the parser found and where; typing the expressions
 * is `check.ts`'s work, and the typed AST is declared there.
 */

/**
 * Which processing language a root element is written in.
 */
export type Language = "response" | "outcome" | "template";

/**
 * Where a node sits in its document: the index of the node among its parent's element children,
 * for each step from the root element down. The root is the empty path.
 *
 * The XML tree carries no source position, so the parser computes this one. A refusal names its
 * node by it, rendered as the slash-joined path.
 */
export interface Position {
  readonly path: readonly number[];
}

/**
 * An attribute's value in both forms: as read, and after its `whiteSpace` class is applied.
 *
 * The class travels with the value so the importer can store the typed column and keep the lexical
 * form as a separate row only when the two differ.
 */
export interface AttributeValue {
  readonly lexical: string;
  readonly processed: string;
  readonly whiteSpace: "preserve" | "replace" | "collapse";
}

/**
 * A value that is either a literal or a braced reference to a variable, as the mixed-union
 * attributes (`integerOrVariableRef` and its kin) allow.
 */
export type LiteralOrRef =
  | { readonly _tag: "literal"; readonly value: string }
  | { readonly _tag: "ref"; readonly identifier: string };

/**
 * The kind of a rule or an expression: every node kind but `xi:include`, so that
 * `kind === "xi:include"` holds exactly for an `IncludeNode`, whatever `NodeKind` composes.
 */
export type RuleOrExpressionKind = Exclude<NodeKindHandle, "xi:include">;

/**
 * One expression element with its attributes and operand expressions.
 */
export interface ExpressionNode {
  readonly attributes: ReadonlyMap<string, AttributeValue>;
  readonly element: Element;
  /**
   * The `xi:include` elements inside this expression's wildcard content, in document order: the
   * ones under its foreign children (a `qti-custom-operator`'s), never an operand.
   */
  readonly includes: readonly IncludeNode[];
  readonly kind: RuleOrExpressionKind;
  readonly operands: readonly ExpressionNode[];
  readonly position: Position;
  /**
   * For `qti-base-value`: the concatenation of its text, whitespace and entity-reference children
   * as read, under the `preserve` class.
   */
  readonly text: Option.Option<string>;
}

/**
 * One rule or processing element.
 */
export interface RuleNode {
  readonly attributes: ReadonlyMap<string, AttributeValue>;
  /**
   * A condition's `if`, `else-if` and `else` parts, in document order.
   */
  readonly branches: readonly RuleNode[];
  readonly element: Element;
  /**
   * The single expression of a rule that holds one.
   */
  readonly expression: Option.Option<ExpressionNode>;
  readonly kind: RuleOrExpressionKind;
  readonly position: Position;
  /**
   * A container's sub-rules and includes, in document order.
   */
  readonly rules: readonly (IncludeNode | RuleNode)[];
}

/**
 * An `xi:include` standing where a rule may stand, with its optional `xi:fallback`.
 */
export interface IncludeNode {
  readonly attributes: ReadonlyMap<string, AttributeValue>;
  readonly element: Element;
  readonly fallback: Option.Option<Element>;
  /**
   * The `xi:include` elements inside this include's foreign children, in document order.
   */
  readonly includes: readonly IncludeNode[];
  readonly kind: "xi:include";
  readonly position: Position;
}

/**
 * A processing root: its language, the root element, and its top-level rules in document order.
 */
export interface ProcessingAst {
  readonly language: Language;
  readonly root: Element;
  readonly rules: readonly (IncludeNode | RuleNode)[];
}
