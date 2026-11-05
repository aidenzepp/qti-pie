/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the tool column the rows carry; the shape here is which of the two tool attributes the root wrote, not a structure. */

/**
 * The test and section documents' rows: the document itself and its root, the test's tool and
 * outcome declaration rows, the structure (test, part, section, section ref and item ref arms, the
 * identifiers they hold within the document, their children and the required ones among them), and
 * the control elements (selection, ordering, adaptive selection and its references, item session
 * control and time limits).
 *
 * The rules, the content, the test's processing and every row that spans documents are not written
 * here.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { attributeReader, markers } from "#pantry/import/interactions.ts";
import type { AttributeReader, MarkerRelation } from "#pantry/import/interactions.ts";
import { semanticRows } from "#pantry/import/item.ts";
import type { ItemInput } from "#pantry/import/item.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import {
  closedOf,
  collapse,
  ItemRefusal,
  kindOf,
  Rows,
  spelledInteger,
  treeRows,
  UnmodeledVocabulary,
  withParents,
} from "#pantry/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#pantry/import/tree.ts";
import { NavigationMode, SubmissionMode, XsBoolean } from "#pantry/schema/content/rosters.ts";
import type { StructureHolder, XsBooleanHandle } from "#pantry/schema/content/rosters.ts";
import {
  AdaptiveRefHref,
  AdaptiveRefIdentifier,
  CategoryList,
  ItemRefHref,
  ManifestIdentifier,
  PackagePath,
  SectionRefHref,
  TestStructureIdentifier,
  TimeLimitSeconds,
  ToolName,
  ToolVersion,
} from "#pantry/schema/contracts.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { ItemTool, ItemToolBoth, ItemToolName, ItemToolVersion } from "#pantry/schema/item.ts";
import { Edge } from "#pantry/schema/node.ts";
import type { AttributeNameHandle, NodeKindHandle } from "#pantry/schema/node.ts";
import {
  AdaptiveEngineRef,
  AdaptiveSelection,
  AdaptiveSettingsRef,
  DeclaredAllowComment,
  DeclaredAllowLateSubmission,
  DeclaredAllowReview,
  DeclaredAllowSkipping,
  DeclaredOrderingShuffle,
  DeclaredShowFeedback,
  DeclaredShowSolution,
  DeclaredValidateResponses,
  DeclaredWithReplacement,
  ItemSessionControl,
  ItemSessionMaxAttempts,
  MetadataRef,
  Ordering,
  Selection,
  SelectionBounded,
  TimeLimitMax,
  TimeLimitMin,
  TimeLimits,
  UsageDataRef,
} from "#pantry/schema/test/control.ts";
import {
  AssessmentSection,
  AssessmentTest,
  DeclaredItemRefFixed,
  DeclaredItemRefRequired,
  DeclaredSectionFixed,
  DeclaredSectionKeepTogether,
  DeclaredSectionRequired,
  ItemRef,
  ItemRefCategory,
  RequiredChild,
  SectionRef,
  StructureChild,
  TestIdentifier,
  TestPart,
  TestPartTitle,
} from "#pantry/schema/test/structure.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

type HolderHandle = (typeof StructureHolder.handles)[number];

/**
 * What a builder of one element needs beside the element: the rows so far, its node, the node it
 * sits under and the document.
 */
interface Site {
  readonly documentId: Uuid;
  readonly element: Element;
  readonly node: IndexedNode;
  readonly parent: Option.Option<IndexedNode>;
  readonly rows: Rows;
}

/**
 * The holder kind each identifier-holding structure kind has.
 */
const holders: Readonly<Partial<Record<NodeKindHandle, HolderHandle>>> = {
  "qti-assessment-item-ref": "itemRef",
  "qti-assessment-section": "section",
  "qti-assessment-section-ref": "sectionRef",
  "qti-test-part": "part",
};

/**
 * The kinds that count as a child of a structure parent: every section part of a section (an
 * `xi:include` counts as one) and every section or section ref of a part.
 */
const childKinds: Readonly<Partial<Record<NodeKindHandle, ReadonlySet<NodeKindHandle>>>> = {
  "qti-assessment-section": new Set<NodeKindHandle>([
    "qti-assessment-item-ref",
    "qti-assessment-section",
    "qti-assessment-section-ref",
    "xi:include",
  ]),
  "qti-test-part": new Set<NodeKindHandle>([
    "qti-assessment-section",
    "qti-assessment-section-ref",
  ]),
};

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * A boolean attribute: the handle of `XsBoolean` it spells, the schema's default when the source
 * does not write it.
 */
const booleanOf = (
  attributes: AttributeReader,
  name: AttributeNameHandle,
  fallback: XsBooleanHandle,
  where: string,
): Effect.Effect<XsBooleanHandle, ImportRefused> =>
  closedOf(
    XsBoolean.handles,
    Option.getOrElse(attributes.read(name), () => fallback),
    "attribute-lexical",
    `the ${name} attribute of ${where}`,
  );

/**
 * Whether a boolean handle spells true.
 */
const isTrue = (handle: XsBooleanHandle): boolean => handle === "true" || handle === "1";

/**
 * The rows that say `node` is a counted child of its parent: its `StructureChild` row when the
 * parent is a part or section the node's kind counts under, and its `RequiredChild` row beside it
 * when the node is required.
 */
const childRows = (
  rows: Rows,
  node: IndexedNode,
  parent: Option.Option<IndexedNode>,
  required: Option.Option<XsBooleanHandle>,
): Rows => {
  if (Option.isNone(parent) || childKinds[parent.value.kind]?.has(node.kind) !== true) {
    return rows;
  }

  const counted = Rows.add(rows, StructureChild, [
    { child: node.id, childKind: node.kind, parent: parent.value.id },
  ]);

  return Rows.add(
    counted,
    RequiredChild,
    written(required.pipe(Option.filter(isTrue)), (handle) => ({
      child: node.id,
      parent: parent.value.id,
      required: handle,
    })),
  );
};

/**
 * The `TestIdentifier` row of a part, section, section ref or item ref: its identifier within the
 * document that declares it.
 */
const identifierRow = (rows: Rows, node: IndexedNode, identifier: string, documentId: Uuid): Rows =>
  Rows.add(
    rows,
    TestIdentifier,
    written(Option.fromNullishOr(holders[node.kind]), (holderKind) => ({
      holder: node.id,
      holderKind,
      identifier: TestStructureIdentifier(identifier),
      scope: documentId,
    })),
  );

const requiredMarkers = { required: DeclaredSectionRequired } satisfies Record<
  string,
  MarkerRelation
>;

/**
 * The rows of one `qti-test-part`: its arm, its title when written, and its identifier.
 */
const partRows = Effect.fn("import.test.partRows")(function* partRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const navigation = yield* requiredAttribute(
    element,
    "navigation-mode",
    attributes.read("navigation-mode"),
  );
  const submission = yield* requiredAttribute(
    element,
    "submission-mode",
    attributes.read("submission-mode"),
  );
  const title = attributes.read("title");
  const navigationMode = yield* closedOf(
    NavigationMode.handles,
    navigation,
    "attribute-lexical",
    "the navigation-mode attribute of qti-test-part",
  );
  const submissionMode = yield* closedOf(
    SubmissionMode.handles,
    submission,
    "attribute-lexical",
    "the submission-mode attribute of qti-test-part",
  );

  let built = attributes.rows();
  built = Rows.add(built, TestPart, [
    {
      document: documentId,
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
      navigationMode,
      submissionMode,
    },
  ]);
  built = Rows.add(
    built,
    TestPartTitle,
    written(title, (value) => ({ node: node.id, value })),
  );

  return identifierRow(built, node, identifier, documentId);
});

/**
 * What a section's builder hands on: the rows, and the identifier and title the section wrote,
 * which a section document's root repeats.
 */
interface SectionBuilt {
  readonly identifier: string;
  readonly rows: Rows;
  readonly title: string;
}

/**
 * The rows of one `qti-assessment-section`: its arm with the markers of the booleans it wrote, its
 * identifier and its place among the children of its parent.
 */
const sectionRows = Effect.fn("import.test.sectionRows")(function* sectionRows(
  site: Site,
): Effect.fn.Return<SectionBuilt, ImportRefused | ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const title = yield* requiredAttribute(element, "title", attributes.read("title"));
  const visibleText = yield* requiredAttribute(element, "visible", attributes.read("visible"));
  const visible = yield* closedOf(
    XsBoolean.handles,
    visibleText,
    "attribute-lexical",
    "the visible attribute of qti-assessment-section",
  );
  const required = yield* booleanOf(attributes, "required", "false", "qti-assessment-section");
  const fixed = yield* booleanOf(attributes, "fixed", "false", "qti-assessment-section");
  const keepTogether = yield* booleanOf(
    attributes,
    "keep-together",
    "true",
    "qti-assessment-section",
  );

  let built = attributes.rows();
  built = Rows.add(built, AssessmentSection, [
    {
      document: documentId,
      fixed,
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
      keepTogether,
      required,
      title,
      visible,
    },
  ]);
  built = markers(
    built,
    {
      ...requiredMarkers,
      fixed: DeclaredSectionFixed,
      "keep-together": DeclaredSectionKeepTogether,
    },
    node.id,
    attributes.written(),
  );
  built = identifierRow(built, node, identifier, documentId);

  return {
    identifier,
    rows: childRows(built, node, site.parent, Option.some(required)),
    title,
  };
});

/**
 * The rows of one `qti-assessment-section-ref`.
 */
const sectionRefRows = Effect.fn("import.test.sectionRefRows")(function* sectionRefRows(
  site: Site,
): Effect.fn.Return<Rows, ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const href = yield* requiredAttribute(element, "href", attributes.read("href"));

  let built = attributes.rows();
  built = Rows.add(built, SectionRef, [
    {
      document: documentId,
      href: SectionRefHref(href),
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
    },
  ]);
  built = identifierRow(built, node, identifier, documentId);

  return childRows(built, node, site.parent, Option.none());
});

/**
 * The rows of one `qti-assessment-item-ref`: its arm with the markers of the booleans it wrote, its
 * category when written, its identifier and its place among the children of its parent.
 */
const itemRefRows = Effect.fn("import.test.itemRefRows")(function* itemRefRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const { documentId, element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const identifier = yield* requiredAttribute(element, "identifier", attributes.read("identifier"));
  const href = yield* requiredAttribute(element, "href", attributes.read("href"));
  const required = yield* booleanOf(attributes, "required", "false", "qti-assessment-item-ref");
  const fixed = yield* booleanOf(attributes, "fixed", "false", "qti-assessment-item-ref");
  const category = attributes.read("category");

  let built = attributes.rows();
  built = Rows.add(built, ItemRef, [
    {
      document: documentId,
      fixed,
      href: ItemRefHref(href),
      id: node.id,
      identifier: TestStructureIdentifier(identifier),
      required,
    },
  ]);
  built = markers(
    built,
    { fixed: DeclaredItemRefFixed, required: DeclaredItemRefRequired },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    ItemRefCategory,
    written(category, (value) => ({ node: node.id, value: CategoryList(value) })),
  );
  built = identifierRow(built, node, identifier, documentId);

  return childRows(built, node, site.parent, Option.some(required));
});

/**
 * The rows of one `qti-selection`: the selection under its section, the marker of a written
 * `with-replacement`, the spelling of a non-canonical `select`, and, for a selection without
 * replacement, its copy on the section.
 */
const selectionRows = Effect.fn("import.test.selectionRows")(function* selectionRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const { element, node } = site;
  const attributes = attributeReader(site.rows, element, node);
  const selectText = yield* requiredAttribute(element, "select", attributes.read("select"));
  const withReplacement = yield* booleanOf(
    attributes,
    "with-replacement",
    "false",
    "qti-selection",
  );
  const select = yield* spelledInteger(
    attributes.rows(),
    node.id,
    node.kind,
    "select",
    selectText,
    "integer",
    "attribute-lexical",
    "the select attribute of qti-selection",
  );
  const section = Option.match(site.parent, {
    onNone: () => node.id,
    onSome: (parent) => parent.id,
  });

  let built = Rows.add(select.rows, Selection, [
    { id: node.id, section, select: select.value, withReplacement },
  ]);
  built = markers(
    built,
    { "with-replacement": DeclaredWithReplacement },
    node.id,
    attributes.written(),
  );

  return Rows.add(
    built,
    SelectionBounded,
    isTrue(withReplacement) ? [] : [{ section, select: select.value, withReplacement }],
  );
});

/**
 * The rows of one `qti-ordering`.
 */
const orderingRows = Effect.fn("import.test.orderingRows")(function* orderingRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused> {
  const attributes = attributeReader(site.rows, site.element, site.node);
  const shuffle = yield* booleanOf(attributes, "shuffle", "false", "qti-ordering");

  return markers(
    Rows.add(attributes.rows(), Ordering, [{ id: site.node.id, shuffle }]),
    { shuffle: DeclaredOrderingShuffle },
    site.node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-adaptive-selection`, which carries no attribute.
 */
const adaptiveSelectionRows = (site: Site): Rows =>
  Rows.add(site.rows, AdaptiveSelection, [{ id: site.node.id }]);

/**
 * The relations of the four adaptive references, which hold the same two required attributes.
 */
const referenceArms = {
  "qti-adaptive-engine-ref": AdaptiveEngineRef,
  "qti-adaptive-settings-ref": AdaptiveSettingsRef,
  "qti-metadata-ref": MetadataRef,
  "qti-usagedata-ref": UsageDataRef,
} as const;

/**
 * The rows of one adaptive reference: its `identifier` and `href`, both required.
 */
const referenceRows = Effect.fn("import.test.referenceRows")(function* referenceRows(
  site: Site,
  arm: (typeof referenceArms)[keyof typeof referenceArms],
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = attributeReader(site.rows, site.element, site.node);
  const identifier = yield* requiredAttribute(
    site.element,
    "identifier",
    attributes.read("identifier"),
  );
  const href = yield* requiredAttribute(site.element, "href", attributes.read("href"));

  return Rows.add(attributes.rows(), arm, [
    {
      href: AdaptiveRefHref(href),
      id: site.node.id,
      identifier: AdaptiveRefIdentifier(identifier),
    },
  ]);
});

/**
 * The rows of one `qti-item-session-control`: the six booleans with the markers of those the source
 * wrote, and `max-attempts` with its spelling when it has one.
 */
const sessionControlRows = Effect.fn("import.test.sessionControlRows")(function* sessionControlRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused> {
  const { element, node } = site;
  const kind = "qti-item-session-control";
  const attributes = attributeReader(site.rows, element, node);
  const maxAttempts = attributes.read("max-attempts");
  const showFeedback = yield* booleanOf(attributes, "show-feedback", "false", kind);
  const allowReview = yield* booleanOf(attributes, "allow-review", "true", kind);
  const showSolution = yield* booleanOf(attributes, "show-solution", "false", kind);
  const allowComment = yield* booleanOf(attributes, "allow-comment", "false", kind);
  const allowSkipping = yield* booleanOf(attributes, "allow-skipping", "true", kind);
  const validateResponses = yield* booleanOf(attributes, "validate-responses", "false", kind);
  const attempts = yield* Option.match(maxAttempts, {
    onNone: () => Effect.succeed({ rows: attributes.rows(), value: Option.none<bigint>() }),
    onSome: (text) =>
      spelledInteger(
        attributes.rows(),
        node.id,
        node.kind,
        "max-attempts",
        text,
        "integer",
        "attribute-lexical",
        "the max-attempts attribute of qti-item-session-control",
      ).pipe(Effect.map((spelled) => ({ rows: spelled.rows, value: Option.some(spelled.value) }))),
  });

  let built = Rows.add(attempts.rows, ItemSessionControl, [
    {
      allowComment,
      allowReview,
      allowSkipping,
      id: node.id,
      showFeedback,
      showSolution,
      validateResponses,
    },
  ]);
  built = markers(
    built,
    {
      "allow-comment": DeclaredAllowComment,
      "allow-review": DeclaredAllowReview,
      "allow-skipping": DeclaredAllowSkipping,
      "show-feedback": DeclaredShowFeedback,
      "show-solution": DeclaredShowSolution,
      "validate-responses": DeclaredValidateResponses,
    },
    node.id,
    attributes.written(),
  );

  return Rows.add(
    built,
    ItemSessionMaxAttempts,
    written(attempts.value, (value) => ({ node: node.id, value })),
  );
});

/**
 * The rows of one `qti-time-limits`: `allow-late-submission` with its marker, and `min-time` and
 * `max-time` as written when they are.
 */
const timeLimitsRows = Effect.fn("import.test.timeLimitsRows")(function* timeLimitsRows(
  site: Site,
): Effect.fn.Return<Rows, ImportRefused> {
  const { node } = site;
  const attributes = attributeReader(site.rows, site.element, node);
  const minTime = attributes.read("min-time");
  const maxTime = attributes.read("max-time");
  const allowLateSubmission = yield* booleanOf(
    attributes,
    "allow-late-submission",
    "false",
    "qti-time-limits",
  );

  let built = Rows.add(attributes.rows(), TimeLimits, [{ allowLateSubmission, id: node.id }]);
  built = markers(
    built,
    { "allow-late-submission": DeclaredAllowLateSubmission },
    node.id,
    attributes.written(),
  );
  built = Rows.add(
    built,
    TimeLimitMin,
    written(minTime, (value) => ({ node: node.id, value: TimeLimitSeconds(value) })),
  );

  return Rows.add(
    built,
    TimeLimitMax,
    written(maxTime, (value) => ({ node: node.id, value: TimeLimitSeconds(value) })),
  );
});

/**
 * The tool row of a test root and the arm that holds the strings it wrote, as the attribute reader
 * read them; none when it wrote neither `tool-name` nor `tool-version`.
 */
const toolRows = (
  rows: Rows,
  tree: Uuid,
  name: Option.Option<string>,
  version: Option.Option<string>,
): Rows => {
  if (Option.isSome(name) && Option.isSome(version)) {
    return Rows.add(
      Rows.add(rows, ItemTool, [{ root: "test", shape: "both", tree }]),
      ItemToolBoth,
      [{ toolName: ToolName(name.value), toolVersion: ToolVersion(version.value), tree }],
    );
  }

  if (Option.isSome(name)) {
    return Rows.add(
      Rows.add(rows, ItemTool, [{ root: "test", shape: "nameOnly", tree }]),
      ItemToolName,
      [{ toolName: ToolName(name.value), tree }],
    );
  }

  return Option.isSome(version)
    ? Rows.add(
        Rows.add(rows, ItemTool, [{ root: "test", shape: "versionOnly", tree }]),
        ItemToolVersion,
        [{ toolVersion: ToolVersion(version.value), tree }],
      )
    : rows;
};

/**
 * The builder of each kind that is not the document's root, which write the rows of one element.
 */
const builders: ReadonlyMap<
  NodeKindHandle,
  (site: Site) => Effect.Effect<Rows, ImportRefused | ItemRefusal>
> = new Map<NodeKindHandle, (site: Site) => Effect.Effect<Rows, ImportRefused | ItemRefusal>>([
  [
    "qti-adaptive-engine-ref",
    (site) => referenceRows(site, referenceArms["qti-adaptive-engine-ref"]),
  ],
  ["qti-adaptive-selection", (site) => Effect.succeed(adaptiveSelectionRows(site))],
  [
    "qti-adaptive-settings-ref",
    (site) => referenceRows(site, referenceArms["qti-adaptive-settings-ref"]),
  ],
  ["qti-assessment-item-ref", itemRefRows],
  ["qti-assessment-section", (site) => Effect.map(sectionRows(site), (built) => built.rows)],
  ["qti-assessment-section-ref", sectionRefRows],
  ["qti-item-session-control", sessionControlRows],
  ["qti-metadata-ref", (site) => referenceRows(site, referenceArms["qti-metadata-ref"])],
  ["qti-ordering", orderingRows],
  ["qti-selection", selectionRows],
  ["qti-test-part", partRows],
  ["qti-time-limits", timeLimitsRows],
  ["qti-usagedata-ref", (site) => referenceRows(site, referenceArms["qti-usagedata-ref"])],
]);

/**
 * The structure and control rows of every element of the tree under the root, in document order.
 * The `xi:include` of a section is a counted child and has no row of its own.
 */
const elementRows = Effect.fn("import.test.elementRows")(function* elementRows(
  rows: Rows,
  root: Element,
  nodes: NodeIndex,
  documentId: Uuid,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  let built = rows;
  for (const [element, parent] of withParents(root, Option.none())) {
    const node = nodes.get(element);
    const parentNode = Option.flatMapNullishOr(parent, (above) => nodes.get(above));
    if (node === undefined || element === root) {
      continue;
    }

    const builder = builders.get(node.kind);
    if (builder !== undefined) {
      built = yield* builder({ documentId, element, node, parent: parentNode, rows: built });
    } else if (node.kind === "xi:include") {
      built = childRows(built, node, parentNode, Option.none());
    }
  }

  return built;
});

/**
 * Write the rows of a test or section document: its tree, its `Document` row with the identifier
 * and title rows, the root and, for a test, its tool rows, then the declarations, the structure and
 * the control elements under it.
 *
 * Every attribute passes through the attribute reader with the whitespace class of its kind's
 * inventory entry: `title` replaces, the booleans, integers, lists and references collapse, the
 * modes are kept as read. A boolean the source omits takes its XSD default with no marker; one it
 * writes gets its `Declared*` marker. `select` and `max-attempts` are `xs:int`s read as integers
 * with the spelling kept when it is not canonical; the 32-bit range is the schema's statement. A
 * required attribute the source omits is refused as `required-attribute` before its row.
 *
 * The test's outcome declarations go through the declaration pass the item builder runs. The
 * context declarations, the rules, the rubrics, the feedback and every other content row are
 * written by the passes that follow this one.
 *
 * @param input - The decoded test or section and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this document's added, the node index of its tree and the document's id,
 *   which is the tree's; `UnmodeledVocabulary` for a root that is neither `qti-assessment-test` nor
 *   `qti-assessment-section`, naming it, and for any element or attribute the registries do not
 *   model; `ItemRefusal` (`required-attribute`) for a required attribute the source omits;
 *   `ImportRefused` (`attribute-lexical`) for a value outside its roster or integer space.
 */
export const testRows = Effect.fn("import.testRows")(function* testRows(
  input: ItemInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: Uuid },
  ImportRefused | UnmodeledVocabulary | ItemRefusal
> {
  const { doc, packageId, version } = input;
  const { root } = doc;
  const rootKind = Option.getOrUndefined(kindOf(root, Option.none()));
  const kind = rootKind === "qti-assessment-test" ? "test" : "section";
  if (rootKind !== "qti-assessment-test" && rootKind !== "qti-assessment-section") {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: documentId, kind: "document", root: kind, version },
    rows,
  );
  const { nodes } = tree;
  const rootNode = nodes.get(root);
  if (rootNode === undefined) {
    return yield* new ItemRefusal({
      detail: "The document's root element has no node.",
      rule: "binding-declared",
    });
  }

  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: packageId,
      path: PackagePath(input.path),
      resource: ManifestIdentifier(input.resource),
      resourceType: input.resourceType,
      root: kind,
      version,
    },
  ]);
  const common = {
    document: documentId,
    package: packageId,
    resource: ManifestIdentifier(input.resource),
    root: kind,
  } as const;
  const own = { documentId, element: root, node: rootNode, parent: Option.none(), rows: built };
  let identifier: Option.Option<string>;
  let title: Option.Option<string>;
  if (kind === "test") {
    const attributes = attributeReader(built, root, rootNode);
    identifier = attributes.read("identifier");
    title = attributes.read("title");
    const toolName = attributes.read("tool-name");
    const toolVersion = attributes.read("tool-version");
    built = toolRows(
      Rows.add(attributes.rows(), AssessmentTest, [{ id: rootNode.id }]),
      documentId,
      toolName,
      toolVersion,
    );
  } else {
    const section = yield* sectionRows(own);
    built = section.rows;
    identifier = Option.some(section.identifier);
    title = Option.some(section.title);
  }

  built = Rows.add(
    built,
    DocumentIdentifier,
    written(identifier, (value) => ({ ...common, value })),
  );
  built = Rows.add(
    built,
    DocumentTitle,
    written(title, (value) => ({ ...common, collapsed: collapse(value), value })),
  );

  const walked = withParents(root, Option.none());
  const positions = new Map(Rows.of(tree.rows, Edge).map((edge) => [edge.child, edge.position]));
  const semantic = yield* semanticRows(
    built,
    { adaptive: "false", documentId, nodes, positions, rootId: rootNode.id },
    walked,
  );
  built = yield* elementRows(semantic.rows, root, nodes, documentId);

  return { documentId, nodes, rows: built };
});
