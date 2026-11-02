/**
 * The render half of export: the rows of one tree back to the XML tree they were imported from,
 * with no database in between.
 *
 * Every attribute comes from the column or optional-value row that holds it, written under the
 * name the kind's registry gives it. A typed copy of a value is never read: an element's text is
 * its text children, the `<attribute>N` columns and the owner and version copies are never
 * rendered, and an attribute whose node has an `AttributeLexical` row is written with that row's
 * value, because the typed column holds the collapsed or replaced form.
 *
 * Attributes are placed in the order the module reads them: namespace declarations,
 * `xsi:schemaLocation`, the kind's own attributes in the order of {@link ownAttributes}, then the
 * families, `id`, `role` and ARIA. The order the source wrote them in is not stored, and it need
 * not be: canonical XML sorts attributes, so canonical equality holds whatever this order is.
 */
import type { AnyRelation } from "@bjornpagen/grizzle";
import { Option, Predicate } from "effect";
import type { Rows as RowSet } from "#qti/import/tree.ts";
import { Rows } from "#qti/import/tree.ts";
import * as family from "#qti/schema/attributes.ts";
import { IdrefAttribute } from "#qti/schema/content/rosters.ts";
import type { RegistryRow } from "#qti/schema/kinds/generic.ts";
import {
  AttributeEntityReference,
  AttributeLexical,
  Comment as CommentRow,
  Edge,
  EntityReference,
  NamespaceDeclaration,
  Node,
  Pi as PiRow,
  SchemaLocation,
  TextNode,
  Tree,
  TreeDoctype,
  TreeMisc,
  TreeRoot,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
  vocabularies,
  Ws,
} from "#qti/schema/node.ts";
import { Author } from "#qti/schema/roles.ts";
import type { Attribute, Child, Misc, XmlDocument } from "#qti/xml/tree.ts";

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The relations the importer writes, by name.
 */
const R = Author.relations;

/**
 * The registry rows that name an element, by kind; the generic kinds are not elements and are left
 * out.
 */
const elementRows = vocabularies
  .flatMap((vocabulary) => Object.entries<RegistryRow>(vocabulary.registry))
  .filter(([, row]) => row.local !== "");

/**
 * The XML name and namespace of each element kind, from the registries.
 *
 * A kind named by two registries would let the later row replace the earlier, so building the map
 * refuses one.
 */
const names: ReadonlyMap<string, RegistryRow> = new Map(elementRows);

if (names.size !== elementRows.length) {
  throw new Error("Two vocabulary registries name the same element kind.");
}

/**
 * `facts` keyed by `key`, the last fact winning a shared key.
 */
const by = <T extends object>(
  facts: readonly T[],
  key: (fact: T) => string,
): ReadonlyMap<string, T> => new Map(facts.map((fact) => [key(fact), fact]));

/**
 * One fact of a relation as its columns by name: text, identifiers and the names of roster handles
 * are strings, and positions and counts are `bigint`s.
 */
type Columns = Readonly<Record<string, string | bigint>>;

/**
 * The facts of one relation by the node, document, tree or declaration that owns them.
 */
type Facts = ReadonlyMap<string, Columns>;

/**
 * The facts of one relation grouped by the owner, each group in the order the rows hold it.
 */
type Groups = ReadonlyMap<string, readonly Columns[]>;

/**
 * The facts of the relations of one set of rows by the text of a column, each built once.
 *
 * `one` holds a relation's single fact per owner, the last fact winning a shared key; `many` holds
 * all of an owner's facts, for the relations that hold a list.
 */
interface Index {
  readonly many: (relation: AnyRelation, key: string) => Groups;
  readonly one: (relation: AnyRelation, key: string) => Facts;
}

/**
 * The value an attribute has on the node `id`, none when the rows say the source did not write it.
 */
type Reader = (id: string) => string | undefined;

/**
 * Where one attribute's value lives: given the rows' index, the reader of that value.
 */
type Source = (index: Index) => Reader;

/**
 * One own attribute of an element kind: its name and where its value lives.
 */
type Own = readonly [name: string, source: Source];

/**
 * The names of a relation's columns.
 */
const columnsOf = (relation: AnyRelation): readonly string[] =>
  Predicate.isObject(relation.fields) ? Object.keys(relation.fields) : [];

/**
 * The text of the column `field` of `fact`, none when the fact or the column is absent. Callers
 * name text, identifier and roster columns only: {@link column} checks that the column exists when
 * the module loads.
 */
const textOf = (fact: Columns | undefined, field: string): string | undefined => {
  const found = fact?.[field];

  return found === undefined ? undefined : String(found);
};

/**
 * The value of the column `field` in the row of `relation` whose column `key` is the node's id:
 * written whenever that row exists, which is always for an arm's required column and only where
 * the source wrote the attribute for an optional-value relation.
 *
 * Both columns are checked against the relation when the module loads, so a name the relation
 * lacks fails there and not as a silently missing attribute.
 *
 * @param relation - The relation that holds the value.
 * @param field - The column that holds it.
 * @param key - The column that holds the owning id.
 * @returns The source of the attribute.
 */
const column = (relation: AnyRelation, field: string, key: string): Source => {
  const columns = columnsOf(relation);
  if (!columns.includes(field) || !columns.includes(key)) {
    throw new Error(`The relation ${relation.name} has no column ${field} keyed by ${key}.`);
  }

  return (index) => {
    const facts = index.one(relation, key);

    return (id) => textOf(facts.get(id), field);
  };
};

/**
 * The column `field` of an arm, whose rows are keyed by `id`.
 */
const arm = (relation: AnyRelation, field: string): Source => column(relation, field, "id");

/**
 * The `value` of an optional-value relation, whose rows are keyed by `node` and exist only where
 * the source wrote the attribute.
 */
const optional = (relation: AnyRelation): Source => column(relation, "value", "node");

/**
 * An attribute the source wrote exactly when `marker` holds the node: the marker says a defaulted
 * attribute was written, and `source` holds its value.
 *
 * @param marker - The relation of one `node` column that marks the attribute as written.
 * @param source - Where the value lives.
 * @returns The source of the attribute.
 */
const marked =
  (marker: AnyRelation, source: Source): Source =>
  (index) => {
    const written = index.one(marker, "node");
    const read = source(index);

    return (id) => (written.has(id) ? read(id) : undefined);
  };

/**
 * The first of `sources` that holds a value: the attribute lives in one relation of a family that
 * differs by base type or by element.
 */
const first =
  (...sources: readonly Source[]): Source =>
  (index) => {
    const readers = sources.map((source) => source(index));

    return (id) => readers.map((read) => read(id)).find((value) => value !== undefined);
  };

/**
 * An attribute written only where its value is not `normal`, for a column that holds a value the
 * importer writes when the source wrote none, with no marker to say which: a stored `normal`
 * cannot be told from an absent attribute, so it is left absent.
 */
const unlessDefault =
  (source: Source, normal: string): Source =>
  (index) => {
    const read = source(index);

    return (id) => {
      const value = read(id);

      return value === normal ? undefined : value;
    };
  };

/**
 * An attribute written only where its value is not empty: a required column the importer fills
 * with the empty text when the source wrote no attribute, so an absent attribute cannot be told
 * from an empty one.
 */
const unlessEmpty = (source: Source): Source => unlessDefault(source, "");

/**
 * The `cardinality` of a variable declaration: `record` for a record declaration and the typed
 * row's cardinality otherwise.
 */
const cardinality: Source = (index) => {
  const declarations = index.one(R.Declaration, "id");
  const typed = index.one(R.TypedDeclaration, "id");

  return (id) =>
    textOf(declarations.get(id), "shape") === "record"
      ? "record"
      : textOf(typed.get(id), "cardinality");
};

/**
 * The `base-type` of a `qti-value`, written only for the value of a record, whose fields each carry
 * their own type.
 */
const recordValueBaseType: Source = (index) => {
  const values = index.one(R.DeclaredValue, "id");

  return (id) =>
    textOf(values.get(id), "shape") === "record" ? textOf(values.get(id), "baseType") : undefined;
};

/**
 * The `value` of the first of `relations` that has a row for the node, for the typed arms of a
 * mapping, table or default value, one relation per base type.
 */
const byBaseType = (relations: readonly AnyRelation[], key: string, field: string): Source =>
  first(...relations.map((relation) => column(relation, field, key)));

/**
 * The `mapKey` relations, one per base type.
 */
const mapKeys = [
  R.MapEntryBoolean,
  R.MapEntryDirectedPair,
  R.MapEntryDuration,
  R.MapEntryFile,
  R.MapEntryFloat,
  R.MapEntryIdentifier,
  R.MapEntryInteger,
  R.MapEntryPair,
  R.MapEntryPoint,
  R.MapEntryString,
  R.MapEntryUri,
];

/**
 * The `target-value` relations of a match table's entries, one per base type.
 */
const matchTargets = [
  R.MatchTableEntryBoolean,
  R.MatchTableEntryDirectedPair,
  R.MatchTableEntryDuration,
  R.MatchTableEntryFile,
  R.MatchTableEntryFloat,
  R.MatchTableEntryIdentifier,
  R.MatchTableEntryInteger,
  R.MatchTableEntryPair,
  R.MatchTableEntryPoint,
  R.MatchTableEntryString,
  R.MatchTableEntryUri,
];

/**
 * The `target-value` relations of an interpolation table's entries, one per base type.
 */
const interpolationTargets = [
  R.InterpolationTableEntryBoolean,
  R.InterpolationTableEntryDirectedPair,
  R.InterpolationTableEntryDuration,
  R.InterpolationTableEntryFile,
  R.InterpolationTableEntryFloat,
  R.InterpolationTableEntryIdentifier,
  R.InterpolationTableEntryInteger,
  R.InterpolationTableEntryPair,
  R.InterpolationTableEntryPoint,
  R.InterpolationTableEntryString,
  R.InterpolationTableEntryUri,
];

/**
 * The `default-value` relations of a match table, one per base type.
 */
const matchDefaults = [
  R.MatchTableDefaultValueBoolean,
  R.MatchTableDefaultValueDirectedPair,
  R.MatchTableDefaultValueDuration,
  R.MatchTableDefaultValueFile,
  R.MatchTableDefaultValueFloat,
  R.MatchTableDefaultValueIdentifier,
  R.MatchTableDefaultValueInteger,
  R.MatchTableDefaultValuePair,
  R.MatchTableDefaultValuePoint,
  R.MatchTableDefaultValueString,
  R.MatchTableDefaultValueUri,
];

/**
 * The `default-value` relations of an interpolation table, one per base type.
 */
const interpolationDefaults = [
  R.InterpolationTableDefaultValueBoolean,
  R.InterpolationTableDefaultValueDirectedPair,
  R.InterpolationTableDefaultValueDuration,
  R.InterpolationTableDefaultValueFile,
  R.InterpolationTableDefaultValueFloat,
  R.InterpolationTableDefaultValueIdentifier,
  R.InterpolationTableDefaultValueInteger,
  R.InterpolationTableDefaultValuePair,
  R.InterpolationTableDefaultValuePoint,
  R.InterpolationTableDefaultValueString,
  R.InterpolationTableDefaultValueUri,
];

/**
 * The `template-identifier` of a choice that names a template variable, which is copied to a
 * `ChoiceTemplateRef`.
 */
const choiceTemplate: Source = column(R.ChoiceTemplateRef, "identifier", "node");

/**
 * The `identifier` of an element that holds one as a required column of its arm.
 */
const identifierOf = (relation: AnyRelation): Own => ["identifier", arm(relation, "identifier")];

/**
 * The `response-identifier` of an interaction, a required column of its arm.
 */
const responseIdentifierOf = (relation: AnyRelation): Own => [
  "response-identifier",
  arm(relation, "responseIdentifier"),
];

/**
 * The attributes a table cell has beside `headers`, which the identifier-reference rows hold.
 */
const cell = (
  scope: AnyRelation,
  abbr: AnyRelation,
  axis: AnyRelation,
  rowspan: AnyRelation,
  colspan: AnyRelation,
  align: AnyRelation,
  valign: AnyRelation,
): readonly Own[] => [
  ["scope", optional(scope)],
  ["abbr", optional(abbr)],
  ["axis", optional(axis)],
  ["rowspan", optional(rowspan)],
  ["colspan", optional(colspan)],
  ["align", optional(align)],
  ["valign", optional(valign)],
];

/**
 * The attributes of the declarations every kind shares: `identifier`, `cardinality` and
 * `base-type`.
 */
const declared: readonly Own[] = [
  ["identifier", arm(R.Declaration, "identifier")],
  ["cardinality", cardinality],
  ["base-type", arm(R.TypedDeclaration, "baseType")],
];

/**
 * The attributes of a feedback or template element: `identifier` and `show-hide`, written where
 * `marker` says the source wrote the defaulted `show-hide`.
 */
const showing = (relation: AnyRelation, marker: AnyRelation): readonly Own[] => [
  identifierOf(relation),
  ["show-hide", marked(marker, arm(relation, "showHide"))],
];

/**
 * The attributes of `qti-feedback-block` and `qti-feedback-inline`.
 */
const feedback = (relation: AnyRelation, marker: AnyRelation): readonly Own[] => [
  ["outcome-identifier", arm(relation, "outcomeIdentifier")],
  ...showing(relation, marker),
];

/**
 * The attributes of `qti-template-block` and `qti-template-inline`.
 */
const templating = (relation: AnyRelation, marker: AnyRelation): readonly Own[] => [
  ["template-identifier", arm(relation, "templateIdentifier")],
  ...showing(relation, marker),
];

/**
 * The attributes the `audio` and `video` elements share: the optional strings, and the booleans
 * whose stored form depends on the schema version of the tree.
 */
const media = (
  src: AnyRelation,
  crossorigin: AnyRelation,
  preload: AnyRelation,
  mediagroup: AnyRelation,
  autoplay: AnyRelation,
  controls: AnyRelation,
  loop: AnyRelation,
  muted: AnyRelation,
): readonly Own[] => [
  ["src", optional(src)],
  ["crossorigin", optional(crossorigin)],
  ["preload", optional(preload)],
  ["autoplay", optional(autoplay)],
  ["mediagroup", optional(mediagroup)],
  ["loop", optional(loop)],
  ["muted", optional(muted)],
  ["controls", optional(controls)],
];

/**
 * The own attributes of every element kind that has any, by kind: each name with where its value
 * lives, which is how {@link renderTree} reads a node's attributes back.
 *
 * Three rules place a value. A required attribute is a column of the kind's arm and is written
 * whenever the arm's row exists. An optional attribute is its own `(node, value)` relation and is
 * written only where that row exists. A defaulted attribute is written only where its `Declared*`
 * marker holds the node, with the value in the arm's column. Two columns have no marker for the
 * importer's fill (an order interaction's `shuffle`, a `source`'s `src`) and are written when they
 * differ from the fill.
 *
 * The table lists the kinds whose registry admits own attributes. It leaves out `data-ssml`, which
 * the importer refuses, and the attributes no relation stores, so an attribute the table does not
 * name is never rendered. It is exported for the test that checks it against the registries.
 */
export const ownAttributes = {
  a: [
    ["href", arm(R.A, "href")],
    ["type", optional(R.AType)],
  ],
  audio: media(
    R.AudioSrc,
    R.AudioCrossorigin,
    R.AudioPreload,
    R.AudioMediagroup,
    R.AudioAutoplay,
    R.AudioControls,
    R.AudioLoop,
    R.AudioMuted,
  ),
  bdo: [["title", optional(R.BdoTitle)]],
  blockquote: [["cite", optional(R.BlockquoteCite)]],
  col: [["span", optional(R.ColSpan)]],
  colgroup: [["span", optional(R.ColgroupSpan)]],
  "cp:dependency": [["identifierref", arm(R.Dependency, "target")]],
  "cp:file": [["href", arm(R.File, "href")]],
  "cp:manifest": [["identifier", arm(R.Package, "identifier")]],
  "cp:resource": [
    identifierOf(R.Resource),
    ["type", arm(R.Resource, "type")],
    ["href", column(R.ResourceHref, "href", "resource")],
  ],
  details: [["open", optional(R.DetailsOpen)]],
  img: [
    ["src", arm(R.Img, "src")],
    ["alt", arm(R.Img, "alt")],
    ["longdesc", optional(R.ImgLongdesc)],
    ["height", optional(R.ImgHeight)],
    ["width", optional(R.ImgWidth)],
  ],
  "lom:string": [["language", optional(R.LomStringLanguage)]],
  object: [
    ["data", arm(R.Object, "data")],
    ["type", arm(R.Object, "type")],
    ["width", optional(R.ObjectWidth)],
    ["height", optional(R.ObjectHeight)],
  ],
  param: [
    ["name", arm(R.Param, "name")],
    ["value", arm(R.Param, "value")],
    ["valuetype", marked(R.DeclaredValuetype, arm(R.Param, "valuetype"))],
    ["type", optional(R.ParamType)],
  ],
  q: [["cite", optional(R.QCite)]],
  "qti-area-map-entry": [
    ["shape", arm(R.AreaMapEntry, "shape")],
    ["coords", optional(R.Coords)],
    ["mapped-value", arm(R.AreaMapEntry, "mappedValue")],
  ],
  "qti-area-mapping": [
    ["lower-bound", optional(R.AreaMappingLowerBound)],
    ["upper-bound", optional(R.AreaMappingUpperBound)],
    [
      "default-value",
      marked(R.DeclaredAreaMappingDefaultValue, arm(R.AreaMapping, "defaultValue")),
    ],
  ],
  "qti-assessment-item": [
    ["identifier", column(R.DocumentIdentifier, "value", "document")],
    ["title", column(R.DocumentTitle, "value", "document")],
    [
      "tool-name",
      first(column(R.ItemToolBoth, "toolName", "tree"), column(R.ItemToolName, "toolName", "tree")),
    ],
    [
      "tool-version",
      first(
        column(R.ItemToolBoth, "toolVersion", "tree"),
        column(R.ItemToolVersion, "toolVersion", "tree"),
      ),
    ],
    ["adaptive", marked(R.DeclaredAdaptive, arm(R.AssessmentItem, "adaptive"))],
    ["time-dependent", arm(R.AssessmentItem, "timeDependent")],
  ],
  "qti-associable-hotspot": [
    identifierOf(R.AssociableHotspot),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["shape", arm(R.AssociableHotspot, "shape")],
    ["coords", optional(R.Coords)],
    ["hotspot-label", optional(R.AssociableHotspotLabel)],
    ["match-max", arm(R.AssociableHotspot, "matchMax")],
  ],
  "qti-associate-interaction": [
    responseIdentifierOf(R.AssociateInteraction),
    ["shuffle", marked(R.DeclaredAssociateShuffle, arm(R.AssociateInteraction, "shuffle"))],
    ["max-associations", optional(R.AssociateMaxAssociations)],
    ["min-associations", optional(R.AssociateMinAssociations)],
  ],
  "qti-choice-interaction": [
    responseIdentifierOf(R.ChoiceInteraction),
    ["shuffle", marked(R.DeclaredShuffle, arm(R.ChoiceInteraction, "shuffle"))],
    ["max-choices", marked(R.DeclaredMaxChoices, arm(R.ChoiceInteraction, "maxChoices"))],
    ["min-choices", marked(R.DeclaredMinChoices, arm(R.ChoiceInteraction, "minChoices"))],
    ["orientation", marked(R.DeclaredOrientation, arm(R.ChoiceInteraction, "orientation"))],
    ["data-min-selections-message", optional(R.ChoiceInteractionMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.ChoiceInteractionMaxSelectionsMessage)],
  ],
  "qti-context-declaration": declared,
  "qti-correct-response": [
    ["interpretation", column(R.ValueSetInterpretation, "value", "valueSet")],
  ],
  "qti-default-value": [["interpretation", column(R.ValueSetInterpretation, "value", "valueSet")]],
  "qti-drawing-interaction": [responseIdentifierOf(R.DrawingInteraction)],
  "qti-end-attempt-interaction": [
    responseIdentifierOf(R.EndAttemptInteraction),
    ["title", arm(R.EndAttemptInteraction, "title")],
    ["count-attempt", optional(R.EndAttemptCountAttempt)],
  ],
  "qti-extended-text-interaction": [
    responseIdentifierOf(R.ExtendedTextInteraction),
    ["base", marked(R.DeclaredExtendedTextBase, arm(R.ExtendedTextInteraction, "base"))],
    ["string-identifier", column(R.StringBinding, "identifier", "node")],
    ["expected-length", optional(R.ExtendedTextExpectedLength)],
    ["pattern-mask", optional(R.ExtendedTextPatternMask)],
    ["placeholder-text", optional(R.ExtendedTextPlaceholderText)],
    ["max-strings", optional(R.ExtendedTextMaxStrings)],
    [
      "min-strings",
      marked(R.DeclaredExtendedTextMinStrings, arm(R.ExtendedTextInteraction, "minStrings")),
    ],
    ["expected-lines", optional(R.ExtendedTextExpectedLines)],
    ["format", marked(R.DeclaredExtendedTextFormat, arm(R.ExtendedTextInteraction, "format"))],
    ["data-patternmask-message", optional(R.ExtendedTextPatternmaskMessage)],
  ],
  "qti-feedback-block": feedback(R.FeedbackBlock, R.DeclaredFeedbackBlockShowHide),
  "qti-feedback-block.template": feedback(R.FeedbackBlock, R.DeclaredFeedbackBlockShowHide),
  "qti-feedback-inline": feedback(R.FeedbackInline, R.DeclaredFeedbackInlineShowHide),
  "qti-gap": [
    identifierOf(R.Gap),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["required", marked(R.DeclaredGapRequired, arm(R.Gap, "required"))],
  ],
  "qti-gap-img": [
    identifierOf(R.GapImg),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["match-max", arm(R.GapImg, "matchMax")],
    ["match-min", optional(R.GapImgMatchMin)],
    ["object-label", optional(R.GapImgObjectLabel)],
    ["top", optional(R.GapImgTop)],
    ["left", optional(R.GapImgLeft)],
  ],
  "qti-gap-match-interaction": [
    responseIdentifierOf(R.GapMatchInteraction),
    ["shuffle", marked(R.DeclaredGapMatchShuffle, arm(R.GapMatchInteraction, "shuffle"))],
    ["min-associations", optional(R.GapMatchMinAssociations)],
    ["max-associations", optional(R.GapMatchMaxAssociations)],
    ["data-min-selections-message", optional(R.GapMatchMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.GapMatchMaxSelectionsMessage)],
    ["data-choices-container-width", optional(R.GapMatchChoicesContainerWidth)],
  ],
  "qti-gap-text": [
    identifierOf(R.GapText),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["match-max", arm(R.GapText, "matchMax")],
    ["match-min", optional(R.GapTextMatchMin)],
  ],
  "qti-graphic-associate-interaction": [
    responseIdentifierOf(R.GraphicAssociateInteraction),
    ["min-associations", optional(R.GraphicAssociateMinAssociations)],
    ["max-associations", optional(R.GraphicAssociateMaxAssociations)],
  ],
  "qti-graphic-gap-match-interaction": [
    responseIdentifierOf(R.GraphicGapMatchInteraction),
    ["min-associations", optional(R.GraphicGapMatchMinAssociations)],
    ["max-associations", optional(R.GraphicGapMatchMaxAssociations)],
    ["data-min-selections-message", optional(R.GraphicGapMatchMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.GraphicGapMatchMaxSelectionsMessage)],
    ["data-choices-container-width", optional(R.GraphicGapMatchChoicesContainerWidth)],
  ],
  "qti-graphic-order-interaction": [
    responseIdentifierOf(R.GraphicOrderInteraction),
    ["min-choices", optional(R.GraphicOrderMinChoices)],
    ["max-choices", optional(R.GraphicOrderMaxChoices)],
  ],
  "qti-hotspot-choice": [
    identifierOf(R.HotspotChoice),
    ["template-identifier", choiceTemplate],
    ["shape", arm(R.HotspotChoice, "shape")],
    ["coords", optional(R.Coords)],
    ["hotspot-label", optional(R.HotspotChoiceLabel)],
  ],
  "qti-hotspot-interaction": [
    responseIdentifierOf(R.HotspotInteraction),
    ["min-choices", optional(R.HotspotMinChoices)],
    ["max-choices", optional(R.HotspotMaxChoices)],
    ["data-min-selections-message", optional(R.HotspotMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.HotspotMaxSelectionsMessage)],
  ],
  "qti-hottext": [identifierOf(R.Hottext), ["template-identifier", choiceTemplate]],
  "qti-hottext-interaction": [
    responseIdentifierOf(R.HottextInteraction),
    ["max-choices", optional(R.HottextMaxChoices)],
    ["min-choices", optional(R.HottextMinChoices)],
    ["data-min-selections-message", optional(R.HottextMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.HottextMaxSelectionsMessage)],
  ],
  "qti-inline-choice": [
    identifierOf(R.InlineChoice),
    ["fixed", marked(R.DeclaredInlineChoiceFixed, arm(R.InlineChoice, "fixed"))],
    ["template-identifier", choiceTemplate],
  ],
  "qti-inline-choice-interaction": [
    responseIdentifierOf(R.InlineChoiceInteraction),
    ["shuffle", marked(R.DeclaredInlineChoiceShuffle, arm(R.InlineChoiceInteraction, "shuffle"))],
    [
      "required",
      marked(R.DeclaredInlineChoiceRequired, arm(R.InlineChoiceInteraction, "required")),
    ],
    [
      "min-choices",
      marked(R.DeclaredInlineChoiceMinChoices, arm(R.InlineChoiceInteraction, "minChoices")),
    ],
    ["data-min-selections-message", optional(R.InlineChoiceMinSelectionsMessage)],
    ["data-prompt", optional(R.InlineChoicePrompt)],
  ],
  "qti-interpolation-table": [
    ["default-value", byBaseType(interpolationDefaults, "node", "value")],
  ],
  "qti-interpolation-table-entry": [
    ["source-value", arm(R.InterpolationTableEntry, "sourceValue")],
    [
      "include-boundary",
      marked(R.DeclaredIncludeBoundary, arm(R.InterpolationTableEntry, "includeBoundary")),
    ],
    ["target-value", byBaseType(interpolationTargets, "id", "targetValue")],
  ],
  "qti-map-entry": [
    ["map-key", byBaseType(mapKeys, "id", "mapKey")],
    ["mapped-value", arm(R.MapEntry, "mappedValue")],
    ["case-sensitive", marked(R.DeclaredMapEntryCaseSensitive, arm(R.MapEntry, "caseSensitive"))],
  ],
  "qti-mapping": [
    ["lower-bound", optional(R.MappingLowerBound)],
    ["upper-bound", optional(R.MappingUpperBound)],
    ["default-value", marked(R.DeclaredMappingDefaultValue, arm(R.Mapping, "defaultValue"))],
  ],
  "qti-match-interaction": [
    responseIdentifierOf(R.MatchInteraction),
    ["shuffle", marked(R.DeclaredMatchShuffle, arm(R.MatchInteraction, "shuffle"))],
    ["max-associations", optional(R.MatchMaxAssociations)],
    ["min-associations", optional(R.MatchMinAssociations)],
    ["data-min-selections-message", optional(R.MatchMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.MatchMaxSelectionsMessage)],
    ["data-first-column-header", optional(R.MatchFirstColumnHeader)],
  ],
  "qti-match-table": [["default-value", byBaseType(matchDefaults, "node", "value")]],
  "qti-match-table-entry": [
    ["source-value", arm(R.MatchTableEntry, "sourceValue")],
    ["target-value", byBaseType(matchTargets, "id", "targetValue")],
  ],
  "qti-media-interaction": [
    responseIdentifierOf(R.MediaInteraction),
    ["autostart", arm(R.MediaInteraction, "autostart")],
    ["min-plays", optional(R.MediaMinPlays)],
    ["max-plays", optional(R.MediaMaxPlays)],
    ["loop", marked(R.DeclaredMediaLoop, arm(R.MediaInteraction, "loop"))],
    ["coords", optional(R.MediaCoords)],
  ],
  "qti-modal-feedback": [
    ["outcome-identifier", arm(R.ModalFeedback, "outcomeIdentifier")],
    ["show-hide", arm(R.ModalFeedback, "showHide")],
    identifierOf(R.ModalFeedback),
    ["title", optional(R.ModalFeedbackTitle)],
  ],
  "qti-order-interaction": [
    responseIdentifierOf(R.OrderInteraction),
    ["shuffle", unlessDefault(arm(R.OrderInteraction, "shuffle"), "false")],
    ["min-choices", optional(R.OrderMinChoices)],
    ["max-choices", optional(R.OrderMaxChoices)],
    ["orientation", optional(R.OrderOrientation)],
    ["data-min-selections-message", optional(R.OrderMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.OrderMaxSelectionsMessage)],
    ["data-choices-container-width", optional(R.OrderChoicesContainerWidth)],
  ],
  "qti-outcome-declaration": [
    ...declared,
    ["view", column(R.DeclarationView, "value", "declaration")],
    ["interpretation", column(R.DeclarationInterpretation, "value", "declaration")],
    ["long-interpretation", column(R.DeclarationLongInterpretation, "value", "declaration")],
    ["normal-maximum", column(R.DeclarationNormalMaximum, "value", "declaration")],
    ["normal-minimum", column(R.DeclarationNormalMinimum, "value", "declaration")],
    ["mastery-value", column(R.DeclarationMasteryValue, "value", "declaration")],
    ["external-scored", column(R.DeclarationExternalScored, "value", "declaration")],
    ["variable-identifier-ref", column(R.DeclarationVariableIdentifierRef, "value", "declaration")],
  ],
  "qti-position-object-interaction": [
    responseIdentifierOf(R.PositionObjectInteraction),
    ["center-point", optional(R.PositionObjectCenterPoint)],
    ["min-choices", optional(R.PositionObjectMinChoices)],
    ["max-choices", optional(R.PositionObjectMaxChoices)],
  ],
  "qti-printed-variable": [
    identifierOf(R.PrintedVariable),
    ["format", optional(R.PrintedVariableFormat)],
    ["base", marked(R.DeclaredPrintedVariableBase, arm(R.PrintedVariable, "base"))],
    ["index", optional(R.PrintedVariableIndex)],
    ["power-form", marked(R.DeclaredPrintedVariablePowerForm, arm(R.PrintedVariable, "powerForm"))],
    ["field", optional(R.PrintedVariableField)],
    ["delimiter", marked(R.DeclaredPrintedVariableDelimiter, arm(R.PrintedVariable, "delimiter"))],
    [
      "mapping-indicator",
      marked(R.DeclaredPrintedVariableMappingIndicator, arm(R.PrintedVariable, "mappingIndicator")),
    ],
  ],
  "qti-response-declaration": declared,
  "qti-response-processing": [
    ["template", column(R.ResponseProcessingTemplate, "uri", "node")],
    ["template-location", column(R.ResponseProcessingTemplateLocation, "uri", "node")],
  ],
  "qti-rubric-block": [
    ["use", arm(R.RubricBlock, "use")],
    ["view", arm(R.RubricBlock, "view")],
  ],
  "qti-select-point-interaction": [
    responseIdentifierOf(R.SelectPointInteraction),
    ["min-choices", optional(R.SelectPointMinChoices)],
    ["max-choices", optional(R.SelectPointMaxChoices)],
  ],
  "qti-simple-associable-choice": [
    identifierOf(R.SimpleAssociableChoice),
    ["fixed", optional(R.SimpleAssociableChoiceFixed)],
    ["template-identifier", choiceTemplate],
    ["show-hide", optional(R.SimpleAssociableChoiceShowHide)],
    ["match-group", optional(R.MatchGroup)],
    ["match-max", arm(R.SimpleAssociableChoice, "matchMax")],
    ["match-min", optional(R.SimpleAssociableChoiceMatchMin)],
  ],
  "qti-simple-choice": [
    identifierOf(R.SimpleChoice),
    ["fixed", marked(R.DeclaredFixed, arm(R.SimpleChoice, "fixed"))],
    ["template-identifier", optional(R.SimpleChoiceTemplateIdentifier)],
    ["show-hide", marked(R.DeclaredShowHide, arm(R.SimpleChoice, "showHide"))],
  ],
  "qti-slider-interaction": [
    responseIdentifierOf(R.SliderInteraction),
    ["lower-bound", arm(R.SliderInteraction, "lowerBound")],
    ["upper-bound", arm(R.SliderInteraction, "upperBound")],
    ["step", optional(R.SliderStep)],
    ["step-label", marked(R.DeclaredSliderStepLabel, arm(R.SliderInteraction, "stepLabel"))],
    ["orientation", optional(R.SliderOrientation)],
    ["reverse", optional(R.SliderReverse)],
  ],
  "qti-stylesheet": [
    ["href", arm(R.Stylesheet, "href")],
    ["type", arm(R.Stylesheet, "type")],
    ["media", optional(R.StylesheetMedia)],
    ["title", optional(R.StylesheetTitle)],
  ],
  "qti-template-block": templating(R.TemplateBlock, R.DeclaredTemplateBlockShowHide),
  "qti-template-block.rubric": templating(R.TemplateBlock, R.DeclaredTemplateBlockShowHide),
  "qti-template-declaration": [
    ...declared,
    [
      "param-variable",
      marked(R.DeclaredParamVariable, arm(R.TemplateDeclarationArm, "paramVariable")),
    ],
    [
      "math-variable",
      marked(R.DeclaredMathVariable, arm(R.TemplateDeclarationArm, "mathVariable")),
    ],
  ],
  "qti-template-inline": templating(R.TemplateInline, R.DeclaredTemplateInlineShowHide),
  "qti-template-inline.rubric": templating(R.TemplateInline, R.DeclaredTemplateInlineShowHide),
  "qti-text-entry-interaction": [
    responseIdentifierOf(R.TextEntryInteraction),
    ["base", marked(R.DeclaredTextEntryBase, arm(R.TextEntryInteraction, "base"))],
    ["string-identifier", column(R.StringBinding, "identifier", "node")],
    ["expected-length", optional(R.TextEntryExpectedLength)],
    ["pattern-mask", optional(R.TextEntryPatternMask)],
    ["placeholder-text", optional(R.TextEntryPlaceholderText)],
    ["format", optional(R.TextEntryFormat)],
    ["data-patternmask-message", optional(R.TextEntryPatternmaskMessage)],
  ],
  "qti-upload-interaction": [
    responseIdentifierOf(R.UploadInteraction),
    ["type", optional(R.UploadType)],
  ],
  "qti-value": [
    ["field-identifier", arm(R.RecordField, "fieldIdentifier")],
    ["base-type", recordValueBaseType],
  ],
  source: [
    ["src", unlessEmpty(arm(R.Source, "src"))],
    ["type", optional(R.SourceType)],
    ["srcset", optional(R.SourceSrcset)],
    ["media", optional(R.SourceMedia)],
    ["sizes", optional(R.SourceSizes)],
  ],
  table: [["summary", optional(R.TableSummary)]],
  td: cell(R.TdScope, R.TdAbbr, R.TdAxis, R.TdRowspan, R.TdColspan, R.TdAlign, R.TdValign),
  th: cell(R.ThScope, R.ThAbbr, R.ThAxis, R.ThRowspan, R.ThColspan, R.ThAlign, R.ThValign),
  track: [
    ["kind", marked(R.DeclaredTrackKind, arm(R.Track, "kind"))],
    ["src", arm(R.Track, "src")],
    ["srclang", optional(R.TrackSrclang)],
    ["default", optional(R.TrackDefault)],
  ],
  video: [
    ...media(
      R.VideoSrc,
      R.VideoCrossorigin,
      R.VideoPreload,
      R.VideoMediagroup,
      R.VideoAutoplay,
      R.VideoControls,
      R.VideoLoop,
      R.VideoMuted,
    ),
    ["poster", optional(R.VideoPoster)],
    ["width", optional(R.VideoWidth)],
    ["height", optional(R.VideoHeight)],
  ],
} satisfies Readonly<Record<string, readonly Own[]>>;

/**
 * {@link ownAttributes} by element kind, for the kinds of a tree whose names are not known until
 * it is read.
 */
const ownByKind: ReadonlyMap<string, readonly Own[]> = new Map(Object.entries(ownAttributes));

/**
 * The `position` column of a fact as a number, 0 for one that has none.
 */
const positionOf = (fact: Columns): number => Number(textOf(fact, "position") ?? 0);

/**
 * The `AttributeIdref` tokens of the identifier-reference attribute `name`, joined by one space:
 * none where the node holds no token, which includes an empty `headers`, whose lexical row alone
 * says it was written.
 */
const tokens =
  (name: string): Source =>
  (index) => {
    const owned = index.many(R.AttributeIdref, "node");

    return (id) => {
      const found = (owned.get(id) ?? [])
        .filter((fact) => textOf(fact, "attribute") === name)
        .toSorted((left, right) => positionOf(left) - positionOf(right));

      return found.length === 0
        ? undefined
        : found.map((fact) => textOf(fact, "target") ?? "").join(" ");
    };
  };

/**
 * `role` and the `aria-*` attributes: `AriaRole` holds `role` and every other `Aria<Name>` holds
 * `aria-<name>`, in lower case.
 */
const aria: readonly Own[] = Object.entries(family.relations)
  .filter(([key]) => key.startsWith("Aria"))
  .map(([key, relation]): Own => [
    key === "AriaRole" ? "role" : `aria-${key.slice("Aria".length).toLowerCase()}`,
    optional(relation),
  ]);

/**
 * The attributes any element can carry, whatever its kind: the families, `id`, `role` and the ARIA
 * attributes, and the tokens of every identifier-reference attribute, which come last and so
 * replace the value of an ARIA reference that a family relation also holds.
 */
const shared: readonly Own[] = [
  ["class", optional(R.NodeClass)],
  ["lang", optional(R.NodeLang)],
  ["xml:lang", optional(R.NodeXmlLang)],
  ["label", first(optional(R.NodeLabel), optional(R.AssessmentItemLabel))],
  ["dir", optional(R.NodeDir)],
  ["xml:base", optional(R.NodeXmlBase)],
  ["data-qti-suppress-tts", optional(R.NodeSuppressTts)],
  ["data-catalog-idref", optional(R.NodeCatalogIdref)],
  [
    "id",
    first(
      column(R.HtmlId, "id", "node"),
      column(R.ItemBodyId, "id", "node"),
      column(R.PrintedVariableId, "id", "node"),
    ),
  ],
  ...aria,
  ...IdrefAttribute.handles.map((name): Own => [name, tokens(name)]),
];

/**
 * The index of `rows`: each relation's facts by the text of a column, built the first time a
 * source asks and kept for the rest of the render.
 */
const indexOf = (rows: RowSet): Index => {
  const grouped = new Map<string, Groups>();
  const single = new Map<string, Facts>();
  const columns = (relation: AnyRelation, key: string) =>
    (rows.get(relation) ?? [])
      .map((fact): Columns => Object.fromEntries(Object.entries(fact)))
      .filter((fact) => textOf(fact, key) !== undefined);

  return {
    many: (relation, key) => {
      const slot = `${relation.name}\n${key}`;
      const found =
        grouped.get(slot) ?? Map.groupBy(columns(relation, key), (fact) => textOf(fact, key) ?? "");
      grouped.set(slot, found);

      return found;
    },
    one: (relation, key) => {
      const slot = `${relation.name}\n${key}`;
      const found =
        single.get(slot) ?? by(columns(relation, key), (fact) => textOf(fact, key) ?? "");
      single.set(slot, found);

      return found;
    },
  };
};

/**
 * The attribute `qname` with `value` on the node `id`: `xml:*` names are in the XML namespace and
 * every other name in none.
 */
const attributeOf = (
  qname: string,
  value: string,
  references: Attribute["references"],
): Attribute =>
  qname.startsWith("xml:")
    ? {
        local: qname.slice("xml:".length),
        namespace: xmlNamespace,
        prefix: "xml",
        qname,
        references,
        value,
      }
    : { local: qname, namespace: "", prefix: "", qname, references, value };

/**
 * A comment or processing instruction of the prolog or epilog from its `TreeMisc` text: a
 * processing instruction's text is its target alone, or its target, one space and its data.
 */
const miscOf = (row: { readonly kind: "comment" | "pi"; readonly text: string }): Misc => {
  if (row.kind === "comment") {
    return { kind: "comment", text: row.text };
  }

  const space = row.text.indexOf(" ");

  return space === -1
    ? { data: "", kind: "pi", target: row.text }
    : { data: row.text.slice(space + 1), kind: "pi", target: row.text.slice(0, space) };
};

/**
 * The rows of a tree are missing a row its structure names; the importer writes it and the reader
 * returns it, so rows that lack it were not read from a database that holds this tree.
 */
const missing = (what: string, id: string): never => {
  throw new Error(
    `The rows hold no ${what} for ${id}. Render the rows of a tree the importer wrote or the reader returned whole.`,
  );
};

/**
 * Render the tree `treeId` of `rows` back to the XML document it was imported from.
 *
 * The document is the one `readXml` gave the importer, except that an element's text keeps no CDATA
 * form and the whitespace between tags is the `Ws` rows'. Rendering reads rows only, so a document
 * round-trips through memory exactly as it will through the database.
 *
 * @param rows - The rows of the tree, `Rows` as the importer builds them and the reader returns
 *   them; rows of other trees may be present and are ignored.
 * @param treeId - The id of the tree to render, which is its root node's id.
 * @returns The document: its charset, declaration, doctype, prolog, root element and epilog. Throws
 *   when the rows lack the tree's `Tree` row, its root, or a row an edge or a node names.
 */
export const renderTree = (rows: RowSet, treeId: string): XmlDocument => {
  const tree = Rows.of(rows, Tree).find((row) => row.id === treeId) ?? missing("Tree row", treeId);
  const rootId = Rows.of(rows, TreeRoot).find((row) => row.tree === treeId)?.node;
  const nodes = by(Rows.of(rows, Node), (row) => row.id);
  const children = Map.groupBy(Rows.of(rows, Edge), (edge) => edge.parent);
  const texts = by(Rows.of(rows, TextNode), (row) => row.id);
  const whitespace = by(Rows.of(rows, Ws), (row) => row.id);
  const comments = by(Rows.of(rows, CommentRow), (row) => row.id);
  const instructions = by(Rows.of(rows, PiRow), (row) => row.id);
  const entities = by(Rows.of(rows, EntityReference), (row) => row.id);
  const declarations = Map.groupBy(Rows.of(rows, NamespaceDeclaration), (row) => row.node);
  const schemaLocations = by(Rows.of(rows, SchemaLocation), (row) => row.node);
  const lexical = Map.groupBy(Rows.of(rows, AttributeLexical), (row) => row.node);
  const references = Map.groupBy(
    Rows.of(rows, AttributeEntityReference),
    (row) => `${row.node}\n${row.attribute}`,
  );
  const index = indexOf(rows);
  const readers = new Map<string, readonly (readonly [name: string, read: Reader])[]>();

  const readersOf = (kind: string): readonly (readonly [name: string, read: Reader])[] => {
    const found =
      readers.get(kind) ??
      [...(ownByKind.get(kind) ?? []), ...shared].map(
        ([name, source]): readonly [string, Reader] => [name, source(index)],
      );
    readers.set(kind, found);

    return found;
  };

  const referencesOf = (id: string, qname: string): Attribute["references"] =>
    (references.get(`${id}\n${qname}`) ?? [])
      .toSorted((left, right) => Number(left.offset - right.offset))
      .map((row) => ({ name: row.name, offset: Number(row.offset) }));

  const stored = (id: string, kind: string): ReadonlyMap<string, string> => {
    const values = new Map<string, string>();
    for (const [name, read] of readersOf(kind)) {
      const value = read(id);
      if (value !== undefined) {
        values.set(name, value);
      }
    }

    for (const row of lexical.get(id) ?? []) {
      values.set(row.attribute, row.value);
    }

    return values;
  };

  const attributesOf = (id: string, kind: string): readonly Attribute[] => [
    ...(declarations.get(id) ?? [])
      .toSorted((left, right) => Number(left.position - right.position))
      .map((row): Attribute => {
        const qname = row.prefix === "" ? "xmlns" : `xmlns:${row.prefix}`;

        return {
          local: row.prefix === "" ? "xmlns" : row.prefix,
          namespace: xmlnsNamespace,
          prefix: row.prefix === "" ? "" : "xmlns",
          qname,
          references: referencesOf(id, qname),
          value: row.uri,
        };
      }),
    ...Option.match(Option.fromNullishOr(schemaLocations.get(id)), {
      onNone: (): readonly Attribute[] => [],
      onSome: (row): readonly Attribute[] => {
        const qname = `${row.prefix}:schemaLocation`;

        return [
          {
            local: "schemaLocation",
            namespace: xsiNamespace,
            prefix: row.prefix,
            qname,
            references: referencesOf(id, qname),
            value: row.value,
          },
        ];
      },
    }),
    ...[...stored(id, kind)].map(([name, value]) =>
      attributeOf(name, value, referencesOf(id, name)),
    ),
  ];

  const render = (id: string): Child => {
    const node = nodes.get(id) ?? missing("Node row", id);
    if (node.kind === "text") {
      return {
        cdata: false,
        kind: "text",
        value: (texts.get(id) ?? missing("TextNode row", id)).value,
      };
    }

    if (node.kind === "ws") {
      return {
        cdata: false,
        kind: "text",
        value: (whitespace.get(id) ?? missing("Ws row", id)).value,
      };
    }

    if (node.kind === "comment") {
      return { kind: "comment", text: (comments.get(id) ?? missing("Comment row", id)).text };
    }

    if (node.kind === "pi") {
      const row = instructions.get(id) ?? missing("Pi row", id);

      return { data: row.data, kind: "pi", target: row.target };
    }

    if (node.kind === "entityRef") {
      return {
        kind: "entityRef",
        name: (entities.get(id) ?? missing("EntityReference row", id)).name,
      };
    }

    const name = names.get(node.kind) ?? missing("registry row for the kind", node.kind);

    return {
      attributes: attributesOf(id, node.kind),
      children: (children.get(id) ?? [])
        .toSorted((left, right) => Number(left.position - right.position))
        .map((edge) => render(edge.child)),
      kind: "element",
      local: name.local,
      namespace: name.namespace,
      prefix: node.prefix,
      qname: node.prefix === "" ? name.local : `${node.prefix}:${name.local}`,
    };
  };

  const root = rootId === undefined ? missing("TreeRoot row", treeId) : render(rootId);
  if (root.kind !== "element") {
    return missing("root element", treeId);
  }

  const misc = Rows.of(rows, TreeMisc).filter((row) => row.tree === treeId);
  const around = (placement: "prolog" | "epilog"): readonly Misc[] =>
    misc
      .filter((row) => row.placement === placement)
      .toSorted((left, right) => Number(left.position - right.position))
      .map(miscOf);
  const version = Rows.of(rows, TreeXmlVersion).find((row) => row.tree === treeId);
  const encoding = Rows.of(rows, TreeXmlEncoding).find((row) => row.tree === treeId);
  const standalone = Rows.of(rows, TreeXmlStandalone).find((row) => row.tree === treeId);
  const doctype = Rows.of(rows, TreeDoctype).find((row) => row.tree === treeId);

  return {
    charset: tree.charset,
    declaration:
      version === undefined
        ? Option.none()
        : Option.some({
            encoding: Option.fromNullishOr(encoding?.value),
            standalone: Option.fromNullishOr(standalone?.value),
            version: version.value,
          }),
    doctype: Option.fromNullishOr(doctype?.text),
    epilog: around("epilog"),
    prolog: around("prolog"),
    root,
  };
};
