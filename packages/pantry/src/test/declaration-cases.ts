/**
 * Declarations whose cardinality or base type spells nothing, as packages (lane NIL's audit, B11;
 * spec reading 158): every declaration of the every-relation items and test, each with its
 * `cardinality` or `base-type` dropped, emptied or written as no value spells. A declaration whose
 * `identifier` is dropped or names nothing keeps its row and everything below it, and has no name
 * alone (spec reading 157), which `src/import/overlays/unnamed-declarations.oracle.test.ts` holds.
 *
 * Such a declaration keeps its row and every row below it, and has no `DeclarationCardinality` or
 * `DeclarationBaseType` alone; one with no cardinality has no `DeclarationName`, and a binding or a
 * reference still resolves to it by name, reading no cardinality of it (spec reading 159;
 * `#pantry/import/overlays/declarations.ts` `typedDeclarationOf`): its own law, AL3's required
 * attribute or the attribute's value domain, refuses it. `src/test/declaration-rows.oracle.test.ts`
 * holds the oracle and the rows to that, and `src/import/declaration-rows.db.test.ts` the
 * database.
 */
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { textOf, withText } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation package the cases edit: its widest member counts, which write every
 * declaration site a reference, a binding or a table can name.
 */
export const declarationBase: PackageEntries = everyRelationPackage({
  choices: 3,
  hotspots: 2,
  hottexts: 2,
});

/**
 * The documents of the base that declare variables.
 */
const declaringPaths = [
  "items/item.xml",
  "items/item2.xml",
  "items/item3.xml",
  "test.xml",
] as const;

/**
 * The declaration element kinds.
 */
const declarationKinds = [
  "qti-context-declaration",
  "qti-response-declaration",
  "qti-outcome-declaration",
  "qti-template-declaration",
] as const;

/**
 * A declaration element kind.
 */
export type DeclarationKind = (typeof declarationKinds)[number];

/**
 * One declaration of the base: its document, its start tag as written, its kind, its place among
 * its document's declarations of its kind, and its attributes' lexical forms.
 */
export interface DeclarationSite {
  readonly attributes: ReadonlyMap<string, string>;
  readonly identifier: string;
  readonly kind: DeclarationKind;
  readonly ordinal: number;
  readonly path: string;
  readonly tag: string;
}

/**
 * Read a start tag's attributes, each written once with double quotes, as the base writes them.
 *
 * @param tag - The tag.
 * @returns Its attributes' lexical forms, by name.
 */
const attributesOf = (tag: string): ReadonlyMap<string, string> =>
  new Map(
    [...tag.matchAll(/ (?<name>[a-z:-]+)="(?<value>[^"]*)"/gu)].map(
      ({ groups }) => [groups?.["name"] ?? "", groups?.["value"] ?? ""] as const,
    ),
  );

/**
 * Every declaration of the base, in document order within each document.
 */
export const declarationSites: readonly DeclarationSite[] = declaringPaths.flatMap((path) => {
  const seen = new Map<string, number>();

  return [
    ...textOf(declarationBase, path).matchAll(
      /<(?<kind>qti-(?:context|response|outcome|template)-declaration)\b[^>]*>/gu,
    ),
  ].flatMap((match) => {
    const kind = declarationKinds.find((declared) => declared === match.groups?.["kind"]);
    if (kind === undefined) {
      return [];
    }

    const ordinal = seen.get(kind) ?? 0;

    seen.set(kind, ordinal + 1);

    const attributes = attributesOf(match[0]);

    return [
      {
        attributes,
        identifier: attributes.get("identifier") ?? "",
        kind,
        ordinal,
        path,
        tag: match[0],
      },
    ];
  });
});

/**
 * One state that leaves a declaration's cardinality or base type spelling nothing: its name, the
 * attribute it edits, the value it writes there from the one written (none to drop it), and the
 * rule the oracle names it by. `alone` says the oracle names that rule and no other: so where only
 * the cardinality changes, every reference still resolves and types nothing, and where only the
 * base type does, no law reads a type it does not spell.
 */
export interface DeclarationState {
  readonly alone: boolean;
  readonly applies: (site: DeclarationSite) => boolean;
  readonly attribute: "base-type" | "cardinality";
  readonly name: string;
  readonly rule: "attribute-lexical" | "required-attribute";
  readonly value?: (written: string) => string;
}

/**
 * Every state that leaves a declaration's cardinality or base type spelling nothing.
 */
export const declarationStates: readonly DeclarationState[] = [
  {
    alone: true,
    applies: () => true,
    attribute: "cardinality",
    name: "cardinality dropped",
    rule: "required-attribute",
  },
  {
    alone: true,
    applies: () => true,
    attribute: "cardinality",
    name: "cardinality empty",
    rule: "attribute-lexical",
    value: () => "",
  },
  {
    alone: true,
    applies: () => true,
    attribute: "cardinality",
    name: "cardinality spelling nothing",
    rule: "attribute-lexical",
    value: () => "many",
  },
  {
    alone: true,
    applies: () => true,
    attribute: "cardinality",
    name: "cardinality padded",
    rule: "attribute-lexical",
    value: (written) => ` ${written} `,
  },
  {
    alone: true,
    applies: () => true,
    attribute: "cardinality",
    name: "cardinality with a trailing space",
    rule: "attribute-lexical",
    value: (written) => `${written} `,
  },
  {
    alone: true,
    applies: () => true,
    attribute: "cardinality",
    name: "cardinality multiple with a trailing space",
    rule: "attribute-lexical",
    value: () => "multiple ",
  },
  {
    alone: true,
    applies: (site) => site.attributes.has("base-type"),
    attribute: "base-type",
    name: "base type spelling nothing",
    rule: "attribute-lexical",
    value: () => "bogus",
  },
  {
    alone: true,
    applies: (site) => site.attributes.has("base-type"),
    attribute: "base-type",
    name: "base type padded",
    rule: "attribute-lexical",
    value: (written) => ` ${written} `,
  },
  {
    alone: true,
    applies: (site) => site.attributes.has("base-type"),
    attribute: "base-type",
    name: "base type with a leading space",
    rule: "attribute-lexical",
    value: (written) => ` ${written}`,
  },
];

/**
 * The rules the oracle must name a case by: the state's own.
 *
 * @param state - The state.
 * @returns The rules.
 */
export const expectedRulesOf = (state: DeclarationState): readonly string[] => [state.rule];

/**
 * Write a state into the base at a declaration.
 *
 * @param site - The declaration.
 * @param state - The state.
 * @returns The package.
 */
export const declarationCase = (site: DeclarationSite, state: DeclarationState): PackageEntries => {
  const written = site.attributes.get(state.attribute) ?? "";
  const pattern = new RegExp(` ${state.attribute}="[^"]*"`, "u");
  const edited =
    state.value === undefined
      ? site.tag.replace(pattern, "")
      : site.tag.replace(pattern, ` ${state.attribute}="${state.value(written)}"`);

  return withText(
    declarationBase,
    site.path,
    textOf(declarationBase, site.path).replace(site.tag, edited),
  );
};
