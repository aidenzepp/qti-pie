/**
 * The test's structure: the test, its parts, sections, section references and item references,
 * and the relations that scope their identifiers.
 *
 * `AssessmentTest` stays thin: its `identifier` and `title` are the root's `DocumentIdentifier`
 * and `DocumentTitle` rows. The arms' containments into `Node` are not written here: one `mirrors`
 * per handle in the composed schema (`#pantry/schema/qti.ts`) binds them, and the statements over
 * these rows, other than the two candidate keys later containments target, arrive with the laws
 * heading.
 *
 * A required attribute is a column of its arm; an optional one is a relation of its own keyed
 * `node`; a defaulted one is a typed column plus a `Declared*` marker of one `node` column that
 * says the source wrote it (the placement rules of `#pantry/schema/attribute-homes.ts`).
 */
import { closedId, key, relation, str, uuid } from "@bjornpagen/grizzle";
import {
  NavigationMode,
  StructureHolder,
  SubmissionMode,
  XsBoolean,
} from "#pantry/schema/content/rosters.ts";
import {
  CategoryList,
  ItemRefHref,
  SectionRefHref,
  TestStructureIdentifier,
} from "#pantry/schema/contracts.ts";
import { NodeKind } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * A `qti-assessment-test` element.
 */
export const AssessmentTest = relation("AssessmentTest", { id: uuid }, ["id"]);

/**
 * A `qti-test-part` element, by its identifier within the test. `navigation-mode` and
 * `submission-mode` are required, so a written value always exists.
 */
export const TestPart = relation(
  "TestPart",
  {
    document: uuid,
    id: uuid,
    identifier: TestStructureIdentifier,
    navigationMode: closedId(NavigationMode),
    submissionMode: closedId(SubmissionMode),
  },
  ["id"],
);

/**
 * The `title` of a test part, which the source may omit.
 */
export const TestPartTitle = relation(
  "TestPartTitle",
  {
    node: uuid,
    value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
  },
  ["node"],
);

/**
 * A `qti-assessment-section`, by its identifier within the test. `visible` is required; `required`,
 * `fixed` and `keepTogether` default to `false`, `false` and `true`, and their `Declared*` markers
 * hold the sections that wrote them.
 */
export const AssessmentSection = relation(
  "AssessmentSection",
  {
    document: uuid,
    fixed: closedId(XsBoolean),
    id: uuid,
    identifier: TestStructureIdentifier,
    keepTogether: closedId(XsBoolean),
    required: closedId(XsBoolean),
    title: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
    visible: closedId(XsBoolean),
  },
  ["id"],
);

/**
 * A section whose `required` attribute was written, as opposed to defaulted.
 */
export const DeclaredSectionRequired = relation("DeclaredSectionRequired", { node: uuid }, [
  "node",
]);

/**
 * A section whose `fixed` attribute was written, as opposed to defaulted.
 */
export const DeclaredSectionFixed = relation("DeclaredSectionFixed", { node: uuid }, ["node"]);

/**
 * A section whose `keep-together` attribute was written, as opposed to defaulted.
 */
export const DeclaredSectionKeepTogether = relation("DeclaredSectionKeepTogether", { node: uuid }, [
  "node",
]);

/**
 * A `qti-assessment-section-ref`, by its identifier within the test.
 */
export const SectionRef = relation(
  "SectionRef",
  {
    document: uuid,
    href: SectionRefHref,
    id: uuid,
    identifier: TestStructureIdentifier,
  },
  ["id"],
);

/**
 * A `qti-assessment-item-ref`, by its identifier within the test. `required` and `fixed` default to
 * `false`, and their `Declared*` markers hold the references that wrote them.
 */
export const ItemRef = relation(
  "ItemRef",
  {
    document: uuid,
    fixed: closedId(XsBoolean),
    href: ItemRefHref,
    id: uuid,
    identifier: TestStructureIdentifier,
    required: closedId(XsBoolean),
  },
  ["id"],
);

/**
 * An item reference whose `required` attribute was written, as opposed to defaulted.
 */
export const DeclaredItemRefRequired = relation("DeclaredItemRefRequired", { node: uuid }, [
  "node",
]);

/**
 * An item reference whose `fixed` attribute was written, as opposed to defaulted.
 */
export const DeclaredItemRefFixed = relation("DeclaredItemRefFixed", { node: uuid }, ["node"]);

/**
 * The `category` of an item reference, the identifier list as written, which the source may omit.
 */
export const ItemRefCategory = relation("ItemRefCategory", { node: uuid, value: CategoryList }, [
  "node",
]);

/**
 * One structure identifier within a scope, held by the part, section or reference `holder` of
 * `holderKind`. `scope` is the document whose test declares it.
 */
export const TestIdentifier = relation(
  "TestIdentifier",
  {
    holder: uuid,
    holderKind: closedId(StructureHolder),
    identifier: TestStructureIdentifier,
    scope: uuid,
  },
  ["holder"],
);

/**
 * One structure identifier reaching a test, held by the part, section or reference `holder` of
 * `holderKind`: the identifiers of the test's own document and of every section document it
 * references.
 */
export const TestReach = relation(
  "TestReach",
  {
    holder: uuid,
    holderKind: closedId(StructureHolder),
    identifier: TestStructureIdentifier,
    test: uuid,
  },
  ["test", "holder"],
);

/**
 * A document a test reaches: its own, and each section document its references resolve to.
 */
export const TestDocument = relation("TestDocument", { document: uuid, test: uuid }, [
  "test",
  "document",
]);

/**
 * A child of a test structure node: a part under the test, a section or reference under a part or
 * a section. `child` is the primary key, so a node has one parent.
 */
export const StructureChild = relation(
  "StructureChild",
  { child: uuid, childKind: closedId(NodeKind), parent: uuid },
  ["child"],
);

/**
 * Whether a structure child is required, as the `required` the child's own arm reads.
 */
export const RequiredChild = relation(
  "RequiredChild",
  { child: uuid, parent: uuid, required: closedId(XsBoolean) },
  ["child"],
);

/**
 * The `NodeKind` handles this module arms, each with its arm.
 */
export const arms = {
  "qti-assessment-item-ref": ItemRef,
  "qti-assessment-section": AssessmentSection,
  "qti-assessment-section-ref": SectionRef,
  "qti-assessment-test": AssessmentTest,
  "qti-test-part": TestPart,
} as const;

/**
 * The relations this module declares.
 */
export const relations = {
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
  TestDocument,
  TestIdentifier,
  TestPart,
  TestPartTitle,
  TestReach,
} as const;

/**
 * The statements this module declares: the two candidate keys that later containments target. A
 * structure identifier is unique within its scope document (`TestIdentifier`), and within the test
 * across the documents it reaches (`TestReach`).
 */
export const rules = [
  key(TestIdentifier, ["scope", "identifier"]),
  key(TestReach, ["test", "identifier"]),
] as const;
