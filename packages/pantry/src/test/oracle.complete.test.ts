/**
 * The law oracle's completeness (lane OL, R87's finding): every law the oracle declares is raised
 * by a package drawn to break it, and every law the schema states is one the oracle declares.
 *
 * R87 found laws the oracle named in its tables that no judgment of it could raise, so a test that
 * said "the law oracle predicts it" was vacuous for each. This file holds the oracle to its tables
 * both ways:
 *
 * - **Every declared law is raised.** For each law of `lawNames`, a mutation drawn to break exactly
 *   that law (`#pantry/test/oracle-complete/*.ts`) edits a generated package the oracle accepts,
 *   the every-relation package drawn by its member counts unless the mutation brings its own base,
 *   at a site and with a value it draws. The oracle must raise the law, and must raise no law whose
 *   rule stands ahead of the law's in the refusal's precedence (`#pantry/import/refusal.ts`
 *   `precedence`), the order the database names a refusal by, so the database would name the
 *   mutated package by the law's rule. A law over rows no package text can break is broken in the
 *   folded rows of one document instead, and judged by `documentBreaches`.
 * - **Every stated law is declared.** Each law of `lawTable` is the oracle's, or the oracle states it
 *   in parts (`statedInParts`), or no host predicate can judge it, with the reason
 *   (`hostlessLaws`).
 *
 * A law with no mutation yet is a row of {@link owed} with why, a list that only shrinks: a law
 * both owed and mutated fails, and so does a law neither owed nor mutated, so a law that joins the
 * oracle joins this file.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import type { Case } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { lawNames as statedLawNames, lawTable, precedence } from "#pantry/import/refusal.ts";
import type { FoldedRows } from "#pantry/model/folds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { memberCounts } from "#pantry/test/gen/every-relation.ts";
import type { MemberCounts, PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { documentMutations } from "#pantry/test/oracle-complete/documents.ts";
import { expressionMutations } from "#pantry/test/oracle-complete/expressions.ts";
import { layerMutations } from "#pantry/test/oracle-complete/layer.ts";
import {
  everyRelationBase,
  filesOf,
  foldedDocument,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";
import { overlayMutations } from "#pantry/test/oracle-complete/overlays.ts";
import { testMutations } from "#pantry/test/oracle-complete/tests.ts";
import { hostlessLaws, statedInParts } from "#pantry/test/oracle-laws.ts";
import {
  documentBreaches,
  judge,
  lawNames,
  lawsOf,
  ruleOf,
  shownBreach,
} from "#pantry/test/oracle.ts";
import type { Breach, LawName } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by, composed once for the file.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * Every law's mutation, by law, from each group's module.
 */
const mutations: Readonly<Partial<Record<LawName, Mutation>>> = {
  ...layerMutations,
  ...overlayMutations,
  ...documentMutations,
  ...expressionMutations,
  ...testMutations,
};

/**
 * The laws with no mutation yet, each with why: the list only shrinks.
 */
const owed: Readonly<Partial<Record<LawName, string>>> = {
  "AL1 admission": "its mutation is not written yet",
  "AL1 owner": "its mutation is not written yet",
  "AL2 count": "its mutation is not written yet",
  "AL2 distinct": "its mutation is not written yet",
  "AL2 fold": "its mutation is not written yet",
  "AL2 last slot": "its mutation is not written yet",
  "AL3 required": "its mutation is not written yet",
  "AL4 open name key": "its mutation is not written yet",
  "AL4 open names": "its mutation is not written yet",
  "AL5 attribute count": "its mutation is not written yet",
  "AreaMapping base type": "its mutation is not written yet",
  "Aria value range": "its mutation is not written yet",
  Arity: "its mutation is not written yet",
  "Attribute prefix": "its mutation is not written yet",
  "AttributeEntity owner": "its mutation is not written yet",
  "Binding cardinality": "its mutation is not written yet",
  "Binding declared": "its mutation is not written yet",
  "Binding unique": "its mutation is not written yet",
  BindingFit: "its mutation is not written yet",
  "Choice bounds": "its mutation is not written yet",
  "Choice identifier key": "its mutation is not written yet",
  "Choice not variable": "its mutation is not written yet",
  "Condition type": "no producer raises it yet (R87's finding)",
  "Context variable reference": "its mutation is not written yet",
  "Declaration base type": "no producer raises it yet (R87's finding)",
  "Declaration not reserved": "no producer raises it yet (R87's finding)",
  Document: "its mutation is not written yet",
  "Document entry": "its mutation is not written yet",
  "Document lang": "its mutation is not written yet",
  "DocumentId key": "its mutation is not written yet",
  "E1 derived": "its mutation is not written yet",
  "Equal tolerance": "its mutation is not written yet",
  "Feedback outcome type": "its mutation is not written yet",
  "Feedback reference": "its mutation is not written yet",
  "File exists": "its mutation is not written yet",
  "File listed": "its mutation is not written yet",
  "Foreign attribute class": "its mutation is not written yet",
  "Foreign element class": "its mutation is not written yet",
  "Foreign simple content": "its mutation is not written yet",
  "Fragment context": "its mutation is not written yet",
  "Graphic gap match default hotspot": "its mutation is not written yet",
  "Href form": "its mutation is not written yet",
  "Href listed": "its mutation is not written yet",
  "Idref target": "its mutation is not written yet",
  "Include fragment identifier": "its mutation is not written yet",
  "Include root": "its mutation is not written yet",
  "Include target": "its mutation is not written yet",
  "Inclusion cycle": "its mutation is not written yet",
  "Item duration": "no producer raises it yet (R87's finding)",
  "Key text bound": "its mutation is not written yet",
  "LOM learning resource type": "its mutation is not written yet",
  "Label tools": "its mutation is not written yet",
  "Literal lexical": "no producer raises it yet (R87's finding)",
  LomObjectIdentifier: "its mutation is not written yet",
  LomObjectTitle: "no producer raises it yet (R87's finding)",
  "Lookup table cardinality": "its mutation is not written yet",
  "Lookup type": "no producer raises it yet (R87's finding)",
  "Manifest id space": "its mutation is not written yet",
  "Map key": "its mutation is not written yet",
  MappableBaseType: "its mutation is not written yet",
  "Mapped response": "no producer raises it yet (R87's finding)",
  "Mastery range": "no producer raises it yet (R87's finding)",
  "MathML arity": "its mutation is not written yet",
  "MathML foreign element": "its mutation is not written yet",
  "Media source src": "its mutation is not written yet",
  "N1 one document node": "its mutation is not written yet",
  "N1 sentinel": "its mutation is not written yet",
  "N2 key": "its mutation is not written yet",
  "N2 mirrors": "its mutation is not written yet",
  "N4 kinds": "its mutation is not written yet",
  "N5 Follow": "its mutation is not written yet",
  "N5 admitted": "its mutation is not written yet",
  "N5 first slot": "its mutation is not written yet",
  "N5 fold": "its mutation is not written yet",
  "N6 ancestry": "its mutation is not written yet",
  "N7 Counted": "its mutation is not written yet",
  "N7 Last": "its mutation is not written yet",
  "N7 barred by": "its mutation is not written yet",
  "N7 empty family": "its mutation is not written yet",
  "N7 last slot": "its mutation is not written yet",
  "N8 nearest": "its mutation is not written yet",
  "Namespace family": "its mutation is not written yet",
  "Namespace name": "its mutation is not written yet",
  "Node key": "its mutation is not written yet",
  "One base": "no producer raises it yet (R87's finding)",
  OpenElementName: "its mutation is not written yet",
  "OpenElementName canonical": "its mutation is not written yet",
  "Operand fit": "no producer raises it yet (R87's finding)",
  "Outcome only": "no producer raises it yet (R87's finding)",
  "Picture source srcset": "its mutation is not written yet",
  "Printed variable reference": "its mutation is not written yet",
  "Quotation punctuation": "its mutation is not written yet",
  "Record field key": "no producer raises it yet (R87's finding)",
  RecordBindingFit: "its mutation is not written yet",
  "Reference type": "no producer raises it yet (R87's finding)",
  "Reserved type": "no producer raises it yet (R87's finding)",
  ResourceTypeOf: "its mutation is not written yet",
  RootOfType: "its mutation is not written yet",
  "Rounding figures": "its mutation is not written yet",
  "SSML lexicon reference": "its mutation is not written yet",
  "SSML trim mark": "its mutation is not written yet",
  "Selection bound": "its mutation is not written yet",
  "Self dependency": "its mutation is not written yet",
  "Set type": "no producer raises it yet (R87's finding)",
  "Slider bounds": "its mutation is not written yet",
  "Stimulus ref target": "its mutation is not written yet",
  "Strictly held": "its mutation is not written yet",
  "T1 document order": "its mutation is not written yet",
  "T2 root": "its mutation is not written yet",
  "T3 first child": "its mutation is not written yet",
  "T4 next sibling": "its mutation is not written yet",
  "T5 last child": "its mutation is not written yet",
  "T6 nonempty and leaf": "its mutation is not written yet",
  "Table headers": "its mutation is not written yet",
  "Template default type": "no producer raises it yet (R87's finding)",
  "Template reads": "no producer raises it yet (R87's finding)",
  "Template reference": "its mutation is not written yet",
  TextDomain: "its mutation is not written yet",
  "Track srclang": "its mutation is not written yet",
  "Typed attribute value": "its mutation is not written yet",
  "Typed value": "no producer raises it yet (R87's finding)",
  "Usage typed value": "its mutation is not written yet",
  "Value cardinality": "no producer raises it yet (R87's finding)",
  "Variable declared": "its mutation is not written yet",
  "Variable kind": "no producer raises it yet (R87's finding)",
  "Weighted base": "no producer raises it yet (R87's finding)",
  "XsiType available": "its mutation is not written yet",
  "XsiType derived": "its mutation is not written yet",
  "comment arm": "its mutation is not written yet",
  "default hotspot last slot": "its mutation is not written yet",
  "doctype arm": "its mutation is not written yet",
  "entityRef arm": "its mutation is not written yet",
  "pi arm": "its mutation is not written yet",
  "text arm": "its mutation is not written yet",
  "value domain": "its mutation is not written yet",
  "ws arm": "its mutation is not written yet",
};

/**
 * The laws the schema states that the oracle owes a declaration and a producer, each with why: the
 * list only shrinks.
 */
const owedStatements = {
  "Adaptive feedback": "a package can break it, and no producer states it yet",
  "Calendar date": "a package can break it, and no producer states it yet",
  "Dependency target": "a package can break it, and no producer states it yet",
  "Max strings required": "a package can break it, and no producer states it yet",
  "Variable reference copy": "a package can break it, and no producer states it yet",
  "XML production": "a row can break it, and no producer states it yet",
} as const satisfies Readonly<Record<string, string>>;

/**
 * Each rule's place in the refusal's precedence.
 */
const ranks: ReadonlyMap<string, number> = new Map(precedence.map((rule, at) => [rule, at]));

/**
 * Rank a rule by the refusal's precedence: the place the database names a refusal by.
 *
 * @param rule - The rule.
 * @returns Its index in `precedence`. Throws for a rule the precedence does not rank, which no law
 *   of the oracle may keep.
 */
const rankOf = (rule: string): number => {
  const rank = ranks.get(rule);
  if (rank === undefined) {
    throw new Error(`the refusal's precedence does not rank the rule ${rule}`);
  }

  return rank;
};

/**
 * The bases the mutations read, built once per base function and member counts, with whether the
 * oracle accepts each.
 */
const bases = new Map<string, PackageEntries>();

/**
 * Build a mutation's base for member counts, once.
 *
 * @param build - The base's function of member counts.
 * @param members - The counts.
 * @returns The base's entries.
 */
const baseOf = (
  build: (members: MemberCounts) => PackageEntries,
  members: MemberCounts,
): PackageEntries => {
  const key = `${build.name} ${JSON.stringify(members)}`;
  const cached = bases.get(key);
  if (cached !== undefined) {
    return cached;
  }

  const built = build(members);
  bases.set(key, built);

  return built;
};

/**
 * What the oracle finds wrong with each base the property has judged: its breaches, shown, or its
 * codec refusal.
 */
const baseFaults = new Map<PackageEntries, readonly string[]>();

/**
 * Judge a base once, for the precondition that the oracle accepts it.
 *
 * @param entries - The base.
 * @returns What the oracle finds wrong with it: its breaches, shown, or its codec refusal; none for a
 *   base it accepts.
 */
const faultsOf = (entries: PackageEntries) =>
  Effect.gen(function* judgeBase() {
    const cached = baseFaults.get(entries);
    if (cached !== undefined) {
      return cached;
    }

    const judgment = yield* judge(filesOf(entries), grammar, laws);
    const faults =
      judgment._tag === "Judged"
        ? judgment.breaches.map((breach) => shownBreach(breach, grammar))
        : [`the codec refuses it under ${judgment.rule}: ${judgment.detail}`];
    baseFaults.set(entries, faults);

    return faults;
  });

/**
 * The folded rows of each base document a rows mutation edits, by base and path.
 */
const foldedBases = new Map<string, FoldedRows<Composed>>();

/**
 * Hold a mutated package's breaches to its law: the oracle raises the law, and no law whose rule
 * stands ahead of the law's in the refusal's precedence.
 *
 * @param law - The law the mutation breaks.
 * @param breaches - The oracle's breaches of the mutated package.
 * @param literal - The case, for the assertion's message.
 */
const holdsTo = (law: LawName, breaches: readonly Breach[], literal: string): void => {
  const shown = breaches.map((breach) => `  ${shownBreach(breach, grammar)}`).join("\n");

  assert.isTrue(
    breaches.some((breach) => breach.law === law),
    `${law}: the oracle does not raise it on ${literal}; it raises:\n${shown}`,
  );

  const rank = rankOf(ruleOf(law));
  const ahead = breaches.filter((breach) => rankOf(ruleOf(breach.law)) < rank);

  assert.deepStrictEqual(
    ahead.map((breach) => breach.law),
    [],
    `${law} (rule ${ruleOf(law)}): the oracle raises laws ahead of it on ${literal}:\n${shown}`,
  );
};

/**
 * Judge one drawn case of a law's mutation.
 *
 * @param law - The law.
 * @param mutation - Its mutation.
 * @returns The property over the case's member counts.
 */
const property = (law: LawName, mutation: Mutation) => (members: MemberCounts, c: Case<string>) =>
  Effect.gen(function* breaksItsLaw() {
    const literal = JSON.stringify(members);
    const entries = baseOf(
      mutation.over === "package" ? (mutation.base ?? everyRelationBase) : everyRelationBase,
      members,
    );

    assert.deepStrictEqual(
      yield* faultsOf(entries),
      [],
      `${law}: the base ${literal} breaks a law before its mutation`,
    );

    if (mutation.over === "package") {
      const mutated = c.draw(mutation.mutate({ entries, members }, grammar));
      const judgment = yield* judge(filesOf(mutated), grammar, laws);

      assert.strictEqual(
        judgment._tag,
        "Judged",
        `${law}: the codec refuses the mutated ${literal}: ${judgment._tag === "CodecRefusal" ? `${judgment.rule} ${judgment.detail}` : ""}`,
      );

      holdsTo(law, judgment._tag === "Judged" ? judgment.breaches : [], literal);

      return;
    }

    const key = `${literal} ${mutation.document}`;
    const rows =
      foldedBases.get(key) ?? (yield* foldedDocument(entries, mutation.document, grammar));
    foldedBases.set(key, rows);

    assert.deepStrictEqual(
      documentBreaches(mutation.document, rows, laws).map((breach) => shownBreach(breach, grammar)),
      [],
      `${law}: the folded ${mutation.document} of ${literal} breaks a law before its mutation`,
    );

    const mutated = c.draw(mutation.mutate(rows, grammar));

    holdsTo(law, documentBreaches(mutation.document, mutated, laws), literal);
  });

describe("every law the oracle declares", () => {
  it("has a mutation, or is owed one with why, and never both", () => {
    const mutated = new Set(lawNames.filter((law) => mutations[law] !== undefined));
    const listed = new Set(lawNames.filter((law) => owed[law] !== undefined));

    assert.deepStrictEqual(
      lawNames.filter((law) => !mutated.has(law) && !listed.has(law)),
      [],
      "laws with no mutation that owed does not list",
    );
    assert.deepStrictEqual(
      [...mutated].filter((law) => listed.has(law)),
      [],
      "laws owed a mutation that have one: strike them from owed",
    );
    assert.deepStrictEqual(
      Object.keys(mutations).filter((law) => !lawNames.some((name) => name === law)),
      [],
      "mutations of laws the oracle does not declare",
    );
  });

  for (const law of lawNames) {
    const mutation = mutations[law];
    if (mutation !== undefined) {
      it.effect(
        `${law}: a package drawn to break it is refused by it, and by no law ahead of its rule`,
        (ctx) =>
          // Oracle: the specification as a checker. The law's own source names what breaks it,
          // and the mutation writes exactly that into a package the oracle accepts. Bound: the
          // eight member counts of the every-relation package (or the mutation's own base), each
          // case drawing the mutation's site and value; 8 runs.
          searched(
            ctx,
            explore(
              {
                caseHang: Duration.seconds(60),
                concurrency: 1,
                coverage: noCoverage,
                draw: drawn(memberCounts),
                kept: [],
                literal: JSON.stringify,
                oracle: {
                  kind: "specification",
                  name: `${law}'s source, written into an accepted package`,
                },
                runs: 8,
                shrink: completeShrink,
                steerEvery: 16,
                suite: `pantry/oracle-complete/${law}`,
              },
              property(law, mutation),
            ),
          ),
        300_000,
      );
    }
  }
});

describe("every law the schema states", () => {
  it("is the oracle's, stated by it in parts, judged by no host predicate, or owed, each with why", () => {
    const declared = new Set<string>(lawNames);
    for (const law of statedLawNames) {
      const ways = [
        declared.has(law) ? "declared" : "",
        Object.hasOwn(statedInParts, law) ? "in parts" : "",
        Object.hasOwn(hostlessLaws, law) ? "hostless" : "",
        Object.hasOwn(owedStatements, law) ? "owed" : "",
      ].filter((way) => way !== "");

      assert.strictEqual(ways.length, 1, `${law} is ${ways.join(" and ") || "nowhere"}`);
    }

    for (const [law, parts] of Object.entries(statedInParts)) {
      const stated = statedLawNames.find((name) => name === law);
      for (const part of parts) {
        const declaredPart = lawNames.find((name) => name === part);

        assert.isDefined(declaredPart, `${law}'s part ${part} is no oracle law`);
        assert.strictEqual(
          declaredPart === undefined ? "" : ruleOf(declaredPart),
          stated === undefined ? "" : lawTable[stated].rule,
          `${law}'s part ${part} keeps another rule`,
        );
      }
    }

    for (const [law, reason] of Object.entries(hostlessLaws)) {
      assert.isTrue(
        statedLawNames.some((name) => name === law),
        `${law} is hostless and the schema states no such law`,
      );
      assert.isAbove(reason.length, 0, `${law} is hostless without a reason`);
    }
  });
});
