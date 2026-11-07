import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import type { Kept, Oracle } from "@grizzle/testing/explore";
import { rating, required } from "@grizzle/testing/features";
import type { Pending } from "@grizzle/testing/features";
import { element, int, shuffled } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { forcedChooser, generate } from "@grizzle/testing/source";
import { valuesFromToken } from "@grizzle/testing/tape";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Effect, Formatter, Option, Result } from "effect";
import { rowOf } from "#pantry/grammar/ancestry.ts";
import { admissionOf } from "#pantry/grammar/attributes.ts";
import type { Ancestry } from "#pantry/grammar/ancestry.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { contentFollows } from "#pantry/grammar/content.ts";
import { isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import type { Kind } from "#pantry/grammar/compose.ts";
import { foldGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { closedName, none } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  ElementKind,
  XdmAttribute,
  XdmChild,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import {
  caseHang,
  searchTimeout,
  admissibleVariants,
  closedElements,
  corrupt,
  corruption,
  editElement,
  familiesOf,
  featuresOf,
  idOf,
  invalidVariants,
  lawOf,
  situationsOf,
  variantFields,
  xdmDocument,
} from "#pantry/test/gen/xdm.ts";
import type {
  GeneratedXdm,
  InvalidVariant,
  VariantField,
  VariantTarget,
  XdmFamily,
  XdmFeature,
} from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawNames, lawsOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every property draws its trees over and folds them under.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The relations the folds read, projected from the grammar once.
 */
const foldGrammar = foldGrammarOf(grammar);

/**
 * The host's law model: the oracle's tables over the grammar, derived once.
 */
const laws = lawsOf(grammar);

/**
 * The trees every property is checked over: the one generator's, over the composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * A law's verdict on a case, `law refuses`: noted for each law a case's rows break, so a search
 * counts the laws it reached as well as the trees it built.
 */
type LawVerdict = `${LawName} refuses`;

/**
 * What a search over generated trees notes: the generator's features, the (parent kind, child
 * kind) pairs a tree holds, and each law its rows break.
 */
type Situation = XdmFeature | XdmFamily | LawVerdict;

/**
 * The features a search over generated trees must reach on its witnesses.
 */
const reached = required<Situation>(
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
    "doctype",
  ],
  { cases: 300, sense: notesOnly },
);

/**
 * Fold a document, which is total on the trees the generator builds.
 *
 * @param document - The tree.
 * @returns Its folded rows under {@link idOf}; a defect when the fold refuses it.
 */
const foldedOf = (document: XdmDocument<Composed>) =>
  Effect.orDie(Effect.fromResult(fold(document, idOf, foldGrammar)));

/**
 * The node rows of a tree by their number in document order.
 *
 * @param rows - The rows.
 * @param number - A node's number.
 * @returns The row.
 */
const nodeAt = (rows: FoldedRows<Composed>, number: number): FoldedNode<Composed> =>
  rows.nodes[number] ?? assert.fail(`no node numbered ${String(number)}`);

/**
 * List a set's members in one order, so two sets compare as lists.
 *
 * @param set - The set.
 * @returns Its members, each spelled as a string, in string order.
 */
const sorted = (set: ReadonlySet<number | string>): readonly string[] =>
  [...set].map(String).toSorted();

/**
 * Whether a kind is an interaction, which N8 makes its children's nearest.
 *
 * @param kind - The kind.
 * @returns Whether `Interaction` holds it.
 */
const isInteraction = (kind: Kind): boolean =>
  Option.isSome(grammar.kinds.interaction.lookup({ kind }));

/**
 * An exploration of the generator's trees, with the settings every property here shares.
 *
 * @param suite - The suite's label.
 * @param oracle - What its property is checked against.
 * @returns The exploration's settings.
 */
const over = (suite: string, oracle: Oracle) =>
  ({
    caseHang,
    concurrency: 1,
    coverage: reached,
    draw: drawn(documents),
    kept: [],
    literal: Formatter.format,
    oracle,
    runs: 300,
    shrink: completeShrink,
    steerEvery: 16,
    suite,
  }) as const;

/**
 * The node invariants' oracle: the generator's model of where it placed each node.
 */
const placedOracle: Oracle = {
  kind: "second-implementation",
  name: "the generator's model of the tree, with plan §1.3's N1 to N3 and trees.md's T2",
};

/**
 * The identities' oracle: each fold's identity as fin.md §4.3 states it.
 */
const identityOracle: Oracle = {
  kind: "specification",
  name: "fin.md §4.3's identities, state 0, the empty set and the count 0, and N1's sentinel copies",
};

/**
 * The naive recomputation's oracle: each fold computed from the whole tree at once.
 */
const naiveOracle: Oracle = {
  kind: "second-implementation",
  name: "each fold's meaning recomputed naively from the whole tree",
};

/**
 * The count and set folds' oracle: their metamorphic relations.
 */
const metamorphicOracle: Oracle = {
  kind: "universal",
  name: "elements and attrs fold the same under a permutation, elements counts each element copied, and attrs is idempotent",
};

/**
 * The refusals' oracle: the grammar's admission cells, a missing one a refusal.
 */
const admissionOracle: Oracle = {
  kind: "specification",
  name: "a fold reads one Admission cell per child and one AttributeAdmission cell per attribute, and a missing cell is a refusal",
};

/**
 * The valid trees' oracle: the host's law model.
 */
const lawModelOracle: Oracle = {
  kind: "specification",
  name: "the host's law model (#pantry/test/oracle.ts) over trees built to meet its laws",
};

/**
 * N6's oracle: each node's ancestry walked up its parents.
 */
const ancestryOracle: Oracle = {
  kind: "second-implementation",
  name: "plan §1.3's N6 read off the whole tree, each ancestor's entered flags walked up its parents",
};

/**
 * The invalid variants' oracle: each variant's law as `lawOf` names it.
 */
const variantOracle: Oracle = {
  kind: "specification",
  name: "the host's law model, naming each invalid variant's law as lawOf does",
};

describe("fold over generated trees", { timeout: searchTimeout }, () => {
  it.effect(
    "is total on valid trees and holds Node(parent, at)'s invariants where the generator's model places each node",
    (ctx) =>
      // Oracle: a second implementation, the generator's model of the tree, its intervals written as
      // it closed each subtree, and the specification as a checker, plan §1.3's N1 to N3 and
      // trees.md's T2: a self-parented sentinel alone at start 0, each family's slots 0 to n − 1,
      // each parentStart its parent's start, one row per node.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree.
      searched(
        ctx,
        explore(over("model/folds-node-invariants", placedOracle), ({ document, model }, c) =>
          Effect.gen(function* nodeInvariants() {
            c.noteAll(featuresOf(document));
            c.noteAll(familiesOf(model));

            const rows = yield* foldedOf(document);
            const sentinel = nodeAt(rows, 0);
            const children = (number: number) =>
              model.filter((placed, index) => index > 0 && placed.parent === number).length;

            assert.deepStrictEqual(
              rows.nodes.map(
                ({ at, children: count, end, id, kind, parent, parentStart, start }) => ({
                  at,
                  children: count,
                  end,
                  id,
                  kind,
                  parent,
                  parentStart,
                  start,
                }),
              ),
              model.map((placed, number) => ({
                at: BigInt(placed.at),
                children: BigInt(children(number)),
                end: BigInt(placed.end),
                id: idOf(number),
                kind: placed.kind,
                parent: idOf(placed.parent),
                parentStart: BigInt(model[placed.parent]?.start ?? -1),
                start: BigInt(placed.start),
              })),
            );
            assert.deepStrictEqual(
              rows.nodes
                .filter(({ id, parent }) => id === parent)
                .map(({ id, start }) => [id, start]),
              [[sentinel.id, 0n]],
            );
            assert.strictEqual(new Set(rows.nodes.map(({ id }) => id)).size, rows.nodes.length);
          }),
        ),
      ),
  );

  it.effect(
    "starts every fold at its identity: each first slot's copies, each empty family's end values, each first attribute's names, and the sentinel's own copies",
    (ctx) =>
      // Oracle: the specification as a checker, fin.md §4.3: the identity of the content
      // automaton's state is its start, 0, of a set the empty set, and of a count 0; and N1 pins the
      // sentinel's copies.
      // Bound: the generator's drawn bounds.
      searched(
        ctx,
        explore(over("model/folds-identities", identityOracle), ({ document, model }, c) =>
          Effect.gen(function* identities() {
            c.noteAll(featuresOf(document));
            c.noteAll(familiesOf(model));

            const rows = yield* foldedOf(document);
            const sentinel = nodeAt(rows, 0);

            for (const node of rows.nodes.filter(({ at }) => at === 0n)) {
              assert.deepStrictEqual([node.was, node.elementsWas], [0, 0n], node.id);
            }

            for (const node of rows.nodes.filter(({ children }) => children === 0n)) {
              assert.deepStrictEqual([node.childState, node.elementChildren], [0, 0n], node.id);
            }

            for (const attribute of rows.attributes.filter(({ at }) => at === 0n)) {
              assert.deepStrictEqual(sorted(attribute.attrsWas), [], attribute.id);
            }

            assert.deepStrictEqual(
              {
                document: sentinel.document,
                nearest: sentinel.nearest,
                nearestKind: sentinel.nearestKind,
                parent: sentinel.parent,
                parentAncestry: sorted(sentinel.parentAncestry),
                parentKind: sentinel.parentKind,
                parentNearest: sentinel.parentNearest,
                parentNearestKind: sentinel.parentNearestKind,
              },
              {
                document: sentinel.id,
                nearest: sentinel.id,
                nearestKind: "document",
                parent: sentinel.id,
                parentAncestry: [],
                parentKind: "document",
                parentNearest: sentinel.id,
                parentNearestKind: "document",
              },
            );
          }),
        ),
      ),
  );

  it.effect("agrees with a naive recomputation of every fold over the whole tree", (ctx) =>
    // Oracle: a second implementation, each fold's meaning computed from the whole tree at once:
    // `parentStart` as the parent's start, `nearest` as the nearest interaction among the
    // ancestors, `stringValue` as the characters of the node's text, whitespace and entity rows,
    // `parentAncestry` as the flags they enter; a node's state as its own `Admission` position, or
    // for a kind several positions name the one of its `Symbol` positions `Follow` allows after its
    // predecessor's state, walked here from the family's start (Unique Particle Attribution makes
    // it one), or for character data its predecessor's state (0 for a first child); a family's end
    // state as its last child's; its element count; `attrs` as its closed attributes'
    // positions, since an open class is one position for many names, which the fold steps over
    // (the W5 amendment's C9); and `first` and `last` as the first and last code points of the
    // node's own text, whitespace or entity row (reading 127).
    // Bound: the generator's drawn bounds.
    searched(
      ctx,
      explore(over("model/folds-naive", naiveOracle), ({ document, model }, c) =>
        Effect.gen(function* naive() {
          c.noteAll(featuresOf(document));
          c.noteAll(familiesOf(model));

          const rows = yield* foldedOf(document);
          const byId = new Map(rows.nodes.map((node) => [node.id, node]));
          const self = rows.document.node;
          const charactersOf = new Map([
            ...[...rows.texts, ...rows.whitespace].map(({ node, value }) => [node, value] as const),
            ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
          ]);
          for (const node of rows.nodes) {
            const above: FoldedNode<Composed>[] = [];
            for (
              let at = node.id === self ? undefined : byId.get(node.parent);
              at !== undefined;
              at = at.id === self ? undefined : byId.get(at.parent)
            ) {
              above.push(at);
            }

            const family = rows.nodes.filter(({ id, parent }) => parent === node.id && id !== self);
            const key = (child: FoldedNode<Composed>) => ({
              child: child.kind,
              parent: node.kind,
              version: node.version,
            });
            const walked = new Map<FoldedNode<Composed>, number>();
            const stateOf = (child: FoldedNode<Composed>): number => {
              const known = walked.get(child);
              if (known !== undefined) {
                return known;
              }

              const before = family.findLast(({ at }) => at < child.at);
              const was = before === undefined ? 0 : stateOf(before);
              const position = Option.match(grammar.admission.lookup(key(child)), {
                onNone: () => -1,
                onSome: ({ position: cell }) => Number(cell),
              });
              const shared = grammar.content.sharedPositions({
                kind: child.kind,
                parent: node.kind,
                version: node.version,
              });
              const followed = shared.filter((to) =>
                contentFollows(grammar.content, {
                  from: String(was),
                  parent: node.kind,
                  to: String(to),
                  version: node.version,
                }),
              );
              // Character data leaves the state as it was; a kind several positions name takes the
              // one position `Follow` allows, and no state where none or several are allowed.
              let state = position;
              if (position === 0 && !Arr.isReadonlyArrayNonEmpty(shared)) {
                state = was;
              } else if (position === 0) {
                state = followed.length === 1 ? (followed[0] ?? -1) : -1;
              }

              walked.set(child, state);

              return state;
            };
            const nearest = above.find(({ kind }) => isInteraction(kind)) ?? nodeAt(rows, 0);
            const entered: Ancestry = new Set(
              above.flatMap(({ kind }) => [...rowOf(grammar.ancestry.enters, kind)]),
            );
            const names = rows.attributes
              .filter(
                (attribute) =>
                  attribute.node === node.id &&
                  !openClasses.some((open) => open === attribute.name),
              )
              .map(({ name }) =>
                Option.match(
                  admissionOf(grammar.attributes, {
                    governs: node.governs,
                    kind: node.kind,
                    name,
                    version: node.version,
                  }),
                  { onNone: () => -1, onSome: ({ position }) => position },
                ),
              );

            assert.deepStrictEqual(
              {
                attrs: sorted(node.attrs),
                childState: node.childState,
                document: node.document,
                elementChildren: node.elementChildren,
                first: node.first,
                last: node.last,
                nearest: node.nearest,
                nearestKind: node.nearestKind,
                parentAncestry: sorted(node.parentAncestry),
                parentStart: node.parentStart,
                stringValue: node.stringValue,
              },
              {
                attrs: sorted(new Set(names)),
                childState: Option.match(Option.fromNullishOr(family.at(-1)), {
                  onNone: () => 0,
                  onSome: stateOf,
                }),
                document: self,
                elementChildren: BigInt(
                  family.filter(({ kind }) =>
                    Option.isSome(grammar.kinds.isElement.lookup({ kind })),
                  ).length,
                ),
                first: Array.from(charactersOf.get(node.id) ?? "", String)[0] ?? "",
                last: Array.from(charactersOf.get(node.id) ?? "", String).at(-1) ?? "",
                nearest: nearest.id,
                nearestKind: nearest.kind,
                parentAncestry: sorted(entered),
                parentStart: (above[0] ?? node).start,
                stringValue: family.map(({ id }) => charactersOf.get(id) ?? "").join(""),
              },
              node.id,
            );
            assert.deepStrictEqual(
              family.map(({ derived, was }) => [was, derived.state]),
              family.map((child, at) => [
                Option.match(Option.fromNullishOr(family[at - 1]), {
                  onNone: () => 0,
                  onSome: stateOf,
                }),
                stateOf(child),
              ]),
              node.id,
            );
          }
        }),
      ),
    ),
  );
});

describe("fold's count and set folds", { timeout: searchTimeout }, () => {
  /**
   * What a metamorphic case did to an element: permuted its children and attributes, appended
   * copies of one child, or appended a copy of one attribute.
   */
  type Edit = "permuted" | "copied once" | "copied twice" | "attribute copied";

  it.effect(
    "fold a family's count and an element's names the same in any order, count each element copied, and hold a name's position once however often it occurs",
    (ctx) =>
      // Oracle: metamorphic relations: `elements` and `attrs` are commutative folds (any order of a
      // family or of the attributes folds to the same end values); `elements` grows by one for each
      // element copied and by none for character data; and `attrs`, an OR, is idempotent (an
      // attribute copied adds no position). A family a permutation or a copy takes out of its
      // content model whose kinds several positions name has no fold, and the case is set aside.
      // Bound: the generator's drawn bounds, one element edited a case.
      searched(
        ctx,
        explore(
          {
            ...over("model/folds-metamorphic", metamorphicOracle),
            coverage: required<Edit>(
              ["permuted", "copied once", "copied twice", "attribute copied"],
              { cases: 300, sense: notesOnly },
            ),
          },
          ({ document, model }, c) =>
            Effect.gen(function* metamorphic() {
              const owners = closedElements(model);
              if (!Arr.isReadonlyArrayNonEmpty(owners)) {
                assert.fail("a generated tree has a root element");
              }

              const target = c.draw(element(owners));
              const before = nodeAt(yield* foldedOf(document), target);
              const edit = c.draw(
                element(["permuted", "copied once", "copied twice", "attribute copied"] as const),
              );
              let elementsCopied = 0n;
              const edited = editElement(document, target, (owner) => {
                switch (edit) {
                  case "permuted": {
                    return {
                      ...owner,
                      attributes: c.draw(
                        shuffled<XdmAttribute<Composed>>(owner.attributes, {
                          max: owner.attributes.length,
                          min: owner.attributes.length,
                        }),
                      ),
                      children: c.draw(
                        shuffled<XdmChild<Composed>>(owner.children, {
                          max: owner.children.length,
                          min: owner.children.length,
                        }),
                      ),
                    };
                  }
                  case "attribute copied": {
                    const copied = owner.attributes.at(
                      c.draw(int(0, Math.max(0, owner.attributes.length - 1))),
                    );

                    return copied === undefined
                      ? owner
                      : { ...owner, attributes: [...owner.attributes, copied] };
                  }
                  case "copied once":
                  case "copied twice": {
                    const copied = owner.children.at(
                      c.draw(int(0, Math.max(0, owner.children.length - 1))),
                    );
                    if (copied === undefined) {
                      return owner;
                    }

                    const copies = edit === "copied once" ? [copied] : [copied, copied];
                    elementsCopied = "children" in copied ? BigInt(copies.length) : 0n;

                    return { ...owner, children: [...owner.children, ...copies] };
                  }
                  default: {
                    return edit satisfies never;
                  }
                }
              });
              const folded = fold(edited, idOf, foldGrammar);
              yield* c.assume(Result.isSuccess(folded));
              c.note(edit);

              const after = nodeAt(yield* Effect.orDie(Effect.fromResult(folded)), target);

              assert.deepStrictEqual(sorted(after.attrs), sorted(before.attrs));
              assert.strictEqual(after.elementChildren, before.elementChildren + elementsCopied);
            }),
        ),
      ),
  );
});

describe("fold's refusals", { timeout: searchTimeout }, () => {
  /**
   * What a refusal case added: a child its parent does not admit, or an attribute its kind does
   * not admit.
   */
  type Unadmitted = "child" | "attribute";

  it.effect(
    "refuses a child its parent does not admit and an attribute its kind does not admit, naming each",
    (ctx) =>
      // Oracle: the specification as a checker: a fold reads one `Admission` cell per child and one
      // `AttributeAdmission` cell per attribute, and a missing cell is a refusal.
      // Bound: the generator's drawn bounds, one addition a case.
      searched(
        ctx,
        explore(
          {
            ...over("model/folds-refusals", admissionOracle),
            coverage: required<Unadmitted>(["child", "attribute"], {
              cases: 300,
              sense: notesOnly,
            }),
          },
          ({ document, model }, c) =>
            Effect.gen(function* refusals() {
              const owners = closedElements(model);
              if (!Arr.isReadonlyArrayNonEmpty(owners)) {
                assert.fail("a generated tree has a root element");
              }

              const target = c.draw(element(owners));
              const owner = model[target] ?? assert.fail("no owner");
              const { kind } = owner;
              const { version } = document;
              let governs = none;

              editElement(document, target, (held) => {
                ({ governs } = held);

                return held;
              });

              const kinds = grammar.kinds.nodeKind.handles.filter(
                (child): child is ElementKind<Composed> =>
                  !isForeignKind(child) &&
                  !["document", "doctype", "text", "ws", "comment", "pi", "entityRef"].includes(
                    child,
                  ) &&
                  Option.isNone(grammar.admission.lookup({ child, parent: kind, version })),
              );
              const names = grammar.kinds.attributeName.handles.filter(
                (name): name is ClosedName<Composed> =>
                  !openClasses.some((open) => open === name) &&
                  Option.isNone(admissionOf(grammar.attributes, { governs, kind, name, version })),
              );
              const added = c.draw(element(["child", "attribute"] as const));
              if (added === "child" && Arr.isReadonlyArrayNonEmpty(kinds)) {
                c.note("child");

                const child = c.draw(element(kinds));
                const edited = editElement(document, target, (held) => ({
                  ...held,
                  children: [
                    {
                      _tag: "element",
                      attributes: [],
                      children: [],
                      governs: grammar.xsi.declaredType(version, child),
                      kind: child,
                      namespaces: [],
                      prefix: "",
                    },
                    ...held.children,
                  ],
                }));
                const refusal = yield* Effect.flip(
                  Effect.fromResult(fold(edited, idOf, foldGrammar)),
                );

                assert.deepStrictEqual(
                  [
                    refusal._tag,
                    refusal.node,
                    refusal.kind,
                    refusal._tag === "ChildUnadmitted" ? refusal.reason : "",
                  ],
                  ["ChildUnadmitted", idOf(target + 1), child, "unadmitted"],
                );
              } else if (Arr.isReadonlyArrayNonEmpty(names)) {
                c.note("attribute");

                const name = c.draw(element(names));
                const edited = editElement(document, target, (held) => ({
                  ...held,
                  attributes: [
                    { lexical: "v", name: closedName(name), references: [] },
                    ...held.attributes,
                  ],
                }));
                const refusal = yield* Effect.flip(
                  Effect.fromResult(fold(edited, idOf, foldGrammar)),
                );

                assert.deepStrictEqual(
                  [refusal._tag, refusal.node, refusal.kind === kind],
                  ["AttributeUnadmitted", idOf(target), true],
                );
              }
            }),
        ),
      ),
  );
});

/**
 * The laws a generated tree is not built to meet, each with its reason: the generator constructs
 * the tree's shape, its order and its names, and leaves to fall where they fall the laws over what
 * it draws without reading (its lexical forms, identifiers and counts), and a package's laws, which
 * a document's breaches never evaluate. Every other law of the oracle holds on every generated
 * tree, a law added to the oracle included.
 */
const unconstructed = {
  "AL3 required": "the required attributes, which the generator draws a subset of",
  "AL5 attribute count": "spec readings 41 and 43's attribute counts",
  "Adaptive feedback":
    "an interaction's place under feedback in an item's mode, drawn without reading",
  "AreaMapping base type": "a declaration's base type, a value drawn without reading",
  Arity: "an operator's arity, a count of children the content automaton relaxes",
  "Binding cardinality": "a response binding, over identifiers drawn without reading",
  "Binding declared": "a response binding, over identifiers drawn without reading",
  BindingFit: "a response binding, over identifiers drawn without reading",
  "Card default entry":
    "a card's support (or a card entry's default), a value drawn without reading",
  "Card support": "a card's support (or a card entry's default), a value drawn without reading",
  "Catalog reference": "an IDREF's target kind, over values drawn without reading",
  "Choice bounds": "an interaction's choice counts, values drawn without reading",
  "Choice identifier key": "a choice's identifier, a value drawn without reading",
  "Choice not variable":
    "a choice's identifier against its document's declarations, values drawn without reading",
  "Condition type": "a condition's type, over expressions drawn without typing",
  "Context variable reference": "a reference, over identifiers drawn without reading",
  "Custom interaction version": "an interaction's version, drawn without reading",
  "Declaration base type":
    "a declaration's base type against its cardinality, values drawn without reading",
  "Declaration key": "a declaration's identifier, a value drawn without reading",
  "Declaration not reserved": "a declaration's identifier, a value drawn without reading",
  "Document entry": "a package's law",
  "DocumentId key": "an ID's uniqueness, over values drawn without reading",
  "Feedback outcome type": "a reference, over identifiers drawn without reading",
  "Feedback reference": "a reference, over identifiers drawn without reading",
  "File listed": "a package's law",
  "Graphic gap match default hotspot": "the default hotspot's place among its siblings",
  "Href listed": "a package's law",
  "Idref target": "an IDREF's target, over values drawn without reading",
  "Item duration": "a reference to duration in an item's timing, drawn without reading",
  "Label tools":
    "the item root's tool-name and tool-version, attributes the generator draws a subset of",
  "Literal lexical": "a base value's text against its base type, over text drawn without reading",
  LomObjectIdentifier: "a package's law",
  "Lookup table cardinality": "a declaration's cardinality, a value drawn without reading",
  "Lookup type": "a lookup's expression type and table, drawn without typing",
  "Manifest id space": "a package's law",
  "Map key": "a mapping's keys, values drawn without reading",
  MappableBaseType: "a declaration's base type, a value drawn without reading",
  "Mapped response": "a mapped response's declaration and tables, drawn without reading",
  "Mastery range": "a declaration's mastery and normal bounds, values drawn without reading",
  "MathML align first":
    "an alignment group's place in a table cell, which a generated tree draws without reading §3.5.5.2",
  "MathML align placement":
    "an alignment group's place in a table cell, which a generated tree draws without reading §3.5.5.2",
  "MathML arity": "an operator's arity, a count of children the content automaton relaxes",
  "MathML cn form":
    "a cn's type, base and text, values a generated tree draws without reading them",
  "MathML head qualifier":
    "an operator's qualifier children, which a generated tree draws without reading the operator's syntax table",
  "MathML maction selection":
    "an maction's selection and children, values a generated tree draws without reading them",
  "MathML share cycle":
    "a share's fragment and the elements it dominates, which a generated tree draws without reading §4.2.7",
  "Max strings required":
    "an extended text interaction's binding, over identifiers drawn without reading",
  "N6 ancestry":
    "the ancestry bans, which the generator does not read; a search of its own judges N6",
  "N7 Counted": "the counts of 2…n the content automaton relaxes",
  "N7 barred by": "the children an attribute bars",
  "One base": "an operator's operand types, over expressions drawn without typing",
  "Operand fit": "an operator's operand types, over expressions drawn without typing",
  "Outcome only": "a test operator's processing language, over expressions drawn without reading",
  "PCI module source": "a PCI's module forms, attributes and children drawn without reading",
  "Printed variable reference": "a reference, over identifiers drawn without reading",
  "Record field key": "a record value's field identifiers, values drawn without reading",
  RecordBindingFit: "a response binding, over identifiers drawn without reading",
  "Reference type": "a reference's declared type, over identifiers drawn without reading",
  "Reserved type":
    "a built-in variable's declared type, over identifiers and base types drawn without reading",
  RootOfType: "a package's law",
  "SSML lexicon reference": "a reference, over identifiers drawn without reading",
  "SSML trim mark": "a mark's name, a value drawn without reading",
  "Selection bound": "a selection's count, a value drawn without reading",
  "Set type": "a setter's expression type, over expressions drawn without typing",
  "Slider bounds": "a slider's bounds, values drawn without reading",
  "Table headers":
    "a cell's header tokens against its table's th ids (reading 126), over identifiers drawn without reading",
  "Template reads": "what template processing reads, over identifiers drawn without reading",
  "Template reference": "a reference, over identifiers drawn without reading",
  "Template variable type": "a reference's declared type, over identifiers drawn without reading",
  TextDomain: "an element's value domain, over text drawn without reading",
  "Typed value": "a value's text against its base type, over text drawn without reading",
  "Usage typed value":
    "a usage value's text against its base type, over text drawn without reading",
  "Value cardinality":
    "a declaration's count of values against its cardinality, a count the content automaton relaxes",
  "Variable declared": "a reference, over identifiers drawn without reading",
  "Variable kind": "a reference's declaration kind, over identifiers drawn without reading",
  "Weighted base": "a test variables' base type beside its weight, drawn without reading",
  "default hotspot last slot": "the default hotspot's place among its siblings",
  "value domain": "an attribute's value domain, over lexical forms drawn without reading",
} as const satisfies Partial<Readonly<Record<LawName, string>>>;

/**
 * The laws a generated tree is built to meet: every law of the oracle (`lawNames`), its node,
 * attribute, character-data and overlay laws, but those {@link unconstructed} names.
 */
const constructed: ReadonlySet<LawName> = new Set(
  lawNames.filter((law) => !Object.hasOwn(unconstructed, law)),
);

/**
 * What a search over the variants notes: each variant, the field it edits, the kind of its target,
 * and each law the corrupted rows break.
 */
type VariantSituation = InvalidVariant | VariantField | VariantTarget | LawVerdict;

/**
 * The variants a case draws among: under steering, the pending ones its tree admits, a variant
 * pending where it or one of the fields it edits is, so a variant only a rare tree admits is drawn
 * whenever such a tree comes; otherwise, and when none of them is pending, every variant.
 *
 * @param generated - The case's tree.
 * @param steering - The case's steering, none for a plain draw.
 * @returns The variants.
 */
const steeredVariants = (
  generated: GeneratedXdm,
  steering: Option.Option<Pending<VariantSituation>>,
): Arr.NonEmptyReadonlyArray<InvalidVariant> => {
  const pending = Option.match(steering, {
    onNone: () => [],
    onSome: (pendingNow) =>
      admissibleVariants(generated).filter(
        (variant) =>
          pendingNow.has(variant) ||
          variantFields.some((field) => field.startsWith(`${variant} `) && pendingNow.has(field)),
      ),
  });

  return Arr.isReadonlyArrayNonEmpty(pending) ? pending : invalidVariants;
};

/**
 * What the N6 search notes: whether a case's tree breaks N6 anywhere, and whether it was built
 * with a banned child.
 */
type N6Situation = "N6 holds" | "N6 refuses" | "banned child";

/**
 * Whether a kind is an element of a kind: neither a kind the XDM fixes nor a foreign one.
 *
 * @param kind - A `NodeKind` handle.
 * @returns Whether it is.
 */
const isClosedKind = (kind: string): kind is ElementKind<Composed> =>
  !isForeignKind(kind) &&
  !["document", "doctype", "text", "ws", "comment", "pi", "entityRef"].includes(kind);

/**
 * Each (version, parent kind)'s element children that take a position of their own, which a fold
 * places without reading `Follow`, so one added first in a family still folds.
 */
const placedAlone: ReadonlyMap<string, readonly ElementKind<Composed>[]> = new Map(
  [
    ...Map.groupBy(
      grammar.admission.rows.filter(({ position }) => position !== "0"),
      ({ parent, version }) => `${version} ${parent}`,
    ),
  ].map(([key, held]) => [key, held.flatMap(({ child }) => (isClosedKind(child) ? [child] : []))]),
);

/**
 * The tape of the tree that broke "Table headers" in a search that held it to every generated tree:
 * a td that no table holds, so takes part in none, whose headers name `v` (reading 126). It was the
 * free suite's red at 9b3a28a1 (TEST_SEED=2144430066, the rotating stream's case 199, shrunk), from
 * 4d7eed2f, which stated the law without naming it among the {@link unconstructed}.
 */
const headersOutsideTableTape = valuesFromToken(
  "0.2.0.3.3.0.0.3.3.3.d.3.d.0.0.0.1.0.0.4.3.1.0.e.0.2.0.a3.0.0.4.0.0.0.0.0.0.0.0.0.0.0.0.0.0.gw.0.2.0.0.1.0.0.0.0.0.0.0.0.1.p.1.0.0.2.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.57b.0.2.0.0.1.0.0.0.0.0.0.0.0.0.0.0.2.0.0.0.0.0.0.2.0.0.2.0.3.0.0.0.0.0.0.0.4.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.1dk.0.2.0.0.0.0.0.0.0.2.0.0.0.2.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.2.0.1.1j.1.0.0.0.0.0.0",
);

/**
 * That tree, drawn again from its tape: a kept case of the search below, which must still meet
 * every constructed law and still break "Table headers", so the law stays stated and stays
 * unconstructed.
 */
const headersOutsideTable: Kept<GeneratedXdm, Situation> = {
  draws: "",
  note: "a td no table holds names a header: Table headers falls where it falls",
  reaches: ["Table headers refuses"],
  sketch: generate(
    documents,
    forcedChooser(headersOutsideTableTape, headersOutsideTableTape.length),
  ).value,
};

describe("the host's law model over folded rows", { timeout: searchTimeout }, () => {
  it.effect("holds every law a generated tree is built to meet", (ctx) =>
    // Oracle: the specification as a checker, the host's law model (`#pantry/test/oracle.ts`),
    // over the rows fold writes for trees built to meet those laws: every law of the oracle but
    // those `unconstructed` names, AL2's distinctness among them over elements that carry two
    // names of one open class.
    // Bound: the generator's drawn bounds.
    searched(
      ctx,
      explore(
        { ...over("model/folds-laws-valid", lawModelOracle), kept: [headersOutsideTable] },
        ({ document, model }, c) =>
          Effect.gen(function* valid() {
            c.noteAll(featuresOf(document));
            c.noteAll(familiesOf(model));

            const rows = yield* foldedOf(document);
            const breaches = documentBreaches("generated.xml", rows, laws);
            c.noteAll(breaches.map(({ law }): LawVerdict => `${law} refuses`));

            assert.deepStrictEqual(
              breaches.filter(({ law }) => constructed.has(law)),
              [],
            );
          }),
      ),
    ),
  );

  it.effect(
    "breaks N6 exactly at the nodes whose ancestors enter a flag their kind is banned under or miss one it needs",
    (ctx) =>
      // Oracle: a second implementation, N6 read off the whole tree: a node's ancestry as the flags
      // every ancestor's kind enters, walked up its parents (plan §1.3's N6), against its kind's
      // `Banned` and `Needs` rows. The oracle's N6 reads the copy of the parent's ancestry
      // instead, so a law that read the node's own ancestry, which holds the flags its own kind
      // enters, refuses every interaction, banned under the `int` it enters.
      // Bound: the generator's drawn bounds. The generator reads no ban, and a tree it draws breaks
      // one about once in 450 (11 of 5,000 measured), so the `banned child` arm builds one where
      // the tree has room: it adds a child of a kind its element admits at a position of its own,
      // which a fold places without reading `Follow`, under a flag that kind is banned under. Few
      // trees have room (an element under a flag that admits a kind banned there), so the search
      // rates both, and the witnesses must reach both.
      searched(
        ctx,
        explore(
          {
            ...over("model/folds-n6-naive", ancestryOracle),
            coverage: rating(
              required<N6Situation>(["N6 holds", "N6 refuses", "banned child"], {
                cases: 300,
                sense: notesOnly,
              }),
              ["banned child", "N6 refuses"],
            ),
          },
          ({ document, model }, c) =>
            Effect.gen(function* bans() {
              const { version } = document;
              const enteredAt = (number: number): ReadonlySet<string> => {
                const entered = new Set<string>();
                for (
                  let at: number | undefined = number;
                  at !== undefined;
                  at = at === 0 ? undefined : model[at]?.parent
                ) {
                  for (const flag of rowOf(grammar.ancestry.enters, model[at]?.kind ?? "")) {
                    entered.add(flag);
                  }
                }

                return entered;
              };
              const bannedChildren = closedElements(model).flatMap((number) => {
                const owner = model[number]?.kind ?? "";
                const entered = enteredAt(number);

                return (placedAlone.get(`${version} ${owner}`) ?? [])
                  .filter((child) =>
                    [...rowOf(grammar.ancestry.banned, child)].some((flag) => entered.has(flag)),
                  )
                  .map((child) => ({ child, number }));
              });
              const arm = c.draw(element(["as drawn", "banned child"] as const));
              let tree = document;
              if (arm === "banned child" && Arr.isReadonlyArrayNonEmpty(bannedChildren)) {
                c.note("banned child");

                const { child, number } = c.draw(element(bannedChildren));
                tree = editElement(document, number, (held) => ({
                  ...held,
                  children: [
                    {
                      _tag: "element",
                      attributes: [],
                      children: [],
                      governs: grammar.xsi.declaredType(version, child),
                      kind: child,
                      namespaces: [],
                      prefix: "",
                    },
                    ...held.children,
                  ],
                }));
              }

              const rows = yield* foldedOf(tree);
              const byId = new Map(rows.nodes.map((node) => [node.id, node]));
              const self = rows.document.node;
              const walked = rows.nodes.filter((node) => {
                const entered = new Set<string>();
                for (
                  let at = node.id === self ? undefined : byId.get(node.parent);
                  at !== undefined;
                  at = at.id === self ? undefined : byId.get(at.parent)
                ) {
                  for (const flag of rowOf(grammar.ancestry.enters, at.kind)) {
                    entered.add(flag);
                  }
                }

                return (
                  [...rowOf(grammar.ancestry.banned, node.kind)].some((flag) =>
                    entered.has(flag),
                  ) ||
                  [...rowOf(grammar.ancestry.needs, node.kind)].some((flag) => !entered.has(flag))
                );
              });
              const refused = documentBreaches("generated.xml", rows, laws).filter(
                ({ law }) => law === "N6 ancestry",
              );
              c.note(walked.length > 0 ? "N6 refuses" : "N6 holds");

              assert.deepStrictEqual(
                refused.map(({ keys }) => keys["id"] ?? "").toSorted(),
                walked.map(({ id }) => id).toSorted(),
              );
            }),
        ),
      ),
  );

  it.effect("refuses every named invalid variant by its law", (ctx) =>
    // Oracle: the specification as a checker, the host's law model, which must name each variant's
    // law (`lawOf`); PostgreSQL's laws meet the same variants at W5.
    // Bound: the generator's drawn bounds, every variant a tree admits and every field of each
    // copy and accumulator variant; a steered case draws among the pending variants its tree
    // admits, since some need a rare tree (a foreign element, which `wrongClass` needs, is in
    // about one tree in ten).
    searched(
      ctx,
      explore(
        {
          ...over("model/folds-laws-variants", variantOracle),
          coverage: required<VariantSituation>([...invalidVariants, ...variantFields], {
            cases: 400,
            sense: notesOnly,
          }),
        },
        (generated: GeneratedXdm, c) =>
          Effect.gen(function* variants() {
            const variant = c.draw(corruption(generated, steeredVariants(generated, c.steering)));
            c.noteAll(situationsOf(generated, variant));

            const rows = corrupt(yield* foldedOf(generated.document), variant);
            const broken = new Set(
              documentBreaches("generated.xml", rows, laws).map(({ law }) => law),
            );
            c.noteAll([...broken].map((law): LawVerdict => `${law} refuses`));

            assert.isTrue(
              broken.has(lawOf[variant._tag]),
              `${variant._tag}: ${[...broken].join(", ")}`,
            );
          }),
      ),
    ),
  );
});
