/**
 * The import's one decision that a lexical form names something, for every relation that holds
 * such a name as a written row rather than as a query over `Attribute` (grizzle's Q18 and Q19).
 */
import { Option } from "effect";
import { collapse, isNcName } from "#pantry/grammar/domains.ts";

/**
 * Read the name a lexical form gives: the form collapsed (XML Schema Part 2, §4.3.6), where that is
 * an NCName ({@link isNcName}). Any other form names nothing, so the relation that would hold the
 * name has no row for it, and the attribute's value domain refuses it alone (spec readings 152 and
 * 157, decision 457 (2)).
 *
 * The relations whose rows it decides:
 *
 * - `CatalogId` (`#pantry/qti/catalog.ts`), a `qti-catalog`'s `id`;
 * - `TableHeader` (`#pantry/qti/html.ts`), a `th`'s `id`;
 * - `BindingName` and `BoundVariable` (`#pantry/qti/interactions.ts`), an interaction's bindings;
 * - The content references and a section's feedback names (`referenceSources` and `sectionSources` of
 *   `#pantry/qti/interactions.ts`);
 * - `VariableRef` (`#pantry/qti/expressions.ts`), a bare processing reference;
 * - `Dependency` (`#pantry/qti/package.ts`), a `cp:dependency`'s `identifierref`;
 * - `Named` (`#pantry/qti/tests.ts`), a structure's `identifier`.
 *
 * The schema states each of their sources as a selection that matches `namingPattern`
 * (`#pantry/qti/attributes.ts`), and holds it forward only: each row the selection selects has its
 * row in the relation, and no law refuses a row beyond them. So a row for a form that names nothing
 * would stand and be judged beside the value domain, which reading 152 rules out, and the decision
 * stays here: a counted family counts each relation, and a family reads stored tables only (Q18),
 * and a query collapses no unbounded text (Q19).
 *
 * @param lexical - The lexical form, as written.
 * @returns The name, none where the form names nothing.
 */
// GRIZZLE-PENDING: Q18, Q19: each relation above becomes a query over `Attribute` that collapses and matches its form, and this gate goes.
export const namedBy = (lexical: string): Option.Option<string> =>
  Option.liftPredicate(collapse(lexical), isNcName);
