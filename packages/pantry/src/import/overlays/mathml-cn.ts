/**
 * The MathML cn overlay's rows (spec reading 2, §C's `rowsOf`): from one document's XDM tree and
 * the ids its nodes are written under, the rows of every relation `#pantry/qti/mathml-cn.ts`
 * declares.
 *
 * - **`MathCn`**, one row for every `m:cn` whose `type` {@link cnForms} lists (`real` where it writes
 *   none) and whose `base` is a whole number from 2 to 36 (10 where it writes none), with the
 *   lexical form of each attribute it writes (empty where it writes none). A `cn` whose `type` is
 *   another word, whose `base` lies outside the radixes, or whose attribute is written empty, has
 *   no row: its content is text, or its digits are application specific, so nothing is judged.
 *   `MathCn.parts` is drawn by the database from the part rows, so no row carries it.
 * - **`CnPartText`**, one row for every part of a judged `cn`, its content split at its `m:sep`
 *   children (MathML 3 §4.2.1): the part's number from 0, the `type` and `base` of its `cn`, the
 *   form {@link cnForms} gives its place, and the text of its text and whitespace children,
 *   collapsed (§2.1.7: U+0020, U+0009, U+000A and U+000D); comments and instructions add nothing. A
 *   `cn` with a part that holds an element or an entity reference has no rows, as that part is not
 *   judged. A part beyond the places its type lists is written at its place, up to the one place no
 *   type lists, under the form `real`, which `CnForm` does not list for it, so the database refuses
 *   a `cn` with more parts than its type lists; a later part adds nothing, as the refusal is made.
 * - **`CnCount`**, one row for every `m:cn` whose `type` {@link cnForms} lists (`real` where it
 *   writes none), whatever its `base` and whatever its parts hold: its node, its `type` and the
 *   lexical form of its `type` attribute (empty where it writes none). `CnCount.parts` is drawn by
 *   the database from the slot rows, so no row carries it.
 * - **`CnSlot`**, one row for every part of such a `cn`, judged or not, at its place as `CnPartText`
 *   places parts (up to the one place no type lists), with the `type` of its `cn` and the form
 *   {@link cnForms} gives its place. A `cn` of a `base` outside the radixes, or with a part that
 *   holds an element or an entity reference, has these rows and no `MathCn` or `CnPartText`, so the
 *   database counts its parts and judges none of its digits.
 * - **`CnAttribute`**, one row for every `type` and every `base` an `m:cn` writes, whatever its type
 *   and whether or not it is judged: the node, the attribute's name and its lexical form as
 *   written. A `type` on another element has no row.
 *
 * The rows restate what the tree says and nothing else.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { CnPart } from "#pantry/grammar/install.ts";
import { cnDefaultType, cnForms } from "#pantry/grammar/expression.ts";
import type { CnForm } from "#pantry/grammar/expression.ts";
import { nonElements, writtenOf } from "#pantry/import/overlays/mathml-tree.ts";
import { collapse } from "#pantry/grammar/domains.ts";
import type { NodeIds } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { CnAttribute, CnPartText, CnCount, CnSlot, MathCn } from "#pantry/qti/mathml-cn.ts";

/**
 * A document's cn rows, one keyed set per relation: a `CnAttribute` row by the JSON of its node's
 * id and its name, a `MathCn` row and a `CnCount` row by its node's id, a `CnPartText` row and a
 * `CnSlot` row by the JSON of its node's id and its part.
 */
export interface MathmlCnRows {
  readonly CnAttribute: ReadonlyMap<string, Addition<typeof CnAttribute>>;
  readonly CnPartText: ReadonlyMap<string, Addition<typeof CnPartText>>;
  readonly CnCount: ReadonlyMap<string, Addition<typeof CnCount>>;
  readonly CnSlot: ReadonlyMap<string, Addition<typeof CnSlot>>;
  readonly MathCn: ReadonlyMap<string, Addition<typeof MathCn>>;
}

/**
 * The radix a `cn` is judged under when it writes no `base` (MathML 3 §4.2.1, "default is 10").
 */
const defaultBase = "10";

/**
 * The radixes a `cn` is judged under, as the numerals `CnBase` spells them.
 */
const radixes: ReadonlySet<string> = new Set(Array.from({ length: 35 }, (_, at) => String(at + 2)));

/**
 * The places `CnPart` names: the numerals 0 to the most parts any type holds, the last a place no
 * type lists.
 */
const places: ReadonlySet<string> = new Set(CnPart.handles);

/**
 * Read the radix a `base` attribute names: its collapsed form is digits only, and its value, with
 * the leading zeros dropped, is one of the radixes.
 *
 * @param lexical - The attribute's lexical form.
 * @returns The radix as its numeral, or nothing when the form names none.
 */
const radixOf = (lexical: string): string | undefined => {
  const digits = collapse(lexical);
  const numeral = /^[0-9]+$/u.test(digits) ? digits.replace(/^0+(?=[0-9])/u, "") : "";

  return radixes.has(numeral) ? numeral : undefined;
};

/**
 * Key a part's row: its node and its number.
 *
 * @param node - The `cn`'s id.
 * @param part - The part's number.
 * @returns The key.
 */
const partKey = (node: NodeId, part: number): string => JSON.stringify([node, String(part)]);

/**
 * One stretch of a `cn`'s content between its `m:sep` children.
 */
interface Stretch {
  /**
   * False when the stretch holds an element or an entity reference, which is not judged.
   */
  judged: boolean;
  text: string;
}

/**
 * Split a `cn`'s content into its stretches at its `m:sep` children: the text and whitespace
 * children's characters of each, joined; comments and instructions add nothing.
 *
 * @param children - The `cn`'s children, in order.
 * @param textOf - The characters of each character-data node.
 * @returns Its stretches in order, one more than it has separators.
 */
const stretchesOf = (
  children: readonly NodeRow<Composed>[],
  textOf: ReadonlyMap<NodeId, string>,
): readonly Stretch[] => {
  const stretches: Stretch[] = [{ judged: true, text: "" }];
  for (const child of children) {
    const last = stretches.at(-1);
    if (last === undefined) {
      continue;
    }

    if (child.kind === "m:sep") {
      stretches.push({ judged: true, text: "" });
    } else if (child.kind === "text" || child.kind === "ws") {
      last.text += textOf.get(child.id) ?? "";
    } else if (child.kind === "entityRef" || !nonElements.has(child.kind)) {
      last.judged = false;
    }
  }

  return stretches;
};

/**
 * The attributes a `cn` is judged by: its `type` and `base`.
 */
const judgedAttributes: ReadonlySet<string> = new Set(["type", "base"]);

/**
 * The type a `cn` is counted under, and the form of each place of its parts.
 */
interface Typed {
  readonly forms: readonly CnForm[];
  readonly type: string;
  readonly typeLexical: string;
}

/**
 * The type and radix a `cn` is judged under, and the form of each place of its parts.
 */
interface Judgement extends Typed {
  readonly base: string;
  readonly baseLexical: string;
}

/**
 * Read the type a `cn` is counted under from the attributes it writes.
 *
 * @param values - The lexical forms of its `type` and `base`, where it writes them.
 * @returns What it is counted under, or nothing when its `type` is no listed one.
 */
const typedOf = (values: ReadonlyMap<string, string> | undefined): Typed | undefined => {
  const typeLexical = values?.get("type");
  const type = typeLexical === undefined ? cnDefaultType : collapse(typeLexical);
  const forms = cnForms.get(type);

  return forms === undefined ? undefined : { forms, type, typeLexical: typeLexical ?? "" };
};

/**
 * Judge a `cn` whose type is counted from the radix it writes.
 *
 * @param typed - What the `cn` is counted under.
 * @param values - The lexical forms of its `type` and `base`, where it writes them.
 * @returns What it is judged under, or nothing when its `base` is no radix.
 */
const judgementOf = (
  typed: Typed,
  values: ReadonlyMap<string, string> | undefined,
): Judgement | undefined => {
  const baseLexical = values?.get("base");
  const base = baseLexical === undefined ? defaultBase : radixOf(baseLexical);

  return base === undefined ? undefined : { ...typed, base, baseLexical: baseLexical ?? "" };
};

/**
 * Write the rows of one `cn` of a listed type: its count and a slot for each of its parts, whatever
 * its base and whatever its parts hold, and, where its base is a radix and no part holds an element
 * or an entity reference, its judged row and a text row for each part.
 *
 * @param rows - The rows of the document, which the `cn`'s are added to.
 * @param node - The `cn`'s id.
 * @param typed - What the `cn` is counted under.
 * @param values - The lexical forms of its `type` and `base`, where it writes them.
 * @param stretches - The stretches of its content.
 */
const writeCn = (
  rows: {
    readonly CnCount: Map<string, Addition<typeof CnCount>>;
    readonly CnPartText: Map<string, Addition<typeof CnPartText>>;
    readonly CnSlot: Map<string, Addition<typeof CnSlot>>;
    readonly MathCn: Map<string, Addition<typeof MathCn>>;
  },
  node: NodeId,
  typed: Typed,
  values: ReadonlyMap<string, string> | undefined,
  stretches: readonly Stretch[],
): void => {
  const { forms, type, typeLexical } = typed;
  const placed = stretches.slice(0, places.size);
  rows.CnCount.set(node, { node, type, typeLexical });
  for (const [at] of placed.entries()) {
    rows.CnSlot.set(partKey(node, at), { form: forms[at] ?? "real", node, part: String(at), type });
  }

  const judgement = judgementOf(typed, values);
  if (judgement === undefined || stretches.some(({ judged }) => !judged)) {
    return;
  }

  const { base, baseLexical } = judgement;
  rows.MathCn.set(node, { base, baseLexical, node, type, typeLexical });
  for (const [at, { text }] of placed.entries()) {
    rows.CnPartText.set(partKey(node, at), {
      base,
      form: forms[at] ?? "real",
      node,
      part: String(at),
      text: collapse(text),
      type,
    });
  }
};

/**
 * The cn rows of one document.
 *
 * @param tree - The document's XDM tree.
 * @param ids - The ids its nodes are written under.
 * @returns The rows of every relation the cn module declares.
 */
export const rowsOf = (tree: XdmDocument<Composed>, ids: Pick<NodeIds, "idOf">): MathmlCnRows => {
  const flat = flatten(tree, ids.idOf);
  const cnIds = new Set<NodeId>();
  for (const node of flat.nodes) {
    if (node.kind === "m:cn") {
      cnIds.add(node.id);
    }
  }

  const childrenOf = new Map<NodeId, NodeRow<Composed>[]>();
  for (const node of flat.nodes) {
    if (node.parent !== node.id && cnIds.has(node.parent)) {
      const siblings = childrenOf.get(node.parent);
      if (siblings === undefined) {
        childrenOf.set(node.parent, [node]);
      } else {
        siblings.push(node);
      }
    }
  }

  const textOf = new Map<NodeId, string>();
  for (const { node, value } of [...flat.texts, ...flat.whitespace]) {
    textOf.set(node, value);
  }

  const written = writtenOf(flat.attributes, judgedAttributes);
  const attributes = new Map<string, Addition<typeof CnAttribute>>();
  for (const [node, values] of written) {
    if (cnIds.has(node)) {
      for (const name of ["base", "type"] as const) {
        const lexical = values.get(name);
        if (lexical !== undefined) {
          attributes.set(JSON.stringify([node, name]), { lexical, name, node });
        }
      }
    }
  }

  const rows = {
    CnAttribute: attributes,
    CnCount: new Map<string, Addition<typeof CnCount>>(),
    CnPartText: new Map<string, Addition<typeof CnPartText>>(),
    CnSlot: new Map<string, Addition<typeof CnSlot>>(),
    MathCn: new Map<string, Addition<typeof MathCn>>(),
  } satisfies MathmlCnRows;
  for (const node of flat.nodes) {
    const values = written.get(node.id);
    const typed = node.kind === "m:cn" ? typedOf(values) : undefined;
    if (typed !== undefined) {
      writeCn(rows, node.id, typed, values, stretchesOf(childrenOf.get(node.id) ?? [], textOf));
    }
  }

  return rows;
};
