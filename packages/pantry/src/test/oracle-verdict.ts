/**
 * The law oracle (`#pantry/test/oracle.ts`) as the importer's tests use it: the verdict it
 * predicts of a package ({@link oracleVerdict}), which an import test compares with the
 * database's ({@link importAgreesWithOracle}); the rule its reader and codec refuse a package under
 * before any law ({@link oracleCodecRule}); and the packaging fixtures the import tests judge by
 * it.
 */
import { assert } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { judge, lawsOf, ruleOf } from "#pantry/test/oracle.ts";

/**
 * The oracle's tables over the installed grammar, built once.
 */
const laws = lawsOf(grammar);

/**
 * What the law oracle predicts of a package: accepted, or refused under one of the rules its
 * breaches keep (or its codec refusal's). The database refuses a package under the rule of the
 * first native object that fails, by the refusal's precedence over the laws that object
 * discharges, so an import agrees with the oracle when its rule is any of these.
 */
export type OracleVerdict =
  | { readonly kind: "accepted" }
  | { readonly kind: "refused"; readonly rules: ReadonlySet<string> };

/**
 * Predict a package's verdict by the law oracle over its entries.
 *
 * @param files - The package's entries, as `readPackage` read them.
 * @returns The verdict.
 */
export const oracleVerdict = (files: readonly PackageFile[]): Effect.Effect<OracleVerdict> =>
  Effect.map(judge(files, grammar, laws), (judgment): OracleVerdict => {
    if (judgment._tag === "CodecRefusal") {
      return { kind: "refused", rules: new Set([judgment.rule]) };
    }

    return judgment.breaches.length === 0
      ? { kind: "accepted" }
      : { kind: "refused", rules: new Set(judgment.breaches.map(({ law }) => ruleOf(law))) };
  });

/**
 * The rule the oracle's reader and codec refuse a package under, before any law is judged.
 *
 * @param files - The package's entries, as `readPackage` read them.
 * @returns The rule, or none when the oracle reads every document and judges the laws.
 */
export const oracleCodecRule = (
  files: readonly PackageFile[],
): Effect.Effect<Option.Option<string>> =>
  Effect.map(judge(files, grammar, laws), (judgment) =>
    judgment._tag === "CodecRefusal" ? Option.some(judgment.rule) : Option.none(),
  );

/**
 * Import a package on the lease, and hold its verdict to the oracle's: accepted where the oracle
 * accepts, and refused under one of the rules the oracle's breaches keep where it refuses.
 *
 * @param dir - The package directory or `.zip` file.
 * @param label - Its name, for the assertion's message.
 * @returns The package's id when it was accepted, none when it was refused; fails the test when
 *   the verdicts disagree.
 */
export const importAgreesWithOracle = (dir: string, label: string) =>
  Effect.gen(function* agreesWithOracle() {
    const expected = yield* oracleVerdict(yield* readPackage(dir));
    const outcome = yield* Effect.result(importPackage(dir));

    if (Result.isSuccess(outcome)) {
      assert.strictEqual(
        expected.kind,
        "accepted",
        `${label} was accepted, and the oracle refuses it`,
      );

      return Option.some(outcome.success);
    }

    const refused = outcome.failure;
    if (!(refused instanceof ImportRefused)) {
      return assert.fail(`${label} failed with ${refused.message}`);
    }

    if (expected.kind === "accepted") {
      return assert.fail(`${label} was refused, and the oracle accepts it: ${refused.message}`);
    }

    assert.isTrue(
      expected.rules.has(refused.rule),
      `${label}: ${refused.message}; the oracle's rules are ${[...expected.rules].join(", ")}`,
    );

    return Option.none();
  });

/**
 * The packaging fixtures (the spec's 4.12 to 4.14): the positives and their hand-broken copies,
 * each judged by the oracle's verdict rather than a rule written here.
 */
export const packagingFixtures = [
  "lomrest",
  "lomrest-two-titles",
  "lomrest-two-purposes",
  "lomrest-two-kinds",
  "lomrest-exam",
  "lomrest-self-assessment",
  "csm",
  "csm-no-labelled-guid",
  "csm-two-guids",
  "csm-no-guid",
  "csm-two-sets",
  "filelom",
  "filelom-qmd",
  "filelom-two-metadata",
  "nestedqmd",
  "nestedqmd-manifest-lom",
  "nestedqmd-both",
  "extmeta",
  "extmeta-item-root",
  "extmeta-item-href",
  "extmeta-two-resources",
  "extmeta-hrefless",
  "variant",
  "variant-padded",
  "variant-301",
  "variant-self-ref",
  "variant-no-resource",
  "variant-id-clash",
  "variant-tactile",
  "variant-bad-uri",
  "variant-two-atinteroperable",
  "variant-two-complexity",
  "variant-no-metadata",
  "variant-before-file",
  "outcome",
  "outcome-title",
  "lti301",
  "lti300",
  "lti300-as-301",
  "bytes",
  "bytes-webcontent-item",
  "resproc",
  "resproc-webcontent",
  "rtest01",
  "rtest01-include-root",
  "rtest01-include-target",
  "rtest01-fragment-identifier",
  "rtest01-fragment-context",
  "rtest01-cycle",
  "rtest01-hottext-key",
  "rtest01-choice-variable",
  "rtest01-template-reference",
  "rtest01-fragment-lang",
  "rtest01-rule-variable",
  "usage3",
  "usage3-typed",
  "usage3-padded",
  "usage3-integer-float",
  "usage3-float-padded",
  "usage3-no-target",
  "usage3-two-values",
  "usage3-ordinary-mapping",
  "usage3-no-map-entry",
  "usage3-bad-month",
  "usage3-feb-30",
  "usage3-bad-context",
  "usage3-bad-name",
] as const satisfies readonly FixtureName[];
