/**
 * Interactions and their bindings: the O3 overlays (plan §1.7; the W5 amendment's C15, C17, C18 and
 * C22 and its D entry for Q5.09; the tier-1 addendum's G-match, G-parse and "Text in keys"; the
 * orchestrator's answers of 2026-11-06).
 *
 * Every attribute an O3 law reads is copied once, from one selection of `Attribute`, into
 * {@link InteractionAttribute}, keyed by its element's place and its name, with its lexical form
 * and its value, the form collapsed (`Compute.collapse`, XML Schema Part 2 §4.3.6). Every
 * identifier, count, number and flag these laws read is an atomic XSD type whose whiteSpace is
 * `collapse` (spec reading 7: "An attribute the XSD itself types ... is read as the XSD reads it,
 * outer whitespace collapsed"), so the value is the form its type's lexical space is read on, the
 * one `DeclarationIdentifier.identifier` holds. The copy claims no type of it: a value with
 * whitespace inside (`max-choices="1 2"`) is in no such type's lexical space, and its value domain
 * alone refuses it. One selection of `Attribute` costs one UNIQUE on it (the addendum's "Text in
 * keys"), so the overlays below read `InteractionAttribute` and never `Attribute`.
 *
 * Every row is keyed by QTI's own identity (lane IDENTITY's contract): an element by its place,
 * `(package, path, start)`, its package's manifest identifier, its document's path in the package
 * and its pre-order position there; a link inside one document by the target's `start` alone
 * (`parent`, `nearest`, `declaration`); and an instance of an assembly by `(package, assembly,
 * instance)`, its assembly's head document's path and its position in that assembly's instance
 * tree (`Instance`). A placed row reads its declaration in the assembly's head document, at
 * `(package, assembly, declaration)`, and names its element in the instance's document, `path`, at
 * `start`; the instance names its document, so a placed row's key holds no `path`.
 *
 * - {@link Interaction}: every interaction element, in every document, owning its choices'
 *   {@link ChoiceInteraction} rows as a counted family (C15), and its gaps' {@link GapInteraction}
 *   rows as another, which "Binding cardinality" reads (spec reading 169). A stimulus body holds
 *   interactions too (information model §5.137, StimulusBody: "The stimulus body contains the text,
 *   graphics, media objects and interactions"), so the item-only laws read {@link BoundVariable}.
 * - {@link Binding}: every interaction with a `response-identifier`, its optional part: an
 *   interaction that writes none has no row, and AL3 refuses it.
 * - {@link PciModuleForm}: each form in which a portable custom interaction names its module, its
 *   `module` attribute and its `qti-interaction-modules` child, counted by
 *   `Interaction.moduleForms` so that "PCI module source" asks for at least one (§5.106.2, R10-a).
 * - {@link BoundVariable}: each attribute by which an item's interaction binds a response variable,
 *   its `response-identifier` and its `string-identifier` (§5.48.2, §5.162.3: "binding the
 *   interaction to a second response variable (of base-type string)"), and beside it, where a
 *   response declaration of the item holds the name, its {@link BindingDeclaration}: the variable's
 *   declaration, through `declarationIdentifierRef`, whatever its cardinality spells (spec reading
 *   159). A binding with none is "Binding declared"'s (lane NIL's audit, B1: a missing value is a
 *   row of its own relation, never a sentinel). The fit laws read the declaration's cardinality
 *   from the binding's {@link BindingCardinality}, which a declaration with no cardinality leaves
 *   the binding none of, so they judge only a variable whose cardinality spells a code.
 *   `key(document, identifier)` is "Binding unique" (reading 92: "Each response variable declared
 *   may be bound to one and only one interaction"), so an interaction whose string identifier is
 *   its response identifier, the old `string-identifier-distinct`, breaks that key.
 * - {@link Choice}: every choice, with its identifier distinct among its document's choices of its
 *   kind, and its {@link ChoiceInteraction}, its nearest interaction (N8) (§5.132.1 and the other
 *   choice classes': "This identifier must not be used by any other choice or item variable"; spec
 *   reading 104: the item is the scope, as §7.16 reads an identifier, "a logical reference to
 *   another object in the item, such as an itemVariable or choice"). Across the classes, a key over
 *   the query `ChoiceOrHottext` (`#pantry/qti/queries.ts`) holds it distinct among every choice and
 *   hottext of its document.
 * - {@link Hottext}: every hottext, its nearest interaction's kind, so a hottext interaction's
 *   hottexts are its choices; elsewhere a hottext is valid and owned by none (reading 38). Its
 *   identifier is distinct among its document's hottexts (§5.65.1, reading 104), and among its
 *   document's choices by that key.
 * - **choice names**, rules over queries (`#pantry/qti/queries.ts`): the nine choice classes share
 *   one space of identifiers, a name borne by one choice or hottext of a document or its assembly
 *   and by no other ("Choice identifier key"), and a choice's identifier is no item variable's: no
 *   declaration's of its document, and in an item no built-in variable's (reading 104, "Choice not
 *   variable").
 * - {@link Hotspot}: the hotspot choices and associable hotspots, their shape, and their element
 *   ranks beside their parent's element count, through `nodeCounts` (reading 80).
 * - {@link CountBound}: every element whose counts `ChoiceBound` pairs, and whether it writes each;
 *   its least and most, where each has a value, written as an integer or its XSD default, typed by
 *   G-parse ({@link LeastCount}, {@link MostCount}, and {@link CountRange} where both have one);
 *   "Choice bounds" (readings 18 and 76) and "Binding cardinality" (reading 92) read the values,
 *   and `max-strings-required` (reading 19) whether `max-strings` is written.
 * - {@link Slider} (reading 9, the Schematron's 14Ba), {@link AriaRange} (§5.2.31: "Authors MUST
 *   ensure the value of 'aria-valuemax' is greater than or equal to the value of 'aria-valuemin'"),
 *   and {@link ItemMode}, an item's `adaptive`, which "AdaptiveFeedback" reads (§5.49, §5.52: "A
 *   feedback element that forms part of a Non-adaptive Item must not contain an interaction object,
 *   either directly or indirectly").
 * - The content references: {@link FeedbackRef}, {@link TemplateRef}, {@link PrintedVariableRef} (a
 *   printed variable's name, and its `base` or `index` where that names a variable) and
 *   {@link ContextRef}, each naming a declaration of a kind `ContentReference` allows, its row of
 *   its own ({@link FeedbackRefDeclaration} and the others), through `declarationIdentifierRef`
 *   whatever its cardinality spells (spec reading 159), or a built-in variable that stands as one
 *   (reading 77), in an item's or a test's own declarations (the port audit's A43 and A44), each
 *   built-in one its root holds (spec reading 29: an item's `completionStatus` is no test's), so
 *   each reference carries the root kind it resolves under. A reference that names neither has no
 *   declaration row, and its law refuses it (lane NIL's NS2: never a sentinel).
 * - A section document's feedback, printed and template variables ({@link SectionFeedbackName},
 *   {@link SectionPrintedName}, {@link SectionTemplateName}) resolve once per test that places it
 *   ({@link SectionFeedbackRef}, {@link SectionPrintedRef}, {@link SectionTemplateRef}, A45 and
 *   spec reading 5, each with its declaration row where it names a declaration, as an own reference
 *   has), every one of them under each placement ({@link SectionScope}, whose counts of resolutions
 *   are its document's counts of references, {@link ReferringDocument}). A test declares no
 *   template variable, so a section document's template reference names none, and "Template
 *   reference" refuses it as it refuses the test's own (§2.7.2). An included fragment's feedback,
 *   printed, template and context variables ({@link SectionContextName}) resolve so once per
 *   placement in each item or test that places it, a test placing it where the test or a section
 *   document splices it (spec reading 117), the same relations holding them: a fragment declares
 *   nothing, as a section does.
 *
 * A row a builder gets wrong is refused, never accepted: each overlay's element is its place's,
 * through `nodeRef`, and of its kinds, and each value that relaxes a law (a count written, an item
 * adaptive) is proved both ways.
 *
 * Every check is named by its oracle law (`#pantry/test/oracle.ts` `LawName`) with spaces written
 * as underscores, since a check's name is an identifier; no law name holds an underscore. Every
 * other law is a key or a containment, which grizzle names by its sides (C22).
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Main2p4 | QTI 3.0 information model, §2.4 Interactions}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  counted,
  decimalText,
  drawn,
  fin,
  generated,
  key,
  lexicalForm,
  mirrors,
  natural,
  on,
  pg,
  relation,
  select,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { Option, pipe, Record as Rec } from "effect";
import {
  AttributeName,
  BaseType,
  BindingFit,
  BuiltInVariable,
  Cardinality,
  ChoiceBound,
  ChoiceCount,
  ContentReference,
  DeclarationKind,
  Enters,
  interactionKinds,
  lastWhereRules,
  NodeKind,
  RecordBindingFit,
  SchemaVersion,
  versions,
} from "#pantry/grammar/install.ts";
import { booleanTrue, ncNamePattern } from "#pantry/grammar/domains.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import {
  DeclarationBaseType,
  DeclarationCardinality,
  declarationIdentifierRef,
  doublesInOrder,
} from "#pantry/qti/declarations.ts";
import { EntryPath, keyText, ManifestIdentifier } from "#pantry/qti/limits.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";
import { Instance, itemInstances } from "#pantry/qti/tests.ts";

import {
  adaptiveName,
  ariaNames,
  bindingAttributes,
  choiceKinds,
  countDefault,
  gapKind,
  hotspotKinds,
  hottextKind,
  modulesKind,
  pciKind,
  readAttributes,
  references,
  referringRoots,
  sliderKind,
  extendedTextKind,
} from "#pantry/vocab/terms/interactions.ts";
import { itemKind } from "#pantry/vocab/terms/tests.ts";

/**
 * A `NodeKind` handle.
 */
type Kind = (typeof NodeKind.handles)[number];

/**
 * An `AttributeName` handle.
 */
type Name = (typeof AttributeName.handles)[number];

/**
 * A collapsed value that names a variable: an NCName (`ncNamePattern`), the lexical space of each
 * reference attribute's `IdentifierDType` and of the `VariableStringDType` member of a printed
 * variable's `base` and `index`. Any other value names nothing, an integer of `base` or `index`
 * among them, and its value domain refuses it alone (spec reading 152).
 */
const namePattern = Compute.pattern<string>(`^${ncNamePattern}$`);

/**
 * The hottext interaction's kind: the one interaction whose hottexts are its choices.
 */
export const hottextInteraction = "qti-hottext-interaction" satisfies Kind;

/**
 * The graphic gap match interaction, whose hotspots have no default (reading 80, §5.60.9: "The
 * default hotspot must not be defined").
 */
export const graphicGapMatch = "qti-graphic-gap-match-interaction" satisfies Kind;

/**
 * The `shape` of a default hotspot, the area that holds every point no other area holds, as
 * `ShapeDType` spells it.
 */
const defaultArea = "default";

/**
 * A feedback block, the kind whose `Enters` row is the feedback flag `fb` alone, which every
 * feedback element (`qti-feedback-block`, its template form, `qti-feedback-inline`) enters.
 */
const feedbackKind = "qti-feedback-block" satisfies Kind;

/**
 * The interactions whose response cardinality their most count decides, spec reading 92: "If
 * max-choices is greater than 1 (or 0) then the interaction must be bound to a response with
 * multiple cardinality", of the `max-choices` of the choice (§5.30.2), hottext (§5.66.1), hotspot
 * (§5.68.2), position object (§5.107.3) and select point (§5.128.2) interactions, and the same
 * sentence of `max-associations` on the associate (§5.8.2), gap match (§5.57.3), graphic associate
 * (§5.59.2), graphic gap match (§5.60.2) and match (§5.89.2) interactions. A gap match's gaps
 * decide it too ({@link gapMatchKind}, spec reading 169).
 */
export const cardinalityKinds = [
  "qti-choice-interaction",
  "qti-hottext-interaction",
  "qti-hotspot-interaction",
  "qti-position-object-interaction",
  "qti-select-point-interaction",
  "qti-associate-interaction",
  "qti-gap-match-interaction",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-match-interaction",
] as const satisfies readonly Kind[];

/**
 * The gap match interaction's kind, whose response cardinality its count of gaps decides beside its
 * most, spec reading 169: "The GapMatchInteraction must be bound to a response variable with
 * base-type directedPair and either single or multiple cardinality, depending on the number of
 * gaps" (§5.57). Each gap takes a pair of its own and a single response holds one pair, so a gap
 * match with two or more gaps binds a response of multiple cardinality.
 */
const gapMatchKind = "qti-gap-match-interaction" satisfies Kind;

/**
 * The interactions of any response type: those neither `BindingFit` nor `RecordBindingFit` names,
 * the custom, portable custom and order interactions, whose class descriptions (§5.36, §5.106 and
 * §5.97) state no binding, so each binds a declared response variable of any base type and
 * cardinality (reading 75 binds them all; spec reading 172 the order interaction).
 */
export const anyTypeKinds: readonly Kind[] = interactionKinds.filter(
  (kind) =>
    !BindingFit.rows.some((row) => row.kind === kind) &&
    !RecordBindingFit.rows.some((row) => row.kind === kind),
);

/**
 * The kinds whose counts `ChoiceBound` pairs, in its row order.
 */
export const boundKinds: readonly Kind[] = ChoiceBound.rows.map(({ kind }) => kind);

/**
 * The attributes of the least counts `ChoiceBound` names, each once.
 */
const minNames: readonly Name[] = [...new Set(ChoiceBound.rows.map(({ min }) => min))];

/**
 * The attributes of the most counts `ChoiceBound` names, each once.
 */
const maxNames: readonly Name[] = [...new Set(ChoiceBound.rows.map(({ max }) => max))];

/**
 * The kinds whose choices bound both of their counts (reading 18), `ChoiceCount`'s keys.
 */
const choiceCountKinds: readonly Kind[] = ChoiceCount.rows.map(({ kind }) => kind);

/**
 * The portable custom interaction's template variable kind (§7.38.1), the one element that names a
 * template variable without stating its type: "Template variable type" leaves it free.
 */
const templateVariableKind = "qti-template-variable" satisfies Kind;

/**
 * An attribute an O3 law reads, keyed by its element's place (`package`, `path`, `start`) and its
 * name: the element's kind and its document's root kind, the lexical form as written (C18's copy),
 * and `value`, that form collapsed (XML Schema Part 2, §4.3.6, as `SsmlAttribute`'s is), which the
 * database derives, whatever the form: a value with whitespace inside is held as its type's
 * whiteSpace reads it, and is no value of its type, which its value domain refuses alone.
 *
 * Copied text is `keyText` (`#pantry/qti/limits.ts`): the lexical form and the value each sit in a
 * containment's index, and a longer value is refused under the schema's one limit law.
 */
export const InteractionAttribute = relation.generated(
  "InteractionAttribute",
  {
    kind: closedId(NodeKind),
    lexical: keyText,
    name: closedId(AttributeName),
    package: ManifestIdentifier,
    path: EntryPath,
    rootKind: closedId(NodeKind),
    start: natural,
  },
  ["package", "path", "start", "name"],
  (v) => ({ value: generated(keyText, Compute.cast(Compute.collapse(v.lexical), keyText)) }),
);

/**
 * An interaction element, in any document, keyed by its place: its {@link nodeRef} tuple and its
 * count of {@link ChoiceInteraction} rows, the choices whose nearest interaction it is, which the
 * family draws, and its count of {@link PciModuleForm} rows, the forms of a portable custom
 * interaction's module, which the second family draws, and its count of {@link GapInteraction} rows,
 * the gaps among its choices, which the third family draws. Every interaction has one, whether or
 * not it writes a `response-identifier`, so its choices' family always has its owner and a missing
 * response identifier is AL3's alone.
 */
export const Interaction = relation(
  "Interaction",
  {
    choices: drawn(natural),
    gaps: drawn(natural),
    kind: closedId(NodeKind),
    moduleForms: drawn(natural),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * That an interaction writes a `response-identifier`, keyed by the interaction's place: its
 * {@link nodeRef} tuple. It is the optional part of the {@link Interaction}: an interaction that
 * writes no `response-identifier` has none, and one that writes one has it, both ways. The name it
 * binds is its {@link BoundVariable}'s, the one row every law over a binding's name reads.
 */
export const Binding = relation(
  "Binding",
  {
    kind: closedId(NodeKind),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * One binding of an item's interaction to a response variable, keyed by the interaction's place
 * and the attribute that binds it: `response-identifier`, or `string-identifier`'s second variable,
 * where its value names a variable, an NCName ({@link namePattern}). Any other value binds nothing,
 * and its value domain refuses it alone (spec reading 152).
 *
 * Its fields, every one written by the host:
 *
 * - `kind`, the interaction's, and `identifier`, the attribute's value collapsed;
 * - `adaptive`, whether its item is adaptive, copied from {@link ItemMode}.
 *
 * The variable it binds is its {@link BindingDeclaration}'s, which a name no response declaration
 * of the item holds has none of.
 */
export const BoundVariable = relation(
  "BoundVariable",
  {
    adaptive: pg.boolean,
    attribute: closedId(AttributeName),
    identifier: keyText,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start", "attribute"],
);

/**
 * The response declaration an item's binding names, keyed as its {@link BoundVariable} is, and
 * written only where a response declaration of the item holds the binding's name, whatever its
 * cardinality spells (spec reading 159): a binding to an undeclared name, an outcome's, a
 * template's or a built-in variable's has no row, which "Binding declared" refuses.
 *
 * Its fields, every one written by the host:
 *
 * - `package`, `path`, `start`, `attribute`, `kind` and `identifier`, its binding's, copied from
 *   {@link BoundVariable};
 * - `declaration`, the declaration's `start` in the item, and its `declarationKind`, `cardinalities`
 *   and `baseTypes`, copied through `declarationIdentifierRef`: its cardinality, where it has one,
 *   is its {@link BindingCardinality}'s, and its base type its {@link BindingBaseType}'s.
 */
export const BindingDeclaration = relation(
  "BindingDeclaration",
  {
    attribute: closedId(AttributeName),
    baseTypes: natural,
    cardinalities: natural,
    declaration: natural,
    declarationKind: closedId(DeclarationKind),
    identifier: keyText,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start", "attribute"],
);

/**
 * A bound variable beside its declaration's cardinality, keyed as its {@link BindingDeclaration}
 * is, where the declaration has one: the row every law over the bound variable's cardinality reads,
 * "BindingFit", "RecordBindingFit", "Binding cardinality" and "Max strings required". A binding to
 * a declaration whose cardinality is unwritten or spells nothing has none, so no law reads a
 * cardinality it does not have, and AL3 or the declaration's value domain refuses it alone (spec
 * readings 158 and 159).
 *
 * Its fields, every one written by the host:
 *
 * - `package`, `path`, `start`, `attribute`, `kind`, `declaration` and `baseTypes`, its
 *   {@link BindingDeclaration}'s;
 * - `cardinality`, the declaration's {@link DeclarationCardinality}'s;
 * - `mosts`, its interaction's count of most values, its {@link CountBound}'s `mosts` where
 *   `ChoiceBound` pairs the kind's counts, and 0 on any other kind, which has none: "Binding
 *   cardinality" judges a binding only where its interaction's most has a value;
 * - `gaps`, its interaction's count of gaps, its {@link Interaction}'s: "Binding cardinality" refuses
 *   a gap match with two or more bound to a single response (spec reading 169).
 */
export const BindingCardinality = relation(
  "BindingCardinality",
  {
    attribute: closedId(AttributeName),
    baseTypes: natural,
    cardinality: closedId(Cardinality),
    declaration: natural,
    gaps: natural,
    kind: closedId(NodeKind),
    mosts: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start", "attribute"],
);

/**
 * One attribute by which an interaction of any document binds a response variable, keyed by the
 * interaction's place and the attribute (spec reading 117), where its value names a variable:
 * `kind`, the interaction's, and `identifier`, the attribute's value collapsed. A
 * fragment's interactions bind no variable of their own document, which declares none, but one of
 * each item that places the fragment ({@link PlacedBinding}); its rows count as
 * `Document.bindings`.
 *
 * The import writes its rows where its form names something (`namedBy` of
 * `#pantry/import/names.ts`, which lists every such relation), until it is a query over
 * `Attribute`.
 */
export const BindingName = relation(
  "BindingName",
  {
    attribute: closedId(AttributeName),
    identifier: keyText,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start", "attribute"],
);

/**
 * One binding of an instance of an item's assembly (Q5.13's `Instance`, spec reading 117), keyed by
 * the instance (`package`, `assembly`, `instance`), the interaction's `start` in the instance's
 * document and the attribute: the item's own bindings under its root instance, and an included
 * fragment's under each instance that places it, so each placement binds the item's responses as
 * its merged document would ("interactions included from fragments must be correctly bound to
 * response variables declared in the items", information model §2.12). The instance names its
 * document, so `path` is no part of the key.
 *
 * Its fields, every one written by the host: `package`, `assembly` and `instance`, the instance's,
 * and `path`, its document's; `start`, `attribute`, `kind` and `identifier`, its
 * {@link BindingName}'s; and `adaptive`, whether the item is adaptive. The variable it binds among
 * the assembly's declarations is its {@link PlacedBindingDeclaration}'s.
 */
export const PlacedBinding = relation(
  "PlacedBinding",
  {
    adaptive: pg.boolean,
    assembly: EntryPath,
    attribute: closedId(AttributeName),
    identifier: keyText,
    instance: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * The response declaration a {@link PlacedBinding} names among its assembly's, keyed as the
 * binding is, and written only where a response declaration of the item holds the name, whatever
 * its cardinality spells, as {@link BindingDeclaration} is for an item's own bindings.
 *
 * Its fields, every one written by the host: `package`, `assembly`, `instance`, `path`, `start`,
 * `attribute`, `kind` and `identifier`, its binding's, copied from `PlacedBinding`; and
 * `declaration`, the declaration's `start` in the assembly's head document, and its
 * `declarationKind`, `cardinalities` and `baseTypes`, copied through `declarationIdentifierRef`.
 * Its cardinality, where it has one, is its {@link PlacedBindingCardinality}'s, and its base type
 * its {@link PlacedBindingBaseType}'s.
 */
export const PlacedBindingDeclaration = relation(
  "PlacedBindingDeclaration",
  {
    assembly: EntryPath,
    attribute: closedId(AttributeName),
    baseTypes: natural,
    cardinalities: natural,
    declaration: natural,
    declarationKind: closedId(DeclarationKind),
    identifier: keyText,
    instance: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * A placed bound variable beside its declaration's cardinality, keyed as its
 * {@link PlacedBindingDeclaration} is, where the declaration has one, as {@link BindingCardinality}
 * is an item's own binding's: `package`, `assembly`, `instance`, `path`, `start`, `attribute`,
 * `kind`, `declaration` and `baseTypes`, its declaration row's; `cardinality`, the declaration's
 * {@link DeclarationCardinality}'s; and `mosts` and `gaps`, as {@link BindingCardinality}'s.
 */
export const PlacedBindingCardinality = relation(
  "PlacedBindingCardinality",
  {
    assembly: EntryPath,
    attribute: closedId(AttributeName),
    baseTypes: natural,
    cardinality: closedId(Cardinality),
    declaration: natural,
    gaps: natural,
    instance: natural,
    kind: closedId(NodeKind),
    mosts: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * A bound variable's base type, keyed as its {@link BindingCardinality} is, where its declaration
 * has a cardinality and a base type: `baseType`, the declaration's {@link DeclarationBaseType}'s,
 * beside the binding's `declaration`, `cardinality` and interaction `kind`, the fields `BindingFit`
 * judges together. A record has no base type, and its binding no row (lane NIL's audit, B12); nor
 * has a binding to a declaration with no cardinality, which no fit law judges (spec reading 159).
 */
export const BindingBaseType = relation(
  "BindingBaseType",
  {
    attribute: closedId(AttributeName),
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declaration: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start", "attribute"],
);

/**
 * A placed binding's variable's base type, keyed as its {@link PlacedBindingCardinality} is, where
 * its declaration has a cardinality and a base type, as {@link BindingBaseType} is an item's own
 * binding's. It reads its declaration in the assembly's head document, `(package, assembly,
 * declaration)`, and no field of its interaction's document beside its key.
 */
export const PlacedBindingBaseType = relation(
  "PlacedBindingBaseType",
  {
    assembly: EntryPath,
    attribute: closedId(AttributeName),
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declaration: natural,
    instance: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    start: natural,
  },
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * One choice of an instance of an assembly (Q5.13's `Instance`, spec reading 117), keyed by the
 * instance and the choice's `start`: a {@link Choice} of the instance's document, `path`, under the
 * assembly, so an included fragment's choices count among its item's ("Choice identifier key" over
 * the assembly: "This identifier must not be used by any other choice", information model
 * §5.132.1, read across the nine choice classes by spec reading 104, so a key over the query
 * `PlacedChoiceOrHottext`, `#pantry/qti/queries.ts`, holds a name to one of them), and a fragment
 * placed twice in one item holds its choices twice.
 */
export const PlacedChoice = relation(
  "PlacedChoice",
  {
    assembly: EntryPath,
    identifier: keyText,
    instance: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "assembly", "instance", "start"],
);

/**
 * One hottext of an instance of an assembly, keyed by the instance and the hottext's `start`: a
 * {@link Hottext} of the instance's document, under the assembly, as {@link PlacedChoice} is.
 */
export const PlacedHottext = relation(
  "PlacedHottext",
  {
    assembly: EntryPath,
    identifier: keyText,
    instance: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "assembly", "instance", "start"],
);

/**
 * Each document's binding attributes, counted by `Document.bindings`.
 */
const bindingNameFamily = counted(on(BindingName, "package", "path"), fin(Document, "bindings"));

/**
 * Each item instance's bindings, counted by `Instance.bindings`, its document's count.
 */
const placedBindingFamily = counted(
  on(PlacedBinding, "package", "assembly", "instance"),
  fin(Instance, "bindings"),
);

/**
 * A choice, keyed by its place: its {@link nodeRef} tuple and its identifier collapsed. Its nearest
 * interaction is its {@link ChoiceInteraction}'s. It owns no sequence (C15).
 */
export const Choice = relation(
  "Choice",
  {
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * A choice's interaction, keyed by the choice's place: its nearest interaction (N8), the
 * {@link Interaction} that counts it, at `(package, interactionPath, interaction)`. Only a choice an
 * interaction encloses, in its own document or through the include that places its fragment, has a
 * row; every choice must ("N8 nearest"), and a gap that no gap-match encloses breaks N6 first. It
 * owns no sequence (C15).
 *
 * `interaction` is the choice's `nearest`, a position; `interactionPath` is the document it is a
 * position in: the choice's own `path` where an interaction of its document encloses it, else its
 * document's context (`Document.contextPath` and `contextNearest`), the interaction its fragment's
 * include stands in (spec reading 117).
 */
export const ChoiceInteraction = relation(
  "ChoiceInteraction",
  {
    interaction: natural,
    interactionPath: EntryPath,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * Each interaction's choices, counted by `Interaction.choices` (C15): a flat row whose group,
 * `interaction`, names its owner.
 */
export const choiceFamily = counted(
  on(ChoiceInteraction, "package", "interactionPath", "interaction"),
  fin(Interaction, "choices"),
);

/**
 * A gap's interaction, keyed by the gap's place: a copy of its {@link ChoiceInteraction} row, held
 * both ways to the {@link Choice} rows of kind `qti-gap`, so a gap an include places counts under
 * the interaction that encloses it, as its choice does, and no gap text or other choice counts.
 * `Interaction.choices` counts a gap match's gap texts beside its gaps; "Binding cardinality" reads
 * the gaps alone (spec reading 169). It owns no sequence.
 */
export const GapInteraction = relation(
  // GRIZZLE-PENDING: Q16, a family whose member side is a selection; then this stored copy goes.
  "GapInteraction",
  {
    interaction: natural,
    interactionPath: EntryPath,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * Each interaction's gaps, counted by `Interaction.gaps`: a flat row whose group, `interaction`,
 * names its owner.
 */
const gapFamily = counted(
  on(GapInteraction, "package", "interactionPath", "interaction"),
  fin(Interaction, "gaps"),
);

/**
 * One form in which a portable custom interaction names its module, keyed by the interaction's
 * place and the form: `element` is false for the `module` attribute and true for the
 * `qti-interaction-modules` child (information model §5.106.2: "If this characteristic is provided
 * the qti-interaction-modules child attribute is not required, if omitted then the modules child
 * element is mandatory", R10-a). A form a PCI does not write has no row; "PCI module source" counts
 * the rows.
 *
 * Its rows are copies of the tree, both ways: an attribute form of each `module` attribute of a
 * portable custom interaction, an element form of each `qti-interaction-modules` child of one.
 */
export const PciModuleForm = relation(
  "PciModuleForm",
  { element: pg.boolean, package: ManifestIdentifier, path: EntryPath, start: natural },
  ["package", "path", "start", "element"],
);

/**
 * Each interaction's module forms, counted by `Interaction.moduleForms`: a flat row whose group,
 * its place, names its owner.
 */
const pciModuleFamily = counted(
  on(PciModuleForm, "package", "path", "start"),
  fin(Interaction, "moduleForms"),
);

/**
 * The custom interaction's kind, the deprecated element a 3.0.0 document holds none of ("Custom
 * interaction version", R10-b).
 */
const customKind = "qti-custom-interaction" satisfies Kind;

/**
 * The `module` attribute of a portable custom interaction: the attribute form of its module.
 */
const moduleAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, pciKind), a.eq(a.name, "module")),
);

/**
 * The `qti-interaction-modules` children of a portable custom interaction, by their parent: the
 * element form of its module.
 */
const moduleElements = select(Node, (n) =>
  n.and(n.eq(n.kind, modulesKind), n.eq(n.parentKind, pciKind)),
);

/**
 * The gaps among the {@link Choice} rows, each of which has its {@link GapInteraction}.
 */
const gapChoices = select(Choice, (c) => c.eq(c.kind, gapKind));

/**
 * The attribute forms among the {@link PciModuleForm} rows.
 */
const attributeForms = select(PciModuleForm, (f) => f.eq(f.element, false));

/**
 * The element forms among the {@link PciModuleForm} rows.
 */
const elementForms = select(PciModuleForm, (f) => f.eq(f.element, true));

/**
 * A hottext, keyed by its place: its {@link nodeRef} tuple, its nearest interaction's kind
 * (`document` where it sits in none, its `nearest` then the document node's 0), the document its
 * nearest is a position in (`nearestPath`: its own `path`, or its document's context, as
 * {@link ChoiceInteraction}'s `interactionPath` is), and its identifier collapsed.
 */
export const Hottext = relation(
  "Hottext",
  {
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: natural,
    nearestKind: closedId(NodeKind),
    nearestPath: EntryPath,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * Each document's choices, counted by `Document.choices`.
 */
const documentChoiceFamily = counted(on(Choice, "package", "path"), fin(Document, "choices"));

/**
 * Each document's hottexts, counted by `Document.hottexts`.
 */
const documentHottextFamily = counted(on(Hottext, "package", "path"), fin(Document, "hottexts"));

/**
 * Each instance's choices, counted by `Instance.choices`, its document's count.
 */
const placedChoiceFamily = counted(
  on(PlacedChoice, "package", "assembly", "instance"),
  fin(Instance, "choices"),
);

/**
 * Each instance's hottexts, counted by `Instance.hottexts`, its document's count.
 */
const placedHottextFamily = counted(
  on(PlacedHottext, "package", "assembly", "instance"),
  fin(Instance, "hottexts"),
);

/**
 * A hotspot choice or associable hotspot, keyed by its place: its {@link nodeRef} tuple, its parent
 * interaction's kind, its `area`, the value of its `shape` (the kind of area it is), and the
 * element counts the last-slot law compares, copied through `nodeCounts`: its own (`elements`, its
 * element rank among its siblings) and its parent's (`parentElementChildren`, the parent's element
 * children).
 */
export const Hotspot = relation(
  "Hotspot",
  {
    area: keyText,
    elementChildren: natural,
    elements: natural,
    kind: closedId(NodeKind),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    parentElementChildren: natural,
    parentElements: natural,
    parentKind: closedId(NodeKind),
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * An element whose least and most counts `ChoiceBound` pairs, keyed by its place: its
 * {@link nodeRef} tuple and what it writes of its two counts.
 *
 * - `minName` and `maxName`, the attributes `ChoiceBound` names for its kind, and `minWritten` and
 *   `maxWritten`, whether it writes each;
 * - `choices`, its interaction's choices (`Binding.choices`), and 0 on a choice;
 * - `leasts` and `mosts`, its counts of {@link LeastCount} and {@link MostCount} rows: 1 where the
 *   count has a value, and 0 where it has none (lane NIL's audit, B8: a missing value is a row of
 *   its own relation, never a sentinel).
 */
export const CountBound = relation(
  "CountBound",
  {
    choices: natural,
    kind: closedId(NodeKind),
    leasts: drawn(natural),
    maxName: closedId(AttributeName),
    maxWritten: pg.boolean,
    minName: closedId(AttributeName),
    minWritten: pg.boolean,
    mosts: drawn(natural),
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * A bound's least count, where it has a value, keyed by its place: `least`, the count's value
 * collapsed where written, else its XSD default, and `leastValue`, its integer, which `E1_derived`
 * proves by G-parse's cast, written so a selection may read it. It copies the fields its laws read
 * from its {@link CountBound}.
 *
 * A count has a value where it writes an integer or, unwritten, has an XSD default. A count written
 * as no integer (`max-choices="1abc"`) has none, and its attribute's value domain refuses it alone;
 * an unwritten count with no default has none, and no law reads it (the law oracle's
 * `countAttribute`). A count is an `xs:nonNegativeInteger` held to the signed 64-bit range (reading
 * 46), so its value is in `lexicalForm(pg.bigint)`, which `E1_derived` requires.
 */
export const LeastCount = relation(
  "LeastCount",
  {
    choices: natural,
    kind: closedId(NodeKind),
    least: keyText,
    leastValue: pg.bigint,
    minName: closedId(AttributeName),
    minWritten: pg.boolean,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * A bound's most count, where it has a value, keyed by its place, as {@link LeastCount} is the
 * least's: `most` and `mostValue`, and the fields its laws read, `minWritten` among them, copied
 * from its {@link CountBound}.
 */
export const MostCount = relation(
  "MostCount",
  {
    choices: natural,
    kind: closedId(NodeKind),
    maxName: closedId(AttributeName),
    maxWritten: pg.boolean,
    minWritten: pg.boolean,
    most: keyText,
    mostValue: pg.bigint,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * A bound both of whose counts have a value, keyed by its place: the two integers, copied from its
 * {@link LeastCount} and {@link MostCount}, and the fields "Choice bounds" reads beside them.
 */
export const CountRange = relation(
  "CountRange",
  {
    kind: closedId(NodeKind),
    leastValue: pg.bigint,
    minWritten: pg.boolean,
    mostValue: pg.bigint,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * Each bound's least count, counted by `CountBound.leasts`: one row or none.
 */
const leastCountFamily = counted(
  on(LeastCount, "package", "path", "start"),
  fin(CountBound, "leasts"),
);

/**
 * Each bound's most count, counted by `CountBound.mosts`: one row or none.
 */
const mostCountFamily = counted(
  on(MostCount, "package", "path", "start"),
  fin(CountBound, "mosts"),
);

/**
 * A slider interaction's bounds, keyed by its place: its `lower-bound` and `upper-bound`,
 * collapsed.
 */
export const Slider = relation(
  "Slider",
  {
    lower: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    upper: keyText,
  },
  ["package", "path", "start"],
);

/**
 * One ARIA range attribute of an element, keyed by its element's place and its name: its value,
 * collapsed.
 */
export const AriaValue = relation(
  // GRIZZLE-PENDING: Q16, a family whose member side is a selection; then this stored copy goes.
  "AriaValue",
  {
    name: closedId(AttributeName),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    value: keyText,
  },
  ["package", "path", "start", "name"],
);

/**
 * An element with an ARIA range attribute, a projection keyed by its place: its count of
 * {@link AriaValue} rows, 2 exactly where it carries both.
 */
export const AriaElement = relation(
  "AriaElement",
  { package: ManifestIdentifier, path: EntryPath, start: natural, values: drawn(natural) },
  ["package", "path", "start"],
);

/**
 * Each element's ARIA range attributes, counted by `AriaElement.values`.
 */
const ariaValueFamily = counted(
  on(AriaValue, "package", "path", "start"),
  fin(AriaElement, "values"),
);

/**
 * An element that carries both ARIA range attributes, keyed by its place: its `aria-valuemin` and
 * `aria-valuemax`, collapsed.
 */
export const AriaRange = relation(
  "AriaRange",
  {
    max: keyText,
    min: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * A document's item mode, keyed by the document (`package`, `path`): whether it is an item whose
 * `adaptive` is true. Every adaptive item has its row, and so does every document a
 * {@link BoundVariable} names.
 */
export const ItemMode = relation(
  "ItemMode",
  { adaptive: pg.boolean, package: ManifestIdentifier, path: EntryPath },
  ["package", "path"],
);

/**
 * The fields of a content reference: the referring element's place and kind, the root kind of the
 * assembly it resolves in, which for an item's or a test's own reference is its document's
 * own root kind, the attribute it refers by, and the name it refers to, collapsed. A value that is
 * no NCName ({@link namePattern}) names nothing and has no row: its value domain refuses it alone
 * (spec reading 152). What the name resolves to is a row of its own, where it names a
 * declaration (`referenceDeclarationFields`), and none where it names a built-in variable of that
 * root, as the installed `BuiltInVariable` holds each under its root (spec reading 29: an item's
 * are not a test's), or nothing, which its law refuses (lane NIL's NS2: a missing value is a row of
 * its own relation, never a sentinel).
 */
const referenceFields = {
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  identifier: keyText,
  kind: closedId(NodeKind),
  package: ManifestIdentifier,
  path: EntryPath,
  start: natural,
};

/**
 * The fields of the declaration a content reference names, keyed as its reference is: the
 * reference's fields, and the declaration as `declarationIdentifierRef` holds it, whatever its
 * cardinality spells (spec reading 159), its kind one `ContentReference` lets the reference name:
 * its `start` in the reference's document, its kind and counts of cardinalities and base types.
 */
const referenceDeclarationFields = {
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  baseTypes: natural,
  cardinalities: natural,
  declaration: natural,
  declarationKind: closedId(DeclarationKind),
  identifier: keyText,
  kind: closedId(NodeKind),
  package: ManifestIdentifier,
  path: EntryPath,
  start: natural,
};

/**
 * A feedback element's outcome, keyed by its element's place and `outcome-identifier` (reading
 * 77).
 */
export const FeedbackRef = relation("FeedbackRef", referenceFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * A template element's or a choice's template variable, keyed by its element's place and
 * `template-identifier` (§2.7.2: "A references must match the identifier in a corresponding
 * template declaration"). Of a template element or a choice the variable is of base type
 * identifier and of single or multiple cardinality (reading R15-l, "Template variable type"); a
 * portable custom interaction's `qti-template-variable` states no type.
 */
export const TemplateRef = relation("TemplateRef", referenceFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * The variable a printed variable prints, keyed by its element's place and `identifier` (§7.30.6:
 * "The outcome variable or template variable must have been defined"), and the variable its `base`
 * or `index` names where that value is a name, not an integer, keyed by its element's place and the
 * attribute.
 */
export const PrintedVariableRef = relation("PrintedVariableRef", referenceFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * The context variable a PCI's `qti-context-variable` binds, keyed by its element's place and
 * `identifier`
 * (reading 92: "the context variables are the declared ones and the built-in QTI_CONTEXT").
 */
export const ContextRef = relation("ContextRef", referenceFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * The outcome declaration a {@link FeedbackRef} names, keyed as it is, where its document declares
 * one of its name.
 */
export const FeedbackRefDeclaration = relation(
  "FeedbackRefDeclaration",
  referenceDeclarationFields,
  ["package", "path", "start", "attribute"],
);

/**
 * A {@link FeedbackRefDeclaration}'s outcome beside its cardinality, keyed as it is, where the
 * outcome has one (spec reading 159): `declaration`, its declaration row's, and `cardinality`, the
 * outcome's {@link DeclarationCardinality}'s, which "Feedback outcome type" holds to single or
 * multiple. An outcome whose cardinality is unwritten or spells nothing leaves its reference none,
 * so the law reads no cardinality the outcome does not have, and AL3 or its value domain refuses
 * it alone (spec reading 158).
 */
export const FeedbackRefCardinality = relation(
  "FeedbackRefCardinality",
  {
    attribute: closedId(AttributeName),
    cardinality: closedId(Cardinality),
    declaration: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start", "attribute"],
);

/**
 * The template declaration a {@link TemplateRef} names, keyed as it is, where its document declares
 * one of its name.
 */
export const TemplateRefDeclaration = relation(
  "TemplateRefDeclaration",
  referenceDeclarationFields,
  ["package", "path", "start", "attribute"],
);

/**
 * A {@link TemplateRefDeclaration}'s template beside its cardinality, keyed as it is, where the
 * template has one (spec reading 159, decision 432): `declaration`, its declaration row's, `kind`,
 * the reference's, and `cardinality`, the template's {@link DeclarationCardinality}'s, which
 * "Template variable type" holds to single or multiple unless the reference is a portable custom
 * interaction's `qti-template-variable`, which states no type. A template whose cardinality is
 * unwritten or spells nothing leaves its reference none, so the law reads no cardinality the
 * template does not have, and AL3 or its value domain refuses it alone (spec reading 158).
 */
export const TemplateRefCardinality = relation(
  "TemplateRefCardinality",
  {
    attribute: closedId(AttributeName),
    cardinality: closedId(Cardinality),
    declaration: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start", "attribute"],
);

/**
 * The outcome or template declaration a {@link PrintedVariableRef} names, keyed as it is, where its
 * document declares one of its name.
 */
export const PrintedVariableRefDeclaration = relation(
  "PrintedVariableRefDeclaration",
  referenceDeclarationFields,
  ["package", "path", "start", "attribute"],
);

/**
 * The context declaration a {@link ContextRef} names, keyed as it is, where its document declares
 * one of its name.
 */
export const ContextRefDeclaration = relation("ContextRefDeclaration", referenceDeclarationFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * The fields of a reference a section document makes: its element's place and kind, the attribute
 * it refers by, and its name collapsed. It resolves in no declaration of its own
 * document, since a section declares nothing, but once per test that places it (the port audit's
 * A45, B15).
 */
const sectionNameFields = {
  attribute: closedId(AttributeName),
  identifier: keyText,
  kind: closedId(NodeKind),
  package: ManifestIdentifier,
  path: EntryPath,
  start: natural,
};

/**
 * A section document's feedback outcome reference, a feedback element's `outcome-identifier`,
 * keyed by its element's place and attribute.
 */
export const SectionFeedbackName = relation("SectionFeedbackName", sectionNameFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * A section document's printed variable reference, a printed variable's `identifier`, or its
 * `base` or `index` where it names a variable, keyed by its element's place and attribute.
 */
export const SectionPrintedName = relation("SectionPrintedName", sectionNameFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * A section document's or an included fragment's template variable reference, a template
 * element's or a choice's `template-identifier`, keyed by its element's place and attribute (spec
 * readings 5 and 117).
 */
export const SectionTemplateName = relation("SectionTemplateName", sectionNameFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * A section document's or an included fragment's context variable reference, a
 * `qti-context-variable`'s `identifier`, keyed by its element's place and attribute (spec readings
 * 5 and 117).
 */
export const SectionContextName = relation("SectionContextName", sectionNameFields, [
  "package",
  "path",
  "start",
  "attribute",
]);

/**
 * A document whose references resolve once per assembly that places it, keyed by the document
 * (`package`, `path`), a projection whose counts are its {@link SectionFeedbackName},
 * {@link SectionPrintedName}, {@link SectionTemplateName} and {@link SectionContextName} rows:
 * every document that is no item's or test's has its row, its counts 0 where it makes none.
 */
export const ReferringDocument = relation(
  "ReferringDocument",
  {
    contexts: drawn(natural),
    feedbacks: drawn(natural),
    package: ManifestIdentifier,
    path: EntryPath,
    prints: drawn(natural),
    templates: drawn(natural),
  },
  ["package", "path"],
);

/**
 * Each section document's feedback references, counted by `ReferringDocument.feedbacks`.
 */
const sectionFeedbackNameFamily = counted(
  on(SectionFeedbackName, "package", "path"),
  fin(ReferringDocument, "feedbacks"),
);

/**
 * Each section document's printed variable references, counted by `ReferringDocument.prints`.
 */
const sectionPrintedNameFamily = counted(
  on(SectionPrintedName, "package", "path"),
  fin(ReferringDocument, "prints"),
);

/**
 * Each section document's and fragment's template variable references, counted by
 * `ReferringDocument.templates`.
 */
const sectionTemplateNameFamily = counted(
  on(SectionTemplateName, "package", "path"),
  fin(ReferringDocument, "templates"),
);

/**
 * Each section document's and fragment's context variable references, counted by
 * `ReferringDocument.contexts`.
 */
const sectionContextNameFamily = counted(
  on(SectionContextName, "package", "path"),
  fin(ReferringDocument, "contexts"),
);

/**
 * One placement of a section document under a test, or of an included fragment under an item
 * (spec reading 117), keyed by its `Instance` (`package`, `assembly`, `instance`): the document it
 * places, `document`, the instance's, and the assembly's root kind, whose built-in variables its
 * references read, and its counts
 * of {@link SectionFeedbackRef}, {@link SectionPrintedRef}, {@link SectionTemplateRef} and
 * {@link SectionContextRef} rows, which the families draw.
 */
export const SectionScope = relation(
  "SectionScope",
  {
    assembly: EntryPath,
    assemblyKind: closedId(NodeKind),
    contexts: drawn(natural),
    document: EntryPath,
    feedbacks: drawn(natural),
    instance: natural,
    package: ManifestIdentifier,
    prints: drawn(natural),
    templates: drawn(natural),
  },
  ["package", "assembly", "instance"],
);

/**
 * The fields of a section document's or a fragment's reference placed under one assembly that
 * places it: the placement's instance (`package`, `assembly`, `instance`) and the assembly's root
 * kind, and the reference's fields, its element's place in the placed document. What its name
 * resolves to among the assembly's declarations is a row of its own, where it names a declaration
 * (`sectionReferenceDeclarationFields`), and none where it names a built-in of the assembly's root
 * or nothing, as an own reference's is.
 */
const sectionReferenceFields = {
  assembly: EntryPath,
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  identifier: keyText,
  instance: natural,
  kind: closedId(NodeKind),
  package: ManifestIdentifier,
  path: EntryPath,
  start: natural,
};

/**
 * The fields of the declaration a placed reference names among its assembly's declarations, keyed
 * as its placed reference is: its fields, and the declaration as `declarationIdentifierRef` holds
 * it, whatever its cardinality spells (spec reading 159): `declaration`, its `start` in the
 * assembly's head document, `assembly`.
 */
const sectionReferenceDeclarationFields = {
  assembly: EntryPath,
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  baseTypes: natural,
  cardinalities: natural,
  declaration: natural,
  declarationKind: closedId(DeclarationKind),
  identifier: keyText,
  instance: natural,
  kind: closedId(NodeKind),
  package: ManifestIdentifier,
  path: EntryPath,
  start: natural,
};

/**
 * A section document's feedback reference resolved under one placement, keyed by the placement's
 * instance and the reference's element's `start` and attribute. It is a relation of its own beside
 * {@link SectionPrintedRef}, so each law that resolves one is a statement of its own, which a
 * refusal names by its relations and terms ("Feedback reference", "Printed variable reference").
 */
export const SectionFeedbackRef = relation("SectionFeedbackRef", sectionReferenceFields, [
  "package",
  "assembly",
  "instance",
  "start",
  "attribute",
]);

/**
 * A section document's printed variable reference resolved under one placement, keyed as
 * {@link SectionFeedbackRef} is.
 */
export const SectionPrintedRef = relation("SectionPrintedRef", sectionReferenceFields, [
  "package",
  "assembly",
  "instance",
  "start",
  "attribute",
]);

/**
 * A section document's or a fragment's template variable reference resolved under one placement,
 * keyed as {@link SectionFeedbackRef} is ("Template reference").
 */
export const SectionTemplateRef = relation("SectionTemplateRef", sectionReferenceFields, [
  "package",
  "assembly",
  "instance",
  "start",
  "attribute",
]);

/**
 * A section document's or a fragment's context variable reference resolved under one placement,
 * keyed as {@link SectionFeedbackRef} is ("Context variable reference").
 */
export const SectionContextRef = relation("SectionContextRef", sectionReferenceFields, [
  "package",
  "assembly",
  "instance",
  "start",
  "attribute",
]);

/**
 * The outcome declaration a {@link SectionFeedbackRef} names among its assembly's declarations,
 * keyed as it is, where the assembly declares one of its name.
 */
export const SectionFeedbackRefDeclaration = relation(
  "SectionFeedbackRefDeclaration",
  sectionReferenceDeclarationFields,
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * A {@link SectionFeedbackRefDeclaration}'s outcome beside its cardinality, keyed as it is, where
 * the outcome has one, as {@link FeedbackRefCardinality} is an own feedback reference's.
 */
export const SectionFeedbackRefCardinality = relation(
  "SectionFeedbackRefCardinality",
  {
    assembly: EntryPath,
    attribute: closedId(AttributeName),
    cardinality: closedId(Cardinality),
    declaration: natural,
    instance: natural,
    package: ManifestIdentifier,
    start: natural,
  },
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * The outcome or template declaration a {@link SectionPrintedRef} names among its assembly's
 * declarations, keyed as it is, where the assembly declares one of its name.
 */
export const SectionPrintedRefDeclaration = relation(
  "SectionPrintedRefDeclaration",
  sectionReferenceDeclarationFields,
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * The template declaration a {@link SectionTemplateRef} names among its assembly's declarations,
 * keyed as it is, where the assembly declares one of its name.
 */
export const SectionTemplateRefDeclaration = relation(
  "SectionTemplateRefDeclaration",
  sectionReferenceDeclarationFields,
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * A {@link SectionTemplateRefDeclaration}'s template beside its cardinality, keyed as it is, where
 * the template has one, as {@link TemplateRefCardinality} is an own template reference's.
 */
export const SectionTemplateRefCardinality = relation(
  "SectionTemplateRefCardinality",
  {
    assembly: EntryPath,
    attribute: closedId(AttributeName),
    cardinality: closedId(Cardinality),
    declaration: natural,
    instance: natural,
    kind: closedId(NodeKind),
    package: ManifestIdentifier,
    start: natural,
  },
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * The context declaration a {@link SectionContextRef} names among its assembly's declarations,
 * keyed as it is, where the assembly declares one of its name.
 */
export const SectionContextRefDeclaration = relation(
  "SectionContextRefDeclaration",
  sectionReferenceDeclarationFields,
  ["package", "assembly", "instance", "start", "attribute"],
);

/**
 * Each placement's resolved feedback references, counted by `SectionScope.feedbacks`, which equals
 * its document's count, so each placement resolves every one.
 */
const sectionFeedbackFamily = counted(
  on(SectionFeedbackRef, "package", "assembly", "instance"),
  fin(SectionScope, "feedbacks"),
);

/**
 * Each placement's resolved printed variable references, counted by `SectionScope.prints`.
 */
const sectionPrintedFamily = counted(
  on(SectionPrintedRef, "package", "assembly", "instance"),
  fin(SectionScope, "prints"),
);

/**
 * Each placement's resolved template variable references, counted by `SectionScope.templates`.
 */
const sectionTemplateFamily = counted(
  on(SectionTemplateRef, "package", "assembly", "instance"),
  fin(SectionScope, "templates"),
);

/**
 * Each placement's resolved context variable references, counted by `SectionScope.contexts`.
 */
const sectionContextFamily = counted(
  on(SectionContextRef, "package", "assembly", "instance"),
  fin(SectionScope, "contexts"),
);

/**
 * The O3 overlays, each under its own name: the members `Qti` composes from this module.
 */
export const interactionRelations = {
  AriaElement,
  AriaRange,
  AriaValue,
  Binding,
  BindingBaseType,
  BindingCardinality,
  BindingDeclaration,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceInteraction,
  ContextRef,
  ContextRefDeclaration,
  CountBound,
  CountRange,
  FeedbackRef,
  FeedbackRefCardinality,
  FeedbackRefDeclaration,
  GapInteraction,
  Hotspot,
  Hottext,
  Interaction,
  InteractionAttribute,
  ItemMode,
  LeastCount,
  MostCount,
  PciModuleForm,
  PlacedBinding,
  PlacedBindingBaseType,
  PlacedBindingCardinality,
  PlacedBindingDeclaration,
  PlacedChoice,
  PlacedHottext,
  PrintedVariableRef,
  PrintedVariableRefDeclaration,
  ReferringDocument,
  SectionContextName,
  SectionContextRef,
  SectionContextRefDeclaration,
  SectionFeedbackName,
  SectionFeedbackRef,
  SectionFeedbackRefCardinality,
  SectionFeedbackRefDeclaration,
  SectionPrintedName,
  SectionPrintedRef,
  SectionPrintedRefDeclaration,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  SectionTemplateRefCardinality,
  SectionTemplateRefDeclaration,
  Slider,
  TemplateRef,
  TemplateRefCardinality,
  TemplateRefDeclaration,
};

/**
 * An `InteractionAttribute` row as a row check or a selection reads it.
 */
type AttributeRow = RowScalars<typeof InteractionAttribute>;

/**
 * A `LeastCount` row as a row check reads it.
 */
type LeastRow = RowScalars<typeof LeastCount>;

/**
 * A `MostCount` row as a row check reads it.
 */
type MostRow = RowScalars<typeof MostCount>;

/**
 * A `CountRange` row as a row check reads it.
 */
type RangeRow = RowScalars<typeof CountRange>;

/**
 * A `Hotspot` row as a row check reads it.
 */
type HotspotRow = RowScalars<typeof Hotspot>;

/**
 * The names of an item's built-in variables, `BuiltInVariable`'s rows under the item root:
 * `numAttempts`, `duration`, `completionStatus` and `QTI_CONTEXT` (§2.2.2, §2.2.2.1), which "Choice
 * not variable" holds an item's choices and hottexts apart from (`#pantry/qti/queries.ts`).
 */
export const itemBuiltInNames: readonly string[] = [
  ...new Set(
    BuiltInVariable.rows.filter(({ root }) => root === itemKind).map(({ variable }) => variable),
  ),
];

/**
 * Select the attributes O3 reads: each name of {@link readAttributes} on its kinds, and the ARIA
 * range attributes on every kind. It is the one copy source over `Attribute` for O3, read at
 * `(package, path, start, name)`, `Attribute`'s own key (an element writes each closed name once,
 * Namespaces in XML 1.0 §6.3), whose index serves the copy's reverse probe and keeps
 * `Attribute.lexical` out of every index.
 */
const read = select(Attribute, (a) =>
  a.or(
    a.in(a.name, ariaNames),
    ...[...readAttributes].map(([name, kinds]) => a.and(a.eq(a.name, name), a.in(a.kind, kinds))),
  ),
);

/**
 * Select the read attributes of some names on some kinds.
 *
 * @param names - The attributes' names.
 * @param kinds - Their elements' kinds.
 * @returns The selection of `InteractionAttribute`.
 */
const readOf = (names: readonly Name[], kinds: readonly Kind[]) =>
  select(InteractionAttribute, (v) => v.and(v.in(v.name, names), v.in(v.kind, kinds)));

/**
 * State that a read attribute is an interaction's binding that names a variable
 * ({@link namePattern}).
 *
 * @param v - The row.
 * @returns The predicate.
 */
const namedBinding = (v: AttributeRow) =>
  v.and(
    v.in(v.name, bindingAttributes),
    v.in(v.kind, interactionKinds),
    Compute.matches(v.value, namePattern),
  );

/**
 * The bindings that name a variable, in every document: {@link BindingName}'s source.
 */
const namedBindings = select(InteractionAttribute, namedBinding);

/**
 * The bindings that name a variable in item documents: {@link BoundVariable}'s source.
 */
const itemBindings = select(InteractionAttribute, (v) =>
  v.and(namedBinding(v), v.eq(v.rootKind, itemKind)),
);

/**
 * Select the read attributes of some names on some kinds that name a variable ({@link namePattern})
 * in the documents whose references resolve in their own declarations, items and tests.
 *
 * @param names - The attributes' names.
 * @param kinds - Their elements' kinds.
 * @returns The selection of `InteractionAttribute`.
 */
const referenceReadOf = (names: readonly Name[], kinds: readonly Kind[]) =>
  select(InteractionAttribute, (v) =>
    v.and(
      v.in(v.name, names),
      v.in(v.kind, kinds),
      v.in(v.rootKind, referringRoots),
      Compute.matches(v.value, namePattern),
    ),
  );

/**
 * The XSD defaults of one count of the pair, per version: each default's value, with the kinds
 * whose count it is. A kind whose count has no default is in none, so its count, left unwritten,
 * has no value (the law oracle's `countAttribute`).
 *
 * @param side - Which count of the pair.
 * @returns One entry per (version, value), with the kinds that read it.
 */
const defaultedValues = (side: "max" | "min") =>
  versions.flatMap((version) =>
    [
      ...Map.groupBy(
        ChoiceBound.rows.flatMap((row) =>
          Option.toArray(countDefault(version, row.kind, row[side])).map((value) => ({
            kind: row.kind,
            value,
          })),
        ),
        ({ value }) => value,
      ),
    ].map(([value, rows]) => ({ kinds: rows.map(({ kind }) => kind), value, version })),
  );

/**
 * The least each kind's unwritten least count reads, per version, where the XSD gives one.
 */
const defaultedLeast = defaultedValues("min");

/**
 * The most each kind's unwritten most count reads, per version, where the XSD gives one.
 */
const defaultedMost = defaultedValues("max");

/**
 * State that an unwritten count of a bound has an XSD default: its version's and kind's.
 *
 * @param b - The bound's row.
 * @param defaulted - The count's defaults ({@link defaultedLeast} or {@link defaultedMost}).
 * @returns The predicate.
 */
const hasDefault = (b: RowScalars<typeof CountBound>, defaulted: typeof defaultedLeast) =>
  b.or(
    ...defaulted.map(({ kinds, version }) => b.and(b.eq(b.version, version), b.in(b.kind, kinds))),
  );

/**
 * State "Choice bounds" over a least count where the law reads it alone (reading 18): a counted
 * bound whose least is written, of a kind `ChoiceCount` names, has a least of at most its choices.
 *
 * @param l - The row.
 * @returns The predicate.
 */
const leastBounds = (l: LeastRow) =>
  l.or(
    l.ne(ChoiceBound.at("zero", l.kind), "counted"),
    l.eq(l.minWritten, false),
    l.not(l.in(l.kind, choiceCountKinds)),
    l.le(l.leastValue, Compute.base(l.choices)),
  );

/**
 * State "Choice bounds" over a most count where the law reads it alone (reading 18): a counted
 * bound whose least is written, of a kind `ChoiceCount` names, has a most of at most its choices.
 *
 * @param m - The row.
 * @returns The predicate.
 */
const mostBounds = (m: MostRow) =>
  m.or(
    m.ne(ChoiceBound.at("zero", m.kind), "counted"),
    m.eq(m.minWritten, false),
    m.not(m.in(m.kind, choiceCountKinds)),
    m.le(m.mostValue, Compute.base(m.choices)),
  );

/**
 * State "Choice bounds" over a bound both of whose counts have a value, as the oracle reads
 * readings 18 and 76:
 *
 * - Where `ChoiceBound`'s zero is `unbounded`, a most of 0 bounds nothing, and otherwise the least is
 *   at most the most;
 * - Where it is `counted` (the order interactions, reading 18), the law binds only where the least is
 *   written, and then the least is at most the most.
 *
 * A bound one of whose counts has no value is judged by neither arm: an unwritten least with no
 * default is no bound, and a count written as no integer is its value domain's.
 *
 * @param r - The row.
 * @returns The predicate.
 */
const rangeBounds = (r: RangeRow) =>
  r.or(
    r.and(
      r.eq(ChoiceBound.at("zero", r.kind), "unbounded"),
      r.or(r.eq(r.mostValue, 0n), r.le(r.leastValue, r.mostValue)),
    ),
    r.and(
      r.eq(ChoiceBound.at("zero", r.kind), "counted"),
      r.or(r.eq(r.minWritten, false), r.le(r.leastValue, r.mostValue)),
    ),
  );

/**
 * The lexical form of a count that `Compute.cast` reads exactly: `xs:integer`'s, within the signed
 * 64-bit range a count is held to (reading 46). A count's value is copied text, `keyText`, since
 * the form's leading zeros bound no length and a copied text sits in an index, so the cast is
 * guarded by the form and the form is required beside it.
 */
const bigintForm = lexicalForm(pg.bigint);

/**
 * The sign a count's form may carry beside {@link bigintForm}: none, a `+`, or a `-` before a zero
 * alone (`-0`, `-00`), which XML Schema 1.1 Part 2 §3.3.20 reads as 0. The two together are the
 * database's reading of which counts have a value: an `xs:nonNegativeInteger` within the signed
 * 64-bit range (reading 46). A count written as no such form, `1abc`, `-1` or past the range, has
 * none: its value domain is its law, and no other law reads it. The import reads the same forms by
 * its own map (`countValueOf` in `#pantry/import/overlays/interactions.ts`), and the law oracle by
 * its own (`integerOf` in `#pantry/test/oracle-view.ts`).
 */
const countSign = Compute.pattern("^(?:[^-]|-0+$)");

/**
 * Select the read count attributes of some names, on the kinds whose counts `ChoiceBound` pairs,
 * that write an integer: each is its bound's {@link LeastCount} or {@link MostCount} value, and a
 * count written as no integer has none.
 *
 * @param names - The counts' attributes.
 * @returns The selection of `InteractionAttribute`.
 */
const integerReadOf = (names: readonly Name[]) =>
  select(InteractionAttribute, (v) =>
    v.and(
      v.in(v.name, names),
      v.in(v.kind, boundKinds),
      Compute.matches(v.value, countSign),
      Compute.matches(v.value, bigintForm),
    ),
  );

/**
 * State the default-hotspot law of each `LastWhere` rule over `shape` (reading 80, ruling D3): a
 * hotspot of the rule's kind, under one of its parents, in one of its versions, whose shape is the
 * rule's value, is its parent's last element child, so whitespace, comments and instructions after
 * it do not count.
 *
 * @param h - The row.
 * @returns The predicate.
 */
const lastWhere = (h: HotspotRow) =>
  h.and(
    ...lastWhereRules
      .filter(({ attribute }) => attribute === "shape")
      .map(({ kind, parents, value, versions: held }) =>
        h.or(
          h.ne(h.kind, kind),
          h.not(h.in(h.parentKind, parents)),
          h.not(h.in(h.version, held)),
          h.ne(h.area, value),
          h.eq(h.elements, h.parentElementChildren),
        ),
      ),
  );

/**
 * The read `response-identifier` of each interaction, one per interaction, keyed by its place: the
 * attribute's own key fixes its name, and the key over the selection states it so that
 * {@link Binding} mirrors it.
 */
const responseIdentifiers = readOf(["response-identifier"], interactionKinds);

/**
 * The interactions not inside a feedback element: the one selection of `Node` O3 reads, a target,
 * so it adds a generated column and a UNIQUE to `Node` and no foreign key. A feedback element
 * enters `fb` (`Enters`, read as a set, since grizzle's set algebra takes no set literal), and an
 * interaction enters no `fb`, so its `ancestry` holds `fb` exactly where an ancestor is feedback.
 */
const outsideFeedback = select(Node, (n) =>
  n.and(
    n.in(n.kind, interactionKinds),
    n.eq(Compute.disjoint(n.ancestry, Enters.row(feedbackKind)), true),
  ),
);

/**
 * The read `adaptive` of each item whose value is true.
 */
const adaptiveTrue = select(InteractionAttribute, (v) =>
  v.and(v.eq(v.name, adaptiveName), v.eq(v.kind, itemKind), v.in(v.value, booleanTrue)),
);

/**
 * State that a read attribute is a printed variable's reference: its `identifier`, or its `base`
 * or `index`, where its value names a variable.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const printedReference = (v: AttributeRow) =>
  v.and(
    Compute.matches(v.value, namePattern),
    v.or(
      v.and(v.in(v.name, references.printed.attributes), v.in(v.kind, references.printed.kinds)),
      v.and(v.in(v.name, references.variable.attributes), v.in(v.kind, references.variable.kinds)),
    ),
  );

/**
 * The read attributes each content reference relation holds: those that name a variable, in items
 * and tests, each resolving in its own document's declarations.
 */
const referenceSources = {
  context: referenceReadOf(references.context.attributes, references.context.kinds),
  feedback: referenceReadOf(references.feedback.attributes, references.feedback.kinds),
  printed: select(InteractionAttribute, (v) =>
    v.and(v.in(v.rootKind, referringRoots), printedReference(v)),
  ),
  template: referenceReadOf(references.template.attributes, references.template.kinds),
};

/**
 * Select the read attributes a section document's or a fragment's references of one class are: the
 * class's attributes on its kinds that name a variable ({@link namePattern}), in a document that is
 * no item or test, so each resolves once per assembly that places it (spec readings 5 and 117).
 *
 * @param reference - The class's attributes and kinds.
 * @returns The selection of `InteractionAttribute`.
 */
const sectionReferenceOf = (reference: {
  readonly attributes: readonly Name[];
  readonly kinds: readonly Kind[];
}) =>
  select(InteractionAttribute, (v) =>
    v.and(
      v.not(v.in(v.rootKind, referringRoots)),
      v.in(v.name, reference.attributes),
      v.in(v.kind, reference.kinds),
      Compute.matches(v.value, namePattern),
    ),
  );

/**
 * The read attributes each section name relation holds: a section document's or a fragment's
 * references of each class, its printed variables' names, bases and indices among them, where they
 * name a variable.
 */
const sectionSources = {
  context: sectionReferenceOf(references.context),
  feedback: sectionReferenceOf(references.feedback),
  printed: select(InteractionAttribute, (v) =>
    v.and(v.not(v.in(v.rootKind, referringRoots)), printedReference(v)),
  ),
  template: sectionReferenceOf(references.template),
};

/**
 * The placements `SectionScope` holds: every instance of an assembly whose root's references
 * resolve in its own declarations, an item's or a test's ({@link referringRoots}), whose document's
 * resolve in no declarations of its own. Under a test, a section document's, one per placement,
 * and a fragment's the test or a section document splices; under an item, an included fragment's,
 * one per placement (spec reading 117). A section document no test places has only its own
 * section-rooted assembly, which resolves nothing.
 */
const sectionPlacements = select(Instance, (i) =>
  i.and(i.in(i.assemblyKind, referringRoots), i.not(i.in(i.rootKind, referringRoots))),
);

/**
 * The content references, each under the law that resolves it: `check`, the law's check; `own`,
 * the relation of an item's or a test's references, resolved in its own document's declarations;
 * `names`, the relation of a section document's or a fragment's names; and `placed`, the relation
 * that resolves those names under each placement, in its assembly's declarations.
 */
const contentReferences = {
  "Context variable reference": {
    check: "Context_variable_reference",
    names: SectionContextName,
    own: ContextRef,
    ownDeclared: ContextRefDeclaration,
    placed: SectionContextRef,
    placedDeclared: SectionContextRefDeclaration,
  },
  "Feedback reference": {
    check: "Feedback_reference",
    names: SectionFeedbackName,
    own: FeedbackRef,
    ownDeclared: FeedbackRefDeclaration,
    placed: SectionFeedbackRef,
    placedDeclared: SectionFeedbackRefDeclaration,
  },
  "Printed variable reference": {
    check: "Printed_variable_reference",
    names: SectionPrintedName,
    own: PrintedVariableRef,
    ownDeclared: PrintedVariableRefDeclaration,
    placed: SectionPrintedRef,
    placedDeclared: SectionPrintedRefDeclaration,
  },
  "Template reference": {
    check: "Template_reference",
    names: SectionTemplateName,
    own: TemplateRef,
    ownDeclared: TemplateRefDeclaration,
    placed: SectionTemplateRef,
    placedDeclared: SectionTemplateRefDeclaration,
  },
} as const;

/**
 * A content reference of {@link contentReferences}.
 */
type ContentReferenceOf = (typeof contentReferences)[keyof typeof contentReferences];

/**
 * The declaration kinds `ContentReference` allows for each referring kind and attribute.
 */
const allowedDeclarationKinds = on(ContentReference, "kind", "attribute", "declaration");

/**
 * A content reference's row as a row check reads it: the fields every content reference relation
 * holds, of any of them.
 */
type ReferenceRow = RowScalars<{ readonly heading: typeof referenceFields; readonly name: string }>;

/**
 * The roots that hold built-in variables, each with the names of its built-ins, as the installed
 * `BuiltInVariable` holds them (spec reading 29): an item's are not a test's.
 */
const builtInRoots: readonly (readonly [Kind, readonly string[]])[] = [
  ...Map.groupBy(BuiltInVariable.rows, ({ root }) => root),
].map(([root, rows]) => [root, rows.map(({ variable }) => variable)] as const);

/**
 * Whether a reference names no built-in variable of the root of the assembly it resolves in.
 *
 * @param r - The reference's row.
 * @returns The predicate.
 */
const namesNoBuiltIn = (r: ReferenceRow) =>
  r.and(
    ...builtInRoots.map(([root, names]) =>
      r.or(r.ne(r.assemblyKind, root), r.not(r.in(r.identifier, names))),
    ),
  );

/**
 * Each built-in variable with the references that may name it under its root, one entry per
 * attribute: the kinds whose references by the attribute `ContentReference` lets name the
 * declaration kind the variable stands as there (`BuiltInVariable`, keyed by root and variable).
 */
const builtInReferrers = BuiltInVariable.rows.flatMap(({ declaration, root, variable }) =>
  [
    ...Map.groupBy(
      ContentReference.rows.filter((row) => row.declaration === declaration),
      ({ attribute }) => attribute,
    ),
  ].map(([attribute, rows]) => ({
    attribute,
    kinds: rows.map(({ kind }) => kind),
    root,
    variable,
  })),
);

/**
 * Whether a reference that names a built-in variable of its assembly's root is one that may name
 * it: its kind and attribute are a pair `ContentReference` lets name the declaration kind the
 * variable stands as under that root. A reference that names a built-in names no declaration, so
 * this is its whole resolution; a name that is a built-in of another root only is no built-in here,
 * and resolves as any other name does.
 *
 * @param r - The reference's row.
 * @returns The predicate.
 */
const namesAllowedBuiltIn = (r: ReferenceRow) =>
  r.or(
    namesNoBuiltIn(r),
    ...builtInReferrers.map(({ attribute, kinds, root, variable }) =>
      r.and(
        r.eq(r.assemblyKind, root),
        r.eq(r.identifier, variable),
        r.eq(r.attribute, attribute),
        r.in(r.kind, kinds),
      ),
    ),
  );

/**
 * State one content reference's law over its relations (lane NIL's NS2: a reference that names no
 * declaration has no declaration row, never a sentinel):
 *
 * - An own reference that names no built-in variable of its root has its declaration row, which is
 *   its own reference's, of a kind `ContentReference` allows, a declaration of its document through
 *   `declarationIdentifierRef`, whatever its cardinality spells (spec reading 159), and names no
 *   built-in of its root; one that names a built-in of its root names one it may;
 * - A placed reference is one of its document's names, and under its placement resolves the same way
 *   among its assembly's declarations.
 *
 * A name no declaration of an allowed kind holds has no declaration row, and the first containment
 * of each half refuses it under the law.
 *
 * @param reference - The content reference.
 * @returns The law's statements.
 */
const contentReferenceLaws = ({
  check: rule,
  names,
  own,
  ownDeclared,
  placed,
  placedDeclared,
}: ContentReferenceOf) => [
  contained(
    on(select(own, namesNoBuiltIn), "package", "path", "start", "attribute"),
    on(ownDeclared, "package", "path", "start", "attribute"),
  ),
  contained(
    on(ownDeclared, "package", "path", "start", "attribute", "kind", "assemblyKind", "identifier"),
    on(own, "package", "path", "start", "attribute", "kind", "assemblyKind", "identifier"),
  ),
  contained(on(ownDeclared, "kind", "attribute", "declarationKind"), allowedDeclarationKinds),
  contained(
    on(
      ownDeclared,
      "package",
      "path",
      "declaration",
      "identifier",
      "declarationKind",
      "baseTypes",
      "cardinalities",
    ),
    declarationIdentifierRef,
  ),
  check(rule, ownDeclared, namesNoBuiltIn),
  check(rule, own, namesAllowedBuiltIn),
  contained(
    on(placed, "package", "path", "start", "attribute", "kind", "identifier"),
    on(names, "package", "path", "start", "attribute", "kind", "identifier"),
  ),
  contained(
    on(select(placed, namesNoBuiltIn), "package", "assembly", "instance", "start", "attribute"),
    on(placedDeclared, "package", "assembly", "instance", "start", "attribute"),
  ),
  contained(
    on(
      placedDeclared,
      "package",
      "assembly",
      "instance",
      "start",
      "attribute",
      "assemblyKind",
      "kind",
      "path",
      "identifier",
    ),
    on(
      placed,
      "package",
      "assembly",
      "instance",
      "start",
      "attribute",
      "assemblyKind",
      "kind",
      "path",
      "identifier",
    ),
  ),
  contained(on(placedDeclared, "kind", "attribute", "declarationKind"), allowedDeclarationKinds),
  contained(
    on(
      placedDeclared,
      "package",
      "assembly",
      "declaration",
      "identifier",
      "declarationKind",
      "baseTypes",
      "cardinalities",
    ),
    declarationIdentifierRef,
  ),
  check(rule, placedDeclared, namesNoBuiltIn),
  check(rule, placed, namesAllowedBuiltIn),
];

/**
 * The fields of a bound variable's cardinality row that the gap half of "Binding cardinality"
 * reads, which {@link BindingCardinality} and {@link PlacedBindingCardinality} share.
 */
const gapCardinalityFields = {
  attribute: closedId(AttributeName),
  cardinality: closedId(Cardinality),
  gaps: natural,
  kind: closedId(NodeKind),
};

/**
 * A bound variable's cardinality row, an item's own or one in place, as the gap half of "Binding
 * cardinality" reads it.
 */
type GapCardinalityRow = RowScalars<{
  readonly heading: typeof gapCardinalityFields;
  readonly name: string;
}>;

/**
 * Whether a binding holds to spec reading 169: a gap match's response is single only where it has
 * at most one gap, its own and those an include places in it ("The GapMatchInteraction must be
 * bound to a response variable with base-type directedPair and either single or multiple
 * cardinality, depending on the number of gaps", §5.57).
 *
 * @param r - The binding's cardinality row.
 * @returns The predicate.
 */
const singleGap = (r: GapCardinalityRow) =>
  r.or(
    r.ne(r.attribute, "response-identifier"),
    r.ne(r.kind, gapMatchKind),
    r.ne(r.cardinality, "single"),
    r.le(r.gaps, 1n),
  );

/**
 * The bindings whose variable has a cardinality and a base type: each has its
 * {@link BindingBaseType}, and only these do.
 */
const typedBindings = select(BindingCardinality, (r) => r.eq(r.baseTypes, 1n));

/**
 * The placed bindings whose variable has a cardinality and a base type: each has its
 * {@link PlacedBindingBaseType}, and only these do.
 */
const typedPlacedBindings = select(PlacedBindingCardinality, (r) => r.eq(r.baseTypes, 1n));

/**
 * The cardinalities a feedback element's outcome may have (§5.49.1, §5.52.1: "an outcome variable
 * of base-type identifier and single or multiple cardinality"): a record's is none of them, so
 * its whole value is judged by its cardinality alone.
 */
const feedbackCardinalities = ["single", "multiple"] as const;

/**
 * The declarations whose base type is `identifier`, a feedback outcome's, where the declaration has
 * a base type: the target of `Feedback_outcome_type`'s containment over a feedback reference's
 * declaration, and of `Template_variable_type`'s over a template reference's that is no template
 * variable's.
 */
const identifierTyped = on(
  select(DeclarationBaseType, (b) => b.eq(b.baseType, "identifier")),
  "package",
  "path",
  "start",
);

/**
 * A document's context interaction (spec reading 117): the document, then the document and
 * position its context's nearest interaction stands at, `Document.contextPath` and
 * `contextNearest`. A choice's or a hottext's nearest is a position in its own document, or, where
 * no interaction of its document encloses it, its document's context's: so a row that names its
 * nearest in another document names its document's context.
 */
const onContext = on(Document, "package", "path", "contextPath", "contextNearest");

/**
 * Every statement over the O3 overlays, each `check` named by its oracle law:
 *
 * - **the read attributes:** one copy from `Attribute` with the key that serves it, and the copy's
 *   reverse, so `InteractionAttribute` holds exactly the attributes O3 reads; each one's root kind
 *   its document's; `E1_derived`, its value its lexical form collapsed.
 * - **bindings in place** (spec reading 117): each interaction's binding attributes in every document
 *   ({@link BindingName}), counted per document; under each instance of an item's assembly, as many
 *   {@link PlacedBinding} rows as its document has binding attributes, each its document's and
 *   resolved among the item's declarations, under the item's own laws: "Binding declared",
 *   "BindingFit", "Binding unique" over the assembly (a fragment placed twice in one item binds its
 *   responses twice, as its merged document does), "Binding cardinality" and "AdaptiveFeedback",
 *   whose feedback ancestry an included fragment inherits from its context.
 * - **interactions:** each interaction's {@link Interaction} (its place's, of an interaction kind),
 *   the owner of its choices.
 * - **bindings:** each interaction's {@link Binding}, where it writes a `response-identifier` (its
 *   place's, the part of its {@link Interaction}, exactly where the attribute is read); each item
 *   binding's {@link BoundVariable}, which has its {@link BindingDeclaration} ("Binding declared",
 *   reading 75), a response declaration's whatever its cardinality spells (reading 159), whose
 *   fields are the binding's and back, and where the declaration has a cardinality its
 *   {@link BindingCardinality}, copied from `DeclarationCardinality`; each declaration of a type
 *   `BindingFit` or `RecordBindingFit` admits, the custom, portable custom and order interactions
 *   of any type (spec reading 172), and a string binding's of base type string ("BindingFit"), each
 *   fit law over the cardinality and base type rows alone; "Binding unique" (`key(package, path,
 *   identifier)`); "Binding cardinality" (a single response takes a most of 1, where its
 *   interaction's most has a value, and a gap match of at most one gap, its cardinality row's
 *   `gaps` copied from `Interaction`, spec reading 169); `max-strings-required`, which carries
 *   `kind` beside its place so that its containment into `CountBound` is a statement of its own,
 *   not "Binding cardinality"'s: a refusal names a law by its relations and terms, never its
 *   selection (C22); and "AdaptiveFeedback", an interaction inside feedback is in an adaptive
 *   item.
 * - **choices:** each choice's {@link ChoiceInteraction}, which every choice has ("N8 nearest"), its
 *   interaction the choice's nearest, in its own document or its document's context
 *   (`Document.contextPath` and `contextNearest`, spec reading 117), the counted family under
 *   `Interaction`; each gap's {@link GapInteraction}, which every gap has ("N8 nearest" too, so a
 *   gap no interaction encloses breaks that law alone), a copy of its choice interaction counted
 *   under `Interaction`; its identifier distinct among its document's choices of its kind; each
 *   hottext's nearest kind, and its identifier distinct among its document's hottexts (reading
 *   104); and in place (spec reading 117), under each instance of each assembly, as many
 *   {@link PlacedChoice} and {@link PlacedHottext} rows as its document has choices and hottexts,
 *   each its document's, their identifiers distinct over the assembly. Across the classes, "Choice
 *   identifier key" holds each name to one choice or hottext, in the document and over its
 *   assembly, and "Choice not variable" each to no variable of its document, both rules over
 *   queries (`#pantry/qti/queries.ts`, reading 104).
 * - **the default hotspot** (reading 80): `default_hotspot_last_slot` and
 *   `Graphic_gap_match_default_hotspot` over each hotspot's shape, its rank and its parent's
 *   count.
 * - **counts:** each bound's counts written or defaulted, a row of its own where it has a value,
 *   typed by G-parse (`E1_derived`), and "Choice bounds" over the values a count has.
 * - **ranges:** "Slider bounds" (reading 9, the Schematron's 14Ba), the bounds collapsed and ordered
 *   as `xs:double` values by `doublesInOrder` of `#pantry/qti/declarations.ts`. And "Aria value
 *   range" over the elements that carry both ARIA bounds, each value collapsed and read where it is
 *   in `xs:decimal`'s lexical space, grizzle's `decimalText`, the language pantry's own value
 *   domain admits (`decimalLexical` of `#pantry/grammar/domains.ts`): the decimal it names, exactly
 *   and of any digits, by grizzle's `Compute.parseDecimal` (XML Schema 1.1's decimalLexicalMap,
 *   Part 2 §3.3.3.1), so a value past 256 integer or 255 fraction digits is ordered as any other. A
 *   pair with a value that is no `xs:decimal` holds the law by its own arm, since its value domain
 *   alone refuses it; each parse's otherwise is never read, since that arm holds wherever its guard
 *   fails. A value is a `keyText`, at most `keyTextBytes`, below the 16,384 bytes the parse reads
 *   (`decimalTextMaxBytes`), and a match guard keeps its subject's byte bound in its branch, so the
 *   parse needs no byte guard (grizzle's README, "Parsing text", `Compute.parseDecimal`).
 * - **section documents' and fragments' references:** each one's row, counted per document and class;
 *   one placement row per instance of an item's or a test's assembly whose document is neither, a
 *   section document's or a fragment's (spec reading 117), counting as many resolutions of each
 *   class as its document has references; each resolution its placement's and its reference's,
 *   resolved in the assembly's declarations or to a built-in of its root, its kind
 *   `SectionScope.assemblyKind`, `Instance`'s, under "Feedback reference" and "Feedback outcome
 *   type", "Printed variable reference", "Template reference" and "Template variable type" or
 *   "Context variable reference".
 * - **content references:** each relation's rows are its source's, its `assemblyKind` its document's
 *   root kind; a name that is no built-in's of that root has its declaration row, the reference's,
 *   of a declaration kind `ContentReference` allows for its kind and attribute, a declaration
 *   through `declarationIdentifierRef` whatever its cardinality spells (spec reading 159); and a
 *   built-in's of that root is one its kind and attribute may name there, under its reference's law
 *   ("Feedback reference", "Template reference", "Printed variable reference", "Context variable
 *   reference"); "Feedback outcome type" (reading 77: an outcome of base type identifier, single or
 *   multiple; the one built-in a feedback may name, `completionStatus`, is a single identifier,
 *   §2.2.2.3), its cardinality half over the feedback's cardinality rows
 *   ({@link FeedbackRefCardinality}, {@link SectionFeedbackRefCardinality}), each where the outcome
 *   has a cardinality, and its base type half over the declaration rows where it has a base type;
 *   and "Template variable type" (reading R15-l: a template element's or a choice's template
 *   variable of base type identifier, single or multiple, a portable custom interaction's free),
 *   its halves read the same way, the cardinality half over {@link TemplateRefCardinality} and
 *   {@link SectionTemplateRefCardinality} (decision 432).
 */
export const interactionLawsByName = {
  ...pipe(contentReferences, Rec.map(contentReferenceLaws)),
  "Adaptive feedback": [
    contained(
      on(
        select(BoundVariable, (r) =>
          r.and(r.eq(r.attribute, "response-identifier"), r.eq(r.adaptive, false)),
        ),
        "package",
        "path",
        "start",
      ),
      on(outsideFeedback, "package", "path", "start"),
    ),
    contained(
      on(
        select(PlacedBinding, (r) =>
          r.and(r.eq(r.attribute, "response-identifier"), r.eq(r.adaptive, false)),
        ),
        "package",
        "path",
        "start",
      ),
      on(outsideFeedback, "package", "path", "start"),
    ),
  ],
  "Aria value range": [
    check("Aria_value_range", AriaRange, (r) =>
      r.or(
        r.not(Compute.matches(r.min, decimalText)),
        r.not(Compute.matches(r.max, decimalText)),
        r.le(
          Compute.when(Compute.matches(r.min, decimalText), (min) => Compute.parseDecimal(min), 0n),
          Compute.when(Compute.matches(r.max, decimalText), (max) => Compute.parseDecimal(max), 0n),
        ),
      ),
    ),
  ],
  "Binding cardinality": [
    contained(
      on(
        select(BindingCardinality, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.in(r.kind, cardinalityKinds),
            r.eq(r.cardinality, "single"),
            r.eq(r.mosts, 1n),
          ),
        ),
        "package",
        "path",
        "start",
      ),
      on(
        select(MostCount, (m) => m.eq(m.mostValue, 1n)),
        "package",
        "path",
        "start",
      ),
    ),
    contained(
      on(
        select(PlacedBindingCardinality, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.in(r.kind, cardinalityKinds),
            r.eq(r.cardinality, "single"),
            r.eq(r.mosts, 1n),
          ),
        ),
        "package",
        "path",
        "start",
      ),
      on(
        select(MostCount, (m) => m.eq(m.mostValue, 1n)),
        "package",
        "path",
        "start",
      ),
    ),
    check("Binding_cardinality", BindingCardinality, singleGap),
    check("Binding_cardinality", PlacedBindingCardinality, singleGap),
  ],
  "Binding declared": [
    contained(
      on(BoundVariable, "package", "path", "start", "attribute", "kind", "identifier"),
      on(BindingDeclaration, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    contained(
      on(
        BindingDeclaration,
        "package",
        "path",
        "declaration",
        "identifier",
        "declarationKind",
        "baseTypes",
        "cardinalities",
      ),
      declarationIdentifierRef,
    ),
    check("Binding_declared", BindingDeclaration, (r) =>
      r.eq(r.declarationKind, "qti-response-declaration"),
    ),
    contained(
      on(
        select(BindingDeclaration, (r) => r.eq(r.cardinalities, 1n)),
        "package",
        "path",
        "start",
        "attribute",
      ),
      on(BindingCardinality, "package", "path", "start", "attribute"),
    ),
    contained(
      on(
        BindingCardinality,
        "package",
        "path",
        "start",
        "attribute",
        "kind",
        "declaration",
        "baseTypes",
      ),
      on(
        BindingDeclaration,
        "package",
        "path",
        "start",
        "attribute",
        "kind",
        "declaration",
        "baseTypes",
      ),
    ),
    contained(
      on(BindingCardinality, "package", "path", "declaration", "cardinality"),
      on(DeclarationCardinality, "package", "path", "start", "cardinality"),
    ),
    contained(
      on(typedBindings, "package", "path", "start", "attribute"),
      on(BindingBaseType, "package", "path", "start", "attribute"),
    ),
    contained(
      on(
        BindingBaseType,
        "package",
        "path",
        "start",
        "attribute",
        "declaration",
        "cardinality",
        "kind",
      ),
      on(
        typedBindings,
        "package",
        "path",
        "start",
        "attribute",
        "declaration",
        "cardinality",
        "kind",
      ),
    ),
    contained(
      on(BindingBaseType, "package", "path", "declaration", "baseType"),
      on(DeclarationBaseType, "package", "path", "start", "baseType"),
    ),
    contained(
      on(
        PlacedBinding,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "path",
        "kind",
        "identifier",
      ),
      on(
        PlacedBindingDeclaration,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "path",
        "kind",
        "identifier",
      ),
    ),
    contained(
      on(
        PlacedBindingDeclaration,
        "package",
        "assembly",
        "declaration",
        "identifier",
        "declarationKind",
        "baseTypes",
        "cardinalities",
      ),
      declarationIdentifierRef,
    ),
    check("Binding_declared", PlacedBindingDeclaration, (r) =>
      r.eq(r.declarationKind, "qti-response-declaration"),
    ),
    contained(
      on(
        select(PlacedBindingDeclaration, (r) => r.eq(r.cardinalities, 1n)),
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
      ),
      on(PlacedBindingCardinality, "package", "assembly", "instance", "start", "attribute"),
    ),
    contained(
      on(
        PlacedBindingCardinality,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "path",
        "kind",
        "declaration",
        "baseTypes",
      ),
      on(
        PlacedBindingDeclaration,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "path",
        "kind",
        "declaration",
        "baseTypes",
      ),
    ),
    contained(
      on(PlacedBindingCardinality, "package", "assembly", "declaration", "cardinality"),
      on(DeclarationCardinality, "package", "path", "start", "cardinality"),
    ),
    contained(
      on(typedPlacedBindings, "package", "assembly", "instance", "start", "attribute"),
      on(PlacedBindingBaseType, "package", "assembly", "instance", "start", "attribute"),
    ),
    contained(
      on(
        PlacedBindingBaseType,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "declaration",
        "cardinality",
        "kind",
      ),
      on(
        typedPlacedBindings,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "declaration",
        "cardinality",
        "kind",
      ),
    ),
    contained(
      on(PlacedBindingBaseType, "package", "assembly", "declaration", "baseType"),
      on(DeclarationBaseType, "package", "path", "start", "baseType"),
    ),
  ],
  "Binding unique": [
    key(on(BoundVariable, "package", "path", "identifier")),
    key(on(PlacedBinding, "package", "assembly", "identifier")),
  ],
  BindingFit: [
    contained(
      on(
        select(BindingBaseType, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.ne(r.cardinality, "record"),
            r.not(r.in(r.kind, anyTypeKinds)),
          ),
        ),
        "baseType",
        "cardinality",
        "kind",
      ),
      on(BindingFit, "baseType", "cardinality", "kind"),
    ),
    // A string identifier's variable is "of base-type string" (§5.48.2, §5.162.3), which a record,
    // having no base type, is not: its whole value is judged by its cardinality alone, and a
    // typed variable's base type by its `BindingBaseType`.
    check("BindingFit", BindingCardinality, (r) =>
      r.or(r.ne(r.attribute, "string-identifier"), r.ne(r.cardinality, "record")),
    ),
    check("BindingFit", BindingBaseType, (r) =>
      r.or(r.ne(r.attribute, "string-identifier"), r.eq(r.baseType, "string")),
    ),
    contained(
      on(
        select(PlacedBindingBaseType, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.ne(r.cardinality, "record"),
            r.not(r.in(r.kind, anyTypeKinds)),
          ),
        ),
        "baseType",
        "cardinality",
        "kind",
      ),
      on(BindingFit, "baseType", "cardinality", "kind"),
    ),
    check("BindingFit", PlacedBindingCardinality, (r) =>
      r.or(r.ne(r.attribute, "string-identifier"), r.ne(r.cardinality, "record")),
    ),
    check("BindingFit", PlacedBindingBaseType, (r) =>
      r.or(r.ne(r.attribute, "string-identifier"), r.eq(r.baseType, "string")),
    ),
  ],
  "Choice bounds": [
    check("Choice_bounds", LeastCount, leastBounds),
    check("Choice_bounds", MostCount, mostBounds),
    check("Choice_bounds", CountRange, rangeBounds),
  ],
  "Choice identifier key": [
    key(on(Choice, "package", "path", "kind", "identifier")),
    key(on(Hottext, "package", "path", "identifier")),
    key(on(PlacedChoice, "package", "assembly", "kind", "identifier")),
    key(on(PlacedHottext, "package", "assembly", "identifier")),
  ],
  "Custom interaction version": [
    check("Custom_interaction_version", Interaction, (i) =>
      i.or(i.ne(i.kind, customKind), i.ne(i.version, "3.0.0")),
    ),
  ],
  "E1 derived": [
    contained(
      on(read, "package", "path", "start", "name", "kind", "lexical"),
      on(InteractionAttribute, "package", "path", "start", "name", "kind", "lexical"),
    ),
    contained(
      on(InteractionAttribute, "package", "path", "start", "name"),
      on(read, "package", "path", "start", "name"),
    ),
    contained(
      on(InteractionAttribute, "package", "path", "rootKind"),
      on(Document, "package", "path", "rootKind"),
    ),
    contained(
      on(Interaction, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    check("E1_derived", Interaction, (i) => i.in(i.kind, interactionKinds)),
    contained(
      on(Binding, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    key(on(moduleElements, "package", "path", "parent")),
    contained(
      on(moduleAttributes, "package", "path", "start"),
      on(attributeForms, "package", "path", "start"),
    ),
    contained(
      on(attributeForms, "package", "path", "start"),
      on(moduleAttributes, "package", "path", "start"),
    ),
    contained(
      on(moduleElements, "package", "path", "parent"),
      on(elementForms, "package", "path", "start"),
    ),
    contained(
      on(elementForms, "package", "path", "start"),
      on(moduleElements, "package", "path", "parent"),
    ),
    pciModuleFamily,
    contained(
      on(GapInteraction, "package", "path", "start"),
      on(gapChoices, "package", "path", "start"),
    ),
    contained(
      on(GapInteraction, "package", "path", "start", "interactionPath", "interaction"),
      on(ChoiceInteraction, "package", "path", "start", "interactionPath", "interaction"),
    ),
    gapFamily,
    contained(on(Binding, "package", "path", "start"), on(Interaction, "package", "path", "start")),
    key(on(responseIdentifiers, "package", "path", "start")),
    mirrors(
      on(responseIdentifiers, "package", "path", "start"),
      on(Binding, "package", "path", "start"),
    ),
    check("E1_derived", Binding, (b) => b.in(b.kind, interactionKinds)),
    contained(
      on(itemBindings, "package", "path", "start", "name", "kind", "value"),
      on(BoundVariable, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    contained(
      on(BoundVariable, "package", "path", "start", "kind"),
      on(Binding, "package", "path", "start", "kind"),
    ),
    contained(
      on(BindingDeclaration, "package", "path", "start", "attribute"),
      on(BoundVariable, "package", "path", "start", "attribute"),
    ),
    contained(
      on(BoundVariable, "package", "path", "adaptive"),
      on(ItemMode, "package", "path", "adaptive"),
    ),
    contained(
      on(namedBindings, "package", "path", "start", "name", "kind", "value"),
      on(BindingName, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    contained(
      on(BindingName, "package", "path", "start", "kind"),
      on(Binding, "package", "path", "start", "kind"),
    ),
    bindingNameFamily,
    placedBindingFamily,
    contained(
      on(PlacedBinding, "package", "assembly", "instance", "path"),
      on(itemInstances, "package", "assembly", "start", "document"),
    ),
    contained(
      on(PlacedBinding, "package", "path", "start", "attribute", "kind", "identifier"),
      on(BindingName, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    contained(
      on(PlacedBindingDeclaration, "package", "assembly", "instance", "start", "attribute"),
      on(PlacedBinding, "package", "assembly", "instance", "start", "attribute"),
    ),
    contained(
      on(PlacedBinding, "package", "assembly", "adaptive"),
      on(ItemMode, "package", "path", "adaptive"),
    ),
    key(on(adaptiveTrue, "package", "path")),
    contained(
      on(
        select(ItemMode, (m) => m.eq(m.adaptive, true)),
        "package",
        "path",
      ),
      on(adaptiveTrue, "package", "path"),
    ),
    contained(
      on(adaptiveTrue, "package", "path"),
      on(
        select(ItemMode, (m) => m.eq(m.adaptive, true)),
        "package",
        "path",
      ),
    ),
    contained(
      on(readOf(["identifier"], choiceKinds), "package", "path", "start", "value"),
      on(Choice, "package", "path", "start", "identifier"),
    ),
    check("E1_derived", Choice, (c) => c.in(c.kind, choiceKinds)),
    contained(
      on(Hottext, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(readOf(["identifier"], [hottextKind]), "package", "path", "start", "value"),
      on(Hottext, "package", "path", "start", "identifier"),
    ),
    check("E1_derived", Hottext, (h) =>
      h.and(
        h.eq(h.kind, hottextKind),
        h.or(
          h.and(h.eq(h.nearest, 0n), h.eq(h.nearestKind, "document")),
          h.and(h.ne(h.nearest, 0n), h.in(h.nearestKind, interactionKinds)),
        ),
      ),
    ),
    documentChoiceFamily,
    documentHottextFamily,
    placedChoiceFamily,
    placedHottextFamily,
    contained(
      on(PlacedChoice, "package", "assembly", "instance", "path"),
      on(Instance, "package", "assembly", "start", "document"),
    ),
    contained(
      on(PlacedChoice, "package", "path", "start", "kind", "identifier"),
      on(Choice, "package", "path", "start", "kind", "identifier"),
    ),
    contained(
      on(PlacedHottext, "package", "assembly", "instance", "path"),
      on(Instance, "package", "assembly", "start", "document"),
    ),
    contained(
      on(PlacedHottext, "package", "path", "start", "identifier"),
      on(Hottext, "package", "path", "start", "identifier"),
    ),
    contained(
      on(Hotspot, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(readOf(["shape"], hotspotKinds), "package", "path", "start", "value"),
      on(Hotspot, "package", "path", "start", "area"),
    ),
    contained(
      on(Hotspot, "package", "path", "parent", "parentKind"),
      on(Interaction, "package", "path", "start", "kind"),
    ),
    contained(on(Hotspot, "package", "path", "start", "elements", "elementChildren"), nodeCounts),
    contained(
      on(Hotspot, "package", "path", "parent", "parentElements", "parentElementChildren"),
      nodeCounts,
    ),
    check("E1_derived", Hotspot, (h) => h.in(h.kind, hotspotKinds)),
    contained(
      on(CountBound, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Interaction, (i) => i.in(i.kind, boundKinds)),
        "package",
        "path",
        "start",
      ),
      on(CountBound, "package", "path", "start"),
    ),
    contained(
      on(
        select(Choice, (c) => c.in(c.kind, boundKinds)),
        "package",
        "path",
        "start",
      ),
      on(CountBound, "package", "path", "start"),
    ),
    mirrors(
      on(readOf(minNames, boundKinds), "package", "path", "start", "name"),
      on(
        select(CountBound, (b) => b.eq(b.minWritten, true)),
        "package",
        "path",
        "start",
        "minName",
      ),
    ),
    mirrors(
      on(readOf(maxNames, boundKinds), "package", "path", "start", "name"),
      on(
        select(CountBound, (b) => b.eq(b.maxWritten, true)),
        "package",
        "path",
        "start",
        "maxName",
      ),
    ),
    contained(
      on(
        select(CountBound, (b) => b.in(b.kind, interactionKinds)),
        "package",
        "path",
        "start",
        "choices",
      ),
      on(Interaction, "package", "path", "start", "choices"),
    ),
    check("E1_derived", CountBound, (b) =>
      b.and(
        b.eq(b.minName, ChoiceBound.at("min", b.kind)),
        b.eq(b.maxName, ChoiceBound.at("max", b.kind)),
        b.or(b.in(b.kind, interactionKinds), b.eq(b.choices, 0n)),
      ),
    ),
    leastCountFamily,
    contained(
      on(
        LeastCount,
        "package",
        "path",
        "start",
        "kind",
        "version",
        "minName",
        "minWritten",
        "choices",
      ),
      on(
        CountBound,
        "package",
        "path",
        "start",
        "kind",
        "version",
        "minName",
        "minWritten",
        "choices",
      ),
    ),
    mirrors(
      on(integerReadOf(minNames), "package", "path", "start", "name", "value"),
      on(
        select(LeastCount, (l) => l.eq(l.minWritten, true)),
        "package",
        "path",
        "start",
        "minName",
        "least",
      ),
    ),
    contained(
      on(
        select(CountBound, (b) => b.and(b.eq(b.minWritten, false), hasDefault(b, defaultedLeast))),
        "package",
        "path",
        "start",
      ),
      on(LeastCount, "package", "path", "start"),
    ),
    check("E1_derived", LeastCount, (l) =>
      l.and(
        Compute.matches(l.least, countSign),
        Compute.matches(l.least, bigintForm),
        l.eq(
          l.leastValue,
          Compute.when(
            Compute.matches(l.least, bigintForm),
            (least) => Compute.cast(least, pg.bigint),
            0n,
          ),
        ),
        l.or(
          l.eq(l.minWritten, true),
          ...defaultedLeast.map(({ kinds, value, version }) =>
            l.and(l.eq(l.version, version), l.in(l.kind, kinds), l.eq(l.least, value)),
          ),
        ),
      ),
    ),
    mostCountFamily,
    contained(
      on(
        MostCount,
        "package",
        "path",
        "start",
        "kind",
        "version",
        "maxName",
        "maxWritten",
        "minWritten",
        "choices",
      ),
      on(
        CountBound,
        "package",
        "path",
        "start",
        "kind",
        "version",
        "maxName",
        "maxWritten",
        "minWritten",
        "choices",
      ),
    ),
    mirrors(
      on(integerReadOf(maxNames), "package", "path", "start", "name", "value"),
      on(
        select(MostCount, (m) => m.eq(m.maxWritten, true)),
        "package",
        "path",
        "start",
        "maxName",
        "most",
      ),
    ),
    contained(
      on(
        select(CountBound, (b) => b.and(b.eq(b.maxWritten, false), hasDefault(b, defaultedMost))),
        "package",
        "path",
        "start",
      ),
      on(MostCount, "package", "path", "start"),
    ),
    check("E1_derived", MostCount, (m) =>
      m.and(
        Compute.matches(m.most, countSign),
        Compute.matches(m.most, bigintForm),
        m.eq(
          m.mostValue,
          Compute.when(
            Compute.matches(m.most, bigintForm),
            (most) => Compute.cast(most, pg.bigint),
            0n,
          ),
        ),
        m.or(
          m.eq(m.maxWritten, true),
          ...defaultedMost.map(({ kinds, value, version }) =>
            m.and(m.eq(m.version, version), m.in(m.kind, kinds), m.eq(m.most, value)),
          ),
        ),
      ),
    ),
    contained(
      on(
        select(CountBound, (b) => b.and(b.eq(b.leasts, 1n), b.eq(b.mosts, 1n))),
        "package",
        "path",
        "start",
      ),
      on(CountRange, "package", "path", "start"),
    ),
    contained(
      on(CountRange, "package", "path", "start", "leastValue"),
      on(LeastCount, "package", "path", "start", "leastValue"),
    ),
    contained(
      on(CountRange, "package", "path", "start", "mostValue", "kind", "minWritten"),
      on(MostCount, "package", "path", "start", "mostValue", "kind", "minWritten"),
    ),
    contained(
      on(
        select(BindingCardinality, (r) => r.in(r.kind, boundKinds)),
        "package",
        "path",
        "start",
        "mosts",
      ),
      on(CountBound, "package", "path", "start", "mosts"),
    ),
    check("E1_derived", BindingCardinality, (r) =>
      r.or(r.in(r.kind, boundKinds), r.eq(r.mosts, 0n)),
    ),
    contained(
      on(
        select(PlacedBindingCardinality, (r) => r.in(r.kind, boundKinds)),
        "package",
        "path",
        "start",
        "mosts",
      ),
      on(CountBound, "package", "path", "start", "mosts"),
    ),
    check("E1_derived", PlacedBindingCardinality, (r) =>
      r.or(r.in(r.kind, boundKinds), r.eq(r.mosts, 0n)),
    ),
    contained(
      on(BindingCardinality, "package", "path", "start", "gaps"),
      on(Interaction, "package", "path", "start", "gaps"),
    ),
    contained(
      on(PlacedBindingCardinality, "package", "path", "start", "gaps"),
      on(Interaction, "package", "path", "start", "gaps"),
    ),
    contained(
      on(readOf(["lower-bound"], [sliderKind]), "package", "path", "start", "value"),
      on(Slider, "package", "path", "start", "lower"),
    ),
    contained(
      on(readOf(["upper-bound"], [sliderKind]), "package", "path", "start", "value"),
      on(Slider, "package", "path", "start", "upper"),
    ),
    contained(
      on(Slider, "package", "path", "start", "lower"),
      on(
        select(InteractionAttribute, (v) => v.eq(v.name, "lower-bound")),
        "package",
        "path",
        "start",
        "value",
      ),
    ),
    contained(
      on(
        select(InteractionAttribute, (v) => v.in(v.name, ariaNames)),
        "package",
        "path",
        "start",
        "name",
        "value",
      ),
      on(AriaValue, "package", "path", "start", "name", "value"),
    ),
    contained(
      on(AriaValue, "package", "path", "start", "name", "value"),
      on(InteractionAttribute, "package", "path", "start", "name", "value"),
    ),
    ariaValueFamily,
    check("E1_derived", AriaElement, (e) => e.gt(e.values, 0n)),
    contained(
      on(
        select(AriaElement, (e) => e.eq(e.values, 2n)),
        "package",
        "path",
        "start",
      ),
      on(AriaRange, "package", "path", "start"),
    ),
    contained(
      on(AriaRange, "package", "path", "start", "min"),
      on(
        select(AriaValue, (a) => a.eq(a.name, "aria-valuemin")),
        "package",
        "path",
        "start",
        "value",
      ),
    ),
    contained(
      on(AriaRange, "package", "path", "start", "max"),
      on(
        select(AriaValue, (a) => a.eq(a.name, "aria-valuemax")),
        "package",
        "path",
        "start",
        "value",
      ),
    ),
    contained(
      on(
        referenceSources.feedback,
        "package",
        "path",
        "start",
        "name",
        "kind",
        "rootKind",
        "value",
      ),
      on(
        FeedbackRef,
        "package",
        "path",
        "start",
        "attribute",
        "kind",
        "assemblyKind",
        "identifier",
      ),
    ),
    contained(
      on(
        referenceSources.template,
        "package",
        "path",
        "start",
        "name",
        "kind",
        "rootKind",
        "value",
      ),
      on(
        TemplateRef,
        "package",
        "path",
        "start",
        "attribute",
        "kind",
        "assemblyKind",
        "identifier",
      ),
    ),
    contained(
      on(referenceSources.printed, "package", "path", "start", "name", "kind", "rootKind", "value"),
      on(
        PrintedVariableRef,
        "package",
        "path",
        "start",
        "attribute",
        "kind",
        "assemblyKind",
        "identifier",
      ),
    ),
    contained(
      on(referenceSources.context, "package", "path", "start", "name", "kind", "rootKind", "value"),
      on(ContextRef, "package", "path", "start", "attribute", "kind", "assemblyKind", "identifier"),
    ),
    contained(
      on(sectionSources.feedback, "package", "path", "start", "name", "kind", "value"),
      on(SectionFeedbackName, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    contained(
      on(sectionSources.printed, "package", "path", "start", "name", "kind", "value"),
      on(SectionPrintedName, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    contained(
      on(sectionSources.template, "package", "path", "start", "name", "kind", "value"),
      on(SectionTemplateName, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    contained(
      on(sectionSources.context, "package", "path", "start", "name", "kind", "value"),
      on(SectionContextName, "package", "path", "start", "attribute", "kind", "identifier"),
    ),
    sectionFeedbackNameFamily,
    sectionPrintedNameFamily,
    sectionTemplateNameFamily,
    sectionContextNameFamily,
    contained(
      on(sectionPlacements, "package", "assembly", "start", "document", "assemblyKind"),
      on(SectionScope, "package", "assembly", "instance", "document", "assemblyKind"),
    ),
    contained(
      on(SectionScope, "package", "assembly", "instance", "document", "assemblyKind"),
      on(Instance, "package", "assembly", "start", "document", "assemblyKind"),
    ),
    contained(
      on(SectionScope, "package", "document", "feedbacks", "prints", "templates", "contexts"),
      on(ReferringDocument, "package", "path", "feedbacks", "prints", "templates", "contexts"),
    ),
    sectionFeedbackFamily,
    sectionPrintedFamily,
    sectionTemplateFamily,
    sectionContextFamily,
    contained(
      on(SectionFeedbackRef, "package", "assembly", "instance", "path", "assemblyKind"),
      on(SectionScope, "package", "assembly", "instance", "document", "assemblyKind"),
    ),
    contained(
      on(SectionPrintedRef, "package", "assembly", "instance", "path", "assemblyKind"),
      on(SectionScope, "package", "assembly", "instance", "document", "assemblyKind"),
    ),
    contained(
      on(SectionTemplateRef, "package", "assembly", "instance", "path", "assemblyKind"),
      on(SectionScope, "package", "assembly", "instance", "document", "assemblyKind"),
    ),
    contained(
      on(SectionContextRef, "package", "assembly", "instance", "path", "assemblyKind"),
      on(SectionScope, "package", "assembly", "instance", "document", "assemblyKind"),
    ),
  ],
  "Feedback outcome type": [
    // Each half judges the outcome where what it reads spells something (spec readings 158 and
    // 159): its cardinality, where it has one, its reference's cardinality row's, copied from its
    // declaration row and `DeclarationCardinality`; its base type, where it has one, its
    // `DeclarationBaseType`'s.
    contained(
      on(
        select(FeedbackRefDeclaration, (r) => r.eq(r.cardinalities, 1n)),
        "package",
        "path",
        "start",
        "attribute",
      ),
      on(FeedbackRefCardinality, "package", "path", "start", "attribute"),
    ),
    contained(
      on(FeedbackRefCardinality, "package", "path", "start", "attribute", "declaration"),
      on(FeedbackRefDeclaration, "package", "path", "start", "attribute", "declaration"),
    ),
    contained(
      on(FeedbackRefCardinality, "package", "path", "declaration", "cardinality"),
      on(DeclarationCardinality, "package", "path", "start", "cardinality"),
    ),
    check("Feedback_outcome_type", FeedbackRefCardinality, (r) =>
      r.in(r.cardinality, feedbackCardinalities),
    ),
    contained(
      on(
        select(FeedbackRefDeclaration, (r) => r.eq(r.baseTypes, 1n)),
        "package",
        "path",
        "declaration",
      ),
      identifierTyped,
    ),
    contained(
      on(
        select(SectionFeedbackRefDeclaration, (r) => r.eq(r.cardinalities, 1n)),
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
      ),
      on(SectionFeedbackRefCardinality, "package", "assembly", "instance", "start", "attribute"),
    ),
    contained(
      on(
        SectionFeedbackRefCardinality,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "declaration",
      ),
      on(
        SectionFeedbackRefDeclaration,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "declaration",
      ),
    ),
    contained(
      on(SectionFeedbackRefCardinality, "package", "assembly", "declaration", "cardinality"),
      on(DeclarationCardinality, "package", "path", "start", "cardinality"),
    ),
    check("Feedback_outcome_type", SectionFeedbackRefCardinality, (r) =>
      r.in(r.cardinality, feedbackCardinalities),
    ),
    contained(
      on(
        select(SectionFeedbackRefDeclaration, (r) => r.eq(r.baseTypes, 1n)),
        "package",
        "assembly",
        "declaration",
      ),
      identifierTyped,
    ),
  ],
  "Graphic gap match default hotspot": [
    check("Graphic_gap_match_default_hotspot", Hotspot, (h) =>
      h.or(
        h.ne(h.kind, "qti-associable-hotspot"),
        h.ne(h.parentKind, graphicGapMatch),
        h.ne(h.area, defaultArea),
      ),
    ),
  ],
  "Max strings required": [
    contained(
      on(
        select(BindingCardinality, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.eq(r.kind, extendedTextKind),
            r.in(r.cardinality, ["multiple", "ordered"]),
          ),
        ),
        "package",
        "path",
        "start",
        "kind",
      ),
      on(
        select(CountBound, (b) => b.eq(b.maxWritten, true)),
        "package",
        "path",
        "start",
        "kind",
      ),
    ),
    contained(
      on(
        select(PlacedBindingCardinality, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.eq(r.kind, extendedTextKind),
            r.in(r.cardinality, ["multiple", "ordered"]),
          ),
        ),
        "package",
        "path",
        "start",
        "kind",
      ),
      on(
        select(CountBound, (b) => b.eq(b.maxWritten, true)),
        "package",
        "path",
        "start",
        "kind",
      ),
    ),
  ],
  "N8 nearest": [
    contained(
      on(Choice, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(Choice, "package", "path", "start"),
      on(ChoiceInteraction, "package", "path", "start"),
    ),
    contained(
      on(ChoiceInteraction, "package", "path", "start", "interaction"),
      on(Choice, "package", "path", "start", "nearest"),
    ),
    contained(
      on(
        select(ChoiceInteraction, (c) => c.ne(c.interactionPath, c.path)),
        "package",
        "path",
        "interactionPath",
        "interaction",
      ),
      onContext,
    ),
    choiceFamily,
    contained(
      on(gapChoices, "package", "path", "start"),
      on(GapInteraction, "package", "path", "start"),
    ),
    contained(
      on(
        select(Hottext, (h) => h.in(h.nearestKind, interactionKinds)),
        "package",
        "nearestPath",
        "nearest",
        "nearestKind",
      ),
      on(Interaction, "package", "path", "start", "kind"),
    ),
    contained(
      on(
        select(Hottext, (h) => h.ne(h.nearestPath, h.path)),
        "package",
        "path",
        "nearestPath",
        "nearest",
      ),
      onContext,
    ),
  ],
  "PCI module source": [
    check("PCI_module_source", Interaction, (i) =>
      i.or(i.ne(i.kind, pciKind), i.gt(i.moduleForms, 0n)),
    ),
  ],
  RecordBindingFit: [
    contained(
      on(
        select(BindingCardinality, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.eq(r.cardinality, "record"),
            r.not(r.in(r.kind, anyTypeKinds)),
          ),
        ),
        "kind",
      ),
      on(RecordBindingFit, "kind"),
    ),
    contained(
      on(
        select(PlacedBindingCardinality, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.eq(r.cardinality, "record"),
            r.not(r.in(r.kind, anyTypeKinds)),
          ),
        ),
        "kind",
      ),
      on(RecordBindingFit, "kind"),
    ),
  ],
  "Slider bounds": [check("Slider_bounds", Slider, (s) => doublesInOrder(s.lower, s.upper))],
  "Template variable type": [
    // Each half judges the template where what it reads spells something (spec readings 158 and
    // 159, decision 432), as "Feedback outcome type" judges an outcome: its cardinality, where it
    // has one, its reference's cardinality row's, copied from its declaration row and
    // `DeclarationCardinality`; its base type, where it has one, its `DeclarationBaseType`'s. A
    // portable custom interaction's template variable is free.
    contained(
      on(
        select(TemplateRefDeclaration, (r) => r.eq(r.cardinalities, 1n)),
        "package",
        "path",
        "start",
        "attribute",
      ),
      on(TemplateRefCardinality, "package", "path", "start", "attribute"),
    ),
    contained(
      on(TemplateRefCardinality, "package", "path", "start", "attribute", "declaration", "kind"),
      on(TemplateRefDeclaration, "package", "path", "start", "attribute", "declaration", "kind"),
    ),
    contained(
      on(TemplateRefCardinality, "package", "path", "declaration", "cardinality"),
      on(DeclarationCardinality, "package", "path", "start", "cardinality"),
    ),
    check("Template_variable_type", TemplateRefCardinality, (r) =>
      r.or(r.eq(r.kind, templateVariableKind), r.in(r.cardinality, feedbackCardinalities)),
    ),
    contained(
      on(
        select(TemplateRefDeclaration, (r) =>
          r.and(r.ne(r.kind, templateVariableKind), r.eq(r.baseTypes, 1n)),
        ),
        "package",
        "path",
        "declaration",
      ),
      identifierTyped,
    ),
    contained(
      on(
        select(SectionTemplateRefDeclaration, (r) => r.eq(r.cardinalities, 1n)),
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
      ),
      on(SectionTemplateRefCardinality, "package", "assembly", "instance", "start", "attribute"),
    ),
    contained(
      on(
        SectionTemplateRefCardinality,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "declaration",
        "kind",
      ),
      on(
        SectionTemplateRefDeclaration,
        "package",
        "assembly",
        "instance",
        "start",
        "attribute",
        "declaration",
        "kind",
      ),
    ),
    contained(
      on(SectionTemplateRefCardinality, "package", "assembly", "declaration", "cardinality"),
      on(DeclarationCardinality, "package", "path", "start", "cardinality"),
    ),
    check("Template_variable_type", SectionTemplateRefCardinality, (r) =>
      r.or(r.eq(r.kind, templateVariableKind), r.in(r.cardinality, feedbackCardinalities)),
    ),
    contained(
      on(
        select(SectionTemplateRefDeclaration, (r) =>
          r.and(r.ne(r.kind, templateVariableKind), r.eq(r.baseTypes, 1n)),
        ),
        "package",
        "assembly",
        "declaration",
      ),
      identifierTyped,
    ),
  ],
  "default hotspot last slot": [check("default_hotspot_last_slot", Hotspot, lastWhere)],
} as const;

/**
 * {@link interactionLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const interactionLaws = Object.values(interactionLawsByName).flat();
