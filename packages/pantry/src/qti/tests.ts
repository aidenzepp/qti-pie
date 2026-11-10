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
 * reading 117), and each instance has exactly one child per site of its document that places its
 * target, the instance of the document that site names: a section ref, or an include that may stand
 * for its target's root (`IncludeRoot`, reading 114), whatever its parent ({@link sitesFold}). A
 * chain of section refs and includes that returns to a document already on it would need
 * infinitely many instances, so no finite tree holds it: the count law `children = sites` refuses
 * one a head reaches, and `TestDocument.instances` above 0 one no head reaches, whose documents no
 * assembly places (reading 85). Under a test's root, each instance carries one
 * {@link InstanceName} per name of its document, and their projection
 * {@link AssembledName} holds each written element once per test, so a section document placed
 * twice names nothing twice, and the key on `(assembly, identifier)` is reading 86's one namespace.
 * Each branch rule of each instance resolves once ({@link BranchResolution}), to its target
 * ({@link BranchTarget}), the element its identifier names in an instance that holds the rule's
 * (a rule whose target names none has no row, so the resolution's existence law refuses it):
 * of its kind in its own test part, not inside a placement it is outside of, never an item ref a
 * replacement can repeat (`Branch_target`), and after its source's end unless the section that
 * orders the two shuffles (`Branch_forward`, reading 87), its shuffle a row of its own where it
 * orders them ({@link BranchShuffle}). A section document no test places resolves nothing.
 *
 * Beside them: an item ref's variable mappings ({@link VariableMapping}, reading 97) and an item's
 * stimulus refs ({@link StimulusRef}), each keyed by its node with its law a key, and the item each
 * item ref names ({@link ItemRefHref} and {@link ItemRefDocument}, with the query `ItemRefTarget`
 * of `#pantry/qti/queries.ts`, B2 and B3).
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
  DocumentType,
  Flag,
  Governor,
  IncludeMember,
  IncludeParent,
  IncludeParentKind,
  includeParentKinds,
  IncludeSetOf,
  NodeKind,
  SchemaVersion,
} from "#pantry/grammar/install.ts";
import { Attribute, namingPattern, Space } from "#pantry/qti/attributes.ts";
import { Document, EntryPath } from "#pantry/qti/chardata.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeContext, nodeRef } from "#pantry/qti/node.ts";
import { Entry, hrefPaths, Reference } from "#pantry/qti/package.ts";
import {
  testKind,
  itemKind,
  sectionKind,
  partKind,
  itemRefKind,
  sectionRefKind,
  includeKind,
  selectionKind,
  orderingKind,
  branchRuleKind,
  mappingKind,
  stimulusRefKind,
  assembledRoots,
  splicingParents,
  namedKinds,
  sectionParts,
  exits,
  flagCarriers,
} from "#pantry/vocab/terms/tests.ts";
import type { FlagName } from "#pantry/vocab/terms/tests.ts";

/**
 * `xs:boolean`'s true forms (`booleanTruePattern` of `#pantry/grammar/domains.ts`), as the pattern
 * `Compute.matches` reads, made once.
 */
const booleanTrueForm = Compute.pattern(booleanTruePattern);

/**
 * The item built-ins a variable mapping's target may not name (information model §2.2.2, §4.5.1:
 * "The identifiers of the built-in session variables are reserved").
 */
export const sessionVariables = ["completionStatus", "numAttempts", "duration"] as const;

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
 * The attribute names this module copies as collapsed text into {@link TestToken}.
 */
export const tokenNames = [
  "identifier",
  "target",
  "source-identifier",
  "target-identifier",
] as const satisfies readonly Name[];

/**
 * The nil uuid: the start of an accumulated uuid copy, which every member's owner replaces, and the
 * document the host writes for what no item holds, an LTI link's item.
 */
export const nilUuid = "00000000-0000-0000-0000-000000000000";

/**
 * A selection's `select` once its whitespace is split off: an integer's lexical form, which
 * `Compute.cast` reads total (G-parse); AL1 has proved the whole an `xs:int`.
 */
export const SelectForm = lexical(pg.bigint);

/**
 * A collapsed value: no whitespace at either end, and something between. An NCName holds no
 * whitespace at all, so an identifier's collapsed form is this.
 */
export const collapsedPattern = Compute.pattern(
  "^(?:[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]|[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}][\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}]*[\\u{21}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}])$",
);

/**
 * A document of a test or a section, keyed by its document node: its entry, its root kind, and
 * the counts of its three families. Its hrefs resolve against its path or the `xml:base` in
 * scope (`#pantry/qti/package.ts` `ReferencePath`).
 *
 * - **the host's:** `node`, `package`, `path` and `rootKind` (its `Document` row's);
 * - **drawn:** `targets`, `names` and `rules`, the counts of {@link siteFamily}, {@link nameFamily}
 *   and {@link ruleFamily}; and `instances`, its placements in every assembly, the count of
 *   {@link documentInstanceFamily}, which "Inclusion cycle" holds above 0;
 * - **accumulated:** `sites`, the count of its sites that place their target ({@link sitesFold}), the
 *   children each of its instances holds.
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
    sites: accumulated(natural, 0n),
    targets: drawn(natural),
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
 * A test part, section, section ref or item ref whose identifier names something, keyed by its
 * node: the elements whose identifiers are one namespace across the assembled test (reading 86),
 * and among which branch rules jump. One that writes none names nothing and has no row: AL3 refuses
 * it alone (reading 147). One whose identifier is no NCName once collapsed ({@link namingPattern})
 * names nothing either and has no row: its value domain refuses it alone (spec reading 152,
 * decision 457 (2)).
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
 * - **the host's:** its {@link nodeRef} tuple; `parentKind`; `keepTogether`, its `keep-together`
 *   (true where it writes none); `loose`, whether it is invisible and not kept together, so its
 *   children are mixed into its parent's order (information model §5.98), invisible where its
 *   `visible` flag, a row of its own, reads false: one that writes no `visible` is neither visible
 *   nor invisible and has no flag, so it is never loose, and AL3 alone refuses it (reading 173);
 *   `shuffle`, its ordering's `shuffle`, and `withReplacement`, its selection's `with-replacement`,
 *   each false without the child or the attribute; and its scope: `part`; `replaced` and
 *   `replacing`, whether a section above it, or it or one above it, selects with replacement;
 *   `parentMixes` and `mixes`, whether its parent's and its own children's order is drawn at
 *   delivery (a shuffle, or a loose section whose parent's order is drawn); and `parentLooseChain`
 *   and `looseChain`, as {@link Named} reads them, true above a document's root;
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
    loose: pg.boolean,
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
 * - **the host's:** its node's context, the {@link nodeContext} tuple (`node`, `children`, `start`,
 *   `document`, `ancestry`, `documentType`, `governor`, `kind`, `nearest`, `nearestKind`,
 *   `parentKind`, `version`), which also holds its {@link nodeRef} fields but `parent`; `parent`;
 *   `external`, whether its href resolves outside the package, which its href's `Reference` row
 *   proves (an include's then is stored as written and never fetched, and a section ref's is
 *   refused under the stated limit "Remote section ref", reading 170); and the scope it is placed
 *   in, its parent's: `part`, `replaced` (its parent section's `replacing`), `parentMixes` and
 *   `parentLooseChain`.
 *
 * Its `part` is the test part it sits in: its parent section's under a section, its parent under a
 * test part, and its own document under any other parent (an item's body or processing, a
 * fragment's content, a test's feedback), where its placement takes its placing instance's part
 * ({@link placedScope}). Only a section's scope is replaced, mixed or loose, so a site under any
 * other parent is none of them.
 *
 * Its href's path is its {@link SitePath}, a row of its own, since an include may write no href;
 * and the document that path names is its {@link SiteTarget}, a row of its own, since a path may
 * name none (spec reading 115).
 */
export const Site = relation(
  "Site",
  {
    ancestry: bits(Flag),
    children: natural,
    document: uuid,
    documentType: closedId(DocumentType),
    external: pg.boolean,
    governor: closedId(Governor),
    kind: closedId(NodeKind),
    nearest: uuid,
    nearestKind: closedId(NodeKind),
    node: uuid,
    parent: uuid,
    parentKind: closedId(NodeKind),
    parentLooseChain: pg.boolean,
    parentMixes: pg.boolean,
    part: uuid,
    replaced: pg.boolean,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A site's href, keyed by the site's node: its `package` and `path`, the entry path its
 * `ReferencePath` resolves it to (`#pantry/qti/package.ts` `hrefPaths`), the site's `kind`, and
 * `entry`, whether the package holds an entry at that path. A row only where the site writes an
 * href that resolves to a path of the package.
 *
 * - An include may write none (XInclude 1.0 §3.1, the href "absent when parse="xml""), or one that
 *   names its own document, and names no document of the package then, so it has no row and
 *   "Include target" refuses it alone (spec reading 115); one whose href resolves outside the
 *   package has no row either, and its site is marked `external`, stored as written and never
 *   fetched; a section ref must write one, and AL3 refuses one that does not. A section ref whose
 *   href resolves outside the package has no row and is marked `external` as well, and the stated
 *   limit "Remote section ref" refuses it alone: pantry imports offline and never fetches the
 *   section it names, which is the test's own content (reading 170).
 * - A path no entry holds is `entry` false, which `File_exists` refuses as the row is inserted,
 *   before any deferred key: an href naming an absent file is refused under "File exists" alone,
 *   whatever its site is, and the site's document laws read only paths an entry holds.
 */
export const SitePath = relation(
  "SitePath",
  { entry: pg.boolean, kind: closedId(NodeKind), node: uuid, package: uuid, path: keyText },
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
 * - **the site's copies:** its `document`; its {@link SitePath}'s `package` and `path`; its `kind`,
 *   `parentKind` and `version`; its own context's nearest interaction (`nearest`, `nearestKind`);
 *   and its `ancestry`, its part of the target's context (`Document.context`, the union over the
 *   sites that name a document, spec reading 117);
 * - **its include's:** `splices`, whether it splices its target in place, its {@link Inclusion}'s;
 *   false for a section ref, which places its target whole; and `places`, whether it places its
 *   target at all, its {@link Inclusion}'s; true for a section ref.
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
    places: pg.boolean,
    splices: pg.boolean,
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
 * `IncludeParent` handle that kind is, its target's root kind, the kind the include stands for
 * (spec reading 114), and `splices`, whether it splices that document in place: its parent is one
 * of {@link splicingParents} and it may stand for the root (`IncludeRoot`), as the law oracle's
 * `standsFor` judges. An include that may not stand for its target's root, which "Include root"
 * refuses, splices nothing, so its target is judged as no fragment of its document's; and `places`,
 * whether it places that document at all: it may stand for the root, whatever its parent, so an
 * include under a section places its target whole without splicing it, and one "Include root"
 * refuses places nothing. An optional value is a row of its own: a section ref has none.
 */
export const Inclusion = relation(
  "Inclusion",
  {
    includeParent: closedId(IncludeParent),
    node: uuid,
    parentKind: closedId(NodeKind),
    places: pg.boolean,
    root: closedId(NodeKind),
    splices: pg.boolean,
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
 * One branch rule of one instance of a test's assembly, keyed by the instance and the rule
 * (reading 87): what the rule is wherever it is placed, whether or not its target names anything.
 *
 * - **the host's:** `instance` and `rule`; the rule's `target`, the identifier it names, `owner` (its
 *   source) and `ownerKind`; and the owner's place in the instance, `ownerStart`, `ownerEnd` and
 *   `ownerPart`;
 * - **accumulated** along {@link resolutionFamily}'s owner axis: `assembly`, `document` and
 *   `instanceStart`, the instance's.
 *
 * Its target is a row of its own, {@link BranchTarget}, which a rule whose target names nothing
 * lacks: the existence law `BranchResolution(instance, rule, target) ⊆ BranchTarget(instance,
 * rule, target)` is "Branch target", and holds the target's `target` to the rule's.
 *
 * The instance's `end` is not copied, because the law needs only the start: a pre-order interval
 * `[start, end)` holds an instance exactly when it holds the instance's `start`, so
 * `Branch_target` places the rule's instance inside the target's instance and inside `via` by
 * `instanceStart` alone.
 */
export const BranchResolution = relation(
  "BranchResolution",
  {
    assembly: accumulated(uuid, nilUuid),
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
  },
  ["instance", "rule"],
);

/**
 * The target a branch rule of one instance names, keyed by the instance and the rule (reading
 * 87): the written element its identifier names in an instance that holds the rule's, the first
 * in pre-order where several do. A rule whose target names no such element has no row.
 *
 * - **the resolution's copy** (back into {@link BranchResolution}): `assembly`, `instanceStart` and
 *   the owner's `ownerKind`, `ownerStart`, `ownerEnd` and `ownerPart`, the fields the laws read;
 *   and `target`, which the resolution's existence law holds to its own, so the text rides a key
 *   beside two uuids alone and keeps the one bound `keyText` states (`#pantry/qti/limits.ts`);
 * - **the target's:** `targetInstance` and `targetNode`, with that name's `targetKind`, `targetPart`,
 *   `targetReplaced`, `targetMixes`, `targetStart` and `targetEnd`, and its instance's
 *   `targetInstanceStart` and `targetInstanceEnd`; and `via`, the child of the target's instance on
 *   the way down to the rule's (the rule's own instance where they are one), with its `viaParent`,
 *   `viaStart`, `viaEnd` and `viaSiteStart`;
 * - **drawn:** `shuffles`, its {@link BranchShuffle} rows, 1 where the section that orders the source
 *   and the target shuffles them and 0 where none does.
 */
export const BranchTarget = relation(
  "BranchTarget",
  {
    assembly: uuid,
    instance: uuid,
    instanceStart: natural,
    ownerEnd: natural,
    ownerKind: closedId(NodeKind),
    ownerPart: uuid,
    ownerStart: natural,
    rule: uuid,
    shuffles: drawn(natural),
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
 * The shuffle that orders a branch rule's source and target, keyed by the instance and the rule
 * (reading 87, information model §5.98): `common`, the nearest element of the target's document
 * holding the source's point and the target, whose children's order is drawn at delivery, and
 * `branch`, its child that holds the target and not the source, each with the fields the law
 * reads, beside its {@link BranchTarget}'s copy (`assembly`, `targetInstance`, `ownerStart`,
 * `targetStart`, `viaSiteStart`). A rule whose source and target no shuffle orders has no row.
 */
export const BranchShuffle = relation(
  "BranchShuffle",
  {
    assembly: uuid,
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
    instance: uuid,
    ownerStart: natural,
    rule: uuid,
    targetInstance: uuid,
    targetStart: natural,
    viaSiteStart: natural,
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
 * An item's stimulus ref that writes an identifier, keyed by its node (information model §7.6):
 * its {@link nodeRef} tuple and its collapsed `identifier`. One that writes none has no row: AL3
 * refuses it alone (reading 147).
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
 * The href of an item ref that writes one, keyed by the item ref's node: its href's `package` and
 * `path` (its `ReferencePath`, `#pantry/qti/package.ts` `hrefPaths`). What it names is the query
 * `ItemRefTarget` (`#pantry/qti/queries.ts`): the type of a resource of the package whose href's
 * path that is, of the item type or else an LTI type, which "Item ref target" judges. An item ref
 * with no target (`UntargetedItemRef` there) must name a path a resource of an unread type names
 * (`UnreadTypeHref`, spec reading 67): the type of what it names is unread, so the law oracle names
 * it no target to judge (its `itemRefTargetOf`). An unread type is itself a refusal, AL1's value
 * domain, so this narrows the law set, never a verdict. An item ref that writes no href has none,
 * which AL3 alone refuses (spec reading 155).
 */
export const ItemRefHref = relation("ItemRefHref", { node: uuid, package: uuid, path: keyText }, [
  "node",
]);

/**
 * The item document an item ref names, keyed by the item ref's node: a row only where the package
 * holds a document at the path of an item ref's target of the item type (`ItemRefTarget`,
 * `#pantry/qti/queries.ts`), and none for an LTI link's, so an item resource whose file the package
 * lacks has none, which "Item ref target" refuses. Every law that reads what an item ref's item
 * declares reads it here.
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
  BranchShuffle,
  BranchTarget,
  Inclusion,
  Instance,
  InstanceName,
  ItemRefDocument,
  ItemRefHref,
  Named,
  Section,
  SectionMember,
  SectionOrdering,
  SectionSelection,
  Site,
  SitePath,
  SiteTarget,
  StimulusRef,
  TestDocument,
  TestFlag,
  TestToken,
  VariableMapping,
};

/**
 * Each document's sites that name a document, counted by `TestDocument.targets`. A site that names
 * none places nothing, and "Include target" alone refuses it (reading 115).
 */
export const siteFamily = counted(on(SiteTarget, "document"), fin(TestDocument, "targets"));

/**
 * The sites that place their target (`SiteTarget.places`): each section ref, and each include that
 * may stand for its target's root (`IncludeRoot`, reading 114), whatever its parent.
 */
const placingSites = select(SiteTarget, (s) => s.eq(s.places, true));

/**
 * Each document's sites that place their target, counted into `TestDocument.sites`: the children
 * each of its instances holds (reading 85), one per site that places its target. An include that
 * may not stand for its target's root names it (`Document.targetedBy`, reading 117's context) but
 * places nothing, and "Include root" alone refuses it. A family's member is a whole relation, which
 * no selection narrows, so the count is a fold over {@link siteFamily}.
 */
export const sitesFold = fold(
  siteFamily,
  Monoid.count,
  on(placingSites, "document"),
  on(TestDocument, "node", "sites"),
);

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
 * Each target's shuffle, counted by `BranchTarget.shuffles`: one where a shuffle orders its rule's
 * source and target, none where none does.
 */
export const shuffleFamily = counted(
  on(BranchShuffle, "instance", "rule"),
  fin(BranchTarget, "shuffles"),
);

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
 * The instances of an item's assembly, each of which places its document's bindings (Q5.09's
 * `PlacedBinding`, spec reading 117).
 */
export const itemInstances = select(Instance, (i) => i.eq(i.assemblyKind, itemKind));

/**
 * The hrefs of the sites that are section refs whose path an entry holds, each naming a section
 * document (information model §7.5).
 */
const sectionRefPaths = select(SitePath, (s) =>
  s.and(s.eq(s.kind, sectionRefKind), s.eq(s.entry, true)),
);

/**
 * The hrefs of the sites that are includes whose path an entry holds, each naming a document of
 * the package (spec reading 115).
 */
const includePaths = select(SitePath, (s) => s.and(s.eq(s.kind, includeKind), s.eq(s.entry, true)));

/**
 * The hrefs whose path an entry holds.
 */
const entryPaths = select(SitePath, (s) => s.eq(s.entry, true));

/**
 * The targets of the sites that are section refs, each a section document (information model §7.5).
 */
const sectionRefTargets = select(SiteTarget, (s) => s.eq(s.kind, sectionRefKind));

/**
 * The sites that are includes whose href stays in the package, each with an href that names a path
 * of the package (spec reading 115). An include whose href resolves outside it is stored as written
 * and never fetched, so it names none.
 */
const includeSites = select(Site, (s) => s.and(s.eq(s.kind, includeKind), s.eq(s.external, false)));

/**
 * The sites marked external, each proven by its href's {@link externalHrefs} row.
 */
const externalSites = select(Site, (s) => s.eq(s.external, true));

/**
 * The `href` references that resolve outside the package, one per element, a constant selection
 * keyed by its node: the side a site's external mark is proven by (readings 35 and 102).
 */
const externalHrefs = select(Reference, (r) =>
  r.and(r.eq(r.name, "href"), r.eq(r.scope, "external")),
);

/**
 * The `href` references of the section refs that write an href that stays in the package, one per
 * element, keyed by its node: each such ref has its {@link SitePath}, or breaks "Document entry"
 * (information model §7.5). A section ref that writes no href has no `Reference` row, so AL3 alone
 * refuses it (reading 115, one cause per fault); one whose href resolves outside the package is
 * "Remote section ref"'s alone (reading 170).
 */
const sectionRefHrefs = select(Reference, (r) =>
  r.and(r.eq(r.name, "href"), r.eq(r.kind, sectionRefKind), r.ne(r.scope, "external")),
);

/**
 * The targets of the sites that are includes, each with its {@link Inclusion}.
 */
const includeTargets = select(SiteTarget, (s) => s.eq(s.kind, includeKind));

/**
 * An `Inclusion` row as a row check reads it.
 */
type InclusionRow = RowScalars<typeof Inclusion>;

/**
 * State that an include may stand for its target's root (spec reading 114): the root is among the
 * kinds its parent's family's include set holds, `{root} ⊆ IncludeMember.row(IncludeSetOf.at("set",
 * version, parent))`, and a family of no set holds none.
 *
 * @param i - The include's row.
 * @returns The predicate.
 */
const standsFor = (i: InclusionRow) =>
  i.and(
    IncludeSetOf.has(i.version, i.includeParent),
    i.eq(
      Compute.subset(
        Compute.singleton(i.root),
        IncludeMember.row(IncludeSetOf.at("set", i.version, i.includeParent)),
      ),
      true,
    ),
  );

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
 * The `identifier` of each test part, section, section ref and item ref ({@link namedKinds}) that
 * names something once collapsed ({@link namingPattern}): each such structure, and only it, has its
 * {@link Named} row. These identifiers are `xs:NCName`s, so any other names nothing, and its value
 * domain refuses it alone (spec reading 152, decision 457 (2)).
 */
const namingIdentifiers = select(Attribute, (a) =>
  a.and(
    a.eq(a.name, "identifier"),
    a.in(a.kind, namedKinds),
    Compute.matches(a.lexical, namingPattern),
  ),
);

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

  return {
    copies: [
      contained(on(source, "node", "name", "lexical"), on(TestToken, "node", "name", "lexical")),
      contained(on(tokensOf(name), "node"), on(source, "node")),
    ] as const,
    key: key(on(source, "node")),
  };
};

/**
 * The copy of one attribute into {@link TestFlag}, as {@link tokenCopy} copies a token.
 *
 * @param carrier - The attribute's name and the kinds that carry it.
 * @returns Its key, the "DocumentId key" law's, and its two copies, the "Test overlay" law's.
 */
const flagCopy = ([name, kinds]: (typeof flagCarriers)[number]) => {
  const source = attributesOf(name, kinds);

  return {
    copies: [
      contained(on(source, "node", "name", "lexical"), on(TestFlag, "node", "name", "lexical")),
      contained(on(flagsOf(name), "node"), on(source, "node")),
    ] as const,
    key: key(on(source, "node")),
  };
};

/**
 * The sections written invisible: a `visible` that reads false. A section's visibility "is
 * determined solely by the value of its own visible attribute" (information model §4.2.6), so one
 * that writes none is in neither this nor its complement (reading 173).
 */
const invisibleFlags = select(TestFlag, (f) =>
  f.and(f.eq(f.name, "visible"), f.eq(f.value, false)),
);

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
 * The roots of the assemblies, one per document that heads one (the query `HeadDocument`,
 * `#pantry/qti/queries.ts`, whose rules hold the two to each other).
 */
export const instanceRoots = select(Instance, (i) => i.eq(i.start, 0n));

/**
 * The instances of a test's assembly, whose names and branch rules resolve.
 */
const testInstances = select(Instance, (i) => i.eq(i.assemblyKind, testKind));

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
 * A `BranchTarget` row as a row check reads it.
 */
type TargetRow = RowScalars<typeof BranchTarget>;

/**
 * A `BranchShuffle` row as a row check reads it.
 */
type ShuffleRow = RowScalars<typeof BranchShuffle>;

/**
 * State that a target lies in its rule's own instance.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const sameInstance = (b: TargetRow | ShuffleRow) => b.eq(b.targetInstance, b.instance);

/**
 * State that a target is of a kind its source may name, in the source's test part, and no item
 * ref a replacement can repeat (reading 87): `Branch_target`'s judgment of the name, apart from
 * where it is placed.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const targetAdmitted = (b: TargetRow) =>
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
  );

/**
 * State that a target lies after its source's end (reading 87): in its own instance, at or after
 * the owner's end; in an instance above, after the site its own instance descends through.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const forward = (b: TargetRow) =>
  b.or(
    b.and(sameInstance(b), b.ge(b.targetStart, b.ownerEnd)),
    b.and(b.not(sameInstance(b)), b.gt(b.targetStart, b.viaSiteStart)),
  );

/**
 * State that a target holds its source's point: the owner's start in its own instance, the site's
 * in an instance above.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const targetHoldsSource = (b: TargetRow) =>
  b.or(
    b.and(sameInstance(b), b.le(b.targetStart, b.ownerStart), b.lt(b.ownerStart, b.targetEnd)),
    b.and(
      b.not(sameInstance(b)),
      b.le(b.targetStart, b.viaSiteStart),
      b.lt(b.viaSiteStart, b.targetEnd),
    ),
  );

/**
 * State that a shuffle's `common` holds its source's point, as {@link targetHoldsSource} reads the
 * point.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const commonHoldsSource = (b: ShuffleRow) =>
  b.or(
    b.and(sameInstance(b), b.le(b.commonStart, b.ownerStart), b.lt(b.ownerStart, b.commonEnd)),
    b.and(
      b.not(sameInstance(b)),
      b.le(b.commonStart, b.viaSiteStart),
      b.lt(b.viaSiteStart, b.commonEnd),
    ),
  );

/**
 * State that a shuffle's `branch` holds its source's point, as {@link targetHoldsSource} reads the
 * point.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const branchHoldsSource = (b: ShuffleRow) =>
  b.or(
    b.and(sameInstance(b), b.le(b.branchStart, b.ownerStart), b.lt(b.ownerStart, b.branchEnd)),
    b.and(
      b.not(sameInstance(b)),
      b.le(b.branchStart, b.viaSiteStart),
      b.lt(b.viaSiteStart, b.branchEnd),
    ),
  );

/**
 * State that a target and its source nest: the target holds the source's point, or, in one
 * instance, the owner holds the target. No shuffle reorders such a pair.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const nested = (b: TargetRow) =>
  b.or(
    targetHoldsSource(b),
    b.and(sameInstance(b), b.le(b.ownerStart, b.targetStart), b.lt(b.targetStart, b.ownerEnd)),
  );

/**
 * State that a shuffle orders its rule's source and target: `common` holds the source's point, its
 * child `branch` holds the target and not the source's point, and its children's order is drawn
 * at delivery.
 *
 * @param b - The row.
 * @returns The predicate.
 */
const shuffled = (b: ShuffleRow) =>
  b.and(
    commonHoldsSource(b),
    b.eq(b.branchParent, b.common),
    b.le(b.branchStart, b.targetStart),
    b.lt(b.targetStart, b.branchEnd),
    b.not(branchHoldsSource(b)),
    b.eq(b.commonMixes, true),
  );

/**
 * The documents whose root is an item, the documents an item ref's item may be: the documents whose
 * `rootKind`, a field beyond the target's terms, is fixed to an item, so `Document`'s key holds it
 * (grizzle's fixed target, at `3cc8fbd`) and it needs no key of its own.
 */
const itemDocuments = select(Document, (d) => d.eq(d.rootKind, itemKind));

/**
 * The token attributes {@link TestToken} copies, each attribute's key and its two copies.
 */
const tokenCopies = [
  tokenCopy("identifier", [...namedKinds, stimulusRefKind]),
  tokenCopy("source-identifier", [mappingKind]),
  tokenCopy("target-identifier", [mappingKind]),
  tokenCopy("target", [branchRuleKind]),
];

/**
 * The flag attributes {@link TestFlag} copies, each as {@link tokenCopies} holds a token.
 */
const flagCopies = flagCarriers.map(flagCopy);

/**
 * Every statement over tests and sections, each `check` named by its law:
 *
 * - **the documents** ({@link TestDocument}): one per document of a test or a section, and its sites,
 *   names and branch rules counted;
 * - **the copies** ({@link TestToken}, {@link TestFlag}): each identifier and target copied and
 *   collapsed, each boolean copied and read (`E1_derived`);
 * - **the names** ({@link Named}): one per test part, section, section ref and item ref that writes
 *   an identifier (reading 147), with its collapsed identifier and its scope in its document, no
 *   two of one document sharing an identifier (A4, "Structure identifier");
 * - **the sections** ({@link Section}, {@link SectionMember}, {@link SectionSelection},
 *   {@link SectionOrdering}): their parts counted (C15), any number of them, none included (spec
 *   reading 26: §4.2.15's `sectionPart` is [0..unbounded]), their required parts folded
 *   ({@link requiredFold}), their flags and scope; reading 79's `Selection_bound`, `select ≤
 *   members` unless the selection is with replacement, and info §4.2.2's `Selection_required`,
 *   `required ≤ select`;
 * - **the hrefs:** each site that writes one ({@link SitePath}, a row of its own, which "Document
 *   entry" demands of a section ref only where it writes an href that stays in the package) has its
 *   href's `ReferencePath` (`#pantry/qti/package.ts` `hrefPaths`), an entry of the package, under
 *   the stated limit `Href_form`, but a site whose href resolves outside the package, marked
 *   `external` as its href's `Reference` proves; an item ref's is its target's (below);
 * - **the sites** ({@link Site}, {@link SiteTarget}): each names a document of the package, its
 *   target, a row of its own ("Include target", reading 115), but an external include, stored as
 *   written and never fetched; each section ref and section-level include names a section document;
 *   and no section ref is external (`Remote_section_ref`, reading 170: a stated limit of pantry,
 *   which imports offline and cannot assemble a section it does not hold, not a law of QTI);
 * - **the branch rules** ({@link BranchRule}): each one that names no exit;
 * - **the mappings** ({@link VariableMapping}): no two of one item ref name one target, and none a
 *   session variable (reading 97, `Variable_mapping_target`);
 * - **the stimulus refs** ({@link StimulusRef}): one per stimulus ref that writes an identifier
 *   (reading 147), no two of one item sharing an identifier (B16);
 * - **the assembly** ({@link Instance}): one tree per document of a test or a section, one child per
 *   site that places its target, so an inclusion cycle has no finite tree (reading 85);
 * - **the namespace** ({@link InstanceName}, {@link AssembledName}): `Test_name_key`, each written
 *   element once per test, and the key `(assembly, identifier)` (reading 86);
 * - **the jumps** ({@link BranchResolution}, {@link BranchTarget}, {@link BranchShuffle}): each
 *   resolution's target, `Branch_target` and `Branch_forward` (reading 87);
 * - **the items** ({@link ItemRefHref}, {@link ItemRefDocument}): each item ref's href resolved, and
 *   the item document it names (B2, B3, "Item ref target"); what it names, an item document of the
 *   package or an LTI link unless only a resource of an unread type names it, is a rule over the
 *   query `ItemRefTarget`, stated under the same name in `#pantry/qti/queries.ts`.
 *
 * The statements by the laws they state:
 *
 * The statements over the documents' rows, law "Test overlay" but the named checks: the document,
 * its tokens and flags, its names, sections, parts, selections, orderings, sites and branch rules,
 * and each item ref's href resolved, each its element's row, copying its node's tuple and its
 * attributes' values, and each there exactly where its element is.
 *
 * The statements of reading 85's law, "Inclusion cycle": the instance tree, each instance's copy of
 * its parent's scope and of its site, one child per site that places its target
 * ({@link sitesFold}), one root per head and none for any other document, and two counts that make
 * a chain returning to a document on it unrepresentable.
 *
 * - **A chain a head reaches:** the deferred foreign key `Instance(document, rootKind, children) →
 *   TestDocument(node, rootKind, sites)`, since no finite tree has one child per site that places
 *   its target under it.
 * - **A chain no head reaches**, such as two fragments each of which includes the other, which no
 *   head places, and any fragment only they place: `TestDocument.instances` above 0, since none of
 *   them is placed in any assembly. Its converse, every `Instance` row's document an assembled
 *   one's, is the foreign key above; the containment the other way, `TestDocument(node, rootKind,
 *   sites) ⊆ Instance(document, rootKind, children)`, has no key of `Instance` in its target's
 *   projection, which grizzle refuses, so the count states it.
 *
 * The heads are {@link splicingParents}'s, through `Inclusion.splices`: the query `HeadDocument`
 * (`#pantry/qti/queries.ts`), each assembled document no include splices in place, mirrored with
 * the roots both ways by its rules there. Its `E1_derived` pins the root's fields and derives a
 * member's scope.
 *
 * The statements of reading 86's law, "Test name key": each instance of a test's assembly holds
 * one name per name of its document, their projection holds each written element once, so a
 * section document placed twice names nothing twice, and no two written elements of one test share
 * an identifier. Its `E1_derived` derives each name's scope in the assembly.
 *
 * The statements of reading 87's law, "Branch target": each instance of a test's assembly
 * resolves each of its document's branch rules that names a target once, each resolution copying
 * its rule and its source, and each has its target, the element its identifier names in an
 * instance that holds the rule's, which a rule whose target names nothing lacks. The target
 * copies the names the ordering law reads. `Branch_target` judges its kind, part and replacement
 * and that its instance holds the rule's.
 *
 * The statements of reading 87's law, "Branch forward": `Branch_forward` on a target, that a
 * target `Branch_target` admits by its name lies after its source's end, unless a shuffle orders
 * the two, so each bad target breaks one law; and the shuffle that orders a rule's source and
 * target (information model §5.98), each counted by its target, each copying its target's names
 * and the two elements it reads, its own `Branch_forward` that it orders the two.
 *
 * The statements of B2's and B3's law, "Item ref target": each item ref that writes an href has
 * one {@link ItemRefHref}, its href's path, and no other element has one; and each
 * {@link ItemRefDocument} is the document at its path, whose root is an item. Its target, named by
 * a resource of the package of the item type or an LTI type, is the query `ItemRefTarget`, whose
 * rules (`#pantry/qti/queries.ts`) hold an item ref with none to a path a resource of an unread
 * type names, and an item ref names an item exactly where it has its {@link ItemRefDocument}. An
 * item ref that writes no href names nothing, and AL3 alone refuses it (spec reading 155), named
 * or not (reading 147).
 */
export const testLawsByName = {
  "Branch forward": [
    check("Branch_forward", BranchTarget, (b) =>
      b.or(
        b.not(targetAdmitted(b)),
        forward(b),
        b.and(b.ne(b.ownerKind, partKind), b.not(nested(b)), b.eq(b.shuffles, 1n)),
      ),
    ),
    shuffleFamily,
    contained(
      on(
        BranchShuffle,
        "instance",
        "rule",
        "assembly",
        "ownerStart",
        "targetInstance",
        "targetStart",
        "viaSiteStart",
      ),
      on(
        BranchTarget,
        "instance",
        "rule",
        "assembly",
        "ownerStart",
        "targetInstance",
        "targetStart",
        "viaSiteStart",
      ),
    ),
    contained(
      on(BranchShuffle, "targetInstance", "branch", "branchEnd", "branchPart", "branchStart"),
      on(InstanceName, "instance", "node", "end", "part", "start"),
    ),
    contained(on(BranchShuffle, "branch", "branchParent"), on(Named, "node", "parent")),
    contained(
      on(
        BranchShuffle,
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
    check("Branch_forward", BranchShuffle, shuffled),
  ],
  "Branch target": [
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
      on(BranchResolution, "instance", "rule", "target"),
      on(BranchTarget, "instance", "rule", "target"),
    ),
    contained(
      on(
        BranchTarget,
        "instance",
        "rule",
        "assembly",
        "instanceStart",
        "ownerEnd",
        "ownerKind",
        "ownerPart",
        "ownerStart",
      ),
      on(
        BranchResolution,
        "instance",
        "rule",
        "assembly",
        "instanceStart",
        "ownerEnd",
        "ownerKind",
        "ownerPart",
        "ownerStart",
      ),
    ),
    contained(
      on(BranchTarget, "targetInstance", "targetNode", "target"),
      on(InstanceName, "instance", "node", "identifier"),
    ),
    contained(
      on(
        BranchTarget,
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
      on(BranchTarget, "targetInstance", "targetInstanceEnd", "targetInstanceStart"),
      on(Instance, "id", "end", "start"),
    ),
    contained(
      on(BranchTarget, "via", "viaEnd", "viaParent", "viaSiteStart", "viaStart"),
      on(Instance, "id", "end", "parent", "siteStart", "start"),
    ),
    check("Branch_target", BranchTarget, (b) =>
      b.and(
        targetAdmitted(b),
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
  ],
  "Document entry": [
    contained(on(sectionRefHrefs, "node"), on(SitePath, "node")),
    key(on(sectionDocuments, "package", "path")),
    contained(
      on(sectionRefTargets, "package", "path", "target"),
      on(sectionDocuments, "package", "path", "node"),
    ),
    contained(on(sectionRefPaths, "package", "path"), on(sectionDocuments, "package", "path")),
  ],
  "DocumentId key": [
    ...tokenCopies.map((copy) => copy.key),
    ...flagCopies.map((copy) => copy.key),
    key(on(attributesOf("select", [selectionKind]), "node")),
  ],
  "E1 derived": [
    check("E1_derived", TestToken, (t) =>
      t.and(
        t.eq(t.lexical, Compute.concat(Compute.concat(t.lead, t.value), t.trail)),
        Compute.matches(t.value, collapsedPattern),
      ),
    ),
    check("E1_derived", TestFlag, (f) =>
      f.or(
        f.and(f.eq(f.value, true), Compute.matches(f.lexical, booleanTrueForm)),
        f.and(f.eq(f.value, false), f.not(Compute.matches(f.lexical, booleanTrueForm))),
      ),
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
          s.and(
            s.eq(s.replacing, true),
            s.or(s.eq(s.replaced, true), s.eq(s.withReplacement, true)),
          ),
          s.and(s.eq(s.replacing, false), s.eq(s.replaced, false), s.eq(s.withReplacement, false)),
        ),
        s.or(s.eq(s.loose, false), s.eq(s.keepTogether, false)),
        s.or(
          s.and(
            s.eq(s.mixes, true),
            s.or(s.eq(s.shuffle, true), s.and(s.eq(s.loose, true), s.eq(s.parentMixes, true))),
          ),
          s.and(
            s.eq(s.mixes, false),
            s.eq(s.shuffle, false),
            s.or(s.eq(s.loose, false), s.eq(s.parentMixes, false)),
          ),
        ),
        s.or(
          s.and(s.eq(s.looseChain, true), s.eq(s.loose, true), s.eq(s.parentLooseChain, true)),
          s.and(
            s.eq(s.looseChain, false),
            s.or(s.eq(s.loose, false), s.eq(s.parentLooseChain, false)),
          ),
        ),
      ),
    ),
    check("E1_derived", SectionMember, (m) => m.in(m.kind, sectionParts)),
    check("E1_derived", SectionSelection, (s) =>
      s.eq(
        s.selectLexical,
        Compute.concat(Compute.concat(s.selectLead, s.selectForm), s.selectTrail),
      ),
    ),
    siteTargetFamily,
    contextFold,
    check("E1_derived", Inclusion, (i) =>
      i.and(
        i.eq(IncludeParentKind.at("kind", i.includeParent), i.parentKind),
        i.or(
          i.and(i.eq(i.splices, true), i.in(i.parentKind, splicingParents), standsFor(i)),
          i.and(
            i.eq(i.splices, false),
            i.or(i.not(i.in(i.parentKind, splicingParents)), i.not(standsFor(i))),
          ),
        ),
        i.or(
          i.and(i.eq(i.places, true), standsFor(i)),
          i.and(i.eq(i.places, false), i.not(standsFor(i))),
        ),
      ),
    ),
    check("E1_derived", SiteTarget, (s) =>
      s.or(s.eq(s.kind, includeKind), s.and(s.eq(s.splices, false), s.eq(s.places, true))),
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
    check("E1_derived", BranchRule, (b) =>
      b.and(
        b.eq(b.kind, branchRuleKind),
        b.not(b.in(b.target, exits)),
        b.in(b.parentKind, [itemRefKind, sectionKind, partKind]),
      ),
    ),
    contained(on(TestDocument, "node"), on(assembledDocuments, "node")),
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
  ],
  "File exists": [
    check("File_exists", SitePath, (s) => s.eq(s.entry, true)),
    contained(on(entryPaths, "package", "path"), on(Entry, "package", "path")),
  ],
  "Fragment context": [
    check("Fragment_context", SiteTarget, (s) =>
      s.or(
        s.and(s.eq(s.nearestKind, "document"), s.eq(s.targetNearestKind, "document")),
        s.and(s.eq(s.nearest, s.targetNearest), s.eq(s.nearestKind, s.targetNearestKind)),
      ),
    ),
  ],
  "Include root": [check("Include_root", Inclusion, standsFor)],
  "Include target": [
    contained(on(includeSites, "node", "kind"), on(SitePath, "node", "kind")),
    contained(on(includePaths, "node"), on(SiteTarget, "node")),
    contained(
      on(
        SiteTarget,
        "package",
        "path",
        "target",
        "targetRoot",
        "targetNearest",
        "targetNearestKind",
      ),
      on(Document, "package", "path", "node", "rootKind", "contextNearest", "contextNearestKind"),
    ),
  ],
  "Inclusion cycle": [
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
    contained(on(instanceMembers, "site", "document"), on(placingSites, "node", "target")),
    key(on(instanceMembers, "parent", "site")),
    contained(
      on(Instance, "document", "rootKind", "children"),
      on(TestDocument, "node", "rootKind", "sites"),
    ),
    key(on(instanceRoots, "document")),
    documentInstanceFamily,
    check("Inclusion_cycle", TestDocument, (d) => d.gt(d.instances, 0n)),
  ],
  "Item ref target": [
    contained(on(ItemRefHref, "node"), on(nodesOf(itemRefKind), "id")),
    contained(on(attributesOf("href", [itemRefKind]), "node"), on(ItemRefHref, "node")),
    contained(on(ItemRefHref, "node", "package", "path"), on(hrefPaths, "node", "package", "path")),
    contained(
      on(ItemRefDocument, "document", "package", "path"),
      on(Document, "node", "package", "path"),
    ),
    contained(on(ItemRefDocument, "document"), on(itemDocuments, "node")),
  ],
  "Remote section ref": [
    check("Remote_section_ref", Site, (s) =>
      s.or(s.ne(s.kind, sectionRefKind), s.eq(s.external, false)),
    ),
  ],
  "Selection bound": [
    check("Selection_bound", SectionSelection, (s) =>
      s.or(s.eq(s.withReplacement, true), s.le(s.select, Compute.base(s.members))),
    ),
  ],
  "Selection required": [
    contained(on(requiredMembers, "node"), on(requiredFlags, "node")),
    contained(on(requiredParts, "node"), on(requiredMembers, "node")),
    requiredFold,
    check("Selection_required", SectionSelection, (s) => s.le(Compute.base(s.required), s.select)),
  ],
  "Stimulus ref key": [key(on(StimulusRef, "document", "identifier"))],
  "Structure identifier": [key(on(Named, "document", "identifier"))],
  "Test name key": [
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
    assembledNameFamily,
    contained(
      on(InstanceName, "assembly", "node", "identifier"),
      on(AssembledName, "assembly", "node", "identifier"),
    ),
    check("Test_name_key", AssembledName, (a) => a.gt(a.placements, 0n)),
    key(on(AssembledName, "assembly", "identifier")),
  ],
  "Test overlay": [
    ...tokenCopies.flatMap((copy) => copy.copies),
    ...flagCopies.flatMap((copy) => copy.copies),
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
    sitesFold,
    nameFamily,
    ruleFamily,
    contained(
      on(Named, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(Named, "node", "end"), on(Node, "id", "end")),
    contained(on(Named, "parent", "parentKind"), on(Node, "id", "kind")),
    contained(on(namingIdentifiers, "node"), on(Named, "node")),
    contained(on(Named, "node", "identifier"), on(tokensOf("identifier"), "node", "value")),
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
    contained(
      on(Section, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    mirrors(on(Section, "node"), on(nodesOf(sectionKind), "id")),
    contained(on(Section, "parent", "parentKind"), on(Node, "id", "kind")),
    contained(
      on(
        select(Section, (s) => s.eq(s.loose, true)),
        "node",
      ),
      on(invisibleFlags, "node"),
    ),
    contained(
      on(invisibleFlags, "node"),
      on(
        select(Section, (s) => s.or(s.eq(s.loose, true), s.eq(s.keepTogether, true))),
        "node",
      ),
    ),
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
    contained(on(TestFlag, "node", "kind", "parentKind"), on(Node, "id", "kind", "parentKind")),
    contained(
      on(SectionSelection, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    mirrors(on(SectionSelection, "node"), on(nodesOf(selectionKind), "id")),
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
    contained(
      on(
        Site,
        "node",
        "children",
        "start",
        "document",
        "ancestry",
        "documentType",
        "governor",
        "kind",
        "nearest",
        "nearestKind",
        "parentKind",
        "version",
      ),
      nodeContext,
    ),
    contained(on(Site, "node", "parent"), on(Node, "id", "parent")),
    contained(on(SitePath, "node", "kind"), on(Site, "node", "kind")),
    contained(on(SitePath, "node", "package", "path"), on(hrefPaths, "node", "package", "path")),
    contained(on(externalSites, "node"), on(externalHrefs, "node")),
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
    contained(on(SiteTarget, "node", "package", "path"), on(SitePath, "node", "package", "path")),
    contained(on(nodesOf(sectionRefKind), "id"), on(Site, "node")),
    contained(on(includes, "id"), on(Site, "node")),
    contained(
      on(Inclusion, "node", "parentKind", "places", "root", "splices", "version"),
      on(SiteTarget, "node", "parentKind", "places", "targetRoot", "splices", "version"),
    ),
    contained(on(includeTargets, "node"), on(Inclusion, "node")),
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
    contained(
      on(StimulusRef, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(StimulusRef, "node"), on(nodesOf(stimulusRefKind), "id")),
    contained(on(attributesOf("identifier", [stimulusRefKind]), "node"), on(StimulusRef, "node")),
    contained(on(StimulusRef, "node", "identifier"), on(tokensOf("identifier"), "node", "value")),
    contained(on(assembledDocuments, "node"), on(TestDocument, "node")),
  ],
  "Variable mapping target": [
    key(on(VariableMapping, "parent", "target")),
    check("Variable_mapping_target", VariableMapping, (v) =>
      v.not(v.in(v.target, sessionVariables)),
    ),
  ],
} as const;

/**
 * {@link testLawsByName}'s statements in one list, the module's laws as the schema composes them.
 */
export const testLaws = Object.values(testLawsByName).flat();
