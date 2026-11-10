/**
 * The author role: the one world qti-pie opens, holding every stored relation of `Qti` whole and
 * writing every one of them (plan §1.8; the W5 amendment's A, the privilege ruling).
 */
import { role, wholeEntriesOf, writableNamesOf } from "@bjornpagen/grizzle";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build the author role over a `Qti` schema: a full role, holding every stored relation and every
 * roster whole and writing every stored relation. Its entries are grizzle's `wholeEntriesOf`,
 * which leaves out the closed relations, no role's entries: every law that reads one is the
 * schema's, and holds whoever writes. A roster has no view, and every query reads its handles as
 * codes. Its write list is `writableNamesOf`, the stored relations in the schema's order. No
 * relation is `mutable`, so the role holds no UPDATE: each package is inserted once.
 *
 * Each call builds a role of its own, and grizzle puts a role in one login only, so the author
 * login builds it (`#pantry/qti/logins.ts` `authorAppOf`) and every reader takes it from there.
 *
 * @param qti - The `Qti` schema, built for an install's policy or none
 *   (`#pantry/qti/schema.ts` `qtiSchema`).
 * @returns The role.
 */
export const authorRoleOf = (qti: QtiSchema) =>
  role(qti, "author", wholeEntriesOf(qti), { write: writableNamesOf(qti) });

/**
 * The author role, over whatever schema it was built.
 */
export type AuthorRole = ReturnType<typeof authorRoleOf>;
