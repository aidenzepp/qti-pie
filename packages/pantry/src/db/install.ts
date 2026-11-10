/**
 * The install this process opens: this package's own, whose schema is the default `Qti` and whose
 * snapshot is the committed one, or a package-media install, the folder `GR8DES_QTI_INSTALL` names.
 *
 * A package-media install's folder holds `policy.json`, its policy, and `migrations/`, the
 * migrations a grizzle config outside this package generated for it, the author login's served file
 * `migrations/qti/served/author_app.json` among them. The setting tells this package's runtime and
 * command line two things and nothing else: the policy the `Qti` schema is built with
 * (`#pantry/qti/own.ts`), and the served file `AuthorAppLayer` opens (`#pantry/db/layer.ts`). Its
 * migrations are never this package's to generate or apply: grizzle.config.ts installs the default
 * `Qti` whatever the setting says.
 */
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { Array as Arr, Config, Effect, FileSystem, Layer, Option, Path, Schema } from "effect";

/**
 * A file extension a media policy lists: lowercase ASCII letters and digits, without its dot, as an
 * entry's path writes it after its last `.` (`photo.jpg` is `jpg`). An extension matches as
 * written, so a policy lists one spelling of each and a path in another case is refused.
 */
export const MediaExtension = Schema.String.check(
  Schema.isPattern(/^[a-z0-9]+$/u, {
    message:
      "Write an extension in lowercase ASCII letters and digits, without its dot, such as svg or jpg",
  }),
);

/**
 * The media type a policy serves an extension's files with, as an HTTP `Content-Type` names it: a
 * type and a subtype, each a restricted name (RFC 6838, §4.2), in lower case, the form the
 * registry writes, with no parameter.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc6838#section-4.2 | RFC 6838, §4.2 Naming Requirements}
 */
export const MediaType = Schema.String.check(
  Schema.isPattern(/^[a-z0-9][a-z0-9!#$&^_.+-]{0,126}\/[a-z0-9][a-z0-9!#$&^_.+-]{0,126}$/u, {
    message:
      "Write a media type in lower case as a type and a subtype with no parameter, such as image/svg+xml (RFC 6838, §4.2)",
  }),
);

/**
 * Find the media types a roster lists under more than one extension, each with those extensions.
 *
 * @param media - The roster.
 * @returns One message per such type; none where each type has one extension.
 */
const typesSpelledTwice = (media: Readonly<Record<string, string>>): readonly string[] =>
  Object.entries(Arr.groupBy(Object.keys(media), (extension) => media[extension] ?? "")).flatMap(
    ([type, extensions]) =>
      extensions.length > 1
        ? [
            `${type} is listed under ${extensions.join(", ")}: list each media type under one extension, the one spelling its files use`,
          ]
        : [],
  );

/**
 * An install's policy, `policy.json`: exactly `{ "media": { "<extension>": "<type>/<subtype>", ...
 * } }`, the one closed record of the extensions a player may fetch, each with the media type the
 * install serves its files with. It lists at least one extension, and each media type under one
 * extension, its one spelling: a policy that lists `jpg` for `image/jpeg` lists no `jpeg`.
 */
export const MediaPolicySchema = Schema.Struct({
  media: Schema.Record(MediaExtension, MediaType).check(
    Schema.isMinProperties(1, {
      message: 'List at least one extension, such as { "svg": "image/svg+xml" }',
    }),
    Schema.makeFilter(typesSpelledTwice),
  ),
});

/**
 * A package-media install's policy.
 */
export type MediaPolicy = typeof MediaPolicySchema.Type;

/**
 * `policy.json`'s text as its policy: JSON whose one key is `media`.
 */
const PolicyText = Schema.fromJsonString(MediaPolicySchema);

/**
 * A package-media install: its folder, absolute, and its policy.
 */
export interface QtiInstall {
  readonly folder: string;
  readonly policy: MediaPolicy;
}

/**
 * The install folder's `policy.json` could not be read, or is not exactly `{ "media": { ... } }`
 * with a roster {@link MediaPolicySchema} admits.
 */
export class InstallPolicyError extends Schema.TaggedError<InstallPolicyError>()(
  "InstallPolicyError",
  { path: Schema.String, reason: Schema.Unknown },
) {
  /**
   * The file, why it was refused, and the setting that named its folder.
   */
  override get message(): string {
    return `Cannot read the install's policy at ${this.path}, in the folder GR8DES_QTI_INSTALL names: ${String(this.reason)}. Write it as exactly { "media": { "svg": "image/svg+xml", ... } }, each extension in lower case with one media type, or unset GR8DES_QTI_INSTALL to open this package's own install.`;
  }
}

/**
 * The install folder `GR8DES_QTI_INSTALL` names, none where it is unset or empty, as an unset
 * setting of scripts/db.sh is.
 */
const installFolder = Config.option(Config.String("GR8DES_QTI_INSTALL")).pipe(
  Config.map(Option.filter((folder) => folder !== "")),
);

/**
 * Read the install `GR8DES_QTI_INSTALL` names: its folder, resolved against the working directory,
 * and its `policy.json`, decoded once, here. Unset, it is none, and nothing is read.
 *
 * It fails with Effect's `ConfigError` for a setting that cannot be read, and with an
 * {@link InstallPolicyError} for a policy file that is missing, is no JSON, holds another key, or
 * holds a roster {@link MediaPolicySchema} refuses.
 */
export const readInstall = Effect.gen(function* readInstall() {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const named = yield* installFolder;
  if (Option.isNone(named)) {
    return Option.none<QtiInstall>();
  }

  const folder = path.resolve(named.value);
  const file = path.join(folder, "policy.json");
  const policy = yield* fs.readFileString(file).pipe(
    Effect.flatMap((text) =>
      Schema.decodeUnknownEffect(PolicyText)(text, { onExcessProperty: "error" }),
    ),
    Effect.mapError((reason) => new InstallPolicyError({ path: file, reason })),
  );
  const install: QtiInstall = { folder, policy };

  return Option.some(install);
}).pipe(Effect.withSpan("db.readInstall"));

/**
 * The install this process opens, read once, when this module loads, through the process's own
 * settings: `#pantry/qti/own.ts` builds `Qti` with its policy, and `AuthorAppLayer` opens its
 * served file, so the two never disagree. A policy file it refuses fails the load, naming the file.
 */
export const installed: Option.Option<QtiInstall> = await Effect.runPromise(
  readInstall.pipe(Effect.provide(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer))),
);

/**
 * The policy `Qti` is built with in this process: the install's, none for this package's own.
 */
export const installedPolicy: Option.Option<MediaPolicy> = installed.pipe(
  Option.map(({ policy }) => policy),
);

/**
 * Name the served file an install's grizzle config generated for the author login:
 * `migrations/qti/served/author_app.json` in its folder, as that config writes it for the schema
 * `Qti`.
 *
 * @param install - The install.
 * @returns The served file's path.
 */
export const servedPathOf = (install: QtiInstall): string =>
  `${install.folder}/migrations/qti/served/author_app.json`;
