/**
 * The genetic search's seed population and the dictionaries its mutations draw from, built once per
 * process and the same on every run, so a search's seed alone fixes what it breeds.
 *
 * The seeds are packages the repository already generates or keeps, valid ones and their named
 * breakages alike:
 *
 * - The every-relation package (`#pantry/test/gen/every-relation.ts`) at its smallest and largest
 *   member counts, whose import writes a row of every stored relation;
 * - R87's assembly packages (`#pantry/test/gen/assembly.ts`), tests whose sections, refs and branch
 *   rules place items across documents, sampled on a stream this module's label fixes;
 * - The packaging fixtures (`#pantry/test/oracle-verdict.ts` `packagingFixtures`), the spec's 4.12 to
 *   4.14 positives and their hand-broken copies.
 *
 * Every element of every seed small enough to graft is a donor, indexed by its kind
 * ({@link kindOf}), so an insertion builds by construction from parts the corpus holds, under a
 * parent the grammar's `Admission` admits them in. Every attribute value a seed writes is a word of
 * the dictionary of its attribute's name, the values the code branches on.
 */
import { NodeServices } from "@effect/platform-node";
import { floorSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { Effect, Option } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { readEntries } from "#pantry/package/read.ts";
import {
  assemblyPackage,
  sampledBounds,
  smallAssembly,
  swarmedAssembly,
} from "#pantry/test/gen/assembly.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import {
  elementsOf,
  genomeOf,
  isDeclaration,
  manifestPath,
  selfContained,
  sizeOf,
} from "#pantry/test/gen/genetic/genome.ts";
import type { Genome } from "#pantry/test/gen/genetic/genome.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { packagingFixtures } from "#pantry/test/oracle-verdict.ts";

/**
 * One package of the seed population: where it comes from, and its genome.
 */
export interface Seed {
  readonly genome: Genome;
  readonly name: string;
}

/**
 * A subtree the search may graft: the element made to stand on its own, its kind, and the seed it
 * comes from.
 */
export interface Donor {
  readonly element: Element;
  readonly kind: string;
  readonly seed: string;
}

/**
 * The seed population and what its mutations draw from:
 *
 * - `donors`, every graftable subtree by its kind, and `kinds`, the kinds that have one;
 * - `roots`, every document root of a seed by its kind, the roots a wrong root type swaps in;
 * - `values`, every attribute value the seeds write, by the attribute's name as written;
 * - `kindOf`, an element's kind as the grammar names it.
 */
export interface Corpus {
  readonly donors: ReadonlyMap<string, readonly Donor[]>;
  readonly kindOf: (element: Element) => string;
  readonly kinds: readonly string[];
  readonly roots: ReadonlyMap<string, readonly Donor[]>;
  readonly seeds: readonly Seed[];
  readonly values: ReadonlyMap<string, readonly string[]>;
}

/**
 * The most elements a donor holds: grafts stay small, so a mutant stays near its parent.
 */
const largestDonor = 24;

/**
 * The most values the dictionary keeps for one attribute name, the first ones in seed order.
 */
const valuesPerName = 48;

/**
 * The label whose floor stream samples the assembly seeds, so they are the same on every run.
 */
const assemblyLabel = "pantry/genetic-corpus";

/**
 * Name an element's kind as the grammar's `ElementName` does: the kind written with its namespace
 * and local name, or `{namespace}local` for a name the grammar holds no kind of.
 *
 * @param grammar - The composed grammar.
 * @returns The namer.
 */
export const kindNamer = (grammar: ComposedGrammar): ((element: Element) => string) => {
  const byName = new Map(
    grammar.kinds.elementName.rows.map(({ kind, local, namespace }) => [
      `{${namespace}}${local}`,
      kind,
    ]),
  );

  return (element) => {
    const name = `{${element.namespace}}${element.local}`;

    return byName.get(name) ?? name;
  };
};

/**
 * Read a packaging fixture's entries from its materialized directory.
 *
 * @param name - The fixture.
 * @returns Its entries by path.
 */
const fixtureEntries = Effect.fnUntraced(function* fixtureEntries(
  name: (typeof packagingFixtures)[number],
) {
  const files = yield* readEntries(yield* materialize(name));

  return new Map(files.map(({ bytes, path }) => [path, bytes]));
});

/**
 * Index a seed population: every graftable subtree of its documents by kind, every document root
 * by kind, and every attribute value by its name.
 *
 * @param grammar - The composed grammar, which names each element's kind.
 * @param seeds - The seeds.
 * @returns The corpus over them.
 */
export const corpusFrom = (grammar: ComposedGrammar, seeds: readonly Seed[]): Corpus => {
  const kindOf = kindNamer(grammar);
  const donors = new Map<string, Donor[]>();
  const roots = new Map<string, Donor[]>();
  const values = new Map<string, string[]>();
  const seen = new Set<string>();
  const add = (index: Map<string, Donor[]>, donor: Donor): void => {
    const known = `${donor.kind}\u0000${JSON.stringify(donor.element)}`;
    if (!seen.has(known)) {
      seen.add(known);
      index.set(donor.kind, [...(index.get(donor.kind) ?? []), donor]);
    }
  };
  for (const { genome, name } of seeds) {
    for (const { body } of genome) {
      if (body.kind === "xml") {
        add(roots, {
          element: selfContained(body.doc.root),
          kind: kindOf(body.doc.root),
          seed: name,
        });
        for (const { address, element } of elementsOf(body.doc.root)) {
          for (const attribute of element.attributes) {
            const held = values.get(attribute.qname) ?? [];
            if (
              !isDeclaration(attribute) &&
              held.length < valuesPerName &&
              !held.includes(attribute.value)
            ) {
              values.set(attribute.qname, [...held, attribute.value]);
            }
          }

          if (address.length > 0 && sizeOf(element) <= largestDonor) {
            add(donors, { element: selfContained(element), kind: kindOf(element), seed: name });
          }
        }
      }
    }
  }

  return { donors, kindOf, kinds: [...donors.keys()].toSorted(), roots, seeds, values };
};

/**
 * Build the seed population and its dictionaries.
 *
 * @param grammar - The composed grammar, which names each element's kind.
 * @returns The corpus; a fixture that cannot be materialized or read fails it.
 */
export const corpusOf = Effect.fn("genetic.corpusOf")(function* corpusOf(grammar: ComposedGrammar) {
  const sampled = floorSeed(assemblyLabel);
  const generated: readonly (readonly [string, PackageEntries])[] = [
    ["every-relation(2,1,1)", everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 })],
    ["every-relation(3,2,2)", everyRelationPackage({ choices: 3, hotspots: 2, hottexts: 2 })],
    ...sample(smallAssembly, sampled, 4).map(
      (assembly, at) => [`small-assembly#${String(at)}`, assemblyPackage(assembly)] as const,
    ),
    ...sample(swarmedAssembly(sampledBounds), sampled, 8).map(
      ({ assembly }, at) => [`assembly#${String(at)}`, assemblyPackage(assembly)] as const,
    ),
  ];
  const fixtures = yield* Effect.forEach([...packagingFixtures], (name) =>
    Effect.map(fixtureEntries(name), (entries) => [`fixture ${name}`, entries] as const),
  ).pipe(Effect.provide(NodeServices.layer));
  const seeds = yield* Effect.forEach([...generated, ...fixtures], ([name, entries]) =>
    Effect.map(genomeOf(entries), (genome): Seed => ({ genome, name })),
  );

  return corpusFrom(grammar, seeds);
});

/**
 * Find the schema version a genome's manifest declares, `3.0.0` when it declares none the search
 * can read.
 *
 * @param genome - The genome.
 * @returns The version's text.
 */
export const versionOfGenome = (genome: Genome): string => {
  const manifest = genome.find(({ path }) => path === manifestPath);
  if (manifest?.body.kind !== "xml") {
    return "3.0.0";
  }

  const declared = Option.fromUndefinedOr(
    elementsOf(manifest.body.doc.root).find(({ element }) => element.local === "schemaversion"),
  );

  return Option.match(declared, {
    onNone: () => "3.0.0",
    onSome: ({ element }) =>
      element.children
        .map((child) => (child.kind === "text" ? child.value : ""))
        .join("")
        .trim() || "3.0.0",
  });
};
