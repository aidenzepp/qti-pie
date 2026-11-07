import { existsSync } from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import { unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { examplesTarball, materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { judge, lawsOf, shownBreach, verdictOf } from "#pantry/test/oracle.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * Whether the examples tarball, which every `data-*` fixture is cut from or built over, is on this
 * machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * The composed grammar every fixture is judged by and shredded through, composed once by
 * `composed()` for the whole file.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the law oracle reads, derived from {@link grammar}.
 */
const laws = lawsOf(grammar);

/**
 * What one positive fixture's item must hold: a passage its edit leaves in it, which proves the
 * edit was applied and which fixture it is.
 */
interface Expectation {
  readonly marker: string;
  readonly name: FixtureName;
}

/**
 * The five positives of phase 8's stage N (spec 5.3 and decision 324), each with a passage unique
 * to it among the five. `data-non-ascii` is a positive: no standard bans `data-é`, and reading 13
 * admits it.
 */
const positives: readonly Expectation[] = [
  { marker: 'data-group-name="group1"', name: "cut-data-dash" },
  { marker: 'use="instructions" view="candidate"', name: "cut-data-attributes" },
  { marker: 'data-qti-suppress-tts="true"', name: "data-custom" },
  { marker: 'data-org="&org;"', name: "data-entity" },
  { marker: 'data-é="x"', name: "data-non-ascii" },
];

/**
 * What one negative fixture's package is refused as: the oracle's codec rule, and the reason the
 * codec's own error gives (`UnmodeledVocabulary.reason`), which the oracle's rule does not carry
 * for an attribute its element does not admit.
 */
interface Refusal {
  readonly name: FixtureName;
  readonly reason: "data-name" | "unadmitted";
  readonly rule: "attribute-admission" | "unmodeled-vocabulary";
}

/**
 * The three negatives: two names the class's language refuses, and a name on an element that
 * admits no `data-*` attribute.
 */
const negatives: readonly Refusal[] = [
  { name: "data-uppercase", reason: "data-name", rule: "unmodeled-vocabulary" },
  { name: "data-bare-prefix", reason: "data-name", rule: "unmodeled-vocabulary" },
  { name: "data-item-body", reason: "unadmitted", rule: "attribute-admission" },
];

/**
 * Find the first element below an element, itself included, with a local name.
 *
 * @param element - The element to search.
 * @param local - The local name.
 * @returns The first element in document order with that name, or none.
 */
const firstNamed = (element: Element, local: string): Option.Option<Element> => {
  if (element.local === local) {
    return Option.some(element);
  }

  for (const child of element.children) {
    if (child.kind === "element") {
      const found = firstNamed(child, local);
      if (Option.isSome(found)) {
        return found;
      }
    }
  }

  return Option.none();
};

/**
 * The text of an element's character data, ignoring any element below it.
 *
 * @param element - The element.
 * @returns Its direct text runs, joined.
 */
const textOf = (element: Element): string =>
  element.children.map((child) => (child.kind === "text" ? child.value : "")).join("");

/**
 * Give the node numbered `index` a uuid that spells its number.
 *
 * @param index - The node's number in document order.
 * @returns A uuid whose last group is the number in hexadecimal.
 */
const idOf = (index: number): NodeId =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

/**
 * Materialize a fixture in a root of its own and read its package.
 *
 * @param name - The fixture's name.
 * @returns The package's entries, as `readPackage` reads them.
 */
const packageOf = Effect.fn("fixtures.data.packageOf")(function* packageOf(name: FixtureName) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const root = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "fixtures-data-",
  });
  const config = ConfigProvider.layerAdd(
    ConfigProvider.fromUnknown({ GR8DES_QTI_FIXTURES: root }),
    { asPrimary: true },
  );
  const dir = yield* materialize(name).pipe(Effect.provide(config));

  assert.strictEqual(yield* fs.exists(dir), true, name);

  return yield* readPackage(dir);
});

/**
 * The version a package's manifest declares.
 *
 * @param files - The package's entries.
 * @returns The schema version, read from the manifest's `schemaversion`.
 */
const versionOfPackage = Effect.fn("fixtures.data.versionOfPackage")(function* versionOfPackage(
  files: readonly PackageFile[],
) {
  const manifest = files.find(({ kind }) => kind === "manifest") ?? assert.fail("no manifest");
  const declared = yield* Effect.map(Effect.option(readXml(manifest.bytes)), (read) =>
    read.pipe(
      Option.flatMap(({ root }) => firstNamed(root, "schemaversion")),
      Option.map(textOf),
    ),
  );

  return Result.getOrThrow(versionOf(schemaVersions, declared));
});

/**
 * Round-trip every item of a package through the XDM: read by crust, shredded through the composed
 * grammar in the package's version, flattened to rows, assembled back and unshredded to bytes.
 *
 * @param name - The fixture's name, for the messages.
 * @param files - The package's entries.
 * @returns The text of each item, in path order.
 */
const roundTripped = Effect.fn("fixtures.data.roundTripped")(function* roundTripped(
  name: FixtureName,
  files: readonly PackageFile[],
) {
  const version = yield* versionOfPackage(files);
  const shredding = shredGrammarOf(grammar);
  const names = namesOf(grammar);
  const items: string[] = [];

  for (const file of files.filter((entry) => entry.path.endsWith(".xml"))) {
    const doc = yield* readXml(file.bytes);
    if (doc.root.local !== "qti-assessment-item") {
      continue;
    }

    const tree = yield* shred(doc, version, shredding);
    const assembled = assemble(flatten(tree, idOf));

    assert.isTrue(Result.isSuccess(assembled), `${name}: ${file.path} assembles`);

    const out = yield* unshred(Result.getOrThrow(assembled), names);

    if (!Buffer.from(out).equals(Buffer.from(file.bytes))) {
      const reread = yield* readXml(out);

      assert.strictEqual(
        new TextDecoder().decode(canonicalize(reread)),
        new TextDecoder().decode(canonicalize(doc)),
        `${name}: ${file.path} is canonical-equal after the round trip`,
      );
    }

    items.push(new TextDecoder().decode(file.bytes));
  }

  assert.isAbove(items.length, 0, `${name} holds an item`);

  return items;
});

/**
 * The reason the codec gives for refusing a package's item: the `reason` of the
 * `UnmodeledVocabulary` that shredding the first item to fail returns.
 *
 * @param files - The package's entries.
 * @returns The reason, or none when every item shreds.
 */
const reasonOf = Effect.fn("fixtures.data.reasonOf")(function* reasonOf(
  files: readonly PackageFile[],
) {
  const version = yield* versionOfPackage(files);
  const shredding = shredGrammarOf(grammar);

  for (const file of files.filter((entry) => entry.path.endsWith(".xml"))) {
    const doc = yield* readXml(file.bytes);
    if (doc.root.local !== "qti-assessment-item") {
      continue;
    }

    const failure = yield* Effect.flip(shred(doc, version, shredding));

    if (failure._tag === "UnmodeledVocabulary") {
      return Option.some(failure.reason);
    }
  }

  return Option.none();
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the data-* fixtures (skipped without the examples tarball)",
  (it) => {
    for (const { marker, name } of positives) {
      it.effect.skipIf(!tarballPresent)(
        `${name} materializes, is accepted by the law oracle and round-trips`,
        () =>
          Effect.gen(function* positive() {
            const files = yield* packageOf(name);
            const judgment = yield* judge(files, grammar, laws);

            if (judgment._tag === "CodecRefusal") {
              assert.fail(`the codec refused ${name}: ${judgment.rule}, ${judgment.detail}`);
            }

            assert.deepStrictEqual(
              judgment.breaches.map(({ law }) => law),
              [],
              `${name}: ${judgment.breaches.map((breach) => shownBreach(breach, grammar)).join("\n")}`,
            );
            assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });

            const items = yield* roundTripped(name, files);

            assert.strictEqual(
              items.filter((item) => item.split(marker).length > 1).length,
              1,
              `${name}: ${marker}`,
            );
          }).pipe(Effect.scoped),
      );
    }

    for (const { name, reason, rule } of negatives) {
      it.effect.skipIf(!tarballPresent)(
        `${name} materializes and the codec refuses it as ${rule}, for the reason ${reason}`,
        () =>
          Effect.gen(function* negative() {
            const files = yield* packageOf(name);
            const judgment = yield* judge(files, grammar, laws);

            if (judgment._tag !== "CodecRefusal") {
              assert.fail(`the codec accepted ${name}`);
            }

            assert.strictEqual(judgment.rule, rule, name);
            assert.deepStrictEqual(yield* reasonOf(files), Option.some(reason), name);
          }).pipe(Effect.scoped),
      );
    }
  },
);
