import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The packaging fixtures of the retired guards, each with the rules its refusal may name: the
 * rules of every law the law oracle (`src/test/oracle.ts` `judge`) finds broken in it, judged on
 * 2026-11-06 over the composed grammar, so a verdict names the rule the oracle predicts.
 *
 * A fixture that breaks several laws lists each one's rule, since PostgreSQL reports whichever
 * constraint it checks first: `extmeta-item-href` breaks `Href listed`, `LomObjectIdentifier`,
 * `LomObjectTitle`, `Document lang` and, since its item and its record name one file under two
 * types, `Document entry`; the file's `lom:lom` root is a record's, so the file is read as the
 * record's document and `RootOfType` holds (spec reading 162; judged again on 2026-11-07). A second
 * `GUID` (`csm-two-guids`) or a second set (`csm-two-sets`) breaks its particle's at-most-once,
 * which the content automaton holds (`N5 Follow`), so its rule is `ordering`.
 *
 * The guards' other fixtures break no law the cutover states: the LOM and CSM capacities, which
 * the deleted unsourced caps held, and the guards' departures from the XSD (plan §2.2). The
 * importer accepts them, and Q5.15's packaging test holds that.
 */
const refused = [
  ["csm-no-guid", ["child-set"]],
  ["csm-no-labelled-guid", ["child-set"]],
  ["csm-two-guids", ["ordering"]],
  ["csm-two-sets", ["ordering"]],
  [
    "extmeta-item-href",
    ["href-listed", "lom-identifier", "lom-title", "document-lang", "entry-kind"],
  ],
  ["extmeta-item-root", ["root-type-reverse"]],
  ["filelom-two-metadata", ["ordering"]],
  ["lti300-as-301", ["attribute-lexical"]],
  ["outcome-title", ["attribute-admission"]],
  ["usage3-bad-context", ["attribute-lexical"]],
  ["usage3-bad-month", ["attribute-lexical"]],
  ["usage3-bad-name", ["attribute-lexical"]],
  ["usage3-feb-30", ["attribute-lexical"]],
  ["usage3-no-map-entry", ["child-set"]],
  ["usage3-no-target", ["ordering"]],
  ["usage3-ordinary-mapping", ["unmodeled-vocabulary"]],
  ["usage3-two-values", ["ordering"]],
  ["variant-301", ["admission"]],
  ["variant-bad-uri", ["text-copy"]],
  ["variant-before-file", ["ordering"]],
  ["variant-id-clash", ["document-key"]],
  ["variant-no-metadata", ["child-set"]],
  ["variant-no-resource", ["idref-target"]],
  ["variant-tactile", ["text-copy"]],
  ["variant-two-atinteroperable", ["ordering"]],
  ["variant-two-complexity", ["ordering"]],
] as const satisfies readonly (readonly [FixtureName, readonly Rule[]])[];

describe.skipIf(!hasLease)(
  "import/refusal.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the retired guards' packaging fixtures, refused under the rules their laws keep", (it) => {
      for (const [name, rules] of refused) {
        it.effect(`refuses ${name} naming ${rules.join(" or ")}`, () =>
          Effect.gen(function* refusesFixture() {
            const failure = yield* Effect.flip(importPackage(yield* materialize(name)));

            assert.strictEqual(failure._tag, "ImportRefused", `${name}: refused by another error`);

            if (failure._tag === "ImportRefused") {
              yield* Effect.log(`${name} refused under ${failure.rule}`, failure.detail);

              assert.include(rules, failure.rule, `${name}: the refusal named another rule`);
            }
          }),
        );
      }
    });
  },
);
