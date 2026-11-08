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
import type { OverlayRows } from "#pantry/import/overlays/index.ts";
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
 * Order relation names by their code points, the order the merge reports its first conflict in.
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
 * Every overlay's relation name, in code point order: each written relation but the two roots and
 * the document layer's.
 */
// SAFETY: `readProgram` (`#pantry/import/program.ts`) builds `PackageInputs`, keyed by every written
// name, from `OverlayRows`, `DocumentLayerRows`, `Node` and `Package`, so the written names less
// those of the roots and the document layer are keys of `OverlayRows`; `roster.test.ts` holds them
// to exactly the keys `overlayPartsOf` gives. The filter tests membership of `documentLayer` at run
// time, which no type narrows by, and grizzle's names know nothing of the overlays.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
export const overlayNames = writtenNames.filter(
  (name) => name !== "Node" && name !== "Package" && !Object.hasOwn(documentLayer, name),
) as readonly (keyof OverlayRows)[];
