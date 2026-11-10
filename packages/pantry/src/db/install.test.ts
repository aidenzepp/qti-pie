/**
 * The install `GR8DES_QTI_INSTALL` names (`#pantry/db/install.ts`), against its specification: an
 * unset or empty setting is this package's own install and reads nothing, and a folder's
 * `policy.json` is admitted exactly when it is `{ "cdn": "<origin>" }` with an `https://` origin as
 * the URL Standard serializes one, each variant exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { ConfigProvider, Duration, Effect, FileSystem, Formatter, Option, Result } from "effect";
import { InstallPolicyError, readInstall } from "#pantry/db/install.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * One variant of the setting and its folder's `policy.json`: the setting's text, if any, the
 * file's text, if any, and the origin the reader admits, or none where it refuses the file.
 */
interface Variant {
  readonly admits: Option.Option<string>;
  readonly name: string;
  readonly policy: Option.Option<string>;
  readonly setting: "empty" | "folder" | "unset";
}

/**
 * A variant whose folder holds a policy file.
 *
 * @param name - What the variant is, as a failing case prints it.
 * @param policy - The file's text.
 * @param admits - The origin the reader admits, none where it refuses the file.
 * @returns The variant.
 */
const withPolicy = (name: string, policy: string, admits: Option.Option<string>): Variant => ({
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
 * A variant whose policy file names an origin.
 *
 * @param name - What the variant is, as a failing case prints it.
 * @param origin - The origin the file names.
 * @param admitted - Whether the reader admits it.
 * @returns The variant.
 */
const originPolicy = (name: string, origin: string, admitted: boolean): Variant =>
  withPolicy(name, JSON.stringify({ cdn: origin }), admitted ? Option.some(origin) : Option.none());

/**
 * Every variant: the setting unset or empty, which read nothing, and a folder with each policy the
 * specification names, admitted or refused.
 */
const variants = [
  { admits: Option.none(), name: "unset", policy: Option.none(), setting: "unset" },
  { admits: Option.none(), name: "empty", policy: Option.none(), setting: "empty" },
  originPolicy("the install's own", "https://cdn.edullm.ai/", true),
  originPolicy("a port", "https://cdn.example.test:8443/", true),
  originPolicy("a hyphenated host", "https://media-cdn.example.test/", true),
  originPolicy("http", "http://cdn.edullm.ai/", false),
  originPolicy("no root path", "https://cdn.edullm.ai", false),
  originPolicy("a path", "https://cdn.edullm.ai/media/", false),
  originPolicy("an uppercase host", "https://CDN.edullm.ai/", false),
  originPolicy("the default port written", "https://cdn.edullm.ai:443/", false),
  originPolicy("a port past 65535", "https://cdn.edullm.ai:65536/", false),
  originPolicy("a query", "https://cdn.edullm.ai/?a", false),
  originPolicy("credentials", "https://user@cdn.edullm.ai/", false),
  originPolicy("a leading hyphen", "https://-cdn.edullm.ai/", false),
  refusedPolicy("another key beside cdn", `{ "cdn": "https://cdn.edullm.ai/", "extra": 1 }`),
  refusedPolicy("no cdn", "{}"),
  refusedPolicy("cdn not a string", `{ "cdn": 1 }`),
  refusedPolicy("no JSON", "cdn: https://cdn.edullm.ai/"),
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
    "reads nothing for an unset or empty setting, admits a policy of exactly an https:// origin as the URL Standard serializes it, and refuses every other file by its path: every variant, exhausted",
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
                name: "the install's policy: exactly { cdn }, an https:// origin and the root path, as the URL Standard serializes it",
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
                  Result.succeed(Option.some({ folder, policy: { cdn: variant.admits.value } })),
                  variant.name,
                );
              }),
          ),
        );
      }),
  );
});
