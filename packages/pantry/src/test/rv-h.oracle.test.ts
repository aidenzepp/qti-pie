/**
 * The law oracle's HTML element laws (slice RV-H; spec readings 124 to 126): over whole packages,
 * a `source` in a `picture` without `srcset` and one in a `video` without `src` are refused under
 * `source-srcset` and `source-src`, a `track` in the subtitles state without `srclang` under
 * `track-srclang`, and a cell whose `headers` name no `th` of its own table under `table-headers`;
 * each with the nearest valid package beside it, accepted.
 *
 * Each case is the base item of `laws.oracle.test.ts` with one edit of its body, so the case's
 * verdict is its edit's: every other law holds.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf, shownBreach, verdictOf } from "#pantry/test/oracle.ts";
import type { Judgment, LawName, OracleRule } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The manifest of the one-item package, under 3.0.1.
 */
const manifest = `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources>
</manifest>`;

/**
 * Write the one-item package whose body holds the markup: a valid item but for what the markup
 * breaks.
 *
 * @param body - The item body's content.
 * @returns The package's entries, as `readPackage` reads them.
 */
const packageOf = (body: string): readonly PackageFile[] =>
  Object.entries({
    "imsmanifest.xml": manifest,
    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
  }).map(([path, text]): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));

/**
 * An external image, which the package's reference laws admit and never resolve.
 */
const image = "https://example.com/a.png";

/**
 * Write a judgment for an assertion's message: its verdict, or its breaches line by line.
 *
 * @param judgment - The judgment.
 * @returns The text.
 */
const shown = (judgment: Judgment): string =>
  judgment._tag === "Judged"
    ? judgment.breaches.map((breach) => shownBreach(breach, grammar)).join("\n")
    : `the codec refused the package: ${judgment.rule}, ${judgment.detail}`;

/**
 * One package of the HTML laws: its body, and the law and rule it is refused under, or none for a
 * package every law holds of.
 */
interface HtmlCase {
  readonly body: string;
  readonly name: string;
  readonly refused?: { readonly law: LawName; readonly rule: OracleRule };
}

/**
 * The cases, each refused one beside the nearest valid package.
 */
const cases: readonly HtmlCase[] = [
  {
    body: `<p><picture><source src="${image}"/><img src="${image}" alt="a"/></picture></p>`,
    name: "a picture's source with src and no srcset",
    refused: { law: "Picture source srcset", rule: "source-srcset" },
  },
  {
    body: `<p><picture><source srcset="${image}"/><img src="${image}" alt="a"/></picture></p>`,
    name: "a picture's source with srcset",
  },
  {
    body: `<div><video src="https://example.com/v.mp4"><source/></video></div>`,
    name: "a video's source with no src",
    refused: { law: "Media source src", rule: "source-src" },
  },
  {
    body: `<div><video><source src="https://example.com/v.mp4"/></video></div>`,
    name: "a video's source with src",
  },
  {
    body: `<div><video src="https://example.com/v.mp4"><track kind="subtitles" src="https://example.com/a.vtt"/></video></div>`,
    name: "a subtitles track with no srclang",
    refused: { law: "Track srclang", rule: "track-srclang" },
  },
  {
    body: `<div><video src="https://example.com/v.mp4"><track src="https://example.com/a.vtt" srclang="en"/></video></div>`,
    name: "a track with no kind and a srclang",
  },
  {
    body: `<div><video src="https://example.com/v.mp4"><track src="https://example.com/a.vtt" srclang="english language"/></video></div>`,
    name: "a track whose srclang is no BCP 47 tag",
    refused: { law: "value domain", rule: "attribute-lexical" },
  },
  {
    body: `<table><tbody><tr><th id="h1">h</th></tr></tbody></table><table><tbody><tr><th id="h2">h</th><td headers="h2">a</td></tr></tbody></table>`,
    name: "a td whose headers name a th of its own table",
  },
  {
    body: `<table><tbody><tr><th id="h1">h</th></tr></tbody></table><table><tbody><tr><td headers="h1">a</td></tr></tbody></table>`,
    name: "a td whose headers name a th of another table",
    refused: { law: "Table headers", rule: "table-headers" },
  },
  {
    body: `<table><tbody><tr><td id="d1">d</td><td headers="d1">a</td></tr></tbody></table>`,
    name: "a td whose headers name a td of its table",
    refused: { law: "Table headers", rule: "table-headers" },
  },
  {
    body: `<table><tbody><tr><th id="h1">h</th><td>a</td></tr><tr><td><table><tbody><tr><td headers="h1">b</td></tr></tbody></table></td></tr></tbody></table>`,
    name: "a td of a nested table whose headers name a th of the enclosing table",
    refused: { law: "Table headers", rule: "table-headers" },
  },
  {
    body: `<table><tbody><tr><th id="h1">h</th><td headers="h1 h1">a</td></tr></tbody></table>`,
    name: "a td whose headers name one th twice",
    refused: { law: "Table headers", rule: "table-headers" },
  },
  {
    body: `<table><tbody><tr><th id="h1">h</th><th id="h2" headers="h1">i</th><td headers=" h2  h1 ">a</td></tr></tbody></table>`,
    name: "a th and a td whose headers name ths of their own table, padded",
  },
];

describe("test/oracle.ts, the HTML element laws (RV-H)", () => {
  for (const { body, name, refused } of cases) {
    it.effect(`${refused === undefined ? "accepts" : "refuses"} ${name}`, () =>
      // Oracle: the specification as a checker: info §5.135.3 and §5.135.1, read per context as
      // the HTML Standard states them (reading 124); §5.163.3 with HTML's missing value default
      // (reading 125); §5.140.1 (reading 126); and, for srclang, BCP 47's grammar (reading 129).
      Effect.gen(function* judged() {
        const judgment = yield* judge(packageOf(body), grammar, laws);

        assert.deepStrictEqual(
          verdictOf(judgment),
          refused === undefined
            ? { verdict: "accepted" }
            : { rule: refused.rule, verdict: "refused" },
          shown(judgment),
        );
        if (refused !== undefined && judgment._tag === "Judged") {
          assert.include(
            judgment.breaches.map(({ law }) => law),
            refused.law,
            shown(judgment),
          );
        }
      }),
    );
  }
});
