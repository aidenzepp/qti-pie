/**
 * The package, its record and the manifest's overlays, as declarations and as the record the
 * importer writes: the declarations admit and name their checks by the oracle's laws, hold the
 * package's ID space to the manifest's and the resources' identifiers alone, a package's record is
 * the same keyed set from a directory and from its zip, and the record keeps the listing's order
 * and bytes.
 */
import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { ChangeSet, schema } from "@bjornpagen/grizzle";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, bytes, element, int, shuffled } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Layer, Predicate } from "effect";
import { packageNameOf, packageRecordOf } from "#pantry/import/record.ts";
import type { PackageRecord } from "#pantry/import/record.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import {
  Entry,
  entryFamily,
  externalHrefPattern,
  Package,
  packageLaws,
  resolvedPathPattern,
  srcsetCandidatePattern,
} from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { judge } from "#pantry/test/host-judge.ts";
import type { HostRows } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";
import type { JudgedLaw } from "#pantry/test/key-copies.ts";
import { lawNames } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 0.6 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * The file system and processes the fixtures' materializer and `readPackage` need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The record as a keyed set: each entry's content by its path.
 *
 * @param record - A package's record.
 * @returns Its entries by path; a repeated path fails the caller's assertion on its size.
 */
const entriesByPath = (record: PackageRecord): ReadonlyMap<string, Uint8Array> =>
  new Map(record.entries.map(({ content, path: at }) => [at, content]));

/**
 * The id the records are built under: the property is over their entries, which no id changes.
 */
const packageId = "00000000-0000-4000-8000-000000000006";

/**
 * The paths a listing draws from: the manifest, files at the root and below, and names with a
 * space and a letter beyond ASCII.
 */
const listedPaths = [
  "imsmanifest.xml",
  "a.xml",
  "b/c.png",
  "b/d e.txt",
  "x/y/z.bin",
  "ü.txt",
] as const;

/**
 * A listing as a reader gives one, in any order: up to six files at distinct paths, each of up to
 * 40 drawn bytes.
 */
const listings: Gen<readonly PackageFile[]> = (source) => {
  const paths = source.draw(shuffled(listedPaths, { max: listedPaths.length, min: 0 }));
  const contents = source.draw(
    array(bytes({ max: 40, min: 0 }), { max: paths.length, min: paths.length }),
  );

  return paths.map((at, index) => ({
    bytes: contents[index] ?? new Uint8Array(),
    kind: at === "imsmanifest.xml" ? "manifest" : "file",
    path: at,
  }));
};

/**
 * Name a listing's size for the search's coverage.
 *
 * @param files - The listing.
 * @returns `empty`, `one` or `several`.
 */
const sizeOf = (files: readonly PackageFile[]): "empty" | "one" | "several" => {
  if (files.length === 0) {
    return "empty";
  }

  return files.length === 1 ? "one" : "several";
};

/**
 * A source path a package is read from: one to three segments, and a trailing `/` or none.
 */
const sources: Gen<string> = (source) => {
  const segments = source.draw(
    array(element(["pkg", "a.zip", "x y", "ü", "."] as const), { max: 3, min: 1 }),
  );
  const trailing = source.draw(int(0, 1)) === 1 ? "/" : "";

  return `${segments.join("/")}${trailing}`;
};

/**
 * The letters the path box draws from: a plain letter, a dot, the separator, the characters a
 * decoded name may hold (`%`, `:`, a space) and a comma.
 */
const pathLetters = ["a", ".", "/", "%", ":", " ", ","] as const;

/**
 * Every path of at most 4 of {@link pathLetters}: the path box, 2,801 paths.
 */
const boxPaths: Gen<string> = (source) =>
  source.draw(array(element(pathLetters), { max: 4, min: 0 })).join("");

/**
 * Whether a character is an ASCII letter, RFC 3986's `ALPHA`.
 *
 * @param c - The character.
 * @returns Whether it is one.
 */
const isAlpha = (c: string): boolean => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");

/**
 * Whether a character may follow a scheme's first letter (RFC 3986, §3.1).
 *
 * @param c - The character.
 * @returns Whether it is `ALPHA`, `DIGIT`, `+`, `-` or `.`.
 */
const isSchemeChar = (c: string): boolean =>
  isAlpha(c) || (c >= "0" && c <= "9") || c === "+" || c === "-" || c === ".";

/**
 * Whether a path starts with a scheme (RFC 3986, §3.1): `ALPHA *( ALPHA / DIGIT / "+" / "-" /
 * "." ) ":"`.
 *
 * @param candidate - The path.
 * @returns Whether it does.
 */
const hasScheme = (candidate: string): boolean => {
  const colon = candidate.indexOf(":");
  if (colon < 1 || !isAlpha(candidate.charAt(0))) {
    return false;
  }

  for (const c of candidate.slice(0, colon)) {
    if (!isSchemeChar(c)) {
      return false;
    }
  }

  return true;
};

/**
 * Whether a path is one RFC 3986's dot-segment removal (§5.2.4) leaves in the package, read
 * segment by segment: empty (the root), or segments the first of them nonempty and none `.` or
 * `..`.
 *
 * @param candidate - The path.
 * @returns Whether it is.
 */
const isResolvedPath = (candidate: string): boolean =>
  candidate === "" ||
  candidate
    .split("/")
    .every((segment, at) => segment !== "." && segment !== ".." && (at > 0 || segment !== ""));

/**
 * Whether a `srcset` is one candidate, its URL alone (the HTML Standard's image candidate string
 * with no descriptor), read character by character: no comma, and no whitespace between its first
 * and last characters that are not whitespace.
 *
 * @param candidate - The lexical form.
 * @returns Whether it is.
 */
const isOneCandidate = (candidate: string): boolean => {
  const inner = candidate.trim();

  // oxlint-disable-next-line typescript/no-misused-spread -- a comma, a space and a tab are single BMP code points, so testing code points finds each.
  return ![...inner].some((c) => c === "," || c === " " || c === "\t");
};

/**
 * The patterns as `package.ts` states them, read as the database reads them (ECMAScript under
 * `u`), and three mutants of them, each a plausible slip the box must tell apart: a resolved path
 * without its `..`-prefixed arm, an external pattern without its leading `/`, and a candidate
 * pattern that admits a descriptor.
 */
const patternSets = {
  descriptor: {
    candidate: /^[\t\n\r ]*[^,]*[\t\n\r ]*$/u,
    external: new RegExp(externalHrefPattern, "u"),
    resolved: new RegExp(resolvedPathPattern, "u"),
  },
  noDotDotArm: {
    candidate: new RegExp(srcsetCandidatePattern, "u"),
    external: new RegExp(externalHrefPattern, "u"),
    resolved: /^(?:(?:[^/.][^/]*|\.[^./][^/]*)(?:\/(?:[^/.][^/]*|\.[^./][^/]*)?)*)?$/u,
  },
  noSlash: {
    candidate: new RegExp(srcsetCandidatePattern, "u"),
    external: /^[A-Za-z][A-Za-z0-9+.-]*:/u,
    resolved: new RegExp(resolvedPathPattern, "u"),
  },
  stated: {
    candidate: new RegExp(srcsetCandidatePattern, "u"),
    external: new RegExp(externalHrefPattern, "u"),
    resolved: new RegExp(resolvedPathPattern, "u"),
  },
} as const;

/**
 * A situation the path box must reach: each verdict of each pattern, and each mutant told apart.
 */
type PathSituation =
  | "descriptor killed"
  | "dot segment"
  | "external"
  | "no-dot-dot-arm killed"
  | "no-slash killed"
  | "one candidate"
  | "resolved";

/**
 * Judge a path by a set of patterns: whether each admits it.
 *
 * @param candidate - The path.
 * @param patterns - The patterns.
 * @returns The three verdicts.
 */
const verdictsBy = (
  candidate: string,
  patterns: (typeof patternSets)[keyof typeof patternSets],
): readonly boolean[] => [
  patterns.resolved.test(candidate),
  patterns.external.test(candidate),
  patterns.candidate.test(candidate),
];

/**
 * A scratch schema of the record alone: `Package`, `Entry` and their family, which the record's
 * insert is typed by.
 */
const RecordProbe = schema("QtiRecordProbe", { Entry, Package }, [entryFamily]);

/**
 * The identifiers the ID-space box draws from.
 */
const spaceIdentifiers = ["a", "b"] as const;

/**
 * The kinds a row of the ID space may claim in the box: the manifest's, a resource's, and a third,
 * a `cp:file`, which writes no identifier.
 */
const spaceKinds = ["cp:manifest", "cp:resource", "cp:file"] as const;

/**
 * One package's ID space and the identifiers it copies: the manifest's identifier where it writes
 * one, the identifiers its resources write, and the rows of `ManifestIdSpace`, each an identifier
 * and the kind of element it claims to be written by.
 */
interface SpaceState {
  readonly manifest: readonly string[];
  readonly resources: readonly string[];
  readonly space: readonly (readonly [string, string])[];
}

/**
 * Every state of one package over {@link spaceIdentifiers}: no manifest identifier, `a` or `b`;
 * each identifier a resource's or not; each (identifier, kind) of {@link spaceKinds} a row of the
 * space or not.
 */
const spaceStates: Gen<SpaceState> = (source) => {
  const manifest = source.draw(element([[], ["a"], ["b"]] as const));
  const resources = spaceIdentifiers.flatMap((at) => (source.draw(int(0, 1)) === 1 ? [at] : []));
  const space = spaceIdentifiers.flatMap((at) =>
    spaceKinds.flatMap((kind) => (source.draw(int(0, 1)) === 1 ? [[at, kind] as const] : [])),
  );

  return { manifest, resources, space };
};

/**
 * A situation the ID-space box must reach: a state the specification admits, one it refuses, and a
 * row of a third kind, with and without a resource of its identifier.
 */
type SpaceSituation =
  | "admitted"
  | "refused"
  | "third kind, a resource of its identifier"
  | "third kind, no resource of its identifier";

/**
 * The relations a law the host judges reads: a containment's two sides, a check's relation, and a
 * key's side.
 *
 * @param law - The law.
 * @returns Its relations.
 */
const relationsOf = (law: JudgedLaw): readonly string[] => {
  if (law.kind === "contained") {
    return [law.from.relation, law.to.relation];
  }

  if (law.kind === "check") {
    return [law.relation];
  }

  return [law.side.relation];
};

/**
 * Every law the schema states over `ManifestIdSpace`, as the host judges it.
 *
 * @returns The laws, each a containment or a key with `ManifestIdSpace` on a side, or a check of
 *   it.
 */
const spaceLaws = (): readonly JudgedLaw[] =>
  judgedLaws(Qti).filter((law) => relationsOf(law).includes("ManifestIdSpace"));

/**
 * A state's rows as the database holds them, each relation with the fields its ID-space laws read.
 *
 * @param state - The state.
 * @returns `ManifestId`, `ResourceId` and `ManifestIdSpace`'s rows.
 */
const spaceRowsOf = (state: SpaceState): HostRows =>
  new Map([
    ["ManifestId", state.manifest.map((identifier) => ({ identifier, package: packageId }))],
    ["ResourceId", state.resources.map((identifier) => ({ identifier, package: packageId }))],
    [
      "ManifestIdSpace",
      state.space.map(([identifier, kind]) => ({ identifier, kind, package: packageId })),
    ],
  ]);

describe("qti/package.ts", () => {
  it("names every check of the package's laws by an oracle law, and the laws compose with the schema's relations", () => {
    // Oracle: the specification as a checker, the oracle's law names (`src/test/oracle.ts`), each
    // spelled with underscores for its spaces, since a check's name is an identifier; and grizzle's
    // own description check, which a scratch schema of `Qti`'s relations and these laws passes.
    const named = new Set<string>(lawNames);
    const checks = packageLaws.flatMap((law) =>
      law.kind === "check" && Predicate.hasProperty(law, "name") && Predicate.isString(law.name)
        ? [law.name]
        : [],
    );

    assert.isNotEmpty(checks);
    for (const name of checks) {
      assert.isTrue(named.has(name.replaceAll("_", " ")), name);
    }

    const scratch = schema("QtiPackageProbe", Qti.relations, packageLaws);
    assert.strictEqual(scratch.statements.length, packageLaws.length);
  });

  it.effect(
    "holds the package's ID space to the manifest's and the resources' identifiers, each of its own kind, with no check",
    (ctx) =>
      // Oracle: the specification as a checker, by hand: IMS Content Packaging 1.2 gives the
      // manifest's and its resources' identifiers one xs:ID space, so the space is the manifest's
      // identifier as a cp:manifest row and each resource's as a cp:resource row, no other row, and
      // no identifier twice; against the host's judgment of every law the schema states over
      // `ManifestIdSpace`.
      // Bound: every state of one package over identifiers a and b, the manifest's identifier none,
      // a or b, each a resource's or not, each of its six rows of kind cp:manifest, cp:resource or
      // cp:file in the space or not, 768.
      Effect.gen(function* idSpaceBox() {
        const laws = spaceLaws();

        yield* searched(
          ctx,
          exhaust(
            {
              box: "every ID space of one package over two identifiers and three kinds",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<SpaceSituation>([
                "admitted",
                "refused",
                "third kind, a resource of its identifier",
                "third kind, no resource of its identifier",
              ]),
              generator: spaceStates,
              limit: 1000,
              literal: (state) => JSON.stringify(state),
              oracle: {
                kind: "specification",
                name: "IMS Content Packaging 1.2's one xs:ID space of the manifest and its resources, by hand",
              },
              suite: "qti/package-id-space",
            },
            (state: SpaceState, c) =>
              Effect.sync(() => {
                const written = new Set([
                  ...state.manifest.map((identifier) => `${identifier} cp:manifest`),
                  ...state.resources.map((identifier) => `${identifier} cp:resource`),
                ]);
                const held = new Set(
                  state.space.map(([identifier, kind]) => `${identifier} ${kind}`),
                );
                const expected =
                  held.size === written.size &&
                  [...held].every((row) => written.has(row)) &&
                  state.manifest.every((identifier) => !state.resources.includes(identifier));
                const judgment = judge(spaceRowsOf(state), laws);

                c.note(expected ? "admitted" : "refused");
                for (const [identifier, kind] of state.space) {
                  if (kind === "cp:file") {
                    c.note(
                      state.resources.includes(identifier)
                        ? "third kind, a resource of its identifier"
                        : "third kind, no resource of its identifier",
                    );
                  }
                }

                assert.deepStrictEqual(judgment.skipped, [], JSON.stringify(state));
                assert.strictEqual(judgment.broken.length === 0, expected, JSON.stringify(state));
              }),
          ),
        );
      }),
    testTimeoutMs,
  );

  it.effect(
    "reads every path of the box as RFC 3986 and the HTML Standard state it, and tells each mutant of the patterns apart",
    (ctx) =>
      // Oracle: the specification as a checker, read segment by segment and character by
      // character: RFC 3986's dot-segment removal (§5.2.4) for a resolved path, its scheme grammar
      // (§3.1) and §4.2's network and absolute paths for an external one, and the HTML Standard's
      // image candidate string with no descriptor for a srcset; against the patterns the database
      // reads (`resolvedPathPattern`, `externalHrefPattern`, `srcsetCandidatePattern`).
      // Bound: every path of at most 4 of 7 letters, 2,801.
      searched(
        ctx,
        exhaust(
          {
            box: "every path of at most 4 of a . / % : space and a comma",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<PathSituation>([
              "resolved",
              "dot segment",
              "external",
              "one candidate",
              "no-dot-dot-arm killed",
              "no-slash killed",
              "descriptor killed",
            ]),
            generator: boxPaths,
            limit: 3000,
            literal: (candidate) => JSON.stringify(candidate),
            oracle: {
              kind: "specification",
              name: "RFC 3986's path grammar and the HTML Standard's image candidate, by hand",
            },
            suite: "qti/package-href-patterns",
          },
          (candidate: string, c) =>
            Effect.sync(() => {
              const expected = [
                isResolvedPath(candidate),
                candidate.startsWith("/") || hasScheme(candidate),
                isOneCandidate(candidate),
              ];

              c.note(expected[0] === true ? "resolved" : "dot segment");
              if (expected[1] === true) {
                c.note("external");
              }

              if (expected[2] === true) {
                c.note("one candidate");
              }

              assert.deepStrictEqual(
                verdictsBy(candidate, patternSets.stated),
                expected,
                candidate,
              );
              for (const [mutant, killed] of [
                ["noDotDotArm", "no-dot-dot-arm killed"],
                ["noSlash", "no-slash killed"],
                ["descriptor", "descriptor killed"],
              ] as const) {
                const verdicts = verdictsBy(candidate, patternSets[mutant]);
                if (verdicts.some((verdict, at) => verdict !== expected[at])) {
                  c.note(killed);
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect("keeps the listing's order and paths in the record, each content its bytes", (ctx) =>
    // Oracle: the listing itself, since the nesting is the listing (grizzle draws each `at` from
    // its place), and each entry's bytes, which `Entry.content` holds as they are.
    // Bound: listings of up to 6 distinct paths in every order the generator draws, 300 runs.
    searched(
      ctx,
      explore(
        {
          caseHang: Duration.seconds(10),
          concurrency: 1,
          coverage: required<"empty" | "one" | "several">(["empty", "one", "several"], {
            cases: 200,
            sense: notesOnly,
          }),
          draw: drawn(listings),
          kept: [],
          literal: Formatter.format,
          oracle: {
            kind: "second-implementation",
            name: "the listing itself",
          },
          runs: 300,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "pantry/qti/package-record",
        },
        (files, c) =>
          Effect.sync(() => {
            const record = packageRecordOf({ files, id: packageId, name: "pkg" });

            c.note(sizeOf(files));
            assert.deepStrictEqual(
              record.entries.map(({ path: at }) => at),
              files.map(({ path: at }) => at),
            );
            assert.strictEqual(entriesByPath(record).size, files.length);
            assert.deepStrictEqual(
              record.entries.map(({ content }) => Uint8Array.from(content)),
              files.map(({ bytes: original }) => Uint8Array.from(original)),
            );
          }),
      ),
    ),
  );

  it.effect("names a package by the last segment of the path it was read from", (ctx) =>
    // Oracle: a second implementation, Node's `path.posix.basename`.
    // Bound: one to three of five segments, with and without a trailing "/", 200 runs.
    searched(
      ctx,
      explore(
        {
          caseHang: Duration.seconds(10),
          concurrency: 1,
          coverage: required<"trailing" | "bare">(["trailing", "bare"], {
            cases: 100,
            sense: notesOnly,
          }),
          draw: drawn(sources),
          kept: [],
          literal: Formatter.format,
          oracle: { kind: "second-implementation", name: "Node's path.posix.basename" },
          runs: 200,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "pantry/qti/package-name",
        },
        (source, c) =>
          Effect.sync(() => {
            c.note(source.endsWith("/") ? "trailing" : "bare");
            assert.strictEqual(packageNameOf(source), path.posix.basename(source));
          }),
      ),
    ),
  );

  it("types the record as the insert of a package with its entries nested", () => {
    // Oracle: grizzle's own insert type, `AdditionIn` of the record's schema: the record is a
    // member fact of `Package` exactly, its entries nested at `entries`.
    const record = packageRecordOf({
      files: [{ bytes: new Uint8Array([1, 2]), kind: "manifest", path: "imsmanifest.xml" }],
      id: packageId,
      name: "pkg",
    });
    const changes = ChangeSet.empty(RecordProbe).insert(Package, [record]);

    assert.isDefined(changes);
  });
});

layer(TestLayer, { excludeTestServices: true })(
  "qti/package.ts, the record of a fixture",
  (suite) => {
    suite.effect("builds one keyed set from a package's directory and from its zip", () =>
      // Oracle: a metamorphic relation, two containers of one package giving one record.
      // Bound: the fixtures `simple` and `sharedMedia`, each read from its directory and its zip.
      Effect.gen(function* sameRecord() {
        for (const name of ["simple", "sharedMedia"] as const) {
          const fromDirectory = packageRecordOf({
            files: yield* readPackage(yield* materialize(name)),
            id: packageId,
            name,
          });
          const fromZip = packageRecordOf({
            files: yield* readPackage(yield* materializeZip(name)),
            id: packageId,
            name,
          });
          const directory = entriesByPath(fromDirectory);
          const zip = entriesByPath(fromZip);

          assert.strictEqual(directory.size, fromDirectory.entries.length, name);
          assert.strictEqual(zip.size, fromZip.entries.length, name);
          assert.isAbove(directory.size, 1, name);
          assert.deepStrictEqual(
            [...directory].toSorted(([left], [right]) => left.localeCompare(right)),
            [...zip].toSorted(([left], [right]) => left.localeCompare(right)),
            name,
          );
        }
      }),
    );
  },
);
