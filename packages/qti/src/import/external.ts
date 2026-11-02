/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The external-metadata refusal; `recordFile` and `externalRows` arrive with p4-33.
 */
import { Schema } from "effect";

/**
 * An external metadata file could not be recorded.
 *
 * `detail` says which record was left unnamed.
 */
export class ExternalRefusal extends Schema.TaggedError<ExternalRefusal>()("ExternalRefusal", {
  detail: Schema.String,
  rule: Schema.Literals(["record-unnamed"]),
}) {}
