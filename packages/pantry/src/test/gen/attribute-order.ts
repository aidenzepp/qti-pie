/**
 * Attribute order (spec reading 137): packages whose elements' attributes and namespace
 * declarations a test writes in another order, and the orders it draws.
 *
 * XML 1.0 holds that "the order of attribute specifications in a start-tag or empty-element tag is
 * not significant" (§3.1), and the XML Information Set gives an element its attributes and its
 * namespace attributes as two unordered sets (§2.2). The import keeps each family in the order it
 * is written, so the export writes it back so, and no law reads it: a package's verdict is a
 * function of each element's attributes and declarations as sets.
 *
 * A case ({@link OrderCase}) is drawn under its own swarm over {@link orderFeatures}: a base
 * package, the every-relation package (`#pantry/test/gen/every-relation.ts`) or a tree of the one
 * XDM generator (`#pantry/test/gen/xdm.ts`) listed by a manifest of its own, then up to three named
 * edits of its elements' attributes ({@link corruptions}), which break laws of several rules, the
 * codec's among them, and may land on one element. A test reads the package's XML entries with
 * crust ({@link readCase}), draws an order for every element ({@link reordered}), and writes the
 * entries back ({@link filesOf}); crust's writer writes an element's attributes, its namespace
 * declarations among them, in the order its tree holds them.
 */
import { Effect, Option } from "effect";
import type { Array as Arr } from "effect";
import type { Gen } from "@grizzle/testing/gen";
import { int, shuffled } from "@grizzle/testing/gen";
import { keep, swarm, swarmChoice, weightOf } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { encode } from "@qti-pie/crust/encode.ts";
import type { EncodeError } from "@qti-pie/crust/errors.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Attribute, Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { unshred } from "#pantry/model/unshred.ts";
import type { XdmNames } from "#pantry/model/unshred.ts";
import type { XdmDocument } from "#pantry/model/xdm.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { everyRelationPackage, memberCounts } from "#pantry/test/gen/every-relation.ts";
import type { MemberCounts, PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { xdmDocument } from "#pantry/test/gen/xdm.ts";
import { xmlNamespace, xmlnsNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The packages a case is built on: the every-relation package, valid by construction and holding
 * a row of every stored relation, or one tree of the XDM generator, which leaves the laws it does
 * not read to fall where they fall.
 */
export const bases = ["everyRelation", "generated"] as const;

/**
 * The named edits a case makes to its package's attributes, each on one drawn element:
 *
 * - `lexical`: one of its attributes takes a value outside most value domains (an identifier, a
 *   number, a boolean, an enumeration and a language tag all refuse it), so the codec refuses an
 *   `xsi:type` it no longer resolves and a law refuses the rest;
 * - `required`: one of its attributes is removed, which a required one's law refuses;
 * - `unadmitted`: it gains `unadmitted`, a name no element admits, which the codec refuses under
 *   `attribute-admission`;
 * - `dataName`: it gains `data-Name`, a `data-*` name QTI does not allow (spec reading 13), which the
 *   codec refuses under `unmodeled-vocabulary`;
 * - `idref`: it gains an `aria-describedby` naming no ID, which `idref-target` refuses where the
 *   element admits it;
 * - `language`: it gains or takes `xml:lang="!"`, which no BCP 47 tag is;
 * - `declared`: it gains a namespace declaration and an attribute in that namespace, which only an
 *   element whose type has an attribute wildcard admits.
 *
 * An edit that adds a name the element already carries sets that attribute's value instead, so no
 * edit writes a name twice.
 */
export const corruptions = [
  "lexical",
  "required",
  "unadmitted",
  "dataName",
  "idref",
  "language",
  "declared",
] as const;

/**
 * A named edit of {@link corruptions}.
 */
export type Corruption = (typeof corruptions)[number];

/**
 * The orders an element's attributes are written in, one drawn per element of two or more:
 * `shuffled`, any permutation; `reversed`; `rotated`, by a drawn count; and `declarationsLast`,
 * every attribute in its order and then every namespace declaration in its order, which puts each
 * declaration after the attributes whose prefixes it binds.
 */
export const orderings = ["shuffled", "reversed", "rotated", "declarationsLast"] as const;

/**
 * An order of {@link orderings}.
 */
export type Ordering = (typeof orderings)[number];

/**
 * The features a case's swarm weighs: its base, each named edit, `sameElement`, which puts an edit
 * on the element the one before it edited, so two of them break one element, and each order.
 */
export const orderFeatures = [...bases, ...corruptions, "sameElement", ...orderings] as const;

/**
 * A feature of {@link orderFeatures}.
 */
export type OrderFeature = (typeof orderFeatures)[number];

/**
 * A case's base package: the every-relation package of its member counts, or a generated tree,
 * which a manifest of its own lists.
 */
export type Base =
  | { readonly _tag: "everyRelation"; readonly members: MemberCounts }
  | { readonly _tag: "generated"; readonly document: XdmDocument<Composed> };

/**
 * One named edit and where it lands: the XML entry (by path order), the element (in document
 * order) and the attribute slot, each drawn wide and taken modulo what the package holds, so an
 * edit always lands and shrinks toward the manifest's root and its first attribute.
 */
export interface Edit {
  readonly corruption: Corruption;
  readonly document: number;
  readonly element: number;
  readonly slot: number;
}

/**
 * A case: its base package, its edits in order, and the swarm it was drawn under, which the test
 * draws each element's order under too.
 */
export interface OrderCase {
  readonly base: Base;
  readonly edits: readonly Edit[];
  readonly swarm: Swarm<OrderFeature>;
}

/**
 * An entry of a case's package: its path, its bytes as the base writes them, and its crust tree
 * after the case's edits when it is an XML entry.
 */
export interface CaseEntry {
  readonly bytes: Uint8Array;
  readonly path: string;
  readonly tree: Option.Option<XmlDocument>;
}

/**
 * The path of a package's manifest, which the package reader names `manifest`.
 */
const manifestPath = "imsmanifest.xml";

/**
 * The path a generated tree is written at in its package.
 */
const generatedPath = "document.xml";

/**
 * The namespace of the `declared` edit's attribute, which no vocabulary names.
 */
const extraNamespace = "urn:example:attribute-order";

/**
 * The resource type that lists a generated tree, by its root's kind: the four QTI document roots
 * by their own types, and every other root as a fragment (spec reading 116).
 */
const resourceTypes: ReadonlyMap<string, string> = new Map([
  ["qti-assessment-item", "imsqti_item_xmlv3p0"],
  ["qti-assessment-section", "imsqti_section_xmlv3p0"],
  ["qti-assessment-stimulus", "imsqti_stimulus_xmlv3p0"],
  ["qti-assessment-test", "imsqti_test_xmlv3p0"],
]);

/**
 * Write the manifest of a generated tree's package: its schema version, and one resource listing
 * the tree by the type its root's kind takes.
 *
 * @param document - The generated tree.
 * @returns The manifest's text.
 */
const generatedManifest = (document: XdmDocument<Composed>): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="attribute-order">',
    `  <metadata><schema>QTI Package</schema><schemaversion>${document.version}</schemaversion></metadata>`,
    "  <organizations/>",
    "  <resources>",
    `    <resource identifier="generated" type="${resourceTypes.get(document.root.kind) ?? "imsqti_fragment_xmlv3p0"}" href="${generatedPath}">`,
    `      <file href="${generatedPath}"/>`,
    "    </resource>",
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");

/**
 * Generate cases over a grammar: the swarm first, then the base, then the edits.
 *
 * @param grammar - The composed grammar the generated trees are drawn over.
 * @param features - The features the swarm weighs, every one by default; a suite that leaves out
 *   every named edit draws its bases unedited.
 * @returns The generator.
 */
export const orderCase = (
  grammar: ComposedGrammar,
  features: Arr.NonEmptyReadonlyArray<OrderFeature> = orderFeatures,
): Gen<OrderCase> => {
  const generated = xdmDocument(grammar);

  return (source) => {
    const drawn = source.draw(swarm(features));
    const base: Base =
      source.draw(swarmChoice(drawn, bases)) === "everyRelation"
        ? { _tag: "everyRelation", members: source.draw(memberCounts) }
        : { _tag: "generated", document: source.draw(generated).document };
    const edits: Edit[] = [];
    const count = corruptions.some((corruption) => weightOf(drawn, corruption) > 0)
      ? source.draw(int(0, 3))
      : 0;
    for (let at = 0; at < count; at += 1) {
      const corruption = source.draw(swarmChoice(drawn, corruptions));
      const previous = edits.at(-1);
      const place =
        previous !== undefined && source.draw(keep(drawn, "sameElement"))
          ? { document: previous.document, element: previous.element }
          : { document: source.draw(int(0, 15)), element: source.draw(int(0, 999)) };

      edits.push({ corruption, ...place, slot: source.draw(int(0, 15)) });
    }

    return { base, edits, swarm: drawn };
  };
};

/**
 * Name the schema version a case's package declares, which every document of it is read under: the
 * every-relation manifest's 3.0.0, or the generated tree's own.
 *
 * @param orderedCase - The case.
 * @returns The version.
 */
export const caseVersion = (orderedCase: OrderCase): Composed["version"] =>
  orderedCase.base._tag === "everyRelation" ? "3.0.0" : orderedCase.base.document.version;

/**
 * Write a case's base package as its entries.
 *
 * @param base - The base.
 * @param names - The names a generated tree is written under.
 * @returns The entries, keyed by path; fails with crust's `EncodeError` when a generated tree
 *   cannot be written in its export charset, which the generator's UTF-8 trees never meet.
 */
const baseEntries = (
  base: Base,
  names: XdmNames<Composed>,
): Effect.Effect<PackageEntries, EncodeError> =>
  base._tag === "everyRelation"
    ? Effect.succeed(everyRelationPackage(base.members))
    : Effect.map(
        unshred(base.document, names),
        (bytes): PackageEntries =>
          new Map([
            [manifestPath, new TextEncoder().encode(generatedManifest(base.document))],
            [generatedPath, bytes],
          ]),
      );

/**
 * Count the elements of a tree.
 *
 * @param element - The tree's root element.
 * @returns How many elements it holds, itself included.
 */
const elementCount = (element: Element): number =>
  element.children.reduce(
    (count, child) => count + (child.kind === "element" ? elementCount(child) : 0),
    1,
  );

/**
 * Replace one element of a tree, numbered in document order from its root's 0.
 *
 * @param root - The tree's root element.
 * @param target - The number of the element to replace.
 * @param edit - The replacement of that element.
 * @returns The tree with that element replaced, every other node as it was.
 */
const editedAt = (root: Element, target: number, edit: (element: Element) => Element): Element => {
  let next = 0;
  const walk = (element: Element): Element => {
    const number = next;
    next += 1;
    const children = element.children.map((child): Child =>
      child.kind === "element" ? walk(child) : child,
    );

    return number === target ? edit({ ...element, children }) : { ...element, children };
  };

  return walk(root);
};

/**
 * An attribute in no namespace, with no entity reference in its value.
 *
 * @param local - Its name.
 * @param value - Its value.
 * @returns The attribute.
 */
const plain = (local: string, value: string): Attribute => ({
  local,
  namespace: "",
  prefix: "",
  qname: local,
  references: [],
  value,
});

/**
 * Give an element an attribute: in place of the one of its expanded name it carries, which keeps
 * its slot, or at a drawn slot among its attributes.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param slot - The drawn slot, taken modulo the slots there are.
 * @returns The element with the attribute.
 */
const withAttribute = (element: Element, attribute: Attribute, slot: number): Element => {
  const same = ({ local, namespace }: Attribute) =>
    local === attribute.local && namespace === attribute.namespace;
  if (element.attributes.some(same)) {
    return {
      ...element,
      attributes: element.attributes.map((held) => (same(held) ? attribute : held)),
    };
  }

  const at = slot % (element.attributes.length + 1);

  return {
    ...element,
    attributes: [...element.attributes.slice(0, at), attribute, ...element.attributes.slice(at)],
  };
};

/**
 * Make one named edit to an element.
 *
 * @param element - The element the edit lands on.
 * @param edit - The edit.
 * @returns The element as the edit leaves it; an edit of an attribute it does not carry leaves
 *   it as it was.
 */
const corrupted = (element: Element, edit: Edit): Element => {
  const owned = element.attributes.filter(({ namespace }) => namespace !== xmlnsNamespace);
  const target = owned[edit.slot % Math.max(1, owned.length)];
  switch (edit.corruption) {
    case "lexical": {
      return target === undefined
        ? element
        : withAttribute(element, { ...target, references: [], value: "-1 x?" }, edit.slot);
    }
    case "required": {
      return {
        ...element,
        attributes: element.attributes.filter((attribute) => attribute !== target),
      };
    }
    case "unadmitted": {
      return withAttribute(element, plain("unadmitted", "1"), edit.slot);
    }
    case "dataName": {
      return withAttribute(element, plain("data-Name", "1"), edit.slot);
    }
    case "idref": {
      return withAttribute(element, plain("aria-describedby", "nowhere"), edit.slot);
    }
    case "language": {
      return withAttribute(
        element,
        {
          local: "lang",
          namespace: xmlNamespace,
          prefix: "xml",
          qname: "xml:lang",
          references: [],
          value: "!",
        },
        edit.slot,
      );
    }
    case "declared": {
      const declaration: Attribute = {
        local: "extra",
        namespace: xmlnsNamespace,
        prefix: "xmlns",
        qname: "xmlns:extra",
        references: [],
        value: extraNamespace,
      };
      const note: Attribute = {
        local: "note",
        namespace: extraNamespace,
        prefix: "extra",
        qname: "extra:note",
        references: [],
        value: "1",
      };

      return withAttribute(withAttribute(element, declaration, edit.slot), note, edit.slot + 1);
    }
    default: {
      return edit.corruption satisfies never;
    }
  }
};

/**
 * Make a case's edits to its entries, in order.
 *
 * @param entries - The entries as the base writes them, each XML entry read.
 * @param edits - The edits.
 * @returns The entries with each edit made to the element it lands on.
 */
const editedEntries = (
  entries: readonly CaseEntry[],
  edits: readonly Edit[],
): readonly CaseEntry[] => {
  let held = entries;
  for (const edit of edits) {
    const documents = held.flatMap(({ path, tree }) =>
      Option.isSome(tree) ? [{ path, tree: tree.value }] : [],
    );
    const landed = documents[edit.document % Math.max(1, documents.length)];
    if (landed !== undefined) {
      const root = editedAt(
        landed.tree.root,
        edit.element % elementCount(landed.tree.root),
        (element) => corrupted(element, edit),
      );

      held = held.map((entry) =>
        entry.path === landed.path
          ? { ...entry, tree: Option.some({ ...landed.tree, root }) }
          : entry,
      );
    }
  }

  return held;
};

/**
 * Compare two paths by their UTF-16 code units, the order a case's entries are listed in.
 *
 * @param left - One path.
 * @param right - The other.
 * @returns A negative number, zero or a positive number as `left` sorts before, with or after
 *   `right`.
 */
const byCodeUnit = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

/**
 * Build a case's package: its base's entries in path order, each XML entry read by crust, with the
 * case's edits made.
 *
 * @param orderedCase - The case.
 * @param names - The names a generated tree is written under.
 * @returns The entries. A base entry crust cannot read is a defect of its generator, since every
 *   base is written to be read back.
 */
export const readCase = Effect.fn("test.attributeOrder.read")(function* readCase(
  orderedCase: OrderCase,
  names: XdmNames<Composed>,
): Effect.fn.Return<readonly CaseEntry[]> {
  const entries = yield* Effect.orDie(baseEntries(orderedCase.base, names));
  const read = yield* Effect.forEach(
    [...entries].toSorted(([left], [right]) => byCodeUnit(left, right)),
    ([path, bytes]) =>
      path.endsWith(".xml")
        ? Effect.map(Effect.orDie(readXml(bytes)), (tree): CaseEntry => ({
            bytes,
            path,
            tree: Option.some(tree),
          }))
        : Effect.succeed<CaseEntry>({ bytes, path, tree: Option.none() }),
  );

  return editedEntries(read, orderedCase.edits);
});

/**
 * Generate the order one element's attributes are written in: itself for fewer than two, and
 * otherwise an order of {@link orderings} its swarm draws, `shuffled` where it weighs none.
 *
 * @param drawn - The case's swarm.
 * @param element - The element.
 * @returns The generator of a permutation of its attributes' positions.
 */
const orderOf =
  (drawn: Swarm<OrderFeature>, element: Element): Gen<readonly number[]> =>
  (source) => {
    const positions = element.attributes.map((_, at) => at);
    if (positions.length < 2) {
      return positions;
    }

    const ordering = source.draw(swarmChoice(drawn, orderings));
    switch (ordering) {
      case "shuffled": {
        return source.draw(shuffled(positions, { max: positions.length, min: positions.length }));
      }
      case "reversed": {
        return positions.toReversed();
      }
      case "rotated": {
        const by = source.draw(int(1, positions.length - 1));

        return [...positions.slice(by), ...positions.slice(0, by)];
      }
      case "declarationsLast": {
        const declares = (at: number) => element.attributes[at]?.namespace === xmlnsNamespace;

        return [
          ...positions.filter((at) => !declares(at)),
          ...positions.filter((at) => declares(at)),
        ];
      }
      default: {
        return ordering satisfies never;
      }
    }
  };

/**
 * Generate a tree with every element's attributes, its namespace declarations among them, in an
 * order drawn for it, element by element in document order.
 *
 * @param drawn - The case's swarm, which weighs each order.
 * @param tree - The tree.
 * @returns The generator of the reordered tree, whose every other node is the tree's.
 */
export const reordered =
  (drawn: Swarm<OrderFeature>, tree: XmlDocument): Gen<XmlDocument> =>
  (source) => {
    const walk = (element: Element): Element => {
      const order = source.draw(orderOf(drawn, element));
      const attributes = order.flatMap((at) => {
        const attribute = element.attributes[at];

        return attribute === undefined ? [] : [attribute];
      });

      return {
        ...element,
        attributes,
        children: element.children.map((child): Child =>
          child.kind === "element" ? walk(child) : child,
        ),
      };
    };

    return { ...tree, root: walk(tree.root) };
  };

/**
 * Write a case's entries as a package reader gives them: each XML entry written by crust from its
 * tree, as `trees` gives it, in the charset it was read in, and every other entry as its bytes.
 *
 * @param entries - The case's entries.
 * @param trees - The tree each XML entry is written from, given its own: itself for the order the
 *   case was read in, a reordered one for another.
 * @returns The package's files, the manifest named `manifest`; fails with crust's `EncodeError`
 *   when a tree holds a character its charset cannot carry where no reference can write it.
 */
export const filesOf = Effect.fn("test.attributeOrder.files")(function* filesOf(
  entries: readonly CaseEntry[],
  trees: (tree: XmlDocument, path: string) => XmlDocument,
): Effect.fn.Return<readonly PackageFile[], EncodeError> {
  return yield* Effect.all(
    entries.map(({ bytes, path, tree }) =>
      Effect.map(
        Option.match(tree, {
          onNone: () => Effect.succeed(bytes),
          onSome: (read) => {
            const written = trees(read, path);

            return encode(written, written.charset);
          },
        }),
        (held): PackageFile => ({
          bytes: held,
          kind: path === manifestPath ? "manifest" : "file",
          path,
        }),
      ),
    ),
  );
});

/**
 * List an element and every element below it, in document order.
 *
 * @param element - The element.
 * @returns The elements.
 */
export const elementsOf = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child) => (child.kind === "element" ? elementsOf(child) : [])),
];

/**
 * Whether an element writes a namespace declaration after an attribute.
 *
 * @param element - The element.
 * @returns Whether a declaration follows an attribute that is none.
 */
export const declaresLate = (element: Element): boolean => {
  const first = element.attributes.findIndex(({ namespace }) => namespace !== xmlnsNamespace);

  return (
    first !== -1 &&
    element.attributes.slice(first).some(({ namespace }) => namespace === xmlnsNamespace)
  );
};

/**
 * Write an attribute or a declaration as an export must give it back: its qualified name, its
 * value, and the offsets of its unexpanded entity references.
 *
 * @param attribute - The attribute.
 * @returns Its text.
 */
export const writtenOf = ({ qname, references, value }: Attribute): string =>
  JSON.stringify([qname, value, references.map(({ name, offset }) => [name, offset])]);

/**
 * The attribute list the export writes for an element read so: its namespace declarations in the
 * order written, then its attributes in the order written.
 *
 * @param element - The element as its source writes it.
 * @returns Its declarations and attributes in the export's order, each by {@link writtenOf}.
 */
export const exportOrderOf = (element: Element): readonly string[] => [
  ...element.attributes.filter(({ namespace }) => namespace === xmlnsNamespace).map(writtenOf),
  ...element.attributes.filter(({ namespace }) => namespace !== xmlnsNamespace).map(writtenOf),
];

/**
 * Whether a reordered tree writes some element's attributes in another order than the tree it was
 * drawn from.
 *
 * @param read - The tree in the order it was read.
 * @param written - The reordered tree.
 * @returns Whether any element's attributes moved.
 */
export const movedIn = (read: XmlDocument, written: XmlDocument): boolean => {
  const before = elementsOf(read.root);

  return elementsOf(written.root).some((element, at) =>
    element.attributes.some(
      (attribute, slot) =>
        writtenOf(attribute) !== writtenOf(before[at]?.attributes[slot] ?? attribute),
    ),
  );
};
