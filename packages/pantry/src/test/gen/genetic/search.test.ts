/**
 * The genetic hunt's findings (`#pantry/test/gen/genetic/search.ts`): each class it reports carries
 * its reduced package, written from the genome it was reduced to, whichever phase found it.
 *
 * The isolation phase is tested through the helper both phases build their findings with, not
 * through `hunt`: an isolation finding is reported only when its class is one the breeding phase
 * did not show, which on a fixed seed takes a disagreement between the import and the law oracle
 * that a later fix closes, so a test that drove `hunt` to one would turn red on that fix.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { entriesOf, genomeOf, shownEntries } from "#pantry/test/gen/genetic/genome.ts";
import type { Disagreement } from "#pantry/test/gen/genetic/judge.ts";
import { reducedOf } from "#pantry/test/gen/genetic/search.ts";

/**
 * A small package: a manifest and the item it lists.
 */
const entries: PackageEntries = new Map([
  [
    "imsmanifest.xml",
    new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>',
    ),
  ],
  [
    "item.xml",
    new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t"/>',
    ),
  ],
]);

/**
 * A disagreement of the kind the isolation phase reports.
 */
const disagreement: Disagreement = {
  keys: "item.xml identifier=i",
  kind: "oracle-only-law",
  law: "File exists",
  rule: "file-exists",
};

describe("reducedOf", () => {
  it.effect("writes an isolation-phase finding's package from its genome", () =>
    Effect.gen(function* isolationFinding() {
      const genome = yield* genomeOf(entries);
      const reduced = yield* reducedOf({
        disagreement,
        genome,
        lineage: ["isolated toward File exists alone"],
        signature: { kind: "oracle-only-law", law: "File exists" },
        tries: 4,
      });
      const shown = shownEntries(yield* entriesOf(genome));

      assert.notStrictEqual(reduced.package, "");
      assert.strictEqual(reduced.package, shown);
      assert.deepStrictEqual(
        { ...reduced, package: shown },
        {
          disagreement,
          genome,
          lineage: ["isolated toward File exists alone"],
          package: shown,
          signature: { kind: "oracle-only-law", law: "File exists" },
          tries: 4,
        },
      );
    }),
  );
});
