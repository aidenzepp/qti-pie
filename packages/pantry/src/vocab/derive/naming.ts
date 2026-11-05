/**
 * The handles of the elements an XSD declares with more than one type: one naming decision per
 * (namespace, element, type), stated once, which every derivation reads.
 *
 * An element declared with one type is the kind of its handle prefix and local name, so it needs
 * no entry here. An element of several types is one kind per type, and which kind a particle
 * stands for follows the type the particle declares, never the parent it sits under: a kind is
 * its element and its type. The handle names the element and, after a dot, its type in lower camel
 * case, shortened (`qti-content-body.rubric` is `RubricBlockContentBodyDType`); one type of an
 * element may keep the plain handle (`qti-feedback-block` is `FeedbackBlockDType`).
 *
 * A type is named as each version's XSD names it: the 3.0 content-packaging XSD writes
 * `FileMetadata.Type` where 3.0.1 writes `FileMetadataDType`, and both are `cp:metadata.file`.
 */
import { Option } from "effect";
import { asiNamespace, cpNamespace, vocabularyNamespaces } from "#pantry/vocab/namespaces.ts";

/**
 * One naming decision: the handle of an element of one of its types, by the names the versions'
 * XSDs give that type.
 */
export interface TypedHandle {
  readonly element: string;
  readonly handle: string;
  readonly namespace: string;
  readonly types: readonly [string, ...string[]];
}

/**
 * State the decisions of one namespace.
 *
 * @param namespace - The elements' namespace.
 * @param decisions - Each handle with its element and the names its type goes by.
 * @returns The decisions.
 */
const decided = (
  namespace: string,
  decisions: Readonly<Record<string, readonly [element: string, type: string, ...also: string[]]>>,
): readonly TypedHandle[] =>
  Object.entries(decisions).map(([handle, [element, type, ...also]]) => ({
    element,
    handle,
    namespace,
    types: [type, ...also],
  }));

/**
 * Every naming decision, by namespace.
 */
export const typedHandles: readonly TypedHandle[] = [
  ...decided(asiNamespace, {
    "qti-content-body.feedback": ["qti-content-body", "FeedbackContentBodyDType"],
    "qti-content-body.modal": ["qti-content-body", "FeedbackFlowContentBodyDType"],
    "qti-content-body.rubric": ["qti-content-body", "RubricBlockContentBodyDType"],
    "qti-content-body.rubricTemplate": [
      "qti-content-body",
      "RubricBlockTemplateBlockContentBodyDType",
    ],
    "qti-content-body.template": ["qti-content-body", "TemplateBlockContentBodyDType"],
    "qti-content-body.testFeedback": ["qti-content-body", "TestFeedbackFlowContentBodyDType"],
    "qti-content-body.testRubric": ["qti-content-body", "TestRubricBlockContentBodyDType"],
    "qti-feedback-block": ["qti-feedback-block", "FeedbackBlockDType"],
    "qti-feedback-block.template": ["qti-feedback-block", "TemplateBlockFeedbackBlockDType"],
    "qti-file-href": ["qti-file-href", "FileHrefDType"],
    "qti-file-href.card": ["qti-file-href", "FileHrefCardDType"],
    "qti-major-increment.radialSI": ["qti-major-increment", "RadialSIValueDType"],
    "qti-major-increment.radialUS": ["qti-major-increment", "RadialUSValueDType"],
    "qti-major-increment.siLinear": ["qti-major-increment", "SILinearValueDType"],
    "qti-major-increment.usLinear": ["qti-major-increment", "USLinearValueDType"],
    "qti-minor-increment.radialSI": ["qti-minor-increment", "RadialSIValueDType"],
    "qti-minor-increment.radialUS": ["qti-minor-increment", "RadialUSValueDType"],
    "qti-minor-increment.siLinear": ["qti-minor-increment", "SILinearValueDType"],
    "qti-minor-increment.usLinear": ["qti-minor-increment", "USLinearValueDType"],
    "qti-rubric-block": ["qti-rubric-block", "RubricBlockDType"],
    "qti-rubric-block.test": ["qti-rubric-block", "TestRubricBlockDType"],
    "qti-template-block": ["qti-template-block", "TemplateBlockDType"],
    "qti-template-block.rubric": ["qti-template-block", "RubricBlockTemplateBlockDType"],
    "qti-template-inline": ["qti-template-inline", "TemplateInlineDType"],
    "qti-template-inline.rubric": ["qti-template-inline", "RubricBlockTemplateInlineDType"],
  }),
  ...decided(cpNamespace, {
    "cp:metadata.file": ["metadata", "FileMetadataDType", "FileMetadata.Type"],
    "cp:metadata.manifest": ["metadata", "ManifestMetadataDType", "ManifestMetadata.Type"],
    "cp:metadata.resource": ["metadata", "ResourceMetadataDType", "ResourceMetadata.Type"],
  }),
  ...decided(vocabularyNamespaces.lom.namespace, {
    "lom:duration": ["duration", "Duration.Type"],
    "lom:duration.string": ["duration", "CharacterString.Type"],
    "lom:entry": ["entry", "CharacterString.Type"],
    "lom:entry.langString": ["entry", "LangString.Type"],
    "lom:source": ["source", "CharacterString.Type"],
    "lom:source.langString": ["source", "LangString.Type"],
  }),
];

/**
 * The key of a naming decision.
 *
 * @param namespace - The element's namespace.
 * @param element - Its local name.
 * @param type - Its type's name.
 * @returns The key no other decision shares.
 */
const keyOf = (namespace: string, element: string, type: string): string =>
  `{${namespace}}${element} ${type}`;

/**
 * The decisions by namespace, element and type.
 */
const decisions: ReadonlyMap<string, string> = new Map(
  typedHandles.flatMap(({ element, handle, namespace, types }) =>
    types.map((type) => [keyOf(namespace, element, type), handle] as const),
  ),
);

/**
 * The elements a decision names, by namespace and local name.
 */
const decidedElements: ReadonlySet<string> = new Set(
  typedHandles.map(({ element, namespace }) => `{${namespace}}${element}`),
);

/**
 * Look up the handle a decision gives an element of one type.
 *
 * @param namespace - The element's namespace.
 * @param element - Its local name.
 * @param type - Its type's name.
 * @returns The handle, `None` when no decision names the element of that type.
 */
export const decidedHandleOf = (
  namespace: string,
  element: string,
  type: string,
): Option.Option<string> => Option.fromNullishOr(decisions.get(keyOf(namespace, element, type)));

/**
 * Whether a decision names an element of some type, so that every type of it must be decided.
 *
 * @param namespace - The element's namespace.
 * @param element - Its local name.
 * @returns Whether {@link typedHandles} names it.
 */
export const isDecided = (namespace: string, element: string): boolean =>
  decidedElements.has(`{${namespace}}${element}`);
