/**
 * The relations one package's import writes, read from the composed schema (`#pantry/qti/schema.ts`
 * `Qti`) rather than listed: the writer inserts each, the merge unions each, and a relation a
 * module adds to the schema joins both with no edit here.
 *
 * They are grizzle's `insertableNamesOf(Qti)`, the relations `insertAll` takes at its top level:
 * every stored relation of `Qti` but an ordered family's member (`Attribute`, `Namespace`, `Entry`
 * and the like), which is written nested at its owner's count field. Each is one keyed set of a
 * package's inputs (`PackageInputs` of `#pantry/import/write.ts`, keyed by grizzle's
 * `InsertAllRowsOf`): the two roots, `Node` and `Package`, each with its tree or record nested; the
 * document layer's relations, which `documentRowsOf` writes; and every overlay's.
 *
 * `roster.test.ts` holds each list to the inputs a real import gives, so the names here and the
 * relations the builders and the writer write are one set.
 */
import { insertableNamesOf } from "@bjornpagen/grizzle";
import { Struct } from "effect";
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
import { Qti } from "#pantry/qti/schema.ts";

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
 * Order relation names by their code points, the order each list here is kept in, so
 * `roster.test.ts` compares each as one set with the relations a real import writes.
 *
 * @param names - The names.
 * @returns The names, sorted.
 */
const sorted = <N extends string>(names: readonly N[]): readonly N[] =>
  names.toSorted((x, y) => (x < y ? -1 : Number(x > y)));

/**
 * Every relation an import writes directly, in code point order: grizzle's
 * `insertableNamesOf(Qti)`, each stored relation of `Qti` that no ordered family nests, the keys of
 * `PackageInputs`.
 */
export const writtenNames = sorted(insertableNamesOf(Qti));

/**
 * The document layer's relation names, the keys of `documentLayer` and so of `DocumentLayerRows`,
 * in code point order.
 */
export const documentLayerNames = sorted(Struct.keys(documentLayer));

/**
 * Every relation an import writes directly, by its name: `Qti`'s own record of its relations, at
 * `writtenNames`. A const of its own: given to `Struct.omit` as a nested call, `Struct.pick`'s
 * result is inferred with no keys, and the names omitted from it are refused.
 */
export const writtenRelations = Struct.pick(Qti.relations, writtenNames);

/**
 * Every overlay's relation, by its name: each written relation but the two roots, `Node` and
 * `Package`, and the document layer's. A record read from the schema's own, so a relation a module
 * adds joins it with no edit here; `overlayRowsOf` (`#pantry/import/overlays/index.ts`) unions
 * `OverlayRows` over it, which the type checker holds to name every relation of `OverlayRows`.
 */
export const overlayRelations = Struct.omit(writtenRelations, [
  "Node",
  "Package",
  ...documentLayerNames,
]);

/**
 * Every overlay's relation name, the keys of `overlayRelations`, in code point order.
 * `roster.test.ts` holds them to exactly the relations the overlay builders write.
 */
export const overlayNames = sorted(Struct.keys(overlayRelations));
