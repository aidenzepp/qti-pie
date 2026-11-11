/**
 * The operator overlays' rows (spec readings 119 and 121, §C's `rowsOf`): from one document's view
 * (`DocumentView` of `#pantry/import/fold.ts`), the rows of every relation
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
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import { tokensOf } from "#pantry/import/pieces.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeRow } from "#pantry/model/xdm.ts";
import type {
  Rounding,
  RoundingFigures,
  RoundingMode,
  RoundingModeFigures,
  Tolerance,
  ToleranceToken,
} from "#pantry/qti/operators.ts";
import { equalRoundedMode, roundingKinds } from "#pantry/vocab/terms/operators.ts";

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
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117), whose interaction an included fragment's nodes take as their nearest.
 * @returns Every operator relation's rows.
 */
export const rowsOf = (view: DocumentView): OperatorRows => {
  const { folds, rows } = view;
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

  for (const node of operators) {
    if (node.kind === "qti-equal") {
      const lexical = valueOf(node, "tolerance");
      if (lexical !== undefined) {
        built.Tolerance.set(node.id, {
          lexical,
          node: node.id,
          tokens: tokensOf(lexical),
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

    if (Option.isSome(figuresLexical)) {
      built.RoundingFigures.set(node.id, { figuresLexical: figuresLexical.value, node: node.id });
    }

    if (Option.isSome(mode)) {
      built.RoundingMode.set(node.id, {
        kind: node.kind,
        mode: mode.value,
        modeWritten,
        node: node.id,
      });
    }

    if (Option.isSome(figuresLexical) && Option.isSome(mode)) {
      built.RoundingModeFigures.set(node.id, {
        figures: collapse(figuresLexical.value),
        mode: mode.value,
        node: node.id,
      });
    }
  }

  return built;
};
