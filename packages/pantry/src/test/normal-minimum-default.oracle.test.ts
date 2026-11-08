/**
 * An outcome declaration's normal minimum where it writes none, held across both versions (spec
 * reading 149): QTI 3.0.1's information model gives `normal-minimum` "Default = "0.0"" (§4.5.8)
 * and its ASI XSD `default="0.0"`, and QTI 3.0's state no default. So a 3.0.1 declaration that
 * writes a `mastery-value` and no `normal-minimum` has its mastery value judged against 0.0 by
 * `Mastery range`, and a 3.0.0 one has no floor to judge it against.
 *
 * Before, the import and the law oracle read an unwritten minimum as none in both versions, as
 * reading 9's "each pair judged where both are written" had it, so a 3.0.1 `mastery-value="-1"`
 * with no `normal-minimum` was admitted below its normal range (FIX-UNWRITTEN's open question,
 * 34c8c4b9).
 *
 * Each package is held three ways: by the specification by hand ({@link expectedOf}), by the law
 * oracle's laws, and by the import's rows: which `NormalMinimum`, `MasteryFloor` and
 * `MasteryCeiling` rows exist, and the laws they break on the host, under the refusal's rule. The
 * host reads no `Compute.when` term (`#pantry/import/host-judge.ts`), so it judges no
 * `Mastery_range`; the import's verdict on it is read from its pair rows as the law's check orders
 * them ({@link rowsBreakRange}), and the database tier judges the check itself
 * (`#pantry/qti/declarations.db.test.ts`).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { lawNameOf, ruleOfLaws } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge as judgeHost, judgedLaws } from "#pantry/import/host-judge.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";

/**
 * The oracle's tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * Every law the host judges, read once.
 */
const hostLaws = judgedLaws(Qti);

/**
 * The QTI 3 ASI namespace, of every item element in both versions.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The versions of the box, each the `schemaversion` its manifest names (spec reading 67).
 */
const versions = ["3.0.0", "3.0.1"] as const;

/**
 * One case: a version, and an outcome declaration's `normal-minimum`, `normal-maximum` and
 * `mastery-value`, each unwritten or written with a text of the box.
 */
interface Case {
  readonly mastery: "-1" | undefined;
  readonly maximum: "-2" | "0" | "3" | undefined;
  readonly minimum: "-2" | undefined;
  readonly version: (typeof versions)[number];
}

/**
 * The texts of the box: a minimum of -2, below the mastery value; a maximum of -2, below 0 and the
 * mastery value, of 0, and of 3, above both; and a mastery value of -1, below 3.0.1's default
 * minimum 0. Each is unwritten too.
 */
const texts = {
  mastery: ["-1", undefined],
  maximum: ["-2", "0", "3", undefined],
  minimum: ["-2", undefined],
} as const;

/**
 * Every case: 2 versions × 2 minimums × 4 maximums × 2 mastery values, 32 in all.
 */
const cases: readonly Case[] = versions.flatMap((version) =>
  texts.minimum.flatMap((minimum) =>
    texts.maximum.flatMap((maximum) =>
      texts.mastery.map((mastery): Case => ({ mastery, maximum, minimum, version })),
    ),
  ),
);

/**
 * The normal minimum a declaration that writes none has, by its version, as the specification
 * states it: QTI 3.0.1's information model, "Default = "0.0"" and "It is set to 0 by default"
 * (§4.5.8), with its ASI XSD's `<xs:attribute name="normal-minimum" use="optional" default="0.0"
 * type="xs:double" />`; QTI 3.0's §4.5.8 and XSD state none.
 */
const defaultMinimum: ReadonlyMap<string, string> = new Map([["3.0.1", "0.0"]]);

/**
 * A case's normal minimum: the one it writes, or else its version's default.
 *
 * @param drawn - The case.
 * @returns The minimum's lexical form, none where it has none.
 */
const minimumOf = (drawn: Case): Option.Option<string> =>
  drawn.minimum === undefined
    ? Option.fromUndefinedOr(defaultMinimum.get(drawn.version))
    : Option.some(drawn.minimum);

/**
 * An optional attribute's text.
 *
 * @param name - Its name.
 * @param value - Its value, none where unwritten.
 * @returns Its text, with its leading space, or nothing.
 */
const optional = (name: string, value: string | undefined): string =>
  value === undefined ? "" : ` ${name}="${value}"`;

/**
 * Write a case's package: an item holding its outcome declaration, and the manifest that lists it
 * under the case's version, each file's text encoded as UTF-8.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: Case): PackageEntries =>
  new Map(
    Object.entries({
      "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${drawn.version}</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-outcome-declaration identifier="O" cardinality="single" base-type="float"${optional("mastery-value", drawn.mastery)}${optional("normal-minimum", drawn.minimum)}${optional("normal-maximum", drawn.maximum)}/><qti-item-body><p>Hi</p></qti-item-body></qti-assessment-item>`,
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * Whether two scale values are both present and out of order. Every text of the box is a plain
 * decimal, so its `xs:double` is its number.
 *
 * @param low - The one that must not be above.
 * @param high - The one that must not be below.
 * @returns Whether both are present and the first is above the second.
 */
const disordered = (low: Option.Option<string>, high: Option.Option<string>): boolean =>
  Option.match(Option.all([low, high]), {
    onNone: () => false,
    onSome: ([l, h]) => Number(l) > Number(h),
  });

/**
 * The laws a case breaks, by the specification:
 *
 * - **`Double bound`**: `normal-maximum` "must be a positive value" (information model §4.5.7, spec
 *   readings 16 and 144), so a written maximum of -2 or 0 breaks it;
 * - **`Mastery range`**: the Schematron's RULE SPECIFIC CLASS OUTCOMEDEC 1, "The mastery-value
 *   attribute value must not be less than the normal-minimum value" and "must not be greater than
 *   the normal-maximum value" (reading 9), each pair judged where both have a value: a written
 *   mastery value below the minimum, written or the version's default, or above a written maximum.
 *
 * @param drawn - The case.
 * @returns The laws, empty where the case is lawful.
 */
const expectedOf = (drawn: Case): ReadonlySet<LawName> => {
  const mastery = Option.fromUndefinedOr(drawn.mastery);

  return new Set<LawName>([
    ...(drawn.maximum === "-2" || drawn.maximum === "0" ? ["Double bound" as const] : []),
    ...(disordered(minimumOf(drawn), mastery) ||
    disordered(mastery, Option.fromUndefinedOr(drawn.maximum))
      ? ["Mastery range" as const]
      : []),
  ]);
};

/**
 * Whether the import's pair rows break `Mastery_range` as its check orders them: a floor whose
 * minimum is above its mastery value, or a ceiling whose mastery value is above its maximum. Every
 * text of the box is inside the check's double form and none is `NaN`, so the check's order is the
 * numbers' order.
 *
 * @param inputs - The import's rows.
 * @returns Whether a pair is out of order.
 */
const rowsBreakRange = (inputs: PackageInputs): boolean =>
  [...inputs.MasteryFloor.values()].some(
    ({ masteryValue, normalMinimum }) => Number(normalMinimum) > Number(masteryValue),
  ) ||
  [...inputs.MasteryCeiling.values()].some(
    ({ masteryValue, normalMaximum }) => Number(masteryValue) > Number(normalMaximum),
  );

/**
 * Hold a case's scale rows to what the specification gives it: its normal minimum's row exactly
 * where it has one, holding the written form or its version's default and whether it is written,
 * and each pair's row exactly where it has both of its values.
 *
 * @param drawn - The case.
 * @param inputs - The import's rows.
 * @param label - The case, for a failure's message.
 */
const assertRows = (drawn: Case, inputs: PackageInputs, label: string): void => {
  const minimum = minimumOf(drawn);
  assert.deepStrictEqual(
    [...inputs.NormalMinimum.values()].map(({ lexical, version, written }) => [
      lexical,
      version,
      written,
    ]),
    Option.toArray(minimum).map((lexical) => [lexical, drawn.version, drawn.minimum !== undefined]),
    `${label}: NormalMinimum`,
  );
  assert.deepStrictEqual(
    [...inputs.MasteryFloor.values()].map(({ masteryValue, normalMinimum }) => [
      normalMinimum,
      masteryValue,
    ]),
    Option.toArray(Option.all([minimum, Option.fromUndefinedOr(drawn.mastery)])),
    `${label}: MasteryFloor`,
  );
  assert.deepStrictEqual(
    [...inputs.MasteryCeiling.values()].map(({ masteryValue, normalMaximum }) => [
      masteryValue,
      normalMaximum,
    ]),
    Option.toArray(
      Option.all([Option.fromUndefinedOr(drawn.mastery), Option.fromUndefinedOr(drawn.maximum)]),
    ),
    `${label}: MasteryCeiling`,
  );
};

/**
 * A situation the box must reach: a case whose mastery value is judged against 3.0.1's default
 * floor, one whose 3.0.0 declaration has no floor to judge it against, one whose ceiling is out of
 * order, one whose maximum breaks its bound, and one that is lawful.
 */
type Situation = "accepted" | "bound" | "ceiling" | "default floor" | "no floor";

/**
 * Name the situations a case reaches.
 *
 * @param drawn - The case.
 * @returns Its situations.
 */
const situationsOf = (drawn: Case): readonly Situation[] => {
  const expected = expectedOf(drawn);
  const judged = drawn.mastery !== undefined && drawn.minimum === undefined;

  return [
    ...(expected.size === 0 ? ["accepted" as const] : []),
    ...(expected.has("Double bound") ? ["bound" as const] : []),
    ...(drawn.mastery !== undefined && drawn.maximum === "-2" ? ["ceiling" as const] : []),
    ...(judged && drawn.version === "3.0.1" ? ["default floor" as const] : []),
    ...(judged && drawn.version === "3.0.0" ? ["no floor" as const] : []),
  ];
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "an outcome declaration's unwritten normal-minimum",
  (it) => {
    it.effect(
      "is 3.0.1's default 0.0 and 3.0.0's none, and the law oracle, the import's rows and the specification give one verdict",
      (ctx) =>
        // Oracle: the specification as a checker by hand (`expectedOf`): the information models'
        // §4.5.7 and §4.5.8 of each version, the ASI XSDs' declarations of the three attributes,
        // and readings 9, 16 and 144. Bound: each version, its outcome declaration's minimum
        // written below the mastery value or not, its maximum written below, at or above 0 or
        // not, and its mastery value written below 0 or not: 32 packages, exhausted.
        searched(
          ctx,
          exhaust(
            {
              box: "each version, and an outcome declaration's normal-minimum, normal-maximum and mastery-value, each written or not",
              caseHang: Duration.minutes(2),
              coverage: requiredInSpace<Situation>([
                "accepted",
                "bound",
                "ceiling",
                "default floor",
                "no floor",
              ]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => Formatter.format(cases[at]),
              oracle: {
                kind: "specification",
                name: "each version's normal-minimum default and OUTCOMEDEC 1, by hand",
              },
              suite: "test/normal-minimum-default",
            },
            (at, c) =>
              Effect.scoped(
                Effect.gen(function* oneCase() {
                  const drawn = cases[at];
                  assert.isDefined(drawn, `no case ${String(at)}`);
                  if (drawn === undefined) {
                    return;
                  }

                  const label = Formatter.format(drawn);
                  const expected = expectedOf(drawn);
                  for (const situation of situationsOf(drawn)) {
                    c.note(situation);
                  }

                  const entries = packageOf(drawn);
                  const judgment = yield* judge(filesOf(entries), grammar, laws);
                  assert.strictEqual(judgment._tag, "Judged", `${label}: the codec refuses it`);

                  const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
                  assert.deepStrictEqual(
                    [...new Set(breaches.map(({ law }) => law))].toSorted(),
                    [...expected].toSorted(),
                    `${label}: the law oracle:\n${breaches.map((breach) => `  ${shownBreach(breach, grammar)}`).join("\n")}`,
                  );

                  const { inputs } = yield* readProgram(yield* scopedPackage(entries));
                  assertRows(drawn, inputs, label);

                  // The host judges every law but Mastery range, whose verdict the pair rows give,
                  // and its refusal is named by the rule the catalog's precedence puts first, as
                  // the database's is.
                  const { broken } = judgeHost(hostRowsOf(inputs), hostLaws);
                  const brokenNames = broken.map(({ law }) =>
                    Option.getOrElse(lawNameOf(law), () => Formatter.format(law)),
                  );
                  const shown =
                    broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law";
                  assert.sameMembers(
                    [
                      ...new Set([
                        ...brokenNames,
                        ...(rowsBreakRange(inputs) ? ["Mastery range"] : []),
                      ]),
                    ],
                    [...expected],
                    `${label}: the import's rows break ${shown}${rowsBreakRange(inputs) ? ", and a pair is out of order" : ""}`,
                  );

                  const brokenLaws = broken.map(({ law }) => law);
                  const rule = Arr.isReadonlyArrayNonEmpty(brokenLaws)
                    ? ruleOfLaws(brokenLaws)
                    : Option.none();
                  const rules = [...expected].map((law) => ruleOf(law));
                  assert.isTrue(
                    Option.match(rule, {
                      onNone: () => !expected.has("Double bound"),
                      onSome: (named) => rules.includes(named),
                    }),
                    `${label}: the import's refusal names ${Option.getOrElse(rule, () => "none")}, the specification ${rules.join(", ") || "none"}`,
                  );
                }),
              ),
          ),
        ),
      600_000,
    );
  },
);
