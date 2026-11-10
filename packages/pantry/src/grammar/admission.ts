/**
 * `Admission`: which child kinds each parent kind admits in each schema version, and what each
 * admitted child is under its parent (fin.md §17, R1 of the W1 to W4 review).
 *
 * One function, of (version, parent, child), `ChildGrammar` in review U4's terms: its value is the
 * child's position in its parent's content model, the Glushkov position every content law reads,
 * so what is admitted and where it stands are one fact. The content grammar states it as each
 * family's admission map and each map's children (`ContentModelOf.admission`, `AdmissionIn`,
 * `#pantry/grammar/content.ts`), and {@link Admission} reads it there.
 */
import { Schema } from "effect";
import type { Option } from "effect";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { Source } from "#pantry/vocab/inventory/types.ts";

/**
 * One admitted (version, parent, child) triple, as a vocabulary states it.
 */
export interface AdmittedChild {
  readonly child: string;
  readonly parent: string;
  readonly version: SchemaVersion;
}

/**
 * A (version, parent, child) as `Admission` is read at: a handle of each.
 */
export interface AdmissionKey {
  readonly child: string;
  readonly parent: string;
  readonly version: string;
}

/**
 * `Admission`, read through the family's admission map: `AdmissionIn(ContentModelOf.admission
 * (version, parent), child)`.
 */
export interface Admission {
  /**
   * Find a child's position under its parent in a version: its parent's content model's one
   * position its kind names, or 0 for a kind that names none or several.
   *
   * @param key - The version, the parent's kind and the child's.
   * @returns The position, or none where the parent does not admit the child there, as for a
   *   handle outside its roster.
   */
  readonly lookup: (key: AdmissionKey) => Option.Option<{ readonly position: string }>;
  /**
   * Find where an admitted child's admission comes from: its position's particle, or its parent's
   * model at position 0, or the source a vocabulary states a triple with beside its models.
   *
   * @param key - The version, the parent's kind and the child's.
   * @returns The source, or none where the parent does not admit the child there.
   */
  readonly sourceOf: (key: AdmissionKey) => Option.Option<Source>;
}

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
