/**
 * The restored-check fixtures (`restoredNames`, `#pantry/test/fixtures.ts`) through the importer,
 * on the lease, PostgreSQL itself the judge.
 *
 * The two ARIA negatives are refused under the rule the law oracle names for their one breach
 * (pinned free in `src/test/rv-x.oracle.test.ts`, reading 9): `aria-h1-role-button`'s `role` of
 * `button` on an `h1` lies outside `headingRole`'s enumeration (`attribute-lexical`), and
 * `aria-source-role`'s `role` on a `source` is a declaration `readingRefusals` drops
 * (`attribute-admission`). Each breaks one law, so its rule is asserted equal (the GEN-A rule).
 *
 * The other three are accepted: `lang-case-mismatch`'s `en-GB` and `en-gb` are one language, and
 * the two pattern packages' `qti-pattern-match` keeps the braced `{NOSUCH}`, which names no
 * variable, as a string value (reading R15-k; decision 331), stored as written.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { authorRole, judgedCase, loginSession } from "#pantry/test/direct-sql.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { restoredNames } from "#pantry/test/fixtures.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * A restored-check fixture's name.
 */
type RestoredName = (typeof restoredNames)[number];

/**
 * The ARIA negatives, each with the rule of the one law it breaks.
 */
const refused = [
  ["aria-h1-role-button", "attribute-lexical"],
  ["aria-source-role", "attribute-admission"],
] as const satisfies readonly (readonly [RestoredName, Rule])[];

/**
 * The fixtures the importer accepts, with no stored row read back.
 */
const accepted = ["lang-case-mismatch"] as const satisfies readonly RestoredName[];

/**
 * The fixtures whose stored `qti-pattern-match` holds the unresolved braced `pattern`.
 */
const patterns = [
  "pattern-unresolved-item",
  "pattern-unresolved-test",
] as const satisfies readonly RestoredName[];

/**
 * The stored `pattern` of every `qti-pattern-match` of one package, through the author role's
 * views, which name each closed id's handle beside its code.
 */
const storedPatterns = `SELECT a.lexical FROM ${authorRole}.attribute a
   JOIN ${authorRole}.document d ON d.node = a.document
  WHERE d.package = $1 AND a.kind_name = 'qti-pattern-match' AND a.name_name = 'pattern'`;

/**
 * A stored attribute's lexical form, as the read returns it.
 */
const LexicalSchema = Schema.Struct({ lexical: Schema.String });

describe.skipIf(!hasLease)(
  "import/restored.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the restored-check fixtures through the importer", (it) => {
      for (const [name, rule] of refused) {
        it.effect(`refuses ${name} naming ${rule}`, () =>
          Effect.gen(function* refusesAria() {
            const failure = yield* Effect.flip(importPackage(yield* materialize(name)));

            assert.strictEqual(failure._tag, "ImportRefused", `${name}: refused by another error`);

            if (failure._tag === "ImportRefused") {
              yield* Effect.log(`${name} refused under ${failure.rule}`, failure.detail);

              assert.strictEqual(failure.rule, rule, `${name}: the refusal named another rule`);
            }
          }),
        );
      }

      for (const name of accepted) {
        it.effect(`accepts ${name}`, () =>
          Effect.gen(function* acceptsFixture() {
            const id = yield* importPackage(yield* materialize(name));

            assert.isString(id, name);
          }),
        );
      }

      for (const name of patterns) {
        it.effect(`accepts ${name}, its qti-pattern-match pattern stored as {NOSUCH}`, () =>
          Effect.gen(function* acceptsPattern() {
            const id = yield* importPackage(yield* materialize(name));
            const client = yield* loginSession;
            // The login holds no SELECT of its own, so the stored row is read as the author role,
            // a case that writes nothing and reads it.
            const { read, refused: refusal } = yield* judgedCase(client, {
              inserts: [],
              reads: [{ text: storedPatterns, values: [id] }],
            });

            assert.isTrue(refusal._tag === "None", `${name}: the read was refused`);
            assert.deepStrictEqual(
              Schema.decodeUnknownSync(Schema.Array(LexicalSchema))(read[0] ?? []),
              [{ lexical: "{NOSUCH}" }],
              name,
            );
          }),
        );
      }
    });
  },
);
