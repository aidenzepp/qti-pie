import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect, Option, Predicate } from "effect";
import { closed } from "#pantry/grammar/closed.ts";
import { orderOf, rules, step, unbounded, unranked } from "#pantry/grammar/order.ts";
import type { Grammar, Inexact, Interval, Rule } from "#pantry/grammar/order.ts";
import { expressionKinds } from "#pantry/schema/kinds/asi.ts";
import { kinds as drdKinds } from "#pantry/schema/kinds/drd.ts";
import { NodeKind, SchemaVersion } from "#pantry/schema/node.ts";
import type { SchemaVersionHandle } from "#pantry/schema/node.ts";
import { admission, registries } from "#pantry/schema/seed/admission.ts";

/**
 * The kinds that are elements: every registry kind with a local name. Text, whitespace, comments,
 * instructions and entity references have none.
 */
const elements: ReadonlySet<string> = new Set(
  registries.flatMap((registry) =>
    Object.entries<{ readonly local: string }>(registry)
      .filter(([, row]) => row.local !== "")
      .map(([kind]) => kind),
  ),
);

/**
 * Today's composition: the `NodeKind` and `SchemaVersion` rosters, the composed admission rows and
 * the element kinds, K = 363.
 */
const grammar: Grammar<SchemaVersionHandle, string> = {
  admission,
  elements,
  kinds: NodeKind.handles,
  versions: SchemaVersion.handles,
};

/**
 * `Order` and its report at today's composition, generated once for every test.
 */
const today = Effect.fromResult(orderOf(grammar, rules));

/**
 * The `Order` the tests read.
 */
type Today = Effect.Success<typeof today>;

/**
 * One parent and its admitted children in one version, in admission order.
 */
interface Family {
  readonly children: readonly string[];
  readonly parent: string;
  readonly version: SchemaVersionHandle;
}

/**
 * Every (version, parent) of the admission rows with its children.
 */
const families: readonly Family[] = Object.values(
  Arr.groupBy(admission, (row) => `${row.version} ${row.parent}`),
).map((rows) => ({
  children: rows.map((row) => row.child),
  parent: Arr.headNonEmpty(rows).parent,
  version: Arr.headNonEmpty(rows).version,
}));

/**
 * Fold a parent's children through `Order` as N5 does: each child's state is `GREATEST(was, lo)`
 * of its predecessor's state, and it is refused when that state exceeds its `hi`.
 *
 * @param ordering - `Order`.
 * @param version - The document's schema version.
 * @param parent - The parent's kind.
 * @param children - The children's kinds, in document order.
 * @returns Each child's state, or none when a child is not admitted or out of order.
 */
const statesOf = (
  ordering: Today,
  version: SchemaVersionHandle,
  parent: string,
  children: readonly string[],
): Option.Option<readonly number[]> => {
  const states: number[] = [];
  for (const child of children) {
    const was = states.at(-1) ?? 0;
    const state = ordering.order
      .lookup({ child, parent, version })
      .pipe(Option.flatMap(({ interval }) => step(was, interval)));
    if (Option.isNone(state)) {
      return Option.none();
    }

    states.push(state.value);
  }

  return Option.some(states);
};

/**
 * Check that `Order` admits every child of a fixture under its parent, so that a failed fold is a
 * child out of order and not one outside admission.
 *
 * @param ordering - `Order`.
 * @param fixture - The fixture.
 * @returns Whether every child has a row.
 */
const admitted = (ordering: Today, { children, parent, version }: Family): boolean =>
  children.every((child) => Option.isSome(ordering.order.lookup({ child, parent, version })));

/**
 * Write an interval as `[lo, hi]`, ∞ for {@link unbounded}.
 *
 * @param interval - The interval.
 * @returns Its spelling.
 */
const spell = ({ hi, lo }: Interval): string => `[${lo}, ${hi === unbounded ? "∞" : hi}]`;

/**
 * Find a kind's place in a guard's sequence, the guards' `indexOf` with -1 read as "not listed".
 *
 * @param list - The sequence.
 * @param kind - The kind.
 * @returns The kind's index, or undefined when the sequence does not list it.
 */
const indexIn = (list: readonly string[], kind: string): number | undefined => {
  const at = list.indexOf(kind);

  return at === -1 ? undefined : at;
};

/**
 * Check the guards' rank scan: a ranked child after one of a higher rank, the kinds without a rank
 * skipped.
 *
 * @param kinds - The children's kinds, in order.
 * @param rank - Each kind's rank, undefined for a kind outside the sequence.
 * @returns Whether some ranked child follows one of a higher rank.
 */
const outOfOrder = (
  kinds: readonly string[],
  rank: (kind: string) => number | undefined,
): boolean => {
  const ranks = kinds.map(rank).filter(Predicate.isNumber);

  return ranks.some((later, at) => ranks.slice(0, at).some((earlier) => earlier > later));
};

/**
 * The content guard's `table` sequences (`tableOrderZero`, `tableOrderOne`), `tr` sharing `tbody`'s
 * place in 3.0.1.
 */
const tableOrders: Readonly<Record<SchemaVersionHandle, readonly string[]>> = {
  "3.0.0": ["caption", "col", "colgroup", "thead", "tfoot", "tbody", "tr"],
  "3.0.1": ["caption", "col", "colgroup", "thead", "tbody", "tfoot"],
};

/**
 * The content guard's `table` rank of a kind.
 *
 * @param version - The table's version.
 * @param kind - The child's kind.
 * @returns Its place in the version's sequence.
 */
const tableRank = (version: SchemaVersionHandle, kind: string): number | undefined =>
  version === "3.0.1" && kind === "tr" ? 4 : indexIn(tableOrders[version], kind);

/**
 * The content guard's `bodyHosts`.
 */
const oracleBodyHosts: ReadonlySet<string> = new Set([
  "qti-feedback-block",
  "qti-feedback-block.template",
  "qti-modal-feedback",
  "qti-rubric-block",
  "qti-template-block",
  "qti-template-block.rubric",
]);

/**
 * The content guard's `bodyOrder`.
 *
 * @param kind - The child's kind.
 * @returns Its place in `qti-stylesheet, qti-content-body…, qti-catalog-info`.
 */
const bodyRank = (kind: string): number | undefined => {
  if (kind === "qti-stylesheet") {
    return 0;
  }

  if (kind.startsWith("qti-content-body")) {
    return 1;
  }

  return kind === "qti-catalog-info" ? 2 : undefined;
};

/**
 * The content guard's `promptHosts`.
 */
const oraclePromptHosts: ReadonlySet<string> = new Set([
  "qti-associate-interaction",
  "qti-choice-interaction",
  "qti-drawing-interaction",
  "qti-extended-text-interaction",
  "qti-gap-match-interaction",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-graphic-order-interaction",
  "qti-hotspot-interaction",
  "qti-hottext-interaction",
  "qti-match-interaction",
  "qti-media-interaction",
  "qti-order-interaction",
  "qti-select-point-interaction",
  "qti-slider-interaction",
  "qti-upload-interaction",
]);

/**
 * The content guard's `gapMatchOrder`.
 *
 * @param kind - The child's kind, an element.
 * @returns 0 for the prompt, 1 for a gap text or image, 2 for any other element.
 */
const gapMatchRank = (kind: string): number => {
  if (kind === "qti-prompt") {
    return 0;
  }

  return kind === "qti-gap-img" || kind === "qti-gap-text" ? 1 : 2;
};

/**
 * Judge children as the content guard's `orderingOf` does, but for its default-hotspot clause,
 * which reads an attribute.
 *
 * @param version - The parent's version.
 * @param parent - The parent's kind.
 * @param children - The children's kinds, in order.
 * @returns Whether the guard refuses them.
 */
const contentRefuses = (
  version: SchemaVersionHandle,
  parent: string,
  children: readonly string[],
): boolean => {
  const kinds = children.filter((kind) => elements.has(kind));
  const [first] = kinds;
  if (parent === "table") {
    return outOfOrder(kinds, (kind) => tableRank(version, kind));
  }

  if (parent === "details") {
    return kinds.includes("summary") && first !== "summary";
  }

  if (parent === "picture") {
    return outOfOrder(kinds, (kind) => indexIn(["source", "img"], kind));
  }

  if (oracleBodyHosts.has(parent)) {
    return outOfOrder(kinds, bodyRank);
  }

  if (oraclePromptHosts.has(parent) && kinds.includes("qti-prompt") && first !== "qti-prompt") {
    return true;
  }

  return parent === "qti-gap-match-interaction" && outOfOrder(kinds, gapMatchRank);
};

/**
 * The item guard's `itemOrder`.
 */
const itemOrder = [
  "qti-response-declaration",
  "qti-outcome-declaration",
  "qti-item-body",
  "qti-response-processing",
];

/**
 * The manifest guard's four sequences, by parent kind.
 */
const manifestOrders: ReadonlyMap<string, readonly string[]> = new Map([
  ["cp:resource", ["cp:metadata.resource", "cp:file", "cp:dependency", "cpx:variant"]],
  [
    "qmd:qtiMetadata",
    [
      "qmd:itemTemplate",
      "qmd:timeDependent",
      "qmd:composite",
      "qmd:interactionType",
      "qmd:portableCustomInteractionContext",
      "qmd:feedbackType",
      "qmd:solutionAvailable",
      "qmd:scoringMode",
      "qmd:toolName",
      "qmd:toolVersion",
      "qmd:toolVendor",
    ],
  ],
  ["drd:accessForAllResource", drdKinds.filter((kind) => kind !== "drd:accessForAllResource")],
  ["csmd:labelledGUID", ["csmd:label", "csmd:caseItemURI", "csmd:GUID"]],
]);

/**
 * The processing guard's `sequences`, by parent kind.
 */
const processingSequences: ReadonlyMap<string, readonly (readonly string[])[]> = new Map([
  ...["outcome", "response", "template"].map((language): [string, readonly string[][]] => [
    `qti-${language}-condition`,
    [[`qti-${language}-if`, `qti-${language}-else-if`, `qti-${language}-else`]],
  ]),
  [
    "qti-assessment-item",
    [
      ["qti-template-declaration", "qti-template-processing"],
      ["qti-response-processing", "qti-modal-feedback"],
    ],
  ],
]);

/**
 * The processing guard's `expressions`.
 */
const expressions: ReadonlySet<string> = new Set(expressionKinds);

/**
 * The parents of the processing guard's `expressionFirst`: its `branchKinds` and
 * `qti-custom-operator`.
 */
const expressionHosts: ReadonlySet<string> = new Set([
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-response-else-if",
  "qti-response-if",
  "qti-template-else-if",
  "qti-template-if",
  "qti-custom-operator",
]);

/**
 * Judge children as the processing guard's P30 does: its `sequences`, then `expressionFirst`.
 *
 * @param parent - The parent's kind.
 * @param children - The children's kinds, in order.
 * @returns Whether the guard refuses them.
 */
const processingRefuses = (parent: string, children: readonly string[]): boolean => {
  const other = children.findIndex((kind) => elements.has(kind) && !expressions.has(kind));

  return (
    (processingSequences.get(parent) ?? []).some((sequence) =>
      outOfOrder(children, (kind) => indexIn(sequence, kind)),
    ) ||
    (expressionHosts.has(parent) &&
      other !== -1 &&
      children.slice(other + 1).some((kind) => expressions.has(kind)))
  );
};

/**
 * The statistic kinds, the parents of the usage guard's `ordering`.
 */
const statistics: ReadonlySet<string> = new Set([
  "ud:categorizedStatistic",
  "ud:ordinaryStatistic",
]);

/**
 * Judge children as the usage guard's `ordering` does: no target object after the first value or
 * mapping.
 *
 * @param parent - The parent's kind.
 * @param children - The children's kinds, in order.
 * @returns Whether the guard refuses them.
 */
const usageRefuses = (parent: string, children: readonly string[]): boolean => {
  const answer = children.findIndex((kind) => kind === "ud:value" || kind === "ud:mapping");

  return (
    statistics.has(parent) &&
    answer !== -1 &&
    children.slice(answer + 1).includes("ud:targetObject")
  );
};

/**
 * The guards' ordering checks, ported a second time from `import/guards/*.ts` with their own
 * tables, as the oracle `Order` is checked against. The content guard's default-hotspot clause
 * reads an attribute and is left out; its fixture is tested on its own.
 */
const oracle = {
  /**
   * Every parent kind some guard judges.
   */
  parents: new Set([
    "table",
    "details",
    "picture",
    ...oracleBodyHosts,
    ...oraclePromptHosts,
    "qti-assessment-item",
    ...manifestOrders.keys(),
    ...processingSequences.keys(),
    ...expressionHosts,
    ...statistics,
  ]),
  /**
   * Judge a parent's children as the five guards together do.
   *
   * @param version - The parent's version.
   * @param parent - The parent's kind.
   * @param children - The children's kinds, in order.
   * @returns Whether any guard refuses them.
   */
  refuses: (version: SchemaVersionHandle, parent: string, children: readonly string[]): boolean =>
    contentRefuses(version, parent, children) ||
    (parent === "qti-assessment-item" &&
      outOfOrder(children, (kind) => indexIn(itemOrder, kind))) ||
    outOfOrder(children, (kind) => indexIn(manifestOrders.get(parent) ?? [], kind)) ||
    processingRefuses(parent, children) ||
    usageRefuses(parent, children),
};

/**
 * A guard test's document, restated as one parent's children: `refused` is what the guard's own
 * test asserts.
 */
interface Fixture extends Family {
  readonly refused: boolean;
  readonly source: string;
}

/**
 * Construct a fixture.
 *
 * @param source - The guard test it restates.
 * @param version - The document's schema version.
 * @param parent - The parent the guard judges.
 * @param verdict - What the guard's test asserts.
 * @param children - The parent's children, in document order.
 * @returns The fixture.
 */
const fixture = (
  source: string,
  version: SchemaVersionHandle,
  parent: string,
  verdict: "accepted" | "refused",
  children: readonly string[],
): Fixture => ({ children, parent, refused: verdict === "refused", source, version });

/**
 * The `ordering` and P30 fixtures of the guards' tests, each as the children of the parent the
 * guard judges: the refused document beside its accepted counterpart. The corpus-derived ones
 * restate `simple.zip`'s `choice.xml` (response declaration, outcome declaration, body, response
 * processing) and its resource (metadata, then two files, the metadata holding `timeDependent`,
 * `interactionType`, `feedbackType` and `solutionAvailable`) under each test's edit.
 */
const fixtures: readonly Fixture[] = [
  fixture("content.test.ts, tfoot before tbody", "3.0.1", "table", "refused", ["tfoot", "tbody"]),
  fixture("content.test.ts, tfoot before tbody", "3.0.0", "table", "accepted", ["tfoot", "tbody"]),
  fixture("content.test.ts, tbody before tfoot", "3.0.0", "table", "refused", ["tbody", "tfoot"]),
  fixture("content.test.ts, tbody before tfoot", "3.0.1", "table", "accepted", ["tbody", "tfoot"]),
  fixture("content.test.ts, summary second", "3.0.1", "details", "refused", ["p", "summary"]),
  fixture("content.test.ts, summary second", "3.0.1", "details", "accepted", ["summary", "p"]),
  fixture("content.test.ts, img before source", "3.0.1", "picture", "refused", ["img", "source"]),
  fixture("content.test.ts, img before source", "3.0.1", "picture", "accepted", ["source", "img"]),
  fixture("content.test.ts, prompt late", "3.0.1", "qti-choice-interaction", "refused", [
    "qti-simple-choice",
    "qti-prompt",
  ]),
  fixture("content.test.ts, prompt late", "3.0.1", "qti-choice-interaction", "accepted", [
    "qti-prompt",
    "qti-simple-choice",
  ]),
  fixture("content.test.ts, block first", "3.0.1", "qti-gap-match-interaction", "refused", [
    "p",
    "qti-gap-text",
  ]),
  fixture("content.test.ts, block first", "3.0.1", "qti-gap-match-interaction", "accepted", [
    "qti-gap-text",
    "p",
  ]),
  fixture("content.test.ts, body first", "3.0.1", "qti-feedback-block", "refused", [
    "qti-content-body.feedback",
    "qti-stylesheet",
  ]),
  fixture("content.test.ts, body first", "3.0.1", "qti-feedback-block", "accepted", [
    "qti-stylesheet",
    "qti-content-body.feedback",
  ]),
  fixture("content.test.ts, the hand-written item", "3.0.1", "qti-assessment-item", "accepted", [
    "qti-response-declaration",
    "qti-response-declaration",
    "qti-response-declaration",
    "qti-response-declaration",
    "qti-outcome-declaration",
    "qti-outcome-declaration",
    "qti-item-body",
  ]),
  fixture("item.test.ts, body before declarations", "3.0.0", "qti-assessment-item", "refused", [
    "ws",
    "qti-item-body",
    "ws",
    "qti-response-declaration",
    "ws",
    "qti-outcome-declaration",
    "ws",
    "qti-response-processing",
    "ws",
  ]),
  fixture("item.test.ts, body before declarations", "3.0.0", "qti-assessment-item", "accepted", [
    "ws",
    "qti-response-declaration",
    "ws",
    "qti-outcome-declaration",
    "ws",
    "qti-item-body",
    "ws",
    "qti-response-processing",
    "ws",
  ]),
  fixture("manifest.test.ts, file before metadata", "3.0.0", "cp:resource", "refused", [
    "ws",
    "cp:file",
    "ws",
    "cp:metadata.resource",
    "ws",
    "cp:file",
    "ws",
  ]),
  fixture("manifest.test.ts, file before metadata", "3.0.0", "cp:resource", "accepted", [
    "ws",
    "cp:metadata.resource",
    "ws",
    "cp:file",
    "ws",
    "cp:file",
    "ws",
  ]),
  fixture("manifest.test.ts, qtiMetadata out of order", "3.0.0", "qmd:qtiMetadata", "refused", [
    "qmd:interactionType",
    "qmd:timeDependent",
    "qmd:feedbackType",
    "qmd:solutionAvailable",
  ]),
  fixture("manifest.test.ts, qtiMetadata out of order", "3.0.0", "qmd:qtiMetadata", "accepted", [
    "qmd:timeDependent",
    "qmd:interactionType",
    "qmd:feedbackType",
    "qmd:solutionAvailable",
  ]),
  fixture("manifest.packaging.test.ts, variant-before-file", "3.0.0", "cp:resource", "refused", [
    "cp:metadata.resource",
    "cpx:variant",
    "cp:file",
    "cp:file",
  ]),
  fixture("manifest.packaging.test.ts, variant", "3.0.0", "cp:resource", "accepted", [
    "cp:metadata.resource",
    "cp:file",
    "cp:file",
    "cpx:variant",
  ]),
  fixture(
    "manifest.packaging.test.ts, DRD reversed",
    "3.0.0",
    "drd:accessForAllResource",
    "refused",
    ["drd:languageOfAdaptation", "ws", "drd:adaptationType", "ws", "drd:accessMode"],
  ),
  fixture("manifest.packaging.test.ts, variant", "3.0.0", "drd:accessForAllResource", "accepted", [
    "drd:accessMode",
    "ws",
    "drd:adaptationType",
    "ws",
    "drd:languageOfAdaptation",
  ]),
  fixture(
    "manifest.packaging.test.ts, labelledGUID reversed",
    "3.0.0",
    "csmd:labelledGUID",
    "refused",
    ["csmd:GUID", "csmd:caseItemURI", "csmd:label"],
  ),
  fixture("manifest.packaging.test.ts, csm", "3.0.0", "csmd:labelledGUID", "accepted", [
    "csmd:label",
    "csmd:caseItemURI",
    "csmd:GUID",
  ]),
  fixture("usage.test.ts, value first", "3.0.0", "ud:ordinaryStatistic", "refused", [
    "ud:value",
    "ud:targetObject",
  ]),
  fixture("usage.test.ts, value first", "3.0.0", "ud:ordinaryStatistic", "accepted", [
    "ud:targetObject",
    "ud:value",
  ]),
  fixture("usage.test.ts, mapping first", "3.0.0", "ud:categorizedStatistic", "refused", [
    "ud:mapping",
    "ud:targetObject",
  ]),
  fixture("usage.test.ts, mapping first", "3.0.0", "ud:categorizedStatistic", "accepted", [
    "ud:targetObject",
    "ud:mapping",
  ]),
  fixture("processing guards/else-before-if.xml", "3.0.1", "qti-response-condition", "refused", [
    "ws",
    "qti-response-else",
    "ws",
    "qti-response-if",
    "ws",
  ]),
  fixture("processing valid/response.xml", "3.0.1", "qti-response-condition", "accepted", [
    "ws",
    "qti-response-if",
    "ws",
    "qti-response-else-if",
    "ws",
    "qti-response-else-if",
    "ws",
    "qti-response-else",
    "ws",
  ]),
  fixture("processing guards/else-before-if.xml", "3.0.1", "qti-response-if", "accepted", [
    "ws",
    "qti-match",
    "ws",
    "qti-set-outcome-value",
    "ws",
  ]),
];

describe("Order at today's composition", () => {
  it.effect("has one row per admitted triple: 17,661 keys", () =>
    Effect.gen(function* keys() {
      const { order } = yield* today;

      assert.strictEqual(admission.length, 17_661);
      assert.strictEqual(order.rows.length, 17_661);
    }),
  );

  it.effect("packs to 263,538 cells of 5 bits, 164,720 bytes; its key set to 32,951", () =>
    Effect.gen(function* size() {
      const { order } = yield* today;
      const keySet = yield* Effect.fromResult(
        closed({
          key: order.key,
          name: "Admitted",
          payload: [],
          rows: order.rows.map(({ child, parent, version }) => ({ child, parent, version })),
        }),
      );

      assert.strictEqual(NodeKind.handles.length, 363);
      assert.strictEqual(order.cells, 263_538);
      assert.strictEqual(order.width, 5);
      assert.strictEqual(order.bytes, 164_720);
      assert.strictEqual(keySet.bytes, 32_951);
    }),
  );

  it.effect("codes 18 intervals: the 17 ranks of drd:accessForAllResource and [0, ∞]", () =>
    Effect.gen(function* intervals() {
      const { order } = yield* today;
      const [interval] = order.payload;

      assert.deepStrictEqual(interval.values.map(spell), [
        "[0, 0]",
        "[0, ∞]",
        ...Array.from({ length: 16 }, (_, rank) => `[${rank + 1}, ${rank + 1}]`),
      ]);
    }),
  );

  it.effect("ranks children under 42 parents, those the guards judge, and no other", () =>
    Effect.gen(function* orderedParents() {
      const { order } = yield* today;
      const ordered = new Set(
        order.rows.filter((row) => row.interval !== unranked).map((row) => row.parent),
      );

      assert.strictEqual(ordered.size, 42);
      assert.deepStrictEqual([...ordered].toSorted(), [...oracle.parents].toSorted());
    }),
  );
});

describe("the fold", () => {
  it("raises the state to lo and refuses a predecessor state above hi", () => {
    assert.deepStrictEqual(step(0, { hi: 0, lo: 0 }), Option.some(0));
    assert.deepStrictEqual(step(2, { hi: 5, lo: 5 }), Option.some(5));
    assert.deepStrictEqual(step(3, unranked), Option.some(3));
    assert.deepStrictEqual(step(1, { hi: 0, lo: 0 }), Option.none());
  });
});

describe("§17's cases", () => {
  it.effect("ws, summary, p, ws under details folds to states 0, 0, 1, 1", () =>
    Effect.gen(function* details() {
      const ordering = yield* today;

      assert.deepStrictEqual(
        statesOf(ordering, "3.0.1", "details", ["ws", "summary", "p", "ws"]),
        Option.some([0, 0, 1, 1]),
      );
    }),
  );

  it.effect("refuses a summary after a p", () =>
    Effect.gen(function* summaryLate() {
      const ordering = yield* today;

      assert.isTrue(Option.isNone(statesOf(ordering, "3.0.1", "details", ["p", "summary"])));
    }),
  );

  it.effect(
    "refuses a tbody after a tr in 3.0.0 and accepts it in 3.0.1, where they share rank 4",
    () =>
      Effect.gen(function* table() {
        const ordering = yield* today;

        assert.isTrue(Option.isNone(statesOf(ordering, "3.0.0", "table", ["tr", "tbody"])));
        assert.deepStrictEqual(
          statesOf(ordering, "3.0.1", "table", ["tr", "tbody"]),
          Option.some([4, 4]),
        );
      }),
  );

  it.effect("has no row for a kind the parent does not admit", () =>
    Effect.gen(function* unadmitted() {
      const ordering = yield* today;

      assert.isTrue(
        Option.isNone(
          ordering.order.lookup({
            child: "qti-assessment-item",
            parent: "details",
            version: "3.0.1",
          }),
        ),
      );
    }),
  );
});

describe("the guards' fixtures", () => {
  it.effect("fold clean where the guard accepts and fail was <= hi where it refuses", () =>
    Effect.gen(function* guardFixtures() {
      const ordering = yield* today;
      for (const stated of fixtures) {
        const { children, parent, refused, source, version } = stated;
        const name = `${source}: ${children.join(", ")} (${version})`;

        assert.isTrue(admitted(ordering, stated), name);
        assert.strictEqual(oracle.refuses(version, parent, children), refused, name);
        assert.strictEqual(
          Option.isNone(statesOf(ordering, version, parent, children)),
          refused,
          name,
        );
      }
    }),
  );
});

describe("the default hotspot", () => {
  it.effect("is left to the report: Order, keyed by kinds, folds both hotspot orders clean", () =>
    Effect.gen(function* defaultHotspot() {
      const ordering = yield* today;
      const children = ["object", "qti-hotspot-choice", "qti-hotspot-choice"];

      assert.isTrue(
        Option.isSome(statesOf(ordering, "3.0.1", "qti-hotspot-interaction", children)),
      );
      assert.deepInclude(ordering.report, {
        _tag: "ByAttribute",
        attribute: "shape",
        kind: "qti-hotspot-choice",
        parent: "qti-hotspot-interaction",
        value: "default",
        version: "3.0.1",
      });
    }),
  );
});

/**
 * The families whose children some guard judges.
 */
const judged = families.filter((family) => oracle.parents.has(family.parent));

/**
 * The pairs Order refuses beyond the guards, as the report states them, under each (version,
 * parent).
 *
 * @param report - The monotonicity report.
 * @returns Each tightened pair as `version parent: earlier, later`.
 */
const tightenedOf = (
  report: readonly Inexact<SchemaVersionHandle, string>[],
): ReadonlySet<string> =>
  new Set(
    report.flatMap((entry) =>
      entry._tag === "Tightened"
        ? entry.pairs.map(
            ([earlier, later]) => `${entry.version} ${entry.parent}: ${earlier}, ${later}`,
          )
        : [],
    ),
  );

/**
 * Pick one child of each class a family's rules cannot tell apart: the same interval, the same
 * element-ness, and the same guard verdict beside every other child, on either side.
 *
 * @param ordering - `Order`.
 * @param family - The family.
 * @returns One child per class.
 */
const representatives = (
  ordering: Today,
  { children, parent, version }: Family,
): readonly string[] => {
  const signature = (kind: string): string =>
    [
      Option.match(ordering.order.lookup({ child: kind, parent, version }), {
        onNone: () => "none",
        onSome: ({ interval }) => spell(interval),
      }),
      elements.has(kind),
      ...children.flatMap((other) => [
        oracle.refuses(version, parent, [kind, other]),
        oracle.refuses(version, parent, [other, kind]),
      ]),
    ].join(" ");

  return [...new Map(children.map((kind) => [signature(kind), kind])).values()];
};

describe("Order against the guards", () => {
  it.effect("gives every child of a parent no guard judges the interval [0, ∞]", () =>
    Effect.gen(function* unjudged() {
      const { order } = yield* today;
      const ranked = order.rows.filter(
        (row) => !oracle.parents.has(row.parent) && row.interval !== unranked,
      );

      assert.deepStrictEqual(ranked, []);
    }),
  );

  it.effect("agrees on every pair of admitted children but the report's tightened pairs", () =>
    Effect.gen(function* pairs() {
      const ordering = yield* today;
      const disagreements = judged.flatMap(({ children, parent, version }) =>
        children
          .flatMap((earlier) => children.map((later) => [earlier, later]))
          .filter(
            (pair) =>
              oracle.refuses(version, parent, pair) !==
              Option.isNone(statesOf(ordering, version, parent, pair)),
          )
          .map(
            (pair) =>
              `${version} ${parent}: ${pair.join(", ")}${oracle.refuses(version, parent, pair) ? " (the guards refuse)" : ""}`,
          ),
      );

      assert.deepStrictEqual(
        disagreements.toSorted(),
        [...tightenedOf(ordering.report)].toSorted(),
      );
    }),
  );

  it.effect("agrees on every three children but tightened pairs and a repeated first child", () =>
    Effect.gen(function* triples() {
      const ordering = yield* today;
      const tightened = tightenedOf(ordering.report);
      const firsts = new Map(
        ordering.report.flatMap((entry) =>
          entry._tag === "FirstChild" ? [[`${entry.version} ${entry.parent}`, entry.kind]] : [],
        ),
      );
      const verdicts = judged.flatMap((family) => {
        const { parent, version } = family;
        const kinds = representatives(ordering, family);
        const first = firsts.get(`${version} ${parent}`);

        return kinds
          .flatMap((a) => kinds.flatMap((b) => kinds.map((c) => [a, b, c] as const)))
          .map(([a, b, c]) => ({
            family: `${version} ${parent}`,
            guard: oracle.refuses(version, parent, [a, b, c]),
            order: Option.isNone(statesOf(ordering, version, parent, [a, b, c])),
            repeated: a === first && c === first && b !== first && elements.has(b),
            tightened: [`${a}, ${b}`, `${a}, ${c}`, `${b}, ${c}`].some((pair) =>
              tightened.has(`${version} ${parent}: ${pair}`),
            ),
            triple: `${version} ${parent}: ${a}, ${b}, ${c}`,
          }));
      });
      const unexplained = verdicts
        .filter(
          (verdict) =>
            verdict.guard !== verdict.order &&
            (verdict.guard || !(verdict.repeated || verdict.tightened)),
        )
        .map((verdict) => verdict.triple);
      const witnessed = new Set(
        verdicts
          .filter((verdict) => verdict.repeated && verdict.order && !verdict.guard)
          .map((verdict) => verdict.family),
      );

      assert.deepStrictEqual(unexplained, []);
      assert.deepStrictEqual([...witnessed].toSorted(), [...firsts.keys()].toSorted());
    }),
  );
});

describe("the monotonicity report", () => {
  it.effect(
    "names qti-assessment-item, 13 first-child parents and 2 attribute rules per version",
    () =>
      Effect.gen(function* report() {
        const ordering = yield* today;
        const named = (version: SchemaVersionHandle) =>
          ordering.report
            .filter((entry) => entry.version === version)
            .map((entry) => `${entry._tag} ${entry.parent}`);
        const expected = [
          "Tightened qti-assessment-item",
          "FirstChild qti-choice-interaction",
          "FirstChild qti-associate-interaction",
          "FirstChild qti-drawing-interaction",
          "FirstChild qti-graphic-associate-interaction",
          "FirstChild qti-graphic-gap-match-interaction",
          "FirstChild qti-graphic-order-interaction",
          "ByAttribute qti-graphic-order-interaction",
          "FirstChild qti-hotspot-interaction",
          "ByAttribute qti-hotspot-interaction",
          "FirstChild qti-hottext-interaction",
          "FirstChild qti-match-interaction",
          "FirstChild qti-media-interaction",
          "FirstChild qti-order-interaction",
          "FirstChild qti-select-point-interaction",
          "FirstChild details",
        ];

        assert.strictEqual(ordering.report.length, 32);
        assert.deepStrictEqual(named("3.0.0"), expected);
        assert.deepStrictEqual(named("3.0.1"), expected);
      }),
  );

  it.effect("tightens qti-assessment-item by the 13 pairs its XSD order adds to the guards'", () =>
    Effect.gen(function* tightenedPairs() {
      const ordering = yield* today;

      assert.deepStrictEqual(
        [...tightenedOf(ordering.report)].filter((pair) => pair.startsWith("3.0.1")),
        [
          "qti-item-body, qti-template-declaration",
          "qti-item-body, qti-template-processing",
          "qti-response-processing, qti-template-declaration",
          "qti-response-processing, qti-template-processing",
          "qti-modal-feedback, qti-response-declaration",
          "qti-modal-feedback, qti-outcome-declaration",
          "qti-modal-feedback, qti-item-body",
          "qti-modal-feedback, qti-template-declaration",
          "qti-modal-feedback, qti-template-processing",
          "qti-template-declaration, qti-response-declaration",
          "qti-template-declaration, qti-outcome-declaration",
          "qti-template-processing, qti-response-declaration",
          "qti-template-processing, qti-outcome-declaration",
        ].map((pair) => `3.0.1 qti-assessment-item: ${pair}`),
      );
    }),
  );
});

describe("the width", () => {
  it.effect("is 4 bits, 131,777 bytes, without the one parent of more than 14 ranks", () =>
    Effect.gen(function* narrow() {
      const { order } = yield* Effect.fromResult(
        orderOf(
          grammar,
          rules.filter((rule) => !rule.parents.includes("drd:accessForAllResource")),
        ),
      );

      assert.strictEqual(order.width, 4);
      assert.strictEqual(order.bytes, 131_777);
    }),
  );
});

/**
 * Generate `Order` at today's composition with one more rule, for the refusals.
 *
 * @param rule - The rule to add.
 * @returns The failure the generator answers.
 */
const refusalOf = (rule: Rule) =>
  Effect.flip(Effect.fromResult(orderOf(grammar, [...rules, rule])));

describe("the refusals", () => {
  it.effect("refuses rules that interleave with no xsd sequence to settle them", () =>
    Effect.gen(function* interleaved() {
      const failure = yield* Effect.flip(
        Effect.fromResult(
          orderOf(
            grammar,
            rules.filter((rule) => rule.source !== "xsd"),
          ),
        ),
      );

      assert.strictEqual(failure._tag, "Interleaved");
      assert.include(
        failure.message,
        "Order cannot rank the children of qti-assessment-item in 3.0.0: its item, P30 rules interleave",
      );
    }),
  );

  it.effect("refuses a rank its parent admits in none of the rule's versions", () =>
    Effect.gen(function* notAdmitted() {
      const failure = yield* refusalOf({
        _tag: "Sequence",
        parents: ["details"],
        ranks: [["summary"], ["qti-prompt"]],
        source: "content",
        versions: ["3.0.1"],
      });

      assert.strictEqual(failure._tag, "RankNotAdmitted");
      assert.include(failure.message, "places qti-prompt under details");
    }),
  );

  it.effect("refuses a kind in two ranks of one rule", () =>
    Effect.gen(function* twice() {
      const failure = yield* refusalOf({
        _tag: "Sequence",
        parents: ["table"],
        ranks: [["caption"], ["col", "caption"]],
        source: "content",
        versions: ["3.0.1"],
      });

      assert.strictEqual(failure._tag, "RankedTwice");
      assert.include(failure.message, "names caption in two of its ranks");
    }),
  );

  it.effect("refuses a version outside the roster", () =>
    Effect.gen(function* unknownVersion() {
      const failure = yield* refusalOf({
        _tag: "First",
        kind: "summary",
        parents: ["details"],
        source: "content",
        versions: ["3.0.1", "3.0.2"],
      });

      assert.strictEqual(failure._tag, "UnknownVersion");
      assert.include(failure.message, "holds in schema version 3.0.2");
    }),
  );
});
