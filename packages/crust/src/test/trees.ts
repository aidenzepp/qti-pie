/* oxlint-disable unicorn/text-encoding-identifier-case -- The trees carry XML encoding labels (`UTF-8`) as documents spell them. */
import { Array as Arr, Config, Effect, Option, Random } from "effect";
import type { Attribute, Child, Element, Misc, XmlDocument } from "#crust/tree.ts";

/**
 * A seeded source of choices: the `Random` service a case runs under, read synchronously, so one
 * seed always builds the same value.
 */
export type Choices = Random.Random;

/**
 * Draw a whole number from zero up to, not including, `bound`.
 *
 * @param choices - The case's choices.
 * @param bound - One past the largest number drawn.
 * @returns The number drawn.
 */
export const below = (choices: Choices, bound: number): number =>
  Math.floor(choices.nextDoubleUnsafe() * bound);

/**
 * Draw whether an event of `probability` happens.
 *
 * @param choices - The case's choices.
 * @param probability - The event's chance, from 0 (never) to 1 (always).
 * @returns Whether it happens.
 */
const chance = (choices: Choices, probability: number): boolean =>
  choices.nextDoubleUnsafe() < probability;

/**
 * Draw one of `items`, each as likely as the others.
 *
 * @param choices - The case's choices.
 * @param items - What to draw from, at least one.
 * @returns The item drawn.
 */
const pick = <A>(choices: Choices, items: Arr.NonEmptyReadonlyArray<A>): A =>
  Arr.getUnsafe(items, below(choices, items.length));

/**
 * Build a value from the choices `seed` gives, so a failing case replays from its seed.
 *
 * @param seed - The case's seed.
 * @param build - Builds the value from the choices.
 * @returns The value built.
 */
export const seeded = <A>(seed: string, build: (choices: Choices) => A): Effect.Effect<A> =>
  Effect.gen(function* buildSeeded() {
    const choices = yield* Random.Random;

    return build(choices);
  }).pipe(Random.withSeed(seed));

/**
 * The run's base seed: `CRUST_SEED` when it is set, so a reported failure replays, and a fresh one
 * otherwise, so each run searches its own corner of the space.
 */
export const runSeed: string = Effect.runSync(
  Config.String("CRUST_SEED").pipe(Config.withDefault(globalThis.crypto.randomUUID())),
);

/**
 * The timeout, in milliseconds, for each test that runs generated cases. The slowest, the reader's
 * 400 swarmed element trees, takes under 1 s alone, and took 5,115 ms with the scale tests running
 * beside it in the same suite run (2026-11-05, Node 26.13.0, load average 48), past vitest's
 * default of 5,000 ms. The budget is twice that, rounded up to the next 1,000. Raise it only on a
 * new measurement recorded here, never to make a run pass.
 */
export const GENERATED_TIMEOUT_MS = 11_000;

/**
 * The namespace name every namespace declaration's attribute is in.
 */
const XMLNS = "http://www.w3.org/2000/xmlns/";

/**
 * The namespace bindings in scope at an element, from prefix to namespace name; the empty prefix
 * is the default namespace, and an empty name means none.
 */
type Scope = ReadonlyMap<string, string>;

/**
 * The bindings above the root: no default namespace, and `xml` bound by definition.
 */
const ROOT_SCOPE: Scope = new Map([
  ["", ""],
  ["xml", "http://www.w3.org/XML/1998/namespace"],
]);

/**
 * The kinds of child a generated element holds, `cdata` being a text run written as CDATA.
 */
const CHILD_KINDS = ["element", "text", "cdata", "comment", "pi", "entityRef"] as const;

/**
 * One kind of child.
 */
type ChildKind = (typeof CHILD_KINDS)[number];

/**
 * One case's feature weights, drawn per case so that each case explores its own lopsided corner
 * (a swarm). A probability or a weight of 0 is drawn on purpose: it switches the feature off.
 */
export interface Swarm {
  /**
   * The chance each of an element's three attribute slots is filled.
   */
  readonly attributes: number;
  /**
   * The chance an element declares namespaces.
   */
  readonly declarations: number;
  /**
   * The weight of each child kind. When every weight is 0 no element gets a child, so the tree is
   * the bare root: a corner of its own, not a draw to repair.
   */
  readonly kinds: Readonly<Record<ChildKind, number>>;
  /**
   * The chance a piece of an attribute value is an unexpanded entity reference.
   */
  readonly references: number;
  /**
   * The chance a character or a name is drawn from the wild pool: the characters every escape,
   * every encoder threshold and every unwritable construct turn on.
   */
  readonly wild: number;
}

/**
 * The probabilities a swarm feature is drawn from.
 */
const PROBABILITIES = [0, 0.25, 0.5, 0.9] as const;

/**
 * The weights a child kind is drawn from.
 */
const WEIGHTS = [0, 1, 3] as const;

/**
 * Draw one case's feature weights.
 *
 * @param choices - The case's choices.
 * @returns The case's swarm.
 */
export const arbitrarySwarm = (choices: Choices): Swarm => ({
  attributes: pick(choices, PROBABILITIES),
  declarations: pick(choices, PROBABILITIES),
  kinds: {
    cdata: pick(choices, WEIGHTS),
    comment: pick(choices, WEIGHTS),
    element: pick(choices, WEIGHTS),
    entityRef: pick(choices, WEIGHTS),
    pi: pick(choices, WEIGHTS),
    text: pick(choices, WEIGHTS),
  },
  references: pick(choices, PROBABILITIES),
  wild: pick(choices, PROBABILITIES),
});

/**
 * The limits of a generated tree. Each is the largest value a case may reach, not one it must.
 */
export interface Bounds {
  /**
   * The most elements on one path from the root, the root included.
   */
  readonly depth: number;
  /**
   * The most nodes in the tree, the root included.
   */
  readonly nodes: number;
  /**
   * The most children of one element.
   */
  readonly width: number;
}

/**
 * Characters with no special meaning to any writer.
 */
const PLAIN = ["a", "b", " ", "1"] as const;

/**
 * The wild pool: each escape's characters, `]]>` and its halves, the line ends and the tab, both
 * quotes, a character above 0x7f, one above 0xff, and one outside the Basic Multilingual Plane.
 */
const WILD = [
  "&",
  "<",
  ">",
  "]]>",
  "]]",
  "\r",
  "\n",
  "\t",
  '"',
  "'",
  "é",
  "ā",
  "€",
  "\u{1F600}",
] as const;

/**
 * ASCII names, and the wild names: one above 0x7f, one above 0xff.
 */
const NAMES = ["a", "b", "c"] as const;

const WILD_NAMES = ["é", "ā"] as const;

/**
 * Draw a run of up to `most` pieces of text.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @param most - The most pieces.
 * @returns The text.
 */
const arbitraryText = (choices: Choices, swarm: Swarm, most: number): string => {
  let text = "";
  for (let count = below(choices, most + 1); count > 0; count -= 1) {
    text += chance(choices, swarm.wild) ? pick(choices, WILD) : pick(choices, PLAIN);
  }

  return text;
};

/**
 * Draw a name, wild with the swarm's chance.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @returns The name.
 */
const arbitraryName = (choices: Choices, swarm: Swarm): string =>
  chance(choices, swarm.wild) ? pick(choices, WILD_NAMES) : pick(choices, NAMES);

/**
 * Draw an attribute value and the offset of each unexpanded entity reference in it, built
 * together so each offset names the `&` of a reference.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @returns The value and its references.
 */
const arbitraryValue = (
  choices: Choices,
  swarm: Swarm,
): Pick<Attribute, "references" | "value"> => {
  const references: { name: string; offset: number }[] = [];
  let value = "";
  for (let count = below(choices, 4); count > 0; count -= 1) {
    if (chance(choices, swarm.references)) {
      const name = arbitraryName(choices, swarm);
      references.push({ name, offset: value.length });
      value += `&${name};`;
    } else {
      value += arbitraryText(choices, swarm, 2);
    }
  }

  return { references, value };
};

/**
 * Draw an element's own namespace declarations: each of the default and the prefixes `p` and `q`
 * may be declared, the default possibly to no namespace.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @returns The declarations, as the attributes the reader gives them.
 */
const arbitraryDeclarations = (choices: Choices, swarm: Swarm): readonly Attribute[] => {
  if (!chance(choices, swarm.declarations)) {
    return [];
  }

  return ["", "p", "q"].flatMap((prefix): readonly Attribute[] => {
    if (!chance(choices, 0.5)) {
      return [];
    }

    const value = pick(choices, ["urn:a", "urn:b", prefix === "" ? "" : "urn:c"]);

    return [
      prefix === ""
        ? { local: "xmlns", namespace: XMLNS, prefix: "", qname: "xmlns", references: [], value }
        : {
            local: prefix,
            namespace: XMLNS,
            prefix: "xmlns",
            qname: `xmlns:${prefix}`,
            references: [],
            value,
          },
    ];
  });
};

/**
 * The scope `declarations` make on top of `parent`.
 *
 * @param parent - The scope of the element's parent.
 * @param declarations - The element's own namespace declarations.
 * @returns The element's scope.
 */
const scopeOf = (parent: Scope, declarations: readonly Attribute[]): Scope =>
  new Map([
    ...parent,
    ...declarations.map(
      (declaration) =>
        [declaration.prefix === "xmlns" ? declaration.local : "", declaration.value] as const,
    ),
  ]);

/**
 * A prefix bound in `scope` to a namespace, or the empty prefix.
 *
 * @param choices - The case's choices.
 * @param scope - The bindings in scope.
 * @returns The prefix drawn.
 */
const arbitraryPrefix = (choices: Choices, scope: Scope): string =>
  pick(choices, [
    "",
    ...[...scope].flatMap(([prefix, name]) => (prefix === "" || name === "" ? [] : [prefix])),
  ]);

/**
 * A drawn element and the scope it makes for its children.
 */
interface Drawn {
  readonly element: Element;
  readonly scope: Scope;
}

/**
 * Draw an element under `parent`'s scope whose children list is `children`, which the caller fills.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @param parent - The scope of the element's parent.
 * @param children - The element's children list.
 * @returns The element, and the scope it makes for its children.
 */
const arbitraryElement = (
  choices: Choices,
  swarm: Swarm,
  parent: Scope,
  children: Child[],
): Drawn => {
  const declarations = arbitraryDeclarations(choices, swarm);
  const scope = scopeOf(parent, declarations);
  const prefix = arbitraryPrefix(choices, scope);
  const local = arbitraryName(choices, swarm);
  const attributes = [0, 1, 2].flatMap((slot): readonly Attribute[] => {
    if (!chance(choices, swarm.attributes)) {
      return [];
    }

    const attributePrefix = arbitraryPrefix(choices, scope);
    const attributeLocal = `${arbitraryName(choices, swarm)}${slot}`;

    return [
      {
        ...arbitraryValue(choices, swarm),
        local: attributeLocal,
        namespace: attributePrefix === "" ? "" : (scope.get(attributePrefix) ?? ""),
        prefix: attributePrefix,
        qname: attributePrefix === "" ? attributeLocal : `${attributePrefix}:${attributeLocal}`,
      },
    ];
  });

  return {
    element: {
      attributes: chance(choices, 0.5)
        ? [...declarations, ...attributes]
        : [...attributes, ...declarations],
      children,
      kind: "element",
      local,
      namespace: scope.get(prefix) ?? "",
      prefix,
      qname: prefix === "" ? local : `${prefix}:${local}`,
    },
    scope,
  };
};

/**
 * Draw a child of a kind that holds no other node.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @param kind - The kind to draw.
 * @returns The child.
 */
const arbitraryLeaf = (
  choices: Choices,
  swarm: Swarm,
  kind: Exclude<ChildKind, "element">,
): Child => {
  switch (kind) {
    case "text": {
      return { cdata: false, kind: "text", value: arbitraryText(choices, swarm, 4) };
    }
    case "cdata": {
      return { cdata: true, kind: "text", value: arbitraryText(choices, swarm, 4) };
    }
    case "comment": {
      return { kind: "comment", text: arbitraryText(choices, swarm, 3) };
    }
    case "pi": {
      return {
        data: arbitraryText(choices, swarm, 3),
        kind: "pi",
        target: arbitraryName(choices, swarm),
      };
    }
    case "entityRef": {
      return { kind: "entityRef", name: arbitraryName(choices, swarm) };
    }
    default: {
      return kind satisfies never;
    }
  }
};

/**
 * Draw a child kind by the swarm's weights.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @returns The kind, or `None` when every weight is 0.
 */
const arbitraryKind = (choices: Choices, swarm: Swarm): Option.Option<ChildKind> => {
  const total = CHILD_KINDS.reduce((sum, kind) => sum + swarm.kinds[kind], 0);
  let point = choices.nextDoubleUnsafe() * total;

  return Arr.findFirst(CHILD_KINDS, (kind) => {
    point -= swarm.kinds[kind];

    return swarm.kinds[kind] > 0 && point < 0;
  });
};

/**
 * One element whose children are still to draw: its children list, its depth and its scope.
 */
interface Open {
  readonly depth: number;
  readonly into: Child[];
  readonly scope: Scope;
}

/**
 * Draw a root element and its tree within `bounds`, by construction a tree crust's types admit.
 *
 * Each element's namespace and each prefixed attribute's namespace is the one its scope binds, as
 * the reader resolves them. Adjacent text runs are not merged and an empty text run may occur,
 * which the reader never produces but every writer must handle.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @param bounds - The tree's limits.
 * @returns The root element.
 */
export const arbitraryTree = (choices: Choices, swarm: Swarm, bounds: Bounds): Element => {
  const children: Child[] = [];
  const { element: root, scope } = arbitraryElement(choices, swarm, ROOT_SCOPE, children);
  let budget = bounds.nodes - 1;
  const open: Open[] = [{ depth: 1, into: children, scope }];
  for (let next = open.pop(); next !== undefined; next = open.pop()) {
    const width = next.depth < bounds.depth ? below(choices, bounds.width + 1) : 0;
    for (let count = 0; count < width && budget > 0; count += 1) {
      const kind = arbitraryKind(choices, swarm);
      if (Option.isNone(kind)) {
        break;
      }

      budget -= 1;
      if (kind.value === "element") {
        const inner: Child[] = [];
        const made = arbitraryElement(choices, swarm, next.scope, inner);
        next.into.push(made.element);
        open.push({ depth: next.depth + 1, into: inner, scope: made.scope });
      } else {
        next.into.push(arbitraryLeaf(choices, swarm, kind.value));
      }
    }
  }

  return root;
};

/**
 * Draw a comment or a processing instruction for the prolog or the epilog.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @returns The item.
 */
const arbitraryMisc = (choices: Choices, swarm: Swarm): Misc =>
  chance(choices, 0.5)
    ? { kind: "comment", text: arbitraryText(choices, swarm, 3) }
    : { data: arbitraryText(choices, swarm, 3), kind: "pi", target: arbitraryName(choices, swarm) };

/**
 * Draw up to two prolog or epilog items.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @returns The items.
 */
const arbitraryMiscs = (choices: Choices, swarm: Swarm): readonly Misc[] =>
  Array.from({ length: below(choices, 3) }, () => arbitraryMisc(choices, swarm));

/**
 * Draw a whole document: an optional declaration and doctype, the prolog, the tree and the epilog.
 *
 * @param choices - The case's choices.
 * @param swarm - The case's swarm.
 * @param bounds - The tree's limits.
 * @returns The document.
 */
export const arbitraryDocument = (choices: Choices, swarm: Swarm, bounds: Bounds): XmlDocument => ({
  charset: "UTF-8",
  declaration: chance(choices, 0.5)
    ? Option.some({
        encoding: chance(choices, 0.5)
          ? Option.some(pick(choices, ["UTF-8", "US-ASCII"]))
          : Option.none(),
        standalone: chance(choices, 0.5)
          ? Option.some(pick(choices, ["yes", "no"]))
          : Option.none(),
        version: "1.0",
      })
    : Option.none(),
  doctype: chance(choices, 0.5)
    ? Option.some(
        `<!DOCTYPE ${arbitraryName(choices, swarm)} SYSTEM "${arbitraryText(choices, swarm, 2)}">`,
      )
    : Option.none(),
  epilog: arbitraryMiscs(choices, swarm),
  prolog: arbitraryMiscs(choices, swarm),
  root: arbitraryTree(choices, swarm, bounds),
});

/**
 * An ordered tree with no content, a plane tree: a node and its children, in order.
 */
export interface PlaneTree {
  readonly children: readonly PlaneTree[];
}

/**
 * Every ordered sequence of trees with `nodes` nodes in all.
 *
 * @param nodes - The node count.
 * @returns The forests.
 */
const forests = (nodes: number): readonly (readonly PlaneTree[])[] =>
  nodes === 0
    ? [[]]
    : Array.from({ length: nodes }, (_, at) => at + 1).flatMap((first) =>
        // oxlint-disable-next-line typescript/no-use-before-define -- Forests and trees are defined by each other.
        planeTrees(first).flatMap((tree) => forests(nodes - first).map((rest) => [tree, ...rest])),
      );

/**
 * Every plane tree with exactly `nodes` nodes: the Catalan number C(nodes - 1) of them.
 *
 * @param nodes - The node count, at least 1.
 * @returns The plane trees.
 */
export const planeTrees = (nodes: number): readonly PlaneTree[] =>
  forests(nodes - 1).map((children) => ({ children }));

/**
 * Give a leaf numbered `at` content of `kind`, with `wild` in it.
 *
 * @param kind - The leaf's kind.
 * @param at - The leaf's number in document order.
 * @param wild - A character above 0x7f, or above 0xff.
 * @returns The leaf.
 */
const labelledLeaf = (kind: Exclude<ChildKind, "element">, at: number, wild: string): Child => {
  switch (kind) {
    case "text": {
      return { cdata: false, kind: "text", value: `t${at}${wild}<&]]>` };
    }
    case "cdata": {
      return { cdata: true, kind: "text", value: `d${at}${wild}]]>\r` };
    }
    case "comment": {
      return { kind: "comment", text: `c${at}${wild}` };
    }
    case "pi": {
      return { data: `${wild}${at}`, kind: "pi", target: `p${at}` };
    }
    case "entityRef": {
      return { kind: "entityRef", name: at % 4 === 1 ? `r${at}${wild}` : `r${at}` };
    }
    default: {
      return kind satisfies never;
    }
  }
};

/**
 * Give `tree` content that makes every node distinct and every walk's choices visible, numbering
 * the nodes in document order.
 *
 * A node with children, and the root, is an element; a leaf takes the six child kinds in turn by
 * its number, a childless element among them. An element is named for its number, with `é` in
 * every fifth name; one in three declares the prefix `p`, one in four a default namespace, and
 * each has an attribute whose value needs escaping and holds a reference. Each leaf holds `é` or
 * `ā`, so every encoder threshold meets an unwritable construct, and meets several in one tree.
 *
 * @param tree - The plane tree.
 * @returns The root element.
 */
export const labelled = (tree: PlaneTree): Element => {
  // The root is node 0, so the first child is node 1.
  let number = 1;
  const element = (node: PlaneTree, at: number, parent: Scope): Element => {
    const declarations: Attribute[] = [];
    if (at % 3 === 1) {
      declarations.push({
        local: "p",
        namespace: XMLNS,
        prefix: "xmlns",
        qname: "xmlns:p",
        references: [],
        value: `urn:p${at % 2}`,
      });
    }

    if (at % 4 === 2) {
      declarations.push({
        local: "xmlns",
        namespace: XMLNS,
        prefix: "",
        qname: "xmlns",
        references: [],
        value: `urn:d${at % 3}`,
      });
    }

    const scope = scopeOf(parent, declarations);
    const local = at % 5 === 3 ? `e${at}é` : `e${at}`;

    return {
      attributes: [
        {
          local: "v",
          namespace: "",
          prefix: "",
          qname: "v",
          references: [{ name: "x", offset: 2 }],
          value: `${at % 10}&x;"\t${at % 2 === 0 ? "é" : "ā"}`,
        },
        ...declarations,
      ],
      // oxlint-disable-next-line typescript/no-use-before-define -- An element's children are labelled by `child`, which labels elements by this function.
      children: node.children.map((inner) => child(inner, scope)),
      kind: "element",
      local,
      namespace: scope.get("") ?? "",
      prefix: "",
      qname: local,
    };
  };

  const child = (node: PlaneTree, parent: Scope): Child => {
    const at = number;
    number += 1;
    const kind =
      node.children.length > 0 ? "element" : Arr.getUnsafe(CHILD_KINDS, at % CHILD_KINDS.length);

    return kind === "element"
      ? element(node, at, parent)
      : labelledLeaf(kind, at, at % 2 === 0 ? "é" : "ā");
  };

  return element(tree, 0, ROOT_SCOPE);
};
