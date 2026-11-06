import { assert, describe, it } from "@effect/vitest";
import type { AnyRelation, Fact, Uuid } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { ContentGuardRefusal, contentGuards } from "#pantry/import/guards/content.ts";
import { ItemGuardRefusal, itemGuards } from "#pantry/import/guards/item.ts";
import { itemRows } from "#pantry/import/item.ts";
import { testRows } from "#pantry/import/test.ts";
import { Rows } from "#pantry/import/tree.ts";
import {
  ChoiceIdentifier,
  CitationUri,
  ClassList,
  HyperlinkUri,
  ManifestIdentifier,
} from "#pantry/schema/contracts.ts";
import { AttributeIdref, HeadersTarget, NodeClass, NodeLabel } from "#pantry/schema/attributes.ts";
import { A, BlockquoteCite } from "#pantry/schema/html/text.ts";
import { AssociableHotspot } from "#pantry/schema/interactions/associate.ts";
import { Gap, GapText } from "#pantry/schema/interactions/gap.ts";
import { HottextOwner } from "#pantry/schema/interactions/hot.ts";
import { OrderInteraction } from "#pantry/schema/interactions/order.ts";
import { MediaInteraction } from "#pantry/schema/interactions/other.ts";
import { Document, DocumentTitle } from "#pantry/schema/document.ts";
import { DocumentLang, ResourceLomGeneral, ResourceLomLanguageSet } from "#pantry/schema/lang.ts";
import { ResourceLom } from "#pantry/schema/metadata.ts";
import { AttributeLexical, AttributeSpelling, Node } from "#pantry/schema/node.ts";
import type { SchemaVersionHandle } from "#pantry/schema/node.ts";
import { PrintedVariableVarRef } from "#pantry/schema/template.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const packageId = "22222222-2222-4222-8222-222222222222";

/**
 * The declarations the hand-written items bind to: a single identifier response `RESPONSE`, a
 * multiple directed-pair response `PAIRS` and a single identifier outcome `FEEDBACK`.
 */
const declarations = [
  `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>`,
  `<qti-response-declaration identifier="PAIRS" cardinality="multiple" base-type="directedPair"/>`,
  `<qti-response-declaration identifier="POINT" cardinality="single" base-type="point"/>`,
  `<qti-response-declaration identifier="STRINGS" cardinality="multiple" base-type="string"/>`,
  `<qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>`,
  `<qti-outcome-declaration identifier="VAR" cardinality="single" base-type="integer"/>`,
].join("");

/**
 * The rows the item passes build for a hand-written item whose body is `body`, read as `version`;
 * `extra` is written after the declarations above.
 */
const rowsOf = (version: SchemaVersionHandle, body: string, extra = "") =>
  Effect.gen(function* handWrittenRows() {
    const text = `<qti-assessment-item xmlns="${itemNamespace}" xmlns:m="http://www.w3.org/1998/Math/MathML" identifier="hand" title="Hand" time-dependent="false">${declarations}${extra}<qti-item-body>${body}</qti-item-body></qti-assessment-item>`;
    const doc = yield* readXml(new TextEncoder().encode(text));
    const built = yield* itemRows(
      {
        doc,
        packageId,
        path: "hand.xml",
        resource: "hand",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version,
      },
      Rows.empty(),
    );

    return built.rows;
  });

/**
 * Run the content guards over the item `body` builds as `version`, failing with their refusal.
 */
const guarded = (version: SchemaVersionHandle, body: string) =>
  Effect.gen(function* guardedItem() {
    return yield* contentGuards(yield* rowsOf(version, body));
  });

/**
 * The refusal the guards answer for `body`, which names `rule`.
 */
const refusal = (rule: ContentGuardRefusal["rule"], version: SchemaVersionHandle, body: string) =>
  Effect.gen(function* refusalOfItem() {
    const failure = yield* Effect.flip(guarded(version, body));

    assert.instanceOf(failure, ContentGuardRefusal);
    assert.strictEqual(failure.rule, rule);

    return failure;
  });

/**
 * Run the content guards over the rows of a test document whose part is `part`, failing with
 * their refusal.
 */
const guardedTest = (part: string) =>
  Effect.gen(function* guardedTestDocument() {
    const text = `<qti-assessment-test xmlns="${itemNamespace}" identifier="T" title="A test">${part}</qti-assessment-test>`;
    const doc = yield* readXml(new TextEncoder().encode(text));
    const built = yield* testRows(
      {
        doc,
        packageId,
        path: "test.xml",
        resource: "test",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_test_xmlv3p0",
        version: "3.0.1",
      },
      Rows.empty(),
    );

    return yield* contentGuards(built.rows);
  });

const partOf = (children: string) =>
  `<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">${children}</qti-test-part>`;

const sectionOf = (children: string) =>
  `<qti-assessment-section identifier="S" title="S" visible="true">${children}</qti-assessment-section>`;

const sessionControl = `<qti-item-session-control max-attempts="1"/>`;

const adaptive = `<qti-adaptive-selection><qti-adaptive-engine-ref identifier="E" href="e.xml"/></qti-adaptive-selection>`;

const itemRef = `<qti-assessment-item-ref identifier="I" href="i.xml"/>`;

const orderingRefusal = (part: string) =>
  Effect.gen(function* orderingRefusalOfTest() {
    const failure = yield* Effect.flip(guardedTest(part));

    assert.instanceOf(failure, ContentGuardRefusal);
    assert.strictEqual(failure.rule, "ordering");
  });

describe("contentGuards ordering of the test kinds", () => {
  it.effect("refuses a part whose item session control follows a section", () =>
    Effect.gen(function* partOrder() {
      yield* orderingRefusal(partOf(`${sectionOf(itemRef)}${sessionControl}`));
      yield* guardedTest(partOf(`${sessionControl}${sectionOf(itemRef)}`));
    }),
  );

  it.effect("refuses a section holding an adaptive selection and a selection", () =>
    Effect.gen(function* adaptiveAndSelection() {
      yield* orderingRefusal(partOf(sectionOf(`${adaptive}<qti-selection select="1"/>${itemRef}`)));
      yield* guardedTest(partOf(sectionOf(`${adaptive}${itemRef}`)));
      yield* guardedTest(partOf(sectionOf(`<qti-selection select="1"/>${itemRef}`)));
    }),
  );

  it.effect("refuses a section whose ordering precedes its selection", () =>
    Effect.gen(function* selectionOrder() {
      yield* orderingRefusal(
        partOf(sectionOf(`<qti-ordering shuffle="true"/><qti-selection select="1"/>${itemRef}`)),
      );
    }),
  );
});

const cell = "<tr><td>a</td></tr>";

const image = `<img src="a.png" alt="a"/>`;

const stage = `<object data="a.png" type="image/png"/>`;

const choices = `<qti-simple-choice identifier="A">a</qti-simple-choice>`;

const hotspot = (form: string, identifier: string) =>
  `<qti-hotspot-choice identifier="${identifier}" shape="${form}"${form === "default" ? "" : ` coords="1,1,2,2"`}/>`;

const hotspotInteraction = (children: string) =>
  `<qti-hotspot-interaction response-identifier="RESPONSE" max-choices="1">${stage}${children}</qti-hotspot-interaction>`;

const choiceInteraction = (children: string) =>
  `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">${children}</qti-choice-interaction>`;

const gapMatch = (children: string) =>
  `<qti-gap-match-interaction response-identifier="PAIRS">${children}</qti-gap-match-interaction>`;

const mediaInteraction = (children: string) =>
  `<qti-media-interaction response-identifier="RESPONSE" autostart="false">${children}</qti-media-interaction>`;

const feedbackBlock = (children: string) =>
  `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="X" show-hide="show">${children}</qti-feedback-block>`;

const media = `<object data="a.mp4" type="video/mp4"/>`;

const gapText = `<qti-gap-text identifier="G1" match-max="1">a</qti-gap-text>`;

describe("contentGuards ordering", () => {
  it.effect("refuses a 3.0.1 table with tfoot before tbody and admits it in 3.0.0", () =>
    Effect.gen(function* tableOrder() {
      const table = `<table><tfoot>${cell}</tfoot><tbody>${cell}</tbody></table>`;
      yield* refusal("ordering", "3.0.1", table);
      yield* guarded("3.0.0", table);
    }),
  );

  it.effect("refuses a 3.0.0 table with tbody before tfoot", () =>
    Effect.gen(function* tableOrderZero() {
      const table = `<table><tbody>${cell}</tbody><tfoot>${cell}</tfoot></table>`;
      yield* refusal("ordering", "3.0.0", table);
      yield* guarded("3.0.1", table);
    }),
  );

  it.effect("refuses a hotspot interaction whose default hotspot is not last", () =>
    Effect.gen(function* defaultNotLast() {
      yield* refusal(
        "ordering",
        "3.0.1",
        hotspotInteraction(`${hotspot("default", "D")}${hotspot("rect", "A")}`),
      );
      yield* guarded(
        "3.0.1",
        hotspotInteraction(`${hotspot("rect", "A")}${hotspot("default", "D")}`),
      );
    }),
  );

  it.effect("refuses a details whose summary is second", () =>
    Effect.gen(function* summarySecond() {
      yield* refusal("ordering", "3.0.1", `<details><p>a</p><summary>s</summary></details>`);
      yield* guarded("3.0.1", `<details><summary>s</summary><p>a</p></details>`);
    }),
  );

  it.effect("refuses a picture whose img precedes its source", () =>
    Effect.gen(function* imgFirst() {
      const source = `<source src="a.png" srcset="a.png"/>`;
      yield* refusal("ordering", "3.0.1", `<picture>${image}${source}</picture>`);
      yield* guarded("3.0.1", `<picture>${source}${image}</picture>`);
    }),
  );

  it.effect("refuses a choice interaction whose prompt follows a simple choice", () =>
    Effect.gen(function* promptLate() {
      const prompt = `<qti-prompt>p</qti-prompt>`;
      yield* refusal("ordering", "3.0.1", choiceInteraction(`${choices}${prompt}`));
      yield* guarded("3.0.1", choiceInteraction(`${prompt}${choices}`));
    }),
  );

  it.effect("refuses a gap-match whose block content precedes its gap text", () =>
    Effect.gen(function* blockFirst() {
      const block = `<p>a <qti-gap identifier="X"/></p>`;
      yield* refusal("ordering", "3.0.1", gapMatch(`${block}${gapText}`));
      yield* guarded("3.0.1", gapMatch(`${gapText}${block}`));
    }),
  );

  it.effect("refuses a feedback block whose content body precedes its stylesheet", () =>
    Effect.gen(function* bodyFirst() {
      const sheet = `<qti-stylesheet href="a.css" type="text/css"/>`;
      const body = `<qti-content-body><p>a</p></qti-content-body>`;
      yield* refusal("ordering", "3.0.1", feedbackBlock(`${body}${sheet}`));
      yield* guarded("3.0.1", feedbackBlock(`${sheet}${body}`));
    }),
  );
});

describe("contentGuards union-count", () => {
  it.effect("refuses a gap-match with no gap text or image", () =>
    Effect.gen(function* noGaps() {
      yield* refusal("union-count", "3.0.1", gapMatch("<p>a</p>"));
    }),
  );

  it.effect("refuses a hotspot interaction with no object, img or picture", () =>
    Effect.gen(function* noStage() {
      yield* refusal(
        "union-count",
        "3.0.1",
        `<qti-hotspot-interaction response-identifier="RESPONSE" max-choices="1">${hotspot("rect", "A")}</qti-hotspot-interaction>`,
      );
    }),
  );

  it.effect("refuses a media interaction with two media children", () =>
    Effect.gen(function* twoMedia() {
      yield* refusal("union-count", "3.0.1", mediaInteraction(`${media}${media}`));
      yield* guarded("3.0.1", mediaInteraction(media));
    }),
  );

  it.effect("refuses a tr with no cell", () =>
    Effect.gen(function* emptyRow() {
      yield* refusal("union-count", "3.0.1", `<table><tbody><tr/></tbody></table>`);
    }),
  );

  it.effect("refuses a 3.0.1 table holding both tbody and tr and admits it in 3.0.0", () =>
    Effect.gen(function* bothBodies() {
      const table = `<table><tbody>${cell}</tbody>${cell}</table>`;
      yield* refusal("union-count", "3.0.1", table);
      yield* guarded("3.0.0", table);
    }),
  );
});

/**
 * The refusal the guards answer for `rows` themselves, which names `rule` and whose detail
 * mentions `mention`.
 */
const refusalOfRows = (rule: ContentGuardRefusal["rule"], rows: Rows, mention: string) =>
  Effect.gen(function* refusalOfBuiltRows() {
    const failure = yield* Effect.flip(contentGuards(rows));

    assert.instanceOf(failure, ContentGuardRefusal);
    assert.strictEqual(failure.rule, rule);
    assert.include(failure.detail, mention);

    return failure;
  });

/**
 * `rows` with the rows of `relation` replaced by what `edit` makes of them.
 */
const edited = <R extends AnyRelation>(
  rows: Rows,
  relation: R,
  edit: (facts: readonly Fact<R>[]) => readonly Fact<R>[],
): Rows => new Map(rows).set(relation, edit(Rows.of(rows, relation)));

/**
 * The id of the `index`th node of `kind`, in the order the rows hold them.
 */
const nodeId = (rows: Rows, kind: string, index = 0): Uuid => {
  const found = Rows.of(rows, Node).filter((node) => node.kind === kind)[index];
  assert.isDefined(found, `no ${kind} node ${index}`);

  return found.id;
};

/**
 * `rows` with every document read as a `test` document, the rows of its tree unchanged.
 */
const asTest = (rows: Rows): Rows =>
  edited(rows, Document, (facts) => facts.map((fact) => ({ ...fact, root: "test" as const })));

const hottext = (identifier: string) => `<qti-hottext identifier="${identifier}">a</qti-hottext>`;

const hottextInteraction = (children: string) =>
  `<qti-hottext-interaction response-identifier="PAIRS" max-choices="1">${children}</qti-hottext-interaction>`;

const extended = (attributes: string) =>
  `<qti-extended-text-interaction response-identifier="STRINGS"${attributes}/>`;

const outcome = (attributes: string) =>
  `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"${attributes}/>`;

const gapMatchOf = (identifier: string) =>
  gapMatch(`${gapText}<p>a <qti-gap identifier="${identifier}"/></p>`);

describe("contentGuards typed-copy", () => {
  it.effect("refuses a media interaction's plays spelling that differs from its typed count", () =>
    Effect.gen(function* mediaPlays() {
      const rows = yield* rowsOf(
        "3.0.1",
        `<qti-media-interaction response-identifier="RESPONSE" autostart="false" min-plays="+1">${media}</qti-media-interaction>`,
      );
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "typed-copy",
        edited(rows, MediaInteraction, (facts) =>
          facts.map((fact) => ({ ...fact, minPlaysN: 4n })),
        ),
        "does not parse to the typed value",
      );
    }),
  );

  it.effect(
    "refuses an associable hotspot's match-min spelling that differs from its typed count",
    () =>
      Effect.gen(function* hotspotMatchMin() {
        const rows = yield* rowsOf(
          "3.0.1",
          `<qti-graphic-associate-interaction response-identifier="PAIRS"><img src="a.png" alt="a"/><qti-associable-hotspot identifier="H1" shape="rect" coords="0,0,5,5" match-max="1" match-min="03"/><qti-associable-hotspot identifier="H2" shape="rect" coords="6,6,9,9" match-max="1"/></qti-graphic-associate-interaction>`,
        );
        yield* contentGuards(rows);
        yield* refusalOfRows(
          "typed-copy",
          edited(rows, AssociableHotspot, (facts) =>
            facts.map((fact) => ({ ...fact, matchMinN: 1n })),
          ),
          "does not parse to the typed value",
        );
      }),
  );

  it.effect("refuses a gap text's match-max spelling that differs from its typed count", () =>
    Effect.gen(function* gapTextMatchMax() {
      const rows = yield* rowsOf(
        "3.0.1",
        gapMatch(
          `<qti-gap-text identifier="G1" match-max="+2">a</qti-gap-text><p>a <qti-gap identifier="X"/></p>`,
        ),
      );
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "typed-copy",
        edited(rows, GapText, (facts) => facts.map((fact) => ({ ...fact, matchMaxN: 3n }))),
        "does not parse to the typed value",
      );
    }),
  );

  it.effect("refuses an order interaction whose maxBound disagrees with its max-choices", () =>
    Effect.gen(function* maxBoundCopy() {
      const rows = yield* rowsOf(
        "3.0.1",
        `<qti-order-interaction response-identifier="PAIRS" max-choices="2"><qti-simple-choice identifier="A">a</qti-simple-choice></qti-order-interaction>`,
      );
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "typed-copy",
        edited(rows, OrderInteraction, (facts) =>
          facts.map((fact) => ({ ...fact, maxBound: "unlimited" })),
        ),
        "maxBound",
      );
    }),
  );

  it.effect("refuses a NodeLabel value holding a tab", () =>
    Effect.gen(function* labelWithTab() {
      const rows = yield* rowsOf("3.0.1", `<p label="a b">a</p>`);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "typed-copy",
        edited(rows, NodeLabel, (facts) => facts.map((fact) => ({ ...fact, value: "a\tb" }))),
        "tab",
      );
    }),
  );

  it.effect("refuses an AttributeLexical row that does not differ from its typed column", () =>
    Effect.gen(function* lexicalSameForm() {
      const rows = yield* rowsOf("3.0.1", `<p class="a b">a</p>`);
      yield* contentGuards(rows);

      const paragraph = nodeId(rows, "p");
      yield* refusalOfRows(
        "typed-copy",
        Rows.add(rows, AttributeLexical, [
          { attribute: "class", kind: "p", node: paragraph, value: "a b" },
        ]),
        "equals",
      );
    }),
  );

  it.effect("refuses a spelling that does not parse to the typed value beside it", () =>
    Effect.gen(function* spellingOther() {
      const rows = yield* rowsOf("3.0.1", choiceInteraction(choices));
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "typed-copy",
        Rows.add(rows, AttributeSpelling, [
          {
            attribute: "max-choices",
            kind: "qti-choice-interaction",
            node: nodeId(rows, "qti-choice-interaction"),
            value: "+6",
          },
        ]),
        "does not parse to the typed value",
      );
    }),
  );

  it.effect("admits a spelling that parses to the typed value, beside its lexical row", () =>
    Effect.gen(function* spellingAndLexical() {
      const rows = yield* rowsOf("3.0.1", choiceInteraction(choices));
      const node = nodeId(rows, "qti-choice-interaction");
      yield* contentGuards(
        Rows.add(
          Rows.add(rows, AttributeSpelling, [
            { attribute: "max-choices", kind: "qti-choice-interaction", node, value: "+1" },
          ]),
          AttributeLexical,
          [{ attribute: "max-choices", kind: "qti-choice-interaction", node, value: " +1 " }],
        ),
      );
    }),
  );

  it.effect("refuses an AttributeLexical row that processes to a different value", () =>
    Effect.gen(function* lexicalOtherValue() {
      const rows = yield* rowsOf("3.0.1", `<p class=" a  b ">a</p>`);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "typed-copy",
        edited(rows, NodeClass, (facts) =>
          facts.map((fact) => ({ ...fact, value: ClassList("a c") })),
        ),
        "processes to",
      );
    }),
  );

  it.effect("refuses an arm attribute's lexical row that does not process to its column", () =>
    Effect.gen(function* lexicalArmColumn() {
      const built = yield* rowsOf("3.0.1", `<p><a href=" u ">x</a></p>`);
      const anchor = nodeId(built, "a");
      // The importer's anchor step reads `href` after its lexical rows are collected, so it writes no
      // lexical row here; the row it should write is added by hand.
      const rows = Rows.add(built, AttributeLexical, [
        { attribute: "href", kind: "a", node: anchor, value: " u " },
      ]);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "typed-copy",
        edited(rows, A, (facts) => facts.map((fact) => ({ ...fact, href: HyperlinkUri("v") }))),
        "processes to",
      );
    }),
  );

  it.effect(
    "refuses an optional attribute's lexical row that does not process to its relation",
    () =>
      Effect.gen(function* lexicalOptionalColumn() {
        const rows = yield* rowsOf("3.0.1", `<blockquote cite=" c "><p>x</p></blockquote>`);
        yield* contentGuards(rows);
        yield* refusalOfRows(
          "typed-copy",
          edited(rows, BlockquoteCite, (facts) =>
            facts.map((fact) => ({ ...fact, value: CitationUri("d") })),
          ),
          "processes to",
        );
      }),
  );

  it.effect("admits an empty xml:lang and refuses a whitespace-only one (N7)", () =>
    Effect.gen(function* emptyXmlLang() {
      yield* guarded("3.0.1", `<p xml:lang="">a</p>`);
      yield* refusal("typed-copy", "3.0.1", `<p xml:lang="  ">a</p>`);
    }),
  );
});

describe("contentGuards idref-copy", () => {
  it.effect("refuses one AttributeIdref row for a two-token aria-describedby", () =>
    Effect.gen(function* oneOfTwoTokens() {
      const rows = yield* rowsOf("3.0.1", `<p aria-describedby="a b">a</p>`);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "idref-copy",
        edited(rows, AttributeIdref, (facts) => facts.slice(0, 1)),
        "aria-describedby",
      );
    }),
  );

  it.effect("refuses a headers row with no HeadersTarget copy", () =>
    Effect.gen(function* headersWithoutCopy() {
      const rows = yield* rowsOf(
        "3.0.1",
        `<table><tbody><tr><th id="h1">h</th><td headers="h1">a</td></tr></tbody></table>`,
      );
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "idref-copy",
        edited(rows, HeadersTarget, () => []),
        "HeadersTarget",
      );
    }),
  );
});

describe("contentGuards idref-copy for xref", () => {
  const math = `<p><m:math><m:ci id="a">x</m:ci><m:ci xref="a">y</m:ci></m:math></p>`;

  it.effect("admits an xref that is one AttributeIdref row at position 0", () =>
    Effect.gen(function* oneXrefRow() {
      yield* contentGuards(yield* rowsOf("3.0.1", math));
    }),
  );

  it.effect("admits an xref whose source spelling differs from the collapsed value", () =>
    Effect.gen(function* spelledXref() {
      yield* contentGuards(
        yield* rowsOf(
          "3.0.1",
          `<p><m:math><m:ci id="a">x</m:ci><m:ci xref=" a ">y</m:ci></m:math></p>`,
        ),
      );
    }),
  );

  it.effect("refuses a second xref row at position 1", () =>
    Effect.gen(function* twoXrefRows() {
      const rows = yield* rowsOf("3.0.1", math);
      yield* refusalOfRows(
        "idref-copy",
        edited(rows, AttributeIdref, (facts) => [
          ...facts,
          ...facts.map((fact) => ({ ...fact, position: 1n, target: "b" })),
        ]),
        "xref",
      );
    }),
  );

  it.effect("refuses an xref row at position 1 alone", () =>
    Effect.gen(function* shiftedXref() {
      const rows = yield* rowsOf("3.0.1", math);
      yield* refusalOfRows(
        "idref-copy",
        edited(rows, AttributeIdref, (facts) => facts.map((fact) => ({ ...fact, position: 1n }))),
        "xref",
      );
    }),
  );
});

describe("contentGuards varref-copy", () => {
  it.effect("refuses a printed variable base naming a variable with no PrintedVariableVarRef", () =>
    Effect.gen(function* baseWithoutRow() {
      const body = `<p><qti-printed-variable identifier="VAR" base="VAR"/></p>`;
      const rows = yield* rowsOf("3.0.1", body);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "varref-copy",
        edited(rows, PrintedVariableVarRef, () => []),
        "VAR",
      );
    }),
  );

  it.effect("refuses a PrintedVariableVarRef row for an integer base", () =>
    Effect.gen(function* rowForInteger() {
      const named = yield* rowsOf(
        "3.0.1",
        `<p><qti-printed-variable identifier="VAR" base="VAR"/></p>`,
      );
      const integer = yield* rowsOf(
        "3.0.1",
        `<p><qti-printed-variable identifier="VAR" base="16"/></p>`,
      );
      yield* contentGuards(integer);
      yield* refusalOfRows(
        "varref-copy",
        edited(integer, PrintedVariableVarRef, () => Rows.of(named, PrintedVariableVarRef)),
        "integer",
      );
    }),
  );
});

const asRoot = (rows: Rows, root: "section" | "stimulus") =>
  edited(rows, Document, (facts) => facts.map((fact) => ({ ...fact, root })));

describe("contentGuards varref-copy by root", () => {
  const body = `<p><qti-printed-variable identifier="VAR" base="VAR"/></p>`;

  it.effect("reads no printed variable under a section or stimulus root", () =>
    Effect.gen(function* otherRoots() {
      const rows = yield* rowsOf("3.0.1", body);
      const bare = edited(rows, PrintedVariableVarRef, () => []);
      for (const root of ["section", "stimulus"] as const) {
        yield* contentGuards(asRoot(bare, root));
      }
    }),
  );

  it.effect("still refuses the same printed variable under an item root", () =>
    Effect.gen(function* itemRoot() {
      const rows = yield* rowsOf("3.0.1", body);
      yield* refusalOfRows(
        "varref-copy",
        edited(rows, PrintedVariableVarRef, () => []),
        "VAR",
      );
    }),
  );
});

describe("contentGuards on a test root", () => {
  it.effect("refuses a test document with no title as an item's guards do", () =>
    Effect.gen(function* testRequired() {
      const rows = yield* rowsOf("3.0.1", `<p>a</p>`);
      yield* itemGuards(asTest(rows));

      const failure = yield* Effect.flip(itemGuards(asTest(edited(rows, DocumentTitle, () => []))));

      assert.instanceOf(failure, ItemGuardRefusal);
      assert.strictEqual(failure.rule, "typed-copy");
    }),
  );

  it.effect("refuses a test whose language set differs from its DocumentLang rows", () =>
    Effect.gen(function* testLanguageSet() {
      const rows = yield* rowsOf("3.0.1", `<p xml:lang="fr">a</p>`);
      yield* contentGuards(asTest(rows));
      yield* refusalOfRows("lang-set-copy", asTest(edited(rows, DocumentLang, () => [])), "fr");
    }),
  );
});

/**
 * `rows` with each item body read as a stimulus body.
 */
const asStimulus = (rows: Rows): Rows =>
  edited(rows, Node, (facts) =>
    facts.map((fact) =>
      fact.kind === "qti-item-body" ? { ...fact, kind: "qti-stimulus-body" as const } : fact,
    ),
  );

describe("itemGuards body-empty on a stimulus body", () => {
  it.effect("refuses a qti-stimulus-body with no element child", () =>
    Effect.gen(function* emptyStimulusBody() {
      yield* itemGuards(asStimulus(yield* rowsOf("3.0.1", `<p>a</p>`)));

      const failure = yield* Effect.flip(itemGuards(asStimulus(yield* rowsOf("3.0.1", ""))));

      assert.instanceOf(failure, ItemGuardRefusal);
      assert.strictEqual(failure.rule, "body-empty");
    }),
  );
});

describe("contentGuards lang-set-copy", () => {
  it.effect("refuses a DocumentLang set lacking a value a node carries", () =>
    Effect.gen(function* missingLanguage() {
      const rows = yield* rowsOf("3.0.1", `<p xml:lang="fr">a</p>`);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "lang-set-copy",
        edited(rows, DocumentLang, (facts) => facts.filter((fact) => fact.value !== "fr")),
        "fr",
      );
    }),
  );

  it.effect("refuses lomGeneral no on a document whose resource LOM holds a general", () =>
    Effect.gen(function* lomGeneralNo() {
      const rows = yield* rowsOf("3.0.1", `<p xml:lang="fr">a</p>`);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "lang-set-copy",
        Rows.add(rows, ResourceLomGeneral, [
          {
            lom: "33333333-3333-4333-8333-333333333333",
            package: packageId,
            resource: ManifestIdentifier("hand"),
          },
        ]),
        "lomGeneral",
      );
    }),
  );

  it.effect(
    "refuses a ResourceLomLanguageSet that differs from the record's general languages",
    () =>
      Effect.gen(function* lomLanguageSet() {
        const rows = yield* rowsOf("3.0.1", `<p>a</p>`);
        const lom = "33333333-3333-4333-8333-333333333333";
        const withLom = Rows.add(rows, ResourceLom, [
          {
            lom,
            metadata: lom,
            package: packageId,
            resource: ManifestIdentifier("hand"),
            type: "imsqti_item_xmlv3p0",
          },
        ]);
        yield* contentGuards(withLom);
        yield* refusalOfRows(
          "lang-set-copy",
          Rows.add(withLom, ResourceLomLanguageSet, [
            { lom, package: packageId, resource: ManifestIdentifier("hand"), value: "en" },
          ]),
          "ResourceLomLanguageSet",
        );
      }),
  );
});

describe("contentGuards owner-copy", () => {
  it.effect("refuses a Gap.interaction naming another gap-match of the document", () =>
    Effect.gen(function* gapOwner() {
      const body = `${gapMatchOf("X")}${gapMatchOf("Y")}`;
      const rows = yield* rowsOf("3.0.1", body);
      yield* contentGuards(rows);

      const other = nodeId(rows, "qti-gap-match-interaction", 1);
      yield* refusalOfRows(
        "owner-copy",
        edited(rows, Gap, (facts) =>
          facts.map((fact, index) => (index === 0 ? { ...fact, interaction: other } : fact)),
        ),
        "nearest enclosing gap-match",
      );
    }),
  );

  it.effect("refuses a HottextOwner.interaction naming another hottext interaction", () =>
    Effect.gen(function* hottextOwner() {
      const body = `${hottextInteraction(hottext("H"))}${hottextInteraction(hottext("K"))}`;
      const rows = yield* rowsOf("3.0.1", body);
      yield* contentGuards(rows);

      const other = nodeId(rows, "qti-hottext-interaction", 1);
      yield* refusalOfRows(
        "owner-copy",
        edited(rows, HottextOwner, (facts) =>
          facts.map((fact, index) => (index === 0 ? { ...fact, interaction: other } : fact)),
        ),
        "HottextOwner row naming",
      );
    }),
  );

  it.effect("refuses a HottextOwner row for a hottext under a choice interaction's prompt", () =>
    Effect.gen(function* hottextUnderChoice() {
      const body = choiceInteraction(`<qti-prompt>${hottext("H")}</qti-prompt>${choices}`);
      const rows = yield* rowsOf("3.0.1", body);
      yield* contentGuards(rows);
      yield* refusalOfRows(
        "owner-copy",
        Rows.add(rows, HottextOwner, [
          {
            identifier: ChoiceIdentifier("H"),
            interaction: nodeId(rows, "qti-choice-interaction"),
            node: nodeId(rows, "qti-hottext"),
          },
        ]),
        "not a hottext interaction",
      );
    }),
  );

  it.effect("refuses a hottext of a hottext interaction that has no HottextOwner row", () =>
    Effect.gen(function* hottextWithoutOwner() {
      const rows = yield* rowsOf("3.0.1", hottextInteraction(hottext("H")));
      yield* refusalOfRows(
        "owner-copy",
        edited(rows, HottextOwner, () => []),
        "no HottextOwner row",
      );
    }),
  );
});

const masteryRefused = (attributes: string) =>
  Effect.gen(function* masteryRefusedRange() {
    const error = yield* Effect.flip(
      contentGuards(yield* rowsOf("3.0.1", "", outcome(attributes))),
    );
    assert.strictEqual(error.rule, "mastery-range");
  });

const masteryAccepted = (attributes: string) =>
  Effect.gen(function* masteryAcceptedRange() {
    yield* contentGuards(yield* rowsOf("3.0.1", "", outcome(attributes)));
  });

describe("contentGuards conditioned optionals", () => {
  it.effect("refuses an extended-text bound to a multiple response with no max-strings", () =>
    Effect.gen(function* maxStrings() {
      yield* refusal("max-strings-required", "3.0.1", extended(""));
      yield* guarded("3.0.1", extended(` max-strings="2"`));
      yield* guarded("3.0.1", `<qti-extended-text-interaction response-identifier="RESPONSE"/>`);
    }),
  );

  it.effect("refuses aria-valuemax below aria-valuemin", () =>
    Effect.gen(function* ariaRange() {
      yield* refusal("aria-value-range", "3.0.1", `<p aria-valuemax="1" aria-valuemin="2">a</p>`);
      yield* guarded("3.0.1", `<p aria-valuemax="2.5" aria-valuemin="2.25">a</p>`);
      yield* guarded("3.0.1", `<p aria-valuemax="-1" aria-valuemin="-2">a</p>`);
      yield* refusal(
        "aria-value-range",
        "3.0.1",
        `<p aria-valuemax="-2" aria-valuemin="-1.5">a</p>`,
      );
    }),
  );

  it.effect("refuses a mastery-value above normal-maximum or below normal-minimum", () =>
    Effect.gen(function* masteryRange() {
      const high = yield* Effect.flip(
        contentGuards(yield* rowsOf("3.0.1", "", outcome(` normal-maximum="1" mastery-value="2"`))),
      );
      assert.strictEqual(high.rule, "mastery-range");

      const low = yield* Effect.flip(
        contentGuards(
          yield* rowsOf("3.0.1", "", outcome(` normal-minimum="1" mastery-value="0.5"`)),
        ),
      );
      assert.strictEqual(low.rule, "mastery-range");
      yield* contentGuards(
        yield* rowsOf(
          "3.0.1",
          "",
          outcome(` normal-minimum="0" mastery-value="0.5" normal-maximum="1"`),
        ),
      );
    }),
  );

  it.effect("reads an overflowing mastery-range literal as the largest finite double", () =>
    Effect.gen(function* overflow() {
      yield* masteryRefused(` normal-maximum="1e400" mastery-value="INF"`);
      yield* masteryAccepted(` normal-maximum="INF" mastery-value="1e400"`);
      yield* masteryAccepted(` normal-minimum="-INF" mastery-value="-1e400"`);
      yield* masteryRefused(` normal-minimum="-1e400" mastery-value="-INF"`);
      yield* masteryAccepted(` normal-maximum="1.7976931348623157e308" mastery-value="1e400"`);
    }),
  );

  it.effect("refuses a string-identifier equal to the response-identifier", () =>
    Effect.gen(function* stringIdentifier() {
      yield* refusal(
        "string-identifier-distinct",
        "3.0.1",
        `<qti-text-entry-interaction response-identifier="RESPONSE" string-identifier="RESPONSE"/>`,
      );
      yield* guarded(
        "3.0.1",
        `<qti-text-entry-interaction response-identifier="RESPONSE" string-identifier="OTHER"/>`,
      );
    }),
  );
});

describe("contentGuards same-table-headers", () => {
  it.effect("refuses a td whose headers name a th of another table", () =>
    Effect.gen(function* otherTable() {
      const first = `<table><tbody><tr><th id="h1">h</th></tr></tbody></table>`;
      const same = `<table><tbody><tr><th id="h2">h</th><td headers="h2">a</td></tr></tbody></table>`;
      const other = `<table><tbody><tr><td headers="h1">a</td></tr></tbody></table>`;
      yield* guarded("3.0.1", `${first}${same}`);
      yield* refusal("same-table-headers", "3.0.1", `${first}${other}`);
    }),
  );
});

describe("contentGuards q-punctuation", () => {
  it.effect("refuses quotation punctuation before, after or inside a q", () =>
    Effect.gen(function* quotes() {
      yield* guarded("3.0.1", `<p>say <q>x</q> now</p>`);
      yield* refusal("q-punctuation", "3.0.1", `<p>say "<q>x</q></p>`);
      yield* refusal("q-punctuation", "3.0.1", `<p><q>x</q>” now</p>`);
      yield* refusal("q-punctuation", "3.0.1", `<p><q>"x</q></p>`);
      yield* refusal("q-punctuation", "3.0.1", `<p><q>x&quot;</q></p>`);
    }),
  );

  it.effect("admits an apostrophe beside a q", () =>
    Effect.gen(function* apostrophes() {
      yield* guarded("3.0.1", `<p>the students'<q>x</q></p>`);
      yield* guarded("3.0.1", `<p>the students’<q>x</q></p>`);
      yield* guarded("3.0.1", `<p>it&apos;<q>x</q></p>`);
    }),
  );
});
