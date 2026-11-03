import { assert, describe, it } from "@effect/vitest";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * The regex source of every F pattern the rosters below replace.
 */
const sources = {
  align: patterns.align,
  ariaAutocomplete: patterns.ariaAutocomplete,
  ariaChecked: patterns.ariaChecked,
  ariaCurrent: patterns.ariaCurrent,
  ariaExpanded: patterns.ariaExpanded,
  ariaInvalid: patterns.ariaInvalid,
  ariaLive: patterns.ariaLive,
  ariaOrientation: patterns.ariaOrientation,
  ariaPressed: patterns.ariaPressed,
  ariaRole: patterns.ariaRole,
  ariaSelected: patterns.ariaSelected,
  ariaSort: patterns.ariaSort,
  autoplayEnum: patterns.autoplayEnum,
  booleanLiteral: patterns.booleanLiteral,
  controlsEnum: patterns.controlsEnum,
  cpSchema: patterns.cpSchema,
  crossorigin: patterns.crossorigin,
  defaultEnum: patterns.defaultEnum,
  dirEnum: patterns.dirEnum,
  externalScored: patterns.externalScored,
  loopEnum: patterns.loopEnum,
  mathConstantName: patterns.mathConstantName,
  mathOperatorName: patterns.mathOperatorName,
  mutedEnum: patterns.mutedEnum,
  preload: patterns.preload,
  qmdFeedbackType: patterns.qmdFeedbackType,
  qmdInteractionType: patterns.qmdInteractionType,
  qmdScoringMode: patterns.qmdScoringMode,
  roundingMode: patterns.roundingMode,
  scope: patterns.scope,
  statsOperatorName: patterns.statsOperatorName,
  suppressTts: patterns.suppressTts,
  textFormat: patterns.textFormat,
  toleranceMode: patterns.toleranceMode,
  trackKind: patterns.trackKind,
  valign: patterns.valign,
  valuetype: patterns.valuetype,
  xincludeParse: patterns.xincludeParse,
  xsBoolean: patterns.xsBoolean,
};

/**
 * A roster of this slice, the literal list of its handles in XSD order, and the F patterns that
 * admit the same spellings: a media flag is the union of its enumeration and `xsBoolean`.
 */
const added: readonly (readonly [
  keyof typeof rosters.relations,
  readonly string[],
  readonly (keyof typeof sources)[],
])[] = [
  ["XsBoolean", ["true", "false", "1", "0"], ["xsBoolean"]],
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
    ["cpSchema"],
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
    ["qmdInteractionType"],
  ],
  ["QmdFeedbackTypeValue", ["adaptive", "nonadaptive", "none"], ["qmdFeedbackType"]],
  ["QmdScoringModeValue", ["human", "externalmachine", "responseprocessing"], ["qmdScoringMode"]],
  ["BooleanLiteral", ["true", "false"], ["booleanLiteral"]],
  ["ExternalScored", ["human", "externalMachine"], ["externalScored"]],
  ["ToleranceMode", ["absolute", "exact", "relative"], ["toleranceMode"]],
  ["RoundingMode", ["decimalPlaces", "significantFigures"], ["roundingMode"]],
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
    ["mathOperatorName"],
  ],
  [
    "StatsOperatorName",
    ["mean", "sampleVariance", "sampleSD", "popVariance", "popSD"],
    ["statsOperatorName"],
  ],
  ["MathConstantName", ["pi", "e"], ["mathConstantName"]],
  ["XIncludeParseValue", ["xml", "text"], ["xincludeParse"]],
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
    ["ariaRole"],
  ],
  ["AriaLiveValue", ["off", "polite", "assertive"], ["ariaLive"]],
  ["AriaOrientationValue", ["vertical", "horizontal"], ["ariaOrientation"]],
  ["AriaAutocompleteValue", ["inline", "list", "both", "none"], ["ariaAutocomplete"]],
  ["AriaTristate", ["true", "false", "mixed", "undefined"], ["ariaChecked", "ariaPressed"]],
  ["AriaTrueFalseUndefined", ["true", "false", "undefined"], ["ariaExpanded", "ariaSelected"]],
  ["AriaInvalidValue", ["true", "false", "grammar", "spelling"], ["ariaInvalid"]],
  ["AriaSortValue", ["ascending", "descending", "none", "other"], ["ariaSort"]],
  [
    "AriaCurrentValue",
    ["page", "step", "location", "date", "time", "true", "false", "undefined"],
    ["ariaCurrent"],
  ],
  ["TextDirection", ["ltr", "rtl", "auto"], ["dirEnum"]],
  ["SuppressTtsMode", ["computer-read-aloud", "screen-reader", "all"], ["suppressTts"]],
  ["ParamValuetype", ["DATA", "REF"], ["valuetype"]],
  ["CellScope", ["row", "col", "rowgroup", "colgroup"], ["scope"]],
  ["CellAlign", ["left", "center", "right", "justify", "char"], ["align"]],
  ["CellValign", ["bottom", "middle", "top", "baseline"], ["valign"]],
  ["MediaPreload", ["none", "auto", "metadata"], ["preload"]],
  ["CrossOrigin", ["anonymous", "use-credentials"], ["crossorigin"]],
  ["TrackKind", ["subtitles", "captions", "descriptions", "chapters", "metadata"], ["trackKind"]],
  ["TextFormat", ["plain", "preformatted", "xhtml"], ["textFormat"]],
  ["MediaAutoplay", ["true", "false", "1", "0", "autoplay"], ["autoplayEnum", "xsBoolean"]],
  ["MediaLoop", ["true", "false", "1", "0", "loop"], ["loopEnum", "xsBoolean"]],
  ["MediaMuted", ["true", "false", "1", "0", "muted"], ["mutedEnum", "xsBoolean"]],
  ["MediaControls", ["true", "false", "1", "0", "controls"], ["controlsEnum", "xsBoolean"]],
  ["TrackDefaultValue", ["true", "false", "1", "0", "default"], ["defaultEnum", "xsBoolean"]],
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
 * The spellings one handle must not admit: a case change, a padded member and the empty string.
 */
const nearMisses = (handle: string): readonly string[] => {
  const swapped = handle === handle.toLowerCase() ? handle.toUpperCase() : handle.toLowerCase();

  return [...(swapped === handle ? [] : [swapped]), ` ${handle}`, `${handle} `, ""];
};

/**
 * Whether any of the named patterns admits the text whole.
 */
const admits = (names: readonly (keyof typeof sources)[], text: string): boolean =>
  names.some((name) => new RegExp(sources[name], "u").test(text));

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

  for (const [name, handles, patternNames] of added) {
    it(`${name} pattern admits exactly its handles`, () => {
      for (const handle of handles) {
        assert.isTrue(admits(patternNames, handle), handle);
        for (const miss of nearMisses(handle)) {
          assert.isFalse(admits(patternNames, miss), JSON.stringify(miss));
        }
      }
    });
  }
});
