/**
 * The author role: the one world qti-pie opens, holding every stored relation of `Qti` whole and
 * inserting into every one of them (plan §1.8), by Bjorn's ruling of 2026-11-10 that the author
 * role holds SELECT and INSERT only, no UPDATE and no DELETE.
 */
import { role, wholeEntriesOf, writableNamesOf } from "@bjornpagen/grizzle";
import { Qti } from "#pantry/qti/schema.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * The author role over `Qti`: a full role, holding every stored relation and every roster whole and
 * inserting into every stored relation. Its entries are grizzle's `wholeEntriesOf`, which leaves
 * out the closed relations, no role's entries: every law that reads one is the schema's, and holds
 * whoever writes. A roster has no view, and every query reads its handles as codes. Its insert list
 * is `writableNamesOf`, the stored relations in the schema's order, stated as `insert` in place of
 * `write`, so the role holds SELECT and INSERT on them and no UPDATE or DELETE anywhere: each
 * package is inserted once, a direct UPDATE or DELETE through the role is 42501, and a ChangeSet of
 * it that would update or delete is refused when it compiles (`OutsideRole`, kind `insert`).
 *
 * Grizzle puts a role in one login only: the author login holds this one (`#pantry/qti/logins.ts`
 * `AuthorApp`). An application that wants the role in a login of its own declares its own role over
 * `Qti`, `role(Qti, "author", wholeEntriesOf(Qti), { insert: writableNamesOf(Qti) })`.
 */
export const Author = role(Qti, "author", wholeEntriesOf(Qti), { insert: writableNamesOf(Qti) });

/**
 * The author role, the type of {@link Author}.
 */
export type AuthorRole = typeof Author;

/**
 * {@link Author}, under the name earlier installs called to build it over their `Qti`: `Qti` is one
 * schema now, so there is one author role over it.
 *
 * @param _qti - `Qti`.
 * @returns {@link Author} .
 */
export const authorRoleOf = (_qti: QtiSchema): AuthorRole => Author;
