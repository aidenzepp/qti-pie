/**
 * The producers of the law oracle's laws over the expressions (O4) (lane OL): each law the oracle
 * declared and never raised, stated on the host from its source and the schema's statement of it.
 */
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { LawBreach, PackageRows, Rows } from "#pantry/test/oracle-laws/rows.ts";

/**
 * The laws this module produces.
 */
export const expressionLaws = [] as const;

/**
 * A law of {@link expressionLaws}.
 */
export type ExpressionLaw = (typeof expressionLaws)[number];

/**
 * Judge one folded document by the laws of this module it states alone.
 *
 * @param _rows - The document.
 * @param _grammar - The composed grammar.
 * @returns The breaches.
 */
export const expressionDocumentBreaches = (
  _rows: Rows,
  _grammar: ComposedGrammar,
): readonly LawBreach<ExpressionLaw>[] => [];

/**
 * Judge a package by the laws of this module over more than one document.
 *
 * @param _input - The package.
 * @param _grammar - The composed grammar.
 * @returns The breaches.
 */
export const expressionPackageBreaches = (
  _input: PackageRows,
  _grammar: ComposedGrammar,
): readonly LawBreach<ExpressionLaw>[] => [];
