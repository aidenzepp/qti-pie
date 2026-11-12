/**
 * The rows one package is written as (`#pantry/import/write.ts`) and the merge of the overlay
 * builders' rows (`#pantry/import/overlays/index.ts`), judged on the host.
 *
 * - The tree's nesting is exactly the XDM's: drawing each node's slot, start, end and parent from the
 *   nesting, as grizzle does, and assembling the rows (`#pantry/model/assemble.ts`) with the flat
 *   rows that name each node by its position gives back the document, for generated trees and the
 *   accepted corpus packages. So the positions the host writes are the ones grizzle draws.
 * - The host's fields are the host fold's (`#pantry/model/folds.ts`, a second implementation).
 * - No row carries a field grizzle draws or fills or PostgreSQL generates, by type and at run time.
 * - Every keyed set is a set: a repeat of one row is one row, two rows at one key a conflict.
 * - Nothing is minted: a package placed twice is the same rows.
 */
import type { Addition, Fact, InsertAllRowsOf } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { noCoverage, required, requiredInSpace } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Predicate, Result } from "effect";
import { inject } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import { placementOf } from "#pantry/grammar/content.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { ownViewOf } from "#pantry/import/fold.ts";
import { unionOf } from "#pantry/import/overlays/index.ts";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { ImportProgram } from "#pantry/import/program.ts";
import { tokensOf } from "#pantry/import/pieces.ts";
import { documentRowsOf, nodeIdsOf, rootInsertOf } from "#pantry/import/write.ts";
import type {
  DocumentLayerRows,
  NodeFields,
  DocumentPlace,
  NodeMember,
  NodeRoot,
} from "#pantry/import/write.ts";
import type { EntryRow } from "#pantry/package/record.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type {
  CharacterRow,
  ClosedName,
  EntityRefRow,
  FlatRows,
  NodeRow,
  OpenClass,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import type {
  Attribute,
  AttributeEntity,
  Idref,
  OpenAttribute,
  OpenAttributeEntity,
} from "#pantry/qti/attributes.ts";
import type { Namespace } from "#pantry/qti/chardata.ts";
import type { Node } from "#pantry/qti/node.ts";
import type { Entry } from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { materialize, materializeSpec } from "#pantry/test/fixtures.ts";
import { caseHang, featuresOf, searchTimeout, xdmDocument } from "#pantry/test/gen/xdm.ts";
import type { XdmFeature } from "#pantry/test/gen/xdm.ts";

const fixtures = inject("fixtures");

/**
 * The trees the properties are checked over: the one generator's, over the installed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * The manifest identifier the rows of one generated document are written under.
 */
const packageIdentifier: DocumentPlace["package"] = "MANIFEST-generated";

/**
 * The path the rows of one generated document are written under.
 */
const generatedPath = "item.xml";

/**
 * A relation's insert row as `insertAll` takes it over `Qti`, its sequences nested.
 */
type Inserted<Name extends keyof InsertAllRowsOf<typeof Qti>> = InsertAllRowsOf<
  typeof Qti
>[Name][number];

/**
 * A closed attribute's insert row, its IDREF tokens nested.
 */
type AttributeInsert = Inserted<"Attribute">;

/**
 * One IDREF token as its attribute nests it.
 */
type IdrefInsert = AttributeInsert["idrefs"][number];

/**
 * Test whether an `AttributeName` handle is an open class's, which an `OpenAttribute` row holds as
 * its class and no `Attribute` row holds: a row of the wrong relation is dropped here, so the
 * rebuilt tree misses it and the round trip fails.
 *
 * @param name - The handle.
 * @returns Whether it is an open class.
 */
const isOpenClass = (name: ClosedName<Composed> | OpenClass): name is OpenClass =>
  openClasses.some((open) => open === name);

/**
 * The flat rows of one document as a scan reads them back: the nodes drawn from a nested insert as
 * grizzle draws them, each node's slot its place in its parent's `children`, its `start` its place
 * in pre-order, its `end` its start plus its subtree's size and its `parent` its parent's `start`;
 * and every other row read off the document layer by its fields, each naming its node by the
 * position the host wrote. A position the host wrote that grizzle would not draw names another node
 * here, and the assembly that follows refuses or misplaces it.
 *
 * @param root - The document's `Node` insert.
 * @param flat - Its document layer's flat rows, each element's named governing type among them.
 * @returns The rows `flatten` writes, which `assemble` reads.
 */
const flatRowsOf = (root: NodeRoot, flat: DocumentLayerRows): FlatRows<Composed> => {
  const governs = new Map(
    [...flat.ElementType.values(), ...flat.OpenElementType.values()].map(
      ({ start, type }) => [start, type] as const,
    ),
  );
  const nodes: NodeRow<Composed>[] = [];
  const texts: CharacterRow[] = [];
  const whitespace: CharacterRow[] = [];
  const entityRefs: EntityRefRow[] = [];
  type Step =
    | {
        readonly _tag: "open";
        readonly at: number;
        readonly node: NodeMember;
        readonly parent: bigint;
      }
    | { readonly _tag: "close"; readonly row: { end: bigint } };
  const stack: Step[] = [{ _tag: "open", at: 0, node: root, parent: 0n }];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    if (next._tag === "close") {
      next.row.end = BigInt(nodes.length);
      continue;
    }

    const { at, node, parent } = next;
    const start = BigInt(nodes.length);
    const row = {
      at: BigInt(at),
      end: 0n,
      governs: Option.fromUndefinedOr(governs.get(start)),
      kind: node.kind,
      parent,
      prefix: node.prefix,
      start,
      version: node.version,
    };
    nodes.push(row);
    if (node.kind === "text") {
      texts.push({ start, value: node.chars });
    } else if (node.kind === "ws") {
      whitespace.push({ start, value: node.chars });
    } else if (node.kind === "entityRef") {
      entityRefs.push({ name: node.chars.slice(1, -1), start });
    }

    stack.push({ _tag: "close", row });
    for (let child = node.children.length - 1; child >= 0; child -= 1) {
      const member = node.children[child];
      if (member !== undefined) {
        stack.push({ _tag: "open", at: child, node: member, parent: start });
      }
    }
  }

  const [document, ...others] = flat.Document.values();
  if (document === undefined || others.length > 0) {
    assert.fail(
      `the document layer of ${root.path} holds ${String(others.length + 1)} Document rows`,
    );
  }

  return {
    attributeEntities: [...flat.AttributeEntity.values()].flatMap(
      ({ entity, name, offset, start }) =>
        isOpenClass(name) ? [] : [{ entity, name, offset, start }],
    ),
    attributes: [...flat.Attribute.values()].flatMap(({ lexical, name, prefix, start }) =>
      isOpenClass(name) ? [] : [{ lexical, name, prefix, start }],
    ),
    comments: [...flat.Comment.values()].map(({ start, value }) => ({ start, value })),
    doctypes: [...flat.Doctype.values()].map(({ start, value }) => ({ start, value })),
    document: { charset: document.charset, exportCharset: document.exportCharset },
    encodingDecls: [...flat.EncodingDecl.values()].map(({ encoding }) => ({ encoding })),
    entityRefs,
    namespaces: [...flat.Namespace.values()].map(({ prefix, start, uri }) => ({
      prefix,
      start,
      uri,
    })),
    nodes,
    openAttributeEntities: [...flat.OpenAttributeEntity.values()].map(
      ({ entity, local, offset, start, uri }) => ({ entity, local, offset, start, uri }),
    ),
    openAttributes: [...flat.OpenAttribute.values()].flatMap(
      ({ class: open, lexical, local, prefix, start, uri }) =>
        isOpenClass(open) ? [{ class: open, lexical, local, prefix, start, uri }] : [],
    ),
    openElementNames: [...flat.OpenElementName.values()].map(({ local, namespace, start }) => ({
      local,
      namespace,
      start,
    })),
    pis: [...flat.Pi.values()].map(({ data, start, target }) => ({ data, start, target })),
    sdDecls: [...flat.SdDecl.values()].map(({ standalone }) => ({ standalone })),
    texts,
    whitespace,
    xmlDecls: [...flat.XmlDecl.values()].map(({ version }) => ({ version })),
  };
};

/**
 * Write one generated document's insert and document layer, under {@link packageIdentifier} at
 * {@link generatedPath}.
 *
 * @param tree - The document.
 * @returns Its `Node` root and its document layer's rows.
 */
const writtenOf = (tree: XdmDocument<Composed>) => {
  const view = ownViewOf(tree);

  return {
    flat: documentRowsOf({
      ids: { assembled: false, package: packageIdentifier },
      listed: { documentType: "manifest", path: generatedPath },
      view,
    }),
    root: rootInsertOf(view, {
      documentType: "manifest",
      package: packageIdentifier,
      path: generatedPath,
    }),
  };
};

/**
 * Write one document's insert and document layer, and assemble them back.
 *
 * @param tree - The document.
 * @returns The tree assembled from the rows, or the refusal of the first row that does not fit.
 */
const roundTripOf = (tree: XdmDocument<Composed>) => {
  const { flat, root } = writtenOf(tree);

  return assemble(flatRowsOf(root, flat));
};

/**
 * What a node of a generated tree is to the nesting: an element of a kind, a foreign element of
 * any of the three wildcard shapes, or its kind of character data.
 */
type NodeClass = "comment" | "element" | "entityRef" | "pi" | "text" | "wildcard" | "ws";

/**
 * Name a node's {@link NodeClass}.
 *
 * @param node - The node.
 * @returns Its class.
 */
const classOfNode = (node: XdmChild<Composed>): NodeClass => {
  switch (node._tag) {
    case "element": {
      return "element";
    }
    case "foreign-element":
    case "no-namespace-element":
    case "own-namespace-element": {
      return "wildcard";
    }
    case "text":
    case "ws":
    case "comment":
    case "pi":
    case "entityRef": {
      return node._tag;
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * The situations of a generated tree the round trip reads, a bounded space a few hundred cases
 * meet whole: each pair of a parent's class and a child's, the document's prolog and epilog among
 * the parents; how deep its deepest element sits; and how many children its widest family holds,
 * where a slot past the first nine takes two digits.
 */
type NestingSituation =
  | `${"element" | "epilog" | "prolog" | "wildcard"} > ${NodeClass}`
  | `depth ${"1" | "2-3" | "4+"}`
  | `widest family ${"0" | "1" | "2-9" | "10+"}`;

/**
 * Bucket the depth of a tree's deepest element, the root at depth 1.
 *
 * @param deepest - The depth.
 * @returns Its situation.
 */
const depthSituation = (deepest: number): NestingSituation => {
  if (deepest <= 1) {
    return "depth 1";
  }

  return deepest <= 3 ? "depth 2-3" : "depth 4+";
};

/**
 * Bucket the children of a tree's widest family: none, one, a slot of one digit, or of two.
 *
 * @param widest - The most children one element holds.
 * @returns Its situation.
 */
const widthSituation = (widest: number): NestingSituation => {
  if (widest <= 1) {
    return widest === 0 ? "widest family 0" : "widest family 1";
  }

  return widest <= 9 ? "widest family 2-9" : "widest family 10+";
};

/**
 * Read the {@link NestingSituation}s a generated document holds.
 *
 * @param document - The document.
 * @returns Each situation, once.
 */
const nestingSituationsOf = (document: XdmDocument<Composed>): ReadonlySet<NestingSituation> => {
  const found = new Set<NestingSituation>([
    ...document.prolog.map((misc): NestingSituation => `prolog > ${misc._tag}`),
    ...document.epilog.map((misc): NestingSituation => `epilog > ${misc._tag}`),
  ]);
  let deepest = 0;
  let widest = 0;
  const stack: (readonly [XdmChild<Composed>, number])[] = [[document.root, 1]];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const [node, depth] = next;
    if ("children" in node) {
      const parent = node._tag === "element" ? "element" : "wildcard";
      deepest = Math.max(deepest, depth);
      widest = Math.max(widest, node.children.length);
      for (const child of node.children) {
        found.add(`${parent} > ${classOfNode(child)}`);
        stack.push([child, depth + 1]);
      }
    }
  }

  found.add(depthSituation(deepest));
  found.add(widthSituation(widest));

  return found;
};

/**
 * Walk a document's insert in pre-order, every node once.
 *
 * @param root - The document node.
 * @returns Its nodes, the document node first.
 */
const nodesOf = (root: NodeRoot): readonly NodeMember[] => {
  const found: NodeMember[] = [];
  const stack: NodeMember[] = [root];
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    found.push(node);
    stack.push(...node.children.toReversed());
  }

  return found;
};

/**
 * A lawful item with families whose models admit no character data (the item, its response
 * declaration, its body and its choice interaction) beside mixed ones.
 */
const familiesItem = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><p>Pick one.</p><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-prompt>Which?</qti-prompt><qti-simple-choice identifier="A">A</qti-simple-choice><qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;

/**
 * The text a case writes where its family's model admits none; {@link familiesItem} holds no other
 * text of it.
 */
const stray = "stray";

/**
 * One place character data stands unadmitted: an element whose model admits no text, by the child
 * places from the root down to it, and a slot among its children.
 */
interface UnadmittedSlot {
  readonly kind: string;
  readonly path: readonly number[];
  readonly slot: number;
}

/**
 * Find every place of a tree where character data stands unadmitted: each slot of each element
 * whose model's `Admission` holds no row for text.
 *
 * @param tree - The tree.
 * @returns The places, in document order.
 */
const unadmittedSlotsOf = (tree: XdmDocument<Composed>): readonly UnadmittedSlot[] => {
  const walk = (node: XdmChild<Composed>, path: readonly number[]): readonly UnadmittedSlot[] =>
    node._tag === "element"
      ? [
          ...(Option.isNone(
            placementOf(grammar, { child: "text", parent: node.kind, version: tree.version }),
          )
            ? Array.from({ length: node.children.length + 1 }, (_, slot) => ({
                kind: node.kind,
                path,
                slot,
              }))
            : []),
          ...node.children.flatMap((child, at) => walk(child, [...path, at])),
        ]
      : [];

  return walk(tree.root, []);
};

/**
 * Write {@link stray} into an element below a root at one place.
 *
 * @param node - The root.
 * @param place - The place, its path read from the root.
 * @returns The root with the text written.
 */
const withStray = (
  node: XdmClosedElement<Composed>,
  { path, slot }: Pick<UnadmittedSlot, "path" | "slot">,
): XdmClosedElement<Composed> => {
  const [head, ...rest] = path;

  return {
    ...node,
    children:
      head === undefined
        ? node.children.toSpliced(slot, 0, { _tag: "text", value: stray })
        : node.children.map((child, at) =>
            at === head && child._tag === "element"
              ? withStray(child, { path: rest, slot })
              : child,
          ),
  };
};

/**
 * Read each node's kind and state in pre-order, as the insert writes them.
 *
 * @param nodes - The nodes, in pre-order.
 * @returns Each as `kind state`.
 */
const statesOf = (nodes: readonly NodeMember[]): readonly string[] =>
  nodes.map(({ kind, state }) => `${kind} ${state}`);

describe("rootInsertOf", { timeout: searchTimeout }, () => {
  it.effect(
    "writes character data its family's model does not admit at its predecessor's state, and leaves every other node's state as it was",
    () =>
      // Oracle: the specification as a checker, C5 and N5 (`#pantry/qti/node.ts` N5_admitted):
      // character data steps no automaton, so it holds its predecessor's state, 0 for a first
      // child, and an unadmitted kind is refused by name while every member after it is judged as
      // though it were not there. Bound: every slot of every family of the item whose model admits
      // no text.
      Effect.gen(function* unadmitted() {
        const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(familiesItem)));
        const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));
        const insertOf = (root: XdmClosedElement<Composed>) =>
          nodesOf(
            rootInsertOf(ownViewOf({ ...tree, root }), {
              documentType: "imsqti_item_xmlv3p0",
              package: packageIdentifier,
              path: generatedPath,
            }),
          );
        const held = statesOf(insertOf(tree.root));
        const slots = unadmittedSlotsOf(tree);
        assert.includeMembers(
          slots.map(({ kind }) => kind),
          ["qti-assessment-item", "qti-response-declaration", "qti-item-body"],
        );

        for (const slot of slots) {
          const label = `${slot.kind} slot ${String(slot.slot)}`;
          const nodes = insertOf(withStray(tree.root, slot));
          const written = nodes.find(({ chars, kind }) => kind === "text" && chars === stray);
          const family = nodes.find(
            ({ children }) => written !== undefined && children.includes(written),
          );
          const at = written === undefined ? -1 : (family?.children.indexOf(written) ?? -1);

          assert.isAbove(at, -1, label);
          assert.strictEqual(
            written?.state,
            at === 0 ? "0" : family?.children[at - 1]?.state,
            label,
          );
          assert.deepStrictEqual(statesOf(nodes.filter((node) => node !== written)), held, label);
        }
      }),
  );

  it.effect(
    "nests every generated document's tree exactly as the XDM holds it, every flat row naming its node by the position the nesting draws",
    (ctx) =>
      // Oracle: a universal one, the round trip assemble ∘ draw ∘ (rootInsertOf, documentRowsOf)
      // = id, where draw takes each slot, start, end and parent from the nesting as grizzle's
      // filler does, and every flat row names its node by the start the host wrote. Bound: the
      // generator's drawn bounds, up to 200 nodes and depth 7 a tree, 300 cases. Its situations are
      // the tree's features and its nesting situations (`nestingSituationsOf`), which the nesting
      // reads.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<XdmFeature | NestingSituation>(
              [
                "element",
                "wildcard",
                "text",
                "ws",
                "comment",
                "pi",
                "entityRef",
                "attribute",
                "openName",
                "repeatedOpenClass",
                "namespace",
                "doctype",
              ],
              { cases: 300, sense: notesOnly },
            ),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "universal", name: "assemble ∘ draw ∘ rootInsertOf = id" },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/write-root-round-trip",
          },
          (generated, c) =>
            Effect.gen(function* roundTrip() {
              c.noteAll(featuresOf(generated.document));
              c.noteAll(nestingSituationsOf(generated.document));

              const assembled = yield* Effect.fromResult(roundTripOf(generated.document));

              assert.deepStrictEqual(assembled, generated.document);
            }),
        ),
      ),
  );

  it.effect(
    "writes each node's state, ancestry, nearest interaction and characters' ends, and its closed attributes' slots, as the host fold derives them",
    (ctx) =>
      // Oracle: a second implementation, the host fold of `#pantry/model/folds.ts` (Q4.01), which
      // derives each node's state through the same content grammar by its own walk, its ancestry,
      // its nearest interaction and the positions of its closed attributes' names.
      // Bound: the generator's drawn bounds, 200 cases.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<XdmFeature>(
              ["element", "wildcard", "attribute", "openName", "text"],
              {
                cases: 200,
                sense: notesOnly,
              },
            ),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the host fold of model/folds.ts" },
            runs: 200,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/write-host-fields",
          },
          (generated, c) =>
            Effect.gen(function* hostFields() {
              c.noteAll(featuresOf(generated.document));

              const folded = yield* Effect.orDie(
                Effect.fromResult(fold(generated.document, foldGrammarOf(grammar))),
              );
              const { flat, root } = writtenOf(generated.document);
              const slots = new Map<bigint, string[]>();
              for (const { slot, start } of flat.Attribute.values()) {
                slots.set(start, [...(slots.get(start) ?? []), ...slot]);
              }

              for (const [at, node] of nodesOf(root).entries()) {
                const start = BigInt(at);
                const expected = folded.nodes[at];
                if (expected === undefined) {
                  assert.fail(`the fold holds no node at ${String(start)}`);
                }

                const label = `${node.kind} at ${String(start)}`;
                assert.strictEqual(expected.start, start, label);
                assert.strictEqual(node.state, String(expected.derived.state), label);
                assert.deepStrictEqual(new Set(node.ancestry), new Set(expected.derived.ancestry));
                assert.strictEqual(node.nearest, expected.nearest, label);
                assert.strictEqual(node.nearestKind, expected.nearestKind, label);
                assert.deepStrictEqual([node.first, node.last], [expected.first, expected.last]);
                assert.deepStrictEqual(
                  (slots.get(start) ?? []).toSorted(),
                  [...expected.attrs].map(String).toSorted(),
                  label,
                );
              }
            }),
        ),
      ),
  );
});

/**
 * The accepted corpus packages (`verdicts/qti-examples-0a92fbb.tsv`), materialized.
 */
const acceptedPackages = Effect.all({
  sharedMedia: materialize("sharedMedia"),
  simple: Effect.succeed(fixtures.simple),
  svg: materializeSpec({
    edits: [],
    member: "qtiv3-examples/packaging/svg/svg.zip",
    name: "svg",
  }),
});

/**
 * How each sequence's members nest under their owner: each owner relation's count fields, and the
 * relation of the members each holds.
 */
const nestings: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map([
  ["Attribute", new Map([["idrefs", "Idref"]])],
  ["AssembledReference", new Map([["segments", "ReferenceSegment"]])],
  ["IdentityText", new Map([["idrefs", "TextIdref"]])],
  ["Instance", new Map([["children", "Instance"]])],
  ["Node", new Map([["children", "Node"]])],
]);

/**
 * The fields a nested member never names: its sequence's group, and below a tree's root its root
 * fields.
 */
const suppliedByNesting: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ["Idref", new Set(["name", "package", "path", "start"])],
  ["Instance", new Set(["assembly", "package"])],
  ["Node", new Set(["package", "path"])],
  ["TextIdref", new Set(["package", "path", "start"])],
]);

/**
 * Name the fields of a relation its caller writes: every field whose descriptor says nothing of
 * who writes it. A drawn, accumulated or generated field's descriptor carries how grizzle or
 * PostgreSQL writes it (`writing`).
 *
 * @param relation - The relation's name in `Qti`.
 * @returns Its written fields.
 */
const writtenFieldsOf = (relation: string): ReadonlySet<string> => {
  const member = Object.entries(Qti.relations).find(([name]) => name === relation)?.[1];
  const fields: object = member !== undefined && "fields" in member ? member.fields : {};

  return new Set(
    Object.entries(fields).flatMap(([name, field]: readonly [string, object]) =>
      Predicate.hasProperty(field, "writing") ? [] : [name],
    ),
  );
};

/**
 * Find every field one row names that its caller does not write: every field but its written
 * ones, the count fields its sequences nest at, and the fields its nesting supplies.
 *
 * @param relation - The row's relation.
 * @param fields - The fields the row names, as the ChangeSet carries it.
 * @param place - Where the row stands: a flat row and a tree's root name every written field, and
 *   a nested member neither its group nor the root fields.
 * @returns Each unwritten field, as `relation.field`.
 */
const unwrittenOf = (
  relation: string,
  fields: readonly string[],
  place: "flat" | "member",
): readonly string[] => {
  const written = writtenFieldsOf(relation);
  const nests = nestings.get(relation) ?? new Map<string, string>();
  const supplied: ReadonlySet<string> =
    place === "member" ? (suppliedByNesting.get(relation) ?? new Set<string>()) : new Set<string>();

  return fields.flatMap((field): readonly string[] =>
    nests.has(field) || (written.has(field) && !supplied.has(field))
      ? []
      : [`${relation}.${field}`],
  );
};

/**
 * Find every unwritten field of a program's inputs, through every nesting: each flat row's, each
 * tree's every node and instance, and each closed attribute's and identity text's IDREF tokens.
 *
 * @param program - The program.
 * @returns Each unwritten field, as `relation.field`.
 */
const unwrittenIn = (program: ImportProgram): readonly string[] => {
  const { Instance: instances, Node: roots, ...flat } = program.inputs;
  const nodes = [...roots.values()].flatMap((root) =>
    nodesOf(root).map((node) => ({ node, root: node === root })),
  );
  const instanceStack: {
    readonly instance: InstanceMember;
    readonly nested: boolean;
  }[] = [...instances.values()].map((instance) => ({ instance, nested: false }));
  const instanceFields: string[] = [];
  for (let next = instanceStack.pop(); next !== undefined; next = instanceStack.pop()) {
    instanceFields.push(
      ...unwrittenOf("Instance", Object.keys(next.instance), next.nested ? "member" : "flat"),
    );
    instanceStack.push(...next.instance.children.map((instance) => ({ instance, nested: true })));
  }

  return [
    ...Object.entries(flat).flatMap(([relation, rows]) =>
      [...rows.values()].flatMap((row) => unwrittenOf(relation, Object.keys(row), "flat")),
    ),
    ...nodes.flatMap(({ node, root }) =>
      unwrittenOf("Node", Object.keys(node), root ? "flat" : "member"),
    ),
    ...instanceFields,
    ...[...program.inputs.Attribute.values()].flatMap(({ idrefs }) =>
      idrefs.flatMap((idref) => unwrittenOf("Idref", Object.keys(idref), "member")),
    ),
    ...[...program.inputs.IdentityText.values()].flatMap(({ idrefs }) =>
      idrefs.flatMap((idref) => unwrittenOf("TextIdref", Object.keys(idref), "member")),
    ),
  ];
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "the accepted corpus packages",
  (suite) => {
    suite.effect("nest each document's tree exactly as shred read it", () =>
      // Oracle: a universal one, the round trip of the generated property, over the three accepted
      // corpus packages' every document (simple, sharedMedia, svg).
      Effect.gen(function* corpusRoundTrip() {
        const packages = yield* acceptedPackages;
        for (const dir of Object.values(packages)) {
          const program = yield* readProgram(dir);
          for (const placed of program.documents) {
            const { listed } = placed;
            const root = [...program.inputs.Node.values()].find(({ path }) => path === listed.path);
            if (root === undefined) {
              assert.fail(`${dir}: no Node root for ${listed.path}`);
            }

            const assembled = yield* Effect.fromResult(
              assemble(flatRowsOf(root, documentRowsOf(placed))),
            );

            assert.deepStrictEqual(assembled, listed.tree, `${dir} ${listed.path}`);
          }
        }
      }),
    );

    suite.effect(
      "write no field grizzle draws or fills or PostgreSQL generates, in any relation",
      () =>
        // Oracle: the specification as a checker, `Written<R>` (README, "How a field is written"),
        // read off each field's descriptor: every row of every input names only fields its caller
        // writes, a sequence's members nested at its count fields, without their group, and only a
        // tree's root naming its root fields.
        Effect.gen(function* noUnwritten() {
          const packages = yield* acceptedPackages;
          for (const dir of Object.values(packages)) {
            assert.deepStrictEqual(unwrittenIn(yield* readProgram(dir)), [], dir);
          }
        }),
    );
  },
);

describe("the written types", () => {
  it("name exactly the fields each caller writes, and no field grizzle draws or fills", () => {
    // Oracle: the specification as a checker, the W5 contract's written fields (§C and C13), held
    // by the compiler: each `satisfies` holds a type's keys to exactly this record, and
    // `Unwritten` to none of a relation's drawn, accumulated or generated fields but the count
    // fields its sequences nest at.
    const node = {
      ancestry: true,
      chars: true,
      documentType: true,
      first: true,
      governor: true,
      kind: true,
      last: true,
      nearest: true,
      nearestKind: true,
      nearestPath: true,
      prefix: true,
      state: true,
      version: true,
    } as const satisfies Record<keyof NodeFields, true>;
    const member = { ...node, children: true } as const satisfies Record<keyof NodeMember, true>;
    const root = { ...member, package: true, path: true } as const satisfies Record<
      keyof NodeRoot,
      true
    >;
    const keyed = { package: true, path: true, start: true } as const;
    const attribute = {
      ...keyed,
      idrefs: true,
      lexical: true,
      name: true,
      prefix: true,
      slot: true,
    } as const satisfies Record<keyof AttributeInsert, true>;
    const openAttribute = {
      ...keyed,
      class: true,
      elementNamespace: true,
      lexical: true,
      local: true,
      prefix: true,
      slot: true,
      uri: true,
    } as const satisfies Record<keyof Inserted<"OpenAttribute">, true>;
    const idref = { after: true, before: true, token: true } as const satisfies Record<
      keyof IdrefInsert,
      true
    >;
    const entity = { ...keyed, entity: true, name: true, offset: true } as const satisfies Record<
      keyof Inserted<"AttributeEntity">,
      true
    >;
    const openEntity = {
      ...keyed,
      entity: true,
      local: true,
      offset: true,
      uri: true,
    } as const satisfies Record<keyof Inserted<"OpenAttributeEntity">, true>;
    const namespace = { ...keyed, prefix: true, uri: true } as const satisfies Record<
      keyof Inserted<"Namespace">,
      true
    >;
    const entry = { content: true, path: true } as const satisfies Record<keyof EntryRow, true>;
    type Unwritten<R> = Exclude<keyof Fact<R>, keyof Addition<R>>;
    type Absent<T> = [T] extends [never] ? true : false;
    const noLeak = {
      attribute: true,
      entity: true,
      entry: true,
      idref: true,
      namespace: true,
      node: true,
      openAttribute: true,
      openEntity: true,
    } as const satisfies {
      readonly attribute: Absent<
        Extract<keyof AttributeInsert, Exclude<Unwritten<typeof Attribute>, "idrefs">>
      >;
      readonly entity: Absent<
        Extract<keyof Inserted<"AttributeEntity">, Unwritten<typeof AttributeEntity>>
      >;
      readonly entry: Absent<Extract<keyof EntryRow, Unwritten<typeof Entry>>>;
      readonly idref: Absent<Extract<keyof IdrefInsert, Unwritten<typeof Idref>>>;
      readonly namespace: Absent<Extract<keyof Inserted<"Namespace">, Unwritten<typeof Namespace>>>;
      readonly node: Absent<Extract<keyof NodeRoot, Exclude<Unwritten<typeof Node>, "children">>>;
      readonly openAttribute: Absent<
        Extract<keyof Inserted<"OpenAttribute">, Unwritten<typeof OpenAttribute>>
      >;
      readonly openEntity: Absent<
        Extract<keyof Inserted<"OpenAttributeEntity">, Unwritten<typeof OpenAttributeEntity>>
      >;
    };

    assert.isTrue(Object.values(noLeak).every(Boolean));
    assert.lengthOf(Object.keys(root), 15);
    assert.lengthOf(Object.keys(attribute), 8);
    assert.lengthOf(
      [openAttribute, idref, entity, openEntity, namespace, entry].flatMap((record) =>
        Object.keys(record),
      ),
      37,
    );
  });
});

/**
 * One small case of {@link unionOf}: up to three keyed sets over the keys `a` and `b`, each key
 * absent or holding the row `{ v: 1 }` or `{ v: 2 }`.
 */
type UnionCase = readonly ReadonlyMap<string, { readonly v: number }>[];

/**
 * Every {@link UnionCase}: each set draws each key's row or its absence.
 */
const unionCases: Gen<UnionCase> = array(
  (source) =>
    new Map(
      ["a", "b"].flatMap((key) => {
        const held = source.draw(int(0, 2));

        return held === 0 ? [] : [[key, { v: held }] as const];
      }),
    ),
  { max: 3, min: 0 },
);

/**
 * The situations a union case reaches.
 */
type UnionSituation = "conflict" | "equal repeat" | "disjoint";

/**
 * Name the situation a union case reached.
 *
 * @param conflict - The first key met with two rows, if any.
 * @param repeat - Whether a key was met twice with one row.
 * @returns The situation.
 */
const situationOf = (conflict: Option.Option<string>, repeat: boolean): UnionSituation => {
  if (Option.isSome(conflict)) {
    return "conflict";
  }

  return repeat ? "equal repeat" : "disjoint";
};

describe("unionOf", () => {
  it.effect("is a keyed set: an equal repeat is one row, two rows at one key a conflict", (ctx) =>
    // Oracle: a second implementation, a naive model that records each key's first row and the
    // first key, in order, met with a row of another value.
    // Bound: every list of up to 3 sets over 2 keys of 2 values, 1 + 9 + 81 + 729 = 820 cases.
    searched(
      ctx,
      exhaust(
        {
          box: "every list of up to 3 keyed sets over the keys a and b, each absent or holding v=1 or v=2",
          caseHang: Duration.seconds(10),
          coverage: requiredInSpace<UnionSituation>(["conflict", "equal repeat", "disjoint"]),
          generator: unionCases,
          literal: (value) => Formatter.format(value),
          oracle: { kind: "second-implementation", name: "the first-row model of a keyed union" },
          suite: "import/overlays-union",
        },
        (sets, c) =>
          Effect.sync(() => {
            const first = new Map<string, number>();
            let conflict: Option.Option<string> = Option.none();
            let repeat = false;
            for (const set of sets) {
              for (const [key, { v }] of set) {
                const held = first.get(key);
                if (held === undefined) {
                  first.set(key, v);
                } else if (held === v) {
                  repeat = true;
                } else if (Option.isNone(conflict)) {
                  conflict = Option.some(key);
                }
              }
            }

            c.note(situationOf(conflict, repeat));

            const union = unionOf("Case", sets);
            Option.match(conflict, {
              onNone: () => {
                assert.isTrue(Result.isSuccess(union));
                assert.deepStrictEqual(
                  Result.isSuccess(union) ? [...union.success].map(([key, { v }]) => [key, v]) : [],
                  [...first],
                );
              },
              onSome: (key) => {
                assert.isTrue(Result.isFailure(union));
                assert.strictEqual(Result.isFailure(union) ? union.failure.key : undefined, key);
              },
            });
          }),
      ),
    ),
  );
});

/**
 * The characters an IDREFS form is drawn over: two token characters and two whitespace ones.
 */
const idrefCharacters = ["a", "b", " ", "\t"] as const;

/**
 * Every text of up to 5 of {@link idrefCharacters}.
 */
const idrefTexts: Gen<string> = (source) =>
  source.draw(array(element(idrefCharacters), { max: 5, min: 0 })).join("");

describe("tokensOf, on an IDREFS form", () => {
  it.effect(
    "splits a form into its whitespace-separated tokens, whose pieces concatenate to it",
    (ctx) =>
      // Oracle: the specification as a checker, `E1_derived` on `Idref` and its fold (each
      // generated piece is its whitespace and token, the pieces concatenate to the lexical form,
      // every token but the first follows whitespace), and a second implementation, `split` on
      // XML's `S`, for the tokens.
      // Bound: every text of up to 5 characters over a, b, space and tab, (4⁶ − 1) / 3 = 1,365.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of up to 5 characters over a, b, space and tab",
            caseHang: Duration.seconds(10),
            coverage: noCoverage,
            generator: idrefTexts,
            literal: (value) => JSON.stringify(value),
            oracle: { kind: "specification", name: "E1_derived on Idref, and split on S" },
            suite: "import/write-idref-pieces",
          },
          (lexical) =>
            Effect.sync(() => {
              const pieces = tokensOf(lexical);
              const tokens = lexical.split(/[\t\n\r ]+/u).filter((token) => token.length > 0);

              assert.deepStrictEqual(
                pieces.map(({ token }) => token),
                tokens,
              );
              assert.strictEqual(
                pieces.map(({ after, before, token }) => `${before}${token}${after}`).join(""),
                tokens.length === 0 ? "" : lexical,
              );
              for (const [at, { after, before }] of pieces.entries()) {
                assert.match(`${before}${after}`, /^[\t\n\r ]*$/u);
                assert.isTrue(at === 0 || before.length > 0);
              }
            }),
        ),
      ),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("nodeIdsOf", (suite) => {
  suite.effect(
    "places a package twice as one: nothing is drawn, every row named by QTI's own identity",
    () =>
      // Oracle: the specification as a checker, the cutover's rule that an import mints nothing: the
      // same documents placed twice give equal views, every document's lookups name paths, and every
      // document holds the package's identifier. Bound: the simple package.
      Effect.gen(function* placedTwice() {
        const program = yield* readProgram(fixtures.simple);
        const listed = program.documents.map(({ listed: held }) => held);
        const entries = [...program.inputs.Entry.values()].map(({ path }) => path);
        const first = nodeIdsOf(packageIdentifier, listed, entries);
        const second = nodeIdsOf(packageIdentifier, listed, entries);

        assert.deepStrictEqual(
          first.map(({ listed: held, view }) => ({ listed: held, view })),
          second.map(({ listed: held, view }) => ({ listed: held, view })),
        );
        for (const { ids } of first) {
          assert.deepStrictEqual(ids.documentAt(ids.path), Option.some(ids.path));
          assert.strictEqual(ids.package, packageIdentifier);
        }
      }),
  );

  suite.effect(
    "reads a path listed twice as one document, and names a site's target there only where a resource lists it",
    () =>
      // Oracle: the specification as a checker, a path is one document (reading 93): the import
      // lists a resource's path once, and the manifest again where a resource names it
      // (`#pantry/import/program.ts`), so `documentAt` names the document at every listed path,
      // and `targetAt` only a path some listing names under a resource type, never the manifest's
      // own listing, which names none (reading 115). Bound: the simple package's listing with each
      // of its documents listed again at its end under the item type.
      Effect.gen(function* relisted() {
        const program = yield* readProgram(fixtures.simple);
        const listed = program.documents.map(({ listed: held }) => held);
        const entries = [...program.inputs.Entry.values()].map(({ path }) => path);
        for (const again of listed) {
          const placed = nodeIdsOf(
            packageIdentifier,
            [...listed, { ...again, documentType: "imsqti_item_xmlv3p0" }],
            entries,
          );

          for (const { ids } of placed) {
            const label = `${again.path} again, read at ${ids.path}`;
            assert.deepStrictEqual(ids.documentAt(ids.path), Option.some(ids.path), label);
            assert.strictEqual(
              Option.isSome(ids.targetAt(ids.path)),
              placed.some(
                (other) => other.ids.path === ids.path && other.ids.documentType !== "manifest",
              ),
              label,
            );
          }
        }
      }),
  );
});
