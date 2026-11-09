/**
 * The XSD search's lawful seeds (lane GEN-C): documents built by construction from the composed
 * grammar's content automata, read through the XDM generator's index (`#pantry/test/gen/xdm.ts`),
 * each family a path through its model's Glushkov automaton from the start state. The search breeds
 * from documents both oracles should accept, where one edit is the only cause of a refusal, and a
 * law that refuses more than the XSD shows as a lawful document refused.
 *
 * Three sorts of document, each named for the report (`#pantry/test/genetic-xsd.oracle.test.ts`):
 *
 * - **Minimal**: each family the cheapest word that ends in one of its model's `Last` states, each
 *   child its own minimal subtree.
 * - **Root probes**: for every position of a root kind's model, the root's family as the cheapest
 *   path from the start to that position, both stopped there and completed to the nearest `Last`
 *   state, every child minimal. A path stopped at a position is a word the XSD accepts exactly when
 *   that position is accepting, whatever the grammar's `Last` says, so the stopped probes judge
 *   each root model's accepting states against `xmllint`, an over-restrictive one (a section that
 *   must hold a part) among them.
 * - **Covering**: the families down to {@link coveringDepth} each the cheapest accepting word through
 *   a position no earlier document of its model passed, every other child minimal, so the documents
 *   of a root pass every position its models reach there.
 *
 * Every element is admitted where it stands: its kind at a position its parent's model holds, no
 * flag its ancestry bans and every flag it needs (`#pantry/grammar/ancestry.ts`). It carries every
 * attribute its kind requires in its version, and those an HTML element law requires of it under
 * its parent (`requiredUnder`), each with a value its domain accepts, an `xs:ID` distinct in its
 * document and an `xs:IDREF` naming one; a kind with simple content holds a text its domain
 * accepts. A wildcard position holds the foreign elements of every name the generator's index
 * leaves foreign there, side by side where the position repeats: in no namespace, in its parent's,
 * in one no schema declares or in QTI's, under local names kinds have elsewhere
 * (`qti-assessment-item`, `p`), so a reader that resolves a name without its namespace takes one
 * for that kind. The laws across elements (a binding's declaration, a declaration's base type, a
 * selection's count) are left where they fall: a document they refuse is refused by both oracles,
 * as a bred one is.
 */
import type { Attribute, Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { Option } from "effect";
import { admits, step } from "#pantry/grammar/ancestry.ts";
import type { Ancestry } from "#pantry/grammar/ancestry.ts";
import type { ValueDomain } from "#pantry/grammar/attributes.ts";
import { enumerationKept } from "#pantry/grammar/domains.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { ForeignKind, SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { handlePrefixes, handlePrefixOf } from "#pantry/model/xdm.ts";
import type { ElementKind, ExpandedName } from "#pantry/model/xdm.ts";
import { indexOf, keyOf, kindOfDrawn, requiredUnder } from "#pantry/test/gen/xdm.ts";
import type { Automaton, Index } from "#pantry/test/gen/xdm.ts";
import { accepts, families } from "#pantry/test/lexical-harness.ts";

/**
 * One lawful document and the name the report gives it.
 */
export interface Lawful {
  readonly doc: XmlDocument;
  readonly name: string;
}

/**
 * An element kind or a foreign one: the kinds a family's positions hold.
 */
type Placed = ElementKind<Composed> | ForeignKind;

/**
 * A (version, parent)'s family as the builder walks it: its automaton, the element and foreign
 * kinds each position holds, its positions, ascending, and the local names of the element kinds
 * its parent admits, ascending.
 */
interface Family {
  readonly automaton: Automaton;
  readonly kindsAt: ReadonlyMap<number, readonly Placed[]>;
  readonly locals: readonly string[];
  readonly positions: readonly number[];
}

/**
 * What the builder reads of a grammar beside the generator's index, gathered once: each family it
 * walks, each domain by its handle, and each (version, kind)'s required attributes.
 */
interface Reading {
  readonly domains: ReadonlyMap<string, ValueDomain>;
  readonly families: Map<string, Option.Option<Family>>;
  readonly generator: Index;
  readonly grammar: ComposedGrammar;
  readonly required: ReadonlyMap<
    string,
    readonly { readonly domain: string; readonly name: string }[]
  >;
}

/**
 * The readings already gathered, by grammar.
 */
const readings = new WeakMap<ComposedGrammar, Reading>();

/**
 * Gather what the builder reads of a grammar, once per grammar.
 *
 * @param grammar - The composed grammar.
 * @returns Its reading.
 */
const readingOf = (grammar: ComposedGrammar): Reading => {
  const known = readings.get(grammar);
  if (known !== undefined) {
    return known;
  }

  const required = new Map<string, { domain: string; name: string }[]>();
  for (const { domain, kind, name, use, version } of grammar.attributes.admission.rows) {
    if (use === "required") {
      required.set(keyOf(version, kind), [
        ...(required.get(keyOf(version, kind)) ?? []),
        { domain, name },
      ]);
    }
  }

  const reading: Reading = {
    domains: new Map(grammar.attributes.domains.map((domain) => [domain.handle, domain])),
    families: new Map(),
    generator: indexOf(grammar),
    grammar,
    required,
  };
  readings.set(grammar, reading);

  return reading;
};

/**
 * Read a (version, parent)'s family: the generator's candidates at each position, a kind several
 * positions name at each position `Symbol` gives it, character data left out, since no automaton
 * needs it.
 *
 * @param reading - The reading.
 * @param version - The version.
 * @param kind - The parent's kind.
 * @returns The family, none for a kind with no content model.
 */
const familyOf = (
  reading: Reading,
  version: SchemaVersion,
  kind: string,
): Option.Option<Family> => {
  const key = keyOf(version, kind);
  const known = reading.families.get(key);
  if (known !== undefined) {
    return known;
  }

  const family = Option.map(
    Option.fromNullishOr(reading.generator.automata.get(key)),
    (automaton): Family => {
      const kindsAt = new Map<number, Placed[]>();
      for (const candidate of reading.generator.children.get(key) ?? []) {
        if (candidate.class === "element" || candidate.class === "wildcard") {
          const positions =
            candidate.position === 0
              ? (automaton.shared.get(kindOfDrawn(candidate)) ?? [])
              : [candidate.position];
          for (const position of positions) {
            kindsAt.set(position, [...(kindsAt.get(position) ?? []), candidate.kind]);
          }
        }
      }

      return {
        automaton,
        kindsAt,
        locals: [
          ...new Set(
            (reading.generator.children.get(key) ?? []).flatMap((candidate) =>
              candidate.class === "element"
                ? Option.toArray(
                    Option.fromNullishOr(reading.generator.names.get(candidate.kind)),
                  ).map(({ local }) => local)
                : [],
            ),
          ),
        ].toSorted(),
        positions: [...new Set([...automaton.follow.values()].flatMap((to) => [...to]))].toSorted(
          (left, right) => left - right,
        ),
      };
    },
  );
  reading.families.set(key, family);

  return family;
};

/**
 * The cost of each position of a family at its place: the fewest nodes its cheapest kind's subtree
 * holds among the kinds that may stand there; absent for a position none of whose kinds may.
 *
 * @param reading - The reading.
 * @param version - The version.
 * @param family - The family.
 * @param usable - Whether a kind may stand at the family's place.
 * @returns The costs, by position.
 */
const costsOf = (
  reading: Reading,
  version: SchemaVersion,
  family: Family,
  usable: (kind: Placed) => boolean,
): ReadonlyMap<number, number> => {
  const costs = new Map<number, number>();
  for (const [position, kinds] of family.kindsAt) {
    for (const kind of kinds.filter(usable)) {
      const cost = reading.generator.size.get(keyOf(version, kind)) ?? Infinity;
      costs.set(position, Math.min(costs.get(position) ?? Infinity, cost));
    }
  }

  return costs;
};

/**
 * Find the cheapest path from a state of an automaton to a state `done` accepts, by Dijkstra's
 * search, a step into a position costing that position's cost.
 *
 * @param automaton - The automaton.
 * @param costs - Each position's cost; a position without one is never stepped into.
 * @param from - The state the path starts at.
 * @param done - Whether a state ends the path.
 * @returns The positions the path steps into, in order, none where no path reaches an end.
 */
const cheapestPath = (
  automaton: Automaton,
  costs: ReadonlyMap<number, number>,
  from: number,
  done: (state: number) => boolean,
): Option.Option<readonly number[]> => {
  const best = new Map<number, number>([[from, 0]]);
  const before = new Map<number, number>();
  const open = new Set<number>([from]);
  const settled = new Set<number>();
  while (open.size > 0) {
    let state = from;
    let least = Infinity;
    for (const held of open) {
      if ((best.get(held) ?? Infinity) < least) {
        state = held;
        least = best.get(held) ?? Infinity;
      }
    }

    open.delete(state);
    settled.add(state);
    if (done(state)) {
      const path: number[] = [];
      for (let at = state; at !== from; at = before.get(at) ?? from) {
        path.unshift(at);
      }

      return Option.some(path);
    }

    for (const next of automaton.follow.get(state) ?? []) {
      const through = least + (costs.get(next) ?? Infinity);
      if (
        !settled.has(next) &&
        Number.isFinite(through) &&
        through < (best.get(next) ?? Infinity)
      ) {
        best.set(next, through);
        before.set(next, state);
        open.add(next);
      }
    }
  }

  return Option.none();
};

/**
 * A walk a family's word takes through its automaton: the cheapest accepting one; the cheapest
 * from the start to a position, stopped there; or the cheapest accepting one through it.
 */
type Walk =
  | { readonly _tag: "minimal" }
  | { readonly _tag: "stopped" | "through"; readonly position: number };

/**
 * The walk every family takes in a minimal document.
 */
const minimal: Walk = { _tag: "minimal" };

/**
 * Write a family's word for a walk, the minimal word where the walk has none.
 *
 * @param automaton - The family's automaton.
 * @param costs - Each position's cost at the family's place.
 * @param walk - The walk.
 * @returns The positions, in order, none where no accepting word exists at all.
 */
const wordOf = (
  automaton: Automaton,
  costs: ReadonlyMap<number, number>,
  walk: Walk,
): Option.Option<readonly number[]> => {
  const accepting = (state: number) => automaton.last.has(state);
  const cheapest = () => cheapestPath(automaton, costs, 0, accepting);
  switch (walk._tag) {
    case "minimal": {
      return cheapest();
    }
    case "stopped": {
      return Option.orElse(
        cheapestPath(automaton, costs, 0, (state) => state === walk.position),
        cheapest,
      );
    }
    case "through": {
      return Option.orElse(
        Option.flatMap(
          cheapestPath(automaton, costs, 0, (state) => state === walk.position),
          (to) =>
            Option.map(cheapestPath(automaton, costs, walk.position, accepting), (rest) => [
              ...to,
              ...rest,
            ]),
        ),
        cheapest,
      );
    }
    default: {
      return walk satisfies never;
    }
  }
};

/**
 * Choose a family's walk at its place: its parent's kind and depth, its family and its positions'
 * costs there.
 *
 * @param kind - The family's parent kind.
 * @param depth - The parent's depth, 0 for the root.
 * @param family - The family.
 * @param costs - Each position's cost at the family's place.
 * @returns The walk.
 */
type Walker = (
  kind: string,
  depth: number,
  family: Family,
  costs: ReadonlyMap<number, number>,
) => Walk;

/**
 * What one document's build tracks: its reading and version, how each family walks, the `xs:ID`
 * values it wrote, and how often each kind and each parent's foreign names were placed, so a
 * position's equal kinds and a wildcard's names are taken in turn.
 */
interface Build {
  readonly ids: string[];
  readonly reading: Reading;
  readonly used: Map<string, number>;
  readonly version: SchemaVersion;
  readonly walker: Walker;
}

/**
 * The values tried, in order, for a domain that lists no enumeration: the plainest form of each
 * datatype family first, then every boundary form `#pantry/test/lexical-harness.ts` keeps.
 */
const plainValues: readonly string[] = [
  ...new Set([
    "a1",
    "true",
    "1",
    "en",
    "a.xml",
    "single",
    "identifier",
    "PT1S",
    "2026-01-01",
    "2026-01-01T00:00:00",
    "1.5",
    "0",
    "text/plain",
    "1 1",
    "0,0,1,1",
    ...Object.values(families).flat(),
  ]),
];

/**
 * Find a value a domain accepts: its first enumerated value, else the first of
 * {@link plainValues} its pattern and facets accept.
 *
 * @param reading - The reading.
 * @param handle - The domain's handle.
 * @returns The value, none for a domain no tried value is in.
 */
const valueIn = (reading: Reading, handle: string): Option.Option<string> =>
  Option.flatMap(Option.fromNullishOr(reading.domains.get(handle)), (domain) =>
    Option.fromNullishOr(
      [...enumerationKept(domain.definition, domain.pattern), ...plainValues].find((value) =>
        accepts(domain, value),
      ),
    ),
  );

/**
 * The value an `xs:IDREF` or `xs:IDREFS` attribute is built with until its document is whole: a
 * text no attribute value holds, since XML admits no U+0000.
 */
const unreferenced = "\u0000";

/**
 * Write a namespace declaration as crust reads one.
 *
 * @param prefix - The prefix it binds, empty for the default namespace.
 * @param namespace - The namespace name, empty to undeclare the default.
 * @returns The declaration.
 */
const declarationOf = (prefix: string, namespace: string): Attribute => ({
  local: prefix === "" ? "xmlns" : prefix,
  namespace: "http://www.w3.org/2000/xmlns/",
  prefix: prefix === "" ? "" : "xmlns",
  qname: prefix === "" ? "xmlns" : `xmlns:${prefix}`,
  references: [],
  value: namespace,
});

/**
 * Write the attributes an element of a kind carries: each its kind requires in the version and each
 * `requiredUnder` requires of it under its parent, with a value its domain accepts, and the
 * declarations their prefixes need. An `xs:ID` takes a value no other in the document has; an
 * `xs:IDREF` or `xs:IDREFS` is {@link unreferenced} until the document is whole ({@link
 * referenced}).
 *
 * @param build - The document's build.
 * @param kind - The element's kind.
 * @param parent - Its parent's kind.
 * @returns The attributes.
 */
const attributesOf = (build: Build, kind: string, parent: string): readonly Attribute[] => {
  const { reading, version } = build;
  const under = requiredUnder(kind, parent);
  const wanted = new Map(
    [
      ...(reading.required.get(keyOf(version, kind)) ?? []),
      ...reading.grammar.attributes.admission.rows.filter(
        (row) => row.version === version && row.kind === kind && under.includes(row.name),
      ),
    ].map((held) => [held.name, held.domain] as const),
  );
  const attributes: Attribute[] = [];
  for (const [name, domain] of wanted) {
    const identity = Option.flatMap(
      Option.fromNullishOr(reading.domains.get(domain)),
      (held) => held.identity,
    );
    const value = Option.match(identity, {
      onNone: () => Option.getOrElse(valueIn(reading, domain), () => "a1"),
      onSome: (held) => {
        if (held !== "ID") {
          return unreferenced;
        }

        const id = `id${String(build.ids.length + 1)}`;
        build.ids.push(id);

        return id;
      },
    });
    const prefix = handlePrefixOf(name);
    const namespace = handlePrefixes.find((held) => held.prefix === prefix)?.namespace ?? "";
    if (prefix !== "" && prefix !== "xml" && !attributes.some(({ local }) => local === prefix)) {
      attributes.push(declarationOf(prefix, namespace));
    }

    attributes.push({
      local: prefix === "" ? name : name.slice(prefix.length + 1),
      namespace,
      prefix,
      qname: name,
      references: [],
      value,
    });
  }

  return attributes;
};

/**
 * The namespace a foreign element of the other class is written in beside the generator's own
 * names: one no schema declares, so a reader that reads namespaces resolves no kind there.
 */
const elsewhere = "urn:qti-pie:lawful";

/**
 * Name the foreign elements a wildcard position holds: the generator's foreign names of its class
 * under its parent, then, in no namespace for the no-namespace class and in {@link elsewhere} for
 * the other, each local name of a kind the parent admits, each name once. A reader that resolves a
 * name without its namespace takes each of the latter for a kind its parent admits. Where the
 * position may follow itself the family holds them all side by side, so each stands in one lawful
 * document; else it takes the next of them in turn.
 *
 * @param build - The document's build.
 * @param kind - The foreign kind.
 * @param parent - Its parent's kind.
 * @param family - The family the position is in.
 * @param namespace - Its parent's namespace, which its class is read against.
 * @param repeats - Whether the position may follow itself.
 * @returns The elements' names.
 */
const foreignNamesOf = (
  build: Build,
  kind: ForeignKind,
  parent: Placed,
  family: Family,
  namespace: string,
  repeats: boolean,
): readonly ExpandedName[] => {
  const turn = build.used.get(`${parent} ${kind}`) ?? 0;
  build.used.set(`${parent} ${kind}`, turn + 1);

  const blind = new Map<string, string>([
    [foreignKinds.absent, ""],
    [foreignKinds.other, elsewhere],
  ]).get(kind);
  const names = [
    ...new Map(
      [
        ...Option.getOrElse(
          build.reading.generator.foreign(build.version, parent, namespace, kind),
          () => [],
        ),
        ...(blind === undefined
          ? []
          : family.locals.flatMap((local) =>
              // A name stays foreign where it resolves to no kind its parent admits.
              Option.exists(build.reading.grammar.kinds.resolve(blind, local, parent), (child) =>
                Option.isSome(
                  build.reading.grammar.admission.lookup({
                    child,
                    parent,
                    version: build.version,
                  }),
                ),
              )
                ? []
                : [{ local, namespace: blind }],
            )),
      ].map((name) => [`{${name.namespace}}${name.local}`, name] as const),
    ).values(),
  ];

  return repeats ? names : names.slice(turn % Math.max(1, names.length)).slice(0, 1);
};

/**
 * Build an element of a kind and its subtree.
 *
 * @param build - The document's build.
 * @param kind - The element's kind.
 * @param parent - Its parent's kind, `document` for the root.
 * @param around - The ancestry it sits in, its parent's own.
 * @param name - Its name.
 * @param scope - The default namespace in scope at its parent.
 * @param depth - Its depth, 0 for the root.
 * @returns The element.
 */
const elementOf = (
  build: Build,
  kind: Placed,
  parent: string,
  around: Ancestry,
  name: ExpandedName,
  scope: string,
  depth: number,
): Element => {
  const { reading, version } = build;
  const own = step(reading.grammar.ancestry, around, kind);
  const usable = (child: Placed) =>
    admits(reading.grammar.ancestry, own, child) &&
    reading.generator.size.has(keyOf(version, child));
  // The cheapest kind first, then one of the element's own namespace, then the least placed: a
  // minimal family stays minimal, and an include or a foreign vocabulary stands only where its
  // position holds nothing as cheap.
  const rank = (child: Placed): readonly number[] => [
    reading.generator.size.get(keyOf(version, child)) ?? Infinity,
    reading.generator.names.get(child)?.namespace === name.namespace ? 0 : 1,
    build.used.get(child) ?? 0,
  ];
  const children = isForeignKind(kind)
    ? []
    : Option.match(familyOf(reading, version, kind), {
        onNone: () => [],
        onSome: (family) => {
          const costs = costsOf(reading, version, family, usable);
          const word = Option.getOrElse(
            wordOf(family.automaton, costs, build.walker(kind, depth, family, costs)),
            () => [],
          );

          return word.flatMap((position): readonly Element[] => {
            const ranked = (family.kindsAt.get(position) ?? [])
              .filter(usable)
              .map((child) => ({ child, rank: rank(child) }))
              .toSorted((left, right) => {
                const at = left.rank.findIndex((held, slot) => held !== right.rank[slot]);

                return at === -1 ? 0 : (left.rank[at] ?? 0) - (right.rank[at] ?? 0);
              });
            const chosen = ranked[0]?.child;
            if (chosen === undefined) {
              return [];
            }

            build.used.set(chosen, (build.used.get(chosen) ?? 0) + 1);

            const names = isForeignKind(chosen)
              ? foreignNamesOf(
                  build,
                  chosen,
                  kind,
                  family,
                  name.namespace,
                  family.automaton.follow.get(position)?.has(position) ?? false,
                )
              : [reading.generator.names.get(chosen) ?? { local: chosen, namespace: "" }];

            return names.map((named) =>
              elementOf(build, chosen, kind, own, named, name.namespace, depth + 1),
            );
          });
        },
      });
  const text = Option.flatMap(
    reading.grammar.attributes.text.lookup({ kind, version }),
    ({ domain }) => Option.filter(valueIn(reading, domain), (value) => value !== ""),
  );

  return {
    attributes: [
      ...(name.namespace === scope ? [] : [declarationOf("", name.namespace)]),
      ...(isForeignKind(kind) ? [] : attributesOf(build, kind, parent)),
    ],
    children: [
      ...Option.toArray(text).map((value): Child => ({ cdata: false, kind: "text", value })),
      ...children,
    ],
    kind: "element",
    local: name.local,
    namespace: name.namespace,
    prefix: "",
    qname: name.local,
  };
};

/**
 * Fill each `xs:IDREF` and `xs:IDREFS` attribute of a built tree with the document's first
 * `xs:ID`, so it names one; one in a document that holds no `xs:ID` takes `a1`, which names none.
 *
 * @param root - The tree.
 * @param ids - The `xs:ID` values the tree holds.
 * @returns The tree.
 */
const referenced = (root: Element, ids: readonly string[]): Element => {
  const target = ids[0] ?? "a1";
  const fill = (element: Element): Element => ({
    ...element,
    attributes: element.attributes.map((attribute) =>
      attribute.value === unreferenced ? { ...attribute, value: target } : attribute,
    ),
    children: element.children.map((child) => (child.kind === "element" ? fill(child) : child)),
  });

  return fill(root);
};

/**
 * Build one document of a root kind in a version.
 *
 * @param reading - The reading.
 * @param version - The version.
 * @param root - The root's kind.
 * @param walker - How each family walks.
 * @returns The document.
 */
const documentOf = (
  reading: Reading,
  version: SchemaVersion,
  root: ElementKind<Composed>,
  walker: Walker,
): XmlDocument => {
  const build: Build = { ids: [], reading, used: new Map(), version, walker };
  const name = reading.generator.names.get(root) ?? { local: root, namespace: "" };
  const tree = elementOf(build, root, "document", new Set(), name, "", 0);

  return {
    charset: "utf-8",
    declaration: Option.none(),
    doctype: Option.none(),
    epilog: [],
    prolog: [],
    root: referenced(tree, build.ids),
  };
};

/**
 * How deep a covering document varies its families: below it every family is minimal.
 */
export const coveringDepth = 4;

/**
 * The most families a covering document varies before every later one is minimal, so one document
 * stays a few hundred nodes.
 */
const coveringFamilies = 160;

/**
 * The most covering documents one root and version yields.
 */
const coveringDocuments = 12;

/**
 * Build a root's covering documents in a version: each varies its families down to
 * {@link coveringDepth}, each the cheapest accepting word through the first position of its model
 * no earlier document passed, until a document passes no new position or
 * {@link coveringDocuments} are built.
 *
 * @param reading - The reading.
 * @param version - The version.
 * @param root - The root's kind.
 * @returns The documents, named.
 */
const coveringOf = (
  reading: Reading,
  version: SchemaVersion,
  root: ElementKind<Composed>,
): readonly Lawful[] => {
  const passed = new Set<string>();
  const made: Lawful[] = [];
  for (let count = 0; count < coveringDocuments; count += 1) {
    const before = passed.size;
    let varied = 0;
    const doc = documentOf(reading, version, root, (kind, depth, family, costs) => {
      const next = family.positions.find(
        (position) => costs.has(position) && !passed.has(`${kind} ${String(position)}`),
      );
      if (depth >= coveringDepth || varied >= coveringFamilies || next === undefined) {
        return minimal;
      }

      varied += 1;
      const walk: Walk = { _tag: "through", position: next };
      for (const position of Option.getOrElse(wordOf(family.automaton, costs, walk), () => [])) {
        passed.add(`${kind} ${String(position)}`);
      }

      return walk;
    });
    if (passed.size === before) {
      break;
    }

    made.push({ doc, name: `lawful ${root} covering #${String(count)} in ${version}` });
  }

  return made;
};

/**
 * Build the lawful documents of a grammar: for each version and each root kind `rooted` keeps, the
 * minimal document, the root probes and the covering documents, a document several versions build
 * alike once; the minimal documents first, then the root probes, then the covering documents.
 *
 * @param grammar - The composed grammar.
 * @param rooted - Whether a root kind's documents are built.
 * @returns The documents, named.
 */
export const lawfulDocuments = (
  grammar: ComposedGrammar,
  rooted: (kind: string) => boolean,
): readonly Lawful[] => {
  const reading = readingOf(grammar);
  const minimals: Lawful[] = [];
  const probes: Lawful[] = [];
  const covering: Lawful[] = [];
  for (const version of schemaVersions) {
    for (const root of (reading.generator.roots.get(version) ?? []).filter(rooted)) {
      minimals.push({
        doc: documentOf(reading, version, root, () => minimal),
        name: `lawful ${root} minimal in ${version}`,
      });

      const family = familyOf(reading, version, root);
      for (const position of Option.match(family, {
        onNone: () => [],
        onSome: ({ positions }) => positions,
      })) {
        const at = Option.match(family, {
          onNone: () => "",
          onSome: ({ kindsAt }) => (kindsAt.get(position) ?? []).join("|"),
        });
        for (const tag of ["stopped", "through"] as const) {
          probes.push({
            doc: documentOf(reading, version, root, (_, depth) =>
              depth === 0 ? { _tag: tag, position } : minimal,
            ),
            name: `lawful ${root} ${tag === "stopped" ? "stopped at" : "through"} ${at} in ${version}`,
          });
        }
      }

      covering.push(...coveringOf(reading, version, root));
    }
  }

  const seen = new Set<string>();

  return [...minimals, ...probes, ...covering].filter(({ doc }) => {
    const text = JSON.stringify(doc.root);
    const fresh = !seen.has(text);
    seen.add(text);

    return fresh;
  });
};
