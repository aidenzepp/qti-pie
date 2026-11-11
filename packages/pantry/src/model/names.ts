/**
 * The names a document is written under (`unshred`'s `XdmNames`): each element kind's expanded
 * name and each closed attribute handle's spelling.
 *
 * Both are read off the handle alone, which spells the name it stands for, so a reader that only
 * writes documents, the export's render among them, loads no vocabulary roster, composes no
 * grammar and builds no table when it loads.
 */
import { Array as Arr, Option } from "effect";
import type { Composed } from "#pantry/model/composed.ts";
import type { XdmNames } from "#pantry/model/unshred.ts";
import { handlePrefixes } from "#pantry/model/xdm.ts";
import type { ExpandedName } from "#pantry/model/xdm.ts";
import { vocabularyNamespaces } from "#pantry/vocab/namespaces.ts";

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
 * Name the elements of a kind off its handle, as the vocabularies spell it
 * (`#pantry/vocab/namespaces.ts`): up to its colon, the handle prefix of the vocabulary the kind is
 * in, which names that vocabulary's namespace (`vocabularyNamespaces`), and the ASI vocabulary's
 * handles have none; after it, the element's local name, up to the dot that a kind of an element
 * declared with several types puts before its type (`#pantry/vocab/derive/naming.ts`). A local
 * name holds no colon, an NCName's, and no vocabulary's holds a dot, so the handle splits one way;
 * `#pantry/model/names.test.ts` holds every roster kind to the name its roster gives it, the
 * composition's `ElementName` row.
 *
 * @param kind - The element kind's handle.
 * @returns The local name and namespace name of every element of the kind. A prefix no vocabulary
 *   carries is a defect of the caller, since every element kind is a roster's.
 */
export const elementNameOf = (kind: string): ExpandedName => {
  const colon = kind.indexOf(":");
  const prefix = kind.slice(0, colon + 1);
  const named = kind.slice(colon + 1);
  const dot = named.indexOf(".");

  return {
    local: dot === -1 ? named : named.slice(0, dot),
    namespace: Option.getOrThrowWith(
      Arr.findFirst(Object.values(vocabularyNamespaces), (held) => held.prefix === prefix),
      () => new Error(`No vocabulary carries the handle prefix of the element kind ${kind}.`),
    ).namespace,
  };
};

/**
 * The names every document is written under.
 */
export const names: XdmNames<Composed> = {
  attribute: attributeNameOf,
  element: elementNameOf,
};
