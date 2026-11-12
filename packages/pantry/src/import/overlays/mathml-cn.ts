/**
 * The MathML cn overlay's rows (spec reading 2, §C's `rowsOf`): from one document's view
 * (`DocumentView` of `#pantry/import/fold.ts`), the rows of every relation
 * `#pantry/qti/mathml-cn.ts` declares.
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
import { keyTextOf, nonElements, writtenOf } from "#pantry/import/overlays/mathml-tree.ts";
import type { MathmlIds } from "#pantry/import/overlays/mathml-tree.ts";
import { collapse } from "#pantry/grammar/domains.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeRow } from "#pantry/model/xdm.ts";
import type { CnAttribute, CnPartText, CnCount, CnSlot, MathCn } from "#pantry/qti/mathml-cn.ts";

/**
 * A document's cn rows, one keyed set per relation, each by the text of its key
 * ({@link keyTextOf}): a `CnAttribute` row by its node and its name, a `MathCn` row and a
 * `CnCount` row by its node, a `CnPartText` row and a `CnSlot` row by its node and its part.
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
  textOf: ReadonlyMap<bigint, string>,
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
      last.text += textOf.get(child.start) ?? "";
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
 * @param ids - Where the document stands in its package.
 * @param start - The `cn`'s place in its document.
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
  ids: MathmlIds,
  start: bigint,
  typed: Typed,
  values: ReadonlyMap<string, string> | undefined,
  stretches: readonly Stretch[],
): void => {
  const { forms, type, typeLexical } = typed;
  const placed = stretches.slice(0, places.size);
  const node = { package: ids.package, path: ids.path, start };
  rows.CnCount.set(keyTextOf(ids, start), { ...node, type, typeLexical });
  for (const [at] of placed.entries()) {
    const part = String(at);
    rows.CnSlot.set(keyTextOf(ids, start, part), {
      ...node,
      form: forms[at] ?? "real",
      part,
      type,
    });
  }

  const judgement = judgementOf(typed, values);
  if (judgement === undefined || stretches.some(({ judged }) => !judged)) {
    return;
  }

  const { base, baseLexical } = judgement;
  rows.MathCn.set(keyTextOf(ids, start), { ...node, base, baseLexical, type, typeLexical });
  for (const [at, { text }] of placed.entries()) {
    const part = String(at);
    rows.CnPartText.set(keyTextOf(ids, start, part), {
      ...node,
      base,
      form: forms[at] ?? "real",
      part,
      text: collapse(text),
      type,
    });
  }
};

/**
 * The cn rows of one document.
 *
 * @param view - The document's view: its rows, each node at its `start`.
 * @param ids - Where the document stands in its package, the key every row holds.
 * @returns The rows of every relation the cn module declares.
 */
export const rowsOf = (view: DocumentView, ids: MathmlIds): MathmlCnRows => {
  const flat = view.rows;
  const cns = new Set<bigint>();
  for (const node of flat.nodes) {
    if (node.kind === "m:cn") {
      cns.add(node.start);
    }
  }

  const childrenOf = new Map<bigint, NodeRow<Composed>[]>();
  for (const node of flat.nodes) {
    if (node.parent !== node.start && cns.has(node.parent)) {
      const siblings = childrenOf.get(node.parent);
      if (siblings === undefined) {
        childrenOf.set(node.parent, [node]);
      } else {
        siblings.push(node);
      }
    }
  }

  const textOf = new Map<bigint, string>();
  for (const { start, value } of [...flat.texts, ...flat.whitespace]) {
    textOf.set(start, value);
  }

  const written = writtenOf(flat.attributes, judgedAttributes);
  const attributes = new Map<string, Addition<typeof CnAttribute>>();
  for (const [start, values] of written) {
    if (cns.has(start)) {
      for (const name of ["base", "type"] as const) {
        const lexical = values.get(name);
        if (lexical !== undefined) {
          attributes.set(keyTextOf(ids, start, name), {
            lexical,
            name,
            package: ids.package,
            path: ids.path,
            start,
          });
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
    const values = written.get(node.start);
    const typed = node.kind === "m:cn" ? typedOf(values) : undefined;
    if (typed !== undefined) {
      writeCn(
        rows,
        ids,
        node.start,
        typed,
        values,
        stretchesOf(childrenOf.get(node.start) ?? [], textOf),
      );
    }
  }

  return rows;
};
