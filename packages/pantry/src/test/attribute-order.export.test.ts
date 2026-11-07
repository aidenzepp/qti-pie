/**
 * Spec reading 137 over the export: the import keeps each element's attributes and its namespace
 * declarations in the order they are written, and the export writes them back in that order.
 *
 * Each XML entry is written with every element's attributes and declarations in an order its swarm
 * draws (`#pantry/test/gen/attribute-order.ts`), then taken through the path a stored document
 * travels: shred, the nested families the `Node` insert writes (`rootInsertOf` of
 * `#pantry/import/write.ts`), whose order grizzle draws each member's `at` from, and the rows
 * `flatten` writes, in any order, assembled by their `at` and written by `unshred`, as the export
 * writes a scanned document (`#pantry/export/package.ts`). The export writes an element's
 * declarations before its attributes, so it reproduces each family's order exactly, and the
 * interleaving of the two only as declarations first; the canonical round trip is the identity.
 *
 * - **Generated sources:** the every-relation package's documents and generated trees, each element
 *   reordered under a swarm.
 * - **The small box, exhausted:** one element carrying every ordered selection of at most four of
 *   eight attributes and declarations, an open class's two names and an `xml:lang` among them.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { boolean, shuffled } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option, Result } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { rootInsertOf } from "#pantry/import/write.ts";
import type { NodeMember } from "#pantry/import/write.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, XdmChild, XdmDocument } from "#pantry/model/xdm.ts";
import {
  bases,
  caseVersion,
  declaresLate,
  elementsOf,
  exportOrderOf,
  movedIn,
  orderCase,
  orderings,
  readCase,
  reordered,
  writtenOf,
} from "#pantry/test/gen/attribute-order.ts";
import type { OrderFeature } from "#pantry/test/gen/attribute-order.ts";
import { caseHang, idOf, scrambledIdOf, searchTimeout } from "#pantry/test/gen/xdm.ts";

/**
 * The composed grammar every case is generated over and read through.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The grammar shred reads through, projected once.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The names unshred writes under, projected once.
 */
const names = namesOf(grammar);

/**
 * Generate a shuffle of every list of a document's rows, the order a scan may hand them over in,
 * which assembly never reads.
 *
 * @param rows - The rows.
 * @returns The generator of the same rows, each list in a drawn order.
 */
const shuffledRows =
  (rows: FlatRows<Composed>): Gen<FlatRows<Composed>> =>
  (source) => {
    const shuffle = <Row>(list: readonly Row[]): readonly Row[] =>
      source.draw(shuffled(list, { max: list.length, min: list.length }));

    return {
      attributeEntities: shuffle(rows.attributeEntities),
      attributes: shuffle(rows.attributes),
      comments: shuffle(rows.comments),
      doctypes: shuffle(rows.doctypes),
      document: rows.document,
      entityRefs: shuffle(rows.entityRefs),
      namespaces: shuffle(rows.namespaces),
      nodes: shuffle(rows.nodes),
      openElementNames: shuffle(rows.openElementNames),
      openNames: shuffle(rows.openNames),
      pis: shuffle(rows.pis),
      texts: shuffle(rows.texts),
      whitespace: shuffle(rows.whitespace),
    };
  };

/**
 * List a shredded tree's elements' attributes, element by element in document order, each by its
 * name and its lexical form, and the same of the nested families the `Node` insert writes from it,
 * walking the two trees together.
 *
 * @param children - The shredded tree's children of one node.
 * @param members - The insert's members of the same node, in the order it nests them.
 * @returns For each element, its attributes as the tree holds them and as the insert nests them.
 */
const familiesOf = (
  children: readonly XdmChild<Composed>[],
  members: readonly NodeMember[],
): readonly (readonly [readonly string[], readonly string[]])[] =>
  children.flatMap((child, at) => {
    const member = members[at];
    if (!("attributes" in child)) {
      return [];
    }

    const tree = [
      ...child.namespaces.map(({ prefix, uri }) => JSON.stringify(["xmlns", prefix, uri])),
      ...child.attributes.map(({ lexical, name }) =>
        JSON.stringify([name._tag === "closed" ? name.handle : name._tag, lexical]),
      ),
    ];
    const nested = [
      ...(member?.namespaces ?? []).map(({ prefix, uri }) =>
        JSON.stringify(["xmlns", prefix, uri]),
      ),
      ...(member?.attributes ?? []).map(({ lexical, name }) => JSON.stringify([name, lexical])),
    ];

    return [[tree, nested] as const, ...familiesOf(child.children, member?.children ?? [])];
  });

/**
 * How one export is made: the ids its rows are drawn under, and the order its rows are handed to
 * assembly in.
 */
interface Scan {
  readonly ids: (index: number) => NodeId;
  readonly rows: (rows: FlatRows<Composed>) => FlatRows<Composed>;
}

/**
 * Export one source document as a stored one travels, and check what the export writes: shred it,
 * hold the `Node` insert's families to the tree's order, then assemble its rows, handed over as
 * the scan hands them, and write the tree back.
 *
 * @param source - The source as crust reads it.
 * @param version - The schema version its package declares.
 * @param scan - The ids and the row order of the export.
 * @param label - What the source is, for the assertions' messages.
 * @returns The exported document as crust reads it back; fails the test when the `Node` insert
 *   nests a family in any order but the source's, when the export writes an element's attributes
 *   or declarations in any order but theirs, or a document that is not the source canonically.
 */
const exported = Effect.fn("test.attributeOrder.exported")(function* exportedOf(
  source: XmlDocument,
  version: Composed["version"],
  scan: Scan,
  label: string,
) {
  const tree: XdmDocument<Composed> = yield* Effect.orDie(shred(source, version, shredGrammar));
  const insert = rootInsertOf(tree, { documentType: "imsqti_item_xmlv3p0", idOf: scan.ids });
  const root = insert.children.filter(({ kind }) => kind === tree.root.kind).slice(0, 1);

  for (const [held, nested] of familiesOf([tree.root], root)) {
    assert.deepStrictEqual(nested, held, `${label}: the Node insert nests each family in order`);
  }

  const rows = scan.rows(flatten(tree, scan.ids));
  const assembled = yield* Effect.orDie(Effect.fromResult(assemble(rows)));
  const written = yield* Effect.orDie(readXml(yield* Effect.orDie(unshred(assembled, names))));
  const read = elementsOf(source.root);
  const back = elementsOf(written.root);

  assert.strictEqual(back.length, read.length, `${label}: the export writes every element`);
  for (const [at, element] of read.entries()) {
    assert.deepStrictEqual(
      back[at]?.attributes.map(writtenOf),
      exportOrderOf(element),
      `${label}: element ${String(at)}, ${element.qname}`,
    );
  }

  assert.deepStrictEqual(canonicalize(written), canonicalize(source), `${label}: canonically`);

  return written;
});

/**
 * The situations a generated case must reach: each base, an element its order moved, and a
 * declaration written after an attribute.
 */
type Situation =
  | Extract<OrderFeature, "everyRelation" | "generated">
  | "moved"
  | "declaration after an attribute";

/**
 * The cases every generated property is checked over: each base unedited, reordered by the orders
 * its swarm weighs.
 */
const cases = orderCase(grammar, [...bases, ...orderings]);

describe(
  "spec reading 137, attribute order, through the export",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "writes back every element's attributes and namespace declarations, each in the order the source writes them, and the source canonically",
      (ctx) =>
        // Oracle: a universal one, the round trip export ∘ import = id up to Canonical XML, with each
        // family's order as written: the attributes in theirs, the declarations in theirs, first.
        // Bound: the generators' drawn bounds, every element of every XML entry reordered a case.
        searched(
          ctx,
          explore(
            {
              caseHang,
              concurrency: 1,
              coverage: required<Situation>(
                ["everyRelation", "generated", "moved", "declaration after an attribute"],
                { cases: 120, sense: notesOnly },
              ),
              draw: drawn(cases),
              kept: [],
              literal: Formatter.format,
              oracle: {
                kind: "universal",
                name: "export ∘ import = id, each family in its order, up to Canonical XML",
              },
              runs: 64,
              shrink: completeShrink,
              steerEvery: 8,
              suite: "pantry/test/attribute-order-export",
            },
            (orderedCase, c) =>
              Effect.gen(function* fidelity() {
                c.note(orderedCase.base._tag);

                const entries = yield* readCase(orderedCase, names);
                for (const { path, tree } of entries) {
                  if (Option.isSome(tree)) {
                    const order = c.draw(reordered(orderedCase.swarm, tree.value));
                    const source = yield* Effect.orDie(
                      readXml(yield* Effect.orDie(encode(order, order.charset))),
                    );
                    if (movedIn(tree.value, source)) {
                      c.note("moved");
                    }

                    if (elementsOf(source.root).some(declaresLate)) {
                      c.note("declaration after an attribute");
                    }

                    yield* exported(
                      source,
                      caseVersion(orderedCase),
                      {
                        ids: c.draw(boolean) ? scrambledIdOf : idOf,
                        rows: (rows) => c.draw(shuffledRows(rows)),
                      },
                      path,
                    );
                  }
                }
              }),
          ),
        ),
    );

    /**
     * The attributes and declarations the small box's element carries a selection of: an `id`, a
     * `class`, an `xml:lang`, two names of the `data-*` class, which share its one position, a
     * `label`, and two namespace declarations no name uses.
     */
    const specifications = [
      'id="a"',
      'class="c"',
      'xml:lang="en"',
      'data-x="1"',
      'data-y="2"',
      'label="l"',
      'xmlns:p="urn:example:p"',
      'xmlns:q="urn:example:q"',
    ] as const;

    /**
     * The situations the small box must reach: no attribute, some, an open class's two names, a
     * declaration after an attribute, and two declarations out of their canonical order.
     */
    type BoxSituation =
      | "bare"
      | "carried"
      | "repeated open class"
      | "declaration after an attribute"
      | "declarations reversed";

    it.effect(
      "writes back one element's every order of at most four of eight attributes and declarations",
      (ctx) =>
        // Oracle: the same round trip, over the whole small space.
        // Bound: every ordered selection of at most four of the eight, 2,081 cases.
        searched(
          ctx,
          exhaust(
            {
              box: "every ordered selection of at most 4 of the 8 attributes and declarations on one div",
              caseHang,
              coverage: requiredInSpace<BoxSituation>([
                "bare",
                "carried",
                "repeated open class",
                "declaration after an attribute",
                "declarations reversed",
              ]),
              generator: shuffled(
                specifications.map((_, at) => at),
                { max: 4, min: 0 },
              ),
              limit: 2081,
              literal: Formatter.format,
              oracle: {
                kind: "universal",
                name: "export ∘ import = id, each family in its order, over every small order",
              },
              suite: "pantry/test/attribute-order-export-box",
            },
            (carried, c) =>
              Effect.gen(function* box() {
                c.note(carried.length === 0 ? "bare" : "carried");
                if (carried.includes(3) && carried.includes(4)) {
                  c.note("repeated open class");
                }

                const declared = carried.findIndex((at) => at >= 6);
                if (declared !== -1 && carried.slice(0, declared).some((at) => at < 6)) {
                  c.note("declaration after an attribute");
                }

                if (carried.includes(7) && carried.indexOf(7) < carried.indexOf(6)) {
                  c.note("declarations reversed");
                }

                const attributes = carried.map((at) => ` ${specifications[at] ?? ""}`).join("");
                const text = [
                  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false" adaptive="false">',
                  `<qti-item-body><div${attributes}>a</div></qti-item-body>`,
                  "</qti-assessment-item>",
                ].join("");
                const source = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));

                yield* exported(
                  source,
                  "3.0.1",
                  { ids: idOf, rows: (rows) => rows },
                  carried.join(" "),
                );
              }),
          ),
        ),
    );
  },
);
