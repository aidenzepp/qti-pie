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
 *   A63), or nothing, which only a document that is no item may hold; a claim of no declaration is
 *   proved by {@link VariableLookup} (M2), and a table it reads by that table's own row, which
 *   hangs from its declaration (`Mapping`, `AreaMapping`, `LookupTable`). The type a setter or a
 *   lookup sets its variable to is a row of its own, {@link HeldType}, and so is the cardinality of
 *   each declaration a reference reads one of, where it has one ({@link VariableRefCardinality},
 *   {@link TemplateDefaultCardinality}, {@link ReadingCardinality}).
 * - **{@link ExpressionAttribute}** carries the attributes an expression's type follows from
 *   (`base-type`, `name`, `weight-identifier`), an unwritten one included, {@link Literal} a base
 *   value's text, and {@link ProcessingTemplate} a response processing's published template.
 * - **A test's references** (spec readings 4, 5, 48, 88 and 117; `representation-gaps.md` §4): every
 *   reference of a document that is no item, a test, a section document or a fragment a test or a
 *   section document splices ({@link TestReference}), is placed once per instance of every test
 *   that places its document ({@link PlacedReference}) and read once per test
 *   ({@link AssembledReference}), its name split at every dot ({@link ReferenceSegment}) and read
 *   in every reading ({@link Reading}), each reading's scope and variable looked up in the assembly
 *   ({@link NameLookup}), the declarations ({@link VariableLookup}) and the item ref's mappings
 *   ({@link MappingLookup}); exactly one reading resolves (M3). Beside them, a template default's
 *   and a variable mapping's declarations in the item their item ref names
 *   ({@link TemplateDefaultTarget}, {@link MappingSourceDeclaration}), and a `section-identifier`'s
 *   name ({@link SectionIdentifier}).
 *
 * The laws, each named by its oracle law with spaces written as underscores, and the rule each
 * keeps: `Arity` (P2); `Operand_fit` and `One_base` (P23); `Condition_type` (P21); `Set_type`
 * (P20); `Lookup_type` (P22); `Reference_type` (P24); `Outcome_only` (P25); `Template_reads` (P26);
 * `Mapped_response` (P27); `Weighted_base` (P29); `Variable_declared` (P8, over an item's names and
 * a test's and a section's unprefixed ones); `Literal_lexical` (attribute-lexical);
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
  constant,
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
  DeclarationIdentifier,
  declarationIdentifierRef,
} from "#pantry/qti/declarations.ts";
import {
  BaseTypePattern,
  conditionKindHandles,
  containerKinds,
  declaredKinds,
  expressionKinds,
  firstKinds,
  heldKinds,
  Language,
  LeadCardinality,
  lookupKindHandle,
  numericKinds,
  oneBaseKinds,
  oneCardinalityKinds,
  OperandBase,
  outcomeOnlyKinds,
  processingReferences,
  ReadingForm,
  ReadingSource,
  ReferenceBase,
  ReferenceDeclaration,
  referenceDeclarations,
  ReferencedTable,
  TableReader,
  ReferenceResolution,
  ReferenceRole,
  ResultBase,
  ResultCardinality,
  rootLanguages,
  rootKinds,
  RpTemplate,
  ruleKindHandles,
  secondKinds,
  setKindHandles,
  setterKinds,
  TailCardinality,
  ValueBase,
  ValueBaseBit,
  ValueBaseForm,
  spelledBasesPattern,
  ValueBaseOf,
  ValueCardinality,
  ValueCardinalityBit,
  ValueCardinalityOf,
  valueBaseOf,
  valueCardinalityOf,
} from "#pantry/qti/expression-types.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { AreaMapping, LookupTable, Mapping } from "#pantry/qti/mapping.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";
import {
  AssembledName,
  Instance,
  InstanceName,
  ItemRefDocument,
  ItemRefTarget,
  itemKind,
  itemRefKind,
  itemResourceType,
  Named,
  partKind,
  sectionKind,
  sectionRefKind,
  testKind,
  VariableMapping,
} from "#pantry/qti/tests.ts";

/**
 * What a reference's lexical form holds around the name it spells: XML whitespace `S`, possibly
 * none, which a collapsing type absorbs, or one brace of a braced reference. Exported for
 * `src/import/refusal.ts`, which names its pattern law.
 */
export const Affix = str.regex("^(?:[\\t\\n\\r ]*|\\{|\\})$");

/**
 * XML whitespace `S`, possibly none, as a pattern.
 */
const spacePattern = "^[\\t\\n\\r ]*$";

/**
 * The pattern of a name a reference spells: an NCName (`ncNamePattern`), the reference member of a
 * literal-or-reference union (`VariableStringDType`, `xs:NCName`, `EncVariableStringDType`'s
 * braced one), which no integer or float literal is but `INF` and `NaN`. Any other value names
 * nothing, and its value domain refuses it alone (spec reading 152).
 */
const namePattern = `^${ncNamePattern}$`;

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
 *   the language for a rule); `rootKind`, its document's root's; `resolution`; `baseType` and
 *   `cardinality`, the variable's type; and `table`, the table its element needs the declaration to
 *   hold.
 *
 * The declaration a declared reference names is a row of its own, {@link VariableRefDeclaration}
 * (lane NIL's NS1: a reference that names no declaration has no declaration row, never the nil
 * uuid), and so is the type of a setter's or a lookup's one expression, {@link HeldType}. A type
 * field its element leaves unread holds `unknown`.
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
    table: closedId(ReferencedTable),
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
    table: closedId(ReferencedTable),
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
 * The type a setter or a lookup sets its variable to, keyed by its node: the `exprRef` tuple of its
 * first expression (`expression`, `node` its parent, `expressionKind`, `language`, `heldBase` and
 * `heldCardinality`), the one its content model allows (a second breaks N5's `Follow`), beside the
 * fields of its {@link VariableRef} that `Set_type` and `Lookup_type` compare with it (`kind`,
 * `baseType`, `cardinality` and `table`), each copied from the reference.
 *
 * A row of its own (AGENTS.md's Schema intent: a value that may be missing is a row of its own
 * relation), written where the setter both names a variable and holds an expression. One whose
 * `identifier` names no variable, unwritten or no NCName (spec reading 152), has no reference, and
 * one that holds no expression holds no type, so neither has a row, and AL3, its value domain or
 * its content model refuses it alone. Every field is proved by a copy, but no law forces the row in
 * where both are: a containment's source is one relation's rows, never the join of two. The import
 * writes it there (`heldTypesOf`), and the genetic differential holds it to the oracle's `Set type`
 * and `Lookup type`.
 */
export const HeldType = relation(
  "HeldType",
  {
    baseType: closedId(ValueBase),
    cardinality: closedId(ValueCardinality),
    expression: uuid,
    expressionKind: closedId(NodeKind),
    heldBase: closedId(ValueBase),
    heldCardinality: closedId(ValueCardinality),
    kind: closedId(NodeKind),
    language: closedId(Language),
    node: uuid,
    table: closedId(ReferencedTable),
  },
  ["node"],
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
 * too, unwritten, with an empty lexical form: it is thereby proved `unknown` (M2,
 * `representation-gaps.md` §1: absence as a keyed null object, which the attribute's own copy
 * refutes where it is written). A base value's `base-type` and a math operator's `name` are
 * required, so an element that omits one has no row, and AL3 refuses it alone.
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
 * Whether a document declares a name, keyed by the document and the name (M2,
 * `representation-gaps.md` §4.3): each name a document declares is forced in, `declared`, whatever
 * its declaration's cardinality spells (spec reading 159), and justified by its
 * `DeclarationIdentifier`; every other row is a probe of a name the document does not declare. The
 * key leaves no room for an absent row where a declaration is, so a probe reads the truth: a
 * reference's claim that it names no declaration, a reading's variable, a mapping target. The
 * verdict is the row's one datum: a declared name's declaration, its kind and its counts of
 * cardinalities and base types are its `DeclarationIdentifier`'s, which a reading of it reads
 * through `declarationIdentifierRef`, so a probe holds no declaration it does not have.
 */
export const VariableLookup = relation(
  "VariableLookup",
  { declared: pg.boolean, document: uuid, name: keyText },
  ["document", "name"],
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
 * types, and `targetDeclared`, whether the item declares `target` too, read from
 * {@link VariableLookup}. Every mapping has one ("Variable mapping source"), whose declaration is
 * an outcome declaration (`Variable_mapping_source`).
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
    targetDeclared: pg.boolean,
  },
  ["node"],
);

/**
 * Whether an item ref maps a name, keyed by the item ref and the name (M2): each variable mapping
 * is forced in by its target, `mapped`, and every other row is a probe of a name the item ref maps
 * nothing to. The verdict is the row's one datum: a mapped name's variable, its source's
 * declaration, is {@link MappingSourceDeclaration}'s.
 */
export const MappingLookup = relation(
  "MappingLookup",
  { itemRef: uuid, mapped: pg.boolean, name: keyText },
  ["itemRef", "name"],
);

/**
 * Whether a test's assembly holds a name, keyed by the test and the name (M2,
 * `representation-gaps.md` §4.3's `NameLookup`): each written element of the assembly
 * (`AssembledName`) is forced in, `found`, with its node, its kind, its `placements`, one instance
 * that places it and whether a replacement can repeat it there (`InstanceName.replaced`), and, for
 * an item ref, the type of what it names (`resourceType`, an item or an LTI link) and the item
 * (`itemDocument`, its `ItemRefDocument`'s); every other row is a probe of a name the assembly
 * holds none of, its node, instance and item the test itself, its kind `document`, its type `none`
 * and its placements 0. The test itself stands as the item of every name that is no item ref of an
 * item, the null object RG4's design gives it (`representation-gaps.md` §4.3).
 */
export const NameLookup = relation(
  "NameLookup",
  {
    assembly: uuid,
    found: pg.boolean,
    instance: uuid,
    itemDocument: uuid,
    kind: closedId(NodeKind),
    name: keyText,
    node: uuid,
    placements: natural,
    replaced: pg.boolean,
    resourceType: closedId(ResourceType),
  },
  ["assembly", "name"],
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
 * - **the scope:** `found`, `named`, `namedKind`, `placements`, `replaced`, `resourceType` and
 *   `lookupDocument`, read from {@link NameLookup} at `(assembly, scope)`, the test itself for an
 *   unsplit reading;
 * - **the variable:** `declared`, read from {@link VariableLookup} in `lookupDocument` (the test's or
 *   the item's), `mapped`, from {@link MappingLookup} at the item ref, and `source`, which of the
 *   two or a built-in of the scope names it; `declaration`, `declarationKind`, `declCardinalities`
 *   and `declBaseTypes`, the declared or mapped variable's declaration, its kind and its counts of
 *   cardinalities and base types, whatever its cardinality spells (spec reading 159);
 * - **the copy:** `identifier`, `kind`, `role`, its {@link AssembledReference}'s.
 *
 * A reading resolves when its variable is named and, numbered, its item ref can repeat and its
 * number is at least 1 (reading 88). Exactly one reading of a variable reference resolves (M3).
 * The cardinality of a resolving reading's declaration that `Reference_type` reads is a row of its
 * own, {@link ReadingCardinality}.
 */
export const Reading = relation(
  "Reading",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    declBaseTypes: natural,
    declCardinalities: natural,
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    declared: pg.boolean,
    form: closedId(ReadingForm),
    found: pg.boolean,
    identifier: keyText,
    kind: closedId(NodeKind),
    lookupDocument: uuid,
    mapped: pg.boolean,
    named: uuid,
    namedKind: closedId(NodeKind),
    node: uuid,
    number: keyText,
    placements: natural,
    replaced: pg.boolean,
    resourceType: closedId(ResourceType),
    role: closedId(ReferenceRole),
    scope: keyText,
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
 * `declaration`, its reading's, and `declCardinality`, the declaration's
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
  HeldType,
  MappingLookup,
  MappingSourceDeclaration,
  NameLookup,
  PlacedDocument,
  PlacedReference,
  PlacedVariableRef,
  PlacedVariableRefDeclaration,
  Reading,
  ReadingCardinality,
  ReferenceDocument,
  ReferenceSegment,
  SectionIdentifier,
  TemplateDefault,
  TemplateDefaultCardinality,
  TemplateDefaultTarget,
  TestReference,
  VariableLookup,
  VariableRefCardinality,
  VariableRefDeclaration,
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
const silentBases = ["any", "unknown"] as const;

/**
 * The bare and braced spellings a reference's lexical form takes: the name with the whitespace a
 * collapsing type absorbs, or the name between braces exactly (`EncVariableStringDType`).
 */
const bareReference = `^[\\t\\n\\r ]*${ncNamePattern}[\\t\\n\\r ]*$`;

/**
 * A braced reference's lexical form.
 */
const bracedReference = `^\\{${ncNamePattern}\\}$`;

/**
 * A float literal that is also a name, which a float-or-reference attribute reads as the literal:
 * the union's first member, `xs:double`, takes it (XML Schema Part 2, 4.1.2.3).
 */
const floatName = "^[\\t\\n\\r ]*(?:INF|NaN)[\\t\\n\\r ]*$";

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
 * The setters' and the lookup's references to their variable, whose fields a {@link HeldType}
 * copies.
 */
const heldReferences = select(VariableRef, (v) =>
  v.and(v.eq(v.attribute, "identifier"), v.in(v.kind, heldKinds)),
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
const prefixedName = "^.*[.].*$";

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
 * State where a reference may claim a table of its declaration: none, or one where it names a
 * declared variable by its `identifier`. Which table its kind reads is {@link TableReader}'s, the
 * containment of {@link claimedTables}; each claimed table is a containment into its overlay, and
 * a missing one is `Mapped_response`'s or `Lookup_type`'s refusal.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const tableClaimed = (v: VariableRefRow) =>
  v.or(
    v.eq(v.table, "none"),
    v.and(v.eq(v.attribute, "identifier"), v.eq(v.resolution, "declared")),
  );

/**
 * The references that claim a table, each a pair of its kind and the table, which
 * {@link TableReader} holds.
 */
const claimedTables = select(VariableRef, (v) => v.ne(v.table, "none"));

/**
 * The references that claim one table of their declaration: a map response's mapping, a map
 * response point's area mapping, and a lookup's match or interpolation table. A reference claims a
 * table only where it names a declared variable by its `identifier` ({@link tableClaimed}), so each
 * has its {@link VariableRefDeclaration}, and its claim is a containment into the table's own row,
 * keyed by its declaration: a declaration that holds no such table has none, so no reference claims
 * it. A map response, a map response point or a lookup that claims no table is refused by
 * `Mapped_response` or `Lookup_type`.
 *
 * @param table - The table claimed.
 * @returns The selection.
 */
const tableClaims = (table: Exclude<(typeof ReferencedTable.handles)[number], "none">) =>
  select(VariableRefDeclaration, (d) => d.eq(d.table, table));

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
 * The kinds whose type an attribute of their own gives.
 */
const attributeTypedKinds = ["qti-base-value", "qti-math-operator", "qti-test-variables"] as const;

/**
 * The attribute-typed kinds whose typing attribute an element may omit, so that its absence types
 * the element: a test variables' `base-type` (`TestVariablesDType`, `use="optional"`), whose
 * absence matches every variable and types it `unknown`. A base value's `base-type` and a math
 * operator's `name` are required (`BaseValueDType` and `MathOperatorDType`, `use="required"`), so
 * an element that omits one is AL3's alone, and holds no typing row.
 */
export const optionallyTypedKinds = [
  "qti-test-variables",
] as const satisfies readonly (typeof attributeTypedKinds)[number][];

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
 * The names a document declares.
 */
const declaredNames = select(VariableLookup, (l) => l.eq(l.declared, true));

/**
 * The names a document is probed for and does not declare.
 */
const absentNames = select(VariableLookup, (l) => l.eq(l.declared, false));

/**
 * The published templates, each with the pattern its `template` URI matches.
 */
const publishedTemplates = rpTemplates.flatMap((template) =>
  template === "none" ? [] : [[template, rpTemplatePattern(template)] as const],
);

/**
 * The positive instance numbers of reading 88: all digits, and not all zeros, so at least 1, with
 * no bound (a number beyond the instances drawn names one never drawn, which no static rule
 * refuses).
 */
export const positiveNumberPattern = "^[0-9]*[1-9][0-9]*$";

/**
 * A name piece of all digits: an instance number's form.
 */
export const digitsPattern = "^[0-9]+$";

/**
 * A segment's piece: no dot.
 */
export const piecePattern = "^[^.]*$";

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
 * State that a reading's scope is a found item ref that names an item of the package, not an LTI
 * link, so the item's declarations are read.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const itemHeld = (r: ReadingRow) => r.and(itemScoped(r), r.eq(r.resourceType, itemResourceType));

/**
 * State that a reading reads its variable in a document's declarations: the test's own, unsplit,
 * or an item ref's item.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const readsDeclarations = (r: ReadingRow) => r.or(r.eq(r.form, "unsplit"), itemHeld(r));

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
 * The built-ins of one root, each with the declaration kind it stands as there.
 *
 * @param root - The root's kind.
 * @returns The built-ins.
 */
const builtInKindsOf = (root: string) =>
  builtIns
    .filter((row) => row.root === root)
    .map(({ declaration, variable }) => [variable, declaration] as const);

/**
 * State that a built-in reading's declaration kind is the one its built-in stands as under its
 * scope's root (the installed `BuiltInVariable`): a test's, unsplit; an item's, through an item
 * ref; a section's, for a part's, a section's or a section ref's `duration`.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const builtInKindOfScope = (r: ReadingRow) =>
  r.or(
    ...builtInKindsOf(testKind).map(([variable, declaration]) =>
      r.and(
        r.eq(r.form, "unsplit"),
        r.eq(r.variable, variable),
        r.eq(r.declarationKind, declaration),
      ),
    ),
    ...builtInKindsOf(itemKind).map(([variable, declaration]) =>
      r.and(itemScoped(r), r.eq(r.variable, variable), r.eq(r.declarationKind, declaration)),
    ),
    ...builtInKindsOf(sectionKind).map(([variable, declaration]) =>
      r.and(
        r.eq(r.form, "split"),
        r.in(r.namedKind, durationScopes),
        r.eq(r.variable, variable),
        r.eq(r.declarationKind, declaration),
      ),
    ),
  );

/**
 * State that a reading resolves (spec reading 48): its variable is named, declared, mapped or
 * built in, and, numbered, its item ref can repeat under a selection with replacement and its
 * number is at least 1 (reading 88). A name reading, a `section-identifier`'s, is no variable's,
 * and a setter's prefixed reading resolves nothing: a setter sets its own document's variable
 * (reading 112).
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
 * The readings that resolve: a key over them by their reference is "at most one", and the
 * containment of every variable reference into them "at least one" (M3).
 */
const resolvingReadings = select(Reading, resolves);

/**
 * The resolving readings that stand for a literal, by an attribute other than `identifier`, of a
 * declared or mapped variable whose declaration has a cardinality: each has its
 * {@link ReadingCardinality}, which `Reference_type` reads (spec reading 159).
 */
const standInReadings = select(Reading, (r) =>
  r.and(
    r.ne(r.attribute, "identifier"),
    resolves(r),
    r.in(r.source, ["declared", "mapped"]),
    r.eq(r.declCardinalities, 1n),
  ),
);

/**
 * The resolving readings of a reference by `identifier`: each names one of the declaration kinds
 * its element reads or sets.
 */
const namedReadings = select(Reading, (r) => r.and(resolves(r), r.eq(r.attribute, "identifier")));

/**
 * The readings that probe the assembly's names: every one but an unsplit reading.
 */
const scopedReadings = select(Reading, (r) => r.ne(r.form, "unsplit"));

/**
 * The readings whose variable is a declaration of the test or of an item.
 */
const declarationReaders = select(Reading, readsDeclarations);

/**
 * The readings through an item ref, which read its mappings.
 */
const mappingReaders = select(Reading, itemScoped);

/**
 * The readings whose variable is declared, with that declaration's codes.
 */
const declaredReadings = select(Reading, (r) => r.eq(r.source, "declared"));

/**
 * The readings whose variable is mapped, with the source declaration's codes.
 */
const mappedReadings = select(Reading, (r) => r.eq(r.source, "mapped"));

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
 * The names an assembly holds, forced in from `AssembledName`.
 */
const foundNames = select(NameLookup, (n) => n.eq(n.found, true));

/**
 * The item refs an assembly holds that name a resource of the package, with its type. One whose
 * lookup names `none`, NameLookup's null object for "no resource" (`representation-gaps.md` §4.3),
 * has no target to copy: it writes no href, which AL3 alone refuses (spec reading 155), or its
 * href names no resource, which "Item ref target" refuses over its target (`#pantry/qti/tests.ts`).
 */
const targetedItemRefs = select(NameLookup, (n) =>
  n.and(n.eq(n.found, true), n.eq(n.kind, itemRefKind), n.ne(n.resourceType, "none")),
);

/**
 * The item refs an assembly holds that name an item, with the item.
 */
const heldItemRefs = select(NameLookup, (n) =>
  n.and(n.eq(n.found, true), n.eq(n.kind, itemRefKind), n.eq(n.resourceType, itemResourceType)),
);

/**
 * The names an item ref maps.
 */
const mappedNames = select(MappingLookup, (m) => m.eq(m.mapped, true));

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
 * §4; the UP audit's A47, A50, A53, A55, A56, A58 to A61, A65 and A66), the lookups they read (M2)
 * and the declarations a test's item refs name (A34, A37, A38), each `check` named by its oracle
 * law:
 *
 * - **the lookups:** `VariableLookup`, `NameLookup` and `MappingLookup`, each with its facts forced
 *   in and its found rows justified, every named declaration's name whatever its cardinality spells
 *   (spec reading 159); `NameLookup`'s absent rows' null objects (`E1_derived`); `VariableLookup`
 *   and `MappingLookup` each hold their verdict alone;
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
    // VariableLookup: every declared name forced in, whatever its declaration's cardinality spells
    // (spec reading 159), and each found one justified. Both read a declaration's name, never its
    // node: the lookup is keyed by the document and the name, so a force-in of each declaration's
    // node would state Declaration key again, and a second declaration of a name would break both.
    // Declaration key alone says a name's declaration is one.
    contained(
      on(DeclarationIdentifier, "document", "identifier", constant(true)),
      on(VariableLookup, "document", "name", "declared"),
    ),
    contained(
      on(declaredNames, "document", "name"),
      on(DeclarationIdentifier, "document", "identifier"),
    ),
    key(on(absentNames, "document", "name")),
    // NameLookup: every written element of an assembly forced in, each found one justified.
    contained(
      on(AssembledName, "assembly", "identifier", "node", "placements"),
      on(NameLookup, "assembly", "name", "node", "placements"),
    ),
    contained(
      on(foundNames, "assembly", "name", "node", "placements"),
      on(AssembledName, "assembly", "identifier", "node", "placements"),
    ),
    contained(on(foundNames, "node", "kind"), on(Named, "node", "kind")),
    contained(
      on(foundNames, "instance", "node", "assembly", "replaced"),
      on(InstanceName, "instance", "node", "assembly", "replaced"),
    ),
    check("E1_derived", NameLookup, (n) =>
      n.or(
        n.and(
          n.eq(n.found, true),
          n.gt(n.placements, 0n),
          n.or(
            n.and(n.eq(n.kind, itemRefKind), n.eq(n.resourceType, itemResourceType)),
            n.and(
              n.eq(n.kind, itemRefKind),
              n.ne(n.resourceType, itemResourceType),
              n.eq(n.itemDocument, n.assembly),
            ),
            n.and(
              n.ne(n.kind, itemRefKind),
              n.eq(n.resourceType, "none"),
              n.eq(n.itemDocument, n.assembly),
            ),
          ),
        ),
        n.and(
          n.eq(n.found, false),
          n.eq(n.placements, 0n),
          n.eq(n.node, n.assembly),
          n.eq(n.kind, "document"),
          n.eq(n.instance, n.assembly),
          n.eq(n.replaced, false),
          n.eq(n.itemDocument, n.assembly),
          n.eq(n.resourceType, "none"),
        ),
      ),
    ),
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
    // MappingSourceDeclaration's copy of its mapping and its target's lookup; MappingLookup's
    // mapped rows, each mapping's target forced in and each a mapping's (A34, A35).
    contained(
      on(MappingSourceDeclaration, "node", "itemRef", "source"),
      on(VariableMapping, "node", "parent", "source"),
    ),
    contained(
      on(MappingSourceDeclaration, "node", "target"),
      on(VariableMapping, "node", "target"),
    ),
    contained(
      on(MappingSourceDeclaration, "itemDocument", "target", "targetDeclared"),
      on(VariableLookup, "document", "name", "declared"),
    ),
    key(on(mappedNames, "itemRef", "name")),
    contained(on(VariableMapping, "parent", "target"), on(mappedNames, "itemRef", "name")),
    contained(on(mappedNames, "itemRef", "name"), on(VariableMapping, "parent", "target")),
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
    // Reading: its copy, its pieces, its probes, its source and its laws.
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
    contained(
      on(
        scopedReadings,
        "assembly",
        "scope",
        "found",
        "named",
        "namedKind",
        "placements",
        "replaced",
        "resourceType",
        "lookupDocument",
      ),
      on(
        NameLookup,
        "assembly",
        "name",
        "found",
        "node",
        "kind",
        "placements",
        "replaced",
        "resourceType",
        "itemDocument",
      ),
    ),
    contained(
      on(declarationReaders, "lookupDocument", "variable", "declared"),
      on(VariableLookup, "document", "name", "declared"),
    ),
    contained(
      on(mappingReaders, "named", "variable", "mapped"),
      on(MappingLookup, "itemRef", "name", "mapped"),
    ),
    contained(
      on(
        declaredReadings,
        "declaration",
        "lookupDocument",
        "variable",
        "declarationKind",
        "declCardinalities",
        "declBaseTypes",
      ),
      declarationIdentifierRef,
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
            r.eq(r.resourceType, "none"),
            r.eq(r.lookupDocument, r.assembly),
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
        r.or(readsDeclarations(r), r.eq(r.declared, false)),
        r.or(itemScoped(r), r.eq(r.mapped, false)),
        r.or(
          r.and(r.eq(r.declared, true), r.eq(r.source, "declared")),
          r.and(r.eq(r.declared, false), r.eq(r.mapped, true), r.eq(r.source, "mapped")),
          r.and(
            r.eq(r.declared, false),
            r.eq(r.mapped, false),
            builtInOfScope(r),
            r.eq(r.source, "builtIn"),
          ),
          r.and(
            r.eq(r.declared, false),
            r.eq(r.mapped, false),
            r.not(builtInOfScope(r)),
            r.eq(r.source, "none"),
          ),
        ),
        r.or(
          r.in(r.source, ["declared", "mapped"]),
          r.and(
            r.eq(r.declaration, r.lookupDocument),
            r.eq(r.declBaseTypes, 0n),
            r.eq(r.declCardinalities, 0n),
            r.or(
              r.and(r.eq(r.source, "none"), r.eq(r.declarationKind, "qti-outcome-declaration")),
              r.and(r.eq(r.source, "builtIn"), builtInKindOfScope(r)),
            ),
          ),
        ),
      ),
    ),
    // ReadingCardinality: a reading that stands for a literal, its declaration's cardinality where
    // it has one (spec reading 159), copied from its reading and its declaration.
    contained(
      on(standInReadings, "assembly", "node", "attribute", "form", "split"),
      on(ReadingCardinality, "assembly", "node", "attribute", "form", "split"),
    ),
    contained(
      on(ReadingCardinality, "assembly", "node", "attribute", "form", "split", "declaration"),
      on(Reading, "assembly", "node", "attribute", "form", "split", "declaration"),
    ),
    contained(
      on(ReadingCardinality, "declaration", "declCardinality"),
      on(DeclarationCardinality, "node", "cardinality"),
    ),
  ],
  "Item ref target": [
    // A found item ref's target and item are its `ItemRefTarget`'s and `ItemRefDocument`'s, each a
    // row only where the package holds one, so an item ref of the item type whose file the package
    // lacks is refused here under the law that refuses the item ref itself.
    contained(on(targetedItemRefs, "node", "resourceType"), on(ItemRefTarget, "node", "type")),
    contained(on(heldItemRefs, "node", "itemDocument"), on(ItemRefDocument, "node", "document")),
  ],
  "Prefixed reference": [
    key(on(resolvingReadings, "assembly", "node", "attribute")),
    contained(
      on(
        select(AssembledReference, (a) =>
          a.and(a.eq(a.role, "variable"), a.not(a.in(a.kind, setterKinds))),
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
    check("Reference_type", Reading, (r) =>
      r.or(
        r.eq(r.attribute, "identifier"),
        r.not(resolves(r)),
        r.and(
          r.in(r.source, ["declared", "mapped"]),
          r.in(r.declarationKind, ["qti-outcome-declaration", "qti-template-declaration"]),
        ),
      ),
    ),
    check("Reference_type", ReadingCardinality, (r) =>
      r.in(ValueCardinalityOf.at("value", r.declCardinality), ["single", "unknown"]),
    ),
    ...referenceBases.map((base) =>
      contained(
        on(
          select(Reading, (r) =>
            r.and(
              r.ne(r.attribute, "identifier"),
              resolves(r),
              r.in(r.source, ["declared", "mapped"]),
              r.eq(r.declBaseTypes, 1n),
              r.or(
                ...ReferenceBase.rows
                  .filter((row) => row.base === base)
                  .map(({ attribute, kind }) =>
                    r.and(r.eq(r.kind, kind), r.eq(r.attribute, attribute)),
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
        "declCardinalities",
        "declBaseTypes",
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
      on(namedReadings, "kind", "attribute", "declarationKind"),
      on(ReferenceDeclaration, "kind", "attribute", "declaration"),
    ),
  ],
  "Variable mapping source": [
    contained(on(VariableMapping, "node"), on(MappingSourceDeclaration, "node")),
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
        "declCardinalities",
        "declBaseTypes",
      ),
      declarationIdentifierRef,
    ),
    check("Variable_mapping_source", MappingSourceDeclaration, (m) =>
      m.eq(m.declarationKind, "qti-outcome-declaration"),
    ),
    // A mapped reading's declaration is its mapping's source's, so a reading through a mapping
    // whose source its item declares nothing under is refused under the mapping's law.
    contained(
      on(
        mappedReadings,
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
  ],
  "Variable mapping target": [
    key(on(MappingSourceDeclaration, "itemRef", "target")),
    check("Variable_mapping_target", MappingSourceDeclaration, (m) =>
      m.or(m.eq(m.targetDeclared, false), m.eq(m.target, m.source)),
    ),
  ],
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
    // HeldType: a setter's or a lookup's reference, and its one expression, each copied.
    key(on(heldReferences, "node")),
    contained(
      on(HeldType, "node", "kind", "baseType", "cardinality", "table"),
      on(heldReferences, "node", "kind", "baseType", "cardinality", "table"),
    ),
    contained(
      on(
        HeldType,
        "expression",
        "node",
        "expressionKind",
        "language",
        "heldBase",
        "heldCardinality",
      ),
      exprRef,
    ),
    contained(
      on(
        select(VariableRef, (v) => v.ne(v.resolution, "declared")),
        "document",
        "identifier",
      ),
      on(absentNames, "document", "name"),
    ),
    // A declaration's tables, each a row of its own keyed by the declaration, at most one of each
    // slot, and each table a reference claims, its declaration's: a slot the declaration leaves
    // empty has no row, so no reference claims it.
    key(on(Mapping, "declaration")),
    key(on(AreaMapping, "declaration")),
    key(on(LookupTable, "declaration")),
    contained(on(tableClaims("qti-mapping"), "declaration"), on(Mapping, "declaration")),
    contained(on(tableClaims("qti-area-mapping"), "declaration"), on(AreaMapping, "declaration")),
    contained(on(tableClaims("qti-match-table"), "declaration"), on(matchTables, "declaration")),
    contained(
      on(tableClaims("qti-interpolation-table"), "declaration"),
      on(interpolationTables, "declaration"),
    ),
    contained(on(claimedTables, "kind", "table"), on(TableReader, "kind", "table")),
    check("E1_derived", VariableRef, (v) =>
      v.and(
        spells(v),
        resolvedType(v),
        tableClaimed(v),
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
        "table",
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
        "table",
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
    contained(
      on(
        select(PlacedVariableRef, (v) => v.ne(v.resolution, "declared")),
        "assembly",
        "identifier",
      ),
      on(absentNames, "document", "name"),
    ),
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
                  Compute.matches(x.lexical, integerMathOperators),
                  x.eq(x.baseType, "integer"),
                ),
                x.and(
                  x.not(Compute.matches(x.lexical, integerMathOperators)),
                  x.eq(x.baseType, "float"),
                ),
              ),
            ),
            x.eq(x.attribute, "weight-identifier"),
          ),
        ),
        x.and(
          x.eq(x.written, false),
          x.eq(x.attribute, "base-type"),
          x.eq(x.kind, "qti-test-variables"),
          x.eq(x.lexical, ""),
          x.eq(x.baseType, "unknown"),
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
    check("Lookup_type", VariableRef, (v) =>
      v.or(
        v.ne(v.attribute, "identifier"),
        v.ne(v.kind, lookupKindHandle),
        v.ne(v.resolution, "declared"),
        v.in(v.table, ["qti-match-table", "qti-interpolation-table"]),
      ),
    ),
    check("Lookup_type", HeldType, (h) =>
      h.or(
        h.ne(h.kind, lookupKindHandle),
        h.and(
          h.in(h.heldCardinality, ["single", "unknown"]),
          h.in(h.heldBase, ["duration", "float", "integer", ...silentBases]),
          h.or(h.ne(h.table, "qti-match-table"), h.in(h.heldBase, ["integer", ...silentBases])),
        ),
      ),
    ),
  ],
  "Mapped response": [
    check("Mapped_response", VariableRefDeclaration, (d) =>
      d.or(
        d.ne(d.attribute, "identifier"),
        d.not(d.in(d.kind, ["qti-map-response", "qti-map-response-point"])),
        d.and(
          d.eq(d.declarationKind, "qti-response-declaration"),
          d.or(
            d.and(d.eq(d.kind, "qti-map-response"), d.eq(d.table, "qti-mapping")),
            d.and(
              d.eq(d.kind, "qti-map-response-point"),
              d.eq(d.table, "qti-area-mapping"),
              d.in(d.baseType, ["point", ...silentBases]),
            ),
          ),
        ),
      ),
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
  "Set type": [
    check("Set_type", HeldType, (h) =>
      h.or(
        h.not(h.in(h.kind, setKindHandles)),
        h.and(
          h.or(
            h.eq(h.heldBase, h.baseType),
            h.in(h.heldBase, silentBases),
            h.in(h.baseType, silentBases),
          ),
          h.or(
            h.eq(h.heldCardinality, h.cardinality),
            h.eq(h.heldCardinality, "unknown"),
            h.eq(h.cardinality, "unknown"),
          ),
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
        "declCardinalities",
        "declBaseTypes",
      ),
      declarationIdentifierRef,
    ),
    check("Variable_declared", VariableRef, (v) =>
      v.or(
        v.not(v.in(v.rootKind, [itemKind, testKind])),
        v.ne(v.resolution, "unresolved"),
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
        "declCardinalities",
        "declBaseTypes",
      ),
      declarationIdentifierRef,
    ),
    check("Variable_declared", PlacedVariableRef, (v) =>
      v.or(v.ne(v.rootKind, itemKind), v.ne(v.resolution, "unresolved")),
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
      x.or(x.ne(x.attribute, "weight-identifier"), x.in(x.baseType, ["float", "unknown"])),
    ),
  ],
} as const;

/**
 * {@link expressionLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const expressionLaws = [...Object.values(expressionLawsByName).flat(), ...referenceLaws];
