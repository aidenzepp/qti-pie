/**
 * Declarations whose cardinality or base type spells nothing (lane NIL's audit, B11; spec reading
 * 158), held three ways over every declaration of the every-relation package: the law oracle, the
 * importer's rows, and the families and checks those rows feed.
 *
 * A declaration has its row, and every row below it, whatever its attributes spell; its
 * cardinality and its base type are each a row of its own, written only where the attribute is
 * written and spells a code (`#pantry/import/overlays/declarations.ts` `typedDeclarationOf`), as
 * its identifier is (spec reading 157). Before, one whose cardinality was unwritten or spelled
 * nothing had a row holding `""` and `single`: a missing value as a sentinel, which its own
 * `E1_derived` refused and every row that copied it judged; then it had no row at all, so the
 * copies its children ask broke beside its own law.
 *
 * For every declaration of the every-relation items and test, under each state that leaves its
 * cardinality or its base type spelling nothing:
 *
 * - The oracle raises AL3's required attribute or the attribute's value domain at the declaration,
 *   and where only its cardinality or base type changed, nothing else;
 * - The importer writes its `Declaration` row and its value sets, and no typed row of the edited
 *   attribute: no `DeclarationCardinality`, and so no name, nor any row that reads a cardinality,
 *   binds or references it, for a cardinality; no `DeclarationBaseType`, nor any row that reads a
 *   base type of it, for a base type;
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
 * The relations whose rows hang from a declaration whatever its cardinality spells, each naming it
 * by its `declaration`: its values and its tables. Every other row that names it reads its
 * cardinality, binds or references it.
 */
const hanging: ReadonlySet<string> = new Set([
  "AreaMapping",
  "DeclarationTable",
  "LookupTable",
  "LookupValue",
  "LookupValueType",
  "Mapping",
  "MappingBaseType",
  "Value",
]);

/**
 * The relations whose rows read a declaration's base type, each naming it by its `declaration`.
 */
const baseTypeReaders: ReadonlySet<string> = new Set([
  "DeclaredValue",
  "LookupValueType",
  "MappingBaseType",
]);

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

    const node = declarationNode ?? "";
    const cardinal = state.attribute === "cardinality";
    assert.isTrue(inputs.Declaration.has(node), `${label}: it has no Declaration row`);
    assert.isFalse(
      (cardinal ? inputs.DeclarationCardinality : inputs.DeclarationBaseType).has(node),
      `${label}: a typed row stands for its ${state.attribute}`,
    );
    if (cardinal) {
      assert.isFalse(inputs.DeclarationName.has(node), `${label}: a name types it`);
    }

    for (const [relation, rows] of rowsByRelation(inputs)) {
      for (const row of rows) {
        const named = readRow(row).declaration === node;
        assert.isFalse(
          named && (cardinal ? !hanging.has(relation) : baseTypeReaders.has(relation)),
          `${label}: a ${relation} row reads what it does not spell`,
        );
      }
    }

    const sets = (root === undefined ? [] : flat(root))
      .filter(({ id }) => id === node)
      .flatMap(({ children }) => children)
      .filter(({ kind }) => kind === "qti-default-value" || kind === "qti-correct-response");
    for (const set of sets) {
      assert.isTrue(inputs.ValueSet.has(set.id), `${label}: a value set below it has no row`);
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
        ...[...inputs.DeclarationName.values()].map(({ document: holder, identifier }) => [
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

describe("declarations whose cardinality or base type spells nothing (spec reading 158)", () => {
  it.effect(
    "keep their rows, are refused by AL3 or the value domain alone, and no row reads what they do not spell",
    (ctx) =>
      // Oracle: the specification as a checker (the law oracle), and the families and checks the
      // importer's rows feed, read over those rows. Bound: every declaration of the every-relation
      // items and test, under each state of its cardinality and base type that spells nothing,
      // exhausted.
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
