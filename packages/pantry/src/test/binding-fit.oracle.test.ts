/**
 * The bindings the fit laws judge, held three ways over one small scope (`#pantry/test/binding-
 * cases.ts`): the importer's rows, the law oracle, and the schema's fit relations read over those
 * rows.
 *
 * A binding whose name a response declaration of its item holds has its `BindingDeclaration` (an
 * item's own) or `PlacedBindingDeclaration` (in place) row, whatever the declaration's cardinality
 * spells, and one whose name none holds has none, which "Binding declared" refuses
 * (`#pantry/qti/interactions.ts`; lane NIL's audit, B1 and B2: a missing value is a row of its own
 * relation, never a sentinel; spec reading 159). The fit laws read the binding's
 * `BindingCardinality` or `PlacedBindingCardinality` row, which only a declaration whose
 * cardinality spells a code gives it, so they judge only a variable of a cardinality. Before it, an
 * item binding `RESP`, which no declaration names, was written beside a nil declaration of no base
 * type and cardinality `single`, and refused by the database under BindingFit and by the oracle
 * under "Binding declared" (lane N2's tier at dadbbbd4, the `undeclared-response` fixture).
 *
 * For every site and every state:
 *
 * - Every binding row of the site has exactly one declaration row where a response declaration holds
 *   its name, and none otherwise; each declaration row names that declaration's
 *   `DeclarationIdentifier`, never the nil uuid, and counts its cardinality, 1 where it spells
 *   one;
 * - Every declaration row has exactly one cardinality row where the declaration spells its
 *   cardinality, carrying the cardinality its `DeclarationCardinality` row holds, and none
 *   otherwise;
 * - The oracle raises "Binding declared" exactly when no response declaration holds the name;
 * - Over a declaration that spells its cardinality, the oracle raises each fit law the closed
 *   `BindingFit` and `RecordBindingFit` say the schema's statements refuse over the cardinality
 *   rows, and no other;
 * - Over one that writes none or none spelled, the oracle raises no fit law (the orchestrator's
 *   ruling of 2026-11-06), and the importer writes no `DeclarationCardinality` row for it and no
 *   cardinality row beside its bindings, so no law reads a cardinality it does not have (spec
 *   readings 158 and 159: a missing value is a row of its own relation, never a sentinel).
 *
 * The database's own verdict over the same scope is `src/import/binding-fit.db.test.ts`'s.
 *
 * A gap match interaction with two or more gaps binds a response of multiple cardinality (spec
 * reading 169, information model §5.57): the law oracle and the schema's laws over the import's
 * rows (`#pantry/test/host-judge.ts`) break "Binding cardinality" together exactly where a gap
 * match of two gaps binds a single response, whatever its `max-associations`.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import type { Addition } from "@bjornpagen/grizzle";
import { Duration, Effect, Option } from "effect";
import { Qti } from "#pantry/qti/schema.ts";
import { BindingFit, grammar, RecordBindingFit } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { anyTypeKinds } from "#pantry/qti/interactions.ts";
import type {
  BindingBaseType,
  BindingCardinality,
  BindingDeclaration,
  BoundVariable,
  PlacedBinding,
  PlacedBindingBaseType,
  PlacedBindingCardinality,
  PlacedBindingDeclaration,
} from "#pantry/qti/interactions.ts";
import {
  bindingCase,
  bindingSites,
  bindingStates,
  expectationOf,
} from "#pantry/test/binding-cases.ts";
import type { BindingSite, BindingState } from "#pantry/test/binding-cases.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge as judgeHost, judgedLaws } from "#pantry/test/host-judge.ts";
import { lawNamesOf } from "#pantry/test/host-law-names.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf, shownBreach } from "#pantry/test/oracle.ts";
import type { Breach, LawName } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 45.5 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * The every-relation package the cases edit.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * A binding row the importer writes, an item's own or one in place.
 */
type BindingRow = Addition<typeof BoundVariable> | Addition<typeof PlacedBinding>;

/**
 * A declaration row the importer writes beside a declared binding, an item's own or one in place.
 */
type DeclarationRow =
  | Addition<typeof BindingDeclaration>
  | Addition<typeof PlacedBindingDeclaration>;

/**
 * A bound variable's cardinality row the importer writes, an item's own or one in place.
 */
type CardinalityRow =
  | Addition<typeof BindingCardinality>
  | Addition<typeof PlacedBindingCardinality>;

/**
 * A bound variable's base type row the importer writes, an item's own or one in place.
 */
type BaseTypeRow = Addition<typeof BindingBaseType> | Addition<typeof PlacedBindingBaseType>;

/**
 * The laws that judge a binding's type.
 */
const fitLaws: ReadonlySet<LawName> = new Set([
  "BindingFit",
  "Binding cardinality",
  "Max strings required",
  "RecordBindingFit",
]);

/**
 * The fit law the schema's statements refuse a typed binding under, by the closed relations they
 * contain it in: none for an interaction of any type; `RecordBindingFit` for a record its kind does
 * not take; `BindingFit` for a typed response whose (base type, cardinality, kind) `BindingFit`
 * holds no row of, and for a string identifier's record, which has no base type, or variable of a
 * base type other than string. A variable of no base type that is no record is judged by no fit
 * law over its base type: Declaration base type refuses it alone (lane NIL's audit, B12).
 *
 * @param row - The cardinality row.
 * @param baseType - Its `BindingBaseType` or `PlacedBindingBaseType` row's base type, none where
 *   it has none.
 * @returns The law, or none.
 */
const misfitOf = (row: CardinalityRow, baseType: Option.Option<string>): LawName | undefined => {
  if (row.attribute === "string-identifier") {
    return row.cardinality === "record" || Option.exists(baseType, (held) => held !== "string")
      ? "BindingFit"
      : undefined;
  }

  if (anyTypeKinds.includes(row.kind)) {
    return undefined;
  }

  if (row.cardinality === "record") {
    return RecordBindingFit.rows.some(({ kind }) => kind === row.kind)
      ? undefined
      : "RecordBindingFit";
  }

  return Option.exists(
    baseType,
    (held) =>
      !BindingFit.rows.some(
        (fit) =>
          fit.baseType === held && fit.cardinality === row.cardinality && fit.kind === row.kind,
      ),
  )
    ? "BindingFit"
    : undefined;
};

/**
 * Hold one case: the importer's binding, declaration and cardinality rows of the site, the
 * schema's fit relations over them and the oracle's breaches, to the case's expectation.
 *
 * @param site - The site.
 * @param state - The state.
 * @returns The check.
 */
const holds = (site: BindingSite, state: BindingState) =>
  Effect.gen(function* bindingHolds() {
    const label = `${site.kind} ${site.attribute} ${site.identifier} ${state}`;
    const expected = expectationOf(site, state);
    const entries = bindingCase(base, site, state);
    const program = yield* readProgram(yield* scopedPackage(entries));
    const item = [...program.inputs.Document.values()].find(({ path }) => path === site.declared);
    const ofSite = <Row extends BindingRow | DeclarationRow>(rows: Iterable<Row>) =>
      [...rows].filter(
        (row) =>
          row.attribute === site.attribute &&
          row.kind === site.kind &&
          row.identifier === expected.identifier,
      );
    const bindings: readonly BindingRow[] = [
      ...ofSite(program.inputs.BoundVariable.values()).filter(
        ({ document }) => document === item?.node,
      ),
      ...ofSite(program.inputs.PlacedBinding.values()).filter(
        ({ assembly }) => assembly === item?.node,
      ),
    ];
    const declarations: readonly DeclarationRow[] = [
      ...ofSite(program.inputs.BindingDeclaration.values()).filter(
        ({ document }) => document === item?.node,
      ),
      ...ofSite(program.inputs.PlacedBindingDeclaration.values()).filter(
        ({ assembly }) => assembly === item?.node,
      ),
    ];

    assert.isNotEmpty(bindings, `${label}: the importer writes no binding row`);
    assert.strictEqual(
      declarations.length,
      expected.declared ? bindings.length : 0,
      `${label}: ${String(declarations.length)} declaration rows beside ${String(bindings.length)} bindings`,
    );

    const bindingKey = (row: BaseTypeRow | CardinalityRow | DeclarationRow): string =>
      JSON.stringify(["instance" in row ? row.instance : "", row.node, row.attribute]);
    const declaredKeys = new Set(declarations.map(bindingKey));
    const cardinalities: readonly CardinalityRow[] = [
      ...program.inputs.BindingCardinality.values(),
      ...program.inputs.PlacedBindingCardinality.values(),
    ].filter((row) => declaredKeys.has(bindingKey(row)));
    assert.strictEqual(
      cardinalities.length,
      expected.typed ? declarations.length : 0,
      `${label}: ${String(cardinalities.length)} cardinality rows beside ${String(declarations.length)} declaration rows`,
    );

    const declared = [...program.inputs.DeclarationIdentifier.values()].find(
      ({ document, identifier, declarationKind }) =>
        document === item?.node &&
        identifier === expected.identifier &&
        declarationKind === "qti-response-declaration",
    );
    for (const row of declarations) {
      assert.strictEqual(row.declaration, declared?.node, `${label}: the row's declaration`);
      assert.strictEqual(
        row.cardinalities,
        expected.typed ? 1n : 0n,
        `${label}: the row's count of cardinalities`,
      );
    }
    for (const row of cardinalities) {
      assert.strictEqual(
        row.declaration,
        declared?.node,
        `${label}: the cardinality's declaration`,
      );
      assert.strictEqual(row.cardinality, expected.held, `${label}: the row's cardinality`);
    }

    const judgment = yield* judge(filesOf(entries), grammar, laws);
    assert.strictEqual(judgment._tag, "Judged", `${label}: the codec refuses the case`);

    const breaches = (judgment._tag === "Judged" ? judgment.breaches : []).filter(
      (breach: Breach) =>
        breach.document === site.declared && breach.keys["identifier"] === expected.identifier,
    );
    const shown = breaches.map((breach) => `  ${shownBreach(breach, grammar)}`).join("\n");
    const raised = new Set(breaches.map(({ law }) => law));

    assert.strictEqual(
      raised.has("Binding declared"),
      !expected.declared,
      `${label}: Binding declared, of the breaches:\n${shown}`,
    );

    const baseTypes = new Map(
      [
        ...program.inputs.BindingBaseType.values(),
        ...program.inputs.PlacedBindingBaseType.values(),
      ].map((row) => [bindingKey(row), row.baseType] as const),
    );
    const misfits = new Set(
      cardinalities.flatMap(
        (row) => misfitOf(row, Option.fromUndefinedOr(baseTypes.get(bindingKey(row)))) ?? [],
      ),
    );
    if (expected.typed) {
      for (const law of ["BindingFit", "RecordBindingFit"] as const) {
        assert.strictEqual(
          raised.has(law),
          misfits.has(law),
          `${label}: ${law}, which the schema's statements ${misfits.has(law) ? "raise" : "do not raise"} over the importer's rows, of the breaches:\n${shown}`,
        );
      }

      return;
    }

    assert.deepStrictEqual(
      [...raised].filter((law) => fitLaws.has(law)),
      [],
      `${label}: a fit law judges an untyped binding:\n${shown}`,
    );
    assert.isFalse(
      [...program.inputs.DeclarationCardinality.values()].some(
        ({ node }) => node === declared?.node,
      ),
      `${label}: a DeclarationCardinality row stands for a declaration whose cardinality is unwritten or spells nothing`,
    );
  });

/**
 * Every (site, state) of the scope, by its number.
 */
const cases = bindingSites.flatMap((site) => bindingStates.map((state) => ({ site, state })));

describe("the bindings the fit laws judge", () => {
  layer(NodeServices.layer)("over the every-relation package", (it) => {
    it.effect(
      "have a declaration row exactly where declared, which the schema's fit relations judge as the oracle does",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against the importer's rows and the
        // schema's closed fit relations read over them. Bound: every site of
        // binding-cases.ts (a choice, a slider, a custom interaction, a text entry's string
        // identifier and a placed fragment's text entry) under every state (renamed to an
        // undeclared name, an outcome or a built-in; its declaration's cardinality dropped,
        // empty, unspelled, padded or each of the four spelled), exhausted.
        searched(
          ctx,
          exhaust(
            {
              box: "every binding site of binding-cases.ts under every state",
              caseHang: Duration.seconds(60),
              coverage: noCoverage,
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const drawn = cases[at];

                return drawn === undefined ? String(at) : `${drawn.site.identifier} ${drawn.state}`;
              },
              oracle: { kind: "second-implementation", name: "the law oracle's binding laws" },
              suite: "pantry/binding-fit",
            },
            (at) =>
              Effect.gen(function* bindingCaseHolds() {
                const drawn = cases[at];
                assert.isDefined(drawn, `no case ${String(at)}`);
                if (drawn !== undefined) {
                  yield* holds(drawn.site, drawn.state);
                }
              }).pipe(Effect.scoped),
          ),
        ),
      testTimeoutMs,
    );
  });
});

/**
 * One gap match case: its gaps, its `max-associations` where written, the cardinality of the
 * response it binds, and whether "Binding cardinality" breaks, by hand from reading 169 and
 * reading 92.
 */
interface GapCase {
  readonly breaks: boolean;
  readonly cardinality: "multiple" | "single";
  readonly gaps: number;
  readonly most: Option.Option<string>;
}

/**
 * The gap match cases: two gaps bound single, with `max-associations` unwritten (its default 1)
 * and with it 2; two gaps bound multiple; one gap bound single.
 */
const gapCases: readonly GapCase[] = [
  { breaks: true, cardinality: "single", gaps: 2, most: Option.none() },
  { breaks: false, cardinality: "multiple", gaps: 2, most: Option.none() },
  { breaks: false, cardinality: "single", gaps: 1, most: Option.none() },
  { breaks: true, cardinality: "single", gaps: 2, most: Option.some("2") },
];

/**
 * The QTI 3.0 namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write an XML document: its declaration, then its text.
 *
 * @param text - The document's root element.
 * @returns The document's bytes.
 */
const xml = (text: string): Uint8Array =>
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>\n${text}\n`);

/**
 * Build a gap match case's package: a manifest and an item that declares the directed pair response
 * `R` and binds it to a gap match interaction of one gap text and the case's gaps.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const gapPackageOf = (drawn: GapCase): PackageEntries => {
  const most = Option.match(drawn.most, {
    onNone: () => "",
    onSome: (value) => ` max-associations="${value}"`,
  });
  const gaps = Array.from(
    { length: drawn.gaps },
    (_, at) => `<qti-gap identifier="G${String(at + 1)}"/>`,
  ).join(" and ");

  return new Map([
    [
      "imsmanifest.xml",
      xml(
        '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="R0" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>',
      ),
    ],
    [
      "item.xml",
      xml(
        `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" adaptive="false" time-dependent="false"><qti-response-declaration identifier="R" cardinality="${drawn.cardinality}" base-type="directedPair"/><qti-item-body><qti-gap-match-interaction response-identifier="R"${most}><qti-gap-text identifier="T" match-max="2">word</qti-gap-text><p>Put it at ${gaps}.</p></qti-gap-match-interaction></qti-item-body></qti-assessment-item>`,
      ),
    ],
  ]);
};

describe("a gap match interaction's gaps", () => {
  layer(NodeServices.layer, { excludeTestServices: true })("over a one-item package", (it) => {
    it.effect(
      "break Binding cardinality where two or more bind a single response, the law oracle and the import's rows alike",
      () =>
        // Oracle: two implementations side by side, the law oracle's binding laws and the schema's
        // laws over the import's rows, and reading 169's verdict written by hand. Bound: a gap
        // match of one or two gaps bound single or multiple, with max-associations unwritten or 2.
        Effect.forEach(
          gapCases,
          (drawn) =>
            Effect.scoped(
              Effect.gen(function* gapCaseHolds() {
                const label = `${String(drawn.gaps)} gaps bound ${drawn.cardinality}, max-associations ${Option.getOrElse(drawn.most, () => "unwritten")}`;
                const dir = yield* scopedPackage(gapPackageOf(drawn));
                const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
                assert.strictEqual(judgment._tag, "Judged", label);

                const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
                const oracle = new Set<string>(breaches.map(({ law }) => law));
                const program = yield* readProgram(dir);
                const host = judgeHost(hostRowsOf(program.inputs), judgedLaws(Qti));
                const broken = lawNamesOf(host.broken);
                const unjudged = lawNamesOf(host.skipped);
                const shown = [
                  ...[...broken]
                    .filter((law) => !oracle.has(law))
                    .map((law) => `import-only-law: ${law}`),
                  ...[...oracle]
                    .filter((law) => !broken.has(law) && !unjudged.has(law))
                    .map((law) => `oracle-only-law: ${law}`),
                ].toSorted();

                assert.deepStrictEqual(
                  shown,
                  [],
                  `${label}: the oracle breaks ${[...oracle].toSorted().join(", ") || "no law"}; the import's rows break ${[...broken].toSorted().join(", ") || "no law"}`,
                );
                assert.strictEqual(
                  breaches.filter(({ law }) => law === "Binding cardinality").length,
                  drawn.breaks ? 1 : 0,
                  `${label}: the oracle's Binding cardinality breaches`,
                );
                assert.strictEqual(
                  broken.has("Binding cardinality"),
                  drawn.breaks,
                  `${label}: the import's rows break ${[...broken].toSorted().join(", ") || "no law"}`,
                );
              }),
            ),
          { discard: true },
        ),
    );
  });
});
