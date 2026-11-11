/**
 * A resource's LOM record names the document its `href` resolves to (spec reading 93; readings 102
 * and 103: the value collapsed, resolved against the manifest and the `xml:base` in scope, its dot
 * segments removed and its percent-escapes decoded), so the `lom-title` law reads the record's
 * object, and judges its title string against the object's `title` (QTI 3.0 Metadata §2.7.1.2:
 * "The title must have a value that matches the value of the title attribute of the associated
 * item, test or object bank"), however the `href` spells the document's path. Issue #65 found the
 * law oracle comparing the resource's raw `href` with each document's path, so a spelling that is
 * no entry's own, with a dot segment or a percent-escape, read no object and raised nothing where
 * the import's database refuses the title under `lom-title`.
 *
 * Oracle: the specification as a checker, §2.7.1.2 over the path an `href` resolves to as stated
 * above, against the law oracle (`#pantry/test/oracle.ts` `judge`, through
 * `#pantry/test/gen/genetic/judge.ts` `judgeOne`, which also builds the import's rows). The host
 * judge leaves a rule over a query unjudged, so the import's side states no law here: it builds
 * every row and holds none broken, and the database's refusal under `lom-title` is the database
 * tier's (`#pantry/qti/metadata.db.test.ts`).
 *
 * Bound: a package of one item resource listing its item and carrying one record, whose general
 * title is the item's own or another, for each of 4 spellings of the `href`: a dot segment, a
 * percent-escaped unreserved character, a percent-escaped space, and the path as the entry holds
 * it. 8 cases in three boxes, each exhausted: `[65-1]` the 3 escaped spellings under another title,
 * `[65-2]` the same under the item's title, and `[65-3]` the plain spelling under both.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's tests state: a hang guard.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The text every XML file of the cases opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';

/**
 * The item's `title`, which a record's title string matches.
 */
const itemTitle = "t";

/**
 * A title that is not the item's.
 */
const otherTitle = "X";

/**
 * One way the resource's `href` spells the item's path: the `href` as written, and the entry it
 * names.
 */
interface Spelling {
  readonly href: string;
  readonly name: string;
  readonly path: string;
}

/**
 * The spellings that are no entry's own path, each of which resolves to its `path` (RFC 3986
 * §5.2.4, §2.1, §6.2.2).
 */
const escaped: readonly Spelling[] = [
  { href: "./items/item.xml", name: "a dot segment", path: "items/item.xml" },
  {
    href: "items/it%65m.xml",
    name: "a percent-escaped unreserved character",
    path: "items/item.xml",
  },
  { href: "items/my%20item.xml", name: "a percent-escaped space", path: "items/my item.xml" },
];

/**
 * The spelling that is the entry's own path.
 */
const plain: Spelling = {
  href: "items/item.xml",
  name: "the entry's own path",
  path: "items/item.xml",
};

/**
 * One case: what it is, the package, and whether its record's title is another than the item's.
 */
interface Case {
  readonly entries: PackageEntries;
  readonly mismatched: boolean;
  readonly name: string;
}

/**
 * The manifest of a package whose one item resource writes `href` and lists its file by the same
 * spelling, its record's general title `title`.
 *
 * @param href - The `href` of the resource and of its file.
 * @param title - The record's title string.
 * @returns The manifest's text.
 */
const manifestOf = (href: string, title: string): string =>
  `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="R1" type="imsqti_item_xmlv3p0" href="${href}"><metadata><imsmd:lom><imsmd:general><imsmd:title><imsmd:string language="en">${title}</imsmd:string></imsmd:title></imsmd:general></imsmd:lom></metadata><file href="${href}"/></resource></resources></manifest>`;

/**
 * The item the resource lists: identifier `i1`, `title` {@link itemTitle}, one choice interaction.
 */
const item = `${declaration}<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i1" title="${itemTitle}" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A">A</qti-simple-choice><qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;

/**
 * Build the case of a spelling and a record title.
 *
 * @param spelling - How the `href` spells the item's path.
 * @param title - The record's title string.
 * @returns The case.
 */
const caseOf = (spelling: Spelling, title: string): Case => ({
  entries: new Map(
    Object.entries({
      "imsmanifest.xml": manifestOf(spelling.href, title),
      [spelling.path]: item,
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  ),
  mismatched: title !== itemTitle,
  name: `a record titled ${JSON.stringify(title)} of an item titled ${JSON.stringify(itemTitle)}, its resource's href ${JSON.stringify(spelling.href)} (${spelling.name})`,
});

/**
 * `[65-1]`: the escaped spellings under a title that is not the item's.
 */
const mismatching: readonly Case[] = escaped.map((spelling) => caseOf(spelling, otherTitle));

/**
 * `[65-2]`: the escaped spellings under the item's own title.
 */
const matching: readonly Case[] = escaped.map((spelling) => caseOf(spelling, itemTitle));

/**
 * `[65-3]`: the plain spelling under each title.
 */
const control: readonly Case[] = [otherTitle, itemTitle].map((title) => caseOf(plain, title));

/**
 * Judge every case of a box both ways and hold each to the specification: the law oracle raises
 * `LomObjectTitle` exactly where the record's title is not the item's, the import's rows are built
 * with no law the host judges broken, and the two sides never disagree.
 *
 * @param box - The box's suite name, its words and its cases.
 * @param box.cases - The cases.
 * @param box.name - The suite's name.
 * @param box.words - The box in words.
 * @returns The exhaustion of the box.
 */
const exhausting = (box: {
  readonly cases: readonly Case[];
  readonly name: string;
  readonly words: string;
}) =>
  Effect.gen(function* titleHrefRuns() {
    const directory = yield* scratchDirectory("lom-title-href-");
    const bench = { directory, grammar, laws };

    return yield* exhaust(
      {
        box: box.words,
        caseHang: Duration.minutes(5),
        coverage: noCoverage,
        generator: int(0, box.cases.length - 1),
        limit: box.cases.length,
        literal: (at) => box.cases[at]?.name ?? String(at),
        oracle: {
          kind: "specification",
          name: "§2.7.1.2 over the path an href resolves to, against the law oracle",
        },
        suite: `pantry/lom-title-href/${box.name}`,
      },
      (at) =>
        Effect.gen(function* titleHrefCase() {
          const of = box.cases[at];
          assert.isDefined(of, `no case ${String(at)}`);
          if (of === undefined) {
            return;
          }

          const judged = yield* judgeOne(yield* genomeOf(of.entries), bench, at);
          const said = `${of.name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;

          assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
          assert.strictEqual(
            judged.summary.oracle,
            of.mismatched ? "laws LomObjectTitle" : "laws ",
            said,
          );
          assert.strictEqual(judged.summary.import, "built ", said);
        }),
    );
  }).pipe(Effect.scoped);

layer(NodeServices.layer, { excludeTestServices: true })(
  "a record's title, against the item its resource's href resolves to",
  (it) => {
    it.effect(
      "[65-1] breaks lom-title in the law oracle where the title is not the item's, through a dot segment, a percent-escaped unreserved character and a percent-escaped space",
      (ctx) =>
        searched(
          ctx,
          Effect.suspend(() => {
            assert.strictEqual(mismatching.length, 3);

            return exhausting({
              cases: mismatching,
              name: "mismatched",
              words:
                "3 escaped spellings of an item's href, each under a record title that is not the item's",
            });
          }),
        ),
      testTimeoutMs,
    );

    it.effect(
      "[65-2] holds lom-title in the law oracle where the title is the item's, through the same three spellings",
      (ctx) =>
        searched(
          ctx,
          Effect.suspend(() => {
            assert.strictEqual(matching.length, 3);

            return exhausting({
              cases: matching,
              name: "matched",
              words:
                "3 escaped spellings of an item's href, each under a record title that is the item's",
            });
          }),
        ),
      testTimeoutMs,
    );

    it.effect(
      "[65-3] judges the href that is the entry's own path as before, under either title",
      (ctx) =>
        searched(
          ctx,
          Effect.suspend(() => {
            assert.strictEqual(control.length, 2);

            return exhausting({
              cases: control,
              name: "plain",
              words: "an item's href that is the entry's own path, under each of 2 record titles",
            });
          }),
        ),
      testTimeoutMs,
    );
  },
);
