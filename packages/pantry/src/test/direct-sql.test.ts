/**
 * The direct writer's order, slots and accumulators (`#pantry/test/direct-sql.ts`): a case states
 * facts, and the writer writes every owner before its members, fills each owner's counts and each
 * member's hidden index and copy from the schema's own family statements, a tree member's copy and
 * parent's start from its parent, and a hidden count fold's accumulators and end from the members
 * its selection holds, whatever order the facts are stated in. So no case can write a member before
 * its owner, or a stale slot or accumulator, which the hand-written rows of the database suites
 * once had to keep right by hand.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element, int, parents, shuffled } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { BarredOf, CountedOf, nonElementKinds } from "#pantry/grammar/install.ts";
import {
  AssembledReference,
  Reading,
  ReferenceDocument,
  TestReference,
} from "#pantry/qti/expressions.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { DocumentId, IdBinding } from "#pantry/qti/identity.ts";
import { Node } from "#pantry/qti/node.ts";
import { NamedHref, TypedHref } from "#pantry/qti/package.ts";
import { accumulatorOf, columnKeys, pinned, statedInserts } from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";

/**
 * Every order of a list.
 *
 * @param items - The list.
 * @returns Each permutation of it.
 */
const permutations = <T>(items: readonly T[]): readonly (readonly T[])[] =>
  items.length <= 1
    ? [items]
    : items.flatMap((item, at) =>
        permutations([...items.slice(0, at), ...items.slice(at + 1)]).map((rest) => [
          item,
          ...rest,
        ]),
      );

/**
 * A reference's chain, as expressions.db's reading cases state it: the test document, the
 * reference, its assembled reference, read three ways, and two of its readings.
 */
const reference = {
  attribute: "identifier",
  document: "D",
  identifier: "a.b.SCORE",
  kind: "qti-variable",
  node: "N",
  role: "variable",
  rootKind: "qti-assessment-test",
} as const;

/**
 * One reading of the reference, at a split.
 *
 * @param split - Its split.
 * @returns The fact.
 */
const readingAt = (split: bigint) =>
  ({
    assembly: "A",
    attribute: "identifier",
    form: "split",
    identifier: "a.b.SCORE",
    kind: "qti-variable",
    node: "N",
    role: "variable",
    split,
  }) as const;

const chain: readonly Stated[] = [
  { fact: { document: "D" }, relation: ReferenceDocument },
  { fact: reference, relation: TestReference },
  {
    fact: {
      ...reference,
      assembly: "A",
      digits: 0n,
      joined: "a.b.SCORE",
      lastDigit: false,
      placements: 1n,
      readings: 3n,
      segments: 3n,
    },
    relation: AssembledReference,
  },
  { fact: readingAt(2n), relation: Reading },
  { fact: readingAt(1n), relation: Reading },
];

/**
 * A typed resource's href with its owner, the (path, type) pair it names, as package.db's
 * containment cases state it.
 */
const href: readonly Stated[] = [
  { fact: { package: "P", path: "item.xml", type: "imsqti_item_xmlv3p0" }, relation: NamedHref },
  {
    fact: {
      node: "S",
      package: "P",
      path: "item.xml",
      scope: "entry",
      type: "imsqti_item_xmlv3p0",
    },
    relation: TypedHref,
  },
];

/**
 * One id twice under one parent, as identity.db states it: the document, the id's binding, and
 * the two IDs that carry it, each a member of the binding's family and the document's.
 */
const twoIds: readonly Stated[] = [
  { fact: { node: "D" }, relation: Document },
  { fact: { document: "D", id: "a", owner: "n3" }, relation: IdBinding },
  ...[4, 5].map((node): Stated => ({
    fact: { document: "D", id: "a", node: `n${String(node)}`, owner: "n3" },
    relation: DocumentId,
  })),
];

/**
 * The tables a case's inserts write, in order.
 *
 * @param stated - The facts.
 * @returns The tables.
 */
const tablesOf = (stated: readonly Stated[]) => statedInserts(stated).map(({ table }) => table);

describe("the direct writer's order and slots", () => {
  it("writes every owner before its members, whatever order the facts are stated in", () => {
    // Oracle: the schema's own family statements (each member after its owner) and the hand
    // order expressions.db and package.db kept before the writer derived it.
    // Bound: every permutation of the reference chain (120) and of the href's (2).
    for (const order of permutations(chain)) {
      const tables = tablesOf(order);

      assert.isBelow(tables.indexOf("reference_document"), tables.indexOf("test_reference"));
      assert.isBelow(tables.indexOf("test_reference"), tables.indexOf("assembled_reference"));
      assert.isBelow(tables.indexOf("assembled_reference"), tables.indexOf("reading"));
    }

    for (const order of permutations(href)) {
      const tables = tablesOf(order);

      assert.isBelow(tables.indexOf("named_href"), tables.indexOf("typed_href"));
    }
  });

  it("fills each owner's counts and each member's index and copy from its family", () => {
    // Oracle: the values expressions.db and package.db wrote by hand before the writer derived
    // them, each family's comment as grizzle installs it.
    // Bound: the reference chain and the href, stated in order.
    const inserts = statedInserts(chain);

    assert.strictEqual(inserts[0]?.row["references"], "1");
    assert.deepStrictEqual(inserts[1]?.hidden, {
      "the index of the family ReferenceDocument.references": 0,
      "the owner's count of the family ReferenceDocument.references": 1,
    });
    assert.deepStrictEqual(
      inserts.slice(3).map(({ hidden }) => hidden),
      [0, 1].map((index) => ({
        "the index of the family AssembledReference.readings": index,
        "the owner's count of the family AssembledReference.readings": 3,
      })),
    );
    assert.deepStrictEqual(statedInserts(href)[1]?.hidden, {
      "the index of the family NamedHref.names": 0,
      "the owner's count of the family NamedHref.names": 1,
    });
  });

  it("gives two members of two counted families distinct slots under each owner, whatever order they are stated in", () => {
    // Oracle: the slots identity.db's hand rows wrote for one id twice under one parent: the two
    // `DocumentId` rows at index 0 and 1 of 2 in both `IdBinding.carriers` and `Document.ids`, in
    // the order they are stated, the owners' counts 2, and each owner written first.
    // Bound: every order of the case's four facts, 24.
    for (const order of permutations(twoIds)) {
      const inserts = statedInserts(order);
      const tables = inserts.map(({ table }) => table);
      const members = inserts.filter(({ table }) => table === "document_id");

      assert.isBelow(tables.indexOf("document"), tables.indexOf("document_id"));
      assert.isBelow(tables.indexOf("id_binding"), tables.indexOf("document_id"));
      assert.deepStrictEqual(
        inserts
          .filter(({ table }) => table !== "document_id")
          .map(({ row }) => [row["ids"], row["carriers"]].filter((count) => count !== undefined)),
        tables.filter((table) => table !== "document_id").map(() => ["2"]),
      );
      assert.sameDeepMembers(
        members.map(({ hidden, row }) => [String(row["node"]), hidden]),
        order
          .filter(({ relation }) => relation === DocumentId)
          .map(({ fact }, index) => [
            String(fact["node"]),
            {
              "the index of the family Document.ids": index,
              "the index of the family IdBinding.carriers": index,
              "the owner's count of the family Document.ids": 2,
              "the owner's count of the family IdBinding.carriers": 2,
            },
          ]),
      );
    }
  });

  it("copies an unwritten owner's count as the members stated under it, unless a case states the count", () => {
    // Oracle: the hand copies attributes.db and identity.db wrote for members whose owner the case
    // does not write: one attribute alone of its element at a copy of 1, three of one element at
    // 3, and the stated count where the case says the element holds more than it writes.
    // Bound: up to three attributes of one element, in every order, beside one of another
    // element, and each with the count stated as 2.
    const copy = "the owner's count of the family Node.attributes";
    for (const size of [1, 2, 3]) {
      const facts = [
        ...Array.from({ length: size }, (_, at): Stated => ({
          fact: { at: BigInt(at), id: `a${String(at)}`, node: "N" },
          relation: Attribute,
        })),
        { fact: { at: 0n, id: "b", node: "M" }, relation: Attribute },
      ];
      for (const order of permutations(facts)) {
        assert.deepStrictEqual(
          statedInserts(order).map(({ hidden, row }) => [row["id"], hidden?.[copy]]),
          order.map(({ fact }) => [fact["id"], fact["node"] === "N" ? size : 1]),
        );
        assert.deepStrictEqual(
          statedInserts(order.map((stated) => ({ ...stated, hidden: { [copy]: 2 } }))).map(
            ({ hidden }) => hidden?.[copy],
          ),
          order.map(() => 2),
        );
      }
    }
  });
});

/**
 * The time a search over drawn trees takes, each case a writer run, on a loaded machine.
 * Measured 2026-11-07: 13.7 s at a load average of 63 to 73, the slower search.
 */
const searchTimeoutMs = 120_000;

/**
 * The search budget of every exploration here; each states its own coverage.
 */
const budget = {
  caseHang: Duration.minutes(1),
  concurrency: 1,
  kept: [],
  literal: Formatter.format,
  shrink: completeShrink,
  steerEvery: 16,
} as const;

/**
 * The kinds a drawn node takes, by class, each a swarm feature: an element no fold counts, a
 * parent whose counted fold counts a position (`CountedOf`'s), a parent whose barred fold bars one
 * (`BarredOf`'s), and character data, which no fold counts at any position.
 */
const nodeKinds = {
  barring: ["colgroup"],
  character: ["text", "comment"],
  counting: ["qti-match-interaction"],
  element: ["p", "col", "qti-simple-match-set"],
} as const;

/**
 * The classes of {@link nodeKinds}, the simplest first.
 */
const nodeClasses = ["element", "counting", "barring", "character"] as const;

/**
 * A drawn tree of `Node` facts: each node's parent (entry `i` is node `i + 1`'s), kind and state,
 * its one version, and the order its facts are stated in.
 */
interface DrawnTree {
  readonly kinds: readonly string[];
  readonly order: readonly number[];
  readonly parents: readonly number[];
  readonly states: readonly string[];
  readonly version: "3.0.0" | "3.0.1";
}

/**
 * Draw a tree of up to 8 nodes under a swarm over the node classes: its shape, each node's kind
 * from a class the swarm turns on and its state among the positions the folds read, and the order
 * its facts are stated in, a permutation.
 */
const drawnTree: Gen<DrawnTree> = (source) => {
  const mix = source.draw(swarm(nodeClasses));
  const above = source.draw(parents({ max: 8, min: 1 }));
  const size = above.length + 1;
  const kinds = Array.from({ length: size }, () =>
    source.draw(element(nodeKinds[source.draw(swarmChoice(mix, nodeClasses))])),
  );
  const states = Array.from({ length: size }, () => source.draw(element(["1", "2", "3"] as const)));
  const version = source.draw(element(["3.0.0", "3.0.1"] as const));
  const order = source.draw(
    shuffled(
      kinds.map((_, node) => node),
      { max: size, min: size },
    ),
  );

  return { kinds, order, parents: above, states, version };
};

/**
 * The kinds no fold counts, at any position.
 */
const characterKinds: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * A drawn tree's facts, by node, each with what a hand fold gives it: its parent's count and start
 * (the root its own parent), and for the counted and barred folds the members before its slot each
 * counts, read off `CountedOf` and `BarredOf` by hand, its own step, and its own ends.
 *
 * @param tree - The drawn tree.
 * @returns Each node's fact and the values the writer owes it.
 */
const handFolded = (tree: DrawnTree) => {
  const parentOf = (node: number) => (node === 0 ? 0 : (tree.parents[node - 1] ?? 0));
  const childrenOf = (node: number) =>
    tree.kinds.flatMap((_, child) => (child > 0 && parentOf(child) === node ? [child] : []));
  const starts = new Map<number, number>();
  const pending = [0];
  for (let node = pending.pop(); node !== undefined; node = pending.pop()) {
    starts.set(node, starts.size);
    pending.push(...childrenOf(node).toReversed());
  }

  const kindOf = (node: number) => tree.kinds[node] ?? "";
  const stepOf =
    (
      rows: readonly {
        readonly parent: string;
        readonly position: string;
        readonly version: string;
      }[],
    ) =>
    (node: number) =>
      node > 0 &&
      !characterKinds.has(kindOf(node)) &&
      tree.states[node] ===
        rows.find((row) => row.version === tree.version && row.parent === kindOf(parentOf(node)))
          ?.position
        ? 1
        : 0;
  const folds = { barredChildren: stepOf(BarredOf.rows), countedChildren: stepOf(CountedOf.rows) };
  const slotOf = (node: number) => Math.max(0, childrenOf(parentOf(node)).indexOf(node));
  const beforeOf = (step: (node: number) => number, node: number) =>
    node === 0
      ? 0
      : childrenOf(parentOf(node))
          .slice(0, slotOf(node))
          .reduce((sum, sibling) => sum + step(sibling), 0);

  return tree.kinds.map((kind, node) => ({
    ends: Object.fromEntries(
      Object.entries(folds).map(([end, step]) => [
        end,
        BigInt(childrenOf(node).reduce((sum, child) => sum + step(child), 0)),
      ]),
    ),
    fact: {
      at: BigInt(slotOf(node)),
      children: BigInt(childrenOf(node).length),
      id: `n${String(node)}`,
      kind,
      parent: `n${String(parentOf(node))}`,
      parentKind: kindOf(parentOf(node)),
      start: BigInt(starts.get(node) ?? 0),
      state: tree.states[node] ?? "1",
      version: tree.version,
    },
    hidden: {
      ...Object.fromEntries(
        Object.entries(folds).flatMap(([end, step]) => [
          [accumulatorOf("before", `Node.${end}`, "Node.children"), beforeOf(step, node)],
          [
            accumulatorOf("after", `Node.${end}`, "Node.children"),
            beforeOf(step, node) + step(node),
          ],
        ]),
      ),
      "the owner's count of the family Node.children": childrenOf(parentOf(node)).length,
      "the parent's start of the family Node.children": starts.get(parentOf(node)) ?? 0,
    },
    steps: { barred: folds.barredChildren(node), counted: folds.countedChildren(node) },
  }));
};

/**
 * Assert the writer derives every slot, accumulator and end a hand fold gives a drawn tree, from
 * its facts stated in the drawn order, and writes them in that order, Node's rows being one run.
 *
 * @param tree - The drawn tree.
 */
const assertFolded = (tree: DrawnTree): void => {
  const nodes = handFolded(tree);
  const stated = tree.order.map((node): Stated => ({
    fact: nodes[node]?.fact ?? {},
    relation: Node,
  }));
  const derived = pinned(stated);
  for (const [at, node] of tree.order.entries()) {
    assert.deepStrictEqual(
      derived[at]?.hidden,
      nodes[node]?.hidden,
      `n${String(node)}'s hidden values`,
    );
    assert.deepStrictEqual(
      [derived[at]?.fact["barredChildren"], derived[at]?.fact["countedChildren"]],
      [nodes[node]?.ends["barredChildren"], nodes[node]?.ends["countedChildren"]],
      `n${String(node)}'s ends`,
    );
  }

  assert.deepStrictEqual(
    statedInserts(stated).map(({ row }) => row["id"]),
    tree.order.map((node) => `n${String(node)}`),
  );
};

/**
 * The features of a drawn tree: what its folds count, and whether a member is stated before its
 * parent.
 */
type TreeFeature =
  | "a lone root"
  | "a counted member"
  | "a barred member"
  | "character data at a counted position"
  | "two counted siblings"
  | "a member stated before its parent";

/**
 * The features a drawn tree reaches.
 *
 * @param tree - The drawn tree.
 * @returns Its features.
 */
const treeFeatures = (tree: DrawnTree): readonly TreeFeature[] => {
  const nodes = handFolded(tree);
  const counted = nodes.flatMap(({ fact, steps }) => (steps.counted === 1 ? [fact.parent] : []));
  const states: ReadonlyMap<string, string> = new Map(
    CountedOf.rows.map((row) => [`${row.version} ${row.parent}`, row.position] as const),
  );

  return [
    ...(nodes.length === 1 ? ["a lone root" as const] : []),
    ...(counted.length > 0 ? ["a counted member" as const] : []),
    ...(nodes.some(({ steps }) => steps.barred === 1) ? ["a barred member" as const] : []),
    ...(nodes.some(
      ({ fact }) =>
        characterKinds.has(fact.kind) &&
        fact.state === states.get(`${tree.version} ${fact.parentKind}`),
    )
      ? ["character data at a counted position" as const]
      : []),
    ...(new Set(counted).size < counted.length ? ["two counted siblings" as const] : []),
    ...(tree.order.some(
      (node, at) => node > 0 && tree.order.indexOf(tree.parents[node - 1] ?? 0) > at,
    )
      ? ["a member stated before its parent" as const]
      : []),
  ];
};

describe("the direct writer's tree slots and hidden folds", () => {
  it.effect(
    "derives each tree member's copy and parent's start, and the counted and barred folds' accumulators and ends, as a hand fold does, in any stated order",
    (ctx) =>
      // Oracle: a second implementation, the tree folded by hand: a member's copy and parent's start
      // its parent's, the root its own parent; a member counted where it is an element at the
      // position `CountedOf` (`BarredOf`) names under its parent's kind, read off their rows, so
      // the writer's reading of each fold's selection from `Qti`'s statements meets an independent
      // one.
      // Bound: trees of up to 8 nodes, swarm-weighted over four kind classes, three states, both
      // versions, stated in a drawn order.
      searched(
        ctx,
        explore(
          {
            ...budget,
            coverage: required<TreeFeature>(
              [
                "a lone root",
                "a counted member",
                "a barred member",
                "character data at a counted position",
                "two counted siblings",
                "a member stated before its parent",
              ],
              { cases: 300, sense: notesOnly },
            ),
            draw: drawn(drawnTree),
            oracle: { kind: "second-implementation", name: "the tree folded by hand" },
            runs: 600,
            suite: "test/direct-sql/tree-folds",
          },
          (tree, c) =>
            Effect.sync(() => {
              for (const feature of treeFeatures(tree)) {
                c.note(feature);
              }

              assertFolded(tree);
            }),
        ),
      ),
    { timeout: searchTimeoutMs },
  );

  it.effect(
    "derives every family of up to three members under a counting, a barring and a plain parent, stated in order and reversed",
    (ctx) =>
      // Oracle: the tree folded by hand, as above.
      // Bound: the small scope exhausted, three parents by up to three members, each an element at
      // the parent's position, an element elsewhere, or character data at the position, in both
      // orders: 240 families.
      searched(
        ctx,
        exhaust(
          {
            box: "three parents by every family of up to three members of three classes, in order and reversed: 240 cases",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<TreeFeature>([
              "a counted member",
              "a barred member",
              "character data at a counted position",
              "two counted siblings",
              "a member stated before its parent",
            ]),
            generator: (source) => ({
              members: source.draw(array(element([0, 1, 2] as const), { max: 3, min: 0 })),
              parent: source.draw(element(["qti-match-interaction", "colgroup", "p"] as const)),
              reversed: source.draw(element([false, true] as const)),
            }),
            limit: 240,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the tree folded by hand" },
            suite: "test/direct-sql/small-families",
          },
          ({ members, parent, reversed }, c) =>
            Effect.sync(() => {
              const position = parent === "colgroup" ? "1" : "2";
              const tree: DrawnTree = {
                kinds: [parent, ...members.map((member) => (member === 2 ? "text" : "p"))],
                order: [0, ...members.map((_, at) => at + 1)].toSorted((left, right) =>
                  reversed ? right - left : left - right,
                ),
                parents: members.map(() => 0),
                states: ["1", ...members.map((member) => (member === 1 ? "3" : position))],
                version: "3.0.1",
              };
              for (const feature of treeFeatures(tree)) {
                c.note(feature);
              }

              assertFolded(tree);
            }),
        ),
      ),
    { timeout: searchTimeoutMs },
  );
});

/**
 * The ends a drawn catalogue's folds take, each a field of `Node`.
 */
const foldEnds = ["countedChildren", "barredChildren", "elementChildren"] as const;

/**
 * A drawn catalogue of `Node`'s table: its written columns and its CHECKs, in drawn orders, each
 * column with the key the writer owes it.
 */
const drawnCatalogue: Gen<{
  readonly checks: readonly { readonly comment: string; readonly definition: string }[];
  readonly columns: readonly {
    readonly comment: string | null;
    readonly key: string;
    readonly name: string;
  }[];
  readonly noise: number;
}> = (source) => {
  const ends = source.draw(shuffled(foldEnds, { max: 3, min: 1 }));
  const accumulators = ends.flatMap((end, fold) =>
    (["before", "after"] as const).map((side) => ({
      comment: `the accumulator ${side} plane 0 of the fold __node_children_count_fold_d${String(fold)}q over the family Node.children`,
      key: accumulatorOf(side, `Node.${end}`, "Node.children"),
      name: `__${side}_children_0_d${String(fold)}q`,
    })),
  );
  const columns = [
    ...accumulators,
    { comment: null, key: "at", name: "at" },
    {
      comment: "the owner's count of the family Node.children",
      key: "the owner's count of the family Node.children",
      name: "__copy_children_c",
    },
  ];
  const folds = ends.map((end, fold) => ({
    comment: `check of Node for law count fold over fin(Node, children) of Node(parent) where {"kind":"compare","left":{"field":"state","kind":"field"},"op":"eq","right":{"kind":"literal","value":"1"}} into Node(id, ${end})`,
    definition: `CHECK ((at > 0 OR __before_children_0_d${String(fold)}q = 0) AND (__after_children_0_d${String(fold)}q >= __before_children_0_d${String(fold)}q))`,
  }));
  // A check that is no fold's, reading an accumulator: a pin or a key, which names no end.
  const noise = source
    .draw(array(int(0, accumulators.length - 1), { max: 2, min: 0 }))
    .map((at) => ({
      comment: "check of Node for law Node(parent, pred(at), was)",
      definition: `CHECK ((at > 0) OR (${accumulators[at]?.name ?? ""} = 0))`,
    }));
  const checks = [...folds, ...noise];

  return {
    checks: source.draw(shuffled(checks, { max: checks.length, min: checks.length })),
    columns: source.draw(shuffled(columns, { max: columns.length, min: columns.length })),
    noise: noise.length,
  };
};

/**
 * A fold CHECK that reads the accumulator `__before_children_0_d0q`, into an end.
 *
 * @param end - The end.
 * @returns The CHECK.
 */
const foldCheck = (end: string) => ({
  comment: `check of Node for law count fold over fin(Node, children) of Node(parent) into Node(id, ${end})`,
  definition: "CHECK ((at > 0) OR (__before_children_0_d0q = 0))",
});

describe("the direct writer's column keys", () => {
  it.effect(
    "keys each hidden accumulator by the end of the one fold CHECK that reads it, and every other column by its comment or its name",
    (ctx) =>
      // Oracle: the catalogue built by construction, each accumulator's fold known as it is drawn.
      // Bound: up to three folds over Node.children, digest-named as grizzle names them, beside a
      // declared and a family column, with up to two CHECKs of no fold that read an accumulator,
      // in drawn orders.
      searched(
        ctx,
        explore(
          {
            ...budget,
            coverage: required<"several folds" | "a check of no fold reads an accumulator">(
              ["several folds", "a check of no fold reads an accumulator"],
              { cases: 300, sense: notesOnly },
            ),
            draw: drawn(drawnCatalogue),
            oracle: { kind: "specification", name: "the catalogue built by construction" },
            runs: 300,
            suite: "test/direct-sql/column-keys",
          },
          ({ checks, columns, noise }, c) =>
            Effect.sync(() => {
              if (columns.length > 4) {
                c.note("several folds");
              }

              if (noise > 0) {
                c.note("a check of no fold reads an accumulator");
              }

              assert.deepStrictEqual(
                columnKeys(
                  columns.map(({ comment, name }) => ({ comment, name })),
                  checks,
                ),
                columns.map(({ key, name }) => ({ key, name })),
              );
            }),
        ),
      ),
  );

  it("refuses an accumulator no fold CHECK reads, or two do", () => {
    // Oracle: grizzle's catalogue gives each hidden accumulator one fold's CHECK.
    // Bound: the two named breaches.
    const column = {
      comment:
        "the accumulator before plane 0 of the fold __node_children_count_fold_d0q over the family Node.children",
      name: "__before_children_0_d0q",
    };

    assert.throws(() => {
      columnKeys([column], []);
    }, /the one fold CHECK that reads it/u);
    assert.throws(() => {
      columnKeys([column], [foldCheck("countedChildren"), foldCheck("barredChildren")]);
    }, /the one fold CHECK that reads it/u);
  });
});
