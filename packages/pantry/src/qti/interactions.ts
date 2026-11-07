/**
 * Interactions and their bindings: the O3 overlays (plan §1.7; the W5 amendment's C15, C17, C18 and
 * C22 and its D entry for Q5.09; the tier-1 addendum's G-match, G-parse and "Text in keys"; the
 * orchestrator's answers of 2026-11-06).
 *
 * Every attribute an O3 law reads is copied once, from one selection of `Attribute`, into
 * {@link InteractionAttribute}, keyed by its element's node and its name, with its lexical form
 * split into the whitespace around its value and the value itself. Every identifier, count, number
 * and flag these laws read is an atomic XSD type whose whiteSpace is `collapse` (spec reading 7:
 * "An attribute the XSD itself types ... is read as the XSD reads it, outer whitespace collapsed"),
 * so the value is the collapsed form, the one `Declaration.identifier` holds. One selection of
 * `Attribute` costs one UNIQUE on it (the addendum's "Text in keys"), so the overlays below read
 * `InteractionAttribute` and never `Attribute`.
 *
 * - {@link Interaction}: every interaction element, in every document, owning its choices'
 *   {@link ChoiceInteraction} rows as a counted family (C15). A stimulus body holds interactions
 *   too (information model §5.137, StimulusBody: "The stimulus body contains the text, graphics,
 *   media objects and interactions"), so the item-only laws read {@link BoundVariable}.
 * - {@link Binding}: every interaction with a `response-identifier`, its optional part: an
 *   interaction that writes none has no row, and AL3 refuses it.
 * - {@link PciModuleForm}: each form in which a portable custom interaction names its module, its
 *   `module` attribute and its `qti-interaction-modules` child, counted by
 *   `Interaction.moduleForms` so that "PCI module source" asks for at least one (§5.106.2, R10-a).
 * - {@link BoundVariable}: each attribute by which an item's interaction binds a response variable,
 *   its `response-identifier` and its `string-identifier` (§5.48.2, §5.162.3: "binding the
 *   interaction to a second response variable (of base-type string)"), and beside it, where a
 *   response declaration of the item holds the name, its {@link BindingDeclaration}: the variable's
 *   declaration, through `declarationRef`. A binding with none is "Binding declared"'s, and the fit
 *   laws read the declaration row, so they judge only a declared variable (lane NIL's audit, B1: a
 *   missing value is a row of its own relation, never a sentinel). `key(document, identifier)` is
 *   "Binding unique" (reading 92: "Each response variable declared may be bound to one and only one
 *   interaction"), so an interaction whose string identifier is its response identifier, the old
 *   `string-identifier-distinct`, breaks that key.
 * - {@link Choice}: every choice, with its identifier distinct among its document's choices of its
 *   kind, and its {@link ChoiceInteraction}, its nearest interaction (N8) (§5.132.1 and the other
 *   choice classes': "This identifier must not be used by any other choice or item variable"; spec
 *   reading 104: the item is the scope, as §7.16 reads an identifier, "a logical reference to
 *   another object in the item, such as an itemVariable or choice").
 * - {@link Hottext}: every hottext, its nearest interaction's kind, so {@link HottextOwner} is the
 *   hottexts of a hottext interaction; elsewhere a hottext is valid and owned by none (reading 38).
 *   Its identifier is distinct among its document's hottexts (§5.65.1, reading 104).
 * - {@link ChoiceVariableName}: each identifier a document's choices, hottexts or declarations use,
 *   counting each, so a choice's identifier is no item variable's: no declaration's of its
 *   document, and in an item no built-in variable's (reading 104, "Choice not variable").
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
 *   its own ({@link FeedbackRefDeclaration} and the others), through `declarationRef`, or a
 *   built-in variable that stands as one (reading 77), in an item's or a test's own declarations
 *   (the port audit's A43 and A44), each built-in one its root holds (spec reading 29: an item's
 *   `completionStatus` is no test's), so each reference carries the root kind it resolves under. A
 *   reference that names neither has no declaration row, and its law refuses it (lane NIL's NS2:
 *   never the nil uuid).
 * - A section document's feedback and printed variables ({@link SectionFeedbackName},
 *   {@link SectionPrintedName}) resolve once per test that places it ({@link SectionFeedbackRef},
 *   {@link SectionPrintedRef}, A45, each with its declaration row where it names a declaration, as
 *   an own reference has), every one of them under each placement ({@link SectionScope}, whose
 *   counts of resolutions are its document's counts of references, {@link ReferringDocument}). An
 *   included fragment's feedback, printed variables, template variables
 *   ({@link SectionTemplateName}) and context variables ({@link SectionContextName}) resolve so
 *   once per placement in each item or test that places it, a test placing it where the test or a
 *   section document splices it (spec reading 117), the same relations holding them: a fragment
 *   declares nothing, as a section does.
 *
 * A row a builder gets wrong is refused, never accepted: each overlay's node is its node's, through
 * `nodeRef`, and of its kinds, and each value that relaxes a law (a count written, an item
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
  Decimal,
  drawn,
  fin,
  key,
  lexicalForm,
  mirrors,
  natural,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
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
import { Declaration, DeclarationBaseType, declarationRef } from "#pantry/qti/declarations.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeCounts, nodeRef } from "#pantry/qti/node.ts";
import { Instance, itemInstances, itemKind, sectionKind, testKind } from "#pantry/qti/tests.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";

/**
 * A `NodeKind` handle.
 */
type Kind = (typeof NodeKind.handles)[number];

/**
 * An `AttributeName` handle.
 */
type Name = (typeof AttributeName.handles)[number];

/**
 * XML whitespace `S`, possibly none: what a lexical form holds around its value.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-S | XML 1.0, S}
 */
const Space = str.regex("^[\\t\\n\\r ]*$");

/**
 * A run holding no XML whitespace, possibly empty: the collapsed value of an atomic type, which
 * `E1_derived` holds every {@link InteractionAttribute} value to, so its pieces are exactly its
 * lexical form's outer whitespace.
 */
export const atomicValuePattern = "^[^\\t\\n\\r ]*$";

/**
 * A collapsed value that names a variable: an NCName (`ncNamePattern`), the lexical space of each
 * reference attribute's `IdentifierDType` and of the `VariableStringDType` member of a printed
 * variable's `base` and `index`. Any other value names nothing, an integer of `base` or `index`
 * among them, and its value domain refuses it alone (spec reading 152).
 */
const namePattern = `^${ncNamePattern}$`;

/**
 * The root kinds of the documents whose content references resolve in their own declarations: an
 * item's (`itemKind` of `#pantry/qti/tests.ts`), whose bindings and references the item-only laws
 * read, and a test's (`testKind`), whose feedback and printed variables name the test's own
 * declarations (the port audit's A43 and A44: a test feedback's `outcome-identifier` names an
 * outcome the test declares; a test rubric's printed variable a variable the test declares). Every
 * other document's resolve once per assembly that places it: a section document's in each test's
 * declarations, an included fragment's in each item's or test's (spec reading 117).
 */
export const referringRoots = [itemKind, testKind] as const satisfies readonly Kind[];

/**
 * The root kinds of the documents that are no included fragment's content: an item, a test, and a
 * section document, which a section ref or an include places as a section. Every other document a
 * reference stands in is a fragment (spec reading 117), whose template and context variable
 * references resolve once per item that places it, as its feedback and printed variables do.
 */
export const unfragmentedRoots = [
  itemKind,
  testKind,
  sectionKind,
] as const satisfies readonly Kind[];

/**
 * The choices: the kinds whose `identifier` names a value of their interaction's response, each a
 * child of its interaction or, for a gap, inside a gap-match interaction (reading 38), so its
 * nearest interaction (N8) is the interaction it is a choice of. A hottext may sit outside a
 * hottext interaction (reading 38's "hottext placement"), so it is {@link Hottext}'s.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_SimpleChoice | QTI 3.0 information model, §5.132 SimpleChoice}
 */
export const choiceKinds = [
  "qti-simple-choice",
  "qti-simple-associable-choice",
  "qti-hotspot-choice",
  "qti-associable-hotspot",
  "qti-gap-text",
  "qti-gap-img",
  "qti-inline-choice",
  "qti-gap",
] as const satisfies readonly Kind[];

/**
 * The hottext's kind.
 */
export const hottextKind = "qti-hottext" satisfies Kind;

/**
 * The hottext interaction's kind: the one interaction whose hottexts are its choices.
 */
export const hottextInteraction = "qti-hottext-interaction" satisfies Kind;

/**
 * The kinds that carry a `shape` the default-hotspot laws read (reading 80).
 */
export const hotspotKinds = [
  "qti-hotspot-choice",
  "qti-associable-hotspot",
] as const satisfies readonly Kind[];

/**
 * The graphic gap match interaction, whose hotspots have no default (reading 80, §5.60.9: "The
 * default hotspot must not be defined").
 */
export const graphicGapMatch = "qti-graphic-gap-match-interaction" satisfies Kind;

/**
 * The `shape` of a default hotspot, the area that holds every point no other area holds, as
 * `ShapeDType` spells it.
 */
export const defaultArea = "default";

/**
 * A feedback block, the kind whose `Enters` row is the feedback flag `fb` alone, which every
 * feedback element (`qti-feedback-block`, its template form, `qti-feedback-inline`) enters.
 */
export const feedbackKind = "qti-feedback-block" satisfies Kind;

/**
 * The slider interaction, whose bounds `Slider_bounds` orders.
 */
export const sliderKind = "qti-slider-interaction" satisfies Kind;

/**
 * The extended text interaction, which needs `max-strings` when bound to a container (reading
 * 19).
 */
export const extendedTextKind = "qti-extended-text-interaction" satisfies Kind;

/**
 * The interactions with a `string-identifier`, which binds a second response variable of base type
 * string (§5.48.2, §5.162.3).
 */
export const stringBindingKinds = [
  "qti-text-entry-interaction",
  extendedTextKind,
] as const satisfies readonly Kind[];

/**
 * The two attributes by which an interaction binds a response variable.
 */
export const bindingAttributes = [
  "response-identifier",
  "string-identifier",
] as const satisfies readonly Name[];

/**
 * The interactions whose response cardinality their most count decides, spec reading 92: "If
 * max-choices is greater than 1 (or 0) then the interaction must be bound to a response with
 * multiple cardinality", of the `max-choices` of the choice (§5.30.2), hottext (§5.66.1), hotspot
 * (§5.68.2), position object (§5.107.3) and select point (§5.128.2) interactions, and the same
 * sentence of `max-associations` on the associate (§5.8.2), gap match (§5.57.3), graphic associate
 * (§5.59.2), graphic gap match (§5.60.2) and match (§5.89.2) interactions.
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
 * The interactions of any response type: those neither `BindingFit` nor `RecordBindingFit` names,
 * the custom and portable custom interactions, which bind a declared response variable of any base
 * type and cardinality (reading 75 binds them all).
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
export const minNames: readonly Name[] = [...new Set(ChoiceBound.rows.map(({ min }) => min))];

/**
 * The attributes of the most counts `ChoiceBound` names, each once.
 */
export const maxNames: readonly Name[] = [...new Set(ChoiceBound.rows.map(({ max }) => max))];

/**
 * The kinds whose choices bound both of their counts (reading 18), `ChoiceCount`'s keys.
 */
export const choiceCountKinds: readonly Kind[] = ChoiceCount.rows.map(({ kind }) => kind);

/**
 * The ARIA range attributes, on any element that carries them (§5.2.31, §5.2.32).
 */
export const ariaNames = ["aria-valuemin", "aria-valuemax"] as const satisfies readonly Name[];

/**
 * The `adaptive` attribute of an item, an `xs:boolean` that defaults to false.
 */
export const adaptiveName = "adaptive" satisfies Name;

/**
 * The content references, each by the relation that holds it: the attribute it is made by, and the
 * kinds `ContentReference` lists for that attribute (and, for a printed variable and a context
 * variable, which share `identifier`, its one kind).
 */
const contentRows = ContentReference.rows;

/**
 * Collect the kinds `ContentReference` lists for references made by some attributes on some kinds.
 *
 * @param attributes - The attributes.
 * @param kinds - The kinds, none for every kind.
 * @returns The kinds, each once.
 */
const referringKinds = (attributes: readonly Name[], kinds?: readonly Kind[]): readonly Kind[] => [
  ...new Set(
    contentRows
      .filter(
        (row) =>
          attributes.includes(row.attribute) && (kinds === undefined || kinds.includes(row.kind)),
      )
      .map(({ kind }) => kind),
  ),
];

/**
 * The printed variable's kind.
 */
const printedVariable = "qti-printed-variable" satisfies Kind;

/**
 * The context variable's kind, a PCI's binding of a context variable (§5.106.6).
 */
const contextVariableKind = "qti-context-variable" satisfies Kind;

/**
 * The portable custom interaction's template variable kind (§7.38.1), the one element that names a
 * template variable without stating its type: "Template variable type" leaves it free.
 */
const templateVariableKind = "qti-template-variable" satisfies Kind;

/**
 * Each content reference relation's attributes and kinds, as `ContentReference` lists them. A
 * printed variable's `base` and `index` hold an integer or a variable's name (the XSD's union of
 * `xs:integer` and `VariableStringDType`); each other attribute is an `IdentifierDType`. Each names
 * a variable exactly where its value is an NCName ({@link namePattern}).
 */
export const references = {
  context: { attributes: ["identifier"], kinds: [contextVariableKind] },
  feedback: {
    attributes: ["outcome-identifier"],
    kinds: referringKinds(["outcome-identifier"]),
  },
  printed: { attributes: ["identifier"], kinds: [printedVariable] },
  template: {
    attributes: ["template-identifier"],
    kinds: referringKinds(["template-identifier"]),
  },
  variable: { attributes: ["base", "index"], kinds: [printedVariable] },
} as const satisfies Readonly<
  Record<string, { readonly attributes: readonly Name[]; readonly kinds: readonly Kind[] }>
>;

/**
 * The attributes O3 reads, by name, each with the kinds it is read on: every attribute below is
 * copied into {@link InteractionAttribute}; the ARIA range attributes are read on every kind.
 */
export const readAttributes: ReadonlyMap<Name, readonly Kind[]> = (() => {
  const read = new Map<Name, Set<Kind>>();
  const add = (name: Name, kinds: readonly Kind[]) => {
    const held = read.getOrInsertComputed(name, () => new Set());
    for (const kind of kinds) {
      held.add(kind);
    }
  };
  add("response-identifier", interactionKinds);
  add("string-identifier", stringBindingKinds);
  add("identifier", [...choiceKinds, hottextKind]);
  add("shape", hotspotKinds);
  for (const { kind, max, min } of ChoiceBound.rows) {
    add(min, [kind]);
    add(max, [kind]);
  }
  add("lower-bound", [sliderKind]);
  add("upper-bound", [sliderKind]);
  add(adaptiveName, [itemKind]);
  for (const { attributes, kinds } of Object.values(references)) {
    for (const attribute of attributes) {
      add(attribute, kinds);
    }
  }

  return new Map([...read].map(([name, kinds]) => [name, [...kinds]]));
})();

/**
 * An attribute an O3 law reads, keyed by its element's node and its name: the element's kind,
 * document and document's root kind, the lexical form as written (C18's copy), and that form as
 * three pieces, `lead`, `value` and `trail`, the value its collapsed form.
 *
 * Copied text is `keyText` (`#pantry/qti/limits.ts`): the lexical form and the value each sit in a
 * containment's index, and a longer value is refused under the schema's one limit law.
 */
export const InteractionAttribute = relation(
  "InteractionAttribute",
  {
    document: uuid,
    kind: closedId(NodeKind),
    lead: Space,
    lexical: keyText,
    name: closedId(AttributeName),
    node: uuid,
    rootKind: closedId(NodeKind),
    trail: Space,
    value: keyText,
  },
  ["node", "name"],
);

/**
 * An interaction element, in any document, keyed by its node: its {@link nodeRef} tuple and its
 * count of {@link ChoiceInteraction} rows, the choices whose nearest interaction it is, which the
 * family draws, and its count of {@link PciModuleForm} rows, the forms of a portable custom
 * interaction's module, which the second family draws. Every interaction has one, whether or not it
 * writes a `response-identifier`, so its choices' family always has its owner and a missing
 * response identifier is AL3's alone.
 */
export const Interaction = relation(
  "Interaction",
  {
    choices: drawn(natural),
    document: uuid,
    kind: closedId(NodeKind),
    moduleForms: drawn(natural),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * That an interaction writes a `response-identifier`, keyed by the interaction's node: its
 * {@link nodeRef} tuple. It is the optional part of the {@link Interaction}: an interaction that
 * writes no `response-identifier` has none, and one that writes one has it, both ways. The name it
 * binds is its {@link BoundVariable}'s, the one row every law over a binding's name reads.
 */
export const Binding = relation(
  "Binding",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One binding of an item's interaction to a response variable, keyed by the interaction's node and
 * the attribute that binds it: `response-identifier`, or `string-identifier`'s second variable,
 * where its value names a variable, an NCName ({@link namePattern}). Any other value binds nothing,
 * and its value domain refuses it alone (spec reading 152).
 *
 * Its fields, every one written by the host:
 *
 * - `kind`, the interaction's; `document`, and `identifier`, the attribute's value collapsed;
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
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["node", "attribute"],
);

/**
 * The response declaration an item's binding names, keyed as its {@link BoundVariable} is, and
 * written only where a response declaration of the item holds the binding's name: a binding to an
 * undeclared name, an outcome's, a template's or a built-in variable's has no row, which "Binding
 * declared" refuses.
 *
 * Its fields, every one written by the host:
 *
 * - `node`, `attribute`, `kind`, `document` and `identifier`, its binding's, copied from
 *   {@link BoundVariable};
 * - `declaration`, `declarationKind`, `cardinality` and `baseTypes`, the declaration's, copied
 *   through `declarationRef`: its base type, where it has one, is its {@link BindingBaseType}'s;
 * - `mosts`, its interaction's count of most values, its {@link CountBound}'s `mosts` where
 *   `ChoiceBound` pairs the kind's counts, and 0 on any other kind, which has none: "Binding
 *   cardinality" judges a binding only where its interaction's most has a value.
 */
export const BindingDeclaration = relation(
  "BindingDeclaration",
  {
    attribute: closedId(AttributeName),
    baseTypes: natural,
    cardinality: closedId(Cardinality),
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    mosts: natural,
    node: uuid,
  },
  ["node", "attribute"],
);

/**
 * One attribute by which an interaction of any document binds a response variable, keyed by the
 * interaction's node and the attribute (spec reading 117), where its value names a variable:
 * `kind`, the interaction's; `document`; and `identifier`, the attribute's value collapsed. A
 * fragment's interactions bind no variable of their own document, which declares none, but one of
 * each item that places the fragment ({@link PlacedBinding}); its rows count as
 * `Document.bindings`.
 */
export const BindingName = relation(
  "BindingName",
  {
    attribute: closedId(AttributeName),
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["node", "attribute"],
);

/**
 * One binding of an instance of an item's assembly (Q5.13's `Instance`, spec reading 117), keyed by
 * the instance, the interaction's node and the attribute: the item's own bindings under its root
 * instance, and an included fragment's under each instance that places it, so each placement binds
 * the item's responses as its merged document would ("interactions included from fragments must be
 * correctly bound to response variables declared in the items", information model §2.12).
 *
 * Its fields, every one written by the host: `instance`, `document` and `assembly`, the instance's;
 * `node`, `attribute`, `kind` and `identifier`, its {@link BindingName}'s; and `adaptive`, whether
 * the item is adaptive. The variable it binds among the assembly's declarations is its
 * {@link PlacedBindingDeclaration}'s.
 */
export const PlacedBinding = relation(
  "PlacedBinding",
  {
    adaptive: pg.boolean,
    assembly: uuid,
    attribute: closedId(AttributeName),
    document: uuid,
    identifier: keyText,
    instance: uuid,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["instance", "node", "attribute"],
);

/**
 * The response declaration a {@link PlacedBinding} names among its assembly's, keyed as the
 * binding is, and written only where a response declaration of the item holds the name, as
 * {@link BindingDeclaration} is for an item's own bindings.
 *
 * Its fields, every one written by the host: `instance`, `node`, `attribute`, `assembly`,
 * `document`, `kind` and `identifier`, its binding's, copied from `PlacedBinding`; and
 * `declaration`, `declarationKind`, `cardinality` and `baseTypes`, the declaration's, copied
 * through `declarationRef`; and `mosts`, as {@link BindingDeclaration}'s. Its base type, where it
 * has one, is its {@link PlacedBindingBaseType}'s.
 */
export const PlacedBindingDeclaration = relation(
  "PlacedBindingDeclaration",
  {
    assembly: uuid,
    attribute: closedId(AttributeName),
    baseTypes: natural,
    cardinality: closedId(Cardinality),
    declaration: uuid,
    declarationKind: closedId(DeclarationKind),
    document: uuid,
    identifier: keyText,
    instance: uuid,
    kind: closedId(NodeKind),
    mosts: natural,
    node: uuid,
  },
  ["instance", "node", "attribute"],
);

/**
 * A bound variable's base type, keyed as its {@link BindingDeclaration} is, where its declaration
 * has one: `baseType`, the declaration's {@link DeclarationBaseType}'s, beside the binding's
 * `declaration`, `cardinality` and interaction `kind`, the fields `BindingFit` judges together. A
 * record has no base type, and its binding no row (lane NIL's audit, B12).
 */
export const BindingBaseType = relation(
  "BindingBaseType",
  {
    attribute: closedId(AttributeName),
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declaration: uuid,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["node", "attribute"],
);

/**
 * A placed binding's variable's base type, keyed as its {@link PlacedBindingDeclaration} is, where
 * its declaration has one, as {@link BindingBaseType} is an item's own binding's.
 */
export const PlacedBindingBaseType = relation(
  "PlacedBindingBaseType",
  {
    attribute: closedId(AttributeName),
    baseType: closedId(BaseType),
    cardinality: closedId(Cardinality),
    declaration: uuid,
    instance: uuid,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["instance", "node", "attribute"],
);

/**
 * One choice of an instance of an assembly (Q5.13's `Instance`, spec reading 117), keyed by the
 * instance and the choice's node: a {@link Choice} of the instance's document, under the
 * assembly, so an included fragment's choices count among its item's ("Choice identifier key" over
 * the assembly: "This identifier must not be used by any other choice", information model
 * §5.132.1), and a fragment placed twice in one item holds its choices twice.
 */
export const PlacedChoice = relation(
  "PlacedChoice",
  {
    assembly: uuid,
    document: uuid,
    identifier: keyText,
    instance: uuid,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["instance", "node"],
);

/**
 * One hottext of an instance of an assembly, keyed by the instance and the hottext's node: a
 * {@link Hottext} of the instance's document, under the assembly, as {@link PlacedChoice} is.
 */
export const PlacedHottext = relation(
  "PlacedHottext",
  { assembly: uuid, document: uuid, identifier: keyText, instance: uuid, node: uuid },
  ["instance", "node"],
);

/**
 * Each document's binding attributes, counted by `Document.bindings`.
 */
export const bindingNameFamily = counted(on(BindingName, "document"), fin(Document, "bindings"));

/**
 * Each item instance's bindings, counted by `Instance.bindings`, its document's count.
 */
export const placedBindingFamily = counted(
  on(PlacedBinding, "instance"),
  fin(Instance, "bindings"),
);

/**
 * A choice, keyed by its node: its {@link nodeRef} tuple and its identifier collapsed. Its nearest
 * interaction is its {@link ChoiceInteraction}'s. It owns no sequence (C15).
 */
export const Choice = relation(
  "Choice",
  {
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A choice's interaction, keyed by the choice's node: its nearest interaction (N8), the
 * {@link Interaction} that counts it. Only a choice an interaction encloses, in its own document or
 * through the include that places its fragment, has a row; every choice must ("N8 nearest"), and a
 * gap that no gap-match encloses breaks N6 first. It owns no sequence (C15).
 */
export const ChoiceInteraction = relation("ChoiceInteraction", { interaction: uuid, node: uuid }, [
  "node",
]);

/**
 * Each interaction's choices, counted by `Interaction.choices` (C15): a flat row whose group,
 * `interaction`, names its owner.
 */
export const choiceFamily = counted(
  on(ChoiceInteraction, "interaction"),
  fin(Interaction, "choices"),
);

/**
 * One form in which a portable custom interaction names its module, keyed by the interaction's node
 * and the form: `element` is false for the `module` attribute and true for the
 * `qti-interaction-modules` child (information model §5.106.2: "If this characteristic is provided
 * the qti-interaction-modules child attribute is not required, if omitted then the modules child
 * element is mandatory", R10-a). A form a PCI does not write has no row; "PCI module source" counts
 * the rows.
 *
 * Its rows are copies of the tree, both ways: an attribute form of each `module` attribute of a
 * portable custom interaction, an element form of each `qti-interaction-modules` child of one.
 */
export const PciModuleForm = relation("PciModuleForm", { element: pg.boolean, node: uuid }, [
  "node",
  "element",
]);

/**
 * Each interaction's module forms, counted by `Interaction.moduleForms`: a flat row whose group,
 * `node`, names its owner.
 */
export const pciModuleFamily = counted(on(PciModuleForm, "node"), fin(Interaction, "moduleForms"));

/**
 * The portable custom interaction's kind, the one element whose module a form names.
 */
export const pciKind = "qti-portable-custom-interaction" satisfies Kind;

/**
 * The kind of a portable custom interaction's `qti-interaction-modules` child, the element form of
 * its module.
 */
export const modulesKind = "qti-interaction-modules" satisfies Kind;

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
 * The attribute forms among the {@link PciModuleForm} rows.
 */
const attributeForms = select(PciModuleForm, (f) => f.eq(f.element, false));

/**
 * The element forms among the {@link PciModuleForm} rows.
 */
const elementForms = select(PciModuleForm, (f) => f.eq(f.element, true));

/**
 * A hottext, keyed by its node: its {@link nodeRef} tuple, its nearest interaction's kind
 * (`document` where it sits in none), and its identifier collapsed.
 */
export const Hottext = relation(
  "Hottext",
  {
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: uuid,
    nearestKind: closedId(NodeKind),
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * The hottexts whose nearest interaction is a hottext interaction, its choices (§5.65: "A HotText
 * area is used within the content of an hotTextInteraction to provide the individual choices"):
 * the old `owner-copy` of `HottextOwner`.
 */
export const HottextOwner = select(Hottext, (h) => h.eq(h.nearestKind, hottextInteraction));

/**
 * Each document's choices, counted by `Document.choices`.
 */
export const documentChoiceFamily = counted(on(Choice, "document"), fin(Document, "choices"));

/**
 * Each document's hottexts, counted by `Document.hottexts`.
 */
export const documentHottextFamily = counted(on(Hottext, "document"), fin(Document, "hottexts"));

/**
 * Each instance's choices, counted by `Instance.choices`, its document's count.
 */
export const placedChoiceFamily = counted(on(PlacedChoice, "instance"), fin(Instance, "choices"));

/**
 * Each instance's hottexts, counted by `Instance.hottexts`, its document's count.
 */
export const placedHottextFamily = counted(
  on(PlacedHottext, "instance"),
  fin(Instance, "hottexts"),
);

/**
 * An identifier a document's choices, hottexts or variable declarations use, or that an assembly
 * rooted at the document places, a projection keyed by the document and the identifier: the
 * document's root kind, how many {@link Choice}, {@link Hottext} and `Declaration` rows of the
 * document bear it, and how many {@link PlacedChoice} and {@link PlacedHottext} rows of its
 * assembly do, which the five families draw.
 *
 * Every choice class says of its identifier "This identifier must not be used by any other choice
 * or item variable" (§5.132.1; §5.7.1, §5.55.1, §5.56.1, §5.58.1, §5.65.1, §5.67.1, §5.73.1 and
 * §5.131.1 alike), and the item variables are its declarations and its built-in variables
 * (§2.2.2), so "Choice not variable" holds a used identifier to its choices and hottexts or to its
 * variables, never both (spec reading 104). The comparison spans two relations, so it is a count
 * of each under one key: a containment cannot say that a name is absent. An included fragment's
 * choices are its item's (spec reading 117), and a fragment declares nothing, so an item's
 * assembly's placed choices and hottexts are held to the item's own variables.
 */
export const ChoiceVariableName = relation(
  "ChoiceVariableName",
  {
    choices: drawn(natural),
    declarations: drawn(natural),
    document: uuid,
    hottexts: drawn(natural),
    identifier: keyText,
    placedChoices: drawn(natural),
    placedHottexts: drawn(natural),
    rootKind: closedId(NodeKind),
  },
  ["document", "identifier"],
);

/**
 * Each used identifier's choices, counted by `ChoiceVariableName.choices`: a choice's group, its
 * document and identifier, names its projection row.
 */
export const choiceNameFamily = counted(
  on(Choice, "document", "identifier"),
  fin(ChoiceVariableName, "choices"),
);

/**
 * Each used identifier's hottexts, counted by `ChoiceVariableName.hottexts`.
 */
export const hottextNameFamily = counted(
  on(Hottext, "document", "identifier"),
  fin(ChoiceVariableName, "hottexts"),
);

/**
 * Each used identifier's declarations, counted by `ChoiceVariableName.declarations`: Q5.08's
 * `Declaration`, whose `key(document, identifier)` makes the count 0 or 1 on an accepted state.
 */
export const declarationNameFamily = counted(
  on(Declaration, "document", "identifier"),
  fin(ChoiceVariableName, "declarations"),
);

/**
 * Each identifier an assembly places on a choice, counted by `ChoiceVariableName.placedChoices`
 * under the assembly's root document (spec reading 117).
 */
export const placedChoiceNameFamily = counted(
  on(PlacedChoice, "assembly", "identifier"),
  fin(ChoiceVariableName, "placedChoices"),
);

/**
 * Each identifier an assembly places on a hottext, counted by
 * `ChoiceVariableName.placedHottexts`.
 */
export const placedHottextNameFamily = counted(
  on(PlacedHottext, "assembly", "identifier"),
  fin(ChoiceVariableName, "placedHottexts"),
);

/**
 * A hotspot choice or associable hotspot, keyed by its node: its {@link nodeRef} tuple, its parent
 * interaction's kind, its `area`, the value of its `shape` (the kind of area it is), and the
 * element counts the last-slot law compares, copied through `nodeCounts`: its own (`elements`, its
 * element rank among its siblings) and its parent's (`parentElementChildren`, the parent's element
 * children).
 */
export const Hotspot = relation(
  "Hotspot",
  {
    area: keyText,
    document: uuid,
    elementChildren: natural,
    elements: natural,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    parentElementChildren: natural,
    parentElements: natural,
    parentKind: closedId(NodeKind),
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * An element whose least and most counts `ChoiceBound` pairs, keyed by its node: its
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
    document: uuid,
    kind: closedId(NodeKind),
    leasts: drawn(natural),
    maxName: closedId(AttributeName),
    maxWritten: pg.boolean,
    minName: closedId(AttributeName),
    minWritten: pg.boolean,
    mosts: drawn(natural),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A bound's least count, where it has a value, keyed by its node: `least`, the count's value
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
    node: uuid,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A bound's most count, where it has a value, keyed by its node, as {@link LeastCount} is the
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
    node: uuid,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A bound both of whose counts have a value, keyed by its node: the two integers, copied from its
 * {@link LeastCount} and {@link MostCount}, and the fields "Choice bounds" reads beside them.
 */
export const CountRange = relation(
  "CountRange",
  {
    kind: closedId(NodeKind),
    leastValue: pg.bigint,
    minWritten: pg.boolean,
    mostValue: pg.bigint,
    node: uuid,
  },
  ["node"],
);

/**
 * Each bound's least count, counted by `CountBound.leasts`: one row or none.
 */
export const leastCountFamily = counted(on(LeastCount, "node"), fin(CountBound, "leasts"));

/**
 * Each bound's most count, counted by `CountBound.mosts`: one row or none.
 */
export const mostCountFamily = counted(on(MostCount, "node"), fin(CountBound, "mosts"));

/**
 * A slider interaction's bounds, keyed by its node: its `lower-bound` and `upper-bound`, collapsed.
 */
export const Slider = relation("Slider", { lower: keyText, node: uuid, upper: keyText }, ["node"]);

/**
 * One ARIA range attribute of an element, keyed by its node and its name: its value, collapsed.
 */
export const AriaValue = relation(
  "AriaValue",
  { name: closedId(AttributeName), node: uuid, value: keyText },
  ["node", "name"],
);

/**
 * An element with an ARIA range attribute, a projection keyed by its node: its count of
 * {@link AriaValue} rows, 2 exactly where it carries both.
 */
export const AriaElement = relation("AriaElement", { node: uuid, values: drawn(natural) }, [
  "node",
]);

/**
 * Each element's ARIA range attributes, counted by `AriaElement.values`.
 */
export const ariaValueFamily = counted(on(AriaValue, "node"), fin(AriaElement, "values"));

/**
 * An element that carries both ARIA range attributes, keyed by its node: its `aria-valuemin` and
 * `aria-valuemax`, collapsed.
 */
export const AriaRange = relation("AriaRange", { max: keyText, min: keyText, node: uuid }, [
  "node",
]);

/**
 * A document's item mode, keyed by the document: whether it is an item whose `adaptive` is true.
 * Every adaptive item has its row, and so does every document a {@link BoundVariable} names.
 */
export const ItemMode = relation("ItemMode", { adaptive: pg.boolean, document: uuid }, [
  "document",
]);

/**
 * The fields of a content reference: the referring element's node, kind and document, the root kind
 * of the assembly it resolves in, which for an item's or a test's own reference is its document's
 * own root kind, the attribute it refers by, and the name it refers to, collapsed. A value that is
 * no NCName ({@link namePattern}) names nothing and has no row: its value domain refuses it alone
 * (spec reading 152). What the name resolves to is a row of its own, where it names a
 * declaration (`referenceDeclarationFields`), and none where it names a built-in variable of that
 * root, as the installed `BuiltInVariable` holds each under its root (spec reading 29: an item's
 * are not a test's), or nothing, which its law refuses (lane NIL's NS2: a missing value is a row of
 * its own relation, never the nil uuid).
 */
const referenceFields = {
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  document: uuid,
  identifier: keyText,
  kind: closedId(NodeKind),
  node: uuid,
};

/**
 * The fields of the declaration a content reference names, keyed as its reference is: the
 * reference's fields, and the declaration as `declarationRef` holds it, of a kind
 * `ContentReference` lets the reference name.
 */
const referenceDeclarationFields = {
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  baseTypes: natural,
  cardinality: closedId(Cardinality),
  declaration: uuid,
  declarationKind: closedId(DeclarationKind),
  document: uuid,
  identifier: keyText,
  kind: closedId(NodeKind),
  node: uuid,
};

/**
 * A feedback element's outcome, keyed by its node and `outcome-identifier` (reading 77).
 */
export const FeedbackRef = relation("FeedbackRef", referenceFields, ["node", "attribute"]);

/**
 * A template element's or a choice's template variable, keyed by its node and
 * `template-identifier` (§2.7.2: "A references must match the identifier in a corresponding
 * template declaration"). Of a template element or a choice the variable is of base type
 * identifier and of single or multiple cardinality (reading R15-l, "Template variable type"); a
 * portable custom interaction's `qti-template-variable` states no type.
 */
export const TemplateRef = relation("TemplateRef", referenceFields, ["node", "attribute"]);

/**
 * The variable a printed variable prints, keyed by its node and `identifier` (§7.30.6: "The
 * outcome variable or template variable must have been defined"), and the variable its `base` or
 * `index` names where that value is a name, not an integer, keyed by its node and the attribute.
 */
export const PrintedVariableRef = relation("PrintedVariableRef", referenceFields, [
  "node",
  "attribute",
]);

/**
 * The context variable a PCI's `qti-context-variable` binds, keyed by its node and `identifier`
 * (reading 92: "the context variables are the declared ones and the built-in QTI_CONTEXT").
 */
export const ContextRef = relation("ContextRef", referenceFields, ["node", "attribute"]);

/**
 * The outcome declaration a {@link FeedbackRef} names, keyed as it is, where its document declares
 * one of its name.
 */
export const FeedbackRefDeclaration = relation(
  "FeedbackRefDeclaration",
  referenceDeclarationFields,
  ["node", "attribute"],
);

/**
 * The template declaration a {@link TemplateRef} names, keyed as it is, where its document declares
 * one of its name.
 */
export const TemplateRefDeclaration = relation(
  "TemplateRefDeclaration",
  referenceDeclarationFields,
  ["node", "attribute"],
);

/**
 * The outcome or template declaration a {@link PrintedVariableRef} names, keyed as it is, where its
 * document declares one of its name.
 */
export const PrintedVariableRefDeclaration = relation(
  "PrintedVariableRefDeclaration",
  referenceDeclarationFields,
  ["node", "attribute"],
);

/**
 * The context declaration a {@link ContextRef} names, keyed as it is, where its document declares
 * one of its name.
 */
export const ContextRefDeclaration = relation("ContextRefDeclaration", referenceDeclarationFields, [
  "node",
  "attribute",
]);

/**
 * The fields of a reference a section document makes: its element's node, kind and document, the
 * attribute it refers by, and its name collapsed. It resolves in no declaration of its own
 * document, since a section declares nothing, but once per test that places it (the port audit's
 * A45, B15).
 */
const sectionNameFields = {
  attribute: closedId(AttributeName),
  document: uuid,
  identifier: keyText,
  kind: closedId(NodeKind),
  node: uuid,
};

/**
 * A section document's feedback outcome reference, a feedback element's `outcome-identifier`,
 * keyed by its node and attribute.
 */
export const SectionFeedbackName = relation("SectionFeedbackName", sectionNameFields, [
  "node",
  "attribute",
]);

/**
 * A section document's printed variable reference, a printed variable's `identifier`, or its
 * `base` or `index` where it names a variable, keyed by its node and attribute.
 */
export const SectionPrintedName = relation("SectionPrintedName", sectionNameFields, [
  "node",
  "attribute",
]);

/**
 * An included fragment's template variable reference, a template element's or a choice's
 * `template-identifier`, keyed by its node and attribute (spec reading 117).
 */
export const SectionTemplateName = relation("SectionTemplateName", sectionNameFields, [
  "node",
  "attribute",
]);

/**
 * An included fragment's context variable reference, a `qti-context-variable`'s `identifier`,
 * keyed by its node and attribute (spec reading 117).
 */
export const SectionContextName = relation("SectionContextName", sectionNameFields, [
  "node",
  "attribute",
]);

/**
 * A document whose references resolve once per assembly that places it, keyed by its document
 * node, a projection whose counts are its {@link SectionFeedbackName},
 * {@link SectionPrintedName}, {@link SectionTemplateName} and {@link SectionContextName} rows:
 * every document that is no item's or test's has its row, its counts 0 where it makes none.
 */
export const ReferringDocument = relation(
  "ReferringDocument",
  {
    contexts: drawn(natural),
    document: uuid,
    feedbacks: drawn(natural),
    prints: drawn(natural),
    templates: drawn(natural),
  },
  ["document"],
);

/**
 * Each section document's feedback references, counted by `ReferringDocument.feedbacks`.
 */
export const sectionFeedbackNameFamily = counted(
  on(SectionFeedbackName, "document"),
  fin(ReferringDocument, "feedbacks"),
);

/**
 * Each section document's printed variable references, counted by `ReferringDocument.prints`.
 */
export const sectionPrintedNameFamily = counted(
  on(SectionPrintedName, "document"),
  fin(ReferringDocument, "prints"),
);

/**
 * Each fragment's template variable references, counted by `ReferringDocument.templates`.
 */
export const sectionTemplateNameFamily = counted(
  on(SectionTemplateName, "document"),
  fin(ReferringDocument, "templates"),
);

/**
 * Each fragment's context variable references, counted by `ReferringDocument.contexts`.
 */
export const sectionContextNameFamily = counted(
  on(SectionContextName, "document"),
  fin(ReferringDocument, "contexts"),
);

/**
 * One placement of a section document under a test, or of an included fragment under an item
 * (spec reading 117), keyed by its `Instance`: the document it places, the assembly (its root's
 * document node) and its root's kind, whose built-in variables its references read, and its counts
 * of {@link SectionFeedbackRef}, {@link SectionPrintedRef}, {@link SectionTemplateRef} and
 * {@link SectionContextRef} rows, which the families draw.
 */
export const SectionScope = relation(
  "SectionScope",
  {
    assembly: uuid,
    assemblyKind: closedId(NodeKind),
    contexts: drawn(natural),
    document: uuid,
    feedbacks: drawn(natural),
    instance: uuid,
    prints: drawn(natural),
    templates: drawn(natural),
  },
  ["instance"],
);

/**
 * The fields of a section document's or a fragment's reference placed under one assembly that
 * places it: the placement's instance, assembly and the assembly's root kind, and the reference's
 * fields. What its name resolves to among the assembly's declarations is a row of its own, where it
 * names a declaration (`sectionReferenceDeclarationFields`), and none where it names a built-in of
 * the assembly's root or nothing, as an own reference's is.
 */
const sectionReferenceFields = {
  assembly: uuid,
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  document: uuid,
  identifier: keyText,
  instance: uuid,
  kind: closedId(NodeKind),
  node: uuid,
};

/**
 * The fields of the declaration a placed reference names among its assembly's declarations, keyed
 * as its placed reference is: its fields, and the declaration as `declarationRef` holds it.
 */
const sectionReferenceDeclarationFields = {
  assembly: uuid,
  assemblyKind: closedId(NodeKind),
  attribute: closedId(AttributeName),
  baseTypes: natural,
  cardinality: closedId(Cardinality),
  declaration: uuid,
  declarationKind: closedId(DeclarationKind),
  document: uuid,
  identifier: keyText,
  instance: uuid,
  kind: closedId(NodeKind),
  node: uuid,
};

/**
 * A section document's feedback reference resolved under one placement, keyed by the placement's
 * instance and the reference's node and attribute. It is a relation of its own beside
 * {@link SectionPrintedRef}, so each law that resolves one is a statement of its own, which a
 * refusal names by its relations and terms ("Feedback reference", "Printed variable reference").
 */
export const SectionFeedbackRef = relation("SectionFeedbackRef", sectionReferenceFields, [
  "instance",
  "node",
  "attribute",
]);

/**
 * A section document's printed variable reference resolved under one placement, keyed as
 * {@link SectionFeedbackRef} is.
 */
export const SectionPrintedRef = relation("SectionPrintedRef", sectionReferenceFields, [
  "instance",
  "node",
  "attribute",
]);

/**
 * A fragment's template variable reference resolved under one placement, keyed as
 * {@link SectionFeedbackRef} is ("Template reference").
 */
export const SectionTemplateRef = relation("SectionTemplateRef", sectionReferenceFields, [
  "instance",
  "node",
  "attribute",
]);

/**
 * A fragment's context variable reference resolved under one placement, keyed as
 * {@link SectionFeedbackRef} is ("Context variable reference").
 */
export const SectionContextRef = relation("SectionContextRef", sectionReferenceFields, [
  "instance",
  "node",
  "attribute",
]);

/**
 * The outcome declaration a {@link SectionFeedbackRef} names among its assembly's declarations,
 * keyed as it is, where the assembly declares one of its name.
 */
export const SectionFeedbackRefDeclaration = relation(
  "SectionFeedbackRefDeclaration",
  sectionReferenceDeclarationFields,
  ["instance", "node", "attribute"],
);

/**
 * The outcome or template declaration a {@link SectionPrintedRef} names among its assembly's
 * declarations, keyed as it is, where the assembly declares one of its name.
 */
export const SectionPrintedRefDeclaration = relation(
  "SectionPrintedRefDeclaration",
  sectionReferenceDeclarationFields,
  ["instance", "node", "attribute"],
);

/**
 * The template declaration a {@link SectionTemplateRef} names among its assembly's declarations,
 * keyed as it is, where the assembly declares one of its name.
 */
export const SectionTemplateRefDeclaration = relation(
  "SectionTemplateRefDeclaration",
  sectionReferenceDeclarationFields,
  ["instance", "node", "attribute"],
);

/**
 * The context declaration a {@link SectionContextRef} names among its assembly's declarations,
 * keyed as it is, where the assembly declares one of its name.
 */
export const SectionContextRefDeclaration = relation(
  "SectionContextRefDeclaration",
  sectionReferenceDeclarationFields,
  ["instance", "node", "attribute"],
);

/**
 * Each placement's resolved feedback references, counted by `SectionScope.feedbacks`, which equals
 * its document's count, so each placement resolves every one.
 */
export const sectionFeedbackFamily = counted(
  on(SectionFeedbackRef, "instance"),
  fin(SectionScope, "feedbacks"),
);

/**
 * Each placement's resolved printed variable references, counted by `SectionScope.prints`.
 */
export const sectionPrintedFamily = counted(
  on(SectionPrintedRef, "instance"),
  fin(SectionScope, "prints"),
);

/**
 * Each placement's resolved template variable references, counted by `SectionScope.templates`.
 */
export const sectionTemplateFamily = counted(
  on(SectionTemplateRef, "instance"),
  fin(SectionScope, "templates"),
);

/**
 * Each placement's resolved context variable references, counted by `SectionScope.contexts`.
 */
export const sectionContextFamily = counted(
  on(SectionContextRef, "instance"),
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
  BindingDeclaration,
  BindingName,
  BoundVariable,
  Choice,
  ChoiceInteraction,
  ChoiceVariableName,
  ContextRef,
  ContextRefDeclaration,
  CountBound,
  CountRange,
  FeedbackRef,
  FeedbackRefDeclaration,
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
  SectionFeedbackRefDeclaration,
  SectionPrintedName,
  SectionPrintedRef,
  SectionPrintedRefDeclaration,
  SectionScope,
  SectionTemplateName,
  SectionTemplateRef,
  SectionTemplateRefDeclaration,
  Slider,
  TemplateRef,
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
 * A `ChoiceVariableName` row as a row check reads it.
 */
type NameRow = RowScalars<typeof ChoiceVariableName>;

/**
 * The names of an item's built-in variables, `BuiltInVariable`'s rows under the item root:
 * `numAttempts`, `duration`, `completionStatus` and `QTI_CONTEXT` (§2.2.2, §2.2.2.1).
 */
const itemBuiltInNames: readonly string[] = [
  ...new Set(
    BuiltInVariable.rows.filter(({ root }) => root === itemKind).map(({ variable }) => variable),
  ),
];

/**
 * State "Choice not variable" over one used identifier (spec reading 104): no choice or hottext
 * bears it, its document's own or one its assembly places (spec reading 117), or no declaration of
 * its document does and, in an item, it names none of the item's built-in variables, which "are
 * declared implicitly" (§2.2.2) and so are item variables too.
 *
 * @param n - The row.
 * @returns The predicate.
 */
const choiceNotVariable = (n: NameRow) =>
  n.or(
    n.and(
      n.eq(n.choices, 0n),
      n.eq(n.hottexts, 0n),
      n.eq(n.placedChoices, 0n),
      n.eq(n.placedHottexts, 0n),
    ),
    n.and(
      n.eq(n.declarations, 0n),
      n.or(n.ne(n.rootKind, itemKind), n.not(n.in(n.identifier, itemBuiltInNames))),
    ),
  );

/**
 * Select the attributes O3 reads: each name of {@link readAttributes} on its kinds, and the ARIA
 * range attributes on every kind. It is the one copy source over `Attribute`, so `Attribute`
 * carries one UNIQUE for O3, `(node, name)` over this selection, which serves the copy's reverse
 * probe and keeps `Attribute.lexical` out of every index.
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
 * State that an attribute's pieces are its lexical form's outer whitespace and its collapsed
 * value: they concatenate to the lexical form, the value holds no whitespace, and an empty value
 * puts all the whitespace in `lead`, so the split is the one split.
 *
 * @param v - The row.
 * @returns The predicate.
 */
const collapsed = (v: AttributeRow) =>
  v.and(
    v.eq(v.lexical, Compute.concat(Compute.concat(v.lead, v.value), v.trail)),
    Compute.matches(v.value, atomicValuePattern),
    v.or(v.ne(v.value, ""), v.eq(v.trail, "")),
  );

/**
 * The XSD default of an attribute on a kind in a version, as the inventory leaf declares it.
 */
const defaults: ReadonlyMap<string, string> = new Map(
  attributeDeclarations.flatMap(({ default: stated, kind, name, versions: held }) =>
    Option.toArray(stated).flatMap((value) =>
      held.map((version) => [`${version} ${kind} ${name}`, value] as const),
    ),
  ),
);

/**
 * Read the XSD default of a count attribute.
 *
 * @param version - The schema version.
 * @param kind - The element's kind.
 * @param name - The attribute.
 * @returns Its default's lexical form, or none where the XSD gives none.
 */
export const countDefault = (version: string, kind: Kind, name: Name): Option.Option<string> =>
  Option.fromNullishOr(defaults.get(`${version} ${kind} ${name}`));

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
const countSign = "^(?:[^-]|-0+$)";

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
 * The lexical form of an `xs:double` that `Compute.cast` reads exactly: XML Schema's, cut to the
 * values a double precision holds (grizzle's `lexicalForm`: at most 15 significant digits and an
 * exponent of at most 293). A bound outside it is not ordered, a stated limit of G-parse.
 */
const doubleForm = lexicalForm(pg["double precision"]);

/**
 * The numeric an `xs:decimal` ARIA value is compared in: the widest `numeric(p, s)` with a lexical
 * form, 256 integer and 255 fraction digits (grizzle's `decimalWritable`). A value outside it is
 * not ordered, a stated limit of G-parse.
 */
const AriaDecimal = pg.numeric(511, 255);

/**
 * The lexical form {@link AriaDecimal} casts from.
 */
const decimalForm = lexicalForm(AriaDecimal);

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
 * The read `response-identifier` of each interaction, one per interaction, keyed by its node: the
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
 * The read attributes a section document's or a fragment's feedback references are: its feedback
 * elements' outcomes, where they name a variable.
 */
const sectionFeedbackSource = select(InteractionAttribute, (v) =>
  v.and(
    v.not(v.in(v.rootKind, referringRoots)),
    v.in(v.name, references.feedback.attributes),
    v.in(v.kind, references.feedback.kinds),
    Compute.matches(v.value, namePattern),
  ),
);

/**
 * The read attributes a section document's or a fragment's printed variable references are:
 * printed variables' names, bases and indices, where they name a variable.
 */
const sectionPrintedSource = select(InteractionAttribute, (v) =>
  v.and(v.not(v.in(v.rootKind, referringRoots)), printedReference(v)),
);

/**
 * Select the read attributes a fragment's references of one class are (spec reading 117): the
 * class's attributes on its kinds that name a variable, in a document that is no item, test or
 * section.
 *
 * @param reference - The class's attributes and kinds.
 * @returns The selection.
 */
const fragmentReferenceOf = (reference: {
  readonly attributes: readonly Name[];
  readonly kinds: readonly Kind[];
}) =>
  select(InteractionAttribute, (v) =>
    v.and(
      v.not(v.in(v.rootKind, unfragmentedRoots)),
      v.in(v.name, reference.attributes),
      v.in(v.kind, reference.kinds),
      Compute.matches(v.value, namePattern),
    ),
  );

/**
 * The read attributes a fragment's template and context variable references are.
 */
const fragmentSources = {
  context: fragmentReferenceOf(references.context),
  template: fragmentReferenceOf(references.template),
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
 * declaration has no declaration row, never the nil uuid):
 *
 * - An own reference that names no built-in variable of its root has its declaration row, which is
 *   its own reference's, of a kind `ContentReference` allows, a declaration of its document through
 *   `declarationRef`, and names no built-in of its root; one that names a built-in of its root
 *   names one it may;
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
    on(select(own, namesNoBuiltIn), "node", "attribute"),
    on(ownDeclared, "node", "attribute"),
  ),
  contained(
    on(ownDeclared, "node", "attribute", "kind", "document", "assemblyKind", "identifier"),
    on(own, "node", "attribute", "kind", "document", "assemblyKind", "identifier"),
  ),
  contained(on(ownDeclared, "kind", "attribute", "declarationKind"), allowedDeclarationKinds),
  contained(
    on(
      ownDeclared,
      "declaration",
      "document",
      "identifier",
      "declarationKind",
      "cardinality",
      "baseTypes",
    ),
    declarationRef,
  ),
  check(rule, ownDeclared, namesNoBuiltIn),
  check(rule, own, namesAllowedBuiltIn),
  contained(
    on(placed, "node", "attribute", "kind", "document", "identifier"),
    on(names, "node", "attribute", "kind", "document", "identifier"),
  ),
  contained(
    on(select(placed, namesNoBuiltIn), "instance", "node", "attribute"),
    on(placedDeclared, "instance", "node", "attribute"),
  ),
  contained(
    on(
      placedDeclared,
      "instance",
      "node",
      "attribute",
      "assembly",
      "assemblyKind",
      "kind",
      "document",
      "identifier",
    ),
    on(
      placed,
      "instance",
      "node",
      "attribute",
      "assembly",
      "assemblyKind",
      "kind",
      "document",
      "identifier",
    ),
  ),
  contained(on(placedDeclared, "kind", "attribute", "declarationKind"), allowedDeclarationKinds),
  contained(
    on(
      placedDeclared,
      "declaration",
      "assembly",
      "identifier",
      "declarationKind",
      "cardinality",
      "baseTypes",
    ),
    declarationRef,
  ),
  check(rule, placedDeclared, namesNoBuiltIn),
  check(rule, placed, namesAllowedBuiltIn),
];

/**
 * The bindings whose variable has a base type: each has its {@link BindingBaseType}, and only these
 * do.
 */
const typedBindings = select(BindingDeclaration, (r) => r.eq(r.baseTypes, 1n));

/**
 * The placed bindings whose variable has a base type: each has its {@link PlacedBindingBaseType},
 * and only these do.
 */
const typedPlacedBindings = select(PlacedBindingDeclaration, (r) => r.eq(r.baseTypes, 1n));

/**
 * The cardinalities a feedback element's outcome may have (§5.49.1, §5.52.1: "an outcome variable
 * of base-type identifier and single or multiple cardinality"): a record's is none of them, so
 * its whole value is judged by its cardinality alone.
 */
const feedbackCardinalities = ["single", "multiple"] as const;

/**
 * The declarations whose base type is `identifier`, a feedback outcome's, where the declaration has
 * a base type: the target of `Feedback_outcome_type`'s containment over a feedback reference's
 * declaration.
 */
const identifierTyped = on(
  select(DeclarationBaseType, (b) => b.eq(b.baseType, "identifier")),
  "node",
);

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
 * - **interactions:** each interaction's {@link Interaction} (its node's, of an interaction kind),
 *   the owner of its choices.
 * - **bindings:** each interaction's {@link Binding}, where it writes a `response-identifier` (its
 *   node's, the part of its {@link Interaction}, exactly where the attribute is read); each item
 *   binding's {@link BoundVariable}, which has its {@link BindingDeclaration} ("Binding declared",
 *   reading 75), a response declaration's, whose fields are the binding's and back; each
 *   declaration of a type `BindingFit` or `RecordBindingFit` admits, the custom and portable custom
 *   interactions of any type, and a string binding's of base type string ("BindingFit"), each fit
 *   law over the declaration rows alone; "Binding unique" (`key(document, identifier)`); "Binding
 *   cardinality" (a single response takes a most of 1, where its interaction's most has a value);
 *   `max-strings-required`, which carries `kind` beside `node` so that its containment into
 *   `CountBound` is a statement of its own, not "Binding cardinality"'s: a refusal names a law by
 *   its relations and terms, never its selection (C22); and "AdaptiveFeedback", an interaction
 *   inside feedback is in an adaptive item.
 * - **choices:** each choice's {@link ChoiceInteraction}, which every choice has ("N8 nearest"), its
 *   interaction the choice's nearest, the counted family under `Interaction`; its identifier
 *   distinct among its document's choices of its kind; each hottext's nearest kind, and its
 *   identifier distinct among its document's hottexts (reading 104); and in place (spec reading
 *   117), under each instance of each assembly, as many {@link PlacedChoice} and
 *   {@link PlacedHottext} rows as its document has choices and hottexts, each its document's, their
 *   identifiers distinct over the assembly.
 * - **choice names** (reading 104): each identifier a choice, a hottext or a declaration uses, or
 *   that an assembly places on a choice or a hottext (reading 117), has its
 *   {@link ChoiceVariableName} under its document or its assembly's root document, of that
 *   document's root kind, counting each of the five; no row counts none (`E1_derived`); and "Choice
 *   not variable".
 * - **the default hotspot** (reading 80): `default_hotspot_last_slot` and
 *   `Graphic_gap_match_default_hotspot` over each hotspot's shape, its rank and its parent's
 *   count.
 * - **counts:** each bound's counts written or defaulted, a row of its own where it has a value,
 *   typed by G-parse (`E1_derived`), and "Choice bounds" over the values a count has.
 * - **ranges:** "Slider bounds", and "Aria value range" over the elements that carry both ARIA
 *   bounds.
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
 *   through `declarationRef`; and a built-in's of that root is one its kind and attribute may name
 *   there, under its reference's law ("Feedback reference", "Template reference", "Printed variable
 *   reference", "Context variable reference"); "Feedback outcome type" over the declaration rows
 *   (reading 77: an outcome of base type identifier, single or multiple; the one built-in a
 *   feedback may name, `completionStatus`, is a single identifier, §2.2.2.3); and "Template
 *   variable type" over the declaration rows (reading R15-l: a template element's or a choice's
 *   template variable of base type identifier, single or multiple, a portable custom interaction's
 *   free).
 */
export const interactionLawsByName = {
  ...pipe(contentReferences, Rec.map(contentReferenceLaws)),
  "Adaptive feedback": [
    contained(
      on(
        select(BoundVariable, (r) =>
          r.and(r.eq(r.attribute, "response-identifier"), r.eq(r.adaptive, false)),
        ),
        "node",
      ),
      on(outsideFeedback, "id"),
    ),
    contained(
      on(
        select(PlacedBinding, (r) =>
          r.and(r.eq(r.attribute, "response-identifier"), r.eq(r.adaptive, false)),
        ),
        "node",
      ),
      on(outsideFeedback, "id"),
    ),
  ],
  "Aria value range": [
    check("Aria_value_range", AriaRange, (r) =>
      r.le(
        Compute.when(
          Compute.matches(r.min, decimalForm),
          (min) => Compute.cast(min, AriaDecimal),
          Decimal.negativeInfinity,
        ),
        Compute.when(
          Compute.matches(r.max, decimalForm),
          (max) => Compute.cast(max, AriaDecimal),
          Decimal.infinity,
        ),
      ),
    ),
  ],
  "Binding cardinality": [
    contained(
      on(
        select(BindingDeclaration, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.in(r.kind, cardinalityKinds),
            r.eq(r.cardinality, "single"),
            r.eq(r.mosts, 1n),
          ),
        ),
        "node",
      ),
      on(
        select(MostCount, (m) => m.eq(m.mostValue, 1n)),
        "node",
      ),
    ),
    contained(
      on(
        select(PlacedBindingDeclaration, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.in(r.kind, cardinalityKinds),
            r.eq(r.cardinality, "single"),
            r.eq(r.mosts, 1n),
          ),
        ),
        "node",
      ),
      on(
        select(MostCount, (m) => m.eq(m.mostValue, 1n)),
        "node",
      ),
    ),
  ],
  "Binding declared": [
    contained(
      on(BoundVariable, "node", "attribute", "kind", "document", "identifier"),
      on(BindingDeclaration, "node", "attribute", "kind", "document", "identifier"),
    ),
    contained(
      on(
        BindingDeclaration,
        "declaration",
        "document",
        "identifier",
        "declarationKind",
        "cardinality",
        "baseTypes",
      ),
      declarationRef,
    ),
    check("Binding_declared", BindingDeclaration, (r) =>
      r.eq(r.declarationKind, "qti-response-declaration"),
    ),
    contained(on(typedBindings, "node", "attribute"), on(BindingBaseType, "node", "attribute")),
    contained(
      on(BindingBaseType, "node", "attribute", "declaration", "cardinality", "kind"),
      on(typedBindings, "node", "attribute", "declaration", "cardinality", "kind"),
    ),
    contained(
      on(BindingBaseType, "declaration", "baseType"),
      on(DeclarationBaseType, "node", "baseType"),
    ),
    contained(
      on(
        PlacedBinding,
        "instance",
        "node",
        "attribute",
        "assembly",
        "document",
        "kind",
        "identifier",
      ),
      on(
        PlacedBindingDeclaration,
        "instance",
        "node",
        "attribute",
        "assembly",
        "document",
        "kind",
        "identifier",
      ),
    ),
    contained(
      on(
        PlacedBindingDeclaration,
        "declaration",
        "assembly",
        "identifier",
        "declarationKind",
        "cardinality",
        "baseTypes",
      ),
      declarationRef,
    ),
    check("Binding_declared", PlacedBindingDeclaration, (r) =>
      r.eq(r.declarationKind, "qti-response-declaration"),
    ),
    contained(
      on(typedPlacedBindings, "instance", "node", "attribute"),
      on(PlacedBindingBaseType, "instance", "node", "attribute"),
    ),
    contained(
      on(
        PlacedBindingBaseType,
        "instance",
        "node",
        "attribute",
        "declaration",
        "cardinality",
        "kind",
      ),
      on(
        typedPlacedBindings,
        "instance",
        "node",
        "attribute",
        "declaration",
        "cardinality",
        "kind",
      ),
    ),
    contained(
      on(PlacedBindingBaseType, "declaration", "baseType"),
      on(DeclarationBaseType, "node", "baseType"),
    ),
  ],
  "Binding unique": [
    key(on(BoundVariable, "document", "identifier")),
    key(on(PlacedBinding, "assembly", "identifier")),
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
    check("BindingFit", BindingDeclaration, (r) =>
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
    check("BindingFit", PlacedBindingDeclaration, (r) =>
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
    key(on(Choice, "document", "kind", "identifier")),
    key(on(Hottext, "document", "identifier")),
    key(on(PlacedChoice, "assembly", "kind", "identifier")),
    key(on(PlacedHottext, "assembly", "identifier")),
  ],
  "Choice not variable": [check("Choice_not_variable", ChoiceVariableName, choiceNotVariable)],
  "Custom interaction version": [
    check("Custom_interaction_version", Interaction, (i) =>
      i.or(i.ne(i.kind, customKind), i.ne(i.version, "3.0.0")),
    ),
  ],
  "DocumentId key": [key(on(moduleAttributes, "node"))],
  "E1 derived": [
    key(on(read, "node", "name")),
    contained(
      on(read, "node", "name", "kind", "document", "lexical"),
      on(InteractionAttribute, "node", "name", "kind", "document", "lexical"),
    ),
    contained(on(InteractionAttribute, "node", "name"), on(read, "node", "name")),
    contained(on(InteractionAttribute, "document", "rootKind"), on(Document, "node", "rootKind")),
    check("E1_derived", InteractionAttribute, collapsed),
    contained(
      on(Interaction, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    check("E1_derived", Interaction, (i) => i.in(i.kind, interactionKinds)),
    contained(
      on(Binding, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    key(on(attributeForms, "node")),
    key(on(elementForms, "node")),
    key(on(moduleElements, "parent")),
    contained(on(moduleAttributes, "node"), on(attributeForms, "node")),
    contained(on(attributeForms, "node"), on(moduleAttributes, "node")),
    contained(on(moduleElements, "parent"), on(elementForms, "node")),
    contained(on(elementForms, "node"), on(moduleElements, "parent")),
    pciModuleFamily,
    contained(on(Binding, "node"), on(Interaction, "node")),
    key(on(responseIdentifiers, "node")),
    mirrors(on(responseIdentifiers, "node"), on(Binding, "node")),
    check("E1_derived", Binding, (b) => b.in(b.kind, interactionKinds)),
    contained(
      on(itemBindings, "node", "name", "kind", "document", "value"),
      on(BoundVariable, "node", "attribute", "kind", "document", "identifier"),
    ),
    contained(on(BoundVariable, "node", "kind"), on(Binding, "node", "kind")),
    contained(on(BindingDeclaration, "node", "attribute"), on(BoundVariable, "node", "attribute")),
    contained(on(BoundVariable, "document", "adaptive"), on(ItemMode, "document", "adaptive")),
    contained(
      on(namedBindings, "node", "name", "kind", "document", "value"),
      on(BindingName, "node", "attribute", "kind", "document", "identifier"),
    ),
    contained(on(BindingName, "node", "kind"), on(Binding, "node", "kind")),
    bindingNameFamily,
    placedBindingFamily,
    contained(
      on(PlacedBinding, "instance", "document", "assembly"),
      on(itemInstances, "id", "document", "assembly"),
    ),
    contained(
      on(PlacedBinding, "node", "attribute", "document", "kind", "identifier"),
      on(BindingName, "node", "attribute", "document", "kind", "identifier"),
    ),
    contained(
      on(PlacedBindingDeclaration, "instance", "node", "attribute"),
      on(PlacedBinding, "instance", "node", "attribute"),
    ),
    contained(on(PlacedBinding, "assembly", "adaptive"), on(ItemMode, "document", "adaptive")),
    key(on(adaptiveTrue, "document")),
    contained(
      on(
        select(ItemMode, (m) => m.eq(m.adaptive, true)),
        "document",
      ),
      on(adaptiveTrue, "document"),
    ),
    contained(
      on(adaptiveTrue, "document"),
      on(
        select(ItemMode, (m) => m.eq(m.adaptive, true)),
        "document",
      ),
    ),
    contained(
      on(readOf(["identifier"], choiceKinds), "node", "value"),
      on(Choice, "node", "identifier"),
    ),
    check("E1_derived", Choice, (c) => c.in(c.kind, choiceKinds)),
    contained(
      on(Hottext, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(readOf(["identifier"], [hottextKind]), "node", "value"),
      on(Hottext, "node", "identifier"),
    ),
    check("E1_derived", Hottext, (h) =>
      h.and(
        h.eq(h.kind, hottextKind),
        h.or(
          h.and(h.eq(h.nearest, h.document), h.eq(h.nearestKind, "document")),
          h.and(h.ne(h.nearest, h.document), h.in(h.nearestKind, interactionKinds)),
        ),
      ),
    ),
    documentChoiceFamily,
    documentHottextFamily,
    placedChoiceFamily,
    placedHottextFamily,
    contained(
      on(PlacedChoice, "instance", "document", "assembly"),
      on(Instance, "id", "document", "assembly"),
    ),
    contained(
      on(PlacedChoice, "node", "document", "kind", "identifier"),
      on(Choice, "node", "document", "kind", "identifier"),
    ),
    contained(
      on(PlacedHottext, "instance", "document", "assembly"),
      on(Instance, "id", "document", "assembly"),
    ),
    contained(
      on(PlacedHottext, "node", "document", "identifier"),
      on(Hottext, "node", "document", "identifier"),
    ),
    contained(on(ChoiceVariableName, "document", "rootKind"), on(Document, "node", "rootKind")),
    choiceNameFamily,
    hottextNameFamily,
    declarationNameFamily,
    placedChoiceNameFamily,
    placedHottextNameFamily,
    check("E1_derived", ChoiceVariableName, (n) =>
      n.or(
        n.gt(n.choices, 0n),
        n.gt(n.hottexts, 0n),
        n.gt(n.declarations, 0n),
        n.gt(n.placedChoices, 0n),
        n.gt(n.placedHottexts, 0n),
      ),
    ),
    contained(
      on(Hotspot, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(readOf(["shape"], hotspotKinds), "node", "value"), on(Hotspot, "node", "area")),
    contained(on(Hotspot, "parent", "parentKind"), on(Interaction, "node", "kind")),
    contained(on(Hotspot, "node", "elements", "elementChildren"), nodeCounts),
    contained(on(Hotspot, "parent", "parentElements", "parentElementChildren"), nodeCounts),
    check("E1_derived", Hotspot, (h) => h.in(h.kind, hotspotKinds)),
    contained(
      on(CountBound, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(
        select(Interaction, (i) => i.in(i.kind, boundKinds)),
        "node",
      ),
      on(CountBound, "node"),
    ),
    contained(
      on(
        select(Choice, (c) => c.in(c.kind, boundKinds)),
        "node",
      ),
      on(CountBound, "node"),
    ),
    mirrors(
      on(readOf(minNames, boundKinds), "node", "name"),
      on(
        select(CountBound, (b) => b.eq(b.minWritten, true)),
        "node",
        "minName",
      ),
    ),
    mirrors(
      on(readOf(maxNames, boundKinds), "node", "name"),
      on(
        select(CountBound, (b) => b.eq(b.maxWritten, true)),
        "node",
        "maxName",
      ),
    ),
    contained(
      on(
        select(CountBound, (b) => b.in(b.kind, interactionKinds)),
        "node",
        "choices",
      ),
      on(Interaction, "node", "choices"),
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
      on(LeastCount, "node", "kind", "version", "minName", "minWritten", "choices"),
      on(CountBound, "node", "kind", "version", "minName", "minWritten", "choices"),
    ),
    mirrors(
      on(integerReadOf(minNames), "node", "name", "value"),
      on(
        select(LeastCount, (l) => l.eq(l.minWritten, true)),
        "node",
        "minName",
        "least",
      ),
    ),
    contained(
      on(
        select(CountBound, (b) => b.and(b.eq(b.minWritten, false), hasDefault(b, defaultedLeast))),
        "node",
      ),
      on(LeastCount, "node"),
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
      on(MostCount, "node", "kind", "version", "maxName", "maxWritten", "minWritten", "choices"),
      on(CountBound, "node", "kind", "version", "maxName", "maxWritten", "minWritten", "choices"),
    ),
    mirrors(
      on(integerReadOf(maxNames), "node", "name", "value"),
      on(
        select(MostCount, (m) => m.eq(m.maxWritten, true)),
        "node",
        "maxName",
        "most",
      ),
    ),
    contained(
      on(
        select(CountBound, (b) => b.and(b.eq(b.maxWritten, false), hasDefault(b, defaultedMost))),
        "node",
      ),
      on(MostCount, "node"),
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
        "node",
      ),
      on(CountRange, "node"),
    ),
    contained(on(CountRange, "node", "leastValue"), on(LeastCount, "node", "leastValue")),
    contained(
      on(CountRange, "node", "mostValue", "kind", "minWritten"),
      on(MostCount, "node", "mostValue", "kind", "minWritten"),
    ),
    contained(
      on(
        select(BindingDeclaration, (r) => r.in(r.kind, boundKinds)),
        "node",
        "mosts",
      ),
      on(CountBound, "node", "mosts"),
    ),
    check("E1_derived", BindingDeclaration, (r) =>
      r.or(r.in(r.kind, boundKinds), r.eq(r.mosts, 0n)),
    ),
    contained(
      on(
        select(PlacedBindingDeclaration, (r) => r.in(r.kind, boundKinds)),
        "node",
        "mosts",
      ),
      on(CountBound, "node", "mosts"),
    ),
    check("E1_derived", PlacedBindingDeclaration, (r) =>
      r.or(r.in(r.kind, boundKinds), r.eq(r.mosts, 0n)),
    ),
    contained(
      on(readOf(["lower-bound"], [sliderKind]), "node", "value"),
      on(Slider, "node", "lower"),
    ),
    contained(
      on(readOf(["upper-bound"], [sliderKind]), "node", "value"),
      on(Slider, "node", "upper"),
    ),
    contained(
      on(Slider, "node", "lower"),
      on(
        select(InteractionAttribute, (v) => v.eq(v.name, "lower-bound")),
        "node",
        "value",
      ),
    ),
    contained(
      on(
        select(InteractionAttribute, (v) => v.in(v.name, ariaNames)),
        "node",
        "name",
        "value",
      ),
      on(AriaValue, "node", "name", "value"),
    ),
    contained(
      on(AriaValue, "node", "name", "value"),
      on(InteractionAttribute, "node", "name", "value"),
    ),
    ariaValueFamily,
    check("E1_derived", AriaElement, (e) => e.gt(e.values, 0n)),
    contained(
      on(
        select(AriaElement, (e) => e.eq(e.values, 2n)),
        "node",
      ),
      on(AriaRange, "node"),
    ),
    contained(
      on(AriaRange, "node", "min"),
      on(
        select(AriaValue, (a) => a.eq(a.name, "aria-valuemin")),
        "node",
        "value",
      ),
    ),
    contained(
      on(AriaRange, "node", "max"),
      on(
        select(AriaValue, (a) => a.eq(a.name, "aria-valuemax")),
        "node",
        "value",
      ),
    ),
    contained(
      on(referenceSources.feedback, "node", "name", "kind", "document", "rootKind", "value"),
      on(FeedbackRef, "node", "attribute", "kind", "document", "assemblyKind", "identifier"),
    ),
    contained(
      on(referenceSources.template, "node", "name", "kind", "document", "rootKind", "value"),
      on(TemplateRef, "node", "attribute", "kind", "document", "assemblyKind", "identifier"),
    ),
    contained(
      on(referenceSources.printed, "node", "name", "kind", "document", "rootKind", "value"),
      on(PrintedVariableRef, "node", "attribute", "kind", "document", "assemblyKind", "identifier"),
    ),
    contained(
      on(referenceSources.context, "node", "name", "kind", "document", "rootKind", "value"),
      on(ContextRef, "node", "attribute", "kind", "document", "assemblyKind", "identifier"),
    ),
    contained(
      on(sectionFeedbackSource, "node", "name", "kind", "document", "value"),
      on(SectionFeedbackName, "node", "attribute", "kind", "document", "identifier"),
    ),
    contained(
      on(sectionPrintedSource, "node", "name", "kind", "document", "value"),
      on(SectionPrintedName, "node", "attribute", "kind", "document", "identifier"),
    ),
    contained(
      on(fragmentSources.template, "node", "name", "kind", "document", "value"),
      on(SectionTemplateName, "node", "attribute", "kind", "document", "identifier"),
    ),
    contained(
      on(fragmentSources.context, "node", "name", "kind", "document", "value"),
      on(SectionContextName, "node", "attribute", "kind", "document", "identifier"),
    ),
    sectionFeedbackNameFamily,
    sectionPrintedNameFamily,
    sectionTemplateNameFamily,
    sectionContextNameFamily,
    contained(
      on(sectionPlacements, "id", "document", "assembly", "assemblyKind"),
      on(SectionScope, "instance", "document", "assembly", "assemblyKind"),
    ),
    contained(
      on(SectionScope, "instance", "document", "assembly", "assemblyKind"),
      on(Instance, "id", "document", "assembly", "assemblyKind"),
    ),
    contained(
      on(SectionScope, "document", "feedbacks", "prints", "templates", "contexts"),
      on(ReferringDocument, "document", "feedbacks", "prints", "templates", "contexts"),
    ),
    sectionFeedbackFamily,
    sectionPrintedFamily,
    sectionTemplateFamily,
    sectionContextFamily,
    contained(
      on(SectionFeedbackRef, "instance", "document", "assembly", "assemblyKind"),
      on(SectionScope, "instance", "document", "assembly", "assemblyKind"),
    ),
    contained(
      on(SectionPrintedRef, "instance", "document", "assembly", "assemblyKind"),
      on(SectionScope, "instance", "document", "assembly", "assemblyKind"),
    ),
    contained(
      on(SectionTemplateRef, "instance", "document", "assembly", "assemblyKind"),
      on(SectionScope, "instance", "document", "assembly", "assemblyKind"),
    ),
    contained(
      on(SectionContextRef, "instance", "document", "assembly", "assemblyKind"),
      on(SectionScope, "instance", "document", "assembly", "assemblyKind"),
    ),
  ],
  "Feedback outcome type": [
    check("Feedback_outcome_type", FeedbackRefDeclaration, (r) =>
      r.in(r.cardinality, feedbackCardinalities),
    ),
    contained(
      on(
        select(FeedbackRefDeclaration, (r) => r.eq(r.baseTypes, 1n)),
        "declaration",
      ),
      identifierTyped,
    ),
    check("Feedback_outcome_type", SectionFeedbackRefDeclaration, (r) =>
      r.in(r.cardinality, feedbackCardinalities),
    ),
    contained(
      on(
        select(SectionFeedbackRefDeclaration, (r) => r.eq(r.baseTypes, 1n)),
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
        select(BindingDeclaration, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.eq(r.kind, extendedTextKind),
            r.in(r.cardinality, ["multiple", "ordered"]),
          ),
        ),
        "node",
        "kind",
      ),
      on(
        select(CountBound, (b) => b.eq(b.maxWritten, true)),
        "node",
        "kind",
      ),
    ),
    contained(
      on(
        select(PlacedBindingDeclaration, (r) =>
          r.and(
            r.eq(r.attribute, "response-identifier"),
            r.eq(r.kind, extendedTextKind),
            r.in(r.cardinality, ["multiple", "ordered"]),
          ),
        ),
        "node",
        "kind",
      ),
      on(
        select(CountBound, (b) => b.eq(b.maxWritten, true)),
        "node",
        "kind",
      ),
    ),
  ],
  "N8 nearest": [
    contained(
      on(Choice, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(Choice, "node"), on(ChoiceInteraction, "node")),
    contained(on(ChoiceInteraction, "node", "interaction"), on(Choice, "node", "nearest")),
    choiceFamily,
    contained(
      on(
        select(Hottext, (h) => h.in(h.nearestKind, interactionKinds)),
        "nearest",
        "nearestKind",
      ),
      on(Interaction, "node", "kind"),
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
        select(BindingDeclaration, (r) =>
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
        select(PlacedBindingDeclaration, (r) =>
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
  "Slider bounds": [
    check("Slider_bounds", Slider, (s) =>
      s.or(
        s.eq(s.lower, "NaN"),
        s.eq(s.upper, "NaN"),
        s.le(
          Compute.when(
            Compute.matches(s.lower, doubleForm),
            (lower) => Compute.cast(lower, pg["double precision"]),
            Number.NEGATIVE_INFINITY,
          ),
          Compute.when(
            Compute.matches(s.upper, doubleForm),
            (upper) => Compute.cast(upper, pg["double precision"]),
            Number.POSITIVE_INFINITY,
          ),
        ),
      ),
    ),
  ],
  "Template variable type": [
    check("Template_variable_type", TemplateRefDeclaration, (r) =>
      r.or(
        r.eq(r.kind, templateVariableKind),
        r.and(r.eq(r.baseType, "identifier"), r.in(r.cardinality, ["single", "multiple"])),
      ),
    ),
    check("Template_variable_type", SectionTemplateRefDeclaration, (r) =>
      r.or(
        r.eq(r.kind, templateVariableKind),
        r.and(r.eq(r.baseType, "identifier"), r.in(r.cardinality, ["single", "multiple"])),
      ),
    ),
  ],
  "default hotspot last slot": [check("default_hotspot_last_slot", Hotspot, lastWhere)],
} as const;

/**
 * {@link interactionLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const interactionLaws = Object.values(interactionLawsByName).flat();
