/**
 * The bindings the fit laws judge, held three ways over one small scope (`#pantry/test/binding-
 * cases.ts`): the importer's rows, the law oracle, and the schema's fit relations read over those
 * rows.
 *
 * A binding whose name a response declaration of its item holds has its `BindingDeclaration` (an
 * item's own) or `PlacedBindingDeclaration` (in place) row, and one whose name none holds has none,
 * which "Binding declared" refuses (`#pantry/qti/interactions.ts`; lane NIL's audit, B1 and B2: a
 * missing value is a row of its own relation, never a sentinel). The fit laws read the declaration
 * rows, so they judge only a declared variable. Before it, an item binding `RESP`, which no
 * declaration names, was written beside a nil declaration of no base type and cardinality
 * `single`, and refused by the database under BindingFit and by the oracle under "Binding
 * declared" (lane N2's tier at dadbbbd4, the `undeclared-response` fixture).
 *
 * For every site and every state:
 *
 * - Every binding row of the site has exactly one declaration row where a response declaration holds
 *   its name, and none where none does; each declaration row names that declaration, never the nil
 *   uuid, and carries the cardinality its `Declaration` row holds;
 * - The oracle raises "Binding declared" exactly when no response declaration holds the name;
 * - Over a declaration that spells its cardinality, the oracle raises each fit law the closed
 *   `BindingFit` and `RecordBindingFit` say the schema's statements refuse over the declaration
 *   rows, and no other;
 * - Over one that writes none or none spelled, the oracle raises no fit law (the orchestrator's
 *   ruling of 2026-11-06), and the schema's statements refuse none over the `single` its
 *   `Declaration` row holds, as every site of the scope takes a single response. A site whose
 *   interaction does not would part them, until no `Declaration` row is written for such a
 *   cardinality (lane NIL's audit, B11).
 *
 * The database's own verdict over the same scope is `src/import/binding-fit.db.test.ts`'s.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import type { Addition } from "@bjornpagen/grizzle";
import { Duration, Effect } from "effect";
import { BindingFit, grammar, RecordBindingFit } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { anyTypeKinds, nilUuid } from "#pantry/qti/interactions.ts";
import type {
  BindingDeclaration,
  BoundVariable,
  PlacedBinding,
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
 * holds no row of, and for a string identifier's of a base type other than string.
 *
 * @param row - The declaration row.
 * @returns The law, or none.
 */
const misfitOf = (row: DeclarationRow): LawName | undefined => {
  if (row.attribute === "string-identifier") {
    return row.baseType === "string" ? undefined : "BindingFit";
  }

  if (anyTypeKinds.includes(row.kind)) {
    return undefined;
  }

  if (row.cardinality === "record") {
    return RecordBindingFit.rows.some(({ kind }) => kind === row.kind)
      ? undefined
      : "RecordBindingFit";
  }

  return BindingFit.rows.some(
    ({ baseType, cardinality, kind }) =>
      baseType === row.baseType && cardinality === row.cardinality && kind === row.kind,
  )
    ? undefined
    : "BindingFit";
};

/**
 * Hold one case: the importer's binding and declaration rows of the site, the schema's fit
 * relations over them and the oracle's breaches, to the case's expectation.
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

    const declared = [...program.inputs.Declaration.values()].find(
      ({ document, identifier, declarationKind }) =>
        document === item?.node &&
        identifier === expected.identifier &&
        declarationKind === "qti-response-declaration",
    );
    for (const row of declarations) {
      assert.notStrictEqual(
        row.declaration,
        nilUuid,
        `${label}: a declaration row names no declaration`,
      );
      assert.strictEqual(row.declaration, declared?.node, `${label}: the row's declaration`);
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

    const misfits = new Set(declarations.flatMap((row) => misfitOf(row) ?? []));
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
    assert.deepStrictEqual(
      [...misfits],
      [],
      `${label}: the schema's statements refuse the single a Declaration row holds for no cardinality written`,
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
