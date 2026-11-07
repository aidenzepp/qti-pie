import { Data } from "effect";

/**
 * The parser refused the text because it is not well-formed XML.
 *
 * `line` and `column` give the position the parser reported, `message` says what it found there,
 * and `afterSubstitution` is true when an entity substitution preceded that position.
 */
export class WellFormednessError extends Data.TaggedError("WellFormednessError")<{
  readonly afterSubstitution: boolean;
  readonly column: number;
  readonly line: number;
  readonly message: string;
}> {}

/**
 * The reader refused the input under a named rule, with `detail` saying what in the input broke it.
 *
 * XML 1.0 section 4.3.3's encoding errors are three rules: `unsupported-encoding` for "an entity
 * with an encoding that it is unable to process", `decode` for an entity "determined ... to be in a
 * certain encoding but [that] contains byte sequences that are not legal in that encoding", and
 * `encoding-mismatch` for an entity "presented to the XML processor in an encoding other than that
 * named in the declaration".
 */
export class ReaderRefusal extends Data.TaggedError("ReaderRefusal")<{
  readonly detail: string;
  readonly rule:
    | "decode"
    | "unsupported-encoding"
    | "encoding-mismatch"
    | "nul"
    | "undeclared-entity"
    | "entity-cycle"
    | "entity-expansion"
    | "element-depth";
}> {}

/**
 * The encoder could not write the document in the label it was given.
 *
 * `where` names the construct that cannot carry `codePoint` (`"doctype"` is the doctype text, which
 * is source text where no character reference applies), whose value lies above `threshold`,
 * the highest code point the label's encoder class represents; `where: "label"` means the label
 * itself has no encoder and both numbers are 0.
 */
export class EncodeError extends Data.TaggedError("EncodeError")<{
  readonly codePoint: number;
  readonly threshold: number;
  readonly where: "label" | "doctype" | "name" | "comment" | "pi" | "text" | "attribute";
}> {}
