/**
 * `labels.ts`'s free tests: over every kind of the composition in each version, the kinds whose
 * `label` asks for its tool are exactly the kinds whose `label` the pinned ASI XSD declares inside
 * one of the types whose characteristic states the tool sentence, and one list selects each
 * version's.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Layer, Result } from "effect";
import { Digest } from "effect/crypto";
import type { Element } from "@qti-pie/crust/tree.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { toolLabelKindsOf } from "#pantry/grammar/labels.ts";
import { checkCache, readPlaced } from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { typeDerivations } from "#pantry/vocab/inventory/models.ts";

/**
 * The composed grammar whose kinds and declared types the tests read.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The kinds in each version, per version, whose `label` asks for its tool.
 */
const derived = toolLabelKindsOf({
  declaredType: grammar.xsi.declaredType,
  derivations: typeDerivations,
  kinds: grammar.kinds.nodeKind.handles,
});

/**
 * The pinned ASI XSD of each version.
 */
const asiXsd: Readonly<Record<SchemaVersion, SourcePath>> = {
  "3.0.0": "imsqti_asiv3p0_v1p0.xsd",
  "3.0.1": "imsqti_asiv3p0p1_v1p0.xsd",
};

/**
 * The ASI types whose `label` characteristic's description states the tool sentence, as the oracle
 * reads the information model's text, section by section, apart from `labels.ts`'s list:
 * BasePromptInteraction (§5.15.5), the six of the BaseSequence family (§5.16.5 to §5.21.5) and
 * ItemBody (§5.79.4).
 */
const sentenceTypes: ReadonlySet<string> = new Set([
  "BasePromptInteractionDType",
  "BaseSequenceDType",
  "BaseSequenceEmptyDType",
  "BaseSequenceFullDType",
  "BaseSequenceRIdentDType",
  "BaseSequenceXBaseDType",
  "BaseSequenceXBaseEmptyDType",
  "ItemBodyDType",
]);

/**
 * Whether every pinned XSD is in the shared cache, so the tests that read the XSD's source lines
 * can run.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * Map the start line of each `xs:attribute name="label"` of an XSD to the named complex type it is
 * declared in, by walking the tree in the order its start lines are counted.
 *
 * @param root - The schema's root element.
 * @param lines - The start line of each element, in document order.
 * @returns Each label declaration's line, with its complex type's name.
 */
const labelOwnersOf = (root: Element, lines: readonly number[]): ReadonlyMap<number, string> => {
  const owners = new Map<number, string>();
  let at = 0;
  /**
   * Visit an element and its descendants in document order, each taking the next start line.
   *
   * @param element - The element.
   * @param owner - The named complex type it stands in, empty outside one.
   */
  const walk = (element: Element, owner: string) => {
    const line = lines[at] ?? 0;
    at += 1;
    const named = element.attributes.find(({ local }) => local === "name")?.value ?? "";
    const own = element.local === "complexType" && named !== "" ? named : owner;
    if (element.local === "attribute" && named === "label") {
      owners.set(line, owner);
    }

    for (const child of element.children) {
      if (child.kind === "element") {
        walk(child, own);
      }
    }
  };
  walk(root, "");

  return owners;
};

describe("grammar/labels.ts, the kinds whose label asks for its tool", () => {
  it("select, by kind alone across the versions, the labels each version's list selects", () => {
    // Oracle: each version's own list over the kinds that declare a label in that version.
    // Bound: every kind of the union, in each version where it declares a label.
    for (const version of schemaVersions) {
      const bearing = new Set(
        attributeDeclarations
          .filter(({ name, versions }) => name === "label" && versions.includes(version))
          .map(({ kind }) => kind),
      );

      assert.deepStrictEqual(
        derived.kinds.filter((kind) => bearing.has(kind)),
        derived.byVersion.get(version),
        version,
      );
    }
  });
});

/**
 * The timeout, in milliseconds, for reading both versions' ASI XSDs, each hashed against its pin
 * and parsed whole: 20 s on 2026-11-06 at a load of about 40, so twice that and a margin.
 */
const xsdTimeoutMs = 60_000;

describe.skipIf(!cached)(
  "grammar/labels.ts, against the pinned XSD",
  { timeout: xsdTimeoutMs },
  () => {
    it.effect(
      "are exactly the kinds whose label the pinned ASI XSD declares inside a type whose characteristic states the tool sentence",
      () =>
        // Oracle: the pinned XSD itself, the complex type each kind's `label` declaration stands in,
        // read from the declaration's own source line, which no type derivation is consulted for.
        // Bound: every label declaration of both versions' ASI XSDs, 12 types' each.
        Effect.gen(function* fromSourceLines() {
          for (const version of schemaVersions) {
            const placed = yield* readPlaced(asiXsd[version]);
            const owners = labelOwnersOf(placed.document.root, placed.lines);
            const named = attributeDeclarations.flatMap(({ kind, name, sources, versions }) => {
              const at = versions.indexOf(version);
              const source = sources[at];

              return name === "label" &&
                at !== -1 &&
                source?._tag === "xsd" &&
                source.file === asiXsd[version]
                ? [{ kind, owner: owners.get(source.line) ?? `line ${String(source.line)}` }]
                : [];
            });

            assert.deepStrictEqual(
              named
                .filter(({ owner }) => sentenceTypes.has(owner))
                .map(({ kind }) => kind)
                .toSorted(),
              [...(derived.byVersion.get(version) ?? [])].toSorted(),
              version,
            );
          }
        }).pipe(Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))),
    );
  },
);
