import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#pantry/schema/content/rosters.ts";
import { families } from "#pantry/schema/mathml/values.ts";

/**
 * A roster of this slice and the literal list of its handles in XSD order.
 */
const added: readonly (readonly [keyof typeof rosters.relations, readonly string[]])[] = [
  ["XsBoolean", ["true", "false", "1", "0"]],
  [
    "CpSchema",
    [
      "QTI Package",
      "QTI Test Bank",
      "QTI Item Bank",
      "QTI Object Bank",
      "QTI Test",
      "QTI Section",
      "QTI Item",
    ],
  ],
  [
    "QmdInteractionTypeValue",
    [
      "associateInteraction",
      "choiceInteraction",
      "customInteraction",
      "drawingInteraction",
      "endAttemptInteraction",
      "extendedTextInteraction",
      "gapMatchInteraction",
      "graphicAssociateInteraction",
      "graphicGapMatchInteraction",
      "graphicOrderInteraction",
      "hotspotInteraction",
      "hottextInteraction",
      "inlineChoiceInteraction",
      "matchInteraction",
      "mediaInteraction",
      "orderInteraction",
      "portableCustomInteraction",
      "positionObjectInteraction",
      "selectPointInteraction",
      "sliderInteraction",
      "textEntryInteraction",
      "uploadInteraction",
    ],
  ],
  ["QmdFeedbackTypeValue", ["adaptive", "nonadaptive", "none"]],
  ["QmdScoringModeValue", ["human", "externalmachine", "responseprocessing"]],
  ["BooleanLiteral", ["true", "false"]],
  ["ExternalScored", ["human", "externalMachine"]],
  ["ToleranceMode", ["absolute", "exact", "relative"]],
  ["RoundingMode", ["decimalPlaces", "significantFigures"]],
  [
    "MathOperatorName",
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
  ],
  ["StatsOperatorName", ["mean", "sampleVariance", "sampleSD", "popVariance", "popSD"]],
  ["MathConstantName", ["pi", "e"]],
  ["XIncludeParseValue", ["xml", "text"]],
  [
    "AriaRoleValue",
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
  ],
  ["AriaLiveValue", ["off", "polite", "assertive"]],
  ["AriaOrientationValue", ["vertical", "horizontal"]],
  ["AriaAutocompleteValue", ["inline", "list", "both", "none"]],
  ["AriaTristate", ["true", "false", "mixed", "undefined"]],
  ["AriaTrueFalseUndefined", ["true", "false", "undefined"]],
  ["AriaInvalidValue", ["true", "false", "grammar", "spelling"]],
  ["AriaSortValue", ["ascending", "descending", "none", "other"]],
  ["AriaCurrentValue", ["page", "step", "location", "date", "time", "true", "false", "undefined"]],
  ["TextDirection", ["ltr", "rtl", "auto"]],
  ["SuppressTtsMode", ["computer-read-aloud", "screen-reader", "all"]],
  ["ParamValuetype", ["DATA", "REF"]],
  ["CellScope", ["row", "col", "rowgroup", "colgroup"]],
  ["CellAlign", ["left", "center", "right", "justify", "char"]],
  ["CellValign", ["bottom", "middle", "top", "baseline"]],
  ["MediaPreload", ["none", "auto", "metadata"]],
  ["CrossOrigin", ["anonymous", "use-credentials"]],
  ["TrackKind", ["subtitles", "captions", "descriptions", "chapters", "metadata"]],
  ["TextFormat", ["plain", "preformatted", "xhtml"]],
  ["MediaAutoplay", ["true", "false", "1", "0", "autoplay"]],
  ["MediaLoop", ["true", "false", "1", "0", "loop"]],
  ["MediaMuted", ["true", "false", "1", "0", "muted"]],
  ["MediaControls", ["true", "false", "1", "0", "controls"]],
  ["TrackDefaultValue", ["true", "false", "1", "0", "default"]],
];

/**
 * The rosters this slice reuses, with the literal list each holds.
 */
const reused: readonly (readonly [keyof typeof rosters.relations, readonly string[]])[] = [
  ["Shape", ["circle", "default", "ellipse", "poly", "rect"]],
  ["ShowHide", ["show", "hide"]],
  ["Orientation", ["vertical", "horizontal"]],
  ["YesNo", ["yes", "no"]],
];

/**
 * The 25 MathML enumeration rosters and the literal list each holds, in XSD order (the REC's for
 * `closure`).
 */
const mathml: readonly (readonly [keyof typeof rosters.relations, readonly string[]])[] = [
  ["MathmlBooleanValue", ["true", "false"]],
  ["MathmlClosureValue", ["closed", "open", "open-closed", "closed-open"]],
  ["MathmlColumnalignstyleValue", ["left", "center", "right"]],
  ["MathmlDirValue", ["ltr", "rtl"]],
  ["MathmlDisplayValue", ["block", "inline"]],
  ["MathmlEdgeValue", ["left", "right"]],
  ["MathmlFontstyleValue", ["normal", "italic"]],
  ["MathmlFontweightValue", ["normal", "bold"]],
  ["MathmlFormValue", ["prefix", "infix", "postfix"]],
  ["MathmlGroupAlignmentValue", ["left", "center", "right", "decimalpoint"]],
  ["MathmlIndentalignValue", ["left", "center", "right", "auto", "id"]],
  ["MathmlIndentalignLineValue", ["left", "center", "right", "auto", "id", "indentalign"]],
  ["MathmlInfixlinebreakstyleValue", ["before", "after", "duplicate"]],
  ["MathmlLinebreakValue", ["auto", "newline", "nobreak", "goodbreak", "badbreak"]],
  ["MathmlLinebreakstyleValue", ["before", "after", "duplicate", "infixlinebreakstyle"]],
  ["MathmlLinestyleValue", ["none", "solid", "dashed"]],
  ["MathmlLocationValue", ["w", "nw", "n", "ne", "e", "se", "s", "sw"]],
  [
    "MathmlLongdivstyleValue",
    [
      "lefttop",
      "stackedrightright",
      "mediumstackedrightright",
      "shortstackedrightright",
      "righttop",
      "left/\\right",
      "left)(right",
      ":right=right",
      "stackedleftleft",
      "stackedleftlinetop",
    ],
  ],
  [
    "MathmlMathvariantValue",
    [
      "normal",
      "bold",
      "italic",
      "bold-italic",
      "double-struck",
      "bold-fraktur",
      "script",
      "bold-script",
      "fraktur",
      "sans-serif",
      "bold-sans-serif",
      "sans-serif-italic",
      "sans-serif-bold-italic",
      "monospace",
      "initial",
      "tailed",
      "looped",
      "stretched",
    ],
  ],
  [
    "MathmlMspaceLinebreakValue",
    ["auto", "newline", "nobreak", "goodbreak", "badbreak", "indentingnewline"],
  ],
  ["MathmlOccurrenceValue", ["prefix", "infix", "function-model"]],
  ["MathmlOrderValue", ["numeric", "lexicographic"]],
  ["MathmlOverflowValue", ["linebreak", "scroll", "elide", "truncate", "scale"]],
  ["MathmlSideValue", ["left", "right", "leftoverlap", "rightoverlap"]],
  ["MathmlVerticalalignValue", ["top", "bottom", "center", "baseline", "axis"]],
];

describe("content rosters", () => {
  it("adds 37 rosters", () => {
    assert.strictEqual(added.length, 37);
  });

  for (const [name, handles] of added) {
    it(`${name} holds its literal list in XSD order`, () => {
      assert.deepStrictEqual([...rosters.relations[name].handles], [...handles]);
    });
  }

  for (const [name, handles] of reused) {
    it(`${name} keeps its literal list`, () => {
      assert.deepStrictEqual([...rosters.relations[name].handles], [...handles]);
    });
  }

  it("adds 25 MathML enumeration rosters, one per roster family of values.ts", () => {
    const rosterFamilies = families.filter((family) => family.class === "roster");

    assert.strictEqual(mathml.length, 25);
    assert.deepStrictEqual(
      mathml.map(([name]) => name),
      rosterFamilies.map((family) => family.valueType),
    );
  });

  for (const [name, handles] of mathml) {
    it(`${name} holds its literal list in XSD order and is a schema member`, () => {
      assert.deepStrictEqual([...rosters.relations[name].handles], [...handles]);
      assert.strictEqual(rosters.relations[name].name, name);
    });
  }

  it("MathmlValueType holds the 67 family handles of values.ts in order", () => {
    assert.strictEqual(rosters.MathmlValueType.handles.length, 67);
    assert.deepStrictEqual(
      [...rosters.MathmlValueType.handles],
      families.map((family) => family.handle),
    );
    assert.strictEqual(rosters.relations.MathmlValueType, rosters.MathmlValueType);
  });
});
