/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The ZIP reader's refusal; `readZip` and `ZipEntry` arrive with p4-06.
 */
import { Schema } from "effect";

/**
 * A zip archive cannot be read as a package, under the named rule.
 *
 * `entry` is the archive entry concerned and `feature` the part of the format that was refused.
 */
export class ZipRefusal extends Schema.TaggedError<ZipRefusal>()("ZipRefusal", {
  entry: Schema.String,
  feature: Schema.String,
  rule: Schema.Literals(["manifest-root", "href-path", "zip-format"]),
}) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The zip entry ${this.entry} was refused under the ${this.rule} rule: ${this.feature}`;
  }
}
