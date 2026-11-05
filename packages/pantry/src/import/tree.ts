/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The tree-level half of the importer: the rows every tree has beside its nodes, the lookup that
 * names an element's kind, the refusal for vocabulary no registry models, the refusal for an item
 * whose bindings do not hold together, the walk that pairs every element with its parent, and the
 * whitespace helpers every typed attribute passes through.
 *
 * {@link treeRows} also walks the root and writes every tree's node, edge, generic-arm, namespace,
 * attribute-reference and foreign rows; the kind-specific arms and typed attribute columns belong
 * to the modules that read the {@link NodeIndex} it returns.
 */
import type { AnyRelation, Fact, Uuid } from "@bjornpagen/grizzle";
import { Effect, Option, Result, Schema } from "effect";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { collapse, replace } from "#pantry/import/whitespace.ts";
import type { WhiteSpace } from "#pantry/import/whitespace.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import type { BaseType } from "#pantry/schema/declaration.ts";
import { YesNo } from "#pantry/schema/content/rosters.ts";
import type { YesNoHandle } from "#pantry/schema/content/rosters.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import type { RegistryRow } from "#pantry/schema/kinds/generic.ts";
import {
  Ancestry,
  AttributeEntityReference,
  AttributeLexical,
  AttributeSpelling,
  Comment,
  Edge,
  EntityReference,
  NamespaceDeclaration,
  Node,
  NodeKind,
  NoNamespaceSchemaLocation,
  Pi,
  SchemaLocation,
  TextNode,
  Tree,
  TreeDoctype,
  TreeExportCharset,
  TreeMisc,
  TreeRoot,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
  vocabularies,
  Ws,
  XsiNil,
  XsiType,
  XsiTypeAttribute,
} from "#pantry/schema/node.ts";
import type {
  AncestryHandle,
  AttributeNameHandle,
  NodeKindHandle,
  RootKindHandle,
  SchemaVersionHandle,
} from "#pantry/schema/node.ts";
import {
  NamespacePrefix,
  NamespaceUri,
  PiTarget,
  XmlEntityName,
  XmlLocalName,
} from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { FLAGS, handleOf, KindEnters } from "#pantry/schema/seed/ancestry.ts";
import type { Flag } from "#pantry/schema/seed/ancestry.ts";
import { foreignRows, schemaSetOf } from "#pantry/import/foreign.ts";
import { classifyAttribute, classifyElement, scopeOf } from "#pantry/import/wildcard.ts";
import type { Scope } from "#pantry/import/wildcard.ts";
import { judgeTree } from "#pantry/import/xsi.ts";
import type { NodeXsi, ProcessMode } from "#pantry/import/xsi.ts";
import { wildcardHost } from "#pantry/schema/seed/wildcard.ts";
import { exportCharset } from "@qti-pie/crust/charset.ts";
import type { Attribute, Child, Element, Misc, XmlDocument } from "@qti-pie/crust/tree.ts";

type BaseTypeHandle = (typeof BaseType.handles)[number];

/**
 * The process of each element wildcard host, by kind.
 */
const hostProcess: ReadonlyMap<string, ProcessMode> = new Map(
  wildcardHost.map((row) => [row.host, row.process]),
);

/**
 * The rows an import has built so far, by relation.
 *
 * Every import module appends to one of these and hands the result on; no function mutates the
 * map it is given.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Rows` is a type and the value of its functions under one name, so `Rows.empty()` and `Rows` as a parameter type read as one thing.
export type Rows = ReadonlyMap<AnyRelation, readonly object[]>;

/**
 * The functions over {@link Rows}.
 */
export const Rows = {
  /**
   * Append `facts` to `relation`'s rows.
   *
   * @param rows - The rows so far, left unchanged.
   * @param relation - The relation the facts belong to.
   * @param facts - The facts to append after the relation's existing rows.
   * @returns A new set of rows holding the facts.
   */
  add: <R extends AnyRelation>(rows: Rows, relation: R, facts: readonly Fact<R>[]): Rows =>
    new Map(rows).set(relation, [...(rows.get(relation) ?? []), ...facts]),

  /**
   * No rows.
   */
  empty: (): Rows => new Map(),

  /**
   * Read `relation`'s rows.
   *
   * The map stores each relation's rows under the relation they were added for, and `add` takes
   * only that relation's facts, so the rows read back are the facts of `relation`.
   *
   * @param rows - The rows so far.
   * @param relation - The relation to read.
   * @returns Its rows in the order they were added, none when it has none.
   */
  of: <R extends AnyRelation>(rows: Rows, relation: R): readonly Fact<R>[] =>
    // SAFETY: the map is heterogeneous by relation and `add` is its only writer, which types each relation's facts, so the rows under `relation` are its facts.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    (rows.get(relation) ?? []) as readonly Fact<R>[],
};

/**
 * What the walk keeps of an element's node: its id, its kind, and the ancestry it sits in.
 */
export interface IndexedNode {
  readonly ancestry: AncestryHandle;
  readonly id: Uuid;
  readonly kind: NodeKindHandle;
}

/**
 * The node each element of a tree became, keyed by the tree's own `Element` objects by identity, so
 * later modules attach arm rows to the elements they walk.
 */
export type NodeIndex = ReadonlyMap<Element, IndexedNode>;

/**
 * What the caller of {@link treeRows} decides about a tree: its id, which is also its root node's
 * id, whether it is a document or a manifest, its schema version, its root kind and the charset its
 * bytes were decoded from.
 */
export interface TreeInput {
  readonly charset: string;
  readonly id: Uuid;
  readonly kind: "document" | "manifest";
  readonly root: RootKindHandle;
  readonly version: SchemaVersionHandle;
}

/**
 * The document holds an element or an attribute that no kinds file models yet.
 *
 * `name` is the qualified name as written; for an attribute `parent` is the element that carries it
 * and for an element it is the enclosing element, `None` for the root.
 */
export class UnmodeledVocabulary extends Schema.TaggedError<UnmodeledVocabulary>()(
  "UnmodeledVocabulary",
  {
    kind: Schema.Literals(["element", "attribute"]),
    name: Schema.String,
    parent: Schema.Option(Schema.String),
  },
) {}

/**
 * An item the importer reads but whose bindings do not hold together.
 *
 * `rule` names the importer rule the item breaks and `detail` says which part of the item does. The
 * rule may be a schema law's name when the importer meets that law first, as `ancestry-ban` for a
 * gap that has no gap-match interaction to own it, and `admission` for a choice-like child that
 * no interaction owns.
 */
export class ItemRefusal extends Schema.TaggedError<ItemRefusal>()("ItemRefusal", {
  detail: Schema.String,
  rule: Schema.Literals([
    "binding-declared",
    "typed-copy",
    "ancestry-ban",
    "admission",
    "required-attribute",
  ]),
}) {}

/**
 * Every element of `element`'s subtree beside its parent element, in document order.
 */
export const withParents = (
  element: Element,
  parent: Option.Option<Element>,
): readonly (readonly [Element, Option.Option<Element>])[] => [
  [element, parent],
  ...element.children.flatMap((child) =>
    child.kind === "element" ? withParents(child, Option.some(element)) : [],
  ),
];

/**
 * The value a typed `qti-value` holds for the element text `text` of base type `baseType`.
 *
 * Decision 157, item 1: for a typed value written as element content, outer whitespace is
 * formatting, not meaning, so every base type but `string` is read with its leading and trailing
 * space, tab, line feed and carriage return removed; internal whitespace is untouched. A `string`
 * keeps its whitespace. `file` is trimmed, since only `string` is exempt.
 *
 * The source spelling stays in the document tree's own text rows (`TextNode`, `Ws` and
 * `EntityReference` children of the value node), which export renders, so a round trip reproduces
 * the padded spelling byte for byte.
 *
 * @param baseType - The value's base type.
 * @param text - The `replace`d text of the value node.
 * @returns The text the value's arm row holds.
 */
export const valueText = (baseType: BaseTypeHandle, text: string): string =>
  baseType === "string" ? text : text.replaceAll(/^[ \t\n\r]+|[ \t\n\r]+$/gu, "");

/**
 * The value a typed column holds for `lexical` under `whiteSpace`.
 */
const processed = (lexical: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return collapse(lexical);
  }

  return whiteSpace === "replace" ? replace(lexical) : lexical;
};

/**
 * Process one typed attribute's lexical value and keep the lexical form when processing changed it.
 *
 * @param rows - The rows so far.
 * @param node - The id of the element that carries the attribute.
 * @param kind - The element's kind.
 * @param name - The attribute's registry name.
 * @param lexical - The value as read.
 * @param whiteSpace - The attribute's whitespace class.
 * @returns The value for the typed column, and the rows with one `AttributeLexical` row appended
 *   exactly when `lexical` differs from that value.
 */
export const typedAttribute = (
  rows: Rows,
  node: Uuid,
  kind: NodeKindHandle,
  name: AttributeNameHandle,
  lexical: string,
  whiteSpace: WhiteSpace,
): { value: string; rows: Rows } => {
  const value = processed(lexical, whiteSpace);

  return value === lexical
    ? { rows, value }
    : {
        rows: Rows.add(rows, AttributeLexical, [{ attribute: name, kind, node, value: lexical }]),
        value,
      };
};

/**
 * The integer spaces {@link integerOf} reads: `xs:integer`, `xs:nonNegativeInteger` and
 * `xs:positiveInteger`.
 */
export type IntegerSpace = "integer" | "nonNegativeInteger" | "positiveInteger";

/**
 * The handle of a closed roster that `text` equals.
 *
 * @param handles - The roster's handles.
 * @param text - The attribute's text, as the caller processed it.
 * @param rule - The rule a refusal carries.
 * @param where - The element and attribute, in a short phrase, for the refusal's detail.
 * @returns The handle equal to `text`, or an `ImportRefused` under `rule` when none is.
 */
export const closedOf = <const Handle extends string>(
  handles: readonly Handle[],
  text: string,
  rule: Rule,
  where: string,
): Effect.Effect<Handle, ImportRefused> => {
  const handle = handles.find((member) => member === text);

  return handle === undefined
    ? Effect.fail(
        new ImportRefused({
          detail: `${where} is "${text}", which is not one of ${handles.map((member) => `"${member}"`).join(", ")}. Write exactly one of those values.`,
          rule,
        }),
      )
    : Effect.succeed(handle);
};

/**
 * The lexical form of each integer space, from XSD Part 2. A non-negative integer admits a minus
 * sign only on zero; a positive integer admits none, since its value is at least one.
 */
const integerForms: Readonly<Record<IntegerSpace, RegExp>> = {
  integer: /^[+-]?[0-9]+$/u,
  nonNegativeInteger: /^(?:\+?[0-9]+|-0+)$/u,
  positiveInteger: /^\+?[0-9]+$/u,
};

const integerNames: Readonly<Record<IntegerSpace, string>> = {
  integer: "an integer, optionally signed",
  nonNegativeInteger: "a whole number of zero or more",
  positiveInteger: "a whole number of one or more",
};

const smallest = -9_223_372_036_854_775_808n;

const largest = 9_223_372_036_854_775_807n;

/**
 * The integer `text` writes in `space`.
 *
 * @param text - The attribute's text, collapsed by the caller.
 * @param space - The integer space the attribute is declared in.
 * @param rule - The rule a refusal carries.
 * @param where - The element and attribute, in a short phrase, for the refusal's detail.
 * @returns The value, or an `ImportRefused` under `rule` when the text is outside the space or the
 *   value outside the signed 64-bit range.
 */
export const integerOf = (
  text: string,
  space: IntegerSpace,
  rule: Rule,
  where: string,
): Effect.Effect<bigint, ImportRefused> => {
  const refuse = (why: string) =>
    Effect.fail(new ImportRefused({ detail: `${where} is "${text}", ${why}.`, rule }));

  if (!integerForms[space].test(text)) {
    return refuse(`which is not ${integerNames[space]}. Write ${integerNames[space]}`);
  }

  const value = BigInt(text);

  if (space === "positiveInteger" && value < 1n) {
    return refuse(`which is not ${integerNames[space]}. Write ${integerNames[space]}`);
  }

  return value < smallest || value > largest
    ? refuse(`which is outside ${smallest} to ${largest}. Write a value inside that range`)
    : Effect.succeed(value);
};

/**
 * Read one integer attribute and keep its spelling when the package spells it non-canonically.
 *
 * Writes a spelling row exactly when the collapsed text parses and differs from
 * `String(parse(collapsed))`.
 *
 * @param rows - The rows so far.
 * @param node - The id of the element that carries the attribute.
 * @param kind - The element's kind.
 * @param name - The attribute's registry name.
 * @param text - The attribute's text after its whitespace step.
 * @param space - The integer space the attribute is declared in.
 * @param rule - The rule a refusal carries.
 * @param where - The element and attribute, in a short phrase, for the refusal's detail.
 * @returns The value, and the rows with one `AttributeSpelling` row appended exactly when
 *   `text` differs from `String(value)`; or an `ImportRefused` under `rule` when
 *   {@link integerOf} refuses the text.
 */
export const spelledInteger = (
  rows: Rows,
  node: Uuid,
  kind: NodeKindHandle,
  name: AttributeNameHandle,
  text: string,
  space: IntegerSpace,
  rule: Rule,
  where: string,
): Effect.Effect<{ value: bigint; rows: Rows }, ImportRefused> =>
  Effect.map(integerOf(text, space, rule, where), (value) => ({
    rows:
      text === String(value)
        ? rows
        : Rows.add(rows, AttributeSpelling, [{ attribute: name, kind, node, value: text }]),
    value,
  }));

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * A kind an element name can stand for, and the kind its parent must be when the handle is dotted.
 */
interface Candidate {
  readonly handle: NodeKindHandle;
  readonly parent: Option.Option<string>;
}

/**
 * The element-kind registry rows by handle, from the ten kinds files; the generic kinds are not
 * elements and are left out.
 */
const rowsByHandle: ReadonlyMap<string, RegistryRow> = new Map(
  vocabularies
    .flatMap((vocabulary) => Object.entries<RegistryRow>(vocabulary.registry))
    .filter(([, row]) => row.local !== ""),
);

/**
 * The `Ancestry` handle a flag set is named by, `None` when the set is one no tree can reach.
 */
const ancestryOf = (flags: readonly Flag[]): Option.Option<AncestryHandle> =>
  Option.fromNullishOr(Ancestry.handles.find((handle) => handle === handleOf(flags)));

/**
 * The flags in force under an element of `kind` that sits inside `flags`: those it sits inside and
 * the ones its kind enters.
 */
const enteredBy = (flags: readonly Flag[], kind: NodeKindHandle): readonly Flag[] =>
  FLAGS.filter((flag) => flags.includes(flag) || (KindEnters[kind] ?? []).includes(flag));

/**
 * The parent kinds, beside a dotted handle's registry `parent`, under which its element name also
 * resolves to that handle.
 *
 * A registry row names one parent, and the `Duration` container's `duration` child is the
 * `CharacterString` `lom:duration.string` under `lom:typicalLearningTime` as it is under
 * `lom:duration`.
 */
const alsoUnder: ReadonlyMap<string, readonly string[]> = new Map([
  ["lom:duration.string", ["lom:typicalLearningTime"]],
]);

const clark = (namespace: string, local: string): string => `{${namespace}}${local}`;

/**
 * The candidates of each `(namespace, local)` pair, built once from the registries.
 */
const candidates: ReadonlyMap<string, readonly Candidate[]> = (() => {
  const byName = new Map<string, Candidate[]>();
  for (const [key, row] of rowsByHandle) {
    const handle = NodeKind.handles.find((known) => known === key);
    if (handle !== undefined) {
      const name = clark(row.namespace, row.local);
      byName.set(name, [...(byName.get(name) ?? []), { handle, parent: row.parent }]);
    }
  }

  return byName;
})();

/**
 * The kind an element is, looked up by its namespace and local name; a dotted handle is chosen by
 * the kind of the element's parent.
 *
 * @param element - The element to classify.
 * @param parentKind - The kind of its parent, `None` for the root.
 * @returns The element's kind, `None` when no registry names it under that parent.
 */
export const kindOf = (
  element: Element,
  parentKind: Option.Option<NodeKindHandle>,
): Option.Option<NodeKindHandle> => {
  const named = candidates.get(clark(element.namespace, element.local)) ?? [];
  const dotted = named.find(
    (candidate) =>
      Option.isSome(candidate.parent) &&
      Option.isSome(parentKind) &&
      (candidate.parent.value === parentKind.value ||
        (alsoUnder.get(candidate.handle) ?? []).includes(parentKind.value)),
  );
  const plain = named.find((candidate) => Option.isNone(candidate.parent));

  return Option.fromNullishOr((dotted ?? plain)?.handle);
};

/**
 * The kind an element is under a parent of kind `parent`: `kindOf`'s answer, or inside wildcard
 * content the classification of `wildcard.ts`.
 */
const classified = (
  scope: Scope,
  element: Element,
  parent: Option.Option<NodeKindHandle>,
): Option.Option<NodeKindHandle> =>
  classifyElement(scope, element, parent, kindOf(element, parent));

/**
 * Whether an attribute of an element is passed over by the unmodeled-vocabulary check because a
 * derived `xsi:type` may add it.
 */
type AttributePass = (element: Element, attribute: Attribute) => boolean;

/**
 * The attributes the judgment says each element's `xsi:type` adds, by element: the ones the
 * unmodeled-vocabulary check passes over.
 */
const addedPass =
  (judged: ReadonlyMap<Element, NodeXsi>): AttributePass =>
  (element, attribute) =>
    (judged.get(element)?.added ?? []).some(
      (added) => added.namespace === attribute.namespace && added.local === attribute.local,
    );

/**
 * What the check passes over once the judgment has refused the tree: the judgment returns no added
 * attributes then, so every attribute of an element that carries `xsi:type` stays for the
 * judgment's refusal to name, which the caller raises when nothing else in the tree is unmodeled.
 */
const typedPass: AttributePass = (element) =>
  element.attributes.some(
    (attribute) => attribute.namespace === xsiNamespace && attribute.local === "type",
  );

/**
 * The first element or attribute of `element`'s subtree that no registry models and no wildcard
 * admits, in document order. An attribute in the XML namespace is modeled when its kind's registry
 * lists its prefixed name (`xml:lang`, `xml:base`); inside wildcard content an attribute is
 * classified by `wildcard.ts`. The four attributes XML Schema declares in the `xsi` namespace pass
 * on every element: `xsi:schemaLocation` is stored as written, the other three are judged by
 * `xsi.ts` once the walk has indexed the tree.
 * An element whose ancestry no `Ancestry` handle names is refused as an element: it sits inside a
 * combination of flags the model cannot hold.
 * An attribute `passes` names is not refused: the judgment of `xsi.ts` says a derived `xsi:type`
 * adds it, and `XsiTypeAttribute` stores it.
 */
const firstUnmodeled = (
  scope: Scope,
  element: Element,
  parent: Option.Option<{ readonly kind: NodeKindHandle; readonly name: string }>,
  flags: readonly Flag[],
  passes: AttributePass,
): Option.Option<UnmodeledVocabulary> => {
  const kind = classified(scope, element, parent.pipe(Option.map((above) => above.kind)));
  if (Option.isNone(kind) || Option.isNone(ancestryOf(flags))) {
    return Option.some(
      new UnmodeledVocabulary({
        kind: "element",
        name: element.qname,
        parent: parent.pipe(Option.map((above) => above.name)),
      }),
    );
  }

  const own = new Set(rowsByHandle.get(kind.value)?.attributes);
  const stray = element.attributes.find((attribute) => {
    const judged = classifyAttribute(scope, attribute, kind.value, own);

    return judged === "stray" && !passes(element, attribute);
  });
  if (stray !== undefined) {
    return Option.some(
      new UnmodeledVocabulary({
        kind: "attribute",
        name: stray.qname,
        parent: Option.some(element.qname),
      }),
    );
  }

  const here = Option.some({ kind: kind.value, name: element.qname });
  const inside = enteredBy(flags, kind.value);
  for (const child of element.children) {
    if (child.kind === "element") {
      const found = firstUnmodeled(scope, child, here, inside, passes);
      if (Option.isSome(found)) {
        return found;
      }
    }
  }

  return Option.none();
};

/**
 * The rows the walk of a tree's root collects, one list per relation, filled as it descends.
 */
interface Walked {
  readonly attributeReferences: Fact<typeof AttributeEntityReference>[];
  readonly comments: Fact<typeof Comment>[];
  readonly edges: Fact<typeof Edge>[];
  readonly entityReferences: Fact<typeof EntityReference>[];
  readonly namespaces: Fact<typeof NamespaceDeclaration>[];
  readonly nodes: Fact<typeof Node>[];
  readonly pis: Fact<typeof Pi>[];
  readonly noNamespaceSchemaLocations: Fact<typeof NoNamespaceSchemaLocation>[];
  readonly schemaLocations: Fact<typeof SchemaLocation>[];
  readonly texts: Fact<typeof TextNode>[];
  readonly whitespace: Fact<typeof Ws>[];
  readonly xsiNils: Fact<typeof XsiNil>[];
  readonly xsiTypes: Fact<typeof XsiType>[];
}

const nonWhitespace = /[^ \t\r\n]/u;

/**
 * Whether `value` is a non-empty run of whitespace, the shape `Ws` holds.
 */
const isWhitespaceRun = (value: string): value is Fact<typeof Ws>["value"] =>
  /^[ \t\r\n]+$/u.test(value);

/**
 * Keep the row of one attribute in the `xsi` namespace, as written, when it is one of the four XML
 * Schema declares; any other name is the wildcard classification's.
 */
const collectXsi = (
  walked: Walked,
  attribute: Attribute,
  node: Uuid,
  kind: NodeKindHandle,
): void => {
  const written = { node, prefix: NamespacePrefix(attribute.prefix), value: attribute.value };

  if (attribute.local === "schemaLocation") {
    walked.schemaLocations.push(written);
  } else if (attribute.local === "noNamespaceSchemaLocation") {
    walked.noNamespaceSchemaLocations.push(written);
  } else if (attribute.local === "type") {
    walked.xsiTypes.push(written);
  } else if (attribute.local === "nil") {
    walked.xsiNils.push({ ...written, kind });
  }
};

/**
 * Write the rows of one child of an element, or of the root, and for an element everything under it
 * in document order.
 *
 * The caller has checked the whole tree against the registries and the wildcards, so every element
 * has a kind; one that does not is a bug in that check, and is skipped here along with its subtree
 * rather than given a row. An element inside wildcard content that no registry names is a `foreign`
 * node: it gets the `Node` and `Edge` rows every element gets, under its prefix as written and its
 * parent's ancestry, since `foreign` enters no flag, and stays in the node index for the modules
 * that write its arm.
 */
const walk = (
  child: Child,
  parent: Option.Option<{
    readonly ancestry: AncestryHandle;
    readonly flags: readonly Flag[];
    readonly id: Uuid;
    readonly kind: NodeKindHandle;
  }>,
  position: number,
  input: TreeInput,
  scope: Scope,
  walked: Walked,
  index: Map<Element, IndexedNode>,
): void => {
  const common = { tree: input.id, version: input.version };
  const id = Option.isNone(parent) ? input.id : crypto.randomUUID();
  const flags = parent.pipe(
    Option.map((above) => above.flags),
    Option.getOrElse((): readonly Flag[] => []),
  );
  const sitsAt = ancestryOf(flags);
  if (Option.isNone(sitsAt)) {
    return;
  }

  const { value: ancestry } = sitsAt;
  let kind: NodeKindHandle;
  let prefix = "";

  if (child.kind === "element") {
    const found = classified(scope, child, parent.pipe(Option.map((above) => above.kind)));
    if (Option.isNone(found)) {
      return;
    }

    kind = found.value;
    ({ prefix } = child);
    index.set(child, { ancestry, id, kind });
  } else if (Option.isNone(parent)) {
    return;
  } else if (child.kind === "text") {
    if (nonWhitespace.test(child.value)) {
      kind = "text";
      walked.texts.push({ id, value: child.value });
    } else if (isWhitespaceRun(child.value)) {
      kind = "ws";
      walked.whitespace.push({ id, value: child.value });
    } else {
      // An empty run holds no character to keep; the reader does not produce one.
      return;
    }
  } else if (child.kind === "comment") {
    kind = "comment";
    walked.comments.push({ id, text: child.text });
  } else if (child.kind === "pi") {
    kind = "pi";
    walked.pis.push({ data: child.data, id, target: PiTarget(child.target) });
  } else {
    kind = "entityRef";
    walked.entityReferences.push({ id, name: XmlEntityName(child.name) });
  }

  walked.nodes.push({ ...common, ancestry, id, kind, prefix, rootKind: input.root });
  if (Option.isSome(parent)) {
    walked.edges.push({
      ...common,
      child: id,
      childAncestry: ancestry,
      childKind: kind,
      parent: parent.value.id,
      parentAncestry: parent.value.ancestry,
      parentKind: parent.value.kind,
      position: BigInt(position),
    });
  }

  if (child.kind !== "element") {
    return;
  }

  let declared = 0;
  for (const attribute of child.attributes) {
    if (attribute.namespace === xmlnsNamespace) {
      walked.namespaces.push({
        node: id,
        position: BigInt(declared),
        prefix: attribute.qname === "xmlns" ? "" : attribute.local,
        uri: NamespaceUri(attribute.value),
      });
      declared += 1;
    } else if (attribute.namespace === xsiNamespace) {
      collectXsi(walked, attribute, id, kind);
    }

    for (const reference of attribute.references) {
      walked.attributeReferences.push({
        attribute: attribute.qname,
        name: XmlEntityName(reference.name),
        node: id,
        offset: BigInt(reference.offset),
      });
    }
  }

  const here = Option.some({ ancestry, flags: enteredBy(flags, kind), id, kind });
  for (const [childPosition, grandchild] of child.children.entries()) {
    walk(grandchild, here, childPosition, input, scope, walked, index);
  }
};

/**
 * The process mode of each element of a tree, as `xsi.ts` reads it: the mode of the nearest
 * wildcard host above the element, `none` outside wildcard content. Every child of a host is
 * taken as its wildcard content, one an explicit particle of the host included; the mode matters
 * to the judgment only for an element with no declared type and for `skip`, and a particle has a
 * declared type.
 */
const modesOf = (root: Element, nodes: NodeIndex): ReadonlyMap<Element, ProcessMode> => {
  const modes = new Map<Element, ProcessMode>();
  const visit = (element: Element, mode: ProcessMode): void => {
    modes.set(element, mode);

    const inside =
      mode === "none" ? (hostProcess.get(nodes.get(element)?.kind ?? "") ?? "none") : mode;
    for (const child of element.children) {
      if (child.kind === "element") {
        visit(child, inside);
      }
    }
  };
  visit(root, "none");

  return modes;
};

/**
 * Judge the `xsi:type`, `xsi:nil` and `xsi:noNamespaceSchemaLocation` of every element of the tree
 * the walk indexed (`xsi.ts`'s `judgeTree`): what each element writes, or the first refusal. A root
 * kind no schema set names has nothing to judge against and passes with nothing written.
 */
const xsiJudgment = (
  root: Element,
  input: TreeInput,
  nodes: NodeIndex,
): Result.Result<ReadonlyMap<Element, NodeXsi>, ImportRefused> => {
  const set = schemaSetOf(input.root);
  if (Option.isNone(set)) {
    return Result.succeed(new Map());
  }

  const modes = modesOf(root, nodes);

  return judgeTree(
    root,
    set.value,
    input.version,
    (element) => nodes.get(element)?.kind ?? "foreign",
    (element) => modes.get(element) ?? "none",
  );
};

/**
 * The `XsiTypeAttribute` rows of the attributes the judgment says derived `xsi:type`s add, as
 * written. An added attribute the wildcard classification calls foreign is `foreignRows`' and gets
 * no row here, so no attribute is stored twice.
 */
const xsiTypeAttributeRows = (
  judged: ReadonlyMap<Element, NodeXsi>,
  nodes: NodeIndex,
  scope: Scope,
): Fact<typeof XsiTypeAttribute>[] =>
  [...judged].flatMap(([element, { added }]) => {
    const node = nodes.get(element);
    if (node === undefined) {
      return [];
    }

    const own = new Set(rowsByHandle.get(node.kind)?.attributes);

    return element.attributes
      .filter(
        (attribute) =>
          added.some(
            (one) => one.namespace === attribute.namespace && one.local === attribute.local,
          ) && classifyAttribute(scope, attribute, node.kind, own) !== "foreign",
      )
      .map((attribute) => ({
        kind: node.kind,
        local: XmlLocalName(attribute.local),
        namespace: NamespaceUri(attribute.namespace),
        node: node.id,
        prefix: attribute.prefix,
        value: attribute.value,
      }));
  });

const xmlVersion = new RegExp(patterns.xmlVersion, "u");

/**
 * Whether a declaration's version is one `TreeXmlVersion` holds; the reader refuses any other.
 */
const isXmlVersion = (value: string): value is `1.${number}` => xmlVersion.test(value);

/**
 * A prolog or epilog item as the `kind` and `text` of a `TreeMisc` row: a comment's text, and a
 * processing instruction as its target, then one space and its data when it has data.
 */
const miscRow = (item: Misc): { kind: "comment" | "pi"; text: string } =>
  item.kind === "comment"
    ? { kind: "comment", text: item.text }
    : { kind: "pi", text: item.data === "" ? item.target : `${item.target} ${item.data}` };

/**
 * Write the rows every tree has: its `Tree` row and the fidelity rows for its prolog, epilog,
 * declaration, doctype and export charset.
 *
 * The root node's id is the tree id; every other node gets a fresh uuid.
 *
 * The whole tree is checked against the registries before any row is written, so a vocabulary not
 * yet modeled is refused ahead of every other rule.
 *
 * @param doc - The tree as the reader gave it.
 * @param input - What the caller decides about the tree.
 * @param rows - The rows so far.
 * @returns The rows with this tree's added, and the node index holding every element; the node,
 *   edge and generic-arm rows, `TreeRoot`, the namespace declarations, the `xsi:schemaLocation`,
 *   the attribute entity references and the `ForeignElement` and `ForeignAttribute` rows
 *   ({@link foreignRows}, written once here for every tree) are among them; `UnmodeledVocabulary`
 *   for the first element or attribute no registry names, `ImportRefused` for a `standalone` that
 *   is neither `yes` nor `no`. The XML-namespace names a kind's registry lists are modeled; their
 *   rows are `attributeRows`'s.
 */
export const treeRows = Effect.fn("import.treeRows")(function* treeRows(
  doc: XmlDocument,
  input: TreeInput,
  rows: Rows,
): Effect.fn.Return<{ rows: Rows; nodes: NodeIndex }, ImportRefused | UnmodeledVocabulary> {
  const scope = scopeOf(input.root, input.version);
  const walked: Walked = {
    attributeReferences: [],
    comments: [],
    edges: [],
    entityReferences: [],
    namespaces: [],
    noNamespaceSchemaLocations: [],
    nodes: [],
    pis: [],
    schemaLocations: [],
    texts: [],
    whitespace: [],
    xsiNils: [],
    xsiTypes: [],
  };
  const nodes = new Map<Element, IndexedNode>();
  walk(doc.root, Option.none(), 0, input, scope, walked, nodes);

  const judgment = xsiJudgment(doc.root, input, nodes);
  const refusal = firstUnmodeled(
    scope,
    doc.root,
    Option.none(),
    [],
    Result.isSuccess(judgment) ? addedPass(judgment.success) : typedPass,
  );
  if (Option.isSome(refusal)) {
    return yield* refusal.value;
  }

  const { id } = input;
  const misc = (placement: "prolog" | "epilog", items: readonly Misc[]) =>
    items.map((item, position) => ({
      ...miscRow(item),
      placement,
      position: BigInt(position),
      tree: id,
    }));
  const exported = exportCharset(input.charset, doc);
  const { declaration } = doc;

  const declared = declaration
    .pipe(Option.map(({ version }) => version))
    .pipe(Option.filter(isXmlVersion));
  const encoding = declaration.pipe(Option.flatMap((found) => found.encoding));
  const standalone = yield* Option.match(
    declaration.pipe(Option.flatMap((found) => found.standalone)),
    {
      onNone: () => Effect.succeed(Option.none<YesNoHandle>()),
      onSome: (value) =>
        closedOf(
          YesNo.handles,
          value,
          "value-lexical",
          "the standalone pseudo-attribute of the XML declaration",
        ).pipe(Effect.map(Option.some)),
    },
  );
  const withTree = Rows.add(rows, Tree, [
    { charset: input.charset, id, kind: input.kind, root: input.root, version: input.version },
  ]);
  const withMisc = Rows.add(withTree, TreeMisc, [
    ...misc("prolog", doc.prolog),
    ...misc("epilog", doc.epilog),
  ]);
  const withVersion = Rows.add(
    withMisc,
    TreeXmlVersion,
    Option.match(declared, { onNone: () => [], onSome: (value) => [{ tree: id, value }] }),
  );
  const withEncoding = Rows.add(
    withVersion,
    TreeXmlEncoding,
    Option.match(encoding, { onNone: () => [], onSome: (value) => [{ tree: id, value }] }),
  );
  const withStandalone = Rows.add(
    withEncoding,
    TreeXmlStandalone,
    Option.match(standalone, { onNone: () => [], onSome: (value) => [{ tree: id, value }] }),
  );
  const withDoctype = Rows.add(
    withStandalone,
    TreeDoctype,
    Option.match(doc.doctype, { onNone: () => [], onSome: (text) => [{ text, tree: id }] }),
  );
  const withCharset = Rows.add(
    withDoctype,
    TreeExportCharset,
    exported === input.charset ? [] : [{ label: exported, tree: id }],
  );

  if (Result.isFailure(judgment)) {
    return yield* judgment.failure;
  }

  const rootNode = nodes.get(doc.root);

  const withNodes = Rows.add(withCharset, Node, walked.nodes);
  const withEdges = Rows.add(withNodes, Edge, walked.edges);
  const withTexts = Rows.add(withEdges, TextNode, walked.texts);
  const withWs = Rows.add(withTexts, Ws, walked.whitespace);
  const withComments = Rows.add(withWs, Comment, walked.comments);
  const withPis = Rows.add(withComments, Pi, walked.pis);
  const withEntities = Rows.add(withPis, EntityReference, walked.entityReferences);
  const withRoot = Rows.add(
    withEntities,
    TreeRoot,
    rootNode === undefined ? [] : [{ node: rootNode.id, tree: id }],
  );
  const withNamespaces = Rows.add(withRoot, NamespaceDeclaration, walked.namespaces);
  const withSchemaLocations = Rows.add(withNamespaces, SchemaLocation, walked.schemaLocations);
  const withNoNamespace = Rows.add(
    withSchemaLocations,
    NoNamespaceSchemaLocation,
    walked.noNamespaceSchemaLocations,
  );
  const withXsiTypes = Rows.add(withNoNamespace, XsiType, walked.xsiTypes);
  const withXsiNils = Rows.add(withXsiTypes, XsiNil, walked.xsiNils);
  const withXsiTypeAttributes = Rows.add(
    withXsiNils,
    XsiTypeAttribute,
    xsiTypeAttributeRows(judgment.success, nodes, scope),
  );
  const withReferences = Rows.add(
    withXsiTypeAttributes,
    AttributeEntityReference,
    walked.attributeReferences,
  );
  const foreign = foreignRows(doc.root, nodes, input);
  const withForeignElements = Rows.add(withReferences, ForeignElement, foreign.elements);
  const built = Rows.add(withForeignElements, ForeignAttribute, foreign.attributes);

  return { nodes, rows: built };
});
