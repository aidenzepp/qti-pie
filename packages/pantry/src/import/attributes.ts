/**
 * The rows of the attributes every element shares: the families (`class`, `lang`, `xml:lang`,
 * `label`, `dir`, `xml:base`, `data-qti-suppress-tts`, `data-catalog-idref`), `role` and the ARIA
 * attributes, the identifier-reference attributes and `headers`, and the `id` of every element
 * that holds one.
 *
 * Every tree takes this pass, item documents and manifests alike. The attributes only one kind
 * carries are the kind's own builders'; this pass reads them to check the registry and writes
 * nothing for them.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { closedOf, Rows, typedAttribute, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { NodeIndex, WhiteSpace } from "#pantry/import/tree.ts";
import {
  AriaAutocompleteValue,
  AriaCurrentValue,
  AriaInvalidValue,
  AriaLiveValue,
  AriaOrientationValue,
  AriaRoleValue,
  AriaSortValue,
  AriaTristate,
  AriaTrueFalseUndefined,
  IdrefAttribute,
  SuppressTtsMode,
  TextDirection,
  XsBoolean,
} from "#pantry/schema/content/rosters.ts";
import { entryOf } from "#pantry/schema/content/xsd-inventory.ts";
import * as family from "#pantry/schema/attributes.ts";
import { ClassList, ContentLanguage, IdReference, XmlBaseUri } from "#pantry/schema/contracts.ts";
import { DocumentId, HtmlId, ItemBodyId, PrintedVariableId } from "#pantry/schema/document.ts";
import type { RegistryRow } from "#pantry/schema/kinds/generic.ts";
import { AttributeLexical, AttributeName, Tree } from "#pantry/schema/node.ts";
import type { NodeKindHandle } from "#pantry/schema/node.ts";
import { registries } from "#pantry/schema/seed/admission.ts";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The attribute names each node kind's registry holds, from the composed registry list.
 */
const admitted: ReadonlyMap<string, ReadonlySet<string>> = new Map(
  registries.flatMap((registry) =>
    Object.entries<RegistryRow>(registry).map(
      ([kind, row]) => [kind, new Set(row.attributes)] as const,
    ),
  ),
);

/**
 * The relation of `role` and of each `aria-*` attribute, by attribute name: `AriaRole` is `role`'s
 * and every other `Aria<Name>` is `aria-<name>`'s.
 */
const ariaRelations: ReadonlyMap<string, AnyRelation> = new Map(
  Object.entries(family.relations)
    .filter(([key]) => key.startsWith("Aria"))
    .map(([key, relation]) => [
      key === "AriaRole" ? "role" : `aria-${key.slice("Aria".length).toLowerCase()}`,
      relation,
    ]),
);

/**
 * The roster of each closed `aria-*` attribute and of `role`, by attribute name: the values its
 * column holds, which `writeFamily` narrows the text to before the write.
 */
const ariaRosters: ReadonlyMap<string, readonly string[]> = new Map<string, readonly string[]>([
  ["aria-atomic", XsBoolean.handles],
  ["aria-autocomplete", AriaAutocompleteValue.handles],
  ["aria-busy", XsBoolean.handles],
  ["aria-checked", AriaTristate.handles],
  ["aria-current", AriaCurrentValue.handles],
  ["aria-disabled", XsBoolean.handles],
  ["aria-expanded", AriaTrueFalseUndefined.handles],
  ["aria-haspopup", XsBoolean.handles],
  ["aria-hidden", XsBoolean.handles],
  ["aria-invalid", AriaInvalidValue.handles],
  ["aria-live", AriaLiveValue.handles],
  ["aria-modal", XsBoolean.handles],
  ["aria-multiline", XsBoolean.handles],
  ["aria-multiselectable", XsBoolean.handles],
  ["aria-orientation", AriaOrientationValue.handles],
  ["aria-pressed", AriaTristate.handles],
  ["aria-readonly", XsBoolean.handles],
  ["aria-required", XsBoolean.handles],
  ["aria-selected", AriaTrueFalseUndefined.handles],
  ["aria-sort", AriaSortValue.handles],
  ["role", AriaRoleValue.handles],
]);

/**
 * The whitespace class of the families when no inventory entry names the kind: the manifest's LOM
 * `string` carries `xml:lang` and has none (spec 3.9).
 */
const familyClass: ReadonlyMap<string, WhiteSpace> = new Map([
  ["class", "collapse"],
  ["data-catalog-idref", "collapse"],
  ["data-qti-suppress-tts", "preserve"],
  ["dir", "preserve"],
  ["id", "collapse"],
  ["label", "replace"],
  ["lang", "replace"],
  ["xml:base", "collapse"],
  ["xml:lang", "collapse"],
]);

/**
 * The attributes whose value is a list of identifier references.
 */
const idrefNames = IdrefAttribute.handles;

/**
 * The whitespace class of `name` on an element of `kind`: the one the XSD type of the inventory
 * gives, the family's own for a kind the inventory does not hold, none for an attribute the
 * inventory cannot classify.
 */
const whiteSpaceOf = (kind: NodeKindHandle, name: string): Option.Option<WhiteSpace> => {
  const declared = entryOf(kind).pipe(
    Option.flatMap((entry) =>
      Option.fromNullishOr(entry.attributes.find((attribute) => attribute.name === name)),
    ),
  );
  if (Option.isSome(declared) && declared.value.whiteSpace !== "union") {
    return Option.some(declared.value.whiteSpace);
  }

  return Option.fromNullishOr(familyClass.get(name));
};

/**
 * Whether this pass reads `name` as its own: a family, `role`, an `aria-*` name, `id` or `headers`.
 */
const isShared = (name: string): boolean =>
  familyClass.has(name) || ariaRelations.has(name) || name === "headers";

/**
 * The attributes of `element` this pass reads: all but namespace declarations and
 * `xsi:schemaLocation`, which the tree walk stores as `NamespaceDeclaration` and `SchemaLocation`.
 */
const readable = (element: Element): readonly Attribute[] =>
  element.attributes.filter(
    (attribute) =>
      attribute.namespace !== xmlnsNamespace &&
      !(attribute.namespace === xsiNamespace && attribute.local === "schemaLocation"),
  );

/**
 * The elements of a tree in document order that the node index holds.
 */
const indexedElements = (element: Element, nodes: NodeIndex): readonly Element[] =>
  nodes.has(element)
    ? [
        element,
        ...element.children.flatMap((child) =>
          child.kind === "element" ? indexedElements(child, nodes) : [],
        ),
      ]
    : [];

/**
 * The first attribute, in document order, that the registry of its element's kind does not hold, or
 * that no relation here models: `data-ssml`, whose rows are a later phase's, and a name this pass
 * reads whose whitespace class the inventory cannot give.
 *
 * The item root's `label` is `AssessmentItemLabel`'s, written with the root, so it is not refused.
 */
const firstUnmodeled = (
  elements: readonly Element[],
  nodes: NodeIndex,
): Option.Option<UnmodeledVocabulary> => {
  for (const element of elements) {
    const node = nodes.get(element);
    const holds = node === undefined ? undefined : admitted.get(node.kind);
    if (node !== undefined) {
      for (const attribute of readable(element)) {
        const { qname } = attribute;
        const modeled =
          holds?.has(qname) === true &&
          qname !== "data-ssml" &&
          (!isShared(qname) || Option.isSome(whiteSpaceOf(node.kind, qname)));
        if (!modeled) {
          return Option.some(
            new UnmodeledVocabulary({
              kind: "attribute",
              name: qname,
              parent: Option.some(node.kind),
            }),
          );
        }
      }
    }
  }

  return Option.none();
};

/**
 * The tokens of a collapsed `IDREFS` value: its identifiers, none for the empty value.
 */
const tokensOf = (collapsed: string): readonly string[] =>
  collapsed === "" ? [] : collapsed.split(" ");

/**
 * What a pass over one tree has written, by relation, in the order it wrote it.
 */
type Written = Map<AnyRelation, object[]>;

/**
 * Add `fact` to `relation`'s rows of `written`.
 */
const emit = <R extends AnyRelation>(written: Written, relation: R, fact: Fact<R>): void => {
  written.set(relation, [...(written.get(relation) ?? []), fact]);
};

/**
 * What the writers of one attribute read: the attribute, the node it sits on, the value its typed
 * column holds, and what the tree around it fixes.
 */
interface Subject {
  readonly attribute: Fact<typeof family.NodeClass>["attribute"];
  readonly documentId: string;
  readonly kind: NodeKindHandle;
  readonly node: string;
  readonly rootKind: Fact<typeof Tree>["root"];
  readonly tree: string;
  readonly value: string;
}

/**
 * The `IdHolder` an element of `kind` holds its `id` under.
 */
const holderOf = (kind: NodeKindHandle): Fact<typeof DocumentId>["holder"] => {
  if (kind === "qti-item-body") {
    return "itemBody";
  }

  return kind === "qti-printed-variable" ? "printedVariable" : "htmlId";
};

/**
 * Write the `id` rows of an element: the document's `DocumentId` row and the row of the holder
 * its kind has.
 */
const writeId = (written: Written, subject: Subject): void => {
  const { attribute, documentId, kind, node, value } = subject;
  emit(written, DocumentId, { document: documentId, holder: holderOf(kind), id: value });
  if (kind === "qti-item-body") {
    emit(written, ItemBodyId, { document: documentId, id: value, node });
  } else if (kind === "qti-printed-variable") {
    emit(written, PrintedVariableId, { document: documentId, id: value, node });
  } else {
    emit(written, HtmlId, { attribute, document: documentId, id: value, kind, node });
  }
};

/**
 * Write the row of a family, `role` or `aria-*` attribute into its relation. A closed value is
 * narrowed to its roster's handle first.
 *
 * @returns Nothing; `ImportRefused` under `attribute-lexical` for a `dir`, `data-qti-suppress-tts`,
 *   `role` or `aria-*` value outside its roster.
 */
const writeFamily = (
  written: Written,
  name: string,
  subject: Subject,
): Effect.Effect<void, ImportRefused> =>
  Effect.gen(function* writeFamilyRow() {
    const { attribute, documentId, kind, node, rootKind, tree, value } = subject;
    const own = { attribute, kind, node, value };
    const scoped = { ...own, rootKind, tree };
    const where = `the ${name} attribute of ${kind}`;
    if (name === "class") {
      emit(written, family.NodeClass, { ...own, value: ClassList(value) });
    } else if (name === "lang") {
      emit(written, family.NodeLang, { ...own, value: ContentLanguage(value) });
    } else if (name === "xml:lang") {
      emit(written, family.NodeXmlLang, scoped);
    } else if (name === "label") {
      emit(written, family.NodeLabel, scoped);
    } else if (name === "dir") {
      const dir = yield* closedOf(TextDirection.handles, value, "attribute-lexical", where);
      emit(written, family.NodeDir, { ...own, value: dir });
    } else if (name === "xml:base") {
      emit(written, family.NodeXmlBase, { ...own, value: XmlBaseUri(value) });
    } else if (name === "data-qti-suppress-tts") {
      const mode = yield* closedOf(SuppressTtsMode.handles, value, "attribute-lexical", where);
      emit(written, family.NodeSuppressTts, { ...own, value: mode });
    } else if (name === "data-catalog-idref") {
      emit(written, family.NodeCatalogIdref, {
        ...own,
        document: documentId,
        value: IdReference(value),
      });
    } else if (name === "id") {
      writeId(written, subject);
    } else {
      const relation = ariaRelations.get(name);
      if (relation !== undefined) {
        const roster = ariaRosters.get(name);
        const narrowed =
          roster === undefined ? value : yield* closedOf(roster, value, "attribute-lexical", where);
        emit(written, relation, { ...own, value: narrowed });
      }
    }
  });

/**
 * Write the `AttributeIdref` row of each token of an identifier-reference attribute, the
 * `HeadersTarget` copy of each `headers` token, and for an empty `headers` the lexical row that
 * carries it, since no token row can.
 */
const writeIdrefs = (
  written: Written,
  reference: (typeof idrefNames)[number],
  subject: Subject,
  lexical: string,
): void => {
  const { documentId, kind, node, value } = subject;
  const tokens = tokensOf(value);
  for (const [position, target] of tokens.entries()) {
    const row = {
      attribute: reference,
      document: documentId,
      node,
      position: BigInt(position),
      target,
    };
    emit(written, family.AttributeIdref, row);
    if (reference === "headers") {
      emit(written, family.HeadersTarget, row);
    }
  }

  if (reference === "headers" && tokens.length === 0 && lexical === "") {
    emit(written, AttributeLexical, { attribute: subject.attribute, kind, node, value: "" });
  }
};

/**
 * Write the rows of one element's shared attributes into `written`.
 *
 * @returns Nothing; `ImportRefused` for a closed value outside its roster.
 */
const writeElement = (
  written: Written,
  element: Element,
  node: { readonly id: string; readonly kind: NodeKindHandle },
  context: Pick<Subject, "documentId" | "rootKind" | "tree">,
): Effect.Effect<void, ImportRefused> =>
  Effect.gen(function* writeElementRows() {
    const { kind } = node;
    for (const { qname: name, value: lexical } of readable(element)) {
      const attribute = AttributeName.handles.find((known) => known === name);
      const whiteSpace = whiteSpaceOf(kind, name);
      const skipped =
        attribute === undefined ||
        Option.isNone(whiteSpace) ||
        !isShared(name) ||
        (name === "label" && kind === "qti-assessment-item");
      if (!skipped) {
        const typed = typedAttribute(
          Rows.empty(),
          node.id,
          kind,
          attribute,
          lexical,
          whiteSpace.value,
        );
        for (const fact of Rows.of(typed.rows, AttributeLexical)) {
          emit(written, AttributeLexical, fact);
        }

        const subject = { ...context, attribute, kind, node: node.id, value: typed.value };
        if (name !== "headers") {
          yield* writeFamily(written, name, subject);
        }

        const reference = idrefNames.find((known) => known === name);
        if (reference !== undefined) {
          writeIdrefs(written, reference, subject, lexical);
        }
      }
    }
  });

/**
 * Write the rows of every shared attribute of a tree: the family, ARIA and identifier-reference
 * attributes, `headers` and the `id` of each holder.
 *
 * The tree's `Tree` row must already be in `rows` (the tree walk writes it): the `xml:lang` and
 * `label` rows copy its root kind. Every attribute is checked against its element's registry
 * before any row is written, so a refusal leaves the caller with the rows it passed in.
 *
 * @param tree - The root element of the tree.
 * @param nodes - The node each element became, from the tree walk.
 * @param documentId - The id of the document the tree is, which every `id` is unique within.
 * @param rows - The rows so far.
 * @returns The rows with this tree's added; `UnmodeledVocabulary` naming the first attribute its
 *   element's registry does not hold, or that no relation here models; `ImportRefused` under
 *   `attribute-lexical` for a closed value (`dir`, `data-qti-suppress-tts`, `role`, an `aria-*`)
 *   outside its roster.
 */
export const attributeRows = Effect.fn("import.attributeRows")(function* attributeRows(
  tree: Element,
  nodes: NodeIndex,
  documentId: string,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused | UnmodeledVocabulary> {
  const elements = indexedElements(tree, nodes);
  const refusal = firstUnmodeled(elements, nodes);
  if (Option.isSome(refusal)) {
    return yield* refusal.value;
  }

  const root = nodes.get(tree);
  const rootKind = Option.fromNullishOr(
    Rows.of(rows, Tree).find((row) => row.id === root?.id)?.root,
  );
  if (root === undefined || Option.isNone(rootKind)) {
    return yield* Effect.die(
      new Error(`attributeRows needs the tree walk's Tree row for the root node, and found none`),
    );
  }

  const written: Written = new Map();
  for (const element of elements) {
    const node = nodes.get(element);
    if (node !== undefined) {
      yield* writeElement(written, element, node, {
        documentId,
        rootKind: rootKind.value,
        tree: root.id,
      });
    }
  }

  let built = rows;
  for (const [relation, facts] of written) {
    built = Rows.add(built, relation, facts);
  }

  return built;
});
