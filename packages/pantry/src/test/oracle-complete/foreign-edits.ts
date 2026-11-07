/**
 * The mutations of the law oracle's laws over foreign elements and typed texts (§1.4, §1.5): a
 * foreign element's expanded name and governing type in the every-relation item's folded rows, and
 * an `xsi:type` or an element's text in its package text, each at a site and with a value drawn
 * among those the base and the grammar hold.
 *
 * The codec writes a foreign element's expanded name as its text spells it, resolves an `xsi:type`
 * naming a type no set its parent's documents are assessed against holds to no type, and refuses
 * a strictly held element no type assesses as `strict-undeclared`, under the rule of the law
 * Strictly held itself (`#pantry/model/shred.ts`, `governsOf`). So the laws over those rows break
 * only as edits of the rows. A closed element's `xsi:type` and an element's text break in the
 * package text, which the codec reads without refusing either.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { Option } from "effect";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { foreignKinds, isForeignKind } from "#pantry/grammar/kinds.ts";
import { expandedNameOf } from "#pantry/grammar/xsi.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { mathmlNamespace } from "#pantry/vocab/namespaces.ts";
import { typeAvailable } from "#pantry/vocab/open.ts";
import {
  baseVersion,
  editText,
  editingRows,
  isElementNode,
  passageAt,
  replaceOnce,
  withNodes,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * A document's folded rows.
 */
type Rows = FoldedRows<Composed>;

/**
 * A node row of them.
 */
type Node = FoldedNode<Composed>;

/**
 * An `OpenElementName` row of them.
 */
type OpenElementName = Rows["openElementNames"][number];

/**
 * The every-relation item, whose rows hold the package's foreign element, `w:widget` under the
 * custom interaction.
 */
const item = "items/item.xml";

/**
 * The namespace no pinned XSD declares that the item's foreign element is in.
 */
const widgetNamespace = "urn:example:widget";

/**
 * Draw one member of a list.
 *
 * @param held - The list.
 * @param what - What the list holds, for the error when it is empty.
 * @returns A generator of one member. Throws when the list is empty, a base without the site.
 */
const oneOf =
  <Row>(held: readonly Row[], what: string): Gen<Row> =>
  (source) => {
    const drawn = held[source.draw(int(0, held.length - 1))];
    if (drawn === undefined) {
      throw new Error(`the base holds no ${what}`);
    }

    return drawn;
  };

/**
 * Draw one `OpenElementName` row and replace it, every other row as it is.
 *
 * @param rows - The rows.
 * @param change - The replacement, from the row and its node.
 * @returns A generator of the edited rows. Throws when the rows hold no foreign element.
 */
const nameEdited =
  (rows: Rows, change: (name: OpenElementName, node: Node) => Gen<OpenElementName>): Gen<Rows> =>
  (source) => {
    const name = source.draw(oneOf(rows.openElementNames, "foreign element"));
    const node = rows.nodes.find(({ id }) => id === name.node);
    if (node === undefined) {
      throw new Error("the base's foreign element name has no node");
    }

    const renamed = source.draw(change(name, node));

    return {
      ...rows,
      openElementNames: rows.openElementNames.map((held) => (held === name ? renamed : held)),
    };
  };

/**
 * XML Schema's atomic built-ins whose lexical spaces exclude an IDREF's, so the item's typed text
 * `lead` stands only as a type its element does not derive.
 */
const atomicTypes = ["xs:boolean", "xs:date", "xs:decimal", "xs:double", "xs:int"] as const;

/**
 * The element kinds a node's parent admits in its version that a closed name spells: the kinds an
 * expanded name the node is renamed to would resolve to.
 *
 * @param grammar - The composed grammar.
 * @param node - The node.
 * @returns The names, each with its kind.
 */
const admittedNames = (grammar: ComposedGrammar, node: Node) =>
  grammar.kinds.elementName.rows.filter(({ kind }) =>
    Option.isSome(
      grammar.admission.lookup({ child: kind, parent: node.parentKind, version: node.version }),
    ),
  );

/**
 * The kinds whose `strict` wildcards hold a node's kind in its version (`StrictlyHeld`): the
 * parents under which a foreign element no type governs is refused.
 *
 * @param grammar - The composed grammar.
 * @param node - The node.
 * @returns The parent kinds.
 */
const strictParents = (grammar: ComposedGrammar, node: Node): readonly Node["parentKind"][] =>
  grammar.content.strictlyHeld.rows.flatMap(({ child, parent, version }) =>
    child === node.kind && version === node.version && grammar.kinds.nodeKind.has(parent)
      ? [parent]
      : [],
  );

/**
 * The pinned types a node under its parent's kind may not be assessed against: each type of the
 * `TypeName` roster in a namespace no schema set of the parent's documents holds (`typeAvailable`).
 *
 * @param grammar - The composed grammar.
 * @param node - The node.
 * @returns The type handles; none for a parent of no vocabulary's namespace.
 */
const unavailableTypes = (grammar: ComposedGrammar, node: Node): readonly Node["governs"][] => {
  const parent = grammar.kinds.elementName.rows.find(({ kind }) => kind === node.parentKind);

  return parent === undefined
    ? []
    : grammar.xsi.typeName.handles.filter((handle) =>
        Option.exists(
          expandedNameOf(handle),
          ({ namespace }) => !typeAvailable(parent.namespace, namespace),
        ),
      );
};

/**
 * Each law's mutation, by law.
 */
export const foreignEdits = {
  // MathML foreign element (reading 6): a foreign element named in MathML's namespace.
  "MathML foreign element": editingRows(item, (rows) =>
    nameEdited(rows, (name) => (source) => ({
      ...name,
      local: source.draw(element(["math", "mi", "widget"])),
      namespace: mathmlNamespace,
    })),
  ),
  // OpenElementName (D2): a foreign element with no name row, or a closed element given one.
  OpenElementName: editingRows(item, (rows, grammar) => (source) => {
    if (source.draw(element(["drop", "add"] as const)) === "drop") {
      const dropped = source.draw(oneOf(rows.openElementNames, "foreign element"));

      return {
        ...rows,
        openElementNames: rows.openElementNames.filter((name) => name !== dropped),
      };
    }

    const closed = source.draw(
      oneOf(
        rows.nodes.filter((node) => isElementNode(grammar, node) && !isForeignKind(node.kind)),
        "closed element",
      ),
    );

    return {
      ...rows,
      openElementNames: [
        ...rows.openElementNames,
        { local: "widget", namespace: widgetNamespace, node: closed.id },
      ],
    };
  }),
  // OpenElementName canonical (reading 6): a foreign element named as a closed kind its parent
  // admits.
  "OpenElementName canonical": editingRows(item, (rows, grammar) =>
    nameEdited(rows, (name, node) => (source) => {
      const { local, namespace } = source.draw(
        oneOf(admittedNames(grammar, node), "closed name its parent admits"),
      );

      return { ...name, local, namespace };
    }),
  ),
  // Strictly held (reading 6): a foreign element with no type under a kind whose wildcard is
  // strict, its nearest interaction its new parent's.
  "Strictly held": editingRows(item, (rows, grammar) => (source) => {
    const foreign = source.draw(
      oneOf(
        rows.nodes.filter(
          (node) => node.kind === foreignKinds.other && strictParents(grammar, node).length > 0,
        ),
        "foreign element a strict wildcard may hold",
      ),
    );
    const parentKind = source.draw(oneOf(strictParents(grammar, foreign), "strict parent"));

    return withNodes(
      rows,
      rows.nodes.map((node) =>
        node.id === foreign.id
          ? {
              ...node,
              nearest: node.parentNearest,
              nearestKind: node.parentNearestKind,
              parentKind,
            }
          : node,
      ),
    );
  }),
  // TextDomain (§1.5): the item's calculator type outside its four tokens, basic, standard,
  // scientific and graphing (the pinned ASI XSDs), its whitespace preserved: another word, a token
  // in another case, and two tokens.
  TextDomain: passageAt(item, "<qti-calculator-type>basic</qti-calculator-type>", [
    "<qti-calculator-type>abacus</qti-calculator-type>",
    "<qti-calculator-type>Basic</qti-calculator-type>",
    "<qti-calculator-type>basic standard</qti-calculator-type>",
  ]),
  // XsiType available (readings 60 and 81): a foreign element governed by a pinned type of a
  // namespace no set its parent's documents are assessed against holds.
  "XsiType available": editingRows(item, (rows, grammar) => (source) => {
    const foreign = source.draw(
      oneOf(
        rows.nodes.filter(
          (node) => node.kind === foreignKinds.other && unavailableTypes(grammar, node).length > 0,
        ),
        "foreign element under a vocabulary's kind",
      ),
    );
    const governs = source.draw(
      oneOf(unavailableTypes(grammar, foreign), "type unavailable to it"),
    );

    return withNodes(
      rows,
      rows.nodes.map((node) => (node.id === foreign.id ? { ...node, governs } : node)),
    );
  }),
  // XsiType derived (XML Schema Part 1 §3.3.4 clause 4.3): the item's typed description given an
  // atomic type its declared type does not derive.
  "XsiType derived": {
    mutate:
      ({ entries }, grammar) =>
      (source) => {
        const type = source.draw(
          oneOf(
            atomicTypes.filter((held) =>
              Option.isNone(
                grammar.xsi.xsiType.lookup({
                  kind: "qti-description",
                  type: held,
                  version: baseVersion,
                }),
              ),
            ),
            "type qti-description does not derive",
          ),
        );

        return editText(entries, item, (text) =>
          replaceOnce(text, 'xsi:type="xs:IDREF"', `xsi:type="${type}"`),
        );
      },
    over: "package",
  },
} as const satisfies Readonly<Record<string, Mutation>>;
