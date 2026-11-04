/**
 * The usage-data document's rows: the document itself, whose root is a `ud:usageData`, the
 * statistics under it with their target objects, and the value of an ordinary statistic or the
 * mapping of a categorized one.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { contentOf, elementChildren } from "#qti/import/leaf.ts";
import { NotQti3 } from "#qti/import/manifest.ts";
import {
  closedOf,
  collapse,
  kindOf,
  replace,
  Rows,
  treeRows,
  typedAttribute,
  UnmodeledVocabulary,
  valueText,
} from "#qti/import/tree.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import type { NodeIndex, WhiteSpace } from "#qti/import/tree.ts";
import {
  GlossaryUri,
  ManifestIdentifier,
  PackagePath,
  StatisticContextUri,
  StatisticMeasure,
  StatisticName,
  UsageCaseCount,
  UsageFieldIdentifier,
  UsageMappingScore,
  UsagePartIdentifier,
  UsageValueToken,
} from "#qti/schema/contracts.ts";
import { BooleanLiteral, XsBoolean } from "#qti/schema/content/rosters.ts";
import { BaseType } from "#qti/schema/declaration.ts";
import { Document } from "#qti/schema/document.ts";
import { Edge } from "#qti/schema/node.ts";
import type { AttributeNameHandle, SchemaVersionHandle } from "#qti/schema/node.ts";
import * as ud from "#qti/schema/usage.ts";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";

type BaseTypeHandle = (typeof BaseType.handles)[number];

const usageNamespace = "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0";

/**
 * What the caller knows about a usage-data document: the package that lists it, where, the resource
 * that names it and that resource's type, and the schema version of the package.
 */
export interface UsageInput {
  readonly package: string;
  readonly path: string;
  readonly resource: string;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * Narrow a lexical form to the column type of a row the importer builds before the database
 * judges the form.
 *
 * The column's pattern refuses a form that does not fit at commit, which is the importer's refusal
 * for it (spec 3.9, 4.5); the cast narrows only the type.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * The row of a typed `ud:value` in the arm of each base type but boolean, which `valueRows`
 * narrows to its roster first.
 */
const typedArmRows: Record<
  Exclude<BaseTypeHandle, "boolean">,
  (rows: Rows, id: string, text: string) => Rows
> = {
  directedPair: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueDirectedPair, [{ id, value: judgedLater(text) }]),
  duration: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueDuration, [{ id, value: judgedLater(text) }]),
  file: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueFile, [{ id, value: judgedLater(text) }]),
  float: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueFloat, [{ id, value: judgedLater(text) }]),
  identifier: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueIdentifier, [{ id, value: judgedLater(text) }]),
  integer: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueInteger, [{ id, value: judgedLater(text) }]),
  pair: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValuePair, [{ id, value: judgedLater(text) }]),
  point: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValuePoint, [{ id, value: judgedLater(text) }]),
  string: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueString, [{ id, value: judgedLater(text) }]),
  uri: (rows, id, text) =>
    Rows.add(rows, ud.relations.UsageTypedValueUri, [{ id, value: judgedLater(text) }]),
};

/**
 * The lexical value of an element's unprefixed attribute, none when it is not written.
 */
const written = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === name),
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * The first element of `element`'s subtree, itself included, whose `objectType` or `baseType` names
 * no handle of its roster, in document order.
 */
const search = (element: Element): Option.Option<Element> => {
  const outside = (name: string, handles: readonly string[]): boolean => {
    const lexical = written(element, name);

    return Option.isSome(lexical) && !handles.includes(lexical.value);
  };
  if (
    (element.local === "targetObject" && outside("objectType", ud.TargetObjectType.handles)) ||
    (element.local === "value" && outside("baseType", BaseType.handles))
  ) {
    return Option.some(element);
  }

  return (
    elementChildren(element)
      .map((child) => search(child))
      .find(Option.isSome) ?? Option.none()
  );
};

/**
 * The first `objectType` or `baseType` of the document that names no handle of its roster, in
 * document order.
 */
const firstOutsideRoster = (root: Element): Option.Option<UnmodeledVocabulary> => {
  const found = search(root);

  return found.pipe(
    Option.map(
      (element) =>
        new UnmodeledVocabulary({
          kind: "attribute",
          name: element.local === "targetObject" ? "objectType" : "baseType",
          parent: Option.some(element.qname),
        }),
    ),
  );
};

/**
 * Write the rows of a usage-data document: its tree, its `Document` row and the usage-data rows.
 *
 * Every attribute is processed under its class through the tree module's `typedAttribute`, which
 * keeps the lexical form where processing changed it. The document has no identifier and no title
 * row. A statistic's `UsageValue` holds the text content after `replace`. Where `baseType` is
 * written, `UsageTypedValue` copies that same text (the schema's containment in `UsageValue`) and
 * its arm row holds `valueText`'s reading of it, trimmed for every base type but `string`, which
 * the arm's pattern judges at commit.
 *
 * @param doc - The decoded document.
 * @param input - Where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this document's added and the node index of its tree; `NotQti3` for a
 *   root that is not `usageData` in the QTI 3 usage-data namespace, naming what the root is;
 *   `UnmodeledVocabulary` for an `objectType` or a `baseType` naming nothing the roster holds, and
 *   for any element or attribute the registries do not model.
 */
export const usageRows = Effect.fn("import.usageRows")(function* usageRows(
  doc: XmlDocument,
  input: UsageInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex },
  ImportRefused | NotQti3 | UnmodeledVocabulary
> {
  const { root } = doc;
  if (root.namespace !== usageNamespace || root.local !== "usageData") {
    return yield* new NotQti3({
      detail: `the usage-data root is {${root.namespace}}${root.local}, and a QTI 3 usage-data root is {${usageNamespace}}usageData`,
    });
  }

  const outside = firstOutsideRoster(root);
  if (Option.isSome(outside)) {
    return yield* outside.value;
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    {
      charset: doc.charset,
      id: documentId,
      kind: "document",
      root: "usagedata",
      version: input.version,
    },
    rows,
  );
  const { nodes } = tree;
  const positions = new Map(Rows.of(tree.rows, Edge).map((edge) => [edge.child, edge.position]));
  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: input.package,
      path: PackagePath(input.path),
      resource: ManifestIdentifier(input.resource),
      resourceType: input.resourceType,
      root: "usagedata",
      version: input.version,
    },
  ]);

  const add = <R extends AnyRelation>(relation: R, facts: readonly Fact<R>[]): void => {
    built = Rows.add(built, relation, facts);
  };
  const read = (
    element: Element,
    name: AttributeNameHandle,
    whiteSpace: WhiteSpace,
  ): Option.Option<string> => {
    const node = nodes.get(element);
    const lexical = written(element, name);
    if (node === undefined || Option.isNone(lexical)) {
      return Option.none();
    }

    const processed = typedAttribute(built, node.id, node.kind, name, lexical.value, whiteSpace);
    built = processed.rows;

    return Option.some(processed.value);
  };
  const exact = (
    element: Element,
    name: AttributeNameHandle,
  ): Effect.Effect<Option.Option<string>, ImportRefused> => {
    const lexical = written(element, name);
    if (Option.isSome(lexical) && /^[ \t\n\r]|[ \t\n\r]$/u.test(lexical.value)) {
      return Effect.fail(
        new ImportRefused({
          detail: `the ${name} attribute of ud:${element.local} is ${JSON.stringify(lexical.value)}, which has whitespace before or after the value; an attribute value is read exactly as written, so remove the spaces, tabs or line ends around it.`,
          rule: "usage-lexical",
        }),
      );
    }

    return Effect.succeed(read(element, name, "collapse"));
  };
  const optional = <R extends AnyRelation>(
    relation: R,
    element: Element,
    name: AttributeNameHandle,
    whiteSpace: WhiteSpace,
    make: (node: string, value: string) => Fact<R>,
  ): void => {
    const value = read(element, name, whiteSpace);
    const node = nodes.get(element);
    if (Option.isSome(value) && node !== undefined) {
      add(relation, [make(node.id, value.value)]);
    }
  };
  const positionOf = (id: string): bigint => positions.get(id) ?? 0n;

  const targetObjectRows = (element: Element, statistic: string): void => {
    const node = nodes.get(element);
    if (node === undefined) {
      return;
    }

    add(ud.TargetObject, [
      {
        id: node.id,
        identifier: judgedLater(
          Option.getOrElse(read(element, "identifier", "preserve"), () => ""),
        ),
        position: positionOf(node.id),
        statistic,
      },
    ]);
    optional(ud.TargetObjectPartIdentifier, element, "partIdentifier", "collapse", (id, value) => ({
      node: id,
      value: UsagePartIdentifier(value),
    }));

    const objectType = read(element, "objectType", "preserve");
    const handle = ud.TargetObjectType.handles.find(
      (known) => Option.isSome(objectType) && known === objectType.value,
    );
    if (handle !== undefined) {
      add(ud.TargetObjectObjectType, [{ node: node.id, value: handle }]);
    }
  };

  const valueRows = Effect.fn("import.usage.valueRows")(function* valueRows(
    element: Element,
    statistic: string,
  ): Effect.fn.Return<void, ImportRefused> {
    const node = nodes.get(element);
    if (node === undefined) {
      return;
    }

    const content = contentOf(element);
    add(ud.UsageValue, [
      {
        collapsed: UsageValueToken(collapse(content)),
        id: node.id,
        statistic,
        value: judgedLater(replace(content)),
      },
    ]);
    optional(ud.UsageValueFieldIdentifier, element, "fieldIdentifier", "collapse", (id, value) => ({
      id,
      value: UsageFieldIdentifier(value),
    }));

    const lexical = read(element, "baseType", "preserve");
    const baseType = BaseType.handles.find(
      (known) => Option.isSome(lexical) && known === lexical.value,
    );
    if (baseType !== undefined) {
      const typed = valueText(baseType, replace(content));
      add(ud.UsageValueBaseType, [{ baseType, id: node.id }]);
      add(ud.UsageTypedValue, [{ baseType, id: node.id, value: judgedLater(replace(content)) }]);
      if (baseType === "boolean") {
        const literal = yield* closedOf(
          BooleanLiteral.handles,
          typed,
          "usage-typed-value",
          'a boolean ud:value with baseType="boolean"',
        );
        add(ud.relations.UsageTypedValueBoolean, [{ id: node.id, value: literal }]);
      } else {
        built = typedArmRows[baseType](built, node.id, typed);
      }
    }
  });

  const mappingRows = Effect.fn("import.usage.mappingRows")(function* mappingRows(
    element: Element,
    statistic: string,
  ): Effect.fn.Return<void, ImportRefused> {
    const node = nodes.get(element);
    if (node === undefined) {
      return;
    }

    const defaultValue = yield* exact(element, "defaultValue");
    const lowerBound = yield* exact(element, "lowerBound");
    const upperBound = yield* exact(element, "upperBound");
    add(ud.UsageMapping, [
      {
        defaultValue: UsageMappingScore(Option.getOrElse(defaultValue, () => "0")),
        id: node.id,
        statistic,
      },
    ]);
    if (Option.isSome(defaultValue)) {
      add(ud.DeclaredDefaultValue, [{ node: node.id }]);
    }

    if (Option.isSome(lowerBound)) {
      add(ud.UsageMappingLowerBound, [
        { node: node.id, value: UsageMappingScore(lowerBound.value) },
      ]);
    }

    if (Option.isSome(upperBound)) {
      add(ud.UsageMappingUpperBound, [
        { node: node.id, value: UsageMappingScore(upperBound.value) },
      ]);
    }

    for (const entry of elementChildren(element)) {
      const entryNode = nodes.get(entry);
      if (entryNode?.kind !== "ud:mapEntry") {
        continue;
      }

      const mappedValue = yield* exact(entry, "mappedValue");
      add(ud.UsageMapEntry, [
        {
          id: entryNode.id,
          mapKey: judgedLater(Option.getOrElse(read(entry, "mapKey", "replace"), () => "")),
          mappedValue: UsageMappingScore(Option.getOrElse(mappedValue, () => "")),
          mapping: node.id,
          position: positionOf(entryNode.id),
        },
      ]);

      const caseSensitive = read(entry, "caseSensitive", "collapse");
      if (Option.isSome(caseSensitive)) {
        const closed = yield* closedOf(
          XsBoolean.handles,
          caseSensitive.value,
          "attribute-lexical",
          "the caseSensitive attribute of ud:mapEntry",
        );
        add(ud.UsageMapEntryCaseSensitive, [{ node: entryNode.id, value: closed }]);
      }
    }
  });

  const statisticRows = Effect.fn("import.usage.statisticRows")(function* statisticRows(
    element: Element,
    usageData: string,
  ): Effect.fn.Return<void, ImportRefused> {
    const node = nodes.get(element);
    if (node === undefined) {
      return;
    }

    const kind = node.kind === "ud:ordinaryStatistic" ? "ordinary" : "categorized";
    add(ud.Statistic, [
      {
        context: StatisticContextUri(
          Option.getOrElse(read(element, "context", "collapse"), () => ""),
        ),
        id: node.id,
        kind,
        name: StatisticName(Option.getOrElse(read(element, "name", "collapse"), () => "")),
        position: positionOf(node.id),
        usageData,
      },
    ]);
    if (kind === "ordinary") {
      add(ud.OrdinaryStatisticArm, [{ id: node.id }]);
    } else {
      add(ud.CategorizedStatisticArm, [{ id: node.id }]);
    }

    optional(ud.StatisticGlossary, element, "glossary", "collapse", (id, value) => ({
      node: id,
      value: GlossaryUri(value),
    }));
    optional(ud.StatisticCaseCount, element, "caseCount", "collapse", (id, value) => ({
      node: id,
      value: UsageCaseCount(judgedLater(value)),
    }));
    optional(ud.StatisticStdError, element, "stdError", "collapse", (id, value) => ({
      node: id,
      value: StatisticMeasure(value),
    }));
    optional(ud.StatisticStdDeviation, element, "stdDeviation", "collapse", (id, value) => ({
      node: id,
      value: StatisticMeasure(value),
    }));
    optional(ud.StatisticLastUpdated, element, "lastUpdated", "collapse", (id, value) => ({
      node: id,
      value: judgedLater(value),
    }));

    for (const child of elementChildren(element)) {
      const kindHere = Option.getOrUndefined(
        Option.fromNullishOr(nodes.get(child)).pipe(Option.map((found) => found.kind)),
      );
      if (kindHere === "ud:targetObject") {
        targetObjectRows(child, node.id);
      } else if (kindHere === "ud:value") {
        yield* valueRows(child, node.id);
      } else if (kindHere === "ud:mapping") {
        yield* mappingRows(child, node.id);
      }
    }
  });

  add(ud.UsageData, [{ document: documentId, id: documentId }]);
  optional(ud.UsageDataGlossary, root, "glossary", "collapse", (id, value) => ({
    node: id,
    value: GlossaryUri(value),
  }));
  for (const child of elementChildren(root)) {
    const kind = Option.getOrUndefined(kindOf(child, Option.some("ud:usageData")));
    if (kind === "ud:ordinaryStatistic" || kind === "ud:categorizedStatistic") {
      yield* statisticRows(child, documentId);
    }
  }

  return { nodes, rows: built };
});
