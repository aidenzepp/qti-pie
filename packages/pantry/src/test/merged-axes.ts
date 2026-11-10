/**
 * A schema's families' axes, each with every law its foreign key carries, as grizzle's riding rule
 * merges them ({@link mergedAxes}): the laws one `some` refusal of a family's axis names together.
 */
import type { Law, LawSide } from "@bjornpagen/grizzle";
import type { Array as Arr } from "effect";

/**
 * One axis of a family and every law its foreign key carries.
 */
export interface Axis {
  readonly label: string;
  readonly laws: Arr.NonEmptyReadonlyArray<Law>;
}

/**
 * Whether a side's terms begin with `prefix`, each a field or `pred` of the same field.
 *
 * @param side - The side.
 * @param prefix - The terms.
 * @returns Whether they begin it.
 */
export const beginsWith = (side: LawSide, prefix: readonly LawSide["terms"][number][]): boolean =>
  prefix.every((term, at) => {
    const own = side.terms[at];

    return own !== undefined && own.kind === term.kind && own.field === term.field;
  });

/**
 * Whether a law side reads a selection of its relation rather than every fact.
 *
 * @param side - The side.
 * @returns Whether it selects.
 */
const selects = (side: LawSide): boolean => side.selection.conjuncts.length > 0;

/**
 * Read the axes of every family of a schema, each with the laws its foreign key carries: the
 * family's own law, every containment that rides the axis, and on the predecessor and last axes
 * every fold over the family.
 *
 * It restates grizzle's riding rule (`analysis/theory/families.ts` `axisShapes` and `ridesOf`, at
 * 4016b69): the owner axis is member `F(g…)` to owner `O(k…)`; the predecessor axis
 * `F(g…, pred(i))` to `F(g…, i)` and the last axis `O(k…, pred(n))` to `F(g…, i)` for a family
 * whose index is a field. A tree's member ends read its members, a selection, and every other end
 * reads every fact; the reader takes any selection of a tree's member for the members.
 *
 * An owner's key is its primary key, as `lawsOf` lists it beside the statements' laws.
 *
 * @param laws - The schema's laws, as grizzle's `lawsOf` lists them, every primary key included.
 * @returns The axes.
 * @throws {Error} When a family's owner has no primary key among the laws: laws read from the
 *   statements alone, never `lawsOf`'s, a defect of the caller.
 */
export const mergedAxes = (laws: readonly Law[]): readonly Axis[] => {
  const keys = new Map(
    laws.flatMap((law) => (law.kind === "primaryKey" ? [[law.relation, law.fields] as const] : [])),
  );
  const keyOf = (owner: string): readonly string[] => {
    const key = keys.get(owner);
    if (key === undefined) {
      throw new Error(
        `The laws list no primary key of ${owner}, a family's owner. Pass mergedAxes every law grizzle's lawsOf lists, the primary keys included.`,
      );
    }

    return key;
  };
  const containments = laws.flatMap((law) => (law.kind === "contained" ? [law] : []));

  return laws.flatMap((own): readonly Axis[] => {
    if (own.kind !== "family" && own.kind !== "tree") {
      return [];
    }

    const { member, slots } = own;
    const { owner } = slots;
    const isTree = own.kind === "tree";
    const byCount = own.kind === "family" && own.order === "counted";
    const { terms } = member;
    const group = byCount ? [...terms] : terms.slice(0, -1);
    const index = byCount ? undefined : terms.at(-1);
    const ownerKey = keyOf(owner).map((field) => ({ field, kind: "field" as const }));
    const folds = laws.filter(
      (other) =>
        other.kind === "fold" && other.family.owner === owner && other.family.count === slots.count,
    );
    const riding = (
      from: { readonly relation: string; readonly members: boolean },
      to: { readonly relation: string; readonly members: boolean },
      fromKey: readonly LawSide["terms"][number][],
      toKey: readonly LawSide["terms"][number][],
    ): readonly Law[] =>
      containments.filter(
        (law) =>
          law.from.relation === from.relation &&
          law.to.relation === to.relation &&
          selects(law.from) === (from.members && isTree) &&
          selects(law.to) === (to.members && isTree) &&
          beginsWith(law.from, fromKey) &&
          beginsWith(law.to, toKey),
      );
    const ownerAxis: Axis = {
      label: `${member.relation} owner`,
      laws: [
        own,
        ...riding(
          { members: true, relation: member.relation },
          { members: false, relation: owner },
          group,
          ownerKey,
        ),
      ],
    };
    if (index === undefined) {
      return [
        ownerAxis,
        { label: `${member.relation} predecessor and last`, laws: [own, ...folds] },
      ];
    }

    return [
      ownerAxis,
      {
        label: `${member.relation} predecessor`,
        laws: [
          own,
          ...riding(
            { members: true, relation: member.relation },
            { members: true, relation: member.relation },
            [...group, { field: index.field, kind: "pred" }],
            [...group, index],
          ),
          ...folds,
        ],
      },
      {
        label: `${member.relation} last`,
        laws: [
          own,
          ...riding(
            { members: false, relation: owner },
            { members: true, relation: member.relation },
            [...ownerKey, { field: slots.count, kind: "pred" }],
            [...group, index],
          ),
          ...folds,
        ],
      },
    ];
  });
};
