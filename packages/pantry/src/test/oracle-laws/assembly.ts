/**
 * The assembled test as the law oracle's test producers read it (lane OL): which document an item
 * ref names, and the test's assembly over the section documents its refs and includes place
 * (reading 5).
 *
 * This skeleton fixes the contract `#pantry/test/oracle-laws/expressions.ts` reads; the test
 * producers fill it in.
 */
import { Option } from "effect";
import type { ListedRows, PackageRows, Row } from "#pantry/test/oracle-laws/rows.ts";

/**
 * Name the listed document an item ref's href names, when its root is an item: the href's path
 * resolved against the referring document's path, as the importer resolves a reference, matched
 * against the documents the manifest lists.
 *
 * @param _input - The package.
 * @param _referrer - The document that holds the item ref.
 * @param _itemRef - The item ref's node.
 * @returns The item document, none when the href names no listed document whose root is an item.
 */
export const itemRefDocument = (
  _input: PackageRows,
  _referrer: ListedRows,
  _itemRef: Row,
): Option.Option<ListedRows> => Option.none();
