import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import type { Report } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { importPackage } from "#qti/import/package.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import { materialize, materializeZip } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * The directory every export is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The packaging fixtures whose import is accepted and whose export is compared with them, the
 * spec's 4.12 positives.
 */
const positives = [
  "lomrest",
  "csm",
  "filelom",
  "nestedqmd",
  "extmeta",
  "variant",
  "variant-padded",
  "usage3",
  "usage3-typed",
  "usage3-padded",
  "outcome",
  "lti301",
  "lti300",
  "bytes",
] as const satisfies readonly FixtureName[];

/**
 * Import a fixture, export it to `work/export/<name>/`, and compare the export with the fixture.
 * The rendered report is left beside it in `work/export/<name>.report.txt`.
 *
 * @param name - The fixture to round-trip.
 * @returns The fixture's directory, the export directory and the report.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const exported = `${workDirectory}/export/${name}`;
    const id = yield* importPackage(source);

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    yield* fs.writeFileString(`${exported}.report.txt`, `${renderReport(report)}\n`);

    return { exported, report, source };
  });

/**
 * The text of a file, decoded as UTF-8.
 */
const textOf = (file: string) =>
  Effect.gen(function* textOfFile() {
    const fs = yield* FileSystem.FileSystem;

    return yield* fs.readFileString(file);
  });

/**
 * The comments and the root start tag's namespace declarations before the first element of an XML
 * text: what its prolog and its root element carry besides the tree.
 */
const prologOf = (xml: string) => {
  const comments = [...xml.slice(0, xml.search(/<[A-Za-z]/u)).matchAll(/<!--[\s\S]*?-->/gu)].map(
    (match) => match[0],
  );
  const root = /<[A-Za-z][^>]*>/u.exec(xml)?.[0] ?? "";
  const declarations = [...root.matchAll(/xmlns(?::[\w.-]+)?="[^"]*"/gu)].map((match) => match[0]);

  return { comments, declarations };
};

/**
 * The outcome kind of each entry of a report, by path.
 */
const kindsOf = (report: Report) =>
  Object.fromEntries(report.map((item) => [item.path, item.outcome.kind]));

describe.skipIf(!hasLease)(
  "export/package.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("export/package.ts of the packaging fixtures on the lease", (it) => {
      for (const name of positives) {
        it.effect(`${name} round-trips through the database, every entry equal`, () =>
          Effect.gen(function* roundTripEqual() {
            const { report } = yield* roundTrip(name);

            assert.isAbove(report.length, 0);
            assert.strictEqual(
              report.filter((item) => item.outcome.kind === "differs").length,
              0,
              renderReport(report),
            );
          }),
        );
      }

      it.effect("the manifest, the record and the usage data compare canonically", () =>
        Effect.gen(function* canonicalEntries() {
          const kinds = {
            extmeta: kindsOf((yield* roundTrip("extmeta")).report),
            lomrest: kindsOf((yield* roundTrip("lomrest")).report),
            outcome: kindsOf((yield* roundTrip("outcome")).report),
            usage3: kindsOf((yield* roundTrip("usage3")).report),
          };

          for (const [name, byPath] of Object.entries(kinds)) {
            assert.strictEqual(byPath["imsmanifest.xml"], "canonical-equal", name);
          }

          assert.strictEqual(kinds.extmeta["meta/choice.xml"], "canonical-equal");
          assert.isTrue(
            Object.entries(kinds.usage3).some(
              ([entry, kind]) =>
                entry !== "imsmanifest.xml" && entry.endsWith(".xml") && kind === "canonical-equal",
            ),
          );
        }),
      );

      it.effect("every non-XML entry of a round trip is byte-identical", () =>
        Effect.gen(function* bytesIdentical() {
          for (const name of positives) {
            const { report } = yield* roundTrip(name);
            const others = report.filter(
              (item) => item.outcome.kind !== "canonical-equal" && item.outcome.kind !== "differs",
            );

            assert.isTrue(
              others.every((item) => item.outcome.kind === "byte-identical"),
              name,
            );
          }
        }),
      );

      for (const name of ["variant-padded", "usage3-padded"] as const) {
        it.effect(`${name} writes its padding back`, () =>
          Effect.gen(function* paddingBack() {
            const { report } = yield* roundTrip(name);

            assert.strictEqual(
              report.filter((item) => item.outcome.kind === "differs").length,
              0,
              renderReport(report),
            );
            assert.isTrue(
              report.some(
                (item) => item.path.endsWith(".xml") && item.outcome.kind === "canonical-equal",
              ),
            );
          }),
        );
      }

      it.effect(
        "extmeta's record comes back with its prolog comment and namespace declarations",
        () =>
          Effect.gen(function* recordProlog() {
            const { exported, source } = yield* roundTrip("extmeta");
            const before = prologOf(yield* textOf(`${source}/meta/choice.xml`));
            const after = prologOf(yield* textOf(`${exported}/meta/choice.xml`));

            assert.isAbove(before.declarations.length, 0);
            assert.deepStrictEqual(after.comments, before.comments);
            assert.deepStrictEqual(
              [...after.declarations].toSorted(),
              [...before.declarations].toSorted(),
            );
          }),
      );

      it.effect("simple imported from its zip exports to a directory equal to simple", () =>
        Effect.gen(function* zipToDirectory() {
          const fs = yield* FileSystem.FileSystem;
          const exported = `${workDirectory}/export/simple-from-zip`;
          const id = yield* importPackage(yield* materializeZip("simple"));

          yield* fs.remove(exported, { force: true, recursive: true });
          yield* fs.makeDirectory(exported, { recursive: true });
          yield* exportPackage(id, exported);

          const report = yield* comparePackage(yield* materialize("simple"), exported);

          assert.strictEqual(
            report.filter((item) => item.outcome.kind === "differs").length,
            0,
            renderReport(report),
          );
        }),
      );

      it.effect("exporting to a .zip writes a container whose entries compare all equal", () =>
        Effect.gen(function* exportZip() {
          const fs = yield* FileSystem.FileSystem;
          const source = yield* materialize("simple");
          const target = `${workDirectory}/export/simple.zip`;
          const id = yield* importPackage(yield* materializeZip("simple"));

          yield* fs.remove(target, { force: true });
          yield* exportPackage(id, target);

          const sourceEntries = (yield* listPackage(source)).map((entry) => entry.path).toSorted();
          const zipped = (yield* listPackage(target)).map((entry) => entry.path).toSorted();

          assert.deepStrictEqual(zipped, sourceEntries);

          const unpacked = `${workDirectory}/export/simple.zip.entries`;

          yield* fs.remove(unpacked, { force: true, recursive: true });

          for (const entry of yield* listPackage(target)) {
            yield* fs.makeDirectory(path.dirname(`${unpacked}/${entry.path}`), { recursive: true });
            yield* fs.writeFile(`${unpacked}/${entry.path}`, yield* readEntry(target, entry.path));
          }

          const report = yield* comparePackage(source, unpacked);

          assert.strictEqual(
            report.filter((item) => item.outcome.kind === "differs").length,
            0,
            renderReport(report),
          );
          assert.deepStrictEqual(
            yield* readEntry(target, "images/sign.png"),
            yield* readEntry(source, "images/sign.png"),
          );
        }),
      );
    });
  },
);
