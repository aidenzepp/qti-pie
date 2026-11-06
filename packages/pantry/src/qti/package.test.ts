/**
 * The package, its record and the manifest's overlays, as declarations and as the record the
 * importer writes: the declarations admit and name their checks by the oracle's laws, a package's
 * record is the same keyed set from a directory and from its zip, and the record keeps the
 * listing's order and bytes.
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
import { resolvedHref } from "#pantry/qti/limits.ts";
import {
  Entry,
  entryFamily,
  externalHrefPattern,
  Package,
  packageLaws,
} from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { lawNames } from "#pantry/test/oracle.ts";

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
const entriesByPath = (record: PackageRecord): ReadonlyMap<string, string> =>
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
 * 40 drawn bytes, so every remainder modulo 3 base64's padding turns on is drawn.
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
 * The letters the href box draws from: a plain letter, and each character the form reads.
 */
const hrefLetters = ["a", ".", "/", "%", "?", "#", ":", "\\", " "] as const;

/**
 * Every path of at most 4 of {@link hrefLetters}: the href-form box, 7,381 paths.
 */
const hrefPaths: Gen<string> = (source) =>
  source.draw(array(element(hrefLetters), { max: 4, min: 0 })).join("");

/**
 * How the representation reads a path: in the form it resolves, external, or outside both.
 */
type PathForm = "external" | "outside" | "plain";

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
 * The characters no plain segment holds: `?` and `#`, which end a path (RFC 3986, §3.3); `%`,
 * which needs decoding (§2.1); and `\` and whitespace, which no URI holds unescaped.
 */
const unplain = ["?", "#", "%", "\\", " ", "\t", "\n", "\r"] as const;

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
 * Read a path as RFC 3986 states it, a second implementation of the form, written from the
 * grammar rather than the patterns: external when it starts with a scheme (§3.1) or with `/`
 * (§4.2, a network or absolute path); plain when it is one or more segments, each nonempty,
 * neither `.` nor `..` (§5.2.4's dot segments), holding none of {@link unplain}, and the first
 * holding no `:` (§4.2's `segment-nz-nc`).
 *
 * @param candidate - The path.
 * @returns Its form.
 */
const formOf = (candidate: string): PathForm => {
  if (candidate.startsWith("/") || hasScheme(candidate)) {
    return "external";
  }

  const plain = candidate
    .split("/")
    .every(
      (segment, at) =>
        segment !== "" &&
        segment !== "." &&
        segment !== ".." &&
        unplain.every((c) => !segment.includes(c)) &&
        (at > 0 || !segment.includes(":")),
    );

  return plain ? "plain" : "outside";
};

/**
 * Read a path as a set of patterns reads it: in the form when the first matches, external when
 * the second does.
 *
 * @param candidate - The path.
 * @param form - The pattern of the form.
 * @param external - The pattern of an external path.
 * @returns Its form.
 */
const formBy = (candidate: string, form: RegExp, external: RegExp): PathForm => {
  if (form.test(candidate)) {
    return "plain";
  }

  return external.test(candidate) ? "external" : "outside";
};

/**
 * The patterns as `package.ts` and `limits.ts` state them, read as the database reads them
 * (ECMAScript under `u`), and three mutants of them, each a plausible slip the box must tell apart:
 * a form without its dot-segment arms, a form that lets `:` into the first segment, and an external
 * pattern without its leading `/`.
 */
const patternSets = {
  colonFirst: {
    external: new RegExp(externalHrefPattern, "u"),
    form: new RegExp(resolvedHref.replace("[^./?#%\\\\:", "[^./?#%\\\\"), "u"),
  },
  noDotArms: {
    external: new RegExp(externalHrefPattern, "u"),
    form: /^[^/?#%\\:\t\n\r ]+(?:\/[^/?#%\\\t\n\r ]+)*$/u,
  },
  noSlash: { external: /^[A-Za-z][A-Za-z0-9+.-]*:/u, form: new RegExp(resolvedHref, "u") },
  stated: {
    external: new RegExp(externalHrefPattern, "u"),
    form: new RegExp(resolvedHref, "u"),
  },
} as const;

/**
 * A situation the href-form box must reach: each form, each kind of path outside it, and each
 * mutant told apart.
 */
type HrefSituation =
  | "colon-first killed"
  | "dot segment"
  | "external"
  | "no-dot-arms killed"
  | "no-slash killed"
  | "outside"
  | "plain";

/**
 * A scratch schema of the record alone: `Package`, `Entry` and their family, which the record's
 * insert is typed by.
 */
const RecordProbe = schema("QtiRecordProbe", { Entry, Package }, [entryFamily]);

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
    "reads every path of the box in the form RFC 3986 gives it, and tells each mutant of the patterns apart",
    (ctx) =>
      // Oracle: the specification as a checker, RFC 3986's path grammar read segment by segment
      // (§3.1, §3.3, §4.2 and §5.2.4, `formOf`), against the patterns the database reads
      // (`resolvedHref` and `externalHrefPattern`, ECMAScript under `u`).
      // Bound: every path of at most 4 of 9 letters, 7,381.
      searched(
        ctx,
        exhaust(
          {
            box: "every path of at most 4 of a . / % ? # : \\ and a space",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<HrefSituation>([
              "plain",
              "external",
              "outside",
              "dot segment",
              "colon-first killed",
              "no-dot-arms killed",
              "no-slash killed",
            ]),
            generator: hrefPaths,
            limit: 8000,
            literal: (candidate) => JSON.stringify(candidate),
            oracle: { kind: "specification", name: "RFC 3986's path grammar, segment by segment" },
            suite: "qti/package-href-form",
          },
          (candidate: string, c) =>
            Effect.sync(() => {
              const expected = formOf(candidate);
              const { external, form } = patternSets.stated;

              c.note(expected);
              if (candidate.split("/").some((segment) => segment === "." || segment === "..")) {
                c.note("dot segment");
              }

              assert.strictEqual(formBy(candidate, form, external), expected, candidate);
              for (const [mutant, killed] of [
                ["colonFirst", "colon-first killed"],
                ["noDotArms", "no-dot-arms killed"],
                ["noSlash", "no-slash killed"],
              ] as const) {
                const patterns = patternSets[mutant];
                if (formBy(candidate, patterns.form, patterns.external) !== expected) {
                  c.note(killed);
                }
              }
            }),
        ),
      ),
  );

  it.effect(
    "keeps the listing's order and paths in the record, each content the canonical base64 of its bytes",
    (ctx) =>
      // Oracle: the listing itself, since the nesting is the listing (grizzle draws each `at` from
      // its place); and Node's Buffer, a second base64 encoder, with the decode round trip.
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
              name: "the listing itself and Node's Buffer base64",
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
              for (const [at, entry] of record.entries.entries()) {
                const original = files[at]?.bytes ?? new Uint8Array();

                assert.strictEqual(entry.content, Buffer.from(original).toString("base64"));
                assert.deepStrictEqual(
                  Uint8Array.fromBase64(entry.content),
                  Uint8Array.from(original),
                );
              }
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
