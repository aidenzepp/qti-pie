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
 *   rule stands ahead of the law's in the refusal's precedence (`#pantry/vocab/laws.ts`
 *   `precedence`), the order the database names a refusal by, so the database would name the
 *   mutated package by the law's rule. A law over rows no package text can break is broken in the
 *   folded rows of one document instead, and judged by `documentBreaches`.
 * - **Every stated law is declared.** Each law of `lawTable` is the oracle's, or the oracle states it
 *   in parts (`statedInParts`), or no host predicate can judge it, with the reason
 *   (`hostlessLaws`).
 *
 * A law no mutation can break alone is a row of {@link owed} with why, a list that only shrinks: a
 * law both owed and mutated fails, and so does a law neither owed nor mutated, so a law that joins
 * the oracle joins this file.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import type { Case, Kept } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { lawNames as statedLawNames } from "#pantry/import/refusal.ts";
import { lawTable, precedence } from "#pantry/vocab/laws.ts";
import type { FoldedRows } from "#pantry/model/folds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { int } from "@grizzle/testing/gen";
import { everyRelationPackage, memberCounts } from "#pantry/test/gen/every-relation.ts";
import type { MemberCounts, PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { documentMutations } from "#pantry/test/oracle-complete/documents.ts";
import { contentEdits } from "#pantry/test/oracle-complete/content-edits.ts";
import { foreignEdits } from "#pantry/test/oracle-complete/foreign-edits.ts";
import { expressionMutations } from "#pantry/test/oracle-complete/expressions.ts";
import { layerMutations } from "#pantry/test/oracle-complete/layer.ts";
import {
  everyRelationBase,
  filesOf,
  foldedDocument,
  textOf,
  withText,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";
import { overlayMutations } from "#pantry/test/oracle-complete/overlays.ts";
import { rowMutations } from "#pantry/test/oracle-complete/layer-rows.ts";
import { rowEdits } from "#pantry/test/oracle-complete/row-edits.ts";
import { nodeEdits } from "#pantry/test/oracle-complete/row-edits-nodes.ts";
import { packageMutations } from "#pantry/test/oracle-complete/packages.ts";
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
  ...packageMutations,
  ...rowMutations,
  ...rowEdits,
  ...nodeEdits,
  ...foreignEdits,
  ...contentEdits,
  ...documentMutations,
  ...expressionMutations,
  ...testMutations,
};

/**
 * The laws no mutation breaks alone, each with why: every edit that breaks one breaks a law ranked
 * ahead of it too. The list only shrinks.
 */
const owed: Readonly<Partial<Record<LawName, string>>> = {
  "Manifest id space":
    "every resource identifier and the manifest's are xs:ID values of one document, so a resource named as its manifest breaks DocumentId key, which ranks first, and the database names document-key: the law is shadowed (lane OL's finding)",
  "N2 mirrors":
    "each of xdm.ts's mirror corruptions (gap, duplicateSlot, countOffByOne) also leaves a family's last slot unread, which N7 last slot (union-count) refuses ahead of reachability; folds.oracle.test.ts holds each variant to its law",
  "Node key":
    "a second row of one id (xdm.ts secondParent) also moves the slots and intervals the fold laws read, N5 fold and N7 last slot among them, which rank ahead of reachability; folds.oracle.test.ts holds the variant to its law",
  "T2 root":
    "a second self-parented root also breaks E1's derived fields, which rank ahead of reachability; folds.oracle.test.ts holds the variant to its law",
};

/**
 * The laws the schema states that the oracle owes a declaration and a producer, each with why: the
 * list only shrinks.
 */
const owedStatements = {} as const satisfies Readonly<Record<string, string>>;

/**
 * The counterexamples each law's search keeps, by law: each replays before the search, by its
 * member counts and the draws its mutation made, and must still raise its law, by no law ahead of
 * its rule.
 */
const keptCases: Readonly<Partial<Record<LawName, readonly Kept<MemberCounts, string>[]>>> = {
  "AL1 owner": [
    {
      draws: "7.0",
      note: "TEST_SEED=4172436958's counterexample, whose owner-copy kind of the context declaration's identifier left CTX no ID and raised Idref target ahead of AL1 owner; drawn now among the attributes whose corruption isolates it",
      reaches: ["AL1 owner"],
      sketch: { choices: 2, hotspots: 1, hottexts: 1 },
    },
  ],
};

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
      c.note(law);

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
    c.note(law);
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
                kept: keptCases[law] ?? [],
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

/**
 * The every-relation package whose declarations the absent-cardinality search exhausts: its widest
 * member counts.
 */
const absentBase = everyRelationPackage({ choices: 3, hotspots: 2, hottexts: 2 });

/**
 * Every declaration the base's items and test write, by its document and its start tag, each a
 * site a declaration with no cardinality is written at.
 */
const declarationSites = [
  "items/item.xml",
  "items/item2.xml",
  "items/item3.xml",
  "test.xml",
].flatMap((path) =>
  [
    ...textOf(absentBase, path).matchAll(
      /<qti-(?:context|response|outcome|template)-declaration [^>]*cardinality="[^"]*"[^>]*>/gu,
    ),
  ].map((match) => ({ path, tag: match[0] })),
);

describe("a declaration that writes no cardinality", () => {
  it.effect(
    "is refused under required-attribute alone, an absent attribute no empty one",
    (ctx) =>
      // Oracle: the specification as a checker. AL3 refuses a declaration with no cardinality, and
      // no law that reads a declaration's cardinality judges the `single` the schema holds an
      // unwritten one as, so the oracle raises no other rule (the orchestrator's ruling of
      // 2026-11-06: an absent attribute is no empty one, and one cause is refused under one rule).
      // Bound: every declaration of the every-relation items and test, each its cardinality
      // dropped, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "every declaration of the every-relation items and test, its cardinality dropped",
            caseHang: Duration.seconds(60),
            coverage: noCoverage,
            generator: int(0, declarationSites.length - 1),
            limit: declarationSites.length,
            literal: String,
            oracle: { kind: "specification", name: "AL3's required cardinality, alone" },
            suite: "pantry/oracle-complete/absent-cardinality",
          },
          (at) =>
            Effect.gen(function* absentCardinality() {
              const site = declarationSites[at];
              assert.isDefined(site, `no declaration site ${String(at)}`);

              const { path, tag } = site ?? { path: "", tag: "" };
              const mutated = withText(
                absentBase,
                path,
                textOf(absentBase, path).replace(tag, tag.replace(/ cardinality="[^"]*"/u, "")),
              );
              const judgment = yield* judge(filesOf(mutated), grammar, laws);
              const rules =
                judgment._tag === "Judged"
                  ? judgment.breaches.map(({ law }) => ruleOf(law))
                  : [judgment.rule];

              assert.deepStrictEqual(
                [...new Set(rules)],
                ["required-attribute"],
                `${path} ${tag}:\n${judgment._tag === "Judged" ? judgment.breaches.map((breach) => shownBreach(breach, grammar)).join("\n") : judgment.detail}`,
              );
            }),
        ),
      ),
    300_000,
  );
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
