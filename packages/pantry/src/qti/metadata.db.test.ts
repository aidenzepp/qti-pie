/**
 * The metadata overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused state is one the law's model refuses, named by the law that states it.
 *
 * - **`lom-identifier` and `lom-title`** on `metaData`, through the importer: each is a rule over a
 *   query (`#pantry/qti/queries.ts`), a deferred constraint trigger on every table its queries
 *   read, which the importer's whole package exercises and names by its rule (`ImportRefused`'s
 *   `rules`). Its record's entry names `qti_v2_item_01` where its item is `choice`, and its title
 *   string is `Metadata Example Item #1` where its item's title is `Unattended Luggage`. PostgreSQL
 *   raises the first deferred trigger that fails, so each case breaks at most one of the two: the
 *   entry edited to `choice`, plain or padded, leaves `lom-title` alone broken; the string edited
 *   to the item's title leaves `lom-identifier` alone broken; both edited, neither.
 *
 * The other cases are a direct SQL writer's, as the rules file's rule 8 and grizzle's README
 * ("Direct SQL access") state it, through the one direct writer (`#pantry/test/direct-sql.ts`):
 * the author login, `SET ROLE` to the author role, at SERIALIZABLE, every deferrable foreign key
 * deferred, the builder's facts written into `Qti`'s tables with every column a writer fills
 * (generated columns PostgreSQL computes), then the constraints under test set immediate, and a
 * rollback. A role writes a table, never its own view of it: it holds INSERT on each table it
 * writes and only SELECT on its views (README, "Security model"), so a read back goes through the
 * view. The rows are the builder's (`#pantry/import/overlays/metadata.ts`) over the fixture's own
 * documents:
 *
 * - **the date** (`attribute-lexical`): each `lastUpdated` of the usage-data fixtures `usage3`,
 *   `usage3-typed`, `usage3-padded` and `usage3-float-padded` is accepted by its row's laws, its
 *   generated `date` the day it names; `usage3-feb-30`'s and `usage3-bad-month`'s are refused by
 *   `day`'s domain, `lexicalForm(date)` (23514).
 * - **Usage typed value** (reading 105): each usage value that writes a `baseType` in `usage3-typed`
 *   and `usage3-float-padded` is accepted by its row's laws; `usage3-integer-float`'s float under
 *   `integer` is refused by the `Usage_typed_value` CHECK (23514), and a code its lexical form does
 *   not spell by `E1_derived`.
 *
 * The other whole-package cases arrive with Q5.15: `simple` accepted, `identifier-mismatch` refused
 * `lom-identifier`, `title-mismatch` refused `lom-title`, and the usage-data fixtures accepted but
 * `usage3-feb-30` (refused `attribute-lexical`, by `day`'s domain or AL1's value domain).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, it, layer } from "@effect/vitest";
import { Effect, Layer, Option, Result } from "effect";
import { describe } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { rowsOf } from "#pantry/import/overlays/metadata.ts";
import type { MetadataIds } from "#pantry/import/overlays/metadata.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { StatisticDate, UsageValue } from "#pantry/qti/metadata.ts";
import { Qti } from "#pantry/qti/own.ts";
import {
  assertVerdict,
  authorViews,
  judged,
  judgedCase,
  loginSession,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import { checkConstraintOf } from "#pantry/test/judged-laws.ts";
import { materialize, materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureName, TextEdit } from "#pantry/test/fixtures.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

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
const idsFor = (document: number, documentType: MetadataIds["documentType"]): MetadataIds => {
  const idOf = (index: number): NodeId =>
    `00000000-0000-4000-8${document.toString(16).padStart(3, "0")}-${index.toString(16).padStart(12, "0")}`;

  return {
    context: ownContext(idOf(0)),
    documentType,
    idOf,
    package: "00000000-0000-4000-8000-00000000c0de",
  };
};

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
 * Build a package's metadata rows as the importer will: each document's rows.
 *
 * @param files - The package's entries.
 * @returns Every document's statistic dates and typed usage values.
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
      dates.push(...rows.StatisticDate.values());
      values.push(...rows.UsageValue.values());
    }
  }

  return { dates, values };
});

/**
 * The `metaData` package's tarball member.
 */
const metaDataMember = "qtiv3-examples/packaging/metaData/metaData.zip";

/**
 * The `metaData` manifest's one general entry, which names `qti_v2_item_01`.
 */
const metaDataEntry = "<imsmd:entry>qti_v2_item_01</imsmd:entry>";

/**
 * The `metaData` manifest's general title string, which is not its item's title.
 */
const metaDataTitle = '<imsmd:string language="en">Metadata Example Item #1</imsmd:string>';

/**
 * Replace one passage of the `metaData` manifest.
 *
 * @param search - The passage.
 * @param replacement - What replaces it.
 * @returns The edit.
 */
const manifestEdit = (search: string, replacement: string): TextEdit => ({
  _tag: "ReplaceText",
  file: "imsmanifest.xml",
  replacement,
  search,
});

/**
 * The `metaData` record's entry, edited to name its item, `choice`.
 */
const entryNamesItem = manifestEdit(metaDataEntry, "<imsmd:entry>choice</imsmd:entry>");

/**
 * The `metaData` record's entry, edited to name its item padded.
 */
const paddedEntryNamesItem = manifestEdit(metaDataEntry, "<imsmd:entry>\n  choice\t</imsmd:entry>");

/**
 * The `metaData` record's title string, edited to its item's title.
 */
const titleNamesItem = manifestEdit(
  metaDataTitle,
  '<imsmd:string language="en">Unattended Luggage</imsmd:string>',
);

describe.skipIf(!hasLease)(
  "qti/metadata.db.test.ts, the LOM laws through the importer",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("lom-identifier and lom-title, judged by PostgreSQL's rules over queries", (laws) => {
      laws.effect(
        "refuses metaData's record by lom-identifier exactly where its entry names another item, and by lom-title exactly where its title string titles another",
        () =>
          // Oracle: PostgreSQL, the rules over queries "LomObjectIdentifier" and "LomObjectTitle"
          // (§2.7.1.1 and §2.7.1.2, reading 62), each a deferred constraint trigger, as the importer
          // names a refusal's rule.
          // Bound: the fixture with its title fixed and its entry as written, and with its entry
          // fixed, plain or padded, its title as written or fixed.
          Effect.gen(function* lomLaws() {
            for (const { edits, identifier, label, title } of [
              { edits: [titleNamesItem], identifier: true, label: "entry", title: false },
              { edits: [entryNamesItem], identifier: false, label: "title", title: true },
              { edits: [paddedEntryNamesItem], identifier: false, label: "padded", title: true },
              {
                edits: [entryNamesItem, titleNamesItem],
                identifier: false,
                label: "both",
                title: false,
              },
            ]) {
              const dir = yield* materializeSpec({
                edits,
                member: metaDataMember,
                name: `lom-laws-${label}`,
              });
              const outcome = yield* Effect.result(importPackage(dir));
              const rules =
                outcome._tag === "Failure" && outcome.failure instanceof ImportRefused
                  ? outcome.failure.rules
                  : [];
              const said = outcome._tag === "Failure" ? outcome.failure.message : "accepted";

              assert.strictEqual(rules.includes("lom-identifier"), identifier, `${label}: ${said}`);
              assert.strictEqual(rules.includes("lom-title"), title, `${label}: ${said}`);
            }
          }),
        leaseTestTimeoutMs,
      );
    });
  },
);

describe.skipIf(!hasLease)("qti/metadata.db.test.ts, on the lease", () => {
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
                  text: `SELECT date::text AS date FROM ${authorViews}.statistic_date WHERE node = $1`,
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
      // its text matched against `BaseTypePattern`'s pattern of its base type (23514), and
      // `E1_derived`, its code the one `BaseTypeLexical` spells.
      // Bound: the three usage-data fixtures whose values write a `baseType`: `usage3-typed`'s 24
      // (19 floats and 5 identifiers), `usage3-float-padded`'s padded float, accepted, and
      // `usage3-integer-float`'s `0.87` under `integer`, refused; one hand row of code `float`
      // under the lexical form `integer`.
      Effect.gen(function* usageTyped() {
        const client = yield* loginSession;
        const typed = checkConstraintOf(Qti, UsageValue.name, "Usage_typed_value");
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
              typed,
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
          checkConstraintOf(Qti, UsageValue.name, "E1_derived"),
          true,
          "a code its lexical form does not spell",
        );
      }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
    leaseTestTimeoutMs,
  );
});
