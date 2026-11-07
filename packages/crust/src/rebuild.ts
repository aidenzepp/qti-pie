import { tour } from "#crust/tour.ts";
import type { Leaf } from "#crust/tour.ts";
import type { Attribute, Child, Element } from "#crust/tree.ts";

/**
 * Rebuild `root` and everything below it: each element gets the attributes `attributesOf` gives
 * it, and each leaf is replaced, in place and in order, by the nodes `leaf` gives for it.
 *
 * The rebuild folds `root`'s {@link tour}, so a tree of any depth or width is rebuilt without
 * recursion. Each open puts the element's counterpart in the children list being filled and makes
 * the counterpart's own list the one being filled; each close returns to the list it interrupted,
 * which the root's own close leaves at the root's. The callbacks see only the original nodes.
 *
 * @param root - The element to rebuild.
 * @param attributesOf - Gives the attributes of an element's rebuilt counterpart.
 * @param leaf - Gives the nodes that stand in a leaf's place, none to drop it.
 * @returns The rebuilt root, its other fields as `root` has them.
 */
export const rebuild = (
  root: Element,
  attributesOf: (element: Element) => readonly Attribute[],
  leaf: (node: Leaf) => readonly Child[],
): Element => {
  const children: Child[] = [];
  const rebuilt: Element = { ...root, attributes: attributesOf(root), children };
  const interrupted: Child[][] = [];
  let into = children;
  const steps = tour(root);
  // The first step is the root's own open, which `rebuilt` already stands for.
  steps.next();
  for (const step of steps) {
    if (step.kind === "open") {
      const below: Child[] = [];
      into.push({ ...step.element, attributes: attributesOf(step.element), children: below });
      interrupted.push(into);
      into = below;
    } else if (step.kind === "close") {
      into = interrupted.pop() ?? children;
    } else {
      into.push(...leaf(step.node));
    }
  }

  return rebuilt;
};
