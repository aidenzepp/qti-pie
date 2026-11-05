/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the attribute QTI names, and its enumeration the roster the coordinate laws read; the name is the vocabulary's, not a structural description. */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * The attribute grammar (fin.md P2, §16, §17): the `ValueDomain` roster, `AttributeAdmission`,
 * `Required` and `Enumeration`, generated from the vocabularies' attribute declarations.
 *
 * A value domain is one lexical definition, the XSD simple type an attribute's value is read
 * under: a regex source, the whitespace class applied before the regex matches (as XSD applies its
 * `whiteSpace` facet before its `pattern` facet), and the XSD datatype a typed value is derived
 * in. Each handle is one distinct definition, so the database holds one value relation per handle
 * (plan D1). An enumeration's regex is the alternation of its values; one whose code a law reads
 * is `coded`, and `Enumeration` relates its lexical forms to those codes (plan A8).
 *
 * A declaration names its XSD type, and three tables read that type into a domain, most specific
 * first: the kind's own reading of the attribute, the attribute's reading under its type, then the
 * type's. They port today's homes (`src/schema/attribute-homes.ts` and the columns it names):
 * QTI's spec readings narrow or widen the XSD, and a domain states each such reading once.
 * `AttributeAdmission` is (version, kind, name) → domain, a version being one more key digit (P4),
 * and `Required` is the set of (version, kind, name) an element must carry (§16): a node's `attrs`
 * must hold its kind's row of it.
 *
 * The XSD inventory leaves hold the ASI, HTML and processing kinds' declarations; {@link supplement}
 * states the rest, and {@link mediaRevisions} the attributes the 3.0.0 XSD types otherwise. Both are
 * vocabulary data, held here until `src/vocab/` takes the vocabularies.
 */
import { Option, Order, Result, Schema } from "effect";
import { closed, dictionary, OutsideCodeSpace } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, Field } from "#pantry/grammar/closed.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * How a lexical form is normalized before its domain's regex reads it: kept, with tabs, line feeds
 * and carriage returns turned to spaces, or also trimmed with each run of spaces made one.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
export type WhiteSpace = "preserve" | "replace" | "collapse";

/**
 * The XSD datatype a domain's typed value is derived in, spelled as XML Schema Part 2 names it: a
 * built-in's QName, `list(item)` for a list, or `union(member, …)` for a union.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#built-in-datatypes | XML Schema Part 2, Built-in datatypes}
 */
export type Datatype = `xs:${string}` | `list(${string})` | `union(${string})`;

/**
 * The flags a domain's regex is compiled with: `u`, or `su` for a source whose `.` must also match
 * a line terminator, as `patterns.ts` states for each source.
 */
export type Flags = "u" | "su";

/**
 * The definition every value domain has: its handle, its regex, its whitespace class and its
 * datatype. Two domains never share all four, so the handle names the definition.
 */
interface Lexical {
  readonly datatype: Datatype;
  readonly flags: Flags;
  readonly handle: string;
  /**
   * The regex the lexical form must match after the whitespace class, anchored, in the syntax
   * `str.regex` accepts.
   */
  readonly source: string;
  readonly whiteSpace: WhiteSpace;
}

/**
 * A value domain whose lexical space a pattern states.
 */
export interface PatternDomain extends Lexical {
  readonly _tag: "pattern";
}

/**
 * A value domain whose lexical space is a list of values, its regex their alternation. No law
 * reads its values as codes.
 */
export interface EnumerationDomain extends Lexical {
  readonly _tag: "enumeration";
  readonly values: readonly string[];
}

/**
 * An enumeration whose code a law reads: base types, cardinalities, shapes, rounding and tolerance
 * modes. Its values are a roster in code order, and `Enumeration` relates each to its code.
 */
export interface CodedDomain extends Lexical {
  readonly _tag: "coded";
  readonly values: readonly string[];
}

/**
 * A value domain: one lexical definition an attribute's value is read under.
 */
export type ValueDomain = PatternDomain | EnumerationDomain | CodedDomain;

/**
 * Construct a pattern domain.
 *
 * @param handle - The domain's handle.
 * @param source - Its regex source, from `patterns.ts`.
 * @param flags - The flags `patterns.ts` states for the source.
 * @param whiteSpace - The class applied before the regex.
 * @param datatype - The datatype its typed value is derived in.
 * @returns The domain.
 */
const pattern = (
  handle: string,
  source: string,
  flags: Flags,
  whiteSpace: WhiteSpace,
  datatype: Datatype,
): PatternDomain => ({ _tag: "pattern", datatype, flags, handle, source, whiteSpace });

/**
 * Write the regex of a list of values: their alternation, anchored, each value escaped so that it
 * matches only itself.
 *
 * @param values - The values.
 * @returns The regex source.
 */
const alternation = (values: readonly string[]): string =>
  `^(?:${values.map((value) => value.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`)).join("|")})$`;

/**
 * Construct an enumeration domain, whose regex is its values' alternation.
 *
 * @param handle - The domain's handle.
 * @param values - Its values.
 * @param whiteSpace - The class applied before the regex.
 * @param datatype - The datatype its typed value is derived in.
 * @returns The domain.
 */
const enumerated = (
  handle: string,
  values: readonly string[],
  whiteSpace: WhiteSpace,
  datatype: Datatype,
): EnumerationDomain => ({
  _tag: "enumeration",
  datatype,
  flags: "u",
  handle,
  source: alternation(values),
  values,
  whiteSpace,
});

/**
 * Construct a coded enumeration, whose values are a roster in code order. Every coded enumeration
 * restricts `xs:string`, whitespace preserved.
 *
 * @param handle - The domain's handle.
 * @param values - Its values, in code order.
 * @returns The domain.
 */
const coded = (handle: string, values: readonly string[]): CodedDomain => ({
  _tag: "coded",
  datatype: "xs:string",
  flags: "u",
  handle,
  source: alternation(values),
  values,
  whiteSpace: "preserve",
});

/**
 * `xs:string`: any text, whitespace preserved.
 */
const string = pattern(
  "string",
  patterns.xsString,
  patterns.xsStringFlags,
  "preserve",
  "xs:string",
);

/**
 * `xs:normalizedString`: any text, with tabs and line breaks read as spaces. `URLDType` is one.
 */
const normalizedString = pattern(
  "normalizedString",
  patterns.xsNormalizedString,
  patterns.xsNormalizedStringFlags,
  "replace",
  "xs:normalizedString",
);

/**
 * The `tool-name` and `tool-version` of an item: a normalized string of at most 256 characters.
 */
const toolString = pattern(
  "toolString",
  patterns.toolString,
  patterns.toolStringFlags,
  "replace",
  "xs:normalizedString",
);

/**
 * A `qti-printed-variable`'s `format`: one printf conversion.
 */
const printfFormat = pattern(
  "printfFormat",
  patterns.printfFormat,
  "u",
  "replace",
  "xs:normalizedString",
);

/**
 * A `qti-printed-variable`'s `field`: an NCName, read as the XSD's `xs:normalizedString`, so
 * surrounding whitespace is refused rather than trimmed.
 */
const normalizedNcName = pattern(
  "normalizedNcName",
  patterns.ncName,
  "u",
  "replace",
  "xs:normalizedString",
);

/**
 * `xs:NCName`, `IdentifierDType` among its restrictions.
 */
const ncName = pattern("ncName", patterns.ncName, "u", "collapse", "xs:NCName");

/**
 * `xs:ID`, `UniqueIdentifierDType` among its restrictions.
 */
const id = pattern("id", patterns.ncName, "u", "collapse", "xs:ID");

/**
 * `xs:IDREF`, `UniqueIdentifierRefDType` among its restrictions.
 */
const idref = pattern("idref", patterns.ncName, "u", "collapse", "xs:IDREF");

/**
 * `xs:IDREFS`: one or more references, space-separated.
 */
const idrefs = pattern("idrefs", patterns.ncNameList, "u", "collapse", "xs:IDREFS");

/**
 * A list of `IdentifierListDType`, possibly empty: categories, match groups and `headers`.
 */
const identifierList = pattern(
  "identifierList",
  patterns.identifierList,
  "u",
  "collapse",
  "list(xs:NCName)",
);

/**
 * A `class`: a list of `StringListDType` tokens, possibly empty.
 */
const classList = pattern("classList", patterns.classList, "u", "collapse", "list(xs:string)");

/**
 * `xs:language`, read as a BCP 47 tag.
 */
const language = pattern("language", patterns.bcp47, "u", "collapse", "xs:language");

/**
 * `lang` and `srclang`: a BCP 47 tag, read as the XSD's `xs:normalizedString`.
 */
const normalizedLanguage = pattern(
  "normalizedLanguage",
  patterns.bcp47,
  "u",
  "replace",
  "xs:normalizedString",
);

/**
 * A LOM `string`'s `language`: an `xs:language` form or empty, whitespace preserved.
 */
const lomLanguage = pattern(
  "lomLanguage",
  patterns.xsLanguageOrEmpty,
  "u",
  "preserve",
  "xs:string",
);

/**
 * `xs:anyURI`, read as an RFC 3986 URI reference.
 */
const anyUri = pattern("anyUri", patterns.anyUri, "u", "collapse", "xs:anyURI");

/**
 * An `object`'s `data`: a URI reference, read as the XSD's `xs:string`.
 */
const uriString = pattern("uriString", patterns.anyUri, "u", "preserve", "xs:string");

/**
 * A manifest `href`: a URI with a scheme, or a relative path inside the package.
 */
const packageHref = pattern("packageHref", patterns.hrefInPackage, "u", "collapse", "xs:anyURI");

/**
 * `xs:boolean`: `true`, `false`, `1` or `0`.
 */
const boolean = enumerated("boolean", ["true", "false", "1", "0"], "collapse", "xs:boolean");

/**
 * `xs:integer`, the ARIA counts and indices read as it.
 */
const integer = pattern("integer", patterns.xsInteger, "u", "collapse", "xs:integer");

/**
 * `xs:nonNegativeInteger` as `patterns.ts` spells it: digits after an optional plus.
 */
const nonNegativeInteger = pattern(
  "nonNegativeInteger",
  patterns.xsNonNegativeInteger,
  "u",
  "collapse",
  "xs:nonNegativeInteger",
);

/**
 * `xs:nonNegativeInteger`'s whole lexical space, which also admits a zero after a minus sign: the
 * form the importer's integer reader accepts for the bounds a counted family reads.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#nonNegativeInteger | XML Schema Part 2, nonNegativeInteger}
 */
const xsdNonNegativeInteger = pattern(
  "xsdNonNegativeInteger",
  String.raw`^(?:\+?[0-9]+|-0+)$`,
  "u",
  "collapse",
  "xs:nonNegativeInteger",
);

/**
 * `xs:positiveInteger`: `ARIALevelIntegerDType`, and the table spans.
 */
const positiveInteger = pattern(
  "positiveInteger",
  patterns.positiveInteger,
  "u",
  "collapse",
  "xs:positiveInteger",
);

/**
 * `xs:int`: at most ten digits after an optional sign.
 */
const int = pattern("int", patterns.xsInt, "u", "collapse", "xs:int");

/**
 * `xs:decimal`.
 */
const decimal = pattern("decimal", patterns.xsDecimal, "u", "collapse", "xs:decimal");

/**
 * `xs:double`, `INF`, `-INF` and `NaN` included.
 */
const double = pattern("double", patterns.xsDouble, "u", "collapse", "xs:double");

/**
 * `NonNegativeDoubleDType`: a double of zero or more.
 */
const nonNegativeDouble = pattern(
  "nonNegativeDouble",
  patterns.nonNegativeDouble,
  "u",
  "collapse",
  "xs:double",
);

/**
 * A double above zero: a slider's `step` and an outcome's `normal-maximum`.
 */
const positiveDouble = pattern(
  "positiveDouble",
  patterns.positiveDouble,
  "u",
  "collapse",
  "xs:double",
);

/**
 * An integer or the identifier of a variable that holds one.
 */
const integerOrVariable = pattern(
  "integerOrVariable",
  patterns.integerOrVariableRef,
  "u",
  "collapse",
  "union(xs:integer, xs:NCName)",
);

/**
 * A double or the identifier of a variable that holds one.
 */
const floatOrVariable = pattern(
  "floatOrVariable",
  patterns.floatOrVariableRef,
  "u",
  "collapse",
  "union(xs:double, xs:NCName)",
);

/**
 * A list of `IntegerListDType`, possibly empty: a stage's `center-point`.
 */
const integerList = pattern("integerList", patterns.integerList, "u", "collapse", "list(xs:int)");

/**
 * A `qti-equal`'s `tolerance`: one or two doubles or variable identifiers.
 */
const toleranceList = pattern(
  "toleranceList",
  patterns.toleranceList,
  "u",
  "collapse",
  "list(union(xs:double, xs:NCName))",
);

/**
 * A calendar date with no timezone, as usage data writes `lastUpdated`.
 */
const date = pattern("date", patterns.usageDate, "u", "collapse", "xs:date");

/**
 * `LengthDType`: a whole number of pixels or a percentage.
 */
const length = pattern("length", patterns.lengthDType, "u", "preserve", "xs:string");

/**
 * A `video`'s `width` and `height`: a `LengthDType` length, read as the XSD's collapsed
 * `xs:nonNegativeInteger`.
 */
const collapsedLength = pattern(
  "collapsedLength",
  patterns.lengthDType,
  "u",
  "collapse",
  "xs:string",
);

/**
 * `MimeTypeDType`: one media type.
 */
const mimeType = pattern("mimeType", patterns.mimeType, "u", "replace", "xs:normalizedString");

/**
 * A list of `MimeTypeDType`, possibly empty: an upload's accepted `type`.
 */
const mimeTypeList = pattern(
  "mimeTypeList",
  patterns.mimeTypeList,
  "u",
  "collapse",
  "list(xs:normalizedString)",
);

/**
 * `CoordsDType` as the XSD states it: a circle's, a rectangle's or a polygon's coordinates.
 */
const coords = pattern("coords", patterns.coords, "u", "replace", "xs:normalizedString");

/**
 * The coordinates of a hotspot or an area-map entry under any of its shapes, an ellipse's four
 * included.
 */
const coordsAny = pattern("coordsAny", patterns.coordsAny, "u", "replace", "xs:normalizedString");

/**
 * A media interaction's `coords`: a rectangle's four.
 */
const coordsRect = pattern(
  "coordsRect",
  patterns.coordsRect,
  "u",
  "replace",
  "xs:normalizedString",
);

/**
 * `aria-relevant`: a list of `ARIARelevantListDType` values.
 */
const ariaRelevant = pattern(
  "ariaRelevant",
  patterns.ariaRelevantList,
  "u",
  "collapse",
  "list(xs:string)",
);

/**
 * `view`: a list of `ViewEnumDType` values.
 */
const viewList = pattern("viewList", patterns.viewList, "u", "collapse", "list(xs:string)");

/**
 * A rubric block's `use`: `instructions`, `scoring`, `navigation`, or an `ext:` extension.
 */
const rubricUse = pattern(
  "rubricUse",
  patterns.useEnumExt,
  "u",
  "collapse",
  "union(xs:string, xs:normalizedString)",
);

/**
 * A manifest resource's `type`, whose code `ResourceType` derives.
 */
const resourceType = pattern("resourceType", patterns.resourceType, "u", "preserve", "xs:string");

/**
 * `aria-checked` and `aria-pressed`.
 */
const tristate = enumerated(
  "tristate",
  ["true", "false", "mixed", "undefined"],
  "preserve",
  "xs:string",
);

/**
 * `aria-expanded` and `aria-selected`.
 */
const trueFalseUndefined = enumerated(
  "trueFalseUndefined",
  ["true", "false", "undefined"],
  "preserve",
  "xs:string",
);

/**
 * `dir`.
 */
const textDirection = enumerated("textDirection", ["ltr", "rtl", "auto"], "preserve", "xs:string");

/**
 * A `bdo`'s `dir`, which overrides the direction and so is never `auto`.
 */
const bdoDirection = enumerated("bdoDirection", ["ltr", "rtl"], "preserve", "xs:string");

/**
 * The 74 `role` values of `ARIABaseDType`, in XSD order.
 */
const ariaRole = enumerated(
  "ariaRole",
  [
    "article",
    "columnheader",
    "definition",
    "document",
    "group",
    "heading",
    "img",
    "list",
    "listitem",
    "math",
    "note",
    "presentation",
    "region",
    "row",
    "rowgroup",
    "rowheader",
    "separator",
    "toolbar",
    "button",
    "checkbox",
    "gridcell",
    "link",
    "log",
    "option",
    "radio",
    "slider",
    "spinbutton",
    "status",
    "tab",
    "tabpanel",
    "textbox",
    "timer",
    "listbox",
    "radiogroup",
    "tablist",
    "complementary",
    "contentinfo",
    "alert",
    "alertdialog",
    "application",
    "banner",
    "combobox",
    "dialog",
    "form",
    "grid",
    "main",
    "marquee",
    "menu",
    "menubar",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "navigation",
    "progressbar",
    "scrollbar",
    "search",
    "tooltip",
    "tree",
    "treegrid",
    "treeitem",
    "searchbox",
    "switch",
    "term",
    "figure",
    "code",
    "time",
    "subscript",
    "superscript",
    "meter",
    "generic",
    "insertion",
    "deletion",
    "strong",
    "emphasis",
  ],
  "preserve",
  "xs:string",
);

/**
 * The roles an `h1` may take.
 */
const headingRole = enumerated(
  "headingRole",
  ["heading", "tab", "presentation"],
  "preserve",
  "xs:string",
);

/**
 * `aria-live`.
 */
const ariaLive = enumerated("ariaLive", ["off", "polite", "assertive"], "preserve", "xs:string");

/**
 * A layout axis: `aria-orientation`, and the `orientation` of a choice, order or slider
 * interaction.
 */
const orientation = enumerated("orientation", ["vertical", "horizontal"], "preserve", "xs:string");

/**
 * `aria-autocomplete`.
 */
const ariaAutocomplete = enumerated(
  "ariaAutocomplete",
  ["inline", "list", "both", "none"],
  "preserve",
  "xs:string",
);

/**
 * `aria-invalid`.
 */
const ariaInvalid = enumerated(
  "ariaInvalid",
  ["true", "false", "grammar", "spelling"],
  "preserve",
  "xs:string",
);

/**
 * `aria-sort`.
 */
const ariaSort = enumerated(
  "ariaSort",
  ["ascending", "descending", "none", "other"],
  "preserve",
  "xs:string",
);

/**
 * `aria-current`.
 */
const ariaCurrent = enumerated(
  "ariaCurrent",
  ["page", "step", "location", "date", "time", "true", "false", "undefined"],
  "preserve",
  "xs:string",
);

/**
 * `data-qti-suppress-tts`.
 */
const suppressTts = enumerated(
  "suppressTts",
  ["computer-read-aloud", "screen-reader", "all"],
  "preserve",
  "xs:string",
);

/**
 * `show-hide`.
 */
const showHide = enumerated("showHide", ["show", "hide"], "preserve", "xs:string");

/**
 * The `BaseType` roster: a declaration's, a value's or a usage value's `base-type`.
 */
const baseType = coded("baseType", [
  "boolean",
  "integer",
  "float",
  "string",
  "identifier",
  "uri",
  "duration",
  "point",
  "pair",
  "directedPair",
  "file",
]);

/**
 * The `Cardinality` roster: a declaration's `cardinality`.
 */
const cardinality = coded("cardinality", ["single", "multiple", "ordered", "record"]);

/**
 * The `Shape` roster: the shape of a hotspot, an area-map entry or a `qti-inside` area.
 */
const shape = coded("shape", ["circle", "default", "ellipse", "poly", "rect"]);

/**
 * The `RoundingMode` roster, which says how `figures` counts.
 */
const roundingMode = coded("roundingMode", ["decimalPlaces", "significantFigures"]);

/**
 * The `ToleranceMode` roster, which says whether a `qti-equal` needs its `tolerance`.
 */
const toleranceMode = coded("toleranceMode", ["absolute", "exact", "relative"]);

/**
 * A media element's `crossorigin`.
 */
const crossOrigin = enumerated(
  "crossOrigin",
  ["anonymous", "use-credentials"],
  "preserve",
  "xs:string",
);

/**
 * A media element's `preload`.
 */
const mediaPreload = enumerated(
  "mediaPreload",
  ["none", "auto", "metadata"],
  "preserve",
  "xs:string",
);

/**
 * 3.0.1's `autoplay`, an enumeration that names the attribute.
 */
const mediaAutoplay = enumerated(
  "mediaAutoplay",
  ["true", "false", "autoplay"],
  "preserve",
  "xs:string",
);

/**
 * 3.0.1's `controls`, an enumeration that names the attribute.
 */
const mediaControls = enumerated(
  "mediaControls",
  ["true", "false", "controls"],
  "preserve",
  "xs:string",
);

/**
 * 3.0.1's `loop`, an enumeration that names the attribute.
 */
const mediaLoop = enumerated("mediaLoop", ["true", "false", "loop"], "preserve", "xs:string");

/**
 * 3.0.1's `muted`, an enumeration that names the attribute.
 */
const mediaMuted = enumerated("mediaMuted", ["true", "false", "muted"], "preserve", "xs:string");

/**
 * 3.0.1's `track/@default`, an enumeration that names the attribute.
 */
const trackDefault = enumerated(
  "trackDefault",
  ["true", "false", "default"],
  "preserve",
  "xs:string",
);

/**
 * A track's `kind`.
 */
const trackKind = enumerated(
  "trackKind",
  ["subtitles", "captions", "descriptions", "chapters", "metadata"],
  "preserve",
  "xs:string",
);

/**
 * A table cell's `scope`.
 */
const cellScope = enumerated(
  "cellScope",
  ["row", "col", "rowgroup", "colgroup"],
  "preserve",
  "xs:string",
);

/**
 * A table cell's `align`.
 */
const cellAlign = enumerated(
  "cellAlign",
  ["left", "center", "right", "justify", "char"],
  "preserve",
  "xs:string",
);

/**
 * A table cell's `valign`.
 */
const cellValign = enumerated(
  "cellValign",
  ["bottom", "middle", "top", "baseline"],
  "preserve",
  "xs:string",
);

/**
 * An extended-text interaction's `format`.
 */
const textFormat = enumerated(
  "textFormat",
  ["plain", "preformatted", "xhtml"],
  "preserve",
  "xs:string",
);

/**
 * A `qti-math-constant`'s `name`.
 */
const mathConstant = enumerated("mathConstant", ["pi", "e"], "preserve", "xs:string");

/**
 * A `qti-math-operator`'s `name`.
 */
const mathOperator = enumerated(
  "mathOperator",
  [
    "sin",
    "cos",
    "tan",
    "sec",
    "csc",
    "cot",
    "asin",
    "acos",
    "atan",
    "atan2",
    "asec",
    "acsc",
    "acot",
    "sinh",
    "cosh",
    "tanh",
    "sech",
    "csch",
    "coth",
    "log",
    "ln",
    "exp",
    "abs",
    "signum",
    "floor",
    "ceil",
    "toDegrees",
    "toRadians",
  ],
  "preserve",
  "xs:string",
);

/**
 * A `qti-stats-operator`'s `name`.
 */
const statsOperator = enumerated(
  "statsOperator",
  ["mean", "sampleVariance", "sampleSD", "popVariance", "popSD"],
  "preserve",
  "xs:string",
);

/**
 * An outcome declaration's `external-scored`.
 */
const externalScored = enumerated(
  "externalScored",
  ["human", "externalMachine"],
  "preserve",
  "xs:string",
);

/**
 * A `param`'s `valuetype`.
 */
const paramValuetype = enumerated("paramValuetype", ["DATA", "REF"], "preserve", "xs:string");

/**
 * A usage-data target object's `objectType`.
 */
const targetObjectType = enumerated(
  "targetObjectType",
  ["test", "testpart", "section", "item", "outcome", "interaction", "choice"],
  "preserve",
  "xs:string",
);

/**
 * An XInclude's `parse`, a token.
 */
const xincludeParse = enumerated("xincludeParse", ["xml", "text"], "collapse", "xs:token");

/**
 * The `ValueDomain` roster, in code order. A domain joins at the end, so every handle keeps its
 * code; each is the domain of at least one attribute.
 */
export const valueDomains: readonly ValueDomain[] = [
  string,
  normalizedString,
  toolString,
  printfFormat,
  normalizedNcName,
  ncName,
  id,
  idref,
  idrefs,
  identifierList,
  classList,
  language,
  normalizedLanguage,
  lomLanguage,
  anyUri,
  uriString,
  packageHref,
  boolean,
  integer,
  nonNegativeInteger,
  xsdNonNegativeInteger,
  positiveInteger,
  int,
  decimal,
  double,
  nonNegativeDouble,
  positiveDouble,
  integerOrVariable,
  floatOrVariable,
  integerList,
  toleranceList,
  date,
  length,
  collapsedLength,
  mimeType,
  mimeTypeList,
  coords,
  coordsAny,
  coordsRect,
  ariaRelevant,
  viewList,
  rubricUse,
  resourceType,
  tristate,
  trueFalseUndefined,
  textDirection,
  bdoDirection,
  ariaRole,
  headingRole,
  ariaLive,
  orientation,
  ariaAutocomplete,
  ariaInvalid,
  ariaSort,
  ariaCurrent,
  suppressTts,
  showHide,
  baseType,
  cardinality,
  shape,
  roundingMode,
  toleranceMode,
  crossOrigin,
  mediaPreload,
  mediaAutoplay,
  mediaControls,
  mediaLoop,
  mediaMuted,
  trackDefault,
  trackKind,
  cellScope,
  cellAlign,
  cellValign,
  textFormat,
  mathConstant,
  mathOperator,
  statsOperator,
  externalScored,
  paramValuetype,
  targetObjectType,
  xincludeParse,
];

/**
 * Whether the XSD requires an attribute.
 */
export type Use = "required" | "optional";

/**
 * One attribute a kind declares: its `AttributeName` handle, its XSD type, whether it is required,
 * and the whitespace class of its type, `union` for a union whose members' classes differ. The XSD
 * inventory's attributes are declarations.
 */
export interface Declared {
  readonly name: string;
  /**
   * The declared type's QName, or the base of an inline type: `list` for an inline list and
   * `union` for an inline union, as the inventory writes them.
   */
  readonly type: string;
  readonly use: Use;
  readonly whiteSpace: WhiteSpace | "union";
}

/**
 * A declaration one schema version states otherwise: in `version`, it replaces the kind's
 * declaration of its name, or adds one.
 */
export interface Revision extends Declared {
  readonly kind: string;
  readonly version: string;
}

/**
 * One vocabulary's attributes: each kind's declarations, as every version states them, and the
 * revisions of single versions.
 */
export interface AttributeVocabulary {
  readonly attributes: Readonly<Record<string, readonly Declared[]>>;
  readonly revisions: readonly Revision[];
}

/**
 * The declarations of an XSD inventory leaf, by kind.
 *
 * @param leaf - An inventory leaf, or any record of entries that list their attributes.
 * @returns Each kind's declarations, in the entry's order.
 */
export const attributesOf = (
  leaf: Readonly<Record<string, { readonly attributes: readonly Declared[] }>>,
): Readonly<Record<string, readonly Declared[]>> =>
  Object.fromEntries(Object.entries(leaf).map(([kind, entry]) => [kind, entry.attributes]));

/**
 * The attributes of the kinds no XSD inventory leaf holds: the content package's, LOM's
 * `string`, curriculum standards metadata's, usage data's and XInclude's. Each has the type its
 * XSD declares where `~/.cache/gr8des/qti3/xsd/` pins that XSD (CP and XInclude), and otherwise
 * the type and class the importer reads it under (`import/manifest.ts`, `import/usage.ts`).
 */
export const supplement: AttributeVocabulary = {
  attributes: {
    "cp:dependency": [
      { name: "identifierref", type: "xs:IDREF", use: "required", whiteSpace: "collapse" },
    ],
    "cp:file": [{ name: "href", type: "xs:anyURI", use: "required", whiteSpace: "collapse" }],
    "cp:manifest": [{ name: "identifier", type: "xs:ID", use: "required", whiteSpace: "collapse" }],
    "cp:resource": [
      { name: "identifier", type: "xs:ID", use: "required", whiteSpace: "collapse" },
      { name: "type", type: "xs:string", use: "required", whiteSpace: "preserve" },
      { name: "href", type: "xs:anyURI", use: "optional", whiteSpace: "collapse" },
    ],
    "cpx:variant": [
      { name: "identifier", type: "xs:ID", use: "required", whiteSpace: "collapse" },
      { name: "identifierref", type: "xs:IDREF", use: "required", whiteSpace: "collapse" },
    ],
    "csmd:curriculumStandardsMetadata": [
      { name: "providerId", type: "xs:normalizedString", use: "optional", whiteSpace: "replace" },
    ],
    "csmd:curriculumStandardsMetadataSet": [
      {
        name: "resourceLabel",
        type: "xs:normalizedString",
        use: "optional",
        whiteSpace: "replace",
      },
      {
        name: "resourcePartId",
        type: "xs:normalizedString",
        use: "optional",
        whiteSpace: "replace",
      },
    ],
    "csmd:setOfGUIDs": [
      { name: "region", type: "xs:normalizedString", use: "optional", whiteSpace: "replace" },
      { name: "version", type: "xs:normalizedString", use: "optional", whiteSpace: "replace" },
    ],
    "lom:string": [
      { name: "language", type: "xs:string", use: "optional", whiteSpace: "preserve" },
      { name: "xml:lang", type: "xs:language", use: "optional", whiteSpace: "collapse" },
    ],
    "ud:categorizedStatistic": [
      { name: "caseCount", type: "xs:integer", use: "optional", whiteSpace: "collapse" },
      { name: "context", type: "xs:anyURI", use: "required", whiteSpace: "collapse" },
      { name: "glossary", type: "xs:anyURI", use: "optional", whiteSpace: "collapse" },
      { name: "lastUpdated", type: "xs:date", use: "optional", whiteSpace: "collapse" },
      { name: "name", type: "xs:NCName", use: "required", whiteSpace: "collapse" },
      { name: "stdDeviation", type: "xs:double", use: "optional", whiteSpace: "collapse" },
      { name: "stdError", type: "xs:double", use: "optional", whiteSpace: "collapse" },
    ],
    "ud:mapEntry": [
      { name: "caseSensitive", type: "xs:boolean", use: "optional", whiteSpace: "collapse" },
      { name: "mapKey", type: "xs:normalizedString", use: "required", whiteSpace: "replace" },
      { name: "mappedValue", type: "xs:double", use: "required", whiteSpace: "collapse" },
    ],
    "ud:mapping": [
      { name: "defaultValue", type: "xs:double", use: "optional", whiteSpace: "collapse" },
      { name: "lowerBound", type: "xs:double", use: "optional", whiteSpace: "collapse" },
      { name: "upperBound", type: "xs:double", use: "optional", whiteSpace: "collapse" },
    ],
    "ud:ordinaryStatistic": [
      { name: "caseCount", type: "xs:integer", use: "optional", whiteSpace: "collapse" },
      { name: "context", type: "xs:anyURI", use: "required", whiteSpace: "collapse" },
      { name: "glossary", type: "xs:anyURI", use: "optional", whiteSpace: "collapse" },
      { name: "lastUpdated", type: "xs:date", use: "optional", whiteSpace: "collapse" },
      { name: "name", type: "xs:NCName", use: "required", whiteSpace: "collapse" },
      { name: "stdDeviation", type: "xs:double", use: "optional", whiteSpace: "collapse" },
      { name: "stdError", type: "xs:double", use: "optional", whiteSpace: "collapse" },
    ],
    "ud:targetObject": [
      { name: "identifier", type: "xs:string", use: "required", whiteSpace: "preserve" },
      { name: "objectType", type: "xs:string", use: "optional", whiteSpace: "preserve" },
      { name: "partIdentifier", type: "xs:NCName", use: "optional", whiteSpace: "collapse" },
    ],
    "ud:usageData": [
      { name: "glossary", type: "xs:anyURI", use: "optional", whiteSpace: "collapse" },
    ],
    "ud:value": [
      { name: "baseType", type: "xs:string", use: "optional", whiteSpace: "preserve" },
      { name: "fieldIdentifier", type: "xs:NCName", use: "optional", whiteSpace: "collapse" },
    ],
    "xi:include": [
      { name: "href", type: "xs:anyURI", use: "optional", whiteSpace: "collapse" },
      { name: "parse", type: "xs:token", use: "optional", whiteSpace: "collapse" },
      { name: "xpointer", type: "xs:string", use: "optional", whiteSpace: "preserve" },
      { name: "encoding", type: "xs:string", use: "optional", whiteSpace: "preserve" },
      { name: "accept", type: "xs:string", use: "optional", whiteSpace: "preserve" },
      { name: "accept-language", type: "xs:string", use: "optional", whiteSpace: "preserve" },
    ],
  },
  revisions: [],
};

/**
 * The media attributes 3.0.0 declares `xs:boolean` (goal 3.9): `autoplay`, `controls`, `loop` and
 * `muted` on `audio` and `video`, and `track/@default`. 3.0.1 declares each an enumeration that
 * names the attribute, which the inventory, derived from the 3.0.1 XSD, holds.
 */
export const mediaRevisions: readonly Revision[] = (
  [
    ["audio", "autoplay"],
    ["audio", "controls"],
    ["audio", "loop"],
    ["audio", "muted"],
    ["video", "autoplay"],
    ["video", "controls"],
    ["video", "loop"],
    ["video", "muted"],
    ["track", "default"],
  ] as const
).map(([kind, name]): Revision => ({
  kind,
  name,
  type: "xs:boolean",
  use: "optional",
  version: "3.0.0",
  whiteSpace: "collapse",
}));

/**
 * The domain of each XSD type that names one: the built-ins and QTI's named simple types. A type
 * whose attributes take different domains, as `list` and `union` do, has no entry here, and every
 * attribute of it has its own reading.
 */
const typeReadings = {
  ARIALevelIntegerDType: positiveInteger,
  CoordsDType: coords,
  IdentifierDType: ncName,
  LengthDType: length,
  MimeTypeDType: mimeType,
  NonNegativeDoubleDType: nonNegativeDouble,
  URLDType: normalizedString,
  UniqueIdentifierDType: id,
  UniqueIdentifierRefDType: idref,
  "xs:ID": id,
  "xs:IDREF": idref,
  "xs:IDREFS": idrefs,
  "xs:NCName": ncName,
  "xs:anySimpleType": string,
  "xs:anyURI": anyUri,
  "xs:boolean": boolean,
  "xs:date": date,
  "xs:decimal": decimal,
  "xs:double": double,
  "xs:int": int,
  "xs:integer": integer,
  "xs:language": language,
  "xs:nonNegativeInteger": xsdNonNegativeInteger,
  "xs:normalizedString": normalizedString,
  "xs:string": string,
} satisfies Readonly<Record<string, ValueDomain>>;

/**
 * The domain of an attribute under its type, where QTI reads that attribute otherwise than the
 * type: an inline enumeration the inventory records as its base, a list or union attribute, or a
 * spec reading that narrows or widens the XSD. By type, then attribute name.
 */
const nameReadings = {
  NonNegativeDoubleDType: { "normal-maximum": positiveDouble, step: positiveDouble },
  list: {
    "aria-relevant": ariaRelevant,
    "center-point": integerList,
    class: classList,
    "exclude-category": identifierList,
    headers: identifierList,
    "include-category": identifierList,
    "match-group": identifierList,
    tolerance: toleranceList,
    type: mimeTypeList,
    view: viewList,
  },
  union: {
    base: integerOrVariable,
    figures: integerOrVariable,
    index: integerOrVariable,
    max: integerOrVariable,
    min: integerOrVariable,
    n: integerOrVariable,
    "number-repeats": integerOrVariable,
    pattern: string,
    step: integerOrVariable,
    use: rubricUse,
  },
  "xs:int": {
    colspan: positiveInteger,
    rowspan: positiveInteger,
    "source-value": double,
    span: positiveInteger,
  },
  "xs:nonNegativeInteger": {
    "aria-colcount": integer,
    "aria-colindex": integer,
    "aria-colspan": integer,
    "aria-rowcount": integer,
    "aria-rowindex": integer,
    "aria-rowspan": integer,
    "data-choices-container-width": nonNegativeInteger,
    "expected-length": nonNegativeInteger,
    "expected-lines": nonNegativeInteger,
    height: collapsedLength,
    "max-strings": nonNegativeInteger,
    "min-strings": nonNegativeInteger,
    width: collapsedLength,
  },
  "xs:normalizedString": {
    field: normalizedNcName,
    lang: normalizedLanguage,
    srclang: normalizedLanguage,
    "tool-name": toolString,
    "tool-version": toolString,
  },
  "xs:string": {
    align: cellAlign,
    "aria-autocomplete": ariaAutocomplete,
    "aria-checked": tristate,
    "aria-current": ariaCurrent,
    "aria-expanded": trueFalseUndefined,
    "aria-invalid": ariaInvalid,
    "aria-live": ariaLive,
    "aria-orientation": orientation,
    "aria-pressed": tristate,
    "aria-selected": trueFalseUndefined,
    "aria-sort": ariaSort,
    autoplay: mediaAutoplay,
    "base-type": baseType,
    baseType,
    cardinality,
    controls: mediaControls,
    crossorigin: crossOrigin,
    data: uriString,
    "data-qti-suppress-tts": suppressTts,
    default: trackDefault,
    dir: textDirection,
    "external-scored": externalScored,
    format: textFormat,
    kind: trackKind,
    loop: mediaLoop,
    muted: mediaMuted,
    objectType: targetObjectType,
    orientation,
    preload: mediaPreload,
    role: ariaRole,
    "rounding-mode": roundingMode,
    scope: cellScope,
    shape,
    "show-hide": showHide,
    "tolerance-mode": toleranceMode,
    valign: cellValign,
    valuetype: paramValuetype,
  },
  "xs:token": { parse: xincludeParse },
} satisfies Readonly<Record<string, Readonly<Record<string, ValueDomain>>>>;

/**
 * The domain of an attribute on one kind, where QTI reads it there otherwise than everywhere else.
 * By kind, then attribute name.
 *
 * `bdo/@dir` and `h1/@role` port the checks `BdoDirNotAuto` and `AriaRoleH1` of
 * `schema/attributes.ts`: the kind's domain is the value set the check admits, so no law is left.
 */
const kindReadings = {
  bdo: { dir: bdoDirection },
  "cp:file": { href: packageHref },
  "cp:resource": { href: packageHref, type: resourceType },
  h1: { role: headingRole },
  "lom:string": { language: lomLanguage },
  "qti-area-map-entry": { coords: coordsAny },
  "qti-associable-hotspot": { coords: coordsAny },
  "qti-hotspot-choice": { coords: coordsAny },
  "qti-inline-choice-interaction": { "min-choices": nonNegativeInteger },
  "qti-math-constant": { name: mathConstant },
  "qti-math-operator": { name: mathOperator },
  "qti-media-interaction": { coords: coordsRect },
  "qti-printed-variable": { format: printfFormat },
  "qti-random-float": { max: floatOrVariable, min: floatOrVariable },
  "qti-stats-operator": { name: statsOperator },
  "qti-text-entry-interaction": { format: normalizedString },
} satisfies Readonly<Record<string, Readonly<Record<string, ValueDomain>>>>;

/**
 * Where today's rules require an attribute otherwise than the XSD's `use`, by kind and name.
 *
 * - `coords` on a hotspot choice, an associable hotspot and an area-map entry: the `default` shape
 *   has none, so its presence is a law of the shape (`shapeCapacities`, `schema/shapes.ts`).
 * - `param/@valuetype`: absent is `DATA`, HTML's default (`import/html.ts`).
 * - `bdo/@dir`: a `bdo` carries exactly one (`schema/attributes.ts`, the `bdo` capacity).
 */
const useReadings = {
  bdo: { dir: "required" },
  param: { valuetype: "optional" },
  "qti-area-map-entry": { coords: "optional" },
  "qti-associable-hotspot": { coords: "optional" },
  "qti-hotspot-choice": { coords: "optional" },
} satisfies Readonly<Record<string, Readonly<Record<string, Use>>>>;

/**
 * The attributes a vocabulary declares on a kind that no element of the kind may carry, by kind:
 * a `source` takes no `role` (`AriaRoleNotSource`, `schema/attributes.ts`).
 */
const refusals = { source: ["role"] } satisfies Readonly<Record<string, readonly string[]>>;

/**
 * Find the value a record holds under a key, none for a key it does not hold, its prototype's
 * included.
 *
 * @param record - The record.
 * @param key - The key.
 * @returns The value, or none.
 */
const at = <Value>(record: Readonly<Record<string, Value>>, key: string): Option.Option<Value> =>
  Object.hasOwn(record, key) ? Option.fromNullishOr(record[key]) : Option.none();

/**
 * Find the value a two-level record holds under two keys.
 *
 * @param record - The record, by first key, then second.
 * @param first - The first key.
 * @param second - The second key.
 * @returns The value, or none.
 */
const within = <Value>(
  record: Readonly<Record<string, Readonly<Record<string, Value>>>>,
  first: string,
  second: string,
): Option.Option<Value> => at(record, first).pipe(Option.flatMap((inner) => at(inner, second)));

/**
 * A declaration whose XSD type no reading maps to a value domain.
 */
export class UnreadType extends Schema.TaggedError<UnreadType>()("UnreadType", {
  kind: Schema.String,
  name: Schema.String,
  type: Schema.String,
}) {
  /**
   * The attribute, its type, and the repair.
   */
  override get message(): string {
    return `${this.kind} declares ${this.name} of type ${this.type}, which no value domain reads. Give ${this.type} a domain in the attribute grammar's type readings, or read ${this.name} under its type or its kind.`;
  }
}

/**
 * A declaration whose whitespace class differs from the class of the domain its type is read as.
 */
export class WhiteSpaceMismatch extends Schema.TaggedError<WhiteSpaceMismatch>()(
  "WhiteSpaceMismatch",
  {
    declared: Schema.String,
    domain: Schema.String,
    domainWhiteSpace: Schema.String,
    kind: Schema.String,
    name: Schema.String,
  },
) {
  /**
   * The attribute, both classes, and the repair.
   */
  override get message(): string {
    return `${this.kind} declares ${this.name} with whitespace class ${this.declared}, and the ${this.domain} domain it is read as applies ${this.domainWhiteSpace}. Read ${this.name} as a domain of class ${this.declared}.`;
  }
}

/**
 * The ways a composition of vocabularies has no attribute grammar.
 */
export type AttributeGrammarError = ClosedRelationError | UnreadType | WhiteSpaceMismatch;

/**
 * Read a kind's declaration of an attribute as its value domain: the kind's reading of it, else the
 * attribute's reading under its type, else its type's domain.
 *
 * @param kind - The kind's handle.
 * @param declared - The declaration.
 * @returns The domain, or why the declaration has none: no reading of its type, or a domain whose
 *   whitespace class is not the declared one.
 */
export const domainOf = (
  kind: string,
  declared: Declared,
): Result.Result<ValueDomain, UnreadType | WhiteSpaceMismatch> =>
  within<ValueDomain>(kindReadings, kind, declared.name).pipe(
    Option.orElse(() => within<ValueDomain>(nameReadings, declared.type, declared.name)),
    Option.orElse(() => at<ValueDomain>(typeReadings, declared.type)),
    Option.match({
      onNone: () => Result.fail(new UnreadType({ kind, name: declared.name, type: declared.type })),
      onSome: (domain) =>
        declared.whiteSpace === "union" || declared.whiteSpace === domain.whiteSpace
          ? Result.succeed(domain)
          : Result.fail(
              new WhiteSpaceMismatch({
                declared: declared.whiteSpace,
                domain: domain.handle,
                domainWhiteSpace: domain.whiteSpace,
                kind,
                name: declared.name,
              }),
            ),
    }),
  );

/**
 * One attribute an element may carry in one version: its kind, its name, its domain and whether it
 * is required.
 */
export interface Admitted {
  readonly domain: ValueDomain;
  readonly kind: string;
  readonly name: string;
  readonly use: Use;
  readonly version: string;
}

/**
 * List a kind's declarations in one version: its declarations with that version's revisions in
 * place of the ones they replace, then the revisions that add a name, with the refused names left
 * out.
 *
 * @param declarations - The kind's declarations as every version states them.
 * @param revisions - The vocabulary's revisions of this kind in this version.
 * @param refused - The names no element of the kind may carry.
 * @returns The declarations in force.
 */
const inForce = (
  declarations: readonly Declared[],
  revisions: readonly Declared[],
  refused: readonly string[],
): readonly Declared[] => {
  const revised = new Map(revisions.map((revision) => [revision.name, revision]));
  const kept = declarations.map((declared) => revised.get(declared.name) ?? declared);
  const added = revisions.filter(
    (revision) => !declarations.some((declared) => declared.name === revision.name),
  );

  return [...kept, ...added].filter((declared) => !refused.includes(declared.name));
};

/**
 * List the kinds a vocabulary declares attributes of, its revisions' kinds included, each once.
 *
 * @param vocabulary - The vocabulary.
 * @returns The kinds, its declared kinds first.
 */
const kindsOf = ({ attributes, revisions }: AttributeVocabulary): readonly string[] => [
  ...new Set([...Object.keys(attributes), ...revisions.map(({ kind }) => kind)]),
];

/**
 * List every attribute the vocabularies admit in each version, with its domain and whether today's
 * rules require it.
 *
 * @param versions - The schema versions.
 * @param vocabularies - The vocabularies.
 * @returns The admitted attributes, versions outermost, then vocabularies, kinds and declarations
 *   in their order; or the first revision of a version outside `versions`, or the first
 *   declaration that has no domain.
 */
export const admittedIn = (
  versions: readonly string[],
  vocabularies: readonly AttributeVocabulary[],
): Result.Result<readonly Admitted[], OutsideCodeSpace | UnreadType | WhiteSpaceMismatch> => {
  const stray = vocabularies
    .flatMap(({ revisions }) => revisions)
    .find((revision) => !versions.includes(revision.version));
  if (stray !== undefined) {
    return Result.fail(
      new OutsideCodeSpace({
        field: "version",
        relation: "AttributeAdmission",
        value: stray.version,
      }),
    );
  }

  return Result.all(
    versions.flatMap((version) =>
      vocabularies.flatMap((vocabulary) =>
        kindsOf(vocabulary).flatMap((kind) =>
          inForce(
            Option.getOrElse(at<readonly Declared[]>(vocabulary.attributes, kind), () => []),
            vocabulary.revisions.filter(
              (revision) => revision.kind === kind && revision.version === version,
            ),
            Option.getOrElse(at<readonly string[]>(refusals, kind), () => []),
          ).map((declared) =>
            Result.map(domainOf(kind, declared), (domain): Admitted => ({
              domain,
              kind,
              name: declared.name,
              use: Option.getOrElse(
                within<Use>(useReadings, kind, declared.name),
                () => declared.use,
              ),
              version,
            })),
          ),
        ),
      ),
    ),
  );
};

/**
 * The key of `AttributeAdmission` and `Required`: version, kind, then attribute name, each over its
 * roster.
 */
export type AttributeKey = readonly [
  Field<"version", string>,
  Field<"kind", string>,
  Field<"name", string>,
];

/**
 * The key of `Enumeration`: a domain and one of its lexical forms.
 */
export type EnumerationKey = readonly [Field<"domain", string>, Field<"value", string>];

/**
 * The closed relations of the attribute grammar.
 */
export interface AttributeGrammar {
  /**
   * `AttributeAdmission`: the value domain of each attribute an element of a kind may carry in a
   * version. Its cell is the `Admitted` domain of an attribute row's (version, kind, name, domain).
   */
  readonly admission: Closed<AttributeKey, readonly [Field<"domain", string>]>;
  /**
   * The `ValueDomain` roster, in code order: {@link valueDomains}.
   */
  readonly domains: readonly ValueDomain[];
  /**
   * `Enumeration`: the code of each lexical form of a coded domain, its position in the domain's
   * values.
   */
  readonly enumeration: Closed<EnumerationKey, readonly [Field<"code", number>]>;
  /**
   * `Required`: the attributes an element of a kind must carry in a version. A kind's row of it is
   * the set its nodes' `attrs` must contain.
   */
  readonly required: Closed<AttributeKey, readonly []>;
}

/**
 * The rosters the attribute grammar is keyed by, each in code order, and the vocabularies whose
 * declarations it reads.
 */
export interface AttributeGrammarInput {
  /**
   * The `NodeKind` roster.
   */
  readonly kinds: readonly string[];
  /**
   * The `AttributeName` roster, its open-name classes included.
   */
  readonly names: readonly string[];
  /**
   * The `SchemaVersion` roster.
   */
  readonly versions: readonly string[];
  readonly vocabularies: readonly AttributeVocabulary[];
}

/**
 * Generate the attribute grammar of a composition of vocabularies.
 *
 * @param input - The rosters and the vocabularies.
 * @returns `AttributeAdmission`, `Required` and `Enumeration`, with the `ValueDomain` roster; or
 *   the first declaration that has no domain, or the first relation that has no constant, as a
 *   kind or name outside its roster or a kind that declares a name twice.
 */
export const generate = (
  input: AttributeGrammarInput,
): Result.Result<AttributeGrammar, AttributeGrammarError> =>
  Result.gen(function* generateAttributes() {
    const admitted = yield* admittedIn(input.versions, input.vocabularies);
    const handles = valueDomains.map((domain) => domain.handle);
    const key: AttributeKey = [
      { name: "version", values: input.versions },
      { name: "kind", values: input.kinds },
      { name: "name", values: input.names },
    ];
    const admission = yield* closed({
      key,
      name: "AttributeAdmission",
      payload: [{ name: "domain", values: handles }] as const,
      rows: admitted.map(({ domain, kind, name, version }) => ({
        domain: domain.handle,
        kind,
        name,
        version,
      })),
    });
    const required = yield* closed({
      key,
      name: "Required",
      payload: [] as const,
      rows: admitted.flatMap(({ kind, name, use, version }) =>
        use === "required" ? [{ kind, name, version }] : [],
      ),
    });
    const codes = valueDomains.flatMap((domain) =>
      domain._tag === "coded"
        ? domain.values.map((value, code) => ({ code, domain: domain.handle, value }))
        : [],
    );
    const enumeration = yield* closed({
      key: [
        { name: "domain", values: handles },
        {
          name: "value",
          values: dictionary(
            codes.map(({ value }) => value),
            Order.String,
          ),
        },
      ] as const,
      name: "Enumeration",
      payload: [
        {
          name: "code",
          values: [...new Set(codes.map(({ code }) => code))].toSorted(Order.Number),
        },
      ] as const,
      rows: codes,
    });

    return { admission, domains: valueDomains, enumeration, required };
  });
