import path from "node:path";
import { materializeSpec, specOf } from "#pantry/test/fixtures.ts";
import type { FileEdit, FixtureSpec, TextEdit } from "#pantry/test/fixtures.ts";
import { annotationXmlBlock, mathmlGroups } from "#pantry/test/mathml-blocks.ts";
import type { MathmlBlock, MathmlGroup } from "#pantry/test/mathml-blocks.ts";
import type { LawName, Rule } from "#pantry/import/refusal.ts";
import { mathmlNamespace, xlinkNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The MathML fixtures of phase 6 revision N: names, specs and the verdict each one is expected to
 * get, as data. `fixtures.ts` is not edited, so a spec here is a {@link FixtureSpec} built from the
 * base documents it names (`specOf` for the base fixtures, the examples tarball's members for the
 * cut items) and materialized through `materializeSpec`, as `processing-fixtures.ts` builds on
 * `fixtures.ts`.
 *
 * - Positives (57): the 12 cut items of phase 6 spec 4.11, the 18 generated groups and the
 *   `m:annotation-xml` kind block, J6's eight other annotation positives, the 14 ruling positives
 *   of revision N spec 6.1, and four that decisions 321 and 327 turned from negatives:
 *   `math-space-in-mspace` (whitespace in an `empty` content model, which MathML's RelaxNG admits)
 *   and the three bare `mglyph` fixtures (MathML 3's schema declares `src`, `alt` and `index`
 *   optional).
 * - Negatives (48): each one edit to `math-mathml`'s prompt, with the law and the rule it is expected
 *   to be refused under.
 *
 * Each fixture's data carries its `owner`: `phase-6` where this phase's laws decide the expectation
 * and `pr-46` where PR #46 does (`math-number-plus` and `math-cn-base-plus`, which are #46's
 * `+0.5` item, and the negatives its reply measured as refused today, under the rules it gives).
 */

/**
 * The SVG namespace, declared where a J6 positive puts an SVG element inside an annotation.
 */
const svgNamespace = "http://www.w3.org/2000/svg";

/**
 * The item of `BBQsTest` that the custom-operator fixtures are cut from, and the text that ends the
 * one operand of its one `qti-custom-operator`, which a J6 positive's formula goes after.
 */
const sineRuleItem = "id-bd44a757f562/SineRule-001.xml";

/**
 * The text that ends the operand of `sineRuleItem`'s custom operator.
 */
const operandEnd = "]]></qti-base-value>";

/**
 * The tarball members of the corpus zips the cut items come from that `cutItem` has no name for.
 */
const members = {
  BBQsTest: "qtiv3-examples/packaging/BBQsTest/BBQsTest.zip",
  BPIG_22April: "QTI3_BPIG_Examples/BPIG_22April.zip",
  items: "qtiv3-examples/packaging/items/items.zip",
  sharedVocabulary: "qtiv3-examples/items/shared-vocabulary/shared-vocabulary-imsmanifest.zip",
} as const;

/**
 * Build a `ReplaceText` edit of one file.
 *
 * @param file - The file the edit names, relative to the package directory.
 * @param search - The text to replace, which must occur exactly once when the edit applies.
 * @param replacement - The text that takes its place.
 * @returns The edit as plain data.
 */
const replaceIn = (file: string, search: string, replacement: string): TextEdit => ({
  _tag: "ReplaceText",
  file,
  replacement,
  search,
});

/**
 * Build the `addFile` edit that writes a hand-written text file into the package.
 *
 * @param file - The file's path in the package.
 * @param text - Its text, written as UTF-8.
 * @returns The edit as plain data.
 */
const addText = (file: string, text: string): FileEdit => ({
  _tag: "addFile",
  path: file,
  source: { text },
});

/**
 * A fixture spec whose name is the literal `Name`, so the names of a table of specs are a type.
 */
interface Named<Name extends string> extends FixtureSpec {
  readonly name: Name;
}

/**
 * Build the spec of a cut item: one corpus zip with the one `cut` edit that keeps `item` and the
 * files it references and writes a minimal manifest of `schemaversion`.
 *
 * @param name - The fixture's name.
 * @param member - The tarball member of the corpus zip.
 * @param item - The item's path inside the zip.
 * @param schemaversion - `3.0.1` for a `BPIG_22April` item, `3.0.0` for the others.
 * @param edits - The edits that apply to the item before the cut.
 * @returns The spec.
 */
const cutOf = <const Name extends string>(
  name: Name,
  member: string,
  item: string,
  schemaversion: "3.0.0" | "3.0.1",
  edits: readonly TextEdit[] = [],
): Named<Name> => ({
  edits: [...edits, { _tag: "cut", item, schemaversion }],
  member,
  name,
});

/**
 * The item `math-alttext` is cut from, its path in `BPIG_22April`.
 */
const alttextItem = "items/qti3-choice-aria-mathml-catalog.xml";

/**
 * The item `math-class` is cut from, its path in `shared-vocabulary-imsmanifest`.
 */
const classItem = "Items/Item_QTI3_RichardTake2_01/inline_choice_qti3.xml";

/**
 * The `qti-catalog-info` of `qti3-choice-aria-mathml-catalog.xml`, the lines `math-alttext` removes
 * (the catalog is phase 9's, and its `data-reading-type` phase 8's).
 */
const alttextCatalog = [
  "<qti-catalog-info>",
  '    <qti-catalog id="cat01">',
  '      <qti-card support="glossary-on-screen">',
  "        <qti-html-content>",
  "          <p>inspect (someone or something) in detail to determine their nature or condition</p>",
  "        </qti-html-content>",
  "      </qti-card>",
  '      <qti-card support="keyword-translation">',
  '        <qti-card-entry xml:lang="es">',
  "          <qti-html-content>",
  "            <p>inspeccionar, revisar, examinar</p>",
  "          </qti-html-content>",
  "        </qti-card-entry>",
  "      </qti-card>",
  "    </qti-catalog>",
  '    <qti-catalog id="cat02">',
  '      <qti-card support="spoken">',
  '        <qti-card-entry data-reading-type="computer-read-aloud">',
  "          <qti-html-content>",
  "            <p>Two surveyors, designated Ah and Pea, stand some distance apart on",
  "            the south bank of a river, looking at a tree, designated Tea, that is on the ",
  "            north bank of the river. Points Ah, Pea, and Tea form a triangle.",
  "            At points Ah and Pea, there are two parallel sight lines pointing",
  "            North and forming angles outside of the triangle. At point Pea, ",
  "            angle Tea Pea A is fifty-three degrees. The adjacent angle between Pea Tea",
  "            and the northern sight line is thirty-seven degrees. At point A, angle Tea-Ah-Pea ",
  "            is not labeled, and the adjacent angle formed between A Tea and that northern sight ",
  "            line is thirty-two degrees. </p>",
  "          </qti-html-content>",
  "        </qti-card-entry>",
  "      </qti-card>",
  "    </qti-catalog>",
  "  </qti-catalog-info>",
].join("\n");

/**
 * The cut spec of `math-mathml`, the base item of every one-edit fixture and of the generated item
 * groups of 3.0.1.
 */
const mathmlBase = cutOf("math-mathml", members.BPIG_22April, "items/MathML.xml", "3.0.1");

/**
 * The cut spec of `math-inline-choice`, the base item of the generated item groups of 3.0.0 and of
 * `math-annotation-xml-kind`.
 */
const inlineChoiceBase = cutOf(
  "math-inline-choice",
  members.items,
  "inline_choice_math.xml",
  "3.0.0",
);

/**
 * The specs of the 12 cut positives of phase 6 spec 4.11, each the cut of the item its table names
 * under the version it gives.
 *
 * - `math-alttext` also has the catalog, the two `data-catalog-idref` attributes and its
 *   `data-reading-type` removed, edits that apply before the cut.
 * - `math-class` has the `data-prompt` of its inline choice interaction removed.
 */
const cutSpecs = [
  mathmlBase,
  cutOf("math-stat2", members.BPIG_22April, "items/stat2.xml", "3.0.1"),
  cutOf("math-calc5", members.BPIG_22April, "items/mc_calc5.xml", "3.0.1"),
  cutOf(
    "math-solution",
    members.BPIG_22April,
    "items/Example03-feedbackBlock-solution.xml",
    "3.0.1",
  ),
  cutOf(
    "math-template-block",
    members.BPIG_22April,
    "items/Example04-feedbackBlock-templateBlock.xml",
    "3.0.1",
  ),
  cutOf("math-alttext", members.BPIG_22April, alttextItem, "3.0.1", [
    replaceIn(alttextItem, alttextCatalog, ""),
    replaceIn(alttextItem, '<span data-catalog-idref="cat01">Examine</span>', "Examine"),
    replaceIn(alttextItem, ' data-catalog-idref="cat02"', ""),
  ]),
  cutOf(
    "math-polynomials",
    members.BBQsTest,
    "id-371b0f88774a/MultipleChoice-choice-polynomials.xml",
    "3.0.0",
  ),
  cutOf("math-order", members.BBQsTest, "id-e475c3c922f6/order-maths.xml", "3.0.0"),
  cutOf(
    "math-associate",
    members.BBQsTest,
    "id-200e2c3f7d76/matching-associate-trigDeriv.xml",
    "3.0.0",
  ),
  cutOf("math-either-or", members.BBQsTest, "id-5c1b1e2d56bd/either-or.xml", "3.0.0"),
  inlineChoiceBase,
  cutOf("math-class", members.sharedVocabulary, classItem, "3.0.0", [
    replaceIn(classItem, ' data-prompt="Select an Answer"', ""),
  ]),
] as const satisfies readonly FixtureSpec[];

/**
 * The names of the 12 cut positives, in the order of {@link cutSpecs}.
 */
type CutName = (typeof cutSpecs)[number]["name"];

/**
 * The names of the 18 generated positives: one for each group of `mathmlGroups`, the group's blocks
 * inserted into one base document of its version. Groups 1 to 16 are items, over
 * `math-inline-choice`'s item (3.0.0) or `math-mathml`'s (3.0.1); group 17 is an assessment test
 * over `test-template-default`, and group 18 an assessment stimulus over `stimulus-shared`, both
 * 3.0.0, because three hosts sit only in a test or a stimulus.
 */
const generatedNames = [
  "math-gen-1",
  "math-gen-2",
  "math-gen-3",
  "math-gen-4",
  "math-gen-5",
  "math-gen-6",
  "math-gen-7",
  "math-gen-8",
  "math-gen-9",
  "math-gen-10",
  "math-gen-11",
  "math-gen-12",
  "math-gen-13",
  "math-gen-14",
  "math-gen-15",
  "math-gen-16",
  "math-gen-17",
  "math-gen-18",
] as const;

/**
 * The fragment of a generated group at one of its sites, the blocks in group order.
 *
 * @param group - The generated group.
 * @param site - The site of {@link MathmlBlock}.
 * @returns The blocks' XML written one after the other, empty when no block is for the site.
 */
const generatedAt = (group: MathmlGroup, site: MathmlBlock["site"]): string =>
  group.blocks
    .filter((block) => block.site === site)
    .map((block) => block.xml)
    .join("");

/**
 * The declaration of the `FEEDBACK` outcome the group's feedback blocks name, an identifier
 * outcome, or nothing when no block of the group names it.
 *
 * @param group - The generated group.
 * @returns The declaration's text.
 */
const generatedOutcome = (group: MathmlGroup): string =>
  group.blocks.some((block) => block.xml.includes('outcome-identifier="FEEDBACK"'))
    ? '<qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>'
    : "";

/**
 * The response declarations of the host blocks' interactions, each with the `cardinality` and
 * `base-type` its interaction takes: a gap match and an associate interaction bind several pairs,
 * the others one identifier.
 */
const generatedResponses = [
  ["RESPONSE_AS", "multiple", "pair"],
  ["RESPONSE_CH", "single", "identifier"],
  ["RESPONSE_GM", "multiple", "directedPair"],
  ["RESPONSE_HT", "single", "identifier"],
  ["RESPONSE_IC", "single", "identifier"],
] as const;

/**
 * The files a generated group's blocks name by a relative `altimg`, `data`, `href` or `src`: the
 * `a.html` of an anchor, the `o.png` of an object and the like. The package holds each, so that
 * every file reference the importer reads names a package entry.
 *
 * @param group - The generated group.
 * @returns The distinct paths, relative to the group's document, in block order.
 */
const generatedFiles = (group: MathmlGroup): readonly string[] => [
  ...new Set(
    group.blocks.flatMap((block) =>
      [...block.xml.matchAll(/\s(?:altimg|data|href|src)="(?<file>[^"#]+)"/gu)]
        .map((match) => match.groups?.["file"] ?? "")
        .filter((value) => value !== "" && !/^(?:[A-Za-z][A-Za-z0-9+.-]*:|\/)/u.test(value)),
    ),
  ),
];

/**
 * The edits that put a generated group into its base item: the response declarations of the
 * interactions the group's blocks hold, the `FEEDBACK` outcome and the `TPL` template variable they
 * name, the blocks of the body site at the start of the item body and those of the item site last
 * in the item, after its response processing. Each is a `ReplaceText` at an exact anchor that both
 * base items share.
 *
 * @param item - The base item's path in its zip.
 * @param group - The generated group.
 * @returns The edits, which apply before the cut.
 */
const generatedItemEdits = (item: string, group: MathmlGroup): readonly TextEdit[] => {
  const responses = generatedResponses
    .filter(([identifier]) =>
      group.blocks.some((block) => block.xml.includes(`response-identifier="${identifier}"`)),
    )
    .map(
      ([identifier, cardinality, baseType]) =>
        `<qti-response-declaration identifier="${identifier}" cardinality="${cardinality}" base-type="${baseType}"/>`,
    )
    .join("");
  const template = group.blocks.some((block) => block.xml.includes('template-identifier="TPL"'))
    ? '<qti-template-declaration identifier="TPL" cardinality="single" base-type="identifier"/>'
    : "";
  const scoreOutcome =
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>';

  return [
    replaceIn(item, "</qti-response-declaration>", `</qti-response-declaration>${responses}`),
    replaceIn(item, scoreOutcome, `${scoreOutcome}${generatedOutcome(group)}${template}`),
    replaceIn(item, "<qti-item-body>", `<qti-item-body>${generatedAt(group, "body")}`),
    replaceIn(
      item,
      "</qti-assessment-item>",
      `${generatedAt(group, "item")}</qti-assessment-item>`,
    ),
  ];
};

/**
 * The spec of a generated group over a base item.
 *
 * @param base - The cut spec of the base item, `math-inline-choice` (3.0.0) or `math-mathml`
 *   (3.0.1).
 * @param item - The base item's path in its zip.
 * @param group - The generated group, of the base's version.
 * @returns The spec: the base's cut with the group's files and edits before it.
 */
const generatedItem = (base: FixtureSpec, item: string, group: MathmlGroup): FixtureSpec => ({
  edits: [
    ...generatedFiles(group).map((file) =>
      addText(path.posix.join(path.posix.dirname(item), file), "x"),
    ),
    ...generatedItemEdits(item, group),
    ...base.edits,
  ],
  member: base.member,
  name: group.name,
});

/**
 * The spec of the generated test group: `test-template-default`'s test with `xmlns:m` on its root,
 * the `FEEDBACK` outcome the test feedback names and the group's rubric block before its test part
 * and test feedback after it, which has no outcome processing for them to follow.
 *
 * @param group - The generated group whose blocks are for the test.
 * @returns The spec.
 */
const generatedTest = (group: MathmlGroup): FixtureSpec => {
  const base = specOf("test-template-default");
  const file = "template-default-test.xml";
  const part = '<qti-test-part identifier="PART"';

  return {
    edits: [
      ...base.edits,
      replaceIn(
        file,
        ' identifier="TEMPLATE-DEFAULT"',
        ` xmlns:m="${mathmlNamespace}" identifier="TEMPLATE-DEFAULT"`,
      ),
      replaceIn(file, part, `${generatedOutcome(group)}${generatedAt(group, "test-head")}${part}`),
      replaceIn(file, "</qti-test-part>", `</qti-test-part>${generatedAt(group, "test-tail")}`),
    ],
    member: base.member,
    name: group.name,
  };
};

/**
 * The spec of the generated stimulus group: `stimulus-shared`'s passage with `xmlns:m` on its root
 * and the group's blocks first in its stimulus body.
 *
 * @param group - The generated group whose blocks are for the stimulus body.
 * @returns The spec.
 */
const generatedStimulus = (group: MathmlGroup): FixtureSpec => {
  const base = specOf("stimulus-shared");
  const file = "passages/unbelievableNight.xml";

  return {
    edits: [
      ...base.edits,
      replaceIn(
        file,
        'identifier="Stimulus1"',
        `xmlns:m="${mathmlNamespace}" identifier="Stimulus1"`,
      ),
      replaceIn(
        file,
        "<qti-stimulus-body>",
        `<qti-stimulus-body>${generatedAt(group, "stimulus-body")}`,
      ),
    ],
    member: base.member,
    name: group.name,
  };
};

/**
 * The spec of one generated group, over the base document its first block's site names.
 *
 * @param group - A group of `mathmlGroups`.
 * @returns The spec.
 */
const generatedSpec = (group: MathmlGroup): FixtureSpec => {
  const site = group.blocks[0]?.site;

  if (site === "test-head" || site === "test-tail") {
    return generatedTest(group);
  }

  if (site === "stimulus-body") {
    return generatedStimulus(group);
  }

  return group.version === "3.0.1"
    ? generatedItem(mathmlBase, "items/MathML.xml", group)
    : generatedItem(inlineChoiceBase, "inline_choice_math.xml", group);
};

/**
 * The generated group of a fixture name.
 *
 * @param name - One of {@link generatedNames}.
 * @returns The group of `mathmlGroups` of that name; the fixtures test pins that there is one.
 */
const generatedGroup = (name: (typeof generatedNames)[number]): MathmlGroup => {
  const group = mathmlGroups.find((found) => found.name === name);

  if (group === undefined) {
    throw new Error(`mathmlGroups has no group ${name}`);
  }

  return group;
};

/**
 * One fixture that is `math-mathml`'s cut with one block of MathML inserted first in its prompt:
 * its name, the block's XML in the `m` prefix the item declares, and the files the block names,
 * each as a path relative to `items/` and its text.
 */
interface PromptEntry {
  readonly block: string;
  readonly files?: readonly (readonly [file: string, text: string])[];
  readonly name: string;
}

/**
 * The spec of a fixture that is `math-mathml`'s cut with one block inserted first in its prompt,
 * the one edit that makes it (`math-mathml`'s prompt is a MathML host, in a choice interaction, so
 * the host is not what is refused unless the block says so).
 *
 * @param entry - The fixture's name, block and files.
 * @returns The spec: the files the block names, the edit, then `math-mathml`'s cut.
 */
const inPrompt = <const Name extends string>({
  block,
  files = [],
  name,
}: PromptEntry & { readonly name: Name }): Named<Name> => ({
  edits: [
    ...files.map(([file, text]) => addText(path.posix.join("items", file), text)),
    replaceIn("items/MathML.xml", "<qti-prompt>", `<qti-prompt>${block}`),
    ...mathmlBase.edits,
  ],
  member: mathmlBase.member,
  name,
});

/**
 * A formula whose `m:semantics` holds an `m:mi` and an `m:annotation-xml` with `content` inside it:
 * the one place J6 admits more than MathML (phase 6 spec 4.9).
 *
 * @param content - The XML inside the annotation.
 * @returns The `m:math` element's text, in the `m` prefix the base items declare.
 */
const annotationOf = (content: string): string =>
  `<m:math><m:semantics><m:mi>x</m:mi><m:annotation-xml encoding="application/xhtml+xml">${content}</m:annotation-xml></m:semantics></m:math>`;

/**
 * The spec of a fixture cut from `sineRuleItem` with the formula `block` after the operand of its
 * custom operator (decision 218: decision 110 admits only `m:math` from MathML there).
 *
 * @param name - The fixture's name.
 * @param block - The `m:math` the operator holds after its operand.
 * @returns The spec: the edit, then the custom-operator fixture's cut.
 */
const afterOperand = <const Name extends string>(name: Name, block: string): Named<Name> => {
  const base = specOf("cut-custom-operator");

  return {
    edits: [replaceIn(sineRuleItem, operandEnd, operandEnd + block), ...base.edits],
    member: base.member,
    name,
  };
};

/**
 * J6's nine annotation positives (phase 6 spec 4.9, decisions 214, 217 and 218): the content of
 * `m:annotation-xml` and a foreign attribute on a MathML kind.
 *
 * - `math-annotation-xml-html` puts a `div` under `m:annotation-xml`, and
 *   `math-annotation-xml-semantics` an `m:semantics` of an `m:mi` and an `m:annotation`.
 * - `math-foreign-attribute` is an `xlink:href` on an `m:mi`.
 * - `math-annotation-xml-printed-variable` is `m:annotation-xml > div > qti-printed-variable`, and
 *   `math-custom-operator-printed-variable` the same under a `qti-custom-operator`, through an
 *   `m:math`.
 * - `math-annotation-xml-qti-direct`, `-qti-deep` and `-qti-root` put a `qti-printed-variable`, a
 *   `qti-prompt` inside an `svg:g` and a `qti-assessment-item` in the annotation, which are foreign
 *   content (decisions 217 and 218).
 * - `math-annotation-xml-kind` is `annotationXmlBlock` in `math-inline-choice`'s item.
 */
const annotationSpecs = [
  inPrompt({ block: annotationOf("<div>text</div>"), name: "math-annotation-xml-html" }),
  {
    ...generatedItem(inlineChoiceBase, "inline_choice_math.xml", {
      blocks: [annotationXmlBlock],
      name: "math-annotation-xml-kind",
      version: "3.0.0",
    }),
    name: "math-annotation-xml-kind",
  },
  inPrompt({
    block: annotationOf('<div><qti-printed-variable identifier="SCORE"/></div>'),
    name: "math-annotation-xml-printed-variable",
  }),
  inPrompt({
    block: annotationOf(`<svg:g xmlns:svg="${svgNamespace}"><qti-prompt>text</qti-prompt></svg:g>`),
    name: "math-annotation-xml-qti-deep",
  }),
  inPrompt({
    block: annotationOf('<qti-printed-variable identifier="SCORE"/>'),
    name: "math-annotation-xml-qti-direct",
  }),
  inPrompt({
    block: annotationOf("<qti-assessment-item/>"),
    name: "math-annotation-xml-qti-root",
  }),
  inPrompt({
    block: annotationOf(
      '<m:semantics><m:mi>y</m:mi><m:annotation encoding="text/plain">y</m:annotation></m:semantics>',
    ),
    name: "math-annotation-xml-semantics",
  }),
  afterOperand(
    "math-custom-operator-printed-variable",
    annotationOf('<div><qti-printed-variable identifier="SCORE"/></div>'),
  ),
  inPrompt({
    block: `<m:math><m:mi xmlns:xlink="${xlinkNamespace}" xlink:href="https://example.org/a">x</m:mi></m:math>`,
    name: "math-foreign-attribute",
  }),
] as const satisfies readonly FixtureSpec[];

/**
 * The ruling positives of revision N spec 6.1 and the four that decisions 321 and 327 turned from
 * negatives, each one {@link inPrompt} edit.
 *
 * - `math-annotation-xml-empty`: an `m:annotation-xml` with no child (`mathml3-common.rnc:59`,
 *   `(MathExpression|anyElement)*`).
 * - `math-lambda-interval` and `math-int-interval-condition`: `interval` among a container's
 *   qualifiers, and as an operand after a head's `bvar` (the RelaxNG's `DomainQ`, §4.3.3's order).
 * - `math-apply-semantics`: an `m:semantics` as an `m:apply`'s head
 *   (`mathml3-strict-content.rnc:14`).
 * - `math-moment-rec`: the REC's own `moment` example (§4.4.8.6: `degree`, `momentabout`, five `cn`).
 * - `math-closure-half`: main's `math-interval-closure`; `closure` is `text` in MathML 3.
 * - `math-share-crossdoc`: a `share` whose `src` is a packaged file, reading 103's file reference and
 *   no more (decision 321).
 * - `math-maction-group-unselected`: a group inside an `maction`'s child that is not the selected one
 *   (§3.5.5.2: "only its selected sub-expression is checked").
 * - `math-apply-apply-degree`: a qualifier after an `m:apply` head.
 * - `math-mglyph-deprecated`: the deprecated `index` and `fontfamily` form with no `src` (decision
 *   321 (6)).
 * - `math-mrow-dir-group`: `mrow dir="ltr"` around a group in an LTR formula, no change of direction
 *   (decision 321 (6)).
 * - `math-group-outside-scope`, `math-hexdouble-nan` (`7ff8000000000000`) and
 *   `math-scriptsize-negative`: main accepted them, kept as guards.
 * - `math-space-in-mspace` (whitespace in an `empty` content model, which MathML's RelaxNG admits;
 *   decision 321 (5)) and `math-mglyph-bare`, `-no-alt`, `-alt-only` (MathML 3's schema declares
 *   `src`, `alt` and `index` optional; decision 327).
 */
const rulingEntries = [
  { block: annotationOf(""), name: "math-annotation-xml-empty" },
  {
    block:
      "<m:math><m:lambda><m:bvar><m:ci>x</m:ci></m:bvar><m:interval><m:cn>0</m:cn><m:cn>1</m:cn></m:interval><m:ci>x</m:ci></m:lambda></m:math>",
    name: "math-lambda-interval",
  },
  {
    block:
      '<m:math><m:apply><m:semantics><m:plus/><m:annotation encoding="text/plain">add</m:annotation></m:semantics><m:ci>x</m:ci><m:ci>y</m:ci></m:apply></m:math>',
    name: "math-apply-semantics",
  },
  {
    block:
      "<m:math><m:apply><m:int/><m:bvar><m:ci>x</m:ci></m:bvar><m:interval><m:cn>0</m:cn><m:cn>1</m:cn></m:interval><m:condition><m:apply><m:gt/><m:ci>x</m:ci><m:cn>0</m:cn></m:apply></m:condition><m:ci>f</m:ci></m:apply></m:math>",
    name: "math-int-interval-condition",
  },
  {
    block:
      "<m:math><m:apply><m:moment/><m:degree><m:cn>3</m:cn></m:degree><m:momentabout><m:mean/></m:momentabout><m:cn>6</m:cn><m:cn>4</m:cn><m:cn>2</m:cn><m:cn>2</m:cn><m:cn>5</m:cn></m:apply></m:math>",
    name: "math-moment-rec",
  },
  {
    block: '<m:math><m:interval closure="half"><m:cn>1</m:cn><m:cn>2</m:cn></m:interval></m:math>',
    name: "math-closure-half",
  },
  {
    block: '<m:math><m:share src="formula.xml"/></m:math>',
    files: [["formula.xml", "x"]],
    name: "math-share-crossdoc",
  },
  {
    block:
      '<m:math><m:mtable><m:mtr><m:mtd><m:maction actiontype="toggle" selection="1"><m:maligngroup/><m:mfrac><m:mrow><m:maligngroup/><m:mi>a</m:mi></m:mrow><m:mi>b</m:mi></m:mfrac></m:maction></m:mtd></m:mtr></m:mtable></m:math>',
    name: "math-maction-group-unselected",
  },
  {
    block:
      "<m:math><m:apply><m:apply><m:plus/><m:ci>a</m:ci><m:ci>b</m:ci></m:apply><m:degree><m:cn>2</m:cn></m:degree><m:ci>x</m:ci></m:apply></m:math>",
    name: "math-apply-apply-degree",
  },
  {
    block: '<m:math><m:mi><m:mglyph index="1" fontfamily="serif" alt="x"/></m:mi></m:math>',
    name: "math-mglyph-deprecated",
  },
  {
    block:
      '<m:math><m:mtable><m:mtr><m:mtd><m:mrow dir="ltr"><m:maligngroup/><m:mi>a</m:mi></m:mrow></m:mtd></m:mtr></m:mtable></m:math>',
    name: "math-mrow-dir-group",
  },
  {
    block: "<m:math><m:mrow><m:maligngroup/><m:mi>a</m:mi></m:mrow></m:math>",
    name: "math-group-outside-scope",
  },
  {
    block: '<m:math><m:cn type="hexdouble">7ff8000000000000</m:cn></m:math>',
    name: "math-hexdouble-nan",
  },
  {
    block: '<m:math><m:mstyle scriptsizemultiplier="-0.5"><m:mi>x</m:mi></m:mstyle></m:math>',
    name: "math-scriptsize-negative",
  },
  { block: "<m:math><m:mspace> </m:mspace></m:math>", name: "math-space-in-mspace" },
  { block: "<m:math><m:mi><m:mglyph/></m:mi></m:math>", name: "math-mglyph-bare" },
  {
    block: '<m:math><m:mi><m:mglyph src="glyph.png"/></m:mi></m:math>',
    files: [["glyph.png", "x"]],
    name: "math-mglyph-no-alt",
  },
  { block: '<m:math><m:mi><m:mglyph alt="x"/></m:mi></m:math>', name: "math-mglyph-alt-only" },
] as const satisfies readonly PromptEntry[];

/**
 * The expected law of a negative: a law of the law oracle, `codec` where the codec refuses the
 * package so that no row is written and no law reads it, or a law the revision's slices add to the
 * oracle.
 */
export type MathmlLaw =
  | LawName
  | "MathML align first"
  | "MathML align placement"
  | "MathML cn form"
  | "MathML head qualifier"
  | "MathML maction selection"
  | "MathML share cycle"
  | "codec";

/**
 * Who decides a fixture's expectation: `phase-6`, where this phase's laws do, or `pr-46`, where
 * PR #46 does.
 */
export type MathmlOwner = "phase-6" | "pr-46";

/**
 * One negative: a fixture of one edit to `math-mathml`'s prompt, with the law the oracle names
 * among its breaches, the rule its verdict is, and who decides that expectation. `pinned` marks an
 * expectation held where phase 6 integrates and owned by another phase after it.
 */
interface NegativeEntry extends PromptEntry {
  readonly law: MathmlLaw;
  readonly owner: MathmlOwner;
  readonly pinned?: true;
  readonly rule: Rule;
}

/**
 * The 48 negatives of revision N spec 6.2, in the table's order.
 *
 * - The expected law and rule are the table's. Where two laws break the verdict's rule follows
 *   `precedence`; the oracle test (p6n-24) records what it measures instead of changing it. For
 *   `math-bind-no-bvar` and `math-mscarries-last` the table expects the automaton's `N7 Last` and
 *   `child-set`, and the oracle test records what it reports.
 * - `owner` is `pr-46` for `math-number-plus`, `math-cn-base-plus` (PR #46's `+0.5` item, expected
 *   `attribute-lexical`) and the 14 negatives PR #46's reply measured as refused today, under the
 *   rules it gives (not main's); every other expectation is phase 6's.
 * - `math-bad-href` is `pinned`: `href-form` is the rule at `90e0bc77`, and the value the integrated
 *   head reports is written in by p6n-24 and p6n-29 as measured. Phase 15 owns the rule an invalid
 *   URI is refused under (its p15-34 updates this entry if its href work moves it, decision 324).
 * - No fixture asserts a rule for `cdgroup="%zz"` or `mglyph src="%zz"`.
 */
const negativeEntries = [
  {
    block: "<blockquote><m:math><m:mi>x</m:mi></m:math></blockquote>",
    law: "codec",
    name: "math-in-blockquote",
    owner: "pr-46",
    rule: "unmodeled-vocabulary",
  },
  {
    block: "<p><m:mi>x</m:mi></p>",
    law: "codec",
    name: "math-mi-in-p",
    owner: "pr-46",
    rule: "unmodeled-vocabulary",
  },
  {
    block: '<m:math><m:mrow><qti-printed-variable identifier="SCORE"/></m:mrow></m:math>',
    law: "codec",
    name: "math-printed-variable",
    owner: "pr-46",
    rule: "unmodeled-vocabulary",
  },
  {
    block: "<math><mi>x</mi></math>",
    law: "codec",
    name: "math-unnamespaced",
    owner: "pr-46",
    rule: "unmodeled-vocabulary",
  },
  {
    block: annotationOf("<m:math><m:mi>y</m:mi></m:math>"),
    law: "codec",
    name: "math-annotation-xml-math",
    owner: "phase-6",
    rule: "unmodeled-vocabulary",
  },
  {
    block: annotationOf('<m:annotation encoding="text/plain">y</m:annotation>'),
    law: "codec",
    name: "math-annotation-xml-annotation",
    owner: "phase-6",
    rule: "unmodeled-vocabulary",
  },
  {
    block: annotationOf("<m:sep/>"),
    law: "codec",
    name: "math-annotation-xml-sep",
    owner: "phase-6",
    rule: "unmodeled-vocabulary",
  },
  {
    block: annotationOf("<m:notanelement/>"),
    law: "codec",
    name: "math-annotation-xml-unknown",
    owner: "phase-6",
    rule: "unmodeled-vocabulary",
  },
  {
    block: '<m:math><m:mi display="block">x</m:mi></m:math>',
    law: "codec",
    name: "math-display-on-mi",
    owner: "pr-46",
    rule: "attribute-admission",
  },
  {
    block: '<m:math><m:mi data-foo="x">x</m:mi></m:math>',
    law: "codec",
    name: "math-data-attribute",
    owner: "pr-46",
    rule: "attribute-admission",
  },
  {
    block: "<m:math><m:mfrac>text<m:mi>a</m:mi><m:mi>b</m:mi></m:mfrac></m:math>",
    law: "N5 admitted",
    name: "math-text-in-mfrac",
    owner: "pr-46",
    rule: "admission",
  },
  {
    block: "<m:math><m:mfrac><m:mi>a</m:mi><m:mi>b</m:mi><m:mi>c</m:mi></m:mfrac></m:math>",
    law: "N5 Follow",
    name: "math-mfrac-three",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block:
      '<m:math><m:semantics><m:annotation encoding="text/plain">x</m:annotation><m:mi>x</m:mi></m:semantics></m:math>',
    law: "N5 Follow",
    name: "math-semantics-order",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block:
      "<m:math><m:mmultiscripts><m:mi>x</m:mi><m:mprescripts/><m:mi>a</m:mi><m:mi>b</m:mi><m:mprescripts/><m:mi>c</m:mi><m:mi>d</m:mi></m:mmultiscripts></m:math>",
    law: "N5 Follow",
    name: "math-prescripts-twice",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block:
      "<m:math><m:apply><m:int/><m:bvar><m:ci>x</m:ci><m:ci>y</m:ci></m:bvar><m:ci>f</m:ci></m:apply></m:math>",
    law: "N5 Follow",
    name: "math-bvar-two-ci",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block:
      "<m:math><m:apply><m:diff/><m:bvar><m:ci>x</m:ci><m:degree><m:cn>2</m:cn></m:degree><m:degree><m:cn>3</m:cn></m:degree></m:bvar><m:ci>f</m:ci></m:apply></m:math>",
    law: "N5 Follow",
    name: "math-bvar-two-degree",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block:
      "<m:math><m:piecewise><m:otherwise><m:ci>a</m:ci></m:otherwise><m:otherwise><m:ci>b</m:ci></m:otherwise></m:piecewise></m:math>",
    law: "N5 Follow",
    name: "math-piecewise-two-otherwise",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block: '<m:math display="center"><m:mi>x</m:mi></m:math>',
    law: "value domain",
    name: "math-display-center",
    owner: "pr-46",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:mi mathcolor="notacolor">x</m:mi></m:math>',
    law: "value domain",
    name: "math-bad-color",
    owner: "pr-46",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:mstack><m:msrow position="+1"><m:mn>1</m:mn></m:msrow></m:mstack></m:math>',
    law: "value domain",
    name: "math-position-plus",
    owner: "pr-46",
    rule: "attribute-lexical",
  },
  {
    block:
      '<m:math><m:mtable><m:mtr><m:mtd rowspan="+2"><m:mi>x</m:mi></m:mtd></m:mtr></m:mtable></m:math>',
    law: "value domain",
    name: "math-rowspan-plus",
    owner: "pr-46",
    rule: "attribute-lexical",
  },
  {
    block: "<m:math><m:maction><m:mi>x</m:mi></m:maction></m:math>",
    law: "AL3 required",
    name: "math-maction-bare",
    owner: "pr-46",
    rule: "required-attribute",
  },
  {
    block: '<div id="dup"/><m:math id="dup"><m:mi>x</m:mi></m:math>',
    law: "DocumentId key",
    name: "math-duplicate-id",
    owner: "pr-46",
    rule: "document-key",
  },
  {
    block: '<m:math><m:mi href="%zz">x</m:mi></m:math>',
    law: "Href form",
    name: "math-bad-href",
    owner: "pr-46",
    pinned: true,
    rule: "href-form",
  },
  {
    block: annotationOf("<div><m:math><m:mi>y</m:mi></m:math></div>"),
    law: "N6 ancestry",
    name: "math-annotation-xml-nested-math",
    owner: "phase-6",
    rule: "ancestry-ban",
  },
  {
    block: annotationOf('<div><qti-text-entry-interaction response-identifier="RESPONSE"/></div>'),
    law: "N6 ancestry",
    name: "math-annotation-xml-nested-interaction",
    owner: "phase-6",
    rule: "ancestry-ban",
  },
  {
    block: annotationOf('<div><p><qti-gap identifier="G"/></p></div>'),
    law: "N6 ancestry",
    name: "math-annotation-xml-gap",
    owner: "phase-6",
    rule: "ancestry-ban",
  },
  {
    block: "<m:math><m:apply><m:divide/><m:cn>1</m:cn></m:apply></m:math>",
    law: "MathML arity",
    name: "math-apply-binary-one",
    owner: "phase-6",
    rule: "math-arity",
  },
  {
    block: "<m:math><m:apply><m:sin/><m:ci>x</m:ci><m:ci>y</m:ci></m:apply></m:math>",
    law: "MathML arity",
    name: "math-apply-unary-two",
    owner: "phase-6",
    rule: "math-arity",
  },
  {
    block: "<m:math><m:apply><m:selector/></m:apply></m:math>",
    law: "MathML arity",
    name: "math-apply-selector-bare",
    owner: "phase-6",
    rule: "math-arity",
  },
  {
    block: "<m:math><m:apply><m:partialdiff/><m:ci>f</m:ci></m:apply></m:math>",
    law: "MathML arity",
    name: "math-partialdiff-one",
    owner: "phase-6",
    rule: "math-arity",
  },
  {
    block:
      "<m:math><m:apply><m:int/><m:bvar><m:ci>x</m:ci></m:bvar><m:condition><m:apply><m:gt/><m:ci>x</m:ci><m:cn>0</m:cn></m:apply></m:condition><m:lowlimit><m:cn>0</m:cn></m:lowlimit><m:ci>f</m:ci></m:apply></m:math>",
    law: "N5 Follow",
    name: "math-qualifier-order",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block:
      "<m:math><m:apply><m:sum/><m:condition><m:apply><m:gt/><m:ci>x</m:ci><m:cn>0</m:cn></m:apply></m:condition><m:ci>x</m:ci></m:apply></m:math>",
    law: "N5 Follow",
    name: "math-condition-no-bvar",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block: "<m:math><m:bind><m:forall/><m:ci>x</m:ci></m:bind></m:math>",
    law: "N7 Last",
    name: "math-bind-no-bvar",
    owner: "phase-6",
    rule: "child-set",
  },
  {
    block: "<m:math><m:mstack><m:mn>1</m:mn><m:mscarries/></m:mstack></m:math>",
    law: "N7 Last",
    name: "math-mscarries-last",
    owner: "phase-6",
    rule: "child-set",
  },
  {
    block:
      "<m:math><m:apply><m:sin/><m:logbase><m:cn>2</m:cn></m:logbase><m:ci>x</m:ci></m:apply></m:math>",
    law: "MathML head qualifier",
    name: "math-logbase-on-sin",
    owner: "phase-6",
    rule: "admission",
  },
  {
    block: '<m:math><m:cn type="rational">12</m:cn></m:math>',
    law: "MathML cn form",
    name: "math-cn-rational-one",
    owner: "phase-6",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:cn type="hexdouble">7ff8</m:cn></m:math>',
    law: "MathML cn form",
    name: "math-hexdouble-short",
    owner: "phase-6",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:cn type="integer">abc</m:cn></m:math>',
    law: "MathML cn form",
    name: "math-cn-integer-letters",
    owner: "phase-6",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:cn base="abc">1</m:cn></m:math>',
    law: "value domain",
    name: "math-cn-base",
    owner: "phase-6",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:cn base="+10">1</m:cn></m:math>',
    law: "value domain",
    name: "math-cn-base-plus",
    owner: "pr-46",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:mstyle scriptsizemultiplier="+0.5"><m:mi>x</m:mi></m:mstyle></m:math>',
    law: "value domain",
    name: "math-number-plus",
    owner: "pr-46",
    rule: "attribute-lexical",
  },
  {
    block: '<m:math><m:mi xref="nowhere">x</m:mi></m:math>',
    law: "Idref target",
    name: "math-xref-dangling",
    owner: "phase-6",
    rule: "idref-target",
  },
  {
    block:
      '<m:math><m:maction actiontype="toggle" selection="3"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction></m:math>',
    law: "MathML maction selection",
    name: "math-maction-selection",
    owner: "phase-6",
    rule: "union-count",
  },
  {
    block:
      "<m:math><m:mtable><m:mtr><m:mtd><m:mfrac><m:mrow><m:maligngroup/><m:mi>a</m:mi></m:mrow><m:mi>b</m:mi></m:mfrac></m:mtd></m:mtr></m:mtable></m:math>",
    law: "MathML align placement",
    name: "math-maligngroup-placement",
    owner: "phase-6",
    rule: "admission",
  },
  {
    block:
      "<m:math><m:mtable><m:mtr><m:mtd><m:mi>a</m:mi><m:maligngroup/><m:mi>b</m:mi></m:mtd></m:mtr></m:mtable></m:math>",
    law: "MathML align first",
    name: "math-maligngroup-first",
    owner: "phase-6",
    rule: "ordering",
  },
  {
    block: '<m:math><m:share src="#nowhere"/></m:math>',
    law: "Idref target",
    name: "math-share-dangling",
    owner: "phase-6",
    rule: "idref-target",
  },
  {
    block: '<m:math><m:apply id="a"><m:plus/><m:share src="#a"/><m:cn>1</m:cn></m:apply></m:math>',
    law: "MathML share cycle",
    name: "math-share-cycle",
    owner: "phase-6",
    rule: "document-key",
  },
] as const satisfies readonly NegativeEntry[];

/**
 * The name of a cut positive, a generated positive, a J6 annotation positive, a ruling positive or
 * a negative.
 */
export type MathmlFixtureName =
  | CutName
  | (typeof annotationSpecs)[number]["name"]
  | (typeof generatedNames)[number]
  | (typeof negativeEntries)[number]["name"]
  | (typeof rulingEntries)[number]["name"];

/**
 * A package the importer accepts and round-trips: the expected verdict of a positive, with who
 * decides it.
 */
export interface MathmlPositive {
  readonly name: MathmlFixtureName;
  readonly owner: MathmlOwner;
  readonly verdict: "accepted";
}

/**
 * A package the importer refuses: the expected verdict of a negative. `law` is a law among the
 * breaches the law oracle reports (or `codec`, where no law reads the package), `rule` the rule of
 * the verdict, and `pinned` marks an expectation phase 6 holds only where it integrates.
 */
export interface MathmlNegative {
  readonly law: MathmlLaw;
  readonly name: MathmlFixtureName;
  readonly owner: MathmlOwner;
  readonly pinned: boolean;
  readonly rule: Rule;
  readonly verdict: "refused";
}

/**
 * The 57 positives, in the order of the module comment: the 12 cut items, the 18 generated groups,
 * J6's nine, then the 18 ruling positives. Every one is expected to be accepted and to round-trip.
 */
export const mathmlPositives: readonly MathmlPositive[] = [
  ...cutSpecs.map(({ name }) => name),
  ...generatedNames,
  ...annotationSpecs.map(({ name }) => name),
  ...rulingEntries.map(({ name }) => name),
].map((name) => ({ name, owner: "phase-6", verdict: "accepted" }));

/**
 * The 48 negatives with the law and the rule each is expected to be refused under, in the order of
 * revision N spec 6.2's table.
 */
export const mathmlNegatives: readonly MathmlNegative[] = negativeEntries.map(
  ({ law, name, owner, rule, ...entry }) => ({
    law,
    name,
    owner,
    pinned: "pinned" in entry,
    rule,
    verdict: "refused",
  }),
);

/**
 * Every MathML fixture name, positives first: the names {@link mathmlSpecOf} and
 * {@link materializeMathml} accept.
 */
export const mathmlFixtureNames: readonly MathmlFixtureName[] = [
  ...mathmlPositives.map(({ name }) => name),
  ...mathmlNegatives.map(({ name }) => name),
];

/**
 * The spec of every MathML fixture, by name.
 */
const specs: ReadonlyMap<string, FixtureSpec> = new Map(
  [
    ...cutSpecs,
    ...generatedNames.map((name) => generatedSpec(generatedGroup(name))),
    ...annotationSpecs,
    ...rulingEntries.map(inPrompt),
    ...negativeEntries.map(inPrompt),
  ].map((spec) => [spec.name, spec]),
);

/**
 * Return the spec of one MathML fixture.
 *
 * @param name - One of {@link mathmlFixtureNames}.
 * @returns The spec: the base document it is built over and the edits that make it.
 */
export const mathmlSpecOf = (name: MathmlFixtureName): FixtureSpec => {
  const spec = specs.get(name);

  if (spec === undefined) {
    throw new Error(`no spec for the MathML fixture ${name}`);
  }

  return spec;
};

/**
 * Materialize a MathML fixture and return its directory.
 *
 * @param name - One of {@link mathmlFixtureNames}.
 * @returns `<root>/<name>-<hash12(mathmlSpecOf(name))>`, extracted on first use and never
 *   rewritten.
 */
export const materializeMathml = (name: MathmlFixtureName) => materializeSpec(mathmlSpecOf(name));
