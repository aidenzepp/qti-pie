/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { Schema } from "effect";

/**
 * The parser refused the text because it is not well-formed XML.
 *
 * `line` and `column` give the position the parser reported, `message` says what it found there,
 * and `afterSubstitution` is true when an entity substitution preceded that position.
 */
export class WellFormednessError extends Schema.TaggedError<WellFormednessError>()(
  "WellFormednessError",
  {
    afterSubstitution: Schema.Boolean,
    column: Schema.Int,
    line: Schema.Int,
    message: Schema.String,
  },
) {}

/**
 * The reader refused the input under a named rule, with `detail` saying what in the input broke it.
 */
export class ReaderRefusal extends Schema.TaggedError<ReaderRefusal>()("ReaderRefusal", {
  detail: Schema.String,
  rule: Schema.Literals([
    "decode",
    "bare-utf16",
    "nul-or-surrogate",
    "undeclared-entity",
    "entity-cycle",
  ]),
}) {}

/**
 * The encoder could not write the document in the label it was given.
 *
 * `where` names the construct that cannot carry `codePoint`, whose value lies above `threshold`,
 * the highest code point the label's encoder class represents; `where: "label"` means the label
 * itself has no encoder and both numbers are 0.
 */
export class EncodeError extends Schema.TaggedError<EncodeError>()("EncodeError", {
  codePoint: Schema.Int,
  threshold: Schema.Int,
  where: Schema.Literals(["label", "name", "comment", "pi", "text", "attribute"]),
}) {}
