/**
 * The login that opens a connection: the author application, over the author role, with the export
 * scan as its workload.
 *
 * The import is no program of its workload: a family member is written from an array or a Stream,
 * never from a query or a parameter, so `importPackage` sends a ChangeSet built per package (the W5
 * amendment's C19).
 */
import { login, workload } from "@bjornpagen/grizzle";
import { documentScan, documentsOf, entriesOf } from "#pantry/export/scan.ts";
import { Author } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The author application's workload: one document's ordered scan, the documents of a package and
 * a package's record, each compiled once when the login's `DbLayer` is built, its access paths
 * earning their indexes (the W5 amendment's C20).
 */
export const exportWork = workload(Author, { documentScan, documentsOf, entriesOf });

/**
 * The author application's login, `qti__author_app` on the cluster. Its name is the one every
 * earlier installation used, so a migration from scratch needs no `--rename @…`.
 */
export const AuthorApp = login(Qti, "author_app", [Author], { workload: [exportWork] });
