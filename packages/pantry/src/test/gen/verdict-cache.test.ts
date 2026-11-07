/**
 * The verdict cache (`#pantry/test/gen/verdict-cache.ts`) serves a batch's report only under the
 * key of every input the report depends on: the validator's version, the pins' digests, the
 * catalog, the driver and the batch.
 *
 * Oracle: the rule above, on named cases. Live: the same inputs key the same report, a hit serves
 * the kept report with the reader's folder where the writer's stood, and the validator runs once
 * per key. Wild: a batch whose one probe changed, under a cache that holds the report of the batch
 * before it, keys anew and runs the validator again, as a change to the version, a pin, the catalog
 * or the driver does; a cache file that holds no report is a miss.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, FileSystem, Layer, Ref } from "effect";
import { Digest } from "effect/crypto";
import { cachedReport, verdictKey } from "#pantry/test/gen/verdict-cache.ts";
import type { VerdictInputs } from "#pantry/test/gen/verdict-cache.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import type { XmllintReport } from "#pantry/xml/oracle.ts";

/**
 * A batch's inputs, as a run of the vocabulary oracle writes them, cut to a probe of each kind.
 */
const inputs: VerdictInputs = {
  batch: '<p:batch xmlns:p="urn:probe" xmlns:q="urn:q">\n<q:a/>\n<q:b x="1"/>\n</p:batch>',
  catalog: '<catalog><uri name="https://example.com/a.xsd" uri="file:///cache/a.xsd"/></catalog>',
  driver: '<xs:schema targetNamespace="urn:probe"><xs:import namespace="urn:q"/></xs:schema>',
  pins: [
    ["w3/xml.xsd", "a".repeat(64)],
    ["xlink/xlink.xsd", "b".repeat(64)],
  ],
  xmllint: "xmllint: using libxml version 20913\n   compiled with: Threads Tree Schemas\n",
};

/**
 * Each input changed alone, as a run that must not read the report of {@link inputs}.
 */
const changed: readonly (readonly [string, VerdictInputs])[] = [
  ["a probe of the batch", { ...inputs, batch: inputs.batch.replace("<q:a/>", "<q:a y=''/>") }],
  ["the validator's version", { ...inputs, xmllint: inputs.xmllint.replace("20913", "21309") }],
  [
    "one pin's digest",
    {
      ...inputs,
      pins: [inputs.pins[0] ?? ["w3/xml.xsd", ""], ["xlink/xlink.xsd", "c".repeat(64)]],
    },
  ],
  ["the catalog", { ...inputs, catalog: inputs.catalog.replace('a.xsd"/>', 'b.xsd"/>') }],
  ["the driver", { ...inputs, driver: inputs.driver.replace("urn:q", "urn:r") }],
];

/**
 * The services the cache reads through.
 */
const CacheLayer = Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto);

describe("test/gen/verdict-cache.ts", () => {
  it.effect("keys a batch by every input its report depends on, each change a key of its own", () =>
    Effect.gen(function* keys() {
      const key = yield* verdictKey(inputs);
      const others = yield* Effect.forEach(changed, ([, input]) => verdictKey(input), {
        concurrency: 1,
      });

      assert.strictEqual(yield* verdictKey({ ...inputs }), key);
      assert.match(key, /^[0-9a-f]{64}$/u);
      assert.strictEqual(new Set([key, ...others]).size, changed.length + 1, "distinct keys");
    }).pipe(Effect.provide(CacheLayer)),
  );

  it.effect(
    "runs the validator on a miss, serves a hit, and runs it again for a changed probe",
    () =>
      Effect.gen(function* cache() {
        const fs = yield* FileSystem.FileSystem;
        const root = yield* scratchDirectory("verdict-cache-");
        const runs = yield* Ref.make<readonly string[]>([]);
        const run = (name: string, report: XmllintReport) =>
          Effect.as(
            Ref.update(runs, (held) => [...held, name]),
            report,
          );
        const writer = `${root}/writer`;
        const reader = `${root}/reader`;
        const key = yield* verdictKey(inputs);
        const [, probe] = changed[0] ?? ["", inputs];
        const probeKey = yield* verdictKey(probe);

        const first = yield* cachedReport(
          root,
          key,
          writer,
          run("miss", {
            code: 3,
            report: `${writer}/batch-0.xml:2: element a: Schemas validity error : no\n${writer}/batch-0.xml fails to validate\n`,
          }),
        );
        const hit = yield* cachedReport(
          root,
          key,
          reader,
          run("hit", { code: 0, report: "never read" }),
        );
        const recomputed = yield* cachedReport(
          root,
          probeKey,
          reader,
          run("changed probe", { code: 0, report: `${reader}/batch-0.xml validates\n` }),
        );

        yield* fs.writeFileString(`${root}/${"f".repeat(64)}.json`, '{"code": 3, "rep');

        const torn = yield* cachedReport(
          root,
          "f".repeat(64),
          reader,
          run("torn file", { code: 0, report: `${reader}/batch-0.xml validates\n` }),
        );

        assert.strictEqual(first.code, 3);
        assert.deepStrictEqual(hit, {
          code: 3,
          report: `${reader}/batch-0.xml:2: element a: Schemas validity error : no\n${reader}/batch-0.xml fails to validate\n`,
        });
        assert.deepStrictEqual(recomputed, {
          code: 0,
          report: `${reader}/batch-0.xml validates\n`,
        });
        assert.deepStrictEqual(torn, { code: 0, report: `${reader}/batch-0.xml validates\n` });
        assert.deepStrictEqual(yield* Ref.get(runs), ["miss", "changed probe", "torn file"]);
      }).pipe(Effect.scoped, Effect.provide(CacheLayer)),
  );
});
