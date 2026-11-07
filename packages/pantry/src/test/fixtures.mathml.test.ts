import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { examplesTarball } from "#pantry/test/fixtures.ts";
import {
  materializeMathml,
  mathmlFixtureNames,
  mathmlNegatives,
  mathmlPositives,
  mathmlSpecOf,
} from "#pantry/test/fixtures.mathml.ts";
import type { MathmlFixtureName } from "#pantry/test/fixtures.mathml.ts";

/**
 * Whether the examples tarball, which every fixture is cut from, is on this machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * The negatives whose expectation PR #46 decides: its `+0.5` item and the negatives its reply
 * measured as refused today (its table of 15, less `math-space-in-mspace`, a positive now).
 */
const pr46Negatives = [
  "math-bad-color",
  "math-bad-href",
  "math-cn-base-plus",
  "math-data-attribute",
  "math-display-center",
  "math-display-on-mi",
  "math-duplicate-id",
  "math-in-blockquote",
  "math-maction-bare",
  "math-mi-in-p",
  "math-number-plus",
  "math-position-plus",
  "math-printed-variable",
  "math-rowspan-plus",
  "math-text-in-mfrac",
  "math-unnamespaced",
] as const;

/**
 * Every file a materialized package holds, files only.
 *
 * @param dir - The package directory.
 * @returns The file paths, relative to `dir`, sorted.
 */
const filesOf = Effect.fn("filesOf")(function* filesOf(dir: string) {
  const fs = yield* FileSystem.FileSystem;
  const entries = yield* fs.readDirectory(dir, { recursive: true });
  const files: string[] = [];

  for (const entry of entries) {
    if ((yield* fs.stat(`${dir}/${entry}`)).type === "File") {
      files.push(entry);
    }
  }

  return files.toSorted();
});

/**
 * The files a manifest lists: the `href` of each resource and of each `file` under it, as written.
 *
 * @param manifest - A manifest's text.
 * @returns The distinct hrefs, sorted.
 */
const listedBy = (manifest: string): readonly string[] =>
  [
    ...new Set(
      [...manifest.matchAll(/<(?:resource|file)\b[^>]*\shref="(?<href>[^"]*)"/gu)].map(
        (match) => match.groups?.["href"] ?? "",
      ),
    ),
  ].toSorted();

/**
 * The text each `ReplaceText` edit of a fixture's spec inserts, with the file it edits.
 *
 * @param name - The fixture's name.
 * @returns One `[file, replacement]` pair per text edit, in spec order.
 */
const insertionsOf = (name: MathmlFixtureName): readonly (readonly [string, string])[] =>
  mathmlSpecOf(name).edits.flatMap((edit) =>
    edit._tag === "ReplaceText" ? [[edit.file, edit.replacement] as const] : [],
  );

describe("the MathML fixture data", () => {
  it("names every fixture once, positives and negatives apart", () => {
    const names = [...mathmlPositives, ...mathmlNegatives].map(({ name }) => name);

    assert.strictEqual(new Set(names).size, names.length);
    assert.deepStrictEqual(names, [...mathmlFixtureNames]);
    assert.strictEqual(mathmlPositives.length, 57);
    assert.strictEqual(mathmlNegatives.length, 48);
  });

  it("states every positive as accepted and every negative as refused", () => {
    assert.isTrue(mathmlPositives.every(({ verdict }) => verdict === "accepted"));
    assert.isTrue(mathmlNegatives.every(({ verdict }) => verdict === "refused"));
  });

  it("makes the empty-content and mglyph rulings positives, not negatives", () => {
    const accepted: ReadonlySet<string> = new Set(mathmlPositives.map(({ name }) => name));
    const refused: ReadonlySet<string> = new Set(mathmlNegatives.map(({ name }) => name));

    for (const name of [
      "math-space-in-mspace",
      "math-mglyph-bare",
      "math-mglyph-no-alt",
      "math-mglyph-alt-only",
      "math-mglyph-deprecated",
      "math-closure-half",
    ]) {
      assert.isTrue(accepted.has(name), `${name} is not a positive`);
      assert.isFalse(refused.has(name), `${name} is also a negative`);
    }

    assert.isFalse(refused.has("math-interval-closure"));
  });

  it("gives the four negatives its brief names, with the rules the table gives", () => {
    const byName = new Map(mathmlNegatives.map((negative) => [negative.name, negative]));

    for (const [name, law, rule] of [
      ["math-hexdouble-short", "MathML cn form", "attribute-lexical"],
      ["math-cn-integer-letters", "MathML cn form", "attribute-lexical"],
      ["math-cn-base-plus", "value domain", "attribute-lexical"],
      ["math-number-plus", "value domain", "attribute-lexical"],
    ] as const) {
      assert.strictEqual(byName.get(name)?.law, law, name);
      assert.strictEqual(byName.get(name)?.rule, rule, name);
    }
  });

  it("owns the PR #46 expectations by #46 and every other by phase 6", () => {
    const owned = mathmlNegatives.filter(({ owner }) => owner === "pr-46").map(({ name }) => name);

    assert.deepStrictEqual(owned.toSorted(), [...pr46Negatives]);
    assert.isTrue(mathmlPositives.every(({ owner }) => owner === "phase-6"));
  });

  it("pins math-bad-href alone, at phase 6's integration", () => {
    assert.deepStrictEqual(
      mathmlNegatives.filter(({ pinned }) => pinned).map(({ name, rule }) => [name, rule]),
      [["math-bad-href", "attribute-lexical"]],
    );
  });

  it("asserts no rule for the invalid-URI attributes of cdgroup and mglyph src", () => {
    for (const name of mathmlFixtureNames) {
      for (const [, replacement] of insertionsOf(name)) {
        assert.notInclude(replacement, 'cdgroup="%zz"');
        assert.notInclude(replacement, 'src="%zz"');
      }
    }
  });
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.mathml.ts materialization (skipped without the examples tarball)",
  (materialized) => {
    materialized.effect.skipIf(!tarballPresent)(
      "math-gen-12 keeps image.png, which only an altimg names, beside its document",
      () =>
        Effect.gen(function* keepsImage() {
          const dir = yield* materializeMathml("math-gen-12");

          assert.include(yield* filesOf(dir), "image.png");
        }),
    );

    for (const name of mathmlFixtureNames) {
      materialized.effect.skipIf(!tarballPresent)(
        `${name} materializes, holds its edits and lists every file it holds`,
        () =>
          Effect.gen(function* materializesFixture() {
            const fs = yield* FileSystem.FileSystem;
            const dir = yield* materializeMathml(name);

            for (const [file, replacement] of insertionsOf(name)) {
              const text = yield* fs.readFileString(`${dir}/${file}`);

              assert.include(text, replacement, `${name}: ${file} lacks its edit`);
            }

            const listed = new Set(listedBy(yield* fs.readFileString(`${dir}/imsmanifest.xml`)));
            const held = (yield* filesOf(dir)).filter((file) => file !== "imsmanifest.xml");

            for (const file of held) {
              assert.isTrue(listed.has(file), `${name}: the manifest does not list ${file}`);
            }
          }),
      );
    }
  },
);
