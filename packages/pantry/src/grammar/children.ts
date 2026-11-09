/**
 * The child laws that read more than a family's content model: a barring, which reads the parent's
 * attributes, and a last-slot rule, which reads the child's.
 *
 * A family's order, its required particles, at-most-once and exclusive choice are its content
 * model's Glushkov automaton (`content.ts`); what no content model states, because it depends on an
 * attribute, is here.
 *
 * - `ChildBarredBy(version, parent) → (name, position)`: no child at the position while the parent
 *   carries the attribute `name`, as HTML's `colgroup` with `span` holds no `col`.
 * - {@link LastWhere}: a child that is its parent's last element child when one of its attributes
 *   holds a value, as a default hotspot ends its interaction; it is the last-slot law plan Q5.09
 *   owns.
 */
import { Option, Result, Schema } from "effect";
import type { Admission } from "#pantry/grammar/admission.ts";
import { UnadmittedChild } from "#pantry/grammar/admission.ts";
import { idField, sourced } from "#pantry/grammar/closed.ts";
import type { IdField, Roster, Sourced, SourcedRow } from "#pantry/grammar/closed.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

/**
 * One or more kind handles.
 */
export type Kinds = readonly [string, ...string[]];

/**
 * A barring, stated once for the parents and versions it holds in: no child of `kinds` while the
 * parent carries the attribute `name`.
 */
export interface Barring {
  readonly kinds: Kinds;
  readonly name: string;
  readonly parents: Kinds;
  readonly source: string;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * A child that is its parent's last element child when one of its attributes holds a value. It
 * reads an attribute, so no content model states it; it is the last-slot law plan Q5.09 owns,
 * `contained(on(select(Node, isDefaultHotspot), "parent", "at"), on(Node, "id",
 * pred("children")))`.
 */
export interface LastWhere {
  readonly attribute: string;
  readonly kind: string;
  readonly parents: Kinds;
  readonly source: string;
  readonly value: string;
  readonly versions: readonly [SchemaVersion, ...SchemaVersion[]];
}

/**
 * A vocabulary's share of the child laws: its barrings and its last-slot rules.
 */
export interface ChildFacet {
  readonly barrings: readonly Barring[];
  readonly lastWhere: readonly LastWhere[];
}

/**
 * `ChildBarredBy`: per (version, parent), the attribute that bars a position, each row sourced to
 * the reading that states its barring.
 */
export type BarredBy = Sourced<
  readonly [IdField<"version", SchemaVersion>, IdField<"parent", string>],
  readonly [IdField<"name", string>, IdField<"position", string>]
>;

/**
 * One `ChildBarredBy` row, with the reading that states its barring.
 */
type BarredByRow = SourcedRow<
  readonly [IdField<"version", SchemaVersion>, IdField<"parent", string>],
  readonly [IdField<"name", string>, IdField<"position", string>]
>;

/**
 * A barring's kinds hold several positions, or none, so one position cannot stand for them.
 */
export class SplitMembers extends Schema.TaggedError<SplitMembers>()("SplitMembers", {
  kinds: Schema.String,
  parent: Schema.String,
  source: Schema.String,
  version: Schema.String,
}) {
  /**
   * The barring, the kinds, the parent and version, and the repair.
   */
  override get message(): string {
    return `The barring from ${this.source} bars ${this.kinds} under ${this.parent} in ${this.version}, which hold several content positions there, or none, so one position cannot stand for them. Bar the kinds of one particle.`;
  }
}

/**
 * The ways the barrings have no relation.
 */
export type ChildError = SplitMembers | UnadmittedChild;

/**
 * Generate `ChildBarredBy` from the vocabularies' barrings, each barred kind at its `Admission`
 * position.
 *
 * @param input - The rosters, the admission and the vocabularies' facets.
 * @param input.admission - `Admission`, whose positions the barrings read.
 * @param input.attributes - The `AttributeName` roster.
 * @param input.facets - Each vocabulary's facet.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.positions - The `Position` roster.
 * @param input.versions - The `SchemaVersion` roster.
 * @returns The relation, or the first barring of a kind its parent does not admit or of kinds at
 *   several positions. A parent barred under two attributes is a fault of the rows (`faultOf`),
 *   which the tests find and grizzle refuses.
 */
export const barredByOf = (input: {
  readonly admission: Admission;
  readonly attributes: Roster<string>;
  readonly facets: readonly ChildFacet[];
  readonly kinds: Roster<string>;
  readonly positions: Roster<string>;
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<BarredBy, ChildError> =>
  Result.gen(function* generateBarredBy() {
    const rows: BarredByRow[] = [];
    for (const { kinds, name, parents, source, versions } of input.facets.flatMap(
      (facet) => facet.barrings,
    )) {
      for (const version of versions) {
        for (const parent of parents) {
          const held = new Set<string>();
          for (const child of kinds) {
            const row = input.admission.lookup({ child, parent, version });
            if (Option.isNone(row)) {
              return yield* Result.fail(
                new UnadmittedChild({
                  child,
                  parent,
                  source: `The barring from ${source}`,
                  versions: version,
                }),
              );
            }

            held.add(row.value.position);
          }

          const [position, ...rest] = held;
          if (position === undefined || position === "0" || rest.length > 0) {
            return yield* Result.fail(
              new SplitMembers({ kinds: kinds.join(", "), parent, source, version }),
            );
          }

          rows.push({
            row: { name, parent, position, version },
            source: { _tag: "spec", cite: source },
          });
        }
      }
    }

    return sourced({
      key: [idField("version", input.versions), idField("parent", input.kinds)],
      name: "ChildBarredBy",
      payload: [idField("name", input.attributes), idField("position", input.positions)],
      rows,
    });
  });
