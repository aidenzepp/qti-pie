/**
 * The operator overlays' rows (spec readings 119 and 121, §C's `rowsOf`): from one document's XDM
 * tree and the ids its nodes are written under, the rows of every relation
 * `#pantry/qti/operators.ts` declares, each a keyed set.
 *
 * The rows restate what the tree says and nothing else: each rounding operator's node tuple and
 * what it holds, its `figures` as written and collapsed where it writes one, its mode in force
 * where it has one, and both together where it has both; each `qti-equal`'s `tolerance` as written,
 * split into its values. The database proves every one of them (`operatorLaws`), so a row this
 * builder gets wrong is refused, never accepted. Reading 121's presence reads `Attribute` and
 * `Tolerance` alone, so it has no rows of its own.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { collapse } from "#pantry/grammar/domains.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import { equalRoundedMode, roundingKinds } from "#pantry/qti/operators.ts";
import type {
  Rounding,
  RoundingFigures,
  RoundingMode,
  RoundingModeFigures,
  Tolerance,
  ToleranceToken,
} from "#pantry/qti/operators.ts";

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
  readonly RoundingFigures: ReadonlyMap<string, Addition<typeof RoundingFigures>>;
  readonly RoundingMode: ReadonlyMap<string, Addition<typeof RoundingMode>>;
  readonly RoundingModeFigures: ReadonlyMap<string, Addition<typeof RoundingModeFigures>>;
  readonly Tolerance: ReadonlyMap<string, ToleranceRow>;
}

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
 * A rounding operator's mode in force: its `rounding-mode` where written, else
 * {@link equalRoundedMode} on a `qti-equal-rounded`, else none, a `qti-round-to`'s that writes none,
 * which AL3 refuses.
 *
 * @param kind - The operator's kind.
 * @param written - Its `rounding-mode`, where written.
 * @returns The mode, where one is in force.
 */
const modeOf = (kind: string, written: Option.Option<string>): Option.Option<string> =>
  Option.orElse(written, () =>
    kind === "qti-equal-rounded" ? Option.some(equalRoundedMode) : Option.none(),
  );

/**
 * What a rounding operator holds (`RoundingHolds` of `#pantry/qti/operators.ts`): which of a
 * `figures` and a mode in force it has.
 *
 * @param figures - Its `figures`, where written.
 * @param mode - Its mode in force, where it has one.
 * @returns The `RoundingHolds` handle.
 */
const holdingsOf = (
  figures: Option.Option<string>,
  mode: Option.Option<string>,
): Addition<typeof Rounding>["holds"] => {
  if (Option.isSome(figures)) {
    return Option.isSome(mode) ? "both" : "figures";
  }

  return Option.isSome(mode) ? "mode" : "neither";
};

/**
 * Build a document's operator rows.
 *
 * Each rounding operator has its `Rounding` row, with what it holds; its `RoundingFigures` row
 * where it writes `figures`; its `RoundingMode` row where a mode is in force, its `rounding-mode`
 * or a `qti-equal-rounded`'s default; and its `RoundingModeFigures` row where it has both. An
 * operator that leaves out a required attribute has no row of it, and AL3 refuses it alone. Each
 * `qti-equal` that writes `tolerance` has its {@link ToleranceRow}. A text past `keyText`'s bound
 * keeps its row, which `keyText` refuses under "Key text bound". A document with no such element
 * gives no row.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, and its context.
 * @returns Every operator relation's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: OperatorIds): OperatorRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const operators = rows.nodes.filter(({ kind }) => rounders.has(kind) || kind === "qti-equal");
  const built = {
    Rounding: new Map<string, Addition<typeof Rounding>>(),
    RoundingFigures: new Map<string, Addition<typeof RoundingFigures>>(),
    RoundingMode: new Map<string, Addition<typeof RoundingMode>>(),
    RoundingModeFigures: new Map<string, Addition<typeof RoundingModeFigures>>(),
    Tolerance: new Map<string, ToleranceRow>(),
  };
  if (operators.length === 0) {
    return built;
  }

  const lexicals = new Map(rows.attributes.map((row) => [`${row.node} ${row.name}`, row.lexical]));
  const valueOf = (node: NodeRow<Composed>, name: string): string | undefined =>
    lexicals.get(`${node.id} ${name}`);
  const folds = foldOf(rows.nodes, ids.context);

  for (const node of operators) {
    if (node.kind === "qti-equal") {
      const lexical = valueOf(node, "tolerance");
      if (lexical !== undefined) {
        built.Tolerance.set(node.id, {
          lexical,
          node: node.id,
          tokens: tolerancePiecesOf(lexical),
        });
      }

      continue;
    }

    const figuresLexical = Option.fromNullishOr(valueOf(node, "figures"));
    const written = Option.fromNullishOr(valueOf(node, "rounding-mode"));
    const mode = modeOf(node.kind, written);
    const modeWritten = Option.isSome(written);
    built.Rounding.set(node.id, {
      document,
      holds: holdingsOf(figuresLexical, mode),
      kind: node.kind,
      modeWritten,
      nearest: foldAt(folds, node.id).nearest,
      node: node.id,
      parent: node.parent,
      start: node.start,
      version: node.version,
    });

    const figures = figuresLexical.pipe(
      Option.map((lexical) => ({ figures: collapse(lexical), figuresLexical: lexical })),
    );
    if (Option.isSome(figures)) {
      built.RoundingFigures.set(node.id, { ...figures.value, node: node.id });
    }

    if (Option.isSome(mode)) {
      built.RoundingMode.set(node.id, {
        kind: node.kind,
        mode: mode.value,
        modeWritten,
        node: node.id,
      });
    }

    if (Option.isSome(figures) && Option.isSome(mode)) {
      built.RoundingModeFigures.set(node.id, {
        figures: figures.value.figures,
        mode: mode.value,
        node: node.id,
      });
    }
  }

  return built;
};
