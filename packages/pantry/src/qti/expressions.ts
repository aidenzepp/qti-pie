/**
 * Expressions and processing as laws (plan §1.7 O4, D5; the W5 amendment's C1, C16, C17, C18 and
 * C22; the orchestrator's rulings for Q5.10 of 2026-11-06): the typing the old processing checker
 * did on the host, stated over overlay rows PostgreSQL judges.
 *
 * Every overlay row is keyed by its element's node (or by node and attribute) and copies its
 * node's `nodeRef` tuple; its existence follows from `Node` or `Attribute` by containment, so no
 * element escapes its laws.
 *
 * - **{@link Expression}**, one row per expression element, typed with the expression-typing codes of
 *   `#pantry/qti/expression-types.ts`. Its operands are a counted family (C16): each
 *   {@link Operand} is a flat row naming its operator, carrying its own type as one-bit sets, and
 *   five `Monoid.or` folds gather them into the operator: every operand's base types and
 *   cardinalities, the first operand's cardinalities, and the later operands' base types and
 *   cardinalities. An operand's place is `Node.elements`, its element rank, copied through
 *   `nodeCounts`.
 * - **{@link Processing}**, one row per rule and processing element, carries the processing language
 *   from its root down; each expression takes its parent's.
 * - **{@link VariableRef}**, one row per variable reference a processing element makes, resolves it
 *   to a declaration of its document (`declarationIdentifierRef`, whatever the declaration's
 *   cardinality spells: spec reading 159), a built-in variable (the installed `BuiltInVariable`,
 *   A63), or nothing, which only a document that is no item may hold; a reference to a name its
 *   document declares resolves to it (`DeclaredReference` of `#pantry/qti/queries.ts`). The table
 *   it claims of its declaration is a row of its own, {@link VariableRefTable}, where it claims
 *   one, proved by that table's own row, which hangs from the declaration (`Mapping`,
 *   `AreaMapping`, `LookupTable`). The type a setter or a lookup sets its variable to is a query,
 *   `HeldType`, and the cardinality of each declaration a reference reads one of, where it has one,
 *   a row of its own ({@link VariableRefCardinality}, {@link TemplateDefaultCardinality},
 *   {@link ReadingCardinality}).
 * - **{@link ExpressionAttribute}** carries the attributes an expression's type follows from
 *   (`base-type`, `name`, `weight-identifier`), an unwritten one included, {@link Literal} a base
 *   value's text, and {@link ProcessingTemplate} a response processing's published template.
 * - **A test's references** (spec readings 4, 5, 48, 88 and 117; `representation-gaps.md` §4): every
 *   reference of a document that is no item, a test, a section document or a fragment a test or a
 *   section document splices ({@link TestReference}), is placed once per instance of every test
 *   that places its document ({@link PlacedReference}) and read once per test
 *   ({@link AssembledReference}), its name split at every dot ({@link ReferenceSegment}) and read
 *   in every reading ({@link Reading}), each reading's scope read from the assembly's names and its
 *   variable from the declarations and the item ref's mappings, through the queries of
 *   `#pantry/qti/queries.ts`, and the declaration a resolving reading's variable reads a row of its
 *   own ({@link ReadingDeclaration}); exactly one reading resolves (M3). Beside them, a template
 *   default's and a variable mapping's declarations in the item their item ref names
 *   ({@link TemplateDefaultTarget}, {@link MappingSourceDeclaration}), what a mapping's item ref
 *   names ({@link MappingItemRef}, {@link MappingItemRefType}), and a `section-identifier`'s name
 *   ({@link SectionIdentifier}).
 *
 * The laws, each named by its oracle law with spaces written as underscores, and the rule each
 * keeps: `Arity` (P2); `Operand_fit` and `One_base` (P23); `Condition_type` (P21); `Set_type`
 * (P20); `Lookup_type` (P22); `Reference_type` (P24); `Outcome_only` (P25); `Template_reads` (P26);
 * `Mapped_response` (P27); `Weighted_base` (P29); `Variable_declared` (P8, over an item's names and
 * a test's and a section's unprefixed ones, a braced `pattern` that names none a string value,
 * reading R15-k); `Literal_lexical` (attribute-lexical);
 * `Prefixed_reference` (prefixed-ref); `Section_identifier_target`; `Template_default_target` and
 * `Template_default_type` (P20); `Variable_mapping_source` and `Variable_mapping_target`; and
 * `E1_derived`, every code the host writes proved from what it is derived from, among them each
 * expression's result type and a response processing's published template (the retired rule
 * `template-derivation`). The old guards P31 (every operand edge has its operand row) and P32 (a
 * copy agrees with its source) hold by construction: the operand rows' existence and every copy are
 * containments.
 */
import {
  accumulated,
  Bits,
  bits,
  check,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  fold,
  generated,
  key,
  mirrors,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  pred,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { Array as Arr, Option } from "effect";
import {
  integerMathOperators,
  rpTemplatePattern,
  rpTemplates,
} from "#pantry/grammar/expression.ts";
import { ncNamePattern } from "#pantry/grammar/domains.ts";
import {
  AttributeName,
  BaseType,
  builtInBaseTypes,
  BuiltInVariable,
  Cardinality,
  DeclarationKind,
  NodeKind,
  OperatorArity,
  ResourceType,
  SchemaVersion,
  VariableReference,
} from "#pantry/grammar/install.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import {
  DeclarationBaseType,
  DeclarationCardinality,
  declarationIdentifierRef,
} from "#pantry/qti/declarations.ts";
import {
  BaseTypePattern,
  conditionKindHandles,
  containerKinds,
  declaredKinds,
  firstKinds,
  Language,
  LeadCardinality,
  lookupKindHandle,
  numericKinds,
  oneBaseKinds,
  oneCardinalityKinds,
  OperandBase,
  outcomeOnlyKinds,
  ReadingForm,
  ReadingSource,
  ReferenceBase,
  ReferenceDeclaration,
  ReferencedTable,
  TableReader,
  ReferenceResolution,
  ReferenceRole,
  ResultBase,
  ResultCardinality,
  rootKinds,
  RpTemplate,
  secondKinds,
  TailCardinality,
  ValueBase,
  ValueBaseBit,
  ValueBaseForm,
  spelledBasesPattern,
  ValueBaseOf,
  ValueCardinality,
  ValueCardinalityBit,
  ValueCardinalityOf,
} from "#pantry/qti/expression-types.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { AreaMapping, LookupTable, Mapping } from "#pantry/qti/mapping.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";
import { Instance, ItemRefDocument, ItemRefTarget, VariableMapping } from "#pantry/qti/tests.ts";
import { optionallyTypedKinds, attributeTypedKinds } from "#pantry/vocab/terms/expressions.ts";
import {
  expressionKinds,
  processingReferences,
  referenceDeclarations,
  rootLanguages,
  ruleKindHandles,
  setterKinds,
  valueBaseOf,
  valueCardinalityOf,
} from "#pantry/vocab/terms/expression-types.ts";
import {
  itemKind,
  itemRefKind,
  linkResourceTypes,
  partKind,
  sectionKind,
  sectionRefKind,
  testKind,
} from "#pantry/vocab/terms/tests.ts";

/**
 * The math operators whose result is an integer (`integerMathOperators` of
 * `#pantry/grammar/expression.ts`), as the pattern `Compute.matches` reads, made once.
 */
const integerMathOperatorNames = Compute.pattern(integerMathOperators);

/**
 * What a reference's lexical form holds around the name it spells: XML whitespace `S`, possibly
 * none, which a collapsing type absorbs, or one brace of a braced reference. Exported for
 * `src/import/refusal.ts`, which names its pattern law.
 */
export const Affix = str.regex("^(?:[\\t\\n\\r ]*|\\{|\\})$");

/**
 * XML whitespace `S`, possibly none, as a pattern.
 */
const spacePattern = Compute.pattern("^[\\t\\n\\r ]*$");

/**
 * The pattern of a name a reference spells: an NCName (`ncNamePattern`), the reference member of a
 * literal-or-reference union (`VariableStringDType`, `xs:NCName`, `EncVariableStringDType`'s
 * braced one), which no integer or float literal is but `INF` and `NaN`. Any other value names
 * nothing, and its value domain refuses it alone (spec reading 152).
 */
const namePattern = Compute.pattern<string>(`^${ncNamePattern}$`);

/**
 * The empty base-type set, every operand fold's start.
 */
const noBases = Bits.of(ValueBase, []);

/**
 * The empty cardinality set.
 */
const noCardinalities = Bits.of(ValueCardinality, []);

/**
 * One expression element, keyed by its node: its `nodeRef` tuple, its parent's kind, the
 * processing language it is written in, the type the host gives its value, and its operands.
 *
 * - **the host's:** the `nodeRef` tuple (`node`, `document`, `kind`, `start`, `nearest`, `version`,
 *   `parent`), `parentKind`, `language`, `baseType` and `cardinality`, each proved: the tuple and
 *   the parent's kind by containment, the language by its parent's row, the type by `E1_derived`,
 *   `ResultBase` and `ResultCardinality`;
 * - **drawn:** `operands`, the count of its {@link Operand} rows;
 * - **accumulated,** each a `Monoid.or` fold's end over its operands: `operandBaseTypes` and
 *   `operandCardinalities`, every operand's; `leadCardinalities`, its first operand's;
 *   `tailBaseTypes` and `tailCardinalities`, its later operands'.
 */
export const Expression = relation(
  "Expression",
  {
    baseType: closedId(ValueBase),
    cardinality: closedId(ValueCardinality),
    document: uuid,
    kind: closedId(NodeKind),
    language: closedId(Language),
    leadCardinalities: accumulated(bits(ValueCardinality), noCardinalities),
    nearest: uuid,
    node: uuid,
    operandBaseTypes: accumulated(bits(ValueBase), noBases),
    operandCardinalities: accumulated(bits(ValueCardinality), noCardinalities),
    operands: drawn(natural),
    parent: uuid,
    parentKind: closedId(NodeKind),
    start: natural,
    tailBaseTypes: accumulated(bits(ValueBase), noBases),
    tailCardinalities: accumulated(bits(ValueCardinality), noCardinalities),
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The one tuple of an expression every containment into `Expression` targets, as `nodeRef` is
 * Node's (C18): its node, parent, kind, language and type. An operand, a variable reference, an
 * attribute an expression's type follows from and a literal each copy it, so `Expression` carries
 * one superkey UNIQUE for them all.
 */
export const exprRef = on(
  Expression,
  "node",
  "parent",
  "kind",
  "language",
  "baseType",
  "cardinality",
);

/**
 * One operand: an expression whose parent is an expression, keyed by its node (C16).
 *
 * - **the host's:** `operator`, its parent; `rank`, its element rank among its siblings, and
 *   `children`, its own element children, both `Node`'s (`nodeCounts`); and its own `kind`,
 *   `language`, `baseType` and `cardinality`, its {@link Expression} row's;
 * - **generated:** `baseTypeBit` and `cardinalityBit`, its type as one-bit sets (C6), the steps of
 *   its operator's folds: ∅ for `qti-null`'s `any` base type and for an `unknown` cardinality.
 */
export const Operand = relation.generated(
  "Operand",
  {
    baseType: closedId(ValueBase),
    cardinality: closedId(ValueCardinality),
    children: natural,
    kind: closedId(NodeKind),
    language: closedId(Language),
    node: uuid,
    operator: uuid,
    rank: natural,
  },
  ["node"],
  (r) => ({
    baseTypeBit: generated(bits(ValueBase), ValueBaseBit.row(r.baseType)),
    cardinalityBit: generated(bits(ValueCardinality), ValueCardinalityBit.row(r.cardinality)),
  }),
);

/**
 * Each expression's operands, counted by `Expression.operands`: a flat row whose group key names
 * its operator.
 */
export const operandFamily = counted(on(Operand, "operator"), fin(Expression, "operands"));

/**
 * One rule or processing element, keyed by its node: its `nodeRef` tuple, its parent's kind, and
 * the processing language it is written in, which its root opens and every rule below it carries.
 */
export const Processing = relation(
  "Processing",
  {
    document: uuid,
    kind: closedId(NodeKind),
    language: closedId(Language),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    parentKind: closedId(NodeKind),
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One variable reference a processing element makes, keyed by the element's node and the attribute
 * it makes it by (`VariableReference`'s rows over the processing kinds), and what it names.
 *
 * - **the copy:** `kind` and `lexical`, the attribute's, from `Attribute`;
 * - **the host's:** `before`, `identifier` and `after`, the lexical form split around the name it
 *   spells, the whitespace around a bare name or the braces around a braced one; `parent`,
 *   `language`, `elementBase` and `elementCardinality`, its element's (`exprRef` for an expression,
 *   the language for a rule); `rootKind`, its document's root's; `resolution`; and `baseType` and
 *   `cardinality`, the variable's type.
 *
 * The declaration a declared reference names is a row of its own, {@link VariableRefDeclaration}
 * (lane NIL's NS1: a reference that names no declaration has no declaration row, never the nil
 * uuid), and so are the table its element needs that declaration to hold, {@link VariableRefTable},
 * where it claims one, and the type of a setter's or a lookup's one expression, {@link HeldType}. A
 * type field its element leaves unread holds `unknown`.
 */
export const VariableRef = relation(
  "VariableRef",
  {
    after: Affix,
    attribute: closedId(AttributeName),
    baseType: closedId(ValueBase),
    before: Affix,
    cardinality: closedId(ValueCardinality),
    document: uuid,
    elementBase: closedId(ValueBase),
    elementCardinality: closedId(ValueCardinality),
    identifier: keyText,
    kind: closedId(NodeKind),
    language: closedId(Language),
    lexical: keyText,
    node: uuid,
    parent: uuid,
    resolution: closedId(ReferenceResolution),
    rootKind: closedId(NodeKind),
  },
  ["node", "attribute"],
);

/**
 * The declaration a declared {@link VariableRef} names, keyed as the reference: its
 * `declarationIdentifierRef` tuple (`declaration`, `declarationKind`, `declCardinalities` and
 * `declBaseTypes`, with its reference's `document` and `identifier`), whatever the declaration's
 * cardinality spells (spec reading 159), and the reference's fields its laws read beside it, each
 * copied from the reference: its `baseType` is `unknown` where the declaration has no base type, a
 * record's or one that spells nothing, and else its {@link DeclarationBaseType}'s `valueBase` (lane
 * NIL's audit, B12); its `cardinality` is `unknown` where the declaration has no cardinality, and
 * else its {@link VariableRefCardinality}'s. A reference exactly where its `resolution` is
 * `declared` has one (lane NIL's NS1), so one that names a built-in variable or nothing has none.
 */
export const VariableRefDeclaration = relation(
  "VariableRefDeclaration",
  {
    attribute: closedId(AttributeName),
    baseType: closedId(ValueBase),
    cardinality: closedId(ValueCardinality),
    declBaseTypes: natural,
    declCardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    language: closedId(Language),
    node: uuid,
  },
  ["node", "attribute"],
);

/**
 * A declared {@link VariableRef}'s declaration beside its cardinality, keyed as the reference,
 * where the declaration has one (spec reading 159): `declaration`, its
 * {@link VariableRefDeclaration}'s; `declCardinality`, the declaration's
 * {@link DeclarationCardinality}'s; and `cardinality`, the reference's type's, which `E1_derived`
 * holds to `ValueCardinalityOf`'s image of it. A reference to a declaration whose cardinality is
 * unwritten or spells nothing has none, and its type's cardinality is `unknown`, so no law reads a
 * cardinality the declaration does not have, and AL3 or its value domain refuses it alone (spec
 * reading 158): a missing value is a row of its own relation, never a sentinel.
 */
export const VariableRefCardinality = relation(
  "VariableRefCardinality",
  {
    attribute: closedId(AttributeName),
    cardinality: closedId(ValueCardinality),
    declCardinality: closedId(Cardinality),
    declaration: uuid,
    node: uuid,
  },
  ["node", "attribute"],
);

/**
 * The table a declared {@link VariableRef} claims of its declaration, keyed as the reference, where
 * it claims one: a map response's `qti-mapping`, a map response point's `qti-area-mapping`, or a
 * lookup's `qti-match-table` or `qti-interpolation-table` (information model §2.11.3.29,
 * §2.11.3.30 and §2.5.1.4), the one its declaration holds, with the reference's `kind` and its
 * declaration, each copied from its {@link VariableRefDeclaration}. Only a reference by
 * `identifier` claims one, of a table its kind reads (`TableReader`), and the declaration holds it:
 * the claim is a containment into the table's own row, keyed by the declaration.
 *
 * A reference that claims no table has no row (AGENTS.md's Schema intent: a value that may be
 * missing is a row of its own relation, never a sentinel). A map response, a map response point or
 * a lookup by `identifier` whose declaration holds no table it reads has none, so `Mapped_response`
 * or `Lookup_type` refuses it, and a reference of any other kind, or to a built-in variable or to
 * nothing, claims none.
 */
export const VariableRefTable = relation(
  "VariableRefTable",
  {
    attribute: closedId(AttributeName),
    declaration: uuid,
    kind: closedId(NodeKind),
    node: uuid,
    table: closedId(ReferencedTable),
  },
  ["node", "attribute"],
);

/**
 * One variable reference of an instance of an item's assembly (Q5.13's `Instance`, spec reading
 * 117), keyed by the instance and the reference's element node and attribute: a
 * {@link VariableRef} of the instance's document, its name resolved among the item's
 * declarations, else to one of the item's built-in variables, else to nothing, so a response or
 * outcome rule fragment's references name its item's variables ("Variable declared" over the
 * assembly). `rootKind` is the assembly's root's, an item's. The declaration a declared one names
 * is a row of its own, {@link PlacedVariableRefDeclaration} (lane NIL's NS1).
 */
export const PlacedVariableRef = relation(
  "PlacedVariableRef",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    document: uuid,
    identifier: keyText,
    instance: uuid,
    kind: closedId(NodeKind),
    node: uuid,
    resolution: closedId(ReferenceResolution),
    rootKind: closedId(NodeKind),
  },
  ["instance", "node", "attribute"],
);

/**
 * The declaration a declared {@link PlacedVariableRef} names among its assembly's item's
 * declarations, keyed as the placed reference: its `declarationIdentifierRef` tuple (with its
 * `assembly` as its document and its `identifier`), whatever the declaration's cardinality spells
 * (spec reading 159), and its reference's `kind` and `attribute`. A placed reference exactly where
 * its `resolution` is `declared` has one (lane NIL's NS1).
 */
export const PlacedVariableRefDeclaration = relation(
  "PlacedVariableRefDeclaration",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    declBaseTypes: natural,
    declCardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    identifier: keyText,
    instance: uuid,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["instance", "node", "attribute"],
);

/**
 * Each document's variable references, counted by `Document.variables`.
 */
export const documentVariableFamily = counted(
  on(VariableRef, "document"),
  fin(Document, "variables"),
);

/**
 * Each item instance's variable references, counted by `Instance.variables`, its document's count.
 */
export const placedVariableFamily = counted(
  on(PlacedVariableRef, "instance"),
  fin(Instance, "variables"),
);

/**
 * One attribute an expression's type follows from, keyed by its element's node and its name: a
 * base value's and a test variables' `base-type`, a test variables' `weight-identifier`, and a math
 * operator's `name`, with its lexical form and its element's `exprRef` tuple.
 *
 * `written` says whether the element writes it. A test variables' `base-type`, which it may omit
 * ({@link optionallyTypedKinds}), has a row on every test variables, so one that omits it has one
 * too, unwritten, with an empty lexical form (M2, `representation-gaps.md` §1: absence as a keyed
 * null object, which the attribute's own copy refutes where it is written). So does its optional
 * `weight-identifier`, so that "not weighted" is a row too: an unwritten `base-type` is `unknown`
 * where the weight is unwritten and float where it is written (information model §7.39.5: "When a
 * weighting is specified the result of the expression always has base-type float"; decision 434). A
 * base value's `base-type` and a math operator's `name` are required, so an element that omits one
 * has no row, and AL3 refuses it alone.
 */
export const ExpressionAttribute = relation(
  "ExpressionAttribute",
  {
    attribute: closedId(AttributeName),
    baseType: closedId(ValueBase),
    cardinality: closedId(ValueCardinality),
    kind: closedId(NodeKind),
    language: closedId(Language),
    lexical: keyText,
    node: uuid,
    parent: uuid,
    written: pg.boolean,
  },
  ["node", "attribute"],
);

/**
 * A base value, keyed by its `qti-base-value` node: its `exprRef` tuple and its text, its node's
 * string value. The code its `base-type` spells is its optional part, {@link LiteralTyped}.
 */
export const Literal = relation(
  "Literal",
  {
    baseType: closedId(ValueBase),
    cardinality: closedId(ValueCardinality),
    kind: closedId(NodeKind),
    language: closedId(Language),
    node: uuid,
    parent: uuid,
    text: keyText,
  },
  ["node"],
);

/**
 * A base value's type, keyed by its `qti-base-value` node, where its `base-type` spells a base: its
 * text, the declaration code `BaseTypePattern` is keyed by, and its base type, each its
 * {@link Literal} row's. A base value whose `base-type` spells none has an `unknown` base type and
 * no row here, so no law reads its text in a type it does not have, and AL1's value domain refuses
 * its `base-type` alone.
 */
export const LiteralTyped = relation(
  "LiteralTyped",
  {
    baseType: closedId(ValueBase),
    node: uuid,
    text: keyText,
    typeCode: closedId(BaseType),
  },
  ["node"],
);

/**
 * A response processing's `template` URI, keyed by its `qti-response-processing` node, and the
 * published template it names, `none` for one it names none of (`template-derivation`, C17).
 */
export const ProcessingTemplate = relation(
  "ProcessingTemplate",
  { node: uuid, template: closedId(RpTemplate), uri: keyText },
  ["node"],
);

/**
 * A test's template default, keyed by its `qti-template-default` node (the UP audit's A37 and A38;
 * spec reading 108): its item ref (`itemRef`, its parent) and its `template-identifier` as written
 * (`lexical`) and collapsed (`lead`, `template`, `trail`). It exists exactly where the attribute is
 * written, which every template default must write (AL3). What only a template the item declares
 * has, its declaration and its expression's type, is {@link TemplateDefaultTarget}'s. The
 * information model says of TemplateDefault (§5.152) "The default value of a template variable in
 * an item can be overridden based on the test context ... The value is obtained by evaluating an
 * expression defined within the reference to the item at test level", and of `template-identifier`
 * (§5.152.1) "The identifier of the template variable affected".
 */
export const TemplateDefault = relation(
  "TemplateDefault",
  {
    itemRef: uuid,
    lead: Space,
    lexical: keyText,
    node: uuid,
    template: keyText,
    trail: Space,
  },
  ["node"],
);

/**
 * The variable a template default affects, keyed by its `qti-template-default` node: a row of its
 * own, since a template default whose item declares no such variable has none (the ruling of
 * 2026-11-06, AGENTS.md's Schema intent: a value that may be missing is a row of its own relation).
 * It holds the item its item ref names (`itemDocument`, through `ItemRefDocument`), the
 * declaration of that item `template` names, whatever its cardinality spells (spec reading 159),
 * with its kind and its counts of cardinalities and base types, and `heldBase` and
 * `heldCardinality`, its one expression's type, with its `TemplateDefault`'s `itemRef` and
 * `template`. Every template default has one ("Template default target"), whose declaration is a
 * template declaration (`Template_default_target`) of a type its expression fits
 * (`Template_default_type`): its base type, where the declaration has one, its
 * {@link DeclarationBaseType}'s, and its cardinality, where it has one, its
 * {@link TemplateDefaultCardinality}'s.
 */
export const TemplateDefaultTarget = relation(
  "TemplateDefaultTarget",
  {
    declBaseTypes: natural,
    declCardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    heldBase: closedId(ValueBase),
    heldCardinality: closedId(ValueCardinality),
    itemDocument: uuid,
    itemRef: uuid,
    node: uuid,
    template: keyText,
  },
  ["node"],
);

/**
 * A template default's target beside its declaration's cardinality, keyed by the template default's
 * node, where the declaration has one (spec reading 159): `declaration` and `heldCardinality`, its
 * {@link TemplateDefaultTarget}'s, and `declCardinality`, the declaration's
 * {@link DeclarationCardinality}'s, which `Template_default_type` holds the expression's
 * cardinality to. A target whose declaration's cardinality is unwritten or spells nothing has none,
 * so the law reads no cardinality the declaration does not have, and AL3 or its value domain
 * refuses it alone (spec reading 158).
 */
export const TemplateDefaultCardinality = relation(
  "TemplateDefaultCardinality",
  {
    declCardinality: closedId(Cardinality),
    declaration: uuid,
    heldCardinality: closedId(ValueCardinality),
    node: uuid,
  },
  ["node"],
);

/**
 * A variable mapping's source in the item it maps, keyed by the mapping's node (the UP audit's A34;
 * spec readings 97 and 107): a row of its own, since a mapping whose item declares no variable of
 * its source's name has none (the ruling of 2026-11-06). It holds its item ref and the item that
 * names (`itemDocument`, through `ItemRefDocument`), its collapsed `source` and `target`
 * (`VariableMapping`'s, each copied by a containment of its own, since one index holds at most one
 * key text, `#pantry/qti/limits.ts`), the declaration of the item `source` names, whatever its
 * cardinality spells (spec reading 159), with its kind and its counts of cardinalities and base
 * types. Every mapping has one ("Variable mapping source"), whose declaration is an outcome
 * declaration (`Variable_mapping_source`); where the item declares `target` too, that is the
 * source itself (`Variable_mapping_target`, over `DeclaredTarget` of `#pantry/qti/queries.ts`).
 */
export const MappingSourceDeclaration = relation(
  "MappingSourceDeclaration",
  {
    declBaseTypes: natural,
    declCardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    itemDocument: uuid,
    itemRef: uuid,
    node: uuid,
    source: keyText,
    target: keyText,
  },
  ["node"],
);

/**
 * A variable mapping's item ref, keyed by the mapping's node (spec reading 110): `itemRef`,
 * `VariableMapping`'s `parent`, and `types`, drawn: its count of {@link MappingItemRefType} rows, 1
 * where the item ref has a target and 0 where it has none: it writes no href, which AL3 alone
 * refuses (spec reading 155), or its href names no resource of a type the importer reads, which
 * "Item ref target" refuses over the item ref unless a resource of an unread type names its path,
 * itself AL1's refusal (`#pantry/qti/tests.ts` `ItemRefHref`). Every mapping has one. A mapping
 * whose item ref names an LTI link has no item, so no source declaration, and is accepted
 * unchecked; every other, one under an item ref with no target among them, must have its
 * {@link MappingSourceDeclaration} ("Variable mapping source").
 */
export const MappingItemRef = relation(
  "MappingItemRef",
  { itemRef: uuid, node: uuid, types: drawn(natural) },
  ["node"],
);

/**
 * What a variable mapping's item ref names, keyed by the mapping's node, where the item ref has a
 * target, a counted member of its {@link MappingItemRef}: its item ref (`itemRef`) and `type`, its
 * `ItemRefTarget`'s, copied from it. A mapping under an item ref with no target has no row, so no
 * type stands for it (decision 428, as `DeclarationBaseType` holds a declaration's base type only
 * where it has one).
 */
export const MappingItemRefType = relation(
  "MappingItemRefType",
  { itemRef: uuid, node: uuid, type: closedId(ResourceType) },
  ["node"],
);

/**
 * Each mapping's item ref's type, counted by `MappingItemRef.types`: one row or none, a mapping's
 * under an item ref with no target.
 */
export const mappingItemRefTypeFamily = counted(
  on(MappingItemRefType, "node"),
  fin(MappingItemRef, "types"),
);

/**
 * A `section-identifier`, keyed by its element's node (the UP audit's A61): the attribute, its
 * element's kind and its lexical form, copied from `Attribute` (C18); its element's document and
 * that document's root kind; and its split around the name it spells, `lexical = before ‖
 * identifier ‖ after`, the whitespace an `IdentifierDType` collapses.
 */
export const SectionIdentifier = relation(
  "SectionIdentifier",
  {
    after: Space,
    attribute: closedId(AttributeName),
    before: Space,
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    lexical: keyText,
    node: uuid,
    rootKind: closedId(NodeKind),
  },
  ["node"],
);

/**
 * A reference a document that is no item makes, keyed by its element and the attribute it makes it
 * by: every `VariableRef` of such a document (role `variable`) and every `section-identifier` there
 * (role `section`), with its document, root kind, element kind and the name it spells. These
 * resolve against each test that places the document, not against the document alone (spec
 * reading 5), each once per test ({@link AssembledReference}): a test's own, a section document's,
 * and a fragment's that a test or a section document splices, as the merged test holds it (spec
 * reading 117). An item's resolve in its own declarations (`VariableRef`), and no test places an
 * item: an item ref names one, never a site, and an include that names one is refused under
 * "Include root".
 */
export const TestReference = relation(
  "TestReference",
  {
    attribute: closedId(AttributeName),
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    node: uuid,
    role: closedId(ReferenceRole),
    rootKind: closedId(NodeKind),
  },
  ["node", "attribute"],
);

/**
 * A document that is no item, keyed by its node: the owner of its {@link TestReference} rows,
 * `references` their count, 0 for a document that makes none. Every such document has its row, as
 * every document whose references resolve in another's has its `ReferringDocument`, so any of them
 * a test places counts its references there.
 */
export const ReferenceDocument = relation(
  "ReferenceDocument",
  { document: uuid, references: drawn(natural) },
  ["document"],
);

/**
 * One instance of a test's assembly whose document is no item (`Instance`, RG3), keyed by the
 * instance: its assembly, its assembly's root kind and the document it places, and `references`,
 * its {@link PlacedReference} rows' count, which equals its document's (`ReferenceDocument`).
 */
export const PlacedDocument = relation(
  "PlacedDocument",
  {
    assembly: uuid,
    assemblyKind: closedId(NodeKind),
    document: uuid,
    instance: uuid,
    references: drawn(natural),
  },
  ["instance"],
);

/**
 * One reference of one instance of a test's assembly, keyed by the instance and the reference: so
 * every reference of every document a test places is placed once per instance, the dependent sum
 * of `representation-gaps.md` §1 M1 over the instances.
 */
export const PlacedReference = relation(
  "PlacedReference",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    document: uuid,
    instance: uuid,
    node: uuid,
  },
  ["instance", "node", "attribute"],
);

/**
 * One reference as one test reads it, keyed by the test and the reference: the projection of its
 * {@link PlacedReference} rows (`placements`), so a reference in a section document a test places
 * twice is read once by that test (spec reading 5: "once for each test that includes the
 * section"), with its {@link TestReference}'s copy.
 *
 * It owns its name's {@link ReferenceSegment} rows (`segments`, ordered), whose tokens joined
 * (`joined`, a `Monoid.concat` fold) spell its identifier, so every dot is a segment's; `digits`,
 * the count of its segments after the first that are all digits; `lastDigit`, whether its last
 * segment is one; and its {@link Reading} rows (`readings`, counted), one per reading of the name.
 */
export const AssembledReference = relation(
  "AssembledReference",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    digits: accumulated(natural, 0n),
    document: uuid,
    identifier: keyText,
    joined: accumulated(keyText, ""),
    kind: closedId(NodeKind),
    lastDigit: pg.boolean,
    node: uuid,
    placements: drawn(natural),
    readings: drawn(natural),
    role: closedId(ReferenceRole),
    rootKind: closedId(NodeKind),
    segments: drawn(natural),
  },
  ["assembly", "node", "attribute"],
);

/**
 * The separator a segment's token starts with: none for the first, a dot for every other.
 */
export const Separator = str.regex("^\\.?$");

/**
 * One dot-separated piece of a reference's name, at its place `at` from 0 (A59's split as a
 * sequence): its `piece`, which holds no dot, its `separator`, `digit`, whether it follows a dot
 * and is all digits (a reading 88 instance number), the generated `token = separator ‖ piece`, the
 * concatenation's step, a `keyText` whose domain refuses a token past the bound, and the fold's
 * running `before` and `after`, so `before` at `at = j` is the name's first `j` pieces joined, the
 * scope of its split at `j`.
 */
export const ReferenceSegment = relation.generated(
  "ReferenceSegment",
  {
    after: accumulated(keyText, ""),
    assembly: uuid,
    at: drawn(natural),
    attribute: closedId(AttributeName),
    before: accumulated(keyText, ""),
    digit: pg.boolean,
    node: uuid,
    piece: keyText,
    separator: Separator,
  },
  ["assembly", "node", "attribute", "at"],
  (s) => ({ token: generated(keyText, Compute.concat(s.separator, s.piece)) }),
);

/**
 * One reading of one reference by one test (spec readings 48 and 88; `representation-gaps.md`
 * §4.3), keyed by the reference, its `form` and `split`, the dot it splits at (0 for an unsplit
 * and a name reading):
 *
 * - **the text:** `scope`, `number` and `variable`, the name read as `variable` (unsplit), `scope.
 *   variable` (split), `scope.number.variable` (numbered) or `scope` (name), each piece copied from
 *   its {@link ReferenceSegment} and the whole equal to `identifier` (A59, G-concat);
 * - **the scope:** `found`, `named`, `namedKind`, `placements` and `replaced`: the written element of
 *   the assembly whose identifier is `scope`, its node, kind and placements and whether a
 *   replacement can repeat it in an instance that places it (`FoundName` of
 *   `#pantry/qti/queries.ts`), and the test itself for an unsplit reading. A scope the assembly
 *   holds no element of is not `found` (`HeldScope`), and holds the test, its kind `document`, no
 *   placement and no replacement in the other four, the null objects RG4's design gives a probe
 *   (`representation-gaps.md` §4.3), which no law reads of a scope not found;
 * - **the variable:** `source`, what names it: `declared`, where the test's declarations, unsplit, or
 *   the item's of an item ref, split or numbered, declare it (`DeclaredReading`); else `mapped`,
 *   where the item ref maps it (`MappedReading`); else `builtIn`, a built-in of the scope; else
 *   `link`, through a found item ref that names an LTI link, which holds no declarations and is
 *   read unchecked (`LinkReading`, spec reading 110); else `none`;
 * - **the copy:** `identifier`, `kind`, `role`, its {@link AssembledReference}'s.
 *
 * A reading resolves when its variable is named and, numbered, its item ref can repeat and its
 * number is at least 1 (reading 88). Exactly one reading of a variable reference resolves (M3).
 * The declaration a resolving reading's declared or mapped variable reads is a row of its own,
 * {@link ReadingDeclaration}, and so is that declaration's cardinality where `Reference_type` reads
 * it, {@link ReadingCardinality}. A reading of a built-in variable or of nothing names no
 * declaration, so it has neither, and no code stands for the declaration it lacks.
 */
export const Reading = relation(
  "Reading",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    form: closedId(ReadingForm),
    found: pg.boolean,
    identifier: keyText,
    kind: closedId(NodeKind),
    named: uuid,
    namedKind: closedId(NodeKind),
    node: uuid,
    number: keyText,
    placements: natural,
    replaced: pg.boolean,
    role: closedId(ReferenceRole),
    scope: keyText,
    source: closedId(ReadingSource),
    split: natural,
    variable: keyText,
  },
  ["assembly", "node", "attribute", "form", "split"],
);

/**
 * The declaration a resolving {@link Reading} reads, keyed as the reading, where its variable is
 * declared or mapped (spec readings 48 and 88): `declaration`, `declarationKind`,
 * `declCardinalities` and `declBaseTypes`, the declaration, its kind and its counts of
 * cardinalities and base types, whatever its cardinality spells (spec reading 159), beside the
 * reading's `kind`, `source`, `named` and `variable`, each copied from it. A declared variable's
 * declaration is the one the document it reads declares of its name, the test's or its item ref's
 * item's (`DeclaredReading` of `#pantry/qti/queries.ts`); a mapped variable's is its mapping's
 * source's, its item ref's {@link MappingSourceDeclaration} at `(named, variable)`.
 *
 * A row of its own (AGENTS.md's Schema intent: a value that may be missing is a row of its own
 * relation, never a sentinel). A reading of a built-in variable or of nothing names no
 * declaration, and a reading that does not resolve names nothing (M3), so neither has a row, and
 * no law over a declaration judges it: "Variable kind" judges a built-in reading by the kind the
 * built-in stands as under its scope's root, and "Reference type" refuses one in place of a
 * literal. A reading through a mapping whose source its item declares nothing under has none
 * either, and "Variable mapping source" refuses it, beside the mapping.
 */
export const ReadingDeclaration = relation(
  "ReadingDeclaration",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    declBaseTypes: natural,
    declCardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    form: closedId(ReadingForm),
    kind: closedId(NodeKind),
    named: uuid,
    node: uuid,
    source: closedId(ReadingSource),
    split: natural,
    variable: keyText,
  },
  ["assembly", "node", "attribute", "form", "split"],
);

/**
 * A reading that stands for a literal beside its declaration's cardinality, keyed as its
 * {@link Reading}, where the reading resolves to a declared or mapped variable by an attribute
 * other than `identifier` and the variable's declaration has a cardinality (spec reading 159):
 * `declaration`, its {@link ReadingDeclaration}'s, and `declCardinality`, the declaration's
 * {@link DeclarationCardinality}'s, which `Reference_type` holds to a single value (P24). A reading
 * whose declaration's cardinality is unwritten or spells nothing has none, so the law reads no
 * cardinality the declaration does not have, and AL3 or its value domain refuses it alone (spec
 * reading 158).
 */
export const ReadingCardinality = relation(
  "ReadingCardinality",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    declCardinality: closedId(Cardinality),
    declaration: uuid,
    form: closedId(ReadingForm),
    node: uuid,
    split: natural,
  },
  ["assembly", "node", "attribute", "form", "split"],
);

/**
 * The relations of a test's references, the lookups they read and an item ref's declarations,
 * each under its own name, as `#pantry/qti/schema.ts` composes them.
 */
export const referenceRelations = {
  AssembledReference,
  MappingItemRef,
  MappingItemRefType,
  MappingSourceDeclaration,
  PlacedDocument,
  PlacedReference,
  PlacedVariableRef,
  PlacedVariableRefDeclaration,
  Reading,
  ReadingCardinality,
  ReadingDeclaration,
  ReferenceDocument,
  ReferenceSegment,
  SectionIdentifier,
  TemplateDefault,
  TemplateDefaultCardinality,
  TemplateDefaultTarget,
  TestReference,
  VariableRefCardinality,
  VariableRefDeclaration,
  VariableRefTable,
};

/**
 * An `Expression` row as a row check or a selection reads it.
 */
type ExpressionRow = RowScalars<typeof Expression>;

/**
 * A `VariableRef` row as a row check or a selection reads it.
 */
type VariableRefRow = RowScalars<typeof VariableRef>;

/**
 * A `PlacedVariableRef` row as a row check reads it.
 */
type PlacedVariableRefRow = RowScalars<typeof PlacedVariableRef>;

/**
 * The base types that say nothing: `any`, which passes every rule, and `unknown`.
 */
export const silentBases = ["any", "unknown"] as const;

/**
 * The bare and braced spellings a reference's lexical form takes: the name with the whitespace a
 * collapsing type absorbs, or the name between braces exactly (`EncVariableStringDType`).
 */
const bareReference = Compute.pattern<string>(`^[\\t\\n\\r ]*${ncNamePattern}[\\t\\n\\r ]*$`);

/**
 * A braced reference's lexical form.
 */
const bracedReference = Compute.pattern<string>(`^\\{${ncNamePattern}\\}$`);

/**
 * A float literal that is also a name, which a float-or-reference attribute reads as the literal:
 * the union's first member, `xs:double`, takes it (XML Schema Part 2, 4.1.2.3).
 */
const floatName = Compute.pattern("^[\\t\\n\\r ]*(?:INF|NaN)[\\t\\n\\r ]*$");

/**
 * The kinds whose references stand in place of a float literal.
 */
const floatReferenceKinds = ["qti-random-float"] as const;

/**
 * The processing kinds that make variable references.
 */
const referringKinds = [...new Set(processingReferences.map(({ kind }) => kind))];

/**
 * The attributes processing names variables by, on the kinds that make them: the source of
 * `VariableRef`'s copy. A value of a literal-or-reference union is a reference only where it spells
 * a name: an NCName, bare (and no float literal on a float's attribute), or a braced one.
 */
const references = select(Attribute, (a) =>
  a.and(
    a.in(a.kind, referringKinds),
    a.eq(Compute.subset(Compute.singleton(a.name), VariableReference.row(a.kind)), true),
    a.or(
      a.and(
        a.eq(VariableReference.at("spelling", a.kind, a.name), "bare"),
        Compute.matches(a.lexical, bareReference),
        a.or(
          a.not(a.in(a.kind, floatReferenceKinds)),
          a.not(Compute.matches(a.lexical, floatName)),
        ),
      ),
      a.and(
        a.eq(VariableReference.at("spelling", a.kind, a.name), "braced"),
        Compute.matches(a.lexical, bracedReference),
      ),
    ),
  ),
);

/**
 * The attributes an expression's type follows from, `ExpressionAttribute`'s source.
 */
const typingAttributes = select(Attribute, (a) =>
  a.or(
    a.and(a.eq(a.kind, "qti-base-value"), a.eq(a.name, "base-type")),
    a.and(a.eq(a.kind, "qti-test-variables"), a.in(a.name, ["base-type", "weight-identifier"])),
    a.and(a.eq(a.kind, "qti-math-operator"), a.eq(a.name, "name")),
  ),
);

/**
 * The `template` of each response processing, `ProcessingTemplate`'s source.
 */
const templateAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "qti-response-processing"), a.eq(a.name, "template")),
);

/**
 * State that an expression's base type is the one member of its operands' base-type bits, `any` for
 * none and `unknown` for several: a container's, and an Index's or a Random's, typed by its one
 * operand and by all of them alike where it writes more, which `Arity` refuses.
 *
 * @param e - The row.
 * @returns The predicate.
 */
const baseOfOperands = (e: ExpressionRow) =>
  e.or(
    e.and(e.eq(Compute.cardinality(e.operandBaseTypes), 0n), e.eq(e.baseType, "any")),
    e.and(e.gt(Compute.cardinality(e.operandBaseTypes), 1n), e.eq(e.baseType, "unknown")),
    e.eq(ValueBaseBit.row(e.baseType), e.operandBaseTypes),
  );

/**
 * State that an expression's base type is the one member of its later operands' base-type bits,
 * `any` for none and `unknown` for several, as a container's is of its operands': Delete's, typed
 * by its second sub-expression (information model, Table 6.9.20: "The result is a new container
 * derived from the second sub-expression ... If either sub-expression is NULL the result of the
 * operator is NULL"), and by its later ones alike where it writes more, which `Arity` refuses.
 *
 * @param e - The row.
 * @returns The predicate.
 */
const baseOfTail = (e: ExpressionRow) =>
  e.or(
    e.and(e.eq(Compute.cardinality(e.tailBaseTypes), 0n), e.eq(e.baseType, "any")),
    e.and(e.gt(Compute.cardinality(e.tailBaseTypes), 1n), e.eq(e.baseType, "unknown")),
    e.eq(ValueBaseBit.row(e.baseType), e.tailBaseTypes),
  );

/**
 * State that an expression's cardinality is the one member of its later operands' cardinality
 * bits, `unknown` for none or several: Delete's, as {@link baseOfTail} is its base type.
 *
 * @param e - The row.
 * @returns The predicate.
 */
const cardinalityOfTail = (e: ExpressionRow) =>
  e.or(
    e.and(e.ne(Compute.cardinality(e.tailCardinalities), 1n), e.eq(e.cardinality, "unknown")),
    e.eq(ValueCardinalityBit.row(e.cardinality), e.tailCardinalities),
  );

/**
 * State the result type each dependent typing derives: the numeric aggregates' from their operands'
 * base types, the containers' from their one base type, Index's and Random's from their operand's,
 * and Delete's from its later operands' one type. The fixed and declared typings and the attribute
 * ones are `ResultBase`'s, `VariableRef`'s and `ExpressionAttribute`'s.
 *
 * @param e - The row.
 * @returns The predicate.
 */
const resultDerived = (e: ExpressionRow) =>
  e.and(
    e.or(
      e.not(e.in(e.kind, numericKinds)),
      e.and(
        e.eq(Compute.subset(ValueBaseBit.row("unknown"), e.operandBaseTypes), true),
        e.eq(e.baseType, "unknown"),
      ),
      e.and(
        e.eq(Compute.subset(ValueBaseBit.row("unknown"), e.operandBaseTypes), false),
        e.eq(e.operandBaseTypes, ValueBaseBit.row("integer")),
        e.eq(e.baseType, "integer"),
      ),
      e.and(
        e.eq(Compute.subset(ValueBaseBit.row("unknown"), e.operandBaseTypes), false),
        e.ne(e.operandBaseTypes, ValueBaseBit.row("integer")),
        e.eq(e.baseType, "float"),
      ),
    ),
    e.or(e.not(e.in(e.kind, [...containerKinds, ...firstKinds])), baseOfOperands(e)),
    e.or(e.not(e.in(e.kind, secondKinds)), e.and(baseOfTail(e), cardinalityOfTail(e))),
  );

/**
 * State that a reference's lexical form spells its identifier: bare, the name with whitespace
 * around it, or braced, the name between braces and nothing else.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const spells = (v: VariableRefRow) =>
  v.and(
    v.eq(v.lexical, Compute.concat(Compute.concat(v.before, v.identifier), v.after)),
    Compute.matches(v.identifier, namePattern),
    v.or(
      v.and(
        v.eq(VariableReference.at("spelling", v.kind, v.attribute), "bare"),
        Compute.matches(v.before, spacePattern),
        Compute.matches(v.after, spacePattern),
      ),
      v.and(
        v.eq(VariableReference.at("spelling", v.kind, v.attribute), "braced"),
        v.eq(v.before, "{"),
        v.eq(v.after, "}"),
      ),
    ),
  );

/**
 * The built-in variables, as the installed `BuiltInVariable` holds them (the UP audit's A63; spec
 * reading 29): each root's variables with the expression-typing codes of the base type and the
 * cardinality each stands as there, `ValueBaseOf`'s and `ValueCardinalityOf`'s images of its
 * declaration codes ({@link valueBaseOf}, {@link valueCardinalityOf}), and `unknown` for the base
 * type of the record `QTI_CONTEXT`, which has none (`builtInBaseTypes` holds no row for it).
 */
const builtIns = BuiltInVariable.rows.map(({ cardinality, declaration, root, variable }) => ({
  baseType: Option.match(
    Arr.findFirst(builtInBaseTypes, (typed) => typed.root === root && typed.variable === variable),
    { onNone: () => "unknown" as const, onSome: ({ baseType }) => valueBaseOf(baseType) },
  ),
  cardinality: valueCardinalityOf(cardinality),
  declaration,
  root,
  variable,
}));

/**
 * The roots that hold built-in variables, each with the names of its built-ins.
 */
const builtInRoots: readonly (readonly [(typeof NodeKind.handles)[number], readonly string[]])[] = [
  ...Map.groupBy(builtIns, ({ root }) => root),
].map(([root, rows]) => [root, rows.map(({ variable }) => variable)] as const);

/**
 * The names of the built-in variables a root holds.
 *
 * @param root - The root's kind.
 * @returns The names, none for a root that holds no built-in.
 */
const builtInNamesOf = (root: string): readonly string[] =>
  builtInRoots.find(([held]) => held === root)?.[1] ?? [];

/**
 * A prefixed name, one a test's outcome processing reads through its parts and items: a name
 * holding a `.` (spec reading 48; the UP audit's L-P), which no unprefixed declaration has.
 */
const prefixedName = Compute.pattern("^.*[.].*$");

/**
 * State the type a reference's resolution gives it: a declared variable's, which its
 * {@link VariableRefDeclaration}'s `E1_derived` states: its cardinality `unknown` where the
 * declaration has none, and else its {@link VariableRefCardinality}'s image through
 * `ValueCardinalityOf` (spec reading 159), and its base type `unknown` where it has none, a
 * record's (lane NIL's audit, B12), and else its {@link DeclarationBaseType}'s `valueBase`, which
 * {@link typedVariableRefs} copies; a built-in's by its name, among its root's built-ins; nothing
 * for an unresolved one, whose name is none of them.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const resolvedType = (v: VariableRefRow) =>
  v.or(
    v.eq(v.resolution, "declared"),
    v.and(
      v.eq(v.resolution, "builtIn"),
      v.or(
        ...builtIns.map(({ baseType, cardinality, root, variable }) =>
          v.and(
            v.eq(v.rootKind, root),
            v.eq(v.identifier, variable),
            v.eq(v.baseType, baseType),
            v.eq(v.cardinality, cardinality),
          ),
        ),
      ),
    ),
    v.and(
      v.eq(v.resolution, "unresolved"),
      ...builtInRoots.map(([root, names]) =>
        v.or(v.ne(v.rootKind, root), v.not(v.in(v.identifier, names))),
      ),
      v.eq(v.baseType, "unknown"),
      v.eq(v.cardinality, "unknown"),
    ),
  );

/**
 * The references that name a declared variable with a base type: each one's base type is the
 * declaration's, read from its {@link DeclarationBaseType}.
 */
const typedVariableRefs = select(VariableRefDeclaration, (d) => d.eq(d.declBaseTypes, 1n));

/**
 * The base types a variable named in place of a literal must have (`ReferenceBase`'s), each once:
 * a reading of each is judged against its declaration's {@link DeclarationBaseType}, one
 * containment per base type, where the declaration has one.
 */
const referenceBases = [...new Set(ReferenceBase.rows.map(({ base }) => base))];

/**
 * The kinds that map a response through a table of its declaration: a map response, through its
 * mapping, and a map response point, through its area mapping (§2.11.3.29, §2.11.3.30).
 */
const mappedKinds = ["qti-map-response", "qti-map-response-point"] as const;

/**
 * The table claims of one table: a map response's mapping, a map response point's area mapping, and
 * a lookup's match or interpolation table. Each claim is a containment into the table's own row,
 * keyed by its declaration: a declaration that holds no such table has none, so no reference claims
 * it, and a map response, a map response point or a lookup that claims no table is refused by
 * `Mapped_response` or `Lookup_type`.
 *
 * @param table - The table claimed.
 * @returns The selection.
 */
const tableClaims = (table: (typeof ReferencedTable.handles)[number]) =>
  select(VariableRefTable, (t) => t.eq(t.table, table));

/**
 * The lookup tables that are match tables, each keyed by its declaration, which a lookup that
 * claims one reads.
 */
const matchTables = select(LookupTable, (t) => t.eq(t.kind, "qti-match-table"));

/**
 * The lookup tables that are interpolation tables.
 */
const interpolationTables = select(LookupTable, (t) => t.eq(t.kind, "qti-interpolation-table"));

/**
 * The attributes an element writes among those its type follows from.
 */
const writtenAttributes = select(ExpressionAttribute, (x) => x.eq(x.written, true));

/**
 * The documents whose references a test may read, each a {@link ReferenceDocument}: every document
 * whose root is no item.
 */
const referenceDocuments = select(Document, (d) => d.ne(d.rootKind, itemKind));

/**
 * The attribute that types each attribute-typed kind, written or not: a base value's and a test
 * variables' `base-type`, a math operator's `name`. An element holds at most one of them.
 */
const typeAttributes = select(ExpressionAttribute, (x) => x.in(x.attribute, ["base-type", "name"]));

/**
 * A test variables' `weight-identifier`, written or not: each test variables has one row of it, an
 * unwritten one where it writes none, the proof that it is not weighted.
 */
const weightAttributes = select(ExpressionAttribute, (x) => x.eq(x.attribute, "weight-identifier"));

/**
 * The `weight-identifier`s a test variables writes: the test variables that are weighted.
 */
const writtenWeights = select(ExpressionAttribute, (x) =>
  x.and(x.eq(x.attribute, "weight-identifier"), x.eq(x.written, true)),
);

/**
 * The unwritten `base-type`s whose element is `unknown`, each a test variables' that writes neither
 * a `base-type` nor, by the containment into {@link weightAttributes}, a `weight-identifier`.
 */
const unknownUnwrittenBases = select(ExpressionAttribute, (x) =>
  x.and(x.eq(x.attribute, "base-type"), x.eq(x.written, false), x.eq(x.baseType, "unknown")),
);

/**
 * The unwritten `base-type`s whose element is float, each a test variables' that writes no
 * `base-type` and, by the containment into {@link writtenWeights}, writes a `weight-identifier`.
 */
const floatUnwrittenBases = select(ExpressionAttribute, (x) =>
  x.and(x.eq(x.attribute, "base-type"), x.eq(x.written, false), x.eq(x.baseType, "float")),
);

/**
 * The expressions `ResultBase` judges: every one but an attribute-typed expression of an `unknown`
 * base type, the type of one whose typing attribute spells no base (`E1_derived` on
 * {@link ExpressionAttribute}), which AL1's value domain refuses alone. `ResultBase` is the
 * information model's table of each kind's result bases, and states no `unknown` for a kind whose
 * attribute must spell one.
 */
const resultTyped = select(Expression, (e) =>
  e.or(e.not(e.in(e.kind, attributeTypedKinds)), e.ne(e.baseType, "unknown")),
);

/**
 * The base values whose `base-type` spells a base: each has its {@link LiteralTyped}. A base value
 * of an `unknown` base has none, since its text has no type to be read in.
 */
const typedBaseValues = select(Expression, (e) =>
  e.and(e.eq(e.kind, "qti-base-value"), e.ne(e.baseType, "unknown")),
);

/**
 * The declared references by `identifier`: each names one of the declaration kinds its element
 * reads or sets (`ReferenceDeclaration`).
 */
const namedVariables = select(VariableRefDeclaration, (d) => d.eq(d.attribute, "identifier"));

/**
 * The declared placed references by `identifier`, each naming a declaration kind its element reads
 * or sets.
 */
const namedPlacedVariables = select(PlacedVariableRefDeclaration, (d) =>
  d.eq(d.attribute, "identifier"),
);

/**
 * Each built-in variable with the kinds whose element may name it by `identifier`: those whose
 * `ReferenceDeclaration` admits the declaration kind it stands as (reading 29), so a reference to a
 * built-in is judged under "Variable kind" as a declared one is.
 */
const builtInReferrers = builtIns.flatMap(({ declaration, root, variable }) => {
  const kinds = referenceDeclarations.flatMap(({ declarations, kind }) =>
    declarations.includes(declaration) ? [kind] : [],
  );

  return kinds.length === 0 ? [] : [{ kinds, root, variable }];
});

/**
 * State that a reference by `identifier` to a built-in variable names one its element may: a
 * kind whose `ReferenceDeclaration` admits the built-in's declaration kind.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const namesAllowedBuiltIn = (v: VariableRefRow) =>
  v.or(
    v.ne(v.attribute, "identifier"),
    v.ne(v.resolution, "builtIn"),
    ...builtInReferrers.map(({ kinds, root, variable }) =>
      v.and(v.eq(v.rootKind, root), v.eq(v.identifier, variable), v.in(v.kind, kinds)),
    ),
  );

/**
 * {@link namesAllowedBuiltIn} over a placed reference, whose root is its assembly's.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const placesAllowedBuiltIn = (v: PlacedVariableRefRow) =>
  v.or(
    v.ne(v.attribute, "identifier"),
    v.ne(v.resolution, "builtIn"),
    ...builtInReferrers.map(({ kinds, root, variable }) =>
      v.and(v.eq(v.rootKind, root), v.eq(v.identifier, variable), v.in(v.kind, kinds)),
    ),
  );

/**
 * The published templates, each with the pattern its `template` URI matches.
 */
const publishedTemplates = rpTemplates.flatMap((template) =>
  template === "none" ? [] : [[template, Compute.pattern(rpTemplatePattern(template))] as const],
);

/**
 * The positive instance numbers of reading 88: all digits, and not all zeros, so at least 1, with
 * no bound (a number beyond the instances drawn names one never drawn, which no static rule
 * refuses).
 */
export const positiveNumberPattern = Compute.pattern("^[0-9]*[1-9][0-9]*$");

/**
 * A name piece of all digits: an instance number's form.
 */
export const digitsPattern = Compute.pattern("^[0-9]+$");

/**
 * A segment's piece: no dot.
 */
export const piecePattern = Compute.pattern("^[^.]*$");

/**
 * The built-in variables a test's own processing names unsplit, as the installed `BuiltInVariable`
 * holds them under a test's root.
 */
const testBuiltIns = builtInNamesOf(testKind);

/**
 * The built-in variables an item ref's prefix reaches: every built-in its item's processing
 * holds, `QTI_CONTEXT` among them (information model §2.2.2: "Item variables are declared by
 * variable declarations: context, response, outcome or template variables", and §2.2.2.1:
 * "QTI_CONTEXT is a built-in variable and so any references within an item or an assessment to
 * the QTI_CONTEXT variable ... must succeed"; spec reading 106).
 */
const itemBuiltIns = builtInNamesOf(itemKind);

/**
 * The kinds whose `duration` a part's or a section's prefix names (information model §2.2.2,
 * info.txt:9214: "time spent on test parts or sections are treated as built-in response variables
 * declared within each respective scope"; a section ref names its placement as a section does,
 * spec reading 86).
 */
const durationScopes = [partKind, sectionKind, sectionRefKind] as const;

/**
 * A `Reading` row as a row check or a selection reads it.
 */
type ReadingRow = RowScalars<typeof Reading>;

/**
 * State that a reading's scope is a found item ref, so its variable is the item's.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const itemScoped = (r: ReadingRow) =>
  r.and(r.in(r.form, ["split", "numbered"]), r.eq(r.found, true), r.eq(r.namedKind, itemRefKind));

/**
 * State that a reading's variable is a built-in its scope holds: the test's, unsplit; the item's,
 * through an item ref; a part's or a section's `duration`, split at a found part, section or
 * section ref.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const builtInOfScope = (r: ReadingRow) =>
  r.or(
    r.and(r.eq(r.form, "unsplit"), r.in(r.variable, testBuiltIns)),
    r.and(itemScoped(r), r.in(r.variable, itemBuiltIns)),
    r.and(
      r.eq(r.form, "split"),
      r.eq(r.found, true),
      r.in(r.namedKind, durationScopes),
      r.eq(r.variable, "duration"),
    ),
  );

/**
 * State that a reading resolves (spec reading 48): its variable is named, declared, mapped or built
 * in, or read through an LTI item ref unchecked (source `link`, spec reading 110), and, numbered,
 * its item ref can repeat under a selection with replacement and its number is at least 1 (reading
 * 88). A name reading, a `section-identifier`'s, is no variable's, and a setter's prefixed reading
 * resolves nothing: a setter sets its own document's variable (reading 112).
 *
 * @param r - The row.
 * @returns The predicate.
 */
const resolves = (r: ReadingRow) =>
  r.and(
    r.ne(r.form, "name"),
    r.ne(r.source, "none"),
    r.or(r.eq(r.form, "unsplit"), r.not(r.in(r.kind, setterKinds))),
    r.or(
      r.ne(r.form, "numbered"),
      r.and(r.eq(r.replaced, true), Compute.matches(r.number, positiveNumberPattern)),
    ),
  );

/**
 * The variable mappings whose item ref has no target, held as decision 428 has it: it writes no
 * href (spec reading 155) or its href names nothing the package lists, so it names no LTI link,
 * and the mapping must have its source's declaration. Its {@link MappingItemRef} has no
 * {@link MappingItemRefType}, `types` 0.
 */
const untargetedMappings = select(MappingItemRef, (m) => m.eq(m.types, 0n));

/**
 * The variable mappings whose item ref names a resource of the package other than an LTI link: a
 * mapping under an LTI item ref has no item, so no source declaration, and is accepted unchecked
 * (spec reading 110). A mapping under an item ref that names an item or a missing document must
 * have its source's declaration. Only an LTI type is exempt, and it is copied from
 * `ItemRefTarget`, so it spares only a mapping whose item ref names a link.
 */
const heldMappings = select(MappingItemRefType, (m) => m.not(m.in(m.type, linkResourceTypes)));

/**
 * The readings that resolve: a key over them by their reference is "at most one", and the
 * containment of every variable reference into them "at least one" (M3).
 */
const resolvingReadings = select(Reading, resolves);

/**
 * A test's prefixed readings of one table reader's `identifier` that resolve to a declared response
 * variable (decisions 429 and 431, spec reading 166): a split or numbered reading of a
 * `qti-map-response`'s or a `qti-map-response-point`'s `identifier` whose variable's declaration
 * ({@link ReadingDeclaration}) is a response declaration. Each reads its declaration's table, the
 * mapping or the area mapping "which must have been declared" (information model §7.22 and §7.23),
 * so each is a containment into that table's own row (`Mapping`, `AreaMapping`) by its declaration.
 * A built-in response has no declaration, so no row here: {@link mapsNoBuiltInResponse} refuses its
 * reading. A reading that names anything but a response is `Variable kind`'s alone, and one
 * through an LTI link resolves unchecked (reading 110), its source `none`, with no declaration.
 *
 * @param kind - The reader's kind.
 * @returns The selection.
 */
const prefixedTableReaders = (kind: "qti-map-response" | "qti-map-response-point") =>
  select(ReadingDeclaration, (d) =>
    d.and(
      d.eq(d.kind, kind),
      d.eq(d.attribute, "identifier"),
      d.in(d.form, ["split", "numbered"]),
      d.eq(d.declarationKind, "qti-response-declaration"),
    ),
  );

/**
 * An item's placed references by a table reader's `identifier` that resolve to a declaration among
 * its item's declarations: the {@link PlacedVariableRefDeclaration} of a `qti-map-response`'s or a
 * `qti-map-response-point`'s `identifier`, under every instance of the item's assembly. The placed
 * twin of {@link prefixedTableReaders}: a reference in an included response rules fragment names
 * nothing in the fragment's own document, so its only declaration is its item's, where "the content
 * of the fragment must satisfy the requirements of the specification in the context of the item in
 * which it is being included" (spec reading 117). Each reads its declaration's mapping or area
 * mapping (reading 166), so each is a containment into that table's own row (`Mapping`,
 * `AreaMapping`) by its declaration. It keeps every declaration kind: one that names an outcome
 * finds no mapping and breaks the law, as the in-place check refuses it. The item's own document is
 * an instance too, so an inline map response is held twice, here and by the in-place check over
 * {@link VariableRefDeclaration}, under the one law.
 *
 * @param kind - The reader's kind.
 * @returns The selection.
 */
const placedTableReaders = (kind: "qti-map-response" | "qti-map-response-point") =>
  select(PlacedVariableRefDeclaration, (d) =>
    d.and(d.eq(d.kind, kind), d.eq(d.attribute, "identifier")),
  );

/**
 * The built-in response variables, each with the root it is built into: a numAttempts or duration
 * of an item, the duration of a test. None has a declaration, so none holds a mapping or an area
 * mapping (decision 431, spec reading 166).
 */
const builtInResponses = builtIns.filter(
  ({ declaration }) => declaration === "qti-response-declaration",
);

/**
 * The scope under each root whose built-in variables a reading reads, as {@link builtInOfScope}
 * states it: a test's, unsplit; an item's, through an item ref; a section's, for a part's, a
 * section's or a section ref's `duration`, split at it.
 */
const builtInScopes = [
  [testKind, (r: ReadingRow) => r.eq(r.form, "unsplit")],
  [itemKind, itemScoped],
  [sectionKind, (r: ReadingRow) => r.and(r.eq(r.form, "split"), r.in(r.namedKind, durationScopes))],
] as const;

/**
 * State that a test's resolving prefixed reading of a `qti-map-response`'s or a
 * `qti-map-response-point`'s `identifier` reads no built-in response of its scope's root, whose
 * mapping or area mapping is never declared (decision 431, spec reading 166; information model
 * §7.22 and §7.23). A built-in reading names no declaration, so it has no
 * {@link ReadingDeclaration} that {@link prefixedTableReaders} could hold to a table: its built-in
 * is told by its scope's root and its variable, as {@link builtInScopes} reads them.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const mapsNoBuiltInResponse = (r: ReadingRow) =>
  r.or(
    r.ne(r.attribute, "identifier"),
    r.not(r.in(r.kind, ["qti-map-response", "qti-map-response-point"])),
    r.not(r.in(r.form, ["split", "numbered"])),
    r.ne(r.source, "builtIn"),
    r.not(resolves(r)),
    r.not(
      r.or(
        ...builtInScopes.flatMap(([root, inScope]) =>
          builtInResponses
            .filter((builtIn) => builtIn.root === root)
            .map(({ variable }) => r.and(inScope(r), r.eq(r.variable, variable))),
        ),
      ),
    ),
  );

/**
 * The resolving readings of a declared variable, each with its {@link ReadingDeclaration}.
 */
const declaredReadings = select(Reading, (r) => r.and(resolves(r), r.eq(r.source, "declared")));

/**
 * The resolving readings of a mapped variable, each with its {@link ReadingDeclaration} where its
 * mapping's source is declared, so one through a mapping whose source its item declares nothing
 * under is refused under the mapping's law; but for a reading through an LTI item ref, whose
 * mapping has no source declaration and is accepted unchecked (source `link`, spec reading 110).
 */
const mappedReadings = select(Reading, (r) => r.and(resolves(r), r.eq(r.source, "mapped")));

/**
 * The resolving readings' declarations that stand for a literal, by an attribute other than
 * `identifier`, whose declaration has a cardinality: each has its {@link ReadingCardinality},
 * which `Reference_type` reads (spec reading 159).
 */
const standInDeclarations = select(ReadingDeclaration, (d) =>
  d.and(d.ne(d.attribute, "identifier"), d.eq(d.declCardinalities, 1n)),
);

/**
 * State that a reference by `identifier` from a map response or a map response point names no
 * built-in response variable, whose mapping or area mapping is never declared (decision 431,
 * information model §7.22 and §7.23). A built-in of another kind is `Variable kind`'s alone.
 *
 * @param v - The row, a reference or a placed one.
 * @returns The predicate.
 */
const mapsNoBuiltIn = (v: VariableRefRow | PlacedVariableRefRow) =>
  v.or(
    v.ne(v.attribute, "identifier"),
    v.not(v.in(v.kind, ["qti-map-response", "qti-map-response-point"])),
    v.ne(v.resolution, "builtIn"),
    v.not(
      v.or(
        ...builtInResponses.map(({ root, variable }) =>
          v.and(v.eq(v.rootKind, root), v.eq(v.identifier, variable)),
        ),
      ),
    ),
  );

/**
 * State that a resolving reading by `identifier` of a built-in variable names one its element may:
 * one whose kind's `ReferenceDeclaration` admits the declaration kind the built-in stands as under
 * its scope's root (the installed `BuiltInVariable`, reading 29), as {@link namesAllowedBuiltIn}
 * states it of a document's own reference. A built-in reading names no declaration, so it has no
 * {@link ReadingDeclaration} to read a kind from.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const readsAllowedBuiltIn = (r: ReadingRow) =>
  r.or(
    r.ne(r.attribute, "identifier"),
    r.ne(r.source, "builtIn"),
    r.not(resolves(r)),
    ...builtInScopes.flatMap(([root, inScope]) =>
      builtInReferrers
        .filter((referrer) => referrer.root === root)
        .map(({ kinds, variable }) =>
          r.and(inScope(r), r.eq(r.variable, variable), r.in(r.kind, kinds)),
        ),
    ),
  );

/**
 * The split and numbered readings, each at the segment its dot ends.
 */
const segmentReadings = select(Reading, (r) => r.in(r.form, ["split", "numbered"]));

/**
 * The numbered readings, each with its segment's piece as its number.
 */
const numberedReadings = select(Reading, (r) => r.eq(r.form, "numbered"));

/**
 * The segments after a dot that are all digits, which a numbered reading may split at.
 */
const digitSegments = select(ReferenceSegment, (s) => s.eq(s.digit, true));

/**
 * The `section-identifier` attributes, `SectionIdentifier`'s source.
 */
const sectionIdentifierAttributes = select(Attribute, (a) => a.eq(a.name, "section-identifier"));

/**
 * The one expression each template default holds (TemplateDefaultDType's content), whose type its
 * {@link TemplateDefaultTarget} copies.
 */
const templateDefaultExpressions = select(Expression, (e) =>
  e.eq(e.parentKind, "qti-template-default"),
);

/**
 * The `template-identifier` of each template default, `TemplateDefault`'s source.
 */
const templateIdentifiers = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "qti-template-default"), a.eq(a.name, "template-identifier")),
);

/**
 * The instances of a test's assembly whose documents are no item, each of which places its
 * document's references: the test's own, a section document's, and a fragment's that the test or a
 * section document splices, whose references resolve in the test as its merged document holds them
 * (spec reading 117).
 */
const placingInstances = select(Instance, (i) =>
  i.and(i.eq(i.assemblyKind, testKind), i.ne(i.rootKind, itemKind)),
);

/**
 * The variable references a test may read: every `VariableRef` of a document that is no item.
 */
const testVariableRefs = select(VariableRef, (v) => v.ne(v.rootKind, itemKind));

/**
 * The `section-identifier`s a test may read: every one of a document that is no item.
 */
const testSectionIdentifiers = select(SectionIdentifier, (s) => s.ne(s.rootKind, itemKind));

/**
 * Each test or section document's references, counted by `ReferenceDocument.references`.
 */
export const testReferenceFamily = counted(
  on(TestReference, "document"),
  fin(ReferenceDocument, "references"),
);

/**
 * Each instance's placed references, counted by `PlacedDocument.references`.
 */
export const placedReferenceFamily = counted(
  on(PlacedReference, "instance"),
  fin(PlacedDocument, "references"),
);

/**
 * Each reference's placements in a test's assembly, counted by `AssembledReference.placements`.
 */
export const placementFamily = counted(
  on(PlacedReference, "assembly", "node", "attribute"),
  fin(AssembledReference, "placements"),
);

/**
 * Each reference's name pieces in order, at `AssembledReference.segments`.
 */
export const segmentFamily = ordered(
  on(ReferenceSegment, "assembly", "node", "attribute", "at"),
  fin(AssembledReference, "segments"),
);

/**
 * Each reference's readings, counted by `AssembledReference.readings`.
 */
export const readingFamily = counted(
  on(Reading, "assembly", "node", "attribute"),
  fin(AssembledReference, "readings"),
);

/**
 * The statements over a test's references (spec readings 4, 5, 48 and 88; `representation-gaps.md`
 * §4; the UP audit's A47, A50, A53, A55, A56, A58 to A61, A65 and A66) and the declarations a
 * test's item refs name (A34, A37, A38), each `check` named by its oracle law. What a reading reads
 * of the assembly's names, the declarations and the mappings is read through the queries of
 * `#pantry/qti/queries.ts`, each by the rules over it there:
 *
 * - **an item ref's declarations,** each a row of its own that every template default and every
 *   mapping must have, so a name its item declares nothing under is refused by that law alone: a
 *   template default's {@link TemplateDefaultTarget}, a template declaration
 *   (`Template_default_target`) its expression's type fits (`Template_default_type`, P20), its base
 *   type where the declaration has one and its cardinality where it has one, read from its
 *   {@link TemplateDefaultCardinality}; a mapping's {@link MappingSourceDeclaration}, an outcome of
 *   the item (`Variable_mapping_source`), and its target, no other variable of the item
 *   (`Variable_mapping_target`, reading 97); and a mapped reading's declaration, its mapping's
 *   source's;
 * - **the references:** each test or section document's, placed once per instance of every test that
 *   places its document and read once per test, its name split at every dot (A59's concatenation),
 *   its readings exactly the readings of its name, exactly one of them resolving
 *   (`Prefixed_reference`, M3, the refusal naming both), none through a name two placements give
 *   (reading 86), an unsplit name declared (`Variable_declared`, P8), a literal's stand-in typed
 *   (`Reference_type`, P24, its cardinality read from its {@link ReadingCardinality} where its
 *   declaration has one), and a `section-identifier` a section's (`Section_identifier_target`).
 */
export const referenceLawsByName = {
  "DocumentId key": [
    // TemplateDefault: its template-identifier.
    key(on(templateIdentifiers, "node")),
    // SectionIdentifier: its copy, its document, and the name it spells. The copy is the forward
    // containment: each attribute's row holds its name, kind and lexical form. The reverse only
    // needs the attribute to exist, by the selection's key: both sides are keyed by `node`, so the
    // forward containment's row for that attribute is this row. Its UNIQUE is that key's, and
    // `Attribute.lexical`, which no pattern bounds, sits in no UNIQUE.
    key(on(sectionIdentifierAttributes, "node")),
  ],
  "E1 derived": [
    // TemplateDefault: its template-identifier, written exactly where its element writes one (AL3
    // requires it), and its item ref; its target's copy of both, and its expression's type.
    contained(on(templateIdentifiers, "node", "lexical"), on(TemplateDefault, "node", "lexical")),
    contained(on(TemplateDefault, "node"), on(templateIdentifiers, "node")),
    contained(on(TemplateDefault, "node", "itemRef"), on(Node, "id", "parent")),
    check("E1_derived", TemplateDefault, (t) =>
      t.and(
        t.eq(t.lexical, Compute.concat(Compute.concat(t.lead, t.template), t.trail)),
        Compute.matches(t.template, namePattern),
      ),
    ),
    contained(
      on(TemplateDefaultTarget, "node", "itemRef", "template"),
      on(TemplateDefault, "node", "itemRef", "template"),
    ),
    key(on(templateDefaultExpressions, "parent")),
    contained(
      on(TemplateDefaultTarget, "node", "heldBase", "heldCardinality"),
      on(templateDefaultExpressions, "parent", "baseType", "cardinality"),
    ),
    // TemplateDefaultCardinality: a target's declaration's cardinality where it has one (spec
    // reading 159), copied from its target and its declaration.
    contained(
      on(
        select(TemplateDefaultTarget, (t) => t.eq(t.declCardinalities, 1n)),
        "node",
      ),
      on(TemplateDefaultCardinality, "node"),
    ),
    contained(
      on(TemplateDefaultCardinality, "node", "declaration", "heldCardinality"),
      on(TemplateDefaultTarget, "node", "declaration", "heldCardinality"),
    ),
    contained(
      on(TemplateDefaultCardinality, "declaration", "declCardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
    // MappingSourceDeclaration's copy of its mapping (A34, A35).
    contained(
      on(MappingSourceDeclaration, "node", "itemRef", "source"),
      on(VariableMapping, "node", "parent", "source"),
    ),
    contained(
      on(MappingSourceDeclaration, "node", "target"),
      on(VariableMapping, "node", "target"),
    ),
    contained(
      on(sectionIdentifierAttributes, "node", "name", "kind", "lexical"),
      on(SectionIdentifier, "node", "attribute", "kind", "lexical"),
    ),
    contained(on(SectionIdentifier, "node"), on(sectionIdentifierAttributes, "node")),
    contained(on(SectionIdentifier, "node", "document"), on(Node, "id", "document")),
    contained(on(SectionIdentifier, "document", "rootKind"), on(Document, "node", "rootKind")),
    check("E1_derived", SectionIdentifier, (s) =>
      s.and(
        s.eq(s.lexical, Compute.concat(Compute.concat(s.before, s.identifier), s.after)),
        Compute.matches(s.identifier, namePattern),
      ),
    ),
    // TestReference: every reference of a document that is no item, and each document's count.
    contained(on(testVariableRefs, "node", "attribute"), on(TestReference, "node", "attribute")),
    contained(
      on(
        select(TestReference, (t) => t.eq(t.role, "variable")),
        "node",
        "attribute",
        "document",
        "identifier",
        "kind",
        "rootKind",
      ),
      on(VariableRef, "node", "attribute", "document", "identifier", "kind", "rootKind"),
    ),
    contained(
      on(testSectionIdentifiers, "node", "attribute"),
      on(TestReference, "node", "attribute"),
    ),
    contained(
      on(
        select(TestReference, (t) => t.eq(t.role, "section")),
        "node",
        "attribute",
        "document",
        "identifier",
        "kind",
        "rootKind",
      ),
      on(SectionIdentifier, "node", "attribute", "document", "identifier", "kind", "rootKind"),
    ),
    check("E1_derived", TestReference, (t) =>
      t.and(
        t.ne(t.rootKind, itemKind),
        t.or(
          t.and(t.eq(t.role, "section"), t.eq(t.attribute, "section-identifier")),
          t.and(t.eq(t.role, "variable"), t.ne(t.attribute, "section-identifier")),
        ),
      ),
    ),
    testReferenceFamily,
    mirrors(on(ReferenceDocument, "document"), on(referenceDocuments, "node")),
    // PlacedDocument and PlacedReference: every reference once per instance of a test's assembly.
    contained(
      on(placingInstances, "id", "assembly", "assemblyKind", "document"),
      on(PlacedDocument, "instance", "assembly", "assemblyKind", "document"),
    ),
    contained(
      on(PlacedDocument, "instance", "assembly", "assemblyKind", "document"),
      on(Instance, "id", "assembly", "assemblyKind", "document"),
    ),
    check("E1_derived", PlacedDocument, (p) => p.eq(p.assemblyKind, testKind)),
    contained(
      on(PlacedDocument, "document", "references"),
      on(ReferenceDocument, "document", "references"),
    ),
    placedReferenceFamily,
    contained(
      on(PlacedReference, "instance", "assembly", "document"),
      on(PlacedDocument, "instance", "assembly", "document"),
    ),
    contained(
      on(PlacedReference, "document", "node", "attribute"),
      on(TestReference, "document", "node", "attribute"),
    ),
    placementFamily,
    // AssembledReference: each reference once per test, its name's pieces and its readings' count.
    contained(
      on(
        AssembledReference,
        "node",
        "attribute",
        "document",
        "identifier",
        "kind",
        "role",
        "rootKind",
      ),
      on(TestReference, "node", "attribute", "document", "identifier", "kind", "role", "rootKind"),
    ),
    segmentFamily,
    fold(
      segmentFamily,
      Monoid.concat,
      on(ReferenceSegment, "assembly", "node", "attribute", "token", "before", "after"),
      on(AssembledReference, "assembly", "node", "attribute", "joined"),
    ),
    fold(
      segmentFamily,
      Monoid.count,
      on(digitSegments, "assembly", "node", "attribute"),
      on(AssembledReference, "assembly", "node", "attribute", "digits"),
    ),
    contained(
      on(AssembledReference, "assembly", "node", "attribute", pred("segments"), "lastDigit"),
      on(ReferenceSegment, "assembly", "node", "attribute", "at", "digit"),
    ),
    check("E1_derived", ReferenceSegment, (s) =>
      s.and(
        Compute.matches(s.piece, piecePattern),
        s.or(
          s.and(s.eq(s.at, 0n), s.eq(s.separator, ""), s.eq(s.digit, false)),
          s.and(
            s.gt(s.at, 0n),
            s.eq(s.separator, "."),
            s.or(
              s.and(s.eq(s.digit, true), Compute.matches(s.piece, digitsPattern)),
              s.and(s.eq(s.digit, false), s.not(Compute.matches(s.piece, digitsPattern))),
            ),
          ),
        ),
      ),
    ),
    readingFamily,
    check("E1_derived", AssembledReference, (a) =>
      a.and(
        a.gt(a.placements, 0n),
        a.or(
          a.and(
            a.eq(a.role, "section"),
            a.eq(a.segments, 0n),
            a.eq(a.readings, 1n),
            a.eq(a.lastDigit, false),
          ),
          a.and(
            a.eq(a.role, "variable"),
            a.eq(a.joined, a.identifier),
            a.or(
              a.and(
                a.eq(a.lastDigit, true),
                a.eq(
                  Compute.add(Compute.base(a.readings), 1n),
                  Compute.add(Compute.base(a.segments), Compute.base(a.digits)),
                ),
              ),
              a.and(
                a.eq(a.lastDigit, false),
                a.eq(
                  Compute.base(a.readings),
                  Compute.add(Compute.base(a.segments), Compute.base(a.digits)),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
    // Reading: its copy, its pieces, its source and its laws; its scope and the declaration or the
    // mapping its source names are rules over the queries of `#pantry/qti/queries.ts`.
    contained(
      on(Reading, "assembly", "node", "attribute", "identifier", "kind", "role"),
      on(AssembledReference, "assembly", "node", "attribute", "identifier", "kind", "role"),
    ),
    contained(
      on(segmentReadings, "assembly", "node", "attribute", "split", "scope"),
      on(ReferenceSegment, "assembly", "node", "attribute", "at", "before"),
    ),
    contained(
      on(numberedReadings, "assembly", "node", "attribute", "split", "number"),
      on(ReferenceSegment, "assembly", "node", "attribute", "at", "piece"),
    ),
    // ReadingDeclaration: a resolving declared reading's declaration, forced in, a resolving
    // reading's fields copied, and its mapping's source's declaration (a mapped reading's force-in
    // is "Variable mapping source"'s); a declared one's is the declaration the document it reads
    // declares of its name, a rule over `DeclaredReading`.
    contained(
      on(declaredReadings, "assembly", "node", "attribute", "form", "split"),
      on(ReadingDeclaration, "assembly", "node", "attribute", "form", "split"),
    ),
    contained(
      on(
        ReadingDeclaration,
        "assembly",
        "node",
        "attribute",
        "form",
        "split",
        "kind",
        "source",
        "named",
        "variable",
      ),
      on(
        resolvingReadings,
        "assembly",
        "node",
        "attribute",
        "form",
        "split",
        "kind",
        "source",
        "named",
        "variable",
      ),
    ),
    check("E1_derived", ReadingDeclaration, (d) => d.in(d.source, ["declared", "mapped"])),
    contained(
      on(
        select(ReadingDeclaration, (d) => d.eq(d.source, "mapped")),
        "named",
        "variable",
        "declaration",
        "declarationKind",
        "declCardinalities",
        "declBaseTypes",
      ),
      on(
        MappingSourceDeclaration,
        "itemRef",
        "target",
        "declaration",
        "declarationKind",
        "declCardinalities",
        "declBaseTypes",
      ),
    ),
    check("E1_derived", Reading, (r) =>
      r.and(
        r.or(
          r.and(
            r.eq(r.form, "unsplit"),
            r.eq(r.role, "variable"),
            r.eq(r.split, 0n),
            r.eq(r.scope, ""),
            r.eq(r.number, ""),
            r.eq(r.variable, r.identifier),
            r.eq(r.found, true),
            r.eq(r.named, r.assembly),
            r.eq(r.namedKind, testKind),
            r.eq(r.placements, 1n),
            r.eq(r.replaced, false),
          ),
          r.and(
            r.eq(r.form, "name"),
            r.eq(r.role, "section"),
            r.eq(r.split, 0n),
            r.eq(r.scope, r.identifier),
            r.eq(r.number, ""),
            r.eq(r.variable, ""),
          ),
          r.and(
            r.eq(r.form, "split"),
            r.eq(r.role, "variable"),
            r.gt(r.split, 0n),
            r.eq(r.number, ""),
            r.eq(r.identifier, Compute.concat(Compute.concat(r.scope, "."), r.variable)),
          ),
          r.and(
            r.eq(r.form, "numbered"),
            r.eq(r.role, "variable"),
            r.gt(r.split, 0n),
            Compute.matches(r.number, digitsPattern),
            r.eq(
              r.identifier,
              Compute.concat(
                Compute.concat(Compute.concat(Compute.concat(r.scope, "."), r.number), "."),
                r.variable,
              ),
            ),
          ),
        ),
        // A scope the assembly holds no element of: the test, as a document, placed nowhere.
        r.or(
          r.eq(r.found, true),
          r.and(
            r.eq(r.named, r.assembly),
            r.eq(r.namedKind, "document"),
            r.eq(r.placements, 0n),
            r.eq(r.replaced, false),
          ),
        ),
        // A declared or mapped variable is the queries' to prove (`DeclaredReading`,
        // `MappedReading`), which also hold a declared or mapped one to that source; any other is a
        // built-in exactly where its scope holds one.
        r.or(
          r.in(r.source, ["declared", "mapped"]),
          r.and(r.eq(r.source, "builtIn"), builtInOfScope(r)),
          r.and(r.eq(r.source, "link"), r.not(builtInOfScope(r))),
          r.and(r.eq(r.source, "none"), r.not(builtInOfScope(r))),
        ),
      ),
    ),
    // ReadingCardinality: a reading that stands for a literal, its declaration's cardinality where
    // it has one (spec reading 159), copied from its reading's declaration and the declaration.
    contained(
      on(standInDeclarations, "assembly", "node", "attribute", "form", "split"),
      on(ReadingCardinality, "assembly", "node", "attribute", "form", "split"),
    ),
    contained(
      on(ReadingCardinality, "assembly", "node", "attribute", "form", "split", "declaration"),
      on(ReadingDeclaration, "assembly", "node", "attribute", "form", "split", "declaration"),
    ),
    contained(
      on(ReadingCardinality, "declaration", "declCardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
  ],
  "Item ref target": [
    // MappingItemRef: each mapping's item ref (reading 110), and MappingItemRefType what that names,
    // a row only where the item ref has a target, its type copied from it. One whose item ref has
    // no target has no type row (decision 428): AL3 refuses an unwritten href and "Item ref target"
    // one that names nothing, over the item ref alone, and "Variable mapping source" judges the
    // mapping, as it judges every mapping but an LTI one.
    contained(on(VariableMapping, "node", "parent"), on(MappingItemRef, "node", "itemRef")),
    contained(on(MappingItemRef, "node", "itemRef"), on(VariableMapping, "node", "parent")),
    mappingItemRefTypeFamily,
    contained(on(MappingItemRefType, "node", "itemRef"), on(MappingItemRef, "node", "itemRef")),
    contained(on(MappingItemRefType, "itemRef", "type"), on(ItemRefTarget, "node", "type")),
  ],
  "Prefixed reference": [
    key(on(resolvingReadings, "assembly", "node", "attribute")),
    contained(
      on(
        select(AssembledReference, (a) =>
          a.and(
            a.eq(a.role, "variable"),
            a.not(a.in(a.kind, setterKinds)),
            // A braced reference may have no resolving reading, being then a string value (reading
            // R15-k); the key over `resolvingReadings` still refuses more than one.
            a.eq(VariableReference.at("spelling", a.kind, a.attribute), "bare"),
          ),
        ),
        "assembly",
        "node",
        "attribute",
      ),
      on(resolvingReadings, "assembly", "node", "attribute"),
    ),
    check("Prefixed_reference", Reading, (r) => r.or(r.not(resolves(r)), r.eq(r.placements, 1n))),
  ],
  "Reference type": [
    // A literal's stand-in names a single outcome or template variable of its base (P24): a
    // built-in variable is none, and a declared or mapped one's declaration is its
    // ReadingDeclaration's. A reading through an LTI item ref has no declaration to type it by,
    // and is accepted unchecked (source `link`, spec reading 110): it resolves, names no
    // ReadingDeclaration, and is no built-in.
    check("Reference_type", Reading, (r) =>
      r.or(r.eq(r.attribute, "identifier"), r.not(resolves(r)), r.ne(r.source, "builtIn")),
    ),
    check("Reference_type", ReadingDeclaration, (d) =>
      d.or(
        d.eq(d.attribute, "identifier"),
        d.in(d.declarationKind, ["qti-outcome-declaration", "qti-template-declaration"]),
      ),
    ),
    check("Reference_type", ReadingCardinality, (r) =>
      r.in(ValueCardinalityOf.at("value", r.declCardinality), ["single", "unknown"]),
    ),
    ...referenceBases.map((base) =>
      contained(
        on(
          select(ReadingDeclaration, (d) =>
            d.and(
              d.ne(d.attribute, "identifier"),
              d.eq(d.declBaseTypes, 1n),
              d.or(
                ...ReferenceBase.rows
                  .filter((row) => row.base === base)
                  .map(({ attribute, kind }) =>
                    d.and(d.eq(d.kind, kind), d.eq(d.attribute, attribute)),
                  ),
              ),
            ),
          ),
          "declaration",
        ),
        on(
          select(DeclarationBaseType, (b) => b.eq(b.valueBase, base)),
          "node",
        ),
      ),
    ),
  ],
  "Section identifier target": [
    check("Section_identifier_target", Reading, (r) =>
      r.or(
        r.ne(r.form, "name"),
        r.and(
          r.eq(r.found, true),
          r.in(r.namedKind, [sectionKind, sectionRefKind]),
          r.eq(r.placements, 1n),
        ),
      ),
    ),
  ],
  "Template default target": [
    contained(on(TemplateDefault, "node"), on(TemplateDefaultTarget, "node")),
    contained(
      on(TemplateDefaultTarget, "itemRef", "itemDocument"),
      on(ItemRefDocument, "node", "document"),
    ),
    contained(
      on(
        TemplateDefaultTarget,
        "declaration",
        "itemDocument",
        "template",
        "declarationKind",
        "declBaseTypes",
        "declCardinalities",
      ),
      declarationIdentifierRef,
    ),
    check("Template_default_target", TemplateDefaultTarget, (t) =>
      t.eq(t.declarationKind, "qti-template-declaration"),
    ),
  ],
  "Template default type": [
    check("Template_default_type", TemplateDefaultCardinality, (t) =>
      t.or(
        t.eq(t.heldCardinality, ValueCardinalityOf.at("value", t.declCardinality)),
        t.eq(t.heldCardinality, "unknown"),
      ),
    ),
    contained(
      on(
        select(TemplateDefaultTarget, (t) =>
          t.and(t.eq(t.declBaseTypes, 1n), t.not(t.in(t.heldBase, silentBases))),
        ),
        "declaration",
        "heldBase",
      ),
      on(DeclarationBaseType, "node", "valueBase"),
    ),
  ],
  "Variable declared": [
    check("Variable_declared", Reading, (r) =>
      r.or(
        r.ne(r.form, "unsplit"),
        Compute.matches(r.identifier, prefixedName),
        r.ne(r.source, "none"),
        // A braced reference that names no variable is a string value (reading R15-k), a test's as an
        // item's.
        r.eq(VariableReference.at("spelling", r.kind, r.attribute), "braced"),
      ),
    ),
  ],
  "Variable kind": [
    contained(
      on(
        select(AssembledReference, (a) =>
          a.and(a.eq(a.role, "variable"), a.in(a.kind, setterKinds)),
        ),
        "assembly",
        "node",
        "attribute",
        "kind",
      ),
      on(resolvingReadings, "assembly", "node", "attribute", "kind"),
    ),
    contained(
      on(
        select(ReadingDeclaration, (d) => d.eq(d.attribute, "identifier")),
        "kind",
        "attribute",
        "declarationKind",
      ),
      on(ReferenceDeclaration, "kind", "attribute", "declaration"),
    ),
    check("Variable_kind", Reading, readsAllowedBuiltIn),
  ],
  "Variable mapping source": [
    // Every mapping has its source's declaration, but one under an LTI item ref (reading 110): one
    // whose item ref has no target, and one whose item ref names anything but a link.
    contained(on(untargetedMappings, "node"), on(MappingSourceDeclaration, "node")),
    contained(on(heldMappings, "node"), on(MappingSourceDeclaration, "node")),
    contained(
      on(MappingSourceDeclaration, "itemRef", "itemDocument"),
      on(ItemRefDocument, "node", "document"),
    ),
    contained(
      on(
        MappingSourceDeclaration,
        "declaration",
        "itemDocument",
        "source",
        "declarationKind",
        "declBaseTypes",
        "declCardinalities",
      ),
      declarationIdentifierRef,
    ),
    check("Variable_mapping_source", MappingSourceDeclaration, (m) =>
      m.eq(m.declarationKind, "qti-outcome-declaration"),
    ),
    // A resolving mapped reading's declaration is its mapping's source's, a row of its own, so a
    // reading through a mapping whose source its item declares nothing under has none, and is
    // refused under the mapping's law; one through an LTI item ref is accepted unchecked (reading
    // 110).
    contained(
      on(mappedReadings, "assembly", "node", "attribute", "form", "split", "named"),
      on(ReadingDeclaration, "assembly", "node", "attribute", "form", "split", "named"),
    ),
  ],
  "Variable mapping target": [key(on(MappingSourceDeclaration, "itemRef", "target"))],
} as const;

/**
 * {@link referenceLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const referenceLaws = Object.values(referenceLawsByName).flat();

/**
 * Every statement over the expression and processing overlays, each `check` named by its oracle
 * law: the operand family and its five folds; each overlay's copies and existence; the language
 * chain; the references' resolution; and the P-rules, as the module's header lists them.
 */
export const expressionLawsByName = {
  Arity: [
    operandFamily,
    check("Arity", Expression, (e) =>
      e.between(e.operands, OperatorArity.at("min", e.kind), OperatorArity.at("max", e.kind)),
    ),
  ],
  "Condition type": [
    check("Condition_type", Expression, (e) =>
      e.or(
        e.not(e.in(e.parentKind, conditionKindHandles)),
        e.and(
          e.in(e.baseType, ["boolean", ...silentBases]),
          e.in(e.cardinality, ["single", "unknown"]),
        ),
      ),
    ),
  ],
  "DocumentId key": [
    // ProcessingTemplate: the published template a response processing's URI names.
    key(on(templateAttributes, "node")),
  ],
  "E1 derived": [
    fold(
      operandFamily,
      Monoid.or,
      on(Operand, "operator", "baseTypeBit"),
      on(Expression, "node", "operandBaseTypes"),
    ),
    fold(
      operandFamily,
      Monoid.or,
      on(Operand, "operator", "cardinalityBit"),
      on(Expression, "node", "operandCardinalities"),
    ),
    fold(
      operandFamily,
      Monoid.or,
      on(
        select(Operand, (o) => o.eq(o.rank, 1n)),
        "operator",
        "cardinalityBit",
      ),
      on(Expression, "node", "leadCardinalities"),
    ),
    fold(
      operandFamily,
      Monoid.or,
      on(
        select(Operand, (o) => o.gt(o.rank, 1n)),
        "operator",
        "baseTypeBit",
      ),
      on(Expression, "node", "tailBaseTypes"),
    ),
    fold(
      operandFamily,
      Monoid.or,
      on(
        select(Operand, (o) => o.gt(o.rank, 1n)),
        "operator",
        "cardinalityBit",
      ),
      on(Expression, "node", "tailCardinalities"),
    ),
    // Expression: its tuple, its existence, its parent's kind and its language.
    contained(
      on(Expression, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Node, (n) => n.in(n.kind, expressionKinds)),
        "id",
      ),
      on(Expression, "node"),
    ),
    contained(on(Expression, "parent", "parentKind"), on(Node, "id", "kind")),
    contained(
      on(
        select(Expression, (e) => e.in(e.parentKind, ruleKindHandles)),
        "parent",
        "language",
      ),
      on(Processing, "node", "language"),
    ),
    contained(
      on(
        select(Expression, (e) => e.in(e.parentKind, expressionKinds)),
        "parent",
        "language",
      ),
      on(Expression, "node", "language"),
    ),
    contained(on(resultTyped, "kind", "baseType"), on(ResultBase, "kind", "base")),
    contained(on(Expression, "kind", "cardinality"), on(ResultCardinality, "kind", "cardinality")),
    check("E1_derived", Expression, (e) =>
      e.and(
        e.or(
          e.in(e.parentKind, ruleKindHandles),
          e.in(e.parentKind, expressionKinds),
          e.eq(e.language, "none"),
        ),
        resultDerived(e),
      ),
    ),
    // Operand: its expression, its place, and one for every expression an expression holds.
    contained(
      on(Operand, "node", "operator", "kind", "language", "baseType", "cardinality"),
      exprRef,
    ),
    contained(on(Operand, "node", "rank", "children"), nodeCounts),
    contained(
      on(
        select(Expression, (e) => e.in(e.parentKind, expressionKinds)),
        "node",
      ),
      on(Operand, "node"),
    ),
    // Processing: its tuple, its existence, its parent's kind and its language.
    contained(
      on(Processing, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Node, (n) => n.in(n.kind, ruleKindHandles)),
        "id",
      ),
      on(Processing, "node"),
    ),
    contained(on(Processing, "parent", "parentKind"), on(Node, "id", "kind")),
    contained(
      on(
        select(Processing, (p) =>
          p.and(p.not(p.in(p.kind, rootKinds)), p.in(p.parentKind, ruleKindHandles)),
        ),
        "parent",
        "language",
      ),
      on(Processing, "node", "language"),
    ),
    check("E1_derived", Processing, (p) =>
      p.or(
        ...rootLanguages.map(([kind, language]) =>
          p.and(p.eq(p.kind, kind), p.eq(p.language, language)),
        ),
        p.and(p.not(p.in(p.kind, rootKinds)), p.in(p.parentKind, ruleKindHandles)),
        p.and(
          p.not(p.in(p.kind, rootKinds)),
          p.not(p.in(p.parentKind, ruleKindHandles)),
          p.eq(p.language, "none"),
        ),
      ),
    ),
    // VariableRef: its copy, its element, its document, its declaration and its laws.
    key(on(references, "node", "name")),
    contained(
      on(references, "node", "name", "kind", "lexical"),
      on(VariableRef, "node", "attribute", "kind", "lexical"),
    ),
    contained(
      on(
        select(VariableRef, (v) => v.in(v.kind, expressionKinds)),
        "node",
        "parent",
        "kind",
        "language",
        "elementBase",
        "elementCardinality",
      ),
      exprRef,
    ),
    contained(
      on(
        select(VariableRef, (v) => v.in(v.kind, ruleKindHandles)),
        "node",
        "language",
      ),
      on(Processing, "node", "language"),
    ),
    contained(on(VariableRef, "document", "rootKind"), on(Document, "node", "rootKind")),
    // A declaration's tables, each a row of its own keyed by the declaration, at most one of each
    // slot, and each table a reference claims (VariableRefTable), a declared reference's by its
    // identifier, of a table its kind reads, its declaration's: a slot the declaration leaves empty
    // has no row, so no reference claims it, and a reference that claims none has no claim row.
    key(on(Mapping, "declaration")),
    key(on(AreaMapping, "declaration")),
    key(on(LookupTable, "declaration")),
    contained(
      on(VariableRefTable, "node", "attribute", "declaration", "kind"),
      on(VariableRefDeclaration, "node", "attribute", "declaration", "kind"),
    ),
    check("E1_derived", VariableRefTable, (t) => t.eq(t.attribute, "identifier")),
    contained(on(VariableRefTable, "kind", "table"), on(TableReader, "kind", "table")),
    contained(on(tableClaims("qti-mapping"), "declaration"), on(Mapping, "declaration")),
    contained(on(tableClaims("qti-area-mapping"), "declaration"), on(AreaMapping, "declaration")),
    contained(on(tableClaims("qti-match-table"), "declaration"), on(matchTables, "declaration")),
    contained(
      on(tableClaims("qti-interpolation-table"), "declaration"),
      on(interpolationTables, "declaration"),
    ),
    check("E1_derived", VariableRef, (v) =>
      v.and(
        spells(v),
        resolvedType(v),
        v.or(
          v.ne(v.attribute, "identifier"),
          v.not(v.in(v.kind, declaredKinds)),
          v.and(v.eq(v.elementBase, v.baseType), v.eq(v.elementCardinality, v.cardinality)),
        ),
      ),
    ),
    // VariableRefDeclaration (lane NIL's NS1): a declared reference's declaration, a row of its own.
    mirrors(
      on(
        select(VariableRef, (v) => v.eq(v.resolution, "declared")),
        "node",
        "attribute",
      ),
      on(VariableRefDeclaration, "node", "attribute"),
    ),
    contained(
      on(
        VariableRefDeclaration,
        "node",
        "attribute",
        "baseType",
        "cardinality",
        "document",
        "identifier",
        "kind",
        "language",
      ),
      on(
        VariableRef,
        "node",
        "attribute",
        "baseType",
        "cardinality",
        "document",
        "identifier",
        "kind",
        "language",
      ),
    ),
    check("E1_derived", VariableRefDeclaration, (d) =>
      d.and(
        d.or(d.eq(d.declBaseTypes, 1n), d.eq(d.baseType, "unknown")),
        d.or(d.eq(d.declCardinalities, 1n), d.eq(d.cardinality, "unknown")),
      ),
    ),
    // VariableRefCardinality: a declared reference's declaration's cardinality where it has one
    // (spec reading 159), copied from its declaration row and its declaration, and the reference's
    // type's cardinality its image.
    contained(
      on(
        select(VariableRefDeclaration, (d) => d.eq(d.declCardinalities, 1n)),
        "node",
        "attribute",
      ),
      on(VariableRefCardinality, "node", "attribute"),
    ),
    contained(
      on(VariableRefCardinality, "node", "attribute", "declaration", "cardinality"),
      on(VariableRefDeclaration, "node", "attribute", "declaration", "cardinality"),
    ),
    contained(
      on(VariableRefCardinality, "declaration", "declCardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
    check("E1_derived", VariableRefCardinality, (c) =>
      c.eq(c.cardinality, ValueCardinalityOf.at("value", c.declCardinality)),
    ),
    contained(
      on(typedVariableRefs, "declaration", "baseType"),
      on(DeclarationBaseType, "node", "valueBase"),
    ),
    // PlacedVariableRef (spec reading 117): each item instance's references, its document's,
    // resolved among the item's declarations, under "Variable declared" over the assembly.
    documentVariableFamily,
    placedVariableFamily,
    contained(
      on(PlacedVariableRef, "instance", "document", "assembly"),
      on(Instance, "id", "document", "assembly"),
    ),
    contained(
      on(PlacedVariableRef, "node", "attribute", "document", "identifier", "kind"),
      on(VariableRef, "node", "attribute", "document", "identifier", "kind"),
    ),
    contained(on(PlacedVariableRef, "assembly", "rootKind"), on(Document, "node", "rootKind")),
    check("E1_derived", PlacedVariableRef, (v) =>
      v.or(
        v.eq(v.resolution, "declared"),
        v.and(
          v.eq(v.resolution, "builtIn"),
          v.or(
            ...builtIns.map(({ root, variable }) =>
              v.and(v.eq(v.rootKind, root), v.eq(v.identifier, variable)),
            ),
          ),
        ),
        v.and(
          v.eq(v.resolution, "unresolved"),
          ...builtInRoots.map(([root, names]) =>
            v.or(v.ne(v.rootKind, root), v.not(v.in(v.identifier, names))),
          ),
        ),
      ),
    ),
    // PlacedVariableRefDeclaration (lane NIL's NS1): a declared placed reference's declaration.
    mirrors(
      on(
        select(PlacedVariableRef, (v) => v.eq(v.resolution, "declared")),
        "instance",
        "node",
        "attribute",
      ),
      on(PlacedVariableRefDeclaration, "instance", "node", "attribute"),
    ),
    contained(
      on(
        PlacedVariableRefDeclaration,
        "instance",
        "node",
        "attribute",
        "assembly",
        "identifier",
        "kind",
      ),
      on(PlacedVariableRef, "instance", "node", "attribute", "assembly", "identifier", "kind"),
    ),
    // ExpressionAttribute and Literal: the attributes and text an expression's type follows from.
    key(on(typingAttributes, "node", "name")),
    contained(
      on(typingAttributes, "node", "name", "kind", "lexical"),
      on(ExpressionAttribute, "node", "attribute", "kind", "lexical"),
    ),
    contained(
      on(ExpressionAttribute, "node", "parent", "kind", "language", "baseType", "cardinality"),
      exprRef,
    ),
    // A written row's attribute exists, by the selection's key `(node, name)`. Its kind and lexical
    // form are the forward containment's: both sides are keyed by node and name, so that
    // containment's row for the attribute is this row. Its UNIQUE is that key's, and
    // `Attribute.lexical`, which no pattern bounds, sits in no UNIQUE.
    contained(on(writtenAttributes, "node", "attribute"), on(typingAttributes, "node", "name")),
    key(on(typeAttributes, "node")),
    contained(
      on(
        select(Expression, (e) => e.in(e.kind, optionallyTypedKinds)),
        "node",
      ),
      on(typeAttributes, "node"),
    ),
    // A test variables' weight, written or not (decision 434): every test variables has its row,
    // and an unwritten `base-type` is `unknown` only where the weight is unwritten, float only
    // where it is written. `E1_derived` below admits no other type for an unwritten one.
    contained(
      on(
        select(Expression, (e) => e.eq(e.kind, "qti-test-variables")),
        "node",
      ),
      on(weightAttributes, "node"),
    ),
    contained(
      on(unknownUnwrittenBases, "node", "written"),
      on(weightAttributes, "node", "written"),
    ),
    contained(on(floatUnwrittenBases, "node"), on(writtenWeights, "node")),
    check("E1_derived", ExpressionAttribute, (x) =>
      x.or(
        x.and(
          x.eq(x.written, true),
          x.or(
            x.and(
              x.eq(x.attribute, "base-type"),
              Compute.matches(x.lexical, ValueBaseForm.at("pattern", x.baseType)),
            ),
            x.and(
              x.eq(x.attribute, "base-type"),
              x.eq(x.baseType, "unknown"),
              x.not(Compute.matches(x.lexical, spelledBasesPattern)),
            ),
            x.and(
              x.eq(x.attribute, "name"),
              x.or(
                x.and(
                  Compute.matches(x.lexical, integerMathOperatorNames),
                  x.eq(x.baseType, "integer"),
                ),
                x.and(
                  x.not(Compute.matches(x.lexical, integerMathOperatorNames)),
                  x.eq(x.baseType, "float"),
                ),
              ),
            ),
            x.eq(x.attribute, "weight-identifier"),
          ),
        ),
        x.and(
          x.eq(x.written, false),
          x.eq(x.kind, "qti-test-variables"),
          x.eq(x.lexical, ""),
          x.or(
            x.and(x.eq(x.attribute, "base-type"), x.in(x.baseType, ["float", "unknown"])),
            x.eq(x.attribute, "weight-identifier"),
          ),
        ),
      ),
    ),
    contained(
      on(
        select(Node, (n) => n.eq(n.kind, "qti-base-value")),
        "id",
        "stringValue",
      ),
      on(Literal, "node", "text"),
    ),
    contained(on(typedBaseValues, "node"), on(LiteralTyped, "node")),
    contained(
      on(LiteralTyped, "node", "text", "baseType"),
      on(Literal, "node", "text", "baseType"),
    ),
    contained(
      on(Literal, "node", "parent", "kind", "language", "baseType", "cardinality"),
      exprRef,
    ),
    check("E1_derived", LiteralTyped, (l) =>
      l.and(l.ne(l.baseType, "unknown"), l.eq(ValueBaseOf.at("value", l.typeCode), l.baseType)),
    ),
    contained(on(templateAttributes, "node", "lexical"), on(ProcessingTemplate, "node", "uri")),
    check("E1_derived", ProcessingTemplate, (t) =>
      t.or(
        ...publishedTemplates.map(([template, pattern]) =>
          t.and(t.eq(t.template, template), Compute.matches(t.uri, pattern)),
        ),
        t.and(
          t.eq(t.template, "none"),
          ...publishedTemplates.map(([, pattern]) => t.not(Compute.matches(t.uri, pattern))),
        ),
      ),
    ),
  ],
  "Literal lexical": [
    check("Literal_lexical", LiteralTyped, (l) =>
      Compute.matches(l.text, BaseTypePattern.at("pattern", l.typeCode)),
    ),
  ],
  "Lookup type": [
    // A declared lookup claims its declaration's lookup table, a match or an interpolation table
    // (§2.5.1.4), and one whose declaration holds none has no claim to make.
    contained(
      on(
        select(VariableRefDeclaration, (d) =>
          d.and(d.eq(d.attribute, "identifier"), d.eq(d.kind, lookupKindHandle)),
        ),
        "node",
        "attribute",
      ),
      on(VariableRefTable, "node", "attribute"),
    ),
  ],
  "Mapped response": [
    // A test's prefixed map response or map response point of a declared response reads that
    // response's mapping or area mapping, and one of a built-in response, which declares no table,
    // is refused (reading 166).
    contained(
      on(prefixedTableReaders("qti-map-response"), "declaration"),
      on(Mapping, "declaration"),
    ),
    contained(
      on(prefixedTableReaders("qti-map-response-point"), "declaration"),
      on(AreaMapping, "declaration"),
    ),
    check("Mapped_response", Reading, mapsNoBuiltInResponse),
    // A placed one, an included rules fragment's or the item's own, reads the mapping or area
    // mapping of the declaration it names among its item's (readings 117 and 166).
    contained(
      on(placedTableReaders("qti-map-response"), "declaration"),
      on(Mapping, "declaration"),
    ),
    contained(
      on(placedTableReaders("qti-map-response-point"), "declaration"),
      on(AreaMapping, "declaration"),
    ),
    // An unprefixed one never names a built-in response, which declares no table (reading 166).
    check("Mapped_response", VariableRef, mapsNoBuiltIn),
    check("Mapped_response", PlacedVariableRef, mapsNoBuiltIn),
    // A declared map response claims its response's mapping, and a map response point its area
    // mapping of points (§2.11.3.29, §2.11.3.30): its kind reads that table alone (TableReader).
    check("Mapped_response", VariableRefDeclaration, (d) =>
      d.or(
        d.ne(d.attribute, "identifier"),
        d.not(d.in(d.kind, mappedKinds)),
        d.and(
          d.eq(d.declarationKind, "qti-response-declaration"),
          d.or(d.ne(d.kind, "qti-map-response-point"), d.in(d.baseType, ["point", ...silentBases])),
        ),
      ),
    ),
    contained(
      on(
        select(VariableRefDeclaration, (d) =>
          d.and(d.eq(d.attribute, "identifier"), d.in(d.kind, mappedKinds)),
        ),
        "node",
        "attribute",
      ),
      on(VariableRefTable, "node", "attribute"),
    ),
  ],
  "One base": [
    check("One_base", Expression, (e) =>
      e.and(
        e.or(
          e.not(e.in(e.kind, oneBaseKinds)),
          e.le(
            Compute.cardinality(
              Compute.difference(e.operandBaseTypes, ValueBaseBit.row("unknown")),
            ),
            1n,
          ),
        ),
        e.or(
          e.not(e.in(e.kind, oneCardinalityKinds)),
          e.le(Compute.cardinality(e.operandCardinalities), 1n),
        ),
      ),
    ),
  ],
  "Operand fit": [
    check("Operand_fit", Expression, (e) =>
      e.and(
        e.eq(Compute.subset(e.operandBaseTypes, OperandBase.row(e.kind)), true),
        e.eq(Compute.subset(e.leadCardinalities, LeadCardinality.row(e.kind)), true),
        e.eq(Compute.subset(e.tailCardinalities, TailCardinality.row(e.kind)), true),
      ),
    ),
  ],
  "Outcome only": [
    check("Outcome_only", Expression, (e) =>
      e.or(e.not(e.in(e.kind, outcomeOnlyKinds)), e.eq(e.language, "outcome")),
    ),
  ],
  "Reference type": [
    check("Reference_type", VariableRef, (v) =>
      v.or(v.eq(v.attribute, "identifier"), v.ne(v.resolution, "builtIn")),
    ),
    check("Reference_type", VariableRefDeclaration, (d) =>
      d.or(
        d.eq(d.attribute, "identifier"),
        d.and(
          d.in(d.declarationKind, ["qti-outcome-declaration", "qti-template-declaration"]),
          d.or(
            d.eq(d.baseType, ReferenceBase.at("base", d.kind, d.attribute)),
            d.in(d.baseType, silentBases),
          ),
          d.in(d.cardinality, ["single", "unknown"]),
        ),
      ),
    ),
  ],
  "Template reads": [
    check("Template_reads", VariableRef, (v) =>
      v.or(
        v.ne(v.language, "template"),
        v.not(v.in(v.kind, expressionKinds)),
        v.ne(v.resolution, "builtIn"),
        v.eq(v.identifier, "QTI_CONTEXT"),
      ),
    ),
    check("Template_reads", VariableRefDeclaration, (d) =>
      d.or(
        d.ne(d.language, "template"),
        d.not(d.in(d.kind, expressionKinds)),
        d.not(d.in(d.declarationKind, ["qti-outcome-declaration", "qti-response-declaration"])),
      ),
    ),
  ],
  "Variable declared": [
    contained(
      on(
        VariableRefDeclaration,
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "declBaseTypes",
        "declCardinalities",
      ),
      declarationIdentifierRef,
    ),
    check("Variable_declared", VariableRef, (v) =>
      v.or(
        v.not(v.in(v.rootKind, [itemKind, testKind])),
        v.ne(v.resolution, "unresolved"),
        // A braced reference is a string attribute's: where it names no variable it is a string
        // value, a test's as an item's, not a reference to one nothing declares (reading R15-k;
        // information model §9.3.4: "if a string appears to be a reference to a template or outcome
        // variable but there is no variable with the given name it should be treated simply as
        // string value"). A numeric attribute's stand-in is bare, and an unresolved one stays refused.
        v.eq(VariableReference.at("spelling", v.kind, v.attribute), "braced"),
        v.and(v.eq(v.rootKind, testKind), Compute.matches(v.identifier, prefixedName)),
      ),
    ),
    contained(
      on(
        PlacedVariableRefDeclaration,
        "declaration",
        "assembly",
        "identifier",
        "declarationKind",
        "declBaseTypes",
        "declCardinalities",
      ),
      declarationIdentifierRef,
    ),
    check("Variable_declared", PlacedVariableRef, (v) =>
      v.or(
        v.ne(v.rootKind, itemKind),
        v.ne(v.resolution, "unresolved"),
        // A braced reference that names none is a string value (reading R15-k), as `VariableRef`'s.
        v.eq(VariableReference.at("spelling", v.kind, v.attribute), "braced"),
      ),
    ),
  ],
  "Variable kind": [
    contained(
      on(namedVariables, "kind", "attribute", "declarationKind"),
      on(ReferenceDeclaration, "kind", "attribute", "declaration"),
    ),
    check("Variable_kind", VariableRef, namesAllowedBuiltIn),
    contained(
      on(namedPlacedVariables, "kind", "attribute", "declarationKind"),
      on(ReferenceDeclaration, "kind", "attribute", "declaration"),
    ),
    check("Variable_kind", PlacedVariableRef, placesAllowedBuiltIn),
  ],
  "Weighted base": [
    check("Weighted_base", ExpressionAttribute, (x) =>
      x.or(
        x.ne(x.attribute, "weight-identifier"),
        x.eq(x.written, false),
        x.in(x.baseType, ["float", "unknown"]),
      ),
    ),
  ],
} as const;

/**
 * {@link expressionLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const expressionLaws = [...Object.values(expressionLawsByName).flat(), ...referenceLaws];
