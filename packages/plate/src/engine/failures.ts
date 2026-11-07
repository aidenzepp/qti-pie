/**
 * The failures the engine returns, a leaf the evaluator, the reference resolver and the expression
 * families share: the rules name an identifier the item or the variables do not hold, set an
 * outcome to a value of another type, or map a response that has no mapping.
 *
 * Each is a failure the caller can cause, since the variables come from the record the host hands
 * back, so the engine returns it in a `Result` and never throws it. `#plate/engine/evaluate.ts`
 * re-exports all four, so the public entry and every other importer reach them there. The module
 * imports only `Data` from `effect`.
 *
 * @module
 */
import { Data } from "effect";

/**
 * The failure of a rule tree that names an identifier the item or the variables do not hold in the
 * role the rule reads it in: a variable or a mapped response with no value, a `qti-correct`, a
 * `qti-map-response` or a `qti-map-response-point` of no declared response, or a
 * `qti-set-outcome-value` of no declared outcome.
 *
 * In a valid item every identifier a rule names is declared, but the variables come from the record
 * the host hands back, which may lack a value, so the evaluator returns it. Its `holder` says which
 * of the two lacks the identifier, and the message names the one to fix.
 */
export class UnknownIdentifierError extends Data.TaggedError("UnknownIdentifierError")<{
  /**
   * What lacks the identifier: `"record"` when the variables, which come from the session record,
   * hold no value of it, and `"item"` when the item declares no modelled response or outcome by
   * that name.
   */
  readonly holder: "item" | "record";

  /**
   * The identifier the rule names.
   */
  readonly identifier: string;

  /**
   * What the rule reads the identifier as.
   */
  readonly role: "outcome" | "response" | "variable";
}> {
  /**
   * The identifier, the role it is read in, what lacks it, and what to pass instead, in one line.
   */
  override get message(): string {
    const identifier = JSON.stringify(this.identifier);

    return this.holder === "record"
      ? `The session record holds no value for ${identifier}, which the rules read as a ${this.role}: pass back, unchanged, the record score returned for this item, or none to start it afresh.`
      : `The rules read ${identifier} as a ${this.role}, and the item holds no ${this.role} by that name: run rules built from this item, with the variables its record holds.`;
  }
}

/**
 * The failure of a `qti-set-outcome-value` whose expression gives a value, not NULL, of a base type
 * or cardinality that differs from the outcome's declaration, which the evaluator returns.
 *
 * QTI assigns without conversion: "floating point values can not be assigned to integer variables
 * and vice-versa", and the expression's type must match the target's. A NULL is never checked: it
 * is the absence of a value, so it has no type to differ from the outcome's, and the outcome takes
 * its own NULL, of its declared base type and cardinality. The engine stores no value of another
 * type, so the record always holds each outcome at its declared type.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_SetValue
 */
export class OutcomeMismatchError extends Data.TaggedError("OutcomeMismatchError")<{
  /**
   * The base type and cardinality the expression gave.
   */
  readonly actual: string;

  /**
   * The base type and cardinality the outcome is declared with.
   */
  readonly expected: string;

  /**
   * The outcome's identifier.
   */
  readonly identifier: string;
}> {
  /**
   * The outcome, both types, and the expression to give it, in one line.
   */
  override get message(): string {
    return `The rules set ${JSON.stringify(this.identifier)}, declared ${this.expected}, to a ${this.actual} value: give its qti-set-outcome-value an expression of base type and cardinality ${this.expected}.`;
  }
}

/**
 * The failure of a `qti-map-response` whose response is declared without a `qti-mapping`, or of a
 * `qti-map-response-point` whose response is declared without a `qti-area-mapping`.
 *
 * QTI maps a response "using the associated mapping, which must have been declared", and a point
 * response through its "associated areaMapping"; the evaluator returns it.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponse
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponsePoint
 */
export class UnmappedResponseError extends Data.TaggedError("UnmappedResponseError")<{
  /**
   * The response's identifier.
   */
  readonly identifier: string;

  /**
   * The mapping the expression reads and the declaration lacks: `qti-mapping` for
   * `qti-map-response`, `qti-area-mapping` for `qti-map-response-point`.
   */
  readonly mapping: "qti-area-mapping" | "qti-mapping";
}> {
  /**
   * The response, the mapping it lacks and the two ways to score it, in one line.
   */
  override get message(): string {
    const expression =
      this.mapping === "qti-mapping" ? "qti-map-response" : "qti-map-response-point";

    return `The rules map the response ${JSON.stringify(this.identifier)}, and its declaration has no ${this.mapping}: give the declaration a ${this.mapping}, or score it without ${expression}.`;
  }
}

/**
 * A failure the engine returns: the rules name an identifier the item or the variables do not hold,
 * set an outcome to a value of another type, or map a response that has no mapping.
 */
export type EngineFailure = OutcomeMismatchError | UnknownIdentifierError | UnmappedResponseError;
