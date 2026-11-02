/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `DeclarationShape` and the `shape` field are the contract the declaration, value and interaction modules name; the shape here is the typed-or-record choice, not a structure. */

/**
 * The item document's rows: the document itself, the `qti-assessment-item` root, its variable
 * declarations and their value sets and values, the choice interaction with its binding and
 * choices, the response processing with the standard template it names, and the body, prompt,
 * paragraph and image.
 *
 * Expressions inside the response processing are written by the module that reads the
 * {@link NodeIndex} this one returns.
 */
import { Effect, Option, Schema } from "effect";
import {
  collapse,
  kindOf,
  replace,
  Rows,
  treeRows,
  typedAttribute,
  UnmodeledVocabulary,
} from "#qti/import/tree.ts";
import type { NodeIndex, WhiteSpace } from "#qti/import/tree.ts";
import {
  BaseType,
  Declaration,
  DeclarationExternalScored,
  DeclarationInterpretation,
  DeclarationLongInterpretation,
  DeclarationMasteryValue,
  DeclarationNormalMaximum,
  DeclarationNormalMinimum,
  DeclarationVariableIdentifierRef,
  DeclarationView,
  OutcomeDeclarationArm,
  RecordDeclaration,
  ResponseDeclarationArm,
  ResponseDeclarationId,
  TypedCardinality,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import type { DeclarationShape } from "#qti/schema/declaration.ts";
import { Document, DocumentId, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { Img, ImgHeight, ImgLongdesc, ImgWidth, P } from "#qti/schema/html.ts";
import {
  ChoiceInteraction,
  ChoiceInteractionMaxSelectionsMessage,
  ChoiceInteractionMinSelectionsMessage,
  DeclaredFixed,
  DeclaredMaxChoices,
  DeclaredMinChoices,
  DeclaredOrientation,
  DeclaredShowHide,
  DeclaredShuffle,
  InteractionBinding,
  RecordBinding,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
  TypedBinding,
} from "#qti/schema/interaction.ts";
import { AssessmentItem, DeclaredAdaptive, ItemBody, Prompt } from "#qti/schema/item.ts";
import { Edge } from "#qti/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle, SchemaVersionHandle } from "#qti/schema/node.ts";
import {
  ResponseProcessing,
  ResponseProcessingItem,
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
  StandardTemplate,
  StandardTemplateReference,
} from "#qti/schema/processing.ts";
import * as values from "#qti/schema/value.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * One node of a tree: its id and its kind.
 */
interface NodeEntry {
  readonly id: string;
  readonly kind: NodeKindHandle;
}

type BaseTypeHandle = (typeof BaseType.handles)[number];

type CardinalityHandle = (typeof TypedCardinality.handles)[number];

type ShapeHandle = (typeof DeclarationShape.handles)[number];

/**
 * A published response-processing template the importer recognises by its URI.
 */
export type StandardTemplateHandle = (typeof StandardTemplate.handles)[number];

/**
 * An item the importer reads but whose bindings do not hold together.
 *
 * `rule` names the importer rule the item breaks and `detail` says which part of the item does.
 */
export class ItemRefusal extends Schema.TaggedError<ItemRefusal>()("ItemRefusal", {
  detail: Schema.String,
  rule: Schema.Literals(["binding-declared", "typed-copy"]),
}) {}

/**
 * What {@link itemRows} needs to know about the document beside its tree.
 */
export interface ItemInput {
  readonly doc: XmlDocument;
  readonly packageId: string;
  readonly path: string;
  readonly resource: string;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * The value of the attribute `element` carries under `name` with no namespace, as read.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === name),
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * Process one attribute of an element the way its whitespace class says, appending an
 * `AttributeLexical` row when processing changed it.
 *
 * @returns The processed value, `None` when the element does not carry the attribute, and the rows.
 */
const attributeOf = (
  rows: Rows,
  element: Element,
  node: { readonly id: string; readonly kind: NodeKindHandle },
  name: AttributeNameHandle,
  whiteSpace: WhiteSpace,
): { rows: Rows; value: Option.Option<string> } =>
  Option.match(lexicalOf(element, name), {
    onNone: () => ({ rows, value: Option.none<string>() }),
    onSome: (lexical) => {
      const typed = typedAttribute(rows, node.id, node.kind, name, lexical, whiteSpace);

      return { rows: typed.rows, value: Option.some(typed.value) };
    },
  });

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of booleans and
 * lengths are template-literal types, and the value read is a string until that pattern says it
 * fits, so the cast narrows only the type; a value the pattern refuses is refused there.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * Every element of `element`'s subtree beside its parent element, in document order.
 */
const withParents = (
  element: Element,
  parent: Option.Option<Element>,
): readonly (readonly [Element, Option.Option<Element>])[] => [
  [element, parent],
  ...element.children.flatMap((child) =>
    child.kind === "element" ? withParents(child, Option.some(element)) : [],
  ),
];

/**
 * The attributes of one element, read one at a time with their whitespace class; the rows
 * accumulate the `AttributeLexical` rows the reads produced.
 */
const reader = (rows: Rows, element: Element, node: NodeEntry) => {
  let built = rows;

  return {
    read: (name: AttributeNameHandle, whiteSpace: WhiteSpace): Option.Option<string> => {
      const attribute = attributeOf(built, element, node, name, whiteSpace);
      built = attribute.rows;

      return attribute.value;
    },
    rows: (): Rows => built,
  };
};

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * The handle a roster holds for `text`, none when the roster has no such handle.
 */
const handleOf = <const Handle extends string>(
  handles: readonly Handle[],
  text: Option.Option<string>,
): Option.Option<Handle> =>
  Option.flatMapNullishOr(text, (known) => handles.find((handle) => handle === known));

/**
 * The text children of an element, concatenated; an entity reference the document does not declare
 * contributes nothing.
 */
const textOf = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.value : "")).join("");

/**
 * The non-negative integer a lexical form writes. A form that is not one reads as 0: the lexical
 * column beside it carries the form and its pattern refuses it at commit.
 */
const naturalOf = (lexical: string): bigint =>
  /^\+?[0-9]+$/u.test(lexical) ? BigInt(lexical) : 0n;

/**
 * The variable a declaration names, as the values and bindings of the document copy it.
 */
interface Declared {
  readonly baseType: Option.Option<BaseTypeHandle>;
  readonly cardinality: Option.Option<CardinalityHandle>;
  readonly id: string;
  readonly shape: ShapeHandle;
}

/**
 * What a declaration's rows hand on: the variable it declares, the identifier it names it by and
 * the rows so far.
 */
interface DeclarationRows {
  readonly declared: Declared;
  readonly identifier: string;
  readonly rows: Rows;
}

/**
 * The rows of one `qti-response-declaration` or `qti-outcome-declaration`: the declaration, its
 * kind arm, its typed or record row, the outcome's optional values, and for a response declaration
 * the document's id holder.
 */
const declarationRows = (
  rows: Rows,
  element: Element,
  node: NodeEntry,
  documentId: string,
): DeclarationRows => {
  const attributes = reader(rows, element, node);
  const text = Option.getOrElse(attributes.read("identifier", "collapse"), () => "");
  const cardinalityText = attributes.read("cardinality", "preserve");
  const baseType = handleOf(BaseType.handles, attributes.read("base-type", "preserve"));
  const shape: ShapeHandle = Option.contains(cardinalityText, "record") ? "record" : "typed";
  const cardinality = handleOf(TypedCardinality.handles, cardinalityText);
  const response = node.kind === "qti-response-declaration";
  const view = attributes.read("view", "collapse");
  const interpretation = attributes.read("interpretation", "preserve");
  const longInterpretation = attributes.read("long-interpretation", "collapse");
  const normalMaximum = attributes.read("normal-maximum", "collapse");
  const normalMinimum = attributes.read("normal-minimum", "collapse");
  const masteryValue = attributes.read("mastery-value", "collapse");
  const externalScored = attributes.read("external-scored", "preserve");
  const variableIdentifierRef = attributes.read("variable-identifier-ref", "collapse");
  const declaration = node.id;
  const declared: Declared = { baseType, cardinality, id: declaration, shape };

  let built = attributes.rows();
  built = Rows.add(built, Declaration, [
    {
      document: documentId,
      id: declaration,
      identifier: text,
      kind: response ? "response" : "outcome",
      shape,
    },
  ]);
  built = response
    ? Rows.add(built, ResponseDeclarationArm, [{ id: declaration }])
    : Rows.add(built, OutcomeDeclarationArm, [{ id: declaration }]);
  if (shape === "record") {
    built = Rows.add(built, RecordDeclaration, [{ id: declaration }]);
  } else if (Option.isSome(baseType) && Option.isSome(cardinality)) {
    built = Rows.add(built, TypedDeclaration, [
      {
        baseType: baseType.value,
        cardinality: cardinality.value,
        document: documentId,
        id: declaration,
        identifier: text,
      },
    ]);
  }

  if (response) {
    built = Rows.add(built, DocumentId, [
      { document: documentId, holder: "responseDeclaration", id: text },
    ]);
    built = Rows.add(built, ResponseDeclarationId, [
      { document: documentId, id: text, node: declaration },
    ]);

    return { declared, identifier: text, rows: built };
  }

  const owned = (value: Option.Option<string>) =>
    written(value, (own) => ({ declaration, value: own }));
  built = Rows.add(built, DeclarationView, owned(view));
  built = Rows.add(built, DeclarationInterpretation, owned(interpretation));
  built = Rows.add(built, DeclarationLongInterpretation, owned(longInterpretation));
  built = Rows.add(built, DeclarationNormalMaximum, owned(normalMaximum));
  built = Rows.add(built, DeclarationNormalMinimum, owned(normalMinimum));
  built = Rows.add(built, DeclarationMasteryValue, owned(masteryValue));
  built = Rows.add(built, DeclarationExternalScored, owned(externalScored));
  built = Rows.add(built, DeclarationVariableIdentifierRef, owned(variableIdentifierRef));

  return { declared, identifier: text, rows: built };
};

/**
 * The rows of one `qti-correct-response` or `qti-default-value`: the set, its role arm, its typed
 * or record row, and its interpretation where written.
 */
const valueSetRows = (rows: Rows, element: Element, node: NodeEntry, owner: Declared): Rows => {
  const correct = node.kind === "qti-correct-response";
  const attributes = reader(rows, element, node);
  const interpretation = attributes.read("interpretation", correct ? "preserve" : "replace");

  let built = attributes.rows();
  built = Rows.add(built, values.ValueSet, [
    {
      declaration: owner.id,
      id: node.id,
      role: correct ? "correct" : "default",
      shape: owner.shape,
    },
  ]);
  built = correct
    ? Rows.add(built, values.CorrectResponseArm, [{ id: node.id }])
    : Rows.add(built, values.DefaultValueArm, [{ id: node.id }]);
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

  return Rows.add(
    built,
    values.ValueSetInterpretation,
    written(interpretation, (own) => ({ value: own, valueSet: node.id })),
  );
};

/**
 * The row of a `qti-value` in the arm of its base type.
 */
const valueArmRows: Record<BaseTypeHandle, (rows: Rows, id: string, text: string) => Rows> = {
  boolean: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueBoolean, [{ id, value: judgedLater(text) }]),
  directedPair: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueDirectedPair, [{ id, value: judgedLater(text) }]),
  duration: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueDuration, [{ id, value: judgedLater(text) }]),
  file: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueFile, [{ id, value: judgedLater(text) }]),
  float: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueFloat, [{ id, value: judgedLater(text) }]),
  identifier: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueIdentifier, [{ id, value: judgedLater(text) }]),
  integer: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueInteger, [{ id, value: judgedLater(text) }]),
  pair: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValuePair, [{ id, value: judgedLater(text) }]),
  point: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValuePoint, [{ id, value: judgedLater(text) }]),
  string: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueString, [{ id, value: judgedLater(text) }]),
  uri: (rows, id, text) =>
    Rows.add(rows, values.relations.DeclaredValueUri, [{ id, value: judgedLater(text) }]),
};

/**
 * The rows of one `qti-value`: the value at its position, its arm, and for a record value its
 * field. A typed value has its set's base type and a record field has the one it wrote; a value
 * with no base type has no row, and the missing arm is the commit's refusal.
 */
const valueRows = (
  rows: Rows,
  element: Element,
  node: NodeEntry,
  set: { readonly id: string; readonly owner: Declared },
  position: bigint,
): Rows => {
  const attributes = reader(rows, element, node);
  const field = attributes.read("field-identifier", "collapse");
  const baseType =
    set.owner.shape === "typed"
      ? set.owner.baseType
      : handleOf(BaseType.handles, attributes.read("base-type", "preserve"));
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
  const withArm = valueArmRows[baseType.value](withValue, node.id, replace(textOf(element)));

  return set.owner.shape === "record"
    ? Rows.add(withArm, values.RecordField, [
        { fieldIdentifier: Option.getOrElse(field, () => ""), id: node.id },
      ])
    : withArm;
};

/**
 * The rows of one `qti-choice-interaction` and its binding to the response variable it names.
 *
 * @returns The rows; `ItemRefusal` for a `response-identifier` that no declaration of the document
 *   names, since no type can be copied to the binding.
 */
const interactionRows = Effect.fn("import.interactionRows")(function* interactionRows(
  rows: Rows,
  element: Element,
  node: NodeEntry,
  documentId: string,
  declarations: ReadonlyMap<string, Declared>,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = reader(rows, element, node);
  const responseIdentifier = Option.getOrElse(
    attributes.read("response-identifier", "collapse"),
    () => "",
  );
  const shuffle = attributes.read("shuffle", "collapse");
  const maxChoices = attributes.read("max-choices", "collapse");
  const minChoices = attributes.read("min-choices", "collapse");
  const orientation = attributes.read("orientation", "preserve");
  const minMessage = attributes.read("data-min-selections-message", "replace");
  const maxMessage = attributes.read("data-max-selections-message", "replace");
  const declared = declarations.get(responseIdentifier);
  if (declared === undefined) {
    return yield* new ItemRefusal({
      detail: `The choice interaction names the response variable "${responseIdentifier}", which no declaration of this item declares. Declare it with a qti-response-declaration, or correct the response-identifier.`,
      rule: "binding-declared",
    });
  }

  const maxLexical = Option.getOrElse(maxChoices, () => "1");
  const minLexical = Option.getOrElse(minChoices, () => "0");
  const interactionKind = "qti-choice-interaction";
  let built = attributes.rows();
  built = Rows.add(built, ChoiceInteraction, [
    {
      id: node.id,
      maxChoices: judgedLater(maxLexical),
      maxChoicesN: naturalOf(maxLexical),
      minChoices: judgedLater(minLexical),
      minChoicesN: naturalOf(minLexical),
      orientation: judgedLater(Option.getOrElse(orientation, () => "vertical")),
      responseIdentifier,
      rootKind: "item",
      shuffle: judgedLater(Option.getOrElse(shuffle, () => "false")),
    },
  ]);
  const marker = (value: Option.Option<string>) => written(value, () => ({ node: node.id }));
  built = Rows.add(built, DeclaredShuffle, marker(shuffle));
  built = Rows.add(built, DeclaredMaxChoices, marker(maxChoices));
  built = Rows.add(built, DeclaredMinChoices, marker(minChoices));
  built = Rows.add(built, DeclaredOrientation, marker(orientation));
  built = Rows.add(
    built,
    ChoiceInteractionMinSelectionsMessage,
    written(minMessage, (own) => ({ node: node.id, value: own })),
  );
  built = Rows.add(
    built,
    ChoiceInteractionMaxSelectionsMessage,
    written(maxMessage, (own) => ({ node: node.id, value: own })),
  );
  built = Rows.add(built, InteractionBinding, [
    {
      document: documentId,
      interactionKind,
      node: node.id,
      responseIdentifier,
      shape: declared.shape,
    },
  ]);
  if (declared.shape === "record") {
    return Rows.add(built, RecordBinding, [{ interactionKind, node: node.id }]);
  }

  return Option.isSome(declared.baseType) && Option.isSome(declared.cardinality)
    ? Rows.add(built, TypedBinding, [
        {
          baseType: declared.baseType.value,
          cardinality: declared.cardinality.value,
          document: documentId,
          interactionKind,
          maxCount: naturalOf(maxLexical),
          node: node.id,
          responseIdentifier,
        },
      ])
    : built;
});

/**
 * The rows of one `qti-simple-choice` of the interaction `interaction`.
 */
const choiceRows = (rows: Rows, element: Element, node: NodeEntry, interaction: string): Rows => {
  const attributes = reader(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier", "collapse"), () => "");
  const fixed = attributes.read("fixed", "collapse");
  const templateIdentifier = attributes.read("template-identifier", "collapse");
  const showHide = attributes.read("show-hide", "preserve");

  let built = attributes.rows();
  built = Rows.add(built, SimpleChoice, [
    {
      fixed: judgedLater(Option.getOrElse(fixed, () => "false")),
      id: node.id,
      identifier,
      interaction,
      showHide: judgedLater(Option.getOrElse(showHide, () => "show")),
    },
  ]);
  built = Rows.add(
    built,
    DeclaredFixed,
    written(fixed, () => ({ node: node.id })),
  );
  built = Rows.add(
    built,
    DeclaredShowHide,
    written(showHide, () => ({ node: node.id })),
  );

  return Rows.add(
    built,
    SimpleChoiceTemplateIdentifier,
    written(templateIdentifier, (own) => ({ node: node.id, value: own })),
  );
};

/**
 * The lexical prefixes of a published template's URI; a name follows each, with or without `.xml`.
 */
const templatePrefixes = [
  "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/",
  "https://www.imsglobal.org/question/qti_v3p0/rptemplates/",
] as const;

/**
 * The published response-processing template a `template` URI names.
 *
 * @param uri - The collapsed `template` attribute.
 * @returns The template's handle for one of the two published URI forms, each with or without a
 *   trailing `.xml`; none for any other URI, which the document keeps as written.
 */
export const standardTemplate = (uri: string): Option.Option<StandardTemplateHandle> => {
  const prefix = templatePrefixes.find((known) => uri.startsWith(known));
  if (prefix === undefined) {
    return Option.none();
  }

  const name = uri.slice(prefix.length).replace(/\.xml$/u, "");

  return Option.fromNullishOr(StandardTemplate.handles.find((handle) => handle === name));
};

/**
 * The rows of the item's `qti-response-processing`: the node, its item, its template attributes
 * and the published template the `template` URI names.
 */
const processingRows = (rows: Rows, element: Element, node: NodeEntry, item: string): Rows => {
  const attributes = reader(rows, element, node);
  const template = attributes.read("template", "collapse");
  const location = attributes.read("template-location", "collapse");

  let built = attributes.rows();
  built = Rows.add(built, ResponseProcessing, [{ id: node.id, rootKind: "item" }]);
  built = Rows.add(built, ResponseProcessingItem, [{ id: node.id, item }]);
  built = Rows.add(
    built,
    ResponseProcessingTemplate,
    written(template, (own) => ({ node: node.id, uri: judgedLater(own) })),
  );
  built = Rows.add(
    built,
    ResponseProcessingTemplateLocation,
    written(location, (own) => ({ node: node.id, uri: judgedLater(own) })),
  );

  return Rows.add(
    built,
    StandardTemplateReference,
    written(template.pipe(Option.flatMap(standardTemplate)), (handle) => ({
      node: node.id,
      template: handle,
    })),
  );
};

/**
 * What {@link semanticRows} needs beside the elements: the document and its root, the node of each
 * element and the position of each node under its parent.
 */
interface SemanticInput {
  readonly documentId: string;
  readonly nodes: NodeIndex;
  readonly positions: ReadonlyMap<string, bigint>;
  readonly rootId: string;
}

/**
 * The rows of the variable declarations, their value sets and values, the choice interactions with
 * their bindings and choices, and the response processing, over the elements of the item in
 * document order.
 *
 * Every declaration is read first, so an interaction binds to a declaration that follows it.
 *
 * @returns The rows; `ItemRefusal` for an interaction whose `response-identifier` names no
 *   declaration.
 */
const semanticRows = Effect.fn("import.semanticRows")(function* semanticRows(
  rows: Rows,
  input: SemanticInput,
  walked: readonly (readonly [Element, Option.Option<Element>])[],
): Effect.fn.Return<Rows, ItemRefusal> {
  const { documentId, nodes, positions, rootId } = input;
  let built = rows;
  const declaredBy = new Map<Element, Declared>();
  const declarations = new Map<string, Declared>();
  for (const [element] of walked) {
    const node = nodes.get(element);
    if (
      node !== undefined &&
      (node.kind === "qti-response-declaration" || node.kind === "qti-outcome-declaration")
    ) {
      const declaration = declarationRows(built, element, node, documentId);
      built = declaration.rows;
      declaredBy.set(element, declaration.declared);
      if (!declarations.has(declaration.identifier)) {
        declarations.set(declaration.identifier, declaration.declared);
      }
    }
  }

  const setOwners = new Map<Element, { id: string; owner: Declared }>();
  for (const [element, parent] of walked) {
    const node = nodes.get(element);
    const parentNode = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    if (node === undefined) {
      continue;
    }

    const owner = Option.flatMapNullishOr(parent, (above) => declaredBy.get(above));
    const set = Option.flatMapNullishOr(parent, (above) => setOwners.get(above));
    if (
      (node.kind === "qti-correct-response" || node.kind === "qti-default-value") &&
      Option.isSome(owner)
    ) {
      built = valueSetRows(built, element, node, owner.value);
      setOwners.set(element, { id: node.id, owner: owner.value });
    } else if (node.kind === "qti-value" && Option.isSome(set)) {
      built = valueRows(built, element, node, set.value, positions.get(node.id) ?? 0n);
    } else if (node.kind === "qti-choice-interaction") {
      built = yield* interactionRows(built, element, node, documentId, declarations);
    } else if (node.kind === "qti-simple-choice" && Option.isSome(parentNode)) {
      built = choiceRows(built, element, node, parentNode.value.id);
    } else if (node.kind === "qti-response-processing") {
      built = processingRows(built, element, node, rootId);
    }
  }

  return built;
});

/**
 * Write the rows of an item document: its tree, its `Document` row with the identifier and title
 * rows, the item root and the body, prompt, paragraph and image rows under it.
 *
 * Every attribute passes through `typedAttribute` with its whitespace class: `identifier`,
 * `adaptive`, `time-dependent`, `src` and `longdesc` collapse, `title` replaces, and `alt`,
 * `height` and `width` are kept as read. `adaptive` takes its XSD default `false` when absent. A
 * root may not omit the required `time-dependent`: a stored `false` would be indistinguishable
 * from a present one, so the importer refuses the item as `typed-copy`.
 *
 * @param input - The decoded item and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this item's added, the node index of its tree and the document's id, which
 *   is the tree's; `UnmodeledVocabulary` for a root that is not `qti-assessment-item` in the ASI
 *   namespace, naming it, and for any element or attribute the registries do not model.
 */
export const itemRows = Effect.fn("import.itemRows")(function* itemRows(
  input: ItemInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: string },
  UnmodeledVocabulary | ItemRefusal
> {
  const { doc, packageId, version } = input;
  const { root } = doc;
  if (Option.getOrUndefined(kindOf(root, Option.none())) !== "qti-assessment-item") {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: documentId, kind: "document", root: "item", version },
    rows,
  );
  const { nodes } = tree;
  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: packageId,
      path: input.path,
      resource: input.resource,
      resourceType: input.resourceType,
      root: "item",
      version,
    },
  ]);

  const rootNode = nodes.get(root);
  if (rootNode === undefined) {
    return yield* new ItemRefusal({
      detail: "The item's root element has no node.",
      rule: "binding-declared",
    });
  }

  const common = {
    document: documentId,
    package: packageId,
    resource: input.resource,
    root: "item",
  } as const;
  const identifier = attributeOf(built, root, rootNode, "identifier", "collapse");
  built = identifier.rows;
  built = Rows.add(
    built,
    DocumentIdentifier,
    Option.match(identifier.value, {
      onNone: () => [],
      onSome: (value) => [{ ...common, value }],
    }),
  );
  const title = attributeOf(built, root, rootNode, "title", "replace");
  built = title.rows;
  built = Rows.add(
    built,
    DocumentTitle,
    Option.match(title.value, {
      onNone: () => [],
      onSome: (value) => [{ ...common, collapsed: collapse(value), value }],
    }),
  );
  const adaptive = attributeOf(built, root, rootNode, "adaptive", "collapse");
  built = adaptive.rows;
  const timeDependent = attributeOf(built, root, rootNode, "time-dependent", "collapse");
  built = timeDependent.rows;
  if (Option.isNone(timeDependent.value)) {
    return yield* new ItemRefusal({
      detail: "The item root has no time-dependent attribute, which is required.",
      rule: "typed-copy",
    });
  }

  built = Rows.add(built, AssessmentItem, [
    {
      adaptive: judgedLater(Option.getOrElse(adaptive.value, () => "false")),
      id: rootNode.id,
      timeDependent: judgedLater(timeDependent.value.value),
    },
  ]);
  built = Rows.add(
    built,
    DeclaredAdaptive,
    Option.isSome(adaptive.value) ? [{ node: rootNode.id }] : [],
  );

  const walked = withParents(root, Option.none());
  const positions = new Map(Rows.of(tree.rows, Edge).map((edge) => [edge.child, edge.position]));
  built = yield* semanticRows(built, { documentId, nodes, positions, rootId: rootNode.id }, walked);

  for (const [element, parent] of walked) {
    const node = nodes.get(element);
    const parentNode = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    if (node === undefined) {
      continue;
    }

    if (node.kind === "qti-item-body" && Option.isSome(parentNode)) {
      built = Rows.add(built, ItemBody, [{ id: node.id, item: parentNode.value.id }]);
    } else if (node.kind === "qti-prompt" && Option.isSome(parentNode)) {
      built = Rows.add(built, Prompt, [{ id: node.id, parent: parentNode.value.id }]);
    } else if (node.kind === "p") {
      built = Rows.add(built, P, [{ id: node.id }]);
    } else if (node.kind === "img") {
      const src = attributeOf(built, element, node, "src", "collapse");
      built = src.rows;
      const longdesc = attributeOf(built, element, node, "longdesc", "collapse");
      built = longdesc.rows;
      const height = lexicalOf(element, "height");
      const width = lexicalOf(element, "width");
      built = Rows.add(built, Img, [
        {
          alt: Option.getOrElse(lexicalOf(element, "alt"), () => ""),
          id: node.id,
          src: Option.getOrElse(src.value, () => ""),
        },
      ]);
      built = Rows.add(
        built,
        ImgLongdesc,
        Option.match(longdesc.value, {
          onNone: () => [],
          onSome: (value) => [{ node: node.id, value }],
        }),
      );
      built = Rows.add(
        built,
        ImgHeight,
        Option.match(height, {
          onNone: () => [],
          onSome: (value) => [{ node: node.id, value: judgedLater(value) }],
        }),
      );
      built = Rows.add(
        built,
        ImgWidth,
        Option.match(width, {
          onNone: () => [],
          onSome: (value) => [{ node: node.id, value: judgedLater(value) }],
        }),
      );
    }
  }

  return { documentId, nodes, rows: built };
});
