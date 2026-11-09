/**
 * The rosters and closed relations expression typing reads (plan §1.7 O4; the W5 amendment's C6,
 * C16 and C17; the orchestrator's rulings for Q5.10 of 2026-11-06): each a generator's rows from
 * `#pantry/grammar/expression.ts`, declared here beside the laws that read them rather than in
 * `install.ts`, which stays Q5.02's.
 *
 * `ValueBase` and `ValueCardinality` are expression-typing codes, distinct from the declaration
 * codes `BaseType` and `Cardinality` that `Declaration` holds: an expression's value may also be of
 * `any` base type (`qti-null`) or of a type no declaration says (`unknown`). `ValueBaseOf` and
 * `ValueCardinalityOf` name the mapping from the declaration codes onto them.
 *
 * A singleton set is a diagonal's row (C6): `ValueBaseBit.row(b)` is {b}, and ∅ for `any`, so a
 * `qti-null` operand sets no bit; `ValueCardinalityBit.row(c)` is {c}, and ∅ for `unknown`. A key
 * holds no set (C16), so each per-kind operand rule is a set relation keyed (kind, code) and read
 * by `.row(kind)`.
 */
import { closed, closedId, Compute } from "@bjornpagen/grizzle";

import { openDomain } from "#pantry/grammar/attributes.ts";
import type { Kind } from "#pantry/grammar/compose.ts";
import {
  conditionKinds,
  kindsTyped,
  languages,
  lookupKind,
  operandBaseRows,
  placeCardinalityRows,
  referenceBaseRows,
  referencedTables,
  tableReaders,
  resolutions,
  resultBaseRows,
  resultCardinalityRows,
  rpTemplates,
  setKinds,
  spelledPattern,
  valueBases,
  valueCardinalities,
} from "#pantry/grammar/expression.ts";
import type { ExpressionTyping } from "#pantry/grammar/expression.ts";
import {
  anyText,
  AttributeName,
  BaseType,
  Cardinality,
  DeclarationKind,
  NodeKind,
  ValueDomainOf,
} from "#pantry/grammar/install.ts";
import type { ValueDomain } from "#pantry/grammar/install.ts";
import {
  processingReferences,
  rootLanguages,
  typings,
  valueBaseOf,
  valueCardinalityOf,
  kindOf,
  nameOf,
  referenceDeclarations,
} from "#pantry/vocab/terms/expression-types.ts";

/**
 * The `ValueBase` roster: the base types an expression's value is typed with (`valueBases`).
 */
export const ValueBase = closed("ValueBase", valueBases);

/**
 * The `ValueCardinality` roster: the cardinalities an expression's value is typed with.
 */
export const ValueCardinality = closed("ValueCardinality", valueCardinalities);

/**
 * The `Language` roster: the processing language an expression or a rule is written in.
 */
export const Language = closed("Language", languages);

/**
 * The `ReferenceResolution` roster: how a processing reference names its variable (named apart
 * from RG4's per-reference `Resolution` family).
 */
export const ReferenceResolution = closed("ReferenceResolution", resolutions);

/**
 * The `ReferencedTable` roster: the table a reference needs its declaration to hold.
 */
export const ReferencedTable = closed("ReferencedTable", referencedTables);

/**
 * `TableReader`: (kind, table), the table a processing reference of each kind reads of its
 * variable's declaration (`tableReaders` of `#pantry/grammar/expression.ts`).
 */
export const TableReader = closed.relation(
  "TableReader",
  { kind: closedId(NodeKind), table: closedId(ReferencedTable) },
  ["kind", "table"],
  tableReaders.map(({ kind, table }) => ({ kind: kindOf(kind), table })),
);

/**
 * The `RpTemplate` roster: the response processing templates 1EdTech publishes, and `none`.
 */
export const RpTemplate = closed("RpTemplate", rpTemplates);

/**
 * The forms a test-level reference is read in (spec reading 48; `representation-gaps.md` §4.3), in
 * code order: `unsplit`, the test's own variable of the whole identifier; `split`, a scope (an item
 * ref, test part, section or section ref) and its variable, at one dot; `numbered`, an item ref, an
 * instance number and its variable, at two dots (reading 88); and `name`, the whole identifier as a
 * name of the assembled test, the one reading a `section-identifier` has (the UP audit's A61).
 */
export const readingForms = ["unsplit", "split", "numbered", "name"] as const;

/**
 * The `ReadingForm` roster.
 */
export const ReadingForm = closed("ReadingForm", readingForms);

/**
 * What a reading's variable is, in code order: `none`, no variable of its scope; `declared`, a
 * declaration of the scope's document (the test's for an unsplit reading, the item's for an item
 * ref); `mapped`, an item ref's variable mapping target (information model §7.48); `builtIn`, a
 * built-in variable of the scope (§2.2.2, §2.2.2.1; spec reading 29); `link`, a name read through a
 * found item ref that names an LTI link, which has no declarations, no template variables and no
 * mappings' sources to resolve it against, so it is accepted unchecked (spec reading 110). `link`
 * comes last, so the codes the snapshot holds keep their handles.
 */
export const readingSources = ["none", "declared", "mapped", "builtIn", "link"] as const;

/**
 * The `ReadingSource` roster.
 */
export const ReadingSource = closed("ReadingSource", readingSources);

/**
 * What a test-level reference names, in code order: `variable`, a variable, read in every form; and
 * `section`, a section of the assembled test, by a `section-identifier`.
 */
export const referenceRoles = ["variable", "section"] as const;

/**
 * The `ReferenceRole` roster.
 */
export const ReferenceRole = closed("ReferenceRole", referenceRoles);

// Diagonals and mappings (C6, C17).

/**
 * `ValueBaseBit`: the diagonal of `ValueBase` without `any`, so `ValueBaseBit.row(b)` is the
 * operand bit of base type b: {b}, and ∅ for `qti-null`'s `any`.
 */
export const ValueBaseBit = closed.relation(
  "ValueBaseBit",
  { base: closedId(ValueBase), bit: closedId(ValueBase) },
  ["base", "bit"],
  valueBases.filter((base) => base !== "any").map((base) => ({ base, bit: base })),
);

/**
 * `ValueCardinalityBit`: the diagonal of `ValueCardinality` without `unknown`, so an operand of no
 * known cardinality sets no bit.
 */
export const ValueCardinalityBit = closed.relation(
  "ValueCardinalityBit",
  { bit: closedId(ValueCardinality), cardinality: closedId(ValueCardinality) },
  ["cardinality", "bit"],
  valueCardinalities
    .filter((cardinality) => cardinality !== "unknown")
    .map((cardinality) => ({ bit: cardinality, cardinality })),
);

/**
 * `ValueBaseOf`: base type → value, each declaration base type as the expression-typing base type
 * a reference to its variable has.
 */
export const ValueBaseOf = closed.relation(
  "ValueBaseOf",
  { baseType: closedId(BaseType), value: closedId(ValueBase) },
  ["baseType"],
  BaseType.handles.map((baseType) => ({ baseType, value: valueBaseOf(baseType) })),
);

/**
 * `ValueCardinalityOf`: cardinality → value, each declaration cardinality as its expression-typing
 * code, itself where `ValueCardinality` spells it.
 */
export const ValueCardinalityOf = closed.relation(
  "ValueCardinalityOf",
  { cardinality: closedId(Cardinality), value: closedId(ValueCardinality) },
  ["cardinality"],
  Cardinality.handles.map((cardinality) => ({
    cardinality,
    value: valueCardinalityOf(cardinality),
  })),
);

/**
 * `ValueBaseForm`: base → pattern, the lexical forms of a `base-type` attribute that spell each of
 * QTI's eleven base types, which proves an expression's written code (C17). `any` and `unknown`
 * have no row: no lexical form spells them.
 */
export const ValueBaseForm = closed.relation(
  "ValueBaseForm",
  { base: closedId(ValueBase), pattern: anyText },
  ["base"],
  valueBases
    .filter((base) => base !== "any" && base !== "unknown")
    .map((base) => ({ base, pattern: spelledPattern(base) })),
);

/**
 * The lexical forms of a `base-type` attribute that spell any of QTI's eleven base types, the
 * forms {@link ValueBaseForm}'s rows match, as one pattern: a form that matches it spells a base,
 * and one that does not spells none (C17), so its expression's base type is `unknown`. Each base is
 * a word of letters, which a pattern reads as written.
 */
export const spelledBasesPattern = Compute.pattern<string>(
  `^(?:${valueBases.filter((base) => base !== "any" && base !== "unknown").join("|")})$`,
);

/**
 * An NCName's first character: XML 1.0's `NameStartChar` without the colon, as a pattern's class
 * body.
 *
 * @see {@link https://www.w3.org/TR/xml-names/#NT-NCName | Namespaces in XML 1.0, NCName}
 */
const ncStart =
  "A-Z_a-z\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2FF}\\u{370}-\\u{37D}\\u{37F}-\\u{1FFF}\\u{200C}-\\u{200D}\\u{2070}-\\u{218F}\\u{2C00}-\\u{2FEF}\\u{3001}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFFD}\\u{10000}-\\u{EFFFF}";

/**
 * An NCName's later characters: XML 1.0's `NameChar` without the colon.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-NameChar | XML 1.0, NameChar}
 */
const ncChar = `\\-.0-9\\u{B7}\\u{300}-\\u{36F}\\u{203F}-\\u{2040}${ncStart}`;

/**
 * The base types whose values a value domain's pattern judges, and that domain: QTI's base types
 * that are XML Schema's types, as `ValueDomainOf` compiles them with their `whiteSpace` collapse,
 * so outer whitespace is formatting (spec reading 7).
 *
 * - `integer`: `xs:integer`, unbounded (spec reading 45).
 * - `float` and `duration`: `xs:double` (information model §8.13: a duration is "represented as a
 *   single float that records time in seconds ... using the 'xsd:double' datatype").
 * - `identifier`: QTI's identifier class, `IdentifierDType`.
 * - `uri`: `xs:anyURI` (spec reading 71).
 *
 * Stated with Q5.08's `Typed_value` law, whose single source this module is.
 */
export const domainValues = [
  { baseTypes: ["integer"], domain: "xs:integer" },
  { baseTypes: ["float", "duration"], domain: "xs:double" },
  { baseTypes: ["identifier"], domain: "IdentifierDType" },
  { baseTypes: ["uri"], domain: "xs:anyURI" },
] as const satisfies readonly {
  readonly baseTypes: readonly (typeof BaseType.handles)[number][];
  readonly domain: (typeof ValueDomain.handles)[number];
}[];

/**
 * The pattern of a boolean value's text: `true` or `false` (spec reading 34; `xs:boolean`'s `1`
 * and `0` are refused), outer whitespace formatting (spec reading 7).
 */
export const booleanValuePattern = "^[\\t\\n\\r ]*(?:true|false)[\\t\\n\\r ]*$";

/**
 * The pattern of a point value's text: two integers, x then y (information model §8.13),
 * separated by one whitespace character, the space `xs:normalizedString` reads it as.
 */
export const pointValuePattern =
  "^[\\t\\n\\r ]*[+\\-]?[0-9]+[\\t\\n\\r ][+\\-]?[0-9]+[\\t\\n\\r ]*$";

/**
 * The pattern of a pair's or a directed pair's text: two identifiers (information model §8.13),
 * separated by one whitespace character.
 */
export const pairValuePattern = `^[\\t\\n\\r ]*[${ncStart}][${ncChar}]*[\\t\\n\\r ][${ncStart}][${ncChar}]*[\\t\\n\\r ]*$`;

/**
 * The base types every text is a value of: `string`, whose whitespace is part of the value
 * (spec reading 7), and `file`, whose octets and content type no text of a value spells.
 */
export const unjudgedBaseTypes = [
  "string",
  "file",
] as const satisfies readonly (typeof BaseType.handles)[number][];

/**
 * The pattern each base type's values take as written: its domain's installed `ValueDomainOf`
 * pattern ({@link domainValues}), boolean's, point's and the pairs' own, and every text for the
 * {@link unjudgedBaseTypes}.
 *
 * @param baseType - The base type.
 * @returns Its pattern.
 * @throws {Error} When a domain {@link domainValues} names is not installed, which the vocabulary
 *   list decides.
 */
const patternOfBaseType = (baseType: (typeof BaseType.handles)[number]): string => {
  const domain = domainValues.find(({ baseTypes }) =>
    baseTypes.some((judged) => judged === baseType),
  )?.domain;
  if (domain !== undefined) {
    const installed = ValueDomainOf.rows.find((row) => row.domain === domain)?.pattern;
    if (installed === undefined) {
      throw new Error(
        `BaseTypePattern reads the value domain ${domain}, which ValueDomainOf does not install. Name an installed domain in domainValues.`,
      );
    }

    return installed;
  }

  switch (baseType) {
    case "boolean": {
      return booleanValuePattern;
    }
    case "point": {
      return pointValuePattern;
    }
    case "pair":
    case "directedPair": {
      return pairValuePattern;
    }
    default: {
      return openDomain.pattern;
    }
  }
};

/**
 * `BaseTypePattern`: base type → pattern, the lexical form a value of each base type takes as
 * written ({@link patternOfBaseType}), total over `BaseType` so `.at` reads every row. Q5.08's
 * `qti-value` text (`Typed_value`), Q5.11's map keys and this module's `qti-base-value` text
 * (`Literal_lexical`) are judged by it, one language per base type.
 */
export const BaseTypePattern = closed.relation(
  "BaseTypePattern",
  { baseType: closedId(BaseType), pattern: anyText },
  ["baseType"],
  BaseType.handles.map((baseType) => ({ baseType, pattern: patternOfBaseType(baseType) })),
);

// The per-kind typing (C16).

/**
 * `OperandBase`: the set of (kind, base) where an operand of an expression of the kind may be of
 * the base type, `unknown` always among them (P23).
 */
export const OperandBase = closed.relation(
  "OperandBase",
  { base: closedId(ValueBase), kind: closedId(NodeKind) },
  ["kind", "base"],
  operandBaseRows(typings).map(({ base, kind }) => ({ base, kind: kindOf(kind) })),
);

/**
 * `LeadCardinality`: the set of (kind, cardinality) an expression's first operand may have (P23).
 */
export const LeadCardinality = closed.relation(
  "LeadCardinality",
  { cardinality: closedId(ValueCardinality), kind: closedId(NodeKind) },
  ["kind", "cardinality"],
  placeCardinalityRows(typings, "lead").map(({ cardinality, kind }) => ({
    cardinality,
    kind: kindOf(kind),
  })),
);

/**
 * `TailCardinality`: the set of (kind, cardinality) an expression's later operands may have (P23).
 */
export const TailCardinality = closed.relation(
  "TailCardinality",
  { cardinality: closedId(ValueCardinality), kind: closedId(NodeKind) },
  ["kind", "cardinality"],
  placeCardinalityRows(typings, "tail").map(({ cardinality, kind }) => ({
    cardinality,
    kind: kindOf(kind),
  })),
);

/**
 * `ResultBase`: the set of (kind, base) an expression of the kind may be typed with.
 */
export const ResultBase = closed.relation(
  "ResultBase",
  { base: closedId(ValueBase), kind: closedId(NodeKind) },
  ["kind", "base"],
  resultBaseRows(typings).map(({ base, kind }) => ({ base, kind: kindOf(kind) })),
);

/**
 * `ResultCardinality`: the set of (kind, cardinality) an expression of the kind may be typed with.
 */
export const ResultCardinality = closed.relation(
  "ResultCardinality",
  { cardinality: closedId(ValueCardinality), kind: closedId(NodeKind) },
  ["kind", "cardinality"],
  resultCardinalityRows(typings).map(({ cardinality, kind }) => ({
    cardinality,
    kind: kindOf(kind),
  })),
);

/**
 * `ReferenceDeclaration`: the set of (kind, attribute, declaration) where an element of the kind
 * may name, by the attribute, a variable of that declaration kind ({@link referenceDeclarations}:
 * each processing element's `identifier`; a literal's stand-in is P24's, `ReferenceBase`'s).
 */
export const ReferenceDeclaration = closed.relation(
  "ReferenceDeclaration",
  {
    attribute: closedId(AttributeName),
    declaration: closedId(DeclarationKind),
    kind: closedId(NodeKind),
  },
  ["kind", "attribute", "declaration"],
  referenceDeclarations.flatMap(({ declarations, kind }) =>
    declarations.map((declaration) => ({ attribute: nameOf("identifier"), declaration, kind })),
  ),
);

/**
 * `ReferenceBase`: (kind, attribute) → base, the base type a variable named in place of a literal
 * must have, single (P24).
 */
export const ReferenceBase = closed.relation(
  "ReferenceBase",
  { attribute: closedId(AttributeName), base: closedId(ValueBase), kind: closedId(NodeKind) },
  ["kind", "attribute"],
  referenceBaseRows(processingReferences).map(({ attribute, base, kind }) => ({
    attribute: nameOf(attribute),
    base,
    kind: kindOf(kind),
  })),
);

// Handle lists (C8): membership is `Compute.in`, so these sets are lists, never installed.

/**
 * The roots alone.
 */
export const rootKinds: readonly Kind[] = rootLanguages.map(([kind]) => kind);

/**
 * The rules whose expression is a condition (P21).
 */
export const conditionKindHandles: readonly Kind[] = conditionKinds.map(kindOf);

/**
 * The rules that set their variable to their expression's value (P20).
 */
export const setKindHandles: readonly Kind[] = setKinds.map(kindOf);

/**
 * The lookup rule (P22).
 */
export const lookupKindHandle: Kind = kindOf(lookupKind);

/**
 * The rules whose expression's type a law compares with their variable's: the setters and the
 * lookup.
 */
export const heldKinds: readonly Kind[] = [...setKindHandles, lookupKindHandle];

/**
 * The kinds of one typing.
 *
 * @param typing - The typing.
 * @returns Its kinds.
 */
const typed = (typing: ExpressionTyping["typing"]): readonly Kind[] =>
  kindsTyped(typings, typing).map(kindOf);

/**
 * The kinds typed as the variable they name (Variable, Default, Correct).
 */
export const declaredKinds = typed("declared");

/**
 * The numeric aggregates (Sum, Product, Subtract, Min, Max).
 */
export const numericKinds = typed("numeric");

/**
 * The container constructors (Multiple, Ordered, Repeat).
 */
export const containerKinds = typed("container");

/**
 * The kinds typed as their one operand's base type (Index, Random).
 */
export const firstKinds = typed("first");

/**
 * The kinds typed as their second operand (Delete).
 */
export const secondKinds = typed("second");

/**
 * The kinds whose operands share one base type, unknowns aside.
 */
export const oneBaseKinds: readonly Kind[] = typings
  .filter(({ oneBase }) => oneBase)
  .map(({ kind }) => kindOf(kind));

/**
 * The kinds whose operands share one cardinality, unknowns aside.
 */
export const oneCardinalityKinds: readonly Kind[] = typings
  .filter(({ oneCardinality }) => oneCardinality)
  .map(({ kind }) => kindOf(kind));

/**
 * The kinds only outcome processing admits (P25).
 */
export const outcomeOnlyKinds: readonly Kind[] = typings
  .filter(({ outcomeOnly }) => outcomeOnly)
  .map(({ kind }) => kindOf(kind));
