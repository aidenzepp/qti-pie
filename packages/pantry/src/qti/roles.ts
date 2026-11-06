/**
 * The author role: the one world qti-pie opens, holding every stored relation of `Qti` whole and
 * writing every one of them (plan §1.8; the W5 amendment's A, the privilege ruling).
 */
import { role } from "@bjornpagen/grizzle";
import type { AnyRelation, AnyRoster } from "@bjornpagen/grizzle";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * `Qti`'s members, by name.
 */
type Members = typeof Qti.relations;

/**
 * The names of the members a role may hold whole: the stored relations and the rosters.
 */
type EntryName = {
  readonly [Name in keyof Members]: Members[Name] extends AnyRelation | AnyRoster ? Name : never;
}[keyof Members];

/**
 * The names of `Qti`'s stored relations.
 */
type StoredName = {
  readonly [Name in keyof Members]: Members[Name] extends AnyRelation ? Name : never;
}[keyof Members];

/**
 * `Qti`'s members that a role holds whole, each under its own name: every stored relation and every
 * roster. A closed relation is no entry of a role (grizzle's `EntryValue`): every law that reads
 * one is the schema's, and holds whoever writes. A roster has no view, and every query reads its
 * handles as codes.
 */
// SAFETY: the entries are the members of `Qti.relations` whose kind is a relation's or a roster's, each under its own key, which is `Pick<Members, EntryName>`.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
const entries = Object.fromEntries(
  Object.entries(Qti.relations).filter(([, member]) => member.kind !== "closedRelation"),
) as Pick<Members, EntryName>;

/**
 * The names of `Qti`'s stored relations, every one of which the author role writes.
 */
// SAFETY: the names are the keys of `Qti.relations` whose member's kind is a relation's, which is `StoredName`.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
export const storedNames = Object.entries(Qti.relations).flatMap(([name, member]) =>
  member.kind === "relation" ? [name] : [],
) as readonly StoredName[];

/**
 * The author role: every stored relation of `Qti` and every roster, whole, writing every stored
 * relation. No relation is `mutable`, so the role holds no UPDATE: each package is inserted once.
 */
export const Author = role(Qti, "author", entries, { write: storedNames });
