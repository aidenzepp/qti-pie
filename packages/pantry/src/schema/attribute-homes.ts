/**
 * Where each attribute's typed value lives: the one table that says which column or relation
 * holds an element kind's own attributes, the families, `id`, `role` and ARIA, and the readers
 * built on it.
 *
 * The export's renderer reads a node's attributes back through it, and the import's content guards
 * compare each `AttributeLexical` row with the column it names, so no second copy of the fact
 * exists.
 */
import type { AnyRelation, Uuid } from "@bjornpagen/grizzle";
import { Predicate } from "effect";
import type { Rows as RowSet } from "#pantry/import/tree.ts";
import * as family from "#pantry/schema/attributes.ts";
import { IdrefAttribute } from "#pantry/schema/content/rosters.ts";
import { Author } from "#pantry/schema/roles.ts";

/**
 * The relations the importer writes, by name.
 */
const R = Author.relations;

/**
 * `facts` keyed by `key`, the last fact winning a shared key.
 */
export const by = <T extends object>(
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
export interface Index {
  readonly many: (relation: AnyRelation, key: string) => Groups;
  readonly one: (relation: AnyRelation, key: string) => Facts;
}

/**
 * The value an attribute has on the node `id`, none when the rows say the source did not write it.
 */
export type Reader = (id: Uuid) => string | undefined;

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
 * The canonical rendering of an integer spelling: what `String` makes of the integer the
 * spelling parses to. An `AttributeSpelling` row is consistent with the typed value it sits
 * beside exactly when this equals the reader's text; text that is not an integer spelling has
 * none.
 *
 * @param spelling - A stored spelling, such as `+5`, `05` or `-0`.
 * @returns The canonical text of its value, or `undefined` when it is not an integer.
 */
export const spelledText = (spelling: string): string | undefined =>
  /^[+-]?[0-9]+$/u.test(spelling) ? String(BigInt(spelling)) : undefined;

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
 * An attribute that is a number or a variable name: the number of `valueField` where `kindField`
 * says `literal`, and the `identifier` of the arm's `reference` row where it says `ref`.
 *
 * @param relation - The arm that holds the kind and the number, keyed by `id`.
 * @param kindField - The column that says whether the source wrote a number or a variable name.
 * @param valueField - The column that holds the number.
 * @param reference - The relation of one `node` and `identifier` that holds the variable name.
 * @returns The source of the attribute.
 */
const literalOrRef = (
  relation: AnyRelation,
  kindField: string,
  valueField: string,
  reference: AnyRelation,
): Source => {
  const literal = arm(relation, valueField);
  const kind = arm(relation, kindField);
  const named = column(reference, "identifier", "node");

  return (index) => {
    const readLiteral = literal(index);
    const readKind = kind(index);
    const readNamed = named(index);

    return (id) => (readKind(id) === "ref" ? readNamed(id) : readLiteral(id));
  };
};

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
 * The `src` of a `source`, written except where the importer filled it: rule 11's picture clause
 * lets a `source` in a `picture` hold `srcset` and no `src`, and the importer stores the empty
 * text for it, so an empty `src` under `picture` is left absent. Under `audio` and `video` the
 * importer refuses an absent `src`, so an empty one there is a value the source wrote and is kept.
 *
 * The one loss is an explicit `src=""` on a `source` in a `picture`, which cannot be told from the
 * fill.
 */
const sourceSrc: Source = (index) => {
  const src = arm(R.Source, "src")(index);
  const parentKind = arm(R.Source, "parentKind")(index);

  return (id) => {
    const value = src(id);

    return value === "" && parentKind(id) === "picture" ? undefined : value;
  };
};

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
 * The attributes of `qti-feedback-block`, `qti-feedback-block.template` and `qti-feedback-inline`,
 * each read from its own arm.
 */
const feedback = (relation: AnyRelation, marker: AnyRelation): readonly Own[] => [
  ["outcome-identifier", arm(relation, "outcomeIdentifier")],
  ...showing(relation, marker),
];

/**
 * The attributes of `qti-template-block`, `qti-template-inline` and their two `.rubric` kinds, each
 * read from its own arm.
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
 * A value written as several parts joined by dots, each part a source of its own.
 *
 * @param parts - The parts in order.
 * @returns The source of the joined value, none when any column part is absent.
 */
const dotted =
  (...parts: readonly Source[]): Source =>
  (index) => {
    const readers = parts.map((part) => part(index));

    return (id) => {
      const values = readers.map((read) => read(id));

      return values.every((value) => value !== undefined) ? values.join(".") : undefined;
    };
  };

/**
 * A fixed text as a part of a {@link dotted} value.
 */
const text =
  (value: string): Source =>
  () =>
  () =>
    value;

/**
 * The instance of an `ItemInstanceVariableRef` as the source wrote it: the `ItemInstanceSpelling`
 * row's text where the spelling is not canonical, else the number.
 */
const instanceSpelled: Source = (index) => {
  const spelling = column(R.ItemInstanceSpelling, "value", "ref")(index);
  const number = arm(R.ItemInstanceVariableRef, "instance")(index);

  return (id) => spelling(id) ?? number(id);
};

/**
 * The `identifier` of a node that refers to a declaration: the `identifier` of its declared
 * reference, of its template-parameter reference, or the name of its built-in, whichever row the
 * node has; or, in a test, the prefixed form `PREFIX.VAR`, `PREFIX.N.VAR` or `PREFIX.duration`
 * written from its columns, or a section document's reference as written.
 */
const referenced: Source = first(
  arm(R.DeclaredRef, "identifier"),
  arm(R.TemplateParameterRef, "identifier"),
  arm(R.BuiltInRef, "name"),
  dotted(arm(R.ItemVariableRef, "prefix"), arm(R.ItemVariableRef, "variable")),
  dotted(
    arm(R.ItemInstanceVariableRef, "prefix"),
    instanceSpelled,
    arm(R.ItemInstanceVariableRef, "variable"),
  ),
  dotted(arm(R.SectionDurationRef, "prefix"), text("duration")),
  arm(R.SectionVariableRef, "identifier"),
);

/**
 * The attributes that narrow a test-wide expression to a section or to categories.
 */
const filters: readonly Own[] = [
  ["section-identifier", optional(R.ExpressionSectionIdentifier)],
  ["include-category", optional(R.ExpressionIncludeCategory)],
  ["exclude-category", optional(R.ExpressionExcludeCategory)],
];

/**
 * The attributes of `qti-outcome-maximum` and `qti-outcome-minimum`.
 */
const outcomeBound: readonly Own[] = [
  ["outcome-identifier", arm(R.OutcomeMinMax, "outcomeIdentifier")],
  ["weight-identifier", optional(R.ExpressionWeightIdentifier)],
  ...filters,
];

/**
 * The attributes of the kinds whose only attributes are the {@link filters}.
 */
const counting: readonly Own[] = filters;

/**
 * The attributes of `ud:ordinaryStatistic` and `ud:categorizedStatistic`, which share one relation.
 */
const statistic: readonly Own[] = [
  ["caseCount", optional(R.StatisticCaseCount)],
  ["context", arm(R.Statistic, "context")],
  ["glossary", optional(R.StatisticGlossary)],
  ["lastUpdated", optional(R.StatisticLastUpdated)],
  ["name", arm(R.Statistic, "name")],
  ["stdDeviation", optional(R.StatisticStdDeviation)],
  ["stdError", optional(R.StatisticStdError)],
];

/**
 * The attributes of a kind whose one attribute is the `identifier` of a declaration it refers to.
 */
const referring: readonly Own[] = [["identifier", referenced]];

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
  "cpx:variant": [
    ["identifier", arm(R.Variant, "identifier")],
    ["identifierref", arm(R.Variant, "identifierref")],
  ],
  "csmd:curriculumStandardsMetadata": [["providerId", optional(R.CsmMetadataProviderId)]],
  "csmd:curriculumStandardsMetadataSet": [
    ["resourceLabel", optional(R.CsmSetResourceLabel)],
    ["resourcePartId", optional(R.CsmSetResourcePartId)],
  ],
  "csmd:setOfGUIDs": [
    ["region", optional(R.CsmSetOfGuidsRegion)],
    ["version", optional(R.CsmSetOfGuidsVersion)],
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
  "qti-adaptive-engine-ref": [
    identifierOf(R.AdaptiveEngineRef),
    ["href", arm(R.AdaptiveEngineRef, "href")],
  ],
  "qti-adaptive-settings-ref": [
    identifierOf(R.AdaptiveSettingsRef),
    ["href", arm(R.AdaptiveSettingsRef, "href")],
  ],
  "qti-any-n": [
    ["min", arm(R.AnyN, "min")],
    ["max", arm(R.AnyN, "max")],
  ],
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
  "qti-assessment-item-ref": [
    identifierOf(R.ItemRef),
    ["href", arm(R.ItemRef, "href")],
    ["required", marked(R.DeclaredItemRefRequired, arm(R.ItemRef, "required"))],
    ["fixed", marked(R.DeclaredItemRefFixed, arm(R.ItemRef, "fixed"))],
    ["category", optional(R.ItemRefCategory)],
  ],
  "qti-assessment-section": [
    identifierOf(R.AssessmentSection),
    ["title", arm(R.AssessmentSection, "title")],
    ["visible", arm(R.AssessmentSection, "visible")],
    ["required", marked(R.DeclaredSectionRequired, arm(R.AssessmentSection, "required"))],
    ["fixed", marked(R.DeclaredSectionFixed, arm(R.AssessmentSection, "fixed"))],
    [
      "keep-together",
      marked(R.DeclaredSectionKeepTogether, arm(R.AssessmentSection, "keepTogether")),
    ],
  ],
  "qti-assessment-section-ref": [identifierOf(R.SectionRef), ["href", arm(R.SectionRef, "href")]],
  "qti-assessment-stimulus": [
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
  ],
  "qti-assessment-stimulus-ref": [
    identifierOf(R.ItemStimulusRef),
    ["href", arm(R.ItemStimulusRef, "href")],
    ["title", optional(R.ItemStimulusRefTitle)],
  ],
  "qti-assessment-test": [
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
  ],
  "qti-associable-hotspot": [
    identifierOf(R.AssociableHotspot),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["shape", arm(R.AssociableHotspot, "shape")],
    ["coords", optional(R.Coords)],
    ["hotspot-label", optional(R.AssociableHotspotLabel)],
    ["match-max", arm(R.AssociableHotspot, "matchMaxN")],
    ["match-min", marked(R.AssociableHotspotMatchMin, arm(R.AssociableHotspot, "matchMinN"))],
    [
      "show-hide",
      marked(R.DeclaredAssociableHotspotShowHide, arm(R.AssociableHotspot, "showHide")),
    ],
  ],
  "qti-associate-interaction": [
    responseIdentifierOf(R.AssociateInteraction),
    ["shuffle", marked(R.DeclaredAssociateShuffle, arm(R.AssociateInteraction, "shuffle"))],
    [
      "max-associations",
      marked(R.DeclaredAssociateMaxAssociations, arm(R.AssociateInteraction, "maxAssociationsN")),
    ],
    [
      "min-associations",
      marked(R.DeclaredAssociateMinAssociations, arm(R.AssociateInteraction, "minAssociationsN")),
    ],
  ],
  "qti-base-value": [["base-type", arm(R.Literal, "baseType")]],
  "qti-branch-rule": [
    [
      "target",
      first(
        column(R.BranchRuleExit, "exit", "rule"),
        column(R.BranchRuleTarget, "identifier", "rule"),
      ),
    ],
  ],
  "qti-choice-interaction": [
    responseIdentifierOf(R.ChoiceInteraction),
    ["shuffle", marked(R.DeclaredShuffle, arm(R.ChoiceInteraction, "shuffle"))],
    ["max-choices", marked(R.DeclaredMaxChoices, arm(R.ChoiceInteraction, "maxChoicesN"))],
    ["min-choices", marked(R.DeclaredMinChoices, arm(R.ChoiceInteraction, "minChoicesN"))],
    ["orientation", marked(R.DeclaredOrientation, arm(R.ChoiceInteraction, "orientation"))],
    ["data-min-selections-message", optional(R.ChoiceInteractionMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.ChoiceInteractionMaxSelectionsMessage)],
  ],
  "qti-context-declaration": declared,
  "qti-correct": referring,
  "qti-correct-response": [
    ["interpretation", column(R.ValueSetInterpretation, "value", "valueSet")],
  ],
  "qti-custom-operator": [
    ["class", optional(R.CustomOperatorClass)],
    ["definition", optional(R.CustomOperatorDefinition)],
  ],
  "qti-default": referring,
  "qti-default-value": [["interpretation", column(R.ValueSetInterpretation, "value", "valueSet")]],
  "qti-drawing-interaction": [responseIdentifierOf(R.DrawingInteraction)],
  "qti-end-attempt-interaction": [
    responseIdentifierOf(R.EndAttemptInteraction),
    ["title", arm(R.EndAttemptInteraction, "title")],
    ["count-attempt", optional(R.EndAttemptCountAttempt)],
  ],
  "qti-equal": [
    ["tolerance-mode", marked(R.DeclaredToleranceMode, arm(R.Equal, "toleranceMode"))],
    ["tolerance", optional(R.EqualTolerance)],
    ["include-lower-bound", marked(R.DeclaredIncludeLowerBound, arm(R.Equal, "includeLowerBound"))],
    ["include-upper-bound", marked(R.DeclaredIncludeUpperBound, arm(R.Equal, "includeUpperBound"))],
  ],
  "qti-equal-rounded": [
    ["rounding-mode", marked(R.DeclaredRoundingMode, arm(R.EqualRounded, "roundingMode"))],
    [
      "figures",
      literalOrRef(R.EqualRounded, "figuresKind", "figuresValue", R.EqualRoundedFiguresRef),
    ],
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
  "qti-feedback-block.template": feedback(
    R.TemplateFeedbackBlock,
    R.DeclaredTemplateFeedbackBlockShowHide,
  ),
  "qti-feedback-inline": feedback(R.FeedbackInline, R.DeclaredFeedbackInlineShowHide),
  "qti-field-value": [["field-identifier", arm(R.FieldValue, "fieldIdentifier")]],
  "qti-gap": [
    identifierOf(R.Gap),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["required", marked(R.DeclaredGapRequired, arm(R.Gap, "required"))],
    ["show-hide", marked(R.DeclaredGapShowHide, arm(R.Gap, "showHide"))],
  ],
  "qti-gap-img": [
    identifierOf(R.GapImg),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["match-max", arm(R.GapImg, "matchMaxN")],
    ["match-min", marked(R.GapImgMatchMin, arm(R.GapImg, "matchMinN"))],
    ["object-label", optional(R.GapImgObjectLabel)],
    ["top", optional(R.GapImgTop)],
    ["left", optional(R.GapImgLeft)],
    ["show-hide", marked(R.DeclaredGapImgShowHide, arm(R.GapImg, "showHide"))],
  ],
  "qti-gap-match-interaction": [
    responseIdentifierOf(R.GapMatchInteraction),
    ["shuffle", marked(R.DeclaredGapMatchShuffle, arm(R.GapMatchInteraction, "shuffle"))],
    [
      "min-associations",
      marked(R.GapMatchMinAssociations, arm(R.GapMatchInteraction, "minAssociationsN")),
    ],
    [
      "max-associations",
      marked(R.DeclaredGapMatchMaxAssociations, arm(R.GapMatchInteraction, "maxAssociationsN")),
    ],
    ["data-min-selections-message", optional(R.GapMatchMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.GapMatchMaxSelectionsMessage)],
    ["data-choices-container-width", optional(R.GapMatchChoicesContainerWidth)],
  ],
  "qti-gap-text": [
    identifierOf(R.GapText),
    ["template-identifier", choiceTemplate],
    ["match-group", optional(R.MatchGroup)],
    ["match-max", arm(R.GapText, "matchMaxN")],
    ["match-min", marked(R.GapTextMatchMin, arm(R.GapText, "matchMinN"))],
    ["show-hide", marked(R.DeclaredGapTextShowHide, arm(R.GapText, "showHide"))],
  ],
  "qti-graphic-associate-interaction": [
    responseIdentifierOf(R.GraphicAssociateInteraction),
    [
      "min-associations",
      marked(
        R.GraphicAssociateMinAssociations,
        arm(R.GraphicAssociateInteraction, "minAssociationsN"),
      ),
    ],
    [
      "max-associations",
      marked(
        R.DeclaredGraphicAssociateMaxAssociations,
        arm(R.GraphicAssociateInteraction, "maxAssociationsN"),
      ),
    ],
  ],
  "qti-graphic-gap-match-interaction": [
    responseIdentifierOf(R.GraphicGapMatchInteraction),
    [
      "min-associations",
      marked(
        R.GraphicGapMatchMinAssociations,
        arm(R.GraphicGapMatchInteraction, "minAssociationsN"),
      ),
    ],
    [
      "max-associations",
      marked(
        R.DeclaredGraphicGapMatchMaxAssociations,
        arm(R.GraphicGapMatchInteraction, "maxAssociationsN"),
      ),
    ],
    ["data-min-selections-message", optional(R.GraphicGapMatchMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.GraphicGapMatchMaxSelectionsMessage)],
    ["data-choices-container-width", optional(R.GraphicGapMatchChoicesContainerWidth)],
  ],
  "qti-graphic-order-interaction": [
    responseIdentifierOf(R.GraphicOrderInteraction),
    ["min-choices", optional(R.GraphicOrderMinChoicesN)],
    ["max-choices", optional(R.GraphicOrderMaxChoicesN)],
  ],
  "qti-hotspot-choice": [
    identifierOf(R.HotspotChoice),
    ["template-identifier", choiceTemplate],
    ["shape", arm(R.HotspotChoice, "shape")],
    ["coords", optional(R.Coords)],
    ["hotspot-label", optional(R.HotspotChoiceLabel)],
    ["show-hide", marked(R.DeclaredHotspotChoiceShowHide, arm(R.HotspotChoice, "showHide"))],
  ],
  "qti-hotspot-interaction": [
    responseIdentifierOf(R.HotspotInteraction),
    ["min-choices", marked(R.DeclaredHotspotMinChoices, arm(R.HotspotInteraction, "minChoicesN"))],
    ["max-choices", marked(R.DeclaredHotspotMaxChoices, arm(R.HotspotInteraction, "maxChoicesN"))],
    ["data-min-selections-message", optional(R.HotspotMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.HotspotMaxSelectionsMessage)],
  ],
  "qti-hottext": [
    identifierOf(R.Hottext),
    ["template-identifier", choiceTemplate],
    ["show-hide", marked(R.DeclaredHottextShowHide, arm(R.Hottext, "showHide"))],
  ],
  "qti-hottext-interaction": [
    responseIdentifierOf(R.HottextInteraction),
    ["max-choices", marked(R.DeclaredHottextMaxChoices, arm(R.HottextInteraction, "maxChoicesN"))],
    ["min-choices", marked(R.DeclaredHottextMinChoices, arm(R.HottextInteraction, "minChoicesN"))],
    ["data-min-selections-message", optional(R.HottextMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.HottextMaxSelectionsMessage)],
  ],
  "qti-index": [["n", literalOrRef(R.Index, "nKind", "nValue", R.IndexNRef)]],
  "qti-inline-choice": [
    identifierOf(R.InlineChoice),
    ["fixed", marked(R.DeclaredInlineChoiceFixed, arm(R.InlineChoice, "fixed"))],
    ["template-identifier", choiceTemplate],
    ["show-hide", marked(R.DeclaredInlineChoiceShowHide, arm(R.InlineChoice, "showHide"))],
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
  "qti-inside": [
    ["shape", arm(R.Inside, "shape")],
    ["coords", arm(R.Inside, "coords")],
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
  "qti-item-session-control": [
    ["max-attempts", optional(R.ItemSessionMaxAttempts)],
    ["show-feedback", marked(R.DeclaredShowFeedback, arm(R.ItemSessionControl, "showFeedback"))],
    ["allow-review", marked(R.DeclaredAllowReview, arm(R.ItemSessionControl, "allowReview"))],
    ["show-solution", marked(R.DeclaredShowSolution, arm(R.ItemSessionControl, "showSolution"))],
    ["allow-comment", marked(R.DeclaredAllowComment, arm(R.ItemSessionControl, "allowComment"))],
    ["allow-skipping", marked(R.DeclaredAllowSkipping, arm(R.ItemSessionControl, "allowSkipping"))],
    [
      "validate-responses",
      marked(R.DeclaredValidateResponses, arm(R.ItemSessionControl, "validateResponses")),
    ],
  ],
  "qti-lookup-outcome-value": referring,
  "qti-map-entry": [
    ["map-key", byBaseType(mapKeys, "id", "mapKey")],
    ["mapped-value", arm(R.MapEntry, "mappedValue")],
    ["case-sensitive", marked(R.DeclaredMapEntryCaseSensitive, arm(R.MapEntry, "caseSensitive"))],
  ],
  "qti-map-response": referring,
  "qti-map-response-point": referring,
  "qti-mapping": [
    ["lower-bound", optional(R.MappingLowerBound)],
    ["upper-bound", optional(R.MappingUpperBound)],
    ["default-value", marked(R.DeclaredMappingDefaultValue, arm(R.Mapping, "defaultValue"))],
  ],
  "qti-match-interaction": [
    responseIdentifierOf(R.MatchInteraction),
    ["shuffle", marked(R.DeclaredMatchShuffle, arm(R.MatchInteraction, "shuffle"))],
    [
      "max-associations",
      marked(R.DeclaredMatchMaxAssociations, arm(R.MatchInteraction, "maxAssociationsN")),
    ],
    [
      "min-associations",
      marked(R.DeclaredMatchMinAssociations, arm(R.MatchInteraction, "minAssociationsN")),
    ],
    ["data-min-selections-message", optional(R.MatchMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.MatchMaxSelectionsMessage)],
    ["data-first-column-header", optional(R.MatchFirstColumnHeader)],
  ],
  "qti-match-table": [["default-value", byBaseType(matchDefaults, "node", "value")]],
  "qti-match-table-entry": [
    ["source-value", arm(R.MatchTableEntry, "sourceValue")],
    ["target-value", byBaseType(matchTargets, "id", "targetValue")],
  ],
  "qti-math-constant": [["name", arm(R.MathConstant, "name")]],
  "qti-math-operator": [["name", arm(R.MathOperator, "name")]],
  "qti-media-interaction": [
    responseIdentifierOf(R.MediaInteraction),
    ["autostart", arm(R.MediaInteraction, "autostart")],
    ["min-plays", marked(R.MediaMinPlays, arm(R.MediaInteraction, "minPlaysN"))],
    ["max-plays", marked(R.MediaMaxPlays, arm(R.MediaInteraction, "maxPlaysN"))],
    ["loop", marked(R.DeclaredMediaLoop, arm(R.MediaInteraction, "loop"))],
    ["coords", optional(R.MediaCoords)],
  ],
  "qti-metadata-ref": [identifierOf(R.MetadataRef), ["href", arm(R.MetadataRef, "href")]],
  "qti-modal-feedback": [
    ["outcome-identifier", arm(R.ModalFeedback, "outcomeIdentifier")],
    ["show-hide", arm(R.ModalFeedback, "showHide")],
    identifierOf(R.ModalFeedback),
    ["title", optional(R.ModalFeedbackTitle)],
  ],
  "qti-number-correct": counting,
  "qti-number-incorrect": counting,
  "qti-number-presented": counting,
  "qti-number-responded": counting,
  "qti-number-selected": counting,
  "qti-order-interaction": [
    responseIdentifierOf(R.OrderInteraction),
    ["shuffle", marked(R.DeclaredOrderShuffle, arm(R.OrderInteraction, "shuffle"))],
    ["min-choices", optional(R.OrderMinChoicesN)],
    ["max-choices", optional(R.OrderMaxChoicesN)],
    ["orientation", optional(R.OrderOrientation)],
    ["data-min-selections-message", optional(R.OrderMinSelectionsMessage)],
    ["data-max-selections-message", optional(R.OrderMaxSelectionsMessage)],
    ["data-choices-container-width", optional(R.OrderChoicesContainerWidth)],
  ],
  "qti-ordering": [["shuffle", marked(R.DeclaredOrderingShuffle, arm(R.Ordering, "shuffle"))]],
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
  "qti-outcome-maximum": outcomeBound,
  "qti-outcome-minimum": outcomeBound,
  "qti-pattern-match": [["pattern", arm(R.PatternMatch, "pattern")]],
  "qti-position-object-interaction": [
    responseIdentifierOf(R.PositionObjectInteraction),
    ["center-point", optional(R.PositionObjectCenterPoint)],
    [
      "min-choices",
      marked(R.PositionObjectMinChoices, arm(R.PositionObjectInteraction, "minChoicesN")),
    ],
    [
      "max-choices",
      marked(R.DeclaredPositionObjectMaxChoices, arm(R.PositionObjectInteraction, "maxChoicesN")),
    ],
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
  "qti-random-float": [
    ["min", optional(R.RandomFloatMin)],
    ["max", arm(R.RandomFloat, "max")],
  ],
  "qti-random-integer": [
    ["min", optional(R.RandomIntegerMin)],
    ["max", arm(R.RandomInteger, "max")],
    ["step", optional(R.RandomIntegerStep)],
  ],
  "qti-repeat": [
    [
      "number-repeats",
      literalOrRef(R.Repeat, "numberRepeatsKind", "numberRepeatsValue", R.RepeatNumberRepeatsRef),
    ],
  ],
  "qti-response-declaration": declared,
  "qti-response-processing": [
    ["template", column(R.ResponseProcessingTemplate, "uri", "node")],
    ["template-location", column(R.ResponseProcessingTemplateLocation, "uri", "node")],
  ],
  "qti-round-to": [
    ["rounding-mode", arm(R.RoundTo, "roundingMode")],
    ["figures", literalOrRef(R.RoundTo, "figuresKind", "figuresValue", R.RoundToFiguresRef)],
  ],
  "qti-rubric-block": [
    ["use", arm(R.RubricBlock, "use")],
    ["view", arm(R.RubricBlock, "view")],
  ],
  "qti-rubric-block.test": [
    ["use", optional(R.TestRubricBlockUse)],
    ["view", arm(R.TestRubricBlock, "view")],
  ],
  "qti-select-point-interaction": [
    responseIdentifierOf(R.SelectPointInteraction),
    [
      "min-choices",
      marked(R.DeclaredSelectPointMinChoices, arm(R.SelectPointInteraction, "minChoicesN")),
    ],
    [
      "max-choices",
      marked(R.DeclaredSelectPointMaxChoices, arm(R.SelectPointInteraction, "maxChoicesN")),
    ],
  ],
  "qti-selection": [
    ["select", arm(R.Selection, "select")],
    ["with-replacement", marked(R.DeclaredWithReplacement, arm(R.Selection, "withReplacement"))],
  ],
  "qti-set-correct-response": referring,
  "qti-set-default-value": referring,
  "qti-set-outcome-value": referring,
  "qti-set-template-value": referring,
  "qti-simple-associable-choice": [
    identifierOf(R.SimpleAssociableChoice),
    ["fixed", optional(R.SimpleAssociableChoiceFixed)],
    ["template-identifier", choiceTemplate],
    ["show-hide", optional(R.SimpleAssociableChoiceShowHide)],
    ["match-group", optional(R.MatchGroup)],
    ["match-max", arm(R.SimpleAssociableChoice, "matchMaxN")],
    [
      "match-min",
      marked(R.SimpleAssociableChoiceMatchMin, arm(R.SimpleAssociableChoice, "matchMinN")),
    ],
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
  "qti-stats-operator": [["name", arm(R.StatsOperator, "name")]],
  "qti-string-match": [
    ["case-sensitive", arm(R.StringMatch, "caseSensitive")],
    ["substring", marked(R.DeclaredSubstring, arm(R.StringMatch, "substring"))],
  ],
  "qti-stylesheet": [
    ["href", arm(R.Stylesheet, "href")],
    ["type", arm(R.Stylesheet, "type")],
    ["media", optional(R.StylesheetMedia)],
    ["title", optional(R.StylesheetTitle)],
  ],
  "qti-substring": [["case-sensitive", arm(R.Substring, "caseSensitive")]],
  "qti-template-block": templating(R.TemplateBlock, R.DeclaredTemplateBlockShowHide),
  "qti-template-block.rubric": templating(
    R.RubricTemplateBlock,
    R.DeclaredRubricTemplateBlockShowHide,
  ),
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
  "qti-template-default": [["template-identifier", arm(R.TemplateDefault, "templateIdentifier")]],
  "qti-template-inline": templating(R.TemplateInline, R.DeclaredTemplateInlineShowHide),
  "qti-template-inline.rubric": templating(
    R.RubricTemplateInline,
    R.DeclaredRubricTemplateInlineShowHide,
  ),
  "qti-test-feedback": [
    ["access", arm(R.TestFeedback, "access")],
    identifierOf(R.TestFeedback),
    ["outcome-identifier", arm(R.TestFeedback, "outcomeIdentifier")],
    ["show-hide", arm(R.TestFeedback, "showHide")],
    ["title", optional(R.TestFeedbackTitle)],
  ],
  "qti-test-part": [
    identifierOf(R.TestPart),
    ["navigation-mode", arm(R.TestPart, "navigationMode")],
    ["submission-mode", arm(R.TestPart, "submissionMode")],
    ["title", optional(R.TestPartTitle)],
  ],
  "qti-test-variables": [
    ["variable-identifier", arm(R.TestVariables, "variableIdentifier")],
    ["base-type", optional(R.TestVariablesBaseType)],
    ["weight-identifier", optional(R.ExpressionWeightIdentifier)],
    ...filters,
  ],
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
  "qti-time-limits": [
    ["min-time", optional(R.TimeLimitMin)],
    ["max-time", optional(R.TimeLimitMax)],
    [
      "allow-late-submission",
      marked(R.DeclaredAllowLateSubmission, arm(R.TimeLimits, "allowLateSubmission")),
    ],
  ],
  "qti-upload-interaction": [
    responseIdentifierOf(R.UploadInteraction),
    ["type", optional(R.UploadType)],
  ],
  "qti-usagedata-ref": [identifierOf(R.UsageDataRef), ["href", arm(R.UsageDataRef, "href")]],
  "qti-value": [
    ["field-identifier", arm(R.RecordField, "fieldIdentifier")],
    ["base-type", recordValueBaseType],
  ],
  "qti-variable": [
    ["identifier", referenced],
    ["weight-identifier", optional(R.VariableWeightIdentifier)],
  ],
  "qti-variable-mapping": [
    ["source-identifier", arm(R.VariableMapping, "source")],
    ["target-identifier", arm(R.VariableMapping, "target")],
  ],
  "qti-weight": [
    ["identifier", arm(R.Weight, "identifier")],
    ["value", arm(R.Weight, "value")],
  ],
  source: [
    ["src", sourceSrc],
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
  "ud:categorizedStatistic": statistic,
  "ud:mapEntry": [
    ["caseSensitive", optional(R.UsageMapEntryCaseSensitive)],
    ["mapKey", arm(R.UsageMapEntry, "mapKey")],
    ["mappedValue", arm(R.UsageMapEntry, "mappedValue")],
  ],
  "ud:mapping": [
    ["defaultValue", marked(R.DeclaredDefaultValue, arm(R.UsageMapping, "defaultValue"))],
    ["lowerBound", optional(R.UsageMappingLowerBound)],
    ["upperBound", optional(R.UsageMappingUpperBound)],
  ],
  "ud:ordinaryStatistic": statistic,
  "ud:targetObject": [
    ["identifier", arm(R.TargetObject, "identifier")],
    ["objectType", optional(R.TargetObjectObjectType)],
    ["partIdentifier", optional(R.TargetObjectPartIdentifier)],
  ],
  "ud:usageData": [["glossary", optional(R.UsageDataGlossary)]],
  "ud:value": [
    ["baseType", arm(R.UsageValueBaseType, "baseType")],
    ["fieldIdentifier", column(R.UsageValueFieldIdentifier, "value", "id")],
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
  "xi:include": [
    ["href", optional(R.XIncludeHref)],
    ["parse", optional(R.XIncludeParse)],
    ["xpointer", optional(R.XIncludeXpointer)],
    ["encoding", optional(R.XIncludeEncoding)],
    ["accept", optional(R.XIncludeAccept)],
    ["accept-language", optional(R.XIncludeAcceptLanguage)],
  ],
} satisfies Readonly<Record<string, readonly Own[]>>;

/**
 * {@link ownAttributes} by element kind, for the kinds of a tree whose names are not known until
 * it is read.
 */
export const ownByKind: ReadonlyMap<string, readonly Own[]> = new Map(
  Object.entries(ownAttributes),
);

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
export const shared: readonly Own[] = [
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
export const indexOf = (rows: RowSet): Index => {
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
 * The readers of an element kind: each own attribute then each shared one, by name, in the order
 * {@link ownAttributes} and the shared list give them, so a reader later in the list replaces an
 * earlier one that names the same attribute.
 *
 * @param index - The index of the rows to read, from {@link indexOf}.
 * @returns A function from kind to its readers, which builds each kind's readers once.
 */
export const readersFor = (
  index: Index,
): ((kind: string) => readonly (readonly [name: string, read: Reader])[]) => {
  const readers = new Map<string, readonly (readonly [name: string, read: Reader])[]>();

  return (kind) => {
    const found =
      readers.get(kind) ??
      [...(ownByKind.get(kind) ?? []), ...shared].map(
        ([name, source]): readonly [string, Reader] => [name, source(index)],
      );
    readers.set(kind, found);

    return found;
  };
};

/**
 * The typed value of the attribute `attribute` on the node `node` of kind `kind`, read from the
 * column or relation that holds it: the value of the last reader named `attribute` for the kind,
 * as the renderer lets a later reader replace an earlier one (the tokens of an identifier-reference
 * attribute replace an ARIA value). It never reads `AttributeLexical`.
 *
 * @param rows - The rows to read.
 * @returns A function from node, kind and attribute to the typed value, `undefined` when no reader
 *   names the attribute for the kind or the rows hold no value.
 */
export const typedValues = (
  rows: RowSet,
): ((node: Uuid, kind: string, attribute: string) => string | undefined) => {
  const readersOf = readersFor(indexOf(rows));

  return (node, kind, attribute) =>
    readersOf(kind)
      .filter(([name]) => name === attribute)
      .map(([, read]) => read(node))
      .findLast((value) => value !== undefined);
};
