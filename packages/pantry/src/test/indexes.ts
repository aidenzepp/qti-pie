/**
 * The tests' own indexes of the grammar's relations no serving path reads by key.
 *
 * A serving path (the database's layer, its reads and the importer's writes) looks up only the
 * relations the grammar builds `Indexed` (`#pantry/grammar/closed.ts`); every other relation holds
 * its rows alone, so no load builds an index nothing serving reads. A test that reads one by key
 * builds its index here, once per relation, and the content automaton's and the ancestry's
 * judgments the tests read (`accepts`, `contentEnds`, `admits`) read those indexes.
 */
import { Option } from "effect";
import { admits as admitsIn } from "#pantry/grammar/ancestry.ts";
import type { Ancestry, AncestrySets, IndexedFlagSet } from "#pantry/grammar/ancestry.ts";
import { indexed, indexedSourced } from "#pantry/grammar/closed.ts";
import type { Admission } from "#pantry/grammar/admission.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { contentModelOf, stepOf } from "#pantry/grammar/content.ts";
import type { ContentGrammar } from "#pantry/grammar/content.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

/**
 * Index every relation of a composed grammar that no serving path reads by key.
 *
 * @param grammar - The grammar.
 * @returns Each relation, indexed.
 */
const indexesFor = (grammar: ComposedGrammar) => ({
  anonymousType: indexedSourced(grammar.xsi.anonymousType),
  banned: indexed(grammar.ancestry.banned),
  barredBy: indexedSourced(grammar.barredBy),
  bindingFit: indexed(grammar.bindingFit),
  builtIn: indexed(grammar.references.builtIn),
  builtInBaseType: indexed(grammar.references.builtInBaseType),
  choiceBound: indexed(grammar.references.choiceBound),
  choiceCount: indexed(grammar.references.choiceCount),
  counted: indexedSourced(grammar.content.counted),
  heldRootsUnder: indexed(grammar.heldRootsUnder),
  identity: indexed(grammar.attributes.identity),
  mappableBaseType: indexed(grammar.mappableBaseType),
  needs: indexed(grammar.ancestry.needs),
  operatorArity: indexed(grammar.operatorArity),
  recordBindingFit: indexed(grammar.recordBindingFit),
  sectionPart: indexed(grammar.references.sectionPart),
  xsiType: indexedSourced(grammar.xsi.xsiType),
});

/**
 * The relations of a composed grammar no serving path reads by key, indexed.
 */
export type GrammarIndexes = ReturnType<typeof indexesFor>;

/**
 * Each composed grammar's indexes, built at its first read.
 */
const built = new WeakMap<ComposedGrammar, GrammarIndexes>();

/**
 * Read a composed grammar's relations no serving path reads by key, each indexed once.
 *
 * @param grammar - The grammar.
 * @returns The indexes.
 */
export const indexesOf = (grammar: ComposedGrammar): GrammarIndexes =>
  built.getOrInsertComputed(grammar, () => indexesFor(grammar));

/**
 * Each content grammar's `Last`, indexed at its first read.
 */
const lastIndexes = new WeakMap<
  ContentGrammar["last"],
  ReturnType<typeof indexed<ContentGrammar["last"]["key"], ContentGrammar["last"]["payload"]>>
>();

/**
 * Whether a family may end in a state: `Last`'s cell under the family's model.
 *
 * @param content - The content grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param state - The last child's state, 0 for an empty family.
 * @returns Whether the family may end there.
 */
export const contentEnds = (
  content: ContentGrammar,
  version: SchemaVersion,
  parent: string,
  state: number,
): boolean => {
  const last = lastIndexes.getOrInsertComputed(content.last, () => indexed(content.last));

  return Option.exists(contentModelOf(content, { parent, version }), (model) =>
    Option.isSome(last.lookup({ model, position: String(state) })),
  );
};

/**
 * Judge a family of child kinds by the installed automaton, as the database does: each child steps
 * from its predecessor's state (0 for the first), and the last state must be one `Last` holds.
 *
 * @param grammar - The composed grammar's `Admission` and content grammar.
 * @param grammar.admission - `Admission`.
 * @param grammar.content - The content grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param children - The children's kinds, in order.
 * @returns Whether the family's content is the model's.
 */
export const accepts = (
  grammar: { readonly admission: Admission; readonly content: ContentGrammar },
  version: SchemaVersion,
  parent: string,
  children: readonly string[],
): boolean => {
  let state = 0;
  for (const child of children) {
    const next = stepOf(grammar, { child, parent, version }, state);
    if (Option.isNone(next)) {
      return false;
    }

    state = next.value;
  }

  return contentEnds(grammar.content, version, parent, state);
};

/**
 * Each ancestry grammar's `Banned` and `Needs`, indexed at their first read.
 */
const ancestryIndexes = new WeakMap<
  AncestrySets,
  { readonly banned: IndexedFlagSet; readonly needs: IndexedFlagSet }
>();

/**
 * Read an ancestry grammar's `Banned` and `Needs`, each indexed once.
 *
 * @param sets - The ancestry grammar.
 * @returns The two sets, indexed.
 */
export const ancestryIndexesOf = (
  sets: AncestrySets,
): { readonly banned: IndexedFlagSet; readonly needs: IndexedFlagSet } =>
  ancestryIndexes.getOrInsertComputed(sets, () => ({
    banned: indexed(sets.banned),
    needs: indexed(sets.needs),
  }));

/**
 * Decide whether a node of a kind may sit in an ancestry (`admits` of
 * `#pantry/grammar/ancestry.ts`), over the ancestry grammar's sets, indexed here.
 *
 * @param sets - The ancestry grammar.
 * @param parent - The ancestry the node sits in, its parent's own.
 * @param kind - The node's kind.
 * @returns Whether the node may sit there.
 */
export const admits = (sets: AncestrySets, parent: Ancestry, kind: string): boolean =>
  admitsIn(ancestryIndexesOf(sets), parent, kind);
