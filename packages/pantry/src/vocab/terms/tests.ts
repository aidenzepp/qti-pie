/**
 * The terms of tests and their assembly that the schema (`#pantry/qti/tests.ts`) and the importer
 * (`#pantry/import/overlays/tests.ts` and its siblings) both read: the kinds of a test's elements,
 * which roots assemble, which include parents splice, and the resource types an item ref names.
 * Each is a function of the grammar's rosters alone, so loading this module builds no relation of
 * the schema.
 */
import type { Kind, Name } from "#pantry/grammar/compose.ts";
import { grammar, includeParentKinds, NodeKind, ResourceType } from "#pantry/grammar/install.ts";

/**
 * The test's root kind, the root of an assembly whose names and branch rules resolve.
 */
export const testKind = "qti-assessment-test" satisfies Kind;

/**
 * The item's root kind, the root of an assembly whose instances place their bindings (spec reading
 * 117).
 */
export const itemKind = "qti-assessment-item" satisfies Kind;

/**
 * The section's kind: a section document's root, and every section a test or section holds.
 */
export const sectionKind = "qti-assessment-section" satisfies Kind;

/**
 * The test part's kind.
 */
export const partKind = "qti-test-part" satisfies Kind;

/**
 * The item ref's kind.
 */
export const itemRefKind = "qti-assessment-item-ref" satisfies Kind;

/**
 * The section ref's kind: a site, and a name.
 */
export const sectionRefKind = "qti-assessment-section-ref" satisfies Kind;

/**
 * XInclude's include: a site where a section holds it as a part (information model §2.12).
 */
export const includeKind = "xi:include" satisfies Kind;

/**
 * A section's selection.
 */
export const selectionKind = "qti-selection" satisfies Kind;

/**
 * A section's ordering.
 */
export const orderingKind = "qti-ordering" satisfies Kind;

/**
 * A branch rule.
 */
export const branchRuleKind = "qti-branch-rule" satisfies Kind;

/**
 * An item ref's variable mapping (information model §7.48).
 */
export const mappingKind = "qti-variable-mapping" satisfies Kind;

/**
 * An item's reference to a shared stimulus (information model §7.6).
 */
export const stimulusRefKind = "qti-assessment-stimulus-ref" satisfies Kind;

/**
 * The root kinds whose documents are in an assembly whether or not they hold a site: a test, and a
 * section document, whose own chain of inclusions reading 85 refuses as the oracle does, over every
 * listed document. Each keeps its names, sections and branch rules (`TestDocument`); which
 * documents head an assembly is {@link splicingParents}'s.
 */
export const assembledRoots = [testKind, sectionKind] as const satisfies readonly Kind[];

/**
 * The include parents whose include splices its fragment in place, the one statement of which
 * documents head an assembly: a document heads its own unless an include under one of these places
 * it and may stand for its root (`IncludeRoot`, `Inclusion.splices`), since an included fragment is
 * judged in place, as its merged document holds it, and not alone (spec reading 117). An include
 * that may not stand for its target's root places no fragment there: "Include root" refuses it, and
 * the document it names is judged as its own. Every parent the information model gives an Include
 * is one but a section, whose includes follow a section document's rule (reading 117: reading 86's
 * rule that a section document a test places twice is written once "is the information model's for
 * section documents in a test's assembly ... and includes in a section follow it"). A section's
 * include stands for an item ref, a section or a section ref alone (`IncludeRoot`), and no other
 * parent's include stands for any of them.
 *
 * The schema's heads (`inclusionLaws`, `#pantry/qti/tests.ts`) and the import's
 * (`#pantry/import/overlays/tests.ts` `assembledRowsOf`) read this list and `IncludeRoot`, through
 * `Inclusion.splices`, and nothing else of them decides a head. The law oracle, the second
 * implementation, states its own from the grammar (`#pantry/test/oracle.ts` `splicingParentsOf` and
 * `standsFor`), and `splicing-parents.oracle.test.ts` holds the two lists equal.
 */
export const splicingParents = includeParentKinds.filter((kind) => kind !== sectionKind);

/**
 * The kinds whose identifiers are one namespace across an assembled test (reading 86).
 */
export const namedKinds = [
  partKind,
  sectionKind,
  sectionRefKind,
  itemRefKind,
] as const satisfies readonly Kind[];

/**
 * The kinds a section holds as its parts (`SectionPart`, information model §6.46): an item ref, a
 * section, a section ref, or an include standing in for one. Reading 79 counts each once.
 */
export const sectionParts: readonly Kind[] = NodeKind.handles.filter((kind) =>
  grammar.references.sectionPart.rows.some((row) => row.kind === kind),
);

/**
 * The reserved targets every branch rule may name (information model §5.23.1).
 */
export const exits = ["EXIT_SECTION", "EXIT_TESTPART", "EXIT_TEST"] as const;

/**
 * The `xs:boolean` attributes the schema copies into `TestFlag` (`#pantry/qti/tests.ts`), each with
 * the kinds that carry it here: a section's `keep-together` and `visible`, an item ref's and a
 * section's `required`, an ordering's `shuffle`, and a selection's `with-replacement`.
 */
export const flagCarriers = [
  ["keep-together", [sectionKind]],
  ["required", [itemRefKind, sectionKind]],
  ["shuffle", [orderingKind]],
  ["visible", [sectionKind]],
  ["with-replacement", [selectionKind]],
] as const satisfies readonly (readonly [Name, readonly Kind[]])[];

/**
 * The name of an attribute `TestFlag` (`#pantry/qti/tests.ts`) holds.
 */
export type FlagName = (typeof flagCarriers)[number][0];

/**
 * The resource type of an item document.
 */
export const itemResourceType =
  "imsqti_item_xmlv3p0" satisfies (typeof ResourceType.handles)[number];

/**
 * The resource types of an LTI link, the other target an item ref may name (the UP audit's B3,
 * R36; the implementation guide's §6.2.9, informative): the LTI types of the `ResourceType`
 * roster.
 */
export const linkResourceTypes: readonly (typeof ResourceType.handles)[number][] =
  ResourceType.handles.filter((type) => /^ims(?:basic)?ltia?_xmlv/u.test(type));
