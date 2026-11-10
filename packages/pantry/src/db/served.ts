/**
 * The author login's served workload, as this package's runtime opens it: the file `grizzle
 * generate` commits for the login, `migrations/qti/served/author_app.json`, read from disk and
 * served as the login's type, so the layer and every `Db.open` hold one value and no schema module
 * is evaluated.
 */
import type { ServedLogin } from "@bjornpagen/grizzle/runtime";
import { Context, Schema } from "effect";
import { fileURLToPath } from "node:url";
import type { AuthorAppLogin } from "#pantry/qti/logins.ts";

/**
 * The author login's served file could not be read from disk or is no JSON. The usual cause is a
 * checkout made without git-lfs, which leaves a pointer file where a committed migration file
 * belongs, or an install whose own grizzle config has not generated it.
 */
export class ServedLoadError extends Schema.TaggedError<ServedLoadError>()("ServedLoadError", {
  path: Schema.String,
  reason: Schema.Unknown,
}) {
  /**
   * The file, why that is likely, and the commands that fix it.
   */
  override get message(): string {
    return `Cannot read the author login's served workload at ${this.path}. Without git-lfs a committed migration file checks out as a pointer file: run \`git lfs pull\` in the checkout that holds it. Where GR8DES_QTI_INSTALL names an install, run \`grizzle generate\` with the install's own grizzle config, which writes the file into the install's migrations folder.`;
  }
}

/**
 * The author login's committed served file's path in this checkout, which exists once `grizzle
 * generate` has run.
 *
 * Importing this module reads nothing: the layer reads the file (`#pantry/db/layer.ts`).
 */
export const servedPath: string = fileURLToPath(
  import.meta.resolve("#migrations/qti/served/author_app.json"),
);

/**
 * The served file's text as the JSON value grizzle's `served` takes, which grizzle reads whole and
 * checks against the login's name when the layer is built.
 */
export const ServedText = Schema.fromJsonString(Schema.Json);

/**
 * The author login, served from its committed file (grizzle's `served`): the one value the layer is
 * built over and every `Db.open` takes its role from, as `Db.open(login.roles.author, {})`.
 * `#pantry/db/layer.ts` provides it beside the login's `DbLayer`, read from the file the install
 * names, so its roles are the layer's own.
 */
export class AuthorLogin extends Context.Service<AuthorLogin, ServedLogin<AuthorAppLogin>>()(
  "pantry/db/AuthorLogin",
) {}
