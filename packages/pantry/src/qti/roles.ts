/**
 * The author role: the one world qti-pie opens, holding every stored relation of `Qti` whole and
 * writing every one of them (plan §1.8; the W5 amendment's A, the privilege ruling), built over the
 * `Qti` schema value it is handed.
 */
import { role, wholeEntriesOf, writableNamesOf } from "@bjornpagen/grizzle";
import { Function as Fn } from "effect";
import type { QtiSchema } from "#pantry/qti/schema.ts";

/**
 * Build the author role over a `Qti` schema: a full role holding every stored relation and every
 * roster whole and writing every stored relation. Its entries are grizzle's `wholeEntriesOf(qti)`,
 * which leaves out the closed relations, no role's entries: every law that reads one is the
 * schema's, and holds whoever writes. A roster has no view, and every query reads its handles as
 * codes. Its write list is `writableNamesOf(qti)`, the stored relations in the schema's order. No
 * relation is `mutable`, so the role holds no UPDATE: each package is inserted once.
 *
 * Built once per schema value: grizzle puts a role in one login only, so the author login
 * (`#pantry/qti/logins.ts` `authorLogin`) and every caller that opens a `Db` or builds a ChangeSet
 * on it must hold this one value, never a second role of the same name.
 *
 * @param qti - The `Qti` schema the role is over (`#pantry/qti/schema.ts` `qti`).
 * @returns The author role.
 * @see https://github.com/bjornpagen/grizzle/blob/89e94c040262c587065e84df42829a2f12d9f0c3/README.md#L2097-L2105
 */
export const authorRole = Fn.memoize((qti: QtiSchema) =>
  role(qti, "author", wholeEntriesOf(qti), { write: writableNamesOf(qti) }),
);

/**
 * The author role {@link authorRole} builds, the role every author-side `Db`, `DbLayer` and
 * ChangeSet is typed by.
 */
export type AuthorRole = ReturnType<typeof authorRole>;
