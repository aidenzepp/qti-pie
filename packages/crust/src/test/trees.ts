/* oxlint-disable unicorn/text-encoding-identifier-case -- The trees carry XML encoding labels (`UTF-8`) as documents spell them. */
/**
 * The one generator of crust's trees and documents, on `@grizzle/testing`'s choice stream (doctrine
 * rules 4, 7 and 10): every case is a tape of bounded choices, so one generator is searched at
 * random, enumerated, replayed from `TEST_REPLAY` and shrunk by editing its tape.
 *
 * A generated tree is one crust's types admit by construction: each element's namespace and each
 * prefixed attribute's namespace is the one its scope binds, as the reader resolves them. Adjacent
 * text runs are not merged and an empty text run may occur, which the reader never produces but
 * every writer must handle. Each case draws its own swarm over {@link treeFeatures}, and its own
 * bounds within the suite's, so different cases explore different lopsided corners and a bound
 * that bites only at scale is met small.
 */
import { Array as Arr, Duration, Option } from "effect";
import { array, boolean, constant, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import type { Attribute, Child, Element, Misc, XmlDocument } from "#crust/tree.ts";

/**
 * How long one generated case may run before its search reports it hung: a case is one tree of at
 * most a few hundred nodes, written and read a few times, which takes milliseconds.
 */
export const caseHang = Duration.seconds(30);

/**
 * The timeout, in milliseconds, for each test that searches generated cases or exhausts a box. The
 * slowest, the writer's search over swarmed documents (400 rotating cases, a floor of 100 and no
 * steered case), took 1,568 ms beside crust's other suites (2026-11-05, Node 26.13.0, load average
 * 54). The reader's 400 swarmed trees before the search took 5,115 ms at load average 48, so a
 * search of 500 such cases may take some 6.4 s there. The budget is twice that, rounded up to the
 * next 1,000. Measured 2026-11-07: 2.6 s at a load average of 70 to 74, the slowest search under
 * it, and it is the suites' hang guard of 60 s (`packages/pantry/src/test/timeouts.test.ts`), since
 * a search's timeout is the deadline `searched` stops it at, never its budget. Raise it only on a
 * new measurement recorded here, never to make a run pass.
 */
export const GENERATED_TIMEOUT_MS = 60_000;

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
 * The kinds of child a generated element holds, `cdata` being a text run written as CDATA, the
 * simplest first, which a swarm with every kind off falls back to.
 */
const CHILD_KINDS = ["text", "element", "cdata", "comment", "pi", "entityRef"] as const;

/**
 * One kind of child.
 */
type ChildKind = (typeof CHILD_KINDS)[number];

/**
 * The features a case's swarm weighs (doctrine rule 7): each kind of child, an attribute in each
 * of an element's three slots, an element's own namespace declarations, an unexpanded entity
 * reference in an attribute value, and a character or a name drawn from the wild pool, the one
 * every escape, every encoder threshold and every unwritable construct turns on.
 */
export const treeFeatures = [
  ...CHILD_KINDS,
  "attribute",
  "declaration",
  "reference",
  "wild",
] as const;

/**
 * A feature of {@link treeFeatures}.
 */
export type TreeFeature = (typeof treeFeatures)[number];

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
 * Draw a case's bounds within a suite's, each from its least to the suite's, so a case meets a
 * bound small as often as large (doctrine rule 10).
 *
 * @param most - The suite's bounds.
 * @returns The generator of the case's.
 */
const boundsWithin =
  (most: Bounds): Gen<Bounds> =>
  (source) => ({
    depth: source.draw(int(1, most.depth)),
    nodes: source.draw(int(1, most.nodes)),
    width: source.draw(int(0, most.width)),
  });

/**
 * Draw a run of up to `most` pieces of text.
 *
 * @param drawn - The case's swarm.
 * @param most - The most pieces.
 * @returns The generator of the text.
 */
const textOf =
  (drawn: Swarm<TreeFeature>, most: number): Gen<string> =>
  (source) => {
    let text = "";
    for (let count = source.draw(int(0, most)); count > 0; count -= 1) {
      text += source.draw(keep(drawn, "wild"))
        ? source.draw(element(WILD))
        : source.draw(element(PLAIN));
    }

    return text;
  };

/**
 * Draw a name, wild where the swarm keeps it.
 *
 * @param drawn - The case's swarm.
 * @returns The generator of the name.
 */
const nameOf =
  (drawn: Swarm<TreeFeature>): Gen<string> =>
  (source) =>
    source.draw(keep(drawn, "wild"))
      ? source.draw(element(WILD_NAMES))
      : source.draw(element(NAMES));

/**
 * Draw an attribute value and the offset of each unexpanded entity reference in it, built
 * together so each offset names the `&` of a reference.
 *
 * @param drawn - The case's swarm.
 * @returns The generator of the value and its references.
 */
const valueOf =
  (drawn: Swarm<TreeFeature>): Gen<Pick<Attribute, "references" | "value">> =>
  (source) => {
    const references: { name: string; offset: number }[] = [];
    let value = "";
    for (let count = source.draw(int(0, 3)); count > 0; count -= 1) {
      if (source.draw(keep(drawn, "reference"))) {
        const name = source.draw(nameOf(drawn));
        references.push({ name, offset: value.length });
        value += `&${name};`;
      } else {
        value += source.draw(textOf(drawn, 2));
      }
    }

    return { references, value };
  };

/**
 * Draw an element's own namespace declarations: where the swarm keeps them, each of the default
 * and the prefixes `p` and `q` may be declared, the default possibly to no namespace.
 *
 * @param drawn - The case's swarm.
 * @returns The generator of the declarations, as the attributes the reader gives them.
 */
const declarationsOf =
  (drawn: Swarm<TreeFeature>): Gen<readonly Attribute[]> =>
  (source) => {
    if (!source.draw(keep(drawn, "declaration"))) {
      return [];
    }

    return ["", "p", "q"].flatMap((prefix): readonly Attribute[] => {
      if (!source.draw(boolean)) {
        return [];
      }

      const value = source.draw(element(["urn:a", "urn:b", prefix === "" ? "" : "urn:c"]));

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
 * Draw a prefix bound in `scope` to a namespace, or the empty prefix.
 *
 * @param scope - The bindings in scope.
 * @returns The generator of the prefix.
 */
const prefixIn = (scope: Scope): Gen<string> =>
  element([
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
 * @param drawn - The case's swarm.
 * @param parent - The scope of the element's parent.
 * @param children - The element's children list.
 * @returns The generator of the element, and the scope it makes for its children.
 */
const elementOf =
  (drawn: Swarm<TreeFeature>, parent: Scope, children: Child[]): Gen<Drawn> =>
  (source) => {
    const declarations = source.draw(declarationsOf(drawn));
    const scope = scopeOf(parent, declarations);
    const prefix = source.draw(prefixIn(scope));
    const local = source.draw(nameOf(drawn));
    const attributes = [0, 1, 2].flatMap((slot): readonly Attribute[] => {
      if (!source.draw(keep(drawn, "attribute"))) {
        return [];
      }

      const attributePrefix = source.draw(prefixIn(scope));
      const attributeLocal = `${source.draw(nameOf(drawn))}${slot}`;

      return [
        {
          ...source.draw(valueOf(drawn)),
          local: attributeLocal,
          namespace: attributePrefix === "" ? "" : (scope.get(attributePrefix) ?? ""),
          prefix: attributePrefix,
          qname: attributePrefix === "" ? attributeLocal : `${attributePrefix}:${attributeLocal}`,
        },
      ];
    });

    return {
      element: {
        attributes: source.draw(boolean)
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
 * @param drawn - The case's swarm.
 * @param kind - The kind to draw.
 * @returns The generator of the child.
 */
const leafOf =
  (drawn: Swarm<TreeFeature>, kind: Exclude<ChildKind, "element">): Gen<Child> =>
  (source) => {
    switch (kind) {
      case "text": {
        return { cdata: false, kind: "text", value: source.draw(textOf(drawn, 4)) };
      }
      case "cdata": {
        return { cdata: true, kind: "text", value: source.draw(textOf(drawn, 4)) };
      }
      case "comment": {
        return { kind: "comment", text: source.draw(textOf(drawn, 3)) };
      }
      case "pi": {
        return {
          data: source.draw(textOf(drawn, 3)),
          kind: "pi",
          target: source.draw(nameOf(drawn)),
        };
      }
      case "entityRef": {
        return { kind: "entityRef", name: source.draw(nameOf(drawn)) };
      }
      default: {
        return kind satisfies never;
      }
    }
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
 * @param drawn - The case's swarm.
 * @param bounds - The tree's limits.
 * @param kinds - The child kinds a suite admits, among which the swarm chooses; the first stands
 *   in where the swarm turns every one off.
 * @returns The generator of the root element.
 */
const rootOf =
  (
    drawn: Swarm<TreeFeature>,
    bounds: Bounds,
    kinds: Arr.NonEmptyReadonlyArray<ChildKind>,
  ): Gen<Element> =>
  (source) => {
    const children: Child[] = [];
    const { element: root, scope } = source.draw(elementOf(drawn, ROOT_SCOPE, children));
    let budget = bounds.nodes - 1;
    const open: Open[] = [{ depth: 1, into: children, scope }];
    for (let next = open.pop(); next !== undefined; next = open.pop()) {
      const width = next.depth < bounds.depth ? source.draw(int(0, bounds.width)) : 0;
      for (let count = 0; count < width && budget > 0; count += 1) {
        const kind = source.draw(swarmChoice(drawn, kinds));
        budget -= 1;
        if (kind === "element") {
          const inner: Child[] = [];
          const made = source.draw(elementOf(drawn, next.scope, inner));
          next.into.push(made.element);
          open.push({ depth: next.depth + 1, into: inner, scope: made.scope });
        } else {
          next.into.push(source.draw(leafOf(drawn, kind)));
        }
      }
    }

    return root;
  };

/**
 * A generated tree: the root element, and the bounds and swarm it was drawn under.
 */
export interface GeneratedTree {
  readonly bounds: Bounds;
  readonly root: Element;
  readonly swarm: Swarm<TreeFeature>;
}

/**
 * Draw a tree: a swarm over a suite's features, bounds within the suite's, and a root within them.
 *
 * @param most - The suite's bounds.
 * @param features - The features the suite admits, every one by default; a suite that leaves out
 *   a child kind or `reference` draws no such node.
 * @returns The generator of the case.
 */
export const generatedTree =
  (
    most: Bounds,
    features: Arr.NonEmptyReadonlyArray<TreeFeature> = treeFeatures,
  ): Gen<GeneratedTree> =>
  (source) => {
    const drawn = source.draw(swarm(features));
    const bounds = source.draw(boundsWithin(most));
    const kinds = CHILD_KINDS.filter((kind) => features.includes(kind));

    return {
      bounds,
      root: source.draw(
        rootOf(drawn, bounds, Arr.isReadonlyArrayNonEmpty(kinds) ? kinds : ["text"]),
      ),
      swarm: drawn,
    };
  };

/**
 * Draw a comment or a processing instruction for the prolog or the epilog.
 *
 * @param drawn - The case's swarm.
 * @returns The generator of the item.
 */
const miscOf =
  (drawn: Swarm<TreeFeature>): Gen<Misc> =>
  (source) =>
    source.draw(boolean)
      ? { kind: "comment", text: source.draw(textOf(drawn, 3)) }
      : { data: source.draw(textOf(drawn, 3)), kind: "pi", target: source.draw(nameOf(drawn)) };

/**
 * Draw an option of a value, none first, so a case shrinks toward leaving it out.
 *
 * @param generator - The value's generator.
 * @returns The generator of the option.
 */
const maybe =
  <A>(generator: Gen<A>): Gen<Option.Option<A>> =>
  (source) =>
    source.draw(boolean) ? Option.some(source.draw(generator)) : Option.none();

/**
 * A generated document: the document, and the bounds and swarm its tree was drawn under.
 */
export interface GeneratedDocument {
  readonly bounds: Bounds;
  readonly document: XmlDocument;
  readonly swarm: Swarm<TreeFeature>;
}

/**
 * Draw a whole document: an optional declaration and doctype, the prolog, the tree and the epilog.
 *
 * @param most - The suite's bounds.
 * @returns The generator of the case.
 */
export const generatedDocument =
  (most: Bounds): Gen<GeneratedDocument> =>
  (source) => {
    const tree = source.draw(generatedTree(most));
    const drawn = tree.swarm;

    return {
      bounds: tree.bounds,
      document: {
        charset: "UTF-8",
        declaration: source.draw(
          maybe((inner) => ({
            encoding: inner.draw(maybe(element(["UTF-8", "US-ASCII"]))),
            standalone: inner.draw(maybe(element(["yes", "no"]))),
            version: "1.0",
          })),
        ),
        doctype: source.draw(
          maybe(
            (inner) =>
              `<!DOCTYPE ${inner.draw(nameOf(drawn))} SYSTEM "${inner.draw(textOf(drawn, 2))}">`,
          ),
        ),
        epilog: source.draw(array(miscOf(drawn), { max: 2, min: 0 })),
        prolog: source.draw(array(miscOf(drawn), { max: 2, min: 0 })),
        root: tree.root,
      },
      swarm: drawn,
    };
  };

/**
 * The situations a generated tree reached, read off the value, never the swarm it was drawn under
 * (doctrine rule 8): each kind of child it holds, an attribute, a namespace declaration, an
 * unexpanded entity reference in a value, a wild character, a bare root, and a tree three or more
 * elements deep.
 */
export const treeSituations = [
  ...CHILD_KINDS,
  "attribute",
  "bare root",
  "declaration",
  "deep",
  "reference",
  "wild",
] as const;

/**
 * A situation of {@link treeSituations}.
 */
export type TreeSituation = (typeof treeSituations)[number];

/**
 * The situations a generated document reached: its tree's, and its XML declaration, doctype,
 * prolog and epilog.
 */
export const documentSituations = [
  ...treeSituations,
  "doctype",
  "epilog",
  "prolog",
  "xml declaration",
] as const;

/**
 * A situation of {@link documentSituations}.
 */
export type DocumentSituation = (typeof documentSituations)[number];

/**
 * Whether a text holds a character of the wild pool.
 *
 * @param text - The text.
 * @returns Whether a wild character occurs in it.
 */
const isWild = (text: string): boolean => WILD.some((wild) => text.includes(wild));

/**
 * Read the situations a tree reached.
 *
 * @param root - The root element.
 * @returns The situations, each once.
 */
export const situationsOf = (root: Element): ReadonlySet<TreeSituation> => {
  const reached = new Set<TreeSituation>(root.children.length === 0 ? ["bare root"] : []);
  const stack: (readonly [Element, number])[] = [[root, 1]];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const [held, depth] = next;
    if (depth >= 3) {
      reached.add("deep");
    }

    if ([held.local, ...held.attributes.map(({ local }) => local)].some(isWild)) {
      reached.add("wild");
    }

    for (const attribute of held.attributes) {
      reached.add(attribute.namespace === XMLNS ? "declaration" : "attribute");
      if (attribute.references.length > 0) {
        reached.add("reference");
      }

      if (isWild(attribute.value)) {
        reached.add("wild");
      }
    }

    for (const child of held.children) {
      switch (child.kind) {
        case "element": {
          reached.add("element");
          stack.push([child, depth + 1]);
          break;
        }
        case "text": {
          reached.add(child.cdata ? "cdata" : "text");
          if (isWild(child.value)) {
            reached.add("wild");
          }

          break;
        }
        case "comment": {
          reached.add("comment");
          break;
        }
        case "pi": {
          reached.add("pi");
          break;
        }
        case "entityRef": {
          reached.add("entityRef");
          break;
        }
        default: {
          return child satisfies never;
        }
      }
    }
  }

  return reached;
};

/**
 * Read the situations a document reached: its tree's, and its declaration, doctype, prolog and
 * epilog.
 *
 * @param document - The document.
 * @returns The situations, each once.
 */
export const documentSituationsOf = (document: XmlDocument): ReadonlySet<DocumentSituation> =>
  new Set<DocumentSituation>([
    ...situationsOf(document.root),
    ...(Option.isSome(document.declaration) ? (["xml declaration"] as const) : []),
    ...(Option.isSome(document.doctype) ? (["doctype"] as const) : []),
    ...(document.prolog.length > 0 ? (["prolog"] as const) : []),
    ...(document.epilog.length > 0 ? (["epilog"] as const) : []),
  ]);

/**
 * An ordered tree with no content, a plane tree: a node and its children, in order.
 */
export interface PlaneTree {
  readonly children: readonly PlaneTree[];
}

/**
 * Draw an ordered sequence of trees with `nodes` nodes in all: the first tree's size, the tree,
 * then the rest, so every sequence is one tape and enumeration yields each once.
 *
 * @param nodes - The node count.
 * @returns The generator of the forest.
 */
const forestOf =
  (nodes: number): Gen<readonly PlaneTree[]> =>
  (source) => {
    if (nodes === 0) {
      return [];
    }

    const first = source.draw(int(1, nodes));
    // oxlint-disable-next-line typescript/no-use-before-define -- Forests and trees are defined by each other.
    const tree = source.draw(planeTreeOf(first));

    return [tree, ...source.draw(forestOf(nodes - first))];
  };

/**
 * Draw a plane tree of exactly `nodes` nodes: its root and a forest of the rest. Enumerated, it
 * yields every one of the Catalan number C(nodes - 1) of them, each once.
 *
 * @param nodes - The node count, at least 1.
 * @returns The generator of the tree.
 */
export const planeTreeOf =
  (nodes: number): Gen<PlaneTree> =>
  (source) => ({ children: source.draw(forestOf(nodes - 1)) });

/**
 * Draw a plane tree of 1 to `most` nodes: its size, then a tree of that size. Enumerated, it
 * yields every plane tree of that many nodes or fewer, each once, smallest first.
 *
 * @param most - The most nodes.
 * @returns The generator of the size and the tree.
 */
export const planeTreeUpTo = (
  most: number,
): Gen<{ readonly nodes: number; readonly tree: PlaneTree }> => {
  const sizes = Arr.makeBy(most, (at) => at + 1);

  return (source) => {
    const nodes = source.draw(Arr.isReadonlyArrayNonEmpty(sizes) ? element(sizes) : constant(1));

    return { nodes, tree: source.draw(planeTreeOf(nodes)) };
  };
};

/**
 * The plane trees of 1 to 7 nodes, the Catalan numbers' sum: 1 + 1 + 2 + 5 + 14 + 42 + 132.
 */
export const PLANE_TREES_TO_7 = 197;

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
 * The child kinds a labelled leaf takes in turn by its number, in the order they were labelled
 * before the swarm's fallback order put `text` first.
 */
const LABEL_KINDS = ["element", "text", "cdata", "comment", "pi", "entityRef"] as const;

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
  const labelledElement = (node: PlaneTree, at: number, parent: Scope): Element => {
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
      node.children.length > 0 ? "element" : Arr.getUnsafe(LABEL_KINDS, at % LABEL_KINDS.length);

    return kind === "element"
      ? labelledElement(node, at, parent)
      : labelledLeaf(kind, at, at % 2 === 0 ? "é" : "ā");
  };

  return labelledElement(tree, 0, ROOT_SCOPE);
};
