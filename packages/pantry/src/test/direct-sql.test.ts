/**
 * The direct writer's order and slots (`#pantry/test/direct-sql.ts` `statedInserts`): a case states
 * facts, and the writer writes every owner before its members, fills each owner's counts and each
 * member's hidden index and copy from the schema's own family statements, whatever order the facts
 * are stated in. So no case can write a member before its owner, the order the hand-written rows of
 * the database suites once had to keep.
 */
import { assert, describe, it } from "@effect/vitest";
import {
  AssembledReference,
  Reading,
  ReferenceDocument,
  TestReference,
} from "#pantry/qti/expressions.ts";
import { LomResource } from "#pantry/qti/metadata.ts";
import { NamedHref, ResourceHref } from "#pantry/qti/package.ts";
import { statedInserts } from "#pantry/test/direct-sql.ts";
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
 * A resource's href with its two owners, as package.db's containment cases state it.
 */
const href: readonly Stated[] = [
  { fact: { package: "P", path: "item.xml", type: "imsqti_item_xmlv3p0" }, relation: NamedHref },
  {
    fact: { named: "imsqti_item_xmlv3p0", node: "S", type: "imsqti_item_xmlv3p0" },
    relation: LomResource,
  },
  {
    fact: {
      href: "item.xml",
      node: "S",
      package: "P",
      path: "item.xml",
      scope: "entry",
      type: "imsqti_item_xmlv3p0",
    },
    relation: ResourceHref,
  },
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
    // Bound: every permutation of the reference chain (120) and of the href's (6).
    for (const order of permutations(chain)) {
      const tables = tablesOf(order);

      assert.isBelow(tables.indexOf("reference_document"), tables.indexOf("test_reference"));
      assert.isBelow(tables.indexOf("test_reference"), tables.indexOf("assembled_reference"));
      assert.isBelow(tables.indexOf("assembled_reference"), tables.indexOf("reading"));
    }

    for (const order of permutations(href)) {
      const tables = tablesOf(order);

      assert.isBelow(tables.indexOf("named_href"), tables.indexOf("resource_href"));
      assert.isBelow(tables.indexOf("lom_resource"), tables.indexOf("resource_href"));
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
    assert.deepStrictEqual(statedInserts(href)[2]?.hidden, {
      "the index of the family LomResource.hrefs": 0,
      "the index of the family NamedHref.names": 0,
      "the owner's count of the family LomResource.hrefs": 1,
      "the owner's count of the family NamedHref.names": 1,
    });
  });
});
