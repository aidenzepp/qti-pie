/**
 * The producers of the laws the law oracle (`#pantry/test/oracle.ts`) declared and never raised
 * (lane OL, R87's finding): the oracle named each law in its tables, and no judgment of it could
 * break one, so every test that said "the law oracle predicts it" was vacuous for that law.
 *
 * Each producer states its law on the host from its source in the oracle's `lawSources` and the
 * schema's statement of it (`src/qti/**`), so the oracle judges what the database judges:
 *
 * - `#pantry/test/oracle-laws/documents.ts`: the declarations (O2), the LOM title (O6), and the laws
 *   the schema states that the oracle had not declared, which it declares here (`addedLaws`);
 * - `#pantry/test/oracle-laws/expressions.ts`: the expressions (O4);
 * - `#pantry/test/oracle-laws/tests.ts`: the tests and sections (O7).
 *
 * The oracle reads them through {@link lawDocumentBreaches}, over each document it judges, after
 * its own laws, and {@link lawPackageBreaches}, over the package, after its own. A law the schema
 * states that no package can break, and so no host predicate can judge, is a row of
 * {@link hostlessLaws} with the reason, never a silent gap: `src/test/complete.oracle.test.ts`
 * holds that every law the schema states is the oracle's or hostless, and that every law the oracle
 * declares is raised by a package drawn to break it.
 */
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedRows } from "#pantry/model/folds.ts";
import {
  documentDocumentBreaches,
  documentLaws,
  documentPackageBreaches,
} from "#pantry/test/oracle-laws/documents.ts";
import {
  expressionDocumentBreaches,
  expressionLaws,
  expressionPackageBreaches,
} from "#pantry/test/oracle-laws/expressions.ts";
import { viewOf } from "#pantry/test/oracle-view.ts";
import type { LawBreach, TypedReading } from "#pantry/test/oracle-view.ts";
import {
  testDocumentBreaches,
  testLaws,
  testPackageBreaches,
} from "#pantry/test/oracle-laws/tests.ts";

export { addedLaws, lomNamedTypes, objectRoots } from "#pantry/test/oracle-laws/documents.ts";

/**
 * Every law this module's producers raise.
 */
export const producedLaws = [...documentLaws, ...expressionLaws, ...testLaws] as const;

/**
 * A law of {@link producedLaws}.
 */
export type ProducedLaw = (typeof producedLaws)[number];

/**
 * One document the package's manifest lists, as the oracle hands it over: its path, the `type`
 * of the resource that lists it, and its own folded rows.
 */
export interface LawDocument {
  readonly path: string;
  readonly resourceType: string;
  readonly rows: FoldedRows<Composed>;
}

/**
 * A package as the oracle hands it over: its manifest's rows, the documents it lists that folded,
 * in manifest order, its entries' paths, and each document's path with the paths of the documents
 * its includes splice in place (spec reading 117).
 */
export interface LawPackage {
  readonly documents: readonly LawDocument[];
  readonly entries: readonly string[];
  readonly manifest: { readonly path: string; readonly rows: FoldedRows<Composed> };
  readonly spliced: ReadonlyMap<string, readonly string[]>;
}

/**
 * Judge one folded document by every producer's laws over a document alone. The oracle calls it
 * on the rows it judges its own document laws over, an including document's merged with what it
 * includes.
 *
 * @param path - The document's path in its package.
 * @param rows - Its folded rows.
 * @param grammar - The composed grammar.
 * @param typed - How an attribute's type reads its value.
 * @returns The breaches, module by module.
 */
export const lawDocumentBreaches = (
  path: string,
  rows: FoldedRows<Composed>,
  grammar: ComposedGrammar,
  typed: TypedReading,
): readonly LawBreach<ProducedLaw>[] => {
  const indexed = viewOf(path, rows, typed);

  return [
    ...documentDocumentBreaches(indexed, grammar),
    ...expressionDocumentBreaches(indexed, grammar),
    ...testDocumentBreaches(indexed, grammar),
  ];
};

/**
 * Judge a package by every producer's laws over more than one document.
 *
 * @param input - The package.
 * @param grammar - The composed grammar.
 * @param typed - How an attribute's type reads its value.
 * @returns The breaches, module by module.
 */
export const lawPackageBreaches = (
  input: LawPackage,
  grammar: ComposedGrammar,
  typed: TypedReading,
): readonly LawBreach<ProducedLaw>[] => {
  const rows = {
    documents: input.documents.map(({ path, resourceType, rows: folded }) => ({
      path,
      resourceType,
      rows: viewOf(path, folded, typed),
    })),
    entries: new Set(input.entries),
    manifest: viewOf(input.manifest.path, input.manifest.rows, typed),
    spliced: input.spliced,
  };

  return [
    ...documentPackageBreaches(rows, grammar),
    ...expressionPackageBreaches(rows, grammar),
    ...testPackageBreaches(rows, grammar),
  ];
};

/**
 * The laws of the catalog (`#pantry/vocab/laws.ts` `lawTable`) that the oracle states as
 * several laws of its own, each part a law of the oracle with the stated law's rule.
 *
 * - `N2 tree`: grizzle's tree statement over `Node` (`tree(on(Node, "parent", "at"), fin(Node,
 *   "children"), { root: "document" })`, its key `(parent, at)`, `UNIQUE (document, start)` and its
 *   interval checks, trees.md §2 to §4), which the oracle states as its key, its slot key and each
 *   interval law T1 to T6.
 */
export const statedInParts = {
  "N2 tree": [
    "Node key",
    "N2 key",
    "T1 document order",
    "T2 root",
    "T3 first child",
    "T4 next sibling",
    "T5 last child",
    "T6 nonempty and leaf",
  ],
} as const satisfies Readonly<Record<string, readonly string[]>>;

/**
 * The laws the schema states that no host predicate over a package's rows can judge, each with
 * why. None is a rule of the specification a package can break: each is a law over rows the
 * importer writes beside the tree, copied from it, which the host writes none of. Only an importer
 * that writes rows its tree does not give breaks one, so the database tier is its judge.
 */
export const hostlessLaws = {
  "Declaration overlay":
    "its rows (Declaration, DeclarationBaseType, ValueSet, Value, ValueBaseType, RecordField, MasteryValue, NormalMinimum, NormalMaximum, MasteryFloor, MasteryCeiling) are copies the importer writes of each declaration element's node, attributes and string value (plan §1.7 O2, C18); the host writes no such row, and a package's text can make no copy disagree with what it copies",
  "Entry family":
    "its rows are the package's entries in listing order, one per path, which the importer numbers; two entries of one path never reach a row, since the ZIP reader refuses them under zip-format (src/package/zip.ts, 'the archive holds two entries with this name')",
  "Manifest overlay":
    "its rows (ManifestId, Resource, ResourceHref, File, Dependency) are copies the importer writes of each manifest element's node and attributes (plan §1.6, C18); the host writes no such row, and a package's text can make no copy disagree with what it copies",
  "Mapping overlay":
    "its rows (Mapping, MapKey and its typed forms, AreaMapping, LookupTable) are copies the importer writes of each mapping element's node, its declaration's reference and its map key (plan §1.7 O5, C18); the host writes no such row, and a package's text can make no copy disagree with what it copies",
  "Package key":
    "its one row per package is keyed by the id the importer mints, which no package states, so no package text can repeat or omit it",
  "Reference overlay":
    "its rows (DocumentDirectory, XmlBase, Reference, ReferencePath) are each document's directory and each reference's copy, which the importer writes and resolves from the tree (CP 1.2 (b) and (d), reading 102); the host writes no such row, and the laws a package can break over its references are the oracle's Href form, File exists and Stimulus ref target",
  "Test overlay":
    "its rows (TestDocument, TestToken, TestFlag, Named, Section, SectionMember, SectionSelection, SectionOrdering, Site, BranchRule) are copies the importer writes of each test element's node and attributes, collapsed (plan §1.7 O7, C15, C18); the host writes no such row, and a package's text can make no copy disagree with what it copies",
} as const satisfies Readonly<Record<string, string>>;
