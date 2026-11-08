import path from "node:path";
import { Effect, FileSystem } from "effect";

/**
 * The folder of the Qti schema's committed migrations, one subfolder per migration.
 */
export const qtiMigrations = path.resolve(import.meta.dirname, "..", "..", "migrations", "qti");

/**
 * One SQL file of a migration: the migration's folder name, the file's name, and its text.
 */
export interface MigrationFile {
  readonly file: string;
  readonly folder: string;
  readonly sql: string;
}

/**
 * The family of a residual law, read from its name: a reverse `alternatives` side, a
 * selected-source containment (`…_in_…`), a capacity, a conditional mirror, or none of these.
 */
export type LawFamily = "alternatives" | "capacity" | "mirror" | "other" | "selectedSource";

/**
 * The kind of an installed function: a law's trigger function; a roster's `live` set, the bits of
 * its live handles that its bits domain admits (no arguments, a `bit varying`, `…_live_…`); a
 * closed side's constant (no arguments, a `bit varying`); a roster's names constant (no arguments,
 * a `name[]`); a closed relation's payload of open-typed values (no arguments, any other array); a
 * roster's decode function (`<roster>_name`, a `text`); or another, which today is grizzle's own
 * runtime.
 */
export type FunctionKind = "constant" | "decode" | "law" | "live" | "names" | "other" | "payload";

/**
 * What a schema's migrations create, counted from their SQL: the objects each representation
 * choice costs.
 *
 * The counts add up the `CREATE` and `INSERT` statements of every migration, so they describe the
 * installed schema while every migration only adds, which holds for one `_init` folder. Statements
 * are read as grizzle prints them: one per line start, in the `qti` schema, but a function's head,
 * which a `DO` block's `EXECUTE` may hold, and an `INSERT INTO`, counted wherever it stands.
 */
export interface Census {
  readonly domains: {
    /**
     * The `bit(n)` domains, one per roster whose sets a field holds.
     */
    readonly bits: number;
    /**
     * Distinct definitions, with the constraint's name left out.
     */
    readonly distinct: number;
    /**
     * UTF-8 bytes of the definitions that repeat one printed before them.
     */
    readonly repeatedBytes: number;
    readonly total: number;
  };
  readonly enums: number;
  readonly foreignKeys: {
    /**
     * The keys over a family's hidden columns (`__pred_…`, `__copy_…`, `__index_…`,
     * `__predecessor_…`, `__before_…`, `__after_…`), each family's axes, by the table that holds
     * them.
     */
    readonly axes: Readonly<Record<string, number>>;
    /**
     * The keys each table holds, by its SQL name.
     */
    readonly byTable: Readonly<Record<string, number>>;
    /**
     * Keys over more than one column.
     */
    readonly composite: number;
    readonly total: number;
    /**
     * The most columns one key spans, 0 with no key.
     */
    readonly widest: number;
  };
  /**
   * The installed functions of each kind.
   */
  readonly functions: Readonly<Record<FunctionKind, number>>;
  readonly laws: {
    /**
     * The residual laws of each family.
     */
    readonly byFamily: Readonly<Record<LawFamily, number>>;
    readonly constraintTriggers: number;
    /**
     * The residual laws, one per `-- Validate law` header.
     */
    readonly total: number;
    /**
     * The `-validate.sql` files, one per law.
     */
    readonly validateFiles: number;
  };
  readonly policies: {
    /**
     * Policies that are `USING (true) WITH CHECK (true)`, which narrow nothing.
     */
    readonly alwaysTrue: number;
    readonly total: number;
  };
  readonly seed: {
    /**
     * The `(parent, child)` pairs `admission` lists, and those it lists in every schema version.
     */
    readonly admission: { readonly inEveryVersion: number; readonly pairs: number };
    /**
     * The migration folders that are a seed (`…_seed`).
     */
    readonly folders: number;
    /**
     * Every `INSERT INTO`, wherever a migration's text holds one.
     */
    readonly inserts: number;
    /**
     * The rows inserted into each relation, keyed by its SQL name.
     */
    readonly rows: Readonly<Record<string, number>>;
  };
  readonly tables: {
    /**
     * The tables with each number of columns, as `CREATE TABLE` declares them.
     */
    readonly byColumns: Readonly<Record<number, number>>;
    /**
     * `declared_*` marker tables.
     */
    readonly declaredMarkers: number;
    /**
     * `*_lexical` and `*_spelling` tables.
     */
    readonly lexicalOrSpelling: number;
    /**
     * Two-column tables with a `value` column: an optional value of its owner.
     */
    readonly optionalValues: number;
    /**
     * The schema's tables; grizzle's own `__`-prefixed bookkeeping table is not one.
     */
    readonly total: number;
  };
  readonly uniques: {
    /**
     * Unique constraints whose columns strictly contain another unique's of the same table.
     */
    readonly superkeys: number;
    /**
     * Primary keys and unique constraints declared in `CREATE TABLE`.
     */
    readonly total: number;
  };
  readonly views: number;
}

/**
 * A `CREATE TABLE` in the `qti` schema: its name and the body between its parentheses.
 */
const tablePattern = /^CREATE TABLE "qti"\."(?<name>[a-z0-9_]+)" \((?<body>[\s\S]*?)\n\);/gmu;

/**
 * A column line of a table's body.
 */
const columnPattern = /^\s+"(?<column>[a-z0-9_]+)" /gmu;

/**
 * A primary key or unique constraint of a table's body, with its column list.
 */
const uniquePattern = /(?:PRIMARY KEY|UNIQUE) \((?<columns>[^)]*)\)/gu;

/**
 * A named foreign key, with its referencing column list.
 */
const foreignKeyPattern = /CONSTRAINT "[^"]+" FOREIGN KEY \((?<columns>[^)]*)\)/gu;

/**
 * A foreign key added to a `qti` table, with the table and its referencing column list.
 */
const addedForeignKeyPattern =
  /^ALTER TABLE "qti"\."(?<table>[a-z0-9_]+)" ADD CONSTRAINT "[^"]+" FOREIGN KEY \((?<columns>[^)]*)\)/gmu;

/**
 * A family's hidden column, which grizzle fills on every write: its axes' keys hold one.
 */
const familyColumnPattern = /"__(?:pred|copy|index|predecessor|before|after)_/u;

/**
 * The header line grizzle opens each validate file with, naming its law.
 */
const lawPattern = /^-- Validate law (?<law>__[a-z0-9_]+):/gmu;

/**
 * The name patterns of the law families, tried in order; a law matching none is `other`.
 */
const lawFamilies: readonly (readonly [LawFamily, RegExp])[] = [
  ["alternatives", /_alternatives_/u],
  ["selectedSource", /_in_/u],
  ["capacity", /capacity|_within_|_count_/u],
  ["mirror", /mirror/u],
];

/**
 * A function's head: its name, its parameter list, and its return type up to the first clause that
 * follows it. A head is read wherever it stands, since a closed relation's constant is created by
 * an `EXECUTE` inside the `DO` block that packs it.
 */
const functionPattern =
  /(?<![\w"])CREATE (?:OR REPLACE )?FUNCTION "qti"\."(?<name>[^"]+)"\((?<parameters>[^)]*)\) RETURNS (?<returns>.+?)(?=\s+(?:AS|BEGIN|IMMUTABLE|LANGUAGE|PARALLEL|RETURN|SECURITY|SET|STABLE|STRICT|VOLATILE)\b|$)/gmu;

/**
 * A function's head, with its return type unqualified and unquoted (`"pg_catalog"."trigger"` reads
 * `trigger`).
 */
interface FunctionHead {
  readonly name: string;
  readonly parameters: string;
  readonly returns: string;
}

/**
 * The tests of the function kinds, tried in order; a function passing none is `other`.
 *
 * Erasure installs a closed side as a zero-argument IMMUTABLE function returning its cells as a
 * `bit varying` (PostgreSQL also spells it `varbit`), and a roster's names as a zero-argument
 * `name[]` that its `<roster>_name(int2)` decode function subscripts.
 */
const functionKinds: readonly (readonly [FunctionKind, (head: FunctionHead) => boolean])[] = [
  ["law", (head) => head.name.startsWith("__law_")],
  [
    "live",
    (head) =>
      head.parameters === "" &&
      head.name.includes("_live_") &&
      (head.returns === "bit varying" || head.returns === "varbit"),
  ],
  [
    "constant",
    (head) =>
      head.parameters === "" && (head.returns === "bit varying" || head.returns === "varbit"),
  ],
  ["names", (head) => head.parameters === "" && head.returns === "name[]"],
  ["payload", (head) => head.parameters === "" && head.returns.endsWith("[]")],
  ["decode", (head) => head.name.endsWith("_name") && head.returns === "text"],
];

/**
 * A one-line `CREATE DOMAIN` in the `qti` schema, with its definition after `AS`.
 */
const domainPattern = /^CREATE DOMAIN "qti"\."[a-z0-9_]+" AS (?<definition>.*)$/gmu;

/**
 * A `CREATE POLICY` statement, up to its terminating semicolon.
 */
const policyPattern = /^CREATE POLICY [^;]*;/gmu;

/**
 * A one-line `INSERT … VALUES` into a `qti` relation, with the relation's name and the value list.
 */
const insertPattern =
  /^INSERT INTO "qti"\."(?<relation>[a-z0-9_]+)" \([^)]*\) VALUES (?<values>.*);$/gmu;

/**
 * An `admission` row as the seed prints it, among the others of its value list: version, parent
 * kind, child kind.
 */
const admissionPattern =
  /\('(?<version>[^']*)'::"qti"\."schema_version", '(?<parent>[^']*)'::"qti"\."node_kind", '(?<child>[^']*)'::"qti"\."node_kind"\)/gu;

/**
 * Count the matches of `pattern` in `sql`.
 *
 * @param sql - The text to search.
 * @param pattern - A global pattern.
 * @returns How many times it matches.
 */
const occurrences = (sql: string, pattern: RegExp): number => [...sql.matchAll(pattern)].length;

/**
 * Count the members of `values` equal to `value`.
 *
 * @param values - The values to count among.
 * @param value - The value to count.
 * @returns How many members equal it.
 */
const tally = <T>(values: readonly T[], value: T): number =>
  values.filter((candidate) => candidate === value).length;

/**
 * Count each distinct value's members, keyed and ordered by the value.
 *
 * @param values - The values.
 * @returns How many members each value has, its keys sorted.
 */
const tallyBy = (values: readonly string[]): Readonly<Record<string, number>> => {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Object.fromEntries([...counts].toSorted(([a], [b]) => (a < b ? -1 : 1)));
};

/**
 * Split an `INSERT`'s value list into its row tuples.
 *
 * A parenthesis inside a string literal does not count: a quote toggles the literal, so a doubled
 * quote, SQL's escape for one, leaves it open.
 *
 * @param values - The text after `VALUES`, without the terminating semicolon.
 * @returns Each top-level parenthesized tuple, parentheses included, in order.
 */
const tuplesIn = (values: string): readonly string[] => {
  const tuples: string[] = [];
  let depth = 0;
  let quoted = false;
  let start = 0;

  for (const { 0: mark, index } of values.matchAll(/['()]/gu)) {
    if (mark === "'") {
      quoted = !quoted;
    } else if (!quoted && mark === "(") {
      if (depth === 0) {
        start = index;
      }

      depth += 1;
    } else if (!quoted) {
      depth -= 1;

      if (depth === 0) {
        tuples.push(values.slice(start, index + 1));
      }
    }
  }

  return tuples;
};

/**
 * Count the tables of the schema in `sql`: by column count, by the shapes that only carry another
 * table's markers or values, and their unique constraints.
 *
 * @param sql - Every migration's text, joined.
 * @returns The table and unique counts of the census.
 */
const countTables = (sql: string): Pick<Census, "tables" | "uniques"> => {
  const tables = [...sql.matchAll(tablePattern)]
    .map(({ groups }) => ({ body: groups?.["body"] ?? "", name: groups?.["name"] ?? "" }))
    .filter((table) => !table.name.startsWith("__"))
    .map((table) => ({
      columns: [...table.body.matchAll(columnPattern)].map(
        ({ groups }) => groups?.["column"] ?? "",
      ),
      name: table.name,
      uniques: [...table.body.matchAll(uniquePattern)].map(({ groups }) =>
        (groups?.["columns"] ?? "").replaceAll('"', "").split(", "),
      ),
    }));
  const byColumns = new Map<number, number>();

  for (const table of tables) {
    byColumns.set(table.columns.length, (byColumns.get(table.columns.length) ?? 0) + 1);
  }

  const superkeys = tables.flatMap((table) =>
    table.uniques.filter((unique) =>
      table.uniques.some(
        (other) =>
          other !== unique &&
          other.length < unique.length &&
          other.every((column) => unique.includes(column)),
      ),
    ),
  );

  return {
    tables: {
      byColumns: Object.fromEntries([...byColumns].toSorted(([a], [b]) => a - b)),
      declaredMarkers: tables.filter((table) => table.name.startsWith("declared_")).length,
      lexicalOrSpelling: tables.filter((table) => /(?:lexical|spelling)$/u.test(table.name)).length,
      optionalValues: tables.filter(
        (table) => table.columns.length === 2 && table.columns.includes("value"),
      ).length,
      total: tables.length,
    },
    uniques: {
      superkeys: superkeys.length,
      total: tables.flatMap((table) => table.uniques).length,
    },
  };
};

/**
 * Count the rows each `INSERT` adds, and the `(parent, child)` pairs of `admission`'s rows.
 *
 * @param sql - Every migration's text, joined.
 * @returns The insert and row counts of the census's seed part.
 */
const countRows = (sql: string): Omit<Census["seed"], "folders"> => {
  const rows = new Map<string, number>();
  const versionsOf = new Map<string, Set<string>>();
  const versions = new Set<string>();

  for (const { groups } of sql.matchAll(insertPattern)) {
    const relation = groups?.["relation"] ?? "";
    const values = groups?.["values"] ?? "";

    rows.set(relation, (rows.get(relation) ?? 0) + tuplesIn(values).length);

    if (relation === "admission") {
      for (const { groups: admitted } of values.matchAll(admissionPattern)) {
        const version = admitted?.["version"] ?? "";
        const pair = `${admitted?.["parent"] ?? ""} ${admitted?.["child"] ?? ""}`;

        versions.add(version);
        versionsOf.set(pair, (versionsOf.get(pair) ?? new Set()).add(version));
      }
    }
  }

  return {
    admission: {
      inEveryVersion: [...versionsOf.values()].filter((held) => held.size === versions.size).length,
      pairs: versionsOf.size,
    },
    inserts: occurrences(sql, /\bINSERT\s+INTO\b/giu),
    rows: Object.fromEntries([...rows].toSorted(([a], [b]) => (a < b ? -1 : 1))),
  };
};

/**
 * Take the census of a schema's migrations.
 *
 * @param files - Every SQL file of every migration folder.
 * @returns What those migrations create.
 */
export const census = (files: readonly MigrationFile[]): Census => {
  const sql = files.map((file) => file.sql).join("\n");
  const laws = [...sql.matchAll(lawPattern)].map(({ groups }) => groups?.["law"] ?? "");
  const families = laws.map(
    (law) => lawFamilies.find(([, pattern]) => pattern.test(law))?.[0] ?? "other",
  );
  const kinds = [...sql.matchAll(functionPattern)]
    .map(({ groups }) => ({
      name: groups?.["name"] ?? "",
      parameters: groups?.["parameters"] ?? "",
      returns: (groups?.["returns"] ?? "").replaceAll('"pg_catalog".', "").replaceAll('"', ""),
    }))
    .map((head) => functionKinds.find(([, test]) => test(head))?.[0] ?? "other");
  const definitions = [...sql.matchAll(domainPattern)].map(({ groups }) =>
    (groups?.["definition"] ?? "").replaceAll(/CONSTRAINT "[^"]*"/gu, ""),
  );
  const firsts = new Set(definitions);
  const encoder = new TextEncoder();
  const keys = [...sql.matchAll(foreignKeyPattern)].map(
    ({ groups }) => (groups?.["columns"] ?? "").split(",").length,
  );
  const added = [...sql.matchAll(addedForeignKeyPattern)].map(({ groups }) => ({
    columns: groups?.["columns"] ?? "",
    table: groups?.["table"] ?? "",
  }));
  const policies = [...sql.matchAll(policyPattern)].map(([statement]) => statement);

  return {
    domains: {
      bits: definitions.filter((definition) => definition.startsWith("bit(")).length,
      distinct: firsts.size,
      repeatedBytes:
        encoder.encode(definitions.join("")).length - encoder.encode([...firsts].join("")).length,
      total: definitions.length,
    },
    enums: occurrences(sql, /^CREATE TYPE "qti"\."[^"]+" AS ENUM /gmu),
    foreignKeys: {
      axes: tallyBy(
        added.filter(({ columns }) => familyColumnPattern.test(columns)).map(({ table }) => table),
      ),
      byTable: tallyBy(added.map(({ table }) => table)),
      composite: keys.filter((columns) => columns > 1).length,
      total: keys.length,
      widest: Math.max(0, ...keys),
    },
    functions: {
      constant: tally(kinds, "constant"),
      decode: tally(kinds, "decode"),
      law: tally(kinds, "law"),
      live: tally(kinds, "live"),
      names: tally(kinds, "names"),
      other: tally(kinds, "other"),
      payload: tally(kinds, "payload"),
    },
    laws: {
      byFamily: {
        alternatives: tally(families, "alternatives"),
        capacity: tally(families, "capacity"),
        mirror: tally(families, "mirror"),
        other: tally(families, "other"),
        selectedSource: tally(families, "selectedSource"),
      },
      constraintTriggers: occurrences(sql, /^CREATE CONSTRAINT TRIGGER /gmu),
      total: laws.length,
      validateFiles: files.filter((file) => file.file.endsWith("-validate.sql")).length,
    },
    policies: {
      alwaysTrue: policies.filter((policy) =>
        /USING \(true\)\s+WITH CHECK \(true\);$/u.test(policy),
      ).length,
      total: policies.length,
    },
    seed: {
      ...countRows(sql),
      folders: new Set(
        files.map((file) => file.folder).filter((folder) => folder.endsWith("_seed")),
      ).size,
    },
    ...countTables(sql),
    views: occurrences(sql, /^CREATE (?:OR REPLACE )?VIEW /gmu),
  };
};

/**
 * Read every SQL file of the migration folders under `root`, then take their census.
 *
 * @param root - A schema's migration folder, such as {@link qtiMigrations}.
 * @returns What its migrations create.
 */
export const censusOf = Effect.fn("test.census.read")(function* censusOf(root: string) {
  const fs = yield* FileSystem.FileSystem;
  const relatives = yield* fs.glob("*/*.sql", { root });
  const files = yield* Effect.all(
    relatives.map((relative) =>
      fs.readFileString(path.join(root, relative)).pipe(
        Effect.map((sql) => ({
          file: path.basename(relative),
          folder: path.dirname(relative),
          sql,
        })),
      ),
    ),
  );

  return census(files);
});
