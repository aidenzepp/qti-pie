import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { ContentGuardRefusal, contentGuards } from "#qti/import/guards/content.ts";
import { itemRows } from "#qti/import/item.ts";
import { Rows } from "#qti/import/tree.ts";
import type { SchemaVersionHandle } from "#qti/schema/node.ts";
import { readXml } from "#qti/xml/read.ts";

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
  `<qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>`,
].join("");

/**
 * The rows the item passes build for a hand-written item whose body is `body`, read as `version`.
 */
const rowsOf = (version: SchemaVersionHandle, body: string) =>
  Effect.gen(function* handWrittenRows() {
    const text = `<qti-assessment-item xmlns="${itemNamespace}" identifier="hand" title="Hand" time-dependent="false">${declarations}<qti-item-body>${body}</qti-item-body></qti-assessment-item>`;
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
