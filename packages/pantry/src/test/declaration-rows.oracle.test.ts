/**
 * Declarations that have no `Declaration` row (lane NIL's audit, B10 and B11), held three ways over
 * every declaration of the every-relation package: the law oracle, the importer's rows, and the
 * families and checks those rows feed.
 *
 * A declaration's row is written only where its `identifier` is written and names something, its
 * `cardinality` is written and spells a handle, and its `base-type` is unwritten or spells one
 * (`#pantry/import/overlays/declarations.ts` `typedDeclarationOf`). Before, one whose identifier or
 * cardinality was unwritten or spelled nothing still had a row, holding `""` and `single`: a
 * missing value as a sentinel. Its own `E1_derived` refused that row, and every row that copied it,
 * a binding's declaration row, a reference, a value set, a table, judged the `single`. grizzle
 * writes those flat relations before `Node`, whose AL3 is the law, and `Attribute`, whose value
 * domain is, so the import was refused under `derived` or a fit law where the oracle names AL3 or
 * the value domain alone (the ruling of 2026-11-06; lane N2's binding-fit tier).
 *
 * For every declaration of the every-relation items and test, under each state that leaves it no
 * row:
 *
 * - The oracle raises AL3's required attribute or the attribute's value domain at the declaration,
 *   and where only its cardinality or base type changed, nothing else;
 * - The importer writes no `Declaration` row for it, and no row anywhere names it: no base type,
 *   scale attribute or pair of them, value set, table, declaration table, binding declaration or
 *   reference whose `declaration` is its node;
 * - No family member names an owner the import writes no row of (`#pantry/test/family-owners.ts`),
 *   and every `ChoiceVariableName` row counts at least one choice, hottext or declaration, as its
 *   `E1_derived` requires, so no row of a relation grizzle writes before `Node` breaks a CHECK.
 *
 * The database's own verdict over the same scope is `src/import/declaration-rows.db.test.ts`'s.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Schema } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { NodeMember } from "#pantry/import/write.ts";
import {
  declarationCase,
  declarationSites,
  declarationStates,
  expectedRulesOf,
} from "#pantry/test/declaration-cases.ts";
import { orphansOf, rowsByRelation } from "#pantry/test/family-owners.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";

/**
 * The oracle's tables over the installed grammar, which the importer reads.
 */
const laws = lawsOf(grammar);

/**
 * Every (site, state) of the scope, by its number.
 */
const cases = declarationSites.flatMap((site) =>
  declarationStates.filter((state) => state.applies(site)).map((state) => ({ site, state })),
);

/**
 * The fields of a row this check reads: a `declaration`, a `parent`, a `node`, a `document`, an
 * `assembly` and an `identifier`, each where the row has it.
 */
const ReadSchema = Schema.Struct({
  assembly: Schema.optionalKey(Schema.String),
  declaration: Schema.optionalKey(Schema.String),
  document: Schema.optionalKey(Schema.String),
  identifier: Schema.optionalKey(Schema.String),
  node: Schema.optionalKey(Schema.String),
  parent: Schema.optionalKey(Schema.String),
});

/**
 * Read a row's fields this check reads.
 */
const readRow = Schema.decodeUnknownSync(ReadSchema);

/**
 * The relations a declaration's own rows sit in, each keyed by the declaration's node.
 */
const ownRows = [
  "Declaration",
  "DeclarationBaseType",
  "MasteryValue",
  "NormalMinimum",
  "NormalMaximum",
  "MasteryFloor",
  "MasteryCeiling",
  "DeclarationTable",
] as const;

/**
 * Hold one case: the oracle's rules at the declaration, and the importer's rows.
 *
 * @param at - The case's number.
 * @returns The check.
 */
const holds = (at: number) =>
  Effect.gen(function* declarationRowHolds() {
    const drawn = cases[at];
    assert.isDefined(drawn, `no case ${String(at)}`);
    if (drawn === undefined) {
      return;
    }

    const { site, state } = drawn;
    const label = `${site.path} ${site.identifier} ${state.name}`;
    const entries = declarationCase(site, state);

    const judgment = yield* judge(filesOf(entries), grammar, laws);
    assert.strictEqual(judgment._tag, "Judged", `${label}: the codec refuses the case`);

    const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
    const shown = breaches.map((breach) => `  ${shownBreach(breach, grammar)}`).join("\n");
    const rules = [...new Set(breaches.map(({ law }) => ruleOf(law)))].toSorted();
    const expected = expectedRulesOf(state);
    if (state.alone) {
      assert.deepStrictEqual(rules, expected, `${label}: the oracle's rules:\n${shown}`);
    } else {
      for (const rule of expected) {
        assert.include(rules, rule, `${label}: the oracle's rules:\n${shown}`);
      }
    }

    const { inputs } = yield* readProgram(yield* scopedPackage(entries));
    const document = [...inputs.Document.values()].find(({ path }) => path === site.path);
    const root = [...inputs.Node.values()].find(({ id }) => id === document?.node);
    const flat = (node: NodeMember): readonly NodeMember[] => [
      node,
      ...node.children.flatMap(flat),
    ];
    // The tree's nodes in document order, its pre-order: the site's place among its kind's.
    const declarationNode = (root === undefined ? [] : flat(root)).filter(
      ({ kind }) => kind === site.kind,
    )[site.ordinal]?.id;
    assert.isDefined(declarationNode, `${label}: its element has no Node row`);
    for (const relation of ownRows) {
      assert.isFalse(
        [...inputs[relation].keys()].includes(declarationNode ?? ""),
        `${label}: a ${relation} row stands for it`,
      );
    }

    for (const [relation, rows] of rowsByRelation(inputs)) {
      for (const row of rows) {
        const read = readRow(row);
        assert.notStrictEqual(
          read.declaration,
          declarationNode,
          `${label}: a ${relation} row names it`,
        );
        if (relation === "ValueSet") {
          assert.notStrictEqual(
            read.parent,
            declarationNode,
            `${label}: a value set hangs below it`,
          );
        }
      }
    }

    const orphans = orphansOf(inputs);
    assert.deepStrictEqual(
      orphans,
      [],
      `${label}: family members with no owner row: ${orphans.map(({ key, member, owner }) => `${member} ${key} into ${owner}`).join("; ")}`,
    );

    const counted = new Set(
      [
        ...[...inputs.Choice.values()].map(({ document: holder, identifier }) => [
          holder,
          identifier,
        ]),
        ...[...inputs.Hottext.values()].map(({ document: holder, identifier }) => [
          holder,
          identifier,
        ]),
        ...[...inputs.Declaration.values()].map(({ document: holder, identifier }) => [
          holder,
          identifier,
        ]),
        ...[...inputs.PlacedChoice.values()].map(({ assembly, identifier }) => [
          assembly,
          identifier,
        ]),
        ...[...inputs.PlacedHottext.values()].map(({ assembly, identifier }) => [
          assembly,
          identifier,
        ]),
      ].map((key) => JSON.stringify(key)),
    );
    for (const name of inputs.ChoiceVariableName.values()) {
      assert.isTrue(
        counted.has(JSON.stringify([name.document, name.identifier])),
        `${label}: ChoiceVariableName ${name.identifier} counts nothing`,
      );
    }
  }).pipe(Effect.scoped, Effect.provide(NodeServices.layer));

describe("declarations with no Declaration row (lane NIL's audit, B10 and B11)", () => {
  it.effect(
    "are refused by AL3 or the value domain, and no row stands for them or names them",
    (ctx) =>
      // Oracle: the specification as a checker (the law oracle), and the families and checks the
      // importer's rows feed, read over those rows. Bound: every declaration of the every-relation
      // items and test, under each state of its identifier, cardinality and base type that leaves
      // it no row, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "every declaration of the every-relation items and test, under each untyped state",
            caseHang: Duration.seconds(120),
            coverage: noCoverage,
            generator: int(0, cases.length - 1),
            limit: cases.length,
            literal: (at) => {
              const drawn = cases[at];

              return drawn === undefined
                ? String(at)
                : `${drawn.site.path} ${drawn.site.identifier} ${drawn.state.name}`;
            },
            oracle: { kind: "specification", name: "the law oracle, and the rows' own laws" },
            suite: "pantry/declaration-rows",
          },
          holds,
        ),
      ),
    1_800_000,
  );
});
