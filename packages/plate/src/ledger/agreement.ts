/**
 * The agreement test's reading: plate's verdict on each 1EdTech example package beside pantry's,
 * and the findings file that records every package on which they disagree.
 *
 * Pantry's verdicts come from `qti-verdicts.tsv`, a byte-equal copy of pantry's verdict file
 * ({@link verdictsSource}) at the commit {@link verdictsCommit} names. Plate's come from
 * `openPackage` over each package's extracted folder, `X.zip.d/`, in the cached corpus. The two
 * agree when plate accepts a package pantry accepts, `accepted` or `accepted-with-unsupported`, or
 * refuses one pantry refuses, whatever rule each names. Plate's `unchecked` never agrees, since it
 * judges nothing.
 *
 * Every disagreement has one row in `agreement-findings.json` ({@link Finding}): the package, both
 * verdicts, both rules, the finding in words, and the ruling, `pending` until the operator rules.
 * The test holds the disagreements and the rows equal both ways, so a new disagreement, or a row
 * whose disagreement is gone, fails it.
 *
 * A ruling ({@link Ruling}) holds while the state it was made on holds: it records both sides of
 * its row, and {@link staleRulings} flags it once either side moves or the row agrees, so a ruling
 * is never kept past the state of the package it is tied to. It records the copy's commit too, as
 * provenance only, so re-pointing the copy at a commit with the same rows keeps it.
 *
 * The run sees only the corpus, so a difference no corpus package shows has no row. Each such
 * difference known is recorded here instead, pantry's side read from its source, not from a run:
 *
 * - A reference from inside a section document a test places twice, through a name one of its
 *   placements gives, reads the placement that holds it and is accepted (reading 86, "a section
 *   document a test places twice is written once"; `#plate/package/open.ts`). Pantry's law
 *   `Prefixed_reference` (`packages/pantry/src/qti/expressions.ts`) refuses any reading through a
 *   name two placements give, wherever the reference stands. No corpus package holds a section
 *   ref.
 * - Under an item ref that names an item, a variable mapping whose `target-identifier` is
 *   `QTI_CONTEXT` is refused `duplicate-identifier`, since every item holds that built-in (reading
 *   97, "a variable mapping's target names no other variable its item ref's item holds", with
 *   reading 106's built-ins). Pantry's `Variable_mapping_target`
 *   (`packages/pantry/src/qti/tests.ts`) holds a target outside the three session variables only,
 *   so it accepts the mapping where the item writes no declaration of `QTI_CONTEXT`.
 * - Under an item ref that names an LTI link, a variable mapping whose target is its own source, such
 *   as source and target `duration`, is accepted: reading 97 says "a mapping whose target is its
 *   own source maps nothing away and is valid". Pantry's `Variable_mapping_target`
 *   (`packages/pantry/src/qti/tests.ts`) refuses a session variable as any mapping's target, its
 *   own source included.
 * - An href that reading 102 reads and pantry reads no name from is accepted: `a%zz.png`, `a%FF.png`,
 *   `a%00.png`, `1:a.png` and `a%2Fb.png`, and a `srcset` of two candidates
 *   (`#plate/document/href.ts`). Pantry refuses each under its stated limit `Href_form`
 *   (`packages/pantry/src/qti/package.ts`).
 * - A file key with a `..` segment that does not climb out of the package, such as `a/../b.xml`, is
 *   accepted, as reading 138 refuses only a backslash and a drive prefix. Pantry's
 *   `unsafeEntryPath` (`packages/pantry/src/package/zip.ts`) refuses every `..` segment.
 * - A LOM, usage-data or fragment document whose root is not its type's, or that cannot be read, is
 *   accepted: plate reads these documents for their root alone and refuses only a QTI 2 root, a
 *   limit the README records. Pantry refuses both: a root that its closed relation `RootOfType`
 *   (`packages/pantry/src/grammar/install.ts`) does not pair with the resource's type, and a
 *   document it cannot read.
 * - A LOM `learningResourceType` of `exam` or `self assessment` from the LOM vocabulary in an
 *   external record file, a `resourcemetadata/xml` document, is accepted. Plate holds reading 122
 *   ("a LOM `learningResourceType` of the LOM vocabulary is neither `exam` nor `self assessment`")
 *   in the manifest alone (`#plate/package/manifest.ts`), and reads a record file for its root
 *   alone, the limit the README records. Pantry refuses it `lom-learning-resource-type`: reading
 *   122, as decision 460 amended it, holds over the records of the manifest and of each external
 *   record file (`recordDocumentTypes`, `packages/pantry/src/qti/metadata.ts`).
 * - Through an item ref `lti` that names an LTI link, `lti.1.SCORE` is read as a numbered reading and
 *   refused (reading 88, "a numbered reference such as `Q01.2.SCORE` names an instance of an item
 *   ref that a selection with replacement can repeat, and nothing else"). Pantry resolves its split
 *   reading through the link unchecked (`packages/pantry/src/qti/expressions.ts`) and accepts it.
 *   Which reading holds is a question for the shared readings.
 * - A gap match interaction of one gap bound to an `ordered` or a `record` response is accepted:
 *   plate holds a gap match's binding only to reading 169, which counts two or more gaps. Pantry's
 *   `BindingFit` (`packages/pantry/src/grammar/facets.ts`) admits `single` and `multiple` alone.
 * - A section ref whose `href` names no section document, such as the test itself, an item, a
 *   webcontent file, an empty `href` or `#x`, is accepted and judged no further. Pantry refuses it
 *   by its law `Document_entry` (`packages/pantry/src/qti/package.ts`).
 * - A package whose tests together place section documents more than 4,096 times, or place more than
 *   8 MiB of them, is refused `assembly-limit`, plate's own stated limit and no rule of QTI
 *   (`#plate/package/open.ts`). Pantry states no bound on a test's assembly, and judges such a
 *   package by its laws.
 *
 * @module
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Config } from "effect";
import { Effect, Schema } from "effect";
import { CorpusFileUnreadable, corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";
import type { CorpusMissing } from "#plate/document/corpus.ts";
import committedFindings from "#plate/ledger/agreement-findings.json" with { type: "json" };
import { openPackage } from "#plate/package/open.ts";
import type { PackageVerdict } from "#plate/package/open.ts";

/**
 * Pantry's verdict file, as a path from the repository's root: what the importer did with each
 * corpus zip.
 */
export const verdictsSource = "packages/pantry/verdicts/qti-examples-0a92fbb.tsv";

/**
 * The commit of `main` whose {@link verdictsSource} `qti-verdicts.tsv` copies byte for byte: the
 * `main` the agreement was last run on.
 */
export const verdictsCommit = "c6e55307";

/**
 * The copy's path, beside this module.
 */
export const verdictsCopy = path.join(import.meta.dirname, "qti-verdicts.tsv");

/**
 * The columns of pantry's verdict file, in its header's order.
 */
export const verdictColumns = ["file", "verdict", "rule"] as const;

/**
 * The folder under the corpus root that holds the QTI 2.2 examples, which pantry's verdict file
 * has no row for.
 */
const qti2Folder = "qtiv2p2-examples";

/**
 * The Schema of pantry's side of one package, a row of its verdict file without the file.
 *
 * `rule` is the refusal rule, empty when the package is accepted.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `PantrySide` is the Schema and the type of pantry's side under one name, so a decoder and a signature read as one thing.
export const PantrySide = Schema.Struct({
  rule: Schema.String,
  verdict: Schema.Literals(["accepted", "refused"]),
});

/**
 * Pantry's side of one package.
 */
export type PantrySide = typeof PantrySide.Type;

/**
 * The Schema of one row of pantry's verdict file: the corpus zip, keyed by its tarball member, and
 * pantry's side of it.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `PantryRow` is the Schema and the type of a row under one name, so a decoder and a signature read as one thing.
export const PantryRow = Schema.Struct({ file: Schema.String, ...PantrySide.fields });

/**
 * One row of pantry's verdict file.
 */
export type PantryRow = typeof PantryRow.Type;

/**
 * The Schema of plate's side of one package: its verdict as `openPackage` gives it, and the rule of
 * each refusal, each once, in the refusals' order, none unless it is refused.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `PlateSide` is the Schema and the type of plate's side under one name, so a decoder and a signature read as one thing.
export const PlateSide = Schema.Struct({
  rules: Schema.Array(Schema.String),
  verdict: Schema.Literals(["accepted", "accepted-with-unsupported", "refused", "unchecked"]),
});

/**
 * Plate's side of one package.
 */
export type PlateSide = typeof PlateSide.Type;

/**
 * A package the two verdicts disagree on: the corpus zip and each side's verdict and rules.
 */
export interface Disagreement {
  readonly file: string;
  readonly pantry: PantrySide;
  readonly plate: PlateSide;
}

/**
 * The Schema of the state a ruling was made on: the commit of the verdicts copy
 * ({@link verdictsCommit}) and both sides of its row at that commit.
 *
 * The sides are what {@link staleRulings} compares; the commit is provenance, never compared, so a
 * newer copy whose row is unchanged leaves the ruling standing.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `RulingState` is the Schema and the type of a ruling's state under one name, so a decoder and a signature read as one thing.
export const RulingState = Schema.Struct({
  commit: Schema.String,
  pantry: PantrySide,
  plate: PlateSide,
});

/**
 * The state a ruling was made on.
 */
export type RulingState = typeof RulingState.Type;

/**
 * The Schema of the operator's ruling that a disagreement is an expected difference.
 *
 * `expectedWhile` ties the ruling to the state of the package that does not model what the other
 * judges, never to all time ("pantry does not yet model this vocabulary (its phases 6 to 11)",
 * "plate does not validate MathML (M3)"); `group` is the ruling's group, one of criterion 5's three
 * expected differences: 1, either package's unmodeled vocabulary; 2, metaData and LOM; 3,
 * usageData, which carries QTI 2.2 usage data; `source` names where it was ruled; and `state` is
 * the state it was made on, whose sides {@link staleRulings} compares with the agreement's run.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Ruling` is the Schema and the type of a ruling under one name, so a decoder and a signature read as one thing.
export const Ruling = Schema.Struct({
  expectedWhile: Schema.NonEmptyString,
  group: Schema.Literals([1, 2, 3]),
  source: Schema.NonEmptyString,
  state: RulingState,
});

/**
 * The operator's ruling on one disagreement.
 */
export type Ruling = typeof Ruling.Type;

/**
 * The Schema of one row of `agreement-findings.json`: a disagreement, with `finding`, what each
 * side saw and why they differ, in words, and `ruling`, `pending` until the operator rules on it
 * and a {@link Ruling} after.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Finding` is the Schema and the type of a row under one name, so a decoder and a signature read as one thing.
export const Finding = Schema.Struct({
  file: Schema.String,
  finding: Schema.NonEmptyString,
  pantry: PantrySide,
  plate: PlateSide,
  ruling: Schema.Union([Schema.Literal("pending"), Ruling]),
});

/**
 * One row of the findings file.
 */
export type Finding = typeof Finding.Type;

/**
 * The failure of reading the verdicts copy.
 *
 * `path` is the copy's path and `detail` the operating system's reason.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class VerdictsUnreadable extends Schema.TaggedError<VerdictsUnreadable>()(
  "VerdictsUnreadable",
  { detail: Schema.String, path: Schema.String },
) {
  /**
   * The copy that cannot be read, why, and what to change.
   */
  override get message(): string {
    return `cannot read the verdicts copy ${this.path}: ${this.detail}. Copy ${verdictsSource} at ${verdictsCommit} to it: git show ${verdictsCommit}:${verdictsSource} > ${this.path}`;
  }
}

/**
 * The verdicts copy: its header's cells and its rows.
 */
export interface Verdicts {
  readonly header: readonly string[];
  readonly rows: readonly PantryRow[];
}

/**
 * Decode the rows of a verdict file, each an object keyed by the header's cells.
 */
const decodeRows = Schema.decodeUnknownEffect(Schema.Array(PantryRow));

/**
 * Read a verdict file's text: its first line is the header, and each line after it is one row,
 * its cells keyed by the header's cells in order.
 *
 * @param text The file's text, TSV with LF line ends.
 * @returns The header's cells and the rows; a `SchemaError` when a row lacks a column
 *   {@link PantryRow} reads or holds a verdict other than `accepted` or `refused`.
 */
export const readVerdicts = Effect.fnUntraced(function* readVerdicts(
  text: string,
): Effect.fn.Return<Verdicts, Schema.SchemaError> {
  const [first = "", ...lines] = text.split("\n").filter((line) => line !== "");
  const header = first.split("\t");
  const rows = yield* decodeRows(
    lines.map((line) => {
      const cells = line.split("\t");

      return Object.fromEntries(header.map((column, index) => [column, cells[index]]));
    }),
  );

  return { header, rows };
});

/**
 * The verdicts copy, read and decoded.
 *
 * Fails with {@link VerdictsUnreadable} when the copy cannot be read, and a `SchemaError` when a
 * row does not decode.
 */
export const pantryVerdicts: Effect.Effect<Verdicts, VerdictsUnreadable | Schema.SchemaError> =
  Effect.tryPromise({
    catch: (cause) =>
      new VerdictsUnreadable({
        detail: cause instanceof Error ? cause.message : String(cause),
        path: verdictsCopy,
      }),
    try: () => readFile(verdictsCopy, "utf-8"),
  }).pipe(Effect.flatMap(readVerdicts), Effect.withSpan("pantryVerdicts"));

/**
 * The findings file, `agreement-findings.json`, decoded.
 *
 * Fails with a `SchemaError` when a row is not a {@link Finding}.
 */
export const findings: Effect.Effect<readonly Finding[], Schema.SchemaError> =
  Schema.decodeUnknownEffect(Schema.Array(Finding))(committedFindings);

/**
 * Take plate's side of a package from its verdict.
 *
 * @param verdict The verdict `openPackage` gave.
 * @returns Its verdict, and its refusals' rules, each once, in order.
 */
export const plateSide = (verdict: PackageVerdict): PlateSide => ({
  rules:
    verdict.verdict === "refused" ? [...new Set(verdict.refusals.map((entry) => entry.rule))] : [],
  verdict: verdict.verdict,
});

/**
 * Report whether plate's side agrees with pantry's: plate accepts, with unsupported features or
 * without, what pantry accepts, or refuses what pantry refuses. The rules are not compared, and
 * `unchecked` agrees with nothing.
 *
 * @param plate Plate's side.
 * @param pantry Pantry's side.
 * @returns Whether the two agree.
 */
export const agrees = (plate: PlateSide, pantry: PantrySide): boolean =>
  plate.verdict !== "unchecked" &&
  pantry.verdict === (plate.verdict === "refused" ? "refused" : "accepted");

/**
 * A ruled finding row whose ruling no longer holds: `agrees` when its package's verdicts now
 * agree, and `state-changed` when either side the agreement's run found differs from the state the
 * ruling records.
 */
export interface StaleRuling {
  readonly file: string;
  readonly reason: "agrees" | "state-changed";
}

/**
 * Report whether a disagreement is the one a ruling was made on: the same sides, verdicts and
 * rules alike, plate's rules in the same order.
 *
 * @param state The state the ruling records.
 * @param entry The disagreement the agreement's run found for the ruling's package.
 * @returns Whether both sides are the state's.
 */
const sameSides = (state: RulingState, entry: Disagreement): boolean =>
  state.pantry.verdict === entry.pantry.verdict &&
  state.pantry.rule === entry.pantry.rule &&
  state.plate.verdict === entry.plate.verdict &&
  state.plate.rules.length === entry.plate.rules.length &&
  state.plate.rules.every((rule, index) => rule === entry.plate.rules[index]);

/**
 * Find every ruled finding row whose ruling is stale: its package now agrees, or either side of its
 * disagreement is not the state the ruling was made on. The state's commit is not compared, and a
 * pending row is never stale.
 *
 * @param rows The findings file's rows.
 * @param seen The disagreements the agreement's run found.
 * @returns One entry per stale ruling, naming its row, in the rows' order; none when every ruling
 *   holds.
 */
export const staleRulings = (
  rows: readonly Finding[],
  seen: readonly Disagreement[],
): readonly StaleRuling[] =>
  rows.flatMap((row): StaleRuling[] => {
    if (row.ruling === "pending") {
      return [];
    }

    const now = seen.find((entry) => entry.file === row.file);
    if (now === undefined) {
      return [{ file: row.file, reason: "agrees" }];
    }

    return sameSides(row.ruling.state, now) ? [] : [{ file: row.file, reason: "state-changed" }];
  });

/**
 * Read every file of a corpus package's extracted folder, keyed by its path from the folder.
 *
 * @param directory The folder, as a path from the corpus root.
 * @returns The package's files; {@link CorpusFileUnreadable} when the folder cannot be listed or a
 *   file read, {@link CorpusMissing} when the corpus root does not exist.
 */
const packageFiles = Effect.fnUntraced(function* packageFiles(
  directory: string,
): Effect.fn.Return<
  ReadonlyMap<string, Uint8Array>,
  CorpusFileUnreadable | CorpusMissing | Config.ConfigError
> {
  const folder = path.join(yield* corpusRoot, directory);
  const entries = yield* Effect.tryPromise({
    catch: (cause) =>
      new CorpusFileUnreadable({
        detail: `${cause instanceof Error ? cause.message : String(cause)}; extract each of the corpus's zips into the X.zip.d/ folder beside it`,
        path: directory,
      }),
    try: () => readdir(folder, { recursive: true, withFileTypes: true }),
  });
  const paths = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(folder, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    );
  const contents = yield* Effect.all(paths.map((file) => readCorpusFile(`${directory}/${file}`)));

  return new Map(paths.map((file, index) => [file, contents[index] ?? new Uint8Array()]));
});

/**
 * Judge one corpus zip as plate does: its extracted folder, `X.zip.d/`, through `openPackage`.
 *
 * @param file The zip, as a path from the corpus root, the key pantry's verdict file gives it.
 * @returns Plate's side of it.
 */
export const judgePackage = Effect.fn("judgePackage")(function* judgePackage(
  file: string,
): Effect.fn.Return<PlateSide, CorpusFileUnreadable | CorpusMissing | Config.ConfigError> {
  yield* Effect.annotateCurrentSpan("agreement.file", file);

  const directory = `${file}.d`;

  return plateSide(yield* openPackage(directory, yield* packageFiles(directory)));
});

/**
 * Every package plate and pantry disagree on, in the verdict file's order.
 *
 * Fails as {@link pantryVerdicts} and {@link judgePackage} fail.
 */
export const disagreements: Effect.Effect<
  readonly Disagreement[],
  | CorpusFileUnreadable
  | CorpusMissing
  | Config.ConfigError
  | Schema.SchemaError
  | VerdictsUnreadable
> = Effect.gen(function* disagreements() {
  const { rows } = yield* pantryVerdicts;
  const judged = yield* Effect.all(
    rows.map((row) =>
      Effect.map(judgePackage(row.file), (plate) => ({
        file: row.file,
        pantry: { rule: row.rule, verdict: row.verdict },
        plate,
      })),
    ),
  );

  return judged.filter((entry) => !agrees(entry.plate, entry.pantry));
}).pipe(Effect.withSpan("disagreements"));

/**
 * The corpus's zips that pantry's verdict file covers: every regular file whose name ends in
 * `.zip` under the corpus root, outside an extracted `X.zip.d/` folder and the QTI 2.2 examples,
 * as paths from the root, sorted.
 *
 * Fails with {@link CorpusFileUnreadable} when the root cannot be listed.
 */
export const corpusZips: Effect.Effect<
  readonly string[],
  CorpusFileUnreadable | Config.ConfigError
> = Effect.gen(function* corpusZips() {
  const root = yield* corpusRoot;
  const entries = yield* Effect.tryPromise({
    catch: (cause) =>
      new CorpusFileUnreadable({
        detail: `${cause instanceof Error ? cause.message : String(cause)}; extract the 1EdTech QTI 3 examples under ~/.cache/gr8des/qti3-examples, or set PLATE_CORPUS_DIR to the directory that holds them`,
        path: ".",
      }),
    try: () => readdir(root, { recursive: true, withFileTypes: true }),
  });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".zip"))
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    )
    .filter((member) => !member.startsWith(`${qti2Folder}/`) && !member.includes(".zip.d/"))
    .toSorted();
}).pipe(Effect.withSpan("corpusZips"));
