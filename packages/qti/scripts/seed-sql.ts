/**
 * Prints the seed tables as SQL, one INSERT statement per 1000 rows, one statement per line,
 * against the installed names grizzle derives. Run with `node scripts/seed-sql.ts` from
 * `packages/qti`; it touches no database.
 *
 * - `--only <Table,...>` prints only the named tables, by their declared names.
 * - `--minus <path>`, repeatable, omits every row the named file holds, or, for a directory, every
 *   row any `01-seed.sql` beneath it holds. The subtracted files may hold either form, batched
 *   (many tuples to one statement) or one row to a statement, so each is first normalized to one
 *   statement per row, and each kept row is compared in that single-row form.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import nodePath from "node:path";
import { parseArgs } from "node:util";
import type { AdmissionRow } from "#qti/schema/kinds/generic.ts";
import { AttributeName, Ancestry, NodeKind } from "#qti/schema/node.ts";
import { admission, ancestryStep, attributeAdmission } from "#qti/schema/seed/admission.ts";
import { mappableBaseType } from "#qti/schema/seed/mappable-base-type.ts";
import { recordBindingFit } from "#qti/schema/seed/record-binding-fit.ts";
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

/**
 * The most tuples one printed INSERT statement holds.
 */
const BATCH = 1000;

/**
 * A column of a seed table: its installed name, and how a row renders its SQL literal.
 */
interface Column<Row> {
  readonly name: string;
  readonly sql: (row: Row) => string;
}

/**
 * A seed table: its declared and installed names, its columns and its rows in deterministic order.
 */
interface Table<Row> {
  readonly columns: readonly Column<Row>[];
  readonly declared: string;
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
 * A seed table rendered: its names, its INSERT head and one value tuple per row.
 */
interface Rendered {
  readonly declared: string;
  readonly head: string;
  readonly name: string;
  readonly tuples: readonly string[];
}

const insertHead = (name: string, columns: readonly string[]): string =>
  `INSERT INTO ${quote(SCHEMA)}.${quote(name)} (${columns.map(quote).join(", ")}) VALUES `;

const renderTable = <Row>(table: Table<Row>): Rendered => ({
  declared: table.declared,
  head: insertHead(
    table.name,
    table.columns.map((column) => column.name),
  ),
  name: table.name,
  tuples: table.rows.map((row) => `(${table.columns.map((column) => column.sql(row)).join(", ")})`),
});

/**
 * The position of each handle of a roster, so a seed sorts by roster order.
 */
const orderOf = (handles: readonly string[]): ((handle: string) => number) => {
  const order = new Map(handles.map((name, index) => [name, index]));

  return (name) => {
    const position = order.get(name);
    if (position === undefined) {
      throw new Error(`a seed row names "${name}", which its roster does not declare`);
    }

    return position;
  };
};

const kindRank = orderOf(NodeKind.handles);

const attributeRank = orderOf(AttributeName.handles);

const ancestryRank = orderOf(Ancestry.handles);

const bindingFitRows = bindingFit.toSorted(
  (a, b) =>
    a.interactionKind.localeCompare(b.interactionKind) ||
    a.baseType.localeCompare(b.baseType) ||
    a.cardinality.localeCompare(b.cardinality),
);

const tables: readonly Rendered[] = [
  renderTable<AdmissionRow>({
    columns: [
      handle("version", "schema_version", (row) => row.version),
      handle("parent", "node_kind", (row) => row.parent),
      handle("child", "node_kind", (row) => row.child),
    ],
    declared: "Admission",
    name: "admission",
    rows: admission,
  }),
  renderTable<(typeof attributeAdmission)[number]>({
    columns: [
      handle("kind", "node_kind", (row) => row.kind),
      handle("attribute", "attribute_name", (row) => row.attribute),
    ],
    declared: "AttributeAdmission",
    name: "attribute_admission",
    rows: attributeAdmission.toSorted(
      (a, b) =>
        kindRank(a.kind) - kindRank(b.kind) ||
        attributeRank(a.attribute) - attributeRank(b.attribute),
    ),
  }),
  renderTable<(typeof ancestryStep)[number]>({
    columns: [
      handle("ancestry", "ancestry", (row) => row.ancestry),
      handle("kind", "node_kind", (row) => row.kind),
      handle("next", "ancestry", (row) => row.next),
    ],
    declared: "AncestryStep",
    name: "ancestry_step",
    rows: ancestryStep.toSorted(
      (a, b) =>
        ancestryRank(a.ancestry) - ancestryRank(b.ancestry) || kindRank(a.kind) - kindRank(b.kind),
    ),
  }),
  renderTable<BindingFitRow>({
    columns: [
      handle("interaction_kind", "node_kind", (row) => row.interactionKind),
      handle("base_type", "base_type", (row) => row.baseType),
      handle("cardinality", "typed_cardinality", (row) => row.cardinality),
    ],
    declared: "BindingFit",
    name: "binding_fit",
    rows: bindingFitRows,
  }),
  renderTable<(typeof mappableBaseType)[number]>({
    columns: [handle("base_type", "base_type", (row) => row.baseType)],
    declared: "MappableBaseType",
    name: "mappable_base_type",
    rows: mappableBaseType,
  }),
  renderTable<(typeof recordBindingFit)[number]>({
    columns: [handle("interaction_kind", "node_kind", (row) => row.interactionKind)],
    declared: "RecordBindingFit",
    name: "record_binding_fit",
    rows: recordBindingFit,
  }),
  renderTable<(typeof resourceTypes)[number]>({
    columns: [
      handle("version", "schema_version", (row) => row.version),
      text("type", (row) => row.type),
    ],
    declared: "ResourceTypeOf",
    name: "resource_type_of",
    rows: resourceTypes,
  }),
  renderTable<(typeof rootOfType)[number]>({
    columns: [text("type", (row) => row.type), handle("root", "root_kind", (row) => row.root)],
    declared: "RootOfType",
    name: "root_of_type",
    rows: rootOfType,
  }),
  renderTable<(typeof operatorArity)[number]>({
    columns: [handle("kind", "node_kind", (row) => row.kind), integer("min", (row) => row.min)],
    declared: "OperatorArity",
    name: "operator_arity",
    rows: operatorArity,
  }),
  renderTable<(typeof operatorArityMax)[number]>({
    columns: [handle("kind", "node_kind", (row) => row.kind), integer("max", (row) => row.max)],
    declared: "OperatorArityMax",
    name: "operator_arity_max",
    rows: operatorArityMax,
  }),
  renderTable<(typeof operatorArityUnbounded)[number]>({
    columns: [handle("kind", "node_kind", (row) => row.kind)],
    declared: "OperatorArityUnbounded",
    name: "operator_arity_unbounded",
    rows: operatorArityUnbounded,
  }),
];

/**
 * The value tuples of one statement's tuple list, split at the commas outside single quotes and
 * outside parentheses; a doubled quote inside a literal toggles twice and so stays inside.
 */
const splitTuples = (list: string): readonly string[] => {
  const tuples: string[] = [];
  let depth = 0;
  let quoted = false;
  let start = 0;
  for (let at = 0; at < list.length; at += 1) {
    const char = list[at];
    if (char === "'") {
      quoted = !quoted;
    } else if (!quoted && char === "(") {
      depth += 1;
    } else if (!quoted && char === ")") {
      depth -= 1;
    } else if (!quoted && depth === 0 && char === ",") {
      tuples.push(list.slice(start, at).trim());
      start = at + 1;
    }
  }
  tuples.push(list.slice(start).trim());

  return tuples.filter((tuple) => tuple !== "");
};

/**
 * One file's text normalized to one single-row `INSERT INTO <head> VALUES (<tuple>);` statement per
 * row; a line that is not an INSERT (a comment) passes through, and a file already in single-row
 * form normalizes to itself.
 */
const normalize = (sql: string): readonly string[] =>
  sql.split("\n").flatMap((line) => {
    const trimmed = line.trim();
    const at = trimmed.indexOf(" VALUES ");
    if (!trimmed.startsWith("INSERT INTO ") || at === -1 || !trimmed.endsWith(";")) {
      return [trimmed];
    }

    const head = trimmed.slice(0, at + " VALUES ".length);

    return splitTuples(trimmed.slice(head.length, -1)).map((tuple) => `${head}${tuple};`);
  });

/**
 * The files a `--minus` path names: the file itself, or every `01-seed.sql` beneath a directory.
 */
const filesOf = (target: string): readonly string[] =>
  statSync(target).isDirectory()
    ? readdirSync(target, { encoding: "utf-8", recursive: true })
        .filter((entry) => nodePath.basename(entry) === "01-seed.sql")
        .toSorted()
        .map((entry) => nodePath.join(target, entry))
    : [target];

const { values } = parseArgs({
  options: { minus: { multiple: true, type: "string" }, only: { type: "string" } },
});

const named = values.only === undefined ? undefined : values.only.split(",").map((n) => n.trim());

const declared = tables.map((table) => table.declared);

const unknown = (named ?? []).filter((name) => !declared.includes(name));

const missing = (values.minus ?? []).filter((file) => !existsSync(file));

if (unknown.length > 0 || missing.length > 0) {
  const problems = [
    ...unknown.map(
      (name) =>
        `--only names "${name}", which is no seed table; the tables are ${declared.join(", ")}`,
    ),
    ...missing.map((file) => `--minus names "${file}", which does not exist`),
  ];
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exitCode = 1;
} else {
  const subtracted: ReadonlySet<string> = new Set(
    (values.minus ?? []).flatMap((target) =>
      filesOf(target).flatMap((file) => normalize(readFileSync(file, "utf-8"))),
    ),
  );
  const shown = tables
    .filter((table) => named === undefined || named.includes(table.declared))
    .map((table) => ({
      ...table,
      kept: table.tuples.filter((tuple) => !subtracted.has(`${table.head}${tuple};`)),
    }));
  const counts = shown.map((table) => `${table.name} ${table.kept.length}`).join(", ");
  const lines = [`-- generated by scripts/seed-sql.ts; ${counts}`];

  for (const table of shown) {
    if (table.kept.length > 0) {
      for (let start = 0; start < table.kept.length; start += BATCH) {
        lines.push(`${table.head}${table.kept.slice(start, start + BATCH).join(", ")};`);
      }
    } else {
      lines.push(
        table.tuples.length === 0
          ? `-- ${table.name}: no rows in this phase`
          : `-- ${table.name}: every row is in the subtracted files`,
      );
    }
  }

  process.stdout.write(`${lines.join("\n")}\n`);
}
