/**
 * The relations one package's import writes, read from the composed schema (`#pantry/qti/schema.ts`
 * `Qti`) rather than listed: the writer inserts each, the merge unions each, and a relation a
 * module adds to the schema joins both with no edit here.
 *
 * A relation is written directly unless it is the member of an ordered family: those members
 * (`Attribute`, `Namespace`, `Entry` and the like) are written nested at their owner's count field,
 * and grizzle refuses a direct insert of one. Every other stored relation of `Qti` is one keyed set
 * of a package's inputs (`PackageInputs` of `#pantry/import/write.ts`): the two roots, `Node` and
 * `Package`, each with its tree or record nested; the document layer's relations, which
 * `documentRowsOf` writes; and every overlay's.
 *
 * `roster.test.ts` holds each list to the inputs a real import gives, so a name derived here and
 * the keys of `PackageInputs` and `OverlayRows` are one set.
 */
import { writableNamesOf } from "@bjornpagen/grizzle";
import { Option, Schema } from "effect";
import type { OverlayRows } from "#pantry/import/overlays/index.ts";
import type { DocumentLayerRows, PackageInputs } from "#pantry/import/write.ts";
import {
  Comment,
  Doctype,
  Document,
  EncodingDecl,
  OpenElementName,
  Pi,
  SdDecl,
  XmlDecl,
} from "#pantry/qti/chardata.ts";
import { qti } from "#pantry/qti/schema.ts";

/**
 * The document layer's relations, which `documentRowsOf` of `#pantry/import/write.ts` writes for
 * each document: its `Document` row, its XML declaration's rows where it writes one, its comments',
 * instructions' and doctypes' rows, and its foreign elements' expanded names. `DocumentLayerRows`
 * is read from this record.
 */
export const documentLayer = {
  Comment,
  Doctype,
  Document,
  EncodingDecl,
  OpenElementName,
  Pi,
  SdDecl,
  XmlDecl,
};

/**
 * The relation an ordered family's members belong to, as a statement value names it: the family's
 * side, over the relation or a selection of it.
 */
const OrderedFamily = Schema.Struct({
  family: Schema.Struct({
    source: Schema.Union([
      Schema.Struct({ name: Schema.String }),
      Schema.Struct({ relation: Schema.Struct({ name: Schema.String }) }),
    ]),
  }),
  kind: Schema.Literal("ordered"),
});

/**
 * Every ordered family's member relation: written nested at its owner's count field, never inserted
 * on its own.
 */
const nestedMembers: ReadonlySet<string> = new Set(
  qti().statements.flatMap((statement) =>
    Option.match(Schema.decodeUnknownOption(OrderedFamily)(statement), {
      onNone: () => [],
      onSome: ({ family: { source } }) => [
        "relation" in source ? source.relation.name : source.name,
      ],
    }),
  ),
);

/**
 * Order relation names by their code points, the order the merge reports its first conflict in.
 *
 * @param names - The names.
 * @returns The names, sorted.
 */
const sorted = <N extends string>(names: readonly N[]): readonly N[] =>
  names.toSorted((x, y) => (x < y ? -1 : Number(x > y)));

/**
 * Every relation an import writes directly, in code point order: each stored relation of `Qti`,
 * grizzle's `writableNamesOf(Qti)`, that no ordered family nests.
 */
// SAFETY: the stored relations of `Qti` less the ordered families' members are the keys of
// `PackageInputs`, which the builders' row types state by hand; `roster.test.ts` holds the two to
// one set over a real import.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
export const writtenNames = sorted(
  writableNamesOf(qti()).filter((name) => !nestedMembers.has(name)),
) as readonly (keyof PackageInputs)[];

/**
 * The document layer's relation names, in code point order.
 */
// SAFETY: the names are the keys of `documentLayer`, which `DocumentLayerRows` maps.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
export const documentLayerNames = sorted(
  Object.keys(documentLayer),
) as readonly (keyof DocumentLayerRows)[];

/**
 * Every overlay's relation name, in code point order: each written relation but the two roots and
 * the document layer's.
 */
// SAFETY: `PackageInputs` is `DocumentLayerRows & OverlayRows` with `Node` and `Package`, so the
// written names less those are the keys of `OverlayRows`; `roster.test.ts` holds them to the keys
// `overlayRowsOf` gives.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
export const overlayNames = writtenNames.filter(
  (name) => name !== "Node" && name !== "Package" && !Object.hasOwn(documentLayer, name),
) as readonly (keyof OverlayRows)[];
