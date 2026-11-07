/**
 * The kinds whose `label` asks for the tool that labelled it (spec reading 128), read from the
 * types the ASI XSDs declare.
 *
 * The information model states the sentence "If an item uses labels then values for the associated
 * toolName and toolVersion characteristics must also be provided" in the description of one
 * `label` characteristic per class, and of no other: BasePromptInteraction's, the six of the
 * BaseSequence family and ItemBody's, in both versions, and QTI 3.0.1's AssessmentItem's (§4.1.3).
 * The other classes that declare a `label` describe it as text for a reader and ask for nothing:
 * AssessmentItem's in 3.0.0 and AssessmentStimulus's ("A human readable label", §4.1.3 and §4.3.3),
 * ItemFileInfo's ("A human readable label/short description for the file", §5.80.2) and
 * PrintedVariable's (one "appropriate for a tooltip", §7.30.4). Each label is read by its own
 * characteristic's description, so a kind's label asks for its tool exactly when the kind's
 * declared type is, or derives from, a type whose label states the sentence.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_BaseSequence.Attr_label | QTI 3.0 information model, 5.16.5 label}
 */
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { typeHandle } from "#pantry/grammar/xsi.ts";
import type { TypeDerivation } from "#pantry/vocab/inventory/types.ts";
import { asiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The ASI types whose `label` characteristic states the tool sentence, each with the section of
 * both information models that states it.
 */
export const toolLabelTypes = [
  { section: "5.15.5", type: "BasePromptInteractionDType" },
  { section: "5.16.5", type: "BaseSequenceDType" },
  { section: "5.17.5", type: "BaseSequenceEmptyDType" },
  { section: "5.18.5", type: "BaseSequenceFullDType" },
  { section: "5.19.5", type: "BaseSequenceRIdentDType" },
  { section: "5.20.5", type: "BaseSequenceXBaseDType" },
  { section: "5.21.5", type: "BaseSequenceXBaseEmptyDType" },
  { section: "5.79.4", type: "ItemBodyDType" },
] as const;

/**
 * The kinds whose `label` asks for its tool: each version's, and every version's at once.
 */
export interface ToolLabelKinds<K extends string> {
  /**
   * Each version's kinds, in roster order.
   */
  readonly byVersion: ReadonlyMap<SchemaVersion, readonly K[]>;
  /**
   * The kinds a version holds, in roster order. A kind of one version's list and not another's
   * declares no `label` in the other, so a selection by kind alone reads the labels each
   * version's list reads (`labels.test.ts`).
   */
  readonly kinds: readonly K[];
}

/**
 * Find the kinds whose declared type is one of {@link toolLabelTypes} or derives from one.
 *
 * A kind's governing type under `xsi:type` is validly derived from its declared type (XML Schema
 * 1.0 Part 1, cvc-elt.4.3), so it derives from the same base and its label asks for the same.
 *
 * @param input - The composition's types.
 * @param input.declaredType - The type each kind declares in each version, as `xsi.ts` reads it.
 * @param input.derivations - The named types validly derived from each type, per version.
 * @param input.kinds - The kinds, in roster order.
 * @returns The kinds, per version and at once.
 */
export const toolLabelKindsOf = <K extends string>(input: {
  readonly declaredType: (version: SchemaVersion, kind: K) => string;
  readonly derivations: readonly TypeDerivation[];
  readonly kinds: readonly K[];
}): ToolLabelKinds<K> => {
  const byVersion = new Map(
    schemaVersions.map((version) => {
      const types = new Set(
        input.derivations
          .filter(
            ({ type, versions }) =>
              versions.includes(version) &&
              type.namespace === asiNamespace &&
              toolLabelTypes.some((held) => held.type === type.local),
          )
          .flatMap(({ derived }) => derived.map(typeHandle)),
      );

      return [
        version,
        input.kinds.filter((kind) => types.has(input.declaredType(version, kind))),
      ] as const;
    }),
  );

  return {
    byVersion,
    kinds: input.kinds.filter((kind) =>
      [...byVersion.values()].some((held) => held.includes(kind)),
    ),
  };
};
