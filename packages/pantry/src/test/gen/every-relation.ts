/**
 * The every-relation package (plan W5, Q5.20; the operator's ruling of 2026-11-05 on issue #3): a
 * generator of QTI 3.0 content packages, each valid by construction, whose import writes a row of
 * every stored relation of `Qti` in its one ChangeSet.
 *
 * A package is drawn from its {@link MemberCounts}, the counts of the members its laws count
 * (an interaction's choices, a hottext interaction's hottexts, a hotspot interaction's hotspots),
 * and built by {@link everyRelationPackage} as a keyed set of entries by path. Each document holds
 * the content that writes the overlays of its kind, each written the way its laws admit:
 *
 * - **the manifest** lists every entry once, with a LOM record whose identifier and title are its
 *   document's for each item and the test, dependencies, a qtiMetadata record, a language string,
 *   and a learning resource type of the LOM vocabulary whose value, `exercise`, reading 122
 *   allows;
 * - **the item** declares a context variable, mapped responses of an identifier and of each base type
 *   whose map keys have typed values (integer, float, point, pair and directed pair), an area
 *   mapping, outcomes with a normal range, a match table, an interpolation table and a record
 *   default, and templates; it holds a stimulus ref, an identity-typed text whose IDREF names an ID
 *   of its body, a body with a label (its root naming its tool), an open `data-*` attribute, an
 *   ARIA range and an IDREFS, an SSML fragment with a mark, a table whose cell's `headers` names
 *   its header, a printed variable whose base names a variable, a `q` with no quotation mark beside
 *   or inside it, template and feedback content, choice, hottext, hotspot, slider, custom (holding
 *   a foreign element) and portable custom interactions, and response processing that holds a
 *   `qti-equal-rounded`, a `qti-round-to` and a `qti-equal` with a `tolerance`;
 * - **a second item** whose response processing is a published template, which the test places three
 *   times;
 * - **a third item** whose response processing includes a rule fragment, and whose custom interaction
 *   holds a text a bounded `xsi:type` types;
 * - **the stimulus** has a doctype, a processing instruction, a comment, an `xml:base` and an
 *   unexpanded entity reference in an attribute, and no reference the base would govern;
 * - **the test** has a linear part, a branch rule, a variable mapping, a template default, a
 *   selection and an ordering, a section ref placing the section document, and outcome processing
 *   that reads an item's variable by its item ref and a section by its identifier;
 * - **the section document** holds a printed variable whose index names a test variable, a feedback
 *   element, and a precondition, each resolved under its placement;
 * - **the usage data** holds a dated statistic with a typed value;
 * - **an image**, which two elements of the item reference.
 *
 * A {@link Bulk} adds identical binary entries, listed by a web content resource, so the package
 * passes one statement's transport bounds (`#pantry/import/package.large.db.test.ts`).
 */
import { int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { Effect, FileSystem, Path } from "effect";
import type { PlatformError, Scope } from "effect";

/**
 * The counts an every-relation package is drawn by, each a count some law of its interactions
 * reads.
 */
export interface MemberCounts {
  /**
   * The choice interaction's simple choices, 2 or 3: two are mapped, and the interaction takes at
   * most one.
   */
  readonly choices: number;
  /**
   * The hotspot interaction's hotspot choices, 1 or 2: a rectangle, then a circle.
   */
  readonly hotspots: number;
  /**
   * The hottext interaction's hottexts, 1 or 2.
   */
  readonly hottexts: number;
}

/**
 * The member counts the generator draws: every combination of {@link MemberCounts}'s counts, eight
 * in all, so one exhaustion covers the space.
 */
export const memberCounts: Gen<MemberCounts> = (source) => ({
  choices: source.draw(int(2, 3)),
  hotspots: source.draw(int(1, 2)),
  hottexts: source.draw(int(1, 2)),
});

/**
 * Identical binary entries a package carries beside its documents: `entries` files under `bulk/`,
 * each holding `bytes`, the one array every entry shares.
 */
export interface Bulk {
  readonly bytes: Uint8Array;
  readonly entries: number;
}

/**
 * A package as its entries: a keyed set from each entry's path, `/`-separated below the package's
 * root, to its bytes.
 */
export type PackageEntries = ReadonlyMap<string, Uint8Array>;

/**
 * The path of a package's manifest.
 */
const manifestPath = "imsmanifest.xml";

/**
 * The XML declaration every generated document opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The paths of the package's documents and image, as the manifest lists them and the documents'
 * hrefs name them.
 */
const paths = {
  fragment: "items/fragment.xml",
  image: "items/media/pic.png",
  item: "items/item.xml",
  ruled: "items/item3.xml",
  rules: "items/rules.xml",
  section: "section.xml",
  stimulus: "items/stimulus.xml",
  templated: "items/item2.xml",
  test: "test.xml",
  usage: "usage.xml",
} as const;

/**
 * A one-pixel transparent PNG, the image the item's body and hotspot interaction show: its
 * signature, IHDR, one IDAT row and IEND, each chunk with its CRC (PNG §5).
 *
 * @see {@link https://www.w3.org/TR/png-3/#5DataRep | PNG (Third Edition), §5 Datastream structure}
 */
const pixel = Uint8Array.fromBase64(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
);

/**
 * The identifiers of the choice interaction's choices, in order: the first two are the ones its
 * response's correct value and mapping name.
 */
const choiceIds = ["ChoiceA", "ChoiceB", "ChoiceC"] as const;

/**
 * Write the item: one of every construct an item's overlays describe (see the module comment).
 *
 * @param members - The counts it is drawn by.
 * @returns Its text.
 */
const itemOf = (members: MemberCounts): string =>
  [
    declaration,
    "<!-- The every-relation item. -->",
    `<qti-assessment-item xmlns="${asi}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:ssml="http://www.w3.org/2001/10/synthesis" identifier="item1" title="Every relation" adaptive="false" time-dependent="false" xml:lang="en" tool-name="every-relation" tool-version="1">`,
    '  <qti-context-declaration identifier="CTX" cardinality="single" base-type="integer">',
    "    <qti-default-value><qti-value>1</qti-value></qti-default-value>",
    "  </qti-context-declaration>",
    '  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    "    <qti-correct-response><qti-value>ChoiceA</qti-value></qti-correct-response>",
    '    <qti-mapping default-value="0">',
    '      <qti-map-entry map-key="ChoiceA" mapped-value="2"/>',
    '      <qti-map-entry map-key="ChoiceB" mapped-value="1"/>',
    "    </qti-mapping>",
    "  </qti-response-declaration>",
    '  <qti-response-declaration identifier="HOT" cardinality="single" base-type="identifier"/>',
    '  <qti-response-declaration identifier="AREA" cardinality="single" base-type="identifier"/>',
    '  <qti-response-declaration identifier="LEVER" cardinality="single" base-type="integer">',
    '    <qti-mapping default-value="0"><qti-map-entry map-key="3" mapped-value="1"/></qti-mapping>',
    "  </qti-response-declaration>",
    '  <qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/>',
    '  <qti-response-declaration identifier="PORTABLE" cardinality="single" base-type="string"/>',
    '  <qti-response-declaration identifier="REAL" cardinality="single" base-type="float">',
    '    <qti-mapping default-value="0"><qti-map-entry map-key="2.5" mapped-value="1"/></qti-mapping>',
    "  </qti-response-declaration>",
    '  <qti-response-declaration identifier="PAIRS" cardinality="multiple" base-type="pair">',
    '    <qti-mapping default-value="0"><qti-map-entry map-key="A B" mapped-value="1"/></qti-mapping>',
    "  </qti-response-declaration>",
    '  <qti-response-declaration identifier="LINKS" cardinality="multiple" base-type="directedPair">',
    '    <qti-mapping default-value="0"><qti-map-entry map-key="A B" mapped-value="1"/></qti-mapping>',
    "  </qti-response-declaration>",
    '  <qti-response-declaration identifier="SPOT" cardinality="single" base-type="point">',
    '    <qti-mapping default-value="0"><qti-map-entry map-key="10 20" mapped-value="1"/></qti-mapping>',
    '    <qti-area-mapping default-value="0">',
    '      <qti-area-map-entry shape="rect" coords="0,0,10,10" mapped-value="1"/>',
    "    </qti-area-mapping>",
    "  </qti-response-declaration>",
    '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="10" normal-minimum="0" mastery-value="5">',
    "    <qti-default-value><qti-value>0</qti-value></qti-default-value>",
    "  </qti-outcome-declaration>",
    '  <qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer">',
    "    <qti-default-value><qti-value>0</qti-value></qti-default-value>",
    "  </qti-outcome-declaration>",
    '  <qti-outcome-declaration identifier="LEVEL" cardinality="single" base-type="string">',
    '    <qti-match-table default-value="none">',
    '      <qti-match-table-entry source-value="1" target-value="low"/>',
    '      <qti-match-table-entry source-value="2" target-value="high"/>',
    "    </qti-match-table>",
    "  </qti-outcome-declaration>",
    '  <qti-outcome-declaration identifier="GRADE" cardinality="single" base-type="float">',
    '    <qti-interpolation-table default-value="0">',
    '      <qti-interpolation-table-entry source-value="0" target-value="0"/>',
    '      <qti-interpolation-table-entry source-value="2.5" target-value="1" include-boundary="false"/>',
    "    </qti-interpolation-table>",
    "  </qti-outcome-declaration>",
    '  <qti-outcome-declaration identifier="SUMMARY" cardinality="record">',
    "    <qti-default-value>",
    '      <qti-value field-identifier="attempts" base-type="integer">1</qti-value>',
    '      <qti-value field-identifier="note" base-type="string">none</qti-value>',
    "    </qti-default-value>",
    "  </qti-outcome-declaration>",
    '  <qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>',
    '  <qti-outcome-declaration identifier="DIGITS" cardinality="single" base-type="integer">',
    "    <qti-default-value><qti-value>10</qti-value></qti-default-value>",
    "  </qti-outcome-declaration>",
    '  <qti-template-declaration identifier="SHOWN" cardinality="single" base-type="identifier"/>',
    '  <qti-template-declaration identifier="N" cardinality="single" base-type="integer"/>',
    "  <qti-template-processing>",
    '    <qti-set-template-value identifier="N"><qti-random-integer min="5" max="10"/></qti-set-template-value>',
    '    <qti-set-template-value identifier="SHOWN"><qti-base-value base-type="identifier">yes</qti-base-value></qti-set-template-value>',
    "  </qti-template-processing>",
    '  <qti-assessment-stimulus-ref identifier="stimulus1" href="stimulus.xml"/>',
    "  <qti-companion-materials-info>",
    "    <qti-calculator>",
    "      <qti-calculator-type>basic</qti-calculator-type>",
    '      <qti-description xsi:type="xs:IDREF">lead</qti-description>',
    "    </qti-calculator>",
    "  </qti-companion-materials-info>",
    "  <qti-item-body>",
    '    <div id="lead" label="lead" data-every="relation" aria-labelledby="caption" aria-valuemin="0" aria-valuemax="10">',
    '      <span id="caption">Look at the picture.</span>',
    '      <img src="media/pic.png" alt="A picture"/>',
    "    </div>",
    '    <p><ssml:speak version="1.1" xml:lang="en"><ssml:mark name="start"/>Read this aloud.</ssml:speak></p>',
    '    <table><tbody><tr><th id="row-head">Row</th><td headers="row-head">Cell</td></tr></tbody></table>',
    '    <p>N is <qti-printed-variable identifier="N" base="DIGITS"/>, and <qti-template-inline template-identifier="SHOWN" identifier="yes" show-hide="show">this shows</qti-template-inline>.</p>',
    "    <p>It says <q>read this</q> and stops.</p>",
    '    <p><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="RIGHT" show-hide="show">Right.</qti-feedback-inline></p>',
    '    <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1" min-choices="0">',
    "      <qti-prompt>Which one?</qti-prompt>",
    ...choiceIds
      .slice(0, members.choices)
      .map((id) => `      <qti-simple-choice identifier="${id}">Choice ${id}.</qti-simple-choice>`),
    "    </qti-choice-interaction>",
    '    <qti-hottext-interaction response-identifier="HOT" max-choices="1">',
    `      <p>Pick ${Array.from(
      { length: members.hottexts },
      (_, at) =>
        `<qti-hottext identifier="H${String(at + 1)}">word ${String(at + 1)}</qti-hottext>`,
    ).join(" or ")}.</p>`,
    "    </qti-hottext-interaction>",
    '    <qti-hotspot-interaction response-identifier="AREA" max-choices="1">',
    '      <img src="media/pic.png" alt="A picture" width="20" height="20"/>',
    ...[
      '      <qti-hotspot-choice identifier="S1" shape="rect" coords="0,0,10,10"/>',
      '      <qti-hotspot-choice identifier="S2" shape="circle" coords="15,15,4"/>',
    ].slice(0, members.hotspots),
    "    </qti-hotspot-interaction>",
    '    <qti-slider-interaction response-identifier="LEVER" lower-bound="0" upper-bound="10" step="1"/>',
    '    <qti-custom-interaction response-identifier="WIDGET">',
    '      <w:widget xmlns:w="urn:example:widget">A widget.</w:widget>',
    "    </qti-custom-interaction>",
    '    <qti-portable-custom-interaction response-identifier="PORTABLE" custom-interaction-type-identifier="urn:example:portable" module="portable">',
    "      <qti-interaction-markup><div>A portable interaction.</div></qti-interaction-markup>",
    '      <qti-context-variable identifier="CTX"/>',
    "    </qti-portable-custom-interaction>",
    "  </qti-item-body>",
    "  <qti-response-processing>",
    '    <qti-set-outcome-value identifier="SCORE">',
    "      <qti-sum>",
    '        <qti-map-response identifier="RESPONSE"/>',
    '        <qti-map-response-point identifier="SPOT"/>',
    "      </qti-sum>",
    "    </qti-set-outcome-value>",
    '    <qti-set-outcome-value identifier="COUNT">',
    '      <qti-round><qti-variable identifier="SCORE"/></qti-round>',
    "    </qti-set-outcome-value>",
    "    <qti-response-condition>",
    "      <qti-response-if>",
    "        <qti-and>",
    '          <qti-equal-rounded rounding-mode="decimalPlaces" figures="2">',
    '            <qti-variable identifier="SCORE"/>',
    '            <qti-base-value base-type="float">1.5</qti-base-value>',
    "          </qti-equal-rounded>",
    '          <qti-equal tolerance-mode="absolute" tolerance="0.5 1">',
    '            <qti-variable identifier="SCORE"/>',
    '            <qti-base-value base-type="float">1.5</qti-base-value>',
    "          </qti-equal>",
    "        </qti-and>",
    '        <qti-set-outcome-value identifier="SCORE">',
    '          <qti-round-to rounding-mode="significantFigures" figures="3">',
    '            <qti-variable identifier="SCORE"/>',
    "          </qti-round-to>",
    "        </qti-set-outcome-value>",
    "      </qti-response-if>",
    "    </qti-response-condition>",
    '    <qti-lookup-outcome-value identifier="LEVEL"><qti-variable identifier="COUNT"/></qti-lookup-outcome-value>',
    '    <qti-lookup-outcome-value identifier="GRADE"><qti-variable identifier="SCORE"/></qti-lookup-outcome-value>',
    "    <qti-response-condition>",
    "      <qti-response-if>",
    "        <qti-match>",
    '          <qti-variable identifier="RESPONSE"/>',
    '          <qti-correct identifier="RESPONSE"/>',
    "        </qti-match>",
    '        <qti-set-outcome-value identifier="FEEDBACK">',
    '          <qti-base-value base-type="identifier">RIGHT</qti-base-value>',
    "        </qti-set-outcome-value>",
    "      </qti-response-if>",
    "    </qti-response-condition>",
    "  </qti-response-processing>",
    "</qti-assessment-item>",
    "",
  ].join("\n");

/**
 * The second item: one choice interaction, scored by the published match-correct template, and an
 * included fragment (spec reading 117) whose text entry binds the item's `TEXT`, whose hottext
 * interaction binds its `WORD`, whose portable custom interaction binds its `WIDGET2` and reads its
 * context variable `CTX2`, and whose template inline names its template variable `SHOWN`.
 */
const templatedItem = [
  declaration,
  `<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="item2" title="Templated" adaptive="false" time-dependent="false">`,
  '  <qti-context-declaration identifier="CTX2" cardinality="single" base-type="integer"/>',
  '  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  "    <qti-correct-response><qti-value>ChoiceA</qti-value></qti-correct-response>",
  "  </qti-response-declaration>",
  '  <qti-response-declaration identifier="TEXT" cardinality="single" base-type="string"/>',
  '  <qti-response-declaration identifier="WORD" cardinality="single" base-type="identifier"/>',
  '  <qti-response-declaration identifier="WIDGET2" cardinality="single" base-type="string"/>',
  '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
  "    <qti-default-value><qti-value>0</qti-value></qti-default-value>",
  "  </qti-outcome-declaration>",
  '  <qti-template-declaration identifier="SHOWN" cardinality="single" base-type="identifier"/>',
  "  <qti-item-body>",
  '    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
  '      <qti-simple-choice identifier="ChoiceA">Yes.</qti-simple-choice>',
  '      <qti-simple-choice identifier="ChoiceB">No.</qti-simple-choice>',
  "    </qti-choice-interaction>",
  '    <xi:include href="fragment.xml"/>',
  "  </qti-item-body>",
  '  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
  "</qti-assessment-item>",
  "",
].join("\n");

/**
 * The fragment the second item includes (spec readings 114 and 117): a division holding an ID, a
 * text entry, whose `response-identifier`, an IDREF (reading 14), names the item's `TEXT`, a
 * hottext interaction naming its `WORD`, whose hottext counts among the item's assembly's, a
 * portable custom interaction naming its `WIDGET2` and its context variable `CTX2`, and a template
 * inline naming its template variable `SHOWN`, each resolved among the item's declarations; its
 * `xml:lang`, which the item's record lists (R26 in place).
 */
const fragment = [
  declaration,
  `<div xmlns="${asi}" xml:lang="en">`,
  '  <p id="fragment-note">Type the word.</p>',
  '  <qti-text-entry-interaction response-identifier="TEXT"/>',
  '  <qti-hottext-interaction response-identifier="WORD" max-choices="1">',
  '    <p>Pick <qti-hottext identifier="W1">this</qti-hottext>.</p>',
  "  </qti-hottext-interaction>",
  '  <qti-portable-custom-interaction response-identifier="WIDGET2" custom-interaction-type-identifier="urn:example:portable" module="portable">',
  "    <qti-interaction-markup><div>A placed portable interaction.</div></qti-interaction-markup>",
  '    <qti-context-variable identifier="CTX2"/>',
  "  </qti-portable-custom-interaction>",
  '  <p><qti-template-inline template-identifier="SHOWN" identifier="yes" show-hide="show">Shown.</qti-template-inline></p>',
  "</div>",
  "",
].join("\n");

/**
 * The third item: a score and response processing that includes a response rule fragment (spec
 * reading 117), whose references name the item's `SCORE` and its built-in `numAttempts`; and a
 * custom interaction holding a foreign element whose text an `xsi:type` gives
 * `NonNegativeDoubleDType`, a bounded double (spec reading 144). It is here, not in the first
 * item's custom interaction, whose one foreign element the oracle's mutations draw.
 */
const ruledItem = [
  declaration,
  `<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:qti="${asi}" identifier="item3" title="Ruled" adaptive="false" time-dependent="false">`,
  '  <qti-response-declaration identifier="SIZE" cardinality="single" base-type="string"/>',
  '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  "  <qti-item-body>",
  "    <p>Scored by its included rule.</p>",
  '    <qti-custom-interaction response-identifier="SIZE">',
  '      <w:size xmlns:w="urn:example:widget" xsi:type="qti:NonNegativeDoubleDType">2.5</w:size>',
  "    </qti-custom-interaction>",
  "  </qti-item-body>",
  '  <qti-response-processing><xi:include href="rules.xml"/></qti-response-processing>',
  "</qti-assessment-item>",
  "",
].join("\n");

/**
 * The response rule fragment the third item includes: a condition that reads the built-in
 * `numAttempts` and sets the item's `SCORE`, each resolved in the item's declarations in place.
 */
const rules = [
  declaration,
  `<qti-response-condition xmlns="${asi}">`,
  "  <qti-response-if>",
  "    <qti-gte>",
  '      <qti-variable identifier="numAttempts"/>',
  '      <qti-base-value base-type="integer">1</qti-base-value>',
  "    </qti-gte>",
  '    <qti-set-outcome-value identifier="SCORE">',
  '      <qti-base-value base-type="float">1</qti-base-value>',
  "    </qti-set-outcome-value>",
  "  </qti-response-if>",
  "</qti-response-condition>",
  "",
].join("\n");

/**
 * The stimulus: a doctype naming an external subset the package does not hold, so the entity
 * reference its attribute writes stays unexpanded (XML 1.0 §4.1, WFC: Entity Declared, which binds
 * only a document without an external subset); a processing instruction and a comment before its
 * root; and an `xml:base`, in a document that makes no reference the base would govern.
 *
 * @see {@link https://www.w3.org/TR/xml/#wf-entdeclared | XML 1.0, §4.1 WFC: Entity Declared}
 */
const stimulus = [
  declaration,
  '<!DOCTYPE qti-assessment-stimulus SYSTEM "stimulus.dtd">',
  "<!-- The every-relation stimulus. -->",
  "<?every-relation stimulus?>",
  `<qti-assessment-stimulus xmlns="${asi}" identifier="stimulus1" title="A stimulus">`,
  "  <qti-stimulus-body>",
  '    <div xml:base="passages/" aria-label="Passage &passage;">A passage to read.</div>',
  "  </qti-stimulus-body>",
  "</qti-assessment-stimulus>",
  "",
].join("\n");

/**
 * The section document the test places: a rubric whose printed variable's index names the test's
 * `PLACE` and whose feedback names its `VERDICT`, and an item ref whose precondition reads its
 * `TOTAL`, each resolved against the test that places it (spec reading 5).
 */
const section = [
  declaration,
  `<qti-assessment-section xmlns="${asi}" identifier="placed" title="A placed section" visible="true">`,
  '  <qti-rubric-block use="instructions" view="candidate">',
  "    <qti-content-body>",
  '      <div><qti-printed-variable identifier="TOTAL" index="PLACE"/> <qti-feedback-inline outcome-identifier="VERDICT" identifier="true" show-hide="show">Passed.</qti-feedback-inline></div>',
  "    </qti-content-body>",
  "  </qti-rubric-block>",
  `  <qti-assessment-item-ref identifier="placedItem" href="${paths.templated}">`,
  "    <qti-pre-condition>",
  "      <qti-gte>",
  '        <qti-variable identifier="TOTAL"/>',
  '        <qti-base-value base-type="float">0</qti-base-value>',
  "      </qti-gte>",
  "    </qti-pre-condition>",
  "  </qti-assessment-item-ref>",
  "</qti-assessment-section>",
  "",
].join("\n");

/**
 * The test: one linear part of two sections, the first shuffling its item refs and holding a
 * branch rule forward to a sibling item ref, one back from that sibling, which the shuffle orders
 * (reading 87's `BranchShuffle`), a variable mapping and a template default, the second selecting
 * one of an item ref and the section document's placement; and outcome processing that reads
 * `ref1.SCORE` and the first section's item scores.
 */
const test = [
  declaration,
  `<qti-assessment-test xmlns="${asi}" identifier="test1" title="Every relation test">`,
  '  <qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float">',
  "    <qti-default-value><qti-value>0</qti-value></qti-default-value>",
  "  </qti-outcome-declaration>",
  '  <qti-outcome-declaration identifier="PLACE" cardinality="single" base-type="integer">',
  "    <qti-default-value><qti-value>1</qti-value></qti-default-value>",
  "  </qti-outcome-declaration>",
  // An identifier outcome, which the section's feedback names (Feedback outcome type); PASSED
  // would have to be a boolean (§2.2.2.3, "PASSED MUST be a boolean", law "Reserved type").
  '  <qti-outcome-declaration identifier="VERDICT" cardinality="single" base-type="identifier"/>',
  '  <qti-test-part identifier="part1" navigation-mode="linear" submission-mode="individual">',
  '    <qti-assessment-section identifier="first" title="First" visible="true">',
  '      <qti-ordering shuffle="true"/>',
  `      <qti-assessment-item-ref identifier="ref1" href="${paths.item}">`,
  '        <qti-branch-rule target="ref2"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule>',
  '        <qti-variable-mapping source-identifier="SCORE" target-identifier="ITEMSCORE"/>',
  '        <qti-template-default template-identifier="N"><qti-base-value base-type="integer">7</qti-base-value></qti-template-default>',
  "      </qti-assessment-item-ref>",
  `      <qti-assessment-item-ref identifier="ref2" href="${paths.templated}">`,
  '        <qti-branch-rule target="ref1"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule>',
  "      </qti-assessment-item-ref>",
  "    </qti-assessment-section>",
  '    <qti-assessment-section identifier="second" title="Second" visible="true">',
  '      <qti-selection select="1"/>',
  '      <qti-ordering shuffle="false"/>',
  `      <qti-assessment-item-ref identifier="ref3" href="${paths.templated}"/>`,
  `      <qti-assessment-section-ref identifier="placement" href="${paths.section}"/>`,
  "    </qti-assessment-section>",
  "  </qti-test-part>",
  "  <qti-outcome-processing>",
  '    <qti-set-outcome-value identifier="TOTAL">',
  "      <qti-sum>",
  '        <qti-variable identifier="ref1.SCORE"/>',
  '        <qti-test-variables variable-identifier="SCORE" base-type="float" section-identifier="first"/>',
  "      </qti-sum>",
  "    </qti-set-outcome-value>",
  "  </qti-outcome-processing>",
  "</qti-assessment-test>",
  "",
].join("\n");

/**
 * The usage data: one ordinary statistic of the item, dated, with a typed value.
 */
const usage = [
  declaration,
  '<usageData xmlns="http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0">',
  '  <ordinaryStatistic name="P-value" context="http://example.org/contexts/every-relation" caseCount="10" stdError="0.01" lastUpdated="2026-11-06">',
  '    <targetObject identifier="item1"/>',
  '    <value baseType="float">0.5</value>',
  "  </ordinaryStatistic>",
  "</usageData>",
  "",
].join("\n");

/**
 * Write a resource's LOM record: a general category naming the document's identifier and title, as
 * the record's identifier and title laws compare them, with its language where it lists one.
 *
 * @param record - What the category says.
 * @param record.identifier - The document's identifier.
 * @param record.language - The language the category lists, none for none.
 * @param record.title - The document's title.
 * @returns The `imsmd:lom` element's lines.
 */
const lomOf = (record: {
  readonly identifier: string;
  readonly language?: string;
  readonly title: string;
}): readonly string[] => [
  "        <imsmd:lom>",
  "          <imsmd:general>",
  `            <imsmd:identifier><imsmd:entry>${record.identifier}</imsmd:entry></imsmd:identifier>`,
  record.language === undefined
    ? `            <imsmd:title><imsmd:string>${record.title}</imsmd:string></imsmd:title>`
    : `            <imsmd:title><imsmd:string language="${record.language}">${record.title}</imsmd:string></imsmd:title>`,
  ...(record.language === undefined
    ? []
    : [`            <imsmd:language>${record.language}</imsmd:language>`]),
  "          </imsmd:general>",
  "        </imsmd:lom>",
];

/**
 * The paths of a bulk's entries.
 *
 * @param bulk - The bulk, none for none.
 * @returns Each entry's path, in order.
 */
const bulkPaths = (bulk: Bulk | undefined): readonly string[] =>
  Array.from({ length: bulk?.entries ?? 0 }, (_, at) => `bulk/${String(at)}.bin`);

/**
 * Write the manifest: every document and the image listed by its resource, with each item's and
 * the test's LOM record, the dependencies, and a web content resource listing the bulk, if any.
 *
 * @param bulk - The bulk the package carries, none for none.
 * @returns Its text.
 */
const manifestOf = (bulk: Bulk | undefined): string =>
  [
    declaration,
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0" identifier="every-relation-manifest">',
    "  <metadata>",
    "    <schema>QTI Package</schema>",
    "    <schemaversion>3.0.0</schemaversion>",
    "    <imsmd:lom>",
    "      <imsmd:general>",
    '        <imsmd:title><imsmd:string language="en">Every relation</imsmd:string></imsmd:title>',
    "        <imsmd:language>en</imsmd:language>",
    "      </imsmd:general>",
    "      <imsmd:educational>",
    "        <imsmd:learningResourceType>",
    "          <imsmd:source>LOMv1.0</imsmd:source>",
    "          <imsmd:value>exercise</imsmd:value>",
    "        </imsmd:learningResourceType>",
    "      </imsmd:educational>",
    "    </imsmd:lom>",
    "  </metadata>",
    "  <organizations/>",
    "  <resources>",
    `    <resource identifier="item1-res" type="imsqti_item_xmlv3p0" href="${paths.item}">`,
    "      <metadata>",
    "        <imsqti:qtiMetadata>",
    "          <imsqti:interactionType>choiceInteraction</imsqti:interactionType>",
    "        </imsqti:qtiMetadata>",
    ...lomOf({ identifier: "item1", language: "en", title: "Every relation" }),
    "      </metadata>",
    `      <file href="${paths.item}"/>`,
    `      <file href="${paths.image}"/>`,
    '      <dependency identifierref="stimulus1-res"/>',
    "    </resource>",
    `    <resource identifier="item2-res" type="imsqti_item_xmlv3p0" href="${paths.templated}">`,
    "      <metadata>",
    ...lomOf({ identifier: "item2", language: "en", title: "Templated" }),
    "      </metadata>",
    `      <file href="${paths.templated}"/>`,
    '      <dependency identifierref="fragment-res"/>',
    "    </resource>",
    `    <resource identifier="fragment-res" type="imsqti_fragment_xmlv3p0" href="${paths.fragment}">`,
    `      <file href="${paths.fragment}"/>`,
    "    </resource>",
    `    <resource identifier="item3-res" type="imsqti_item_xmlv3p0" href="${paths.ruled}">`,
    `      <file href="${paths.ruled}"/>`,
    '      <dependency identifierref="rules-res"/>',
    "    </resource>",
    `    <resource identifier="rules-res" type="imsqti_fragment_xmlv3p0" href="${paths.rules}">`,
    `      <file href="${paths.rules}"/>`,
    "    </resource>",
    `    <resource identifier="stimulus1-res" type="imsqti_stimulus_xmlv3p0" href="${paths.stimulus}">`,
    `      <file href="${paths.stimulus}"/>`,
    "    </resource>",
    `    <resource identifier="section-res" type="imsqti_section_xmlv3p0" href="${paths.section}">`,
    `      <file href="${paths.section}"/>`,
    '      <dependency identifierref="item2-res"/>',
    "    </resource>",
    `    <resource identifier="test-res" type="imsqti_test_xmlv3p0" href="${paths.test}">`,
    "      <metadata>",
    ...lomOf({ identifier: "test1", title: "Every relation test" }),
    "      </metadata>",
    `      <file href="${paths.test}"/>`,
    '      <dependency identifierref="item1-res"/>',
    '      <dependency identifierref="item2-res"/>',
    '      <dependency identifierref="section-res"/>',
    "    </resource>",
    `    <resource identifier="usage-res" type="qtiusagedata/xml" href="${paths.usage}">`,
    `      <file href="${paths.usage}"/>`,
    "    </resource>",
    ...(bulk === undefined
      ? []
      : [
          '    <resource identifier="bulk-res" type="webcontent">',
          ...bulkPaths(bulk).map((path) => `      <file href="${path}"/>`),
          "    </resource>",
        ]),
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");

/**
 * Collect entries into a keyed set by path.
 *
 * @param entries - Each entry's path and bytes.
 * @returns The keyed set.
 * @throws {Error} When two entries share a path, a defect of this generator, whose paths are
 *   distinct by construction.
 */
const keyedByPath = (entries: readonly (readonly [string, Uint8Array])[]): PackageEntries => {
  const keyed = new Map<string, Uint8Array>();
  for (const [path, bytes] of entries) {
    if (keyed.has(path)) {
      throw new Error(
        `The every-relation package writes ${path} twice, and a package's entries are a set by path. Correct the generator's paths.`,
      );
    }

    keyed.set(path, bytes);
  }

  return keyed;
};

/**
 * Build the every-relation package of member counts: its documents, its image and its bulk, each
 * entry once by path, every document UTF-8.
 *
 * @param members - The counts it is drawn by.
 * @param bulk - Identical binary entries it carries beside its documents, none for none.
 * @returns The package's entries.
 */
export const everyRelationPackage = (members: MemberCounts, bulk?: Bulk): PackageEntries => {
  const text = new TextEncoder();

  return keyedByPath([
    [manifestPath, text.encode(manifestOf(bulk))],
    [paths.item, text.encode(itemOf(members))],
    [paths.templated, text.encode(templatedItem)],
    [paths.fragment, text.encode(fragment)],
    [paths.ruled, text.encode(ruledItem)],
    [paths.rules, text.encode(rules)],
    [paths.stimulus, text.encode(stimulus)],
    [paths.section, text.encode(section)],
    [paths.test, text.encode(test)],
    [paths.usage, text.encode(usage)],
    [paths.image, pixel],
    ...bulkPaths(bulk).map((path): readonly [string, Uint8Array] => [path, bulk?.bytes ?? pixel]),
  ]);
};

/**
 * Write a package's entries under a directory, making the directories their paths name.
 *
 * An entry whose bytes are the very array of an entry written before is a hard link to that file,
 * so a bulk of identical entries costs its bytes on disk once.
 *
 * @param entries - The package's entries.
 * @param dir - The package's directory, created when absent.
 * @returns Nothing. Fails with the file system's error.
 */
export const writePackage = Effect.fn("test.everyRelation.write")(function* writePackage(
  entries: PackageEntries,
  dir: string,
): Effect.fn.Return<void, PlatformError.PlatformError, FileSystem.FileSystem | Path.Path> {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const written = new Map<Uint8Array, string>();
  for (const [entry, bytes] of entries) {
    const file = path.join(dir, entry);
    const first = written.get(bytes);

    yield* fs.makeDirectory(path.dirname(file), { recursive: true });
    if (first === undefined) {
      yield* fs.writeFile(file, bytes);
      written.set(bytes, file);
    } else {
      yield* fs.link(first, file);
    }
  }
});

/**
 * Write a package into a fresh directory under the package's `work/every-relation/`, removed when
 * the scope closes.
 *
 * @param entries - The package's entries.
 * @returns The package's directory, whose last segment is its name.
 */
export const scopedPackage = Effect.fn("test.everyRelation.scoped")(function* scopedPackage(
  entries: PackageEntries,
): Effect.fn.Return<
  string,
  PlatformError.PlatformError,
  FileSystem.FileSystem | Path.Path | Scope.Scope
> {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.join(import.meta.dirname, "..", "..", "..", "work", "every-relation");

  yield* fs.makeDirectory(root, { recursive: true });

  const dir = yield* fs.makeTempDirectoryScoped({ directory: root, prefix: "every-relation-" });

  yield* writePackage(entries, dir);

  return dir;
});
