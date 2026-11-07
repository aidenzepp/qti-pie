/**
 * The genetic search over single QTI documents that the grammar and `xmllint` judge (lane GEN-B):
 * the genome, its edits, its features and its reduction.
 *
 * A genome is one document as a one-entry package genome (`#pantry/test/gen/genetic/genome.ts`),
 * so the package search's own edits (`#pantry/test/gen/genetic/mutate.ts`) breed it, beside the
 * document's named invalid cases no package edit makes ({@link documentFaults}): a wrong
 * namespace, an unknown attribute, a missing required child, stray text, a foreign child and two
 * children swapped. Each genome carries the swarm its edits are drawn under, inherited by its
 * children and now and then drawn afresh, so a population holds lopsided operator mixes side by
 * side and the weights are a value of the search, never a constant of the suite.
 *
 * The features are the grain the two oracles branch at: each content-automaton step a family
 * takes and each state a family ends in (`step`: parent kind, the state before, the child's kind;
 * a kind and its last child's state, 0 for an empty family), each attribute's domain verdict
 * (`domain`: owner kind, attribute, in or out), each class of `xmllint`'s messages on each element
 * (`xsd`), each law the oracle refused by, on each kind (`law`), each pair of verdicts in each
 * version (`verdict`), and each named edit with the verdicts it led to (`edit`).
 */
import { Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import type { Source } from "@grizzle/testing/source";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { below, oneOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Edited } from "#pantry/test/gen/genetic/engine.ts";
import {
  editAt,
  elementsOf,
  insertAt,
  isDeclaration,
  selfContained,
} from "#pantry/test/gen/genetic/genome.ts";
import type { Genome, Placed } from "#pantry/test/gen/genetic/genome.ts";
import { mutationOf } from "#pantry/test/gen/genetic/mutate.ts";
import type { Breeding, Operator } from "#pantry/test/gen/genetic/mutate.ts";
import { classOfMessage } from "#pantry/test/xsd-catalog.ts";
import type { Comparison, LawJudgment } from "#pantry/test/xsd-catalog.ts";
import type { XsdVerdict } from "#pantry/xml/oracle.ts";

/**
 * A generator on the choice stream.
 */
type Gen<A> = (source: Source) => A;

/**
 * The path of the one entry a document genome holds.
 */
export const documentPath = "doc.xml";

/**
 * The package search's operators a document genome breeds by: every structural one, and the named
 * faults that need no manifest and break what an XSD judges (a required attribute, a lexical form,
 * a misplaced element, a repeated `xs:ID`, a root swapped for another's). A dangling href, a cycle
 * and an over-long key are a package's, which no XSD judges, so they are left out.
 */
export const sharedOperators = [
  "insert-element",
  "crossover",
  "delete-element",
  "move-element",
  "duplicate-element",
  "change-attribute",
  "drop-attribute",
  "add-attribute",
  "absent-required-attribute",
  "bad-lexical",
  "misplaced-element",
  "duplicate-identifier",
  "wrong-root-type",
] as const satisfies readonly Operator[];

/**
 * The document's own named invalid cases, which no package edit makes:
 *
 * - `wrong-namespace`: an element renamed into another namespace, or into none, its children kept in
 *   theirs;
 * - `unknown-attribute`: an attribute no schema declares, in no namespace or in one no schema
 *   declares, or another kind's attribute name;
 * - `missing-required-child`: a child the only one of its kind among its siblings dropped, or every
 *   element child;
 * - `stray-text`: character data where the content may hold none;
 * - `foreign-child`: an element of a namespace no schema declares;
 * - `swap-children`: two element children swapped, which a sequence refuses.
 */
export const documentFaults = [
  "wrong-namespace",
  "unknown-attribute",
  "missing-required-child",
  "stray-text",
  "foreign-child",
  "swap-children",
] as const;

/**
 * One operator a document genome's swarm weighs.
 */
export type XsdOperator = (typeof sharedOperators)[number] | (typeof documentFaults)[number];

/**
 * Every operator a document genome's swarm weighs, the shared ones first.
 */
export const xsdOperators: readonly [XsdOperator, ...XsdOperator[]] = [
  ...sharedOperators,
  ...documentFaults,
];

/**
 * A document genome: the document as a one-entry package genome, the root of the seed it was bred
 * from (which the edits' sites are read against), the operators its edits took since that seed,
 * and the swarm its next edits are drawn under.
 */
export interface XsdGenome {
  readonly edits: readonly XsdOperator[];
  readonly genome: Genome;
  readonly seed: Element;
  readonly swarm: Swarm<XsdOperator>;
}

/**
 * Read a document genome's document.
 *
 * @param genome - The genome.
 * @returns The document; a genome whose one entry is bytes is a bug of the edits.
 */
export const documentOf = (genome: XsdGenome): XmlDocument => {
  const entry = genome.genome.find(({ path }) => path === documentPath);
  if (entry?.body.kind !== "xml") {
    throw new Error(`a document genome holds no XML document at ${documentPath}`);
  }

  return entry.body.doc;
};

/**
 * Make a document genome of a seed document.
 *
 * @param doc - The seed document.
 * @param drawn - The swarm its edits are drawn under.
 * @returns The genome, with no edits.
 */
export const seedGenome = (doc: XmlDocument, drawn: Swarm<XsdOperator>): XsdGenome => ({
  edits: [],
  genome: [{ body: { doc, kind: "xml" }, path: documentPath }],
  seed: doc.root,
  swarm: drawn,
});

/**
 * Rebuild a genome with its document's root replaced and an edit appended.
 *
 * @param genome - The genome.
 * @param root - The new root.
 * @param operator - The edit's operator.
 * @returns The genome.
 */
const withDocumentRoot = (genome: XsdGenome, root: Element, operator: XsdOperator): XsdGenome => ({
  ...genome,
  edits: [...genome.edits, operator],
  genome: [{ body: { doc: { ...documentOf(genome), root }, kind: "xml" }, path: documentPath }],
});

/**
 * The namespace no schema declares, which a foreign child and an unknown attribute are written in.
 */
const nowhere = "urn:qti-pie:nowhere";

/**
 * The namespaces a wrong namespace moves an element into: none, every vocabulary's the XSDs
 * declare, and {@link nowhere}.
 */
const otherNamespaces = [
  "",
  "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1",
  "http://ltsc.ieee.org/xsd/LOM",
  "http://www.w3.org/1998/Math/MathML",
  "http://www.w3.org/2001/10/synthesis",
  "http://www.w3.org/2001/XInclude",
  "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0",
  nowhere,
] as const;

/**
 * A namespace declaration.
 *
 * @param prefix - The prefix it binds, empty for the default namespace.
 * @param namespace - The namespace name, empty to undeclare the default.
 * @returns The declaration, as crust reads one.
 */
const declarationOf = (prefix: string, namespace: string): Element["attributes"][number] => ({
  local: prefix === "" ? "xmlns" : prefix,
  namespace: "http://www.w3.org/2000/xmlns/",
  prefix: prefix === "" ? "" : "xmlns",
  qname: prefix === "" ? "xmlns" : `xmlns:${prefix}`,
  references: [],
  value: namespace,
});

/**
 * Rename an element into another namespace, its children kept in theirs: under the prefix `zzn`,
 * bound on the element, or unprefixed with the default namespace undeclared on it for no
 * namespace, each element child made to declare what it relied on above.
 *
 * @param element - The element.
 * @param namespace - The namespace it is moved into.
 * @returns The element.
 */
const renamed = (element: Element, namespace: string): Element => {
  const children = element.children.map((child): Child =>
    child.kind === "element" ? selfContained(child) : child,
  );
  const kept = element.attributes.filter(
    (attribute) =>
      !(isDeclaration(attribute) && (attribute.qname === "xmlns" || attribute.local === "zzn")),
  );

  return namespace === ""
    ? {
        ...element,
        attributes: [declarationOf("", ""), ...kept],
        children,
        namespace,
        prefix: "",
        qname: element.local,
      }
    : {
        ...element,
        attributes: [declarationOf("zzn", namespace), ...kept],
        children,
        namespace,
        prefix: "zzn",
        qname: `zzn:${element.local}`,
      };
};

/**
 * Move an element into another namespace under the name it is written with: its own prefix, or the
 * default namespace for an unprefixed name, bound on it to the other namespace, its children kept
 * in theirs. A reader that matches a kind by its qualified name rather than its expanded one reads
 * it as the kind it was.
 *
 * @param element - The element.
 * @param namespace - The namespace it is moved into; none moves an unprefixed name only.
 * @returns The element.
 */
const rebind = (element: Element, namespace: string): Element =>
  namespace === "" && element.prefix !== ""
    ? renamed(element, namespace)
    : {
        ...element,
        attributes: [
          declarationOf(element.prefix, namespace),
          ...element.attributes.filter(
            (attribute) =>
              !(
                isDeclaration(attribute) &&
                (element.prefix === ""
                  ? attribute.qname === "xmlns"
                  : attribute.local === element.prefix)
              ),
          ),
        ],
        children: element.children.map((child): Child =>
          child.kind === "element" ? selfContained(child) : child,
        ),
        namespace,
      };

/**
 * One of the document's own named faults.
 */
type DocumentFault = (typeof documentFaults)[number];

/**
 * Draw the element a fault is made at: a kind among those the candidates hold, each kind as likely
 * as any other, then one element of that kind, so a kind a document holds once (a section, a
 * declaration) is edited as often as one it holds many times (a paragraph).
 *
 * @param candidates - The elements the fault may be made at.
 * @returns The generator, undefined for no candidate.
 */
const siteOf =
  (candidates: readonly Placed[]): Gen<Placed | undefined> =>
  (source) => {
    const byName = [
      ...Map.groupBy(
        candidates,
        ({ element }) => `{${element.namespace}}${element.local}`,
      ).values(),
    ];

    return source.draw(oneOf(source.draw(oneOf(byName)) ?? []));
  };

/**
 * The attribute an unknown attribute adds, by its arm: a name no schema declares in no namespace,
 * one in a namespace no schema declares with its binding, or another kind's attribute name.
 *
 * @param arm - The arm, 0, 1 or 2.
 * @param name - The other kind's attribute name the third arm writes.
 * @returns The attributes to add.
 */
const unknownAttributes = (arm: number, name: string): Element["attributes"] => {
  if (arm === 0) {
    return [
      {
        local: "zz-undeclared",
        namespace: "",
        prefix: "",
        qname: "zz-undeclared",
        references: [],
        value: "1",
      },
    ];
  }

  if (arm === 1) {
    return [
      declarationOf("zzu", nowhere),
      { local: "a", namespace: nowhere, prefix: "zzu", qname: "zzu:a", references: [], value: "1" },
    ];
  }

  return [{ local: name, namespace: "", prefix: "", qname: name, references: [], value: "1" }];
};

/**
 * Each of the document's own named faults, drawn on a root: the generator of the new root, none
 * where the root has no site for it. `names` are the attribute names the seeds write, which an
 * unknown attribute's third arm takes.
 */
const faultsOf: Readonly<
  Record<DocumentFault, (root: Element, names: readonly string[]) => Gen<Option.Option<Element>>>
> = {
  "foreign-child": (root) => (source) => {
    const at = source.draw(siteOf(elementsOf(root)));

    return at === undefined
      ? Option.none()
      : Option.some(
          insertAt(root, at.address, source.draw(below(at.element.children.length + 1)), {
            attributes: [declarationOf("zz", nowhere)],
            children: [],
            kind: "element",
            local: "stray",
            namespace: nowhere,
            prefix: "zz",
            qname: "zz:stray",
          }),
        );
  },
  "missing-required-child": (root) => (source) => {
    const at = source.draw(
      siteOf(
        elementsOf(root).filter(({ element }) =>
          element.children.some(({ kind }) => kind === "element"),
        ),
      ),
    );
    if (at === undefined) {
      return Option.none();
    }

    const kinds = at.element.children.flatMap((child) =>
      child.kind === "element" ? [`{${child.namespace}}${child.local}`] : [],
    );
    const lone = kinds.filter((kind) => kinds.indexOf(kind) === kinds.lastIndexOf(kind));
    const kind = lone[source.draw(below(lone.length + 1))];

    return Option.some(
      editAt(root, at.address, (element) => [
        {
          ...element,
          children: element.children.filter(
            (child) =>
              child.kind !== "element" ||
              (kind !== undefined && `{${child.namespace}}${child.local}` !== kind),
          ),
        },
      ]),
    );
  },
  "stray-text": (root) => (source) => {
    const at = source.draw(siteOf(elementsOf(root)));

    return at === undefined
      ? Option.none()
      : Option.some(
          insertAt(root, at.address, source.draw(below(at.element.children.length + 1)), {
            cdata: false,
            kind: "text",
            value: "stray",
          }),
        );
  },
  "swap-children": (root) => (source) => {
    const at = source.draw(
      siteOf(
        elementsOf(root).filter(
          ({ element }) => element.children.filter(({ kind }) => kind === "element").length > 1,
        ),
      ),
    );
    if (at === undefined) {
      return Option.none();
    }

    const slots = at.element.children.flatMap((child, index) =>
      child.kind === "element" ? [index] : [],
    );
    const first = source.draw(below(slots.length));
    const second = (first + 1 + source.draw(below(slots.length - 1))) % slots.length;
    const left = slots[first] ?? 0;
    const right = slots[second] ?? 0;

    return Option.some(
      editAt(root, at.address, (element) => [
        {
          ...element,
          children: element.children.map((child, index) => {
            if (index === left) {
              return element.children[right] ?? child;
            }

            return index === right ? (element.children[left] ?? child) : child;
          }),
        },
      ]),
    );
  },
  "unknown-attribute": (root, names) => (source) => {
    const at = source.draw(siteOf(elementsOf(root)));
    const added = unknownAttributes(
      source.draw(below(3)),
      source.draw(oneOf(names)) ?? "zz-undeclared",
    );
    if (
      at === undefined ||
      added.some(({ qname }) => at.element.attributes.some((held) => held.qname === qname))
    ) {
      return Option.none();
    }

    return Option.some(
      editAt(root, at.address, (element) => [
        { ...element, attributes: [...element.attributes, ...added] },
      ]),
    );
  },
  "wrong-namespace": (root) => (source) => {
    const at = source.draw(siteOf(elementsOf(root)));
    const namespace = source.draw(oneOf(otherNamespaces)) ?? nowhere;
    const rebound = source.draw(below(2)) === 1;

    return at === undefined || at.element.namespace === namespace
      ? Option.none()
      : Option.some(
          editAt(root, at.address, (element) => [
            rebound ? rebind(element, namespace) : renamed(element, namespace),
          ]),
        );
  },
};

/**
 * One in how many edits draws the genome's swarm afresh instead of editing its document.
 */
const reswarmOdds = 8;

/**
 * The edits of a document genome: now and then a fresh swarm, otherwise one operator drawn under
 * the genome's swarm, a shared one through the package search's own edits, a document fault
 * through {@link faultsOf}.
 *
 * @param breeding - The package search's breeding context: the corpus built from this search's
 *   seeds, and the grammar. Its swarm is replaced by the drawn operator alone.
 * @returns The mutation the engine breeds by.
 */
export const xsdMutationOf = (breeding: Breeding) => {
  const names = [...breeding.corpus.values.keys()].filter(
    (name) => !name.includes(":") && name !== "xmlns",
  );
  const shared = new Set<XsdOperator>(sharedOperators);

  return (parent: XsdGenome, mate: XsdGenome): Gen<Option.Option<Edited<XsdGenome>>> =>
    (source) => {
      if (source.draw(below(reswarmOdds)) === 0) {
        return Option.some({
          genome: { ...parent, swarm: source.draw(swarm(xsdOperators)) },
          note: "reswarm",
        });
      }

      const operator = source.draw(swarmChoice(parent.swarm, xsdOperators));
      if (shared.has(operator)) {
        const edited = source.draw(
          mutationOf({ ...breeding, swarm: { [operator]: 3 } })(parent.genome, mate.genome),
        );

        return edited.pipe(
          Option.map(({ genome, note }) => ({
            genome: { ...parent, edits: [...parent.edits, operator], genome },
            note,
          })),
        );
      }

      const fault = documentFaults.find((held) => held === operator);
      if (fault === undefined) {
        return Option.none();
      }

      const root = source.draw(faultsOf[fault](documentOf(parent).root, names));

      return root.pipe(
        Option.map((edited) => ({
          genome: withDocumentRoot(parent, edited, operator),
          note: `${fault} in ${documentOf(parent).root.qname}`,
        })),
      );
    };
};

/**
 * The namespaces of the elements an edit changed: where two elements at one address differ in
 * name or attributes, both; where their children differ in number, the parent's and every element
 * of every child subtree on either side, since an edit there may have inserted, removed or edited
 * any of them. A seed and itself give none.
 *
 * @param before - The seed's root.
 * @param after - The bred root.
 * @returns The namespaces.
 */
export const editedNamespaces = (before: Element, after: Element): ReadonlySet<string> => {
  const found = new Set<string>();
  const stack: (readonly [Element, Element])[] = [[before, after]];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const [left, right] = next;
    if (left === right) {
      continue;
    }

    if (
      left.qname !== right.qname ||
      left.namespace !== right.namespace ||
      JSON.stringify(left.attributes) !== JSON.stringify(right.attributes)
    ) {
      found.add(left.namespace);
      found.add(right.namespace);
    }

    if (left.children.length === right.children.length) {
      for (const [index, child] of left.children.entries()) {
        const other = right.children[index];
        if (child.kind === "element" && other?.kind === "element") {
          stack.push([child, other]);
        } else if (JSON.stringify(child) !== JSON.stringify(other)) {
          found.add(right.namespace);
        }
      }
    } else {
      found.add(right.namespace);
      for (const child of [...left.children, ...right.children]) {
        if (child.kind === "element") {
          for (const { element } of elementsOf(child)) {
            found.add(element.namespace);
          }
        }
      }
    }
  }

  return found;
};

/**
 * The feature families: each a set whose Good–Turing residual the search reports.
 */
export const xsdFamilies = ["domain", "edit", "law", "step", "verdict", "xsd"] as const;

/**
 * A feature: its family, then what it names.
 */
export type XsdFeature = `${(typeof xsdFamilies)[number]}:${string}`;

/**
 * Name a feature's family.
 *
 * @param feature - The feature.
 * @returns Its family.
 */
export const xsdFamilyOf = (feature: XsdFeature): string => feature.slice(0, feature.indexOf(":"));

/**
 * The kind a node place names last, as the law oracle writes a place (`/a[0]/b[2]`).
 *
 * @param place - The place.
 * @returns The kind, empty for the document.
 */
const kindAt = (place: string): string => (place.split("/").at(-1) ?? "").replace(/\[\d+\]$/u, "");

/**
 * Fold a document's rows in a version, for its features: none where crust, the codec or a fold
 * refuses it, which the law oracle's judgment states instead.
 *
 * @param bytes - The document.
 * @param version - The version.
 * @param grammar - The composed grammar.
 * @returns The rows.
 */
export const rowsOf = Effect.fnUntraced(function* rowsOf(
  bytes: Uint8Array,
  version: SchemaVersion,
  grammar: ComposedGrammar,
): Effect.fn.Return<Option.Option<FoldedRows<Composed>>> {
  const read = yield* Effect.result(
    Effect.flatMap(readXml(bytes), (xml) => shred(xml, version, shredGrammarOf(grammar))),
  );

  return Result.isFailure(read)
    ? Option.none()
    : Result.getSuccess(fold(read.success, idOf, foldGrammarOf(grammar)));
});

/**
 * The features one judgment of a document in one version shows.
 *
 * @param input - The judgment.
 * @param input.comparison - The two verdicts compared.
 * @param input.edits - The operators the document's edits took since its seed.
 * @param input.law - The law oracle's judgment.
 * @param input.rows - The document's folded rows, none where they do not fold.
 * @param input.version - The version.
 * @param input.xsd - `xmllint`'s verdict.
 * @returns The features.
 */
export const xsdFeaturesOf = (input: {
  readonly comparison: Comparison;
  readonly edits: readonly XsdOperator[];
  readonly law: LawJudgment;
  readonly rows: Option.Option<FoldedRows<Composed>>;
  readonly version: SchemaVersion;
  readonly xsd: XsdVerdict;
}): ReadonlySet<XsdFeature> => {
  const found = new Set<XsdFeature>([`verdict:${input.version} ${input.comparison.verdicts}`]);
  const last = input.edits.at(-1);
  if (last !== undefined) {
    found.add(`edit:${last} ${input.comparison.verdicts}`);
  }

  const outside = new Set(
    input.law.refusals.flatMap(({ detail, law, node }) =>
      law === "value domain" ? [`${kindAt(node)} ${detail.slice(0, detail.indexOf(": "))}`] : [],
    ),
  );
  for (const refusal of input.law.refusals) {
    found.add(`law:${refusal.rule} ${kindAt(refusal.node)}`);
  }

  if (input.xsd._tag === "Invalid") {
    for (const message of input.xsd.messages) {
      found.add(
        `xsd:${Option.getOrElse(classOfMessage(message), () => "warning")} ${Option.getOrElse(message.element, () => message.source)}`,
      );
    }
  }

  if (Option.isSome(input.rows)) {
    const places = new Map<string, string>();
    for (const node of input.rows.value.nodes) {
      const kind: string = node.kind;
      const parent: string = node.parentKind;
      found.add(`step:${parent} ${String(node.was)} ${kind}`);
      found.add(`step:${kind} ends ${String(node.childState)}`);

      places.set(node.id, kind);
    }

    for (const attribute of input.rows.value.attributes) {
      const kind = places.get(attribute.node) ?? "";
      found.add(
        `domain:${kind} ${attribute.name} ${outside.has(`${kind} ${attribute.name}`) ? "out" : "in"}`,
      );
    }
  }

  return found;
};

/**
 * The genomes one cut smaller than a document genome, largest cut first: each element subtree but
 * the root dropped, from the root down, then each attribute that is no namespace declaration, then
 * each run of character data. Each keeps the genome's seed, edits and swarm.
 *
 * @param genome - The genome.
 * @returns The smaller genomes.
 */
export const smallerXsd = (genome: XsdGenome): readonly XsdGenome[] => {
  const { root } = documentOf(genome);
  const placed = elementsOf(root);
  const rebuilt = (next: Element): XsdGenome => ({
    ...genome,
    genome: [
      { body: { doc: { ...documentOf(genome), root: next }, kind: "xml" }, path: documentPath },
    ],
  });
  const subtrees = placed
    .filter(({ address }) => address.length > 0)
    .toSorted((left, right) => elementsOf(right.element).length - elementsOf(left.element).length)
    .map(({ address }) => rebuilt(editAt(root, address, () => [])));
  const attributes = placed.flatMap(({ address, element }) =>
    element.attributes.flatMap((attribute, index) =>
      isDeclaration(attribute)
        ? []
        : [
            rebuilt(
              editAt(root, address, (held) => [
                { ...held, attributes: held.attributes.filter((_, at) => at !== index) },
              ]),
            ),
          ],
    ),
  );
  const texts = placed.flatMap(({ address, element }) =>
    element.children.flatMap((child, index) =>
      child.kind === "element"
        ? []
        : [
            rebuilt(
              editAt(root, address, (held) => [
                { ...held, children: held.children.filter((_, at) => at !== index) },
              ]),
            ),
          ],
    ),
  );

  return [...subtrees, ...attributes, ...texts];
};
