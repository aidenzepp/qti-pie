/**
 * The producers of the laws the law oracle (`#pantry/test/oracle.ts`) declared and never raised
 * (lane OL, R87's finding): the oracle named each law in its tables, and no judgment of it could
 * break one, so every test that said "the law oracle predicts it" was vacuous for that law.
 *
 * Each producer states its law on the host from its source in the oracle's `lawSources` and the
 * schema's statement of it (`src/qti/**`), so the oracle judges what the database judges:
 *
 * - `#pantry/test/oracle-laws/documents.ts`: the declarations (O2), the LOM title (O6), and the laws
 *   the schema states that the oracle had not declared, which it declares here
 *   ({@link addedLawNames});
 * - `#pantry/test/oracle-laws/expressions.ts`: the expressions (O4);
 * - `#pantry/test/oracle-laws/tests.ts`: the tests and sections (O7).
 *
 * The oracle reads them through {@link lawDocumentBreaches}, over each document it judges, after
 * its own laws, and {@link lawPackageBreaches}, over the package, after its own. A law the schema
 * states that no package can break, and so no host predicate can judge, is a row of
 * {@link hostlessLaws} with the reason, never a silent gap: `src/test/oracle.complete.test.ts`
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
import { rowsOf } from "#pantry/test/oracle-laws/rows.ts";
import type { LawBreach } from "#pantry/test/oracle-laws/rows.ts";
import {
  testDocumentBreaches,
  testLaws,
  testPackageBreaches,
} from "#pantry/test/oracle-laws/tests.ts";

export {
  addedExplainers,
  addedLawNames,
  addedLawRules,
  addedLawSources,
  addedRules,
} from "#pantry/test/oracle-laws/documents.ts";

export type { AddedLaw } from "#pantry/test/oracle-laws/documents.ts";

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
 * in manifest order, and its entries' paths.
 */
export interface LawPackage {
  readonly documents: readonly LawDocument[];
  readonly entries: readonly string[];
  readonly manifest: { readonly path: string; readonly rows: FoldedRows<Composed> };
}

/**
 * Judge one folded document by every producer's laws over a document alone. The oracle calls it
 * on the rows it judges its own document laws over, an including document's merged with what it
 * includes.
 *
 * @param path - The document's path in its package.
 * @param rows - Its folded rows.
 * @param grammar - The composed grammar.
 * @returns The breaches, module by module.
 */
export const lawDocumentBreaches = (
  path: string,
  rows: FoldedRows<Composed>,
  grammar: ComposedGrammar,
): readonly LawBreach<ProducedLaw>[] => {
  const indexed = rowsOf(path, rows);

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
 * @returns The breaches, module by module.
 */
export const lawPackageBreaches = (
  input: LawPackage,
  grammar: ComposedGrammar,
): readonly LawBreach<ProducedLaw>[] => {
  const rows = {
    documents: input.documents.map(({ path, resourceType, rows: folded }) => ({
      path,
      resourceType,
      rows: rowsOf(path, folded),
    })),
    entries: new Set(input.entries),
    manifest: rowsOf(input.manifest.path, input.manifest.rows),
  };

  return [
    ...documentPackageBreaches(rows, grammar),
    ...expressionPackageBreaches(rows, grammar),
    ...testPackageBreaches(rows, grammar),
  ];
};

/**
 * The laws the schema states (`#pantry/import/refusal.ts` `lawTable`) that the oracle does not
 * judge, each with why no host predicate over a package's rows can: none of them is a rule of the
 * specification a package can break, each is a law over the rows the importer itself writes beside
 * the tree, which the host writes none of, so only an importer that writes rows its tree does not
 * give breaks one, and the database tier is its judge.
 */
export const hostlessLaws: Readonly<Record<string, string>> = {};
