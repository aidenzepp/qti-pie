/**
 * The names a document is written under (`unshred`'s `XdmNames`): each element kind's expanded
 * name and each closed attribute handle's spelling.
 *
 * They are read off the vocabulary rosters alone, as the composition's `ElementName` is
 * (`elementsOf` of `#pantry/grammar/kinds.ts`), so a reader that only writes documents, the
 * export's render among them, composes no grammar and loads no schema.
 */
import { Array as Arr, Option } from "effect";
import { elementsOf } from "#pantry/grammar/kinds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { XdmNames } from "#pantry/model/unshred.ts";
import { handlePrefixes } from "#pantry/model/xdm.ts";
import type { ExpandedName } from "#pantry/model/xdm.ts";
import { vocabularies as rosters } from "#pantry/vocab/inventory/vocabularies.ts";
import { namespaceNameOf } from "#pantry/vocab/namespaces.ts";

/**
 * Name the attribute a closed handle spells: a handle that begins with a prefix of
 * {@link handlePrefixes} names an attribute in that prefix's namespace, and any other handle one
 * in no namespace. The prefix it is written with is the tree's own (`XdmClosedName.prefix`).
 *
 * @param handle - The handle.
 * @returns The local name and namespace name it is written and read with.
 */
export const attributeNameOf = (handle: string): ExpandedName =>
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
 * Each element kind's expanded name, read off the vocabulary rosters, each roster's namespace as
 * the composition reads it (`namespaceNameOf`).
 */
const elements: ReadonlyMap<string, ExpandedName> = new Map(
  elementsOf(
    rosters.map(({ kinds, namespace }) => ({ kinds, namespace: namespaceNameOf(namespace) })),
  ).map(({ handle, row }) => [handle, row]),
);

/**
 * The names every document is written under. Naming a kind no roster gives a local name is a
 * defect of its caller: the element kinds are exactly the rosters' named kinds, `ElementName`'s key
 * set.
 */
export const names: XdmNames<Composed> = {
  attribute: attributeNameOf,
  element: (kind) =>
    Option.getOrThrowWith(
      Option.fromNullishOr(elements.get(kind)),
      () => new Error(`No vocabulary roster names the element kind ${kind}.`),
    ),
};
