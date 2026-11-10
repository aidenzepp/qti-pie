/**
 * The single-CDN level's data rule, `CdnData`: no address uses the `data:` scheme, so no value
 * carries a payload. It reads three sets of values, each a relation the level derives from `Qti`
 * and a check named `CdnData` over it:
 *
 * - `CdnDataUriAttribute`: every attribute whose domain under its element's governor is an
 *   `xs:anyURI`'s, links and identifiers included, judged whole by {@link dataScheme}. An attribute
 *   its governor does not admit has no domain, so it is none of these: AL1 refuses it in `Qti`.
 * - `CdnDataAddressList`: every attribute of an address list (`addressLists` of
 *   `#pantry/vocab/fetched.ts`, `xsi:schemaLocation`), judged token by token by {@link dataToken}.
 * - `CdnDataUriText`: every element whose governor reads its text in an `xs:anyURI`'s domain
 *   (`TextDomain`), judged by its string value, by {@link dataScheme}.
 *
 * A value that keeps an entity reference anywhere is refused too (decision 488): crust keeps one
 * only where its declaration may sit in the external subset, which it never reads, while a player
 * that reads the subset expands it, so the kept form may hide a `data:` address the patterns never
 * see. An attribute's relation carries its count of kept references (`Attribute.entities`), and its
 * check refuses any row with one. A string value cannot tell a kept reference from text that reads
 * `&name;`, so `CdnDataUriTextEntity` selects each `entityRef` child of such an element, with a
 * `CdnData` check that no row of it meets.
 *
 * A `srcset`'s candidates and a media URL are fetched fields, typed `URLDType` rather than
 * `xs:anyURI`, which `CdnOrigin` holds to the origin (`#pantry/levels/cdn-origin.ts`).
 *
 * The rule is stated at the `Cdn` level (`singleCdn`, `#pantry/levels/cdn.ts`) as derived
 * relations over `Qti` and checks over them, never as a law of `Qti` itself: a check on `Attribute`
 * or `Node` at a level above `Qti` is `LevelRefused`, and a check over a derived relation is a
 * deferred trigger on the tables its query reads (GOAL L3, G4).
 *
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser}
 */
import { check, Compute, derived, query, v } from "@bjornpagen/grizzle";
import {
  AttributeGrammar,
  AttributeModelOf,
  AttributeSlotOf,
  GoverningOf,
  TextDomain,
  ValueDomainOf,
} from "#pantry/grammar/install.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";
import type { QtiSchema } from "#pantry/qti/schema.ts";
import { addressLists } from "#pantry/vocab/fetched.ts";

/**
 * The characters the URL Standard strips before a URL, the C0 controls and the space, as the body
 * of a character class. NUL is left out: no XML document holds it, and grizzle admits no pattern
 * that does.
 *
 * @see {@link https://url.spec.whatwg.org/#c0-control | URL Standard, C0 control}
 */
const leadingStripped = String.raw`\u{1}-\u{20}`;

/**
 * The ASCII tab and newline the URL Standard removes from anywhere in a URL, as the body of a
 * character class.
 *
 * @see {@link https://url.spec.whatwg.org/#ascii-tab-or-newline | URL Standard, ASCII tab or newline}
 */
const tabOrNewline = String.raw`\t\n\r`;

/**
 * An address that uses the `data:` scheme, as the URL Standard reads a scheme: past the leading C0
 * controls and spaces it strips, the letters `data` in any case, any tab or newline among them
 * removed, and the colon that ends a scheme.
 *
 * @see {@link https://url.spec.whatwg.org/#scheme-state | URL Standard, scheme state}
 */
export const dataScheme = `^[${leadingStripped}]*[dD][${tabOrNewline}]*[aA][${tabOrNewline}]*[tT][${tabOrNewline}]*[aA][${tabOrNewline}]*:`;

/**
 * A token of an address list that uses the `data:` scheme: at the list's start or after the
 * whitespace that separates its tokens, which a token never holds.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#atomic-vs-list | XML Schema 1.0 Part 2, §2.5.1.2 List datatypes}
 */
export const dataToken = `(?:^|[${tabOrNewline} ])[${leadingStripped}]*[dD][aA][tT][aA]:`;

/**
 * {@link dataScheme} as a `Compute.matches` pattern.
 */
const dataSchemeMatch = Compute.pattern(dataScheme);

/**
 * {@link dataToken} as a `Compute.matches` pattern.
 */
const dataTokenMatch = Compute.pattern(dataToken);

/**
 * The value domains that are an `xs:anyURI`'s: every domain whose primitive is `anyURI`.
 */
const uriDomains = ValueDomainOf.rows.flatMap(({ domain, primitive }) =>
  primitive === "anyURI" ? [domain] : [],
);

/**
 * Select, over a base level, the attributes whose domain under their element's governor is an
 * `xs:anyURI`'s: each `(node, id)` with its lexical form and its count of kept entity references.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const uriAttributesOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { entities, governs, id, kind, lexical, name, node, version } = v(Attribute, "attribute");
    const model = AttributeModelOf.at(
      "model",
      version,
      GoverningOf.at("governor", version, kind, governs),
    );

    return r
      .match(Attribute, { entities, governs, id, kind, lexical, name, node, version })
      .where(
        r.inSet(
          AttributeGrammar.at("domain", model, AttributeSlotOf.at("slot", model, name)),
          uriDomains,
        ),
      )
      .find({ entities, id, lexical, node });
  });

/**
 * Select, over a base level, the attributes of an address list: each `(node, id)` with its lexical
 * form and its count of kept entity references.
 *
 * @param base - The level the query reads, pantry's `Qti`.
 * @returns The query.
 */
const addressListsOf = (base: QtiSchema) =>
  query(base).rule((r) => {
    const { entities, id, lexical, name, node } = v(Attribute, "attribute");

    return r
      .match(Attribute, { entities, id, lexical, name, node })
      .where(r.inSet(name, addressLists))
      .find({ entities, id, lexical, node });
  });

/**
 * Build the data rule for one base level: the relations it derives from the base, by name, and a
 * `CdnData` check over each. The rule reads no origin: a `data:` address is refused whatever the
 * CDN.
 *
 * @param base - The level the derived relations read, pantry's `Qti`.
 * @param _origin - The origin the CDN serves, as the level's options hold it.
 * @returns The relations and statements the rule adds to the `Cdn` level.
 */
export const cdnDataRule = (base: QtiSchema, _origin: string) => {
  const CdnDataUriAttribute = derived("CdnDataUriAttribute", uriAttributesOf(base));
  const CdnDataAddressList = derived("CdnDataAddressList", addressListsOf(base));

  const CdnDataUriText = derived(
    "CdnDataUriText",
    query(base).rule((r) => {
      const { governs, id, kind, stringValue, version } = v(Node, "node");
      const governor = GoverningOf.at("governor", version, kind, governs);

      return r
        .match(Node, { governs, id, kind, stringValue, version })
        .where(r.inSet(TextDomain.at("domain", version, governor), uriDomains))
        .find({ id, stringValue });
    }),
  );

  const CdnDataUriTextEntity = derived(
    "CdnDataUriTextEntity",
    query(base).rule((r) => {
      const { id, kind, parentGoverns, parentKind, version } = v(Node, "node");
      const governor = GoverningOf.at("governor", version, parentKind, parentGoverns);

      return r
        .match(Node, { id, kind, parentGoverns, parentKind, version })
        .where(
          r.and(
            r.eq(kind, "entityRef"),
            r.inSet(TextDomain.at("domain", version, governor), uriDomains),
          ),
        )
        .find({ id, kind });
    }),
  );

  return {
    relations: { CdnDataAddressList, CdnDataUriAttribute, CdnDataUriText, CdnDataUriTextEntity },
    statements: [
      check("CdnData", CdnDataUriAttribute, (a) =>
        a.and(a.eq(a.entities, 0n), a.not(Compute.matches(a.lexical, dataSchemeMatch))),
      ),
      check("CdnData", CdnDataAddressList, (a) =>
        a.and(a.eq(a.entities, 0n), a.not(Compute.matches(a.lexical, dataTokenMatch))),
      ),
      check("CdnData", CdnDataUriText, (n) =>
        n.not(Compute.matches(n.stringValue, dataSchemeMatch)),
      ),
      check("CdnData", CdnDataUriTextEntity, (n) => n.ne(n.kind, "entityRef")),
    ] as const,
  };
};
