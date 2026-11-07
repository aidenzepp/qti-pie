/**
 * The assembled test as the law oracle's test producers read it (lane OL): each test or section
 * document's names, sections, sites and branch rules over its own folded rows, the item an item
 * ref names, and each test's assembly of the section documents its section refs and includes place
 * (reading 5).
 *
 * It restates `src/qti/tests.ts` on the host, from the information model, never from the
 * importer's overlay (`#pantry/import/overlays/tests.ts`):
 *
 * - **names** (`Named`, reading 86): every test part, section, section ref and item ref, its
 *   identifier collapsed, and its scope in its document: its test part, whether a selection with
 *   replacement above it can repeat it, and, for a section, whether its children's order is drawn
 *   at delivery (a shuffle, or an invisible section not kept together under a parent whose order is
 *   drawn, information model §5.98) and whether that looseness reaches the document's root;
 * - **sites** (`Site`): each section ref, and each include under a parent whose content model holds
 *   an include particle (reading 114), with the document its href names;
 * - **the assembly** (`Instance`): one tree per document of a test or a section, its root the
 *   document, each child the section document a site of its parent's document names, in site order;
 *   a document already on the chain places nothing (reading 85, which `Inclusion cycle` refuses);
 * - **the item an item ref names** (`ItemRefTarget`, `ItemRefDocument`, the UP audit's B2 and B3):
 *   its href resolved, the type of the resource whose href resolves there, and the document there
 *   where that resource is an item.
 */
import { Option } from "effect";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { booleanOf } from "#pantry/grammar/domains.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { collapsedOf, elementsOf, hrefPathOf, valueOf } from "#pantry/test/oracle-view.ts";
import type { ListedRows, PackageRows, Row, View } from "#pantry/test/oracle-view.ts";

/**
 * The kinds of a test's structure (information model §4.2, §5.6, §5.159, §7.5).
 */
export const testKinds = {
  include: "xi:include",
  item: "qti-assessment-item",
  itemRef: "qti-assessment-item-ref",
  ordering: "qti-ordering",
  part: "qti-test-part",
  rule: "qti-branch-rule",
  section: "qti-assessment-section",
  sectionRef: "qti-assessment-section-ref",
  selection: "qti-selection",
  test: "qti-assessment-test",
} as const;

/**
 * The kinds whose identifiers are one namespace across an assembled test (reading 86; information
 * model §4.2.1 and §5.159.1).
 */
export const namedKinds: ReadonlySet<string> = new Set([
  testKinds.part,
  testKinds.section,
  testKinds.sectionRef,
  testKinds.itemRef,
]);

/**
 * The resource type of an item document (IMS Content Packaging's QTI 3.0 profile).
 */
export const itemResourceType = "imsqti_item_xmlv3p0";

/**
 * Whether a resource type is an LTI link's, the other target an item ref may name (the UP audit's
 * B3, R36; the implementation guide's §6.2.9): the LTI types of the `ResourceType` roster.
 *
 * @param type - The type.
 * @returns Whether it is an LTI link's.
 */
export const isLinkType = (type: string): boolean => /^ims(?:basic)?ltia?_xmlv/u.test(type);

/**
 * Read an element's `xs:boolean` attribute.
 *
 * @param rows - The document.
 * @param node - The element's id.
 * @param name - The attribute's name.
 * @param otherwise - Its value where the element writes none.
 * @returns The value.
 */
const flagOf = (rows: View, node: NodeId, name: string, otherwise: boolean): boolean =>
  Option.match(valueOf(rows, node, name), {
    onNone: () => otherwise,
    onSome: (lexical) => Option.contains(booleanOf(lexical), true),
  });

/**
 * One name of a document (`Named`): its node, its collapsed identifier, and its scope in its own
 * document.
 */
export interface Name {
  readonly identifier: string;
  readonly looseChain: boolean;
  readonly mixes: boolean;
  readonly node: Row;
  /**
   * Its parent's id, a name's or not.
   */
  readonly parent: NodeId;
  /**
   * The test part that holds it, itself for a test part, its document node where none does.
   */
  readonly part: NodeId;
  /**
   * Whether a section above it selects with replacement, so its element can be drawn again.
   */
  readonly replaced: boolean;
}

/**
 * One section of a document (`Section`): its scope, as its children read it, its parts and its
 * selection.
 */
export interface Section {
  readonly looseChain: boolean;
  readonly mixes: boolean;
  readonly node: Row;
  readonly part: NodeId;
  /**
   * Its parts (`SectionMember`, C15): its children of the kinds a section holds as parts.
   */
  readonly parts: readonly Row[];
  readonly replaced: boolean;
  /**
   * Whether it or a section above it selects with replacement.
   */
  readonly replacing: boolean;
  /**
   * Its `qti-selection`, none where it writes none.
   */
  readonly selection: Option.Option<Row>;
}

/**
 * One site of a document (`Site`): a section ref, or an include standing for a part, with the path
 * its href resolves to and the scope of the parent it is placed in.
 */
export interface Site {
  readonly node: Row;
  readonly parentLooseChain: boolean;
  readonly parentMixes: boolean;
  readonly part: NodeId;
  readonly path: string;
  readonly replaced: boolean;
}

/**
 * One branch rule of a document whose target is no reserved exit (`BranchRule`): its node, its
 * owner and its collapsed target.
 */
export interface Rule {
  readonly node: Row;
  readonly owner: Row;
  readonly target: string;
}

/**
 * A document of a test or a section as the assembly reads it.
 */
export interface TestDocument {
  readonly listed: ListedRows;
  readonly names: readonly Name[];
  readonly namesByNode: ReadonlyMap<NodeId, Name>;
  readonly rootKind: string;
  readonly rules: readonly Rule[];
  readonly sections: ReadonlyMap<NodeId, Section>;
  readonly sites: readonly Site[];
}

/**
 * The reserved targets every branch rule may name (information model §5.23.1).
 */
export const exits: ReadonlySet<string> = new Set(["EXIT_SECTION", "EXIT_TESTPART", "EXIT_TEST"]);

/**
 * Read a test or section document's structure.
 *
 * @param listed - The document.
 * @param grammar - The composed grammar, whose include parents and section parts it reads.
 * @returns Its names, sections, sites and branch rules.
 */
export const testDocumentOf = (listed: ListedRows, grammar: ComposedGrammar): TestDocument => {
  const { rows } = listed;
  const partKinds = new Set(grammar.references.sectionPart.rows.map(({ kind }) => kind));
  const includeParents = new Set(grammar.include.includeParentKind.rows.map(({ kind }) => kind));
  const sections = new Map<NodeId, Section>();
  // A section met again while its own scope is still being read stands on a cycle of parent
  // links, which the tree laws refuse; it reads no section above it, so the walk ends.
  const opening = new Set<NodeId>();
  const sectionOf = (node: Row): Section => {
    const known = sections.get(node.id);
    if (known !== undefined) {
      return known;
    }

    opening.add(node.id);

    const parent = rows.byId.get(node.parent);
    const above =
      parent?.kind === testKinds.section && parent.start > 0n && !opening.has(parent.id)
        ? sectionOf(parent)
        : undefined;
    const children = elementsOf(rows, node.id);
    const selection = Option.fromNullishOr(
      children.find(({ kind }) => kind === testKinds.selection),
    );
    const ordering = children.find(({ kind }) => kind === testKinds.ordering);
    const loose =
      !flagOf(rows, node.id, "visible", false) && !flagOf(rows, node.id, "keep-together", true);
    const withReplacement = Option.exists(selection, ({ id }) =>
      flagOf(rows, id, "with-replacement", false),
    );
    const shuffle = ordering !== undefined && flagOf(rows, ordering.id, "shuffle", false);
    // A section under a test part takes the part as its own; under a section, that section's
    // scope; and the root of a section document is under no section, so a loose chain reaches it.
    const scope =
      above === undefined
        ? {
            looseChain: parent?.kind !== testKinds.part,
            mixes: false,
            part: parent?.kind === testKinds.part ? parent.id : rows.self,
            replaced: false,
          }
        : {
            looseChain: above.looseChain,
            mixes: above.mixes,
            part: above.part,
            replaced: above.replacing,
          };
    const section: Section = {
      looseChain: loose && scope.looseChain,
      mixes: shuffle || (loose && scope.mixes),
      node,
      part: scope.part,
      parts: children.filter(({ kind }) => partKinds.has(kind)),
      replaced: scope.replaced,
      replacing: scope.replaced || withReplacement,
      selection,
    };
    sections.set(node.id, section);
    opening.delete(node.id);

    return section;
  };
  for (const node of rows.members) {
    if (node.kind === testKinds.section) {
      sectionOf(node);
    }
  }

  const parentScope = (node: Row) => {
    const parent = rows.byId.get(node.parent);
    const section = parent === undefined ? undefined : sections.get(parent.id);

    return section === undefined
      ? {
          looseChain: false,
          mixes: false,
          part: parent?.kind === testKinds.part ? parent.id : rows.self,
          replaced: false,
        }
      : {
          looseChain: section.looseChain,
          mixes: section.mixes,
          part: section.part,
          replaced: section.replacing,
        };
  };
  const names = rows.members.flatMap((node): readonly Name[] => {
    if (!namedKinds.has(node.kind)) {
      return [];
    }

    const section = sections.get(node.id);
    const scope = parentScope(node);
    const identifier = Option.getOrElse(collapsedOf(rows, node.id, "identifier"), () => "");

    if (section !== undefined) {
      return [
        {
          identifier,
          looseChain: section.looseChain,
          mixes: section.mixes,
          node,
          parent: node.parent,
          part: section.part,
          replaced: section.replaced,
        },
      ];
    }

    return [
      {
        identifier,
        looseChain: false,
        mixes: false,
        node,
        parent: node.parent,
        part: node.kind === testKinds.part ? node.id : scope.part,
        replaced: node.kind === testKinds.part ? false : scope.replaced,
      },
    ];
  });
  const sites = rows.members.flatMap((node): readonly Site[] => {
    const parent = rows.byId.get(node.parent);
    const placed =
      (node.kind === testKinds.sectionRef &&
        (parent?.kind === testKinds.section || parent?.kind === testKinds.part)) ||
      (node.kind === testKinds.include && parent !== undefined && includeParents.has(parent.kind));
    if (!placed) {
      return [];
    }

    // A site takes its parent section's scope; under any other parent, the parent is its part.
    const section = sections.get(node.parent);
    const scope =
      section === undefined
        ? { looseChain: false, mixes: false, part: node.parent, replaced: false }
        : {
            looseChain: section.looseChain,
            mixes: section.mixes,
            part: section.part,
            replaced: section.replacing,
          };

    return Option.toArray(hrefPathOf(rows, node)).map((path) => ({
      node,
      parentLooseChain: scope.looseChain,
      parentMixes: scope.mixes,
      part: scope.part,
      path,
      replaced: scope.replaced,
    }));
  });
  const rules = rows.members.flatMap((node): readonly Rule[] => {
    const owner = rows.byId.get(node.parent);
    const target = Option.getOrElse(collapsedOf(rows, node.id, "target"), () => "");

    return node.kind === testKinds.rule && owner !== undefined && !exits.has(target)
      ? [{ node, owner, target }]
      : [];
  });

  return {
    listed,
    names,
    namesByNode: new Map(names.map((name) => [name.node.id, name])),
    rootKind: Option.match(rows.root, { onNone: () => "", onSome: ({ kind }) => kind }),
    rules,
    sections,
    sites,
  };
};

/**
 * One placement of a document in an assembly (`Instance`): its document, its parent, its site's
 * start in the parent's document, its scope in the assembly, and its pre-order interval among the
 * assembly's instances.
 */
export interface Instance {
  readonly document: TestDocument;
  end: number;
  readonly mixes: boolean;
  readonly parent: Instance | undefined;
  readonly part: NodeId;
  readonly replaced: boolean;
  readonly siteStart: bigint;
  readonly start: number;
}

/**
 * Place a document and, unless it is already on its chain, one child per site of it, in site
 * order, each the test or section document the site names. A site that names no such document
 * places nothing, and its own laws refuse it.
 *
 * @param byPath - The package's test and section documents, by path.
 * @param walked - The assembly's instances so far, in pre-order, which this appends to.
 * @param chain - The documents of the instance's ancestors.
 * @param instance - The instance, its interval still open.
 * @returns The instance, its interval closed.
 */
const place = (
  byPath: ReadonlyMap<string, TestDocument>,
  walked: Instance[],
  chain: readonly TestDocument[],
  instance: Instance,
): Instance => {
  walked.push(instance);
  if (!chain.includes(instance.document)) {
    const { self } = instance.document.listed.rows;
    const sites = instance.document.sites.toSorted((left, right) =>
      Number(left.node.start - right.node.start),
    );
    for (const site of sites) {
      const target = byPath.get(site.path);
      if (target !== undefined) {
        place(byPath, walked, [...chain, instance.document], {
          document: target,
          end: 0,
          mixes: site.parentMixes || (site.parentLooseChain && instance.mixes),
          parent: instance,
          part: site.part === self ? instance.part : site.part,
          replaced: site.replaced || instance.replaced,
          siteStart: site.node.start,
          start: walked.length,
        });
      }
    }
  }

  instance.end = walked.length;

  return instance;
};

/**
 * Assemble a document: its instance tree, rooted at it, in pre-order.
 *
 * @param byPath - The package's test and section documents, by path.
 * @param root - The document.
 * @returns The assembly's instances, the root first.
 */
export const assemblyOf = (
  byPath: ReadonlyMap<string, TestDocument>,
  root: TestDocument,
): readonly Instance[] => {
  const walked: Instance[] = [];
  place(byPath, walked, [], {
    document: root,
    end: 0,
    mixes: false,
    parent: undefined,
    part: root.listed.rows.self,
    replaced: false,
    siteStart: 0n,
    start: 0,
  });

  return walked;
};

/**
 * A name as one instance places it (`InstanceName`): its scope in the assembly.
 */
export interface PlacedName {
  readonly instance: Instance;
  readonly mixes: boolean;
  readonly name: Name;
  readonly part: NodeId;
  readonly replaced: boolean;
}

/**
 * Place a name of an instance's document: its test part its own document's where it has one, else
 * its instance's; a replacement above it in its document or above its instance; and its order
 * drawn where its document draws it, or where its looseness reaches its document's root and its
 * instance's order is drawn.
 *
 * @param instance - The instance.
 * @param name - The name, of the instance's document.
 * @returns The placed name.
 */
export const placedName = (instance: Instance, name: Name): PlacedName => ({
  instance,
  mixes: name.mixes || (name.looseChain && instance.mixes),
  name,
  part: name.part === instance.document.listed.rows.self ? instance.part : name.part,
  replaced: name.replaced || instance.replaced,
});

/**
 * Whether an instance holds another in the assembly's pre-order: itself or an ancestor.
 *
 * @param holder - The holding instance.
 * @param held - The held one.
 * @returns Whether `holder`'s interval holds `held`'s start.
 */
export const holds = (holder: Instance, held: Instance): boolean =>
  holder.start <= held.start && held.start < holder.end;

/**
 * The package's test and section documents, by path, the first listed at a path.
 *
 * @param input - The package.
 * @param grammar - The composed grammar.
 * @returns The documents.
 */
export const testDocumentsOf = (
  input: PackageRows,
  grammar: ComposedGrammar,
): ReadonlyMap<string, TestDocument> => {
  const byPath = new Map<string, TestDocument>();
  for (const listed of input.documents) {
    const kind = Option.match(listed.rows.root, { onNone: () => "", onSome: ({ kind: k }) => k });
    if ((kind === testKinds.test || kind === testKinds.section) && !byPath.has(listed.path)) {
      byPath.set(listed.path, testDocumentOf(listed, grammar));
    }
  }

  return byPath;
};

/**
 * The resources of a manifest by the path their href resolves to: each `cp:resource`'s type, in
 * manifest order.
 *
 * @param manifest - The manifest.
 * @returns Each resolved href path's resource types.
 */
export const resourceTypesByPath = (manifest: View): ReadonlyMap<string, readonly string[]> => {
  const byPath = new Map<string, string[]>();
  for (const node of manifest.members) {
    if (node.kind === "cp:resource") {
      for (const path of Option.toArray(hrefPathOf(manifest, node))) {
        const type = Option.getOrElse(collapsedOf(manifest, node.id, "type"), () => "");
        byPath.set(path, [...(byPath.get(path) ?? []), type]);
      }
    }
  }

  return byPath;
};

/**
 * Name what an item ref's href names (the UP audit's B2 and B3): its resolved path, and the type
 * of the resource whose href resolves there, an item's before an LTI link's before any other,
 * none where no resource does.
 *
 * @param input - The package.
 * @param referrer - The document that holds the item ref.
 * @param itemRef - The item ref's node.
 * @returns Its path and type, none where it writes no href.
 */
export const itemRefTargetOf = (
  input: PackageRows,
  referrer: ListedRows,
  itemRef: Row,
): Option.Option<{ readonly path: string; readonly type: Option.Option<string> }> =>
  Option.map(hrefPathOf(referrer.rows, itemRef), (path) => {
    const types = resourceTypesByPath(input.manifest).get(path) ?? [];

    return {
      path,
      type: Option.fromNullishOr(
        types.find((type) => type === itemResourceType) ?? types.find(isLinkType) ?? types.at(0),
      ),
    };
  });

/**
 * Name the listed document an item ref's href names, when its root is an item: the href resolved
 * as the importer resolves a reference, named by a resource of the item type, and the listed
 * document at that path.
 *
 * @param input - The package.
 * @param referrer - The document that holds the item ref.
 * @param itemRef - The item ref's node.
 * @returns The item document, none when the href names no item document of the package.
 */
export const itemRefDocument = (
  input: PackageRows,
  referrer: ListedRows,
  itemRef: Row,
): Option.Option<ListedRows> =>
  Option.flatMap(itemRefTargetOf(input, referrer, itemRef), ({ path, type }) =>
    Option.contains(type, itemResourceType)
      ? Option.fromNullishOr(
          input.documents.find(
            (listed) =>
              listed.path === path &&
              Option.exists(listed.rows.root, ({ kind }) => kind === testKinds.item),
          ),
        )
      : Option.none(),
  );
