/**
 * Decision 309's three nesting cases and decision 216's positive, judged on catalog cards by the
 * law oracle: the nesting rules reach card content through the flags a host enters, so a card
 * carries the ancestry of the element that holds its catalog.
 *
 * The cases are verdicts the composed grammar already gives; each is judged as a whole package and
 * read through "N6 ancestry" alone (its rule, `ancestry-ban`, is pinned by `oracle.test.ts`'s law
 * cases), except decision 216's, which no law may refuse.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  base,
  breachesOf,
  edit,
  item,
  judged,
  manifestOf,
  itemResource,
  shown,
} from "#pantry/test/probe.ts";

/**
 * A catalog info whose one card holds one passage of HTML content.
 *
 * @param html - The card's `qti-html-content` children, as written.
 * @returns The `qti-catalog-info`.
 */
const catalogOf = (html: string): string =>
  `<qti-catalog-info><qti-catalog id="C"><qti-card support="spoken"><qti-html-content>${html}</qti-html-content></qti-card></qti-catalog></qti-catalog-info>`;

/**
 * Judge the base item edited by each passage and its replacement, in order.
 *
 * @param edits - Each passage of the item and its replacement.
 * @param files - The package's other files, replacing the base's.
 * @returns The judgment's breaches.
 */
const judgedEdits = (
  edits: readonly (readonly [string, string])[],
  files: Readonly<Record<string, string>> = base,
) =>
  Effect.gen(function* judgedItem() {
    let text = item;
    for (const [passage, replacement] of edits) {
      text = edit(text, passage, replacement);
    }

    return breachesOf(yield* judged({ ...files, "item.xml": text }));
  });

/**
 * The breaches of "N6 ancestry", the law nesting is stated by.
 *
 * @param breaches - A judgment's breaches.
 * @returns The ancestry breaches.
 */
const ancestryOf = (breaches: ReturnType<typeof breachesOf>): ReturnType<typeof breachesOf> =>
  breaches.filter(({ law }) => law === "N6 ancestry");

/**
 * An item whose second interaction is a gap match, with its response declared and its gap text
 * given; the interaction's body is the passage under test.
 *
 * @param body - What follows the gap text inside the interaction.
 * @returns The edits that build the item from the base.
 */
const gapMatchEdits = (body: string): readonly (readonly [string, string])[] => [
  [
    `<qti-outcome-declaration identifier="SCORE"`,
    `<qti-response-declaration identifier="GAPS" cardinality="multiple" base-type="directedPair"/><qti-outcome-declaration identifier="SCORE"`,
  ],
  [
    `</qti-choice-interaction>`,
    `</qti-choice-interaction><qti-gap-match-interaction response-identifier="GAPS" max-associations="1"><qti-gap-text identifier="W" match-max="1">w</qti-gap-text>${body}</qti-gap-match-interaction>`,
  ],
];

describe("catalog cards under decision 309's nesting rules", () => {
  it.effect(
    "A: a text entry in a card of a modal feedback's catalog breaks N6 ancestry once, under ancestry-ban",
    () =>
      Effect.gen(function* modalCard() {
        const breaches = yield* judgedEdits([
          [
            `</qti-response-processing>`,
            `</qti-response-processing><qti-modal-feedback outcome-identifier="SCORE" identifier="X" show-hide="show"><qti-content-body><p>Well done.</p></qti-content-body>${catalogOf(`<div><qti-text-entry-interaction response-identifier="RESPONSE"/></div>`)}</qti-modal-feedback>`,
          ],
        ]);
        const ancestry = ancestryOf(breaches);

        assert.deepStrictEqual(
          ancestry.map(({ keys }) => keys["kind"]),
          ["qti-text-entry-interaction"],
          shown(breaches),
        );
        assert.include(String(ancestry[0]?.keys["parentAncestry"]), "modal");
      }),
  );

  it.effect(
    "B: a gap in a card of a feedback block's catalog, inside a gap match, breaks no N6 ancestry",
    () =>
      Effect.gen(function* gapCard() {
        const breaches = yield* judgedEdits(
          gapMatchEdits(
            `<div><qti-feedback-block outcome-identifier="SCORE" identifier="X" show-hide="show"><qti-content-body><p>Hint.</p></qti-content-body>${catalogOf(`<p><qti-gap identifier="W"/></p>`)}</qti-feedback-block></div>`,
          ),
        );

        assert.deepStrictEqual(ancestryOf(breaches), [], shown(breaches));
      }),
  );

  it.effect(
    "nested: a choice interaction in a card of a portable custom interaction's catalog breaks N6 ancestry",
    () =>
      Effect.gen(function* pciCard() {
        const breaches = yield* judgedEdits(
          [
            [
              `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>`,
              `<qti-portable-custom-interaction response-identifier="RESPONSE" module="m" custom-interaction-type-identifier="t"><qti-interaction-modules><qti-interaction-module id="m" primary-path="m.js"/></qti-interaction-modules><qti-interaction-markup/>${catalogOf(`<div><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A">A</qti-simple-choice></qti-choice-interaction></div>`)}</qti-portable-custom-interaction>`,
            ],
          ],
          { "imsmanifest.xml": manifestOf(itemResource, "3.0.1") },
        );

        const ancestry = ancestryOf(breaches);

        assert.deepStrictEqual(
          ancestry.map(({ keys }) => keys["kind"]),
          ["qti-choice-interaction"],
          shown(breaches),
        );
        assert.include(String(ancestry[0]?.keys["parentAncestry"]), "int");
      }),
  );

  it.effect(
    "decision 216: a printed variable and a choice interaction in an item-level card break no law",
    () =>
      Effect.gen(function* itemCard() {
        const breaches = yield* judgedEdits([
          [
            `<qti-outcome-declaration identifier="SCORE"`,
            `<qti-response-declaration identifier="CARD" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="SCORE"`,
          ],
          [
            `</qti-item-body>`,
            `</qti-item-body>${catalogOf(`<p><qti-printed-variable identifier="SCORE"/></p><div><qti-choice-interaction response-identifier="CARD" max-choices="1"><qti-simple-choice identifier="CA">A</qti-simple-choice></qti-choice-interaction></div>`)}`,
          ],
        ]);

        assert.deepStrictEqual(breaches, [], shown(breaches));
      }),
  );
});
