import { Effect, Schema } from "effect";
import { h } from "#plate/emit/node.ts";
import type { Attributes, Element, Node, PartFunction } from "#plate/emit/node.ts";
import { allows, lists } from "#plate/emit/parts.ts";
import type { PartRow, TagClass } from "#plate/emit/parts.ts";

/**
 * The ways a replacement part function can break the swap invariant, one per refusal of I2, I3 and
 * the list joint rule.
 *
 * @see {@link PartSwapRefused}
 */
export const swapCauses = [
  "root-not-allowed",
  "child-missing",
  "child-duplicated",
  "child-reordered",
  "list-item",
] as const;

/**
 * Why a swap was refused: one of {@link swapCauses}.
 */
export type SwapCause = (typeof swapCauses)[number];

/**
 * What each refusal asks the embedder to change, beside the facts its detail names.
 */
const remedies = {
  "child-duplicated":
    "Place each node the part function receives exactly once, and build a new node for anything shown twice.",
  "child-missing":
    "Place every node the part function receives below an element of the replacement's own, in the order given; wrap them, never drop them.",
  "child-reordered": "Keep the nodes the part function receives in the order given.",
  "list-item": "Swap Choices too, or return an <li> from the Choice replacement.",
  "root-not-allowed": "Return an element the part may become as the replacement's root.",
} satisfies { readonly [C in SwapCause]: string };

/**
 * What a Control's refusal at I3 asks instead of the generic remedy: a Control stays the native
 * control the interaction computed, so the ruling names the supported ways around it.
 *
 * Only the Choice interaction has an Indicator part, so only its Controls are told to swap it.
 *
 * @param interaction The interaction that owns the Control.
 * @returns The remedy for that interaction's Control.
 */
const controlRemedy = (interaction: string): string =>
  interaction === "choice-interaction"
    ? "To restyle the control use the marker; to replace its look swap Indicator; to replace its behaviour wait for the browser runtime (M3)."
    : "To restyle the control use the marker; to replace its behaviour wait for the browser runtime (M3).";

/**
 * A part's replacement that broke the swap invariant, refused at `open`.
 *
 * It runs on every emit, not only in development, because a replacement is host code that ships.
 * `detail` names the returned element or the child at fault; the message adds what to change.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class PartSwapRefused extends Schema.TaggedError<PartSwapRefused>()("PartSwapRefused", {
  cause: Schema.Literals(swapCauses),
  detail: Schema.String,
  interaction: Schema.String,
  part: Schema.String,
}) {
  /**
   * The part, the cause and its facts, and what to change.
   */
  override get message(): string {
    const remedy =
      this.cause === "root-not-allowed" && this.part === "control"
        ? controlRemedy(this.interaction)
        : remedies[this.cause];

    return `A part swap was refused at ${this.interaction} ${this.part} (${this.cause}): ${this.detail}. ${remedy}`;
  }
}

/**
 * The elements each tag class admits, in words, for a root-not-allowed detail.
 */
const mayBecome = {
  any: "any element",
  button: "a <button>",
  "choice-item": "an <li>, or a flow container such as <div> under a Choices that is not a list",
  "choice-list": "a <ul>, an <ol> or a flow container such as <div>",
  "flow-container":
    "a flow container such as <div>, <section> or <span>, or a custom element, and never a control, link or list",
  form: "a <form>",
  heading: "a heading, <h1> to <h6>",
  li: "an <li>",
  list: "a <ul>, <ol> or <menu>",
  "native-input": 'an <input>, whose "type" the interaction writes',
  "phrasing-container": "a phrasing container such as <span>, or a custom element",
  prompt: "a <p>, or a flow or phrasing container such as <div> or <span>",
  "text-input": 'an <input> of type "text"',
  textarea: "a <textarea>",
} satisfies { readonly [C in TagClass]: string };

/**
 * Name a node of the output tree for a refusal's detail.
 *
 * @param node The node.
 * @returns The element's tag in angle brackets, with its `type` when it is an `input`, or the text
 *   quoted and cut to 24 characters.
 */
const describeNode = (node: Node): string => {
  if (node.kind === "text") {
    return `text ${JSON.stringify(node.text.length > 24 ? `${node.text.slice(0, 24)}…` : node.text)}`;
  }

  const { type } = node.attrs;

  return node.tag === "input" && type !== undefined && type !== true
    ? `<input type=${JSON.stringify(type)}>`
    : `<${node.tag}>`;
};

/**
 * Name the child at a position among the nodes handed to a replacement.
 *
 * @param children The nodes the emitter handed over.
 * @param index The child's position, from 0.
 * @returns The child's ordinal, the count and the child's name: `child 2 of 3, <label>`.
 */
const childAt = (children: readonly Node[], index: number): string => {
  const child = children[index];

  return `child ${index + 1} of ${children.length}${child === undefined ? "" : `, ${describeNode(child)}`}`;
};

/**
 * A broken invariant found in a replacement's result, before it becomes a {@link PartSwapRefused}
 * naming the part.
 */
interface Breach {
  readonly cause: SwapCause;
  readonly detail: string;
}

/**
 * Yield, in document order, the position of each handed node found below the given nodes, without
 * entering a handed node.
 *
 * A handed node is the emitter's own by identity, so its subtree is the one the emitter built and
 * the walk stays O(n) in what the replacement added.
 *
 * @param nodes The nodes to walk, the replacement root's children first.
 * @param handed The position of each node the emitter handed over.
 * @yields {number} The position of each handed node, in the pre-order of the walk.
 */
const handedInOrder = function* handedInOrder(
  nodes: readonly Node[],
  handed: ReadonlyMap<Node, number>,
): Generator<number, void, undefined> {
  for (const node of nodes) {
    const index = handed.get(node);
    if (index !== undefined) {
      yield index;
    } else if (node.kind === "element") {
      yield* handedInOrder(node.children, handed);
    }
  }
};

/**
 * Check I3 on a replacement's root: its element is one the part's tag class admits.
 *
 * @param row The part's row.
 * @param root The replacement's root.
 * @returns The breach naming the returned element and what the part may become, or undefined
 *   when the row allows it.
 */
const checkRoot = (row: PartRow, root: Element): Breach | undefined =>
  allows(row, root)
    ? undefined
    : {
        cause: "root-not-allowed",
        detail: `the replacement returned ${describeNode(root)}, and this part may become only ${mayBecome[row.tagClass]}`,
      };

/**
 * Check I2 on a replacement's root: every node the emitter handed over appears below it exactly
 * once, by identity, in the order given.
 *
 * The root itself is not a handed node, because I1 writes onto the root and a copy would lose the
 * child's identity; a replacement that returns a handed node as its root leaves that node missing.
 *
 * @param root The replacement's root.
 * @param children The nodes the emitter handed over.
 * @returns The first duplicated child, else the first missing one, else the first out of order, or
 *   undefined when the children hold.
 * @throws {Error} When `children` holds one node twice, a defect of the emitter: identity cannot
 *   tell the two places apart, so the replacement would be blamed for the emitter's reuse.
 */
const checkChildren = (root: Element, children: readonly Node[]): Breach | undefined => {
  const handed = new Map(children.map((child, index) => [child, index]));
  if (handed.size !== children.length) {
    throw new Error("The emitter handed a part the same node twice; build each child once.");
  }

  const seen = new Set<number>();
  let latest = -1;
  let reordered: Breach | undefined;
  for (const index of handedInOrder(root.children, handed)) {
    if (seen.has(index)) {
      return {
        cause: "child-duplicated",
        detail: `${childAt(children, index)}, appears more than once below the returned root`,
      };
    }

    seen.add(index);
    if (index < latest && reordered === undefined) {
      reordered = {
        cause: "child-reordered",
        detail: `${childAt(children, index)}, comes after ${childAt(children, latest)}`,
      };
    }

    latest = Math.max(latest, index);
  }

  const missing = children.findIndex((_child, index) => !seen.has(index));
  if (missing !== -1) {
    return {
      cause: "child-missing",
      detail: `${childAt(children, missing)}, is not below the returned root`,
    };
  }

  return reordered;
};

/**
 * Split a `class` value into its tokens, at ASCII whitespace as HTML does.
 *
 * @param value The attribute's value, if present.
 * @returns The tokens, none for an absent or boolean attribute.
 * @see https://html.spec.whatwg.org/multipage/dom.html#classes
 */
const classTokens = (value: string | true | undefined): readonly string[] =>
  value === undefined || value === true
    ? []
    : value.split(/[\t\n\f\r ]+/u).filter((token) => token !== "");

/**
 * Apply I1: write every attribute of `props` onto the replacement's root, `props` winning a
 * conflict, and join `class`.
 *
 * Every attribute the connect function computes is in `props`, so "required" means everything in
 * `props`; whatever else the root carries (`data-*`, `title`, further classes) stands.
 *
 * @param root The replacement's root.
 * @param props The attributes the part carries.
 * @returns A copy of `root` with the merged attributes and the same children: `class` holds the
 *   props' tokens and then the root's, each once, and is absent when neither side has one.
 */
const mergeRequired = (root: Element, props: Attributes): Element => {
  const merged = { ...root.attrs, ...props };
  if (props["class"] === undefined && root.attrs["class"] === undefined) {
    return h(root.tag, merged, root.children);
  }

  const tokens = new Set([...classTokens(props["class"]), ...classTokens(root.attrs["class"])]);

  return h(root.tag, { ...merged, class: [...tokens].join(" ") }, root.children);
};

/**
 * Write a role onto a node, when it is an element.
 *
 * @param node The node.
 * @param role The role's value.
 * @returns A copy of the element with `role` set, or the text node unchanged.
 */
const withRole = (node: Node, role: string): Node =>
  node.kind === "element" ? h(node.tag, { ...node.attrs, role }, node.children) : node;

/**
 * Copy an element's subtree with `role="listitem"` written onto each handed node, wherever the
 * replacement placed it.
 *
 * @param element The element whose children to rebuild.
 * @param handed The nodes the emitter handed over, the Choice roots.
 * @returns The rebuilt children, each handed node replaced by its updated copy.
 */
const markListItems = (element: Element, handed: ReadonlySet<Node>): readonly Node[] =>
  element.children.map((child) => {
    if (handed.has(child)) {
      return withRole(child, "listitem");
    }

    return child.kind === "element"
      ? h(child.tag, child.attrs, markListItems(child, handed))
      : child;
  });

/**
 * Check the list joint rule under a list: every Choice root is an `li`.
 *
 * @param list The list owner's root, a list element.
 * @param children The nodes the emitter handed over, the Choice roots.
 * @returns The breach naming the first Choice root that is not an `li`, or undefined.
 */
const checkListItems = (list: Element, children: readonly Node[]): Breach | undefined => {
  const stray = children.findIndex((child) => child.kind !== "element" || child.tag !== "li");

  return stray === -1
    ? undefined
    : {
        cause: "list-item",
        detail: `${childAt(children, stray)}, is a Choice root under a <${list.tag}>, which holds only <li> children`,
      };
};

/**
 * Apply the list joint rule to a list owner that is not a list: give it `role="list"` and each
 * Choice root `role="listitem"`, wherever the replacement placed them.
 *
 * @param owner The list owner's root, after I1.
 * @param children The nodes the emitter handed over, the Choice roots.
 * @returns A copy of `owner` with the list roles written.
 */
const withListRoles = (owner: Element, children: readonly Node[]): Element =>
  h(owner.tag, { ...owner.attrs, role: "list" }, markListItems(owner, new Set(children)));

/**
 * Construct the refusal of a breach at a part.
 *
 * @param row The part's row, which names the interaction and the part.
 * @param breach The broken invariant.
 * @returns The refusal.
 */
const refuse = (row: PartRow, breach: Breach): PartSwapRefused =>
  new PartSwapRefused({ ...breach, interaction: row.interaction, part: row.part });

/**
 * Construct a swapped part's root: the replacement's, checked against I3 and I2, with I1 applied.
 *
 * @param row The part's row.
 * @param props The attributes the part's connect function computed.
 * @param children The nodes the part holds.
 * @param replacement The embedder's part function.
 * @returns The replacement's root with `props` written over it.
 */
const swapIn = Effect.fnUntraced(function* swapIn(
  row: PartRow,
  props: Attributes,
  children: readonly Node[],
  replacement: PartFunction<Attributes>,
): Effect.fn.Return<Element, PartSwapRefused> {
  const root = replacement(props, children);
  const breach = checkRoot(row, root) ?? checkChildren(root, children);
  if (breach !== undefined) {
    return yield* refuse(row, breach);
  }

  return mergeRequired(root, props);
});

/**
 * Construct a part's root, through its replacement when the embedder swapped it, holding the swap
 * invariant I1 to I4.
 *
 * Without a replacement the part takes the fast path: its default element, holding `props` and
 * `children` by identity, with no walk. With one, the replacement's root must be an element of the
 * row's tag class (I3) and hold every handed child once, in order (I2); `props` are then written
 * over its attributes (I1). A list owner (Choices) also applies the list joint rule on either path.
 * Every breach is a {@link PartSwapRefused} (I4).
 *
 * @param row The part's row, as `rowFor` gives it for the placement.
 * @param props The attributes the part's connect function computed, written over a replacement's.
 * @param children The nodes the part holds, which a replacement must keep.
 * @param replacement The embedder's part function, none for the default element.
 * @returns The part's root element.
 */
export const applyPart = Effect.fnUntraced(function* applyPart(
  row: PartRow,
  props: Attributes,
  children: readonly Node[],
  replacement?: PartFunction<Attributes>,
): Effect.fn.Return<Element, PartSwapRefused> {
  const result =
    replacement === undefined
      ? h(row.element, props, children)
      : yield* swapIn(row, props, children, replacement);
  if (!row.listOwner) {
    return result;
  }

  if (!lists.has(result.tag)) {
    return withListRoles(result, children);
  }

  const breach = checkListItems(result, children);

  return breach === undefined ? result : yield* refuse(row, breach);
});
