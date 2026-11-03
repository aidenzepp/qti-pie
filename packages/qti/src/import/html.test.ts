import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option } from "effect";
import { renderTree } from "#qti/export/render.ts";
import { htmlRows } from "#qti/import/html.ts";
import { itemRows } from "#qti/import/item.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { ItemRefusal, Rows, treeRows, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { NodeIndex, TreeInput } from "#qti/import/tree.ts";
import { Img, P } from "#qti/schema/html.ts";
import * as media from "#qti/schema/html/media.ts";
import * as structure from "#qti/schema/html/structure.ts";
import * as text from "#qti/schema/html/text.ts";
import { AttributeLexical } from "#qti/schema/node.ts";
import { entryOf } from "#qti/schema/content/xsd-inventory.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { canonicalize } from "#qti/xml/canonical.ts";
import { readXml } from "#qti/xml/read.ts";

const documentId = "11111111-1111-4111-8111-111111111111";

const input = (version: TreeInput["version"]): TreeInput => ({
  charset: "utf-8",
  id: documentId,
  kind: "document",
  root: "item",
  version,
});

/**
 * An item of `version` whose body holds `fragment`, read into its tree and run through `htmlRows`.
 */
const built = (version: TreeInput["version"], fragment: string) =>
  Effect.gen(function* fragmentRows() {
    const xml = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body>${fragment}</qti-item-body></qti-assessment-item>`;
    const doc = yield* readXml(new TextEncoder().encode(xml));
    const tree = yield* treeRows(doc, input(version), Rows.empty());

    return { nodes: tree.nodes, rows: yield* htmlRows(doc.root, tree.nodes, tree.rows) };
  });

const idOf = (nodes: NodeIndex, kind: string): string =>
  Option.getOrThrow(
    Option.fromNullishOr([...nodes.values()].find((found) => found.kind === kind)?.id),
  );

describe("htmlRows on a 3.0.1 video", () => {
  it.effect("writes the video, its version-conditioned controls, its source and the type", () =>
    Effect.gen(function* video() {
      const { nodes, rows } = yield* built(
        "3.0.1",
        '<video controls="controls"><source src="a.mp4" type="video/mp4"/></video>',
      );
      const videoId = idOf(nodes, "video");
      const sourceId = idOf(nodes, "source");

      assert.deepStrictEqual(Rows.of(rows, media.relations.Video), [
        { id: videoId, version: "3.0.1" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.VideoControls), [
        { node: videoId, value: "controls", version: "3.0.1" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.Source), [
        { id: sourceId, parentKind: "video", src: "a.mp4" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.SourceType), [
        { node: sourceId, value: "video/mp4" },
      ]);
    }),
  );
});

describe("htmlRows on a padded source", () => {
  it.effect("keeps a padded source src's spelling", () =>
    Effect.gen(function* paddedSource() {
      const { nodes, rows } = yield* built(
        "3.0.1",
        '<video controls="controls"><source src="&#9;a.mp4&#9;" type="video/mp4"/></video>',
      );
      const sourceId = idOf(nodes, "source");

      assert.deepStrictEqual(Rows.of(rows, media.relations.Source), [
        { id: sourceId, parentKind: "video", src: " a.mp4 " },
      ]);
      assert.deepStrictEqual(
        Rows.of(rows, AttributeLexical).map((row) => [row.node, row.attribute, row.value]),
        [[sourceId, "src", "\ta.mp4\t"]],
      );
    }),
  );
});

describe("htmlRows on a 3.0.0 fragment", () => {
  it.effect(
    "collapses a version-conditioned boolean as xs:boolean and keeps its lexical form",
    () =>
      Effect.gen(function* collapsedBoolean() {
        const { nodes, rows } = yield* built(
          "3.0.0",
          '<audio loop=" true " preload="none"><source src="a.mp3"/></audio>',
        );
        const audioId = idOf(nodes, "audio");

        assert.deepStrictEqual(Rows.of(rows, media.relations.Audio), [
          { id: audioId, version: "3.0.0" },
        ]);
        assert.deepStrictEqual(Rows.of(rows, media.relations.AudioLoop), [
          { node: audioId, value: "true", version: "3.0.0" },
        ]);
        assert.deepStrictEqual(Rows.of(rows, media.relations.AudioPreload), [
          { node: audioId, value: "none" },
        ]);
        assert.strictEqual(Rows.of(rows, media.relations.AudioControls).length, 0);
        assert.deepStrictEqual(
          Rows.of(rows, AttributeLexical).map((row) => [row.node, row.attribute, row.value]),
          [[audioId, "loop", " true "]],
        );
      }),
  );
});

describe("htmlRows defaults", () => {
  it.effect("gives a track its default kind and no marker, and marks a written kind", () =>
    Effect.gen(function* trackKinds() {
      const bare = yield* built("3.0.1", '<video><track src="t.vtt"/></video>');
      const trackId = idOf(bare.nodes, "track");

      assert.deepStrictEqual(Rows.of(bare.rows, media.relations.Track), [
        { id: trackId, kind: "subtitles", src: "t.vtt" },
      ]);
      assert.strictEqual(Rows.of(bare.rows, media.relations.DeclaredTrackKind).length, 0);

      const written = yield* built(
        "3.0.1",
        '<video><track src="t.vtt" kind="captions" srclang="en" default="default"/></video>',
      );
      const writtenId = idOf(written.nodes, "track");

      assert.deepStrictEqual(Rows.of(written.rows, media.relations.Track), [
        { id: writtenId, kind: "captions", src: "t.vtt" },
      ]);
      assert.deepStrictEqual(Rows.of(written.rows, media.relations.DeclaredTrackKind), [
        { node: writtenId },
      ]);
      assert.deepStrictEqual(Rows.of(written.rows, media.relations.TrackSrclang), [
        { node: writtenId, value: "en" },
      ]);
      assert.deepStrictEqual(Rows.of(written.rows, media.relations.TrackDefault), [
        { node: writtenId, value: "default", version: "3.0.1" },
      ]);
    }),
  );

  it.effect("gives a param its default valuetype and marks a written one", () =>
    Effect.gen(function* paramTypes() {
      const { nodes, rows } = yield* built(
        "3.0.0",
        '<object data="a.swf" type="application/x-shockwave-flash"><param name="a" value="1"/><param name="b" value="u" valuetype="REF" type="text/plain"/></object>',
      );
      const params = Rows.of(rows, media.relations.Param);
      const [, second] = params;

      assert.deepStrictEqual(
        params.map((row) => [row.name, row.value, row.valuetype]),
        [
          ["a", "1", "DATA"],
          ["b", "u", "REF"],
        ],
      );
      assert.deepStrictEqual(Rows.of(rows, media.relations.DeclaredValuetype), [
        { node: second?.id ?? "" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.ParamType), [
        { node: second?.id ?? "", value: "text/plain" },
      ]);
      assert.strictEqual(Rows.of(rows, media.relations.Object).length, 1);
      assert.isDefined(idOf(nodes, "object"));
    }),
  );

  it.effect("names the picture a source sits in and keeps its srcset", () =>
    Effect.gen(function* pictureSource() {
      const { rows } = yield* built(
        "3.0.1",
        '<picture><source srcset="a.png 1x" media="(min-width: 1px)" sizes="100vw"/><img src="a.png" alt=""/></picture>',
      );
      const source = Rows.of(rows, media.relations.Source);

      assert.deepStrictEqual(
        source.map((row) => [row.parentKind, row.src]),
        [["picture", ""]],
      );
      assert.deepStrictEqual(
        Rows.of(rows, media.relations.SourceSrcset).map((row) => row.value),
        ["a.png 1x"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, media.relations.SourceMedia).map((row) => row.value),
        ["(min-width: 1px)"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, media.relations.SourceSizes).map((row) => row.value),
        ["100vw"],
      );
    }),
  );
});

describe("htmlRows on the text and structure elements", () => {
  it.effect("writes a thin arm for each, the anchor's href and its optionals", () =>
    Effect.gen(function* textArms() {
      const { nodes, rows } = yield* built(
        "3.0.0",
        '<div><a href=" x.html " type="text/html">go</a><span>s</span><blockquote cite="c"><q cite="d">q</q></blockquote><bdo dir="rtl" title="t"/></div>',
      );

      assert.strictEqual(Rows.of(rows, text.Div).length, 1);
      assert.strictEqual(Rows.of(rows, text.Span).length, 1);
      assert.deepStrictEqual(Rows.of(rows, text.A), [{ href: "x.html", id: idOf(nodes, "a") }]);
      assert.deepStrictEqual(
        Rows.of(rows, AttributeLexical).map((row) => [row.node, row.attribute, row.value]),
        [[idOf(nodes, "a"), "href", " x.html "]],
      );
      assert.deepStrictEqual(Rows.of(rows, text.AType), [
        { node: idOf(nodes, "a"), value: "text/html" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, text.BlockquoteCite), [
        { node: idOf(nodes, "blockquote"), value: "c" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, text.QCite), [{ node: idOf(nodes, "q"), value: "d" }]);
      assert.deepStrictEqual(Rows.of(rows, text.BdoTitle), [
        { node: idOf(nodes, "bdo"), value: "t" },
      ]);
    }),
  );

  it.effect("writes the table cells' optionals and leaves headers to the attribute pass", () =>
    Effect.gen(function* tableCells() {
      const { nodes, rows } = yield* built(
        "3.0.0",
        '<table summary="s"><tbody><tr><td headers="h1 h2" colspan=" 2 " rowspan="3" scope="row" align="left" valign="top" abbr="a" axis="x">c</td><th colspan="1">h</th></tr></tbody></table><details open="true"><summary>s</summary></details>',
      );
      const cell = idOf(nodes, "td");

      assert.deepStrictEqual(Rows.of(rows, structure.TdColspan), [{ node: cell, value: "2" }]);
      assert.deepStrictEqual(Rows.of(rows, structure.TdRowspan), [{ node: cell, value: "3" }]);
      assert.deepStrictEqual(Rows.of(rows, structure.TdScope), [{ node: cell, value: "row" }]);
      assert.deepStrictEqual(Rows.of(rows, structure.TdAlign), [{ node: cell, value: "left" }]);
      assert.deepStrictEqual(Rows.of(rows, structure.TdValign), [{ node: cell, value: "top" }]);
      assert.deepStrictEqual(Rows.of(rows, structure.TdAbbr), [{ node: cell, value: "a" }]);
      assert.deepStrictEqual(Rows.of(rows, structure.TdAxis), [{ node: cell, value: "x" }]);
      assert.deepStrictEqual(Rows.of(rows, structure.ThColspan), [
        { node: idOf(nodes, "th"), value: "1" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, structure.TableSummary), [
        { node: idOf(nodes, "table"), value: "s" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, structure.DetailsOpen), [
        { node: idOf(nodes, "details"), value: "true" },
      ]);
      assert.strictEqual(Rows.of(rows, structure.Td).length, 1);
      assert.strictEqual(Rows.of(rows, structure.Tbody).length, 1);
    }),
  );

  it.effect("skips the paragraph and the image, which the item pass writes", () =>
    Effect.gen(function* skipped() {
      const { rows } = yield* built("3.0.0", '<p>x<img src="a.png" alt=""/></p>');

      assert.strictEqual(Rows.of(rows, P).length, 0);
      assert.strictEqual(Rows.of(rows, Img).length, 0);
    }),
  );
});

describe("htmlRows refuses an absent required attribute", () => {
  const negatives: readonly (readonly [string, string])[] = [
    ["a/@href", '<div><a type="text/html">go</a></div>'],
    ["track/@src", '<video><track kind="captions" srclang="en"/></video>'],
    ["object/@data", '<object type="image/png"/>'],
    ["object/@type", '<object data="a.png"/>'],
    ["param/@name", '<object data="a.png" type="image/png"><param value="1"/></object>'],
    ["param/@value", '<object data="a.png" type="image/png"><param name="a"/></object>'],
    ["video source/@src", '<video><source type="video/mp4"/></video>'],
    ["audio source/@src", '<audio><source type="audio/mpeg"/></audio>'],
  ];

  for (const [label, fragment] of negatives) {
    it.effect(`refuses ${label}`, () =>
      Effect.gen(function* absent() {
        const exit = yield* Effect.exit(built("3.0.1", fragment));

        assert.isTrue(Exit.isFailure(exit), `${label} was admitted`);

        const refusal = yield* Effect.flip(built("3.0.1", fragment));
        assert.instanceOf(refusal, ItemRefusal);
        assert.strictEqual(
          refusal instanceof ItemRefusal ? refusal.rule : "",
          "required-attribute",
        );
      }),
    );
  }

  it.effect("admits an explicit empty href, which is a value", () =>
    Effect.gen(function* empty() {
      const { nodes, rows } = yield* built("3.0.1", '<div><a href="">go</a></div>');

      assert.deepStrictEqual(Rows.of(rows, text.A), [{ href: "", id: idOf(nodes, "a") }]);
    }),
  );
});

describe("htmlRows on an explicit empty media source src", () => {
  it.effect("admits a video source whose src is written empty, and stores the empty value", () =>
    Effect.gen(function* emptySrc() {
      const { nodes, rows } = yield* built(
        "3.0.1",
        '<video><source src="" type="video/mp4"/></video>',
      );

      assert.deepStrictEqual(Rows.of(rows, media.relations.Source), [
        { id: idOf(nodes, "source"), parentKind: "video", src: "" },
      ]);
    }),
  );
});

describe("htmlRows over the inventory", () => {
  const kinds = [
    ...Object.keys(text.arms),
    ...Object.keys(structure.arms),
    ...Object.keys(media.arms),
  ];

  it.effect(
    "reads every own attribute of every arm kind it models, or leaves it to the attribute pass",
    () =>
      Effect.gen(function* ownAttributes() {
        for (const kind of kinds) {
          const own = entryOf(kind).pipe(
            Option.match({
              onNone: () => [],
              onSome: (entry) => entry.attributes.filter((found) => found.family === "own"),
            }),
          );
          for (const tested of own.filter((found) => found.name !== "headers")) {
            // `param/@valuetype` stays optional on this importer, so `name` and `value` are all it needs.
            const alongside = own
              .filter(
                (found) =>
                  found.use === "required" &&
                  found.name !== tested.name &&
                  !(kind === "param" && found.name === "valuetype"),
              )
              .map((found) => ` ${found.name}="x"`)
              .join("");
            // A closed attribute reads "x" and refuses it under `attribute-lexical`: it has a home.
            const exit = yield* Effect.exit(
              built("3.0.1", `<${kind} ${tested.name}="x"${alongside}/>`).pipe(
                Effect.catchIf(
                  (refusal) => refusal instanceof ImportRefused,
                  () => Effect.void,
                ),
              ),
            );

            assert.isTrue(Exit.isSuccess(exit), `${kind}/@${tested.name} has no home in htmlRows`);
          }
        }
      }),
  );

  it.effect("refuses an HTML element with no element above it", () =>
    Effect.gen(function* rootless() {
      const doc = yield* readXml(
        new TextEncoder().encode('<span xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>'),
      );
      const refusal = yield* Effect.flip(
        htmlRows(
          doc.root,
          new Map([[doc.root, { ancestry: "root", id: "x", kind: "span" }]]),
          Rows.empty(),
        ),
      );

      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.deepStrictEqual(refusal.parent, Option.none());
    }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("htmlRows on sharedMedia", (suite) => {
  suite.effect("writes hotspot.xml's object with its data, type, width and height", () =>
    Effect.gen(function* hotspotObject() {
      const fs = yield* FileSystem.FileSystem;
      const directory = yield* materialize("sharedMedia");
      const doc = yield* readXml(
        yield* fs.readFile(path.join(directory, "example", "hotspot.xml")),
      );
      const tree = yield* treeRows(doc, input("3.0.0"), Rows.empty());
      const rows = yield* htmlRows(doc.root, tree.nodes, tree.rows);
      const objectId = idOf(tree.nodes, "object");

      assert.deepStrictEqual(Rows.of(rows, media.relations.Object), [
        { data: "ukair.png", id: objectId, type: "image/png" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.ObjectWidth), [
        { node: objectId, value: "206" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.ObjectHeight), [
        { node: objectId, value: "280" },
      ]);
    }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("a padded href", (suite) => {
  suite.effect("round-trips with its spelling", () =>
    Effect.gen(function* paddedHref() {
      const xml = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p><a href=" x.html ">go</a></p></qti-item-body></qti-assessment-item>`;
      const doc = yield* readXml(new TextEncoder().encode(xml));
      const { documentId: tree, rows } = yield* itemRows(
        {
          doc,
          packageId: crypto.randomUUID(),
          path: "padded.xml",
          resource: "padded",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.1",
        },
        Rows.empty(),
      );
      const rendered = new TextDecoder().decode(canonicalize(renderTree(rows, tree)));

      assert.strictEqual(rendered, new TextDecoder().decode(canonicalize(doc)));
      assert.include(rendered, 'href=" x.html "');
    }),
  );
});

describe("htmlRows refuses a closed attribute outside its roster", () => {
  const negatives: readonly (readonly [string, TreeInput["version"], string])[] = [
    ["track kind", "3.0.1", '<video><track kind="lyrics" src="a.vtt"/></video>'],
    ["video autoplay", "3.0.1", '<video autoplay="on"/>'],
    ["audio loop", "3.0.0", '<audio loop="yes"/>'],
    ["track default", "3.0.1", '<video><track default="on" src="a.vtt"/></video>'],
    ["audio crossorigin", "3.0.1", '<audio crossorigin="any"/>'],
    ["video preload", "3.0.1", '<video preload="all"/>'],
    [
      "param valuetype",
      "3.0.1",
      '<object data="a.png" type="image/png"><param name="a" value="1" valuetype="FILE"/></object>',
    ],
    ["details open", "3.0.1", '<details open="open"><summary>s</summary></details>'],
    ["td scope", "3.0.1", '<table><tbody><tr><td scope="cell">x</td></tr></tbody></table>'],
    ["th align", "3.0.1", '<table><tbody><tr><th align="start">x</th></tr></tbody></table>'],
    ["td valign", "3.0.1", '<table><tbody><tr><td valign="center">x</td></tr></tbody></table>'],
  ];

  for (const [label, version, fragment] of negatives) {
    it.effect(`refuses ${label} under attribute-lexical`, () =>
      Effect.gen(function* outside() {
        const refusal = yield* Effect.flip(built(version, fragment));

        assert.instanceOf(refusal, ImportRefused);
        assert.strictEqual(
          refusal instanceof ImportRefused ? refusal.rule : "",
          "attribute-lexical",
        );
      }),
    );
  }

  it.effect("admits a collapsed 3.0.0 boolean and each written closed value", () =>
    Effect.gen(function* inside() {
      const { nodes, rows } = yield* built(
        "3.0.1",
        '<video autoplay="autoplay" preload="auto" crossorigin="anonymous"><track kind="captions" src="a.vtt" default="default"/></video>',
      );
      const videoId = idOf(nodes, "video");

      assert.deepStrictEqual(Rows.of(rows, media.relations.VideoAutoplay), [
        { node: videoId, value: "autoplay", version: "3.0.1" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.VideoPreload), [
        { node: videoId, value: "auto" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, media.relations.VideoCrossorigin), [
        { node: videoId, value: "anonymous" },
      ]);
      assert.deepStrictEqual(
        Rows.of(rows, media.relations.Track).map((row) => row.kind),
        ["captions"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, media.relations.TrackDefault).map((row) => row.value),
        ["default"],
      );
    }),
  );
});
