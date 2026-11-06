/**
 * The producers of the law oracle's laws over the tests and sections (O7) (lane OL): each law the
 * oracle declared and never raised, stated on the host from its source and the schema's statement
 * of it.
 */
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { LawBreach, PackageRows, Rows } from "#pantry/test/oracle-laws/rows.ts";

/**
 * The laws this module produces.
 */
export const testLaws = [] as const;

/**
 * A law of {@link testLaws}.
 */
export type TestLaw = (typeof testLaws)[number];

/**
 * Judge one folded document by the laws of this module it states alone.
 *
 * @param _rows - The document.
 * @param _grammar - The composed grammar.
 * @returns The breaches.
 */
export const testDocumentBreaches = (
  _rows: Rows,
  _grammar: ComposedGrammar,
): readonly LawBreach<TestLaw>[] => [];

/**
 * Judge a package by the laws of this module over more than one document.
 *
 * @param _input - The package.
 * @param _grammar - The composed grammar.
 * @returns The breaches.
 */
export const testPackageBreaches = (
  _input: PackageRows,
  _grammar: ComposedGrammar,
): readonly LawBreach<TestLaw>[] => [];
