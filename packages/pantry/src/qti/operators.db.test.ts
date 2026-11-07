/**
 * The operator overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3),
 * written to run at Z and never by a hand: each refused package is refused under the law its one
 * edit of `simple` breaks (membership in the outcome's `refused.laws`, since one native object may
 * discharge several, C22), and the nearest valid package beside it is accepted whole.
 *
 * `simple`'s response processing template is replaced by rules that hold the operators, beside a
 * boolean `FLAG` and an integer `COUNT` declared.
 *
 * - **Reading 119:** a `qti-equal-rounded` with figures 0 under its default significantFigures, a
 *   `qti-round-to` with figures 0 under significantFigures (main's `processing.db.test.ts:866-880`
 *   P10 case at `2b276d76`, ported) and one with figures -1 under decimalPlaces, each by the check
 *   `Rounding_figures`; and the overlay's rows held to the tree: a missing row, a mode default
 *   written where the attribute is, and a `figures` that is not its collapse.
 * - **Reading 121:** a `qti-equal` in absolute mode with no tolerance (main's `:892-903` P36 case,
 *   ported) by the containment of the mode's `Attribute` selection in `Tolerance(node)`; three
 *   values, an empty tolerance, a 0, NaN and a negative of 16 significant digits, each by a check
 *   `Equal_tolerance`; and a tolerance row whose values are not its text, by the concat fold.
 */
import { Db, query, v } from "@bjornpagen/grizzle";
import type { ApplyOutcome, Law } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { readProgram } from "#pantry/import/program.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Package } from "#pantry/qti/package.ts";
import { Author } from "#pantry/qti/roles.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The tarball member `simple` is extracted from.
 */
const simpleMember = "qtiv3-examples/packaging/simple/simple.zip";

/**
 * `simple` with its response processing template replaced by the rules, and a boolean `FLAG` and
 * an integer `COUNT` declared beside its `SCORE`, materialized once under its own name.
 *
 * @param name - The fixture's name.
 * @param rules - The response processing's content.
 * @returns The package's directory.
 */
const withRules = (name: string, rules: string) =>
  materializeSpec({
    edits: [
      {
        _tag: "ReplaceText",
        file: "choice.xml",
        replacement: `<qti-outcome-declaration identifier="FLAG" cardinality="single" base-type="boolean"/><qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer"/><qti-item-body>`,
        search: "<qti-item-body>",
      },
      {
        _tag: "ReplaceText",
        file: "choice.xml",
        replacement: `<qti-response-processing>${rules}</qti-response-processing>`,
        search:
          '<qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>',
      },
    ],
    member: simpleMember,
    name: `rv-o-${name}`,
  });

/**
 * Set `FLAG` by a `qti-equal-rounded` or a `qti-equal` with the attributes, over `SCORE` and a
 * float.
 *
 * @param kind - The operator.
 * @param attributes - Its attributes, as written.
 * @returns The rule.
 */
const comparing = (kind: "qti-equal" | "qti-equal-rounded", attributes: string): string =>
  `<qti-set-outcome-value identifier="FLAG"><${kind}${attributes}><qti-variable identifier="SCORE"/><qti-base-value base-type="float">1.5</qti-base-value></${kind}></qti-set-outcome-value>`;

/**
 * Set `SCORE` to itself rounded by a `qti-round-to` with the attributes.
 *
 * @param attributes - Its attributes, as written.
 * @returns The rule.
 */
const roundingTo = (attributes: string): string =>
  `<qti-set-outcome-value identifier="SCORE"><qti-round-to${attributes}><qti-variable identifier="SCORE"/></qti-round-to></qti-set-outcome-value>`;

/**
 * Pick a check of one relation by its name.
 *
 * @param relation - The relation.
 * @param name - The check's name.
 * @returns The predicate.
 */
const checkNamed =
  (relation: string, name: string) =>
  (law: Law): boolean =>
    law.kind === "check" && law.relation === relation && law.name === name;

/**
 * Pick a containment by the relations and fields of its two sides.
 *
 * @param from - The source's relation and its terms.
 * @param to - The target's relation and its terms.
 * @returns The predicate.
 */
const containedIn =
  (from: readonly [string, ...string[]], to: readonly [string, ...string[]]) =>
  (law: Law): boolean =>
    law.kind === "contained" &&
    [law.from.relation, ...law.from.terms.map(({ field }) => field)].join(" ") === from.join(" ") &&
    [law.to.relation, ...law.to.terms.map(({ field }) => field)].join(" ") === to.join(" ");

/**
 * Pick a fold by the relation and field it ends at.
 *
 * @param relation - The end's relation.
 * @param field - The end's accumulated field.
 * @returns The predicate.
 */
const foldInto =
  (relation: string, field: string) =>
  (law: Law): boolean =>
    law.kind === "fold" &&
    law.end.relation === relation &&
    law.end.terms.some((term) => term.field === field);

/**
 * Whether an outcome is `invariant-rejected` with a law among its `refused.laws` one of the
 * predicates picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - The laws the case may be refused under.
 * @returns Whether it is.
 */
const rejectedBy = (
  outcome: ApplyOutcome<unknown>,
  picks: readonly ((law: Law) => boolean)[],
): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.refused.laws.some((law) => picks.some((pick) => pick(law)));

/**
 * The number of packages stored, through a query that counts each by its key.
 */
const packagesCounted = query(Author).rule((r) => {
  const { id } = v(Package, "package");

  return r.match(Package, { id }).find({ total: r.count() });
});

/**
 * Count the packages stored.
 */
const storedPackages = Effect.gen(function* storedPackages() {
  const db = yield* Db.open(AuthorApp.roles.author, {});
  const rows = yield* (yield* db.execute(packagesCounted, {})).collect;

  return rows[0]?.total ?? 0n;
});

/**
 * Build a package's ChangeSet with one edit of its inputs, and apply it.
 *
 * @param dir - The package.
 * @param edit - The edit of its inputs; none applies the package as read.
 * @returns The apply's outcome.
 */
const applyEdited = (
  dir: string,
  edit: (inputs: PackageInputs) => PackageInputs = (held) => held,
) =>
  Effect.gen(function* appliesEdited() {
    const program = yield* readProgram(dir);
    const db = yield* Db.open(AuthorApp.roles.author, {});

    return yield* db.apply(changeSetOf(Author, edit(program.inputs)), {});
  });

/**
 * Apply `simple` with the rules, unedited.
 *
 * @param name - The fixture's name.
 * @param rules - The response processing's content.
 * @returns The apply's outcome.
 */
const applyRules = (name: string, rules: string) =>
  Effect.flatMap(withRules(name, rules), (dir) => applyEdited(dir));

/**
 * The rules of every valid form the two readings read: figures at each mode's least, written or
 * defaulted, padded, and naming a variable; tolerances of one value and two, padded, and naming a
 * variable; an exact equality with none.
 */
const validRules = [
  comparing("qti-equal-rounded", ' figures="1"'),
  comparing("qti-equal-rounded", ' rounding-mode="decimalPlaces" figures=" 0 "'),
  comparing("qti-equal-rounded", ' rounding-mode="significantFigures" figures="COUNT"'),
  roundingTo(' rounding-mode="decimalPlaces" figures="0"'),
  roundingTo(' rounding-mode="significantFigures" figures="+3"'),
  comparing("qti-equal", ' tolerance-mode="absolute" tolerance="0.1 0.2"'),
  comparing("qti-equal", ' tolerance-mode="relative" tolerance=" 5 "'),
  comparing("qti-equal", ' tolerance-mode="absolute" tolerance="T INF"'),
  comparing("qti-equal", ' tolerance-mode="exact"'),
  comparing("qti-equal", ""),
].join("");

/**
 * The law that refuses a rounding operator's figures (reading 119).
 */
const figuresLaw = [checkNamed("RoundingModeFigures", "Rounding_figures")];

/**
 * The laws that refuse a tolerance's count or values (reading 121).
 */
const toleranceLaws = [
  checkNamed("Tolerance", "Equal_tolerance"),
  checkNamed("ToleranceToken", "Equal_tolerance"),
];

/**
 * The refused cases, one law's breach each: the package's apply, the laws it may be refused
 * under, and its name.
 */
const refusedCases = [
  {
    apply: () => applyRules("equal-rounded-zero", comparing("qti-equal-rounded", ' figures="0"')),
    laws: figuresLaw,
    name: "a qti-equal-rounded with figures 0 under its default significantFigures (Rounding figures, reading 119)",
  },
  {
    apply: () =>
      applyRules(
        "round-to-significant-zero",
        roundingTo(' rounding-mode="significantFigures" figures="0"'),
      ),
    laws: figuresLaw,
    name: "a qti-round-to with figures 0 under significantFigures (Rounding figures, main's P10 case)",
  },
  {
    apply: () =>
      applyRules(
        "round-to-decimal-negative",
        roundingTo(' rounding-mode="decimalPlaces" figures="-1"'),
      ),
    laws: figuresLaw,
    name: "a qti-round-to with figures -1 under decimalPlaces (Rounding figures, reading 119)",
  },
  {
    apply: () =>
      applyRules("equal-absolute-none", comparing("qti-equal", ' tolerance-mode="absolute"')),
    laws: [containedIn(["Attribute", "node"], ["Tolerance", "node"])],
    name: "a qti-equal in absolute mode with no tolerance (Equal tolerance, main's P36 case)",
  },
  {
    apply: () =>
      applyRules("equal-relative-none", comparing("qti-equal", ' tolerance-mode="relative"')),
    laws: [containedIn(["Attribute", "node"], ["Tolerance", "node"])],
    name: "a qti-equal in relative mode with no tolerance (Equal tolerance, reading 121)",
  },
  {
    apply: () =>
      applyRules(
        "tolerance-three",
        comparing("qti-equal", ' tolerance-mode="absolute" tolerance="0.1 0.2 0.3"'),
      ),
    laws: toleranceLaws,
    name: "a tolerance of three values (Equal tolerance, reading 121)",
  },
  {
    apply: () => applyRules("tolerance-empty", comparing("qti-equal", ' tolerance=""')),
    laws: toleranceLaws,
    name: "an empty tolerance (Equal tolerance, reading 121)",
  },
  {
    apply: () =>
      applyRules(
        "tolerance-zero",
        comparing("qti-equal", ' tolerance-mode="absolute" tolerance="0"'),
      ),
    laws: toleranceLaws,
    name: "a tolerance of 0 (Equal tolerance, reading 121)",
  },
  {
    apply: () =>
      applyRules(
        "tolerance-nan",
        comparing("qti-equal", ' tolerance-mode="relative" tolerance="0.5 NaN"'),
      ),
    laws: toleranceLaws,
    name: "a tolerance with NaN, which PostgreSQL's double precision orders above 0 (Equal tolerance, reading 121)",
  },
  {
    apply: () =>
      applyRules(
        "tolerance-long-negative",
        comparing("qti-equal", ' tolerance-mode="absolute" tolerance="-0.1234567890123456"'),
      ),
    laws: toleranceLaws,
    name: "a tolerance of a negative number of 16 significant digits, outside grizzle's double form (Equal tolerance, reading 121)",
  },
  {
    apply: () =>
      Effect.flatMap(withRules("valid", validRules), (dir) =>
        applyEdited(dir, (inputs) => ({
          ...inputs,
          Rounding: new Map([...inputs.Rounding].slice(1)),
        })),
      ),
    laws: [containedIn(["Node", "id"], ["Rounding", "node"])],
    name: "a rounding operator with no Rounding row (E1 derived)",
  },
  {
    apply: () =>
      Effect.flatMap(withRules("valid", validRules), (dir) =>
        applyEdited(dir, (inputs) => ({
          ...inputs,
          Rounding: new Map(
            [...inputs.Rounding].map(([node, row]) => [
              node,
              row.modeWritten ? { ...row, modeWritten: false } : row,
            ]),
          ),
        })),
      ),
    laws: [
      containedIn(["Attribute", "node"], ["Rounding", "node"]),
      containedIn(
        ["RoundingMode", "node", "kind", "modeWritten"],
        ["Rounding", "node", "kind", "modeWritten"],
      ),
      checkNamed("Rounding", "E1_derived"),
    ],
    name: "a written rounding-mode held as unwritten (E1 derived)",
  },
  {
    apply: () =>
      Effect.flatMap(withRules("valid", validRules), (dir) =>
        applyEdited(dir, (inputs) => ({
          ...inputs,
          RoundingFigures: new Map(
            [...inputs.RoundingFigures].map(([node, row]) => [
              node,
              { ...row, figures: `${row.figures} ` },
            ]),
          ),
        })),
      ),
    laws: [
      checkNamed("RoundingFigures", "E1_derived"),
      containedIn(
        ["RoundingModeFigures", "node", "figures"],
        ["RoundingFigures", "node", "figures"],
      ),
    ],
    name: "a figures that is not its collapse (E1 derived)",
  },
  {
    apply: () =>
      Effect.flatMap(withRules("valid", validRules), (dir) =>
        applyEdited(dir, (inputs) => ({
          ...inputs,
          Tolerance: new Map(
            [...inputs.Tolerance].map(([node, row]) => [
              node,
              {
                ...row,
                tokens: row.tokens.map((token) =>
                  token.token === "0.1" ? { ...token, token: "9" } : token,
                ),
              },
            ]),
          ),
        })),
      ),
    laws: [foldInto("Tolerance", "tokenText"), checkNamed("Tolerance", "E1_derived")],
    name: "a tolerance whose values are not its text (E1 derived)",
  },
];

describe.skipIf(!hasLease)(
  "qti/operators.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the operator laws, judged by PostgreSQL", (it) => {
      it.effect("accepts simple with every valid form of readings 119 and 121 in its rules", () =>
        // Oracle: PostgreSQL, every law of the schema over a package whose rounding operators and
        // equalities each meet readings 119 and 121.
        Effect.gen(function* accepted() {
          const before = yield* storedPackages;
          const outcome = yield* applyRules("valid", validRules);

          assert.strictEqual(outcome.kind, "accepted", Formatter.format(outcome));
          assert.strictEqual(yield* storedPackages, before + 1n);
        }),
      );

      for (const { apply, laws, name } of refusedCases) {
        it.effect(`refuses ${name}`, () =>
          // Oracle: PostgreSQL, the law the case's one edit breaks, named in the outcome's `refused.laws`.
          Effect.gen(function* refused() {
            const before = yield* storedPackages;
            const outcome = yield* apply();

            assert.isTrue(rejectedBy(outcome, laws), `${name}: ${Formatter.format(outcome)}`);
            assert.strictEqual(yield* storedPackages, before);
          }),
        );
      }
    });
  },
);
