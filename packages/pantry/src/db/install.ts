/**
 * The install this process opens: this package's own, whose schema is the default `Qti` and whose
 * snapshot is the committed one, or a single-CDN install, the folder `GR8DES_QTI_INSTALL` names.
 *
 * A single-CDN install's folder holds `policy.json`, its policy, and `migrations/`, the migrations
 * a grizzle config outside this package generated for it, the author login's served file
 * `migrations/qti/served/author_app.json` among them. The setting tells this package's runtime and
 * command line two things and nothing else: the policy the `Qti` schema is built with
 * (`#pantry/qti/own.ts`), and the served file `AuthorAppLayer` opens (`#pantry/db/layer.ts`). Its
 * migrations are never this package's to generate or apply: grizzle.config.ts installs the default
 * `Qti` whatever the setting says.
 */
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { Config, Effect, FileSystem, Layer, Option, Path, Schema } from "effect";

/**
 * The origin every address a player fetches starts with: an `https://` URL of one host, its port
 * where it names one, and the root path, `/`, as the URL Standard serializes it, so the text an
 * author writes before the path is exactly this one. A host is lowercase letters, digits and inner
 * hyphens and dots, so the origin holds no character a pattern reads as an operator but the dot.
 *
 * @see {@link https://url.spec.whatwg.org/#concept-url-serializer | URL Standard, URL serializing}
 */
export const CdnOrigin = Schema.String.check(
  Schema.isPattern(/^https:\/\/[a-z0-9]+(?:[.-][a-z0-9]+)*(?::[0-9]{1,5})?\/$/u, {
    message:
      "Use an https:// origin and the root path, such as https://cdn.example.com/: a lowercase host, an optional port, and one slash after it",
  }),
  Schema.makeFilter(
    (origin: string) => URL.canParse(origin) && `${new URL(origin).origin}/` === origin,
    {
      message:
        "Write the origin as the URL Standard serializes it: a port is a number from 1 to 65535, and the default port 443 is left out",
    },
  ),
);

/**
 * An install's policy, `policy.json`: exactly `{ "cdn": "<origin>" }`, every address the player
 * fetches on that one origin.
 */
export const CdnPolicySchema = Schema.Struct({ cdn: CdnOrigin });

/**
 * A single-CDN install's policy.
 */
export type CdnPolicy = typeof CdnPolicySchema.Type;

/**
 * `policy.json`'s text as its policy: JSON whose one key is `cdn`.
 */
const PolicyText = Schema.fromJsonString(CdnPolicySchema);

/**
 * A single-CDN install: its folder, absolute, and its policy.
 */
export interface QtiInstall {
  readonly folder: string;
  readonly policy: CdnPolicy;
}

/**
 * The install folder's `policy.json` could not be read, or is not exactly `{ "cdn": "<origin>" }`
 * with an origin {@link CdnOrigin} admits.
 */
export class InstallPolicyError extends Schema.TaggedError<InstallPolicyError>()(
  "InstallPolicyError",
  { path: Schema.String, reason: Schema.Unknown },
) {
  /**
   * The file, why it was refused, and the setting that named its folder.
   */
  override get message(): string {
    return `Cannot read the install's policy at ${this.path}, in the folder GR8DES_QTI_INSTALL names: ${String(this.reason)}. Write it as exactly { "cdn": "https://<host>/" }, or unset GR8DES_QTI_INSTALL to open this package's own install.`;
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
 * names an origin {@link CdnOrigin} refuses.
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
export const installedPolicy: Option.Option<CdnPolicy> = installed.pipe(
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
