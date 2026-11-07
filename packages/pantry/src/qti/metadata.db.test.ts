/**
 * The metadata overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the constraint that states the law.
 *
 * Every case is a direct SQL writer's, as the rules file's rule 8 and grizzle's README ("Direct SQL
 * access") state it, through the one direct writer (`#pantry/test/direct-sql.ts`): the author
 * login, `SET ROLE` to the author role, at SERIALIZABLE, every deferrable foreign key deferred, the
 * builder's facts written into `Qti`'s tables with every column a writer fills (generated columns
 * PostgreSQL computes), then the one constraint under test set immediate, and a rollback. A role
 * writes a table, never its own view of it: it holds INSERT on each table it writes and only SELECT
 * on its views (README, "Security model"), so a read back goes through the view. The rows are the
 * builder's (`#pantry/import/overlays/metadata.ts`) over the fixture's own documents, so a case
 * restates its setup as a fixture and an edit of it:
 *
 * - **`lom-identifier`** on `metaData`: its record's entry names `qti_v2_item_01` and its item is
 *   `choice`, so `LomObjectIdentifier`'s witness containment into the general entries refuses it
 *   (23503); with the entry edited to `choice`, or to `choice` padded, it holds.
 * - **`lom-title`** on `metaData`: its record's title string is `Metadata Example Item #1` and its
 *   item's title `Unattended Luggage`, so `LomObjectTitle`'s witness containment refuses it; with
 *   the string edited to the item's title, it holds.
 * - **the date** (`attribute-lexical`): each `lastUpdated` of the usage-data fixtures `usage3`,
 *   `usage3-typed`, `usage3-padded` and `usage3-float-padded` is accepted by its row's laws, its
 *   generated `date` the day it names; `usage3-feb-30`'s and `usage3-bad-month`'s are refused by
 *   `day`'s domain, `lexicalForm(date)` (23514).
 * - **Usage typed value** (reading 105): each usage value that writes a `baseType` in `usage3-typed`
 *   and `usage3-float-padded` is accepted by its row's laws; `usage3-integer-float`'s float under
 *   `integer` is refused by the `usage_typed_value` CHECK (23514), and a code its lexical form does
 *   not spell by `e_1_derived`.
 *
 * Whole-package cases, every law at once through the importer, arrive with Q5.15: `metaData`
 * refused `lom-identifier` and `lom-title`, `simple` accepted, `identifier-mismatch` refused
 * `lom-identifier`, `title-mismatch` refused `lom-title`, and the usage-data fixtures accepted but
 * `usage3-feb-30` (refused `attribute-lexical`, by `day`'s domain or AL1's value domain).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { describe, inject } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { objectRowsOfPackage, rowsOf } from "#pantry/import/overlays/metadata.ts";
import type { MetadataIds, NamedDocument } from "#pantry/import/overlays/metadata.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import {
  LomEntry,
  LomObjectIdentifier,
  LomObjectTitle,
  LomTitleString,
  StatisticDate,
  UsageValue,
} from "#pantry/qti/metadata.ts";
import {
  assertVerdict,
  authorRole,
  foreignKeysBetween,
  judged,
  judgedCase,
  loginSession,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The fixtures the global setup materializes: `metaData` among them.
 */
const fixtures = inject("fixtures");

/**
 * The grammar shred reads every document through.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * Draw the ids of one document's rows, numbered by its place in the package, the manifest 0.
 *
 * @param document - The document's number.
 * @param documentType - The type it is listed under, `none` for the manifest.
 * @returns The ids.
 */
const idsFor = (document: number, documentType: MetadataIds["documentType"]): MetadataIds => ({
  documentType,
  idOf: (index) =>
    `00000000-0000-4000-8${document.toString(16).padStart(3, "0")}-${index.toString(16).padStart(12, "0")}`,
  package: "00000000-0000-4000-8000-00000000c0de",
});

/**
 * Read the schema version a manifest declares.
 *
 * @param manifest - The manifest crust read.
 * @returns The `schemaversion` text, none when it declares none.
 */
const declaredVersion = (manifest: XmlDocument): Option.Option<string> =>
  Option.fromNullishOr(
    manifest.root.children
      .flatMap((child) => (child.kind === "element" && child.local === "metadata" ? [child] : []))
      .flatMap(({ children }) =>
        children.flatMap((child) =>
          child.kind === "element" && child.local === "schemaversion" ? [child] : [],
        ),
      )
      .map(({ children }) =>
        children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
      )
      .at(0),
  );

/**
 * Build a package's metadata rows as the importer will: each document's rows, and the records'
 * object rows over the documents' assessment objects.
 *
 * @param files - The package's entries.
 * @returns The manifest's rows, every document's statistic dates and typed usage values, and the
 *   object rows.
 */
const builtOf = Effect.fn("test.metadata.db.builtOf")(function* builtOf(
  files: readonly PackageFile[],
) {
  const manifestFile = files.find(({ kind }) => kind === "manifest");
  assert.isDefined(manifestFile);

  const manifestXml = yield* Effect.orDie(readXml(manifestFile.bytes));
  const version = Result.getOrThrow(
    versionOf(grammar.kinds.versions.handles, declaredVersion(manifestXml)),
  );
  const manifest = yield* Effect.orDie(shred(manifestXml, version, shredGrammar));
  const documents = new Map<string, NamedDocument>();
  const dates = [];
  const values = [];
  for (const [at, file] of files
    .filter(({ kind, path }) => kind === "file" && path.endsWith(".xml"))
    .entries()) {
    const tree = yield* readXml(file.bytes).pipe(
      Effect.flatMap((xml) => shred(xml, version, shredGrammar)),
      Effect.option,
    );
    const listed = tree.pipe(
      Option.flatMap(({ root }) =>
        Option.fromNullishOr(grammar.package.rootOfType.rows.find((row) => row.root === root.kind)),
      ),
    );
    if (Option.isSome(tree) && Option.isSome(listed)) {
      const ids = idsFor(at + 1, listed.value.type);
      const rows = rowsOf(tree.value, ids);
      documents.set(file.path, {
        document: ids.idOf(0),
        object: rows.AssessmentObject.values().next().value,
      });
      dates.push(...rows.StatisticDate.values());
      values.push(...rows.UsageValue.values());
    }
  }

  return {
    dates,
    manifest: rowsOf(manifest, idsFor(0, "none")),
    objects: objectRowsOfPackage(manifest, idsFor(0, "none"), documents),
    values,
  };
});

/**
 * Replace one passage of a package's manifest, failing when the manifest does not hold it.
 *
 * @param files - The package's entries.
 * @param passage - The passage.
 * @param replacement - What replaces it.
 * @returns The package with its manifest edited.
 */
const editManifest = (
  files: readonly PackageFile[],
  passage: string,
  replacement: string,
): readonly PackageFile[] =>
  files.map((file) => {
    if (file.kind !== "manifest") {
      return file;
    }

    const text = new TextDecoder().decode(file.bytes);
    assert.include(text, passage, "the manifest holds the passage");

    return { ...file, bytes: new TextEncoder().encode(text.replace(passage, replacement)) };
  });

/**
 * The `metaData` manifest's one general entry, which names `qti_v2_item_01`.
 */
const metaDataEntry = "<imsmd:entry>qti_v2_item_01</imsmd:entry>";

/**
 * The `metaData` manifest's general title string, which is not its item's title.
 */
const metaDataTitle = '<imsmd:string language="en">Metadata Example Item #1</imsmd:string>';

/**
 * Each of the builder's facts of one relation, as a case states them.
 *
 * @param relation - The relation.
 * @param facts - The builder's facts of it.
 * @returns The stated facts.
 */
const statedOf = (relation: Stated["relation"], facts: Iterable<Stated["fact"]>): Stated[] =>
  [...facts].map((fact) => ({ fact, relation }));

describe.skipIf(!hasLease)("qti/metadata.db.test.ts, on the lease", () => {
  it.effect(
    "refuses metaData's record by lom-identifier, and accepts it with its entry naming choice, padded or not",
    () =>
      // Oracle: PostgreSQL, `LomObjectIdentifier`'s witness containment into the general entries,
      // a foreign key into `lom_entry`: 23503 on that key where no general entry of the record
      // has the item's identifier as its token.
      // Bound: the fixture, and its entry edited to `choice` and to `choice` padded.
      Effect.gen(function* lomIdentifier() {
        const client = yield* loginSession;
        const keys = yield* foreignKeysBetween(client, "lom_object_identifier", "lom_entry");
        assert.isNotEmpty(keys, "lom_object_identifier references lom_entry");

        const files = yield* readPackage(fixtures.metaData);

        for (const [label, edited, refused] of [
          ["metaData", files, true],
          [
            "choice",
            editManifest(files, metaDataEntry, "<imsmd:entry>choice</imsmd:entry>"),
            false,
          ],
          [
            "padded choice",
            editManifest(files, metaDataEntry, "<imsmd:entry>\n  choice\t</imsmd:entry>"),
            false,
          ],
        ] as const) {
          const built = yield* builtOf(edited);
          const named = statedOf(LomObjectIdentifier, built.objects.LomObjectIdentifier.values());
          assert.isNotEmpty(named, `${label}: its record names its item`);

          const refusal = Option.getOrUndefined(
            yield* judged(
              client,
              statedInserts([
                ...statedOf(LomEntry, built.manifest.LomEntry.values()),
                ...named.slice(0, 1),
              ]),
              keys,
            ),
          );

          assert.strictEqual(refusal !== undefined, refused, label);
          if (refused) {
            assert.strictEqual(refusal?.code, "23503", label);
            assert.include(keys, refusal?.constraint, label);
          }
        }
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses metaData's record by lom-title, and accepts it with its title string the item's title",
    () =>
      // Oracle: PostgreSQL, `LomObjectTitle`'s witness containment into the title strings, a
      // foreign key into `lom_title_string`: 23503 where no title string of the record has the
      // item's title as its text, in the item's language.
      // Bound: the fixture, and its title string edited to `Unattended Luggage`.
      Effect.gen(function* lomTitle() {
        const client = yield* loginSession;
        const keys = yield* foreignKeysBetween(client, "lom_object_title", "lom_title_string");
        assert.isNotEmpty(keys, "lom_object_title references lom_title_string");

        const files = yield* readPackage(fixtures.metaData);

        for (const [label, edited, refused] of [
          ["metaData", files, true],
          [
            "the item's title",
            editManifest(
              files,
              metaDataTitle,
              '<imsmd:string language="en">Unattended Luggage</imsmd:string>',
            ),
            false,
          ],
        ] as const) {
          const built = yield* builtOf(edited);
          const named = statedOf(LomObjectTitle, built.objects.LomObjectTitle.values());
          assert.isNotEmpty(named, `${label}: its record titles its item`);

          const refusal = Option.getOrUndefined(
            yield* judged(
              client,
              statedInserts([
                ...statedOf(LomTitleString, built.manifest.LomTitleString.values()),
                ...named.slice(0, 1),
              ]),
              keys,
            ),
          );

          assert.strictEqual(refusal !== undefined, refused, label);
          if (refused) {
            assert.strictEqual(refusal?.code, "23503", label);
            assert.include(keys, refusal?.constraint, label);
          }
        }
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );

  it.effect(
    "accepts each usage-data fixture's lastUpdated as the day it names, and refuses one that names no day",
    () =>
      // Oracle: PostgreSQL, `StatisticDate`'s own laws: `day`'s domain, `lexicalForm(date)` (23514
      // where the text names no day), the pieces' check, and the generated `date`, read back
      // before the rollback as the day's ISO text.
      // Bound: the four usage-data positives, and the two negatives whose first statistic's
      // `lastUpdated` is edited to no day (`2004-02-30`, `2004-13-04`); every other row of theirs
      // is accepted.
      Effect.gen(function* calendar() {
        const client = yield* loginSession;

        for (const [name, bad] of [
          ["usage3", ""],
          ["usage3-typed", ""],
          ["usage3-padded", ""],
          ["usage3-float-padded", ""],
          ["usage3-feb-30", "2004-02-30"],
          ["usage3-bad-month", "2004-13-04"],
        ] as const satisfies readonly (readonly [FixtureName, string])[]) {
          const built = yield* builtOf(yield* readPackage(yield* materialize(name)));
          assert.isNotEmpty(built.dates, `${name} writes a lastUpdated`);
          assert.strictEqual(
            built.dates.some(({ day }) => day === bad),
            bad !== "",
            `${name} writes its edited lastUpdated`,
          );

          for (const row of built.dates) {
            const refused = row.day === bad;
            const { read, refused: refusal } = yield* judgedCase(client, {
              inserts: statedInserts([{ fact: row, relation: StatisticDate }]),
              reads: [
                {
                  text: `SELECT date::text AS date FROM ${authorRole}.statistic_date WHERE node = $1`,
                  values: [row.node],
                },
              ],
            });

            assert.strictEqual(Option.isSome(refusal), refused, `${name} ${row.lexical}`);
            if (refused) {
              assert.strictEqual(Option.getOrUndefined(refusal)?.code, "23514", name);
            } else {
              assert.deepStrictEqual(read, [[{ date: row.day }]], name);
            }
          }
        }
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );

  it.effect(
    "accepts each usage value its base type reads, and refuses a float under integer and a code its lexical form does not spell, by Usage typed value and E1 derived",
    () =>
      // Oracle: PostgreSQL, `UsageValue`'s own laws: the `Usage_typed_value` check (reading 105),
      // its text matched against `BaseTypePattern`'s pattern of its base type (23514 on
      // `usage_typed_value`), and `E1_derived`, its code the one `BaseTypeLexical` spells.
      // Bound: the three usage-data fixtures whose values write a `baseType`: `usage3-typed`'s 24
      // (19 floats and 5 identifiers), `usage3-float-padded`'s padded float, accepted, and
      // `usage3-integer-float`'s `0.87` under `integer`, refused; one hand row of code `float`
      // under the lexical form `integer`.
      Effect.gen(function* usageTyped() {
        const client = yield* loginSession;
        for (const [name, count, refused] of [
          ["usage3-typed", 24, false],
          ["usage3-float-padded", 1, false],
          ["usage3-integer-float", 1, true],
        ] as const satisfies readonly (readonly [FixtureName, number, boolean])[]) {
          const built = yield* builtOf(yield* readPackage(yield* materialize(name)));
          assert.lengthOf(built.values, count, `${name} writes a baseType on ${String(count)}`);

          for (const row of built.values) {
            assertVerdict(
              yield* judged(client, statedInserts([{ fact: row, relation: UsageValue }])),
              "usage_typed_value",
              refused,
              `${name} ${row.text}`,
            );
          }
        }

        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              {
                fact: {
                  baseType: "float",
                  baseTypeLexical: "integer",
                  node: "00000000-0000-4000-8fff-000000000001",
                  text: "1",
                },
                relation: UsageValue,
              },
            ]),
          ),
          "e_1_derived",
          true,
          "a code its lexical form does not spell",
        );
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );
});
