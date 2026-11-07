/**
 * The genetic search's edits of a package genome: the structural operators that breed a package
 * near its parent, and the named faults, each an invalid case the search draws deliberately so
 * every failing candidate's lineage names its fault.
 *
 * Structural operators (`operators`' first part):
 *
 * - `insert-element`: graft a corpus donor under a parent whose kind the grammar's `Admission` admits
 *   it under, so an insertion builds by construction from parts the corpus holds;
 * - `crossover`: graft a subtree of the mate under an admitting parent, or take one of the mate's
 *   documents with the resource that lists it;
 * - `delete-element`, `move-element`, `duplicate-element`;
 * - `change-attribute` to a value the corpus writes for the same name (a Live value), and
 *   `drop-attribute` and `add-attribute`, an admitted name with a value the corpus writes.
 *
 * Named faults (`faults`): a dangling href (to no entry, to a deleted entry, to the wrong entry,
 * with a fragment), a wrong root type (a resource's type, or a document's root swapped for
 * another kind's), an absent required attribute, a key text at the key-text bound and one byte
 * either side of it, in characters of mixed widths, a cycle of references, a duplicate
 * identifier, a bad lexical form, and a misplaced element (a donor under a parent that does not
 * admit it). The reference graph's shapes (the history's hot spot 6): a diamond (one document
 * placed twice), an `xml:base` on a reference's element, its href rewritten or not, or an href
 * percent-encoded; one path listed under two types; a content packaging element outside the
 * manifest; an include in foreign or wildcard content. And absence (hot spot 8): a present value
 * equal to a sentinel the import or the schema spells (empty, `0`, `none`, `single`, the nil uuid,
 * the document's own identifier).
 *
 * Which operators a run draws, and how often, is its swarm (`@grizzle/testing/swarm`): drawn per
 * run, one operator always on, so no run is left with nothing to breed by.
 */
import { swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import type { Source } from "@grizzle/testing/source";
import { Option } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { admittedOf } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { keyTextBytes } from "#pantry/qti/limits.ts";
import type { Corpus } from "#pantry/test/gen/genetic/corpus.ts";
import { versionOfGenome } from "#pantry/test/gen/genetic/corpus.ts";
import { below, oneOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Edited } from "#pantry/test/gen/genetic/engine.ts";
import {
  attributeValue,
  editAt,
  elementsOf,
  insertAt,
  isDeclaration,
  manifestPath,
  relativeHref,
  resolvedPath,
  selfContained,
  sizeOf,
  withAttribute,
  withEntry,
  withoutAttribute,
  withoutEntry,
  withRoot,
} from "#pantry/test/gen/genetic/genome.ts";
import type { Entry, Genome, Placed } from "#pantry/test/gen/genetic/genome.ts";

/**
 * A generator on the choice stream.
 */
type Gen<A> = (source: Source) => A;

/**
 * The structural operators.
 */
export const structural = [
  "insert-element",
  "crossover",
  "delete-element",
  "move-element",
  "duplicate-element",
  "change-attribute",
  "drop-attribute",
  "add-attribute",
] as const;

/**
 * The named faults: the invalid cases the search draws by name.
 */
export const faults = [
  "dangling-href",
  "wrong-root-type",
  "absent-required-attribute",
  "over-long-key",
  "cycle",
  "duplicate-identifier",
  "bad-lexical",
  "misplaced-element",
  "diamond",
  "xml-base",
  "two-types",
  "cp-outside-manifest",
  "include-in-wildcard",
  "sentinel-value",
] as const;

/**
 * Every operator a run's swarm weighs.
 */
export const operators = [...structural, ...faults] as const;

/**
 * One operator.
 */
export type Operator = (typeof operators)[number];

/**
 * What an edit reads beside the genome: the corpus, the grammar and the run's swarm.
 */
export interface Breeding {
  readonly corpus: Corpus;
  readonly grammar: ComposedGrammar;
  readonly swarm: Swarm<Operator>;
}

/**
 * The attributes that name another entry of the package or a resource: the reference sites a
 * dangling href breaks.
 */
const referenceNames: ReadonlySet<string> = new Set([
  "data",
  "href",
  "identifierref",
  "src",
  "template-location",
]);

/**
 * The kinds whose `href` places another document: the sites a cycle closes.
 */
const placingKinds: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section-ref",
  "qti-assessment-stimulus-ref",
  "xi:include",
]);

/**
 * The attributes that hold an identifier some key or reference reads: the sites a duplicate
 * identifier and an over-long key break.
 */
const identifierNames: ReadonlySet<string> = new Set([
  "id",
  "identifier",
  "identifierref",
  "outcome-identifier",
  "response-identifier",
  "template-identifier",
  "xml:id",
]);

/**
 * The resource types a wrong root type writes beside those the corpus holds: an older QTI's, and
 * none the specification names.
 */
const wildTypes = ["imsqti_item_xmlv2p2", "imsqti_xmlv3p0", "x"] as const;

/**
 * The values a present attribute is set to where a reader may stand one for absence: the empty
 * text, zero, the base type and cardinality a declaration with none is held as, and the nil uuid.
 */
const sentinels = ["", "0", "none", "single", "00000000-0000-0000-0000-000000000000"] as const;

/**
 * The `xml:base` values a reference's element is given: the identity, a subdirectory, its parent,
 * a dot segment pair, and a percent-encoded subdirectory.
 */
const bases = ["./", "sub/", "../", "./sub/../", "%73ub/"] as const;

/**
 * The characters an over-long key is filled with: one, two, three and four UTF-8 bytes each, every
 * one a name character, so a key's bound is met in bytes, never in characters.
 */
const fillers = ["x", "é", "語", "𝔸"] as const;

/**
 * The lexical forms a bad lexical form writes for a value `held`: the empty and blank forms, the
 * value padded, numbers at the edges a decimal or double domain branches on, booleans, dates and
 * durations out of range, names a name domain refuses, and characters XML refuses.
 *
 * @param held - The value as written.
 * @returns The forms.
 */
const lexicalFaults = (held: string): readonly string[] => [
  "",
  " ",
  ` ${held}`,
  `${held} `,
  `\t${held}\n`,
  held.toUpperCase(),
  "0",
  "-1",
  "+1",
  "-0",
  "1.5",
  "1e400",
  "NaN",
  "INF",
  "true",
  "TRUE",
  "2026-02-30",
  "2026-13-01T00:00:00",
  "PT-1S",
  "1abc",
  "a b",
  "a:b",
  " ",
  "\u{1F600}",
  "..",
  "%zz",
  "\u0001",
];

/**
 * One XML document of a genome, with its root's elements.
 */
interface Document {
  readonly elements: readonly Placed[];
  readonly path: string;
  readonly root: Element;
}

/**
 * List a genome's XML documents.
 *
 * @param genome - The genome.
 * @returns Each XML entry as a {@link Document}, in path order.
 */
const documentsOf = (genome: Genome): readonly Document[] =>
  genome.flatMap(({ body, path }) =>
    body.kind === "xml" ? [{ elements: elementsOf(body.doc.root), path, root: body.doc.root }] : [],
  );

/**
 * Rebuild a genome with one document's root replaced.
 *
 * @param genome - The genome.
 * @param path - The document's path.
 * @param root - Its new root.
 * @returns The genome.
 */
const withDocumentRoot = (genome: Genome, path: string, root: Element): Genome =>
  genome.map((entry): Entry =>
    entry.path === path && entry.body.kind === "xml"
      ? { body: { doc: withRoot(entry.body.doc, root), kind: "xml" }, path }
      : entry,
  );

/**
 * One attribute of one element of one document: a site an attribute edit takes.
 */
interface AttributeSite {
  readonly at: Placed;
  readonly document: Document;
  readonly qname: string;
  readonly value: string;
}

/**
 * List every attribute a genome writes that is no namespace declaration, as edit sites.
 *
 * @param genome - The genome.
 * @param keep - Whether a site is one the edit takes.
 * @returns The sites, in document order.
 */
const attributeSites = (
  genome: Genome,
  keep: (site: AttributeSite) => boolean,
): readonly AttributeSite[] =>
  documentsOf(genome).flatMap((document) =>
    document.elements.flatMap((at) =>
      at.element.attributes.flatMap((attribute) => {
        const site = { at, document, qname: attribute.qname, value: attribute.value };

        return !isDeclaration(attribute) && keep(site) ? [site] : [];
      }),
    ),
  );

/**
 * Rebuild a genome with one attribute site's attribute set to a value.
 *
 * @param genome - The genome.
 * @param site - The site.
 * @param value - The new value.
 * @returns The genome.
 */
const atSite = (genome: Genome, site: AttributeSite, value: string): Genome =>
  withDocumentRoot(
    genome,
    site.document.path,
    editAt(site.document.root, site.at.address, (element) => [
      withAttribute(element, site.qname, value),
    ]),
  );

/**
 * Rebuild a genome with one attribute site's attribute left out.
 *
 * @param genome - The genome.
 * @param site - The site.
 * @returns The genome.
 */
const withoutSite = (genome: Genome, site: AttributeSite): Genome =>
  withDocumentRoot(
    genome,
    site.document.path,
    editAt(site.document.root, site.at.address, (element) => [
      withoutAttribute(element, site.qname),
    ]),
  );

/**
 * Name the version the grammar reads a genome's documents in.
 *
 * @param genome - The genome.
 * @returns The manifest's version where the grammar admits it, else `3.0.0`.
 */
const versionIn = (genome: Genome): SchemaVersion =>
  schemaVersions.find((version) => version === versionOfGenome(genome)) ?? "3.0.0";

/**
 * Whether the grammar admits a child kind under a parent kind.
 *
 * @param breeding - The breeding context.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param child - The child's kind.
 * @returns Whether `Admission` holds the triple.
 */
const admits = (
  breeding: Breeding,
  version: SchemaVersion,
  parent: string,
  child: string,
): boolean => Option.isSome(breeding.grammar.admission.lookup({ child, parent, version }));

/**
 * Wrap an edit's genome and note as the engine takes them.
 *
 * @param genome - The genome the edit gives.
 * @param note - The edit, its operator first.
 * @returns The edit.
 */
const edited = (genome: Genome, note: string): Option.Option<Edited<Genome>> =>
  Option.some({ genome, note });

/**
 * Graft a donor under a parent drawn among a document's elements that admit (or, for a misplaced
 * element, do not admit) its kind.
 *
 * @param genome - The genome.
 * @param breeding - The breeding context.
 * @param pool - The donors to draw from, by kind.
 * @param admitted - Whether the parent must admit the donor's kind.
 * @param label - The note's operator.
 * @param within - Whether a document is one the graft may go into, by its path.
 * @returns The generator.
 */
const graft =
  (
    genome: Genome,
    breeding: Breeding,
    pool: ReadonlyMap<string, readonly { readonly element: Element; readonly seed: string }[]>,
    admitted: boolean,
    label: string,
    within: (path: string) => boolean = () => true,
  ): Gen<Option.Option<Edited<Genome>>> =>
  (source) => {
    const document = source.draw(oneOf(documentsOf(genome).filter(({ path }) => within(path))));
    const target = document === undefined ? undefined : source.draw(oneOf(document.elements));
    if (document === undefined || target === undefined) {
      return Option.none();
    }

    const version = versionIn(genome);
    const parentKind = breeding.corpus.kindOf(target.element);
    const kinds = [...pool.keys()].filter(
      (kind) => admits(breeding, version, parentKind, kind) === admitted,
    );
    const kind = source.draw(oneOf(kinds));
    const donor = kind === undefined ? undefined : source.draw(oneOf(pool.get(kind) ?? []));
    if (kind === undefined || donor === undefined) {
      return Option.none();
    }

    const at = source.draw(below(target.element.children.length + 1));

    return edited(
      withDocumentRoot(
        genome,
        document.path,
        insertAt(document.root, target.address, at, donor.element),
      ),
      `${label}: ${kind} under ${parentKind} in ${document.path}, from ${donor.seed}`,
    );
  };

/**
 * Take one of the mate's documents into the genome, at its path, with the manifest resource that
 * lists it in the mate put in the genome's manifest's resources.
 *
 * @param genome - The genome.
 * @param mate - The mate.
 * @returns The generator.
 */
const documentCrossover =
  (genome: Genome, mate: Genome): Gen<Option.Option<Edited<Genome>>> =>
  (source) => {
    const taken = source.draw(oneOf(mate.filter(({ path }) => path !== manifestPath)));
    const own = documentsOf(genome).find(({ path }) => path === manifestPath);
    const theirs = documentsOf(mate).find(({ path }) => path === manifestPath);
    if (taken === undefined || own === undefined || theirs === undefined) {
      return Option.none();
    }

    const listing = theirs.elements.find(
      ({ element }) =>
        element.local === "resource" &&
        elementsOf(element).some(
          ({ element: file }) => attributeValue(file, "href") === taken.path,
        ),
    );
    const resources = own.elements.find(({ element }) => element.local === "resources");
    const manifest =
      listing === undefined || resources === undefined
        ? own.root
        : insertAt(
            own.root,
            resources.address,
            resources.element.children.length,
            selfContained(listing.element),
          );

    return edited(
      withDocumentRoot(withEntry(genome, taken), manifestPath, manifest),
      `crossover: the mate's ${taken.path}${listing === undefined ? ", unlisted" : " with its resource"}`,
    );
  };

/**
 * The edits by operator, each a generator of its edit of `genome`, none where the genome has no
 * site for it.
 */
const operations: Readonly<
  Record<
    Operator,
    (genome: Genome, mate: Genome, breeding: Breeding) => Gen<Option.Option<Edited<Genome>>>
  >
> = {
  "absent-required-attribute": (genome, _mate, breeding) => (source) => {
    const version = versionIn(genome);
    const site = source.draw(
      oneOf(
        attributeSites(genome, ({ at, qname }) =>
          admittedOf(
            breeding.grammar.attributes,
            breeding.grammar.kinds.attributeName,
            version,
            breeding.corpus.kindOf(at.element),
          ).some(({ name, use }) => use === "required" && name === qname),
        ),
      ),
    );

    return site === undefined
      ? Option.none()
      : edited(
          withoutSite(genome, site),
          `absent-required-attribute: ${site.qname} of ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path}`,
        );
  },
  "add-attribute": (genome, _mate, breeding) => (source) => {
    const document = source.draw(oneOf(documentsOf(genome)));
    const at = document === undefined ? undefined : source.draw(oneOf(document.elements));
    if (document === undefined || at === undefined) {
      return Option.none();
    }

    const kind = breeding.corpus.kindOf(at.element);
    const names = admittedOf(
      breeding.grammar.attributes,
      breeding.grammar.kinds.attributeName,
      versionIn(genome),
      kind,
    )
      .map(({ name }) => name)
      .filter(
        (name) =>
          /^(?:xml:)?[A-Za-z][\w.-]*$/u.test(name) &&
          attributeValue(at.element, name) === undefined,
      );
    const name = source.draw(oneOf(names));
    if (name === undefined) {
      return Option.none();
    }

    const value = source.draw(oneOf(breeding.corpus.values.get(name) ?? [])) ?? "x";
    const site = { at, document, qname: name, value };

    return edited(
      atSite(genome, site, value),
      `add-attribute: ${name}="${value}" on ${kind} in ${document.path}`,
    );
  },
  "bad-lexical": (genome, _mate, breeding) => (source) => {
    if (source.pick(0, 2) > 0) {
      const site = source.draw(oneOf(attributeSites(genome, () => true)));
      const value = site === undefined ? undefined : source.draw(oneOf(lexicalFaults(site.value)));

      return site === undefined || value === undefined
        ? Option.none()
        : edited(
            atSite(genome, site, value),
            `bad-lexical: ${site.qname}=${JSON.stringify(value)} on ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path}`,
          );
    }

    const document = source.draw(oneOf(documentsOf(genome)));
    const texted = (document?.elements ?? []).filter(({ element }) =>
      element.children.some((child) => child.kind === "text" && child.value.trim() !== ""),
    );
    const at = source.draw(oneOf(texted));
    if (document === undefined || at === undefined) {
      return Option.none();
    }

    const held = at.element.children.find((child) => child.kind === "text");
    const value = source.draw(oneOf(lexicalFaults(held?.kind === "text" ? held.value : ""))) ?? "";

    return edited(
      withDocumentRoot(
        genome,
        document.path,
        editAt(document.root, at.address, (element) => [
          {
            ...element,
            children: element.children.map((child) =>
              child === held && child.kind === "text" ? { ...child, value } : child,
            ),
          },
        ]),
      ),
      `bad-lexical: the text of ${breeding.corpus.kindOf(at.element)} as ${JSON.stringify(value)} in ${document.path}`,
    );
  },
  "change-attribute": (genome, _mate, breeding) => (source) => {
    const site = source.draw(
      oneOf(
        attributeSites(genome, ({ qname, value }) =>
          (breeding.corpus.values.get(qname) ?? []).some((held) => held !== value),
        ),
      ),
    );
    const value =
      site === undefined
        ? undefined
        : source.draw(
            oneOf(
              (breeding.corpus.values.get(site.qname) ?? []).filter((held) => held !== site.value),
            ),
          );

    return site === undefined || value === undefined
      ? Option.none()
      : edited(
          atSite(genome, site, value),
          `change-attribute: ${site.qname}="${value}" on ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path}`,
        );
  },
  "cp-outside-manifest": (genome, _mate, breeding) => {
    const cp = new Map([...breeding.corpus.donors].filter(([kind]) => kind.startsWith("cp:")));
    const roots = new Map([...breeding.corpus.roots].filter(([kind]) => kind.startsWith("cp:")));

    return (source) => {
      if (source.pick(0, 1) === 0) {
        const document = source.draw(
          oneOf(documentsOf(genome).filter(({ path }) => path !== manifestPath)),
        );
        const root = source.draw(oneOf([...roots.values()].flat()));

        return document === undefined || root === undefined
          ? Option.none()
          : edited(
              withDocumentRoot(genome, document.path, root.element),
              `cp-outside-manifest: ${document.path}'s root is ${root.kind}, from ${root.seed}`,
            );
      }

      return source.draw(
        graft(
          genome,
          breeding,
          cp,
          source.pick(0, 1) === 1,
          "cp-outside-manifest",
          (path) => path !== manifestPath,
        ),
      );
    };
  },
  crossover: (genome, mate, breeding) => (source) => {
    if (source.pick(0, 2) === 0) {
      return source.draw(documentCrossover(genome, mate));
    }

    const donors = new Map<string, { readonly element: Element; readonly seed: string }[]>();
    for (const document of documentsOf(mate)) {
      for (const { address, element } of document.elements) {
        if (address.length > 0 && sizeOf(element) <= 24) {
          const kind = breeding.corpus.kindOf(element);
          donors.set(kind, [
            ...(donors.get(kind) ?? []),
            { element: selfContained(element), seed: `the mate's ${document.path}` },
          ]);
        }
      }
    }

    return source.draw(graft(genome, breeding, donors, true, "crossover"));
  },
  cycle: (genome, _mate, breeding) => (source) => {
    const site = source.draw(
      oneOf(
        attributeSites(
          genome,
          ({ at, qname }) =>
            qname === "href" && placingKinds.has(breeding.corpus.kindOf(at.element)),
        ),
      ),
    );
    if (site === undefined) {
      return Option.none();
    }

    const referrers = documentsOf(genome).filter(({ elements, path }) =>
      elements.some(({ element }) => {
        const href = attributeValue(element, "href");

        return href !== undefined && resolvedPath(path, href) === site.document.path;
      }),
    );
    const back = source.pick(0, 1) === 1 ? source.draw(oneOf(referrers)) : undefined;
    const target = back?.path ?? site.document.path;

    return edited(
      atSite(genome, site, relativeHref(site.document.path, target)),
      `cycle: ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path} places ${target === site.document.path ? "its own document" : target}`,
    );
  },
  "dangling-href": (genome, _mate, breeding) => (source) => {
    const site = source.draw(
      oneOf(attributeSites(genome, ({ qname }) => referenceNames.has(qname))),
    );
    if (site === undefined) {
      return Option.none();
    }

    const kind = breeding.corpus.kindOf(site.at.element);
    const named = resolvedPath(site.document.path, site.value);
    const variant = source.pick(0, 3);
    if (
      variant === 1 &&
      named !== undefined &&
      named !== manifestPath &&
      genome.some(({ path }) => path === named)
    ) {
      return edited(
        withoutEntry(genome, named),
        `dangling-href: ${named}, which ${kind} in ${site.document.path} names, deleted`,
      );
    }

    if (variant === 2) {
      const other = source.draw(
        oneOf(genome.filter(({ path }) => path !== named && path !== site.document.path)),
      );
      if (other !== undefined) {
        return edited(
          atSite(genome, site, relativeHref(site.document.path, other.path)),
          `dangling-href: ${kind} in ${site.document.path} names ${other.path}`,
        );
      }
    }

    const missing =
      site.qname === "identifierref"
        ? `${site.value}-missing`
        : `${site.value.slice(0, site.value.lastIndexOf("/") + 1)}missing.xml`;
    const value =
      variant === 3 && site.qname !== "identifierref" ? `${site.value}#fragment` : missing;

    return edited(
      atSite(genome, site, value),
      `dangling-href: ${kind} in ${site.document.path} names ${value}`,
    );
  },
  "delete-element": (genome, _mate, breeding) => (source) => {
    const document = source.draw(oneOf(documentsOf(genome)));
    const at = source.draw(
      oneOf((document?.elements ?? []).filter(({ address }) => address.length > 0)),
    );

    return document === undefined || at === undefined
      ? Option.none()
      : edited(
          withDocumentRoot(
            genome,
            document.path,
            editAt(document.root, at.address, () => []),
          ),
          `delete-element: ${breeding.corpus.kindOf(at.element)} in ${document.path}`,
        );
  },
  diamond: (genome, _mate, breeding) => (source) => {
    const site = source.draw(
      oneOf(
        attributeSites(
          genome,
          ({ at, qname }) =>
            qname === "href" &&
            at.address.length > 0 &&
            placingKinds.has(breeding.corpus.kindOf(at.element)),
        ),
      ),
    );

    return site === undefined
      ? Option.none()
      : edited(
          withDocumentRoot(
            genome,
            site.document.path,
            editAt(site.document.root, site.at.address, (element) => [
              element,
              withoutAttribute(element, "identifier"),
            ]),
          ),
          `diamond: ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path} places ${site.value} twice`,
        );
  },
  "drop-attribute": (genome, _mate, breeding) => (source) => {
    const site = source.draw(oneOf(attributeSites(genome, () => true)));

    return site === undefined
      ? Option.none()
      : edited(
          withoutSite(genome, site),
          `drop-attribute: ${site.qname} of ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path}`,
        );
  },
  "duplicate-element": (genome, _mate, breeding) => (source) => {
    const document = source.draw(oneOf(documentsOf(genome)));
    const at = source.draw(
      oneOf((document?.elements ?? []).filter(({ address }) => address.length > 0)),
    );

    return document === undefined || at === undefined
      ? Option.none()
      : edited(
          withDocumentRoot(
            genome,
            document.path,
            editAt(document.root, at.address, (element) => [element, element]),
          ),
          `duplicate-element: ${breeding.corpus.kindOf(at.element)} in ${document.path}`,
        );
  },
  "duplicate-identifier": (genome, _mate, breeding) => (source) => {
    const sites = attributeSites(genome, ({ qname }) => identifierNames.has(qname));
    const first = source.draw(oneOf(sites));
    if (first === undefined) {
      return Option.none();
    }

    const sameKind = source.pick(0, 2) > 0;
    const second = source.draw(
      oneOf(
        sites.filter(
          (site) =>
            site.qname === first.qname &&
            site.value !== first.value &&
            (!sameKind ||
              breeding.corpus.kindOf(site.at.element) === breeding.corpus.kindOf(first.at.element)),
        ),
      ),
    );

    return second === undefined
      ? Option.none()
      : edited(
          atSite(genome, second, first.value),
          `duplicate-identifier: ${second.qname}="${first.value}" on ${breeding.corpus.kindOf(second.at.element)} in ${second.document.path}, as ${breeding.corpus.kindOf(first.at.element)} in ${first.document.path}`,
        );
  },
  "include-in-wildcard": (genome, _mate, breeding) => (source) => {
    const includes = breeding.corpus.donors.get("xi:include") ?? [];
    const document = source.draw(
      oneOf(documentsOf(genome).filter(({ path }) => path !== manifestPath)),
    );
    const hosts = (document?.elements ?? []).filter(({ element }) => {
      const kind = breeding.corpus.kindOf(element);

      return kind.startsWith("{") || /custom|markup|annotation|semantics|stylesheet/u.test(kind);
    });
    const host = source.draw(oneOf(hosts));
    const include = source.draw(oneOf(includes));
    const target = source.draw(
      oneOf(genome.filter(({ path }) => path !== manifestPath && path !== document?.path)),
    );
    if (document === undefined || host === undefined || include === undefined) {
      return Option.none();
    }

    const href = target === undefined ? "fragment.xml" : relativeHref(document.path, target.path);
    const at = source.draw(below(host.element.children.length + 1));

    return edited(
      withDocumentRoot(
        genome,
        document.path,
        insertAt(document.root, host.address, at, withAttribute(include.element, "href", href)),
      ),
      `include-in-wildcard: an xi:include of ${href} under ${breeding.corpus.kindOf(host.element)} in ${document.path}`,
    );
  },
  "insert-element": (genome, _mate, breeding) =>
    graft(genome, breeding, breeding.corpus.donors, true, "insert-element"),
  "misplaced-element": (genome, _mate, breeding) =>
    graft(genome, breeding, breeding.corpus.donors, false, "misplaced-element"),
  "move-element": (genome, _mate, breeding) => (source) => {
    const document = source.draw(oneOf(documentsOf(genome)));
    const moved = source.draw(
      oneOf((document?.elements ?? []).filter(({ address }) => address.length > 0)),
    );
    if (document === undefined || moved === undefined) {
      return Option.none();
    }

    const kind = breeding.corpus.kindOf(moved.element);
    const without = editAt(document.root, moved.address, () => []);
    const version = versionIn(genome);
    const parents = elementsOf(without);
    const admitting = parents.filter(({ element }) =>
      admits(breeding, version, breeding.corpus.kindOf(element), kind),
    );
    const target = source.draw(oneOf(admitting.length > 0 ? admitting : parents));
    if (target === undefined) {
      return Option.none();
    }

    const at = source.draw(below(target.element.children.length + 1));

    return edited(
      withDocumentRoot(
        genome,
        document.path,
        insertAt(without, target.address, at, selfContained(moved.element)),
      ),
      `move-element: ${kind} under ${breeding.corpus.kindOf(target.element)} in ${document.path}`,
    );
  },
  "over-long-key": (genome, _mate, breeding) => (source) => {
    const bytes = keyTextBytes + source.pick(0, 2) - 1;
    const widths = fillers.map(
      (filler) => [filler, new TextEncoder().encode(filler).length] as const,
    );
    const characters = ["K"];
    for (let held = 1; held < bytes;) {
      const room = bytes - held;
      const [filler, width] = source.draw(oneOf(widths.filter(([, fits]) => fits <= room))) ?? [
        "x",
        1,
      ];
      characters.push(filler);
      held += width;
    }

    const value = characters.join("");

    if (source.pick(0, 2) > 0) {
      const site = source.draw(
        oneOf(
          attributeSites(genome, ({ qname }) => identifierNames.has(qname) || qname === "href"),
        ),
      );

      return site === undefined
        ? Option.none()
        : edited(
            atSite(genome, site, value),
            `over-long-key: ${site.qname} of ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path}, ${String(bytes)} bytes`,
          );
    }

    const document = source.draw(oneOf(documentsOf(genome)));
    const texted = (document?.elements ?? []).filter(({ element }) =>
      element.children.some((child) => child.kind === "text" && child.value.trim() !== ""),
    );
    const at = source.draw(oneOf(texted));
    if (document === undefined || at === undefined) {
      return Option.none();
    }

    return edited(
      withDocumentRoot(
        genome,
        document.path,
        editAt(document.root, at.address, (element) => [
          {
            ...element,
            children: [
              { cdata: false, kind: "text", value },
              ...element.children.filter((child) => child.kind !== "text"),
            ],
          },
        ]),
      ),
      `over-long-key: the text of ${breeding.corpus.kindOf(at.element)} in ${document.path}, ${String(bytes)} bytes`,
    );
  },
  "sentinel-value": (genome, _mate, breeding) => (source) => {
    const site = source.draw(oneOf(attributeSites(genome, () => true)));
    const own = site === undefined ? undefined : attributeValue(site.document.root, "identifier");
    const value = source.draw(oneOf([...sentinels, ...(own === undefined ? [] : [own])]));

    return site === undefined || value === undefined
      ? Option.none()
      : edited(
          atSite(genome, site, value),
          `sentinel-value: ${site.qname}=${JSON.stringify(value)} on ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path}`,
        );
  },
  "two-types": (genome, _mate, breeding) => (source) => {
    const manifest = documentsOf(genome).find(({ path }) => path === manifestPath);
    const resource = source.draw(
      oneOf(
        (manifest?.elements ?? []).filter(
          ({ address, element }) =>
            element.local === "resource" &&
            address.length > 0 &&
            attributeValue(element, "href") !== undefined,
        ),
      ),
    );
    const held = resource === undefined ? undefined : attributeValue(resource.element, "type");
    const type = source.draw(
      oneOf(
        [...(breeding.corpus.values.get("type") ?? []), ...wildTypes].filter(
          (other) => other !== held,
        ),
      ),
    );
    if (manifest === undefined || resource === undefined || type === undefined) {
      return Option.none();
    }

    const twin = withAttribute(
      withAttribute(resource.element, "type", type),
      "identifier",
      `${attributeValue(resource.element, "identifier") ?? "resource"}-twin`,
    );

    return edited(
      withDocumentRoot(
        genome,
        manifestPath,
        editAt(manifest.root, resource.address, (element) => [element, twin]),
      ),
      `two-types: ${attributeValue(resource.element, "href") ?? ""} listed as ${held ?? "no type"} and ${type}`,
    );
  },
  "wrong-root-type": (genome, _mate, breeding) => (source) => {
    if (source.pick(0, 1) === 0) {
      const site = source.draw(
        oneOf(
          attributeSites(
            genome,
            ({ at, qname }) => qname === "type" && at.element.local === "resource",
          ),
        ),
      );
      const types = [...(breeding.corpus.values.get("type") ?? []), ...wildTypes].filter(
        (type) => type !== site?.value,
      );
      const type = source.draw(oneOf(types));

      return site === undefined || type === undefined
        ? Option.none()
        : edited(
            atSite(genome, site, type),
            `wrong-root-type: a resource of type ${type} in ${site.document.path}`,
          );
    }

    const document = source.draw(
      oneOf(documentsOf(genome).filter(({ path }) => path !== manifestPath)),
    );
    const held = document === undefined ? "" : breeding.corpus.kindOf(document.root);
    const kind = source.draw(
      oneOf([...breeding.corpus.roots.keys()].filter((root) => root !== held)),
    );
    const root =
      kind === undefined ? undefined : source.draw(oneOf(breeding.corpus.roots.get(kind) ?? []));

    return document === undefined || root === undefined
      ? Option.none()
      : edited(
          withDocumentRoot(genome, document.path, root.element),
          `wrong-root-type: ${document.path}'s ${held} root swapped for ${kind}, from ${root.seed}`,
        );
  },
  "xml-base": (genome, _mate, breeding) => (source) => {
    const site = source.draw(
      oneOf(
        attributeSites(
          genome,
          ({ qname }) => referenceNames.has(qname) && qname !== "identifierref",
        ),
      ),
    );
    const base = source.draw(oneOf(bases)) ?? "./";
    if (site === undefined) {
      return Option.none();
    }

    const named = resolvedPath(site.document.path, site.value);
    const variant = source.pick(0, 2);
    if (variant === 2) {
      const encoded = site.value.replace(
        /[a-z.]/u,
        (character) => `%${(character.codePointAt(0) ?? 0).toString(16).toUpperCase()}`,
      );

      return edited(
        atSite(genome, site, encoded),
        `xml-base: ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path} names ${encoded}, percent-encoded`,
      );
    }

    const rebased = editAt(site.document.root, site.at.address, (element) => [
      withAttribute(
        withAttribute(element, "xml:base", base),
        site.qname,
        variant === 1 && named !== undefined && !base.includes("%")
          ? relativeHref(
              `${site.document.path.slice(0, site.document.path.lastIndexOf("/") + 1)}${base}x`,
              named,
            )
          : site.value,
      ),
    ]);

    return edited(
      withDocumentRoot(genome, site.document.path, rebased),
      `xml-base: xml:base="${base}" on ${breeding.corpus.kindOf(site.at.element)} in ${site.document.path}, its ${site.qname} ${variant === 1 ? "rewritten to name what it named" : "kept"}`,
    );
  },
};

/**
 * The most operators one edit tries before it gives up on a genome that offers none of them a
 * site.
 */
const attempts = 4;

/**
 * Draw one edit of a genome: an operator by the run's swarm, then its edit, trying another operator
 * where the drawn one has no site.
 *
 * @param breeding - The breeding context.
 * @returns The engine's `mutate`.
 */
export const mutationOf =
  (breeding: Breeding) =>
  (genome: Genome, mate: Genome): Gen<Option.Option<Edited<Genome>>> =>
  (source) => {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const operator = source.draw(swarmChoice(breeding.swarm, operators));
      const result = source.draw(operations[operator](genome, mate, breeding));
      if (Option.isSome(result)) {
        return result;
      }
    }

    return Option.none();
  };
