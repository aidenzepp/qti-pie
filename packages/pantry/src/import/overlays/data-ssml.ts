/**
 * The `data-ssml` overlay's rows (spec reading 177, `#pantry/qti/data-ssml.ts`): from one
 * document's view (`DocumentView` of `#pantry/import/fold.ts`), each closed `data-ssml` read into
 * its members and their properties as written (`dataSsmlOf` of `#pantry/vocab/data-ssml.ts`).
 *
 * The rows restate what the value says and nothing else, and judge none of it: an unknown member,
 * an unknown property, a value outside its enumeration, a normalized value with a tab and a missing
 * required property are all written as they are, and the database refuses them under "Data SSML". A
 * value that is no JSON object of objects of strings has no rows, and "Data SSML" refuses its
 * attribute for having none.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { DocumentView } from "#pantry/import/fold.ts";
import type { DataSsml, DataSsmlMember, DataSsmlProperty } from "#pantry/qti/data-ssml.ts";
import { dataSsmlOf } from "#pantry/vocab/data-ssml.ts";

/**
 * A document's `data-ssml` rows, one keyed set per relation: each map from the text of a row's key
 * to the row as its writer writes it.
 */
export interface DataSsmlRows {
  readonly DataSsml: ReadonlyMap<string, Addition<typeof DataSsml>>;
  readonly DataSsmlMember: ReadonlyMap<string, Addition<typeof DataSsmlMember>>;
  readonly DataSsmlProperty: ReadonlyMap<string, Addition<typeof DataSsmlProperty>>;
}

/**
 * The text of a row's key: its key's fields, in order.
 *
 * @param values - The key's fields.
 * @returns The text.
 */
const keyOf = (values: readonly string[]): string => JSON.stringify(values);

/**
 * Build the `data-ssml` overlay's rows of one document: for each closed `data-ssml` that reads as
 * one JSON object of objects of strings, its element's row, a row per member and a row per
 * property, each by its place as written.
 *
 * @param view - The document's view: its rows under the ids they are written under.
 * @returns Its rows.
 */
export const rowsOf = (view: DocumentView): DataSsmlRows => {
  const elements = new Map<string, Addition<typeof DataSsml>>();
  const members = new Map<string, Addition<typeof DataSsmlMember>>();
  const properties = new Map<string, Addition<typeof DataSsmlProperty>>();

  for (const { lexical, name, node } of view.rows.attributes) {
    if (name !== "data-ssml") {
      continue;
    }

    for (const read of Option.toArray(dataSsmlOf(lexical))) {
      elements.set(node, { node });
      for (const [memberAt, member] of read.entries()) {
        const at = BigInt(memberAt);
        members.set(keyOf([node, String(at)]), { at, member: member.name, node });
        for (const [propertyAt, property] of member.properties.entries()) {
          properties.set(keyOf([node, String(at), String(propertyAt)]), {
            at: BigInt(propertyAt),
            member: at,
            memberName: member.name,
            name: property.name,
            node,
            value: property.value,
          });
        }
      }
    }
  }

  return { DataSsml: elements, DataSsmlMember: members, DataSsmlProperty: properties };
};
