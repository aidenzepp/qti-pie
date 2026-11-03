/**
 * The media and embedded elements of the HTML profile (spec 4.8, unit V06): `audio`, `object`,
 * `param`, `picture`, `source`, `track` and `video`. `img` is the first milestone's and stays in
 * `html.ts`.
 *
 * An arm carries a column only for an own attribute that is required; an own optional attribute is
 * a row of its own relation. The arms' containments into `Node` are bound by one `mirrors` per
 * handle in the composed schema, not written here.
 *
 * Goal 3.9: `autoplay`, `loop`, `muted` and `controls` on `audio` and `video`, and `default` on
 * `track`, are `xs:boolean` in 3.0.0 and an enumeration that names the attribute in 3.0.1. Their
 * relations carry a `version` copy bound to the node's own version, and a row check admits each
 * version's lexical space. The value column is a roster of the union of both spaces, so the check
 * is what judges each version's own subset.
 */
import {
  capacity,
  check,
  closedId,
  Compute,
  contained,
  on,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import {
  CrossOrigin,
  MediaAutoplay,
  MediaControls,
  MediaLoop,
  MediaMuted,
  MediaPreload,
  ParamValuetype,
  TrackDefaultValue,
  TrackKind,
} from "#qti/schema/content/rosters.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * An `xs:string` attribute's value, whitespace preserved.
 */
const xsString = str.regex(patterns.xsString, patterns.xsStringFlags);

/**
 * An `xs:normalizedString` attribute's value, whitespace replaced. `URLDType` is of this class, and
 * `anyUri` is its collapsed form.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * The words 3.0.0 admits for a boolean attribute (`xs:boolean`).
 */
const booleanWords = ["true", "false", "1", "0"] as const;

/**
 * An `audio` element and the schema version of its tree, which its booleans are judged against.
 */
export const Audio = relation("Audio", { id: uuid, version: closedId(node.SchemaVersion) }, ["id"]);

/**
 * A `video` element and the schema version of its tree, which its booleans are judged against.
 */
export const Video = relation("Video", { id: uuid, version: closedId(node.SchemaVersion) }, ["id"]);

/**
 * A `source` element. `src` is required (prose over the XSD); `parentKind` copies the kind of the
 * element that holds it, so a `source` in a `picture` can be held to a `srcset`.
 */
export const Source = relation(
  "Source",
  { id: uuid, parentKind: closedId(node.NodeKind), src: xsNormalizedString },
  ["id"],
);

/**
 * A `track` element: `src` and `kind` are required, and `kind` is `subtitles` when the source wrote
 * none, which `DeclaredTrackKind` records.
 */
export const Track = relation(
  "Track",
  { id: uuid, kind: closedId(TrackKind), src: xsNormalizedString },
  ["id"],
);

/**
 * A `picture` element.
 */
export const Picture = relation("Picture", { id: uuid }, ["id"]);

/**
 * An `object` element: `data` and `type` are required.
 */
export const ObjectElement = relation(
  "Object",
  { data: str.regex(patterns.anyUri), id: uuid, type: str.regex(patterns.mimeType) },
  ["id"],
);

/**
 * A `param` element: `name`, `value` and `valuetype` are required, and `valuetype` is `DATA` when
 * the source wrote none, which `DeclaredValuetype` records.
 */
export const Param = relation(
  "Param",
  { id: uuid, name: xsString, value: xsString, valuetype: closedId(ParamValuetype) },
  ["id"],
);

/**
 * An audio's `src`, when written.
 */
export const AudioSrc = relation("AudioSrc", { node: uuid, value: xsNormalizedString }, ["node"]);

/**
 * An audio's `crossorigin`, when written.
 */
export const AudioCrossorigin = relation(
  "AudioCrossorigin",
  { node: uuid, value: closedId(CrossOrigin) },
  ["node"],
);

/**
 * An audio's `preload`, when written.
 */
export const AudioPreload = relation(
  "AudioPreload",
  { node: uuid, value: closedId(MediaPreload) },
  ["node"],
);

/**
 * An audio's `mediagroup`, when written.
 */
export const AudioMediagroup = relation("AudioMediagroup", { node: uuid, value: xsString }, [
  "node",
]);

/**
 * A video's `src`, when written.
 */
export const VideoSrc = relation("VideoSrc", { node: uuid, value: xsNormalizedString }, ["node"]);

/**
 * A video's `crossorigin`, when written.
 */
export const VideoCrossorigin = relation(
  "VideoCrossorigin",
  { node: uuid, value: closedId(CrossOrigin) },
  ["node"],
);

/**
 * A video's `preload`, when written.
 */
export const VideoPreload = relation(
  "VideoPreload",
  { node: uuid, value: closedId(MediaPreload) },
  ["node"],
);

/**
 * A video's `mediagroup`, when written.
 */
export const VideoMediagroup = relation("VideoMediagroup", { node: uuid, value: xsString }, [
  "node",
]);

/**
 * A video's `poster`, when written.
 */
export const VideoPoster = relation("VideoPoster", { node: uuid, value: xsNormalizedString }, [
  "node",
]);

/**
 * A video's `width`, when written.
 */
export const VideoWidth = relation(
  "VideoWidth",
  { node: uuid, value: str.regex(patterns.lengthDType) },
  ["node"],
);

/**
 * A video's `height`, when written.
 */
export const VideoHeight = relation(
  "VideoHeight",
  { node: uuid, value: str.regex(patterns.lengthDType) },
  ["node"],
);

/**
 * A source's `type`, when written.
 */
export const SourceType = relation(
  "SourceType",
  { node: uuid, value: str.regex(patterns.mimeType) },
  ["node"],
);

/**
 * A source's `srcset`, when written.
 */
export const SourceSrcset = relation("SourceSrcset", { node: uuid, value: xsNormalizedString }, [
  "node",
]);

/**
 * A source's `media`, when written.
 */
export const SourceMedia = relation("SourceMedia", { node: uuid, value: xsString }, ["node"]);

/**
 * A source's `sizes`, when written.
 */
export const SourceSizes = relation("SourceSizes", { node: uuid, value: xsString }, ["node"]);

/**
 * A track's `srclang`, when written.
 */
export const TrackSrclang = relation(
  "TrackSrclang",
  { node: uuid, value: str.regex(patterns.bcp47) },
  ["node"],
);

/**
 * An object's `width`, when written.
 */
export const ObjectWidth = relation(
  "ObjectWidth",
  { node: uuid, value: str.regex(patterns.lengthDType) },
  ["node"],
);

/**
 * An object's `height`, when written.
 */
export const ObjectHeight = relation(
  "ObjectHeight",
  { node: uuid, value: str.regex(patterns.lengthDType) },
  ["node"],
);

/**
 * A param's `type`, when written.
 */
export const ParamType = relation(
  "ParamType",
  { node: uuid, value: str.regex(patterns.mimeType) },
  ["node"],
);

/**
 * The source wrote `kind` on this track.
 */
export const DeclaredTrackKind = relation("DeclaredTrackKind", { node: uuid }, ["node"]);

/**
 * The source wrote `valuetype` on this param.
 */
export const DeclaredValuetype = relation("DeclaredValuetype", { node: uuid }, ["node"]);

/**
 * An audio's `autoplay`, when written, with the version its value is judged against.
 */
export const AudioAutoplay = relation(
  "AudioAutoplay",
  { node: uuid, value: closedId(MediaAutoplay), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * An audio's `controls`, when written, with the version its value is judged against.
 */
export const AudioControls = relation(
  "AudioControls",
  { node: uuid, value: closedId(MediaControls), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * An audio's `loop`, when written, with the version its value is judged against.
 */
export const AudioLoop = relation(
  "AudioLoop",
  { node: uuid, value: closedId(MediaLoop), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * An audio's `muted`, when written, with the version its value is judged against.
 */
export const AudioMuted = relation(
  "AudioMuted",
  { node: uuid, value: closedId(MediaMuted), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * A video's `autoplay`, when written, with the version its value is judged against.
 */
export const VideoAutoplay = relation(
  "VideoAutoplay",
  { node: uuid, value: closedId(MediaAutoplay), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * A video's `controls`, when written, with the version its value is judged against.
 */
export const VideoControls = relation(
  "VideoControls",
  { node: uuid, value: closedId(MediaControls), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * A video's `loop`, when written, with the version its value is judged against.
 */
export const VideoLoop = relation(
  "VideoLoop",
  { node: uuid, value: closedId(MediaLoop), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * A video's `muted`, when written, with the version its value is judged against.
 */
export const VideoMuted = relation(
  "VideoMuted",
  { node: uuid, value: closedId(MediaMuted), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * A track's `default`, when written, with the version its value is judged against.
 */
export const TrackDefault = relation(
  "TrackDefault",
  { node: uuid, value: closedId(TrackDefaultValue), version: closedId(node.SchemaVersion) },
  ["node"],
);

/**
 * The media kinds' arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  audio: Audio,
  object: ObjectElement,
  param: Param,
  picture: Picture,
  source: Source,
  track: Track,
  video: Video,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  Audio,
  AudioAutoplay,
  AudioControls,
  AudioCrossorigin,
  AudioLoop,
  AudioMediagroup,
  AudioMuted,
  AudioPreload,
  AudioSrc,
  DeclaredTrackKind,
  DeclaredValuetype,
  Object: ObjectElement,
  ObjectHeight,
  ObjectWidth,
  Param,
  ParamType,
  Picture,
  Source,
  SourceMedia,
  SourceSizes,
  SourceSrcset,
  SourceType,
  Track,
  TrackDefault,
  TrackSrclang,
  Video,
  VideoAutoplay,
  VideoControls,
  VideoCrossorigin,
  VideoHeight,
  VideoLoop,
  VideoMediagroup,
  VideoMuted,
  VideoPoster,
  VideoPreload,
  VideoSrc,
  VideoWidth,
};

/**
 * The statements over this module's relations: an optional value belongs to its arm; a boolean's
 * version copy is its element's own and its value is in that version's lexical space; a `source`
 * names the kind of the element that holds it, and in a `picture` has a `srcset`; a `track` of
 * kind `subtitles` has a `srclang`; and a `picture` holds one `img` and at least one `source`.
 */
export const rules = [
  contained(on(DeclaredTrackKind, "node"), on(Track, "id")),
  contained(on(DeclaredValuetype, "node"), on(Param, "id")),
  contained(on(AudioSrc, "node"), on(Audio, "id")),
  contained(on(AudioCrossorigin, "node"), on(Audio, "id")),
  contained(on(AudioPreload, "node"), on(Audio, "id")),
  contained(on(AudioMediagroup, "node"), on(Audio, "id")),
  contained(on(VideoSrc, "node"), on(Video, "id")),
  contained(on(VideoCrossorigin, "node"), on(Video, "id")),
  contained(on(VideoPreload, "node"), on(Video, "id")),
  contained(on(VideoMediagroup, "node"), on(Video, "id")),
  contained(on(VideoPoster, "node"), on(Video, "id")),
  contained(on(VideoWidth, "node"), on(Video, "id")),
  contained(on(VideoHeight, "node"), on(Video, "id")),
  contained(on(SourceType, "node"), on(Source, "id")),
  contained(on(SourceSrcset, "node"), on(Source, "id")),
  contained(on(SourceMedia, "node"), on(Source, "id")),
  contained(on(SourceSizes, "node"), on(Source, "id")),
  contained(on(TrackSrclang, "node"), on(Track, "id")),
  contained(on(ObjectWidth, "node"), on(ObjectElement, "id")),
  contained(on(ObjectHeight, "node"), on(ObjectElement, "id")),
  contained(on(ParamType, "node"), on(Param, "id")),
  contained(on(AudioAutoplay, "node", "version"), on(Audio, "id", "version")),
  check("AudioAutoplayByVersion", AudioAutoplay, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "autoplay"])),
    ),
  ),
  contained(on(AudioControls, "node", "version"), on(Audio, "id", "version")),
  check("AudioControlsByVersion", AudioControls, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "controls"])),
    ),
  ),
  contained(on(AudioLoop, "node", "version"), on(Audio, "id", "version")),
  check("AudioLoopByVersion", AudioLoop, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "loop"])),
    ),
  ),
  contained(on(AudioMuted, "node", "version"), on(Audio, "id", "version")),
  check("AudioMutedByVersion", AudioMuted, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "muted"])),
    ),
  ),
  contained(on(VideoAutoplay, "node", "version"), on(Video, "id", "version")),
  check("VideoAutoplayByVersion", VideoAutoplay, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "autoplay"])),
    ),
  ),
  contained(on(VideoControls, "node", "version"), on(Video, "id", "version")),
  check("VideoControlsByVersion", VideoControls, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "controls"])),
    ),
  ),
  contained(on(VideoLoop, "node", "version"), on(Video, "id", "version")),
  check("VideoLoopByVersion", VideoLoop, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "loop"])),
    ),
  ),
  contained(on(VideoMuted, "node", "version"), on(Video, "id", "version")),
  check("VideoMutedByVersion", VideoMuted, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "muted"])),
    ),
  ),
  contained(on(TrackDefault, "node", "version"), on(node.Node, "id", "version")),
  check("TrackDefaultByVersion", TrackDefault, (r) =>
    r.and(
      r.or(r.ne(r.version, "3.0.0"), Compute.in(r.value, booleanWords)),
      r.or(r.ne(r.version, "3.0.1"), Compute.in(r.value, ["true", "false", "default"])),
    ),
  ),
  contained(on(Source, "id", "parentKind"), on(node.Edge, "child", "parentKind")),
  contained(on(select(Source, { parentKind: "picture" }), "id"), on(SourceSrcset, "node")),
  contained(on(select(Track, { kind: "subtitles" }), "id"), on(TrackSrclang, "node")),
  capacity(on(Picture, "id"), {
    from: on(select(node.Edge, { childKind: "img" }), "parent"),
    within: within(1n, 1n),
  }),
  capacity(on(Picture, "id"), {
    from: on(select(node.Edge, { childKind: "source" }), "parent"),
    within: within(1n, "*"),
  }),
] as const;
