/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `DeclarationShape` and the `shape` field are the contract the declaration, value and interaction modules name; the shape here is the typed-or-record choice, not a structure. */

/**
 * The item document's rows: the document itself, the `qti-assessment-item` root, its variable
 * declarations and their value sets and values, the choice interaction with its binding and
 * choices, the response processing with the standard template it names, and the body, prompt,
 * paragraph and image.
 *
 * The expressions and rules inside the response and template processing are written by
 * `processingRows` over the {@link NodeIndex} this module's tree rows built, once the declaration
 * and body rows are in.
 */
import { includeRows } from "#pantry/import/include.ts";
import { judgedLater } from "#pantry/import/judged.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { Effect, Option } from "effect";
import type { Uuid } from "@bjornpagen/grizzle";
import { attributeRows } from "#pantry/import/attributes.ts";
import { contentRows } from "#pantry/import/content.ts";
import { htmlRows } from "#pantry/import/html.ts";
import { interactionRows } from "#pantry/import/interactions.ts";
import { mappingRows } from "#pantry/import/mapping.ts";
import { processingRows as processingTreeRows } from "#pantry/import/processing.ts";
import type { ProcessingRefused } from "#pantry/import/processing.ts";
import {
  closedOf,
  collapse,
  ItemRefusal,
  kindOf,
  replace,
  Rows,
  spelledInteger,
  treeRows,
  typedAttribute,
  UnmodeledVocabulary,
  valueText,
  withParents,
} from "#pantry/import/tree.ts";
import type { NodeIndex, WhiteSpace } from "#pantry/import/tree.ts";
import { environmentOf } from "#pantry/processing/env.ts";
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
} from "#pantry/schema/declaration.ts";
import {
  ChoiceIdentifier,
  LongInterpretationUri,
  ManifestIdentifier,
  OutcomeScaleValue,
  PackagePath,
  RecordFieldIdentifier,
  ToolName,
  ToolVersion,
  VariableReference,
} from "#pantry/schema/contracts.ts";
import type { DeclarationShape } from "#pantry/schema/declaration.ts";
import {
  BooleanLiteral,
  ExternalScored,
  Orientation,
  ShowHide,
  XsBoolean,
} from "#pantry/schema/content/rosters.ts";
import type { XsBooleanHandle } from "#pantry/schema/content/rosters.ts";
import {
  Document,
  DocumentId,
  DocumentIdentifier,
  DocumentTitle,
} from "#pantry/schema/document.ts";
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
} from "#pantry/schema/interaction.ts";
import {
  AssessmentItem,
  AssessmentItemLabel,
  DeclaredAdaptive,
  ItemBody,
  ItemTool,
  ItemToolBoth,
  ItemToolName,
  ItemToolVersion,
  Prompt,
} from "#pantry/schema/item.ts";
import { DocumentLang } from "#pantry/schema/lang.ts";
import { Edge } from "#pantry/schema/node.ts";
import type {
  AncestryHandle,
  AttributeNameHandle,
  NodeKindHandle,
  SchemaVersionHandle,
} from "#pantry/schema/node.ts";
import {
  ResponseProcessing,
  ResponseProcessingItem,
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
  StandardTemplate,
  StandardTemplateReference,
} from "#pantry/schema/processing.ts";
import * as values from "#pantry/schema/value.ts";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * One node of a tree: its id, its kind and the ancestry it sits in.
 */
interface NodeEntry {
  readonly ancestry: AncestryHandle;
  readonly id: Uuid;
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
 * What {@link itemRows} needs to know about the document beside its tree.
 */
export interface ItemInput {
  readonly doc: XmlDocument;
  readonly packageId: Uuid;
  readonly path: string;
  readonly resource: string;
  /**
   * Whether the manifest's LOM record for this resource has a `general` category, as the manifest
   * pass found it.
   */
  readonly resourceLomHasGeneral: boolean;
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
  node: { readonly id: Uuid; readonly kind: NodeKindHandle },
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

const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The collapsed `xml:lang` values of the elements of a tree, each once, in document order.
 */
const distinctLanguages = (
  walked: readonly (readonly [Element, Option.Option<Element>])[],
): readonly string[] => [
  ...new Set(
    walked.flatMap(([element]) =>
      element.attributes
        .filter((attribute) => attribute.namespace === xmlNamespace && attribute.local === "lang")
        .map((attribute) => collapse(attribute.value)),
    ),
  ),
];

/**
 * The `DocumentLang` rows of an item document: one per distinct collapsed `xml:lang` value in its
 * tree, the root included, each flagged by whether the manifest's LOM record for the document's
 * resource has a `general` category.
 *
 * @param rows - The rows so far.
 * @param input - The item's input, which names its package, resource and the flag.
 * @param documentId - The document's id, which is its tree's.
 * @param walked - The elements of the tree beside their parents, as {@link withParents} gives them.
 * @returns The rows with the document's language rows added.
 */
export const documentLangRows = (
  rows: Rows,
  input: Pick<ItemInput, "packageId" | "resource" | "resourceLomHasGeneral">,
  documentId: Uuid,
  walked: readonly (readonly [Element, Option.Option<Element>])[],
): Rows =>
  Rows.add(
    rows,
    DocumentLang,
    distinctLanguages(walked).map((value) => ({
      document: documentId,
      lomGeneral: input.resourceLomHasGeneral ? "yes" : "no",
      package: input.packageId,
      resource: ManifestIdentifier(input.resource),
      value,
    })),
  );

/**
 * The tool row of an item root and the arm that holds the strings it wrote, each processed by its
 * `replace` whitespace class; none when it wrote neither `tool-name` nor `tool-version`. A string
 * that processing changed keeps its lexical form in an `AttributeLexical` row.
 */
const toolRows = (
  rows: Rows,
  root: Element,
  rootNode: { readonly id: Uuid; readonly kind: NodeKindHandle },
  tree: Uuid,
): Rows => {
  const nameRead = attributeOf(rows, root, rootNode, "tool-name", "replace");
  const versionRead = attributeOf(nameRead.rows, root, rootNode, "tool-version", "replace");
  const built = versionRead.rows;
  const name = nameRead.value;
  const version = versionRead.value;
  if (Option.isSome(name) && Option.isSome(version)) {
    return Rows.add(
      Rows.add(built, ItemTool, [{ root: "item", shape: "both", tree }]),
      ItemToolBoth,
      [{ toolName: ToolName(name.value), toolVersion: ToolVersion(version.value), tree }],
    );
  }

  if (Option.isSome(name)) {
    return Rows.add(
      Rows.add(built, ItemTool, [{ root: "item", shape: "nameOnly", tree }]),
      ItemToolName,
      [{ toolName: ToolName(name.value), tree }],
    );
  }

  return Option.isSome(version)
    ? Rows.add(
        Rows.add(built, ItemTool, [{ root: "item", shape: "versionOnly", tree }]),
        ItemToolVersion,
        [{ toolVersion: ToolVersion(version.value), tree }],
      )
    : built;
};

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
 * The variable a declaration names, as the values and bindings of the document copy it.
 */
interface Declared {
  readonly baseType: Option.Option<BaseTypeHandle>;
  readonly cardinality: Option.Option<CardinalityHandle>;
  readonly id: Uuid;
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
const declarationRows = Effect.fn("import.item.declarationRows")(function* declarationRows(
  rows: Rows,
  element: Element,
  node: NodeEntry,
  documentId: Uuid,
): Effect.fn.Return<DeclarationRows, ImportRefused> {
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
        kind: response ? "response" : "outcome",
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

  const externalScoredHandle = Option.isSome(externalScored)
    ? Option.some(
        yield* closedOf(
          ExternalScored.handles,
          externalScored.value,
          "value-lexical",
          "the external-scored attribute of qti-outcome-declaration",
        ),
      )
    : Option.none();
  const owned = (value: Option.Option<string>) =>
    written(value, (own) => ({ declaration, value: own }));
  const ownedAs = <Value extends string>(
    value: Option.Option<string>,
    brand: (text: string) => Value,
  ) => written(value, (own) => ({ declaration, value: brand(own) }));
  built = Rows.add(built, DeclarationView, owned(view));
  built = Rows.add(built, DeclarationInterpretation, owned(interpretation));
  built = Rows.add(
    built,
    DeclarationLongInterpretation,
    ownedAs(longInterpretation, LongInterpretationUri),
  );
  built = Rows.add(built, DeclarationNormalMaximum, owned(normalMaximum));
  built = Rows.add(built, DeclarationNormalMinimum, ownedAs(normalMinimum, OutcomeScaleValue));
  built = Rows.add(built, DeclarationMasteryValue, ownedAs(masteryValue, OutcomeScaleValue));
  built = Rows.add(
    built,
    DeclarationExternalScored,
    written(externalScoredHandle, (own) => ({ declaration, value: own })),
  );
  built = Rows.add(
    built,
    DeclarationVariableIdentifierRef,
    ownedAs(variableIdentifierRef, VariableReference),
  );

  return { declared, identifier: text, rows: built };
});

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
 * The row of a `qti-value` in the arm of each base type but boolean, which {@link booleanValueRow}
 * narrows to its roster first.
 */
const valueArmRows: Record<
  Exclude<BaseTypeHandle, "boolean">,
  (rows: Rows, id: Uuid, text: string) => Rows
> = {
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
 * The row of a boolean `qti-value`: its text, a handle of `BooleanLiteral`.
 *
 * @param rows - The rows so far.
 * @param id - The value node's id.
 * @param text - The text `valueText` gives the value, which the `text-copy` guard requires the row
 *   to copy.
 * @returns The rows with the arm added; `ImportRefused` (`value-lexical`) for text that is neither
 *   `true` nor `false`.
 */
const booleanValueRow = Effect.fn("import.booleanValueRow")(function* booleanValueRow(
  rows: Rows,
  id: Uuid,
  text: string,
): Effect.fn.Return<Rows, ImportRefused> {
  const value = yield* closedOf(
    BooleanLiteral.handles,
    text,
    "value-lexical",
    "a boolean qti-value",
  );

  return Rows.add(rows, values.relations.DeclaredValueBoolean, [{ id, value }]);
});

/**
 * The rows of one `qti-value`: the value at its position, its arm, and for a record value its
 * field. A typed value has its set's base type and a record field has the one it wrote; a value
 * with no base type has no row, and the missing arm is the commit's refusal.
 */
const valueRows = Effect.fn("import.valueRows")(function* valueRows(
  rows: Rows,
  element: Element,
  node: NodeEntry,
  set: { readonly id: Uuid; readonly owner: Declared },
  position: bigint,
): Effect.fn.Return<Rows, ImportRefused> {
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
  const text = valueText(baseType.value, replace(textOf(element)));
  const withArm =
    baseType.value === "boolean"
      ? yield* booleanValueRow(withValue, node.id, text)
      : valueArmRows[baseType.value](withValue, node.id, text);

  return set.owner.shape === "record"
    ? Rows.add(withArm, values.RecordField, [
        { fieldIdentifier: RecordFieldIdentifier(Option.getOrElse(field, () => "")), id: node.id },
      ])
    : withArm;
});

/**
 * Where a choice interaction stands: in an item, which declares the variables it binds to, or in a
 * stimulus, which declares none.
 */
type BindingScope =
  | {
      readonly adaptive: XsBooleanHandle;
      readonly declarations: ReadonlyMap<string, Declared>;
      readonly documentId: Uuid;
      readonly rootKind: "item";
    }
  | { readonly rootKind: "stimulus" };

/**
 * The rows of one `qti-choice-interaction` and, in an item, its binding to the response variable it
 * names.
 *
 * No family builder of `interactions.ts` writes `ChoiceInteraction`, so this M0 builder stays and
 * the pass calls it beside them.
 *
 * @param scope - Where the interaction stands. An item's scope carries its declarations, so the
 *   interaction binds to the declaration it names. A stimulus has none: the arm keeps
 *   `response-identifier` as written, nothing is refused for it and no binding rows are written
 *   (GOAL 5.15).
 * @returns The rows; `ItemRefusal` for an item's `response-identifier` that no declaration of the
 *   document names, since no type can be copied to the binding; `ImportRefused`
 *   (`attribute-lexical`) for a `max-choices` or `min-choices` outside the non-negative integers.
 */
const choiceInteractionRows = Effect.fn("import.choiceInteractionRows")(
  function* choiceInteractionRows(
    rows: Rows,
    element: Element,
    node: NodeEntry,
    scope: BindingScope,
  ): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
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
    const declared =
      scope.rootKind === "item" ? scope.declarations.get(responseIdentifier) : undefined;
    if (scope.rootKind === "item" && declared === undefined) {
      return yield* new ItemRefusal({
        detail: `The choice interaction names the response variable "${responseIdentifier}", which no declaration of this item declares. Declare it with a qti-response-declaration, or correct the response-identifier.`,
        rule: "binding-declared",
      });
    }

    const interactionKind = "qti-choice-interaction";
    const bound = (
      at: Rows,
      name: "max-choices" | "min-choices",
      text: Option.Option<string>,
      fallback: bigint,
    ) =>
      Option.match(text, {
        onNone: () => Effect.succeed({ rows: at, value: fallback }),
        onSome: (spelling) =>
          spelledInteger(
            at,
            node.id,
            interactionKind,
            name,
            spelling,
            "nonNegativeInteger",
            "attribute-lexical",
            `${interactionKind} ${name}`,
          ),
      });
    const max = yield* bound(attributes.rows(), "max-choices", maxChoices, 1n);
    const min = yield* bound(max.rows, "min-choices", minChoices, 0n);
    const orientationHandle = yield* closedOf(
      Orientation.handles,
      Option.getOrElse(orientation, () => "vertical"),
      "attribute-lexical",
      `the orientation attribute of ${interactionKind}`,
    );
    const shuffleHandle = yield* closedOf(
      XsBoolean.handles,
      Option.getOrElse(shuffle, () => "false"),
      "attribute-lexical",
      `the shuffle attribute of ${interactionKind}`,
    );
    let built = min.rows;
    built = Rows.add(built, ChoiceInteraction, [
      {
        id: node.id,
        maxChoicesN: max.value,
        minChoicesN: min.value,
        orientation: orientationHandle,
        responseIdentifier,
        rootKind: scope.rootKind,
        shuffle: shuffleHandle,
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
    if (scope.rootKind === "stimulus" || declared === undefined) {
      return built;
    }

    const { adaptive, documentId } = scope;
    built = Rows.add(built, InteractionBinding, [
      {
        adaptive,
        ancestry: node.ancestry,
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
            maxCount: max.value,
            node: node.id,
            responseIdentifier,
          },
        ])
      : built;
  },
);

/**
 * The rows of one `qti-simple-choice` of the interaction `interaction`.
 */
const choiceRows = Effect.fn("import.choiceRows")(function* choiceRows(
  rows: Rows,
  element: Element,
  node: NodeEntry,
  interaction: Uuid,
): Effect.fn.Return<Rows, ImportRefused> {
  const attributes = reader(rows, element, node);
  const identifier = Option.getOrElse(attributes.read("identifier", "collapse"), () => "");
  const fixed = attributes.read("fixed", "collapse");
  const templateIdentifier = attributes.read("template-identifier", "collapse");
  const showHide = attributes.read("show-hide", "preserve");
  const fixedHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(fixed, () => "false"),
    "attribute-lexical",
    "the fixed attribute of qti-simple-choice",
  );
  const showHideHandle = yield* closedOf(
    ShowHide.handles,
    Option.getOrElse(showHide, () => "show"),
    "attribute-lexical",
    "the show-hide attribute of qti-simple-choice",
  );

  let built = attributes.rows();
  built = Rows.add(built, SimpleChoice, [
    {
      fixed: fixedHandle,
      id: node.id,
      identifier: ChoiceIdentifier(identifier),
      interaction,
      showHide: showHideHandle,
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
    written(templateIdentifier, (own) => ({ node: node.id, value: VariableReference(own) })),
  );
});

/**
 * The rows of one `qti-prompt` under `parent`: the one writer of `Prompt`, which the item loop and
 * {@link unboundChoiceRows} share.
 */
const promptRows = (rows: Rows, node: NodeEntry, parent: NodeEntry): Rows =>
  Rows.add(rows, Prompt, [{ id: node.id, parent: parent.id }]);

/**
 * The choice interaction, simple choice and prompt rows of a tree that declares no variables.
 *
 * GOAL 5.15: "so a stimulus interaction's `response-identifier` is stored as a bare identifier".
 * Each `qti-choice-interaction` is written with the stimulus scope, so it binds to nothing and
 * refuses no identifier; each `qti-simple-choice` whose parent is a choice interaction goes through
 * `choiceRows`; each `qti-prompt` goes through the item pass's prompt writer. The other family
 * kinds are `unboundInteractionRows`'s.
 *
 * @param rows - The rows so far, holding the tree's `Node` rows.
 * @param walked - Each element of the tree with its parent, as `withParents` yields them.
 * @param nodes - The node index of the tree.
 * @returns The rows with the choice arms added; `ImportRefused` (`attribute-lexical`) for a
 *   `max-choices` or `min-choices` outside the non-negative integers. `ItemRefusal` is in the type
 *   because the arm writer shares it with the item scope; the stimulus scope never raises it.
 */
export const unboundChoiceRows = Effect.fn("import.unboundChoiceRows")(function* unboundChoiceRows(
  rows: Rows,
  walked: readonly (readonly [Element, Option.Option<Element>])[],
  nodes: NodeIndex,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  let built = rows;
  for (const [element, parent] of walked) {
    const node = nodes.get(element);
    const parentNode = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    if (node === undefined) {
      continue;
    }

    if (node.kind === "qti-choice-interaction") {
      built = yield* choiceInteractionRows(built, element, node, { rootKind: "stimulus" });
    } else if (
      node.kind === "qti-simple-choice" &&
      Option.isSome(parentNode) &&
      parentNode.value.kind === "qti-choice-interaction"
    ) {
      built = yield* choiceRows(built, element, node, parentNode.value.id);
    } else if (node.kind === "qti-prompt" && Option.isSome(parentNode)) {
      built = promptRows(built, node, parentNode.value);
    }
  }

  return built;
});

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
const processingRows = (rows: Rows, element: Element, node: NodeEntry, item: Uuid): Rows => {
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
  readonly adaptive: XsBooleanHandle;
  readonly documentId: Uuid;
  readonly nodes: NodeIndex;
  readonly positions: ReadonlyMap<string, bigint>;
  readonly rootId: Uuid;
}

/**
 * The rows of the variable declarations, their value sets and values, the choice interactions with
 * their bindings and choices, and the response processing, over the elements of the item in
 * document order.
 *
 * Every declaration is read first, so an interaction binds to a declaration that follows it.
 *
 * Only a simple choice under a choice interaction is written here; one under an order interaction
 * is `orderRows`'s, so no choice is written twice.
 *
 * @returns The rows and the declared variables by identifier, the first declaration of an
 *   identifier winning; `ItemRefusal` for an interaction whose `response-identifier` names no
 *   declaration; `ImportRefused` for a choice interaction's `max-choices` or `min-choices` outside
 *   the non-negative integers.
 */
export const semanticRows = Effect.fn("import.semanticRows")(function* semanticRows(
  rows: Rows,
  input: SemanticInput,
  walked: readonly (readonly [Element, Option.Option<Element>])[],
): Effect.fn.Return<
  { declarations: ReadonlyMap<string, Declared>; rows: Rows },
  ImportRefused | ItemRefusal
> {
  const { adaptive, documentId, nodes, positions, rootId } = input;
  let built = rows;
  const declaredBy = new Map<Element, Declared>();
  const declarations = new Map<string, Declared>();
  for (const [element] of walked) {
    const node = nodes.get(element);
    if (
      node !== undefined &&
      (node.kind === "qti-response-declaration" || node.kind === "qti-outcome-declaration")
    ) {
      const declaration = yield* declarationRows(built, element, node, documentId);
      built = declaration.rows;
      declaredBy.set(element, declaration.declared);
      if (!declarations.has(declaration.identifier)) {
        declarations.set(declaration.identifier, declaration.declared);
      }
    }
  }

  const setOwners = new Map<Element, { id: Uuid; owner: Declared }>();
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
      built = yield* valueRows(built, element, node, set.value, positions.get(node.id) ?? 0n);
    } else if (node.kind === "qti-choice-interaction") {
      built = yield* choiceInteractionRows(built, element, node, {
        adaptive,
        declarations,
        documentId,
        rootKind: "item",
      });
    } else if (
      node.kind === "qti-simple-choice" &&
      Option.isSome(parentNode) &&
      parentNode.value.kind === "qti-choice-interaction"
    ) {
      built = yield* choiceRows(built, element, node, parentNode.value.id);
    } else if (node.kind === "qti-response-processing") {
      built = processingRows(built, element, node, rootId);
    }
  }

  return { declarations, rows: built };
});

/**
 * Write the rows of an item document: its tree, its `Document` row with the identifier and title
 * rows, the item root and the body, prompt rows under it, and, after those,
 * the rows of its response and template processing trees.
 *
 * Every attribute passes through `typedAttribute` with its whitespace class: `identifier`,
 * `adaptive` and `time-dependent` collapse and `title` replaces; the HTML pass applies the classes
 * of the `img` attributes. `adaptive` takes its XSD default `false` when absent. A root may not
 * omit the required `time-dependent`: a stored `false` would be indistinguishable from a present
 * one, so the importer refuses the item as `typed-copy`.
 *
 * After the M0 rows, the M1 builders run in a fixed order, each on the rows so far: the attributes,
 * the HTML profile (every HTML arm, `p` and `img` included), the includes, the interactions, the
 * content models and the mappings. `attributeRows` reads the root kind from the `Tree` row
 * `treeRows` wrote and fails without it, so it runs on rows that hold `treeRows`'s output, never on
 * `Rows.empty()` and never before `treeRows`.
 *
 * @param input - The decoded item and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this item's added, the node index of its tree and the document's id, which
 *   is the tree's; `UnmodeledVocabulary` for a root that is not `qti-assessment-item` in the ASI
 *   namespace, naming it, and for any element or attribute the registries do not model;
 *   `ProcessingRefused` for a response or template processing the processing checker refuses;
 *   `ImportRefused` for a choice interaction's bound outside the non-negative integers.
 */
export const itemRows = Effect.fn("import.itemRows")(function* itemRows(
  input: ItemInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: Uuid },
  ImportRefused | UnmodeledVocabulary | ItemRefusal | ProcessingRefused
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
      path: PackagePath(input.path),
      resource: ManifestIdentifier(input.resource),
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
    resource: ManifestIdentifier(input.resource),
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

  const adaptiveLexical = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(adaptive.value, () => "false"),
    "attribute-lexical",
    "the adaptive attribute of qti-assessment-item",
  );
  const timeDependentHandle = yield* closedOf(
    XsBoolean.handles,
    timeDependent.value.value,
    "attribute-lexical",
    "the time-dependent attribute of qti-assessment-item",
  );
  built = Rows.add(built, AssessmentItem, [
    {
      adaptive: adaptiveLexical,
      id: rootNode.id,
      timeDependent: timeDependentHandle,
      tree: documentId,
    },
  ]);
  built = Rows.add(
    built,
    DeclaredAdaptive,
    Option.isSome(adaptive.value) ? [{ node: rootNode.id }] : [],
  );

  const label = attributeOf(built, root, rootNode, "label", "replace");
  built = label.rows;
  built = Rows.add(
    built,
    AssessmentItemLabel,
    written(label.value, (value) => ({
      node: rootNode.id,
      root: "item",
      tree: documentId,
      value,
      version,
    })),
  );
  built = toolRows(built, root, rootNode, documentId);

  const walked = withParents(root, Option.none());
  built = documentLangRows(built, input, documentId, walked);
  const positions = new Map(Rows.of(tree.rows, Edge).map((edge) => [edge.child, edge.position]));
  const semantic = yield* semanticRows(
    built,
    { adaptive: adaptiveLexical, documentId, nodes, positions, rootId: rootNode.id },
    walked,
  );
  built = semantic.rows;
  const { declarations } = semantic;

  for (const [element, parent] of walked) {
    const node = nodes.get(element);
    const parentNode = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    if (node === undefined) {
      continue;
    }

    if (node.kind === "qti-item-body" && Option.isSome(parentNode)) {
      built = Rows.add(built, ItemBody, [{ id: node.id, item: parentNode.value.id }]);
    } else if (node.kind === "qti-prompt" && Option.isSome(parentNode)) {
      built = promptRows(built, node, parentNode.value);
    }
  }

  built = yield* attributeRows(root, nodes, documentId, built);
  built = yield* htmlRows(root, nodes, built);
  built = yield* includeRows(root, nodes, built);
  built = yield* interactionRows(
    root,
    nodes,
    documentId,
    declarations,
    { adaptive: adaptiveLexical },
    built,
  );
  built = yield* contentRows(root, nodes, documentId, "item", declarations, built);
  built = yield* mappingRows(root, nodes, documentId, declarations, built);

  const env = environmentOf(doc, "item");
  for (const [element] of walked) {
    const node = nodes.get(element);
    if (node?.kind === "qti-response-processing" || node?.kind === "qti-template-processing") {
      built = yield* processingTreeRows(
        {
          document: documentId,
          env,
          language: node.kind === "qti-response-processing" ? "response" : "template",
          mode: "item",
          nodes,
          root: element,
          rootKind: "item",
          tree: documentId,
          version,
        },
        built,
      );
    }
  }

  return { documentId, nodes, rows: built };
});
