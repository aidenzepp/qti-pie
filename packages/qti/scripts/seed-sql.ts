/**
 * Prints the seed tables as SQL, one INSERT statement per 1000 rows, against the installed names
 * grizzle derives. Run with `node scripts/seed-sql.ts` from `packages/qti`; it touches no database.
 *
 * `--only <Table,...>` prints only the named tables (PascalCase or installed snake_case names).
 * `--minus <path>`, repeatable, omits every row tuple already present in the named `01-seed.sql`,
 * or, for a directory, in any `01-seed.sql` one folder below it, and prints the remainder in the
 * same batched form.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import type { AdmissionRow } from "#qti/schema/kinds/generic.ts";
import { admission } from "#qti/schema/seed/admission.ts";
import type { BindingFitRow } from "#qti/schema/seed/binding-fit.ts";
import { bindingFit } from "#qti/schema/seed/binding-fit.ts";
import {
  operatorArity,
  operatorArityMax,
  operatorArityUnbounded,
} from "#qti/schema/seed/operator-arity.ts";
import { resourceTypes } from "#qti/schema/seed/resource-types.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";

const SCHEMA = "qti";

const BATCH = 1000;

/**
 * A column of a seed table: its installed name, and how a row renders its SQL literal.
 */
interface Column<Row> {
  readonly name: string;
  readonly sql: (row: Row) => string;
}

/**
 * A seed table: its installed name, its columns and its rows in deterministic order.
 */
interface Table<Row> {
  readonly columns: readonly Column<Row>[];
  readonly name: string;
  readonly rows: readonly Row[];
}

const quote = (identifier: string): string => `"${identifier.replaceAll('"', '""')}"`;

const literal = (text: string): string => `'${text.replaceAll("'", "''")}'`;

/**
 * A text column.
 */
const text = <Row>(name: string, get: (row: Row) => string): Column<Row> => ({
  name,
  sql: (row) => literal(get(row)),
});

/**
 * A column of a closed roster, cast to the roster's installed enum type.
 */
const handle = <Row>(name: string, cast: string, get: (row: Row) => string): Column<Row> => ({
  name,
  sql: (row) => `${literal(get(row))}::${quote(SCHEMA)}.${quote(cast)}`,
});

/**
 * A bigint column.
 */
const integer = <Row>(name: string, get: (row: Row) => bigint): Column<Row> => ({
  name,
  sql: (row) => get(row).toString(),
});

/**
 * A seed table rendered: its installed name, its row count and its INSERT statements.
 */
interface Rendered {
  readonly count: number;
  readonly name: string;
  readonly statements: readonly string[];
}

/**
 * Collapses every run of whitespace to one space, so a row tuple compares by its text.
 */
const normalize = (statement: string): string => statement.replaceAll(/\s+/gu, " ").trim();

/**
 * The row tuples of one INSERT statement's VALUES list, split at the top level so quotes may hold
 * commas and parentheses.
 */
const tuplesOf = (values: string): readonly string[] => {
  const tuples: string[] = [];
  let depth = 0;
  let quoted = false;
  let start = 0;
  for (let index = 0; index < values.length; index += 1) {
    const char = values[index];
    if (char === "'") {
      quoted = !quoted;
    } else if (!quoted && char === "(") {
      if (depth === 0) {
        start = index;
      }

      depth += 1;
    } else if (!quoted && char === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(values.slice(start, index + 1));
      }
    }
  }

  return tuples;
};

const INSERT_HEAD = /INSERT INTO "[^"]*"\."(?<table>(?:[^"]|"")+)"\s*\([^)]*\)\s*VALUES\s/gu;

/**
 * Every `table|tuple` key of the INSERT statements in one seed file.
 */
const keysOfFile = (file: string): readonly string[] => {
  const body = readFileSync(file, "utf-8");
  const heads = [...body.matchAll(INSERT_HEAD)];

  return heads.flatMap((match, index) => {
    const from = match.index + match[0].length;
    const to = heads[index + 1]?.index ?? body.length;

    return tuplesOf(body.slice(from, to)).map(
      (tuple) => `${match.groups?.["table"]?.replaceAll('""', '"')}|${normalize(tuple)}`,
    );
  });
};

/**
 * The `01-seed.sql` files a `--minus` path names: the file itself, or every `01-seed.sql` one
 * folder below a directory.
 */
const seedFilesOf = (target: string): readonly string[] =>
  statSync(target).isDirectory()
    ? readdirSync(target, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => path.join(target, entry.name, "01-seed.sql"))
        .filter((file) => statSync(file, { throwIfNoEntry: false })?.isFile() === true)
    : [target];

const flags = parseArgs({
  allowPositionals: false,
  options: {
    minus: { multiple: true, type: "string" },
    only: { type: "string" },
  },
}).values;

const subtracted: ReadonlySet<string> = new Set(
  (flags.minus ?? []).flatMap(seedFilesOf).flatMap(keysOfFile),
);

const tableKey = (name: string): string => name.replaceAll("_", "").toLowerCase();

const renderTable = <Row>(table: Table<Row>): Rendered => {
  const kept = table.rows.filter(
    (row) =>
      !subtracted.has(
        `${table.name}|${normalize(`(${table.columns.map((column) => column.sql(row)).join(", ")})`)}`,
      ),
  );
  const head = `INSERT INTO ${quote(SCHEMA)}.${quote(table.name)} (${table.columns
    .map((column) => quote(column.name))
    .join(", ")}) VALUES `;
  const batches: string[] = [];
  for (let start = 0; start < kept.length; start += BATCH) {
    const tuples = kept
      .slice(start, start + BATCH)
      .map((row) => `(${table.columns.map((column) => column.sql(row)).join(", ")})`);
    batches.push(`${head}${tuples.join(", ")};`);
  }

  return { count: kept.length, name: table.name, statements: batches };
};

const bindingFitRows = bindingFit.toSorted(
  (a, b) =>
    a.interactionKind.localeCompare(b.interactionKind) ||
    a.baseType.localeCompare(b.baseType) ||
    a.cardinality.localeCompare(b.cardinality),
);

const allTables: readonly Rendered[] = [
  renderTable<AdmissionRow>({
    columns: [
      handle("version", "schema_version", (row) => row.version),
      handle("parent", "node_kind", (row) => row.parent),
      handle("child", "node_kind", (row) => row.child),
    ],
    name: "admission",
    rows: admission,
  }),
  renderTable<BindingFitRow>({
    columns: [
      handle("interaction_kind", "node_kind", (row) => row.interactionKind),
      handle("base_type", "base_type", (row) => row.baseType),
      handle("cardinality", "typed_cardinality", (row) => row.cardinality),
    ],
    name: "binding_fit",
    rows: bindingFitRows,
  }),
  renderTable<(typeof resourceTypes)[number]>({
    columns: [
      handle("version", "schema_version", (row) => row.version),
      text("type", (row) => row.type),
    ],
    name: "resource_type_of",
    rows: resourceTypes,
  }),
  renderTable<(typeof rootOfType)[number]>({
    columns: [text("type", (row) => row.type), handle("root", "root_kind", (row) => row.root)],
    name: "root_of_type",
    rows: rootOfType,
  }),
  renderTable<(typeof operatorArity)[number]>({
    columns: [handle("kind", "node_kind", (row) => row.kind), integer("min", (row) => row.min)],
    name: "operator_arity",
    rows: operatorArity,
  }),
  renderTable<(typeof operatorArityMax)[number]>({
    columns: [handle("kind", "node_kind", (row) => row.kind), integer("max", (row) => row.max)],
    name: "operator_arity_max",
    rows: operatorArityMax,
  }),
  renderTable<(typeof operatorArityUnbounded)[number]>({
    columns: [handle("kind", "node_kind", (row) => row.kind)],
    name: "operator_arity_unbounded",
    rows: operatorArityUnbounded,
  }),
];

const named = flags.only?.split(",").map((name) => name.trim());

const wanted = named?.map(tableKey);

const unknown = (named ?? []).filter(
  (name) => !allTables.some((table) => tableKey(table.name) === tableKey(name)),
);

if (unknown.length > 0) {
  process.stderr.write(
    `--only names no seed table: ${unknown.join(", ")}; the tables are ${allTables.map((table) => table.name).join(", ")}\n`,
  );
  process.exit(1);
}

const tables = allTables.filter(
  (table) => wanted === undefined || wanted.includes(tableKey(table.name)),
);

const counts = tables.map((table) => `${table.name} ${table.count}`).join(", ");

const lines = [`-- generated by scripts/seed-sql.ts; ${counts}`];

for (const table of tables) {
  if (table.count === 0) {
    lines.push(`-- ${table.name}: no rows to insert`);
  } else {
    lines.push(...table.statements);
  }
}

process.stdout.write(`${lines.join("\n")}\n`);
