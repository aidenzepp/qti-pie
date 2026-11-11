/**
 * The package-media level's type rule (`#pantry/levels/media-type.ts`), with no database:
 *
 * - **Its pattern**, {@link typedPathPattern}, as a JavaScript regular expression under the flag `u`,
 *   against Node's `path.posix.extname` of the path's last segment, the reading the rule states,
 *   written apart from it: a path is admitted exactly when its extension is one the roster lists,
 *   case-sensitively. A search over path pieces and rosters, and an accepting and a refusing twin
 *   of each case.
 * - **Its roster order**: two rosters of the same extensions give one pattern.
 */
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { typedPathPattern } from "#pantry/levels/media-type.ts";

/**
 * Decide, as the rule states it, whether a path's extension is one a roster lists: Node's
 * `path.posix.extname` of its last segment, the text after its last `/`, without its dot, matched
 * as written. The segment is read alone because `extname` of a whole path sets a trailing `/`
 * aside, while a path that ends with `/` names no file and has no extension.
 *
 * @param entry - The resolved path.
 * @param extensions - The roster's extensions.
 * @returns Whether the path is admitted.
 */
const listed = (entry: string, extensions: readonly string[]): boolean => {
  const extension = path.posix.extname(entry.slice(entry.lastIndexOf("/") + 1));

  return extension !== "" && extensions.includes(extension.slice(1));
};

/**
 * The rosters a case draws its extensions from.
 */
const rosters = [["png"], ["png", "svg"], ["mp4", "svg", "jpg"]] as const;

/**
 * The pieces a path is drawn from: segment text, the extensions of the rosters and their other
 * spellings, dots and slashes.
 */
const pieces = [
  "a",
  "img",
  "png",
  "PNG",
  "svg",
  "jpg",
  "jpeg",
  "mp4",
  ".",
  "..",
  "/",
  "-",
  "x1",
] as const;

/**
 * The twins of the rule's pattern under the roster `png`, `svg`: each path with whether it is
 * admitted.
 */
const twins = [
  { admitted: true, entry: "images/a.png" },
  { admitted: false, entry: "images/a.PNG" },
  { admitted: true, entry: "a.svg" },
  { admitted: false, entry: "a.svgz" },
  { admitted: true, entry: "a.b.png" },
  { admitted: false, entry: "a.png.exe" },
  { admitted: true, entry: "dir.x/b..png" },
  { admitted: false, entry: "images/.png" },
  { admitted: true, entry: "png/a.png" },
  { admitted: false, entry: "a.png/b" },
  { admitted: true, entry: "x/a-1.svg" },
  { admitted: false, entry: "a.png/" },
] as const;

describe("levels/media-type.ts, the pattern", () => {
  it("admits each twin whose extension the roster lists and refuses its twin that differs by one character, as Node's extname reads it", () => {
    const pattern = new RegExp(typedPathPattern(["png", "svg"]), "u");

    for (const twin of twins) {
      assert.strictEqual(listed(twin.entry, ["png", "svg"]), twin.admitted, twin.entry);
      assert.strictEqual(pattern.test(twin.entry), twin.admitted, twin.entry);
    }
  });

  it("gives one pattern for a roster however its extensions are ordered", () => {
    assert.strictEqual(typedPathPattern(["svg", "png"]), typedPathPattern(["png", "svg"]));
  });

  it.effect(
    "admits a resolved path exactly when Node's extname reads an extension the roster lists, case-sensitively",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(["path admitted", "path refused"] as const, {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn((source) => ({
              entry: source.draw(array(element(pieces), { max: 6, min: 1 })).join(""),
              extensions: source.draw(element(rosters)),
            })),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "Node's path.posix.extname, its extension matched against the roster as written",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "levels/media-type/pattern",
          },
          ({ entry, extensions }, c) =>
            Effect.sync(() => {
              const admitted = new RegExp(typedPathPattern(extensions), "u").test(entry);

              assert.strictEqual(
                admitted,
                listed(entry, extensions),
                `${JSON.stringify(entry)} under ${extensions.join(", ")}`,
              );
              c.note(admitted ? "path admitted" : "path refused");
            }),
        ),
      ),
  );
});
