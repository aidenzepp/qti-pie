/**
 * The operator overlays' rows (spec readings 119 and 121, §C's `rowsOf`): from one document's XDM
 * tree and the ids its nodes are written under, the rows of every relation
 * `#pantry/qti/operators.ts` declares, each a keyed set.
 *
 * The rows restate what the tree says and nothing else: each rounding operator's node tuple, its
 * `figures` as written and collapsed, and the mode in force; each `qti-equal`'s `tolerance` as
 * written, split into its values. The database proves every one of them (`operatorLaws`), so a
 * row this builder gets wrong is refused, never accepted. Reading 121's presence reads `Attribute`
 * and `Tolerance` alone, so it has no rows of its own.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { interactionKinds } from "#pantry/grammar/install.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { collapse } from "#pantry/import/overlays/metadata.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { roundingKinds } from "#pantry/qti/operators.ts";
import type { Rounding, Tolerance, ToleranceToken } from "#pantry/qti/operators.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it, and the document's context (spec reading 117), its own where none is given,
 * whose interaction an included fragment's nodes take as their nearest.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface OperatorIds {
  readonly context?: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * One value of a `tolerance` as its owner's family nests it: without the `node` the nesting
 * supplies, nor the `at` the family draws.
 */
export type ToleranceTokenInsert = Omit<Addition<typeof ToleranceToken>, "node">;

/**
 * A `qti-equal`'s `tolerance`, with its values nested at its count field.
 */
export type ToleranceRow = Addition<typeof Tolerance> & {
  readonly tokens: readonly ToleranceTokenInsert[];
};

/**
 * A document's operator rows, one keyed set per relation: each map from the text of a row's key,
 * its node's id, to the row as its writer writes it.
 */
export interface OperatorRows {
  readonly Rounding: ReadonlyMap<string, Addition<typeof Rounding>>;
  readonly Tolerance: ReadonlyMap<string, ToleranceRow>;
}

/**
 * The lexical form of a `figures` that is an integer the representation reads: `xs:integer`'s,
 * within the signed 64-bit range (spec reading 46), as `integerForm` of
 * `#pantry/qti/operators.ts` states it for the database.
 */
const integerLexical = /^[+-]?[0-9]+$/u;

/**
 * The least and the greatest signed 64-bit integers, the range of `pg.bigint`.
 */
const bigintRange = { max: 2n ** 63n - 1n, min: -(2n ** 63n) } as const;

/**
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The rounding operator kinds, each of which has its `Rounding` row.
 */
const rounders: ReadonlySet<string> = new Set(roundingKinds);

/**
 * The text `ToleranceToken.before` and `after` hold: XML whitespace, possibly none.
 */
type Spacing = ToleranceTokenInsert["before"];

/**
 * Decide whether a text is XML whitespace, possibly none, the language of {@link Spacing}.
 *
 * @param text - The text.
 * @returns Whether every character of it is a tab, a line feed, a carriage return or a space.
 */
const isSpacing = (text: string): text is Spacing => /^[\t\n\r ]*$/u.test(text);

/**
 * Split a `tolerance` value into its values, each with the whitespace written before it, and the
 * last with the whitespace after it, so the pieces concatenate to the value and every value but
 * the first follows whitespace (`E1_derived` on `ToleranceToken`).
 *
 * @param lexical - The attribute's lexical form.
 * @returns Its pieces, in order; none for a value of whitespace alone, an empty list.
 */
export const tolerancePiecesOf = (lexical: string): readonly ToleranceTokenInsert[] => {
  const runs = [...lexical.matchAll(/(?<before>[\t\n\r ]*)(?<token>[^\t\n\r ]+)/gu)];
  const tail = runs.reduce((end, run) => end + run[0].length, 0);

  return runs.flatMap((run, at): readonly ToleranceTokenInsert[] => {
    const before = run.groups?.["before"] ?? "";
    const token = run.groups?.["token"] ?? "";
    const after = at === runs.length - 1 ? lexical.slice(tail) : "";

    return isSpacing(before) && isSpacing(after)
      ? [{ after, before, piece: `${before}${token}${after}`, token }]
      : [];
  });
};

/**
 * The fields of a `Rounding` row the host reads off its `figures`, each proved by `E1_derived`.
 */
export type FiguresFields = Pick<Addition<typeof Rounding>, "figures" | "figuresValue" | "integer">;

/**
 * Read a `figures` as `Rounding` holds it: its lexical form collapsed, whether that is an integer
 * within the signed 64-bit range, and the integer, 0 where it is none.
 *
 * @param lexical - The attribute's lexical form, or empty for an element that writes none.
 * @returns The collapsed form, `integer` and `figuresValue`.
 */
export const figuresOf = (lexical: string): FiguresFields => {
  const figures = collapse(lexical);
  const value = integerLexical.test(figures) ? BigInt(figures) : undefined;
  const integer = value !== undefined && value >= bigintRange.min && value <= bigintRange.max;

  return { figures, figuresValue: integer ? value : 0n, integer };
};

/**
 * Compute each node's nearest interaction (N8), as the tree's rows hold it: the document node's is
 * its context's; a child of an interaction's is that interaction; every other node's is its
 * parent's.
 *
 * @param nodes - A document's node rows, in document order, so each parent precedes its children.
 * @param rootNearest - The document node's own, its context's; itself where none is given.
 * @returns Each node's nearest interaction, by its id.
 */
const nearestOf = (
  nodes: readonly NodeRow<Composed>[],
  rootNearest: NodeId | undefined,
): ReadonlyMap<NodeId, NodeId> => {
  const kinds = new Map<NodeId, string>();
  const nearest = new Map<NodeId, NodeId>();
  for (const node of nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      nearest.set(node.id, rootNearest ?? node.id);
      continue;
    }

    nearest.set(
      node.id,
      interactions.has(kinds.get(node.parent) ?? "")
        ? node.parent
        : (nearest.get(node.parent) ?? node.parent),
    );
  }

  return nearest;
};

/**
 * Build a document's operator rows.
 *
 * Each rounding operator has its `Rounding` row: its `figures` as written, else empty, which the
 * copy's foreign key then refuses; its `rounding-mode` where it writes one, else
 * `significantFigures` on a `qti-equal-rounded` and empty on a `qti-round-to`. Each `qti-equal`
 * that writes `tolerance` has its {@link ToleranceRow}. A text past `keyText`'s bound keeps its
 * row, which `keyText` refuses under "Key text bound". A document with no such element gives no
 * row.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, and its context.
 * @returns Every operator relation's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: OperatorIds): OperatorRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const operators = rows.nodes.filter(({ kind }) => rounders.has(kind) || kind === "qti-equal");
  const rounding = new Map<string, Addition<typeof Rounding>>();
  const tolerances = new Map<string, ToleranceRow>();
  if (operators.length === 0) {
    return { Rounding: rounding, Tolerance: tolerances };
  }

  const lexicals = new Map(rows.attributes.map((row) => [`${row.node} ${row.name}`, row.lexical]));
  const valueOf = (node: NodeRow<Composed>, name: string): string | undefined =>
    lexicals.get(`${node.id} ${name}`);
  const nearest = nearestOf(rows.nodes, ids.context?.nearest);

  for (const node of operators) {
    if (node.kind === "qti-equal") {
      const lexical = valueOf(node, "tolerance");
      if (lexical !== undefined) {
        tolerances.set(node.id, { lexical, node: node.id, tokens: tolerancePiecesOf(lexical) });
      }

      continue;
    }

    const figuresLexical = valueOf(node, "figures") ?? "";
    const mode = valueOf(node, "rounding-mode");
    rounding.set(node.id, {
      ...figuresOf(figuresLexical),
      document,
      figuresLexical,
      kind: node.kind,
      mode: mode ?? (node.kind === "qti-equal-rounded" ? "significantFigures" : ""),
      modeWritten: mode !== undefined,
      nearest: nearest.get(node.id) ?? document,
      node: node.id,
      parent: node.parent,
      start: node.start,
      version: node.version,
    });
  }

  return { Rounding: rounding, Tolerance: tolerances };
};
