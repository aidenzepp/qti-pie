/* oxlint-disable unicorn/text-encoding-identifier-case -- The generator spells the XML encoding labels (`UTF-8`) as crust's reader reports them, so a generated tree is one a read gives back. */
/**
 * The one XDM tree generator (doctrine rules 4, 6 and 7): valid trees over the composed grammar,
 * built by construction, and the named ways to corrupt a valid tree's rows.
 *
 * A generated tree is valid by construction against the laws the model's own code reads: every
 * child is a kind its parent admits in the tree's version (`Admission`), each family is in an order
 * `Order`'s intervals admit (no child follows a state past its `hi`), every attribute is admitted
 * on its element's kind under its closed name or its open class (`AttributeAdmission`), and a
 * foreign element sits only under a parent that admits its namespace class, under a name of that
 * class no kind that parent admits takes. It is also a tree a reader can give back: every prefix is
 * bound where it is used, no two runs of character data are adjacent, a doctype with an external
 * subset precedes every unexpanded entity reference, and no name repeats on one element. Laws the
 * model does not read (ancestry bans, child sets, required attributes, value domains) are left to
 * fall where they fall.
 *
 * Each case draws its own swarm over the kinds of node it builds ({@link xdmFeatures}), and its own
 * bounds on depth, width and attributes (rule 10), so runs explore lopsided corners. A case also
 * carries an independent model of the tree's shape ({@link Placed}), written as the generator
 * places each node and closes each subtree, which the tree's rows are checked against.
 *
 * The invalid variants ({@link Corruption}) are named, weighted and countable (rule 6): each is an
 * edit of a valid tree's rows that the generator draws among the variants that tree admits, and
 * {@link lawOf} names the law that refuses it. They serve the host's law model now and PostgreSQL's
 * laws at W5.
 */
import { Array as Arr, Duration, Option, pipe } from "effect";
import type { Types } from "effect";
import type { Gen } from "@grizzle/testing/gen";
import {
  array,
  constant,
  element,
  int,
  proportional,
  shuffled,
  string,
  weighted,
} from "@grizzle/testing/gen";
import { keep, swarm, swarmChoice, weightOf } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { flags } from "#pantry/grammar/ancestry.ts";
import type { Ancestry } from "#pantry/grammar/ancestry.ts";
import type { ComposedGrammar, Kind } from "#pantry/grammar/compose.ts";
import { foreignKinds, isForeignKind, openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { ForeignKind } from "#pantry/grammar/kinds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { flatten, none } from "#pantry/model/xdm.ts";
import type { LawName } from "#pantry/test/oracle.ts";
import type {
  ClosedName,
  ElementKind,
  ExpandedName,
  OpenClass,
  XdmAttribute,
  XdmAttributeReference,
  XdmCharacter,
  XdmChild,
  XdmClosedElement,
  XdmDeclaration,
  XdmDocument,
  XdmForeignElement,
  XdmMisc,
  XdmNamespace,
  NodeId,
} from "#pantry/model/xdm.ts";
import {
  asiNamespace,
  mathmlNamespace,
  namespaceClassOf,
  xmlNamespace,
  xsiNamespace,
  xsNamespace,
} from "#pantry/vocab/namespaces.ts";
import type { OpenName } from "#pantry/vocab/open.ts";

/**
 * Give the node numbered `index` a uuid that spells its number, so a row names its node by its
 * place in document order, and ids sort in that order.
 *
 * @param index - The node's number in document order.
 * @returns A uuid whose last group is the number in hexadecimal.
 */
export const idOf = (index: number): NodeId =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

/**
 * Give the node numbered `index` a uuid whose order is not document order, as drawn ids are not:
 * the number times an odd constant, modulo 2³², is a bijection, so every node keeps its own id.
 *
 * @param index - The node's number in document order, below 3,000,000, where the product is exact.
 * @returns A uuid that spells the scrambled number.
 */
export const scrambledIdOf = (index: number): NodeId =>
  idOf((index * 2_654_435_761) % 4_294_967_296);

/**
 * How long one generated case may run before its search reports it hung: a case is one tree of at
 * most a few hundred nodes, read and written a few times, which takes milliseconds.
 */
export const caseHang = Duration.seconds(30);

/**
 * How long a test that searches generated trees may run: a few hundred cases of a few milliseconds
 * each, beside the composed grammar, which takes some seconds to read once a file.
 */
export const searchTimeout = 300_000;

/**
 * The kinds of node and the situations a case's swarm weighs: elements of a kind, foreign elements
 * under a wildcard, each kind of character data, closed attributes, open attribute names, two names
 * of one open class on one element (which share the class's position, so AL2's distinctness holds
 * only through its open-class mask), namespace declarations beyond those a name needs, and the
 * doctype.
 */
export const xdmFeatures = [
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
] as const;

/**
 * A feature of {@link xdmFeatures}.
 */
export type XdmFeature = (typeof xdmFeatures)[number];

/**
 * The kinds of child a family slot is drawn among, each a feature: an element of a kind, a foreign
 * element, or a kind of character data.
 */
type ChildClass = Extract<
  XdmFeature,
  "comment" | "element" | "entityRef" | "pi" | "text" | "wildcard" | "ws"
>;

/**
 * One node of the independent tree model, in document order: the number of its parent, its slot,
 * its kind, and the interval the generator wrote for it, its number as `start` and the number of
 * nodes placed when its subtree closed as `end`. The document node is node 0, its own parent at
 * slot 0, over `[0, N)`.
 */
export interface Placed {
  readonly at: number;
  readonly end: number;
  readonly kind: Kind;
  readonly parent: number;
  readonly start: number;
}

/**
 * A generated case: the tree, the model of its shape the generator wrote as it placed each node,
 * and the swarm it was drawn under.
 */
export interface GeneratedXdm {
  /**
   * The bounds the case was drawn under, which a test reports as its search's bound.
   */
  readonly bounds: Bounds;
  readonly document: XdmDocument<Composed>;
  readonly model: readonly Placed[];
  readonly swarm: Swarm<XdmFeature>;
}

/**
 * What a child is drawn as: an element of a kind, a foreign element, or a kind of character data,
 * whose kind is its class.
 */
type Drawn =
  | { readonly class: "element"; readonly kind: ElementKind<Composed> }
  | { readonly class: "wildcard"; readonly kind: ForeignKind }
  | { readonly class: Exclude<ChildClass, "element" | "wildcard"> };

/**
 * A child kind its parent admits, with the content-model position its `Admission` cell names: 0 for
 * character data, which leaves its family's state as it was, and for a kind several positions name,
 * whose position its predecessor's state decides through `Symbol`.
 */
type Candidate = Drawn & { readonly position: number };

/**
 * A (version, parent)'s content model as its Glushkov automaton (`#pantry/grammar/content.ts`): the
 * positions each state may be followed by (`Follow`, from 0, the start), the states a family may
 * end in (`Last`), the positions each kind several positions name may take (`Symbol`), and the
 * fewest nodes that end the family from each state, which the generator completes a family by.
 */
interface Automaton {
  readonly finish: Map<number, number>;
  readonly follow: ReadonlyMap<number, ReadonlySet<number>>;
  readonly into: ReadonlyMap<number, readonly number[]>;
  readonly last: ReadonlySet<number>;
  readonly shared: ReadonlyMap<string, readonly number[]>;
}

/**
 * What the generator reads of a grammar, gathered once: each (version, parent)'s admitted children
 * and content automaton, each element kind's name and the fewest nodes a valid subtree of it holds,
 * each (version, kind)'s closed attributes and open classes, and the foreign names of each class
 * each (version, parent) admits.
 */
interface Index {
  readonly automata: ReadonlyMap<string, Automaton>;
  readonly children: ReadonlyMap<string, readonly Candidate[]>;
  readonly closed: ReadonlyMap<string, readonly ClosedName<Composed>[]>;
  /**
   * The foreign names of a class a parent admits as foreign elements: the names of that class
   * against the parent's namespace that resolve to no kind the parent admits.
   *
   * @param version - The version.
   * @param parent - The parent's kind.
   * @param namespace - The parent's namespace, which a name's class is read against.
   * @param kind - The foreign kind of the class.
   * @returns The names, none when the class holds no name the parent leaves foreign.
   */
  readonly foreign: (
    version: Composed["version"],
    parent: ElementKind<Composed> | ForeignKind,
    namespace: string,
    kind: ForeignKind,
  ) => Option.Option<Arr.NonEmptyReadonlyArray<ExpandedName>>;
  /**
   * Each (version, element kind)'s declared type, `none` for an anonymous one, and the names its
   * `xsi:type` may be drawn with, each with the governing type it gives the element: for a kind of
   * a vocabulary the types `XsiType` admits; for a foreign kind `xs:anyType`, each built-in simple
   * type that governs a foreign element, and a name no schema defines, which leaves it to lax
   * assessment (spec reading 60).
   */
  readonly governing: ReadonlyMap<
    string,
    { readonly declared: string; readonly named: readonly Typing[] }
  >;
  /**
   * The (version, kind, type) of every governor, keyed `version kind type`: an element of the kind
   * that type governs reads its attributes under the governor (`Governor`).
   */
  readonly governors: ReadonlySet<string>;
  readonly names: ReadonlyMap<string, ExpandedName>;
  readonly open: ReadonlyMap<string, ReadonlySet<OpenClass>>;
  /**
   * How far below each (version, kind) each child class can first appear: 1 where the kind admits
   * it, one more than the nearest element child's reach otherwise, absent where no descendant
   * within the deepest bound admits it.
   */
  readonly reach: ReadonlyMap<string, ReadonlyMap<ChildClass, number>>;
  /**
   * The root element kinds the document node admits, in each version, each with a valid subtree.
   */
  readonly roots: ReadonlyMap<string, Arr.NonEmptyReadonlyArray<ElementKind<Composed>>>;
  /**
   * The fewest nodes a valid subtree of each (version, element kind) holds, the foreign kind's
   * included; absent where no subtree is valid.
   */
  readonly size: ReadonlyMap<string, number>;
}

/**
 * Key a relation's rows by version and kind.
 *
 * @param version - The version.
 * @param kind - The kind.
 * @returns One string per (version, kind).
 */
const keyOf = (version: string, kind: string): string => `${version} ${kind}`;

/**
 * How each admitted child kind is drawn.
 *
 * @param kind - An admitted child's kind.
 * @returns How it is drawn, or none for a kind no family slot holds: the doctype, which only a
 *   document's own field holds, and the document.
 */
const drawnOf = (kind: Kind): Option.Option<Drawn> => {
  if (kind === "document" || kind === "doctype") {
    return Option.none();
  }

  if (isForeignKind(kind)) {
    return Option.some({ class: "wildcard", kind });
  }

  if (
    kind === "text" ||
    kind === "ws" ||
    kind === "comment" ||
    kind === "pi" ||
    kind === "entityRef"
  ) {
    return Option.some({ class: kind });
  }

  return Option.some({ class: "element", kind });
};

/**
 * The kind a drawn child is.
 *
 * @param drawn - How it is drawn.
 * @returns Its `NodeKind` handle.
 */
const kindOfDrawn = (drawn: Drawn): Kind => {
  switch (drawn.class) {
    case "element":
    case "wildcard": {
      return drawn.kind;
    }
    case "text":
    case "ws":
    case "comment":
    case "pi":
    case "entityRef": {
      return drawn.class;
    }
    default: {
      return drawn satisfies never;
    }
  }
};

/**
 * The state a candidate takes a family to from a state: its position where `Follow` admits it
 * there; for a kind several positions name, the one of them `Follow` admits, when exactly one does;
 * and for character data the state as it was.
 *
 * @param automaton - The family's content automaton.
 * @param candidate - The candidate.
 * @param from - The family's state before it.
 * @returns The next state, or none when the candidate cannot take the next slot.
 */
const nextOf = (
  automaton: Automaton,
  candidate: Candidate,
  from: number,
): Option.Option<number> => {
  const follows = (to: number): boolean => automaton.follow.get(from)?.has(to) ?? false;
  if (candidate.position !== 0) {
    return Option.liftPredicate(candidate.position, follows);
  }

  const shared = automaton.shared.get(kindOfDrawn(candidate));
  if (shared === undefined) {
    return Option.some(from);
  }

  const next = shared.filter(follows);

  return next.length === 1 ? Arr.head(next) : Option.none();
};

/**
 * The local names a foreign element is drawn with: names no vocabulary holds, and the names of real
 * kinds, which are foreign where their parent admits no kind of that name (spec reading 30).
 */
const foreignLocals = [
  "widget",
  "config",
  "qti-prompt",
  "p",
  "div",
  "mi",
  "qti-assessment-item",
] as const;

/**
 * The namespaces a foreign element is drawn in beside its parent's own: one no vocabulary models,
 * none, and ASI's. MathML's is never one, a MathML parent's own included: MathML's grammar starts
 * at `math` and its `anyElement` excludes MathML's own namespace (MathML 3 RelaxNG,
 * `mathml3-common.rnc` lines 15 and 61; MathML 3 §2.2), so no foreign element is in it, and the
 * law "MathML foreign element" refuses one (spec reading 2).
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter2.html#fund.math | MathML 3, 2.2 The Top-Level math Element}
 */
const foreignNamespaces = ["urn:w", "", asiNamespace] as const;

/**
 * The foreign element names of a class against a parent's namespace: every local name in each
 * namespace drawn from, the parent's included unless it is MathML's, whose class against the
 * parent's is the one asked for.
 *
 * @param namespace - The parent's namespace.
 * @param kind - The foreign kind of the class.
 * @returns The names.
 */
const foreignPoolOf = (namespace: string, kind: ForeignKind): readonly ExpandedName[] =>
  [...new Set<string>([...foreignNamespaces, namespace])]
    .filter(
      (drawn) =>
        drawn !== mathmlNamespace && foreignKinds[namespaceClassOf(drawn, namespace)] === kind,
    )
    .flatMap((drawn) => foreignLocals.map((local) => ({ local, namespace: drawn })));

/**
 * The indexes already gathered, by grammar.
 */
const indexes = new WeakMap<ComposedGrammar, Index>();

/**
 * The deepest a case's depth bound reaches, which bounds how far below a kind the generator looks
 * for what it can reach.
 */
const deepest = 7;

/**
 * Append a value to a map's list at a key.
 *
 * @param map - The map.
 * @param key - The key.
 * @param value - The value.
 */
const pushAt = <K, T>(map: Map<K, T[]>, key: K, value: T): void => {
  const list = map.get(key);
  if (list === undefined) {
    map.set(key, [value]);
  } else {
    list.push(value);
  }
};

/**
 * Gather each (version, parent)'s content automaton from the grammar's `Follow`, `Last` and
 * `Symbol`.
 *
 * @param grammar - The composed grammar.
 * @returns The automata, by (version, parent), each with no finishing costs yet.
 */
const automataOf = (grammar: ComposedGrammar): ReadonlyMap<string, Automaton> => {
  const follow = new Map<string, Map<number, Set<number>>>();
  const into = new Map<string, Map<number, number[]>>();
  for (const row of grammar.content.follow.rows) {
    const key = keyOf(row.version, row.parent);
    const from = Number(row.from);
    const to = Number(row.to);
    const own = follow.get(key) ?? new Map<number, Set<number>>();
    follow.set(key, own);
    own.set(from, (own.get(from) ?? new Set()).add(to));

    const back = into.get(key) ?? new Map<number, number[]>();
    into.set(key, back);
    pushAt(back, to, from);
  }

  const last = new Map<string, Set<number>>();
  for (const row of grammar.content.last.rows) {
    const key = keyOf(row.version, row.parent);
    last.set(key, (last.get(key) ?? new Set()).add(Number(row.position)));
  }

  const shared = new Map<string, Map<string, number[]>>();
  for (const row of grammar.content.symbol.rows) {
    const key = keyOf(row.version, row.parent);
    const own = shared.get(key) ?? new Map<string, number[]>();
    shared.set(key, own);
    pushAt(own, row.kind, Number(row.position));
  }

  return new Map(
    [...new Set([...follow.keys(), ...last.keys()])].map((key) => [
      key,
      {
        finish: new Map(),
        follow: follow.get(key) ?? new Map(),
        into: into.get(key) ?? new Map(),
        last: last.get(key) ?? new Set(),
        shared: shared.get(key) ?? new Map(),
      },
    ]),
  );
};

/**
 * Compute the fewest nodes each automaton's family needs from each state to end, given what each
 * child costs: a shortest path backwards from the `Last` states, each step into a position costing
 * its cheapest candidate.
 *
 * @param automaton - The automaton, whose `finish` it fills.
 * @param candidates - The family's candidates.
 * @param costOf - What a candidate's subtree costs, none where it has no valid subtree.
 */
const finishOf = (
  automaton: Automaton,
  candidates: readonly Candidate[],
  costOf: (candidate: Candidate) => Option.Option<number>,
): void => {
  const step = new Map<number, number>();
  for (const candidate of candidates) {
    for (const cost of Option.toArray(costOf(candidate))) {
      const positions =
        candidate.position === 0
          ? (automaton.shared.get(kindOfDrawn(candidate)) ?? [])
          : [candidate.position];
      for (const position of positions) {
        step.set(position, Math.min(step.get(position) ?? Infinity, cost));
      }
    }
  }

  automaton.finish.clear();

  const queue = [...automaton.last];
  for (const state of queue) {
    automaton.finish.set(state, 0);
  }

  for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
    const through = (automaton.finish.get(next) ?? Infinity) + (step.get(next) ?? Infinity);
    for (const from of automaton.into.get(next) ?? []) {
      if (through < (automaton.finish.get(from) ?? Infinity)) {
        automaton.finish.set(from, through);
        queue.push(from);
      }
    }
  }
};

/**
 * Gather each (version, parent)'s admitted children as the generator draws them, but a foreign
 * kind only a strict wildcard of the parent holds.
 *
 * @param grammar - The composed grammar.
 * @returns The candidates, by (version, parent).
 */
const childrenOf = (grammar: ComposedGrammar): ReadonlyMap<string, readonly Candidate[]> => {
  const children = new Map<string, Candidate[]>();
  for (const { child, parent, position, version } of grammar.admission.rows) {
    // A foreign element only a strict wildcard holds stands only with an xsi:type its document's
    // schema set resolves (spec reading 72, `StrictlyHeld`). A foreign element's xsi:type is drawn
    // with no regard to the wildcard that holds it, a name no schema defines among them, so none
    // is drawn there.
    const strict = Option.isSome(grammar.content.strictlyHeld.lookup({ child, parent, version }));
    const kind = grammar.kinds.nodeKind.has(child) && !strict ? Option.some(child) : Option.none();
    for (const drawn of Option.toArray(kind.pipe(Option.flatMap(drawnOf)))) {
      pushAt(children, keyOf(version, parent), { ...drawn, position: Number(position) });
    }
  }

  return children;
};

/**
 * Compute each element kind's smallest valid subtree, a fixpoint: one node, and the cheapest way
 * its automaton ends from the start, each child costing its own smallest subtree; character data
 * costs nothing, since no automaton needs it. Each automaton's finishing costs are filled on the
 * way.
 *
 * @param automata - The automata, by (version, parent).
 * @param children - The candidates, by (version, parent).
 * @returns The sizes, by (version, kind).
 */
const sizesOf = (
  automata: ReadonlyMap<string, Automaton>,
  children: ReadonlyMap<string, readonly Candidate[]>,
): ReadonlyMap<string, number> => {
  const size = new Map<string, number>();
  const costOf =
    (version: string) =>
    (candidate: Candidate): Option.Option<number> =>
      candidate.class === "element" || candidate.class === "wildcard"
        ? Option.fromNullishOr(size.get(keyOf(version, kindOfDrawn(candidate))))
        : Option.none();
  for (let changed = true; changed;) {
    changed = false;
    for (const [key, automaton] of automata) {
      const [version = "", parent = ""] = key.split(" ");
      finishOf(automaton, children.get(key) ?? [], costOf(version));

      const own = (automaton.finish.get(0) ?? Infinity) + 1;
      if (Number.isFinite(own) && own < (size.get(key) ?? Infinity) && parent !== "document") {
        size.set(key, own);
        changed = true;
      }
    }
  }

  return size;
};

/**
 * Gather the root element kinds the document node admits in each version, each with a valid
 * subtree.
 *
 * @param children - The candidates, by (version, parent).
 * @param size - The sizes, by (version, kind).
 * @returns The roots, by version.
 */
const rootsOf = (
  children: ReadonlyMap<string, readonly Candidate[]>,
  size: ReadonlyMap<string, number>,
): ReadonlyMap<string, Arr.NonEmptyReadonlyArray<ElementKind<Composed>>> => {
  const roots = new Map<string, ElementKind<Composed>[]>();
  for (const [key, candidates] of children) {
    const [version = "", parent = ""] = key.split(" ");
    for (const candidate of parent === "document" ? candidates : []) {
      if (candidate.class === "element" && size.has(keyOf(version, candidate.kind))) {
        pushAt(roots, version, candidate.kind);
      }
    }
  }

  return new Map(
    [...roots].flatMap(([version, kinds]) =>
      Arr.isReadonlyArrayNonEmpty(kinds) ? [[version, kinds] as const] : [],
    ),
  );
};

/**
 * The open classes, the attribute name handles that name no one attribute.
 */
const openHandles: ReadonlySet<string> = new Set(openClasses);

/**
 * Test whether an attribute name handle is an open class.
 *
 * @param name - An `AttributeName` handle.
 * @returns Whether it is one of {@link openClasses}.
 */
const isOpenClass = (name: string): name is OpenClass => openHandles.has(name);

/**
 * Gather each (version, kind)'s closed attribute names and open classes.
 *
 * @param grammar - The composed grammar.
 * @returns The closed names and the open classes, by (version, kind).
 */
const attributeIndexOf = (
  grammar: ComposedGrammar,
): Pick<Index, "closed" | "governors" | "open"> => {
  const closed = new Map<string, ClosedName<Composed>[]>();
  const open = new Map<string, Set<OpenClass>>();
  const add = (key: string, name: string) => {
    if (isOpenClass(name)) {
      open.set(key, (open.get(key) ?? new Set<OpenClass>()).add(name));
    } else {
      pushAt(closed, key, name);
    }
  };
  for (const { kind, name, version } of grammar.attributes.admission.rows) {
    add(keyOf(version, kind), name);
  }

  const keyOfGovernor = new Map(
    grammar.attributes.governor.rows.map(
      ({ governor, governs, kind, version }) =>
        [`${version} ${governor}`, `${keyOf(version, kind)} ${governs}`] as const,
    ),
  );
  for (const { governor, name, version } of grammar.attributes.governed.rows) {
    for (const key of Option.toArray(
      Option.fromNullishOr(keyOfGovernor.get(`${version} ${governor}`)),
    )) {
      add(key, name);
    }
  }

  return { closed, governors: new Set(keyOfGovernor.values()), open };
};

/**
 * Compute how far below each (version, kind) each child class can first appear, up to the
 * deepest bound.
 *
 * @param children - The candidates, by (version, parent).
 * @returns The reach, by (version, kind).
 */
const reachOf = (
  children: ReadonlyMap<string, readonly Candidate[]>,
): ReadonlyMap<string, ReadonlyMap<ChildClass, number>> => {
  const reach = new Map<string, Map<ChildClass, number>>();
  for (const [key, candidates] of children) {
    reach.set(key, new Map(candidates.map((candidate) => [candidate.class, 1] as const)));
  }

  for (let level = 2; level <= deepest; level += 1) {
    for (const [key, candidates] of children) {
      const [version = ""] = key.split(" ");
      const own = reach.get(key) ?? new Map<ChildClass, number>();
      for (const candidate of candidates) {
        const below =
          candidate.class === "element" ? reach.get(keyOf(version, candidate.kind)) : undefined;
        for (const [drawn, levels] of below ?? []) {
          if (levels === level - 1 && !own.has(drawn)) {
            own.set(drawn, level);
          }
        }
      }

      reach.set(key, own);
    }
  }

  return reach;
};

/**
 * A name an `xsi:type` is drawn with, and the governing type it gives the element: the type's
 * handle, or `none` for a name that resolves to no type, which a foreign element is laxly assessed
 * under.
 */
interface Typing {
  readonly governs: string;
  readonly name: ExpandedName;
}

/**
 * The name a foreign element's `xsi:type` is drawn with that names no type: in a bound namespace
 * no schema of the composition targets, so it resolves and names nothing, and the element stays
 * laxly assessed (spec reading 60).
 */
const unknownType: Typing = { governs: none, name: { local: "NoSuchType", namespace: "urn:w" } };

/**
 * Read a governing type's handle back as the name an `xsi:type` writes it with.
 *
 * @param governs - The type's `TypeName` handle, `{namespace}local`.
 * @returns The typing, none for a type in no namespace, whose QName would need the default
 *   namespace undeclared.
 */
const typingOf = (governs: string): Option.Option<Typing> => {
  const close = governs.indexOf("}");

  return governs.startsWith("{") && close > 1
    ? Option.some({
        governs,
        name: { local: governs.slice(close + 1), namespace: governs.slice(1, close) },
      })
    : Option.none();
};

/**
 * Key an element's attributes by its governor where one governs it, else by its kind.
 *
 * @param index - The index.
 * @param version - The version.
 * @param kind - The element's kind.
 * @param governs - Its governing type.
 * @returns The key of its closed names and open classes.
 */
const attributeKeyOf = (
  index: Pick<Index, "governors">,
  version: string,
  kind: string,
  governs: string,
): string => {
  const governed = `${keyOf(version, kind)} ${governs}`;

  return index.governors.has(governed) ? governed : keyOf(version, kind);
};

/**
 * Gather what the generator reads of a grammar, once per grammar.
 *
 * @param grammar - The composed grammar.
 * @returns Its index.
 */
/**
 * Read each (version, element kind)'s declared type and the named types its `xsi:type` may name
 * from `XsiType`, the type's handle `{namespace}local` read back as its name; a type in no
 * namespace is left out, since its QName would need the default namespace undeclared.
 *
 * @param grammar - The composed grammar.
 * @returns The types by version and kind.
 */
const governingOf = (grammar: ComposedGrammar): Index["governing"] => {
  const named = new Map<string, Typing[]>();
  for (const { kind, type, version } of grammar.xsi.xsiType.rows) {
    for (const typing of Option.toArray(typingOf(type))) {
      pushAt(named, keyOf(version, kind), typing);
    }
  }

  // A built-in is in every document's schema set, so it governs a foreign element wherever one
  // stands (`typeAvailable`); a type of a vocabulary does only where its set is the
  // document's, which the generator does not track.
  for (const version of grammar.kinds.versions.handles) {
    for (const kind of Object.values(foreignKinds)) {
      const key = keyOf(version, kind);
      for (const typing of Option.toArray(typingOf(`{${xsNamespace}}anyType`))) {
        pushAt(named, key, typing);
      }

      pushAt(named, key, unknownType);
    }
  }

  for (const { governs, kind, version } of grammar.attributes.governor.rows) {
    if (isForeignKind(kind) && governs.startsWith(`{${xsNamespace}}`)) {
      for (const typing of Option.toArray(typingOf(governs))) {
        pushAt(named, keyOf(version, kind), typing);
      }
    }
  }

  return new Map(
    grammar.kinds.versions.handles.flatMap((version) =>
      grammar.kinds.isElement.rows.map(({ kind }) => {
        const key = keyOf(version, kind);

        return [
          key,
          { declared: grammar.xsi.declaredType(version, kind), named: named.get(key) ?? [] },
        ] as const;
      }),
    ),
  );
};

/**
 * The prefix a drawn `xsi:type` writes its type's namespace with, which no other drawn name uses.
 */
const typePrefix = "xsitype";

/**
 * Whether a closed handle is XML Schema's `xsi:type`, which the layer admits on every element.
 *
 * @param handle - The handle.
 * @returns Whether it is `xsi:type`.
 */
const isXsiType = (handle: string): boolean => handle === "xsi:type";

const indexOf = (grammar: ComposedGrammar): Index => {
  const known = indexes.get(grammar);
  if (known !== undefined) {
    return known;
  }

  const children = childrenOf(grammar);
  const automata = automataOf(grammar);
  const size = sizesOf(automata, children);
  const foreign = new Map<string, readonly ExpandedName[]>();
  const index: Index = {
    automata,
    children,
    ...attributeIndexOf(grammar),
    foreign: (version, parent, around, foreignKind) => {
      const key = `${keyOf(version, parent)} ${foreignKind} ${around}`;
      const cached =
        foreign.get(key) ??
        foreignPoolOf(around, foreignKind).filter(
          ({ local, namespace }) =>
            !Option.exists(grammar.kinds.resolve(namespace, local, parent), (child) =>
              Option.isSome(grammar.admission.lookup({ child, parent, version })),
            ),
        );
      foreign.set(key, cached);

      return Arr.isReadonlyArrayNonEmpty(cached) ? Option.some(cached) : Option.none();
    },
    governing: governingOf(grammar),
    names: new Map(
      grammar.kinds.elementName.rows.map(({ kind, local, namespace }) => [
        kind,
        { local, namespace },
      ]),
    ),
    reach: reachOf(children),
    roots: rootsOf(children, size),
    size,
  };
  indexes.set(grammar, index);

  return index;
};

/**
 * Join drawn pieces of text.
 *
 * @param pieces - The pieces.
 * @param size - How many to draw.
 * @returns The text.
 */
const joined = (
  pieces: Arr.NonEmptyReadonlyArray<string>,
  size: { readonly max: number; readonly min: number },
): Gen<string> => string(element(pieces), size);

/**
 * The pieces character data is drawn from: markup characters, a CDATA end, non-ASCII text, and each
 * whitespace character, the carriage return among them.
 */
const textPieces = ["t", "a b", "<", "&", ">", "]]>", "é", "😀", "\r", "\t", "\n", " "] as const;

/**
 * The pieces whitespace is drawn from.
 */
const whitespacePieces = [" ", "\t", "\n", "\r"] as const;

/**
 * A run of text: at least one character that is not whitespace, between drawn pieces.
 */
const text: Gen<string> = (source) =>
  `${source.draw(joined(textPieces, { max: 2, min: 0 }))}${source.draw(element(["t", "é", "<", "&"]))}${source.draw(joined(textPieces, { max: 2, min: 0 }))}`;

/**
 * A run of whitespace.
 */
const whitespace: Gen<string> = joined(whitespacePieces, { max: 3, min: 1 });

/**
 * A comment's text: no `--` and no final `-`, since every dash is followed by a letter.
 */
const commentText: Gen<string> = joined(["c", " ", "-c", "é", "<", "&", ">"], { max: 3, min: 0 });

/**
 * A processing instruction's data: empty, or a first character that is not whitespace and pieces
 * after it, with no `?>`, since every question mark is followed by a letter.
 */
const piData: Gen<string> = weighted([
  [1, constant("")],
  [
    3,
    (source) =>
      `${source.draw(element(["d", "é", ">", "?d"]))}${source.draw(joined([" ", "d", "?d", ">"], { max: 2, min: 0 }))}`,
  ],
]);

/**
 * The names of the entities an unexpanded reference names, none of XML's predefined five.
 */
const entityNames = ["e", "ent", "x1"] as const;

/**
 * A piece of an attribute's lexical form: text, or an unexpanded entity reference by name.
 */
interface Piece {
  readonly entity: Option.Option<string>;
  readonly text: string;
}

/**
 * The text pieces an attribute's lexical form is drawn from: markup and quote characters, a CDATA
 * end, non-ASCII text and each whitespace character, which a reader's normalization would rewrite
 * were they not written as references.
 */
const lexicalPieces = ["v", " ", "a b", "<", "&", '"', "'", "\t", "\n", "\r", "é", "]]>"] as const;

/**
 * A piece of plain text of an attribute's lexical form.
 */
const plain: Gen<Piece> = (source) => ({
  entity: Option.none(),
  text: source.draw(element(lexicalPieces)),
});

/**
 * A piece of an attribute's lexical form that is an unexpanded entity reference.
 */
const reference: Gen<Piece> = (source) => {
  const name = source.draw(element(entityNames));

  return { entity: Option.some(name), text: `&${name};` };
};

/**
 * An attribute's lexical form and the unexpanded entity references in it, drawn as pieces.
 *
 * @param references - Whether the document may hold unexpanded references.
 * @returns The lexical form and its references in offset order.
 */
const lexicalOf =
  (
    references: boolean,
  ): Gen<{ readonly lexical: string; readonly references: readonly XdmAttributeReference[] }> =>
  (source) => {
    const pieces = source.draw(
      array(
        references
          ? weighted([
              [5, plain],
              [1, reference],
            ])
          : plain,
        { max: 4, min: 0 },
      ),
    );
    let lexical = "";
    const found: XdmAttributeReference[] = [];
    for (const piece of pieces) {
      for (const name of Option.toArray(piece.entity)) {
        found.push({ name, offset: lexical.length });
      }

      lexical += piece.text;
    }

    return { lexical, references: found };
  };

/**
 * The local names a `no-namespace` attribute is drawn with: names no kind is likely to admit, and
 * closed spellings, which are `no-namespace` where the element's kind does not admit them.
 */
const unqualifiedLocals = ["zz", "lax-a", "title", "label", "size"] as const;

/**
 * The local names a `data-*` attribute is drawn with: four, so one element may carry several names
 * of the class.
 */
const dataLocals = ["data-x", "data-y.z", "data-q_1", "data-a-b"] as const;

/**
 * The foreign attribute names drawn: each namespace with its own prefix, so no prefix is ever
 * bound twice on one element.
 */
const foreignAttributes = [
  { local: "a", prefix: "x", uri: "urn:x" },
  { local: "b", prefix: "x", uri: "urn:x" },
  { local: "a", prefix: "y", uri: "urn:y" },
] as const;

/**
 * The prefixes an element's own name is drawn with, beside none.
 */
const elementPrefixes = ["", "a", "b"] as const;

/**
 * The declaration the generator adds beside those a name needs, when the swarm draws one.
 */
const extraDeclaration: XdmNamespace = { prefix: "n", uri: "urn:n" };

/**
 * The prefixes in scope at an element, and the namespace each is bound to; the empty prefix is the
 * default namespace, `xml` bound without a declaration.
 */
type Scope = ReadonlyMap<string, string>;

/**
 * The scope above the root element.
 */
const topScope: Scope = new Map([
  ["", ""],
  ["xml", xmlNamespace],
]);

/**
 * The bounds of one case, drawn per case: the most attributes an element carries, the deepest an
 * element sits, the most children a family holds, and the most nodes the tree holds.
 */
export interface Bounds {
  readonly attributes: number;
  /**
   * The most nodes the tree holds below the document node, beyond which no family grows.
   */
  readonly nodes: number;
  readonly depth: number;
  readonly width: number;
}

/**
 * The context one case's nodes are drawn in: the grammar's index, the case's swarm, bounds and
 * version, whether entity references may occur, and the model being written.
 */
interface Context {
  readonly bounds: Bounds;
  /**
   * The nodes the case may still place, which no family slot is drawn past.
   */
  readonly budget: { left: number };
  readonly index: Index;
  readonly model: Types.Mutable<Placed>[];
  readonly references: boolean;
  readonly swarm: Swarm<XdmFeature>;
  readonly version: Composed["version"];
}

/**
 * Record a node in the model, in document order, over the interval of itself alone, which an
 * element's {@link close} grows to its subtree's.
 *
 * @param context - The case.
 * @param placed - The node's parent, slot and kind.
 * @returns The node's model entry, whose `start` is its number.
 */
const place = (
  context: Context,
  placed: Pick<Placed, "at" | "kind" | "parent">,
): Types.Mutable<Placed> => {
  const start = context.model.length;
  const entry = { ...placed, end: start + 1, start };
  context.budget.left -= 1;
  context.model.push(entry);

  return entry;
};

/**
 * Close an element's subtree in the model: its interval ends at the number of nodes placed so far.
 *
 * @param context - The case.
 * @param entry - The element's model entry.
 */
const close = (context: Context, entry: Types.Mutable<Placed>): void => {
  entry.end = context.model.length;
};

/**
 * Draw an element's namespace declarations and prefix: the declaration its own name needs where the
 * scope does not bind its prefix to its namespace, the ones its attributes' prefixes need, and,
 * where the swarm draws one, a declaration nothing needs.
 *
 * @param context - The case.
 * @param scope - The scope the element is in.
 * @param namespace - The element's namespace.
 * @param needed - The prefixed attribute namespaces the element carries, each with its prefix.
 * @returns A generator of its prefix, its declarations and the scope below it.
 */
const declarationsOf =
  (
    context: Context,
    scope: Scope,
    namespace: string,
    needed: readonly XdmNamespace[],
  ): Gen<{
    readonly namespaces: readonly XdmNamespace[];
    readonly prefix: string;
    readonly scope: Scope;
  }> =>
  (source) => {
    const prefix =
      namespace === "" || !source.draw(keep(context.swarm, "namespace"))
        ? ""
        : source.draw(element(elementPrefixes));
    const declarations: XdmNamespace[] = [];
    const bind = ({ prefix: bound, uri }: XdmNamespace): void => {
      if (scope.get(bound) !== uri && !declarations.some((written) => written.prefix === bound)) {
        declarations.push({ prefix: bound, uri });
      }
    };
    bind({ prefix, uri: namespace });
    for (const declaration of needed) {
      bind(declaration);
    }

    if (source.draw(keep(context.swarm, "namespace"))) {
      bind(extraDeclaration);
    }

    const ordered = source.draw(
      shuffled(declarations, { max: declarations.length, min: declarations.length }),
    );

    return {
      namespaces: ordered,
      prefix,
      scope: new Map([...scope, ...ordered.map(({ prefix: bound, uri }) => [bound, uri] as const)]),
    };
  };

/**
 * The prefix an `own-namespace` attribute is drawn with, bound to its element's namespace: no
 * element prefix and no foreign attribute's, so it never rebinds one.
 */
const ownPrefix = "o";

/**
 * The open names of one class an element may carry: no-namespace names that are no closed name
 * its kind admits, `data-` names among them only on a foreign element, whose markup is no HTML;
 * `data-*` names; names in the element's own namespace, where it has one; and names in a namespace
 * of their own.
 *
 * @param name - The class.
 * @param kind - The element's kind.
 * @param namespace - The element's namespace.
 * @param spelled - The closed names its kind admits, which no open name spells.
 * @returns The names.
 */
const openNamesOf = (
  name: OpenClass,
  kind: Kind,
  namespace: string,
  spelled: ReadonlySet<string>,
): readonly OpenName[] => {
  switch (name) {
    case "no-namespace": {
      return [
        ...unqualifiedLocals.filter(
          (local) => !spelled.has(local) && (isForeignKind(kind) || !local.startsWith("data-")),
        ),
        ...(isForeignKind(kind) ? dataLocals : []),
      ].map((local) => ({ _tag: "no-namespace", local }));
    }
    case "data-*": {
      return dataLocals.map((local) => ({ _tag: "data-*", local }));
    }
    case "own-namespace": {
      return namespace === ""
        ? []
        : unqualifiedLocals.map((local) => ({
            _tag: "own-namespace",
            local,
            prefix: ownPrefix,
            uri: namespace,
          }));
    }
    case "foreign": {
      return foreignAttributes.map((attribute) => ({ _tag: "foreign", ...attribute }));
    }
    default: {
      return name satisfies never;
    }
  }
};

/**
 * Draw an element's attributes: first its governing type, then a subset of the closed names the
 * element admits under it and open names under the classes it admits there, up to the case's
 * attribute bound or two where the bound is lower, two of them of one class where the swarm draws
 * `repeatedOpenClass`, each name once, in a drawn order. An `own-namespace` name is in the
 * element's namespace under its own prefix, so an element in no namespace draws none.
 *
 * The governing type is the declared one, or the type a drawn `xsi:type` names, which then governs
 * the element: its attributes are its governor's where the type is one (spec reading 75), and a
 * foreign element's `xsi:type` is drawn among {@link Index.governing}'s names, so it always
 * resolves, as shred reads it (spec readings 60 and 74).
 *
 * @param context - The case.
 * @param kind - The element's kind, a foreign kind for a foreign element.
 * @param namespace - The element's namespace.
 * @returns A generator of the attributes, the governing type and the prefixed namespaces they need
 *   declared.
 */
const attributesOf =
  (
    context: Context,
    kind: Kind,
    namespace: string,
  ): Gen<{
    readonly attributes: readonly XdmAttribute<Composed>[];
    readonly governs: string;
    readonly needed: readonly XdmNamespace[];
  }> =>
  (source) => {
    const governing = context.index.governing.get(keyOf(context.version, kind));
    const drawn: XdmAttribute<Composed>[] = [];
    const needed: XdmNamespace[] = [];
    const bound = context.bounds.attributes;
    const keeping = source.draw(keep(context.swarm, "attribute"));
    const named = governing?.named ?? [];
    const typed =
      keeping && Arr.isReadonlyArrayNonEmpty(named) && source.draw(element([false, true]))
        ? Option.some(source.draw(element(named)))
        : Option.none<Typing>();
    const governs = Option.match(typed, {
      onNone: () => governing?.declared ?? none,
      onSome: (typing) => typing.governs,
    });
    const key = attributeKeyOf(context.index, context.version, kind, governs);
    const admitted = context.index.closed.get(key) ?? [];
    const closed = admitted.filter((handle) => !isXsiType(handle));
    const open = context.index.open.get(key) ?? new Set<OpenClass>();
    const spelled = new Set<string>(closed);
    // Every element admits `xsi:type` (spec reading 47), under its governor as under its kind.
    const xsiType = Option.fromNullishOr(admitted.find((handle) => isXsiType(handle)));
    for (const [{ name }, handle] of Option.toArray(
      Option.zipWith(typed, xsiType, (typing, admittedName) => [typing, admittedName] as const),
    )) {
      needed.push(
        { prefix: "xsi", uri: xsiNamespace },
        { prefix: typePrefix, uri: name.namespace },
      );
      drawn.push({
        lexical: `${typePrefix}:${name.local}`,
        name: { _tag: "closed", handle },
        references: [],
      });
    }

    if (keeping) {
      const chosen = source.draw(shuffled(closed, { max: Math.min(bound, closed.length), min: 0 }));
      for (const handle of chosen) {
        if (handle.startsWith("xsi:")) {
          needed.push({ prefix: "xsi", uri: xsiNamespace });
        }

        drawn.push({
          name: { _tag: "closed", handle },
          ...source.draw(lexicalOf(context.references)),
        });
      }
    }

    if (source.draw(keep(context.swarm, "openName"))) {
      const classes = [...open].map((name) => openNamesOf(name, kind, namespace, spelled));
      const names = classes.flat();
      const most = Math.min(Math.max(2, bound), names.length);
      // Two names of one class are built where the swarm draws them, never left to chance: a class
      // that holds two names gives two, which share its one position.
      const sharing = classes.filter((held) => held.length >= 2);
      const repeated =
        Arr.isReadonlyArrayNonEmpty(sharing) &&
        source.draw(keep(context.swarm, "repeatedOpenClass"))
          ? source.draw(shuffled(source.draw(element(sharing)), { max: 2, min: 2 }))
          : [];
      const rest = names.filter((name) => !repeated.includes(name));
      const chosen = [
        ...repeated,
        ...source.draw(shuffled(rest, { max: Math.max(0, most - repeated.length), min: 0 })),
      ];
      for (const name of chosen) {
        if (name._tag === "foreign") {
          needed.push({ prefix: name.prefix, uri: name.uri });
        } else if (name._tag === "own-namespace") {
          needed.push({ prefix: name.prefix, uri: name.uri });
        }

        drawn.push({ name, ...source.draw(lexicalOf(context.references)) });
      }
    }

    return {
      attributes: source.draw(shuffled(drawn, { max: drawn.length, min: drawn.length })),
      governs,
      needed,
    };
  };

/**
 * The targets a processing instruction is drawn with, none of them `xml` in any case.
 */
const piTargets = ["t", "p-q", "x1"] as const;

/**
 * Draw a node of character data of a class.
 *
 * @param drawn - The class.
 * @returns A generator of the node.
 */
const characterOf = (drawn: Exclude<ChildClass, "element" | "wildcard">): Gen<XdmCharacter> => {
  switch (drawn) {
    case "text": {
      return (source) => ({ _tag: "text", value: source.draw(text) });
    }
    case "ws": {
      return (source) => ({ _tag: "ws", value: source.draw(whitespace) });
    }
    case "comment": {
      return (source) => ({ _tag: "comment", value: source.draw(commentText) });
    }
    case "pi": {
      return (source) => ({
        _tag: "pi",
        data: source.draw(piData),
        target: source.draw(element(piTargets)),
      });
    }
    case "entityRef": {
      return (source) => ({ _tag: "entityRef", name: source.draw(element(entityNames)) });
    }
    default: {
      return drawn satisfies never;
    }
  }
};

/**
 * The child classes in the order a swarm choice prefers them, the floor first.
 */
const childClasses = [
  "element",
  "wildcard",
  "text",
  "ws",
  "comment",
  "pi",
  "entityRef",
] as const satisfies readonly ChildClass[];

/**
 * Whether a candidate may take a family's next slot by the case's own bounds: an element sits only
 * within the depth bound, an entity reference only where the document may hold one, and no run of
 * character data follows another. The content model's own say is {@link nextOf}'s.
 *
 * @param context - The case.
 * @param candidate - The candidate.
 * @param depth - The depth of the family's children.
 * @param previous - The class of the child before the slot, none at the first.
 * @returns Whether it may.
 */
const usable = (
  context: Context,
  candidate: Candidate,
  depth: number,
  previous: Option.Option<ChildClass>,
): boolean => {
  const run = (drawn: ChildClass): boolean => drawn === "text" || drawn === "ws";
  switch (candidate.class) {
    case "element":
    case "wildcard": {
      return depth <= context.bounds.depth;
    }
    case "entityRef": {
      return context.references;
    }
    case "text":
    case "ws": {
      return !Option.exists(previous, run);
    }
    case "comment":
    case "pi": {
      return true;
    }
    default: {
      return candidate satisfies never;
    }
  }
};

/**
 * A move a family can make at its next slot: a candidate, and the state it takes the family to.
 */
interface Move {
  readonly candidate: Candidate;
  readonly next: number;
}

/**
 * The child classes whose reach steers the choice of an element: the ones few kinds admit, which
 * a uniform choice of element would seldom lead to.
 */
const steered = ["wildcard", "text", "entityRef"] as const satisfies readonly ChildClass[];

/**
 * The steered classes the swarm turns on that a candidate's subtree can still reach: a foreign
 * element within the depth bound, and character data one level below it.
 *
 * @param context - The case.
 * @param candidate - The candidate.
 * @param depth - The depth it would sit at.
 * @returns The classes.
 */
const reachedBy = (
  context: Context,
  candidate: Candidate,
  depth: number,
): readonly ChildClass[] => {
  if (candidate.class !== "element") {
    return [];
  }

  const below =
    context.index.reach.get(keyOf(context.version, candidate.kind)) ??
    new Map<ChildClass, number>();

  return steered.filter(
    (drawn) =>
      weightOf(context.swarm, drawn) > 0 &&
      Option.exists(
        Option.fromNullishOr(below.get(drawn)),
        (levels) => depth + levels <= context.bounds.depth + (drawn === "wildcard" ? 0 : 1),
      ),
  );
};

/**
 * Draw a candidate of one class, an element weighted by the steered classes the swarm turns on that
 * its subtree can still reach: one share for every candidate, and 40 more for each such class. The
 * weights are an explicit distribution (doctrine rule 7), so the swarm's rare features are reached
 * in small trees.
 *
 * @param context - The case.
 * @param moves - The usable moves of the drawn class.
 * @param depth - The depth the candidate would sit at.
 * @returns A generator of the move.
 */
const weightedByReach = (
  context: Context,
  moves: Arr.NonEmptyReadonlyArray<Move>,
  depth: number,
): Gen<Move> =>
  proportional(
    pipe(
      moves,
      Arr.map(
        (move) =>
          [1 + 40 * reachedBy(context, move.candidate, depth).length, constant(move)] as const,
      ),
    ),
  );

/**
 * Draw the class of a family's next child among those a usable candidate offers: each as often as
 * its swarm weight, 24 more times for a steered class the swarm turns on, and an element 24 more
 * times when one of its candidates leads to such a class the slot does not offer itself. Elements
 * are a tree's spine, so they are never off: at weight 0 an element still draws once, which also
 * guards the swarm's all-off draw.
 *
 * @param context - The case.
 * @param offered - The classes a usable candidate offers, in {@link childClasses} order.
 * @param open - The usable candidates.
 * @param depth - The depth of the family's children.
 * @returns A generator of the class.
 */
const classOf = (
  context: Context,
  offered: Arr.NonEmptyReadonlyArray<ChildClass>,
  open: readonly Candidate[],
  depth: number,
): Gen<ChildClass> => {
  const direct: readonly ChildClass[] = steered.filter(
    (drawn) => weightOf(context.swarm, drawn) > 0 && offered.some((offer) => offer === drawn),
  );
  const leads = open.some((candidate) =>
    reachedBy(context, candidate, depth).some((drawn) => !direct.includes(drawn)),
  );
  const weightOfClass = (drawn: ChildClass): number => {
    const own = weightOf(context.swarm, drawn);
    const boosted = direct.some((steering) => steering === drawn) || (drawn === "element" && leads);

    return (drawn === "element" ? Math.max(1, own) : own) + (boosted ? 24 : 0);
  };

  return proportional(
    pipe(
      offered,
      Arr.map((drawn) => [weightOfClass(drawn), constant(drawn)] as const),
    ),
  );
};

/**
 * List the moves a family can make from a state: each candidate with the state it takes the family
 * to, where that state can still end.
 *
 * @param automaton - The family's content automaton.
 * @param candidates - The candidates with a valid subtree.
 * @param from - The family's state.
 * @returns The moves.
 */
const movesFrom = (
  automaton: Automaton,
  candidates: readonly Candidate[],
  from: number,
): readonly Move[] =>
  candidates.flatMap((candidate) =>
    Option.toArray(nextOf(automaton, candidate, from))
      .filter((next) => automaton.finish.has(next))
      .map((next) => ({ candidate, next })),
  );

/**
 * Keep the moves the case's own bounds let take the next slot ({@link usable}).
 *
 * @param context - The case.
 * @param moves - The moves.
 * @param depth - The depth of the family's children.
 * @param previous - The class of the child before the slot, none at the first.
 * @returns The usable moves.
 */
const usableMoves = (
  context: Context,
  moves: readonly Move[],
  depth: number,
  previous: Option.Option<ChildClass>,
): readonly Move[] => moves.filter(({ candidate }) => usable(context, candidate, depth, previous));

/**
 * Draw a family's children slot by slot through its owner's content automaton: at each slot a class
 * the swarm weighs among the moves `Follow` admits from the family's state, then a move of that
 * class, so every family is in an order its content model admits. Once its drawn width or the
 * case's node budget is spent, or when the family is being completed, it takes only moves on a
 * cheapest way to a `Last` state, so it ends where `Last` lets it; no move leaves a state that
 * cannot end. A family one of whose candidates leads to a steered class the swarm turns on holds at
 * least one child.
 *
 * @param context - The case.
 * @param owner - The (version, kind) key of the family's owner.
 * @param candidates - The kinds the owner admits.
 * @param depth - The depth of the family's children.
 * @param completing - Whether the family holds only what its content model requires.
 * @param child - Draws a child of a candidate at a slot, placing it in the model, completed when the
 *   family is finishing.
 * @returns A generator of the children.
 */
const familyOf =
  <Child>(
    context: Context,
    owner: string,
    candidates: readonly Candidate[],
    depth: number,
    completing: boolean,
    child: (candidate: Candidate, at: number, finishing: boolean) => Gen<Child>,
  ): Gen<readonly Child[]> =>
  (source) => {
    const automaton = context.index.automata.get(owner);
    const children: Child[] = [];
    if (automaton === undefined) {
      return children;
    }

    const valid = (candidate: Candidate): boolean =>
      (candidate.class !== "element" && candidate.class !== "wildcard") ||
      context.index.size.has(keyOf(context.version, kindOfDrawn(candidate)));
    const leads = candidates.some((candidate) => reachedBy(context, candidate, depth).length > 0);
    const count = completing ? 0 : source.draw(int(leads ? 1 : 0, context.bounds.width));
    let state = 0;
    let previous: Option.Option<ChildClass> = Option.none();
    for (let at = 0; ; at += 1) {
      const finishing = completing || at >= count || context.budget.left <= 0;
      const left = automaton.finish.get(state) ?? Infinity;
      if (finishing && automaton.last.has(state)) {
        break;
      }

      const moves = movesFrom(automaton, candidates.filter(valid), state);
      const cost = ({ candidate, next }: Move): number =>
        (context.index.size.get(keyOf(context.version, kindOfDrawn(candidate))) ?? Infinity) +
        (automaton.finish.get(next) ?? Infinity);
      const open = finishing
        ? moves.filter(
            (move) =>
              (move.candidate.class === "element" || move.candidate.class === "wildcard") &&
              cost(move) === left,
          )
        : usableMoves(context, moves, depth, previous);
      const offered = childClasses.filter((drawn) =>
        open.some(({ candidate }) => candidate.class === drawn),
      );
      if (!Arr.isReadonlyArrayNonEmpty(offered)) {
        break;
      }

      const drawn = finishing
        ? Arr.headNonEmpty(offered)
        : source.draw(
            classOf(
              context,
              offered,
              open.map(({ candidate }) => candidate),
              depth,
            ),
          );
      const ofClass = open.filter(({ candidate }) => candidate.class === drawn);
      if (!Arr.isReadonlyArrayNonEmpty(ofClass)) {
        break;
      }

      const move = finishing
        ? source.draw(element(ofClass))
        : source.draw(weightedByReach(context, ofClass, depth));
      state = move.next;
      previous = Option.some(drawn);
      children.push(source.draw(child(move.candidate, at, finishing)));
    }

    return children;
  };

/**
 * Where a node is drawn: the scope it is in, its parent's number, its slot and its depth.
 */
interface Site {
  readonly at: number;
  readonly depth: number;
  readonly parent: number;
  readonly scope: Scope;
}

/**
 * Draw a character-data child at a slot, placing it in the model.
 *
 * @param context - The case.
 * @param drawn - Its class.
 * @param site - Where it is drawn.
 * @returns A generator of the node.
 */
const placedCharacter =
  (
    context: Context,
    drawn: Exclude<ChildClass, "element" | "wildcard">,
    site: Site,
  ): Gen<XdmCharacter> =>
  (source) => {
    place(context, { at: site.at, kind: drawn, parent: site.parent });

    return source.draw(characterOf(drawn));
  };

/**
 * The element a family is drawn under: its kind, the namespace its children's classes are read
 * against, its model number, the scope below it, and whether a simple type governs it.
 */
interface Owner {
  readonly kind: ElementKind<Composed> | ForeignKind;
  readonly namespace: string;
  readonly number: number;
  readonly scope: Scope;
  /**
   * Whether a simple type governs the element: a foreign element whose `xsi:type` names one of its
   * kind's governors, which holds character data and no element child (XML Schema 1.0 Part 1
   * §3.3.4, Element Locally Valid (Type), clause 3.1.2; spec reading 60), as the law "Foreign
   * simple content" states.
   */
  readonly simple: boolean;
}

/**
 * Draw an element's children: each a kind it admits, a foreign element of a class it admits under
 * a name of that class it leaves foreign, or character data, the same under an element of a kind
 * and under a foreign one, but character data alone under an element a simple type governs.
 *
 * @param context - The case.
 * @param owner - The element.
 * @param depth - The element's depth.
 * @param completing - Whether its family holds only what its content model requires.
 * @returns A generator of the children.
 */
const familyUnder = (
  context: Context,
  owner: Owner,
  depth: number,
  completing: boolean,
): Gen<readonly XdmChild<Composed>[]> => {
  const key = keyOf(context.version, owner.kind);
  const poolOf = (kind: ForeignKind) =>
    context.index.foreign(context.version, owner.kind, owner.namespace, kind);

  return familyOf<XdmChild<Composed>>(
    context,
    key,
    (context.index.children.get(key) ?? []).filter((candidate) =>
      owner.simple
        ? candidate.class !== "element" && candidate.class !== "wildcard"
        : candidate.class !== "wildcard" || Option.isSome(poolOf(candidate.kind)),
    ),
    depth + 1,
    completing,
    (candidate, at, finishing): Gen<XdmChild<Composed>> => {
      const below = { at, depth: depth + 1, parent: owner.number, scope: owner.scope };
      switch (candidate.class) {
        case "element": {
          // oxlint-disable-next-line no-use-before-define -- an element's family and its subtree's draw each other: a kind's content holds foreign elements, and a foreign element's lax content holds globally declared kinds.
          return closedOf(context, candidate.kind, below, finishing);
        }
        case "wildcard": {
          const { kind } = candidate;
          const names = Option.getOrThrowWith(
            poolOf(kind),
            () => new Error(`The family kept a ${kind} candidate with no name to draw.`),
          );

          // oxlint-disable-next-line no-use-before-define -- as above: the family and the element draw each other.
          return foreignOf(context, kind, names, below, finishing);
        }
        case "text":
        case "ws":
        case "comment":
        case "pi":
        case "entityRef": {
          return placedCharacter(context, candidate.class, below);
        }
        default: {
          return candidate satisfies never;
        }
      }
    },
  );
};

/**
 * Draw a foreign element of a class and its subtree, whose children are drawn as any element's.
 *
 * @param context - The case.
 * @param kind - Its foreign kind.
 * @param names - The names of its class it may take.
 * @param site - Where it is drawn.
 * @param completing - Whether its family holds only what its content model requires.
 * @returns A generator of the element.
 */
const foreignOf =
  (
    context: Context,
    kind: ForeignKind,
    names: Arr.NonEmptyReadonlyArray<ExpandedName>,
    site: Site,
    completing: boolean,
  ): Gen<XdmForeignElement<Composed>> =>
  (source) => {
    const entry = place(context, { at: site.at, kind, parent: site.parent });
    const name = source.draw(element(names));
    const { attributes, governs, needed } = source.draw(
      attributesOf(context, kind, name.namespace),
    );
    const declared = source.draw(declarationsOf(context, site.scope, name.namespace, needed));
    const owner = {
      kind,
      namespace: name.namespace,
      number: entry.start,
      scope: declared.scope,
      simple: context.index.governors.has(`${keyOf(context.version, kind)} ${governs}`),
    };
    const children = source.draw(familyUnder(context, owner, site.depth, completing));
    close(context, entry);

    return {
      _tag: kind,
      attributes,
      children,
      governs,
      name,
      namespaces: declared.namespaces,
      prefix: declared.prefix,
    };
  };

/**
 * Draw an element of a kind and its subtree.
 *
 * @param context - The case.
 * @param kind - Its kind.
 * @param site - Where it is drawn.
 * @param completing - Whether its family holds only what its content model requires.
 * @returns A generator of the element.
 */
const closedOf =
  (
    context: Context,
    kind: ElementKind<Composed>,
    site: Site,
    completing: boolean,
  ): Gen<XdmClosedElement<Composed>> =>
  (source) => {
    const entry = place(context, { at: site.at, kind, parent: site.parent });
    const namespace = Option.match(Option.fromNullishOr(context.index.names.get(kind)), {
      onNone: () => "",
      onSome: (name) => name.namespace,
    });
    const { attributes, governs, needed } = source.draw(attributesOf(context, kind, namespace));
    const declared = source.draw(declarationsOf(context, site.scope, namespace, needed));
    const owner = { kind, namespace, number: entry.start, scope: declared.scope, simple: false };
    const children = source.draw(familyUnder(context, owner, site.depth, completing));
    close(context, entry);

    return {
      _tag: "element",
      attributes,
      children,
      governs,
      kind,
      namespaces: declared.namespaces,
      prefix: declared.prefix,
    };
  };

/**
 * Draw a prolog's or an epilog's node, a comment or a processing instruction, placing it in the
 * model under the document node.
 *
 * @param context - The case.
 * @param slot - Draws its slot under the document node.
 * @returns A generator of the node.
 */
const miscOf =
  (context: Context, slot: () => number): Gen<XdmMisc> =>
  (source) => {
    const drawn = source.draw(swarmChoice(context.swarm, ["comment", "pi"] as const));
    place(context, { at: slot(), kind: drawn, parent: 0 });

    return drawn === "comment"
      ? { _tag: "comment", value: source.draw(commentText) }
      : { _tag: "pi", data: source.draw(piData), target: source.draw(element(piTargets)) };
  };

/**
 * The doctype every generated document that holds one writes: an external subset, so the reader
 * keeps an undeclared entity's reference unexpanded.
 */
const doctypeText = '<!DOCTYPE root SYSTEM "root.dtd">';

/**
 * An XML declaration, or none.
 */
const declarationGen: Gen<Option.Option<XdmDeclaration>> = weighted([
  [1, constant(Option.none())],
  [
    2,
    (source) =>
      Option.some({
        encoding: source.draw(element([Option.none(), Option.some("UTF-8")])),
        standalone: source.draw(
          element([Option.none(), Option.some("no" as const), Option.some("yes" as const)]),
        ),
        version: "1.0",
      }),
  ],
]);

/**
 * A case's bounds: narrow trees most of the time and wider ones sometimes, mostly deep enough to
 * reach the kinds that sit two or three levels below a root, the wildcard hosts and the mixed
 * content among them.
 */
const boundsGen: Gen<Bounds> = (source) => ({
  attributes: source.draw(int(0, 4)),
  depth: source.draw(
    weighted([
      [1, int(1, 2)],
      [2, int(3, 5)],
      [1, int(6, deepest)],
    ]),
  ),
  nodes: source.draw(
    weighted([
      [3, int(1, 40)],
      [1, int(41, 200)],
    ]),
  ),
  width: source.draw(
    weighted([
      [2, int(1, 3)],
      [1, int(4, 8)],
    ]),
  ),
});

/**
 * Generate a valid document over a grammar, with its model and its swarm.
 *
 * @param grammar - The composed grammar.
 * @param without - The features every case's swarm leaves off, for a suite whose oracle cannot
 *   judge them, so the suite never draws what it would set aside: none by default.
 * @returns The generator.
 */
export const xdmDocument = (
  grammar: ComposedGrammar,
  without: ReadonlySet<XdmFeature> = new Set(),
): Gen<GeneratedXdm> => {
  const index = indexOf(grammar);
  const weighed = xdmFeatures.filter((feature) => !without.has(feature));
  const swarmGen: Gen<Swarm<XdmFeature>> = Arr.isReadonlyArrayNonEmpty(weighed)
    ? swarm(weighed)
    : constant({});

  return (source) => {
    const drawnSwarm = source.draw(swarmGen);
    const version = source.draw(element(schemaVersions));
    const declaration = source.draw(declarationGen);
    const doctype = source.draw(keep(drawnSwarm, "doctype"));
    const bounds = source.draw(boundsGen);
    const sentinel: Types.Mutable<Placed> = {
      at: 0,
      end: 1,
      kind: "document",
      parent: 0,
      start: 0,
    };
    const context: Context = {
      bounds,
      budget: { left: bounds.nodes },
      index,
      model: [sentinel],
      references:
        doctype &&
        !Option.exists(declaration, ({ standalone }) =>
          Option.exists(standalone, (value) => value === "yes"),
        ),
      swarm: drawnSwarm,
      version,
    };
    let slots = 0;
    const slot = (): number => {
      slots += 1;

      return slots - 1;
    };
    if (doctype) {
      place(context, { at: slot(), kind: "doctype", parent: 0 });
    }

    const prolog = source.draw(array(miscOf(context, slot), { max: 2, min: 0 }));
    const roots = Option.getOrThrowWith(
      Option.fromNullishOr(index.roots.get(version)),
      () => new Error(`The grammar admits no root element kind in ${version}.`),
    );
    const rootKind = source.draw(
      proportional(
        pipe(
          roots,
          Arr.map(
            (kind) =>
              [
                1 + 40 * reachedBy(context, { class: "element", kind, position: 0 }, 1).length,
                constant(kind),
              ] as const,
          ),
        ),
      ),
    );
    const root = source.draw(
      closedOf(context, rootKind, { at: slot(), depth: 1, parent: 0, scope: topScope }, false),
    );
    const epilog = source.draw(array(miscOf(context, slot), { max: 2, min: 0 }));
    close(context, sentinel);

    return {
      bounds,
      document: {
        _tag: "document",
        charset: "UTF-8",
        declaration,
        doctype: doctype ? Option.some(doctypeText) : Option.none(),
        epilog,
        exportCharset: "UTF-8",
        prolog,
        root,
        version,
      },
      model: context.model,
      swarm: drawnSwarm,
    };
  };
};

/**
 * The features a generated tree holds: each kind of node it holds, and closed attributes, open
 * names, two open names of one class on one element, and namespace declarations where it holds
 * any. A test notes them, so a search's coverage is stated in the generator's own terms.
 *
 * @param document - The tree.
 * @returns Its features, each once.
 */
export const featuresOf = (document: XdmDocument<Composed>): ReadonlySet<XdmFeature> => {
  const found = new Set<XdmFeature>(Option.isSome(document.doctype) ? ["doctype"] : []);
  const stack: (XdmChild<Composed> | XdmMisc)[] = [
    ...document.prolog,
    document.root,
    ...document.epilog,
  ];
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    switch (node._tag) {
      case "element":
      case "foreign-element":
      case "no-namespace-element":
      case "own-namespace-element": {
        found.add(node._tag === "element" ? "element" : "wildcard");
        if (node.namespaces.length > 0) {
          found.add("namespace");
        }

        for (const { name } of node.attributes) {
          found.add(name._tag === "closed" ? "attribute" : "openName");
        }

        const classes = node.attributes.flatMap(({ name }) =>
          name._tag === "closed" ? [] : [name._tag],
        );
        if (new Set(classes).size < classes.length) {
          found.add("repeatedOpenClass");
        }

        stack.push(...node.children);
        break;
      }
      case "text":
      case "ws":
      case "comment":
      case "pi":
      case "entityRef": {
        found.add(node._tag);
        break;
      }
      default: {
        return node satisfies never;
      }
    }
  }

  return found;
};

/**
 * A (parent kind, child kind) pair a tree holds, spelled `parent > child`: a family situation,
 * finer than the kinds of node, so a search's residual counts the admitted pairs it has not met.
 */
export type XdmFamily = `${string} > ${string}`;

/**
 * The (parent kind, child kind) pairs a generated tree holds, read off its model.
 *
 * @param model - The tree's model.
 * @returns Each pair once.
 */
export const familiesOf = (model: readonly Placed[]): ReadonlySet<XdmFamily> =>
  new Set(
    model.flatMap((placed, number): readonly XdmFamily[] => {
      // Spelled as strings, so the pair is no product of the kind roster with itself.
      const parent: string = model[placed.parent]?.kind ?? "";
      const child: string = placed.kind;

      return number === 0 ? [] : [`${parent} > ${child}`];
    }),
  );

/**
 * The accumulators a family's first slot copies from the empty fold, each at its identity in a
 * valid tree (fin.md §4.3): a first child's `was`, the content automaton's start, state 0, and its
 * `elementsWas`, no element; and a first attribute's `attrsWas`, no name.
 */
export const accumulators = ["was", "elementsWas", "attrsWas"] as const;

/**
 * One of {@link accumulators}.
 */
export type Accumulator = (typeof accumulators)[number];

/**
 * The copies of its parent a node's merged parent copy holds (trees.md §6): T0's `document`, the
 * `version`, and the parent's kind, start, ancestry, nearest interaction and that interaction's
 * kind.
 */
export const parentCopies = [
  "document",
  "version",
  "parentKind",
  "parentStart",
  "parentAncestry",
  "parentNearest",
  "parentNearestKind",
] as const;

/**
 * One of {@link parentCopies}.
 */
export type ParentCopy = (typeof parentCopies)[number];

/**
 * The copies of its owner an attribute row holds (AL1): the owner's kind, version and document.
 */
export const ownerCopies = ["kind", "version", "document"] as const;

/**
 * One of {@link ownerCopies}.
 */
export type OwnerCopy = (typeof ownerCopies)[number];

/**
 * The copies of its parent the document node holds as its own fields (N1): the ones the plan's
 * first laws left unpinned (the ancestry, found by Q2.03, and the nearest kind, by Q3.02).
 */
export const sentinelCopies = ["parentAncestry", "nearestKind"] as const;

/**
 * A named edit of a valid tree's rows, each with its own targets, by their numbers in document
 * order, or an attribute by its place among the attribute rows:
 *
 * - `gap`: the node and every later sibling move one slot on, leaving the node's slot empty;
 * - `duplicateSlot`: the node takes its predecessor's slot;
 * - `countOffByOne`: the node's children count is one too many;
 * - `secondParent`: the node gains a second row under another element, at that element's next slot
 *   and over the next start, every later interval moving one on to make room, so only its id is
 *   wrong;
 * - `startTaken`: the node starts where the node before it in document order starts;
 * - `secondRoot`: the node, not the document node, is its own parent at slot 0, as the root is;
 * - `cycle`: the node, an element and its parent's last child, moves to slot 0 of a childless element
 *   below it, so a chain of parents leads from it back to it;
 * - `wrongSize`: the node, which has no children, has an interval of two nodes, and every later
 *   interval moves one on to make room, so its size is the one interval that is wrong;
 * - `overlappingSiblings`: the node's predecessor ends one past the node's start;
 * - `gapBetweenSiblings`: the node's predecessor ends one before the node's start;
 * - `childOutsideParent`: the node ends one before its last child, which has children, ends;
 * - `orphan`: the node's parent is an id no row holds;
 * - `doctypeNotFirst`: the doctype moves from the document node's first slot to its last, over the
 *   last start, every node after it moving one back, so the rows are one tree with the doctype
 *   after the root element;
 * - `slotZeroAccumulator`: a first child copies an accumulator other than its identity, or a first
 *   attribute's `attrsWas` holds a position its element holds no name at, which every later
 *   attribute and the element's `attrs` then carry, as a fold from it would;
 * - `staleWas`: a node copies its predecessor's own predecessor copies, a fold stale by one slot;
 * - `parentCopy`: one field of the node's merged copy of its parent is not its parent's (T0's
 *   `document` among them), the parent's `start` only at a later slot, where no first-child start
 *   reads it;
 * - `ownerCopy`: one field of an attribute's copy of its owner is not its owner's;
 * - `repeatedName`: an attribute takes the closed name of an attribute before it on its element;
 * - `sentinelCopy`: the document node's copy of a parent field is not its own;
 * - `wrongClass`: the node, a foreign element, takes another class's kind, which its stored namespace
 *   contradicts: `foreign-element` becomes `no-namespace-element` and every other class
 *   `foreign-element`;
 * - `wrongAttributeClass`: an open-class attribute takes another class, which its stored namespace
 *   contradicts: `foreign` becomes `no-namespace` and every other class `foreign`.
 *
 * An edit of a node's interval moves the `parentStart` copies of the nodes whose parent it moves
 * with it, as the merged parent copy carries them, so it breaks the interval laws alone.
 */
export type Corruption =
  | { readonly _tag: "childOutsideParent"; readonly node: number }
  | { readonly _tag: "countOffByOne"; readonly node: number }
  | { readonly _tag: "cycle"; readonly node: number; readonly under: number }
  | { readonly _tag: "doctypeNotFirst"; readonly node: number }
  | { readonly _tag: "duplicateSlot"; readonly node: number }
  | { readonly _tag: "gap"; readonly node: number }
  | { readonly _tag: "gapBetweenSiblings"; readonly node: number }
  | { readonly _tag: "orphan"; readonly node: number }
  | { readonly _tag: "overlappingSiblings"; readonly node: number }
  | { readonly _tag: "ownerCopy"; readonly attribute: number; readonly field: OwnerCopy }
  | { readonly _tag: "parentCopy"; readonly field: ParentCopy; readonly node: number }
  | { readonly _tag: "repeatedName"; readonly attribute: number; readonly earlier: number }
  | { readonly _tag: "secondParent"; readonly node: number; readonly parent: number }
  | { readonly _tag: "secondRoot"; readonly node: number }
  | { readonly _tag: "sentinelCopy"; readonly field: (typeof sentinelCopies)[number] }
  | {
      readonly _tag: "slotZeroAccumulator";
      readonly field: Exclude<Accumulator, "attrsWas">;
      readonly node: number;
    }
  | { readonly _tag: "slotZeroAccumulator"; readonly attribute: number; readonly field: "attrsWas" }
  | { readonly _tag: "staleWas"; readonly node: number }
  | { readonly _tag: "startTaken"; readonly node: number }
  | { readonly _tag: "wrongAttributeClass"; readonly attribute: number }
  | { readonly _tag: "wrongClass"; readonly node: number }
  | { readonly _tag: "wrongSize"; readonly node: number };

/**
 * A named invalid variant.
 */
export type InvalidVariant = Corruption["_tag"];

/**
 * The variants that edit only what `flatten` writes, each node's id, parent, slot and interval, so
 * assembly meets them.
 */
export const rowVariants = [
  "gap",
  "duplicateSlot",
  "secondParent",
  "startTaken",
  "secondRoot",
  "cycle",
  "wrongSize",
  "overlappingSiblings",
  "gapBetweenSiblings",
  "childOutsideParent",
  "orphan",
  "doctypeNotFirst",
] as const satisfies readonly InvalidVariant[];

/**
 * A variant of {@link rowVariants}.
 */
export type RowVariant = (typeof rowVariants)[number];

/**
 * The variants assembly does not meet, which only the laws over folded rows do: those that edit the
 * fields the folds write, and those that give a foreign element or an open-class attribute a class
 * its stored namespace contradicts, which assembly reads as written.
 */
export const foldVariants = [
  "countOffByOne",
  "slotZeroAccumulator",
  "staleWas",
  "parentCopy",
  "ownerCopy",
  "repeatedName",
  "sentinelCopy",
  "wrongClass",
  "wrongAttributeClass",
] as const satisfies readonly InvalidVariant[];

/**
 * Every named invalid variant.
 */
export const invalidVariants = [...rowVariants, ...foldVariants] as const;

/**
 * A variant with the field it edits, `variant field`, for the variants that edit one of several
 * fields: the situations a search over the variants must reach, beside each variant alone.
 */
export type VariantField =
  | `parentCopy ${ParentCopy}`
  | `ownerCopy ${OwnerCopy}`
  | `slotZeroAccumulator ${Accumulator}`
  | `sentinelCopy ${(typeof sentinelCopies)[number]}`;

/**
 * Every {@link VariantField}.
 */
export const variantFields: readonly VariantField[] = [
  ...parentCopies.map((field): VariantField => `parentCopy ${field}`),
  ...ownerCopies.map((field): VariantField => `ownerCopy ${field}`),
  ...accumulators.map((field): VariantField => `slotZeroAccumulator ${field}`),
  ...sentinelCopies.map((field): VariantField => `sentinelCopy ${field}`),
];

/**
 * A variant drawn on a target of a kind, `variant on kind`: the node it edits, or an attribute's
 * owner.
 */
export type VariantTarget = `${InvalidVariant} on ${string}`;

/**
 * The field a variant edits, where it edits one of several.
 *
 * @param variant - The variant.
 * @returns Its {@link VariantField}, none for a variant of one edit.
 */
const fieldOf = (variant: Corruption): readonly VariantField[] => {
  if (variant._tag === "parentCopy") {
    return [`parentCopy ${variant.field}`];
  }

  if (variant._tag === "ownerCopy") {
    return [`ownerCopy ${variant.field}`];
  }

  if (variant._tag === "slotZeroAccumulator") {
    return [`slotZeroAccumulator ${variant.field}`];
  }

  return variant._tag === "sentinelCopy" ? [`sentinelCopy ${variant.field}`] : [];
};

/**
 * The situations a drawn variant reaches: its name, the field it edits where it edits one of
 * several, and the kind of its target.
 *
 * @param generated - The tree it was drawn for.
 * @param generated.document - The tree, whose attribute rows an attribute variant targets.
 * @param generated.model - The tree's model, whose nodes every other variant targets.
 * @param variant - The variant.
 * @returns Its situations.
 */
export const situationsOf = (
  { document, model }: Pick<GeneratedXdm, "document" | "model">,
  variant: Corruption,
): readonly (InvalidVariant | VariantField | VariantTarget)[] => {
  const kindOf = (number: number): string => model[number]?.kind ?? "";
  const ownerOf = (index: number): string => {
    const owner = flatten(document, idOf).attributes[index]?.node;

    return kindOf(model.findIndex((_, number) => idOf(number) === owner));
  };
  const target =
    "attribute" in variant
      ? ownerOf(variant.attribute)
      : kindOf("node" in variant ? variant.node : 0);

  return [variant._tag, ...fieldOf(variant), `${variant._tag} on ${target}`];
};

/**
 * The law of the document layer (plan §1.3, trees.md §2) that refuses each variant, by the name the
 * host's law model (`#pantry/test/oracle.ts`) gives it, so a renamed law breaks the build.
 *
 * A duplicated slot leaves its family a slot short, which the family's own law refuses; a second
 * row of one id is refused by `Node`'s key. Of the interval laws, two rows at one start break T1;
 * a second self-parented row breaks T2, since only the row at start 0 is; a cycle puts a node first
 * under a node that starts after it, which T3 refuses, as it refuses any first child that does not
 * start one past its parent; a sibling that starts anywhere but at its predecessor's end breaks T4;
 * a parent that does not end where its last child ends breaks T5; and a childless node whose
 * interval holds more than itself breaks T6. A foreign element's class and an open-class
 * attribute's are read off their stored namespaces against their parent's and their element's
 * (XML Schema 1.0 Part 1, §3.10.4; Namespaces in XML 1.0, §2), so a class its namespace
 * contradicts breaks the class law of each.
 *
 * The merged parent copy is T3's, beside its first-child start (trees.md §6): a node whose copy of
 * a parent field is not its parent's, T0's `document` among them, breaks it, and so does a node
 * whose parent no row holds, which has no parent to copy. An attribute's copy of its owner is
 * AL1's, and a closed name an element already holds is AL2's distinctness, which only an open
 * class's shared position escapes. A doctype after the root element follows the node before it,
 * whose state it never folded from, which N5's fold refuses.
 */
export const lawOf = {
  childOutsideParent: "T5 last child",
  countOffByOne: "N2 mirrors",
  cycle: "T3 first child",
  doctypeNotFirst: "N5 fold",
  duplicateSlot: "N2 mirrors",
  gap: "N2 mirrors",
  gapBetweenSiblings: "T4 next sibling",
  orphan: "T3 first child",
  overlappingSiblings: "T4 next sibling",
  ownerCopy: "AL1 owner",
  parentCopy: "T3 first child",
  repeatedName: "AL2 distinct",
  secondParent: "Node key",
  secondRoot: "T2 root",
  sentinelCopy: "N1 sentinel",
  slotZeroAccumulator: "N5 first slot",
  staleWas: "N5 fold",
  startTaken: "T1 document order",
  wrongAttributeClass: "Foreign attribute class",
  wrongClass: "Foreign element class",
  wrongSize: "T6 non-empty and leaf",
} as const satisfies Readonly<Record<InvalidVariant, LawName>>;

/**
 * Whether a model node is an element, of a kind or foreign.
 *
 * @param placed - The node.
 * @returns Whether it holds children.
 */
const isElement = (placed: Placed): boolean =>
  !["document", "doctype", "text", "ws", "comment", "pi", "entityRef"].includes(placed.kind);

/**
 * Whether a model node is an element of a kind, not a foreign one.
 *
 * @param placed - The node.
 * @returns Whether it is.
 */
const isClosed = (placed: Placed): boolean => isElement(placed) && !isForeignKind(placed.kind);

/**
 * Draw one of a non-empty list of numbers, or none from an empty one.
 *
 * @param numbers - The numbers.
 * @returns How often the variant they target is drawn, and the generator of one of them.
 */
const among = (numbers: readonly number[]): readonly [number, Gen<number>] =>
  Arr.isReadonlyArrayNonEmpty(numbers) ? [1, element(numbers)] : [0, constant(0)];

/**
 * Weigh each named invalid variant for a valid tree, with the generator of its targets: one share
 * where the tree holds a target for it, none where it holds none.
 *
 * @param generated - The tree and its model.
 * @param generated.document - The tree, whose attributes the attribute variant targets.
 * @param generated.model - The tree's model, whose nodes every other variant targets.
 * @returns Each variant's weight and generator.
 */
const variantsOf = ({
  document,
  model,
}: Pick<GeneratedXdm, "document" | "model">): Readonly<
  Record<InvalidVariant, readonly [number, Gen<Corruption>]>
> => {
  const numbered = model.map((placed, number) => ({ ...placed, number }));
  const members = numbered.filter(({ number }) => number > 0);
  const placedUnder = Map.groupBy(members, ({ parent }) => parent);
  const lastChildOf = (number: number) => placedUnder.get(number)?.at(-1);
  const isChildless = (number: number) => !placedUnder.has(number);
  const descendantsOf = (placed: Placed) => numbered.slice(placed.start + 1, placed.end);
  const elements = numbered.filter(isElement);
  const attributeRows = flatten(document, idOf).attributes;
  const options: Readonly<Record<InvalidVariant, readonly [number, Gen<Corruption>]>> = {
    childOutsideParent: (() => {
      const [weight, node] = among(
        members
          .filter((placed) => {
            const last = lastChildOf(placed.number);

            return last !== undefined && !isChildless(last.number);
          })
          .map(({ number }) => number),
      );

      return [weight, (source) => ({ _tag: "childOutsideParent", node: source.draw(node) })];
    })(),
    countOffByOne: [
      1,
      (source) => ({ _tag: "countOffByOne", node: source.draw(int(0, model.length - 1)) }),
    ],
    cycle: (() => {
      const pairs = members.flatMap((placed) =>
        isElement(placed) && lastChildOf(placed.parent) === placed
          ? descendantsOf(placed)
              .filter((below) => isElement(below) && isChildless(below.number))
              .map((below) => ({ node: placed.number, under: below.number }))
          : [],
      );

      return Arr.isReadonlyArrayNonEmpty(pairs)
        ? [1, (source) => ({ _tag: "cycle", ...source.draw(element(pairs)) })]
        : [0, constant({ _tag: "cycle", node: 0, under: 0 })];
    })(),
    doctypeNotFirst: (() => {
      const [weight, node] = among(
        members.filter(({ kind }) => kind === "doctype").map(({ number }) => number),
      );

      return [weight, (source) => ({ _tag: "doctypeNotFirst", node: source.draw(node) })];
    })(),
    duplicateSlot: (() => {
      const [weight, node] = among(members.filter(({ at }) => at > 0).map(({ number }) => number));

      return [weight, (source) => ({ _tag: "duplicateSlot", node: source.draw(node) })];
    })(),
    gap: [1, (source) => ({ _tag: "gap", node: source.draw(int(1, model.length - 1)) })],
    gapBetweenSiblings: (() => {
      const [weight, node] = among(members.filter(({ at }) => at > 0).map(({ number }) => number));

      return [weight, (source) => ({ _tag: "gapBetweenSiblings", node: source.draw(node) })];
    })(),
    orphan: [1, (source) => ({ _tag: "orphan", node: source.draw(int(1, model.length - 1)) })],
    overlappingSiblings: (() => {
      const [weight, node] = among(members.filter(({ at }) => at > 0).map(({ number }) => number));

      return [weight, (source) => ({ _tag: "overlappingSiblings", node: source.draw(node) })];
    })(),
    ownerCopy: (() => {
      const [weight, attribute] = among(attributeRows.map((_, index) => index));

      return [
        weight,
        (source) => ({
          _tag: "ownerCopy",
          attribute: source.draw(attribute),
          field: source.draw(element(ownerCopies)),
        }),
      ];
    })(),
    parentCopy: (() => {
      // A first child's start is one past its parent's, which T3 reads beside the copy, so the
      // parent's start is miscopied only at a later slot, where the copy alone holds it.
      const later = members.filter(({ at }) => at > 0).map(({ number }) => number);
      const fields = parentCopies.filter(
        (field) => field !== "parentStart" || Arr.isReadonlyArrayNonEmpty(later),
      );

      return Arr.isReadonlyArrayNonEmpty(fields)
        ? [
            1,
            (source) => {
              const field = source.draw(element(fields));

              return {
                _tag: "parentCopy",
                field,
                node:
                  field === "parentStart" && Arr.isReadonlyArrayNonEmpty(later)
                    ? source.draw(element(later))
                    : source.draw(int(1, model.length - 1)),
              };
            },
          ]
        : [0, constant({ _tag: "parentCopy", field: "document", node: 0 })];
    })(),
    repeatedName: (() => {
      const pairs = attributeRows.flatMap((later, attribute) =>
        attributeRows.flatMap((before, earlier) =>
          before.node === later.node && before.at < later.at && !isOpenClass(before.name)
            ? [{ attribute, earlier }]
            : [],
        ),
      );

      return Arr.isReadonlyArrayNonEmpty(pairs)
        ? [1, (source) => ({ _tag: "repeatedName", ...source.draw(element(pairs)) })]
        : [0, constant({ _tag: "repeatedName", attribute: 0, earlier: 0 })];
    })(),
    secondParent: (() => {
      const pairs = members.flatMap((placed) => {
        const below = new Set(descendantsOf(placed).map(({ number }) => number));

        return elements
          .filter(
            (parent) =>
              parent.number !== placed.parent &&
              parent.number !== placed.number &&
              !below.has(parent.number) &&
              placed.kind !== "doctype" &&
              (!isClosed(placed) || isClosed(parent)),
          )
          .map((parent) => ({ node: placed.number, parent: parent.number }));
      });

      return Arr.isReadonlyArrayNonEmpty(pairs)
        ? [1, (source) => ({ _tag: "secondParent", ...source.draw(element(pairs)) })]
        : [0, constant({ _tag: "secondParent", node: 0, parent: 0 })];
    })(),
    secondRoot: [
      1,
      (source) => ({ _tag: "secondRoot", node: source.draw(int(1, model.length - 1)) }),
    ],
    sentinelCopy: [
      1,
      (source) => ({ _tag: "sentinelCopy", field: source.draw(element(sentinelCopies)) }),
    ],
    slotZeroAccumulator: (() => {
      const [, node] = among(numbered.filter(({ at }) => at === 0).map(({ number }) => number));
      const [, attribute] = among(
        attributeRows.flatMap(({ at }, index) => (at === 0n ? [index] : [])),
      );
      const fields = accumulators.filter(
        (field) => field !== "attrsWas" || attributeRows.some(({ at }) => at === 0n),
      );

      return Arr.isReadonlyArrayNonEmpty(fields)
        ? [
            1,
            (source) => {
              const field = source.draw(element(fields));

              return field === "attrsWas"
                ? { _tag: "slotZeroAccumulator", attribute: source.draw(attribute), field }
                : { _tag: "slotZeroAccumulator", field, node: source.draw(node) };
            },
          ]
        : [0, constant({ _tag: "slotZeroAccumulator", field: "was", node: 0 })];
    })(),
    staleWas: (() => {
      const [weight, node] = among(
        members
          .filter(
            (placed) =>
              placed.at > 0 &&
              (placedUnder.get(placed.parent) ?? []).some(
                (sibling) => sibling.at === placed.at - 1 && isElement(sibling),
              ),
          )
          .map(({ number }) => number),
      );

      return [weight, (source) => ({ _tag: "staleWas", node: source.draw(node) })];
    })(),
    startTaken: [
      1,
      (source) => ({ _tag: "startTaken", node: source.draw(int(1, model.length - 1)) }),
    ],
    wrongAttributeClass: (() => {
      const [weight, attribute] = among(
        attributeRows.flatMap(({ name }, index) => (isOpenClass(name) ? [index] : [])),
      );

      return [
        weight,
        (source) => ({ _tag: "wrongAttributeClass", attribute: source.draw(attribute) }),
      ];
    })(),
    wrongClass: (() => {
      const [weight, node] = among(
        members.filter(({ kind }) => isForeignKind(kind)).map(({ number }) => number),
      );

      return [weight, (source) => ({ _tag: "wrongClass", node: source.draw(node) })];
    })(),
    wrongSize: (() => {
      const [weight, node] = among(
        members.filter(({ number }) => isChildless(number)).map(({ number }) => number),
      );

      return [weight, (source) => ({ _tag: "wrongSize", node: source.draw(node) })];
    })(),
  };

  return options;
};

/**
 * Draw a named invalid variant among those a valid tree admits, each as often as the others, with
 * its targets.
 *
 * @param generated - The tree and its model.
 * @param variants - The variants to draw among, which hold one every tree admits: `gap`,
 *   `startTaken`, `wrongSize`, `countOffByOne`, `orphan`, `parentCopy`, `slotZeroAccumulator` or
 *   `sentinelCopy`.
 * @returns The generator.
 */
export const corruption = (
  generated: Pick<GeneratedXdm, "document" | "model">,
  variants: Arr.NonEmptyReadonlyArray<InvalidVariant>,
): Gen<Corruption> => {
  const options = variantsOf(generated);

  return proportional<Corruption>(
    pipe(
      variants,
      Arr.map((variant) => options[variant]),
    ),
  );
};

/**
 * The named invalid variants a valid tree admits: those it holds a target for.
 *
 * @param generated - The tree and its model.
 * @returns The variants, in {@link invalidVariants} order.
 */
export const admissibleVariants = (
  generated: Pick<GeneratedXdm, "document" | "model">,
): readonly InvalidVariant[] => {
  const options = variantsOf(generated);

  return invalidVariants.filter((variant) => options[variant][0] > 0);
};

/**
 * The schema version a row is not in.
 *
 * @param version - Its version.
 * @returns The other version.
 */
const otherVersion = (version: Composed["version"]): Composed["version"] =>
  schemaVersions.find((other) => other !== version) ?? version;

/**
 * A kind other than one a copy must hold: a kind the row knows of, or the document's.
 *
 * @param held - The kind the copy must hold.
 * @param near - A kind of the row's own, taken where it is not `held`.
 * @returns A kind that is not `held`.
 */
const otherKind = (held: Kind, near: Kind): Kind => {
  if (near !== held) {
    return near;
  }

  return held === "document" ? "text" : "document";
};

/**
 * An ancestry other than one a copy must hold: it with the first flag it lacks, or, where it holds
 * every flag, without the first.
 *
 * @param held - The ancestry the copy must hold.
 * @returns Another ancestry.
 */
const otherAncestry = (held: Ancestry): Ancestry =>
  Option.match(
    Arr.findFirst(flags, (flag) => !held.has(flag)),
    {
      onNone: () => new Set(flags.slice(1)),
      onSome: (flag) => new Set([...held, flag]),
    },
  );

/**
 * The edits {@link corrupt} makes of a tree's folded rows: a node's row by its number or id, an
 * owner's children, the rows with one node changed, a node's predecessor and last child, a node
 * ending elsewhere, and the rows with room made for one more node inside an owner.
 *
 * @param rows - The rows.
 * @returns The edits over them.
 */
const editsOf = (rows: FoldedRows<Composed>) => {
  const { nodes } = rows;
  const at = (number: number): Option.Option<FoldedNode<Composed>> =>
    Option.fromNullishOr(nodes[number]);
  const byId = new Map(nodes.map((node) => [node.id, node] as const));
  const countOf = (owner: FoldedNode<Composed>): bigint =>
    BigInt(nodes.filter((node) => node !== nodes[0] && node.parent === owner.id).length);
  const withNodes = (next: readonly FoldedNode<Composed>[]): FoldedRows<Composed> => ({
    ...rows,
    nodes: next,
  });
  const one = (number: number, change: (node: FoldedNode<Composed>) => FoldedNode<Composed>) =>
    withNodes(nodes.map((node, index) => (index === number ? change(node) : node)));
  const predecessorOf = (target: FoldedNode<Composed>): Option.Option<FoldedNode<Composed>> =>
    Option.fromNullishOr(
      nodes.find(
        (node) => node !== nodes[0] && node.parent === target.parent && node.at === target.at - 1n,
      ),
    );
  const lastChildOf = (owner: FoldedNode<Composed>): Option.Option<FoldedNode<Composed>> =>
    Option.fromNullishOr(nodes.findLast((node) => node !== nodes[0] && node.parent === owner.id));
  const ending = (number: number, end: (node: FoldedNode<Composed>) => bigint) =>
    one(number, (node) => ({ ...node, end: end(node) }));
  const roomIn = (owner: FoldedNode<Composed>): readonly FoldedNode<Composed>[] =>
    nodes.map((node) => {
      const moved = node.start >= owner.end;
      const grown = moved || (node.start <= owner.start && node.end >= owner.end);

      return {
        ...node,
        end: node.end + (grown ? 1n : 0n),
        parentStart: node.parentStart + (node.parentStart >= owner.end ? 1n : 0n),
        start: node.start + (moved ? 1n : 0n),
      };
    });

  return { at, byId, countOf, ending, lastChildOf, nodes, one, predecessorOf, roomIn, withNodes };
};

/**
 * A variant of {@link rowVariants}, with its targets.
 */
export type RowCorruption = Extract<Corruption, { readonly _tag: RowVariant }>;

/**
 * Test whether a corruption is a row variant, which assembly meets.
 *
 * @param variant - The corruption.
 * @returns Whether its tag is one of {@link rowVariants}.
 */
export const isRowCorruption = (variant: Corruption): variant is RowCorruption =>
  rowVariants.some((tag) => tag === variant._tag);

/**
 * Apply a row variant to a valid tree's folded rows: an edit of ids, parents, slots and intervals.
 *
 * @param rows - The rows.
 * @param variant - The variant and its targets.
 * @returns The rows with the variant applied.
 */
const corruptRows = (rows: FoldedRows<Composed>, variant: RowCorruption): FoldedRows<Composed> => {
  const { at, countOf, ending, lastChildOf, nodes, one, predecessorOf, roomIn, withNodes } =
    editsOf(rows);
  switch (variant._tag) {
    case "gap": {
      return Option.match(at(variant.node), {
        onNone: () => rows,
        onSome: (target) =>
          withNodes(
            nodes.map((node, index) =>
              index > 0 && node.parent === target.parent && node.at >= target.at
                ? { ...node, at: node.at + 1n }
                : node,
            ),
          ),
      });
    }
    case "duplicateSlot": {
      return one(variant.node, (node) => ({ ...node, at: node.at - 1n }));
    }
    case "secondParent": {
      return Option.match(Option.all([at(variant.node), at(variant.parent)]), {
        onNone: () => rows,
        onSome: ([target, parent]) =>
          withNodes([
            ...roomIn(parent),
            {
              ...target,
              at: countOf(parent),
              end: parent.end + 1n,
              parent: parent.id,
              parentStart: parent.start,
              start: parent.end,
            },
          ]),
      });
    }
    case "startTaken": {
      return Option.match(at(variant.node), {
        onNone: () => rows,
        onSome: (target) =>
          withNodes(
            nodes.map((node, index) => {
              if (index === variant.node) {
                return { ...node, start: node.start - 1n };
              }

              return node.parent === target.id && index > 0
                ? { ...node, parentStart: node.parentStart - 1n }
                : node;
            }),
          ),
      });
    }
    case "secondRoot": {
      return one(variant.node, (node) => ({
        ...node,
        at: 0n,
        parent: node.id,
        parentStart: node.start,
      }));
    }
    case "cycle": {
      return Option.match(at(variant.under), {
        onNone: () => rows,
        onSome: (under) =>
          one(variant.node, (node) => ({
            ...node,
            at: 0n,
            parent: under.id,
            parentStart: under.start,
          })),
      });
    }
    case "wrongSize": {
      return Option.match(at(variant.node), {
        onNone: () => rows,
        onSome: (leaf) => withNodes(roomIn(leaf)),
      });
    }
    case "overlappingSiblings": {
      return Option.match(Option.flatMap(at(variant.node), predecessorOf), {
        onNone: () => rows,
        onSome: (before) => ending(Number(before.start), (node) => node.end + 1n),
      });
    }
    case "gapBetweenSiblings": {
      return Option.match(Option.flatMap(at(variant.node), predecessorOf), {
        onNone: () => rows,
        onSome: (before) => ending(Number(before.start), (node) => node.end - 1n),
      });
    }
    case "childOutsideParent": {
      return Option.match(Option.flatMap(at(variant.node), lastChildOf), {
        onNone: () => rows,
        onSome: (last) => ending(variant.node, () => last.end - 1n),
      });
    }
    case "orphan": {
      return one(variant.node, (node) => ({ ...node, parent: idOf(nodes.length) }));
    }
    case "doctypeNotFirst": {
      return Option.match(at(variant.node), {
        onNone: () => rows,
        onSome: (doctype) => {
          const [sentinel] = nodes;
          const last = BigInt(nodes.length);
          const family = BigInt(
            nodes.filter((node) => node !== sentinel && node.parent === doctype.parent).length,
          );
          const back = (value: bigint): bigint => (value > doctype.start ? value - 1n : value);

          return withNodes(
            nodes.map((node) => {
              if (node === doctype) {
                return { ...node, at: family - 1n, end: last, start: last - 1n };
              }

              if (node === sentinel) {
                return node;
              }

              return {
                ...node,
                at: node.parent === doctype.parent && node.at > doctype.at ? node.at - 1n : node.at,
                end: back(node.end),
                parentStart: back(node.parentStart),
                start: back(node.start),
              };
            }),
          );
        },
      });
    }
    default: {
      return variant satisfies never;
    }
  }
};

/**
 * Apply a fold variant to a valid tree's folded rows: an edit of the fields the folds write.
 *
 * @param rows - The rows.
 * @param variant - The variant and its targets.
 * @returns The rows with the variant applied.
 */
const corruptFolds = (
  rows: FoldedRows<Composed>,
  variant: Exclude<Corruption, RowCorruption>,
): FoldedRows<Composed> => {
  const { at, byId, nodes, one, predecessorOf } = editsOf(rows);
  switch (variant._tag) {
    case "countOffByOne": {
      return one(variant.node, (node) => ({ ...node, children: node.children + 1n }));
    }
    case "slotZeroAccumulator": {
      if (variant.field === "attrsWas") {
        const first = rows.attributes[variant.attribute];
        if (first === undefined) {
          return rows;
        }

        // A position the element holds no name at, which a fold from the first attribute carries
        // into every later attribute and the element's `attrs`, so only the first slot is wrong.
        const held = byId.get(first.node)?.attrs ?? first.derived.attrs;
        let unheld = 0;
        while (held.has(unheld) || first.derived.attrs.has(unheld)) {
          unheld += 1;
        }

        const extra = new Set([unheld]);

        return {
          ...rows,
          attributes: rows.attributes.map((attribute) =>
            attribute.node === first.node
              ? {
                  ...attribute,
                  attrsWas: attribute.attrsWas.union(extra),
                  derived: { attrs: attribute.derived.attrs.union(extra) },
                }
              : attribute,
          ),
          nodes: nodes.map((node) =>
            node.id === first.node ? { ...node, attrs: node.attrs.union(extra) } : node,
          ),
        };
      }

      const { field } = variant;

      return one(variant.node, (node) => {
        switch (field) {
          case "was": {
            return { ...node, was: node.was + 1 };
          }
          case "elementsWas": {
            return { ...node, elementsWas: node.elementsWas + 1n };
          }
          default: {
            return field satisfies never;
          }
        }
      });
    }
    case "parentCopy": {
      const { field } = variant;

      return one(variant.node, (node) => {
        const parent = byId.get(node.parent) ?? node;
        switch (field) {
          case "document": {
            return { ...node, document: node.id };
          }
          case "version": {
            return { ...node, version: otherVersion(node.version) };
          }
          case "parentKind": {
            return { ...node, parentKind: otherKind(parent.kind, node.kind) };
          }
          case "parentStart": {
            return { ...node, parentStart: parent.start + 1n };
          }
          case "parentAncestry": {
            return { ...node, parentAncestry: otherAncestry(parent.derived.ancestry) };
          }
          case "parentNearest": {
            return { ...node, parentNearest: node.id };
          }
          case "parentNearestKind": {
            return { ...node, parentNearestKind: otherKind(parent.nearestKind, node.kind) };
          }
          default: {
            return field satisfies never;
          }
        }
      });
    }
    case "ownerCopy": {
      const { field } = variant;

      return {
        ...rows,
        attributes: rows.attributes.map((attribute, index) => {
          if (index !== variant.attribute) {
            return attribute;
          }

          switch (field) {
            case "kind": {
              const owner = byId.get(attribute.node);

              return {
                ...attribute,
                kind: otherKind(attribute.kind, owner?.parentKind ?? "document"),
              };
            }
            case "version": {
              return { ...attribute, version: otherVersion(attribute.version) };
            }
            case "document": {
              return { ...attribute, document: attribute.node };
            }
            default: {
              return field satisfies never;
            }
          }
        }),
      };
    }
    case "repeatedName": {
      const earlier = rows.attributes[variant.earlier];

      return earlier === undefined
        ? rows
        : {
            ...rows,
            attributes: rows.attributes.map((attribute, index) =>
              index === variant.attribute ? { ...attribute, name: earlier.name } : attribute,
            ),
          };
    }
    case "staleWas": {
      return Option.match(Option.flatMap(at(variant.node), predecessorOf), {
        onNone: () => rows,
        onSome: (before) =>
          one(variant.node, (node) => ({
            ...node,
            elementsWas: before.elementsWas,
            was: before.was,
          })),
      });
    }
    case "wrongClass": {
      return one(variant.node, (node) =>
        isForeignKind(node.kind)
          ? {
              ...node,
              kind: node.kind === foreignKinds.other ? foreignKinds.absent : foreignKinds.other,
            }
          : node,
      );
    }
    case "wrongAttributeClass": {
      return {
        ...rows,
        attributes: rows.attributes.map((attribute, index) =>
          index === variant.attribute && isOpenClass(attribute.name)
            ? { ...attribute, name: attribute.name === "foreign" ? "no-namespace" : "foreign" }
            : attribute,
        ),
      };
    }
    case "sentinelCopy": {
      const { field } = variant;

      return one(0, (node) =>
        field === "parentAncestry"
          ? { ...node, parentAncestry: new Set(["int"]) }
          : {
              ...node,
              nearestKind: Option.getOrElse(
                Option.map(at(1), ({ kind }) => kind),
                () => node.kind,
              ),
            },
      );
    }
    default: {
      return variant satisfies never;
    }
  }
};

/**
 * Apply a named invalid variant to a valid tree's folded rows.
 *
 * The rows are the tree's as `fold` writes them, so node `n` of the model is `rows.nodes[n]`, and
 * it starts at `n`. Each edit is the smallest that makes its variant: it changes the fields it
 * names, and the `parentStart` copies of a start it moves, and no other, so the laws that refuse
 * it are the variant's own law and those that read the fields it changed.
 *
 * @param rows - The folded rows of the tree the corruption was drawn for.
 * @param variant - The variant and its targets.
 * @returns The rows with the variant applied.
 */
export const corrupt = (rows: FoldedRows<Composed>, variant: Corruption): FoldedRows<Composed> =>
  isRowCorruption(variant) ? corruptRows(rows, variant) : corruptFolds(rows, variant);

/**
 * Count a subtree's nodes, its root included.
 *
 * @param node - The subtree's root.
 * @returns How many nodes it holds.
 */
const sizeOf = (node: XdmChild<Composed>): number => {
  let size = 0;
  const stack = [node];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    size += 1;
    if ("children" in next) {
      stack.push(...next.children);
    }
  }

  return size;
};

/**
 * Rebuild a generated tree with one element of a kind changed, found by its number in document
 * order, the model's numbering. Elements of a kind below foreign ones are found too.
 *
 * @param document - The tree.
 * @param target - The element's number.
 * @param change - The element's new form from its old.
 * @returns The tree with the element changed.
 */
export const editElement = (
  document: XdmDocument<Composed>,
  target: number,
  change: (element: XdmClosedElement<Composed>) => XdmClosedElement<Composed>,
): XdmDocument<Composed> => {
  const rebuiltChildren = (
    children: readonly XdmChild<Composed>[],
    number: number,
  ): readonly XdmChild<Composed>[] => {
    let next = number + 1;

    return children.map((child) => {
      const at = next;
      next += sizeOf(child);

      // oxlint-disable-next-line no-use-before-define -- `visit` and `rebuiltChildren` recurse into each other.
      return visit(child, at);
    });
  };
  const closed = (node: XdmClosedElement<Composed>, number: number): XdmClosedElement<Composed> => {
    const rebuilt = { ...node, children: rebuiltChildren(node.children, number) };

    return number === target ? change(rebuilt) : rebuilt;
  };
  const visit = (node: XdmChild<Composed>, number: number): XdmChild<Composed> => {
    switch (node._tag) {
      case "element": {
        return closed(node, number);
      }
      case "foreign-element":
      case "no-namespace-element":
      case "own-namespace-element": {
        return { ...node, children: rebuiltChildren(node.children, number) };
      }
      case "text":
      case "ws":
      case "comment":
      case "pi":
      case "entityRef": {
        return node;
      }
      default: {
        return node satisfies never;
      }
    }
  };
  const rootNumber = (Option.isSome(document.doctype) ? 2 : 1) + document.prolog.length;

  return { ...document, root: closed(document.root, rootNumber) };
};

/**
 * The model numbers of a tree's elements of a kind.
 *
 * @param model - The tree's model.
 * @returns Their numbers.
 */
export const closedElements = (model: readonly Placed[]): readonly number[] =>
  model.flatMap((placed, number) => (isClosed(placed) ? [number] : []));
