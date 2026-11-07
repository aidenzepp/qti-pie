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
import { collapse } from "#pantry/import/overlays/metadata.ts";
import type { NodeIds } from "#pantry/import/write.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { CnAttribute, CnPartText, MathCn } from "#pantry/qti/mathml-cn.ts";

/**
 * A document's cn rows, one keyed set per relation: a `CnAttribute` row by the JSON of its node's
 * id and its name, a `MathCn` row by its node's id, a `CnPartText` row by the JSON of its node's id
 * and its part.
 */
export interface MathmlCnRows {
  readonly CnAttribute: ReadonlyMap<string, Addition<typeof CnAttribute>>;
  readonly CnPartText: ReadonlyMap<string, Addition<typeof CnPartText>>;
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
 * The type and radix a `cn` is judged under, and the form of each place of its parts.
 */
interface Judgement {
  readonly base: string;
  readonly baseLexical: string;
  readonly forms: readonly CnForm[];
  readonly type: string;
  readonly typeLexical: string;
}

/**
 * Judge a `cn` from the attributes it writes.
 *
 * @param values - The lexical forms of its `type` and `base`, where it writes them.
 * @returns What it is judged under, or nothing when its `type` is no listed one or its `base` no
 *   radix.
 */
const judgementOf = (values: ReadonlyMap<string, string> | undefined): Judgement | undefined => {
  const typeLexical = values?.get("type");
  const baseLexical = values?.get("base");
  const type = typeLexical === undefined ? cnDefaultType : collapse(typeLexical);
  const base = baseLexical === undefined ? defaultBase : radixOf(baseLexical);
  const forms = cnForms.get(type);

  return forms === undefined || base === undefined
    ? undefined
    : { base, baseLexical: baseLexical ?? "", forms, type, typeLexical: typeLexical ?? "" };
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

  const cns = new Map<string, Addition<typeof MathCn>>();
  const parts = new Map<string, Addition<typeof CnPartText>>();
  for (const node of flat.nodes) {
    const judgement = node.kind === "m:cn" ? judgementOf(written.get(node.id)) : undefined;
    const stretches = stretchesOf(childrenOf.get(node.id) ?? [], textOf);
    if (judgement === undefined || stretches.some(({ judged }) => !judged)) {
      continue;
    }

    const { base, baseLexical, forms, type, typeLexical } = judgement;
    cns.set(node.id, { base, baseLexical, node: node.id, type, typeLexical });
    for (const [at, { text }] of stretches.slice(0, places.size).entries()) {
      parts.set(partKey(node.id, at), {
        base,
        form: forms[at] ?? "real",
        node: node.id,
        part: String(at),
        text: collapse(text),
        type,
      });
    }
  }

  return { CnAttribute: attributes, CnPartText: parts, MathCn: cns };
};
