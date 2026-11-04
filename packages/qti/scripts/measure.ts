/**
 * Prints what the composed schema costs: fields, SQL bytes and what `grizzle generate` exposes, as
 * `key: value` lines, each beside the fixed compiler ceiling it is measured against. Run with `node
 * scripts/measure.ts` from `packages/qti`; it reads the committed migrations and writes nothing.
 *
 * With `--programs` it also compiles the author application's programs, which needs the lease
 * database `GR8DES_PG_DATABASE` names: each export query of the workload, and the import as one
 * `ChangeSet` with a member for each relation the author writes, in growing prefixes of the roster.
 * grizzle exposes no size of a compiled program, so the script reads what each compilation's budget
 * meter was charged, and a prefix whose compilation is refused prints the refusal's own figure.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeFileSystem, NodeRuntime } from "@effect/platform-node";
import { Effect, FileSystem, Layer, Path } from "effect";
import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { documentIdsOf, nodeQueries, treeOf } from "#qti/export/queries.ts";
import type { LooseQuery } from "#qti/export/queries.ts";
import { NodeKind } from "#qti/schema/node.ts";
import { Qti } from "#qti/schema/qti.ts";
import { Package } from "#qti/schema/package.ts";
import { Author } from "#qti/schema/roles.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { BUDGETS, SQL_BYTES_CEILING, measure, watchMeters } from "#qti/test/meter.ts";
import type { Budget, Measured } from "#qti/test/meter.ts";

/**
 * The compiler's fixed ceilings (`docs/research/d8105349.md` section 22).
 */
const CEILING = {
  bindParameters: 65_535,
  fields: 10_000,
  sqlBytes: SQL_BYTES_CEILING,
  variants: 64,
} as const;

/**
 * Fraction of a ceiling at which a measured number raises an alarm line.
 */
const ALARM = 0.8;

const MIGRATIONS = "migrations/qti";

interface Statement {
  readonly columns?: readonly unknown[];
  readonly kind: string;
}

interface SnapshotObject {
  readonly ddl: readonly Statement[];
  readonly kind: string;
}

// SAFETY: the JSON import types `ddl` as a union of the literal shapes in the file; `manifest.objects`
// is the snapshot's object list, and only these two fields are read.
const objects = snapshot.manifest.objects as readonly SnapshotObject[];

const tables = objects.filter((object) => object.kind === "table");

let fields = 0;

for (const table of tables) {
  for (const statement of table.ddl) {
    if (statement.kind === "createTable") {
      fields += statement.columns?.length ?? 0;
    }
  }
}

const relationsDeclared = Object.values(Qti.relations).filter(
  (member) => "fields" in member,
).length;

/**
 * The alarm line for a measured number against its ceiling, or nothing below 80 percent.
 */
const alarm = (name: string, measured: number, ceiling: number): readonly string[] =>
  measured >= ceiling * ALARM
    ? [`alarm: ${name} ${measured} is at least 80 percent of ${ceiling} (${ceiling * ALARM})`]
    : [];

/**
 * Whether the run compiles the author application's programs, which needs the lease database.
 */
const programsMode = process.argv.includes("--programs");

/**
 * The ceiling of each budget, by the name grizzle's meter gives it.
 */
const LIMIT: Readonly<Record<Budget, number>> = {
  fields: CEILING.fields,
  nodes: CEILING.fields,
  params: CEILING.bindParameters,
  sqlBytes: CEILING.sqlBytes,
  variants: CEILING.variants,
};

/**
 * One `ChangeSet` with a member for each of the relations the author writes from `from` up to but
 * not including `to`, each an empty array, so what compiles is the program of an import that takes
 * the rows of each relation as a parameter. The first relation of the roster is always the first
 * member, as in `changeSetOf`.
 */
const importChanges = (from: number, to: number) => {
  let changes = ChangeSet.empty(Author).insert(Package, []);
  const members: readonly AnyRelation[] = Author.write
    .slice(from, to)
    .map((name) => Author.relations[name]);
  for (const relation of members.filter((member) => member !== Package)) {
    // SAFETY: the same erased insert as `changeSetOf`: the member is the relation's own name and an empty array, and `insert` reads no more at run time.
    changes = changes.insert(
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
      relation as typeof Package,
      [],
    );
  }

  return changes;
};

/**
 * A program the script compiles: an export query, or the import `ChangeSet`.
 */
type Program = typeof documentIdsOf | LooseQuery | ReturnType<typeof importChanges>;

/**
 * The relation prefixes of the import `ChangeSet` the script compiles whole, ending with every
 * relation the author writes: the sizes at which the compilation is refused.
 */
const IMPORT_PREFIXES = [100, 200, 400, Author.write.length] as const;

/**
 * How many relations one slice of the import holds when the slices are compiled and summed.
 */
const IMPORT_SLICE = 100;

/**
 * Arms the goal's milestone table adds after M1 that it counts: M2's MathML elements (193) and SSML
 * elements (12), part B and part E. M3 adds its expression and rule arms (64 expressions, six
 * response, six outcome and six template rules, part D) to other relations, counted as the same
 * kind of arm. The table gives M4 and M5 no arm count, so they add none here.
 */
const MILESTONE_ARMS = [
  ["M2", 193 + 12],
  ["M3", 64 + 18],
  ["M4", 0],
  ["M5", 0],
] as const;

/**
 * One measured program as a line: its name, whether it compiled, and what each budget was charged
 * against its ceiling.
 */
const programLine = (name: string, measured: Measured): string => {
  const charges = BUDGETS.map(
    (budget) => `${budget} ${measured.charged[budget]}/${LIMIT[budget]}`,
  ).join(" ");
  const state = measured.refusal === undefined ? "compiled" : "refused";

  return `${name}: ${state} ${charges}${measured.refusal === undefined ? "" : ` (${measured.refusal})`}`;
};

/**
 * The lines of the programs mode: each export query as the author application compiles it, the
 * import in growing relation prefixes, and the extrapolation to the arms the goal's later
 * milestones add.
 */
const programLines = Effect.gen(function* programLinesOf() {
  const meters = yield* watchMeters;
  const db = yield* Db.open(AuthorApp.roles.author, {});
  const compile = (program: Program) =>
    Effect.scoped(
      // SAFETY: `db.compile` is generic over the program's type, which the run-time view of the export builder and a `ChangeSet` built in a loop cannot state; it reads the value, whose type is not read.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
      db.compile(program as never),
    ).pipe(Effect.asVoid);
  const lines: string[] = [];

  const exports: readonly (readonly [string, Program])[] = [
    ["documentIdsOf", documentIdsOf],
    ["treeOf", treeOf],
    ...nodeQueries.map((nodeQuery, run) => [`nodeQuery${run}`, nodeQuery] as const),
  ];
  const exported: Record<Budget, number> = {
    fields: 0,
    nodes: 0,
    params: 0,
    sqlBytes: 0,
    variants: 0,
  };
  const largest: Record<Budget, number> = {
    fields: 0,
    nodes: 0,
    params: 0,
    sqlBytes: 0,
    variants: 0,
  };
  for (const [name, program] of exports) {
    const measured = yield* measure(compile, meters, program);
    lines.push(programLine(`program_export ${name}`, measured));
    for (const budget of BUDGETS) {
      lines.push(...alarm(`${name} ${budget}`, measured.charged[budget], LIMIT[budget]));
      exported[budget] += measured.charged[budget];
      largest[budget] = Math.max(largest[budget], measured.charged[budget]);
    }
  }

  for (const count of IMPORT_PREFIXES) {
    lines.push(
      programLine(
        `program_import first ${count} relations`,
        yield* measure(compile, meters, importChanges(0, count)),
      ),
    );
  }

  // A refused compilation reports only the charge that crossed the ceiling, so the whole import is
  // measured as slices that each compile, and the slices' charges are summed. Each slice also holds
  // the `Package` member and the program's fixed cost, which the whole import holds once, so the cost
  // of a slice with no other relation is taken off for each slice past the first.
  const base = yield* measure(compile, meters, importChanges(0, 0));
  const total: Record<Budget, number> = {
    fields: 0,
    nodes: 0,
    params: 0,
    sqlBytes: 0,
    variants: 0,
  };
  let slices = 0;
  for (let from = 0; from < Author.write.length; from += IMPORT_SLICE) {
    const slice = yield* measure(compile, meters, importChanges(from, from + IMPORT_SLICE));
    slices += 1;
    if (slice.refusal !== undefined) {
      lines.push(programLine(`program_import slice ${from}`, slice));
    }

    for (const budget of BUDGETS) {
      total[budget] += slice.charged[budget] - (slices > 1 ? base.charged[budget] : 0);
    }
  }
  lines.push(
    `program_import all ${Author.write.length} relations as ${slices} slices of ${IMPORT_SLICE} (the Package-only program of ${base.charged.sqlBytes} bytes taken off for each slice past the first), charges summed: ${BUDGETS.map((budget) => `${budget} ${total[budget]}/${LIMIT[budget]}`).join(" ")}`,
  );

  const arms = NodeKind.handles.length;
  lines.push(
    `extrapolation_assumption: ${arms} Node arms and ${Author.write.length} relations measured; linear in arms with all of the import's cost attributed to arms, an upper estimate; arms added ${MILESTONE_ARMS.map(([milestone, added]) => `${milestone} ${added}`).join(", ")}`,
  );
  for (const budget of BUDGETS) {
    const perArm = total[budget] / arms;
    let projected = total[budget];
    for (const [milestone, added] of MILESTONE_ARMS) {
      projected += perArm * added;
      lines.push(
        `extrapolated_import ${budget} through ${milestone}: ${Math.round(projected)} of ${LIMIT[budget]}`,
      );
    }
  }

  // The export reads a run of attachments at a time, so a program stays the size of its run and the
  // roster's growth adds programs: the programs of the sum below, and their largest, are the cost.
  lines.push(
    `export_programs: ${exports.length} programs, charges summed ${BUDGETS.map((budget) => `${budget} ${exported[budget]}`).join(" ")}; largest ${BUDGETS.map((budget) => `${budget} ${largest[budget]}`).join(" ")}`,
  );
  let programs = exports.length;
  for (const [milestone, added] of MILESTONE_ARMS) {
    programs += Math.ceil(((exports.length - 2) * added) / arms);
    lines.push(
      `extrapolated_export programs through ${milestone}: ${programs} programs, each no larger than the largest above while a run holds the same attachments`,
    );
  }

  return lines;
}).pipe(Effect.scoped);

const main = Effect.gen(function* main() {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const root = path.resolve(import.meta.dirname, "..", MIGRATIONS);

  const folders = (yield* fs.readDirectory(root)).toSorted();
  const perFolder: (readonly [string, number])[] = [];
  for (const folder of folders) {
    const directory = path.join(root, folder);
    if ((yield* fs.stat(directory)).type !== "Directory") {
      continue;
    }

    let bytes = 0;
    for (const file of (yield* fs.readDirectory(directory)).filter((name) =>
      name.endsWith(".sql"),
    )) {
      bytes += (yield* fs.readFile(path.join(directory, file))).byteLength;
    }
    perFolder.push([folder, bytes]);
  }
  let sqlBytesTotal = 0;
  for (const [, bytes] of perFolder) {
    sqlBytesTotal += bytes;
  }

  const lines = [
    `tables: ${tables.length}`,
    `fields: ${fields} (ceiling ${CEILING.fields} per schema and per compilation)`,
    `enums: ${objects.filter((object) => object.kind === "enum").length}`,
    `relations_declared: ${relationsDeclared}`,
    `sql_bytes_total: ${sqlBytesTotal} (migration bytes, a measurement beside the per-compilation ceiling ${CEILING.sqlBytes}, not against it)`,
    ...perFolder.map(([folder, bytes]) => `sql_bytes_per_folder: ${folder} ${bytes}`),
    `access_paths: ${snapshot.accessPaths.length}`,
    `programs: ${programsMode ? "compiled below" : "not measured (run with --programs on a lease)"}`,
    `ceiling_fields: ${CEILING.fields}`,
    `ceiling_sql_bytes: ${CEILING.sqlBytes}`,
    `ceiling_bind_parameters: ${CEILING.bindParameters}`,
    `ceiling_variants: ${CEILING.variants}`,
    `alarm_fields: ${CEILING.fields * ALARM}`,
    `alarm_sql_bytes: ${Math.round(CEILING.sqlBytes * ALARM)} (800 KiB, per compiled program)`,
    ...alarm("fields", fields, CEILING.fields),
    ...(programsMode ? yield* programLines : []),
  ];

  yield* Effect.sync(() => {
    process.stdout.write(`${lines.join("\n")}\n`);
  });
});

NodeRuntime.runMain(
  main.pipe(Effect.provide(Layer.mergeAll(NodeFileSystem.layer, Path.layer, AuthorAppLayer))),
);
