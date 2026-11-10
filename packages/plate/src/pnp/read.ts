/**
 * The Personal Needs and Preferences reader, a stub module: {@link readPnp} reads an AfA PNP 3.0
 * document into the {@link Supports} a host passes `render` and `redact`. Until issue m4-01 fills
 * the module, every call dies with {@link PnpNotImplemented}, as every other stub step throws its
 * not-implemented defect, and never fails with {@link InvalidPnp}.
 *
 * It runs on the server, beside `open`: a browser module never imports it.
 *
 * @module
 */
import { Data, Effect, Schema } from "effect";
import type { Supports } from "#plate/supports.ts";

/**
 * Which record of a PNP document to read, when the document holds more than one: the record of an
 * appointment, of a person, or of both. With neither, the document must hold one record.
 */
export interface PnpSelector {
  /**
   * The appointment whose record is read.
   */
  readonly appointmentId?: string;
  /**
   * The person, by `sourcedId`, whose record is read.
   */
  readonly personSourcedId?: string;
}

/**
 * A PNP document `readPnp` cannot read into supports: its bytes are not readable XML
 * (`unreadable`), it is not a PNP document (`not-a-pnp`), the selector matches more than one
 * record (`ambiguous-record`), or it matches none (`unknown-record`). `detail` says what was found.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class InvalidPnp extends Schema.TaggedError<InvalidPnp>()("InvalidPnp", {
  detail: Schema.String,
  reason: Schema.Literals(["unreadable", "not-a-pnp", "ambiguous-record", "unknown-record"]),
}) {
  /**
   * The reason, what was found, and what to change.
   */
  override get message(): string {
    return `The PNP document cannot be read into supports (${this.reason}): ${this.detail}. Pass the bytes of one AfA PNP 3.0 document, with a selector that names exactly one of its records.`;
  }
}

/**
 * The defect a call of the stub {@link readPnp} dies with: the module is not implemented until
 * issue m4-01 lands it. It is never exported from `src/index.ts`.
 */
export class PnpNotImplemented extends Data.TaggedError("PnpNotImplemented") {
  /**
   * Which module ran, and what lands it.
   */
  // oxlint-disable-next-line eslint/class-methods-use-this -- The defect has no field: its message names the stub and its issue, nothing of the caller's bytes.
  override get message(): string {
    return "The PNP reader is a stub until issue m4-01 lands it, so readPnp reads no document. Build the Supports value by hand until then.";
  }
}

/**
 * Read a PNP document into the supports it asks for, a stub until issue m4-01 fills it.
 *
 * @param _bytes The document's bytes.
 * @param _selector Which of its records to read, when it holds more than one.
 * @returns An Effect that dies with {@link PnpNotImplemented}, whatever the bytes.
 */
export const readPnp = (
  _bytes: Uint8Array,
  _selector?: PnpSelector,
): Effect.Effect<Supports, InvalidPnp> => Effect.die(new PnpNotImplemented());
