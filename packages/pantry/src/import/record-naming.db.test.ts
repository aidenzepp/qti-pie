/**
 * Nine known classes of upstream's genetic repair round 4 (`#pantry/test/record-naming.ts`),
 * PostgreSQL the judge. Each turns on the document a resource's LOM record names, which Qti states
 * only in rules over queries (`#pantry/qti/queries.ts` `namingRecords`), and the genetic
 * differential's host judge leaves every rule over a query unknown, so only the database shows
 * whether the class's law fires.
 *
 * Every class is a stated limit that changes no verdict (spec reading 1): each package is refused
 * on both sides, by "RootOfType" (a record file whose root is a `cp:manifest`) or by "Href listed"
 * (`xml:base` on a `cp:resource`), so no case is accepted. PostgreSQL raises the first constraint
 * that fails, and the refusal names the laws of that one object (`#pantry/import/refusal.ts`), so a
 * case holds the refusal to a rule only where nothing else its package breaks can fail first, and
 * holds it never to name the class's law where that law holds on Qti:
 *
 * - **A record in another document than the package manifest names no document.** A `cp:resource` of
 *   such a document writes no `ResourceHref` (`#pantry/import/overlays/package.ts`
 *   `noPackageRows`), which `namingRecords` reads, so a record file's record breaks neither
 *   `lom-identifier` nor `lom-title`: decision 449's limit is lifted on Qti.
 * - **A resource's `href` resolves through the `xml:base` in scope and is percent-decoded** (reading
 *   102), so a record whose resolved `href` names no entry names no document, one whose `href`
 *   resolves to `choice.xml` names it, and `%63hoice.xml` names `choice.xml` (issue #65).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Record } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/rules.ts";
import type { Rule } from "#pantry/import/rules.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { writePackage } from "#pantry/test/gen/every-relation.ts";
import { encodedHrefMistitled, upstreamPackages } from "#pantry/test/record-naming.ts";
import type { UpstreamClass } from "#pantry/test/record-naming.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * What the database's refusal of a package names: every rule of `named`, and no rule of `never`.
 */
interface Verdict {
  readonly named: readonly Rule[];
  readonly never: readonly Rule[];
}

/**
 * Each upstream class's verdict on Qti, from its entry's text, one per class, so dropping a class
 * fails the typecheck:
 *
 * - **E1 derived, `GeneralObject` in `LomObject`**, under a record file and under `xml:base`, whose
 *   package is a record file named by a percent-encoded `href` that upstream's harness keyed under
 *   `xml:base` (issue #68): Qti has neither relation, and a record's object is what
 *   `lom-identifier` and `lom-title` read, which this record's empty general category gives
 *   neither. "E1 derived" names many laws a refusing object may merge, so the case holds the
 *   refusal alone.
 * - **`LomObjectIdentifier`**, under the same two, and **`LomObjectTitle` under a record file**: the
 *   record names no document, so the refusal never names the law.
 * - **`LomObjectTitle` under issue #65's `href`**: the law fires, since the decoded `href` names
 *   `choice.xml`, whose root writes no title; upstream's entry fixes the law oracle, not the
 *   import. The package breaks other laws that may fail first, so {@link encodedHrefMistitled}
 *   holds the law.
 * - **`LomObjectTitle` under `xml:base`**: the law fires, since `passages/` and `../choice.xml`
 *   resolve to `choice.xml`, whose root writes no title, as upstream's lifted limit attaches the
 *   record on both sides. Any `xml:base` on a `cp:resource` breaks "Href listed" (reading 1), so no
 *   package breaks the law alone, and the case holds the refusal alone.
 * - **The law oracle alone raising `LomObjectTitle`**: `sub/` and `meta/choice.xml` resolve to no
 *   entry, so the record names no document, as the import's rows hold, and the refusal never names
 *   the law.
 * - **`lom-identifier` named where the law oracle names `root-type-reverse`**: every file is listed,
 *   and the record file's `cp:manifest` root breaks "RootOfType" alone, so the refusal names
 *   `root-type-reverse`, as the law oracle does, and never `lom-identifier`.
 */
const verdicts = {
  "import-only-law: E1 derived, contained GeneralObject(record, document) in LomObject(record, document) (under a record file whose root is a cp:manifest)":
    { named: [], never: [] },
  "import-only-law: E1 derived, contained GeneralObject(record, document) in LomObject(record, document) (under xml:base on a cp:resource)":
    { named: [], never: [] },
  "import-only-law: LomObjectIdentifier, contained LomEntry(holderParent) in LomObjectIdentifier(record) (under a record file whose root is a cp:manifest)":
    { named: [], never: ["lom-identifier"] },
  "import-only-law: LomObjectIdentifier, contained LomEntry(holderParent) in LomObjectIdentifier(record) (under xml:base on a cp:resource)":
    { named: [], never: ["lom-identifier"] },
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record) (under a record file whose root is a cp:manifest)":
    { named: [], never: ["lom-title"] },
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record) (under a resource href the oracle reads unresolved (#65))":
    { named: [], never: [] },
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record) (under xml:base on a cp:resource)":
    { named: [], never: [] },
  "lone-refusal: RootOfType named lom-identifier, witness unreported (under a record file whose root is a cp:manifest)":
    { named: ["root-type-reverse"], never: ["lom-identifier"] },
  "oracle-only-law: LomObjectTitle": { named: [], never: ["lom-title"] },
} as const satisfies Record.ReadonlyRecord<UpstreamClass, Verdict>;

/**
 * One case: what it is, the package, and what its refusal names.
 */
interface Case extends Verdict {
  readonly entries: PackageEntries;
  readonly name: string;
}

/**
 * Upstream's nine packages, each with its class's verdict, and issue #65's class alone, refused
 * under `lom-title`.
 */
const cases: readonly Case[] = [
  ...Record.toEntries(verdicts).map(([known, verdict]): Case => ({
    entries: upstreamPackages[known],
    name: `upstream's package of ${known}`,
    ...verdict,
  })),
  {
    entries: encodedHrefMistitled,
    name: "a record whose percent-encoded href names an item of another title",
    named: ["lom-title"],
    never: [],
  },
];

describe.skipIf(!hasLease)(
  "import/record-naming.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the document a resource's LOM record names", (it) => {
      for (const { entries, name, named, never } of cases) {
        it.effect(`refuses ${name}`, () =>
          // Oracle: PostgreSQL, every law of the schema over the case's package; the expected
          // verdict is the case's as written (spec reading 1; QTI 3.0 Metadata §2.7.1.1 and
          // §2.7.1.2, reading 62).
          Effect.scoped(
            Effect.gen(function* recordNamingVerdict() {
              const dir = yield* scratchDirectory("record-naming-");
              yield* writePackage(entries, dir);

              const outcome = yield* Effect.result(importPackage(dir));
              const said = `${name}: ${outcome._tag === "Failure" ? outcome.failure.message : "accepted"}`;
              const rules =
                outcome._tag === "Failure" && outcome.failure instanceof ImportRefused
                  ? outcome.failure.rules
                  : undefined;

              assert.isDefined(rules, said);
              for (const rule of named) {
                assert.include(rules, rule, said);
              }
              for (const rule of never) {
                assert.notInclude(rules, rule, said);
              }
            }),
          ),
        );
      }
    });
  },
);
