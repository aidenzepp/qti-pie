/**
 * The author role: the one world qti-pie opens, holding every stored relation of `Qti` whole and
 * inserting into every one of them (plan §1.8), by Bjorn's ruling of 2026-11-10 that the author
 * role holds SELECT and INSERT only, no UPDATE and no DELETE.
 */
import { role, wholeEntriesOf, writableNamesOf } from "@bjornpagen/grizzle";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build the author role over a `Qti` schema: a full role, holding every stored relation and every
 * roster whole and inserting into every stored relation. Its entries are grizzle's
 * `wholeEntriesOf`, which leaves out the closed relations, no role's entries: every law that reads
 * one is the schema's, and holds whoever writes. A roster has no view, and every query reads its
 * handles as codes. Its insert list is `writableNamesOf`, the stored relations in the schema's
 * order, stated as `insert` in place of `write`, so the role holds SELECT and INSERT on them and no
 * UPDATE or DELETE anywhere: each package is inserted once, a direct UPDATE or DELETE through the
 * role is 42501, and a ChangeSet of it that would update or delete is refused when it compiles
 * (`OutsideRole`, kind `insert`).
 *
 * Each call builds a role of its own, and grizzle puts a role in one login only, so the author
 * login builds it (`#pantry/qti/logins.ts` `authorAppOf`) and every reader takes it from there.
 *
 * @param qti - The `Qti` schema, built for an install's policy or none
 *   (`#pantry/qti/schema.ts` `qtiSchema`).
 * @returns The role.
 */
export const authorRoleOf = (qti: QtiSchema) =>
  role(qti, "author", wholeEntriesOf(qti), { insert: writableNamesOf(qti) });

/**
 * The author role, over whatever schema it was built.
 */
export type AuthorRole = ReturnType<typeof authorRoleOf>;
