import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { xmlNamespace } from "#pantry/vocab/namespaces.ts";
import { loadXsd, resolverOf, XsdOracleLayer, xsdContents } from "#pantry/test/gen/grammar.ts";

/**
 * The composed grammar of production, whose kind resolution the walk reads kinds through.
 */
const grammar = Effect.fromResult(composed());

/**
 * Whether every pinned XSD is in the cache; without them the reader has nothing to read.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The two ASI schema sets, the only pinned ones whose kinds declare `xml:` attributes, with the
 * version each is read in.
 */
const schemas: readonly (readonly [SourcePath, SchemaVersion])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1"],
];

/**
 * The attributes `xml.xsd` declares in the XML namespace.
 */
const xmlAttributes: ReadonlySet<string> = new Set(["base", "id", "lang", "space"]);

/**
 * How long reading the two 18 MB ASI XSDs and walking them may take, beside the swarm's suites.
 * Measured 2026-11-07: 116.3 s at a load average of 75, under V8 coverage, and 39.6 s at 70 to 74
 * without it.
 */
const xsdTimeout = 240_000;

describe.skipIf(!cached)("the XSD reader's QNames", () => {
  it.effect(
    "reads the xml prefix as the XML namespace, so a kind declaring lang and xml:lang has two names",
    () =>
      // Oracle: Namespaces in XML 1.0 §3 binds `xml` with no declaration; and a second
      // implementation, the vocabulary deriver's attribute leaf, for which kinds declare both.
      Effect.gen(function* xmlPrefix() {
        const { kinds } = yield* grammar;
        for (const [root, version] of schemas) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, resolverOf(kinds));
          const both = new Set<string>();
          const strays: string[] = [];
          for (const [kind, models] of contents) {
            for (const { attributes } of models) {
              const qualified = attributes.filter(({ name }) => name.namespace === xmlNamespace);
              strays.push(
                ...qualified
                  .filter(({ name }) => !xmlAttributes.has(name.local))
                  .map(({ name }) => `${kind} ${name.local}`),
              );
              if (
                qualified.some(({ name }) => name.local === "lang") &&
                attributes.some(({ name }) => name.namespace === "" && name.local === "lang")
              ) {
                both.add(kind);
              }
            }
          }

          const declared = new Map<string, Set<string>>();
          for (const { kind, name, versions } of attributeDeclarations) {
            if (versions.includes(version)) {
              declared.set(kind, (declared.get(kind) ?? new Set()).add(name));
            }
          }

          const leaf = [...declared]
            .filter(([, names]) => names.has("lang") && names.has("xml:lang"))
            .map(([kind]) => kind);

          assert.isAbove(both.size, 0, root);
          assert.deepStrictEqual(strays, [], root);
          assert.deepStrictEqual([...both].toSorted(), leaf.toSorted(), root);
        }
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});
