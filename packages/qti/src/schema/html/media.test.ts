import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import * as media from "#qti/schema/html/media.ts";
import * as html from "#qti/schema/html.ts";
import * as node from "#qti/schema/node.ts";

/**
 * The seven handles of spec 4.8's V06 column.
 */
const handles = ["audio", "object", "param", "picture", "source", "track", "video"];

/**
 * Each version-conditioned boolean, with the relation that holds the host its version copy is bound
 * to and the host's fields the copy is bound through.
 */
const booleans = [
  ["AudioAutoplay", media.relations.Audio, ["id", "version"]],
  ["AudioControls", media.relations.Audio, ["id", "version"]],
  ["AudioLoop", media.relations.Audio, ["id", "version"]],
  ["AudioMuted", media.relations.Audio, ["id", "version"]],
  ["TrackDefault", node.Node, ["id", "version"]],
  ["VideoAutoplay", media.relations.Video, ["id", "version"]],
  ["VideoControls", media.relations.Video, ["id", "version"]],
  ["VideoLoop", media.relations.Video, ["id", "version"]],
  ["VideoMuted", media.relations.Video, ["id", "version"]],
] as const;

/**
 * A relation that is one side of a statement of `media.rules`.
 */
type Owner = Extract<
  (typeof media.rules)[number],
  { readonly kind: "contained" }
>["left"]["source"];

/**
 * The containments `rules` declares from `source`, each as the source fields, the target relation
 * and the target fields.
 */
const containments = (source: Owner) =>
  media.rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === source
      ? [[[...rule.left.fields], rule.right.source, [...rule.right.fields]] as const]
      : [],
  );

/**
 * The containments `rules` declares into `target`, each as the source relation and its fields.
 */
const containmentsInto = (target: Owner) =>
  media.rules.flatMap((rule) =>
    rule.kind === "contained" && rule.right.source === target
      ? [[rule.left.source, [...rule.left.fields], [...rule.right.fields]] as const]
      : [],
  );

/**
 * The shape of a ByVersion check's description that the handle lists live in: the predicate is an
 * `and` of one `or` per version, each `or` holding the version comparison and the `in` term.
 */
const ByVersionCheck = Schema.Struct({
  desc: Schema.Struct({
    predicate: Schema.Struct({
      args: Schema.Array(
        Schema.Struct({
          args: Schema.Array(
            Schema.Struct({ values: Schema.optional(Schema.Array(Schema.String)) }),
          ),
        }),
      ),
    }),
  }),
});

/**
 * The attribute word each boolean relation's 3.0.1 enumeration names.
 */
const wordOf = {
  AudioAutoplay: "autoplay",
  AudioControls: "controls",
  AudioLoop: "loop",
  AudioMuted: "muted",
  TrackDefault: "default",
  VideoAutoplay: "autoplay",
  VideoControls: "controls",
  VideoLoop: "loop",
  VideoMuted: "muted",
} as const;

describe("html/media", () => {
  it("keys 7 arms by the V06 handles", () => {
    assert.strictEqual(handles.length, 7);
    assert.deepStrictEqual(Object.keys(media.arms).toSorted(), handles);
  });

  it("names every handle a NodeKind and gives its arm a single id key", () => {
    for (const [handle, arm] of Object.entries(media.arms)) {
      assert.include(node.relations.NodeKind.handles, handle);
      assert.deepStrictEqual([...arm.primaryKey], ["id"]);
    }
  });

  it("gives each arm its required attributes and no others", () => {
    const { relations } = media;
    assert.deepStrictEqual(Object.keys(relations.Audio.fields), ["id", "version"]);
    assert.deepStrictEqual(Object.keys(relations.Video.fields), ["id", "version"]);
    assert.deepStrictEqual(Object.keys(relations.Source.fields), ["id", "parentKind", "src"]);
    assert.deepStrictEqual(Object.keys(relations.Track.fields), ["id", "kind", "src"]);
    assert.deepStrictEqual(Object.keys(relations.Object.fields), ["data", "id", "type"]);
    assert.deepStrictEqual(Object.keys(relations.Param.fields), [
      "id",
      "name",
      "value",
      "valuetype",
    ]);
    assert.deepStrictEqual(Object.keys(relations.Picture.fields), ["id"]);
    assert.strictEqual(relations.Track.fields.kind.roster.name, "TrackKind");
    assert.strictEqual(relations.Param.fields.valuetype.roster.name, "ParamValuetype");
  });

  it("closes the crossorigin, preload and boolean columns over their rosters", () => {
    const { relations } = media;
    assert.strictEqual(relations.AudioCrossorigin.fields.value.roster.name, "CrossOrigin");
    assert.strictEqual(relations.VideoCrossorigin.fields.value.roster.name, "CrossOrigin");
    assert.strictEqual(relations.AudioPreload.fields.value.roster.name, "MediaPreload");
    assert.strictEqual(relations.VideoPreload.fields.value.roster.name, "MediaPreload");
    for (const [name, roster] of [
      ["AudioAutoplay", "MediaAutoplay"],
      ["VideoAutoplay", "MediaAutoplay"],
      ["AudioControls", "MediaControls"],
      ["VideoControls", "MediaControls"],
      ["AudioLoop", "MediaLoop"],
      ["VideoLoop", "MediaLoop"],
      ["AudioMuted", "MediaMuted"],
      ["VideoMuted", "MediaMuted"],
      ["TrackDefault", "TrackDefaultValue"],
    ] as const) {
      assert.strictEqual(relations[name].fields.value.roster.name, roster, name);
    }
  });

  it("holds a boolean as a node-keyed row with its version copy, bound to its host", () => {
    for (const [name, host, fields] of booleans) {
      const relation = media.relations[name];
      assert.deepStrictEqual([...relation.primaryKey], ["node"], name);
      assert.deepStrictEqual(Object.keys(relation.fields), ["node", "value", "version"], name);
      assert.deepStrictEqual(containments(relation), [[["node", "version"], host, [...fields]]]);
    }
  });

  it("states a ByVersion check over version and value on each boolean's relation", () => {
    const checks = media.rules.flatMap((rule) => (rule.kind === "check" ? [rule] : []));
    assert.strictEqual(checks.length, booleans.length);
    for (const [name] of booleans) {
      const found = checks.filter((rule) => rule.name === `${name}ByVersion`);
      assert.strictEqual(found.length, 1, name);
      assert.strictEqual(found[0]?.relation, media.relations[name], name);
      assert.include(Object.keys(media.relations[name].fields), "version", name);
      assert.include(Object.keys(media.relations[name].fields), "value", name);
    }
  });

  it("narrows each version's handles in each ByVersion check by the form of its attribute", () => {
    for (const [name] of booleans) {
      const rule = media.rules.find(
        (found) => found.kind === "check" && found.name === `${name}ByVersion`,
      );
      const { desc } = Schema.decodeUnknownSync(ByVersionCheck)(rule);
      const lists = desc.predicate.args.map((version) =>
        version.args.flatMap((term) => term.values ?? []),
      );

      assert.deepStrictEqual(
        lists,
        [
          ["true", "false", "1", "0"],
          ["true", "false", wordOf[name]],
        ],
        name,
      );
    }
  });

  it("holds a picture to one img and at least one source", () => {
    const capacities = media.rules.flatMap((rule) => (rule.kind === "capacity" ? [rule] : []));
    assert.strictEqual(capacities.length, 2);
    assert.isTrue(capacities.every((rule) => rule.target.source === media.relations.Picture));
    for (const rule of capacities) {
      assert.deepStrictEqual([...rule.target.fields], ["id"]);
    }
  });

  it("holds a source in a picture to a srcset and a subtitles track to a srclang", () => {
    assert.deepStrictEqual(
      containmentsInto(media.relations.SourceSrcset).map(([, fields, into]) => [fields, into]),
      [[["id"], ["node"]]],
    );
    assert.deepStrictEqual(
      containmentsInto(media.relations.TrackSrclang).map(([, fields, into]) => [fields, into]),
      [[["id"], ["node"]]],
    );
  });

  it("binds a source's parent kind into the edge that holds it", () => {
    assert.deepStrictEqual(containments(media.relations.Source), [
      [["id", "parentKind"], node.Edge, ["child", "parentKind"]],
    ]);
  });

  it("holds an optional attribute as a node-keyed row contained into its arm", () => {
    const optional = [
      [media.relations.AudioCrossorigin, media.relations.Audio],
      [media.relations.ObjectHeight, media.relations.Object],
      [media.relations.ParamType, media.relations.Param],
      [media.relations.SourceSizes, media.relations.Source],
      [media.relations.VideoPoster, media.relations.Video],
    ] as const;
    for (const [relation, arm] of optional) {
      assert.deepStrictEqual([...relation.primaryKey], ["node"], relation.name);
      assert.deepStrictEqual(Object.keys(relation.fields), ["node", "value"], relation.name);
      assert.deepStrictEqual(containments(relation), [[["node"], arm, ["id"]]], relation.name);
    }
  });

  it("holds no TrackLabel: a track's label is the base family's NodeLabel", () => {
    assert.strictEqual("TrackLabel" in media.relations, false);
  });

  it("builds a probe schema over node.relations, html.relations and media.relations", () => {
    const probe = schema(
      "HtmlMediaProbe",
      { ...node.relations, ...html.relations, ...media.relations },
      [...node.rules, ...html.rules, ...media.rules],
    );
    for (const name of Object.keys(media.relations)) {
      assert.property(probe.relations, name);
    }
  });
});
