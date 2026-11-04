/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * Which resources name a document by file: the file a `resourcemetadata/xml` resource names, and
 * the resource types the manifest import and the export comparison both read as documents.
 */
import { Effect, Option, Schema } from "effect";

/**
 * An external metadata file could not be recorded.
 *
 * `detail` says which record was left unnamed.
 */
export class ExternalRefusal extends Schema.TaggedError<ExternalRefusal>()("ExternalRefusal", {
  detail: Schema.String,
  rule: Schema.Literals(["record-unnamed"]),
}) {}

/**
 * Name the file that holds an external metadata record: the resource's `href`, else its one file.
 *
 * @param resource - The resource's `href` and the `href` of each file it lists.
 * @returns The path of the record, or `ExternalRefusal` when the resource has no `href` and does
 *   not list exactly one file.
 */
export const recordFile = (resource: {
  readonly files: readonly string[];
  readonly href: Option.Option<string>;
}): Effect.Effect<string, ExternalRefusal> => {
  if (Option.isSome(resource.href)) {
    return Effect.succeed(resource.href.value);
  }

  const [only, ...rest] = resource.files;
  if (only !== undefined && rest.length === 0) {
    return Effect.succeed(only);
  }

  return Effect.fail(
    new ExternalRefusal({
      detail: `the resource has no href and lists ${resource.files.length} files, so no file is named as its record; give it an href or list exactly one file`,
      rule: "record-unnamed",
    }),
  );
};

/**
 * The resource types whose `href` is read as a document beside the QTI ones: a record of metadata
 * and a record of usage data. A record of metadata with no `href` is named by {@link recordFile}
 * instead.
 */
export const recordTypes: ReadonlySet<string> = new Set([
  "resourcemetadata/xml",
  "qtiusagedata/xml",
]);

/**
 * The QTI document types that also name their one file when they have no `href`.
 */
export const soleFileTypes: ReadonlySet<string> = new Set([
  "imsqti_outcomes_xmlv3p0",
  "imsqti_resprocessing_xmlv3p0",
]);
