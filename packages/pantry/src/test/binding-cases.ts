/**
 * The bindings the fit laws judge, as cases over the every-relation package
 * (`#pantry/test/gen/every-relation.ts`): an interaction's binding attribute at a site, and the
 * state of the response declaration it names, drawn from the small scope
 * `src/test/binding-fit.oracle.test.ts` exhausts against the law oracle and the importer's rows,
 * and `src/import/binding-fit.db.test.ts` against the database.
 *
 * A binding whose name a response declaration of its item holds has its `BindingDeclaration` (or
 * `PlacedBindingDeclaration`) row, and one whose name none holds has none, which "Binding
 * declared" refuses alone (`#pantry/qti/interactions.ts`; lane NIL's audit, B1 and B2: a missing
 * value is a row of its own relation, never a sentinel). The fit laws ("BindingFit",
 * "RecordBindingFit", "Binding cardinality" and `max-strings-required`) read the declaration rows,
 * and the law oracle judges them only where the declaration writes its `cardinality` as a
 * cardinality is spelled: one left unwritten is AL3's alone, and one written as no cardinality its
 * value domain's alone (the orchestrator's ruling of 2026-11-06: an absent attribute is no empty
 * one, and one cause is refused under one rule).
 */
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { editText, replaceOnce } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * One binding attribute of one interaction, and the response declaration it names in the base.
 */
export interface BindingSite {
  /**
   * The binding attribute.
   */
  readonly attribute: "response-identifier" | "string-identifier";
  /**
   * The document whose interaction binds.
   */
  readonly binding: string;
  /**
   * The interaction's start tag, up to the binding attribute's value, which occurs once in
   * {@link BindingSite.binding}.
   */
  readonly bound: string;
  /**
   * The declaration's start tag, which occurs once in {@link BindingSite.declared}.
   */
  readonly declaration: string;
  /**
   * The item that declares the bound response.
   */
  readonly declared: string;
  /**
   * The name the base binds.
   */
  readonly identifier: string;
  /**
   * The interaction's kind.
   */
  readonly kind: string;
  /**
   * The edit the base needs before the site exists: none, or one that writes the interaction.
   */
  readonly prepare: (entries: PackageEntries) => PackageEntries;
}

/**
 * The every-relation item.
 */
const item = "items/item.xml";

/**
 * The item that places the fragment, whose text entry binds `TEXT`.
 */
const templated = "items/item2.xml";

/**
 * The paragraph of the item before which the text entry with a string identifier is written.
 */
const quoted = "<p>It says <q>read this</q> and stops.</p>";

/**
 * The item's interactions and their binding attributes: a choice of an identifier, a slider of an
 * integer, a custom interaction of any type, a text entry's response and string identifiers, which
 * the base gains, and the fragment's text entry, bound under the item that places it.
 */
export const bindingSites: readonly BindingSite[] = [
  {
    attribute: "response-identifier",
    binding: item,
    bound: '<qti-choice-interaction response-identifier="RESPONSE"',
    declaration:
      '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    declared: item,
    identifier: "RESPONSE",
    kind: "qti-choice-interaction",
    prepare: (entries) => entries,
  },
  {
    attribute: "response-identifier",
    binding: item,
    bound: '<qti-slider-interaction response-identifier="LEVER"',
    declaration:
      '<qti-response-declaration identifier="LEVER" cardinality="single" base-type="integer">',
    declared: item,
    identifier: "LEVER",
    kind: "qti-slider-interaction",
    prepare: (entries) => entries,
  },
  {
    attribute: "response-identifier",
    binding: item,
    bound: '<qti-portable-custom-interaction response-identifier="PORTABLE"',
    declaration:
      '<qti-response-declaration identifier="PORTABLE" cardinality="single" base-type="string"/>',
    declared: item,
    identifier: "PORTABLE",
    kind: "qti-portable-custom-interaction",
    prepare: (entries) => entries,
  },
  {
    attribute: "string-identifier",
    binding: item,
    bound: '<qti-text-entry-interaction response-identifier="TYPED" string-identifier="SPELL"',
    declaration:
      '<qti-response-declaration identifier="SPELL" cardinality="single" base-type="string"/>',
    declared: item,
    identifier: "SPELL",
    kind: "qti-text-entry-interaction",
    prepare: (entries) =>
      editText(entries, item, (text) =>
        replaceOnce(
          replaceOnce(
            text,
            quoted,
            '<p>It says <qti-text-entry-interaction response-identifier="TYPED" string-identifier="SPELL"/> and stops.</p>',
          ),
          '<qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/>',
          '<qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/><qti-response-declaration identifier="TYPED" cardinality="single" base-type="string"/><qti-response-declaration identifier="SPELL" cardinality="single" base-type="string"/>',
        ),
      ),
  },
  {
    attribute: "response-identifier",
    binding: "items/fragment.xml",
    bound: '<qti-text-entry-interaction response-identifier="TEXT"',
    declaration:
      '<qti-response-declaration identifier="TEXT" cardinality="single" base-type="string"/>',
    declared: templated,
    identifier: "TEXT",
    kind: "qti-text-entry-interaction",
    prepare: (entries) => entries,
  },
];

/**
 * The cardinalities a declaration writes as a cardinality is spelled, the `Cardinality` roster's.
 */
export const spelled = ["single", "multiple", "ordered", "record"] as const;

/**
 * The state of the response a site binds: renamed to a name no declaration holds, to an outcome's,
 * or to a built-in variable's; or declared with its `cardinality` dropped, empty, spelling no
 * cardinality, padded, or one of {@link spelled}.
 */
export const bindingStates = [
  "undeclared",
  "outcome",
  "built-in",
  "absent",
  "empty",
  "unspelled",
  "padded",
  ...spelled,
] as const;

/**
 * One state of {@link bindingStates}.
 */
export type BindingState = (typeof bindingStates)[number];

/**
 * The name a renamed binding names: none a declaration holds, an outcome of the item (`SCORE`,
 * which each of the base's items declares) and a built-in variable of an item (`numAttempts`,
 * §2.2.2).
 */
export const renamed = {
  "built-in": "numAttempts",
  outcome: "SCORE",
  undeclared: "NOWHERE",
} as const;

/**
 * The `cardinality` a declared state writes, as written; none for `absent`.
 */
const written: Readonly<Partial<Record<BindingState, string>>> = {
  empty: "",
  multiple: "multiple",
  ordered: "ordered",
  padded: " single ",
  record: "record",
  single: "single",
  unspelled: "many",
};

/**
 * What a state makes of the binding, as the fit laws read it.
 */
export interface BindingExpectation {
  /**
   * The cardinality the bound declaration's `Declaration` row holds: the one it spells, else
   * `single` (the declarations overlay's `cardinalityOf`); none where no response declaration
   * holds the name.
   */
  readonly held: string | undefined;
  /**
   * Whether a response declaration of the item holds the bound name.
   */
  readonly declared: boolean;
  /**
   * The name the binding names.
   */
  readonly identifier: string;
  /**
   * Whether the fit laws judge the binding: declared, and its cardinality spelled.
   */
  readonly typed: boolean;
}

/**
 * Read what a state makes of a site's binding.
 *
 * @param site - The site.
 * @param state - The state.
 * @returns The expectation.
 */
export const expectationOf = (site: BindingSite, state: BindingState): BindingExpectation => {
  if (state === "undeclared" || state === "outcome" || state === "built-in") {
    return { declared: false, held: undefined, identifier: renamed[state], typed: false };
  }

  const lexical = written[state] ?? "";
  const typed = spelled.some((cardinality) => cardinality === lexical);

  return {
    declared: true,
    held: typed ? lexical : "single",
    identifier: site.identifier,
    typed,
  };
};

/**
 * Write a state into the every-relation package at a site.
 *
 * @param base - The every-relation package.
 * @param site - The site.
 * @param state - The state.
 * @returns The package.
 */
export const bindingCase = (
  base: PackageEntries,
  site: BindingSite,
  state: BindingState,
): PackageEntries => {
  const prepared = site.prepare(base);
  if (state === "undeclared" || state === "outcome" || state === "built-in") {
    return editText(prepared, site.binding, (text) =>
      replaceOnce(
        text,
        site.bound,
        site.bound.replace(
          `${site.attribute}="${site.identifier}"`,
          `${site.attribute}="${renamed[state]}"`,
        ),
      ),
    );
  }

  const lexical = written[state];
  const declaration = site.declaration.replace(
    ' cardinality="single"',
    lexical === undefined ? "" : ` cardinality="${lexical}"`,
  );

  return editText(prepared, site.declared, (text) =>
    replaceOnce(text, site.declaration, declaration),
  );
};
