/**
 * A declaration's optional attributes, each written, unwritten or spelling nothing, held three
 * ways: the specification by hand (`expectedOf`), the law oracle's verdict, and the import's rows,
 * read for which rows exist and judged on the host by the schema's own statements.
 *
 * A value that may be missing is a row of its own relation, written only where it is (AGENTS.md,
 * Schema intent). Before, the import wrote `""` for an unwritten `base-type`, `mastery-value`,
 * `normal-minimum` and `normal-maximum`, `none` for an unwritten or unspelled field `base-type`,
 * and a record field whose unwritten `field-identifier` was `""`. So:
 *
 * - A value of a single variable that wrote `base-type` alone was refused under `derived`, its
 *   field's empty identifier, where its own law is Value cardinality (the genetic differential's
 *   class 10);
 * - Nothing proved an outcome range's `""` stood for an unwritten attribute (lane NIL's audit, B14);
 * - `E1_derived` and the reverse copy of a declaration's base type read `""` as "unwritten".
 *
 * Now `DeclarationBaseType`, `ValueBaseType`, `RecordField`, `MasteryValue`, `NormalMinimum`,
 * `NormalMaximum`, `MasteryFloor` and `MasteryCeiling` each hold a row exactly where the attributes
 * it reads are written (`#pantry/qti/declarations.ts`), but that a normal minimum unwritten in this
 * box's 3.0.1 package is its XSD default, `0.0` (spec reading 149, held across both versions by
 * `#pantry/test/normal-minimum-default.oracle.test.ts`). A record's base type `none` is the one
 * sentinel left, which `declarationRef` copies (B12).
 *
 * The host does not read a `Compute.when` term (`#pantry/test/assembled-mirrors.test.ts`), so it
 * judges no `Mastery_range`; the pair rows that law reads are held here instead, and the database
 * tier judges the law (`#pantry/qti/declarations.db.test.ts`).
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
import { hostRowsOf, judge as judgeHost } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";
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
const hostLaws = judgedLaws(Qti.statements);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * An attribute's state in a case: written as a value of its type, unwritten, or written as no value
 * of it.
 */
type Written = "spelled" | "unwritten" | "unspelled";

/**
 * The states every attribute of the box takes.
 */
const writtenStates = ["spelled", "unwritten", "unspelled"] as const satisfies readonly Written[];

/**
 * A declaration's own base type: a single or a record outcome, its `base-type` in one state.
 */
interface DeclarationCase {
  readonly baseType: Written;
  readonly cardinality: "record" | "single";
  readonly kind: "declaration";
}

/**
 * A value's field attributes: one `qti-value` of a single integer outcome's or a record outcome's
 * default, its `field-identifier` written or not, its `base-type` in one state, and its text an
 * integer or not.
 */
interface FieldCase {
  readonly baseType: Written;
  readonly cardinality: "record" | "single";
  readonly field: boolean;
  readonly kind: "field";
  readonly text: "1" | "x";
}

/**
 * An outcome's scale: each of its `mastery-value`, `normal-minimum` and `normal-maximum` unwritten,
 * written as a double in or out of order, or written as no double.
 */
interface ScaleCase {
  readonly kind: "scale";
  readonly mastery: string | undefined;
  readonly maximum: string | undefined;
  readonly minimum: string | undefined;
}

/**
 * One case of the box.
 */
type Case = DeclarationCase | FieldCase | ScaleCase;

/**
 * The scale texts: a mastery value of 1, a minimum of 0 (below it) or 2 (above it), a maximum of 3
 * (above it) or 0.5 (below it, and above normal-maximum's exclusive bound 0, reading 16), and `x`,
 * no double, each unwritten too.
 */
const scaleTexts = {
  mastery: ["1", "x", undefined],
  maximum: ["3", "0.5", "x", undefined],
  minimum: ["0", "2", "x", undefined],
} as const;

/**
 * Every case: 2 × 3 declarations, 2 × 2 × 3 × 2 values, and 3 × 4 × 4 scales, 78 in all.
 */
const cases: readonly Case[] = [
  ...(["single", "record"] as const).flatMap((cardinality) =>
    writtenStates.map((baseType): Case => ({ baseType, cardinality, kind: "declaration" })),
  ),
  ...(["single", "record"] as const).flatMap((cardinality) =>
    [true, false].flatMap((field) =>
      writtenStates.flatMap((baseType) =>
        (["1", "x"] as const).map((text): Case => ({
          baseType,
          cardinality,
          field,
          kind: "field",
          text,
        })),
      ),
    ),
  ),
  ...scaleTexts.mastery.flatMap((mastery) =>
    scaleTexts.minimum.flatMap((minimum) =>
      scaleTexts.maximum.map((maximum): Case => ({ kind: "scale", mastery, maximum, minimum })),
    ),
  ),
];

/**
 * A `base-type` as a state writes it: an attribute spelling the type, none, or the type with a
 * space before it, which the preserving enumeration spells nothing as (spec reading 7).
 *
 * @param state - The state.
 * @param spelled - The type it spells.
 * @returns The attribute's text, with its leading space, or nothing.
 */
const baseTypeAttribute = (state: Written, spelled: string): string =>
  ({ spelled: ` base-type="${spelled}"`, unspelled: ` base-type=" ${spelled}"`, unwritten: "" })[
    state
  ];

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
 * Write a case's declaration, the item's one.
 *
 * @param drawn - The case.
 * @returns The declaration's XML.
 */
const declarationOf = (drawn: Case): string => {
  switch (drawn.kind) {
    case "declaration": {
      return `<qti-outcome-declaration identifier="O" cardinality="${drawn.cardinality}"${baseTypeAttribute(drawn.baseType, "float")}/>`;
    }
    case "field": {
      const own = drawn.cardinality === "record" ? "" : ' base-type="integer"';

      return `<qti-outcome-declaration identifier="O" cardinality="${drawn.cardinality}"${own}><qti-default-value><qti-value${optional("field-identifier", drawn.field ? "f" : undefined)}${baseTypeAttribute(drawn.baseType, "integer")}>${drawn.text}</qti-value></qti-default-value></qti-outcome-declaration>`;
    }
    case "scale": {
      return `<qti-outcome-declaration identifier="O" cardinality="single" base-type="float"${optional("mastery-value", drawn.mastery)}${optional("normal-minimum", drawn.minimum)}${optional("normal-maximum", drawn.maximum)}/>`;
    }
    default: {
      return drawn satisfies never;
    }
  }
};

/**
 * Write a case's package: an item holding its declaration, and the manifest that lists it, each
 * file's text encoded as UTF-8.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: Case): PackageEntries =>
  new Map(
    Object.entries({
      "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false">${declarationOf(drawn)}<qti-item-body><p>Hi</p></qti-item-body></qti-assessment-item>`,
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * The normal minimum of a scale case that writes none: QTI 3.0.1's XSD default, the version of the
 * box's manifest (information model §4.5.8: "Default = "0.0""; spec reading 149).
 */
const minimumDefault = "0.0";

/**
 * A scale case's normal minimum: the one it writes, or else {@link minimumDefault}.
 *
 * @param drawn - The case.
 * @returns The minimum's lexical form.
 */
const minimumOf = (drawn: ScaleCase): string => drawn.minimum ?? minimumDefault;

/**
 * Whether a scale text is a double, the language `Mastery_range` orders: every text of the box but
 * `x`.
 *
 * @param text - The text, none where unwritten.
 * @returns Its value, none where it is unwritten or no double.
 */
const doubleOf = (text: string | undefined): Option.Option<number> =>
  text === undefined || text === "x" ? Option.none() : Option.some(Number(text));

/**
 * Whether two scale attributes are written as doubles out of order.
 *
 * @param low - The one that must not be above.
 * @param high - The one that must not be below.
 * @returns Whether both are doubles and the first is above the second.
 */
const disordered = (low: string | undefined, high: string | undefined): boolean =>
  Option.match(Option.all([doubleOf(low), doubleOf(high)]), {
    onNone: () => false,
    onSome: ([l, h]) => l > h,
  });

/**
 * The laws a case breaks, by the specification:
 *
 * - **a declaration's base type** (information model tables 4.5.3: "Variables with record cardinality
 *   have no base-type", and every other variable's value space "is identified with a base-type"): a
 *   record that writes one and a single that writes none break Declaration base type; one spelling
 *   nothing breaks its value domain alone, since a preserving enumeration's padded form is no value
 *   (XML Schema 1.1 Part 2 §4.3.6; lane NIL's audit, B11);
 * - **a value's field attributes** (§7.46.1 and §7.46.2: each "is only used for" a value "that forms
 *   part of a record"): a record's value must write both, and any other set's value neither, or it
 *   breaks Value cardinality, where an attribute written counts as written whatever it spells; a
 *   base type spelling nothing breaks its value domain; the text breaks Typed value where it is no
 *   integer and the type it is read in, the set's, or a record's field's own where that spells one,
 *   is integer;
 * - **an outcome's scale** (reading 9: the Schematron's OUTCOMEDEC 1, each pair judged where both
 *   have a value, as `xs:double` values): a written mastery value below the minimum, written or
 *   3.0.1's default (reading 149), or above a written maximum breaks Mastery range; a text that is
 *   no double breaks its value domain.
 *
 * @param drawn - The case.
 * @returns The laws, empty where the case is lawful.
 */
const expectedOf = (drawn: Case): ReadonlySet<LawName> => {
  switch (drawn.kind) {
    case "declaration": {
      if (drawn.baseType === "unspelled") {
        return new Set(["value domain"]);
      }

      return (drawn.cardinality === "record") === (drawn.baseType === "spelled")
        ? new Set(["Declaration base type"])
        : new Set();
    }
    case "field": {
      const record = drawn.cardinality === "record";
      const baseWritten = drawn.baseType !== "unwritten";
      const counted = record ? drawn.field && baseWritten : !drawn.field && !baseWritten;
      const typed = record ? drawn.baseType === "spelled" : true;

      return new Set<LawName>([
        ...(counted ? [] : ["Value cardinality" as const]),
        ...(drawn.baseType === "unspelled" ? ["value domain" as const] : []),
        ...(typed && drawn.text === "x" ? ["Typed value" as const] : []),
      ]);
    }
    case "scale": {
      const texts = [drawn.mastery, drawn.minimum, drawn.maximum];

      return new Set<LawName>([
        ...(texts.includes("x") ? ["value domain" as const] : []),
        ...(disordered(minimumOf(drawn), drawn.mastery) || disordered(drawn.mastery, drawn.maximum)
          ? ["Mastery range" as const]
          : []),
      ]);
    }
    default: {
      return drawn satisfies never;
    }
  }
};

/**
 * The row a written scale attribute has, as a list of its fields, none where unwritten.
 *
 * @param value - The attribute's lexical form, none where unwritten.
 * @returns The rows' fields.
 */
const scaleRow = (value: string | undefined): readonly (readonly string[])[] =>
  value === undefined ? [] : [[value]];

/**
 * Hold a case's rows to what its declaration writes: each optional attribute's row exists exactly
 * where the attributes it reads are written (and, for a base type's code, spell one), holding them
 * as written.
 *
 * @param drawn - The case.
 * @param inputs - The import's rows.
 * @param label - The case, for a failure's message.
 */
const assertRows = (drawn: Case, inputs: PackageInputs, label: string): void => {
  switch (drawn.kind) {
    case "declaration": {
      assert.deepStrictEqual(
        [...inputs.DeclarationBaseType.values()].map(({ baseType, baseTypeLexical }) => [
          baseType,
          baseTypeLexical,
        ]),
        drawn.baseType === "spelled" ? [["float", "float"]] : [],
        `${label}: DeclarationBaseType`,
      );
      assert.deepStrictEqual(
        [...inputs.Declaration.values()].map(({ baseType }) => baseType),
        { spelled: ["float"], unspelled: [], unwritten: ["none"] }[drawn.baseType],
        `${label}: Declaration`,
      );
      break;
    }
    case "field": {
      const lexical = drawn.baseType === "spelled" ? "integer" : " integer";
      assert.deepStrictEqual(
        [...inputs.RecordField.values()].map(({ baseTypeLexical, identifierLexical }) => [
          identifierLexical,
          baseTypeLexical,
        ]),
        drawn.field && drawn.baseType !== "unwritten" ? [["f", lexical]] : [],
        `${label}: RecordField`,
      );
      assert.deepStrictEqual(
        [...inputs.ValueBaseType.values()].map(({ baseType, cardinality, text }) => [
          baseType,
          cardinality,
          text,
        ]),
        drawn.baseType === "spelled" ? [["integer", drawn.cardinality, drawn.text]] : [],
        `${label}: ValueBaseType`,
      );
      break;
    }
    case "scale": {
      assert.deepStrictEqual(
        [...inputs.MasteryValue.values()].map(({ lexical }) => [lexical]),
        scaleRow(drawn.mastery),
        `${label}: MasteryValue`,
      );
      assert.deepStrictEqual(
        [...inputs.NormalMinimum.values()].map(({ lexical, written }) => [lexical, written]),
        [[minimumOf(drawn), drawn.minimum !== undefined]],
        `${label}: NormalMinimum`,
      );
      assert.deepStrictEqual(
        [...inputs.NormalMaximum.values()].map(({ lexical }) => [lexical]),
        scaleRow(drawn.maximum),
        `${label}: NormalMaximum`,
      );
      assert.deepStrictEqual(
        [...inputs.MasteryFloor.values()].map(({ masteryValue, normalMinimum }) => [
          normalMinimum,
          masteryValue,
        ]),
        drawn.mastery === undefined ? [] : [[minimumOf(drawn), drawn.mastery]],
        `${label}: MasteryFloor`,
      );
      assert.deepStrictEqual(
        [...inputs.MasteryCeiling.values()].map(({ masteryValue, normalMaximum }) => [
          masteryValue,
          normalMaximum,
        ]),
        drawn.mastery === undefined || drawn.maximum === undefined
          ? []
          : [[drawn.mastery, drawn.maximum]],
        `${label}: MasteryCeiling`,
      );
      break;
    }
    default: {
      drawn satisfies never;
    }
  }
};

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
type Situation = "accepted" | "alone" | "pair" | "several";

layer(NodeServices.layer, { excludeTestServices: true })(
  "a declaration's optional attributes",
  (it) => {
    it.effect(
      "have a row exactly where written, and the law oracle, the import's rows and the specification give one verdict",
      (ctx) =>
        // Oracle: the specification as a checker by hand (`expectedOf`): the information model's
        // tables 4.5.3 and 7.46.1 to 7.46.2, XML Schema 1.1 Part 2 §4.3.6, and reading 9. Bound:
        // a single or a record declaration's base type in 3 states, a value's field identifier in
        // 2 and its base type in 3 under a single or a record set with an integer text or not, and
        // an outcome's mastery value, normal minimum and normal maximum each unwritten, in order,
        // out of order or no double: 78 packages, exhausted.
        searched(
          ctx,
          exhaust(
            {
              box: "a declaration's base type, a value's field attributes, and an outcome's scale, each written, unwritten or spelling nothing",
              caseHang: Duration.minutes(2),
              coverage: requiredInSpace<Situation>(["accepted", "alone", "several", "pair"]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => Formatter.format(cases[at]),
              oracle: {
                kind: "specification",
                name: "the information model's base-type, field and scale characteristics, by hand",
              },
              suite: "test/unwritten-declaration-attributes",
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
                  if (drawn.kind === "scale" && drawn.mastery !== undefined) {
                    c.note("pair");
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

                  // The host judges every law but Mastery range, and its refusal is named by the
                  // rule the catalog's precedence puts first, as the database's is. A declaration
                  // whose base type spells nothing has no row (B11), so its attributes' copies into
                  // it break too: deferred keys, which the value domain's immediate CHECK precedes
                  // in the database, and which the rule's precedence puts after it here.
                  const { broken } = judgeHost(hostRowsOf(inputs), hostLaws);
                  const brokenNames = broken.map(({ law }) =>
                    Option.getOrElse(lawNameOf(law), () => Formatter.format(law)),
                  );
                  const shown =
                    broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law";
                  const judgedExpected = [
                    ...[...expected].filter((law) => law !== "Mastery range"),
                    ...(drawn.kind === "declaration" && drawn.baseType === "unspelled"
                      ? ["Declaration overlay" as const]
                      : []),
                  ];
                  assert.sameMembers(
                    [...new Set(brokenNames)],
                    judgedExpected,
                    `${label}: the import's rows break ${shown}`,
                  );

                  const brokenLaws = broken.map(({ law }) => law);
                  const rule = Arr.isReadonlyArrayNonEmpty(brokenLaws)
                    ? ruleOfLaws(brokenLaws)
                    : Option.none();
                  const rules = [...expected].map((law) => ruleOf(law));

                  assert.isTrue(
                    Option.match(rule, {
                      onNone: () => judgedExpected.length === 0,
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
