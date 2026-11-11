/**
 * The package-media level (`#pantry/levels/media.ts`), with no database:
 *
 * - **Its builder**: `packageMedia` extends its base with a level named `Media`, once per base and
 *   set of extensions, whatever the roster's order or media types.
 * - **Its options**: `MediaOptions` admits a roster of lowercase extensions, each with one lowercase
 *   media type and no parameter, and refuses an empty roster, an extension or a type in another
 *   form, a key beside `media`, and a media type listed under two extensions: an accepting and a
 *   refusing twin of each.
 * - **Its laws**: the level states `MediaPath`, `MediaType` and `MediaEntryUsed` over relations of
 *   its own, and the shared data, style and foreign-markup rules under its own names, `MediaData`,
 *   `MediaStyle` and `MediaForeign`; every law it adds is a check over a relation of its own, so it
 *   states no law of `Qti` that `Qti` does not, and none of the `Cdn` level's names.
 * - **Its installation compiles**: grizzle's own check compiles an installation whose top level is
 *   the `Media` level, every statement of it, as `src/test/compile.test.ts` compiles `Qti`.
 */
import { lawsOf, schemaNameOf } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect, Exit, Formatter, Record as Rec, Schema } from "effect";
import { MediaOptions, packageMedia } from "#pantry/levels/media.ts";
import { qti } from "#pantry/qti/schema.ts";
import { grizzleCheck, writtenMediaConfig } from "#pantry/test/grizzle-check.ts";
import { addedLaws } from "#pantry/test/level-laws.ts";

/**
 * The roster the tests build the level for.
 */
const media = { png: "image/png", svg: "image/svg+xml" } as const;

/**
 * Decode a candidate's encoded options with the level's options schema, refusing a key beside
 * `media`, as an app decodes its policy file.
 *
 * @param candidate - The options to decode, as the app's file holds them.
 * @returns The decode's exit.
 */
const decode = (candidate: typeof MediaOptions.Encoded) =>
  Schema.decodeUnknownExit(MediaOptions)(candidate, { onExcessProperty: "error" });

/**
 * Each check the level adds and the relations it is stated over, sorted: the oracle is the
 * package-media laws of the policy mode this level replaces (Media path, Media type, Entry used,
 * media data, media style and media foreign), restated as derived relations, the shared three
 * named for the level as the `Cdn` level names its own.
 */
const mediaChecks = {
  MediaData: [
    "MediaDataAddressList",
    "MediaDataUriAttribute",
    "MediaDataUriText",
    "MediaDataUriTextEntity",
  ],
  MediaEntryUsed: ["MediaUnusedEntry"],
  MediaForeign: ["MediaForeignAttribute", "MediaForeignElement"],
  MediaPath: [
    "MediaFetchedAttribute",
    "MediaFetchedText",
    "MediaFetchedTextEntity",
    "MediaUnresolvedAttribute",
    "MediaUnresolvedText",
  ],
  MediaStyle: ["MediaStyleAttribute"],
  MediaType: ["MediaFetchedPath", "MediaFetchedTextPath"],
} as const satisfies Readonly<Record<string, readonly string[]>>;

/**
 * Group the check laws of a list by name, each with the relations it is stated over, sorted.
 *
 * @param laws - The laws.
 * @returns The relations of each check name.
 */
const checksByName = (laws: readonly Law[]): Readonly<Record<string, readonly string[]>> =>
  Rec.map(
    Arr.groupBy(
      laws.flatMap((law) => (law.kind === "check" ? [law] : [])),
      (law) => law.name,
    ),
    (checks) => checks.map((law) => law.relation).toSorted(),
  );

describe("packageMedia", () => {
  it("names the level media, the PostgreSQL schema it installs into", () => {
    // Oracle: `schema.extend(base, "Media", ...)`; each level is its own PostgreSQL schema, named
    // for the level, as `singleCdn`'s is `cdn`.
    assert.strictEqual(schemaNameOf(packageMedia(qti(), { media })), "media");
  });

  it("gives the same level for the same base and extensions, whatever their order or media types", () => {
    // Oracle: the roster's media types are the app's to serve with and state no law; only its
    // extensions reach the level's pattern, so the level is memoized by base and extensions.
    const level = packageMedia(qti(), { media });

    assert.strictEqual(packageMedia(qti(), { media: { png: media.png, svg: media.svg } }), level);
    assert.strictEqual(
      packageMedia(qti(), { media: { png: "image/apng", svg: media.svg } }),
      level,
    );
    assert.notStrictEqual(packageMedia(qti(), { media: { png: media.png } }), level);
  });
});

describe("MediaOptions", () => {
  it("admits a roster of lowercase extensions, each with one lowercase media type", () => {
    assert.isTrue(Exit.isSuccess(decode({ media })));
    assert.isTrue(Exit.isSuccess(decode({ media: { mp4: "video/mp4" } })));
  });

  it("refuses each twin of an admitted roster that breaks one rule", () => {
    // Oracle: the package-media policy's roster rules, each broken once: at least one extension;
    // an extension lowercase ASCII letters and digits without its dot; a media type a lowercase
    // type and subtype with no parameter (RFC 6838, §4.2); one extension per media type; no key
    // beside `media`.
    const withOrigin = { media, origin: "https://cdn.example.com/" };
    const twins: readonly (typeof MediaOptions.Encoded)[] = [
      { media: {} },
      { media: { PNG: "image/png" } },
      { media: { ".png": "image/png" } },
      { media: { png: "Image/PNG" } },
      { media: { png: "image/png; charset=binary" } },
      { media: { jpeg: "image/jpeg", jpg: "image/jpeg" } },
      withOrigin,
    ];

    assert.deepStrictEqual(
      twins.filter((twin) => Exit.isSuccess(decode(twin))),
      [],
      "a roster that breaks a rule decodes",
    );
  });
});

describe("levels/media.ts, the laws", () => {
  it(
    "states each Media check over the level's own derived relations, and no law over a Qti relation",
    () => {
      // Oracle: `mediaChecks` above; a level only adds laws, so no `Qti` law is dropped and every
      // added law is a check over one of the level's own relations.
      const base = qti();
      const level = packageMedia(base, { media });
      const baseLaws = lawsOf(base);
      const levelLaws = lawsOf(level);
      const added = addedLaws(levelLaws, baseLaws);
      const baseNames = new Set(Object.keys(base.relations));
      const ownNames = new Set(Object.keys(level.relations).filter((name) => !baseNames.has(name)));

      assert.deepStrictEqual(checksByName(added), mediaChecks);
      assert.deepStrictEqual(addedLaws(baseLaws, levelLaws), [], "a Qti law the level drops");
      for (const law of added) {
        assert.isTrue(
          law.kind === "check" && ownNames.has(law.relation),
          `${Formatter.format(law)} is a law the level states over no relation of its own`,
        );
      }
    },
    // How long reading the level's laws may take: `lawsOf` compiles `Qti`'s law model and the
    // level's. Its measurement is owed (`exempt` of `src/test/timeouts.test.ts`).
    600_000,
  );

  it.effect(
    "grizzle check compiles an installation holding the Media level: no statement of it does not compile",
    () =>
      Effect.scoped(
        Effect.gen(function* compiles() {
          const config = yield* writtenMediaConfig("media-compile", media);
          const { code, output } = yield* grizzleCheck(config);
          const lines = output.split("\n");

          // Oracle: grizzle's `compileSchema` and program compilation, as `grizzle check` runs
          // them over the installation. Drift against the committed snapshot passes, as in
          // `src/test/compile.test.ts`. Bound: the one installation; residual none.
          assert.isTrue(
            code === 0 || code === 1,
            `grizzle check exited ${String(code)}:\n${output}`,
          );
          assert.isTrue(
            lines.some((line) => line.startsWith("Media: ")),
            `grizzle check printed no Media line:\n${output}`,
          );
          assert.deepStrictEqual(
            lines.filter((line) => line.includes("does not compile")),
            [],
          );
        }),
      ),
    // How long grizzle's check of the installation may take: it compiles every statement of `Qti`
    // and of the level, and every program of the author's login. Its measurement is owed (`exempt`
    // of `src/test/timeouts.test.ts`).
    360_000,
  );
});
