/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

import { Schema } from "effect";
import { fileURLToPath } from "node:url";

/**
 * The migrations snapshot could not be read from disk or is not the JSON this package expects of
 * it. The usual cause is a checkout made without git-lfs, which leaves a pointer file where the
 * snapshot belongs.
 */
export class SnapshotLoadError extends Schema.TaggedError<SnapshotLoadError>()(
  "SnapshotLoadError",
  { path: Schema.String, reason: Schema.Unknown },
) {
  /**
   * The file, why that is likely, and the command that fixes it.
   */
  override get message(): string {
    return `Cannot read the migrations snapshot at ${this.path}. Without git-lfs it checks out as a pointer file. Run \`git lfs pull\` in this checkout, then try again.`;
  }
}

/**
 * The committed migrations snapshot's path in this checkout, which exists only after the first
 * migration is generated.
 *
 * Importing this module reads nothing: the file is read by whoever needs it.
 */
export const snapshotPath: string = fileURLToPath(
  import.meta.resolve("#migrations/qti/snapshot.json"),
);

/**
 * The snapshot file's text as the JSON value `DbLayer.make` takes: an object with its `fingerprint`
 * and every other key kept, because grizzle parses the whole form itself.
 */
export const SnapshotText = Schema.fromJsonString(
  Schema.StructWithRest(Schema.Struct({ fingerprint: Schema.String }), [
    Schema.Record(Schema.String, Schema.Json),
  ]),
);
