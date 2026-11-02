/**
 * Prints what the composed schema costs: fields, SQL bytes and what `grizzle generate` exposes, as
 * `key: value` lines, each beside the fixed compiler ceiling it is measured against. Run with `node
 * scripts/measure.ts` from `packages/qti`; it reads the committed migrations and writes nothing.
 */
import { NodeFileSystem, NodeRuntime } from "@effect/platform-node";
import { Effect, FileSystem, Path } from "effect";
import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };
import { Qti } from "#qti/schema/qti.ts";

/**
 * The compiler's fixed ceilings (`docs/research/d8105349.md` section 22).
 */
const CEILING = {
  bindParameters: 65_535,
  fields: 10_000,
  sqlBytes: 1_048_576,
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
    "programs: none (no workloads)",
    `ceiling_fields: ${CEILING.fields}`,
    `ceiling_sql_bytes: ${CEILING.sqlBytes}`,
    `ceiling_bind_parameters: ${CEILING.bindParameters}`,
    `ceiling_variants: ${CEILING.variants}`,
    `alarm_fields: ${CEILING.fields * ALARM}`,
    `alarm_sql_bytes: ${Math.round(CEILING.sqlBytes * ALARM)} (800 KiB, per compiled program)`,
    ...alarm("fields", fields, CEILING.fields),
  ];

  yield* Effect.sync(() => {
    process.stdout.write(`${lines.join("\n")}\n`);
  });
});

NodeRuntime.runMain(main.pipe(Effect.provide(NodeFileSystem.layer), Effect.provide(Path.layer)));
