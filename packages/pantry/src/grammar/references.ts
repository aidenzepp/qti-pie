/**
 * The closed relations of variables and the references to them: `DeclarationKind`, `Declares`,
 * `BuiltInVariable`, `VariableReference`, `ContentReference`, `ChoiceBound`, `ChoiceCount` and
 * `SectionPart` (fin.md §14, §17; review R9); and of the references a document makes to the files
 * of its package, `ReferenceAttribute` (spec reading 103).
 *
 * Each is a priori, a fact of QTI's vocabulary, so it is a closed relation. The rows are a
 * vocabulary's facet ({@link ReferenceFacet}), and {@link references} codes the facets of a
 * composition in its rosters. The ASI facet is derived, never typed: QTI's readings below, each
 * citing its source, applied to the XSDs' attribute declarations and content-model IR
 * (`src/vocab/inventory/`). A reading states only what the XSD does not: which attribute pairs
 * bound a count, what a reference names, which variables are built in, which kinds are processing,
 * which attributes name a file. The XSD states the rest: which kinds declare which attributes, how
 * each attribute is typed, what a kind's content holds, and what a section's model repeats.
 *
 * Only `ReferenceAttribute` has a version digit, read from the versions that declare each of its
 * attributes. The others hold in 3.0.0 and 3.0.1 alike: an attribute is read in every version that
 * declares it, and `references.test.ts` checks every relation against both XSDs.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info | QTI 3.0 ASI Information Model}
 */
import { Array as Arr, Option, Result } from "effect";
import { closed, idField, roster, valueField } from "#pantry/grammar/closed.ts";
import type {
  Closed,
  ClosedRelationError,
  IdField,
  Roster,
  ValueField,
} from "#pantry/grammar/closed.ts";
import type { KindSet, SchemaVersion } from "#pantry/grammar/kinds.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import type {
  AttributeDeclaration,
  ContentModel,
  Particle,
  TypeReading,
} from "#pantry/vocab/inventory/types.ts";

/**
 * The ways a reference's value names a variable, in code order: the `ReferenceSpelling` roster's
 * handles. A `bare` reference is the variable's identifier itself, an NCName; a `braced` one is the
 * identifier between braces, `{identifier}`. Any other value of the attribute is a literal.
 */
export const spellings = ["bare", "braced"] as const;

/**
 * A `ReferenceSpelling` handle.
 */
export type Spelling = (typeof spellings)[number];

/**
 * What a reference may name: any variable, declared or built in, as a processing element's
 * references may (`P8`); or only a declaration of one of the listed declaration kinds, as an item's
 * content references may, where no built-in counts (`feedback-ref`, `template-ref`,
 * `printed-variable-ref`).
 */
export type Names =
  | { readonly _tag: "variable" }
  | { readonly _tag: "declaration"; readonly kinds: Arr.NonEmptyReadonlyArray<string> };

/**
 * One attribute by which an element of a kind names a variable, how its value spells the name, and
 * what the name may be.
 */
export interface ReferenceRow {
  readonly attribute: string;
  readonly kind: string;
  readonly names: Names;
  readonly spelling: Spelling;
}

/**
 * One variable QTI declares itself in the processing a document's root holds, so that the document
 * names it undeclared: the root, the variable, and the declaration kind, base type and cardinality
 * it stands as there.
 */
export interface BuiltInRow {
  readonly baseType: string;
  readonly cardinality: string;
  readonly declaration: string;
  readonly root: string;
  readonly variable: string;
}

/**
 * What a most of 0 means in a count bound, in code order: the `BoundZero` roster's handles.
 *
 * - `unbounded`: a most of 0 imposes no limit, so any least meets it (spec readings 53 and 76: "If
 *   max-choices is 0 then there is no restriction", information model §5.30.2).
 * - `counted`: 0 is a count like any other, below every least of at least 1, and the pair binds only
 *   where the least is written (spec reading 18: the order interactions give 0 no meaning of its
 *   own, and "If unspecified, all of the choices must be ordered and max-choices is ignored").
 */
export const boundZeros = ["unbounded", "counted"] as const;

/**
 * A `BoundZero` handle.
 */
export type BoundZero = (typeof boundZeros)[number];

/**
 * One kind's bound on a count: the attribute of the least count, the attribute of the most, and
 * what a most of 0 means there.
 */
export interface BoundRow {
  readonly kind: string;
  readonly max: string;
  readonly min: string;
  readonly zero: BoundZero;
}

/**
 * One kind whose counts its choices bound: the kind, and the kind of the children it counts as its
 * choices. Where its least is written, both its least and its most are at most that many.
 */
export interface ChoiceCountRow {
  readonly choice: string;
  readonly kind: string;
}

/**
 * How a file reference's value names the files it references, in code order: the `ReferenceForm`
 * roster's handles. A `uri` value is one URI reference; a `srcset` value is HTML's list of image
 * candidate strings, each candidate's URL one reference (HTML, "srcset attributes").
 */
export const referenceForms = ["uri", "srcset"] as const;

/**
 * A `ReferenceForm` handle.
 */
export type ReferenceForm = (typeof referenceForms)[number];

/**
 * One attribute by which an element of a kind names a file of its package, in the versions that
 * declare it, and how its value names it (spec reading 103).
 */
export interface FileReferenceRow {
  readonly form: ReferenceForm;
  readonly kind: string;
  readonly name: string;
  readonly versions: readonly SchemaVersion[];
}

/**
 * A vocabulary's share of the reference relations: its declaration kinds, its built-in variables,
 * its references, its count bounds, the kinds whose choices bound their counts, the kinds a section
 * of it holds as parts, and the attributes by which its elements name files. A vocabulary with none
 * of these states {@link noReferences}.
 */
export interface ReferenceFacet {
  readonly builtIns: readonly BuiltInRow[];
  readonly choiceBounds: readonly BoundRow[];
  readonly choiceCounts: readonly ChoiceCountRow[];
  readonly declarations: readonly string[];
  readonly fileReferences: readonly FileReferenceRow[];
  readonly references: readonly ReferenceRow[];
  readonly sectionParts: readonly string[];
}

/**
 * The reference facet of a vocabulary that states none.
 */
export const noReferences: ReferenceFacet = {
  builtIns: [],
  choiceBounds: [],
  choiceCounts: [],
  declarations: [],
  fileReferences: [],
  references: [],
  sectionParts: [],
};

/**
 * One entry of spec reading 103's census: an attribute that names a file, on the listed kinds, or
 * on every kind of the vocabulary that declares it where none are listed, how its value names the
 * file, and the source that makes its value a reference to a file.
 */
export interface CensusEntry {
  readonly form: ReferenceForm;
  readonly kinds: Option.Option<readonly [string, ...string[]]>;
  readonly name: string;
  readonly source: string;
}

/**
 * A census entry on the listed kinds.
 *
 * @param name - The attribute.
 * @param kinds - The kinds that carry it as a file reference.
 * @param source - What makes its value a reference to a file.
 * @param form - How its value names the file, `uri` unless stated.
 * @returns The entry.
 */
const onKinds = (
  name: string,
  kinds: readonly [string, ...string[]],
  source: string,
  form: ReferenceForm = "uri",
): CensusEntry => ({ form, kinds: Option.some(kinds), name, source });

/**
 * Spec reading 103's census in the ASI vocabulary: the attributes of QTI's HTML subset whose HTML
 * definition is a URL its element links to, cites, embeds or loads, and QTI's own attributes the
 * information model defines as the location of a file. IMS Content Packaging 1.2's
 * InterchangePackage (d) then requires every file such a value resolves to within the package to be
 * one the manifest describes (`imscp_infov1p2pd2.txt:411`).
 *
 * Left out, each because its value names no file as written: `cp:file` and `cp:resource`'s `href`,
 * the manifest's own file list, which InterchangePackage (b) binds through `File`; `xml:base`,
 * which names a base, not a resource; `qti-interaction-module`'s `primary-path` and
 * `fallback-path`, an AMD module location the loader extends with `.js` (the implementation
 * guide's `modules/lib/handlebarsV2.min`, `impl.txt:8501`); `qti-response-processing`'s
 * `template`, the identifier of a published template (spec reading 51); and the identifiers
 * `qti-custom-operator`'s `definition` and `qti-portable-custom-interaction`'s
 * `custom-interaction-type-identifier`.
 */
export const asiCensus: readonly CensusEntry[] = [
  onKinds("href", ["a"], "HTML, the a element: the hyperlink's URL"),
  onKinds("cite", ["blockquote", "q"], "HTML, blockquote and q: the URL of the quotation's source"),
  onKinds("src", ["img"], "HTML, the img element: the image's URL"),
  onKinds("longdesc", ["img"], "HTML 4.01 §13.2: a link to the image's long description"),
  onKinds("data", ["object"], "HTML, the object element: the resource's URL"),
  onKinds("src", ["audio", "video", "source", "track"], "HTML, media elements: the resource's URL"),
  onKinds("poster", ["video"], "HTML, the video element: the poster frame's URL"),
  onKinds("srcset", ["source"], "HTML, srcset attributes: image candidate strings", "srcset"),
  onKinds(
    "href",
    ["qti-stylesheet"],
    "information model, Stylesheet: the stylesheet's location (§5.137)",
  ),
  onKinds(
    "href",
    ["qti-assessment-item-ref", "qti-assessment-section-ref", "qti-assessment-stimulus-ref"],
    "information model, AssessmentItemRef §6.6, AssessmentSectionRef §6.8 and AssessmentStimulusRef §7.6: the referenced file",
  ),
  onKinds(
    "href",
    ["qti-adaptive-engine-ref", "qti-adaptive-settings-ref"],
    "information model, the adaptive selection references: the engine's and the settings' files",
  ),
  onKinds(
    "href",
    ["qti-metadata-ref", "qti-usagedata-ref"],
    "information model, the metadata and usage-data references: the file's location",
  ),
  onKinds(
    "primary-configuration",
    ["qti-interaction-modules"],
    "information model §7.18 and the implementation guide's modules/maths_config.js (impl.txt:8500): a module configuration file",
  ),
  onKinds(
    "secondary-configuration",
    ["qti-interaction-modules"],
    "information model §7.18 (spec reading 11): a fallback module configuration file",
  ),
  onKinds(
    "template-location",
    ["qti-response-processing"],
    "information model §5.119 and the implementation guide's ../rptemplates/match_correct.xml (impl.txt:13693): a template file",
  ),
  onKinds(
    "long-interpretation",
    ["qti-outcome-declaration"],
    "information model §5.115: a URI that points to a fuller interpretation of the outcome",
  ),
];

/**
 * Spec reading 103's census in XInclude: `xi:include`'s `href`, "a URI reference ... the location
 * of the resource to include" (XInclude 1.0 §3.1).
 */
export const xiCensus: readonly CensusEntry[] = [
  onKinds("href", ["xi:include"], "XInclude 1.0 §3.1: the location of the resource to include"),
];

/**
 * Spec reading 103's census in MathML 3: `href`, which makes any element a hyperlink (§2.1.6);
 * `math`'s `altimg`, its fallback image, and `cdgroup`, a content dictionary group file (§2.2.1);
 * `mglyph`'s `src`, the glyph's image (§3.2.1.2); `share`'s `src`, the shared expression (§4.2.7);
 * and the `src` of `annotation` and `annotation-xml`, the annotation's location (§5.1.2).
 * `definitionURL` identifies a symbol's definition and names no file, so it is left out.
 */
export const mathmlCensus: readonly CensusEntry[] = [
  { form: "uri", kinds: Option.none(), name: "href", source: "MathML 3 §2.1.6: a hyperlink" },
  onKinds("altimg", ["m:math"], "MathML 3 §2.2.1: the fallback image"),
  onKinds("cdgroup", ["m:math"], "MathML 3 §2.2.1: a content dictionary group file"),
  onKinds("src", ["m:mglyph"], "MathML 3 §3.2.1.2: the glyph's image"),
  onKinds("src", ["m:share"], "MathML 3 §4.2.7: the shared expression"),
  onKinds(
    "src",
    ["m:annotation", "m:annotation-xml"],
    "MathML 3 §5.1.2: the annotation's location",
  ),
];

/**
 * Spec reading 103's census in SSML 1.1: `audio`'s `src`, the audio file (§3.3.1), and `lexicon`'s
 * `uri`, the pronunciation lexicon document (§3.1.4).
 */
export const ssmlCensus: readonly CensusEntry[] = [
  onKinds("src", ["ssml:audio"], "SSML 1.1 §3.3.1: the audio file"),
  onKinds("uri", ["ssml:lexicon"], "SSML 1.1 §3.1.4: the lexicon document"),
];

/**
 * Read a census against a vocabulary's attribute declarations: one row per declaration an entry
 * names, in the versions that declare it.
 *
 * @param declarations - The attribute declarations.
 * @param census - The census.
 * @param inVocabulary - Whether a kind is the vocabulary's, for an entry that lists no kinds.
 * @returns The rows, in declaration order.
 */
export const fileReferencesIn = (
  declarations: readonly AttributeDeclaration[],
  census: readonly CensusEntry[],
  inVocabulary: (kind: string) => boolean,
): readonly FileReferenceRow[] =>
  declarations.flatMap(({ kind, name, versions }) =>
    census
      .filter(
        (entry) =>
          entry.name === name &&
          Option.match(entry.kinds, {
            onNone: () => inVocabulary(kind),
            onSome: (kinds) => kinds.includes(kind),
          }),
      )
      .slice(0, 1)
      .map(({ form }) => ({ form, kind, name, versions })),
  );

/**
 * The attribute whose presence makes a kind a declaration: a variable's declaration is the element
 * that states its cardinality.
 *
 * A variable is an identifier, a cardinality and a base type (information model §2.2.2, Item
 * Variables), and the ASI XSDs declare `cardinality` on the four `qti-*-declaration` types and on
 * no other. So the XSD states the declaration kinds, and `DeclarationKind` reads them from it.
 */
const declaringAttribute = "cardinality";

/**
 * The roots whose processing holds an item's built-in variables: an item's, and a response
 * processing template's, which an item's response processing names (information model §2.2.2,
 * Item Variables).
 */
export const itemRoots = ["qti-assessment-item", "qti-response-processing"] as const;

/**
 * The roots whose processing holds a test's built-in variables: a test's, and a section's, whose
 * processing a test reaches (information model §2.2.2, the test-level `duration`; spec reading 29).
 */
export const testRoots = ["qti-assessment-test", "qti-assessment-section"] as const;

/**
 * The variables QTI declares itself, which a document's processing names without declaring them,
 * each by the roots that hold it, with the declaration kind, base type and cardinality it stands as
 * there (information model §2.2.2, Item Variables, and §2.2.2.1, Context Variable; spec reading 29,
 * the UP audit's A63; `info.txt` lines 8462 to 8468 and 9214):
 *
 * - An item's built-in response variables `numAttempts`, a single integer, and `duration`, "a single
 *   float that records the accumulated time (in seconds)", and its built-in outcome variable
 *   `completionStatus`, a single identifier;
 * - A test's, a section's and a part's `duration`, "a single value of base-type duration";
 * - The built-in context variable `QTI_CONTEXT`, a record, which has no base type ("Variables with
 *   record cardinality have no base-type"), so its base type is `none`, in both.
 *
 * `duration` stands as a response declaration wherever it is read; only its base type follows the
 * root. The variables' order is their codes'. No XSD names them.
 */
const builtIns: readonly BuiltInRow[] = [
  ...itemRoots.flatMap((root): readonly BuiltInRow[] => [
    {
      baseType: "integer",
      cardinality: "single",
      declaration: "qti-response-declaration",
      root,
      variable: "numAttempts",
    },
    {
      baseType: "float",
      cardinality: "single",
      declaration: "qti-response-declaration",
      root,
      variable: "duration",
    },
    {
      baseType: "identifier",
      cardinality: "single",
      declaration: "qti-outcome-declaration",
      root,
      variable: "completionStatus",
    },
  ]),
  ...testRoots.map((root): BuiltInRow => ({
    baseType: "duration",
    cardinality: "single",
    declaration: "qti-response-declaration",
    root,
    variable: "duration",
  })),
  ...[...itemRoots, ...testRoots].map((root): BuiltInRow => ({
    baseType: "none",
    cardinality: "record",
    declaration: "qti-context-declaration",
    root,
    variable: "QTI_CONTEXT",
  })),
];

/**
 * The attribute by which a processing element names the variable it reads or writes: `identifier`,
 * on `qti-variable`, `qti-correct`, `qti-default`, the two mappings, the lookup and the four set
 * rules (information model, each class's `identifier`). Processing declares no variable, so in
 * processing `identifier` always names one; in content it is an element's own name.
 */
const processingName = "identifier";

/**
 * The roots of processing: response, outcome and template processing (information model, the
 * `ResponseProcessing`, `OutcomeProcessing` and `TemplateProcessing` classes). A processing kind is
 * one their content models reach, the expressions and rules; an XInclude standing for one is no
 * processing kind of its own.
 */
const processingRoots = [
  "qti-outcome-processing",
  "qti-response-processing",
  "qti-template-processing",
] as const;

/**
 * The root of an item's content: what an item's content models reach, processing apart, is where
 * {@link contentNames} and the printed variable name an item's own declarations. A test's
 * `qti-test-feedback` and `qti-template-default` are outside it: the first names its test's
 * outcome ({@link testFeedback}), the second its referenced item's template variable, neither a
 * declaration of an item.
 */
const itemRoot = "qti-assessment-item";

/**
 * The reference a test's own content makes to its declarations: a test feedback's
 * `outcome-identifier`, "The identifier of an outcome variable that must have a base-type of
 * identifier and be of either single or multiple cardinality. The visibility of the test feedback
 * is controlled by assigning a value (or values) to this outcome variable during Outcomes
 * Processing" (information model §5.157.2, TestFeedback; the UP audit's A43, spec reading 77). It
 * names an outcome the test declares, read as the bare identifier.
 */
const testFeedback = {
  attribute: "outcome-identifier",
  declarations: ["qti-outcome-declaration"],
  kind: "qti-test-feedback",
} as const;

/**
 * The XSD types that spell a variable reference as a member of an attribute's union, beside the
 * literal member, and the spelling each gives.
 *
 * The information model types these attributes integer-, float- or string-or-variable-reference;
 * the ASI XSDs write the reference member as `VariableStringDType` (an NCName), as `xs:NCName`
 * itself (`qti-index`'s `n` and `qti-repeat`'s `number-repeats`), or, where the literal is a string
 * an NCName could be, as `EncVariableStringDType`, an NCName between braces (`qti-pattern-match`'s
 * `pattern`). No other union of either XSD has an NCName member.
 */
const referenceMembers: ReadonlyMap<string, Spelling> = new Map([
  ["EncVariableStringDType", "braced"],
  ["VariableStringDType", "bare"],
  ["xs:NCName", "bare"],
]);

/**
 * The attributes by which an item's content names a declaration, and the declaration kind each
 * names: a feedback element is shown by an outcome (`outcome-identifier`), and a template element
 * or a choice by a template variable (`template-identifier`), on every kind that declares the
 * attribute (information model, the `outcome-identifier` of §5.49.1, §5.52.1, §5.93.1 and §5.148.1;
 * the `template-identifier` of §5.122.1, §5.124.1, §5.145.1, §5.155.1 and the nine choices').
 */
const contentNames: ReadonlyMap<string, Arr.NonEmptyReadonlyArray<string>> = new Map([
  ["outcome-identifier", ["qti-outcome-declaration"]],
  ["template-identifier", ["qti-template-declaration"]],
]);

/**
 * The kinds whose every reference names one of a few declaration kinds, and the attributes by
 * which each names a variable beside those its XSD types as references.
 *
 * A printed variable prints the outcome or template variable its `identifier` names, and the
 * variable references its `base` and `index` may hold name outcome or template variables too
 * (information model, PrintedVariable; the rule `printed-variable-ref`, which also holds a `base`
 * or `index` reference to an integer single variable). A portable custom interaction's context
 * variable names the built-in `QTI_CONTEXT` or a declared context variable (information model
 * §2.2.2.1, Context Variable; the Schematron's rule 20Ba, spec reading 9).
 */
const printing: ReadonlyMap<
  string,
  {
    readonly declarations: Arr.NonEmptyReadonlyArray<string>;
    readonly named: readonly string[];
  }
> = new Map([
  [
    "qti-printed-variable",
    {
      declarations: ["qti-outcome-declaration", "qti-template-declaration"],
      named: ["identifier"],
    },
  ],
  [
    "qti-context-variable",
    {
      declarations: ["qti-context-declaration"],
      named: ["identifier"],
    },
  ],
]);

/**
 * The pairs of count attributes whose least may not exceed their most: the choices, the
 * associations, a choice's matches, a medium's plays and an extended text's strings (information
 * model, each interaction's and choice's `min-*` and `max-*`, `match-min` and `match-max`, and
 * §5.48.7's `min-strings`; spec readings 53 and 76; the rule `choice-bounds`). The kinds that carry
 * a pair are the XSD's: every kind declaring both. A most of 0 bounds nothing there, but on the
 * kinds {@link orderedChoices} names.
 */
const boundPairs: readonly Omit<BoundRow, "kind" | "zero">[] = [
  { max: "max-choices", min: "min-choices" },
  { max: "max-associations", min: "min-associations" },
  { max: "match-max", min: "match-min" },
  { max: "max-plays", min: "min-plays" },
  { max: "max-strings", min: "min-strings" },
];

/**
 * The order interactions, each with the kind of its choices: spec reading 18, from the information
 * model's "If specified, min-choices must be 1 or greater but must not exceed the number of choices
 * available. If unspecified, all of the choices must be ordered and max-choices is ignored" and
 * "Used in conjunction with min-choices, if specified, max-choices must be greater than or equal to
 * min-choices and must not exceed the number of choices available" (§5.97.2 and §5.97.3,
 * OrderInteraction; §5.61.1 and §5.61.2, GraphicOrderInteraction). Neither gives a `max-choices` of
 * 0 a meaning of its own, so their bound is `counted`, and their choices bound both counts. The
 * number of choices is the interaction's `qti-simple-choice` or `qti-hotspot-choice` children.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_OrderInteraction.Attr_min-choices | QTI 3.0 information model, 5.97.2 OrderInteraction min-choices}
 */
const orderedChoices: ReadonlyMap<string, string> = new Map([
  ["qti-order-interaction", "qti-simple-choice"],
  ["qti-graphic-order-interaction", "qti-hotspot-choice"],
]);

/**
 * The kind whose parts a selection selects among: the assessment section (information model,
 * §4.2.15, `sectionPart`; spec reading 26, a section holds at least one).
 */
const sectionKind = "qti-assessment-section";

/**
 * Read the name of a simple type a union member is or restricts.
 *
 * @param member - A member of a union.
 * @returns The named type, or none for an anonymous list, union or restriction of one.
 */
const memberName = (member: TypeReading): Option.Option<string> => {
  switch (member._tag) {
    case "named": {
      return Option.some(member.name);
    }
    case "restriction": {
      return member.base._tag === "named" ? Option.some(member.base.name) : Option.none();
    }
    case "list":
    case "union": {
      return Option.none();
    }
    default: {
      return member satisfies never;
    }
  }
};

/**
 * Read how an attribute's XSD type spells a variable reference.
 *
 * @param attribute - The attribute's declaration.
 * @returns The spelling of its union's reference member, or none for an attribute whose type has no
 *   such member.
 */
const spellingOf = (attribute: AttributeDeclaration): Option.Option<Spelling> =>
  attribute.type.inline.pipe(
    Option.flatMap((inline) =>
      inline._tag === "union"
        ? Arr.findFirst(inline.members, (member) =>
            memberName(member).pipe(
              Option.flatMap((name) => Option.fromNullishOr(referenceMembers.get(name))),
            ),
          )
        : Option.none(),
    ),
  );

/**
 * List the kinds of a class with their attributes, each (kind, name) once: its first declaration,
 * since a reference's meaning is the same in every version that declares it.
 *
 * @param declarations - The attribute declarations.
 * @param kinds - The kinds of the class.
 * @returns Each kind and one of its attributes, in declaration order.
 */
const attributesIn = (
  declarations: readonly AttributeDeclaration[],
  kinds: ReadonlySet<string>,
): readonly { readonly attribute: AttributeDeclaration; readonly kind: string }[] => {
  const first = new Map<string, AttributeDeclaration>();
  for (const attribute of declarations) {
    const key = `${attribute.kind} ${attribute.name}`;
    if (kinds.has(attribute.kind) && !first.has(key)) {
      first.set(key, attribute);
    }
  }

  return Array.from(first.values(), (attribute) => ({ attribute, kind: attribute.kind }));
};

/**
 * What a reference that no reading restricts may name: any variable, declared or built in.
 */
const anyVariable: Names = { _tag: "variable" };

/**
 * Read the references processing makes: each kind's `identifier` ({@link processingName}), and
 * every attribute its XSD types as a literal or a reference. Each may name any variable.
 *
 * @param declarations - The processing kinds' attribute declarations.
 * @param kinds - The processing kinds.
 * @returns The references, in declaration order.
 */
const processingReferences = (
  declarations: readonly AttributeDeclaration[],
  kinds: ReadonlySet<string>,
): readonly ReferenceRow[] =>
  attributesIn(declarations, kinds).flatMap(({ attribute, kind }) =>
    Option.toArray(
      attribute.name === processingName ? Option.some<Spelling>("bare") : spellingOf(attribute),
    ).map((spelling) => ({ attribute: attribute.name, kind, names: anyVariable, spelling })),
  );

/**
 * Read the references an item's content makes: the attributes {@link contentNames} reads on every
 * kind, a printing kind's own named attributes ({@link printing}), and every attribute the XSD
 * types as a literal or a reference.
 *
 * A reference a reading names is the bare identifier; any other is spelled as its XSD type's
 * reference member spells it. It names a declaration of its attribute's kinds, else of its printing
 * kind's, and a reference neither restricts may name any variable.
 *
 * @param declarations - The content kinds' attribute declarations.
 * @param kinds - The kinds of an item's content.
 * @returns The references, in declaration order.
 */
const contentReferences = (
  declarations: readonly AttributeDeclaration[],
  kinds: ReadonlySet<string>,
): readonly ReferenceRow[] =>
  attributesIn(declarations, kinds).flatMap(({ attribute, kind }) => {
    const printed = Option.fromNullishOr(printing.get(kind));
    const meaning = Option.fromNullishOr(contentNames.get(attribute.name));
    const read =
      Option.isSome(meaning) ||
      Option.exists(printed, ({ named }) => named.includes(attribute.name));
    const names = Option.match(
      Option.orElse(meaning, () => printed.pipe(Option.map((held) => held.declarations))),
      {
        onNone: () => anyVariable,
        onSome: (targets): Names => ({ _tag: "declaration", kinds: targets }),
      },
    );

    return Option.toArray(read ? Option.some<Spelling>("bare") : spellingOf(attribute)).map(
      (spelling) => ({ attribute: attribute.name, kind, names, spelling }),
    );
  });

/**
 * Read the declaration kinds: every kind that declares {@link declaringAttribute}, once.
 *
 * @param declarations - The attribute declarations.
 * @returns The kinds, in declaration order.
 */
const declarationsIn = (declarations: readonly AttributeDeclaration[]): readonly string[] => [
  ...new Set(
    declarations.filter(({ name }) => name === declaringAttribute).map(({ kind }) => kind),
  ),
];

/**
 * Read the count bounds: each kind and pair of {@link boundPairs} where the kind declares both
 * attributes of the pair, `counted` on the kinds {@link orderedChoices} names and `unbounded`
 * elsewhere.
 *
 * @param declarations - The attribute declarations.
 * @returns The bounds, in declaration order of the kinds.
 */
const boundsIn = (declarations: readonly AttributeDeclaration[]): readonly BoundRow[] => {
  const declared = new Map<string, Set<string>>();
  for (const { kind, name } of declarations) {
    declared.set(kind, (declared.get(kind) ?? new Set()).add(name));
  }

  return [...declared].flatMap(([kind, names]) =>
    boundPairs
      .filter(({ max, min }) => names.has(min) && names.has(max))
      .map((pair): BoundRow => ({
        ...pair,
        kind,
        zero: orderedChoices.has(kind) ? "counted" : "unbounded",
      })),
  );
};

/**
 * Collect the kinds of every element particle within a particle.
 *
 * @param particle - The particle.
 * @returns The kinds, in document order.
 */
const kindsWithin = (particle: Particle): readonly string[] => {
  switch (particle._tag) {
    case "element": {
      return particle.kinds;
    }
    case "any": {
      return [];
    }
    case "group": {
      return particle.particles.flatMap(kindsWithin);
    }
    default: {
      return particle satisfies never;
    }
  }
};

/**
 * Collect the alternatives of every choice within a particle that may occur more than once.
 *
 * @param particle - The particle.
 * @returns The kinds within each such choice, in document order.
 */
const repeatedChoices = (particle: Particle): readonly string[] => {
  if (particle._tag !== "group") {
    return [];
  }

  const own =
    particle.compositor === "choice" && Option.isNone(particle.occurs.max)
      ? particle.particles.flatMap(kindsWithin)
      : [];

  return [...own, ...particle.particles.flatMap(repeatedChoices)];
};

/**
 * Collect the kinds the content models reach from roots, the roots included: each root, and every
 * kind an element particle of a reached kind's model names.
 *
 * @param models - The content-model IR.
 * @param roots - The kinds to start from.
 * @returns The reached kinds.
 */
const reachedFrom = (
  models: readonly ContentModel[],
  roots: readonly string[],
): ReadonlySet<string> => {
  const children = new Map<string, string[]>();
  for (const { content, kind } of models) {
    if (content._tag === "element-only" || content._tag === "mixed") {
      children.set(kind, [...(children.get(kind) ?? []), ...kindsWithin(content.particle)]);
    }
  }

  const reached = new Set<string>();
  const pending = [...roots];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    if (!reached.has(next)) {
      reached.add(next);
      pending.push(...(children.get(next) ?? []));
    }
  }

  return reached;
};

/**
 * Read the kinds a section holds as its parts: the alternatives of the choice its content model
 * repeats, the XSD's spelling of the information model's `sectionPart` (an item ref, a section, a
 * section ref, or an XInclude standing in for one; §6.46, SectionPart).
 *
 * @param models - The content-model IR.
 * @returns The parts, each once, in the model's order.
 */
export const sectionPartsIn = (models: readonly ContentModel[]): readonly string[] => [
  ...new Set(
    models
      .filter(({ kind }) => kind === sectionKind)
      .flatMap(({ content }) =>
        content._tag === "element-only" || content._tag === "mixed"
          ? repeatedChoices(content.particle)
          : [],
      ),
  ),
];

/**
 * The processing kinds: what the content models reach from {@link processingRoots}, the roots
 * included, an XInclude and its fallback apart.
 */
const processingKinds: ReadonlySet<string> = new Set(
  [...reachedFrom(contentModels, processingRoots)].filter((kind) => !kind.startsWith("xi:")),
);

/**
 * The kinds of an item's content: what the content models reach from {@link itemRoot}, processing
 * apart.
 */
const itemContentKinds: ReadonlySet<string> = new Set(
  [...reachedFrom(contentModels, [itemRoot])].filter((kind) => !processingKinds.has(kind)),
);

/**
 * The ASI vocabulary's facet, derived from the XSDs' attribute declarations and content models: its
 * four declaration kinds, the built-in variables, the references processing and an item's content
 * make and a test feedback's outcome ({@link testFeedback}), the interactions' and choices' count
 * bounds, the order interactions' choices, the kinds a section holds as parts, and its file
 * references.
 */
export const asiReferences: ReferenceFacet = {
  builtIns,
  choiceBounds: boundsIn(attributeDeclarations),
  choiceCounts: Array.from(orderedChoices, ([kind, choice]) => ({ choice, kind })),
  declarations: declarationsIn(attributeDeclarations),
  fileReferences: fileReferencesIn(attributeDeclarations, asiCensus, () => false),
  references: [
    ...processingReferences(attributeDeclarations, processingKinds),
    ...contentReferences(attributeDeclarations, itemContentKinds),
    ...attributesIn(attributeDeclarations, new Set([testFeedback.kind]))
      .filter(({ attribute }) => attribute.name === testFeedback.attribute)
      .map(({ kind }): ReferenceRow => ({
        attribute: testFeedback.attribute,
        kind,
        names: { _tag: "declaration", kinds: testFeedback.declarations },
        spelling: "bare",
      })),
  ],
  sectionParts: sectionPartsIn(contentModels),
};

/**
 * The reference facet of a vocabulary whose only references are to files: its share of
 * {@link fileReferencesIn}, its kinds named by their handle's prefix.
 *
 * @param census - The vocabulary's census.
 * @param prefix - The prefix every kind of the vocabulary's handles carries.
 * @returns The facet.
 */
const fileReferenceFacet = (census: readonly CensusEntry[], prefix: string): ReferenceFacet => ({
  ...noReferences,
  fileReferences: fileReferencesIn(attributeDeclarations, census, (kind) =>
    kind.startsWith(prefix),
  ),
});

/**
 * MathML's reference facet: its file references ({@link mathmlCensus}).
 */
export const mathmlReferences: ReferenceFacet = fileReferenceFacet(mathmlCensus, "m:");

/**
 * SSML's reference facet: its file references ({@link ssmlCensus}).
 */
export const ssmlReferences: ReferenceFacet = fileReferenceFacet(ssmlCensus, "ssml:");

/**
 * XInclude's reference facet: its file reference ({@link xiCensus}).
 */
export const xiReferences: ReferenceFacet = fileReferenceFacet(xiCensus, "xi:");

/**
 * A `NodeKind` key field.
 */
type KindField = IdField<"kind", string>;

/**
 * An `AttributeName` field.
 */
type AttributeField<Name extends string> = IdField<Name, string>;

/**
 * A `DeclarationKind` field.
 */
type DeclarationField = IdField<"declaration", string>;

/**
 * The closed relations of variables and references one composition generates.
 */
export interface References {
  /**
   * `BuiltInVariable` as a function: each (root, built-in variable) → the declaration kind, base
   * type and cardinality it stands as under the root, so a reference to it there reads as one to a
   * declaration of that kind and type.
   */
  readonly builtIn: Closed<
    readonly [IdField<"root", string>, IdField<"variable", string>],
    readonly [DeclarationField, ValueField<"baseType", string>, ValueField<"cardinality", string>]
  >;
  /**
   * The `BuiltInVariable` roster: a reference whose identifier is one of its handles names that
   * built-in variable.
   */
  readonly builtInVariable: Roster<string>;
  /**
   * `ChoiceBound`: kind → (min, max, zero), the attributes of the least and the most count a kind's
   * element bounds, and what a most of 0 means there ({@link boundZeros}).
   */
  readonly choiceBound: Closed<
    readonly [KindField],
    readonly [AttributeField<"min">, AttributeField<"max">, IdField<"zero", BoundZero>]
  >;
  /**
   * `ChoiceCount`: kind → choice, the kind of the children whose number bounds both of the kind's
   * counts where its least is written (spec reading 18).
   */
  readonly choiceCount: Closed<readonly [KindField], readonly [IdField<"choice", string>]>;
  /**
   * `ContentReference`: the set of (kind, attribute, declaration kind) where an item's content
   * names, by that attribute of an element of that kind, a declaration of that kind. Its (kind,
   * attribute) pairs are `VariableReference`'s whose references are restricted; the others' may
   * name any variable.
   */
  readonly contentReference: Closed<
    readonly [KindField, AttributeField<"attribute">, DeclarationField],
    readonly []
  >;
  /**
   * The `DeclarationKind` roster: the kinds that declare a variable, in the order the facets state
   * them. Its codes are dense, so a relation keyed by a declaration kind is four cells wide where a
   * `NodeKind` digit would make it `|NodeKind|`.
   */
  readonly declarationKind: Roster<string>;
  /**
   * `Declares`: each declaration kind as a `NodeKind` → itself as a `DeclarationKind`, the function
   * that gives a node of that kind its declaration code. Its key set is the declaration kinds.
   */
  readonly declares: Closed<readonly [KindField], readonly [DeclarationField]>;
  /**
   * `SectionPart`: the kinds a section holds as its parts, among which its selection selects.
   */
  readonly sectionPart: KindSet<string>;
  /**
   * `ReferenceAttribute`: (version, kind, name) → form, every attribute by which an element of a
   * kind names a file of its package in the version, and how its value names it (spec reading 103).
   */
  readonly referenceAttribute: Closed<
    readonly [IdField<"version", SchemaVersion>, KindField, AttributeField<"name">],
    readonly [IdField<"form", ReferenceForm>]
  >;
  /**
   * The `ReferenceForm` roster, {@link referenceForms}.
   */
  readonly referenceForm: Roster<ReferenceForm>;
  /**
   * The `ReferenceSpelling` roster, {@link spellings}.
   */
  readonly spelling: Roster<Spelling>;
  /**
   * `VariableReference`: (kind, attribute) → spelling, every attribute by which an element of a
   * kind names a variable, and how its value spells the name.
   */
  readonly variableReference: Closed<
    readonly [KindField, AttributeField<"attribute">],
    readonly [IdField<"spelling", Spelling>]
  >;
}

/**
 * List the declaration kinds a reference may name.
 *
 * @param reference - The reference.
 * @returns Its declaration kinds, none for one that may name any variable.
 */
const restrictionOf = (reference: ReferenceRow): readonly string[] =>
  reference.names._tag === "declaration" ? reference.names.kinds : [];

/**
 * Generate the reference relations of a composition from its vocabularies' facets.
 *
 * The `DeclarationKind` and `BuiltInVariable` rosters take their handles in the order the facets
 * state them, which is composition order, so a vocabulary appended to a composition appends its
 * codes.
 *
 * @param input - The composition's rosters and its vocabularies' facets.
 * @param input.facets - The facets, in composition order.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.names - The `AttributeName` roster.
 * @param input.versions - The `SchemaVersion` roster.
 * @returns The relations, or the first reason one has no constant: a declaration kind or built-in
 *   variable stated twice (`RepeatedValue`); two rows at one key, such as two spellings of one
 *   reference or two bounds on one kind (`KeyCollision`); or a kind, attribute or declaration kind
 *   outside its roster (`OutsideCodeSpace`).
 */
export const references = (input: {
  readonly facets: readonly ReferenceFacet[];
  readonly kinds: Roster<string>;
  readonly names: Roster<string>;
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<References, ClosedRelationError> =>
  Result.gen(function* generateReferences() {
    const { facets } = input;
    const kind = idField("kind", input.kinds);
    const attribute = idField("attribute", input.names);
    const declarationKind = yield* roster(
      "DeclarationKind",
      facets.flatMap((facet) => facet.declarations),
    );
    const declaration = idField("declaration", declarationKind);
    const stated = facets.flatMap((facet) => facet.builtIns);
    const builtInVariable = yield* roster("BuiltInVariable", [
      ...new Set(stated.map(({ variable }) => variable)),
    ]);
    const spelling = yield* roster("ReferenceSpelling", spellings);
    const referenceForm = yield* roster("ReferenceForm", referenceForms);
    const rows = facets.flatMap((facet) => facet.references);

    return {
      builtIn: yield* closed({
        key: [idField("root", input.kinds), idField("variable", builtInVariable)],
        name: "BuiltInVariable",
        payload: [
          declaration,
          valueField(
            "baseType",
            stated.map(({ baseType }) => baseType),
          ),
          valueField(
            "cardinality",
            stated.map(({ cardinality }) => cardinality),
          ),
        ],
        rows: stated,
      }),
      builtInVariable,
      choiceBound: yield* closed({
        key: [kind],
        name: "ChoiceBound",
        payload: [
          idField("min", input.names),
          idField("max", input.names),
          idField("zero", yield* roster("BoundZero", boundZeros)),
        ],
        rows: facets.flatMap((facet) => facet.choiceBounds),
      }),
      choiceCount: yield* closed({
        key: [kind],
        name: "ChoiceCount",
        payload: [idField("choice", input.kinds)],
        rows: facets.flatMap((facet) => facet.choiceCounts),
      }),
      contentReference: yield* closed({
        key: [kind, attribute, declaration],
        name: "ContentReference",
        payload: [],
        rows: rows.flatMap((reference) =>
          restrictionOf(reference).map((named) => ({
            attribute: reference.attribute,
            declaration: named,
            kind: reference.kind,
          })),
        ),
      }),
      declarationKind,
      declares: yield* closed({
        key: [kind],
        name: "Declares",
        payload: [declaration],
        rows: declarationKind.handles.map((handle) => ({ declaration: handle, kind: handle })),
      }),
      referenceAttribute: yield* closed({
        key: [idField("version", input.versions), kind, idField("name", input.names)],
        name: "ReferenceAttribute",
        payload: [idField("form", referenceForm)],
        rows: facets
          .flatMap((facet) => facet.fileReferences)
          .flatMap(({ form, kind: owner, name, versions }) =>
            versions.map((version) => ({ form, kind: owner, name, version })),
          ),
      }),
      referenceForm,
      sectionPart: yield* closed({
        key: [kind],
        name: "SectionPart",
        payload: [],
        rows: facets.flatMap((facet) => facet.sectionParts).map((part) => ({ kind: part })),
      }),
      spelling,
      variableReference: yield* closed({
        key: [kind, attribute],
        name: "VariableReference",
        payload: [idField("spelling", spelling)],
        rows: rows.map((reference) => ({
          attribute: reference.attribute,
          kind: reference.kind,
          spelling: reference.spelling,
        })),
      }),
    };
  });
