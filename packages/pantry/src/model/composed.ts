/**
 * The composed grammar as the model reads it: the handle types of every roster `compose` generates
 * ({@link Composed}), and the one projection of the grammar each model function reads a document
 * through: shred's ({@link shredGrammarOf}), the folds' ({@link foldGrammarOf}) and unshred's names
 * ({@link namesOf}).
 *
 * Each projection reads the grammar's closed relations as they are and computes no step of its
 * own, so the importer, the export and every test read a document through the same relations.
 */
import { Array as Arr, Option, Result } from "effect";
import { admissionOf, textDomainOf } from "#pantry/grammar/attributes.ts";
import type { ComposedGrammar, Kind, Name } from "#pantry/grammar/compose.ts";
import { placedStep, placementOf } from "#pantry/grammar/content.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import type { Qualified } from "#pantry/grammar/domains.ts";
import { expandedText } from "#pantry/grammar/names.ts";
import { typeHandle } from "#pantry/grammar/xsi.ts";
import { isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import type { FoldGrammar } from "#pantry/model/folds.ts";
import type { ShredGrammar } from "#pantry/model/shred.ts";
import type { XdmNames } from "#pantry/model/unshred.ts";
import { handlePrefixes } from "#pantry/model/xdm.ts";
import type { ClosedName, ElementKind, ExpandedName, XdmVocabulary } from "#pantry/model/xdm.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

/**
 * The handle types of the composed grammar: every roster `compose` generates.
 */
export interface Composed extends XdmVocabulary {
  readonly kind: Kind;
  readonly name: Name;
  readonly version: SchemaVersion;
}

/**
 * Keep a `NodeKind` handle when it is an element kind of a vocabulary.
 *
 * @param kind - A handle of the composed roster.
 * @returns The handle, or none for a kind the XDM fixes or a foreign kind.
 */
const elementKindOf = (kind: Kind): Option.Option<ElementKind<Composed>> =>
  kind === "document" ||
  kind === "doctype" ||
  kind === "text" ||
  kind === "ws" ||
  kind === "comment" ||
  kind === "pi" ||
  kind === "entityRef" ||
  isForeignKind(kind)
    ? Option.none()
    : Option.some(kind);

/**
 * The open classes, the `AttributeName` handles that name no one attribute.
 */
const openHandles: ReadonlySet<string> = new Set(openClasses);

/**
 * Test whether an `AttributeName` handle names one attribute.
 *
 * @param name - A handle of the composed roster.
 * @returns Whether it is no open class.
 */
const isClosedName = (name: Name): name is ClosedName<Composed> => !openHandles.has(name);

/**
 * Keep an `AttributeName` handle when it names one attribute.
 *
 * @param name - A handle of the composed roster.
 * @returns The handle, or none for an open class.
 */
const closedNameOf = (name: Name): Option.Option<ClosedName<Composed>> =>
  Option.liftPredicate(name, isClosedName);

/**
 * Read the composed grammar as shred reads a grammar: its kind resolution, the `AttributeName`
 * roster's closed handles, `Admission`'s key set as the children each kind admits,
 * `AttributeAdmission`, and each attribute's and each text's domain's `qualified`, `StrictlyHeld`
 * with `HeldRootsUnder`'s patterns, each compiled once, and the `TypeName` roster with each kind's
 * declared type.
 *
 * @param grammar - The composed grammar.
 * @returns The grammar shred reads documents through.
 */
export const shredGrammarOf = (grammar: ComposedGrammar): ShredGrammar<Composed> => {
  const qualifiedOf: ReadonlyMap<string, Qualified> = new Map(
    grammar.attributes.domains.flatMap(({ handle, qualified }) =>
      Option.toArray(qualified).map((held) => [handle, held] as const),
    ),
  );
  const heldRoots: ReadonlyMap<string, RegExp> = new Map(
    grammar.heldRootsUnder.rows.map(({ names, parent, version }) => [
      `${version} ${parent}`,
      new RegExp(names, patternFlags),
    ]),
  );

  return {
    admitsChild: (version, parent, child) =>
      Option.isSome(grammar.admission.lookup({ child, parent, version })),
    admitted: (version, kind, governs, name) =>
      Option.isSome(admissionOf(grammar.attributes, { governs, kind, name, version })),
    closedName: (spelling) =>
      grammar.kinds.attributeName.has(spelling) ? closedNameOf(spelling) : Option.none(),
    declaredType: (version, kind) => grammar.xsi.declaredType(version, kind),
    heldRoot: (version, parent, name) =>
      heldRoots.get(`${version} ${parent}`)?.test(expandedText(name)) ?? false,
    qualified: (version, kind, governs, site) =>
      (site._tag === "text"
        ? textDomainOf(grammar.attributes, { governs, kind, version })
        : Option.map(
            admissionOf(grammar.attributes, { governs, kind, name: site.name, version }),
            ({ domain }) => domain,
          )
      ).pipe(Option.flatMap((domain) => Option.fromNullishOr(qualifiedOf.get(domain)))),
    resolve: (namespace, local, parent) =>
      grammar.kinds.resolve(namespace, local, parent).pipe(Option.flatMap(elementKindOf)),
    strictlyHeld: (version, parent, kind) =>
      Option.isSome(grammar.content.strictlyHeld.lookup({ child: kind, parent, version })),
    typeName: (version, name) => {
      const handle = typeHandle(name);

      return grammar.xsi.definedIn(version, handle) ? Option.some(handle) : Option.none();
    },
  };
};

/**
 * Read the composed grammar as the folds read a grammar: a child's state in its parent's content
 * automaton, from its placement (`placementOf`): its position where it names one, which the laws
 * judge, and otherwise `placedStep` over `Symbol` and `Follow`; `AttributeAdmission`'s position;
 * `Enters`, `Interaction` and `IsElement`.
 *
 * @param grammar - The composed grammar.
 * @returns The closed relations the folds read.
 */
export const foldGrammarOf = (grammar: ComposedGrammar): FoldGrammar<Composed> => ({
  ancestry: grammar.ancestry,
  attributePosition: (key) =>
    Option.map(admissionOf(grammar.attributes, key), ({ position }) => position),
  interaction: grammar.kinds.interaction,
  isElement: grammar.kinds.isElement,
  state: (key, was) =>
    Option.match(placementOf(grammar, key), {
      onNone: () => Result.fail("unadmitted" as const),
      onSome: (placement) =>
        placement._tag === "at"
          ? Result.succeed(placement.position)
          : Result.fromOption(
              placedStep(grammar.content, key, placement, was),
              () => "unfollowed" as const,
            ),
    }),
});

/**
 * Name the attribute a closed handle spells: a handle that begins with a prefix of
 * {@link handlePrefixes} names an attribute in that prefix's namespace, and any other handle one
 * in no namespace. The prefix it is written with is the tree's own (`XdmClosedName.prefix`).
 *
 * @param handle - The handle.
 * @returns The local name and namespace name it is written and read with.
 */
const attributeNameOf = (handle: string): ExpandedName =>
  Option.getOrElse(
    Arr.findFirst(handlePrefixes, ({ prefix }) => handle.startsWith(`${prefix}:`)).pipe(
      Option.map(({ namespace, prefix }) => ({
        local: handle.slice(prefix.length + 1),
        namespace,
      })),
    ),
    () => ({ local: handle, namespace: "" }),
  );

/**
 * Read the composed grammar's names as unshred writes a tree under them: each element kind's
 * `ElementName` row, and each closed handle's own spelling.
 *
 * @param grammar - The composed grammar.
 * @returns The names. Naming a kind `ElementName` holds no row for is a defect of the grammar,
 *   whose element kinds are exactly that relation's key set.
 */
export const namesOf = (grammar: ComposedGrammar): XdmNames<Composed> => {
  const elements: ReadonlyMap<string, ExpandedName> = new Map(
    grammar.kinds.elementName.rows.map(({ kind, local, namespace }) => [
      kind,
      { local, namespace },
    ]),
  );

  return {
    attribute: attributeNameOf,
    element: (kind) =>
      Option.getOrThrowWith(
        Option.fromNullishOr(elements.get(kind)),
        () => new Error(`The grammar's ElementName holds no row for the element kind ${kind}.`),
      ),
  };
};
