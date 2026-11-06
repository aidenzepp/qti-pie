/**
 * The producers of the law oracle's laws over the declarations (O2), the LOM title, and the laws
 * the schema states that the oracle had not declared (lane OL): each law the oracle declared and
 * never raised, stated on the host from its source and the schema's statement of it.
 */
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { LawBreach, PackageRows, Rows } from "#pantry/test/oracle-laws/rows.ts";

/**
 * The laws this module produces.
 */
export const documentLaws = [] as const;

/**
 * A law of {@link documentLaws}.
 */
export type DocumentLaw = (typeof documentLaws)[number];

/**
 * Judge one folded document by the laws of this module it states alone.
 *
 * @param _rows - The document.
 * @param _grammar - The composed grammar.
 * @returns The breaches.
 */
export const documentDocumentBreaches = (
  _rows: Rows,
  _grammar: ComposedGrammar,
): readonly LawBreach<DocumentLaw>[] => [];

/**
 * Judge a package by the laws of this module over more than one document.
 *
 * @param _input - The package.
 * @param _grammar - The composed grammar.
 * @returns The breaches.
 */
export const documentPackageBreaches = (
  _input: PackageRows,
  _grammar: ComposedGrammar,
): readonly LawBreach<DocumentLaw>[] => [];

/**
 * The laws the schema states (`#pantry/import/refusal.ts` `lawTable`) that the law oracle had not
 * declared, which this module declares and produces: each joins the oracle's `LawName`, its rule
 * its `oracleRules`, and its rule, source and explanation the oracle's tables, through
 * `#pantry/test/oracle-laws.ts`.
 */
export const addedLawNames = [] as const;

/**
 * A law of {@link addedLawNames}.
 */
export type AddedLaw = (typeof addedLawNames)[number];

/**
 * The rules {@link addedLawNames} name that the oracle's `oracleRules` did not hold.
 */
export const addedRules = [] as const;

/**
 * The rule each added law's refusal is named by, the schema's (`lawTable`).
 */
export const addedLawRules = {} as const satisfies Readonly<Record<AddedLaw, string>>;

/**
 * The source each added law states, the schema's (`lawTable`), word for word.
 */
export const addedLawSources = {} as const satisfies Readonly<Record<AddedLaw, string>>;

/**
 * Explain a breach of each added law from its keys.
 */
export const addedExplainers: Readonly<
  Record<AddedLaw, (keys: Readonly<Record<string, string>>, grammar: ComposedGrammar) => string>
> = {};
