/**
 * The `data-ssml` law (spec reading 177, `#pantry/qti/data-ssml.ts`) on the lease, PostgreSQL
 * itself the judge (testing doctrine, rule 3): whole packages through the importer, `simple` with
 * its first paragraph's closed `data-ssml` set to one value.
 *
 * The importer reads a value into rows and judges nothing of it (`#pantry/vocab/data-ssml.ts`), so
 * each package's host read, the preview, succeeds, and the import is refused by the database alone:
 * an `ImportRefused` whose origin is `Database`, under `attribute-lexical`, with the law "Data
 * SSML" among the laws it names. A value of no JSON object of objects of strings (text that is not
 * JSON, or a value of the wrong type) has no `DataSsml` row, and the law's containment refuses its
 * attribute; an unknown name and a value outside an enumeration are written as rows its checks
 * refuse; a member without the property it requires breaks its rule over `RequiredSsmlProperty`.
 * A value Data-SSML 1.0 admits imports.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { previewPackage } from "#pantry/import/preview.ts";
import { ImportRefused } from "#pantry/import/rules.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * `simple`'s item with its first paragraph's `data-ssml` set to a value, materialized once under
 * its own name.
 *
 * @param name - The fixture's name.
 * @param value - The attribute's value, written between single quotes.
 * @returns The package's directory.
 */
const withDataSsml = (name: string, value: string) =>
  materializeSpec({
    edits: [
      {
        _tag: "ReplaceText",
        file: "choice.xml",
        replacement: `<p data-ssml='${value}'>Look at the text in the picture.</p>`,
        search: "<p>Look at the text in the picture.</p>",
      },
    ],
    member: "qtiv3-examples/packaging/simple/simple.zip",
    name: `data-ssml-db-${name}`,
  });

/**
 * The values Data-SSML 1.0 §3.4 refuses, each by what it is and its fixture's name.
 */
const refused = [
  { name: "unknown-name", value: '{"brk":{}}', what: "an unknown name" },
  { name: "wrong-type", value: '{"break":{"time":2}}', what: "a value of the wrong type" },
  {
    name: "outside-enumeration",
    value: '{"break":{"strength":"loud"}}',
    what: "a value outside an enumeration",
  },
  { name: "not-json", value: "not json", what: "text that is not JSON" },
  {
    name: "required-missing",
    value: '{"say-as":{}}',
    what: "a member without the property it requires",
  },
] as const;

/**
 * Values Data-SSML 1.0 admits: a member in an irregular spelling (a `r` for the `r`, JSON
 * whitespace around every token), and a member with the property it requires.
 */
const accepted = [
  { name: "escaped", value: '{ "b\\u0072eak" : { "strength" : "x-strong" } }' },
  { name: "required-held", value: '{"sub":{"alias":"Froyd"}}' },
] as const;

describe.skipIf(!hasLease)(
  "qti/data-ssml.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the data-ssml law, judged by PostgreSQL through the importer", (it) => {
      for (const { name, value, what } of refused) {
        it.effect(
          `refuses a package whose data-ssml holds ${what} under attribute-lexical, by the law Data SSML, in the database`,
          () =>
            // Oracle: Data-SSML 1.0's JSON Schema, §3.4, as a checker: the value is one it refuses.
            // The host read accepts the package (no host judge, reading 177), and PostgreSQL
            // refuses it, the law table naming the law "Data SSML" among the laws its outcome names.
            Effect.gen(function* refusedPackage() {
              const dir = yield* withDataSsml(name, value);
              const preview = yield* previewPackage(dir);
              const refusal = yield* Effect.flip(importPackage(dir));

              assert.isFalse(preview.databaseChecked, value);
              assert.isTrue(refusal instanceof ImportRefused, `${value}: ${refusal._tag}`);

              if (refusal instanceof ImportRefused) {
                assert.strictEqual(refusal.rules[0], "attribute-lexical", refusal.detail);
                assert.strictEqual(refusal.origin._tag, "Database", value);
                assert.isTrue(
                  refusal.origin._tag === "Database" &&
                    refusal.origin.laws.some(
                      (law) => law.name === "Data SSML" && law.rule === "attribute-lexical",
                    ),
                  `${value}: the database's laws name Data SSML: ${refusal.detail}`,
                );
              }
            }),
        );
      }

      for (const { name, value } of accepted) {
        it.effect(`accepts a package whose data-ssml is ${value}`, () =>
          // Oracle: Data-SSML 1.0's JSON Schema, §3.4: the value is one it admits, so no law
          // refuses the package's rows.
          Effect.gen(function* acceptedPackage() {
            const imported = yield* Effect.result(importPackage(yield* withDataSsml(name, value)));

            assert.isTrue(
              Result.isSuccess(imported),
              Result.isFailure(imported) ? imported.failure.message : "accepted",
            );
          }),
        );
      }
    });
  },
);
