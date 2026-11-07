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
import { Option } from "effect";
import { collapse } from "#pantry/grammar/domains.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { equalRoundedMode, roundingKinds, roundingUnwritten } from "#pantry/qti/operators.ts";
import type { Rounding, Tolerance, ToleranceToken } from "#pantry/qti/operators.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it, and the document's context (spec reading 117), whose interaction an included
 * fragment's nodes take as their nearest (`ownContext` of `#pantry/import/fold.ts` for a document
 * no site names).
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface OperatorIds {
  readonly context: DocumentContext;
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
 * Read a stretch of a `tolerance` between its values, or after its last, as the whitespace it is.
 *
 * @param text - The stretch.
 * @returns It, as {@link Spacing}.
 * @throws {Error} When it holds a character that is no whitespace, which the split's runs of no
 *   whitespace leave none of between them: a defect of the split, never of the document.
 */
const spacingOf = (text: string): Spacing =>
  Option.getOrThrowWith(
    Option.liftPredicate(text, isSpacing),
    () =>
      new Error(
        `The tolerance split left ${JSON.stringify(text)} beside a value, which is no whitespace. Split at every maximal run of no whitespace.`,
      ),
  );

/**
 * Split a `tolerance` value into its values, each a maximal run of no whitespace with the
 * whitespace written before it, and the last with the whitespace after it, so the pieces
 * concatenate to the value and every value but the first follows whitespace (`E1_derived` on
 * `ToleranceToken`).
 *
 * @param lexical - The attribute's lexical form.
 * @returns Its pieces, in order; none for a value of whitespace alone, an empty list.
 */
export const tolerancePiecesOf = (lexical: string): readonly ToleranceTokenInsert[] => {
  const runs = [...lexical.matchAll(/[^\t\n\r ]+/gu)];
  const pieces: ToleranceTokenInsert[] = [];
  let end = 0;
  for (const [at, run] of runs.entries()) {
    const [token] = run;
    const before = spacingOf(lexical.slice(end, run.index));
    end = run.index + token.length;
    const after = spacingOf(at === runs.length - 1 ? lexical.slice(end) : "");
    pieces.push({ after, before, piece: `${before}${token}${after}`, token });
  }

  return pieces;
};

/**
 * The fields of a `Rounding` row the host reads off its `figures`, each proved by `E1_derived`.
 */
export type FiguresFields = Pick<Addition<typeof Rounding>, "figures" | "figuresValue" | "integer">;

/**
 * Read a `figures` as `Rounding` holds it: its lexical form collapsed, whether that is an integer
 * within the signed 64-bit range, and the integer, `roundingUnwritten`'s where it is none.
 *
 * @param lexical - The attribute's lexical form, or `roundingUnwritten`'s for an element that
 *   writes none.
 * @returns The collapsed form, `integer` and `figuresValue`.
 */
export const figuresOf = (lexical: string): FiguresFields => {
  const figures = collapse(lexical);
  const value = integerLexical.test(figures) ? BigInt(figures) : undefined;
  const integer = value !== undefined && value >= bigintRange.min && value <= bigintRange.max;

  return { figures, figuresValue: integer ? value : roundingUnwritten.figuresValue, integer };
};

/**
 * Read the mode in force on a rounding operator: its `rounding-mode` where written, else
 * `qti-equal-rounded`'s default, else `roundingUnwritten`'s for a `qti-round-to`, which AL3
 * refuses.
 *
 * @param kind - The operator's kind.
 * @param written - Its `rounding-mode`, where written.
 * @returns The mode.
 */
const modeOf = (kind: string, written: Option.Option<string>): string =>
  Option.getOrElse(written, () =>
    kind === "qti-equal-rounded" ? equalRoundedMode : roundingUnwritten.mode,
  );

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
  const folds = foldOf(rows.nodes, ids.context);

  for (const node of operators) {
    if (node.kind === "qti-equal") {
      const lexical = valueOf(node, "tolerance");
      if (lexical !== undefined) {
        tolerances.set(node.id, { lexical, node: node.id, tokens: tolerancePiecesOf(lexical) });
      }

      continue;
    }

    const figuresLexical = Option.getOrElse(
      Option.fromNullishOr(valueOf(node, "figures")),
      () => roundingUnwritten.figures,
    );
    const mode = Option.fromNullishOr(valueOf(node, "rounding-mode"));
    rounding.set(node.id, {
      ...figuresOf(figuresLexical),
      document,
      figuresLexical,
      kind: node.kind,
      mode: modeOf(node.kind, mode),
      modeWritten: Option.isSome(mode),
      nearest: foldAt(folds, node.id).nearest,
      node: node.id,
      parent: node.parent,
      start: node.start,
      version: node.version,
    });
  }

  return { Rounding: rounding, Tolerance: tolerances };
};
