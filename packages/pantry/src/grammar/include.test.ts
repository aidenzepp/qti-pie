import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter } from "effect";
import { documentRoots, fragmentRoots } from "#pantry/grammar/facets.ts";
import { includeKind } from "#pantry/grammar/include.ts";
import {
  ChildGrammar,
  ContentModelOf,
  Follow,
  grammar,
  IncludeParentKind,
  IncludeRoot,
  Last,
  SharedModelOf,
  Symbol as ContentSymbol,
} from "#pantry/grammar/install.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 1.2 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * How long one search here may take: it walks 155 families of rows the module holds, so a minute
 * only bounds a hang.
 */
const caseHang = Duration.minutes(1);

/**
 * The model each (version, parent) family reads.
 */
const modelOf = new Map(
  ContentModelOf.rows.map((row) => [`${row.version} ${row.parent}`, row.model]),
);

/**
 * Each model's Follow, as `model from` to the set of positions that follow.
 */
const follows = Map.groupBy(Follow.rows, (row) => `${row.model} ${row.from}`);

/**
 * Each model's Follow read backward, as `model to` to the positions it follows.
 */
const precedes = Map.groupBy(Follow.rows, (row) => `${row.model} ${row.to}`);

/**
 * Each model's last positions, as `model position`.
 */
const lasts = new Set(Last.rows.map((row) => `${row.model} ${row.position}`));

/**
 * Each shared model's positions of a kind, as `model kind`.
 */
const symbols = Map.groupBy(ContentSymbol.rows, (row) => `${row.model} ${row.kind}`);

/**
 * Each family's admitted children with their position cells, by `version parent`.
 */
const admitted = Map.groupBy(ChildGrammar.rows, (row) => `${row.version} ${row.parent}`);

/**
 * The (version, include parent) families `IncludeRoot` holds, each with its parent's kind.
 */
const includeFamilies = [
  ...new Map(
    IncludeRoot.rows.map((row) => {
      const kind = IncludeParentKind.rows.find(({ parent }) => parent === row.parent)?.kind ?? "";

      return [
        `${row.version} ${kind}`,
        { kind, parent: row.parent, version: row.version },
      ] as const;
    }),
  ).values(),
];

/**
 * Read the positions a kind takes under a family: its one position, or a shared kind's positions
 * through `Symbol`.
 *
 * @param family - The family, `version parent`.
 * @param kind - The kind.
 * @returns Its positions, none for a kind the family does not admit.
 */
const positionsOf = (family: string, kind: string): readonly string[] => {
  const cell = admitted.get(family)?.find(({ child }) => child === kind)?.position;
  if (cell === undefined) {
    return [];
  }

  if (cell !== "0") {
    return [cell];
  }

  const shared = SharedModelOf.rows.find((row) => `${row.version} ${row.parent}` === family)?.model;

  return (symbols.get(`${shared ?? ""} ${kind}`) ?? []).map(({ position }) => position);
};

/**
 * Write a position's place in its model's automaton: the positions it follows, those that follow
 * it, and whether a family may end on it. Two positions with one signature accept the same words
 * with either in place of the other.
 *
 * @param model - The model.
 * @param position - The position.
 * @returns The signature.
 */
const signatureOf = (model: string, position: string): string => {
  const out = (follows.get(`${model} ${position}`) ?? []).map(({ to }) => to).toSorted();
  const into = (precedes.get(`${model} ${position}`) ?? []).map(({ from }) => from).toSorted();

  return `${out.join(",")} | ${into.join(",")} | ${String(lasts.has(`${model} ${position}`))}`;
};

/**
 * Name the class of content an include parent holds, the coverage's feature.
 *
 * @param kind - The parent's kind.
 * @returns The class.
 */
const classOf = (kind: string): "content" | "processing" | "section" => {
  if (kind === "qti-assessment-section") {
    return "section";
  }

  return kind.includes("processing") || kind.includes("-if") || kind.includes("-else")
    ? "processing"
    : "content";
};

/**
 * Read the kinds `IncludeRoot` lets an include under a parent stand for.
 *
 * @param version - The schema version.
 * @param kind - The parent's kind.
 * @returns The kinds.
 */
const rootsUnder = (version: string, kind: string): ReadonlySet<string> =>
  new Set(
    IncludeRoot.rows
      .filter(
        (row) =>
          row.version === version &&
          IncludeParentKind.rows.some(
            ({ kind: parentKind, parent }) => parent === row.parent && parentKind === kind,
          ),
      )
      .map((row) => row.kind),
  );

describe("IncludeRoot", () => {
  it.effect(
    "steps each parent's automaton as its root would: the include takes one position, and every kind it stands for takes a position of the same signature",
    (ctx) =>
      // Oracle: the installed Glushkov automaton (ChildGrammar, Follow, Last and Symbol), a second
      // implementation of include.ts's choice-group reading of the IR. A kind whose position has
      // the include's signature is accepted in its place by every word the include is, so N5,
      // stepping the include at its own position, judges the merged document (spec reading 114).
      // Bound: every (version, include parent) family IncludeRoot holds, 155, each with every kind.
      searched(
        ctx,
        exhaust(
          {
            box: "every (version, include parent) family IncludeRoot holds, every kind",
            caseHang,
            coverage: requiredInSpace<"content" | "processing" | "section">([
              "content",
              "processing",
              "section",
            ]),
            generator: int(0, includeFamilies.length - 1),
            limit: includeFamilies.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the installed content automaton" },
            suite: "grammar/include/positions",
          },
          (index, c) =>
            Effect.sync(() => {
              const { kind, parent, version } = Arr.getUnsafe(includeFamilies, index);
              const family = `${version} ${kind}`;
              const model = modelOf.get(family) ?? "";
              const own = positionsOf(family, includeKind);
              c.note(classOf(kind));

              assert.lengthOf(own, 1, `${family}: the include's positions`);

              const signature = signatureOf(model, Arr.getUnsafe(own, 0));
              for (const row of IncludeRoot.rows) {
                if (row.version === version && row.parent === parent) {
                  assert.isTrue(
                    positionsOf(family, row.kind).some(
                      (position) => signatureOf(model, position) === signature,
                    ),
                    `${family}: ${row.kind} takes no position equivalent to the include's`,
                  );
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it("holds no family where only a wildcard admits an include, and the information model's classes where a particle does", () => {
    // Oracle: the information model as a checker. Table 9.4.1 lists Include's parent classes, and
    // none is a wildcard; SectionPart's children are item refs, sections, section refs and
    // includes (§6.46); the response rules' group holds the response condition, its fragment,
    // exit, lookup and set (ResponseRuleGroup), the outcome rules' the outcome condition, its
    // fragment, exit, lookup and set (OutcomeRule). Bound: the six wildcard parents the census
    // found, and the three class parents, in both versions.
    for (const version of grammar.kinds.versions.handles) {
      for (const wildcard of [
        "qti-custom-interaction",
        "qti-ordering",
        "template",
        "qti-companion-materials-info",
        "qti-custom-operator",
        "qti-selection",
      ]) {
        assert.isTrue(
          positionsOf(`${version} ${wildcard}`, includeKind).length > 0,
          `${version} ${wildcard} admits an include through its wildcard`,
        );
        assert.strictEqual(rootsUnder(version, wildcard).size, 0, `${version} ${wildcard}`);
      }

      assert.deepStrictEqual(
        rootsUnder(version, "qti-assessment-section"),
        new Set([
          "qti-assessment-item-ref",
          "qti-assessment-section",
          "qti-assessment-section-ref",
        ]),
      );
      assert.deepStrictEqual(
        rootsUnder(version, "qti-response-processing"),
        new Set([
          "qti-exit-response",
          "qti-lookup-outcome-value",
          "qti-response-condition",
          "qti-response-processing-fragment",
          "qti-set-outcome-value",
        ]),
      );
      assert.deepStrictEqual(
        rootsUnder(version, "qti-outcome-processing"),
        new Set([
          "qti-exit-test",
          "qti-lookup-outcome-value",
          "qti-outcome-condition",
          "qti-outcome-processing-fragment",
          "qti-set-outcome-value",
        ]),
      );
    }
  });

  it("roots a fragment's document at every kind an include stands for but the three context-split kinds", () => {
    // Oracle: the kinds' names, read off the roster by hand: three handles share their element's
    // name with another kind, so a document's root, read by its name, is never one of them (spec
    // reading 116). Bound: every kind IncludeRoot holds.
    const standing: ReadonlySet<string> = new Set(IncludeRoot.rows.map(({ kind }) => kind));
    const roots = new Set(fragmentRoots.map(({ root }) => root));

    assert.deepStrictEqual(
      new Set([...standing].filter((kind) => !roots.has(kind))),
      new Set([
        "qti-feedback-block.template",
        "qti-template-block.rubric",
        "qti-template-inline.rubric",
      ]),
    );
    for (const root of roots) {
      assert.isTrue(standing.has(root), root);
      assert.isTrue(documentRoots.includes(root), root);
    }
  });
});
