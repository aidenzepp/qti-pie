/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` (the typed-or-record choice of a declaration and a value set) is the column name the declaration and value relations fix; it is not a structure. */

/**
 * The rows of the content families of an item: the feedback blocks, inlines and modal feedbacks
 * with their outcome references, the template blocks and inlines with their template references,
 * the printed variables with their variable references, the rubric blocks, the stylesheets, the
 * two hooks, the five content bodies, and the template and context declarations.
 *
 * Phase-1's item pass writes the declarations of the response and outcome kinds and hands their
 * variables in. This builder writes the other two kinds itself, because the template references and
 * the printed variables read them, then resolves every reference against the variables of all four
 * kinds.
 */
import { judgedLater } from "#pantry/import/judged.ts";
import type { Relation, Uuid, uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { attributeReader, markers } from "#pantry/import/interactions.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import type { DeclaredVariable, NodeRef } from "#pantry/import/interactions.ts";
import {
  closedOf,
  ItemRefusal,
  Rows,
  typedAttribute,
  valueText,
  withParents,
} from "#pantry/import/tree.ts";
import { collapse, replace } from "#pantry/import/whitespace.ts";
import type { NodeIndex, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import {
  BaseType,
  ContextDeclarationArm,
  Declaration,
  DeclaredMathVariable,
  DeclaredParamVariable,
  RecordDeclaration,
  TemplateDeclarationArm,
  TypedCardinality,
  TypedDeclaration,
} from "#pantry/schema/declaration.ts";
import {
  RecordFieldIdentifier,
  ShowHideIdentifier,
  StimulusRefHref,
  StimulusRefIdentifier,
  VariableReference,
} from "#pantry/schema/contracts.ts";
import type { DeclarationKind, DeclarationShape } from "#pantry/schema/declaration.ts";
import { ContextDeclarationId, DocumentId } from "#pantry/schema/document.ts";
import {
  ContentBodyFeedback,
  ContentBodyModal,
  ContentBodyRubric,
  ContentBodyRubricTemplate,
  ContentBodyTemplate,
  DeclaredFeedbackBlockShowHide,
  DeclaredFeedbackInlineShowHide,
  DeclaredTemplateFeedbackBlockShowHide,
  FeedbackBlock,
  FeedbackInline,
  FeedbackOutcomeRef,
  ModalFeedback,
  ModalFeedbackTitle,
  TemplateFeedbackBlock,
} from "#pantry/schema/feedback.ts";
import { Edge, Node } from "#pantry/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle, RootKindHandle } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { BooleanLiteral, ShowHide, XsBoolean } from "#pantry/schema/content/rosters.ts";
import {
  CatalogInfo,
  CompanionMaterialsInfo,
  RubricBlock,
  Stylesheet,
  StylesheetMedia,
  StylesheetTitle,
} from "#pantry/schema/rubric.ts";
import {
  DeclaredPrintedVariableBase,
  DeclaredPrintedVariableDelimiter,
  DeclaredPrintedVariableMappingIndicator,
  DeclaredPrintedVariablePowerForm,
  DeclaredRubricTemplateBlockShowHide,
  DeclaredRubricTemplateInlineShowHide,
  DeclaredTemplateBlockShowHide,
  DeclaredTemplateInlineShowHide,
  PrintedVariable,
  PrintedVariableField,
  PrintedVariableFormat,
  PrintedVariableIndex,
  PrintedVariableRef,
  PrintedVariableVarRef,
  RubricTemplateBlock,
  RubricTemplateInline,
  TemplateBlock,
  TemplateContentRef,
  TemplateInline,
} from "#pantry/schema/template.ts";
import { ItemStimulusRef, ItemStimulusRefTitle } from "#pantry/schema/stimulus.ts";
import * as values from "#pantry/schema/value.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

type BaseTypeHandle = (typeof BaseType.handles)[number];

type CardinalityHandle = (typeof TypedCardinality.handles)[number];

type DeclarationKindHandle = (typeof DeclarationKind.handles)[number];

type ShapeHandle = (typeof DeclarationShape.handles)[number];

/**
 * A variable of the item and the kind of declaration that names it.
 */
interface KnownVariable extends DeclaredVariable {
  readonly kind: DeclarationKindHandle;
}

/**
 * What a pass over the item shares: the document, the node of each element, the version and
 * position of each node, the variables the item declares, and the rows so far.
 */
interface Context {
  readonly documentId: Uuid;
  readonly nodes: NodeIndex;
  readonly positions: ReadonlyMap<Uuid, bigint>;
  readonly root: RootKindHandle;
  readonly variables: ReadonlyMap<string, KnownVariable>;
  readonly versions: ReadonlyMap<Uuid, string>;
}

const integerPattern = new RegExp(patterns.xsInteger, "u");

const integerOrVariablePattern = new RegExp(patterns.integerOrVariableString, "u");

/**
 * The handle a roster holds for `text`, none when the roster has no such handle.
 */
const handleOf = <const Handle extends string>(
  handles: readonly Handle[],
  text: Option.Option<string>,
): Option.Option<Handle> =>
  Option.flatMapNullishOr(text, (known) => handles.find((handle) => handle === known));

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * The text children of an element, concatenated.
 */
const textOf = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.value : "")).join("");

/**
 * The value of the attribute `element` carries under `name` with no namespace, as read.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((found) => found.namespace === "" && found.local === name),
  ).pipe(Option.map((found) => found.value));

/**
 * The refusal of a reference to a variable the item does not declare.
 */
const undeclared = (
  kind: NodeKindHandle,
  attribute: AttributeNameHandle,
  identifier: string,
  declaration: string,
) =>
  new ItemRefusal({
    detail: `The ${kind} names the variable "${identifier}" in its ${attribute}, which no ${declaration} of this item declares with a base-type and a cardinality. Declare it, or correct the ${attribute}.`,
    rule: "binding-declared",
  });

/**
 * Write the rows of one value of a default value: its position, its arm and, for a record value,
 * its field.
 */
const valueRows = Effect.fn("import.content.valueRows")(function* valueRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  set: { readonly id: Uuid; readonly owner: DeclaredVariable },
  position: bigint,
): Effect.fn.Return<Rows, ImportRefused> {
  const attributes = attributeReader(rows, element, node);
  const field = attributes.read("field-identifier");
  const baseType =
    set.owner.shape === "typed"
      ? set.owner.baseType
      : handleOf(BaseType.handles, attributes.read("base-type"));
  const built = attributes.rows();
  if (Option.isNone(baseType)) {
    return built;
  }

  const withValue = Rows.add(built, values.DeclaredValue, [
    {
      baseType: baseType.value,
      id: node.id,
      position,
      shape: set.owner.shape,
      valueSet: set.id,
    },
  ]);
  const text = valueText(baseType.value, replace(textOf(element)));
  const { id } = node;
  const arms: Record<Exclude<BaseTypeHandle, "boolean">, () => Rows> = {
    directedPair: () =>
      Rows.add(withValue, values.relations.DeclaredValueDirectedPair, [
        { id, value: judgedLater(text) },
      ]),
    duration: () =>
      Rows.add(withValue, values.relations.DeclaredValueDuration, [
        { id, value: judgedLater(text) },
      ]),
    file: () =>
      Rows.add(withValue, values.relations.DeclaredValueFile, [{ id, value: judgedLater(text) }]),
    float: () =>
      Rows.add(withValue, values.relations.DeclaredValueFloat, [{ id, value: judgedLater(text) }]),
    identifier: () =>
      Rows.add(withValue, values.relations.DeclaredValueIdentifier, [
        { id, value: judgedLater(text) },
      ]),
    integer: () =>
      Rows.add(withValue, values.relations.DeclaredValueInteger, [
        { id, value: judgedLater(text) },
      ]),
    pair: () =>
      Rows.add(withValue, values.relations.DeclaredValuePair, [{ id, value: judgedLater(text) }]),
    point: () =>
      Rows.add(withValue, values.relations.DeclaredValuePoint, [{ id, value: judgedLater(text) }]),
    string: () =>
      Rows.add(withValue, values.relations.DeclaredValueString, [{ id, value: judgedLater(text) }]),
    uri: () =>
      Rows.add(withValue, values.relations.DeclaredValueUri, [{ id, value: judgedLater(text) }]),
  };
  const withArm =
    baseType.value === "boolean"
      ? Rows.add(withValue, values.relations.DeclaredValueBoolean, [
          {
            id,
            value: yield* closedOf(
              BooleanLiteral.handles,
              text,
              "value-lexical",
              "a boolean qti-value",
            ),
          },
        ])
      : arms[baseType.value]();

  return set.owner.shape === "record"
    ? Rows.add(withArm, values.RecordField, [
        { fieldIdentifier: RecordFieldIdentifier(Option.getOrElse(field, () => "")), id },
      ])
    : withArm;
});

/**
 * Write the `qti-default-value` children of a declaration, each with its values.
 */
const defaultValueRows = Effect.fn("import.content.defaultValueRows")(function* defaultValueRows(
  rows: Rows,
  element: Element,
  owner: DeclaredVariable,
  context: Context,
): Effect.fn.Return<Rows, ImportRefused> {
  let built = rows;
  for (const child of element.children) {
    const node = child.kind === "element" ? context.nodes.get(child) : undefined;
    if (child.kind !== "element" || node?.kind !== "qti-default-value") {
      continue;
    }

    const attributes = attributeReader(built, child, node);
    const interpretation = attributes.read("interpretation");
    built = attributes.rows();
    built = Rows.add(built, values.ValueSet, [
      { declaration: owner.id, id: node.id, role: "default", shape: owner.shape },
    ]);
    built = Rows.add(built, values.DefaultValueArm, [{ id: node.id }]);
    if (owner.shape === "record") {
      built = Rows.add(built, values.RecordValueSet, [{ id: node.id }]);
    } else if (Option.isSome(owner.baseType) && Option.isSome(owner.cardinality)) {
      built = Rows.add(built, values.TypedValueSet, [
        {
          baseType: owner.baseType.value,
          cardinality: owner.cardinality.value,
          declaration: owner.id,
          id: node.id,
        },
      ]);
    }

    built = Rows.add(
      built,
      values.ValueSetInterpretation,
      written(interpretation, (own) => ({ value: own, valueSet: node.id })),
    );
    let position = 0n;
    for (const grandchild of child.children) {
      const valueNode = grandchild.kind === "element" ? context.nodes.get(grandchild) : undefined;
      if (grandchild.kind === "element" && valueNode?.kind === "qti-value") {
        built = yield* valueRows(
          built,
          grandchild,
          valueNode,
          { id: node.id, owner },
          context.positions.get(valueNode.id) ?? position,
        );
        position += 1n;
      }
    }
  }

  return built;
});

/**
 * What a template or context declaration hands on: the variable it declares, the identifier it
 * names it by and the rows so far.
 */
interface DeclarationResult {
  readonly identifier: string;
  readonly rows: Rows;
  readonly variable: KnownVariable;
}

/**
 * The rows of one `qti-template-declaration` or `qti-context-declaration`: the declaration, its
 * kind arm and markers, its typed or record row, its default value and, for a context declaration
 * of a 3.0.0 document, the holder rows of its identifier.
 *
 * @returns The rows, and the variable the declaration names.
 */
const declarationRows = Effect.fn("import.content.declarationRows")(function* declarationRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  context: Context,
): Effect.fn.Return<DeclarationResult, ImportRefused> {
  const attributes = attributeReader(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const cardinalityText = attributes.read("cardinality");
  const baseType = handleOf(BaseType.handles, attributes.read("base-type"));
  const cardinality = handleOf(TypedCardinality.handles, cardinalityText);
  const shape: ShapeHandle = Option.contains(cardinalityText, "record") ? "record" : "typed";
  const template = node.kind === "qti-template-declaration";
  const kind: DeclarationKindHandle = template ? "template" : "context";
  const mathVariable = attributes.read("math-variable");
  const paramVariable = attributes.read("param-variable");
  const variable: KnownVariable = { baseType, cardinality, id: node.id, kind, shape };
  const mathVariableHandle = template
    ? yield* closedOf(
        XsBoolean.handles,
        Option.getOrElse(mathVariable, () => "false"),
        "attribute-lexical",
        "the math-variable attribute of qti-template-declaration",
      )
    : "false";
  const paramVariableHandle = template
    ? yield* closedOf(
        XsBoolean.handles,
        Option.getOrElse(paramVariable, () => "false"),
        "attribute-lexical",
        "the param-variable attribute of qti-template-declaration",
      )
    : "false";

  let built = attributes.rows();
  built = Rows.add(built, Declaration, [
    { document: context.documentId, id: node.id, identifier, kind, shape },
  ]);
  if (shape === "record") {
    built = Rows.add(built, RecordDeclaration, [{ id: node.id }]);
  } else if (Option.isSome(baseType) && Option.isSome(cardinality)) {
    built = Rows.add(built, TypedDeclaration, [
      {
        baseType: baseType.value,
        cardinality: cardinality.value,
        document: context.documentId,
        id: node.id,
        identifier,
        kind,
      },
    ]);
  }

  if (template) {
    built = Rows.add(built, TemplateDeclarationArm, [
      {
        id: node.id,
        mathVariable: mathVariableHandle,
        paramVariable: paramVariableHandle,
      },
    ]);
    built = markers(
      built,
      { "math-variable": DeclaredMathVariable, "param-variable": DeclaredParamVariable },
      node.id,
      attributes.written(),
    );
  } else {
    const version = context.versions.get(node.id) ?? "3.0.1";
    built = Rows.add(built, ContextDeclarationArm, [
      { id: node.id, version: judgedLater(version) },
    ]);
    if (version === "3.0.0") {
      built = Rows.add(built, DocumentId, [
        { document: context.documentId, holder: "contextDeclaration", id: identifier },
      ]);
      built = Rows.add(built, ContextDeclarationId, [
        { document: context.documentId, id: identifier, node: node.id },
      ]);
    }
  }

  return {
    identifier,
    rows: yield* defaultValueRows(built, element, variable, context),
    variable,
  };
});

/**
 * The typed variable a reference names, for a reference that copies its type.
 */
const typedVariable = (
  variables: ReadonlyMap<string, KnownVariable>,
  identifier: string,
): Option.Option<{
  readonly baseType: BaseTypeHandle;
  readonly cardinality: CardinalityHandle;
  readonly kind: DeclarationKindHandle;
}> => {
  const found = variables.get(identifier);

  return found !== undefined && Option.isSome(found.baseType) && Option.isSome(found.cardinality)
    ? Option.some({
        baseType: found.baseType.value,
        cardinality: found.cardinality.value,
        kind: found.kind,
      })
    : Option.none();
};

/**
 * Whether the document binds its feedback and printed variables into declarations of its own: an
 * item and a test do. A section declares nothing, so each test that reaches it binds them, and a
 * stimulus stores them bare (goal 5.15), so neither document writes a reference row or is refused
 * `binding-declared` for one.
 */
const bindsVariables = (context: Context): boolean =>
  context.root === "item" || context.root === "test";

/**
 * Write a feedback's reference to the outcome it reads.
 */
const feedbackRef = Effect.fn("import.feedbackRef")(function* feedbackRef(
  rows: Rows,
  node: NodeRef,
  identifier: string,
  context: Context,
): Effect.fn.Return<Rows, ItemRefusal> {
  if (!bindsVariables(context)) {
    return rows;
  }

  const found = typedVariable(context.variables, identifier);
  if (Option.isNone(found)) {
    return yield* undeclared(
      node.kind,
      "outcome-identifier",
      identifier,
      "qti-outcome-declaration",
    );
  }

  return Rows.add(rows, FeedbackOutcomeRef, [
    {
      baseType: found.value.baseType,
      cardinality: found.value.cardinality,
      document: context.documentId,
      identifier,
      node: node.id,
    },
  ]);
});

/**
 * Write a template block's or inline's reference to the template variable it reads.
 */
const templateContentRef = Effect.fn("import.templateContentRef")(function* templateContentRef(
  rows: Rows,
  node: NodeRef,
  identifier: string,
  context: Context,
): Effect.fn.Return<Rows, ItemRefusal> {
  if (context.root === "stimulus") {
    return rows;
  }

  const found = typedVariable(context.variables, identifier);
  if (Option.isNone(found)) {
    return yield* undeclared(
      node.kind,
      "template-identifier",
      identifier,
      "qti-template-declaration",
    );
  }

  return Rows.add(rows, TemplateContentRef, [
    {
      baseType: found.value.baseType,
      cardinality: found.value.cardinality,
      document: context.documentId,
      identifier,
      node: node.id,
    },
  ]);
});

/**
 * The rows of a `qti-feedback-block`, `qti-feedback-block.template` or `qti-feedback-inline`:
 * each kind writes its own arm and its own `show-hide` marker.
 */
const feedbackRows = Effect.fn("import.feedbackRows")(function* feedbackRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  context: Context,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = attributeReader(rows, element, node);
  const outcomeIdentifier = Option.getOrElse(attributes.read("outcome-identifier"), () => "");
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const showHide = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(attributes.read("show-hide"), () => "show"),
    "attribute-lexical",
    `the show-hide attribute of ${node.kind}`,
  );
  const fact = [
    {
      id: node.id,
      identifier: ShowHideIdentifier(identifier),
      outcomeIdentifier: VariableReference(outcomeIdentifier),
      showHide,
    },
  ];
  let built = attributes.rows();
  if (node.kind === "qti-feedback-inline") {
    built = Rows.add(built, FeedbackInline, fact);
    built = markers(
      built,
      { "show-hide": DeclaredFeedbackInlineShowHide },
      node.id,
      attributes.written(),
    );
  } else if (node.kind === "qti-feedback-block.template") {
    built = Rows.add(built, TemplateFeedbackBlock, fact);
    built = markers(
      built,
      { "show-hide": DeclaredTemplateFeedbackBlockShowHide },
      node.id,
      attributes.written(),
    );
  } else {
    built = Rows.add(built, FeedbackBlock, fact);
    built = markers(
      built,
      { "show-hide": DeclaredFeedbackBlockShowHide },
      node.id,
      attributes.written(),
    );
  }

  return yield* feedbackRef(built, node, outcomeIdentifier, context);
});

/**
 * The rows of a `qti-modal-feedback`: the arm, its title where written and the outcome it reads.
 */
const modalRows = Effect.fn("import.modalRows")(function* modalRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  context: Context,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = attributeReader(rows, element, node);
  const outcomeIdentifier = Option.getOrElse(attributes.read("outcome-identifier"), () => "");
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const showHide = yield* closedOf(
    ShowHide.handles,
    yield* requiredAttribute(element, "show-hide", attributes.read("show-hide")),
    "attribute-lexical",
    "the show-hide attribute of qti-modal-feedback",
  );
  const title = attributes.read("title");
  const version = context.versions.get(node.id) ?? "3.0.1";
  let built = attributes.rows();
  built = Rows.add(built, ModalFeedback, [
    {
      id: node.id,
      identifier: ShowHideIdentifier(identifier),
      outcomeIdentifier: VariableReference(outcomeIdentifier),
      showHide,
      version: judgedLater(version),
    },
  ]);
  built = Rows.add(
    built,
    ModalFeedbackTitle,
    written(title, (value) => ({ node: node.id, value: judgedLater(value) })),
  );

  return yield* feedbackRef(built, node, outcomeIdentifier, context);
});

/**
 * The rows of a template block or inline, of the plain or the rubric kind, and the template
 * variable it reads: each of the four kinds writes its own arm and its own `show-hide` marker.
 */
const templateRows = Effect.fn("import.templateRows")(function* templateRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  context: Context,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = attributeReader(rows, element, node);
  const templateIdentifier = Option.getOrElse(attributes.read("template-identifier"), () => "");
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const showHide = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(attributes.read("show-hide"), () => "show"),
    "attribute-lexical",
    `the show-hide attribute of ${node.kind}`,
  );
  const fact = [
    {
      id: node.id,
      identifier: ShowHideIdentifier(identifier),
      showHide,
      templateIdentifier: VariableReference(templateIdentifier),
    },
  ];
  let built = attributes.rows();
  if (node.kind === "qti-template-inline") {
    built = Rows.add(built, TemplateInline, fact);
    built = markers(
      built,
      { "show-hide": DeclaredTemplateInlineShowHide },
      node.id,
      attributes.written(),
    );
  } else if (node.kind === "qti-template-inline.rubric") {
    built = Rows.add(built, RubricTemplateInline, fact);
    built = markers(
      built,
      { "show-hide": DeclaredRubricTemplateInlineShowHide },
      node.id,
      attributes.written(),
    );
  } else if (node.kind === "qti-template-block.rubric") {
    built = Rows.add(built, RubricTemplateBlock, fact);
    built = markers(
      built,
      { "show-hide": DeclaredRubricTemplateBlockShowHide },
      node.id,
      attributes.written(),
    );
  } else {
    built = Rows.add(built, TemplateBlock, fact);
    built = markers(
      built,
      { "show-hide": DeclaredTemplateBlockShowHide },
      node.id,
      attributes.written(),
    );
  }

  return yield* templateContentRef(built, node, templateIdentifier, context);
});

/**
 * What {@link unionAttribute} decides: the rows, the value to store and the variable the value
 * names, `None` for an integer.
 */
interface UnionValue {
  readonly rows: Rows;
  readonly value: string;
  readonly variable: Option.Option<string>;
}

/**
 * The printed variable's `base` or `index`, judged per member as the XSD judges a union.
 *
 * @returns The value to store, the rows, and whether the value names a variable: a value the
 *   integer member admits after collapse is stored collapsed, and any other is stored as read.
 */
const unionAttribute = (
  rows: Rows,
  node: NodeRef,
  name: "base" | "index",
  lexical: string,
): UnionValue => {
  if (integerPattern.test(collapse(lexical))) {
    const typed = typedAttribute(rows, node.id, node.kind, name, lexical, "collapse");

    return { rows: typed.rows, value: typed.value, variable: Option.none() };
  }

  return {
    rows,
    value: lexical,
    variable: integerOrVariablePattern.test(lexical) ? Option.some(lexical) : Option.none(),
  };
};

/**
 * The rows of a `qti-printed-variable`: the arm with its defaults, markers and optional values,
 * the variable it prints and the variables its `base` and `index` name.
 */
const printedRows = Effect.fn("import.printedRows")(function* printedRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  context: Context,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = attributeReader(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier"), () => "");
  const delimiter = attributes.read("delimiter");
  const mappingIndicator = attributes.read("mapping-indicator");
  const powerForm = attributes.read("power-form");
  const format = attributes.read("format");
  const field = attributes.read("field");
  const baseText = attributes.read("base");
  const indexText = attributes.read("index");
  const written$ = attributes.written();
  const powerFormHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(powerForm, () => "false"),
    "attribute-lexical",
    "the power-form attribute of qti-printed-variable",
  );
  let built = attributes.rows();

  const base = unionAttribute(
    built,
    node,
    "base",
    Option.getOrElse(baseText, () => "10"),
  );
  built = base.rows;
  built = Rows.add(built, PrintedVariable, [
    {
      base: judgedLater(base.value),
      delimiter: judgedLater(Option.getOrElse(delimiter, () => ";")),
      id: node.id,
      identifier: VariableReference(identifier),
      mappingIndicator: judgedLater(Option.getOrElse(mappingIndicator, () => "=")),
      powerForm: powerFormHandle,
    },
  ]);
  built = markers(
    built,
    {
      base: DeclaredPrintedVariableBase,
      delimiter: DeclaredPrintedVariableDelimiter,
      "mapping-indicator": DeclaredPrintedVariableMappingIndicator,
      "power-form": DeclaredPrintedVariablePowerForm,
    },
    node.id,
    written$,
  );
  built = Rows.add(
    built,
    PrintedVariableFormat,
    written(format, (value) => ({ node: node.id, value: judgedLater(value) })),
  );
  built = Rows.add(
    built,
    PrintedVariableField,
    written(field, (value) => ({ node: node.id, value: judgedLater(value) })),
  );

  if (!bindsVariables(context)) {
    return built;
  }

  const printed = context.variables.get(identifier);
  if (printed === undefined) {
    return yield* undeclared(
      node.kind,
      "identifier",
      identifier,
      "outcome or template declaration",
    );
  }

  built = Rows.add(built, PrintedVariableRef, [
    { document: context.documentId, identifier, kind: printed.kind, node: node.id },
  ]);

  const named: { name: "base" | "index"; variable: Option.Option<string> }[] = [
    { name: "base", variable: base.variable },
  ];
  if (Option.isSome(indexText)) {
    const index = unionAttribute(built, node, "index", indexText.value);
    built = Rows.add(index.rows, PrintedVariableIndex, [
      { node: node.id, value: judgedLater(index.value) },
    ]);
    named.push({ name: "index", variable: index.variable });
  }

  for (const { name, variable } of named) {
    if (Option.isNone(variable)) {
      continue;
    }

    const found = typedVariable(context.variables, variable.value);
    if (Option.isNone(found)) {
      return yield* undeclared(node.kind, name, variable.value, "outcome or template declaration");
    }

    built = Rows.add(built, PrintedVariableVarRef, [
      {
        attribute: name,
        baseType: found.value.baseType,
        cardinality: found.value.cardinality,
        document: context.documentId,
        identifier: variable.value,
        kind: found.value.kind,
        node: node.id,
      },
    ]);
  }

  return built;
});

/**
 * The rows of a `qti-rubric-block`: its `use` and its `view`, each collapsed.
 */
const rubricRows = (rows: Rows, element: Element, node: NodeRef): Rows => {
  const attributes = attributeReader(rows, element, node);
  const use = attributes.read("use");
  const view = attributes.read("view");
  const collapsed = typedAttribute(
    attributes.rows(),
    node.id,
    node.kind,
    "use",
    Option.getOrElse(use, () => ""),
    "collapse",
  );

  return Rows.add(collapsed.rows, RubricBlock, [
    {
      id: node.id,
      use: judgedLater(collapsed.value),
      view: judgedLater(Option.getOrElse(view, () => "")),
    },
  ]);
};

/**
 * The rows of a `qti-stylesheet` and its optional `media` and `title`; a stylesheet with no `href`
 * is refused.
 */
const stylesheetRows = Effect.fn("import.stylesheetRows")(function* stylesheetRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = attributeReader(rows, element, node);
  const href = yield* requiredAttribute(element, "href", attributes.read("href"));
  const type = Option.getOrElse(attributes.read("type"), () => "");
  const media = attributes.read("media");
  const title = attributes.read("title");
  const built = Rows.add(attributes.rows(), Stylesheet, [
    { href: judgedLater(href), id: node.id, type: judgedLater(type) },
  ]);
  const withMedia = Rows.add(
    built,
    StylesheetMedia,
    written(media, (value) => ({ node: node.id, value: judgedLater(value) })),
  );

  return Rows.add(
    withMedia,
    StylesheetTitle,
    written(title, (value) => ({ node: node.id, value: judgedLater(value) })),
  );
});

/**
 * A relation of one `id` column that no attribute adds to.
 */
type ThinRelation = Relation<string, { readonly id: typeof uuid }, readonly ["id"]>;

/**
 * The relation of each kind that carries no attribute of its own: the five content bodies and the
 * two hooks.
 */
const thinRelations: ReadonlyMap<NodeKindHandle, ThinRelation> = new Map<
  NodeKindHandle,
  ThinRelation
>([
  ["qti-catalog-info", CatalogInfo],
  ["qti-companion-materials-info", CompanionMaterialsInfo],
  ["qti-content-body.feedback", ContentBodyFeedback],
  ["qti-content-body.modal", ContentBodyModal],
  ["qti-content-body.rubric", ContentBodyRubric],
  ["qti-content-body.rubricTemplate", ContentBodyRubricTemplate],
  ["qti-content-body.template", ContentBodyTemplate],
]);

/**
 * The thin arm row of `node`, none for a kind that has no thin arm.
 */
const thinRows = (rows: Rows, node: NodeRef): Rows => {
  const relation = thinRelations.get(node.kind);

  return relation === undefined ? rows : Rows.add(rows, relation, [{ id: node.id }]);
};

/**
 * The attributes of a declaration element the item pass already wrote, read for the variable it
 * names: its identifier, collapsed.
 */
const declaredIdentifier = (element: Element): string =>
  collapse(Option.getOrElse(lexicalOf(element, "identifier"), () => ""));

/**
 * What builds the rows of one kind of element: the elements of the kind, the rows so far and the
 * context, answering the rows or a refusal.
 */
type Builder = (
  rows: Rows,
  element: Element,
  node: NodeRef,
  context: Context,
) => Effect.Effect<Rows, ImportRefused | ItemRefusal>;

/**
 * The rows of a `qti-assessment-stimulus-ref`: the reference with the `identifier` and `href` it
 * must write, and its `title` when it wrote one.
 */
const stimulusRefRows = Effect.fn("import.stimulusRefRows")(function* stimulusRefRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  context: Context,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = attributeReader(rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const href = yield* requiredAttribute(element, "href", attributes.read("href"));
  const title = attributes.read("title");
  const built = Rows.add(attributes.rows(), ItemStimulusRef, [
    {
      document: context.documentId,
      href: StimulusRefHref(href),
      id: node.id,
      identifier: StimulusRefIdentifier(identifier),
    },
  ]);

  return Rows.add(
    built,
    ItemStimulusRefTitle,
    written(title, (value) => ({ node: node.id, value })),
  );
});

/**
 * The builder of each kind that has attributes or references; the thin kinds are written by
 * {@link thinRows}.
 */
const builders: ReadonlyMap<NodeKindHandle, Builder> = new Map<NodeKindHandle, Builder>([
  ["qti-assessment-stimulus-ref", stimulusRefRows],
  ["qti-feedback-block", feedbackRows],
  ["qti-feedback-block.template", feedbackRows],
  ["qti-feedback-inline", feedbackRows],
  ["qti-modal-feedback", modalRows],
  ["qti-printed-variable", printedRows],
  ["qti-rubric-block", (rows, element, node) => Effect.succeed(rubricRows(rows, element, node))],
  ["qti-stylesheet", stylesheetRows],
  ["qti-template-block", templateRows],
  ["qti-template-block.rubric", templateRows],
  ["qti-template-inline", templateRows],
  ["qti-template-inline.rubric", templateRows],
]);

/**
 * What {@link declarationPass} hands on: the rows so far and the variables the item declares.
 */
interface DeclarationPass {
  readonly rows: Rows;
  readonly variables: ReadonlyMap<string, KnownVariable>;
}

/**
 * Write the template and context declarations of the item and collect the variables its four
 * declaration kinds name, by identifier; the first declaration of an identifier names it.
 *
 * @returns The rows and the variables.
 */
const declarationPass = Effect.fn("import.content.declarationPass")(function* declarationPass(
  walked: readonly (readonly [Element, Option.Option<Element>])[],
  nodes: NodeIndex,
  declarations: ReadonlyMap<string, DeclaredVariable>,
  rows: Rows,
  base: Omit<Context, "variables">,
): Effect.fn.Return<DeclarationPass, ImportRefused> {
  const variables = new Map<string, KnownVariable>();
  let built = rows;
  for (const [element] of walked) {
    const node = nodes.get(element);
    if (node?.kind === "qti-response-declaration" || node?.kind === "qti-outcome-declaration") {
      const identifier = declaredIdentifier(element);
      const declared = declarations.get(identifier);
      if (declared !== undefined && !variables.has(identifier)) {
        variables.set(identifier, {
          ...declared,
          kind: node.kind === "qti-outcome-declaration" ? "outcome" : "response",
        });
      }
    } else if (
      node?.kind === "qti-template-declaration" ||
      node?.kind === "qti-context-declaration"
    ) {
      const declaration = yield* declarationRows(built, element, node, { ...base, variables });
      built = declaration.rows;
      if (!variables.has(declaration.identifier)) {
        variables.set(declaration.identifier, declaration.variable);
      }
    }
  }

  return { rows: built, variables };
});

/**
 * Write the rows of the content families of an item.
 *
 * @param root - The item's root element.
 * @param nodes - The node index of the item's tree.
 * @param documentId - The id of the item's document, which is also its tree's.
 * @param documentRoot - The root kind of the document: a `section` document declares nothing, so
 *   its feedback and printed variables bind to no declaration, and neither do a `stimulus`
 *   document's, nor its template content (a stimulus stores them bare); an `item` or a `test`
 *   binds them into its own declarations.
 * @param declarations - The variables the item's response and outcome declarations name, by
 *   identifier, as the item pass wrote them.
 * @param rows - The rows so far, which hold the item's tree.
 * @returns The rows with the feedback, template, printed-variable, rubric, stylesheet, hook,
 *   content-body and template and context declaration rows of the item; `ItemRefusal` for a
 *   feedback, template block or inline, or printed variable that names a variable no declaration of
 *   the item declares with a type, since no type can be copied to its reference; `ImportRefused`
 *   (`value-lexical`) for a boolean default value that is neither `true` nor `false`.
 */
export const contentRows = Effect.fn("import.contentRows")(function* contentRows(
  root: Element,
  nodes: NodeIndex,
  documentId: Uuid,
  documentRoot: RootKindHandle,
  declarations: ReadonlyMap<string, DeclaredVariable>,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary | ItemRefusal | ImportRefused> {
  const walked = withParents(root, Option.none());
  const base = {
    documentId,
    nodes,
    positions: new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.position])),
    root: documentRoot,
    versions: new Map(Rows.of(rows, Node).map((node) => [node.id, node.version])),
  };
  const declared = yield* declarationPass(walked, nodes, declarations, rows, base);
  const context: Context = { ...base, variables: declared.variables };
  let built = declared.rows;
  for (const [element] of walked) {
    const node = nodes.get(element);
    if (node === undefined) {
      continue;
    }

    const builder = builders.get(node.kind);
    built =
      builder === undefined ? thinRows(built, node) : yield* builder(built, element, node, context);
  }

  return built;
});
