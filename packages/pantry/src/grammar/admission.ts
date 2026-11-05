/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * `Admission`: which child kinds each parent kind admits in each schema version, and what each
 * admitted child is under its parent (fin.md §17, R1 of the W1 to W4 review).
 *
 * One relation, keyed by (version, parent, child), `ChildGrammar` in review U4's terms: its payload
 * is the child's position in its parent's content model, the Glushkov position every content law
 * reads, so what is admitted and where it stands are one fact.
 */
import { Schema } from "effect";
import type { Result } from "effect";
import { closed, idField } from "#pantry/grammar/closed.ts";
import type {
  Closed,
  ClosedRelationError,
  IdField,
  Roster,
  Sourced,
} from "#pantry/grammar/closed.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

/**
 * One admitted (version, parent, child) triple, as a vocabulary states it.
 */
export interface AdmittedChild {
  readonly child: string;
  readonly parent: string;
  readonly version: SchemaVersion;
}

/**
 * The key of `Admission`: the version, then the parent's kind, then the child's.
 */
export type AdmissionKey = readonly [
  IdField<"version", SchemaVersion>,
  IdField<"parent", string>,
  IdField<"child", string>,
];

/**
 * `Admission`'s key set: the admitted triples alone.
 */
export type AdmissionKeys = Closed<AdmissionKey, readonly []>;

/**
 * The payload of `Admission`: the child's position in its parent's content model (`content.ts`), 0
 * for a child whose kind names no position or several.
 */
export type AdmissionPayload = readonly [IdField<"position", string>];

/**
 * `Admission`.
 */
export type Admission = Sourced<AdmissionKey, AdmissionPayload>;

/**
 * A law names a child its parent does not admit, so the law states nothing about it.
 */
export class UnadmittedChild extends Schema.TaggedError<UnadmittedChild>()("UnadmittedChild", {
  child: Schema.String,
  parent: Schema.String,
  source: Schema.String,
  versions: Schema.String,
}) {
  /**
   * The law, the child, the parent and versions, and the repair.
   */
  override get message(): string {
    return `${this.source} names ${this.child} under ${this.parent} in ${this.versions}, which ${this.parent} does not admit there, so the law states nothing about it. Correct the kind, admit ${this.child} under ${this.parent}, or drop the versions it is not admitted in.`;
  }
}

/**
 * Construct `Admission`'s key set from every vocabulary's admitted triples. A triple two
 * vocabularies both state is a `KeyCollision`: each fact has one statement.
 *
 * @param input - The rosters and the triples.
 * @param input.versions - The `SchemaVersion` roster.
 * @param input.kinds - The `NodeKind` roster, for both parent and child.
 * @param input.rows - The triples.
 * @returns The key set, or the first triple no constant can hold.
 */
export const admissionKeysOf = (input: {
  readonly kinds: Roster<string>;
  readonly rows: readonly AdmittedChild[];
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<AdmissionKeys, ClosedRelationError> =>
  closed({
    key: [
      idField("version", input.versions),
      idField("parent", input.kinds),
      idField("child", input.kinds),
    ],
    name: "Admission",
    payload: [],
    rows: input.rows,
  });
