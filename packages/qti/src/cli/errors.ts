/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { Schema } from "effect";

/**
 * The path the person named is not there, or is neither a directory nor a `.zip` file.
 */
export class NotADirectory extends Schema.TaggedError<NotADirectory>()("NotADirectory", {
  path: Schema.String,
}) {
  /**
   * The path and what to do about it.
   */
  override get message(): string {
    return `${this.path} is not a directory or a .zip file. Name the directory of an unzipped QTI package, or its .zip file.`;
  }
}

/**
 * A round trip whose export differs from its source in at least one entry.
 */
export class RoundtripDiffers extends Schema.TaggedError<RoundtripDiffers>()("RoundtripDiffers", {
  differing: Schema.Number,
  exportDir: Schema.String,
}) {
  /**
   * How many entries differ and where the export is, for comparing by hand.
   */
  override get message(): string {
    return `${this.differing} entries differ between the package and its export in ${this.exportDir}.`;
  }
}
