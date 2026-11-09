/**
 * A `field-identifier` names a record's field, or names nothing, held three ways: the
 * specification by hand (`expectedOf`), the law oracle's verdict, and the import's rows, read for
 * which rows exist and judged on the host by the schema's own statements.
 *
 * A record value's `field-identifier` of whitespace alone names no field. Before, the import wrote
 * the field's `RecordField` row with the empty name standing in, so `E1_derived` refused it under
 * `derived` beside the attribute's own value domain (`IdentifierDType`, an `xs:NCName`, never
 * empty), which alone the oracle raises (FIX-UNWRITTEN's open item, as lane NIL's audit B10 was for
 * a declaration's identifier). Now `RecordField` holds the attribute's lexical form, which
 * `Value_cardinality` counts, and `RecordFieldName` holds the field's name only where it names
 * something (`#pantry/qti/declarations.ts`), so the value domain refuses it alone, and
 * `Record field key` compares only names.
 *
 * A `qti-field-value` names a field of the record its operand gives at run time, and "If there is
 * no field with that identifier then the result of the operator is NULL" (information model
 * §2.11.3.5 and §6.9.37): no law refuses one that names a field of another record, or of none. Its
 * `field-identifier` is required (§5.53.1, multiplicity 1) and an `IdentifierDType`, so AL3 refuses
 * one unwritten and the value domain one that names nothing.
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
import { lawNameOf, rulesOf } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge as judgeHost, judgedLaws } from "#pantry/test/host-judge.ts";
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
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * A `field-identifier` as a case writes it: its lexical form, none where unwritten.
 */
type Written = string | undefined;

/**
 * The `field-identifier` of the varied field of the record `R`, whose other field is `b`: a name,
 * the name padded, `b` padded (a second field of one name), empty, whitespace alone, or
 * unwritten.
 */
const fieldStates: readonly Written[] = ["a", " a ", " b ", "", "  ", undefined];

/**
 * The `field-identifier` of the `qti-field-value` that reads `R`: each of its fields, the field
 * of the other record `Q`, empty, whitespace alone, or unwritten.
 */
const readStates: readonly Written[] = ["a", "b", "q", "", "  ", undefined];

/**
 * One case: the varied field's `field-identifier` and the reading's.
 */
interface Case {
  readonly field: Written;
  readonly read: Written;
}

/**
 * Every case, 6 × 6.
 */
const cases: readonly Case[] = fieldStates.flatMap((field) =>
  readStates.map((read): Case => ({ field, read })),
);

/**
 * A `field-identifier` attribute's text.
 *
 * @param value - Its lexical form, none where unwritten.
 * @returns Its text, with its leading space, or nothing.
 */
const attribute = (value: Written): string =>
  value === undefined ? "" : ` field-identifier="${value}"`;

/**
 * Write a case's package: an item declaring the records `R` (the varied field and `b`) and `Q`
 * (`q`) and an integer `S`, which its response processing sets to the field of `R` the reading
 * names, and the manifest that lists it, each file's text encoded as UTF-8.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = ({ field, read }: Case): PackageEntries =>
  new Map(
    Object.entries({
      "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-outcome-declaration identifier="R" cardinality="record"><qti-default-value><qti-value${attribute(field)} base-type="integer">1</qti-value><qti-value field-identifier="b" base-type="string">x</qti-value></qti-default-value></qti-outcome-declaration><qti-outcome-declaration identifier="Q" cardinality="record"><qti-default-value><qti-value field-identifier="q" base-type="integer">2</qti-value></qti-default-value></qti-outcome-declaration><qti-outcome-declaration identifier="S" cardinality="single" base-type="integer"/><qti-item-body><p>Hi</p></qti-item-body><qti-response-processing><qti-set-outcome-value identifier="S"><qti-field-value${attribute(read)}><qti-variable identifier="R"/></qti-field-value></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`,
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * The name a `field-identifier` gives once collapsed (XML Schema Part 2, §4.3.6): its lexical form
 * without its outer XML whitespace, none where it is unwritten or whitespace alone, which names
 * nothing.
 *
 * @param value - Its lexical form, none where unwritten.
 * @returns The name, none where it names nothing.
 */
const nameOf = (value: Written): Option.Option<string> =>
  Option.filter(
    Option.map(Option.fromUndefinedOr(value), (lexical) =>
      lexical.replaceAll(/^[\t\n\r ]+|[\t\n\r ]+$/gu, ""),
    ),
    (name) => name !== "",
  );

/**
 * The laws a case breaks, by the specification:
 *
 * - **the varied field** (§8.16, CardinalityEnum, `record`: "a set of independent values each
 *   identified by its own identifier"; §7.46.1: its `field-identifier` is an `IdentifierDType`):
 *   one that names nothing breaks its value domain alone; one that names `b` breaks Record field
 *   key, which compares names collapsed; one unwritten breaks Value cardinality, since a record's
 *   value is a field with both its attributes;
 * - **the reading** (§6.9.37: "If there is no field with that identifier then the result of the
 *   operator is NULL"; §5.53.1: its multiplicity is 1): one that names any field, `R`'s, `Q`'s or
 *   none, breaks nothing; one that names nothing breaks its value domain, and one unwritten AL3.
 *
 * @param drawn - The case.
 * @returns The laws, empty where the case is lawful.
 */
const expectedOf = ({ field, read }: Case): ReadonlySet<LawName> =>
  new Set<LawName>([
    ...(field === undefined ? ["Value cardinality" as const] : []),
    ...(field !== undefined && Option.isNone(nameOf(field)) ? ["value domain" as const] : []),
    ...(Option.contains(nameOf(field), "b") ? ["Record field key" as const] : []),
    ...(read === undefined ? ["AL3 required" as const] : []),
    ...(read !== undefined && Option.isNone(nameOf(read)) ? ["value domain" as const] : []),
  ]);

/**
 * Name the situation a case's laws reach: none broken, one, or several.
 *
 * @param expected - The laws.
 * @returns The situation.
 */
const reachedBy = (expected: ReadonlySet<LawName>): Situation => {
  if (expected.size === 0) {
    return "accepted";
  }

  return expected.size === 1 ? "alone" : "several";
};

/**
 * A situation the box must reach.
 */
type Situation = "accepted" | "alone" | "another record's field" | "several";

layer(NodeServices.layer, { excludeTestServices: true })("a field-identifier", (it) => {
  it.effect(
    "names a field where it names something, and the law oracle, the import's rows and the specification give one verdict and one rule",
    (ctx) =>
      // Oracle: the specification as a checker by hand (`expectedOf`): the information model's
      // §5.53.1, §6.9.37, §7.46.1 and §8.16, and XML Schema Part 2 §4.3.6. Bound: a record's field
      // identifier in 6 states (a name, padded, a second field's name, empty, whitespace,
      // unwritten) against a field-value's in 6 (each of the record's fields, another record's,
      // empty, whitespace, unwritten): 36 packages, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "a record value's field-identifier and a field-value's, each naming a field, another record's field, nothing, or unwritten",
            caseHang: Duration.minutes(2),
            coverage: requiredInSpace<Situation>([
              "accepted",
              "alone",
              "several",
              "another record's field",
            ]),
            generator: int(0, cases.length - 1),
            limit: cases.length,
            literal: (at) => Formatter.format(cases[at]),
            oracle: {
              kind: "specification",
              name: "the information model's field-identifier characteristics, by hand",
            },
            suite: "test/field-identifiers",
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
                c.note(reachedBy(expected));
                if (Option.contains(nameOf(drawn.read), "q")) {
                  c.note("another record's field");
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

                // The varied field's name row exists exactly where its field-identifier names
                // something, and the other fields' always.
                const { inputs } = yield* readProgram(yield* scopedPackage(entries));
                assert.sameMembers(
                  [...inputs.RecordFieldName.values()].map(({ identifier }) => identifier),
                  [...Option.toArray(nameOf(drawn.field)), "b", "q"],
                  `${label}: RecordFieldName`,
                );

                const { broken } = judgeHost(hostRowsOf(inputs), hostLaws);
                const brokenNames = broken.map(({ law }) =>
                  Option.getOrElse(lawNameOf(law), () => Formatter.format(law)),
                );
                const shown = broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law";
                assert.sameMembers(
                  [...new Set(brokenNames)],
                  [...expected],
                  `${label}: the import's rows break ${shown}`,
                );

                const brokenLaws = broken.map(({ law }) => law);
                const rule = Arr.isReadonlyArrayNonEmpty(brokenLaws)
                  ? Arr.head(rulesOf(brokenLaws))
                  : Option.none();
                const rules = [...expected].map((law) => ruleOf(law));
                assert.isTrue(
                  Option.match(rule, {
                    onNone: () => expected.size === 0,
                    onSome: (named) => rules.includes(named),
                  }),
                  `${label}: the import's refusal names ${Option.getOrElse(rule, () => "none")}, the specification ${rules.join(", ") || "none"}`,
                );
              }),
            ),
        ),
      ),
  );
});
