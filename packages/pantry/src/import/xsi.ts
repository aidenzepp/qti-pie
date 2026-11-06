/**
 * The judge of `xsi:type`, `xsi:nil` and `xsi:noNamespaceSchemaLocation`: what XML Schema Part 1
 * says of the three attributes of the instance namespace, applied to a whole element tree. It
 * refuses only what XML Schema refuses (decision 214: "if the standard does not ban it, do not
 * refuse it"), and decision 222 says what that is for `xsi:type`:
 *
 * - On an element with a declared type (a QTI or registry element, or a typed global in wildcard
 *   content), `xsi:type` must name that type or a type derived from it (Element Locally Valid
 *   (Element), 3.3.4, clauses 4.1 to 4.3), and the element must then be valid against the type it
 *   names (clause 5.2.1, `validLocal` of `xsi-types.ts`);
 * - On foreign content under a `lax` wildcard, one that resolves is used to assess the element
 *   (Schema-Validity Assessment (Element), clause 1.2.2), and one that does not resolve, or is not
 *   a QName, leaves the element unassessed, which is not an error (its [validity] is notKnown,
 *   3.3.5, and a lax wildcard's declaration is not mustFind, 3.10.4);
 * - Under `skip` nothing is assessed.
 *
 * Decision 227 widens the first case: the attributes a derived complex type adds are judged by
 * `xsi-types.ts` and returned here as rows (`added`), for the caller to store and render byte for
 * byte. Any other name in the instance namespace (`xsi:foo`) is not judged here.
 *
 * A pure module over `@qti-pie/crust/tree.ts` elements and the tables of `seed/xsi.ts`. Nothing
 * calls it yet: the tree walk of `tree.ts` does, with `judgeTree`.
 *
 * Two known model limits shape it, both stated for pantry and plate alike in reading 50 (decision
 * 227). Reading 60 extends reading 50 to a built-in simple `xsi:type` on lax foreign content: the
 * element must then hold no attribute but the four `xsi:` ones and no element child, which both
 * packages check, and its text, which plate cannot judge and pantry does (`validLocal`):
 *
 * - L-1: a complex `xsi:type` on lax foreign content, other than `xs:anyType`, is accepted without
 *   being checked against that type, because that needs a general XML Schema validator. Revisit if
 *   a real package needs it.
 * - L-3, an unjudged simple type, is gone: `xsi-types.ts` judges every built-in datatype of Part 2 by
 *   its lexical space (decision 228, F-2). What it still leaves unjudged is recorded in its own
 *   module comment.
 *
 * L-2 (`xs:ENTITY` is not verified) is `xsi-types.ts`'s.
 *
 * Choices this module makes where the Recommendation leaves the input open:
 *
 * - An element with no declared type outside wildcard content (`process` `none`) is judged as lax
 *   foreign content: nothing says what it should be, so nothing is refused.
 * - Under `strict`, an `xsi:type` that is not a QName, has an unbound prefix or resolves to no type
 *   is refused, because a strict wildcard's declaration is mustFind (3.10.4). A resolved one is
 *   judged as under `lax`.
 * - The QName of `xsi:type` is read without the 256-character bound `patterns.qName` puts on a key.
 * - `xs:ID` values the document holds are collected from the attributes the governing type types
 *   `xs:ID`, from every `xml:id` and from every element whose `xsi:type` names an ID type; an
 *   element under `skip` is not assessed and holds none. A value is refused when two of them share
 *   it and at least one is held by `xsi:type` (the element's own value, or an attribute a derived
 *   type adds): two plain ID attributes sharing one stay the id rules' of the kinds.
 */
import { Option, Result } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import { collapse } from "#pantry/import/whitespace.ts";
import { addedAttributes, validLocal } from "#pantry/import/xsi-types.ts";
import { anyUri, ncNameContinuation, ncNameStart } from "#pantry/schema/patterns.ts";
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import type { AttributeUseRow, TypeDerivationRow, TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  declaredChild,
  declaredRoot,
  namedTypes,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";

/**
 * How the wildcard that holds an element processes it: the mode of its nearest wildcard ancestor,
 * `none` outside wildcard content.
 */
export type ProcessMode = "lax" | "none" | "skip" | "strict";

/**
 * The namespace bindings in scope at an element: a prefix to its namespace, the default namespace
 * under the empty prefix.
 */
export type Scope = ReadonlyMap<string, string>;

/**
 * One of the three attributes this module judges, as written.
 */
export interface XsiRow {
  readonly local: "nil" | "noNamespaceSchemaLocation" | "type";
  readonly prefix: string;
  readonly value: string;
}

/**
 * An attribute a derived `xsi:type` adds to its element, as written: the shape of the fields of
 * `XsiTypeAttribute` the element decides (the caller adds the node and the kind).
 */
export interface XsiAddedRow {
  readonly local: string;
  readonly namespace: string;
  readonly prefix: string;
  readonly value: string;
}

/**
 * What one element writes: its rows of the three attributes and the attributes its `xsi:type` adds.
 */
export interface ElementXsi {
  readonly added: readonly XsiAddedRow[];
  readonly rows: readonly XsiRow[];
}

/**
 * What one element of a tree writes, with its kind.
 */
export interface NodeXsi extends ElementXsi {
  readonly kind: string;
}

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

const xmlnsNamespace = typeNamespaces.xmlns;

const xmlNamespace = typeNamespaces.xml;

const xsNamespace = typeNamespaces.xs;

/**
 * The kind a foreign element has.
 */
const foreignKind = "foreign";

const rowNames: ReadonlySet<string> = new Set(["nil", "noNamespaceSchemaLocation", "type"]);

const ncName = `[${ncNameStart}][${ncNameContinuation}]*`;

/**
 * Namespaces in XML's QName production, with no length bound.
 */
const qNamePattern = new RegExp(`^(?:(${ncName}):)?(${ncName})$`, "u");

const anyUriPattern = new RegExp(anyUri, "u");

const booleanPattern = /^(?:true|false|1|0)$/u;

const refuse = (rule: Rule, detail: string): ImportRefused => new ImportRefused({ detail, rule });

const typeKey = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

const nameKey = (namespace: string, local: string): string => `{${namespace}}${local}`;

const describe = (type: TypeKey): string =>
  "anonymous" in type ? `the anonymous type ${type.anonymous}` : `{${type.namespace}}${type.local}`;

const builtin = (local: string): TypeKey => ({ local, namespace: xsNamespace });

const idType = builtin("ID");

const isAnyType = (type: TypeKey): boolean => typeKey(type) === typeKey(builtin("anyType"));

/**
 * The rows of one schema set and version, indexed.
 */
interface Tables {
  /**
   * A parent type and an element name to the element's declared type.
   */
  readonly children: ReadonlyMap<string, TypeKey>;
  readonly derivations: ReadonlyMap<string, TypeDerivationRow>;
  readonly names: ReadonlySet<string>;
  readonly roots: ReadonlyMap<string, TypeKey>;
  readonly uses: ReadonlyMap<string, readonly AttributeUseRow[]>;
}

const blockOf = (row: {
  readonly set: SchemaSetHandle;
  readonly version: SchemaVersionHandle;
}): string => `${row.set}/${row.version}`;

const memo = new Map<string, Tables>();

const buildTables = (block: string): Tables => {
  const here = (row: Parameters<typeof blockOf>[0]): boolean => blockOf(row) === block;
  const uses = new Map<string, AttributeUseRow[]>();

  for (const row of attributeUse.filter(here)) {
    const list = uses.get(typeKey(row.type)) ?? [];

    list.push(row);
    uses.set(typeKey(row.type), list);
  }

  const children = new Map<string, TypeKey>();

  for (const row of declaredChild.filter(here)) {
    const key = `${typeKey(row.parent)}|${nameKey(row.namespace, row.local)}`;

    if (!children.has(key)) {
      children.set(key, row.type);
    }
  }

  return {
    children,
    derivations: new Map(typeDerivation.filter(here).map((row) => [typeKey(row.type), row])),
    names: new Set(namedTypes.filter(here).map((row) => nameKey(row.namespace, row.local))),
    roots: new Map(
      declaredRoot.filter(here).map((row) => [nameKey(row.namespace, row.local), row.type]),
    ),
    uses,
  };
};

const tablesOf = (set: SchemaSetHandle, version: SchemaVersionHandle): Tables => {
  const block = `${set}/${version}`;
  const known = memo.get(block);

  if (known !== undefined) {
    return known;
  }

  const built = buildTables(block);

  memo.set(block, built);

  return built;
};

/**
 * Whether `type` is `base` or derives from it through `typeDerivation`; every type derives from
 * `xs:anyType`.
 */
const derivesFrom = (tables: Tables, type: TypeKey, base: TypeKey): boolean => {
  if (isAnyType(base)) {
    return true;
  }

  const target = typeKey(base);
  const seen = new Set<string>();
  let current: TypeKey | undefined = type;

  while (current !== undefined) {
    const key = typeKey(current);

    if (key === target) {
      return true;
    }

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    current = tables.derivations.get(key)?.base;
  }

  return false;
};

/**
 * The text of an element, collapsed.
 */
const collapsedText = (element: Element): string =>
  collapse(element.children.map((child) => (child.kind === "text" ? child.value : "")).join(""));

/**
 * Why a value does not name a type, with the clause of Element Locally Valid (Element) it breaks.
 */
interface Unresolved {
  readonly clause: "4.1" | "4.2";
  readonly reason: string;
}

/**
 * The type an `xsi:type` value names (QName resolution (Instance), 3.15.4), or why it names none.
 */
const resolveType = (
  value: string,
  scope: Scope,
  tables: Tables,
): Result.Result<TypeKey, Unresolved> => {
  const collapsed = collapse(value);
  const match = qNamePattern.exec(collapsed);

  if (match === null) {
    return Result.fail({ clause: "4.1", reason: `"${collapsed}" is not a QName` });
  }

  const [, prefix = "", local = ""] = match;
  const namespace = scope.get(prefix);

  if (namespace === undefined && prefix !== "") {
    return Result.fail({
      clause: "4.1",
      reason: `the prefix "${prefix}" of "${collapsed}" is not bound`,
    });
  }

  const resolved = namespace ?? "";

  return tables.names.has(nameKey(resolved, local))
    ? Result.succeed({ local, namespace: resolved })
    : Result.fail({
        clause: "4.2",
        reason: `"${collapsed}" resolves to no type of the schema`,
      });
};

const elementClause = (clause: string): string =>
  `XML Schema Part 1, 3.3.4, Element Locally Valid (Element) clause ${clause}`;

/**
 * `ids` without the element's own value, for an element whose `xsi:type` names an ID type: the
 * ID pass has already refused a value two of them share.
 */
const othersIds = (
  ids: ReadonlySet<string>,
  tables: Tables,
  type: TypeKey,
  element: Element,
): ReadonlySet<string> => {
  if (!derivesFrom(tables, type, idType)) {
    return ids;
  }

  const own = collapsedText(element);

  return new Set([...ids].filter((value) => value !== own));
};

const toAddedRow = (row: XsiAddedRow): XsiAddedRow => ({
  local: row.local,
  namespace: row.namespace,
  prefix: row.prefix,
  value: row.value,
});

/**
 * An `xsi:type` on an element with the declared type `declared`.
 */
const judgeDeclared = (
  element: Element,
  value: string,
  declared: TypeKey,
  scope: Scope,
  ids: ReadonlySet<string>,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
): Result.Result<readonly XsiAddedRow[], ImportRefused> => {
  const tables = tablesOf(set, version);
  const resolved = resolveType(value, scope, tables);

  if (Result.isFailure(resolved)) {
    return Result.fail(
      refuse(
        "xsi-type",
        `xsi:type="${value}" on ${element.qname}: ${elementClause(resolved.failure.clause)}: ${resolved.failure.reason}`,
      ),
    );
  }

  const type = resolved.success;

  if (!derivesFrom(tables, type, declared)) {
    return Result.fail(
      refuse(
        "xsi-type",
        `xsi:type="${value}" on ${element.qname}: ${elementClause("4.3")}: ${describe(type)} is neither the declared type ${describe(declared)} nor derived from it`,
      ),
    );
  }

  if (typeKey(type) === typeKey(declared)) {
    return Result.succeed([]);
  }

  const detail = validLocal(
    element,
    type,
    declared,
    set,
    version,
    othersIds(ids, tables, type, element),
  );

  if (Option.isSome(detail)) {
    return Result.fail(
      refuse("xsi-type", `xsi:type="${value}" on ${element.qname}: ${detail.value}`),
    );
  }

  return Result.succeed(addedAttributes(element, type, declared, set, version).map(toAddedRow));
};

/**
 * An `xsi:type` on an element with no declaration: Schema-Validity Assessment (Element), clause
 * 1.2.
 */
const judgeUndeclared = (
  element: Element,
  value: string,
  process: ProcessMode,
  scope: Scope,
  ids: ReadonlySet<string>,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
): Result.Result<readonly XsiAddedRow[], ImportRefused> => {
  const tables = tablesOf(set, version);
  const resolved = resolveType(value, scope, tables);

  if (Result.isFailure(resolved)) {
    return process === "strict"
      ? Result.fail(
          refuse(
            "xsi-type",
            `xsi:type="${value}" on ${element.qname}: XML Schema Part 1, 3.3.4, Schema-Validity Assessment (Element) clause 1.1: no declaration is found for the element, its wildcard is strict, and ${resolved.failure.reason}`,
          ),
        )
      : Result.succeed([]);
  }

  const type = resolved.success;

  if (isAnyType(type) || tables.derivations.get(typeKey(type))?.variety !== "simple") {
    return Result.succeed([]);
  }

  const detail = validLocal(
    element,
    type,
    undefined,
    set,
    version,
    othersIds(ids, tables, type, element),
  );

  return Option.isSome(detail)
    ? Result.fail(refuse("xsi-type", `xsi:type="${value}" on ${element.qname}: ${detail.value}`))
    : Result.succeed([]);
};

/**
 * What one element writes for its `xsi:type`, `xsi:nil` and `xsi:noNamespaceSchemaLocation`, or why
 * the element is refused. Every value is judged after `collapse` and written as written.
 *
 * - `process` `skip`: nothing is judged (reading 47: "under `skip` the content is not assessed").
 * - `xsi:noNamespaceSchemaLocation`: valid anywhere when it is an `xs:anyURI`, else
 *   `attribute-lexical`.
 * - `xsi:nil`: refused under `xsi-nil` on an element with a declared type (no declaration is
 *   nillable; clause 3.1); on one with none, valid when it is an `xs:boolean`, else
 *   `attribute-lexical`.
 * - `xsi:type`: on an element with a declared type, it must name that type or one derived from it and
 *   the element must be valid against it, else `xsi-type`; on one with none, see the module
 *   comment.
 *
 * @param element - The element.
 * @param declared - The type the element is declared with, or `undefined`.
 * @param process - How the wildcard that holds the element processes it.
 * @param inScope - The namespace bindings in scope at the element, its own declarations included.
 * @param ids - The ID values the document holds (`judgeTree` collects them).
 * @param set - The schema set whose tables hold the types.
 * @param version - The schema version.
 * @returns The element's rows and the attributes its `xsi:type` adds, or the refusal.
 */
export const judgeXsi = (
  element: Element,
  declared: TypeKey | undefined,
  process: ProcessMode,
  inScope: Scope,
  ids: ReadonlySet<string>,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
): Result.Result<ElementXsi, ImportRefused> => {
  const attributes = element.attributes.filter(
    (attribute) => attribute.namespace === xsiNamespace && rowNames.has(attribute.local),
  );
  const rows = attributes.map((attribute): XsiRow => ({
    local:
      attribute.local === "nil" || attribute.local === "type"
        ? attribute.local
        : "noNamespaceSchemaLocation",
    prefix: attribute.prefix,
    value: attribute.value,
  }));
  let added: readonly XsiAddedRow[] = [];

  if (process === "skip") {
    return Result.succeed({ added, rows });
  }

  for (const attribute of attributes) {
    if (
      attribute.local === "noNamespaceSchemaLocation" &&
      !anyUriPattern.test(collapse(attribute.value))
    ) {
      return Result.fail(
        refuse(
          "attribute-lexical",
          `xsi:noNamespaceSchemaLocation="${attribute.value}" on ${element.qname} is not an xs:anyURI`,
        ),
      );
    }

    if (attribute.local === "nil") {
      if (declared !== undefined) {
        return Result.fail(
          refuse(
            "xsi-nil",
            `xsi:nil="${attribute.value}" on ${element.qname}: XML Schema Part 1, 3.3.4, Element Locally Valid (Element) clause 3.1: the element is declared with ${describe(declared)}, which is not nillable`,
          ),
        );
      }

      if (!booleanPattern.test(collapse(attribute.value))) {
        return Result.fail(
          refuse(
            "attribute-lexical",
            `xsi:nil="${attribute.value}" on ${element.qname} is not an xs:boolean`,
          ),
        );
      }
    }

    if (attribute.local === "type") {
      const judged =
        declared === undefined
          ? judgeUndeclared(element, attribute.value, process, inScope, ids, set, version)
          : judgeDeclared(element, attribute.value, declared, inScope, ids, set, version);

      if (Result.isFailure(judged)) {
        return Result.fail(judged.failure);
      }

      added = judged.success;
    }
  }

  return Result.succeed({ added, rows });
};

/**
 * One element of the walk, with what the judgment needs to know of it.
 */
interface Visit {
  readonly declared: TypeKey | undefined;
  readonly element: Element;
  readonly kind: string;
  readonly mode: ProcessMode;
  readonly scope: Scope;
}

const baseScope: Scope = new Map([["xml", xmlNamespace]]);

/**
 * The scope below an element: its parent's, with the namespace declarations it makes.
 */
const scopeOf = (parent: Scope, element: Element): Scope => {
  const declarations = element.attributes.filter(
    (attribute) => attribute.namespace === xmlnsNamespace,
  );

  if (declarations.length === 0) {
    return parent;
  }

  const next = new Map(parent);

  for (const declaration of declarations) {
    next.set(declaration.prefix === "xmlns" ? declaration.local : "", declaration.value);
  }

  return next;
};

/**
 * The declared type of an element given its parent's: a foreign element has none (a foreign
 * element that is an opaque global, decision 99, has none too: its content is stored opaque and
 * not validated); any other takes the type of its particle in the parent's type, or, failing that,
 * its global declaration.
 */
const declaredOf = (
  tables: Tables,
  element: Element,
  kind: string,
  parent: TypeKey | undefined,
): TypeKey | undefined => {
  if (kind === foreignKind) {
    return undefined;
  }

  const name = nameKey(element.namespace, element.local);

  return (
    (parent === undefined ? undefined : tables.children.get(`${typeKey(parent)}|${name}`)) ??
    tables.roots.get(name)
  );
};

/**
 * Every element of the tree in document order, with its declared type, mode and scope.
 */
const visitTree = (
  root: Element,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  kindOf: (element: Element) => string,
  modeOf: (element: Element) => ProcessMode,
): readonly Visit[] => {
  const tables = tablesOf(set, version);
  const visits: Visit[] = [];
  const visit = (element: Element, parent: TypeKey | undefined, parentScope: Scope): void => {
    const kind = kindOf(element);
    const declared = declaredOf(tables, element, kind, parent);
    const scope = scopeOf(parentScope, element);

    visits.push({ declared, element, kind, mode: modeOf(element), scope });

    for (const child of element.children) {
      if (child.kind === "element") {
        visit(child, declared, scope);
      }
    }
  };

  visit(root, undefined, baseScope);

  return visits;
};

/**
 * The declared type of every element of a tree that has one, as a validator finds it: the root's
 * from its global declaration; a child's from its particle in its parent's type; inside wildcard
 * content a typed global takes its global declaration and a foreign element has none ("no
 * declaration found").
 *
 * @param root - The root element.
 * @param set - The schema set.
 * @param version - The schema version.
 * @param kindOf - The kind of an element: `foreign` for a foreign element.
 * @returns The declared types, by element; an element with none is absent.
 */
export const declaredTypes = (
  root: Element,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  kindOf: (element: Element) => string,
): ReadonlyMap<Element, TypeKey> =>
  new Map(
    visitTree(root, set, version, kindOf, () => "none").flatMap(
      ({ declared, element }): [Element, TypeKey][] =>
        declared === undefined ? [] : [[element, declared]],
    ),
  );

/**
 * One occurrence of an ID value: an element that holds it, and whether `xsi:type` makes it an ID
 * (the element's own value, or an attribute a derived type adds).
 */
interface Occurrence {
  readonly owned: boolean;
  readonly where: string;
}

/**
 * The governing type of an element's attributes: the type its `xsi:type` names when that type is
 * derived from the declared one, else the declared type.
 */
const governingOf = (visit: Visit, tables: Tables): TypeKey | undefined => {
  const { declared, element, scope } = visit;
  const attribute = element.attributes.find(
    (candidate) => candidate.namespace === xsiNamespace && candidate.local === "type",
  );

  if (declared === undefined || attribute === undefined) {
    return declared;
  }

  const resolved = resolveType(attribute.value, scope, tables);

  return Result.isSuccess(resolved) && derivesFrom(tables, resolved.success, declared)
    ? resolved.success
    : declared;
};

/**
 * The ID occurrences of one element: the attributes typed `xs:ID`, and `xs:ID`-typed content named
 * by `xsi:type`.
 */
const occurrencesOf = (
  visit: Visit,
  tables: Tables,
): readonly (readonly [string, Occurrence])[] => {
  const { declared, element, scope } = visit;
  const governing = governingOf(visit, tables);
  const held = new Set(
    (declared === undefined ? [] : (tables.uses.get(typeKey(declared)) ?? [])).map((use) =>
      nameKey(use.namespace, use.local),
    ),
  );
  const uses = governing === undefined ? [] : (tables.uses.get(typeKey(governing)) ?? []);
  const derived =
    governing !== undefined && declared !== undefined && typeKey(governing) !== typeKey(declared);
  const found: (readonly [string, Occurrence])[] = [];

  for (const attribute of element.attributes) {
    const isId =
      (attribute.namespace === xmlNamespace && attribute.local === "id") ||
      uses.some(
        (use) =>
          use.namespace === attribute.namespace &&
          use.local === attribute.local &&
          derivesFrom(tables, use.attributeType, idType),
      );

    if (isId) {
      found.push([
        collapse(attribute.value),
        {
          owned: derived && !held.has(nameKey(attribute.namespace, attribute.local)),
          where: `the attribute ${attribute.qname} of ${element.qname}`,
        },
      ]);
    }
  }

  const type = element.attributes.find(
    (attribute) => attribute.namespace === xsiNamespace && attribute.local === "type",
  );
  const resolved = type === undefined ? undefined : resolveType(type.value, scope, tables);

  if (
    resolved !== undefined &&
    Result.isSuccess(resolved) &&
    derivesFrom(tables, resolved.success, idType) &&
    (declared === undefined || derivesFrom(tables, resolved.success, declared))
  ) {
    found.push([collapsedText(element), { owned: true, where: `the content of ${element.qname}` }]);
  }

  return found;
};

/**
 * The document's ID values (Validation Root Valid (ID/IDREF), 3.3.4), or the refusal of one that
 * `xsi:type` makes an ID and another also holds.
 */
const collectIds = (
  visits: readonly Visit[],
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
): Result.Result<ReadonlySet<string>, ImportRefused> => {
  const tables = tablesOf(set, version);
  const held = new Map<string, Occurrence[]>();
  const order: (readonly [string, Occurrence])[] = [];

  for (const visit of visits) {
    if (visit.mode === "skip") {
      continue;
    }

    for (const [value, occurrence] of occurrencesOf(visit, tables)) {
      order.push([value, occurrence]);
      held.set(value, [...(held.get(value) ?? []), occurrence]);
    }
  }

  for (const [value, occurrence] of order) {
    const holders = held.get(value) ?? [];

    if (occurrence.owned && holders.length > 1) {
      return Result.fail(
        refuse(
          "xsi-type",
          `the ID "${value}" is held by ${holders.map((holder) => holder.where).join(" and ")}: XML Schema Part 1, 3.3.4, Validation Root Valid (ID/IDREF) clause 1: an ID value is held by one element`,
        ),
      );
    }
  }

  return Result.succeed(new Set(held.keys()));
};

/**
 * The `xsi` judgment of a whole tree, in document order: first the document's ID values, then
 * `judgeXsi` on each element.
 *
 * @param root - The root element.
 * @param set - The schema set the document is read under.
 * @param version - The schema version.
 * @param kindOf - The kind of an element: `foreign` for a foreign element.
 * @param modeOf - An element's process mode: `strict`, `lax` or `skip` from its nearest wildcard
 *   ancestor, `none` outside wildcard content.
 * @returns The rows each element writes, by element (an element that writes none is absent), or the
 *   first refusal.
 */
export const judgeTree = (
  root: Element,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  kindOf: (element: Element) => string,
  modeOf: (element: Element) => ProcessMode,
): Result.Result<ReadonlyMap<Element, NodeXsi>, ImportRefused> => {
  const visits = visitTree(root, set, version, kindOf, modeOf);
  const ids = collectIds(visits, set, version);

  if (Result.isFailure(ids)) {
    return Result.fail(ids.failure);
  }

  const judged = new Map<Element, NodeXsi>();

  for (const { declared, element, kind, mode, scope } of visits) {
    const result = judgeXsi(element, declared, mode, scope, ids.success, set, version);

    if (Result.isFailure(result)) {
      return Result.fail(result.failure);
    }

    if (result.success.rows.length > 0 || result.success.added.length > 0) {
      judged.set(element, { ...result.success, kind });
    }
  }

  return Result.succeed(judged);
};
