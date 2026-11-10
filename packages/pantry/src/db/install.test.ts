/**
 * The install `GR8DES_QTI_INSTALL` names (`#pantry/db/install.ts`), against its specification: an
 * unset or empty setting is this package's own install and reads nothing, and a folder's
 * `policy.json` is admitted exactly when it is `{ "media": { ... } }`, a roster of at least one
 * lowercase extension, each with a lowercase media type of RFC 6838's restricted names and no
 * parameter, and each media type under one extension, each variant exhausted. The single-CDN
 * policy, `{ "cdn": "<origin>" }`, is refused like any other file.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { ConfigProvider, Duration, Effect, FileSystem, Formatter, Option, Result } from "effect";
import { InstallPolicyError, readInstall } from "#pantry/db/install.ts";
import type { MediaPolicy } from "#pantry/db/install.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * One variant of the setting and its folder's `policy.json`: the setting's text, if any, the
 * file's text, if any, and the policy the reader admits, or none where it refuses the file.
 */
interface Variant {
  readonly admits: Option.Option<MediaPolicy>;
  readonly name: string;
  readonly policy: Option.Option<string>;
  readonly setting: "empty" | "folder" | "unset";
}

/**
 * A variant whose folder holds a policy file.
 *
 * @param name - What the variant is, as a failing case prints it.
 * @param policy - The file's text.
 * @param admits - The policy the reader admits, none where it refuses the file.
 * @returns The variant.
 */
const withPolicy = (name: string, policy: string, admits: Option.Option<MediaPolicy>): Variant => ({
  admits,
  name,
  policy: Option.some(policy),
  setting: "folder",
});

/**
 * A variant whose policy file the reader refuses.
 *
 * @param name - What the variant is, as a failing case prints it.
 * @param policy - The file's text.
 * @returns The variant.
 */
const refusedPolicy = (name: string, policy: string): Variant =>
  withPolicy(name, policy, Option.none());

/**
 * A variant whose policy file is `{ "media": <roster> }`.
 *
 * @param name - What the variant is, as a failing case prints it.
 * @param media - The roster the file writes.
 * @param admitted - Whether the reader admits it.
 * @returns The variant.
 */
const mediaPolicy = (
  name: string,
  media: Readonly<Record<string, string>>,
  admitted: boolean,
): Variant =>
  withPolicy(name, JSON.stringify({ media }), admitted ? Option.some({ media }) : Option.none());

/**
 * The roster of the install the policy was written for: one spelling per media type, in lower case.
 */
const nineTypes = {
  gif: "image/gif",
  jpg: "image/jpeg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  png: "image/png",
  svg: "image/svg+xml",
  webm: "video/webm",
  webp: "image/webp",
} as const;

/**
 * Every variant: the setting unset or empty, which read nothing, and a folder with each policy the
 * specification names, admitted or refused.
 */
const variants = [
  { admits: Option.none(), name: "unset", policy: Option.none(), setting: "unset" },
  { admits: Option.none(), name: "empty", policy: Option.none(), setting: "empty" },
  mediaPolicy("the nine types of the install's own roster", nineTypes, true),
  mediaPolicy("one extension", { svg: "image/svg+xml" }, true),
  mediaPolicy("a vendor type", { eot: "application/vnd.ms-fontobject" }, true),
  mediaPolicy(
    "a type of 127-character names",
    { x: `${"a".repeat(127)}/${"b".repeat(127)}` },
    true,
  ),
  mediaPolicy(
    "jpeg beside jpg, one type spelled twice",
    { ...nineTypes, jpeg: "image/jpeg" },
    false,
  ),
  mediaPolicy("an uppercase extension", { SVG: "image/svg+xml" }, false),
  mediaPolicy("an extension with its dot", { ".svg": "image/svg+xml" }, false),
  mediaPolicy("an empty extension", { "": "image/png" }, false),
  mediaPolicy("an extension with a hyphen", { "tar-gz": "application/gzip" }, false),
  mediaPolicy("an uppercase media type", { svg: "image/SVG+xml" }, false),
  mediaPolicy("a media type with a parameter", { css: "text/css; charset=utf-8" }, false),
  mediaPolicy("a media type with no subtype", { svg: "image" }, false),
  mediaPolicy("a name past 127 characters", { x: `${"a".repeat(128)}/b` }, false),
  mediaPolicy("no extension at all", {}, false),
  refusedPolicy("the single-CDN policy, deleted", `{ "cdn": "https://cdn.edullm.ai/" }`),
  refusedPolicy(
    "another key beside media",
    `{ "media": { "svg": "image/svg+xml" }, "cdn": "https://cdn.edullm.ai/" }`,
  ),
  refusedPolicy("media not a record", `{ "media": "svg" }`),
  refusedPolicy("a media type not a string", `{ "media": { "svg": 1 } }`),
  refusedPolicy("no media", "{}"),
  refusedPolicy("no JSON", "media: svg"),
  {
    admits: Option.none(),
    name: "no policy file",
    policy: Option.none(),
    setting: "folder",
  },
] as const satisfies readonly Variant[];

/**
 * What a case reaches: this package's own install, an admitted policy, or a refused one.
 */
type Reached = "admitted" | "own" | "refused";

layer(NodeServices.layer)("db/install.ts, under GR8DES_QTI_INSTALL", (it) => {
  it.effect(
    "reads nothing for an unset or empty setting, admits a policy of exactly a media roster, one lowercase extension per lowercase media type, and refuses every other file by its path, the single-CDN policy among them: every variant, exhausted",
    (ctx) =>
      Effect.gen(function* everyVariant() {
        const fs = yield* FileSystem.FileSystem;
        const scratch = yield* scratchDirectory("db-install-");

        return yield* searched(
          ctx,
          exhaust(
            {
              box: "every variant of the setting and its policy file",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<Reached>(["admitted", "own", "refused"]),
              generator: (source) => source.draw(element(variants)),
              limit: variants.length,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "the install's policy: exactly { media }, at least one extension of lowercase ASCII letters and digits, each with a lowercase media type of RFC 6838's restricted names and no parameter, each media type under one extension",
              },
              suite: "db/install/policy",
            },
            (variant, c) =>
              Effect.gen(function* oneCase() {
                const folder = `${scratch}/${String(variants.indexOf(variant))}`;
                yield* fs.makeDirectory(folder, { recursive: true });
                if (Option.isSome(variant.policy)) {
                  yield* fs.writeFileString(`${folder}/policy.json`, variant.policy.value);
                }

                const settings =
                  variant.setting === "unset"
                    ? {}
                    : { GR8DES_QTI_INSTALL: variant.setting === "empty" ? "" : folder };
                const read = yield* readInstall.pipe(
                  Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(settings))),
                  Effect.result,
                );

                if (variant.setting !== "folder") {
                  c.note("own");
                  assert.deepStrictEqual(read, Result.succeed(Option.none()));

                  return;
                }

                if (Option.isNone(variant.admits)) {
                  c.note("refused");

                  const failure = Result.isFailure(read) ? read.failure : undefined;

                  assert.instanceOf(failure, InstallPolicyError, variant.name);
                  assert.strictEqual(
                    failure instanceof InstallPolicyError ? failure.path : undefined,
                    `${folder}/policy.json`,
                  );
                  assert.include(failure?.message, "GR8DES_QTI_INSTALL");

                  return;
                }

                c.note("admitted");
                assert.deepStrictEqual(
                  read,
                  Result.succeed(Option.some({ folder, policy: variant.admits.value })),
                  variant.name,
                );
              }),
          ),
        );
      }),
  );
});
