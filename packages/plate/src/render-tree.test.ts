/**
 * The tree seam under `render` and `renderStatus`: `renderTree` and `statusTree` give the very tree
 * the two serialise, so each serialises to the HTML its counterpart returns, with the same
 * instance, and each refuses what its counterpart refuses, in the same order.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { h } from "#plate/emit/node.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import type { Redacted } from "#plate/payload.ts";
import { redact, render, renderStatus, renderTree, statusTree } from "#plate/render.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The package's root, which the fixture folders sit under.
 */
const packageRoot = path.resolve(import.meta.dirname, "..");

/**
 * The fixture folders whose every item the seam is checked over: M2's and this area's.
 */
const itemFolders = ["fixtures/m2/items", "fixtures/m3g/items"] as const;

/**
 * The instance every render here uses.
 */
const instance = "t1";

/**
 * List every item of {@link itemFolders}, as paths relative to the package's root.
 *
 * @returns The items' paths, in folder order and then by name.
 */
const fixtureItems = Effect.gen(function* listItems() {
  const listed = yield* Effect.all(
    itemFolders.map((folder) =>
      Effect.promise(() => readdir(path.join(packageRoot, folder))).pipe(
        Effect.map((names) =>
          names
            .filter((name) => name.endsWith(".xml"))
            .toSorted()
            .map((name) => `${folder}/${name}`),
        ),
      ),
    ),
  );

  return listed.flat();
});

/**
 * Open one fixture item, check it and redact it.
 *
 * @param file The item's path relative to the package's root.
 * @returns The redacted item.
 */
const redactedFixture = (file: string) =>
  Effect.gen(function* redactFixture() {
    const bytes = yield* Effect.promise(() => readFile(path.join(packageRoot, file)));
    const accepted = Option.getOrThrow(acceptedItem(yield* open(file, new Uint8Array(bytes))));

    return redact(accepted);
  });

/**
 * The seven headings a Status input names.
 */
const headings: readonly StatusInput["heading"][] = [
  "notAccepted",
  "partSubmitted",
  "responseRecorded",
  "review",
  "scored",
  "solution",
  "testFinished",
];

/**
 * Give the tag of a `Result`'s failure, or `success` when it succeeded.
 *
 * @param result The result.
 * @returns The failure's `_tag`, or `success`.
 */
const tagOf = (result: Result.Result<unknown, { readonly _tag: string }>): string =>
  Result.isFailure(result) ? result.failure._tag : "success";

describe("renderTree", () => {
  it.effect("[m3g-01] renderTree serialises to render's HTML for every fixture item", () =>
    Effect.gen(function* serialisesToRender() {
      const configuration = yield* configure({});
      const items = yield* fixtureItems;

      assert.include(items, "fixtures/m3g/items/m3g-composite.xml");

      for (const file of items) {
        const redacted = yield* redactedFixture(file);
        const tree = Result.getOrThrow(renderTree(redacted, configuration, { instance }));
        const rendered = Result.getOrThrow(render(redacted, configuration, { instance }));

        assert.strictEqual(Result.getOrThrow(toHtml(tree.root)), rendered.html, file);
        assert.strictEqual(tree.instance, instance, file);
        assert.strictEqual(rendered.instance, instance, file);
      }
    }),
  );

  it.effect("[m3g-01] renderTree refuses what render refuses, in the same order", () =>
    Effect.gen(function* refusesAsRender() {
      const configuration = yield* configure({});
      const redacted = yield* redactedFixture("fixtures/m2/items/p2-choice.xml");
      // SAFETY: the spread copy is exactly the value render must refuse, a copy with no mark.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above: a copy that type-checks is the input under test.
      const copy = { ...redacted } as Redacted;
      const unknownPart = {
        parts: { "choice-interaction": { nope: () => h("div", {}) } },
      };
      const cases = [
        { expected: "NotRedacted", item: copy, options: { instance } },
        { expected: "InvalidInstance", item: redacted, options: { instance: "a--b" } },
        { expected: "UnknownPart", item: redacted, options: { ...unknownPart, instance } },
        {
          expected: "NotRedacted",
          item: copy,
          options: { ...unknownPart, instance: "a--b" },
        },
        {
          expected: "UnknownPart",
          item: redacted,
          options: { ...unknownPart, instance: "a--b" },
        },
      ];

      for (const { expected, item, options } of cases) {
        assert.strictEqual(tagOf(render(item, configuration, options)), expected);
        assert.strictEqual(tagOf(renderTree(item, configuration, options)), expected);
      }
    }),
  );
});

describe("statusTree", () => {
  it.effect("[m3g-01] statusTree serialises to renderStatus's HTML for each heading", () =>
    Effect.gen(function* serialisesToRenderStatus() {
      const configuration = yield* configure({});

      for (const heading of headings) {
        const input: StatusInput = { heading, instance, score: "1" };
        const tree = Result.getOrThrow(statusTree(input, configuration));
        const rendered = Result.getOrThrow(renderStatus(input, configuration));

        assert.strictEqual(Result.getOrThrow(toHtml(tree.root)), rendered.html, heading);
        assert.strictEqual(tree.instance, instance, heading);
        assert.strictEqual(rendered.instance, instance, heading);
      }
    }),
  );
});
