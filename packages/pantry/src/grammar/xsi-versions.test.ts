/**
 * An `xsi:type` names a type of its document's version only: the composed grammar's
 * `XsiTypes.definedIn` and the codec's lookup through it agree with each version's pinned XSDs, so
 * a type only 3.0.1 defines names none in 3.0.0, and the other way round.
 *
 * Oracle: a second reading of the pinned XSDs. The test's own XSD reader (`loadXsd`,
 * `#pantry/test/gen/grammar.ts`), which shares no code with the deriver, lists every named type
 * each version's schema sets declare, from the roots the XSD differentials validate with
 * (`rootsOf`); XML Schema's built-ins (Part 2, §3) are the same in both. XML Schema 1.0 Part 1,
 * §3.3.4, Element Locally Valid (Element), clause 4.2: an `xsi:type` must resolve to a type
 * definition of the schemas the document is assessed against, so one naming a type its version
 * lacks is the codec's `type-unknown` on an element of a kind.
 *
 * Bound: every `TypeName` handle in both versions, exhausted, against the lookup; and every handle
 * one version defines and the other does not, each as the `xsi:type` of an item root read in both
 * versions. Kept: `cp:ResourcesDType`, `cp:FileDType` and `cp:ManifestMetadataDType`, 3.0.1's
 * alone, which a 3.0.0 manifest once had refused under `xsi-type` rather than read as unknown
 * (GEN-B's XSD search, 2026-11-07).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { Effect, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { expandedNameOf, noType, typeHandle } from "#pantry/grammar/xsi.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { loadXsd } from "#pantry/test/gen/grammar.ts";
import { rootsOf } from "#pantry/test/lexical-harness.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { asiNamespace, xsiNamespace, xsNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 43.7 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 300_000;

/**
 * Whether the XSD cache holds every pin.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The composed grammar.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The grammar shred reads through.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The types each version's kept cases name in 3.0.1 alone.
 */
const kept = ["cp:ResourcesDType", "cp:FileDType", "cp:ManifestMetadataDType"] as const;

/**
 * Whether a handle names one of XML Schema's built-ins, which every version holds.
 *
 * @param handle - The type's handle.
 * @returns Whether it does.
 */
const isBuiltIn = (handle: string): boolean =>
  Option.exists(expandedNameOf(handle), ({ namespace }) => namespace === xsNamespace);

/**
 * Read the named types a version's pinned XSDs declare, by the test's own reader, as handles.
 *
 * @param version - The version.
 * @returns The handles.
 */
const declaredIn = Effect.fn("test.declaredIn")(function* declaredIn(version: SchemaVersion) {
  const handles = new Set<string>();
  for (const root of rootsOf(version)) {
    const { set } = yield* loadXsd(root);
    for (const key of set.types.keys()) {
      handles.add(
        typeHandle({
          local: key.slice(key.indexOf("}") + 1),
          namespace: key.slice(1, key.indexOf("}")),
        }),
      );
    }
  }

  return handles;
});

/**
 * Read an item root whose `xsi:type` names a type, in a version, and say whether the codec found
 * the name a type of no pinned schema of the version.
 *
 * @param handle - The type's handle.
 * @param version - The version.
 * @returns Whether the codec refused it as `type-unknown`.
 */
const unknownIn = Effect.fn("test.unknownIn")(function* unknownIn(
  handle: string,
  version: SchemaVersion,
) {
  const { local, namespace } = Option.getOrThrow(expandedNameOf(handle));
  const text = `<qti-assessment-item xmlns="${asiNamespace}" xmlns:xsi="${xsiNamespace}" xmlns:t="${namespace}" xsi:type="t:${local}"/>`;
  const document = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
  const outcome = yield* Effect.result(shred(document, version, shredGrammar));

  return (
    Result.isFailure(outcome) &&
    outcome.failure._tag === "UnmodeledVocabulary" &&
    outcome.failure.reason === "type-unknown"
  );
});

describe.skipIf(!cached)("xsi:type names by version", () => {
  layer(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))("the pinned XSDs", (it) => {
    it.effect(
      "a version defines exactly the types its pinned XSDs declare, built-ins in both, and the codec reads a name of the other version alone as unknown",
      () =>
        Effect.gen(function* checkVersions() {
          const declared = new Map<SchemaVersion, ReadonlySet<string>>();
          for (const version of schemaVersions) {
            declared.set(version, yield* declaredIn(version));
          }

          const handles = grammar.xsi.typeName.handles.filter((handle) => handle !== noType);
          const lookup: string[] = [];
          for (const version of schemaVersions) {
            for (const handle of handles) {
              const expected = isBuiltIn(handle) || declared.get(version)?.has(handle) === true;
              if (grammar.xsi.definedIn(version, handle) !== expected) {
                lookup.push(`${version} ${handle}: defined ${String(!expected)}`);
              }
            }
          }

          const oneVersion = handles.filter(
            (handle) =>
              !isBuiltIn(handle) &&
              (declared.get("3.0.0")?.has(handle) === true) !==
                (declared.get("3.0.1")?.has(handle) === true),
          );
          const codec: string[] = [];
          for (const handle of oneVersion) {
            for (const version of schemaVersions) {
              const unknown = yield* unknownIn(handle, version);
              if (unknown === (declared.get(version)?.has(handle) === true)) {
                codec.push(`${version} ${handle}: ${unknown ? "unknown" : "resolved"}`);
              }
            }
          }

          assert.deepStrictEqual(
            kept.filter((handle) => !oneVersion.includes(handle)),
            [],
            "the kept types are 3.0.1's alone",
          );
          assert.deepStrictEqual(lookup, [], "each version defines exactly its XSDs' types");
          assert.deepStrictEqual(
            codec,
            [],
            "the codec reads a type of the other version alone as unknown, and its own as known",
          );
        }),
      { timeout: testTimeoutMs },
    );
  });
});
