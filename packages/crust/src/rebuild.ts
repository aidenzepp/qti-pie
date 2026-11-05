import type { Attribute, Child, Element } from "#crust/tree.ts";

/**
 * A node that holds no other node.
 */
export type Leaf = Exclude<Child, Element>;

/**
 * A child still to rebuild, with the children list of its rebuilt parent.
 */
interface Pending {
  readonly into: Child[];
  readonly node: Child;
}

/**
 * Put `children` on `pending` last first, each bound for `into`, so they leave it in document
 * order.
 *
 * @param pending - The walk's stack.
 * @param children - The children of one element, in document order.
 * @param into - The children list of that element's rebuilt counterpart.
 */
const pushChildren = (pending: Pending[], children: readonly Child[], into: Child[]): void => {
  for (const node of children.toReversed()) {
    pending.push({ into, node });
  }
};

/**
 * Rebuild `root` and everything below it: each element gets the attributes `attributesOf` gives
 * it, and each leaf is replaced, in place and in order, by the nodes `leaf` gives for it.
 *
 * The walk keeps its own stack, so a tree of any depth or width is rebuilt without recursion. A
 * rebuilt element's children list is filled after the element is made, in document order, because
 * a child's whole subtree leaves the stack before its next sibling does; the callbacks see only
 * the original nodes.
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
  const pending: Pending[] = [];
  pushChildren(pending, root.children, children);
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const { into, node } = next;
    if (node.kind === "element") {
      const below: Child[] = [];
      into.push({ ...node, attributes: attributesOf(node), children: below });
      pushChildren(pending, node.children, below);
    } else {
      for (const replacement of leaf(node)) {
        into.push(replacement);
      }
    }
  }

  return rebuilt;
};
