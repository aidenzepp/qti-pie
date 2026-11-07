/**
 * The HTML overlays' free tests: their statements build beside the layers they read, each check is
 * named by an oracle law, and the oracle's three HTML laws hold exactly where the information model
 * says, over a box of each: a `source` under each parent with each of its two attributes, a `track`
 * of each `kind` with and without `srclang`, and a cell of either of two nested tables whose
 * `headers` names each kind of target.
 *
 * The database tests (`html.db.test.ts`) judge the laws through PostgreSQL, and the builder's tests
 * (`#pantry/import/overlays/html.test.ts`) its rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { boolean, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import { htmlLaws, htmlRelations } from "#pantry/qti/html.ts";
import { identityLaws, identityRelations } from "#pantry/qti/identity.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { judge, lawNames, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";
import type { Breach, Judgment, LawName } from "#pantry/test/oracle.ts";

/**
 * How long building a schema over every relation of `Qti` may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 */
const buildTimeout = 60_000;

describe("qti/html.ts, declared", { timeout: buildTimeout }, () => {
  it("builds a schema of Node, the character data, the attribute layer, the identity and the HTML overlays with every law, each statement once", () => {
    const built = schema(
      "HtmlLayer",
      { ...Qti.relations, ...identityRelations, ...htmlRelations },
      [...nodeLaws, ...chardataLaws, ...attributeLaws, ...identityLaws, ...htmlLaws],
    );

    for (const relation of Object.values(htmlRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(htmlLaws).size, htmlLaws.length);
    assert.strictEqual(
      built.statements.length,
      nodeLaws.length +
        chardataLaws.length +
        attributeLaws.length +
        identityLaws.length +
        htmlLaws.length,
    );
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = htmlLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );
    const rules = new Map(
      named.map((name) => {
        const law = lawNames.find((known) => known === name);
        assert.isDefined(law, `${name} is no oracle law`);

        return [name, law === undefined ? "" : ruleOf(law)] as const;
      }),
    );

    assert.deepStrictEqual(
      new Map([
        ["E1 derived", "derived"],
        ["Media source src", "source-src"],
        ["Picture source srcset", "source-srcset"],
        ["Track srclang", "track-srclang"],
      ]),
      new Map([...rules].toSorted(([a], [b]) => (a < b ? -1 : 1))),
    );
    assert.strictEqual(ruleOf("Table headers"), "table-headers");
  });
});

/**
 * The composed grammar every case judges by, and the tables its laws read.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the oracle's laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write the one-item package whose body holds the markup, under 3.0.1.
 *
 * @param body - The item body's content.
 * @returns The package's entries, as `readPackage` reads them.
 */
const packageOf = (body: string): readonly PackageFile[] =>
  Object.entries({
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
  }).map(([path, text]): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));

/**
 * Judge a body and read the breaches of the laws a box reads, each as `law at kind`; a codec
 * refusal fails the case.
 *
 * @param body - The item body's content.
 * @param read - The laws the box reads.
 * @returns The breaches of those laws, in the oracle's order, and every breach, for a message.
 */
const breachesOf = (body: string, read: readonly LawName[]) =>
  Effect.map(judge(packageOf(body), grammar, laws), (judgment: Judgment) => {
    const breaches: readonly Breach[] =
      judgment._tag === "Judged"
        ? judgment.breaches
        : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);

    return {
      all: breaches.map((breach) => shownBreach(breach, grammar)).join("\n"),
      read: breaches
        .filter(({ law }) => read.includes(law))
        .map(({ keys, law }) => `${law} at ${keys["kind"] ?? ""}`),
    };
  });

/**
 * An external URL, which the package's reference laws admit and never resolve.
 */
const url = "https://example.com/a";

/**
 * One choice of the source box: the `source`'s parent and whether it writes `src` and `srcset`.
 */
interface SourceCase {
  readonly parent: "audio" | "picture" | "video";
  readonly src: boolean;
  readonly srcset: boolean;
}

/**
 * Every choice of the source box.
 */
const sourceCases: Gen<SourceCase> = (source) => ({
  parent: source.draw(element(["audio", "picture", "video"] as const)),
  src: source.draw(boolean),
  srcset: source.draw(boolean),
});

/**
 * A situation the source box must reach: each parent's source refused and accepted.
 */
type SourceSituation =
  | "picture refused"
  | "picture accepted"
  | "media refused"
  | "media accepted"
  | "both written";

describe(
  "test/oracle.ts, Picture source srcset and Media source src",
  { timeout: buildTimeout },
  () => {
    it.effect(
      "breaks once, at the source, exactly when a picture's source lacks srcset or a media element's lacks src",
      (ctx) =>
        // Oracle: the specification as a checker, info §5.135.3 ("This attribute is required when
        // 'source' is used in 'picture'") and §5.135.1 ("This characteristic must be present"),
        // read in a media element as the HTML Standard splits it (reading 124).
        // Bound: every source under a picture, an audio or a video, with or without src and srcset,
        // 12.
        searched(
          ctx,
          exhaust(
            {
              box: "every source under a picture, an audio or a video, each of src and srcset written or not",
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<SourceSituation>([
                "picture refused",
                "picture accepted",
                "media refused",
                "media accepted",
                "both written",
              ]),
              generator: sourceCases,
              limit: 20,
              literal: (drawn) => JSON.stringify(drawn),
              oracle: {
                kind: "specification",
                name: "the information model's Source, §5.135.1 and §5.135.3, as HTML splits them",
              },
              suite: "qti/html-source",
            },
            (drawn: SourceCase, c) =>
              Effect.gen(function* sources() {
                const written = [
                  drawn.src ? ` src="${url}.mp4"` : "",
                  drawn.srcset ? ` srcset="${url}.png"` : "",
                ].join("");
                const body =
                  drawn.parent === "picture"
                    ? `<p><picture><source${written}/><img src="${url}.png" alt="a"/></picture></p>`
                    : `<div><${drawn.parent}><source${written}/></${drawn.parent}></div>`;
                const picture = drawn.parent === "picture";
                const refused = picture ? !drawn.srcset : !drawn.src;
                c.note(`${picture ? "picture" : "media"} ${refused ? "refused" : "accepted"}`);
                if (drawn.src && drawn.srcset) {
                  c.note("both written");
                }

                const { all, read } = yield* breachesOf(body, [
                  "Picture source srcset",
                  "Media source src",
                ]);

                assert.deepStrictEqual(
                  read,
                  refused
                    ? [`${picture ? "Picture source srcset" : "Media source src"} at source`]
                    : [],
                  `${JSON.stringify(drawn)}\n${all}`,
                );
              }),
          ),
        ),
    );
  },
);

/**
 * One choice of the track box: the `track`'s `kind`, none for one it does not write, and whether
 * it writes `srclang`.
 */
interface TrackCase {
  readonly kind: "captions" | "metadata" | "none" | "subtitles";
  readonly srclang: boolean;
}

/**
 * Every choice of the track box.
 */
const trackCases: Gen<TrackCase> = (source) => ({
  kind: source.draw(element(["none", "subtitles", "captions", "metadata"] as const)),
  srclang: source.draw(boolean),
});

/**
 * A situation the track box must reach: the missing value default and a written subtitles state,
 * each refused, another state with no `srclang`, and a subtitles track with one.
 */
type TrackSituation = "default refused" | "subtitles refused" | "other state" | "labelled";

describe("test/oracle.ts, Track srclang", { timeout: buildTimeout }, () => {
  it.effect(
    "breaks once, at the track, exactly when a track in the subtitles state, its kind written or defaulted, lacks srclang",
    (ctx) =>
      // Oracle: the specification as a checker, info §5.163.3 ("This attribute must be present if
      // the tag's kind attribute is in the subtitles state") with the HTML Standard's missing
      // value default, the subtitles state (reading 125).
      // Bound: every track of no kind, subtitles, captions or metadata, with or without srclang, 8.
      searched(
        ctx,
        exhaust(
          {
            box: "every track of each kind or none, with or without srclang",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<TrackSituation>([
              "default refused",
              "subtitles refused",
              "other state",
              "labelled",
            ]),
            generator: trackCases,
            limit: 10,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the information model's Track, §5.163.3, with HTML's missing value default",
            },
            suite: "qti/html-track",
          },
          (drawn: TrackCase, c) =>
            Effect.gen(function* tracks() {
              const subtitles = drawn.kind === "none" || drawn.kind === "subtitles";
              const refused = subtitles && !drawn.srclang;
              const situation = (): TrackSituation => {
                if (!subtitles) {
                  return "other state";
                }

                if (drawn.srclang) {
                  return "labelled";
                }

                return drawn.kind === "none" ? "default refused" : "subtitles refused";
              };
              c.note(situation());

              const { all, read } = yield* breachesOf(
                `<div><video src="${url}.mp4"><track src="${url}.vtt"${drawn.kind === "none" ? "" : ` kind="${drawn.kind}"`}${drawn.srclang ? ' srclang="en"' : ""}/></video></div>`,
                ["Track srclang"],
              );

              assert.deepStrictEqual(
                read,
                refused ? ["Track srclang at track"] : [],
                `${JSON.stringify(drawn)}\n${all}`,
              );
            }),
        ),
      ),
  );
});

/**
 * One choice of the headers box: the table the cell under test stands in, and the element its
 * `headers` names: a `th` or a `td` of either table, a paragraph, or no element.
 */
interface HeadersCase {
  readonly cell: "inner" | "outer";
  readonly target: "di" | "do" | "hi" | "ho" | "pp" | "zz";
}

/**
 * Every choice of the headers box.
 */
const headersCases: Gen<HeadersCase> = (source) => ({
  cell: source.draw(element(["outer", "inner"] as const)),
  target: source.draw(element(["ho", "hi", "do", "di", "pp", "zz"] as const)),
});

/**
 * A situation the headers box must reach: a header of the cell's own table, one of the other
 * table (enclosing and nested), a `td`, an element that is no cell, and no element.
 */
type HeadersSituation =
  | "own header"
  | "enclosing table's header"
  | "nested table's header"
  | "a td"
  | "no cell"
  | "dangling";

/**
 * The body of the headers box: an outer table holding `th#ho` and `td#do`, an inner table in a cell
 * of it holding `th#hi` and `td#di`, a paragraph `p#pp`, and the cell under test in the table it
 * names.
 *
 * @param drawn - The case.
 * @returns The item body's content.
 */
const headersBody = ({ cell, target }: HeadersCase): string => {
  const tested = `<td headers="${target}">c</td>`;

  return `<p id="pp">x</p><table><tbody><tr><th id="ho">H</th><td id="do">D</td>${cell === "outer" ? tested : ""}</tr><tr><td><table><tbody><tr><th id="hi">I</th><td id="di">E</td>${cell === "inner" ? tested : ""}</tr></tbody></table></td></tr></tbody></table>`;
};

describe("test/oracle.ts, Table headers", { timeout: buildTimeout }, () => {
  it.effect(
    "breaks once, at the cell, exactly when its headers name anything but a th of its own nearest table",
    (ctx) =>
      // Oracle: the specification as a checker, info §5.140.1 ("each of which must have the value
      // of an ID of a 'th' tag taking part in the same table as the 'td' or 'th' tag", reading
      // 126), a cell taking part in its nearest table, as HTML's table model reads nested tables.
      // Bound: a cell of the outer or the inner table naming each of six targets, 12.
      searched(
        ctx,
        exhaust(
          {
            box: "a cell of an outer or a nested table, its headers naming a th or td of either table, a paragraph or nothing",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<HeadersSituation>([
              "own header",
              "enclosing table's header",
              "nested table's header",
              "a td",
              "no cell",
              "dangling",
            ]),
            generator: headersCases,
            limit: 20,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the information model's TDH headers, §5.140.1",
            },
            suite: "qti/html-headers",
          },
          (drawn: HeadersCase, c) =>
            Effect.gen(function* headers() {
              const own = drawn.cell === "outer" ? "ho" : "hi";
              const situation = (): HeadersSituation => {
                if (drawn.target === own) {
                  return "own header";
                }

                if (drawn.target === "ho" || drawn.target === "hi") {
                  return drawn.cell === "inner"
                    ? "enclosing table's header"
                    : "nested table's header";
                }

                if (drawn.target === "do" || drawn.target === "di") {
                  return "a td";
                }

                return drawn.target === "pp" ? "no cell" : "dangling";
              };
              c.note(situation());

              const { all, read } = yield* breachesOf(headersBody(drawn), ["Table headers"]);

              assert.deepStrictEqual(
                read,
                drawn.target === own ? [] : ["Table headers at td"],
                `${JSON.stringify(drawn)}\n${all}`,
              );
            }),
        ),
      ),
  );
});
