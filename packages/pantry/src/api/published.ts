/**
 * The published relations: the short list of pantry's relations an app references natively from
 * its own level (its rows contain into their keys) and reads through its own role, with each one's
 * key and published fields, and their row types.
 *
 * These relations, their keys and their published fields are a contract: each changes only on
 * purpose, and every change is named in pantry's `CHANGELOG.md`. Every other field of these
 * relations, and every other relation of the `Qti` schema, is internal and changes freely with
 * pantry; an app reads none of it. A published field that is a closed id carries its roster's
 * handle names, so {@link BaseType}, the roster an app's `closedId(BaseType)` columns name, is
 * published with its handles and no fields.
 *
 * Publishing changes no schema: every relation here is the `Qti` schema's own, re-exported from
 * the module that declares it.
 */
import type { AnyRelation, AnyRoster, Fact } from "@bjornpagen/grizzle";
import { BaseType } from "#pantry/grammar/install.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { DeclarationIdentifier } from "#pantry/qti/declarations.ts";
import { Package } from "#pantry/qti/package.ts";
import {
  ItemRefDocument,
  Named,
  Section,
  SectionMember,
  SectionSelection,
  TestDocument,
} from "#pantry/qti/tests.ts";

export { BaseType } from "#pantry/grammar/install.ts";

export { Document } from "#pantry/qti/chardata.ts";

export { DeclarationIdentifier } from "#pantry/qti/declarations.ts";

export { Package } from "#pantry/qti/package.ts";

export {
  ItemRefDocument,
  Named,
  Section,
  SectionMember,
  SectionSelection,
  TestDocument,
} from "#pantry/qti/tests.ts";

/**
 * A published relation: the relation value, its key as published, which is its declared primary
 * key, and its published fields, each a field of its declaration.
 */
export interface PublishedRelation<
  R extends AnyRelation,
  Key extends readonly string[],
  Fields extends readonly string[],
> {
  readonly kind: "relation";
  readonly relation: R;
  readonly key: Key;
  readonly fields: Fields;
}

/**
 * A published roster: the roster value, whose handles are its contract, with no fields.
 */
export interface PublishedRoster<R extends AnyRoster> {
  readonly kind: "roster";
  readonly relation: R;
}

/**
 * State a relation published with its key and published fields, which the types hold to the
 * relation's own declaration, so a field renamed or dropped there fails to compile here.
 *
 * @param relation The relation, as its module declares it.
 * @param key Its primary key, as its declaration lists it.
 * @param fields Its published fields, its key's among them.
 * @returns The published relation.
 */
const published = <
  R extends AnyRelation & { readonly fields: object },
  const Key extends R["primaryKey"],
  const Fields extends readonly (keyof R["fields"] & string)[],
>(
  relation: R,
  key: Key,
  fields: Fields,
): PublishedRelation<R, Key, Fields> => ({ fields, key, kind: "relation", relation });

/**
 * The published relations by name (spec section 2.2): each relation's key and published fields,
 * and {@link BaseType} as a roster. The surface test pins this record, and its fields are the
 * contract {@link PublishedRow} types.
 */
export const publishedRelations = {
  BaseType: { kind: "roster", relation: BaseType } satisfies PublishedRoster<typeof BaseType>,
  DeclarationIdentifier: published(
    DeclarationIdentifier,
    ["node"],
    ["node", "document", "identifier", "declarationKind"],
  ),
  Document: published(Document, ["node"], ["node", "package", "path", "resourceType", "rootKind"]),
  ItemRefDocument: published(ItemRefDocument, ["node"], ["node", "document", "package", "path"]),
  Named: published(Named, ["node"], ["node", "document", "identifier", "kind", "parent", "part"]),
  Package: published(Package, ["id"], ["id", "name"]),
  Section: published(
    Section,
    ["node"],
    [
      "node",
      "document",
      "parent",
      "visible",
      "keepTogether",
      "shuffle",
      "withReplacement",
      "members",
      "required",
    ],
  ),
  SectionMember: published(
    SectionMember,
    ["node"],
    ["node", "section", "document", "kind", "required", "start"],
  ),
  SectionSelection: published(
    SectionSelection,
    ["node"],
    ["node", "document", "parent", "select", "withReplacement"],
  ),
  TestDocument: published(TestDocument, ["node"], ["node", "package", "path", "rootKind"]),
} as const;

/**
 * The name of a published relation.
 */
export type PublishedName = keyof typeof publishedRelations;

/**
 * A published relation's row: grizzle's fact of the relation narrowed to its published fields, and
 * a roster's fact, its handle under `id`.
 */
export type PublishedRow<Name extends PublishedName> =
  (typeof publishedRelations)[Name] extends PublishedRelation<
    infer R,
    readonly string[],
    infer Fields
  >
    ? Pick<Fact<R>, Fields[number] & keyof Fact<R>>
    : (typeof publishedRelations)[Name] extends PublishedRoster<infer R>
      ? Fact<R>
      : never;
