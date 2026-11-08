/**
 * The ruling of a refusal grizzle did not decide (`rulingOf` of `#pantry/import/host-judge.ts`),
 * held to the law oracle's rule for the one law the refused rows break.
 *
 * A `some` refusal names every law one PostgreSQL object discharges: a family's axis foreign key
 * carries its family and every containment merged into it (`#pantry/test/merged-axes.ts`), and the
 * database names them all, whichever broke. The import judges each named law over its own rows and
 * rules by those the rows break and those the host cannot judge, never by one the rows hold.
 *
 * The rows are the every-relation package's as the database holds them, which the law oracle
 * accepts, with one field of one row edited so that, of a merged axis's laws the host judges,
 * exactly one containment breaks. No package the importer builds breaks a law of an axis whose laws
 * carry two rules: each containment merged into one pairs only copies grizzle fills along the axis
 * (`DoubleValue`'s `kind`, `Idref`'s `document`, a node's `was`), and grizzle refuses a member that
 * names no owner on the host before any statement (`#pantry/test/family-owners.ts`). So the breach
 * is planted in the rows, where a defect of a copy would put it, and each case's expected rule is
 * the law oracle's (`ruleOf` of `#pantry/test/oracle.ts`) for the law broken. Where a law of the
 * axis the host cannot judge holds a more specific rule, the ruling must fall back and say so, and
 * such cases are counted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { searched } from "@grizzle/testing/vitest";
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { Duration, Effect, Formatter, Option, Predicate } from "effect";
import type { Datum } from "#pantry/host/predicates.ts";
import { hostRowsOf, judge, judgedLaws, rulingOf } from "#pantry/import/host-judge.ts";
import type { HostRows, JudgedLaw } from "#pantry/import/host-judge.ts";
import { readProgram } from "#pantry/import/program.ts";
import { lawNameOf, ruleOfLaws, statementLawsOf } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";
import {
  everyRelationPackage,
  memberCounts,
  scopedPackage,
} from "#pantry/test/gen/every-relation.ts";
import type { MemberCounts } from "#pantry/test/gen/every-relation.ts";
import { mergedAxes } from "#pantry/test/merged-axes.ts";
import type { Axis } from "#pantry/test/merged-axes.ts";
import { lawNames, ruleOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, of the exhaustion: a hang guard, never a budget. It compiles Qti's
 * law model once, then reads and judges the eight every-relation packages.
 */
const testTimeoutMs = 1_800_000;

/**
 * The most rows of a relation a case edits, each field of each in turn: two, so a row other than
 * its relation's first is edited too.
 */
const rowsPerRelation = 2;

/**
 * The situations the exhaustion must reach: a ruling decided by the broken law, one whose rule the
 * old most-specific-of-all would have named otherwise, and one whose rule falls back.
 */
type Situation = "decided" | "discriminating" | "fallback";

/**
 * How the cases fell over the whole exhaustion: each edit decided, discriminating, fallen back, or
 * discarded for breaking other than exactly one of its axis's laws the host judges.
 */
interface Tally {
  decided: number;
  discarded: number;
  discriminating: number;
  fallback: number;
}

/**
 * One planted breach: the axis whose `some` refusal it stands for, the containment of it the edit
 * breaks, the relation, row and field it edits.
 */
interface Edit {
  readonly axis: Axis;
  readonly field: string;
  readonly law: Law;
  readonly relation: string;
  readonly row: number;
}

/**
 * Whether a name is one of the law oracle's laws, whose rule it states.
 *
 * @param name - A law's name in the law table.
 * @returns Whether the oracle states it.
 */
const isOracleLaw = (name: string): name is LawName => lawNames.some((oracle) => oracle === name);

/**
 * Name a law's rule as the law oracle states it.
 *
 * @param law - A law, as an outcome names it.
 * @returns The rule; fails the test where the law has no name the oracle states.
 */
const oracleRuleOf = (law: Law): string => {
  const name = Option.getOrUndefined(lawNameOf(law));

  return name !== undefined && isOracleLaw(name)
    ? ruleOf(name)
    : assert.fail(`${Formatter.format(law)} is no law the oracle states`);
};

/**
 * Read the host's laws that are one law, by grizzle's `sameLaw`.
 *
 * @param law - The law, as an outcome names it.
 * @returns The host's laws that are it, none for a law the host does not judge.
 */
const judgedAs = (law: Law): readonly JudgedLaw[] =>
  judgedLaws(Qti).filter((judged) => sameLaw(judged.law, law));

/**
 * Read the fields a family's group pairs with its owner's key: every term of a counted family's
 * member side, every term but the index of an ordered family's or a tree's.
 *
 * @param own - The family's or the tree's law, an axis's first.
 * @returns The group's fields.
 */
const groupOf = (own: Law): ReadonlySet<string> => {
  if (own.kind !== "family" && own.kind !== "tree") {
    return new Set();
  }

  const { terms } = own.member;

  return new Set(
    (own.kind === "family" && own.order === "counted" ? terms : terms.slice(0, -1)).map(
      ({ field }) => field,
    ),
  );
};

/**
 * Read every merged axis of Qti whose laws carry more than one rule: the only `some` refusals of a
 * family's axis whose rule depends on which law broke.
 *
 * @returns The axes.
 */
const ruledAxes = (): readonly Axis[] =>
  mergedAxes(
    statementLawsOf(Qti).flatMap(({ laws }) => laws),
    Qti.relations,
  ).filter(
    ({ laws }) => new Set(laws.flatMap((law) => Option.toArray(ruleOfLaws([law])))).size > 1,
  );

/**
 * List every planted breach of a package's rows: for each ruled axis, each containment of it the
 * host judges, each field of the containment's source the family's group does not pair, and each
 * of the first rows the containment's source selects.
 *
 * @param axes - The ruled axes.
 * @param rows - The package's rows as the database holds them.
 * @returns The edits.
 */
const editsOf = (axes: readonly Axis[], rows: HostRows): readonly Edit[] =>
  axes.flatMap((axis) => {
    const group = groupOf(axis.laws[0]);

    return axis.laws.flatMap((law): readonly Edit[] => {
      const [judged] = judgedAs(law);
      if (law.kind !== "contained" || judged === undefined || judged.kind !== "contained") {
        return [];
      }

      const { relation } = law.from;
      const fields = law.from.terms.flatMap((term) =>
        term.kind === "field" && !group.has(term.field) ? [term.field] : [],
      );
      const selected = (rows.get(relation) ?? []).flatMap((row, at) =>
        judged.from.selection(row) === true ? [at] : [],
      );

      return fields.flatMap((field) =>
        selected.slice(0, rowsPerRelation).map((row) => ({ axis, field, law, relation, row })),
      );
    });
  });

/**
 * A value no row of the target holds where the edited field meets it: the text with a suffix no
 * vocabulary text ends with, or the natural far past any count; none for any other value.
 *
 * @param value - The field's value.
 * @returns The planted value.
 */
const plantedOf = (value: Datum | undefined): Option.Option<Datum> => {
  if (Predicate.isString(value)) {
    return Option.some(`${value}\u0000planted`);
  }

  return Predicate.isBigInt(value) ? Option.some(value + 1_000_003n) : Option.none();
};

/**
 * Apply an edit to the rows: its row's field set to its planted value.
 *
 * @param rows - The rows.
 * @param edit - The edit.
 * @returns The edited rows; none where the field holds a value no plant replaces.
 */
const editedRows = (rows: HostRows, edit: Edit): Option.Option<HostRows> => {
  const held = rows.get(edit.relation) ?? [];

  return Option.map(
    plantedOf(held[edit.row]?.[edit.field]),
    (planted) =>
      new Map([
        ...rows,
        [
          edit.relation,
          held.map((row, at) => (at === edit.row ? { ...row, [edit.field]: planted } : row)),
        ],
      ]),
  );
};

/**
 * Judge one edit: the laws of its axis the edited rows break, which must be its containment alone,
 * and the ruling of the axis's `some` refusal over them, held to the law oracle's rule for that
 * containment, or, where a law of the axis the host cannot judge holds a more specific rule, to the
 * fallback the ruling must own up to.
 *
 * @param rows - The package's rows as the database holds them.
 * @param edit - The edit.
 * @param tally - The counts, which the edit adds to.
 * @returns The situations it reached.
 */
const judgeEdit = (rows: HostRows, edit: Edit, tally: Tally): readonly Situation[] => {
  const edited = Option.getOrUndefined(editedRows(rows, edit));
  const [first, second, ...rest] = edit.axis.laws;
  if (edited === undefined || second === undefined) {
    tally.discarded += 1;

    return [];
  }

  const broken = edit.axis.laws.filter((law) => {
    const own = judgedAs(law);

    return own.length > 0 && judge(edited, own).broken.length > 0;
  });
  const label = `${edit.axis.label}: ${edit.relation}.${edit.field} of row ${String(edit.row)}`;
  if (broken.length !== 1 || !broken.every((law) => sameLaw(law, edit.law))) {
    tally.discarded += 1;

    return [];
  }

  const expected = oracleRuleOf(edit.law);
  const ruling = rulingOf({ kind: "some", laws: [first, second, ...rest] }, () => edited);
  const ruled = Option.getOrUndefined(ruleOfLaws(ruling.laws));
  const owed = Option.getOrUndefined(ruleOfLaws([edit.law, ...ruling.unjudged]));
  if (owed !== expected) {
    // A law of the axis the host cannot judge holds a more specific rule than the broken law's:
    // the ruling falls back to it, and must say so.
    assert.isFalse(ruling.decided, `${label}: a fallback ruling must say it is undecided`);
    assert.strictEqual(ruled, owed, `${label}: the fallback rule`);
    tally.fallback += 1;

    return ["fallback"];
  }

  assert.isTrue(ruling.decided, `${label}: ${Formatter.format(ruling)}`);
  assert.strictEqual(
    ruled,
    expected,
    `${label}: the ruling's rule, over ${ruling.laws.map((law) => Formatter.format(law)).join("; ")}`,
  );
  tally.decided += 1;
  const old = Option.getOrUndefined(ruleOfLaws(edit.axis.laws));
  if (old === expected) {
    return ["decided"];
  }

  tally.discriminating += 1;

  return ["decided", "discriminating"];
};

/**
 * Read one every-relation package's rows and judge every planted breach of them.
 *
 * @param members - The package's member counts.
 * @param axes - The ruled axes.
 * @param tally - The counts, which its edits add to.
 * @returns The situations its edits reached.
 */
const judgePackage = (members: MemberCounts, axes: readonly Axis[], tally: Tally) =>
  Effect.gen(function* judgedPackage() {
    const program = yield* readProgram(yield* scopedPackage(everyRelationPackage(members)));
    const rows = hostRowsOf(program.inputs);

    return editsOf(axes, rows).flatMap((edit) => judgeEdit(rows, edit, tally));
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

describe("the ruling of a refusal grizzle did not decide", () => {
  it.effect(
    "rules a merged axis's some refusal by the one law its rows break, as the law oracle rules that law",
    (ctx) =>
      // Oracle: the law oracle's rule for the broken law (`ruleOf`). Bound: the eight every-relation
      // packages, each merged axis of Qti whose laws carry two rules or more, each containment of it
      // the host judges, each field its family's group does not pair, the first two rows
      // its source selects. Planted: the old most-specific-of-all names a DoubleValue or
      // TextDoubleValue owner axis's refusal by its family's attribute-lexical where only its owner
      // copy, attribute-admission, broke.
      Effect.gen(function* rulesBySome() {
        const axes = ruledAxes();
        const tally: Tally = { decided: 0, discarded: 0, discriminating: 0, fallback: 0 };

        yield* searched(
          ctx,
          exhaust(
            {
              box: "the eight every-relation packages, each planted breach of one containment of a merged axis whose laws carry two rules or more",
              caseHang: Duration.seconds(600),
              coverage: requiredInSpace<Situation>(["decided", "discriminating"]),
              generator: memberCounts,
              limit: 8,
              literal: JSON.stringify,
              oracle: {
                kind: "specification",
                name: "the law oracle's rule for the one law the rows break",
              },
              suite: "import/refusal-ruling/some",
            },
            (members, c) =>
              Effect.map(judgePackage(members, axes, tally), (situations) => {
                for (const situation of new Set(situations)) {
                  c.note(situation);
                }
              }),
          ),
        );

        yield* Effect.promise(() =>
          ctx.annotate(
            `${String(axes.length)} ruled axes; ${String(tally.decided)} edits decided by the broken law (${String(tally.discriminating)} the old most-specific-of-all names otherwise), ${String(tally.fallback)} fallen back to a law the host cannot judge, ${String(tally.discarded)} discarded`,
            "the ruling",
          ),
        );
      }),
    testTimeoutMs,
  );
});
