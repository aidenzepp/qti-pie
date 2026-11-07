/**
 * The author role: the one world qti-pie opens, holding every stored relation of `Qti` whole and
 * writing every one of them (plan §1.8; the W5 amendment's A, the privilege ruling).
 */
import { role, wholeEntriesOf, writableNamesOf } from "@bjornpagen/grizzle";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The author role: a full role over `Qti`, holding every stored relation and every roster whole
 * and writing every stored relation. Its entries are grizzle's `wholeEntriesOf(Qti)`, which leaves
 * out the closed relations, no role's entries: every law that reads one is the schema's, and holds
 * whoever writes. A roster has no view, and every query reads its handles as codes. Its write list
 * is `writableNamesOf(Qti)`, the stored relations in the schema's order. No relation is `mutable`,
 * so the role holds no UPDATE: each package is inserted once.
 */
export const Author = role(Qti, "author", wholeEntriesOf(Qti), { write: writableNamesOf(Qti) });
