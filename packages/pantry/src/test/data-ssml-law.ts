/**
 * The law "Data SSML" (`#pantry/qti/data-ssml.ts`, spec reading 177) restated on the host over the
 * rows the importer reads a value into (`dataSsmlOf` of `#pantry/vocab/data-ssml.ts`), so a free
 * test can hold the rows and the law against an independent reader of Data-SSML 1.0 without the
 * database: a value with no rows breaks it, and so does a member or a property the schema does not
 * list, an enumerated value outside its list, a normalized value with a tab, a line feed or a
 * carriage return, and a member without a property it requires.
 */
import { Option } from "effect";
import { dataSsmlMembers, dataSsmlOf } from "#pantry/vocab/data-ssml.ts";
import type { SsmlMemberText } from "#pantry/vocab/data-ssml.ts";

/**
 * Whether one member, as written, keeps the law.
 *
 * @param member - The member.
 * @returns Whether the schema lists it, each of its properties, each value in its domain, and each
 *   property it requires written.
 */
const memberHolds = (member: SsmlMemberText): boolean => {
  const listed = dataSsmlMembers.get(member.name);
  if (listed === undefined) {
    return false;
  }

  const written = new Set(member.properties.map(({ name }) => name));

  return (
    listed.every(({ name, required }) => !required || written.has(name)) &&
    member.properties.every(({ name, value }) => {
      const property = listed.find((candidate) => candidate.name === name);
      if (property === undefined) {
        return false;
      }

      switch (property.domain.kind) {
        case "enumeration": {
          return property.domain.values.includes(value);
        }
        case "normalized": {
          return !/[\t\n\r]/u.test(value);
        }
        case "string": {
          return true;
        }
        default: {
          return property.domain satisfies never;
        }
      }
    })
  );
};

/**
 * Whether a closed `data-ssml` value breaks "Data SSML", as the database judges its rows.
 *
 * @param text - The attribute's lexical form.
 * @returns Whether it breaks the law.
 */
export const breaksDataSsml = (text: string): boolean =>
  Option.match(dataSsmlOf(text), {
    onNone: () => true,
    onSome: (members) => !members.every(memberHolds),
  });
