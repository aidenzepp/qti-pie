/**
 * The public surface of `@qti-pie/plate`, published through the `exports` map in `package.json`:
 * the pure functions an author calls, the native-form helpers, their types and their errors.
 *
 * Nothing else under `src/` is reachable from outside the package. The tests' seam
 * (`acceptForTest`) and the redacted item's brand constructor (`brandRedacted`) are never exported
 * here, so only `check` makes an `Accepted` and only `redact` a `Redacted`.
 *
 * @module
 */
export type { StoredRecord } from "#plate/codec/record.ts";

export { InvalidRecord } from "#plate/codec/record.ts";

export type { Configuration } from "#plate/configuration.ts";

export { configure, InvalidConfiguration } from "#plate/configuration.ts";

export type { StatusInput } from "#plate/emit/item.ts";

export type { Element, Node } from "#plate/emit/node.ts";

export { h } from "#plate/emit/node.ts";

export type { PartOverrides } from "#plate/emit/parts.ts";

export { UnknownPart } from "#plate/emit/parts.ts";

export { PartSwapRefused } from "#plate/emit/swap.ts";

export type { EngineFailure } from "#plate/engine/evaluate.ts";

export {
  OutcomeMismatchError,
  UnknownIdentifierError,
  UnmappedResponseError,
} from "#plate/engine/evaluate.ts";

export type { Entry, InstanceRequirement } from "#plate/form/encoding.ts";

export {
  checkInstance,
  decode,
  encode,
  entryName,
  Malformed,
  partition,
} from "#plate/form/encoding.ts";

export type { Value } from "#plate/model/values.ts";

export type { Redacted, ValidationMessage } from "#plate/payload.ts";

export type { Options, Rendered } from "#plate/render.ts";

export { InvalidInstance, redact, render, renderStatus } from "#plate/render.ts";

export {
  checkResponses,
  InvalidResponses,
  RecordMismatch,
  ResponsesRefused,
  score,
} from "#plate/score.ts";

export type { Accepted, Verdict } from "#plate/validate/verdict.ts";
