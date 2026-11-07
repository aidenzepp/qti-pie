/**
 * Both sides of every `mirrors` the schema states, held over the rows the import writes for every
 * shape of assembled document: a test, a section, an item an include places into, a fragment, and
 * a fragment of response rules (spec readings 5 and 117). Each side's rows are read from the
 * program's own keyed sets, its selection evaluated on the host from the predicate grizzle keeps
 * for it (`#pantry/test/key-copies.ts` `mirrorsOf`), and each side's projection must be the
 * other's, as the two foreign keys a `mirrors` installs require.
 *
 * Every assembled document has a `TestDocument` row, since its instances need one, but only a test
 * or a section owns test references, so `ReferenceDocument` mirrors the test-rooted ones alone. The
 * every-relation package holds each shape once, and the law oracle accepts it.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Option, Predicate, Schema } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { mirrorsOf } from "#pantry/test/key-copies.ts";
import type { Datum, MirrorSide } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/locate.ts";

/**
 * A row as the host judges it: its fields' values, each a datum of `#pantry/test/key-copies.ts`.
 */
type Row = Readonly<Record<string, Datum>>;

/**
 * Whether a value is a datum the host judges: a text, a natural, a truth value or a set of handles.
 *
 * @param value - The value.
 * @returns Whether it is a datum.
 */
const isDatum = (value: unknown): value is Datum =>
  Predicate.isString(value) ||
  Predicate.isBigInt(value) ||
  Predicate.isBoolean(value) ||
  (value instanceof Set && [...value].every(Predicate.isString));

/**
 * A written row's fields, each read as a datum or not at all.
 */
const WrittenRow = Schema.Record(Schema.String, Schema.Unknown);

/**
 * A relation's written rows, keyed by the text of their key.
 */
const WrittenMap = Schema.ReadonlyMap(Schema.String, WrittenRow);

/**
 * One written row as the boundary reads it.
 */
type Written = typeof WrittenRow.Type;

/**
 * Read a row's data fields, the rest left out.
 *
 * @param row - The row as the import writes it.
 * @param fields - The fields a side reads.
 * @returns The row's value at each field, none where a field is no datum there (a nested tree, a
 *   field grizzle draws).
 */
const fieldsOf = (row: Written, fields: readonly string[]): Option.Option<Row> => {
  const read: Record<string, Datum> = {};
  for (const field of fields) {
    const value = row[field];
    if (!isDatum(value)) {
      return Option.none();
    }

    read[field] = value;
  }

  return Option.some(read);
};

/**
 * One side's projection over a program's rows: each selected row's values at the side's fields, as
 * a tuple's text; none where a row holds no datum at a field the side reads or its selection
 * reads, so the host cannot judge the side.
 *
 * @param rows - The side's relation's rows.
 * @param side - The side.
 * @param read - The fields the selection reads beside the side's own.
 * @returns The projection's tuples.
 */
const projectionOf = (
  rows: readonly Written[],
  side: MirrorSide,
  read: readonly string[],
): Option.Option<ReadonlySet<string>> => {
  const tuples = new Set<string>();
  for (const row of rows) {
    const held = fieldsOf(row, [...new Set([...side.fields, ...read])]);
    if (Option.isNone(held)) {
      return Option.none();
    }

    if (side.selects(held.value)) {
      tuples.add(Formatter.format(side.fields.map((field) => held.value[field])));
    }
  }

  return Option.some(tuples);
};

/**
 * The fields of a row a side's selection may read: every field of the row's relation as the program
 * writes it.
 *
 * @param rows - The relation's rows.
 * @returns The fields of its first row.
 */
const writtenFields = (rows: readonly Written[]): readonly string[] => {
  const [first] = rows;

  return first === undefined ? [] : Object.keys(first);
};

/**
 * The roots of the assembled documents the package must hold: a test, a section, an item, a
 * fragment of content and a fragment of response rules.
 */
const rootKinds = [
  "qti-assessment-test",
  "qti-assessment-section",
  "qti-assessment-item",
  "div",
  "qti-response-condition",
] as const;

layer(NodeServices.layer, { excludeTestServices: true })(
  "every mirrors over every assembled document",
  (it) => {
    it.effect(
      "holds both sides of every mirrors the host can judge over the every-relation package's rows, ReferenceDocument's among them, and refuses ReferenceDocument mirrored with every TestDocument",
      () =>
        // Oracle: the specification as a checker: the two foreign keys a mirrors installs, each a
        // containment of one side's selected projection in the other's, over the rows the import
        // writes, and the law oracle's verdict on the package.
        // Bound: the every-relation package, whose assembled documents are a test, a section, two
        // items with includes, a fragment and a rules fragment, and every mirrors of Qti.
        Effect.scoped(
          Effect.gen(function* mirrorsHold() {
            const dir = yield* scopedPackage(
              everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }),
            );
            const verdict = yield* oracleVerdict(yield* readPackage(dir));
            const program = yield* readProgram(dir);
            const tables = new Map(
              Object.entries(program.inputs).map(([relation, rows]) => [
                relation,
                [
                  ...Option.getOrElse(
                    Schema.decodeUnknownOption(WrittenMap)(rows),
                    () => new Map<string, Written>(),
                  ).values(),
                ],
              ]),
            );
            const rowsOf = (relation: string): readonly Written[] => tables.get(relation) ?? [];
            const roots = new Set(rowsOf("TestDocument").map((row) => row["rootKind"]));
            const judged: string[] = [];

            assert.deepStrictEqual(verdict, { kind: "accepted" });
            assert.deepStrictEqual(
              rootKinds.filter((kind) => !roots.has(kind)),
              [],
              "an assembled document's root the package lacks",
            );
            for (const [left, right] of mirrorsOf(Qti.statements)) {
              const leftRows = rowsOf(left.relation);
              const rightRows = rowsOf(right.relation);
              const leftTuples = left.pred
                ? Option.none<ReadonlySet<string>>()
                : projectionOf(leftRows, left, writtenFields(leftRows));
              const rightTuples = right.pred
                ? Option.none<ReadonlySet<string>>()
                : projectionOf(rightRows, right, writtenFields(rightRows));
              if (
                Option.isNone(leftTuples) ||
                Option.isNone(rightTuples) ||
                leftRows.length + rightRows.length === 0
              ) {
                continue;
              }

              const held = leftTuples.value;
              const mirrored = rightTuples.value;
              const name = `${left.relation}(${left.fields.join(", ")}) and ${right.relation}(${right.fields.join(", ")})`;
              judged.push(name);
              assert.deepStrictEqual(
                [...held].filter((tuple) => !mirrored.has(tuple)),
                [],
                `${name}: a ${left.relation} row ${right.relation} lacks`,
              );
              assert.deepStrictEqual(
                [...mirrored].filter((tuple) => !held.has(tuple)),
                [],
                `${name}: a ${right.relation} row ${left.relation} lacks`,
              );
            }

            assert.include(
              judged,
              "ReferenceDocument(document) and TestDocument(node)",
              "ReferenceDocument's mirror went unjudged",
            );

            // The planted unrestricted reverse: every assembled document a ReferenceDocument, as
            // the mirror stated before reading 117's assemblies, is refused by these rows.
            const references = new Set(
              rowsOf("ReferenceDocument").map((row) => Formatter.format([row["document"]])),
            );
            assert.isNotEmpty(
              rowsOf("TestDocument").filter(
                (row) => !references.has(Formatter.format([row["node"]])),
              ),
              "every assembled document is a ReferenceDocument",
            );
          }),
        ),
      600_000,
    );
  },
);
