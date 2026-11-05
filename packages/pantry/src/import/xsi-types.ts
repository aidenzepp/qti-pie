/**
 * Whether an element is valid against the local type its `xsi:type` names: XML Schema Part 1,
 * Element Locally Valid (Type), 3.3.4, for the types decision 222 reaches. A type derived from the
 * type an element is declared with is accepted when the element is valid against it, and, on lax
 * foreign content, a simple type that resolves is judged the same way. A pure module over the
 * tables of `seed/xsi.ts`; the `xsi:type` judge of `xsi.ts` calls it and nothing else does.
 *
 * Two known model limits shape it, both stated for pantry and plate alike in reading 50 (decision
 * 227 while reading 50 is not on the base):
 *
 * - L-1: a complex `xsi:type` on lax foreign content is not checked against that type, because that
 *   needs a general XML Schema validator. `validLocal` is not called for it, and the caller accepts
 *   it unchecked.
 * - L-2: `xs:ENTITY` is not verified. The value must be an NCName, as `xs:NCName`, but whether it
 *   names an unparsed entity the DTD declares (String Valid clause 2.1, 3.14.4) is not checked,
 *   because this base reads no DTD declaration.
 *
 * The tables hold no row for a built-in datatype, so the lexical space of each is written here.
 * A type is looked up by its expanded name alone, across every schema set and version: a facet
 * the sets state differently is read as the alternatives of all of them, and a use required in
 * one version only is not required here, because where the document cannot tell, it is accepted.
 */
import { Option } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { collapse, replace } from "#pantry/import/tree.ts";
import type { WhiteSpace } from "#pantry/import/tree.ts";
import { ncNameContinuation, ncNameStart, anyUri, xsInteger } from "#pantry/schema/patterns.ts";
import type { SimpleFacetRow, TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  simpleFacet,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";

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
 * The key of a type: its expanded name, or the path of the declaration that holds it.
 */
const keyOf = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * A type for a message.
 */
const describe = (type: TypeKey): string =>
  "anonymous" in type ? `the anonymous type ${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * Whether `type` is the XML Schema built-in `local`.
 */
const isBuiltin = (type: TypeKey, local: string): boolean =>
  "local" in type && type.namespace === typeNamespaces.xs && type.local === local;

/**
 * The first row of `typeDerivation` of each type: its base, method and variety. A type has the same
 * derivation in every schema set and version that holds it.
 */
const derivations = new Map(
  typeDerivation.toReversed().map((row) => [keyOf(row.type), row] as const),
);

/**
 * The facets each type states, each distinct one once, across the schema sets and versions.
 */
const facets: ReadonlyMap<string, readonly SimpleFacetRow[]> = (() => {
  const byType = new Map<string, SimpleFacetRow[]>();
  const seen = new Set<string>();

  for (const row of simpleFacet) {
    const key = keyOf(row.type);
    const identity = `${key}\u0000${row.facet}\u0000${row.value}`;

    if (!seen.has(identity)) {
      seen.add(identity);
      byType.set(key, [...(byType.get(key) ?? []), row]);
    }
  }

  return byType;
})();

/**
 * One attribute use of a complex type, by its expanded name.
 */
interface UseName {
  readonly local: string;
  readonly namespace: string;
}

/**
 * The attribute uses of each complex type: every one it holds, and the ones every schema set and
 * version that holds the type requires.
 */
const uses: ReadonlyMap<
  string,
  { readonly all: readonly UseName[]; readonly required: readonly UseName[] }
> = (() => {
  const blocks = new Map<string, Map<string, { name: UseName; required: boolean }[]>>();

  for (const row of attributeUse) {
    const key = keyOf(row.type);
    const block = `${row.set}/${row.version}`;
    const byBlock = blocks.get(key) ?? new Map<string, { name: UseName; required: boolean }[]>();

    byBlock.set(block, [
      ...(byBlock.get(block) ?? []),
      { name: { local: row.local, namespace: row.namespace }, required: row.required },
    ]);
    blocks.set(key, byBlock);
  }

  const result = new Map<string, { all: UseName[]; required: UseName[] }>();

  for (const [key, byBlock] of blocks) {
    const all = new Map<string, UseName>();
    const required = new Map<string, { name: UseName; count: number }>();

    for (const rows of byBlock.values()) {
      for (const { name, required: isRequired } of rows) {
        const id = `{${name.namespace}}${name.local}`;

        all.set(id, name);

        if (isRequired) {
          required.set(id, { count: (required.get(id)?.count ?? 0) + 1, name });
        }
      }
    }

    result.set(key, {
      all: [...all.values()],
      required: [...required.values()]
        .filter(({ count }) => count === byBlock.size)
        .map(({ name }) => name),
    });
  }

  return result;
})();

/**
 * Part 2's `xs:language` pattern, with no bound on the number of subtags.
 */
const languagePattern = /^[a-zA-Z]{1,8}(?:-[a-zA-Z0-9]{1,8})*$/u;

/**
 * XML's NCName, Name and Nmtoken productions, with no length bound.
 */
/**
 * XML's NCName production, with no length bound.
 */
const ncNamePattern = new RegExp(`^[${ncNameStart}][${ncNameContinuation}]*$`, "u");

/**
 * XML's Name production, with no length bound.
 */
const namePattern = new RegExp(`^[${ncNameStart}:][${ncNameContinuation}:]*$`, "u");

/**
 * XML's Nmtoken production, with no length bound.
 */
const nmtokenPattern = new RegExp(`^[${ncNameContinuation}:]+$`, "u");

/**
 * `xs:integer`'s lexical space.
 */
const integerPattern = new RegExp(xsInteger, "u");

/**
 * `xs:anyURI`'s lexical space, as `patterns.anyUri` states it.
 */
const anyUriPattern = new RegExp(anyUri, "u");

/**
 * The value range of each integer type of XML Schema Part 2, 3.3.13 to 3.3.25, inclusive on both
 * ends where one exists.
 */
const integerRanges: ReadonlyMap<string, { readonly max?: bigint; readonly min?: bigint }> =
  new Map([
    ["integer", {}],
    ["nonPositiveInteger", { max: 0n }],
    ["negativeInteger", { max: -1n }],
    ["long", { max: 2n ** 63n - 1n, min: -(2n ** 63n) }],
    ["int", { max: 2n ** 31n - 1n, min: -(2n ** 31n) }],
    ["short", { max: 32_767n, min: -32_768n }],
    ["byte", { max: 127n, min: -128n }],
    ["nonNegativeInteger", { min: 0n }],
    ["unsignedLong", { max: 2n ** 64n - 1n, min: 0n }],
    ["unsignedInt", { max: 2n ** 32n - 1n, min: 0n }],
    ["unsignedShort", { max: 65_535n, min: 0n }],
    ["unsignedByte", { max: 255n, min: 0n }],
    ["positiveInteger", { min: 1n }],
  ]);

/**
 * The anchored `v`-flag translation of each pattern facet the tables state on a type judged here,
 * keyed by the facet's value as the schema writes it. XML Schema's `\p{IsBasicLatin}` is
 * `\x00-\x7F`, its subtraction `[A-[B]]` is `[A--[B]]`, and its `\S` is any character but the four
 * XML space characters. A pattern facet outside this table leaves its type unjudged.
 */
const patternTranslations: ReadonlyMap<string, RegExp> = new Map(
  [
    [
      "(([0-9]+%?[,]){2}([0-9]+%?))|(([0-9]+%?[,]){3}([0-9]+%?))|(([0-9]+%?[,]){2}(([0-9]+%?[,]){2})+([0-9]+%?[,])([0-9]+%?))",
      "(?:(?:[0-9]+%?[,]){2}(?:[0-9]+%?))|(?:(?:[0-9]+%?[,]){3}(?:[0-9]+%?))|(?:(?:[0-9]+%?[,]){2}(?:(?:[0-9]+%?[,]){2})+(?:[0-9]+%?[,])(?:[0-9]+%?))",
    ],
    [
      '[\\p{IsBasicLatin}-[()<>@,;:\\\\"/\\[\\]?=]]+/[\\p{IsBasicLatin}-[()<>@,;:\\\\"/\\[\\]?=]]+',
      '[[\\x00-\\x7F]--[\\(\\)<>@,;:\\\\"\\/\\[\\]?=]]+\\/[[\\x00-\\x7F]--[\\(\\)<>@,;:\\\\"\\/\\[\\]?=]]+',
    ],
    ["(ext:)[a-zA-Z0-9_\\.\\-]+", "(?:ext:)[a-zA-Z0-9_.\\-]+"],
    ["\\S+", "[^ \\t\\n\\r]+"],
  ].map(([schema = "", source = ""]) => [schema, new RegExp(`^(?:${source})$`, "v")]),
);

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
 * The lexical space of a built-in datatype, judged here: `null` when the text is in it, else the
 * reason it is not.
 */
type Lexical = (text: string, ids: ReadonlySet<string>) => string | null;

/**
 * `null` when `text` matches `pattern`, else `reason`.
 */
const matching = (pattern: RegExp, text: string, reason: string): string | null =>
  pattern.test(text) ? null : reason;

/**
 * The lexical space of `xs:NCName`.
 */
const lexicalNcName = (text: string): string | null =>
  matching(ncNamePattern, text, "it is not an NCName");

/**
 * The builtin lexical spaces this module judges, by the local name of the built-in.
 */
const lexicals: ReadonlyMap<string, Lexical> = new Map<string, Lexical>([
  ["anySimpleType", () => null],
  ["string", () => null],
  ["normalizedString", () => null],
  ["token", () => null],
  ["anyURI", (text) => matching(anyUriPattern, text, "it is not an anyURI")],
  ["language", (text) => matching(languagePattern, text, "it is not a language tag")],
  ["Name", (text) => matching(namePattern, text, "it is not an XML Name")],
  ["NMTOKEN", (text) => matching(nmtokenPattern, text, "it is not an XML Nmtoken")],
  ["NCName", lexicalNcName],
  ["ENTITY", lexicalNcName],
  [
    "ID",
    (text, ids) =>
      lexicalNcName(text) ?? (ids.has(text) ? "the document already holds that ID" : null),
  ],
  [
    "IDREF",
    (text, ids) =>
      lexicalNcName(text) ?? (ids.has(text) ? null : "no element of the document has that ID"),
  ],
]);

/**
 * The default whiteSpace of a judged built-in: `xs:string` and `xs:anySimpleType` preserve,
 * `xs:normalizedString` replaces, and every other collapses.
 */
const builtinWhiteSpace = (local: string): WhiteSpace => {
  if (local === "string" || local === "anySimpleType") {
    return "preserve";
  }

  return local === "normalizedString" ? "replace" : "collapse";
};

/**
 * Apply a whiteSpace to a lexical value.
 */
const normalizeWith = (whiteSpace: WhiteSpace, text: string): string => {
  if (whiteSpace === "collapse") {
    return collapse(text);
  }

  return whiteSpace === "replace" ? replace(text) : text;
};

/**
 * A simple type this module judges completely: its whiteSpace and its check of a normalized value,
 * `null` when the value is valid, else the reason it is not.
 */
interface Judge {
  readonly test: (value: string, ids: ReadonlySet<string>) => string | null;
  readonly whiteSpace: WhiteSpace;
}

/**
 * The type a simple type restricts, each step by restriction, up to the XML Schema built-in at the
 * root: the user types on the way, nearest first, and the built-in's local name. `null` for a list,
 * a union, a complex type or a type the tables do not hold.
 */
const restrictionChain = (
  type: TypeKey,
): { readonly builtin: string; readonly steps: readonly string[] } | null => {
  const steps: string[] = [];
  const seen = new Set<string>();
  let current = type;

  while (!seen.has(keyOf(current))) {
    seen.add(keyOf(current));

    if ("local" in current && current.namespace === typeNamespaces.xs) {
      return { builtin: current.local, steps };
    }

    const row = derivations.get(keyOf(current));

    if (row === undefined || row.variety !== "simple" || row.method !== "restriction") {
      return null;
    }

    steps.push(keyOf(current));
    current = row.base;
  }

  return null;
};

/**
 * One facet check of a normalized value: `null` when it holds, else why not.
 */
type Check = (value: string) => string | null;

/**
 * The number of characters of a value, as XML Schema's `length` facets count them.
 */
const characters = (value: string): number => [...value.matchAll(/./gsu)].length;

/**
 * The check of a `length`, `minLength` or `maxLength` facet.
 */
const lengthCheck = (facet: "length" | "maxLength" | "minLength", limit: number): Check => {
  if (facet === "length") {
    return (value) => (characters(value) === limit ? null : `its length is not ${limit}`);
  }

  if (facet === "minLength") {
    return (value) => (characters(value) >= limit ? null : `it is shorter than ${limit}`);
  }

  return (value) => (characters(value) <= limit ? null : `it is longer than ${limit}`);
};

/**
 * The check of a bound facet of the integer family.
 */
const boundCheck = (
  facet: "maxExclusive" | "maxInclusive" | "minExclusive" | "minInclusive",
  bound: bigint,
): Check => {
  const within = (n: bigint): boolean => {
    if (facet === "minInclusive") {
      return n >= bound;
    }

    if (facet === "maxInclusive") {
      return n <= bound;
    }

    return facet === "minExclusive" ? n > bound : n < bound;
  };

  return (value) => (within(BigInt(value)) ? null : `it breaks ${facet} ${bound}`);
};

/**
 * The checks the facets of one step of a restriction chain make of a normalized value, or `null`
 * when a facet is not one this module applies.
 */
const stepChecks = (
  rows: readonly SimpleFacetRow[],
  integer: boolean,
  whiteSpace: WhiteSpace,
): readonly Check[] | null => {
  const checks: Check[] = [];
  const patterns: RegExp[] = [];
  const enumeration: string[] = [];

  for (const row of rows) {
    const { facet, value } = row;

    if (facet === "enumeration") {
      enumeration.push(normalizeWith(whiteSpace, value));
    } else if (facet === "pattern") {
      const pattern = patternTranslations.get(value);

      if (pattern === undefined) {
        return null;
      }

      patterns.push(pattern);
    } else if (facet === "length" || facet === "minLength" || facet === "maxLength") {
      checks.push(lengthCheck(facet, Number(value)));
    } else if (
      facet === "minInclusive" ||
      facet === "maxInclusive" ||
      facet === "minExclusive" ||
      facet === "maxExclusive"
    ) {
      if (!integer || !integerPattern.test(value)) {
        return null;
      }

      checks.push(boundCheck(facet, BigInt(value)));
    } else if (facet !== "whiteSpace") {
      return null;
    }
  }

  if (enumeration.length > 0) {
    checks.push((value) =>
      enumeration.includes(value) ? null : "it is none of the enumerated values",
    );
  }

  if (patterns.length > 0) {
    checks.push((value) =>
      patterns.some((pattern) => pattern.test(value)) ? null : "it matches no pattern",
    );
  }

  return checks;
};

/**
 * Why `value` is outside `range`, or `null` when it is inside.
 */
const integerRangeDetail = (
  value: bigint,
  range: { readonly max?: bigint; readonly min?: bigint },
): string | null =>
  (range.min !== undefined && value < range.min) || (range.max !== undefined && value > range.max)
    ? "it is outside the value range"
    : null;

/**
 * The whiteSpace of a restriction chain: the nearest `whiteSpace` facet a step states, else the
 * built-in's.
 */
const whiteSpaceOf = (chain: {
  readonly builtin: string;
  readonly steps: readonly string[];
}): WhiteSpace => {
  const stated = chain.steps
    .flatMap((step) => facets.get(step) ?? [])
    .find((row) => row.facet === "whiteSpace")?.value;

  if (stated === "preserve" || stated === "replace" || stated === "collapse") {
    return stated;
  }

  return builtinWhiteSpace(chain.builtin);
};

/**
 * The judge of a simple type, or `undefined` when this module cannot judge its values completely.
 */
const judgeOf = (type: TypeKey): Judge | undefined => {
  const chain = restrictionChain(type);

  if (chain === null) {
    return undefined;
  }

  const range = integerRanges.get(chain.builtin);
  const lexical = lexicals.get(chain.builtin);

  if (lexical === undefined && range === undefined) {
    return undefined;
  }

  const whiteSpace = whiteSpaceOf(chain);
  const stepJudges = chain.steps.map((step) =>
    stepChecks(facets.get(step) ?? [], range !== undefined, whiteSpace),
  );
  const checks: Check[] = [];

  for (const stepJudge of stepJudges) {
    if (stepJudge === null) {
      return undefined;
    }

    checks.push(...stepJudge);
  }

  const baseDetail = (value: string, ids: ReadonlySet<string>): string | null => {
    if (range === undefined) {
      return lexical?.(value, ids) ?? null;
    }

    return integerPattern.test(value)
      ? integerRangeDetail(BigInt(value), range)
      : "it is not an integer";
  };

  return {
    test: (value, ids) => {
      const base = baseDetail(value, ids);

      if (base !== null) {
        return base;
      }

      for (const check of checks) {
        const detail = check(value);

        if (detail !== null) {
          return detail;
        }
      }

      return null;
    },
    whiteSpace,
  };
};

/**
 * The simple types already judged, by type key.
 */
const judges = new Map<string, Judge | undefined>();

const judgeCached = (type: TypeKey): Judge | undefined => {
  const key = keyOf(type);

  if (!judges.has(key)) {
    judges.set(key, judgeOf(type));
  }

  return judges.get(key);
};

/**
 * Whether this module judges a simple type's values completely: `xs:anySimpleType`, `xs:string`,
 * `xs:normalizedString`, `xs:anyURI`, `xs:integer`, and every simple type derived by restriction
 * from a type that is, whose facets it applies. `validLocal` checks the attributes and children of
 * an element of any other simple type and accepts its value unchecked.
 *
 * @param type - The type.
 * @returns Whether `validLocal` checks a value of `type`.
 */
export const covers = (type: TypeKey): boolean => judgeCached(type) !== undefined;

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
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
): string | null => {
  const declaredUses = declared === undefined ? [] : (uses.get(keyOf(declared))?.all ?? []);
  const own = new Set(declaredUses.map((name) => `{${name.namespace}}${name.local}`));
  const missing = (uses.get(keyOf(type))?.required ?? []).find(
    (name) =>
      !own.has(`{${name.namespace}}${name.local}`) &&
      !element.attributes.some(
        (attribute) => attribute.namespace === name.namespace && attribute.local === name.local,
      ),
  );

  return missing === undefined
    ? null
    : `XML Schema Part 1, 3.4.4, Element Locally Valid (Complex Type) clause 4: the element lacks the attribute ${missing.local} that type ${describe(type)} requires`;
};

/**
 * Whether `element` is valid against `type`, the type its `xsi:type` names (XML Schema Part 1,
 * 3.3.4, Element Locally Valid (Type)).
 *
 * `xs:anyType` is valid. A simple type allows no attribute but the four `xsi` ones and no element
 * child, and, when `covers(type)`, its text, trimmed and normalized by the type's `whiteSpace`,
 * must be in its lexical space under its facets. A complex type derived from `declared` has the
 * content type of `declared`, which the kind's own content check judges, so only its required
 * attribute uses are checked here, those `declared` does not hold. The attributes the type adds
 * are judged by a later slice.
 *
 * @param element - The element.
 * @param type - The type its `xsi:type` names, resolved by the caller.
 * @param declared - The type the element is declared with, or `undefined`.
 * @param ids - The ID values the document holds, for `xs:ID` and `xs:IDREF`.
 * @returns `None` when the element is valid, else a detail naming the clause it breaks.
 */
export const validLocal = (
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
  ids: ReadonlySet<string>,
): Option.Option<string> => {
  if (isBuiltin(type, "anyType")) {
    return Option.none();
  }

  const variety = isBuiltin(type, "anySimpleType")
    ? "simple"
    : derivations.get(keyOf(type))?.variety;

  if (variety === "complex") {
    return Option.fromNullishOr(complexUseDetail(element, type, declared));
  }

  const judge = variety === "simple" ? judgeCached(type) : undefined;
  const content = variety === "simple" ? simpleContentDetail(element, type) : null;

  if (content !== null || judge === undefined) {
    return Option.fromNullishOr(content);
  }

  const value = normalizeWith(judge.whiteSpace, trimXml(textOf(element)));
  const reason = judge.test(value, ids);

  return Option.fromNullishOr(
    reason === null
      ? null
      : `XML Schema Part 1, 3.3.4, Element Locally Valid (Type) clause 3.3: the text "${value}" is not valid for ${describe(type)}: ${reason} (3.14.4, String Valid)`,
  );
};
