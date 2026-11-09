/**
 * The terms of interactions that the schema (`#pantry/qti/interactions.ts`) and the importer
 * (`#pantry/import/overlays/interactions.ts`) both read: the interaction kinds, the attributes O3
 * reads on each, the content references and the XSD defaults of the counts. Each is a function of
 * the grammar's rows and the attribute inventory alone, so loading this module builds no relation
 * of the schema.
 */
import { Option } from "effect";
import type { Kind, Name } from "#pantry/grammar/compose.ts";
import { ChoiceBound, ContentReference, interactionKinds } from "#pantry/grammar/install.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { itemKind, testKind } from "#pantry/vocab/terms/tests.ts";

/**
 * The root kinds of the documents whose content references resolve in their own declarations: an
 * item's (`itemKind` of `#pantry/qti/tests.ts`), whose bindings and references the item-only laws
 * read, and a test's (`testKind`), whose feedback and printed variables name the test's own
 * declarations (the port audit's A43 and A44: a test feedback's `outcome-identifier` names an
 * outcome the test declares; a test rubric's printed variable a variable the test declares). Every
 * other document's resolve once per assembly that places it: a section document's in each test's
 * declarations, an included fragment's in each item's or test's (spec reading 117).
 */
export const referringRoots = [itemKind, testKind] as const satisfies readonly Kind[];

/**
 * The choices: the kinds whose `identifier` names a value of their interaction's response, each a
 * child of its interaction or, for a gap, inside a gap-match interaction (reading 38), so its
 * nearest interaction (N8) is the interaction it is a choice of. A hottext may sit outside a
 * hottext interaction (reading 38's "hottext placement"), so it is `Hottext`'s
 * (`#pantry/qti/interactions.ts`).
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_SimpleChoice | QTI 3.0 information model, §5.132 SimpleChoice}
 */
export const choiceKinds = [
  "qti-simple-choice",
  "qti-simple-associable-choice",
  "qti-hotspot-choice",
  "qti-associable-hotspot",
  "qti-gap-text",
  "qti-gap-img",
  "qti-inline-choice",
  "qti-gap",
] as const satisfies readonly Kind[];

/**
 * The hottext's kind.
 */
export const hottextKind = "qti-hottext" satisfies Kind;

/**
 * The kinds that carry a `shape` the default-hotspot laws read (reading 80).
 */
export const hotspotKinds = [
  "qti-hotspot-choice",
  "qti-associable-hotspot",
] as const satisfies readonly Kind[];

/**
 * The slider interaction, whose bounds `Slider_bounds` orders.
 */
export const sliderKind = "qti-slider-interaction" satisfies Kind;

/**
 * The extended text interaction, which needs `max-strings` when bound to a container (reading
 * 19).
 */
export const extendedTextKind = "qti-extended-text-interaction" satisfies Kind;

/**
 * The interactions with a `string-identifier`, which binds a second response variable of base type
 * string (§5.48.2, §5.162.3).
 */
export const stringBindingKinds = [
  "qti-text-entry-interaction",
  extendedTextKind,
] as const satisfies readonly Kind[];

/**
 * The two attributes by which an interaction binds a response variable.
 */
export const bindingAttributes = [
  "response-identifier",
  "string-identifier",
] as const satisfies readonly Name[];

/**
 * The gap's kind: the `Choice` rows (`#pantry/qti/interactions.ts`) of this kind are the ones
 * `Interaction.gaps` counts.
 */
export const gapKind = "qti-gap" satisfies Kind;

/**
 * The ARIA range attributes, on any element that carries them (§5.2.31, §5.2.32).
 */
export const ariaNames = ["aria-valuemin", "aria-valuemax"] as const satisfies readonly Name[];

/**
 * The `adaptive` attribute of an item, an `xs:boolean` that defaults to false.
 */
export const adaptiveName = "adaptive" satisfies Name;

/**
 * The content references, each by the relation that holds it: the attribute it is made by, and the
 * kinds `ContentReference` lists for that attribute (and, for a printed variable and a context
 * variable, which share `identifier`, its one kind).
 */
const contentRows = ContentReference.rows;

/**
 * Collect the kinds `ContentReference` lists for references made by some attributes on some kinds.
 *
 * @param attributes - The attributes.
 * @param kinds - The kinds, none for every kind.
 * @returns The kinds, each once.
 */
const referringKinds = (attributes: readonly Name[], kinds?: readonly Kind[]): readonly Kind[] => [
  ...new Set(
    contentRows
      .filter(
        (row) =>
          attributes.includes(row.attribute) && (kinds === undefined || kinds.includes(row.kind)),
      )
      .map(({ kind }) => kind),
  ),
];

/**
 * The printed variable's kind.
 */
const printedVariable = "qti-printed-variable" satisfies Kind;

/**
 * The context variable's kind, a PCI's binding of a context variable (§5.106.6).
 */
const contextVariableKind = "qti-context-variable" satisfies Kind;

/**
 * Each content reference relation's attributes and kinds, as `ContentReference` lists them. A
 * printed variable's `base` and `index` hold an integer or a variable's name (the XSD's union of
 * `xs:integer` and `VariableStringDType`); each other attribute is an `IdentifierDType`. Each names
 * a variable exactly where its value is an NCName (`namePattern`, `#pantry/qti/interactions.ts`).
 */
export const references = {
  context: { attributes: ["identifier"], kinds: [contextVariableKind] },
  feedback: {
    attributes: ["outcome-identifier"],
    kinds: referringKinds(["outcome-identifier"]),
  },
  printed: { attributes: ["identifier"], kinds: [printedVariable] },
  template: {
    attributes: ["template-identifier"],
    kinds: referringKinds(["template-identifier"]),
  },
  variable: { attributes: ["base", "index"], kinds: [printedVariable] },
} as const satisfies Readonly<
  Record<string, { readonly attributes: readonly Name[]; readonly kinds: readonly Kind[] }>
>;

/**
 * The attributes O3 reads, by name, each with the kinds it is read on: every attribute below is
 * copied into `InteractionAttribute` (`#pantry/qti/interactions.ts`); the ARIA range attributes are
 * read on every kind.
 */
export const readAttributes: ReadonlyMap<Name, readonly Kind[]> = (() => {
  const read = new Map<Name, Set<Kind>>();
  const add = (name: Name, kinds: readonly Kind[]) => {
    const held = read.getOrInsertComputed(name, () => new Set());
    for (const kind of kinds) {
      held.add(kind);
    }
  };
  add("response-identifier", interactionKinds);
  add("string-identifier", stringBindingKinds);
  add("identifier", [...choiceKinds, hottextKind]);
  add("shape", hotspotKinds);
  for (const { kind, max, min } of ChoiceBound.rows) {
    add(min, [kind]);
    add(max, [kind]);
  }
  add("lower-bound", [sliderKind]);
  add("upper-bound", [sliderKind]);
  add(adaptiveName, [itemKind]);
  for (const { attributes, kinds } of Object.values(references)) {
    for (const attribute of attributes) {
      add(attribute, kinds);
    }
  }

  return new Map([...read].map(([name, kinds]) => [name, [...kinds]]));
})();

/**
 * The portable custom interaction's kind, the one element whose module a form names.
 */
export const pciKind = "qti-portable-custom-interaction" satisfies Kind;

/**
 * The kind of a portable custom interaction's `qti-interaction-modules` child, the element form of
 * its module.
 */
export const modulesKind = "qti-interaction-modules" satisfies Kind;

/**
 * The XSD default of an attribute on a kind in a version, as the inventory leaf declares it.
 */
const defaults: ReadonlyMap<string, string> = new Map(
  attributeDeclarations.flatMap(({ default: stated, kind, name, versions: held }) =>
    Option.toArray(stated).flatMap((value) =>
      held.map((version) => [`${version} ${kind} ${name}`, value] as const),
    ),
  ),
);

/**
 * Read the XSD default of a count attribute.
 *
 * @param version - The schema version.
 * @param kind - The element's kind.
 * @param name - The attribute.
 * @returns Its default's lexical form, or none where the XSD gives none.
 */
export const countDefault = (version: string, kind: Kind, name: Name): Option.Option<string> =>
  Option.fromNullishOr(defaults.get(`${version} ${kind} ${name}`));
