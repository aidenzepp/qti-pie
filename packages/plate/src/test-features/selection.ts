/**
 * Selection (S-3), landed by issue m3f-02: the test model dispatches each `qti-selection` to its
 * `parse`, which reads the element into a {@link SelectionNode} the test holds under
 * `qti-selection`, and `sequence` selects and orders every section of the test under the session's
 * processing seed, so a test holding either element is accepted and no longer marked.
 *
 * One walk applies both features (reading 66: selection runs first, then ordering shuffles the
 * selected children around the fixed ones). A section selects its children, then each selected
 * sub-section runs its own selection and ordering for each instance, then the section shuffles. A
 * sub-section that is invisible and does not keep together hands its already arranged children to
 * its parent's shuffle, so the parent's ordering can mix them among its own; only a walk holding
 * both features can place them. The Ordering module (`#plate/test-features/ordering.ts`) reads its
 * element into the nodes this walk applies, and its own `sequence` leaves the places as they are.
 *
 * Every draw is keyed by the session's processing seed, never by the configuration's shuffle seed:
 * a section instance selects under `selection:<section identifier>:<n>` and shuffles under
 * `ordering:<section identifier>:<n>`, `n` counting that identifier's instances in the walk from
 * 1, so two sessions started with one seed walk one sequence and a restored session keeps it.
 *
 * This is a browser module, reached from the session: it value-imports from `effect` only
 * `Option` and `Result`.
 *
 * @module
 */
import { Option, Result } from "effect";
import { qtiNamespace } from "#plate/document/source.ts";
import { drawBelow, drawStream } from "#plate/engine/random.ts";
import type { Draw } from "#plate/engine/random.ts";
import type { ItemRef, Section, SectionChild, Test } from "#plate/model/test.ts";
import type { SequencePlace, TestFeatureModule } from "#plate/test-features/contract.ts";
import type { OrderingNode } from "#plate/test-features/ordering.ts";

/**
 * A `qti-selection` as the test model holds it (S-3, issue m3f-02): how many of its section's
 * children are selected, whether the same child may be selected again, and the element's path,
 * from which the section it selects for is found: the path less its last step.
 */
export interface SelectionNode {
  readonly path: string;
  /**
   * The element's `select`: the number of children, sub-sections counting 1 each, the section
   * delivers.
   */
  readonly select: number;
  /**
   * The element's `with-replacement`, false when unwritten: whether a child may be selected more
   * than once, each selection an instance of it.
   */
  readonly withReplacement: boolean;
}

/**
 * The step of the root element of a test document in an element path.
 */
const rootStep = "qti-assessment-test";

/**
 * A run of item refs that move together when a section shuffles: one item ref, or the arranged
 * items of a sub-section kept as a block.
 */
interface Block {
  /**
   * Whether the block keeps its position in the selected sequence when the section shuffles.
   */
  readonly fixed: boolean;
  readonly refs: readonly ItemRef[];
}

/**
 * What one walk of a test holds: the processing seed, the instances counted so far of each
 * section identifier, and each section's selection and ordering.
 */
interface Walk {
  readonly instances: Map<string, number>;
  readonly orderings: ReadonlyMap<Section, OrderingNode>;
  readonly seed: string;
  readonly selections: ReadonlyMap<Section, SelectionNode>;
}

/**
 * Tell whether a section child is a sub-section.
 *
 * @param child The child.
 * @returns Whether it is a section.
 */
const isSection = (child: SectionChild): child is Section => child.kind === "section";

/**
 * Name an element's step in an element path as `walk` in `#plate/document/source.ts` writes it: the
 * local name, followed by its 1-based position among same-named siblings only when it has any.
 *
 * @param name The element's local name.
 * @param position The element's 1-based position among its siblings of that name.
 * @param siblings How many siblings of that name its parent holds, itself included.
 * @returns The step.
 */
const stepOf = (name: string, position: number, siblings: number): string =>
  siblings > 1 ? `${name}[${position}]` : name;

/**
 * Index every section of a test by the element path the test document gives it, which is how a
 * node finds the section it sits in: every `qti-test-part` and `qti-assessment-section` of the
 * document is in the model, so each path is computed from the parts' and sections' positions.
 *
 * @param test The test.
 * @returns Each section, keyed by its element path.
 */
const sectionsByPath = (test: Test): ReadonlyMap<string, Section> => {
  const sections = new Map<string, Section>();
  const index = (siblings: readonly Section[], parent: string): void => {
    for (const [at, section] of siblings.entries()) {
      const path = `${parent}/${stepOf("qti-assessment-section", at + 1, siblings.length)}`;

      sections.set(path, section);
      index(section.children.filter(isSection), path);
    }
  };
  for (const [at, part] of test.parts.entries()) {
    index(part.children, `${rootStep}/${stepOf("qti-test-part", at + 1, test.parts.length)}`);
  }

  return sections;
};

/**
 * Pair each node a test holds of one element with the section it sits in: the section whose path is
 * the node's path less its last step. A node that sits in no section of the test is left out. Of
 * two nodes in one section, the later in document order is kept.
 *
 * @template N The node type.
 * @param sections The test's sections by path.
 * @param nodes The nodes the test holds, in document order.
 * @returns Each section's node.
 */
const nodesBySection = <N extends { readonly path: string }>(
  sections: ReadonlyMap<string, Section>,
  nodes: readonly N[] | undefined,
): ReadonlyMap<Section, N> =>
  new Map(
    (nodes ?? []).flatMap((node) => {
      const section = sections.get(node.path.slice(0, node.path.lastIndexOf("/")));

      return section === undefined ? [] : [[section, node] as const];
    }),
  );

/**
 * Give a list in an order drawn under a stream: Fisher-Yates from the last entry down to the
 * second, each swapping with the entry `drawBelow` picks among those up to it, so every order is
 * equally likely.
 *
 * @template T The entries.
 * @param entries The list.
 * @param draw The stream.
 * @returns The entries in the drawn order.
 */
const permuted = <T>(entries: readonly T[], draw: Draw): readonly T[] => {
  const drawn = [...entries];
  for (let last = drawn.length - 1; last > 0; last -= 1) {
    const at = Number(drawBelow(draw, BigInt(last + 1)));
    const kept = drawn[last];
    const moved = drawn[at];

    // Both positions are within the list, so neither read is undefined; the check narrows the type.
    if (kept !== undefined && moved !== undefined) {
      drawn[last] = moved;
      drawn[at] = kept;
    }
  }

  return drawn;
};

/**
 * Select among a section's children as its `qti-selection` says, from a stream.
 *
 * The required children are always selected. Without replacement, or with it when `select` does not
 * exceed the number of children, `select` less the required children more are drawn uniformly
 * without replacement from the rest; a `select` below the number of required children selects every
 * required child and nothing else, and one above the number of children (which a selection without
 * replacement is refused for) selects every child. With replacement and a `select` above the number
 * of children, every child is selected once and the `select` less the number of children further
 * instances are drawn uniformly, with repetition, among all children. The result keeps the
 * children's source order, each child's instances together.
 *
 * @param children The section's children, in source order.
 * @param selection The section's selection.
 * @param draw The stream the section instance selects under.
 * @returns The selected children, a child listed once per instance.
 */
const selectedFrom = (
  children: readonly SectionChild[],
  selection: SelectionNode,
  draw: Draw,
): readonly SectionChild[] => {
  if (selection.withReplacement && selection.select > children.length) {
    if (children.length === 0) {
      return [];
    }

    const counts = children.map(() => 1);
    for (let extra = selection.select - children.length; extra > 0; extra -= 1) {
      const at = Number(drawBelow(draw, BigInt(children.length)));

      counts[at] = (counts[at] ?? 0) + 1;
    }

    return children.flatMap((child, at) =>
      Array.from({ length: counts[at] ?? 1 }, (): SectionChild => child),
    );
  }

  const required = children.filter((child) => child.required);
  const chosen = new Set<SectionChild>([
    ...required,
    ...permuted(
      children.filter((child) => !child.required),
      draw,
    ).slice(0, Math.max(0, selection.select - required.length)),
  ]);

  return children.filter((child) => chosen.has(child));
};

/**
 * Shuffle blocks around the fixed ones: Fisher-Yates over the blocks that are not fixed, each fixed
 * block keeping its index in the list.
 *
 * @param blocks The section's selected blocks, in order.
 * @param draw The stream the section instance shuffles under.
 * @returns The blocks, the fixed ones where they were and the others shuffled among the rest of the
 *   places.
 */
const shuffledAround = (blocks: readonly Block[], draw: Draw): readonly Block[] => {
  const moved = permuted(
    blocks.filter((block) => !block.fixed),
    draw,
  ).values();

  // `moved` holds one block per block that is not fixed, so the iterator never runs dry here.
  return blocks.map((block) => (block.fixed ? block : (moved.next().value ?? block)));
};

/**
 * Arrange one instance of a section: select its children, arrange each selected sub-section's
 * instance, then shuffle when its ordering says so.
 *
 * A visible sub-section is one block, and so is an invisible one that keeps together and one that
 * is fixed, which never moves; an invisible sub-section that does not keep together gives its
 * arranged blocks to this section's shuffle one by one. A sub-section that delivers no item is left
 * out.
 *
 * @param walk The walk, whose instance count this call advances.
 * @param section The section.
 * @returns The section instance's blocks, in the order the candidate meets them.
 */
const arranged = (walk: Walk, section: Section): readonly Block[] => {
  const instance = (walk.instances.get(section.identifier) ?? 0) + 1;
  walk.instances.set(section.identifier, instance);

  const selection = walk.selections.get(section);
  const selected =
    selection === undefined
      ? section.children
      : selectedFrom(
          section.children,
          selection,
          drawStream(walk.seed, `selection:${section.identifier}:${instance}`),
        );
  const blocks = selected.flatMap((child): readonly Block[] => {
    if (!isSection(child)) {
      return [{ fixed: child.fixed, refs: [child] }];
    }

    const inner = arranged(walk, child);
    if (child.visible || child.keepTogether || child.fixed) {
      const refs = inner.flatMap((block) => block.refs);

      return refs.length === 0 ? [] : [{ fixed: child.fixed, refs }];
    }

    return inner;
  });

  return walk.orderings.get(section)?.shuffle === true
    ? shuffledAround(blocks, drawStream(walk.seed, `ordering:${section.identifier}:${instance}`))
    : blocks;
};

/**
 * The Selection module (S-3, issue m3f-02): it reads each `qti-selection` into a
 * {@link SelectionNode}, and its `sequence` walks the test's sections, selecting and ordering each
 * as its `qti-selection` and `qti-ordering` say, under the session's processing seed.
 *
 * `sequence` keeps the places the session gave it: it arranges the test's item refs and gives back
 * each one's place, an item ref a selection with replacement repeats giving its place once per
 * instance, so every instance is a session item of its own. A test holding neither element gives
 * its places back as they came. A `qti-selection` that writes no `select`, which the validator
 * refuses before a test is built, is marked as the stub marked it and read as no selection.
 */
export const selectionModule: TestFeatureModule<"qti-selection", SelectionNode> = {
  deliver: (context) => context.test,
  element: "qti-selection",
  feature: ["S-3"],
  gate: () => Option.none(),
  implemented: true,
  issue: "m3f-02",
  key: "qti-selection",
  namespace: qtiNamespace,
  parse: (element, context) =>
    Result.gen(function* readSelection() {
      const select = yield* context.readers.xsInt(element, "select");
      const withReplacement = yield* context.readers.xsBoolean(element, "with-replacement", false);
      if (Option.isNone(select)) {
        return yield* context.mark("qti-selection");
      }

      return Option.some({ path: context.path, select: select.value, withReplacement });
    }),
  sequence: (context) => {
    const sections = sectionsByPath(context.test);
    const selections = nodesBySection(sections, context.test.features?.["qti-selection"]);
    const orderings = nodesBySection(sections, context.test.features?.["qti-ordering"]);
    if (selections.size === 0 && orderings.size === 0) {
      return context.places;
    }

    const walk: Walk = { instances: new Map(), orderings, seed: context.seed, selections };
    const placed = new Map(context.places.map((place) => [place.ref, place] as const));

    return context.test.parts.flatMap((part) =>
      part.children
        .flatMap((section) => arranged(walk, section))
        .flatMap((block) => block.refs)
        .flatMap((ref): readonly SequencePlace[] => {
          const place = placed.get(ref);

          return place === undefined ? [] : [place];
        }),
    );
  },
};
