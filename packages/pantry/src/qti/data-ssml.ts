/**
 * The `data-ssml` law (spec reading 177, over R7-a): a closed `data-ssml`, on an element whose kind
 * declares it, holds one JSON object that Data-SSML 1.0's JSON Schema admits, and the database
 * judges it, over the rows the importer reads the value into (`#pantry/vocab/data-ssml.ts`).
 *
 * - **The rows:** {@link DataSsml}, one per element whose `data-ssml` is one JSON object of objects
 *   of strings; {@link DataSsmlMember}, each member of the object as written, by its place; and
 *   {@link DataSsmlProperty}, each property of a member as written, by its member's place and its
 *   own. A name written twice is two rows (RFC 8259 §4: names "SHOULD be unique"), each judged.
 * - **"Data SSML"** (rule `attribute-lexical`, Data-SSML 1.0 §3.4, "NORMATIVE"): every closed
 *   `data-ssml` has its {@link DataSsml} row, so a value that is no JSON object of objects of
 *   strings has none and is refused; every member is one the schema lists (`break`, `phoneme`,
 *   `prosody`, `say-as`, `sub`); every property is one its member lists; an enumerated property's
 *   value is one of the schema's (`strength`, `alphabet`, `type`, `interpret-as`); a normalized
 *   one's (`time`, `rate`) holds no tab, line feed or carriage return, each a check over the
 *   schema's table (`dataSsmlMembers` of `#pantry/vocab/data-ssml.ts`); and a member holds each
 *   property the schema requires of it (`ph`, `interpret-as`, `alias`), a rule over a query
 *   (`RequiredSsmlProperty`, `#pantry/qti/queries.ts`).
 * - **"E1 derived":** each {@link DataSsml} row is a closed `data-ssml`'s, each member's element has
 *   its row, and each property's member is one of its element's.
 *
 * The importer writes every member and property it reads, and the database judges them. Which
 * rows a value has is the JSON's grammar, which grizzle cannot state as one pattern
 * (`docs/grizzle-findings.md`, the Data-SSML row), so the importer reads it once, before the
 * database, as it reads a document's XML. Every text a law compares is `keyText`, so a property
 * past the key-text bound is refused under that stated limit (reading 1).
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/datassml/ | IMS Data-SSML 1.0, 3.4 JSON Schema}
 */
import {
  check,
  Compute,
  contained,
  key,
  natural,
  on,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { Attribute } from "#pantry/qti/attributes.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { dataSsmlMembers } from "#pantry/vocab/data-ssml.ts";

/**
 * A text with no tab, line feed or carriage return: an `xs:normalizedString`'s value.
 */
const normalizedValue = Compute.pattern("^[^\\t\\n\\r]*$");

/**
 * An element whose closed `data-ssml` is one JSON object of objects of strings, keyed by the
 * element's node.
 */
export const DataSsml = relation("DataSsml", { node: uuid }, ["node"]);

/**
 * One member of a `data-ssml` object as written, keyed by its element's node and its place in the
 * object, from 0: its decoded name.
 */
export const DataSsmlMember = relation(
  "DataSsmlMember",
  { at: natural, member: keyText, node: uuid },
  ["node", "at"],
);

/**
 * One property of a member as written, keyed by its element's node, its member's place and its own
 * place in the member, from 0: its member's name (`memberName`, its {@link DataSsmlMember}'s), its
 * decoded name and its decoded value.
 */
export const DataSsmlProperty = relation(
  "DataSsmlProperty",
  {
    at: natural,
    member: natural,
    memberName: keyText,
    name: keyText,
    node: uuid,
    value: keyText,
  },
  ["node", "member", "at"],
);

/**
 * The relations of `data-ssml.ts`, each under its own name, as `#pantry/qti/base.ts` composes them.
 */
export const dataSsmlRelations = { DataSsml, DataSsmlMember, DataSsmlProperty };

/**
 * Every closed `data-ssml` attribute, by its element's node: an element holds one.
 */
const dataSsmlAttributes = select(Attribute, (a) => a.eq(a.name, "data-ssml"));

/**
 * The (member, property) pairs of one kind of property domain, from the schema's table.
 *
 * @param kind - The domain's kind.
 * @returns The pairs.
 */
const pairsOf = (kind: "enumeration" | "normalized") =>
  [...dataSsmlMembers].flatMap(([member, properties]) =>
    properties.flatMap(({ domain, name }) => (domain.kind === kind ? [{ member, name }] : [])),
  );

/**
 * Every member Data-SSML 1.0 lists.
 */
const memberNames = [...dataSsmlMembers.keys()];

/**
 * Every (member, property) pair the schema lists.
 */
const listedProperties = [...dataSsmlMembers].flatMap(([member, properties]) =>
  properties.map(({ name }) => ({ member, name })),
);

/**
 * Every enumerated property, with the values the schema admits for it.
 */
const enumeratedProperties = [...dataSsmlMembers].flatMap(([member, properties]) =>
  properties.flatMap(({ domain, name }) =>
    domain.kind === "enumeration" ? [{ member, name, values: domain.values }] : [],
  ),
);

/**
 * The `data-ssml` module's statements, grouped by the law each states, each check named by its law
 * with spaces written as underscores.
 */
export const dataSsmlLawsByName = {
  "Data SSML": [
    contained(on(dataSsmlAttributes, "node"), on(DataSsml, "node")),
    check("Data_SSML", DataSsmlMember, (m) => m.in(m.member, memberNames)),
    check("Data_SSML", DataSsmlProperty, (p) =>
      p.and(
        p.or(
          ...listedProperties.map(({ member, name }) =>
            p.and(p.eq(p.memberName, member), p.eq(p.name, name)),
          ),
        ),
        ...enumeratedProperties.map(({ member, name, values }) =>
          p.or(p.ne(p.memberName, member), p.ne(p.name, name), p.in(p.value, values)),
        ),
        ...pairsOf("normalized").map(({ member, name }) =>
          p.or(
            p.ne(p.memberName, member),
            p.ne(p.name, name),
            Compute.matches(p.value, normalizedValue),
          ),
        ),
      ),
    ),
  ],
  "E1 derived": [
    key(on(dataSsmlAttributes, "node")),
    contained(on(DataSsml, "node"), on(dataSsmlAttributes, "node")),
    contained(on(DataSsmlMember, "node"), on(DataSsml, "node")),
    contained(
      on(DataSsmlProperty, "node", "member", "memberName"),
      on(DataSsmlMember, "node", "at", "member"),
    ),
  ],
} as const;

/**
 * {@link dataSsmlLawsByName}'s statements in one list.
 */
export const dataSsmlLaws = Object.values(dataSsmlLawsByName).flat();
