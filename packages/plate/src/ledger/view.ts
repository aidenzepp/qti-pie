/**
 * The view: the ledger as text and as HTML, and the per-document verdict report as text lines and
 * as a table, for a reader outside the project (D11).
 *
 * The ledger reads by level (Basic, Advanced, Elevated, elective), each opening with its headline,
 * then by family, one table per family with the feature ID as the row header. The `limited` rows
 * are listed again with their sources, then the browser-support note and the session's records.
 * The text and the HTML say the same thing; the HTML is built through `h`, so the serialiser
 * escapes every string, a test title included. The ledger says only that these tests pass over
 * these fixtures, and never claims conformance or certification.
 *
 * The verdict report is the validator's vocabulary (OD-4), not the ledger's: one line or row per
 * document with its verdict, each refusal's rule and sentence or each `unchecked` reason, and the
 * unsupported features an accepted document holds.
 *
 * @module
 */
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import type { SupportNote } from "#plate/ledger/browser-support.ts";
import { families, levels } from "#plate/ledger/features.ts";
import type { PassRecord } from "#plate/ledger/passes.ts";
import type {
  InteractionColumns,
  Ledger,
  LedgerRow,
  ProofFile,
  RowState,
} from "#plate/ledger/report.ts";
import { describeRefusal } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * A level of the features file.
 */
type Level = (typeof levels)[number];

/**
 * A family of the features file, by its letter.
 */
type Family = (typeof families)[number];

/**
 * A level's headline: how many of its rows have each state.
 */
type Headline = Ledger["headlines"][Level];

/**
 * A `limited` row.
 */
type LimitedRow = Extract<LedgerRow, { readonly state: "limited" }>;

/**
 * The ledger's title, its first heading and its text's first line.
 */
const title = "Feature ledger";

/**
 * What the ledger says, and what a row's state means. It says that tests pass over fixtures, never
 * that anything conforms or is certified.
 */
const intro =
  "For each feature of QTI 3.0's Appendix A feature list, this ledger says only this: these tests pass over these fixtures. A row is covered when a passing test carries its ID, limited when a member-only source bounds what its tests can prove, excluded when the goal leaves it out, and not yet supported when no passing test carries its ID.";

/**
 * The words each level is headed by.
 */
const levelWords: Readonly<Record<Level, string>> = {
  advanced: "Advanced",
  basic: "Basic",
  elective: "Elective",
  elevated: "Elevated",
};

/**
 * The words each family is named by.
 */
const familyWords: Readonly<Record<Family, string>> = {
  A: "Accessibility",
  I: "Items",
  M: "Metadata",
  P: "Packaging",
  Q: "Interactions",
  S: "Sections",
  T: "Tests",
};

/**
 * The column headers every family table has, the row header (the ID) first.
 */
const rowColumns = ["ID", "Feature", "State", "Proofs", "Source", "Validates", "Renders"] as const;

/**
 * The column headers only the interaction (Q) tables add.
 */
const interactionColumns = ["Keyboard", "Screen-reader pass", "Composition"] as const;

/**
 * What a sweep proof shows in place of the documents it proves over.
 */
const sweepDocuments = "every corpus document (the sweep)";

/**
 * Where the public repository holds the package's files, which a proof's test file links to.
 */
const repository = "https://github.com/aidenzepp/qti-pie/blob/main/packages/plate";

/**
 * The sentence the browser-support note is while no stylesheet uses a feature below the floor.
 */
const noSupportNote =
  "The stylesheets use no Baseline-low feature: every feature they use is Baseline widely available.";

/**
 * The caption of the browser-support note's table.
 */
const supportCaption = "Features the stylesheets use below Baseline widely available";

/**
 * The column headers of the browser-support note's table, the row header (the feature) first.
 */
const supportColumns = ["Feature", "Baseline", "What a browser without it shows"] as const;

/**
 * The words each baseline below the floor is shown in.
 */
const baselineWords: Readonly<Record<SupportNote["status"], string>> = {
  limited: "limited availability",
  low: "newly available",
};

/**
 * The column headers of the records' table, the row header (the reader) first.
 */
const recordColumns = [
  "Reader",
  "Entry",
  "Check",
  "Item",
  "JavaScript",
  "Control",
  "Result",
  "Date",
  "Browser",
  "macOS",
  "Interactions",
  "Notes",
  "Owner",
] as const;

/**
 * The words each kind of record is shown in.
 */
const entryWords: Readonly<Record<PassRecord["kind"], string>> = {
  "manual-check": "manual check",
  "screen-reader-pass": "screen-reader pass",
  "unavailable-reader": "unavailable reader",
};

/**
 * The caption of the records' table.
 */
const recordsCaption = "Session records";

/**
 * The sentence the records are while the session has recorded nothing.
 */
const noRecords = "No session has been recorded yet.";

/**
 * The column headers of the verdict report's table, the row header (the document) first.
 */
const verdictColumns = ["Document", "Verdict", "Reason", "Unsupported features"] as const;

/**
 * Word a row's state for a reader: `unsupported-with-notice` as "not yet supported", its ID kept
 * beside it; every other state as it is.
 *
 * @param state The row's state.
 * @returns The state's words.
 */
const stateWords = (state: RowState): string =>
  state === "unsupported-with-notice" ? `not yet supported (${state})` : state;

/**
 * Word a level's headline.
 *
 * @param counts How many of the level's rows have each state.
 * @returns The counts as one sentence.
 */
const headlineWords = (counts: Headline): string =>
  `${String(counts.covered)} covered, ${String(counts.limited)} limited, ${String(counts.excluded)} excluded, ${String(counts["unsupported-with-notice"])} not yet supported.`;

/**
 * Give the caption of a family's table within a level.
 *
 * @param level The level.
 * @param family The family.
 * @returns The caption, such as `Basic: Interactions (Q)`.
 */
const captionOf = (level: Level, family: Family): string =>
  `${levelWords[level]}: ${familyWords[family]} (${family})`;

/**
 * Group a level's rows by family, in the families' order, leaving out a family with none.
 *
 * @param ledger The ledger.
 * @param level The level.
 * @returns Each family that has a row at the level, with its rows in the ledger's order.
 */
const familiesAt = (
  ledger: Ledger,
  level: Level,
): readonly { readonly family: Family; readonly rows: readonly LedgerRow[] }[] =>
  families
    .map((family) => ({
      family,
      rows: ledger.rows.filter((row) => row.level === level && row.family === family),
    }))
    .filter((group) => group.rows.length > 0);

/**
 * Give what bounds a row: a `limited` row's source, an `excluded` row's reason and source.
 *
 * @param row The row.
 * @returns The words, empty for a row in any other state.
 */
const sourceOf = (row: LedgerRow): string => {
  if (row.state === "limited") {
    return row.source;
  }

  if (row.state === "excluded") {
    return `Reason: ${row.reason}. Source: ${row.source}`;
  }

  return "";
};

/**
 * Word whether a column holds for a row.
 *
 * @param value Whether it holds.
 * @returns `yes` or `no`.
 */
const yesNo = (value: boolean): string => (value ? "yes" : "no");

/**
 * Word the corpus documents a proof's test file names.
 *
 * @param proof The proof.
 * @returns The sweep's words, the documents' paths, or that the file names none.
 */
const documentsWords = (proof: ProofFile): string => {
  if (proof.kind === "sweep") {
    return sweepDocuments;
  }

  return proof.documents.length === 0 ? "none named in the file" : proof.documents.join(", ");
};

/**
 * Give an interaction row's latest screen-reader pass.
 *
 * @param columns The row's interaction columns, absent on a row that has none.
 * @returns The pass's date, or `none recorded`.
 */
const screenReaderWords = (columns: InteractionColumns | undefined): string =>
  columns?.screenReaderPass?.date ?? "none recorded";

/**
 * Word how an interaction row's keyboard proofs are composed.
 *
 * @param columns The row's interaction columns, absent on a row that has none.
 * @returns The compositions, comma-separated, or `none`.
 */
const compositionWords = (columns: InteractionColumns | undefined): string =>
  columns === undefined || columns.composition.length === 0
    ? "none"
    : columns.composition.join(", ");

/**
 * Give the link a proof's test file opens: the file in the public repository.
 *
 * @param file The package-relative test file.
 * @returns The file's URL.
 */
const testFileHref = (file: string): string =>
  `${repository}/${file.split("/").map(encodeURIComponent).join("/")}`;

/**
 * Give the link a corpus document opens: its page in the dev playground.
 *
 * @param document The corpus-relative path.
 * @returns The page's URL.
 */
const documentHref = (document: string): string =>
  `/item?${new URLSearchParams([["path", document]]).toString()}`;

/**
 * Give a list of words as a bulleted list, or `none` when there are none.
 *
 * @param items The words.
 * @returns The nodes a cell holds.
 */
const listOrNone = (items: readonly string[]): readonly Node[] =>
  items.length === 0
    ? [text("none")]
    : [
        h(
          "ul",
          {},
          items.map((item) => h("li", {}, [text(item)])),
        ),
      ];

/**
 * Construct a data cell holding words, empty when the words are.
 *
 * @param words The words.
 * @returns The cell.
 */
const cell = (words: string): Element => h("td", {}, words === "" ? [] : [text(words)]);

/**
 * Construct a table's caption and its row of column headers.
 *
 * @param caption The caption.
 * @param columns The column headers.
 * @returns The caption and the head.
 */
const tableHead = (caption: string, columns: readonly string[]): readonly Element[] => [
  h("caption", {}, [text(caption)]),
  h("thead", {}, [
    h(
      "tr",
      {},
      columns.map((column) => h("th", { scope: "col" }, [text(column)])),
    ),
  ]),
];

/**
 * Construct a row's proofs: per test file, a link to it, its tagged tests, and the corpus
 * documents it names, each a link.
 *
 * @param proofs The row's proofs.
 * @returns The nodes the Proofs cell holds.
 */
const proofsHtml = (proofs: readonly ProofFile[]): readonly Node[] =>
  proofs.length === 0
    ? [text("none")]
    : [
        h(
          "ul",
          {},
          proofs.map((proof) =>
            h("li", {}, [
              h("a", { href: testFileHref(proof.file) }, [text(proof.file)]),
              h(
                "ul",
                {},
                proof.tests.map((test) => h("li", {}, [text(test)])),
              ),
              ...(proof.kind === "fixtures" && proof.documents.length > 0
                ? [
                    h("p", {}, [text("Corpus documents:")]),
                    h(
                      "ul",
                      {},
                      proof.documents.map((document) =>
                        h("li", {}, [h("a", { href: documentHref(document) }, [text(document)])]),
                      ),
                    ),
                  ]
                : [h("p", {}, [text(`Corpus documents: ${documentsWords(proof)}`)])]),
            ]),
          ),
        ),
      ];

/**
 * Construct a family's table at a level: the ID as the row header, then the name, state, proofs,
 * source and columns, and an interaction table's own columns.
 *
 * @param level The level.
 * @param family The family.
 * @param rows The family's rows at the level.
 * @returns The table.
 */
const familyTable = (level: Level, family: Family, rows: readonly LedgerRow[]): Element =>
  h("table", {}, [
    ...tableHead(
      captionOf(level, family),
      family === "Q" ? [...rowColumns, ...interactionColumns] : rowColumns,
    ),
    h(
      "tbody",
      {},
      rows.map((row) =>
        h("tr", {}, [
          h("th", { scope: "row" }, [text(row.id)]),
          cell(row.name),
          cell(stateWords(row.state)),
          h("td", {}, proofsHtml(row.proofs)),
          cell(sourceOf(row)),
          cell(yesNo(row.validates)),
          cell(yesNo(row.renders)),
          ...(family === "Q"
            ? [
                h("td", {}, listOrNone(row.interaction?.keyboard ?? [])),
                cell(screenReaderWords(row.interaction)),
                cell(compositionWords(row.interaction)),
              ]
            : []),
        ]),
      ),
    ),
  ]);

/**
 * Decide whether a row is `limited`.
 *
 * @param row The row.
 * @returns Whether its state is `limited`.
 */
const isLimited = (row: LedgerRow): row is LimitedRow => row.state === "limited";

/**
 * Word a `limited` row with its source.
 *
 * @param row The row.
 * @returns Its ID, name and source.
 */
const limitedWords = (row: LimitedRow): string => `${row.id} ${row.name}: ${row.source}`;

/**
 * Word one row of the browser-support note.
 *
 * @param note The row.
 * @returns Its feature, its baseline and what a browser without it shows.
 */
const supportWords = (note: SupportNote): string =>
  `${note.feature}: ${baselineWords[note.status]}; without it, ${note.degrade}`;

/**
 * Give a record's cells, in {@link recordColumns}' order: a cell that does not apply to its kind is
 * empty.
 *
 * @param record The record.
 * @returns Its cells' words.
 */
const recordCells = (record: PassRecord): readonly string[] => [
  `${record.reader} ${record.readerVersion}`.trim(),
  entryWords[record.kind],
  record.kind === "manual-check" ? record.check : "",
  record.item,
  record.javascript,
  record.kind === "manual-check" && record.check === "OD-14 (e)" ? record.control : "",
  record.result,
  record.date,
  `${record.browser} ${record.browserVersion}`.trim(),
  record.macosVersion,
  record.kind === "screen-reader-pass" ? record.interactions.join(", ") : "",
  record.notes,
  record.owner,
];

/**
 * Word a record as one line: each cell that applies, after its column's header.
 *
 * @param record The record.
 * @returns The line.
 */
const recordWords = (record: PassRecord): string =>
  recordCells(record)
    .map((words, index) => [recordColumns[index] ?? "", words] as const)
    .filter(([, words]) => words !== "")
    .map(([column, words]) => `${column}: ${words}`)
    .join("; ");

/**
 * Write a list of a row's titles as text lines under a label.
 *
 * @param label The label.
 * @param items The titles.
 * @returns `none` beside the label, or the label and one indented line per title.
 */
const labelledLines = (label: string, items: readonly string[]): readonly string[] =>
  items.length === 0
    ? [`  ${label}: none`]
    : [`  ${label}:`, ...items.map((item) => `    ${item}`)];

/**
 * Write a row's proofs as text lines: per test file, its path, its tagged tests and the corpus
 * documents it names.
 *
 * @param proofs The row's proofs.
 * @returns The lines.
 */
const proofLines = (proofs: readonly ProofFile[]): readonly string[] =>
  proofs.length === 0
    ? ["  Proofs: none"]
    : [
        "  Proofs:",
        ...proofs.flatMap((proof) => [
          `    ${proof.file}`,
          ...proof.tests.map((test) => `      Test: ${test}`),
          `      Corpus documents: ${documentsWords(proof)}`,
        ]),
      ];

/**
 * Write a row as text lines: its ID and name, then its state, proofs, source and columns, each
 * indented.
 *
 * @param row The row.
 * @param family The row's family, whose interaction rows have their own columns.
 * @returns The lines.
 */
const rowLines = (row: LedgerRow, family: Family): readonly string[] => {
  const source = sourceOf(row);

  return [
    `${row.id} ${row.name}`,
    `  State: ${stateWords(row.state)}`,
    ...proofLines(row.proofs),
    ...(source === "" ? [] : [`  Source: ${source}`]),
    `  Validates: ${yesNo(row.validates)}`,
    `  Renders: ${yesNo(row.renders)}`,
    ...(family === "Q"
      ? [
          ...labelledLines("Keyboard", row.interaction?.keyboard ?? []),
          `  Screen-reader pass: ${screenReaderWords(row.interaction)}`,
          `  Composition: ${compositionWords(row.interaction)}`,
        ]
      : []),
  ];
};

/**
 * Write the ledger as plain text, one line per fact, the same content {@link ledgerHtml} shows.
 *
 * @param ledger The ledger.
 * @param support The browser-support note's rows; `browserSupport` when absent.
 * @returns The text: the title and what it says, each level's headline and its rows by family, the
 *   `limited` rows with their sources, the browser-support note and the records, each line ending
 *   in a line feed.
 */
export const ledgerText = (
  ledger: Ledger,
  support: readonly SupportNote[] = browserSupport,
): string => {
  const limited = ledger.rows.filter(isLimited);

  return [
    title,
    "",
    intro,
    ...levels.flatMap((level) => [
      "",
      levelWords[level],
      headlineWords(ledger.headlines[level]),
      ...familiesAt(ledger, level).flatMap(({ family, rows }) => [
        "",
        captionOf(level, family),
        ...rows.flatMap((row) => rowLines(row, family)),
      ]),
    ]),
    "",
    "Limited rows",
    ...(limited.length === 0 ? ["No row is limited."] : limited.map(limitedWords)),
    "",
    "Browser support",
    ...(support.length === 0 ? [noSupportNote] : support.map(supportWords)),
    "",
    "Records",
    ...(ledger.records.length === 0 ? [noRecords] : ledger.records.map(recordWords)),
  ]
    .map((line) => `${line}\n`)
    .join("");
};

/**
 * Construct the ledger as an HTML tree, a plain page a third party can read: per level its heading,
 * its headline and a table per family, then the `limited` rows with their sources, the
 * browser-support note and the records.
 *
 * Every table has a caption and column headers (`th scope="col"`), and each row a row header
 * (`th scope="row"`): the feature ID, the feature, or the reader. A proof links to its test file in
 * the public repository and to each corpus document it names in the dev playground. Headings start
 * at `h1`. Every string is a text node, so the serialiser escapes it.
 *
 * @param ledger The ledger.
 * @param support The browser-support note's rows; `browserSupport` when absent.
 * @returns An `article` in `lang="en"`.
 */
export const ledgerHtml = (
  ledger: Ledger,
  support: readonly SupportNote[] = browserSupport,
): Element => {
  const limited = ledger.rows.filter(isLimited);

  return h("article", { lang: "en" }, [
    h("h1", {}, [text(title)]),
    h("p", {}, [text(intro)]),
    ...levels.flatMap((level) => [
      h("h2", {}, [text(levelWords[level])]),
      h("p", {}, [text(headlineWords(ledger.headlines[level]))]),
      ...familiesAt(ledger, level).map(({ family, rows }) => familyTable(level, family, rows)),
    ]),
    h("h2", {}, [text("Limited rows")]),
    limited.length === 0
      ? h("p", {}, [text("No row is limited.")])
      : h(
          "ul",
          {},
          limited.map((row) => h("li", {}, [text(limitedWords(row))])),
        ),
    h("h2", {}, [text("Browser support")]),
    support.length === 0
      ? h("p", {}, [text(noSupportNote)])
      : h("table", {}, [
          ...tableHead(supportCaption, supportColumns),
          h(
            "tbody",
            {},
            support.map((note) =>
              h("tr", {}, [
                h("th", { scope: "row" }, [text(note.feature)]),
                cell(baselineWords[note.status]),
                cell(note.degrade),
              ]),
            ),
          ),
        ]),
    h("h2", {}, [text("Records")]),
    ledger.records.length === 0
      ? h("p", {}, [text(noRecords)])
      : h("table", {}, [
          ...tableHead(recordsCaption, recordColumns),
          h(
            "tbody",
            {},
            ledger.records.map((record) => {
              const [reader = "", ...rest] = recordCells(record);

              return h("tr", {}, [h("th", { scope: "row" }, [text(reader)]), ...rest.map(cell)]);
            }),
          ),
        ]),
  ]);
};

/**
 * Write text on one line: each line ending becomes a space.
 *
 * @param words The text.
 * @returns The text without line endings.
 */
const oneLine = (words: string): string => words.replaceAll(/\r\n|[\n\r\u2028\u2029]/gu, " ");

/**
 * Give why a document has its verdict: each refusal's rule and sentence, or each `unchecked`
 * reason and the path it concerns.
 *
 * @param verdict The document's verdict.
 * @returns The reasons, each on one line; none for an accepting verdict.
 */
const reasonsOf = (verdict: Verdict): readonly string[] => {
  if (verdict.verdict === "refused") {
    return verdict.refusals.map(
      (refusal) => `${refusal.rule}: ${oneLine(describeRefusal(refusal))}`,
    );
  }

  if (verdict.verdict === "unchecked") {
    return verdict.reasons.map((reason) => `${reason.reason} at ${reason.path}`);
  }

  return [];
};

/**
 * Give the features an accepted document holds and the renderer does not render.
 *
 * @param verdict The document's verdict.
 * @returns Each feature and the path of the element that carries it; none for a document that is
 *   not accepted.
 */
const unsupportedOf = (verdict: Verdict): readonly string[] =>
  verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? verdict.accepted.unsupported.map((feature) => `${feature.feature} at ${feature.path}`)
    : [];

/**
 * Join a list of words with semicolons, or give `none` when there are none.
 *
 * @param items The words.
 * @returns The joined words.
 */
const joinedOrNone = (items: readonly string[]): string =>
  items.length === 0 ? "none" : items.join("; ");

/**
 * Write the per-document verdict report as text: one line per document, in the order given, with
 * its path, its verdict, the reason (each refusal's rule and sentence, or each `unchecked` reason)
 * and the unsupported features it holds, separated by `|`.
 *
 * @param verdicts Each document's verdict.
 * @returns The lines, each ending in a line feed; empty for no documents.
 */
export const verdictLines = (verdicts: readonly Verdict[]): string =>
  verdicts
    .map(
      (verdict) =>
        `${verdict.document} | ${verdict.verdict} | reason: ${joinedOrNone(reasonsOf(verdict))} | unsupported features: ${joinedOrNone(unsupportedOf(verdict))}\n`,
    )
    .join("");

/**
 * Construct the per-document verdict report as a table: a caption, the column headers Document,
 * Verdict, Reason and Unsupported features (`th scope="col"`), and one row per document, in the
 * order given, its path the row header (`th scope="row"`) and a link to its page in the dev
 * playground.
 *
 * @param verdicts Each document's verdict.
 * @returns The table.
 */
export const verdictTable = (verdicts: readonly Verdict[]): Element =>
  h("table", {}, [
    ...tableHead("The verdict on each document", verdictColumns),
    h(
      "tbody",
      {},
      verdicts.map((verdict) =>
        h("tr", {}, [
          h("th", { scope: "row" }, [
            h("a", { href: documentHref(verdict.document) }, [text(verdict.document)]),
          ]),
          cell(verdict.verdict),
          h("td", {}, listOrNone(reasonsOf(verdict))),
          h("td", {}, listOrNone(unsupportedOf(verdict))),
        ]),
      ),
    ),
  ]);
