/**
 * The operator overlays' laws on the lease, where PostgreSQL's own arithmetic decides: `simple`
 * with every valid form of readings 119 and 121 in its rules is accepted whole, and the two
 * tolerances whose verdict rests on how the database reads a `double precision` are refused under
 * `Equal_tolerance`: one holding NaN, which PostgreSQL orders above 0, and a negative of 16
 * significant digits, outside grizzle's double form.
 *
 * `simple`'s response processing template is replaced by rules that hold the operators, beside a
 * boolean `FLAG` and an integer `COUNT` declared.
 *
 * The rest of both readings is the host's: the law oracle against the readings' own restatement
 * over each reading's small box and a swarm past it (`operators.oracle.test.ts`), and the builder's
 * rows (`import/overlays/operators.test.ts`).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/cli/layer.ts";
import { applyEdited, checkNamed, packageStored, rejectedBy } from "#pantry/test/apply-edited.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

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
 * Apply `simple` with the rules, unedited.
 *
 * @param name - The fixture's name.
 * @param rules - The response processing's content.
 * @returns The apply's outcome, and the package's id.
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
 * The laws that refuse a tolerance's count or values (reading 121).
 */
const toleranceLaws = [
  checkNamed("Tolerance", "Equal_tolerance"),
  checkNamed("ToleranceToken", "Equal_tolerance"),
];

/**
 * The refused cases, each a tolerance whose verdict rests on PostgreSQL's `double precision`: the
 * package's apply, the laws it may be refused under, and its name.
 */
const refusedCases = [
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
];

describe.skipIf(!hasLease)(
  "qti/operators.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the operator laws, judged by PostgreSQL", (it) => {
      it.effect("accepts simple with every valid form of readings 119 and 121 in its rules", () =>
        // Oracle: PostgreSQL, every law of the schema over a package whose rounding operators and
        // equalities each meet readings 119 and 121.
        Effect.gen(function* accepted() {
          const { outcome, packageId } = yield* applyRules("valid", validRules);

          assert.strictEqual(outcome.kind, "accepted", Formatter.format(outcome));
          assert.isTrue(yield* packageStored(packageId));
        }),
      );

      for (const { apply, laws, name } of refusedCases) {
        it.effect(`refuses ${name}`, () =>
          // Oracle: PostgreSQL, the law the case's one edit breaks, named in the outcome's `refused.laws`.
          Effect.gen(function* refused() {
            const { outcome, packageId } = yield* apply();

            assert.isTrue(rejectedBy(outcome, laws), `${name}: ${Formatter.format(outcome)}`);
            assert.isFalse(yield* packageStored(packageId), name);
          }),
        );
      }
    });
  },
);
