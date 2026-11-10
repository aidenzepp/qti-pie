/**
 * One entry-path rule for every package form (reading 138): a package directory and a zip of the
 * same files read alike, both accepting a file's path or both refusing it, the directory under
 * `entry-path` and the zip under `href-path`, which the database names alike.
 *
 * Oracle: the ruling's own sentence (`refusedByRuling`): a path that holds a backslash or begins
 * with a drive prefix names no entry. Bound: every relative path of one or two segments over the
 * segments below, each written as a file of a directory and as an entry of a zip beside a minimal
 * manifest. Paths a directory cannot hold as a file inside it (absolute, `.` or `..` segments) are
 * the zip reader's alone, and `zip.test.ts` holds them.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter } from "effect";
import { readEntries } from "#pantry/package/read.ts";
import { writeZip } from "#pantry/package/zip.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The segments a path is drawn from: plain names, a backslash inside a name, a drive prefix in
 * either case, a colon after a letter, and percent forms of a backslash and a dot.
 */
const SEGMENTS = ["a", "b.xml", "a\\b", "C:x", "c:", "a:b", "%5c", "%2e%2e"] as const;

/**
 * How many paths the box holds: every path of one or two segments.
 */
const PATHS = SEGMENTS.length + SEGMENTS.length * SEGMENTS.length;

/**
 * A minimal manifest, so either form holds a package root.
 */
const manifest = new TextEncoder().encode(
  '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"/>',
);

/**
 * The ruling: a path that holds a backslash or begins with a drive prefix (a letter and a colon)
 * names no entry.
 *
 * @param path - The path.
 * @returns Whether the ruling refuses it.
 */
const refusedByRuling = (path: string): boolean => path.includes("\\") || /^[A-Za-z]:/u.test(path);

/**
 * Read a package and say what the reader did: `accepted`, or the rule it refused under.
 *
 * @param dir - The package directory or zip file.
 * @returns The verdict.
 */
const verdictOf = (dir: string) =>
  readEntries(dir).pipe(
    Effect.map(() => "accepted"),
    Effect.catchTags({
      PackageReadError: (refusal) => Effect.succeed(refusal.rule),
      ZipRefusal: (refusal) => Effect.succeed(refusal.rule),
    }),
  );

describe("an entry path", () => {
  it.effect(
    "is read alike from a directory and a zip: both accept it, or both refuse it under the one rule",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: `every relative path of one or two segments over ${SEGMENTS.join(", ")}: ${PATHS} paths`,
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
            generator: array(element(SEGMENTS), { max: 2, min: 1 }),
            limit: PATHS,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "reading 138's sentence" },
            suite: "pantry/package/entry-path",
          },
          (segments, c) =>
            Effect.gen(function* readBoth() {
              const fs = yield* FileSystem.FileSystem;
              const path = segments.join("/");
              const folder = yield* scratchDirectory("entry-path-");
              const dir = `${folder}/package`;
              const bytes = new TextEncoder().encode("x");

              yield* fs.makeDirectory(`${dir}/${segments.slice(0, -1).join("/")}`, {
                recursive: true,
              });
              yield* fs.writeFile(`${dir}/imsmanifest.xml`, manifest);
              yield* fs.writeFile(`${dir}/${path}`, bytes);
              yield* fs.writeFile(
                `${folder}/package.zip`,
                writeZip([
                  { bytes: manifest, path: "imsmanifest.xml" },
                  { bytes, path },
                ]),
              );

              const fromDirectory = yield* verdictOf(dir);
              const fromZip = yield* verdictOf(`${folder}/package.zip`);
              const refused = refusedByRuling(path);
              c.note(refused ? "refused" : "accepted");

              assert.strictEqual(
                fromDirectory,
                refused ? "entry-path" : "accepted",
                `${path}, directory`,
              );
              assert.strictEqual(fromZip, refused ? "href-path" : "accepted", `${path}, zip`);
            }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, PATHS);
          }),
        ),
      ),
  );
});
