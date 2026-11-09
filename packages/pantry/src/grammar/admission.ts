/**
 * `Admission`: which child kinds each parent kind admits in each schema version, and what each
 * admitted child is under its parent (fin.md §17, R1 of the W1 to W4 review).
 *
 * One relation, keyed by (version, parent, child), `ChildGrammar` in review U4's terms: its payload
 * is the child's position in its parent's content model, the Glushkov position every content law
 * reads, so what is admitted and where it stands are one fact.
 */
import { Schema } from "effect";
import type { IdField, IndexedSourced } from "#pantry/grammar/closed.ts";
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
 * The payload of `Admission`: the child's position in its parent's content model (`content.ts`), 0
 * for a child whose kind names no position or several.
 */
export type AdmissionPayload = readonly [IdField<"position", string>];

/**
 * `Admission`.
 */
export type Admission = IndexedSourced<AdmissionKey, AdmissionPayload>;

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
