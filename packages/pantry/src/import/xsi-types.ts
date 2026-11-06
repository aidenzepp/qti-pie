/**
 * Whether an element, or a value, is valid against a local type: XML Schema Part 1, Element Locally
 * Valid (Type), 3.3.4, and Part 2's String Valid, 3.14.4, for the types decision 222 reaches. A
 * type derived from the type an element is declared with is accepted when the element is valid
 * against it, the attributes the derived type adds are judged against its attribute uses and its
 * attribute wildcard (decision 227 (a)), and, on lax foreign content, a simple type that resolves
 * is judged the same way. A pure module over the tables of `seed/xsi.ts`; the `xsi:type` judge of
 * `xsi.ts` calls it and nothing else does. The tables are `xsi-tables.ts`'s, the judge of a
 * built-in datatype `xsi-judges.ts`'s (its lexical spaces `xsi-lexical.ts`'s), the facets
 * `xsi-facets.ts`'s (its pattern translation `xsi-pattern.ts`'s); this module builds a judge for
 * each type of the tables and judges an element and its attributes against one.
 *
 * Two known model limits shape it, both stated for pantry and plate alike in reading 50 (decision
 * 227). Reading 60 extends reading 50 to a built-in simple `xsi:type` on lax foreign content, whose
 * attribute and child rules `validLocal` checks (Element Locally Valid (Type), clause 3.1) and
 * whose text it judges, which plate cannot:
 *
 * - L-1: a complex `xsi:type` on lax foreign content is not checked against that type, because that
 *   needs a general XML Schema validator. `validLocal` is not called for it, and the caller accepts
 *   it unchecked.
 * - L-2: `xs:ENTITY` is not verified. The value must be an NCName, as `xs:NCName`, but whether it
 *   names an unparsed entity the DTD declares (String Valid clause 2.1, 3.14.4) is not checked,
 *   because this base reads no DTD declaration.
 *
 * L-3 (a simple type outside the judged lexical spaces) is gone: every built-in datatype of Part 2
 * is judged by its lexical space (decision 228, F-2). What a value is not checked for, and what
 * leaves a type unjudged (`covers` false, so `validValue` accepts it unchecked), is recorded here:
 *
 * - `xs:QName` and `xs:NOTATION` are judged by their lexical form, a QName. Whether the prefix is
 *   bound, and whether the notation is declared, depend on the namespace context of the value and
 *   on the schema's notations, which `validValue` is not given.
 * - A bound facet (`minInclusive` and the three others) on a date, time or duration type is not
 *   applied: those types are only partially ordered, and no schema document of the four sets states
 *   one. A type that states one is unjudged, as is one whose `enumeration` is on such a type.
 * - A pattern facet whose XML Schema regular expression this module's translation does not read (a
 *   block escape other than `\p{IsBasicLatin}`, or a construct outside the grammar) leaves its type
 *   unjudged.
 *
 * The tables hold no row for a built-in datatype's facets or lexical space, so each is written
 * here. A type is looked up in the table block of one schema set and version, as the document says
 * which it is; `covers`, which has no document, holds when every block that has the type judges it.
 * `xs:ID` uniqueness is the ID pass's, not `validValue`'s: only an element of simple type
 * `validLocal` judges also refuses an `xs:ID` the document already holds.
 */
import { Option } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import {
  builtinJudge,
  judged,
  listJudge,
  normalizeWith,
  unionJudge,
} from "#pantry/import/xsi-judges.ts";
import type { Context, Judge } from "#pantry/import/xsi-judges.ts";
import { restrictedJudge } from "#pantry/import/xsi-facets.ts";
import {
  blocks,
  describe,
  isBuiltin,
  keyOf,
  nameKey,
  tablesOf,
} from "#pantry/import/xsi-tables.ts";
import type { Tables } from "#pantry/import/xsi-tables.ts";
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import type {
  ProcessContents,
  TypeAttributeWildcardRow,
  TypeKey,
} from "#pantry/schema/seed/xsi.ts";
import { typeNamespaces } from "#pantry/schema/seed/xsi.ts";

/**
 * The namespace of the `xsi` attributes.
 */
const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The namespace an XML namespace declaration's attribute node is in.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The four `xsi` attributes a simple type's element may carry (Element Locally Valid (Type), 3.3.4,
 * clause 3.1).
 */
const xsiNames: ReadonlySet<string> = new Set([
  "type",
  "nil",
  "schemaLocation",
  "noNamespaceSchemaLocation",
]);

/**
 * The text of an element: its character data, with an undeclared entity reference as written.
 */
const textOf = (element: Element): string =>
  element.children
    .map((child) => {
      if (child.kind === "text") {
        return child.value;
      }

      return child.kind === "entityRef" ? `&${child.name};` : "";
    })
    .join("");

/**
 * The text stripped of its leading and trailing XML space characters.
 */
const trimXml = (text: string): string => text.replaceAll(/^[ \t\n\r]+|[ \t\n\r]+$/gu, "");

/**
 * The judge of a simple type built from its derivation, the judges of the types it derives from
 * given by `judgeMember`.
 */
const judgeDerived = (
  tables: Tables,
  type: TypeKey,
  judgeMember: (member: TypeKey) => Judge | undefined,
): Judge | undefined => {
  if ("local" in type && type.namespace === typeNamespaces.xs) {
    return builtinJudge(type.local);
  }

  const key = keyOf(type);
  const row = tables.derivations.get(key);

  if (row === undefined || row.variety !== "simple") {
    return undefined;
  }

  const members = tables.members.get(key) ?? [];

  if (row.method === "restriction") {
    const base = judgeMember(row.base);

    return base === undefined ? undefined : restrictedJudge(base, tables.facets.get(key) ?? []);
  }

  if (row.method === "list") {
    const item = members[0] === undefined ? undefined : judgeMember(members[0].member);

    return item === undefined ? undefined : listJudge(item, 0);
  }

  const judgesOfMembers = members.map((member) => judgeMember(member.member));

  return members.length === 0 || judgesOfMembers.some((member) => member === undefined)
    ? undefined
    : unionJudge(judgesOfMembers.filter((member) => member !== undefined));
};

/**
 * The simple types already judged, by block and type key.
 */
const judges = new Map<string, Judge | undefined>();

/**
 * The judge of a simple type in a block, built from its derivation, or `undefined` when this module
 * cannot judge its values completely. `trail` holds the types on the way, so a derivation that
 * loops is unjudged.
 */
const judgeIn = (
  tables: Tables,
  block: string,
  type: TypeKey,
  trail: readonly string[] = [],
): Judge | undefined => {
  const key = keyOf(type);
  const cacheKey = `${block}\u0000${key}`;

  if (judges.has(cacheKey)) {
    return judges.get(cacheKey);
  }

  const judge = judgeDerived(tables, type, (member) =>
    trail.includes(keyOf(member)) ? undefined : judgeIn(tables, block, member, [...trail, key]),
  );

  judges.set(cacheKey, judge);

  return judge;
};

/**
 * Whether a block holds a type: XML Schema's own are in every block.
 */
const holds = (tables: Tables, type: TypeKey): boolean =>
  ("local" in type && type.namespace === typeNamespaces.xs) || tables.derivations.has(keyOf(type));

/**
 * Whether this module judges a simple type's values completely: every built-in datatype of XML
 * Schema Part 2 and every simple type derived from one by restriction, list or union whose facets
 * it applies, in every schema set and version that holds the type. `validValue` accepts a value of
 * any other type unchecked, and `validLocal` checks the attributes and children of an element of
 * one and accepts its value unchecked.
 *
 * @param type - The type.
 * @returns Whether `validValue` checks a value of `type`.
 */
export const covers = (type: TypeKey): boolean => {
  const present = [...blocks].filter(([, tables]) => holds(tables, type));

  return (
    present.length > 0 &&
    present.every(([block, tables]) => judgeIn(tables, block, type) !== undefined)
  );
};

/**
 * The detail of a value that is not in a simple type's value space, naming the clause.
 */
const valueDetail = (value: string, type: TypeKey, reason: string, clause: string): string =>
  `${clause}: the value "${value}" is not valid for ${describe(type)}: ${reason} (XML Schema Part 1, 3.14.4, String Valid)`;

/**
 * The reason `value` is outside the value space of `type` in a block, or `null` when it is inside
 * or when `type` is not judged.
 */
const valueReason = (
  value: string,
  type: TypeKey,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  context: Context,
): string | null => {
  const block = `${set}/${version}`;
  const judge = judgeIn(tablesOf(set, version), block, type);

  return judge === undefined ? null : judged(judge, value, context);
};

/**
 * Whether `value` is in the value space of the simple type `type` (XML Schema Part 2, and Part 1,
 * String Valid, 3.14.4), after the type's whiteSpace normalizes it: the lexical space of the
 * primitive type at the root of the derivation, then every facet along it, nearest first. A list
 * has each item judged by its item type, and a union is valid when a member judges it valid. A
 * value of a type `covers` is false for, and of a complex type, is accepted unchecked.
 *
 * @param value - The lexical value, as written.
 * @param type - The simple type.
 * @param set - The schema set whose tables hold `type`.
 * @param version - The schema version.
 * @param ids - The ID values the document holds, for `xs:IDREF`.
 * @returns `None` when the value is valid, else a detail naming the clause it breaks.
 */
export const validValue = (
  value: string,
  type: TypeKey,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  ids: ReadonlySet<string>,
): Option.Option<string> => {
  const reason = valueReason(value, type, set, version, { ids, unique: false });

  return Option.fromNullishOr(
    reason === null
      ? null
      : valueDetail(value, type, reason, "XML Schema Part 1, 3.2.4, Attribute Locally Valid"),
  );
};

/**
 * The detail of Element Locally Valid (Type), clause 3, that `element` breaks as a simple type's,
 * or `null` when its attributes and children are the ones clause 3 allows.
 */
const simpleContentDetail = (element: Element, type: TypeKey): string | null => {
  const stray = element.attributes.find(
    (attribute) =>
      attribute.namespace !== xmlnsNamespace &&
      !(attribute.namespace === xsiNamespace && xsiNames.has(attribute.local)),
  );

  if (stray !== undefined) {
    return `XML Schema Part 1, 3.3.4, Element Locally Valid (Type) clause 3.1: the element of simple type ${describe(type)} carries the attribute ${stray.qname}`;
  }

  if (element.children.some((child) => child.kind === "element")) {
    return `XML Schema Part 1, 3.3.4, Element Locally Valid (Type) clause 3.2: the element of simple type ${describe(type)} has an element child`;
  }

  return null;
};

/**
 * The detail of Element Locally Valid (Complex Type), clause 4, when `element` lacks an attribute
 * `type` requires and `declared` does not hold, else `null`.
 */
const complexUseDetail = (
  tables: Tables,
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
): string | null => {
  const own = new Set(
    (declared === undefined ? [] : (tables.uses.get(keyOf(declared)) ?? [])).map((use) =>
      nameKey(use.namespace, use.local),
    ),
  );
  const missing = (tables.uses.get(keyOf(type)) ?? []).find(
    (use) =>
      use.required &&
      !own.has(nameKey(use.namespace, use.local)) &&
      !element.attributes.some(
        (attribute) => attribute.namespace === use.namespace && attribute.local === use.local,
      ),
  );

  return missing === undefined
    ? null
    : `XML Schema Part 1, 3.4.4, Element Locally Valid (Complex Type) clause 4: the element lacks the attribute ${missing.local} that type ${describe(type)} requires`;
};

/**
 * What admits an attribute a derived complex type adds: one of its attribute uses, with the type of
 * the attribute's value, or its attribute wildcard, with how the wildcard processes what it admits.
 */
export type AddedBy =
  | { readonly attributeType: TypeKey; readonly kind: "use" }
  | { readonly kind: "wildcard"; readonly process: ProcessContents };

/**
 * An attribute a derived complex type adds to the element, as it is written.
 */
export interface AddedAttribute {
  readonly by: AddedBy;
  readonly local: string;
  readonly namespace: string;
  readonly prefix: string;
  readonly value: string;
}

/**
 * Whether an attribute wildcard's namespace constraint admits a namespace (Part 1, 3.10.4):
 * `##any`, `##other` (a namespace that is present and not the target), or a list, whose
 * `##targetNamespace` is the target and `##local` is no namespace.
 */
const wildcardAdmits = (wildcard: TypeAttributeWildcardRow, namespace: string): boolean => {
  if (wildcard.namespaces === "##any") {
    return true;
  }

  if (wildcard.namespaces === "##other") {
    return namespace !== "" && namespace !== wildcard.target;
  }

  return wildcard.namespaces.split(/\s+/u).some((token) => {
    if (token === "##targetNamespace") {
      return namespace === wildcard.target;
    }

    return token === "##local" ? namespace === "" : token === namespace;
  });
};

/**
 * The added attributes of an element, in a block's tables.
 */
const addedIn = (
  tables: Tables,
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
): readonly AddedAttribute[] => {
  const held = new Set(
    (declared === undefined ? [] : (tables.uses.get(keyOf(declared)) ?? [])).map((use) =>
      nameKey(use.namespace, use.local),
    ),
  );
  const uses = tables.uses.get(keyOf(type)) ?? [];
  const wildcard = tables.wildcards.get(keyOf(type));
  const added: AddedAttribute[] = [];

  for (const attribute of element.attributes) {
    const { local, namespace, prefix, value } = attribute;
    const use = uses.find(
      (candidate) => candidate.namespace === namespace && candidate.local === local,
    );
    const written = { local, namespace, prefix, value };

    if (
      namespace === xmlnsNamespace ||
      (namespace === xsiNamespace && xsiNames.has(local)) ||
      held.has(nameKey(namespace, local))
    ) {
      continue;
    }

    if (use !== undefined) {
      added.push({ ...written, by: { attributeType: use.attributeType, kind: "use" } });
    } else if (wildcard !== undefined && wildcardAdmits(wildcard, namespace)) {
      added.push({ ...written, by: { kind: "wildcard", process: wildcard.process } });
    }
  }

  return added;
};

/**
 * The attributes of `element` that a complex `type` derived from `declared` adds: every attribute
 * but namespace declarations, the four `xsi` names declared in every schema and the attribute uses
 * `declared` holds, that an attribute use of `type` admits (`by` `use`) or, failing that, `type`'s
 * attribute wildcard admits (`by` `wildcard`). An attribute neither admits is left out, for the
 * tree walk to refuse.
 *
 * @param element - The element.
 * @param type - The complex type its `xsi:type` names.
 * @param declared - The type the element is declared with, or `undefined`.
 * @param set - The schema set.
 * @param version - The schema version.
 * @returns The added attributes, in document order.
 */
export const addedAttributes = (
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
): readonly AddedAttribute[] => {
  const tables = tablesOf(set, version);

  return addedIn(tables, element, type, declared);
};

/**
 * The detail of Attribute Locally Valid (3.2.4) that one added attribute breaks, or `null`: by a
 * use, its value must be valid for the use's type; by a wildcard under `lax`, for the global
 * declaration's type when the set has one and otherwise it is accepted (not assessed, 3.10.4);
 * under `skip` it is accepted, and under `strict` it must have a declaration and be valid for it.
 */
const addedDetail = (
  attribute: AddedAttribute,
  tables: Tables,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  type: TypeKey,
  ids: ReadonlySet<string>,
): string | null => {
  const clause = `XML Schema Part 1, 3.4.4, Element Locally Valid (Complex Type) clause 3, the attribute ${nameKey(attribute.namespace, attribute.local)} of type ${describe(type)}`;
  const context = { ids, unique: false };
  const { by } = attribute;

  if (by.kind === "use") {
    const reason = valueReason(attribute.value, by.attributeType, set, version, context);

    return reason === null ? null : valueDetail(attribute.value, by.attributeType, reason, clause);
  }

  if (by.process === "skip") {
    return null;
  }

  const declaration = tables.globals.get(nameKey(attribute.namespace, attribute.local));

  if (declaration === undefined) {
    return by.process === "strict"
      ? `${clause}: the attribute wildcard is strict and no global attribute declaration names it`
      : null;
  }

  const reason = valueReason(attribute.value, declaration.type, set, version, context);

  return reason === null ? null : valueDetail(attribute.value, declaration.type, reason, clause);
};

/**
 * The detail of a complex type's attribute rules that `element` breaks, or `null`.
 */
const complexDetail = (
  tables: Tables,
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  ids: ReadonlySet<string>,
): string | null => {
  const missing = complexUseDetail(tables, element, type, declared);

  if (missing !== null) {
    return missing;
  }

  for (const attribute of addedIn(tables, element, type, declared)) {
    const detail = addedDetail(attribute, tables, set, version, type, ids);

    if (detail !== null) {
      return detail;
    }
  }

  return null;
};

/**
 * Whether `element` is valid against `type`, the type its `xsi:type` names (XML Schema Part 1,
 * 3.3.4, Element Locally Valid (Type)).
 *
 * `xs:anyType` is valid. A simple type allows no attribute but the four `xsi` ones and no element
 * child, and, when `covers(type)`, its text, trimmed and normalized by the type's `whiteSpace`,
 * must be in its value space (an `xs:ID` the document already holds is refused). A complex type
 * derived from `declared` has the content type of `declared`, which the kind's own content check
 * judges, so what is checked here is the attributes: each one `type` requires and `declared` does
 * not hold is present, and each one `addedAttributes` finds is valid (clause 3, Attribute Locally
 * Valid, 3.2.4): by an attribute use, valid for its type; by a wildcard under `lax`, valid for the
 * global declaration the set holds, and under `strict` there must be one.
 *
 * @param element - The element.
 * @param type - The type its `xsi:type` names, resolved by the caller.
 * @param declared - The type the element is declared with, or `undefined`.
 * @param set - The schema set whose tables hold the types.
 * @param version - The schema version.
 * @param ids - The ID values the document holds, for `xs:ID` and `xs:IDREF`.
 * @returns `None` when the element is valid, else a detail naming the clause it breaks.
 */
export const validLocal = (
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  ids: ReadonlySet<string>,
): Option.Option<string> => {
  if (isBuiltin(type, "anyType")) {
    return Option.none();
  }

  const tables = tablesOf(set, version);
  const variety = isBuiltin(type, "anySimpleType")
    ? "simple"
    : tables.derivations.get(keyOf(type))?.variety;

  if (variety === "complex") {
    return Option.fromNullishOr(complexDetail(tables, element, type, declared, set, version, ids));
  }

  const judge = variety === "simple" ? judgeIn(tables, `${set}/${version}`, type) : undefined;
  const content = variety === "simple" ? simpleContentDetail(element, type) : null;

  if (content !== null || judge === undefined) {
    return Option.fromNullishOr(content);
  }

  const value = trimXml(textOf(element));
  const reason = judged(judge, value, { ids, unique: true });

  return Option.fromNullishOr(
    reason === null
      ? null
      : valueDetail(
          normalizeWith(judge.whiteSpace, value),
          type,
          reason,
          "XML Schema Part 1, 3.3.4, Element Locally Valid (Type) clause 3.3",
        ),
  );
};
