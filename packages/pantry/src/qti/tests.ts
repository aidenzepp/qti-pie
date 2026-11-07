/**
 * Tests and sections (plan §1.7 O7, N11 and D13; the W5 amendment's C2, C15, C17, C18 and C21;
 * `representation-gaps.md` RG3; spec readings 5, 79 and 85 to 88).
 *
 * Two layers of rows hold a test's structure.
 *
 * **The documents.** Every document whose root is a test or a section has a {@link TestDocument}
 * row, the owner of three counted families: its sites' targets ({@link SiteTarget}, each section
 * ref and each `xi:include` a section holds as a part, where it names a document), its names
 * ({@link Named}, each test part, section, section ref and item ref) and its branch rules that name
 * a target ({@link BranchRule}). Each section is a {@link Section}, the owner of its parts
 * ({@link SectionMember}, C15's counted family), with its `qti-selection`
 * ({@link SectionSelection}) and its `qti-ordering` ({@link SectionOrdering}) beside it. Each href
 * of an item ref or a site resolves, against its document's path or the `xml:base` in scope, to an
 * entry of the package through its `ReferencePath` (`#pantry/qti/package.ts` `hrefPaths`, spec
 * readings 102 and 103).
 *
 * **The assembled test** (RG3, reading 5). {@link Instance} is a tree: its root is a document that
 * heads an assembly, every assembled document no include splices in place ({@link splicingParents},
 * reading 117), and each instance has exactly one child per site of its document, the instance of
 * the document that site names. A chain of section refs and includes that returns to a document
 * already on it would need infinitely many instances, so no finite tree holds it: the count law
 * `children = sites` refuses one a head reaches, and `TestDocument.instances` above 0 one no head
 * reaches, whose documents no assembly places (reading 85). Under a test's root,
 * each instance carries one {@link InstanceName} per name of its document, and their projection
 * {@link AssembledName} holds each written element once per test, so a section document placed
 * twice names nothing twice, and the key on `(assembly, identifier)` is reading 86's one namespace.
 * Each branch rule of each instance resolves once ({@link BranchResolution}), to a target of its
 * kind in its own test part, in an instance that holds it, not inside a placement it is outside of,
 * never an item ref a replacement can repeat (`Branch_target`), and after its source's end unless
 * the section that orders the two shuffles (`Branch_forward`, reading 87). A section document no
 * test places resolves nothing.
 *
 * Beside them: an item ref's variable mappings ({@link VariableMapping}, reading 97) and an item's
 * stimulus refs ({@link StimulusRef}), each keyed by its node with its law a key, and the item each
 * item ref names ({@link ItemRefTarget} and {@link ItemRefDocument}, B2 and B3).
 *
 * Every attribute value a law compares is copied from `Attribute` (C18) beside the key over its
 * selection that keeps its lexical form out of every index (the addendum's "Text in keys"), and
 * compared collapsed, as every QTI identifier type and `xs:anyURI` collapse whitespace: a
 * {@link TestToken} proves `lexical = lead ‖ value ‖ trail`, a {@link TestFlag} reads an
 * `xs:boolean`, and a selection's `select` is cast from its proved form (G-parse).
 *
 * Every check is named by the oracle law it states, its spaces written as underscores. The hrefs
 * this module reads resolve under `#pantry/qti/package.ts`'s stated limit `Href form`, never a law
 * of QTI.
 */
import {
  accumulated,
  bits,
  check,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  fold,
  generated,
  key,
  lexical,
  mirrors,
  Monoid,
  natural,
  on,
  pg,
  relation,
  select,
  tree,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import type { Kind, Name } from "#pantry/grammar/compose.ts";
import { booleanTruePattern } from "#pantry/grammar/domains.ts";
import {
  AttributeName,
  Flag,
  grammar,
  IncludeParent,
  IncludeParentKind,
  IncludeRoot,
  includeParentKinds,
  NodeKind,
  ResourceType,
  SchemaVersion,
  TypeName,
} from "#pantry/grammar/install.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import { Document, EntryPath } from "#pantry/qti/chardata.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeContext, nodeRef } from "#pantry/qti/node.ts";
import { hrefPaths, NamedHref } from "#pantry/qti/package.ts";

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
const selectionKind = "qti-selection" satisfies Kind;

/**
 * A section's ordering.
 */
const orderingKind = "qti-ordering" satisfies Kind;

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
 * The item built-ins a variable mapping's target may not name (information model §2.2.2, §4.5.1:
 * "The identifiers of the built-in session variables are reserved").
 */
export const sessionVariables = ["completionStatus", "numAttempts", "duration"] as const;

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
 * it, since an included fragment is judged in place, as its merged document holds it, and not alone
 * (spec reading 117). Every parent the information model gives an Include is one but a section,
 * whose includes follow a section document's rule (reading 117: reading 86's rule that a section
 * document a test places twice is written once "is the information model's for section documents in
 * a test's assembly ... and includes in a section follow it"). A section's include stands for an
 * item ref, a section or a section ref alone (`IncludeRoot`), and no other parent's include stands
 * for any of them.
 *
 * The schema's heads ({@link inclusionLaws}), the import's (`#pantry/import/overlays/tests.ts`
 * `assembledRowsOf`) and the law oracle's documents judged in place (`#pantry/test/oracle.ts`)
 * read this list, and nothing else decides a head.
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
 * The kinds an item ref, section or section ref branches to (reading 87): every name but a test
 * part.
 */
const sectionTargets = [
  itemRefKind,
  sectionKind,
  sectionRefKind,
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
 * The attribute names this module copies as collapsed text into {@link TestToken}.
 */
export const tokenNames = [
  "identifier",
  "target",
  "source-identifier",
  "target-identifier",
] as const satisfies readonly Name[];

/**
 * The `xs:boolean` attributes this module copies into {@link TestFlag}, each with the kinds that
 * carry it here: a section's `keep-together` and `visible`, an item ref's and a section's
 * `required`, an ordering's `shuffle`, and a selection's `with-replacement`.
 */
export const flagCarriers = [
  ["keep-together", [sectionKind]],
  ["required", [itemRefKind, sectionKind]],
  ["shuffle", [orderingKind]],
  ["visible", [sectionKind]],
  ["with-replacement", [selectionKind]],
] as const satisfies readonly (readonly [Name, readonly Kind[]])[];

/**
 * The name of an attribute {@link TestFlag} holds.
 */
export type FlagName = (typeof flagCarriers)[number][0];

/**
 * The nil uuid: the start of an accumulated uuid copy, which every member's owner replaces.
 */
const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * A selection's `select` once its whitespace is split off: an integer's lexical form, which
 * `Compute.cast` reads total (G-parse); AL1 has proved the whole an `xs:int`.
 */
export const SelectForm = lexical(pg.bigint);

/**
 * A collapsed value: no whitespace at either end, and something between. An NCName holds no
 * whitespace at all, so an identifier's collapsed form is this.
 */
export const collapsedPattern =
  "^(?:[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]|[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}][\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]*[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}])$";

/**
 * A document of a test or a section, keyed by its document node: its entry, its root kind, and
 * the counts of its three families. Its hrefs resolve against its path or the `xml:base` in
 * scope (`#pantry/qti/package.ts` `ReferencePath`).
 *
 * - **the host's:** `node`, `package`, `path` and `rootKind` (its `Document` row's);
 * - **drawn:** `sites`, `names` and `rules`, the counts of {@link siteFamily}, {@link nameFamily} and
 *   {@link ruleFamily}; and `instances`, its placements in every assembly, the count of
 *   {@link documentInstanceFamily}, which "Inclusion cycle" holds above 0.
 */
export const TestDocument = relation(
  "TestDocument",
  {
    instances: drawn(natural),
    names: drawn(natural),
    node: uuid,
    package: uuid,
    path: EntryPath,
    rootKind: closedId(NodeKind),
    rules: drawn(natural),
    sites: drawn(natural),
  },
  ["node"],
);

/**
 * An attribute value this module compares across rows, collapsed: an identifier or a branch rule's
 * target, keyed by its element and its name.
 *
 * - **the host's:** `node` and `name`; `lexical`, the attribute's lexical form, which its copy from
 *   `Attribute` proves; and `lead`, `value` and `trail`, the whitespace before it, its collapsed
 *   value and the whitespace after, which `E1_derived` proves.
 *
 * A lexical form longer than `keyText` holds has no row, and is refused under the schema's key text
 * bound.
 */
export const TestToken = relation(
  "TestToken",
  {
    lead: Space,
    lexical: keyText,
    name: closedId(AttributeName),
    node: uuid,
    trail: Space,
    value: keyText,
  },
  ["node", "name"],
);

/**
 * An `xs:boolean` attribute this module reads, keyed by its element and its name: its lexical form,
 * copied from `Attribute`; its value, which `E1_derived` proves from the form; and its element's
 * kind and parent's kind, through `Node`'s `(id, kind, parentKind)`, so a required part is told
 * from a required section a test part holds.
 */
export const TestFlag = relation(
  "TestFlag",
  {
    kind: closedId(NodeKind),
    lexical: keyText,
    name: closedId(AttributeName),
    node: uuid,
    parentKind: closedId(NodeKind),
    value: pg.boolean,
  },
  ["node", "name"],
);

/**
 * A test part, section, section ref or item ref, keyed by its node: the elements whose identifiers
 * are one namespace across the assembled test (reading 86), and among which branch rules jump.
 *
 * - **the host's:** its {@link nodeRef} tuple; `end`, its node's; `parentKind`, its parent's kind;
 *   `identifier`, its collapsed identifier ({@link TestToken}); and its scope in its own document:
 *   `part`, the test part that holds it (itself for a test part, the document node where none
 *   does); `replaced`, whether a section above it selects with replacement; and, for a section,
 *   `mixes`, whether its children's order is drawn at delivery, and `looseChain`, whether it and
 *   every section above it in its document is invisible and not kept together, so the order of the
 *   section that places the document reaches it. Both are false on every other kind.
 */
export const Named = relation(
  "Named",
  {
    document: uuid,
    end: natural,
    identifier: keyText,
    kind: closedId(NodeKind),
    looseChain: pg.boolean,
    mixes: pg.boolean,
    nearest: uuid,
    node: uuid,
    parent: uuid,
    parentKind: closedId(NodeKind),
    part: uuid,
    replaced: pg.boolean,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A section, keyed by its node: the owner of its parts ({@link sectionFamily}), with the facts of
 * its own attributes and children that the scope of its descendants reads.
 *
 * - **the host's:** its {@link nodeRef} tuple; `parentKind`; `visible` and `keepTogether`, its
 *   attributes' values (`keep-together` true where it writes none); `shuffle`, its ordering's
 *   `shuffle`, and `withReplacement`, its selection's `with-replacement`, each false without the
 *   child or the attribute; and its scope: `part`; `replaced` and `replacing`, whether a section
 *   above it, or it or one above it, selects with replacement; `parentMixes` and `mixes`, whether
 *   its parent's and its own children's order is drawn at delivery (a shuffle, or an invisible
 *   section not kept together whose parent's order is drawn, information model §5.98); and
 *   `parentLooseChain` and `looseChain`, as {@link Named} reads them, true above a document's
 *   root;
 * - **drawn:** `members`, its parts' count;
 * - **accumulated:** `required`, the count of its parts whose `required` is true, the end of
 *   {@link requiredFold}.
 */
export const Section = relation(
  "Section",
  {
    document: uuid,
    keepTogether: pg.boolean,
    kind: closedId(NodeKind),
    looseChain: pg.boolean,
    members: drawn(natural),
    mixes: pg.boolean,
    nearest: uuid,
    node: uuid,
    parent: uuid,
    parentKind: closedId(NodeKind),
    parentLooseChain: pg.boolean,
    parentMixes: pg.boolean,
    part: uuid,
    replaced: pg.boolean,
    replacing: pg.boolean,
    required: accumulated(natural, 0n),
    shuffle: pg.boolean,
    start: natural,
    version: closedId(SchemaVersion),
    visible: pg.boolean,
    withReplacement: pg.boolean,
  },
  ["node"],
);

/**
 * One part of a section (C15): an item ref, section, section ref or include it holds as a child,
 * keyed by its node, its `section` the node's parent, and `required`, whether its `required` is
 * true (false where it writes none, or its kind carries none). It owns no sequence.
 */
export const SectionMember = relation(
  "SectionMember",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    required: pg.boolean,
    section: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A section's `qti-selection`, keyed by its node, its `parent` the section: an optional child, so a
 * row of its own.
 *
 * - **the host's:** its {@link nodeRef} tuple; `selectLexical`, its `select` as written, and
 *   `selectLead`, `selectForm` and `selectTrail`, the form's split around its collapsed integer;
 *   `withReplacement`, its `with-replacement` (false where it writes none); and `members` and
 *   `required`, its section's counts of parts and of required parts, which a containment into
 *   {@link Section} proves;
 * - **generated:** `select`, the integer `selectForm` names (G-parse), an `xs:int` by AL1.
 */
export const SectionSelection = relation.generated(
  "SectionSelection",
  {
    document: uuid,
    kind: closedId(NodeKind),
    members: natural,
    nearest: uuid,
    node: uuid,
    parent: uuid,
    required: natural,
    selectForm: SelectForm,
    selectLead: Space,
    selectLexical: keyText,
    selectTrail: Space,
    start: natural,
    version: closedId(SchemaVersion),
    withReplacement: pg.boolean,
  },
  ["node"],
  (r) => ({ select: generated(pg.bigint, Compute.cast(r.selectForm, pg.bigint)) }),
);

/**
 * A section's `qti-ordering`, keyed by its node, its `parent` the section: its {@link nodeRef}
 * tuple and its `shuffle` (false where it writes none).
 */
export const SectionOrdering = relation(
  "SectionOrdering",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    shuffle: pg.boolean,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A site, keyed by its node: a section ref, or an include under a parent the information model
 * gives an Include (spec reading 114), each the place where the document it names is merged into
 * its own (information model §7.5 and §2.12).
 *
 * - **the host's:** its node's context, the {@link nodeContext} tuple (`node`, `children`,
 *   `ancestry`, `document`, `governs`, `kind`, `nearest`, `nearestKind`, `parentKind`, `start`,
 *   `version`), which also holds its {@link nodeRef} fields but `parent`; `parent`; its href's
 *   `package` and `path` (its `ReferencePath`, `#pantry/qti/package.ts` `hrefPaths`); and the scope
 *   it is placed in, its parent's: `part`, `replaced` (its parent section's `replacing`),
 *   `parentMixes` and `parentLooseChain`.
 *
 * Its `part` is the test part it sits in: its parent section's under a section, its parent under a
 * test part, and its own document under any other parent (an item's body or processing, a
 * fragment's content, a test's feedback), where its placement takes its placing instance's part
 * ({@link placedScope}). Only a section's scope is replaced, mixed or loose, so a site under any
 * other parent is none of them.
 *
 * The document its href names is its {@link SiteTarget}, a row of its own, since a href may name
 * none (spec reading 115).
 */
export const Site = relation(
  "Site",
  {
    ancestry: bits(Flag),
    children: natural,
    document: uuid,
    governs: closedId(TypeName),
    kind: closedId(NodeKind),
    nearest: uuid,
    nearestKind: closedId(NodeKind),
    node: uuid,
    package: uuid,
    parent: uuid,
    parentKind: closedId(NodeKind),
    parentLooseChain: pg.boolean,
    parentMixes: pg.boolean,
    part: uuid,
    path: keyText,
    replaced: pg.boolean,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A site's target, keyed by the site's node: the document its href names, a row only where the
 * href names a document of the package, so a site whose href names none has no row, and "Include
 * target" refuses it (spec readings 114 and 115). It is the member of the family of the sites that
 * name a document ({@link siteTargetFamily}), so every member's owner is a document the package
 * writes, and of its own document's ({@link siteFamily}), so a site that names none places nothing.
 *
 * - **the host's:** `target`, the document, with its root kind (`targetRoot`) and its context's
 *   nearest interaction (`targetNearest`, `targetNearestKind`);
 * - **the site's copies:** its `document`; its href's `package` and `path`; its `kind`, `parentKind`
 *   and `version`; its own context's nearest interaction (`nearest`, `nearestKind`); and its
 *   `ancestry`, its part of the target's context (`Document.context`, the union over the sites that
 *   name a document, spec reading 117).
 */
export const SiteTarget = relation(
  "SiteTarget",
  {
    ancestry: bits(Flag),
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    nearestKind: closedId(NodeKind),
    node: uuid,
    package: uuid,
    parentKind: closedId(NodeKind),
    path: keyText,
    target: uuid,
    targetNearest: uuid,
    targetNearestKind: closedId(NodeKind),
    targetRoot: closedId(NodeKind),
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * An include's site as an include, keyed by its node: its version, its parent's kind and the
 * `IncludeParent` handle that kind is, and its target's root kind, the kind the include stands for
 * (spec reading 114). An optional value is a row of its own: a section ref has none.
 */
export const Inclusion = relation(
  "Inclusion",
  {
    includeParent: closedId(IncludeParent),
    node: uuid,
    parentKind: closedId(NodeKind),
    root: closedId(NodeKind),
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A branch rule whose target is no reserved exit, keyed by its node: its {@link nodeRef} tuple,
 * its owner's kind (`parentKind`, its parent being its source), and its collapsed `target`. A rule
 * that names an exit is valid wherever it stands and has no row.
 */
export const BranchRule = relation(
  "BranchRule",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    parentKind: closedId(NodeKind),
    start: natural,
    target: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One placement of a document in an assembly, the tree of RG3 (`representation-gaps.md` §3.3): its
 * root an assembly's own document, and each other row the section document one site of its
 * parent's document names.
 *
 * - **the host's:** `id` (the root's is its document node's); `assembly`, the root field, on the root
 *   alone; `document`, the document it places, and `rootKind`, that document's root kind;
 *   `assemblyKind`, its root's; `site`, the site of its parent's document it is placed at (the
 *   root's own id), with that site's `siteStart`, `sitePart`, `siteReplaced`, `siteMixes` and
 *   `siteLooseChain`; and its scope in the assembly: `part`, the test part it sits in (the root's
 *   own id where none), `replaced`, whether a section above it selects with replacement, and
 *   `mixes`, whether the order its document's root section sits in is drawn at delivery;
 * - **the tree's group:** `parent`;
 * - **drawn:** `at`, `children`, `start` and `end`, and `names` and `rules`, the counts of its
 *   {@link instanceNameFamily} and {@link resolutionFamily}; and the counts of its document's rows
 *   it places (spec reading 117): `bindings`, Q5.09's `PlacedBinding` rows, under an item's
 *   assembly alone; `choices` and `hottexts`, Q5.09's `PlacedChoice` and `PlacedHottext` rows; and
 *   `ids` and `idrefTargets`, Q5.07's `PlacedId` and `PlacedIdref` rows, each its document's count;
 *   and `langs` and `variables`, Q5.07's `PlacedXmlLang` and Q5.10's `PlacedVariableRef` rows,
 *   under an item's assembly alone;
 * - **accumulated** along the tree's owner axis: `parentDocument`, `parentPart`, `parentReplaced` and
 *   `parentMixes`, its parent's.
 */
export const Instance = relation(
  "Instance",
  {
    assembly: uuid,
    assemblyKind: closedId(NodeKind),
    at: drawn(natural),
    bindings: drawn(natural),
    children: drawn(natural),
    choices: drawn(natural),
    document: uuid,
    end: drawn(natural),
    hottexts: drawn(natural),
    id: uuid,
    idrefTargets: drawn(natural),
    ids: drawn(natural),
    langs: drawn(natural),
    mixes: pg.boolean,
    names: drawn(natural),
    parent: uuid,
    parentDocument: accumulated(uuid, nilUuid),
    parentMixes: accumulated(pg.boolean, false),
    parentPart: accumulated(uuid, nilUuid),
    parentReplaced: accumulated(pg.boolean, false),
    part: uuid,
    replaced: pg.boolean,
    rootKind: closedId(NodeKind),
    rules: drawn(natural),
    site: uuid,
    siteLooseChain: pg.boolean,
    siteMixes: pg.boolean,
    sitePart: uuid,
    siteReplaced: pg.boolean,
    siteStart: natural,
    start: drawn(natural),
    variables: drawn(natural),
  },
  ["id"],
);

/**
 * One name of one instance of a test's assembly, keyed by the instance and the name's node: a
 * {@link Named} of the instance's document, with its scope in the assembly.
 *
 * - **the host's:** `instance`, `node`, and `assembly`, the group key its projection counts it by;
 *   its {@link Named} row's `identifier`, `kind`, `start`, `end`, `namedPart`, `namedReplaced`,
 *   `namedMixes` and `namedLooseChain`; and its scope in the assembly: `part` (its own document's
 *   where it has one, else its instance's), `replaced` (its own document's or its instance's) and
 *   `mixes` (its own document's, or its instance's through a loose chain);
 * - **accumulated** along {@link instanceNameFamily}'s owner axis: `document`, `instancePart`,
 *   `instanceReplaced` and `instanceMixes`, its instance's.
 */
export const InstanceName = relation(
  "InstanceName",
  {
    assembly: uuid,
    document: accumulated(uuid, nilUuid),
    end: natural,
    identifier: keyText,
    instance: uuid,
    instanceMixes: accumulated(pg.boolean, false),
    instancePart: accumulated(uuid, nilUuid),
    instanceReplaced: accumulated(pg.boolean, false),
    kind: closedId(NodeKind),
    mixes: pg.boolean,
    namedLooseChain: pg.boolean,
    namedMixes: pg.boolean,
    namedPart: uuid,
    namedReplaced: pg.boolean,
    node: uuid,
    part: uuid,
    replaced: pg.boolean,
    start: natural,
  },
  ["instance", "node"],
);

/**
 * A written element of a test's assembly, keyed by the test and the element's node, a projection
 * of {@link InstanceName}: a section document placed twice is one document, so each of its
 * elements is one row here however often it is placed (reading 86), its `placements` the instances
 * that place it.
 */
export const AssembledName = relation(
  "AssembledName",
  { assembly: uuid, identifier: keyText, node: uuid, placements: drawn(natural) },
  ["assembly", "node"],
);

/**
 * One branch rule of one instance of a test's assembly, resolved, keyed by the instance and the
 * rule (reading 87).
 *
 * - **the host's:** `instance` and `rule`; the rule's `target`, `owner` (its source) and `ownerKind`;
 *   the owner's place in the instance, `ownerStart`, `ownerEnd` and `ownerPart`; the target,
 *   `targetInstance` and `targetNode`, with that name's `targetKind`, `targetPart`,
 *   `targetReplaced`, `targetMixes`, `targetStart` and `targetEnd`, and its instance's
 *   `targetInstanceStart` and `targetInstanceEnd`; `via`, the child of the target's instance on the
 *   way down to the rule's (the rule's own instance where they are one), with its `viaParent`,
 *   `viaStart`, `viaEnd` and `viaSiteStart`; and `common`, the nearest element holding the source
 *   and the target in the target's document, and `branch`, its child that holds the target, each
 *   with the fields the ordering law reads (both the target where the law needs neither);
 * - **accumulated** along {@link resolutionFamily}'s owner axis: `assembly`, `document` and
 *   `instanceStart`, the instance's.
 *
 * The instance's `end` is not copied. {@link instanceTree} draws it on leaving the instance, after
 * the instance's members, so grizzle's write filler refuses an owner-axis copy of it, and with it
 * every ChangeSet of the schema (`docs/grizzle-findings.md`, R87). The law needs only the start:
 * a pre-order interval `[start, end)` holds an instance exactly when it holds the instance's
 * `start`, so `Branch_target` places the rule's instance inside the target's instance and inside
 * `via` by `instanceStart` alone.
 */
export const BranchResolution = relation(
  "BranchResolution",
  {
    assembly: accumulated(uuid, nilUuid),
    branch: uuid,
    branchEnd: natural,
    branchParent: uuid,
    branchPart: uuid,
    branchStart: natural,
    common: uuid,
    commonEnd: natural,
    commonKind: closedId(NodeKind),
    commonMixes: pg.boolean,
    commonPart: uuid,
    commonReplaced: pg.boolean,
    commonStart: natural,
    document: accumulated(uuid, nilUuid),
    instance: uuid,
    instanceStart: accumulated(natural, 0n),
    owner: uuid,
    ownerEnd: natural,
    ownerKind: closedId(NodeKind),
    ownerPart: uuid,
    ownerStart: natural,
    rule: uuid,
    target: keyText,
    targetEnd: natural,
    targetInstance: uuid,
    targetInstanceEnd: natural,
    targetInstanceStart: natural,
    targetKind: closedId(NodeKind),
    targetMixes: pg.boolean,
    targetNode: uuid,
    targetPart: uuid,
    targetReplaced: pg.boolean,
    targetStart: natural,
    via: uuid,
    viaEnd: natural,
    viaParent: uuid,
    viaSiteStart: natural,
    viaStart: natural,
  },
  ["instance", "rule"],
);

/**
 * An item ref's variable mapping, keyed by its node (information model §7.48): its
 * {@link nodeRef} tuple, its item ref (`parent`), and its collapsed `source` and `target`, the
 * item's outcome and the name the test reads it by.
 */
export const VariableMapping = relation(
  "VariableMapping",
  {
    document: uuid,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    source: keyText,
    start: natural,
    target: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * An item's stimulus ref, keyed by its node (information model §7.6): its {@link nodeRef} tuple
 * and its collapsed `identifier`.
 */
export const StimulusRef = relation(
  "StimulusRef",
  {
    document: uuid,
    identifier: keyText,
    kind: closedId(NodeKind),
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

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

/**
 * What an item ref names, keyed by the item ref's node (the UP audit's B2 and B3): its href's
 * `package` and `path` (its `ReferencePath`, `#pantry/qti/package.ts` `hrefPaths`), and `type`, the
 * type of the resource of the package whose href's path that is (`NamedHref`), which "Item ref
 * target" judges: the URI an item ref holds is "the URI used to refer to the item's file (e.g.,
 * elsewhere in the same content package)" (information model §5.6.5, `href`), so it names an item
 * of the package, or an LTI link (R36). An item it names is an {@link ItemRefDocument} row of its
 * own.
 *
 * In the corpus, feedbackTest's item ref `Example03-feedbackBlock-solution/...` names no file of
 * its package, and testWithLti's two item refs name LTI links; both packages are refused at the
 * codec today (`unmodeled-vocabulary`), so no verdict moves.
 */
export const ItemRefTarget = relation(
  "ItemRefTarget",
  { node: uuid, package: uuid, path: keyText, type: closedId(ResourceType) },
  ["node"],
);

/**
 * The item document an item ref names, keyed by the item ref's node: one row for each
 * {@link ItemRefTarget} of the item type, and none for an LTI link's. Every law that reads what an
 * item ref's item declares reads it here.
 */
export const ItemRefDocument = relation(
  "ItemRefDocument",
  { document: uuid, node: uuid, package: uuid, path: keyText },
  ["node"],
);

/**
 * This module's relations, each under its own name, as `#pantry/qti/schema.ts` composes them.
 */
export const testRelations = {
  AssembledName,
  BranchResolution,
  BranchRule,
  Inclusion,
  Instance,
  InstanceName,
  ItemRefDocument,
  ItemRefTarget,
  Named,
  Section,
  SectionMember,
  SectionOrdering,
  SectionSelection,
  Site,
  SiteTarget,
  StimulusRef,
  TestDocument,
  TestFlag,
  TestToken,
  VariableMapping,
};

/**
 * Each document's sites that name a document, counted by `TestDocument.sites`: the children its
 * instance places (reading 85). A site that names none places nothing, and "Include target" alone
 * refuses it (reading 115).
 */
export const siteFamily = counted(on(SiteTarget, "document"), fin(TestDocument, "sites"));

/**
 * The sites that name each document, counted by `Document.targetedBy` (spec reading 117).
 */
export const siteTargetFamily = counted(on(SiteTarget, "target"), fin(Document, "targetedBy"));

/**
 * A document's context: the union of the ancestries of the sites that name it, `Document.context`,
 * empty where none does. Every node below the document node inherits it, so the existing N6 judges
 * an included fragment's content under every placement at once: a ban is a disjointness, and a
 * flag no placement holds is banned under none (spec reading 117).
 */
export const contextFold = fold(
  siteTargetFamily,
  Monoid.or,
  on(SiteTarget, "target", "ancestry"),
  on(Document, "node", "context"),
);

/**
 * The sites that splice their target in place: each include under one of {@link splicingParents}.
 */
const splicingSites = select(SiteTarget, (s) =>
  s.and(s.eq(s.kind, includeKind), s.in(s.parentKind, splicingParents)),
);

/**
 * The includes that splice each document in place, counted into `Document.spliced`, 0 exactly where
 * the document heads an assembly (spec reading 117, {@link splicingParents}). "No include splices
 * it" is an anti-join, which no grizzle statement is: a statement is conditioned on no row being
 * absent, and there are no outer joins (grizzle's README, Limits; the absence limit lane VD
 * records). The count stands in for it as a fold over keyed `SiteTarget` rows, each a site that
 * exists, so 0 is a count of none and no sentinel.
 */
export const splicedFold = fold(
  siteTargetFamily,
  Monoid.count,
  on(splicingSites, "target"),
  on(Document, "node", "spliced"),
);

/**
 * Each document's names, counted by `TestDocument.names`.
 */
export const nameFamily = counted(on(Named, "document"), fin(TestDocument, "names"));

/**
 * Each document's branch rules that name a target, counted by `TestDocument.rules`.
 */
export const ruleFamily = counted(on(BranchRule, "document"), fin(TestDocument, "rules"));

/**
 * Each section's parts (C15), counted by `Section.members`: reading 79's count, each part once.
 */
export const sectionFamily = counted(on(SectionMember, "section"), fin(Section, "members"));

/**
 * The placements of every assembly, each assembly's root its own document's instance.
 */
export const instanceTree = tree(on(Instance, "parent", "at"), fin(Instance, "children"), {
  root: "assembly",
});

/**
 * Each assembled document's placements in every assembly, counted by `TestDocument.instances`.
 */
export const documentInstanceFamily = counted(
  on(Instance, "document"),
  fin(TestDocument, "instances"),
);

/**
 * Each instance's names, counted by `Instance.names`.
 */
export const instanceNameFamily = counted(on(InstanceName, "instance"), fin(Instance, "names"));

/**
 * Each written element's placements in a test's assembly, counted by `AssembledName.placements`.
 */
export const assembledNameFamily = counted(
  on(InstanceName, "assembly", "node"),
  fin(AssembledName, "placements"),
);

/**
 * Each instance's resolved branch rules, counted by `Instance.rules`.
 */
export const resolutionFamily = counted(on(BranchResolution, "instance"), fin(Instance, "rules"));

/**
 * The includes the information model reads as Include (spec reading 114): each `xi:include` under
 * a parent whose content model holds an explicit include particle. Each is a site.
 */
const includes = select(Node, (n) =>
  n.and(n.eq(n.kind, includeKind), n.in(n.parentKind, includeParentKinds)),
);

/**
 * The documents in an assembly: each has its `TestDocument` row, and its IDREFs resolve per
 * instance (spec reading 117).
 */
const assembledDocuments = select(Document, (d) => d.eq(d.assembled, true));

/**
 * The documents that head an assembly: each assembled document no include splices in place
 * ({@link splicedFold}), so an included fragment is judged where it is included and not alone
 * (spec reading 117), and every other assembled document, a test, a section, an item, a stimulus,
 * a response processing template or a fragment no include splices, is judged as its own merged
 * document.
 */
const headDocuments = select(Document, (d) => d.and(d.eq(d.assembled, true), d.eq(d.spliced, 0n)));

/**
 * The instances of an item's assembly, each of which places its document's bindings (Q5.09's
 * `PlacedBinding`, spec reading 117).
 */
const itemInstances = select(Instance, (i) => i.eq(i.assemblyKind, itemKind));

/**
 * The sites that are section refs, each naming a section document (information model §7.5).
 */
const sectionRefSites = select(Site, (s) => s.eq(s.kind, sectionRefKind));

/**
 * The targets of the sites that are section refs, each a section document (information model §7.5).
 */
const sectionRefTargets = select(SiteTarget, (s) => s.eq(s.kind, sectionRefKind));

/**
 * The sites that are includes, each naming a document of the package (spec reading 115).
 */
const includeSites = select(Site, (s) => s.eq(s.kind, includeKind));

/**
 * The targets of the sites that are includes, each with its {@link Inclusion}.
 */
const includeTargets = select(SiteTarget, (s) => s.eq(s.kind, includeKind));

/**
 * Select the nodes of one kind, a constant selection, whose containments share `Node`'s one
 * `UNIQUE (id, kind)`.
 *
 * @param kind - The kind.
 * @returns The selection.
 */
const nodesOf = (kind: Kind) => select(Node, (n) => n.eq(n.kind, kind));

/**
 * Select the attributes of one name on elements of some kinds: the source of a copy (C18), beside
 * the key over its node that serves the copy's reverse probe.
 *
 * @param name - The attribute's name.
 * @param kinds - The elements' kinds.
 * @returns The selection.
 */
const attributesOf = (name: Name, kinds: readonly Kind[]) =>
  select(Attribute, (a) => a.and(a.eq(a.name, name), a.in(a.kind, kinds)));

/**
 * Select the tokens of one name, a constant selection.
 *
 * @param name - The attribute's name.
 * @returns The selection.
 */
const tokensOf = (name: (typeof tokenNames)[number]) =>
  select(TestToken, (t) => t.eq(t.name, name));

/**
 * Select the flags of one name, a constant selection.
 *
 * @param name - The attribute's name.
 * @returns The selection.
 */
const flagsOf = (name: FlagName) => select(TestFlag, (f) => f.eq(f.name, name));

/**
 * The copy of one attribute into {@link TestToken} (C18): the key over its selection's node, which
 * serves the copy's reverse probe, the copy of its lexical form, and each token's attribute.
 *
 * @param name - The attribute's name.
 * @param kinds - The kinds that carry it.
 * @returns The three statements.
 */
const tokenCopy = (name: (typeof tokenNames)[number], kinds: readonly Kind[]) => {
  const source = attributesOf(name, kinds);

  return [
    key(on(source, "node")),
    contained(on(source, "node", "name", "lexical"), on(TestToken, "node", "name", "lexical")),
    contained(on(tokensOf(name), "node"), on(source, "node")),
  ] as const;
};

/**
 * The copy of one attribute into {@link TestFlag}, as {@link tokenCopy} copies a token.
 *
 * @param carrier - The attribute's name and the kinds that carry it.
 * @returns The three statements.
 */
const flagCopy = ([name, kinds]: (typeof flagCarriers)[number]) => {
  const source = attributesOf(name, kinds);

  return [
    key(on(source, "node")),
    contained(on(source, "node", "name", "lexical"), on(TestFlag, "node", "name", "lexical")),
    contained(on(flagsOf(name), "node"), on(source, "node")),
  ] as const;
};

/**
 * The flags that make an element required: its `required` written true.
 */
const requiredFlags = select(TestFlag, (f) => f.and(f.eq(f.name, "required"), f.eq(f.value, true)));

/**
 * The required elements a section holds as parts: a true `required` on a child of a section.
 */
const requiredParts = select(TestFlag, (f) =>
  f.and(f.eq(f.name, "required"), f.eq(f.value, true), f.eq(f.parentKind, sectionKind)),
);

/**
 * The parts whose `required` is true.
 */
const requiredMembers = select(SectionMember, (m) => m.eq(m.required, true));

/**
 * The required parts' fold (A17): each section's count of its parts whose `required` is true, its
 * `required`, which `Selection_required` bounds by `select`.
 */
export const requiredFold = fold(
  sectionFamily,
  Monoid.count,
  on(requiredMembers, "section"),
  on(Section, "node", "required"),
);

/**
 * The section documents, whose `(package, path)` a site's href names: a key, since a document's
 * path is one per package.
 */
const sectionDocuments = select(TestDocument, (d) => d.eq(d.rootKind, sectionKind));

/**
 * The tree's members, every instance but each assembly's root.
 */
const instanceMembers = select(Instance, (i) => i.gt(i.start, 0n));

/**
 * The roots of the assemblies, one per document of a test or a section.
 */
const instanceRoots = select(Instance, (i) => i.eq(i.start, 0n));

/**
 * The instances of a test's assembly, whose names and branch rules resolve.
 */
const testInstances = select(Instance, (i) => i.eq(i.assemblyKind, testKind));

/**
 * A `Section` row as a row check reads it.
 */
type SectionRow = RowScalars<typeof Section>;

/**
 * State that a section is loose: invisible and not kept together, so its children are mixed into
 * its parent's order (information model §5.98).
 *
 * @param s - The row.
 * @returns The predicate.
 */
const loose = (s: SectionRow) => s.and(s.eq(s.visible, false), s.eq(s.keepTogether, false));

/**
 * The statements over the documents' rows, law "Test overlay" but the named checks: the document,
 * its tokens and flags, its names, sections, parts, selections, orderings, sites and branch rules,
 * and each item ref's href resolved, each its element's row, copying its node's tuple and its
 * attributes' values, and each there exactly where its element is.
 */
export const testOverlayLaws = [
  contained(
    on(TestDocument, "node", "package", "path", "rootKind"),
    on(Document, "node", "package", "path", "rootKind"),
  ),
  contained(
    on(
      select(Document, (d) => d.in(d.rootKind, assembledRoots)),
      "node",
    ),
    on(TestDocument, "node"),
  ),
  siteFamily,
  nameFamily,
  ruleFamily,

  ...tokenCopy("identifier", [...namedKinds, stimulusRefKind]),
  ...tokenCopy("source-identifier", [mappingKind]),
  ...tokenCopy("target-identifier", [mappingKind]),
  ...tokenCopy("target", [branchRuleKind]),
  check("E1_derived", TestToken, (t) =>
    t.and(
      t.eq(t.lexical, Compute.concat(Compute.concat(t.lead, t.value), t.trail)),
      Compute.matches(t.value, collapsedPattern),
    ),
  ),
  ...flagCarriers.flatMap(flagCopy),
  check("E1_derived", TestFlag, (f) =>
    f.or(
      f.and(f.eq(f.value, true), Compute.matches(f.lexical, booleanTruePattern)),
      f.and(f.eq(f.value, false), f.not(Compute.matches(f.lexical, booleanTruePattern))),
    ),
  ),

  contained(
    on(Named, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(Named, "node", "end"), on(Node, "id", "end")),
  contained(on(Named, "parent", "parentKind"), on(Node, "id", "kind")),
  contained(
    on(
      select(Node, (n) => n.in(n.kind, namedKinds)),
      "id",
    ),
    on(Named, "node"),
  ),
  contained(on(Named, "node", "identifier"), on(tokensOf("identifier"), "node", "value")),
  key(on(Named, "document", "identifier")),
  contained(
    on(
      select(Named, (n) => n.eq(n.kind, sectionKind)),
      "node",
      "part",
      "replaced",
      "mixes",
      "looseChain",
    ),
    on(Section, "node", "part", "replaced", "mixes", "looseChain"),
  ),
  contained(
    on(
      select(Named, (n) => n.and(n.ne(n.kind, sectionKind), n.eq(n.parentKind, sectionKind))),
      "parent",
      "part",
      "replaced",
    ),
    on(Section, "node", "part", "replacing"),
  ),
  check("E1_derived", Named, (n) =>
    n.and(
      n.in(n.kind, namedKinds),
      n.or(n.eq(n.kind, sectionKind), n.and(n.eq(n.mixes, false), n.eq(n.looseChain, false))),
      n.or(
        n.eq(n.kind, sectionKind),
        n.and(n.ne(n.kind, partKind), n.eq(n.parentKind, sectionKind)),
        n.and(n.eq(n.kind, partKind), n.eq(n.part, n.node), n.eq(n.replaced, false)),
        n.and(
          n.ne(n.kind, partKind),
          n.eq(n.parentKind, partKind),
          n.eq(n.part, n.parent),
          n.eq(n.replaced, false),
        ),
        n.and(
          n.ne(n.kind, partKind),
          n.ne(n.parentKind, partKind),
          n.ne(n.parentKind, sectionKind),
          n.eq(n.part, n.document),
          n.eq(n.replaced, false),
        ),
      ),
    ),
  ),

  contained(
    on(Section, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  mirrors(on(Section, "node"), on(nodesOf(sectionKind), "id")),
  contained(on(Section, "parent", "parentKind"), on(Node, "id", "kind")),
  contained(on(Section, "node", "visible"), on(flagsOf("visible"), "node", "value")),
  contained(on(flagsOf("keep-together"), "node", "value"), on(Section, "node", "keepTogether")),
  contained(
    on(
      select(Section, (s) => s.eq(s.keepTogether, false)),
      "node",
    ),
    on(flagsOf("keep-together"), "node"),
  ),
  contained(
    on(
      select(Section, (s) => s.eq(s.parentKind, sectionKind)),
      "parent",
      "part",
      "replaced",
      "parentMixes",
      "parentLooseChain",
    ),
    on(Section, "node", "part", "replacing", "mixes", "looseChain"),
  ),
  check("E1_derived", Section, (s) =>
    s.and(
      s.or(
        s.eq(s.parentKind, sectionKind),
        s.and(
          s.eq(s.parentKind, partKind),
          s.eq(s.part, s.parent),
          s.eq(s.replaced, false),
          s.eq(s.parentMixes, false),
          s.eq(s.parentLooseChain, false),
        ),
        s.and(
          s.ne(s.parentKind, partKind),
          s.ne(s.parentKind, sectionKind),
          s.eq(s.part, s.document),
          s.eq(s.replaced, false),
          s.eq(s.parentMixes, false),
          s.eq(s.parentLooseChain, true),
        ),
      ),
      s.or(
        s.and(s.eq(s.replacing, true), s.or(s.eq(s.replaced, true), s.eq(s.withReplacement, true))),
        s.and(s.eq(s.replacing, false), s.eq(s.replaced, false), s.eq(s.withReplacement, false)),
      ),
      s.or(
        s.and(
          s.eq(s.mixes, true),
          s.or(s.eq(s.shuffle, true), s.and(loose(s), s.eq(s.parentMixes, true))),
        ),
        s.and(
          s.eq(s.mixes, false),
          s.eq(s.shuffle, false),
          s.or(s.not(loose(s)), s.eq(s.parentMixes, false)),
        ),
      ),
      s.or(
        s.and(s.eq(s.looseChain, true), loose(s), s.eq(s.parentLooseChain, true)),
        s.and(s.eq(s.looseChain, false), s.or(s.not(loose(s)), s.eq(s.parentLooseChain, false))),
      ),
    ),
  ),

  sectionFamily,
  contained(
    on(SectionMember, "node", "document", "kind", "start", "nearest", "version", "section"),
    nodeRef,
  ),
  contained(
    on(
      select(Node, (n) => n.and(n.eq(n.parentKind, sectionKind), n.in(n.kind, sectionParts))),
      "id",
    ),
    on(SectionMember, "node"),
  ),
  check("E1_derived", SectionMember, (m) => m.in(m.kind, sectionParts)),
  contained(on(TestFlag, "node", "kind", "parentKind"), on(Node, "id", "kind", "parentKind")),
  key(on(requiredFlags, "node")),
  contained(on(requiredMembers, "node"), on(requiredFlags, "node")),
  key(on(requiredMembers, "node")),
  contained(on(requiredParts, "node"), on(requiredMembers, "node")),
  requiredFold,

  contained(
    on(SectionSelection, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  mirrors(on(SectionSelection, "node"), on(nodesOf(selectionKind), "id")),
  key(on(attributesOf("select", [selectionKind]), "node")),
  contained(
    on(attributesOf("select", [selectionKind]), "node", "lexical"),
    on(SectionSelection, "node", "selectLexical"),
  ),
  contained(on(SectionSelection, "node"), on(attributesOf("select", [selectionKind]), "node")),
  contained(
    on(flagsOf("with-replacement"), "node", "value"),
    on(SectionSelection, "node", "withReplacement"),
  ),
  contained(
    on(
      select(SectionSelection, (s) => s.eq(s.withReplacement, true)),
      "node",
    ),
    on(flagsOf("with-replacement"), "node"),
  ),
  key(on(SectionSelection, "parent")),
  contained(
    on(SectionSelection, "parent", "members", "required", "withReplacement"),
    on(Section, "node", "members", "required", "withReplacement"),
  ),
  contained(
    on(
      select(Section, (s) => s.eq(s.withReplacement, true)),
      "node",
    ),
    on(SectionSelection, "parent"),
  ),
  check("E1_derived", SectionSelection, (s) =>
    s.eq(
      s.selectLexical,
      Compute.concat(Compute.concat(s.selectLead, s.selectForm), s.selectTrail),
    ),
  ),
  check("Selection_bound", SectionSelection, (s) =>
    s.or(s.eq(s.withReplacement, true), s.le(s.select, Compute.base(s.members))),
  ),
  check("Selection_required", SectionSelection, (s) => s.le(Compute.base(s.required), s.select)),

  contained(
    on(SectionOrdering, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  mirrors(on(SectionOrdering, "node"), on(nodesOf(orderingKind), "id")),
  contained(on(flagsOf("shuffle"), "node", "value"), on(SectionOrdering, "node", "shuffle")),
  contained(
    on(
      select(SectionOrdering, (o) => o.eq(o.shuffle, true)),
      "node",
    ),
    on(flagsOf("shuffle"), "node"),
  ),
  key(on(SectionOrdering, "parent")),
  contained(on(SectionOrdering, "parent", "shuffle"), on(Section, "node", "shuffle")),
  contained(
    on(
      select(Section, (s) => s.eq(s.shuffle, true)),
      "node",
    ),
    on(SectionOrdering, "parent"),
  ),

  contained(on(nodesOf(itemRefKind), "id"), on(hrefPaths, "node")),

  contained(
    on(
      Site,
      "node",
      "children",
      "ancestry",
      "document",
      "governs",
      "kind",
      "nearest",
      "nearestKind",
      "parentKind",
      "start",
      "version",
    ),
    nodeContext,
  ),
  contained(on(Site, "node", "parent"), on(Node, "id", "parent")),
  contained(on(Site, "node", "package", "path"), on(hrefPaths, "node", "package", "path")),
  key(on(sectionDocuments, "package", "path")),
  contained(
    on(sectionRefTargets, "package", "path", "target"),
    on(sectionDocuments, "package", "path", "node"),
  ),
  contained(on(sectionRefSites, "package", "path"), on(sectionDocuments, "package", "path")),
  contained(on(includeSites, "node"), on(SiteTarget, "node")),
  contained(
    on(
      SiteTarget,
      "node",
      "ancestry",
      "document",
      "kind",
      "nearest",
      "nearestKind",
      "parentKind",
      "version",
    ),
    on(
      Site,
      "node",
      "ancestry",
      "document",
      "kind",
      "nearest",
      "nearestKind",
      "parentKind",
      "version",
    ),
  ),
  contained(on(SiteTarget, "node", "package", "path"), on(Site, "node", "package", "path")),
  contained(
    on(SiteTarget, "package", "path", "target", "targetRoot", "targetNearest", "targetNearestKind"),
    on(Document, "package", "path", "node", "rootKind", "contextNearest", "contextNearestKind"),
  ),
  contained(on(nodesOf(sectionRefKind), "id"), on(Site, "node")),
  contained(on(includes, "id"), on(Site, "node")),
  siteTargetFamily,
  contextFold,
  splicedFold,
  check("Fragment_context", SiteTarget, (s) =>
    s.or(
      s.and(s.eq(s.nearestKind, "document"), s.eq(s.targetNearestKind, "document")),
      s.and(s.eq(s.nearest, s.targetNearest), s.eq(s.nearestKind, s.targetNearestKind)),
    ),
  ),
  contained(
    on(Inclusion, "node", "parentKind", "root", "version"),
    on(SiteTarget, "node", "parentKind", "targetRoot", "version"),
  ),
  contained(on(includeTargets, "node"), on(Inclusion, "node")),
  check("E1_derived", Inclusion, (i) =>
    i.eq(IncludeParentKind.at("kind", i.includeParent), i.parentKind),
  ),
  contained(
    on(Inclusion, "version", "includeParent", "root"),
    on(IncludeRoot, "version", "parent", "kind"),
  ),
  contained(
    on(
      select(Site, (s) => s.eq(s.parentKind, sectionKind)),
      "parent",
      "part",
      "replaced",
      "parentMixes",
      "parentLooseChain",
    ),
    on(Section, "node", "part", "replacing", "mixes", "looseChain"),
  ),
  check("E1_derived", Site, (s) =>
    s.and(
      s.or(
        s.and(s.eq(s.kind, sectionRefKind), s.in(s.parentKind, [sectionKind, partKind])),
        s.and(s.eq(s.kind, includeKind), s.in(s.parentKind, includeParentKinds)),
      ),
      s.or(
        s.eq(s.parentKind, sectionKind),
        s.and(
          s.eq(s.parentKind, partKind),
          s.eq(s.part, s.parent),
          s.eq(s.replaced, false),
          s.eq(s.parentMixes, false),
          s.eq(s.parentLooseChain, false),
        ),
        s.and(
          s.not(s.in(s.parentKind, [sectionKind, partKind])),
          s.eq(s.part, s.document),
          s.eq(s.replaced, false),
          s.eq(s.parentMixes, false),
          s.eq(s.parentLooseChain, false),
        ),
      ),
    ),
  ),

  contained(
    on(BranchRule, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  contained(on(BranchRule, "parent", "parentKind"), on(Node, "id", "kind")),
  contained(on(BranchRule, "node", "target"), on(tokensOf("target"), "node", "value")),
  contained(
    on(
      select(TestToken, (t) => t.and(t.eq(t.name, "target"), t.not(t.in(t.value, exits)))),
      "node",
    ),
    on(BranchRule, "node"),
  ),
  check("E1_derived", BranchRule, (b) =>
    b.and(
      b.eq(b.kind, branchRuleKind),
      b.not(b.in(b.target, exits)),
      b.in(b.parentKind, [itemRefKind, sectionKind, partKind]),
    ),
  ),

  contained(
    on(VariableMapping, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  mirrors(on(VariableMapping, "node"), on(nodesOf(mappingKind), "id")),
  contained(
    on(VariableMapping, "node", "source"),
    on(tokensOf("source-identifier"), "node", "value"),
  ),
  contained(
    on(VariableMapping, "node", "target"),
    on(tokensOf("target-identifier"), "node", "value"),
  ),
  key(on(VariableMapping, "parent", "target")),
  check("Variable_mapping_target", VariableMapping, (v) => v.not(v.in(v.target, sessionVariables))),

  contained(
    on(StimulusRef, "node", "document", "kind", "start", "nearest", "version", "parent"),
    nodeRef,
  ),
  mirrors(on(StimulusRef, "node"), on(nodesOf(stimulusRefKind), "id")),
  contained(on(StimulusRef, "node", "identifier"), on(tokensOf("identifier"), "node", "value")),
  key(on(StimulusRef, "document", "identifier")),
] as const;

/**
 * An `Instance` row as a row check reads it.
 */
type InstanceRow = RowScalars<typeof Instance>;

/**
 * State that an instance's scope is its site's and its parent's: its test part the site's where
 * the site's document has one, else its parent's; a replacement above it at its site or above its
 * parent; and its order drawn where the site's parent's is, or where the site's parent is loose to
 * its document's root and its parent's order is drawn. Its document's root is any kind its site
 * may stand for: a section ref's is a section ("Document entry"), and an include's the root its
 * parent admits ("Include root", spec reading 114), which an item's body, its processing or a
 * fragment includes as well as a section does.
 *
 * @param i - The row.
 * @returns The predicate.
 */
const placedScope = (i: InstanceRow) =>
  i.and(
    i.or(
      i.and(i.eq(i.sitePart, i.parentDocument), i.eq(i.part, i.parentPart)),
      i.and(i.ne(i.sitePart, i.parentDocument), i.eq(i.part, i.sitePart)),
    ),
    i.or(
      i.and(i.eq(i.replaced, true), i.or(i.eq(i.siteReplaced, true), i.eq(i.parentReplaced, true))),
      i.and(i.eq(i.replaced, false), i.eq(i.siteReplaced, false), i.eq(i.parentReplaced, false)),
    ),
    i.or(
      i.and(
        i.eq(i.mixes, true),
        i.or(
          i.eq(i.siteMixes, true),
          i.and(i.eq(i.siteLooseChain, true), i.eq(i.parentMixes, true)),
        ),
      ),
      i.and(
        i.eq(i.mixes, false),
        i.eq(i.siteMixes, false),
        i.or(i.eq(i.siteLooseChain, false), i.eq(i.parentMixes, false)),
      ),
    ),
  );

/**
 * A `BranchResolution` row as a row check reads it.
 */
type ResolutionRow = RowScalars<typeof BranchResolution>;

/**
 * State that a resolution's target lies in its own instance.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const sameInstance = (b: ResolutionRow) => b.eq(b.targetInstance, b.instance);

/**
 * State that a resolution's target lies after its source's end (reading 87): in its own instance,
 * at or after the owner's end; in an instance above, after the site its own instance descends
 * through.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const forward = (b: ResolutionRow) =>
  b.or(
    b.and(sameInstance(b), b.ge(b.targetStart, b.ownerEnd)),
    b.and(b.not(sameInstance(b)), b.gt(b.targetStart, b.viaSiteStart)),
  );

/**
 * State that a resolution's target holds its source's point: the owner's start in its own
 * instance, the site's in an instance above.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const targetHoldsSource = (b: ResolutionRow) =>
  b.or(
    b.and(sameInstance(b), b.le(b.targetStart, b.ownerStart), b.lt(b.ownerStart, b.targetEnd)),
    b.and(
      b.not(sameInstance(b)),
      b.le(b.targetStart, b.viaSiteStart),
      b.lt(b.viaSiteStart, b.targetEnd),
    ),
  );

/**
 * State that a resolution's `common` holds its source's point, as {@link targetHoldsSource} reads
 * the point.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const commonHoldsSource = (b: ResolutionRow) =>
  b.or(
    b.and(sameInstance(b), b.le(b.commonStart, b.ownerStart), b.lt(b.ownerStart, b.commonEnd)),
    b.and(
      b.not(sameInstance(b)),
      b.le(b.commonStart, b.viaSiteStart),
      b.lt(b.viaSiteStart, b.commonEnd),
    ),
  );

/**
 * State that a resolution's `branch` holds its source's point, as {@link targetHoldsSource} reads
 * the point.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const branchHoldsSource = (b: ResolutionRow) =>
  b.or(
    b.and(sameInstance(b), b.le(b.branchStart, b.ownerStart), b.lt(b.ownerStart, b.branchEnd)),
    b.and(
      b.not(sameInstance(b)),
      b.le(b.branchStart, b.viaSiteStart),
      b.lt(b.viaSiteStart, b.branchEnd),
    ),
  );

/**
 * State that a resolution's source and target nest: the target holds the source's point, or, in
 * one instance, the owner holds the target. No shuffle reorders such a pair.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const nested = (b: ResolutionRow) =>
  b.or(
    targetHoldsSource(b),
    b.and(sameInstance(b), b.le(b.ownerStart, b.targetStart), b.lt(b.targetStart, b.ownerEnd)),
  );

/**
 * State that `common` is the nearest element holding the source and the target in the target's
 * document, and that its children's order is drawn at delivery: it holds the source's point, its
 * child `branch` holds the target and not the source's point, and it mixes.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const shuffled = (b: ResolutionRow) =>
  b.and(
    commonHoldsSource(b),
    b.eq(b.branchParent, b.common),
    b.le(b.branchStart, b.targetStart),
    b.lt(b.targetStart, b.branchEnd),
    b.not(branchHoldsSource(b)),
    b.eq(b.commonMixes, true),
  );

/**
 * The statements of reading 85's law, "Inclusion cycle": the instance tree, each instance's copy
 * of its parent's scope and of its site, one child per site, one root per head and none for any
 * other document, and two counts that make a chain returning to a document on it unrepresentable.
 *
 * - **A chain a head reaches:** the deferred foreign key `Instance(document, rootKind, children) →
 *   TestDocument(node, rootKind, sites)`, since no finite tree has one child per site under it.
 * - **A chain no head reaches**, such as two fragments each of which includes the other, which no
 *   head places, and any fragment only they place: `TestDocument.instances` above 0, since none of
 *   them is placed in any assembly. Its converse, every `Instance` row's document an assembled
 *   one's, is the foreign key above; the containment the other way, `TestDocument(node, rootKind,
 *   sites) ⊆ Instance(document, rootKind, children)`, has no key of `Instance` in its target's
 *   projection, which grizzle refuses, so the count states it.
 *
 * The heads are {@link splicingParents}'s, by `Document.spliced`, mirrored with the roots both
 * ways. Its `E1_derived` pins the root's fields and derives a member's scope.
 */
export const inclusionLaws = [
  instanceTree,
  contained(
    on(
      instanceMembers,
      "parent",
      "assemblyKind",
      "parentDocument",
      "parentMixes",
      "parentPart",
      "parentReplaced",
    ),
    on(Instance, "id", "assemblyKind", "document", "mixes", "part", "replaced"),
  ),
  contained(
    on(
      instanceMembers,
      "parentDocument",
      "site",
      "siteLooseChain",
      "siteMixes",
      "sitePart",
      "siteReplaced",
      "siteStart",
    ),
    on(Site, "document", "node", "parentLooseChain", "parentMixes", "part", "replaced", "start"),
  ),
  contained(on(instanceMembers, "site", "document"), on(SiteTarget, "node", "target")),
  key(on(instanceMembers, "parent", "site")),
  contained(
    on(Instance, "document", "rootKind", "children"),
    on(TestDocument, "node", "rootKind", "sites"),
  ),
  key(on(instanceRoots, "document")),
  mirrors(on(headDocuments, "node"), on(instanceRoots, "document")),
  documentInstanceFamily,
  check("Inclusion_cycle", TestDocument, (d) => d.gt(d.instances, 0n)),
  mirrors(on(assembledDocuments, "node"), on(TestDocument, "node")),
  contained(
    on(Instance, "document", "ids", "idrefTargets", "choices", "hottexts"),
    on(Document, "node", "ids", "idrefTargets", "choices", "hottexts"),
  ),
  contained(
    on(itemInstances, "document", "bindings", "langs", "variables"),
    on(Document, "node", "bindings", "langs", "variables"),
  ),
  check("E1_derived", Instance, (i) =>
    i.and(
      i.or(i.eq(i.assemblyKind, testKind), i.and(i.eq(i.names, 0n), i.eq(i.rules, 0n))),
      i.or(
        i.eq(i.assemblyKind, itemKind),
        i.and(i.eq(i.bindings, 0n), i.eq(i.langs, 0n), i.eq(i.variables, 0n)),
      ),
      i.or(
        i.and(
          i.eq(i.start, 0n),
          i.eq(i.document, i.id),
          i.eq(i.assemblyKind, i.rootKind),
          i.eq(i.part, i.id),
          i.eq(i.replaced, false),
          i.eq(i.mixes, false),
          i.eq(i.site, i.id),
          i.eq(i.siteStart, 0n),
          i.eq(i.sitePart, i.id),
          i.eq(i.siteReplaced, false),
          i.eq(i.siteMixes, false),
          i.eq(i.siteLooseChain, false),
        ),
        i.and(i.gt(i.start, 0n), placedScope(i)),
      ),
    ),
  ),
] as const;

/**
 * The statements of reading 86's law, "Test name key": each instance of a test's assembly holds
 * one name per name of its document, their projection holds each written element once, so a
 * section document placed twice names nothing twice, and no two written elements of one test share
 * an identifier. Its `E1_derived` derives each name's scope in the assembly.
 */
export const testNameLaws = [
  contained(on(testInstances, "document", "names"), on(TestDocument, "node", "names")),
  instanceNameFamily,
  contained(
    on(
      InstanceName,
      "instance",
      "assembly",
      "document",
      "instanceMixes",
      "instancePart",
      "instanceReplaced",
    ),
    on(Instance, "id", "assembly", "document", "mixes", "part", "replaced"),
  ),
  contained(
    on(InstanceName, "document", "node", "identifier"),
    on(Named, "document", "node", "identifier"),
  ),
  contained(
    on(
      InstanceName,
      "node",
      "end",
      "kind",
      "namedLooseChain",
      "namedMixes",
      "namedPart",
      "namedReplaced",
      "start",
    ),
    on(Named, "node", "end", "kind", "looseChain", "mixes", "part", "replaced", "start"),
  ),
  check("E1_derived", InstanceName, (n) =>
    n.and(
      n.or(
        n.and(n.eq(n.namedPart, n.document), n.eq(n.part, n.instancePart)),
        n.and(n.ne(n.namedPart, n.document), n.eq(n.part, n.namedPart)),
      ),
      n.or(
        n.and(
          n.eq(n.replaced, true),
          n.or(n.eq(n.namedReplaced, true), n.eq(n.instanceReplaced, true)),
        ),
        n.and(
          n.eq(n.replaced, false),
          n.eq(n.namedReplaced, false),
          n.eq(n.instanceReplaced, false),
        ),
      ),
      n.or(
        n.and(
          n.eq(n.mixes, true),
          n.or(
            n.eq(n.namedMixes, true),
            n.and(n.eq(n.namedLooseChain, true), n.eq(n.instanceMixes, true)),
          ),
        ),
        n.and(
          n.eq(n.mixes, false),
          n.eq(n.namedMixes, false),
          n.or(n.eq(n.namedLooseChain, false), n.eq(n.instanceMixes, false)),
        ),
      ),
    ),
  ),
  assembledNameFamily,
  contained(
    on(InstanceName, "assembly", "node", "identifier"),
    on(AssembledName, "assembly", "node", "identifier"),
  ),
  check("Test_name_key", AssembledName, (a) => a.gt(a.placements, 0n)),
  key(on(AssembledName, "assembly", "identifier")),
] as const;

/**
 * The statements of reading 87's law, "Branch target": each instance of a test's assembly
 * resolves each of its document's branch rules that names a target once, each resolution copies
 * its rule, its source, its target and the names the ordering law reads. `Branch_target` judges
 * its target's kind, part and replacement and that its instance holds the rule's, and
 * `Branch_forward` that it lies after its source's end, unless the section that orders the two
 * shuffles.
 */
export const branchLaws = [
  contained(on(testInstances, "document", "rules"), on(TestDocument, "node", "rules")),
  resolutionFamily,
  contained(
    on(BranchResolution, "instance", "assembly", "document", "instanceStart"),
    on(Instance, "id", "assembly", "document", "start"),
  ),
  contained(
    on(BranchResolution, "document", "rule", "target"),
    on(BranchRule, "document", "node", "target"),
  ),
  contained(
    on(BranchResolution, "rule", "owner", "ownerKind"),
    on(BranchRule, "node", "parent", "parentKind"),
  ),
  contained(
    on(BranchResolution, "instance", "owner", "ownerEnd", "ownerPart", "ownerStart"),
    on(InstanceName, "instance", "node", "end", "part", "start"),
  ),
  contained(
    on(BranchResolution, "targetInstance", "branch", "branchEnd", "branchPart", "branchStart"),
    on(InstanceName, "instance", "node", "end", "part", "start"),
  ),
  contained(on(BranchResolution, "branch", "branchParent"), on(Named, "node", "parent")),
  contained(
    on(BranchResolution, "targetInstance", "targetNode", "target"),
    on(InstanceName, "instance", "node", "identifier"),
  ),
  contained(
    on(
      BranchResolution,
      "targetInstance",
      "targetNode",
      "assembly",
      "targetEnd",
      "targetKind",
      "targetMixes",
      "targetPart",
      "targetReplaced",
      "targetStart",
    ),
    on(
      InstanceName,
      "instance",
      "node",
      "assembly",
      "end",
      "kind",
      "mixes",
      "part",
      "replaced",
      "start",
    ),
  ),
  contained(
    on(
      BranchResolution,
      "targetInstance",
      "common",
      "assembly",
      "commonEnd",
      "commonKind",
      "commonMixes",
      "commonPart",
      "commonReplaced",
      "commonStart",
    ),
    on(
      InstanceName,
      "instance",
      "node",
      "assembly",
      "end",
      "kind",
      "mixes",
      "part",
      "replaced",
      "start",
    ),
  ),
  contained(
    on(BranchResolution, "targetInstance", "targetInstanceEnd", "targetInstanceStart"),
    on(Instance, "id", "end", "start"),
  ),
  contained(
    on(BranchResolution, "via", "viaEnd", "viaParent", "viaSiteStart", "viaStart"),
    on(Instance, "id", "end", "parent", "siteStart", "start"),
  ),
  check("Branch_target", BranchResolution, (b) =>
    b.and(
      b.or(
        b.and(b.eq(b.ownerKind, partKind), b.eq(b.targetKind, partKind)),
        b.and(
          b.ne(b.ownerKind, partKind),
          b.in(b.targetKind, sectionTargets),
          b.eq(b.targetPart, b.ownerPart),
        ),
      ),
      b.not(b.and(b.eq(b.targetKind, itemRefKind), b.eq(b.targetReplaced, true))),
      b.le(b.targetInstanceStart, b.instanceStart),
      b.lt(b.instanceStart, b.targetInstanceEnd),
      b.or(
        b.and(sameInstance(b), b.eq(b.via, b.instance)),
        b.and(
          b.not(sameInstance(b)),
          b.eq(b.viaParent, b.targetInstance),
          b.le(b.viaStart, b.instanceStart),
          b.lt(b.instanceStart, b.viaEnd),
        ),
      ),
    ),
  ),
  check("Branch_forward", BranchResolution, (b) =>
    b.or(forward(b), b.and(b.ne(b.ownerKind, partKind), b.not(nested(b)), shuffled(b))),
  ),
] as const;

/**
 * The documents whose root is an item, the targets an item ref may name: a constant selection,
 * keyed by its node.
 */
const itemDocuments = select(Document, (d) => d.eq(d.rootKind, "qti-assessment-item"));

/**
 * The item refs that name an item.
 */
const itemTargets = select(ItemRefTarget, (t) => t.eq(t.type, itemResourceType));

/**
 * The statements of B2's and B3's law, "Item ref target": each item ref has one
 * {@link ItemRefTarget}, its href's path, named by a resource of the package of the item type or an
 * LTI type; and each that names an item has its {@link ItemRefDocument}, the document there, whose
 * root is an item.
 */
export const itemRefLaws = [
  mirrors(on(ItemRefTarget, "node"), on(nodesOf(itemRefKind), "id")),
  contained(on(ItemRefTarget, "node", "package", "path"), on(hrefPaths, "node", "package", "path")),
  contained(on(ItemRefTarget, "package", "path", "type"), on(NamedHref, "package", "path", "type")),
  check("Item_ref_target", ItemRefTarget, (t) =>
    t.in(t.type, [itemResourceType, ...linkResourceTypes]),
  ),
  key(on(itemTargets, "node")),
  contained(
    on(itemTargets, "node", "package", "path"),
    on(ItemRefDocument, "node", "package", "path"),
  ),
  contained(
    on(ItemRefDocument, "node", "package", "path"),
    on(itemTargets, "node", "package", "path"),
  ),
  contained(
    on(ItemRefDocument, "document", "package", "path"),
    on(Document, "node", "package", "path"),
  ),
  key(on(itemDocuments, "node")),
  contained(on(ItemRefDocument, "document"), on(itemDocuments, "node")),
] as const;

/**
 * Every statement over tests and sections, each `check` named by its law:
 *
 * - **the documents** ({@link TestDocument}): one per document of a test or a section, and its sites,
 *   names and branch rules counted;
 * - **the copies** ({@link TestToken}, {@link TestFlag}): each identifier and target copied and
 *   collapsed, each boolean copied and read (`E1_derived`);
 * - **the names** ({@link Named}): one per test part, section, section ref and item ref, with its
 *   collapsed identifier and its scope in its document, no two of one document sharing an
 *   identifier (A4, "Structure identifier");
 * - **the sections** ({@link Section}, {@link SectionMember}, {@link SectionSelection},
 *   {@link SectionOrdering}): their parts counted (C15), any number of them, none included (spec
 *   reading 26: §4.2.15's `sectionPart` is [0..unbounded]), their required parts folded
 *   ({@link requiredFold}), their flags and scope; reading 79's `Selection_bound`, `select ≤
 *   members` unless the selection is with replacement, and info §4.2.2's `Selection_required`,
 *   `required ≤ select`;
 * - **the hrefs:** each item ref and site has its href's `ReferencePath` (`#pantry/qti/package.ts`
 *   `hrefPaths`), an entry of the package, under the stated limit `Href_form`;
 * - **the sites** ({@link Site}, {@link SiteTarget}): each names a document of the package, its
 *   target, a row of its own ("Include target", reading 115), and each section ref and
 *   section-level include names a section document;
 * - **the branch rules** ({@link BranchRule}): each one that names no exit;
 * - **the mappings** ({@link VariableMapping}): no two of one item ref name one target, and none a
 *   session variable (reading 97, `Variable_mapping_target`);
 * - **the stimulus refs** ({@link StimulusRef}): no two of one item share an identifier (B16);
 * - **the assembly** ({@link Instance}): one tree per document of a test or a section, one child per
 *   site, so an inclusion cycle has no finite tree (reading 85);
 * - **the namespace** ({@link InstanceName}, {@link AssembledName}): `Test_name_key`, each written
 *   element once per test, and the key `(assembly, identifier)` (reading 86);
 * - **the jumps** ({@link BranchResolution}): `Branch_target` and `Branch_forward` (reading 87);
 * - **the items** ({@link ItemRefTarget}, {@link ItemRefDocument}): each item ref's href names an
 *   item document of the package or an LTI link (B2, B3, "Item ref target").
 */
export const testLaws = [
  ...testOverlayLaws,
  ...inclusionLaws,
  ...testNameLaws,
  ...branchLaws,
  ...itemRefLaws,
] as const;
