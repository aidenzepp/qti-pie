/**
 * The author role: the one world qti-pie opens, holding every stored relation of `Qti` whole and
 * writing every one of them. No relation of `Qti` is mutable, so a write is an insert or a delete,
 * never an update: a package is written once, and replaced as a set difference of its rows
 * (`replaceWrite` of `#pantry/qti/logins.ts`).
 */
import { role, wholeEntriesOf, writableNamesOf } from "@bjornpagen/grizzle";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The author role over `Qti`: a full role, holding every stored relation and every roster whole and
 * writing every stored relation. Its entries are grizzle's `wholeEntriesOf`, which leaves out the
 * closed relations, no role's entries: every law that reads one is the schema's, and holds whoever
 * writes. A roster has no view, and every query reads its handles as codes. Its write list is
 * `writableNamesOf`, the stored relations in the schema's order, so the role holds SELECT, INSERT
 * and DELETE on them, and no UPDATE, since no relation of `Qti` is mutable: a changed fact is
 * deleted and inserted again, and a direct UPDATE through the role is 42501.
 *
 * Grizzle puts a role in one login only: the author login holds this one (`#pantry/qti/logins.ts`
 * `AuthorApp`). An application that writes content beside rows of its own in one transaction
 * declares its own role over its own level, its write list `authorWrites` of
 * `#pantry/qti/logins.ts` beside its own relations.
 */
export const Author = role(Qti, "author", wholeEntriesOf(Qti), { write: writableNamesOf(Qti) });

/**
 * The author role, the type of {@link Author}.
 */
export type AuthorRole = typeof Author;
