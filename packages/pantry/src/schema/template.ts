/**
 * What a template or printed variable writes into item content: the template blocks and inlines
 * that show or hide by a template variable, and the printed variable that prints an outcome or
 * template variable.
 *
 * A template block or inline names a template variable in `template-identifier`, and that variable
 * must be a template declaration of the same document holding a single or multiple identifier. A
 * printed variable names an outcome or a template variable; its `base` and `index` are an integer
 * or the name of a variable, and a name must be an integer single outcome or template variable.
 */
import {
  check,
  closed,
  closedId,
  contained,
  on,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import { ShowHide, XsBoolean } from "#qti/schema/content/rosters.ts";
import {
  BaseType,
  Declaration,
  DeclarationKind,
  TypedCardinality,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import { Node } from "#qti/schema/node.ts";
import {
  PrintedVariableIntegerOrVariable,
  RecordFieldIdentifier,
  ShowHideIdentifier,
  VariableReference,
} from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

const xsString = str.regex(patterns.xsString, patterns.xsStringFlags);

/**
 * The attributes of a printed variable that may name a variable instead of an integer.
 */
export const PrintedVariableAttr = closed("PrintedVariableAttr", ["base", "index"]);

/**
 * The `qti-template-block` element. `show-hide` defaults to `show`;
 * `DeclaredTemplateBlockShowHide` marks a block that wrote it. The same element inside a rubric
 * block is a `RubricTemplateBlock`.
 */
export const TemplateBlock = relation(
  "TemplateBlock",
  {
    id: uuid,
    identifier: ShowHideIdentifier,
    showHide: closedId(ShowHide),
    templateIdentifier: VariableReference,
  },
  ["id"],
);

/**
 * A template block that wrote `show-hide`.
 */
export const DeclaredTemplateBlockShowHide = relation(
  "DeclaredTemplateBlockShowHide",
  { node: uuid },
  ["node"],
);

/**
 * A `qti-template-block.rubric`: a template block inside a rubric block's content body, with a
 * template block's fields.
 */
export const RubricTemplateBlock = relation(
  "RubricTemplateBlock",
  {
    id: uuid,
    identifier: ShowHideIdentifier,
    showHide: closedId(ShowHide),
    templateIdentifier: VariableReference,
  },
  ["id"],
);

/**
 * A rubric template block that wrote `show-hide`.
 */
export const DeclaredRubricTemplateBlockShowHide = relation(
  "DeclaredRubricTemplateBlockShowHide",
  { node: uuid },
  ["node"],
);

/**
 * The `qti-template-inline` element. The same element inside a rubric block is a
 * `RubricTemplateInline`.
 */
export const TemplateInline = relation(
  "TemplateInline",
  {
    id: uuid,
    identifier: ShowHideIdentifier,
    showHide: closedId(ShowHide),
    templateIdentifier: VariableReference,
  },
  ["id"],
);

/**
 * A template inline that wrote `show-hide`.
 */
export const DeclaredTemplateInlineShowHide = relation(
  "DeclaredTemplateInlineShowHide",
  { node: uuid },
  ["node"],
);

/**
 * A `qti-template-inline.rubric`: a template inline inside a rubric block's content body, with a
 * template inline's fields.
 */
export const RubricTemplateInline = relation(
  "RubricTemplateInline",
  {
    id: uuid,
    identifier: ShowHideIdentifier,
    showHide: closedId(ShowHide),
    templateIdentifier: VariableReference,
  },
  ["id"],
);

/**
 * A rubric template inline that wrote `show-hide`.
 */
export const DeclaredRubricTemplateInlineShowHide = relation(
  "DeclaredRubricTemplateInlineShowHide",
  { node: uuid },
  ["node"],
);

/**
 * The template variable a template block or inline reads: one row per node of the four kinds
 * (`qti-template-block`, `qti-template-block.rubric`, `qti-template-inline` and
 * `qti-template-inline.rubric`), where
 * `identifier` is its `template-identifier`. `document` and `identifier` name the declaration, and
 * the pair of them with the base type and cardinality copies the typed declaration's.
 */
export const TemplateContentRef = relation(
  "TemplateContentRef",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    identifier: ncName,
    node: uuid,
  },
  ["node"],
);

/**
 * The `qti-printed-variable` element. The defaults are `base` 10, `delimiter` `;`,
 * `mapping-indicator` `=` and `power-form` false, each with a marker for a value that was written.
 * `base` is an integer or a variable name.
 */
export const PrintedVariable = relation(
  "PrintedVariable",
  {
    base: PrintedVariableIntegerOrVariable,
    delimiter: xsString,
    id: uuid,
    identifier: VariableReference,
    mappingIndicator: xsString,
    powerForm: closedId(XsBoolean),
  },
  ["id"],
);

/**
 * A printed variable that wrote `base`.
 */
export const DeclaredPrintedVariableBase = relation("DeclaredPrintedVariableBase", { node: uuid }, [
  "node",
]);

/**
 * A printed variable that wrote `delimiter`.
 */
export const DeclaredPrintedVariableDelimiter = relation(
  "DeclaredPrintedVariableDelimiter",
  { node: uuid },
  ["node"],
);

/**
 * A printed variable that wrote `mapping-indicator`.
 */
export const DeclaredPrintedVariableMappingIndicator = relation(
  "DeclaredPrintedVariableMappingIndicator",
  { node: uuid },
  ["node"],
);

/**
 * A printed variable that wrote `power-form`.
 */
export const DeclaredPrintedVariablePowerForm = relation(
  "DeclaredPrintedVariablePowerForm",
  { node: uuid },
  ["node"],
);

/**
 * A printed variable's `format`, a printf-style conversion, when it has one.
 */
export const PrintedVariableFormat = relation(
  "PrintedVariableFormat",
  { node: uuid, value: str.regex(patterns.printfFormat) },
  ["node"],
);

/**
 * A printed variable's `index`, an integer or a variable name, when it has one.
 */
export const PrintedVariableIndex = relation(
  "PrintedVariableIndex",
  { node: uuid, value: PrintedVariableIntegerOrVariable },
  ["node"],
);

/**
 * A printed variable's `field`, when it has one.
 */
export const PrintedVariableField = relation(
  "PrintedVariableField",
  { node: uuid, value: RecordFieldIdentifier },
  ["node"],
);

/**
 * The variable a printed variable prints: one row per printed variable, naming an outcome or a
 * template declaration of the document.
 */
export const PrintedVariableRef = relation(
  "PrintedVariableRef",
  {
    document: uuid,
    identifier: ncName,
    kind: closedId(DeclarationKind),
    node: uuid,
  },
  ["node"],
);

/**
 * The variable a printed variable's `base` or `index` names, where the attribute is not an
 * integer. The row exists exactly for the non-integer spellings, so it is a typed variable of base
 * type integer and single cardinality, an outcome or a template variable.
 */
export const PrintedVariableVarRef = relation(
  "PrintedVariableVarRef",
  {
    attribute: closedId(PrintedVariableAttr),
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    identifier: ncName,
    kind: closedId(DeclarationKind),
    node: uuid,
  },
  ["node", "attribute"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  DeclaredPrintedVariableBase,
  DeclaredPrintedVariableDelimiter,
  DeclaredPrintedVariableMappingIndicator,
  DeclaredPrintedVariablePowerForm,
  DeclaredRubricTemplateBlockShowHide,
  DeclaredRubricTemplateInlineShowHide,
  DeclaredTemplateBlockShowHide,
  DeclaredTemplateInlineShowHide,
  PrintedVariable,
  PrintedVariableAttr,
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
};

/**
 * The template kinds' arms, keyed by their `NodeKind` handles. Each handle has its own arm:
 * each handle's `mirrors` law binds every row of its arm to a node of that handle, and a node has
 * one kind, so an arm listed under two handles admits no row.
 *
 * Their containments into `Node` are not written here: one `mirrors` per handle in the composed
 * schema (`#qti/schema/qti.ts`) binds them.
 */
export const arms = {
  "qti-printed-variable": PrintedVariable,
  "qti-template-block": TemplateBlock,
  "qti-template-block.rubric": RubricTemplateBlock,
  "qti-template-inline": TemplateInline,
  "qti-template-inline.rubric": RubricTemplateInline,
};

/**
 * The statements over this module's relations. A template reference is a template declaration of
 * its document, with the base type and cardinality its declaration holds, on a node of that
 * document's tree, and its type is an identifier of single or multiple cardinality (R36). A printed
 * variable names an outcome or a template declaration (R37). A variable named by `base` or `index`
 * is an integer single outcome or template variable (R39). Every marker and optional value belongs
 * to its owner.
 */
export const rules = [
  contained(on(DeclaredTemplateBlockShowHide, "node"), on(TemplateBlock, "id")),
  contained(on(DeclaredTemplateInlineShowHide, "node"), on(TemplateInline, "id")),
  contained(on(DeclaredRubricTemplateBlockShowHide, "node"), on(RubricTemplateBlock, "id")),
  contained(on(DeclaredRubricTemplateInlineShowHide, "node"), on(RubricTemplateInline, "id")),
  contained(
    on(TemplateContentRef, "document", "identifier"),
    on(select(Declaration, { kind: "template" }), "document", "identifier"),
  ),
  contained(
    on(TemplateContentRef, "document", "identifier", "baseType", "cardinality"),
    on(TypedDeclaration, "document", "identifier", "baseType", "cardinality"),
  ),
  contained(on(TemplateContentRef, "node", "document"), on(Node, "id", "tree")),
  check("TemplateContentRefType", TemplateContentRef, (r) =>
    r.and(r.eq(r.baseType, "identifier"), r.in(r.cardinality, ["single", "multiple"])),
  ),
  contained(on(DeclaredPrintedVariableBase, "node"), on(PrintedVariable, "id")),
  contained(on(DeclaredPrintedVariableDelimiter, "node"), on(PrintedVariable, "id")),
  contained(on(DeclaredPrintedVariableMappingIndicator, "node"), on(PrintedVariable, "id")),
  contained(on(DeclaredPrintedVariablePowerForm, "node"), on(PrintedVariable, "id")),
  contained(on(PrintedVariableFormat, "node"), on(PrintedVariable, "id")),
  contained(on(PrintedVariableIndex, "node"), on(PrintedVariable, "id")),
  contained(on(PrintedVariableField, "node"), on(PrintedVariable, "id")),
  contained(on(PrintedVariableRef, "node"), on(PrintedVariable, "id")),
  contained(
    on(PrintedVariableRef, "document", "identifier", "kind"),
    on(Declaration, "document", "identifier", "kind"),
  ),
  contained(on(PrintedVariableRef, "node", "document"), on(Node, "id", "tree")),
  check("PrintedVariableRefKind", PrintedVariableRef, (r) => r.in(r.kind, ["outcome", "template"])),
  contained(on(PrintedVariableVarRef, "node"), on(PrintedVariable, "id")),
  contained(
    on(PrintedVariableVarRef, "document", "identifier", "baseType", "cardinality"),
    on(TypedDeclaration, "document", "identifier", "baseType", "cardinality"),
  ),
  contained(
    on(PrintedVariableVarRef, "document", "identifier", "kind"),
    on(Declaration, "document", "identifier", "kind"),
  ),
  contained(on(PrintedVariableVarRef, "node", "document"), on(Node, "id", "tree")),
  check("PrintedVariableVarRefType", PrintedVariableVarRef, (r) =>
    r.and(
      r.eq(r.baseType, "integer"),
      r.eq(r.cardinality, "single"),
      r.in(r.kind, ["outcome", "template"]),
    ),
  ),
] as const;
