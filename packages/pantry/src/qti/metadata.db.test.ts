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
 * The date's and the usage values' row laws are row CHECKs the host judges, and stay on the free
 * tier (`#pantry/qti/metadata.oracle.test.ts`).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import type { TextEdit } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

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
              const outcome = yield* Effect.result(importDir(dir));
              const rules =
                outcome._tag === "Failure" && outcome.failure instanceof ImportRefused
                  ? outcome.failure.rules
                  : [];
              const said = outcome._tag === "Failure" ? outcome.failure.message : "accepted";

              if (identifier || title) {
                assert.isTrue(
                  outcome._tag === "Failure" && outcome.failure instanceof ImportRefused,
                  `${label}: expected an ImportRefused, got ${said}`,
                );
              } else {
                assert.strictEqual(outcome._tag, "Success", `${label}: ${said}`);
              }

              assert.strictEqual(rules.includes("lom-identifier"), identifier, `${label}: ${said}`);
              assert.strictEqual(rules.includes("lom-title"), title, `${label}: ${said}`);
            }
          }),
        leaseTestTimeoutMs,
      );
    });
  },
);
